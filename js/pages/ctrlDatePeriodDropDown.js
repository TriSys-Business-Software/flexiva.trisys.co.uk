var ctrlDatePeriodDropDown =
{
    // Called dynamically with ID of our parent DIV so that we can ensure unique naming and events
    Load: function (sParentID, dtStart, dtEnd, fnCallback)
    {
        var sRoot = 'ctrlDatePeriodDropDown-Root';

        TriSysSDK.Controls.General.RenameElementIdsWithParentIdPrefixOrSuffix(sRoot, sParentID, true);

        var sPrefix = sParentID + '-';

        $('#' + sRoot).attr("id", sPrefix + sRoot);
        sRoot = sPrefix + sRoot;

        
        //#region Failed event handling

        //var sStartDateID = sPrefix + 'ctrlDatePeriodDropDown-StartDate';
        //TriSysSDK.CShowForm.datePicker(sStartDateID);

        // Never fires
        //$("#" + sStartDateID).datepicker({
        //    dateFormat: 'dd-mm-yy',
        //    firstDay: 1,			// sets first day of the week to Monday
        //    minDate: 1,			// sets first available date in calendar to tomorrow's date
        //    showOtherMonths: true,			// displays days at beginning or end of adjacent months
        //    selectOtherMonths: true
        //}).click(function (e)
        //{
        //    e.stopPropagation();
        //});

        //$("#" + sStartDateID).kendoDatePicker({
        //    change: function (event)
        //    {
        //        var d = this.value();
        //        var t = new Date();
        //        // some validations here
        //        console.log(d, t);
        //        console.log(typeof d, typeof t);
        //        if (d > t)
        //        {
        //            console.log("here");
        //            event.preventDefault();
        //            event.stopPropagation();
        //        }
        //    }
        //});
        //
        //$('#' + sStartDateID).click(function (e)
        //{
        //    e.stopPropagation(); // <--- here

        //    $('#' + sRoot).click(function (e)
        //    {
        //        e.stopPropagation(); // <--- here
        //    });
        //});

        //var sEndDateID = sPrefix + 'ctrlDatePeriodDropDown-EndDate';
        //TriSysSDK.CShowForm.datePicker(sEndDateID);

        //#endregion Failed event handling

        // Add event handlers to all menu items
        $('#' + sPrefix + 'ctrlDatePeriodDropDown-Today').click(function (e) { e.preventDefault(); ctrlDatePeriodDropDown.MenuHandler(sPrefix, 'Today', fnCallback); });
        $('#' + sPrefix + 'ctrlDatePeriodDropDown-Yesterday').click(function (e) { e.preventDefault(); ctrlDatePeriodDropDown.MenuHandler(sPrefix, 'Yesterday', fnCallback); });
        $('#' + sPrefix + 'ctrlDatePeriodDropDown-ThisWeek').click(function (e) { e.preventDefault(); ctrlDatePeriodDropDown.MenuHandler(sPrefix, 'This Week', fnCallback); });
        $('#' + sPrefix + 'ctrlDatePeriodDropDown-LastWeek').click(function (e) { e.preventDefault(); ctrlDatePeriodDropDown.MenuHandler(sPrefix, 'Last Week', fnCallback); });
        $('#' + sPrefix + 'ctrlDatePeriodDropDown-ThisMonth').click(function (e) { e.preventDefault(); ctrlDatePeriodDropDown.MenuHandler(sPrefix, 'This Month', fnCallback); });
        $('#' + sPrefix + 'ctrlDatePeriodDropDown-LastMonth').click(function (e) { e.preventDefault(); ctrlDatePeriodDropDown.MenuHandler(sPrefix, 'Last Month', fnCallback); });
        $('#' + sPrefix + 'ctrlDatePeriodDropDown-Last6Months').click(function (e) { e.preventDefault(); ctrlDatePeriodDropDown.MenuHandler(sPrefix, 'Last 6 Months', fnCallback); });
        $('#' + sPrefix + 'ctrlDatePeriodDropDown-Last12Months').click(function (e) { e.preventDefault(); ctrlDatePeriodDropDown.MenuHandler(sPrefix, 'Last 12 Months', fnCallback); });
        $('#' + sPrefix + 'ctrlDatePeriodDropDown-ThisQuarter').click(function (e) { e.preventDefault(); ctrlDatePeriodDropDown.MenuHandler(sPrefix, 'This Quarter', fnCallback); });
        $('#' + sPrefix + 'ctrlDatePeriodDropDown-LastQuarter').click(function (e) { e.preventDefault(); ctrlDatePeriodDropDown.MenuHandler(sPrefix, 'Last Quarter', fnCallback); });
        $('#' + sPrefix + 'ctrlDatePeriodDropDown-ThisYear').click(function (e) { e.preventDefault(); ctrlDatePeriodDropDown.MenuHandler(sPrefix, 'This Year', fnCallback); });
        $('#' + sPrefix + 'ctrlDatePeriodDropDown-LastYear').click(function (e) { e.preventDefault(); ctrlDatePeriodDropDown.MenuHandler(sPrefix, 'Last Year', fnCallback); });

        $('#' + sPrefix + 'ctrlDatePeriodDropDown-Custom').click(function (e) { e.preventDefault(); ctrlDatePeriodDropDown.MenuHandler(sPrefix, 'Custom', fnCallback); });
        

        // Set default time from default setting for this instance: TODO
        var dtNow = new Date();
        var sPeriod = (dtStart && dtEnd ? "Custom" : "This Month");
        ctrlDatePeriodDropDown.MenuHandler(sPrefix, sPeriod, fnCallback, dtStart, dtEnd);
    },

    ShowDatesInButton: function (sPrefix, sType, dtStart, dtEnd)
    {
        var iStartYear = moment(dtStart).year();
        var iStartMonth = moment(dtStart).month();   // Yes - moment() uses zero indexes!
        var iStartDay = moment(dtStart).date();      // Yes - day() returns 0-7 day of the week!

        var iEndYear = moment(dtEnd).year();
        var iEndMonth = moment(dtEnd).month();   // Yes - moment() uses zero indexes!
        var iEndDay = moment(dtEnd).date();      // Yes - day() returns 0-7 day of the week!

        var bPhone = TriSysApex.Device.isPhone();
        var sDateFormat = bPhone ? 'DD/MM/YYYY' : 'dddd DD MMMM YYYY';

        var sRange = moment(dtStart).format(sDateFormat) + (bPhone ? " - " : " to ") + moment(dtEnd).format(sDateFormat);
        if (iStartYear == iEndYear && iStartMonth == iEndMonth && iStartDay == iEndDay)
            sRange = moment(dtStart).format(sDateFormat);

        var sDateRange = bPhone ? '<span style="font-size: x-small;">' + sRange + '</span>' : sRange;
        $('#' + sPrefix + 'ctrlDatePeriodDropDown-MenuCaption').html("<b>" + sType + "</b> &nbsp; " + sDateRange);
    },

    MenuHandler: function (sPrefix, sItem, fnCallback, dtStart, dtEnd)
    {
        var fnSet = function (dtCustomStart, dtCustomEnd)
        {
            // Show in button
            ctrlDatePeriodDropDown.ShowDatesInButton(sPrefix, sItem, dtCustomStart, dtCustomEnd);

            // Record in control specific settings
            $('#' + sPrefix + 'ctrlDatePeriodDropDown-CustomStartDate').html(dtCustomStart);
            $('#' + sPrefix + 'ctrlDatePeriodDropDown-CustomEndDate').html(dtCustomEnd);

            // Fire event now
            fnCallback(dtCustomStart, dtCustomEnd);
        };

        if (!dtStart && !dtEnd)        
        {
            var dtNow = new Date();
            var iYear = moment(dtNow).year();
            var iMonth = moment(dtNow).month();   // Yes - moment() uses zero indexes!
            var iDay = moment(dtNow).date();      // Yes - day() returns 0-7 day of the week!
            var dtStartOfToday = new Date(iYear, iMonth, iDay, 0, 0, 0, 0);
            var dtEndOfToday = new Date(iYear, iMonth, iDay, 23, 59, 59, 0);

            switch (sItem)
            {
                case 'Today':
                    dtStart = dtStartOfToday;
                    dtEnd = dtEndOfToday;
                    break;

                case 'Yesterday':
                    dtStart = new Date(moment(dtStartOfToday).add(-1, 'days'));
                    dtEnd = new Date(moment(dtEndOfToday).add(-1, 'days'));
                    break;

                case 'This Week':
                    // Move the start date to the start of this week
                    dtStart = dtStartOfToday;
                    while (moment(dtStart).day() > 0)
                        dtStart = new Date(moment(dtStart).add(-1, 'days'));
                    dtStart = new Date(moment(dtStart).add(1, 'days'));
                    dtEnd = new Date(moment(dtStart).add(6, 'days'));
                    dtEnd = new Date(moment(dtEnd).year(), moment(dtEnd).month(), moment(dtEnd).date(), 23, 59, 59, 0);
                    break;

                case 'Last Week':
                    // Move the start date to the start of last week
                    dtStart = moment(dtStartOfToday).add(-7, 'days');
                    while (moment(dtStart).day() > 0)
                        dtStart = new Date(moment(dtStart).add(-1, 'days'));
                    dtStart = new Date(moment(dtStart).add(1, 'days'));
                    dtEnd = new Date(moment(dtStart).add(6, 'days'));
                    dtEnd = new Date(moment(dtEnd).year(), moment(dtEnd).month(), moment(dtEnd).date(), 23, 59, 59, 0);
                    break;

                case 'This Month':
                    dtStart = new Date(iYear, iMonth, 1, 0, 0, 0, 0);
                    dtEnd = dtEndOfToday;
                    while (moment(dtEnd).month() == iMonth)
                        dtEnd = new Date(moment(dtEnd).add(1, 'days'));
                    dtEnd = new Date(moment(dtEnd).add(-1, 'days'));
                    break;

                case 'Last Month':
                    dtStart = new Date(iYear, iMonth, 1, 0, 0, 0, 0);
                    dtStart = new Date(moment(dtStart).add(-1, 'months'));
                    iMonth = moment(dtStart).month();
                    dtEnd = new Date(moment(dtEndOfToday).add(-1, 'months'));;
                    while (moment(dtEnd).month() == iMonth)
                        dtEnd = new Date(moment(dtEnd).add(1, 'days'));
                    dtEnd = new Date(moment(dtEnd).add(-1, 'days'));
                    break;

                case 'This Quarter':
                    dtStart = new Date(iYear, iMonth, 1, 0, 0, 0, 0);
                    while (true)     // 0 (Jan-1), 3 (Apr-4, 6 (Jul-7), 9 (Oct-10)
                    {
                        iMonth = moment(dtStart).month();     // 0 (Jan-1), 3 (Apr-4), 6 (Jul-7), 9 (Oct-10)
                        if (iMonth == 0 || iMonth == 3 || iMonth == 6 || iMonth == 9)
                            break;
                        dtStart = new Date(moment(dtStart).add(-1, 'months'));
                    }
                    var dtNextQuarter = new Date(moment(dtStart).add(3, 'months'));
                    var dtEnd = new Date(moment(dtNextQuarter).add(-1, 'days'));
                    dtEnd = new Date(moment(dtEnd).year(), moment(dtEnd).month(), moment(dtEnd).date(), 23, 59, 59, 0);
                    break;

                case 'Last Quarter':
                    dtStart = new Date(iYear, iMonth, 1, 0, 0, 0, 0);
                    dtStart = new Date(moment(dtStart).add(-3, 'months'));
                    while (true)     // 0 (Jan-1), 3 (Apr-4, 6 (Jul-7), 9 (Oct-10)
                    {
                        iMonth = moment(dtStart).month();     // 0 (Jan-1), 3 (Apr-4), 6 (Jul-7), 9 (Oct-10)
                        if (iMonth == 0 || iMonth == 3 || iMonth == 6 || iMonth == 9)
                            break;
                        dtStart = new Date(moment(dtStart).add(-1, 'months'));
                    }
                    var dtNextQuarter = new Date(moment(dtStart).add(3, 'months'));
                    var dtEnd = new Date(moment(dtNextQuarter).add(-1, 'days'));
                    dtEnd = new Date(moment(dtEnd).year(), moment(dtEnd).month(), moment(dtEnd).date(), 23, 59, 59, 0);
                    break;

                case 'Last 6 Months':
                    dtStart = new Date(moment(dtStartOfToday).add(-6, 'months'));
                    dtEnd = new Date(moment(dtEndOfToday).add(-1, 'days'));
                    break;

                case 'Last 12 Months':
                    dtStart = new Date(moment(dtStartOfToday).add(-1, 'years'));
                    dtEnd = new Date(moment(dtEndOfToday).add(-1, 'days'));
                    break;

                case 'This Year':
                    dtStart = new Date(iYear, 0, 1, 0, 0, 0, 0);
                    dtEnd = new Date(iYear, 11, 31, 23, 59, 59, 0);
                    break;

                case 'Last Year':
                    dtStart = new Date(iYear - 1, 0, 1, 0, 0, 0, 0);
                    dtEnd = new Date(iYear - 1, 11, 31, 23, 59, 59, 0);
                    break;

                case 'Custom':
                    // Popup a dialogue to capture date range
                    ctrlDatePeriodDropDown.PopUpCustomDateModal(sPrefix, fnSet);
                    return;
            }
        }

        if (dtStart || dtEnd)
            fnSet(dtStart, dtEnd);
    },

    PopUpCustomDateModal: function (sPrefix, fnCallback)
    {
        var parametersObject = new TriSysApex.UI.ShowMessageParameters();
        parametersObject.Title = "Custom Dates";
        parametersObject.Image = "gi-calendar";

        parametersObject.ContentURL = TriSysApex.Constants.UserControlFolder + "ctrlCustomStartEndDates.html";

        parametersObject.OnLoadCallback = function ()
        {
            // Read from control specific settings
            var dtCustomStart = $('#' + sPrefix + 'ctrlDatePeriodDropDown-CustomStartDate').html();
            var dtCustomEnd = $('#' + sPrefix + 'ctrlDatePeriodDropDown-CustomEndDate').html();

            ctrlCustomStartEndDates.Load(dtCustomStart, dtCustomEnd);
        };

        parametersObject.ButtonRightText = "Cancel";
        parametersObject.ButtonRightVisible = true;

        parametersObject.ButtonLeftText = "Set";
        parametersObject.ButtonLeftVisible = true;
        parametersObject.ButtonLeftFunction = function ()
        {
            var fnOnSet = function (dtCustomStart, dtCustomEnd)
            {
                TriSysApex.UI.CloseModalPopup();
                fnCallback(dtCustomStart, dtCustomEnd);
            };

            ctrlCustomStartEndDates.SetButtonClick(fnOnSet);
        };

        TriSysApex.UI.PopupMessage(parametersObject);
    }

};