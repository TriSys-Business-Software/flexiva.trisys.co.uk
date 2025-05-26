var CandidateLogin =
{
    Load: function()
    {
        // Load credentials from cookies and auto-login if necessary
        var sEMail = TriSysWebJobs.Security.CachedEMail();
        var sPassword = TriSysWebJobs.Security.CachedPassword();

        // Allow embedded credentials in the URL e.g. http.../?CandidateLogin/gagagoogoo/sopra-steria-recruitment
        var sLoginAsPrefix = '#ReadOnlyRecruiterUser~';
        var fnLoginAsReadOnlyAgencyUserAlias = function (sEMail, sPassword)
        {
            // Perform candidate login using these credentials
            var TriSysCRMCredentialAccountTypeEnum_ReadOnlyRecruiterUser_Candidate = 10;

            TriSysWebJobs.ClientOrCandidateLogin.Submit(sEMail, sPassword, false, null, TriSysCRMCredentialAccountTypeEnum_ReadOnlyRecruiterUser_Candidate);
        };

        if (TriSysApex.Router.processWebJobsLoginURL(sLoginAsPrefix, fnLoginAsReadOnlyAgencyUserAlias))
            return;

        $('#txtCandidateEMail').val(sEMail);
        $('#txtCandidatePassword').val(sPassword);

        // Setup social login buttons
        CandidateLogin.Social.AddEventHandlers();

        // We may be hiding social buttons
        TriSysWebJobs.Frame.ApplyDynamicFeaturesAndStyleAfterFormLoaded();

        // Capture enter key on password field
        $('#txtCandidatePassword').keyup(function (e)
        {
            if (e.keyCode == 13)
            {
                CandidateLogin.LoginButtonClick();
            }
        });

        // Hack API to debug
        //TriSysAPI.Constants.SecureURL = 'http://localhost:61333/';

		if (sEMail && sPassword)
		{
			// Commence auto-login sequence after a slight delay to allow framework to load on mobile devices
			setTimeout(CandidateLogin.LoginButtonClick, (TriSysApex.Constants.iMillisecondsInSecond * 2));
		}
    },

    LoginButtonClick: function ()    // CandidateLogin.LoginButtonClick
    {
        var sLoginEMail = $('#txtCandidateEMail').val();
        var sPassword = $('#txtCandidatePassword').val();
        var bRememberMe = TriSysSDK.CShowForm.CheckBoxValue('chkRememberMe');
        
        TriSysWebJobs.CandidateLogin.Submit(sLoginEMail, sPassword, bRememberMe);
    },

    ForgottenPassword: function ()   // CandidateLogin.ForgottenPassword
    {
        TriSysApex.FormsManager.OpenForm(TriSysWebJobs.Constants.CandidateForgottenPasswordForm, 0, true);
    },

    Register: function ()            // CandidateLogin.Register
    {
        TriSysApex.FormsManager.OpenForm(TriSysWebJobs.Constants.CandidateRegistrationForm, 0, true);
    },

    Social:
    {
        AddEventHandlers: function()
        {
            // Reset all socials in case we did a specific association (ctrlSocialLogin.js)
            TriSysWebJobs.SocialNetwork.CurrentNetworks = TriSysWebJobs.SocialNetwork.AllNetworks;

			// Feb 2018: Load the .js BEFORE the user control .html
			var fnLoadControlHTML = function ()
			{
				// Load the control into the DIV, change the name of all internal DIV tags to be unique and populate
				TriSysApex.FormsManager.loadControlIntoDiv('CandidateLogin-SocialNetworkButtons', 'ctrlSocialNetworkLoginButtons.html',
					function (response, status, xhr)
					{
						// Set callback on successful login
						ctrlSocialNetworkLoginButtons.OnSuccessfulLoginFunction = CandidateLogin.Social.SendToWebAPI;
					});
			};

			TriSysApex.WhiteLabelling.LoadJavascriptFile('js/pages/ctrlSocialNetworkLoginButtons.js', null, fnLoadControlHTML); 
        },

        // If the user has logged in with a social network, then send these details to the login Web API
        SendToWebAPI: function (provider_name, connection_token, user_token)
        {
            //TriSysApex.UI.ShowMessage(provider_name + ": " + connection_token + ": " + user_token);

            var CSocialNetworkLoginParameters =
            {
                ProviderName: provider_name,
                ConnectionToken: connection_token,
                UserToken: user_token
            };

            var bRememberMe = false;
            TriSysWebJobs.CandidateLogin.Submit(null, null, bRememberMe, CSocialNetworkLoginParameters);
        }
    }
};

$(document).ready(function ()
{
    CandidateLogin.Load();
});