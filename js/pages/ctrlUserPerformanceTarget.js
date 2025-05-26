var ctrlUserPerformanceTarget =
{
    Field: function(sField)
    {
        return 'ctrlUserPerformanceTarget-' + sField;
    },

    Load: function (targetDialogueData)
    {
        var fieldDescription = { MinValue: 0, SpinIncrement: 1 };
        TriSysSDK.Controls.NumericSpinner.Initialise(ctrlUserPerformanceTarget.Field('value'), fieldDescription);

        TriSysSDK.CShowForm.datePicker(ctrlUserPerformanceTarget.Field('start'));
        TriSysSDK.CShowForm.datePicker(ctrlUserPerformanceTarget.Field('end'));

        var target = {
            TargetMetricByPeriod: targetDialogueData.TargetAndPeriod,
            UserName: targetDialogueData.UserName,
            Value: 0
        };
        ctrlUserPerformanceTarget.Display(target);

        if (targetDialogueData.PerformanceTargetUserId > 0)
            ctrlUserPerformanceTarget.LoadRecordFromWebAPI(targetDialogueData);
    },

    LoadRecordFromWebAPI: function (targetDialogueData)
    {
        var CPerformanceTargetForUserRequest = {
            PerformanceTargetUserId: targetDialogueData.PerformanceTargetUserId
        };

        var payloadObject = {};

        payloadObject.URL = "PerformanceTargets/ReadUserTarget";

        payloadObject.OutboundDataPacket = CPerformanceTargetForUserRequest;

        payloadObject.InboundDataFunction = function (CPerformanceTargetForUserResponse)
        {
            TriSysApex.UI.HideWait();

            if (CPerformanceTargetForUserResponse)
            {
                if (CPerformanceTargetForUserResponse.Success)
                {
                    if (targetDialogueData.Clone)
                    {
                        // If a clone, reset value and date fields
                        CPerformanceTargetForUserResponse.Target.Value = 0;
                        CPerformanceTargetForUserResponse.Target.StartDate = null;
                        CPerformanceTargetForUserResponse.Target.EndDate = null;
                    }

                    ctrlUserPerformanceTarget.Display(CPerformanceTargetForUserResponse.Target);
                }
                else
                    TriSysApex.UI.ShowError(CPerformanceTargetForUserResponse.ErrorMessage);    // Catastrophic error
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('ctrlUserPerformanceTarget.LoadRecordFromWebAPI: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Reading Target...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    Display: function(target)
    {
        $('#' + ctrlUserPerformanceTarget.Field('target')).html(target.TargetMetricByPeriod);
        $('#' + ctrlUserPerformanceTarget.Field('user')).html(target.UserName);
        TriSysSDK.Controls.NumericSpinner.SetValue(ctrlUserPerformanceTarget.Field('value'), target.Value);

        if (target.StartDate)
            TriSysSDK.CShowForm.setDatePickerValue(ctrlUserPerformanceTarget.Field('start'), target.StartDate);

        if (target.EndDate)
            TriSysSDK.CShowForm.setDatePickerValue(ctrlUserPerformanceTarget.Field('end'), target.EndDate);
    },

    SaveButtonClick: function (targetDialogueData, fnOnSave)
    {
        // Validation
        targetDialogueData.Value = TriSysSDK.Controls.NumericSpinner.GetValue(ctrlUserPerformanceTarget.Field('value'));
        targetDialogueData.StartDate = TriSysSDK.CShowForm.getDatePickerValue(ctrlUserPerformanceTarget.Field('start'));
        targetDialogueData.EndDate = TriSysSDK.CShowForm.getDatePickerValue(ctrlUserPerformanceTarget.Field('end'));

        var sValidationError = null;
        if (!targetDialogueData.StartDate && !targetDialogueData.EndDate)
            sValidationError = "Start date or end date must be set";
        else if (targetDialogueData.StartDate > targetDialogueData.EndDate)
            sValidationError = "Start date after end date";
        else if(targetDialogueData.Value <= 0)
            sValidationError = "Zero value";

        if (sValidationError)
        {
            TriSysApex.UI.ShowMessage(sValidationError);
            return;
        }

        // Submit to server
        ctrlUserPerformanceTarget.SubmitSaveToWebAPI(targetDialogueData, fnOnSave);
    },

    SubmitSaveToWebAPI: function (targetDialogueData, fnOnSave)
    {
        var CPerformanceTargetForUserUpdateRequest = targetDialogueData;

        var payloadObject = {};

        payloadObject.URL = "PerformanceTargets/WriteUserTarget";

        payloadObject.OutboundDataPacket = CPerformanceTargetForUserUpdateRequest;

        payloadObject.InboundDataFunction = function (CPerformanceTargetForUserUpdateResponse)
        {
            TriSysApex.UI.HideWait();

            if (CPerformanceTargetForUserUpdateResponse)
            {
                if (CPerformanceTargetForUserUpdateResponse.Success)
                {
                    // Callback
                    if (fnOnSave)
                        fnOnSave();
                }
                else
                    TriSysApex.UI.ShowError(CPerformanceTargetForUserUpdateResponse.ErrorMessage);    // Validation error
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('ctrlUserPerformanceTarget.SubmitSaveToWebAPI: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Saving Target...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    }
};