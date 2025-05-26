var ctrlEntitySearch =
{
    Load: function (sEntityName)
    {
        var sForm = TriSysApex.FormsManager.ContentDivPrefix + sEntityName + "Search";
        var sSuffix = '-' + sEntityName;

        // Rename all our controls
        TriSysSDK.Controls.General.RenameElementIdsWithParentIdPrefixOrSuffix(sForm, sEntityName, false);

        // Add event handlers for the entity specific controls
        $('#ctrlEntitySearch-tab-searches' + sSuffix).off().on('click', function ()
        {
			TriSysSDK.EntityFormTabs.TabContainerClickEvent($(this), 'ctrlEntitySearch-tab-panel-searches' + sSuffix, ctrlEntitySearch.TabClickEvent);
        });
		$('#ctrlEntitySearch-tab-search' + sSuffix).off().on('click', function ()
		{
            TriSysSDK.EntityFormTabs.TabContainerClickEvent($(this), 'ctrlEntitySearch-tab-panel-search' + sSuffix, ctrlEntitySearch.TabClickEvent);
        });
		$('#ctrlEntitySearch-tab-favourites' + sSuffix).off().on('click', function ()
        {
			TriSysSDK.EntityFormTabs.TabContainerClickEvent($(this), 'ctrlEntitySearch-tab-panel-favourites' + sSuffix, ctrlEntitySearch.TabClickEvent);
        });
		$('#ctrlEntitySearch-tab-excluded' + sSuffix).off().on('click', function () {
		    TriSysSDK.EntityFormTabs.TabContainerClickEvent($(this), 'ctrlEntitySearch-tab-panel-excluded' + sSuffix, ctrlEntitySearch.TabClickEvent);
		});


        // Tabs
        TriSysSDK.EntityFormTabs.AddClickEventHandlers('ctrlEntitySearch-tab-nav-horizontal' + sSuffix, true);		

        // Add a callback to this multi-select combo for when the user is changed
        var fnChangeUsers = function ()
        {
            ctrlEntitySearch.LoadSearches(sEntityName);
        };

        // Users
        var userCredentials = TriSysApex.LoginCredentials.UserCredentials();
        var sUserName = userCredentials.LoggedInUser.ForenameAndSurname;
        var sUserComboId = 'ctrlEntitySearch-Users' + sSuffix;
        TriSysSDK.CShowForm.MultiUserCombo(sUserComboId, fnChangeUsers);
        TriSysSDK.CShowForm.SetSkillsInList(sUserComboId, sUserName);

		TriSysSDK.Controls.Button.Click('ctrlEntitySearch-form-tab-searches' + sSuffix);	

        // Grids
		$('#ctrlEntitySearch-add-search-button' + sSuffix).off().on('click', function ()
        {
            ctrlEntitySearch.AddNewSearch(sEntityName);
        });
		$('#ctrlEntitySearch-clone-search-button' + sSuffix).off().on('click', function ()
        {
            ctrlEntitySearch.CloneSearch(sEntityName);
        });
		$('#ctrlEntitySearch-edit-search-button' + sSuffix).off().on('click', function ()
        {
            ctrlEntitySearch.OpenSearchForEdit(sEntityName);
        });
		$('#ctrlEntitySearch-delete-search-button' + sSuffix).off().on('click', function ()
        {
            ctrlEntitySearch.DeleteSearch(sEntityName);
        });

        var sGrid = 'ctrlEntitySearch-searches-grid' + sSuffix;
        TriSysSDK.FormMenus.DrawGridMenu('ctrlEntitySearch-searches-GridMenu' + sSuffix, sGrid);

        // Garry - stupid old git!
		// When you added the fnFocusOnFirstTab above, you effectively called the grid population, hence this is not required
        //ctrlEntitySearch.LoadSearches(sEntityName);

        var sSelectecCounterSpan = ' <span id="ctrlEntitySearch-form-grid-selected-counter"></span>';
        var sSearchResultsGridCaption = 'ctrlEntitySearch-search-grid-caption' + sSuffix;
        $('#' + sSearchResultsGridCaption).html("<strong>" + sEntityName + "</strong> Search Results" + sSelectecCounterSpan);

		$('#ctrlEntitySearch-open-search-result-button' + sSuffix).off().on('click', function ()
        {
            ctrlEntitySearch.OpenSearchResult(sEntityName);
        });
		$('#ctrlEntitySearch-add-search-result-button' + sSuffix).off().on('click', function ()
        {
            ctrlEntitySearch.AddSearchResultToFavourites(sEntityName);
        });
		$('#ctrlEntitySearch-exclude-search-result-button' + sSuffix).off().on('click', function () {
		    ctrlEntitySearch.AddSearchResultToExcluded(sEntityName);
		});

        var sSearchResultsGrid = 'ctrlEntitySearch-search-grid' + sSuffix;
        TriSysSDK.FormMenus.DrawGridMenu('ctrlEntitySearch-search-GridMenu' + sSuffix, sSearchResultsGrid);

        if (sEntityName == "Task")
        {
            // No task actions so hide from DOM
            $('#ctrlEntitySearch-search-ActionsMenu' + sSuffix).hide();
            $('#ctrlEntitySearch-favourites-ActionsMenu' + sSuffix).hide();
            $('#ctrlEntitySearch-add-search-result-button' + sSuffix).hide();
            $('#ctrlEntitySearch-form-tab-favourites' + sSuffix).hide();
            $('#ctrlEntitySearch-form-tab-excluded' + sSuffix).hide();
        }
        else
        {
            ctrlEntitySearch.DrawActionsDropDown(sEntityName, 'ctrlEntitySearch-search-ActionsMenu' + sSuffix);
            ctrlEntitySearch.DrawActionsDropDown(sEntityName, 'ctrlEntitySearch-favourites-ActionsMenu' + sSuffix);
            ctrlEntitySearch.DrawActionsDropDown(sEntityName, 'ctrlEntitySearch-excluded-ActionsMenu' + sSuffix);

            // 22 Nov 2024: Actions menus should allow more height to show all options without scrolling
            const fnResizeActionsMenus = function ()
            {
                const lstActionsMenus = ['ctrlEntitySearch-search-ActionsMenu' + sSuffix, 'ctrlEntitySearch-favourites-ActionsMenu' + sSuffix,
                                        'ctrlEntitySearch-excluded-ActionsMenu' + sSuffix];
                lstActionsMenus.forEach(function (sMenuID)
                {
                    try
                    {
                        var iHeightFactor = $('#ctrlEntitySearch-search-grid-container' + sSuffix).position().top + 120;
                        $('#' + sMenuID + ' .dropdown-menu.dropdown-custom > li').css('max-height', ($(window).height() - iHeightFactor) + 'px');
                    }
					catch (e) { }
                });
            };
            setTimeout(fnResizeActionsMenus, 2000);      
        }

        // Favourites
		$('#ctrlEntitySearch-open-favourites-button' + sSuffix).off().on('click', function ()
        {
            ctrlEntitySearch.OpenFavourite(sEntityName);
        });
		$('#ctrlEntitySearch-add-favourites-button' + sSuffix).off().on('click', function ()
        {
            ctrlEntitySearch.AddToFavourites(sEntityName);
        });
		$('#ctrlEntitySearch-remove-favourites-button' + sSuffix).off().on('click', function ()
        {
            ctrlEntitySearch.RemoveFromFavourites(sEntityName);
		});

		var sFavouritesGrid = 'ctrlEntitySearch-favourites-grid' + sSuffix;
		$('#ctrlEntitySearch-add-exclude-button' + sSuffix).off().on('click', function ()
		{
		    ctrlEntitySearch.AddSelectedGridRowsToExcluded(sEntityName, sFavouritesGrid);

		    // Must also refresh favourites grid
		    ctrlEntitySearch.LoadFavourites(ctrlEntitySearch.EntitySearchId, sEntityName);
		});

        TriSysSDK.FormMenus.DrawGridMenu('ctrlEntitySearch-favourites-GridMenu' + sSuffix, sFavouritesGrid);

		$('#ctrlEntitySearch-exportToExcel-button' + sSuffix).off().on('click', function ()
        {
            TriSysSDK.Grid.ExportToExcel('ctrlEntitySearch-search-grid' + sSuffix);
        });

        // Added 11 Aug 2023
		$('#ctrlEntitySearch-exportToExcel-favourites-button' + sSuffix).off().on('click', function () {
		    TriSysSDK.Grid.ExportToExcel('ctrlEntitySearch-favourites-grid' + sSuffix);
		});

        // Excluded 19 Aug 2022
		$('#ctrlEntitySearch-open-excluded-button' + sSuffix).off().on('click', function () {
		    ctrlEntitySearch.OpenExcluded(sEntityName);
		});
		$('#ctrlEntitySearch-add-excluded-button' + sSuffix).off().on('click', function () {
		    ctrlEntitySearch.AddToExcluded(sEntityName);
		});
		$('#ctrlEntitySearch-remove-excluded-button' + sSuffix).off().on('click', function () {
		    ctrlEntitySearch.RemoveFromExcluded(sEntityName);
		});

		var sExcludedGrid = 'ctrlEntitySearch-excluded-grid' + sSuffix;
		TriSysSDK.FormMenus.DrawGridMenu('ctrlEntitySearch-excluded-GridMenu' + sSuffix, sExcludedGrid);
    },
    
    TabClickEvent: function (sTabID)
    {
        // Dynamically load grids and re-run searches as desired
        var sEntityName = null;

        var parts = sTabID.split('ctrlEntitySearch-tab-panel-searches-');
        if (parts && parts.length == 2)
        {
            // This is the searches grid tab - reload the search each time
            sEntityName = parts[1];
            ctrlEntitySearch.LoadSearches(sEntityName);
            return;
        }

        parts = sTabID.split('ctrlEntitySearch-tab-panel-search-');
        if (parts && parts.length == 2)
        {
            // This is the search tab
            sEntityName = parts[1];
            if (ctrlEntitySearch.EntitySearchId == 0)
            {
                // User not allowed to create a search without an entity search record
                TriSysApex.UI.ShowMessage("Please create or select a search record before commencing the search process.");
                var sSuffix = '-' + sEntityName;
				TriSysSDK.Controls.Button.Click('ctrlEntitySearch-form-tab-searches' + sSuffix);
                return;
            }

            // 15 Oct 2020 Turn off
            //ctrlEntitySearch.LoadSearch(ctrlEntitySearch.EntitySearchId, sEntityName);
            return;
        }

        // Favourites
        parts = sTabID.split('ctrlEntitySearch-tab-panel-favourites-');
        if (parts && parts.length == 2)
        {
            // This is the favourites tab
            sEntityName = parts[1];
            if (ctrlEntitySearch.EntitySearchId == 0)
            {
                // User not allowed to view favourites without an entity search record
                TriSysApex.UI.ShowMessage("Please create or select a search record before viewing favourites.");
                var sSuffix = '-' + sEntityName;
				TriSysSDK.Controls.Button.Click('ctrlEntitySearch-form-tab-searches' + sSuffix);
                return;
            }
            ctrlEntitySearch.LoadFavourites(ctrlEntitySearch.EntitySearchId, sEntityName);
            return;
        }

        // Excluded. Added 19 Aug 2022
        parts = sTabID.split('ctrlEntitySearch-tab-panel-excluded-');
        if (parts && parts.length == 2) {
            // This is the excluded tab
            sEntityName = parts[1];
            if (ctrlEntitySearch.EntitySearchId == 0) {
                // User not allowed to view excluded without an entity search record
                TriSysApex.UI.ShowMessage("Please create or select a search record before viewing excluded.");
                var sSuffix = '-' + sEntityName;
                TriSysSDK.Controls.Button.Click('ctrlEntitySearch-form-tab-searches' + sSuffix);
                return;
            }
            ctrlEntitySearch.LoadExcluded(ctrlEntitySearch.EntitySearchId, sEntityName);
            return;
        }
    },

    AddNewSearch: function (sEntityName)
    {
        ctrlEntitySearch.EditSearch(0, sEntityName);
    },

    CloneSearch: function (sEntityName)
    {
        var lApexEntitySearchId = ctrlEntitySearch.GetSingletonApexEntitySearchId(sEntityName);
        if (lApexEntitySearchId > 0)
        {
            // Call Web API to clone the selected search
            var CCloneApexEntitySearchRequest = {
                ApexEntitySearchId: lApexEntitySearchId,
                ControlIdPrefix: 'search-criteria-tree-ctrlEntitySearch-lookup-criteria-' + sEntityName + '-id-'
            };

            var payloadObject = {};

            payloadObject.URL = "EntitySearch/Clone";

            payloadObject.OutboundDataPacket = CCloneApexEntitySearchRequest;

            payloadObject.InboundDataFunction = function (CCloneApexEntitySearchResponse)
            {
                TriSysApex.UI.HideWait();

                if (CCloneApexEntitySearchResponse)
                {
                    if (CCloneApexEntitySearchResponse.Success)
                    {
                        // Refresh grid of searches to show the newly cloned search
                        ctrlEntitySearch.LoadSearches(sEntityName);

                        return;
                    }
                    else
                        TriSysApex.UI.ShowMessage(CCloneApexEntitySearchResponse.ErrorMessage);
                }
            };

            payloadObject.ErrorHandlerFunction = function (request, status, error)
            {
                TriSysApex.UI.HideWait();
                TriSysApex.UI.errorAlert('ctrlEditEntitySearch.CloneSearch: ' + status + ": " + error + ". responseText: " + request.responseText);
            };

            TriSysApex.UI.ShowWait(null, "Cloning Search...");
            TriSysAPI.Data.PostToWebAPI(payloadObject);
        }
    },

    OpenSearchForEdit: function (sEntityName)
    {
        var lApexEntitySearchId = ctrlEntitySearch.GetSingletonApexEntitySearchId(sEntityName);
        if( lApexEntitySearchId > 0)
            ctrlEntitySearch.EditSearch(lApexEntitySearchId, sEntityName);
    },

    DeleteSearch: function (sEntityName)
    {
        var lApexEntitySearchId = ctrlEntitySearch.GetSingletonApexEntitySearchId(sEntityName);
        if (lApexEntitySearchId > 0)
            ctrlEntitySearch.DeleteSearchPrompt(lApexEntitySearchId, sEntityName);
    },

    GetSingletonApexEntitySearchId: function(sEntityName)
    {
        var sSuffix = '-' + sEntityName;
        var sGrid = 'ctrlEntitySearch-searches-grid' + sSuffix;
        var lApexEntitySearchId = TriSysSDK.Grid.GetSelectedSingletonRowRecordIdFromGrid(sGrid, "ApexEntitySearchId", sEntityName + " Search");
        return lApexEntitySearchId;
    },

    LoadSearches: function (sEntityName)
    {
        var sSuffix = '-' + sEntityName;
        var sGrid = 'ctrlEntitySearch-searches-grid' + sSuffix;

        // Clear cached selection
        ctrlEntitySearch.EntitySearchId = 0;

        // Display this entity search 
        $('#ctrlEntitySearch-Title' + sSuffix).html(sEntityName + " Search");

        // Show the users
        var sUserComboId = 'ctrlEntitySearch-Users' + sSuffix;
        var userList = TriSysSDK.CShowForm.GetSelectedSkillsFromList(sUserComboId, "'");
        if (!userList)
        {
            TriSysSDK.Grid.Clear(sGrid);
            TriSysApex.UI.ShowMessage("Please choose one or more users.");
            return;
        }

        var sUsers = userList;

        // Jan 2018: Use a dedicated API method which abstracts the underlying SQL and does not use 'SQLDatabase/SQL_Select'
        var fnPopulationByFunction = {
            API: "EntitySearch/List",               // The Web API Controller/Function

            // The additional parameters passed into the function not including the paging metrics
            Parameters: function (request)
            {
                request.EntityName = sEntityName;
                request.UserNames = sUsers;
            },

            DataTableFunction: function (response)  // Called to get a suitable data table for the grid to display
            {
                return response.List;               // The list of records from the Web API
            }
        };

        ctrlEntitySearch.LoadGrid(sEntityName, fnPopulationByFunction);        
    },

    LoadGrid: function (sEntityName, fnPopulationByFunction)
    {
        var sSuffix = '-' + sEntityName;
        var sGrid = 'ctrlEntitySearch-searches-grid' + sSuffix;

        TriSysSDK.Grid.VirtualMode({
            Div: sGrid,
            ID: sGrid,
            Title: sEntityName & " Searches",
            RecordsPerPage: TriSysApex.UserOptions.RecordsPerPage(),
            PopulationByFunction: fnPopulationByFunction,
            Columns: [
                { field: "ApexEntitySearchId", title: "Id", type: "number", width: 70, hidden: true },
                { field: "EntityName", title: "Entity Name", type: "string", hidden: true },
                { field: "SearchName", title: "Search Name", type: "string" },
                { field: "SearchDescription", title: "Description", type: "string" },
                { field: "DateLastUpdated", title: "Last Update/Run", type: "date", format: "{0:dd MMM yyyy }" },                
                { field: "UserName", title: "User", type: "string" } /* Removed 15 Oct 2020
                { field: "DefaultSearch", title: "Default", template: "#= DefaultSearch ? 'Yes' : '' #", hidden: true } */
            ],

            KeyColumnName: "ApexEntitySearchId",
            DrillDownFunction: function (rowData)
            {
                ctrlEntitySearch.EntitySearchId = rowData.ApexEntitySearchId;
                var sSearchName = rowData.SearchName;
                ctrlEntitySearch.LoadSearch(ctrlEntitySearch.EntitySearchId, sEntityName, sSearchName);
            },
            MultiRowSelect: true,
			Grouping: TriSysApex.UserOptions.GridGrouping(),
            ColumnFilters: true,
            OpenButtonCaption: "Search",
            HyperlinkedColumns: ["SearchName"],        // New Jan 2021      
            SelectedRowsCounterId: 'entitySearches-grid-selected-counter-' + sEntityName
        });
    },

    EntitySearchId: 0,
    EntityName: null,

    EditSearch: function (lApexEntitySearchId, sEntityName)
    {
        // Open a search dialogue to capture a new search or an edit of an existing
        ctrlEntitySearch.EntitySearchId = lApexEntitySearchId;
        ctrlEntitySearch.EntityName = sEntityName;

        var bAllowSave = true;
        var bNewSearch = (lApexEntitySearchId <= 0);
        if (lApexEntitySearchId > 0)
        {
            // TODO: Determine whether this user can update someone elses search
        }

        var parametersObject = new TriSysApex.UI.ShowMessageParameters();
        parametersObject.Title = (lApexEntitySearchId > 0 ? "Edit" : "New") + " " + sEntityName + " Search";
        parametersObject.Image = "gi-pen";

        parametersObject.ContentURL = TriSysApex.Constants.UserControlFolder + "ctrlEditEntitySearch.html";

        parametersObject.ButtonRightText = (bAllowSave ? "Cancel" : "Close");
        parametersObject.ButtonRightVisible = true;

        if (bAllowSave)
        {
            var fnAfterSave = function (lEntitySearchId, sSearchName)
            {
                ctrlEntitySearch.LoadSearches(sEntityName);

                // Oct 2020: Open search if a new one
                if (bNewSearch)
                {
                    ctrlEntitySearch.EntitySearchId = lEntitySearchId;
                    ctrlEntitySearch.LoadSearch(lEntitySearchId, sEntityName, sSearchName);
                }
            };

            parametersObject.ButtonLeftText = "Save";
            parametersObject.ButtonLeftVisible = true;
            parametersObject.ButtonLeftFunction = function ()
            {
                return ctrlEditEntitySearch.SaveButtonClick(fnAfterSave);
            };
        }

        TriSysApex.UI.PopupMessage(parametersObject);
    },

    DeleteSearchPrompt: function (lApexEntitySearchId, sEntityName)
    {
        var fnYes = function ()
        {
            ctrlEntitySearch.DeleteSearchThroughWebAPI(lApexEntitySearchId, sEntityName);
            return true;
        };

        var fnNo = function ()
        {
            return true;
        };

        var sMessage = "Are you sure that you wish to delete this " + sEntityName + " Search?";
        TriSysApex.UI.questionYesNo(sMessage, "Delete " + sEntityName + " Search", "Yes", fnYes, "No/Cancel", fnNo);
    },

    DeleteSearchThroughWebAPI: function (lApexEntitySearchId, sEntityName)
    {
        var CDeleteApexEntitySearchRequest = { ApexEntitySearchId: lApexEntitySearchId };

        var payloadObject = {};

        payloadObject.URL = "EntitySearch/Delete";

        payloadObject.OutboundDataPacket = CDeleteApexEntitySearchRequest;

        payloadObject.InboundDataFunction = function (CDeleteApexEntitySearchResponse)
        {
            TriSysApex.UI.HideWait();

            if (CDeleteApexEntitySearchResponse)
            {
                if (CDeleteApexEntitySearchResponse.Success)
                {
                    ctrlEntitySearch.LoadSearches(sEntityName);

                    return;
                }
                else
                    TriSysApex.UI.ShowMessage(CDeleteApexEntitySearchResponse.ErrorMessage);
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('ctrlEditEntitySearch.DeleteSearchThroughWebAPI: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Deleting Search...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);        
    },

    // User has selected the search, so open it to display the search criteria and the grid, all in one tab
    LoadSearch: function (lApexEntitySearchId, sEntityName, sSearchName, bRefresh)
    {
        var sSuffix = '-' + sEntityName;
        var sSearchTree = 'ctrlEntitySearch-lookup-criteria' + sSuffix;
        var sGrid = 'ctrlEntitySearch-search-grid' + sSuffix;

        // Display the name of this entity search 
        if (sSearchName)
            $('#ctrlEntitySearch-Title' + sSuffix).html(sEntityName + " Search: " + sSearchName);

        if (!bRefresh) {
            // Display the search tab
            TriSysSDK.Controls.Button.Click('ctrlEntitySearch-form-tab-search' + sSuffix);
        }

        // Delete the old search criteria tree which will have a different search number
        var oldTreeElement = $('[id*="' + sSearchTree + '"]');
        oldTreeElement.empty();
        var sOldID = oldTreeElement.attr('id');

        // Rename the search criteria div so that we retain the last search on a per entity record basis
        var sSearchDivForRecord = sSearchTree + '-id-' + lApexEntitySearchId;
        $('#' + sOldID).attr('id', sSearchDivForRecord);

        // Clear grid data and put into 'spin mode' whilst we load the search criteria which may be slow for very large data sets
        ctrlEntitySearch.ShowGridLoadingWhilstSearchCriteriaTreeIsPopulated(sEntityName, true);

        // Load the entity search criteria tree
        TriSysSDK.SearchCriteria.Load(sEntityName, 0, sSearchDivForRecord, ctrlEntitySearch.InvokeLookupFromCriteria);

        // 22 Nov 2024: Saved searches menu should allow more height to show all items without scrolling
        const fnResizeSavedSearchesMenu = function ()
        {
            var iHeightFactor = $('#ctrlEntitySearch-tab-panel-search' + sSuffix).position().top + 50;
            var sID = 'saved-search-menu-li-item-search-criteria-tree-' + sSearchDivForRecord;
            $('#' + sID).css('max-height', ($(window).height() - iHeightFactor) + 'px');
        };
        setTimeout(fnResizeSavedSearchesMenu, 2000);
    },

    ShowGridLoadingWhilstSearchCriteriaTreeIsPopulated: function (sEntityName, bSpin)
    {
        var spinnerWait = { Div: 'ctrlEntitySearch-search-grid-container-' + sEntityName };
        TriSysSDK.Grid.WaitSpinnerMode(spinnerWait, bSpin);
    },

    InvokeLookupFromCriteria: function (sEntityName, lRecordId, sJson, dynamicColumns)
    {
        var sSuffix = '-' +sEntityName;
        var sGrid = 'ctrlEntitySearch-search-grid' +sSuffix;

        // Remove 'spin mode' after we have loaded the search criteria 
        ctrlEntitySearch.ShowGridLoadingWhilstSearchCriteriaTreeIsPopulated(sEntityName, false);

        if (!sJson)
        {
            TriSysSDK.Grid.Empty(sGrid);
            TriSysApex.Toasters.Warning("Please enter " + sEntityName + " search criteria.");
            return;
        }

        ctrlEntitySearch.PopulateEntityGrid(sEntityName, sGrid, sJson, dynamicColumns);
    },

    PopulateEntityGrid: function (sEntityName, sGrid, sJson, dynamicColumns, options)
    {
        // Populate the grid asynchronously based upon the entity
        ctrlEntitySearch.ShowEntityRecordsInGrid(sEntityName, sGrid, sJson, dynamicColumns, options);
    },

    ShowEntityRecordsInGrid: function (sEntityName, sGrid, sJson, dynamicColumns, parameterOptions)
    {
        // Jan 2018: Use a dedicated API method which abstracts the underlying SQL and does not use 'SQLDatabase/SQL_Select'
        var sFunction = "/List";        
        var sController = sEntityName + "s";

        // 24 Mar 2021: There are always exceptions
        switch(sEntityName)
        {
            case "Company":
                sController = "Companies";
                break;

            case "Task":
                sFunction = "/PagedList";
        }

        var fnPopulationByFunction = {
            API: sController + sFunction,             // The Web API Controller/Function

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
                request.ColumnNames = TriSysSDK.Grid.Custom.DisplayColumnNames(sGrid);
                request.EntitySearchId = ctrlEntitySearch.EntitySearchId;

                if (parameterOptions)
                {
                    request.FavouritesOnly = parameterOptions.FavouritesOnly;
                    request.ExcludedOnly = parameterOptions.ExcludedOnly;       // Added 19 Aug 2022
                }
            },

            DataTableFunction: function (response)  // Called to get a suitable data table for the grid to display
            {
                if (sEntityName == "Task")
                    return response.Tasks;              // The list of tasks from the Web API
                else
                    return response.List;               // The list of records from the Web API
            }
        };

        var options = {
            DynamicColumns: dynamicColumns,
            Json: sJson,
            SelectedRowsCounterId: 'ctrlEntitySearch-form-grid-selected-counter'
        };

        switch(sEntityName)
        {
            case "Contact":
                TriSysWeb.Pages.Contacts.PopulateGrid(sGrid, "grdContacts", "Contacts", fnPopulationByFunction, null, options);
                break;

            case "Company":
                TriSysWeb.Pages.Companies.PopulateGrid(sGrid, "grdCompanies", "Companies", fnPopulationByFunction, null, options);
                break;
                
            case "Requirement":
                TriSysWeb.Pages.Requirements.PopulateGrid(sGrid, "grdRequirements", "Requirements", fnPopulationByFunction, options);
                break;

            case "Placement":
                TriSysWeb.Pages.Placements.PopulateGrid(sGrid, "grdPlacements", "Placements", fnPopulationByFunction, options);
                break;

            case "Timesheet":
                TriSysWeb.Pages.Timesheets.PopulateGrid(sGrid, "grdTimesheets", "Timesheets", fnPopulationByFunction, options);
                break;

            case "Task":
                TriSysWeb.Pages.Tasks.PopulateGrid(sGrid, "grdTasks", "Tasks", fnPopulationByFunction, options);
                break;
        }
    },

    OpenSearchResult: function(sEntityName)
    {
        var sSuffix = '-' + sEntityName;
        var sGrid = 'ctrlEntitySearch-search-grid' + sSuffix;

        ctrlEntitySearch.OpenGridEntityRecord(sEntityName, sGrid);
    },

    OpenGridEntityRecord: function (sEntityName, sGrid)
    {
        var sIDField = sEntityName + "_" + sEntityName + "Id";

        var bTaskEntity = (sEntityName == "Task");
        if (bTaskEntity)
            sIDField = sEntityName + "Id";

        var lRecordId = TriSysSDK.Grid.GetSelectedSingletonRowRecordIdFromGrid(sGrid, sIDField, sEntityName);
        if (lRecordId <= 0)
            return;       

        if (bTaskEntity)
            TriSysApex.ModalDialogue.Task.QuickShow(lRecordId);
        else
            TriSysApex.FormsManager.OpenForm(sEntityName, lRecordId);
    },

    DrawActionsDropDown: function(sEntityName, sButtonId)
    {
        var sCallbackFunction = 'ctrlEntitySearch.ActionInvocation';
        TriSysActions.Menus.Draw(sButtonId, sEntityName, sCallbackFunction);
    },

    // User has selected a search, and now wants to see the favourites
    LoadFavourites: function (lApexEntitySearchId, sEntityName)
    {
        // 30 Mar 2021: Pass search ID as an option, not SQL
        ctrlEntitySearch.LoadFavouritesIntoGrid(sEntityName, null, { FavouritesOnly: true });
    },

    LoadFavouritesIntoGrid: function (sEntityName, sSQL, options)
    {
        var sSuffix = '-' + sEntityName;
        var sGrid = 'ctrlEntitySearch-favourites-grid' + sSuffix;

        ctrlEntitySearch.PopulateEntityGrid(sEntityName, sGrid, sSQL, null, options);
    },

    AddSearchResultToFavourites: function (sEntityName)
    {
        var sSuffix = '-' + sEntityName;
        var sGrid = 'ctrlEntitySearch-search-grid' + sSuffix;
        var sIDField = sEntityName + "_" + sEntityName + "Id";

        var recordIds = TriSysSDK.Grid.GetSelectedMultipleRowsFromGrid(sGrid, sIDField);
        if(!recordIds || recordIds.length == 0)
        {
            TriSysApex.UI.ShowMessage("Please select one or more " + sEntityName + " records.");
            return;
        }

        // Add to favourites and refresh grid
        ctrlEntitySearch.AddListOfRecordsToFavourites(sEntityName, recordIds);
    },

    AddListOfRecordsToFavourites: function (sEntityName, recordIds, bRefreshGrid)
    {
        var sSuffix = '-' + sEntityName;

        // Add to favourites and refresh grid
        var CAddToFavouritesApexEntitySearchRequest = { ApexEntitySearchId: ctrlEntitySearch.EntitySearchId, RecordIdList: recordIds };

        var payloadObject = {};

        payloadObject.URL = "EntitySearch/AddToFavourites";

        payloadObject.OutboundDataPacket = CAddToFavouritesApexEntitySearchRequest;

        payloadObject.InboundDataFunction = function (CAddToFavouritesApexEntitySearchResponse)
        {
            TriSysApex.UI.HideWait();

            if (CAddToFavouritesApexEntitySearchResponse)
            {
                if (CAddToFavouritesApexEntitySearchResponse.Success)
                {
                    // Simulate the user click on the favourites tab to refresh
                    TriSysSDK.Controls.Button.Click('ctrlEntitySearch-form-tab-favourites' + sSuffix);

                    // If user adds from a popup though, then the above will not work!
                    if (bRefreshGrid)
                        ctrlEntitySearch.LoadFavourites(ctrlEntitySearch.EntitySearchId, sEntityName);

                    // Also, reload the search results silently as those favourited should now disappear
                    var fnRefreshSearchResults = function ()
                    {
                        var bRefresh = true;
                        ctrlEntitySearch.LoadSearch(ctrlEntitySearch.EntitySearchId, sEntityName, null, bRefresh);
                    };
                    setTimeout(fnRefreshSearchResults, 1024);

                    return;
                }
                else
                    TriSysApex.UI.ShowMessage(CAddToFavouritesApexEntitySearchResponse.ErrorMessage);
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('ctrlEditEntitySearch.AddListOfRecordsToFavourites: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Adding to Favourites...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    OpenFavourite: function(sEntityName)
    {
        var sSuffix = '-' + sEntityName;
        var sGrid = 'ctrlEntitySearch-favourites-grid' + sSuffix;

        ctrlEntitySearch.OpenGridEntityRecord(sEntityName, sGrid);
    },

    AddToFavourites: function (sEntityName)
    {
        var fnSelected = function (sEntityName, lRecordId, sName)
        {
            // Add to favourites and refresh grid
            ctrlEntitySearch.AddListOfRecordsToFavourites(sEntityName, [lRecordId], true);
        };

        TriSysApex.ModalDialogue.EntityRecord.Select(sEntityName, fnSelected);
    },

    RemoveFromFavourites: function(sEntityName)
    {
        var sSuffix = '-' + sEntityName;
        var sGrid = 'ctrlEntitySearch-favourites-grid' + sSuffix;
        var sIDField = sEntityName + "_" + sEntityName + "Id";

        var recordIds = TriSysSDK.Grid.GetSelectedMultipleRowsFromGrid(sGrid, sIDField);
        if (!recordIds || recordIds.length == 0)
        {
            TriSysApex.UI.ShowMessage("Please select one or more " + sEntityName + " records.");
            return;
        }

        // Remove from favourites and refresh grid

        ctrlEntitySearch.RemoveFromSearchResultsWebAPI(sEntityName, recordIds, "Favourites",
            function () { ctrlEntitySearch.LoadFavourites(ctrlEntitySearch.EntitySearchId, sEntityName); });

    },

    // Removing from favourites and excluded
    RemoveFromSearchResultsWebAPI: function (sEntityName, recordIds, sWhat, fnCallbackToRefresh)
    {
        var CRemoveFromFavouritesApexEntitySearchRequest = { ApexEntitySearchId: ctrlEntitySearch.EntitySearchId, RecordIdList: recordIds };

        var payloadObject = {};

        payloadObject.URL = "EntitySearch/RemoveFromFavourites";

        payloadObject.OutboundDataPacket = CRemoveFromFavouritesApexEntitySearchRequest;

        payloadObject.InboundDataFunction = function (CRemoveFromFavouritesApexEntitySearchResponse)
        {
            TriSysApex.UI.HideWait();

            if (CRemoveFromFavouritesApexEntitySearchResponse)
            {
                if (CRemoveFromFavouritesApexEntitySearchResponse.Success)
                {
                    // The caller knows which grid to refresh
                    fnCallbackToRefresh();

                    // Also, reload the search results silently as those removed from favourites/excluded should now re-appear
                    var fnRefreshSearchResults = function () {
                        var bRefresh = true;
                        ctrlEntitySearch.LoadSearch(ctrlEntitySearch.EntitySearchId, sEntityName, null, bRefresh);
                    };
                    setTimeout(fnRefreshSearchResults, 1024);

                    return;
                }
                else
                    TriSysApex.UI.ShowMessage(CRemoveFromFavouritesApexEntitySearchResponse.ErrorMessage);
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error) {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('ctrlEditEntitySearch.RemoveFromSearchResultsWebAPI: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Removing " + sWhat + "...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    // Called when a user runs an action from any menu.
    ActionInvocation: function (sEntityName)
    {
        var sSuffix = '-' + sEntityName;

        var sGrid = 'ctrlEntitySearch-search-grid' + sSuffix;

		var elemFaveTab = $('#ctrlEntitySearch-form-tab-favourites' + sSuffix);
		if(elemFaveTab.hasClass('active'))
			sGrid = 'ctrlEntitySearch-favourites-grid' + sSuffix;

		var elemExcludedTab = $('#ctrlEntitySearch-form-tab-excluded' + sSuffix);
		if (elemExcludedTab.hasClass('active'))
		    sGrid = 'ctrlEntitySearch-excluded-grid' + sSuffix;

		var sIDField = sEntityName + "_" + sEntityName + "Id";

        var recordIds = TriSysSDK.Grid.GetSelectedMultipleRowsFromGrid(sGrid, sIDField);
        return recordIds;
    },

    // Excluded added 19 Aug 2022
    // User has selected a search, and now wants to see the favourites
    LoadExcluded: function (lApexEntitySearchId, sEntityName)
    {
        ctrlEntitySearch.LoadExcludedIntoGrid(sEntityName, null, { ExcludedOnly: true });
    },

    LoadExcludedIntoGrid: function (sEntityName, sSQL, options)
    {
        var sSuffix = '-' + sEntityName;
        var sGrid = 'ctrlEntitySearch-excluded-grid' + sSuffix;

        ctrlEntitySearch.PopulateEntityGrid(sEntityName, sGrid, sSQL, null, options);
    },

    OpenExcluded: function (sEntityName) {
        var sSuffix = '-' + sEntityName;
        var sGrid = 'ctrlEntitySearch-excluded-grid' + sSuffix;

        ctrlEntitySearch.OpenGridEntityRecord(sEntityName, sGrid);
    },

    AddToExcluded: function (sEntityName)
    {
        var fnSelected = function (sEntityName, lRecordId, sName) {
            // Add to excluded and refresh grid
            ctrlEntitySearch.AddListOfRecordsToExclude(sEntityName, [lRecordId], true);
        };

        TriSysApex.ModalDialogue.EntityRecord.Select(sEntityName, fnSelected);
    },

    AddSearchResultToExcluded: function (sEntityName)
    {
        var sSuffix = '-' + sEntityName;
        var sGrid = 'ctrlEntitySearch-search-grid' + sSuffix;

        // Add to excluded and refresh grid
        ctrlEntitySearch.AddSelectedGridRowsToExcluded(sEntityName, sGrid);
    },

    AddSelectedGridRowsToExcluded: function (sEntityName, sGrid)
    {
        var sSuffix = '-' + sEntityName;
        var sIDField = sEntityName + "_" + sEntityName + "Id";

        var recordIds = TriSysSDK.Grid.GetSelectedMultipleRowsFromGrid(sGrid, sIDField);
        if (!recordIds || recordIds.length == 0) {
            TriSysApex.UI.ShowMessage("Please select one or more " + sEntityName + " records.");
            return;
        }

        // Add to excluded and refresh grid
        ctrlEntitySearch.AddListOfRecordsToExclude(sEntityName, recordIds);
    },

    AddListOfRecordsToExclude: function (sEntityName, recordIds, bRefreshGrid)
    {
        var sSuffix = '-' + sEntityName;

        // Add to Exclude and refresh grid
        var CAddToExcludedApexEntitySearchRequest = { ApexEntitySearchId: ctrlEntitySearch.EntitySearchId, RecordIdList: recordIds };

        var payloadObject = {};

        payloadObject.URL = "EntitySearch/AddToExcluded";

        payloadObject.OutboundDataPacket = CAddToExcludedApexEntitySearchRequest;

        payloadObject.InboundDataFunction = function (CAddToExcludedApexEntitySearchResponse)
        {
            TriSysApex.UI.HideWait();

            if (CAddToExcludedApexEntitySearchResponse) {
                if (CAddToExcludedApexEntitySearchResponse.Success)
                {
                    // Simulate the user click on the Excludes tab to refresh
                    TriSysSDK.Controls.Button.Click('ctrlEntitySearch-form-tab-excluded' + sSuffix);

                    // If user adds from a popup though, then the above will not work!
                    if (bRefreshGrid)
                        ctrlEntitySearch.LoadExcluded(ctrlEntitySearch.EntitySearchId, sEntityName);

                    // Also, reload the search results silently as those Excluded should now disappear
                    var fnRefreshSearchResults = function () {
                        var bRefresh = true;
                        ctrlEntitySearch.LoadSearch(ctrlEntitySearch.EntitySearchId, sEntityName, null, bRefresh);
                    };
                    setTimeout(fnRefreshSearchResults, 1024);

                    return;
                }
                else
                    TriSysApex.UI.ShowMessage(CAddToExcludedApexEntitySearchResponse.ErrorMessage);
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error) {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('ctrlEditEntitySearch.AddListOfRecordsToExclude: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Adding to Excluded...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    RemoveFromExcluded: function (sEntityName)
    {
        var sSuffix = '-' + sEntityName;
        var sGrid = 'ctrlEntitySearch-excluded-grid' + sSuffix;
        var sIDField = sEntityName + "_" + sEntityName + "Id";

        var recordIds = TriSysSDK.Grid.GetSelectedMultipleRowsFromGrid(sGrid, sIDField);
        if (!recordIds || recordIds.length == 0) {
            TriSysApex.UI.ShowMessage("Please select one or more " + sEntityName + " records.");
            return;
        }

        // Remove from excluded and refresh grid

        ctrlEntitySearch.RemoveFromSearchResultsWebAPI(sEntityName, recordIds, "Excluded",
            function () { ctrlEntitySearch.LoadExcluded(ctrlEntitySearch.EntitySearchId, sEntityName); });
    }

};  // ctrlEntitySearch
