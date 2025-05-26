var ctrlEducationHistory =
{
    // Contact form passes in the education history ID
    Load: function ()
    {
        $('#education-history-form-dates').focus();

        if (TriSysApex.ModalDialogue.ContactEducationHistory.ContactEducationHistoryId == 0)
            return;

        // This is an existing record so get from web API
        var dataPacket = {
            'ContactEducationHistoryId': TriSysApex.ModalDialogue.ContactEducationHistory.ContactEducationHistoryId
        };

        var payloadObject = {};

        // Call the API to submit the data to the server
        payloadObject.URL = "Contacts/ReadEducationHistory";

        payloadObject.OutboundDataPacket = dataPacket;

        payloadObject.InboundDataFunction = function (data)
        {
            TriSysApex.UI.HideWait();

            var CReadEducationHistoryResponse = data;

            if (CReadEducationHistoryResponse)
            {
                if (CReadEducationHistoryResponse.Success)
                {
                    // Write to screen fields
                    $('#education-history-form-dates').val(CReadEducationHistoryResponse.Dates);
                    $('#education-history-form-school').val(CReadEducationHistoryResponse.School);
                    $('#education-history-form-location').val(CReadEducationHistoryResponse.Location);
                    $('#education-history-form-qualifications').val(CReadEducationHistoryResponse.Qualifications);
                    $('#education-history-form-comments').val(CReadEducationHistoryResponse.Comments);

                    return;
                }
                else
                    TriSysApex.UI.ShowMessage(CReadEducationHistoryResponse.ErrorMessage);
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('ctrlEducationHistory.Load: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Reading Education History...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    Save: function(lContactId)
    {
        var CWriteEducationHistoryRequest = {};

        // Read from screen fields
        CWriteEducationHistoryRequest.Dates = $('#education-history-form-dates').val();
        CWriteEducationHistoryRequest.School = $('#education-history-form-school').val();
        CWriteEducationHistoryRequest.Location = $('#education-history-form-location').val();
        CWriteEducationHistoryRequest.Qualifications = $('#education-history-form-qualifications').val();
        CWriteEducationHistoryRequest.Comments = $('#education-history-form-comments').val();

        if (!CWriteEducationHistoryRequest.Dates || !CWriteEducationHistoryRequest.School)
        {
            TriSysApex.UI.ShowMessage("Please provide the dates and school/college.");
            return;
        }

        // Send to web service
        CWriteEducationHistoryRequest.ContactEducationHistoryId = TriSysApex.ModalDialogue.ContactEducationHistory.ContactEducationHistoryId;
        CWriteEducationHistoryRequest.ContactId = lContactId;

        var payloadObject = {};

        // Call the API to submit the data to the server
        payloadObject.URL = "Contacts/WriteEducationHistory";

        payloadObject.OutboundDataPacket = CWriteEducationHistoryRequest;

        payloadObject.InboundDataFunction = function (data)
        {
            TriSysApex.UI.HideWait();

            var CWriteEducationHistoryResponse = data;

            if (CWriteEducationHistoryResponse)
            {
                if (CWriteEducationHistoryResponse.Success)
                {
                    ctrlEducationHistory.PostSaveEvent(CWriteEducationHistoryResponse.ContactEducationHistoryId);

                    return;
                }
                else
                    TriSysApex.UI.ShowMessage(CWriteEducationHistoryResponse.ErrorMessage);
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('ctrlEducationHistory.Save: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Saving Education History...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    PostSaveEvent: function (lContactEducationHistoryId)
    {
        // Refresh contact education history grid
        var sGrid = "contactForm-EducationHistoryGrid";
        TriSysSDK.Grid.ClearCheckedRows(sGrid);
        TriSysSDK.Grid.RefreshData(sGrid);

        // Close this modal dialogue
        TriSysApex.UI.CloseModalPopup();
    }
};

// Now display the document 
$(document).ready(function ()
{
    ctrlEducationHistory.Load();
});