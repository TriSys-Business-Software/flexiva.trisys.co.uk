var ctrlConsultantsAndDateRange =
{
    Load: function (sParentID, parameters, fnCallback)
    {
        // We will probably be on a dashboard tile, but will need to rename our internal ID's to be unique
        var sRoot = 'ctrlConsultantsAndDateRange-Root';

        TriSysSDK.Controls.General.RenameElementIdsWithParentIdPrefixOrSuffix(sRoot, sParentID, true);

        var sPrefix = sParentID + '-';

        $('#' + sRoot).attr("id", sPrefix + sRoot);
        sRoot = sPrefix + sRoot;

        var bPhone = TriSysApex.Device.isPhone();
        if (bPhone)
            ctrlConsultantsAndDateRange.PhoneTweaks(sPrefix);

        var sUserListID = sPrefix + 'user-list';
        var sDateRangeID = sPrefix + 'date-period-drop-down';

        var sBlockID = sPrefix + 'consultant-block';
        var sConsultantLabelID = sPrefix + 'consultant-label';

        // Manual fiddles with width
        var lBlockWidth = $('#' + sBlockID).width();
        var lLabelWidth = $('#' + sConsultantLabelID).width();
        var lLabelLeft = $('#' + sConsultantLabelID).position().left;
        var lListLeft = $('#' + sUserListID).position().left;
        var lUserListWidth = lBlockWidth - lListLeft - 10;
        $('#' + sUserListID).width(lUserListWidth);

        // Users Multi-Select
        var fnChangeUsers = function ()
        {
            ctrlConsultantsAndDateRange.CallbackOrchestrator(sUserListID, sDateRangeID, fnCallback);
        };
        TriSysSDK.CShowForm.MultiUserCombo(sUserListID, fnChangeUsers);

        // Parameters
        var dtStart = null, dtEnd = null;
        if (parameters)
        {
            TriSysSDK.CShowForm.SetValuesArrayInList(sUserListID, parameters.UserNames);
            dtStart = parameters.StartDate;
            dtEnd = parameters.EndDate;
        }
        else
        {
            var userCredentials = TriSysApex.LoginCredentials.UserCredentials();
            var sUserName = userCredentials.LoggedInUser.ForenameAndSurname;

            TriSysSDK.CShowForm.SetSkillsInList(sUserListID, sUserName);
        }

        // Date Range
        var fnEvent = function (dtStart, dtEnd)
        {
            ctrlConsultantsAndDateRange.CallbackOrchestrator(sUserListID, sDateRangeID, fnCallback);
        };

        TriSysSDK.DatePeriodDropDown.Load(sPrefix + 'date-period-drop-down', dtStart, dtEnd, fnEvent);
    },

    // The callback function expects the list of users + start date + end date
    CallbackOrchestrator: function (sUserListID, sDateRangeID, fnCallback)
    {
        var userNameArray = TriSysSDK.CShowForm.GetSelectedSkillsFromListAsArray(sUserListID);
        var dtStart = TriSysSDK.DatePeriodDropDown.GetStartDate(sDateRangeID);
        var dtEnd = TriSysSDK.DatePeriodDropDown.GetEndDate(sDateRangeID);

        fnCallback(userNameArray, dtStart, dtEnd);
    },

    // External method of asking for same data to save caller having to store this
    RequestParameters: function (sParentID, fnCallback)
    {
        var sPrefix = sParentID + '-';
        var sUserListID = sPrefix + 'user-list';
        var sDateRangeID = sPrefix + 'date-period-drop-down';

        ctrlConsultantsAndDateRange.CallbackOrchestrator(sUserListID, sDateRangeID, fnCallback);
    },

    PhoneTweaks: function (sPrefix)
    {
        $('#' + sPrefix + 'consultant-block').removeClass().addClass('col-sm-12');
        $('#' + sPrefix + 'date-range-block').removeClass().addClass('col-sm-12');
        $('#' + sPrefix + 'date-range-label').css('margin-left', '0px');
        $('#' + sPrefix + 'date-range-block-separator').show();
    }
};