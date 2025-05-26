// 28 Nov 2024: File created in Flexiva project to replace the KendoUI grid
//
var ctrlKeyValuePairsTable =
{
	// Called after the HTML is injected into the DOM
	Loaded: function (options)
	{
		// Our HTML has been injected into the DOM

		// Custom add button
		if (options.ObjectName)
		{
			const spanInsideButton = $('#' + options.ID + ' button[type="submit"]:first span');
			spanInsideButton.text("Add " + options.ObjectName);
		}
		
		// Now write these options to the DIV so that we can access them later
		var div = document.getElementById(options.ID);
		const sBase64Options = btoa(JSON.stringify(options));
		div.setAttribute(TriSysFlexiva.Settings.Constants.ControlDataTag, sBase64Options);

		// Now draw the existing data into the table
		if (options.Data)
		{
			// Loop through the data and add a row for each item
			options.Data.forEach(function (item)
			{
				ctrlKeyValuePairsTable.AddRow(options, item);
			});
		}

		// We may be instantiated as read-only
		if (options.ReadOnly)
		{
			ctrlKeyValuePairsTable.SetReadOnly(options, true);
		}

		// Caller may wish to interfere with our labels
		if (options.ColumnLabelFunction)
		{
			ctrlKeyValuePairsTable.AllowReLabelling($(div), options.ColumnLabelFunction)
		}

		// Caller may wish to interfere with our fields too
		ctrlKeyValuePairsTable.ConfiguredFieldBehaviours(options)
	},

	// Called when the form is shown and also when a new row is added
	// Hosting panel may wish to have custom behaviours for the fields
	ConfiguredFieldBehaviours(options)
	{
		if (options.ColumnFieldFunction)
		{
			const rootTableElement = $('#' + options.ID);
			ctrlKeyValuePairsTable.EnumerateRowConfiguration(rootTableElement, options.ColumnFieldFunction)
		}
	},

	// Caller wants to change the default behaviour of the fields
	EnumerateRowConfiguration: function (rootControlElement, fnCallback)
	{
		// Filter for elements with class names starting with "column-header-"
		const fieldRows = ctrlKeyValuePairsTable.EnumerateRowsMatchingClass(rootControlElement, 'column-field-');

		// Call the callback function with each of filtered elements
		fieldRows.forEach(function (rowData, iRowIndex)
		{
			if (rowData.fields)
			{
				rowData.fields.forEach(function (fieldElement, iColumnIndex)
				{
					// This fnCallback is a string, so we must call it dynamically
					TriSysApex.DynamicClasses.CallFunction(fnCallback, iRowIndex, iColumnIndex, fieldElement);
				});
			}			
		});
	},

	// Get all elements in all rows which match class prefix
	EnumerateRowsMatchingClass: function (rootControlElement, sClassPrefix)
	{
		// Array to store results
		var results = [];

		// Find all rows that are actual table rows containing the fields
		var rows = rootControlElement.find("tr[id^='ctrlKeyValuePairsTableRow-']");

		// Process each row
		rows.each(function ()
		{
			var row = $(this);
			var fieldElements = [];

			// Find columns with class names starting with the prefix
			row.find("[class*='" + sClassPrefix + "']").each(function ()
			{
				var column = $(this);

				// Get the child elements of this column (input, select, etc.)
				var childElements = column.children();

				// Add each child element to our results
				childElements.each(function ()
				{
					fieldElements.push($(this));
				});
			});

			// Only add rows that have child elements
			if (fieldElements.length > 0)
			{
				results.push({
					fields: fieldElements
				});
			}
		});

		return results;
	},

	EnumerateElementsMatchingClass: function (rootControlElement, sClassPrefix)
	{
		// Find all elements within the container
		var allElements = rootControlElement.find("*");

		// Filter for elements with class names starting with "column-header-"
		const matchingElements = [];
		allElements.each(function ()
		{
			var classes = $(this).attr("class");

			// Skip elements with no classes
			if (!classes)
			{
				return;
			}

			// Check each class name
			var classArray = classes.split(" ");
			for (var i = 0; i < classArray.length; i++)
			{
				if (classArray[i].startsWith(sClassPrefix))
				{
					matchingElements.push($(this));
				}
			}
		});

		return matchingElements;
	},

	// Caller wants to change the field labels
	AllowReLabelling: function (rootControlElement, fnCallback)
	{
		// Filter for elements with class names starting with "column-header-"
		const columnHeaderElements = ctrlKeyValuePairsTable.EnumerateElementsMatchingClass(rootControlElement, 'column-header-');

		// Call the callback function with each of filtered elements
		var iIndex = 0;
		columnHeaderElements.forEach(function (element)
		{
			// Call the callback function with the current element and index
			const sNewLabel = fnCallback(iIndex);			
			iIndex++;

			if (sNewLabel)
			{
				// Set the new label
				element.text(sNewLabel);
			}
		});
	},

	// Called when the add button is clicked! Who knew? ;-)
	AddButtonClicked: function (clickedElement)
	{
		// Get the clicked button using the 'this' context from the onclick event
		const options = ctrlKeyValuePairsTable.GetControlOptions(clickedElement);
		if (!options) return;

		// 17 Apr 2025: Hosting form wants more control before adding a row
		if (options.AddRowCallback)
		{
			// Call dynamic function to call the callback function which will probably prompt the designer
			TriSysApex.DynamicClasses.CallFunction(options.AddRowCallback, options);
		}
		else
		{
			// Add a new row to the table
			ctrlKeyValuePairsTable.AddRow(options, null);
		}
	},

	DeleteRowButtonClicked: function (clickedElement)
	{
		// Get the clicked button using the 'this' context from the onclick event
		const options = ctrlKeyValuePairsTable.GetControlOptions(clickedElement);
		if (!options) return;

		// Get the clicked row id using the 'this' context from the onclick event
		const row = clickedElement.closest('tr');
		if (!row) return;
		const rowID = row.attr('id');

		const sMessage = "Are you sure you want to delete this " + options.ObjectName + "?";
		TriSysApex.UI.questionYesNo(sMessage, "Delete " + options.ObjectName, "Yes",
			function ()
			{
				$('#' + rowID).remove();

				ctrlKeyValuePairsTable.SendUpdatedDataToHostingForm(options);

				return true;
			},
			"No");		
	},

	GetControlOptions: function (clickedElement)
	{
		// Find the closest ancestor that has the flexiva-control-data attribute
		const parentWithData = clickedElement.closest('[' + TriSysFlexiva.Settings.Constants.ControlDataTag + ']');

		// Get the ID if the parent was found
		if (parentWithData.length > 0)
		{
			const sBase64 = parentWithData.attr(TriSysFlexiva.Settings.Constants.ControlDataTag);
			if (!sBase64)
				return null;	// If we have not yet loaded the control, return null

			const sOptionsJSON = atob(sBase64);
			const options = JSON.parse(sOptionsJSON);
			return options;
		}
		else
		{
			console.log('No parent with ' + TriSysFlexiva.Settings.Constants.ControlDataTag + ' found');
			return null;
		}
	},

	// Called for both existing data and new rows
	AddRow: function (options, item)
	{
		// Get the template contents directly from index.html
		var sRowHTML = TriSysApex.FormsManager.getControlTemplateHTML('ctrlKeyValuePairsTableRow.html');

		// Replace all occurrences of this {{ctrlKeyValuePairsTableRow-Id}} with the row ID
		if (!item)
			item = {};

		if (!item.RowGUID)
			item.RowGUID = TriSysSDK.Miscellaneous.GUID();

		sRowHTML = sRowHTML.replaceAll('{{ctrlKeyValuePairsTableRow-Id}}', item.RowGUID);

		// Find the table within the given parent
		const table = $('#' + options.ID + ' table tbody');

		// Add new row after the last row
		table.append(sRowHTML);

		// Convert <trisys-field> elements into actual fields
		const sRowID = 'ctrlKeyValuePairsTableRow-' + item.RowGUID;
		TriSysSDK.CShowForm.HTMLFieldsCodeInjection({ rootElementId: sRowID });

		// 17 Apr 2025: Field behaviours
		ctrlKeyValuePairsTable.ConfiguredFieldBehaviours(options, table);

		// Write the data into the fields
		$('#' + sRowID + '-Key').val(item.Key);
		$('#' + sRowID + '-Value').val(item.Value);
		$('#' + sRowID + '-Description').val(item.Description);

		// If we are in read-only mode, set the fields and delete button to read-only
		if (options.ReadOnly)
		{
			$('#' + sRowID + '-Key').prop('readonly', true);
			$('#' + sRowID + '-Value').prop('readonly', true);
			$('#' + sRowID + '-Description').prop('readonly', true);
			$('#' + sRowID + ' button[type="submit"]').prop('disabled', true);
			return;
		}

		// Prevent garbage being written into the Key field as this typically will form a JSON object
		$('#' + sRowID + '-Key').on('input', function (e)
		{
			const sValue = $(this).val();
			const sEscapedValue = TriSysSDK.Miscellaneous.EscapeJSONField(sValue);

			if (sValue != sEscapedValue)
			{
				// Invalid character entered

				// Store current cursor position
				const cursorPos = this.selectionStart;

				// Replace it with cleaned version
				$(this).val(sEscapedValue);

				// Adjust cursor position based on how many characters were removed
				const newPos = Math.min(cursorPos, sEscapedValue.length);
				this.setSelectionRange(newPos, newPos);
			}
		});

		// Subscribe to receive a text injection e.g. app studio -> data source -> Insert -> Variable menu
		if(options.PostAddRowCallback)
		{
			// We must call this dynamically
			TriSysApex.DynamicClasses.CallFunction(options.PostAddRowCallback, sRowID);
		}

		// Change event handler
		const fnValueChangedEventHandler = function (e)
		{
			const id = $(this).attr('id');
			const value = $(this).val();
			console.log('Event type:', e.type, 'ID:', id, 'New value:', value);
			ctrlKeyValuePairsTable.SendUpdatedDataToHostingForm(options);
		};

		// Add event handlers to the fields
		const lstField = ['Key', 'Value', 'Description'];
		lstField.forEach(function (sField)
		{
			const elem = $('#' + sRowID + '-' + sField);
			elem.on('change', fnValueChangedEventHandler);		// This captures both user typing and pasting
		});
	},

	SendUpdatedDataToHostingForm: function (options)
	{
		if (options.SaveFunctionCallback)
		{
			// Send all valid data to the parent i.e. incomplete rows without a key or value are not sent
			const data = ctrlKeyValuePairsTable.ReadData(options.ID);

			console.log('SendUpdatedDataToHostingForm: calling ' + options.SaveFunctionCallback);

			// We must call this dynamically
			TriSysApex.DynamicClasses.CallFunction(options.SaveFunctionCallback, data);
		}
	},

	// Get the data from the table
	ReadData: function (sID)
	{
		const rows = [];

		// Find all rows except the header row (first row)
		$(`#${sID} table tbody tr:not(:first)`).each(function ()
		{
			const row = $(this);
			const rowId = row.attr('id');

			// Only process rows that have an ID (excludes any spacing rows)
			if (rowId)
			{
				const keyValue = $(`#${rowId}-Key`).val();
				const value = $(`#${rowId}-Value`).val();
				const description = $(`#${rowId}-Description`).val();

				// Add row data if anything has a value
				if (keyValue || value || description)
				{
					// Remove the prefix from the row ID as we will only store the GUID
					const sPersistedRowId = rowId.replace('ctrlKeyValuePairsTableRow-', '');

					rows.push({
						RowGUID: sPersistedRowId,
						Key: keyValue || "",
						Value: value || "",
						Description: description || ""
					});
				}
			}
		});

		return rows;
	},

	// Called after existing rows are drawn
	SetReadOnly: function (options, bReadOnly)
	{
		// As each row is added, their fields and delete button are set to read-only

		// All we have to do is hide the add button
		$('#' + options.ID + ' button[type="submit"]:first').hide();		
	}

};	// ctrlKeyValuePairsTable