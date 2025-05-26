var CandidateVacancySearch =
{
    ReferenceID: 'txtVacancySearchReference',
    JobTitleComboID: 'txtVacancySearchJobTitle',
    ContactTypeComboID: 'txtVacancySearchType',
    LocationComboID: 'txtVacancySearchLocation',
    CategoriesAttributesComboID: 'txtVacancySearchSkillCategories',
    FreeTextID: 'txtVacancySearchFreeText',
    MinimumSalaryRateID: 'txtVacancySearchMinimumSalaryRate',
    MaximumSalaryRateID: 'txtVacancySearchMaximumSalaryRate',
    StartDateID: 'dtVacancySearchStartDate',
    StartDateOperatorID: 'cmbVacancySearchStartDateOperator',
    DateOnOrAfter: 'On or after',
    DateOnOrBefore: 'On or before',

    CookieName: 'CandidateVacancySearch.SearchCriteria',

    GridID: 'divCandidateVacancySearchGrid',
    MapID: 'divCandidateVacancySearchMap',

    Menu_ShowOnMap: 'CandidateVacancySearch-Menu-ShowOnMap',
    Menu_ShowInGrid: 'CandidateVacancySearch-Menu-ShowInGrid',
    Menu_SendToFriend: 'CandidateVacancySearch-Menu-SendToFriend',
    Menu_Apply: 'CandidateVacancySearch-Menu-Apply',
    Menu_AddToFavourites: 'CandidateVacancySearch-Menu-AddToFavourites',
    Menu_Grid: 'CandidateVacancySearch-Menu-Grid',

    Menu_Grid_Class: '.btn.btn-sm.btn-default.dropdown-toggle.enable-tooltip',

    CategorySkillSeparator: ' > ',

    Mobile_Button_RemoveJobTitles: 'btnVacancySearchJobTitle',
    Mobile_Button_RemoveTypes: 'btnVacancySearchType',
    Mobile_Button_RemoveLocations: 'btnVacancySearchLocation',
    Mobile_Button_RemoveSkillCategories: 'btnVacancySearchSkillCategories',

    MapKey: 'CandidateVacancySearch-MapKey',


    // URL processing to allow correct order of custom app loading before execution
    LoadFromURL: function (sParameters)
    {
        CandidateVacancySearch.Load();
    },

    Load: function()
    {
        $('#webjobs-customer-name').html(TriSysWebJobs.Agency.CustomerName);

        // Set search fields
        TriSysSDK.CShowForm.contactTypeOfWorkField(CandidateVacancySearch.ContactTypeComboID);
        TriSysSDK.Controls.CurrencyAmountPeriod.PopulateCurrencyAmountPeriodWidget(CandidateVacancySearch.MinimumSalaryRateID, 1, "Annum");
        TriSysSDK.Controls.CurrencyAmountPeriod.PopulateCurrencyAmountPeriodWidget(CandidateVacancySearch.MaximumSalaryRateID, 1, "Annum");
        TriSysSDK.CShowForm.datePicker(CandidateVacancySearch.StartDateID);

        var sourceWhen = [
            { text: CandidateVacancySearch.DateOnOrAfter, value: 0 },
            { text: CandidateVacancySearch.DateOnOrBefore, value: 1 }
        ];

        TriSysSDK.CShowForm.populateComboFromDataSource(CandidateVacancySearch.StartDateOperatorID, sourceWhen, 0);

        var bPhone = TriSysApex.Device.isPhone();
        var bTablet = TriSysApex.Device.isTablet();

        // If on a mobile, hide grid menu
        if (!bPhone && !bTablet)
            TriSysSDK.FormMenus.DrawGridMenu(CandidateVacancySearch.Menu_Grid, CandidateVacancySearch.GridID);
        else
        {
            if (bPhone)
                $('#' + CandidateVacancySearch.Menu_Grid).hide();
        }

        if (TriSysApex.Device.isTouch())
        {
            // Compensate for the multi-select not working on phones
            $('#' + CandidateVacancySearch.Mobile_Button_RemoveJobTitles).show();
            $('#' + CandidateVacancySearch.Mobile_Button_RemoveTypes).show();
            $('#' + CandidateVacancySearch.Mobile_Button_RemoveLocations).show();
            $('#' + CandidateVacancySearch.Mobile_Button_RemoveSkillCategories).show();
        }

        // Load the search criteria which should then automatically display the vacancies               
        CandidateVacancySearch.LoadSearchCriteria();

        if (!TriSysWebJobs.Constants.CandidateVacancySearchPageHeaderVisible)
            $('#CandidateVacancySearchPageHeader').hide();

        // We may have custom styles
        TriSysWebJobs.Frame.ApplyDynamicFeaturesAndStyleAfterFormLoaded();

        // Capture enter key on keywords field
        $('#' + CandidateVacancySearch.FreeTextID).keyup(function (e)
        {
            if (e.keyCode == 13)
            {
                CandidateVacancySearch.Search();
            }
        });
    },

    // Search for live vacancies to display quickly on the page
    Search: function ()
    {
        TriSysApex.UI.ShowWait(null, "Searching...");

        // Read search criteria from screen
        var searchCriteria = {};
        searchCriteria.Reference = $('#' + CandidateVacancySearch.ReferenceID).val();
        searchCriteria.JobTitles = TriSysSDK.CShowForm.GetSelectedSkillsFromListAsArray(CandidateVacancySearch.JobTitleComboID);
        searchCriteria.Locations = TriSysSDK.CShowForm.GetSelectedSkillsFromListAsArray(CandidateVacancySearch.LocationComboID);
        searchCriteria.CategoriesAttributes = TriSysSDK.CShowForm.GetSelectedSkillsFromListAsArray(CandidateVacancySearch.CategoriesAttributesComboID);
        searchCriteria.FreeText = $('#' + CandidateVacancySearch.FreeTextID).val();
        searchCriteria.Types = TriSysSDK.CShowForm.GetSelectedSkillsFromList(CandidateVacancySearch.ContactTypeComboID);
        searchCriteria.MinSalaryRate = TriSysSDK.Controls.CurrencyAmountPeriod.GetCurrencyAmountPeriod(CandidateVacancySearch.MinimumSalaryRateID);
        searchCriteria.MaxSalaryRate = TriSysSDK.Controls.CurrencyAmountPeriod.GetCurrencyAmountPeriod(CandidateVacancySearch.MaximumSalaryRateID);
        searchCriteria.StartDateOperator = TriSysSDK.CShowForm.GetTextFromCombo(CandidateVacancySearch.StartDateOperatorID);
        searchCriteria.StartDate = TriSysSDK.CShowForm.getDatePickerValue(CandidateVacancySearch.StartDateID);

        // Persist for next visit to this page
        TriSysAPI.Persistence.Write(TriSysWebJobs.Security.CookieName(CandidateVacancySearch.CookieName), searchCriteria);

        // Manipulate search criteria to fit API
        if (!searchCriteria.Reference)
            searchCriteria.Reference = '%';
        else
            searchCriteria.Reference = '%' + searchCriteria.Reference + '%';

        if (searchCriteria.StartDate)
            searchCriteria.StartDate = moment(searchCriteria.StartDate).format("YYYY-MM-DD");

        var bOnOrAfter = (searchCriteria.StartDateOperator == CandidateVacancySearch.DateOnOrAfter);
        var bPermanent = true, bContract = true, bTemp = true;
        if (searchCriteria.Types)
        {
            bPermanent = (searchCriteria.Types.indexOf('Perm') >= 0);
            bContract = (searchCriteria.Types.indexOf('Contract') >= 0);
            bTemp = (searchCriteria.Types.indexOf('Temp') >= 0);
        }

        var lstSkillCategories = null;
        if (searchCriteria.CategoriesAttributes)
        {
            var sCurrentCategory = null;
            for (var i = 0; i < searchCriteria.CategoriesAttributes.length; i++)
            {
                var sCategorySkill = searchCriteria.CategoriesAttributes[i];
                var iOurSeparator = sCategorySkill.indexOf(CandidateVacancySearch.CategorySkillSeparator);
                if (iOurSeparator > 0)
                {
                    var sCategory = sCategorySkill.substring(0, iOurSeparator);
                    var sSkill = sCategorySkill.substring(iOurSeparator + CandidateVacancySearch.CategorySkillSeparator.length);

                    if (!lstSkillCategories)
                        lstSkillCategories = [];

                    var skillCategory = null;
                    if (sCurrentCategory != sCategory)
                    {
                        skillCategory = { Category: sCategory, Skills: [sSkill] };
                        lstSkillCategories.push(skillCategory);
                        sCurrentCategory = sCategory;
                    }
                    else
                    {
                        skillCategory = lstSkillCategories[lstSkillCategories.length - 1];
                        skillCategory.Skills.push(sSkill);
                    }
                }
                else
                {
                    var bManeGroup = (TriSysWebJobs.Agency.CustomerID.toLowerCase() == 'Mane-Group'.toLowerCase());
                    if(bManeGroup)
                    {
                        var sCategory = "Advertising Industry";
                        if (!lstSkillCategories)
                        {
                            lstSkillCategories = [{ Category: sCategory, Skills: [sCategorySkill] }];
                        }
                        else
                            lstSkillCategories[0].Skills.push(sCategorySkill);
                    }
                }
            }
        }
                    

        // New - paged API function
        // Jan 2018: Use a dedicated API method which abstracts the underlying SQL and does not use 'SQLDatabase/SQL_Select'
        var fnPopulationByFunction = {
            API: "Vacancies/Search",                // The Web API Controller/Function

            // The additional parameters passed into the function not including the paging metrics
            Parameters: function (CVacancySearchCriteria)
            {
                CVacancySearchCriteria.Reference = searchCriteria.Reference;
                CVacancySearchCriteria.Status = 'Active';

                // Singletons
                //Location: sLocations,
                //JobTitle: sJobTitles,

                // Multiple
                CVacancySearchCriteria.Locations = searchCriteria.Locations;
                CVacancySearchCriteria.JobTitles = searchCriteria.JobTitles;

                CVacancySearchCriteria.Permanent = bPermanent;
                CVacancySearchCriteria.Contract = bContract;
                CVacancySearchCriteria.Temp = bTemp;
				CVacancySearchCriteria.Types = searchCriteria.Types;

                CVacancySearchCriteria.StartDate = searchCriteria.StartDate;
                CVacancySearchCriteria.StartDateOnOrAfter = bOnOrAfter;

                CVacancySearchCriteria.SalaryRateMinimum = searchCriteria.MinSalaryRate;
                CVacancySearchCriteria.SalaryRateMaximum = searchCriteria.MaxSalaryRate;

                CVacancySearchCriteria.SortColumnName = 'StartDate';
                CVacancySearchCriteria.SortAscending = false;           // Was true until 08 Mar 2021
        
                CVacancySearchCriteria.SkillCategories = lstSkillCategories;
                CVacancySearchCriteria.FreeText = searchCriteria.FreeText;
            },

            DataTableFunction: function (response)  // Called to get a suitable data table for the grid to display
            {
                TriSysApex.UI.HideWait();

                // Begin populating map also in the background
                TriSysWebJobs.Mapping.PopulateVacanciesMap(response.Vacancies, CandidateVacancySearch.MapID,
                                                CandidateVacancySearch.Menu_ShowInGrid, CandidateVacancySearch.ShowOnMap);

                // Return the list of vacancies
                return response.Vacancies;          // The list of records from the Web API
            }
        };

        CandidateVacancySearch.PopulateVacanciesGrid(fnPopulationByFunction);        
    },

    // Show both vacancy search results, favourites and vacancy applications
    PopulateVacanciesGrid: function (fnPopulationByFunction)
    {
        // Populate the vacancy grid directly from either the SQL statement or the array of vacancies
        // This is because we have identified a cached dataset which is must quicker than the SQL method for on-premise databases
        TriSysWebJobs.Vacancies.PopulateGrid(CandidateVacancySearch.GridID, fnPopulationByFunction);
    },

    // Gather lookups for live jobs so that user many refine their job search
    LoadSearchCriteria: function ()
    {
        var CVacancySearchLookupsRequest = { LiveOnly: true };

        var payloadObject = {};

        payloadObject.URL = 'Vacancies/Lookups';
        payloadObject.OutboundDataPacket = CVacancySearchLookupsRequest;
        payloadObject.InboundDataFunction = function (CVacancySearchLookupsResponse)
        {
            // Populate the location and job title combos
            var locations = [], jobTitles = [], categoriesAttributes = [];

            if (CVacancySearchLookupsResponse.JobTitles)
            {
                for (var i = 0; i < CVacancySearchLookupsResponse.JobTitles.length; i++)
                {
                    var sJobTitle = CVacancySearchLookupsResponse.JobTitles[i];
                    if (sJobTitle && sJobTitle.length > 1)
                        jobTitles.push({ text: sJobTitle, value: sJobTitle });
                }
            }
            TriSysSDK.CShowForm.populateMultiSelectComboFromDataSource(CandidateVacancySearch.JobTitleComboID, jobTitles);

            if (CVacancySearchLookupsResponse.Locations)
            {
                for (var i = 0; i < CVacancySearchLookupsResponse.Locations.length; i++)
                {
                    var sLocation = CVacancySearchLookupsResponse.Locations[i];
                    if (sLocation && sLocation.length > 1)
                        locations.push({ text: sLocation, value: sLocation });
                }
            }
            TriSysSDK.CShowForm.populateMultiSelectComboFromDataSource(CandidateVacancySearch.LocationComboID, locations);

            if (CVacancySearchLookupsResponse.SkillCategories)
            {
                for (var i = 0; i < CVacancySearchLookupsResponse.SkillCategories.length; i++)
                {
                    var skillCategory = CVacancySearchLookupsResponse.SkillCategories[i];
                    for (var iSkill = 0; iSkill < skillCategory.Skills.length; iSkill++)
                    {
                        var sSkill = skillCategory.Skills[iSkill];
                        var sCategoryAttribute = skillCategory.Category + CandidateVacancySearch.CategorySkillSeparator + sSkill;

                        var bManeGroup = (TriSysWebJobs.Agency.CustomerID.toLowerCase() == 'Mane-Group'.toLowerCase());
                        if (bManeGroup)
                        {
                            if (skillCategory.Category != "Advertising Industry")
                                sCategoryAttribute = null;
                            else
                                sCategoryAttribute = sSkill;
                        }

                        if (sCategoryAttribute)
                            categoriesAttributes.push({ text: sCategoryAttribute, value: sCategoryAttribute });
                    }
                }
            }
            TriSysSDK.CShowForm.populateMultiSelectComboFromDataSource(CandidateVacancySearch.CategoriesAttributesComboID, categoriesAttributes);

            // Hide waiting block and show search criteria
            $('#CandidateVacancySearchLoadBlock').hide();
            $('#CandidateVacancySearchCriteriaBlock').show();
            $('#CandidateVacancySearchGridBlock').show();

            // After loading the lookups, read persisted search criteria and do auto-search
            CandidateVacancySearch.AfterLoadingWebAPILookups();

            return true;
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            // Probably missing data services key
            console.log('CandidateVacancySearch.LoadSearchCriteria: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    // After loading the lookups, read persisted search criteria and do auto-search
    AfterLoadingWebAPILookups: function ()
    {
        // Read cookie from last visit to this page
        var searchCriteria = TriSysAPI.Persistence.Read(TriSysWebJobs.Security.CookieName(CandidateVacancySearch.CookieName));
        if (searchCriteria)
        {
            // Write search criteria to fields
            $('#' + CandidateVacancySearch.ReferenceID).val(searchCriteria.Reference);
            $('#' + CandidateVacancySearch.FreeTextID).val(searchCriteria.FreeText);

            TriSysSDK.CShowForm.SetValuesArrayInList(CandidateVacancySearch.JobTitleComboID, searchCriteria.JobTitles);
            TriSysSDK.CShowForm.SetSkillsInList(CandidateVacancySearch.ContactTypeComboID, searchCriteria.Types);
            TriSysSDK.CShowForm.SetValuesArrayInList(CandidateVacancySearch.LocationComboID, searchCriteria.Locations);

            TriSysSDK.CShowForm.SetValueInCombo(CandidateVacancySearch.StartDateOperatorID, searchCriteria.StartDateOperator);
            TriSysSDK.CShowForm.setDatePickerValue(CandidateVacancySearch.StartDateID, searchCriteria.StartDate);
            TriSysSDK.Controls.CurrencyAmountPeriod.SetCurrencyAmountPeriod(CandidateVacancySearch.MinimumSalaryRateID, searchCriteria.MinSalaryRate);
            TriSysSDK.Controls.CurrencyAmountPeriod.SetCurrencyAmountPeriod(CandidateVacancySearch.MaximumSalaryRateID, searchCriteria.MaxSalaryRate);

            TriSysSDK.CShowForm.SetValuesArrayInList(CandidateVacancySearch.CategoriesAttributesComboID, searchCriteria.CategoriesAttributes);
        }

        // Now we can search using the last criteria we used
        CandidateVacancySearch.Search();
    },

    Apply: function()
    {
        TriSysWebJobs.VacancyApplications.ApplyFromGrid(CandidateVacancySearch.GridID);
    },

    AddToFavourites: function()
    {
        TriSysWebJobs.Vacancies.AddToFavourites(CandidateVacancySearch.GridID, TriSysWebJobs.Vacancies.AfterAddToFavourite);
    },

    SendToFriend: function()
    {
        TriSysWebJobs.Vacancies.SendToFriend(CandidateVacancySearch.GridID);
    },

    ShowOnMap: function()
    {
        $('#' + CandidateVacancySearch.Menu_ShowOnMap).hide();
        $('#' + CandidateVacancySearch.GridID).hide();

        $('#' + CandidateVacancySearch.Menu_ShowInGrid).show();
        $('#' + CandidateVacancySearch.MapID).show();
        $('#' + CandidateVacancySearch.MapKey).show();
        TriSysWebJobs.Mapping.MappingData.Draw();

        $('#' + CandidateVacancySearch.Menu_Apply).addClass('disabled');
        $('#' + CandidateVacancySearch.Menu_AddToFavourites).addClass('disabled');
        $('#' + CandidateVacancySearch.Menu_SendToFriend).addClass('disabled');

        //$('#' + CandidateVacancySearch.Menu_Grid).addClass('disabled');
        var sGridMenuDiv = TriSysApex.FormsManager.ContentDivPrefix + 'CandidateVacancySearch';
        var gridMenu = $('#' + sGridMenuDiv).find(CandidateVacancySearch.Menu_Grid_Class);
        if (gridMenu)
            gridMenu.addClass('disabled');
    },

    ShowInGrid: function()
    {
        $('#' + CandidateVacancySearch.Menu_ShowOnMap).show();
        $('#' + CandidateVacancySearch.GridID).show();

        $('#' + CandidateVacancySearch.Menu_ShowInGrid).hide();
        $('#' + CandidateVacancySearch.MapID).hide();
        $('#' + CandidateVacancySearch.MapKey).hide();

        $('#' + CandidateVacancySearch.Menu_Apply).removeClass('disabled');
        $('#' + CandidateVacancySearch.Menu_AddToFavourites).removeClass('disabled');
        $('#' + CandidateVacancySearch.Menu_SendToFriend).removeClass('disabled');

        //$('#' + CandidateVacancySearch.Menu_Grid).removeClass('disabled');
        var sGridMenuDiv = TriSysApex.FormsManager.ContentDivPrefix + 'CandidateVacancySearch';
        var gridMenu = $('#' + sGridMenuDiv).find(CandidateVacancySearch.Menu_Grid_Class + '.disabled');
        if (gridMenu)
            gridMenu.removeClass('disabled');
    },

    // Mobile compensation
    RemoveAllJobTitles: function()
    {
        TriSysSDK.CShowForm.SetValuesArrayInList(CandidateVacancySearch.JobTitleComboID, '');
    },

    RemoveAllTypes: function()
    {
        TriSysSDK.CShowForm.SetValuesArrayInList(CandidateVacancySearch.ContactTypeComboID, '');
    },

    RemoveAllLocations: function()
    {
        TriSysSDK.CShowForm.SetValuesArrayInList(CandidateVacancySearch.LocationComboID, '');
    },

    RemoveAllSkillCategories: function()
    {
        TriSysSDK.CShowForm.SetValuesArrayInList(CandidateVacancySearch.CategoriesAttributesComboID, '');
    }
};

$(document).ready(function ()
{
    // 04 Mar 2017 - wait for LoadFromURL event
    //CandidateVacancySearch.Load();
});