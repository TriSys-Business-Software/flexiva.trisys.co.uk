var CandidateTimesheet =
{
    // Used for new timesheets only
    PlacementId: 0,

	// Read from placement
	HoursPerWeek: 37.5,

    // URL processing to allow correct order of custom app loading before execution
    LoadFromURL: function (sParameters)
    {
        var lTimesheetId = TriSysApex.Pages.Controller.ParseLoadRecordURLParameter(sParameters, 0, true);

        if ($.isNumeric(lTimesheetId))
            TriSysWebJobs.Timesheet.TimesheetId = lTimesheetId;

        CandidateTimesheet.Load(TriSysWebJobs.Timesheet.TimesheetId);
    },

    Load: function (lTimesheetId)
    {
        // Display the record               
        CandidateTimesheet.ShowTimesheetSummary(lTimesheetId);
    },

    ShowTimesheetSummary: function (lTimesheetId)
    {
        var CTimesheetRequest =
         {
             TimesheetId: lTimesheetId
         };

        CandidateTimesheet.PlacementId = TriSysWebJobs.Placement.PlacementId;
        if (lTimesheetId == 0)
            CTimesheetRequest.PlacementId = TriSysWebJobs.Placement.PlacementId;

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
                    var sHyperlink = '<a href="javascript:void(0)" onclick="TriSysWebJobs.Placement.Open(' + placement.PlacementId + ')">' + placement.Reference + '</a>';
                    $('#trisys-timesheet-reference').html(sHyperlink);

                    $('#trisys-timesheet-candidate').html(placement.CandidateName);
                    $('#trisys-timesheet-linemanager').html(placement.LineManagerName);
                    $('#trisys-timesheet-type').html(placement.Type);
                    $('#trisys-timesheet-jobtitle').html(placement.JobTitle);

                    var sLocation = placement.Location;
                    if (sLocation)
                        sLocation = sLocation.replace(/\n/g, '<br />');

                    $('#trisys-timesheet-location').html(sLocation);

                    $('#trisys-timesheet-company').html(placement.CompanyName);

                    var sStartDate = moment(placement.StartDate).format("dddd DD MMMM YYYY");
                    $('#trisys-timesheet-startdate').html(sStartDate);

                    if (placement.EndDate)
                    {
                        var sEndDate = moment(placement.EndDate).format("dddd DD MMMM YYYY");
                        $('#trisys-timesheet-enddate').html(sEndDate);
                    }

					// Jan 2019
					CandidateTimesheet.HoursPerWeek = placement.HoursPerWeek;
					

                    // Periods: Either all periods if an existing timesheet, or only those unassigned for new timesheets
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
                            TriSysApex.FormsManager.OpenForm("CandidatePlacement", placement.PlacementId);
                            return true;
                        };

                        var sMessage = "You are not permitted to add any more timesheets for this placement.";
                        TriSysApex.UI.ShowMessage(sMessage, null, fnGoToPlacement);
                        return;
                    }

                    TriSysSDK.CShowForm.populateComboFromListOfString("trisys-timesheet-period", periodList);


                    // TIMESHEET
                    $("#trisys-timesheet-id").html(TriSysSDK.Numbers.Pad(CTimesheetResponse.TimesheetId, 6));

                    

                    if (CTimesheetResponse.TimesheetId > 0)
                    {
                        TriSysSDK.CShowForm.SetTextInCombo("trisys-timesheet-period", timesheet.Period);
                        TriSysSDK.CShowForm.ComboEnabled("trisys-timesheet-period", false);
                    }
                    else
                    {
                        $("#trisys-timesheet-id").html("&lt;Allocated when Saved&gt;");
                        timesheet.InputDate = new Date();

                        if (periodList)
                        {
                            // Add a callback so that when a period is selected, that the correct periods are drawn
                            TriSysSDK.CShowForm.addCallbackOnComboSelect("trisys-timesheet-period", CandidateTimesheet.PeriodSelectionEvent);
                            var sFirstPeriod = TriSysSDK.CShowForm.GetTextFromCombo("trisys-timesheet-period");
                            CandidateTimesheet.PeriodSelectionEvent(sFirstPeriod);
                        }
                        else
                        {
                            // Not possible to add a timesheet
                            return;
                        }
                    }

                    $("#trisys-timesheet-inputdate").html(moment(timesheet.InputDate).format('dddd DD MMMM YYYY'));
                    var bAuthorised = timesheet.PaymentAuthorised;
                    $("#trisys-timesheet-status").html((bAuthorised ? "" : "Not ") + "Authorised");
                    if (bAuthorised)
                    {
                        $("#trisys-timesheet-authorised").html(moment(timesheet.AuthorisedDate).format('dddd DD MMMM YYYY'));
                        $("#trisys-timesheet-authorised-form-group").show();
                        $("#trisys-timesheet-authorisedby").html(timesheet.AuthorisedBy);
                        $("#trisys-timesheet-authorisedby-form-group").show();
                    }
                    var bPaid = timesheet.Payrolled;
                    if (bPaid)
                    {
                        $("#trisys-timesheet-paid").html(bPaid ? "Yes" : "No");
                        $("#trisys-timesheet-paid-form-group").show();
                    }

					if(timesheet.AuthorisationRequested && moment(timesheet.AuthorisationRequested).year() >= 1900)
					{
						var sAuthorisationRequested = moment(timesheet.AuthorisationRequested).format("dddd DD MMMM YYYY");
						$('#trisys-timesheet-authorisationrequested').html(sAuthorisationRequested);
					}

                    // Populate the timesheet amounts table
                    var bClientContact = false;
                    TriSysWebJobs.Timesheet.PopulateAmountsTable(CTimesheetResponse.Rates, bClientContact);

                    // Populate the timesheet summary table
                    TriSysWebJobs.Timesheet.PopulateSummaryTable(CTimesheetResponse, bClientContact);

                    // Populate the timesheet period intervals and hours
                    var bCanEdit = CTimesheetResponse.CanEdit;
                    TriSysWebJobs.Timesheet.PopulateGrid(CTimesheetResponse, 'trisys-timesheet-hours-grid', bCanEdit);

                    // Set visibility of form buttons
                    TriSysWebJobs.Timesheet.FormButtonVisibility(CTimesheetResponse, "CandidateTimesheet-Menu-Save", "CandidateTimesheet-Menu-RequestAuthorisation");

					// Custom logic
					if(TriSysWebJobs.Agency.CustomerIDMatch("CoSector"))
					{
						$('#CandidateTimesheet-Menu-RequestAuthorisation-Text').html('Request Approval');
						$('#trisys-timesheet-miscellaneous-hours-reason').val(CTimesheetResponse.Custom.MiscellaneousHoursReason);
					}
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
            alert('CandidateTimesheet.ShowTimesheetSummary: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Reading Timesheet...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);        
    },

    // When candidate changes the period, go back and get the placement rates, periods and hours for the grid population.
    // This will have no hours because it is only for a new timesheet.
    PeriodSelectionEvent: function (sPeriod)
    {
        //alert(sPeriod);
        var lPlacementId = CandidateTimesheet.PlacementId;

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
            TriSysApex.UI.ErrorHandlerRedirector('CandidateTimesheet.PeriodSelectionEvent: ', request, status, error);
        };
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    Save: function()
    {
        var lPlacementId = CandidateTimesheet.PlacementId;
        var lTimesheetId = parseInt($("#trisys-timesheet-id").html());
        var sPeriod = TriSysSDK.CShowForm.GetTextFromCombo("trisys-timesheet-period");

        // Read all data from the grid data source
		var sGridID = 'trisys-timesheet-hours-grid';
        var timesheetPeriodRatesHours = TriSysWebJobs.Timesheet.ReadHoursGridData(sGridID);
        if (!timesheetPeriodRatesHours)
            return;

        var fnCallback = function (lTimesheetId)
        {
            // If a new timesheet, then Update ID on form, prevent period being changed
            $("#trisys-timesheet-id").html(TriSysSDK.Numbers.Pad(lTimesheetId, 6));
            TriSysSDK.CShowForm.ComboEnabled("trisys-timesheet-period", false);
            $('#CandidateTimesheet-Menu-RequestAuthorisation').show();

            var sMessage = TriSysSDK.Resources.Message("TriSysWeb.Pages.Timesheet.SendHoursMatrixToServer.SavedTimesheetId") +
                TriSysSDK.Numbers.Pad(lTimesheetId, 6) +
                TriSysSDK.Resources.Message("TriSysWeb.Pages.Timesheet.SendHoursMatrixToServer.AuthorisationReminder");
            TriSysApex.UI.ShowMessage(sMessage, TriSysWebJobs.Constants.ApplicationName);
        };

		// Custom fields starting Jan 2019..
		var customFields = null;
		if(TriSysWebJobs.Agency.CustomerIDMatch("CoSector"))
		{
			var sMiscellaneousHoursReason = $('#trisys-timesheet-miscellaneous-hours-reason').val();
			customFields = { MiscellaneousHoursReason : sMiscellaneousHoursReason };

			// Validate that hours confirm to expected weekly hours
			var fExpectedHours = CandidateTimesheet.HoursPerWeek;

			var fStandardHours = TriSysSDK.Grid.CalculateColumnTotal(sGridID, "ID", "Standard");
			var fHolidayHours = TriSysSDK.Grid.CalculateColumnTotal(sGridID, "ID", "Holiday");
			var fSickHours = TriSysSDK.Grid.CalculateColumnTotal(sGridID, "ID", "Sick");
			var fMiscellaneousHours = TriSysSDK.Grid.CalculateColumnTotal(sGridID, "ID", "Miscellaneous");
			var fWeeklyHours = fStandardHours + fSickHours + fHolidayHours + fMiscellaneousHours;

			var sMessage = null;
			if(fExpectedHours != fWeeklyHours)
			{
				sMessage = "Your standard working hours does not match your agreed contracted hours of " + fExpectedHours + " so please amend and re-submit." +
							"<br/>" + "If you have exceeded your agreed contracted hours, please contact the University of London CoSector recruitment team as a matter of urgency.";
				//TriSysApex.UI.ShowMessage(sMessage, TriSysWebJobs.Constants.ApplicationName);		Commented out 28 May 2019
				//return;
			}

			// 18 Feb 2019: Apparently there is more business logic!
			if(fMiscellaneousHours > 0 && !sMiscellaneousHoursReason)
			{
				sMessage = "You must supply a reason why you are recording Miscellaneous hours.";
				TriSysApex.UI.ShowMessage(sMessage, TriSysWebJobs.Constants.ApplicationName);
				return;
			}
		}

        // Send it via the Web API
        TriSysWebJobs.Timesheet.SendHoursMatrixToServer(lPlacementId, lTimesheetId, sPeriod, timesheetPeriodRatesHours, customFields, fnCallback);
    },

    RequestAuthorisation: function()
    {
        var lTimesheetId = parseInt($("#trisys-timesheet-id").html());
        if (lTimesheetId <= 0)
            return;

        var fnConfirmed = function (lTimesheetId)
        {
            $('#CandidateTimesheet-Menu-Save').attr("disabled", true);
            $('#CandidateTimesheet-Menu-RequestAuthorisation').attr("disabled", true);

            // Back-end flags to indicate whether this has been submitted?
			var bAlreadyRequested = ($('#trisys-timesheet-authorisationrequested').html());
			if(!bAlreadyRequested)
			{
				var sAuthorisationRequested = moment(new Date()).format("dddd DD MMMM YYYY");
				$('#trisys-timesheet-authorisationrequested').html(sAuthorisationRequested);
			}

            setTimeout(function ()
            {
                var sMessage = TriSysSDK.Resources.Message("TriSysWeb.Pages.Timesheet.ConfirmedAuthorisationRequest.Message");
                TriSysApex.UI.ShowMessage(sMessage, TriSysWebJobs.Constants.ApplicationName);
            }, 100);
        };

        var fnConfirmAuthorisationRequest = function ()
        {
            TriSysWebJobs.Timesheet.ConfirmedAuthorisationRequest(lTimesheetId, fnConfirmed);
            return true;
        };

        var sCaption = TriSysSDK.Resources.Message("TriSysWeb.Pages.Timesheet.RequestAuthorisation.PromptCaption");
        var sMessage = TriSysSDK.Resources.Message("TriSysWeb.Pages.Timesheet.RequestAuthorisation.PromptMessage");

		// Custom verbs
		if(TriSysWebJobs.Agency.CustomerIDMatch("CoSector"))
		{
			sCaption = sCaption.replace(/Authorisation/g, "Approval");
			sMessage = sMessage.replace(/authorisation/g, "approval");
			sMessage = sMessage.replace(/authorised/g, "approved");
		}

        TriSysApex.UI.questionYesNo(sMessage, sCaption, "Yes", fnConfirmAuthorisationRequest, "No", null);
    }
};

$(document).ready(function ()
{
    // 04 Mar 2017 - wait for LoadFromURL event
    //CandidateTimesheet.Load();
});
