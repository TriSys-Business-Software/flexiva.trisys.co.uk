var ctrlFieldDescription =
{
    TableNameID: 'ctrlFieldDescription-TableName',
    TableFieldNameID: 'ctrlFieldDescription-TableFieldName',
    DescriptionID: 'ctrlFieldDescription-Description',
    FieldTypeID: 'ctrlFieldDescription-FieldType',
    SkillComboCategoryID: 'ctrlFieldDescription-SkillComboCategory',
    DefaultValueID: 'ctrlFieldDescription-DefaultValue',
    MinValueID: 'ctrlFieldDescription-MinValue',
    MaxValueID: 'ctrlFieldDescription-MaxValue',
    LookupID: 'ctrlFieldDescription-Lookup',
    SortAlphabeticallyID: 'ctrlFieldDescription-SortAlphabetically',
    LengthID: 'ctrlFieldDescription-FieldLength',
    LookupGridID: 'ctrlFieldDescription-LookupGrid',
    FieldLabelID: 'ctrlFieldDescription-FieldLabel',
    MultiLineID: 'ctrlFieldDescription-MultiLine',
    LookupOrderButton: 'ctrlFieldDescription-lookupSortOrderButton',
    LookupBlockID: 'ctrlFieldDescription-Lookup-Block',

    // The current field description
    _FieldDescription: null,

    // The list of all field lookups cached on-demand directly from the database
    _FieldLookups: null,

    Load: function (lFieldId, sEntityName)
    {
        // <trisys-field> code injection
        TriSysSDK.CShowForm.HTMLFieldsCodeInjection();

        var bNew = (lFieldId == 0);

        var sTableName = sEntityName + (bNew ? "ConfigFields" : "");
        $('#' + ctrlFieldDescription.TableNameID).html(sTableName);

        // Load field types
        var fieldTypeData = [];
        var fieldTypes = TriSysApex.Cache.FieldTypes();
        fieldTypes.sort(function (a, b)
        {
            return a.Description.localeCompare(b.Description);
        });

        for (var i = 0; i < fieldTypes.length; i++)
        {
            var fieldType = fieldTypes[i];

            var bAddToCombo = true;
            if (bNew)
            {
                // Filter out undesirables
                var ignoreList = ['ActivityTypeCombo', 'Address', 'Application', 'ChartFX', 'ChartFXASync', 'Currency', 'Currency Link', 'DocumentEditor', 'DocumentPreview',
                                    'EntitySearchCriteria', 'Folder Reference', 'FormUserControl', 'Graph', 'Grid', 'GridAlpha', 'GridGamma',
                                    'Label', 'List', 'ListView', 'Panel', 'PanelAlpha', 'ProgressBar', 'RichTextBox',
                                    'Schedule', 'SkillTree', 'TreeView', 'Video', 'WebPage', 'WordProcessor'];
                bAddToCombo = (ignoreList.indexOf(fieldType.Description) < 0);
            }

            if (bAddToCombo)
                fieldTypeData.push({ text: fieldType.Description, value: fieldType.FieldTypeId });
        }

        // Load skill categories which are not general skills and are not fields
        var comboSkillCategories = [];
        var addCategories = null;

        // Add Type if it is special
        var fieldDescription = null;
        var bEntityTypeField = false;
        if (lFieldId > 0)
        {
            fieldDescription = ctrlFieldDescription.FieldDescriptionFromCacheByFieldId(lFieldId);
            if(fieldDescription)
            {
                if (fieldDescription.TableFieldName == "Type")
                {
                    addCategories = [sEntityName + " Type"];
                    $('#' + ctrlFieldDescription.SkillComboCategoryID).attr('readonly', 'readonly');
                    bEntityTypeField = true;
                }
            }
        }

        // 09 Mar 2023: This skill combo field may point to a skill category which is ignored
        // however we still want to see the list of skills
        if (fieldDescription && fieldDescription.FieldTypeId == TriSysSDK.Controls.FieldTypes.SkillCombo)
        {
            if (!addCategories)
                addCategories = [];

            addCategories.push(fieldDescription.SkillComboCategory);
        }

        // Get all skill available skill categories for the combo
        var comboCategories = TriSysApex.Cache.SystemSettingManager.SkillComboCategories(addCategories);
        if (comboCategories)
        {
            $.each(comboCategories, function (index, skillCategory)
            {
                var sCategory = skillCategory.Category.trim();
                comboSkillCategories.push({ text: sCategory, value: sCategory });
            });
        }


        TriSysSDK.CShowForm.populateComboFromDataSource(ctrlFieldDescription.FieldTypeID, fieldTypeData, 0, ctrlFieldDescription.SelectFieldTypeEvent);
        TriSysSDK.CShowForm.SetTextInCombo(ctrlFieldDescription.FieldTypeID, "Text");

        TriSysSDK.CShowForm.populateComboFromDataSource(ctrlFieldDescription.SkillComboCategoryID, comboSkillCategories, 0, ctrlFieldDescription.SelectSkillComboCategoryEvent);

        fieldDescription = { MinValue: 0, MaxValue: 1024, SpinIncrement: 1, Value: 50 };
        TriSysSDK.Controls.NumericSpinner.Initialise(ctrlFieldDescription.LengthID, fieldDescription);
        TriSysSDK.Controls.NumericSpinner.DecimalPlaces(ctrlFieldDescription.LengthID, 0);
        TriSysSDK.Controls.NumericSpinner.SetValue(ctrlFieldDescription.LengthID, 50);

        if (bNew)
        {
            ctrlFieldDescription._FieldDescription = { FieldId: 0, TableName: sTableName };
            ctrlFieldDescription.DisplayLookupSkills(null);

            $('#' + ctrlFieldDescription.LookupID).change(function ()
            {
                ctrlFieldDescription.LookupCheckBoxEvent(bNew);
            });

            // 26 Jan 2023: Make this the focus and prevent spaces on enter and on paste
            var sJqueryID = '#' + ctrlFieldDescription.TableFieldNameID;
            var elemTableFieldName = $(sJqueryID);
            elemTableFieldName.focus();
            elemTableFieldName.keypress(function( e ) 
            {
                if(e.which === 32) 
                    return false;
            });
            $(document).on('paste', sJqueryID, function (e) {
                window.setTimeout(function () {
                    var withoutSpaces = elemTableFieldName.val();
                    withoutSpaces = withoutSpaces.replace(/\s+/g, '');
                    elemTableFieldName.val(withoutSpaces);
                }, 1);
            });
        }
        else
        {
            ctrlFieldDescription.LoadFieldDescription(lFieldId, bEntityTypeField);
            $('#' + ctrlFieldDescription.DescriptionID).focus();
        }
    },

    SelectFieldTypeEvent: function(lFieldTypeId, sFieldTypeDescription)
    {
        // Show/Hide lookups etc..
        var bShowLookupFields = (lFieldTypeId == TriSysSDK.Controls.FieldTypes.Text ||
                                 lFieldTypeId == TriSysSDK.Controls.FieldTypes.List ||
                                 lFieldTypeId == TriSysSDK.Controls.FieldTypes.MultiSelectList ||
                                 lFieldTypeId == TriSysSDK.Controls.FieldTypes.SkillCombo ||
                                 lFieldTypeId == TriSysSDK.Controls.FieldTypes.JobTitle);
        var elem = $('#' + ctrlFieldDescription.LookupBlockID);
        bShowLookupFields ? elem.show() : elem.hide();

        var tr = $('#' + ctrlFieldDescription.SkillComboCategoryID + '-tr');
        var bShowSkillComboCategory = (lFieldTypeId == TriSysSDK.Controls.FieldTypes.SkillCombo);
        bShowSkillComboCategory ? tr.show() : tr.hide();

        if (bShowSkillComboCategory)
        {
            TriSysSDK.CShowForm.SetCheckBoxValue(ctrlFieldDescription.LookupID, true);
            ctrlFieldDescription.LookupCheckBoxEvent();
        }
    },

    SelectSkillComboCategoryEvent: function(sSkillCategory)
    {
        // Get the ordering from the Web API for sorting before writing to the list in order
        ctrlFieldDescription.ReadLookupsFromWebService(ctrlFieldDescription._FieldDescription, sSkillCategory);
        return

        // Old
        var skills = [];
        $.each(TriSysApex.Cache.Skills(), function (index, skill)
        {
            if (skill.Category == sSkillCategory)
            {
                skills.push(skill.Skill);
            }
        });

        ctrlFieldDescription.DisplayLookupSkills(skills);
    },

    LookupCheckBoxEvent: function(bNewField)
    {
        var bLookups = TriSysSDK.CShowForm.CheckBoxValue(ctrlFieldDescription.LookupID);
        var lst = $('#ctrlFieldDescription-lookupList');
        var srt = $('#ctrlFieldDescription-lookupSort');
        var ord = $('#ctrlFieldDescription-lookupSortOrder');
        bLookups ? lst.show() : lst.hide();
        bLookups ? srt.show() : srt.hide();
        bLookups ? ord.show() : ord.hide();

        // 06 Mar 2023: If a new lookup, then allow user to create a new skill category, or indeed select an existing skill category
        if (bNewField && bLookups)
        {
            var sMessage = "Create a new skill category (Yes), or choose an existing skill category (No), or Cancel?" + 
                            "<br>" +
                            "WARNING: choosing an existing skill category will prevent this being used in general skill lists" +
                            " as it will be bound to this new field.";
            TriSysApex.UI.questionYesNoCancel(sMessage, "New Lookup Field",
                        "Yes, create a new skill category", ctrlFieldDescription.CreateNewSkillCategory,
                        "No, choose an existing skill category", ctrlFieldDescription.ChooseExistingSkillCategory, "Cancel");
        }
    },

    // 07 Mar 2023: Allow field lookup ordering
    LookupSortOrder: function()
    {
        // Do not allow sorting where we do not have a field ID
        if (!ctrlFieldDescription._FieldDescription)
            return;

        var iFieldId = ctrlFieldDescription._FieldDescription.FieldId;
        if (iFieldId <= 0)
        {
            TriSysApex.UI.ShowMessage("Please set the lookup ordering after saving the new field description.");
            return;
        }


        var sField = ctrlFieldDescription._FieldDescription.TableFieldName;
        var sTitle = sField + " Lookups Ordering";
        var sImage = "gi gi-sorting";

        var fnOpenModalDialogue = function () {
            var parametersObject = new TriSysApex.UI.ShowMessageParameters();

            parametersObject.Title = sTitle;
            parametersObject.Image = sImage;
            parametersObject.Maximize = true;
            parametersObject.FullScreen = true;
            parametersObject.CloseTopRightButton = true;

            parametersObject.ContentURL = TriSysApex.CustomFormsAndComponents.UserControlPath("ctrlFieldDescriptionSkillOrder.html");

            // Callback
            parametersObject.OnLoadCallback = function () {
                ctrlFieldDescriptionSkillOrder.Load(sField, ctrlFieldDescription._FieldLookups);
            };

            // Buttons
            var sSaveText = "Save";
            parametersObject.ButtonLeftVisible = true;
            parametersObject.ButtonLeftText = sSaveText;
            parametersObject.ButtonLeftFunction = function ()
            {
                var fnSaved = function (lstLookup) {
                    // Refresh the list of skills in the order
                    ctrlFieldDescription.SelectSkillComboCategoryEvent(ctrlFieldDescription._FieldDescription.TableFieldName);
                };

                var bSaved = ctrlFieldDescriptionSkillOrder.Save(sField, fnSaved);
                return bSaved;
            };

            parametersObject.ButtonRightVisible = true;
            parametersObject.ButtonRightText = "Cancel";

            TriSysApex.UI.PopupMessage(parametersObject);
        };

        TriSysApex.WhiteLabelling.LoadJavascriptFile('js/pages/ctrlFieldDescriptionSkillOrder.js', null, fnOpenModalDialogue);
    },

    // 06 Mar 2023: Popup a prompt to enter the name of the new skill category which must be unique when submitted
    CreateNewSkillCategory: function()
    {
        TriSysApex.Toasters.Info("Create a New Skill Category...");

        // We already have a dialogue for this!
        var fnPrompt = function ()
        {
            var options = { RemoveSpaces: true };
            AdminConsole.OpenSkillCategoryDialogue(0, ctrlFieldDescription.ValidatedNewSkillCategory, options);
        };
        setTimeout(fnPrompt, 10);
        return true;

        // Own prompt
        //var fnPrompt = function () {
        //    var fnReadSkillCategoryName = function (sNewName) {
        //        ctrlFieldDescription.ValidateNewSkillCategory(sNewName);
        //        return true;
        //    };

        //    var options = {
        //        Label: 'Skill Category'
        //    };
        //    TriSysApex.ModalDialogue.New.Popup("New Skill Category", "gi-list", fnReadSkillCategoryName, options);
        //};

        //setTimeout(fnPrompt, 10);
        //return true;
    },

    SelectedAnExistingSkillCategory: function (skillCategory)
    {
        // Business rules dictate that this category cannot contain any spaces!
        var bSpaces = (skillCategory.Category.indexOf(" ") >= 0);
        var bSlash = (skillCategory.Category.indexOf("/") >= 0);
        if (bSpaces || bSlash)
        {
            TriSysApex.UI.ShowMessage("You cannot convert this general skill category into a field.");
            return false;
        }

        setTimeout(function () { ctrlFieldDescription.ValidatedNewSkillCategory(skillCategory, true); }, 10);
        return true;        // To allow popup dialogue to close
    },

    ValidatedNewSkillCategory: function (skillCategory, bExistingSkillCategory)
    {
        TriSysApex.Toasters.Info((!bExistingSkillCategory ? "Created a New" : "Selected an Existing") + " Skill Category: " + skillCategory.Category);

        // This is therefore the name of the field
        $('#' + ctrlFieldDescription.TableFieldNameID).val(skillCategory.Category);
    
        // This cannot be edited and the type must always remain Text
        $('#' + ctrlFieldDescription.TableFieldNameID).attr('readonly', 'readonly');
        TriSysSDK.CShowForm.ComboReadonly(ctrlFieldDescription.FieldTypeID, true);
        $('#' + ctrlFieldDescription.LookupID).attr('disabled', 'disabled');
        TriSysSDK.Controls.NumericSpinner.Readonly(ctrlFieldDescription.LengthID, true);
        $('#' + ctrlFieldDescription.MultiLineID).attr('disabled', 'disabled');

        // 08 Mar 2023: Now display the skills in this category
        ctrlFieldDescription._FieldDescription.Lookup = true;
        ctrlFieldDescription._FieldDescription.TableFieldName = skillCategory.Category;
        ctrlFieldDescription.ReadLookupsForFieldDescription(ctrlFieldDescription._FieldDescription);
    },

    // 06 Mar 2023: Popup a prompt to select an existing skill category which is not associated with other fields
    ChooseExistingSkillCategory: function ()
    {
        TriSysApex.Toasters.Info("Choose an Existing Skill Category...");

        var fnPopup = function () {
            var categories = TriSysApex.Cache.SystemSettingManager.GeneralSkillCategories();

            // Prompt the user to select one of the field descriptions
            var fieldParameters = new TriSysApex.ModalDialogue.Selection.SelectionParameters();
            fieldParameters.Title = "Select Skill Category";
            fieldParameters.PopulationByObject = categories;
            fieldParameters.Columns = [
                    { field: "SkillCategoryId", title: "Skill Category Id", type: "number", width: 70, hidden: true },
                    { field: "Category", title: "Skill Category", type: "string" },
                    { field: "Description", title: "Description", type: "string" }
            ];

            fieldParameters.CallbackFunction = ctrlFieldDescription.SelectedAnExistingSkillCategory;

            TriSysApex.ModalDialogue.Selection.Show(fieldParameters);
        };

        setTimeout(fnPopup, 10);

        return true;
    },

    FieldDescriptionFromCacheByFieldId: function(lFieldId)
    {
        var cachedFieldDescriptions = TriSysApex.Cache.FieldDescriptions();
        var fieldDescriptions = [];
        for (var i = 0; i < cachedFieldDescriptions.length; i++)
        {
            var fieldDescription = cachedFieldDescriptions[i];
            if (fieldDescription.FieldId == lFieldId)
                return fieldDescription;
        }
    },

    LoadFieldDescription: function (lFieldId, bEntityTypeField)
    {
        ctrlFieldDescription._FieldDescription = ctrlFieldDescription.FieldDescriptionFromCacheByFieldId(lFieldId);

        $('#' + ctrlFieldDescription.TableFieldNameID).val(ctrlFieldDescription._FieldDescription.TableFieldName);
        $('#' + ctrlFieldDescription.DescriptionID).val(ctrlFieldDescription._FieldDescription.Description);
        TriSysSDK.CShowForm.SetValueInCombo(ctrlFieldDescription.FieldTypeID, ctrlFieldDescription._FieldDescription.FieldTypeId);
        $('#' + ctrlFieldDescription.DefaultValueID).val(ctrlFieldDescription._FieldDescription.DefaultValue);
        $('#' + ctrlFieldDescription.MaxValueID).val(ctrlFieldDescription._FieldDescription.MaxValue);
        $('#' + ctrlFieldDescription.MinValueID).val(ctrlFieldDescription._FieldDescription.MinValue);
        $('#' + ctrlFieldDescription.FieldLabelID).val(ctrlFieldDescription._FieldDescription.FieldLabel);
        TriSysSDK.CShowForm.SetCheckBoxValue(ctrlFieldDescription.MultiLineID, ctrlFieldDescription._FieldDescription.MultiLine);
        TriSysSDK.Controls.NumericSpinner.SetValue(ctrlFieldDescription.LengthID, ctrlFieldDescription._FieldDescription.FieldLength);

        if (ctrlFieldDescription._FieldDescription.FieldTypeId == TriSysSDK.Controls.FieldTypes.SkillCombo)
        {
            if(bEntityTypeField)
                ctrlFieldDescription._FieldDescription.SkillComboCategory = ctrlFieldDescription._FieldDescription.TableName + " Type";

            TriSysSDK.CShowForm.SetTextInCombo(ctrlFieldDescription.SkillComboCategoryID, ctrlFieldDescription._FieldDescription.SkillComboCategory);
        }

        ctrlFieldDescription.ReadLookupsForFieldDescription(ctrlFieldDescription._FieldDescription);

        // Some things cannot be edited
        $('#' + ctrlFieldDescription.TableFieldNameID).attr('readonly', 'readonly');
        TriSysSDK.CShowForm.ComboReadonly(ctrlFieldDescription.FieldTypeID, true);
        $('#' + ctrlFieldDescription.LookupID).attr('disabled', 'disabled');
        TriSysSDK.Controls.NumericSpinner.Readonly(ctrlFieldDescription.LengthID, true);
        $('#' + ctrlFieldDescription.MultiLineID).attr('disabled', 'disabled');

        ctrlFieldDescription.SelectFieldTypeEvent(ctrlFieldDescription._FieldDescription.FieldTypeId);
    },

    ReadLookupsForFieldDescription: function(fieldDescription)
    {
        if (fieldDescription.Lookup)
        {
            TriSysSDK.CShowForm.SetCheckBoxValue(ctrlFieldDescription.LookupID, true);
            ctrlFieldDescription.LookupCheckBoxEvent();
            TriSysSDK.CShowForm.SetCheckBoxValue(ctrlFieldDescription.SortAlphabeticallyID, fieldDescription.SortAlphabetically);

            // Which skill category?
            var sSkillCategory = (fieldDescription.FieldTypeId == TriSysSDK.Controls.FieldTypes.SkillCombo ? fieldDescription.SkillComboCategory : fieldDescription.TableFieldName);

            // Create an array in the field description
            fieldDescription.Skills = [];

            $.each(TriSysApex.Cache.Skills(), function (index, skill)
            {
                if (skill.Category == sSkillCategory)
                {
                    fieldDescription.Skills.push(skill.Skill);
                }
            });

            // Get the ordering from the Web API for sorting before writing to the list in order
            var fnCallback = function ()
            {
                // We always sort using .Ordering so override
                if (fieldDescription.SortAlphabetically)
                    ctrlFieldDescription.SortAlphabeticallyChecked({ checked: true });
            };
            ctrlFieldDescription.ReadLookupsFromWebService(fieldDescription, sSkillCategory, fnCallback);

            // 08 Mar 2023: Contact priority can only be sorted by order
            var bDisabledSortAlphabetically = false, bDisabledLookupOrdering = false;
            switch(fieldDescription.TableName + "." + fieldDescription.TableFieldName)
            {
                case "Contact.Priority":
                case "Contact.CurrencyId":
                case "Contact.ContactTitle":
                    bDisabledSortAlphabetically = true;
                    break;

                case "Company.IndustryId":
                case "Contact.JobTitle":
                    bDisabledSortAlphabetically = true;
                    bDisabledLookupOrdering = true;
                    TriSysSDK.CShowForm.SetCheckBoxValue(ctrlFieldDescription.SortAlphabeticallyID, true);
                    break;
            }

            // 09 Mar 2023: Skill Combo fields also are stuck with alphabetic sorting
            if (ctrlFieldDescription._FieldDescription.FieldTypeId == TriSysSDK.Controls.FieldTypes.SkillCombo)
            {
                bDisabledSortAlphabetically = true;
                bDisabledLookupOrdering = true;
                TriSysSDK.CShowForm.SetCheckBoxValue(ctrlFieldDescription.SortAlphabeticallyID, true);
            }

            // People today still ask why JQuery is needed!
            //$('#' + ctrlFieldDescription.SortAlphabeticallyID).attr('readonly', 'readonly');                          // No workie!
            document.getElementById(ctrlFieldDescription.SortAlphabeticallyID).disabled = bDisabledSortAlphabetically;  // Workie
            //document.getElementById(ctrlFieldDescription.LookupOrderButton).disabled = bDisabledLookupOrdering;       // No workie!
            if(bDisabledLookupOrdering)
                $('#' + ctrlFieldDescription.LookupOrderButton).attr('disabled', 'disabled');                           // Workie!
        }
    },

    ReadLookupsFromWebService: function (fieldDescription, sSkillCategory, fnCallback)
    {
        ctrlFieldDescription._FieldLookups = null;

        var payloadObject = {};

        var CFieldLookupsRequest = { SkillCategory: sSkillCategory };

        // Call the API to submit the data to the server
        payloadObject.URL = "SkillCategory/FieldLookups";

        payloadObject.OutboundDataPacket = CFieldLookupsRequest;

        payloadObject.InboundDataFunction = function (CFieldLookupsResponse)
        {
            if (CFieldLookupsResponse)
            {
                if (CFieldLookupsResponse.Success)
                {
                    // Store this list
                    ctrlFieldDescription._FieldLookups = CFieldLookupsResponse.Fields;

                    // Sort skills
                    fieldDescription.Skills = [];
                    $.each(ctrlFieldDescription._FieldLookups, function (index, field)
                    {
                        fieldDescription.Skills.push(field.Skill);
                    });

                    // Finally display in order
                    ctrlFieldDescription.DisplayLookupSkills(fieldDescription.Skills);

                    // Lastly, any kludges?
                    if (fnCallback)
                        fnCallback();

                    return;
                }
                else
                    TriSysApex.UI.ShowMessage(CFieldLookupsResponse.ErrorMessage);
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.errorAlert('ctrlFieldDescription.ReadLookupsFromWebService: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    DisplayLookupSkills: function (skills, bUp)
    {
        var sDivTag = ctrlFieldDescription.LookupGridID;
        var sGridName = sDivTag + '-GridInstance';
        
        if (ctrlFieldDescription._FieldLookups)
        {
            var iRecordCount = ctrlFieldDescription._FieldLookups.length;

            var bOrderingHidden = (ctrlFieldDescription._FieldDescription.FieldTypeId == TriSysSDK.Controls.FieldTypes.SkillCombo);

            TriSysSDK.Grid.VirtualMode({
                Div: sDivTag,
                ID: sGridName,
                Title: "Lookups",
                RecordsPerPage: iRecordCount,  // skillsDataSource.length,
                PopulationByObject: ctrlFieldDescription._FieldLookups,     // skillsDataSource,
                Columns: [
                    { field: "SkillId", title: "SkillId", type: "string", hidden: true },
                    { field: "Skill", title: "Lookup", type: "string", menu: false },
                    { field: "Description", title: "Description", type: "string", menu: false },
                    { field: "Ordering", title: "Order", type: "string", menu: false, hidden: bOrderingHidden }
                ],
                //DrillDownFunction: null,
                //MultiRowSelect: false,
                //SingleRowSelect: true,
                //RowClickHandler: fnRowClickHandler,
                ColumnFilters: false,
                Grouping: false
            });

            var grid = $('#' + sDivTag).data("kendoGrid");

            // Tweak for width scroll bar
            //$('#' + sDivTag).css("width", "99%");
        }
    },

    GetSelectedLookupFromGrid: function()
    {
        var grid = $("#" + ctrlFieldDescription.LookupGridID).data("kendoGrid");
        
        var selectedRows = grid.select();
        if (selectedRows)
        {
            var data = grid.dataItem(selectedRows[0]);
            if (data)
                return data.Skill;
        }
    },

    SetSelectedLookupInGrid: function (sLookup)
    {
        var grid = $("#" + ctrlFieldDescription.LookupGridID).data("kendoGrid");

        $.each(grid.tbody.find('tr'), function ()
        {
            var model = grid.dataItem(this);
            if (model.Skill == sLookup)
            {
                grid.select(this);
                return;
            }
        });
    },

    DuplicateSkillCheck: function(sSkill)
    {
        var fieldDescription = ctrlFieldDescription._FieldDescription;

        if (fieldDescription.Skills)
        {
            for (var i = 0; i < fieldDescription.Skills.length; i++)
            {
                var skill = fieldDescription.Skills[i];
                if (skill == sSkill)
                    return true;
            }
        }

        return false;
    },
    
    SaveButtonClick: function (fnCallback)
    {
        var bNew = (ctrlFieldDescription._FieldDescription.FieldId == 0);

        var sTableFieldName = $('#' + ctrlFieldDescription.TableFieldNameID).val();

        if (bNew)
        {
            if (sTableFieldName)
                sTableFieldName = sTableFieldName.replace(/ /g, '');

            if (!sTableFieldName)
            {
                TriSysApex.UI.ShowMessage("Enter a field name");
                return;
            }

            // Duplicate check
            var cachedFieldDescriptions = TriSysApex.Cache.FieldDescriptions();
            var fieldDescriptions = [];
            for (var i = 0; i < cachedFieldDescriptions.length; i++)
            {
                var fieldDescription = cachedFieldDescriptions[i];
                if (fieldDescription.TableName == ctrlFieldDescription._FieldDescription.TableName && fieldDescription.TableFieldName == sTableFieldName)
                {
                    TriSysApex.UI.ShowMessage("Duplicate field: " + fieldDescription.TableName + "." + fieldDescription.TableFieldName);
                    return;
                }
            }

            // Can only be set for new, not changed later
            ctrlFieldDescription._FieldDescription.TableFieldName = sTableFieldName;
            ctrlFieldDescription._FieldDescription.FieldTypeId = TriSysSDK.CShowForm.GetValueFromCombo(ctrlFieldDescription.FieldTypeID);
            ctrlFieldDescription._FieldDescription.Lookup = TriSysSDK.CShowForm.CheckBoxValue(ctrlFieldDescription.LookupID);
            ctrlFieldDescription._FieldDescription.FieldLength = TriSysSDK.Controls.NumericSpinner.GetValue(ctrlFieldDescription.LengthID);
            ctrlFieldDescription._FieldDescription.MultiLine = TriSysSDK.CShowForm.CheckBoxValue(ctrlFieldDescription.MultiLineID);
        }

        // Get all skills
        ctrlFieldDescription._FieldDescription.Skills = [];
        var gridData = TriSysSDK.Grid.ReadGridContents(ctrlFieldDescription.LookupGridID);
        if (gridData)
        {
            var gridRows = gridData.rows;

            for (var iRow = 0; iRow < gridRows.length; iRow++)
            {
                var row = gridRows[iRow];

                var sSkill = row.Skill;
                ctrlFieldDescription._FieldDescription.Skills.push(sSkill);
            }
        }

        // Get other fields
        ctrlFieldDescription._FieldDescription.Lookup = TriSysSDK.CShowForm.CheckBoxValue(ctrlFieldDescription.LookupID);
        ctrlFieldDescription._FieldDescription.MultiLine = TriSysSDK.CShowForm.CheckBoxValue(ctrlFieldDescription.MultiLineID);
        ctrlFieldDescription._FieldDescription.Description = $('#' + ctrlFieldDescription.DescriptionID).val();
        ctrlFieldDescription._FieldDescription.DefaultValue = $('#' + ctrlFieldDescription.DefaultValueID).val();
        ctrlFieldDescription._FieldDescription.MaxValue = $('#' + ctrlFieldDescription.MaxValueID).val();
        ctrlFieldDescription._FieldDescription.MinValue = $('#' + ctrlFieldDescription.MinValueID).val();
        ctrlFieldDescription._FieldDescription.FieldLabel = $('#' + ctrlFieldDescription.FieldLabelID).val();
        ctrlFieldDescription._FieldDescription.SortAlphabetically = TriSysSDK.CShowForm.CheckBoxValue(ctrlFieldDescription.SortAlphabeticallyID);

        if (ctrlFieldDescription._FieldDescription.FieldTypeId == TriSysSDK.Controls.FieldTypes.SkillCombo)
            ctrlFieldDescription._FieldDescription.SkillComboCategory = TriSysSDK.CShowForm.GetValueFromCombo(ctrlFieldDescription.SkillComboCategoryID);

        if (!ctrlFieldDescription._FieldDescription.Description)
        {
            TriSysApex.UI.ShowMessage("Enter a description of the field, as someone must maintain this in future!");
            return;
        }

        // Create/Save it
        ctrlFieldDescription.SaveToWebAPI(ctrlFieldDescription._FieldDescription, fnCallback);
    },

    SaveToWebAPI: function (fieldDescription, fnCallback)
    {
        var CFieldDescriptionWriteRequest =
        {
            FieldDescription: fieldDescription
        };

        var payloadObject = {};

        payloadObject.OutboundDataPacket = CFieldDescriptionWriteRequest;

        // Call the API to submit the data to the server
        payloadObject.URL = "FieldDescription/Write";

        payloadObject.InboundDataFunction = function (CFieldDescriptionWriteResponse)
        {
            TriSysApex.UI.HideWait();

            if (CFieldDescriptionWriteResponse)
            {
                if (CFieldDescriptionWriteResponse.Success)
                {
                    // Allow caller to refresh list
                    fnCallback(CFieldDescriptionWriteResponse.FieldDescription);

                    return;
                }
                else
                    TriSysApex.UI.ShowMessage(CFieldDescriptionWriteResponse.ErrorMessage);
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('ctrlFieldDescription.SaveToWebAPI: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Saving Field Description...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    // 07 Mar 2023: We want to show the administrator how the list will look at run-time
    SortAlphabeticallyChecked: function(what)
    {
        var bChecked = what.checked;
        ctrlFieldDescription._FieldDescription.SortAlphabetically = bChecked;

        // Refresh the list of lookups
        ctrlFieldDescription.SortedLookupList();
        ctrlFieldDescription.DisplayLookupSkills(null, true);
    },

    // Get the sorted list of lookups to display
    SortedLookupList: function()
    {
        var lst = ctrlFieldDescription._FieldLookups;
        if (!lst)
            return;

        if (ctrlFieldDescription._FieldDescription.SortAlphabetically)
        {
            lst.sort(function (a, b) {
                return a.Skill.localeCompare(b.Skill);
            });
        }
        else
        {
            lst.sort(function (a, b) {
                return (parseInt(a.Ordering) - parseInt(b.Ordering));
            });
        }
    }

};  // ctrlFieldDescription