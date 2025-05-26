var ctrlEntityFormCustomTab =
{
    EntityName: null,
    FieldsGridID: 'ctrlEntityFormCustomTab-Fields',

    Load: function (sEntityName)
    {
        ctrlEntityFormCustomTab.EntityName = sEntityName;

        // July 2019: <trisys-field> code injection
        TriSysSDK.CShowForm.HTMLFieldsCodeInjection();

        // Set current values
        var customTab = TriSysSDK.CShowForm.CustomFieldsTab.Data.CustomTab(sEntityName);
        if(customTab)
        {
            TriSysSDK.CShowForm.writeFieldValueToWidget('ctrlEntityFormCustomTab-Caption', customTab.Caption, { FieldTypeId: TriSysSDK.Controls.FieldTypes.Text });
            TriSysSDK.CShowForm.writeFieldValueToWidget('ctrlEntityFormCustomTab-ColumnCount', customTab.ColumnCount, { FieldTypeId: TriSysSDK.Controls.FieldTypes.Integer });
            TriSysSDK.CShowForm.writeFieldValueToWidget('ctrlEntityFormCustomTab-LabelWidth', customTab.LabelWidth, { FieldTypeId: TriSysSDK.Controls.FieldTypes.Integer });
        }        

        TriSysSDK.FormMenus.DrawGridMenu('ctrlEntityFormCustomTab-GridMenu', ctrlEntityFormCustomTab.FieldsGridID);
        ctrlEntityFormCustomTab.LoadFieldsGrid(sEntityName);

        setTimeout(TriSysProUI.kendoUI_Overrides, 200);
    },

    RefreshFieldsGrid: function()
    {
        ctrlEntityFormCustomTab.LoadFieldsGrid(ctrlEntityFormCustomTab.EntityName);
    },

    LoadFieldsGrid: function (sEntityName)
    {
        var cachedFieldDescriptions = [];
        var customTab = TriSysSDK.CShowForm.CustomFieldsTab.Data.CustomTab(sEntityName);
        if (customTab)
            cachedFieldDescriptions = customTab.FieldDescriptions;

        // Important Bug: We must take a copy of the field descriptions as we do not want to edit them
        var fieldDescriptionsForGridArray = JSON.parse(JSON.stringify(cachedFieldDescriptions));

        // Set position
        //var iPosition = 0;
        //fieldDescriptionsForGridArray.forEach(function (fd)
        //{
        //    fd.Position = iPosition;
        //    iPosition += 1;
        //});

        // Make sure your columns correlate with 
        var columns = [
            { field: "FieldId", title: "FieldId", type: "number", width: 70, hidden: true },
            //{ field: "Position", title: "Position", type: "number" },
            { field: "TableName", title: "TableName", type: "string", hidden: true },
            { field: "TableFieldName", title: "Field Name", type: "string" },
            { field: "FieldLabel", title: "Field Label", type: "string" },
            { field: "FieldTypeId", title: "FieldTypeId", type: "number", hidden: true },
            { field: "FieldTypeName", title: "Field Type", type: "string" }
        ];


        // Virtual grid

        TriSysSDK.Grid.VirtualMode({
            Div: ctrlEntityFormCustomTab.FieldsGridID,
            ID: ctrlEntityFormCustomTab.FieldsGridID,
            Title: "Fields",
            RecordsPerPage: TriSysApex.UserOptions.RecordsPerPage(),
            SQL: null,
            PopulationByObject: fieldDescriptionsForGridArray,
            Columns: columns,

            MultiRowSelect: true,
            Grouping: false,
            ColumnFilters: true,

            KeyColumnName: "FieldId"
        });


        // THIS WILL NOT WORK BECAUSE WE ARE IN A MODAL AND WE CANNOT DRAG/DROP IN THE GRID IT SEEMS
        // We would need to use the KendoUI modal I think, but I do not have time for a tangent!
        return;

        // Add drag and drop

        grid.setOptions({ scrollable: false });

        grid.table.kendoSortable({
            filter: ">tbody >tr",
            hint: function (element) { // Customize the hint.
                var table = $('<table style="width: 600px;" class="k-grid k-widget"></table>'),
                    hint;

                table.append(element.clone()); // Append the dragged element.
                table.css("opacity", 0.7);

                return table; // Return the hint element.
            },
            cursor: "move",
            placeholder: function (element) {
                return $('<tr colspan="7" class="placeholder"></tr>');
            },
            change: function (e) {
                var skip = grid.dataSource.skip(),
                    oldIndex = e.oldIndex + skip,
                    newIndex = e.newIndex + skip,
                    data = grid.dataSource.data(),
                    dataItem = grid.dataSource.getByUid(e.item.data("uid"));

                grid.dataSource.remove(dataItem);
                grid.dataSource.insert(newIndex, dataItem);
            }
        });


        return;

        var grid = $("#" + ctrlEntityFormCustomTab.FieldsGridID).data("kendoGrid");
        grid.table.kendoDraggable({
            filter: "tbody > tr",
            group: "gridGroup",
            hint: function (e) {
                return $('<div class="k-grid k-widget"><table><tbody><tr>' + e.html() + '</tr></tbody></table></div>');
            }
        });

        grid.table/*.find("tbody > tr")*/.kendoDropTarget({
            group: "gridGroup",
            drop: function (e) {
                var target = dataSource.get($(e.draggable.currentTarget).data("FieldId")),
                    dest = $(e.target);

                if (dest.is("th")) {
                    return;
                }
                dest = dataSource.get(dest.parent().data("FieldId"));

                //not on same item
                if (target.get("FieldId") !== dest.get("FieldId")) {
                    //reorder the items
                    var tmp = target.get("Position");
                    target.set("Position", dest.get("Position"));
                    dest.set("Position", tmp);

                    dataSource.sort({ field: "Position", dir: "asc" });
                }
            }
        });
    },

    SelectedRows: function(bShowWarningIfNonSelected)
    {
        var selectedRows = TriSysSDK.Grid.GetCheckedRows(ctrlEntityFormCustomTab.FieldsGridID);
        if (!selectedRows || selectedRows.length == 0)
        {
            if (bShowWarningIfNonSelected)
                TriSysApex.UI.ShowMessage("Please select one or more fields.");
        }
        return selectedRows;
    },

    AddField: function()
    {
        // Get all field descriptions not already in the list
        var sEntityName = ctrlEntityFormCustomTab.EntityName;
        var fieldDescriptions = TriSysApex.Cache.FieldDescriptions();
        var displayedFieldDescriptions = [];

        var customTab = TriSysSDK.CShowForm.CustomFieldsTab.Data.CustomTab(sEntityName);
        if (customTab)
            displayedFieldDescriptions = customTab.FieldDescriptions;

        // Important Bug: We must take a copy of the field descriptions as we do not want to edit them
        fieldDescriptions = JSON.parse(JSON.stringify(fieldDescriptions));

        // Eliminate those which are not for this entity
        for (var i = fieldDescriptions.length - 1; i >= 0; i--)
        {
            var fieldDescription = fieldDescriptions[i];
            if (fieldDescription.TableName.indexOf(sEntityName) < 0)
                fieldDescriptions.splice(i, 1);
        }

        // Sort original field descriptions
        fieldDescriptions.sort(function (a, b) {
            var x = a.TableName.toLowerCase() + '_' + a.TableFieldName.toLowerCase(),
            y = b.TableName.toLowerCase() + '_' + b.TableFieldName.toLowerCase();
            return x < y ? -1 : x > y ? 1 : 0;
        });

        // Eliminate those already in our list and those already on forms

        for (var i = fieldDescriptions.length - 1; i >= 0; i--)
        {
            var fieldDescription = fieldDescriptions[i];

            var bEliminate = false;

            displayedFieldDescriptions.forEach(function (fd)
            {
                if (fd.FieldId == fieldDescription.FieldId)
                    bEliminate = true;
            });

            if (!bEliminate)
                bEliminate = !ctrlEntityFormCustomTab.isConfigFieldWhichCanBeShownOnCustomTab(fieldDescription);

            if(bEliminate)
                fieldDescriptions.splice(i, 1);
        }

        var fnPicked = function (fieldDescription) {
            // Add each to the end assuming administrator added the most important first?
            displayedFieldDescriptions.push(fieldDescription);
            var customTab = ctrlEntityFormCustomTab.TabSettings();
            customTab.FieldDescriptions = displayedFieldDescriptions;
            TriSysSDK.CShowForm.CustomFieldsTab.Data.AddedCustomTab(sEntityName, customTab);
            ctrlEntityFormCustomTab.RefreshFieldsGrid();
            return true;
        };

        // Prompt the user to select one of the field descriptions
        var fieldParameters = new TriSysApex.ModalDialogue.Selection.SelectionParameters();
        fieldParameters.Title = "Select Field";
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

    // Return true if a config field which can be shown on an entity custom tab
    isConfigFieldWhichCanBeShownOnCustomTab: function (fieldDescription)
    {
        var sFullName = fieldDescription.TableName + "_" + fieldDescription.TableFieldName;
        var bConfigField = (fieldDescription.TableName.indexOf("ConfigFields") > 0);

        var lstAllowedFieldTypes = [
            TriSysSDK.Controls.FieldTypes.Text,
            TriSysSDK.Controls.FieldTypes.Integer,
            TriSysSDK.Controls.FieldTypes.Float,
            TriSysSDK.Controls.FieldTypes.Percent,
            TriSysSDK.Controls.FieldTypes.Currency,
            TriSysSDK.Controls.FieldTypes.YesNo,
            TriSysSDK.Controls.FieldTypes.Date,
            TriSysSDK.Controls.FieldTypes.FileReference,
            TriSysSDK.Controls.FieldTypes.Image,
            TriSysSDK.Controls.FieldTypes.EMail,
            TriSysSDK.Controls.FieldTypes.Internet,
            TriSysSDK.Controls.FieldTypes.Telephone,
            TriSysSDK.Controls.FieldTypes.User,
            TriSysSDK.Controls.FieldTypes.Contact,
            TriSysSDK.Controls.FieldTypes.Company,
            TriSysSDK.Controls.FieldTypes.CurrencyLink,
            TriSysSDK.Controls.FieldTypes.WebPage,
            TriSysSDK.Controls.FieldTypes.RichTextBox,
            TriSysSDK.Controls.FieldTypes.Video,
            TriSysSDK.Controls.FieldTypes.CurrencyAmountPeriod,
            TriSysSDK.Controls.FieldTypes.FolderReference,
            TriSysSDK.Controls.FieldTypes.JobTitle,
            TriSysSDK.Controls.FieldTypes.Password,
            TriSysSDK.Controls.FieldTypes.TextDropDown,
            TriSysSDK.Controls.FieldTypes.MultiSelectList
        ];
        var bAllowedFieldType = (lstAllowedFieldTypes.indexOf(fieldDescription.FieldTypeId) >= 0);

        var lstNoNoFields = [

                // CONTACT
                'ContactConfigFields_CRBCheck',
                'ContactConfigFields_CVLastUpdated',
                'ContactConfigFields_Expiry',
                'ContactConfigFields_FormattedCV1LastUpdated',
                'ContactConfigFields_FormattedCV2LastUpdated',
                'ContactConfigFields_FormattedCV3LastUpdated',
                'ContactConfigFields_FormattedCV4LastUpdated',
                'ContactConfigFields_FormattedCVFileRef1',
                'ContactConfigFields_FormattedCVFileRef2',
                'ContactConfigFields_FormattedCVFileRef3',
                'ContactConfigFields_FormattedCVFileRef4',
                'ContactConfigFields_Identification',
                'ContactConfigFields_IdentificationComments',
                'ContactConfigFields_IdentificationLink',
                'ContactConfigFields_IdentificationLink2',
                'ContactConfigFields_Link3',
                'ContactConfigFields_Link4',
                'ContactConfigFields_Link5',
                'ContactConfigFields_Link6',
                'ContactConfigFields_Nationality',
                'ContactConfigFields_Status',
                'ContactConfigFields_TypeOfWorkRequired',
                'ContactConfigFields_UmbrellaReference',
                'ContactConfigFields_AddedBy',
                'ContactConfigFields_ContactPhoto',
                'ContactConfigFields_ContactSource',
                'ContactConfigFields_ContactTempPeriod',
                'ContactConfigFields_Gender',
                'ContactConfigFields_RequiredRemunerationTemporary',
                'ContactConfigFields_RequiredRemunerationPermanent',
                'ContactConfigFields_RequiredRemunerationContract',

                // COMPANY
                'CompanyConfigFields_AdditionalDoc1',
                'CompanyConfigFields_AdditionalDoc2',
                'CompanyConfigFields_AdditionalDoc3',
                'CompanyConfigFields_AdditionalDoc4',
                'CompanyConfigFields_CompanyDivision',
                'CompanyConfigFields_CompanyLogo',
                'CompanyConfigFields_CompanyStatus',
                'CompanyConfigFields_Source',

                // REQUIREMENT
                'RequirementConfigFields_ActiveSearchingLastRun',
                'RequirementConfigFields_BenefitsValue',
                'RequirementConfigFields_Bonus',
                'RequirementConfigFields_CarValue',
                'RequirementConfigFields_DateInitiated',
                'RequirementConfigFields_DaysPerWeek',
                'RequirementConfigFields_EarliestStartDate',
                'RequirementConfigFields_ExpectedRevenueDate',
                'RequirementConfigFields_Fee',
                'RequirementConfigFields_FeePercentage',
                'RequirementConfigFields_HoursPerDay',
                'RequirementConfigFields_IncludeCarInFee',
                'RequirementConfigFields_JobDescription',
                'RequirementConfigFields_JobTitle',
                'RequirementConfigFields_MaximumSalary',
                'RequirementConfigFields_MinimumSalary',
                'RequirementConfigFields_MeritRequirementReference',
                'RequirementConfigFields_NumberRequired',
                'RequirementConfigFields_ProbabilityToFill',
                'RequirementConfigFields_RequirementStatus',
                'RequirementConfigFields_SiteAddressId',
                'RequirementConfigFields_SiteAddress',
                'RequirementConfigFields_TotalPackageValue',

                // PLACEMENT
                'PlacementConfigFields_AttachmentsUsed',
                'PlacementConfigFields_AvailableTemplates',
                'PlacementConfigFields_BenefitsValue',
                'PlacementConfigFields_Bonus',
                'PlacementConfigFields_Candidate',
                'PlacementConfigFields_CandidateEMail',
                'PlacementConfigFields_CandidateSourceTemplate',
                'PlacementConfigFields_Car',
                'PlacementConfigFields_CarValue',
                'PlacementConfigFields_ChargeRatesList',
                'PlacementConfigFields_ClientContractDoc',
                'PlacementConfigFields_DateCandidateContractIssued',
                'PlacementConfigFields_DateInitiated',
                'PlacementConfigFields_DaysPerWeek',
                'PlacementConfigFields_DurationInWeeks',
                'PlacementConfigFields_EndDate',
                'PlacementConfigFields_DurationInWeeks',
                'PlacementConfigFields_Fee',
                'PlacementConfigFields_FeePercentage',
                'PlacementConfigFields_FixedTermDurationWeeks',
                'PlacementConfigFields_FollowUpTime',
                'PlacementConfigFields_HoursPerDay',
                'PlacementConfigFields_InterviewDay',
                'PlacementConfigFields_InterviewLocation',
                'PlacementConfigFields_InterviewStage',
                'PlacementConfigFields_InvoiceContact',
                'PlacementConfigFields_JobTitle',
                'Placement_Note/History Duration',
                'PlacementConfigFields_PlacementIncludeCarInFee',
                'PlacementConfigFields_PlacementStatus',
                'PlacementConfigFields_Salary',
                'PlacementConfigFields_SetInScopeToNo',
                'PlacementConfigFields_StartDate',
                'PlacementConfigFields_TotalPackageValue',

                // TIMESHEET
                'TimesheetConfigFields_AuthorisationRequested',
                'TimesheetConfigFields_AuthorisedBy',
                'TimesheetConfigFields_AuthorisedDate',
                'TimesheetConfigFields_AuthorisedIPAddress',
                'TimesheetConfigFields_BarCode',
                'TimesheetConfigFields_ChargeVAT',
                'TimesheetConfigFields_InputDate',
                'TimesheetConfigFields_RateSelectionText',
                'TimesheetConfigFields_TimesheetLink',

                'Last_One_Without_Trailing_Comma'
        ];

        var bFound = (lstNoNoFields.indexOf(sFullName) >= 0);

        var bFieldCanBeShownOnCustomTab = bConfigField && bAllowedFieldType && !bFound;

        return bFieldCanBeShownOnCustomTab;
    },

    DeleteField: function ()
    {
        var selectedRows = ctrlEntityFormCustomTab.SelectedRows(true);
        if (!selectedRows || selectedRows.length == 0)
            return;

        var fieldDescriptions = [];
        var customTab = TriSysSDK.CShowForm.CustomFieldsTab.Data.CustomTab(ctrlEntityFormCustomTab.EntityName);
        if (customTab)
            fieldDescriptions = customTab.FieldDescriptions;

        for (var i = fieldDescriptions.length - 1; i >= 0; i--)
        {
            var fieldDescription = fieldDescriptions[i];
            selectedRows.forEach(function (row)
            {
                if (row.FieldId == fieldDescription.FieldId)
                    fieldDescriptions.splice(i, 1);
            });
        }        

        ctrlEntityFormCustomTab.RefreshFieldsGrid();
    },

    MoveFieldUp: function ()
    {
        ctrlEntityFormCustomTab.MoveFields(true);
    },

    MoveFieldDown: function ()
    {
        ctrlEntityFormCustomTab.MoveFields(false);
    },

    // Move onie or more fields up or down the order
    MoveFields: function (bUp)
    {
        var selectedRows = ctrlEntityFormCustomTab.SelectedRows(true);
        if (!selectedRows || selectedRows.length == 0)
            return;

        var fnArrayMove = function (arr, old_index, new_index)
        {
            while (old_index < 0) {
                old_index += arr.length;
            }
            while (new_index < 0) {
                new_index += arr.length;
            }
            if (new_index >= arr.length) {
                k = new_index - arr.length;
                while ((k--) + 1) {
                    arr.push(undefined);
                }
            }
            arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
            return arr;
        };

        var fieldDescriptions = [];
        var customTab = TriSysSDK.CShowForm.CustomFieldsTab.Data.CustomTab(ctrlEntityFormCustomTab.EntityName);
        if (customTab)
            fieldDescriptions = customTab.FieldDescriptions;

        var lstMoveInstructions = [];
        for (var i = fieldDescriptions.length - 1; i >= 0; i--)
        {
            var fieldDescription = fieldDescriptions[i];
            selectedRows.forEach(function (row)
            {
                if (row.FieldId == fieldDescription.FieldId)
                {
                    if(bUp)     // UP e.g. decrease the index of the item
                    {
                        if(i > 0)
                        {
                            // Yes, we can move this item up
                            lstMoveInstructions.push({ from: i, to: i - 1 });
                        }
                    }
                    else        // DOWN e.g. increase the index of the item
                    {
                        if (i < (fieldDescriptions.length - 1))
                        {
                            // Yes, we can move this item down
                            lstMoveInstructions.push({ from: i, to: i + 1 });
                        }
                    }
                }
            });
        }

        if (bUp)
        {
            for (var i = lstMoveInstructions.length - 1; i >= 0; i--)
            {
                var instruction = lstMoveInstructions[i];
                fieldDescriptions = fnArrayMove(fieldDescriptions, instruction.from, instruction.to);
            }
        }
        else
        {
            for (var i = 0; i < lstMoveInstructions.length; i++)
            {
                var instruction = lstMoveInstructions[i];
                fieldDescriptions = fnArrayMove(fieldDescriptions, instruction.from, instruction.to);
            }
        }
        ctrlEntityFormCustomTab.RefreshFieldsGrid();
    },

    Save: function (sEntityName)
    {
        var displayedFieldDescriptions = [];
        var customTab = TriSysSDK.CShowForm.CustomFieldsTab.Data.CustomTab(sEntityName);
        if (customTab)
            displayedFieldDescriptions = customTab.FieldDescriptions;

        // Current settings, not old settings
        var newCustomTab = ctrlEntityFormCustomTab.TabSettings();

        // Assume all will be OK, so overwrite currently cached settings
        if (customTab)
        {
            customTab.Caption = newCustomTab.Caption;
            customTab.ColumnCount = newCustomTab.ColumnCount;
            customTab.LabelWidth = newCustomTab.LabelWidth;
        }

        // Send to Web API
        newCustomTab.Fields = [];
        displayedFieldDescriptions.forEach(function (fieldDescription)
        {
            newCustomTab.Fields.push({ FieldId: fieldDescription.FieldId });
        });
        ctrlEntityFormCustomTab.SendToWebAPI(newCustomTab);

        // Always leave dialogue open in case we fail in which case we will close when all OK
        return false;
    },

    SendToWebAPI: function (CWriteApexEntityFormCustomFieldsTabRequest)
    {
        var payloadObject = {};

        payloadObject.URL = "EntityCustomTab/Write";

        payloadObject.OutboundDataPacket = CWriteApexEntityFormCustomFieldsTabRequest;

        payloadObject.InboundDataFunction = function (CWriteApexEntityFormCustomFieldsTabResponse) {
            TriSysApex.UI.HideWait();

            if (CWriteApexEntityFormCustomFieldsTabResponse) {
                if (CWriteApexEntityFormCustomFieldsTabResponse.Success)
                {
                    // Simply close this dialogue now
                    TriSysApex.UI.CloseModalPopup();
                }
                else
                    TriSysApex.UI.ShowMessage(CWriteApexEntityFormCustomFieldsTabResponse.ErrorMessage);
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error) {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('ctrlEntityFormCustomTab.SendToWebAPI: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Saving Custom Fields...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    TabSettings: function()
    {
        var customTab = {
            EntityName: ctrlEntityFormCustomTab.EntityName,
            Caption: TriSysSDK.CShowForm.readFieldValueFromWidget('ctrlEntityFormCustomTab-Caption', TriSysSDK.Controls.FieldTypes.Text),
            ColumnCount: TriSysSDK.CShowForm.readFieldValueFromWidget('ctrlEntityFormCustomTab-ColumnCount', TriSysSDK.Controls.FieldTypes.Integer),
            LabelWidth: TriSysSDK.CShowForm.readFieldValueFromWidget('ctrlEntityFormCustomTab-LabelWidth', TriSysSDK.Controls.FieldTypes.Integer)
        };
        
        return customTab;
    }

};  // ctrlEntityFormCustomTab
