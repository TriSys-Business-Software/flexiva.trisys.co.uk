var ctrlPortabilityRequest =
{
	Load: function (sFullName)
    {
		$('#ctrlPortabilityRequest-Name').html(sFullName);
    },

    Confirm: function ()
    {
        // Any other parameters required?

        ctrlPortabilityRequest.CommenceRequest();
    },

    CommenceRequest: function ()
    {
        var CPortabilityRequest =
        {
            //Reason: sReason
        };

        var payloadObject = {};

		payloadObject.URL = 'Contact/PortabilityRequest';
        payloadObject.OutboundDataPacket = CPortabilityRequest;
        payloadObject.InboundDataFunction = function (CPortabilityRequestResponse)
        {
            TriSysApex.UI.HideWait();

            if (CPortabilityRequestResponse.Success)
            {
                // Show label on profile form to show that this was done and close this popup
				if (TriSysWebJobs.Constants.LoggedInAsCandidate)
					CandidateEditAccount.PortabilityRequestReceived(new Date());
				else
					ClientEditAccountDetails.PortabilityRequestReceived(new Date());

                ctrlPortabilityRequest.DownloadExportedFile(CPortabilityRequestResponse.URL);
                TriSysApex.UI.CloseModalPopup();

                setTimeout(function ()
                {
                    TriSysApex.UI.ShowMessage("You have been sent an e-mail containing your data as an attached CSV file.");
                }, 100);
            }

            return true;
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('ctrlPortabilityRequest.CommenceRequest: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Portability Request...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    DownloadExportedFile: function(sURL)
    {
        // TODO
    }
};