var ctrlClientShortlistAction =
{
    JobReferenceID: 'ctrlClientShortlistAction_JobReference',
    JobTitleID: 'ctrlClientShortlistAction_JobTitle',
    CommentsID: 'ctrlClientShortlistAction_Comments',

    Load: function (candidate, requirement)
    {
        $('#' + ctrlClientShortlistAction.JobReferenceID).html(requirement.Reference);
        $('#' + ctrlClientShortlistAction.JobTitleID).html(requirement.JobTitle);       
    },

    SendRequest: function (candidate, requirement)
    {
        var sComments = $('#' + ctrlClientShortlistAction.CommentsID).val();

        // Validate both to e-mail and from name
        var sError = null;
        if (!sComments)
            sError = 'Please enter a comment about why you wish to ' + candidate.Description;

        if (sError)
        {
            TriSysApex.UI.ShowMessage(sError, TriSysWebJobs.Constants.ApplicationName);
            return false;
        }

        // Call Web API to do all the work
        var CClientVacancyShortlistActionRequest = {
            Candidate: candidate,
            Requirement: requirement,
            Comments: sComments,
            WebJobsRequest: TriSysWebJobs.Agency.WebJobsRequest()
        };

        var sWaitMessage = "Sending Request...";
        TriSysApex.UI.ShowWait(null, sWaitMessage);

        var payloadObject = {};
        payloadObject.URL = "Vacancy/ClientShortlistActionRequest";
        payloadObject.OutboundDataPacket = CClientVacancyShortlistActionRequest;
        payloadObject.InboundDataFunction = function (CClientVacancyShortlistActionResponse)
        {
            if (CClientVacancyShortlistActionResponse)
            {
                TriSysApex.UI.HideWait();

                if (CClientVacancyShortlistActionResponse.Success)
                {
                    var fnComplete = function ()
                    {
                        var sMessage = "Your request to " + candidate.Description + " has been sent.";
                        TriSysApex.UI.ShowMessage(sMessage, TriSysWebJobs.Constants.ApplicationName);
                    };
                    setTimeout(fnComplete, 250);
                    TriSysApex.UI.CloseModalPopup();
                }
                else
                    TriSysApex.UI.errorAlert(CClientVacancyShortlistActionResponse.ErrorMessage, TriSysWebJobs.Constants.ApplicationName);
            }
        };
        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.ErrorHandlerRedirector('ctrlClientShortlistAction.SendRequest: ', request, status, error);
        };
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    }
};
