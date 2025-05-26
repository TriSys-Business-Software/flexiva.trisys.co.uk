var ctrlTimesheetForm =
{
    Load: function ()
    {
        // Form Tabs
        TriSysSDK.EntityFormTabs.AddClickEventHandlers('timesheet-form-tab-nav-horizontal', true);
        TriSysSDK.Controls.Button.Click('timesheet-form-tab-hours');

        // Form Menu
        var hideMenuItemPrefixes = ['file-menu-saveas'];
        //TriSysSDK.FormMenus.DrawFileMenu('timesheetForm-FileMenu', 'timesheetForm', ctrlTimesheetForm.FileMenuCallback, hideMenuItemPrefixes);

        // Actions menus
        if (TriSysApex.Device.isPhone())
        {
            $('#timesheetForm-ActionsMenu').hide();
        }
        else
        {
            var sCallbackFunction = 'ctrlTimesheetForm.ActionInvocation';
            var sMasterEntityCallbackFunction = 'ctrlTimesheetForm.ActionInvocationMasterEntity';
            TriSysActions.Menus.Draw('timesheetForm-ActionsMenu', 'Timesheet', sCallbackFunction, sMasterEntityCallbackFunction);
        }

        // Show standard menus for grids
        var sGrid = 'timesheetForm-NotesHistoryGrid';
        //TriSysSDK.FormMenus.DrawGridFileMenu('timesheetNotesHistoryFileMenu', sGrid, ctrlTimesheetForm.NotesHistoryGridFileMenuCallback);
        TriSysSDK.FormMenus.DrawGridMenu('timesheetNotesHistoryGridMenu', sGrid);

        sGrid = 'timesheetForm-ScheduledTasksGrid';
        //TriSysSDK.FormMenus.DrawGridFileMenu('timesheetScheduledTasksFileMenu', sGrid, ctrlTimesheetForm.ScheduledTaskGridFileMenuCallback);
        TriSysSDK.FormMenus.DrawGridMenu('timesheetScheduledTasksGridMenu', sGrid);

        // 01 Apr 2021: Custom fields tab
        TriSysSDK.CShowForm.CustomFieldsTab.Load("timesheet-form-customfields", "timesheet-form-tab-custom-caption",
                                                    "Timesheet");

        // Tell CShowForm that we are initialised and it can customise the widgets
        TriSysSDK.CShowForm.InitialiseFields("Timesheet");   

		// Some customers have paid us to make changes just for them!
		ctrlTimesheetForm.CustomLogic();
    },

	CustomLogic: function()
	{
		if (TriSysApex.LoginCredentials.isLoggedInToSpecificCompanyAsRecruiter("CoSector"))
		{
			$('#trisys-timesheet-miscellaneous-hours-reason-block').show();
			$('#timesheet-form-original-row').hide();
		}
	},

    // We get called when the user switched buttons to change view
    TabButtonCallback: function (sTabID)
    {
        switch (sTabID)
        {
            case 'timesheet-form-panel-hours':
                // TODO
                break;

            case 'timesheet-form-panel-attributes':
                if (TriSysApex.Forms.EntityForm.isGridPopulated("Timesheet", sTabID))
                    return;

                TriSysSDK.Attributes.Load("Timesheet", TriSysApex.Pages.TimesheetForm.TimesheetId, 'timesheet-form-attributes');
                break;

            case 'timesheet-form-panel-documentlibrary':
                if (TriSysApex.Forms.EntityForm.isGridPopulated("Timesheet", sTabID))
                    return;

                TriSysSDK.DocumentLibrary.Load("Timesheet", TriSysApex.Pages.TimesheetForm.TimesheetId, 'timesheet-form-documentlibrary');
                break;

            case 'timesheet-form-panel-noteshistory':
                TriSysApex.Pages.TimesheetForm.LoadNotesHistoryGrid('timesheetForm-NotesHistoryGrid', null);
                break;
            case 'timesheet-form-panel-scheduledtasks':
                TriSysApex.Pages.TimesheetForm.LoadScheduledTasksGrid('timesheetForm-ScheduledTasksGrid', null);
                break;
        }
    },

    FileMenuCallback: function (sFileMenuID)
    {
        var fm = TriSysSDK.FormMenus.Constants;

        switch (sFileMenuID)
        {
            case fm.File_New:
                TriSysApex.Pages.TimesheetForm.NewRecord();
                break;
            case fm.File_Open:
                TriSysApex.Pages.TimesheetForm.OpenFindDialogue();
                break;
            case fm.File_Save:
                TriSysApex.Pages.TimesheetForm.SaveRecord();
                break;
            case fm.File_Save_As:
                TriSysApex.UI.ShowMessage("Save Timesheet As");
                break;
            case fm.File_Delete:
                ctrlTimesheetForm.Delete();
                break;
            case fm.File_Close:
                TriSysApex.FormsManager.CloseCurrentForm();     // TODO: Dirty check!
                break;
        }
    },

    NotesHistoryGridFileMenuCallback: function (sFileMenuID)
    {
        ctrlTimesheetForm.TaskGridFileMenuCallback(sFileMenuID, 'timesheetForm-NotesHistoryGrid', false);
    },

    ScheduledTaskGridFileMenuCallback: function (sFileMenuID)
    {
        ctrlTimesheetForm.TaskGridFileMenuCallback(sFileMenuID, 'timesheetForm-ScheduledTasksGrid', true);
    },

    TaskGridFileMenuCallback: function (sFileMenuID, sGrid, bScheduled)
    {
        var fm = TriSysSDK.FormMenus.Constants;
        var lTaskId = null;

        switch (sFileMenuID)
        {
            case fm.File_New:
                ctrlTimesheetForm.NewTask(bScheduled)
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
        // Get the timesheet and contact from this timesheet and pass into the task form
        var lTimesheetId = TriSysApex.Pages.TimesheetForm.TimesheetId;
        var lContactId = TriSysSDK.Controls.ContactLookup.ReadContactId('Timesheet_Candidate');  // TriSysApex.Pages.TimesheetForm.CandidateId;
        var sPlacement = $('#Timesheet_PlacementId').val();
        var sCandidate = TriSysSDK.Controls.ContactLookup.ReadContactName('Timesheet_Candidate');  // $('#Timesheet_Candidate').val();
        var sContactType = 'Candidate';

        var params = new TriSysApex.ModalDialogue.Task.ShowParameters();
        params.Scheduled = bScheduled;

        var candidateContact = {
            ContactId: lContactId,
            FullName: sCandidate,
            CompanyName: '',
            JobTitle: '',
            ContactType: sContactType
        };
        params.Contacts.push(candidateContact);

        var timesheetLink = {
            Name: 'Timesheet',
            RecordId: lTimesheetId,
            Description: "Timesheet: " + lTimesheetId + ", " + sPlacement
        }
        params.Links.push(timesheetLink);

        TriSysApex.ModalDialogue.Task.Show(params);
    },

    // Called when a user runs an action from any menu.
    ActionInvocation: function (sEntityName)
    {
        switch (sEntityName)
        {
            case "Timesheet":
                var timesheetIds = [TriSysApex.Pages.TimesheetForm.TimesheetId];
                return timesheetIds;
        }
    },

    // To handle situation where we run an action against a grid on this form
    ActionInvocationMasterEntity: function()
    {
        var masterEntity = { EntityName: 'Timesheet', EntityId: TriSysApex.Pages.TimesheetForm.TimesheetId };
        return masterEntity;
    },

    // Called by TriSysApex.Pages.TimesheetForm.AfterFormDataLoaded
    ShowTimesheetSummary: function (lTimesheetId, lPlacementId)
    {
        // Clear out old grid in case we are refreshing
        $('#trisys-timesheet-hours-grid').empty();

        // Hit the database
        var CTimesheetRequest =
         {
             TimesheetId: lTimesheetId,
             PlacementId: lPlacementId
         };

        var payloadObject = {};

        payloadObject.URL = 'Timesheet/Read';
        payloadObject.OutboundDataPacket = CTimesheetRequest;
        payloadObject.InboundDataFunction = function (CTimesheetResponse)
        {
            TriSysApex.UI.HideWait();

            if (CTimesheetResponse && CTimesheetResponse.Success)
            {
                var timesheet = CTimesheetResponse.Timesheet;
                if (timesheet)
                {
                    // PLACEMENT
                    var placement = CTimesheetResponse.Placement;

                    // Override these in case of 'new' timesheet
                    //$('#Timesheet_Candidate').val(placement.CandidateName);
                    //TriSysApex.Pages.TimesheetForm.CandidateId = placement.CandidateContactId;
                    TriSysSDK.Controls.ContactLookup.WriteContactId("Timesheet_Candidate",
                                    placement.CandidateContactId, placement.CandidateName);

                    var sPlacement = placement.Reference + ": " + placement.JobTitle + ": " + placement.CompanyName;
                    $('#Timesheet_PlacementId').val(sPlacement);
                    TriSysApex.Pages.TimesheetForm.PlacementId = placement.PlacementId;

                    $('#Timesheet_Frequency').val(placement.TimesheetFrequency);

                    //$('#trisys-timesheet-linemanager').html(placement.LineManagerName);
                    //$('#trisys-timesheet-type').html(placement.Type);
                    //$('#trisys-timesheet-jobtitle').html(placement.JobTitle);

                    //var sLocation = placement.Location;
                    //if (sLocation)
                    //    sLocation = sLocation.replace(/\n/g, '<br />');

                    //$('#trisys-timesheet-location').html(sLocation);

                    //$('#trisys-timesheet-company').html(placement.CompanyName);

                    //var sStartDate = moment(placement.StartDate).format("dddd DD MMMM YYYY");
                    //$('#trisys-timesheet-startdate').html(sStartDate);

                    //if (placement.EndDate)
                    //{
                    //    var sEndDate = moment(placement.EndDate).format("dddd DD MMMM YYYY");
                    //    $('#trisys-timesheet-enddate').html(sEndDate);
                    //}

                    // Periods: Either all periods of an existing timesheet, or only those unassigned for new timesheets
                    var periodList = null;
                    if (lTimesheetId > 0)
                        periodList = placement.PeriodDescriptionsAll;
                    else
                        periodList = placement.PeriodDescriptionsUnassignedToTimesheets;

                    if (!periodList)
                    {
                        // No {more} period without timesheets
                        var fnGoToPlacement = function ()
                        {
                            TriSysApex.FormsManager.OpenForm("Placement", placement.PlacementId);
                            return true;
                        };

                        var sMessage = "Timesheet periods exhausted." +
                            "<br />" + "This is typically because your placement end date is beyond the date of the last available timesheet period." +
                            "<br />" + "Please ask your systems administrator to generate new timesheet periods.";
                        TriSysApex.UI.ShowMessage(sMessage, null, fnGoToPlacement);
                        return;
                    }
                    
                    var sPeriodID = 'Timesheet_Period';
                    TriSysSDK.CShowForm.populateComboFromListOfString(sPeriodID, periodList);
                    TriSysSDK.CShowForm.ComboEnabled(sPeriodID, (CTimesheetResponse.TimesheetId == 0));

                    if (CTimesheetResponse.TimesheetId > 0)
                        TriSysSDK.CShowForm.SetTextInCombo(sPeriodID, timesheet.Period);
                    else
                    {
                        timesheet.InputDate = new Date();

                        // Add a callback so that when a period is selected, that the correct periods are drawn
                        var fnPeriodSelectionEvent = function (sPeriod)
                        {
                            ctrlTimesheetForm.PeriodSelectionEvent(sPeriod, lPlacementId);
                        };

                        TriSysSDK.CShowForm.addCallbackOnComboSelect(sPeriodID, fnPeriodSelectionEvent);
                        var sFirstPeriod = TriSysSDK.CShowForm.GetTextFromCombo(sPeriodID);
                        fnPeriodSelectionEvent(sFirstPeriod, lPlacementId);
                        TriSysSDK.CShowForm.setDatePickerValue('TimesheetConfigFields_InputDate', timesheet.InputDate);

                        // Cope with new adjustments
                        TriSysSDK.CShowForm.SetTextInCombo('Timesheet_Type', "Timesheet");
                    }

                    //var bAuthorised = timesheet.PaymentAuthorised;
                    //$("#trisys-timesheet-status").html((bAuthorised ? "" : "Not ") + "Authorised");
                    //if (bAuthorised)
                    //{
                    //    $("#trisys-timesheet-authorised").html(moment(timesheet.AuthorisedDate).format('dddd DD MMMM YYYY'));
                    //    $("#trisys-timesheet-authorised-form-group").show();
                    //    $("#trisys-timesheet-authorisedby").html(timesheet.AuthorisedBy);
                    //    $("#trisys-timesheet-authorisedby-form-group").show();
                    //}
                    //var bPaid = timesheet.Payrolled;
                    //if (bPaid)
                    //{
                    //    $("#trisys-timesheet-paid").html(bPaid ? "Yes" : "No");
                    //    $("#trisys-timesheet-paid-form-group").show();
                    //}

                    // Populate the timesheet amounts table
                    var bClientContact = false;
                    TriSysWebJobs.Timesheet.PopulateAmountsTable(CTimesheetResponse.Rates, false, true);

                    // Populate the timesheet summary table
                    TriSysWebJobs.Timesheet.PopulateSummaryTable(CTimesheetResponse, false, true);

                    // Populate the timesheet period intervals and hours
                    var bCanEdit = CTimesheetResponse.CanEdit;
                    TriSysWebJobs.Timesheet.PopulateGrid(CTimesheetResponse, 'trisys-timesheet-hours-grid', bCanEdit);

                    //// Set visibility of form buttons
                    //TriSysWebJobs.Timesheet.FormButtonVisibility(CTimesheetResponse, "CandidateTimesheet-Menu-Save", "CandidateTimesheet-Menu-RequestAuthorisation");
                    var bDisabled = !bCanEdit;
                    $('#timesheetForm-save-button').attr("disabled", bDisabled);
                    $('#timesheetForm-delete-button').attr("disabled", bDisabled);
                }
                else
                {
                    TriSysApex.UI.ShowMessage("Unable to find timesheet");
                    return;
                }

                return true;
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            alert('ctrlTimesheetForm.ShowTimesheetSummary: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Reading Timesheet...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    // When the period changes, go back and get the placement rates, periods and hours for the grid population.
    // This will have no hours because it is only for a new timesheet.
    PeriodSelectionEvent: function (sPeriod, lPlacementId)
    {
        // Go to the web API to get the rates for the specified period and draw the periods when called back
        TriSysApex.UI.ShowWait(null, sPeriod + "...");

        var CTimesheetRequest = {
            TimesheetId: 0,
            PlacementId: lPlacementId,
            Period: sPeriod
        };

        var payloadObject = {};
        payloadObject.URL = "Timesheet/Read";
        payloadObject.OutboundDataPacket = CTimesheetRequest;
        payloadObject.InboundDataFunction = function (CTimesheetResponse)
        {
            TriSysApex.UI.HideWait();

            if (CTimesheetResponse)
            {
                if (CTimesheetResponse.Success)
                {
                    // Populate the timesheet period intervals and hours
                    TriSysWebJobs.Timesheet.PopulateGrid(CTimesheetResponse, 'trisys-timesheet-hours-grid', true);
                }
                else
                    TriSysApex.UI.errorAlert(CTimesheetResponse.ErrorMessage, TriSysWebJobs.Constants.ApplicationName);
            }

            return true;
        };
        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.ErrorHandlerRedirector('ctrlTimesheetForm.PeriodSelectionEvent: ', request, status, error);
        };
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    // Called by the TriSysApex.Pages.TimesheetForm.SaveRecord after new timesheet is saved
    SaveTimesheetHours: function (lTimesheetId, lPlacementId)
    {
        var sPeriod = TriSysSDK.CShowForm.GetTextFromCombo("Timesheet_Period");     //"trisys-timesheet-period");

        // Read all data from the grid data source
        var timesheetPeriodRatesHours = TriSysWebJobs.Timesheet.ReadHoursGridData('trisys-timesheet-hours-grid');
        if (!timesheetPeriodRatesHours)
            return;

        var fnCallback = function (lTimesheetId)
        {
            // If a new timesheet, then Update ID on form, prevent period being changed
            TriSysSDK.CShowForm.ComboEnabled("Timesheet_Period", false);        //"trisys-timesheet-period", false);
        };

        // Send it via the Web API
        TriSysWebJobs.Timesheet.SendHoursMatrixToServer(lPlacementId, lTimesheetId, sPeriod, timesheetPeriodRatesHours, null, fnCallback);
    },

    // Called by ctrlStandardWorkingWeek action
    SetHoursAfterAction: function (hoursByDay)
    {
        // DOM magic to set hours
        var elemGrid = $('#trisys-timesheet-hours-grid');
        for (var i = 0; i <= 6; i++)
        {
            var dayItem = elemGrid.data().kendoGrid.dataSource.data()[i];
            var sDay = dayItem.period;
            var sDayStart = sDay.substring(0, 3);

            var fDailyHours = 0;
            for (var h = 0; h < hoursByDay.length; h++)
            {
                var hoursByDayItem = hoursByDay[h];
                if(hoursByDayItem.Day == sDayStart)
                {
                    fDailyHours = hoursByDayItem.Hours;
                    break;
                }
            }

            for (var propertyName in dayItem)
            {
                if (propertyName.indexOf("ID") == 0)
                {
                    dayItem.set(propertyName, fDailyHours);
                    break;
                }
            }
        }
    },

    Delete: function()
    {
        var lTimesheetId = TriSysApex.Pages.TimesheetForm.TimesheetId;
        if (lTimesheetId <= 0)
            return;

        // Cannot delete authorised timesheets
        var bAuthorised = TriSysSDK.CShowForm.GetCheckBoxValue('TimesheetConfigFields_PaymentAuthorised');
        if(bAuthorised)
        {
            TriSysApex.UI.ShowMessage("You are not permitted to delete authorised timesheets.");
            return;
        }

        // Only administrators can delete timesheets?

        // Prompt for confirmation
        var sMessage = "Are you sure that you wish to delete timesheet: " + TriSysSDK.Numbers.Pad(lTimesheetId, 6) + "?";
        var fnYes = function ()
        {
            ctrlTimesheetForm.DeleteTimesheetViaWebAPI(lTimesheetId);
            return true;
        };

        TriSysApex.UI.questionYesNo(sMessage, "Delete Timesheet", "Yes", fnYes, "No");
    },

    DeleteTimesheetViaWebAPI: function (lTimesheetId)
    {
        var CDeleteTimesheetRequest = {
            TimesheetId: lTimesheetId
        };

        var payloadObject = {};

        payloadObject.URL = 'Timesheet/Delete';

        payloadObject.OutboundDataPacket = CDeleteTimesheetRequest;

        payloadObject.InboundDataFunction = function (CDeleteTimesheetResponse)
        {
            TriSysApex.UI.HideWait();

            if (CDeleteTimesheetResponse)
            {
                if (CDeleteTimesheetResponse.Success)
                {
                    TriSysApex.UI.ShowMessage("Timesheet has been deleted.");
                    //TriSysApex.Pages.TimesheetForm.NewRecord();
                    TriSysApex.FormsManager.CloseForm("Timesheet", false);
                    return;
                }
                else
                    TriSysApex.UI.ShowMessage(CDeleteTimesheetResponse.ErrorMessage);
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.ErrorHandlerRedirector('ctrlTimesheetForm.DeleteTimesheetViaWebAPI: ', request, status, error);
        };

        TriSysApex.UI.ShowWait(null, "Deleting Timesheet...");

        TriSysAPI.Data.PostToWebAPI(payloadObject);
	},

	OpenAuthorisedByLink: function ()
	{
		var lTimesheetId = TriSysApex.Pages.TimesheetForm.TimesheetId;
		if (lTimesheetId <= 0)
			return;

		var sAuthoriser = $('#TimesheetConfigFields_AuthorisedBy').val();
		if (sAuthoriser)
		{
			// Get the ID of the authoriser from the Web API
			var CReadTimesheetAuthorisationRequest = {
				TimesheetId: lTimesheetId
			};

			var payloadObject = {};

			payloadObject.URL = 'Timesheet/ReadAuthorisation';

			payloadObject.OutboundDataPacket = CReadTimesheetAuthorisationRequest;

			payloadObject.InboundDataFunction = function (CReadTimesheetAuthorisationResponse)
			{
				TriSysApex.UI.HideWait();

				if (CReadTimesheetAuthorisationResponse)
				{
					if (CReadTimesheetAuthorisationResponse.Success)
					{
						TriSysApex.FormsManager.OpenForm("Contact", CReadTimesheetAuthorisationResponse.ContactId);
						return;
					}
					else
						TriSysApex.UI.ShowMessage(CReadTimesheetAuthorisationResponse.ErrorMessage);
				}
			};

			payloadObject.ErrorHandlerFunction = function (request, status, error)
			{
				TriSysApex.UI.HideWait();
				TriSysApex.UI.ErrorHandlerRedirector('ctrlTimesheetForm.OpenAuthorisedByLink: ', request, status, error);
			};

			TriSysApex.UI.ShowWait(null, "Opening Authoriser...");

			TriSysAPI.Data.PostToWebAPI(payloadObject);
		}
	}
};

$(document).ready(function ()
{
    ctrlTimesheetForm.Load();
});
