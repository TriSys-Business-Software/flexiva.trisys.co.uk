var CandidateRegistration =
{
    SocialNetworkCredentials: null,

    Load: function()
    {
        TriSysWebJobs.CandidateRegistration.LoadContactTitleLookup("txtCandidateRegistrationTitle");
        TriSysWebJobs.CandidateRegistration.LoadCityFromGeoLocation("txtCandidateRegistrationCity");
        TriSysWebJobs.CandidateRegistration.LoadCountryLookup("txtCandidateRegistrationCountry");
        TriSysWebJobs.CandidateRegistration.LoadContactPhotoWidgets("CandidateRegistrationContactPhoto", "imgCandidateRegistrationEditor");
        TriSysWebJobs.CandidateRegistration.LoadCVFileRefWidget("txtCandidateRegistrationCVFileRef", false, true);

        // Setup social login buttons
        CandidateRegistration.Social.AddEventHandlers();

        // We may be hiding social buttons
		TriSysWebJobs.Frame.ApplyDynamicFeaturesAndStyleAfterFormLoaded();

		// Some customers want their own stuff
		CandidateRegistration.JobTitleSelectionMode();
		CandidateRegistration.PrinciplesOfEngagement();
    }, 
    
    PostCodelookup: function()
    {
        var sPrefix = "txtCandidateRegistration";
        TriSysSDK.PostCode.Lookup(sPrefix + "PostCode", sPrefix + "Street",
                                    sPrefix + "City", sPrefix + "County", sPrefix + "Country");
    },

    SubmitButtonClick: function()
    {
        var sTitle = TriSysSDK.CShowForm.GetTextFromCombo('txtCandidateRegistrationTitle');
        var sForenames = $('#txtCandidateRegistrationForenames').val();
        var sSurname = $('#txtCandidateRegistrationSurname').val();
        var sPassword = $('#txtCandidateRegistrationPassword').val();
        var sVerifyPassword = $('#txtCandidateRegistrationPasswordConfirmation').val();
        var sEMail = $('#txtCandidateRegistrationEMail').val();
        var sJobTitle = $('#txtCandidateRegistrationJobTitle').val();
        var sStreet = $('#txtCandidateRegistrationStreet').val();
        var sCity = $('#txtCandidateRegistrationCity').val();
        var sCounty = $('#txtCandidateRegistrationCounty').val();
        var sPostCode = $('#txtCandidateRegistrationPostCode').val();
        var sCountry = $('#txtCandidateRegistrationCountry').val();
        var sHomeTelNo = $('#txtCandidateRegistrationHomeTelNo').val();
        var sMobileTelNo = $('#txtCandidateRegistrationMobileTelNo').val();
        var sCVFileRef = TriSysSDK.Controls.FileReference.GetFile("txtCandidateRegistrationCVFileRef");
        var sPhoto = TriSysSDK.Controls.FileReference.GetFile("CandidateRegistrationContactPhoto");
		var bPrinciplesOfEngagementAgree = TriSysSDK.CShowForm.GetCheckBoxValue('candidateRegistration-PrinciplesOfEngagement-Agree', false); 

        // Validation rules
        var sRuleFailure = '';
        if (!sForenames) sRuleFailure += 'Please enter your forename(s)' + '<br />';
        if (!sSurname) sRuleFailure += 'Please enter your surname' + '<br />';
        if (!TriSysApex.LoginCredentials.validateEmail(sEMail)) sRuleFailure += "Please enter a valid e-mail address." + '<br />';

        var bPasswordMandatory = (!CandidateRegistration.SocialNetworkCredentials);
        if (bPasswordMandatory)
        {
            if (!sPassword)
                sRuleFailure += 'Please enter a password' + '<br />';
            else
            {
                var iMinLength = TriSysApex.Constants.iMinimumPasswordLength;
                if (sPassword.length < iMinLength)
                    sRuleFailure += 'Please enter a password with a mininum length of ' + iMinLength + ' characters' + '<br />';
            }
            if (sPassword != sVerifyPassword) sRuleFailure += 'Please confirm your password' + '<br />';
        }

        if (!sCVFileRef && TriSysWebJobs.Constants.CandidateRegistrationCVMandatory) sRuleFailure += 'Please upload a copy of your CV' + '<br />';

		var bSSR = (TriSysWebJobs.Agency.CustomerID.toLowerCase() == 'sopra-steria-recruitment');
		if (bSSR)
		{
			if(!bPrinciplesOfEngagementAgree)
				sRuleFailure += 'Please agree to our principles of engagement' + '<br />';
		}

        if (sRuleFailure.length > 0)
        {
            TriSysApex.UI.ShowMessage(sRuleFailure, TriSysWebJobs.Constants.ApplicationName);
            return;
        }

        // Validation has passed, so now call Web API to confirm registration via automated e-mail
        var sURL = TriSysWebJobs.Constants.HomePage + '/?' + TriSysWebJobs.Constants.CandidateRegistrationConfirmationForm + '/#GUID#/' + TriSysWebJobs.Agency.CustomerID;

        var CNewCandidateSignUpRequest = {
            Forenames: sForenames,
            Surname: sSurname,
            Password: sPassword,
            EMail: sEMail,
            Title: sTitle,
            JobTitle: sJobTitle,
            Street: sStreet,
            City: sCity,
            County: sCounty,
            PostCode: sPostCode,
            Country: sCountry,
            HomeTelNo: sHomeTelNo,
            MobileTelNo: sMobileTelNo,
            CVFileRef: sCVFileRef,
            Photo: sPhoto,
            URL: sURL,

            WebJobsRequest: TriSysWebJobs.Agency.WebJobsRequest(),
            SocialNetworkLoginParameters: CandidateRegistration.SocialNetworkCredentials,
            RequirementId: TriSysWebJobs.Vacancies.RequirementId
        };

        // The callback to us to allow us to focus on the login page
        var fnPostLoginRedirection = function ()
        {
            // Only store the e-mail address/password in cookies once the user confirms registration by e-mail
            // Why? Because a rogue user could sabotage existing details by not logging in on this computer

            // Open the login form
            TriSysApex.FormsManager.OpenForm(TriSysWebJobs.Constants.CandidateLoginForm, 0, true);
            return true;
        };

        // Use a copy of the original TriSys for Websites API
        TriSysWebJobs.CandidateRegistration.SubmitToServer(CNewCandidateSignUpRequest, fnPostLoginRedirection);
    },

    Social:
    {
        AddEventHandlers: function ()
		{
			// Feb 2018: Load the .js BEFORE the user control .html
			var fnLoadControlHTML = function ()
			{
				// Load the control into the DIV, change the name of all internal DIV tags to be unique and populate
				TriSysApex.FormsManager.loadControlIntoDiv('CandidateRegistration-SocialNetworkButtons', 'ctrlSocialNetworkLoginButtons.html',
					function (response, status, xhr)
					{
						// Set callback on successful login
						ctrlSocialNetworkLoginButtons.OnSuccessfulLoginFunction = CandidateRegistration.Social.SendToWebAPI;
						ctrlSocialNetworkLoginButtons.HelpLabel("You may login with any social network to populate fields below, and to login with the same details in future.");
					});
			};

			TriSysApex.WhiteLabelling.LoadJavascriptFile('js/pages/ctrlSocialNetworkLoginButtons.js', null, fnLoadControlHTML); 
        },

        // If the user has logged in with a social network, then send these details to the login Web API
        SendToWebAPI: function (provider_name, connection_token, user_token)
        {
            var CReadSocialNetworkAuthenticatedCredentialsRequest =
            {
                ProviderName: provider_name,
                ConnectionToken: connection_token,
                UserToken: user_token
            };

            TriSysWebJobs.SocialNetwork.ReadAuthenticatedCredentials(CReadSocialNetworkAuthenticatedCredentialsRequest, CandidateRegistration.Social.DisplayAuthenticatedSocialNetworkCredentials);
        },

        DisplayAuthenticatedSocialNetworkCredentials: function (CReadSocialNetworkAuthenticatedCredentialsResponse)
        {
            CandidateRegistration.SocialNetworkCredentials = CReadSocialNetworkAuthenticatedCredentialsResponse;
            var socialData = CandidateRegistration.SocialNetworkCredentials;

            if (socialData.Forenames)
                $('#txtCandidateRegistrationForenames').val(socialData.Forenames);
            if (socialData.Surname)
                $('#txtCandidateRegistrationSurname').val(socialData.Surname);
            if (socialData.EMail)
                $('#txtCandidateRegistrationEMail').val(socialData.EMail);

            if (socialData.OrgJobTitle)
                $('#txtCandidateRegistrationJobTitle').val(socialData.OrgJobTitle);

            if (socialData.CurrentLocation)
            {
                var parts = socialData.CurrentLocation.split(', ');
                if(parts)
                {
                    if(parts.length == 2)
                    {
                        $('#txtCandidateRegistrationCity').val(parts[0]);
                        TriSysSDK.CShowForm.SetTextInCombo('txtCandidateRegistrationCountry', parts[1]);
                    }
                }
            }

            $('#trisys-social-network-social-button').show();
            var sClass = CandidateRegistration.Social.GetSocialImage(socialData.ProviderName);
            $('#trisys-social-network-logo').removeClass();
            $('#trisys-social-network-logo').addClass(sClass);
            $('#trisys-social-network-name').html(socialData.ProviderName);
            $('#trisys-social-network-fullname').html(socialData.FullName ? socialData.FullName : socialData.Forenames + ' ' + socialData.Surname);
            $('#trisys-social-network-profile').html(socialData.ProfileURL);

            var sPhoto = TriSysApex.Constants.DefaultContactGreyImage;
            if (socialData.PhotoURL)
                sPhoto = socialData.PhotoURL;
            
            $('#trisys-social-network-photo').attr('src', sPhoto);

            if (socialData.PhotoURL)
            {
                // This is more complicated than you think :-(
                // We have to send the URL to our server to get a server side URL which we can then reference on update
                CandidateRegistration.EspeciallyComplicatedFileUploadManagement(sPhoto);                
            }
        },

        GetSocialImage: function (sProviderName)
        {
            switch(sProviderName.toLowerCase())
            {
                case 'windows live':
                    return 'fa fa-windows';
                default:
                    return 'fa fa-' + sProviderName.toLowerCase();
            }
        }
    },

    EspeciallyComplicatedFileUploadManagement: function (sFileURL)
    {
        var fnCallback = function (sLocalFile)
        {
            var sPhoto = sLocalFile;
            var photoWidget = $('#imgCandidateRegistrationEditor');
            photoWidget.attr('src', sPhoto);
            photoWidget.show();

            TriSysSDK.Controls.FileReference.SetFile('CandidateRegistrationContactPhoto', sPhoto);
        };

        // UploadFileURL: function (sFileURL, sFileName, bShowWait, fnCallback)
        TriSysSDK.FileUpload.UploadFileURL(sFileURL, 'registration-photo.jpg', false,
            'CandidateRegistrationContactPhoto', 'imgCandidateRegistrationEditor' );
	},

	// 04 March 2018 - job title can only be chosen
	JobTitleSelectionMode: function ()
	{
		var bJobTitleSelectionMode = false;

		var bManeGroup = (TriSysWebJobs.Agency.CustomerID.toLowerCase() == 'Mane-Group'.toLowerCase());
		if (bManeGroup)
			bJobTitleSelectionMode = true;

		if (bJobTitleSelectionMode)
		{
			// Cannot type into text box
			$('#txtCandidateRegistrationJobTitle').attr('readonly', 'readonly');

			// Button visible
			$('#tr-CandidateRegistrationJobTitle').show();
		}
	},

	JobTitleLookup: function ()
	{
		var sJobTitleField = 'txtCandidateRegistrationJobTitle';
		var sJobTitle = null;	// TriSysSDK.CShowForm.GetJobTitleFromField(sJobTitleField); job title is read-only
		TriSysSDK.JobTitle.Lookup(sJobTitle, sJobTitleField);
	},

	// 28 March 2019 - SSR want principles of engagement
	PrinciplesOfEngagement: function()
	{
		var bSSR = (TriSysWebJobs.Agency.CustomerID.toLowerCase() == 'sopra-steria-recruitment');
		if (bSSR)
		{
			// Make this visible
			$('#candidateRegistration-PrinciplesOfEngagement-block').show();
		}
	}
};

$(document).ready(function ()
{
    CandidateRegistration.Load();
});
