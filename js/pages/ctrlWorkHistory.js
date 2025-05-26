var ctrlWorkHistory =
{
    // Contact form passes in the work history ID
    Load: function ()
    {
        $('#work-history-form-dates').focus();

        if (TriSysApex.ModalDialogue.ContactWorkHistory.ContactWorkHistoryId == 0)
            return;

        // This is an existing record so get from web API
        var dataPacket = {
            'ContactWorkHistoryId': TriSysApex.ModalDialogue.ContactWorkHistory.ContactWorkHistoryId
        };

        var payloadObject = {};

        // Call the API to submit the data to the server
        payloadObject.URL = "Contacts/ReadWorkHistory";

        payloadObject.OutboundDataPacket = dataPacket;

        payloadObject.InboundDataFunction = function (data)
        {
            TriSysApex.UI.HideWait();

            var CReadWorkHistoryResponse = data;

            if (CReadWorkHistoryResponse)
            {
                if (CReadWorkHistoryResponse.Success)
                {
                    // Write to screen fields
                    $('#work-history-form-dates').val(CReadWorkHistoryResponse.Dates);
                    $('#work-history-form-employer').val(CReadWorkHistoryResponse.Employer);
                    $('#work-history-form-location').val(CReadWorkHistoryResponse.Location);
                    $('#work-history-form-jobtitle').val(CReadWorkHistoryResponse.JobTitle);
                    $('#work-history-form-department').val(CReadWorkHistoryResponse.Department);
                    $('#work-history-form-description').val(CReadWorkHistoryResponse.Description);

                    return;
                }
                else
                    TriSysApex.UI.ShowMessage(CReadWorkHistoryResponse.ErrorMessage);
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('ctrlWorkHistory.Load: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Reading Work History...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    Save: function (lContactId)
    {
        var CWriteWorkHistoryRequest = {};

        // Read from screen fields
        CWriteWorkHistoryRequest.Dates = $('#work-history-form-dates').val();
        CWriteWorkHistoryRequest.Employer = $('#work-history-form-employer').val();
        CWriteWorkHistoryRequest.Location = $('#work-history-form-location').val();
        CWriteWorkHistoryRequest.JobTitle = $('#work-history-form-jobtitle').val();
        CWriteWorkHistoryRequest.Department = $('#work-history-form-department').val();
        CWriteWorkHistoryRequest.Description = $('#work-history-form-description').val();

        if (!CWriteWorkHistoryRequest.Dates || !CWriteWorkHistoryRequest.Employer)
        {
            TriSysApex.UI.ShowMessage("Please provide the dates and employer.");
            return;
        }

        // Send to web service
        CWriteWorkHistoryRequest.ContactWorkHistoryId = TriSysApex.ModalDialogue.ContactWorkHistory.ContactWorkHistoryId;
        CWriteWorkHistoryRequest.ContactId = lContactId;

        var payloadObject = {};

        // Call the API to submit the data to the server
        payloadObject.URL = "Contacts/WriteWorkHistory";

        payloadObject.OutboundDataPacket = CWriteWorkHistoryRequest;

        payloadObject.InboundDataFunction = function (data)
        {
            TriSysApex.UI.HideWait();

            var CWriteWorkHistoryResponse = data;

            if (CWriteWorkHistoryResponse)
            {
                if (CWriteWorkHistoryResponse.Success)
                {
                    ctrlWorkHistory.PostSaveEvent(CWriteWorkHistoryResponse.ContactWorkHistoryId);

                    return;
                }
                else
                    TriSysApex.UI.ShowMessage(CWriteWorkHistoryResponse.ErrorMessage);
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('ctrlWorkHistory.Save: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Saving Work History...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    PostSaveEvent: function (lContactWorkHistoryId)
    {
        // Refresh contact work history grid
        var sGrid = "contactForm-WorkHistoryGrid";
        TriSysSDK.Grid.ClearCheckedRows(sGrid);
        TriSysSDK.Grid.RefreshData(sGrid);

        // Close this modal dialogue
        TriSysApex.UI.CloseModalPopup();
    }
};

// Now display the document 
$(document).ready(function ()
{
    ctrlWorkHistory.Load();
});