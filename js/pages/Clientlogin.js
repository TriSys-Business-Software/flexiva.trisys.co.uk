var ClientLogin =
{
    Load: function ()
    {
        // Load credentials from cookies and auto-login if necessary
        var sEMail = TriSysWebJobs.Security.CachedEMail();
        var sPassword = TriSysWebJobs.Security.CachedPassword();

        // Allow embedded credentials in the URL e.g. http.../?ClientLogin/gagagoogoo/sopra-steria-recruitment
        var sLoginAsPrefix = '#ReadOnlyRecruiterUser~';
        var fnLoginAsReadOnlyAgencyUserAlias = function (sEMail, sPassword)
        {
            // Perform client login using these credentials
            var TriSysCRMCredentialAccountTypeEnum_ReadOnlyRecruiterUser_Client = 9;

            TriSysWebJobs.ClientOrCandidateLogin.Submit(sEMail, sPassword, false, null, TriSysCRMCredentialAccountTypeEnum_ReadOnlyRecruiterUser_Client);
        };

        if (TriSysApex.Router.processWebJobsLoginURL(sLoginAsPrefix, fnLoginAsReadOnlyAgencyUserAlias))
            return;

        $('#txtClientEMail').val(sEMail);
        $('#txtClientPassword').val(sPassword);

        // Setup social login buttons
        ClientLogin.Social.AddEventHandlers();

        // We may be hiding social buttons
        TriSysWebJobs.Frame.ApplyDynamicFeaturesAndStyleAfterFormLoaded();

        // Capture enter key on password field
        $('#txtClientPassword').keyup(function (e)
        {
            if (e.keyCode == 13)
            {
                ClientLogin.LoginButtonClick();
            }
		});

		if (sEMail && sPassword) {
			// Commence auto-login sequence after a slight delay to allow framework to load on mobile devices
			setTimeout(ClientLogin.LoginButtonClick, (TriSysApex.Constants.iMillisecondsInSecond * 2));
		}
    },

    LoginButtonClick: function ()    // ClientLogin.LoginButtonClick
    {
        var sLoginEMail = $('#txtClientEMail').val();
        var sPassword = $('#txtClientPassword').val();
        var bRememberMe = TriSysSDK.CShowForm.CheckBoxValue('chkRememberMe');

        TriSysWebJobs.ClientLogin.Submit(sLoginEMail, sPassword, bRememberMe);
    },

    ForgottenPassword: function ()   // ClientLogin.ForgottenPassword
    {
        TriSysApex.FormsManager.OpenForm(TriSysWebJobs.Constants.ClientForgottenPasswordForm, 0, true);
    },

    Register: function ()            // ClientLogin.Register
    {
        TriSysApex.FormsManager.OpenForm(TriSysWebJobs.Constants.ClientRegistrationForm, 0, true);
    },

    Social:
    {
        AddEventHandlers: function ()
        {
            // Reset all socials in case we did a specific association (ctrlSocialLogin.js)
            TriSysWebJobs.SocialNetwork.CurrentNetworks = TriSysWebJobs.SocialNetwork.AllNetworks;

			// Feb 2018: Load the .js BEFORE the user control .html
			var fnLoadControlHTML = function ()
			{
				// Load the control into the DIV, change the name of all internal DIV tags to be unique and populate
				TriSysApex.FormsManager.loadControlIntoDiv('ClientLogin-SocialNetworkButtons', 'ctrlSocialNetworkLoginButtons.html',
					function (response, status, xhr)
					{
						// Set callback on successful login
						ctrlSocialNetworkLoginButtons.OnSuccessfulLoginFunction = ClientLogin.Social.SendToWebAPI;
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
            TriSysWebJobs.ClientLogin.Submit(null, null, bRememberMe, CSocialNetworkLoginParameters);
        }
    }
};

$(document).ready(function ()
{
    ClientLogin.Load();
});