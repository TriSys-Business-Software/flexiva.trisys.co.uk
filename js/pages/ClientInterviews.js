var ClientInterviews =
{
    Load: function()
    {
        // Put on hold 3rd Feb 2017: Ignited 28 Mar 2017.
        ClientInterviews.PopulatePendingInterviewsGrid();
    },

    PopulatePendingInterviewsGrid: function ()
    {
        var payloadObject = {};

        payloadObject.URL = 'Vacancies/ClientInterviewFeedback';
        payloadObject.OutboundDataPacket = null;
        payloadObject.InboundDataFunction = function (CClientInterviewFeedbackResponse)
        {
            TriSysApex.UI.HideWait();

            // The feedback button function
            var fnFeedback = function (rowData)
            {
                ClientInterviews.OpenFeedbackForm(rowData);
            };

            // Show both grids
            var columns = ClientInterviews.Columns;

            // Tweak the columns in the 1st grid
            columns[10].hidden = true;
            columns[11].hidden = true;

            ClientInterviews.PopulateGrid('divClientInterviewsPendingFeedbackGrid', 'PendingInterviews', 'Pending Interviews',
                    CClientInterviewFeedbackResponse.InterviewsWithoutFeedback, fnFeedback, 'Feedback', columns);

            // Tweak the columns in the 2nd grid
            columns[10].hidden = false;
            columns[11].hidden = false;
            ClientInterviews.PopulateGrid('divClientInterviewsWithFeedbackGrid', 'FeedbackInterviews', 'Interviews with Feedback',
                    CClientInterviewFeedbackResponse.InterviewsWithFeedback, null, null, columns);

            return true;
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.ShowMessage('ClientInterviews.PopulatePendingInterviewsGrid : ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Reading Interviews...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    PopulateGrid: function (sGridID, sGridName, sTitle, interviews, fnFeedback, sButtonCaption, columns)
    {
        var bHorizontalScrolling = false;   //true;     // Unfortunately, this breaks row selection and therefore all menus for this grid!

        TriSysSDK.Grid.VirtualMode({
            Div: sGridID,
            ID: sGridName,
            Title: sTitle,
            RecordsPerPage: TriSysApex.UserOptions.RecordsPerPage(),
            SQL: null,
            PopulationByObject: interviews,
            Columns: columns,
            MobileVisibleColumns: ClientInterviews.MobileVisibleColumns,
            MobileRowTemplate: ClientInterviews.MobileRowTemplate,

            KeyColumnName: "TaskId",
            DrillDownFunction: fnFeedback,
            OpenButtonCaption: sButtonCaption,
            MultiRowSelect: false,
            ColumnFilters: false,
            Grouping: false,
            HorizontalScrolling: bHorizontalScrolling
        });
    },

    Columns: [
                { field: "CandidateId", title: "CandidateId", type: "number", width: 70, hidden: true },
                { field: "TaskId", title: "TaskID", type: "number", width: 70, hidden: true },
                { field: "RequirementId", title: "RequirementID", type: "number", width: 70, hidden: true },
                { field: "Reference", title: "Reference", type: "string", width: 120 },
                { field: "RequirementJobTitle", title: "Job Title", type: "string", width: 170 },
                { field: "Company", title: "Company", type: "string", width: 170, hidden: true },
                { field: "CandidateName", title: "Candidate Name", type: "string", width: 170 },
                { field: "CandidateJobTitle", title: "Candidate Job Title", type: "string", width: 170, hidden: true },
                { field: "InterviewStage", title: "Interview Stage", type: "string", width: 140 },
                { field: "InterviewDate", title: "Interview Date/Time", type: "date", format: "{0:dd MMM yyyy HH:mm}", width: 160 },
                { field: "Feedback", title: "Feedback", type: "string", hidden: true },
                { field: "FeedbackDate", title: "Feedback Date/Time", type: "date", format: "{0:dd MMM yyyy HH:mm}", width: 160, hidden: true },
                { field: "TamperProof", title: "TamperProof", type: "string", width: 160, hidden: true }
    ],
    MobileVisibleColumns: [
                { field: "Reference" }
    ],
    MobileRowTemplate: '<td colspan="1"><strong>#: Reference # </strong><br />#: RequirementJobTitle #<br />' +
                        '<i>Candidate: #: CandidateName #</i><br />' +
                        'Interview: #: kendo.format("{0:dd MMM yyyy}", InterviewDate) #</i><br />' +
                        'Stage: #: InterviewStage #<br />' +
                        '<hr></td>',

    OpenFeedbackForm: function (rowData)
    {
        var lCandidateId = rowData.CandidateId;
        var lTaskId = rowData.TaskId;
        var lRequirementId = rowData.RequirementId;
        var sInterviewStage = rowData.InterviewStage;
        var sTamperProof = rowData.TamperProof;

        var fnSendFeedback = function ()
        {
            return ClientInterviews.SendSendFeedback(lCandidateId, lTaskId, lRequirementId, sInterviewStage, sTamperProof);
        };

        var fnCancelSend = function ()
        {
            // OK to close
            return true;
        };

        // Show the dialogue now
        var parametersObject = new TriSysApex.UI.ShowMessageParameters();
        parametersObject.Title = "Interview Feedback";
        //parametersObject.Height = 550;
        parametersObject.Resizable = false;
        parametersObject.Maximize = false;
        //parametersObject.Draggable = false;     // Uncomment to see how it works great
        parametersObject.Image = 'fa-envelope-o';

        parametersObject.ContentURL = TriSysApex.Constants.UserControlFolder + 'ctrlClientInterviewFeedback.html';

        parametersObject.OnLoadCallback = function ()
        {
            // Show context
            $('#ctrlClientInterviewFeedback_JobReference').html(rowData.Reference);
            $('#ctrlClientInterviewFeedback_JobTitle').html(rowData.RequirementJobTitle);
            $('#ctrlClientInterviewFeedback_InterviewStage').html(sInterviewStage);
            $('#ctrlClientInterviewFeedback_InterviewDate').html(moment(rowData.InterviewDate).format('dddd DD MMMM YYYY') + ' @ ' + moment(rowData.InterviewDate).format('HH:mm') );
            $('#ctrlClientInterviewFeedback_Candidate').html(rowData.CandidateName);
        };

        // Buttons
        parametersObject.ButtonLeftText = "Submit Feedback";
        parametersObject.ButtonLeftFunction = fnSendFeedback;
        parametersObject.ButtonLeftVisible = true;
        parametersObject.ButtonLeftWidth = 100;
        parametersObject.ButtonRightWidth = 100;
        parametersObject.ButtonRightVisible = true;
        parametersObject.ButtonRightText = "Cancel";
        parametersObject.ButtonRightFunction = fnCancelSend;

        TriSysApex.UI.PopupMessage(parametersObject);
    },

    SendSendFeedback: function (lCandidateId, lTaskId, lRequirementId, sInterviewStage, sTamperProof)
    {
        var sFeedback = $('#ctrlClientInterviewFeedback_Feedback').val();
        if (!sFeedback)
        {
            TriSysApex.UI.ShowMessage("Please provide some feedback from the interview.");
            return false
        }

        // After the callback, we should refresh the grids showing that the feedback moved from the top grid to the bottom
        var fnCallback = ClientInterviews.PopulatePendingInterviewsGrid;

        // Fire the web service to process this 
        ClientInterviews.SubmitFeedback(lCandidateId, lTaskId, lRequirementId, sInterviewStage, sTamperProof, sFeedback, fnCallback);

        return true;
    },

    SubmitFeedback: function (lCandidateId, lTaskId, lRequirementId, sInterviewStage, sTamperProof, sFeedback, fnCallback)
    {
        var ClientInterviewSubmitFeedbackRequest = {
            CandidateId: lCandidateId,
            RequirementId: lRequirementId,
            TaskId: lTaskId,
            Stage: sInterviewStage,
            Feedback: sFeedback,
            TamperProof: sTamperProof
        };

        var payloadObject = {};

        payloadObject.URL = 'Vacancies/ClientInterviewSubmitFeedback';
        payloadObject.OutboundDataPacket = ClientInterviewSubmitFeedbackRequest;
        payloadObject.InboundDataFunction = function (CClientInterviewSubmitFeedbackResponse)
        {
            TriSysApex.UI.HideWait();

            if (CClientInterviewSubmitFeedbackResponse)
            {
                if (CClientInterviewSubmitFeedbackResponse.Success)
                    fnCallback();
                else
                    TriSysApex.UI.ShowMessage(CClientInterviewSubmitFeedbackResponse.ErrorMessage);
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.ShowMessage('ClientInterviews.SubmitFeedback : ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Submitting Interview Feedback...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    }
};

$(document).ready(function ()
{
    ClientInterviews.Load();
});

