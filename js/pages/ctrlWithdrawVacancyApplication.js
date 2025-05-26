var ctrlWithdrawVacancyApplication =
{
    JobReferenceID: 'ctrlWithdrawVacancyApplication_JobReference',
    JobReferenceLabelID: 'ctrlWithdrawVacancyApplication_JobReferenceLabel',
    JobTitleID: 'ctrlWithdrawVacancyApplication_JobTitle',
    JobTitleFormBlockID: 'ctrlWithdrawVacancyApplication_JobTitleBlock',
    ReasonID: 'ctrlWithdrawVacancyApplication_Reason',

    CookieName: 'ctrlWithdrawVacancyApplication.Settings',


    Load: function ()
    {
        // Read from TriSysWebJobs.Vacancies.MultipleSelectedVacancies and populate screen
        var iCount = TriSysWebJobs.Vacancies.MultipleSelectedVacancies.RequirementId.length;
        var sReference = (iCount == 1 ? TriSysWebJobs.Vacancies.MultipleSelectedVacancies.Reference : iCount);
        var sJobTitle = TriSysWebJobs.Vacancies.MultipleSelectedVacancies.JobTitle;

        if (iCount > 1)
        {
            $('#' + ctrlWithdrawVacancyApplication.JobReferenceLabelID).html("Vacancy Count");
            $('#' + ctrlWithdrawVacancyApplication.JobTitleFormBlockID).hide();
        }

        $('#' + ctrlWithdrawVacancyApplication.JobReferenceID).html(sReference);
        $('#' + ctrlWithdrawVacancyApplication.JobTitleID).html(sJobTitle);

        // Use same to/from as last time
        var settings = TriSysAPI.Persistence.Read(ctrlWithdrawVacancyApplication.CookieName);
        if (settings)
        {
            $('#' + ctrlWithdrawVacancyApplication.ReasonID).val(settings.Reason);
        }
    },

    Withdraw: function ()
    {
        var settings = {
            Reason: $('#' + ctrlWithdrawVacancyApplication.ReasonID).val()
        };

        // Validate both to e-mail and from name
        var sError = null;
        if (!settings.Reason)
            sError = 'Please enter a short reason why you are withdrawing your application';

        if (sError)
        {
            TriSysApex.UI.ShowMessage(sError, TriSysWebJobs.Constants.ApplicationName);
            return false;
        }

        // Call Web API to do all the work
        var CVacancyWithdrawApplicationRequest = {
            Reason: settings.Reason,
            RequirementIdList: TriSysWebJobs.Vacancies.MultipleSelectedVacancies.RequirementId,
            WebJobsRequest: TriSysWebJobs.Agency.WebJobsRequest()
        };

        var iCount = TriSysWebJobs.Vacancies.MultipleSelectedVacancies.RequirementId.length;
        ctrlWithdrawVacancyApplication.WithdrawFromMultipleVacanciesViaServer(CVacancyWithdrawApplicationRequest, iCount);

        // Persist for next visit to this page
        TriSysAPI.Persistence.Write(ctrlWithdrawVacancyApplication.CookieName, settings);

        return true;
    },

    WithdrawFromMultipleVacanciesViaServer: function (CVacancyWithdrawApplicationRequest, iNumberOfJobs)
    {
        var sWaitMessage = "Withdrawing from " + iNumberOfJobs + " Vacanc" + (iNumberOfJobs > 1 ? "ies" : "y") + "...";
        TriSysApex.UI.ShowWait(null, sWaitMessage);

        var payloadObject = {};
        payloadObject.URL = "Vacancy/WithdrawApplication";
        payloadObject.OutboundDataPacket = CVacancyWithdrawApplicationRequest;
        payloadObject.InboundDataFunction = function (CVacancyWithdrawApplicationResult)
        {
            TriSysApex.UI.HideWait();

            if (CVacancyWithdrawApplicationResult)
            {
                if (CVacancyWithdrawApplicationResult.Success)
                {
                    var sMessage = "Withdrawn from " + iNumberOfJobs + " vacanc" + (iNumberOfJobs == 1 ? "y" : "ies") +
                        "<br />View all vacancy applications?";

                    TriSysApex.UI.questionYesNo(sMessage, TriSysWebJobs.Constants.ApplicationName, "Yes",
                        function ()
                        {
                            TriSysApex.FormsManager.OpenForm(TriSysWebJobs.Constants.CandidateVacancyApplications, 0, true);
                            return true;
                        },
                        "No");
                }
                else
                    TriSysApex.UI.errorAlert(CVacancyWithdrawApplicationResult.ErrorMessage, TriSysWebJobs.Constants.ApplicationName);
            }

            return true;
        };
        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.ErrorHandlerRedirector('ctrlWithdrawVacancyApplication.WithdrawFromMultipleVacanciesViaServer: ', request, status, error);
        };
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    }
};

$(document).ready(function ()
{
    ctrlWithdrawVacancyApplication.Load();
});