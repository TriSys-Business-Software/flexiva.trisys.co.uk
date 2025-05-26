var AgencyUmbrellaLogin =
{
    Load: function()
    {
        // Load credentials from cookies and auto-login if necessary
        var sEMail = TriSysWebJobs.Security.CachedEMail();
        var sPassword = TriSysWebJobs.Security.CachedPassword();

        // Allow embedded credentials in the URL e.g. http.../?ClientLogin/gagagoogoo/sopra-steria-recruitment
        var sLoginAsPrefix = '#ReadOnlyRecruiterUser~';
        var fnLoginAsReadOnlyAgencyUserAlias = function (sEMail, sPassword)
        {
            // Perform agency/umblrella login using these credentials
            var TriSysCRMCredentialAccountTypeEnum_ReadOnlyRecruiterUser_AgencyUmbrella = 11;

            AgencyUmbrellaLogin.SubmitToWebAPI(sEMail, sPassword, false, TriSysCRMCredentialAccountTypeEnum_ReadOnlyRecruiterUser_AgencyUmbrella);
        };

        if (TriSysApex.Router.processWebJobsLoginURL(sLoginAsPrefix, fnLoginAsReadOnlyAgencyUserAlias))
            return;

        $('#txtAgencyUmbrellaEMail').val(sEMail);
        $('#txtAgencyUmbrellaPassword').val(sPassword);
    },

    LoginButtonClick: function()
    {
        var sLoginEMail = $('#txtAgencyUmbrellaEMail').val();
        var sPassword = $('#txtAgencyUmbrellaPassword').val();
        var bRememberMe = TriSysSDK.CShowForm.CheckBoxValue('chkRememberMe');

        AgencyUmbrellaLogin.Submit(sLoginEMail, sPassword, bRememberMe);
    },

    ForgottenPassword: function()
    {
        TriSysApex.FormsManager.OpenForm('AgencyForgottenPassword');
    },

    Submit: function (sLoginEMail, sPassword, bRememberMe)
    {
        // Validation
        var sMessage;
        if (!TriSysApex.LoginCredentials.validateEmail(sLoginEMail))
        {
            sMessage = TriSysSDK.Resources.Message("LoginButtonClick_EMail");
            TriSysApex.UI.ShowMessage(sMessage, TriSysWebJobs.Constants.ApplicationName);
            return;
        }

        if (!sPassword)
        {
            sMessage = TriSysSDK.Resources.Message("LoginButtonClick_Password");
            TriSysApex.UI.ShowMessage(sMessage, TriSysWebJobs.Constants.ApplicationName);
            return;
        }

        var TriSysCRMCredentialAccountTypeEnum_ThirdPartyAgencyUmbrella = 8;

        AgencyUmbrellaLogin.SubmitToWebAPI(sLoginEMail, sPassword, bRememberMe, TriSysCRMCredentialAccountTypeEnum_ThirdPartyAgencyUmbrella);
    },

    SubmitToWebAPI: function (sLoginEMail, sPassword, bRememberMe, eAccountType)
    {
        // We only work on-premise for a specific customer!
        var CSecurityControllerAuthenticateTriSysCRMCredentials = {
            CRMCredentialKey: TriSysWebJobs.Constants.AgencyUserLoginCredentialsToCRM,
            AccountType: eAccountType,
            AgencyContact_EMail: sLoginEMail,
            AgencyContact_Password: sPassword,
            CustomFolder: TriSysWebJobs.Agency.CustomerID
        };

        var fnPostLogin = function ()
        {
            // Store or remove login credential cookies
            TriSysWebJobs.Security.CacheLoginCredentialsAsCookies(sLoginEMail, sPassword, bRememberMe);

            // Display the logged in candidate details on the nav bar menu
            var sDataServicesKey = TriSysAPI.Session.DataServicesKey();

            // Go back to get the cached user settings to make life easier to draw her own
            // highly customised application layout/functions...
            TriSysApex.LoginCredentials.ReadLoggedInUserSettings(TriSysWebJobs.ClientOrCandidateLogin.AfterReadingLoggedInUserSettings);
        };

        var fnIncorrectLogin = function ()
        {
            var sLoginFailedMessage = TriSysSDK.Resources.Message("LoginButtonClick_Invalid");
            sLoginFailedMessage = sLoginFailedMessage.replace(/##EMail##/g, TriSysWebJobs.Agency.EMail);
            var sMessageTitle = TriSysWebJobs.Constants.ApplicationName + " Login";
            TriSysApex.UI.ShowMessage(sLoginFailedMessage, sMessageTitle);
        };

        // This is the same for all Apex logins: whether agency recruiter/user or candidate or client
        var bApexLoginCacheing = false;
		var additionalInstructions = {
			SuppressPopups: true,
			IncorrectCredentialsCallback: fnIncorrectLogin
		};
        TriSysApex.LoginCredentials.ValidateViaWebService(CSecurityControllerAuthenticateTriSysCRMCredentials, bApexLoginCacheing, fnPostLogin, null, additionalInstructions);
    }
};

$(document).ready(function ()
{
    AgencyUmbrellaLogin.Load();
});