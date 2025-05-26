var CandidatePlacements =
{
    GridID: 'divCandidatePlacementsGrid',
    MapID: 'divCandidatePlacementsMap',

    Menu_ShowOnMap: 'CandidatePlacements-Menu-ShowOnMap',
    Menu_ShowInGrid: 'CandidatePlacements-Menu-ShowInGrid',
    Menu_Grid: 'CandidatePlacements-Menu-Grid',
    Menu_Grid_Class: '.btn.btn-sm.btn-default.dropdown-toggle.enable-tooltip',

    MapKey: 'CandidatePlacements-MapKey',

    Load: function ()
    {
        $('#webjobs-customer-name').html(TriSysWebJobs.Agency.CustomerName);

        TriSysSDK.FormMenus.DrawGridMenu(CandidatePlacements.Menu_Grid, CandidatePlacements.GridID);

        CandidatePlacements.LoadPlacements();
    },

    LoadPlacements: function ()
    {
        // Jan 2018: Use a dedicated API method which abstracts the underlying SQL and does not use 'SQLDatabase/SQL_Select'
        var fnPopulationByFunction = {
            API: "Placements/CandidatePlacements",     // The Web API Controller/Function

            DataTableFunction: function (response)  // Called to get a suitable data table for the grid to display
            {
                // Prepare the map also with this same data
                TriSysWebJobs.Mapping.PopulatePlacementsMap(response.Placements, CandidatePlacements.MapID,
                                            CandidatePlacements.Menu_ShowInGrid, CandidatePlacements.ShowOnMap);

                return response.Placements;          // The list of records from the Web API
            }
        };

        CandidatePlacements.PopulatePlacementsGrid(fnPopulationByFunction);
    },

    PopulatePlacementsGrid: function (fnPopulationByFunction)
    {
        var sGridDiv = CandidatePlacements.GridID;

        var columns = [
                { field: "PlacementId", title: "ID", type: "number", hidden: true },
                { field: "Reference", title: "Reference", type: "string" },
                { field: "JobTitle", title: "Job Title", type: "string" },
                { field: "CompanyName", title: "Company", type: "string" },
                { field: "Location", title: "Location", type: "string" },
                { field: "Type", title: "Type", type: "string" },
                { field: "StartDate", title: "Start Date", type: "date", format: "{0:dd MMM yyyy}", width: 130 },
                { field: "EndDate", title: "End Date", type: "date", format: "{0:dd MMM yyyy}", width: 130 },
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
                TriSysWebJobs.Placement.Open(rowData.PlacementId);
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
        $('#' + CandidatePlacements.Menu_ShowOnMap).hide();
        $('#' + CandidatePlacements.GridID).hide();

        $('#' + CandidatePlacements.Menu_ShowInGrid).show();
        $('#' + CandidatePlacements.MapID).show();
        $('#' + CandidatePlacements.MapKey).show();

        TriSysWebJobs.Mapping.MappingData.Draw(true);

        $('#' + CandidatePlacements.Menu_WithdrawApplication).addClass('disabled');
        $('#' + CandidatePlacements.Menu_SendToFriend).addClass('disabled');

        var sGridMenuDiv = TriSysApex.FormsManager.ContentDivPrefix + 'CandidatePlacements';
        var gridMenu = $('#' + sGridMenuDiv).find(CandidatePlacements.Menu_Grid_Class);
        if (gridMenu)
            gridMenu.addClass('disabled');
    },

    ShowInGrid: function ()
    {
        $('#' + CandidatePlacements.Menu_ShowOnMap).show();
        $('#' + CandidatePlacements.GridID).show();

        $('#' + CandidatePlacements.Menu_ShowInGrid).hide();
        $('#' + CandidatePlacements.MapID).hide();
        $('#' + CandidatePlacements.MapKey).hide();

        $('#' + CandidatePlacements.Menu_WithdrawApplication).removeClass('disabled');
        $('#' + CandidatePlacements.Menu_SendToFriend).removeClass('disabled');

        var sGridMenuDiv = TriSysApex.FormsManager.ContentDivPrefix + 'CandidatePlacements';
        var gridMenu = $('#' + sGridMenuDiv).find(CandidatePlacements.Menu_Grid_Class + '.disabled');
        if (gridMenu)
            gridMenu.removeClass('disabled');
    }
};

$(document).ready(function ()
{
    CandidatePlacements.Load();
});
