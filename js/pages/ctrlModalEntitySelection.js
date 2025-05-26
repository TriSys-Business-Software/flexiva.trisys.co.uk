// ctrlModalEntitySelection.js
// Used in entity specific popup selection boxes to use the search tree to populate the grid 
// and choose one or more records from the specified SQL statement

var ctrlModalEntitySelection =
{
    Load: function()
    {
        // Load the entity search criteria tree
        var sqlParameters = TriSysApex.ModalDialogue.Selection.CurrentSelectionParameterObject;
        var sEntityName = sqlParameters.EntityName;

        // Rename the search criteria div so that we retain the last search on a per entity basis
        var sSearchDiv = 'modal-entity-lookup-criteria';
        var sSearchDivForEntity = sSearchDiv + '-' + sEntityName;
        $('#' + sSearchDiv).attr('id', sSearchDivForEntity);

        // Load the search criteria now
        TriSysSDK.SearchCriteria.Load(sEntityName, 0, sSearchDivForEntity, ctrlModalEntitySelection.InvokeLookupFromCriteria);
    },

    // The SQL comes from the search criteria tree
    // This is a filter into the entity specific List API's
    InvokeLookupFromCriteria: function (sEntityName, lRecordId, sJson, dynamicColumns)
    {
        var sController = sEntityName + "s";
        if (sEntityName == "Company")
            sController = "Companies";

        var fnPopulationByFunction = {
            API: sController + "/List",             // The Web API Controller/Function

            // The additional parameters passed into the function not including the paging metrics
            Parameters: function (request)
            {
                request.SearchTreeEnabled = true;
				request.SearchTreeJson = sJson;

                // Are there other properties to set?
                var sqlParameters = TriSysApex.ModalDialogue.Selection.CurrentSelectionParameterObject;
                if (sqlParameters.ParameterFunction)
                    sqlParameters.ParameterFunction(request);
            },

            DataTableFunction: function (response)  // Called to get a suitable data table for the grid to display
            {
                return response.List;               // The list of records from the Web API
            }
        };

        // Populate the grid asynchronously
        ctrlModalEntitySelection.PopulateGrid(sEntityName, 'divModalEntitySelectionGrid', "grd" + sController, sController, fnPopulationByFunction, dynamicColumns);
    },

    PopulateGrid: function (sEntityName, sDiv, sGridName, sTitle, fnPopulationByFunction, dynamicColumns)
    {
        // Modify the SQL statement
        var sqlParameters = TriSysApex.ModalDialogue.Selection.CurrentSelectionParameterObject;

        // Show less records in modal popups
        var iModalRecordsPerPage = TriSysApex.UserOptions.RecordsPerPage() / 2;

        // Populate the grid now
        TriSysSDK.Grid.VirtualMode({
            Div: sDiv,
            ID: sGridName,
            Title: sTitle,
            RecordsPerPage: iModalRecordsPerPage,
            PopulationByFunction: fnPopulationByFunction,
            Columns: sqlParameters.Columns,
            //DynamicColumns: dynamicColumns,                                           // Aug 2020: Scrunches grid and not suitable for popups!
            //MobileVisibleColumns: TriSysWeb.Pages.Contacts.MobileVisibleColumns,      // TODO Alex
            //MobileRowTemplate: TriSysWeb.Pages.Contacts.MobileRowTemplate,
            KeyColumnName: null,
            DrillDownFunction: null,
            SingleRowSelect: true,
            Height: TriSysApex.Pages.Index.FormHeight() * (2/3),
            RowDoubleClick: sqlParameters.CallbackFunction,
			Grouping: TriSysApex.UserOptions.GridGrouping()
        });
    }
};

$(document).ready(function ()
{
    ctrlModalEntitySelection.Load();
});
