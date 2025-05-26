var RequirementLookupForm =
{
    Load: function ()
    {
        // Show standard menus for grids
        var hideMenuItemPrefixes = ['file-menu-pre-save-divider', 'file-menu-save-items', 'file-menu-pre-close-divider', 'file-menu-close-items'];
        //TriSysSDK.FormMenus.DrawFileMenu('requirementsFileMenu', 'divRequirementGrid', RequirementLookupForm.FileMenuCallback, hideMenuItemPrefixes);
        TriSysSDK.FormMenus.DrawGridMenu('requirementsGridMenu', 'divRequirementGrid');

        var sCallbackFunction = 'RequirementLookupForm.ActionInvocation';
        TriSysActions.Menus.Draw('requirementsActionsMenu', 'Requirement', sCallbackFunction);

        // Load the search criteria tree
        TriSysSDK.SearchCriteria.Load("Requirement", 0, 'requirement-lookup-criteria', RequirementLookupForm.InvokeLookupFromCriteria);
    },

    // See ctrlSearchCriteria.DoSearch
    InvokeLookupFromCriteria: function (sEntityName, lRecordId, sJson, dynamicColumns)
    {
        var sGrid = 'divRequirementGrid';
        if(!TriSysApex.Constants.AllowEmptySearchCriteria)
            TriSysSDK.Grid.Clear(sGrid);

		if(!TriSysApex.Constants.AllowEmptySearchCriteria && !sJson)
			return;

        if(!TriSysApex.Constants.AllowEmptySearchCriteria && !ctrlSearchCriteria.isValidJsonRules(sJson))
		{
			// June 2019: Prevent search if no criteria supplied
			var sMessage = "Please supply " + sEntityName + " search criteria.";
			TriSysApex.UI.ShowMessage(sMessage);
			return;
		}

        // Jan 2018: Use a dedicated API method which abstracts the underlying SQL and does not use 'SQLDatabase/SQL_Select'
        var fnPopulationByFunction = {
            API: "Requirements/List",               // The Web API Controller/Function

            // The additional parameters passed into the function not including the paging metrics
            Parameters: function (request)
            {
                request.SearchTreeEnabled = true;
                request.SearchTreeJson = sJson;
                request.ColumnNames = TriSysSDK.Grid.Custom.DisplayColumnNames(sGrid);
            },

            DataTableFunction: function (response)  // Called to get a suitable data table for the grid to display
            {
                return response.List;               // The list of records from the Web API
            }
        };

        var options = {
            DynamicColumns: dynamicColumns,
            SelectedRowsCounterId: 'requirements-form-grid-selected-counter'
        };

        // Populate the grid asynchronously
        TriSysWeb.Pages.Requirements.PopulateGrid(sGrid, "grdRequirements", "Requirements", fnPopulationByFunction, options);
    },

    // Called when a user runs an action from any menu.
    ActionInvocation: function (sEntityName)
    {
        var requirementIds = TriSysSDK.Grid.GetSelectedMultipleRowsFromGrid('divRequirementGrid', "Requirement_RequirementId");
        return requirementIds;
    },

    FileMenuCallback: function (sFileMenuID)
    {
        var fm = TriSysSDK.FormMenus.Constants;
        var sGrid = 'divRequirementGrid';
        var sKeyField = 'Requirement_RequirementId';
        var sWhat = 'requirement';

        switch (sFileMenuID)
        {
            case fm.File_New:
                TriSysApex.Pages.RequirementForm.NewRecord();
                break;

            case fm.File_Open:
                var lRequirementId = TriSysSDK.Grid.GetSelectedSingletonRowRecordIdFromGrid(sGrid, sKeyField, sWhat);
                if (lRequirementId > 0)
                    TriSysApex.FormsManager.OpenForm("Requirement", lRequirementId);
                break;

            case fm.File_Delete:
                var lRequirementId = TriSysSDK.Grid.GetSelectedSingletonRowRecordIdFromGrid(sGrid, sKeyField, sWhat);
                if (lRequirementId > 0)
                {
                    var sReference = TriSysSDK.Grid.GetSelectedSingletonRowFieldValueFromGrid(sGrid, 'Requirement_RequirementReference');
                    var sCompany = TriSysSDK.Grid.GetSelectedSingletonRowFieldValueFromGrid(sGrid, 'RequirementCompany_Name');
                    var sJobTitle = TriSysSDK.Grid.GetSelectedSingletonRowFieldValueFromGrid(sGrid, 'Requirement_JobTitle');

                    var fnAfterDelete = function ()
                    {
                        // Refresh the grid
                        TriSysSDK.Grid.RefreshData(sGrid);
                    };

                    TriSysApex.Pages.RequirementForm.DeleteRecord(lRequirementId, sReference, sCompany, sJobTitle, fnAfterDelete);
                }
                break;
        }
    }
};

$(document).ready(function ()
{
    RequirementLookupForm.Load();
});

