var ctrlEnableTwoFactorAuthentication = 
{
	_ConfirmButton: null,
	_LoginMode: false,
	_PinCodeAttemptCounter: 0,
	_MaximumPinCodeAttempts: 3,

    AuthenticatorAppName: 'TriSys',

	Load: function(options, fnConfirmed)
	{
		ctrlEnableTwoFactorAuthentication._ConfirmButton = $('#trisys-modal-warning');
		ctrlEnableTwoFactorAuthentication._ConfirmButton.hide();
		$('#login-instructions-AuthenticatorAppName').text(options.AuthenticatorAppName);
		$('#login-instructions-AuthenticatorAppName2').text(options.AuthenticatorAppName);

		// Capture enter key on code capture field
        $('#unlock-code').keyup(function (e)
        {
            //if (e.keyCode == 13 || this.value.length == 6)
            if(this.value.length == 6)
            {
                ctrlEnableTwoFactorAuthentication.ConfirmCode(fnConfirmed, options);
            }
        });

        if (options.Login || options.Unlock)
		{
			// Prompt for pin only
			ctrlEnableTwoFactorAuthentication.EnterCodeMode();
        }
		else
		{
			// Prompt using QR code
            ctrlEnableTwoFactorAuthentication.PromptForQRCode(options);
            $('#app-instructions').show();
            $('#button-instructions').show();
		}

	    // 08 Sep 2022: Force scrolling as QR code may be large
		var iHeight = $(window).height() - 250;
		var div = $('#enable2FAcontainerDiv')
		if (iHeight < 660)
		    div.css("height", iHeight);
		else
		    div.css('overflow-y', 'hidden');
	},

	PromptForQRCode: function(options)
	{
		var CObtainQRCodeRequest =
        {
            ApplicationName: ctrlEnableTwoFactorAuthentication.AuthenticatorAppName
        };

        // 28 Mar 2023
		if (options)
		{
		    if (options.ApplicationName)
		        CObtainQRCodeRequest.ApplicationName = options.ApplicationName;
		}


        var payloadObject = {};

        payloadObject.URL = 'TwoFactorAuthentication/ObtainQRCode';
        payloadObject.OutboundDataPacket = CObtainQRCodeRequest;
        payloadObject.InboundDataFunction = function (CObtainQRCodeResponse)
        {
            if (CObtainQRCodeResponse)
            {
                if (CObtainQRCodeResponse.Success)
                {
                    $('#login-instructions-AuthenticatorAppName').text(CObtainQRCodeResponse.AuthenticatorAppName);
                    $('#login-instructions-AuthenticatorAppName2').text(CObtainQRCodeResponse.AuthenticatorAppName);

					if(CObtainQRCodeResponse.AlreadyAssigned)
					{
						// Customer has already added us as an app in Google Authenticator
						ctrlEnableTwoFactorAuthentication.EnterCodeMode();
					}
					else
					{
						// Display QR Code to allow customer to add this app to Google Authenticator
						$('#qr-code-2fa').attr('src', CObtainQRCodeResponse.URL);
					}

                    return;
                }
                else
                {
                    // This error should never happen
                    TriSysApex.UI.ShowMessage(CObtainQRCodeResponse.ErrorMessage, TriSysApex.Copyright.ShortProductName);
                }
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.errorAlert('ctrlEnableTwoFactorAuthentication.Load: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysAPI.Data.PostToWebAPI(payloadObject);
	},

	// User clicked Authenticate button
	EnterCodeMode: function()
	{
		//$('#qr-code-2fa').hide();
		$('#qr-code-para').hide();
		$('#auth-code').show();
		$('#unlock-code').focus();
		$('#app-instructions').hide();
		$('#button-instructions').hide();
	    //$('#store-instructions').hide();
		$('#login-instructions-para').show();

		var button = $('#trisys-modal-success');
		button.hide();

		ctrlEnableTwoFactorAuthentication._ConfirmButton.show();
	},

	ConfirmCode: function(fnConfirmed, options)
	{
		var sCode = $('#unlock-code').val();
		$('#unlock-code').prop('disabled', true);   //Disable input

		var sError = null, Error = "Please enter a 6-digit numeric code.";
		if(!sCode)
			sError = Error;
		else
		{
			if(sCode.length != 6)
				sError = Error;
		}

		if(sError)
		{
			var fnRetry = function()
			{
				setTimeout(function() 
				{ 
					$('#unlock-code').prop('disabled', false);
					$('#unlock-code').focus(); 
				}, 10);
				return true;
			};
            TriSysApex.UI.ShowMessage(sError, "Two Factor Authentication", fnRetry, "OK");
		}
		else
		{
			// Submit code to the Web API for validation and if complete, close this form
			// as 1FA is now operational
			ctrlEnableTwoFactorAuthentication.ConfirmViaWebAPI(sCode, fnConfirmed, options);
		}
	},

	ConfirmViaWebAPI: function(sCode, fnConfirmed, options)
	{
		var CValidateCodeRequest =
        {
            ApplicationName: ctrlEnableTwoFactorAuthentication.AuthenticatorAppName,
			Pin: sCode,
			Login: ctrlEnableTwoFactorAuthentication._LoginMode
        };

	    // 28 Mar 2023: Options
		if (options)
		{
		    if (options.ApplicationName)
		        CValidateCodeRequest.ApplicationName = options.ApplicationName;
		}

        var payloadObject = {};

        payloadObject.URL = 'TwoFactorAuthentication/ValidateCode';
        payloadObject.OutboundDataPacket = CValidateCodeRequest;
        payloadObject.InboundDataFunction = function (CValidateCodeResponse)
        {
            if (CValidateCodeResponse)
            {
                if (CValidateCodeResponse.Success)
                {
                    // All OK
					var fnOK = function()
					{
						fnConfirmed(true);
					};
					setTimeout(fnOK, 10);
                    TriSysApex.UI.CloseModalPopup();
                }
                else
                {
					ctrlEnableTwoFactorAuthentication._PinCodeAttemptCounter += 1;
					var iRemainingAttempts = ctrlEnableTwoFactorAuthentication._MaximumPinCodeAttempts - ctrlEnableTwoFactorAuthentication._PinCodeAttemptCounter;
					var sMessage = "Invalid code." + 
									"<br />" +
									"Please try again." +
									"<br />" +
									"You have " + iRemainingAttempts + " remaining attempt" + (iRemainingAttempts == 1 ? "" : "s") +
									" to enter a valid code before you are logged out.";
					if(iRemainingAttempts == 0)
					{
						sMessage = "You have failed to enter a valid code after " + 
									ctrlEnableTwoFactorAuthentication._MaximumPinCodeAttempts +
									" attempts so you will now be logged out.";
						var fnLogout = function()
						{
							location.reload(true);
						};
						setTimeout(fnLogout, 5000);
					}

					var fnRetry = function()
					{
						setTimeout(function() 
						{ 
							$('#unlock-code').val("");
							$('#unlock-code').prop('disabled', false).focus(); 
						}, 10);

						if(iRemainingAttempts == 0)
						{
							setTimeout(TriSysApex.UI.CloseModalPopup, 100);
							setTimeout(function() { TriSysApex.FormsManager.CloseAllForms(true, true); }, 250);
						}

						return true;
					};
                    TriSysApex.UI.ShowMessage(sMessage, "Two Factor Authentication", fnRetry, "OK");
                }
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.errorAlert('ctrlEnableTwoFactorAuthentication.ConfirmViaWebAPI: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysAPI.Data.PostToWebAPI(payloadObject);
	},

	DisableAuthentication: function(options)
	{
		var CDisableRequest =
        {
            ApplicationName: ctrlEnableTwoFactorAuthentication.AuthenticatorAppName
        };

	    // 28 Mar 2023: Override default Apex options e.g. support portal
		if (options) {
		    if (options.ApplicationName)
		        CDisableRequest.ApplicationName = options.ApplicationName;
		}

        var payloadObject = {};

        payloadObject.URL = 'TwoFactorAuthentication/Disable';
        payloadObject.OutboundDataPacket = CDisableRequest;
        payloadObject.InboundDataFunction = function (CDisableResponse)
        {
            if (CDisableResponse)
            {
                if (CDisableResponse.Success)
                {
                    // All OK
					// We are called silently so no need to inform user
                }
                else
                {
                    TriSysApex.UI.ShowMessage(CDisableResponse.ErrorMessage);
                }
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.errorAlert('ctrlEnableTwoFactorAuthentication.DisableAuthentication: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysAPI.Data.PostToWebAPI(payloadObject);
	},

	isEnabled: function(bLogin, fnCallback, options)
	{
        // 15 Nov 2022: Turn off for contact preview mode
	    var bWeAreTheRemoteBrowserPopup = (typeof ContactPreviewMode !== TriSysApex.Constants.Undefined);

	    // Another exception is on a mobile phone where fast access is required at all times
	    if (TriSysApex.Device.isPhone() || bWeAreTheRemoteBrowserPopup)
	    {
	        fnCallback(false);
	        return;
	    }

        // Commence with prompt
		var CEnabledStatusRequest =
        {
            ApplicationName: ctrlEnableTwoFactorAuthentication.AuthenticatorAppName,
			Login: bLogin
        };

	    // 28 Mar 2023: Override default Apex options e.g. support portal
		if (options)
		{
		    if (options.ApplicationName)
		        CEnabledStatusRequest.ApplicationName = options.ApplicationName;
		}


        var payloadObject = {};

        payloadObject.URL = 'TwoFactorAuthentication/EnabledStatus';
        payloadObject.OutboundDataPacket = CEnabledStatusRequest;
        payloadObject.InboundDataFunction = function (CEnabledStatusResponse)
        {
            if (CEnabledStatusResponse)
            {
                if (CEnabledStatusResponse.Success)
                {
                    fnCallback(CEnabledStatusResponse.Enabled, CEnabledStatusResponse.Locked, 
								CEnabledStatusResponse.HasAuthenticatedPreviously,
								CEnabledStatusResponse.AuthenticatorAppName);
                }
                else
                {
                    // This error should never happen
                    TriSysApex.UI.ShowMessage(CEnabledStatusResponse.ErrorMessage, TriSysApex.Copyright.ShortProductName);
                }
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.errorAlert('ctrlEnableTwoFactorAuthentication.isEnabled: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysAPI.Data.PostToWebAPI(payloadObject);
	},

	// Called from both UserOptions and TriSysWeb.Security.ValidatedLoginCredentialsCallback
	// Either setup 2FA (UserOptions) or prompt for new code
	PromptForTwoFactorAuthentication: function(options, fnAuthenticationCallback)
	{
		var sTitle = "Enable";
		var fnConfirmed = function(bConfirmed)
		{
			var sMessage = "Two Factor Authentication is now operational." + "<br/>" +
						"You will be prompted for a new code each time you login in future.";
			TriSysApex.UI.ShowMessage(sMessage);
		};

		if(options.Login || options.Unlock)
			sTitle = "Login via";

		if(options.Login || options.Unlock || options.PreLogin)
		{
			fnConfirmed = function(bConfirmed)
			{
				if(bConfirmed)
					fnAuthenticationCallback(true);
			};
		}


		ctrlEnableTwoFactorAuthentication._LoginMode = options.Login;
		ctrlEnableTwoFactorAuthentication._PinCodeAttemptCounter = 0;
		
		if(options.Unlock)
			sTitle = "Unlock via";
			
		var parametersObject = new TriSysApex.UI.ShowMessageParameters();
        parametersObject.Title = sTitle + " Two Factor Authentication";
        parametersObject.Image = "gi-lock";

        parametersObject.ContentURL = TriSysApex.Constants.UserControlFolder + "ctrlEnableTwoFactorAuthentication.html";

		parametersObject.OnLoadCallback = function () {
			ctrlEnableTwoFactorAuthentication.Load(options, fnConfirmed);
		};

        parametersObject.ButtonLeftText = "Authenticate";
        parametersObject.ButtonLeftVisible = true;
		parametersObject.ButtonLeftFunction = function()
		{
			ctrlEnableTwoFactorAuthentication.EnterCodeMode();
		};

        parametersObject.ButtonCentreText = "Confirm";
        parametersObject.ButtonCentreVisible = true;			// We will turn it off when form loads but we have to do this to allocate an ID
		parametersObject.ButtonCentreFunction = function()
		{
			ctrlEnableTwoFactorAuthentication.ConfirmCode(fnConfirmed);
		};

        parametersObject.ButtonRightText = "Cancel";
        parametersObject.ButtonRightVisible = true;
		parametersObject.ButtonRightFunction = function()
		{
			fnAuthenticationCallback(false);
			return true;
		};

        TriSysApex.UI.PopupMessage(parametersObject);        
	},
};
