var CandidateEditAccount =
{
    Load: function()
	{
        TriSysWebJobs.CandidateRegistration.LoadContactTitleLookup("txtEditCandidateTitle");
        TriSysWebJobs.CandidateRegistration.LoadCountryLookup("txtEditCandidateCountry");
        TriSysWebJobs.CandidateRegistration.LoadContactPhotoWidgets("EditCandidateContactPhoto", "imgEditCandidateEditor");
        TriSysWebJobs.CandidateRegistration.LoadCVFileRefWidget("txtEditCandidateCVFileRef", false, true);

        TriSysSDK.CShowForm.contactTypeOfWorkField('cmbEditCandidateTypeOfWorkRequired');
        TriSysSDK.CShowForm.datePicker('dtEditCandidateAvailability');
        CandidateEditAccount.NoticePeriod();
        CandidateEditAccount.JobAlertFrequency();

        TriSysSDK.Controls.CurrencyAmountPeriod.PopulateCurrencyAmountPeriodWidget('capEditCandidateCurrentRemuneration', 500, "Annum");
        TriSysSDK.Controls.CurrencyAmountPeriod.PopulateCurrencyAmountPeriodWidget('capEditCandidateRequiredRemunerationPermanent', 500, "Annum");
        TriSysSDK.Controls.CurrencyAmountPeriod.PopulateCurrencyAmountPeriodWidget('capEditCandidateRequiredRemunerationContract', 0.5, "Hour");

        var fOnJobTitleFilter = function (e)
        {
            if (!e)
                return;

            var filter = e.filter;

            if (!filter)
                return;

            CandidateEditAccount._JobTitleFilterText = filter.value;
        };
        var fOnLocationFilter = function (e)
        {
            if (!e)
                return;
            var filter = e.filter;

            if (!filter)
                return;

            CandidateEditAccount._LocationFilterText = filter.value;
        };

        TriSysSDK.CShowForm.populateMultiSelectComboFromDataSource('cmbEditCandidateJobTitleWorkPreference', null, null, fOnJobTitleFilter);
        TriSysSDK.CShowForm.populateMultiSelectComboFromDataSource('cmbEditCandidateLocationWorkPreference', null, null, fOnLocationFilter);

        
        // Load the currently logged in candidate details into the fields. 
        var fnPopulate = function (candidate)
        {
            TriSysSDK.CShowForm.SetTextInCombo("txtEditCandidateTitle", candidate.Title);
            $('#txtEditCandidateForenames').val(candidate.Forenames);
            $('#txtEditCandidateSurname').val(candidate.Surname);
            $('#txtEditCandidateJobTitle').val(candidate.JobTitle);
            $('#txtEditCandidateMobileTelNo').val(candidate.MobileTelNo);

            $('#txtEditCandidateEMail').val(candidate.PersonalEMail);

            if (candidate.Street)
            {
                var sStreet = candidate.Street.replace(/, /g, '\n');
                $('#txtEditCandidateStreet').val(sStreet);
            }
            $('#txtEditCandidateCity').val(candidate.City);
            $('#txtEditCandidateCounty').val(candidate.County);
            $('#txtEditCandidatePostCode').val(candidate.PostCode);
            if (candidate.Country)
                TriSysSDK.CShowForm.SetTextInCombo('txtEditCandidateCountry', candidate.Country);
            $('#txtEditCandidateHomeTelNo').val(candidate.HomeTelNo);

            if (candidate.ContactPhoto)
            {
                var photoWidget = $('#imgEditCandidateEditor');
                photoWidget.attr('src', candidate.ContactPhoto);
                photoWidget.show();
            }

			// GDPR May 2018
			if (candidate.GDPRSettings)
			{
				//var sDateRegistered = moment(candidate.GDPRSettings).format("dddd DD MMMM YYYY");
				//var sLastUpdated = moment(candidate.GDPRSettings).format("dddd DD MMMM YYYY");
				//$('#EditProfile-DateRegistered').html(sDateRegistered);
				//$('#EditProfile-LastUpdated').html(sLastUpdated);

				TriSysSDK.CShowForm.SetCheckBoxValue('CandidateEditAccount-AgreeToReceiveMarketingCommunications', candidate.GDPRSettings.AgreeToMarketingCommunications);
				TriSysSDK.CShowForm.SetCheckBoxValue('CandidateEditAccount-AgreeToPrivacyPolicy', candidate.GDPRSettings.AgreeToPrivacyPolicy);
				TriSysSDK.CShowForm.SetCheckBoxValue('CandidateEditAccount-RestrictProcessing', candidate.GDPRSettings.GDPRRestrictDataProcessing);

				if (candidate.GDPRSettings.GDPRDeletionRequestReceived)
				{
					// A deletion request was previously received so replace button with date
					CandidateEditAccount.RemovalRequested(candidate.GDPRSettings.DateGDPRDeletionRequestReceived);
				}

				if (candidate.GDPRSettings.GDPRDataPortabilityRequestReceived)
				{
					// A portability request was previously received so replace button with date
					CandidateEditAccount.PortabilityRequestReceived(candidate.GDPRSettings.DateGDPRDataPortabilityRequestReceived);
				}

				// TriSys CRM only
				//if (candidate.GDPRSettings.isServicableCustomerAccount) {
				//	// This is a current customer who cannot request a removal of their account, or restrict processing
				//	$('#CandidateEditAccount-RequestRemovalButton').attr("disabled", true);
				//	$('#CandidateEditAccount-RestrictProcessing').attr("disabled", true);
				//}
			}
        };

        TriSysWebJobs.ContactUs.LoadLoggedInUserDetails(fnPopulate, true);

        // Get all other important WebJobs candidate profile stuff such as job alerts and preferences
        CandidateEditAccount.ReadJobPreferences();

        // We may have custom styles
		TriSysWebJobs.Frame.ApplyDynamicFeaturesAndStyleAfterFormLoaded();

		// Some customers want job titles to be selected rather than entered
		CandidateEditAccount.JobTitleSelectionMode();

		// Tweak little 'info' circle to make it look nice too ;-)
		setTimeout(CandidateEditAccount.TweakLittleQuestionMarks, 100);

		// Of course some customer always want their own bits!
		CandidateEditAccount.CustomerSpecificEnhancements();
    },

    NoticePeriod: function()
    {
        TriSysSDK.CShowForm.skillCombo('txtEditCandidateNoticePeriod', 'NoticePeriod', '4 Weeks');
    },

    JobAlertFrequency: function()
    {
        var sourceFrequencies = [
            { text: 'Hourly', value: 0 },            
            { text: 'Daily', value: 1 },              
            { text: 'Weekly', value: 2 },            // Default - index = 2
            { text: 'Fortnightly', value: 3 },  
            { text: 'Monthly', value: 4 },         
            { text: 'Never', value: 5 }               
        ];
        
        TriSysSDK.CShowForm.populateComboFromDataSource('txtEditCandidateJobAlertSummaryFrequency', sourceFrequencies, 2);
    },
       
    ReadJobPreferences: function()
    {
        var payloadObject = {};

        payloadObject.URL = 'Contact/ReadLoggedInCandidateProfile';
        payloadObject.OutboundDataPacket = null;
        payloadObject.InboundDataFunction = function (CReadLoggedInCandidateProfileResponse)
        {
            if (CReadLoggedInCandidateProfileResponse)
            {
                if (CReadLoggedInCandidateProfileResponse.Success)
                {
                    var candidate = CReadLoggedInCandidateProfileResponse.Candidate;

                    CandidateEditAccount.DisplayJobPreferences(candidate);
                }
            }
        };

        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    // This is a CContact object
    DisplayJobPreferences: function(candidate)
    {
        TriSysSDK.Controls.FileReference.SetFile('txtEditCandidateCVFileRef', candidate.CVFileRef);
        TriSysSDK.Controls.FileReference.SetFile('EditCandidateContactPhoto', candidate.ContactPhoto);

        if(candidate.TypeOfWorkRequired)
            TriSysSDK.CShowForm.SetSkillsInList("cmbEditCandidateTypeOfWorkRequired", candidate.TypeOfWorkRequired);

        if (candidate.AvailabilityDate)
            TriSysSDK.CShowForm.setDatePickerValue('dtEditCandidateAvailability', candidate.AvailabilityDate);

        if (candidate.CurrentRemuneration)
            TriSysSDK.Controls.CurrencyAmountPeriod.SetCurrencyAmountPeriod('capEditCandidateCurrentRemuneration', candidate.CurrentRemuneration);

        if (candidate.RequiredRemunerationContract)
            TriSysSDK.Controls.CurrencyAmountPeriod.SetCurrencyAmountPeriod('capEditCandidateRequiredRemunerationContract', candidate.RequiredRemunerationContract);

        if (candidate.RequiredRemunerationPermanent)
            TriSysSDK.Controls.CurrencyAmountPeriod.SetCurrencyAmountPeriod('capEditCandidateRequiredRemunerationPermanent', candidate.RequiredRemunerationPermanent);

        $('#txtEditCandidateTwitter').val(candidate.Twitter);
        $('#txtEditCandidateLinkedIn').val(candidate.LinkedIn);
        $('#txtEditCandidateFacebook').val(candidate.Facebook);
        $('#txtEditCandidateYouTube').val(candidate.YouTube);
        $('#txtEditCandidateSkype').val(candidate.Skype);

        TriSysSDK.CShowForm.SetCheckBoxValue('chkEditCandidateLookingForWork', candidate.LookingForWork);
        TriSysSDK.CShowForm.SetCheckBoxValue('chkEditCandidateCarOwner', candidate.CarOwner);
        TriSysSDK.CShowForm.SetCheckBoxValue('chkEditCandidateLiveJobAlerts', candidate.LiveJobAlertsOn);
        TriSysSDK.CShowForm.SetCheckBoxValue('chkEditCandidateJobAlertSummary', candidate.SummaryJobAlertsOn);

        if (candidate.NoticePeriod)
            TriSysSDK.CShowForm.SetValueInCombo('txtEditCandidateNoticePeriod', candidate.NoticePeriod);

        if (candidate.SummaryFrequency >= 0)
            TriSysSDK.CShowForm.SetValueInCombo('txtEditCandidateJobAlertSummaryFrequency', candidate.SummaryFrequency);

        if (candidate.JobTitles)
        {
            for (var i = 0; i < candidate.JobTitles.length; i++)
            {
                var sJobTitle = candidate.JobTitles[i];
                CandidateEditAccount.AppendValueToList(sJobTitle, 'cmbEditCandidateJobTitleWorkPreference');
            }
        }

        if (candidate.Locations)
        {
            for (var i = 0; i < candidate.Locations.length; i++)
            {
                var location = candidate.Locations[i];
                var sLocation = location.City + CandidateEditAccount.CityCountySeparator + location.County;
                CandidateEditAccount.AppendValueToList(sLocation, 'cmbEditCandidateLocationWorkPreference');
            }
        }
    },

    PostCodelookup: function()
    {
        var sPrefix = "txtEditCandidate";
        TriSysSDK.PostCode.Lookup(sPrefix + "PostCode", sPrefix + "Street",
                                    sPrefix + "City", sPrefix + "County", sPrefix + "Country");
    },

    _JobTitleFilterText: null,

    AlertJobTitleLookup: function()
    {
        // Lookup one or more job titles and add to the collection of current job titles
        var sJobTitleField = 'txtEditCandidateJobTitleLookup';
        var sJobTitle = CandidateEditAccount._JobTitleFilterText;

        // Lookup multiple job titles - used in candidate edit profile job alerts
        TriSysApex.ModalDialogue.JobTitle.SelectMultiple(sJobTitle, CandidateEditAccount.AppendJobTitlesToList);

        CandidateEditAccount._JobTitleFilterText = null;
    },

    AppendJobTitlesToList: function(lstJobTitle)
    {
        if (lstJobTitle)
        {
            lstJobTitle.forEach(function (sJobTitle)
            {
                CandidateEditAccount.AppendValueToList(sJobTitle, 'cmbEditCandidateJobTitleWorkPreference');
            });
        }        
    },

    AppendValueToList: function (sValue, sMultiSelectID)
    {
        var arrFieldList = [], sourceItems = [];

        var lstItems = TriSysSDK.CShowForm.GetSelectedSkillsFromListAsArray(sMultiSelectID);

        if (lstItems)
        {
            var bFoundSkill = false;
            for (var i = 0; i < lstItems.length; i++)
            {
                var sItem = lstItems[i];
                var sourceStruct = {
                    value: sItem,
                    text: sItem
                };
                sourceItems.push(sourceStruct);

                arrFieldList.push(sItem);

                if (sItem == sValue)
                    bFoundSkill = true;
            }

            if (!bFoundSkill)
            {
                var sourceStruct = {
                    value: sValue,
                    text: sValue
                };
                sourceItems.push(sourceStruct);
                arrFieldList.push(sValue);
            }
        }

        TriSysSDK.CShowForm.replaceItemsInMultiSelectCombo(sMultiSelectID, sourceItems);

        if (arrFieldList.length > 0)
        {
            // Select all
            TriSysSDK.CShowForm.SetValuesArrayInList(sMultiSelectID, arrFieldList);
        }
    },

    _LocationFilterText: null,

    LocationLookup: function ()
    {
        TriSysSDK.PostCode.LookupCityCounty(CandidateEditAccount._LocationFilterText, CandidateEditAccount.AppendLocationToList);
        CandidateEditAccount._LocationFilterText = null;
    },

    CityCountySeparator: " > ",

    AppendLocationToList: function (sCity, sCounty)
    {
        var sItem = sCity + CandidateEditAccount.CityCountySeparator + sCounty;
        CandidateEditAccount.AppendValueToList(sItem, 'cmbEditCandidateLocationWorkPreference');

        return true;
    },

    SubmitButtonClick: function()
    {
        var candidate = {};
        candidate.Title = TriSysSDK.CShowForm.GetTextFromCombo('txtEditCandidateTitle');
        candidate.Forenames = $('#txtEditCandidateForenames').val();
        candidate.Surname = $('#txtEditCandidateSurname').val();
        candidate.PersonalEMail = $('#txtEditCandidateEMail').val();
        candidate.Password = $('#txtEditCandidatePassword').val();
        candidate.VerifyPassword = $('#txtEditCandidatePasswordConfirmation').val();
        candidate.JobTitle = $('#txtEditCandidateJobTitle').val();
        candidate.HomeAddressStreet = $('#txtEditCandidateStreet').val();
        candidate.HomeAddressCity = $('#txtEditCandidateCity').val();
        candidate.HomeAddressCounty = $('#txtEditCandidateCounty').val();
        candidate.HomeAddressPostCode = $('#txtEditCandidatePostCode').val();
        candidate.HomeAddressCountry = $('#txtEditCandidateCountry').val();
        candidate.HomeAddressTelNo = $('#txtEditCandidateHomeTelNo').val();
        candidate.MobileTelNo = $('#txtEditCandidateMobileTelNo').val();
        candidate.CVFileRef = TriSysSDK.Controls.FileReference.GetFile("txtEditCandidateCVFileRef");
        candidate.ContactPhoto = TriSysSDK.Controls.FileReference.GetFile("EditCandidateContactPhoto");

        candidate.LookingForWork = TriSysSDK.CShowForm.GetCheckBoxValue('chkEditCandidateLookingForWork');
        candidate.CarOwner = TriSysSDK.CShowForm.GetCheckBoxValue('chkEditCandidateCarOwner');
        candidate.LiveJobAlertsOn = TriSysSDK.CShowForm.GetCheckBoxValue('chkEditCandidateLiveJobAlerts');
        candidate.SummaryJobAlertsOn = TriSysSDK.CShowForm.GetCheckBoxValue('chkEditCandidateJobAlertSummary');

        candidate.Twitter = $('#txtEditCandidateTwitter').val();
        candidate.LinkedIn = $('#txtEditCandidateLinkedIn').val();
        candidate.Facebook = $('#txtEditCandidateFacebook').val();
        candidate.YouTube = $('#txtEditCandidateYouTube').val();
        candidate.SkypeNumber = $('#txtEditCandidateSkype').val();

        candidate.CurrentRemuneration = TriSysSDK.Controls.CurrencyAmountPeriod.GetCurrencyAmountPeriod('capEditCandidateCurrentRemuneration');
        candidate.RequiredRemunerationContract = TriSysSDK.Controls.CurrencyAmountPeriod.GetCurrencyAmountPeriod('capEditCandidateRequiredRemunerationContract');
        candidate.RequiredRemunerationPermanent = TriSysSDK.Controls.CurrencyAmountPeriod.GetCurrencyAmountPeriod('capEditCandidateRequiredRemunerationPermanent');

        candidate.AvailabilityDate = TriSysSDK.CShowForm.getDatePickerValue('dtEditCandidateAvailability');
        candidate.TypeOfWorkRequired = TriSysSDK.CShowForm.GetSelectedSkillsFromList("cmbEditCandidateTypeOfWorkRequired");
        candidate.JobTitles = TriSysSDK.CShowForm.GetSelectedSkillsFromListAsArray("cmbEditCandidateJobTitleWorkPreference");
        var locationArray = TriSysSDK.CShowForm.GetSelectedSkillsFromListAsArray("cmbEditCandidateLocationWorkPreference");
        candidate.NoticePeriod = TriSysSDK.CShowForm.GetValueFromCombo('txtEditCandidateNoticePeriod');
        candidate.SummaryFrequency = TriSysSDK.CShowForm.GetValueFromCombo('txtEditCandidateJobAlertSummaryFrequency');

        if (locationArray)
        {
            var lstCityCounty = [];
            for (var i = 0; i < locationArray.length; i++)
            {
                var sCityCounty = locationArray[i]
                var parts = sCityCounty.split(CandidateEditAccount.CityCountySeparator);
                if (parts && parts.length == 2)
                {
                    var CPostCodeCityCounty = { City: parts[0], County: parts[1] };
                    lstCityCounty.push(CPostCodeCityCounty);
                }
            }
            candidate.Locations = lstCityCounty
		}

		candidate.AgreeToMarketingCommunications = TriSysSDK.CShowForm.GetCheckBoxValue('CandidateEditAccount-AgreeToReceiveMarketingCommunications');
		candidate.AgreeToPrivacyPolicy = TriSysSDK.CShowForm.GetCheckBoxValue('CandidateEditAccount-AgreeToPrivacyPolicy');
		candidate.GDPRRestrictDataProcessing = TriSysSDK.CShowForm.GetCheckBoxValue('CandidateEditAccount-RestrictProcessing');


        // Validation rules
        var sRuleFailure = '';
        if (!candidate.Forenames) sRuleFailure += 'Please enter your forename(s)' + '<br />';
        if (!candidate.Surname) sRuleFailure += 'Please enter your surname' + '<br />';
        if (!TriSysApex.LoginCredentials.validateEmail(candidate.PersonalEMail)) sRuleFailure += "Please enter a valid e-mail address." + '<br />';

        if (candidate.Password || candidate.VerifyPassword)
        {
            var iMinLength = TriSysApex.Constants.iMinimumPasswordLength;
            if (candidate.Password.length < iMinLength)
                sRuleFailure += 'Please enter a password with a mininum length of ' + iMinLength + ' characters' + '<br />';

            if (candidate.Password != candidate.VerifyPassword) sRuleFailure += 'Please confirm your password' + '<br />';
        }

        if (sRuleFailure.length > 0)
        {
            TriSysApex.UI.ShowMessage(sRuleFailure, TriSysWebJobs.Constants.ApplicationName);
            return;
        }

        CandidateEditAccount.WriteProfileAndJobPreferences(candidate);
    },

    WriteProfileAndJobPreferences: function (candidate)
    {
        var payloadObject = {};

        var WriteLoggedInCandidateProfileRequest = {
            Candidate: candidate
        };

        payloadObject.OutboundDataPacket = WriteLoggedInCandidateProfileRequest;
        payloadObject.URL = 'Contact/WriteLoggedInCandidateProfile';
        payloadObject.InboundDataFunction = function (WriteLoggedInCandidateProfileResponse)
        {
            TriSysApex.UI.HideWait();

            if (WriteLoggedInCandidateProfileResponse)
            {
                if (WriteLoggedInCandidateProfileResponse.Success)
                {
                    TriSysApex.UI.ShowMessage("Profile Successfuly Updated", TriSysWebJobs.Constants.ApplicationName );
                }
                else
                    TriSysApex.UI.ShowMessage(WriteLoggedInCandidateProfileResponse.ErrorMessage, TriSysWebJobs.Constants.ApplicationName);
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('CandidateEditAccount.WriteProfileAndJobPreferences: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Saving Profile...");

        TriSysAPI.Data.PostToWebAPI(payloadObject);
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
			$('#txtEditCandidateJobTitle').attr('readonly', 'readonly');

			// Button visible
			$('#tr-EditCandidateJobTitle').show();
		}
	},

	JobTitleLookup: function ()
	{
		var sJobTitleField = 'txtEditCandidateJobTitle';
		var sJobTitle = null;	// TriSysSDK.CShowForm.GetJobTitleFromField(sJobTitleField); job title is read-only
		TriSysSDK.JobTitle.Lookup(sJobTitle, sJobTitleField);
	},

	// These little blighters look better when themed
	TweakLittleQuestionMarks: function ()
	{
		var bMobile = TriSysApex.Device.isPhone();

		// Find all instances in the DOM 
		$('i[id^=CandidateEditAccount-QuestionMark]').filter(function () {
			var sID = this.id;
			var elem = $('#' + sID);
			elem.css("color", TriSysProUI.BackColour());

			if (bMobile)
			{
				elem.hide();
			}
			else
			{
				// Also add a hyperlink to popup the title
				var sTitle = this.title;
				var sCaption = elem.data("caption");
				elem.off().on('click', function () {
					TriSysApex.UI.ShowMessage(sTitle, sCaption);
				});
			}
		});
	},

	PrivacyPolicy: function ()
	{
		// Old used an HTML privacy policy
		var parametersObject = new TriSysApex.UI.ShowMessageParameters();
		parametersObject.Title = TriSysApex.Copyright.ShortProductName + " Privacy Policy";
		parametersObject.Image = "gi-lock";
		parametersObject.Maximize = true;

		var sCustomerID = TriSysWebJobs.Agency.CustomerID;
		parametersObject.ContentURL = "https://api.trisys.co.uk/apex/custom/" + sCustomerID + "/ctrlPrivacyPolicy.html";
		parametersObject.ButtonRightText = "OK";
		parametersObject.ButtonRightVisible = true;

		parametersObject.ButtonLeftText = "Agree to Privacy Policy";
		parametersObject.ButtonLeftVisible = true;
		parametersObject.ButtonLeftFunction = function () {
			TriSysSDK.CShowForm.SetCheckBoxValue('CandidateEditAccount-AgreeToPrivacyPolicy', true);
			return true;
		};

		TriSysApex.UI.PopupMessage(parametersObject);
	},

	RequestRemoval: function ()
	{
		TriSysApex.WhiteLabelling.LoadJavascriptFile('js/pages/ctrlRequestRemoval.js', null, CandidateEditAccount.PopupRequestRemoval);
	},

	PopupRequestRemoval: function ()
	{
		var parametersObject = new TriSysApex.UI.ShowMessageParameters();
		parametersObject.Title = "Request Removal";
		parametersObject.Image = "gi-remove_2";
		parametersObject.Maximize = false;
		parametersObject.CloseTopRightButton = true;

		parametersObject.ContentURL = TriSysApex.CustomFormsAndComponents.UserControlPath("ctrlRequestRemoval.html");
		parametersObject.Width = 600;

		// Callback
		parametersObject.OnLoadCallback = function () {
			var sFullName = $('#txtEditCandidateForenames').val() + ' ' + $('#txtEditCandidateSurname').val();
			ctrlRequestRemoval.Load(sFullName);
		};

		// Buttons
		parametersObject.ButtonLeftVisible = true;
		parametersObject.ButtonLeftText = "Cancel";
		parametersObject.ButtonLeftFunction = function () {
			return true;
		};

		parametersObject.ButtonCentreVisible = true;
		parametersObject.ButtonCentreText = "Confirm Removal Request";
		parametersObject.ButtonCentreFunction = ctrlRequestRemoval.Confirm;

		TriSysApex.UI.PopupMessage(parametersObject);
	},

	PortabilityRequest: function ()
	{
		TriSysApex.WhiteLabelling.LoadJavascriptFile('js/pages/ctrlPortabilityRequest.js', null, CandidateEditAccount.PopupPortabilityRequest);
	},

	PopupPortabilityRequest: function ()
	{
		var parametersObject = new TriSysApex.UI.ShowMessageParameters();
		parametersObject.Title = "Portability Request";
		parametersObject.Image = "gi-global";
		parametersObject.Maximize = false;
		parametersObject.CloseTopRightButton = true;

		parametersObject.ContentURL = TriSysApex.CustomFormsAndComponents.UserControlPath("ctrlPortabilityRequest.html");
		parametersObject.Width = 600;

		// Callback
		parametersObject.OnLoadCallback = function () {
			var sFullName = $('#txtEditCandidateForenames').val() + ' ' + $('#txtEditCandidateSurname').val();
			ctrlPortabilityRequest.Load(sFullName);
		};

		// Buttons
		parametersObject.ButtonLeftVisible = true;
		parametersObject.ButtonLeftText = "Cancel";
		parametersObject.ButtonLeftFunction = function () {
			return true;
		};

		parametersObject.ButtonCentreVisible = true;
		parametersObject.ButtonCentreText = "Confirm Portability Request";
		parametersObject.ButtonCentreFunction = ctrlPortabilityRequest.Confirm;

		TriSysApex.UI.PopupMessage(parametersObject);
	},

	RemovalRequested: function (dtDateGDPRDeletionRequestReceived)
	{
		// A deletion request was previously received so replace button with date
		var sDateGDPRDeletionRequestReceived = moment(dtDateGDPRDeletionRequestReceived).format("dddd DD MMMM YYYY");
		$('#CandidateEditAccount-RequestRemovalButton').hide();
		var sIcon = '<i class="gi gi-remove_2"></i> &nbsp; ';
		$('#CandidateEditAccount-RequestRemovalMessage').show().html(sIcon + "Requested removal on " + sDateGDPRDeletionRequestReceived);
	},

	PortabilityRequestReceived: function (dtDateGDPRDataPortabilityRequestReceived)
	{
		// A portability request was previously received so replace button with date
		var sDateGDPRDataPortabilityRequestReceived = moment(dtDateGDPRDataPortabilityRequestReceived).format("dddd DD MMMM YYYY");
		$('#CandidateEditAccount-PortabilityRequestButton').hide();
		var sIcon = '<i class="gi gi-global"></i> &nbsp; ';
		$('#CandidateEditAccount-PortabilityRequestMessage').show().html(sIcon + "Portability request received on " + sDateGDPRDataPortabilityRequestReceived);
	},

	// Some customers are never satisfied
	CustomerSpecificEnhancements: function()
	{
		var bHideRestrictProcessing = (TriSysWebJobs.Agency.CustomerID == "Mane-Group");

		if (bHideRestrictProcessing)
		{
			$('#CandidateEditAccount-RestrictProcessing-tr').hide();
		}
	}
};

$(document).ready(function ()
{
    CandidateEditAccount.Load();
});

