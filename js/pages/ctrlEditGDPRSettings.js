var ctrlEditGDPRSettings =
{
    // Called from contact form
    Load: function(lContactId )
    {
        // Oct 2020: Why not just take care of showing the modal here too?
        // Much more sensible way i.e. everything centralised
        var parametersObject = new TriSysApex.UI.ShowMessageParameters();
        parametersObject.Title = "Edit Privacy Preferences/GDPR";
        parametersObject.Image = "gi-lock";

        parametersObject.ContentURL = TriSysApex.Constants.UserControlFolder + "ctrlEditGDPRSettings.html";

        parametersObject.OnLoadCallback = function () {
            ctrlEditGDPRSettings.LoadExistingSettings(lContactId);
        };

        parametersObject.ButtonRightText = "Cancel";
        parametersObject.ButtonRightVisible = true;

        parametersObject.ButtonLeftText = "Save";
        parametersObject.ButtonLeftVisible = true;
        parametersObject.ButtonLeftFunction = function () {
            ctrlEditGDPRSettings.SaveSettings(lContactId);
        };

        parametersObject.Width = $(window).width() / 2;

        TriSysApex.UI.PopupMessage(parametersObject);
    },

    LoadExistingSettings: function(lContactId)
    {
        // Pull directly from the currently open contact record
        var bGDPRAutomatedNotificationEMailSent = TriSysSDK.CShowForm.GetCheckBoxValue('contactForm-GDPRAutomatedNotificationEMailSent', false);
        var bAgreeToPrivacyPolicy = TriSysSDK.CShowForm.GetCheckBoxValue('contactForm-AgreeToPrivacyPolicy', false);
        var bAgreeToMarketingCommunications = TriSysSDK.CShowForm.GetCheckBoxValue('contactForm-AgreeToMarketingCommunications', false);
        var bGDPRRestrictDataProcessing = TriSysSDK.CShowForm.GetCheckBoxValue('contactForm-GDPRRestrictDataProcessing', false);
        var bGDPRDeletionRequestReceived = TriSysSDK.CShowForm.GetCheckBoxValue('contactForm-GDPRDeletionRequestReceived', false);
        var bGDPRDataPortabilityRequestReceived = TriSysSDK.CShowForm.GetCheckBoxValue('contactForm-GDPRDataPortabilityRequestReceived', false);

        // Write to our fields
        TriSysSDK.CShowForm.SetCheckBoxValue('ctrlEditGDPRSettings-GDPRAutomatedNotificationEMailSent', bGDPRAutomatedNotificationEMailSent);
        TriSysSDK.CShowForm.SetCheckBoxValue('ctrlEditGDPRSettings-AgreeToPrivacyPolicy', bAgreeToPrivacyPolicy);
        TriSysSDK.CShowForm.SetCheckBoxValue('ctrlEditGDPRSettings-AgreeToMarketingCommunications', bAgreeToMarketingCommunications);
        TriSysSDK.CShowForm.SetCheckBoxValue('ctrlEditGDPRSettings-GDPRRestrictDataProcessing', bGDPRRestrictDataProcessing);
        TriSysSDK.CShowForm.SetCheckBoxValue('ctrlEditGDPRSettings-GDPRDeletionRequestReceived', bGDPRDeletionRequestReceived);
        TriSysSDK.CShowForm.SetCheckBoxValue('ctrlEditGDPRSettings-GDPRDataPortabilityRequestReceived', bGDPRDataPortabilityRequestReceived);
    },

    SaveSettings: function (lContactId)
    {
        var bGDPRAutomatedNotificationEMailSent = TriSysSDK.CShowForm.GetCheckBoxValue('ctrlEditGDPRSettings-GDPRAutomatedNotificationEMailSent', false);
        var bAgreeToPrivacyPolicy = TriSysSDK.CShowForm.GetCheckBoxValue('ctrlEditGDPRSettings-AgreeToPrivacyPolicy', false);
        var bAgreeToMarketingCommunications = TriSysSDK.CShowForm.GetCheckBoxValue('ctrlEditGDPRSettings-AgreeToMarketingCommunications', false);
        var bGDPRRestrictDataProcessing = TriSysSDK.CShowForm.GetCheckBoxValue('ctrlEditGDPRSettings-GDPRRestrictDataProcessing', false);
        var bGDPRDeletionRequestReceived = TriSysSDK.CShowForm.GetCheckBoxValue('ctrlEditGDPRSettings-GDPRDeletionRequestReceived', false);
        var bGDPRDataPortabilityRequestReceived = TriSysSDK.CShowForm.GetCheckBoxValue('ctrlEditGDPRSettings-GDPRDataPortabilityRequestReceived', false);

        // Why set none?
        //if (!bGDPRAutomatedNotificationEMailSent && !bAgreeToPrivacyPolicy && !bAgreeToMarketingCommunications &&
        //    !bGDPRRestrictDataProcessing && !bGDPRDeletionRequestReceived && !bGDPRDataPortabilityRequestReceived)
        //{
        //    TriSysApex.UI.ShowMessage("You must set at least one of these preferences.");
        //    return;
        //}

        // Prepare the data structure
        var CUpdateContactGDPRPreferencesRequest = {
            ContactId: lContactId,

            GDPRAutomatedNotificationEMailSent: bGDPRAutomatedNotificationEMailSent,
            AgreeToPrivacyPolicy: bAgreeToPrivacyPolicy,
            AgreeToMarketingCommunications : bAgreeToMarketingCommunications,
            GDPRRestrictDataProcessing : bGDPRRestrictDataProcessing,
            GDPRDeletionRequestReceived : bGDPRDeletionRequestReceived,
            GDPRDataPortabilityRequestReceived: bGDPRDataPortabilityRequestReceived
        };

        // Send to Web API
        var payloadObject = {};

        payloadObject.URL = "Contact/UpdateGDPRPreferences";

        payloadObject.OutboundDataPacket = CUpdateContactGDPRPreferencesRequest;

        payloadObject.InboundDataFunction = function (CUpdateContactGDPRPreferencesResponse) {
            TriSysApex.UI.HideWait();

            if (CUpdateContactGDPRPreferencesResponse) {
                if (CUpdateContactGDPRPreferencesResponse.Success)
                {
                    // After updating, we must refresh the settings for the current contact
                    contactForm.LoadPrivacyAndGDPR();

                    // And of course close this modal popup
                    TriSysApex.UI.CloseModalPopup();

                    // We seem to be generating tasks now also!
                    TriSysApex.FormsManager.EntityUpdateController.AsynchronousEntityUpdate("Task", 0);

                    return;
                }
                else
                    TriSysApex.UI.ShowMessage(CUpdateContactGDPRPreferencesResponse.ErrorMessage);
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error) {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('ctrlEditGDPRSettings.SaveSettings: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Updating Preferences...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    }

};  // ctrlEditGDPRSettings