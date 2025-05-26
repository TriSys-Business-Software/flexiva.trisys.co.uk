var ctrlPlacementLeaderboard =
{
    // This is called when the tile manager has loaded us.
    LoadedInTile: function (sTileID, persistedSettings)
    {
        // Called when this control has been loaded into a live tile.

        // Note that all our DOM elements have been renamed to be unique and prefixed
        var sPrefix = sTileID + '-';

        // Load data now
        try
        {
            ctrlPlacementLeaderboard.Load(sPrefix, persistedSettings);

        } catch (e)
        {

        }
    },

    Load: function (sPrefix, persistedSettings)
    {
        var sDiv = sPrefix + "placement-leaderboard-ejs";

        var bPermanent = ctrlDashboard.Persistence.GetSettingValue(persistedSettings, 'Permanent', false);
		var bAllTime = ctrlDashboard.Persistence.GetSettingValue(persistedSettings, 'AllTime', false);

        // Dummy data option for demos
        //if (TriSysApex.Constants.ShowDummyDashboardData)
        //{
        //    var dt = ctrlPlacementLeaderboard.DummyDataTable();
        //    ctrlPlacementLeaderboard.DisplayDataInTable(dt, bContractTemp, sDiv);
        //    return;
        //}

		var fnPopulationByFunction = {
            API: "DashboardMetric/PlacementLeaderboard",   // The Web API Controller/Function

            Parameters: function (request)
            {
                request.Permanent = bPermanent;
				request.AllTime = bAllTime;
            },

            DataTableFunction: function (response)      // Called to get a suitable data table for the grid to display
            {
                return response.List;                   // The list of records from the Web API
            }
        };

        // The callback to display the data
        var fnProcessDataTable = function (dt)
        {
            if (dt)
            {
                ctrlPlacementLeaderboard.DisplayDataInTable(dt, !bPermanent, sDiv);
            }
        };

       TriSysSDK.Database.GetDataSetFromFunction(fnPopulationByFunction, fnProcessDataTable);
    },

    DisplayDataInTable: function (dt, bContractTemp, sDiv)
    {
        var iTop = 10;

        if (dt)
        {
            // Display data
            var leaderboardArray = {
                LeaderboardData: []
            };

            for (var i = 0; i < dt.length; i++)
            {
                if (i >= iTop)
                    break;

                var dr = dt[i];
                var fAmountInPounds = dr["AmountInPounds"];
                var iUserId = dr["UserId"];
                var sUserName = dr["UserName"];

                // Format currency
                var sFormattedCurrency = TriSysSDK.Controls.CurrencyAmount.DefaultCurrencySymbol() + TriSysSDK.Numbers.Format(fAmountInPounds, 0);

                // Get API photo of user
                var sUserPhoto = TriSysApex.Cache.UsersManager.Photo(iUserId);

                var leader = {
                    Position: (i + 1),
                    AmountWithCurrency: sFormattedCurrency,
                    UserName: sUserName,
                    UserPhoto: sUserPhoto
                };

                leaderboardArray.LeaderboardData.push(leader);
            }

            // Populate the EJS now
            try
            {
                var sTemplate = TriSysApex.Constants.UserControlFolder + 'dashboard/templates/placement-leaderboard.ejs' + TriSysApex.FormsManager.pageURLTimestampArgumentsToForceNoCache();
                var result = new EJS({ url: sTemplate }).render(leaderboardArray);

                // Replace words as appropriate
                if (bContractTemp)
                {
                    result = result.replace(/PERMANENT/g, 'CONTRACT');
                }

                // Insert into DOM
                document.getElementById(sDiv).innerHTML = result;

            } catch (e)
            {
                var sError = e;
            }
        }
    },

    // Called when dynamic menu instructs us to change the view
    ConfigureMenuButtonClick: function (sID, sTileID)
    {
        var sPrefix = sTileID + '-';

		// Remove mutually exclusive settings to retain only one
        var persistedSettingPermanent = { Setting: 'Permanent', Value: false };
		ctrlDashboard.Persistence.SaveTileSetting(sTileID, persistedSettingPermanent);

		var persistedSetting = null;

        var Permanent = 'Permanent';
        if (sID.indexOf(Permanent) == 0)
            persistedSetting = { Setting: 'Permanent', Value: true };

        var ContractTemp = 'ContractTemp';
        if (sID.indexOf(ContractTemp) == 0)
            persistedSetting = { Setting: 'Permanent', Value: false };

        var AllTime = 'AllTime';
        if (sID.indexOf(AllTime) == 0)
            persistedSetting = { Setting: 'AllTime', Value: true };

		if(persistedSetting)
		{
			// Persist this setting in framework so that we get loaded next time with the all correct settings
			ctrlDashboard.Persistence.SaveTileSetting(sTileID, persistedSetting);

			// We can only test this last setting!
			ctrlPlacementLeaderboard.Load(sPrefix, [persistedSetting]);
		}
    },

    // Only used for salesman demos
    DummyDataTable: function()
    {
        var dt = [];

        // Create a value for each user with a photo
        $.each(TriSysApex.Cache.Users(), function (index, user)
        {
            if (user.Photo)
            {
                var fAmount = TriSysSDK.Miscellaneous.RandomNumber(1000, 25000);
                var dr = { UserId: user.UserId, UserName: user.FullName, AmountInPounds: fAmount };
                dt.push(dr);
            }
        });

        // Sort it by DESCENDING amount
        dt.sort(function (a, b)
        {
            return (b.AmountInPounds - a.AmountInPounds);
        });

        return dt;
    }

}
