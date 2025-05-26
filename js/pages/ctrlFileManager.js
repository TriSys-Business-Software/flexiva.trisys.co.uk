var ctrlFileManager =
{
	CanvasID: 'ctrlFileManager-Canvas',
	FolderType: "CFolder",

	// An array of settings indexed by the sID of the host control id
	_Instances:
	{
		List: [],

		Add: function(sID, instance)
		{
			for(var i = ctrlFileManager._Instances.List.length - 1; i >= 0; i--)
			{
				var anInstance = ctrlFileManager._Instances.List[i];
				if(anInstance.ID == sID)
					ctrlFileManager._Instances.List.splice(i, 1);
			}

			var myInstance = { ID: sID, Instance: instance };
			ctrlFileManager._Instances.List.push(myInstance);
		},

		Get: function(sID)
		{
			var myInstance = null;
			ctrlFileManager._Instances.List.forEach(function(anInstance)
			{
				if(anInstance.ID == sID)
					myInstance = anInstance.Instance;
			});
			return myInstance;
		}
	},

	Load: function(sID, instance)
	{		
		// Record this instance indexed by DOM ID to allow multiple
		ctrlFileManager._Instances.Add(sID, instance);

		// Rename this canvas in case of multiple versions in-memory
		var sSuffix = '-' + sID;
		var sFolderTreeID = sID;	// ctrlFileManager.CanvasID + sSuffix;
		$('#' + ctrlFileManager.CanvasID).attr("id", sFolderTreeID);

		// Dynamic CSS to show folders and file icons
		// Could not get this to work so had to hard code in ctrlFileManager.html!!!
		//$('#' + sFolderTreeID + ' .k-sprite').css('background-image', 'url("images/trisys/file-manager/treeview-sprite.png")');

		ctrlFileManager.LoadFolders(sFolderTreeID);		

		// Drag & Drop files
		setTimeout(function () 
		{ 					
			// Let the tree accept file drag and drop
			ctrlFileManager.DragAndDropFileHandler(sFolderTreeID);

		}, 1000);
	},

	LoadFolders: function(sFolderTreeID)
	{
		// After first population, highlight the last folder which we were viewing
		var fnAfterInitialTreePopulation = function(sFolder)
		{
			var myInstance = ctrlFileManager._Instances.Get(sFolderTreeID);
			ctrlFileManager.AfterInitialTreePopulation(sFolder, sFolderTreeID, myInstance);
		};
		ctrlFileManager._FolderPopulatedCallbacks.push(fnAfterInitialTreePopulation);

		ctrlFileManager.TriSysWebAPIPopulation(sFolderTreeID);
	},

	AfterInitialTreePopulation: function(sFolder, sFolderTreeID, myInstance)
	{
		// Persistence specified by .AutoSelectFilePath property
		if(myInstance && myInstance.AutoSelectFilePath)
		{
			// Highlight this file in the file manager
			ctrlFileManager.SelectTreeNodeWithFilePath(sFolderTreeID, myInstance.AutoSelectFilePath, { ForceLoad: true, ExpandNode: myInstance.AutoSelectAndExpandFolder });
		}
	},
	
	TriSysWebAPIPopulation: function(sTreeID)
	{
		var myInstance = ctrlFileManager._Instances.Get(sTreeID);

		var homogeneous = new kendo.data.HierarchicalDataSource({
            transport: {
                read: function (options)
				{
					var sFolder = options.data.FullPath;

					if(!sFolder)
					{
						// Add the root drive and force a population of sub nodes
						var gDriveFolders = [
							{ 
								Name: myInstance.RootPathForTreeView,
								FullPath: myInstance.RootPathForTreeView,
								TreeViewType: ctrlFileManager.FolderType,
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
					else if(sFolder == myInstance.RootPathForTreeView)
						sFolder = null;

					var bRecursive = true;		// Only 1 level needed in Web API. See RecursionDepth: 1 below

					var dataPacket = {
						RootFolder: sFolder,
						Recursion: bRecursive,
						RecursionDepth: 1
					};

					var payloadObject = {};

					payloadObject.URL = myInstance.WebAPIFunction;

					payloadObject.OutboundDataPacket = dataPacket;

					payloadObject.InboundDataFunction = function (CFolders)
					{
						//TriSysApex.UI.HideWait();

						if(CFolders)
						{
							if(CFolders.Success)
							{
								var sRootDrive = CFolders.RootDriveLetter;
								if(sRootDrive)
									ctrlFileManager.SetRootText(sTreeID, sRootDrive);

								var items = [];

								if(CFolders.Folders)
								{
									CFolders.Folders.forEach(function(folder)
									{
										folder.spriteCssClass = "folder";

										items.push(folder);
									});
								}

								if(CFolders.Files)
								{
									CFolders.Files.forEach(function(file)
									{
										file.spriteCssClass = "file";

										var sSuffix = TriSysApex.Pages.FileManagerForm.FileSuffix(file.FullPath);
										if (sSuffix)
										{
											switch (sSuffix.toLowerCase())
											{
												case 'html':
												case 'pdf':
												case 'txt':
												case 'json':
												case 'js':
													file.spriteCssClass = sSuffix;
													break;

											    case 'form':
											        file.spriteCssClass = 'json';
											        //file.iconCssClass = 'form-element';
											        break;

												case 'gif':
												case 'jpg':
												case 'jpeg':
												case 'png':
													file.spriteCssClass = 'image';
													break;

												case 'doc':
												case 'docx':
												case 'dot':
												case 'dotx':
													file.spriteCssClass = 'word';
													break;

												case 'xls':
												case 'xlsx':
												case 'csv':
													file.spriteCssClass = 'excel';
													break;

												case 'mp4':
												case 'mov':
												case 'mpg':
												case 'mpeg':
												case 'avi':
													file.spriteCssClass = 'movie';
													break;
											}
										}

										items.push(file);
									});
								}

								// notify the data source that the request succeeded
								options.success(items);

								// Raise our own event so that we can now locate any nodes once redrawn
								// This is important when we want to focus on a file when dynamically loading recusively
								ctrlFileManager.FolderPopulated(sFolder);
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
						var bFolders = folder.SubFolders;
						return bFolders;
					}
                }
            }
        });

		var fnSelectFolderFromDataItem = function(sTreeID, dataItem)
		{
            var sFullPath = dataItem.FullPath;

			var myInstance = ctrlFileManager._Instances.Get(sTreeID);
			if(!myInstance)
				return;		// All bets are off!

			var sDisplayPath = (sFullPath == myInstance.RootPathForTreeView ? '' : sFullPath);

			// Display the full path and files in the selected folder
			//ctrlFileManager.FolderSelected(sDisplayPath);
			//TriSysApex.Toasters.Info(sDisplayPath);

			// If a file, then fire into callback function
			if(myInstance.FileSelectionCallback && !dataItem.hasChildren)
				myInstance.FileSelectionCallback(sDisplayPath);
		};

		var fnSelectFolder = function(e, thisThing, sTreeID)
		{
			var dataItem = thisThing.dataItem(e.node);
            if (!dataItem)
				return;

            fnSelectFolderFromDataItem(sTreeID, dataItem);
		};

		var fnExpandFolder = function(e, thisThing, sTreeID)
		{
			var expandedNode = e.node;
			thisThing.select(expandedNode);

			var dataItem = thisThing.dataItem(expandedNode);
            if (!dataItem)
				return;

            fnSelectFolderFromDataItem(sTreeID, dataItem);
		};

        $("#" + sTreeID).kendoTreeView({
            loadOnDemand: true,
            dataSource: homogeneous,
            dataTextField: "Name",
			select: function(e) { fnSelectFolder(e, this, sTreeID); },
			expand: function(e) { fnExpandFolder(e, this, sTreeID); }
        });
	},

	GetRootText: function(sFolderTreeID)
	{
		var treeView = $('#' + sFolderTreeID).data("kendoTreeView");
		var sText = treeView.text(".k-item:first"); 
		return sText;
	},

	SetRootText: function(sFolderTreeID, sText)
	{
		var treeView = $('#' + sFolderTreeID).data("kendoTreeView");
		treeView.text(".k-item:first", sText); 

		//TriSysApex.Toasters.Info(sText);
	},

	// When the Web API returns folder data, we can now take action e.g. find paths etc..
	FolderPopulated: function(sFolder)
	{
		var iCallbackIndex = 0;
		ctrlFileManager._FolderPopulatedCallbacks.forEach(function(fnCallback)
		{
			fnCallback(sFolder);

			// Remove this one only
			ctrlFileManager._FolderPopulatedCallbacks.splice(0, 1);

			iCallbackIndex += 1;
		});

		// Always reset afterwards - NO! only 
		//ctrlFileManager._FolderPopulatedCallbacks = [];
	},
	_FolderPopulatedCallbacks: [],

	SelectTreeNodeWithFilePath: function(sFolderTreeID, sFilePath, options)
	{
		var bForceLoad = false, bExpandNode = false, bFireFileSelectionCallback = true;
		if(options)
		{
			bForceLoad = options.ForceLoad;
			bExpandNode = options.ExpandNode;
			if(!TriSysAPI.Operators.isEmpty(options.FireFileSelectionCallback))
				bFireFileSelectionCallback = options.FireFileSelectionCallback;
		}

		var treeView = $('#' + sFolderTreeID).data("kendoTreeView");
		var dataitem = treeView.dataSource.get(sFilePath);
		if (dataitem) 
		{
			var node = treeView.findByUid(dataitem.uid);
			if (node) 
			{
				treeView.select(node);

				if(bExpandNode)
					treeView.expand(node);
				else
				{
					if(!dataitem.hasChildren && bFireFileSelectionCallback)
					{
						// If a file, then fire into callback function for node selection
						var myInstance = ctrlFileManager._Instances.Get(sFolderTreeID);
						if(myInstance && myInstance.FileSelectionCallback)
							myInstance.FileSelectionCallback(sFilePath);
					}
				}

				return;
			}
		}

		if(bForceLoad)
		{
			// Expand all sub folder nodes recursively until either no files left to pull, or we find the specified file
			ctrlFileManager.DynamicallyLoadTreeUntilFileFound(sFolderTreeID, sFilePath, bExpandNode);
		}
	},

	// Called when we are trying to focus on a file after, say, adding it and reloading tree
	DynamicallyLoadTreeUntilFileFound: function(sFolderTreeID, sFilePath, bExpandNode)
	{
		// Enumerate through tree until we find the root node
		var sFolderSeparator = '\\';
		var parts = sFilePath.split(sFolderSeparator);

		var sRootFolder = parts[0] + sFolderSeparator + parts[1];							// e.g. e:\inetpub
		
		for(var i = 2; i < parts.length; i++)
		{
			sRootFolder += sFolderSeparator + parts[i];										// e.g. e:\inetpub\api.trisys.co.uk

			var bFoundFolder = ctrlFileManager.isFilePathInFolder(sFolderTreeID, sRootFolder);
			if(bFoundFolder)
				break;																		// We found the root folder	
		}

		// Recursively traverse to and fro to server to get folders and files until we find what we are looking for
		ctrlFileManager.ForcedRecursionToFocusOnPath(sFolderTreeID, sRootFolder, sFilePath, bExpandNode);
	},

	ForcedRecursionToFocusOnPath: function(sFolderTreeID, sRootFolder, sPath, bExpandNode)
	{
		var sSelectedPath = ctrlFileManager.GetSelectedPath(sFolderTreeID);
		if(sSelectedPath !== sPath)
		{
			var sFolderSeparator = '\\';

			if(sSelectedPath == sRootFolder)
			{
				// Traverse downwards
				var sToTraversePath = sPath.replace(sRootFolder + sFolderSeparator, "");
				var parts = sToTraversePath.split(sFolderSeparator);
				sRootFolder += sFolderSeparator + parts[0];
			}

			// We create a dynamic callback which will fire when the tree refreshes
			var fnFocusOnSpecificFilePathOrFolder = function(sFolderPath)
			{
				ctrlFileManager.SelectTreeNodeWithFilePath(sFolderTreeID, sPath, { ForceLoad: false, ExpandNode: bExpandNode } );

				// If this does not find the file, we will need to continue complex recursion
				setTimeout(function() { ctrlFileManager.ForcedRecursionToFocusOnPath(sFolderTreeID, sRootFolder, sPath, bExpandNode); }, 500);
			};
			ctrlFileManager._FolderPopulatedCallbacks.push(fnFocusOnSpecificFilePathOrFolder);

			// Now select this node forcing a re-load from server and fire the above callback to look for the file
			var bForceLoad = false, bExpand = true;
			ctrlFileManager.SelectTreeNodeWithFilePath(sFolderTreeID, sRootFolder, { ForceLoad: bForceLoad, ExpandNode: bExpand } );
		}
	},

	isFilePathInFolder: function(sFolderTreeID, sFilePath)
    {        
        var bFileFound = false;

		var treeView = $('#' + sFolderTreeID).data("kendoTreeView");
		var dataitem = treeView.dataSource.get(sFilePath);
		if (dataitem) 
		{
			var node = treeView.findByUid(dataitem.uid);
			if (node) 
				bFileFound = true;
		}

        return bFileFound;
    },

	// A file might be selected, or a folder, so return { FullPath: <string>, Folder: <boolean> }
	GetSelectedFileOrFolderPath: function(sFolderTreeID)			// ctrlFileManager.GetSelectedFileOrFolderPath
	{
		var treeView = $('#' + sFolderTreeID).data("kendoTreeView");
		var selectedNode = treeView.select();
		if(selectedNode)
		{
			var dataItem = treeView.dataItem(selectedNode);
			if(dataItem)
			{
				var sPath = dataItem.FullPath;	
				var sType = dataItem.TreeViewType;
				var pathObject = { FullPath: sPath, Folder: sType == ctrlFileManager.FolderType };
				return pathObject;
			}
		}
	},

	// Return only if a folder selected
	GetSelectedFolderPath: function(sFolderTreeID)
	{
		var pathObject = ctrlFileManager.GetSelectedFileOrFolderPath(sFolderTreeID);
		if(pathObject && pathObject.Folder)
			return pathObject.FullPath;		
	},

	// Return only if a file selected
	GetSelectedFilePath: function(sFolderTreeID, bShowMessageIfNotFound)
	{
		var pathObject = ctrlFileManager.GetSelectedFileOrFolderPath(sFolderTreeID);
		if(pathObject && !pathObject.Folder)
			return pathObject.FullPath;		

		if(bShowMessageIfNotFound)
			TriSysApex.UI.ShowMessage("No file selected.");
	},

	// Return path regardless - used in recursively traversing folders only
	GetSelectedPath: function(sFolderTreeID)
	{
		var pathObject = ctrlFileManager.GetSelectedFileOrFolderPath(sFolderTreeID);
		if(pathObject)
			return pathObject.FullPath;		
	},

	// Only our server knows if this is a folder or a file!
	GetSelectedNodeDataItemTreeViewType: function(sFolderTreeID)
	{
		var treeView = $('#' + sFolderTreeID).data("kendoTreeView");
		var selectedNode = treeView.select();
		if(selectedNode)
		{
			var dataItem = treeView.dataItem(selectedNode);
			if(dataItem)
			{
				var sType = dataItem.TreeViewType;					
				return sType;
			}
		}
	},

	GetSelectedNodeText: function(sFolderTreeID)
	{
		var treeView = $('#' + sFolderTreeID).data("kendoTreeView");
		var selectedNode = treeView.select();
		if(selectedNode)
		{
			var dataItem = treeView.dataItem(selectedNode);
			if(dataItem)
			{
				var sName = dataItem.Name;					
				return sName;
			}
		}
	},

	GetSelectedFolder: function(sFolderTreeID, bRemoveTrailingSlash, bParentFolderIfFileSelected)
	{
		var sFolderPath = ctrlFileManager.GetSelectedFolderPath(sFolderTreeID);
		if(!sFolderPath)
		{
			if(bParentFolderIfFileSelected)
			{
				var sFilePath = ctrlFileManager.GetSelectedFilePath(sFolderTreeID);
				var sParentFolder = TriSysSDK.Controls.FileManager.GetFolderPathFromFile(sFilePath, '\\');
				sFolderPath = sParentFolder;
			}
		}

		if(sFolderPath)
		{
			if(bRemoveTrailingSlash)
			{
				if(sFolderPath.lastIndexOf("\\") == sFolderPath.length - 1)
					sFolderPath = sFolderPath.substring(0, sFolderPath.length - 1);	// Strip trailing slash
			}
		}

		return sFolderPath;
	},

	GetSelectedFolderText: function(sFolderTreeID)
	{
		var sFolderPath = ctrlFileManager.GetSelectedFolder(sFolderTreeID);
		if(sFolderPath)
		{
			var sName = ctrlFileManager.GetSelectedNodeText(sFolderTreeID);
			return sName;
		}
	},

	// Called after every tree population as we re-create the DIV
	DragAndDropFileHandler: function(sFolderTreeID)
	{
		// Our own file upload handler
        var obj = $("#" + sFolderTreeID);

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
			ctrlFileManager.PopDraggedFilesOffStackAndUpload(lstFiles, sFolderTreeID);
        });
	},

	PopDraggedFilesOffStackAndUpload: function(lstFiles, sFolderTreeID)
	{
		if(!lstFiles)
			return;
		if(lstFiles.length == 0)
			return;

		// Get the currently selected folder
		var sCopyToFolder = ctrlFileManager.GetSelectedFolder(sFolderTreeID);
		if(!sCopyToFolder)
		{
			// Get the parent folder instead
			var sSelectedFile = ctrlFileManager.GetSelectedFilePath(sFolderTreeID, false);
			if(sSelectedFile)
				sCopyToFolder = TriSysSDK.Controls.FileManager.GetFolderPathFromFile(sSelectedFile, '\\');
		}

		if(!sCopyToFolder)
			return;
		
		// Callback parent to determine what to do with these files
		var myInstance = ctrlFileManager._Instances.Get(sFolderTreeID);
		if(myInstance.FileDragDropCallback)
			myInstance.FileDragDropCallback(lstFiles, sCopyToFolder);
	}

};	// ctrlFileManager