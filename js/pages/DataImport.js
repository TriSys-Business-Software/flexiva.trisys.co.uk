// Created 16 Nov 2018.
// Make it easy for new 'pay as you go' customers to import their data.
//
var DataImport = 
{
	UploadFile: function()
	{
		// Popup file selection dialogue to upload a file or to choose one from a cloud storage service e.g. dropbox
          TriSysSDK.Controls.FileManager.FindFileUpload("Upload Excel Import File", DataImport.UploadedFile);
	},

	UploadedFile: function (sFilePath, uploadFiles)
	{
		// The file uploaded path returned is: Josie.Musto\20181112_122103_d598a5f3-d101-4c22-ad1f-5f3b13201554\file.xls
        // which actually maps to the web api path: e:\inetpub\api.trisys.co.uk\Upload\Josie.Musto\0181112_122103_d598a5f3-d101-4c22-ad1f-5f3b13201554\file.xls
            
		// Validate the type of file
		var sFileType = TriSysApex.Pages.FileManagerForm.DetermineFileTypeForImageFromFilePath(sFilePath);
		if(sFileType != "excel")
		{
			var fnWrongFileType = function()
			{
				TriSysApex.UI.ShowMessage("You must upload only Microsoft Excel (.xlsx, .xls, .csv) files.");
			};
			setTimeout(fnWrongFileType, 100);
			return;
		}

		// Validate the integrity of the file before commencing import
		$('#data-import-step-3-p1').show();
		var sName = TriSysSDK.Controls.FileManager.GetFileNameFromPath(sFilePath);
		$('#data-import-step-3-filepath').html(sName);
		$('#data-import-step-3').show();
		$('#data-import-step-3-p3').hide();
		$('#data-import-step-3-p4').hide();
		$('#data-import-step-3-progress-div').hide();
		$('#data-import-step-3-cancel-button').hide();
		$('#data-import-step-4').hide();

		// Call Web API to move this temporary file into the g:\ folder and return this path to us
        // so that we can commence the process of data import
		DataImport.ValidateUploadedFile(sFilePath);
	},

	ValidateUploadedFile: function(sFilePath)
	{
		var fnValidated = function(lRecordCount, sEntityName)
		{
			$('#data-import-step-3-p2').hide();
			$('#data-import-step-3-p3').show();
			$('#data-import-step-3-validated-record-count').html(TriSysSDK.Numbers.ThousandsSeparator(lRecordCount));

			// Prompt for confirmation
			var fnProceed = function(options) 
			{ 
				$('#data-import-step-3-p4').show();
				$('#data-import-step-3-progress-div').show();
				$('#data-import-step-3-cancel-button').show();
				TriSysSDK.Grid.Clear('data-import-record-grid');

				DataImport.UploadData(sFilePath, sEntityName, options); 
				DataImport._Cancelled = false;
				DataImport.ProgressMonitoring(sFilePath);
				return true;
			};
			var fnPrompt = function()
			{
				DataImport.PromptPriorToImport(fnProceed, lRecordCount, sEntityName);
			};
			TriSysApex.WhiteLabelling.LoadJavascriptFile('js/pages/ctrlDataImportPrompt.js', null, fnPrompt);
		};

		DataImport.ProcessFileViaWebAPI(sFilePath, true, fnValidated);
	},

	// Prompt the user to confirm the data import, and also to confirm additional options
	// e.g. contact type, comments, skills etc...
	PromptPriorToImport: function(fnCommence, lRecordCount, sEntityName)
	{
		var parametersObject = new TriSysApex.UI.ShowMessageParameters();
		parametersObject.Title = "Import " + TriSysSDK.Numbers.ThousandsSeparator(lRecordCount) + " " + sEntityName + " Record" + (lRecordCount > 1 ? "s" : "");
		parametersObject.Image = "gi-server";
		parametersObject.Maximize = false;
		parametersObject.CloseTopRightButton = true;

		parametersObject.ContentURL = TriSysApex.CustomFormsAndComponents.UserControlPath("ctrlDataImportPrompt.html");
		parametersObject.Width = 600;

		// Callback
		parametersObject.OnLoadCallback = function () 
		{
			ctrlDataImportPrompt.Load(lRecordCount, sEntityName);
		};

		// Buttons
		parametersObject.ButtonLeftVisible = true;
		parametersObject.ButtonLeftText = "Cancel";
		parametersObject.ButtonLeftFunction = function () {
			return true;
		};

		parametersObject.ButtonCentreVisible = true;
		parametersObject.ButtonCentreText = "Yes, Commence Import";
		parametersObject.ButtonCentreFunction = function()
		{
			var options = ctrlDataImportPrompt.ReadOptions();
			setTimeout(function()
			{
				fnCommence(options);

			}, 10);
			return true;
		};

		TriSysApex.UI.PopupMessage(parametersObject);
	},

	// Upload the file
	UploadData: function(sFilePath, sEntityName, options)
	{
		var fnCompleted = function(lRecordCount)
		{
			$('#data-import-step-3-p4').hide();
			//$('#data-import-step-3-progress-div').hide();
			$('#data-import-step-3-cancel-button').hide();
			$('#data-import-step-4').show();

            // Go back to get the cached standing data settings and meta database because we may have added new skill categories and skills
            TriSysApex.LoginCredentials.CacheStandingData(null, function() { } );
        
			// Prompt to view data after import
			var fnProceed = function() 
			{ 
				setTimeout(function() 
				{ 
					// Show grid of records
					DataImport.ShowGrid(sFilePath, sEntityName);

				}, 100);
				return true;
			};
			var sMessage = "We have successfully imported " + TriSysSDK.Numbers.ThousandsSeparator(lRecordCount) + " " + 
				sEntityName + " record" + (lRecordCount != 1 ? "s": "") + " into your database." +
				"<br/>" + "View imported records?";
            TriSysApex.UI.questionYesNo(sMessage, sEntityName + " Import Successful", "Yes", fnProceed, "No");
		};

		DataImport.ProcessFileViaWebAPI(sFilePath, false, fnCompleted, options);
	},

	ProcessFileViaWebAPI: function(sFilePath, bVerifyOnly, fnCallback, options)
	{
		var sProgressTitle = (bVerifyOnly ? "Verifying" : "Importing") + " File";

		var CImportFileRequest = {
			FilePath: sFilePath,
            VerifyOnly: bVerifyOnly,
			Options: options
        };

        var payloadObject = {};

        payloadObject.URL = "DataImport/ImportFile";

        payloadObject.OutboundDataPacket = CImportFileRequest;

	    // We will allow the import to run for longer
        payloadObject.TimeoutMilliseconds = 60 * 60 * 1000;           // Wait 1 hour for import to complete

        payloadObject.InboundDataFunction = function (CImportDataFileResponse)
        {
            if(bVerifyOnly)
				TriSysApex.UI.HideWait();

            if (CImportDataFileResponse)
            {
                if (CImportDataFileResponse.Success)
                {
                    fnCallback(CImportDataFileResponse.RecordCount, CImportDataFileResponse.EntityName);
                }
				else // if(bVerifyOnly)
                    TriSysApex.UI.ShowMessage(CImportDataFileResponse.ErrorMessage);
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            if(bVerifyOnly)
				TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('DataImport.ProcessFileViaWebAPI: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        if(bVerifyOnly)
			TriSysApex.UI.ShowWait(null, sProgressTitle);
        TriSysAPI.Data.PostToWebAPI(payloadObject);
	},

	// Called when the import is under way to show how many records have been imported so far
	ProgressMonitoring: function(sFilePath)
	{
		var CImportFileMonitoringRequest = {
			FilePath: sFilePath
        };
		if(DataImport._Cancelled)
			CImportFileMonitoringRequest.Cancel = true;

        var payloadObject = {};

        payloadObject.URL = "DataImport/ImportFileMonitoring";

        payloadObject.OutboundDataPacket = CImportFileMonitoringRequest;

        payloadObject.InboundDataFunction = function (CImportFileMonitoringResponse)
        {
            if (CImportFileMonitoringResponse)
            {
                if (CImportFileMonitoringResponse.Success)
                {
                    DataImport.ProgressMonitoringDisplay(CImportFileMonitoringResponse.PercentageComplete);

					if(CImportFileMonitoringResponse.PercentageComplete < 100 && !CImportFileMonitoringResponse.Cancelled)
					{
						setTimeout(function()
						{
							DataImport.ProgressMonitoring(sFilePath);

						}, 1000);		// Fire every second
					}
                }
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.errorAlert('DataImport.ProgressMonitoring: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysAPI.Data.PostToWebAPI(payloadObject);		
	},

	_Cancelled: false,

	ProgressMonitoringDisplay: function(iPercentageComplete)
	{
		var bar = $('#data-import-step-3-progress-bar');
		var sPercent = "" + iPercentageComplete + "%";
		bar.html(sPercent);
		bar.width(sPercent);
		bar.attr('aria-valuenow', iPercentageComplete);
	},

	CancelImport: function()
	{
		// Simply set the flag, to allow monitoring to pick this up within a second
		DataImport._Cancelled = true;
	},

	// Go back to Web API to get a list of all records imported
	ShowGrid: function(sFilePath, sEntityName)
	{
		$('html, body').animate({
            scrollTop: $('#data-import-step-4').offset().top
        }, 0);

		var fnPopulationByFunction = {
            API: "DataImport/ImportedRecordList",  // The Web API Controller/Function

            // The additional parameters passed into the function not including the paging metrics
            Parameters: function (request)
            {
                request.FilePath = sFilePath;
				request.EntityName = sEntityName;
            },

            DataTableFunction: function (response)  // Called to get a suitable data table for the grid to display
            {
                return response.List;               // The list of records from the Web API
            }
        };

        // Populate the grid asynchronously
		var sGrid = 'data-import-record-grid';
		switch(sEntityName)
		{
			case "Contact":
				TriSysWeb.Pages.Contacts.PopulateGrid(sGrid, "grd" + sEntityName, sGrid + "s", fnPopulationByFunction);
				break;

			case "Company":
				TriSysWeb.Pages.Companies.PopulateGrid(sGrid, "grd" + sEntityName, "Companies", fnPopulationByFunction);
				break;

			case "Requirement":
				TriSysWeb.Pages.Requirements.PopulateGrid(sGrid, "grd" + sEntityName, sGrid + "s", fnPopulationByFunction);
				break;

			case "Placement":
				TriSysWeb.Pages.Placements.PopulateGrid(sGrid, "grd" + sEntityName, sGrid + "s", fnPopulationByFunction);
				break;
		}
	}

};	// DataImport
