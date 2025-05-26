var ctrlPaymentGateway =
{
	_sGUID: null,
	_UserOnly: false,
	_UserName: '',

	// Called in 4 places: 
	//	AdminConsole.PromptForUserAccountPayment
	//  Login.CommencePaymentCaptureAfterConfirmingRegistration
	//  Paid.DisplayProvisioningProgressAfterPaymentComplete
	//  Registration.CommencePaymentCaptureAfterConfirmingRegistration
	//
	// options.UserOnly: used for specific user account activation
	// options.FreePlan: used for registration to get customer started quickly
	Load: function(sGUID, ConfirmCustomerRegistrationResponse, bTargetParent, options)
	{
		ctrlPaymentGateway._sGUID = sGUID;

		if(options)
		{
			var sMessage = null;

			if(options.UserOnly)
			{
				ctrlPaymentGateway._UserOnly = true;
				ctrlPaymentGateway._UserName = options.UserOnly;

				// Change messaging 
				$('#payment-gateway-stage1').html('Activate user account for ' + ctrlPaymentGateway._UserName);
				$('#payment-gateway-stage1-p1').html('In order to activate this account, may we please request that you choose the Pay as You Go period and pay via the button below:');
				$('#payment-gateway-stage1-p2').html('Once your payment has been authorised, this user account will be activated with immediate effect allowing ' + 
					ctrlPaymentGateway._UserName + ' to login immediately.');	

				// User accounts may also be on a free plan
				if (options.FreePlan)
				{
					sMessage = 'In order to activate this account, may we please request that you confirm using the button below:';
					$('#payment-gateway-stage1-p1').text(sMessage);
					$('#payment-gateway-stage1-iframe-p').hide();
					$('#payment-gateway-stage1-p2-action').text('confirmation.');
					$('#payment-gateway-stage1-free-plan').show();
					$('#payment-gateway-stage1-p2').html('Once you confirm activation, this user account will be be activated with immediate effect allowing ' + 
							ctrlPaymentGateway._UserName + ' to login immediately after receiving an automated e-mail with full login instructions.');
				}
			}
			else if (options.FreePlan)
			{
				// March 2020 Coronavirus/COVID-19 Pandemic
				sMessage = 'In order to activate your account, may we please request that you confirm using the button below:';
				$('#payment-gateway-stage1-p1').text(sMessage);
				$('#payment-gateway-stage1-iframe-p').hide();
				$('#payment-gateway-stage1-p2-action').text('confirmation.');
				$('#payment-gateway-stage1-free-plan').show();
			}
		}

		// Nov 2018 - always stay in current browser tab, even when users have clicked their e-mail link
		bTargetParent = true;

		// March 2020: https://www.k8oms.net/home/paypal-test
		// Google prevents opening the Paypal page in the same page for security reasons.
		bTargetParent = false;

		// We want to control the target to open a new window or remain here!
		var sTarget = bTargetParent ? "_parent" : "_blank";
		var sURL = ConfirmCustomerRegistrationResponse.PaymentGatewayURL + "&target=" + sTarget;

		// Set the width and src of the iFrame
		var iFrame = $('#payment-gateway-iframe');

		if(!bTargetParent)
		{
			// March 2020: iFramed page https://api.trisys.co.uk/finance/paypal-apexplan.aspx
			// sends us a message when it has opened paypal tab to capture payment
			window.addEventListener('message', function(e) 
			{
				var key = e.message ? 'message' : 'data';
				var data = e[key];

				if(data == "Commenced-Payment-Process")
					ctrlPaymentGateway.StartWaitingForPayment();

			}, false);
		}

		// Set the width of the iFrame
		var parentBody = iFrame.parent();
        var iWidth = parentBody.width() + 20;
        iFrame.css("width", iWidth);

		// Set the src in the iFrame
		iFrame.attr('src', sURL);

		// Oops - look like we need to reposition on Chrome!
		var fnChromeKludge = function()
		{
			var dialogue = $('#trisys-modal-dialogue');
			var iTop = parseInt(dialogue.css('top'));

			// FFS there are seemingly 2 modes of positioning for modals: relative and absolute
			// Sometimes we get 1000+ when it is near the top. How can we effing tell?
			//if(iTop > 200)
			//	dialogue.css('top', '40px');
		};
		setTimeout(fnChromeKludge, 1000);
	},

	LoadAfterPaymentCompleted: function(sGUID)
	{
		ctrlPaymentGateway._sGUID = sGUID;
		ctrlPaymentGateway.StartWaitingForPayment();
	},

	StartWaitingForPayment: function()
	{
		$('#payment-gateway-prepayment-click').hide();
		$('#payment-gateway-postpayment-click').show();

		ctrlPaymentGateway.ScheduleCheckForPayment();
	},

	// User has completed registration and wishes to commission a cloud service
	// Basically mimic the PayPal payment causing the commissioning workflow to commence
	ConfirmFreePlanCommissioning: function()
	{
		$('#payment-gateway-prepayment-click').hide();
		$('#payment-gateway-confirm-free-plan-click').show();

		var payloadObject = {};

        var CConfirmedFreePlanRequest = { 
			GUID: ctrlPaymentGateway._sGUID 
		};

        payloadObject.URL = "PaymentGateway/ConfirmedFreePlan";

        payloadObject.OutboundDataPacket = CConfirmedFreePlanRequest;

        payloadObject.InboundDataFunction = function (CConfirmedFreePlanResponse)
        {
            if (CConfirmedFreePlanResponse)
            {
                var bSuccess = CConfirmedFreePlanResponse.Success;
                if (bSuccess)
                {
					// Yes, the workflow for the free plan is the same as paid plans.
					// We wait for commissioning to compete and allow the user to login.
					// Why would it be any different?
					$('#payment-gateway-confirm-free-plan-click').hide();
					$('#payment-gateway-provisioning-start-action').text('account activation request');
					ctrlPaymentGateway.ScheduleCheckForPayment();

					if(ctrlPaymentGateway._UserOnly)
						ctrlPaymentGateway.UserAccountActivatedVisualBlockDisplay('');
                }
                else
                    TriSysApex.UI.ShowMessage(CConfirmedFreePlanResponse.ErrorMessage);
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.errorAlert('ctrlPaymentGateway.ConfirmFreePlanCommissioning: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysAPI.Data.PostToWebAPI(payloadObject);
	},

	// Check for payment every second
	ScheduleCheckForPayment: function()
	{
		setTimeout(ctrlPaymentGateway.CheckForPayment, 1000);
	},

	// Check for payment via Web API
	CheckForPayment: function()
	{
		var payloadObject = {};

        var CConfirmPaymentStatusRequest = { GUID: ctrlPaymentGateway._sGUID };

        payloadObject.URL = "PaymentGateway/ConfirmPaymentStatus";

        payloadObject.OutboundDataPacket = CConfirmPaymentStatusRequest;

        payloadObject.InboundDataFunction = function (CConfirmPaymentStatusResponse)
        {
            if (CConfirmPaymentStatusResponse)
            {
                var bSuccess = CConfirmPaymentStatusResponse.Success;
                if (bSuccess)
                {
					var bPaid = CConfirmPaymentStatusResponse.Paid;
					if(bPaid)
					{
						if(CConfirmPaymentStatusResponse.UserAccountActivation)
							ctrlPaymentGateway.UserAccountActivated(CConfirmPaymentStatusResponse);
						else
						{
							// Proceed to next stage
							ctrlPaymentGateway.StartProvisioning();
						}
					}
					else
					{
						// Schedule again
						ctrlPaymentGateway.ScheduleCheckForPayment();
					}
                }
                else
                    TriSysApex.UI.ShowMessage(CConfirmPaymentStatusResponse.ErrorMessage);
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.errorAlert('ctrlPaymentGateway.CheckForPayment: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysAPI.Data.PostToWebAPI(payloadObject);
	},

	StartProvisioning: function()
	{
		$('#payment-gateway-postpayment-click').hide();
		$('#payment-gateway-provisioning-start').show();

		ctrlPaymentGateway.ScheduleCheckForCompletedProvisioning();
	},

	// Check for completed provisioning every 15 seconds
	ScheduleCheckForCompletedProvisioning: function()
	{
		setTimeout(ctrlPaymentGateway.CheckForCompletedProvisioning, 15000);
	},
	
	CheckForCompletedProvisioning: function(fnCallbackIfProvisionedOrNot)
	{
		var payloadObject = {};

        var CProvisioningStatusRequest = { GUID: ctrlPaymentGateway._sGUID };

        payloadObject.URL = "PaymentGateway/ProvisioningStatus";

        payloadObject.OutboundDataPacket = CProvisioningStatusRequest;

        payloadObject.InboundDataFunction = function (CProvisioningStatusResponse)
        {
            if (CProvisioningStatusResponse)
            {
                var bSuccess = CProvisioningStatusResponse.Success;
                if (bSuccess)
                {
					var bProvisioned = CProvisioningStatusResponse.Provisioned;

					if(fnCallbackIfProvisionedOrNot)
					{
						// User account payment only
						fnCallbackIfProvisionedOrNot(bProvisioned);
					}
					else
					{
						if(bProvisioned)
						{
							// Proceed to next stage of full system provisioning
							ctrlPaymentGateway.CompletedProvisioning(CProvisioningStatusResponse);
						}
						else
						{
							// Schedule again
							ctrlPaymentGateway.ScheduleCheckForCompletedProvisioning();
						}
					}
                }
                else
                    TriSysApex.UI.ShowMessage(CProvisioningStatusResponse.ErrorMessage);
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.errorAlert('ctrlPaymentGateway.CheckForCompletedProvisioning: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysAPI.Data.PostToWebAPI(payloadObject);
	},

	// Woohoo we are done, let use read the text if they can!
	CompletedProvisioning: function(CProvisioningStatusResponse)
	{
		$('#payment-gateway-provisioning-start').hide();
		$('#payment-gateway-provisioning-completed').show();

		var iSeconds = 11;
		var fnCountdownToLogin = function()
		{
			iSeconds -= 1;
			var sTime = iSeconds + " second" + (iSeconds == 1, "", "s");
			$('#payment-gateway-timetillautologin').html(sTime);

			if(iSeconds > 0)
				setTimeout(fnCountdownToLogin, 1000);
			else
				ctrlPaymentGateway.CommenceLogin(CProvisioningStatusResponse);
		};

		fnCountdownToLogin();
	},

	UserAccountActivatedVisualBlockDisplay(sUserAccountName)
	{
		$('#payment-gateway-prepayment-click').hide();
		$('#payment-gateway-postpayment-click').hide();
		$('#payment-gateway-provisioning-start').hide();
		$('#payment-gateway-provisioning-completed').show();

		if(sUserAccountName.length > 0)
			sUserAccountName += ' ';
		$('#payment-gateway-provisioning').html('The user account ' + sUserAccountName + 'is now being activated');
		$('#payment-gateway-provisioning-p2').hide();

		$('#payment-gateway-provisioning-p4').html('Once this has been completed, the user list will be refreshed.');
		$('#payment-gateway-provisioning-spinner').show();
	},

	// We have paid for this user account so we want to re-login as this account administrator and focus on the admin console to see the new account
	UserAccountActivated: function(CConfirmPaymentStatusResponse)
	{
		ctrlPaymentGateway.UserAccountActivatedVisualBlockDisplay(CConfirmPaymentStatusResponse.UserAccountName);
		
		// WTF?
		try {
			subscriptionPaid.UserAccountProvisioning(CConfirmPaymentStatusResponse.UserAccountName);		

		} catch (e) 
		{
			// paid.js is not loaded!
			// This will be that the customer is on a free plan
		}

		// Although payment has been received, we may need a second or two before the account is active
		var fnCommenceLogin = function(bProvisioned)
		{
			if(bProvisioned)
			{
				TriSysApex.UI.CloseModalPopup();
				AdminConsole.PopulateUserGrid();

				if(CConfirmPaymentStatusResponse.UserAccountActivation)
				{
					// If this user/contact is not the administrator, refresh the admin console grid
					var bThisUserAccount = ctrlPaymentGateway.isThisUserAccount(CConfirmPaymentStatusResponse.UserId);
					var bAdminConsoleOpen = TriSysApex.FormsManager.isFormOpen("AdminConsole");
					if(!bThisUserAccount && bAdminConsoleOpen)
						return;
				}

				// Login after provisioning or as administrator
				var fnRefreshLogin = function()
				{
					ctrlPaymentGateway.CommenceLogin(CConfirmPaymentStatusResponse); 
				};

				if (TriSysWeb.Security.IsUserLoggedIn())
				{
					var sLogoffMessage = "You re-activated your own account. Refresh login?";
					TriSysApex.UI.questionYesNo(sLogoffMessage, "Logoff " + TriSysApex.Copyright.ShortProductName, "Yes", fnRefreshLogin, "No");
				}
				else
					fnRefreshLogin();				
			}
			else
				setTimeout(fnCheckForCompletedProvisioning, 1000);
		};

		var fnCheckForCompletedProvisioning = function() { ctrlPaymentGateway.CheckForCompletedProvisioning(fnCommenceLogin); };	
		fnCommenceLogin(false);
	},

	isThisUserAccount: function(lUserId)
	{
		var userCredentials = TriSysApex.LoginCredentials.UserCredentials();

        if (userCredentials)
        {
            if (userCredentials.LoggedInUser)
            {
                if (userCredentials.LoggedInUser.UserId === lUserId)
                {
                    return true;
                }
            }
        }

		return false;
	},

	CommenceLogin: function(CProvisioningStatusResponse)
	{
		// Close my popup
		TriSysApex.UI.CloseModalPopup();

		// Write login cookies as auto-login
		//var credentialPacket = {
		//	EMailAddress: CProvisioningStatusResponse.EMail,
		//	Password: CProvisioningStatusResponse.Password
		//};
		//TriSysWeb.Security.WritePersistedLoginCredentials(credentialPacket);

		// The URL https://.../#customer~{GUID} must be eradicated so will need to do a full app refresh to force auto-login
		var sURL = "https://apex.trisys.co.uk/#supportlogin~" + CProvisioningStatusResponse.Base64SupportCredentials;
		window.location = sURL;
	}
};