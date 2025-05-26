var DeveloperStudio =
{
	CustomAppFoldersText: 'Custom App Folders',
	FileManagerTreeViewID: 'DeveloperStudio-FileManager',

    Load: function()
    {
        // Get all customer specific files for editing
		DeveloperStudio.ReadFilesIntoFileManager();

        // Get all tools for the toolbox
        DeveloperStudio.WebAPI.ReadToolboxList(DeveloperStudio.LoadToolsIntoList);

        // Make blocks correct size
        var iHeightFactor = 320;
        var iHeight = window.innerHeight - iHeightFactor;
        var iFileAndToolboxHeight = iHeight / 2;
		$('#' + DeveloperStudio.FileManagerTreeViewID + '-Container').height(iFileAndToolboxHeight);
        $('#DeveloperStudio-toolbox-list').height(iFileAndToolboxHeight);

        // Add preview check box event
        $('#DeveloperStudio-file-preview').click(function ()
        {
            DeveloperStudio.PreviewCheckBoxEvent();
        });

        // Add JS Lint check box event
        $('#DeveloperStudio-file-jslint').click(function ()
        {
            DeveloperStudio.JSLintCheckBoxEvent();
        });

        // Position annoying save popups
        TriSysApex.Toasters.SetOptions('bottom', 10);

        // 03 Apr 2023: Use different scrollbar
        //DeveloperStudio.RoundedExperience();

        // 02 Aug 2023: Tweak UI
        DeveloperStudio.TweakUI();
    },

    FileRowTemplate: null,
    ToolboxRowTemplate: null,

	ReadFilesIntoFileManager: function(sFilePathToFocusOn, bFolder)
    {
        var fnLoadControlHTML = function ()
        {
            // Load the control into the DIV, change the name of all internal DIV tags to be unique and populate
            TriSysApex.FormsManager.loadControlReplacingDiv(DeveloperStudio.FileManagerTreeViewID, 'ctrlFileManager.html',
                function (response, status, xhr)
                {
                    // Set callback after loading into DOM
					var instance = {
						RootPathForTreeView: DeveloperStudio.CustomAppFoldersText,
						WebAPIFunction: 'Folders/DevelopmentStudioSubFoldersAndFiles',
						AutoSelectFilePath: sFilePathToFocusOn,
						AutoSelectAndExpandFolder: bFolder,
						FileSelectionCallback: DeveloperStudio.SelectFile,
						FileDragDropCallback: DeveloperStudio.FileDragDropCallback
					};
                    ctrlFileManager.Load(DeveloperStudio.FileManagerTreeViewID, instance);
                }
			);
        };

        TriSysApex.WhiteLabelling.LoadJavascriptFile('js/pages/ctrlFileManager.js', null, fnLoadControlHTML);
    },

    isFileInList: function(sFolderTreeID, sFilePath)
    {
        var bFileFound = ctrlFileManager.isFilePathInFolder(sFolderTreeID, sFilePath);

        return bFileFound;
    },

    doesFileHaveSuffix: function(sFile, sSuffix)
    {
        var sFileSuffix = TriSysApex.Pages.FileManagerForm.FileSuffix(sFile);
		if(sFileSuffix)
		{
			switch (sFileSuffix.toLowerCase())
			{
				case sSuffix.toLowerCase():
					return true;
			}
		}

        return false;
    },

    isJavascriptFile: function (sFile)
    {
        return DeveloperStudio.doesFileHaveSuffix(sFile, 'js');
    },

    isJSONFile: function (sFile)
    {
        return DeveloperStudio.doesFileHaveSuffix(sFile, 'json');
    },

    isHTMLFile: function (sFile)
    {
        return DeveloperStudio.doesFileHaveSuffix(sFile, 'html');
    },

    isFORMFile: function (sFile) {
        return DeveloperStudio.doesFileHaveSuffix(sFile, 'form');
    },

    isEditableFile: function (sFile)
    {
        var bEditableFile = DeveloperStudio.isJavascriptFile(sFile) || DeveloperStudio.isJSONFile(sFile)
                                || DeveloperStudio.isHTMLFile(sFile) || DeveloperStudio.isFORMFile(sFile);
		return bEditableFile;
    },

    LoadToolsIntoList: function (tools)
    {
        var sUL = 'DeveloperStudio-toolbox-list';
        var sItemPrefix = 'DeveloperStudio-toolbox-list-item-';
        var sItemTemplate = sItemPrefix + 'template';
        if (!DeveloperStudio.ToolboxRowTemplate)
            DeveloperStudio.ToolboxRowTemplate = document.getElementById(sItemTemplate).outerHTML;

        // Remove any existing items so that this can be re-used after population
        $('#' + sUL).find('li').each(function ()
        {
            $(this).remove();
        });

        if (tools)
        {
            // Add our own special tools e.g. icon picker
            DeveloperStudio.AddDeveloperTools(tools);

            // Sort it by ASCENDING caption
            tools.sort(function (a, b)
            {
                var x = a.Caption.toLowerCase(),
                y = b.Caption.toLowerCase();
                return x < y ? -1 : x > y ? 1 : 0;
            });

            // Store the list of tools in memory
            DeveloperStudio._Tools = tools;

            for (var i = 0; i < tools.length; i++)
            {
                var tool = tools[i];

                // We do not allow spaces or brackets in file names
                var sTool = tool.Caption;
                sTool = TriSysSDK.Controls.FileManager.StripInconvenientFileNameCharacters(sTool, true);

                // Get the row template and merge this view
                var sRowItemHTML = DeveloperStudio.ToolboxRowTemplate;
                var sItemID = sItemPrefix + sTool.replace(/\./g, '_').replace(/ /g, '_');
                sRowItemHTML = sRowItemHTML.replace(sItemTemplate, sItemID);

                var sOnClick = 'DeveloperStudio.SelectTool(\'' + tool.Caption + '\')';
                sRowItemHTML = sRowItemHTML.replace('##tool-click-event##', sOnClick);

                var sIcon = "fa fa-file-code-o";
                //if (DeveloperStudio.isJavascriptFile(tool.FileName) || DeveloperStudio.isJSONFile(tool.FileName))
                //    sIcon = "fa fa-file-text-o";

                sRowItemHTML = sRowItemHTML.replace('##tool-icon##', sIcon);

                sRowItemHTML = sRowItemHTML.replace('##tool-caption##', tool.Caption);

                // Append item to list
                $('#' + sUL).append(sRowItemHTML);

				// Plug the tool into the data
				$('#' + sItemID).data("tool", tool);
            }

            // 03 Apr 2023: Use different scrollbar
            //TriSysSDK.EntityFormTabs.AddVerticalScrollBar('DeveloperStudio-toolbox-list');
        }
    },

    SelectFile: function(sFile)
    {
		// Is this a developer file?
		var bEditableFile = DeveloperStudio.isEditableFile(sFile);
		if(bEditableFile)
		{
			// Open editor
			DeveloperStudio.SelectFileEditor(sFile);
		}
		else
		{
			// This is another file type so do not open in the editor
			var bOpenFile = false;
			if(bOpenFile)
			{
				// TODO: edit word documents, excel, text etc...
				// See separate file menu option to allow user control
			}
		}
    },

    SelectFileEditor: function(sFile)
    {
        // If file exists, focus on it, else load it
        var existingFile = DeveloperStudio.GetInstanceAssociationFromFile(sFile);
        if (existingFile)
        {
            // Highlight tab and editor now
            DeveloperStudio.SelectTab(existingFile.FileTabLI, existingFile.FileEditorTabContent, sFile);
        }
        else
        {
            // Get file from server
            var fnReadFile = function (sFileContents)
            {				
				if(DeveloperStudio.isFormDesignerEnabledForFile(sFile))
					DeveloperStudio.OpenFormDesignerForFile(sFile, sFileContents);
				else
					DeveloperStudio.AddFileEditorAndTab(sFile, sFileContents);
            };

            DeveloperStudio.WebAPI.ReadFile(sFile, fnReadFile);			
        }
    },

	// Dec 2018 to Apr 2021: Form Designer
	isFormDesignerEnabledForFile: function(sFilePath)
	{
	    var sFileName = TriSysSDK.Controls.FileManager.GetFileNameFromPath(sFilePath);

	    /*
        17 April 2021: New form designer allows editing of .form files
        */
	    //return DeveloperStudio.isFORMFile(sFileName);

        // Old
		var bHTML = DeveloperStudio.isHTMLFile(sFilePath);
		
		if(bHTML && sFilePath)
		{
			switch(sFileName.toLowerCase())
			{
			    /* 
                06 Feb 2021: HTML form designer is dead.
                It is time to start considering .json as our format for custom forms/controls
                
				case "contact.html":
				case "company.html":
				case "requirement.html":
				case "placement.html":
				case "timesheet.html":
					return true;
                */

				default:
					if(sFileName.toLowerCase().indexOf("testeditableform") == 0)
						return true;
			}
		}

		return false;
	},
    
    // Do not show e:\inetpub\....
    // Instead show a more developer friendly path
	DeveloperFileNameDisplay: function(sFile)
	{
	    var parts = sFile.split("\\");
	    var sProduct = parts[3];            // apex, vertex etc..
	    sFile = DeveloperStudio.CustomAppFoldersText + "/" + TriSysSDK.Miscellaneous.CamelCase(sProduct, true);
	    for (var i = 6; i < parts.length; i++)
	        sFile += "/" + parts[i];

	    return sFile;
	},

	OpenFormDesignerForFile: function(sFile, sFileContents)
    {
        // 29 Oct 2024: Launch modal form designer from app studio.
        const fnLoadedFormDesignerScript = function ()
        {
            ctrlLaunchFormDesigner.Load(sFile, sFileContents);
        };

        // Load the JS now
        TriSysApex.WhiteLabelling.LoadJavascriptFile(TriSysApex.Constants.UserControlFolder + 'app-studio/ctrlLaunchFormDesigner.js',
                                                        null, fnLoadedFormDesignerScript);
        return;

	    var fnLoadedScript = function ()
	    {
		    var parametersObject = new TriSysApex.UI.ShowMessageParameters();

		    parametersObject.Title = "Form Designer: " + DeveloperStudio.DeveloperFileNameDisplay(sFile);
            parametersObject.Image = "fa-object-group";
            parametersObject.Maximize = true;
		    parametersObject.FullScreen = true;
		    parametersObject.CloseTopRightButton = true;
		    parametersObject.Draggable = false;		// When using dashboard style editor, we needed to turn off dragging
												    // Actually, full screen modals turn off dragging anyway!

            // New 2021
            parametersObject.ContentURL = TriSysApex.Constants.UserControlFolder + "ctrlFormDesignerModal.html";

            // Even newer Oct 2024: Drag/drop of fields does not work in our JQuery modals
            parametersObject.ContentURL = TriSysApex.Constants.UserControlFolder + "app-studio/FormDesigner2024.html";

		    // Feed in the file contents when loaded
		    parametersObject.OnLoadCallback = function ()
		    {
                ctrlFormDesignerModal.Load(sFile, sFileContents);
            };

            // Buttons
            parametersObject.ButtonLeftVisible = true;
            parametersObject.ButtonLeftText = "Save";
            parametersObject.ButtonLeftFunction = function ()
            {
                // TODO
                ctrlFormDesignerModal.Persistence.Save(sFile);
            };

            parametersObject.ButtonCentreVisible = true;
            parametersObject.ButtonCentreText = "Save &amp; Close";
            parametersObject.ButtonCentreFunction = function ()
            {
                // TODO
                ctrlFormDesignerModal.Persistence.Save(sFile);
			    return true;
            };

            parametersObject.ButtonRightVisible = true;
            parametersObject.ButtonRightText = "Cancel";

            TriSysApex.UI.PopupMessage(parametersObject);
	    };

	    // Load the JS now
	    TriSysApex.WhiteLabelling.LoadJavascriptFile('js/pages/ctrlFormDesignerModal.js', null, fnLoadedScript);
	},

    _Tools: null,					// List(Of TriSys_Web_API_Model.CDeveloperStudio.CTool)
									
    SelectTool: function(sTool)		// as TriSys_Web_API_Model.CDeveloperStudio.CTool = { Caption, HTML, Javascript, ConfigurationJson }
    {
        if (!DeveloperStudio._Tools)
            return;

        var tools = DeveloperStudio._Tools;

        if (DeveloperStudio.isSpecialTool(sTool))
        {
            DeveloperStudio.ActivateSpecialTool(sTool);
            return;
        }

        for (var i = 0; i < tools.length; i++)
        {
            var tool = tools[i];

            if(tool.Caption == sTool)
            {
				// Show property sheet first?
				DeveloperStudio.ShowToolPropertySheet(tool);
                return;
            }
        }
    },

	ShowToolPropertySheet: function(tool)
	{
		// Do we have a property sheet to show first?
		var bAlwaysShowPopup = true;
		if(!tool.ConfigurationJson && !bAlwaysShowPopup)
		{				
			// Insert the code directly into the editor
			DeveloperStudio.AddCliche(tool.Code);
			return;
		}

		var properties = null;
		if(tool.ConfigurationJson)
		{
			properties = JSON.parse(tool.ConfigurationJson);
			if(!properties)
			{
				TriSysApex.UI.ShowMessage("Tool configuration error: " + tool.Name);
				return;
			}
		}

		var sFilePath = DeveloperStudio.GetSelectedTabbedFilePath();
		var bGetJavascriptCode = DeveloperStudio.isJavascriptFile(sFilePath);
		var sFormFileName = TriSysSDK.Controls.FileManager.GetFileNameFromPath(sFilePath);

		var fnLoadPopupWindow = function()
		{
			var parametersObject = new TriSysApex.UI.ShowMessageParameters();

			parametersObject.Title = "Code Generator: " + tool.Caption;
			parametersObject.Image = "fa-file-code-o";
			parametersObject.CloseTopRightButton = true;

			parametersObject.Draggable = false;		// To allow copying of the HTML
			parametersObject.FullScreen = true;

			parametersObject.ContentURL = TriSysApex.Constants.UserControlFolder + "ctrlDeveloperToolCodeGenerator.html";

			// Buttons
			parametersObject.ButtonLeftVisible = true;
			parametersObject.ButtonLeftText = "Insert Code";
			parametersObject.ButtonLeftFunction = function ()
			{
				var sCode = ctrlDeveloperToolCodeGenerator.GetCode(bGetJavascriptCode);
				if(sCode)
				{
					DeveloperStudio.AddCliche(sCode);
					return true;
				}
			};

			parametersObject.ButtonSecondLeftVisible = true;
			parametersObject.ButtonSecondLeftText = "Test Code";
			parametersObject.ButtonSecondLeftFunction = function ()
			{
				var sHTML = ctrlDeveloperToolCodeGenerator.GetCode(false);
				var sJavascript = ctrlDeveloperToolCodeGenerator.GetCode(true);
				if(sHTML || sJavascript)
				{
					DeveloperStudio.TestCode(sHTML, sJavascript, properties, tool.Caption);
					//return true;
				}
			};

			parametersObject.ButtonCentreVisible = true;
			parametersObject.ButtonCentreText = "Copy Code";
			parametersObject.ButtonCentreFunction = function ()
			{
				var sCode = ctrlDeveloperToolCodeGenerator.GetCode(bGetJavascriptCode);
				if(sCode)
				{
					DeveloperStudio.CopyToClipboard(sCode);
					//return true;
				}
			};

			parametersObject.ButtonRightVisible = true;
			parametersObject.ButtonRightText = "Cancel";

			parametersObject.OnLoadCallback = function()
			{
				ctrlDeveloperToolCodeGenerator.Load(sFormFileName, tool.Caption, tool.HTML, tool.Javascript, properties);
			};

			TriSysApex.UI.PopupMessage(parametersObject);
		};

		TriSysApex.WhiteLabelling.LoadJavascriptFile('js/pages/ctrlDeveloperToolCodeGenerator.js', null, fnLoadPopupWindow);
	},

    // 03 Apr 2023: Rounded experience
	RoundedExperience: function()
	{
	    TriSysSDK.EntityFormTabs.AddVerticalScrollBar('DeveloperStudio-FileManager-Container');	    

        // Turn off horzontal scrollbar
	    var fnPrepeventHorizontalScrollbar = function () {
	        $('#DeveloperStudio-FileManager').css('overflow-x', 'hidden');
	    };
	    setTimeout(fnPrepeventHorizontalScrollbar, 2000);
	},

    //#region DeveloperStudio.WebAPI
    WebAPI:
    {
        // All code related to CRUD of files        

        ReadToolboxList: function (fnCallback)
        {
            var payloadObject = {};

            // Call the API to submit the data to the server
            payloadObject.URL = "DeveloperStudio/Tools";

            payloadObject.InboundDataFunction = function (CDeveloperStudio_CToolsResponse)
            {
                if (CDeveloperStudio_CToolsResponse)
                {
                    if (CDeveloperStudio_CToolsResponse.Success)
                    {
                        // Show toolbox list
                        fnCallback(CDeveloperStudio_CToolsResponse.Tools);

                        return;
                    }
                    else
                        TriSysApex.Logging.LogMessage(CDeveloperStudio_CToolsResponse.ErrorMessage);
                }
            };

            payloadObject.ErrorHandlerFunction = function (request, status, error)
            {
                TriSysApex.Logging.LogMessage('DeveloperStudio.WebAPI.ReadToolboxList: ' + status + ": " + error + ". responseText: " + request.responseText);
            };

            TriSysAPI.Data.PostToWebAPI(payloadObject);
        },

        // Read specified file contents
        ReadFile: function (sFile, fnCallback, bSynchronous)
        {
            var CDeveloperStudio_CFileRequest =
            {
                FileName: sFile
            };

            var payloadObject = {};

            // Call the API to submit the data to the server
            payloadObject.URL = "DeveloperStudio/ReadFile";

            payloadObject.OutboundDataPacket = CDeveloperStudio_CFileRequest;

            if (bSynchronous)
                payloadObject.Asynchronous = false;

            payloadObject.InboundDataFunction = function (CDeveloperStudio_CFileResponse)
            {
                TriSysApex.UI.HideWait();

                if (CDeveloperStudio_CFileResponse)
                {
                    if (CDeveloperStudio_CFileResponse.Success)
                    {
                        // File contents are base64 web friendly
                        var sBase64Text = CDeveloperStudio_CFileResponse.Base64Text;
                        var sFileContents = $.base64.decode(sBase64Text);
                        fnCallback(sFileContents);

                        return;
                    }
                    else
                        TriSysApex.UI.ShowMessage(CDeveloperStudio_CFileResponse.ErrorMessage);
                }
            };

            payloadObject.ErrorHandlerFunction = function (request, status, error)
            {
                TriSysApex.UI.HideWait();
                TriSysApex.UI.errorAlert('DeveloperStudio.WebAPI.ReadFile: ' + status + ": " + error + ". responseText: " + request.responseText);
            };

            TriSysApex.UI.ShowWait(null, "Reading File...");
            TriSysAPI.Data.PostToWebAPI(payloadObject);
        },

        // Write specified file contents
        WriteFile: function (sFile, sCode, fnCallback, bPreviewOnly)
        {
            var CDeveloperStudio_CFileWriteRequest =
            {
                FileName: sFile,
                Base64Text: $.base64.encode(sCode),
				PreviewOnly: bPreviewOnly
            };

            var payloadObject = {};

            // Call the API to submit the data to the server
            payloadObject.URL = "DeveloperStudio/WriteFile";

            payloadObject.OutboundDataPacket = CDeveloperStudio_CFileWriteRequest;

            payloadObject.InboundDataFunction = function (CDeveloperStudio_CFileWriteResponse)
            {
                TriSysApex.UI.HideWait();

                if (CDeveloperStudio_CFileWriteResponse)
                {
                    if (CDeveloperStudio_CFileWriteResponse.Success)
                    {
                        // Confirm
                        if (fnCallback)
                            fnCallback(CDeveloperStudio_CFileWriteResponse.URL);

                        return;
                    }
                    else
                        TriSysApex.UI.ShowMessage(CDeveloperStudio_CFileWriteResponse.ErrorMessage);
                }
            };

            payloadObject.ErrorHandlerFunction = function (request, status, error)
            {
                TriSysApex.UI.HideWait();
                TriSysApex.UI.errorAlert('DeveloperStudio.WebAPI.WriteFile: ' + status + ": " + error + ". responseText: " + request.responseText);
            };

            TriSysApex.UI.ShowWait(null, "Saving File...");
            TriSysAPI.Data.PostToWebAPI(payloadObject);
        },

        DeleteFile: function (sFile, fnCallback)
        {
            var CDeveloperStudio_CFileDeleteRequest =
            {
                FileName: sFile
            };

            var payloadObject = {};

            // Call the API to submit the data to the server
            payloadObject.URL = "DeveloperStudio/DeleteFile";

            payloadObject.OutboundDataPacket = CDeveloperStudio_CFileDeleteRequest;

            payloadObject.InboundDataFunction = function (CDeveloperStudio_CFileDeleteResponse)
            {
                TriSysApex.UI.HideWait();

                if (CDeveloperStudio_CFileDeleteResponse)
                {
                    if (CDeveloperStudio_CFileDeleteResponse.Success)
                    {
                        fnCallback();

                        return;
                    }
                    else
                        TriSysApex.UI.ShowMessage(CDeveloperStudio_CFileDeleteResponse.ErrorMessage);
                }
            };

            payloadObject.ErrorHandlerFunction = function (request, status, error)
            {
                TriSysApex.UI.HideWait();
                TriSysApex.UI.errorAlert('DeveloperStudio.WebAPI.DeleteFile: ' + status + ": " + error + ". responseText: " + request.responseText);
            };

            TriSysApex.UI.ShowWait(null, "Deleting File...");
            TriSysAPI.Data.PostToWebAPI(payloadObject);
        },

        CopyFile: function (sSourceFile, sDestinationFile, fnCallback)
        {
            var CDeveloperStudio_CFileCopyRequest =
            {
                SourceFileName: sSourceFile,
                DestinationFileName: sDestinationFile
            };

            var payloadObject = {};

            // Call the API to submit the data to the server
            payloadObject.URL = "DeveloperStudio/CopyFile";

            payloadObject.OutboundDataPacket = CDeveloperStudio_CFileCopyRequest;

            payloadObject.InboundDataFunction = function (CDeveloperStudio_CFileCopyResponse)
            {
                TriSysApex.UI.HideWait();

                if (CDeveloperStudio_CFileCopyResponse)
                {
                    if (CDeveloperStudio_CFileCopyResponse.Success)
                    {
                        fnCallback(CDeveloperStudio_CFileCopyResponse.CopiedFilePath);

                        return;
                    }
                    else
                        TriSysApex.UI.ShowMessage(CDeveloperStudio_CFileCopyResponse.ErrorMessage);
                }
            };

            payloadObject.ErrorHandlerFunction = function (request, status, error)
            {
                TriSysApex.UI.HideWait();
                TriSysApex.UI.errorAlert('DeveloperStudio.WebAPI.CopyFile: ' + status + ": " + error + ". responseText: " + request.responseText);
            };

            TriSysApex.UI.ShowWait(null, "Copying File...");
            TriSysAPI.Data.PostToWebAPI(payloadObject);
        },

        // Read template for file type
        ReadTemplate: function (sFile, sTemplateFile, fnCallback)
        {
            var CDeveloperStudio_CTemplateRequest =
            {
                FileName: sFile,
                Template: sTemplateFile
            };

            var payloadObject = {};

            // Call the API to submit the data to the server
            payloadObject.URL = "DeveloperStudio/ReadTemplate";

            payloadObject.OutboundDataPacket = CDeveloperStudio_CTemplateRequest;

            payloadObject.InboundDataFunction = function (CDeveloperStudio_CTemplateResponse)
            {
                TriSysApex.UI.HideWait();

                if (CDeveloperStudio_CTemplateResponse)
                {
                    if (CDeveloperStudio_CTemplateResponse.Success)
                    {
                        // File contents are base64 web friendly
                        var sBase64Text = CDeveloperStudio_CTemplateResponse.Base64Text;
                        var sFileContents = $.base64.decode(sBase64Text);
                        fnCallback(sFileContents);

                        return;
                    }
                    else
                        TriSysApex.UI.ShowMessage(CDeveloperStudio_CTemplateResponse.ErrorMessage);
                }
            };

            payloadObject.ErrorHandlerFunction = function (request, status, error)
            {
                TriSysApex.UI.HideWait();
                TriSysApex.UI.errorAlert('DeveloperStudio.WebAPI.ReadTemplate: ' + status + ": " + error + ". responseText: " + request.responseText);
            };

            TriSysApex.UI.ShowWait(null, "Reading Template...");
            TriSysAPI.Data.PostToWebAPI(payloadObject);
        },

        // Read all files which can be imported for this customer
        ReadFileImportList: function (fnCallback)
        {
            var payloadObject = {};

            // Call the API to submit the data to the server
            payloadObject.URL = "DeveloperStudio/FilesForImport";

            payloadObject.InboundDataFunction = function (CDeveloperStudio_CFilesForImportResponse)
            {
                TriSysApex.UI.HideWait();

                if (CDeveloperStudio_CFilesForImportResponse)
                {
                    if (CDeveloperStudio_CFilesForImportResponse.Success)
                    {
                        // Show file list
                        fnCallback(CDeveloperStudio_CFilesForImportResponse.Files);

                        return;
                    }
                    else
                        TriSysApex.UI.ShowMessage(CDeveloperStudio_CFilesForImportResponse.ErrorMessage);
                }
            };

            payloadObject.ErrorHandlerFunction = function (request, status, error)
            {
                TriSysApex.UI.HideWait();
                TriSysApex.UI.errorAlert('DeveloperStudio.WebAPI.ReadFileImportList: ' + status + ": " + error + ". responseText: " + request.responseText);
            };

            TriSysApex.UI.ShowWait(null, "Reading Files...");
            TriSysAPI.Data.PostToWebAPI(payloadObject);
        },

        CopyImportedFile: function (sFolderPath, sSourceFile, fnCallback)
        {
            var CDeveloperStudio_CFileCopyImportedRequest =
            {
				RootPath: sFolderPath,
                SourceFileName: sSourceFile
            };

            var payloadObject = {};

            // Call the API to submit the data to the server
            payloadObject.URL = "DeveloperStudio/CopyImportedFile";

            payloadObject.OutboundDataPacket = CDeveloperStudio_CFileCopyImportedRequest;

            payloadObject.InboundDataFunction = function (CDeveloperStudio_CFileCopyImportedResponse)
            {
                TriSysApex.UI.HideWait();

                if (CDeveloperStudio_CFileCopyImportedResponse)
                {
                    if (CDeveloperStudio_CFileCopyImportedResponse.Success)
                    {
                        fnCallback(CDeveloperStudio_CFileCopyImportedResponse.ImportedFilePath);

                        return;
                    }
                    else
                        TriSysApex.UI.ShowMessage(CDeveloperStudio_CFileCopyImportedResponse.ErrorMessage);
                }
            };

            payloadObject.ErrorHandlerFunction = function (request, status, error)
            {
                TriSysApex.UI.HideWait();
                TriSysApex.UI.errorAlert('DeveloperStudio.WebAPI.CopyImportedFile: ' + status + ": " + error + ". responseText: " + request.responseText);
            };

            TriSysApex.UI.ShowWait(null, "Importing File...");
            TriSysAPI.Data.PostToWebAPI(payloadObject);
        },

		NewFolder: function(sFolderPath, sFolderName, fnCreatedFolder)
		{
			var CDeveloperStudio_CCreateFolderRequest =
            {
				RootPath: sFolderPath,
				FolderName: sFolderName
            };

            var payloadObject = {};

            // Call the API to submit the data to the server
            payloadObject.URL = "DeveloperStudio/CreateFolder";

            payloadObject.OutboundDataPacket = CDeveloperStudio_CCreateFolderRequest;

            payloadObject.InboundDataFunction = function (CDeveloperStudio_CCreateFolderResponse)
            {
                TriSysApex.UI.HideWait();

                if (CDeveloperStudio_CCreateFolderResponse)
                {
                    if (CDeveloperStudio_CCreateFolderResponse.Success)
						fnCreatedFolder(CDeveloperStudio_CCreateFolderResponse.FolderPath);
                    else
                        TriSysApex.UI.ShowMessage(CDeveloperStudio_CCreateFolderResponse.ErrorMessage);
                }
            };

            payloadObject.ErrorHandlerFunction = function (request, status, error)
            {
                TriSysApex.UI.HideWait();
                TriSysApex.UI.errorAlert('DeveloperStudio.WebAPI.NewFolder: ' + status + ": " + error + ". responseText: " + request.responseText);
            };

            TriSysApex.UI.ShowWait(null, "Creating Folder...");
            TriSysAPI.Data.PostToWebAPI(payloadObject);
		},

		DeleteFolder: function(sFolderPath, fnCDeletedFolder)
		{
			var CDeveloperStudio_CDeleteFolderRequest =
            {
				FolderPath: sFolderPath
            };

            var payloadObject = {};

            // Call the API to submit the data to the server
            payloadObject.URL = "DeveloperStudio/DeleteFolder";

            payloadObject.OutboundDataPacket = CDeveloperStudio_CDeleteFolderRequest;

            payloadObject.InboundDataFunction = function (CDeveloperStudio_CDeleteFolderResponse)
            {
                TriSysApex.UI.HideWait();

                if (CDeveloperStudio_CDeleteFolderResponse)
                {
                    if (CDeveloperStudio_CDeleteFolderResponse.Success)
						fnCDeletedFolder(CDeveloperStudio_CDeleteFolderResponse.ParentFolderPath);
                    else
                        TriSysApex.UI.ShowMessage(CDeveloperStudio_CDeleteFolderResponse.ErrorMessage);
                }
            };

            payloadObject.ErrorHandlerFunction = function (request, status, error)
            {
                TriSysApex.UI.HideWait();
                TriSysApex.UI.errorAlert('DeveloperStudio.WebAPI.DeleteFolder: ' + status + ": " + error + ". responseText: " + request.responseText);
            };

            TriSysApex.UI.ShowWait(null, "Deleting Folder...");
            TriSysAPI.Data.PostToWebAPI(payloadObject);
		},

		RenameFolder: function(sFolderPath, sFolderName, fnRenamedFolder)
		{
			var CDeveloperStudio_CRenameFolderRequest =
            {
				RootPath: sFolderPath,
				FolderName: sFolderName
            };

            var payloadObject = {};

            // Call the API to submit the data to the server
            payloadObject.URL = "DeveloperStudio/RenameFolder";

            payloadObject.OutboundDataPacket = CDeveloperStudio_CRenameFolderRequest;

            payloadObject.InboundDataFunction = function (CDeveloperStudio_CRenameFolderResponse)
            {
                TriSysApex.UI.HideWait();

                if (CDeveloperStudio_CRenameFolderResponse)
                {
                    if (CDeveloperStudio_CRenameFolderResponse.Success)
						fnRenamedFolder(CDeveloperStudio_CRenameFolderResponse.FolderPath);
                    else
                        TriSysApex.UI.ShowMessage(CDeveloperStudio_CRenameFolderResponse.ErrorMessage);
                }
            };

            payloadObject.ErrorHandlerFunction = function (request, status, error)
            {
                TriSysApex.UI.HideWait();
                TriSysApex.UI.errorAlert('DeveloperStudio.WebAPI.RenameFolder: ' + status + ": " + error + ". responseText: " + request.responseText);
            };

            TriSysApex.UI.ShowWait(null, "Renaming Folder...");
            TriSysAPI.Data.PostToWebAPI(payloadObject);
		},

		RenameFile: function(sFilePath, sFileName, fnRenamedFile)
		{
			var CDeveloperStudio_CRenameFileRequest =
            {
				RootPath: sFilePath,
				FileName: sFileName
            };

            var payloadObject = {};

            // Call the API to submit the data to the server
            payloadObject.URL = "DeveloperStudio/RenameFile";

            payloadObject.OutboundDataPacket = CDeveloperStudio_CRenameFileRequest;

            payloadObject.InboundDataFunction = function (CDeveloperStudio_CRenameFileResponse)
            {
                TriSysApex.UI.HideWait();

                if (CDeveloperStudio_CRenameFileResponse)
                {
                    if (CDeveloperStudio_CRenameFileResponse.Success)
						fnRenamedFile(CDeveloperStudio_CRenameFileResponse.FilePath);
                    else
                        TriSysApex.UI.ShowMessage(CDeveloperStudio_CRenameFileResponse.ErrorMessage);
                }
            };

            payloadObject.ErrorHandlerFunction = function (request, status, error)
            {
                TriSysApex.UI.HideWait();
                TriSysApex.UI.errorAlert('DeveloperStudio.WebAPI.RenameFile: ' + status + ": " + error + ". responseText: " + request.responseText);
            };

            TriSysApex.UI.ShowWait(null, "Renaming File...");
            TriSysAPI.Data.PostToWebAPI(payloadObject);
		}

    },
    //#endregion DeveloperStudio.WebAPI

    Save: function(fnCallbackOnSave, bPreviewOnly)
    {
        var sFilePath = DeveloperStudio.GetSelectedTabbedFilePath();
        if (sFilePath)
        {
            DeveloperStudio.SaveSpecifiedFile(sFilePath, fnCallbackOnSave, bPreviewOnly);
        }
    },

    SaveSpecifiedFile: function (sFileName, fnCallbackOnSave, bPreviewOnly)
    {
        if (sFileName)
        {
            var editor = DeveloperStudio.GetEditorInstanceFromFile(sFileName);
            if (editor)
            {
                var sCode = editor.getValue("\r\n");

                var fnSaved = function ()
                {
                    TriSysApex.Toasters.Success("Successfully saved: " + sFileName);
                };
                if (!fnCallbackOnSave)
                    fnCallbackOnSave = fnSaved;

                DeveloperStudio.WebAPI.WriteFile(sFileName, sCode, fnCallbackOnSave, bPreviewOnly);
            }
        }
    },
    
    SaveAll: function ()
    {
        for (var i = 0; i < DeveloperStudio._FileObjects.length; i++)
        {
            var instanceAssociation = DeveloperStudio._FileObjects[i];
            DeveloperStudio.SaveSpecifiedFile(instanceAssociation.File);
        }
    },

    Publish: function ()
    {

    },

    CloseForm: function ()
    {
        // Not allowed to close form unless files are closed
        var iOpenFileCount = DeveloperStudio._FileObjects.length;
        if (iOpenFileCount > 0)
        {
            var sMessage = "You have " + iOpenFileCount + " file" + (iOpenFileCount > 1 ? "s" : "") +
                            " currently open. Please close all files, which may have been edited, before closing this form.";
            TriSysApex.UI.ShowMessage(sMessage);
        }
        else
            TriSysApex.FormsManager.CloseCurrentForm();
    },

    AddFile: function()
    {
		var sTreeViewID = DeveloperStudio.FileManagerTreeViewID;

		// User must have chosen a folder in which to add this file
		var sRootFolder = ctrlFileManager.GetSelectedFolder(sTreeViewID);

		if(!sRootFolder)
			return;

		var bColon = sRootFolder.substring(1, 2) == ':';
		if(!bColon)
		{
			TriSysApex.UI.ShowMessage("Please select a sub folder where file will be added to.");
			return;
		}

        var fnAddFiles = function (sFilePath)
        {
            setTimeout(function () 
			{ 
				var fnUploadAfterConfirmation = function()
				{
					DeveloperStudio.MoveUploadedFile(sFilePath, sRootFolder); 
				};

				DeveloperStudio.OverwriteMultipleFileCheck([ sFilePath ], sRootFolder, fnUploadAfterConfirmation);				

			}, 50);

			return true;
        };

        // Popup file selection dialogue to upload a local file or to choose one from a cloud storage service e.g. dropbox
		TriSysSDK.Controls.FileManager.FindFileUpload("Upload File", fnAddFiles);
    },

	// After upload file, check if file exists on server and if so prompt user to overwrite
	// or when dragging and dropping multiple files, check for any duplicates
	OverwriteMultipleFileCheck: function(lstFiles, sCopyToFolder, fnUploadAfterConfirmation)
	{
		var payloadObject = {};

        payloadObject.URL = "DeveloperStudio/Existence";

        var CFileExistenceRequest = {
            UploadedFileList: lstFiles,
            DestinationFolder: sCopyToFolder
        };

		payloadObject.OutboundDataPacket = CFileExistenceRequest;

        payloadObject.InboundDataFunction = function (CFileExistenceResponse)
        {
            TriSysApex.UI.HideWait();

            if (CFileExistenceResponse)
            {
                if (CFileExistenceResponse.Success)
                {
					if(CFileExistenceResponse.FilesExist)
					{
						var sFileList = '';
						CFileExistenceResponse.FilesExist.forEach(function(sFilePath)
						{
							sFileList += " &nbsp; &nbsp; " + sFilePath + "<br/>";
						});

						// Prompt user to confirm that file(s) should be overwritten
						var iCount = CFileExistenceResponse.FilesExist.length;
						var sMessage = "The following " + (iCount == 1 ? "" : iCount) + " file" + (iCount == 1 ? "" : "s") + 
								" already exist" + (iCount == 1 ? "s" : "") + " in this folder:" +
								"<br/><br/>" + sFileList +
								"<br/>" + "Do you wish to overwrite?";
						var fnYes = function() { fnUploadAfterConfirmation(); return true; };
						var sTitle = "Upload File Duplicate" + (iCount == 1 ? "" : "s") 
						TriSysApex.UI.questionYesNo(sMessage, sTitle, "Yes", fnYes, "No", function() { return true; });
					}
					else
						fnUploadAfterConfirmation();
                }
                else
                {
                    TriSysApex.UI.errorAlert(CFileExistenceResponse.ErrorMessage);
                }
            } else
            {
                // Something else has gone wrong!
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.ErrorHandlerRedirector('DeveloperStudio.OverwriteMultipleFileCheck: ', request, status, error);
        };

        TriSysApex.UI.ShowWait(null, "Validating Files...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
	},

	MoveUploadedFile: function(sFilePath, sRootFolder, fnAfterUpload)
    {
		if(!fnAfterUpload)
		{
			fnAfterUpload = function(sFilePath, ParentFolderPath)
			{
				// Is this a file we should edit?
				var bEditableFile = DeveloperStudio.isEditableFile(sFilePath);
				if(bEditableFile)
				{
					// Open new file in editor
					DeveloperStudio.SelectFile(sFilePath);
				}

				// Refresh files by opening folder
				DeveloperStudio.ReadFilesIntoFileManager(sParentFolderPath, true);
			};
		}

        var payloadObject = {};

        payloadObject.URL = "DeveloperStudio/MoveUploadedFile";

        var CMoveUploadedFileRequest = {
            UploadedFilePath: sFilePath,
            Folder: sRootFolder
        };

		payloadObject.OutboundDataPacket = CMoveUploadedFileRequest;

        payloadObject.InboundDataFunction = function (CMoveUploadedFileResponse)
        {
            TriSysApex.UI.HideWait();

            if (CMoveUploadedFileResponse)
            {
                if (CMoveUploadedFileResponse.Success)
                {
					fnAfterUpload(CMoveUploadedFileResponse.FilePath, CMoveUploadedFileResponse.ParentFolderPath);
                }
                else
                {
                    TriSysApex.UI.errorAlert(CMoveUploadedFileResponse.ErrorMessage);
                }
            } else
            {
                // Something else has gone wrong!
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.ErrorHandlerRedirector('DeveloperStudio.MoveUploadedFile: ', request, status, error);
        };

		var sName = TriSysSDK.Controls.FileManager.GetFileNameFromPath(sFilePath);
        TriSysApex.UI.ShowWait(null, "Uploading " + sName + "...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    NewFile: function()
    {
		var sTreeViewID = DeveloperStudio.FileManagerTreeViewID;

		// User must have chosen a folder (or a file where we will deduce the parent folder) in which to add this file
		var sRootFolder = ctrlFileManager.GetSelectedFolder(sTreeViewID, true, true);
		if(!sRootFolder)
			return;

		var bColon = sRootFolder.substring(1, 2) == ':';
		if(!bColon)
		{
			TriSysApex.UI.ShowMessage("Please select a sub folder where new file will be created.");
			return;
		}

        // Create one or more new files by prompting the user
        var fnAddFiles = function (fileSpecification)
        {
            for (var i = 0; i < fileSpecification.length; i++)
            {
                var fileSpec = fileSpecification[i];
				var bLastFileAdded = (i == fileSpecification.length - 1);

                var fnCreateFile = function (sFile, sTemplate)     // Closures!
                {
                    setTimeout(function ()
                    {
                        DeveloperStudio.AddFileFromSpecification(sTreeViewID, sFile, sTemplate, bLastFileAdded);

                    }, i * 1000);
                };

                fnCreateFile(fileSpec.FileName, fileSpec.Template);
            }            

            return true;
        };

        // Prompt the user for the name
        DeveloperStudio.NewDeveloperFileDialogue(fnAddFiles, sRootFolder);
    },

    NewDeveloperFileDialogue: function (fnSubmitCallback, sRootFolder)
    {
        var parametersObject = new TriSysApex.UI.ShowMessageParameters();

        parametersObject.Title = "New Developer File(s)";
        parametersObject.Image = "fa-file-code-o";
        parametersObject.Maximize = true;

        parametersObject.ContentURL = TriSysApex.Constants.UserControlFolder + "ctrlNewDeveloperFile.html";

        // Buttons
        parametersObject.ButtonLeftVisible = true;
        parametersObject.ButtonLeftText = "Save";
        parametersObject.ButtonLeftFunction = function ()
        {
            // Validate the data entry
            var fileSpecification = ctrlNewDeveloperFile.GetFileSpecification();

            if (!fileSpecification)
                return false;

			// Absolute folder path
			fileSpecification.forEach(function(file)
			{
				file.FileName = sRootFolder + '\\' + file.FileName;
			});
                    
            return fnSubmitCallback(fileSpecification);

            // It is the responsibility of the callback function to close this modal AFTER all is OK, else warn the user of error
        };

        parametersObject.ButtonRightVisible = true;
        parametersObject.ButtonRightText = "Cancel";

        TriSysApex.UI.PopupMessage(parametersObject);
    },

    AddFileFromSpecification: function(sTreeViewID, sFile, sTemplate, bLastFileAdded)
    {
        // Validate that it does not already exist
        if (DeveloperStudio.isFileInList(sTreeViewID, sFile))
        {
            TriSysApex.Toasters.Error(sFile + " already exists.");
            return;
        }

        // All files created are loaded from templates which are accessible from the Web API
        // Read the file template and populate it with context sensitive data ready for editing

        var fnPumpTemplateIntoNewFile = function (sCode)
        {
            // Add the file to the list and show it selected
			var fnOnSave = function()
			{
				if(bLastFileAdded)
					DeveloperStudio.ReadFilesIntoFileManager(sFile);
			};

            // 28 Apr 2021: New .form is a full form-designer in which we have a full user-friendly pop-up editor
			if (DeveloperStudio.isFormDesignerEnabledForFile(sFile))
            {
			    // Save this file now so that it exists on the server
			    // After save, refresh the list of files as we were created using the file wizard.
                // This will open the form designer automatically. Magic!
			    DeveloperStudio.WebAPI.WriteFile(sFile, sCode, function () { DeveloperStudio.ReadFilesIntoFileManager(sFile); }, false);
			    return;
			}

            // Add the file to the tabs with an editor corresponding to the type e.g. ,js, .html, .json
			// We must do this in order to save it to the server
            DeveloperStudio.AddFileEditorAndTab(sFile, sCode);

            // Save this file now so that it exists on the server
            DeveloperStudio.Save(fnOnSave);

			// Assume that this will work, so add this to custom forms to allow immediate testing
			DeveloperStudio.AddNewFileToCustomFormsToAllowImmediateTesting(sFile);
        };

        DeveloperStudio.WebAPI.ReadTemplate(sFile, sTemplate, fnPumpTemplateIntoNewFile);        
    },

	AddNewFileToCustomFormsToAllowImmediateTesting: function(sFilePath)		// e.g. "E:\Development\Production\TriSys API\API\Apex\custom\Opus-Laboris-Recruitment\AAAaaa.html"
	{
		var userCredentials = TriSysApex.LoginCredentials.UserCredentials();
        if (userCredentials && userCredentials.LoggedInUser)
        {
            if (userCredentials.LoggedInUser.CRMContact)
			{
                var customForms = userCredentials.LoggedInUser.CRMContact.CustomForms;
				var sHyphenatedCompanyName = userCredentials.LoggedInUser.CRMContact.CompanyName.replace(/ /g, '-').toLowerCase();

				var sFileName = TriSysSDK.Controls.FileManager.GetFileNameFromPath(sFilePath);
		
				var parts = sFilePath.split("\\custom\\");
				var sCustomFilePath = parts[1];				// e.g. Opus-Laboris-Recruitment\myFolder\AAAaaa.html
				sCustomFilePath = "custom\\" + sCustomFilePath;
				sCustomFilePath = sCustomFilePath.replace(/\\/g, '/');

				var customForm = {
					FileName: sFileName,
					FilePath: sCustomFilePath
				};
				customForms.push(customForm);
			}
        }
	},

    ImportFile: function ()
    {
        // Request files yet to be copied from Web API
        // These are the files that we know can be customised e.g. contact, company etc..
        // Get all customer specific files for editing

		var sFolderPath = DeveloperStudio.GetFolderOperationRootFolder({ ImportFile: true });
		if(!sFolderPath)
			return;

        var fnPromptUser = function (files)
        {
            if(files.length == 0)
            {
                TriSysApex.UI.ShowMessage("No more files are available to import.");
                return;
            }

            // Prompt the user to select one of the files
            var lstFiles = [];
            for (var i = 0; i < files.length; i++)
            {
                lstFiles.push({ FileName: files[i] });
            }
            var fileParameters = new TriSysApex.ModalDialogue.Selection.SelectionParameters();
            fileParameters.Title = "Import Custom Template";
            fileParameters.PopulationByObject = lstFiles;
            fileParameters.Columns = [{ field: "FileName", title: "File Name", type: "string" }];

            fileParameters.CallbackFunction = DeveloperStudio.SelectedImportFile;

            TriSysApex.ModalDialogue.Selection.Show(fileParameters);
        };

        DeveloperStudio.WebAPI.ReadFileImportList(fnPromptUser);
    },

    SelectedImportFile: function(fileObject)
    {
        var sFileName = fileObject.FileName;
		var sFolderPath = DeveloperStudio.GetFolderOperationRootFolder({ ImportFile: true });
		if(!sFolderPath)
			return;
        
        // Instruct Web API to make a copy of the source, refresh the list of files, open the newly imported file
        var fnCopied = function (sImportedFilePath)
        {
            TriSysApex.Toasters.Success("Copied: " + sFileName);

            // Refresh tree focusing on newly imported file ready for editing
			DeveloperStudio.ReadFilesIntoFileManager(sImportedFilePath);
        };

        DeveloperStudio.WebAPI.CopyImportedFile(sFolderPath, sFileName, fnCopied);

        return true;
    },

    CopyFile: function ()
    {
        var sFilePath = ctrlFileManager.GetSelectedFilePath(DeveloperStudio.FileManagerTreeViewID, true);
		if(!sFilePath)
			return;

		var sFileName = TriSysSDK.Controls.FileManager.GetFileNameFromPath(sFilePath);
		var bEditableFile = DeveloperStudio.isEditableFile(sFilePath);

		// No reason for this - developers may want to have their own file backups!
		//if(!bEditableFile)
		//{
		//	TriSysApex.UI.ShowMessage("You can only copy editable files.");
		//	return;
		//}

        var fnNewFile = function (sNewFileName)
        {
            // Cannot have illegal characters in files
            sNewFileName = TriSysSDK.Controls.FileManager.StripInconvenientFileNameCharacters(sNewFileName, true);

			// Add the same suffix if none-supplied
			var sNewFileSuffix = TriSysApex.Pages.FileManagerForm.FileSuffix(sNewFileName);
			if(!sNewFileSuffix)
			{
				var sExistingFileSuffix = TriSysApex.Pages.FileManagerForm.FileSuffix(sFilePath);
				if(sExistingFileSuffix)
					sNewFileName += "." + sExistingFileSuffix;
			}

            //if(!DeveloperStudio.isEditableFile(sNewFileName))
            //{
            //    TriSysApex.UI.ShowMessage('Invalid file suffix. Must be .js, .html or .json');
            //    return false;
            //}

            if(sFileName.toLowerCase() == sNewFileName.toLowerCase())
            {
                TriSysApex.UI.ShowMessage('The file being copied must have a different name to the original.');
                return false;
            }

            var fnCopied = function (sCopiedFilePath)
            {
                TriSysApex.Toasters.Success("Copied: " + sFileName + " to " + sNewFileName);

                // Open new file in editor
				//setTimeout(function() { DeveloperStudio.SelectFile(sCopiedFilePath); }, 2000);

                // Refresh and focus on file - this should open the editor if necessary
				DeveloperStudio.ReadFilesIntoFileManager(sCopiedFilePath);
            };

            DeveloperStudio.WebAPI.CopyFile(sFilePath, sNewFileName, fnCopied);

            return true;
        };

        // Prompt the user for the name
        var sMessage = "Copy: " + sFileName;
		var options = { Label: "File Name", Value: "Copy of " + sFileName };
        TriSysApex.ModalDialogue.New.Popup(sMessage, "gi-file", fnNewFile, options);
    },

	RenameFile: function()
	{
		var sFilePath = ctrlFileManager.GetSelectedFilePath(DeveloperStudio.FileManagerTreeViewID, true);
		if(!sFilePath)
			return;

		var sFileName = TriSysSDK.Controls.FileManager.GetFileNameFromPath(sFilePath);

		var bEditableFile = DeveloperStudio.isEditableFile(sFilePath);
		if(bEditableFile)
		{
			// Close file in editor
			DeveloperStudio.CloseFile(true, true);
		}

		var fnRenameFile = function(sNewFileName)
		{
			// Cannot have illegal characters in file names
            sFileName = TriSysSDK.Controls.FileManager.StripInconvenientFileNameCharacters(sFileName, true);
			sFileName = sFileName.replace(/\./g,'-');

            var fnRenamedFile = function (sNewFilePath)
            {
                TriSysApex.Toasters.Success("Renamed: " + sNewFileName);

                // Refresh tree and focus on new file
				DeveloperStudio.ReadFilesIntoFileManager(sNewFilePath);
            };

            DeveloperStudio.WebAPI.RenameFile(sFilePath, sNewFileName, fnRenamedFile);

			return true;
		};

        var sMessage = "Rename File";
        var options = { Label: "New File Name", Value: sFileName, Instructions: sFilePath };
        TriSysApex.ModalDialogue.New.Popup(sMessage, "gi-font", fnRenameFile, options);
	},

	// User may choose either a .js/.html/.json file being edited and focused in the tree 
	//  OR, and this is important...
	// a highlighted non-editable file e.g. file.pdf
	// We must therefore be clever to deal with this and not delete the wrong file!
    DeleteFile: function ()
    {
		var bEditingThisFile = false;
        var sFilePathBeingEdited = DeveloperStudio.GetSelectedTabbedFilePath();
		var sFilePathInTree = ctrlFileManager.GetSelectedFilePath(DeveloperStudio.FileManagerTreeViewID);

		if(!sFilePathBeingEdited && !sFilePathInTree)
		{
			TriSysApex.UI.ShowMessage("No file selected.");
			return;
		}

		var sFilePath = sFilePathInTree;
		if(sFilePathBeingEdited == sFilePathInTree)
			bEditingThisFile = true;
		
		var sFileName = TriSysSDK.Controls.FileManager.GetFileNameFromPath(sFilePath);

        var fnYes = function ()
        {
            var fnDeleted = function ()
            {
                TriSysApex.Toasters.Success("Deleted: " + sFileName);

				if(bEditingThisFile)
				{
					// Close file in editor
					DeveloperStudio.CloseFile(true, true);
				}

                // Refresh files
				var sParentFolder = TriSysSDK.Controls.FileManager.GetFolderPathFromFile(sFilePath, '\\');
				if(sParentFolder)
					sParentFolder = sParentFolder.substring(0, sParentFolder.length - 1);		// Strip off trailing \
                DeveloperStudio.ReadFilesIntoFileManager(sParentFolder, true);
            };

            DeveloperStudio.WebAPI.DeleteFile(sFilePath, fnDeleted);

            return true;
        };

        var sMessage = "Are you sure that you wish to delete the file: <b>" + sFileName + '</b>' +
            "<br /><br />" +
            '<span style="color: red;">Warning:</span> There is no \'undo\' functionality to this operation' +
			' so you will be charged for future archived recovery of this deleted file.';
        TriSysApex.UI.questionYesNo(sMessage, "Delete Developer File", "Yes", fnYes, "No");
    },

	OpenNonDeveloperFile: function()
    {
        debugger;
		var sFilePathInTree = ctrlFileManager.GetSelectedFilePath(DeveloperStudio.FileManagerTreeViewID, true);
		if(!sFilePathInTree)
			return;

		if(DeveloperStudio.isEditableFile(sFilePathInTree))
        {
			DeveloperStudio.SelectFileEditor(sFilePathInTree);
            return;
        }

		// Use our file viewer technology
		TriSysApex.Pages.FileManagerForm.FileOpenDrillDown(sFilePathInTree);
	},

    CloseFile: function(bNoDirtyPrompt, bDeletedSoDoNotReadFile)
    {
        var sTabsUL = 'DeveloperStudio-tabs';
        var sTabID = null;

        $('#' + sTabsUL).find('li').each(function ()
        {
            if ($(this).hasClass('active'))
            {
                sTabID = $(this).attr('id');
            }
        });

        var sFilePath = DeveloperStudio.GetFilePathFromTabID(sTabID);
        if (sFilePath)
        {
			var sFileName = TriSysSDK.Controls.FileManager.GetFileNameFromPath(sFilePath);

            var fnCloseFileAfterDirtyPrompt = function ()
            {
                if (sFilePath)
                {
                    // Get the instance of this editor from the DOM
					var instanceAssociation = DeveloperStudio.GetInstanceAssociationFromFile(sFilePath);

                    // Remove registered editor association with file
                    DeveloperStudio.RemoveRegisteredEditorInstanceFromFile(sFilePath);

                    var sFileLI = instanceAssociation.FileTabLI;
                    $('#' + sFileLI).remove();
                    var sFileEditorID = instanceAssociation.FileEditorTabContent;
                    $('#' + sFileEditorID).remove();

                    // Focus on first tab/file in the list
                    var bDidFirst = false;
                    $('#' + sTabsUL).find('li').each(function ()
                    {
                        if (!bDidFirst)
                        {
                            sTabID = $(this).attr('id');
                            $('#' + sTabID).addClass('active');
                            var sFile2 = DeveloperStudio.GetFilePathFromTabID(sTabID);
							instanceAssociation = DeveloperStudio.GetInstanceAssociationFromFile(sFile2);

                            var sFileEditorID =	instanceAssociation.FileEditorTabContent;
                            $('#' + sFileEditorID).addClass('active');

                            bDidFirst = true;
                        }
                    });

					// If no other tabs found, highlight parent folder to ensure that the user can re-open this file
					if(!bDidFirst)
					{
						var sRootFolder = ctrlFileManager.GetSelectedFolder(DeveloperStudio.FileManagerTreeViewID, true);
						ctrlFileManager.SelectTreeNodeWithFilePath(DeveloperStudio.FileManagerTreeViewID, sRootFolder);
					}
                }

                var iFileCount = DeveloperStudio._FileObjects.length;
                DeveloperStudio.ShowFileButtons(iFileCount > 0);

                DeveloperStudio.AfterTabClickEvent();
            };

            if (bDeletedSoDoNotReadFile)
            {
                fnCloseFileAfterDirtyPrompt();
                return;
            }

            var bDirty = DeveloperStudio.isFileDirty(sFileName);
            if (bDirty)
            {
                var sMessage = "File has been edited, or is different to that stored on our servers." +
                    "<br/>" + "Do you want to close the file and lose your latest changes?";
                var sTitle = sFileName;
                var yesCallback = function ()
                {
                    fnCloseFileAfterDirtyPrompt();
                    return true;    // This will close the popup
                };
                TriSysApex.UI.questionYesNo(sMessage, sTitle, "Yes", yesCallback, "No");
            }
            else
                fnCloseFileAfterDirtyPrompt();            
        }

    },

	GetFolderOperationRootFolder: function(options)
	{
		var bValidFolder = false;
		var sFilePath = ctrlFileManager.GetSelectedFolder(DeveloperStudio.FileManagerTreeViewID);
		var sName = ctrlFileManager.GetSelectedFolderText(DeveloperStudio.FileManagerTreeViewID);
		if(!sFilePath || !sName)
		{
			TriSysApex.UI.ShowMessage("Please select a folder.");
			return;
		}

		if(sName != DeveloperStudio.CustomAppFoldersText)
		{
			switch(sName)
			{
                case TriSysApex.Copyright.ShortProductName:
				case "Vertex":
			    case "TriOnyx":
			    case "Platformix":
			    case "Services":
			        if (options.NewFolder)
						bValidFolder = true;
					break;

				case "_Unobfuscated":
					break;

				default:
					bValidFolder = true;
					break;
			}
		}

		if(options.ImportFile)
            bValidFolder = (sName == TriSysApex.Copyright.ShortProductName);

		if(!bValidFolder)
		{
			var sOperationDescription = "add a new sub-folder to the";
			if(options.RenameFolder)
				sOperationDescription = "rename the";
			if(options.DeleteFolder)
				sOperationDescription = "delete the";
			if(options.ImportFile)
				sOperationDescription = "import files into the";
			sOperationDescription += " " + sName + " folder.";

			TriSysApex.UI.ShowMessage("You are not permitted to " + sOperationDescription);
		}

		if(bValidFolder)
			return sFilePath;
	},

	NewFolder: function()
	{
		var sFolderPath = DeveloperStudio.GetFolderOperationRootFolder({ NewFolder: true });
		if(!sFolderPath)
			return;

		var fnCreateFolder = function(sFolderName)
		{
			// Cannot have illegal characters in folder names
            sFolderName = TriSysSDK.Controls.FileManager.StripInconvenientFileNameCharacters(sFolderName, true);
			sFolderName = sFolderName.replace(/\./g,'-');

            var fnCreatedFolder = function (sNewFolderPath)
            {
                TriSysApex.Toasters.Success("Created: " + sNewFolderPath);

                // Refresh tree and focus on new folder ready for new files
				DeveloperStudio.ReadFilesIntoFileManager(sNewFolderPath, true);
            };

            DeveloperStudio.WebAPI.NewFolder(sFolderPath, sFolderName, fnCreatedFolder);

			return true;
		};

		// Prompt the user for the name
        var sMessage = "New Folder";
        var options = { Label: "Folder Name", Value: "", Instructions: sFolderPath };
        TriSysApex.ModalDialogue.New.Popup(sMessage, "fa-folder-o", fnCreateFolder, options);
	},

	RenameFolder: function()
	{
		var sFolderPath = DeveloperStudio.GetFolderOperationRootFolder({ RenameFolder: true });
		if(!sFolderPath)
			return;

		var parts = sFolderPath.split("\\");
		var sExistingFolderName = parts[parts.length - 1];

		var fnRenameFolder = function(sFolderName)
		{
			// Cannot have illegal characters in folder names
            sFolderName = TriSysSDK.Controls.FileManager.StripInconvenientFileNameCharacters(sFolderName, true);
			sFolderName = sFolderName.replace(/\./g,'-');

            var fnRenamedFolder = function (sNewFolderPath)
            {
                TriSysApex.Toasters.Success("Renamed: " + sNewFolderPath);

                // Refresh tree and focus on new folder ready for new files
				DeveloperStudio.ReadFilesIntoFileManager(sNewFolderPath, true);
            };

            DeveloperStudio.WebAPI.RenameFolder(sFolderPath, sFolderName, fnRenamedFolder);

			return true;
		};

        var sMessage = "Rename Folder";
        var options = { Label: "New Folder Name", Value: sExistingFolderName, Instructions: sFolderPath };
        TriSysApex.ModalDialogue.New.Popup(sMessage, "gi-font", fnRenameFolder, options);
	},

	DeleteFolder: function()
	{
		var sFolderPath = DeveloperStudio.GetFolderOperationRootFolder({ DeleteFolder: true });
		if(!sFolderPath)
			return;

		var sName = ctrlFileManager.GetSelectedFolderText(DeveloperStudio.FileManagerTreeViewID);

        var fnYes = function ()
        {
            var fnDeleted = function (sParentFolder)
            {
                TriSysApex.Toasters.Success("Deleted: " + sName);

				// Refresh tree and focus on parent folder
				DeveloperStudio.ReadFilesIntoFileManager(sParentFolder, true);
            };

            DeveloperStudio.WebAPI.DeleteFolder(sFolderPath, fnDeleted);

            return true;
        };

        var sMessage = "Are you sure that you wish to delete the folder: <b>" + sName + '</b>' +
            "<br /><br />" +
            '<span style="color: red;">Warning:</span> There is no \'undo\' functionality to this operation' +
			' and all files and sub-folders will also be deleted.';
        TriSysApex.UI.questionYesNo(sMessage, "Delete Developer Folder", "Yes", fnYes, "No");
	},

    // Only way to detect change is to compare, which is probably the best way anyway!
    isFileDirty: function(sFile)
    {
        // Synchronous call to get the file contents from the API and compare
        var editor = DeveloperStudio.GetEditorInstanceFromFile(sFile);
        if (editor)
        {
            var sEditedCode = editor.getValue("\r\n");

            var bDirty = false;
            var fnReadFile = function (sFileContents)
            {
                bDirty = (sFileContents != sEditedCode);
            };

            var bSynchronous = true;
            DeveloperStudio.WebAPI.ReadFile(sFile, fnReadFile, bSynchronous);

            return bDirty;
        }

        return false;
    },

    // Called when the file is loaded, and we want to focus on it
    SelectTab: function (sFileTabLI, sFileEditorTabContent, sFile)
    {
        var sTabsUL = 'DeveloperStudio-tabs';
        var sTabContent = 'DeveloperStudio-tabContent';

        // Clear any existing active status'
        $('#' + sTabsUL).find('li').each(function ()
        {
            $(this).removeClass('active');
        });

        $('#' + sFileTabLI).addClass('active');

        // Tab content - remove others which are active
        $('#' + sTabContent).find('div').each(function ()
        {
            $(this).removeClass('active');
        });

        // Make this new one active
        $('#' + sFileEditorTabContent).addClass('active');

        // Show/hide the HTML preview
        DeveloperStudio.AfterTabClickEvent();
    },

    // Called for each tab click and also after opening files
    AfterTabClickEvent: function()
    {
        var toolboxBlock = $('#DeveloperStudio-ToolboxBlock');

		var sFilePath = DeveloperStudio.GetSelectedTabbedFilePath();
        if (!sFilePath)
        {
            toolboxBlock.hide();
            return;
        }

        // Show/hide the HTML preview
        var bPreviewHTML = DeveloperStudio.isHTMLFile(sFilePath);
        var previewLabel = $('#DeveloperStudio-file-preview-label');
        var previewCheckbox = $('#DeveloperStudio-file-preview-checkbox');
        bPreviewHTML ? previewLabel.show() : previewLabel.hide();
        bPreviewHTML ? previewCheckbox.show() : previewCheckbox.hide();

        // Show/hide the JS Lint check box
        var bJSLint = DeveloperStudio.isJavascriptFile(sFilePath) || DeveloperStudio.isJSONFile(sFilePath);
        var jsLintLabel = $('#DeveloperStudio-file-jslint-label');
        var jsLintCheckbox = $('#DeveloperStudio-file-jslint-checkbox');
        bJSLint ? jsLintLabel.show() : jsLintLabel.hide();
        bJSLint ? jsLintCheckbox.show() : jsLintCheckbox.hide();

        // Show/hide toolbox
        toolboxBlock.show();
        DeveloperStudio.ToolboxViewMode(bPreviewHTML, DeveloperStudio.isJavascriptFile(sFilePath), DeveloperStudio.isJSONFile(sFilePath));

        // Kludge because adding the check box to the group causes vertical alignment problems
        //var kludgeButtonRow = $('#DeveloperStudio-file-close-column');
        //(bPreviewHTML || bJSLint) ? kludgeButtonRow.css('padding-top', '5px') : kludgeButtonRow.css('padding-top', '0px');

		// Highlight this file in the file manager
		ctrlFileManager.SelectTreeNodeWithFilePath(DeveloperStudio.FileManagerTreeViewID, sFilePath, { FireFileSelectionCallback: false });

        // Force refresh the editor just in case it is out of sync with JS Lint markers
        var editor = DeveloperStudio.GetEditorInstance();
        if (editor)
            editor.refresh();
    },

    AddFileEditorAndTab: function(sFilePath, sCode)
    {
        var sTabsUL = 'DeveloperStudio-tabs';
        var sTabContent = 'DeveloperStudio-tabContent';

		var sFileName = TriSysSDK.Controls.FileManager.GetFileNameFromPath(sFilePath);

        //var sFileNameIDFriendly = sFileName.replace(/\./g, '_');		// Legacy because now we may have multiple in different folders!
        var sFileNameIDFriendly = TriSysSDK.Miscellaneous.GUID();

        // <li id="DeveloperStudio-tab-file-test_js" class="active"><a href="#DeveloperStudio-file-test_js">test.js</a></li>
        var sFileLI = 'DeveloperStudio-tab-file-' + sFileNameIDFriendly;
        var sFileTab = '<li id="' + sFileLI + '"><a href="#DeveloperStudio-file-' + sFileNameIDFriendly + '">' + sFileName + '</a></li>';

        // Append item to list
        $('#' + sTabsUL).append(sFileTab);

		// Set the data item to be the full file path as this uniquely identifies this file, not the legacy <li id
		$('#' + sFileLI).data("FilePath", sFilePath);

        var sFileEditorID = 'DeveloperStudio-file-' + sFileNameIDFriendly;
        var sTabEditorContent = '<div class="tab-pane" id="' + sFileEditorID + '">';

        // Append content and make it selected
        $('#' + sTabContent).append(sTabEditorContent);

        // Have to use magic to re-initialise tabs to recognise the new tabs - tabclick, tab click
        $('[data-toggle="tabs"] a, .enable-tabs a').unbind("click").click(function (e)
        {
            e.preventDefault();
            $(this).tab('show');
            DeveloperStudio.AfterTabClickEvent();
        });

        // Make the new tab active
        DeveloperStudio.SelectTab(sFileLI, sFileEditorID, sFileName);

        // Now add a code editor

        var mode = DeveloperStudio.GetCodeEditorModeFromFileName(sFileName);
        var codeEditor = DeveloperStudio.ConvertDivToCodeEditor(sFileEditorID, sCode, mode);
        DeveloperStudio.RegisterEditorInstanceWithFile(sFilePath, codeEditor, sFileLI, sFileEditorID);

        // Set the code editor height to match the window space
        var fnHeightFix = function ()
        {
            var iHeightFactor = 246;
            var lHeight = window.innerHeight - iHeightFactor;
            $('.CodeMirror').height(lHeight).width("100%");
            //$('.CodeMirror').css('height', 'auto');   This allows us to use only one scrollbar in the form, but it is harder for developers to find the top buttons!
            $('.CodeMirror').css('border-bottom-left-radius', '8px').css('border-bottom-right-radius', '8px');   // 03 Apr 2023

            codeEditor.refresh();
        };
        setTimeout(fnHeightFix, 100);

        DeveloperStudio.ShowFileButtons(true);

        // If opening a new file, make sure we are LINTing if turned on
        var bJS = DeveloperStudio.isJavascriptFile(sFileName) || DeveloperStudio.isJSONFile(sFileName);
        if (bJS)
            DeveloperStudio.JSLintCheckBoxEvent(sFileName);
    },

	GetCodeEditorModeFromFileName: function(sFileName)
	{
		// File type
        var bHTML = DeveloperStudio.isHTMLFile(sFileName);

        var mode = DeveloperStudio.GetCodeEditorMode(bHTML);

		return mode;
	},

	GetCodeEditorMode: function(bHTML)
	{
        var mode = "javascript";
        if(bHTML)
        {
            mode = {
                name: "htmlmixed",
                scriptTypes: [
					{
						matches: /\/x-handlebars-template|\/x-mustache/i,
						mode: null
					},
					{
						matches: /(text|application)\/(x-)?vb(a|script)/i,
						mode: "vbscript"
					}
				]
            };
        }

		return mode;
	},

    ConvertDivToCodeEditor: function(sID, sCode, mode)
    {
        var fileElement = document.getElementById(sID);
        var myCodeMirror = null;

        try
        {
            myCodeMirror = CodeMirror(fileElement, {
                lineNumbers: true,
                extraKeys: { "Alt-F": "findPersistent" },
                indentUnit: 4,
                mode: mode,
                value: sCode ? sCode : '',

				// view-source:https://codemirror.net/demo/folding.html
				lineWrapping: true,
				//extraKeys: {"Ctrl-Q": function(cm){ cm.foldCode(cm.getCursor()); }},		// Later version only?
				foldGutter: true,
				gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"]
            });

            myCodeMirror.display.wrapper.style.fontSize = DeveloperStudio._DefaultEditorFontHeight + "px";

        } catch (e)
        {
            TriSysApex.UI.ShowMessage("Failed to instantiate CodeMirror: " + TriSysApex.Logging.CatchVariableToText(e));
        }
        
        return myCodeMirror;
    },

    // Enumerate through the tabs to find the one which is active, and return the filename
    GetSelectedTabbedFileName: function()
    {
        var sTabID = DeveloperStudio.GetSelectedTabID();

        var sFile = DeveloperStudio.GetFileNameFromTabID(sTabID);
        return sFile;
    },

    GetSelectedTabbedFilePath: function()
    {
        var sTabID = DeveloperStudio.GetSelectedTabID();

        var sFile = DeveloperStudio.GetFilePathFromTabID(sTabID);
        return sFile;
    },

    GetSelectedTabID: function()
    {
        var sTabsUL = 'DeveloperStudio-tabs';
        var sTabID = null;

        $('#' + sTabsUL).find('li').each(function ()
        {
            if($(this).hasClass('active'))
            {
                var sID = $(this).attr('id');
                sTabID = sID;
            }
        });

        return sTabID;
    },

    GetFileNameFromTabID: function(sTabID)
    {
        var sFile = DeveloperStudio.GetFileNameFromDOMID(sTabID, 'DeveloperStudio-tab-file-');
        return sFile;
    },

    GetFilePathFromTabID: function(sTabID)
    {
        var sFilePath = $('#' + sTabID).data("FilePath");
        return sFilePath;
    },

    GetFileNameFromDOMID: function (sID, sPrefix)
    {
        if (sID)
        {
            var sFile = sID.replace(sPrefix, '');
            var parts = sFile.split('_');
            sFile = '';
            var sSuffix = parts[parts.length - 1];
            for (i = 0; i < parts.length - 1; i++)
            {
                if (i > 0)
                    sFile += "_";
                sFile += parts[i];
            }
            sFile += "." + sSuffix;
            return sFile;
        }
    },

	// Only needed when we are dealing with currency related HTML code snippets
	// Replaces value="£25,000" with value="&pound;25,000"
	CurrencyConversionInHTMLBeforePasteIntoEditor: function(sHTML)
	{
		if(sHTML)
			sHTML = sHTML.replace(/="£/g, '="&pound;');

		return sHTML;
	},

    // Inserting a 'cliche'/tool/object into the editor
    AddCliche: function(sCliche)
    {
        var sFilePath = DeveloperStudio.GetSelectedTabbedFilePath();
        if (sFilePath)
        {
            var editor = DeveloperStudio.GetEditorInstanceFromFile(sFilePath);
            if (editor)
            {
				if( sCliche && DeveloperStudio.isHTMLFile(sFilePath) )
					sCliche = DeveloperStudio.CurrencyConversionInHTMLBeforePasteIntoEditor(sCliche);
				
				// New
				editor.replaceSelection(sCliche, 'around');
				return;

				// OLD
     //           var lineCH = editor.getCursor();
     //           var iStartLine = lineCH.line;
     //           var iLines = sCliche.split(/\r\n|\r|\n/).length;
     //           var iEndLine = iStartLine + iLines - 1;

     //           editor.replaceSelection(sCliche);

     //           try
     //           {
     //               editor.setSelection({
     //                   line: iStartLine,
     //                   ch: 0
     //               }, {
     //                   line: iEndLine,
     //                   ch: 0
     //               });
     //               return;

     //               // This works and serves as an example
     //               //editor.markText({
     //               //    line: actualLineNumber,
     //               //    ch: 1
     //               //}, {
     //               //    line: actualLineNumber+10,
     //               //    ch: 1
     //               //}, {
     //               //    css: "background-color : red"
     //               //});

     //           } catch (e)
     //           {
					//// 3rd party control!
     //           }

            }
        }
    },

    ShowFileButtons: function (bShow)
    {
        var instructions = $('#DeveloperStudio-file-panel-instructions');
		var fileButtons = $('#DeveloperStudio-file-button-group');
        bShow ? instructions.hide() : instructions.show();
        bShow ? fileButtons.show() : fileButtons.hide();

        var buttons = ['close', 'undo', 'redo', 'font-smaller', 'font-larger'];
        buttons.forEach(function (sID)
        {
            var btn = $('#DeveloperStudio-file-' + sID + '-button');
            bShow ? btn.show() : btn.hide();
        });
    },

    // When preview mode selected, display the HTML file in a dynamically loaded panel
    // which hides the editor.
    // Disable the tabs and file and toolbox and buttons so that the form is effectively
    // in 'test mode' which is what I would like if I was developing in Apex ;-)
    //
    PreviewCheckBoxEvent: function(bPreview, bRenderJSON)
    {
        if(TriSysAPI.Operators.isEmpty(bPreview))
            bPreview = TriSysSDK.CShowForm.GetCheckBoxValue('DeveloperStudio-file-preview');

		var sFilePath = DeveloperStudio.GetSelectedTabbedFilePath();
        if (!sFilePath)
            return;         // Should never happen

        var editorInstance = DeveloperStudio.GetInstanceAssociationFromFile(sFilePath);
        if (!editorInstance)
            return;         // Should never happen

        var sSelectedTabID = DeveloperStudio.GetSelectedTabID();
        var tabs = $('#DeveloperStudio-tabs');
        //tabs.attr("disabled", bPreview);  // Does not work

        $('#DeveloperStudio-tabs').find('li').each(function ()
        {
            $(this).attr("disabled", bPreview);     // Does not work

            var sTabID = $(this).attr('id');
            if(sTabID != sSelectedTabID)
                bPreview ? $('#' + sTabID).hide() : $('#' + sTabID).show();
        });

        // Made toolbox, files etc.. hidden nd show preview instructions
        var col = $('#DeveloperStudio-FilesAndToolboxColumn');
        //bPreview ? col.hide() : col.show();
        var block = $('#DeveloperStudio-FilesBlock');
        bPreview ? block.hide() : block.show();
        block = $('#DeveloperStudio-ToolboxBlock');
        bPreview ? block.hide() : block.show();

        var previewInstructions = $('#DeveloperStudio-PreviewInstructionsBlock');
        bPreview ? previewInstructions.show() : previewInstructions.hide();


        var buttons = ['save', 'saveall', 'file-undo', 'file-redo', 'file-font-smaller', 'file-font-larger', 'file-close'];
        buttons.forEach(function (sID)
        {
            var btn = $('#DeveloperStudio-' + sID + '-button');
            btn.attr("disabled", bPreview);  
        });

        // The business end of this
        var previewContainer = $('#DeveloperStudio-preview-container');
        var tabContainer = $('#DeveloperStudio-tabContent');
        bPreview ? tabContainer.hide() : tabContainer.show();
        bPreview ? previewContainer.show() : previewContainer.hide();

        if (!bPreview && !bRenderJSON)
            previewContainer.empty();
        else
        {
            // Do an implicit save of this file before preview which will return the public URL also
            var fnAfterFileSave = function (sURL)
            {
                if (bRenderJSON)
                    DeveloperStudio.RenderJSONFileAsHTML('DeveloperStudio-preview-container', sURL);
                else
                    TriSysApex.FormsManager.loadPageIntoDiv('DeveloperStudio-preview-container', sURL, null);
            };

			var bDirty = DeveloperStudio.isFileDirty(sFilePath);
			var bPreviewOnly = !bDirty;
            DeveloperStudio.Save(fnAfterFileSave, bPreviewOnly);
        }
    },

    // Show HTML templates for .html files and show Javascript templates for .js files
	// Not in July 2019: All tools apply to all edited files
    ToolboxViewMode: function(bHTMLFile, bJavascriptFile, bJSONFile)
    {
        // Enumerate through list and hide either html or js items
        var sUL = 'DeveloperStudio-toolbox-list';
        var sItemPrefix = 'DeveloperStudio-toolbox-list-item-';

        $('#' + sUL).find('li').each(function ()
        {
            var sToolID = $(this).attr('id');
			var tool = $('#' + sToolID).data("tool");
            
            // Last _ is the type
            var parts = sToolID.split("_");
            var sSuffix = parts[parts.length - 1];
        
            // Do we display it?
            var bDisplay = (bHTMLFile && tool.HTML) || (bJavascriptFile && tool.Javascript) || (bJSONFile && tool.JSON);

            bDisplay ? $(this).show() : $(this).hide();
        });
    },

    //#region Toolbox Special Tools

    SpecialTools: [
        {
            Caption: 'Icon Picker (.html)',
            Invoke: 'DeveloperStudio.IconPickerTool',
			HTML: ''
        },
        {
            Caption: 'Icon Picker (.json)',
            Invoke: 'DeveloperStudio.IconPickerToolJson',
			JSON: true
        },
        //{
        //    FileName: 'ColourPicker.any',                 // Note .any means available in html, js and json files  
        //    Caption: 'Colour Picker',
        //    Invoke: 'DeveloperStudio.ColourPickerTool'
        //},
        {
            Caption: 'Field Picker',
            Invoke: 'DeveloperStudio.FieldPickerTool',
			HTML: '<!-- Field Picker -->\n'
        }//,
        //{
        //    Caption: 'Theme Picker',
        //    Invoke: 'DeveloperStudio.ThemePickerTool'
        //}
    ],

    // We have special non-templated tools which help developers access app functionality to generate
    // both code and markup e.g. icon picker
    //
    AddDeveloperTools: function (tools)
    {
        DeveloperStudio.SpecialTools.forEach(function (tool)
        {
            tools.push(tool);
        });
    },

    isSpecialTool: function(sTool)
    {
        var bFoundTool = false;
        DeveloperStudio.SpecialTools.forEach(function (tool)
        {
            if (tool.Caption == sTool && tool.Invoke)
                bFoundTool = true;
        });
        return bFoundTool;
    },

    ActivateSpecialTool: function (sTool)
    {
        var specialTool = null;
        DeveloperStudio.SpecialTools.forEach(function (tool)
        {
            if (tool.Caption == sTool && tool.Invoke)
                specialTool = tool;
        });

        if(specialTool)
        {
            // Callback is to simply paste in the resulting code
            var fnCallback = function (sCode)
            {
                DeveloperStudio.AddCliche(sCode);
            };

            // Call the dynamic function
            var fn = TriSysApex.DynamicClasses.GetObject(specialTool.Invoke);

            if (fn)
            {
                // Ensure that it is a valid function, and execute it
                if (typeof fn === "function")
                {
                    fn(fnCallback);
                }
            }
        }
    },

    IconPickerTool: function(fnCallback)
    {
        var fnPicked = function (sIcon)
        {
            var sHTML = '<i class="' + sIcon + ' fa-2x themed-color"></i>\n';
            fnCallback(sHTML, sIcon);
        };

        TriSysApex.ModalDialogue.IconPicker.Show(fnPicked);
    },

    IconPickerToolJson: function (fnCallback)
    {
        var fnPicked = function (sIcon)
        {
            var sHTML = sIcon;
            fnCallback(sHTML);
        };

        TriSysApex.ModalDialogue.IconPicker.Show(fnPicked);
    },

    ColourPickerTool: function (fnCallback)
    {
        var fnPicked = function (sColourHex)
        {
            var sHTML = '#' + sColourHex;
            fnCallback(sHTML);
        };

        // TODO
        //TriSysApex.ModalDialogue.ColourPicker.Show(fnPicked);
    },

    ThemePickerTool: function (fnCallback)
    {
        var fnPicked = function (sTheme)
        {
            fnCallback(sTheme);
        };

        // TODO
        //TriSysApex.ModalDialogue.ThemePicker.Show(fnPicked);
    },

    FieldPickerTool: function (fnCallback)
    {
        var fnPicked = function (fieldDescription)
        {
            // Different field types have different HTML so generate the complete wrapper now which CShowForm can populate and CRUDify
            var sHTML = DeveloperStudio.GenerateHTMLWrapperForFieldDescription(fieldDescription);
            fnCallback(sHTML);
            return true;
        };

        var fieldDescriptions = TriSysApex.Cache.FieldDescriptions();

        // Important Bug: We must take a copy of the field descriptions as we do not want to edit them
        fieldDescriptions = JSON.parse(JSON.stringify(fieldDescriptions));

        // Sort field descriptions
        fieldDescriptions.sort(function (a, b)
        {
            var x = a.TableName.toLowerCase() + '_' + a.TableFieldName.toLowerCase(),
            y = b.TableName.toLowerCase() + '_' + b.TableFieldName.toLowerCase();
            return x < y ? -1 : x > y ? 1 : 0;
        });

        // Prompt the user to select one of the field descriptions
        var fieldParameters = new TriSysApex.ModalDialogue.Selection.SelectionParameters();
        fieldParameters.Title = "Select Field Description";
        fieldParameters.PopulationByObject = fieldDescriptions;
        fieldParameters.Columns = [
                { field: "FieldId", title: "FieldId", type: "number", width: 70, hidden: true },
                { field: "TableName", title: "TableName", type: "string" },
                { field: "TableFieldName", title: "TableFieldName", type: "string" },
                { field: "FieldTypeName", title: "Field Type", type: "string" },
                { field: "Lookup", title: "Lookup", type: "string", template: '# if(Lookup == "true"){#Yes#}else{#No#} #' },
                { field: "Description", title: "Description", type: "string" }
        ];

        fieldParameters.CallbackFunction = fnPicked;

        TriSysApex.ModalDialogue.Selection.Show(fieldParameters);
    },

	// July 2019: Add <trisys-field> HTML
    GenerateHTMLWrapperForFieldDescription: function(fieldDescription)
    {
        // TODO: Different field types have different HTML e.g.
        //  <input type="text" class="k-textbox" id="Company_RegistrationNumber" style="width:100%" />
        //  <textarea class="k-textbox" id="Company_Comments" rows="8" style="width:100%; resize: none"></textarea>

        var sFieldName = fieldDescription.TableName + "_" + fieldDescription.TableFieldName;
        var sFieldID = ' id="' + sFieldName + '" ';
        var sHTMLText = '<input type="text" class="k-textbox" ' + sFieldID + 'style="width:100%" />';
        var sFieldLabel = (fieldDescription.FieldLabel ? fieldDescription.FieldLabel : fieldDescription.TableFieldName);
        var sCrLf = '\n\t\t';

        // The default is a text box
        var sHTML = TriSysSDK.CShowForm.TriSysFieldPickerToHTML(sFieldName, fieldDescription);

        sHTML = "<!-- Field: " + sFieldName + " -->" + sCrLf + sHTML + "\n";

        return sHTML;
    },

    //#endregion Toolbox Special Tools



    // Array of code mirror objects associated with opened file
    _FileObjects: [],

    RegisterEditorInstanceWithFile: function (sFile, codeEditor, sFileTabLI, sFileEditorTabContent)
    {
        var instanceAssociation = {
            File: sFile,
            Editor: codeEditor,
            FileTabLI: sFileTabLI,
            FileEditorTabContent: sFileEditorTabContent,
            JSLintWidgets: [],
            ChangeEventWaitingHandle: null,
            Dirty: false
        };
        DeveloperStudio._FileObjects.push(instanceAssociation);
    },

    RemoveRegisteredEditorInstanceFromFile: function (sFile)
    {
        for (var i = 0; i < DeveloperStudio._FileObjects.length; i++)
        {
            var instanceAssociation = DeveloperStudio._FileObjects[i];
            if (instanceAssociation.File == sFile)
            {
                DeveloperStudio._FileObjects.splice(i, 1);
                return;
            }
        }
    },

    GetInstanceAssociationFromFile: function(sFile)
    {
        for (var i = 0; i < DeveloperStudio._FileObjects.length; i++)
        {
            var instanceAssociation = DeveloperStudio._FileObjects[i];
            if (instanceAssociation.File == sFile)
                return instanceAssociation;
        }
    },

    GetEditorInstanceFromFile: function (sFile)
    {
        var instanceAssociation = DeveloperStudio.GetInstanceAssociationFromFile(sFile);
        if (instanceAssociation)
            return instanceAssociation.Editor;
    },

    GetEditorInstance: function()
    {
        var sFilePath = DeveloperStudio.GetSelectedTabbedFilePath();
        if (sFilePath)
        {
            var editor = DeveloperStudio.GetEditorInstanceFromFile(sFilePath);
            return editor;
        }
    },

    _DefaultEditorFontHeight: 12,

    IncreaseFontSize: function(bLarger)
    {
        var editor = DeveloperStudio.GetEditorInstance();
        if (editor)
        {
            var iHeight = DeveloperStudio._DefaultEditorFontHeight;   // editor.defaultTextHeight(); returns 20!
            var sHeight = editor.display.wrapper.style.fontSize;
            if (sHeight)
                iHeight = parseInt(sHeight.replace('px', ''));

            var iIncrement = 1 * (bLarger ? 1 : -1);
            iHeight += iIncrement;

            editor.display.wrapper.style.fontSize = iHeight + "px";
        }
    },

	Undo: function()
    {
        var editor = DeveloperStudio.GetEditorInstance();
        if (editor)
        {
            editor.undo();
        }
    },

	Redo: function()
    {
        var editor = DeveloperStudio.GetEditorInstance();
        if (editor)
        {
            editor.redo();
        }
    },

	FileDragDropCallback: function(lstFiles, sCopyToFolder)
	{
		var fnConfirmUpload = function()
		{
			var iFileUploadedCount = 0;
		
			var fnSendFileToServer = function(file)
			{
				// The callback when the file has been uploaded
				var fnCallbackToMoveUploadedFile = function (myUploadedFile)
				{
					var fnAfterUpload = function(sFilePath, sParentFolderPath)
					{
						iFileUploadedCount += 1;
						if(iFileUploadedCount == lstFiles.length)
						{
							// Only upon completion of last uploaded file, refresh the folder
							DeveloperStudio.ReadFilesIntoFileManager(sParentFolderPath, true);
						}
					};

					DeveloperStudio.MoveUploadedFile(myUploadedFile, sCopyToFolder, fnAfterUpload);
				};

				// Upload the file through the standard route
				TriSysSDK.Controls.FileManager.UploadFile(file, fnCallbackToMoveUploadedFile);
			};

			lstFiles.forEach(function(file)
			{
				fnSendFileToServer(file);
			});
		};

		var lstFileNames = [];
		lstFiles.forEach(function(file)
		{
			lstFileNames.push(file.name);
		});

		// Validate if any duplicates in this list
		DeveloperStudio.OverwriteMultipleFileCheck(lstFileNames, sCopyToFolder, fnConfirmUpload);
	},

	TestCode: function(sHTML, sJavascript, properties, sToolName)
	{
		var fnTestCode = function()
		{
			try
			{
				var dynamicfunction = new Function(sJavascript);
				dynamicfunction();
			}
			catch(ex)
			{
				// Display the error
				TriSysApex.UI.errorAlert(TriSysApex.Logging.CatchVariableToText(ex));
			}
		};		
			
		// Should we open a popup window to demonstrate the code?
		if(sHTML)
		{
			var fnLoadPopupWindow = function()
			{
				var parametersObject = new TriSysApex.UI.ShowMessageParameters();

				parametersObject.Title = "Test Generated Code: " + sToolName;
				parametersObject.Image = "fa-file-code-o";
				parametersObject.CloseTopRightButton = true;

				parametersObject.Draggable = false;		// To allow copying of the HTML
				parametersObject.FullScreen = true;

				parametersObject.ContentURL = TriSysApex.Constants.UserControlFolder + "ctrlDeveloperToolCodeTest.html";

				// Buttons
				parametersObject.ButtonLeftVisible = true;
				parametersObject.ButtonLeftText = "OK";
				parametersObject.ButtonLeftFunction = function ()
				{
					return true;
				};

				parametersObject.OnLoadCallback = function()
				{
					var sFilePath = DeveloperStudio.GetSelectedTabbedFilePath();
					var sFormFileName = TriSysSDK.Controls.FileManager.GetFileNameFromPath(sFilePath);
					ctrlDeveloperToolCodeTest.Load(sFormFileName, sHTML, sJavascript, fnTestCode);
				};

				TriSysApex.UI.PopupMessage(parametersObject);
			};

			TriSysApex.WhiteLabelling.LoadJavascriptFile('js/pages/ctrlDeveloperToolCodeTest.js', null, fnLoadPopupWindow);
		}
		else
		{
			// Run the code without a popup window
			fnTestCode();
		}
	},

	// TODO: Add to TriSys SDK
	// https://stackoverflow.com/questions/22581345/click-button-copy-to-clipboard-using-jquery
	CopyToClipboard: function(sText)
	{
		// Create a "hidden" input
		var aux = document.createElement("div");

		// Have to insert HTML line breaks
		sText = sText.replace(/ /g, '&nbsp;');
		sText = sText.replace(/\n/g, '<br/>') + '<br/>';

		// Assign it the value of the specified element
		aux.setAttribute("contentEditable", true);
		aux.innerHTML = sText;
		aux.setAttribute("onfocus", "document.execCommand('selectAll',false,null)"); 

		// Append it to the body
		document.body.appendChild(aux);

		// Highlight its content
		aux.focus();

		// Copy the highlighted text
		document.execCommand("copy");

		// Remove it from the body
		document.body.removeChild(aux);
	},

    //#region JS Lint

    UpdateJSLintHints: function (editor, sFile)
    {
        editor.operation(function ()
        {
            var instanceAssociation = DeveloperStudio.GetInstanceAssociationFromFile(sFile);
            var widgets = instanceAssociation.JSLintWidgets;

            for (var i = 0; i < widgets.length; ++i)
                editor.removeLineWidget(widgets[i]);

            widgets.length = 0;

            // Make web service call now
            try
            {
                JSHINT(editor.getValue());

                // Filter out certain errors
                var filterOutErrors = ['Mixed spaces and tabs.'];

                for (var i = 0; i < JSHINT.errors.length; ++i)
                {
                    var err = JSHINT.errors[i];
                    if (!err) continue;

                    var sReason = err.reason;
                    var bShowError = (filterOutErrors.indexOf(sReason) < 0);

                    if (bShowError)
                    {
                        var msg = document.createElement("div");
                        var icon = msg.appendChild(document.createElement("span"));
                        //icon.innerHTML = "!!";
                        icon.innerHTML = '<i class="fa fa-exclamation-triangle"></i>';
                        icon.className = "lint-error-icon";
                        msg.appendChild(document.createTextNode(err.reason));
                        msg.className = "lint-error";
                        widgets.push(editor.addLineWidget(err.line - 1, msg, { coverGutter: false, noHScroll: true }));
                    }
                }

            } catch (e)
            {
                // Web service or third party editor error which we will log in console only
                TriSysApex.Logging.LogMessage(TriSysApex.Logging.CatchVariableToText(e));
            }
        });

        var info = editor.getScrollInfo();
        var after = editor.charCoords({line: editor.getCursor().line + 1, ch: 0}, "local").top;
        if (info.top + info.clientHeight < after)
            editor.scrollTo(null, after - info.clientHeight + 3);
    },

    JSLintCheckBoxEvent: function (sFile)
    {
        var bJSLint = TriSysSDK.CShowForm.GetCheckBoxValue('DeveloperStudio-file-jslint');

        var fileObjects = DeveloperStudio._FileObjects;
        if (sFile)
        {
            // Only process this file
            var instance = DeveloperStudio.GetInstanceAssociationFromFile(sFile);
            fileObjects = [instance];
        }

        for (var iFileObject = 0; iFileObject < fileObjects.length; iFileObject++)
        {
            var instanceAssociation = fileObjects[iFileObject];
			if(instanceAssociation)
			{
				sFile = instanceAssociation.File;
				var bJS = DeveloperStudio.isJavascriptFile(sFile) || DeveloperStudio.isJSONFile(sFile);

	            if (bJS)
				{
					var editor = instanceAssociation.Editor;

					if (bJSLint)
					{
						// Turn on JS Lint now for ALL open files
						DeveloperStudio.UpdateJSLintHints(editor, sFile);

						// Add timer to catch future changes
						editor.on("change", function ()
						{
						   DeveloperStudio.onChangeEditorEvent(sFile);
						});
					}
					else
					{
						var widgets = instanceAssociation.JSLintWidgets;

						// Turn off JS Linting for ALL open files
						for (var i = 0; i < widgets.length; ++i)
							editor.removeLineWidget(widgets[i]);

						widgets = [];

						// Clear timers for change events
						if (instanceAssociation.ChangeEventWaitingHandle)
							clearTimeout(instanceAssociation.ChangeEventWaitingHandle);
					}

					editor.refresh();
				}
			}
		}
    },

    // Called when the user makes an edit change to the editor
    onChangeEditorEvent: function (sFile)
    {
        // If lint off, ignore
        var bLintOn = TriSysSDK.CShowForm.GetCheckBoxValue('DeveloperStudio-file-jslint');
        if(!bLintOn)
            return;

        var instance = DeveloperStudio.GetInstanceAssociationFromFile(sFile);

        if (instance.ChangeEventWaitingHandle)
            clearTimeout(instance.ChangeEventWaitingHandle);

        var fnUpdateJSHints = function ()
        {
            var editor = instance.Editor;
            DeveloperStudio.UpdateJSLintHints(editor, sFile);
        };

        instance.ChangeEventWaitingHandle = setTimeout(fnUpdateJSHints, 500);
    },

    //#endregion JS Lint

    //#region Form Designer Render JSON Feb 2021
    _RenderButtonBackToEditCaption: 'Edit JSON',
    _RenderButtonDefaultCaption: 'Render JSON',

    RenderJSON: function()
    {
        var sFilePath = DeveloperStudio.GetSelectedTabbedFilePath();
        if (!sFilePath)
            return;
        else
        {
            if(!DeveloperStudio.isJSONFile(sFilePath))
            {
                TriSysApex.UI.ShowMessage("Can only test rendering of JSON files as forms.");
                return;
            }
        }

        var elemButton = $('#DeveloperStudio-render-json-button');
        var bPreviewMode = (elemButton.text().trim() == DeveloperStudio._RenderButtonDefaultCaption);

        DeveloperStudio.PreviewCheckBoxEvent(bPreviewMode, bPreviewMode);

        elemButton.text(bPreviewMode ? DeveloperStudio._RenderButtonBackToEditCaption : DeveloperStudio._RenderButtonDefaultCaption);
    },

    // 06 Feb 2021
    // TODO: Relocate this into CShowForm when developed
    RenderJSONFileAsHTML: function(sContainerID, sURL)
    {
        var jsonObject = TriSysApex.Forms.Configuration.GetJSONFromFileUsingAjax(sURL);
        if (jsonObject)
            DeveloperStudio.RenderHTMLFromJSONObject(jsonObject, sContainerID);
    },

    RenderHTMLFromJSONObject: function (jsonObject, sContainerID)
    {
        // Simple
        var sTemplateHTML = "<h1>FormName: " + jsonObject.Form.FormName + ", Caption: " + jsonObject.Form.Caption + "</h1>";

        // For real!
        var outerBlockConstruct = DeveloperStudio.FormDesigner.GetConstruct("FormOuterBlock");
        var captionBlockConstruct = DeveloperStudio.FormDesigner.GetConstruct("FormCaptionBlock");
        var blockTitleButtonsConstruct = DeveloperStudio.FormDesigner.GetConstruct("BlockTitleButtons");
        var blockTitleButtonConstruct = DeveloperStudio.FormDesigner.GetConstruct("BlockTitleButton");
        var rowConstruct = DeveloperStudio.FormDesigner.GetConstruct("Row");
        var tabBlockConstruct = DeveloperStudio.FormDesigner.GetConstruct("TabBlock");
        var tabConstruct = DeveloperStudio.FormDesigner.GetConstruct("Tab");
        var tabContentConstruct = DeveloperStudio.FormDesigner.GetConstruct("TabContent");
        var sNewLine = "\n";

        sTemplateHTML = outerBlockConstruct.StartHTML.join(sNewLine);

        sTemplateHTML += captionBlockConstruct.StartHTML.join(sNewLine);
        sTemplateHTML = DeveloperStudio.FormDesigner.ReplaceJSONTagsWithFormData(sTemplateHTML, jsonObject.Form);

        // Buttons
        if (jsonObject.Form.Buttons)
        {
            sTemplateHTML += blockTitleButtonsConstruct.StartHTML.join(sNewLine);

            var iButtonCounter = 0;
            jsonObject.Form.Buttons.forEach(function (button)
            {
                iButtonCounter++;
                if(iButtonCounter > 1)
                    sTemplateHTML += '<span>&nbsp;</span>';

                sTemplateHTML += blockTitleButtonConstruct.StartHTML.join(sNewLine);

                sTemplateHTML = DeveloperStudio.FormDesigner.ReplaceJSONTagsInBlockButton(sTemplateHTML, button);

                sTemplateHTML += blockTitleButtonConstruct.EndHTML.join(sNewLine);
            });

            sTemplateHTML += blockTitleButtonsConstruct.EndHTML.join(sNewLine);
        }

        sTemplateHTML += captionBlockConstruct.EndHTML.join(sNewLine);

        if (jsonObject.Form.MainPanelRows)
        {
            jsonObject.Form.MainPanelRows.forEach(function (panelRow)
            {
                sTemplateHTML += rowConstruct.StartHTML.join(sNewLine);

                if (panelRow.Columns)
                {
                    panelRow.Columns.forEach(function(column)
                    {
                        sTemplateHTML += DeveloperStudio.FormDesigner.DrawColumn(column);
                    });
                }

                sTemplateHTML += rowConstruct.EndHTML.join(sNewLine);
            });
        }

        if (jsonObject.Form.TabBlock)
        {
            sTemplateHTML += tabBlockConstruct.StartHTML.join(sNewLine);        // Tab List Start
            sTemplateHTML = DeveloperStudio.FormDesigner.ReplaceJSONTagsWithTabBlockIDs(sTemplateHTML, jsonObject.Form.TabBlock);

            jsonObject.Form.TabBlock.Tabs.forEach(function (formTab) {
                sTemplateHTML += tabConstruct.StartHTML.join(sNewLine);
                sTemplateHTML = DeveloperStudio.FormDesigner.ReplaceJSONTagsWithTabData(sTemplateHTML, formTab);
                sTemplateHTML += tabConstruct.EndHTML.join(sNewLine);
            });

            sTemplateHTML += tabBlockConstruct.EndHTML.join(sNewLine);          // Tab List End

            sTemplateHTML += tabContentConstruct.StartHTML.join(sNewLine);      // Tab Panes Start

            jsonObject.Form.TabBlock.Tabs.forEach(function (formTab) {
                sTemplateHTML += DeveloperStudio.FormDesigner.GenerateTabContent(formTab);
            });

            sTemplateHTML += tabContentConstruct.EndHTML.join(sNewLine);        // Tab Panes End
        }

        sTemplateHTML += outerBlockConstruct.EndHTML.join(sNewLine);

        // Render in the DOM after building the dynamic HTML generated from JSON
        $("#" + sContainerID).html(sTemplateHTML);

        // Make sure we get our styles
        //setTimeout(TriSysProUI.kendoUI_Overrides, 500);

        // <trisys-field> code injection
        TriSysSDK.CShowForm.HTMLFieldsCodeInjection();

        // Spray content into some fields for showing off e.g. grids
        // TODO
    },

    // This is it!
    FormDesigner:
    {
        GetConstruct: function (sName)       // DeveloperStudio.FormDesigner.GetConstruct
        {
            var foundConstruct = null;
            DeveloperStudio.FormDesigner.TemplateConstructs.forEach(function (construct)
            {
                if (construct.Name == sName)
                    foundConstruct = construct;
            });
            return foundConstruct;
        },

        // FormOuterBlock.StartHTML
        //  TabBlock.StartHTML
        //      TabsContent.StartHTML
        //      TabsContent.EndHTML
        //  TabBlock.EndHTML
        // FormOuterBlock.EndHTML
        TemplateConstructs:             // DeveloperStudio.FormDesigner.TemplateConstructs
        [
            {
                Name: "FormOuterBlock",
                StartHTML:  ["<div class=\"block full\" style=\"padding-bottom: 0px;\">"],
                EndHTML:    ["</div>"]
            },
            {
                Name: "FormCaptionBlock",
                StartHTML:  [
                            "   <div class=\"block-title\">",
                            "       <i class=\"{{Form.Icon}} fa-2x pull-left themed-color\"></i>",
                            "       <h2 id=\"{{Form.CaptionID}}\">{{Form.Caption}}</h2>"
                            ],
                EndHTML: [
                            "   </div>"
                ]
            },
            {
                Name: "Row",
                StartHTML: [
                            "   <div class=\"row\">"
                ],
                EndHTML: [
                            "   </div>"
                ]
            },
            {
                Name: "Column",
                StartHTML: [
                            "       <div class=\"col-md-{{Column.WidthRatio}}\" style=\"padding-left: 0px\">"
                ],
                EndHTML: [
                            "       </div>"
                ]
            },
            {
                Name: "FormGroup",
                StartHTML: [
                            "           <div class=\"form-group\">"
                ],
                EndHTML: [
                            "           </div>"
                ]
            },
            {
                Name: "Table",
                StartHTML: [
                            "           <table class=\"table {{TableStyle.Border}} {{TableStyle.Striped}}\">",
                            "               <tbody>"
                ],
                EndHTML: [
                            "               </tbody>",
                            "           </table>"
                ]
            },
            {
                Name: "TableRow",
                StartHTML: [
                            "                   <tr>"
                ],
                EndHTML: [
                            "                   </tr>"
                ]
            },
            {
                Name: "TableColumn",
                StartHTML: [
                            "                       <td {{TableColumn.Width}}>"
                ],
                EndHTML: [
                            "                       </td>"
                ]
            },
            {
                Name: "TabBlock",
                StartHTML: [
                    "   <div class=\"block full\" id=\"{{TabBlock.ID}}\">",
		            "       <div class=\"block-title\">",
                    "           <ul class=\"nav nav-tabs\" data-toggle=\"tabs\" id=\"{{TabBlock.NavigationID}}\">"
                ],
                EndHTML: [
                    "           </ul>",
                    "       </div>" /*, WARNING!!!
                    "   </div>"*/
                ]
            },
            {
                Name: "Tab",
                StartHTML: [
                    "               <li id=\"{{Tab.ID}}\" {{Tab.Active}}>",
					"                   <a href=\"javascript:void(0)\"",
                    "                       onclick=\"TriSysSDK.EntityFormTabs.TabContainerClickEvent($(this), '{{Tab.Pane.ID}}', {{Tab.ClickEventHandler}});\">",
					"	                    <i class=\"{{Tab.Icon}}\"></i>&nbsp; {{Tab.Caption}}"
                ],
                EndHTML: [
                    "                   </a>",
				    "               </li>"
                ]
            },
            {
                Name: "TabContent",
                StartHTML: [
                    "       <div class=\"tab-content\">"
                ],
                EndHTML: [
                    "       </div>",
                    "   </div>"         // This is where we end the "TabBlock" above!
                ]
            },
            {
                Name: "TabPane",
                StartHTML: [
                    "           <div class=\"tab-pane\{{Tab.Pane.Active}}\" id=\"{{Tab.Pane.ID}}\" {{Tab.Pane.Display}}>"
                ],
                EndHTML: [
                    "           </div>"
                ]
            },
            {
                Name: "Block",
                StartHTML: [
                            "   <div class=\"block\" id=\"{{TabPaneBlock.ID}}\">"
                ],
                EndHTML: [
                            "   </div>"
                ]
            },
            {
                Name: "BlockTitle",
                StartHTML: [
                            "   <div class=\"block-title\">"
                ],
                EndHTML: [
                            "   </div>"
                ]
            },
            {
                Name: "BlockTitleButtons",
                StartHTML: [
                            "       <div class=\"block-options pull-right\">"
                ],
                EndHTML: [
                            "       </div>"
                ]
            },
            {
                Name: "BlockTitleButton",
                StartHTML: [
                            "       <a href=\"javascript:void(0)\"",
                            "           {{Button.ClickEvent}} id=\"{{Button.ID}}\" class=\"btn btn-sm btn-default themed-color enable-tooltip\"",
                            "           title=\"{{Button.Tooltip}}\">",
                            "       <i class=\"{{Button.Icon}} themed-color\"></i> &nbsp; {{Button.Caption}}"
                ],
                EndHTML: [
                            "       </a>"
                ]
            },
            {
                Name: "BlockTitleText",
                StartHTML: [
                            "       <h3>"
                ],
                EndHTML: [
                            "       </h3>"
                ]
            }
        ],

        // Columns can contain rows, form groups, tables and indeed further columns so this is a recursive function
        //
        DrawColumn: function (column)            // DeveloperStudio.FormDesigner.DrawColumn
        {
            var columnBlockConstruct = DeveloperStudio.FormDesigner.GetConstruct("Column");
            var formGroupConstruct = DeveloperStudio.FormDesigner.GetConstruct("FormGroup");
            var sNewLine = "\n";
            var sTemplateHTML = columnBlockConstruct.StartHTML.join(sNewLine);
            var sHTML = DeveloperStudio.FormDesigner.ReplaceColumnWidthRatio(sTemplateHTML, column);

            // Form Groups
            if (column.FormGroup)
            {
                sHTML += formGroupConstruct.StartHTML.join(sNewLine);

                if (column.FormGroup.Columns) {
                    // Recursion!
                    column.FormGroup.Columns.forEach(function (subColumn) {
                        sHTML += DeveloperStudio.FormDesigner.DrawColumn(subColumn);
                    });
                }

                sHTML += formGroupConstruct.EndHTML.join(sNewLine);
            }

            // Table Rows
            if (column.TableRows)
            {
                var tableConstruct = DeveloperStudio.FormDesigner.GetConstruct("Table");
                var tableRowConstruct = DeveloperStudio.FormDesigner.GetConstruct("TableRow");

                sHTML += tableConstruct.StartHTML.join(sNewLine);

                var sBorder = '';
                var sStriped = '';
                if (column.TableStyle)
                {
                    sBorder = column.TableStyle.Border ? 'table-borderless' : '';
                    sStriped = column.TableStyle.Striped ? 'table-striped' : '';
                }

                var lst = [
                    { Placeholder: "TableStyle.Border", Data: sBorder },
                    { Placeholder: "TableStyle.Striped", Data: sStriped }
                ];
                sHTML = DeveloperStudio.FormDesigner.ReplaceJSONTags(sHTML, lst);

                column.TableRows.forEach(function (columnTableRow)
                {
                    sHTML += tableRowConstruct.StartHTML.join(sNewLine);

                    // Table Columns
                    if (columnTableRow.Columns)
                    {
                        columnTableRow.Columns.forEach(function (tableColumn) 
                        {
                            sHTML += DeveloperStudio.FormDesigner.DrawTableRowColumn(tableColumn);
                        });
                    }

                    sHTML += tableRowConstruct.EndHTML.join(sNewLine);
                });                

                sHTML += tableConstruct.EndHTML.join(sNewLine);
            }

            sHTML += columnBlockConstruct.EndHTML.join(sNewLine);

            return sHTML;
        },

        DrawTableRowColumn: function (tableColumn)
        {
            var tableColumnConstruct = DeveloperStudio.FormDesigner.GetConstruct("TableColumn");
            var sNewLine = "\n";

            var sHTML = tableColumnConstruct.StartHTML.join(sNewLine);

            var sWidth = "";
            if (tableColumn.Width)
                sWidth = 'style = "width: ' + tableColumn.Width + '";';

            var lst = [ { Placeholder: "TableColumn.Width", Data: sWidth } ];
            sHTML = DeveloperStudio.FormDesigner.ReplaceJSONTags(sHTML, lst);

            // Text
            if (tableColumn.Text)
                sHTML += '<strong>' + tableColumn.Text + '</strong>';

            // Field
            if (tableColumn.Field)
                sHTML += DeveloperStudio.FormDesigner.FieldHTML(tableColumn.Field);

            sHTML += tableColumnConstruct.EndHTML.join(sNewLine);

            return sHTML;
        },

        FieldHTML: function(field)
        {
            // <trisys-field id="Company_Name" type="textbox" required="required"></trisys-field>
            // <trisys-field id="Company_WebPage" type="internet" title="Visit company web site"></trisys-field>
            // rows="10" style="resize: vertical;"
            // style="height: 200px; width: 200px; cursor: pointer; /*border-radius: 50%;*/" />

            var sHTML = '<trisys-field';
            var lstStyle = [];

            if (field.ID)
                sHTML += ' id="' + field.ID + '"';

            if (field.Type)
                sHTML += ' type="' + field.Type + '"';

            if (field.Tooltip)
                sHTML += ' title="' + field.Tooltip + '"';

            if (field.Required)
                sHTML += ' required="required"';

            if (field.Value)
                sHTML += ' value="' + field.Value + '"';

            if (field.Category)
                sHTML += ' category="' + field.Category + '"';

            if (field.Rows)
                sHTML += ' rows="' + field.Rows + '"';

            if (field.Resize)
                lstStyle.push('resize: ' + field.Resize + ';')

            if (field.Height)
                lstStyle.push('height: ' + field.Height + ';')

            if (field.Width)
                lstStyle.push('width: ' + field.Width + ';')

            if (field.Cursor)
                lstStyle.push('cursor: ' + field.Cursor + ';')

            if (field.BorderRadius)
                lstStyle.push('border-radius: ' + field.BorderRadius + ';')


            if (lstStyle.length > 0)
            {
                var sStyleHTML = '';

                lstStyle.forEach(function (style)
                {
                    if (sStyleHTML.length > 0)
                        sStyleHTML += ' ';

                    sStyleHTML += style;
                });
                sHTML += ' style="' + sStyleHTML + '"';
            }


            sHTML += '></trisys-field>';
            return sHTML;
        },

        ReplaceJSONTagsWithFormData: function (sTemplateHTML, formObject)
        {
            var lst = [
                { Placeholder: "Form.Icon", Data: formObject.Icon },
                { Placeholder: "Form.CaptionID", Data: formObject.CaptionID },
                { Placeholder: "Form.Caption", Data: formObject.Caption }
            ];

            var sHTML = DeveloperStudio.FormDesigner.ReplaceJSONTags(sTemplateHTML, lst);

            return sHTML;
        },

        ReplaceJSONTagsWithTabData: function (sTemplateHTML, tabObject)
        {
            var sActive = tabObject.Active ? 'class="active"': '';

            // Setting active does not work!
            sActive = '';

            var lst = [
                { Placeholder: "Tab.ID", Data: tabObject.ID },
                { Placeholder: "Tab.Caption", Data: tabObject.Caption },
                { Placeholder: "Tab.Icon", Data: tabObject.Icon },
                { Placeholder: "Tab.Pane.ID", Data: tabObject.Pane.ID },
                { Placeholder: "Tab.ClickEventHandler", Data: tabObject.ClickEventHandler },
                { Placeholder: "Tab.Active", Data: sActive }
            ];

            var sHTML = DeveloperStudio.FormDesigner.ReplaceJSONTags(sTemplateHTML, lst);

            // This is the hack to force selection of the first tab
            if(tabObject.Active)
            {
                // Force the first tab visible
                var fnForceActiveTabSelectionAfterDOMLoads = function()
                {
                    var sTabLi = tabObject.ID;
                    if(!TriSysSDK.EntityFormTabs.isTabSelected(sTabLi))
                        TriSysSDK.Controls.Button.Click(sTabLi);
                };

                setTimeout(fnForceActiveTabSelectionAfterDOMLoads, 500);                        
            }

            return sHTML;
        },

        ReplaceTabPaneTags: function (sHTML, tabObject)
        {
            var sActive = tabObject.Active ? ' active': '';
            var sDisplay = ' style="display: ' +tabObject.Active ? 'block': 'none' + ';"';

            // Setting active does not work!
            sDisplay = '', sActive = '';

            var lst = [
                { Placeholder: "Tab.Pane.ID", Data: tabObject.Pane.ID },
                { Placeholder: "Tab.Pane.Active", Data : sActive },
                { Placeholder: "Tab.Pane.Display", Data: sDisplay }
            ];

            sHTML = DeveloperStudio.FormDesigner.ReplaceJSONTags(sHTML, lst);

            return sHTML;
        },

        // Everything in the lower half of the form is rendered here
        // This is therefore a very big and complex beast!
        GenerateTabContent: function (tabObject)
        {
            var sNewLine = "\n";
            var tabPaneConstruct = DeveloperStudio.FormDesigner.GetConstruct("TabPane");
            var sHTML = tabPaneConstruct.StartHTML.join(sNewLine);

            sHTML = DeveloperStudio.FormDesigner.ReplaceTabPaneTags(sHTML, tabObject);

            if (tabObject.Pane.Blocks)
            {
                var blockConstruct = DeveloperStudio.FormDesigner.GetConstruct("Block");
                var blockTitleConstruct = DeveloperStudio.FormDesigner.GetConstruct("BlockTitle");
                var blockTitleButtonsConstruct = DeveloperStudio.FormDesigner.GetConstruct("BlockTitleButtons");
                var blockTitleButtonConstruct = DeveloperStudio.FormDesigner.GetConstruct("BlockTitleButton");
                var blockTitleTextConstruct = DeveloperStudio.FormDesigner.GetConstruct("BlockTitleText");
                var rowConstruct = DeveloperStudio.FormDesigner.GetConstruct("Row");
                var columnConstruct = DeveloperStudio.FormDesigner.GetConstruct("Column");

                tabObject.Pane.Blocks.forEach(function (tabPaneBlock)
                {
                    sHTML += blockConstruct.StartHTML.join(sNewLine);
                    sHTML = DeveloperStudio.FormDesigner.ReplaceJSONTag(sHTML,
                                                { Placeholder: "TabPaneBlock.ID", Data: tabPaneBlock.ID });

                    sHTML += blockTitleConstruct.StartHTML.join(sNewLine);

                    // Buttons
                    if (tabPaneBlock.Buttons)
                    {
                        sHTML += blockTitleButtonsConstruct.StartHTML.join(sNewLine);
                       
                        var iButtonCounter = 0;
                        tabPaneBlock.Buttons.forEach(function(button)
                        {
                            iButtonCounter++;
                            if(iButtonCounter > 1)
                                sHTML += '<span>&nbsp;</span>';

                            sHTML += blockTitleButtonConstruct.StartHTML.join(sNewLine);

                            sHTML = DeveloperStudio.FormDesigner.ReplaceJSONTagsInBlockButton(sHTML, button);

                            sHTML += blockTitleButtonConstruct.EndHTML.join(sNewLine);
                        });

                        sHTML += blockTitleButtonsConstruct.EndHTML.join(sNewLine);
                    }

                    // Caption
                    sHTML += blockTitleTextConstruct.StartHTML.join(sNewLine);
                    sHTML += tabPaneBlock.Caption;
                    sHTML += blockTitleTextConstruct.EndHTML.join(sNewLine);

                    sHTML += blockTitleConstruct.EndHTML.join(sNewLine);

                    // TODO: Fields & Rows
                    if (tabPaneBlock.Fields)
                    {
                        tabPaneBlock.Fields.forEach(function (field)
                        {
                            sHTML += DeveloperStudio.FormDesigner.FieldHTML(field);
                        });
                    }

                    if (tabPaneBlock.Rows)
                    {
                        tabPaneBlock.Rows.forEach(function (row)
                        {
                            sHTML += rowConstruct.StartHTML.join(sNewLine);
                   
                            if(row.Columns)
                            {
                                row.Columns.forEach(function (column)
                                {
                                    sHTML += DeveloperStudio.FormDesigner.ReplaceColumnWidthRatio(columnConstruct.StartHTML.join(sNewLine), column);
                            
                                    if (column.Fields)
                                    {
                                        column.Fields.forEach(function (field)
                                        {
                                            sHTML += DeveloperStudio.FormDesigner.FieldHTML(field);
                                        });
                                    }

                                    sHTML += columnConstruct.EndHTML.join(sNewLine);
                                });
                            }
                        });
                    }

                    sHTML += blockConstruct.EndHTML.join(sNewLine);
                });
            }

            // Cannot see much use for this style of layout!
            if (tabObject.Pane.Rows)
            {
                tabObject.Pane.Rows.forEach(function (row)
                {
                    sHTML += rowConstruct.StartHTML.join(sNewLine);
                   
                    if(row.Columns)
                    {
                        row.Columns.forEach(function (column)
                        {
                            sHTML += DeveloperStudio.FormDesigner.ReplaceColumnWidthRatio(columnConstruct.StartHTML.join(sNewLine), column);
                            
                            if (column.Fields)
                            {
                                column.Fields.forEach(function (field)
                                {
                                    sHTML += DeveloperStudio.FormDesigner.FieldHTML(field);
                                });
                            }

                            sHTML += columnConstruct.EndHTML.join(sNewLine);
                        });
                    }

                    sHTML += rowConstruct.EndHTML.join(sNewLine);
                });
            }

            sHTML += tabPaneConstruct.EndHTML.join(sNewLine);

            return sHTML;
        },

        ReplaceJSONTagsWithTabBlockIDs: function (sTemplateHTML, tabBlock) {
            var lst = [
                { Placeholder: "TabBlock.ID", Data: tabBlock.ID },
                { Placeholder: "TabBlock.NavigationID", Data: tabBlock.NavigationID }
            ];

            var sHTML = DeveloperStudio.FormDesigner.ReplaceJSONTags(sTemplateHTML, lst);

            return sHTML;
        },

        ReplaceJSONTagsInBlockButton: function(sHTML, button)
        {
            var sCallback = button.ClickEventHandler ? ' onclick="' + button.ClickEventHandler + '"': '';

            var lst = [
                { Placeholder: "Button.ID", Data: button.ID },
                { Placeholder: "Button.Icon", Data: button.Icon },
                { Placeholder: "Button.Caption", Data: button.Caption },
                { Placeholder: "Button.Tooltip", Data: button.Tooltip },
                { Placeholder: "Button.ClickEvent", Data: sCallback }
            ];

            sHTML = DeveloperStudio.FormDesigner.ReplaceJSONTags(sHTML, lst);

            return sHTML;
        },

        ReplaceColumnWidthRatio: function(sTemplateHTML, column)
        {
            var col = { Placeholder: "Column.WidthRatio", Data: column.WidthRatio }
            var sHTML = DeveloperStudio.FormDesigner.ReplaceJSONTags(sTemplateHTML, [col]);
            return sHTML;
        },

        ReplaceJSONTags: function (sTemplateHTML, lstReplacements)
        {
            var sHTML = sTemplateHTML;

            lstReplacements.forEach(function (replacement) {
                sHTML = DeveloperStudio.FormDesigner.ReplaceJSONTag(sHTML, replacement);
            });

            return sHTML;
        },

        ReplaceJSONTag: function (sHTML, replacement)
        {
            sHTML = sHTML.replace("{{" + replacement.Placeholder + "}}", replacement.Data);

            return sHTML;
        }
    },

    //#endregion Form Designer Render JSON Feb 2021

    // 02 Aug 2023
    TweakUI: function()
    {
        // These buttons overflow so prevent this
        var block = $('#DeveloperStudio-FilesBlock');
        var iWidth = block.width();
        if(iWidth <= 273)
        {
            $('#DeveloperStudio-FolderMenu-Text').hide();
            $('#DeveloperStudio-FileMenu-Text').hide();

            if(iWidth <= 188)
            {
                $('#DeveloperStudio-FilesBlock-Text').text("Files");
            }
        }
    }

};  // DeveloperStudio

$(document).ready(function ()
{
    debugger;

    DeveloperStudio.Load();
});
