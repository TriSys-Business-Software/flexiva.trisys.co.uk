var ClientPlacements =
{
    GridID: 'divClientPlacementsGrid',
    MapID: 'divClientPlacementsMap',

    Menu_ShowOnMap: 'ClientPlacements-Menu-ShowOnMap',
    Menu_ShowInGrid: 'ClientPlacements-Menu-ShowInGrid',
    Menu_Grid: 'ClientPlacements-Menu-Grid',
    Menu_Grid_Class: '.btn.btn-sm.btn-default.dropdown-toggle.enable-tooltip',

    MapKey: 'ClientPlacements-MapKey',

    Load: function ()
    {
        $('#webjobs-customer-name').html(TriSysWebJobs.Agency.CustomerName);

        TriSysSDK.FormMenus.DrawGridMenu(ClientPlacements.Menu_Grid, ClientPlacements.GridID);

        ClientPlacements.LoadPlacements();
    },

    LoadPlacements: function ()
    {
        // Jan 2018: Use a dedicated API method which abstracts the underlying SQL and does not use 'SQLDatabase/SQL_Select'
        var fnPopulationByFunction = {
            API: "Placements/ClientPlacements",     // The Web API Controller/Function

            DataTableFunction: function (response)  // Called to get a suitable data table for the grid to display
            {
                // Prepare the map also with this same data
                TriSysWebJobs.Mapping.PopulatePlacementsMap(response.Placements, ClientPlacements.MapID,
                                            ClientPlacements.Menu_ShowInGrid, ClientPlacements.ShowOnMap);

                return response.Placements;         // The list of records from the Web API
            }
        };

        ClientPlacements.PopulatePlacementsGrid(fnPopulationByFunction);
    },

    PopulatePlacementsGrid: function (fnPopulationByFunction)
    {
        var sGridDiv = ClientPlacements.GridID;

        var columns = [
                { field: "PlacementId", title: "ID", type: "number", hidden: true },
                { field: "Reference", title: "Reference", type: "string" },
                { field: "JobTitle", title: "Job Title", type: "string" },
                { field: "CompanyName", title: "Company", type: "string", hidden: true },
                { field: "CandidateName", title: "Candidate", type: "string" },
                { field: "Location", title: "Site Address", type: "string" },
                { field: "Type", title: "Type", type: "string" },
                { field: "StartDate", title: "Start Date", type: "date", format: "{0:dd MMM yyyy}", width: 130 },
                { field: "Salary", title: "Salary/Rate", type: "string" },
                { field: "Status", title: "Status", type: "string" }
        ];

        var mobileVisibleColumns = [
            { field: "Reference", title: "Job Details" }
        ];

        // Works correctly, but does not allow drill down on button on mobile
        var mobileRowTemplate = '<td colspan="1"><strong>#: Reference # (#: Type #)</strong><br />#: JobTitle #<br /><i>#: Location #</i><br />' +
                            '#: Salary #<br />Start Date: #: kendo.format("{0:dd MMM yyyy}", StartDate) #<hr></td>';

        var gridLayout = {
            Div: sGridDiv,
            ID: sGridDiv + 'grd',
            Title: "Placements",
            RecordsPerPage: TriSysApex.UserOptions.RecordsPerPage(),
            PopulationByFunction: fnPopulationByFunction,
            Columns: columns,
            MobileVisibleColumns: mobileVisibleColumns,
            MobileRowTemplate: mobileRowTemplate,
            KeyColumnName: "PlacementId",
            DrillDownFunction: function (rowData)
            {
                TriSysWebJobs.Placement.Open(rowData.PlacementId, true);
            },
            MultiRowSelect: true,
            Grouping: false,
            ColumnFilters: true,
            OpenButtonCaption: "View"
        };

        TriSysSDK.Grid.VirtualMode(gridLayout);
    },

    ShowOnMap: function ()
    {
        $('#' + ClientPlacements.Menu_ShowOnMap).hide();
        $('#' + ClientPlacements.GridID).hide();

        $('#' + ClientPlacements.Menu_ShowInGrid).show();
        $('#' + ClientPlacements.MapID).show();
        $('#' + ClientPlacements.MapKey).show();
        TriSysWebJobs.Mapping.MappingData.Draw(true, null, true);

        $('#' + ClientPlacements.Menu_WithdrawApplication).addClass('disabled');
        $('#' + ClientPlacements.Menu_SendToFriend).addClass('disabled');

        var sGridMenuDiv = TriSysApex.FormsManager.ContentDivPrefix + 'ClientPlacements';
        var gridMenu = $('#' + sGridMenuDiv).find(ClientPlacements.Menu_Grid_Class);
        if (gridMenu)
            gridMenu.addClass('disabled');
    },

    ShowInGrid: function ()
    {
        $('#' + ClientPlacements.Menu_ShowOnMap).show();
        $('#' + ClientPlacements.GridID).show();

        $('#' + ClientPlacements.Menu_ShowInGrid).hide();
        $('#' + ClientPlacements.MapID).hide();
        $('#' + ClientPlacements.MapKey).hide();

        $('#' + ClientPlacements.Menu_WithdrawApplication).removeClass('disabled');
        $('#' + ClientPlacements.Menu_SendToFriend).removeClass('disabled');

        var sGridMenuDiv = TriSysApex.FormsManager.ContentDivPrefix + 'ClientPlacements';
        var gridMenu = $('#' + sGridMenuDiv).find(ClientPlacements.Menu_Grid_Class + '.disabled');
        if (gridMenu)
            gridMenu.removeClass('disabled');
    }
};

$(document).ready(function ()
{
    ClientPlacements.Load();
});
