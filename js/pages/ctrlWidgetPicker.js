var ctrlWidgetPicker =
{
	_CallbackOnSelection: null,

	Load: function(fnCallbackOnSelection)
	{
		ctrlWidgetPicker._CallbackOnSelection = fnCallbackOnSelection;

		setTimeout(ctrlWidgetPicker.LoadWidgets, 5);
	},

	WidgetCategories: [
		{ category: 'blocks',		caption: 'Block',		icon: 'gi gi-embed'							},
		{ category: 'clipboard',	caption: 'Clipboard',   icon: 'fa fa-clipboard',	clipboard: true	},
		{ category: 'fields',		caption: 'Field',		icon: 'fa fa-database',		grid: true		},
		{ category: 'images',		caption: 'Image',		icon: 'gi gi-picture'						},
		{ category: 'icons',		caption: 'Icon',		icon: 'fa fa-file-image-o'					}
	],

    // Called when the modal dialogue is loaded and we are to populate with dashboardtiles.json
    // and also configure button callbacks/views etc..
    LoadWidgets: function()
    {
		// Set height of widget-picker-list
		var iFudgeFactor = 330;
		var lHeight = $(window).height() - iFudgeFactor;
		var pickerList = $('#widget-picker-list');
		pickerList.height(lHeight);

        // Load list bar event handlers
        var liPrefix = 'widget-picker-category-';
       
        for (var i = 0; i < ctrlWidgetPicker.WidgetCategories.length; i++)
        {			
            var item = ctrlWidgetPicker.WidgetCategories[i];
			var sCategory = item.category;
            var liID = liPrefix + sCategory;
            var li = $('#' + liID);

            // Enumerate through each a href instance and set up the event handler
            li.find('a').each(function ()
            {
                $(this).click(function (e)
                {
                    e.preventDefault();
                    var li = $(this).parent();
                    var liID = li.attr("id");
                    var parts = liID.split(liPrefix);
                    var sSelectedCategory = parts[1];
					//var itemCategory = ctrlWidgetPicker.WidgetCategories.filter((item) => item.category === sSelectedCategory).shift();       Fails obfuscation
                    var itemCategory = ctrlWidgetPicker.WidgetCategories.filter(function (item)
                    {
                        return item.category === sSelectedCategory;
                    }).shift();

					ctrlWidgetPicker.WidgetPickerCategorySelection(itemCategory);
                });
            });
        }

        // Load default list
        ctrlWidgetPicker.PopulateListOfWidgetsForCategory(ctrlWidgetPicker.WidgetCategories[0]);
    },

    // Called when the user clicks on a category.
    // Make it active, and display the list of available widgets for this category.
    WidgetPickerCategorySelection: function(item)
    {
        var sUL = 'widget-picker-categories-list';
        $('#' + sUL).find('li').each(function ()
        {
            $(this).removeClass('active');
        });

        // Highlight chosen
        var liPrefix = 'widget-picker-category-';
        var liID = liPrefix + item.category;
        $('#' + liID).addClass('active');

        // Show caption & icon
        $('#widget-picker-category').html(item.caption);
		$('#widget-picker-category-icon').removeClass().addClass(item.icon + ' pull-left themed-color');

        // Show all available widgets
        ctrlWidgetPicker.PopulateListOfWidgetsForCategory(item);
    },

	// Fields is a grid, others are driven from .json file(s)
	PopulateListOfWidgetsForCategory: function(categoryItem)
	{
		var bFields = categoryItem.grid;

		var sGridID = 'widget-picker-grid';
		bFields ? ($('#'+sGridID).show(), $('#widget-picker-list').hide()) : ($('#'+sGridID).hide(), $('#widget-picker-list').show());

		if(bFields)
		{
			// Show waiting spinner
			TriSysSDK.Grid.WaitSpinnerMode({ Div: sGridID }, true);

			setTimeout(function() { ctrlWidgetPicker.PopulateFieldGrid(sGridID); }, 100);
			return;
		}

		// Read blocks etc from .json
		ctrlWidgetPicker.PopulateListOfWidgets(categoryItem);
	},

	// Read the .json file
	ReadWidgetsFromFile: function()
	{
		var widgets = TriSysApex.Forms.Configuration.JsonFileData('widgets.json');
		if(widgets)
			return widgets.Widgets;
	},

	GetWidgetByNameFromClipboard: function(sName)
	{
		var widget = null;
		var lst = ctrlFormDesigner.Settings.Clipboard._List;
		
		lst.forEach(function(categoryItem)
		{
			if(categoryItem.ID == sName)
			{
				widget = { 
					Category: 'clipboard', 
					Name: categoryItem.ID, 
					Caption: categoryItem.ID, 
					Description: categoryItem.HTML,
					HTML: categoryItem.HTML
				};

				// If a label, display the word label!
				if(categoryItem.Type)
					widget.Caption = categoryItem.Type;
			}
		});

		return widget;
	},

	// Read ctrlFormDesigner.Settings.Clipboard
	ReadWidgetsFromClipboard: function()
	{
		var lst = ctrlFormDesigner.Settings.Clipboard._List;

		// Show latest first
		var widgets = [];
		for(var i = lst.length - 1; i >= 0; i--)
		{
			var categoryItem = lst[i];

			var widget = ctrlWidgetPicker.GetWidgetByNameFromClipboard(categoryItem.ID);
			widgets.push(widget);
		}

		return widgets;
	},

	// Read the .json file for specified category 
    PopulateListOfWidgets: function(itemCategory)
    {
        ctrlWidgetPicker.RemoveAllWidgetsFromList();

		var widgets = null;
		if(itemCategory.clipboard)
			widgets = ctrlWidgetPicker.ReadWidgetsFromClipboard();
		else
			widgets = ctrlWidgetPicker.ReadWidgetsFromFile();

        if (!widgets)
            return null;

        var iAddedCounter = 0;
        for (var i = 0; i < widgets.length; i++)
        {
            var widget = widgets[i];
            var bAddWidget = (widget.Category.toLowerCase() == itemCategory.category.toLowerCase());

            if (widget.Hidden)
                bAddWidget = false;

            if (bAddWidget)
            {
                iAddedCounter += 1;
                ctrlWidgetPicker.AddWidgetToList(widget, iAddedCounter);
            }
        }
    },

	GetWidgetByNameFromJSONFile: function (sName)
    {
        var widgets = ctrlWidgetPicker.ReadWidgetsFromFile();

        if (!widgets)
            return null;

        for (var i = 0; i < widgets.length; i++)
        {
            var widget = widgets[i];
            if (widget.Name == sName)
                return widget;
        }
    },

	AddWidgetToList: function(widget, iRow)
    {
        // Get row templates
        var sTableRowTemplateID = 'widget-picker-category-widget-table-row';
        var sTableRowTemplateHTML = document.getElementById(sTableRowTemplateID).outerHTML;
        var sTableRowDividerTemplateID = 'widget-picker-category-widget-table-row-divider';
        var sTableRowDividerTemplateHTML = document.getElementById(sTableRowDividerTemplateID).outerHTML;

        // Replace tile details
        var sTableRowID = sTableRowTemplateID + '-' + iRow;
        var sTableRow = sTableRowTemplateHTML;
        sTableRow = sTableRow.replace(sTableRowTemplateID, sTableRowID);
        sTableRow = sTableRow.replace('display:none;', '');
        sTableRow = sTableRow.replace('display: none;', '');

		var sThumbnailDisplay = "block";
        var sThumbnailImage = widget.Thumbnail;
        var sImageFolder = 'https://apex.trisys.co.uk/images/trisys/widgets/';
        if (sThumbnailImage)
            sThumbnailImage = sImageFolder + sThumbnailImage;
        else
            sThumbnailDisplay = "none";

        var sCaption = widget.Caption;
        var sImageViewer = '';
        if (sThumbnailImage)
            sImageViewer = 'onclick="TriSysSDK.Controls.FileManager.OpenDocumentViewer(\'' + sCaption + '\', \'' + sThumbnailImage + '\');"';
        sTableRow = sTableRow.replace('##image-viewer##', sImageViewer);
		sTableRow = sTableRow.replace('##install-image-display##', sThumbnailDisplay);

        sTableRow = sTableRow.replace('##ImagePath##', sThumbnailImage);
        sTableRow = sTableRow.replace('##Caption##', sCaption);
        sTableRow = sTableRow.replace('##Description##', widget.Description);

        // The select button 
        var bInstalledInView = false;
        var sInstallHandler = 'onclick="ctrlWidgetPicker.SelectButtonClicked(\'' + widget.Name + '\', this);"';
        var sEnabled = (bInstalledInView ? 'disabled' : '');
        var sInstall = (bInstalledInView ? '' : sInstallHandler);
        sTableRow = sTableRow.replace('##install-enabled##', sEnabled);
        sTableRow = sTableRow.replace('##install-click##', sInstall);


        // Add this row to the DOM
        var sTableID = 'widget-picker-category-widget-table';
        if (iRow > 1)
        {
            var sRowDivider = sTableRowDividerTemplateHTML;
            sRowDivider = TriSysSDK.DocumentObjectModel.RemoveStyleDisplayNone(sRowDivider);    //.replace('style="display:none;"', '');
            $('#' + sTableID).append(sRowDivider);
        }

        $('#' +sTableID).append(sTableRow);
	},

    // Install into designer
	SelectButtonClicked: function(sWidgetName, btn)
    {
		var widget = null;

		// Get from either clipboard or widgets.json file
        widget = ctrlWidgetPicker.GetWidgetByNameFromClipboard(sWidgetName);

		if(!widget)	
			widget = ctrlWidgetPicker.GetWidgetByNameFromJSONFile(sWidgetName);

        if (widget)
			ctrlWidgetPicker.SelectedWidget(null, widget);
	},

	RemoveAllWidgetsFromList: function()
    {
        // Enumerate through all VISIBLE TR's and remove each
        var sTableID = 'widget-picker-category-widget-table';

        $('#' + sTableID + ' tr').each(function (i, row)
        {
            var sDisplay = $(row).css("display");
            if (sDisplay)
            {
                if (sDisplay.indexOf("none") < 0)
                    $(row).remove();
            }
        });
    },

	PopulateFieldGrid: function(sGridID)
	{
		var fieldDescriptions = TriSysApex.Cache.FieldDescriptions();

        // Important Bug: We must take a copy of the field descriptions as we do not want to edit them
        //fieldDescriptions = JSON.parse(JSON.stringify(fieldDescriptions));

		// Filter based on entity?

        // Sort field descriptions
        fieldDescriptions.sort(function (a, b)
        {
            var x = a.TableName.toLowerCase() + '_' + a.TableFieldName.toLowerCase(),
            y = b.TableName.toLowerCase() + '_' + b.TableFieldName.toLowerCase();
            return x < y ? -1 : x > y ? 1 : 0;
        });

		var columns = [
                { field: "FieldId", title: "FieldId", type: "number", width: 70, hidden: true },
                { field: "TableName", title: "TableName", type: "string" },
                { field: "TableFieldName", title: "TableFieldName", type: "string" },
                { field: "FieldTypeName", title: "Field Type", type: "string" },
                { field: "Lookup", title: "Lookup", type: "string", template: '# if(Lookup == "true"){#Yes#}else{#No#} #' },
                { field: "Description", title: "Description", type: "string" }
        ];

		// Show less records in modal popups
        var iModalRecordsPerPage = TriSysApex.UserOptions.RecordsPerPage() / 2;

		var sDivTag = sGridID;
        var sGridName = sDivTag + '-GridInstance';

        TriSysSDK.Grid.VirtualMode({
            Div: sDivTag,
            ID: sGridName,
            Title: "Field Descriptions",
            RecordsPerPage: iModalRecordsPerPage,
            PopulationByObject: fieldDescriptions,
            Columns: columns,

            KeyColumnName: "FieldId",
            DrillDownFunction: function (rowData)
            {
				fieldDescriptions.forEach(function(fieldDescription)
				{
					if(fieldDescription.FieldId == rowData.FieldId)
						ctrlWidgetPicker.SelectedWidget(fieldDescription);
				});                
            },
            MultiRowSelect: false,
            Grouping: false,
			OpenButtonCaption: "Select"
        });
	},

	SelectedWidget: function(fieldDescription, widget)
	{
		ctrlWidgetPicker._CallbackOnSelection(fieldDescription, widget);
		TriSysApex.UI.CloseModalPopup();
	}

};	// ctrlWidgetPicker