var ctrlOpenLibraryDocument =
{
    // Open the document, or a new document and allow the user to link or view document associated.

    Load: function ()
    {
        // Read the current context
        var context = TriSysApex.ModalDialogue.DocumentLibrary.Context;

		var bFileList = !TriSysAPI.Operators.isEmpty(context.Files);

        // Setup the widgets
		if(bFileList)
		{
			$('#openLibraryDocument-File-Reference-tr').hide();			
			//$('#openLibraryDocument-Description-tr').hide();			Allow same description - why not?
			$('#openLibraryDocument-Expiry-tr').hide();			
		}
		else
			ctrlOpenLibraryDocument.LoadDocumentWidget();

        TriSysActions.Forms.TaskType.Load('openLibraryDocument-TaskType', 'openLibraryDocument-selected-TaskType-Image', "Letter");

        TriSysSDK.CShowForm.dateTimePicker("openLibraryDocument-DateAdded");
        TriSysSDK.CShowForm.dateTimePicker("openLibraryDocument-Expiry");

        // Default values for new documents
        var dtNow = new Date();
        TriSysSDK.CShowForm.setDateTimePickerValue('openLibraryDocument-DateAdded', dtNow);
        var userCredentials = TriSysApex.LoginCredentials.UserCredentials();
        var sOwner = userCredentials.LoggedInUser.ForenameAndSurname;
        $('#openLibraryDocument-Owner').val(sOwner);

		if(!bFileList)
		{
			// Load the document details
			ctrlOpenLibraryDocument.ReadFromWebAPI();
		}
    },

    LoadDocumentWidget: function ()
    {
        var sDocumentFileRef = "openLibraryDocument-File-Reference";

        var fnFileCallback = function (sOperation, divTag, sFilePath)
        {
            switch (sOperation)
            {
                case 'find':
                    // Shall we view this document automatically after upload? - No!
                    //var sName = TriSysSDK.Controls.FileManager.GetFileNameFromPath(sFilePath);
                    //TriSysSDK.Controls.FileManager.GetOpenFileURLFromWebService("Library Document", sFilePath, sName);
                    break;

                case 'delete':
                    // Not interested in doing anything here
                    break;
            }
        };

        var fieldDescription = { TableFieldName: "Library Document", TableName: "File" };
        TriSysSDK.Controls.FileReference.Load(sDocumentFileRef, fieldDescription, fnFileCallback);
    },

    ReadFromWebAPI: function()
    {
        var context = TriSysApex.ModalDialogue.DocumentLibrary.Context;

        // This is an existing record so get from web API
        var CReadDocumentRequest = {
            'DocumentId': context.DocumentId
        };

        var payloadObject = {};

        // Call the API to submit the data to the server
        payloadObject.URL = "DocumentLibrary/ReadDocument";

        payloadObject.OutboundDataPacket = CReadDocumentRequest;

        payloadObject.InboundDataFunction = function (data)
        {
            TriSysApex.UI.HideWait();

            var CReadDocumentResponse = data;

            if (CReadDocumentResponse)
            {
                if (CReadDocumentResponse.Success)
                {
                    // Write to screen fields
                    var file = CReadDocumentResponse.File;
                    TriSysSDK.Controls.FileReference.SetFile('openLibraryDocument-File-Reference', file.FilePath);
                    TriSysSDK.CShowForm.SetTaskTypeComboValue('openLibraryDocument-TaskType', file.TypeName);
                    $('#openLibraryDocument-Description').val(file.Description);
                    TriSysSDK.CShowForm.setDateTimePickerValue('openLibraryDocument-DateAdded', file.DateAdded);
                    $('#openLibraryDocument-Owner').val(file.OwnerName);
					TriSysSDK.CShowForm.setDateTimePickerValue('openLibraryDocument-Expiry', file.Expiry);

                    // After opening this dialogue, open the document viewer also for convenience
                    TriSysSDK.Controls.FileReference.OpenFileButtonClick('openLibraryDocument-File-Reference');

                    return;
                }
                else
                    TriSysApex.UI.ShowMessage(CReadDocumentResponse.ErrorMessage);
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('ctrlOpenLibraryDocument.ReadFromWebAPI: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Reading Document...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    SaveButtonClick: function ()
    {
        var file = {};
        file.FilePath = TriSysSDK.Controls.FileReference.GetFile('openLibraryDocument-File-Reference');
        file.TypeName = TriSysSDK.CShowForm.GetTaskTypeFromCombo('openLibraryDocument-TaskType');
        file.Description = $('#openLibraryDocument-Description').val();
        file.DateAdded = TriSysSDK.CShowForm.getDateTimePickerValue('openLibraryDocument-DateAdded');
		file.Expiry = TriSysSDK.CShowForm.getDateTimePickerValue('openLibraryDocument-Expiry');
        file.OwnerName = $('#openLibraryDocument-Owner').val();

        if(!file.FilePath)
        {
            TriSysApex.UI.ShowMessage("Please pick a document.");
            return;
        }


        var context = TriSysApex.ModalDialogue.DocumentLibrary.Context;
        file.EntityName = context.EntityName;
        file.EntityId = context.RecordId;
        file.DocumentId = context.DocumentId;

        var CWriteDocumentRequest = {File: file};

        // Call the API to submit the data to the server
        var payloadObject = {};

        payloadObject.URL = "DocumentLibrary/WriteDocument";

        payloadObject.OutboundDataPacket = CWriteDocumentRequest;

        payloadObject.InboundDataFunction = function (data)
        {
            TriSysApex.UI.HideWait();

            var CWriteDocumentResponse = data;

            if (CWriteDocumentResponse)
            {
                if (CWriteDocumentResponse.Success)
                {
                    // Close our popup and refresh the underlying grid
                    TriSysSDK.Grid.ClearCheckedRows(context.Grid);
                    TriSysSDK.Grid.RefreshData(context.Grid);

                    // Close this modal dialogue
                    TriSysApex.UI.CloseModalPopup();

                    return;
                }
                else
                    TriSysApex.UI.ShowMessage(CWriteDocumentResponse.ErrorMessage);
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('ctrlOpenLibraryDocument.SaveButtonClick: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Saving Document...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    }

};


// Now display the document 
$(document).ready(function ()
{
    ctrlOpenLibraryDocument.Load();
});
