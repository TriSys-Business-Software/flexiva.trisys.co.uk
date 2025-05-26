var ctrlProvisioningProgress =
{
	Load: function(sGUID, ConfirmCustomerRegistrationResponse)
	{
		// We have already confirmed the URL and therefore the payment checking BOT will 
		// subsequently commence the provisioning process.

		// We only therefore need to wait for it to complete:
		ctrlProvisioningProgress.PeriodicallyCheckForCompletion(sGUID);
	},

	// Every 15 seconds, check again
	PeriodicallyCheckForCompletion: function(sGUID)
	{
		setTimeout(function()
		{
			ctrlProvisioningProgress.MonitorProvisioning(sGUID);

		}, 15000);
	},

	// Provisioning is now scheduled on the back-end, so we are called every 10 seconds to check progress
	MonitorProvisioning: function(sGUID)
	{
		var payloadObject = {};

        var CProvisioningStatusRequest = { GUID: sGUID };

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

					if(bProvisioned)
					{
						// Proceed to final stage of provisioning
						ctrlProvisioningProgress.CompletedProvisioning(CProvisioningStatusResponse);
					}
					else
					{
						// Schedule again
						ctrlProvisioningProgress.PeriodicallyCheckForCompletion(sGUID);
					}
                }
                else
                    TriSysApex.UI.ShowMessage(CProvisioningStatusResponse.ErrorMessage);
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.errorAlert('ctrlProvisioningProgress.MonitorProvisioning: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysAPI.Data.PostToWebAPI(payloadObject);
	},

	CompletedProvisioning: function(CProvisioningStatusResponse)
	{
		$('#provisioning-progress-begin').hide();
		$('#provisioning-progress-completed').show();

		// Close this popup
		TriSysApex.UI.CloseModalPopup();
	
		// The URL https://.../#customer~{GUID} must be eradicated so will need to do a full app refresh to force auto-login
		var sURL = "https://resourcer.trisys.co.uk/#supportlogin~" + CProvisioningStatusResponse.Base64SupportCredentials;
		setTimeout(function()
		{
			window.location.replace(sURL);
			//window.location.href = sURL;
			//$(location).attr("href", URL);
			//window.open(sURL,"_self","","");

			// Have to...
			loginPage.Load();

		}, 10);
	}
};

