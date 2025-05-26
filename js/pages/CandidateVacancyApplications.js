var CandidateVacancyApplications =
{
    GridID: 'divCandidateVacancyApplicationsGrid',
    MapID: 'divCandidateVacancyApplicationsMap',

    Menu_ShowOnMap: 'CandidateVacancyApplications-Menu-ShowOnMap',
    Menu_ShowInGrid: 'CandidateVacancyApplications-Menu-ShowInGrid',
    Menu_SendToFriend: 'CandidateVacancyApplications-Menu-SendToFriend',
    Menu_WithdrawApplication: 'CandidateVacancyApplications-Menu-WithdrawApplication',
    Menu_Grid: 'CandidateVacancyApplications-Menu-Grid',
    Menu_Grid_Class: '.btn.btn-sm.btn-default.dropdown-toggle.enable-tooltip',

    Load: function ()
    {
        $('#webjobs-customer-name').html(TriSysWebJobs.Agency.CustomerName);

        TriSysSDK.FormMenus.DrawGridMenu(CandidateVacancyApplications.Menu_Grid, CandidateVacancyApplications.GridID);

        CandidateVacancyApplications.LoadApplications();

        // We may have custom styles
        TriSysWebJobs.Frame.ApplyDynamicFeaturesAndStyleAfterFormLoaded();
    },

    LoadApplications: function ()
    {
        // Jan 2018: Use a dedicated API method which abstracts the underlying SQL and does not use 'SQLDatabase/SQL_Select'
        var fnPopulationByFunction = {
            API: "Vacancy/Applications",                // The Web API Controller/Function
            
            DataTableFunction: function (response)      // Called to get a suitable data table for the grid to display
            {
                // Begin populating map also in the background
                TriSysWebJobs.Mapping.PopulateVacanciesMap(response.Vacancies, CandidateVacancyApplications.MapID,
                                        CandidateVacancyApplications.Menu_ShowInGrid, CandidateVacancyApplications.ShowOnMap);

                return response.Vacancies;              // The list of records from the Web API
            }
        };

        CandidateVacancyApplications.PopulateVacanciesGrid(fnPopulationByFunction);
    },

    // Show both vacancy search results, favourites and vacancy applications
    PopulateVacanciesGrid: function (fnPopulationByFunction)
    {
        // Populate the vacancy grid directly from the object
        TriSysWebJobs.Vacancies.PopulateGrid(CandidateVacancyApplications.GridID, fnPopulationByFunction, false, true);
    },

    WithdrawApplication: function ()
    {
        TriSysWebJobs.VacancyApplications.WithdrawFromGrid(CandidateVacancyApplications.GridID);
    },

    SendToFriend: function ()
    {
        TriSysWebJobs.Vacancies.SendToFriend(CandidateVacancyApplications.GridID);
    },

    ShowOnMap: function ()
    {
        $('#' + CandidateVacancyApplications.Menu_ShowOnMap).hide();
        $('#' + CandidateVacancyApplications.GridID).hide();

        $('#' + CandidateVacancyApplications.Menu_ShowInGrid).show();
        $('#' + CandidateVacancyApplications.MapID).show();
        TriSysWebJobs.Mapping.MappingData.Draw();

        $('#' + CandidateVacancyApplications.Menu_WithdrawApplication).addClass('disabled');
        $('#' + CandidateVacancyApplications.Menu_SendToFriend).addClass('disabled');

        var sGridMenuDiv = TriSysApex.FormsManager.ContentDivPrefix + 'CandidateVacancyApplications';
        var gridMenu = $('#' + sGridMenuDiv).find(CandidateVacancyApplications.Menu_Grid_Class);
        if (gridMenu)
            gridMenu.addClass('disabled');
    },

    ShowInGrid: function ()
    {
        $('#' + CandidateVacancyApplications.Menu_ShowOnMap).show();
        $('#' + CandidateVacancyApplications.GridID).show();

        $('#' + CandidateVacancyApplications.Menu_ShowInGrid).hide();
        $('#' + CandidateVacancyApplications.MapID).hide();

        $('#' + CandidateVacancyApplications.Menu_WithdrawApplication).removeClass('disabled');
        $('#' + CandidateVacancyApplications.Menu_SendToFriend).removeClass('disabled');

        var sGridMenuDiv = TriSysApex.FormsManager.ContentDivPrefix + 'CandidateVacancyApplications';
        var gridMenu = $('#' + sGridMenuDiv).find(CandidateVacancyApplications.Menu_Grid_Class + '.disabled');
        if (gridMenu)
            gridMenu.removeClass('disabled');
    }
};

$(document).ready(function ()
{
    CandidateVacancyApplications.Load();
});