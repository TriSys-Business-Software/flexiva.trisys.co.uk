var ctrlRequirementForm = 
{
    Load: function()
    {
        var sEntityName = 'Requirement';

        // Form Tabs
        TriSysSDK.EntityFormTabs.AddClickEventHandlers('requirement-form-tab-nav-horizontal', true);
        TriSysSDK.Controls.Button.Click('requirement-form-tab-contract-li');

        // Form Menu
        var hideMenuItemPrefixes = ['file-menu-saveas'];
        //TriSysSDK.FormMenus.DrawFileMenu('requirementForm-FileMenu', 'requirementForm', ctrlRequirementForm.FileMenuCallback, hideMenuItemPrefixes);

        // Actions menus
        if (TriSysApex.Device.isPhone())
        {
            $('#requirementForm-ActionsMenu').hide();
            $('#requirementCandidateSearchResultsActionsMenu').hide();
            $('#requirementLonglistActionsMenu').hide();
            $('#requirementShortlistActionsMenu').hide();
            $('#requirementRejectedActionsMenu').hide();
            $('#requirementPlacementsActionsMenu').hide();
        }
        else
        {
            var sCallbackFunction = 'ctrlRequirementForm.ActionInvocation';
            var sMasterEntityCallbackFunction = 'ctrlRequirementForm.ActionInvocationMasterEntity';
            TriSysActions.Menus.Draw('requirementForm-ActionsMenu', 'Requirement', sCallbackFunction, sMasterEntityCallbackFunction);
            TriSysActions.Menus.Draw('requirementCandidateSearchResultsActionsMenu', 'Contact', 'ctrlRequirementForm.ActionInvocationCandidateSearchResults', sMasterEntityCallbackFunction);
            TriSysActions.Menus.Draw('requirementLonglistActionsMenu', 'Contact', 'ctrlRequirementForm.ActionInvocationCandidateLonglist', sMasterEntityCallbackFunction);
            TriSysActions.Menus.Draw('requirementShortlistActionsMenu', 'Contact', 'ctrlRequirementForm.ActionInvocationCandidateShortlist', sMasterEntityCallbackFunction);
            TriSysActions.Menus.Draw('requirementRejectedActionsMenu', 'Contact', 'ctrlRequirementForm.ActionInvocationCandidateRejected', sMasterEntityCallbackFunction);
            TriSysActions.Menus.Draw('requirementPlacementsActionsMenu', 'Placement', sCallbackFunction);

            // 22 Nov 2024: Actions menus should allow more height to show all options without scrolling
            const fnResizeActionsMenus = function ()
            {
                $('#requirementForm-ActionsMenu .dropdown-menu.dropdown-custom > li').css('max-height', ($(window).height() - 100) + 'px');
                const lstActionsMenus = ['requirementCandidateSearchResultsActionsMenu', 'requirementLonglistActionsMenu',
                    'requirementShortlistActionsMenu', 'requirementRejectedActionsMenu', 'requirementPlacementsActionsMenu'];
                lstActionsMenus.forEach(function (sMenuID)
                {
                    var iHeightFactor = $('#requirement-tab-panel-buttons').position().top + 120;
                    $('#' + sMenuID + ' .dropdown-menu.dropdown-custom > li').css('max-height', ($(window).height() - iHeightFactor) + 'px');
                });
            };
            setTimeout(fnResizeActionsMenus, 2000);            
        }

        // Show standard menus for grids
        var sMenuFile = 'ctrlRequirementCandidateGridFileMenu.html';
        var sGrid = 'requirementForm-CandidateSearchResultsGrid';

        // Candidate specific Specific Menu
        var visibleMenuItems = ["requirementCandidateGridFileMenu-addshortlist", "requirementCandidateGridFileMenu-reject"];
        //TriSysSDK.FormMenus.DrawDropDownMenuFromTemplate('requirementCandidateSearchResultsFileMenu', sGrid,
        //    sMenuFile, ctrlRequirementForm.CandidateGridMenuCallback, 'requirementCandidateGridFileMenu', false,
        //    visibleMenuItems, 'requirementCandidateSearchResultsFileMenu');

        TriSysSDK.FormMenus.DrawGridMenu('requirementCandidateSearchResultsGridMenu', sGrid);

        sGrid = 'requirementForm-LonglistGrid';

        // Candidate specific Specific Menu
        //TriSysSDK.FormMenus.DrawDropDownMenuFromTemplate('requirementLonglistFileMenu', sGrid,
        //    sMenuFile, ctrlRequirementForm.CandidateGridMenuCallback, 'requirementCandidateGridFileMenu', false,
        //    visibleMenuItems, 'requirementLonglistFileMenu');

        TriSysSDK.FormMenus.DrawGridMenu('requirementLonglistGridMenu', sGrid);

        sGrid = 'requirementForm-ShortlistGrid';

        // Candidate specific Specific Menu
        visibleMenuItems = ["requirementCandidateGridFileMenu-reject", "requirementCandidateGridFileMenu-addcandidate"];
        //TriSysSDK.FormMenus.DrawDropDownMenuFromTemplate('requirementShortlistFileMenu', sGrid,
        //    sMenuFile, ctrlRequirementForm.CandidateGridMenuCallback, 'requirementCandidateGridFileMenu', false,
        //    visibleMenuItems, 'requirementShortlistFileMenu');

		var sJobBoardMenuFile = 'ctrlRequirementShortlistJobBoardMenu.html';
		visibleMenuItems = ctrlRequirementForm.AvailableJobBoardMenuItems();
        TriSysSDK.FormMenus.DrawDropDownMenuFromTemplate('requirementShortlistJobBoardApplicantsMenu', sGrid,
			sJobBoardMenuFile, ctrlRequirementForm.JobBoardMenuCallback, 'requirement-shortlist-job-board-menu-items', false,
			visibleMenuItems, 'requirementShortlistJobBoardApplicantsMenu');

		TriSysSDK.FormMenus.DrawGridMenu('requirementShortlistGridMenu', sGrid);

        sGrid = 'requirementForm-RejectedGrid';

        // Candidate specific Specific Menu
        visibleMenuItems = ["requirementCandidateGridFileMenu-remove"];
        //TriSysSDK.FormMenus.DrawDropDownMenuFromTemplate('requirementRejectedFileMenu', sGrid,
        //    sMenuFile, ctrlRequirementForm.CandidateGridMenuCallback, 'requirementCandidateGridFileMenu', false,
        //    visibleMenuItems, 'requirementRejectedFileMenu');

        TriSysSDK.FormMenus.DrawGridMenu('requirementRejectedGridMenu', sGrid);

        sGrid = 'requirementForm-PlacementsGrid';
        //TriSysSDK.FormMenus.DrawGridFileMenu('requirementPlacementsFileMenu', sGrid);
        TriSysSDK.FormMenus.DrawGridMenu('requirementPlacementsGridMenu', sGrid);

        sGrid = 'requirementForm-NotesHistoryGrid';
        //TriSysSDK.FormMenus.DrawGridFileMenu('requirementNotesHistoryFileMenu', sGrid, ctrlRequirementForm.NotesHistoryGridFileMenuCallback);
        TriSysSDK.FormMenus.DrawGridMenu('requirementNotesHistoryGridMenu', sGrid);

        sGrid = 'requirementForm-ScheduledTasksGrid';
        //TriSysSDK.FormMenus.DrawGridFileMenu('requirementScheduledTasksFileMenu', sGrid, ctrlRequirementForm.ScheduledTaskGridFileMenuCallback);
        TriSysSDK.FormMenus.DrawGridMenu('requirementScheduledTasksGridMenu', sGrid);

        var fnCallbackAfterLoadingSalary = function ()
        {
            // 01 Apr 2021: Custom fields tab
            TriSysSDK.CShowForm.CustomFieldsTab.Load("requirement-form-customfields", "requirement-form-tab-custom-caption",
                                                        sEntityName);

            // Tell CShowForm that we are initialised and it can customise the widgets
            TriSysSDK.CShowForm.InitialiseFields(sEntityName);

            // See TriSysApex.Requirements.Load which is specified in forms.json for actual data read
        };
        TriSysSDK.PermanentSalary.Load(sEntityName, TriSysApex.Pages.RequirementForm.RequirementId, 'requirement-form-permanent-salary', fnCallbackAfterLoadingSalary);


        // Job title no-cache 
        if (!TriSysSDK.CShowForm.JobTitlesCached())
        {
            $('#tr-RequirementConfigFields_JobTitle').show();

            // Capture enter key to do lookup
            $('#RequirementConfigFields_JobTitle').keyup(function (e)
            {
                if (e.keyCode == 13)
                    ctrlRequirementForm.JobTitleLookup();
            });
        }
    },

    // We get called when the user switched buttons to change view
    TabButtonCallback: function (sTabID)
    {
		var sGrid = null;

        switch (sTabID)
        {
            case 'requirement-form-panel-contract':
                if (TriSysApex.Forms.EntityForm.isGridPopulated("Requirement", sTabID))
                    return;

                TriSysSDK.ContractRates.Load("Requirement", TriSysApex.Pages.RequirementForm.RequirementId, 'requirement-form-contract-rates');
                break;

            // This was commented out to prevent a bug not showing permanent fields!
            //case 'requirement-form-panel-permanent':
            //    if (TriSysApex.Forms.EntityForm.isGridPopulated("Requirement", sTabID))
            //        return;

            //    TriSysSDK.PermanentSalary.Load("Requirement", TriSysApex.Pages.RequirementForm.RequirementId, 'requirement-form-permanent-salary');
            //    break;

            case 'requirement-form-panel-search':

                if (TriSysApex.Forms.EntityForm.isGridPopulated("Requirement", sTabID))
                {
                    // 25 Nov 2024: Always make the boolean search panel visible as this broke a while ago and found today
                    var sTabPaneId = 'ctrlSearchCriteria-tab-panel-boolean-requirement-candidate-search-criteria-id-' +
                                        TriSysApex.Pages.RequirementForm.RequirementId;
                    $('#' + sTabPaneId).show();

                    var sBooleanTreeWidgetId = 'search-criteria-tree-requirement-candidate-search-criteria-id-' +
                        TriSysApex.Pages.RequirementForm.RequirementId;
                    $('#' + sBooleanTreeWidgetId).css('visibility', 'visible');
                    return;
                }

				// Rename the search criteria div so that we retain the last search on a per entity record basis
                var sSearchDiv = 'requirement-candidate-search-criteria';
                var sSearchDivForRecord = sSearchDiv + '-id-' + TriSysApex.Pages.RequirementForm.RequirementId;
				$('#' + sSearchDiv).attr('id', sSearchDivForRecord);
        
				// Load the search criteria now for candidates
				var fnCommenceSearch = ctrlRequirementForm.InvokeCandidateSearchFromCriteria;
				TriSysSDK.SearchCriteria.Load("Contact", TriSysApex.Pages.RequirementForm.RequirementId, sSearchDivForRecord, fnCommenceSearch);        
				break;

            case 'requirement-form-panel-attributes':
                if (TriSysApex.Forms.EntityForm.isGridPopulated("Requirement", sTabID))
                    return;

                TriSysSDK.Attributes.Load("Requirement", TriSysApex.Pages.RequirementForm.RequirementId, 'requirement-form-attributes');
                break;

            //case 'requirement-form-panel-search-results':
            //    if (TriSysApex.Forms.EntityForm.isGridPopulated("Requirement", sTabID))
            //        return;
            //    break;

            case 'requirement-form-panel-longlist':
                sGrid = 'requirementForm-LonglistGrid';
                if (TriSysApex.Forms.EntityForm.isGridPopulated("Requirement", sGrid))
                    return;

                ctrlRequirementForm.PopulateCandidateGrid(sGrid, true);
                break;

            case 'requirement-form-panel-shortlist':
                sGrid = 'requirementForm-ShortlistGrid';
                if (TriSysApex.Forms.EntityForm.isGridPopulated("Requirement", sGrid))
                    return;

                ctrlRequirementForm.PopulateCandidateGrid(sGrid, false, true);
                break;

            case 'requirement-form-panel-rejected':
                sGrid = 'requirementForm-RejectedGrid';
                if (TriSysApex.Forms.EntityForm.isGridPopulated("Requirement", sGrid))
                    return;

                ctrlRequirementForm.PopulateCandidateGrid(sGrid, false, false, true);
                break;

            case 'requirement-form-panel-placements':
                TriSysApex.Pages.RequirementForm.LoadPlacementsGrid('requirementForm-PlacementsGrid', null);
                break;

            case 'requirement-form-panel-documentlibrary':
                if (TriSysApex.Forms.EntityForm.isGridPopulated("Requirement", sTabID))
                    return;

                TriSysSDK.DocumentLibrary.Load("Requirement", TriSysApex.Pages.RequirementForm.RequirementId, 'requirement-form-documentlibrary');
                break;

            case 'requirement-form-panel-noteshistory':
                TriSysApex.Pages.RequirementForm.LoadNotesHistoryGrid('requirementForm-NotesHistoryGrid', null);
                break;

            case 'requirement-form-panel-scheduledtasks':
                TriSysApex.Pages.RequirementForm.LoadScheduledTasksGrid('requirementForm-ScheduledTasksGrid', null);
                break;
        }
    },

    FileMenuCallback: function(sFileMenuID)
    {
        var fm = TriSysSDK.FormMenus.Constants;

        switch (sFileMenuID)
        {
            case fm.File_New:
                TriSysApex.Pages.RequirementForm.NewRecord();
                break;
            case fm.File_Open:
                TriSysApex.Pages.RequirementForm.OpenFindDialogue();
                break;
            case fm.File_Save:
                TriSysApex.Pages.RequirementForm.SaveRecord();
                break;
            case fm.File_Save_As:
                TriSysApex.UI.ShowMessage("Save Requirement As");
                break;
            case fm.File_Delete:
                TriSysApex.Pages.RequirementForm.DeleteRecord();
                break;
            case fm.File_Close:
                TriSysApex.FormsManager.CloseCurrentForm();     // TODO: Dirty check!
                break;
        }
    },

    NotesHistoryGridFileMenuCallback: function(sFileMenuID)
    {
        ctrlRequirementForm.TaskGridFileMenuCallback(sFileMenuID, 'requirementForm-NotesHistoryGrid', false);
    },

    ScheduledTaskGridFileMenuCallback: function(sFileMenuID)
    {
        ctrlRequirementForm.TaskGridFileMenuCallback(sFileMenuID, 'requirementForm-ScheduledTasksGrid', true);
    },

    TaskGridFileMenuCallback: function(sFileMenuID, sGrid, bScheduled)
    {
        var fm = TriSysSDK.FormMenus.Constants;
        var lTaskId = null;

        switch (sFileMenuID)
        {
            case fm.File_New:
                ctrlRequirementForm.NewTask(bScheduled);
                break;

            case fm.File_Open:
                lTaskId = TriSysApex.ModalDialogue.Task.GetSelectedSingletonTaskIdFromTaskGrid(sGrid);
                if (lTaskId > 0)
                    TriSysApex.ModalDialogue.Task.QuickShow(lTaskId);
                break;

            case fm.File_Delete:
                lTaskId = TriSysApex.ModalDialogue.Task.GetSelectedSingletonTaskIdFromTaskGrid(sGrid);
                if (lTaskId > 0)
                    TriSysApex.ModalDialogue.Task.DeleteTask(lTaskId);
                break;
        }
    },

    NewTask: function (bScheduled)
    {
        // Get the requirement and contact from this requirement and pass into the task form
        var lRequirementId = TriSysApex.Pages.RequirementForm.RequirementId;
        var lContactId = TriSysApex.Pages.RequirementForm.ContactId;
        var sFullName = $('#Requirement_ContactId').val();
        var sCompany = $('#Requirement_CompanyId').val();
        var sJobTitle = '?';          // TODO Garry - get from requirement cache
        var sContactType = 'Client';

        var params = new TriSysApex.ModalDialogue.Task.ShowParameters();
        params.Scheduled = bScheduled;

        var contact = {
            ContactId: lContactId,
            FullName: sFullName,
            CompanyName: sCompany,
            JobTitle: sJobTitle,
            ContactType: sContactType
        };
        params.Contacts.push(contact);

        var requirementLink = {
            Name: 'Requirement',
            RecordId: lRequirementId,
            Description: $('#RequirementConfigFields_RequirementReference').val() + ": " + TriSysSDK.CShowForm.GetJobTitleFromField('RequirementConfigFields_JobTitle') +
                            " at " + sCompany + " with " + sFullName
        };
        params.Links.push(requirementLink);
    

        TriSysApex.ModalDialogue.Task.Show(params);
    },


    InvokeCandidateSearchFromCriteria: function (sEntityName, lRecordId, sJson, dynamicColumns)
    {
        // Populate the grid asynchronously
        var sGrid = 'requirementForm-CandidateSearchResultsGrid';
        ctrlRequirementForm.PopulateCandidateSearchGrid(sGrid, "grdCandidateSearchResults", "Candidates", sJson, dynamicColumns);
    },

    PopulateCandidateSearchGrid: function (sGrid, sGridName, sCaption, sJson, dynamicColumns)
    {
        // Jan 2018: Use a dedicated API method which abstracts the underlying SQL and does not use 'SQLDatabase/SQL_Select'
        var fnPopulationByFunction = {
            API: "Contacts/List",                   // The Web API Controller/Function

            // The additional parameters passed into the function not including the paging metrics
            Parameters: function (request)
            {
                request.SearchTreeEnabled = true;
				request.SearchTreeJson = sJson;
                request.RequirementId = TriSysApex.Pages.RequirementForm.RequirementId;
                request.CandidateSearchResults = true;
            },

            DataTableFunction: function (response)  // Called to get a suitable data table for the grid to display
            {
                return response.List;               // The list of records from the Web API
            }
        };

        ctrlRequirementForm.PopulateRequirementCandidateGrid(sGrid, sGridName, sCaption, fnPopulationByFunction,
                                                                dynamicColumns, 'requirementForm-candidateSearch-grid-selected-counter', sJson);

        // Now simply switch to the results tab
		TriSysSDK.Controls.Button.Click('requirement-form-tab-search-results-li');
    },

    // Central function for longlist, shortlist and rejected candidates
    PopulateCandidateGrid: function(sGrid, bLonglist, bShortlist, bRejected)
    {
        var sGridName = '', sCaption = '';

        // Jan 2018: Use a dedicated API method which abstracts the underlying SQL and does not use 'SQLDatabase/SQL_Select'
        var fnPopulationByFunction = {
            API: "Contacts/List",                   // The Web API Controller/Function

            // The additional parameters passed into the function not including the paging metrics
            Parameters: function (request)
            {
                request.RequirementId = TriSysApex.Pages.RequirementForm.RequirementId;
                request.Longlist = bLonglist;
                request.Shortlist = bShortlist;
                request.Rejected = bRejected;
            },

            DataTableFunction: function (response)  // Called to get a suitable data table for the grid to display
            {
                return response.List;               // The list of records from the Web API
            }
        };

        if (bLonglist)
        {
            // Not enabled until 07 Mar 2021 because we needed entity search which we did not originally want in Apex
            sGridName = 'Longlist';
            sCaption = 'Longlist';
        }
        else if (bShortlist)
        {
            sGridName = 'Shortlist';
            sCaption = 'Shortlist';

            // Special grid
            ctrlRequirementForm.ShortlistGrid.PopulateGrid(sGrid, sGridName, sCaption, fnPopulationByFunction);

            return;
        }
        else if (bRejected)
        {
            sGridName = 'Shortlist';
            sCaption = 'Shortlist';
        }

        // Finally display the grid
        ctrlRequirementForm.PopulateRequirementCandidateGrid(sGrid, sGridName, sCaption, fnPopulationByFunction,
                                                                null, 'requirementForm-rejected-grid-selected-counter');
    },

    // Called for all 4 candidate grids: search results, longlist, shortlist and rejected
    PopulateRequirementCandidateGrid: function (sGrid, sGridName, sCaption, fnPopulationByFunction, dynamicColumns, sSelectedRowsCounterId, sJson)
    {
        // Only show candidate specific columns
        var columns = JSON.parse(JSON.stringify(TriSysWeb.Pages.Contacts.Columns));
        columns = TriSysSDK.Grid.HideColumns(columns, ['Contact_Company', 'Contact_EMail', 'Contact_WorkTelNo']);
        columns = TriSysSDK.Grid.ShowColumns(columns, ['Contact_DateOfBirth', 'Contact_HomeAddressCity', 'Contact_JobTitle', 'Contact_AvailabilityDate'], true);

        var options = {
            DynamicColumns: dynamicColumns,
            SelectedRowsCounterId: sSelectedRowsCounterId,
            Json: sJson
        }

        // We like re-usability to the nth degree!
        TriSysWeb.Pages.Contacts.PopulateGrid(sGrid, sGridName, sCaption, fnPopulationByFunction, columns, options);
    },

    ShortlistGrid:      // ctrlRequirementForm.ShortlistGrid
    {
        PopulateGrid: function (sDiv, sGridName, sTitle, fnPopulationByFunction)
        {
            var bHorizontalScrolling = false;   //true;     // Unfortunately, this breaks row selection and therefore all menus for this grid!

            TriSysSDK.Grid.VirtualMode({
                Div: sDiv,
                ID: sGridName,
                Title: sTitle,
                RecordsPerPage: TriSysApex.UserOptions.RecordsPerPage(),
                PopulationByFunction: fnPopulationByFunction,
                Columns: ctrlRequirementForm.ShortlistGrid.Columns,
                MobileVisibleColumns: ctrlRequirementForm.ShortlistGrid.MobileVisibleColumns,
                MobileRowTemplate: ctrlRequirementForm.ShortlistGrid.MobileRowTemplate,

                KeyColumnName: "ContactId",
                DrillDownFunction: function (rowData)
                {
                    // Load contact Form with specified ID
                    var lContactId = rowData.ContactId;
                    TriSysApex.FormsManager.OpenForm("Contact", lContactId);
                },
                PreviewButtonFunction: function (rowData)
                {
                    var lContactId = rowData.ContactId;
                    TriSysApex.EntityPreview.Contact.Open(lContactId);
                },
                PreviewButtonTooltip: 'Contact Preview',
                LinkedInButtonColumn: { enabled: true, contactIdField: "ContactId" },
                MultiRowSelect: true,
                ColumnFilters: true,
                Grouping: false,
                HorizontalScrolling: bHorizontalScrolling,
                HyperlinkedColumns: ["Contact_FullName"],                // New Jan 2021
                SelectedRowsCounterId: 'requirementForm-ShortlistGrid-selected-counter'
            });
        },

        Columns: [
                    { field: "ContactId", title: "ID", type: "number", width: 70, hidden: true },
                    { field: "Contact_FullName", title: "Candidate Name", type: "string", width: 170, sticky: true, lockable: true },  // Set to true if Telerik fix this!
                    { field: "ShortlistSourceName", title: "Shortlist Source", type: "string", width: 140, lockable: true },
                    { field: "DateShortlisted", title: "Shortlisted", type: "date", format: "{0:dd MMM yyyy }", width: 110 },
                    { field: "Called", title: "Called", type: "date", format: "{0:dd MMM yyyy }", width: 100 },
                    { field: "Interested", title: "Interested", type: "date", format: "{0:dd MMM yyyy }", width: 100 },
                    { field: "CVSend", title: "CV Send", type: "date", format: "{0:dd MMM yyyy }", width: 100 },
                    { field: "AssessmentInterview", title: "Assessment Interview", type: "date", format: "{0:dd MMM yyyy }", width: 130, hidden: true },
                    { field: "TelephoneInterview", title: "Tel. Interview", type: "date", format: "{0:dd MMM yyyy }", width: 120 },
                    { field: "FirstInterview", title: "First Interview", type: "date", format: "{0:dd MMM yyyy }", width: 120 },
                    { field: "SecondInterview", title: "Second Interview", type: "date", format: "{0:dd MMM yyyy }", width: 130 },
                    { field: "ThirdInterview", title: "Third Interview", type: "date", format: "{0:dd MMM yyyy }", width: 130, hidden: true },
                    { field: "FourthInterview", title: "Fourth Interview", type: "date", format: "{0:dd MMM yyyy }", width: 130, hidden: true },
                    { field: "FifthInterview", title: "Fifth Interview", type: "date", format: "{0:dd MMM yyyy }", width: 130, hidden: true },
                    { field: "ReferencesTaken", title: "References Taken", type: "date", format: "{0:dd MMM yyyy }", width: 140, hidden: true },
                    { field: "OfferMade", title: "Offer Made", type: "date", format: "{0:dd MMM yyyy }", width: 110 },
                    { field: "OfferAccepted", title: "Offer Accepted", type: "date", format: "{0:dd MMM yyyy }", width: 130 },
                    { field: "OfferRejected", title: "Offer Rejected", type: "date", format: "{0:dd MMM yyyy }", width: 130 },
                    { field: "Placed", title: "Placed", type: "date", format: "{0:dd MMM yyyy }", width: 100 },
                    { field: "Withdrawn", title: "Withdrawn", type: "date", format: "{0:dd MMM yyyy }", width: 110 },
                    { field: "Rejected", title: "Rejected", type: "date", format: "{0:dd MMM yyyy }", width: 100, hidden: true },
                    { field: "Contact_Company", title: "Company", type: "string", width: 130, hidden: true },
                    { field: "Contact_EMail", title: "Work E-Mail", type: "string", width: 130, hidden: true },
                    { field: "Contact_HomeEMail", title: "Home E-Mail", type: "string", width: 130, hidden: true },
                    { field: "Contact_WorkTelNo", title: "Work Tel. No", type: "string", width: 130, hidden: true },
                    { field: "Contact_MobileTelNo", title: "Personal Mobile", type: "string", width: 130, hidden: true, lockable: true },
                    { field: "Contact_WorkMobile", title: "Work Mobile", type: "string", width: 130, hidden: true },
                    { field: "Contact_HomeAddressTelNo", title: "Home Tel. No", type: "string", width: 130, hidden: true, lockable: true },
                    { field: "Contact_DateOfBirth", title: "Date of Birth", type: "date", format: "{0:dd MMM yyyy }", width: 130, hidden: true },
                    { field: "Contact_Title", title: "Title", type: "string", width: 130, hidden: true },
                    { field: "Contact_OwnerUser", title: "Owner User", type: "string", width: 130, hidden: true },
                    { field: "Contact_CompanyAddressStreet", title: "Company Street Address", type: "string", width: 130, hidden: true },
                    { field: "Contact_CompanyAddressCity", title: "Company Street City", type: "string", width: 130, hidden: true },
                    { field: "Contact_CompanyAddressCounty", title: "Company Street County", type: "string", width: 130, hidden: true },
                    { field: "Contact_CompanyAddressPostCode", title: "Company Street Post/ZIP Code", type: "string", width: 130, hidden: true },
                    { field: "Contact_CompanyAddressCountry", title: "Company Street Country", type: "string", width: 130, hidden: true },
                    { field: "Contact_HomeAddressStreet", title: "Home Street Address", type: "string", width: 130, hidden: true },
                    { field: "Contact_HomeAddressCity", title: "Home Street City", type: "string", width: 130, hidden: true },
                    { field: "Contact_HomeAddressCounty", title: "Home Street County", type: "string", width: 130, hidden: true },
                    { field: "Contact_HomeAddressPostCode", title: "Home Street Post/ZIP Code", type: "string", width: 130, hidden: true },
                    { field: "Contact_HomeAddressCountry", title: "Home Street Country", type: "string", width: 130, hidden: true },
                    { field: "Contact_ContactType", title: "Contact Type", type: "string", width: 130, hidden: true },
                    { field: "Contact_JobTitle", title: "Job Title", type: "string", width: 130, hidden: true },
                    { field: "Contact_AvailabilityDate", title: "Availability Date", type: "date", format: "{0:dd MMM yyyy }", width: 130, hidden: true },
                    { field: "Contact_ContactSource", title: "Source", type: "string", width: 130, hidden: true, lockable: true },
                    { field: "Contact_Status", title: "Status", type: "string", width: 130, hidden: true }

        ],
        MobileVisibleColumns: [
                    { field: "Contact_FullName" }
        ],
        MobileRowTemplate: '<td colspan="1"><strong>#: Contact_FullName # </strong><br />#: ShortlistSourceName #<br />' +
                            '<i>Shortlisted: #: DateShortlisted #</i><br />' +
                            'Called: #: Called #<br />' +
                            'Interested: #: Interested #<br />' +
                            'CV Send: #: CVSend #<br />' +
                            'Tel. Interview: #: TelephoneInterview #<br />' +
                            '1st. Interview: #: FirstInterview #<br />' +
                            'Offer: #: OfferMade #<br />' +
                            'Accepted: #: OfferAccepted #<br />' +
                            'Placed: #: Placed #<br />' +
                            '<hr></td>'

    },

    // "requirementCandidateGridFileMenu-addshortlist-requirementForm-CandidateSearchResultsGrid"
    CandidateGridMenuCallback: function (sMenuItemID)
    {
        var sPrefix = 'requirementCandidateGridFileMenu-';
        sMenuItemID = sMenuItemID.substring(sPrefix.length);
        var iFirstDash = sMenuItemID.indexOf("-");
        var sGrid = sMenuItemID.substring(iFirstDash + 1);
        sMenuItemID = sMenuItemID.substring(0, iFirstDash);

        switch (sMenuItemID)
        {
            case 'view':
                ctrlRequirementForm.OpenCandidate(sGrid);
                break;
            case 'opencv':
                ctrlRequirementForm.OpenCandidateCV(sGrid);
                break;
            case 'addlonglist':
                ctrlRequirementForm.AddCandidateToList(sGrid, true);
                break;
            case 'addshortlist':
                ctrlRequirementForm.AddCandidateToList(sGrid, false, true);
                break;
            case 'reject':
                ctrlRequirementForm.AddCandidateToList(sGrid, false, false, true);
                break;
            case 'remove':
                ctrlRequirementForm.AddCandidateToList(sGrid, false, false, false, true);
                break;
            case 'addcandidate':
                ctrlRequirementForm.AddCandidateToShortlist();
                break;
        }
    },
    
    OpenCandidate: function (sGrid)
    {
        var lstContactID = TriSysSDK.Grid.GetListOfSelectedContactIdFromGrid(sGrid);
        if (lstContactID.length != 1)
        {
            TriSysApex.UI.ShowMessage("Please select a single candidate to open.");
            return;
        }

        TriSysApex.FormsManager.OpenForm("Contact", lstContactID[0]);
    },

    OpenCandidateCV: function (sGrid)
    {
        var lstContactID = TriSysSDK.Grid.GetListOfSelectedContactIdFromGrid(sGrid);
        if (lstContactID.length != 1)
        {
            TriSysApex.UI.ShowMessage("Please select a single candidate CV to open.");
            return;
        }

        // Call web service now to get the CV we require
        var payloadObject = {};

        payloadObject.URL = "ContactCV/GetCVFilePaths";

        payloadObject.OutboundDataPacket = {
            ContactId: lstContactID[0]
        };

        payloadObject.InboundDataFunction = function (data)
        {
            TriSysApex.UI.HideWait();
            var CContactCVPathsRequest = data;

            if (CContactCVPathsRequest)
            {
                if (CContactCVPathsRequest.Success)
                {
                    var sCVFileRef = CContactCVPathsRequest.CVFileRef;
                    ctrlRequirementForm.OpenCandidateCVFileRefCallback(sCVFileRef, "Original CV");
                }
                else
                {
                    TriSysApex.UI.errorAlert(CContactCVPathsRequest.ErrorMessage);
                }
            } else
            {
                // Something else has gone wrong!
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.ErrorHandlerRedirector('ctrlRequirementForm.OpenCandidateCV: ', request, status, error);
        };

        TriSysApex.UI.ShowWait(null, "Reading CV...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    OpenCandidateCVFileRefCallback: function (sPath, sName)
    {
        if (sPath)
		{
			// Sep 2018 and we have live editing of word documents!
			TriSysApex.Pages.FileManagerForm.FileOpenDrillDown(sPath);
            //TriSysSDK.Controls.FileManager.GetOpenFileURLFromWebService("TriSys CV Viewer", sPath, sName);
		}
        else
            TriSysApex.UI.ShowMessage("No CV found for the selected candidate.");
    },

    // Centralised function to move candidate into various lists
    AddCandidateToList: function(sGrid, bLonglist, bShortlist, bRejected, bRemoveRejected)
    {
        var lstContactID = TriSysSDK.Grid.GetListOfSelectedContactIdFromGrid(sGrid);
        ctrlRequirementForm.MoveCandidateListToSpecifiedGrid(lstContactID, bLonglist, bShortlist, bRejected, bRemoveRejected);
    },

    // The Web API which moves candidate into various lists
    MoveCandidateListToSpecifiedGrid: function (lstContactID, bLonglist, bShortlist, bRejected, bRemoveRejected, bManuallyAdded)
    {
        if (lstContactID.length >= 1)
        {
            if (TriSysAPI.Operators.isEmpty(bManuallyAdded))
                bManuallyAdded = false;

            var CMoveCandidateBetweenRequirementListRequest = {

                RequirementId: TriSysApex.Pages.RequirementForm.RequirementId,
                ContactIdList: lstContactID,

                AddToLonglist: bLonglist,
                AddToShortlist: bShortlist,
                AddToRejectedlist: bRejected,
                RemoveFromRejectedlist: bRemoveRejected,

                ManuallyAdded: bManuallyAdded
            };

            var payloadObject = {};

            payloadObject.URL = "Vacancy/MoveCandidateBetweenRequirementLists";

            payloadObject.OutboundDataPacket = CMoveCandidateBetweenRequirementListRequest;

            payloadObject.InboundDataFunction = function (data)
            {
                var CMoveCandidateBetweenRequirementListResponse = data;

                if (CMoveCandidateBetweenRequirementListResponse)
                {
                    if (CMoveCandidateBetweenRequirementListResponse.Success)
                    {
                        // Ask requirement form to remove selected rows and invalidate other grids.
                        // This is a suprisingly complicated piece of business logic.
                        ctrlRequirementForm.RemoveSelectedCandidates(bLonglist, bShortlist, bRejected, bRemoveRejected, bManuallyAdded, lstContactID);
                    }
                }
            };

            payloadObject.ErrorHandlerFunction = function (request, status, error)
            {
                TriSysApex.UI.errorAlert('ctrlRequirementForm.AddCandidateToList: ' + status + ": " + error + ". responseText: " + request.responseText);
            };

            TriSysAPI.Data.PostToWebAPI(payloadObject);
            return;
        }

        TriSysApex.UI.ShowMessage("Please select one or more candidates to long/short/rejected lists.");
    },

    // Called when a user runs an action from any menu.
    ActionInvocation: function (sEntityName)
    {
        switch (sEntityName)
        {
            case "Requirement":
                var requirementIds = [TriSysApex.Pages.RequirementForm.RequirementId];
                return requirementIds;

            case "Placement":
                var placementIds = TriSysSDK.Grid.GetSelectedMultipleRowsFromGrid('requirementForm-PlacementsGrid', "Placement_PlacementId");
                return placementIds;
        }
    },

    ActionInvocationCandidateSearchResults: function (sEntityName)
    {
        return ctrlRequirementForm.ActionInvocationCandidateGrid('requirementForm-CandidateSearchResultsGrid');
    },

    ActionInvocationCandidateLonglist: function (sEntityName)
    {
        return ctrlRequirementForm.ActionInvocationCandidateGrid('requirementForm-LonglistGrid');
    },

    ActionInvocationCandidateShortlist: function (sEntityName)
    {
        return ctrlRequirementForm.ActionInvocationCandidateGrid('requirementForm-ShortlistGrid', "ContactId");
    },

    ActionInvocationCandidateRejected: function (sEntityName)
    {
        return ctrlRequirementForm.ActionInvocationCandidateGrid('requirementForm-RejectedGrid');
    },

    ActionInvocationCandidateGrid: function (sGrid, sContactIdColumn)
    {
        if (!sContactIdColumn)
            sContactIdColumn = "Contact_ContactId";

        var contactIds = TriSysSDK.Grid.GetSelectedMultipleRowsFromGrid(sGrid, sContactIdColumn);
        return contactIds;
    },

    // To handle situation where we run an action against a grid on this form
    ActionInvocationMasterEntity: function()
    {
        var masterEntity = { EntityName: 'Requirement', EntityId: TriSysApex.Pages.RequirementForm.RequirementId };
        return masterEntity;
    },

    // Normally called when an action has been run on this form which may have moved candidates
    // between grids or changed stage (e.g. call, or CV send), hence refresh.
    ReloadCandidateGrids: function()
	{
        // De-select all from grids
        TriSysSDK.Grid.SelectAllRows("requirementForm-CandidateSearchResultsGrid", false);
        TriSysSDK.Grid.SelectAllRows("requirementForm-ShortlistGrid", false);
        TriSysSDK.Grid.SelectAllRows("requirementForm-RejectedGrid", false);

        TriSysSDK.Grid.RefreshData("requirementForm-CandidateSearchResultsGrid");
        ctrlRequirementForm.PopulateCandidateGrid('requirementForm-ShortlistGrid', false, true);
        ctrlRequirementForm.PopulateCandidateGrid('requirementForm-RejectedGrid', false, false, true);
	},

    // When a candidate is re-located between the numerous tabs/grids, refresh/invalidate appropriately
    // allowing the end user to always see the current status without having to manually refresh grids.
    //
    RemoveSelectedCandidates: function (bLonglist, bShortlist, bRejected, bRemoveRejected, bManuallyAdded, lstContactID)
	{
		var sGridRemoveCheckedRowsDiv = null;	// TriSysSDK.DocumentObjectModel.GetVisibleGridDiv();
		var sGridUnPopulate = null;
		var bViewingShortlist = false;
		var bViewingLonglist = false;
		var bViewingSearchResults = false;

		// New Feb 2018 - sheesh!
		var sSelectedTabId = TriSysSDK.EntityFormTabs.SelectedTabId('requirement-form-tab-nav-horizontal');

		switch (sSelectedTabId)
		{
			case "requirement-form-tab-search-results-li":
				sGridRemoveCheckedRowsDiv = "requirementForm-CandidateSearchResultsGrid";
				sGridUnPopulate = "requirementForm-ShortlistGrid";
				bViewingSearchResults = true;
				break;

		    case "requirement-form-tab-longlist-li":
		        sGridRemoveCheckedRowsDiv = "requirementForm-LonglistGrid";
		        sGridUnPopulate = "requirementForm-RejectedGrid";
		        bViewingLonglist = true;
		        break;

		    case "requirement-form-tab-shortlist-li":
				sGridRemoveCheckedRowsDiv = "requirementForm-ShortlistGrid";
				sGridUnPopulate = "requirementForm-RejectedGrid";
				bViewingShortlist = true;
				break;

			case "requirement-form-tab-rejected-li":
				sGridRemoveCheckedRowsDiv = "requirementForm-RejectedGrid";
				sGridUnPopulate = "requirementForm-CandidateSearchResultsGrid"
				break;
		}

		if (bShortlist && bManuallyAdded)
		{
			sGridUnPopulate = "requirementForm-ShortlistGrid";
			sGridRemoveCheckedRowsDiv = null;
		}
		else if (bLonglist)
		    sGridUnPopulate = "requirementForm-LonglistGrid";

		if (sGridRemoveCheckedRowsDiv)
			TriSysSDK.Grid.RemoveCheckedRows(sGridRemoveCheckedRowsDiv);

		if (sGridUnPopulate)
			TriSysApex.Forms.EntityForm.unPopulateFormGrids("Requirement", sGridUnPopulate);		

		if (bRejected || bRemoveRejected)
			TriSysApex.Forms.EntityForm.unPopulateFormGrids("Requirement", "requirementForm-CandidateSearchResultsGrid");

		if (bShortlist && bManuallyAdded)
		{
			// Untested? Dec 2018 fix applied to handle manually adding a candidate to the shortlist!
			TriSysSDK.Grid.RefreshData(sGridUnPopulate);
		}
		//else if (bLonglist)
	    //    TriSysSDK.Grid.RefreshData(sGridUnPopulate);

	    // 26 Jan 2023: If we added a candidate to the shortlist who is already on the rejected list then 
	    // Web API will remove the rejected candidate, hence we must force that to be refreshed next tab click
		if(bViewingShortlist)
		    TriSysSDK.Grid.RefreshData("requirementForm-RejectedGrid");

        // 27 Jan 2023: If we added a candidate from the longlist to the shortlist, then invalidate the shortlist grid
		if (bShortlist && bViewingLonglist)
		    TriSysSDK.Grid.RefreshData("requirementForm-ShortlistGrid");

		if (bRejected && bViewingSearchResults)
		    TriSysSDK.Grid.RefreshData("requirementForm-RejectedGrid");

	    // 27 Jan 2023: Alert user for specific operations only as others handled in actions
		if (bRejected)
		    ctrlRequirementForm.PostInvocationListOperation(lstContactID, "rejected list");
		else if (bRemoveRejected)
		    ctrlRequirementForm.PostInvocationListOperation(lstContactID, "rejected list", "Removed", "from");

        // 27 Jan 2023: Invalidate the notes/history grids also because the Web API generates tasks for these operations
		TriSysSDK.Grid.RefreshData("requirementForm-NotesHistoryGrid");
	},

    AddCandidateToShortlist: function ()
    {
        // Popup candidate selection dialogue with callback
        var fnSelectCandidate = function (selectedRow)
        {
            if (!selectedRow)
                return;

            // Read the fields we require from the selected row
            var lCandidateId = selectedRow.ContactId;
            
            // Add to the shortlist grid
            var lstContactID = [lCandidateId];
            var bManuallyAdded = true;
            ctrlRequirementForm.MoveCandidateListToSpecifiedGrid(lstContactID, false, true, false, false, bManuallyAdded);

            return true;
        };

        TriSysApex.ModalDialogue.CandidateContacts.Select(fnSelectCandidate);
    },

    JobTitleLookup: function ()
    {
        var sJobTitleField = 'RequirementConfigFields_JobTitle';
        var sJobTitle = TriSysSDK.CShowForm.GetJobTitleFromField(sJobTitleField);
        TriSysSDK.JobTitle.Lookup(sJobTitle, sJobTitleField);
    },

    PlacementGridFileMenuCallback: function (sFileMenuID)
    {
        var fm = TriSysSDK.FormMenus.Constants;
        var sGrid = 'requirementForm-PlacementsGrid';
        var lPlacementId = TriSysSDK.Grid.GetSelectedSingletonRowRecordIdFromGrid(sGrid, "Placement_PlacementId", "placement", false);

        switch (sFileMenuID)
        {
            case fm.File_Open:
                if (lPlacementId > 0)
                    TriSysApex.FormsManager.OpenForm("Placement", lPlacementId);
                break;

            case fm.File_Delete:
                // TODO
                break;
        }
    },

    // Allow user to re-assign user only if they are the owner or administrator
    // unless the "Requirement: Allow Ownership Change" system setting is set to true
    // in which case anyone can change ownership.
    ReAssignUser: function()
    {
        var sUser = TriSysSDK.CShowForm.GetTextFromCombo('Requirement_UserId');

        var userCredentials = TriSysApex.LoginCredentials.UserCredentials();
        var sLoggedInUserFullName = userCredentials.LoggedInUser.Contact.FullName;

        var bAllowOwnershipChange = TriSysAPI.Operators.stringToBoolean(TriSysApex.Cache.SystemSettingManager.GetValue("Requirement: Allow Ownership Change", false));
        var bCanChangeOwnership = (sUser == sLoggedInUserFullName) || bAllowOwnershipChange;

        if (!bCanChangeOwnership)
        {
            TriSysApex.UI.ShowMessage("You are not the owner of this requirement so cannot change the user.");
            return;
        }

        // Popup user selection dialogue
        var fnSelectUser = function (selectedRow)
        {
            if (!selectedRow)
                return false;

            // Read the fields we require from the selected row
            var lUserId = selectedRow.UserId;
            var sFullName = selectedRow.FullName;
            if (lUserId <= 0)
                return false;

            setTimeout(function ()
            {
                // Send to web service now
                ctrlRequirementForm.ReAssignUserViaWebService(lUserId, sFullName);

            }, 50);

            // Force dialogue to close after selection
            return true;
        };

        // Do not show users who are locked
        var options = { 
            Title: "Select the new Requirement Owner",
            NotLocked: true
        };

        TriSysApex.ModalDialogue.Users.Select(fnSelectUser, options);
    },

    ReAssignUserViaWebService: function (lUserId, sFullName)
    {
        var payloadObject = {};

        payloadObject.URL = "Requirement/ReAssignUser";

        payloadObject.OutboundDataPacket = {
            RequirementId: TriSysApex.Pages.RequirementForm.RequirementId,
            UserId: lUserId
        };

        payloadObject.InboundDataFunction = function (CReAssignRequirementUserResponse)
        {
            TriSysApex.UI.HideWait();

            if (CReAssignRequirementUserResponse)
            {
                if (CReAssignRequirementUserResponse.Success)
                {
					TriSysSDK.CShowForm.SetTextInCombo('Requirement_UserId', sFullName);
					TriSysApex.Pages.RequirementForm.UserId = lUserId;

                    // 13 Feb 2022: Custom business rules e.g. First Technical
					if (typeof (ApexCustomerModule) != TriSysApex.Constants.Undefined &&
                        typeof (ApexCustomerModule.RequirementRules) != TriSysApex.Constants.Undefined &&
                        typeof (ApexCustomerModule.RequirementRules.AfterReAssigningOwnerUser) != TriSysApex.Constants.Undefined)
					{
					    try {
					            ApexCustomerModule.RequirementRules.AfterReAssigningOwnerUser(TriSysApex.Pages.RequirementForm.RequirementId,
                                                                                            lUserId, sFullName);
					    }
					    catch (e) {
					        // Programmer error
					    }
					}					
                }
                else
                {
                    TriSysApex.UI.errorAlert(CReAssignRequirementUserResponse.ErrorMessage);
                }
            } 
            else
            {
                // Something else has gone wrong!
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.ErrorHandlerRedirector('ctrlRequirementForm.ReAssignUserViaWebService: ', request, status, error);
        };

        TriSysApex.UI.ShowWait(null, "Updating...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    ReAssignClientContactViaWebService: function (lRequirementId, lContactId, fnCompleted)
    {
        var payloadObject = {};

        payloadObject.URL = "Requirement/ReAssignClientContact";

        payloadObject.OutboundDataPacket = {
            RequirementId: lRequirementId,
            ContactId: lContactId
        };

        payloadObject.InboundDataFunction = function (CReAssignRequirementClientContactResponse)
        {
            TriSysApex.UI.HideWait();

            if (CReAssignRequirementClientContactResponse)
            {
                if (CReAssignRequirementClientContactResponse.Success)
                {
                    fnCompleted();
                }
                else
                {
                    TriSysApex.UI.errorAlert(CReAssignRequirementClientContactResponse.ErrorMessage);
                }
            } else
            {
                // Something else has gone wrong!
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.ErrorHandlerRedirector('ctrlRequirementForm.ReAssignClientContactViaWebService: ', request, status, error);
        };

        TriSysApex.UI.ShowWait(null, "Updating...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    EditWebSiteJobDetails: function()
    {
        var sFieldID = 'RequirementConfigFields_WebText';
        var fieldElement = $('#' + sFieldID);
        var sHTML = fieldElement.val();

        var fnSavedChanges = function (sEditedHTML)
        {
            fieldElement.val(sEditedHTML);
        };

        TriSysSDK.Controls.FileManager.OpenUserFriendlyHTMLEditor("Edit External/Web Site Job Details", sHTML, fnSavedChanges);
    },

    EditInternalComments: function()
    {
        var txt = $('#RequirementConfigFields_Comments');
        var sComments = txt.val();

        var fnEditedComments = function (sText)
        {
            txt.val(sText);
            return true;
        };

        var options = {
            Label: "Internal Comments",
            Value: sComments
        };
        TriSysApex.ModalDialogue.BigEdit.Popup("Edit Requirement " + options.Label, "gi-pen", fnEditedComments, options);
	},

	PreInvocationShortlistAction: function (lstContactID)
	{
		var bLonglist = false, bShortlist = true, bRejected = false, bRemoveRejected = false;
		ctrlRequirementForm.MoveCandidateListToSpecifiedGrid(lstContactID, bLonglist, bShortlist);

		ctrlRequirementForm.PostInvocationListOperation(lstContactID, "shortlist");
	},

	PreInvocationLonglistAction: function (lstContactID)
	{
	    var bLonglist = true, bShortlist = false, bRejected = false, bRemoveRejected = false;
	    ctrlRequirementForm.MoveCandidateListToSpecifiedGrid(lstContactID, bLonglist, bShortlist);

	    ctrlRequirementForm.PostInvocationListOperation(lstContactID, "longlist");
	},

    // Alert user for shortlist operation
	PostInvocationListOperation: function(lstContactID, sWhatList, sOperation, sToOrFrom)
	{
	    if (!sOperation)
	        sOperation = "Added";
	    if (!sToOrFrom)
	        sToOrFrom = "to";

	    var sMessage = sOperation + " " + lstContactID.length + " contact" + (lstContactID.length == 1 ? "" : "s") + " " + sToOrFrom + " " + sWhatList + ".";
	    //TriSysApex.UI.ShowMessage(sMessage, "Add to Longlist Action"); 27 Jan 2023: Replaced with Toaster
	    TriSysApex.Toasters.Success(sMessage);
	},

	// Hide standard boolean search tree and replace with 3rd party URL
	Display3rdPartySearchInEyeFrame: function (lRequirementId, sURL, sTitle)
	{
		// Hide standard search
		setTimeout(function () { $("#requirement-candidate-search-criteria-id-0").hide(); }, 500);
		setTimeout(function () { $("#requirement-candidate-search-criteria-id-" + lRequirementId).hide(); }, 500);

		// Populate the iFrame for external searches
		$("#requirement-candidate-search-3rd-party-block").show();
		$("#requirement-candidate-search-3rd-party-block-title").html(sTitle);

		var iframe = document.getElementById('requirement-candidate-search-3rd-party-block-iframe');
		iframe.src = sURL;

		// Hide the search results button
		$('#requirement-form-tab-search-results-li').hide();

		// Click the search criteria button
		$('#requirement-form-tab-search-criteria-li').trigger('click');

		// Force correct panel to be displayed
		TriSysSDK.Controls.Button.Click('requirement-form-tab-search-results-li');
	},

	AvailableJobBoardMenuItems: function ()
	{
	    var sBroadbeanLoginName = TriSysApex.Cache.UserSettingManager.GetValue("BroadbeanLoginName");
	    var sBroadbeanPassword = TriSysApex.Cache.UserSettingManager.GetValue("BroadbeanPassword");
	    var sLogicMelonLoginName = TriSysApex.Cache.UserSettingManager.GetValue("LogicMelonLoginName");
	    var sLogicMelonPassword = TriSysApex.Cache.UserSettingManager.GetValue("LogicMelonPassword");

		var sPrefix = 'jobBoard-';
		var items = [];

		if (sBroadbeanLoginName && sBroadbeanPassword)
			items.push(sPrefix + 'Broadbean');

		if (sLogicMelonLoginName && sLogicMelonPassword)
			items.push(sPrefix + 'LogicMelon');

		if (items.length == 0)
		{
			// Instruct recruiter as to the benefits of this
			items.push(sPrefix + ctrlRequirementForm._JobBoardWhatIsThis);
		}

		return items;
	},

	_JobBoardWhatIsThis: 'None',

	JobBoardMenuCallback: function (sMenuItemID)
	{
		var sSufffix = '-requirementForm-ShortlistGrid';
		var parts = sMenuItemID.split(sSufffix);
		sMenuItemID = parts[0];
		parts = sMenuItemID.split('jobBoard-');
		var sJobBoard = parts[1];
		if (!sJobBoard)
			return;

		if (sJobBoard == ctrlRequirementForm._JobBoardWhatIsThis)
		{
			var sInstructions = "If you use job boards and have a subscription to a 'job-broadcaster' such as Broadbean, LogicMelon or Idibu, " +
				"you can input your credentials into your user options to pull applicants from job boards directly into your shortlist.";
			TriSysApex.UI.ShowMessage(sInstructions, "Job Board Applicants");
			return;
		}

		var requirement = {
			RequirementId: TriSysApex.Pages.RequirementForm.RequirementId,
			Reference: $('#RequirementConfigFields_RequirementReference').val(),
			JobTitle: $('#RequirementConfigFields_JobTitle').val(),
			JobBroadcaster: sJobBoard
		};

		// Feb 2018: Load the .js BEFORE the user control .html
		var fnLoadModal = function ()
		{
			var parametersObject = new TriSysApex.UI.ShowMessageParameters();
			parametersObject.Title = "Job Board Applicants";
			parametersObject.Maximize = true;
			parametersObject.CloseTopRightButton = true;
			parametersObject.Image = "gi-globe_af";

			parametersObject.ContentURL = TriSysApex.CustomFormsAndComponents.UserControlPath('ctrlJobBoardApplicants.html');

			// Buttons
			parametersObject.ButtonLeftVisible = true;
			parametersObject.ButtonLeftText = "View Applicants in " + sJobBoard;
			parametersObject.ButtonLeftFunction = function ()
			{
				ctrlJobBoardApplicants.OpenJobAdvert();
				return false;
			};
			parametersObject.ButtonRightVisible = true;
			parametersObject.ButtonRightText = "Close";
			parametersObject.ButtonRightFunction = function ()
			{
				return true;
			};

			// Callback
			parametersObject.OnLoadCallback = function ()
			{
				ctrlJobBoardApplicants.Load(requirement);
			};

			TriSysApex.UI.PopupMessage(parametersObject);
		};

		TriSysApex.WhiteLabelling.LoadJavascriptFile('js/pages/ctrlJobBoardApplicants.js', null, fnLoadModal);		
	}

};	// ctrlRequirementForm

$(document).ready(function ()
{
    ctrlRequirementForm.Load();
});

