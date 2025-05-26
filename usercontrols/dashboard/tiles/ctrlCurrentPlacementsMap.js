var ctrlCurrentPlacementsMap =
{
    // This is called when the tile manager has loaded us.
    LoadedInTile: function (sTileID, persistedSettings)
    {
        // Note that all our DOM elements have been renamed to be unique and prefixed
        var sPrefix = sTileID + '-';
        var sMapID = sPrefix + "divCurrentPlacementsMap";

        // If on a phone, give up as this is not working
        if (TriSysPhoneGap.ifPhoneHideDashboardTile(sTileID))
            return;

        try
        {
            ctrlCurrentPlacementsMap.Load(sPrefix, persistedSettings, sMapID);

        } catch (e)
        {

        }
    },

    Load: function (sPrefix, persistedSettings, sMapID)
    {
        var userCredentials = TriSysApex.LoginCredentials.UserCredentials();
        var lUserId = userCredentials.LoggedInUser.UserId;

        var CCurrentPlacementsRequest =
        {
            PageNumber: 1,
            RecordsPerPage: TriSysApex.UserOptions.RecordsPerPage(),

            UserId: lUserId
        };

        var payloadObject = {};

        payloadObject.URL = 'Placements/CurrentPlacements';
        payloadObject.OutboundDataPacket = CCurrentPlacementsRequest;
        payloadObject.InboundDataFunction = function (CCurrentPlacementsResponse)
        {
            // Set our callbacks
            TriSysWebJobs.Mapping.DrillIntoPlacementFunction = "TriSysApex.FormsManager.OpenForm('Placement',";

            var fnDrawMap = function (placements)
            {
                var bPlacements = true;
                var mappingData = {
                    MapID: sMapID,
                    Data: placements
                }
                TriSysWebJobs.Mapping.MappingData.Draw(bPlacements, mappingData);
            };

            // Prepare the map
            TriSysWebJobs.Mapping.PopulatePlacementsMap(CCurrentPlacementsResponse.Placements, sMapID, null, fnDrawMap);

            return true;
        };
        
        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            // Probably missing data services key
            console.log('ctrlCurrentPlacementsMap.Load : ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysAPI.Data.PostToWebAPI(payloadObject);
    }
};
