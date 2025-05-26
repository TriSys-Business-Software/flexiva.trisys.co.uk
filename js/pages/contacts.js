var ContactLookupForm =
{
    Load: function()
    {
        //TriSysSDK.FormMenus.Draw('menuContacts');
        //TriSysSDK.FormRegions.Initialise();

        // Show standard menus for grids
        var hideMenuItemPrefixes = ['file-menu-pre-save-divider', 'file-menu-save-items', 'file-menu-pre-close-divider', 'file-menu-close-items'];
        //TriSysSDK.FormMenus.DrawFileMenu('contactFileMenu', 'divContactGrid', ContactLookupForm.FileMenuCallback, hideMenuItemPrefixes);
        TriSysSDK.FormMenus.DrawGridMenu('contactGridMenu', 'divContactGrid');
        
        var sCallbackFunction = 'ContactLookupForm.ActionInvocation';
        TriSysActions.Menus.Draw('contactActionsMenu', 'Contact', sCallbackFunction);

        // Load the contact search criteria tree
        TriSysSDK.SearchCriteria.Load("Contact", 0, 'contact-lookup-criteria', ContactLookupForm.InvokeLookupFromCriteria);
    },

    // See ctrlSearchCriteria.DoSearch
    InvokeLookupFromCriteria: function (sEntityName, lRecordId, sJson, dynamicColumns)
    {
        debugger;
        var sGridID = 'divContactGrid';
		if(!TriSysApex.Constants.AllowEmptySearchCriteria)
		    TriSysSDK.Grid.Clear(sGridID);

		if(!TriSysApex.Constants.AllowEmptySearchCriteria && !sJson)
            return;

        // 30 Jun 2024: AI Search
        var bValidSearchCriteria = false;

        var searchObject = JSON.parse(sJson);
        if (searchObject && searchObject.AICriteria)
        {
            bValidSearchCriteria = true
        }
        else
        {
            if (TriSysApex.Constants.AllowEmptySearchCriteria || ctrlSearchCriteria.isValidJsonRules(sJson))
                bValidSearchCriteria = true;
		}

        if (!bValidSearchCriteria)
        {
            // June 2019: Prevent search if no criteria supplied
            var sMessage = "Please supply " + sEntityName + " search criteria.";
            TriSysApex.UI.ShowMessage(sMessage);
            return;
        }

        // Jan 2018: Use a dedicated API method which abstracts the underlying SQL and does not use 'SQLDatabase/SQL_Select'
        var fnPopulationByFunction = {
            API: "Contacts/List",                   // The Web API Controller/Function

            // The additional parameters passed into the function not including the paging metrics
            Parameters: function (request)
            {
                var bSearchTreeEnabled = true;

                // 30 Jun 2024: AI Search
                var searchObject = JSON.parse(sJson);
                if (searchObject && searchObject.AICriteria)
                {
                    bSearchTreeEnabled = false;
                    request.AICriteria = searchObject.AICriteria;
                }

                // Original generic search code
                request.SearchTreeEnabled = bSearchTreeEnabled;
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
            SelectedRowsCounterId: 'contacts-form-grid-selected-counter',
            Json: sJson
        };

        // Populate the grid asynchronously
        TriSysWeb.Pages.Contacts.PopulateGrid(sGridID, "grdContacts", "Contacts", fnPopulationByFunction, null, options);
    },

    // Called when a user runs an action from any menu.
    ActionInvocation: function (sEntityName)
    {
        var contactIds = TriSysSDK.Grid.GetSelectedMultipleRowsFromGrid('divContactGrid', "Contact_ContactId");
        return contactIds;
    },

    FileMenuCallback: function (sFileMenuID)
    {
        var fm = TriSysSDK.FormMenus.Constants;
        var sGrid = 'divContactGrid';
        var sKeyField = 'Contact_ContactId';
        var sWhat = 'contact';

        switch (sFileMenuID)
        {
            case fm.File_New:
                TriSysApex.Pages.ContactForm.NewRecord();
                break;

            case fm.File_Open:
                var lContactId = TriSysSDK.Grid.GetSelectedSingletonRowRecordIdFromGrid(sGrid, sKeyField, sWhat);
                if (lContactId > 0)
                    TriSysApex.FormsManager.OpenForm("Contact", lContactId);
                break;

            case fm.File_Delete:
                var lContactId = TriSysSDK.Grid.GetSelectedSingletonRowRecordIdFromGrid(sGrid, sKeyField, sWhat);
                if (lContactId > 0)
                {
                    var sContactFullName = TriSysSDK.Grid.GetSelectedSingletonRowFieldValueFromGrid(sGrid, "Contact_Christian") +
                                            TriSysSDK.Grid.GetSelectedSingletonRowFieldValueFromGrid(sGrid, "Contact_Surname");

                    var fnAfterDelete = function ()
                    {
                        // Refresh the grid
                        TriSysSDK.Grid.RefreshData(sGrid);
                    };

                    TriSysApex.Pages.ContactForm.DeleteRecord(lContactId, sContactFullName, fnAfterDelete);
                }
                break;
        }
    }
};

$(document).ready(function ()
{
    ContactLookupForm.Load();
});

