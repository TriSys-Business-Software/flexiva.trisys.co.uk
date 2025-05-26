// Apex Form Designer created December 2018 by GL
// A 'like for like' implementation of the original V5 form designer to allow non-developers to build and configure custom forms.
//
// Concept:
// To read the raw HTML from the file into an invisible DOM tree and use JQuery to parse out:
//		a. Top section/form
//		b. Tabs
//		c. Tab Panels
// Upon selection of tab, display the corresponding panel which can be edited.
//
// Looked at using the Froala HTML editor, but encountered problems because this 3rd party control has its own agenda which conflicts with us
// having full control over the DOM.
// Also thought about using the drag/drop from the dashboard view editor, but whilst this would look great, does not solve many other issues.
// 
// 11 Feb 2019: 
//	  a.  Make form tabs work using new form tabs layout introduced AFTER starting this project (I know Garry!!!) - DONE!
//    b.  Hide tabs from Top/Master - DONE!
//    c.  Display title, label and field editors. Currently show column, row, table - DONE!
//	  d.  However, this highlighted that there are problems:
//        i.    This looks too complicated for non-technical people which defeats the whole point of the designer
//        ii.   Dealing with non-fields e.g. components such as attributes and grids is not catered for in design
//        iii.  Bugs
//        iv.   Code is too complex to maintain
//    e.  New design algorithm:
//		  1. Inject form HTML into DOM. Same as now
//		  2. Extract tabs. Same as now
//		  3. Parse out all panels
//		  4. Save a copy of HTML of each field in-memory. Use a GUID as key
//		  5. Replace field with field editor button. Use same GUID as key
//		  6. Store field changes in memory only
//		  7. On save, match field HTML with editor button using GUID and replace
//		  8. Apply field property changes
//		  9. Recombine before saving via Web API. Same as now
//
// 05 March 2019:
//    After research over the weekend, found and introduced a 3rd party component: grid manager
//      http://neokoenig.github.io/jQuery-gridmanager/demo/
//    This allows for bootstrap grid rows and columns to be specified and to pull in a field we pick
//    which can the be dragged up and down in the column.
//    It generates the HTML which obviates the need for us to write a bootstrap manager.
//    Integrating today.
//
// Feb 2021:
//    In hindsight, this was a pure R & D project with limited chance of success.
//    I had the idea to use JSON to design the form which would then render the form at run-time.
//    Whilst a simpler approach, this still does not solve the problem of allowing non-devs to design forms,
//    and it also abstracts the user away from HTML which would be a rat-hole we do not want to go down.
//
// 11 April 2021:
//    Yet another re-design, this time inspired by the dashboard designer, which is a joy to use.
//    The original windows Form Designer was also easy to use, and this must be the goal, especially now that
//    no-code, or low-code, approaches are having a resurgence.
//
// 17 April 2021: See ctrlFormDesignerModal html/js as this is the future. We are old and used as a reference for the good parts.
//
var ctrlFormDesigner =
{
	// Called from DeveloperStudio.OpenFormDesignerForFile() after HTML is read from file via Web API
	Load: function(sFile, sHTML)
	{
		debugger;
		ctrlFormDesigner.Data.FileName = sFile;
		$('#ctrlFormDesigner-FilePath').html(sFile);
		ctrlFormDesigner.LoadHTML(sHTML);
	},

	LoadHTML: function(sHTML)
	{
		//ctrlFormDesigner.InitialiseSplitter();
		ctrlFormDesigner.LoadFormIntoDOM(sHTML);
		ctrlFormDesigner.PopulateTabs();
		ctrlFormDesigner.EventHandlers();
	},

	EventHandlers: function()
	{
		$('#ctrlFormDesigner-MinimizeTools').on('click', function (e)
            {
                $('#ctrlFormDesigner-MinimizeTools').hide();
				$('#ctrlFormDesigner-MaximizeTools').show();	
				$('#ctrlFormDesigner-LeftBlock-Title').html('');
				ctrlFormDesigner.ResizeBlockColumns(false);
            });

		$('#ctrlFormDesigner-MaximizeTools').on('click', function (e)
            {
                $('#ctrlFormDesigner-MaximizeTools').hide();
				$('#ctrlFormDesigner-MinimizeTools').show();
				$('#ctrlFormDesigner-LeftBlock-Title').html('Tools');
				ctrlFormDesigner.ResizeBlockColumns(true);
            });

		$('#ctrlFormDesigner-preview-checkbox').on('click', function ()
        {
            var bShowPreview = $(this).is(":checked");
            $('#ctrlFormDesigner-add-row-button').toggle();
			$('#ctrlFormDesigner-html-editor-button').toggle();

			if(bShowPreview)
			{
				// Save HTML, turn off design mode and display tab pane raw HTML
				ctrlFormDesigner.DesignMode(false);
			}
			else
			{
				// Turn design mode on again
				ctrlFormDesigner.DesignMode(true);
			}
        });
	},

	isPreviewEnabled: function ()
    {
        var bShowPreview = TriSysSDK.CShowForm.GetCheckBoxValue('ctrlFormDesigner-preview-checkbox', false);
        return bShowPreview;
    },

	ResizeBlockColumns: function(bLeftOpen)
	{
		var sLeft = 'ctrlFormDesigner-LeftBlock';
		var sRight = 'ctrlFormDesigner-RightBlock';

		var sLargerLeftClass = "col-md-2 col-lg-2";
		var sSmallerLeftClass = "col-md-1 col-lg-1";

		var sSmallerRightClass = "col-md-10 col-lg-10";
		var sLargerRightClass = "col-md-12 col-lg-12";

		$('#' + sLeft).removeClass().addClass(bLeftOpen ? sLargerLeftClass : sSmallerLeftClass);
		$('#' + sRight).removeClass().addClass(bLeftOpen ? sSmallerRightClass : sLargerRightClass);

		var accordion = $('#ctrlFormDesigner-Tools-group-panel');
		bLeftOpen ? accordion.show() : accordion.hide();

		bLeftOpen ? $('#' + sLeft).show() : $('#' + sLeft).hide();
	},

	// Splitter caused problems with Bootstrap Grid so we ditched it!
	InitialiseSplitter: function()
	{
		var iFudgeFactor = 260;
		var lHeight = $(window).height() - iFudgeFactor;
		var splitterVertical = $('#ctrlFormDesigner-Splitter-vertical');
		splitterVertical.height(lHeight);

		//iFudgeFactor = 110;
		lHeight = lHeight - iFudgeFactor;
		$('#tools-pane').height(lHeight);

		splitterVertical.kendoSplitter({
			orientation: "vertical",
			panes: [
				{ collapsible: false }
			]
		});

		$("#ctrlFormDesigner-Splitter-horizontal").kendoSplitter({
			panes: [
				{ collapsible: false, size: "300px" },
				{ collapsible: false }
			]
		});
	},

	LoadFormIntoDOM: function(sHTML)
	{
		// Store a copy of full form
		ctrlFormDesigner.Data.FileContents = sHTML;

		// Parse top and bottom HTML before and after the DIV's
		ctrlFormDesigner.Data.ParseOutTopAndBottomHTMLSegments(sHTML);

		// Parse our script tag to prevent form script interfering in the designer canvas
		sHTML = ctrlFormDesigner.RemoveScriptTagsToPreventExecution(sHTML);

		// Write to hidden DOM so that we can use JQuery to parse for editing!
		$('#' + ctrlFormDesigner.Settings.HiddenDOM).html(sHTML);

		// Clear edit canvas as we wish to retain the comment in the HTML source file for clarity
		$('#' + ctrlFormDesigner.Settings.EditorCanvasId).html(null);
		
		//// Turn editing on
		//ctrlFormDesigner.EditMode(true);

		// We originally used Froala but encountered limitations - see TriSysSDK.Froala comments
		//ctrlFormDesigner.LoadHTMLintoEditor(sFileContents);

		// Reset tabs
		var topTab = { Name: ctrlFormDesigner.Data.TopMasterName, Caption: ctrlFormDesigner.Data.TopMasterCaption, Icon: ctrlFormDesigner.Data.WarningSignIcon, HTML: '', Visible: true };
		ctrlFormDesigner.Data.Tabs = [topTab];

		// Read hidden DOM to identify form tabs
		ctrlFormDesigner.ReadAndPopulateEntityFormTabCollection();

		// Get the first tab - basically the top part of the form
		ctrlFormDesigner.Data.CurrentTab = ctrlFormDesigner.Data.Tabs[0];

		// Read the HTML
		ctrlFormDesigner.Data.CurrentTab.HTML = ctrlFormDesigner.ReadTopMasterHTML();

		// 07 March 2019: G, why do this here?
		return;

		// 12 Feb 2019: Assemble all sections from DOM into each tab HTML
		ctrlFormDesigner.ReplaceEachTabHTMLWithEditableWidgets();

		// Write only top tab back to the DOM 
		ctrlFormDesigner.ReadTabListFromMemoryToTabLayout();
	},

	// 12 Feb 2019: Assemble all sections from DOM into each tab HTML
	ReplaceEachTabHTMLWithEditableWidgets: function()
	{
		var dom = $('#' + ctrlFormDesigner.Settings.HiddenDOM);

		for(var i = 0; i < ctrlFormDesigner.Data.Tabs.length; i++)
		{
			var tab = ctrlFormDesigner.Data.Tabs[i];

			// Replace with this HTML
			dom.html(tab.HTML);
			
			// Now replace all contructs with editors
			ctrlFormDesigner.InjectEditorsIntoEditorCanvasForCurrentTab();

			// Update HTML for each tab so that it can be quickly displayed on tab selection
			tab.HTML = dom.html();
		}
	},

	ReadAndPopulateEntityFormTabCollection: function()
	{
		// Identify each tab

		$('#' + ctrlFormDesigner.Settings.HiddenDOM + ' a').each(function ()
        {
            var sTabID = this.id;
			var bFoundTab = false;
			var sHTML = null;
			var sTabPaneID = null;

			// Only interested in those with "TriSysSDK.EntityFormTabs.TabContainerClickEvent" in .outerHTML
			var sOuterHTML = this.outerHTML;
			if(sOuterHTML)
			{	
				var sTabClickFunction = "TriSysSDK.EntityFormTabs.TabContainerClickEvent";
				if(sOuterHTML.indexOf(sTabClickFunction) > 0)
				{
					bFoundTab = true;					

					// Identify the DIV associated with this tab click
					// e.g. TriSysSDK.EntityFormTabs.TabContainerClickEvent($(this), 'company-form-panel-addresses', companyForm.TabButtonCallback);
					var parts = sOuterHTML.split("'");
					if(parts)
					{
						if(parts.length == 3)
						{
							sTabPaneID = parts[1];
							var panel = $('#' + sTabPaneID);
							panel.show();
							sHTML = panel[0].outerHTML;							
						}
					}					
				}
			}

			if(bFoundTab)
			{
				var sCaption = this.innerText.trim();
				if(!sTabID)
					sTabID = ctrlFormDesigner.TabIDFromCaption(sCaption);

				var parentLI = this.parentNode;			// Get attributes such as style="display: none;"
				var bVisible = !parentLI.hidden;		// Unreliable! Simply wrong!
				bVisible = (parentLI.outerHTML.indexOf("display: none;") < 0);		// Hard check html attribute
				var bActive = (parentLI.outerHTML.indexOf('class="active"') > 0);	// Hard check html attribute

				var formTab = {
					Name: sTabID,
					Caption: sCaption,
					Icon: this.children[0].className,
					HTML: sHTML,
					outerHTML: parentLI.outerHTML,
					Visible: bVisible,
					Active: bActive,
					ID: parentLI.id,			// Note that ID is the <li id=
					HyperlinkID: this.id,		// and this is the <a href id=
					TabPaneID: sTabPaneID
				};
				ctrlFormDesigner.Data.Tabs.push(formTab);

				// Get 'casing' for tabs
				if(!ctrlFormDesigner.Data.TabPanelButtonsPrefix)
				{					
					var parentUL = parentLI.parentNode;				//   <ul class="nav nav-tabs".....</ul>
					var parentDiv = parentUL.parentNode;			//  <div class="block-title">..</div>
					var parentBlock = parentDiv.parentNode;			// <div class="block full" id=..>...</div>

					var sOuterHTMLul = parentUL.outerHTML;			// <ul class="nav nav-tabs".....</ul>
					var iFirstRightChevron = sOuterHTMLul.indexOf(">");
					ctrlFormDesigner.Data.TabPanelButtonsPrefix = sOuterHTMLul.substring(0, iFirstRightChevron + 1);

					var sOuterHTMLdiv = parentDiv.outerHTML;		// <div class="block-title">..</div>
					iFirstRightChevron = sOuterHTMLdiv.indexOf(">");
					ctrlFormDesigner.Data.TabPanelButtonsPrefix = sOuterHTMLdiv.substring(0, iFirstRightChevron + 1) + '\n\t\t\t' + ctrlFormDesigner.Data.TabPanelButtonsPrefix;

					var sBlockHTMLdiv = parentBlock.outerHTML;		// <div class="block full" id=..>...</div>
					iFirstRightChevron = sBlockHTMLdiv.indexOf(">");
					ctrlFormDesigner.Data.TabPanelButtonsPrefix = '\t' + sBlockHTMLdiv.substring(0, iFirstRightChevron + 1) + '\n\t\t' + ctrlFormDesigner.Data.TabPanelButtonsPrefix;

					ctrlFormDesigner.Data.TabPanelButtonsSuffix = '\n' + '\t\t\t' + '</ul>' + '\n' + '\t\t' + '</div>';
				}
			}
        });
	},

	TabIDFromCaption: function(sCaption)
	{
		sCaption = sCaption.trim();
		var sTabID = sCaption.replace('/', '-').replace(/ /g, '-');
		sTabID = sTabID.replace(/[|&;$%@"<>()+,]/g, "");
		return sTabID;
	},

	// Originally, the top master HTML was a separate block full, but in Feb 2019, this is more complex:
	// <div class="block full" style="padding-bottom: 0px;">
	//     <div class="block-title">
	//     </div>
	//     <div class="row">
	//			The top form
	//	   </div>
	//     <div class="block full" id="company-form-tab-panel-buttons">
	//			Form tabs
	//			Tab Panels
	//     </div>
	// </div>
	ReadTopMasterHTML: function()
	{
		var sHTML = 'Could not read DOM';

		$('#' + ctrlFormDesigner.Settings.HiddenDOM + ' > div > div.row').each(function ()
        {
            sHTML = this.outerHTML;	
        });

		return sHTML;
	},

	// Parse our script tag to prevent form script interfering in the designer canvas
	RemoveScriptTagsToPreventExecution: function(sHTML)
	{
		// We wrote this for Froala editor to prevent script execution.
		// However, it turns out that we DO NOT want the form script to fire on DOM loading as it
		// will introduce controls, scrollbars etc.. which will interfere with the form edit.

		// Remove script tags: <script src="js/pages/company.js"></script>
		var iScriptStart = sHTML.indexOf("<script");
		var iScriptEnd = sHTML.indexOf("</script>");

		if(iScriptStart > 0 && iScriptEnd > iScriptStart)
			sHTML = sHTML.substring(0, iScriptStart, iScriptEnd + 9);

		return sHTML;
	},

	LoadHTMLintoEditor: function(sHTML)
	{
		var bFullPage = false;		// Our 'forms' are embedded within other HTML constructs

		// Froala editor 
		TriSysSDK.Froala.InitialiseEditor(
			{ 
				ID: ctrlFormDesigner.Settings.EditorCanvasId, 
				FullPage: bFullPage, 
				DropEnabled: false, 
				HTML: sHTML 
			}
		);

	},

	PopulateTabs: function()
	{
		// Dummy data
		//ctrlFormDesigner.Data.Tabs = [
		//	{ Name: "TopMaster", Caption: "Top/Master", Icon: null },
		//	{ Name: "ContactsAddresses", Caption: "Contacts/Addresses", Icon: "gi-parents" },
		//	{ Name: "Organogram", Caption: "Organogram", Icon: "gi-tree_deciduous" }
		//];

		ctrlFormDesigner.PopulateListOfTabs(ctrlFormDesigner.Data.Tabs);
	},

    PopulateListOfTabs: function(tabs, sSelectedTabName)
    {
        var sUL = 'ctrlFormDesigner-tab-list';
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
        for(var i = 0; i < tabs.length; i++)
        {
            var tab = tabs[i];

            // Ordering is always as listed
            tab.Ordering = i + 1;

            // Get the row template and merge this view
            var sRowItemHTML = sRowTemplateHTML;
            var sItemID = sItemPrefix + tab.Name;
            sRowItemHTML = sRowItemHTML.replace(sItemTemplate, sItemID);
            sRowItemHTML = TriSysSDK.DocumentObjectModel.RemoveStyleDisplayNone(sRowItemHTML);  //.replace('style="display:none;"', '');

            var sOnClick = 'ctrlFormDesigner.SelectTab(\'' + tab.Name + '\')';
            sRowItemHTML = sRowItemHTML.replace('##tab-click-event##', sOnClick);

			var sIcon = tab.Icon;
			if(sIcon)
			{
				if(sIcon.indexOf(" ") < 0)
					sIcon = sIcon.substring(0, 2) + ' ' + sIcon;
			}
			else
				sIcon = ctrlFormDesigner.Data.WarningSignIcon;

            sRowItemHTML = sRowItemHTML.replace('##tab-icon##', sIcon);

            sRowItemHTML = sRowItemHTML.replace('##tab-name##', tab.Name);
            sRowItemHTML = sRowItemHTML.replace('##tab-caption##', tab.Caption);

            // Append item to list
            $('#' + sUL).append(sRowItemHTML);

            if (!sSelectedTabName)
            {
                // Select the first item
                if (i == 0)
                    sSelectedTabName = tab.Name;
            }

            if (sSelectedTabName == tab.Name)                
                ctrlFormDesigner.SelectTab(tab.Name);
        }
    },

	// User is switching tabs so store any changes in memory before switching DOM contents
	SelectTab: function(sTabName)
	{
		// Always save the current tab edits before moving to a new tab
		ctrlFormDesigner.SaveTabLayoutToTabListInMemory();

		// Find caption from name
		var tab = ctrlFormDesigner.Data.TabFromName(sTabName);
		if(!tab)
			return;

		$('#ctrlFormDesigner-TabName').html(tab.Caption);

		// Clear all selected
        var sUL = 'ctrlFormDesigner-tab-list';
        $('#' + sUL).find('li').each(function ()
        {
            $(this).removeClass('active');
        });

        var sItemPrefix = sUL + '-item-';
        var sItemID = sItemPrefix + sTabName;
        $('#' + sItemID).addClass('active');

		// This is now the current tab
		ctrlFormDesigner.Data.CurrentTab = tab;

		// Write tab back to the editable DOM 
		ctrlFormDesigner.ReadTabListFromMemoryToTabLayout();
	},

	// Manage tab button callbacks
	TabAdd: function()
	{
		ctrlFormDesigner.OpenTabEditor(null);
	},

	TabEdit: function()
	{
		var tab = ctrlFormDesigner.GetSelectedTab();
		if(tab)
			ctrlFormDesigner.OpenTabEditor(tab);
	},

	TabDelete: function()
	{
		var tab = ctrlFormDesigner.GetSelectedTab();
		if(!tab)
			return;

		if(tab.Name == ctrlFormDesigner.Data.TopMasterName || ctrlFormDesigner.Data.Tabs.length <= 2)
		{
			TriSysApex.UI.ShowMessage("You cannot delete this tab.");
			return;
		}

		var fnDeleteTab = function()
		{
			// Remove tab
			var iIndex = ctrlFormDesigner.Data.TabIndexFromName(tab.Name);
			if(iIndex > 0)
				ctrlFormDesigner.Data.Tabs.splice(iIndex, 1);

			// Redraw tabs
			ctrlFormDesigner.PopulateListOfTabs(ctrlFormDesigner.Data.Tabs);

			return true;
		};

		var sMessage = "Are you sure you wish to delete tab: " + tab.Caption + "?";
		TriSysApex.UI.questionYesNo(sMessage, "Delete Tab", "Yes", fnDeleteTab, "No");
	},

	TabMove: function(bUp)
	{
		var tab = ctrlFormDesigner.GetSelectedTab();
		if(!tab)
			return;

		var iIndex = ctrlFormDesigner.Data.TabIndexFromName(tab.Name);

		if(iIndex <= 0)
		{
			TriSysApex.UI.ShowMessage("You cannot move this tab.");
			return;
		}

		if(bUp)
		{
			if(iIndex <= 1)
			{
				TriSysApex.UI.ShowMessage("You cannot move this tab upwards.");
				return;
			}

			var movedUpTab = ctrlFormDesigner.Data.Tabs[iIndex];
			ctrlFormDesigner.Data.Tabs[iIndex] = ctrlFormDesigner.Data.Tabs[iIndex - 1];
			ctrlFormDesigner.Data.Tabs[iIndex - 1] = movedUpTab;
		}
		else
		{
			if(iIndex == ctrlFormDesigner.Data.Tabs.length - 1)
			{
				TriSysApex.UI.ShowMessage("You cannot move this tab downwards.");
				return;
			}

			var movedDownTab = ctrlFormDesigner.Data.Tabs[iIndex];
			ctrlFormDesigner.Data.Tabs[iIndex] = ctrlFormDesigner.Data.Tabs[iIndex + 1];
			ctrlFormDesigner.Data.Tabs[iIndex + 1] = movedDownTab;
		}

		// Redraw tabs, focusing on moved tab
		ctrlFormDesigner.PopulateListOfTabs(ctrlFormDesigner.Data.Tabs, tab.Name);
	},	

	// Called for edit/add tab
	OpenTabEditor: function(tab)
	{
		var bNewTab = false;
		if(!tab)
		{
			tab = { Caption: "New Tab", Icon: ctrlFormDesigner.Data.WarningSignIcon, HTML: '', Visible: true };
			bNewTab = true;
			ctrlFormDesigner.Data.CurrentTab = tab;

			// If the user made changes to the currently selected tab, save these now
			ctrlFormDesigner.SaveTabLayoutToTabListInMemory();			
		}
		else
		{
			if(tab.Caption == ctrlFormDesigner.Data.TopMasterCaption)
			{
				TriSysApex.UI.ShowMessage(ctrlFormDesigner.Data.TopMasterCaption + " is not editable as it fixed.");
				return;
			}
		}

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
			{
				"Name": "HyperlinkID",	
				"Description": [
					"The JQuery ID of the tab item <a> hyperlink"
				],
				"Type": "TextBox",
				"Default": tab.HyperlinkID
			},
			{
				"Name": "Icon",	
				"Description": [
					"The icon shown with the caption"
				],				
				"Type": "Icon",
				"Title": "Icon",
				"Default": tab.Icon
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

			FieldValueChange: function(sCategory, sName, objValue)
			{
				// Store each change in-memory, and apply when required
				if(!ctrlFormDesigner.Data.EditedPropertiesList)
					ctrlFormDesigner.Data.EditedPropertiesList = ctrlFormDesigner.Data.CurrentTab;

				ctrlFormDesigner.Data.EditedPropertiesList[sName] = objValue;
			},

			Apply: function()
			{
				// Apply in-memory changes
				if(ctrlFormDesigner.Data.EditedPropertiesList)
				{
					var editedTab = ctrlFormDesigner.Data.EditedPropertiesList;
					editedTab.Name = ctrlFormDesigner.TabIDFromCaption(editedTab.Caption);

					if(bNewTab)
					{
						// Prevent duplicates
						var bDuplicate = false;
						ctrlFormDesigner.Data.Tabs.forEach(function(existingTab)
						{
							if(existingTab.Name == editedTab.Name)
								bDuplicate = true;
						});

						if(bDuplicate)
						{
							TriSysApex.UI.ShowMessage("Tabs must be unique.");
							return false;
						}
						
						// Must clone the second editedTab.outerHTML which contains the class="gi gi***" plus the Caption
						var secondTab = ctrlFormDesigner.Data.Tabs[1];
						var sOuterHTML = ctrlFormDesigner.ReplaceWithinTags(secondTab.outerHTML, '<i ', '</i>', '<i class="' + editedTab.Icon + '"></i>');
						sOuterHTML = ctrlFormDesigner.ReplaceWithinTags(sOuterHTML, '</i>', '</a>', '</i> ' + editedTab.Caption + '</a>');
						sOuterHTML = sOuterHTML.replace('class="active"', "");
						sOuterHTML = ctrlFormDesigner.RemoveAttribute(sOuterHTML, "id");

						// change onclick="TriSysSDK.EntityFormTabs.TabContainerClickEvent($(this), 'company-form-panel-addresses',
						//     to onclick="TriSysSDK.EntityFormTabs.TabContainerClickEvent($(this),, editedTab.Caption,
						var parts = sOuterHTML.split("TabContainerClickEvent($(this), '");
						parts = parts[1].split("'");
						var sOriginalPanelName = parts[0];		// 'company-form-panel-addresses'
						var sFormPanel = '-form-panel-';
						parts = sOriginalPanelName.split(sFormPanel);
						var sPanelPrefix = parts[0] + sFormPanel;
						var sPanelID = sPanelPrefix + editedTab.Name.toLowerCase();
						editedTab.TabPaneID = sPanelID;

						sOuterHTML = sOuterHTML.replace(sOriginalPanelName, sPanelID);

						//sOuterHTML = ctrlFormDesigner.ReplaceWithinTags(sOuterHTML, "', '", "', '", "', '" + editedTab.Name.toLowerCase() + "', '");
						editedTab.outerHTML = sOuterHTML;

						ctrlFormDesigner.Data.Tabs.push(editedTab);

						// Generate a new editable tab pane with a row and two columns
						editedTab.HTML = ctrlFormDesigner.NewTabPane(sPanelID);
						
						// Assign new pane to editor for immediate editing
						$('#' + ctrlFormDesigner.Settings.EditorCanvasId).html(editedTab.HTML);

						ctrlFormDesigner.DesignOrPreview();

						// Use same programmatic interface to create a new row
						ctrlFormDesigner.TriSysGridManager.AddNewRow(4);
					}
					else
					{
						// Must edit the editedTab.outerHTML which contains the class="gi gi***" plus the Caption
						//var sTest = ctrlFormDesigner.ReplaceWithinTags("3 Blind Mice.", 'Blind', 'Mice', 'Hungry Cats');
						editedTab.outerHTML = ctrlFormDesigner.ReplaceWithinTags(editedTab.outerHTML, '<i ', '</i>', '<i class="' + editedTab.Icon + '"></i>');
						editedTab.outerHTML = ctrlFormDesigner.ReplaceWithinTags(editedTab.outerHTML, '</i>', '</a>', '</i> ' + editedTab.Caption + '</a>');
						ctrlFormDesigner.Data.CurrentTab = editedTab;
					}

					// Sync some properties e.g. Active, with the HTML
					if(editedTab.Active)
					{
						// Some properties e.g. Active, can only be set for one tab
						ctrlFormDesigner.Data.Tabs.forEach(function(existingTab)
						{
							if(existingTab.Name != editedTab.Name)
							{
								if(existingTab.Active)
								{
									existingTab.outerHTML = existingTab.outerHTML.replace('class="active"', "");
									existingTab.Active = false;
								}
							}
						});
					}

					// TODO Garry: DOM copy
					ctrlFormDesigner.PopulateListOfTabs(ctrlFormDesigner.Data.Tabs, editedTab.Name);

					return true;
				}
				else
					TriSysApex.UI.ShowMessage("Please edit new tab properties.");
			}
		};

		ctrlFormDesigner.Data.EditedPropertiesList = null;
		ctrlFormDesigner.OpenPropertySheet(options);
	},

	OpenPropertySheet: function(options)
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
			var fnAfterDraw = function()
			{
				ctrlPropertySheet.ApplyDefaults('ctrlFormDesigner-PropertySheet', propertySheetData);
			};

			TriSysApex.PropertySheet.Draw('ctrlFormDesigner-PropertySheet', propertySheetData, function() { setTimeout(fnAfterDraw(), 100); });
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

	GetSelectedTab: function()
	{
		var sTabName = ctrlFormDesigner.GetSelectedTabName();
        var tab = ctrlFormDesigner.Data.TabFromName(sTabName);
		return tab;
	},

	GetSelectedTabName: function()
	{
		var sTabName = null;
        var sUL = 'ctrlFormDesigner-tab-list';
        $('#' + sUL).find('li').each(function ()
        {
            var bActive = $(this).hasClass('active');
			if(bActive)
				sTabName = this.id.replace('ctrlFormDesigner-tab-list-item-', '');
        });
		return sTabName;
	},

	// Every time we switch tabs, save a copy of the current editable DOM again the tab
	// to preserve changes between tab clicks, but also to assemble the full form
	// once the user saves the form.
	SaveTabLayoutToTabListInMemory: function()
	{
		if(ctrlFormDesigner.Data.CurrentTab)
		{
			var sHTML = $('#' + ctrlFormDesigner.Settings.EditorCanvasId).html();
			var bNoHTML = (!sHTML);

			if(bNoHTML)
			{
				// This is the first time through where we are drawing tabs, so do not involved
				// the 3rd party controls at this point
				return;
			}

			// Turn off design mode to strip out the 3rd party HTML
			var bEnabled = !ctrlFormDesigner.isPreviewEnabled();

			if(bEnabled)
				ctrlFormDesigner.DesignMode(false);

			sHTML = $('#' + ctrlFormDesigner.Settings.EditorCanvasId).html();

			ctrlFormDesigner.Data.CurrentTab.HTML = sHTML;
		}
	},

	// Strip out editors from each tab HTML ready for saving
	// See also InjectEditorsIntoEditorCanvasForCurrentTab()
	StripEditorsFromEditorCanvasForCurrentTab: function(sHTML)
	{
		// Parse out the design time widgets before storing

		// Leftovers from the fucking 3rd party control
		sHTML = sHTML.split('<!--gm-editable-region-->').join('');
        sHTML = sHTML.split('<!--/gm-editable-region-->').join('');

		// Overwrite original full DOM also so that we can remove our design-time widgets
		$('#' + ctrlFormDesigner.Settings.EditorCanvasId).html(sHTML);

		// Leftovers from the fucking 3rd party control
		$('#gm-canvas').contents().unwrap();

		var fnRemove3rdPartyLeftovers = function()
		{
			var lstRemoveAttributes = ['data-children-count', 'data-kwimpalastatus', 'data-kwimpalaid'];
			lstRemoveAttributes.forEach(function(sAttribute)
			{
				$('#' + ctrlFormDesigner.Settings.EditorCanvasId).find('[' + sAttribute + ']').each(function ()
				{
					$(this).removeAttr(sAttribute);
				});
			});
		};
		fnRemove3rdPartyLeftovers();		// Called again AFTER we inject our controls back in!
		// End of 3rd party leftovers
		
		if(ctrlFormDesigner.Settings.TableDesigners)
		{		
			// Get all tables and reset design-time styles
			$('#' + ctrlFormDesigner.Settings.EditorCanvasId + ' table').children('tbody').each(function ()
			{
				var tbody = $(this);
				var table = tbody.parent();

				table.css({
					'border': ''
				});
			});
		}

		// Remove all remaining design time objects
		$('#' + ctrlFormDesigner.Settings.EditorCanvasId).find("[id^='" + ctrlFormDesigner.EditorObjectPrefix + "']").each(function ()
		{
			var sID = this.id;

			if(sID)
			{
				// TODO Garry 12 Feb 2019: Title, Label and Field editors
				var bRemoveThis = true;

				var field = ctrlFormDesigner.Data.FieldFromId(sID);
				if(field)
				{
					$(this).replaceWith(field.HTML);	// TODO: What about property changes?
					bRemoveThis = false;
				}
				else
				{
					var title = null;	// ctrlFormDesigner.Data.TitleFromId(sID); Seems to work find for block titles!
					if(title)
					{
						$(this).replaceWith(title.HTML);	// TODO: What about property changes?
						bRemoveThis = false;
					}
					else
					{
						var label = ctrlFormDesigner.Data.LabelFromId(sID);
						if(label)
						{
							var sPrefix = "<strong>", sSuffix = "</strong>";
							$(this).replaceWith(sPrefix + label.Text + sSuffix);	// This will include the property change?
							bRemoveThis = false;
						}
					}
				}

				if(bRemoveThis)
					$(this).remove();
			}
		});

		fnRemove3rdPartyLeftovers();		// Called again FFS

		// The DOM html will now have been updated with the properties above, so lift
		// this directly from the editable DOM
		sHTML = $('#' + ctrlFormDesigner.Settings.EditorCanvasId).html();

		return sHTML;
	},

	ReadTabListFromMemoryToTabLayout: function()
	{
		if(ctrlFormDesigner.Data.CurrentTab)
		{
			var sHTML = ctrlFormDesigner.Data.CurrentTab.HTML;
			
			// Write directly to editor		
			$('#' + ctrlFormDesigner.Settings.EditorCanvasId).html(sHTML);

			// Turn on/off design mode
			var bEnabled = !ctrlFormDesigner.isPreviewEnabled();
			if(bEnabled)
				ctrlFormDesigner.DesignMode(bEnabled);
		}
	},

	// See StripEditorsFromEditorCanvasForCurrentTab() for how to clear these before save
	InjectEditorsIntoEditorCanvasForCurrentTab: function()
	{
		if(ctrlFormDesigner.Settings.TableDesigners)
		{		
			// Get all tables
			$('#' + ctrlFormDesigner.Settings.EditorCanvasId + ' table').children('tbody').each(function ()
			{
				var tbody = $(this);
				var table = tbody.parent();

				table.css({
					'border': '1px solid lightgray'
				});

				var iColumns = ctrlFormDesigner.CountTableColumns(tbody);

				// Each table has a button
				var sTableTemplate = $('#ctrlFormDesigner-Edit-Table-template').html().trim();
				var sTable = sTableTemplate.replace(/{{Edit-TableId}}/g, ctrlFormDesigner.EditorObjectPrefix + TriSysSDK.Miscellaneous.GUID());
				sTable = sTable.replace(/{{Edit-TableColumnCount}}/g, iColumns);

				// Append this edit block to the table
				$(this).prepend(sTable);
			});
		}

		// Feb 2019
		// Get all div tags with id's so that we can allow editing of text and fields
	
		// Start with block titles with <h2> or <h3> text
		$('#' + ctrlFormDesigner.Settings.EditorCanvasId).find("*[class^='block-title']").each(function ()
		{
			var elemH2 = $(this).find("h2");
			var sCaption = elemH2.html();
			if(!sCaption)
			{
				var elemH3 = $(this).find("h3");
				sCaption = elemH3.html();
			}

			var sTitleID = ctrlFormDesigner.EditorObjectPrefix + TriSysSDK.Miscellaneous.GUID();

			// Store each title for later
			var sTitleHTML = this.outerHTML;
			ctrlFormDesigner.Data.Titles.push({ ID: sTitleID, HTML: sTitleHTML, Caption: sCaption});

			// Each title has a button
			var sTitleTemplate = $('#ctrlFormDesigner-Edit-Title-template').html().trim();
			var sTitle = sTitleTemplate.replace(/{{Edit-TitleId}}/g, sTitleID);

			// Append this edit block to the title
			$(this).prepend(sTitle);
		});

		// Editable <strong> labels
		$('#' + ctrlFormDesigner.Settings.EditorCanvasId + ' strong').each(function ()
		{
			var sLabel = ctrlFormDesigner.DesignTimeFieldLabelHTML(this);

			// Append this edit block to the label

			// Method #1: Puts a fucking white space after <strong>!!!
			//$(this).prepend(sLabel);
			//$("#" + sLabelID).insertBefore( $(this) );	
			
			// Method #2: Does not!
			//$(this).before(sLabel);

			// Method #3: Replace it
			$(this).replaceWith(sLabel);			
			//$(this).html(sLabel);
		});

		// Now do all fields i.e. tablename_tablefieldname
		$('#' + ctrlFormDesigner.Settings.EditorCanvasId).find("[id*='_']").each(function ()
		{
			var sID = this.id;

			var findFieldDescription = { TableName: sID.split("_")[0], TableFieldName: sID.split("_")[1] };
			var fieldDescription = null;

			// Validate that this is indeed a field, and not something else e.g. "tr-Contact_JobTitle"
			var fieldDescriptions = TriSysApex.Cache.FieldDescriptions();
			fieldDescriptions.forEach(function(fd)
			{
				if(findFieldDescription.TableName == fd.TableName && findFieldDescription.TableFieldName == fd.TableFieldName)
					fieldDescription = fd;
			});

			if(fieldDescription)
			{
				// Read each field attribute
				var sField = ctrlFormDesigner.DesignTimeFieldHTML(fieldDescription, this.outerHTML);

				// Replace the field completely as we will replace it on save with modified attributes
				$(this).replaceWith(sField);
			}
		});

		// Finally do all div tags which have not been picked up above
		// Unfortunately, this creates side effects caused by divs within divs (e.g. blocks) which can
		// cause nesting of editable widgets. Hard to debug and find!
		// Best turn off as it is mainly layout and fields we require, not additional complexity.

		$('#' + ctrlFormDesigner.Settings.EditorCanvasId + ' div, img').each(function ()
		{
			var sID = this.id;
			var sClass = this.className;
			var bReallyWantTo = false;
			var sTriSysWidgetType = null;

			if(sID)
			{
				if(sID.indexOf("Grid") >= 0)		// Exception is grids where we at least want to see them in designer
					bReallyWantTo = true;

				// Look for trisys-widget- attributes
				sTriSysWidgetType = $(this).attr('trisys-widget-type');
				
				if(sTriSysWidgetType)
					bReallyWantTo = true;
			}

			if(sID && bReallyWantTo)
			{
				var bEditWidgetIf = sID.indexOf(ctrlFormDesigner.EditorObjectPrefix) < 0 && sClass != "tab-pane"
										&& (sID.indexOf("_") < 0 || sTriSysWidgetType);
				if(bEditWidgetIf)
				{
					var sFieldID = ctrlFormDesigner.EditorObjectPrefix + TriSysSDK.Miscellaneous.GUID() + "_" + sID;

					// Store each field for later
					var sFieldHTML = this.outerHTML;
					ctrlFormDesigner.Data.Fields.push({ ID: sFieldID, HTML: sFieldHTML});

					// Read each field attribute
					var sField = ctrlFormDesigner.InjectedDivEditorFieldHTML(sID, sFieldID, sTriSysWidgetType);

					if(sField)
					{
						// Replace the field 
						$(this).replaceWith(sField);
					}
				}
			}				
		});
	},

	// Called when a new tab is added
	NewTabPane: function(sPanelID)
	{
		// Get the new tab pane template
		var sTemplate = $('#ctrlFormDesigner-New-TabPane-template').html().trim();
		var sHTML = sTemplate.replace(/{{New-TabPaneId}}/g, sPanelID);

		return sHTML;
	},

	EditorObjectPrefix: 'form-Designer-Edit-Object-',

	// Callbacks from editors
	EditRow: function(sId)
	{
		// Determine what we know from the DOM about this row
		var sKnowledge = '';

		var rowElement = $('#' + sId).parent();

		// How many columns?
		var iColumnCount = 0;
		rowElement.children("*[class^='col-']").each(function ()
		{
			iColumnCount += 1;
			var sClass = $(this).attr('class');
			if(sKnowledge.length > 0)
				sKnowledge += "<br/>";
			sKnowledge += "Col: " + iColumnCount + ": " + sClass;
		});
		sKnowledge = "Found " + iColumnCount + " columns:<br/>" + sKnowledge;
		

		// Popup knowledge:
		TriSysApex.UI.ShowMessage('Edit Row: ' + sId + " - " + sKnowledge);
	},

	EditColumn: function(sId)
	{
		var sKnowledge = '';

		// Popup knowledge:
		TriSysApex.UI.ShowMessage('Edit Column: ' + sId + " - " + sKnowledge);
	},

	EditTitle: function(sId)
	{
		// Search for it in list of titles
		var title = ctrlFormDesigner.Data.TitleFromId(sId);
		if(!title)
			return;

		// Get original text from DOM
		//$('#' + ctrlFormDesigner.Settings.HiddenDOM).html(title.HTML);	// <div class="block-title">...<h2>Title</h2></div>

		var properties = [
			{
				"Name": "Caption",	
				"Description": [
					"The text of the title caption"
				],
				"Type": "TextBox",
				"Default": title.Caption
			}
		];

		var options = {
			Title: "Title: " + sId,
			Image: "gi-pen",
			SubTitle: "Title Properties",
			Items: properties,

			FieldValueChange: function(sCategory, sName, objValue)
			{
				// Store each change in-memory, and apply when required
				if(!ctrlFormDesigner.Data.EditedPropertiesList)
					ctrlFormDesigner.Data.EditedPropertiesList = [];

				ctrlFormDesigner.Data.EditedPropertiesList[sName] = objValue;
			},

			Apply: function()
			{
				// Apply in-memory changes
				if(ctrlFormDesigner.Data.EditedPropertiesList)
				{
					var editedTitle = ctrlFormDesigner.Data.EditedPropertiesList;
					title.Caption = editedTitle.Caption;

					// Must write property change to BOTH title.HTML and editor canvas
					var editButton = $('#' + sId).parent();
					var elemH2 = editButton.find("h2");
					elemH2.html(title.Caption);
					var elemH3 = editButton.find("h3");
					elemH3.html(title.Caption);

					return true;
				}
				else
					TriSysApex.UI.ShowMessage("Please edit title properties.");
			}
		};

		ctrlFormDesigner.Data.EditedPropertiesList = null;
		ctrlFormDesigner.OpenPropertySheet(options);
	},

	EditLabel: function(sId)
	{
		// Search for it in list of labels
		var label = ctrlFormDesigner.Data.LabelFromId(sId);
		if(!label)
			return;

		// Why get original text from DOM?
		//$('#' + ctrlFormDesigner.Settings.HiddenDOM).html(title.HTML);	// <div class="block-title">...<h2>Title</h2></div>

		var properties = [
			{
				"Name": "Text",	
				"Description": [
					"The text of the label"
				],
				"Type": "TextBox",
				"Default": label.Text
			}
		];

		var options = {
			Title: "Label: " + sId,
			Image: "gi-pencil",
			SubTitle: "Label Properties",
			Items: properties,

			FieldValueChange: function(sCategory, sName, objValue)
			{
				// Store each change in-memory, and apply when required
				if(!ctrlFormDesigner.Data.EditedPropertiesList)
					ctrlFormDesigner.Data.EditedPropertiesList = [];

				ctrlFormDesigner.Data.EditedPropertiesList[sName] = objValue;
			},

			Apply: function()
			{
				// Apply in-memory changes
				if(ctrlFormDesigner.Data.EditedPropertiesList)
				{
					var editedLabel = ctrlFormDesigner.Data.EditedPropertiesList;
					label.Text = editedLabel.Text;

					// Must write property change to BOTH label.HTML and editor canvas
					//var editLabel = $('#' + sId).next();
					//editLabel.html(label.Text);
					$('#' + sId + '-TextId').html(label.Text);

					return true;
				}
				else
					TriSysApex.UI.ShowMessage("Please edit label properties.");
			}
		};

		ctrlFormDesigner.Data.EditedPropertiesList = null;
		ctrlFormDesigner.OpenPropertySheet(options);
	},

	CutLabel: function(sId)
	{
		var label = ctrlFormDesigner.Data.LabelFromId(sId);
		if(label)
		{
			ctrlFormDesigner.CopyLabel(sId);

			$('#' + label.ID).remove();
		}
	},

	CopyLabel: function(sId)
	{
		var label = ctrlFormDesigner.Data.LabelFromId(sId);
		if(label)
		{
			var widget = { HTML: label.HTML, Text: label.Text };
			var copyLabelHTML = ctrlFormDesigner.DesignTimeFieldLabelHTML(null, widget);

			ctrlFormDesigner.Settings.Clipboard.Add(sId, copyLabelHTML, "Label");
			TriSysApex.Toasters.Warning("Label: " + sId + " added to clipboard");
		}
	},


	EditField: function(sId, sName)
	{
		ctrlFormDesigner.EditFieldOperation(sId, sName, "Edit TriSys Database Field/Widget",
					'<br />' + 'This could be both a point and click and raw HTML editor for super granular editing.');
	},

	CutField: function(sId, sName)
	{
		var field = ctrlFormDesigner.Data.FieldFromId(sId);
		if(field)
		{
			ctrlFormDesigner.CopyField(sId, sName);

			$('#' + field.ID).remove();
		}
	},

	CopyField: function(sId, sName)
	{
		var field = ctrlFormDesigner.Data.FieldFromId(sId);
		if(field)
		{
			var sTableName, sTableFieldName, fieldDescription;
			var parts = sId.replace(ctrlFormDesigner.EditorObjectPrefix, '').split("_");
			sTableName = parts[1];
			if(parts.length > 2)
				sTableFieldName = parts[2];

			sId = sTableName;
			if(sTableFieldName)
			{
				sId += "_" + sTableFieldName;
				fieldDescription = { TableName: sTableName, TableFieldName: sTableFieldName };
				var sField =  ctrlFormDesigner.DesignTimeFieldHTML(fieldDescription, field.HTML);
				field.HTML = sField;
			}

			ctrlFormDesigner.Settings.Clipboard.Add(sId, field.HTML);
			TriSysApex.Toasters.Warning("Field: " + sId + " added to clipboard");
		}
	},

	// No sense in offering paste into fields as we have multiple entries in the clipboard
	PasteField: function(sId, sName)
	{
		ctrlFormDesigner.EditFieldOperation(sId, sName, "Paste TriSys Database Field/Widget");
	},

	EditFieldOperation: function(sId, sName, sOperation, sAdditionalInfo)
	{
		var sKnowledge = sName;

		// Search for it in list of fields
		var field = ctrlFormDesigner.Data.FieldFromId(sId);
		if(field)
			sKnowledge += field.HTML;

		if(sAdditionalInfo)
			sKnowledge += sAdditionalInfo;

		// Popup knowledge:
		TriSysApex.UI.ShowMessage(sId + " - " + sKnowledge, sOperation);
	},

	EditTable: function(sId)
	{
		var sKnowledge = '';

		var tbody = $('#' + sId).parent();
		var iRows = tbody.children('tr').length - 1;	// Discount this edit button!		

		var iColumns = ctrlFormDesigner.CountTableColumns(tbody);

		sKnowledge = iRows + " rows, " + iColumns + " columns?";

		// Popup knowledge:
		TriSysApex.UI.ShowMessage('Edit Table: ' + sId + " - " + sKnowledge);
	},

	CountTableColumns: function(tbody)
	{
		var iColumns = 0;
		var firstRow = tbody.find('tr:nth-child(2)').first();
		firstRow.children().each(function () 
		{
			var td = $(this);
			if (td.attr('colspan')) 
				iColumns += parseInt(td.attr('colspan'));
			else 
				iColumns += 1;
		});
		return iColumns;
	},

	// For power users, they can edit the underlying HTML in a pop-up
	LaunchRawHTMLEditor: function()
	{
		var sHTML = ctrlFormDesigner.ReadEntireEditedRawHTML();

		// Now re-display selected tab as the save process leaves us with a raw HTML preview
		ctrlFormDesigner.ReadTabListFromMemoryToTabLayout();

		// Throw into popup
		var fnAfterSave = function (sEditedHTML)
        {
            // Re-load the full edited HTML into the editor again
			ctrlFormDesigner.LoadHTML(sEditedHTML);
        };

        TriSysSDK.Controls.FileManager.OpenHTMLEditorForEditOnly(sHTML, ctrlFormDesigner.Data.FileName, fnAfterSave);
	},

	// Taken from Dashboard Designer technique.
    // Enumerate through EVERY DOM item in order to make it editable
	// This works however it is going to be a lot of work and compromise to make this work!
	EditableDivCollection: function()
	{
		var sDivCollection = '';		// Comma separated ', '

		// Tried this based on ID only - did not work
		$('#' + ctrlFormDesigner.Settings.EditorCanvasId).find('*').each(function ()
        {
            var sID = this.id;
			if(sID.length > 0)
			{
				// Any other types of object we do not want to edit?
				var bAddElement = (sID.indexOf('draggable-blocks-row-') >= 0 && sID.indexOf('-column-') < 0);
				//var bAddElement = (sID.indexOf('dashboard-block-row-') >= 0);

				if(bAddElement)
				{
					if (sDivCollection.length > 0)
						sDivCollection += ', ';

					sDivCollection += "#" + sID;
				}
			}
        });

		// Try this for rows and blocks only
		//$('#' + ctrlFormDesigner.Settings.EditorCanvasId).find('.block-title').each(function ()
  //      {
		//	var sID = this.id;
		//	if(sID.length > 0)
		//	{
		//		if (sDivCollection.length > 0)
		//				sDivCollection += ', ';

		//		sDivCollection += "#" + sID;			
		//	}
  //      });

		return sDivCollection;
	},

	// 'Edit Mode' on or off
	EditMode: function(bEnable)
    {
        var sDivCollection = ctrlFormDesigner.EditableDivCollection();        

        /* Initialize draggable and sortable blocks, check out more examples at https://jqueryui.com/sortable/ */
        if (bEnable)
        {
            $(sDivCollection).sortable({
                connectWith: '.row',
                items: '.block',
                opacity: 0.75,
                handle: '.block-title',
                placeholder: 'draggable-placeholder',
                tolerance: 'pointer',
                start: function (e, ui)
                {
                    ui.placeholder.css('height', ui.item.outerHeight());
                }
            });
            $(sDivCollection).sortable("enable");
        }
        else
            $(sDivCollection).sortable("disable");

        // If we are in edit mode, then show all blocks with no tiles assigned,
        // else if not in edit mode, then hide all blocks with no tiles assigned
        var bShow = bEnable;
        //ctrlDashboard.ShowOrHideBlocksWithNoTile(bShow);

        // Same for the configurator buttons - hide them for end-users not in designer mode
        //ctrlDashboard.ShowOrHideTileConfigurator(bShow);
    },

	// Re-compose the full edits
	ReadEntireEditedRawHTML: function()
	{
		// Always save the current tab edits before moving to a new tab
		ctrlFormDesigner.SaveTabLayoutToTabListInMemory();

		// Simply re-assemble the parts from all tabs into the new HTML
		var sHTML = ctrlFormDesigner.Data.TopPreFirstDivHTML + '\n';	// <style scoped....

		// Add top/master
		var topTab = ctrlFormDesigner.Data.Tabs[0];
		sHTML += ctrlFormDesigner.StripEditorsFromEditorCanvasForCurrentTab(topTab.HTML);			// <div class="block full"

		// Add form tabs section
		sHTML += '\n\n\t<!-- Re-Generated Form Tabs Start -->\n' + ctrlFormDesigner.Data.TabPanelButtonsPrefix;

		var i, tab;
		for(i = 1; i < ctrlFormDesigner.Data.Tabs.length; i++)
		{
			tab = ctrlFormDesigner.Data.Tabs[i];

			// In-place attributes for <li>
			var sOuterHTML = tab.outerHTML;
			var sAttributes = '';
			if(tab.Active)
				sAttributes += ' class="active"';
			if(tab.ID)
				sAttributes += ' id="' + tab.ID + '"';
			if(!tab.Visible)
				sAttributes += ' style="display: none;"';

			sOuterHTML = ctrlFormDesigner.ReplaceWithinTags(sOuterHTML, '<li', '>', '<li' + sAttributes + '>');

			// In-place attributes for <a>
			sAttributes = '';
			if(tab.HyperlinkID)
			{
				//var sTest = ctrlFormDesigner.RemoveAttributeBetweenTags('Forget the Janes, the="2nd-the" Jeans, and the Might-Have-Beens', "the", "Janes");
				sOuterHTML = ctrlFormDesigner.RemoveAttributeBetweenTags(sOuterHTML, "id", "<a", ">");
				sAttributes = ' id="' + tab.HyperlinkID + '"';
			}
			sOuterHTML = ctrlFormDesigner.ReplaceWithinTags(sOuterHTML, '<a', 'href', '<a' + sAttributes + ' href');

			sHTML += '\n\t\t\t\t' + sOuterHTML;							// <li> tags
		}

		sHTML += ctrlFormDesigner.Data.TabPanelButtonsSuffix + '\n';	//\t<!-- Re-Generated Form Tabs End -->\n';

		// Add tab panels
		sHTML += '\n\t\t<!-- Re-Generated Tab Content Panels Start -->';

		sHTML += ctrlFormDesigner.Data.TabContentPrefix;

		for(i = 1; i < ctrlFormDesigner.Data.Tabs.length; i++)
		{
			tab = ctrlFormDesigner.Data.Tabs[i];						// <div> tags
			var sTabHTML = ctrlFormDesigner.StripEditorsFromEditorCanvasForCurrentTab(tab.HTML);
		
			// Make them invisible when form loaded in app
			sTabHTML = sTabHTML.replace('<div style=""', '<div style="display: none;"');

			sHTML += '\n\t\t\t' + sTabHTML;
		}
		//sHTML += '\n<!-- Re-Generated Tab Panels End -->\n';			// Our algorithm preserves everything after last <div>

		sHTML += ctrlFormDesigner.Data.TabContentSuffix;

		// Add <script tags from the bottom of the form
		sHTML += ctrlFormDesigner.Data.BottomPostLastDivHTML;

		// Finally take out annoying style="" from HTML which is caused because we reset styles creating editors
		sHTML = sHTML.replace(/style=""/g, '');

		return sHTML;
	},

	// May be save and keep open, or save and close
	Save: function(sFile)
	{
		// Simply re-assemble the parts from all tabs into the new HTML
		// and overwrite the file, perhaps storing a revision history 'just in case'?
		var sHTML = ctrlFormDesigner.ReadEntireEditedRawHTML();

		var fnSaved = function ()
        {
            TriSysApex.Toasters.Success("Successfully saved: " + sFile);

			// Now re-display selected tab as the save process leaves us with a raw HTML preview
			ctrlFormDesigner.ReadTabListFromMemoryToTabLayout();
        };

        DeveloperStudio.WebAPI.WriteFile(sFile, sHTML, fnSaved);
	},

	Data:		// ctrlFormDesigner.Data
	{
		TopMasterName: "TopMaster",
		TopMasterCaption: "Top/Master",
		WarningSignIcon: "gi gi-warning_sign",
		FileName: null,
		Tabs: [],
		CurrentTab: null,
		EditedPropertiesList: null,
		Titles: [],
		Labels: [],
		Fields: [],

		TabFromName: function(sTabName)
		{
			var tab = null;
			ctrlFormDesigner.Data.Tabs.forEach(function(tabby)
			{
				if(tabby.Name == sTabName)
					tab = tabby;
			});
			return tab;
		},

		TabIndexFromName: function(sTabName)
		{
			for(var i = 1; i < ctrlFormDesigner.Data.Tabs.length; i++)
			{
				var tab = ctrlFormDesigner.Data.Tabs[i];
				if(tab.Name == sTabName)
					return i;
			}
			return -1;
		},

		FileContents: null,

		// When we open the file, remove the top and bottom parts
		TopPreFirstDivHTML: '',		// Normally <stype scoped...
		BottomPostLastDivHTML: '',	// Normally <script .js...

		ParseOutTopAndBottomHTMLSegments: function(sHTML)
		{
			if(!sHTML)
				return;

			// Top bit is easy! Dec 2018
			// Feb 2019: Entire form including top, tabs and panels is in one div
			var iTopIndex = sHTML.indexOf("<div");
			if(iTopIndex > 0)
			{
				ctrlFormDesigner.Data.TopPreFirstDivHTML = sHTML.substring(0, iTopIndex - 1);

				// Feb 2019: No. The form is wrapped up in a <div class="block full"
				var sTopSectionRow = '<div class="row"';
				iTopIndex = sHTML.indexOf(sTopSectionRow);
				ctrlFormDesigner.Data.TopPreFirstDivHTML = sHTML.substring(0, iTopIndex - 1);
			}

			var iLastEndDiv = sHTML.lastIndexOf("</div>");
			if(iLastEndDiv > 0)
				ctrlFormDesigner.Data.BottomPostLastDivHTML = sHTML.substring(iLastEndDiv + 6);
		},

		// The tab buttons sections must also be preserved for editing and reconstruction
		TabPanelButtonsPrefix: '',	// <div class="block full" id=...><div class="block-title"><ul class="nav nav-tabs"...>
		TabPanelButtonsSuffix: '',	// </ul></div>
		TabContentPrefix: '\n\t\t<div class="tab-content">',
		// Close the <div class="tab-content"> and <div class="block full" id=..> and <div class="block full">
		TabContentSuffix: '\n\t\t</div> <!-- <div class="tab-content TAB CONTENT"> -->\n\t</div> <!-- <div class="block full" TABS> -->\n</div> <!-- <div class="block full" FORM> -->',		

		TitleFromId: function(sId)
		{
			var foundTitle = null;

			// Search for it in list of Titles
			ctrlFormDesigner.Data.Titles.forEach(function(title)
			{
				if(title.ID == sId && !foundTitle)
					foundTitle = title;
			});

			return foundTitle;
		},

		LabelFromId: function(sId)
		{
			var foundLabel = null;

			// Search for it in list of labels
			ctrlFormDesigner.Data.Labels.forEach(function(label)
			{
				if(label.ID == sId && !foundLabel)
					foundLabel = label;
			});

			return foundLabel;
		},

		FieldFromId: function(sId)
		{
			var foundField = null;

			// Search for it in list of labels
			ctrlFormDesigner.Data.Fields.forEach(function(field)
			{
				if(field.ID == sId && !foundField)
					foundField = field;
			});

			return foundField;
		}
	},

	// TODO: Put into TriSysApex as this is a re-usable function
	// Replace between specified tags.
	ReplaceWithinTags: function(sOriginal, sStartTag, sEndTag, sReplacement)
	{
		if(sOriginal)
		{
			var iStart = sOriginal.indexOf(sStartTag);
			if(iStart >= 0)
			{
				var iEnd = sOriginal.indexOf(sEndTag, iStart+sStartTag.length);
				if(iEnd > iStart)
				{
					var sPre = sOriginal.substring(0, iStart);
					var sPost = sOriginal.substring(iEnd + sEndTag.length);
					sOriginal = sPre + sReplacement + sPost;
				}
			}
		}
		return sOriginal;
	},

	// https://www.javascriptcookbook.com/article/traversing-dom-subtrees-with-a-recursive-walk-the-dom-function/
	walkTheDOM: function(node, func) 
	{
		func(node);
		node = node.firstChild;
		while (node) 
		{
			ctrlFormDesigner.walkTheDOM(node, func);
			node = node.nextSibling;
		}
	},

	RemoveAttribute: function(sOriginal, sAttribute)
	{
		if(sOriginal)
		{
			sAttribute = sAttribute + '="';
			var iStart = sOriginal.indexOf(sAttribute);
			if(iStart >= 0)
			{
				var sEndTag = '"';
				var iEnd = sOriginal.indexOf(sEndTag, iStart+sAttribute.length + 1);
				if(iEnd > iStart)
				{
					var sPre = sOriginal.substring(0, iStart);
					var sPost = sOriginal.substring(iEnd + sEndTag.length);
					sOriginal = sPre + sPost;
				}
			}
		}
		return sOriginal;
	},

	// sOuterHTML = ctrlFormDesigner.RemoveAttributeBetweenTags(sOuterHTML, "id", "<a");
	// i.e. find the id= inside the first <a...> tag
	RemoveAttributeBetweenTags: function(sOriginal, sAttribute, sInnerStart)
	{
		if(sOriginal)
		{
			sAttribute = sAttribute + '="';
			var iInnerStart = sOriginal.indexOf(sInnerStart);
			var iStart = sOriginal.indexOf(sAttribute, iInnerStart);
			if(iStart >= 0)
			{
				var sEndTag = '"';
				var iEnd = sOriginal.indexOf(sEndTag, iStart+sAttribute.length + 1);
				if(iEnd > iStart)
				{
					var sPre = sOriginal.substring(0, iStart);
					var sPost = sOriginal.substring(iEnd + sEndTag.length);
					sOriginal = sPre + sPost;
				}
			}
		}
		return sOriginal;
	},

	// 05 Mar 2019: Enable drag/drop design mechanism in this modal
	DesignMode: function(bEnable)
	{
		if(bEnable)
		{
			//ctrlFormDesigner.EditMode(true);

			// We may still use this for dragging fields as it works pre gridmanager on 04 Mar 2019
			//$('#company-form-panel-attributes-documents-table, #company-form-panel-attributes-imagelogo-table').sortable({
			//	connectWith: ".connectedSortable"
			//}).disableSelection();

			// Add editors for things like block titles, labels etc..
			ctrlFormDesigner.InjectEditorsIntoEditorCanvasForCurrentTab();

			// We need the div which is the tab pane as it is inside this that we edit rows/cols
			// <div class="tab-pane" HANG ON G, WHAT ABOUT TOP MASTER? It has no tab-pane
			var sEditorDiv = ctrlFormDesigner.Settings.EditorCanvasId;
			if(ctrlFormDesigner.Data.CurrentTab.Name != ctrlFormDesigner.Data.TopMasterName)
				sEditorDiv = ctrlFormDesigner.Data.CurrentTab.TabPaneID;

			// New 3rd party control 
			ctrlFormDesigner.TriSysGridManager.Draw(sEditorDiv);
		}
		else
		{
			// Read the HTML from the editor. This turns edit mode off. Then write it back.
			var sHTML = ctrlFormDesigner.TriSysGridManager.ReadHTML();

			// However, we may have the tab pane or a wrapper around it, so read the entire canvas
			sHTML = $('#' + ctrlFormDesigner.Settings.EditorCanvasId).html();

			// Strip field designers
			sHTML = ctrlFormDesigner.StripEditorsFromEditorCanvasForCurrentTab(sHTML);

			// Write back to see layout as user will experience it
			$('#' + ctrlFormDesigner.Settings.EditorCanvasId).html(sHTML);
		}
	},

	// For new tabs, show the appropriate mode
	DesignOrPreview: function()
	{
		var bDesignModeEnabled = !ctrlFormDesigner.isPreviewEnabled();
		ctrlFormDesigner.DesignMode(bDesignModeEnabled);
	},

	// When replacing HTML with TriSys fields
	InjectedDivEditorFieldHTML: function(sID, sFieldID, sTriSysWidgetType)
	{
		var sHTML = null;

		// Known field types firstly
		switch(sTriSysWidgetType)
		{
			case "grid":
				sHTML = ctrlFormDesigner.InjectedDivEditorFieldHTMLForFieldType(sID, sFieldID, "Grid");
				break;

			case "thumbnail":
				sHTML = ctrlFormDesigner.InjectedDivEditorFieldHTMLForFieldType(sID, sFieldID, "Thumbnail");
				break;

			default:
				sHTML = ctrlFormDesigner.InjectedDivEditorFieldHTMLForFieldType(sID, sFieldID, "Div");
		}

		return sHTML;
	},

	InjectedDivEditorFieldHTMLForFieldType: function(sID, sFieldID, sTriSysWidgetType)
	{
		var sFieldTemplate = $('#ctrlFormDesigner-Edit-' + sTriSysWidgetType + '-template').html().trim();
		var sHTML = sFieldTemplate.split('{{Edit-' + sTriSysWidgetType + 'Id}}').join(sFieldID);
		sHTML = sHTML.split('{{Edit-' + sTriSysWidgetType + 'Name}}').join(sID);
		sHTML = sHTML.split('{{Edit-' + sTriSysWidgetType + 'BackColour}}').join(ctrlFormDesigner.Settings.DesignTimeWidgetBackColour());

		return sHTML;
	},

	// For existing or new fields, return the HTML which will be displayed in design mode
	DesignTimeFieldHTML: function(fieldDescription, sOuterHTML)
	{
		var sID = fieldDescription.TableName + "_" + fieldDescription.TableFieldName;

		// Unique ID as there may be duplicate fields on the same form
		var sFieldID = ctrlFormDesigner.EditorObjectPrefix + TriSysSDK.Miscellaneous.GUID() + "_" + sID;

		// Store each field for later
		var sFieldHTML = sOuterHTML;
		ctrlFormDesigner.Data.Fields.push({ ID: sFieldID, HTML: sFieldHTML});

		var sFieldTemplate = $('#ctrlFormDesigner-Edit-Field-template').html().trim();
		var sField = sFieldTemplate.replace(/{{Edit-FieldId}}/g, sFieldID);
		sField = sField.replace(/{{Edit-FieldName}}/g, sID);
		sField = sField.replace(/{{Edit-FieldTableName}}/g, fieldDescription.TableName);
		sField = sField.replace(/{{Edit-FieldTableFieldName}}/g, fieldDescription.TableFieldName);
		sField = sField.replace(/{{Edit-FieldBackColour}}/g, ctrlFormDesigner.Settings.DesignTimeWidgetBackColour());

		return sField;
	},

	DesignTimeFieldLabelHTML: function(lbl, widget)
	{
		var sLabelID = ctrlFormDesigner.EditorObjectPrefix + TriSysSDK.Miscellaneous.GUID();

		var sLabelHTML, sText;

		if(lbl)
		{
			sLabelHTML = lbl.outerHTML;
			sText = lbl.innerText.trim();
		}
		else
		{
			if(Array.isArray(widget.HTML))
				sLabelHTML = widget.HTML.join('\n');
			else
				sLabelHTML = widget.HTML;

			sText = widget.Text;
		}
					
		// Store each label for later
		ctrlFormDesigner.Data.Labels.push({ ID: sLabelID, HTML: sLabelHTML, Text: sText });

		// Each <strong> label has a button
		var sLabelTemplate = $('#ctrlFormDesigner-Edit-Label-template').html().trim();
		var sLabel = sLabelTemplate.replace(/{{Edit-LabelId}}/g, sLabelID);

		sLabel = sLabel.replace(/{{Edit-LabelText}}/g, sText);
		sLabel = sLabel.replace(/{{Edit-LabelTextId}}/g, sLabelID + '-TextId');

		var sBackColour = TriSysProUI.GroupBorderColour();					// 8/10	 Rachael and I preferred this on 06 Mar 2019
		sLabel = sLabel.replace(/{{Edit-LabelBackColour}}/g, sBackColour);

		return sLabel;
	},

	// New 3rd party control introduced 05 Mar 2019
	TriSysGridManager:
	{
		// Maintain our own pointer initialised for each load of the canvas
		_gm: null,

		Draw: function(sCanvas)
		{
			ctrlFormDesigner.TriSysGridManager._gm = $("#" + sCanvas).gridmanager(
				{
					debug: 0,
					colSelectEnabled: 0,
					controlAppend: null,  // No source code, preview or save/reset options
					resetThemeCallback: ctrlFormDesigner.TriSysGridManager.ApplyTheme,
					addNewFieldCallback: ctrlFormDesigner.TriSysGridManager.popupFieldSelection
				}
			).data('gridmanager');

			ctrlFormDesigner.TriSysGridManager.ApplyTheme();
		},

		// CSS changes to match our theme
		ApplyTheme: function()
		{
			var sLineColour = TriSysProUI.BackColour(0.25);	// TriSysProUI.ThemedColour();
			var object = $('#gm-canvas .gm-editing');
			object.css('border-top', 'solid 1px ' + sLineColour);
			object.css('border-left', 'solid 1px ' + sLineColour);
			object.css('border-right', 'solid 1px ' + sLineColour);
			object.css('border-bottom', 'solid 1px ' + sLineColour);

			// If you need to set !important
			// https://stackoverflow.com/questions/2655925/how-to-apply-important-using-css
			//object.attr('style', object.attr('style') + '; ' + 'border-top: solid 1px ' + sLineColour + ' !important');
			//object.attr('style', object.attr('style') + '; ' + 'border-left: solid 1px ' + sLineColour + ' !important');
			//object.attr('style', object.attr('style') + '; ' + 'border-right: solid 1px ' + sLineColour + ' !important');
			//object.attr('style', object.attr('style') + '; ' + 'border-bottom: solid 1px ' + sLineColour + ' !important');

			sLineColour = TriSysProUI.ThemedColour();
			object = $('#gm-canvas .gm-tools a');
			object.css('color', sLineColour);

			object = $('#gm-canvas .gm-editable-region .gm-controls-element .gm-move');
			object.css('background-color', sLineColour);

			object = $('#gm-canvas .gm-editable-region .gm-controls-element .gm-delete');
			object.css('background-color', sLineColour);

			object = $('#gm-canvas .gm-editable-region');
			object.css('border-top', 'solid 1px ' + sLineColour);
			object.css('border-left', 'solid 1px ' + sLineColour);
			object.css('border-right', 'solid 1px ' + sLineColour);
			object.css('border-bottom', 'solid 1px ' + sLineColour);

			// Hover colours
			var sBackColour = TriSysProUI.BackColour();
			object = $('#gm-canvas .gm-tools .gm-removeRow:hover, #gm-canvas .gm-tools .gm-removeCol:hover');
			object.css('background-color', sBackColour);

			object = $('#gm-canvas .gm-tools a:hover');
			object.css('background-color', sBackColour);

			// The above hovers appear not to work, so have to use JS to come to the rescue
			$( "#gm-canvas .gm-tools a" ).hover(
			  function() {
				$( this ).css("background-color", sBackColour);
				$( this ).css("color", "white");
			  }, function() {
				$( this ).css("background-color", ""); //to remove property set it to ''
				$( this ).css("color", sLineColour);
			  }
			);

			// But having done that, we need to reset our own fields which lose the text colour!
			//$('#' + ctrlFormDesigner.Settings.EditorCanvasId).find("[id^='" + ctrlFormDesigner.EditorObjectPrefix + "']").each(function ()
			//{
			//	var hyperlink = this.firstChild;
			//	$(hyperlink).css('color', 'white');
			//});
		},

		ReadHTML: function()
		{
			var sHTML = ctrlFormDesigner.TriSysGridManager._gm.ReadRawHTML();
			return sHTML;
		},

		AddNewRow: function(iColumns)
		{
			if(!iColumns) 
				iColumns = 4;

			ctrlFormDesigner.TriSysGridManager._gm.CreateNewRow(iColumns);
		},

		popupFieldSelection: function(fnCallback)
		{
			// Popup selection dialogue
			var fnWidgetPickerCallback = function(fieldDescription, widget)
			{
				// 04 March 2019: TriSys field will be a popup field selector
				
				var sField = null;
				if(fieldDescription)
				{
					// TODO: Determine type from selected widget
					var sFieldName = fieldDescription.TableName + "_" + fieldDescription.TableFieldName;

					var sInputHTML = '<input type="text" class="k-textbox" id="' + sFieldName + '" required="required" style="width:100%">';
					sField =  ctrlFormDesigner.DesignTimeFieldHTML(fieldDescription, sInputHTML);
				}
				else if(widget)
				{
					switch(widget.Name)
					{
						case "Field-Label":
							sField = ctrlFormDesigner.DesignTimeFieldLabelHTML(null, widget);
							break;

						default:
							if(Array.isArray(widget.HTML))
								sField = widget.HTML.join('');
							else
								sField = widget.HTML;
					}
				}

				// This adds the field to the control
				fnCallback(sField);

				// After inserting HTML, by switching into preview mode, then back into edit mode
				// the editor mode will wrap the HTML with edit constraints
				if(widget)
				{
					if(widget.ForceReEditMode)
					{
						ctrlFormDesigner.DesignMode(false);
						ctrlFormDesigner.DesignMode(true);
					}
				}

				return true;
			};

			ctrlFormDesigner.WidgetPickerModal.Show(fnWidgetPickerCallback);

			// It appears we lose foreground colour on our fields again!
			setTimeout(ctrlFormDesigner.TriSysGridManager.ApplyTheme, 5);
		}

	},	// ctrlFormDesigner.TriSysGridManager

	WidgetPickerModal:       // ctrlFormDesigner.WidgetPickerModal
    {
        Show: function (fnWidgetPickedCallback)
        {
			var fnLoadWidgetPicker = function()
			{
				var parametersObject = new TriSysApex.UI.ShowMessageParameters();
				parametersObject.Title = "Widget Picker";
				parametersObject.Image = "gi-cogwheels";
				parametersObject.FullScreen = true;
				parametersObject.CloseTopRightButton = true;

				parametersObject.ContentURL = TriSysApex.CustomFormsAndComponents.UserControlPath("ctrlWidgetPicker.html");

				// Callback
				parametersObject.OnLoadCallback = function () {
					ctrlWidgetPicker.Load(fnWidgetPickedCallback);
				};

				// Buttons
				parametersObject.ButtonRightText = "Close";
				parametersObject.ButtonRightVisible = true;

				TriSysApex.UI.PopupMessage(parametersObject);
			};

			TriSysApex.WhiteLabelling.LoadJavascriptFile('js/pages/ctrlWidgetPicker.js', null, fnLoadWidgetPicker);
        }
	},

	Settings:																// ctrlFormDesigner.Settings
	{
		HiddenDOM: 'ctrlFormDesigner-DOM',									// ctrlFormDesigner.Settings.HiddenDOM
		EditorCanvasId: 'ctrlFormDesigner-EditorCanvas',					// ctrlFormDesigner.Settings.EditorCanvasId
		TableDesigners: false,												// March 2019: turn off. Designers can edit in raw code mode if necessary

		DesignTimeWidgetBackColour: function()								// ctrlFormDesigner.Settings.DesignTimeWidgetBackColour()
		{
			var sBackColour = TriSysProUI.BackColour(0.33);					// 6/10
			//sBackColour = TriSysProUI.NavBarInverseColour();				// 4/10
			sBackColour = TriSysProUI.GroupBorderColour();					// 8/10	 Rachael and I preferred this on 06 Mar 2019
			//sBackColour = TriSysProUI.RowBackColour();					// 7/10
			//sBackColour = TriSysProUI.AlternativeBlockTitleBackColour();	// 7/10
			return sBackColour;
		},
	
		Clipboard:															// ctrlFormDesigner.Settings.Clipboard
		{
			_List: [],

			Add: function(sID, sHTML, sType)								// ctrlFormDesigner.Settings.Clipboard.Add
			{
		debugger;

				var clipboardItem = ctrlFormDesigner.Settings.Clipboard._List.filter((item) => item.ID === sID).shift();
				if(clipboardItem)
					clipboardItem.HTML = sHTML;
				else
					ctrlFormDesigner.Settings.Clipboard._List.push({ ID: sID, HTML: sHTML, Type: sType });
			}
		}
	}

};	// ctrlFormDesigner
