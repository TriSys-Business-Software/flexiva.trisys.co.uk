var ctrlSnooze =
{
    SnoozeDateTimeID: 'snooze-DateTime',
    SnoozeDateTimeColumn: 'snooze-DateTime-column',
    SnoozePickID: 'snooze-pick',

    SnoozePeriods: [
            { ID: '1-minute', Label: '1 Minute', Minutes: 1, Weeks: 0, Months: 0 },
            { ID: '5-minutes', Label: '5 Minutes', Minutes: 5, Weeks: 0, Months: 0, Selected: true },
            { ID: '10-minutes', Label: '10 Minutes', Minutes: 10, Weeks: 0, Months: 0 },
            { ID: '15-minutes', Label: '15 Minutes', Minutes: 15, Weeks: 0, Months: 0 },
            { ID: '30-minutes', Label: '30 Minutes', Minutes: 30, Weeks: 0, Months: 0 },
            { ID: '1-hour', Label: '1 Hour', Minutes: 60, Weeks: 0, Months: 0 },
            { ID: '2-hours', Label: '2 Hours', Minutes: 120, Weeks: 0, Months: 0 },
            { ID: '5-hours', Label: '5 Hours', Minutes: 300, Weeks: 0, Months: 0 },
            { ID: '24-hours', Label: '24 Hours', Minutes: 1440, Weeks: 0, Months: 0 },
            { ID: '1-week', Label: '1 Week', Minutes: 0, Weeks: 1, Months: 0 },
            { ID: '1-month', Label: '1 Month', Minutes: 0, Weeks: 0, Months: 1 },
            { ID: 'pick', Label: 'Pick Date/Time', Minutes: 0, Weeks: 0, Months: 0 }
    ],

    Load: function()
    {
        TriSysSDK.CShowForm.dateTimePicker(ctrlSnooze.SnoozeDateTimeID);

        var dtFollowUp = TriSysActions.FollowUp.FollowUpDateTomorrow();
        TriSysSDK.CShowForm.setDateTimePickerValue(ctrlSnooze.SnoozeDateTimeID, dtFollowUp);

        for (var i = 0; i < ctrlSnooze.SnoozePeriods.length; i++)
        {
            var period = ctrlSnooze.SnoozePeriods[i];
            var sID = 'snooze-' + period.ID;

            $("#" + sID).kendoRadioButton({
                checked: period.Selected,
                label: "  " + period.Label,
                size: "large"
            });

            $('#' + sID).on('click', function (e)
            {
                var sClickedID = e.target.id;
                if (sClickedID == ctrlSnooze.SnoozePickID)
                    $('#' + ctrlSnooze.SnoozeDateTimeColumn).show();
                else
                    $('#' + ctrlSnooze.SnoozeDateTimeColumn).hide();

                ctrlSnooze.SetSelectedPeriod(sClickedID);
            });
        }
        
        //$('#snooze-5-minutes').trigger('click');  // 03 May 2024: Not needed any more
    },

    PreventRecursion: false,
    SetSelectedPeriod: function (sClickedID)
    {
        for (var i = 0; i < ctrlSnooze.SnoozePeriods.length; i++)
        {
            var period = ctrlSnooze.SnoozePeriods[i];
            period.Selected = ('snooze-' + period.ID == sClickedID ? true : false);
        }
    },

    GetSelectedPeriod: function ()
    {
        for (var i = 0; i < ctrlSnooze.SnoozePeriods.length; i++)
        {
            var period = ctrlSnooze.SnoozePeriods[i];
            if (period.Selected)
                return period;
        }
    },

    OKButtonClick: function ()
    {
        var period = ctrlSnooze.GetSelectedPeriod();
        if (period)
        {
            var dtFollowUp = null;
            if(period.ID == 'pick')
            {
                dtFollowUp = TriSysSDK.CShowForm.getDateTimePickerValue(ctrlSnooze.SnoozeDateTimeID);
                if(!dtFollowUp)
                {
                    TriSysApex.UI.ShowMessage("Please choose a valid date/time.");
                    return false;
                }
            }

            ctrlSnooze.SendSnoozeToWebAPI(period, dtFollowUp);
            return true;
        }

        return false;
    },

    SendSnoozeToWebAPI: function (period, dtAlarm)
    {
        var CSnoozeRequest = {
            TaskId: TriSysApex.Alarms.Snooze.TaskIdArray,
            Minutes: period.Minutes,
            Weeks: period.Weeks,
            Months: period.Months,
            AlarmDateTime: dtAlarm
        };

        var payloadObject = {};

        payloadObject.URL = "Task/Snooze";
        payloadObject.OutboundDataPacket = CSnoozeRequest;

        payloadObject.InboundDataFunction = function (CSnoozeResponse)
        {
            TriSysApex.UI.HideWait();

            if (CSnoozeResponse)
            {
                if (CSnoozeResponse.Success)
                {
                    // Nothing to do as caller takes care of workflow, not us.
                    return;
                }
                else
                    TriSysApex.UI.ShowMessage(CSnoozeResponse.ErrorMessage);
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.ShowMessage('ctrlSnooze.SendSnoozeToWebAPI: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Snoozing...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    }
};

$(document).ready(function ()
{
    ctrlSnooze.Load();
});