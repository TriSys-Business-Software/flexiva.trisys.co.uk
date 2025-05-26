var ctrlFieldDescriptionSkillOrder =
{
    SkillCategory: null,
    SkillList: null,
    SkillGridID: 'ctrlFieldDescriptionSkillOrder-Skills',

    Load: function (sSkillCategory, lstSkill)
    {
        ctrlFieldDescriptionSkillOrder.SkillCategory = sSkillCategory;
        ctrlFieldDescriptionSkillOrder.SkillList = lstSkill;

        // <trisys-field> code injection
        TriSysSDK.CShowForm.HTMLFieldsCodeInjection();

        TriSysSDK.FormMenus.DrawGridMenu('ctrlFieldDescriptionSkillOrder-GridMenu', ctrlFieldDescriptionSkillOrder.SkillGridID);
        ctrlFieldDescriptionSkillOrder.LoadSkillsGrid(sSkillCategory, lstSkill);

        setTimeout(TriSysProUI.kendoUI_Overrides, 200);
    },

    RefreshSkillsGrid: function () {
        ctrlFieldDescriptionSkillOrder.LoadSkillsGrid(ctrlFieldDescriptionSkillOrder.SkillCategory, ctrlFieldDescriptionSkillOrder.SkillList);
    },

    LoadSkillsGrid: function (sSkillCategory, lstSkill)
    {
        // Important Bug: We must take a copy of the field descriptions as we do not want to edit them ?
        //var fieldDescriptionsForGridArray = JSON.parse(JSON.stringify(cachedFieldDescriptions));

        // Make sure your columns correlate  
        var columns = [
            { field: "SkillId", title: "SkillId", type: "number", width: 70, hidden: true },
            { field: "Ordering", title: "Order", type: "number" },
            { field: "Skill", title: "Skill/Lookup", type: "string" },
            { field: "Description", title: "Description", type: "string" }
        ];


        // Virtual grid

        TriSysSDK.Grid.VirtualMode({
            Div: ctrlFieldDescriptionSkillOrder.SkillGridID,
            ID: ctrlFieldDescriptionSkillOrder.SkillGridID,
            Title: "Field Lookups",
            RecordsPerPage: TriSysApex.UserOptions.RecordsPerPage(),
            SQL: null,
            PopulationByObject: lstSkill,
            Columns: columns,

            MultiRowSelect: true,
            Grouping: false,
            ColumnFilters: true,

            KeyColumnName: "SkillId"
        });


        // DRAG AND DROP WILL NOT WORK BECAUSE WE ARE IN A MODAL AND WE CANNOT DRAG/DROP IN THE GRID IT SEEMS
        // We would need to use the KendoUI modal I think, but I do not have time for a tangent!
        return;
    },

    SelectedRows: function (bShowWarningIfNonSelected) {
        var selectedRows = TriSysSDK.Grid.GetCheckedRows(ctrlFieldDescriptionSkillOrder.SkillGridID);
        if (!selectedRows || selectedRows.length == 0) {
            if (bShowWarningIfNonSelected)
                TriSysApex.UI.ShowMessage("Please select one or more skill lookups.");
        }
        return selectedRows;
    },


    MoveFieldUp: function () {
        ctrlFieldDescriptionSkillOrder.MoveSkill(true);
    },

    MoveFieldDown: function () {
        ctrlFieldDescriptionSkillOrder.MoveSkill(false);
    },

    // Move onie or more skill lookups up or down the order
    MoveSkill: function (bUp)
    {
        var selectedRows = ctrlFieldDescriptionSkillOrder.SelectedRows(true);
        if (!selectedRows || selectedRows.length == 0)
            return;

        var fnArrayMove = function (arr, old_index, new_index) {
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

        var lstMoveInstructions = [];
        for (var i = ctrlFieldDescriptionSkillOrder.SkillList.length - 1; i >= 0; i--) {
            var skill = ctrlFieldDescriptionSkillOrder.SkillList[i];
            selectedRows.forEach(function (row) {
                if (row.SkillId == skill.SkillId) {
                    if (bUp)     // UP e.g. decrease the index of the item
                    {
                        if (i > 0) {
                            // Yes, we can move this item up
                            lstMoveInstructions.push({ from: i, to: i - 1 });
                        }
                    }
                    else        // DOWN e.g. increase the index of the item
                    {
                        if (i < (ctrlFieldDescriptionSkillOrder.SkillList.length - 1)) {
                            // Yes, we can move this item down
                            lstMoveInstructions.push({ from: i, to: i + 1 });
                        }
                    }
                }
            });
        }

        if (bUp) {
            for (var i = lstMoveInstructions.length - 1; i >= 0; i--) {
                var instruction = lstMoveInstructions[i];
                ctrlFieldDescriptionSkillOrder.SkillList = fnArrayMove(ctrlFieldDescriptionSkillOrder.SkillList, instruction.from, instruction.to);
            }
        }
        else {
            for (var i = 0; i < lstMoveInstructions.length; i++) {
                var instruction = lstMoveInstructions[i];
                ctrlFieldDescriptionSkillOrder.SkillList = fnArrayMove(ctrlFieldDescriptionSkillOrder.SkillList, instruction.from, instruction.to);
            }
        }

        // Now re-order the numbers in the list to match
        var iOrder = 0;
        ctrlFieldDescriptionSkillOrder.SkillList.forEach(function (lookup)
        {
            iOrder += 1;
            lookup.Ordering = iOrder;
        });

        ctrlFieldDescriptionSkillOrder.RefreshSkillsGrid();
    },

    Save: function (sEntityName, fnCallback) {

        // Send to Web API
        ctrlFieldDescriptionSkillOrder.SendToWebAPI(fnCallback);

        // Always leave dialogue open in case we fail in which case we will close when all OK
        return false;
    },

    SendToWebAPI: function (fnCallback)
    {
        var payloadObject = {};

        payloadObject.URL = "SkillCategory/ReOrderFieldLookups";

        payloadObject.OutboundDataPacket = {
            SkillCategory: ctrlFieldDescriptionSkillOrder.SkillCategory,
            Lookups: ctrlFieldDescriptionSkillOrder.SkillList
        };

        payloadObject.InboundDataFunction = function (CWriteSkillListOrder) {
            TriSysApex.UI.HideWait();

            if (CWriteSkillListOrder) {
                if (CWriteSkillListOrder.Success)
                {
                    // Simply close this dialogue now
                    TriSysApex.UI.CloseModalPopup();

                    // Callback to allow refresh of updated data
                    if (fnCallback)
                        fnCallback(ctrlFieldDescriptionSkillOrder.SkillList);
                }
                else
                    TriSysApex.UI.ShowMessage(CWriteSkillListOrder.ErrorMessage);
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error) {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('ctrlFieldDescriptionSkillOrder.SendToWebAPI: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Saving Field Lookups...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    }

};  // ctrlFieldDescriptionSkillOrder
