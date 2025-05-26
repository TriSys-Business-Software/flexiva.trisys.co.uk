var ctrlPlacementForm =
{
    Load: function ()
    {
        // Form Tabs
        TriSysSDK.EntityFormTabs.AddClickEventHandlers('placement-form-tab-nav-horizontal', true);
        TriSysSDK.Controls.Button.Click('placement-form-tab-contract');

        // Form Menu
        var hideMenuItemPrefixes = ['file-menu-saveas'];
        //TriSysSDK.FormMenus.DrawFileMenu('placementForm-FileMenu', 'placementForm', ctrlPlacementForm.FileMenuCallback, hideMenuItemPrefixes);

        // Actions menus
        if (TriSysApex.Device.isPhone())
        {
            $('#placementForm-ActionsMenu').hide();
        }
        else
        {
            var sCallbackFunction = 'ctrlPlacementForm.ActionInvocation';
            var sMasterEntityCallbackFunction = 'ctrlPlacementForm.ActionInvocationMasterEntity';
            TriSysActions.Menus.Draw('placementForm-ActionsMenu', 'Placement', sCallbackFunction);

            TriSysSDK.FormMenus.DrawGridMenu('placementLineManagerGridMenu', 'placementForm-LineManagerGrid');

            TriSysSDK.FormMenus.DrawGridMenu('placementTimesheetsGridMenu', 'placementForm-TimesheetGrid');
            TriSysActions.Menus.Draw('placementTimesheetsActionsMenu', 'Timesheet', sCallbackFunction, sMasterEntityCallbackFunction);
        }

        // Show standard menus for grids
        var sGrid = 'placementForm-NotesHistoryGrid';
        //TriSysSDK.FormMenus.DrawGridFileMenu('placementNotesHistoryFileMenu', sGrid, ctrlPlacementForm.NotesHistoryGridFileMenuCallback);
        TriSysSDK.FormMenus.DrawGridMenu('placementNotesHistoryGridMenu', sGrid);

        sGrid = 'placementForm-ScheduledTasksGrid';
        //TriSysSDK.FormMenus.DrawGridFileMenu('placementScheduledTasksFileMenu', sGrid, ctrlPlacementForm.ScheduledTaskGridFileMenuCallback);
        TriSysSDK.FormMenus.DrawGridMenu('placementScheduledTasksGridMenu', sGrid);

        // See TriSysApex.Placements.Load which is specified in forms.json for actual data read
        var fnCallbackAfterLoadingSalary = function ()
        {
            // 01 Apr 2021: Custom fields tab
            TriSysSDK.CShowForm.CustomFieldsTab.Load("placement-form-customfields", "placement-form-tab-custom-caption",
                                                        "Placement");

            // Tell CShowForm that we are initialised and it can customise the widgets
            TriSysSDK.CShowForm.InitialiseFields("Placement");

            // See TriSysApex.Requirements.Load which is specified in forms.json for actual data read
        };
        TriSysSDK.PermanentSalary.Load("Placement", TriSysApex.Pages.PlacementForm.PlacementId, 'placement-form-permanent-salary', fnCallbackAfterLoadingSalary);

        // Job title no-cache 
        if (!TriSysSDK.CShowForm.JobTitlesCached())
        {
            $('#tr-PlacementConfigFields_JobTitle').show();

            // Capture enter key to do lookup
            $('#PlacementConfigFields_JobTitle').keyup(function (e)
            {
                if (e.keyCode == 13)
                    ctrlPlacementForm.JobTitleLookup();
            });
        }

        // Be clever with duration weeks
        // Subscribe to field change events in order to calculate the duration in weeks
        TriSysApex.FieldEvents.AddDateChangeFieldOfInterest('PlacementConfigFields_StartDate', ctrlPlacementForm.CalculateDurationWeeks);
        TriSysApex.FieldEvents.AddDateChangeFieldOfInterest('PlacementConfigFields_EndDate', ctrlPlacementForm.CalculateDurationWeeks);
    },

    // We get called when the user switched buttons to change view
    TabButtonCallback: function(sTabID)
    {
        switch (sTabID)
        {
            case 'placement-form-panel-contract':
                if (TriSysApex.Forms.EntityForm.isGridPopulated("Placement", sTabID))
                    return;

                TriSysSDK.ContractRates.Load("Placement", TriSysApex.Pages.PlacementForm.PlacementId, 'placement-form-contract-rates');
                break;

            case 'placement-form-panel-attributes':
                if (TriSysApex.Forms.EntityForm.isGridPopulated("Placement", sTabID))
                    return;

                TriSysSDK.Attributes.Load("Placement", TriSysApex.Pages.PlacementForm.PlacementId, 'placement-form-attributes');
                break;

            case 'placement-form-panel-backoffice':
                if (TriSysApex.Forms.EntityForm.isGridPopulated("Placement", sTabID))
                    return;

                ctrlPlacementForm.LoadLineManagers();
                break;

            case 'placement-form-panel-timesheets':
                if (TriSysApex.Forms.EntityForm.isGridPopulated("Placement", sTabID))
                    return;

                TriSysApex.Pages.PlacementForm.LoadTimesheetGrid('placementForm-TimesheetGrid');
                break;

            case 'placement-form-panel-documentlibrary':
                if (TriSysApex.Forms.EntityForm.isGridPopulated("Placement", sTabID))
                    return;

                TriSysSDK.DocumentLibrary.Load("Placement", TriSysApex.Pages.PlacementForm.PlacementId, 'placement-form-documentlibrary');
                break;

            case 'placement-form-panel-noteshistory':
                TriSysApex.Pages.PlacementForm.LoadNotesHistoryGrid('placementForm-NotesHistoryGrid', null);
                break;
            case 'placement-form-panel-scheduledtasks':
                TriSysApex.Pages.PlacementForm.LoadScheduledTasksGrid('placementForm-ScheduledTasksGrid', null);
                break;

			case 'placement-form-panel-amendments':
				ctrlPlacementForm.LoadAmendmentsGrid('placementForm-AmendmentsGrid');
				break;
        }
    },

    FileMenuCallback: function(sFileMenuID)
    {
        var fm = TriSysSDK.FormMenus.Constants;

        switch (sFileMenuID)
        {
            case fm.File_New:
                TriSysApex.Pages.PlacementForm.NewRecord();
                break;
            case fm.File_Open:
                TriSysApex.Pages.PlacementForm.OpenFindDialogue();
                break;
            case fm.File_Save:
                TriSysApex.Pages.PlacementForm.SaveRecord();
                break;
            case fm.File_Save_As:
                TriSysApex.UI.ShowMessage("Save Placement As");
                break;
            case fm.File_Delete:
                TriSysApex.Pages.PlacementForm.DeleteRecord();
                break;
            case fm.File_Close:
                TriSysApex.FormsManager.CloseCurrentForm();     // TODO: Dirty check!
                break;
        }
    },

    LineManagerGridFileMenuCallback: function (sFileMenuID)
    {
        var fm = TriSysSDK.FormMenus.Constants;
        var sGrid = "placementForm-LineManagerGrid";
        var lContactId = TriSysSDK.Grid.GetSelectedSingletonRowFieldValueFromGrid(sGrid, "ContactId", "Contact", (sFileMenuID != fm.File_New));
        if (lContactId <= 0 && sFileMenuID != fm.File_New)
            return;

        switch (sFileMenuID)
        {
            case fm.File_New:
                ctrlPlacementForm.AddCompanyContactToLineManager();
                break;

            case 'set-primary':
                ctrlPlacementForm.AddContactToLineManagerWebAPI(lContactId, true);
                break;

            case fm.File_Delete:
                var sFullName = TriSysSDK.Grid.GetSelectedSingletonRowFieldValueFromGrid(sGrid, "FullName", "Contact");
                ctrlPlacementForm.DeleteLineManager(lContactId, sFullName);
                break;
        }
    },

    TimesheetsGridFileMenuCallback: function (sFileMenuID)
    {
        var fm = TriSysSDK.FormMenus.Constants;
        var sGrid = "placementForm-TimesheetGrid";
        var lTimesheetId = TriSysSDK.Grid.GetSelectedSingletonRowFieldValueFromGrid(sGrid, "Timesheet_TimesheetId", "Timesheet", (sFileMenuID != fm.File_New));
        if (lTimesheetId <= 0 && sFileMenuID != fm.File_New)
            return;

        switch (sFileMenuID)
        {
            case fm.File_Open:
                TriSysApex.FormsManager.OpenForm("Timesheet", lTimesheetId);
                break;

            case fm.File_Delete:
                TriSysApex.UI.ShowMessage("ToDo");
                break;
        }
    },

    NotesHistoryGridFileMenuCallback: function(sFileMenuID)
    {
        ctrlPlacementForm.TaskGridFileMenuCallback(sFileMenuID, 'placementForm-NotesHistoryGrid', false);
    },

    ScheduledTaskGridFileMenuCallback: function(sFileMenuID)
    {
        ctrlPlacementForm.TaskGridFileMenuCallback(sFileMenuID, 'placementForm-ScheduledTasksGrid', true);
    },

    TaskGridFileMenuCallback: function(sFileMenuID, sGrid, bScheduled)
    {
        var fm = TriSysSDK.FormMenus.Constants;
        var lTaskId = null;

        switch (sFileMenuID)
        {
            case fm.File_New:
                ctrlPlacementForm.NewTask(bScheduled)
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

    NewTask: function(bScheduled)
    {
        // Get the placement and contact from this placement and pass into the task form
        var lPlacementId = TriSysApex.Pages.PlacementForm.PlacementId;
        var lContactId = TriSysApex.Pages.PlacementForm.ContactId;
        var sFullName = $('#Placement_ContactId').val();
        var sCompany = $('#Placement_CompanyId').val();
        var sCandidate = $('#PlacementConfigFields_Candidate').val();
        var sJobTitle = TriSysSDK.CShowForm.GetJobTitleFromField('PlacementConfigFields_JobTitle');
        var sContactType = 'Client';

        var params = new TriSysApex.ModalDialogue.Task.ShowParameters();
        params.Scheduled = bScheduled;

        var clientContact = {
            ContactId: lContactId,
            FullName: sFullName,
            CompanyName: sCompany,
            JobTitle: '?',      // TODO
            ContactType: sContactType
        };
        params.Contacts.push(clientContact);

        var candidateContact = {
            ContactId: TriSysApex.Pages.PlacementForm.CandidateId,
            FullName: sCandidate,
            CompanyName: '',
            JobTitle: sJobTitle,
            ContactType: 'Candidate'
        };
        params.Contacts.push(candidateContact);

        var placementLink = {
            Name: 'Placement',
            RecordId: lPlacementId,
            Description: $('#PlacementConfigFields_Reference').val() + ": " + TriSysSDK.CShowForm.GetJobTitleFromField('PlacementConfigFields_JobTitle') +
                            ", " + sCandidate + " at " + sCompany
        }
        params.Links.push(placementLink);

        TriSysApex.ModalDialogue.Task.Show(params);
    },

    // Called when a user runs an action from any menu.
    ActionInvocation: function (sEntityName)
    {
        switch (sEntityName)
        {
            case "Placement":
                var placementIds = [TriSysApex.Pages.PlacementForm.PlacementId];
                return placementIds;

            case "Timesheet":
                var timesheetIds = TriSysSDK.Grid.GetSelectedMultipleRowsFromGrid('placementForm-TimesheetGrid', "Timesheet_TimesheetId");
                return timesheetIds;
        }
    },

    // To handle situation where we run an action against a grid on this form
    ActionInvocationMasterEntity: function ()
    {
        var masterEntity = { EntityName: 'Placement', EntityId: TriSysApex.Pages.PlacementForm.PlacementId };
        return masterEntity;
    },

    JobTitleLookup: function ()
    {
        var sJobTitleField = 'PlacementConfigFields_JobTitle';
        var sJobTitle = TriSysSDK.CShowForm.GetJobTitleFromField(sJobTitleField);
        TriSysSDK.JobTitle.Lookup(sJobTitle, sJobTitleField);
    },

    LoadLineManagers: function()
    {
        ctrlPlacementForm.LoadLineManagerGrid(TriSysApex.Pages.PlacementForm.PlacementId, 'placementForm-LineManagerGrid');
    },

    LoadLineManagerGrid: function(lPlacementId, sGridId)
    {
        // Call web service to get the list of all line managers
        var payloadObject = {};

        // Call the API to submit the data to the server
        payloadObject.URL = "Placement/ReadLineManagers";

        var CPlacementReadLineManagersRequest = { PlacementId: lPlacementId };

        payloadObject.OutboundDataPacket = CPlacementReadLineManagersRequest;

        payloadObject.InboundDataFunction = function (CPlacementReadLineManagersResponse)
        {
            if (CPlacementReadLineManagersResponse)
            {
                if (CPlacementReadLineManagersResponse.Success)
                {
                    ctrlPlacementForm.DisplayLineManagers(CPlacementReadLineManagersResponse.LineManagers, sGridId);
                    ctrlPlacementForm.TimesheetFrequencyEnable(CPlacementReadLineManagersResponse.TimesheetCount);

                    return;
                }
                else
                    TriSysApex.UI.ShowMessage(CPlacementReadLineManagersResponse.ErrorMessage);
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.errorAlert('ctrlPlacementForm.LoadLineManagerGrid: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    DisplayLineManagers: function (lineManagers, sGridId)
    {
        var sGridName = sGridId - '-GridInstance';

        var dataSource = [];
        for (var i = 0; i < lineManagers.length; i++)
        {
            var lineManager = lineManagers[i];
            var contact = lineManager.Contact;
            dataSource.push({
                ContactId: contact.ContactId,
                FullName: contact.FullName,
                JobTitle: contact.JobTitle,
                Address: contact.CompanyAddressStreet + ", " + contact.CompanyAddressCity,
                Primary: lineManager.Primary ? 'Yes' : 'No'
            });
        }

        TriSysSDK.Grid.VirtualMode({
            Div: sGridId,
            ID: sGridName,
            Title: "Line Managers",
            RecordsPerPage: TriSysApex.UserOptions.RecordsPerPage(),
            PopulationByObject: dataSource,
            Columns: [
                { field: "ContactId", title: "ContactId", type: "number", hidden: true },
                { field: "FullName", title: "Contact", type: "string" },
                { field: "JobTitle", title: "Job Title", type: "string" },
                { field: "Address", title: "Work Address", type: "string" },
                { field: "Primary", title: "Primary", type: "string" }
            ],
            DrillDownFunction: null,
            MultiRowSelect: true,
			Grouping: TriSysApex.UserOptions.GridGrouping()
        });
    },

    AddCompanyContactToLineManager: function ()
    {
        // Popup company contact selection dialogue with callback
        var fnSelectCompanyContact = function (selectedRow)
        {
            if (!selectedRow)
                return;

            // Read the fields we require from the selected row
            var lContactId = selectedRow.ContactId;

            // Send this transaction to the server
            if (lContactId > 0)
                ctrlPlacementForm.AddContactToLineManagerWebAPI(lContactId, false);

            return true;
        };

        var sCompany = $('#Placement_CompanyId').val();
        TriSysApex.ModalDialogue.CompanyContacts.Select(TriSysApex.Pages.PlacementForm.CompanyId, sCompany, null, fnSelectCompanyContact);
    },

    AddContactToLineManagerWebAPI: function (lContactId, bPrimary)
    {
        // Call web service
        var payloadObject = {};

        // Call the API to submit the data to the server
        payloadObject.URL = "Placement/AddLineManager";

        var lPlacementId = TriSysApex.Pages.PlacementForm.PlacementId;
        var CPlacementAddLineManagerRequest = { PlacementId: lPlacementId, ContactId: lContactId, Primary: bPrimary };

        payloadObject.OutboundDataPacket = CPlacementAddLineManagerRequest;

        payloadObject.InboundDataFunction = function (CPlacementAddLineManagerResponse)
        {
            if (CPlacementAddLineManagerResponse)
            {
                if (CPlacementAddLineManagerResponse.Success)
                {
                    // Refresh the grid 
                    ctrlPlacementForm.LoadLineManagers();
                    return;
                }
                else
                    TriSysApex.UI.ShowMessage(CPlacementAddLineManagerResponse.ErrorMessage);
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.errorAlert('ctrlPlacementForm.AddContactToLineManagerWebAPI: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    DeleteLineManager: function(lContactId, sFullName)
    {
        var sMessage = "Are you sure that you remove " + sFullName + " as a line manager for this placement?";
        TriSysApex.UI.questionYesNo(sMessage, "Remove Line Manager", "Yes",
            function ()
            {
                ctrlPlacementForm.DeleteLineManagerFromWebAPI(lContactId);
                return true;
            },
            "No");
    },

    DeleteLineManagerFromWebAPI: function(lContactId)
    {
        var payloadObject = {};

        // Call the API to submit the data to the server
        payloadObject.URL = "Placement/DeleteLineManager";

        var lPlacementId = TriSysApex.Pages.PlacementForm.PlacementId;
        var CPlacementDeleteLineManagerRequest = { PlacementId: lPlacementId, ContactId: lContactId };

        payloadObject.OutboundDataPacket = CPlacementDeleteLineManagerRequest;

        payloadObject.InboundDataFunction = function (CPlacementDeleteLineManagerResponse)
        {
            if (CPlacementDeleteLineManagerResponse)
            {
                if (CPlacementDeleteLineManagerResponse.Success)
                {
                    // Refresh the grid 
                    ctrlPlacementForm.LoadLineManagers();
                    return;
                }
                else
                    TriSysApex.UI.ShowMessage(CPlacementDeleteLineManagerResponse.ErrorMessage);
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.errorAlert('ctrlPlacementForm.DeleteLineManagerFromWebAPI: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    CalculateDurationWeeks: function (sFieldID, fValue)
    {
        var sDurationWeeks = '';
        var dtStart = new moment(TriSysSDK.CShowForm.getDatePickerValue('PlacementConfigFields_StartDate'));
        var dtEnd = new moment(TriSysSDK.CShowForm.getDatePickerValue('PlacementConfigFields_EndDate'));

        var iWeeks = dtEnd.diff(dtStart, 'weeks');

        if (iWeeks >= 0)
            sDurationWeeks = iWeeks;

        $('#PlacementConfigFields_DurationInWeeks').val(sDurationWeeks);
    },

    EditDescription: function ()
    {
        var txt = $('#PlacementConfigFields_Description');
        var sDescription = txt.val();

        var fnEditedDescription = function (sText)
        {
            txt.val(sText);
            return true;
        };

        var options = {
            Label: "Description",
            Value: sDescription
        };
        TriSysApex.ModalDialogue.BigEdit.Popup("Edit Placement " + options.Label, "gi-pen", fnEditedDescription, options);
    },

	LoadAmendmentsGrid: function(sGridId)
	{
		if (TriSysApex.Forms.EntityForm.isGridPopulated("Placement", sGridId))
            return;

        var lPlacementId = TriSysApex.Pages.PlacementForm.PlacementId;

        var fnPopulationByFunction = {
            API: "Amendments/ListForEntityRecord",	// The Web API Controller/Function

            // The additional parameters passed into the function not including the paging metrics
            Parameters: function (request)
            {
                request.RecordId = lPlacementId;
				request.EntityName = "Placement";
            },

            DataTableFunction: function (response)  // Called to get a suitable data table for the grid to display
            {
                return response.List;				// The list of records from the Web API
            }
        };

        var columns = [
                { field: "ApplicationName", title: "App", type: "string", width: 160 },
                { field: "UpdatedBy", title: "Updated By", type: "string", width: 220 },
                { field: "DateChanged", title: "Updated", type: "date", format: "{0:dd MMM yyyy }", width: 110 },
                { field: "FieldName", title: "Field Name", type: "string", width: 220 },
                { field: "OldValue", title: "Old Value", type: "string" },
				{ field: "NewValue", title: "New Value", type: "string" }
        ];

        TriSysSDK.Grid.VirtualMode({
            Div: sGridId,
            ID: sGridId + "-Grid",
            Title: "Amendments",
            RecordsPerPage: TriSysApex.UserOptions.RecordsPerPage(),
			PopulationByFunction: fnPopulationByFunction,
            Columns: columns,

            MobileVisibleColumns: [
                {
                    field: "ApplicationName"
                }
            ],
            MobileRowTemplate: '<td colspan="1"><strong>#: ApplicationName #</strong><br />' +
                            '<i>#: UpdatedBy #</i><br />' +
							'#: DateChanged #<br />' +
							'#: FieldName #<br />' +
							'#: OldValue #<br />' +
							'#: NewValue #' +
							'</td>',

            MultiRowSelect: false,
            Grouping: false,
            ColumnFilters: true
        });
	},

    // Nov 2020: Copied logic from requirement.js
    // Allow user to re-assign user only if they are the owner or administrator
    // unless the "Placement: Allow Ownership Change" system setting is set to true
    // in which case anyone can change ownership.
	ReAssignUser: function ()
	{
	    var sUser = TriSysSDK.CShowForm.GetTextFromCombo('Placement_UserId');

	    var userCredentials = TriSysApex.LoginCredentials.UserCredentials();
	    var sLoggedInUserFullName = userCredentials.LoggedInUser.Contact.FullName;

	    var bAllowOwnershipChange = TriSysAPI.Operators.stringToBoolean(TriSysApex.Cache.SystemSettingManager.GetValue("Placement: Allow Ownership Change", false));
	    var bCanChangeOwnership = (sUser == sLoggedInUserFullName) || bAllowOwnershipChange;

	    if (!bCanChangeOwnership) {
	        TriSysApex.UI.ShowMessage("You are not the owner of this placement so cannot change the user.");
	        return;
	    }

	    // Popup user selection dialogue
	    var fnSelectUser = function (selectedRow) {
	        if (!selectedRow)
	            return false;

	        // Read the fields we require from the selected row
	        var lUserId = selectedRow.UserId;
	        var sFullName = selectedRow.FullName;
	        if (lUserId <= 0)
	            return false;

	        setTimeout(function () {
	            // Send to web service now
	            ctrlPlacementForm.ReAssignUserViaWebService(lUserId, sFullName);

	        }, 50);

	        // Force dialogue to close after selection
	        return true;
	    };

	    TriSysApex.ModalDialogue.Users.Select(fnSelectUser, { Title: "Select the new Placement Owner", NotLocked: true });
	},

	ReAssignUserViaWebService: function (lUserId, sFullName)
	{
	    var payloadObject = {};

	    payloadObject.URL = "Placement/ReAssignUser";

	    payloadObject.OutboundDataPacket = {
	        PlacementId: TriSysApex.Pages.PlacementForm.PlacementId,
	        UserId: lUserId
	    };

	    payloadObject.InboundDataFunction = function (CReAssignPlacementUserResponse)
	    {
	        TriSysApex.UI.HideWait();

	        if (CReAssignPlacementUserResponse)
	        {
	            if (CReAssignPlacementUserResponse.Success)
	            {
	                TriSysSDK.CShowForm.SetTextInCombo('Placement_UserId', sFullName);
	                TriSysApex.Pages.PlacementForm.UserId = lUserId;
	            }
	            else
	            {
	                TriSysApex.UI.errorAlert(CReAssignRequirementUserResponse.ErrorMessage);
	            }
	        } else
	        {
	            // Something else has gone wrong!
	        }
	    };

	    payloadObject.ErrorHandlerFunction = function (request, status, error)
	    {
	        TriSysApex.UI.HideWait();
	        TriSysApex.UI.ErrorHandlerRedirector('ctrlPlacementForm.ReAssignUserViaWebService: ', request, status, error);
	    };

	    TriSysApex.UI.ShowWait(null, "Updating...");
	    TriSysAPI.Data.PostToWebAPI(payloadObject);
	},

    // 05 Jan 2023
	TimesheetFrequencyEnable: function(lTimesheetCount)
	{
	    var bReadOnly = (lTimesheetCount > 0);

	    // Cannot change timesheet frequency if existing timesheets
	    TriSysSDK.CShowForm.ComboReadonly('PlacementConfigFields_TimesheetFrequency', bReadOnly);
	}

};

$(document).ready(function ()
{
    ctrlPlacementForm.Load();
});
