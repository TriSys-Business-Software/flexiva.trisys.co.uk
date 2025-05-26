var ClientTimesheets =
{
    Period_All: "All",

    Load: function ()
    {
        $('#webjobs-customer-name').html(TriSysWebJobs.Agency.CustomerName);

        ClientTimesheets.LoadTimesheetPeriods();

        TriSysSDK.FormMenus.DrawGridMenu('ClientTimesheetsGridMenu', 'divTimesheetsGrid');

		ClientTimesheets.CustomerSpecificConfiguration();

        // TODO: Only if specific system setting is available should we allow bulk timesheet edit
    },

    LoadTimesheetPeriods: function()
    {
        var payloadObject = {};

        payloadObject.URL = 'Timesheets/ClientTimesheetPeriods';
        payloadObject.InboundDataFunction = function (CClientTimesheetPeriodsResponse)
		{
			if (CClientTimesheetPeriodsResponse.Success)
			{
				// Populate a combo with all periods + "All"
				ClientTimesheets.PopulateTimesheetPeriodCombo(CClientTimesheetPeriodsResponse.Periods);
			}
			else
				TriSysApex.UI.ShowMessage("No timesheet periods found.");

            return true;
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            // Probably missing data services key
            console.log('ClientTimesheets.LoadTimesheets : ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    PopulateTimesheetPeriodCombo: function(periods)
	{
		if(periods)
			periods.unshift(ClientTimesheets.Period_All);

        var fnSelectPeriod = function (sPeriodDescription)
        {
            // Save setting
            ClientTimesheets.Persistence.WritePeriod(sPeriodDescription);

            // Populate grid
            ClientTimesheets.LoadTimesheets(sPeriodDescription);
        }

        // Persisted setting
        var sPeriod = ClientTimesheets.Persistence.ReadPeriod();
        if(!sPeriod)
            sPeriod = ClientTimesheets.Period_All;

        TriSysSDK.CShowForm.populateComboFromListOfString("timesheetPeriods", periods, sPeriod, fnSelectPeriod);

        // Populate all
        fnSelectPeriod(sPeriod);
    },

    LoadTimesheets: function (sPeriod)
    {
        // Jan 2018: Use a dedicated API method which abstracts the underlying SQL and does not use 'SQLDatabase/SQL_Select'
        var fnPopulationByFunction = {
            API: "Timesheets/ClientTimesheets",         // The Web API Controller/Function

            // The additional parameters passed into the function not including the paging metrics
            Parameters: function (request)
            {
                request.Period = (sPeriod == ClientTimesheets.Period_All ? '' : sPeriod);

				ClientTimesheets.CustomerSpecificRequest(request);
            },

            DataTableFunction: function (response)      // Called to get a suitable data table for the grid to display
            {
                var timesheets = response.Timesheets;   // The list of records from the Web API

                if (timesheets)
                {
                    // This is a tree structure, which we have to display using top level fields only
                    for (var i = 0; i < timesheets.length; i++)
                    {
                        var timesheet = timesheets[i];
                        var placement = timesheet.Placement;

                        timesheet.Reference = placement.Reference;
                        timesheet.CandidateName = placement.CandidateName;
                        timesheet.JobTitle = placement.JobTitle;
                        timesheet.TotalTimeWorked = timesheet.Timesheet.TotalTimeWorked;
                        timesheet.NetPay = timesheet.Timesheet.NetPay;
                        timesheet.Payrolled = timesheet.Timesheet.Payrolled;
                        timesheet.InputDate = timesheet.Timesheet.InputDate;
                        timesheet.Authorised = timesheet.AuthorisedBy ? 'Yes' : 'No';
                        timesheet.Paid = timesheet.Timesheet.Payrolled ? 'Yes' : 'No';

						var iYear = moment(timesheet.AuthorisationRequested).year();
						if(iYear < 1900)
							timesheet.AuthorisationRequested = null;
						timesheet.AuthorisationRequested = timesheet.AuthorisationRequested;
                    }
                }

                return timesheets;
            }
        };

        ClientTimesheets.PopulateTimesheetGrid(fnPopulationByFunction);
    },

    PopulateTimesheetGrid: function (fnPopulationByFunction)
    {
        var sGridDiv = 'divTimesheetsGrid';

        var columns = TriSysWebJobs.Timesheets.ClientTimesheetsColumns;         // External to allow custom overrides

        var mobileVisibleColumns = [
            { field: "Reference", title: "Timesheet" }
        ];

        // Works correctly, but does not allow drill down on button on mobile
        var mobileRowTemplate = TriSysWebJobs.Timesheets.MobileRowTemplate;     // External to allow custom overrides

        var gridLayout = {
            Div: sGridDiv,
            ID: sGridDiv + 'grd',
            Title: "Timesheets",
            RecordsPerPage: TriSysApex.UserOptions.RecordsPerPage(),
            PopulationByFunction: fnPopulationByFunction,
            Columns: columns,
            MobileVisibleColumns: mobileVisibleColumns,
            MobileRowTemplate: mobileRowTemplate,
            KeyColumnName: "TimesheetId",
            DrillDownFunction: function (rowData)
            {
                TriSysWebJobs.Timesheet.Open(rowData.TimesheetId, true);
            },
            MultiRowSelect: true,
            Grouping: false,
            ColumnFilters: true,
            OpenButtonCaption: "View"
        };

        TriSysSDK.Grid.VirtualMode(gridLayout);
    },

    EditSelected: function()
    {
        // User is allowed to edit all selected timesheets
        var lstItems = TriSysSDK.Grid.GetSelectedMultipleRowsFromGrid("divTimesheetsGrid", "TimesheetId");
        if (lstItems)
        {
            // Persist selected timesheets here
            ClientTimesheets.ListOfSelectedTimesheetId = lstItems;

            // Open form to edit those selected
            TriSysApex.FormsManager.OpenForm("ClientEditTimesheets");
        }
        else
            TriSysApex.UI.ShowMessage("Please select one or more timesheets.");
    },

    ListOfSelectedTimesheetId: null,

    AuthoriseSelected: function()
    {
        // User is allowed to auhorise all selected timesheets
        var lstItems = TriSysSDK.Grid.GetSelectedMultipleRowsFromGrid("divTimesheetsGrid", "TimesheetId");
        if (lstItems)
        {
            var sMessage = "Please confirm that you wish to authorise " + lstItems.length + " selected timesheets?" +
                "<br />Note that each candidate will receive a confirmation e-mail and will be unable to " +
                "make further changes to their timesheet.";

            var fnYes = function ()
            {
                setTimeout(function ()
                {
                    ClientTimesheets.AuthoriseInteractively(lstItems);

                }, 50);

                return true;
            };            

            // Prompt the client
            TriSysApex.UI.questionYesNo(sMessage, "Authorise Timesheets", "Yes", fnYes, "No");
        }
        else
            TriSysApex.UI.ShowMessage("Please select one or more timesheets.");
    },

    AuthoriseInteractively: function (lstItems)
    {
        var lLastTimesheetId = lstItems[lstItems.length - 1];

        var fnConfirmed = function (lTimesheetId)
        {
            // Refresh grid after all updates are complete
            if (lTimesheetId == lLastTimesheetId)
            {
                var sPeriod = TriSysSDK.CShowForm.GetTextFromCombo("timesheetPeriods");
                ClientTimesheets.LoadTimesheets(sPeriod);
            }
        };

        $.each(lstItems, function (index, lTimesheetId)
        {
			TriSysWebJobs.Timesheet.AuthoriseRequest(lTimesheetId, fnConfirmed);
        });
    },

	CustomerSpecificConfiguration: function()
	{
		if(TriSysWebJobs.Agency.CustomerIDMatch("CoSector"))
		{
            $('#clientTimesheets-EditSelected').html('Review and Authorise Selected');
			$('#clientTimesheets-AwaitingAuthorisation-tr').show();

			$('#clientTimesheets-AwaitingAuthorisation').click(function ()
            {
                var bChecked = $(this).is(':checked');
				var sPeriodDescription = TriSysSDK.CShowForm.GetTextFromCombo("timesheetPeriods");
                ClientTimesheets.LoadTimesheets(sPeriodDescription);
            });
		}
	},

	CustomerSpecificRequest: function(request)
	{
		if(TriSysWebJobs.Agency.CustomerIDMatch("CoSector"))
		{
            request.AwaitingAuthorisationOnly = TriSysSDK.CShowForm.GetCheckBoxValue('clientTimesheets-AwaitingAuthorisation');
		}
	},

    Persistence:
    {
        WritePeriod: function (sPeriod)
        {
            ClientTimesheets.Persistence.PutCookie(sPeriod);
        },

        ReadPeriod: function ()
        {
            var sPeriod = ClientTimesheets.Persistence.GetCookie();
            return sPeriod;
        },

         // COOKIES
        // -------

        CookiePrefix: 'ClientTimesheets-Period',

        // Cookie method
        GetCookie: function ()
        {
            var sPeriod = TriSysAPI.Cookies.getCookie(ClientTimesheets.Persistence.CookiePrefix);
            return sPeriod;
        },

        PutCookie: function (sPeriod)
        {
            TriSysAPI.Cookies.setCookie(ClientTimesheets.Persistence.CookiePrefix, sPeriod);
        }
    }
};

$(document).ready(function ()
{
    ClientTimesheets.Load();
});
