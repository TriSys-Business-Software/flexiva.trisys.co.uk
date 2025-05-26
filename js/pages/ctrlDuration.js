var ctrlDuration =
{
    NumberID: 'ctrlDuration-Number',
    PeriodID: 'ctrlDuration-TimePeriod',

    // Called from TriSysSDK
    Load: function (sPrefix, options)
    {
        // Load the widgets
        var periods = [
                    { text: 'minutes', value: 'minutes' },
                    { text: 'hours', value: 'hours' },
                    { text: 'days', value: 'days' },
                    { text: 'weeks', value: 'weeks' },
                    { text: 'months', value: 'months' },
                    { text: 'years', value: 'years' }
        ];

        // 01 May 2024: Pick up default period from caller
        var iDefaultIndex = 0;      // Minutes
        if (options) {
            if (options.DefaultPeriod)
            {
                switch(options.DefaultPeriod.replace("s", ""))
                {
                    case 'hour': iDefaultIndex = 1; break;
                    case 'day': iDefaultIndex = 2; break;
                    case 'week': iDefaultIndex = 3; break;
                    case 'month': iDefaultIndex = 4; break;
                    case 'year': iDefaultIndex = 5; break;
                }
            }
        }

        // Callback when combo changes
        var fnChangePeriod = function (value, sText, sFieldID) {
            if (options) {
                if (options.OnChangeEventHandler) {
                    options.OnChangeEventHandler(sFieldID, ctrlDuration.GetValue(sPrefix));
                }
            }
        };

        TriSysSDK.CShowForm.populateComboFromDataSource(sPrefix + ctrlDuration.PeriodID, periods, iDefaultIndex, fnChangePeriod);

        // 01 May 2024: Pick up default value from caller
        var iDefault = 15;
        if (options)
        {
            if (options.DefaultDurationValue)
                iDefault = options.DefaultDurationValue;
        }

        var fieldDescription = { MinValue: 1, MaxValue: 1024, SpinIncrement: 1, DefaultValue: iDefault };
        var sFieldID = sPrefix + ctrlDuration.NumberID;
        TriSysSDK.Controls.NumericSpinner.Initialise(sFieldID, fieldDescription);
        TriSysSDK.Controls.NumericSpinner.DecimalPlaces(sFieldID, 0);

        // Make sure that caller can get an event when we change
        if (options) {
            if (options.OnChangeEventHandler) {
                var fnChangedNumber = function (sID, fValue) {
                    options.OnChangeEventHandler(sID, ctrlDuration.GetValue(sPrefix));
                }
                TriSysApex.FieldEvents.AddNumberChangeFieldOfInterest(sFieldID, fnChangedNumber);
            }
        }
    },

    // Of the form "X period" e.g. "5 minutes" or "2 hours"
    SetValue: function(sPrefix, sDuration)
    {
        if (!sDuration)
            return;

        var parts = sDuration.split(" ");
        var fAmount = parseInt(parts[0]);
        var sDuration = parts[1];

        TriSysSDK.Controls.NumericSpinner.SetValue(sPrefix + ctrlDuration.NumberID, fAmount);
        TriSysSDK.CShowForm.SetTextInCombo(sPrefix + ctrlDuration.PeriodID, sDuration);
    },

    // Return "X period" e.g. "5 minutes" or "2 hours"
    GetValue: function (sPrefix)
    {
        var fAmount = TriSysSDK.Controls.NumericSpinner.GetValue(sPrefix + ctrlDuration.NumberID);
        var sDuration = TriSysSDK.CShowForm.GetTextFromCombo(sPrefix + ctrlDuration.PeriodID);

        return fAmount + " " + sDuration;
    }

};  // ctrlDuration
