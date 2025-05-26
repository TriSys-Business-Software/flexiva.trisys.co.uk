var ctrlDeveloperToolCodeGenerator =
{
	_FormFileName: null,		// MyForm.html
	_FormName: null,			// MyForm
	_HTML: '',
	_Javascript: '',
	_Properties: null,			// { }
	_CodeEditorJavascript: null,
	_CodeEditorHTML: null,
	PropertySheetID: 'ctrlDeveloperToolCodeGenerator-PropertySheet',
	CodeEditorJavascriptID: 'ctrlDeveloperToolCodeGenerator-Javascript-CodeEditor',
	CodeEditorHTMLID: 'ctrlDeveloperToolCodeGenerator-HTML-CodeEditor',

	Load: function(sFormFileName, sCaption, sHTML, sJavascript, properties)
	{
		ctrlDeveloperToolCodeGenerator._FormFileName = sFormFileName;
		ctrlDeveloperToolCodeGenerator._FormName = TriSysApex.Pages.FileManagerForm.FileNameWithoutSuffix(sFormFileName);
		ctrlDeveloperToolCodeGenerator._HTML = sHTML;
		ctrlDeveloperToolCodeGenerator._Javascript = sJavascript;
		ctrlDeveloperToolCodeGenerator._Properties = properties;

		ctrlDeveloperToolCodeGenerator.LoadCodeEditors(sHTML, sJavascript);

		if(properties && properties.Configuration && properties.Configuration.PropertySheet)
		{
			ctrlDeveloperToolCodeGenerator.PreProcessFieldPropertySheetItems(properties.Configuration, properties.Configuration.PropertySheet.Items);
			ctrlDeveloperToolCodeGenerator.LoadPropertySheet(properties.Configuration.PropertySheet.Items);
		}
		else
			ctrlDeveloperToolCodeGenerator.SetCodeEditorHeight();
	},

	LoadPropertySheet: function(items)
	{
		var sPropertySheetID = ctrlDeveloperToolCodeGenerator.PropertySheetID;

        var propertySheetData = {
            title: "Properties",
            propertyColumnName: 'Property',
            valueColumnName: 'Settings',
            categoryColumnHide: true,
            objectList: items,
            fieldValueChange: ctrlDeveloperToolCodeGenerator.FieldValueChange
        };
        TriSysApex.PropertySheet.Draw(sPropertySheetID, propertySheetData, function ()
        {
            // Allow a little time for composite controls to fully load before populating default values
            setTimeout(function ()
            {
                ctrlPropertySheet.ApplyDefaults(sPropertySheetID, propertySheetData);
				ctrlDeveloperToolCodeGenerator.ReplaceCodeInEditorsFromFields();
				ctrlDeveloperToolCodeGenerator.SetCodeEditorHeight();

            }, 20);
        });
	},

    // Every field change fires back to us so that we can write the generated code using all replacements
    FieldValueChange: function (sCategory, sName, objValue)
    {
        // Have to read all properties and do all replacements
		ctrlDeveloperToolCodeGenerator.ReplaceCodeInEditorsFromFields();
    },

	ReplaceCodeInEditorsFromFields: function()
	{
		var sMergedHTMLCode = ctrlDeveloperToolCodeGenerator.ReplaceFieldsInCode(ctrlDeveloperToolCodeGenerator._HTML);
		ctrlDeveloperToolCodeGenerator._CodeEditorHTML.setValue(sMergedHTMLCode ? sMergedHTMLCode : '');

		var sMergedJavascriptCode = ctrlDeveloperToolCodeGenerator.ReplaceFieldsInCode(ctrlDeveloperToolCodeGenerator._Javascript);
		ctrlDeveloperToolCodeGenerator._CodeEditorJavascript.setValue(sMergedJavascriptCode ? sMergedJavascriptCode : '');
	},

	ReplaceFieldsInCode: function(sMergedCode)
	{
		if(sMergedCode)
		{
			if(typeof ctrlPropertySheet !== "undefined")
			{
				// Have to read all properties and do all replacements
				var items = ctrlPropertySheet.GetItems( ctrlDeveloperToolCodeGenerator.PropertySheetID );
				if(items)
				{
					var bInjectedHTML = ctrlDeveloperToolCodeGenerator.PreProcessFieldPropertyItems(items);

					items.forEach(function(item)
					{
						var sField = "{{" + item.Name + "}}";
						var sValue = item.Value;
						if(sValue)
						{
							if(ctrlDeveloperToolCodeGenerator.isProcessedFieldProperty(item.Name, sValue))
							{
								// User has chosen a lookup and we are going to generate the HTML code
								sValue = ctrlDeveloperToolCodeGenerator.GeneratedFieldPropertyHTML(item.Name, sValue);
							}
							else if(!bInjectedHTML)
							{
								// Finally make sure that this is pure HTML
								sValue = $('<span>').text(sValue).html();
							}
						}
					
						sMergedCode = sMergedCode.replace(new RegExp(sField, "g"), sValue);
					});
				}
			}

			// Any other module level changes?
			sMergedCode = sMergedCode.replace(new RegExp("{{" + "FormName" + "}}", "g"), ctrlDeveloperToolCodeGenerator._FormName);
		}

		return sMergedCode;
	},

	LoadCodeEditors: function(sHTML, sJavascript)
	{
		var mode = DeveloperStudio.GetCodeEditorMode(true);
		ctrlDeveloperToolCodeGenerator._CodeEditorHTML = DeveloperStudio.ConvertDivToCodeEditor(ctrlDeveloperToolCodeGenerator.CodeEditorHTMLID, sHTML, mode);

		// Need a border
		var sBorderColour = TriSysProUI.GroupBorderColour();
		$('#' + ctrlDeveloperToolCodeGenerator.CodeEditorHTMLID).css('border', '1px solid ' + sBorderColour);

		mode = DeveloperStudio.GetCodeEditorMode(false);
		ctrlDeveloperToolCodeGenerator._CodeEditorJavascript = DeveloperStudio.ConvertDivToCodeEditor(ctrlDeveloperToolCodeGenerator.CodeEditorJavascriptID, sJavascript, mode);

		// Need a border
		$('#' + ctrlDeveloperToolCodeGenerator.CodeEditorJavascriptID).css('border', '1px solid ' + sBorderColour);

        // 03 Apr 2023: curved radius
		$('#' + ctrlDeveloperToolCodeGenerator.CodeEditorJavascriptID).css('border-radius', '8px');     // 03 Apr 2023
		$('#' + ctrlDeveloperToolCodeGenerator.CodeEditorHTMLID).css('border-radius', '8px');           // 03 Apr 2023


		//if(bJavaScriptNotation)
		//{
		//	// Too complicated as wedded to multiple instances.
		//	// Perhaps a future ToDo?
		//}
	},

	SetCodeEditorHeight: function()
	{
		var iPropertySheetHeight = 0;
		var iHeightFactor = 350;
		if(ctrlDeveloperToolCodeGenerator._Properties)
		{
			iPropertySheetHeight = $('#' + ctrlDeveloperToolCodeGenerator.PropertySheetID + '-ctrlPropertySheet-Root').height();
			iHeightFactor = 390;
		}

        var lHeight = window.innerHeight - iHeightFactor - iPropertySheetHeight;

        $('#' + ctrlDeveloperToolCodeGenerator.CodeEditorJavascriptID).height(lHeight);		//.width("100%");
		ctrlDeveloperToolCodeGenerator._CodeEditorJavascript.setSize('100%', lHeight);
        ctrlDeveloperToolCodeGenerator._CodeEditorJavascript.refresh();
        $('#' + ctrlDeveloperToolCodeGenerator.CodeEditorJavascriptID).children(":first").css('border-radius', '8px');  // 03 Apr 2023

        $('#' + ctrlDeveloperToolCodeGenerator.CodeEditorHTMLID).height(lHeight);		//.width("100%");
		ctrlDeveloperToolCodeGenerator._CodeEditorHTML.setSize('100%', lHeight);
		ctrlDeveloperToolCodeGenerator._CodeEditorHTML.refresh();
		$('#' + ctrlDeveloperToolCodeGenerator.CodeEditorHTMLID).children(":first").css('border-radius', '8px');  // 03 Apr 2023
	},

	GetCode: function(bGetJavascriptCode)
	{
		if(bGetJavascriptCode)
			return ctrlDeveloperToolCodeGenerator._CodeEditorJavascript.getValue();
		else
			return ctrlDeveloperToolCodeGenerator._CodeEditorHTML.getValue();
	},

	// Before showing the list, pre-process some list items 
	PreProcessFieldPropertySheetItems: function(configuration, items)
	{
		switch(ctrlDeveloperToolCodeGenerator._Properties.FileName)
		{
			case "Grid-Web-API.json":
				if(configuration.Functions)
				{
					items.forEach(function(item)
					{
						if(item.Name == "Function")
						{
							var lstFunctions = [];
							configuration.Functions.forEach(function(objFunction)
							{
								var bAddFunction = true;

								// Test other settings
								var bRecruitmentDatabase = TriSysAPI.Operators.stringToBoolean(TriSysApex.Cache.UserSettingManager.GetValue("RecruitmentDatabase", false));

							    if(objFunction.RecruitmentDatabaseOnly)
									bAddFunction = bRecruitmentDatabase;

								if(objFunction.SpecificDatabasesOnly)
								{
									var userCredentials = TriSysApex.LoginCredentials.UserCredentials();
									var sCurrentDatabase = userCredentials.Database;
									bAddFunction = (objFunction.SpecificDatabasesOnly.indexOf(sCurrentDatabase) >= 0);
								}								

								if(bAddFunction)
									lstFunctions.push(objFunction.Function);
							});
							item.List = lstFunctions;
						}
					});
				}
				return true;
		}
	},

	// When we need to pre-process the items for example generating multiple rows or columns
	PreProcessFieldPropertyItems: function(items)
	{
		switch(ctrlDeveloperToolCodeGenerator._Properties.FileName)
		{
			case "RowBlocks.json":
				ctrlDeveloperToolCodeGenerator.AppendRowBlocksItems(items);
				return true;

			case "Rows.json":
				ctrlDeveloperToolCodeGenerator.AppendRowsItems(items);
				return true;

			case "Grid-Web-API.json":
				ctrlDeveloperToolCodeGenerator.AppendWebAPIItems(items);
		}

		return false;
	},

	_lstColumnSizeMatrix: 
		[
			{ num:  1, cols: [12] },
			{ num:  2, cols: [6,6] },
			{ num:  3, cols: [4,4,4] },
			{ num:  4, cols: [3,3,3,3] },
			{ num:  5, cols: [3,2,3,2,2] },
			{ num:  6, cols: [2,2,2,2,2,2] },
			{ num:  7, cols: [1,2,2,2,2,2,1] },
			{ num:  8, cols: [2,1,2,1,2,1,2,1] },
			{ num:  9, cols: [1,1,2,1,2,1,2,1,1] },
			{ num: 10, cols: [2,1,1,1,1,1,1,1,1,2] },
			{ num: 11, cols: [2,1,1,1,1,1,1,1,1,1,1] },
			{ num: 12, cols: [1,1,1,1,1,1,1,1,1,1,1,1] }
		],

	AppendRowBlocksItems: function(items)
	{
		var iNumberOfBlocks = 0, sColumnSize = null;
		items.forEach(function(item)
		{
			if(item.Name == "Number of Blocks")
				iNumberOfBlocks = parseInt(item.Value);
			if(item.Name == "Column Size")
				sColumnSize = item.Value;
		});
		
		var col = ctrlDeveloperToolCodeGenerator._lstColumnSizeMatrix[iNumberOfBlocks-1];
		var sHTML = '';
		col.cols.forEach(function(column)
		{
			var sCol = 'col-' + sColumnSize + '-' + column;
			sHTML += '\t\t<div class="' + sCol + '">\n' +
				'\t\t\t' + '<div class="block"><p><code>' + sCol + '</code></p></div>\n' +
				'\t\t</div>\n';
		});

		var newItem = { Name: "RowBlocks", Value: sHTML };
		items.push(newItem);
	},

	AppendRowsItems: function(items)
	{
		var iNumberOfRows = 0, iNumberOfColumns = 0, sColumnSize = null;
		items.forEach(function(item)
		{
			if(item.Name == "Number of Rows")
				iNumberOfRows = parseInt(item.Value);
			if(item.Name == "Number of Columns")
				iNumberOfColumns = parseInt(item.Value);
			if(item.Name == "Column Size")
				sColumnSize = item.Value;
		});
		
		var col = ctrlDeveloperToolCodeGenerator._lstColumnSizeMatrix[iNumberOfColumns-1];
		var sHTML = '';
		for(var i = 0; i < iNumberOfRows; i++)
		{
			sHTML += '\t' + '<div class="row">' + '\n';
			col.cols.forEach(function(column)
			{
				var sCol = 'col-' + sColumnSize + '-' + column;
				sHTML += '\t\t<div class="' + sCol + '">\n' +
					'\t\t\t' + '<p><code>' + sCol + '</code></p>\n' +
					'\t\t</div>\n';
			});
			sHTML += '\t</div>\n';
		}

		var newItem = { Name: "Rows", Value: sHTML };
		items.push(newItem);
	},

	AppendWebAPIItems: function(items)
	{
		var sFunction = null;
		items.forEach(function(item)
		{
			if(item.Name == "Function")
				sFunction = item.Value;
		});

		// Call synchronous web API to get a small dataset from the specified Web API
		// including a list of columns and add {{ParametersRequestAssignments}}, {{Columns}} and {{FirstGridField}}
		var CWebAPICodeGeneratorRequest = { Function: sFunction };

        var payloadObject = {};

        payloadObject.URL = "DeveloperStudio/WebAPICodeGenerator";

        payloadObject.OutboundDataPacket = CWebAPICodeGeneratorRequest;

		payloadObject.Asynchronous = false;

		var CWebAPICodeGeneratorResponse = null;
        payloadObject.InboundDataFunction = function (data)
        {
            TriSysApex.UI.HideWait();
			CWebAPICodeGeneratorResponse = data;            
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('ctrlDeveloperToolCodeGenerator.AppendWebAPIItems: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Reading Web API...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);

		// We are here AFTER the synchronous call
		if(CWebAPICodeGeneratorResponse && CWebAPICodeGeneratorResponse.Success)
		{
			if(!CWebAPICodeGeneratorResponse.ParametersAssignments)
				CWebAPICodeGeneratorResponse.ParametersAssignments = '';
			var parametersItem = { Name: "ParametersRequestAssignments", Value: CWebAPICodeGeneratorResponse.ParametersAssignments };
			items.push(parametersItem);

			var sColumns = '[\n', iColumnCount = 0;
			CWebAPICodeGeneratorResponse.Columns.forEach(function(column)
			{
				iColumnCount += 1;
				var sHidden = (iColumnCount > 10 ? "true" : "false");

				// { field: "Timesheet_TimesheetId", title: "ID", type: "number", width: 70, hidden: true },
				var sFormat = column.format ? ', format: "' + column.format + '"' : '';
				sColumns += iColumnCount > 1 ? ',\n' : '';
				sColumns += '\t\t\t' + '{field: "' + column.field + '", title: "' + column.title + '", type: "' + column.type + '"' + sFormat + ', width: 70, hidden: ' + sHidden + '}';
			});
			sColumns += '\n\t\t]';

			var columnsItem = { Name: "Columns", Value: sColumns };
			items.push(columnsItem);

			var firstColumnItem = { Name: "FirstGridField", Value: CWebAPICodeGeneratorResponse.Columns[0].field };
			items.push(firstColumnItem);
		}
	},

	isProcessedFieldProperty: function(sPropertyName, sValue)
	{
		var sHTML = ctrlDeveloperToolCodeGenerator.GeneratedFieldPropertyHTML(sPropertyName, sValue);
		return sHTML ? true : false;
	},

	GeneratedFieldPropertyHTML: function(sPropertyName, sValue)
	{
		switch(ctrlDeveloperToolCodeGenerator._Properties.FileName)
		{
			case "Row.json":
				switch(sPropertyName)
				{
					case "Field":
						return ctrlDeveloperToolCodeGenerator.FieldHTMLFromType(sValue);
				}
				break;
		}
	},

	FieldHTMLFromType: function(sType)
	{
		var sProperties = '';
		var sID = ctrlDeveloperToolCodeGenerator._FormName + '-field-' + sType + '-' + TriSysSDK.Miscellaneous.RandomNumber(10000, 999999);
		sType = ' type="' + sType + '"';
		var sHTML = '<trisys-field id="' + sID + '" ' + sType + ' ' + sProperties + '></trisys-field>';
		return sHTML;
	}

};	// ctrlDeveloperToolCodeGenerator