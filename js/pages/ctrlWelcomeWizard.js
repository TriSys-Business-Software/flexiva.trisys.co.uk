var ctrlWelcomeWizard =
{
    Load: function()
    {
        // This is the trigger to fire the essential post-provisioning updates to the
        // web API to setup default dashboard, search tree etc..

        ctrlWelcomeWizard.Title = $('#trisys-modal-title').html();
        ctrlWelcomeWizard.ShowStage(ctrlWelcomeWizard.CurrentStage);
        ctrlWelcomeWizard.LoadPlugIns();

        setTimeout(TriSysProUI.kendoUI_Overrides, 250);

        ctrlWelcomeWizard.LoadDefaultUserSettings();

        // Do not have user options open at the same time
        TriSysApex.FormsManager.CloseAllForms(true);

        // Ensure that retain form in memory is off as we will change settings
        //var userCredentials = TriSysApex.LoginCredentials.UserCredentials();
        TriSysApex.Cache.UserSettingManager.SetValue("RetainFormInMemory", false);
    },

    LoadPlugIns: function()
    {
        var sDivID = 'welcome-wizard-plugins';

        var sPath = 'forms/PlugIns.html';

        TriSysApex.FormsManager.loadPageIntoDiv(sDivID, sPath,
            function (response, status, xhr)
            {
                // Maybe update links?
                $('#trisys-plugsins-form-content-header').hide();
            });
    },

    LoadDefaultUserSettings: function()
    {
        var userCredentials = TriSysApex.LoginCredentials.UserCredentials();
        if (userCredentials && userCredentials.LoggedInUser)
        {
            var user = userCredentials.LoggedInUser;
            var contact = user.Contact;

            var sEMail = user.FullName;
            
            var sInitials = contact.Forenames.substring(0, 1) + contact.SurnameInitial;
            $('#welcome-wizard-requirement-prefix').val(sInitials + '/Req');
            $('#welcome-wizard-placement-prefix').val(sInitials + '/Pla');

            var sSMTPServerAddress = TriSysApex.Cache.UserSettingManager.GetValue("SMTPServerAddress", null);
            if (!sSMTPServerAddress)
                sSMTPServerAddress = 'smtp.gmail.com';

            $('#welcome-wizard-smtp-server-address').val(sSMTPServerAddress);
            $('#welcome-wizard-smtp-server-login').val(TriSysApex.Cache.UserSettingManager.GetValue("SMTPServerLogin", null));
            $('#welcome-wizard-smtp-server-password').val(TriSysApex.Cache.UserSettingManager.GetValue("SMTPServerPassword", null));

            // Recruitment
            if (TriSysApex.Cache.UserSettingManager.GetValue("RequirementReferencePrefix", null))
            {
                if (TriSysApex.Cache.UserSettingManager.GetValue("RequirementReferencePrefix").indexOf("GL/") != 0)
                {
                    $('#welcome-wizard-requirement-prefix').val(TriSysApex.Cache.UserSettingManager.GetValue("RequirementReferencePrefix"));
                    $('#welcome-wizard-placement-prefix').val(TriSysApex.Cache.UserSettingManager.GetValue("PlacementReferencePrefix"));
                }
            }

            // Job Posting
            $('#welcome-wizard-buffer').val(TriSysApex.Cache.UserSettingManager.GetValue("BufferEMail"));
            $('#welcome-wizard-twitter').val(TriSysApex.Cache.UserSettingManager.GetValue("TwitterURL"));
            $('#welcome-wizard-facebook').val(TriSysApex.Cache.UserSettingManager.GetValue("FacebookURL"));
            $('#welcome-wizard-linkedin').val(TriSysApex.Cache.UserSettingManager.GetValue("LinkedInURL"));

            TriSysWebJobs.CandidateRegistration.LoadContactPhotoWidgets("EditContactPhoto", "imgEditContactEditor");
            TriSysWebJobs.CandidateRegistration.LoadContactPhotoWidgets("EditCompanyLogo", "imgEditCompanyEditor");

            // Display these default settings from the login
            ctrlWelcomeWizard.DisplayContactProfile(contact);

            // Get actual settings if they have changed since login
            ctrlWelcomeWizard.GetContactProfileViaWebAPI();
        }
    },

    GetContactProfileViaWebAPI: function()
    {
        var payloadObject = {};

        payloadObject.URL = "Contact/ReadLoggedInUserContactProfile";

        payloadObject.InboundDataFunction = function (CCUserContactProfile)
        {
            if (CCUserContactProfile)
            {
                if (CCUserContactProfile.Success)
                    ctrlWelcomeWizard.DisplayContactProfile(CCUserContactProfile.Contact, CCUserContactProfile);
                else
                    TriSysApex.UI.errorAlert('ctrlWelcomeWizard.GetContactProfileViaWebAPI Error: ' + CCUserContactProfile.ErrorMessage);

                return;
            }

            TriSysApex.UI.ShowError('ctrlWelcomeWizard.GetContactProfileViaWebAPI Error: null response');
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.errorAlert('ctrlWelcomeWizard.GetContactProfileViaWebAPI: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    DisplayContactProfile: function (contact, CCUserContactProfile)
    {
        $('#welcome-wizard-job-title').val(contact.JobTitle);
        $('#welcome-wizard-work-telno').val(contact.WorkTelNo);
        $('#welcome-wizard-work-mobile-telno').val(contact.WorkMobileTelNo);
        $('#welcome-wizard-skype').val(contact.SkypeNumber);

        if (contact.ContactPhoto)
        {
            TriSysSDK.Controls.FileReference.SetFile('EditContactPhoto', contact.ContactPhoto);
            var photoWidget = $('#imgEditContactEditor');
            photoWidget.attr('src', contact.ContactPhotoURL);
            photoWidget.show();
        }

        if(CCUserContactProfile)
        {
            $('#welcome-wizard-switchboard-telno').val(CCUserContactProfile.CompanySwitchboardTelNo);
            $('#welcome-wizard-homepage').val(CCUserContactProfile.CompanyWebSite);
            $('#welcome-wizard-company-email').val(CCUserContactProfile.CompanyEMail);

            if (CCUserContactProfile.CompanyLogoURL)
            {
                TriSysSDK.Controls.FileReference.SetFile('EditCompanyLogo', CCUserContactProfile.CompanyLogo);
                var logoWidget = $('#imgEditCompanyEditor');
                logoWidget.attr('src', CCUserContactProfile.CompanyLogoURL);
                logoWidget.show();
            }
        }
    },

    Title: null,

    ShowHideWizardButtons: function (iStage)
    {
        var bPrevious = true, bNext = true, bFinish = false;

        if (iStage == 1)
            bPrevious = false;
        else if (iStage == ctrlWelcomeWizard.StageCount)
        {
            bNext = false;
            bFinish = true;
        }

        ctrlWelcomeWizard.PreviousButtonVisible(bPrevious);
        ctrlWelcomeWizard.NextButtonVisible(bNext);
        ctrlWelcomeWizard.FinishButtonVisible(bFinish);

        var sTitle = ctrlWelcomeWizard.Title + ": Step " + iStage + " of " + ctrlWelcomeWizard.StageCount;
        $('#trisys-modal-title').html(sTitle);
    },

    PreviousButtonVisible: function(bVisible)
    {
        ctrlWelcomeWizard.ButtonVisible('trisys-modal-success', bVisible);
    },

    NextButtonVisible: function (bVisible)
    {
        ctrlWelcomeWizard.ButtonVisible('trisys-modal-warning', bVisible);
    },

    FinishButtonVisible: function (bVisible)
    {
        ctrlWelcomeWizard.ButtonVisible('trisys-modal-primary', bVisible);
    },

    ButtonVisible: function (sID, bVisible)
    {
        var elem = $('#' + sID);
        if (bVisible)
            elem.attr('disabled', false);  //.show();
        else
            elem.attr('disabled', true);  //.hide();
    },

    StageCount: 8,

    ShowStage: function(iStage)
    {
        var wizardStagePrefix = '#welcome-wizard-stage-';
        for (var i = 1; i <= ctrlWelcomeWizard.StageCount; i++)
        {
            var elemHide = $(wizardStagePrefix + i);
            elemHide.hide();
        }

        var elem = $(wizardStagePrefix + iStage);
        elem.show();

        ctrlWelcomeWizard.ShowHideWizardButtons(iStage);

        elem.find("i").css("color", TriSysProUI.BackColour());
    },

    CurrentStage: 1,

    Previous: function()
    {
        if (ctrlWelcomeWizard.CurrentStage == 1)
            return;

        ctrlWelcomeWizard.CurrentStage -= 1;
        ctrlWelcomeWizard.ShowStage(ctrlWelcomeWizard.CurrentStage);
    },

    Next: function ()
    {
        if (ctrlWelcomeWizard.CurrentStage == ctrlWelcomeWizard.StageCount)
            return;

        // Validate current stage
        if (!ctrlWelcomeWizard.ValidateCurrentStage())
            return;

        ctrlWelcomeWizard.CurrentStage += 1;
        ctrlWelcomeWizard.ShowStage(ctrlWelcomeWizard.CurrentStage);
    },

    ValidateCurrentStage: function()
    {
        var sError = '';

        switch (ctrlWelcomeWizard.CurrentStage)
        {
            case 2:     // Your Profile
                var sContactPhoto = TriSysSDK.Controls.FileReference.GetFile("EditContactPhoto");
                var sJobTitle = $('#welcome-wizard-job-title').val();
                var sWorkTelNo = $('#welcome-wizard-work-telno').val();
                var sWorkMobileTelNo = $('#welcome-wizard-work-mobile-telno').val();
                var sSkypeNumber = $('#welcome-wizard-skype').val();

				// April 2020 non-essential
				if (!sSkypeNumber) sSkypeNumber = "?";

                if (!sContactPhoto) sError += "Please choose a photo or avatar of yourself for e-mail signatures and your online client/candidate portals.<br />";
                if (!sJobTitle) sError += "Please assign yourself a job title.<br />";
                if (!sWorkTelNo) sError += "Please specify a work phone number.<br />";
                if (!sWorkMobileTelNo) sError += "Please specify a work mobile so that candidates, clients and our technical support can contact you.<br />";
                if (!sSkypeNumber) sError += "Please enter your skype handle so that you can send SMS text messages.<br />";

                break;

            case 3:     // Company Profile
                var sCompanyLogo = TriSysSDK.Controls.FileReference.GetFile("EditCompanyLogo");
                var sCompanySwitchboardTelNo = $('#welcome-wizard-switchboard-telno').val();
                var sCompanyWebSite = $('#welcome-wizard-homepage').val();
                var sCompanyEMail = $('#welcome-wizard-company-email').val();

                if (!sCompanyLogo) sError += "Please choose a logo or avatar of your company for e-mail signatures and web jobs vacancies.<br />";
                if (!sCompanySwitchboardTelNo) sError += "Please specify your company main switchboard phone number.<br />";
                if (!sCompanyWebSite) sError += "Please specify your company website URL.<br />";
                if (!sCompanyEMail) sError += "Please specify your company e-mail address.<br />";

                break;

            case 4:     // New Job Prefixes
                var sReqPrefix = $('#welcome-wizard-requirement-prefix').val();
                var sPlacPrefix = $('#welcome-wizard-placement-prefix').val();
                if (!sReqPrefix) sError += "Please specify a requirement prefix to easily identify your vacancies on social media.<br />";
                if (!sPlacPrefix) sError += "Please specify a placement prefix to easily identify your own placements for candidates using WebJobs.<br />";

                break;

            case 5:     // Automated E-Mail
                var sSMTPServer = $('#welcome-wizard-smtp-server-address').val();
                var sSMTPLogin = $('#welcome-wizard-smtp-server-login').val();
                var sSMTPPassword = $('#welcome-wizard-smtp-server-password').val();
                if (!sSMTPServer) sError += "Please specify an SMTP server address to send your own automated e-mails.<br />";
                if (!sSMTPLogin) sError += "Please specify an SMTP login name to authenticate you to send automated e-mail.<br />";
                if (!sSMTPPassword) sError += "Please specify an SMTP password to authenticate you to send automated e-mail.<br />";

                break;

            case 6:     // Social Networks
                var sBuffer = $('#welcome-wizard-buffer').val();
                var sTwitter = $('#welcome-wizard-twitter').val();
                var sFacebook = $('#welcome-wizard-facebook').val();
                var sLinkedIn = $('#welcome-wizard-linkedin').val();
				
				// FJ requested these be non-mandatory in April 2020
                if (!sBuffer)	sBuffer = "?";
                if (!sTwitter)	sTwitter = "?";
                if (!sFacebook)	sFacebook = "?";
                if (!sLinkedIn)	sLinkedIn = "?";

                if (!sBuffer) sError += "Please specify your buffer assigned e-mail address so that you can post to social networks.<br />";
                if (!sTwitter) sError += "Please specify your twitter feed URL where you will be redirected after posting jobs.<br />";
                if (!sFacebook) sError += "Please specify your facebook page URL where you will be redirected after posting jobs.<br />";
                if (!sLinkedIn) sError += "Please specify your linkedin company page where you will be redirected after posting jobs.<br />";

                break;
        };

        if (sError.length > 0)
        {
            TriSysApex.UI.ShowMessage(sError);
            return false;
        }

        return true;
    },

    Submit: function ()
    {
        // Gather specific contact/company settings
        var sContactPhoto = TriSysSDK.Controls.FileReference.GetFile("EditContactPhoto");
        var sCompanyLogo = TriSysSDK.Controls.FileReference.GetFile("EditCompanyLogo");
        var sJobTitle = $('#welcome-wizard-job-title').val();
        var sWorkTelNo = $('#welcome-wizard-work-telno').val();
        var sWorkMobileTelNo = $('#welcome-wizard-work-mobile-telno').val();
        var sSkypeNumber = $('#welcome-wizard-skype').val();
        var sCompanySwitchboardTelNo = $('#welcome-wizard-switchboard-telno').val();
        var sCompanyWebSite = $('#welcome-wizard-homepage').val();
        var sCompanyEMail = $('#welcome-wizard-company-email').val();
        var sSMTPServer = $('#welcome-wizard-smtp-server-address').val();
        var sSMTPLogin = $('#welcome-wizard-smtp-server-login').val();
        var sSMTPPassword = $('#welcome-wizard-smtp-server-password').val();

        if (sContactPhoto)
        {
            var sFilePath = $('#imgEditContactEditor').attr('src');
            TriSysApex.Pages.Index.ShowLoggedInAvatar(sFilePath);
        }

            // Send back to Server
        var CWriteUserContactProfileRequest = {
                ContactPhoto: sContactPhoto,
                CompanyLogo: sCompanyLogo,
                JobTitle: sJobTitle,
                WorkTelNo: sWorkTelNo,
                WorkMobileTelNo: sWorkMobileTelNo,
                SkypeNumber: sSkypeNumber,
                CompanySwitchboardTelNo: sCompanySwitchboardTelNo,
                CompanyWebSite: sCompanyWebSite,
                CompanyEMail: sCompanyEMail,

                SMTPServer: sSMTPServer,
                SMTPLogin: sSMTPLogin,
                SMTPPassword: sSMTPPassword
        };
        ctrlWelcomeWizard.UpdateContactProfileViaWebAPI(CWriteUserContactProfileRequest);

        // We want to update our own cached settings too but we can do this separately
        var userCredentials = TriSysApex.LoginCredentials.UserCredentials();
        if (userCredentials && userCredentials.LoggedInUser)
        {
            var user = userCredentials.LoggedInUser;
            var contact = user.Contact;

            // Only update if different
            var sSetting = null;

            sSetting = $('#welcome-wizard-requirement-prefix').val();
            if (sSetting != TriSysApex.Cache.UserSettingManager.GetValue("RequirementReferencePrefix"))
                TriSysApex.Cache.UserSettingManager.SetValue("RequirementReferencePrefix", sSetting);

            sSetting = $('#welcome-wizard-placement-prefix').val();
            if (sSetting != TriSysApex.Cache.UserSettingManager.GetValue("PlacementReferencePrefix"))
            {
                TriSysApex.Cache.UserSettingManager.SetValue("PlacementReferencePrefix", sSetting);
            }

            sSetting = $('#welcome-wizard-smtp-server-address').val();
            if (sSetting != TriSysApex.Cache.UserSettingManager.GetValue("SMTPServerAddress"))
            {
                TriSysApex.Cache.UserSettingManager.SetValue("SMTPServerAddress", sSetting);
            }

            sSetting = $('#welcome-wizard-smtp-server-login').val();
            if (sSetting != TriSysApex.Cache.UserSettingManager.GetValue("SMTPServerLogin"))
            {
                TriSysApex.Cache.UserSettingManager.SetValue("SMTPServerLogin", sSetting);
            }

            sSetting = $('#welcome-wizard-smtp-server-password').val();
            if (sSetting != TriSysApex.Cache.UserSettingManager.GetValue("SMTPServerPassword"))
            {
                TriSysApex.Cache.UserSettingManager.SetValue("SMTPServerPassword", sSetting);
            }

            sSetting = $('#welcome-wizard-buffer').val();
            if (sSetting != TriSysApex.Cache.UserSettingManager.GetValue("BufferEMail"))
            {
                TriSysApex.Cache.UserSettingManager.SetValue("BufferEMail", sSetting);
            }

            sSetting = $('#welcome-wizard-twitter').val();
            if (sSetting != TriSysApex.Cache.UserSettingManager.GetValue("TwitterURL"))
            {
                TriSysApex.Cache.UserSettingManager.SetValue("TwitterURL", sSetting);
            }

            sSetting = $('#welcome-wizard-facebook').val();
            if (sSetting != TriSysApex.Cache.UserSettingManager.GetValue("FacebookURL"))
            {
                TriSysApex.Cache.UserSettingManager.SetValue("FacebookURL", sSetting);
            }

            sSetting = $('#welcome-wizard-linkedin').val();
            if (sSetting != TriSysApex.Cache.UserSettingManager.GetValue("LinkedInURL"))
            {
                TriSysApex.Cache.UserSettingManager.SetValue("LinkedInURL", sSetting);
            }
        }

        return true;
    },

    UpdateContactProfileViaWebAPI: function (CWriteUserContactProfileRequest)
    {
        var payloadObject = {};

        payloadObject.URL = "Contact/WriteLoggedInUserContactProfile";

        payloadObject.OutboundDataPacket = CWriteUserContactProfileRequest;

        payloadObject.InboundDataFunction = function (CWriteUserContactProfileResponse)
        {
            if (CWriteUserContactProfileResponse)
            {
                if (CWriteUserContactProfileResponse.Success)
                {
                    // Nothing visual to show as we should have been closed now
                    // We should however update the user cache of this users photo if it changed!
                    if (CWriteUserContactProfileResponse.PhotoURL)
                    {
                        var userCredentials = TriSysApex.LoginCredentials.UserCredentials();
                        var user = TriSysApex.Cache.UsersManager.UserFromId(userCredentials.LoggedInUser.UserId);
                        user.Photo = CWriteUserContactProfileResponse.PhotoURL;
                    }
                }
                else
                    TriSysApex.UI.errorAlert('ctrlWelcomeWizard.UpdateContactProfileViaWebAPI Error: ' + CCUserContactProfile.ErrorMessage);

                return;
            }

            TriSysApex.UI.ShowError('ctrlWelcomeWizard.UpdateContactProfileViaWebAPI Error: null response');
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.errorAlert('ctrlWelcomeWizard.UpdateContactProfileViaWebAPI: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    PostCodelookup: function()
    {
        var sPrefix = "welcome-wizard-";
        TriSysSDK.PostCode.Lookup(sPrefix + "PostCode", sPrefix + "Street",
                                    sPrefix + "City", sPrefix + "County", sPrefix + "Country");
    }
}

$(document).ready(function ()
{
    ctrlWelcomeWizard.Load();
});
