var CandidateTimesheets =
{
    Load: function ()
    {
        $('#webjobs-customer-name').html(TriSysWebJobs.Agency.CustomerName);

        CandidateTimesheets.LoadTimesheets();
    },

    LoadTimesheets: function()
    {
        // Jan 2018: Use a dedicated API method which abstracts the underlying SQL and does not use 'SQLDatabase/SQL_Select'
        var fnPopulationByFunction = {
            API: "Timesheets/CandidateTimesheets",      // The Web API Controller/Function

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
						timesheet.Company = placement.CompanyName;
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

        CandidateTimesheets.PopulateTimesheetGrid(fnPopulationByFunction);        
    },

    PopulateTimesheetGrid: function (fnPopulationByFunction)
    {
        var sGridDiv = 'divTimesheetsGrid';

        var columns = [
                { field: "TimesheetId", title: "ID", type: "number", width: 80 },
                { field: "Reference", title: "Placement", type: "string" },
                { field: "Company", title: "Company", type: "string" },
                { field: "JobTitle", title: "JobTitle", type: "string" },
                { field: "Period", title: "Period", type: "string" },
                { field: "InputDate", title: "Input Date", type: "date", format: "{0:dd MMM yyyy}" },
                { field: "TotalTimeWorked", title: "Total Time Worked", type: "number", format: "{0:n}" },
				{ field: "AuthorisationRequested", title: "Auth. Requested", type: "date", format: "{0:dd MMM yyyy}" },
                { field: "Authorised", title: "Authorised", type: "string" },
                { field: "Paid", title: "Paid", type: "string" }
        ];

        var mobileVisibleColumns = [
            { field: "Reference", title: "Timesheet" }
        ];

        // Works correctly, but does not allow drill down on button on mobile
        var mobileRowTemplate = '<td colspan="1"><strong>#: Reference # </strong>: #: Company #<br />#: Period #<br /><i>#: kendo.format("{0:dd MMM yyyy}", InputDate) #</i><br />' +
                            'Time: #: TotalTimeWorked #<br />Authorised: #: Authorised #<br />Paid: #: Paid #<hr></td>';

        var gridLayout = {
            Div: sGridDiv,
            ID: sGridDiv + 'grd',
            Title: "Timesheets",
            RecordsPerPage: TriSysApex.UserOptions.RecordsPerPage(),
            PopulationByFunction: fnPopulationByFunction,
            PopulationByObject: null,
            Columns: columns,
            MobileVisibleColumns: mobileVisibleColumns,
            MobileRowTemplate: mobileRowTemplate,
            KeyColumnName: "TimesheetId",
            DrillDownFunction: function (rowData)
            {
                TriSysWebJobs.Timesheet.Open(rowData.TimesheetId);
            },
            MultiRowSelect: true,
			Grouping: false,
            ColumnFilters: true,
            OpenButtonCaption: "View"
        };

        TriSysSDK.Grid.VirtualMode(gridLayout);
    },

    AddTimesheet: function ()
    {
        var fnYes = function ()
        {
            TriSysApex.FormsManager.OpenForm("CandidatePlacements", null, true);
            return true;
        };

        var sMessage = "Timesheets can be added from placement records.<br />Show all placements?";
        TriSysApex.UI.questionYesNo(sMessage, TriSysWebJobs.Constants.ApplicationName, "Yes", fnYes, "No");
    },

    DeleteTimesheets: function ()
    {
        TriSysApex.UI.ShowMessage("You are not authorised to delete timesheets.", TriSysWebJobs.Constants.ApplicationName);
    }
};

$(document).ready(function ()
{
    CandidateTimesheets.Load();
});
