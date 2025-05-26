var ctrlRequestRemoval =
{
	Load: function (sFullName)
    {
        $('#ctrlRequestRemoval-Name').html(sFullName);
        $('#ctrlRequestRemoval-Reason').focus();
    },

    Confirm: function()
    {
        var sReason = $('#ctrlRequestRemoval-Reason').val();

        // IF, 05 Jul 2018 Decided that a reason should not be mandatory due to request from Search Consultancy. No reason to make behaviour differ for different customers.
        // if(!sReason)
        // {
        //     // Shall we enforce a reason?
        //     // Francisco says yes on 09 March 2018
        //     TriSysApex.UI.ShowMessage("Please help us by supplying a reason why you do not want us to retain your details", "Request Removal Reason", 
        //         function ()
        //         {
        //             setTimeout(function () { $('#ctrlRequestRemoval-Reason').focus(); }, 100);
        //             return true;
        //         });
        //     return;
        // }

        ctrlRequestRemoval.CommenceRequest(sReason);
    },

    CommenceRequest: function (sReason)
    {
        var CRequestRemovalRequest =
        {
            Reason: sReason
        };

        var payloadObject = {};

        payloadObject.URL = 'Contact/RequestRemoval';
        payloadObject.OutboundDataPacket = CRequestRemovalRequest;
        payloadObject.InboundDataFunction = function (CRequestRemovalResponse)
        {
            TriSysApex.UI.HideWait();

            if (CRequestRemovalResponse.Success)
            {
                // Show label on profile form to show that this was done and close this popup
				if(TriSysWebJobs.Constants.LoggedInAsCandidate)
					CandidateEditAccount.RemovalRequested(new Date());
				else
					ClientEditAccountDetails.RemovalRequested(new Date());

                TriSysApex.UI.CloseModalPopup();

                setTimeout(function ()
                {
                    TriSysApex.UI.ShowMessage("You have been sent an e-mail confirming your removal request.");
                }, 100);
            }

            return true;
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('ctrlRequestRemoval.CommenceRequest: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Requesting Removal...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    }

};  // ctrlRequestRemoval