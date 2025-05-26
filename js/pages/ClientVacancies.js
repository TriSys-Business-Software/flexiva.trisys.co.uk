var ClientVacancies =
{
    GridID: 'divClientVacanciesGrid',
    MapID: 'divClientVacanciesMap',

    Menu_ShowOnMap: 'ClientVacancies-Menu-ShowOnMap',
    Menu_ShowInGrid: 'ClientVacancies-Menu-ShowInGrid',
    Menu_Grid: 'ClientVacancies-Menu-Grid',

    Menu_Grid_Class: '.btn.btn-sm.btn-default.dropdown-toggle.enable-tooltip',

    MapKey: 'ClientVacancies-MapKey',

    Load: function ()
    {
        $('#webjobs-customer-name').html(TriSysWebJobs.Agency.CustomerName);

        TriSysSDK.FormMenus.DrawGridMenu(ClientVacancies.Menu_Grid, ClientVacancies.GridID);

        ClientVacancies.Search();
    },

    Search: function ()
    {
        // Jan 2018: Use a dedicated API method which abstracts the underlying SQL and does not use 'SQLDatabase/SQL_Select'
        var fnPopulationByFunction = {
            API: "Vacancies/Search",                // The Web API Controller/Function

            // The additional parameters passed into the function not including the paging metrics
            Parameters: function (CVacancySearchCriteria)
            {
                CVacancySearchCriteria.Status = 'Active';

				CVacancySearchCriteria.ClientVacanciesOnly = true;
				CVacancySearchCriteria.IgnoreCache = true

                CVacancySearchCriteria.SortColumnName = 'StartDate';
                CVacancySearchCriteria.SortAscending = true;
            },

            DataTableFunction: function (response)  // Called to get a suitable data table for the grid to display
            {
                TriSysApex.UI.HideWait();

                // Begin populating map also in the background
                TriSysWebJobs.Mapping.PopulateVacanciesMap(response.Vacancies, ClientVacancies.MapID,
                                        ClientVacancies.Menu_ShowInGrid, ClientVacancies.ShowOnMap);

                return response.Vacancies;          // The list of records from the Web API
            }
        };

        ClientVacancies.PopulateVacanciesGrid(fnPopulationByFunction);
    },

    // Show both vacancy search results, favourites and vacancy applications
    PopulateVacanciesGrid: function (fnPopulationByFunction)
    {
        // Populate the vacancy grid directly from the object
        var bDateFavourited = false, bApplicationFields = false, bClientDrillDown = true;
        TriSysWebJobs.Vacancies.PopulateGrid(ClientVacancies.GridID, fnPopulationByFunction, bDateFavourited, bApplicationFields, bClientDrillDown);
    },

    ShowOnMap: function ()
    {
        $('#' + ClientVacancies.Menu_ShowOnMap).hide();
        $('#' + ClientVacancies.GridID).hide();

        $('#' + ClientVacancies.Menu_ShowInGrid).show();
        $('#' + ClientVacancies.MapID).show();
        $('#' + ClientVacancies.MapKey).show();
        TriSysWebJobs.Mapping.MappingData.Draw(null, null, true);

        $('#' + ClientVacancies.Menu_Apply).addClass('disabled');
        $('#' + ClientVacancies.Menu_AddToFavourites).addClass('disabled');
        $('#' + ClientVacancies.Menu_SendToFriend).addClass('disabled');

        //$('#' + ClientVacancies.Menu_Grid).addClass('disabled');
        var sGridMenuDiv = TriSysApex.FormsManager.ContentDivPrefix + 'ClientVacancies';
        var gridMenu = $('#' + sGridMenuDiv).find(ClientVacancies.Menu_Grid_Class);
        if (gridMenu)
            gridMenu.addClass('disabled');
    },

    ShowInGrid: function ()
    {
        $('#' + ClientVacancies.Menu_ShowOnMap).show();
        $('#' + ClientVacancies.GridID).show();

        $('#' + ClientVacancies.Menu_ShowInGrid).hide();
        $('#' + ClientVacancies.MapID).hide();
        $('#' + ClientVacancies.MapKey).hide();

        $('#' + ClientVacancies.Menu_Apply).removeClass('disabled');
        $('#' + ClientVacancies.Menu_AddToFavourites).removeClass('disabled');
        $('#' + ClientVacancies.Menu_SendToFriend).removeClass('disabled');

        //$('#' + ClientVacancies.Menu_Grid).removeClass('disabled');
        var sGridMenuDiv = TriSysApex.FormsManager.ContentDivPrefix + 'ClientVacancies';
        var gridMenu = $('#' + sGridMenuDiv).find(ClientVacancies.Menu_Grid_Class + '.disabled');
        if (gridMenu)
            gridMenu.removeClass('disabled');
    }
};

$(document).ready(function ()
{
    ClientVacancies.Load();
});