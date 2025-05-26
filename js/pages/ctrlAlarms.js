var ctrlAlarms =
{
    GridID: 'ctrlAlarms-TaskGrid',
    SpinnerID: 'ctrlAlarms-wait-spinner',

    Load: function()
    {
        // 17 Jun 2024
        TriSysSDK.WaitSpinner.Load(ctrlAlarms.SpinnerID, 200);
        
        // 14 Jun 2024: No server-side task alarm cache any more
        // 15 Jun 2024: No Garry!
        //TriSysApex.Alarms.ModalPopupTaskAlarmsOptions = { AllOutstandingAlarmedTasks: true };

        // 09 May 2024: Allow user to see all outstanding tasks instead of just alarms
        if (TriSysApex.Alarms.ModalPopupTaskAlarmsOptions && TriSysApex.Alarms.ModalPopupTaskAlarmsOptions.AllOutstandingAlarmedTasks)
        {
            ctrlAlarms.DisplayAllAlarmedTasks(TriSysApex.Alarms.ModalPopupTaskAlarmsOptions.SecondsBeforeAlarmDateTime);
        }
        else
        {
            // Display a list of all alarmed tasks
            ctrlAlarms.ReadDisplayAlarmedTasks(false, TriSysApex.Alarms.ModalPopupTaskAlarmsOptions.SecondsBeforeAlarmDateTime);

            // 15 Jun 2024: Task alarm cache was deprecated so these are no longer needed
            //ctrlAlarms.PopulateTaskGrid(ctrlAlarms.GridID, TriSysApex.Alarms.ModalPopupTaskAlarms ? TriSysApex.Alarms.TaskAlarms : TriSysApex.Alarms.PostItNotes);
            //ctrlAlarms.ShowTitleCount();
        }

        // Assign grid menu
        TriSysSDK.FormMenus.DrawGridMenu('ctrlAlarms-TaskGridMenu', ctrlAlarms.GridID);
        setTimeout(TriSysProUI.kendoUI_Overrides, 500);
    },

    ShowTitleCount: function()
    {
        var sTitle = null;
        if (TriSysApex.Alarms.ModalPopupTaskAlarms)
            sTitle = TriSysSDK.Numbers.ThousandsSeparator(TriSysApex.Alarms.TaskAlarms.length) + " Task Alarms";
        else
            sTitle = TriSysSDK.Numbers.ThousandsSeparator(TriSysApex.Alarms.PostItNotes.length) + " Post-It Notes";

        $('#ctrlAlarms-Title').html(sTitle);
    },

    PopulateTaskGrid: function (sDivTag, tasks)
    {
        var bMobile = TriSysApex.Device.isPhone();

        var sGridName = sDivTag + "-grid";

        var iRecordsPerPage = (bMobile ? 10 : TriSysApex.UserOptions.RecordsPerPage());

        var columns = TriSysApex.Activities.TaskSummaryGridColumns;
        var bMobile = TriSysApex.Device.isPhone();
        if (bMobile)
        {
            columns = [
                { field: "DisplayDescription", title: "Description", type: "string" },
                { field: "StartDate", type: "date", hidden: true }
            ];
        }

        // 22 Jan 2021: Hide the column menu for the task type image
        var fnHideTaskTypeImageColumnMenu = function (gridLayout) {
            //Reference the Kendo Grid  
            var grid = $("#" + gridLayout.Div).data("kendoGrid");

            //Remove the image column menu
            grid.thead.find("[data-field=Image]>.k-header-column-menu").remove();
        };

        // 17 Jun 2024
        $('#' + ctrlAlarms.SpinnerID).hide();

        TriSysSDK.Grid.VirtualMode({
            Div: sDivTag,
            ID: sGridName,
            Title: "Tasks",
            RecordsPerPage: iRecordsPerPage,
            PopulationByObject: tasks,
            Columns: columns,
            MobileVisibleColumns: columns,
            MobileRowTemplate: '<td >' +
                                '   <img src="images/trisys/16x16/tasktype/#=TaskType#.png" style="width: 24px; height: 24px;" alt="#=TaskType#"> &nbsp;' +
                                '   <strong>#: TaskType #</strong> &nbsp; #: kendo.format("{0:dd MMM yyyy}", StartDate) # <br />' +
                                        '#: DisplayDescription #' + '<hr style="padding: 0px; margin: 10px;" />' +
                                '</td>',
            KeyColumnName: "TaskId",
            DrillDownFunction: function (rowData)
            {
                var lTaskId = rowData.TaskId;
                if(lTaskId > 0)
                    ctrlAlarms.DrillDownIntoTask(lTaskId);
            },
            MultiRowSelect: (!bMobile),
            Grouping: false,
            ColumnFilters: false,
            AfterLoadEvent: fnHideTaskTypeImageColumnMenu
        });

        if (bMobile)
            $('#ctrlAlarms-Toolbar-Buttons').hide();
    },

    DrillDownIntoTask: function(lTaskId)
    {
        TriSysApex.UI.CloseModalPopup();
        TriSysApex.ModalDialogue.Task.QuickShow(lTaskId);
    },

    OpenSelectedTask: function()
    {
        lTaskId = TriSysApex.ModalDialogue.Task.GetSelectedSingletonTaskIdFromTaskGrid(ctrlAlarms.GridID);
        if(lTaskId > 0)
            ctrlAlarms.DrillDownIntoTask(lTaskId);
    },

    ClearSelectedAlarm: function ()
    {
        ctrlAlarms.ClearSelectedTasks(true);
    },

    ClearSelectedTask: function ()
    {
        ctrlAlarms.ClearSelectedTasks(false);
    },

    ClearSelectedTasks: function (bAlarmOnly)
    {
        var taskIds = TriSysSDK.Grid.GetSelectedMultipleRowsFromGrid(ctrlAlarms.GridID, "TaskId");
        if (!taskIds || taskIds.length == 0)
        {
            TriSysApex.UI.ShowMessage("Please select one or more tasks.");
            return;
        }

        var sMessage = "Please confirm that you wish to clear " + taskIds.length + " " +
                            (TriSysApex.Alarms.ModalPopupTaskAlarms ? "task" : "post-it note") + (bAlarmOnly ? " alarms" : "s") + "?";
        var fnYes = function ()
        {
            if (bAlarmOnly)
                ctrlAlarms.ClearMultipleTaskAlarms(taskIds);
            else
                ctrlAlarms.ClearMultipleTasks(taskIds);

            return true;
        };

        var sTitle = "Clear " + (TriSysApex.Alarms.ModalPopupTaskAlarms ? "Task" : "Post-It Note") + (bAlarmOnly ? " Alarms" : "s");
        TriSysApex.UI.questionYesNo(sMessage, sTitle, "Yes", fnYes, "No");
    },

    ClearMultipleTaskAlarms: function (taskIds)
    {
        var CClearTaskAlarmRequest = { Tasks: taskIds };

        var payloadObject = {};

        payloadObject.URL = "Task/ClearAlarm";
        payloadObject.OutboundDataPacket = CClearTaskAlarmRequest;

        payloadObject.InboundDataFunction = function (CClearTaskAlarmResponse)
        {
            TriSysApex.UI.HideWait();

            if (CClearTaskAlarmResponse)
            {
                if (CClearTaskAlarmResponse.Success)
                {
                    // Remove these records from the current grid
                    ctrlAlarms.PostTaskOperation(taskIds);
                    return;
                }
                else
                    TriSysApex.UI.ShowMessage(CClearTaskAlarmResponse.ErrorMessage);
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.ShowMessage('ctrlAlarms.ClearMultipleTaskAlarms: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Clearing alarms...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    ClearMultipleTasks: function (taskIds)
    {
        var CTaskClearMultipleRequest = { Tasks: taskIds };

        var payloadObject = {};

        payloadObject.URL = "Task/Clear";
        payloadObject.OutboundDataPacket = CTaskClearMultipleRequest;

        payloadObject.InboundDataFunction = function (CTaskClearMultipleResponse)
        {
            TriSysApex.UI.HideWait();

            if (CTaskClearMultipleResponse)
            {
                if (CTaskClearMultipleResponse.Success)
                {
                    // Remove these records from the current grid
                    ctrlAlarms.PostTaskOperation(taskIds);

                    return;
                }
                else
                    TriSysApex.UI.ShowMessage(CTaskClearMultipleResponse.ErrorMessage);
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.ShowMessage('ctrlAlarms.ClearMultipleTasks: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Clearing tasks...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    SnoozeSelectedTasks: function()
    {
        var taskIds = TriSysSDK.Grid.GetSelectedMultipleRowsFromGrid(ctrlAlarms.GridID, "TaskId");
        if (!taskIds || taskIds.length == 0)
        {
            TriSysApex.UI.ShowMessage("Please select one or more tasks.");
            return;
        }

        var fnCallback = function ()
        {
            // Remove these records from the current grid
            ctrlAlarms.PostTaskOperation(taskIds);
        };

        TriSysApex.Alarms.Snooze.Popup(taskIds, true, fnCallback);
    },

    PostTaskOperation: function (taskIds)
    {
        // Remove these records from the current grid
        for (var i = TriSysApex.Alarms.TaskAlarms.length - 1; i >= 0; i--)
        {
            var task = TriSysApex.Alarms.TaskAlarms[i];
            if (taskIds.indexOf(task.TaskId) >= 0)
                TriSysApex.Alarms.TaskAlarms.splice(i, 1);
        }
        ctrlAlarms.PopulateTaskGrid(ctrlAlarms.GridID, TriSysApex.Alarms.TaskAlarms);
        ctrlAlarms.ShowTitleCount();

        // Do a refresh of task alarms only to allow numbers to reflect snoozing
        TriSysApex.Alarms.DisplayTaskAlarmMetric(TriSysApex.Alarms.TaskAlarms.length);

        // 01 May 2024: If no tasks displayed, then auto-close this popup
        if(TriSysApex.Alarms.TaskAlarms.length == 0)
            TriSysApex.UI.CloseModalPopup();
    },

    // 09 May 2024: New toolbar button
    DisplayAllAlarmedTasks: function (iSecondsBeforeAlarmDateTime)     // ctrlAlarms.DisplayAllAlarmedTasks
    {
        ctrlAlarms.ReadDisplayAlarmedTasks(true, iSecondsBeforeAlarmDateTime);
    },

    // 15 Jun 2024: After task alarm cache was deprecated
    ReadDisplayAlarmedTasks: function (bAllOutstandingAlarmedTasks, iSecondsBeforeAlarmDateTime)     // ctrlAlarms.ReadDisplayAlarmedTasks
    {
        TriSysApex.Alarms.Check(false, null,
            {
                CustomParameterCallback: function (CTaskAlarmsRequest)
                {
                    CTaskAlarmsRequest.AllOutstandingAlarmedTasks = bAllOutstandingAlarmedTasks;
                    CTaskAlarmsRequest.SecondsBeforeAlarmDateTime = iSecondsBeforeAlarmDateTime;
                },
                CustomCallback: function (CTaskAlarmsResponse)
                {
                    if (CTaskAlarmsResponse.Success)
                    {
                        // Record these for quick access in the original location
                        TriSysApex.Alarms.TaskAlarms = CTaskAlarmsResponse.TaskAlarms;

                        if (!bAllOutstandingAlarmedTasks)
                        {
                            // 15 Jun 2024: Display the number of alarmed tasks in both red counter bubbles
                            TriSysApex.Alarms.DisplayTaskAlarmMetric(TriSysApex.Alarms.TaskAlarms.length);
                        }

                        // Show grid title
                        var sTitle = TriSysSDK.Numbers.ThousandsSeparator(TriSysApex.Alarms.TaskAlarms.length) +
                                (bAllOutstandingAlarmedTasks ? " Outstanding Alarmed Tasks" : " Task Alarms");
                        $('#ctrlAlarms-Title').html(sTitle);

                        // Display this private list of all alarmed tasks
                        ctrlAlarms.PopulateTaskGrid(ctrlAlarms.GridID, TriSysApex.Alarms.TaskAlarms);

                        return;
                    }
                }
            });
    }

};  // ctrlAlarms

$(document).ready(function ()
{
    ctrlAlarms.Load();
});
