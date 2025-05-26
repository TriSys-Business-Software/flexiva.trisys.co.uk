var ctrlUserOptions =
{
    Load: function()
    {
        // 04 Sep 2023: Called in support portal to re-use functions.
        if (!ctrlUserOptions.isApexUserOptionsForm())
            return;

        // 07 Feb 2023: We are all grown up!
        // Remember to load these widgets BEFORE TriSysApex.UserOptions.Load() below!
        TriSysSDK.CShowForm.HTMLFieldsCodeInjection();

        TriSysSDK.EntityFormTabs.AddClickEventHandlers('user-options-tab-nav-horizontal', true);

        // 09 Jan 2024: Have to delay this because the first tabs scrolls to the bottom for some reason!
        setTimeout(function () { TriSysSDK.Controls.Button.Click('useroptions-form-tab-forms-behaviour'); },
            ctrlUserOptions.Constants.DelayClickingTabsToPreventScrolling);

        // 01 Feb 2023
		ctrlUserOptions.GatherAsynchronousAppSettingsForDisplay();

		TriSysProUI.InitialiseThemesForUserEvents();

        // Initialize Select2
        $('.select-select2').select2();

		// We have widgets too!
		ctrlUserOptions.InitialiseWidgets();

        // 07 Feb 2023
		ctrlUserOptions.PopulateGridPagerPosition();

        // Business functionality
        TriSysApex.UserOptions.Load();
		ctrlUserOptions.UpdateEvents();

        // Show actual colors
        ctrlUserOptions.DisplayThemeColours();

        ctrlUserOptions.DisplayLoginEMail();
        ctrlUserOptions.SMTPButtons();

        ctrlUserOptions.GridManagementResetButtonSetup();

        ctrlUserOptions.Social.DisplayStatus();
        ctrlUserOptions.Social.AddEventHandlers();

        ctrlUserOptions.Language.Load();

        ctrlUserOptions.DesignerThemes.Load();

        // 29 Mar 2023: Disabled
        //ctrlUserOptions.DetermineIf2FAEnabled(true);

        ctrlUserOptions.LoadFonts();
        ctrlUserOptions.LoadFontWeights();

        // 28 Nov 2022
        ctrlUserOptions.CloudSync.Load();

        // 01 May 2024
        ctrlUserOptions.TaskSettings.Load();
    },

    // 01 Feb 2023: We make multiple async calls to Web API to gather data, 
    // so made this centralised.
    GatherAsynchronousAppSettingsForDisplay: function()
    {
        // 25 Apr 2022: Asynchronous
        var elemAppSettings = $('#divAppSettings');
        TriSysApex.UserOptions.SystemSettings(
            function (sHTML)
            {
                elemAppSettings.html(sHTML + '<br />');

                // Having read these cached settings, now get additional settings by successive API calls and append
                ctrlUserOptions.ReadLicenseInformation(
                    function (license)
                    {
                        ctrlUserOptions.AppendLicenseInformation(elemAppSettings, license);
                    }
                );
            });
    },

    DisplayThemeColours: function()
    {
        $('#user-options-themed-border').css('color', TriSysProUI.ThemedBorder());
        $('#user-options-themed-background').css('color', TriSysProUI.ThemedBackground());
        $('#user-options-themed-background').css('background-color', TriSysProUI.ThemedAlternativeBackColor());
        $('#user-options-themed-navbar').css('background-color', TriSysProUI.NavBarInverseColour());
		$('#user-options-themed-navbar-light').css('background-color', TriSysProUI.ThemedSidebarBackgroundLight(0.25));

		if (TriSysApex.Constants.WhiteLabelPreventThemeChange)
		{
			// Feb 2018 - allow white-label.json setting to override
			$('#user-options-themes-block').hide();
			$('#user-options-pagestyle-block').hide();
		}
    },

    DisplayLoginEMail: function ()
    {
        var userCredentials = TriSysApex.LoginCredentials.UserCredentials();
        if (userCredentials && userCredentials.LoggedInUser)
        {
            var sEMail = userCredentials.LoggedInUser.FullName;
            $('#login-email').html(sEMail);

            var btn = $('#change-login-credentials');
            btn.show();
            btn.on('click', ctrlUserOptions.ChangeLoginCredentials)
        }
    },

    ChangeLoginCredentials: function()
    {
        var parametersObject = new TriSysApex.UI.ShowMessageParameters();
        parametersObject.Title = "Change Login Credentials";
        parametersObject.Image = "gi-lock";

        parametersObject.ContentURL = TriSysApex.Constants.UserControlFolder + "ctrlChangeLoginCredentials.html";
        parametersObject.ButtonRightText = "Cancel";
        parametersObject.ButtonRightVisible = true;
        parametersObject.ButtonLeftText = "Save";
        parametersObject.ButtonLeftVisible = true;
        parametersObject.ButtonLeftFunction = ctrlUserOptions.OnSaveButtonClick;

        TriSysApex.UI.PopupMessage(parametersObject);
    },

    OnSaveButtonClick: function()
    {
        var fnCallback = function (sNewEMail)
        {
            $('#login-email').html(sNewEMail);
        };

        ctrlChangeLoginCredentials.SaveLoginCredentialsButtonClick(fnCallback);

        return false;
    },

    GridManagementResetButtonSetup: function ()
    {
        var btn = $('#reset-grid-layouts');
        btn.on('click', ctrlUserOptions.GridManagementReset);
    },

    GridManagementReset: function ()
    {
        TriSysSDK.Grid.Persistence.DeleteAll();
    },

    SMTPButtons: function()
    {
        var btn = $('#test-send-smtp-email');
        btn.on('click', ctrlUserOptions.TestSMTPSend);

        var btnSetPassword = $('#smtp-server-password-button');
        btnSetPassword.on('click', ctrlUserOptions.ChangeSMTPPassword);
    },

    ChangeSMTPPassword: function()
    {
        var sSMTPServerAddress = $('#smtp-server-address').val();
        var sSMTPServerLogin = $('#smtp-server-login').val();

        if (!sSMTPServerAddress || !sSMTPServerLogin)
        {
            var sMessage = "You have not specified your own personal SMTP server and login. Please set these before setting your password.";
            TriSysApex.UI.ShowMessage(sMessage);
            return;
        }

        var parametersObject = new TriSysApex.UI.ShowMessageParameters();
        parametersObject.Title = "Change SMTP Password";
        parametersObject.Image = "fa-lock";

        parametersObject.ContentURL = TriSysApex.Constants.UserControlFolder + "ctrlChangeSMTPPassword.html";
        parametersObject.ButtonRightText = "Cancel";
        parametersObject.ButtonRightVisible = true;
        parametersObject.ButtonRightFunction = ctrlUserOptions.RollbackSMTPPasswordChange;
        parametersObject.ButtonLeftText = "Save";
        parametersObject.ButtonLeftVisible = true;
        parametersObject.ButtonLeftFunction = ctrlUserOptions.VerifySMTPPasswordChange;

        TriSysApex.UI.PopupMessage(parametersObject);
    },

    // If the user cancels the SMTP password change, then revert back to the original
    RollbackSMTPPasswordChange: function()
    {
        var sExistingSMTPPassword = $('#smtp-server-password').val();
        TriSysApex.Cache.UserSettingManager.SetValue("SMTPServerPassword", sExistingSMTPPassword);
        return true;
    },

    VerifySMTPPasswordChange: function()
    {
        var sExistingSMTPPassword = $('#smtp-server-password').val();
        var sPassword = $('#change-smtp-password-password').val();
        var sPasswordConfirmation = $('#change-smtp-password-password-confirmation').val();

        var sError = null, iMinLength = 6;
        if (!sPassword)
            sError = "Please enter a password.";
        else if (sPassword.length < iMinLength)
            sError = "Passwords must be at least " + iMinLength + " characters in length";
        else if (sPassword != sPasswordConfirmation)
            sError = "Passwords do not match";
        else if (sPassword == sExistingSMTPPassword)
            sError = "New password is the same as your existing one";

        if(sError)
        {
            TriSysApex.UI.ShowMessage(sError);
            return false;
        }

        // Update the new SMTP password in the database to be used in the SMTP send
        TriSysApex.Cache.UserSettingManager.SetValue("SMTPServerPassword", sPassword);

        // Send the test e-mail
        var options =
        {
            SendPasswordChangeConfirmCode: true,
            Callback: function () { ctrlUserOptions.ConfirmSMTPCodePrompt(sPassword); },
            WaitingMessage: "Sending E-Mail"
        };
        ctrlUserOptions.TestSMTPSend(options);       
    },

    ConfirmSMTPCodePrompt: function(sNewPassword)
    {
        var sMessage = "Your SMTP password has been temporarily changed in order to verify that you can receive an e-mail" +
                        " containing your confirmation code." + "<br/>" +
                        "This e-mail has now been sent to you." + "<br/>" +
                        "When you receive this, enter the code below:";

        var fnConfirmCode = function (sCode)
        {
            // Call Web API to confirm that this is the last code I was sent
            var payloadObject = {};

            payloadObject.URL = "Customer/ConfirmSMTPPasswordChangeCode";
            payloadObject.OutboundDataPacket = { Code: sCode };

            payloadObject.InboundDataFunction = function (CConfirmSMTPPasswordChangeCodeResponse)
            {
                TriSysApex.UI.HideWait();

                if (CConfirmSMTPPasswordChangeCodeResponse)
                {
                    if (CConfirmSMTPPasswordChangeCodeResponse.Success)
                    {
                        // Code has been confirmed
                        $('#smtp-server-password').val(sNewPassword);       // Upgrade old password to new one
                        setTimeout(TriSysApex.UI.CloseModalPopup, 10);      // Close outer confirm popup
                        setTimeout(TriSysApex.UI.CloseModalPopup, 100);     // Close inner password popup
                        var fnGlory = function () {
                            TriSysApex.UI.ShowMessage("Your SMTP password has been changed.");
                        };
                        setTimeout(fnGlory, 200);                           // Bask in glory popup
                    }
                    else
                        TriSysApex.UI.ShowMessage(CConfirmSMTPPasswordChangeCodeResponse.ErrorMessage);

                    return;
                }
            };

            payloadObject.ErrorHandlerFunction = function (request, status, error) {
                TriSysApex.UI.HideWait();
                TriSysApex.UI.errorAlert('ctrlUserOptions.ConfirmSMTPCodePrompt: ' + status + ": " + error + ". responseText: " + request.responseText);
            };

            var sSending = "Verifying Code";
            TriSysApex.UI.ShowWait(null, sSending + "...");
            TriSysAPI.Data.PostToWebAPI(payloadObject);
        };

        var options = { Label: "Code", SaveButtonText: "Confirm", Instructions: sMessage };
        TriSysApex.ModalDialogue.New.Popup("Confirm SMTP Password Change Code", "fa-lock", fnConfirmCode, options);
    },

    TestSMTPSend: function(sendOptions)
    {
        var fnSend = function ()
        {
            var payloadObject = {};

            payloadObject.URL = "EMail/SendTestSMTPToLoggedInUser";

            if (sendOptions && sendOptions.SendPasswordChangeConfirmCode)
                payloadObject.OutboundDataPacket = { SendPasswordChangeConfirmCode : true };

            payloadObject.InboundDataFunction = function (CSendTestSMTPToLoggedInUserResponse)
            {
                TriSysApex.UI.HideWait();

                if (CSendTestSMTPToLoggedInUserResponse)
                {
                    if (sendOptions && sendOptions.Callback)
                        sendOptions.Callback();
                    else
                    {
                        if (CSendTestSMTPToLoggedInUserResponse.Success)
                            TriSysApex.UI.ShowMessage("A test e-mail has been sent to you. Please check both your e-mail inbox and spam folders.");
                        else
                            TriSysApex.UI.ShowMessage(CSendTestSMTPToLoggedInUserResponse.ErrorMessage);
                    }

                    return;
                }
            };

            payloadObject.ErrorHandlerFunction = function (request, status, error)
            {
                TriSysApex.UI.HideWait();
                TriSysApex.UI.errorAlert('ctrlUserOptions.TestSMTPSend: ' + status + ": " + error + ". responseText: " + request.responseText);
            };

            var sSending = "Testing E-Mail";
            if (sendOptions && sendOptions.WaitingMessage)
                sSending = sendOptions.WaitingMessage;

            TriSysApex.UI.ShowWait(null, sSending + "...");
            TriSysAPI.Data.PostToWebAPI(payloadObject);

            return true;
        };

        if (sendOptions)
            fnSend();
        else
        {
            var sSMTPServerAddress = $('#smtp-server-address').val();
            var sSMTPServerLogin = $('#smtp-server-login').val();
            var sSMTPServerPassword = $('#smtp-server-password').val();

            if (!sSMTPServerAddress || !sSMTPServerLogin || !sSMTPServerPassword)
            {
                var sMessage = "You have not specified your own personal SMTP settings. Would you still like to test sending an automated e-mail to yourself?";
                TriSysApex.UI.questionYesNo(sMessage, "Incomplete Personal SMTP Settings", "Yes", fnSend, "No");
                return;
            }

            fnSend();
        }
    },

    Social:
    {
        // Read status of connections
        DisplayStatus: function()
        {
            var payloadObject = {};

            payloadObject.URL = 'SocialNetwork/AssociatedSocialNetworks';
            payloadObject.OutboundDataPacket = null;
            payloadObject.InboundDataFunction = function (CAssociatedSocialNetworksResponse)
            {
                if (CAssociatedSocialNetworksResponse)
                {
                    if (CAssociatedSocialNetworksResponse.Success)
                    {
                        ctrlUserOptions.Social.DisplaySocialNetworkStatus(CAssociatedSocialNetworksResponse.Networks);
                    }
                }
            };

            TriSysAPI.Data.PostToWebAPI(payloadObject);
        },

        DisplaySocialNetworkStatus: function(networks)
        {
            var sPrefix = 'useroptions-socialnetwork-list-';

            // Hide all
            $("[id^=" + sPrefix + "]").each(function ()
            {
                $(this).hide();
            });

            // Show those which are listed
            if(networks)
            {
                for (var i = 0; i < networks.length; i++)
                {
                    var network = networks[i];
                    var sID = sPrefix + network.toLowerCase().replace(/ /g, '-');
                    $('#' + sID).show();
                }
            }
        },

        AddEventHandlers: function ()
        {
            // Does not work on PhoneGap
            if (TriSysPhoneGap.Enabled())
            {
                $('#useroptions-socialnetworks-1').hide();
                $('#useroptions-socialnetworks-2').hide();
                return;
            }

            // Reset all socials in case we did a specific association (ctrlSocialLogin.js)
			TriSysWebJobs.SocialNetwork.CurrentNetworks = TriSysWebJobs.SocialNetwork.AllNetworks;

			// Feb 2018: Load the .js BEFORE the user control .html
			var fnLoadControlHTML = function ()
			{
				// Load the control into the DIV, change the name of all internal DIV tags to be unique and populate
				TriSysApex.FormsManager.loadControlIntoDiv('useroptions-SocialNetworkButtons', 'ctrlSocialNetworkLoginButtons.html',
					function (response, status, xhr)
					{
						// Set callback on successful login
						ctrlSocialNetworkLoginButtons.OnSuccessfulLoginFunction = ctrlUserOptions.Social.SendToWebAPI;
						ctrlSocialNetworkLoginButtons.HelpLabel("");
					});
			};

			TriSysApex.WhiteLabelling.LoadJavascriptFile('js/pages/ctrlSocialNetworkLoginButtons.js', null, fnLoadControlHTML);        
        },

        _SocialNetworkButtonsLoadedTests: 0,

        // If the user has logged in with a social network, then send these details to the login Web API
        SendToWebAPI: function (provider_name, connection_token, user_token)
        {
            //TriSysApex.UI.ShowMessage(provider_name + ": " + connection_token + ": " + user_token);
            TriSysApex.UI.ShowWait(null, "Associating " + provider_name + "...");

            var CAssociateSocialNetworkWithLoggedInProfileRequest =
            {
                ProviderName: provider_name,
                ConnectionToken: connection_token,
                UserToken: user_token
            };

            var payloadObject = {};

            payloadObject.URL = 'SocialNetwork/AssociateSocialNetworkWithLoggedInProfile';
            payloadObject.OutboundDataPacket = CAssociateSocialNetworkWithLoggedInProfileRequest;
            payloadObject.InboundDataFunction = function (CAssociateSocialNetworkWithLoggedInProfileResponse)
            {
                TriSysApex.UI.HideWait();

                if (CAssociateSocialNetworkWithLoggedInProfileResponse)
                {
                    if (CAssociateSocialNetworkWithLoggedInProfileResponse.Success)
                    {
                        ctrlUserOptions.Social.DisplayStatus();
                        return;
                    }
                    else
                    {
                        // This error can happen if the same social login is associated with another profile
                        TriSysApex.UI.ShowMessage(CAssociateSocialNetworkWithLoggedInProfileResponse.ErrorMessage, TriSysWebJobs.Constants.ApplicationName);
                    }
                }
            };

            payloadObject.ErrorHandlerFunction = function (request, status, error)
            {
                TriSysApex.UI.HideWait();
                TriSysApex.UI.errorAlert('ctrlUserOptions.Social.SendToWebAPI: ' + status + ": " + error + ". responseText: " + request.responseText);
            };

            TriSysAPI.Data.PostToWebAPI(payloadObject);
        },

        RemoveLinkedIn: function()
        {
            ctrlUserOptions.Social.Remove("LinkedIn");
        },
        RemoveApple: function ()
        {
            ctrlUserOptions.Social.Remove("Apple");
        },
        RemoveTwitter: function ()
        {
            ctrlUserOptions.Social.Remove("Twitter");
        },
        RemoveFacebook: function ()
        {
            ctrlUserOptions.Social.Remove("Facebook");
        },
        RemoveGoogle: function ()
        {
            ctrlUserOptions.Social.Remove("Google");
        },
        RemoveMicrosoft: function ()
        {
            ctrlUserOptions.Social.Remove("Windows Live");
        },

        Remove: function(sSocialNetworkProvider)
        {
            TriSysApex.UI.ShowWait(null, "Removing Association " + sSocialNetworkProvider + "...");

            var CRemoveAssociationRequest =
            {
                ProviderName: sSocialNetworkProvider
            };

            var payloadObject = {};

            payloadObject.URL = 'SocialNetwork/RemoveAssociation';
            payloadObject.OutboundDataPacket = CRemoveAssociationRequest;
            payloadObject.InboundDataFunction = function (CRemoveAssociationResponse)
            {
                TriSysApex.UI.HideWait();

                if (CRemoveAssociationResponse)
                {
                    if (CRemoveAssociationResponse.Success)
                    {
                        ctrlUserOptions.Social.DisplayStatus();
                        return;
                    }
                    else
                    {
                        // This error shoulw never happen
                        TriSysApex.UI.ShowMessage(CRemoveAssociationResponse.ErrorMessage, TriSysWebJobs.Constants.ApplicationName);
                    }
                }
            };

            payloadObject.ErrorHandlerFunction = function (request, status, error)
            {
                TriSysApex.UI.HideWait();
                TriSysApex.UI.errorAlert('ctrlUserOptions.Social.Remove: ' + status + ": " + error + ". responseText: " + request.responseText);
            };

            TriSysAPI.Data.PostToWebAPI(payloadObject);
        }
    },

    Language:
    {
        Load: function ()
        {
            // Load all countries.json
            TriSysWebJobs.CandidateRegistration.LoadCountryLookup("userOptions-Country");

            // Trigger a country change to set the language for the entire application
            $('#userOptions-Country').change(function (e)
            {
                var sCountry = this.value;
                TriSysSDK.Countries.ChangeCountryAndLanguage(sCountry);
            });
        }
    },

    DesignerThemes:
    {
        Load: function()
        {
            // user-options-designer-only-theme-*
            var bVisible = TriSysApex.Pages.Controller.isDesigner();

            if (!bVisible)
            {
                // Make the designer themes invisible
                $('li[id^="user-options-designer-only-theme-"]').filter(
                function ()
                {
                    $(this).hide();
                });
            }
        }
    },

	InitialiseWidgets: function()
	{
        // Legacy Exchange Sync
	    ctrlUserOptions.EnableSyncCheckBoxClick(null, 'enabled-sync-services');

	    var sFieldStartDateTime = 'sync-services-StartDateTime';
	    TriSysSDK.CShowForm.dateTimePicker(sFieldStartDateTime);
	    TriSysSDK.CShowForm.setDateTimePickerValue(sFieldStartDateTime, new Date());

		var lstProviders = [ { text: "Exchange/Office 365", value: 1 }, { text: "Google", value: 2 }];
		TriSysSDK.CShowForm.populateComboFromDataSource('email-service-provider', lstProviders);

		var fieldDescription = { MinValue: 1, MaxValue: 12, SpinIncrement: 1, DefaultValue: 2, Format: "#0" };
		TriSysSDK.Controls.NumericSpinner.Initialise('sync-services-diary-weeks', fieldDescription);

		var timezones = TriSysApex.Cache.InternationalTimeZones();
		if(timezones)
		{
			var sLondon = null;
			timezones.forEach(function(sTimezone)
			{
				if(sTimezone.indexOf("London") > 0)
					sLondon = sTimezone;
			});
			TriSysSDK.CShowForm.populateComboFromListOfString('sync-services-timezone', timezones, sLondon);
		}
	},

	EnableSyncCheckBoxClick: function (e, sID)
	{
		var bEnabled = TriSysSDK.CShowForm.CheckBoxValue(sID, false);
		for(var i = 1; i <= 10; i++)
		{
			var elem = $('#synch-services-row' + i);
			bEnabled ? elem.show() : elem.hide();
		}		

		if(e)
		{
			// An end-user event so update server
			ctrlUserOptions.UpdateMailSyncEvent("Enabled", bEnabled );
		}
	},

	UpdateEvents: function()
	{
		$('#email-service-provider').change(function (e)
        {
            var iSyncType = parseInt(this.value);
			ctrlUserOptions.UpdateMailSyncEvent("SyncType", iSyncType );

			// Jan 2020: Overwrite the mail server settings
			var bExchange = (iSyncType == 1);
			var bGmail = (iSyncType == 2);

            // Sep 2020: Separate field!
			var elemMailServer = $('#sync-services-email-server');
			var sExchangeURL = 'https://outlook.office365.com';
			var sGMailURL = 'https://smtp.gmail.com';
			if(bExchange)
			    elemMailServer.val(sExchangeURL);
			else if(bGmail)
			    elemMailServer.val(sGMailURL);

			// ...and save to database
			elemMailServer.trigger("change");
		});

	    // Sep 2020: Completely separate field!
		$('#sync-services-email-server').change(function (e) {
		    var sMailServer = $(this).val();
		    ctrlUserOptions.UpdateMailSyncEvent("MailServer", sMailServer);
		});

		$('#sync-services-email-login').change(function (e) {
		    var sMailUsername = $(this).val();
		    ctrlUserOptions.UpdateMailSyncEvent("Username", sMailUsername);
		});

		$('#sync-services-email-password').change(function (e) {
		    var sMailPassword = $(this).val();
		    ctrlUserOptions.UpdateMailSyncEvent("Password", sMailPassword);
		});

		var datePicker = $("#sync-services-StartDateTime").data("kendoDateTimePicker");
		datePicker.bind("change", function() {
		    var dt = this.value();
		    var apiFriendlyDate = moment(dt).format("YYYY-MM-DDTHH:mm:ss");
		    ctrlUserOptions.UpdateMailSyncEvent("ExportChangesAfter", apiFriendlyDate);
		});

		var numerictextbox = $('#sync-services-diary-weeks').data('kendoNumericTextBox');
		numerictextbox.bind("change", function() {
			var iWeeks = this.value();
			ctrlUserOptions.UpdateMailSyncEvent("AppointmentSyncWindow", iWeeks );
        });

		$('#sync-services-timezone').change(function (e)
		{
            var sTimeZoneDisplayName = this.value;
			ctrlUserOptions.UpdateMailSyncEvent("TimeZoneDisplayName", sTimeZoneDisplayName );
        });

		$('#enabled-sync-email').click(function ()
        {
            var bEMail = $(this).is(':checked');
            ctrlUserOptions.UpdateMailSyncEvent("SyncEMail", bEMail );
        });

		$('#enabled-sync-diary').click(function ()
        {
            var bDiary = $(this).is(':checked');
            ctrlUserOptions.UpdateMailSyncEvent("SyncAppointment", bDiary);
        });

        // 29 Mar 2023: Disabled
		//$('#two-factor-authentication').click(function ()
        //{
        //    var bEnable2FA = $(this).is(':checked');
        //    ctrlUserOptions.UpdateTwoFactorAuthentication(bEnable2FA);
		//});

	},

	UpdateMailSyncEvent: function(sFieldUpdated, mailSyncObject)
	{
	    var mailSync = TriSysApex.Cache.UserSettingManager.GetValue("MailSync", null);
	    if (!mailSync)
	    {
	        // See CUsers.CUserEmailSyncBase
	        // This code should never be needed as the Web API will send an empty one with all fields specified
	        debugger;
	        mailSync = {};
        }
	    else
	        mailSync = JSON.parse(mailSync);

	    mailSync[sFieldUpdated] = mailSyncObject;
	    var sJSON = JSON.stringify(mailSync);
	    TriSysApex.Cache.UserSettingManager.SetValue("MailSync", sJSON);    
	},

    // 29 Mar 2023: Disabled
	//UpdateTwoFactorAuthentication: function(bEnable)
	//{
	//	if(bEnable)
	//	{
	//		// Prompt user to enable by opening modal presenting the QR code
	//		ctrlUserOptions.PromptForTwoFactorAuthentication();
	//	}
	//	else
	//	{
	//		var sMessage = "Are you sure that you wish to disable two factor authentication?";
	//		var fnDisable2FA = function()
	//		{
	//			setTimeout(ctrlEnableTwoFactorAuthentication.DisableAuthentication, 10);
	//			return true;
	//		};
	//		var fnDoNotDisable2FA = function()
	//		{
	//			TriSysSDK.CShowForm.SetCheckBoxValue('two-factor-authentication', true);
	//			return true;
	//		};
    //        TriSysApex.UI.questionYesNo(sMessage, "Disable Two Factor Authentication", "Yes, Disable 2FA", fnDisable2FA, "No", fnDoNotDisable2FA);
	//	}
	//},

	//PromptForTwoFactorAuthentication: function()
	//{
	//	var fnAuthenticated = function(bAuthenticated)
	//	{
	//		if(!bAuthenticated)
	//		{
	//			TriSysSDK.CShowForm.SetCheckBoxValue('two-factor-authentication', false);
	//			setTimeout(ctrlEnableTwoFactorAuthentication.DisableAuthentication, 10);
	//		}
	//	};

	//	// All centralised in this script loaded after login		
	//	ctrlEnableTwoFactorAuthentication.PromptForTwoFactorAuthentication({Login: false}, fnAuthenticated);
	//},

	//DetermineIf2FAEnabled: function(bInitialise)
	//{
	//	// This script is also loaded in TriSysWeb.js AND TriSysApex.js after login
	//	ctrlEnableTwoFactorAuthentication.isEnabled(false, function(bEnabled, bLocked)
	//	{
	//		if(bEnabled)
	//			TriSysSDK.CShowForm.SetCheckBoxValue('two-factor-authentication', true);

	//		if(bLocked)
	//			$('#two-factor-authentication').prop('disabled', true);
	//	});
	//},

	_LoadedFonts: false,

	LoadFonts: function()
	{
	    var sId = '#user-options-font-combo';

        // Identify current favourite font
	    var sFontFamily = $("body").css("font-family");
	    var parts = sFontFamily.split(",");
	    var sCurrentFont = parts[0].trim();
	    sCurrentFont = sCurrentFont.replace(/\"/g, '');
	    $('#user-options-current-font-name').text(sCurrentFont);

	    var iSelectedIndex = 0;

	    var lst = [];
	    TriSysSDK.Fonts.List.forEach(function (fontInformation)
	    {
	        lst.push({ name: fontInformation.name });

	        if (fontInformation.name == sCurrentFont)
	            iSelectedIndex = lst.length - 1;

	        // Install each font if not already loaded
	        if (!ctrlUserOptions._LoadedFonts)
	            TriSysSDK.Fonts.Install(fontInformation.name);
	    });

	    ctrlUserOptions._LoadedFonts = true;

	    $(sId).kendoComboBox({
	        dataTextField: "name",
	        dataValueField: "name",
	        dataSource: lst,
	        index: iSelectedIndex,
	        clearButton: false,
	        template: '<span style="font-family: #: data.name #;">#: data.name #</span>',
	        select: ctrlUserOptions.FontSelected
	    });

        // Prevent user typing - annoying!
	    var fontSelector = $(sId).data("kendoComboBox");
	    var input = fontSelector.input;
	    input.attr("readonly", "readonly");
	},

	FontSelected: function(e)
	{
	    if (e.dataItem)
	    {
	        var dataItem = e.dataItem;
	        var sName = dataItem.name;
	        //$("#user-options-font-block").css('font-family', sName);
	        $('#user-options-current-font-name').text(sName);

	        TriSysSDK.Fonts.ApplyFontChange(sName, false);      // TODO Set to True when this is copied to TriSysSDK.js

	        // Save this font as the users default font
	        TriSysApex.Cache.UserSettingManager.SetValue(TriSysSDK.Fonts.UserSettingName, sName);
	    }
	},

	LoadFontWeights: function()
	{
	    var sId = '#user-options-fontweight-combo';

	    // Identify current favourite weight
	    var sFontWeight = $("body").css("font-weight");
	    $('#user-options-current-font-weight').text(sFontWeight);

	    var iSelectedIndex = 0;

	    var lst = [];
	    TriSysSDK.Fonts.WeightList.forEach(function (fontInformation) {
	        lst.push({ weight: fontInformation.weight });

	        if (fontInformation.weight == sFontWeight)
	            iSelectedIndex = lst.length - 1;
	    });

	    $(sId).kendoComboBox({
	        dataTextField: "weight",
	        dataValueField: "weight",
	        dataSource: lst,
	        index: iSelectedIndex,
	        clearButton: false,
	        template: '<span style="font-weight: #: data.weight #;">#: data.weight #</span>',
	        select: ctrlUserOptions.FontWeightSelected
	    });

	    // Prevent user typing - annoying!
	    var fontWeightSelector = $(sId).data("kendoComboBox");
	    var input = fontWeightSelector.input;
	    input.attr("readonly", "readonly");
	},

	FontWeightSelected: function (e)
	{
	    if (e.dataItem) {
	        var dataItem = e.dataItem;
	        var sWeight = dataItem.weight;

	        $('#user-options-current-font-weight').text(sWeight);

	        TriSysSDK.Fonts.ApplyFontWeightChange(sWeight);

	        // Save this font weight as the users default font
	        TriSysApex.Cache.UserSettingManager.SetValue(TriSysSDK.Fonts.UserSettingWeight, sWeight);
	    }
	},

    // 28 Nov 2022
    // ctrlUserOptions.CloudSync
	CloudSync:
    {
        Load: function ()    // ctrlUserOptions.CloudSync.Load
        {
            // Load settings from UsrCfgUsers

            var sCloudSyncEnabledElement = 'enabled-cloud-sync';
            var CloudSyncEnabledUserSetting = "CloudSyncEnabled";
            var bCloudSyncEnabled = TriSysApex.Cache.UserSettingManager.GetValue(CloudSyncEnabledUserSetting, false);
            $('#' + sCloudSyncEnabledElement).click(function () {
                bCloudSyncEnabled = $(this).is(':checked');
                TriSysApex.Cache.UserSettingManager.SetValue(CloudSyncEnabledUserSetting, bCloudSyncEnabled);
                ctrlUserOptions.CloudSync.EnableCloudSyncCheckBoxClick(bCloudSyncEnabled);
                ctrlUserOptions.CloudSync.SendToWebAPICloudSyncSubsystem({ SettingName: 'Enabled', SettingValue: bCloudSyncEnabled });
            });
            TriSysSDK.CShowForm.SetCheckBoxValue(sCloudSyncEnabledElement, bCloudSyncEnabled);
            ctrlUserOptions.CloudSync.EnableCloudSyncCheckBoxClick(bCloudSyncEnabled);

            var sCloudSyncEMailElement = 'enabled-cloud-sync-email';
            var CloudSyncEMailUserSetting = 'CloudSyncEMailEnabled';
            $('#' + sCloudSyncEMailElement).click(function () {
                var bCloudSyncEMailEnabled = $(this).is(':checked');
                TriSysApex.Cache.UserSettingManager.SetValue(CloudSyncEMailUserSetting, bCloudSyncEMailEnabled);
                ctrlUserOptions.CloudSync.SendToWebAPICloudSyncSubsystem({ SettingName: 'EMailEnabled', SettingValue: bCloudSyncEMailEnabled });
            });
            TriSysSDK.CShowForm.SetCheckBoxValue(sCloudSyncEMailElement, TriSysApex.Cache.UserSettingManager.GetValue(CloudSyncEMailUserSetting, false));

            var sCloudSyncCalendarElement = 'enabled-cloud-sync-calendar';
            var CloudSyncCalendarUserSetting = 'CloudSyncCalendarEnabled';
            $('#' + sCloudSyncCalendarElement).click(function () {
                var bCloudSyncCalendarEnabled = $(this).is(':checked');
                TriSysApex.Cache.UserSettingManager.SetValue(CloudSyncCalendarUserSetting, bCloudSyncCalendarEnabled);
                ctrlUserOptions.CloudSync.SendToWebAPICloudSyncSubsystem({ SettingName: 'CalendarEnabled', SettingValue: bCloudSyncCalendarEnabled });
            });
            TriSysSDK.CShowForm.SetCheckBoxValue(sCloudSyncCalendarElement, TriSysApex.Cache.UserSettingManager.GetValue(CloudSyncCalendarUserSetting, false));

            var sCloudSyncContactsElement = 'enabled-cloud-sync-contacts';
            var CloudSyncContactsUserSetting = 'CloudSyncContactsEnabled';
            $('#' + sCloudSyncContactsElement).click(function () {
                var bCloudSyncContactsEnabled = $(this).is(':checked');
                TriSysApex.Cache.UserSettingManager.SetValue(CloudSyncContactsUserSetting, bCloudSyncContactsEnabled);
                ctrlUserOptions.CloudSync.SendToWebAPICloudSyncSubsystem({ SettingName: 'ContactsEnabled', SettingValue: bCloudSyncContactsEnabled });
            });
            TriSysSDK.CShowForm.SetCheckBoxValue(sCloudSyncContactsElement, TriSysApex.Cache.UserSettingManager.GetValue(CloudSyncContactsUserSetting, false));

            // Authorise button kicks off a complex OAuth workflow
            var sAuthoriseButtonID = 'authorise-cloud-sync-account';
            $('#' + sAuthoriseButtonID).click(function ()
            {
                ctrlUserOptions.CloudSync.Authorise();
            });

            // Other fields
            var bAuthorised = TriSysApex.Cache.UserSettingManager.GetValue("CloudSyncAuthorised", false);
            TriSysSDK.CShowForm.SetCheckBoxValue('cloud-sync-authorised', bAuthorised);
            var sAuthorisedDate = TriSysApex.Cache.UserSettingManager.GetValue("CloudSyncAuthorisedDate", "");
            $('#cloud-sync-date-authorised').text(sAuthorisedDate);

            // Always check the status of the user's Nylas account
            if(bCloudSyncEnabled)
                ctrlUserOptions.CloudSync.CheckStatus();
        },

        EnableCloudSyncCheckBoxClick: function (bEnabled)
        {
            var iMax = 6;   // Keep "Contacts" hidden
            for (var i = 1; i <= iMax; i++)
            {
                var elem = $('#cloud-sync-row' + i);
                bEnabled ? elem.show() : elem.hide();
            }
        },

        Authorise: function()
        {
            // After tested, open a dialogue to handle the interaction

            var payloadObject = {};

            payloadObject.URL = "CloudSync/UserAuthenticationURL";

            const iVersion = 2025;

            // Should return https://apex.trisys.co.uk, but could be http://localhost:8080
            const iPort = location.port ? parseInt(location.port) : 0;
            const sApexURL = location.protocol + "//" + location.hostname + (iPort != 443 ? ":" + iPort : "");       

            payloadObject.OutboundDataPacket = {
                ApexURL: sApexURL,  

                // 20 Dec 2024: New Cloud-Sync 2025
                Version: iVersion
            };   

            payloadObject.InboundDataFunction = function (CUserAuthenticationURLResponse) 
            {
                TriSysApex.UI.HideWait();

                if (CUserAuthenticationURLResponse) 
                {
                    if (CUserAuthenticationURLResponse.Success)
                    {
                        var sURL = CUserAuthenticationURLResponse.URL +
                                    TriSysApex.FormsManager.pageURLTimestampArgumentsToForceNoCache(CUserAuthenticationURLResponse.URL);

       //                 if (iVersion == 2025)
       //                 {
       //                     // We will get this URL from the Web API, but in development we need to hard-code it
       //                     // This URL will contain a GUID identifying the subscriber
       //                     const sSignalRHandle = TriSysApex.SignalR.Communication.FullSenderAndRecipientAddress();
       //                     const userCredentials = TriSysApex.LoginCredentials.UserCredentials();
       //                     const contact = userCredentials.LoggedInUser.Contact;
       //                     const contactCRM = userCredentials.LoggedInUser.CRMContact;
       //                     const object = {
       //                         SignalRHandle: sSignalRHandle,
       //                         WebAPI: TriSysAPI.Constants.SecureURL,
       //                         TriSysCRMContactId: contactCRM.ContactId,
       //                         UserId: userCredentials.LoggedInUser.UserId,
       //                         ContactId: contact.ContactId,
       //                         Instructions: {
       //                             SiteKey: TriSysApex.Constants.DeveloperSiteKey
       //                         }
       //                     };
							//const sJSON = JSON.stringify(object);
       //                     const sBase64 = $.base64.encode(sJSON);
       //                     sURL = "http://localhost:8081/oauth/authenticate-2025.html" +
							//	"?Subscriber=" + sBase64 +
       //                         TriSysApex.FormsManager.pageURLTimestampArgumentsToForceNoCache(null, '&');
       //                 }

                        ctrlUserOptions.CloudSync.OpenOAuth(sURL);
                    }
                    else
                        TriSysApex.UI.ShowMessage(CUserAuthenticationURLResponse.ErrorMessage);

                    return;
                }
            };

            payloadObject.ErrorHandlerFunction = function (request, status, error) {
                TriSysApex.UI.HideWait();
                TriSysApex.UI.errorAlert('ctrlUserOptions.CloudSync.Authorise: ' + status + ": " + error + ". responseText: " + request.responseText);
            };

            var sSending = "Reading Authorisation Service";

            TriSysApex.UI.ShowWait(null, sSending + "...");
            TriSysAPI.Data.PostToWebAPI(payloadObject);
        },

        _PopupBrowserWindowName: "TriSysCloudSyncPopupBrowserWindow",
        _PopupBrowserWindowInstance: null,

        // Originally intended to open this in our own modal, but Microsoft Office 365 OAuth
        // does not like iFrames so we had to open a new browser window
        OpenOAuth: function(sSecureURL)
        {
            // Close any old 'forgotten' popup browser
            ctrlUserOptions.CloudSync.ClosePopupBrowserWindow();

            // Popup window
            var sTitle = "Authorise Access to E-Mail &amp; Calendar";

            // Popup Browser
            var iHeightFactor = 0.75;

            var iWidth = 700, iHeight = ($(window).height() * iHeightFactor), iTop = 50, iLeft = ($(window).width() - iWidth);

            var iDefaultHeight = 690;
            if ($(window).height() > iTop + iDefaultHeight)
                iHeight = iDefaultHeight;

            // http://www.xtf.dk/2011/08/center-new-popup-window-even-on.html
            // Fixes dual-screen position                         Most browsers      Firefox  
            var dualScreenLeft = window.screenLeft != undefined ? window.screenLeft : screen.left;
            var dualScreenTop = window.screenTop != undefined ? window.screenTop : screen.top;

            var iWidthOfScreen = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
            var iHeightOfScreen = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;

            iLeft = ((iWidthOfScreen / 2) - (iWidth / 2)) + dualScreenLeft;
            iTop = ((iHeightOfScreen / 2) - (iHeight / 2)) + dualScreenTop;

            // 02 Dec 2022: gmail.com is the straw that broke the camels back
            //var sHTML = sSecureURL;
            //sSecureURL = "about:blank";

            var sStatusOptions = ", menubar=no, resizable=yes, scrollbars=no, status=no, location=no";
            ctrlUserOptions.CloudSync._PopupBrowserWindowInstance = window.open(sSecureURL, ctrlUserOptions.CloudSync._PopupBrowserWindowName,
                                                                                "width=" + iWidth + ", height=" + iHeight + ", left=" + iLeft + ", top=" + iTop +
                                                                                sStatusOptions);
            

            // 02 Dec 2022: gmail.com is the straw that broke the camels back
            //ctrlUserOptions.CloudSync._PopupBrowserWindowInstance.document.write(sHTML);
            return;

            // Old attempts left in for reference 

            //TriSysSDK.Browser.OpenURL(sSecureURL);
            //return;

            //// Hoped that this would work, but Microsoft oAuth does not work in a browser!
            //var sTitle = sTitle;
            //var parametersObject = new TriSysApex.UI.ShowMessageParameters();
            //parametersObject.Title = sTitle;
            //parametersObject.Image = "gi-more_items";
            //parametersObject.Maximize = false;
            //parametersObject.Width = 920;
            //parametersObject.CloseTopRightButton = true;

            //// Our generic OAuth control
            //var sURL = TriSysApex.CustomFormsAndComponents.UserControlPath("ctrlOAuth.html")

            //// Callback
            //parametersObject.OnLoadCallback = function () {
            //    ctrlOAuth.LoadURL(sSecureURL);
            //};

            //parametersObject.ContentURL = sURL;
            //parametersObject.ButtonRightText = "OK";
            //parametersObject.ButtonRightVisible = true;

            //TriSysApex.UI.PopupMessage(parametersObject);
        },

        // We only allow one of these open at any time!
        ClosePopupBrowserWindow: function()
        {
            // Close the popup browser
            if (ctrlUserOptions.CloudSync._PopupBrowserWindowInstance) {
                try {
                    ctrlUserOptions.CloudSync._PopupBrowserWindowInstance.close();
                }
                catch (e) {
                    // Some low-level problem
                }
                ctrlUserOptions.CloudSync._PopupBrowserWindowInstance = null;
            }
        },

        // OAuth has completed and https://apex.trisys.co.uk/oauth/authentication.html has called Web API
        // to send us a signal telling us that we now have control
        // Close the popup, then call Web API to call Nylas API and obtain the server-side secret access token
        // and update the customer database with their authentication details
        // Finally, update this form and acknowledge to the user 
        ReceivedOAuthWorkflowCompletedMessageFromBrowserPopupWindow: function(sToken)
        {
            debugger;
            // Close the popup browser
            ctrlUserOptions.CloudSync.ClosePopupBrowserWindow();

            // Log
            var sApp = "User Options", sProcess = "SignalR";
            var fnCreateMessage = function (sIPAddress, sVersion, sEMail) {
                var sMessage = "User: " + sEMail + " ReceivedOAuthWorkflowCompletedMessageFromBrowserPopupWindow: " +
                    "Received Token: " + sToken + " and closed browser popup window?";
                return sMessage;
            };

            TriSysApex.DebugLogging.LoggedInUserMessage(sApp, sProcess, fnCreateMessage);

            // 21 Dec 2024: If we get no code, then we are not using Nylas anymore so do not need any further authentication
            if (!sToken)
            {
                ctrlUserOptions.CloudSync.RecordSuccessfulAuthorisationStatus();
                ctrlUserOptions.CloudSync.SupportPortalCompletion();
                return;
            }

            // Call Web API to exchange the tokens
            var payloadObject = {};

            payloadObject.URL = "CloudSync/ExchangeOAuthToken";

            payloadObject.OutboundDataPacket = { Token: sToken };

            payloadObject.InboundDataFunction = function (CExchangeOAuthTokenResponse)
            {
                TriSysApex.UI.HideWait();

                if (CExchangeOAuthTokenResponse)
                {
                    var sCommentary = ". Web API returned ";
                    if (CExchangeOAuthTokenResponse.Success)
                    {
                        ctrlUserOptions.CloudSync.RecordSuccessfulAuthorisationStatus();
                        ctrlUserOptions.CloudSync.SupportPortalCompletion();
                        sCommentary += "Success";
                    }
                    else
                    {
                        TriSysApex.UI.ShowMessage(CExchangeOAuthTokenResponse.ErrorMessage);
                        sCommentary += "Error: " + CExchangeOAuthTokenResponse.ErrorMessage;
                    }

                    // Log
                    var fnCreateMessage = function (sIPAddress, sVersion, sEMail) {
                        var sMessage = "User: " + sEMail + " called Web API: " + payloadObject.URL +
                            sCommentary;
                        return sMessage;
                    };

                    TriSysApex.DebugLogging.LoggedInUserMessage(sApp, sProcess, fnCreateMessage);
                }
            };

            payloadObject.ErrorHandlerFunction = function (request, status, error) {
                TriSysApex.UI.HideWait();
                TriSysApex.UI.errorAlert('ctrlUserOptions.CloudSync.ReceivedOAuthWorkflowCompletedMessageFromBrowserPopupWindow: ' + status + ": " + error + ". responseText: " + request.responseText);
            };

            var sSending = "Exchanging Secret Tokens";

            TriSysApex.UI.ShowWait(null, sSending + "...");
            TriSysAPI.Data.PostToWebAPI(payloadObject);
        },

        // Write to screen and update user setting
        RecordSuccessfulAuthorisationStatus: function ()
        {
            var sExtraDetails = '';
            if (ctrlUserOptions.isApexUserOptionsForm())
            {
                var sToday = moment().format("dddd DD MMMM YYYY") + " @ " + moment().format("HH:mm");
                $('#cloud-sync-date-authorised').text(sToday);
                TriSysSDK.CShowForm.SetCheckBoxValue('cloud-sync-authorised', true);
                TriSysApex.Cache.UserSettingManager.SetValue("CloudSyncAuthorised", true);
                TriSysApex.Cache.UserSettingManager.SetValue("CloudSyncAuthorisedDate", sToday);
                sExtraDetails = "<br>" + "Please choose which items you would like to be synchronised.";
            }

            TriSysApex.UI.ShowMessage("You have successfully authenticated your cloud e-mail supplier to synchronise data with TriSys." +
                                      sExtraDetails);
        },

        // Silently update the cloud sync subsystem after user changed enabled flags
        SendToWebAPICloudSyncSubsystem: function(CSetEnabledFlagRequest)
        {
            // Call Web API to exchange the tokens
            var payloadObject = {};

            payloadObject.URL = "CloudSync/SetEnabledFlag";

            payloadObject.OutboundDataPacket = CSetEnabledFlagRequest;

            payloadObject.InboundDataFunction = function (CSetEnabledFlagResponse) {

                if (CSetEnabledFlagResponse) {
                    if (CSetEnabledFlagResponse.Success)
                    {
                        // Silent and deadly ;-)
                    }
                    else
                        TriSysApex.UI.ShowMessage(CSetEnabledFlagResponse.ErrorMessage);

                    return;
                }
            };

            payloadObject.ErrorHandlerFunction = function (request, status, error) {
                TriSysApex.UI.errorAlert('ctrlUserOptions.CloudSync.SendToWebAPICloudSyncSubsystem: ' + status + ": " + error + ". responseText: " + request.responseText);
            };

            TriSysAPI.Data.PostToWebAPI(payloadObject);
        },

        // Called after loading the user options form to check that their Nylas account is still authenticated
        CheckStatus: function(fnCallback)
        {
            var payloadObject = {};

            payloadObject.URL = "CloudSync/CheckUserStatus";

            payloadObject.InboundDataFunction = function (CCheckUserStatusResponse) {

                if (CCheckUserStatusResponse)
                {
                    if (fnCallback)
                        fnCallback(CCheckUserStatusResponse);
                    else
                    {
                        if (CCheckUserStatusResponse.Success) {
                            // Process status
                            ctrlUserOptions.CloudSync.ReportCheckedStatus(CCheckUserStatusResponse);
                        }
                        else
                            TriSysApex.UI.ShowMessage(CCheckUserStatusResponse.ErrorMessage);
                    }

                    return;
                }
            };

            payloadObject.ErrorHandlerFunction = function (request, status, error) {
                TriSysApex.UI.errorAlert('ctrlUserOptions.CloudSync.CheckStatus: ' + status + ": " + error + ". responseText: " + request.responseText);
            };

            TriSysAPI.Data.PostToWebAPI(payloadObject);
        },

        // Properties: HasAccount & Running
        ReportCheckedStatus: function(CCheckUserStatusResponse)
        {
            // Cloud Sync is enabled for the user, however behind the scenes all may not be well
            if (!CCheckUserStatusResponse.HasAccount || !CCheckUserStatusResponse.Valid)
            {
                // Make it very clear to the user that they need to re-authenticate
                $('#cloud-sync-date-authorised').text('');
                TriSysSDK.CShowForm.SetCheckBoxValue('cloud-sync-authorised', false);
                TriSysApex.Cache.UserSettingManager.SetValue("CloudSyncAuthorised", false);

                var sRe = CCheckUserStatusResponse.HasAccount ? "re-" : "";
                TriSysApex.UI.ShowMessage("Please " + sRe + "authorise your cloud e-mail supplier to synchronise data with TriSys.");

                // 10 Feb 2023: If their system admin has not enabled this, override this now
                $('#user-options-cloud-sync-block').show();

                // Force re-authentication
                setTimeout(function () { TriSysSDK.Controls.Button.Click('useroptions-form-tab-login-credentials'); },
                    ctrlUserOptions.Constants.DelayClickingTabsToPreventScrolling);

				// 09 Jan 2025: Cloud-Sync moved to top of tab so no longer need to scroll
                //window.scrollTo({ left: 0, top: document.body.scrollHeight, behavior: "smooth" });
            }
        },

        // 05 Sep 2023: After support portal authentication, do visuals
        SupportPortalCompletion: function()
        {
            var formInstance = TriSysApex.FormsManager.FormInstances.GetForm("CloudSync");
            if(formInstance)
            {
                CloudSync.PostAuthentication();
            }
        }

    },   // ctrlUserOptions.CloudSync

    // 01 Feb 2023
	ReadLicenseInformation: function(fnCallback)
	{
	    var payloadObject = {};

	    payloadObject.URL = "Customer/ReadLicense";

	    payloadObject.InboundDataFunction = function (CReadLicenseResponse) {

	        if (CReadLicenseResponse) {
	            if (CReadLicenseResponse.Success) {
	                // Silent and deadly ;-)
	                fnCallback(CReadLicenseResponse.License);
	            }
	            else
	                TriSysApex.UI.ShowMessage(CReadLicenseResponse.ErrorMessage);

	            return;
	        }
	    };

	    payloadObject.ErrorHandlerFunction = function (request, status, error) {
	        TriSysApex.UI.errorAlert('ctrlUserOptions.ReadLicenseInformation: ' + status + ": " + error + ". responseText: " + request.responseText);
	    };

	    TriSysAPI.Data.PostToWebAPI(payloadObject);
	},

	AppendLicenseInformation: function (elemAppSettings, license)
	{
	    if (!elemAppSettings || !license)
	        return;

	    var sExpiry = moment(license.ExpiryDate).format("dddd DD MMMM YYYY");

	    var fnPart = TriSysApex.UserOptions.SystemSettingTablePart;
	    var sHTML = '<table style="width:100%; line-height: 20px; margin-bottom: 20px;" border="0">' +
                            fnPart(true, '<hr />') + fnPart(false, "<hr />") +
	                        fnPart(true, "Licensee") + fnPart(false, license.Licensee) +
                            fnPart(true, "Expiry Date") + fnPart(false, sExpiry) +
                            fnPart(true, "Number of Licenses") + fnPart(false, license.NumberOfLicenses) +
                            fnPart(true, "Verified") + fnPart(false, license.Verified);
	    sHTML += '</table>';

	    elemAppSettings.append(sHTML);

	    // Compare the licensee with the CRM company name and if different, flag this as an issue to 
	    // either the user or support via Web API

        // This is brittle code!
	    //var sCRMCompanyName = document.querySelector("#divAppSettings > table:nth-child(1) > tbody > tr:nth-child(49) > td:nth-child(2)").innerText;

	    // This is more robust
	    var sCRMCompanyName = $('#crm-company-name').text();

	    if (sCRMCompanyName.toLowerCase() !== license.Licensee.toLowerCase())
	    {
	        TriSysApex.Toasters.Error("DANGER: Licensee does not match CRM company name");
	    }
	},

	isApexUserOptionsForm: function()
	{
	    // 04 Sep 2023: Called in support portal to re-use functions.
	    var formInstance = TriSysApex.FormsManager.FormInstances.GetForm("UserOptions");
	    return (formInstance) ? true : false;
	},

	PopulateGridPagerPosition: function()
	{
	    var sourceKeys = [
            { value: "top",     text: "Top"                 },
            { value: "bottom",  text: "Bottom"              },
            { value: "both",    text: "Both Top and Bottom" }
	    ];

	    TriSysSDK.CShowForm.populateComboFromDataSource("grid-pager-position", sourceKeys, 1);
	},

    // 01 May 2024
    TaskSettings:
    {
        Load: function()
        {
            // Alarm
            // 01 May 2024: Pick up the default alarm from user-specific setting
            var sAlarmLeadTimeSetting = "Task.AlarmLeadTime";
            var durationOptions = {
                DefaultPeriod: 'minutes',
                DefaultDurationValue: 15,
                OnChangeEventHandler: function(sFieldID, sLeadTime)
                {
                    TriSysApex.Cache.UserSettingManager.SetValue(sAlarmLeadTimeSetting, sLeadTime);
                }
            };
            var sLeadTime = TriSysApex.Cache.UserSettingManager.GetValue(sAlarmLeadTimeSetting);
            if (sLeadTime)
            {
                var parts = sLeadTime.split(" ");
                var iAmount = parseInt(parts[0]);
                if(iAmount > 0 && parts.length == 2)
                {
                    var sPeriod = parts[1];
                    durationOptions.DefaultPeriod = sPeriod;
                    durationOptions.DefaultDurationValue = iAmount;
                }
            }

            TriSysSDK.Controls.Duration.Initialise('userOptions-taskForm-Duration', durationOptions);

            // 01 May 2024: User setting
            var sAlarmedSetting = 'Task.Alarmed';
            var bAlarmed = TriSysApex.Cache.UserSettingManager.GetValueBoolean(sAlarmedSetting, true);
            var sCheckBoxID = 'userOptions-taskForm-set-alarm';
            TriSysSDK.CShowForm.SetCheckBoxValue(sCheckBoxID, bAlarmed);
            $('#' + sCheckBoxID).click(function () {
                var bAlarmed = $(this).is(':checked');
                TriSysApex.Cache.UserSettingManager.SetValue(sAlarmedSetting, bAlarmed);
            });

            // Sound files: Read from Web API in future
            var sAlarmSoundSetting = 'Task.AlarmSound';
            var sSound = TriSysApex.Cache.UserSettingManager.GetValue(sAlarmSoundSetting);
            var sSoundFieldID = 'userOptions-taskAlarm-Sound';
            var lstAudio = TriSysSDK.Audio.AudioAssetList(null, sSound);

            // Callback when combo changes
            var fnChangeSound = function (value, sText, sFieldID) {
                TriSysApex.Cache.UserSettingManager.SetValue(sAlarmSoundSetting, sText);
            };

            TriSysSDK.CShowForm.populateComboFromDataSource(sSoundFieldID, lstAudio, 0, fnChangeSound);
            if (sSound)
                TriSysSDK.CShowForm.SetTextInCombo(sSoundFieldID, sSound);

            // Allow user to play the sound
            var btnPlay = $('#userOptions-taskAlarm-Play');
            var btnStop = $('#userOptions-taskAlarm-Stop');
            btnPlay.on('click', function ()
            {
                var sSoundSelected = TriSysSDK.CShowForm.GetTextFromCombo(sSoundFieldID);
                TriSysSDK.Audio.PlayTaskAlarmSound(sSoundSelected, 1,
                    function ()
                    {
                        btnStop.hide();
                        btnPlay.show();
                    });
                btnStop.show();
                btnPlay.hide();
            });

            // Allow user to stop the sound
            btnStop.on('click', function () {
                TriSysSDK.Audio.StopPlayingTaskAlarmSound();
                btnStop.hide();
                btnPlay.show();
            });

            // Allow user to customise the sound
            var btnCustom = $('#userOptions-taskAlarm-Custom');
            btnCustom.on('click', function () {
                // Request new URL
                var fnCustomURL = function (sURL) {
                    if (sURL)
                    {
                        var bValidURL = (sURL.indexOf('https') == 0) && (sURL.indexOf('.mp3') > 0 || sURL.indexOf('.wav') > 0);
                        if (!bValidURL)
                            TriSysApex.UI.ShowMessage("Please enter a valid URL of an mp3 or wav file e.g. https://domain/server/file.mp3");
                        else
                        {
                            // Refresh this list showing the custom entry
                            TriSysApex.Cache.UserSettingManager.SetValue(sAlarmSoundSetting, sURL);
                            lstAudio = TriSysSDK.Audio.AudioAssetList(null, sURL);
                            TriSysSDK.CShowForm.populateComboFromDataSource(sSoundFieldID, lstAudio, 0, fnChangeSound);
                            TriSysSDK.CShowForm.SetTextInCombo(sSoundFieldID, sURL);
                            return true;
                        }
                    }
                };
                var sMessage = "Custom Sound URL";
                var sValue = (sSound && sSound.indexOf("http") == 0 ? sSound : '');
                var options = {
                    Label: "URL",
                    Value: sValue,
                    Instructions: "Please paste an https:// URL pointing to an mp3 or wav file which you have tested in your browser."
                };
                TriSysApex.ModalDialogue.New.Popup(sMessage, "gi-globe_af", fnCustomURL, options);
            });
        }
    },

    Constants:      // ctrlUserOptions
    {
		DelayClickingTabsToPreventScrolling: 500
    }

};  // ctrlUserOptions

$(document).ready(function ()
{
    ctrlUserOptions.Load();
});
