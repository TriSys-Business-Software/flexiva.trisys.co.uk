/*
 * ctrlPropertySheet
 * Feb 2018
 *
 * Display a filterable grid of fields where each field can be edited raising a callback event
 * in the caller for immediate reflection in a form, or database.
 *
 * Initially used for the admin console security subsystem.
 * 
 * See configuration/security-objects.json, TriSysApex.Cache.ApplicationSettingsManager.Security
 *		"User/WriteSetting", AdminConsole.Security.WriteSetting
 *		
 * Dec 2018: Used by form designer which is a much simpler usage scenario.		
 *
 */
var ctrlPropertySheet =
{
	// data:
	//	objectList: a list of items - e.g. security-objects.json SecurityItems list
	//	title: the title of the types of objects displayed
	//  fieldValueChange: the event raised when a field value changes. 
	//		This must be a string e.g. "AdminConsole.Security.FieldValueChange"
	//		because we need to store it inside the control instance to call on-demand.

	Load: function (sParentID, data, fnCompleted)
	{
		if (!sParentID || !data)
			return;
		if (!data.objectList)
			return;

		// We will be instantiated multiple times on separate pages, so will need to rename our internal ID's to be unique
		var sPrefix = sParentID + '-';
		$('#' + ctrlPropertySheet.ControlData.ControlRootId).attr('id', ctrlPropertySheet.ControlData.RootId(sPrefix));
		
		TriSysSDK.Controls.General.RenameElementIdsWithParentIdPrefixOrSuffix(ctrlPropertySheet.ControlData.RootId(sPrefix), sParentID, true);

		// Store the important, non-transient data such as callbacks in this control
		ctrlPropertySheet.ControlData.Store(sPrefix, {
			fieldValueChange: data.fieldValueChange
		});

		// Store the data with it too
		ctrlPropertySheet.ControlData.SetData(ctrlPropertySheet.ControlData.RootId(sPrefix), data);

		// Show the title
		$('#' + sPrefix + 'ctrlPropertySheet-title').html(data.title);

		// Filter
		if (data.filterHide)
			$('#' + sPrefix + 'ctrlPropertySheet-object-search').hide();

		// Property and Value column names
		$('#' + sPrefix + 'ctrlPropertySheet-propertyColumnName').html(data.propertyColumnName);
		$('#' + sPrefix + 'ctrlPropertySheet-valueColumnName').html(data.valueColumnName);

		// Allow columns to be hidden
		$('#' + sPrefix + 'ctrlPropertySheet-HideCategoryColumn').off().on('click', function ()
		{
			ctrlPropertySheet.HideColumnNumber(sPrefix, 0, "Category");
		});
		$('#' + sPrefix + 'ctrlPropertySheet-HideDescriptionColumn').off().on('click', function ()
		{
			ctrlPropertySheet.HideColumnNumber(sPrefix, 2, "Description");
		});

		// Set the height
		if (data.height > 0)
			$('#' + sPrefix + 'ctrlPropertySheet-Objects').height(data.height);

		// Load the objects to create a table
		ctrlPropertySheet.LoadObjectFilter(sPrefix);

		// Sort depending upon visible columns
		ctrlPropertySheet.SortItemsBeforeDisplay(data.objectList, !data.categoryColumnHide);

		// Display on sheet/table
		for (var i = 0; i < data.objectList.length; i++)
		{
			var item = data.objectList[i];

			if(!item.Category)
				item.Category = "UndefinedCategory";

			if (!item.Hidden)
				ctrlPropertySheet.AddObject(sPrefix, item, data.fieldValueChange);
		}

	    // If any of these are <trisys-field> then instantiate these now
		TriSysSDK.CShowForm.HTMLFieldsCodeInjection();


		// Hide columns if necessary
		if (data.categoryColumnHide)
			ctrlPropertySheet.HideColumnNumber(sPrefix, 0, "Category");

		if (data.descriptionColumnHide)
			ctrlPropertySheet.HideColumnNumber(sPrefix, 2, "Description");	

		ctrlPropertySheet.ShowingObjectCounters(sPrefix, data.objectList.length, data.objectList.length);
		setTimeout(TriSysProUI.kendoUI_Overrides, 200);     // Allow time for the theme to propagate

		// Need a border
		var sBorderColour = TriSysProUI.GroupBorderColour();
		$('#' + sPrefix + 'ctrlPropertySheet-Objects').css('border', '1px solid ' + sBorderColour);

	    // 01 Apr 2023: Custom scrollbar to look nice with curved panel
		TriSysSDK.EntityFormTabs.AddVerticalScrollBar(sPrefix + 'ctrlPropertySheet-Objects');

		// Let caller know so that they can explicitly set default values
		if (fnCompleted)
			fnCompleted();
	},

	// Caller must be careful to not call this immediately after instantiation if composite field types are
	// in the property sheet e.g. currency amount period, as these take time to properly load.
	// Better calling it using setTimeout.
	ApplyDefaults: function (sParentID, data)
	{
		if (!sParentID || !data)
			return;
		if (!data.objectList)
			return;

		var sPrefix = sParentID + '-';

		// In order to set the defaults however, we must run this on a timer thread because
		// some composite controls e.g. currency amount period will only be available after
		// we take a breath, hence we must do this separately

		for (var i = 0; i < data.objectList.length; i++)
		{
			var item = data.objectList[i];
			if (!item.Hidden)
				ctrlPropertySheet.GetOrSetField(sPrefix, item, false, false, true);
		}
	},

	// Depending upon which columns are displayed, sort the properties alphabetically
	SortItemsBeforeDisplay: function (objectList, bCategoryFirst)
	{
		// Sort it by ASCENDING caption
		objectList.sort(function (a, b)
		{
			var x = a.Name.toLowerCase(),
				y = b.Name.toLowerCase();

			if (bCategoryFirst)
			{
				x = a.Category + a.Name.toLowerCase();
				y = b.Category + b.Name.toLowerCase();
			}

			return x < y ? -1 : x > y ? 1 : 0;
		});
	},

	HideColumnNumber: function (sPrefix, iIndex, sWhat)
	{
		// Make smaller or bigger
		var elemText = $('#' + sPrefix + 'ctrlPropertySheet-' + sWhat + 'ColumnText');
		var elemIcon = $('#' + sPrefix + 'ctrlPropertySheet-Hide' + sWhat + 'Column');
		var sText = elemText.html();
		var bShrink = sText.length > 0;

		// Piece of fucking shit! cannot make table column smaller even with truncation options
		//var iWidth = bShrink ? 10 : (sWhat == "Category" ? 120 : 280);

		//if (bShrink)
		//{
		//	elemText.html('');
		//	elemIcon.removeClass().addClass('gi gi-plus');
		//}
		//else
		//{
		//	elemText.html(sWhat);
		//	elemIcon.removeClass().addClass('gi gi-minus');
		//}

		//$('#' + sPrefix + 'ctrlPropertySheet-table > tbody > tr').each(function ()
		//{
		//	// Piece of fucking shit! cannot make table column smaller even with trincation options
		//	//$('td:eq(' + iIndex + ')', this).css('width', iWidth + "px");
		//});

		// Problem with this is that it recursively does all tr within the table including fields
		//$('#' + sPrefix + 'ctrlPropertySheet-table tr').each(function ()

		// This way does the header, then rows, but only 1 level deep
		$('#' + sPrefix + 'ctrlPropertySheet-table > thead > tr').each(function ()
		{
			$('td:eq(' + iIndex + ')', this).toggle();
		});
		$('#' + sPrefix + 'ctrlPropertySheet-table > tbody > tr').each(function ()
		{
			$('td:eq(' + iIndex + ')', this).toggle();
		});
	},

	// Store any essential data such as callbacks in this control
	ControlData:
	{
		ControlRootId: 'ctrlPropertySheet-Root',	// Original name in control .html
		RootId: function (sPrefix)
		{
			return sPrefix + ctrlPropertySheet.ControlData.ControlRootId;
		},

		SetData: function(sID, data)
		{
			$('#' + sID).data("PropertiesData", data);
		},

		GetData: function(sID)
		{
			var data = $('#' + sID).data("PropertiesData");
			return data;
		},

		// Store the instance specific data against the root object
		Store: function (sPrefix, dataObject)
		{
			$('#' + ctrlPropertySheet.ControlData.RootId(sPrefix)).data(dataObject);
		},

		Read: function (sPrefix)
		{
			var dataObject = $('#' + ctrlPropertySheet.ControlData.RootId(sPrefix)).data();
			return dataObject;
		},

		FieldChangedCallback: function (sPrefix, sID, objValue)
		{
		    // August 2020: Use the trisys-field-name field tag
		    var fieldElement = $('#' + sID);
		    var sName = fieldElement.attr("trisys-field-name");
		    var sCategory = fieldElement.attr("trisys-category-name");
		    if (sName && sCategory)
		    {
		        // Use the callback function supplied by the container page/control
		        var controlData = ctrlPropertySheet.ControlData.Read(sPrefix);
		        if (controlData) {
		            var fn = controlData.fieldValueChange;
		            if (fn)
		            {
		                fn(sCategory, sName, objValue);
		                return;
		            }
		        }
		    }

			// Strip away the DOM uniqueness naming
			// e.g. admin-console-security-PropertySheet-field-FusionStatic
			// We want to return only the last part e.g. FusionStatic as this is what the caller knows about
			var parts = sID.split('-field-');
			sID = parts[1];

			// We need to send back the category and name of the item by parsing it back
			// sID e.g. "CV-Auto-Recognition_Delete-CV" will set category = CV Auto Recognition, name = Delete CV
			// This of course means that category+name must only contain alphanumeric + spaces i.e. no -, / etc..
			parts = sID.split("_");
			if (parts.length == 2)
			{
				var sCategory = parts[0].replace(/-/g, ' ');
				var sName = parts[1].replace(/-/g, ' ');

				// Use the callback function supplied by the container page/control
				var controlData = ctrlPropertySheet.ControlData.Read(sPrefix);
				if (controlData)
				{
					var fn = controlData.fieldValueChange;
					if (fn)
					{
						fn(sCategory, sName, objValue);
						return;
					}
				}
			}
			
			TriSysApex.Toasters.Error("Missing Callback or field ID parsing: " + sID + '=' + objValue);
		},

		// If we do not know the sPrefix because for example this is a legacy control, guess it!
		FieldChangedCallbackWithoutPrefix: function (sID, objValue)
		{
			var parts = sID.split('field-');
			var sPrefix = parts[0];

			ctrlPropertySheet.ControlData.FieldChangedCallback(sPrefix, sID, objValue);
		},
	},

	ShowingObjectCounters: function (sPrefix, iShowing, iCount)
	{
		$('#' + sPrefix + 'ctrlPropertySheet-object-count').html(" [" + iShowing + " of " + iCount + "]");
	},

	AddObject: function (sPrefix, object, fnFieldValueChange)
	{
		var sTemplateHTML = $("#ctrlPropertySheet-object-template").html();

		var sHTML = sTemplateHTML;

		sHTML = sHTML.replace("{{RowId}}", ctrlPropertySheet.ObjectDOMid(sPrefix + 'row-', object));

		sHTML = sHTML.replace("{{Name}}", object.Caption ? object.Caption : object.Name);
		sHTML = sHTML.replace("{{Category}}", object.Category);
		
		var lstDescription = object.Description;
		var sDescription = lstDescription ? lstDescription.join("<br/>") : "";
		sHTML = sHTML.replace("{{Description}}", sDescription);

	    // Replace {{Field}} in template
		var sFieldCaptureHTML = ctrlPropertySheet.GetOrSetField(sPrefix, object, true);
		sHTML = sHTML.replace("{{Field}}", sFieldCaptureHTML);

	    // Tooltip
		var sTooltip = object.Description ? ' title="' + object.Description + '"' : '';
		sHTML = sHTML.replace("{{Title}}", sTooltip)

		// Append this row to the table
		var lst = ctrlPropertySheet.ObjectRows(sPrefix);
		lst.append(sHTML);

	    // Now set the attributes on this DOM item so that we can access them without parsing DOM ID
		var sFieldID = ctrlPropertySheet.ObjectDOMid(sPrefix + 'field-', object);
		var elementField = $('#' + sFieldID);
		elementField.attr("trisys-field-name", object.Name);
		elementField.attr("trisys-category-name", object.Category);


		// Some fields can only be instantiated after being added to the DOM
		ctrlPropertySheet.GetOrSetField(sPrefix, object, false, true);
	},

	// Return and populate the appropriate template adding appropriate ID's and event handlers for each
	// Used to replace {{Field}} in master property template.
	// There are 3 states: 
	//	a. Get HTML - all controls
	//  b. Post DOM init - only those which cannot be done declaritively e.g. multi-select combos
	//  c. Set values - when user or default settings applied
	//
	GetOrSetField: function (sPrefix, object, bPreDOMGetHTML, bAfterAddingToDOM, bSetDefaultValue, bGetCurrentValue)
	{
		if (!object)
			return;

		if (!object.Category || !object.Name)
			return;

		if (!object.Type || !object.Description)
		{
			TriSysApex.UI.errorAlert("Missing .Type or .Description property for " + object.Category + "." + object.Name);
			return null;
		}

		// Template is in index.html
		var sTemplateId = '#ctrlPropertySheet-object-' + object.Type.toLowerCase() + '-template';
		var sTemplateHTML = $(sTemplateId).html();
		if (!sTemplateHTML)
		{
			TriSysApex.UI.errorAlert("Unable to locate template for: " + object.Type);
			return null;
		}

		var sHTML = sTemplateHTML;
		var sFieldID = ctrlPropertySheet.ObjectDOMid(sPrefix + 'field-', object);
		sHTML = sHTML.replace(/{{FieldId}}/g, sFieldID);

		switch (object.Type)
		{
			case "Boolean":
				var bDefault = TriSysAPI.Operators.stringToBoolean(object.Default, false);
				if (bPreDOMGetHTML)
				{
					sHTML = sHTML.replace("{{CheckboxTitle}}", object.Title ? object.Title : '');
					sHTML = sHTML.replace("{{CheckboxDefault}}", bDefault ? 'checked' : '');
					sHTML = sHTML.replace("{{CheckboxFunction}}", "ctrlPropertySheet.CheckBoxEvent(this, '" + sPrefix + "', '" + sFieldID + "')");
				}

				if (bSetDefaultValue)
					TriSysSDK.CShowForm.SetCheckBoxValue(sFieldID, bDefault ? true : false);

				if (bGetCurrentValue)
					return TriSysSDK.CShowForm.GetCheckBoxValue(sFieldID);

				break;

			case "TextBox":
				if (bPreDOMGetHTML)
				{
					sHTML = sHTML.replace("{{FieldValue}}", object.Default);
					sHTML = sHTML.replace("{{TextFunction}}", "ctrlPropertySheet.TextBoxEvent(this, '" + sPrefix + "', '" + sFieldID + "')");
				}

				if (bSetDefaultValue)
					$('#' + sFieldID).val(object.Default);

				if (bGetCurrentValue)
					return $('#' + sFieldID).val();

				break;

			case "MultiLineTextBox":
				if (bPreDOMGetHTML)
				{
					sHTML = sHTML.replace("{{TextRows}}", object.Rows);
					sHTML = sHTML.replace("{{TextFunction}}", "ctrlPropertySheet.TextBoxEvent(this, '" + sPrefix + "', '" + sFieldID + "')");
				}

				if (bSetDefaultValue)
					$('#' + sFieldID).val(object.Default);

				if (bGetCurrentValue)
					return $('#' + sFieldID).val();

				break;

			case "SingleSelectCombo":
				if (bAfterAddingToDOM)
				{
					if (object.List)
					{
						// Hard coded list
						var items = [];
						for (var i = 0; i < object.List.length; i++)
							items.push({ text: object.List[i], value: object.List[i] });
						TriSysSDK.CShowForm.populateComboFromDataSource(sFieldID, items, object.SelectedIndex, ctrlPropertySheet.SingleComboSelectionEvent);
					}
					else if (object.SkillCategory)
					{
						// Skill category/lookup
						TriSysSDK.CShowForm.skillCombo(sFieldID, object.SkillCategory, object.SelectedText, ctrlPropertySheet.SingleComboSelectionEvent);
					}
				}

				if (bSetDefaultValue)
				{
					if (object.SelectedIndex >= 0)
						TriSysSDK.CShowForm.SetIndexInCombo(sFieldID, object.SelectedIndex);
					else if (object.SelectedText)
						TriSysSDK.CShowForm.SetTextInCombo(sFieldID, object.SelectedText);
				}

				if (bGetCurrentValue)
					return TriSysSDK.CShowForm.GetTextFromCombo(sFieldID);

				break;

			case "MultiSelectCombo":
				if (bAfterAddingToDOM)
				{
					if (object.List)
					{
						var items = [];
						for (var i = 0; i < object.List.length; i++)
						{
							var sText = object.List[i];
							items.push({ text: sText, value: sText });
						}
						TriSysSDK.CShowForm.populateMultiSelectComboFromDataSource(sFieldID, items, ctrlPropertySheet.MultiComboSelectionEvent);
					}
					else if (object.SkillCategory)
					{
						// Skill category/lookup
						TriSysSDK.CShowForm.skillList(sFieldID, object.SkillCategory, ctrlPropertySheet.MultiComboSelectionEvent);
					}
				}

				if (bSetDefaultValue && object.SelectedItems)
				{
					var sValues = object.SelectedItems.join(", ");
					TriSysSDK.CShowForm.SetSkillsInList(sFieldID, sValues);
				}

				if (bGetCurrentValue)
					return TriSysSDK.CShowForm.GetSelectedSkillsFromList(sFieldID, "'");		// Note - code friendly see code generator

				break;

			case "Float":
				if (bAfterAddingToDOM)
				{
					var fieldDescription = { MinValue: object.Minimum, MaxValue: object.Maximum, SpinIncrement: object.Increment };
					TriSysSDK.Controls.NumericSpinner.Initialise(sFieldID, fieldDescription);
					TriSysApex.FieldEvents.AddNumberChangeFieldOfInterest(sFieldID, ctrlPropertySheet.FloatBoxEvent);
				}

				if (bSetDefaultValue && !isNaN(object.Default))
					TriSysSDK.Controls.NumericSpinner.SetValue(sFieldID, parseFloat(object.Default));

				if (bGetCurrentValue)
					return TriSysSDK.Controls.NumericSpinner.GetValue(sFieldID);

				break;

			case "Integer":
				if (bAfterAddingToDOM)
				{
					var fieldDescription = { MinValue: object.Minimum, MaxValue: object.Maximum, SpinIncrement: object.Increment };
					fieldDescription.Format = "###,###,###,###,###";
					TriSysSDK.Controls.NumericSpinner.Initialise(sFieldID, fieldDescription);
					TriSysApex.FieldEvents.AddNumberChangeFieldOfInterest(sFieldID, ctrlPropertySheet.FloatBoxEvent);
				}

				if (bSetDefaultValue && !isNaN(object.Default))
				    TriSysSDK.Controls.NumericSpinner.SetValue(sFieldID, parseInt(object.Default));

				if (bGetCurrentValue)
					return TriSysSDK.Controls.NumericSpinner.GetValue(sFieldID);

				break;

			case "Date":
				if (bAfterAddingToDOM)
					TriSysSDK.CShowForm.datePicker(sFieldID, ctrlPropertySheet.DateBoxEvent);

				if (bSetDefaultValue)
				{
					var sValue = object.Default ? object.Default : null;
					TriSysSDK.CShowForm.setDatePickerValue(sFieldID, sValue);
				}

				if (bGetCurrentValue)
					return TriSysSDK.CShowForm.getDatePickerValue(sFieldID);

				break;

			case "DateTime":
				if (bAfterAddingToDOM)
					TriSysSDK.CShowForm.dateTimePicker(sFieldID, ctrlPropertySheet.DateTimeBoxEvent);

				if (bSetDefaultValue)
				{
					var sValue = object.Default ? object.Default : null;
					TriSysSDK.CShowForm.setDateTimePickerValue(sFieldID, sValue);
				}

				if (bGetCurrentValue)
					return TriSysSDK.CShowForm.getDateTimePickerValue(sFieldID);

				break;

			case "CurrencyAmount":
				if (bAfterAddingToDOM)
				{
					TriSysSDK.Controls.CurrencyAmount.Load(sFieldID);
					var sNumberFieldPart = sFieldID + '-CurrencyAmount_Amount';	// 'field-Market-Worth-CurrencyAmount_Amount'
					TriSysApex.FieldEvents.AddNumberChangeFieldOfInterest(sNumberFieldPart, ctrlPropertySheet.CurrencyAmountEvent);
				}

				if (bSetDefaultValue)
				{
					var sValue = object.Default ? object.Default : "£0";
					TriSysSDK.Controls.CurrencyAmount.SetCurrencyAmount(sFieldID, sValue);
				}

				if (bGetCurrentValue)
					return TriSysSDK.Controls.CurrencyAmount.GetCurrencyAmount(sFieldID);

				break;

			case "CurrencyAmountPeriod":
				if (bAfterAddingToDOM)
				{
					TriSysSDK.Controls.CurrencyAmountPeriod.Load(sFieldID);
					var sNumberFieldPart = sFieldID + '-CurrencyAmountPeriod_Amount';	// 'field-Car-Repayment-CurrencyAmountPeriod_Amount'
					TriSysApex.FieldEvents.AddNumberChangeFieldOfInterest(sNumberFieldPart, ctrlPropertySheet.CurrencyAmountPeriodEvent);
				}

				if (bSetDefaultValue)
				{
					var sValue = object.Default ? object.Default : "£0 per Annum";
					TriSysSDK.Controls.CurrencyAmountPeriod.SetCurrencyAmountPeriod(sFieldID, sValue);
				}

				if (bGetCurrentValue)
					return TriSysSDK.Controls.CurrencyAmountPeriod.GetCurrencyAmountPeriod(sFieldID);

				break;

			case "Image":
				var sThumbnailFieldID = sFieldID + '-thumbnail';
				if (bPreDOMGetHTML)
					sHTML = sHTML.replace("{{ThumbnailFieldId}}", sThumbnailFieldID);

				if (bAfterAddingToDOM)
					TriSysWebJobs.CandidateRegistration.LoadContactPhotoWidgets(sFieldID, sThumbnailFieldID);

				if (bSetDefaultValue)
					TriSysSDK.Controls.FileReference.SetFile(sFieldID, object.Default);

				if (bGetCurrentValue)
					return TriSysSDK.Controls.FileReference.GetFile(sFieldID);

				break;

			case "Icon":
				if (bSetDefaultValue)
					$('#' + sFieldID).removeClass().addClass(object.Default + ' fa-2x themed-color');

				if (bGetCurrentValue)
				{
					var sClass = $('#' + sFieldID).attr('class');
					return sClass.replace(' fa-2x themed-color', '');
				}

				break;

			case "File":
			    if (bAfterAddingToDOM)
			    {
			        var fieldDescription = { TableName: null, TableFieldName: sFieldID };
			        TriSysSDK.Controls.FileReference.Load(sFieldID, fieldDescription);

			        // Subscribe to file upload events in order to show/hide other fields
			        TriSysApex.FieldEvents.AddFileReferenceFieldEventOfInterest(sFieldID,
                        function (sTableFieldName, sFile, sOperation)
                        {
                            //TriSysApex.Toasters.Info(sTableFieldName + ", " + sFile + ", " + sOperation);

                            ctrlPropertySheet.ControlData.FieldChangedCallbackWithoutPrefix(sTableFieldName, sFile);
                        }
                    );
			    }

				if (bSetDefaultValue)
    				TriSysSDK.Controls.FileReference.SetFile(sFieldID, object.Default);

				if (bGetCurrentValue)
					return TriSysSDK.Controls.FileReference.GetFile(sFieldID);

				break;

			case "WebPage":
		    case "TelNo":
                if (bPreDOMGetHTML)
                    {
					sHTML = sHTML.replace("{{FieldValue}}", object.Default);
					sHTML = sHTML.replace("{{TextFunction}}", "ctrlPropertySheet.TextBoxEvent(this, '" + sPrefix + "', '" + sFieldID + "')");
				}

				if (bSetDefaultValue)
					$('#' + sFieldID).val(object.Default);

				if (bGetCurrentValue)
					return $('#' + sFieldID).val();

				break;

		    case "User":
                if (bAfterAddingToDOM)
                {
                    var bBlankRow = true;
                    TriSysSDK.CShowForm.UserCombo(sFieldID, ctrlPropertySheet.UserSelectionEvent, bBlankRow);
				}

				if (bSetDefaultValue)
				{
				    TriSysSDK.CShowForm.SetUserIdInCombo(sFieldID, object.Default);
				}

				if (bGetCurrentValue)
				    return TriSysSDK.CShowForm.GetValueFromCombo(sFieldID);

		        break;

		    case "Contact":
                if (bAfterAddingToDOM)
                {
                    // Subscribe to contact picker events in order to show/hide other fields
                    TriSysApex.FieldEvents.AddContactPickerFieldEventOfInterest(sFieldID,
                        function (sFieldName, lContactId, sContactName, sOperation)
                        {
                            //TriSysApex.Toasters.Info(sFieldName + ", " + lContactId + ", " + sContactName + ", " + sOperation);

                            var objContact = {
                                ContactName: sContactName,
                                ContactId: lContactId
                            }

                            switch (sOperation)
                            {
                                case 'picked':
                                    ctrlPropertySheet.ContactPickerEvent(objContact, sOperation, sFieldName);
                                    break;
                                case 'deleted':
                                    ctrlPropertySheet.ContactPickerEvent(objContact, sOperation, sFieldName);
                                    break;
                            }
                        }
                    );
				}

				if (bSetDefaultValue)
				{
				    var objContact = object.Default;
				    if (objContact)
				    {                        
				        TriSysSDK.Controls.ContactLookup.WriteContactId(sFieldID, objContact.ContactId, objContact.ContactName);
				    }
				}

				if (bGetCurrentValue)
				{
				    var objContact = {
				        ContactName: TriSysSDK.Controls.ContactLookup.ReadContactName(sFieldID),
				        ContactId: TriSysSDK.Controls.ContactLookup.ReadContactId(sFieldID)
				    };
				    return objContact;
				}

				break;

		    case "Company":
		        if (bAfterAddingToDOM)
		        {
		            // Subscribe to company picker events in order to show/hide other fields
		            TriSysApex.FieldEvents.AddCompanyPickerFieldEventOfInterest(sFieldID,
                        function (sFieldName, lCompanyId, sCompanyName, sOperation)
                        {
                            //TriSysApex.Toasters.Info(sFieldName + ", " + lCompanyId + ", " + sCompanyName + ", " + sOperation);

                            var objCompany = {
                                CompanyName: sCompanyName,
                                CompanyId: lCompanyId
                            }

                            switch (sOperation) {
                                case 'picked':
                                    ctrlPropertySheet.CompanyPickerEvent(objCompany, sOperation, sFieldName);
                                    break;
                                case 'deleted':
                                    ctrlPropertySheet.CompanyPickerEvent(objCompany, sOperation, sFieldName);
                                    break;
                            }
                        }
                    );
		        }

		        if (bSetDefaultValue) {
		            var objCompany = object.Default;
		            if (objCompany) {
		                TriSysSDK.Controls.CompanyLookup.WriteCompanyId(sFieldID, objCompany.CompanyId, objCompany.CompanyName);
		            }
		        }

		        if (bGetCurrentValue) {
		            var objCompany = {
		                CompanyName: TriSysSDK.Controls.CompanyLookup.ReadCompanyName(sFieldID),
		                CompanyId: TriSysSDK.Controls.CompanyLookup.ReadCompanyId(sFieldID)
		            };
		            return objCompany;
		        }

		        break;
		}

		if (bGetCurrentValue)
			return null;

		// Only return HTML when specifically asked
		return sHTML;
	},

	// The object is a function of the Category+Name
	// We must eliminate any characters which are not allowed in DOM id's
	//
	ObjectDOMid: function (sPrefix, object)
	{
		var sCategory = object.Category;
		if(!sCategory)
			sCategory = "UndefinedCategory";

		sCategory = sCategory.replace(/_/g, "-");
		var sName = object.Name.replace(/_/g, "-");

		var sID = sCategory + "_" + sName;		

		// 18 Oct 2024: Use RegEx to replace all instances of these DOM hostile characters
		sID = sID.replace(/[^a-zA-Z0-9\-_]/g, '-');
		
		//sID = sID.replace(/ /g, "-");
		//sID = sID.replace(/\./g, "-");
		//sID = sID.replace(/\//g, "-");
		//sID = sID.replace(/:/g, "-");
		//sID = sID.replace(/;/g, "-");
		//sID = sID.replace(/#/g, "-");

		//// 18 Oct 2024 - brackets also cannot be used as DOM id's
		//sID = sID.replace(/\(/g, "-");
		//sID = sID.replace(/\)/g, "-");

		sID = sID.replace(/-field-/g, "-");

		sID = sPrefix + sID;
		return sID;
	},

	CheckBoxEvent: function (element, sPrefix, sID)
	{
		var bChecked = element.checked;

		ctrlPropertySheet.ControlData.FieldChangedCallback(sPrefix, sID, bChecked);
	},

	TextBoxEvent: function (element, sPrefix, sID)
	{
		var sText = $('#' + sID).val();
		ctrlPropertySheet.ControlData.FieldChangedCallback(sPrefix, sID, sText);
	},

	SingleComboSelectionEvent: function (value, sText, sFieldID)
	{
		ctrlPropertySheet.ControlData.FieldChangedCallbackWithoutPrefix(sFieldID, sText);
	},

	MultiComboSelectionEvent: function (e, r)
	{
		var sFieldID = e.sender.element[0].id;
		var lstValues = TriSysSDK.CShowForm.GetSelectedSkillsFromListAsArray(sFieldID);
		var sValue = lstValues.join(", ");

		ctrlPropertySheet.ControlData.FieldChangedCallbackWithoutPrefix(sFieldID, sValue);
	},

	// Calculation engine uses callbacks events on rate/margin/days/duration/hours fields
	// See TriSysApex.FieldEvents.NumberChange()
	FloatBoxEvent: function (sFieldID, fValue)
	{
		ctrlPropertySheet.ControlData.FieldChangedCallbackWithoutPrefix(sFieldID, fValue);
	},

	DateBoxEvent: function (dtValue, sFieldID)
	{
		ctrlPropertySheet.ControlData.FieldChangedCallbackWithoutPrefix(sFieldID, dtValue);
	},

	DateTimeBoxEvent: function (dtValue, sFieldID)
	{
		ctrlPropertySheet.ControlData.FieldChangedCallbackWithoutPrefix(sFieldID, dtValue);
	},

	CurrencyAmountEvent: function (sFieldID, fValue)
	{
		// 'field-Market-Worth-CurrencyAmount_Amount'
		sFieldID = sFieldID.replace('-CurrencyAmount_Amount', '');
		var sValue = TriSysSDK.Controls.CurrencyAmount.GetCurrencyAmount(sFieldID);
		ctrlPropertySheet.ControlData.FieldChangedCallbackWithoutPrefix(sFieldID, sValue);
	},

	CurrencyAmountPeriodEvent: function (sFieldID, fValue)
	{
		// 'field-Market-Worth-CurrencyAmountPeriod_Amount'
		sFieldID = sFieldID.replace('-CurrencyAmountPeriod_Amount', '');
		var sValue = TriSysSDK.Controls.CurrencyAmountPeriod.GetCurrencyAmountPeriod(sFieldID);
		ctrlPropertySheet.ControlData.FieldChangedCallbackWithoutPrefix(sFieldID, sValue);
	},

	UserSelectionEvent: function (lUserId, sText, sFieldID)
	{
	    ctrlPropertySheet.ControlData.FieldChangedCallbackWithoutPrefix(sFieldID, lUserId);
	},

	ContactPickerEvent: function (contactObject, sOperation, sFieldID)
	{
	    ctrlPropertySheet.ControlData.FieldChangedCallbackWithoutPrefix(sFieldID, contactObject);
	},

	CompanyPickerEvent: function (companyObject, sOperation, sFieldID)
	{
	    ctrlPropertySheet.ControlData.FieldChangedCallbackWithoutPrefix(sFieldID, companyObject);
	},

	ObjectRows: function (sPrefix)
	{
		return $('#' + sPrefix + 'ctrlPropertySheet-Objects-tbody');
	},

	LoadObjectFilter: function (sPrefix)
	{
		// Capture enter key on password field
		var txtFilter = $('#' + sPrefix + 'ctrlPropertySheet-object-search');
		txtFilter.off().keyup(function (e)
		{
			// In-Memory filter is every keystroke, not on enter
			if (e.keyCode != 13)
			{
				sFilter = txtFilter.val();
				ctrlPropertySheet.FilterObjects(sPrefix, sFilter);
			}
		});
	},

	// Filter the DOM table directly
	FilterObjects: function (sPrefix, sFilter)
	{
		if (sFilter)
			sFilter = sFilter.toLowerCase();
		var iShown = 0;

		var sDOMRootId = sPrefix + 'ctrlPropertySheet-Objects-tbody';

		var table = document.getElementById(sDOMRootId);
		var tr = table.getElementsByTagName("tr");
		for (var i = 0; i < tr.length; i++)
		{
			var bShowRow = sFilter ? false : true;

			for (var c = 0; c < 3; c++)
			{
				var td = tr[i].getElementsByTagName("td")[c];
				if (td)
				{
					if (td.innerText && td.style.display != 'none')
					{
						if (td.innerText.toLowerCase().indexOf(sFilter) >= 0)
							bShowRow = true;
					}
				}
			}

			tr[i].style.display = bShowRow ? "" : "none";
			iShown += (bShowRow ? 1 : 0);
		}

		ctrlPropertySheet.ShowingObjectCounters(sPrefix, iShown, tr.length);
	},

	// Called externally to set specific property value
	SetValue: function (sParentID, object)
	{
		var sPrefix = sParentID + '-';
		ctrlPropertySheet.GetOrSetField(sPrefix, object, false, false, true);
	},

	// Called externally to get specific property value
	GetValue: function (sParentID, object)
	{
		var sPrefix = sParentID + '-';
		return ctrlPropertySheet.GetOrSetField(sPrefix, object, false, false, false, true);
	},

	// Called externally to get all property items
	GetItems: function (sParentID)
	{
		var sPrefix = sParentID + '-';
		var controlData = ctrlPropertySheet.ControlData.GetData(ctrlPropertySheet.ControlData.RootId(sPrefix));
		if(controlData)
		{
			if(controlData.objectList)
			{
				var items = [];
				controlData.objectList.forEach(function(item)
				{
					var sValue = ctrlPropertySheet.GetValue( sParentID, item );
					item.Value = sValue;
					items.push(item);
				});
				return items;
			}
		}
	},

	// Awkward properties
	IconPickerOnClick: function(sFieldID)
	{
		var fnPicked = function(sHTML, sIcon)
		{
			$('#' + sFieldID).removeClass().addClass(sIcon + ' fa-2x themed-color');
			ctrlPropertySheet.ControlData.FieldChangedCallbackWithoutPrefix(sFieldID, sIcon);
		};
		DeveloperStudio.IconPickerTool(fnPicked);
	}	

};	// ctrlPropertySheet
