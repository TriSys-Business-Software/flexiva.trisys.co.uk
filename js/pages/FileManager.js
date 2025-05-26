var FileManager =
{
	FolderTreeID: "fileManager-Folders",			// The left hand folder view
	GridID: "fileManager-Files",					// The right hand file view
	RootPathForTreeView: "TriSys:\\",				// The treeview needs a path
	PersistedPathCookie: "FileManager-PersistedPath",

	Load: function()
	{
		// Size the views
		var iFudgeFactor = 180;	//305;
		var lHeight = $(window).height() - iFudgeFactor;
		$('#fileManager-Splitter-vertical').height(lHeight).css('border-radius', '8px');

		iFudgeFactor = 110;
		lHeight = lHeight - iFudgeFactor;
		$('#fileManager-Folders-Container').height(lHeight);
		$('#folder-pane').height(lHeight);

		FileManager.CalculateFilesPerPage(lHeight);

		$("#fileManager-Splitter-vertical").kendoSplitter({
			orientation: "vertical",
			panes: [
				{ collapsible: false }
			]
		});

		$("#fileManager-Splitter-horizontal").kendoSplitter({
			panes: [
				{ collapsible: false, size: "350px" },
				{ collapsible: false }
			]
		});

		FileManager.LoadFolders();

		TriSysSDK.FormMenus.DrawGridMenu("FileManagerGridMenu", FileManager.GridID);
	},

	LoadFolders: function()
	{
		// 1. Old and Slow - cache all in memory
		//TriSysApex.Pages.FileManagerForm.startFolderPopulation(sTreeID);

		// 2. KendoUI control demonstrating custom loading
		//FileManager.KendoUIControlExperiment(sTreeID);

		// 3. Our own Web API which is optimised for virtual on-demand loading

		// After first population, highlight the last folder which we were viewing
		FileManager._FolderPopulatedCallbacks.push(FileManager.AfterInitialTreePopulation);

		FileManager.TriSysWebAPIPopulation(FileManager.FolderTreeID);
	},

	AfterInitialTreePopulation: function(sFolder)
	{
		var sPersistedPath = TriSysAPI.Cookies.getCookie(FileManager.PersistedPathCookie);
		if(!sPersistedPath)
			return;

		// For example focus on G:\WinSCP Testing\Master\Test directory\Sub Folders
		// Which is	\\t-s-...\xyz$\WinSCP Testing\Master\Test directory\Sub Folders
		var sDisplayRelativePath = FileManager.RelativePathFromUNCPath(sPersistedPath);
		var sRootPath = FileManager.RootPathFromUNCPath(sPersistedPath);
		var parts = sDisplayRelativePath.split("\\");
		FileManager._InitialTreePopulationPathParts = [];

		// Reconstitute all parts as full UNC paths
		var sFullFolderPath = '';
		parts.forEach(function(sFolderPart)
		{
			if(sFullFolderPath.length == 0)
				sFullFolderPath = sRootPath;
			else
				sFullFolderPath += '\\';

			sFullFolderPath += sFolderPart;
			FileManager._InitialTreePopulationPathParts.push(sFullFolderPath);
		});
		
		if(FileManager._InitialTreePopulationPathParts.length > 0)
		{

			// Strip first folder as we know that is now loaded
			var sFirstFolder = FileManager._InitialTreePopulationPathParts[0];

			// Recursive dynamic programming to handle virtual on-demand tree population with callbacks
			// Yes, I am a f***ing rocket scientist (of sorts!) ;-)
			var fnAfterPopulation = function(sThisFolder, bFirstFolder)
			{
				// sThisFolder = "\\server\drive\WinSCP Testing\\Master"
				var sFolderRelativePath = FileManager.RelativePathFromUNCPath(sThisFolder);
				var iNumberOfFolders = sFolderRelativePath.split("\\").length;

				if(iNumberOfFolders == FileManager._InitialTreePopulationPathParts.length)
				{
					if(bFirstFolder)
					{
						// We must highlight the first folder and force refresh of this selected folder
						FileManager.SelectTreeNodeWithFolderPath(sThisFolder, true);
					}
					else
						FileManager.FolderSelected(sThisFolder);
				}
				else
				{
					if(!bFirstFolder)
						sThisFolder = FileManager._InitialTreePopulationPathParts[iNumberOfFolders];

					// Break free from this thread to add successive event handlers
					setTimeout(function()
					{
						FileManager._FolderPopulatedCallbacks.push(fnAfterPopulation);

						// Force refresh of this selected folder
						FileManager.SelectTreeNodeWithFolderPath(sThisFolder, true);

					}, 10);					
				}
			};

			// Break free from this thread to add successive event handlers
			setTimeout(function()
			{
				fnAfterPopulation(sFirstFolder, true);
			}, 10);
		}
	},
	_InitialTreePopulationPathParts: [],

	TriSysWebAPIPopulation: function(sTreeID)
	{
		var homogeneous = new kendo.data.HierarchicalDataSource({
            transport: {
                read: function (options)
				{
					var sFolder = options.data.FullPath;

					if(!sFolder)
					{
						// Add the root G:\ drive and force a population of sub nodes
						var gDriveFolders = [
							{ 
								Name: FileManager.RootPathForTreeView,
								FullPath: FileManager.RootPathForTreeView,
								SubFolders: ['to be dynamically loaded'],
								spriteCssClass: "rootfolder"
							}
						];
						options.success(gDriveFolders);

						var fnForceExpansion = function()
						{
							var treeView = $("#" + sTreeID).data("kendoTreeView");
							// Select root
							treeView.select(".k-first");
							// Expand all loaded items
							treeView.expand(".k-item");
						};
						setTimeout(fnForceExpansion, 100);
						return;
					}
					else if(sFolder == FileManager.RootPathForTreeView)
						sFolder = null;

					var bRecursive = true;		// Only 1 level needed in Web API. See RecursionDepth: 1 below

					var dataPacket = {
						RootFolder: sFolder,
						Recursion: bRecursive,
						RecursionDepth: 1
					};

					var payloadObject = {};

					payloadObject.URL = 'Folders/SubFolders';

					payloadObject.OutboundDataPacket = dataPacket;

					payloadObject.InboundDataFunction = function (CFolders)
					{
						//TriSysApex.UI.HideWait();

						if(CFolders)
						{
							if(CFolders.Success)
							{
								var sGDrive = CFolders.RootDriveLetter;
								if(sGDrive)
									FileManager.SetRootText(sGDrive);

								if(CFolders.Folders)
								{
									CFolders.Folders.forEach(function(folder)
									{
										folder.spriteCssClass = "folder";
									});
								}

								// notify the data source that the request succeeded
								options.success(CFolders.Folders);

								// Raise our own event so that we can now locate any nodes once redrawn
								FileManager.FolderPopulated(sFolder);
							}
						}

						return true;
					};

					payloadObject.ErrorHandlerFunction = function (request, status, error)
					{
						//TriSysApex.UI.HideWait();
						//TriSysApex.UI.ErrorHandlerRedirector('FileManagerForm.startFolderPopulation: ', request, status, error);

						// notify the data source that the request failed
						options.error(status);
					};

					//TriSysApex.UI.ShowWait(null, "Traversing file system...");

					TriSysAPI.Data.PostToWebAPI(payloadObject);
				}
			},
            schema: {
                model: {
                    id: "FullPath",
                    hasChildren: function(folder) {
						var bFolders = (folder.SubFolders);
						return bFolders;
					}
                }
            }
        });

		var fnSelectFolderFromDataItem = function(dataItem)
		{
            var sFullPath = dataItem.FullPath;

			var sDisplayPath = (sFullPath == FileManager.RootPathForTreeView ? '' : sFullPath);

			// Display the full path and files in the selected folder
			FileManager.FolderSelected(sDisplayPath);
		};

		var fnSelectFolder = function(e)
		{
			var dataItem = this.dataItem(e.node);
            if (!dataItem)
				return;

            fnSelectFolderFromDataItem(dataItem);
		};

		var fnExpandFolder = function(e)
		{
			var expandedNode = e.node;
			this.select(expandedNode);

			//fnSelectFolder();
			var dataItem = this.dataItem(expandedNode);
            if (!dataItem)
				return;

            fnSelectFolderFromDataItem(dataItem);
		};

        $("#" + sTreeID).kendoTreeView({
            loadOnDemand: true,
            dataSource: homogeneous,
            dataTextField: "Name",
			select: fnSelectFolder,
			expand: fnExpandFolder
        });
	},

	RootPathFromUNCPath: function(sUNCPath)
	{
		var parts = sUNCPath.split("\\");
		var sRootPath = '\\\\' + parts[2] + '\\' + parts[3] + '\\';		// e.g. \\t-s-e01-001.trisysglobal.net\wdOpusNet$\
		return sRootPath;
	},

	RelativePathFromUNCPath: function(sUNCPath)
	{
		var parts = sUNCPath.split("\\");
		var sDisplayRelativePath = '';
		for(var i = 4; i < parts.length; i++)
		{
			if(sDisplayRelativePath.length > 0)
				sDisplayRelativePath += '\\';
			sDisplayRelativePath += parts[i];
		}
		return sDisplayRelativePath;
	},

	FolderSelected: function(sDisplayPath)
	{
		// The display path is a full UNC. We need to split it
		var sDisplayRelativePath = FileManager.RelativePathFromUNCPath(sDisplayPath);

		// Display the full path and files in the selected folder
		$('#fileManager-Path').text(sDisplayRelativePath);

		// Preserve in cookies
		if(sDisplayPath)
			TriSysAPI.Cookies.setCookie(FileManager.PersistedPathCookie, sDisplayPath);

        // Start the asynchronous retrieval of the list of files from the server
        FileManager.RefreshFiles();
	},

	// When the Web API returns folder data, we can now take action e.g. find paths etc..
	FolderPopulated: function(sFolder)
	{
		FileManager._FolderPopulatedCallbacks.forEach(function(fnCallback)
		{
			fnCallback(sFolder);
		});

		// Always reset afterwards
		FileManager._FolderPopulatedCallbacks = [];
	},
	_FolderPopulatedCallbacks: [],

	GetRootText: function()
	{
		var treeView = $('#' + FileManager.FolderTreeID).data("kendoTreeView");
		var sText = treeView.text(".k-item:first"); 
		return sText;
	},

	SetRootText: function(sText)
	{
		$('#fileManager-Root').text(sText);
		var treeView = $('#' + FileManager.FolderTreeID).data("kendoTreeView");
		treeView.text(".k-item:first", sText); 
	},

	CurrentFolder: function()
	{
		var sFullPath = $('#fileManager-Path').text();
		return sFullPath;
	},

	GetCurrentFullPath: function()
	{
		var sDrive = $('#fileManager-Root').text();
		var sThisFolder = FileManager.CurrentFolder();
		return sDrive + sThisFolder;
	},

	RefreshCurrentFolder: function(bParent)
	{
		var sThisFolder = FileManager.CurrentFolder();

		// https://www.telerik.com/forums/force-reload-of-child-nodes
		try
		{
			var treeView = $('#' + FileManager.FolderTreeID).data("kendoTreeView");

			var selectedNode = treeView.select();
			var nodeItem = null;

			if(bParent)
			{
				if(selectedNode.length > 0)
				{
					nodeItem = selectedNode[0];
					selectedNode = nodeItem.parentNode;
				}
			}			

			var selectedDataItem = treeView.dataItem(selectedNode);

			treeView.collapse(selectedNode);
			selectedDataItem.loaded(false);
			selectedDataItem.load();

			// Wait a short time for this to re-populate
			setTimeout(function()
			{
				treeView.expand(selectedNode);
			}, 500);
		}
		catch(ex)
		{
			
		}
	},

	AddFolder: function()
	{
		var sThisFolder = FileManager.CurrentFolder();
		var fnAddFolder = function(bYes, sReasonIfNo)
		{
			var sMessage = null;
			if(!bYes)
			{
				sMessage = "You are unable to add a folder to " + sThisFolder + " because " + sReasonIfNo;
				TriSysApex.UI.ShowMessage(sMessage, "Add Folder");
			}
			else
			{
				var fnAddNewFolder = function (sNewName)
				{
					setTimeout(function() { FileManager.AddFolderConfirmation(sThisFolder, sNewName); }, 50);
					return true;
				};
				sMessage = "Add Folder";
				var options = { 
					Label: "New Folder Name",
					Value: "",
					Instructions: "Parent Folder: " + sThisFolder
				};
				TriSysApex.ModalDialogue.New.Popup(sMessage, "gi-plus", fnAddNewFolder, options);
			}
		};

		FileManager.DetermineIfFolderCanBeAdded(sThisFolder, fnAddFolder);
	},

	AddFolderConfirmation: function(sFolder, sNewName)
	{
		if(!sNewName)
		{
			TriSysApex.UI.ShowMessage("Please provide a new name for this folder.");
			return;
		}

		var fnConfirm = function()
		{
			var fnAddFolderCallback = function(bSuccess, sError)
			{
				if(bSuccess)
				{
					// Force refresh of the current folder after add
					// This code took 4 hours on a Saturday afternoon (01/09/18) to figure out
					var treeView = $("#" + FileManager.FolderTreeID).data("kendoTreeView");
					var selectedNode = treeView.select();
					var selectedDataItem = treeView.dataItem(selectedNode);
					selectedDataItem.hasChildren = true;
					FileManager.RefreshCurrentFolder(false);					
				}
				else
					TriSysApex.UI.errorAlert(sError, "Add Folder Error: " + sError);
			};

			setTimeout(function() 
			{ 
				FileManager.AddFolderViaWebAPI(sFolder, sNewName, false, fnAddFolderCallback);

			}, 50);

			return true;
		};

		var sDisplayFolder = FileManager.GetCurrentFullPath() + "\\" + sNewName;
		var sMessage = "Are you sure that you wish to add the following folder? <br />" + sDisplayFolder;
        TriSysApex.UI.questionYesNo(sMessage, "Add Folder", "Yes", fnConfirm, "No");
	},

	RenameFolder: function()
	{
		var sThisFolder = FileManager.CurrentFolder();
		var sMessage = null;
			
		// Cannot rename root
		if(sThisFolder.length == 0)
		{
			sMessage = "You cannot rename the root folder.";
			TriSysApex.UI.ShowMessage(sMessage, "Rename Folder");
			return;
		}
		
		var fnRenameFolder = function(bYes, sReasonIfNo)
		{
			if(!bYes)
			{
				sMessage = "You are unable to rename " + sThisFolder + " because " + sReasonIfNo;
				TriSysApex.UI.ShowMessage(sMessage, "Rename Folder");
			}
			else
			{
				var fnRenameThisFolder = function (sNewName)
				{
					setTimeout(function() { FileManager.RenameFolderConfirmation(sThisFolder, sNewName); }, 50);
					return true;
				};
				sMessage = "Rename Folder";
				var sName = TriSysSDK.Controls.FileManager.GetFileNameFromPath(sThisFolder);
				var options = { 
					Label: "New Folder Name",
					Value: sName,
					Instructions: "Rename: " + sThisFolder
				};
				TriSysApex.ModalDialogue.New.Popup(sMessage, "gi-font", fnRenameThisFolder, options);
			}
		};

		FileManager.DetermineIfFolderCanBeRenamed(sThisFolder, fnRenameFolder);
	},

	RenameFolderConfirmation: function(sFolder, sNewName)
	{
		if(!sNewName)
		{
			TriSysApex.UI.ShowMessage("Please provide a new name for this folder.");
			return;
		}

		var fnConfirm = function()
		{
			var fnRenameFolderCallback = function(bSuccess, sError)
			{
				if(bSuccess)
				{
					// Force refresh of the parent folder after rename
					FileManager.RefreshCurrentFolder(true);
				}
				else
					TriSysApex.UI.errorAlert(sError, "Rename Folder Error: " + sError);
			};

			setTimeout(function() 
			{ 
				FileManager.RenameFolderViaWebAPI(sFolder, sNewName, false, fnRenameFolderCallback);

			}, 50);

			return true;
		};

		var sDisplayFolder = FileManager.GetRootText() + sFolder;
		var sFullPath = TriSysSDK.Controls.FileManager.GetFolderPathFromFile(sDisplayFolder, '\\') + sNewName;
		var sMessage = "Are you sure that you wish to rename the following? <br />" + sDisplayFolder + "<br />to<br />" + sFullPath;
        TriSysApex.UI.questionYesNo(sMessage, "Rename Folder", "Yes", fnConfirm, "No");
	},

	DeleteFolder: function()
	{
		var sThisFolder = FileManager.CurrentFolder();

		var fnDeleteFolder = function(bYes, sReasonIfNo)
		{
			if(!bYes)
			{
				var sMessage = "You are unable to delete " + sThisFolder + " because " + sReasonIfNo;
				TriSysApex.UI.ShowMessage(sMessage, "Delete Folder");
			}
			else
			{
				setTimeout(function() { FileManager.DeleteFolderConfirmation(sThisFolder); }, 50);
				return true;
			}
		};

		FileManager.DetermineIfFolderCanBeDeleted(sThisFolder, fnDeleteFolder);
	},

	// http://blog.codebeastie.com/kendo-tree-select-and-show/
	SelectTreeNodeWithFolderPath: function (sFolderPath, bExpand) 
	{  
		var treeView = $('#' + FileManager.FolderTreeID).data("kendoTreeView");
		var dataitem = treeView.dataSource.get(sFolderPath);
		if (dataitem) 
		{
			var node = treeView.findByUid(dataitem.uid);
			if (node) 
			{
				treeView.select(node);

				FileManager.FolderSelected(sFolderPath);

				if(bExpand)
				{
					var selectedNode = treeView.select();
					//var selectedDataItem = treeView.dataItem(selectedNode);

					//treeView.collapse(selectedNode);
					//selectedDataItem.loaded(false);
					//selectedDataItem.load();

					treeView.expand(selectedNode);
				}

				//scrolldiv = treeView.element.closest(".k-scrollable");
				//if (scrolldiv) 
				//{
				//	scrolldiv.scrollTo(node,500);
				//}
				return true;
			}
		}
		return false;
	},

	DeleteFolderConfirmation: function(sFolder)
	{
		if(!sFolder)
			return;				

		var fnConfirm = function()
		{
			var fnDeleteFolderCallback = function(bSuccess, sError)
			{
				if(bSuccess)
				{
					// Force refresh of the parent folder after deletion
					var sParentFolderPath = TriSysSDK.Controls.FileManager.GetFolderPathFromFile(sFolder, '\\');
					if(sParentFolderPath)
					{
						if(sParentFolderPath.lastIndexOf("\\") == (sParentFolderPath.length - 1))	// Strip trailing \
							sParentFolderPath = sParentFolderPath.substring(0, sParentFolderPath.length - 1);

						// We create a dynamic callback which will fire when the tree refreshes
						var fnFocusOnParentNode = function(sFolderPath)
						{
							FileManager.SelectTreeNodeWithFolderPath(sParentFolderPath);
						};
						FileManager._FolderPopulatedCallbacks.push(fnFocusOnParentNode);
					}

					// Force refresh of the parent folder after deletion
					FileManager.RefreshCurrentFolder(true);
				}
				else
					TriSysApex.UI.errorAlert(sError, "Delete Folder Error: " + sError);
			};

			setTimeout(function() 
			{ 
				FileManager.DeleteFolderViaWebAPI(sFolder, false, fnDeleteFolderCallback);

			}, 50);
		
			return true;
		};

		var sMessage = "Are you sure that you wish to delete the following folder? <br />" + FileManager.GetCurrentFullPath() +
			"<br /><br />WARNING: All folders and files beneath this folder will also be deleted and can not be retrieved.";
        TriSysApex.UI.questionYesNo(sMessage, "Delete Folder", "Yes", fnConfirm, "No");
	},

	RefreshFiles: function()
	{
		// Display the full path and files in the selected folder
		var sFullPath = FileManager.CurrentFolder();

        // Start the asynchronous retrieval of the list of files from the server
        TriSysApex.Pages.FileManagerForm.startFolderFilesPopulation(sFullPath, FileManager.GridID);

		// Drag & Drop files
		setTimeout(function () 
		{ 					
			// Let the files grid accept file drag and drop
			FileManager.DragAndDropFileHandler();

		}, 1000);	
	},

	EditFile: function () 
	{
		var lst = FileManager.SelectedFilePaths();
		if (lst.length == 0 || lst.length > 1)
		{
			TriSysApex.UI.ShowMessage("Please select only one file to edit at a time.");
			return;
		}

		var sFilePath = lst[0];
		TriSysApex.Pages.FileManagerForm.FileOpenDrillDown(FileManager.GetRootText() + sFilePath);
	},

	CopyFile: function () 
	{ 
		var lst = FileManager.SelectedFilePaths();
		if (lst.length == 0 || lst.length > 1)
		{
			TriSysApex.UI.ShowMessage("Please select only one file to copy.");
			return;
		}

		var sFilePath = lst[0];

		var fnCopyFile = function(bYes, sReasonIfNo)
		{
			var sMessage = null;
			if(!bYes)
			{
				sMessage = "You are unable to copy " + sFilePath + " because " + sReasonIfNo;
				TriSysApex.UI.ShowMessage(sMessage, "Copy File");
			}
			else
			{
				sMessage = "Copy File";
				var sName = TriSysSDK.Controls.FileManager.GetFileNameFromPath(sFilePath);

				// Strip file suffix
				var sSuffix = "." + TriSysApex.Pages.FileManagerForm.FileSuffix(sName);
				sName = sName.replace(sSuffix, "");

				var fnCopyThisFile = function (sNewName)
				{
					if(sNewName)
					{
						sNewName = sNewName.replace(sSuffix, "") + sSuffix;
						setTimeout(function() { FileManager.CopyFileConfirmation(sFilePath, sNewName); }, 50);
					}
					return true;
				};

				var options = { 
					Label: "Copy File",
					Value: sName,
					Instructions: "Copy: " + sFilePath
				};
				TriSysApex.ModalDialogue.New.Popup(sMessage, "gi-font", fnCopyThisFile, options);
			}
		};

		FileManager.DetermineIfFileCanBeCopied(sFilePath, fnCopyFile);
	},

	AddFile: function () 
	{
		// Popup file selection dialogue to upload a local file or to choose one from a cloud storage service e.g. dropbox
		TriSysSDK.Controls.FileManager.FindFileUpload("Add File", FileManager.UploadFile);
	},

	UploadFile: function (sFilePath) 
	{
		setTimeout(function () 
		{ 
			var sCopyToFolder = FileManager.CurrentFolder();

			var fnUploadAfterConfirmation = function()
			{
				FileManager.MoveUploadedFileReferenceDocument(sFilePath, sCopyToFolder); 
			};

			FileManager.OverwriteMultipleFileCheck([ sFilePath ], sCopyToFolder, fnUploadAfterConfirmation);

		}, 50);

		return true;
	},

	RenameFile: function () 
	{ 
		var lst = FileManager.SelectedFilePaths();
		if (lst.length == 0 || lst.length > 1)
		{
			TriSysApex.UI.ShowMessage("Please select only one file to rename.");
			return;
		}

		var sFilePath = lst[0];
		
		var fnRenameFile = function(bYes, sReasonIfNo)
		{
			var sMessage = null;
			if(!bYes)
			{
				sMessage = "You are unable to rename " + sFilePath + " because " + sReasonIfNo;
				TriSysApex.UI.ShowMessage(sMessage, "Rename File");
			}
			else
			{
				sMessage = "Rename File";
				var sName = TriSysSDK.Controls.FileManager.GetFileNameFromPath(sFilePath);

				// Strip file suffix
				var sSuffix = "." + TriSysApex.Pages.FileManagerForm.FileSuffix(sName);
				sName = sName.replace(sSuffix, "");

				var fnRenameThisFile = function (sNewName)
				{
					if(sNewName)
					{
						sNewName = sNewName.replace(sSuffix, "") + sSuffix;
						setTimeout(function() { FileManager.RenameFileConfirmation(sFilePath, sNewName); }, 50);
					}
					return true;
				};

				var options = { 
					Label: "New File Name",
					Value: sName,
					Instructions: "Rename: " + sFilePath
				};
				TriSysApex.ModalDialogue.New.Popup(sMessage, "gi-font", fnRenameThisFile, options);
			}
		};

		FileManager.DetermineIfFileCanBeRenamed(sFilePath, fnRenameFile);
	},

	DeleteFile: function ()
	{
		var lst = FileManager.SelectedFilePaths();
		if (lst.length == 0)
		{
			TriSysApex.UI.ShowMessage("Please select one or more files to delete.");
			return;
		}

		var sFiles = '';
		lst.forEach(function(sFilePath)
		{
			if (sFiles.length > 1)
				sFiles += ", ";

			sFiles += sFilePath;
		});

		var fnDeleteFiles = function(bYes, sReasonIfNo)
		{
			if(!bYes)
			{
				var sMessage = "You are unable to delete " + sFiles + " because " + sReasonIfNo;
				TriSysApex.UI.ShowMessage(sMessage, "Delete File(s)");
			}
			else
			{
				setTimeout(function() { FileManager.DeleteFilesConfirmation(lst, sFiles); }, 50);
				return true;
			}
		};

		FileManager.DetermineIfFilesCanBeDeleted(lst, fnDeleteFiles);
	},

    SelectedFilePaths: function()		// List
    {
		var sGridID = 'fileManager-Files';
		var lst = TriSysSDK.Grid.GetSelectedMultipleRowsFromGrid(sGridID, "FullPath");
		if (!lst)
			lst = [];

		return lst;
    },

	CalculateFilesPerPage: function (iGridBlockHeight)
	{
		var iLineHeight	= 38;
		FileManager._FilesPerPage = iGridBlockHeight / iLineHeight;
	},

	FilesPerPage: function ()
	{
		return FileManager._FilesPerPage;
	},
	_FilesPerPage: 10,

	DetermineIfFolderCanBeRenamed: function(sFolderPath, fnRenameFolderCallback)
	{
		var bDeterminationOnly = true;
		FileManager.RenameFolderViaWebAPI(sFolderPath, null, bDeterminationOnly, fnRenameFolderCallback);
	},

	RenameFolderViaWebAPI: function(sFolderPath, sNewName, bDeterminationOnly, fnRenameFolderCallback)
	{
		var CRenameFolderRequest = {
			FullPath: sFolderPath,
			NewName: sNewName,
			DeterminationOnly: bDeterminationOnly
		};

		var payloadObject = {};

		payloadObject.URL = 'Folders/RenameFolder';

		payloadObject.OutboundDataPacket = CRenameFolderRequest;

		payloadObject.InboundDataFunction = function (CRenameFolderResponse)
		{
			if(!bDeterminationOnly)
				TriSysApex.UI.HideWait();

			if(CRenameFolderResponse)
			{
				fnRenameFolderCallback(CRenameFolderResponse.Success, CRenameFolderResponse.ErrorMessage);
			}
			else
				TriSysApex.UI.errorAlert('FileManagerForm.RenameFolderViaWebAPI: no response.');
		};

		payloadObject.ErrorHandlerFunction = function (request, status, error)
		{
			if(!bDeterminationOnly)
				TriSysApex.UI.HideWait();
			TriSysApex.UI.errorAlert('FileManagerForm.RenameFolderViaWebAPI: ' + status + ": " + error + ". responseText: " + request.responseText);
		};

		if(!bDeterminationOnly)
			TriSysApex.UI.ShowWait(null, "Renaming Folder...");

		TriSysAPI.Data.PostToWebAPI(payloadObject);
	},

	DetermineIfFolderCanBeDeleted: function(sFolderPath, fnDeleteFolderCallback)
	{
		var bDeterminationOnly = true;
		FileManager.DeleteFolderViaWebAPI(sFolderPath, bDeterminationOnly, fnDeleteFolderCallback);
	},

	DeleteFolderViaWebAPI: function(sFolderPath, bDeterminationOnly, fnDeleteFolderCallback)
	{
		var CDeleteFolderRequest = {
			FullPath: sFolderPath,
			DeterminationOnly: bDeterminationOnly
		};

		var payloadObject = {};

		payloadObject.URL = 'Folders/DeleteFolder';

		payloadObject.OutboundDataPacket = CDeleteFolderRequest;

		payloadObject.InboundDataFunction = function (CDeleteFolderResponse)
		{
			if(!bDeterminationOnly)
				TriSysApex.UI.HideWait();

			if(CDeleteFolderResponse)
			{
				fnDeleteFolderCallback(CDeleteFolderResponse.Success, CDeleteFolderResponse.ErrorMessage);
			}
			else
				TriSysApex.UI.errorAlert('FileManagerForm.DeleteFolderViaWebAPI: no response.');
		};

		payloadObject.ErrorHandlerFunction = function (request, status, error)
		{
			if(!bDeterminationOnly)
				TriSysApex.UI.HideWait();
			TriSysApex.UI.errorAlert('FileManagerForm.DeleteFolderViaWebAPI: ' + status + ": " + error + ". responseText: " + request.responseText);
		};

		if(!bDeterminationOnly)
			TriSysApex.UI.ShowWait(null, "Deleting Folder...");

		TriSysAPI.Data.PostToWebAPI(payloadObject);
	},

	DetermineIfFolderCanBeAdded: function(sFolderPath, fnAddFolderCallback)
	{
		var bDeterminationOnly = true;
		FileManager.AddFolderViaWebAPI(sFolderPath, null, bDeterminationOnly, fnAddFolderCallback);
	},

	AddFolderViaWebAPI: function(sFolderPath, sNewName, bDeterminationOnly, fnAddFolderCallback)
	{
		var CAddFolderRequest = {
			FullPath: sFolderPath,
			NewName: sNewName,
			DeterminationOnly: bDeterminationOnly
		};

		var payloadObject = {};

		payloadObject.URL = 'Folders/AddFolder';

		payloadObject.OutboundDataPacket = CAddFolderRequest;

		payloadObject.InboundDataFunction = function (CAddFolderResponse)
		{
			if(!bDeterminationOnly)
				TriSysApex.UI.HideWait();

			if(CAddFolderResponse)
			{
				fnAddFolderCallback(CAddFolderResponse.Success, CAddFolderResponse.ErrorMessage);
			}
			else
				TriSysApex.UI.errorAlert('FileManagerForm.AddFolderViaWebAPI: no response.');
		};

		payloadObject.ErrorHandlerFunction = function (request, status, error)
		{
			if(!bDeterminationOnly)
				TriSysApex.UI.HideWait();
			TriSysApex.UI.errorAlert('FileManagerForm.AddFolderViaWebAPI: ' + status + ": " + error + ". responseText: " + request.responseText);
		};

		if(!bDeterminationOnly)
			TriSysApex.UI.ShowWait(null, "Adding Folder...");

		TriSysAPI.Data.PostToWebAPI(payloadObject);
	},

	// After upload file, check if file exists on server and if so prompt user to overwrite
	// or when dragging and dropping multiple files, check for any duplicates
	OverwriteMultipleFileCheck: function(lstFiles, sCopyToFolder, fnUploadAfterConfirmation)
	{
		var payloadObject = {};

        payloadObject.URL = "Files/Existence";

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
            TriSysApex.UI.ErrorHandlerRedirector('FileManager.OverwriteMultipleFileCheck: ', request, status, error);
        };

        TriSysApex.UI.ShowWait(null, "Validating Files...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
	},

	MoveUploadedFileReferenceDocument: function(sFilePath, sSubFolder, fnCallbackOnUpload)
    {
        var payloadObject = {};

        payloadObject.URL = "Files/MoveUploadedFileReferenceDocument";

        var CFileReferenceDocumentUpload = {
            UploadedFilePath: sFilePath,
            SubFolder: sSubFolder
        };

		payloadObject.OutboundDataPacket = CFileReferenceDocumentUpload;

        payloadObject.InboundDataFunction = function (CFileReferenceDocumentUploadReference)
        {
            TriSysApex.UI.HideWait();

            if (CFileReferenceDocumentUploadReference)
            {
                if (CFileReferenceDocumentUploadReference.Success)
                {
					if(fnCallbackOnUpload)
						fnCallbackOnUpload();
					else
					{
						// Simply refresh the list of files in this folder
						FileManager.RefreshFiles();
					}
                }
                else
                {
                    TriSysApex.UI.errorAlert(CFileReferenceDocumentUploadReference.ErrorMessage);
                }
            } else
            {
                // Something else has gone wrong!
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.ErrorHandlerRedirector('FileManager.MoveUploadedFileReferenceDocument: ', request, status, error);
        };

        var sName = TriSysSDK.Controls.FileManager.GetFileNameFromPath(sFilePath);
        TriSysApex.UI.ShowWait(null, "Uploading " + sName + "...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

	DetermineIfFilesCanBeDeleted: function(lstFiles, fnDeleteFilesCallback)
	{
		var bDeterminationOnly = true;
		FileManager.DeleteFileViaWebAPI(lstFiles, null, bDeterminationOnly, fnDeleteFilesCallback);
	},

	DeleteFilesConfirmation: function(lstFiles, sFiles)
	{
		var s = (lstFiles.length == 1 ? "" : "s");

		var fnConfirm = function()
		{
			var iDeletedCount = 0;
			var lstErrors = [];

			var fnDeleteFileCallback = function(bSuccess, sError)
			{
				iDeletedCount += 1;
				var bCompleted = (iDeletedCount == lstFiles.length);

				if(bSuccess)
				{
					// Force refresh of the current folder after deletion of all files
					if(bCompleted)
						FileManager.RefreshFiles();
				}
				else
					lstErrors.push(sError);

				if(bCompleted)
				{
					TriSysApex.UI.HideWait();

					if (lstErrors.length > 0)
					{
					    var sError = "One or more errors occurred:<br> &nbsp; <i>" + sError + "</i>";
					    TriSysApex.UI.ShowMessage(sError);
					}
				}
			};

			setTimeout(function() 
			{ 
				TriSysApex.UI.ShowWait(null, "Deleting " + lstFiles.length + " File" + s + "...");

				for (var i = 0; i < lstFiles.length; i++)
				{
					var sFilePath = lstFiles[i];

					FileManager.DeleteFileViaWebAPI(null, sFilePath, false, fnDeleteFileCallback);
				}

			}, 50);

			return true;
		};

		var sMessage = "Are you sure that you wish to delete " + lstFiles.length + " file" + s + "?";
        TriSysApex.UI.questionYesNo(sMessage, "Delete File" + s, "Yes", fnConfirm, "No");
	},

	DeleteFileViaWebAPI: function(lstFiles, sFilePath, bDeterminationOnly, fnDeleteFileCallback)
	{
		var payloadObject = {};

        payloadObject.URL = "Files/DeleteFile";

        var CDeleteFileRequest = {
			FileList: lstFiles,
            FilePath: sFilePath,
			DeterminationOnly: bDeterminationOnly
        };

        payloadObject.OutboundDataPacket = CDeleteFileRequest;

        payloadObject.InboundDataFunction = function (data)
        {
            var CDeleteFileResponse = data;

            if (CDeleteFileResponse)
            {
                fnDeleteFileCallback(CDeleteFileResponse.Success, CDeleteFileResponse.ErrorMessage);
            } 
			else
            {
                // Something else has gone wrong!
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.ErrorHandlerRedirector('FileManager.DeleteFileViaWebAPI: ', request, status, error);
        };

        TriSysAPI.Data.PostToWebAPI(payloadObject);
	},

	DetermineIfFileCanBeCopied: function(sFilePath, fnCopyFileCallback)
	{
		var bDeterminationOnly = true;
		FileManager.CopyFileViaWebAPI(sFilePath, null, bDeterminationOnly, fnCopyFileCallback);
	},

	CopyFileConfirmation: function(sFilePath, sNewName)
	{
		if(!sNewName)
		{
			TriSysApex.UI.ShowMessage("Please provide a new name for the copy of this file.");
			return;
		}

		var fnConfirm = function()
		{
			var fnCopyFileCallback = function(bSuccess, sError)
			{
				if(bSuccess)
				{
					// Force refresh of files after copy
					FileManager.RefreshFiles();
				}
				else
					TriSysApex.UI.errorAlert(sError, "Copy File Error: " + sError);
			};

			setTimeout(function() 
			{ 
				FileManager.CopyFileViaWebAPI(sFilePath, sNewName, false, fnCopyFileCallback);

			}, 50);

			return true;
		};

		var sFullPath = TriSysSDK.Controls.FileManager.GetFolderPathFromFile(sFilePath, '\\') + sNewName;
		var sMessage = "Are you sure that you wish to copy the following? <br />" + sFilePath + "<br />to<br />" + sFullPath;
        TriSysApex.UI.questionYesNo(sMessage, "Copy File", "Yes", fnConfirm, "No");
	},

	DetermineIfFileCanBeRenamed: function(sFilePath, fnRenameFileCallback)
	{
		var bDeterminationOnly = true;
		FileManager.RenameFileViaWebAPI(sFilePath, null, bDeterminationOnly, fnRenameFileCallback);
	},

	RenameFileConfirmation: function(sFilePath, sNewName)
	{
		if(!sNewName)
		{
			TriSysApex.UI.ShowMessage("Please provide a new name for this file.");
			return;
		}

		var fnConfirm = function()
		{
			var fnRenameFileCallback = function(bSuccess, sError)
			{
				if(bSuccess)
				{
					// Force refresh of files after rename
					FileManager.RefreshFiles();
				}
				else
					TriSysApex.UI.errorAlert(sError, "Rename File Error: " + sError);
			};

			setTimeout(function() 
			{ 
				FileManager.RenameFileViaWebAPI(sFilePath, sNewName, false, fnRenameFileCallback);

			}, 50);

			return true;
		};

		var sFullPath = TriSysSDK.Controls.FileManager.GetFolderPathFromFile(sFilePath, '\\') + sNewName;
		var sMessage = "Are you sure that you wish to rename the following? <br />" + sFilePath + "<br />to<br />" + sFullPath;
        TriSysApex.UI.questionYesNo(sMessage, "Rename File", "Yes", fnConfirm, "No");
	},

	RenameFileViaWebAPI: function(sFilePath, sNewName, bDeterminationOnly, fnRenameFileCallback)
	{
		var payloadObject = {};

        payloadObject.URL = "Files/RenameFile";

        var CFileRenameRequest = {
            FullPath: sFilePath,
            NewName: sNewName,
			DeterminationOnly: bDeterminationOnly
        };

		payloadObject.OutboundDataPacket = CFileRenameRequest;

        payloadObject.InboundDataFunction = function (CFileRenameResponse)
        {
            TriSysApex.UI.HideWait();

            if (CFileRenameResponse)
            {
                fnRenameFileCallback(CFileRenameResponse.Success, CFileRenameResponse.ErrorMessage);
            } 
			else
            {
                // Something else has gone wrong!
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.ErrorHandlerRedirector('FileManager.RenameFileViaWebAPI: ', request, status, error);
        };

        var sName = TriSysSDK.Controls.FileManager.GetFileNameFromPath(sFilePath);
        TriSysApex.UI.ShowWait(null, "Renaming " + sName + "...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
	},

	CopyFileViaWebAPI: function(sFilePath, sNewName, bDeterminationOnly, fnCopyFileCallback)
	{
		var payloadObject = {};

        payloadObject.URL = "Files/CopyFile";

        var CFileCopyRequest = {
            FullPath: sFilePath,
            NewName: sNewName,
			DeterminationOnly: bDeterminationOnly
        };

		payloadObject.OutboundDataPacket = CFileCopyRequest;

        payloadObject.InboundDataFunction = function (CFileCopyResponse)
        {
            TriSysApex.UI.HideWait();

            if (CFileCopyResponse)
            {
                fnCopyFileCallback(CFileCopyResponse.Success, CFileCopyResponse.ErrorMessage);
            } 
			else
            {
                // Something else has gone wrong!
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.ErrorHandlerRedirector('FileManager.CopyFileViaWebAPI: ', request, status, error);
        };

        var sName = TriSysSDK.Controls.FileManager.GetFileNameFromPath(sFilePath);
        TriSysApex.UI.ShowWait(null, "Copying " + sName + "...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
	},

	// Called after every grid population?
	DragAndDropFileHandler: function()
	{
		// Our own file upload handler
        var obj = $("#" + FileManager.GridID);

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
			FileManager.PopDraggedFilesOffStackAndUpload(lstFiles);
        });
	},

	PopDraggedFilesOffStackAndUpload: function(lstFiles)
	{
		if(!lstFiles)
			return;
		if(lstFiles.length == 0)
			return;

		var sCopyToFolder = FileManager.CurrentFolder();

		var fnConfirmUpload = function()
		{
			var iFileUploadedCount = 0;
		
			var fnAfterUpload = function()
			{
				iFileUploadedCount += 1;
	
				if(iFileUploadedCount == lstFiles.length)
					FileManager.RefreshFiles();
			};

			var fnSendFileToServer = function(sFilePath)
			{
				// The callback when the file has been uploaded
				var fnCallbackToMoveUploadedFile = function (myUploadedFile)
				{
					FileManager.MoveUploadedFileReferenceDocument(myUploadedFile, sCopyToFolder, fnAfterUpload);
				};

				// Upload the file through the standard route
				TriSysSDK.Controls.FileManager.UploadFile(sFilePath, fnCallbackToMoveUploadedFile);
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
		FileManager.OverwriteMultipleFileCheck(lstFileNames, sCopyToFolder, fnConfirmUpload);
	},

	// Fired if our office editor has edited a document which may be displayed on this form.
	FileUpdated: function(sFilePath)
	{
		// Strip off file name
		var parts = sFilePath.split("\\");
		var sFileOnly = parts[parts.length - 1].toLowerCase();

		// Get all files in grid and if we are there, simply refresh list
        var gridData = TriSysSDK.Grid.ReadGridContents(FileManager.GridID);
		if(!gridData)
			return;

		var gridRows = gridData.rows;

        for (var iRow = 0; iRow < gridRows.length; iRow++)       
        {
            var row = gridRows[iRow];

            var sName = row.Name.toLowerCase();               

			if(sName == sFileOnly)
			{
				FileManager.RefreshFiles();
				return;
			}
		}
	}
};

$(document).ready(function () {
	FileManager.Load();
});
