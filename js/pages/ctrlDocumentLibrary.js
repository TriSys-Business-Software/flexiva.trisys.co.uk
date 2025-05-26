// Self contained logic for populating the document library grid
//
var ctrlDocumentLibrary =
{
    // Called by TriSysSDK.DocumentLibrary.AfterControlLoaded event to change div ID's as we will
    // have multiple versions of this control loaded simultaneously.
    PostLoad: function (sEntityName, lRecordId, parentDiv)
    {
        var sIDSuffix = '-' + parentDiv;

        // Change ID of all internal divs
        var controls = ['documentlibrary-grid-container', 'DocumentLibraryFileMenu', 'DocumentLibraryGridMenu', 'documentLibrary-Title', 'documentlibrary-Grid'];
        for (var i in controls)
        {
            $('#' + controls[i]).attr('id', controls[i] + sIDSuffix);
        }

        // Display proper entity name
        $('#documentLibrary-Title' + sIDSuffix).html(sEntityName);

        // Menu callbacks
        var sGrid = 'documentlibrary-Grid' + sIDSuffix;
        //var fnGridFileMenu = function (sFileMenuID)
        //{
        //    ctrlDocumentLibrary.FileMenuCallback(sFileMenuID, sEntityName, lRecordId, sGrid);
        //};
        //TriSysSDK.FormMenus.DrawGridFileMenu('DocumentLibraryFileMenu' + sIDSuffix, sGrid, fnGridFileMenu);

        var lDocumentId = 0;
        $('#DocumentLibrary-Add').attr("id", 'DocumentLibrary-Add' + sIDSuffix);
        $('#DocumentLibrary-Add' + sIDSuffix).click(function ()
        {
            TriSysApex.ModalDialogue.DocumentLibrary.Show(sEntityName, lRecordId, sGrid, 0);
        });
        $('#DocumentLibrary-Open').attr("id", 'DocumentLibrary-Open' + sIDSuffix);
        $('#DocumentLibrary-Open' + sIDSuffix).click(function ()
        {
            lDocumentId = TriSysSDK.Grid.GetSelectedSingletonRowRecordIdFromGrid(sGrid, "DocumentID", "document library");
            if (lDocumentId > 0)
                TriSysApex.ModalDialogue.DocumentLibrary.Show(sEntityName, lRecordId, sGrid, lDocumentId);
        });
        $('#DocumentLibrary-Delete').attr("id", 'DocumentLibrary-Delete' + sIDSuffix);
        $('#DocumentLibrary-Delete' + sIDSuffix).click(function ()
        {
            lDocumentId = TriSysSDK.Grid.GetSelectedSingletonRowRecordIdFromGrid(sGrid, "DocumentID", "document library");
            if (lDocumentId > 0)
                ctrlDocumentLibrary.Delete(sEntityName, lRecordId, sGrid, lDocumentId);
        });

        TriSysSDK.FormMenus.DrawGridMenu('DocumentLibraryGridMenu' + sIDSuffix, sGrid);
        
        // Set up the grid now
        ctrlDocumentLibrary.PopulateGrid(sEntityName, lRecordId, sGrid);

        // Force through the theme once again!
        setTimeout(TriSysProUI.kendoUI_Overrides, 1000);

		// Setup drag/drop multiple files into library
		setTimeout(function () 
		{ 					
			// Let the files grid accept file drag and drop
			ctrlDocumentLibrary.DragAndDropFileHandler(sEntityName, lRecordId, sGrid);

		}, 1000);
    },

    // Populate the grid with documents for this entity record
    PopulateGrid: function (sEntityName, lRecordId, sGrid)
    {
        // Jan 2018: Use a dedicated API method which abstracts the underlying SQL and does not use 'SQLDatabase/SQL_Select'
        var fnPopulationByFunction = {
            API: "DocumentLibrary/List",            // The Web API Controller/Function

            // The additional parameters passed into the function not including the paging metrics
            Parameters: function (request)
            {
                request.EntityName = sEntityName;
                request.RecordId = lRecordId;
            },

            DataTableFunction: function (response)  // Called to get a suitable data table for the grid to display
            {
                return response.List;               // The list of records from the Web API
            }
        };

        var columns = [
                { field: "DocumentID", title: "ID", type: "number", width: 70, hidden: true },
                {
                    field: "Image", title: ' ',
                    template: '<img src="images/trisys/16x16/tasktype/#= TaskType #.png" style="width: 24px; height: 24px;" alt="#= TaskType #">',
                    width: 45, 
                    filterable: false,
                    sortable: false,
                    attributes: {                           // 21 Jan 2021
                        style: "text-overflow: clip;"       // Prevent ellipsis default showing a little dot to the right of the image
                    }
                },
                { field: "FileName", title: "File", type: "string" },
                { field: "Description", title: "Description", type: "string" },
                { field: "Owner", title: "Owner", type: "string", width: 180 },
                { field: "DateAdded", title: "Date Added", type: "date", format: "{0:dd MMM yyyy}", width: 120 },
				{ field: "Expiry", title: "Expiry", type: "date", format: "{0:dd MMM yyyy}", width: 120, hidden: true }
        ];

        // 22 Jan 2021: Hide the column menu for the task type image
        var fnHideTaskTypeImageColumnMenu = function (iTotalRecordCount)
        {
            //Reference the Kendo Grid  
            var grid = $("#" + sGrid).data("kendoGrid");

            //Remove the image column menu
            grid.thead.find("[data-field=Image]>.k-header-column-menu").remove();
        };

        TriSysSDK.Grid.VirtualMode({
            Div: sGrid,
            ID: "grdDocumentLibrary",
            Title: "Document Library",
            RecordsPerPage: TriSysApex.UserOptions.RecordsPerPage(),
            PopulationByFunction: fnPopulationByFunction,
            Columns: columns,
            MobileVisibleColumns: [
                        { field: "FileName" }
            ],
            MobileRowTemplate: '<td colspan="1"><strong>#: FileName #</strong><br />' +
                            '<i>#: Description #</i></td>',

            KeyColumnName: "DocumentID",
            DrillDownFunction: function (rowData)
            {
                TriSysApex.ModalDialogue.DocumentLibrary.Show(sEntityName, lRecordId, sGrid, rowData.DocumentID);
            },
            MultiRowSelect: true,
            Grouping: true,
            ColumnFilters: true,
            OpenButtonCaption: "Edit",
            PostPopulationCallback: fnHideTaskTypeImageColumnMenu,
            HyperlinkedColumns: ["FileName"]                      // New Jan 2021
        });
    },

    FileMenuCallback: function (sFileMenuID, sEntityName, lRecordId, sGrid)
    {
        var fm = TriSysSDK.FormMenus.Constants;
        var lDocumentId = 0;

        switch (sFileMenuID)
        {
            case fm.File_New:
                TriSysApex.ModalDialogue.DocumentLibrary.Show(sEntityName, lRecordId, sGrid, lDocumentId);
                break;

            case fm.File_Open:
                lDocumentId = TriSysSDK.Grid.GetSelectedSingletonRowRecordIdFromGrid(sGrid, "DocumentID", "document library");
                if (lDocumentId > 0)
                    TriSysApex.ModalDialogue.DocumentLibrary.Show(sEntityName, lRecordId, sGrid, lDocumentId);
                break;

            case fm.File_Delete:
                lDocumentId = TriSysSDK.Grid.GetSelectedSingletonRowRecordIdFromGrid(sGrid, "DocumentID", "document library");
                if (lDocumentId > 0)
                    ctrlDocumentLibrary.Delete(sEntityName, lRecordId, sGrid, lDocumentId);
                break;
        }
    },

    Delete: function(sEntityName, lRecordId, sGrid, lDocumentId)
    {
        var sMessage = "Delete " + sEntityName + " document?";
        var fnDelete = function ()
        {
            ctrlDocumentLibrary.SubmitDocumentDeletion(sGrid, lDocumentId);
            return true;
        };

        TriSysApex.UI.questionYesNo(sMessage, TriSysApex.Copyright.ShortProductName, "Yes", fnDelete, "No");
    },

    SubmitDocumentDeletion: function (sGrid, lDocumentId)
    {
        // Call the API to submit the data to the server
        var CDeleteDocumentRequest = { DocumentId: lDocumentId };
        var payloadObject = {};

        payloadObject.URL = "DocumentLibrary/DeleteDocument";

        payloadObject.OutboundDataPacket = CDeleteDocumentRequest;

        payloadObject.InboundDataFunction = function (data)
        {
            TriSysApex.UI.HideWait();

            var CDeleteDocumentResponse = data;

            if (CDeleteDocumentResponse)
            {
                if (CDeleteDocumentResponse.Success)
                {
                    // Refresh the underlying grid
                    TriSysSDK.Grid.ClearCheckedRows(sGrid);
                    TriSysSDK.Grid.RefreshData(sGrid);

                    return;
                }
                else
                    TriSysApex.UI.ShowMessage(CDeleteDocumentResponse.ErrorMessage);
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('ctrlDocumentLibrary.SubmitDocumentDeletion: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Deleting Document...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

	DragAndDropFileHandler: function(sEntityName, lRecordId, sGridID)
	{
        var obj = $("#" + sGridID);

        obj.on('dragenter', function (e)
        {
            e.stopPropagation();
            e.preventDefault();
        });

        obj.on('dragover', function (e)
        {
            e.stopPropagation();
            e.preventDefault();
        });

        obj.on('drop', function (e)
        {
            e.preventDefault();

            // Set our stack ready for processing
            var fileCollection = e.originalEvent.dataTransfer.files;
		
            // Send each file to server
			var lstFiles = [];
            for (var i = 0; i < fileCollection.length; i++)
            {
                var sFilePath = fileCollection[i];

				lstFiles.push(sFilePath);
            }		

			// Operate a stack so that we do not encounter closures
			ctrlDocumentLibrary.PopDraggedFilesOffStackAndUpload(lstFiles, sEntityName, lRecordId, sGridID);
        });
	},

	// Approach lifted from file manager but we use an intermediate popup dialogue (for 99% of customers)
	PopDraggedFilesOffStackAndUpload: function(lstFiles, sEntityName, lRecordId, sGridID)
	{
		if(!lstFiles)
			return;
		if(lstFiles.length == 0)
			return;

		// The caveat condition (always one): some customers do not want prompt
		if (TriSysApex.LoginCredentials.isLoggedInToSpecificCompanyAsRecruiter("TQS Blu Limited"))
		{
			var file = {};
			file.Files = lstFiles;
			file.TypeName = 'Placement Document';
			file.Description = "";

			var sFormat = "YYYY/MM/DD HH:mm";
            var dtNow = moment(new Date()).format(sFormat);
			file.DateAdded = dtNow;

			var userCredentials = TriSysApex.LoginCredentials.UserCredentials();
			var sOwner = userCredentials.LoggedInUser.ForenameAndSurname;
			file.OwnerName = sOwner;

			file.EntityName = sEntityName;
			file.EntityId = lRecordId;

			ctrlDocumentLibrary.SendMultipleFiles(file, sGridID);
			return;
		}

		// Prompt the user to confirm the task type of the document(s)
		// Re-use the add/edit document modal
		var context = TriSysApex.ModalDialogue.DocumentLibrary.Context
        context.EntityName = sEntityName;
		context.Files = lstFiles;

        var parametersObject = new TriSysApex.UI.ShowMessageParameters();
        parametersObject.Title = "Upload " + lstFiles.length + " " + sEntityName + " Library Document" + (lstFiles.length == 1 ? "" : "s");
		parametersObject.Image = "fa-folder-o";
        parametersObject.Maximize = true;

        parametersObject.ContentURL = TriSysApex.CustomFormsAndComponents.UserControlPath("ctrlOpenLibraryDocument.html");
        parametersObject.ButtonRightText = "Cancel";
        parametersObject.ButtonRightVisible = true;
        parametersObject.ButtonLeftText = "Upload";
        parametersObject.ButtonLeftVisible = true;
        parametersObject.ButtonLeftFunction = function()
		{
			ctrlDocumentLibrary.UploadDocuments(lstFiles, sEntityName, lRecordId, sGridID);
			return true;
		}

        TriSysApex.UI.PopupMessage(parametersObject);
	},

	UploadDocuments: function(lstFiles, sEntityName, lRecordId, sGridID)
	{
		// Read from dialogue
		var file = {};
        file.Files = lstFiles;
        file.TypeName = TriSysSDK.CShowForm.GetTaskTypeFromCombo('openLibraryDocument-TaskType');
        file.Description = $('#openLibraryDocument-Description').val();
        file.DateAdded = TriSysSDK.CShowForm.getDateTimePickerValue('openLibraryDocument-DateAdded');
		//file.Expiry = TriSysSDK.CShowForm.getDateTimePickerValue('openLibraryDocument-Expiry');
        file.OwnerName = $('#openLibraryDocument-Owner').val();

        file.EntityName = sEntityName;
        file.EntityId = lRecordId;

		setTimeout(function()
		{
			ctrlDocumentLibrary.SendMultipleFiles(file, sGridID);
		}, 50);
	},

	SendMultipleFiles: function(fileSpecifications, sGridID)
	{
		var sTitle = "Uploading " + fileSpecifications.Files.length + " " + " Library Document" + (fileSpecifications.Files.length == 1 ? "" : "s") + "...";
		TriSysApex.UI.ShowWait(null, sTitle);

		var fnCompletedAllUploads = function()
		{
			// Refresh the grid after completion
			TriSysSDK.Grid.ClearCheckedRows(sGridID);
			TriSysSDK.Grid.RefreshData(sGridID);

			TriSysApex.UI.HideWait();
		};

		// Our own version of 'promises'
		ctrlDocumentLibrary.UploadNextFile(fileSpecifications, fnCompletedAllUploads);		
	},

	UploadNextFile: function(fileSpecifications, fnCallback)
	{
		var sFilePath = fileSpecifications.Files[0];

		var fnAfterFileUploadCallback = function (sFilePathOnServer)
        {
            var nextFile = { 
				FilePath: sFilePathOnServer,
				TypeName: fileSpecifications.TypeName,
				Description: fileSpecifications.Description,
				DateAdded: fileSpecifications.DateAdded,
				OwnerName: fileSpecifications.OwnerName,
				EntityName: fileSpecifications.EntityName,
				EntityId: fileSpecifications.EntityId
			};

			var CWriteDocumentRequest = {File: nextFile};

			// Call the API to submit the data to the server
			var payloadObject = {};

			payloadObject.URL = "DocumentLibrary/WriteDocument";

			payloadObject.OutboundDataPacket = CWriteDocumentRequest;

			payloadObject.InboundDataFunction = function (CWriteDocumentResponse)
			{
				if (CWriteDocumentResponse)
				{
					if (CWriteDocumentResponse.Success)
					{
						// Pop the first item off the stack
						fileSpecifications.Files.splice(0, 1);

						// If we have more files, call myself again!
						if(fileSpecifications.Files.length > 0)
							ctrlDocumentLibrary.UploadNextFile(fileSpecifications, fnCallback);
						else
						{
							// We did all files, so callback
							fnCallback();
						}
					}
					else
						TriSysApex.UI.ShowMessage(CWriteDocumentResponse.ErrorMessage);
				}
			};

			payloadObject.ErrorHandlerFunction = function (request, status, error)
			{
				TriSysApex.UI.errorAlert('ctrlDocumentLibrary.UploadNextFile: ' + status + ": " + error + ". responseText: " + request.responseText);
			};

			TriSysAPI.Data.PostToWebAPI(payloadObject);
        };

        TriSysSDK.Controls.FileManager.UploadFileAndMoveToG(sFilePath, fnAfterFileUploadCallback, { ShowProgressWait: false });
	}
};

