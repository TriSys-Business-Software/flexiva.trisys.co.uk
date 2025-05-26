var DiaryManager =
{
    DrawScheduler: function()
    {
        //TriSysSDK.Scheduler.Instantiate("diaryManagerScheduler", TriSysSDK.Scheduler.TasksTable());
        TriSysSDK.Scheduler.Instantiate("diaryManagerScheduler", null);

        // Populate on-demand with default view
        TriSysApex.UserOptions.ReadLoggedInUserSetting("Selected Diary Manager User List", DiaryManager.ReadLoggedInUserSettingCallback);

        setTimeout(TriSysProUI.kendoUI_Overrides, 1000);     // Allow time for the theme to propagate
    },

    _PreventMultipleHovers: false,
    _NotificationWidgets: [],
    _LastTaskId: 0,

    // Read persisted list of users whose diaries we wish to view
    ReadLoggedInUserSettingCallback: function (setting)
    {
        if (setting && setting.Value)
        {
            TriSysSDK.Scheduler.Options.SelectedUserList = JSON.parse(setting.Value);
        }

        TriSysSDK.Scheduler.StartPopulationAfterLoad();
    },

    // Called when user hovers above a diary entry which is potentially partially obscured
    PopupTaskHover: function(e)
    {
        if (DiaryManager._PreventMultipleHovers)
			return;

		if (!e)
			return;

        DiaryManager._PreventMultipleHovers = true;

		var target = $(e.currentTarget);
		if (!target)
			return;

        var uid = target.data("uid");
        var iTop = e.pageY;
        var iLeft = e.pageX;

        if (e.type === "mouseenter" && uid)
        {
            var sMessage = "mouserenter, uid: " + uid + ", iTop=" + iTop + ", iLeft=" + iLeft;

            var dataItem = null;
            var scheduler = TriSysSDK.Scheduler.GetSchedulerInstance();
            if (scheduler)
            {
				dataItem = scheduler.occurrenceByUid(uid);
				if (dataItem)
				{
					var sDate = "" + dataItem.start + "";

                    var sDrillDownButton = `<button type="submit" class="btn btn-sm btn-primary" 
                        onclick="DiaryManager.DrillDown(` + dataItem.taskid + `, '` + dataItem.TaskType + `')">
						<i class="fa fa-folder-open-o"></i> &nbsp; Open</button>`;

					sMessage = '<img src="images/trisys/16x16/tasktype/' + dataItem.TaskType + '.png" alt="' + dataItem.TaskType + '">' +
						' &nbsp; <b>' + dataItem.TaskType + '</b> &nbsp; ' + sDate.substring(0, 21) +
						'<br />' +
						'<p style="margin-top: 12px;">' +
						dataItem.title +
						'</p>' +
						'<p style="margin-top: 12px;">' +
						sDrillDownButton +
						'</p>' +
						"<br />";
				}
            }
            
            if (dataItem)
            {
                //TriSysApex.Toasters.Info(sMessage);

                var bShowWidget = (DiaryManager._LastTaskId != dataItem.taskid);
                if (bShowWidget)
                {
                    DiaryManager._LastTaskId = dataItem.taskid;

                    // Remove any existing popups
                    DiaryManager.HideAllPopups();

                    // Show new one
                    var notificationWidget = $("#configurableNotification").kendoNotification().data("kendoNotification");

                    var iWidth = 400;
                    iLeft = iLeft - (iWidth / 2);

                    notificationWidget.setOptions({
                        templates: [{
                            // define a template for the custom "taskPopup" notification type
                            type: "taskPopup",
                            template: '<div class="trisys-diary-event-template-css" style="margin: 5px; overflow: hidden;">#= taskMessage #</div>'
                            // template content can also be defined separately
                            //template: $("#myAlertTemplate").html()
                        }],
                        position: {
                            top: iTop,
                            left: iLeft
                        },
                        width: iWidth,
                        stacking: "down",
                        hideOnClick: true,
                        autoHideAfter: 3000     // 3 second hide = 3000
                    });

                    notificationWidget.show({ taskMessage: sMessage }, "taskPopup");

                    // Add to an array
                    DiaryManager._NotificationWidgets.push(notificationWidget);

                    console.log("Created: " + sMessage);
                }
            }
        }

        DiaryManager._PreventMultipleHovers = false;
    },

    HideAllPopups: function()
    {
        // Remove any existing popups
        $.each(DiaryManager._NotificationWidgets, function (index, widget)
        {
            try
            {
                var elements = widget.getNotifications();
                elements.each(function ()
                {
                    $(this).parent().remove();
                });

            } catch (e)
            {

            }

            try
            {
                widget.hide();

            } catch (e)
            {

            }
        });

        DiaryManager._NotificationWidgets = [];
    },

    DrillDown: function (lTaskId, sTaskType)
    {
        debugger;
        if (sTaskType == 'Post-It Note')
            TriSysApex.PostItNotes.OpenPostItNote(lTaskId);
        else
            TriSysSDK.Scheduler.EditTask(lTaskId);
	},

	// Options added 16 Feb 2018
	Options:
	{
		Popup: function ()		// DiaryManager.Options.Popup
		{
			// Load the .js BEFORE the user control .html
			var fnLoadControlHTML = function ()
			{
				var parametersObject = new TriSysApex.UI.ShowMessageParameters();
				parametersObject.Title = "Diary Manager Options";
				parametersObject.Image = "gi-cogwheel";
				parametersObject.Maximize = true;
				parametersObject.FullScreen = true;
				parametersObject.CloseTopRightButton = true;

				parametersObject.ContentURL = TriSysApex.CustomFormsAndComponents.UserControlPath("ctrlDiaryOptions.html");

				// Buttons
				parametersObject.ButtonLeftText = "Apply";
				parametersObject.ButtonLeftFunction = function ()
				{
					return ctrlDiaryOptions.Apply();
				};
				parametersObject.ButtonLeftVisible = true;

				parametersObject.ButtonRightVisible = true;
				parametersObject.ButtonRightText = "Cancel";

				// Fire our code as soon as open
				parametersObject.OnLoadCallback = ctrlDiaryOptions.Load;

				TriSysApex.UI.PopupMessage(parametersObject);
			};

			TriSysApex.WhiteLabelling.LoadJavascriptFile('js/pages/ctrlDiaryOptions.js', null, fnLoadControlHTML);	
		}
	}

};	// DiaryManager

// We are loaded dynamically
$(document).ready(function ()
{
    DiaryManager.DrawScheduler();
});