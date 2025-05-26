var CompanyLookupForm =
{
    Load: function ()
    {
        // Show standard menus for grids
        var hideMenuItemPrefixes = ['file-menu-pre-save-divider', 'file-menu-save-items', 'file-menu-pre-close-divider', 'file-menu-close-items'];
        //TriSysSDK.FormMenus.DrawFileMenu('companyFileMenu', 'divCompanyGrid', CompanyLookupForm.FileMenuCallback, hideMenuItemPrefixes);
        TriSysSDK.FormMenus.DrawGridMenu('companyGridMenu', 'divCompanyGrid');

        var sCallbackFunction = 'CompanyLookupForm.ActionInvocation';
        TriSysActions.Menus.Draw('companyActionsMenu', 'Company', sCallbackFunction);

        // Load the company search criteria tree
        TriSysSDK.SearchCriteria.Load("Company", 0, 'company-lookup-criteria', CompanyLookupForm.InvokeLookupFromCriteria);
    },

    // See ctrlSearchCriteria.DoSearch
    InvokeLookupFromCriteria: function (sEntityName, lRecordId, sJson, dynamicColumns)
    {
        var sGrid = 'divCompanyGrid';
		if(!TriSysApex.Constants.AllowEmptySearchCriteria)
		    TriSysSDK.Grid.Clear(sGrid);

		if (!TriSysApex.Constants.AllowEmptySearchCriteria && !sJson)
			return;

		if (!TriSysApex.Constants.AllowEmptySearchCriteria && !ctrlSearchCriteria.isValidJsonRules(sJson))
		{
			// June 2019: Prevent search if no criteria supplied
			var sMessage = "Please supply " + sEntityName + " search criteria.";
			TriSysApex.UI.ShowMessage(sMessage);
			return;
		}

        // Jan 2018: Use a dedicated API method which abstracts the underlying SQL and does not use 'SQLDatabase/SQL_Select'
        var fnPopulationByFunction = {
            API: "Companies/List",                  // The Web API Controller/Function

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
            SelectedRowsCounterId: 'companies-form-grid-selected-counter',
            Json: sJson
        };

        // Populate the grid asynchronously
        TriSysWeb.Pages.Companies.PopulateGrid(sGrid, "grdCompanies", "Companies", fnPopulationByFunction, null, options);
    },

    // Called when a user runs an action from any menu.
    ActionInvocation: function (sEntityName)
    {
        var companyIds = TriSysSDK.Grid.GetSelectedMultipleRowsFromGrid('divCompanyGrid', "Company_CompanyId");
        return companyIds;
    },

    FileMenuCallback: function (sFileMenuID)
    {
        var fm = TriSysSDK.FormMenus.Constants;
        var sGrid = 'divCompanyGrid';
        var sKeyField = 'Company_CompanyId';
        var sWhat = 'company';

        switch (sFileMenuID)
        {
            case fm.File_New:
                TriSysApex.Pages.CompanyForm.NewRecord();
                break;

            case fm.File_Open:
                var lCompanyId = TriSysSDK.Grid.GetSelectedSingletonRowRecordIdFromGrid(sGrid, sKeyField, sWhat);
                if (lCompanyId > 0)
                    TriSysApex.FormsManager.OpenForm("Company", lCompanyId);
                break;

            case fm.File_Delete:
                var lCompanyId = TriSysSDK.Grid.GetSelectedSingletonRowRecordIdFromGrid(sGrid, sKeyField, sWhat);
                if (lCompanyId > 0)
                {
                    var sCompanyName = TriSysSDK.Grid.GetSelectedSingletonRowFieldValueFromGrid(sGrid, 'Company_Name');
                    var fnCallback = function ()
                    {
                        // Refresh the grid
                        TriSysSDK.Grid.RefreshData(sGrid);
                    };
                    TriSysApex.Pages.CompanyForm.DeleteRecord(lCompanyId, sCompanyName, fnCallback);
                }
                break;
        }
    }
};

$(document).ready(function ()
{
    CompanyLookupForm.Load();
});