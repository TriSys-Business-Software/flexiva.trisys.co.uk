var TimesheetPeriods =
{
    FrequenciesComboId: 'timesheetPeriods-Frequencies',
    PeriodGridID: "timesheetPeriods-PeriodGrid",
    IntervalGridID: "timesheetPeriods-IntervalGrid",
    StartDateID: 'timesheetPeriods-StartDate',
    EndDateID: 'timesheetPeriods-EndDate',
    DaysPerPeriodID: 'timesheetPeriods-DaysPerPeriod',
    NumberOfPeriodsID: 'timesheetPeriods-NumberOfPeriods',
    FrequenciesBlockID: 'timesheetPeriods-FrequenciesBlock',
    AddPeriodBlockID: 'timesheetPeriods-AddPeriodBlock',
    SelectedPeriodID: 'timesheetPeriods-SelectedPeriod',
    PeriodSelectedCounterID: 'timesheetPeriods-period-grid-selected-counter',

    Load: function()
    {
        // Size the views
        var iFudgeFactor = 365;
        var lHeight = $(window).height() - iFudgeFactor;
        $('#timesheetPeriods-Splitter-vertical').height(lHeight);

        $("#timesheetPeriods-Splitter-vertical").kendoSplitter({
            orientation: "vertical",
            panes: [
				{ collapsible: false }
            ]
        });

        var iWidth = $('#timesheetPeriods-Splitter').width();
        var sHalfWidth = (iWidth / 2) + 'px';

        $("#timesheetPeriods-Splitter-horizontal").kendoSplitter({
            panes: [
				{ collapsible: false, size: sHalfWidth },
				{ collapsible: false }
            ]
        });

        TimesheetPeriods.LoadFrequencies();
        TimesheetPeriods.LoadWidgets();
    },

    LoadWidgets: function()
    {
        TriSysSDK.CShowForm.datePicker(TimesheetPeriods.StartDateID);
        TriSysSDK.CShowForm.datePicker(TimesheetPeriods.EndDateID);

        var fieldDescription = { MinValue: 1, MaxValue: 52, SpinIncrement: 1, DefaultValue: 1, Format: "0" };
        TriSysSDK.Controls.NumericSpinner.Initialise(TimesheetPeriods.NumberOfPeriodsID, fieldDescription);

        fieldDescription.MaxValue = 31;
        TriSysSDK.Controls.NumericSpinner.Initialise(TimesheetPeriods.DaysPerPeriodID, fieldDescription);
        
        var lHeight = $('#' + TimesheetPeriods.AddPeriodBlockID).height();
        $('#' + TimesheetPeriods.FrequenciesBlockID).height(lHeight);
    },

    LoadFrequencies: function()
    {
        var payloadObject = {};

        payloadObject.URL = 'TimesheetPeriod/Frequencies';
        payloadObject.OutboundDataPacket = null;
        payloadObject.InboundDataFunction = function (CFrequenciesResponse)
        {
            TriSysApex.UI.HideWait();

            if (CFrequenciesResponse.Success)
                TimesheetPeriods.PopulateFrequenciesCombo(CFrequenciesResponse.Frequencies);
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error) {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.ShowError('TimesheetPeriods.LoadFrequencies: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Reading Frequencies...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    PopulateFrequenciesCombo: function(frequencies)
    {
        var iIndex = 0;
        var lstFrequencies = TriSysSDK.CShowForm.generateDataSourceFromListOfString(frequencies);
        TriSysSDK.CShowForm.populateComboFromDataSource(TimesheetPeriods.FrequenciesComboId, lstFrequencies,
                                                    iIndex, TimesheetPeriods.LoadPeriodsAfterFrequencySelection);
        TimesheetPeriods.LoadPeriodsAfterFrequencySelection(frequencies[iIndex]);
    },

    LoadPeriodsAfterFrequencySelection: function(sFrequency)
    {
        TimesheetPeriods.ClearIntervalGrid();
        TimesheetPeriods.PopulatePeriodGrid(sFrequency);
    },

    PopulatePeriodGrid: function (sFrequency)
    {
       // Master/detail event handler
        var fnRowClickHandler = function (e, gridObject, gridLayout)
        {
            var lstTimesheetPeriodID = TimesheetPeriods.GetSelectedTimesheetPeriods();
            if (lstTimesheetPeriodID.length > 0)
            {
                var sDisplay = lstTimesheetPeriodID.length + " Period" + (lstTimesheetPeriodID.length == 1 ? "" : "s");
                TimesheetPeriods.DisplaySelectedPeriodAboveIntervalGrid(sDisplay);
                TimesheetPeriods.PopulateIntervalGrid(lstTimesheetPeriodID);
            }
            else
                TimesheetPeriods.ClearIntervalGrid();

            /* Ye-Olde single selection method
            var selectedItem = TriSysSDK.Grid.GetFirstGridCheckedItem(gridObject);

            if (selectedItem)
            {
                var lTimesheetPeriodID = selectedItem.TimesheetPeriodID;
                var sPeriod = selectedItem.Description;
                
                TimesheetPeriods.DisplaySelectedPeriodAboveIntervalGrid(sPeriod);
                TimesheetPeriods.PopulateIntervalGrid(lTimesheetPeriodID);
            }
            */
        };

        // Always select the first row and populate the intervals purely for aesthetics
        var bPopulated = false;
        var fnPostPopulationCallback = function (lRecordCount) {
            if (!bPopulated) {
                TriSysSDK.Grid.SelectFirstRow(TimesheetPeriods.PeriodGridID);
            }
            bPopulated = true;
        };

        TriSysSDK.Grid.VirtualMode({
            Div: TimesheetPeriods.PeriodGridID,
            ID: TimesheetPeriods.PeriodGridID - '-GridInstance',
            Title: "Periods",
            RecordsPerPage: TriSysApex.UserOptions.RecordsPerPage(),
            PopulationByFunction: {
                API: "TimesheetPeriod/List",                // The Web API Controller/Function
                Parameters: function (request)
                {
                    request.Frequency = sFrequency;         // The current frequency
                },
                DataTableFunction: function (response)      // Called to get a suitable data table for the grid to display
                {
                    return response.Periods;                // The data table from the Web API
                }
            },

            Columns: [
                { field: "TimesheetPeriodID", title: "TimesheetPeriodID", type: "number", width: 70, hidden: true },
                { field: "StartDate", title: "Start Date", type: "date", format: "{0:ddd dd MMM yyyy }", width: 200 },
                { field: "EndDate", title: "End Date", type: "date", format: "{0:ddd dd MMM yyyy }", width: 200 },
                { field: "Description", title: "Description", type: "string" }
            ],
            KeyColumnName: "TimesheetPeriodID",
            DrillDownFunction: null,
            MultiRowSelect: true,
            SingleRowSelect: false,
            RowClickHandler: fnRowClickHandler,
            PostPopulationCallback: fnPostPopulationCallback,
            Grouping: false,
            SelectedRowsCounterId: TimesheetPeriods.PeriodSelectedCounterID
        });
    },

    PopulateIntervalGrid: function(lstTimesheetPeriodID)
    {
        TriSysSDK.Grid.VirtualMode(
        {
            Div: TimesheetPeriods.IntervalGridID,
            ID: TimesheetPeriods.IntervalGridID - '-GridInstance',
            Title: "Intervals",
            RecordsPerPage: TriSysApex.UserOptions.RecordsPerPage(),
            PopulationByFunction: {
                API: "TimesheetPeriod/IntervalList",        // The Web API Controller/Function
                Parameters: function (request) {
                    request.TimesheetPeriodIDList = lstTimesheetPeriodID;
                },
                DataTableFunction: function (response)      // Called to get a suitable data table for the grid to display
                {
                    return response.Intervals;                // The data table from the Web API
                }
            },

            Columns: [
                { field: "TimesheetPeriodID", title: "TimesheetPeriodID", type: "number", width: 70, hidden: true },
                { field: "TimesheetPeriodIntervalID", title: "TimesheetPeriodIntervalID", type: "number", width: 70, hidden: true },
                { field: "StartDate", title: "Start Date", type: "date", format: "{0:ddd dd MMM yyyy }", width: 200 },
                { field: "EndDate", title: "End Date", type: "date", format: "{0:ddd dd MMM yyyy }", width: 200 },
                { field: "Description", title: "Description", type: "string" }
            ],
            KeyColumnName: "TimesheetPeriodIntervalID",
            DrillDownFunction: null,
            MultiRowSelect: false,
            SingleRowSelect: true,
            Grouping: false
        });
    },

    DisplaySelectedPeriodAboveIntervalGrid: function(sPeriod)
    {
        $('#' + TimesheetPeriods.SelectedPeriodID).text(sPeriod ? ': ' + sPeriod : '');
    },

    ClearIntervalGrid: function()
    {
        TimesheetPeriods.DisplaySelectedPeriodAboveIntervalGrid(null);
        TriSysSDK.Grid.Clear(TimesheetPeriods.IntervalGridID);
    },

    DeleteFrequency: function()
    {
        TriSysApex.UI.ShowMessage("You must be a system administrator to delete frequencies from the admin console.");
    },

    AddPeriod: function()
    {
        var sFrequency = TriSysSDK.CShowForm.GetTextFromCombo(TimesheetPeriods.FrequenciesComboId);
        var dtStart = TriSysSDK.CShowForm.getDatePickerValue(TimesheetPeriods.StartDateID);
        var dtEnd = TriSysSDK.CShowForm.getDatePickerValue(TimesheetPeriods.EndDateID);
        var iNumberOfPeriods = parseInt(TriSysSDK.Controls.NumericSpinner.GetValue(TimesheetPeriods.NumberOfPeriodsID, 0));
        var iDaysPerPeriod = parseInt(TriSysSDK.Controls.NumericSpinner.GetValue(TimesheetPeriods.DaysPerPeriodID, 0));

        var sError = null;
        if (!sFrequency) sError = "Frequency";
        if (!dtStart) sError = "Start Date";
        if (iDaysPerPeriod <= 0) sError = "Days per Period";

        if(sError)
        {
            TriSysApex.UI.ShowMessage(sError + " must be set.");
            return;
        }

        TimesheetPeriods.GenerateTimesheetPeriods({
            Frequency: sFrequency,
            StartDate: dtStart,
            EndDate: dtEnd,
            NumberOfPeriods: iNumberOfPeriods,
            DaysPerPeriod: iDaysPerPeriod
        });
    },

    GetSelectedTimesheetPeriods: function ()
    {
        var lst = [];
        var selectedRows = TriSysSDK.Grid.GetCheckedRows(TimesheetPeriods.PeriodGridID);
        if (selectedRows && selectedRows.length > 0)
        {
            selectedRows.forEach(function (row) {
                var lTimesheetPeriodID = row.TimesheetPeriodID;
                lst.push(lTimesheetPeriodID);
            });
        }

        return lst;
    },

    DeletePeriod: function()
    {
        var lstTimesheetPeriodID = TimesheetPeriods.GetSelectedTimesheetPeriods();
        if (lstTimesheetPeriodID.length == 0)
            return;

        var sMessage = "Are you sure that you wish to delete " + lstTimesheetPeriodID.length +
                        " timesheet period" + (lstTimesheetPeriodID.length == 1 ? "" : "s") + " and all intervals?";
        TriSysApex.UI.questionYesNo(sMessage, "Delete Timesheet Periods", "Yes",
            function () {
                setTimeout(function () { TimesheetPeriods.DeletePeriodViaWebAPI(lstTimesheetPeriodID); }, 10);
                return true;
            },
            "No");
    },

    DeletePeriodViaWebAPI: function (lstTimesheetPeriodID)
    {
        var payloadObject = {};

        payloadObject.URL = 'TimesheetPeriod/DeletePeriod';
        payloadObject.OutboundDataPacket = { TimesheetPeriodIDList: lstTimesheetPeriodID };
        payloadObject.InboundDataFunction = function (CDeletePeriodResponse)
        {
            TriSysApex.UI.HideWait();

            if (CDeletePeriodResponse.Success)
            {
                TimesheetPeriods.RefreshPeriodGrid();
            }
            else
                TriSysApex.UI.ShowError(CDeletePeriodResponse.ErrorMessage);
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error) {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.ShowError('TimesheetPeriods.DeletePeriodViaWebAPI: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Deleting Timesheet Period...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    RefreshPeriodGrid: function()
    {
        var sFrequency = TriSysSDK.CShowForm.GetTextFromCombo(TimesheetPeriods.FrequenciesComboId);
        TimesheetPeriods.LoadPeriodsAfterFrequencySelection(sFrequency);
        $('#' + TimesheetPeriods.PeriodSelectedCounterID).text('');
    },

    GenerateTimesheetPeriods: function(CAddRequest)
    {
        var payloadObject = {};

        payloadObject.URL = 'TimesheetPeriod/Add';
        payloadObject.OutboundDataPacket = CAddRequest;
        payloadObject.InboundDataFunction = function (CAddResponse) {
            TriSysApex.UI.HideWait();

            if (CAddResponse.Success) {
                TimesheetPeriods.RefreshPeriodGrid();
            }
            else
                TriSysApex.UI.ShowError(CAddResponse.ErrorMessage);
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error) {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.ShowError('TimesheetPeriods.GenerateTimesheetPeriods: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Generating Timesheet Periods...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    }

};  // TimesheetPeriods


$(document).ready(function () {
    TimesheetPeriods.Load();
});