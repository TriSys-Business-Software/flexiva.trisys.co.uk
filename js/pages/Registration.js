var Registration =
{
    SocialNetworkCredentials: null,
	CompanyEntityName: 'Company',

    Load: function ()
    {
        TriSysSDK.Titles.LoadCombo("txtRegistrationTitle");
        TriSysWebJobs.CandidateRegistration.LoadCityFromGeoLocation("txtRegistrationCity");
        TriSysWebJobs.CandidateRegistration.LoadCountryLookup("txtRegistrationCountry");

		// Consider phones
		var bPhone = TriSysApex.Device.isPhone();
		if(bPhone)
		{
			$('#registration-title').html('Start your Subscription');
		}

        // Setup social login buttons
        Registration.Social.AddEventHandlers();

        try
        {
            // If the link includes the hashtag 'customer', we must have a known customer
            var sCustomerPrefix = '#customer~';
            if (window.location.hash && window.location.hash.indexOf(sCustomerPrefix) >= 0)
            {
                var parts = window.location.hash.split(sCustomerPrefix);
                if (parts.length == 2)
                {
                    var sGUID = parts[1];
                    // This is a known customer, so get the e-mail from the Web API and commence registration process
                    Registration.PreRegistrationVisualsForExistingCustomer(sGUID);
                }
            }

			// If the link includes the 'plan', we need to feed the chosen plan through to the provisioning system to allow correct 
			// default payment plan to be selected
			Registration.GetPlanFromURL();
        }
        catch (err)
        {
            alert(err);
        }

		// Resourcer
		if(TriSysApex.Resourcer.isResourcerWebSite())
		{
			$('#registration-title').html('Sign-Up as a Candidate Resourcer');			// Specific sign-up to this
			$('#trisys-registration-form-prices-button-block').hide();					// No prices on a free plan
			$('#registration-company-block-title').html('Your Account Address');		// Company address in CRM
			$('#registration-company-block-company-name').hide();						// No company field as this is for freelancer/gig workers
			$('#registration-company-block-switchboard-telno').hide();					// No switchboard number for freelancer/gig workers
			$('#btn-register-free-trial').text('Submit Resourcer Registration');		// Explicit submit button
		}
    },

	// When this URL is invoked from https://www.trisys.co.uk/pricing
	// If the link includes the 'plan', we need to feed the chosen plan through to the provisioning system to allow correct 
	// default payment plan to be selected
	GetPlanFromURL: function()
	{
		var sURL = window.location.href;
        var sPlanPrefix = 'plan~';
        if (sURL.indexOf(sPlanPrefix) >= 0)
        {
            var parts = sURL.split(sPlanPrefix);
            if (parts.length == 2)
            {
                var sPlan = parts[1];
                $('#registration-plan').html(sPlan);
				var elemTitle = $('#registration-title');
				var sTitle = elemTitle.text() + " to the <strong>" + sPlan.replace(/-/g, ' ') + "</strong> plan";
				elemTitle.html(sTitle);

				// Additional business rules
				var bPlatformixGroupware = sPlan.toLowerCase() === "Platformix-Groupware".toLowerCase();
				if(bPlatformixGroupware)
				{
					Registration.CompanyEntityName = "Group";
					$('#registration-company-block-title').text("Your " + Registration.CompanyEntityName + " Information");
					$('#lblCompanyName').text(Registration.CompanyEntityName + " Name");
				}
            }
        }
	},

    PostCodelookup: function ()
    {
        var sPrefix = "txtRegistration";
        TriSysSDK.PostCode.Lookup(sPrefix + "PostCode", sPrefix + "Street",
                                    sPrefix + "City", sPrefix + "County", sPrefix + "Country");
    },

    ShowTermsAndConditions: function()
    {
        TriSysApex.ModalDialogue.TermsAndConditions.Show();
    },

    ShowPrivacyPolicy: function ()
    {
        TriSysApex.ModalDialogue.PrivacyPolicy.Show();
    },

    ShowPrices: function()
    {
        var sURL = "https://irp.cdn-website.com/f3b4d364/files/uploaded/Apex-Pricing-2021.pdf" + TriSysApex.FormsManager.pageURLTimestampArgumentsToForceNoCache();
        TriSysApex.ModalDialogue.DocumentViewer.Show(TriSysApex.Copyright.ShortProductName + " Prices", sURL);
    },

    SubmitButtonClick: function ()
    {
		var sTitle = TriSysSDK.CShowForm.GetTextFromCombo('txtRegistrationTitle');
        var sForenames = $('#txtRegistrationForenames').val();
        var sSurname = $('#txtRegistrationSurname').val();
        var sPassword = $('#txtRegistrationPassword').val();
        var sVerifyPassword = $('#txtRegistrationPasswordConfirmation').val();
        var sEMail = $('#txtRegistrationEMail').val();
        var sCompany = $('#txtRegistrationCompany').val();
        var sJobTitle = $('#txtRegistrationJobTitle').val();
        var sStreet = $('#txtRegistrationStreet').val();
        var sCity = $('#txtRegistrationCity').val();
        var sCounty = $('#txtRegistrationCounty').val();
        var sPostCode = $('#txtRegistrationPostCode').val();
        var sCountry = $('#txtRegistrationCountry').val();
        var sWorkTelNo = $('#txtRegistrationWorkTelNo').val();
        var sMobileTelNo = $('#txtRegistrationMobileTelNo').val();
        var sSwitchboardTelNo = $('#txtRegistrationCompanyTelNo').val();
        var bAgreeToTermsAndConditions = TriSysApex.UI.CheckBoxFieldValueToBoolean('chkSignUp_Agree');
        var bAgreeToPrivacyPolicy = TriSysApex.UI.CheckBoxFieldValueToBoolean('chkSignUp_AgreeToPrivacyPolicy');
		var sPlan = $('#registration-plan').html();

        // Validation rules
        var sFullName = sForenames + ' ' + sSurname;
        var bPasswordMandatory = (!Registration.SocialNetworkCredentials);
        //var bValidate = TriSysApex.LoginCredentials.ValidateSignUp(sFullName, sCompany, sEMail,
        //                                    sWorkTelNo, sStreet, sCity, sCounty, sPostCode, sCountry, sPassword, sVerifyPassword,
        //                                    bAgree, bAgreeToPrivacyPolicy, bPasswordMandatory);
		var lstErrors = [];

		// Keep validation here, where it belongs!
		var iMinFullNameChars = 5;
        var iMinCompanyNameChars = 3;

        // Prefill defaults
        if (!sCompany && TriSysApex.Resourcer.isResourcerWebSite())
            sCompany = 'Unknown';
        if (!sCountry)
            sCountry = TriSysSDK.Countries.DefaultCountryName;

		if (!sCounty)
		{
			// If address is a major city, there is no county e.g. London
			sCounty = "-";
		}

        if (!TriSysApex.LoginCredentials.validateEmail(sEMail))
            lstErrors.push({Message:  'E-Mail address must be completed.', ID: '#txtRegistrationEMail' });
        if (bPasswordMandatory && (!sPassword || sPassword.length < TriSysApex.Constants.iMinimumPasswordLength))
            lstErrors.push({Message:  'Password must be at least ' + TriSysApex.Constants.iMinimumPasswordLength + ' characters.', ID: '#txtRegistrationPassword' });
        if (bPasswordMandatory && (sPassword != sVerifyPassword))
            lstErrors.push({Message:  'Passwords must match.', ID: '#txtRegistrationPasswordConfirmation' });
        if (bPasswordMandatory && sPassword)
		{
			if(sPassword.indexOf("--") >= 0)
				lstErrors.push({Message:  'Passwords must not include \'--\' as this pattern is used in SQL injection attacks.', ID: '#txtRegistrationPasswordConfirmation' });
			if(sPassword.indexOf('""') >= 0)
				lstErrors.push({Message:  'Passwords must not include consecutive " characters.', ID: '#txtRegistrationPasswordConfirmation' });
		}
        if (!sFullName || sFullName.length < iMinFullNameChars)
            lstErrors.push({Message: 'Full name must be at least ' + iMinFullNameChars + ' characters.', ID: '#txtRegistrationForenames' });
        if (sFullName &&  sFullName.indexOf(' ') <= 0)
            lstErrors.push({Message: 'Full name must include a forename and a surname, separated by a space.', ID: '#txtRegistrationSurname' });
        if (!sWorkTelNo)
            lstErrors.push({ Message: 'Work Telephone number must be completed.', ID: '#txtRegistrationWorkTelNo' });

        // 12 Jul 2024: Resourcer does not require a company name
        if (!TriSysApex.Resourcer.isResourcerWebSite())
        {
            if (!sCompany || sCompany.length < iMinCompanyNameChars)
                lstErrors.push({ Message: Registration.CompanyEntityName + ' name must be at least ' + iMinCompanyNameChars + ' characters.', ID: '#txtRegistrationCompany' });
            if (sCompany && sCompany.toLowerCase() == 'unknown')
                lstErrors.push({ Message: Registration.CompanyEntityName + ' name cannot be unknown.', ID: '#txtRegistrationCompany' });
        }
        if (!sStreet)
            lstErrors.push({Message:  'Street address is required.', ID: '#txtRegistrationStreet' });
        if (!sCity)
            lstErrors.push({Message:  'City/Town is required.', ID: '#txtRegistrationCity' });
        if (!sCounty)
            lstErrors.push({Message:  'County/State is required.', ID: '#txtRegistrationCounty' });
        if (!sPostCode)
            lstErrors.push({Message:  'Post/Zip Code is required.', ID: '#txtRegistrationPostCode' });
        if (!sCountry)
            lstErrors.push({Message:  'Country is required.', ID: '#txtRegistrationCountry' });
        if (!bAgreeToTermsAndConditions)
            lstErrors.push({Message:  'You must agree to our terms and conditions.', ID: '#registration-terms-group' });
        if (!bAgreeToPrivacyPolicy)
            lstErrors.push({Message:  'You must agree to our privacy policy.', ID: '#registration-privacy-group' });

        if (lstErrors.length > 0)
        {
            TriSysApex.TourGuide.ShowFormErrorsAsATourGuide(TriSysApex.Copyright.ShortProductName + " Sign-Up Validation Error" + (lstErrors.length == 1 ? "" : "s"), lstErrors);
            return;
        }


        // Prefill defaults
        if (!sCompany || sCompany == "Unknown")
		{
			// If no company, use the contact full name
            sCompany = TriSysApex.Resourcer.isResourcerWebSite() ? sFullName.replace(/ /g, '') : 'Unknown';
		}
        if (!sCountry)
            sCountry = TriSysSDK.Countries.DefaultCountryName;


        if (!TriSysPhoneGap.isConnectedToComms(true, "register"))
            return false;


        // Passed minimum credentials, so start sign-up...

		var sTypeOfRequest = TriSysApex.Resourcer.isResourcerWebSite() ? 'Resourcer' : 'Trial';

        // Enough Web API fields to create contact, company and address
        var dataPacket = {
            Title: sTitle,
            FullName: sFullName,
            Company: sCompany,
            EMail: sEMail,
            TelNo: sWorkTelNo,
            Street: sStreet,
            City: sCity,
            County: sCounty,
            PostCode: sPostCode,
            Country: sCountry,
            Password: sPassword,
            TypeOfRequest: sTypeOfRequest,
            MobileTelNo: sMobileTelNo,
            SwitchboardTelNo: sSwitchboardTelNo,
            JobTitle: sJobTitle,
			Plan: sPlan,

            SocialNetworkLoginParameters: Registration.SocialNetworkCredentials
        };

        var fnSuccess = function (CNewCustomerSignUpResponse)
        {
            Registration.PostRegistrationVisuals(CNewCustomerSignUpResponse);
            return true;
        };

        // Make call to web service to harvest the details and return when complete
        TriSysApex.LoginCredentials.SignUpRequest(dataPacket, fnSuccess);
    },

    PreRegistrationVisualsForExistingCustomer: function (sGUID)
    {
        $('#trisys-registration-form-data-entry-block').hide();
        $('#trisys-registration-form-existing-customer-data-entry-block').show();
        $('#trisys-registration-form-post-signup-block').hide();
		$('#trisys-registration-form-post-resourcer-signup-block').hide();


        // Capture enter key on password field
        $('#txtRegistrationExistingEMail').keyup(function (e)
        {
            if (e.keyCode == 13)
            {
                //alert($('#txtLoginPassword').val());
                Registration.ExistingSubmitButtonClick();
            }
        });

        if (sGUID)
        {
            // Go and get the e-mail address, or pre-fill the field?
            $('#txtRegistrationExistingEMail').val(sGUID);
            $('#txtRegistrationExistingEMail').attr('readonly', 'readonly');
        }
    },

    PostRegistrationVisuals: function (CNewCustomerSignUpResponse)
    {
        $('#trisys-registration-form-data-entry-block').hide();
        $('#trisys-registration-form-existing-customer-data-entry-block').hide();
		$('#registration-description').html("Thank you for supplying your details.");

		if(TriSysApex.Resourcer.isResourcerWebSite())
		{
			// This needs e-mail confirmation before proceeding to commission back-end services
			$('#trisys-registration-form-post-resourcer-signup-block').show();
			return;
		}
		else
		{
		    // 14 Apr 2023: ApexError where CNewCustomerSignUpResponse is null
		    try {
		        if (!CNewCustomerSignUpResponse.CapturePayment)
		        {
		            var sPre = "#trisys-registration-form-post-signup-block-p";
		            $(sPre + "1").hide();
		            $(sPre + "2").hide();
		            $(sPre + "3").hide();
		            $(sPre + "4").show();
		        }
		    } catch (e) {

		    }
		    
			$('#trisys-registration-form-post-signup-block').show();
		}
		

		// Now if the CNewCustomerSignUpResponse.GUID is set, this is our cue to request
		// payment immediately without waiting for the user to click the link in the e-mail
		if(CNewCustomerSignUpResponse)
		{
			if(CNewCustomerSignUpResponse.GUID)
			{
				// Get the activation details prior to conducting an auto-login procedure
				// This is normally done in login.js using the #customer~ hash
				var sGUID = CNewCustomerSignUpResponse.GUID;

				var payloadObject = {};

				var ConfirmCustomerRegistrationRequest = { GUID: sGUID };

				payloadObject.URL = "Users/ConfirmCustomerRegistrationRequest";

				payloadObject.OutboundDataPacket = ConfirmCustomerRegistrationRequest;

				payloadObject.InboundDataFunction = function (ConfirmCustomerRegistrationResponse)
				{
					TriSysApex.UI.HideWait();

					if (ConfirmCustomerRegistrationResponse)
					{
						var bSuccess = ConfirmCustomerRegistrationResponse.Success;
						if (!bSuccess && ConfirmCustomerRegistrationResponse.ErrorMessage.indexOf("Activation code expired or not found") >= 0)
						{
							// Get out of here!
							return;
						}
						if (bSuccess)
						{
							// Show the payment dialogue right here, right now
							Registration.CommencePaymentCaptureAfterConfirmingRegistration(sGUID, ConfirmCustomerRegistrationResponse);
							return;
						}
						else
							TriSysApex.UI.ShowMessage(ConfirmCustomerRegistrationResponse.ErrorMessage);
					}
				};

				payloadObject.ErrorHandlerFunction = function (request, status, error)
				{
					TriSysApex.UI.HideWait();
					TriSysApex.UI.errorAlert('Registration.PostRegistrationVisuals: ' + status + ": " + error + ". responseText: " + request.responseText);
				};

				TriSysApex.UI.ShowWait(null, "Confirming Registration...");
				TriSysAPI.Data.PostToWebAPI(payloadObject);
			}
		}
    },

	// Capture payment from customer after they have confirmed their e-mail address
	// 2018: We then allowed provisioning with payment and no e-mail confirmation
	// 2020: We now allow people to create a database without payment
	CommencePaymentCaptureAfterConfirmingRegistration: function(sGUID, ConfirmCustomerRegistrationResponse)
	{
		var parametersObject = new TriSysApex.UI.ShowMessageParameters();

        parametersObject.Title = "Create Your Account";
        parametersObject.Image = "gi-database_plus";
        parametersObject.Maximize = true;
        parametersObject.CloseTopRightButton = true;

        parametersObject.ContentURL = TriSysApex.CustomFormsAndComponents.UserControlPath("ctrlPaymentGateway.html");

		// Feed in the payment URL when loaded
		parametersObject.OnLoadCallback = function ()
        {
			var bTargetParent = true;
			var options = { FreePlan: !ConfirmCustomerRegistrationResponse.CapturePayment };
            ctrlPaymentGateway.Load(sGUID, ConfirmCustomerRegistrationResponse, bTargetParent, options);
        };

        // Buttons
        parametersObject.ButtonLeftVisible = true;
        parametersObject.ButtonLeftText = "Cancel";
        parametersObject.ButtonLeftFunction = function ()
        {
            return true;
        };
        
        TriSysApex.UI.PopupMessage(parametersObject);
	},

    ExistingSubmitButtonClick: function()
    {
        var sTitle = "Sign-Up";

        var sEMail = $('#txtRegistrationExistingEMail').val();
        if (!TriSysApex.LoginCredentials.validateEmail(sEMail))
        {
            TriSysApex.UI.ShowMessage("Please enter a valid e-mail address.", sTitle);
            return;
        }

        var bAgree = TriSysApex.UI.CheckBoxFieldValueToBoolean('chkExisting_Agree');
        if (!bAgree)
        {
            TriSysApex.UI.ShowMessage("Please agree to our terms and conditions.", sTitle);
            return;
        }

        var bAgreeToPrivacyPolicy = TriSysApex.UI.CheckBoxFieldValueToBoolean('chkExisting_AgreeToPrivacyPolicy');
        if (!bAgreeToPrivacyPolicy)
        {
            TriSysApex.UI.ShowMessage("Please agree to our privacy policy.", sTitle);
            return;
        }

		// Pre 29 Oct  2018, this was the free trial mechanism, which is now a subscription model only
        //TriSysApex.LoginCredentials.RegisterExistingCustomerForFreeTrial(sEMail);
		Registration.Subscription.RegisterExistingCustomer(sEMail);
    },

    Social:
    {
        AddEventHandlers: function ()
        {
            if (!TriSysPhoneGap.isConnectedToComms() || TriSysPhoneGap.Enabled())
            {
                // Social buttons do not work without internet or on phone gap
                $('#trisys-registration-form-social-row').hide();
                return;
            }

			// Feb 2018: Load the .js BEFORE the user control .html
			var fnLoadControlHTML = function ()
			{
				// Load the control into the DIV, change the name of all internal DIV tags to be unique and populate
				TriSysApex.FormsManager.loadControlIntoDiv('Registration-SocialNetworkButtons', 'ctrlSocialNetworkLoginButtons.html',
					function (response, status, xhr)
					{
						// Set callback on successful login
						ctrlSocialNetworkLoginButtons.OnSuccessfulLoginFunction = Registration.Social.SendToWebAPI;
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

            TriSysWebJobs.SocialNetwork.ReadAuthenticatedCredentials(CReadSocialNetworkAuthenticatedCredentialsRequest, Registration.Social.DisplayAuthenticatedSocialNetworkCredentials);
        },

        DisplayAuthenticatedSocialNetworkCredentials: function (CReadSocialNetworkAuthenticatedCredentialsResponse)
        {
            Registration.SocialNetworkCredentials = CReadSocialNetworkAuthenticatedCredentialsResponse;
            var socialData = Registration.SocialNetworkCredentials;

            $('#trisys-social-network-instructions').hide();

            if (socialData.Forenames)
                $('#txtRegistrationForenames').val(socialData.Forenames);
            if (socialData.Surname)
                $('#txtRegistrationSurname').val(socialData.Surname);
            if (socialData.EMail)
                $('#txtRegistrationEMail').val(socialData.EMail);

            if (socialData.OrgCompany)
                $('#txtRegistrationCompany').val(socialData.OrgCompany);

            if (socialData.OrgJobTitle)
                $('#txtRegistrationJobTitle').val(socialData.OrgJobTitle);

            if (socialData.CurrentLocation)
            {
                var parts = socialData.CurrentLocation.split(', ');
                if (parts)
                {
                    if (parts.length == 2)
                    {
                        $('#txtRegistrationCity').val(parts[0]);
                        TriSysSDK.CShowForm.SetTextInCombo('txtRegistrationCountry', parts[1]);
                    }
                }
            }

            $('#trisys-social-network-social-button').show();
            var sClass = Registration.Social.GetSocialImage(socialData.ProviderName);
            $('#trisys-social-network-logo').removeClass();
            $('#trisys-social-network-logo').addClass(sClass);
            $('#trisys-social-network-name').html(socialData.ProviderName);
            $('#trisys-social-network-fullname').html(socialData.FullName ? socialData.FullName : socialData.Forenames + ' ' + socialData.Surname);
            $('#trisys-social-network-profile').html(socialData.ProfileURL);

            var sPhoto = TriSysApex.Constants.DefaultContactGreyImage;
            if (socialData.PhotoURL)
                sPhoto = socialData.PhotoURL;

            $('#trisys-social-network-photo').attr('src', sPhoto);
        },

        GetSocialImage: function (sProviderName)
        {
            switch (sProviderName.toLowerCase())
            {
                case 'windows live':
                    return 'fa fa-windows';
                default:
                    return 'fa fa-' + sProviderName.toLowerCase();
            }
        }
    },

	Subscription:
	{
		RegisterExistingCustomer: function(sEMail)
		{
			// TODO
			TriSysApex.UI.ShowMessage("Registration.Subscription.RegisterExistingCustomer");
		}
	}
};

$(document).ready(function ()
{
    Registration.Load();
});
