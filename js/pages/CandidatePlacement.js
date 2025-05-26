var CandidatePlacement =
{
    Load: function ()
    {
        $('#webjobs-customer-name').html(TriSysWebJobs.Agency.CustomerName);

        var lPlacementId = TriSysWebJobs.Placement.PlacementId;

        // Display the placement               
        CandidatePlacement.ShowPlacementSummary(lPlacementId);
    },

    ShowPlacementSummary: function (lPlacementId)
    {
       var CPlacementRequest =
        {
            PlacementId: lPlacementId
        };

        var payloadObject = {};

        payloadObject.URL = 'Placement/Read';
        payloadObject.OutboundDataPacket = CPlacementRequest;
        payloadObject.InboundDataFunction = function (CPlacementResponse)
        {
            TriSysApex.UI.HideWait();

            if (CPlacementResponse.Success)
            {
                $('#trisys-placement-reference').html(CPlacementResponse.Reference);
                $('#trisys-placement-candidate').html(CPlacementResponse.CandidateName);
                $('#trisys-placement-linemanager').html(CPlacementResponse.LineManagerName);
                $('#trisys-placement-type').html(CPlacementResponse.Type);
                $('#trisys-placement-jobtitle').html(CPlacementResponse.JobTitle);

                var sLocation = CPlacementResponse.Location;
                if (sLocation)
                    sLocation = sLocation.replace(/\n/g, '<br />');

                $('#trisys-placement-location').html(sLocation);

                $('#trisys-placement-company').html(CPlacementResponse.CompanyName);

                var sDescription = CPlacementResponse.Description;

                var sPayType = "Pay Rate(s)";
                var sRemuneration = CPlacementResponse.PayRate;
                if (CPlacementResponse.Type == "Permanent")
                {
                    sPayType = "Salary";
                    sRemuneration = CPlacementResponse.Salary;
                    $('#trisys-placement-enddate-formgroup').hide();
                }

                if(sRemuneration)
                    sRemuneration = sRemuneration.replace(/\n/g, '<br />');

                $('#trisys-placement-remunerationtype').html(sPayType);
                $('#trisys-placement-remuneration').html(sRemuneration);

                var sStartDate = moment(CPlacementResponse.StartDate).format("dddd DD MMMM YYYY");
                $('#trisys-placement-startdate').html(sStartDate);

                if (CPlacementResponse.EndDate)
                {
                    var sEndDate = moment(CPlacementResponse.EndDate).format("dddd DD MMMM YYYY");
                    $('#trisys-placement-enddate').html(sEndDate);
                }

                $("#trisys-placement-jobdescription").html(sDescription);
                if (!sDescription)
                    $('#trisys-placement-jobdescription-formgroup').hide();

                $("#trisys-placement-username").html(CPlacementResponse.UserName);
                fnGetUser(CPlacementResponse.UserId, CPlacementResponse.Reference, CPlacementResponse.JobTitle);

                // Show a list of timesheets for this placement
                CandidatePlacement.LoadTimesheets(lPlacementId, CPlacementResponse.Type);

                // Get the list of those unassigned periods for new timesheets
                var periodList = CPlacementResponse.PeriodDescriptionsUnassignedToTimesheets;
                if (!periodList || periodList.length == 0)
                    $('#CandidatePlacement-Menu-AddTimesheet').attr('disabled', 'disabled');

                // Custom Fields Start
                if (CPlacementResponse.Custom && CPlacementResponse.Custom.SpecialConditions)
                {
                    var sSpecialConditions = CPlacementResponse.Custom.SpecialConditions;
                    if (sSpecialConditions)
                        sSpecialConditions = sSpecialConditions.split("\n").join("<br />");
                    $('#trisys-placement-health-and-safety').html(sSpecialConditions);
                }
                // Custom Fields End

                return true;
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            alert('CandidatePlacement.ShowPlacementSummary: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Reading Placement...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);

        var fnGetUser = function (lUserId, sReference, sJobTitle)
        {
            if (lUserId > 0)
            {
                var CReadUserAccountRequest = { UserId: lUserId };

                var payloadObject = {};

                payloadObject.URL = 'Users/ReadUserAccount';
                payloadObject.OutboundDataPacket = CReadUserAccountRequest;
                payloadObject.InboundDataFunction = function (CReadUserAccountResponse)
                {
                    TriSysApex.UI.HideWait();

                    var user = CReadUserAccountResponse.UserAccount;
                    var contact = user.Contact;

                    if (contact)
                    {
                        $("#trisys-placement-user-name").html(contact.FullName);
                        $("#trisys-placement-user-company").html(contact.CompanyName);
                        $("#trisys-placement-user-jobtitle").html(contact.JobTitle);
                        $("#trisys-placement-user-worktelno").html(contact.WorkTelNo);
                        $("#trisys-placement-user-mobiletelno").html(contact.WorkMobileTelNo);

                        if (user.Photo)
                            $("#trisys-placement-userphoto").attr('src', user.Photo).show();

                        $("#trisys-placement-user-email").attr('href', "mailto:" + contact.WorkEMail + "?subject=" + sReference + ": " + sJobTitle);
                        $("#trisys-placement-user-email").html(contact.WorkEMail);

                        var elemLinkedIn = $('#trisys-placement-user-linkedin');
                        if (elemLinkedIn && contact.LinkedIn)
                            elemLinkedIn.attr('href', contact.LinkedIn);
                    }

                    return true;
                };

                payloadObject.ErrorHandlerFunction = function (request, status, error)
                {
                    TriSysApex.UI.HideWait();
                    alert('CandidatePlacement.ShowVacancySummary.fnGetUser: ' + status + ": " + error + ". responseText: " + request.responseText);
                };

                TriSysApex.UI.ShowWait(null, "Reading Contact Details...");
                TriSysAPI.Data.PostToWebAPI(payloadObject);
            };
        }
    },

    LoadTimesheets: function (lPlacementId, sType)
    {
        var bPermanent = (sType == "Permanent");
        var block = $('#placement-form-timesheets-block');
        if (bPermanent)
        {
            block.hide();
            return;
        }

        // Jan 2018: Use a dedicated API method which abstracts the underlying SQL and does not use 'SQLDatabase/SQL_Select'
        var fnPopulationByFunction = {
            API: "Timesheets/CandidateTimesheets",      // The Web API Controller/Function

            // The additional parameters passed into the function not including the paging metrics
            Parameters: function (request)
            {
                request.PlacementId = lPlacementId;
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
						timesheet.Company = placement.CompanyName;
						timesheet.JobTitle = placement.JobTitle;
						timesheet.TotalTimeWorked = timesheet.Timesheet.TotalTimeWorked;
						timesheet.NetPay = timesheet.Timesheet.NetPay;
						timesheet.Payrolled = timesheet.Timesheet.Payrolled;
						timesheet.InputDate = timesheet.Timesheet.InputDate;
						timesheet.Authorised = timesheet.AuthorisedBy ? 'Yes' : 'No';
						timesheet.Paid = timesheet.Timesheet.Payrolled ? 'Yes' : 'No';
					}
				}

                return timesheets;
            }
        };

        CandidatePlacement.PopulatePlacementsGrid(fnPopulationByFunction, 'divCandidatePlacementTimesheetsGrid');
    },

    PopulatePlacementsGrid: function (fnPopulationByFunction, sGridDiv)
    {
        var columns = [
                { field: "TimesheetId", title: "ID", type: "number", hidden: true },
                { field: "Period", title: "Period", type: "string", width: 200 },
                { field: "InputDate", title: "Input Date", type: "date", format: "{0:dd MMM yyyy}", width: 130 },
                { field: "TotalTimeWorked", title: "Total Time Worked", type: "number", format: "{0:n}", width: 150 },
                { field: "Authorised", title: "Authorised", type: "string" },
                { field: "Paid", title: "Paid", type: "string" }
        ];

        var mobileVisibleColumns = [
            { field: "Period", title: "Details" }
        ];

        // Works correctly, but does not allow drill down on button on mobile
        var mobileRowTemplate = '<td colspan="1"><strong>#: Period # </strong><br />#: Input #<br /><i>#: kendo.format("{0:dd MMM yyyy}", InputDate) #</i><br />' +
                            'Time: #: TotalTimeWorked #<br />Authorised: #: Authorised #<br />Paid: #: Paid #<hr></td>';

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
                TriSysWebJobs.Timesheet.Open(rowData.TimesheetId);
            },
            MultiRowSelect: true,
			Grouping: false,
            ColumnFilters: false,
            OpenButtonCaption: "View"
        };

        TriSysSDK.Grid.VirtualMode(gridLayout);
    },

    AddTimesheet: function ()
    {
        var lPlacementId = TriSysWebJobs.Placement.PlacementId;
        if (!lPlacementId || lPlacementId <= 0)
            return;

        TriSysWebJobs.Timesheet.Open(0);
    },

    DeleteTimesheets: function ()
    {
        TriSysApex.UI.ShowMessage("You are not authorised to delete timesheets.", TriSysWebJobs.Constants.ApplicationName);
    }

};

$(document).ready(function ()
{
    CandidatePlacement.Load();
});
