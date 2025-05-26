var ctrlApplyToVacancy =
{
    JobReferenceID: 'ctrlApplyToVacancy_JobReference',
    JobReferenceLabelID: 'ctrlApplyToVacancy_JobReferenceLabel',
    JobTitleID: 'ctrlApplyToVacancy_JobTitle',
    JobTitleFormBlockID: 'ctrlApplyToVacancy_JobTitleBlock',
    CoveringLetterID: 'ctrlApplyToVacancy_CoveringLetter',

    CookieName: 'ctrlApplyToVacancy.Settings',


    Load: function ()
    {
        // Read from TriSysWebJobs.Vacancies.MultipleSelectedVacancies and populate screen
        var iCount = TriSysWebJobs.Vacancies.MultipleSelectedVacancies.RequirementId.length;
        var sReference = (iCount == 1 ? TriSysWebJobs.Vacancies.MultipleSelectedVacancies.Reference : iCount);
        var sJobTitle = TriSysWebJobs.Vacancies.MultipleSelectedVacancies.JobTitle;

        if (iCount > 1)
        {
            $('#' + ctrlApplyToVacancy.JobReferenceLabelID).html("Vacancy Count");
            $('#' + ctrlApplyToVacancy.JobTitleFormBlockID).hide();
        }

        $('#' + ctrlApplyToVacancy.JobReferenceID).html(sReference);
        $('#' + ctrlApplyToVacancy.JobTitleID).html(sJobTitle);

        // Use same to/from as last time
        var settings = TriSysAPI.Persistence.Read(ctrlApplyToVacancy.CookieName);
        if (settings)
        {
            $('#' + ctrlApplyToVacancy.CoveringLetterID).val(settings.CoveringLetter);
        }
    },

    Apply: function ()
    {
        var settings = {
            CoveringLetter: $('#' + ctrlApplyToVacancy.CoveringLetterID).val()
        };

        // Validate 
        var sError = null;
        if (!settings.CoveringLetter)
            sError = 'Please enter a short covering letter to help us progress your application';

        if (sError)
        {
            TriSysApex.UI.ShowMessage(sError, TriSysWebJobs.Constants.ApplicationName);
            return false;
        }

        // Call Web API to do all the work
        var CVacancyApplyMultiple = {
            Shortlist: true,
            Comments: settings.CoveringLetter,
            RequirementIdCollection: TriSysWebJobs.Vacancies.MultipleSelectedVacancies.RequirementId,
            WebJobsRequest: TriSysWebJobs.Agency.WebJobsRequest()
        };

        var iCount = TriSysWebJobs.Vacancies.MultipleSelectedVacancies.RequirementId.length;
        ctrlApplyToVacancy.ApplyToMultipleVacanciesViaServer(CVacancyApplyMultiple, iCount);

        // Persist for next visit to this page
        TriSysAPI.Persistence.Write(ctrlApplyToVacancy.CookieName, settings);

        return true;
    },

    ApplyToMultipleVacanciesViaServer: function (CVacancyApplyMultiple, iNumberOfJobs)
    {
        var fnPostApply = function ()
        {
            TriSysApex.UI.HideWait();

            var sMessage = "Applied to " + iNumberOfJobs + " vacanc" + (iNumberOfJobs == 1 ? "y" : "ies") +
                        "<br />View all vacancy applications?";

            TriSysApex.UI.questionYesNo(sMessage, TriSysWebJobs.Constants.ApplicationName, "Yes",
                function ()
                {
                    TriSysApex.FormsManager.OpenForm(TriSysWebJobs.Constants.CandidateVacancyApplications, 0, true);
                    return true;
                },
                "No");
        };

        var sWaitMessage = "Applying to " + iNumberOfJobs + " Vacanc" + (iNumberOfJobs > 1 ? "ies" : "y") + "...";
        TriSysApex.UI.ShowWait(null, sWaitMessage);

        var payloadObject = {};
        payloadObject.URL = "Vacancy/ApplyToMultiple";
        payloadObject.OutboundDataPacket = CVacancyApplyMultiple;
        payloadObject.InboundDataFunction = function (CVacancyApplyResult)
        {
            if (CVacancyApplyResult)
            {
                TriSysApex.UI.HideWait();

                if (CVacancyApplyResult.Success)
                {
                    fnPostApply();
                }
                else
                    TriSysApex.UI.errorAlert(CVacancyApplyResult.ErrorMessage, TriSysWebJobs.Constants.ApplicationName);
            }

            return true;
        };
        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.ErrorHandlerRedirector('ctrlApplyToVacancy.ApplyToMultipleVacanciesViaServer: ', request, status, error);
        };
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    }
};

$(document).ready(function ()
{
    ctrlApplyToVacancy.Load();
});