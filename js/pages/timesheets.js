var TimesheetLookupForm =
{
    Load: function ()
    {
        // Show standard menus for grids
        var hideMenuItemPrefixes = ['file-menu-pre-save-divider', 'file-menu-save-items', 'file-menu-pre-close-divider', 'file-menu-close-items'];
        TriSysSDK.FormMenus.DrawGridMenu('TimesheetsGridMenu', 'divTimesheetGrid');

        var sCallbackFunction = 'TimesheetLookupForm.ActionInvocation';
        TriSysActions.Menus.Draw('TimesheetsActionsMenu', 'Timesheet', sCallbackFunction);

        // Load the search criteria tree
        TriSysSDK.SearchCriteria.Load("Timesheet", 0, 'Timesheet-lookup-criteria', TimesheetLookupForm.InvokeLookupFromCriteria);
    },

    // See ctrlSearchCriteria.DoSearch
    InvokeLookupFromCriteria: function (sEntityName, lRecordId, sJson, dynamicColumns)
    {
        var sGridID = 'divTimesheetGrid';
		if(!TriSysApex.Constants.AllowEmptySearchCriteria)
		    TriSysSDK.Grid.Clear(sGridID);

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
            API: "Timesheets/List",                 // The Web API Controller/Function

            // The additional parameters passed into the function not including the paging metrics
            Parameters: function (request)
            {
                request.SearchTreeEnabled = true;
                request.SearchTreeJson = sJson;
                request.ColumnNames = TriSysSDK.Grid.Custom.DisplayColumnNames(sGridID);
            },

            DataTableFunction: function (response)  // Called to get a suitable data table for the grid to display
            {
                return response.List;               // The list of records from the Web API
            }
        };

        var options = {
            DynamicColumns: dynamicColumns,
            SelectedRowsCounterId: 'timesheets-form-grid-selected-counter'
        };

        // Populate the grid asynchronously
        TriSysWeb.Pages.Timesheets.PopulateGrid(sGridID, "grdTimesheets", "Timesheets", fnPopulationByFunction, options);

    },

    // Called when a user runs an action from any menu.
    ActionInvocation: function (sEntityName)
    {
        var TimesheetIds = TriSysSDK.Grid.GetSelectedMultipleRowsFromGrid('divTimesheetGrid', "Timesheet_TimesheetId");
        return TimesheetIds;
    },

    FileMenuCallback: function (sFileMenuID)
    {
        var fm = TriSysSDK.FormMenus.Constants;
        var sGrid = 'divTimesheetGrid';
        var sKeyField = 'Timesheet_TimesheetId';
        var sWhat = 'Timesheet';

        //switch (sFileMenuID)
        //{
        //    case fm.File_Open:
        //        var lTimesheetId = TriSysSDK.Grid.GetSelectedSingletonRowRecordIdFromGrid(sGrid, sKeyField, sWhat);
        //        if (lTimesheetId > 0)
        //            TriSysApex.FormsManager.OpenForm("Timesheet", lTimesheetId);
        //        break;

        //    case fm.File_Delete:
        //        var lTimesheetId = TriSysSDK.Grid.GetSelectedSingletonRowRecordIdFromGrid(sGrid, sKeyField, sWhat);
        //        if (lTimesheetId > 0)
        //        {
        //            var sReference = TriSysSDK.Grid.GetSelectedSingletonRowFieldValueFromGrid(sGrid, 'Timesheet_Reference');
        //            var sCompany = TriSysSDK.Grid.GetSelectedSingletonRowFieldValueFromGrid(sGrid, 'TimesheetCompany_Name');
        //            var sCandidate = TriSysSDK.Grid.GetSelectedSingletonRowFieldValueFromGrid(sGrid, 'CandidateContact_FullName');
        //            var sJobTitle = TriSysSDK.Grid.GetSelectedSingletonRowFieldValueFromGrid(sGrid, 'Timesheet_JobTitle');

        //            var fnAfterDelete = function ()
        //            {
        //                // Refresh the grid
        //                TriSysSDK.Grid.RefreshData(sGrid);
        //            };

        //            TriSysApex.Pages.TimesheetForm.DeleteRecord(lTimesheetId, sReference, sCompany, sCandidate, sJobTitle, fnAfterDelete);
        //        }
        //        break;
        //}
    }
};

$(document).ready(function ()
{
    TimesheetLookupForm.Load();
});