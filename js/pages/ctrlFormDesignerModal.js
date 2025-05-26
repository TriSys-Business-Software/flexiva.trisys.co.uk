// 17 Apr 2021: ctrlFormDesignerModal.js
// Paired with ctrlFormDesignerModal.html. Loaded by DeveloperStudio.js.
// A modal form designer for TriSys Apex No-Code / Low-Code.
//
var ctrlFormDesignerModal =
{
	Load: function (sFile, sJSON)
	{
		ctrlFormDesignerModal.Data.FileName = sFile;
		ctrlFormDesignerModal.Data.LayoutJSON = sJSON;

		// Parse the JSON into the form specification
		var formSpecificationObject = JSON.parse(sJSON);
		ctrlFormDesignerModal.Data.FormProperties = formSpecificationObject.FormProperties;
		ctrlFormDesignerModal.Data.Tabs = formSpecificationObject.Tabs;

		// Populate the form
		ctrlFormDesignerModal.PopulateFormProperties();
		ctrlFormDesignerModal.Components.PopulateComponentToolbox();
		ctrlFormDesignerModal.Fields.PopulateFieldToolbox();
		ctrlFormDesignerModal.PopulateTabs();
		ctrlFormDesignerModal.AddEventHandlers();

		// Set the theme of the drag/drop 
		ctrlFormDesignerModal.AddDynamicStyles();

		ctrlFormDesignerModal.SetWorkspaceHeight();
		ctrlFormDesignerModal.DetectNewForm();
	},

	// If this is a new form, created by the developer studio wizard, open form properties automatically
	DetectNewForm: function ()
	{
		var bNewForm = !ctrlFormDesignerModal.Data.FormProperties.Type;
		if (bNewForm)
			ctrlFormDesignerModal.EditFormProperties();
	},

	AddDynamicStyles: function ()
	{
		var lBackColour = TriSysProUI.BackColour();
		var taskColour = TriSysProUI.ThemedSidebarBackgroundLight(0.65);

		var sStyleHTML = '.draggable-placeholder {' +
			'border-color: ' + lBackColour + ";" +
			'border-width: 2px;' +
			'background-color: ' + taskColour + ";" +
			'}';

		sStyleHTML += '.empty-design-block {' +
			//'border-color: ' + lBackColour + ";" +
			'height: ' + ctrlFormDesignerModal.Settings.CellHeight + ';' +
			'}';

		// Prevent adding twice
		var sNameStyle = "form-designer-styles";
		if ($('#' + sNameStyle).length)
		{
			$('#' + sNameStyle).html(sStyleHTML);
		}
		else
		{
			$('head').append('<style type="text/css" id="' + sNameStyle + '">' +
				sStyleHTML +
				+'</style>');
		}
	},

	SetWorkspaceHeight: function ()
	{
		var iHeightFactor = 370; // We do not want a vertical scrollbar
		var iHeight = $(window).height() - iHeightFactor;

		//$('#ctrlFormDesignerModal-RightBlock').height(iHeight);
		//$('#ctrlFormDesignerModal-RightBlock').css('max-height', iHeight);
		//$('#ctrlFormDesignerModal-RightBlock').css('min-height', iHeight);

		var iToolsBlockHeight = iHeight + 107;
		$('#ctrlFormDesignerModal-ToolsBlock').height(iToolsBlockHeight);
		$('#ctrlFormDesignerModal-ToolsBlock').css('max-height', iToolsBlockHeight);
		$('#ctrlFormDesignerModal-ToolsBlock').css('min-height', iToolsBlockHeight);

		var iEditorCanvasHeight = iHeight + 24;
		var elemEditCanvas = $('#' + ctrlFormDesignerModal.Settings.EditorCanvasId);
		elemEditCanvas.height(iEditorCanvasHeight);
		elemEditCanvas.css('max-height', iEditorCanvasHeight);
		elemEditCanvas.css('min-height', iEditorCanvasHeight);

		// Tools
		var iToolHeight = $(window).height() - 475;

		// Form Properties
		var elemPropertiesList = $('#ctrlFormDesignerModal-properties-list');
		var iPropertiesHeight = iToolHeight - 65;
		elemPropertiesList.height(iPropertiesHeight);
		elemPropertiesList.css('max-height', iPropertiesHeight);
		elemPropertiesList.css('min-height', iPropertiesHeight);

		// Tabs
		iToolHeight = iPropertiesHeight;
		var elemTabs = $('#ctrlFormDesignerModal-tab-list');
		elemTabs.height(iToolHeight);
		elemTabs.css('max-height', iToolHeight);
		elemTabs.css('min-height', iToolHeight);

		// Components
		var iComponentsListHeight = iToolHeight + 4;
		var elemComponents = $('#ctrlFormDesignerModal-components-list');
		elemComponents.height(iComponentsListHeight);
		elemComponents.css('max-height', iComponentsListHeight);
		elemComponents.css('min-height', iComponentsListHeight);

		// Fields
		var iFieldsListHeight = iComponentsListHeight;
		var elemFields = $('#ctrlFormDesignerModal-fields-list');
		elemFields.height(iFieldsListHeight);
		elemFields.css('max-height', iFieldsListHeight);
		elemFields.css('min-height', iFieldsListHeight);

		// We scroll our own content
		$('#trisys-modal-dynamic-content').css('overflow-y', 'auto');
	},

	PopulateFormProperties: function ()
	{
		$('#ctrlFormDesignerModal-Tools-Property-Caption').text(ctrlFormDesignerModal.Data.FormProperties.Caption);
		$('#ctrlFormDesignerModal-Tools-Property-Entity').text(ctrlFormDesignerModal.Data.FormProperties.EntityName);
		$('#ctrlFormDesignerModal-Tools-Property-Type').text(ctrlFormDesignerModal.Data.FormProperties.Type);

		var sIcon = ctrlFormDesignerModal.Data.FormProperties.Icon;
		if (sIcon)
		{
			if (sIcon.indexOf(" ") < 0)
				sIcon = sIcon.substring(0, 2) + ' ' + sIcon;
		}
		else
			sIcon = ctrlFormDesignerModal.Data.WarningSignIcon;

		var sIcon = '<i class="' + sIcon + ' themed-color icon-push"></i>';
		$('#ctrlFormDesignerModal-Tools-Property-Icon').html(sIcon);

		// Only if this is an entity form, and an entity is specified should we display the Fields tool
		// This is done here so that if the user changes the form type, we show/hide at the correct time
		var bFieldsToolVisible = (ctrlFormDesignerModal.Data.FormProperties.Type == "Entity Form" && ctrlFormDesignerModal.Data.FormProperties.EntityName);
		var elemFieldsTools = $('#ctrlFormDesignerModal-Tools-Fields-Panel');
		bFieldsToolVisible ? elemFieldsTools.show() : elemFieldsTools.hide();
	},

	PopulateTabs: function ()
	{
		// Data pulled entirely from .form file
		if (ctrlFormDesignerModal.Data)
			ctrlFormDesignerModal.PopulateListOfTabs(ctrlFormDesignerModal.Data.Tabs);
	},

	PopulateListOfTabs: function (tabs, sSelectedTabID)
	{
		var sUL = 'ctrlFormDesignerModal-tab-list';
		var sItemPrefix = sUL + '-item-';
		var sItemTemplate = sItemPrefix + 'template';
		var sRowTemplateHTML = document.getElementById(sItemTemplate).outerHTML;

		// Remove any existing items in case of re-ordering or deletion
		$('#' + sUL).find('li').each(function ()
		{
			var sID = this.id;
			if (sID != sItemTemplate)
				$(this).remove();
		});


		// Always use in-memory data which may have come from server
		for (var i = 0; i < tabs.length; i++)
		{
			var tab = tabs[i];

			// Ordering is always as listed
			tab.Ordering = i + 1;

			// Get the row template and merge this view
			var sRowItemHTML = sRowTemplateHTML;
			var sItemID = sItemPrefix + tab.ID;
			sRowItemHTML = sRowItemHTML.replace(sItemTemplate, sItemID);
			sRowItemHTML = TriSysSDK.DocumentObjectModel.RemoveStyleDisplayNone(sRowItemHTML); //.replace('style="display:none;"', '');

			var sOnClick = 'ctrlFormDesignerModal.SelectTab(\'' + tab.ID + '\')';
			sRowItemHTML = sRowItemHTML.replace('##tab-click-event##', sOnClick);

			var sIcon = tab.Icon;
			if (sIcon)
			{
				if (sIcon.indexOf(" ") < 0)
					sIcon = sIcon.substring(0, 2) + ' ' + sIcon;
			}
			else
				sIcon = ctrlFormDesignerModal.Data.WarningSignIcon;

			sRowItemHTML = sRowItemHTML.replace('##tab-icon##', sIcon);

			sRowItemHTML = sRowItemHTML.replace('##tab-name##', tab.ID);
			sRowItemHTML = sRowItemHTML.replace('##tab-caption##', tab.Caption);

			// Append item to list
			$('#' + sUL).append(sRowItemHTML);

			var sHistorySelectedTabID = ctrlFormDesignerModal.Data.SelectedTabID;

			if (!sSelectedTabID && !sHistorySelectedTabID)
			{
				// Select the first item
				if (i == 0)
					sSelectedTabID = tab.ID;
			}

			if (sSelectedTabID == tab.ID || tab.ID == sHistorySelectedTabID)
				ctrlFormDesignerModal.SelectTab(tab.ID);
		}
	},

	// User is switching tabs so store any changes in memory before switching DOM contents
	SelectTab: function (sTabID)
	{
		// Always save the current tab edits before moving to a new tab
		//ctrlFormDesignerModal.SaveTabLayoutToTabListInMemory();
		// No - not after we save after every edit because we want undo/redo

		// Find caption from name
		var tab = ctrlFormDesignerModal.DataFunctions.TabFromID(sTabID);
		if (!tab)
			return;

		$('#ctrlFormDesignerModal-TabCaption').html("Tab Layout: " + tab.Caption);

		// Clear all selected
		var sUL = 'ctrlFormDesignerModal-tab-list';
		$('#' + sUL).find('li').each(function ()
		{
			$(this).removeClass('active');
		});

		var sItemPrefix = sUL + '-item-';
		var sItemID = sItemPrefix + sTabID;
		$('#' + sItemID).addClass('active');

		// This is now the current tab
		ctrlFormDesignerModal.Data.CurrentTab = tab;
		ctrlFormDesignerModal.Data.SelectedTabID = sTabID;

		// Save in history for undo/redo
		ctrlFormDesignerModal.Settings.History.Push(ctrlFormDesignerModal.Data);

		// Write tab back to the editable DOM 
		ctrlFormDesignerModal.ReadTabListFromMemoryToTabLayout();
	},

	// Manage tab button callbacks
	TabAdd: function ()
	{
		ctrlFormDesignerModal.OpenTabEditor(null);
	},

	TabEdit: function ()
	{
		var tab = ctrlFormDesignerModal.GetSelectedTab();
		if (tab)
			ctrlFormDesignerModal.OpenTabEditor(tab);
	},

	TabDelete: function ()
	{
		var tab = ctrlFormDesignerModal.GetSelectedTab();
		if (!tab)
			return;

		if (tab.ID == ctrlFormDesignerModal.Data.TopMasterName || ctrlFormDesignerModal.Data.Tabs.length <= 2)
		{
			TriSysApex.UI.ShowMessage("You cannot delete this tab.");
			return;
		}

		var fnDeleteTab = function ()
		{
			// Remove tab
			var iIndex = ctrlFormDesignerModal.DataFunctions.TabIndexFromID(tab.ID);
			if (iIndex > 0)
				ctrlFormDesignerModal.Data.Tabs.splice(iIndex, 1);

			// Redraw tabs, focusing on top/master
			ctrlFormDesignerModal.PopulateListOfTabs(ctrlFormDesignerModal.Data.Tabs, ctrlFormDesignerModal.Data.TopMasterID);

			return true;
		};

		var sMessage = "Are you sure you wish to delete tab: " + tab.Caption + "?";
		TriSysApex.UI.questionYesNo(sMessage, "Delete Tab", "Yes", fnDeleteTab, "No");
	},

	TabMove: function (bUp)
	{
		var tab = ctrlFormDesignerModal.GetSelectedTab();
		if (!tab)
			return;

		var iIndex = ctrlFormDesignerModal.DataFunctions.TabIndexFromID(tab.ID);

		if (iIndex <= 0)
		{
			TriSysApex.UI.ShowMessage("You cannot move this tab.");
			return;
		}

		if (bUp)
		{
			if (iIndex <= 1)
			{
				TriSysApex.UI.ShowMessage("You cannot move this tab upwards.");
				return;
			}

			var movedUpTab = ctrlFormDesignerModal.Data.Tabs[iIndex];
			ctrlFormDesignerModal.Data.Tabs[iIndex] = ctrlFormDesignerModal.Data.Tabs[iIndex - 1];
			ctrlFormDesignerModal.Data.Tabs[iIndex - 1] = movedUpTab;
		}
		else
		{
			if (iIndex == ctrlFormDesignerModal.Data.Tabs.length - 1)
			{
				TriSysApex.UI.ShowMessage("You cannot move this tab downwards.");
				return;
			}

			var movedDownTab = ctrlFormDesignerModal.Data.Tabs[iIndex];
			ctrlFormDesignerModal.Data.Tabs[iIndex] = ctrlFormDesignerModal.Data.Tabs[iIndex + 1];
			ctrlFormDesignerModal.Data.Tabs[iIndex + 1] = movedDownTab;
		}

		// Redraw tabs, focusing on moved tab
		ctrlFormDesignerModal.PopulateListOfTabs(ctrlFormDesignerModal.Data.Tabs, tab.ID);
	},

	// Called for edit/add tab
	OpenTabEditor: function (tab)
	{
		var bNewTab = false;
		if (!tab)
		{
			tab = {
				Caption: "New Tab",
				Icon: ctrlFormDesignerModal.Data.WarningSignIcon,
				HTML: '',
				Visible: true
			};
			bNewTab = true;
			ctrlFormDesignerModal.Data.CurrentTab = tab;

			// If the user made changes to the currently selected tab, save these now
			//ctrlFormDesignerModal.SaveTabLayoutToTabListInMemory();
		}
		else
		{
			if (tab.Caption == ctrlFormDesignerModal.Data.TopMasterCaption)
			{
				TriSysApex.UI.ShowMessage(ctrlFormDesignerModal.Data.TopMasterCaption + " is not editable as it fixed.");
				return;
			}
		}

		var sIcon = tab.Icon;
		if (sIcon)
		{
			if (sIcon.indexOf(" ") < 0)
				sIcon = sIcon.substring(0, 2) + ' ' + sIcon;
		}
		else
			sIcon = ctrlFormDesignerModal.Data.WarningSignIcon;

		var properties = [
			{
				"Name": "Active",
				"Description": [
					"Whether the tab is active when form opened"
				],
				"Type": "Boolean",
				"Title": "Active",
				"Default": tab.Active
			},
			{
				"Name": "Caption",
				"Description": [
					"The text of the tab"
				],
				"Type": "TextBox",
				"Default": tab.Caption
			},
			//{
			//    "Name": "HyperlinkID",
			//    "Description": [
			//		"The JQuery ID of the tab item <a> hyperlink"
			//    ],
			//    "Type": "TextBox",
			//    "Default": tab.HyperlinkID
			//},
			{
				"Name": "Icon",
				"Description": [
					"The icon shown with the caption"
				],
				"Type": "Icon",
				"Title": "Icon",
				"Default": sIcon
			},
			{
				"Name": "ID",
				"Description": [
					"The JQuery ID of the tab <li> item"
				],
				"Type": "TextBox",
				"Default": tab.ID
			},
			{
				"Name": "Visible",
				"Description": [
					"Whether the tab is visible or not"
				],
				"Type": "Boolean",
				"Title": "Visible",
				"Default": tab.Visible
			}
		];

		var options = {
			Title: "Tab: " + tab.Caption,
			Image: "gi-more",
			SubTitle: "Tab Properties",
			Items: properties,

			FieldValueChange: function (sCategory, sName, objValue)
			{
				// Store each change in-memory, and apply when required
				if (!ctrlFormDesignerModal.Data.EditedPropertiesList)
					ctrlFormDesignerModal.Data.EditedPropertiesList = ctrlFormDesignerModal.Data.CurrentTab;

				ctrlFormDesignerModal.Data.EditedPropertiesList[sName] = objValue;
			},

			// Apply tab changes to editor
			Apply: function ()
			{
				// Apply in-memory changes
				if (ctrlFormDesignerModal.Data.EditedPropertiesList)
				{
					var editedTab = ctrlFormDesignerModal.Data.EditedPropertiesList;
					if (!editedTab.ID)
						editedTab.ID = ctrlFormDesignerModal.TabIDFromCaption(editedTab.Caption);

					// Duplicate check
					var bDuplicate = false;

					if (bNewTab)
					{
						for (var i = 0; i < ctrlFormDesignerModal.Data.Tabs.length; i++)
						{
							var tab = ctrlFormDesignerModal.Data.Tabs[i];
							if (tab.ID == editedTab.ID)
								bDuplicate = true;
						}
					}
					else
					{
						for (var i = 0; i < ctrlFormDesignerModal.Data.Tabs.length; i++)
						{
							var tab1 = ctrlFormDesignerModal.Data.Tabs[i];
							for (var j = 0; j < ctrlFormDesignerModal.Data.Tabs.length; j++)
							{
								var tab2 = ctrlFormDesignerModal.Data.Tabs[j];
								if (tab1.ID == tab2.ID && j != i)
									bDuplicate = true;
							}
						}
					}

					if (bDuplicate)
					{
						TriSysApex.UI.ShowMessage("Tab ID's must be unique.");
						return false;
					}

					if (bNewTab)
					{
						// Unlike previous versions, we do not try to do HTML manipulation here, we just deal with the tab
						ctrlFormDesignerModal.Data.Tabs.push(editedTab);
					}
					else
					{
						// Must edit the editedTab.outerHTML which contains the class="gi gi***" plus the Caption
						var sIcon = editedTab.Icon;

						//var sTest = TriSysSDK.Miscellaneous.ReplaceWithinTags("3 Blind Mice.", 'Blind', 'Mice', 'Hungry Cats');
						editedTab.outerHTML = TriSysSDK.Miscellaneous.ReplaceWithinTags(editedTab.outerHTML, '<i ', '</i>', '<i class="' + sIcon + '"></i>');
						editedTab.outerHTML = TriSysSDK.Miscellaneous.ReplaceWithinTags(editedTab.outerHTML, '</i>', '</a>', '</i> ' + editedTab.Caption + '</a>');
						ctrlFormDesignerModal.Data.CurrentTab = editedTab;
					}

					// Sync some properties e.g. Active, with the HTML
					if (editedTab.Active)
					{
						// Some properties e.g. Active, can only be set for one tab
						ctrlFormDesignerModal.Data.Tabs.forEach(function (existingTab)
						{
							if (existingTab.ID != editedTab.ID)
							{
								if (existingTab.Active)
								{
									if (existingTab.outerHTML)
										existingTab.outerHTML = existingTab.outerHTML.replace('class="active"', "");
									existingTab.Active = false;
								}
							}
						});
					}

					// Save in history for undo/redo
					ctrlFormDesignerModal.Settings.History.Push(ctrlFormDesignerModal.Data);

					// Visually see changes
					ctrlFormDesignerModal.PopulateListOfTabs(ctrlFormDesignerModal.Data.Tabs, editedTab.ID);

					return true;
				}
				else
					TriSysApex.UI.ShowMessage("Please edit new tab properties.");
			}
		};

		ctrlFormDesignerModal.Data.EditedPropertiesList = null;
		ctrlFormDesignerModal.OpenPropertySheet(options);
	},

	EditFormProperties: function ()
	{
		var sIcon = ctrlFormDesignerModal.Data.FormProperties.Icon;
		if (sIcon)
		{
			if (sIcon.indexOf(" ") < 0)
				sIcon = sIcon.substring(0, 2) + ' ' + sIcon;
		}
		else
			sIcon = ctrlFormDesignerModal.Data.WarningSignIcon;

		// We need a list of entities
		var entityTypes = TriSysApex.Cache.EntityTypes();
		var lstEntity = [''];
		entityTypes.forEach(function (entityType)
		{
			if (lstEntity.indexOf(entityType.EntityName) < 0)
				lstEntity.push(entityType.EntityName);
		});

		// The form types
		var lstFormType = ["Entity Form", "Modal Form", "Virtual Form"];

		// The list of properties
		var properties = [
			{
				"Name": "Caption",
				"Description": [
					"The caption text of the form"
				],
				"Type": "TextBox",
				"Default": ctrlFormDesignerModal.Data.FormProperties.Caption
			},
			{
				"Name": "EntityName",
				"Description": [
					"The entity in the SQL database"
				],
				"Type": "SingleSelectCombo",
				"List": lstEntity,
				"SelectedText": ctrlFormDesignerModal.Data.FormProperties.EntityName
			},
			{
				"Name": "Icon",
				"Description": [
					"The icon shown with the caption"
				],
				"Type": "Icon",
				"Title": "Icon",
				"Default": sIcon
			},
			{
				"Name": "Type",
				"Description": [
					"What type of form this is"
				],
				"Type": "SingleSelectCombo",
				"List": lstFormType,
				"SelectedText": ctrlFormDesignerModal.Data.FormProperties.Type
			}];

		// Remember the current entity name as if this changes, we will need to refresh the list of fields
		var sCurrentEntityName = ctrlFormDesignerModal.Data.FormProperties.EntityName;

		var options = {
			Title: "Form Properties: " + DeveloperStudio.DeveloperFileNameDisplay(ctrlFormDesignerModal.Data.FileName),
			Image: "gi-cog",
			SubTitle: "Form Properties",
			Items: properties,

			FieldValueChange: function (sCategory, sName, objValue)
			{
				// Store each change in-memory, and apply when required
				if (!ctrlFormDesignerModal.Data.EditedPropertiesList)
					ctrlFormDesignerModal.Data.EditedPropertiesList = ctrlFormDesignerModal.Data.FormProperties;

				ctrlFormDesignerModal.Data.EditedPropertiesList[sName] = objValue;
			},

			// Apply form changes to editor
			Apply: function ()
			{
				// Apply in-memory changes
				if (ctrlFormDesignerModal.Data.EditedPropertiesList)
				{
					// Has the entity name changed?
					var bEntityNameChanged = (sCurrentEntityName != ctrlFormDesignerModal.Data.EditedPropertiesList.EntityName);
					if (bEntityNameChanged)
					{
						// If the entity name has changed, we need to refresh all fields to get the correct field descriptions
						setTimeout(function ()
						{
							ctrlFormDesignerModal.DesignMode(true);
						}, 100);
					}

					// Use these new properties
					ctrlFormDesignerModal.Data.FormProperties = ctrlFormDesignerModal.Data.EditedPropertiesList;

					// Validation to prevent form properties being null
					var lstError = [];
					if (!ctrlFormDesignerModal.Data.FormProperties.Caption) lstError.push("Caption");
					if (!ctrlFormDesignerModal.Data.FormProperties.Type) lstError.push("Type");
					if (lstError.length > 0)
					{
						var sError = '';
						lstError.forEach(function (sField)
						{
							if (sError.length > 0) sError += ', ';
							sError += sField
						});
						sError = "Please complete these form properties fields: " + sError;
						setTimeout(function () { TriSysApex.UI.ShowMessage(sError); }, 10);
						return false;
					}

					// Save in history for undo/redo
					ctrlFormDesignerModal.Settings.History.Push(ctrlFormDesignerModal.Data);

					ctrlFormDesignerModal.PopulateFormProperties();
					return true;
				}
				else
					TriSysApex.UI.ShowMessage("Please edit form properties.");
			}
		};

		ctrlFormDesignerModal.Data.EditedPropertiesList = null;
		ctrlFormDesignerModal.OpenPropertySheet(options);
	},

	OpenPropertySheet: function (options)
	{
		var parametersObject = new TriSysApex.UI.ShowMessageParameters();

		parametersObject.Title = options.Title;
		parametersObject.Image = options.Image;

		var lWidth = $(window).width() / 2;
		parametersObject.Width = lWidth;

		parametersObject.ContentURL = TriSysApex.Constants.UserControlFolder + "ctrlFormDesignerPropertySheet.html";

		parametersObject.OnLoadCallback = function ()
		{
			var lHeight = $(window).height() * 0.5;

			// Draw property sheet control
			var propertySheetData = {
				title: options.SubTitle,
				propertyColumnName: 'Property',
				valueColumnName: 'Setting',
				categoryColumnHide: true,
				descriptionColumnHide: true,
				//filterHide: true,
				height: lHeight,
				objectList: options.Items,
				fieldValueChange: options.FieldValueChange
			};

			// The property sheet is designed to re-load from different sources, like a master/detail
			// so we need to explicitly set the defaults in complex fields
			var fnAfterDraw = function ()
			{
				ctrlPropertySheet.ApplyDefaults('ctrlFormDesigner-PropertySheet', propertySheetData);
			};

			TriSysApex.PropertySheet.Draw('ctrlFormDesigner-PropertySheet', propertySheetData, function ()
			{
				setTimeout(fnAfterDraw(), 250);
			});
		};

		// Buttons
		parametersObject.ButtonLeftVisible = true;
		parametersObject.ButtonLeftText = "Apply";
		parametersObject.ButtonLeftFunction = function ()
		{
			return options.Apply();
		};

		parametersObject.ButtonRightVisible = true;
		parametersObject.ButtonRightText = "Cancel";

		TriSysApex.UI.PopupMessage(parametersObject);
	},


	GetSelectedTab: function ()
	{
		var sTabID = ctrlFormDesignerModal.GetSelectedTabID();
		var tab = ctrlFormDesignerModal.DataFunctions.TabFromID(sTabID);
		return tab;
	},

	GetSelectedTabID: function ()
	{
		var sTabID = null;
		var sUL = 'ctrlFormDesignerModal-tab-list';
		$('#' + sUL).find('li').each(function ()
		{
			var bActive = $(this).hasClass('active');
			if (bActive)
				sTabID = this.id.replace('ctrlFormDesignerModal-tab-list-item-', '');
		});
		return sTabID;
	},

	// Every time we switch tabs, save a copy of the current editable DOM against the tab
	// to preserve changes between tab clicks, but also to assemble the full form
	// once the user saves the form.
	SaveTabLayoutToTabListInMemory: function ()
	{
		if (ctrlFormDesignerModal.Data.CurrentTab)
		{
			// Do we have rows for this tab?
			var rows = ctrlFormDesignerModal.Data.CurrentTab.Layout.Rows;
			if (rows)
			{
				// Because we do not wish to retain the component and locations as we do not get drag/drop events,
				// we must enumerate through the DOM now to determine each row, column, block and component.
				ctrlFormDesignerModal.Persistence.ReadCurrentTabLayoutIntoMemoryArray();

				// Save in history for undo/redo
				ctrlFormDesignerModal.Settings.History.Push(ctrlFormDesignerModal.Data);
			}
		}
	},

	// Find all DOM objects beneath the specified DOM ID which are components or fields
	// Warning: Due to the hierarchical nature of our rows within cols within rows etc..
	// We may return elements which are in children of the specified block
	//
	FindDOMObjectsInContainer: function (sColumnBlockID, sPrefix, bIgnoreLengthCheck)
	{
		var lstDOMobjects = null;
		var nodesArray = TriSysSDK.DocumentObjectModel.GetAllNodesBeneathUniqueDivID(sColumnBlockID);
		if (nodesArray)
		{
			for (var i = 0; i < nodesArray.length; i++)
			{
				var node = nodesArray[i];
				if (node.id)
				{
					var sID = node.id;
					if (sID.indexOf(sPrefix) == 0)
					{
						var sAttributeType = null,
							sObjectIDValue = null,
							sObjectGUID = null;

						var bAddToDOMArray = false;
						if (bIgnoreLengthCheck)
							bAddToDOMArray = true;
						else
						{
							// We are only interested in DOM objects which precisely match the prefix,
							// not those which are perhaps inside the control
							// e.g. component-name-z-y-x-GUID-..... component tile-name-z-y-x-GUID-.....-sub-field

							var lstAttributes = ['trisys-component-id', 'trisys-field-id'];
							var iAttributeIndex = 0;
							lstAttributes.forEach(function (sAttribute)
							{
								iAttributeIndex += 1;
								var s = $('#' + sID).attr(sAttribute);
								if (s)
								{
									sObjectIDValue = s;
									switch (iAttributeIndex)
									{
										case 1:
											sAttributeType = "Component";
											break;
										case 2:
											sAttributeType = "Field";
											break;
									}
								}
							});
							if (sObjectIDValue)
							{
								bAddToDOMArray = true;
								lstAttributes = ['trisys-component-guid', 'trisys-field-guid'];
								lstAttributes.forEach(function (sAttribute)
								{
									var s = $('#' + sID).attr(sAttribute);
									if (s)
										sObjectGUID = s;
								});
							}
						}

						if (bAddToDOMArray)
						{
							if (!lstDOMobjects)
								lstDOMobjects = []

							lstDOMobjects.push(
								{
									DOMid: sID,
									ObjectID: sObjectIDValue,
									GUID: sObjectGUID,
									Type: sAttributeType
								});
						}
					}
				}
			}
		}

		return lstDOMobjects;
	},

	ReadTabListFromMemoryToTabLayout: function ()
	{
		if (ctrlFormDesignerModal.Data.CurrentTab)
		{
			// Read layout template
			sHTML = $('#ctrlFormDesignerModal-tab-layout-html').html();

			// Write directly to editor		
			$('#' + ctrlFormDesignerModal.Settings.EditorCanvasId).html(sHTML);

			// Load the tab .Layout
			ctrlFormDesignerModal.DrawLayoutFramework();

			// Turn drag/drop on
			ctrlFormDesignerModal.DesignMode(true);

			// Tweak cells based upon dimensions
			ctrlFormDesignerModal.TweakCellsBasedUponDimensions();
		}
	},

	// If cells are too small then hide/ellipse the text
	TweakCellsBasedUponDimensions: function ()
	{
		var lstToolMenu = [
			{ prefix: 'formdesigner-column-edit-tool-menu-', minWidth: 100 },
			{ prefix: 'formdesigner-component-edit-tool-menu-', minWidth: 110 },
			{ prefix: 'formdesigner-field-edit-tool-menu-', minWidth: 90 }
		];
		lstToolMenu.forEach(function (menuCaptionVisible)
		{
			$(document).find("[id^='" + menuCaptionVisible.prefix + "']").each(function ()
			{
				var parentCellElement = $(this).parent().parent().parent().parent().parent();
				var iWidth = parentCellElement.width();
				var bShow = (iWidth >= menuCaptionVisible.minWidth);
				bShow ? $(this).show : $(this).hide();
			});
		});

		// Prevent column block header being wider than block
		var lstToolCaption = ['field-tool-caption', 'component-tool-caption'];
		lstToolCaption.forEach(function (sToolCaption)
		{
			$(document).find("[class='" + sToolCaption + "']").each(function ()
			{
				var iWidth = $(this).parent().width();
				if (iWidth > 0)
				{
					$(this).css('text-overflow', 'ellipsis');
					$(this).css('overflow', 'hidden');
					$(this).css('white-space', 'nowrap');
					$(this).css('width', iWidth + 'px');
				}
			});
		});
	},

	TabIDFromCaption: function (sCaption)
	{
		sCaption = sCaption.trim();
		var sTabID = sCaption.replace('/', '-').replace(/ /g, '-');
		sTabID = sTabID.replace(/[|&;$%@"<>()+,]/g, "");
		return sTabID;
	},

	AddEventHandlers: function ()
	{
		$('#ctrlFormDesignerModal-configure-layout').on('click', function ()
		{
			ctrlFormDesignerModal.ConfigureLayoutModal.Show();
		});

		$('#ctrlFormDesignerModal-MinimizeTools').on('click', function (e)
		{
			$('#ctrlFormDesignerModal-MinimizeTools').hide();
			$('#ctrlFormDesignerModal-MaximizeTools').show();
			$('#ctrlFormDesignerModal-LeftBlock-Title').html('');
			ctrlFormDesignerModal.ResizeBlockColumns(false);
		});

		$('#ctrlFormDesignerModal-MaximizeTools').on('click', function (e)
		{
			$('#ctrlFormDesignerModal-MaximizeTools').hide();
			$('#ctrlFormDesignerModal-MinimizeTools').show();
			$('#ctrlFormDesignerModal-LeftBlock-Title').html('Tools');
			ctrlFormDesignerModal.ResizeBlockColumns(true);
		});

		$('#ctrlFormDesignerModal-undo-layout').on('click', function ()
		{
			ctrlFormDesignerModal.UndoRedo(true);
		});

		$('#ctrlFormDesignerModal-redo-layout').on('click', function ()
		{
			ctrlFormDesignerModal.UndoRedo(false);
		});

		// Component toolbox filter
		var txtComponentFilter = $('#ctrlFormDesignerModal-component-filter');
		txtComponentFilter.off().keyup(function (e)
		{
			if (e.keyCode != 13)
			{
				sFilter = txtComponentFilter.val();
				ctrlFormDesignerModal.Components.FilterComponents(sFilter);
			}
		});

		// Field toolbox filter
		var txtFieldFilter = $('#ctrlFormDesignerModal-field-filter');
		txtFieldFilter.off().keyup(function (e)
		{
			if (e.keyCode != 13)
			{
				sFilter = txtFieldFilter.val();
				ctrlFormDesignerModal.Fields.FilterFields(sFilter);
			}
		});
	},

	ResizeBlockColumns: function (bLeftOpen)
	{
		var sLeft = 'ctrlFormDesignerModal-LeftBlock';
		var sRight = 'ctrlFormDesignerModal-RightBlock';

		var sLargerLeftClass = "col-md-2 col-lg-2";
		var sSmallerLeftClass = "col-md-1 col-lg-1";

		var sSmallerRightClass = "col-md-10 col-lg-10";
		var sLargerRightClass = "col-md-12 col-lg-12";

		$('#' + sLeft).removeClass().addClass(bLeftOpen ? sLargerLeftClass : sSmallerLeftClass);
		$('#' + sRight).removeClass().addClass(bLeftOpen ? sSmallerRightClass : sLargerRightClass);

		var accordion = $('#ctrlFormDesignerModal-Tools-group-panel');
		bLeftOpen ? accordion.show() : accordion.hide();

		bLeftOpen ? $('#' + sLeft).show() : $('#' + sLeft).hide();
	},

	// Preview this form on the specified device
	// See tv.trisys.co.uk about how to do this
	PreviewMode: function (sDeviceType)
	{
		var elemEditCanvas = $('#' + ctrlFormDesignerModal.Settings.EditorCanvasId);
		var elemPreviewCanvas = $('#ctrlFormDesignerModal-PreviewCanvas');
		var elemAddRow = $('#ctrlFormDesignerModal-add-row-button');
		var elemLayoutStyle = $('#ctrlFormDesignerModal-configure-layout');
		var elemUndoButton = $('#ctrlFormDesignerModal-undo-layout');
		var elemRedoButton = $('#ctrlFormDesignerModal-redo-layout');
		var elemEditModeButton = $('#ctrlFormDesignerModal-edit-menu');
		var elemPreviewModeButton = $('#ctrlFormDesignerModal-preview-menu');
		var elemTabCaption = $('#ctrlFormDesignerModal-TabCaption');
		var elemMinimizeToolsButton = $('#ctrlFormDesignerModal-MinimizeTools');
		var elemMaximizeToolsButton = $('#ctrlFormDesignerModal-MaximizeTools');

		if (!sDeviceType)
		{
			// Turn off preview mode and go into design mode
			elemPreviewCanvas.hide();
			elemEditCanvas.show();
			elemAddRow.attr('disabled', false);
			elemLayoutStyle.attr('disabled', false);
			elemUndoButton.attr('disabled', !ctrlFormDesignerModal.Settings.History.CanGoBack());
			elemRedoButton.attr('disabled', !ctrlFormDesignerModal.Settings.History.CanGoForward());
			elemPreviewModeButton.show();
			elemEditModeButton.hide();
			elemMinimizeToolsButton.hide();
			elemMaximizeToolsButton.show();
			elemMaximizeToolsButton.trigger('click');
			elemMaximizeToolsButton.attr('disabled', false);

			var selectedTab = ctrlFormDesignerModal.DataFunctions.TabFromID(ctrlFormDesignerModal.Data.SelectedTabID);
			elemTabCaption.text("Tab Layout: " + selectedTab.Caption);
		}
		else
		{
			// Turn on preview mode
			//TriSysApex.UI.ShowMessage(sDeviceType);
			elemEditCanvas.hide();
			elemPreviewCanvas.show();
			elemAddRow.attr('disabled', true);
			elemLayoutStyle.attr('disabled', true);
			elemUndoButton.attr('disabled', true);
			elemRedoButton.attr('disabled', true);
			//elemPreviewModeButton.hide();
			elemEditModeButton.show();
			elemTabCaption.text("Preview Mode: " + sDeviceType);
			elemMinimizeToolsButton.show();
			elemMaximizeToolsButton.hide();
			elemMinimizeToolsButton.trigger('click');
			elemMaximizeToolsButton.attr('disabled', true);

			// Invoke "The Renderer"
			var data = ctrlFormDesignerModal.Data;
			ctrlFormDesignerModal.FormRenderer.RenderFormInPreview(data, sDeviceType, elemPreviewCanvas);
		}
	},

	DesignMode: function (bEnable) // ctrlFormDesignerModal.DesignMode
	{
		// Code lifted from dashboard.js: InitialiseDragDrop
		// Which draggable blocks are available?
		if (!ctrlFormDesignerModal.Data.CurrentTab)
			return;

		var layout = ctrlFormDesignerModal.Data.CurrentTab.Layout;
		if (!layout)
			return;

		// 19 Apr 2021: Try making only the specific row column draggable
		var sDivCollection = '';
		var sDraggableBlockRowColPrefix = '#formdesigner-block-row-';
		for (var i = 0; i < layout.Rows.length; i++)
		{
			var row = layout.Rows[i];
			for (var col = 0; col < row.Columns.length; col++)
			{
				if (sDivCollection.length > 0)
					sDivCollection += ', ';

				sDivCollection += sDraggableBlockRowColPrefix + (i + 1) + '-column-' + (col + 1);
			}
		}

		// Mon 26 Apr 2021
		// Always reset the component and field toolbox because we may have been called after a drag/drop component operation
		// Components can be used multiple times on the same form/tab, whereas fields cannot
		ctrlFormDesignerModal.Components.PopulateComponentToolbox();
		ctrlFormDesignerModal.Fields.PopulateFieldToolbox();

		// Add the draggable components and fields from the toolbox too
		var sComponentsDivCollection = ctrlFormDesignerModal.Components.GetComponentToolboxItemsAsIDString();
		var sFieldsDivCollection = ctrlFormDesignerModal.Fields.GetFieldToolboxItemsAsIDString();
		if (sDivCollection.length > 0 && sComponentsDivCollection)
			sDivCollection += ', ';
		sDivCollection += sComponentsDivCollection;
		if (sDivCollection.length > 0 && sFieldsDivCollection)
			sDivCollection += ', ';
		sDivCollection += sFieldsDivCollection;

		/* Initialize draggable and sortable blocks, check out more examples at https://jqueryui.com/sortable/ */
		if (bEnable)
		{
			$(sDivCollection).sortable(
				{
					connectWith: '.column', //'.col', // '.row',    // .col seems to be specific i.e. drag only into empty columns
					//connectWith: '.row',        // DASHBOARD SETTING
					//connectWith: '.col',      // '.row',    // .col seems to be specific i.e. drag only into empty columns
					//dropOnEmpty: true,         // TEST 18 Apr 2021 - has no effect whatsoever
					items: '.block',
					opacity: 0.75,
					handle: '.block-title',
					placeholder: 'draggable-placeholder', // Dynamic style based upon our theme
					tolerance: 'pointer',
					start: function (e, ui)
					{
						ui.placeholder.css('height', ui.item.outerHeight());
					},

					// Trying to prevent 'sorting' on columns which are 'full'
					receive: function (ev, ui)
					{
						//var sID = ui.item[0].id;
						//console.log("receive: " + sID);
						//var bEmpty = (sID.indexOf("empty") > 0);
						//if (!bEmpty)
						//    ui.sender.sortable("cancel");
					},

					activate: function (ev, ui)
					{
						//var sID = ui.item[0].id;
						//console.log("activate: " + sID);
						//var bEmpty = (sID.indexOf("empty") > 0);
						//if (!bEmpty)
						//    ui.sender.sortable("cancel");
					},

					change: function (ev, ui)
					{
						// The purpose of this event handler is to remove our empty block from the destination
						// drop target. We cannot move the JQueryUI on [class=draggable-placeholder] as it keeps re-appearing.
						// This presents a problem when the user hovers over numerous target blocks as this creates blank
						// spaces where the user will be unable to utilise.
						// We thus have to do more work in the stop event to re-create our splated empty target blocks
						try
						{
							var sDestination = ev.target.id; // e.g. formdesigner-block-row-4-column-1
							var sSource = ui.item[0].parentElement.id; // e.g. formdesigner-block-row-1-column-2
							console.log("change: src=" + sSource + ", dest=" + sDestination);

							// If source and destination are different, then ensure that there is no div of class "draggable-placeholder" displayed
							// Unfortunately, JQueryUI will not allow us to remove its own drag/drop target, so we must remote our own
							if (sDestination != sSource)
							{
								var sClass = "block empty-design-block"; // "draggable-placeholder";
								$("#" + sDestination).children("*[class^='" + sClass + "']").each(function ()
								{
									$(this).remove();
								});
							}

							ctrlFormDesignerModal.KludgeToReplaceRemovedEmptyBlocksAfterDragDropOperation(sDestination);
						}
						catch (e)
						{
							// Ignore JQuery wingeing

						}
					},

					out: function (ev, ui)
					{
						var sID = ui.item[0].id;
						var sSource = ev.target.id; // e.g. formdesigner-block-row-4-column-1
						var sDestination = ui.item[0].parentElement.id; // e.g. formdesigner-block-row-1-column-2
						//console.log("out: src=" + sSource + ", dest=" + sDestination);
					},

					over: function (ev, ui)
					{
						var sID = ui.item[0].id;
						var sSource = ev.target.id; // e.g. formdesigner-block-row-4-column-1
						var sDestination = ui.item[0].parentElement.id; // e.g. formdesigner-block-row-1-column-2
						//console.log("over: src=" + sSource + ", dest=" + sDestination);
					},

					stop: function (ev, ui)
					{
						// The original purpose of this event handler is to prevent the user from dragging a field on top of a field.
						// The underlying JQueryUI control is a sorter so allowing this is its primary function, however
						// we want everything else including the drag/drop but not sorting.
						// We therefore identify if any component lives in this destination block, and if it does then we
						// cancel the drop.
						// If the drop succeeds, we must remove the existing empty block to prevent the user dropping in future.
						// We still have more work however as the change event above is forced to remove all empty blocks when the
						// user is dragging in order to allow the JQueryUI drop handler to operate normally.
						// Thus after the drag/drop operation is finished, enumerate through all rows/columns and add an
						// empty target block where there is none.
						//
						// The next purpose is to handle field/component drag and drops from the toolbox onto an empty row/column.
						// In this case, we must remove the source column in the toolbox and replenish only the component in the toolbox.
						// We must then render the field/component with it's own configure tool to allow the user to set properties/move/delete etc..
						//
						// In May 2021, we have to deal with multi-hierarchies row/col/row/col/.. e.g. formdesigner-block-row-2-column-1-row-1-column-1-row-1-column-2
						//
						var sID = ui.item[0].id;
						var sSource = ev.target.id; // e.g. formdesigner-block-row-4-column-1

						// 03 May 2021: Wrong! where multi-hierarchies are enabled
						// Find "formdesigner-block-row-" in ev.target.firstElementChild
						//sSource = $('#' + sID).parent().attr('id');

						var sDestination = ui.item[0].parentElement.id; // e.g. formdesigner-block-row-1-column-2
						console.log("stop: src=" + sSource + ", dest=" + sDestination);
						var bSourceAndDestinationSameLocation = (sSource == sDestination);

						var elemSource = $('#' + sSource);
						var elemDestination = $('#' + sDestination);
						var bRefreshDesignMode = false; // If we drag from the component toolbox, we need to replenish it


						// Look for a field or component in the destination block
						var bExistingFieldOrComponentInDestinationBlock = false,
							iFieldOrComponentCount = 0;
						elemDestination.find("[id^='component-name-']").each(function ()
						{
							iFieldOrComponentCount++;
							bExistingFieldOrComponentInDestinationBlock = (iFieldOrComponentCount > 1); // Remember, the dragged/dropped component has already been copied!
						});
						elemDestination.find("[id^='field-name-']").each(function ()
						{
							iFieldOrComponentCount++;
							bExistingFieldOrComponentInDestinationBlock = (iFieldOrComponentCount > 1); // Remember, the dragged/dropped component has already been copied!
						});
						if (bExistingFieldOrComponentInDestinationBlock || bSourceAndDestinationSameLocation)
						{
							// Cancel both the source and destination 'sorts'
							elemDestination.sortable("cancel"); // Dragged to
							elemSource.sortable("cancel"); // Dragged from
						}
						else
						{
							// Having copied the component, remove the 'empty' block from the destination
							// and add an 'empty' block to the source
							elemDestination.find("[id^='formdesigner-block-empty-']").each(function ()
							{
								$('#' + this.id).remove();
							});

							// What type of source is it e.g. toolbox or design block?
							var bComponentToolbox = (sSource.indexOf("formdesigner-component-tool") == 0);
							var bFieldToolbox = (sSource.indexOf("formdesigner-field-tool") == 0);
							var bDesignBlock = (sSource.indexOf("formdesigner-block-row-") == 0);
							var sGUID = null;

							if (bDesignBlock)
							{
								// Mark the block as empty so that we can easily hide it when not in design mode
								var sEmptyHTML = $("#ctrlFormDesignerModal-empty-block-html").html();
								sGUID = TriSysSDK.Miscellaneous.GUID();
								sEmptyHTML = sEmptyHTML.replace("{{GUID}}", sGUID);
								elemSource.append(sEmptyHTML);
							}
							else if (bComponentToolbox || bFieldToolbox)
							{
								var sType = bComponentToolbox ? 'component' : 'field';
								var sItemID = elemSource.attr("trisys-" + sType + "-id");
								sGUID = elemSource.attr("trisys-" + sType + "-guid");
								var sConfigureBlockID = "formdesigner-" + sType + "-edit-tool-" + sItemID + "-" + sGUID;
								var elemConfigureBlock = $('#' + sConfigureBlockID);
								elemConfigureBlock.show();
								elemDestination.children().css('height', ctrlFormDesignerModal.Settings.CellHeight);
								elemDestination.children().css('margin-bottom', '20px');

								if (bComponentToolbox)
								{
									// Add this component to this list of components for this form
									if (!ctrlFormDesignerModal.Data.CurrentTab.Layout.Components)
										ctrlFormDesignerModal.Data.CurrentTab.Layout.Components = [];

									var draggedDroppedComponent = null;
									ctrlFormDesignerModal.Data.CurrentTab.Layout.Components.forEach(function (component)
									{
										if (component.GUID == sGUID)
											draggedDroppedComponent = component;
									});
									if (!draggedDroppedComponent)
									{
										var component = ctrlFormDesignerModal.Components.GetComponentByID(sItemID);
										var componentProperties = component.Properties;
										if (!componentProperties)
											componentProperties = {
												Visible: true
											};

										draggedDroppedComponent = {
											ID: sItemID,
											GUID: sGUID,
											Location: sDestination,
											Properties: componentProperties
										};
										ctrlFormDesignerModal.Data.CurrentTab.Layout.Components.push(draggedDroppedComponent);
									}
								}
								else if (bFieldToolbox)
								{
									// Add this field to this list of fields for this form
									if (!ctrlFormDesignerModal.Data.CurrentTab.Layout.Fields)
										ctrlFormDesignerModal.Data.CurrentTab.Layout.Fields = [];

									var draggedDroppedField = null;
									ctrlFormDesignerModal.Data.CurrentTab.Layout.Fields.forEach(function (field)
									{
										if (field.GUID == sGUID)
											draggedDroppedField = field;
									});
									if (!draggedDroppedField)
									{
										var field = ctrlFormDesignerModal.Fields.GetFieldByID(sItemID);
										draggedDroppedField = {
											ID: sItemID,
											GUID: sGUID,
											Location: sDestination,
											Properties:
											{
												Visible: true
											}
										};
										ctrlFormDesignerModal.Data.CurrentTab.Layout.Fields.push(draggedDroppedField);
									}
								}

								// Users cannot drag back into toolbox, they must remove the field/component which will cause the toolbox to refresh
								if (bFieldToolbox)
								{
									// Remove the placeholder for this in the tools
									elemSource.parent().remove();
								}
								else
								{
									// Refresh the list of components as users are permitted multiple versions of components on the same form
									// TODO: AFTER preserving fields/components in the layout

									// Mon 26 Apr 2021 START
									bRefreshDesignMode = true;
									// Mon 26 Apr 2021 END
								}
							}
						}

						ctrlFormDesignerModal.KludgeToReplaceRemovedEmptyBlocksAfterDragDropOperation();

						if (!bExistingFieldOrComponentInDestinationBlock)
						{
							// Save in history for undo/redo
							ctrlFormDesignerModal.SaveTabLayoutToTabListInMemory();
						}

						if (bRefreshDesignMode)
						{
							// Perhaps a component has been dragged?
							var fnRefresh = function ()
							{
								ctrlFormDesignerModal.DesignMode(true);
							};
							setTimeout(fnRefresh, 10);
						}
					},

					update: function (ev, ui)
					{
						// sID = ui.item[0].id;
						//console.log("update: " + sID);
						//var bEmpty = (sID.indexOf("empty") > 0);
						//if (!bEmpty)
						//    ui.sender.sortable("cancel");
					}
				});
			$(sDivCollection).sortable("enable");
		}
		else
			$(sDivCollection).sortable("disable");

		// If we are in edit mode, then show all blocks with no tiles assigned,
		// else if not in edit mode, then hide all blocks with no tiles assigned
		var bShow = bEnable;
		//ctrlDashboard.ShowOrHideBlocksWithNoTile(bShow);      TODO Garry...

		// Same for the configurator buttons - hide them for end-users not in designer mode
		//ctrlDashboard.ShowOrHideTileConfigurator(bShow);      TODO Garry...		
	},

	// Get all design blocks
	ListOfDesignBlockIds: function ()
	{
		// 03 May 2021: Get every row/col in the current tab DOM
		var lstID = [];
		$('#' + ctrlFormDesignerModal.Settings.EditorCanvasId).find("[id^='formdesigner-block-row-']").each(function ()
		{
			if (this.id !== "formdesigner-block-row-template")
				lstID.push(this.id);
		});

		return lstID;
	},

	// ctrlFormDesignerModal.KludgeToReplaceRemovedEmptyBlocksAfterDragDropOperation
	// If sExceptionBlockID is set, then do not add an empty block to this
	KludgeToReplaceRemovedEmptyBlocksAfterDragDropOperation: function (sExceptionBlockID)
	{
		if (ctrlFormDesignerModal.Data.CurrentTab.Layout)
		{
			var rows = ctrlFormDesignerModal.Data.CurrentTab.Layout.Rows;
			if (rows)
			{
				// 03 May 2021: Get every row/col in the current tab DOM
				var lstID = ctrlFormDesignerModal.ListOfDesignBlockIds();

				lstID.forEach(function (sID)
				{
					if (sID != sExceptionBlockID)
					{
						// Does a component exist in this block
						var bFieldOrComponentFound = false;
						$('#' + sID).find("[id^='component-name-']").each(function ()
						{
							bFieldOrComponentFound = true;
						});

						// Does a field exist in this block
						$('#' + sID).find("[id^='field-name-']").each(function ()
						{
							bFieldOrComponentFound = true;
						});

						// Does an empty block already exist?
						var bEmptyBlockFound = false;
						$('#' + sID).find("[id^='formdesigner-block-empty-']").each(function ()
						{
							bEmptyBlockFound = true;
						});

						if (!bFieldOrComponentFound && !bEmptyBlockFound)
						{
							// Add an empty block
							var sEmptyHTML = $("#ctrlFormDesignerModal-empty-block-html").html();
							var sGUID = TriSysSDK.Miscellaneous.GUID();
							sEmptyHTML = sEmptyHTML.replace("{{GUID}}", sGUID);
							$('#' + sID).append(sEmptyHTML);
						}
					}
				});
			}

			// After multi-hierarchy dragging into sub-rows leaves additional empty placeholders to be removed
			var elemCanvas = $('#' + ctrlFormDesignerModal.Settings.EditorCanvasId);
			elemCanvas.find("[id^='formdesigner-block-empty-']").each(function ()
			{
				var parentColumn = $(this).parent();
				var bRowChildren = false;
				parentColumn.find("[class='row']").each(function ()
				{
					bRowChildren = true;
				});

				if (bRowChildren)
					$(this).remove();
			});
		}
	},

	// Draw the tab layout before entering drag/drop mode
	DrawLayoutFramework: function ()
	{
		ctrlFormDesignerModal.DeleteExistingRowsAndColumnLayout();

		if (!ctrlFormDesignerModal.Data.CurrentTab.Layout)
		{
			ctrlFormDesignerModal.Data.CurrentTab.Layout = {
				Rows: []
			};
			var bAddBlankRowsAndColumnsToEmptyTabs = true;		// 02 May 2021: Testing multi-hierarchy

			if (bAddBlankRowsAndColumnsToEmptyTabs)
			{
				// Ensure that new tabs or blank tabs have something to start designing with
				ctrlFormDesignerModal.Data.CurrentTab.Layout.Rows = [
					{
						"Columns": [
							{
								"Width": 4
							},
							{
								"Width": 4
							},
							{
								"Width": 4
							}],
					},
					{
						"Columns": [
							{
								"Width": 10,
								"Rows": [		// 02 May 2021: First multi-hierarchy Garry!
									{
										"Columns": [
											{
												"Width": 10,
												"Rows": [
													{
														"Columns": [{ "Width": 7 }, { "Width": 5 }]
													},
													{
														"Columns": [{ "Width": 4 }, { "Width": 4 }, { "Width": 4 }]
													},
													{
														"Columns": [{ "Width": 5 }, { "Width": 7 }]
													}
												]
											},
											{ "Width": 2 }
										]
									}
								]
							},
							{
								"Width": 2
							}],
					},
					{
						"Columns": [
							{
								"Width": 12
							}
						]
					}
				]
			}
		}

		if (ctrlFormDesignerModal.Data.CurrentTab.Layout)
		{
			var rows = ctrlFormDesignerModal.Data.CurrentTab.Layout.Rows;
			if (rows)
			{
				// Add each row in turn, and all columns inside
				for (var iRow = 0; iRow < rows.length; iRow++)
				{
					var row = rows[iRow];
					ctrlFormDesignerModal.DrawRowLayout((iRow + 1), row);		// Recursive function
				}
			}

			// After layout is all drawn, now add components and fields
			ctrlFormDesignerModal.DrawLayoutFrameworkComponents();
			ctrlFormDesignerModal.DrawLayoutFrameworkFields();
		}
	},

	DrawLayoutFrameworkComponents: function ()
	{
		var components = ctrlFormDesignerModal.Data.CurrentTab.Layout.Components;
		if (components)
		{
			for (var i = 0; i < components.length; i++)
			{
				var component = components[i];

				var sHTML = ctrlFormDesignerModal.Components.GetComponentToolboxItemHTML(component);

				var elem = $('#' + component.Location);
				elem.prepend(sHTML);

				// Set it's height
				var sComponentDOMid = 'component-name-' + component.ID + '-' + component.GUID;
				var elemComponent = $('#' + sComponentDOMid)
				elemComponent.css('height', ctrlFormDesignerModal.Settings.CellHeight);

				// The toolbox margin must be set to design-time layout also
				elemComponent.css('margin-bottom', '20px');

				// We do not want the outer 2 x DIV's as these are only for toolbox items
				elemComponent.unwrap(); // <div class="form-group component-tool-form-group" data-children-count="1">
				elemComponent.unwrap(); //  <div class="column" id="formdesigner-component-tool-{{ComponentID}}" trisys-component-id="{{ComponentID}}" trisys-component-guid="{{GUID}}">

				// Show it's configuration button menu
				var sComponentConfigureDOMid = 'formdesigner-component-edit-tool-' + component.ID + '-' + component.GUID;
				$('#' + sComponentConfigureDOMid).show();

				// Important: Remove any 'empty' blocks in the same row/col as this component
				// to prevent the user from seeing extra blocks into which they could attempt
				// to copy another field which breaks our rule of one component per block!
				elem.find("[id^='formdesigner-block-empty-']").each(function ()
				{
					$('#' + this.id).remove();
				});
			}
		}
	},

	DrawLayoutFrameworkFields: function ()
	{
		var fields = ctrlFormDesignerModal.Data.CurrentTab.Layout.Fields;
		if (fields)
		{
			for (var i = 0; i < fields.length; i++)
			{
				var field = fields[i];

				var sHTML = ctrlFormDesignerModal.Fields.GetFieldToolboxItemHTML(field);

				var elem = $('#' + field.Location);
				elem.prepend(sHTML);

				// Set it's height
				var sFieldDOMid = 'field-name-' + field.ID + '-' + field.GUID;
				var elemField = $('#' + sFieldDOMid)
				elemField.css('height', ctrlFormDesignerModal.Settings.CellHeight);

				// The toolbox margin must be set to design-time layout also
				elemField.css('margin-bottom', '20px');

				// We do not want the outer 2 x DIV's as these are only for toolbox items
				elemField.unwrap(); // <div class="form-group field-tool-form-group" data-children-count="1">
				elemField.unwrap(); //  <div class="column" id="formdesigner-field-tool-{{fieldID}}" trisys-field-id="{{fieldID}}" trisys-field-guid="{{GUID}}">

				// Show it's configuration button menu
				var sFieldConfigureDOMid = 'formdesigner-field-edit-tool-' + field.ID + '-' + field.GUID;
				$('#' + sFieldConfigureDOMid).show();

				// Important: Remove any 'empty' blocks in the same row/col as this field
				// to prevent the user from seeing extra blocks into which they could attempt
				// to copy another field which breaks our rule of one field per block!
				elem.find("[id^='formdesigner-block-empty-']").each(function ()
				{
					$('#' + this.id).remove();
				});
			}
		}
	},

	// As the user edits the layout, the underlying framework will been redrawn.
	// This removes all possible rows and columns to keep things clean.
	DeleteExistingRowsAndColumnLayout: function ()
	{
		var iMaxRows = 32;

		for (var iRow = 1; iRow <= iMaxRows; iRow++)
		{
			var sRowTemplateID = 'draggable-blocks-row-';

			var rowID = sRowTemplateID + iRow;

			// Clear out and remove old row 
			$('#' + rowID).empty();
			$('#' + rowID).remove();
		}
	},

	// 02 May 2021: This has now become a recursive function
	// ctrlFormDesignerModal.DrawRowLayout((iRow + 1), row);
	DrawRowLayout: function (iRowNumber, row, sParentColumnID)
	{
		var sRowTemplateID = 'draggable-blocks-row-';
		var elem = document.getElementById(sRowTemplateID);
		if (!elem)
			return;

		var sRowTemplateHTML = elem.outerHTML;
		var sColumnTemplateID = 'formdesigner-block-row-template';
		elem = document.getElementById(sColumnTemplateID);
		if (!elem)
			return;

		var sColumnTemplateHTML = elem.outerHTML;

		var rowID = sRowTemplateID + iRowNumber;
		if (sParentColumnID)
			rowID += '-' + sParentColumnID;

		// Add this row to the DOM
		var sRowHTML = sRowTemplateHTML;
		sRowHTML = sRowHTML.replace(sRowTemplateID, rowID);
		sRowHTML = TriSysSDK.DocumentObjectModel.RemoveStyleDisplayNone(sRowHTML); //.replace('style="display:none;"', '');

		// Add to DOM
		var elemRowParent = $('#' + ctrlFormDesignerModal.Settings.EditorCanvasId);
		if (sParentColumnID)
		{
			// We are being called recursively, so we are now appending a row to this column
			elemRowParent = $('#' + sParentColumnID);
		}
		elemRowParent.append(sRowHTML);

		// Calculate the width of each column
		//var iEachColumnWidth = 12 / row.Columns;      Not in form designer where all columns can be different widths

		// Now add columns to this newly created DOM item
		var sColumnsHTML = '';
		for (var iColumn = 1; iColumn <= row.Columns.length; iColumn++)
		{
			var column = row.Columns[iColumn - 1];
			var sColumnHTML = sColumnTemplateHTML;

			var sColumnID = 'formdesigner-block-row-';
			if (sParentColumnID)
			{
				// We are being called recursively, so we are now drawing columns within rows which are within columns
				// We need therefore to ensure the parentage survives for uniqueness
				sColumnID = sParentColumnID + '-row-';
			}

			sColumnID += iRowNumber + '-column-' + iColumn;

			sColumnHTML = sColumnHTML.replace(sColumnTemplateID, sColumnID);
			sColumnHTML = TriSysSDK.DocumentObjectModel.RemoveStyleDisplayNone(sColumnHTML); //.replace('style="display:none;"', '');
			sColumnHTML = sColumnHTML.replace('{{ColWidth}}', column.Width);

			// Insert the empty block placeholder
			var sEmptyHTML = $("#ctrlFormDesignerModal-empty-block-html").html();
			var sGUID = TriSysSDK.Miscellaneous.GUID();
			sEmptyHTML = sEmptyHTML.replace("{{GUID}}", sGUID);

			if (column.Rows)
				sEmptyHTML = '';

			sColumnHTML = sColumnHTML.replace("{{EmptyBlockPlaceholder}}", sEmptyHTML);

			// Append this column to list of columns
			//sColumnsHTML += sColumnHTML + '\n';

			$('#' + rowID).append(sColumnHTML);		// No - draw the column now

			// 03 May 2021: Recursive call for all rows in this column
			if (column.Rows)
			{
				// Add each row in turn
				for (var iRow = 0; iRow < column.Rows.length; iRow++)
				{
					var columnRow = column.Rows[iRow];
					ctrlFormDesignerModal.DrawRowLayout((iRow + 1), columnRow, sColumnID);		// Recursion
				}
			}
		}

		//$('#' + rowID).append(sColumnsHTML);
	},

	// Edits are held in-memory during the tab edit, drag/drop, field operations.
	// Written to Web API only when requested to do so.
	//
	Data: // ctrlFormDesignerModal.Data
	{
		FileName: null, // Assigned in ctrlFormDesignerModal.Load
		LayoutJSON: null, // Assigned in ctrlFormDesignerModal.Load
		FormProperties:
		{
			Caption: 'Undefined',
			Icon: 'gi-warning_sign',
			EntityName: null,
			Type: null
		},
		TopMasterID: "TopMaster",
		TopMasterCaption: "Top/Master",
		WarningSignIcon: "gi gi-warning_sign",
		Tabs: [], // { Layout: { Rows: [], Components: [], Fields: [] } }
		CurrentTab: null,
		SelectedTabID: null, // Only used for undo/redo
		EditedPropertiesList: null // Used for popup property sheet for form, tabs, field and component
	},

	// Data functions must be kept separate as we copy data into temporary storage for undo/redo
	DataFunctions:
	{
		TabFromID: function (sTabID)
		{
			var tab = null;
			ctrlFormDesignerModal.Data.Tabs.forEach(function (tabby)
			{
				if (tabby.ID == sTabID)
					tab = tabby;
			});
			return tab;
		},

		TabIndexFromID: function (sTabID)
		{
			for (var i = 1; i < ctrlFormDesignerModal.Data.Tabs.length; i++)
			{
				var tab = ctrlFormDesignerModal.Data.Tabs[i];
				if (tab.ID == sTabID)
					return i;
			}
			return -1;
		}
	},

	ConfigureLayoutModal: // ctrlFormDesignerModal.ConfigureLayoutModal
	{
		Show: function ()
		{
			var rows = ctrlFormDesignerModal.Data.CurrentTab.Layout.Rows;
			if (!rows)
				return;

			var fnLoadModal = function ()
			{
				var parametersObject = new TriSysApex.UI.ShowMessageParameters();
				parametersObject.Title = "Configure Form Tab Layout";
				parametersObject.Image = "gi-adjust_alt";
				parametersObject.Maximize = true;
				parametersObject.CloseTopRightButton = true;

				parametersObject.ContentURL = TriSysApex.Constants.UserControlFolder + "ctrlFormLayout.html";

				// Callback
				parametersObject.OnLoadCallback = function ()
				{
					ctrlFormLayout.Load(rows);
				};

				parametersObject.ButtonCentreText = "Apply";
				parametersObject.ButtonCentreVisible = true;
				parametersObject.ButtonCentreFunction = function ()
				{
					var rows = ctrlFormLayout.Apply();
					debugger;
					if (rows)
					{
						// Draw this layout directly on the current tab
						ctrlFormDesignerModal.Data.CurrentTab.Layout.Rows = rows;

						// Save in history for undo/redo
						ctrlFormDesignerModal.Settings.History.Push(ctrlFormDesignerModal.Data);

						// Write tab back to the editable DOM 
						ctrlFormDesignerModal.ReadTabListFromMemoryToTabLayout();
					}
					return (rows ? true : false);
				};
				parametersObject.ButtonRightText = "Cancel";
				parametersObject.ButtonRightVisible = true;

				TriSysApex.UI.PopupMessage(parametersObject);
			};

			TriSysApex.WhiteLabelling.LoadJavascriptFile('js/pages/ctrlFormLayout.js', null, fnLoadModal);
		}
	},

	//RelocateExistingComponentsAndFieldsAfterRowColumnOperation: function (iRow, iColumn) // ctrlFormDesignerModal.RelocateExistingComponentsAndFieldsAfterRowColumnOperation
	//{
	//	if (ctrlFormDesignerModal.Data.CurrentTab.Layout.Components)
	//	{
	//		ctrlFormDesignerModal.Data.CurrentTab.Layout.Components.forEach(function (component)
	//		{
	//			var componentRowCol = ctrlFormDesignerModal.ParseBlockID(component.Location);
	//			if (componentRowCol.row == iRow)
	//			{
	//				// On the same row                        

	//				// Relocate component to the correct column index
	//				if (componentRowCol.column > iColumn)
	//					component.Location = "formdesigner-block-row-" + iRow + "-column-" + (componentRowCol.column - 1);
	//			}
	//		});
	//	}
	//	if (ctrlFormDesignerModal.Data.CurrentTab.Layout.Fields)
	//	{
	//		ctrlFormDesignerModal.Data.CurrentTab.Layout.Fields.forEach(function (field)
	//		{
	//			var fieldRowCol = ctrlFormDesignerModal.ParseBlockID(field.Location);
	//			if (fieldRowCol.row == iRow)
	//			{
	//				// On the same row                        

	//				// Relocate component to the correct column index
	//				if (fieldRowCol.column > iColumn)
	//					field.Location = "formdesigner-block-row-" + iRow + "-column-" + (fieldRowCol.column + 1);
	//			}
	//		});
	//	}
	//},

	// A row has been deleted, so move all rows beneath this up by 1
	RelocateExistingComponentsAndFieldsAfterDeleteRowOperation: function (rowColMatrix)
	{
		// Which row/col is the root?
		var sDeletedBlockID = ctrlFormDesignerModal.MatrixToBlockID(rowColMatrix);

		// e.g. sRoot = "formdesigner-block-row-2-column-1-row-1-column-2"
		//												       ^	
		//												       |
		// This means that all rows which are higher than this ^ index/position are reduced by 1

		var lstObjectLists = [ctrlFormDesignerModal.Data.CurrentTab.Layout.Components, ctrlFormDesignerModal.Data.CurrentTab.Layout.Fields];
		lstObjectLists.forEach(function (lstObject)
		{
			if (lstObject)
			{
				for (var i = lstObject.length - 1; i >= 0; i--)
				{
					var object = lstObject[i];
					var objectRowColMatrix = ctrlFormDesignerModal.ParseBlockID(object.Location);
					var bSameRow = ctrlFormDesignerModal.isMatrixRelationshipSibling(rowColMatrix, objectRowColMatrix);
					if (bSameRow)
					{
						// On the same row so delete it                       
						lstObject.splice(i, 1);
					}
				}

				// All objects below this will also need to be moved up
				lstObject.forEach(function (object)
				{
					var objectRowColMatrix = ctrlFormDesignerModal.ParseBlockID(object.Location);
					var bRowInSameColumn = ctrlFormDesignerModal.isMatrixRelationshipChildRow(rowColMatrix, objectRowColMatrix);
					if (bRowInSameColumn)
					{
						// Relocate object to the correct row index
						objectRowColMatrix[rowColMatrix.length - 1].Row -= 1;
						object.Location = ctrlFormDesignerModal.MatrixToBlockID(objectRowColMatrix);
					}
				});
			}
		});
	},

	RelocateExistingComponentsAndFieldsAfterMovingRowUpOperation: function (lstFromToMatrix)
	{
		var lstObjectLists = [ctrlFormDesignerModal.Data.CurrentTab.Layout.Components, ctrlFormDesignerModal.Data.CurrentTab.Layout.Fields];
		lstObjectLists.forEach(function (lstObject)
		{
			if (lstObject)
			{
				lstObject.forEach(function (object)
				{
					for (var i = lstFromToMatrix.length - 1; i >= 0; i--)
					{
						var fromToMatrix = lstFromToMatrix[i];
						var sLocation = ctrlFormDesignerModal.MatrixToBlockID(fromToMatrix.from);
						if (sLocation == object.Location)
						{
							object.Location = ctrlFormDesignerModal.MatrixToBlockID(fromToMatrix.to);

							// Remove from list so as to not interfere in next object iteration
							lstFromToMatrix.splice(i, 1);
							break;
						}
					}
				});				
			}
		});
	},

	RelocateExistingComponentsAndFieldsAfterAddingNewRowOperation: function (iAfterRowIndex)
	{
		if (ctrlFormDesignerModal.Data.CurrentTab.Layout.Components)
		{
			ctrlFormDesignerModal.Data.CurrentTab.Layout.Components.forEach(function (component)
			{
				var componentRowCol = ctrlFormDesignerModal.ParseBlockID(component.Location);
				if (componentRowCol.row > iAfterRowIndex)
				{
					// Relocate component to the correct row index
					if (componentRowCol.row > iAfterRowIndex)
						component.Location = "formdesigner-block-row-" + (componentRowCol.row + 1) + "-column-" + componentRowCol.column;
				}
			});
		}

		if (ctrlFormDesignerModal.Data.CurrentTab.Layout.Fields)
		{
			ctrlFormDesignerModal.Data.CurrentTab.Layout.Fields.forEach(function (field)
			{
				var fieldRowCol = ctrlFormDesignerModal.ParseBlockID(field.Location);
				if (fieldRowCol.row > iAfterRowIndex)
				{
					// Relocate field to the correct row index
					if (fieldRowCol.row > iAfterRowIndex)
						field.Location = "formdesigner-block-row-" + (fieldRowCol.row + 1) + "-column-" + fieldRowCol.column;
				}
			});
		}
	},

	// Object is either a component or a field.
	// Use a popup property sheet for capturing properties.
	// Each field/component type has different properties 
	// e.g. max/min/increment for numeric spinners, or date format for date/time controls etc...
	// 
	//
	ConfigureObject: function (sGUID)
	{
		var field = ctrlFormDesignerModal.Persistence.GetFieldOnCurrentTabByGUID(sGUID);
		var component = ctrlFormDesignerModal.Persistence.GetComponentOnCurrentTabByGUID(sGUID);
		var objectProperties = null,
			objectName = null;
		var bField = field ? true : false;
		var bComponent = !bField;
		var sWhat = bField ? "field" : "component";
		var sIcon = bField ? "gi-wrench" : "gi-magic";
		var sValueType = "TextBox",
			objectValue = null;
		var sObjectType = null;

		if (component)
		{
			if (!component.Properties)
				component.Properties = {};

			objectProperties = JSON.parse(JSON.stringify(component.Properties)); // Copy of the actual properties so that only apply overwrites
			objectName = component.ID;

			// Need to know the data type of the component
			var componentObject = ctrlFormDesignerModal.Components.GetComponentByID(component.ID);
			if (componentObject)
			{
				objectName = componentObject.Name;
				sIcon = componentObject.Icon;
				sObjectType = componentObject.ID;
				if (componentObject.Properties && componentObject.Properties.TriSysField)
					sObjectType = componentObject.Properties.TriSysField.Type;
			}
		}
		else if (field)
		{
			if (!field.Properties)
				field.Properties = {};

			objectProperties = JSON.parse(JSON.stringify(field.Properties)); // Copy of the actual properties so that only apply overwrites
			objectName = field.ID;

			// Need to know the data type of the field
			var fieldDescription = ctrlFormDesignerModal.Fields.GetFieldByID(field.ID);
			if (fieldDescription)
			{
				sObjectType = TriSysSDK.CShowForm.TriSysFieldTypeIdToString(fieldDescription);
			}
		}

		objectValue = objectProperties.Value;

		// The underlying field type dictates what properties are editable
		var additionalStuff = ctrlFormDesignerModal.GetAdditionalObjectEditProperties(sObjectType, objectValue, sValueType, objectProperties, bComponent);

		var lstAdditionalProperties = additionalStuff.AdditionalProperties;
		sValueType = additionalStuff.Type;
		objectValue = additionalStuff.Value;

		var sheetProperties = [
			{
				"Name": "Value",
				"Description": [
					"The default value of the " + sWhat
				],
				"Type": sValueType,
				"Default": objectValue
			},
			{
				"Name": "Visible",
				"Description": [
					"Whether the " + sWhat + " is visible or not"
				],
				"Type": "Boolean",
				"Title": "",
				"Default": objectProperties.Visible
			}];

		// Add additional properties
		lstAdditionalProperties.forEach(function (property)
		{
			sheetProperties.push(property);
		});


		// The popup property sheet dialogue options
		var options = {
			Title: TriSysSDK.Miscellaneous.CamelCase(sWhat, true) + ": " + objectName,
			Image: sIcon,
			SubTitle: "Properties",
			Items: sheetProperties,

			FieldValueChange: function (sCategory, sName, objValue)
			{
				// Store each change in-memory, and apply when required
				objectProperties[sName] = objValue;
			},

			// Apply tab changes to editor
			Apply: function ()
			{
				// Apply in-memory changes
				if (objectProperties)
				{
					// Overwrite
					if (component)
						component.Properties = objectProperties;
					else
						field.Properties = objectProperties;

					// Save in history for undo/redo
					ctrlFormDesignerModal.Settings.History.Push(ctrlFormDesignerModal.Data);

					return true;
				}
				else
					TriSysApex.UI.ShowMessage("Please edit " + sWhat + " properties.");
			}
		};

		// Open the property sheet to edit the specific properties of this specific component/field
		ctrlFormDesignerModal.OpenPropertySheet(options);
	},

	// Which properties are editable on the component/field popup?
	GetAdditionalObjectEditProperties: function (sObjectType, objectValue, sValueType, objectProperties, bComponent)
	{
		var lstAdditionalProperties = [];

		if (sObjectType)
		{
			switch (sObjectType)
			{
				case 'contact':
					sValueType = "Contact";
					lstAdditionalProperties.push(
						{
							"Name": "Pick",
							"Description": [
								"Whether the control can be used to pick a contact"
							],
							"Type": "Boolean",
							"Caption": "Picker",
							"Default": objectProperties.Pick
						});
					lstAdditionalProperties.push(
						{
							"Name": "Open",
							"Description": [
								"Whether the control can be used to open a contact"
							],
							"Type": "Boolean",
							"Caption": "Open",
							"Default": objectProperties.Open
						});
					lstAdditionalProperties.push(
						{
							"Name": "Delete",
							"Description": [
								"Whether the contact can be removed from the picker"
							],
							"Type": "Boolean",
							"Caption": "Delete",
							"Default": objectProperties.Delete
						});
					break;

				case 'company':
					sValueType = "Company";
					lstAdditionalProperties.push(
						{
							"Name": "Pick",
							"Description": [
								"Whether the control can be used to pick a company"
							],
							"Type": "Boolean",
							"Caption": "Picker",
							"Default": objectProperties.Pick
						});
					lstAdditionalProperties.push(
						{
							"Name": "Open",
							"Description": [
								"Whether the control can be used to open a company"
							],
							"Type": "Boolean",
							"Caption": "Open",
							"Default": objectProperties.Open
						});
					lstAdditionalProperties.push(
						{
							"Name": "Delete",
							"Description": [
								"Whether the company can be removed from the picker"
							],
							"Type": "Boolean",
							"Caption": "Delete",
							"Default": objectProperties.Delete
						});
					break;

				case 'currencyamount':
					sValueType = "CurrencyAmount";
					break;

				case 'currencyamountperiod':
					sValueType = "CurrencyAmountPeriod";
					break;

				case 'date':
					sValueType = "Date";
					break;

				case 'datetime':
					sValueType = "DateTime";
					break;

				case 'file':
					sValueType = "File";
					lstAdditionalProperties.push(
						{
							"Name": "Upload",
							"Description": [
								"Whether the control can be used to upload a file"
							],
							"Type": "Boolean",
							"Caption": "Upload",
							"Default": objectProperties.Upload
						});
					lstAdditionalProperties.push(
						{
							"Name": "Open",
							"Description": [
								"Whether the control can be used to open the uploaded file"
							],
							"Type": "Boolean",
							"Caption": "Open",
							"Default": objectProperties.Open
						});
					lstAdditionalProperties.push(
						{
							"Name": "Delete",
							"Description": [
								"Whether the file can be removed"
							],
							"Type": "Boolean",
							"Caption": "Delete",
							"Default": objectProperties.Delete
						});
					break;

				case 'internet':
					sValueType = "WebPage";
					break;

				case 'label':
					lstAdditionalProperties.push(
						{
							"Name": "Bold",
							"Description": [
								"Whether the label text is bold"
							],
							"Type": "Boolean",
							"Title": "",
							"Default": objectProperties.Bold
						});
					break;

				case 'numeric':
					sValueType = "Float";
					lstAdditionalProperties.push(
						{
							"Name": "Integer",
							"Description": [
								"An integer will capture whole numbers only"
							],
							"Type": "Boolean",
							"Title": "",
							"Default": objectProperties.Integer
						});
					lstAdditionalProperties.push(
						{
							"Name": "MaximumValue",
							"Caption": "Maximum Value",
							"Description": [
								"The highest number which can be entered"
							],
							"Type": "Float",
							"Default": objectProperties.MaximumValue
						});
					lstAdditionalProperties.push(
						{
							"Name": "MinimumValue",
							"Caption": "Minimum Value",
							"Description": [
								"The lowest number which can be entered"
							],
							"Type": "Float",
							"Default": objectProperties.MinimumValue
						});
					lstAdditionalProperties.push(
						{
							"Name": "SpinIncrement",
							"Caption": "Spin Increment",
							"Description": [
								"When using the up/down arrows, this is the amount by which the number increases or decreases"
							],
							"Type": "Float",
							"Default": objectProperties.SpinIncrement
						});
					break;

				case 'telephone':
					sValueType = "TelNo";
					break;

				case 'textbox':
				case 'textboxmultiline':
					var bMultiLineProperties = (sObjectType == "textboxmultiline" || bComponent);
					if (bMultiLineProperties)
					{
						lstAdditionalProperties.push(
							{
								"Name": "MultiLine",
								"Description": [
									"Whether the text box can accept multiple lines of input"
								],
								"Type": "Boolean",
								"Caption": "Multi Line",
								"Default": objectProperties.MultiLine
							});
						lstAdditionalProperties.push(
							{
								"Name": "Rows",
								"Description": [
									"Number of rows in the multi-line text box"
								],
								"Type": "Integer",
								"Default": objectProperties.Rows
							});
					}
					break;

				case 'usercombo':
					sValueType = "User";
					break;

				case 'yesno', 'checkbox':
					sValueType = "Boolean";
					objectValue = TriSysAPI.Operators.stringToBoolean(objectValue, false);
					break;

				case "button":
					lstAdditionalProperties.push(
						{
							"Name": "Icon",
							"Description": [
								"The icon shown to the left of the button caption"
							],
							"Type": "Icon",
							"Title": "Icon",
							"Default": objectProperties.Icon
						});
					break;
			}
		}

		// Return 3 things
		return {
			AdditionalProperties: lstAdditionalProperties,
			Value: objectValue,
			Type: sValueType
		};
	},

	// Drop down menu on empty block - used to add a component, resize etc..
	ConfigureBlock: function (sFunction, thisObject)
	{
		// Determine who our parent cell block is
		var sEmptyBlockID = $(thisObject).parent().parent().parent().parent().parent().attr('id');
		var cellBlock = $('#' + sEmptyBlockID).parent();
		var sCellBlockID = cellBlock.attr("id");

		// Get the row and column indexes i.e. multi-hierarchy rows within columns within rows within columns etc...
		var rowColMatrix = ctrlFormDesignerModal.ParseBlockID(sCellBlockID);
		if (!rowColMatrix)
			return;

		var sSummary = '<br>' + 'Matrix: ' + rowColMatrix.length + ' blocks deep:';
		rowColMatrix.forEach(function (block)
		{
			sSummary += '<br> Row:' + block.Row + ', Col:' + block.Col;
		});
		//TriSysApex.UI.ShowMessage(sFunction + ": " + sCellBlockID + sSummary);
		// Add Row: formdesigner-block-row-1-column-2-row-3-column-4-row-5-column-6
		// Matrix: 3 blocks deep:
		// Row: 1, Col: 2 
		// Row: 3, Col: 4
		// Row: 5, Col: 6

		// Specific functions
		switch (sFunction)
		{
			case 'Configure Component':
			case 'Configure Field':
				var sType = (sFunction == 'Configure Component') ? 'component' : 'field';
				var sObjectID = cellBlock.children().attr("trisys-" + sType + "-id");
				var sGUID = cellBlock.children().attr("trisys-" + sType + "-guid");
				console.log(sFunction + ": " + sType + ": " + sObjectID + " [" + sGUID + "] at " + sCellBlockID + sSummary);
				ctrlFormDesignerModal.ConfigureObject(sGUID);
				return;

			case 'Add Component':
				// Popup component selector
				// TODO
				TriSysApex.UI.ShowMessage(sFunction + ": " + sCellBlockID + sSummary);
				break;

			case 'Add Field':
				// Popup field selector
				// TODO
				TriSysApex.UI.ShowMessage(sFunction + ": " + sCellBlockID + sSummary);
				break;

			case 'Decrease Width':
				// Decrease the current column width by 1 unit if greater than 1
				ctrlFormDesignerModal.ChangeColumnWidth(false, rowColMatrix);
				break;

			case 'Increase Width':
				// Increase the current column width by 1 unit if less than 12
				ctrlFormDesignerModal.ChangeColumnWidth(true, rowColMatrix);
				break;

			case 'Add Column':
				// Add another block to this row
				ctrlFormDesignerModal.AddColumnToMatrix(rowColMatrix);
				break;

			//case 'Move Column Right':
			//    break;

			case 'Delete Column':
				// Delete this cell by removing component/field/empty block and reducing the number of column in this row
				ctrlFormDesignerModal.DeleteColumnFromMatrix(rowColMatrix);
				break;

			case 'Add Column Row':
				// 02 May 2021: This will now add a new row INSIDE the current column
				ctrlFormDesignerModal.AddColumnRows(rowColMatrix, 2);
				break;

			case 'Duplicate Row':
				// 03 May 2021: New functionality to allow current row to be duplicated beneath it
				// Ignore components and fields - this is only layout we will copy
				ctrlFormDesignerModal.DuplicateCurrentRow(rowColMatrix);
				break;

			case 'Delete Row':
				// Delete this row and all columns
				ctrlFormDesignerModal.DeleteRow(rowColMatrix);
				break;

			case 'Move Row Up':
				debugger;
				// e.g. rowColMatrix = [ { 1, 1 }, { 2, 2 } ]
				// We therefore want to relocate components/fields as follows:
				// [ { 1, 1 }, { 1, 1 } ] ==> [ { 1, 1 }, { 2, 1 } ]
				// [ { 1, 1 }, { 1, 2 } ] ==> [ { 1, 1 }, { 2, 2 } ]
				// [ { 1, 1 }, { 1, 3 } ] ==> [ { 1, 1 }, { 2, 3 } ]
				// ..
				// [ { 1, 1 }, { 1, N } ] ==> [ { 1, 1 }, { 2, N } ]
				// and 
				// [ { 1, 1 }, { 2, 1 } ] ==> [ { 1, 1 }, { 1, 1 } ]
				// [ { 1, 1 }, { 2, 2 } ] ==> [ { 1, 1 }, { 1, 2 } ]
				// [ { 1, 1 }, { 2, 3 } ] ==> [ { 1, 1 }, { 1, 3 } ]
				// ..
				// [ { 1, 1 }, { 2, N } ] ==> [ { 1, 1 }, { 1, N } ]

				var lastPosition = rowColMatrix[rowColMatrix.length - 1];
				if (lastPosition.Row == 1)
				{
					TriSysApex.UI.ShowMessage("Row is already at the top of the column block.");
					return;
				}

				var rowsInSameColumn = ctrlFormDesignerModal.GetRowsInSameColumn(rowColMatrix);

				var lstInterchangeRow = [];
				for (var i = 1; i <= rowsInSameColumn.length; i++)
				{
					var row = rowsInSameColumn[i - 1];
					if (i == (lastPosition.Row - 1))
					{
						// Switch these around
						var tmpRow = rowsInSameColumn[i - 1];
						rowsInSameColumn[i - 1] = rowsInSameColumn[i];
						rowsInSameColumn[i] = tmpRow;
						lstInterchangeRow.push(rowsInSameColumn[i]);
						lstInterchangeRow.push(rowsInSameColumn[i - 1]);
						i++;
					}
				}

				// Interchange the components/fields on these two rows
				var lstFromToMatrix = [];
				for (var i = 1; i <= 12; i++)
				{
					var itemFrom = JSON.parse(JSON.stringify(rowColMatrix));
					itemFrom[rowColMatrix.length - 1].Col = i;
					var itemTo = JSON.parse(JSON.stringify(rowColMatrix));
					itemTo[rowColMatrix.length - 1].Row -= 1;
					itemTo[rowColMatrix.length - 1].Col = i;
					lstFromToMatrix.push({ from: itemFrom, to: itemTo });

					var itemFromBefore = JSON.parse(JSON.stringify(rowColMatrix));
					itemFromBefore[rowColMatrix.length - 1].Row -= 1;
					itemFromBefore[rowColMatrix.length - 1].Col = i;
					var itemToBefore = JSON.parse(JSON.stringify(rowColMatrix));
					itemToBefore[rowColMatrix.length - 1].Col = i;
					lstFromToMatrix.push({ from: itemFromBefore, to: itemToBefore });
				}
				ctrlFormDesignerModal.RelocateExistingComponentsAndFieldsAfterMovingRowUpOperation(lstFromToMatrix);
				break;

		} // switch

		// Save in history for undo/redo
		ctrlFormDesignerModal.Settings.History.Push(ctrlFormDesignerModal.Data);

		// Write tab back to the editable DOM 
		ctrlFormDesignerModal.ReadTabListFromMemoryToTabLayout();
	},

	// Add an additional row inside the specified matrix column
	// Pure maths - no DOM magic!
	AddColumnRows: function (rowColMatrix, iNumberOfColumns)
	{
		var rows = ctrlFormDesignerModal.Data.CurrentTab.Layout.Rows;
		if (!rows)
			return;

		// Hard coded limit of rows. Remember that the top row has no parent row/col matrix
		if (rowColMatrix.length >= (ctrlFormDesignerModal.Settings.MaximumRowDepth - 1))
		{
			var sMessage = "Maximum nested inner rows is " + ctrlFormDesignerModal.Settings.MaximumRowDepth + "." +
				"<br>" + "If you require greater granularity, use a multi-column component.";
			TriSysApex.UI.ShowMessage(sMessage);
			return;
		}


		// Enumerate to the column
		var row = rows[rowColMatrix[0].Row - 1];
		var col = row.Columns[rowColMatrix[0].Col - 1];
		for (var i = 1; i < rowColMatrix.length; i++)
		{
			row = col.Rows[rowColMatrix[i].Row - 1];
			col = row.Columns[rowColMatrix[i].Col - 1];
		}

		// Add the new row here
		var newRow = { Columns: [{ Width: 6 }, { Width: 6 }] };
		col.Rows = [newRow];
	},

	// Allow current row to be duplicated beneath the same parent column
	// Have to be aware that rows may be within columns within a row so we must duplicate the right row.
	// 
	DuplicateCurrentRow: function (rowColMatrix)
	{
		var rows = ctrlFormDesignerModal.Data.CurrentTab.Layout.Rows;
		if (!rows)
			return;

		// Enumerate to the column
		var iRowIndex1Based = rowColMatrix[0].Row;
		var row = rows[iRowIndex1Based - 1];
		var col = row.Columns[rowColMatrix[0].Col - 1];
		var parentCol = null, parentOfRow = null;
		for (var i = 1; i < rowColMatrix.length; i++)
		{
			parentOfRow = row;
			parentCol = col;
			iRowIndex1Based = rowColMatrix[i].Row;
			row = col.Rows[iRowIndex1Based - 1];
			col = row.Columns[rowColMatrix[i].Col - 1];
		}

		var duplicateRow = JSON.parse(JSON.stringify(row));
		if (!parentOfRow)
		{
			// This is a top level row
			parentOfRow = rows;
			//parentOfRow.push(duplicateRow);							// Add to end
			var iCurrentRowIndex = rowColMatrix[0].Row - 1;
			parentOfRow.splice(iCurrentRowIndex, 0, duplicateRow);		// Add after duplicated row
		}
		else
		{
			if (!parentCol.Rows)
				parentCol.Rows = [];

			//parentCol.Rows.push(duplicateRow);						// Add to end
			parentCol.Rows.splice(iRowIndex1Based, 0, duplicateRow);	// Add after duplicated row
		}


		// An added complication with adding rows/columns is that the component/field location assigned to those after will need to change also
		// TODO Garry!
		//ctrlFormDesignerModal.RelocateExistingComponentsAndFieldsAfterRowColumnOperation(rowCol.row, rowCol.column);
	},

	// Column menu options increase/decrease width
	ChangeColumnWidth: function (bIncrease, rowColMatrix)
	{
		var rows = ctrlFormDesignerModal.Data.CurrentTab.Layout.Rows;

		// Enumerate to the column
		var iRowIndex1Based = rowColMatrix[0].Row;
		var iColIndex1Based = rowColMatrix[0].Col;
		var row = rows[iRowIndex1Based - 1];
		var col = row.Columns[iColIndex1Based - 1];
		for (var i = 1; i < rowColMatrix.length; i++)
		{
			iRowIndex1Based = rowColMatrix[i].Row;
			iColIndex1Based = rowColMatrix[i].Col;
			row = col.Rows[iRowIndex1Based - 1];
			col = row.Columns[iColIndex1Based - 1];
		}

		if (bIncrease)
		{
			var bSomeOtherColumnsGreaterThanOne = false;
			for (var i = 1; i <= row.Columns.length; i++)
			{
				if (i != iColIndex1Based)
				{
					var column = row.Columns[i - 1];
					if (column.Width > 1)
						bSomeOtherColumnsGreaterThanOne = true;
				}
			}

			if (col.Width == 12 || row.Columns.length == 12 || !bSomeOtherColumnsGreaterThanOne)
				return;

			col.Width += 1;

			// Find any which are > 1 in width after this column and shrink it 
			var bShrunkAnother = false;
			for (var i = iColIndex1Based + 1; i <= row.Columns.length; i++)
			{
				var column = row.Columns[i - 1];
				if (column.Width > 1)
				{
					column.Width -= 1;
					bShrunkAnother = true;
					break;
				}
			}

			if (!bShrunkAnother)
			{
				// Start from left column and work towards first one
				for (var i = iColIndex1Based - 1; i >= 1; i--)
				{
					var column = row.Columns[i - 1];
					if (column.Width > 1)
					{
						column.Width -= 1;
						break;
					}
				}
			}
		}
		else
		{
			if (col.Width == 1 || row.Columns.length == 1)
				return;

			col.Width -= 1;

			// Find any after this column and increase their width
			var bGrownAnother = false;
			for (var i = iColIndex1Based + 1; i <= row.Columns.length; i++)
			{
				var column = row.Columns[i - 1];
				column.Width += 1;
				bGrownAnother = true;
				break;
			}

			if (!bGrownAnother)
			{
				// Start from left column and work towards first one
				for (var i = iColIndex1Based - 1; i >= 1; i--)
				{
					var column = row.Columns[i - 1];
					column.Width += 1;
					break;
				}
			}
		}
	},

	AddColumnToMatrix: function (rowColMatrix)
	{
		var rows = ctrlFormDesignerModal.Data.CurrentTab.Layout.Rows;

		// Enumerate to the column
		var iRowIndex1Based = rowColMatrix[0].Row;
		var iColIndex1Based = rowColMatrix[0].Col;
		var row = rows[iRowIndex1Based - 1];
		var col = row.Columns[iColIndex1Based - 1];
		for (var i = 1; i < rowColMatrix.length; i++)
		{
			iRowIndex1Based = rowColMatrix[i].Row;
			iColIndex1Based = rowColMatrix[i].Col;
			row = col.Rows[iRowIndex1Based - 1];
			col = row.Columns[iColIndex1Based - 1];
		}

		if (row.Columns.length == 12)
			return;

		// Insert a 1 width column after the current position, and reduce the width of the current one by 1,
		// unless it is already 1, in which case reduce the width of the first 2 or more to the left
		var newCol = {
			"Width": 1
		};
		row.Columns.splice(iColIndex1Based, 0, newCol);
		for (var i = iColIndex1Based; i >= 1; i--)
		{
			var column = row.Columns[i - 1];
			if (column.Width > 1)
			{
				column.Width -= 1;
				break;
			}
		}

		// An added complication with adding columns and fields is that the component/field location assigned to those after will need to change also
		// TODO
		//ctrlFormDesignerModal.RelocateExistingComponentsAndFieldsAfterRowColumnOperation(rowCol.row, rowCol.column);
	},

	DeleteColumnFromMatrix: function (rowColMatrix)
	{
		var rows = ctrlFormDesignerModal.Data.CurrentTab.Layout.Rows;

		// Enumerate to the column
		var iRowIndex1Based = rowColMatrix[0].Row;
		var iColIndex1Based = rowColMatrix[0].Col;
		var row = rows[iRowIndex1Based - 1];
		var col = row.Columns[iColIndex1Based - 1];
		for (var i = 1; i < rowColMatrix.length; i++)
		{
			iRowIndex1Based = rowColMatrix[i].Row;
			iColIndex1Based = rowColMatrix[i].Col;
			row = col.Rows[iRowIndex1Based - 1];
			col = row.Columns[iColIndex1Based - 1];
		}

		if (row.Columns.length == 12)
			return;

		if (iColIndex1Based == row.Columns.length)
		{
			// The last column
			if (iColIndex1Based == 1)
			{
				// It's a row deletion
				//TriSysApex.UI.ShowMessage("Please delete the entire row.");
				ctrlFormDesignerModal.DeleteRow(rowColMatrix);
				return;
			}
		}

		if (iColIndex1Based == 1)
		{
			// Make next one wider
			row.Columns[iColIndex1Based].Width += col.Width;
		}
		else
		{
			// Make previous one wider
			row.Columns[iColIndex1Based - 2].Width += col.Width
		}

		// Remove this column
		row.Columns.splice(iColIndex1Based - 1, 1);

		// An added complication with deleting columns is that the component/field location assigned to it will need to change also
		// TODO
		//ctrlFormDesignerModal.RelocateExistingComponentsAndFieldsAfterRowColumnOperation(rowCol.row, rowCol.column);
	},

	DeleteRow: function (rowColMatrix)
	{
		var rows = ctrlFormDesignerModal.Data.CurrentTab.Layout.Rows;

		// Enumerate to the column
		var iRowIndex1Based = rowColMatrix[0].Row;
		var iColIndex1Based = rowColMatrix[0].Col;
		var row = rows[iRowIndex1Based - 1];
		var col = row.Columns[iColIndex1Based - 1];
		var parentCol = null;
		for (var i = 1; i < rowColMatrix.length; i++)
		{
			parentCol = col;
			iRowIndex1Based = rowColMatrix[i].Row;
			iColIndex1Based = rowColMatrix[i].Col;
			row = col.Rows[iRowIndex1Based - 1];
			col = row.Columns[iColIndex1Based - 1];
		}

		var bRemovingEntireColumn = false;
		if (parentCol)
		{
			// Column row
			parentCol.Rows.splice(iRowIndex1Based - 1, 1);

			// If no rows left, remove this column
			if (parentCol.Rows.length == 0)
				bRemovingEntireColumn = true;
		}
		else
		{
			// Top level row
			rows.splice(iRowIndex1Based - 1, 1);
		}

		// An added complication with deleting rows is that the component location assigned to it will need to be removed also
		ctrlFormDesignerModal.RelocateExistingComponentsAndFieldsAfterDeleteRowOperation(rowColMatrix);

		// Important this is done after relocation componants/fields above
		if (bRemovingEntireColumn)
		{
			rowColMatrix.splice(rowColMatrix.length - 1, 1);
			ctrlFormDesignerModal.DeleteColumnFromMatrix(rowColMatrix);
		}
	},

	// Called from menu items to add a row beneath the specified row index, or at the end
	AddNewRow: function (iColumnCount, iAfterRowIndex)
	{
		var rows = ctrlFormDesignerModal.Data.CurrentTab.Layout.Rows;
		if (!rows)
			return;

		if (!iAfterRowIndex)
			iAfterRowIndex = rows.length;

		var columns = [];
		var lstColumnWidth = [];
		switch (iColumnCount)
		{
			case 1:
				lstColumnWidth = [12];
				break;
			case 2:
				lstColumnWidth = [6, 6];
				break;
			case 3:
				lstColumnWidth = [4, 4, 4];
				break;
			case 4:
				lstColumnWidth = [3, 3, 3, 3];
				break;
			case 5:
				lstColumnWidth = [3, 2, 2, 2, 3];
				break;
			case 6:
				lstColumnWidth = [2, 2, 2, 2, 2, 2];
				break;
			case 7:
				lstColumnWidth = [2, 2, 1, 1, 2, 2, 2];
				break;
			case 8:
				lstColumnWidth = [2, 2, 1, 1, 1, 1, 2, 2];
				break;
			case 9:
				lstColumnWidth = [2, 2, 1, 1, 1, 1, 1, 1, 2];
				break;
			case 10:
				lstColumnWidth = [2, 2, 1, 1, 1, 1, 1, 1, 1, 1];
				break;
			case 11:
				lstColumnWidth = [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
				break;
			case 12:
				lstColumnWidth = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
				break;
		}

		lstColumnWidth.forEach(function (iWidth)
		{
			columns.push(
				{
					"Width": iWidth
				});
		});

		var newRow = {
			"Columns": columns
		};
		rows.splice(iAfterRowIndex, 0, newRow);

		// All components below this will also need to be moved down
		ctrlFormDesignerModal.RelocateExistingComponentsAndFieldsAfterAddingNewRowOperation(iAfterRowIndex);

		// Save in history for undo/redo
		ctrlFormDesignerModal.Settings.History.Push(ctrlFormDesignerModal.Data);

		// Write tab back to the editable DOM 
		ctrlFormDesignerModal.ReadTabListFromMemoryToTabLayout();
	},

	// Parse "formdesigner-block-row-X-column-Y" to return { row: X, column Y }
	// 02 May 2021: This will need to be cleverer to cope with hierarchies of rows within columns within rows etc..
	// e.g. parse "formdesigner-block-row-X-column-Y-row-A-column-B-row-C-column-D{etc..}" 
	// to return [ { row: X, column Y }, { row: A, column B }, { row: C, column D } ]
	//
	ParseBlockID: function (sID)					// ctrlFormDesignerModal.ParseBlockID
	{
		var parts = sID.split("-row-");
		var iMatrixSize = parts.length;
		var blockMatrix = [];

		parts.splice(0, 1);
		parts.forEach(function (sPart)		// sPart="X-column-Y"
		{
			var matrixParts = sPart.split("-column-");
			var block = {
				Row: parseInt(matrixParts[0]),
				Col: parseInt(matrixParts[1])
			};
			blockMatrix.push(block);
		});
		return blockMatrix;
	},

	// The inverse of the above function i.e. return the BlockID from a row/col matrix
	MatrixToBlockID: function (rowColMatrix)		// ctrlFormDesignerModal.MatrixToBlockID
	{
		var sRoot = null;
		if (rowColMatrix)
		{
			// Which row/col is the root?
			var iRowIndex1Based = rowColMatrix[0].Row;
			var iColIndex1Based = rowColMatrix[0].Col;
			sRoot = "formdesigner-block-row-" + iRowIndex1Based + "-column-" + iColIndex1Based;
			for (var i = 1; i < rowColMatrix.length; i++)
			{
				iRowIndex1Based = rowColMatrix[i].Row;
				iColIndex1Based = rowColMatrix[i].Col;
				sRoot += "-row-" + iRowIndex1Based + "-column-" + iColIndex1Based;
			}
		}

		// e.g. sRoot = "formdesigner-block-row-2-column-1-row-1-column-2"
		return sRoot;
	},

	GetRowsInSameColumn: function (rowColMatrix)
	{
		var rows = ctrlFormDesignerModal.Data.CurrentTab.Layout.Rows;

		for (var i = 0; i < rowColMatrix.length; i++)
		{
			var rowColPosition = rowColMatrix[i];
			var row = rows[rowColPosition.Row - 1];
			var col = row.Columns[rowColPosition.Col - 1];
			if(col.Rows)
				rows = col.Rows;
		}

		return rows;
	},

	// For calculating when two blocks are in the same column
	// The second may have sub columns/rows but it must be a child
	isMatrixRelationshipSibling: function (parentRowColMatrix, childRowColMatrix)
	{
		var bInSameRow = false;
		if (childRowColMatrix.length >= parentRowColMatrix.length)
		{
			for (var i = 0; i < parentRowColMatrix.length; i++)
			{
				var parentRowCol = parentRowColMatrix[i];
				var childRowCol = childRowColMatrix[i];

				if (i < (parentRowColMatrix.length - 1))
				{
					// Must be in the same row col
					if (childRowCol.Row != parentRowCol.Row || childRowCol.Col != parentRowCol.Col)
						return false;
				}
				else
				{
					// The last matching row must equal
					if (childRowCol.Row == parentRowCol.Row)
						bInSameRow = true;
				}
			}
		}
		return bInSameRow;
	},

	isMatrixRelationshipChildRow: function (parentRowColMatrix, childRowColMatrix)
	{
		var bInGreaterRowOfSameColumn = false;
		if (childRowColMatrix.length >= parentRowColMatrix.length)
		{
			for (var i = 0; i < parentRowColMatrix.length; i++)
			{
				var parentRowCol = parentRowColMatrix[i];
				var childRowCol = childRowColMatrix[i];

				if (i < (parentRowColMatrix.length - 1))
				{
					// Must be in the same row col
					if (childRowCol.Row != parentRowCol.Row || childRowCol.Col != parentRowCol.Col)
						return false;
				}
				else
				{
					// The last matching row must be greater
					if (childRowCol.Row > parentRowCol.Row)
						bInGreaterRowOfSameColumn = true;
				}
			}
		}
		return bInGreaterRowOfSameColumn;
	},

	// Is the second parameter in the same column as the first?
	isMatrixRelationshipInSameColumn: function (rowColMatrixOfColumn, rowColMatrix)
	{
		var bInSameColumn = false;
		if (rowColMatrix.length >= rowColMatrixOfColumn.length)
		{
			for (var i = 0; i < rowColMatrixOfColumn.length; i++)
			{
				var rowColumn1 = rowColMatrixOfColumn[i];
				var rowColumn2 = rowColMatrix[i];

				if (i < (rowColMatrixOfColumn.length - 1))
				{
					// Must be in the same row col
					if (rowColumn1.Row != rowColumn2.Row || rowColumn1.Col != rowColumn2.Col)
						return false;
				}
				else
				{
					// The last matching row must be greater
					if (rowColumn1.Col == rowColumn2.Col)
						bInSameColumn = true;
				}
			}
		}
		return bInSameColumn;
	},

	// Maintain a history of Layout so that we can simply redo/undo
	UndoRedo: function (bUndo)
	{
		ctrlFormDesignerModal.Settings.History._PoppingOrPeeking = true;

		var data = null;
		if (bUndo)
		{
			// UNDO
			data = ctrlFormDesignerModal.Settings.History.Pop();
		}
		else
		{
			// REDO
			data = ctrlFormDesignerModal.Settings.History.Peek();
		}

		// Redraw tabs and design
		if (data)
		{
			ctrlFormDesignerModal.Data = data;

			// Refresh the entire form design including tabs
			ctrlFormDesignerModal.PopulateTabs();
		}

		ctrlFormDesignerModal.Settings.History._PoppingOrPeeking = false;
	},

	UndoRedoButtons: function () // ctrlFormDesignerModal.UndoRedoButtons
	{
		// Do undo/redo buttons
		//$('#ctrlFormDesignerModal-undo-layout').css('pointer-events', ctrlFormDesignerModal.Settings.History.CanGoBack() ? 'all': 'none');
		//$('#ctrlFormDesignerModal-redo-layout').css('pointer-events', ctrlFormDesignerModal.Settings.History.CanGoForward() ? 'all': 'none');

		$('#ctrlFormDesignerModal-undo-layout').attr('disabled', !ctrlFormDesignerModal.Settings.History.CanGoBack());
		$('#ctrlFormDesignerModal-redo-layout').attr('disabled', !ctrlFormDesignerModal.Settings.History.CanGoForward());
	},

	Persistence: // ctrlFormDesignerModal.Persistence
	{
	    // Both save and keep open, and save and close
	    // Called from developer studio
        //
	    Save: function (sFile)
	    {
	        // Get the current data structures which are to be persisted only
	        // and overwrite the file, perhaps storing a revision history 'just in case'?
	        ctrlFormDesignerModal.Data.FormProperties.Updated = moment().format("DDDD DD MMMM YYYY HH:mm");
	        ctrlFormDesignerModal.Data.FormProperties.Author = TriSysApex.LoginCredentials.UserCredentials().LoggedInUser.ForenameAndSurname +
	                                                            ', ' +TriSysApex.LoginCredentials.UserCredentials().LoggedInUser.CompanyName;

	        var data = {
	            FileName: ctrlFormDesignerModal.Data.FileName,
	            FormProperties: ctrlFormDesignerModal.Data.FormProperties,
	            Tabs: ctrlFormDesignerModal.Data.Tabs
            };
	        var sJSON = JSON.stringify(data);

	        var fnSaved = function ()
	        {
	            TriSysApex.Toasters.Success("Successfully saved: " +TriSysSDK.Controls.FileManager.GetFileNameFromPath(sFile));
	        };

	        DeveloperStudio.WebAPI.WriteFile(sFile, sJSON, fnSaved, false);
	    },

		// This is called to keep our knowledge of the layout and components/fields in sync only when we need it.
		// It is called before saving and also when user configures components/fields.
		//
		ReadCurrentTabLayoutIntoMemoryArray: function () // ctrlFormDesignerModal.Persistence.ReadCurrentTabLayoutIntoMemoryArray
		{
			// Because we do not wish to retain the component/field and locations as we do not get drag/drop events,
			// we must enumerate through the DOM now to determine each row, column, block and component/field.

			// Enumerate through all rows to find all components and fields
			var lstComponents = [], lstFields = [];

			// New algorithm trusts the DOM to know best!
			var elemCanvas = $('#' + ctrlFormDesignerModal.Settings.EditorCanvasId);
			elemCanvas.find("[id^='component-name-']").each(function ()
			{
				var sGUID = $(this).attr("trisys-component-guid");

				// Get component by GUID and update location
				var component = ctrlFormDesignerModal.Persistence.GetComponentOnCurrentTabByGUID(sGUID);

				if (component)
				{
					var sColumnBlockID = $(this).parent().attr("id");
					component.Location = sColumnBlockID;

					// Add to our new list of components
					lstComponents.push(component)
				}
			});

			elemCanvas.find("[id^='field-name-']").each(function ()
			{
				var sGUID = $(this).attr("trisys-field-guid");

				// Get field by GUID and update location
				var field = ctrlFormDesignerModal.Persistence.GetFieldOnCurrentTabByGUID(sGUID);

				if (field)
				{
					var sColumnBlockID = $(this).parent().attr("id");
					field.Location = sColumnBlockID;

					// Add to our new list of fields
					lstFields.push(field)
				}
			});
			

			// Now update lists
			ctrlFormDesignerModal.Data.CurrentTab.Layout.Components = lstComponents;
			ctrlFormDesignerModal.Data.CurrentTab.Layout.Fields = lstFields;
		},

		// This searches the current tab only 
		GetComponentOnCurrentTabByGUID: function (sGUID)
		{
			var layout = ctrlFormDesignerModal.Data.CurrentTab.Layout;
			if (layout)
			{
				var components = layout.Components;
				if (components)
				{
					for (var i = 0; i < components.length; i++)
					{
						var component = components[i];
						if (component.GUID == sGUID)
							return component;
					}
				}
			}
		},

		// This searches the current tab only 
		GetFieldOnCurrentTabByGUID: function (sGUID)
		{
			var layout = ctrlFormDesignerModal.Data.CurrentTab.Layout;
			if (layout)
			{
				var fields = layout.Fields;
				if (fields)
				{
					for (var i = 0; i < fields.length; i++)
					{
						var field = fields[i];
						if (field.GUID == sGUID)
							return field;
					}
				}
			}
		}

	}, // ctrlFormDesignerModal.Persistence

	Components: // ctrlFormDesignerModal.Components
	{
		// Called after the component picker has identified the component
		GetComponentsFromFile: function ()
		{
			// Read the .json file to get all component configuration and find a match before loading the component into the DOM
			var json = TriSysApex.Forms.Configuration.JsonFileData(ctrlFormDesignerModal.Settings.ComponentConfigurationFile);

			if (!json)
				return [];

			var components = json.Components;

			// ToDo: Read custom components 

			// Sort all by ID e.g. label, date, button etc..
			components.sort(function (a, b)
			{
				var s1 = a.ID;
				var s2 = b.ID;
				return s1.localeCompare(s2);
			});

			return components;
		},

		GetComponentByID: function (sID) // ctrlFormDesignerModal.Components.GetComponentByID
		{
			var foundComponent = null;
			ctrlFormDesignerModal.Components.GetComponentsFromFile().forEach(function (component)
			{
				if (component.ID == sID)
					foundComponent = component;
			});
			return foundComponent;
		},

		PopulateComponentToolbox: function ()
		{
			// List of components 
			var lstComponents = ctrlFormDesignerModal.Components.GetComponentsFromFile();

			// Populate the list
			var sHTML = '';
			lstComponents.forEach(function (component)
			{
				sHTML += ctrlFormDesignerModal.Components.GetComponentToolboxItemHTML(component);
			});

			var elemItemList = $('#ctrlFormDesignerModal-component-list-items');
			elemItemList.html(sHTML);
		},

		GetComponentToolboxItemHTML: function (designComponent)
		{
			// Find the actual component by ID
			var component = ctrlFormDesignerModal.Components.GetComponentByID(designComponent.ID);
			if (!component)
			{
				// No component found
				return '<span style="color: red;">ERROR: Component not found: ' + designComponent.ID + '</span>';
			}

			// Get the HTML
			var sComponentHTML = $('#ctrlFormDesignerModal-toolbox-component-html').html();

			// Always allocated a unique GUID when rendered in the DOM
			designComponent.GUID = TriSysSDK.Miscellaneous.GUID();

			sComponentHTML = sComponentHTML.replace(/{{ComponentID}}/g, component.ID);
			sComponentHTML = sComponentHTML.replace(/{{GUID}}/g, designComponent.GUID);
			sComponentHTML = sComponentHTML.replace(/{{ComponentDescription}}/g, component.Description);
			sComponentHTML = sComponentHTML.replace(/{{ComponentIcon}}/g, component.Icon);
			sComponentHTML = sComponentHTML.replace(/{{ComponentName}}/g, component.Name);

			return sComponentHTML;
		},

		// Needed in order to convert the component items into draggable items
		GetComponentToolboxItemsAsIDString: function (component)
		{
			var sList = '';

			var elemItemList = $('#ctrlFormDesignerModal-component-list-items');
			elemItemList.find("[id^='formdesigner-component-tool-']").each(function ()
			{
				var sID = this.id;
				if (sList.length > 0)
					sList += ", ";
				sList += '#' + sID;
			});

			return sList;
		},

		// User has typed into the component search filter
		FilterComponents: function (sFilter)
		{
			if (sFilter)
				sFilter = sFilter.toLowerCase();

			var elemItemList = $('#ctrlFormDesignerModal-component-list-items');

			elemItemList.find("[id^='formdesigner-component-tool-']").each(function ()
			{
				var sID = this.id;
				var elemBlock = $('#' + sID).parent();
				var sComponentName = $(this).find(".component-tool-caption").text();

				var bShowRow = sFilter ? false : true;
				if (sComponentName.toLowerCase().indexOf(sFilter) >= 0)
					bShowRow = true;
				bShowRow ? elemBlock.show() : elemBlock.hide();
			});
		}

	}, // ctrlFormDesignerModal.Components

	Fields: // ctrlFormDesignerModal.Fields
	{
		PopulateFieldToolbox: function ()
		{
			// Get the field descriptions for this entity only
			var sEntityName = ctrlFormDesignerModal.Data.FormProperties.EntityName;
			var fieldDescriptions = TriSysSDK.CShowForm.fieldDescriptions(sEntityName);
			if (!fieldDescriptions)
				return;

			var lstFields = [];
			fieldDescriptions.forEach(function (fieldDescription)
			{
				var bAddToToolbox = !ctrlFormDesignerModal.Fields.isFieldOnThisFormAlready(fieldDescription);

				if (bAddToToolbox)
				{
					var field = {
						ID: fieldDescription.TableName + '_' + fieldDescription.TableFieldName,
						Name: fieldDescription.FieldLabel ? fieldDescription.FieldLabel : fieldDescription.TableFieldName,
						Description: fieldDescription.Description ? fieldDescription.Description : '',
						Icon: "fa fa-wrench"
					};
					lstFields.push(field);
				}
			});

			// Populate the list
			var sHTML = '';
			lstFields.forEach(function (field)
			{
				sHTML += ctrlFormDesignerModal.Fields.GetFieldToolboxItemHTML(field);
			});

			var elemItemList = $('#ctrlFormDesignerModal-field-list-items');
			elemItemList.html(sHTML);
		},

		// If the field is already on this form, then we must not add it to the toolbox
		isFieldOnThisFormAlready: function (fieldDescription)
		{
			var bFoundField = false;

			// Enumerate through all rows/cols to find if this field is listed
			// ToDo: Check components also which may reference this field
			ctrlFormDesignerModal.Data.Tabs.forEach(function (tab)
			{
				if (tab.Layout && tab.Layout.Fields)
				{
					tab.Layout.Fields.forEach(function (field)
					{
						if (field.ID == fieldDescription.TableName + "_" + fieldDescription.TableFieldName)
							bFoundField = true;
					});
				}
			});

			return bFoundField;
		},

		GetFieldByID: function (sID) // ctrlFormDesignerModal.Fields.GetFieldByID
		{
			var foundField = null;

			var sEntityName = ctrlFormDesignerModal.Data.FormProperties.EntityName;
			var fieldDescriptions = TriSysSDK.CShowForm.fieldDescriptions(sEntityName);
			if (!fieldDescriptions)
				return;

			fieldDescriptions.forEach(function (fieldDescription)
			{
				if (fieldDescription.TableName + "_" + fieldDescription.TableFieldName == sID)
					foundField = fieldDescription;
			});

			return foundField;
		},

		GetFieldToolboxItemHTML: function (designField)
		{
			// Find the actual field by ID
			var field = ctrlFormDesignerModal.Fields.GetFieldByID(designField.ID);
			if (!field)
			{
				// No field found
				return '<span style="color: red;">ERROR: Field not found: ' + designField.ID + '</span>';
			}

			// Get the HTML
			var sFieldHTML = $('#ctrlFormDesignerModal-toolbox-field-html').html();

			// Always allocated a unique GUID when rendered in the DOM
			designField.GUID = TriSysSDK.Miscellaneous.GUID();

			// Field icons not in database!
			var sFieldIcon = 'gi gi-wrench';

			// Field ID is a composite of table name + table field name
			field.ID = designField.ID;

			sFieldHTML = sFieldHTML.replace(/{{FieldID}}/g, field.ID);
			sFieldHTML = sFieldHTML.replace(/{{GUID}}/g, designField.GUID);
			sFieldHTML = sFieldHTML.replace(/{{FieldDescription}}/g, field.Description ? field.Description : '');
			sFieldHTML = sFieldHTML.replace(/{{FieldIcon}}/g, sFieldIcon);
			sFieldHTML = sFieldHTML.replace(/{{FieldName}}/g, field.FieldLabel ? field.FieldLabel : field.TableFieldName);

			return sFieldHTML;
		},

		// Needed in order to convert the field items into draggable items
		GetFieldToolboxItemsAsIDString: function (field)
		{
			var sList = '';
			var elemItemList = $('#ctrlFormDesignerModal-field-list-items');
			elemItemList.find("[id^='formdesigner-field-tool-']").each(function ()
			{
				var sID = this.id;
				if (sList.length > 0)
					sList += ", ";
				sList += '#' + sID;
			});

			return sList;
		},

		// User has typed into the field search filter
		FilterFields: function (sFilter)
		{
			if (sFilter)
				sFilter = sFilter.toLowerCase();

			var elemItemList = $('#ctrlFormDesignerModal-field-list-items');

			elemItemList.find("[id^='formdesigner-field-tool-']").each(function ()
			{
				var sID = this.id;
				var elemBlock = $('#' + sID).parent();
				var sFieldName = $(this).find(".field-tool-caption").text();

				var bShowRow = sFilter ? false : true;
				if (sFieldName.toLowerCase().indexOf(sFilter) >= 0)
					bShowRow = true;
				bShowRow ? elemBlock.show() : elemBlock.hide();
			});
		}

	}, // ctrlFormDesignerModal.Fields


	// "The Renderer" - April 2021
	// This takes the .form specification and generates HTML/CSS for the specified device.
	// We draw the entity form to interact with the Web API.
	// We render components which may be made up of other components.
	// We then orchestrate TriSysSDK.CShowForm to convert <trisys-field> into KendoUI controls and perform full CRUD
	// Note that this is located here during development, but will be moved into TriSysApex once developed and tested.
	// By having it here during development, we can simply re-publish this single file to test changes - true RAD
	//
	FormRenderer: // ctrlFormDesignerModal.FormRenderer
	{
		// "The Renderer" for preview
		RenderFormInPreview: function (data, sDeviceType, elemPreviewCanvas)
		{
			var sImage = 'https://apex.trisys.co.uk/images/devices/';
			var rendererDimensions = null;

			switch (sDeviceType)
			{
				case 'Desktop':
					sImage += 'desktop-computer.png';
					rendererDimensions = {
						image:
						{
							height: 1197,
							width: 1600
						},
						padding:
						{
							top: 33,
							left: 33,
							right: 34
						},
						height: 448,
						zoomPercentage: 75
					};
					break;

				case 'Laptop':
					sImage += 'laptop.png';
					rendererDimensions = {
						image:
						{
							height: 601,
							width: 1024
						},
						padding:
						{
							top: 44,
							left: 110,
							right: 112
						},
						height: 482,
						zoomPercentage: 90
					};
					break;

				case 'Tablet':
					sImage += 'iPad.png';
					rendererDimensions = {
						image:
						{
							height: 1060,
							width: 765
						},
						padding:
						{
							top: 58,
							left: 28,
							right: 28
						},
						height: 503,
						zoomPercentage: 60
					};
					break;

				case 'Phone':
					sImage += 'iPhone.png';
					rendererDimensions = {
						image:
						{
							height: 704,
							width: 356
						},
						padding:
						{
							top: 73,
							left: 20,
							right: 21
						},
						height: 473,
						zoomPercentage: 40
					};
					break;

				case 'Live Data':
					// Render form naturally on the canvas without a device image
					ctrlFormDesignerModal.FormRenderer.RenderPreview(data, elemPreviewCanvas);
					return;
			}

			var iHeightFactor = 350; // We do not want a vertical scrollbar
			var iHeight = $(window).height() - iHeightFactor;
			var fSizeMultiplier = iHeight / rendererDimensions.image.height;
			var fImageHeight = rendererDimensions.image.height * fSizeMultiplier;
			var fImageWidth = rendererDimensions.image.width * fSizeMultiplier;

			var sHTML = $('#ctrlFormDesignerModal-preview-device-html').html();
			sHTML = sHTML.replace("{{BackgroundImageURL}}", sImage);
			sHTML = sHTML.replace("{{DivWidth}}", fImageWidth);
			sHTML = sHTML.replace(/{{DivHeight}}/g, fImageHeight);
			sHTML = sHTML.replace("{{BackgroundWidth}}", fImageWidth);
			sHTML = sHTML.replace("{{BackgroundHeight}}", fImageHeight);
			sHTML = sHTML.replace("{{RendererHeight}}", rendererDimensions.height);
			sHTML = sHTML.replace("{{PaddingTop}}", rendererDimensions.padding.top);
			sHTML = sHTML.replace("{{PaddingLeft}}", rendererDimensions.padding.left);
			sHTML = sHTML.replace("{{PaddingRight}}", rendererDimensions.padding.right);

			elemPreviewCanvas.html(sHTML);

			sHTML = ctrlFormDesignerModal.FormRenderer.RenderFormHTML(data, sDeviceType, rendererDimensions);

			var elemDeviceRenderer = $('#ctrlFormDesignerModal-preview-device-renderer');
			elemDeviceRenderer.html(sHTML);

		    // Phase 2: Inject components and fields into DOM
			ctrlFormDesignerModal.FormRenderer.InjectComponentsAndFieldsIntoDOM(data);

		    // Phase 3: Invoke CShowForm to render <trisys-field> 
			TriSysSDK.CShowForm.HTMLFieldsCodeInjection();

		    // Phase 4: In preview mode, prevent input to all parent rows of blocks
			var sBlockRowPattern = "_formrenderer-block-row-";
			elemDeviceRenderer.find("[id*='" + sBlockRowPattern + "']").each(function ()
			{
			    var parentRow = $(this).parent();
			    // We simply want to prevent input in preview mode.
			    // Q: Why?
                // A: Because the device preview is zoomed, and therefore controls popups aappear in the wrong place!
			    parentRow.css('pointer-events', 'none');
			});
		},

		// Render the form without a device type image to allow full interactivity
		RenderPreview: function (data, elemPreviewCanvas)
		{
			// Phase 1: Get the actual render of the form on the current form factor
			var sHTML = ctrlFormDesignerModal.FormRenderer.RenderFormHTML(data, null, { zoomPercentage: null });
			elemPreviewCanvas.html(sHTML);

			// Phase 2: Inject components and fields into DOM
			ctrlFormDesignerModal.FormRenderer.InjectComponentsAndFieldsIntoDOM(data);

			// Phase 3: Invoke CShowForm to render <trisys-field> 
			TriSysSDK.CShowForm.HTMLFieldsCodeInjection();

			// Prompt for record if an entity form
			if (data.FormProperties.EntityName && data.FormProperties.Type == "Entity Form")
			{
				var fnSelected = function (sEntityName, lRecordId, sName)
				{
					// Render record
					var fnOpenRecord = function ()
					{
						TriSysApex.Forms.EntityForm.LoadRecord(sEntityName, lRecordId);
					};
					setTimeout(fnOpenRecord, 10);
					return true;
				};

				TriSysApex.ModalDialogue.EntityRecord.Select(data.FormProperties.EntityName, fnSelected);
			}
		},

		InjectComponentsAndFieldsIntoDOM: function (data)
		{
		    if(data && data.Tabs)
		    {
		        data.Tabs.forEach(function(tab)
		        {
		            var sBlockPrefix = ctrlFormDesignerModal.FormRenderer.UniquePrefix(data.FileName, tab.ID)

                    // Components
		            if(tab.Layout && tab.Layout.Components)
		            {
		                tab.Layout.Components.forEach(function(component)
		                {
		                    var componentDefinition = ctrlFormDesignerModal.Components.GetComponentByID(component.ID);
		                    if(componentDefinition)
		                    {
		                        ctrlFormDesignerModal.FormRenderer.RenderComponent(component, componentDefinition, sBlockPrefix);
		                    }
                        });
		            }

                    // Fields
		            if(tab.Layout && tab.Layout.Fields)
		            {
		                tab.Layout.Fields.forEach(function (field)
		                {
                            var fieldDescription = ctrlFormDesignerModal.Fields.GetFieldByID(field.ID);
                            if (fieldDescription)
		                    {
                                ctrlFormDesignerModal.FormRenderer.RenderField(field, fieldDescription, sBlockPrefix);
		                    }
                        });
		            }
                });
		    }
		},

	    // Find the design-time DOM id formrenderer-block-row-X-column-Y and inject the
	    // component and properties with formdesigner-block-row-X-column-Y
		RenderComponent: function (designedComponent, baseComponent, sBlockPrefix)
		{
		    var sHTML = null;

		    // Properties
		    if(baseComponent.Properties)
			{
		        if (baseComponent.Properties.TriSysField && baseComponent.Properties.TriSysField.Type)
		        {
		            var sGUID = TriSysSDK.Miscellaneous.GUID();
		            var field = {
		                ID: 'formrenderer-field-' + baseComponent.ID + '-' + sGUID,
		                Type: baseComponent.Properties.TriSysField.Type,
		                Value: designedComponent.Properties.Value
		            };

                    // Optional: e.g. rows, height, width etc.. - TODO
					if (baseComponent.Properties.TriSysField.Type == "textbox" && designedComponent.Properties.MultiLine)
					{
						field.Type = "textboxmultiline";
						if (designedComponent.Properties.Rows)
							field.Rows = designedComponent.Properties.Rows;
					}

                    sHTML = DeveloperStudio.FormDesigner.FieldHTML(field);
		        }
		        else
		        {
		            // Not a field - but a complex component
		            switch(baseComponent.ID)
		            {
		                case "label":
		                    sHTML = '<p>' + designedComponent.Properties.Value + '<p>';
		                    break;

		                case "button":
		                    var sIcon = designedComponent.Properties.Icon ? ' <i class="' + designedComponent.Properties.Icon + '"></i> &nbsp; ' : '';
		                    sHTML = '<button type="button" class="btn btn-sm btn-primary">' + sIcon + designedComponent.Properties.Value + '</button>';
		                    break;
		            }
                }
		    }

		    if(sHTML && designedComponent.Location)
		    {
		        var sLocation = designedComponent.Location.replace('formdesigner-', sBlockPrefix + 'formrenderer-');
		        sHTML = ctrlFormDesignerModal.FormRenderer.RenderBlockHTML(sHTML, designedComponent.Properties);
		        $('#' + sLocation).html(sHTML);
		    }            
		},

		RenderField: function (field, fieldDescription, sBlockPrefix)
		{
		    var sFieldName = fieldDescription.TableName + "_" + fieldDescription.TableFieldName;
		    var sHTML = TriSysSDK.CShowForm.TriSysFieldPickerToHTML(sFieldName, fieldDescription);

		    if (sHTML && field.Location)
		    {
		        var sLocation = field.Location.replace('formdesigner-', sBlockPrefix + 'formrenderer-');
		        sHTML = ctrlFormDesignerModal.FormRenderer.RenderBlockHTML(sHTML, field.Properties);
		        $('#' + sLocation).html(sHTML);
		    }            
		},

        // Every component must reside within a block which can be padded/margined etc..
		RenderBlockHTML: function(sHTML, properties)
		{
		    var sProperties = ' style="border: 0; padding: 0;"';       // TODO

		    sHTML = '<div class="block"' + sProperties + '>' + sHTML + '</div>';
            return sHTML
        },

		// Used in both preview and at run-time
		RenderFormHTML: function (data, sDeviceType, rendererDimensions)
		{
			var sHTML = $('#ctrlFormDesignerModal-renderer-form-html').html();

			// Phase 1: Build form from layout
			sHTML = sHTML.replace("{{FormIcon}}", data.FormProperties.Icon);
			sHTML = sHTML.replace("{{FormCaption}}", data.FormProperties.Caption);
			sHTML = sHTML.replace("{{FormButtons}}", ""); // TODO
			sHTML = sHTML.replace("{{ZoomFactor}}", (rendererDimensions.zoomPercentage ? ' zoom: ' + rendererDimensions.zoomPercentage + '%;' : ''));

			var sTopMasterHTML = "";
			if (data.Tabs.length > 0)
			{
				var topTab = data.Tabs[0];
				var rows = topTab.Layout.Rows;
				sTopMasterHTML = ctrlFormDesignerModal.FormRenderer.GetBlockOfRowsAndColumns(rows, data.FileName, topTab.ID);
			}
			sHTML = sHTML.replace("{{FormTopMaster}}", sTopMasterHTML);

			// Form tabs
			var sFormTabTemplateHTML = $('#ctrlFormDesignerModal-renderer-form-tab-html').html();
			var sFormTabPaneTemplateHTML = $('#ctrlFormDesignerModal-renderer-form-tab-pane-html').html();

			var sFormTabs = "",
				sFormTabsContent = "";
			for (var i = 1; i < data.Tabs.length; i++)
			{
				var tab = data.Tabs[i];

				var sFormTab = sFormTabTemplateHTML;
				sFormTab = sFormTab.replace("{{ActiveTab}}", tab.Active ? 'class="active"' : '');
				sFormTab = sFormTab.replace("{{TabID}}", tab.ID);
				sFormTab = sFormTab.replace("{{TabCaption}}", tab.Caption);
				sFormTab = sFormTab.replace("{{TabIcon}}", tab.Icon);
				sFormTab = sFormTab.replace("{{TabVisibility}}", (tab.Visible ? '' : ' style="display: none;"'));
				sFormTabs += sFormTab;

				var sFormTabContent = sFormTabPaneTemplateHTML;
				sFormTabContent = sFormTabContent.replace("{{TabID}}", tab.ID);
				sFormTabContent = sFormTabContent.replace("{{TabActive}}", tab.Active ? ' active' : '');
				sFormTabContent = sFormTabContent.replace("{{TabPaneStyle}}", "style" + (tab.Active ? '' : '="display: none;"'));

				var sTabLayoutHTML = "";
				if (tab.Layout)
				{
				    var rows = tab.Layout.Rows;
				    sTabLayoutHTML = ctrlFormDesignerModal.FormRenderer.GetBlockOfRowsAndColumns(rows, data.FileName, tab.ID);
				}
				sFormTabContent = sFormTabContent.replace("{{TabPaneContent}}", sTabLayoutHTML);
				sFormTabsContent += sFormTabContent;
			}

			sHTML = sHTML.replace("{{FormTabs}}", sFormTabs);
			sHTML = sHTML.replace("{{FormTabsContent}}", sFormTabsContent);

			// FormID is used in all templates so do this last
			var sFormID = TriSysSDK.Controls.FileManager.GetFileNameFromPath(data.FileName).split(".")[0];
			sHTML = sHTML.replace(/{{FormID}}/g, sFormID);

			return sHTML;
		},

	    // Called for each tab to return HTML layout all rows and columns
	    // We use the current filename and tab ID to make these row./col ID's unique
		// 03 May 2021: This will need to be a recursive call too
        //
		GetBlockOfRowsAndColumns: function (rows, sFileName, sTabID)
		{
			var sHTML = "";
			if (rows)
			{
				// Non-recursive brute force version
				// A better programmer than me can convert this to use recursion in future ;-)

				for (var iRow1 = 1; iRow1 <= rows.length; iRow1++)
				{
					var row1 = rows[iRow1 - 1];

					sHTML += '<div class="row">';

					for (var iCol1 = 1; iCol1 <= row1.Columns.length; iCol1++)
					{
						var col1 = row1.Columns[iCol1 - 1];

						var sID1 = ctrlFormDesignerModal.FormRenderer.UniquePrefix(sFileName, sTabID) + 'formrenderer-block-row-' + iRow1 + '-column-' + iCol1;

						sHTML += '<div class="col-sm-' + col1.Width + ' column"' + ' id="' + sID1 + '">';

						if (col1.Rows)
						{
							for (var iRow2 = 1; iRow2 <= col1.Rows.length; iRow2++)
							{
								var row2 = col1.Rows[iRow2 - 1];

								sHTML += '<div class="row">';

								for (var iCol2 = 1; iCol2 <= row2.Columns.length; iCol2++)
								{
									var col2 = row2.Columns[iCol2 - 1];

									var sID2 = sID1 + '-row-' + iRow2 + '-column-' + iCol2;
									sHTML += '<div class="col-sm-' + col2.Width + ' column"' + ' id="' + sID2 + '">';

									if (col2.Rows)
									{
										for (var iRow3 = 1; iRow3 <= col2.Rows.length; iRow3++)
										{
											var row3 = col2.Rows[iRow3 - 1];

											sHTML += '<div class="row">';

											for (var iCol3 = 1; iCol3 <= row3.Columns.length; iCol3++)
											{
												var col3 = row3.Columns[iCol3 - 1];

												var sID3 = sID2 + '-row-' + iRow3 + '-column-' + iCol3;
												sHTML += '<div class="col-sm-' + col3.Width + ' column"' + ' id="' + sID3 + '">';

												if (col3.Rows)
												{
													for (var iRow4 = 1; iRow4 <= col3.Rows.length; iRow4++)
													{
														var row4 = col3.Rows[iRow4 - 1];

														sHTML += '<div class="row">';

														for (var iCol4 = 1; iCol4 <= row4.Columns.length; iCol4++)
														{
															var col4 = row4.Columns[iCol4 - 1];

															var sID4 = sID3 + '-row-' + iRow4 + '-column-' + iCol4;
															sHTML += '<div class="col-sm-' + col4.Width + ' column"' + ' id="' + sID4 + '">';

															// ctrlFormDesignerModal.Settings.MaximumRowDepth

															sHTML += '</div>';		// col 4
														}

														sHTML += '</div>';		// row 4
													}
												}

												sHTML += '</div>';		// col 3
											}

											sHTML += '</div>';		// row 3
										}
									}

									sHTML += '</div>';		// col 2
								}

								sHTML += '</div>';		// row 2
							}
						}

						sHTML += '</div>';		// col 1
					}

					sHTML += '</div>';		// row 1
				}

				return sHTML;
			}

			return sHTML;
		},

	    // Prefix to the name of each row/col e.g. formrenderer-block-row-1-column-1
	    // becomes test-form-back-office-formrenderer-block-row-1-column-1
	    // This is so that we can guarantee uniqueness of run-time forms when retained in-memory
        //
		UniquePrefix: function (sFileName, sTabID)
		{
		    sFileName = TriSysSDK.Controls.FileManager.GetFileNameFromPath(sFileName);
		    var sPrefix = sFileName.replace(/\./g, '-');
		    sPrefix += '_' + sTabID.replace(/\./g, '');
            sPrefix += '_'
		    return sPrefix;
        },

		SampleHTML: function (data)
		{
			// Original sample code to test preview
			var sHTML = "<h1>" + sDeviceType + "</h1>" +
				"<h2>This is a preview of 'The Renderer' showing how this form will look on this device.</h2>";

			for (var i = 0; i < data.Tabs.length; i++)
			{
				var tab = data.Tabs[i];
				sHTML += '<h3>Tab ' + (i + 1) + ': ' + tab.Caption + '</h3>'

				if (tab.Layout && tab.Layout.Rows)
					sHTML += '<p>Rows: ' + tab.Layout.Rows.length + '</p>';
			}

			return sHTML;
		}

	}, // ctrlFormDesignerModal.FormRenderer

	Settings: // ctrlFormDesignerModal.Settings
	{
		EditorCanvasId: 'ctrlFormDesignerModal-EditorCanvas', // ctrlFormDesignerModal.Settings.EditorCanvasId

		ComponentConfigurationFile: 'components.json', // ctrlFormDesignerModal.Settings.ComponentConfigurationFile

		CellHeight: '75px', // ctrlFormDesignerModal.Settings.CellHeight

		// Any more depth than this: rows/col/row/col/row/col/row/col
		// looks crappy so prevent the designer being too ambitious
		MaximumRowDepth: 4,	// ctrlFormDesignerModal.Settings.MaximumRowDepth

		Clipboard: // ctrlFormDesignerModal.Settings.Clipboard
		{
			_List: [],

			Add: function (sID, sHTML, sType) // ctrlFormDesignerModal.Settings.Clipboard.Add
			{
                // This can not be obfuscated using our current tech
			    //var clipboardItem = ctrlFormDesignerModal.Settings.Clipboard._List.filter((item) => item.ID === sID).shift();
			    var clipboardItem = ctrlFormDesignerModal.Settings.Clipboard._List.filter(function (item) { return item.ID === sID; } ).shift();
				if (clipboardItem)
					clipboardItem.HTML = sHTML;
				else
					ctrlFormDesignerModal.Settings.Clipboard._List.push(
					{
						ID: sID,
						HTML: sHTML,
						Type: sType
					});
			}
		},

		History: // ctrlFormDesignerModal.Settings.History
		{
			_List: [], // ctrlFormDesignerModal.Settings.History._List
			_Position: 0, // ctrlFormDesignerModal.Settings.History._Position
			_PoppingOrPeeking: false, // ctrlFormDesignerModal.Settings.History._PoppingOrPeeking

			// Add each data when saved
			Push: function (data) // ctrlFormDesignerModal.Settings.History.Push
			{
				if (ctrlFormDesignerModal.Settings.History._PoppingOrPeeking)
					return;

				// Need to take a copy of this, not just a reference
				var dataCopy = JSON.parse(JSON.stringify(data));

				// Now add to end of stack
				ctrlFormDesignerModal.Settings.History._List.push(dataCopy);

				// This is always the last list index as only unique operations are added to the list, not undo/redo
				ctrlFormDesignerModal.Settings.History._Position = ctrlFormDesignerModal.Settings.History._List.length - 1;

				// Do undo/redo buttons
				ctrlFormDesignerModal.UndoRedoButtons();
			},

			CanGoBack: function ()
			{
				return (ctrlFormDesignerModal.Settings.History._List.length > 0 && ctrlFormDesignerModal.Settings.History._Position > 0);
			},

			CanGoForward: function ()
			{
				return (ctrlFormDesignerModal.Settings.History._List.length > 0 &&
					ctrlFormDesignerModal.Settings.History._Position < (ctrlFormDesignerModal.Settings.History._List.length - 1) &&
					ctrlFormDesignerModal.Settings.History._Position >= 0);
			},

			// Get the last added layout - used for undo
			Pop: function () // ctrlFormDesignerModal.Settings.History.Pop
			{
				if (ctrlFormDesignerModal.Settings.History._List.length > 0 && ctrlFormDesignerModal.Settings.History._Position >= 0)
				{
					if (ctrlFormDesignerModal.Settings.History._Position > 0)
						ctrlFormDesignerModal.Settings.History._Position -= 1;

					// Do undo/redo buttons
					ctrlFormDesignerModal.UndoRedoButtons();

					var data = ctrlFormDesignerModal.Settings.History._List[ctrlFormDesignerModal.Settings.History._Position];
					return data;
				}
			},

			// Get the previous added layout - used for redo
			Peek: function () // ctrlFormDesignerModal.Settings.History.Peek
			{
				if (ctrlFormDesignerModal.Settings.History._List.length > 0)
				{
					if (ctrlFormDesignerModal.Settings.History._Position < 0)
						ctrlFormDesignerModal.Settings.History._Position = 0;

					if (ctrlFormDesignerModal.Settings.History._Position < ctrlFormDesignerModal.Settings.History._List.length)
					{
						ctrlFormDesignerModal.Settings.History._Position += 1;

						// Do undo/redo buttons
						ctrlFormDesignerModal.UndoRedoButtons();

						var data = ctrlFormDesignerModal.Settings.History._List[ctrlFormDesignerModal.Settings.History._Position];
						return data;
					}
				}
			}
		}
	} // ctrlFormDesignerModal.Settings

}; // ctrlFormDesignerModal