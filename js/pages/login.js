var loginPage =
{
    Load: function()
    {
		var parts, sGUID;

        loginPage.HideSocialNetworkLoginButtons();
        loginPage.WhiteLabel();


        try
        {
            // If the link includes the hashtag 'register', show the register form instead of login
            if (window.location.hash === '#register' || window.location.hash === '#freetrial')
            {
                TriSysApex.FormsManager.OpenForm(TriSysApex.Constants.RegistrationForm, 0, true);
                return;
            }

            // If the link includes a GUID activation code, then start this business process
            var sActivatePrefix = '#activate~';
            if (window.location.hash && window.location.hash.indexOf(sActivatePrefix) >= 0)
            {
                parts = window.location.hash.split(sActivatePrefix);
                if (parts.length == 2)
                {
                    sGUID = parts[1];
                    loginPage.ActivatePrompt(sGUID);
                    return;
                }
            }

            var sCustomerPrefix = '#customer~';
            if (window.location.hash && window.location.hash.indexOf(sCustomerPrefix) >= 0)
            {
                parts = window.location.hash.split(sCustomerPrefix);
                if (parts.length == 2)
                {
                    sGUID = parts[1];
                    loginPage.SubmitCustomerConfirmationRequest(sGUID);
                    return;
                }
            }

            // If the link includes a GUID password reset code, then start this business process

			// Start debugging specific customer reset password
			//debugger;
			//TriSysApex.Constants.DeveloperSiteKey = "20140625-gl51-1231-wher-opuslaboris.";
			//TriSysAPI.Session.SetDeveloperSiteKey( TriSysApex.Constants.DeveloperSiteKey );
			//TriSysAPI.Constants.SecureURL = "http://localhost:61333/";
			// End override for testing

            var sResetPrefix = '#resetpassword~';
            if (window.location.hash && window.location.hash.indexOf(sResetPrefix) >= 0)
            {
                parts = window.location.hash.split(sResetPrefix);
                if (parts.length == 2)
                {
                    sGUID = parts[1];
                    TriSysApex.Forms.Login.ValidateResetPassword(sGUID);
                    return;
                }
            }

            // If the link includes an encrypted set of credentials for internal use only, then start this business process
            var sSupportLoginPrefix = '#supportlogin~';
            if (window.location.hash && window.location.hash.indexOf(sSupportLoginPrefix) >= 0)
            {
                parts = window.location.hash.split(sSupportLoginPrefix);
                if (parts.length == 2)
                {
                    var sEMailAndPassword = parts[1];
                    loginPage.SupportLogin(sEMailAndPassword);
                    return;
                }
            }
            
			// 21 Feb 2019: This code lives in the intelligent routing subsystem.
            //// If the link includes a specific Web API endpoint, use this
            //var sWebAPIPrefix = '#webapi~';
            //if (window.location.hash && window.location.hash.indexOf(sWebAPIPrefix) >= 0)
            //{
            //    var parts = window.location.hash.split(sWebAPIPrefix);
            //    if (parts.length == 2)
            //    {
            //        // 19 Sep 2017: Allow BOTH URL And Key e.g. #webapi~https://83.151.214.124/api/,b40859ae-bada-4954-ace9-steriarecrui
            //        var sWebAPI = parts[1];
            //        if (sWebAPI)
            //        {
            //            if(sWebAPI.indexOf(",") > 0)
            //            {
            //                parts = sWebAPI.split(",");
            //                sWebAPI = parts[0];
            //                TriSysApex.Constants.DeveloperSiteKey = parts[1];       // e.g. 4a6b22ae-bd7d-4d2b-98c3-nexereconsul
            //                TriSysAPI.Session.SetDeveloperSiteKey(TriSysApex.Constants.DeveloperSiteKey);
            //            }
            //        }

            //        TriSysAPI.Constants.SecureURL = sWebAPI;       // e.g. http://localhost:61333/
            //    }
            //}

            // 04 Sep 2017: allow testing of specific API keys
            var sAPIKeyPrefix = '#apikey~';
            if (window.location.hash && window.location.hash.indexOf(sAPIKeyPrefix) >= 0)
            {
                parts = window.location.hash.split(sAPIKeyPrefix);
                if (parts.length == 2)
                {
                    TriSysApex.Constants.DeveloperSiteKey = parts[1];       // e.g. 4a6b22ae-bd7d-4d2b-98c3-nexereconsul
                    TriSysAPI.Session.SetDeveloperSiteKey(TriSysApex.Constants.DeveloperSiteKey);
                }
			}

			// April 2018: Garry, no more fucking routing hacks OK?
			// The intelligent routing (joke, right?) is far too flakey to mess around with.
			// Decided that the best mechanism to extend auto-logins is to use a dedicated redirector page per white label app.
			// The page can thus override the complex routing.

            // 15 Nov 2022: Sorry Garry!
            var sURL = window.location.href;
            var bAutoLogin = false;
            var iIndexOfContactPreviewPrefix = sURL.toLowerCase().indexOf(TriSysApex.Constants.ContactPreviewPrefix);
            if (iIndexOfContactPreviewPrefix > 0)
            {
                // 14 Nov 2022: Contact Preview in separate window

                // We want our own custom page to be the 'home page'
                TriSysApex.Forms.Configuration.Pages.forEach(function (page) {
                    if (page.PostLoginPageForUser)
                        page.PostLoginPageForUser = false;
                });

                // Inject this into forms.json?
                var sContactPreviewModeFormName = "ContactPreviewMode";
                TriSysApex.Forms.Configuration.Pages.push({
                    "FormName": sContactPreviewModeFormName,
                    "EntityName": null,
                    "ImagePath": "fa fa-plug",
                    "Caption": "Contact Preview",
                    "ViewName": sContactPreviewModeFormName + ".html",
                    "MustBeLoggedIn": false,
                    "ShowWhenLoggedIn": false,
                    "Visible": true,
                    "Style": "display: none;",
                    "HideWhenNotLoggedIn": true,
                    "ParentNavBarMenuID": "navBar-Help",
                    "PostLoginPageForUser": true
                });
                
                // Scrape information from the URL
                var sBase64 = sURL.substr(iIndexOfContactPreviewPrefix + TriSysApex.Constants.ContactPreviewPrefix.length);
                var jsonObject = JSON.parse($.base64.decode(sBase64));
                TriSysApex.EntityPreview.Contact._MostRecentContactId = jsonObject.ContactId;                       // The contact we should show initially
                TriSysApex.EntityPreview.Contact._MostRecentSearchCriteriaJson = jsonObject.SearchCriteriaJson;     // The cv hits we should show initially

                // Set data services key from main app
                TriSysAPI.Session.SetDataServicesKey(jsonObject.DataServicesKey);

                // API Key also needs to come from URL
                TriSysAPI.Session.SetDeveloperSiteKey(jsonObject.SiteKey);

                // ..and location of Web API
                TriSysAPI.Constants.SecureURL = jsonObject.SecureURL;

                // 31 May 2024: Are we the browser extension?
                debugger;
                TriSysApex.EntityPreview.Contact.Data.BrowserExtension = jsonObject.BrowserExtension;

                $('#app-caption-fixed-top').hide();     // Purely cosmetic
                TriSysApex.UI.ShowWait(null, "Loading Contact Preview...");

                // Redirect page now!
                TriSysApex.FormsManager.OpenForm(sContactPreviewModeFormName);
                return;
            }
			
            // If we get to here, we load cookies and commence auto-login 
            loginPage.LoadIfNotURLDirectives();
        }
        catch (err)
        {
            alert(err);
        }
    },

    // If we are an app or mobile device, hide these as they do not work (April 2016)
    HideSocialNetworkLoginButtons: function()
    {
        var fnHideSocials = function()
        {
            $('#social-login-buttons').hide();
        };

        // Chrome takes some time to register itself so let this happen
        var fnTest = function ()
        {
            // #social-login-buttons
            var bInChromeAppMode = TriSysApex.Environment.isChromeStandaloneApp();
            var bWindowsStoreApp = TriSysApex.Environment.isWindowsStoreApp();
            var bPhoneApp = TriSysApex.Device.isPhone();

            if (bInChromeAppMode || bWindowsStoreApp || bPhoneApp)
                fnHideSocials();
        };

        if (TriSysApex.Constants.WhiteLabelled || TriSysPhoneGap.Enabled())
            fnHideSocials();
        else
            setTimeout(fnTest, 1000);

        if (TriSysPhoneGap.Enabled())
            $('#login-form-top-block').hide();
    },

    LoadIfNotURLDirectives: function ()
    {
        // Capture enter key on password field
        $('#txtLoginPassword').keyup(function (e)
        {
            if (e.keyCode == 13)
            {
                //alert($('#txtLoginPassword').val());
                TriSysWeb.Security.LoginButtonClick();
            }
        });

        setTimeout(loginPage.Social.AddEventHandlers, 10);

        // Load the default credentials from last time
        setTimeout(TriSysWeb.Pages.Login.Load, 50);
    },

    // Get the activation details prior to conducting an auto-login procedure
    ActivatePrompt: function(sGUID)
    {
        // Remove all session state about the logged in user just in case and for testing
        TriSysApex.LoginCredentials.ClearCachedCredentials();
        TriSysApex.Cache.Clear();

        var payloadObject = {};

        var ActivateUserAccountPromptRequest = { GUID: sGUID };

        payloadObject.URL = "Users/ActivateUserAccountPrompt";

        payloadObject.OutboundDataPacket = ActivateUserAccountPromptRequest;

        payloadObject.InboundDataFunction = function (ActivateUserAccountPromptResponse)
        {
            TriSysApex.UI.HideWait();

            if (ActivateUserAccountPromptResponse)
            {
                if (ActivateUserAccountPromptResponse.Success)
                {
                    // Display the prompt
                    loginPage.ActivationPopup(sGUID, ActivateUserAccountPromptResponse.EMail, ActivateUserAccountPromptResponse.Trial);

                    return;
                }
            }

            var fnLogin = function ()
            {
                loginPage.LoadIfNotURLDirectives();
                return true;
            };

            // Activation code has been re-used or is invalid
            var sMessage = "Invalid activation code." + "<br />" + "Would you like to login?";
            //TriSysApex.UI.questionYesNo(sMessage, "Activate Now", "Yes", fnLogin, "No");
			fnLogin();		// 01 April 2020: just show them the login screen
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('loginPage.Activate: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Activating...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    ActivationEMail: null,
    GUID: null,

    ActivationPopup: function (sGUID, sEMail, bTrial)
    {
        loginPage.GUID = sGUID;
        loginPage.ActivationEMail = sEMail;

        // Allow the user to connect after the enter their own password
        var fnLogin = function(sNewPassword)
        {
            var CChangeLoginCredentials = {

                EMail: sEMail,
                NewPassword: sNewPassword,
                Activate: true,
                GUID: sGUID
            };

            loginPage.SubmitUserActivationCompletionRequest(CChangeLoginCredentials);
            return true;
        };

        var fnCancel = function()
        {
            return true;
        };

        // OLD
        var sWhat = (bTrial ? "Free Trial" : "Live Subscription");
        //var sMessage = "Thank you for confirming your " + sWhat.toLowerCase() + ".";
        //TriSysApex.UI.questionYesNo(sMessage, sWhat + " Confirmed", "Login", fnLogin, "Cancel", fnCancel);

        var fnCallback = function ()
        {
            var CChangeLoginCredentials = ctrlChangeLoginCredentials.Validate(true);
            if (CChangeLoginCredentials)
            {
                fnLogin(CChangeLoginCredentials.NewPassword);
                return true;
            }
        };

        TriSysApex.Forms.Login.resetPasswordData = { GUID: sGUID, EMail: sEMail };

        var parametersObject = new TriSysApex.UI.ShowMessageParameters();
        parametersObject.Title = sWhat;
        parametersObject.Image = "gi-lock";

        parametersObject.ContentURL = TriSysApex.Constants.UserControlFolder + "ctrlChangeLoginCredentials.html";
        parametersObject.ButtonRightText = "Cancel";
        parametersObject.ButtonRightVisible = true;
        parametersObject.ButtonRightFunction = fnCancel;
        parametersObject.ButtonLeftText = "Save";
        parametersObject.ButtonLeftVisible = true;
        parametersObject.ButtonLeftFunction = fnCallback;

        TriSysApex.UI.PopupMessage(parametersObject);

    },

    OnSaveButtonClick: function ()
    {
        // Validate the data entry prior to submission
        ctrlChangeLoginCredentials.ActivateUserAccountButtonClick(loginPage.SubmitUserActivationCompletionRequest);

        return false;
    },

    SubmitUserActivationCompletionRequest: function (CChangeLoginCredentials)
    {
        var payloadObject = {};

        CChangeLoginCredentials.GUID = loginPage.GUID;
        CChangeLoginCredentials.Activate = true;

        // Call the API to submit the data to the server
        payloadObject.URL = "Users/ActivateUserAccountConfirmation";

        payloadObject.OutboundDataPacket = CChangeLoginCredentials;

        payloadObject.InboundDataFunction = function (CActivateUserAccountConfirmationResponse)
        {
            TriSysApex.UI.HideWait();

            if (CActivateUserAccountConfirmationResponse)
            {
                if (CActivateUserAccountConfirmationResponse.Success)
                {
                    // Close this modal dialogue
                    TriSysApex.UI.CloseModalPopup();

                    // Passwords have been changed on the server so commence the login sequence
                    setTimeout(function ()
                    {
                        loginPage.CommenceAutoLoginSequenceAfterActivation(CActivateUserAccountConfirmationResponse);

                    }, 50);

                    return;
                }
                else
                    TriSysApex.UI.ShowMessage(CActivateUserAccountConfirmationResponse.ErrorMessage);
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('loginPage.SubmitUserActivationCompletionRequest: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Activating...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

	SubmitCustomerConfirmationRequest: function(sGUID)
	{
		// Up until 29 October 2018, we used to do free trials, but we have now closed the loop
		// loginPage.SubmitCustomerFreeTrialConfirmationRequest(sGUID);
		loginPage.ConfirmCustomerRegistrationRequest(sGUID);
	},

	ConfirmCustomerRegistrationRequest: function (sGUID)
    {
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
                    // Just move to start login from cookies
                    TriSysWeb.Pages.Login.Load();
                    return;
                }
                if (bSuccess)
                {
					var bResourcer = ConfirmCustomerRegistrationResponse.Plan == "Resourcer";

					if(bResourcer)
					{
						// User has confirmed their e-mail address, so commence provisioning without payment
						setTimeout(function ()
						{
							loginPage.CommenceProvisioningAfterConfirmingRegistration(sGUID, ConfirmCustomerRegistrationResponse,
																						"Resourcer Registration Confirmed");

						}, 50);
					}
					else
					{
						// Show the payment dialogue for Apex
						setTimeout(function ()
						{
							loginPage.CommencePaymentCaptureAfterConfirmingRegistration(sGUID, ConfirmCustomerRegistrationResponse);

						}, 50);
					}
                }
                else
                    TriSysApex.UI.ShowMessage(ConfirmCustomerRegistrationResponse.ErrorMessage);
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('loginPage.ConfirmCustomerRegistrationRequest: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Confirming Registration...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    SubmitCustomerFreeTrialConfirmationRequest: function (sGUID)
    {
        var payloadObject = {};

        var CCustomerFreeTrialConfirmationRequest = { GUID: sGUID };

        payloadObject.URL = "Users/CustomerFreeTrialConfirmation";

        payloadObject.OutboundDataPacket = CCustomerFreeTrialConfirmationRequest;

        payloadObject.InboundDataFunction = function (CCustomerFreeTrialConfirmationResponse)
        {
            TriSysApex.UI.HideWait();

            if (CCustomerFreeTrialConfirmationResponse)
            {
                var bSuccess = CCustomerFreeTrialConfirmationResponse.Success;
                if (!bSuccess && CCustomerFreeTrialConfirmationResponse.ErrorMessage.indexOf("Activation code expired or not found") >= 0)
                {
                    // Just move to start login from cookies
                    TriSysWeb.Pages.Login.Load();
                    return;
                }
                if (bSuccess)
                {
                    // Commence auto login sequence
                    setTimeout(function ()
                    {
                        loginPage.CommenceAutoLoginSequenceAfterActivation(CCustomerFreeTrialConfirmationResponse);

                    }, 50);

                    return;
                }
                else
                    TriSysApex.UI.ShowMessage(CCustomerFreeTrialConfirmationResponse.ErrorMessage);
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('loginPage.SubmitCustomerFreeTrialConfirmationRequest: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Activating...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    CommenceAutoLoginSequenceAfterActivation: function (CActivateUserAccountConfirmationResponse)
    {
        var sEMail = CActivateUserAccountConfirmationResponse.EMail;
        var sPassword = CActivateUserAccountConfirmationResponse.Password;

        $('#txtLoginEMail').val(sEMail);
        $('#txtLoginPassword').val(sPassword);

        TriSysWeb.Security.LoginButtonClick();
    },

    LoginButtonClick: function()
    {
        TriSysWeb.Security.LoginButtonClick();
    },

    ForgottenPassword: function()
    {
        TriSysApex.FormsManager.OpenForm(TriSysApex.Constants.ForgottenPasswordForm, 0, true);
    },

    Register: function ()
    {
        TriSysApex.FormsManager.OpenForm(TriSysApex.Constants.RegistrationForm, 0, true);
    },

    SupportLogin: function (sEMailAndPassword)
    {
        // Remove all session state about the logged in user just in case and for testing
        TriSysApex.LoginCredentials.ClearCachedCredentials();
        TriSysApex.Cache.Clear();

        eMailAndPassword = TriSysWeb.Security.DecryptBase64Credentials(sEMailAndPassword);

        $('#txtLoginEMail').val(eMailAndPassword.EMail);
        $('#txtLoginPassword').val(eMailAndPassword.Password);

        TriSysWeb.Security.LoginButtonClick();
    },

    Social:
    {
        AddEventHandlers: function ()
        {
            // Do nothing if we are not visible
            if (TriSysApex.Constants.WhiteLabelled || TriSysPhoneGap.Enabled())
                return;


            // Reset all socials in case we did a specific association (ctrlSocialLogin.js)
            TriSysWebJobs.SocialNetwork.CurrentNetworks = TriSysWebJobs.SocialNetwork.AllNetworks;

			// Feb 2018: Load the .js BEFORE the user control .html
			var fnLoadControlHTML = function ()
			{
				// Load the control into the DIV, change the name of all internal DIV tags to be unique and populate
				TriSysApex.FormsManager.loadControlIntoDiv('loginPage-SocialNetworkButtons', 'ctrlSocialNetworkLoginButtons.html',
					function (response, status, xhr)
					{
						// Set callback on successful login
						ctrlSocialNetworkLoginButtons.OnSuccessfulLoginFunction = loginPage.Social.SendToWebAPI;                       
					});
			};

			TriSysApex.WhiteLabelling.LoadJavascriptFile('js/pages/ctrlSocialNetworkLoginButtons.js', null, fnLoadControlHTML); 			
        },

        // If the user has logged in with a social network, then send these details to the login Web API
        SendToWebAPI: function (provider_name, connection_token, user_token)
        {
            debugger;
            //TriSysApex.UI.ShowMessage(provider_name + ": " + connection_token + ": " + user_token);

            var CSocialNetworkLoginParameters =
            {
                ProviderName: provider_name,
                ConnectionToken: connection_token,
                UserToken: user_token
            };

            TriSysWeb.Security.LoginButtonClick(CSocialNetworkLoginParameters);
        }
    },

    WhiteLabel: function ()
    {
        // If white labelling, do not allow registration as this is highly Apex specific
		var bInDev = false;	// TriSysApex.Environment.isDeployedInTestMode(); Trying web jobs stuff which did not work!

        if (TriSysApex.Constants.WhiteLabelled || bInDev)
        {
			var bResourcer = TriSysApex.Resourcer.isResourcerWebSite();

			if(!bResourcer)
				$('#btn-register').hide();

            // Also callback any custom login code to tweak this form
            try
            {
                ApexCustomPostLoadModule.LoginFormLoaded();

            } catch (e)
            {
                // Not too worried!
            }
        }
    },

	// Capture payment from customer after they have confirmed their e-mail address
	CommencePaymentCaptureAfterConfirmingRegistration: function(sGUID, ConfirmCustomerRegistrationResponse)
	{
		var parametersObject = new TriSysApex.UI.ShowMessageParameters();

        parametersObject.Title = "Subscription Provisioning";
        parametersObject.Image = "gi-gbp";
        parametersObject.Maximize = true;
        parametersObject.CloseTopRightButton = true;

        parametersObject.ContentURL = TriSysApex.CustomFormsAndComponents.UserControlPath("ctrlPaymentGateway.html");

		// Feed in the payment URL when loaded
		parametersObject.OnLoadCallback = function ()
        {
            ctrlPaymentGateway.Load(sGUID, ConfirmCustomerRegistrationResponse);
			
			// Positional bug
			loginPage.FixModalPositioning();			
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

	// Customer has confirmed their e-mail address for this 'free' service so commence provisioning
	CommenceProvisioningAfterConfirmingRegistration: function(sGUID, ConfirmCustomerRegistrationResponse, sTitle)
	{
		var parametersObject = new TriSysApex.UI.ShowMessageParameters();

        parametersObject.Title = sTitle;
        parametersObject.Image = "fa-check";
        //parametersObject.Maximize = true;
		parametersObject.Maximize = false;
		parametersObject.CloseTopRightButton = true;

		//parametersObject.Top = 50;
		var iWidth = $(window).width();
		if(!TriSysApex.Device.isPhone())
			iWidth /= 2;
		parametersObject.Width = iWidth;
		parametersObject.Draggable = true;
        
        parametersObject.ContentURL = TriSysApex.CustomFormsAndComponents.UserControlPath("ctrlProvisioningProgress.html");

		// Feed in the payment URL when loaded
		parametersObject.OnLoadCallback = function ()
        {
            ctrlProvisioningProgress.Load(sGUID, ConfirmCustomerRegistrationResponse);

			// Positional bug
			loginPage.FixModalPositioning();			
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

	// Called in parametersObject.OnLoadCallback to solve inconsistent position of modal
	FixModalPositioning: function()
	{
		var regular = $('#trisys-modal-regular');
		var modal = $('#trisys-modal-dialogue');
		var bDraggable = regular.hasClass('ui-draggable');
		if(bDraggable)
			modal.css('top', '950px');
		else
			modal.css('top', '0px');
	}
};

$(document).ready(function ()
{
    loginPage.Load();
});



