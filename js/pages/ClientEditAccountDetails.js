var ClientEditAccountDetails =
{
    Load: function ()
    {
        TriSysWebJobs.CandidateRegistration.LoadContactTitleLookup("txtEditClientTitle");
        TriSysWebJobs.CandidateRegistration.LoadCountryLookup("txtEditClientCountry");
        TriSysWebJobs.CandidateRegistration.LoadContactPhotoWidgets("EditClientContactPhoto", "imgEditClientEditor");

        // Load the currently logged in client details into the fields, if logged in of course!
        var fnPopulate = function (client)
        {
            TriSysSDK.CShowForm.SetTextInCombo("txtEditClientTitle", client.Title);
            $('#txtEditClientForenames').val(client.Forenames);
            $('#txtEditClientSurname').val(client.Surname);
            $('#txtEditClientJobTitle').val(client.JobTitle);
            $('#txtEditClientMobileTelNo').val(client.WorkMobileTelNo);
            $('#txtEditClientWorkTelNo').val(client.WorkTelNo);

            $('#txtEditClientEMail').val(client.WorkEMail);

            $('#txtEditClientCompanyName').val(client.CompanyName);
           
            var companyAddresses = [];
            var addresses = client.CompanyAddresses;
            var iSelectedIndex = 0;
            if (addresses)
            {
                for (var i = 0; i < addresses.length; i++)
                {
                    var address = addresses[i];

                    // Truncate address display
                    var sAddressDisplay = TriSysSDK.Miscellaneous.EllipsisText(address.Display, 100);

                    companyAddresses.push({ value: address.AddressId, text: sAddressDisplay });

                    if (address.AddressId == client.CompanyAddressId)
                        iSelectedIndex = i;
                }
            }

            TriSysSDK.CShowForm.populateComboFromDataSource('cmbEditClientAddress', companyAddresses, iSelectedIndex);
            
            $('#EditClientNewCompanyAddress').on('click', function ()
            {
                ClientEditAccountDetails.SpecifyNewCompanyAddress(client.CompanyId, client.CompanyName, 'cmbEditClientAddress');
            });


            if (client.CompanyAddressStreet)
            {
                var sStreet = client.CompanyAddressStreet.replace(/, /g, '\n');
                $('#txtEditClientStreet').val(sStreet);
            }
            $('#txtEditClientCity').val(client.CompanyAddressCity);
            $('#txtEditClientCounty').val(client.CompanyAddressCounty);
            $('#txtEditClientPostCode').val(client.CompanyAddressPostCode);
            if (client.CompanyAddressCountry)
                TriSysSDK.CShowForm.SetTextInCombo('txtEditClientCountry', client.CompanyAddressCountry);
            $('#txtEditClientAddressPhone').val(client.CompanyAddressTelNo);

            if (client.ContactPhoto)
            {
                var photoWidget = $('#imgEditClientEditor');
                photoWidget.attr('src', client.ContactPhoto);
                photoWidget.show();
			}

			// GDPR May 2018
			if (client.GDPRSettings) {
				//var sDateRegistered = moment(candidate.GDPRSettings).format("dddd DD MMMM YYYY");
				//var sLastUpdated = moment(candidate.GDPRSettings).format("dddd DD MMMM YYYY");
				//$('#EditProfile-DateRegistered').html(sDateRegistered);
				//$('#EditProfile-LastUpdated').html(sLastUpdated);

				TriSysSDK.CShowForm.SetCheckBoxValue('ClientEditAccountDetails-AgreeToReceiveMarketingCommunications', client.GDPRSettings.AgreeToMarketingCommunications);
				TriSysSDK.CShowForm.SetCheckBoxValue('ClientEditAccountDetails-AgreeToPrivacyPolicy', client.GDPRSettings.AgreeToPrivacyPolicy);
				TriSysSDK.CShowForm.SetCheckBoxValue('ClientEditAccountDetails-RestrictProcessing', client.GDPRSettings.GDPRRestrictDataProcessing);

				if (client.GDPRSettings.GDPRDeletionRequestReceived) {
					// A deletion request was previously received so replace button with date
					ClientEditAccountDetails.RemovalRequested(client.GDPRSettings.DateGDPRDeletionRequestReceived);
				}

				if (client.GDPRSettings.GDPRDataPortabilityRequestReceived) {
					// A portability request was previously received so replace button with date
					ClientEditAccountDetails.PortabilityRequestReceived(client.GDPRSettings.DateGDPRDataPortabilityRequestReceived);
				}

				// TriSys CRM only
				//if (candidate.GDPRSettings.isServicableCustomerAccount) {
				//	// This is a current customer who cannot request a removal of their account, or restrict processing
				//	$('#ClientEditAccountDetails-RequestRemovalButton').attr("disabled", true);
				//	$('#ClientEditAccountDetails-RestrictProcessing').attr("disabled", true);
				//}
			}

        };
        TriSysWebJobs.ContactUs.LoadLoggedInUserDetails(fnPopulate, false);

        // Get social links
        ClientEditAccountDetails.ReadSocialProfile();

		// Some customers want job titles to be selected rather than entered
		ClientEditAccountDetails.JobTitleSelectionMode();
	},

    SpecifyNewCompanyAddress: function (lCompanyId, sCompanyName, sComboID)
    {
        var fnNewAddress = function (lCompanyId, lContactId, address)
        {
            // Add this address to the combo and select it as the default company address for this contact
            var sStreet = address.Street.replace(/\r\n/g, ', ').replace(/\n/g, ', ');
            var sAddress = sStreet + (address.City ? ', ' + address.City : '') + (address.County ? ', ' + address.County : '') + (address.PostCode ? ', ' + address.PostCode : '');
            
            var sAddressObject = JSON.stringify(address);

            TriSysSDK.CShowForm.addItemToCombo(sComboID, sAddress, true, sAddressObject);

            // Close the topmost modal
            TriSysApex.UI.CloseModalPopup();
        };

        // Re-usable dialogue for new company and new company address from company form and contact forms
        var options = { Title: "New " + sCompanyName + " Address", HideCompanyBlock: true };
        TriSysApex.ModalDialogue.NewCompanyAddress.Popup(lCompanyId, sCompanyName, 0, 0, fnNewAddress, false, options);
    },

    ReadSocialProfile: function()
    {
        var payloadObject = {};

        payloadObject.URL = 'Contact/ReadLoggedInClientSocialProfile';
        payloadObject.OutboundDataPacket = null;
        payloadObject.InboundDataFunction = function (CLoggedInClientSocialProfileResponse)
        {
            if (CLoggedInClientSocialProfileResponse)
            {
                if (CLoggedInClientSocialProfileResponse.Success)
                {
                    ClientEditAccountDetails.DisplaySocialProfile(CLoggedInClientSocialProfileResponse);
                }
            }
        };

        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    DisplaySocialProfile: function(profile)
    {
        $('#txtEditClientTwitter').val(profile.Twitter);
        $('#txtEditClientLinkedIn').val(profile.LinkedIn);
        $('#txtEditClientFacebook').val(profile.Facebook);
        $('#txtEditClientYouTube').val(profile.YouTube);
        $('#txtEditClientSkype').val(profile.Skype);
    },

    PostCodelookup: function ()
    {
        var sPrefix = "txtEditClient";
        TriSysSDK.PostCode.Lookup(sPrefix + "PostCode", sPrefix + "Street",
                                    sPrefix + "City", sPrefix + "County", sPrefix + "Country");
    },

    SubmitButtonClick: function()
    {
        var client = {};        // CWriteLoggedInClientProfileRecord

        client.Title = TriSysSDK.CShowForm.GetTextFromCombo('txtEditClientTitle');
        client.Forenames = $('#txtEditClientForenames').val();
        client.Surname = $('#txtEditClientSurname').val();
        client.Password = $('#txtEditClientPassword').val();
        client.VerifyPassword = $('#txtEditClientPasswordConfirmation').val();
        client.JobTitle = $('#txtEditClientJobTitle').val();

        client.CompanyName = $('#txtEditClientCompanyName').val();

        var lAddressId = TriSysSDK.CShowForm.GetValueFromCombo('cmbEditClientAddress');
        if (!$.isNumeric(lAddressId))
        {
            // A new address
            client.NewCompanyAddress = JSON.parse(lAddressId);      // Complex CAddress object
        }
        else
            client.CompanyAddressId = lAddressId;

        client.CompanyAddressStreet = $('#txtEditClientStreet').val();
        client.CompanyAddressCity = $('#txtEditClientCity').val();
        client.CompanyAddressCounty = $('#txtEditClientCounty').val();
        client.CompanyAddressPostCode = $('#txtEditClientPostCode').val();
        client.CompanyAddressCountry = $('#txtEditClientCountry').val();
        client.CompanyAddressTelNo = $('#txtEditClientAddressPhone').val();

        client.WorkMobileTelNo = $('#txtEditClientMobileTelNo').val();
        client.WorkTelNo = $('#txtEditClientWorkTelNo').val();
        client.WorkEMail = $('#txtEditClientEMail').val();

        client.ContactPhoto = TriSysSDK.Controls.FileReference.GetFile("EditClientContactPhoto");

        client.Twitter = $('#txtEditClientTwitter').val();
        client.LinkedIn = $('#txtEditClientLinkedIn').val();
        client.Facebook = $('#txtEditClientFacebook').val();
        client.YouTube = $('#txtEditClientYouTube').val();
		client.Skype = $('#txtEditClientSkype').val();

		client.AgreeToMarketingCommunications = TriSysSDK.CShowForm.GetCheckBoxValue('ClientEditAccountDetails-AgreeToReceiveMarketingCommunications');
		client.AgreeToPrivacyPolicy = TriSysSDK.CShowForm.GetCheckBoxValue('ClientEditAccountDetails-AgreeToPrivacyPolicy');
		client.GDPRRestrictDataProcessing = TriSysSDK.CShowForm.GetCheckBoxValue('ClientEditAccountDetails-RestrictProcessing');

        // Validation rules
        var sRuleFailure = '';
        if (!client.Forenames) sRuleFailure += 'Please enter your forename(s)' + '<br />';
        if (!client.Surname) sRuleFailure += 'Please enter your surname' + '<br />';
        if (!TriSysApex.LoginCredentials.validateEmail(client.WorkEMail)) sRuleFailure += "Please enter a valid e-mail address." + '<br />';

        if (client.Password || client.VerifyPassword)
        {
            var iMinLength = TriSysApex.Constants.iMinimumPasswordLength;
            if (client.Password.length < iMinLength)
                sRuleFailure += 'Please enter a password with a mininum length of ' + iMinLength + ' characters' + '<br />';

            if (client.Password != client.VerifyPassword) sRuleFailure += 'Please confirm your password' + '<br />';
        }

        if (sRuleFailure.length > 0)
        {
            TriSysApex.UI.ShowMessage(sRuleFailure, TriSysWebJobs.Constants.ApplicationName);
            return;
        }

        ClientEditAccountDetails.WriteProfileAndSocialMedia(client);
    },

    WriteProfileAndSocialMedia: function (client)
    {
        var payloadObject = {};

        var WriteLoggedInClientProfileRequest = {
            Client: client
        };

        payloadObject.OutboundDataPacket = WriteLoggedInClientProfileRequest;
        payloadObject.URL = 'Contact/WriteLoggedInClientProfile';
        payloadObject.InboundDataFunction = function (WriteLoggedInClientProfileResponse)
        {
            TriSysApex.UI.HideWait();

            if (WriteLoggedInClientProfileResponse)
            {
                if (WriteLoggedInClientProfileResponse.Success)
                {
                    TriSysApex.UI.ShowMessage("Profile Successfuly Updated", TriSysWebJobs.Constants.ApplicationName);
                }
                else
                    TriSysApex.UI.ShowMessage(WriteLoggedInClientProfileResponse.ErrorMessage, TriSysWebJobs.Constants.ApplicationName);
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('ClientEditAccountDetails.WriteProfileAndSocialMedia: ' + status + ": " + error + ". responseText: " + request.responseText);
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
			$('#txtEditClientJobTitle').attr('readonly', 'readonly');

			// Button visible
			$('#tr-EditClientJobTitle').show();
		}
	},

	JobTitleLookup: function ()
	{
		var sJobTitleField = 'txtEditClientJobTitle';
		var sJobTitle = null;	// TriSysSDK.CShowForm.GetJobTitleFromField(sJobTitleField); job title is read-only
		TriSysSDK.JobTitle.Lookup(sJobTitle, sJobTitleField);
		},

	// These little blighters look better when themed
	TweakLittleQuestionMarks: function () {
		// Find all instances in the DOM 
		$('i[id^=ClientEditAccountDetails-QuestionMark]').filter(function () {
			var sID = this.id;
			var elem = $('#' + sID);
			elem.css("color", TriSysProUI.BackColour());

			// Also add a hyperlink to popup the title
			var sTitle = this.title;
			var sCaption = elem.data("caption");
			elem.off().on('click', function () {
				TriSysApex.UI.ShowMessage(sTitle, sCaption);
			});
		});
	},

	PrivacyPolicy: function () {
		// Old used am HTML privacy policy
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
			TriSysSDK.CShowForm.SetCheckBoxValue('ClientEditAccountDetails-AgreeToPrivacyPolicy', true);
			return true;
		};

		TriSysApex.UI.PopupMessage(parametersObject);
	},

	RequestRemoval: function () {
		TriSysApex.WhiteLabelling.LoadJavascriptFile('js/pages/ctrlRequestRemoval.js', null, ClientEditAccountDetails.PopupRequestRemoval);
	},

	PopupRequestRemoval: function () {
		var parametersObject = new TriSysApex.UI.ShowMessageParameters();
		parametersObject.Title = "Request Removal";
		parametersObject.Image = "gi-remove_2";
		parametersObject.Maximize = false;
		parametersObject.CloseTopRightButton = true;

		parametersObject.ContentURL = TriSysApex.CustomFormsAndComponents.UserControlPath("ctrlRequestRemoval.html");
		parametersObject.Width = 600;

		// Callback
		parametersObject.OnLoadCallback = function () {
			var sFullName = $('#txtEditClientForenames').val() + ' ' + $('#txtEditClientSurname').val();
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

	PortabilityRequest: function () {
		TriSysApex.WhiteLabelling.LoadJavascriptFile('js/pages/ctrlPortabilityRequest.js', null, ClientEditAccountDetails.PopupPortabilityRequest);
	},

	PopupPortabilityRequest: function () {
		var parametersObject = new TriSysApex.UI.ShowMessageParameters();
		parametersObject.Title = "Portability Request";
		parametersObject.Image = "gi-global";
		parametersObject.Maximize = false;
		parametersObject.CloseTopRightButton = true;

		parametersObject.ContentURL = TriSysApex.CustomFormsAndComponents.UserControlPath("ctrlPortabilityRequest.html");
		parametersObject.Width = 600;

		// Callback
		parametersObject.OnLoadCallback = function () {
			var sFullName = $('#txtEditClientForenames').val() + ' ' + $('#txtEditClientSurname').val();
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

	RemovalRequested: function (dtDateGDPRDeletionRequestReceived) {
		// A deletion request was previously received so replace button with date
		var sDateGDPRDeletionRequestReceived = moment(dtDateGDPRDeletionRequestReceived).format("dddd DD MMMM YYYY");
		$('#ClientEditAccountDetails-RequestRemovalButton').hide();
		var sIcon = '<i class="gi gi-remove_2"></i> &nbsp; ';
		$('#ClientEditAccountDetails-RequestRemovalMessage').show().html(sIcon + "Requested removal on " + sDateGDPRDeletionRequestReceived);
	},

	PortabilityRequestReceived: function (dtDateGDPRDataPortabilityRequestReceived) {
		// A portability request was previously received so replace button with date
		var sDateGDPRDataPortabilityRequestReceived = moment(dtDateGDPRDataPortabilityRequestReceived).format("dddd DD MMMM YYYY");
		$('#ClientEditAccountDetails-PortabilityRequestButton').hide();
		var sIcon = '<i class="gi gi-global"></i> &nbsp; ';
		$('#ClientEditAccountDetails-PortabilityRequestMessage').show().html(sIcon + "Portability request received on " + sDateGDPRDataPortabilityRequestReceived);
	}
};

$(document).ready(function ()
{
    ClientEditAccountDetails.Load();
});
