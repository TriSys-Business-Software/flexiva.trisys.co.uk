/*
 * ClientEditTimesheets.js
 * Created on Tuesday 20 June 2017 by Garry Lowther, TriSys Business Software
 */

var ClientEditTimesheets =
{
    Load: function ()
    {
        // Read selected timesheets from invoking form
        var lstSelectedTimesheetId = ClientTimesheets.ListOfSelectedTimesheetId;

		TriSysApex.UI.ShowWait(null, "Loading " + lstSelectedTimesheetId.length + " Timesheets...");
		var fnCreated = function(iIndex, lTimesheetId)
		{
			if(iIndex >= lstSelectedTimesheetId.length)
				TriSysApex.UI.HideWait();
		};

        // Read timesheet template HTML
        var sTemplateHTML = $('#clientTimesheetTemplate').html();
        sTemplateHTML = sTemplateHTML.replace('style="display: none;"', '');

        $.each(lstSelectedTimesheetId, function (index, lTimesheetId)
        {
            ClientEditTimesheets.CreateTimesheet(index+1, lstSelectedTimesheetId.length, lTimesheetId, sTemplateHTML, fnCreated);
        });
    },

    CreateTimesheet: function (iIndex, iCount, lTimesheetId, sTemplateHTML, fnCreated)
    {
        var sHTML = sTemplateHTML.replace('{{SelectedTimesheetIndex}}', iIndex);
        sHTML = sHTML.replace('{{NumberOfSelectedTimesheets}}', iCount);

        // Timesheet ID is used to identify both records and DOM ID's
        var sID = TriSysSDK.Numbers.Pad(lTimesheetId, 6);
        sHTML = sHTML.replace(/{{TimesheetId}}/g, sID);

        // Append to the DOM
        $('#lstClientTimesheets').append(sHTML);

        // Add the callback for the drop down tool to minimize the timesheet details
        var sTimesheetDetails = 'timesheet-details-' + sID;
        $('#hide-timesheet-block-' + sID).on("click", function ()
        {
            TriSysSDK.Blocks.toggleBlockSize($(this), sTimesheetDetails);
        });

        // Now populate it asynchronously
        ClientEditTimesheets.PopulateTimesheetViaWebAPI(lTimesheetId, "-" + sID, 
					function() { fnCreated(iIndex, lTimesheetId) });
    },

    // Called for each timesheet
    PopulateTimesheetViaWebAPI: function (lTimesheetId, sSuffix, fnPopulated)
    {
        var CTimesheetRequest =
         {
             TimesheetId: lTimesheetId
         };

        var payloadObject = {};

        payloadObject.URL = 'Timesheet/Read';
        payloadObject.OutboundDataPacket = CTimesheetRequest;
        payloadObject.InboundDataFunction = function (CTimesheetResponse)
        {
            if (CTimesheetResponse && CTimesheetResponse.Success)
            {
                var timesheet = CTimesheetResponse.Timesheet;
                if (timesheet)
                {
                    // PLACEMENT
                    var placement = CTimesheetResponse.Placement;
                    var sHyperlink = '<a href="javascript:void(0)" onclick="TriSysWebJobs.Placement.Open(' + placement.PlacementId + ', true)">' + placement.Reference + '</a>';
                    $('#trisys-timesheet-reference' + sSuffix).html(sHyperlink);

                    $('#trisys-timesheet-candidate' + sSuffix).html(placement.CandidateName);
                    $('#trisys-timesheet-linemanager' + sSuffix).html(placement.LineManagerName);
                    $('#trisys-timesheet-type' + sSuffix).html(placement.Type);
                    $('#trisys-timesheet-jobtitle' + sSuffix).html(placement.JobTitle);

                    var sLocation = placement.Location;
                    if (sLocation)
                        sLocation = sLocation.replace(/\n/g, '<br />');

                    $('#trisys-timesheet-location' + sSuffix).html(sLocation);

                    $('#trisys-timesheet-company' + sSuffix).html(placement.CompanyName);

                    var sStartDate = moment(placement.StartDate).format("dddd DD MMMM YYYY");
                    $('#trisys-timesheet-startdate' + sSuffix).html(sStartDate);

                    if (placement.EndDate)
                    {
                        var bNoEndDate = (moment(placement.EndDate).year() <= 1900);
                        var sEndDate = bNoEndDate ? '' : moment(placement.EndDate).format("dddd DD MMMM YYYY");
                        $('#trisys-timesheet-enddate' + sSuffix).html(sEndDate);
                    }


                    // TIMESHEET
                    $("#trisys-timesheet-id" + sSuffix).html(TriSysSDK.Numbers.Pad(CTimesheetResponse.TimesheetId, 6));
                    $('#trisys-timesheet-period' + sSuffix).html(timesheet.Period);


                    $("#trisys-timesheet-inputdate" + sSuffix).html(moment(timesheet.InputDate).format('dddd DD MMMM YYYY'));
                    var bAuthorised = timesheet.PaymentAuthorised;
                    $("#trisys-timesheet-status" + sSuffix).html((bAuthorised ? "" : "Not ") + "Authorised");
                    if (bAuthorised)
                    {
                        $("#trisys-timesheet-authorised" + sSuffix).html(moment(timesheet.AuthorisedDate).format('dddd DD MMMM YYYY'));
                        $("#trisys-timesheet-authorised-form-group" + sSuffix).show();
                        $("#trisys-timesheet-authorisedby" + sSuffix).html(timesheet.AuthorisedBy);
                        $("#trisys-timesheet-authorisedby-form-group" + sSuffix).show();
                    }
                    var bPaid = timesheet.Payrolled;
                    if (bPaid)
                    {
                        $("#trisys-timesheet-paid" + sSuffix).html(bPaid ? "Yes" : "No");
                        $("#trisys-timesheet-paid-form-group" + sSuffix).show();
                    }

                    // The Identification Link of the candidate
                    if (placement.Custom && placement.Custom.IdentificationLink)
                    {
                        var sTitle = "Candidate ID";
                        $('#trisys-timesheet-IdentificationLink' + sSuffix).click(function ()
                        {
                            TriSysSDK.Controls.FileManager.GetOpenFileURLFromWebService(sTitle, placement.Custom.IdentificationLink, sTitle);
                        });
                        $('#trisys-timesheet-IdentificationLink' + sSuffix).html("Click to Open");
                    }

                    $('#timesheet-candidate' + sSuffix).html(placement.CandidateName);
                    $('#timesheet-period' + sSuffix).html(timesheet.Period);



                    // Populate the timesheet amounts table
                    var bClientContact = true;
                    TriSysWebJobs.Timesheet.PopulateAmountsTable(CTimesheetResponse.Rates, bClientContact, false, sSuffix);

                    // Populate the timesheet summary table
                    TriSysWebJobs.Timesheet.PopulateSummaryTable(CTimesheetResponse, bClientContact, false, sSuffix);

                    // Populate the timesheet period intervals and hours
                    var bCanEdit = true;
                    TriSysWebJobs.Timesheet.PopulateGrid(CTimesheetResponse, 'trisys-timesheet-hours-grid' + sSuffix, bCanEdit, sSuffix);

                    // Set visibility of form buttons
                    $('#ClientEditTimesheets-Menu-Save' + sSuffix).attr("disabled", bAuthorised);
                    $('#ClientEditTimesheets-Menu-Authorise' + sSuffix).attr("disabled", bAuthorised);

					ClientEditTimesheets.CustomerSpecificConfiguration(lTimesheetId, sSuffix);

					fnPopulated();
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
            alert('ClientEditTimesheets.ShowTimesheetSummary: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    Save: function (sTimesheetId)
    {
        var sSuffix = '-' + sTimesheetId;
        var lTimesheetId = parseInt(sTimesheetId);

		if(ClientEditTimesheets.CustomSaveFunction(lTimesheetId))
			return;

        // Read all data from the grid data source
        var timesheetPeriodRatesHours = TriSysWebJobs.Timesheet.ReadHoursGridData('trisys-timesheet-hours-grid' + sSuffix);
        if (!timesheetPeriodRatesHours)
            return;

        var fnCallback = function (lTimesheetId)
        {
            var sMessage = TriSysSDK.Resources.Message("TriSysWeb.Pages.Timesheet.SendHoursMatrixToServer.SavedTimesheetId") +
                TriSysSDK.Numbers.Pad(lTimesheetId, 6) +
                TriSysSDK.Resources.Message("TriSysWeb.Pages.Timesheet.SendHoursMatrixToServer.AuthorisationReminder");
            TriSysApex.UI.ShowMessage(sMessage, TriSysWebJobs.Constants.ApplicationName);
        };

        // Legacy fields
        var lPlacementId = 0, sPeriod = '';

        // Send it via the Web API
        TriSysWebJobs.Timesheet.SendHoursMatrixToServer(lPlacementId, lTimesheetId, sPeriod, timesheetPeriodRatesHours, null, fnCallback);
    },

    Authorise: function (sTimesheetId)
    {
        var sSuffix = '-' + sTimesheetId;
        var lTimesheetId = parseInt(sTimesheetId);

        // Must do an explicit save also

        // Read all data from the grid data source
        var timesheetPeriodRatesHours = TriSysWebJobs.Timesheet.ReadHoursGridData('trisys-timesheet-hours-grid' + sSuffix);
        if (!timesheetPeriodRatesHours)
            return;

        // Legacy fields
        var lPlacementId = 0, sPeriod = '', fnCallback = null;

        // Send it via the Web API
        TriSysWebJobs.Timesheet.SendHoursMatrixToServer(lPlacementId, lTimesheetId, sPeriod, timesheetPeriodRatesHours, null, fnCallback);

        var fnConfirmed = function (lTimesheetId)
        {
            $('#ClientEditTimesheets-Menu-Save' + sSuffix).attr("disabled", true);
            $('#ClientEditTimesheets-Menu-Authorise' + sSuffix).attr("disabled", true);

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

	CustomerSpecificConfiguration: function(lTimesheetId, sSuffix)
	{
		if(TriSysWebJobs.Agency.CustomerIDMatch("CoSector"))
		{
            $('#trisys-timesheet-hours-rates-amounts' + sSuffix).html('Hours and Rates');
			var bIntern = ($('#trisys-timesheet-type' + sSuffix).html() == 'Intern');
			if(bIntern)
				$('#trisys-timesheet-hours-rates-amounts-summary-group' + sSuffix).hide();

			$('#trisys-timesheet-hours-grid-beneath' + sSuffix).show();
			$('#ClientEditTimesheets_Menu-SaveButtonText' + sSuffix).html('Decline');
		}
	},

	CustomSaveFunction: function(lTimesheetId)
	{
		var bDecline = TriSysWebJobs.Agency.CustomerIDMatch("CoSector");
		if(bDecline)
		{
			var sID = TriSysSDK.Numbers.Pad(lTimesheetId, 6);
			var sSuffix = "-" + sID;
			var timesheetDetails = { TimesheetId: lTimesheetId };
			timesheetDetails.Period = $('#trisys-timesheet-period' + sSuffix).html();
			timesheetDetails.Candidate = $('#timesheet-candidate' + sSuffix).html();
			timesheetDetails.CompanyName = $('#trisys-timesheet-company' + sSuffix).html();
			timesheetDetails.ClientFullName = $('#trisys-timesheet-linemanager' + sSuffix).html();

			var fnAfterDecline = function ()
			{
				// Inform client and hide relevant buttons
				$('#ClientEditTimesheets-Menu-Save' + sSuffix).attr("disabled", true);
				$('#ClientEditTimesheets-Menu-Authorise' + sSuffix).attr("disabled", true);
			};

			// Centralised function used in more than one place
			TriSysWebJobs.Timesheet.ClientDecline(timesheetDetails, fnAfterDecline);

			return true;
		}
	}
};

$(document).ready(function ()
{
    ClientEditTimesheets.Load();
});
