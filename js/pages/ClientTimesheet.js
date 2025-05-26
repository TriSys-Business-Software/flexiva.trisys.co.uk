var ClientTimesheet =
{
    // URL processing to allow correct order of custom app loading before execution
    LoadFromURL: function (sParameters)
    {
        TriSysWebJobs.Timesheet.TimesheetId = TriSysApex.Pages.Controller.ParseLoadRecordURLParameter(sParameters, 0, true);

        ClientTimesheet.Load(TriSysWebJobs.Timesheet.TimesheetId);
    },

    Load: function (lTimesheetId)
    {
        // Display the record               
        ClientTimesheet.ShowTimesheetSummary(lTimesheetId);
    },

    ShowTimesheetSummary: function (lTimesheetId)
    {
        var CTimesheetRequest =
         {
             TimesheetId: lTimesheetId
         };

        ClientTimesheet.PlacementId = TriSysWebJobs.Placement.PlacementId;
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

                    var sHyperlink = '<a href="javascript:void(0)" onclick="TriSysWebJobs.Placement.Open(' + placement.PlacementId + ', true)">' + placement.Reference + '</a>';
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

                        var bNoEndDate = (moment(placement.EndDate).year() <= 1900);
                        if (bNoEndDate)
                            $('#trisys-timesheet-enddate-formgroup').hide();
                    }

                    
                    // TIMESHEET
                    $("#trisys-timesheet-id").html(TriSysSDK.Numbers.Pad(CTimesheetResponse.TimesheetId, 6));
                    $('#trisys-timesheet-period').html(timesheet.Period);
                    

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

                    // The Identification Link of the candidate
                    if (placement.Custom && placement.Custom.IdentificationLink)
                    {
                        var sTitle = "Candidate ID";
                        $('#trisys-timesheet-IdentificationLink').click(function ()
                        {
                            TriSysSDK.Controls.FileManager.GetOpenFileURLFromWebService(sTitle, placement.Custom.IdentificationLink, sTitle);
                        });
                        $('#trisys-timesheet-IdentificationLink').html("Click to Open");
                    }


                    // Populate the timesheet amounts table
                    var bClientContact = true;
                    TriSysWebJobs.Timesheet.PopulateAmountsTable(CTimesheetResponse.Rates, bClientContact);

                    // Populate the timesheet summary table
                    TriSysWebJobs.Timesheet.PopulateSummaryTable(CTimesheetResponse, bClientContact);

                    // Populate the timesheet period intervals and hours
                    var bCanEdit = false;
                    TriSysWebJobs.Timesheet.PopulateGrid(CTimesheetResponse, 'trisys-timesheet-hours-grid', bCanEdit);

                    // Set visibility of form buttons
					var bAuthorisationRequested = (timesheet.AuthorisationRequested && moment(timesheet.AuthorisationRequested).year() >= 1900);
                    $('#ClientTimesheet-Menu-Authorise').attr("disabled", bAuthorised);

					var bAllowDecline = TriSysWebJobs.Agency.CustomerIDMatch("CoSector");
					if(!bAuthorised && bAuthorisationRequested && bAllowDecline)
						$('#ClientTimesheet-Menu-Decline').show();

					if(bAuthorisationRequested)
					{
						var sAuthorisationRequested = moment(timesheet.AuthorisationRequested).format("dddd DD MMMM YYYY");
						$('#trisys-timesheet-authorisationrequested').html(sAuthorisationRequested);
					}

					// Any customisations?
					ClientTimesheet.CustomerSpecificConfiguration(lTimesheetId, placement);
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
            alert('ClientTimesheet.ShowTimesheetSummary: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Reading Timesheet...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    Authorise: function ()
    {
        var lTimesheetId = parseInt($("#trisys-timesheet-id").html());
        if (lTimesheetId <= 0)
            return;

        var fnConfirmed = function (lTimesheetId)
        {
            $('#ClientTimesheet-Menu-Authorise').attr("disabled", true);

            // There are no back-end flags to indicate whether this has been submitted: TODO
            setTimeout(function ()
            {
                var sMessage = TriSysSDK.Resources.Message("TriSysWeb.Pages.Timesheet.ConfirmedAuthorisationCallback.Message")
                TriSysApex.UI.ShowMessage(sMessage, TriSysWebJobs.Constants.ApplicationName);
            }, 100);
        };

        var fnAuthoriseRequest = function ()
        {
            TriSysWebJobs.Timesheet.AuthoriseRequest(lTimesheetId, fnConfirmed);
            return true;
        };

        var sCaption = TriSysSDK.Resources.Message("TriSysWeb.Pages.Timesheet.Authorise.PromptCaption");
        var sMessage = TriSysSDK.Resources.Message("TriSysWeb.Pages.Timesheet.Authorise.PromptMessage");
        TriSysApex.UI.questionYesNo(sMessage, sCaption, "Yes", fnAuthoriseRequest, "No", null);
    },

	// Created 31 Jan 2019 to allow client to decline a request for a timesheet authorisation by a candidate.
	// Only CoSector has requested this functionality at present.
	Decline: function()
	{
		var timesheetDetails = {};
		timesheetDetails.TimesheetId = parseInt($("#trisys-timesheet-id").html());

		timesheetDetails.TimesheetId = $("#trisys-timesheet-id").html();
        timesheetDetails.Period = $('#trisys-timesheet-period').html();
		timesheetDetails.Candidate = $('#trisys-timesheet-candidate').html();
		timesheetDetails.CompanyName = $('#trisys-timesheet-company').html();
		timesheetDetails.ClientFullName = $('#trisys-timesheet-linemanager').html();

		var fnAfterDecline = function ()
        {
           // Inform client and hide relevant buttons
			$('#ClientTimesheet-Menu-Authorise').attr("disabled", true);
			$('#ClientTimesheet-Menu-Decline').attr("disabled", true);
		};

		// Centralised function used in more than one place
		TriSysWebJobs.Timesheet.ClientDecline(timesheetDetails, fnAfterDecline);
	},	

	CustomerSpecificConfiguration: function(lTimesheetId, placement)
	{
		if(TriSysWebJobs.Agency.CustomerIDMatch("CoSector"))
		{
			var bIntern = (placement.Type == "Intern");

			if(bIntern)
			{
				$('#trisys-timesheet-hours-rates-amounts-summary-block').hide();
				$('#trisys-timesheet-please-check-message-block').show();
			}

			$('#trisys-timesheet-hours-rates-amounts-text').html('Hours and Rates');

			// Hide Charge Amount column
			$("#amountsTable th:nth-child(6), #amountsTable td:nth-child(6)").hide();
		}
	}
};

$(document).ready(function ()
{
    // 04 Mar 2017 - wait for LoadFromURL event
    //ClientTimesheet.Load();
});
