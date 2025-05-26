var ctrlAddPerformanceTarget =
{
    Field: function (sField)
    {
        return 'ctrlAddPerformanceTarget-' + sField;
    },

    Load: function ()
    {
        ctrlAddPerformanceTarget.LoadPeriodsFromWebAPI();        
    },

    LoadPeriodsFromWebAPI: function ()
    {
        var payloadObject = {};

        payloadObject.URL = "PerformanceTargets/Periods";

        payloadObject.InboundDataFunction = function (CPerformanceTargetPeriodsResponse)
        {
            TriSysApex.UI.HideWait();

            if (CPerformanceTargetPeriodsResponse)
            {
                if (CPerformanceTargetPeriodsResponse.Success)
                {
                    if (CPerformanceTargetPeriodsResponse.Periods)
                    {
                        var periodArray = [];
                        for (var i = 0; i < CPerformanceTargetPeriodsResponse.Periods.length; i++)
                        {
                            var period = CPerformanceTargetPeriodsResponse.Periods[i];
                            var periodArrayItem = { value: JSON.stringify(period), text: period.PeriodName };
                            periodArray.push(periodArrayItem);
                        }

                        // If a clone, reset value and date fields
                        TriSysSDK.CShowForm.populateComboFromDataSource(ctrlAddPerformanceTarget.Field('period'), periodArray, 0);
                    }
                }
                else
                    TriSysApex.UI.ShowError(CPerformanceTargetPeriodsResponse.ErrorMessage);    // Catastrophic error
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('ctrlAddPerformanceTarget.LoadRecordFromWebAPI: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Reading Periods...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },
    
    SaveButtonClick: function (fnOnSave)
    {
        // Validation
        var sTargetName = $('#' + ctrlAddPerformanceTarget.Field('target')).val();
        var sTargetPeriodJSON = TriSysSDK.CShowForm.GetValueFromCombo(ctrlAddPerformanceTarget.Field('period'));
        var sDescription = $('#' + ctrlAddPerformanceTarget.Field('description')).val();
        var bLocked = TriSysSDK.CShowForm.GetCheckBoxValue(ctrlAddPerformanceTarget.Field('locked'));

        var sValidationError = null;
        if (!sTargetName)
            sValidationError = "Enter a name for the target metric";
        else if (!sDescription)
            sValidationError = "Describe what the target metric is";

        if (sValidationError)
        {
            TriSysApex.UI.ShowMessage(sValidationError);
            return;
        }

        // Compile the data for Web API
        var period = JSON.parse(sTargetPeriodJSON);
        var CPerformanceTargetAddMetricRequest = {
            PerformanceTargetPeriodId: period.PerformanceTargetPeriodId,
            TargetName: sTargetName,
            Description: sDescription,
            Locked: bLocked
        };

        // Submit to server
        ctrlAddPerformanceTarget.SubmitSaveToWebAPI(CPerformanceTargetAddMetricRequest, fnOnSave);
    },

    SubmitSaveToWebAPI: function (CPerformanceTargetAddMetricRequest, fnOnSave)
    {
        var payloadObject = {};

        payloadObject.URL = "PerformanceTargets/AddTargetMetric";

        payloadObject.OutboundDataPacket = CPerformanceTargetAddMetricRequest;

        payloadObject.InboundDataFunction = function (CPerformanceTargetAddMetricResponse)
        {
            TriSysApex.UI.HideWait();

            if (CPerformanceTargetAddMetricResponse)
            {
                if (CPerformanceTargetAddMetricResponse.Success)
                {
                    // Callback
                    if (fnOnSave)
                        fnOnSave(CPerformanceTargetAddMetricRequest.TargetName, CPerformanceTargetAddMetricRequest.PerformanceTargetPeriodId);
                }
                else
                    TriSysApex.UI.ShowError(CPerformanceTargetAddMetricResponse.ErrorMessage);    // Validation error
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('ctrlAddPerformanceTarget.SubmitSaveToWebAPI: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Saving Target Metric...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    }
};