var PlacementLookupForm =
{
    Load: function ()
    {
        // Show standard menus for grids
        var hideMenuItemPrefixes = ['file-menu-pre-save-divider', 'file-menu-save-items', 'file-menu-pre-close-divider', 'file-menu-close-items'];
        //TriSysSDK.FormMenus.DrawFileMenu('placementsFileMenu', 'divPlacementGrid', PlacementLookupForm.FileMenuCallback, hideMenuItemPrefixes);
        TriSysSDK.FormMenus.DrawGridMenu('placementsGridMenu', 'divPlacementGrid');

        var sCallbackFunction = 'PlacementLookupForm.ActionInvocation';
        TriSysActions.Menus.Draw('placementsActionsMenu', 'Placement', sCallbackFunction);

        // Load the search criteria tree
        TriSysSDK.SearchCriteria.Load("Placement", 0, 'placement-lookup-criteria', PlacementLookupForm.InvokeLookupFromCriteria);
    },

    // See ctrlSearchCriteria.DoSearch
    InvokeLookupFromCriteria: function (sEntityName, lRecordId, sJson, dynamicColumns)
    {
        var sGrid = 'divPlacementGrid';
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
            API: "Placements/List",                 // The Web API Controller/Function

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
            SelectedRowsCounterId: 'placements-form-grid-selected-counter'
        };

        // Populate the grid asynchronously
        TriSysWeb.Pages.Placements.PopulateGrid(sGrid, "grdPlacements", "Placements", fnPopulationByFunction, options);
    },

    // Called when a user runs an action from any menu.
    ActionInvocation: function (sEntityName)
    {
        var placementIds = TriSysSDK.Grid.GetSelectedMultipleRowsFromGrid('divPlacementGrid', "Placement_PlacementId");
        return placementIds;
    },

    FileMenuCallback: function (sFileMenuID)
    {
        var fm = TriSysSDK.FormMenus.Constants;
        var sGrid = 'divPlacementGrid';
        var sKeyField = 'Placement_PlacementId';
        var sWhat = 'placement';

        switch (sFileMenuID)
        {
            case fm.File_New:
                TriSysApex.Pages.PlacementForm.NewRecord();
                break;

            case fm.File_Open:
                var lPlacementId = TriSysSDK.Grid.GetSelectedSingletonRowRecordIdFromGrid(sGrid, sKeyField, sWhat);
                if (lPlacementId > 0)
                    TriSysApex.FormsManager.OpenForm("Placement", lPlacementId);
                break;

            case fm.File_Delete:
                var lPlacementId = TriSysSDK.Grid.GetSelectedSingletonRowRecordIdFromGrid(sGrid, sKeyField, sWhat);
                if (lPlacementId > 0)
                {
                    var sReference = TriSysSDK.Grid.GetSelectedSingletonRowFieldValueFromGrid(sGrid, 'Placement_Reference');
                    var sCompany = TriSysSDK.Grid.GetSelectedSingletonRowFieldValueFromGrid(sGrid, 'PlacementCompany_Name');
                    var sCandidate = TriSysSDK.Grid.GetSelectedSingletonRowFieldValueFromGrid(sGrid, 'CandidateContact_FullName');
                    var sJobTitle = TriSysSDK.Grid.GetSelectedSingletonRowFieldValueFromGrid(sGrid, 'Placement_JobTitle');

                    var fnAfterDelete = function ()
                    {
                        // Refresh the grid
                        TriSysSDK.Grid.RefreshData(sGrid);
                    };

                    TriSysApex.Pages.PlacementForm.DeleteRecord(lPlacementId, sReference, sCompany, sCandidate, sJobTitle, fnAfterDelete);
                }
                break;
        }
    }
};

$(document).ready(function ()
{
    PlacementLookupForm.Load();
});