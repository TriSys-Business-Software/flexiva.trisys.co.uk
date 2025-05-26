var ctrlCustomStartEndDates =
{
    Load: function (dtStart, dtEnd)
    {
        TriSysSDK.CShowForm.datePicker('ctrlCustomStartEndDates-start');
        TriSysSDK.CShowForm.datePicker('ctrlCustomStartEndDates-end');

        if (dtStart)
            TriSysSDK.CShowForm.setDatePickerValue('ctrlCustomStartEndDates-start', dtStart);

        if (dtEnd)
            TriSysSDK.CShowForm.setDatePickerValue('ctrlCustomStartEndDates-end', dtEnd);
    },

    SetButtonClick: function(fnOnSet)
    {
        // Validation
        var dtStartDate = TriSysSDK.CShowForm.getDatePickerValue('ctrlCustomStartEndDates-start');
        var dtEndDate = TriSysSDK.CShowForm.getDatePickerValue('ctrlCustomStartEndDates-end');

        var sValidationError = null;
        if (!dtStartDate || !dtEndDate)
            sValidationError = "Start date and end date must be set";
        else if (dtStartDate > dtEndDate)
            sValidationError = "Start date must be before or equal to end date";

        if (sValidationError)
        {
            TriSysApex.UI.ShowMessage(sValidationError);
            return;
        }

        // Set to start of day 1 and end of day 2
        var iYear = moment(dtStartDate).year();
        var iMonth = moment(dtStartDate).month();   // Yes - moment() uses zero indexes!
        var iDay = moment(dtStartDate).date();      // Yes - day() returns 0-7 day of the week!
        var dtStart = new Date(iYear, iMonth, iDay, 0, 0, 0, 0);

        iYear = moment(dtEndDate).year();
        iMonth = moment(dtEndDate).month();   // Yes - moment() uses zero indexes!
        iDay = moment(dtEndDate).date();      // Yes - day() returns 0-7 day of the week!
        var dtEnd = new Date(iYear, iMonth, iDay, 23, 59, 59, 0);

        fnOnSet(dtStart, dtEnd);
    }
};