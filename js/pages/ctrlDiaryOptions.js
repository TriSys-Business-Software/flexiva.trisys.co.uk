var ctrlDiaryOptions =
{
	// Private constants
	UserGridID: 'ctrlDiaryOptions-UserGrid',

	// See DiaryManager.Options.Popup()
    Load: function()
	{
		TriSysSDK.FormMenus.DrawGridMenu('ctrlDiaryOptions-User-GridMenu', ctrlDiaryOptions.UserGridID);
		ctrlDiaryOptions.PopulateUserGrid();
		setTimeout(TriSysProUI.kendoUI_Overrides, 500);

		TriSysSDK.CShowForm.HTMLFieldsCodeInjection();

		TriSysApex.UserOptions.ReadLoggedInUserSetting("TaskList.ShowClearedTasks", ctrlDiaryOptions.ReadShowClearedTasksSettingCallback);
		TriSysApex.UserOptions.ReadLoggedInUserSetting("DiaryManager_AgendaMaximumDays", ctrlDiaryOptions.ReadAgendaMaximumDaysSettingCallback);
    },

	PopulateUserGrid: function ()
	{
		// Jan 2018: Use a dedicated API method which abstracts the underlying SQL and does not use 'SQLDatabase/SQL_Select'
		var fnPopulationByFunction = {
			API: "Users/List",							// The Web API Controller/Function

			// The additional parameters passed into the function not including the paging metrics
			Parameters: function (request)
			{
				request.DiaryManagerUsers = true;		// We can see only non-locked users
			},

			DataTableFunction: function (response)		// Called to get a suitable data table for the grid to display
			{
				// Fire off a job to highlight the users which are selected
				setTimeout(ctrlDiaryOptions.SelectUsersInGrid, 100);

				return response.List;					// The list of records from the Web API
			}
		};

		ctrlDiaryOptions.PopulateUserGridFromFunction(fnPopulationByFunction);
	},

	PopulateUserGridFromFunction: function (fnPopulationByFunction)
	{
		var sGridName = ctrlDiaryOptions.UserGridID + '-GridInstance';

		TriSysSDK.Grid.VirtualMode({
			Div: ctrlDiaryOptions.UserGridID,
			ID: sGridName,
			Title: "Users",
			RecordsPerPage: 16,     //TriSysApex.UserOptions.RecordsPerPage(),
			PopulationByFunction: fnPopulationByFunction,
			Columns: [
				{ field: "UserId", title: "Id", type: "number", width: 70, hidden: true },
				{ field: "Name", title: "Name", type: "string" },
				{ field: "EMail", title: "E-Mail", type: "string" },
				{ field: "TelNo", title: "Tel. No.", type: "string", hidden: true },
				{ field: "LoggedIn", title: "Logged In", type: "string", hidden: true },
				{ field: "Locked", title: "Locked", type: "string", hidden: true }],

			KeyColumnName: "UserId",
			MultiRowSelect: true,
			Grouping: false,
			ColumnFilters: true
		});
	},

	// Loop through grid rows to tick users which match our list
	SelectUsersInGrid: function ()
	{
		var bAddCurrentUser = false;
		if (!TriSysSDK.Scheduler.Options.SelectedUserList)
			bAddCurrentUser = true;
		else
			bAddCurrentUser = (TriSysSDK.Scheduler.Options.SelectedUserList.length == 0);

		if (bAddCurrentUser)
		{
			// Add the current user to the list
			var userCredentials = TriSysApex.LoginCredentials.UserCredentials();
			if (userCredentials)
			{
				var lUserId = userCredentials.LoggedInUser.UserId;
				TriSysSDK.Scheduler.Options.SelectedUserList = [lUserId];
			}
		}

		// This code should be put into SDK when working!
		var sJQueryGridDiv = '#' + ctrlDiaryOptions.UserGridID;

		var grid = $(sJQueryGridDiv).data("kendoGrid");
		if (grid && grid.dataSource)
		{
			var view = grid.dataSource.view();

			for (var i = 0; i < view.length; i++)
			{
				var selectedRow = view[i];

				var lUserId = selectedRow.UserId;
				var bCheckRow = (TriSysSDK.Scheduler.Options.SelectedUserList.indexOf(lUserId) >= 0);

				if (bCheckRow)
				{
				    // 27 Jan 2021
				    var row = grid.table.find("[data-uid=" + view[i].uid + "]");
                    if(row)
				        grid.select(row);
				}
			}
		}
	},

	// User wishes to save settings
	Apply: function ()
	{
	    // Options
	    var bShowClearedTasks = TriSysSDK.CShowForm.CheckBoxValue('ctrlDiaryOptions-show-cleared-tasks', false);
	    var iAgendaMaxDays = parseInt(TriSysSDK.CShowForm.GetValueFromCombo('ctrlDiaryOptions-agenda-days'));

	    TriSysApex.UserOptions.WriteSetting(0, { Name: "TaskList.ShowClearedTasks", FType: "B" }, bShowClearedTasks ? 'True' : 'False');
	    TriSysApex.UserOptions.WriteSetting(0, { Name: "DiaryManager_AgendaMaximumDays" }, iAgendaMaxDays);
	    TriSysSDK.Scheduler.AgendaViewDayCount = iAgendaMaxDays;

        // Users

		TriSysSDK.Scheduler.Options.SelectedUserList = null;

		// Read list of users
		var lstUserId = TriSysSDK.Grid.GetSelectedMultipleRowsFromGrid(ctrlDiaryOptions.UserGridID, "UserId");
		if (lstUserId)
		    TriSysSDK.Scheduler.Options.SelectedUserList = lstUserId;

	    // Store in the database via Web API
		TriSysApex.UserOptions.WriteSetting(0, { Name: "Selected Diary Manager User List" }, JSON.stringify(TriSysSDK.Scheduler.Options.SelectedUserList));

		// Re-populate the diary now using all of these users
		var bDiaryOpen = TriSysApex.FormsManager.isFormOpen("DiaryManager");
		if (bDiaryOpen)
		    TriSysSDK.Scheduler.RefreshFromServer();

		// Return true to force popup to close
		return true;
	},

	PopulateAgendaMaxDayRangeCombo: function()
	{
	    var array = [
            { text: '7 Days', value: 7 },
            { text: '10 Days', value: 10 },
            { text: '14 Days', value: 14 },
            { text: '21 Days', value: 21 },
            { text: '28 Days', value: 28 },
            { text: '31 Days', value: 31 },
            { text: '90 Days', value: 90 }
	    ];
	    return array;
	},

	ReadShowClearedTasksSettingCallback: function(setting)
	{
	    if (setting && setting.Value) 
	    {
	        TriSysSDK.CShowForm.SetCheckBoxValue('ctrlDiaryOptions-show-cleared-tasks', setting.Value == 'True' ? true : false);
	    }
	},

	ReadAgendaMaximumDaysSettingCallback: function (setting)
	{
	    if (setting && setting.Value)
	    {
	        var iDays = parseInt(setting.Value);
	        TriSysSDK.CShowForm.SetValueInCombo('ctrlDiaryOptions-agenda-days', iDays);
	        TriSysSDK.Scheduler.AgendaViewDayCount = iDays;     // Will have effect next change of agenda view
	    }
	}

};
