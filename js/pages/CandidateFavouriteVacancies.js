var CandidateFavouriteVacancies =
{
    GridID: 'divCandidateFavouriteVacanciesGrid',
    MapID: 'divCandidateFavouriteVacanciesMap',

    Menu_ShowOnMap: 'CandidateFavouriteVacancies-Menu-ShowOnMap',
    Menu_ShowInGrid: 'CandidateFavouriteVacancies-Menu-ShowInGrid',
    Menu_SendToFriend: 'CandidateFavouriteVacancies-Menu-SendToFriend',
    Menu_Apply: 'CandidateFavouriteVacancies-Menu-Apply',
    Menu_RemoveFromFavourites: 'CandidateFavouriteVacancies-Menu-RemoveFromFavourites',
    Menu_Grid: 'CandidateFavouriteVacancies-Menu-Grid',
    Menu_Grid_Class: '.btn.btn-sm.btn-default.dropdown-toggle.enable-tooltip',

    MapKey: 'CandidateFavouriteVacancies-MapKey',

    Load: function ()
    {
        $('#webjobs-customer-name').html(TriSysWebJobs.Agency.CustomerName);

        TriSysSDK.FormMenus.DrawGridMenu(CandidateFavouriteVacancies.Menu_Grid, CandidateFavouriteVacancies.GridID);

        // Load the search criteria which should then automatically display the vacancies               
        CandidateFavouriteVacancies.LoadFavourites();
    },

    // After loading the lookups, read persisted search criteria and do auto-search
    LoadFavourites: function ()
    {
        // Read cookie from last visit to this page
        var vacancies = TriSysAPI.Persistence.Read(TriSysWebJobs.Security.CookieName(TriSysWebJobs.Vacancies.FavouriteCookieName));

        // Jan 2018: Use a dedicated API method which abstracts the underlying SQL and does not use 'SQLDatabase/SQL_Select'
        var fnPopulationByFunction = {
            API: "Vacancy/Favourites",              // The Web API Controller/Function

            // The additional parameters passed into the function not including the paging metrics
            Parameters: function (CVacancyCandidateFavouritesRequest)
            {
                CVacancyCandidateFavouritesRequest.RequirementList = vacancies;

                CVacancyCandidateFavouritesRequest.SortColumnName = 'StartDate';
                CVacancyCandidateFavouritesRequest.SortAscending = true;
            },

            DataTableFunction: function (response)  // Called to get a suitable data table for the grid to display
            {
                // Begin populating map also in the background
                TriSysWebJobs.Mapping.PopulateVacanciesMap(response.Vacancies, CandidateFavouriteVacancies.MapID,
                                        CandidateFavouriteVacancies.Menu_ShowInGrid, CandidateFavouriteVacancies.ShowOnMap);

                return response.Vacancies;          // The list of records from the Web API
            }
        };

        CandidateFavouriteVacancies.PopulateVacanciesGrid(fnPopulationByFunction);        
    },

    // Show both vacancy search results, favourites and vacancy applications
    PopulateVacanciesGrid: function (fnPopulationByFunction)
    {
        // Populate the vacancy grid directly from the object
        TriSysWebJobs.Vacancies.PopulateGrid(CandidateFavouriteVacancies.GridID, fnPopulationByFunction, true);
    },

    Apply: function()
    {
        TriSysWebJobs.VacancyApplications.ApplyFromGrid(CandidateFavouriteVacancies.GridID);
    },

    RemoveFromFavourites: function ()
    {
        TriSysWebJobs.Vacancies.RemoveFromFavourites(CandidateFavouriteVacancies.GridID, CandidateFavouriteVacancies.LoadFavourites);
    },

    SendToFriend: function ()
    {
        TriSysWebJobs.Vacancies.SendToFriend(CandidateFavouriteVacancies.GridID);
    },

    ShowOnMap: function ()
    {
        $('#' + CandidateFavouriteVacancies.Menu_ShowOnMap).hide();
        $('#' + CandidateFavouriteVacancies.GridID).hide();

        $('#' + CandidateFavouriteVacancies.Menu_ShowInGrid).show();
        $('#' + CandidateFavouriteVacancies.MapID).show();
        $('#' + CandidateFavouriteVacancies.MapKey).show();
        TriSysWebJobs.Mapping.MappingData.Draw();

        $('#' + CandidateFavouriteVacancies.Menu_Apply).addClass('disabled');
        $('#' + CandidateFavouriteVacancies.Menu_RemoveFromFavourites).addClass('disabled');
        $('#' + CandidateFavouriteVacancies.Menu_SendToFriend).addClass('disabled');

        var sGridMenuDiv = TriSysApex.FormsManager.ContentDivPrefix + 'CandidateFavouriteVacancies';
        var gridMenu = $('#' + sGridMenuDiv).find(CandidateFavouriteVacancies.Menu_Grid_Class);
        if (gridMenu)
            gridMenu.addClass('disabled');
    },

    ShowInGrid: function ()
    {
        $('#' + CandidateFavouriteVacancies.Menu_ShowOnMap).show();
        $('#' + CandidateFavouriteVacancies.GridID).show();

        $('#' + CandidateFavouriteVacancies.Menu_ShowInGrid).hide();
        $('#' + CandidateFavouriteVacancies.MapID).hide();
        $('#' + CandidateFavouriteVacancies.MapKey).hide();

        $('#' + CandidateFavouriteVacancies.Menu_Apply).removeClass('disabled');
        $('#' + CandidateFavouriteVacancies.Menu_RemoveFromFavourites).removeClass('disabled');
        $('#' + CandidateFavouriteVacancies.Menu_SendToFriend).removeClass('disabled');

        var sGridMenuDiv = TriSysApex.FormsManager.ContentDivPrefix + 'CandidateFavouriteVacancies';
        var gridMenu = $('#' + sGridMenuDiv).find(CandidateFavouriteVacancies.Menu_Grid_Class + '.disabled');
        if (gridMenu)
            gridMenu.removeClass('disabled');
    }
};

$(document).ready(function ()
{
    CandidateFavouriteVacancies.Load();
});