// The ctrlDashboard class controls the dashboard.html form.
// It uses a menu to allow the user to change views.
// Each view is itself a control.
// There however is a special type of control ctrlDashboardLayout which creates a fully
// configurable (drag/drop) layout comprising tiles which can be picked and assigned to each
// layout block. Each tile can also be configured at run-time by the designer who can
// assign the layout to specific users or groups.
// 
// This approach is different to V10 in that the user designers do not create metrics,
// rather they lay them out and set date ranges/colours/icons etc..
// It is the developers and potentially 3rd parties, who provide a library/app store of
// plug-in live tiles.
//
var ctrlDashboard =
{
    Initialise: function()
    {
        ctrlDashboard.PopulateViewMenu();
        ctrlDashboard.PopulateConfigureButtons();
    },

    PopulateViewMenu: function()
    {
        // Draw menu of available dashboard views
        TriSysSDK.FormMenus.DrawUniqueDropDownMenuFromTemplate('dashboardViewMenu', ctrlDashboard.ViewMenuFile, ctrlDashboard.AddDynamicViewsToMenu);

        setTimeout(function ()
        {
            // Allow enough time for the dashboard to load as this may also have security restrictions
			TriSysApex.Cache.ApplicationSettingsManager.Security.Apply.PostLogin(null);

            ctrlDashboard.ViewMenuVisibility();

        }, 500);
    },

    PopulateConfigureButtons: function ()
    {
        $('#dashboard-configure-layout').on('click', function ()
        {
            ctrlDashboard.ConfigureButtonClick('configure-layout');
        });
        $('#dashboard-save-view').on('click', function ()
        {
            ctrlDashboard.ConfigureButtonClick('save-view');
        });
        $('#dashboard-cancel').on('click', function ()
        {
            ctrlDashboard.ConfigureButtonClick('cancel');
        });
        $('#dashboard-add-tile').on('click', function ()
        {
            ctrlDashboard.ConfigureButtonClick('add-tile');
        });
    },

    ViewMenuFile: 'dashboard/ctrlDashboardViewMenu.html',
    ViewMenuItemPrefix: 'dashboard-view-menu-',
    ViewConfigurationFile: 'dashboardviews.json',
    ViewConfiguration: null,
    TileConfigurationFile: 'dashboardtiles.json',
    DashboardViewFile: 'ctrlDashboardView.html',

    // This is the start of the dashboard view population and invocation of the default item.
    //
    AddDynamicViewsToMenu: function()
    {
        // Use in-memory array for speed
        if (!ctrlDashboard.ViewConfiguration)
        {
            // This is the first time that the dashboard has been loaded since login, so read from server
            ctrlDashboard.CallWebServiceToLoadViewConfiguration();
        }
        else
        {
            // We already have the dashboard configuration in memory so keep using this
            ctrlDashboard.PostLoadServerResponse();
        }
    },

    CallWebServiceToLoadViewConfiguration: function()
    {
        var payloadObject = {};

        payloadObject.URL = "Dashboard/Read";

        payloadObject.OutboundDataPacket = null;

        payloadObject.InboundDataFunction = function (data)
        {
            TriSysApex.UI.HideWait();

            var CDashboardReadResponse = data;

            if (CDashboardReadResponse)
            {
                if (CDashboardReadResponse.Success)
                {
                    // Structured
                    ctrlDashboard.ViewConfiguration = CDashboardReadResponse.ViewConfiguration;

                    // Have to convert the layout to JSON
                    var views = ctrlDashboard.ViewConfiguration.Views;
                    for (var iView = 0; iView < views.length; iView++)
                    {
                        var view = ctrlDashboard.ViewConfiguration.Views[iView];
                        var sLayout = view.Layout;
                        view.Layout = JSON.parse(sLayout);
                    }
                }
                else
                    TriSysApex.Logging.LogMessage(CDashboardReadResponse.ErrorMessage);
            }

            // If we get no response, it is because there is no server dashboard data available.
            // This is OK, use that from the .json file
            ctrlDashboard.PostLoadServerResponse();
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('ctrlDashboard.CallWebServiceToLoadViewConfiguration: ' + status + ": " + error + ". responseText: " + request.responseText);
            ctrlDashboard.PostLoadServerResponse();
        };

        TriSysApex.UI.ShowWait(null, "Reading Dashboard Configuration...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);       
    },

    // Callback after server responds with data or not.
    PostLoadServerResponse: function()
    {
        if (!ctrlDashboard.ViewConfiguration)
        {
            // Read the views from the .json file - This should never happen!
            ctrlDashboard.ViewConfiguration = ctrlDashboard.ReadViewConfigurationFromJSONFiles();
        }

        if (!ctrlDashboard.ViewConfiguration)
            return;

        // This populates the view menu comprising all available views, AND automatically loads the default
        ctrlDashboard.PopulateDynamicViewMenuItems();

        // If on a phone, hide some tiles as they either do not work or are not required
        if (TriSysApex.Device.isPhone())
        {
            // Select the most mobile friendly view
            //var view = ctrlDashboard.GetView(TriSysApex.Constants.MobileFriendlyDefaultDashboardView);
            //if (view)
            //    ctrlDashboard.LoadDashboardView(view);

            // Hide the dashboard caption text because this limits the displayed view name
            $('#dashboard-caption-text').html('');

            // Hide irrelevant mobile views
            setTimeout(function ()
            {
                $('#dashboard-view-menu-News').hide();
                $('#dashboard-view-menu-TwitterFeeds').hide();
                $('#dashboard-view-menu-WebPages').hide();
                $('#dashboard-view-menu-WorldWeather').hide();
            }, 1000);
        }
    },

    // Load the dashboardviews AND dashboardtiles to create a 'super array' of cached layout views and tiles
    ReadViewConfigurationFromJSONFiles: function()
    {
        // Get view configuration from the JSON file
        var viewConfiguration = TriSysApex.Forms.Configuration.JsonFileData(ctrlDashboard.ViewConfigurationFile);

        // Read the .json file to get all tile configuration and find a match before loading the tile into the DOM
        var tiles = TriSysApex.Forms.Configuration.JsonFileData(ctrlDashboard.TileConfigurationFile);

        if(viewConfiguration && tiles)
        {
            var views = viewConfiguration.Views;
            if(views)
            {
                for (var iView = 0; iView < views.length; iView++)
                {
                    var view = views[iView];

                    if (view.Control == ctrlDashboard.DashboardViewFile && view.Layout && view.Layout.Tiles)
                    {
                        // Load tiles
                        var tilesArray = [];
                        for (var iLayoutTile = 0; iLayoutTile < view.Layout.Tiles.length; iLayoutTile++)
                        {
                            var layoutTile = view.Layout.Tiles[iLayoutTile];
                            
                            // Match tile configuration from the JSON file
                            for (var iTile = 0; iTile < tiles.length; iTile++)
                            {
                                var tile = tiles[iTile];
                                if(tile.Name == layoutTile.Name)
                                {
                                    var tileCopy = JSON.parse(JSON.stringify(tile));    // Clone the object

                                    // Set layout specific attributes
                                    tileCopy.Location = layoutTile.Location;            // Initial location which may change
                                    tileCopy.GUID = TriSysSDK.Miscellaneous.GUID();     // So that we can uniquely identify it
                                    tileCopy.HideCaption = layoutTile.HideCaption;      // Visible block may have no caption
                                    // Others?

                                    var bAddToArray = true;
                                    if (tileCopy.Hidden)
                                        bAddToArray = false;

                                    if (bAddToArray)
                                    {
                                        // Add to the in-memory copy of the tiles
                                        tilesArray.push(tileCopy);
                                    }
                                }       
                            }
                        }

                        // Set to full array
                        view.Layout.Tiles = tilesArray;
                    }
                }
            }

            return viewConfiguration;
        }
    },

    // Reusable menu population to allow view manager to edit them
    PopulateDynamicViewMenuItems: function()
    {
        // Add a menu item for each view
        var fnMakeMenuItemHTML = function (dashboardView)
        {
            var sID = ctrlDashboard.ViewMenuItemPrefix +dashboardView.Name;
            var sIcon = '<i class="' + dashboardView.Icon.substring(0, 2) + ' ' + dashboardView.Icon + ' pull-right"></i>';
            var sDisplayStyle = (dashboardView.Visible ? '' : ' style="display: none;"');
            var sHTML = '<a href="javascript:void(0)" id="' +sID + '"' + sDisplayStyle + '>' +sIcon +dashboardView.Caption + '</a>';
            return sHTML;
        };

        // Remove any existing menu items
        ctrlDashboard.RemoveEventHandlers();
        var sUL = 'dashboard-view-menu-items';
        $('#' +sUL).find('a').each(function()
        {
            $(this).remove();
        });

        for (var i = 0; i < ctrlDashboard.ViewConfiguration.Views.length; i++)
        {
            var dashboardView = ctrlDashboard.ViewConfiguration.Views[i];
            var sLI = fnMakeMenuItemHTML(dashboardView);
            $('#' +sUL).append(sLI);
        }

        // Ensure that this menu is full visible within the available browser height
        var elemList = $('#dashboard-view-menu-items');
        var iHeight = window.innerHeight - 275;
        elemList.css("max-height", iHeight); //max-height: 250px;

        // Now add the event handlers
        ctrlDashboard.AddEventHandlers();

        // Load the default dashboard view now
        var sDefaultView = ctrlDashboard.ViewConfiguration.Default;
        var view = ctrlDashboard.GetView(sDefaultView);
        if (view)
            ctrlDashboard.LoadDashboardView(view);
    },

    AddEventHandlers: function()
    {
        TriSysSDK.FormMenus.AddEventHandlersToMenuItems('dashboard-view-menu-items-container', ctrlDashboard.ViewMenuItemSelection);
    },

    RemoveEventHandlers: function ()
    {
        TriSysSDK.FormMenus.DeleteEventHandlersOnMenuItems('dashboard-view-menu-items-container');
    },

    ViewMenuItemSelection: function(sMenuID)
    {
        var sID = sMenuID.substring(ctrlDashboard.ViewMenuItemPrefix.length);

        switch(sID)
        {
            case 'configure':
                if (ctrlDashboard.CanViewLayoutBeConfigured())
                    ctrlDashboard.EnableViewLayoutEditMode(true);
                else
                    TriSysApex.UI.ShowMessage("This dashboard view cannot be configured. Use the View Manager to assign visibility and security permissions.");
                
                break;

            case 'manager':
                ctrlDashboard.ViewManagerModal.Show();
                break;

            case 'close':
                TriSysApex.FormsManager.CloseCurrentForm();
                break;

            default:
                // This is a dashboard view which should be loaded into the viewing area
                var view = ctrlDashboard.GetView(sID);
                if (view)
                    ctrlDashboard.LoadDashboardView(view);

                // Auto-hide the button to force the drop down menu to disappear
                ctrlDashboard.HidePopupViewMenu();
        }
    },

    GetView: function(sName)
    {
        for (var i = 0; i < ctrlDashboard.ViewConfiguration.Views.length; i++)
        {
            var dashboardView = ctrlDashboard.ViewConfiguration.Views[i];
            if (dashboardView.Name == sName)
                return dashboardView;
        }
    },

    // Each dashboard view is also known as a 'wall' much like facebook.
    // Each 'wall' can be split up into dynamically generated rows and columns which
    // correspond to the bootstrap 'grid' system - we call it a 'dashboard view layout'
    // Each dashboard view layout comprises tiles, which are drag/droppable blocks/bricks which
    // can be moved and re-located. 
    LoadDashboardView: function(view)
    {
        // Always capture the current view
        ctrlDashboard.CurrentView = view;

        var sDashboardControlFolder = 'dashboard/';
        var sDashboardControlPath = sDashboardControlFolder + view.Control;

        var fnCallbackOnLoad = function ()
        {
            // Dynamically load if desired
            ctrlDashboard.LoadCustomisedDashboardViewLayoutAndTiles(view);
        };

        TriSysApex.FormsManager.loadControlIntoDiv(ctrlDashboard.DashboardContentID, sDashboardControlPath, fnCallbackOnLoad);

        $('#dashboard-view-name').html(view.Caption);
    },

    // Some highly specific dashboard views are 'fixed'.
    // This function is called after loading the dashboard view in order to read
    // server-side customisation for specific views.
    LoadCustomisedDashboardViewLayoutAndTiles: function(view)
    {
        if (view.Control != ctrlDashboard.DashboardViewFile)
            return null;

        ctrlDashboard.DrawLayoutFramework();

        var bShow = false;
        ctrlDashboard.ShowOrHideBlocksWithNoTile(bShow);
        ctrlDashboard.ShowOrHideTileConfigurator(bShow);
    },

    DrawLayoutFramework: function ()
    {
        ctrlDashboard.DeleteExistingRowsAndColumnLayout();

        if (ctrlDashboard.CurrentView.Layout)
        {
            var rows = ctrlDashboard.CurrentView.Layout.Rows;
            if (rows)
            {
                // Add each row in turn
                for (var iRow = 0; iRow < rows.length; iRow++)
                {
                    var row = rows[iRow];
                    ctrlDashboard.DrawRowLayout((iRow + 1), row);
                }
            }

            var tiles = ctrlDashboard.CurrentView.Layout.Tiles;
            if (tiles)
            {
                for (var i = 0; i < tiles.length; i++)
                {
                    var tile = tiles[i];

                    // Draw tile as it stands
                    ctrlDashboard.LoadTile(tile);
                }
            }
        }
    },

    // As the user edits the layout, the underlying framework will been redrawn.
    // This removes all possible rows and columns to keep things clean.
    DeleteExistingRowsAndColumnLayout: function()
    {
        var iMaxRows = 32;

        for (var iRow = 1; iRow <= iMaxRows; iRow++)
        {
            var sRowTemplateID = 'draggable-blocks-row-';

            var rowID = sRowTemplateID + iRow;

            // Clear out and remove old row 
            $('#' + rowID).empty();
            $('#' + rowID).remove();
        }
    },

    DrawRowLayout: function(iRowNumber, row)
    {
        var sRowTemplateID = 'draggable-blocks-row-';
        var elem = document.getElementById(sRowTemplateID);
        if (!elem)
            return;

        var sRowTemplateHTML = elem.outerHTML;
        var sColumnTemplateID = 'dashboard-block-row-1-column-';
        elem = document.getElementById(sColumnTemplateID);
        if (!elem)
            return;

        var sColumnTemplateHTML = elem.outerHTML;

        var rowID = sRowTemplateID + iRowNumber;

        // Add this row to the DOM
        var sRowHTML = sRowTemplateHTML;
        sRowHTML = sRowHTML.replace(sRowTemplateID, rowID);
        sRowHTML = TriSysSDK.DocumentObjectModel.RemoveStyleDisplayNone(sRowHTML);  //.replace('style="display:none;"', '');

        // Add to DOM
        $('#' + ctrlDashboard.DashboardContentID).append(sRowHTML);

        // Calculate the width of each column
        var iEachColumnWidth = 12 / row.Columns;

        // Now add columns to this newly created DOM item
        var sColumnsHTML = '';
        for (var iColumn = 1; iColumn <= row.Columns; iColumn++)
        {
            var sColumnHTML = sColumnTemplateHTML;
            sColumnHTML = sColumnHTML.replace(sColumnTemplateID, 'dashboard-block-row-' + iRowNumber + '-column-' + iColumn);
            sColumnHTML = TriSysSDK.DocumentObjectModel.RemoveStyleDisplayNone(sColumnHTML);    //.replace('style="display:none;"', '');
            sColumnHTML = sColumnHTML.replace('col-sm-4', 'col-sm-' + iEachColumnWidth);

            // Mark the block as empty so that we can easily hide it when not in design mode
            var sBlockPlaceholder = 'dashboard-block-empty-';
            var sGUID = TriSysSDK.Miscellaneous.GUID();
            var sBlockID = sBlockPlaceholder +sGUID;
            sColumnHTML = sColumnHTML.replace(sBlockPlaceholder, sBlockID);

            // Append this column to list of columns
            sColumnsHTML += sColumnHTML + '\n';
        }

        $('#' + rowID).append(sColumnsHTML);
    },

    // This is the DIV in the dashboard where we insert the view
    DashboardContentID: 'divDashboardContent',                  // ctrlDashboard.DashboardContentID

    // This is the current view - it comprises rows, columns and tiles - see dashboardviews.json
    CurrentView: null,        // View (not layout)
   
    // Enumerate through all rows and columns to find all tiles and update the 'in-memory' collection
    SaveEditedTileLayoutLocationsToMemory: function()
    {
        var rows = ctrlDashboard.CurrentView.Layout.Rows;
        if (rows)
        {
            for (var iRow = 0; iRow < rows.length; iRow++)
            {
                var row = rows[iRow];
                for (var iColumn = 1; iColumn <= row.Columns; iColumn++)
                {
                    var sColumnBlockID = 'dashboard-block-row-' + (iRow + 1) + '-column-' + iColumn;

                    // Does a tile live in this block?  
                    var tileNameAndGUIDArray = ctrlDashboard.GetTileNamesAndGUIDInRowColumnBlock(sColumnBlockID);
                    if (tileNameAndGUIDArray)
                    {
                        for (var i = 0; i < tileNameAndGUIDArray.length; i++)
                        {
                            var tileNameAndGUID = tileNameAndGUIDArray[i];
                            var sTileName = tileNameAndGUID.TileName;
                            ctrlDashboard.AssignTileToColumnBlock(sTileName, sColumnBlockID);
                        }
                    }
                }
            }

            // Because we do not wish to retain the tile and locations as we do not get drag/drop events,
            // we must enumerate through the DOM now to determine each row, column, block and tile.
            ctrlDashboard.Persistence.ReadCurrentViewLayoutIntoMemoryArray();
        }
    },

    // Called after selecting a tile using the picker.
    // TODO Garry: This does not handle multiple versions of a tile which it must!
    AssignTileToColumnBlock: function (sTileName, sColumnBlockID)
    {
        var tiles = ctrlDashboard.CurrentView.Layout.Tiles;
        if (tiles)
        {
            for (var i = 0; i < tiles.length; i++)
            {
                var tile = tiles[i];
                if (tile.Name == sTileName)
                {
                    tile.Location = sColumnBlockID;
                    return;
                }
            }
        }

        // If we get this far, then the tile was added from the toolbox so we need to find it in the available plug-in collection
        // and add it to the current view layout
        var tile = ctrlDashboard.GetTileByNameFromJSONFile(sTileName);
        if(tile)
        {
            tiles = ctrlDashboard.CurrentView.Layout.Tiles;
            if (!tiles)
                tiles = [];

            tiles.push(tile);
            tile.Location = sColumnBlockID;
        }
    },

    // Look for the DOM elements with an ID of 'tile-name-' + tile.Name + '-GUID-' + sGUID;
    //
    GetTileNamesAndGUIDInRowColumnBlock: function (sColumnBlockID)
    {
        var tileNameAndGUIDArray = null;
        var sTileNamePrefix = 'tile-name-';
        var DOMobjectIDs = ctrlDashboard.FindDOMObjectsInContainer(sColumnBlockID, sTileNamePrefix);
        if (DOMobjectIDs)
        {
            for (var i = 0; i < DOMobjectIDs.length; i++)
            {
                var sID = DOMobjectIDs[i];
                var parts = sID.split(sTileNamePrefix);
                parts = parts[1].split('-GUID-');
                var sTileName = parts[0];
                var sGUID = parts[1].substring(0, 36);

                if (!tileNameAndGUIDArray)
                    tileNameAndGUIDArray = [];

                var item = { TileName: sTileName, GUID: sGUID };
                tileNameAndGUIDArray.push(item);
            }
        }

        return tileNameAndGUIDArray;
    },

    FindDOMObjectsInContainer: function(sColumnBlockID, sPrefix, bIgnoreLengthCheck)
    {
        var DOMobjectIDs = null;
        var nodesArray = TriSysSDK.DocumentObjectModel.GetAllNodesBeneathUniqueDivID(sColumnBlockID);
        if (nodesArray)
        {
            for (var i = 0; i < nodesArray.length; i++)
            {
                var node = nodesArray[i];
                if (node.id)
                {
                    var sID = node.id;
                    if (sID.indexOf(sPrefix) == 0)
                    {
                        var bAddToDOMArray = false;
                        if (bIgnoreLengthCheck)
                            bAddToDOMArray = true;
                        else
                        {
                            // We are only interested in DOM objects which precisely match the prefix,
                            // not those which are perhaps insid ethe control
                            // e.g. tile-name-z-y-x-GUID-..... NOT tile-name-z-y-x-GUID-.....-sub-field
                            var iGUIDindex = sID.indexOf("-GUID-");
                            var iIDLength = sID.length;
                            if ((iIDLength - iGUIDindex) == 42)
                                bAddToDOMArray = true;
                        }

                        if(bAddToDOMArray)
                        {
                            if (!DOMobjectIDs)
                                DOMobjectIDs = []

                            DOMobjectIDs.push(sID);
                        }
                    }
                }
            }
        }

        return DOMobjectIDs;
    },



    // TILES

    // This should only be called after the tile picker has identified the tile
    GetTileByNameFromJSONFile: function (sName)
    {
        // Read the .json file to get all tile configuration and find a match before loading the tile into the DOM
        var tiles = TriSysApex.Forms.Configuration.JsonFileData(ctrlDashboard.TileConfigurationFile);

        if (!tiles)
            return null;

        for (var i = 0; i < tiles.length; i++)
        {
            var tile = tiles[i];
            if (tile.Name == sName)
                return tile;
        }
    },

    // This searches the current view only - not the same as above.
    // You may wish to call ctrlDashboard.Persistence.ReadCurrentViewLayoutIntoMemoryArray()
    // before this so that the tiles are updated
    GetTileByGUID: function(sGUID)
    {
        var currentViewLayout = ctrlDashboard.CurrentView.Layout;
        if (currentViewLayout)
        {
            var tiles = currentViewLayout.Tiles;
            if (tiles)
            {
                for (var i = 0; i < tiles.length; i++)
                {
                    var tile = tiles[i];
                    if (tile.GUID == sGUID)
                        return tile;
                }
            }
        }
    },

    GetTileByID: function(sTileID)
    {
        var parsedTile = ctrlDashboard.ParseTileID(sTileID);
        var tile = ctrlDashboard.GetTileByGUID(parsedTile.GUID);
        return tile;
    },

    // Each tile dynamically loads the business data and takes care of itself.
    // The tile is itself contains a 'metric' as known in V10.
    LoadTile: function (tile)
    {
        // Each tile is given a unique GUID to allow multiple versions of the same tile to exist on simultaneous dashboard views.
        // This GUID is used for persistence so is saved with the tile.
        var sGUID = tile.GUID;
        if (!sGUID)
        {
            sGUID = TriSysSDK.Miscellaneous.GUID();
            tile.GUID = sGUID;
        }

        var sTileID = ctrlDashboard.CreateTileID(tile.Name, sGUID);
        var sTileContentID = 'tile-content-' + sGUID;

        // Get the contents of the file template
        var sDashboardTilesFolder = 'dashboard/tiles/';
        var sTileFolder = TriSysApex.Constants.UserControlFolder + sDashboardTilesFolder;
        var sTileTemplate = sTileFolder + 'ctrlDashboardTile.html';
        var sTemplateHTML = TriSysApex.NavigationBar.TemplateFile(sTileTemplate);

        // Substitute the variables in the template with unique ID's and callbacks
        sTemplateHTML = sTemplateHTML.replace('##TileID##', sTileID);
        sTemplateHTML = sTemplateHTML.replace('##TileTitle##', tile.Caption);
        sTemplateHTML = sTemplateHTML.replace('##TileContentID##', sTileContentID);

        // Rename the caption ID so that it is unique and can be easily updated
        var sCaptionIDPlaceholder = 'dashboard-tile-caption';
        var sSuffix = '-' + tile.Name + '-GUID-' + sGUID;      // Note - we can allow multiple versions of same tile with different settings
        var sCaptionID = sCaptionIDPlaceholder + sSuffix;
        sTemplateHTML = sTemplateHTML.replace(sCaptionIDPlaceholder, sCaptionID);


        // Menu, callbacks, icon and colour
        //var sIcon = tile.Icon;
        //if (sIcon)
        //{
        //    sIcon = sIcon.substring(0, 2) + ' ' + sIcon;
        //    sTemplateHTML = sTemplateHTML.replace('##TileIcon##', sIcon);
        //}

        var sColour = '';
        if (tile.CaptionBackColour || tile.CaptionForeColour || tile.HideCaption)
        {
            sColour = ' style="';
            if (tile.CaptionBackColour && tile.CaptionBackColour != -1)
                sColour += 'background-color:' + tile.CaptionBackColour + ';';
            if (tile.CaptionForeColour && tile.CaptionForeColour != -1)
                sColour += 'color:' + tile.CaptionForeColour + ';';
            if (tile.HideCaption)
                sColour += 'display:none;';
            sColour += '"';

        }
        sTemplateHTML = sTemplateHTML.replace('##title-colour##', sColour);
        var sTitlePlaceholder = 'dashboard-tile-title';
        var sTitleID = sTitlePlaceholder + sSuffix;
        sTemplateHTML = sTemplateHTML.replace(sTitlePlaceholder, sTitleID);
        
        // Rename the ID so that it is unique
        var sConfigureID = 'dashboard-tile-configure-menu-button';
        var sButtonID = sConfigureID + sSuffix;
        sTemplateHTML = sTemplateHTML.replace(sConfigureID, sButtonID);

        var sMenuContainer = 'dashboard-tile-configure-menu-items-container';
        var sMenuContainerID = sMenuContainer + sSuffix;
        sTemplateHTML = sTemplateHTML.replace(sMenuContainer, sMenuContainerID);

        // Delete tile option
        var sDeleteItemPlaceholder = 'dashboard-tile-configure-menu-items-delete';
        var sDeleteItemID = sDeleteItemPlaceholder + sSuffix;
        sTemplateHTML = sTemplateHTML.replace(sDeleteItemPlaceholder, sDeleteItemID);

        var sDeleteClick = 'onclick="ctrlDashboard.DeleteTileMenuClick(\'' + sTileID + '\');"';
        sTemplateHTML = sTemplateHTML.replace('##delete-tile##', sDeleteClick);

        // Set caption and colours so that multiple instances of the same tile can be differentiated
        var sSetCaptionPlaceholder = 'dashboard-tile-configure-menu-items-set-caption';
        var sSetCaptionID = sSetCaptionPlaceholder + sSuffix;
        sTemplateHTML = sTemplateHTML.replace(sSetCaptionPlaceholder, sSetCaptionID);

        var sSetCaptionClick = 'onclick="ctrlDashboard.SetCaption(\'' + sTileID + '\');"';
        sTemplateHTML = sTemplateHTML.replace('##set-caption##', sSetCaptionClick);

        var sSetColoursPlaceholder = 'dashboard-tile-configure-menu-items-set-colours';
        var sSetColoursID = sSetColoursPlaceholder + sSuffix;
        sTemplateHTML = sTemplateHTML.replace(sSetColoursPlaceholder, sSetColoursID);

        var sSetColoursClick = 'onclick="ctrlDashboard.SetColours(\'' + sTileID + '\');"';
        sTemplateHTML = sTemplateHTML.replace('##set-colours##', sSetColoursClick);

        // Specific menus
        var sOptionsPlaceholderPrefix = 'dashboard-tile-configure-menu-items-';
        var sOptionsGroupDivider = '##options-group-divider##';
        var sOptionsGroupDividerTagValue = 'style="display: none;"';

        // Example of adding additional options to persisted tiles - set, then use 'Save Layout'
        //if (tile.Name == 'ctrlTop5Pie')     // Glitch because we created these be
        //    tile.MenuConfigurationItems = ["chart-options"];

        var sChartOptions = 'chart-options';
        var sChartOptionsPlaceholder = sOptionsPlaceholderPrefix + sChartOptions;
        var bShowChartOptions = (tile.MenuConfigurationItems && tile.MenuConfigurationItems.indexOf(sChartOptions) >= 0);
        var sChartOptionsID = sChartOptionsPlaceholder + sSuffix;
        sTemplateHTML = sTemplateHTML.replace(sChartOptionsPlaceholder, sChartOptionsID);

        var sChartOptionsClick = bShowChartOptions ? 'onclick="ctrlDashboard.ChartOptionsModal.Show(\'' + sTileID + '\');"' : 'style="display: none;"';
        sTemplateHTML = sTemplateHTML.replace('##chart-options##', sChartOptionsClick);
        if (bShowChartOptions)
            sOptionsGroupDividerTagValue = '';

        var sWebPageOptions = 'webpage-options';
        var sWebPageOptionsPlaceholder = sOptionsPlaceholderPrefix + sWebPageOptions;
        var bShowWebPageOptions = (tile.MenuConfigurationItems && tile.MenuConfigurationItems.indexOf(sWebPageOptions) >= 0);
        var sWebPageOptionsID = sWebPageOptionsPlaceholder + sSuffix;
        sTemplateHTML = sTemplateHTML.replace(sWebPageOptionsPlaceholder, sWebPageOptionsID);

        var sWebPageOptionsClick = bShowWebPageOptions ? 'onclick="ctrlDashboard.WebPageOptionsModal.Show(\'' + sTileID + '\');"' : 'style="display: none;"';
        sTemplateHTML = sTemplateHTML.replace('##webpage-options##', sWebPageOptionsClick);
        if (bShowWebPageOptions)
            sOptionsGroupDividerTagValue = '';

        var sOptionsGroupDividerID = 'dashboard-tile-configure-menu-items-options-group-divider';
        sTemplateHTML = sTemplateHTML.replace(sOptionsGroupDividerID, sOptionsGroupDividerID + sSuffix);
        sTemplateHTML = sTemplateHTML.replace(sOptionsGroupDivider, sOptionsGroupDividerTagValue);


        // Add configure menu options from the tile specification
        var sMenuContainerPlaceholder = 'dashboard-tile-configure-menu-container';
        var sMenuContainerID = sMenuContainerPlaceholder + sSuffix;
        sTemplateHTML = sTemplateHTML.replace(sMenuContainerPlaceholder, sMenuContainerID);

        var sCustomGroupPlaceholder = 'dashboard-tile-configure-menu-items-custom-group';
        var sCustomGroupID = sCustomGroupPlaceholder + sSuffix;
        sTemplateHTML = sTemplateHTML.replace(sCustomGroupPlaceholder, sCustomGroupID);

        var sCustomGroupDividerPlaceholder = 'dashboard-tile-configure-menu-items-custom-group-divider';
        var sCustomGroupDividerID = sCustomGroupDividerPlaceholder + sSuffix;
        sTemplateHTML = sTemplateHTML.replace(sCustomGroupDividerPlaceholder, sCustomGroupDividerID);

        var sCustomMenuItemPlaceholder = 'dashboard-tile-configure-menu-items-custom-item';
        var sCustomMenuItemID = sCustomMenuItemPlaceholder + sSuffix;
        sTemplateHTML = sTemplateHTML.replace(sCustomMenuItemPlaceholder, sCustomMenuItemID);

        var bCustomMenusVisible = false;
        if (tile.MenuVisible)
        {
            // There must be menu items and a callback function must be specified
            if(tile.MenuItems && tile.MenuCallback)
                bCustomMenusVisible = true;     // Menus are customised below AFTER adding to the DOM
        }       


        // Insert into the DOM at the top left of the dashboard view
        try
        {
            // evidence that ie hates the invalid characters in the placeholders, so remove them
            //sTemplateHTML = sTemplateHTML.replace('##custom-menu-onclick##', '');
            //sTemplateHTML = sTemplateHTML.replace('##custom-menu-icon##', '');
            //sTemplateHTML = sTemplateHTML.replace('##custom-menu-caption##', '');


            $('#' + tile.Location).prepend(sTemplateHTML);

        } catch (e)
        {
            // Have seen this error in IE
            TriSysApex.UI.ShowError(e, "LoadTile: " + tile.Name);
        }


        // After loading DOM, remove the configure menu if necessary
        if (!tile.MenuVisible)
        {
            $('#' + sMenuContainerID).remove();
        }
        else if (!bCustomMenusVisible)
        {
            $('#' + sCustomGroupID).remove();
            $('#' + sCustomGroupDividerID).remove();
        }
        else
        {
            // Add each dynamic menu item directly to the DOM as it is easier than string manipulation before adding to DOM
            if (bCustomMenusVisible && sCustomMenuItemID)
            {
                var element = document.getElementById(sCustomMenuItemID);
                if (element)
                {
                    var sCustomeMenuItemHTML = element.outerHTML;

                    // Add menu items to DOM
                    var menuItems = tile.MenuItems;
                    for (var i = 0; i < menuItems.length; i++)
                    {
                        var menuItem = menuItems[i];        // { "ID": "Test-Ticker-Test-1-Menu-Item", "Caption": "Test Ticker Test 1 Menu Item", "Icon": "gi-film" }
                        var sMenuItemID = sCustomMenuItemPlaceholder + '-' + menuItem.ID;
                        var sMenuItem = sCustomeMenuItemHTML;

                        sMenuItem = sMenuItem.replace(sCustomMenuItemID, sMenuItemID);
                        sMenuItem = sMenuItem.replace('custom-menu-caption', menuItem.Caption);

                        var sIcon = menuItem.Icon;
                        if (sIcon)
                            sIcon = sIcon.substring(0, 2) + ' ' + sIcon;
                        sMenuItem = sMenuItem.replace('custom-menu-icon', sIcon);

                        var sOnClick = 'TriSysApex.DynamicClasses.CallFunction(\'' + tile.MenuCallback + '\', \'' + menuItem.ID + '\', \'' + sTileID + '\')';
                        sMenuItem = sMenuItem.replace('custom-menu-onclick', sOnClick);

                        // Add to all other custom menu items
                        $('#' + sCustomGroupID).append(sMenuItem);


                        // Note to Garry - dynamic closures are really hard to debug man!
                        // They might be powerful, but they create very hard to maintain code for dynamically drawn DOM elements
                        var bUseClosures = false;
                        if (bUseClosures)
                        {
                            // Add callback click AFTER adding to DOM as the placeholder mechanism inside a DOM <a> tag gets ruined by the browser adding additional ="" (yup, that's right)
                            // Hence we need to deal with CLOSURES!!!
                            var fnInvokeCustomMenuItemClosure = function (sCustomMenuItemID)      // Need a delegate/closure otherwise we get the last ID in the array
                            {
                                return function ()
                                {
                                    TriSysApex.DynamicClasses.CallFunction(tile.MenuCallback, sCustomMenuItemID, sTileID);
                                };
                            };

                            // Must remove any existing event handlers
                            $('#' + sMenuItemID).unbind();

                            // Note how this has to be a direct single call, not a function call within a function call?
                            $('#' + sMenuItemID).click(fnInvokeCustomMenuItemClosure(menuItem.ID));
                        }
                    }
                }
            }

            if (sCustomMenuItemID)
            {
                // Finally remove the 'template' item
                $('#' + sCustomMenuItemID).remove();
            }
        }

        // This is the mechanism by which we tell the control that it has been loaded and this is the 
        // ID of the tile within which it lives. This may be important for a variety of reasons such as 
        // 
        var fnAfterLoad = function ()
        {
            // IMPORTANT: rename all HTML element ID's so that they are unique and can therefore be uniquely
            // referenced and programmed without conflict.
            // Live Tile designers must be told that all of their HTML DOM elements will be renamed by prefixing with the tile ID
            TriSysSDK.Controls.General.RenameElementIdsWithParentIdPrefixOrSuffix(sTileContentID, sTileID, true);

            // Apply any tile-block settings such as colours/captions/icons
            ctrlDashboard.Persistence.ApplyPersistedTileSettings(tile, sTileID);

            // Call the tile to populate the data
            ctrlDashboard.CallTileLoadedCallback(sTileID, tile.PersistedSettings);
        };

        // Now load the content into this tile: this will fire the self-contained JS in this control
        var sControl = sDashboardTilesFolder + tile.Control;
        TriSysApex.FormsManager.loadControlIntoDiv(sTileContentID, sControl, fnAfterLoad);
    },

    DeleteTileMenuClick: function(sTileID)
    {
        // Remove from DOM
        $('#' + sTileID).remove();

        // Remove from collection of tiles
        var tileToDelete = ctrlDashboard.GetTileByID(sTileID);
        var tiles = ctrlDashboard.CurrentView.Layout.Tiles;
        if (tiles)
        {
            for (var i = 0; i < tiles.length; i++)
            {
                var tile = tiles[i];
                if (tile.GUID == tileToDelete.GUID)
                {
                    tiles.splice(i, 1);
                    break;
                }
            }
        }
    },

    SetCaption: function(sTileID)
    {
        ctrlDashboard.SetCaptionModal.Show(sTileID);
    },

    SetColours: function (sTileID)
    {
        ctrlDashboard.SetColoursModal.Show(sTileID);
    },

    // See uiDraggable.js
    InitialiseDragDrop: function(bEnable)
    {
        // Which draggable blocks are available?
        if (!ctrlDashboard.CurrentView.Layout)
            return;

        var sDivCollection = '';
        var sDraggableBlockRow = '#draggable-blocks-row-';
        for (var i = 0; i < ctrlDashboard.CurrentView.Layout.Rows.length; i++)
        {
            if (sDivCollection.length > 0)
                sDivCollection += ', ';

            sDivCollection += sDraggableBlockRow + (i + 1);
        }

        /* Initialize draggable and sortable blocks, check out more examples at https://jqueryui.com/sortable/ */
        if (bEnable)
        {
            $(sDivCollection).sortable({
                connectWith: '.row',
                items: '.block',
                opacity: 0.75,
                handle: '.block-title',
                placeholder: 'draggable-placeholder',
                tolerance: 'pointer',
                start: function (e, ui)
                {
                    ui.placeholder.css('height', ui.item.outerHeight());
                }
            });
            $(sDivCollection).sortable("enable");
        }
        else
            $(sDivCollection).sortable("disable");

        // If we are in edit mode, then show all blocks with no tiles assigned,
        // else if not in edit mode, then hide all blocks with no tiles assigned
        var bShow = bEnable;
        ctrlDashboard.ShowOrHideBlocksWithNoTile(bShow);

        // Same for the configurator buttons - hide them for end-users not in designer mode
        ctrlDashboard.ShowOrHideTileConfigurator(bShow);
    },

    // Called when we go into edit mode - administrators/power users only
    EnableViewLayoutEditMode: function(bEnable)
    {
        ctrlDashboard.InitialiseDragDrop(bEnable);

        if (bEnable)
            $('#dashboard-view-menu-button').attr("disabled", true);
        else
            $('#dashboard-view-menu-button').removeAttr("disabled");

        var buttons = ['dashboard-configure-layout', 'dashboard-save-view', 'dashboard-cancel', 'dashboard-add-tile'];

        for (var i = 0; i < buttons.length; i++)
        {
            var button = buttons[i];
            if (bEnable)
                $('#' + button).show();
            else
                $('#' + button).hide();
        }
    },

    ViewMenuVisibility: function()
    {
        //Dashboard Hide View Menu
        var sValue = TriSysApex.Cache.SystemSettingManager.GetValue(TriSysApex.Constants.DashboardHideViewMenu);
        var bVisible = !TriSysAPI.Operators.stringToBoolean(sValue, false);
        var elem = $('#dashboard-view-menu-button');
        if (bVisible)
            elem.show();
        else
            elem.hide();
    },

    // Weired how we have to manually close this
    HidePopupViewMenu: function()
    {
        // New
        var block = $('#dashboard-view-menu-btn-group');
        block.removeClass('open');
        block.removeClass('show-on-hover');
        return;

        // Old - no work!
        var menuItems = $('#dashboard-view-menu-items-container');
        menuItems.hide();
        setTimeout(function ()
        {
            menuItems.css('display', '');
        }, 5000);
    },

    ShowOrHideBlocksWithNoTile: function (bShow)
    {
        var rows = ctrlDashboard.CurrentView.Layout.Rows;
        if (rows)
        {
            for (var iRow = 0; iRow < rows.length; iRow++)
            {
                var row = rows[iRow];
                for (var iColumn = 1; iColumn <= row.Columns; iColumn++)
                {
                    var sColumnBlockID = 'dashboard-block-row-' + (iRow + 1) + '-column-' + iColumn;

                    // Which tiles live in this block?  
                    var tileNames = ctrlDashboard.GetTileNamesAndGUIDInRowColumnBlock(sColumnBlockID);
                    if (!tileNames)
                    {
                        if (bShow)
                            $('#' + sColumnBlockID).show();
                        else
                            $('#' + sColumnBlockID).hide();
                    }
                    else
                    {
                        // Although a tile is assigned, the designer may have inserted a placeholder into
                        // here to allow the user to drag and stack tiles.
                        // Find it and hide it
                        var sBlockPlaceholder = 'dashboard-block-empty-';
                        var DOMobjectIDs = ctrlDashboard.FindDOMObjectsInContainer(sColumnBlockID, sBlockPlaceholder, true);
                        if (DOMobjectIDs)
                        {
                            for (var i = 0; i < DOMobjectIDs.length; i++)
                            {
                                var sID = DOMobjectIDs[i];
                                if (bShow)
                                    $('#' + sID).show();
                                else
                                    $('#' + sID).hide();
                            }
                        }
                    }
                }
            }
        }
    },

    ShowOrHideTileConfigurator: function(bShow)
    {
        var sConfigureID = 'dashboard-tile-configure-menu-button';

        // Search for all elements with this prefix and show or hide them
        $('#' + ctrlDashboard.DashboardContentID).find('[id^=' + sConfigureID + ']').each(function ()
        {
            if (bShow)
                $(this).show();
            else
                $(this).hide();
        });
    },

    // Tile ID's are comprised of 'tile-name-' + tile.Name + '-GUID-' + sGUID;
    CreateTileID: function(sTileName, sGUID)
    {
        var sTileID = 'tile-name-' + sTileName + '-GUID-' + sGUID;
        return sTileID;
    },

    // Return {Name: 'xxxx', GUID: 'yyyy'}
    ParseTileID: function(sTileID)
    {
        var parts = sTileID.split('tile-name-');
        parts = parts[1].split('-GUID-');
        var sTileName = parts[0];
        var sGUID = parts[1];

        var parsedTile = { TileName: sTileName, GUID: sGUID };
        return parsedTile;
    },

    ConfigureButtonClick: function(sItem)
    {
        switch(sItem)
        {
            case 'configure-layout':
                var rows = ctrlDashboard.CurrentView.Layout.Rows;
                ctrlDashboard.ConfigureLayoutModal.Show(rows);
                break;

            case 'save-view':
                // Enumerate through all rows and columns to find all tiles and update the 'in-memory' collection
                ctrlDashboard.SaveEditedTileLayoutLocationsToMemory();

                // Save ALL views to server without fuss - this may be overkill but it saves the administrator having to explicitly do it
                ctrlDashboard.ViewManagerModal.ApplyChangesAsynchronouslyAndSilentlyToServer();

                // Turn off the edit mode
                ctrlDashboard.EnableViewLayoutEditMode(false);
                break;

            case 'cancel':
                // Turn off the edit mode
                ctrlDashboard.EnableViewLayoutEditMode(false);

                // Reload current layout
                ctrlDashboard.LoadDashboardView(ctrlDashboard.CurrentView);
                break;

            case 'add-tile':
                // Popup all available tiles which are NOT ON THIS VIEW
                ctrlDashboard.TilePickerModal.Show();
                break;
        }
    },

    CanViewLayoutBeConfigured: function()
    {
        if (ctrlDashboard.CurrentView.Layout)
        {
            if (ctrlDashboard.CurrentView.Control == ctrlDashboard.DashboardViewFile)
                return true;
        }

        return false;
    },

    ConfigureLayoutModal:
    {
        Context: {
            Rows: [
                { Columns: 1}
            ]
        },

        Show: function (rows)
        {
            var context = ctrlDashboard.ConfigureLayoutModal.Context;
            context.Rows = rows;

            var parametersObject = new TriSysApex.UI.ShowMessageParameters();
            parametersObject.Title = "Dashboard Layout";
            parametersObject.Image = "gi-adjust_alt";
            parametersObject.Maximize = true;

            parametersObject.ContentURL = TriSysApex.Constants.UserControlFolder + "dashboard/ctrlDashboardLayout.html";
            parametersObject.ButtonCentreText = "Apply";
            parametersObject.ButtonCentreVisible = true;
            parametersObject.ButtonCentreFunction = ctrlDashboard.ConfigureLayoutModal.ApplyLayout;
            parametersObject.ButtonRightText = "Cancel";
            parametersObject.ButtonRightVisible = true;

            TriSysApex.UI.PopupMessage(parametersObject);
        },

        Draw: function()
        {
            var context = ctrlDashboard.ConfigureLayoutModal.Context;
            var rows = context.Rows;

            var sRowsSpinner = 'dashboardLayout-Rows';
            var fieldDescription = { MinValue: 1, MaxValue: 32, SpinIncrement: 1 };
            TriSysSDK.Controls.NumericSpinner.Initialise(sRowsSpinner, fieldDescription);

            TriSysApex.FieldEvents.AddNumberChangeFieldOfInterest(sRowsSpinner, ctrlDashboard.ConfigureLayoutModal.ChangeRowCount);
            TriSysSDK.Controls.NumericSpinner.SetValue(sRowsSpinner, rows.length);
            TriSysSDK.Controls.NumericSpinner.DecimalPlaces(sRowsSpinner, 0);
            
            ctrlDashboard.ConfigureLayoutModal.DrawTable();
        },

        // Called when user adds/removes rows
        ChangeRowCount: function (sFieldID, fValue)
        {
            var context = ctrlDashboard.ConfigureLayoutModal.Context;
            var rows = context.Rows;

            var sRowsSpinner = 'dashboardLayout-Rows';
            var iRows = TriSysSDK.Controls.NumericSpinner.GetValue(sRowsSpinner);
            //iRows = Math.floor(iRows, 0);
            iRows = parseInt(iRows);

            console.log(' ChangeRowCount: iRows=' + iRows);

            if (iRows < rows.length)
                rows.splice(iRows - 1, 32);
            else if(iRows > rows.length)
                rows.push({ Columns: 2 });

            ctrlDashboard.ConfigureLayoutModal.DrawTable();
        },

        // Called when user add/removes columns for the specified row
        ChangeColumnCount: function (sFieldID, fValue)
        {
            var sRowColumnsSpinnerPrefix = 'dashboardLayout-Row-';
            var sRowColumnSpinnerSuffix = '-Columns';
            var parts = sFieldID.split(sRowColumnsSpinnerPrefix);
            parts = parts[1].split(sRowColumnSpinnerSuffix);
            var iRow = parseInt(parts[0]);

            var context = ctrlDashboard.ConfigureLayoutModal.Context;
            var rows = context.Rows;

            var iColumns = parseInt(Math.floor(fValue, 0));

            var row = rows[(iRow - 1)];
            row.Columns = iColumns;

            ctrlDashboard.ConfigureLayoutModal.ChangeRowCount();
        },

        // Draw a dynamic table with integrated column spinners to visually draw the layout
        DrawTable: function (sFieldID, fValue)
        {
            var context = ctrlDashboard.ConfigureLayoutModal.Context;
            var rows = context.Rows;

            var tableBody = $('#dashboard-layout-table > tbody');
            var rowSpecifierTemplateName = 'dashboard-layout-table-row-specifier';
            var rowVisualTemplateName = 'dashboard-layout-table-row-visual';
            var sRowSpecifier = document.getElementById(rowSpecifierTemplateName).outerHTML;
            var sRowVisual = document.getElementById(rowVisualTemplateName).outerHTML;
            var visualTableBody = $('#dashboard-layout-table-dynamicLayout > tbody');

            // Remove any existing rows/columns but compensate for a bug in the spinner counting beyond the maximum
            var iMaxRows = 32;
            for (var i = 0; i <= iMaxRows; i++)     
            {
                var sRowSpecifierInstanceName = rowSpecifierTemplateName + '-' + (i + 1);
                var sRowColumnsSpinner = 'dashboardLayout-Row-' + (i + 1) + '-Columns';
                TriSysSDK.Controls.NumericSpinner.RemoveEventHandlers(sRowColumnsSpinner);
                $('#' + sRowSpecifierInstanceName).remove();

                var sVisualRowInstanceName = rowVisualTemplateName + '-' + (i + 1);
                $('#' + sVisualRowInstanceName).remove();
            }


            // Dynamic rows & columns
            for (var i = 0; i < rows.length; i++)
            {
                var row = rows[i];
                var iRow = i + 1;
                var sRowSpecifierInstanceName = rowSpecifierTemplateName + '-' + iRow;
                var sRowColumnsSpinner = 'dashboardLayout-Row-' + iRow + '-Columns';

                // dashboardLayout-Row-1-Columns
                var sTableRowHTML = sRowSpecifier;
                sTableRowHTML = sTableRowHTML.replace(rowSpecifierTemplateName, sRowSpecifierInstanceName);
                sTableRowHTML = TriSysSDK.DocumentObjectModel.RemoveStyleDisplayNone(sTableRowHTML);    //.replace('style="display:none;"', '');
                sTableRowHTML = sTableRowHTML.replace('##Row##', 'Row ' + iRow);
                sTableRowHTML = sTableRowHTML.replace('##ColumnSpinner##', sRowColumnsSpinner);
                tableBody.append(sTableRowHTML);

                var fieldDescription = { MinValue: 1, MaxValue: 12, SpinIncrement: 1 };
                TriSysSDK.Controls.NumericSpinner.Initialise(sRowColumnsSpinner, fieldDescription);
                TriSysSDK.Controls.NumericSpinner.SetValue(sRowColumnsSpinner, row.Columns);
                TriSysSDK.Controls.NumericSpinner.DecimalPlaces(sRowColumnsSpinner, 0);
                TriSysApex.FieldEvents.AddNumberChangeFieldOfInterest(sRowColumnsSpinner, ctrlDashboard.ConfigureLayoutModal.ChangeColumnCount);

                // Add the visual rows and column representation
                var sVisualTableRowInstance = rowVisualTemplateName + '-' + iRow;
                var sVisualTableRowHTML = sRowVisual;
                sVisualTableRowHTML = sVisualTableRowHTML.replace(rowVisualTemplateName, sVisualTableRowInstance);
                sVisualTableRowHTML = TriSysSDK.DocumentObjectModel.RemoveStyleDisplayNone(sVisualTableRowHTML);    //.replace('style="display:none;"', '');

                var sVisualColumns = '';
                var fPercentageWidth = (100 / row.Columns);
                for (var iColumn = 0; iColumn < row.Columns; iColumn++)
                {
                    var sBorder = '';
                    if (iColumn > 0)
                        sBorder = "border-left: 1px dotted gray;";

                    var sDivText = (iColumn + 1);
                    sDivText = '<table id="dashboard-layout-table-small-panel"><tr><td>' + iRow + '.' + (iColumn + 1) + '</td></tr></table>';

                    // 15 Oct 2024: Allow user to speficy the width of the column
                    sDivText = `<trisys-field id="test-numeric-` + iRow + `-` + (iColumn + 1) + `" type="numeric"
							          minimum="1" maximum="12" increment="1" 
							          integer="false" value="1" style="height: 28px;">
                                </trisys-field>`;

                    var iBootstrapWidth = "1";
                    if (row.Columns == 11)
                        iBootstrapWidth = (iColumn == 0 ? "2" : "1");
                    else if (row.Columns == 10)
                        iBootstrapWidth = (iColumn == 0 ? "3" : "1");
                    else if (row.Columns == 9)
                        iBootstrapWidth = (iColumn == 0 || iColumn == 1 ? "2" : "1");
                    else if (row.Columns == 5)
                        iBootstrapWidth = (iColumn == 0 ? "4" : "2");
                    else if (row.Columns == 4)
                        iBootstrapWidth = "3";
                    else if (row.Columns == 3)
                        iBootstrapWidth = "4";
                    else if (row.Columns == 2)
                        iBootstrapWidth = "6";
                    else if (row.Columns == 1)
                        iBootstrapWidth = "12";

                    sDivText = `<trisys-field id="test-combo-` + iRow + `-` + (iColumn + 1) + `" type="combo"
							          lookups="1,2,3,4,5,6,7,8,9,10,11,12" value="` + iBootstrapWidth + `"" style="height: 25px;">
                                </trisys-field>`;

                    var sVisualColumn = '<div style="float: left; text-align: center; width:' + fPercentageWidth + '%;' + sBorder + '">' + sDivText + '</div>';
                    sVisualColumns += sVisualColumn;
                }
                sVisualTableRowHTML = sVisualTableRowHTML.replace('##RowColumnLayout##', sVisualColumns);

                visualTableBody.append(sVisualTableRowHTML);
            }

            // Data oriented code
            var sFormName = "dashboardLayoutModal";

            // Tell CShowForm that we are initialised and it can initialise the widgets
            TriSysSDK.CShowForm.InitialiseFields(sFormName);
        },

        ApplyLayout: function ()
        {
            // The modal editor uses the same context, so we can pass this back to the redraw layout algorithm
            var context = ctrlDashboard.ConfigureLayoutModal.Context;
            var rows = context.Rows;

            // Apply this to the current layout
            ctrlDashboard.CurrentView.Layout.Rows = rows;

            // Enumerate through all rows and columns to find all tiles and update the 'in-memory' collection
            ctrlDashboard.SaveEditedTileLayoutLocationsToMemory();            

            // Remember we are still in 'edit mode' so turn this off first - this is because we have to know the 
            // blocks before we can make the draggable
            ctrlDashboard.InitialiseDragDrop(false);

            // And now refresh the view 
            ctrlDashboard.DrawLayoutFramework();

            // Now after re-drawing, turn editing back on again
            ctrlDashboard.InitialiseDragDrop(true);

            return true;
        }
    },       // ctrlDashboard.ConfigureLayoutModal

    TilePickerModal:       // ctrlDashboard.TilePickerModal
    {
        Show: function ()
        {
            var parametersObject = new TriSysApex.UI.ShowMessageParameters();
            parametersObject.Title = "Dashboard Live-Tile Picker";
            parametersObject.Image = "gi-charts";
            parametersObject.Maximize = true;

            parametersObject.ContentURL = TriSysApex.Constants.UserControlFolder + "dashboard/ctrlDashboardTilePicker.html";
            parametersObject.ButtonRightText = "Close";
            parametersObject.ButtonRightVisible = true;

            TriSysApex.UI.PopupMessage(parametersObject);
        },

        // Called when the modal dialogue is loaded and we are to populate with dashboardtiles.json
        // and also configure button callbacks/views etc..
        LoadTilePicker: function()
        {
            // Load list bar event handlers
            var liPrefix = 'dashboard-tile-picker-category-';
            var liArray = ['all', 'contacts', 'companies', 'requirements', 'placements', 'timesheets', 'tasks',
                            'actions', 'financial', 'consultant', 'social', 'system'];
            
            for (var i = 0; i < liArray.length; i++)
            {
                var sCategory = liArray[i];
                var liID = liPrefix + sCategory;
                var li = $('#' + liID);

                // Enumerate through each a href instance and set up the event handler
                li.find('a').each(function ()
                {
                    $(this).click(function (e)
                    {
                        e.preventDefault();
                        var li = $(this).parent();
                        var liID = li.attr("id");
                        var parts = liID.split(liPrefix);
                        var sSelectedCategory = parts[1];
                        ctrlDashboard.TilePickerModal.TilePickerCategorySelection(sSelectedCategory);
                    });
                });
            }

            // Load default list (All)
            ctrlDashboard.TilePickerModal.PopulateListOfTilesForCategory('all');
        },

        // Called when the user clicks on a category.
        // Make it active, and display the list of available tiles/metrics for this category.
        TilePickerCategorySelection: function(sCategory)
        {
            var sUL = 'dashboard-tile-picker-categories-list';
            $('#' + sUL).find('li').each(function ()
            {
                $(this).removeClass('active');
            });

            // Highlight chosen
            var liPrefix = 'dashboard-tile-picker-category-';
            var liID = liPrefix + sCategory;
            $('#' + liID).addClass('active');

            // Show caption
            var sDisplayCategory = sCategory.substring(0, 1).toUpperCase() + sCategory.substring(1);
            $('#dashboard-tile-picker-category').html(sDisplayCategory);

            // Show all available tiles
            ctrlDashboard.TilePickerModal.PopulateListOfTilesForCategory(sCategory);
        },

        // Read the .json file for all 
        PopulateListOfTilesForCategory: function(sCategory)
        {
            ctrlDashboard.TilePickerModal.RemoveAllTilesFromList();

            var tiles = TriSysApex.Forms.Configuration.JsonFileData(ctrlDashboard.TileConfigurationFile);

            if (!tiles)
                return null;

            var iAddedCounter = 0;
            for (var i = 0; i < tiles.length; i++)
            {
                var tile = tiles[i];
                var bAddTile = (sCategory == 'all');
                if (!bAddTile)
                    bAddTile = (tile.Category.toLowerCase() == sCategory.toLowerCase());

                if (tile.Hidden)
                    bAddTile = false;

                if (bAddTile)
                {
                    iAddedCounter += 1;
                    ctrlDashboard.TilePickerModal.AddTileToList(tile, iAddedCounter);
                }
            }
        },

        RemoveAllTilesFromList: function()
        {
            // Enumerate through all VISIBLE TR's and remove each
            var sTableID = 'dashboard-tile-picker-category-tiles-table';

            $('#' + sTableID + ' tr').each(function (i, row)
            {
                var sDisplay = $(row).css("display");
                if (sDisplay)
                {
                    if (sDisplay.indexOf("none") < 0)
                        $(row).remove();
                }
            });
        },

        AddTileToList: function(tile, iRow)
        {
            // Get row templates
            var sTableRowTemplateID = 'dashboard-tile-picker-category-tiles-table-row';
            var sTableRowTemplateHTML = document.getElementById(sTableRowTemplateID).outerHTML;
            var sTableRowDividerTemplateID = 'dashboard-tile-picker-category-tiles-table-row-divider';
            var sTableRowDividerTemplateHTML = document.getElementById(sTableRowDividerTemplateID).outerHTML;

            // Replace tile details
            var sTableRowID = sTableRowTemplateID + '-' + iRow;
            var sTableRow = sTableRowTemplateHTML;
            sTableRow = sTableRow.replace(sTableRowTemplateID, sTableRowID);
            sTableRow = sTableRow.replace('display:none;', '');
            sTableRow = sTableRow.replace('display: none;', '');

            var sThumbnailImage = tile.Thumbnail;
            var sImageFolder = 'images/trisys/dashboard-tiles/';
            if (sThumbnailImage)
                sThumbnailImage = sImageFolder + sThumbnailImage;
            else
                sThumbnailImage = sImageFolder + 'missing.png';

            var sTileCaption = tile.Caption;
            var sImageViewer = '';
            if (sThumbnailImage)
                sImageViewer = 'onclick="TriSysSDK.Controls.FileManager.OpenDocumentViewer(\'' + sTileCaption + '\', \'' + sThumbnailImage + '\');"';
            sTableRow = sTableRow.replace('##image-viewer##', sImageViewer);

            sTableRow = sTableRow.replace('##ImagePath##', sThumbnailImage);
            sTableRow = sTableRow.replace('##Caption##', sTileCaption);
            sTableRow = sTableRow.replace('##Description##', tile.Description);

            // The install button - designer user can install multiple versions of the same tile
            var bInstalledInView = false;
            var sInstallHandler = 'onclick="ctrlDashboard.TilePickerModal.InstallButtonClicked(\'' + tile.Name + '\', this);"';
            var sEnabled = (bInstalledInView ? 'disabled' : '');
            var sInstall = (bInstalledInView ? '' : sInstallHandler);
            sTableRow = sTableRow.replace('##install-enabled##', sEnabled);
            sTableRow = sTableRow.replace('##install-click##', sInstall);


            // Add this row to the DOM
            var sTableID = 'dashboard-tile-picker-category-tiles-table';
            if (iRow > 1)
            {
                var sRowDivider = sTableRowDividerTemplateHTML;
                sRowDivider = TriSysSDK.DocumentObjectModel.RemoveStyleDisplayNone(sRowDivider);    //.replace('style="display:none;"', '');
                $('#' + sTableID).append(sRowDivider);
            }

            $('#' +sTableID).append(sTableRow);

        },

        // Called when user clicks install button
        InstallButtonClicked: function(sTileName, btn)
        {
            // Install add-in
            var tile = ctrlDashboard.GetTileByNameFromJSONFile(sTileName);
            if (tile)
            {
                // Always add tile top left
                var sLocation = 'dashboard-block-row-1-column-1';
                tile.Location = sLocation;
                ctrlDashboard.LoadTile(tile);

                // Add to in-memory array
                ctrlDashboard.CurrentView.Layout.Tiles.push(tile);

                // Let the user know
                TriSysApex.Toasters.Success("Installed Tile: " + tile.Caption)

                var bMultipleInstancesAllowed = true;
                if (bMultipleInstancesAllowed)
                {
                    if (!ctrlDashboard.TilePickerModal.InstructedUserOnMultipleInstances)
                    {
                        var sMessage = "You can add multiple versions to your view and configure each one with different parameters.";
                        TriSysApex.Toasters.Info(sMessage);
                        ctrlDashboard.TilePickerModal.InstructedUserOnMultipleInstances = true;
                    }
                }
                else
                {
                    // Mark button as disabled
                    $(btn).addClass('disabled');
                }
            }
        },

        InstructedUserOnMultipleInstances: false        // Only tell the user once about this magic ;-)

    },   // ctrlDashboard.TilePickerModal

    SetCaptionModal:       // ctrlDashboard.SetCaptionModal
    {
        TileID: null,

        Show: function (sTileID)
        {
            ctrlDashboard.SetCaptionModal.TileID = sTileID;

            var parametersObject = new TriSysApex.UI.ShowMessageParameters();
            parametersObject.Title = "Dashboard Tile Caption";
            parametersObject.Image = "gi-subtitles"
            parametersObject.Maximize = true;

            parametersObject.ContentURL = TriSysApex.Constants.UserControlFolder + "dashboard/ctrlSetCaption.html";
            parametersObject.ButtonLeftText = "Apply";
            parametersObject.ButtonLeftFunction = function ()
            {
                var bSaved = ctrlDashboard.SetCaptionModal.SaveTileCaption(sTileID);
                return bSaved;
            };
            parametersObject.ButtonLeftVisible = true;
            parametersObject.ButtonRightText = "Cancel";
            parametersObject.ButtonRightVisible = true;

            TriSysApex.UI.PopupMessage(parametersObject);
        },

        GetCaptionFieldID: function(sTileID)
        {
            var parsedTile = ctrlDashboard.ParseTileID(sTileID);
            var sSuffix = '-' + parsedTile.TileName + '-GUID-' + parsedTile.GUID;
            var sCaptionID = 'dashboard-tile-caption' + sSuffix;
            return sCaptionID;
        },

        Load: function()
        {
            // Read existing caption directly from DOM
            var sTileID = ctrlDashboard.SetCaptionModal.TileID;
            var sCaptionID = ctrlDashboard.SetCaptionModal.GetCaptionFieldID(sTileID);
            var sCaption = $('#' +sCaptionID).html();

            var sCaptionField = 'dashboard-set-caption';
            $('#' + sCaptionField).val(sCaption);
        },

        SaveTileCaption: function (sTileID)
        {
            var sCaptionField = 'dashboard-set-caption';
            var sCaption = $('#' + sCaptionField).val();
            if (!sCaption)
            {
                TriSysApex.UI.ShowMessage("Please enter some text for the caption.");
                return false;
            }

            // Update DOM
            var sCaptionID = ctrlDashboard.SetCaptionModal.GetCaptionFieldID(sTileID);
            $('#' +sCaptionID).html(sCaption);

            // Now update the tile with this caption ready for saving
            var persistedSetting = {
                Setting: 'Caption', Value: sCaption
            };
            ctrlDashboard.Persistence.SaveTileSetting(sTileID, persistedSetting);

            return true;
        },

        SetTileCaption: function (sTileID, sCaption)
        {
            var sCaptionID = ctrlDashboard.SetCaptionModal.GetCaptionFieldID(sTileID);
            $('#' + sCaptionID).html(sCaption);

            // If set to blank - do not show the caption
            if (sCaption == ' ')
                $('#' + sCaptionID).hide();     // TODO: What about editing though?
            else
                $('#' + sCaptionID).show();
        }

    },   // ctrlDashboard.SetCaptionModal

    SetColoursModal:    // ctrlDashboard.SetColoursModal
    {
        TileID: null,
        BackColour: null,
        ForeColour: null,

        Show: function (sTileID)
        {
            ctrlDashboard.SetColoursModal.TileID = sTileID;

            var parametersObject = new TriSysApex.UI.ShowMessageParameters();
            parametersObject.Title = "Dashboard Tile Colours";
            parametersObject.Image = "fa-paint-brush"
            parametersObject.Maximize = true;

            parametersObject.ContentURL = TriSysApex.Constants.UserControlFolder + "dashboard/ctrlSetColours.html";
            parametersObject.ButtonLeftText = "Apply";
            parametersObject.ButtonLeftFunction = function ()
            {
                var bSaved = ctrlDashboard.SetColoursModal.SaveTileColours(sTileID);
                return bSaved;
            };
            parametersObject.ButtonLeftVisible = true;

            parametersObject.ButtonCentreText = "Reset";
            parametersObject.ButtonCentreFunction = function ()
            {
                var bReset = true;
                var bSaved = ctrlDashboard.SetColoursModal.SaveTileColours(sTileID, bReset);
                return bSaved;
            };
            parametersObject.ButtonCentreVisible = true;

            parametersObject.ButtonRightText = "Cancel";
            parametersObject.ButtonRightVisible = true;

            TriSysApex.UI.PopupMessage(parametersObject);
        },
        
        GetTileTitleBlockID: function(sTileID)
        {
            var parsedTile = ctrlDashboard.ParseTileID(sTileID);
            var sSuffix = '-' + parsedTile.TileName + '-GUID-' + parsedTile.GUID;
            var sBlockID = 'dashboard-tile-title' + sSuffix;
            return sBlockID;
        },

        Load: function ()
        {
            // Read existing colours directly from DOM
            var sTileID = ctrlDashboard.SetColoursModal.TileID;
            var sTileTitle = ctrlDashboard.SetColoursModal.GetTileTitleBlockID(sTileID);
            var lForeColour = $('#' +sTileTitle).css('color');
            var lBackColour = $('#' +sTileTitle).css('background-color');

            try
            {
                //lForeColour = kendo.parseColor(lForeColour);
                //lBackColour = kendo.parseColor(lBackColour);

                var fore = $("#dashboard-tile-set-colour-foreground-picker").kendoColorPicker().data("kendoColorPicker");
                var back = $("#dashboard-tile-set-colour-background-picker").kendoColorPicker().data("kendoColorPicker");

                fore.value(lForeColour);
                back.value(lBackColour);

                // Callbacks
                var callback = {
                    select: function (e)
                    {
                        var sElement = this.element.attr("id");
                        var lColour = e.value;
                        ctrlDashboard.SetColoursModal.ColourChangeEvent(sElement, lColour);
                    },
                    change: function (e)
                    {
                        var sElement = this.element.attr("id");
                        var lColour = e.value;
                        ctrlDashboard.SetColoursModal.ColourChangeEvent(sElement, lColour);
                    }
                };

                fore.bind(callback);
                back.bind(callback);

                ctrlDashboard.SetColoursModal.ForeColour = lForeColour;
                ctrlDashboard.SetColoursModal.BackColour = lBackColour;

            } catch (ex)
            {
                //alert('Cannot parse color: "' + color + '"');
            }
        },

        ColourChangeEvent: function(sElement, lColour)
        {
            var sID = 'dashboard-tile-set-colour-colours';
            switch(sElement)
            {
                case 'dashboard-tile-set-colour-foreground-picker':
                    $('#' + sID).css('color', lColour);
                    ctrlDashboard.SetColoursModal.ForeColour = lColour;
                    break;

                case 'dashboard-tile-set-colour-background-picker':
                    $('#' + sID).css('background-color', lColour);
                    ctrlDashboard.SetColoursModal.BackColour = lColour;
                    break;
            }
        },

        SaveTileColours: function (sTileID, bReset)
        {
            if (bReset)
            {
                ctrlDashboard.SetColoursModal.ForeColour = -1;
                ctrlDashboard.SetColoursModal.BackColour = -1;
            }

            var colours = { Foreground: ctrlDashboard.SetColoursModal.ForeColour, Background: ctrlDashboard.SetColoursModal.BackColour };            

            var persistedSetting = {
                Setting: 'Colours', Value: colours
            };
            ctrlDashboard.Persistence.SaveTileSetting(sTileID, persistedSetting);

            ctrlDashboard.SetColoursModal.SetTileColours(sTileID, colours);

            return true;
        },

        // Called after identifying that there are persisted settings relating to tile colour
        SetTileColours: function(sTileID, colourPair)
        {
            var lBackColour = colourPair.Background;
            var lForeColour = colourPair.Foreground;

            // Set actual tile block title
            var sTitleBlockID = ctrlDashboard.SetColoursModal.GetTileTitleBlockID(sTileID);

            if (lBackColour == -1 && lForeColour == -1)
            {
                $('#' + sTitleBlockID).removeAttr('style');
            }
            else
            {
                $('#' + sTitleBlockID).css('color', lForeColour);
                $('#' + sTitleBlockID).css('background-color', lBackColour);
            }
        }

    },  // ctrlDashboard.SetColoursModal

    ChartOptionsModal:          // ctrlDashboard.ChartOptionsModal
    {
        Setting: 'ChartOptions',
        TileID: null,

        Show: function (sTileID)
        {
            ctrlDashboard.ChartOptionsModal.TileID = sTileID;

            var parametersObject = new TriSysApex.UI.ShowMessageParameters();
            parametersObject.Title = "Dashboard Tile Chart Options";
            parametersObject.Image = "gi-charts"
            parametersObject.Maximize = true;

            parametersObject.ContentURL = TriSysApex.Constants.UserControlFolder + "dashboard/ctrlChartOptions.html";
            parametersObject.ButtonLeftText = "Apply";
            parametersObject.ButtonLeftFunction = function ()
            {
                var bSaved = ctrlDashboard.ChartOptionsModal.SaveChartOptions(sTileID);
                return bSaved;
            };
            parametersObject.ButtonLeftVisible = true;

            parametersObject.ButtonCentreText = "Reset";
            parametersObject.ButtonCentreFunction = function ()
            {
                var bReset = true;
                var bSaved = ctrlDashboard.ChartOptionsModal.SaveChartOptions(sTileID, bReset);
                return bSaved;
            };
            parametersObject.ButtonCentreVisible = true;

            parametersObject.ButtonRightText = "Cancel";
            parametersObject.ButtonRightVisible = true;

            TriSysApex.UI.PopupMessage(parametersObject);
        },

        Load: function ()
        {
            // Read existing settings directly from DOM
            var sTileID = ctrlDashboard.ChartOptionsModal.TileID;   // tile-name-ContactSource-GUID-8e36a526-8a9e-23db-6b56-d5648592bb77

            var tile = ctrlDashboard.GetTileByID(sTileID);
            if (!tile)
                return;     // All bets are off

            if (!tile.PersistedSettings)
            {
                var persistedSetting = {
                    Setting: ctrlDashboard.ChartOptionsModal.Setting, Value: ctrlDashboard.ChartOptionsModal.DefaultChartOptions
                };

                tile.PersistedSettings = [persistedSetting];
            }

            if (tile.PersistedSettings)
            {
                var persistedSettings = tile.PersistedSettings;
                var chartOptions = ctrlDashboard.Persistence.GetSettingValue(persistedSettings, ctrlDashboard.ChartOptionsModal.Setting, null);

                var sFormFieldPrefix = 'dashboard-tile-chart-options-';
                var sLegendVisibleID = sFormFieldPrefix + 'legend-visible';
                var sLegendPositionID = sFormFieldPrefix + 'legend-position';
                var sLabelsVisibleID = sFormFieldPrefix + 'labels-visible';
                var sLabelsPositionID = sFormFieldPrefix + 'labels-position';
                var sHeightID = sFormFieldPrefix + 'height';
                var sSQLID = sFormFieldPrefix + 'sql'
                var sAPIFunctionID = sFormFieldPrefix + 'api-function'

                TriSysSDK.CShowForm.SetCheckBoxValue(sLegendVisibleID, TriSysAPI.Operators.stringToBoolean(chartOptions.LegendVisible, false));

                var legendPositions = [
                    { value: 'top', text: 'Top' },
                    { value: 'bottom', text: 'Bottom' },
                    { value: 'left', text: 'Left' },
                    { value: 'right', text: 'Right' }
                ];

                TriSysSDK.CShowForm.populateComboFromDataSource(sLegendPositionID, legendPositions, 0);
                TriSysSDK.CShowForm.SetValueInCombo(sLegendPositionID, chartOptions.LegendPosition);

                TriSysSDK.CShowForm.SetCheckBoxValue(sLabelsVisibleID, TriSysAPI.Operators.stringToBoolean(chartOptions.LabelsVisible, false));

                var labelPositions = [                
                    {value: 'center', text: 'Centre'},
                    {value: 'insideEnd', text: 'Inside End'},
                    {value: 'insideBase', text: 'Inside Base'},
                    {value: 'outsideEnd', text: 'Outside End'}
                ];

                TriSysSDK.CShowForm.populateComboFromDataSource(sLabelsPositionID, labelPositions, 0);
                TriSysSDK.CShowForm.SetValueInCombo(sLabelsPositionID, chartOptions.LabelsPosition);

                var fieldDescription = { MinValue: 1, MaxValue: 1024, SpinIncrement: 10 };
                TriSysSDK.Controls.NumericSpinner.Initialise(sHeightID, fieldDescription);
                TriSysSDK.Controls.NumericSpinner.DecimalPlaces(sHeightID, 0);
                if(chartOptions.Height > 0)
                    TriSysSDK.Controls.NumericSpinner.SetValue(sHeightID, chartOptions.Height);

                // Legacy to be removed in Jan 2018
                $('#' + sSQLID).val(chartOptions.SQL);

                // New based on API function
                var apiFunctions = ctrlDashboard.ChartOptionsModal.Data.APIFunctions();
                TriSysSDK.CShowForm.populateComboFromDataSource(sAPIFunctionID, apiFunctions, 0);
                TriSysSDK.CShowForm.SetValueInCombo(sAPIFunctionID, chartOptions.APIFunction);
            }
        },

        Data:
        {
            APIFunctions: function()
            {
                var jsonData = TriSysApex.Forms.Configuration.JsonFileData('chart-api.json');
                if (jsonData)
                {
                    var functions = jsonData.API;
                    if(functions)
                    {
                        var displayFunctions = [];

                        for (var i = 0; i < functions.length; i++)
                        {
                            var func = functions[i];
                            var item = { value: func.Function, text: func.Function };
                            displayFunctions.push(item);
                        }

                        return displayFunctions;
                    }
                }
                return null;
            }
        },

        DefaultChartOptions: {
            LabelsVisible: false,
            LegendVisible: false,
            Height: 300,        
            //SQL: null,
            APIFunction: "DashboardMetric/PieChartDefault"
        },

        SaveChartOptions: function (sTileID, bReset)
        {
            var chartOptions = null;

            if (bReset)
                chartOptions = ctrlDashboard.ChartOptionsModal.DefaultChartOptions;
            else
            {
                var sFormFieldPrefix = 'dashboard-tile-chart-options-';
                var sLegendVisibleID = sFormFieldPrefix + 'legend-visible';
                var sLegendPositionID = sFormFieldPrefix + 'legend-position';
                var sLabelsVisibleID = sFormFieldPrefix + 'labels-visible';
                var sLabelsPositionID = sFormFieldPrefix + 'labels-position';
                var sHeightID = sFormFieldPrefix + 'height';
                var sSQLID = sFormFieldPrefix + 'sql'
                var sAPIFunctionID = sFormFieldPrefix + 'api-function'

                chartOptions = {
                    LabelsVisible: TriSysSDK.CShowForm.GetCheckBoxValue(sLabelsVisibleID),
                    LabelsPosition: TriSysSDK.CShowForm.GetValueFromCombo(sLabelsPositionID),
                    LegendVisible: TriSysSDK.CShowForm.GetCheckBoxValue(sLegendVisibleID),
                    LegendPosition: TriSysSDK.CShowForm.GetValueFromCombo(sLegendPositionID),
                    Height: TriSysSDK.Controls.NumericSpinner.GetValue(sHeightID),
                    //SQL: $('#' + sSQLID).val(),
                    APIFunction: TriSysSDK.CShowForm.GetValueFromCombo(sAPIFunctionID)
                };
            }

            var persistedSetting = {
                Setting: ctrlDashboard.ChartOptionsModal.Setting, Value: chartOptions
            };
            ctrlDashboard.Persistence.SaveTileSetting(sTileID, persistedSetting);

            var persistedSettings = [persistedSetting];
            ctrlDashboard.ChartOptionsModal.SetChartOptions(sTileID, persistedSettings);

            return true;
        },

        // Called TWICE:
        // a. after editing the settings using the configure menu to open the modal settings
        // b. after loading persisted settings when loading dashboard
        SetChartOptions: function (sTileID, persistedSettings)
        {
            // Fire the chart API to refresh the chart based upon the new settings
            ctrlDashboard.CallTileLoadedCallback(sTileID, persistedSettings);
        }
    },

    //#region ctrlDashboard.WebPageOptionsModal
    WebPageOptionsModal:
    {
        Setting: 'WebPageOptions',
        TileID: null,

        Show: function (sTileID)
        {
            ctrlDashboard.WebPageOptionsModal.TileID = sTileID;

            var parametersObject = new TriSysApex.UI.ShowMessageParameters();
            parametersObject.Title = "Dashboard Tile Web Page Options";
            parametersObject.Image = "gi-globe"
            parametersObject.Maximize = true;

            parametersObject.ContentURL = TriSysApex.Constants.UserControlFolder + "dashboard/ctrlWebPageOptions.html";
            parametersObject.ButtonLeftText = "Apply";
            parametersObject.ButtonLeftFunction = function ()
            {
                var bSaved = ctrlDashboard.WebPageOptionsModal.SaveWebPageOptions(sTileID);
                return bSaved;
            };
            parametersObject.ButtonLeftVisible = true;

            parametersObject.ButtonCentreText = "Reset";
            parametersObject.ButtonCentreFunction = function ()
            {
                var bReset = true;
                var bSaved = ctrlDashboard.WebPageOptionsModal.SaveWebPageOptions(sTileID, bReset);
                return bSaved;
            };
            parametersObject.ButtonCentreVisible = true;

            parametersObject.ButtonRightText = "Cancel";
            parametersObject.ButtonRightVisible = true;

            TriSysApex.UI.PopupMessage(parametersObject);
        },

        Load: function ()
        {
            // Read existing settings directly from DOM
            var sTileID = ctrlDashboard.WebPageOptionsModal.TileID;   // tile-name-ContactSource-GUID-8e36a526-8a9e-23db-6b56-d5648592bb77

            var tile = ctrlDashboard.GetTileByID(sTileID);
            if (!tile)
                return;     // All bets are off

            if (!tile.PersistedSettings)
            {
                var persistedSetting = {
                    Setting: ctrlDashboard.WebPageOptionsModal.Setting, Value: ctrlDashboard.WebPageOptionsModal.DefaultWebPageOptions
                };

                tile.PersistedSettings = [persistedSetting];
            }

            if (tile.PersistedSettings)
            {
                var persistedSettings = tile.PersistedSettings;
                var WebPageOptions = ctrlDashboard.Persistence.GetSettingValue(persistedSettings, ctrlDashboard.WebPageOptionsModal.Setting, null);

                var sFormFieldPrefix = 'dashboard-tile-webpage-options-';
                var sHeightID = sFormFieldPrefix + 'height';
                var sURLID = sFormFieldPrefix + 'url'

                var fieldDescription = { MinValue: 50, MaxValue: 10000, SpinIncrement: 10 };
                TriSysSDK.Controls.NumericSpinner.Initialise(sHeightID, fieldDescription);
                TriSysSDK.Controls.NumericSpinner.DecimalPlaces(sHeightID, 0);
                if (WebPageOptions.Height > 0)
                    TriSysSDK.Controls.NumericSpinner.SetValue(sHeightID, WebPageOptions.Height);

                $('#' + sURLID).val(WebPageOptions.URL);
            }
        },

        DefaultWebPageOptions: {
            Height: 300,
            URL: null
        },

        SaveWebPageOptions: function (sTileID, bReset)
        {
            var WebPageOptions = null;

            if (bReset)
                WebPageOptions = ctrlDashboard.WebPageOptionsModal.DefaultWebPageOptions;
            else
            {
                var sFormFieldPrefix = 'dashboard-tile-webpage-options-';
                var sHeightID = sFormFieldPrefix + 'height';
                var sURLID = sFormFieldPrefix + 'url'

                WebPageOptions = {
                    Height: TriSysSDK.Controls.NumericSpinner.GetValue(sHeightID),
                    URL: $('#' + sURLID).val()
                };
            }

            var persistedSetting = {
                Setting: ctrlDashboard.WebPageOptionsModal.Setting, Value: WebPageOptions
            };
            ctrlDashboard.Persistence.SaveTileSetting(sTileID, persistedSetting);

            var persistedSettings = [persistedSetting];
            ctrlDashboard.WebPageOptionsModal.SetWebPageOptions(sTileID, persistedSettings);

            return true;
        },

        // Called TWICE:
        // a. after editing the settings using the configure menu to open the modal settings
        // b. after loading persisted settings when loading dashboard
        SetWebPageOptions: function (sTileID, persistedSettings)
        {
            // Fire the WebPage API to refresh the WebPage based upon the new settings
            ctrlDashboard.CallTileLoadedCallback(sTileID, persistedSettings);
        }
    },
    //#endregion ctrlDashboard.WebPageOptionsModal

    CallTileLoadedCallback: function (sTileID, persistedSettings)
    {
        var tile = ctrlDashboard.GetTileByID(sTileID);
        if (!tile)
            return;

        if (!persistedSettings)
            persistedSettings = tile.PersistedSettings;

        var sLoadedCallbackFunction = null;
        try
        {
            if (tile.LoadedCallback)
                sLoadedCallbackFunction = tile.LoadedCallback;

        } catch (e)
        {
            // Tile does not have a loaded callback function
        }

        // Callback the control now to let it know that all is ready for population
        if (sLoadedCallbackFunction)
        {
            try
            {
                TriSysApex.DynamicClasses.CallFunction(sLoadedCallbackFunction, sTileID, persistedSettings);

            } catch (e)
            {
                // Report as a logged message because this is not the users concern
                TriSysApex.Logging.LogMessage("Callback Function: " + tile.LoadedCallback + '. ' + TriSysApex.Logging.CatchVariableToText(e));
            }
        }
    },
    
    ViewManagerModal:        // ctrlDashboard.ViewManagerModal
    {
        SelectedViewName: null,

        Show: function()
        {
            var parametersObject = new TriSysApex.UI.ShowMessageParameters();
            parametersObject.Title = "Dashboard View Manager";
            parametersObject.Image = "fa-cubes"
            parametersObject.Maximize = true;

            parametersObject.ContentURL = TriSysApex.Constants.UserControlFolder + "dashboard/ctrlDashboardViewManager.html";

            parametersObject.ButtonLeftText = "Apply View";
            parametersObject.ButtonLeftFunction = function ()
            {
                var bSaved = ctrlDashboard.ViewManagerModal.Apply();
                return bSaved;
            };
            parametersObject.ButtonLeftVisible = true;

            parametersObject.ButtonCentreText = "Manage";
            parametersObject.ButtonCentreFunction = function ()
            {
                var bReset = ctrlDashboard.ViewManagerModal.Manage();
                return bReset;
            };
            parametersObject.ButtonCentreVisible = true;

            parametersObject.ButtonRightText = "Cancel";
            parametersObject.ButtonRightVisible = true;

            TriSysApex.UI.PopupMessage(parametersObject);
        },

        Load: function()
        {
            // Load from server settings
            ctrlDashboard.ViewManagerModal.PopulateListOfViews();

            // Setup event handlers to text boxes because we want real-time updates to our in-memory array
            $("#dashboard-view-manager-caption").on("change keyup paste click", ctrlDashboard.ViewManagerModal.CaptionChangeEvent);
            $("#dashboard-view-manager-description").on("change keyup paste click", ctrlDashboard.ViewManagerModal.DescriptionChangeEvent);

            // Can only set the default, cannot clear it
            $("#dashboard-view-manager-default").on("click", ctrlDashboard.ViewManagerModal.DefaultClick);

            // Visibility
            $("#dashboard-view-manager-visible").on("click", ctrlDashboard.ViewManagerModal.VisibleClickEvent);

            // Icon
            $('#dashboard-view-manager-icon').on("click", ctrlDashboard.ViewManagerModal.IconClickEvent);

            // Move items up and down ordering
            $("#dashboard-view-manager-move-up").on("click", function ()
            {
                var bUp = true;
                ctrlDashboard.ViewManagerModal.Move(bUp);
            });
            $("#dashboard-view-manager-move-down").on("click", function ()
            {
                var bUp = false;
                ctrlDashboard.ViewManagerModal.Move(bUp);
            });

            // Copy and delete buttons
            $('#dashboard-view-manager-copy').on("click", ctrlDashboard.ViewManagerModal.CopyView);
            $('#dashboard-view-manager-delete').on("click", ctrlDashboard.ViewManagerModal.DeleteView);
        },

        PopulateListOfViews: function(sSelectedViewName)
        {
            var sItemPrefix = 'dashboard-view-manager-list-item-';
            var sItemTemplate = sItemPrefix + 'template';
            var sRowTemplateHTML = document.getElementById(sItemTemplate).outerHTML;

            // Remove any existing items in case of re-ordering or deletion
            var sUL = 'dashboard-view-manager-list';
            $('#' + sUL).find('li').each(function ()
            {
                var sID = this.id;
                if (sID != sItemTemplate)
                    $(this).remove();
            });


            // Always use in-memory data which may have come from server
            for(var i = 0; i < ctrlDashboard.ViewConfiguration.Views.length; i++)
            {
                var dashboardView = ctrlDashboard.ViewConfiguration.Views[i];

                // Ordering is always as listed
                dashboardView.Ordering = i +1;

                // Get the row template and merge this view
                var sRowItemHTML = sRowTemplateHTML;
                var sItemID = sItemPrefix +dashboardView.Name;
                sRowItemHTML = sRowItemHTML.replace(sItemTemplate, sItemID)
                sRowItemHTML = TriSysSDK.DocumentObjectModel.RemoveStyleDisplayNone(sRowItemHTML);  //.replace('style="display:none;"', '');

                var sOnClick = 'ctrlDashboard.ViewManagerModal.SelectView(\'' +dashboardView.Name + '\')';
                sRowItemHTML = sRowItemHTML.replace('##view-click-event##', sOnClick);

                var sIcon = dashboardView.Icon.substring(0, 2) + ' ' +dashboardView.Icon;
                sRowItemHTML = sRowItemHTML.replace('##view-icon##', sIcon);

                sRowItemHTML = sRowItemHTML.replace('##view-name##', dashboardView.Name);
                sRowItemHTML = sRowItemHTML.replace('##view-caption##', dashboardView.Caption);

                // Append item to list
                $('#' +sUL).append(sRowItemHTML);

                if (!sSelectedViewName)
                {
                    // Select the first item
                    if (i == 0)
                        sSelectedViewName = dashboardView.Name;
                }

                if (sSelectedViewName == dashboardView.Name)                
                    ctrlDashboard.ViewManagerModal.SelectView(dashboardView.Name);
            }
        },

        // Called when the user selects a view. Make it active
        SelectView: function(sViewName)
        {
            // Clear any existing active status'
            var sUL = 'dashboard-view-manager-list';
            $('#' + sUL).find('li').each(function ()
            {
                $(this).removeClass('active');
            });

            var sItemPrefix = 'dashboard-view-manager-list-item-';
            var sItemID = sItemPrefix + sViewName;
            $('#' + sItemID).addClass('active');

            // Display details...
            var sDefaultViewName = ctrlDashboard.ViewConfiguration.Default;
            var dashboardView = ctrlDashboard.ViewManagerModal.GetView(sViewName);
            if(dashboardView)
            {
                $('#dashboard-view-manager-name').val(dashboardView.Name);
                $('#dashboard-view-manager-caption').val(dashboardView.Caption);
                $('#dashboard-view-manager-description').val(dashboardView.Description);

                var sClass = dashboardView.Icon;
                if (sClass)
                {
                    sClass = sClass.substring(0, 2) + ' ' + sClass;
                    ctrlDashboard.ViewManagerModal.ShowIcon(sClass);
                }

                var sCheckBoxID = 'dashboard-view-manager-default';
                var bDefault = (dashboardView.Name == sDefaultViewName);
                TriSysSDK.CShowForm.SetCheckBoxValue(sCheckBoxID, bDefault);

                if(bDefault)
                    $('#' + sCheckBoxID).attr("disabled", true);
                else
                    $('#' + sCheckBoxID).removeAttr("disabled");

                $('#dashboard-view-manager-selected-view-name').html("View: " +dashboardView.Name);

                // Extra details to help us diagnose why tiles are not correctly being managed
                var sExtra = JSON.stringify(dashboardView.Layout);
                $('#dashboard-view-manager-extra').val(sExtra);

                var sVisibleID = 'dashboard-view-manager-visible';
                TriSysSDK.CShowForm.SetCheckBoxValue(sVisibleID, dashboardView.Visible);
            }

            // Record it for convenience
            ctrlDashboard.ViewManagerModal.SelectedViewName = sViewName;
        },

        DefaultClick: function()
        {
            var sCheckBoxID = 'dashboard-view-manager-default';
            var bDefault = TriSysSDK.CShowForm.GetCheckBoxValue(sCheckBoxID);

            // Set this as default
            ctrlDashboard.ViewConfiguration.Default = ctrlDashboard.ViewManagerModal.SelectedViewName;
        },

        GetCurrentView: function()
        {
            return ctrlDashboard.ViewManagerModal.GetView(ctrlDashboard.ViewManagerModal.SelectedViewName);
        },

        GetView: function (sName)
        {
            for (var i = 0; i < ctrlDashboard.ViewConfiguration.Views.length; i++)
            {
                var dashboardView = ctrlDashboard.ViewConfiguration.Views[i];
                if (dashboardView.Name == sName)
                    return dashboardView;
            }
        },

        GetViewByCaption: function (sCaption)
        {
            for (var i = 0; i < ctrlDashboard.ViewConfiguration.Views.length; i++)
            {
                var dashboardView = ctrlDashboard.ViewConfiguration.Views[i];
                if (dashboardView.Caption == sCaption)
                    return dashboardView;
            }
        },

        CaptionChangeEvent: function()
        {
            var dashboardView = ctrlDashboard.ViewManagerModal.GetCurrentView();
            dashboardView.Caption = $("#dashboard-view-manager-caption").val();
        },

        DescriptionChangeEvent: function()
        {
            var dashboardView = ctrlDashboard.ViewManagerModal.GetCurrentView();
            dashboardView.Description = $("#dashboard-view-manager-description").val();
        },

        VisibleClickEvent: function ()
        {
            var dashboardView = ctrlDashboard.ViewManagerModal.GetCurrentView();
            dashboardView.Visible = TriSysSDK.CShowForm.GetCheckBoxValue('dashboard-view-manager-visible');
        },

        IconClickEvent: function()
        {
            var fnPicked = function (sIcon)
            {
                var dashboardView = ctrlDashboard.ViewManagerModal.GetCurrentView();
                dashboardView.Icon = sIcon.substring(3);
                ctrlDashboard.ViewManagerModal.ShowIcon(sIcon);
            };

            TriSysApex.ModalDialogue.IconPicker.Show(fnPicked);
        },

        ShowIcon: function(sIcon)
        {
            var elem = $('#dashboard-view-manager-icon');
            var sClass = sIcon + ' fa-2x';
            elem.removeClass().addClass(sClass);
            elem.css("color", TriSysProUI.BackColour());
        },

        Move: function(bUp)
        {
            var iViewCount = ctrlDashboard.ViewConfiguration.Views.length;
            var selectedView = ctrlDashboard.ViewManagerModal.GetCurrentView();
            var bDown = !bUp;
            
            // Cannot move out of range
            if (bUp && selectedView.Ordering == 1)
                return;
            if (bDown && selectedView.Ordering == iViewCount)
                return;

            // Re-Order the in-memory list of views
            selectedView.Ordering = (bUp ? selectedView.Ordering - 1 : selectedView.Ordering + 1);
            var newList = [];
            for (var i = 1; i <= ctrlDashboard.ViewConfiguration.Views.length; i++)
            {
                var dashboardView = ctrlDashboard.ViewConfiguration.Views[i-1];
                if (i == selectedView.Ordering)
                {
                    if (bUp)
                    {
                        newList.push(selectedView);
                        dashboardView.Ordering += 1;
                        newList.push(dashboardView);
                    }
                    else
                    {
                        dashboardView.Ordering -= 1;
                        newList.push(dashboardView);
                        newList.push(selectedView);
                    }
                }
                else if (dashboardView.Name != selectedView.Name)
                    newList.push(dashboardView);
            }

            // Re-point to new ordered list
            ctrlDashboard.ViewConfiguration.Views = newList;

            
            // Now refresh the list, highlighting that currently selected
            ctrlDashboard.ViewManagerModal.PopulateListOfViews(ctrlDashboard.ViewManagerModal.SelectedViewName);
        },

        CopyView: function()
        {
            var selectedView = ctrlDashboard.ViewManagerModal.GetCurrentView();
            if (!selectedView)
                return;

            ctrlDashboard.CopyViewModal.Show();
        },

        DeleteView: function ()
        {
            var selectedView = ctrlDashboard.ViewManagerModal.GetCurrentView();
            if (!selectedView)
                return;

            if (ctrlDashboard.ViewConfiguration.Views.length <= 1)
            {
                TriSysApex.UI.ShowMessage("You are not permitted to delete all views.");
                return;
            }

            var bDeletedDefault = (selectedView.Name == ctrlDashboard.ViewConfiguration.Default);

            for (var i = 0; i < ctrlDashboard.ViewConfiguration.Views.length; i++)
            {
                var dashboardView = ctrlDashboard.ViewConfiguration.Views[i];
                if (dashboardView.Name == selectedView.Name)
                {
                    ctrlDashboard.ViewConfiguration.Views.splice(i, 1);
                    break;
                }
            }

            if (bDeletedDefault)
            {
                // Set the default again
                var defaultView = ctrlDashboard.ViewConfiguration.Views[0];
                ctrlDashboard.ViewConfiguration.Default = defaultView.Name;
            }

            ctrlDashboard.ViewManagerModal.PopulateListOfViews(ctrlDashboard.ViewConfiguration.Default);
        },

        Apply: function ()
        {
            // Redraw the view menu and load the default in the dashboard
            ctrlDashboard.PopulateDynamicViewMenuItems();

            // Save changes to server without fuss
            ctrlDashboard.ViewManagerModal.ApplyChangesAsynchronouslyAndSilentlyToServer();

            // Return true to close the dialogue
            return true;
        },

        // Original function to reset from JSON
        Reset: function ()
        {
            // Remove all server settings and refresh in-memory from .json file

            // Read the views from the .json file
            ctrlDashboard.ViewConfiguration = ctrlDashboard.ReadViewConfigurationFromJSONFiles();

            ctrlDashboard.ViewManagerModal.PopulateListOfViews(ctrlDashboard.ViewConfiguration.Default);
            return false;
        },

        // New function to manage a collection of views
        Manage: function()
        {
            // var bReset = ctrlDashboard.ViewManagerModal.Reset();
            var parametersObject = new TriSysApex.UI.ShowMessageParameters();
            parametersObject.Title = "Manage Dashboards";
            parametersObject.Image = "gi-more_windows"
            parametersObject.FullScreen = true;

            parametersObject.ContentURL = TriSysApex.Constants.UserControlFolder + "dashboard/ctrlManageCollections.html";

            parametersObject.ButtonLeftText = "Select New Default";
            parametersObject.ButtonLeftVisible = true;
            parametersObject.ButtonLeftFunction = function ()
            {
                return ctrlManageCollections.SelectCurrent();
            };

            var bInDev = TriSysApex.Pages.Controller.isDeveloper();
            if (bInDev)
            {
                // Too dangerous - see ASP Customer Manager for how to do this correctly
                //parametersObject.ButtonCentreText = "Publish";
                //parametersObject.ButtonCentreVisible = true;
                //parametersObject.ButtonCentreFunction = function ()
                //{
                //    return ctrlManageCollections.PublishSelected();
                //};
            }

            parametersObject.ButtonRightText = "Close";
            parametersObject.ButtonRightVisible = true;

            TriSysApex.UI.PopupMessage(parametersObject);

            // Do not want dialogue to close
            return false;
        },

        // We do all local processing using in-memory arrays, so this simply pushes these changes
        // up to the cloud API. User does not need any feedback or fuss.
        //
        ApplyChangesAsynchronouslyAndSilentlyToServer: function()
        {
            // Pass our configuration in-memory data structures exactly as we defined it and want to use it.
            // Our Web API can store it as it sees fit!

            // Have to convert the layout to a JSON string as we desire the need to change schema in future
            var viewConfigurationCopy = JSON.parse(JSON.stringify(ctrlDashboard.ViewConfiguration));
            var views = viewConfigurationCopy.Views;
            for (var iView = 0; iView < views.length; iView++)
            {
                var view = views[iView];
                var sLayout = JSON.stringify(view.Layout);
                view.Layout = sLayout;
            }

            var CDashboardWriteRequest = {

                ViewConfiguration: viewConfigurationCopy

            };

            var payloadObject = {};

            payloadObject.URL = "Dashboard/Write";

            payloadObject.OutboundDataPacket = CDashboardWriteRequest;

            payloadObject.InboundDataFunction = function (data)
            {
                var CDashboardWriteResponse = data;

                if (CDashboardWriteResponse)
                {
                    if (CDashboardWriteResponse.Success)
                    {
                        // Confirmation that all is OK and the server has been updated
                    }
                    else
                        TriSysApex.Logging.LogMessage(CDashboardWriteResponse.ErrorMessage);
                }
            };

            payloadObject.ErrorHandlerFunction = function (request, status, error)
            {
                TriSysApex.Logging.LogMessage('ctrlDashboard.ViewManagerModal.ApplyChangesAsynchronouslyAndSilentlyToServer: ' + status + ": " + error + ". responseText: " +request.responseText);
            };

            TriSysAPI.Data.PostToWebAPI(payloadObject);
        }

    },  // ctrlDashboard.ViewManagerModal

    CopyViewModal:        // ctrlDashboard.CopyViewModal
    {
        Show: function ()
        {
            var parametersObject = new TriSysApex.UI.ShowMessageParameters();
            parametersObject.Title = "Copy Dashboard View";
            parametersObject.Image = "fa-plus-square-o"
            parametersObject.Maximize = true;

            parametersObject.ContentURL = TriSysApex.Constants.UserControlFolder + "dashboard/ctrlCopyDashboardView.html";
            parametersObject.ButtonLeftText = "Apply";
            parametersObject.ButtonLeftFunction = function ()
            {
                var bSaved = ctrlDashboard.CopyViewModal.Apply();
                return bSaved;
            };
            parametersObject.ButtonLeftVisible = true;
            parametersObject.ButtonRightText = "Cancel";
            parametersObject.ButtonRightVisible = true;

            TriSysApex.UI.PopupMessage(parametersObject);
        },

        Load: function()
        {
            var selectedView = ctrlDashboard.ViewManagerModal.GetCurrentView();
            $('#dashboard-copy-view-name').val("Copy-of-" + selectedView.Name);
            $('#dashboard-copy-view-caption').val("Copy of " + selectedView.Caption);
        },

        Apply: function()
        {
            var sName = $('#dashboard-copy-view-name').val();
            var sCaption = $('#dashboard-copy-view-caption').val();

            if (!sName || !sCaption)
            {
                TriSysApex.Toasters.Error("Views must have a name and a caption.");
                return false;
            }

            // Strip spaces from name
            sName = sName.replace(/ /g, '');
            sName = sName.replace(/-/g, '');
            sName = sName.replace(/"/g, '');
            sName = sName.replace(/\'/g, '');

            // Check uniqueness
            var duplicateView = ctrlDashboard.ViewManagerModal.GetView(sName);
            if(duplicateView)
            {
                TriSysApex.Toasters.Error("Views must have unique names.");
                return false;
            }

            duplicateView = ctrlDashboard.ViewManagerModal.GetViewByCaption(sCaption);
            if (duplicateView)
            {
                TriSysApex.Toasters.Error("Views must have unique menu captions.");
                return false;
            }

            // Clone current view
            var selectedView = ctrlDashboard.ViewManagerModal.GetCurrentView();
            var newView = JSON.parse(JSON.stringify(selectedView));
            newView.Name = sName;
            newView.Caption = sCaption;
            
            if (newView.Layout)
            {
                // For completeness, switch the GUID's of each item to make it completely unique
                var tiles = newView.Layout.Tiles;
                for (var i = 0; i < tiles.length; i++)
                {
                    var tile = tiles[i];
                    tile.GUID = TriSysSDK.Miscellaneous.GUID();
                }
            }

            // Append to array
            ctrlDashboard.ViewConfiguration.Views.push(newView);
            
            // Refresh the list, highlighting the new view
            ctrlDashboard.ViewManagerModal.PopulateListOfViews(sName);

            return true;
        }

    },  // ctrlDashboard.CopyViewModal

    // This is where we load/save the layouts and tile configurations
    Persistence:
    {
        // This is an array of layouts which are to be persisted on the server
        Layouts: [],

        GetLayoutForView: function(view)
        {
            // Find it in our array
            for (var i = 0; i < ctrlDashboard.Persistence.Layouts.length; i++) 
            {
                var savedLayout = ctrlDashboard.Persistence.Layouts[i];
                if(savedLayout.View.Name == view.Name)
                    return savedLayout;
            }            

            return null;
        },

        // This is called to keep our knowledge of the layout and tiles in sync only when we need it.
        // It is called before saving and also when user configures tiles.
        ReadCurrentViewLayoutIntoMemoryArray: function()
        {
            // Because we do not wish to retain the tile and locations as we do not get drag/drop events,
            // we must enumerate through the DOM now to determine each row, column, block and tile.

            // Enumerate through all rows
            var rows = ctrlDashboard.CurrentView.Layout.Rows;
            for (var iRow = 0; iRow < rows.length; iRow++)
            {
                var row = rows[iRow];
                for (var iColumn = 1; iColumn <= row.Columns; iColumn++)
                {
                    var sColumnBlockID = 'dashboard-block-row-' + (iRow + 1) + '-column-' + iColumn;

                    // Which tiles live in this block?  
                    var tileNameAndGUIDArray = ctrlDashboard.GetTileNamesAndGUIDInRowColumnBlock(sColumnBlockID);
                    if (tileNameAndGUIDArray)
                    {
                        for (var i = 0; i < tileNameAndGUIDArray.length; i++)
                        {
                            var tileItem = tileNameAndGUIDArray[i];
                            var sTileName = tileItem.TileName;
                            var sGUID = tileItem.GUID;

                            // NEW: Get tile by GUID and update location
                            var liveTile = ctrlDashboard.GetTileByGUID(sGUID);

                            if(liveTile)
                            {
                                liveTile.Location = sColumnBlockID;
                                break;
                            }
                        }                        
                    }
                }
            }
        },
        
        // This is the API for tiles which can call it to persist its settings.
        // These are stored as value-pairs: {Setting: '', Value: ''}
        SaveTileSetting: function(sTileID, persistedSetting)
        {
            // Find the tile in the current view layout
            var currentViewLayout = ctrlDashboard.CurrentView.Layout;

            // Tile ID is of the form: var sTileID = 'tile-name-' + tile.Name + '-GUID-' + sGUID;
            var parsedTile = ctrlDashboard.ParseTileID(sTileID);
            if(parsedTile)
            {
                ctrlDashboard.Persistence.ReadCurrentViewLayoutIntoMemoryArray();

                var liveTile = ctrlDashboard.GetTileByGUID(parsedTile.GUID);

                if(liveTile)
                {
                    // Add/update this persisted setting with the tile
                    if (liveTile.PersistedSettings)
                    {
                        // Find existing setting and remove it
                        for (var iSetting = 0; iSetting < liveTile.PersistedSettings.length; iSetting++)
                        {
                            var existingPersistedSetting = liveTile.PersistedSettings[iSetting];
                            if (existingPersistedSetting.Setting == persistedSetting.Setting)
                                liveTile.PersistedSettings.splice(iSetting, 1);
                        }
                    }
                    else
                        liveTile.PersistedSettings = [];

                    liveTile.PersistedSettings.push(persistedSetting);
                }
            }
        },

		// Really fuckwit?
		// You did not allow for multiple mutually exclusive settings per tile?
        SaveTileSettings: function(sTileID, persistedSettings)
        {
			if(persistedSettings)
			{
				persistedSettings.forEach(function(setting)
				{
					ctrlDashboard.Persistence.SaveTileSetting(sTileID, setting);		
				});
			}            
        },

        ApplyPersistedTileSettings: function(tile, sTileID)
        {
            if(tile.PersistedSettings)
            {
                for (var iSetting = 0; iSetting < tile.PersistedSettings.length; iSetting++)
                {
                    var persistedSetting = tile.PersistedSettings[iSetting];
                    switch(persistedSetting.Setting)
                    {
                        case 'Caption':
                            ctrlDashboard.SetCaptionModal.SetTileCaption(sTileID, persistedSetting.Value);
                            break;

                        case 'Colours':
                            ctrlDashboard.SetColoursModal.SetTileColours(sTileID, persistedSetting.Value);
                            break;

                        case ctrlDashboard.ChartOptionsModal.Setting:
                            ctrlDashboard.CallTileLoadedCallback(sTileID, tile.PersistedSettings);
                            break;
                    }
                }
            }
        },

        GetSettingValue: function (persistedSettings, sSetting, sDefault)
        {
            if (persistedSettings)
            {
                for (var i = 0; i < persistedSettings.length; i++)
                {
                    var persistedSetting = persistedSettings[i];
                    if (persistedSetting.Setting == sSetting)
                        return persistedSetting.Value;
                }
            }

            return sDefault;
        }

    },   // ctrlDashboard.Persistence

    // Used by ctrlTop5Pie.js
    PieChartMetric:
    {
        Load: function (sChart, sAPIFunction, sTileID, chartOptions, fnCallbackBeforeChartDisplay)
        {
            if (!sAPIFunction)
            {
                $("#" + sChart).empty();
                $("#" + sChart).html("Unspecified API method");
                return;
            }

            // Jan 2018: Use a dedicated API method which abstracts the underlying SQL and does not use 'SQLDatabase/SQL_Select'
            var fnPopulationByFunction = {
                API: sAPIFunction,                          // The Web API Controller/Function

                DataTableFunction: function (response)      // Called to get a suitable data table for the grid to display
                {
                    if (response.List)
                    {
                        var figures = [];

                        var dt = response.List;
                        for (var i = 0; i < dt.length; i++)
                        {
                            var dr = dt[i];
                            var sMetric = dr["Metric"];
                            var iPercentage = dr["Percentage"];

                            var figure = { Metric: sMetric, Percentage: iPercentage };
                            figures.push(figure);
                        }

                        if (fnCallbackBeforeChartDisplay)
                            fnCallbackBeforeChartDisplay(figures);

                        ctrlDashboard.PieChartMetric.DrawChart(sChart, figures, sTileID, chartOptions);
                    }
                    else
                    {
                        // Error
                        $("#" + sChart).empty();
                        $("#" + sChart).html(response.ErrorMessage);
                    }
                }
            };

            TriSysSDK.Database.GetDataSetFromFunction(fnPopulationByFunction);
        },

        // Expect top 5 and we add a 6th for 'Other' if necessary
        DrawChart: function (sChart, figures, sTileID, chartOptions)
        {
            var colors = [TriSysProUI.NavBarInverseColour(),
                            TriSysProUI.BackColour(),
                            TriSysProUI.ThemedSidebarBackgroundLight(0.25),
                            TriSysProUI.LightenColour(TriSysProUI.BackColour(), 0.25),
                            TriSysProUI.LightenColour(TriSysProUI.NavBarInverseColour(), 0.15)];

            var otherColor = TriSysProUI.LightenColour(TriSysProUI.ThemedSidebarBackgroundLight(0.25), 0.25);

            if (!chartOptions)
            {
                // Set defaults
                chartOptions = {
                    LabelsVisible: false,
                    LabelsPosition: 'center',
                    LegendVisible: true,
                    LegendPosition: 'bottom'
                };
            }

            // Convert into series data with colours
            var seriesData = [];
            var seriesColors = [];

            // Calculate 'Other'
            var iTotalPercentage = 0.0;
            for (var i = 0; i < figures.length; i++)
            {
                var figure = figures[i];
                iTotalPercentage += figure.Percentage;
                figure.Colour = colors[i];
            }

            var iOther = 100.00 - iTotalPercentage;

            // Only add other if it is > 0.1 %
            if (iOther >= 0.1)
            {
                colors.push(otherColor);
                var figureOther = { Metric: "Other", Percentage: iOther, Colour: colors[5] };
                figures.push(figureOther);
            }


            // Create series colours and data
            for (var i = 0; i < figures.length; i++)
            {
                var figure = figures[i];

                seriesColors.push(figure.Colour);
                var data = {
                    category: figure.Metric,
                    value: figure.Percentage
                };
                seriesData.push(data);
            }

            // Height
            var lHeight = 500;
            if (chartOptions.Height > 0)
                lHeight = chartOptions.Height;

            // Clear leftovers
            $("#" + sChart).empty(); 

            // Draw chart
            $("#" + sChart).kendoChart({
                //title: {
                //    text: "Permanent Salary Package"
                //},
                legend: {
                    position: chartOptions.LegendPosition,
                    labels: { font: TriSysSDK.KendoUICharts.Font },
                    visible: chartOptions.LegendVisible
                },
                chartArea: {
                    height: lHeight
                },
                seriesDefaults: {
                    labels: {
                        template: "#= category # - #= kendo.format('{0:P}', percentage)#",
                        position: chartOptions.LabelsPosition,
                        visible: chartOptions.LabelsVisible,
                        background: "transparent",
                        font: TriSysSDK.KendoUICharts.Font
                    }
                },
                seriesColors: seriesColors,
                series: [{
                    type: "pie",
                    data: seriesData
                }],
                tooltip: {
                    visible: true,
                    template: '<span style="color:white;">#= category # - #= kendo.format("{0:P}", percentage) #</span>'
                }
            });

        }
    }

};  // ctrlDashboard



// **********
// LIVE TILES
// **********

// This has been added here because it is used by more than 1 live tile.
var Consultant12MonthActivity =
{
    GetUserDataFromWebAPI: function(fnCallback, sPrefix, bCurrentYear)
    {
        var userCredentials = TriSysApex.LoginCredentials.UserCredentials();
        var lUserId = userCredentials.LoggedInUser.UserId;

        var CDashboardMetricConsultant12MonthActivityRequest = { UserId: lUserId };
        if (bCurrentYear)
        {
            // 01 Jan this year to 31 Dec this year
            var startDate = moment(new Date).format('YYYY') + '/01/01';
            var endDate = moment(new Date).format('YYYY') + '/12/31';
            CDashboardMetricConsultant12MonthActivityRequest.StartDate = startDate;
            CDashboardMetricConsultant12MonthActivityRequest.EndDate = endDate;
        }

        var payloadObject = {};

        payloadObject.URL = "DashboardMetric/Consultant12MonthActivity";

        payloadObject.OutboundDataPacket = CDashboardMetricConsultant12MonthActivityRequest;

        payloadObject.InboundDataFunction = function (CDashboardMetricsConsultant12MonthActivityResponse)
        {
            TriSysApex.UI.HideWait();

            if (CDashboardMetricsConsultant12MonthActivityResponse)
            {
                if (CDashboardMetricsConsultant12MonthActivityResponse.Success)
                {
                    fnCallback(CDashboardMetricsConsultant12MonthActivityResponse, lUserId, sPrefix);
                }
                else
                    TriSysApex.Logging.LogMessage(CDashboardMetricsConsultant12MonthActivityResponse.ErrorMessage);
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('Consultant12MonthActivity.GetUserDataFromWebAPI: ' +status + ": " + error + ". responseText: " +request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Preparing Data...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    // This is invoked to show dummy data for sparse data for demo purposes only
    RandomActivity: function()
    {
        var activities = [];
        for (var i = 0; i < 12; i++)
        {
            var activity = Consultant12MonthActivity.RandomDataActivity((i+1));

            activities.push(activity);
        }

        var dt = new Date;
        var iLastYear = '' + (dt.getFullYear() - 1);
        var dtDec01LastYear = new Date(iLastYear + '/12/01');
        var december = Consultant12MonthActivity.RandomDataActivity(12, dtDec01LastYear);

        var CDashboardMetricsConsultant12MonthActivityResponse = { Activity: activities, LastDecemberActivity: december };
        return CDashboardMetricsConsultant12MonthActivityResponse;
    },

    // Dummy data option
    RandomDataActivity: function (iMonth, dtStartDate)
    {
        var activity = {};

        activity.NumTasks = TriSysSDK.Miscellaneous.RandomNumber(0, 100);
        activity.NumRequirements = TriSysSDK.Miscellaneous.RandomNumber(10, 199);
        activity.NumPlacements = TriSysSDK.Miscellaneous.RandomNumber(10, 55);

        activity.CandidateCount = TriSysSDK.Miscellaneous.RandomNumber(0, 100);
        activity.ClientSalesCalls = TriSysSDK.Miscellaneous.RandomNumber(10, 90);
        activity.ClientServiceCalls = TriSysSDK.Miscellaneous.RandomNumber(10, 999);

        activity.CandidateNetworkCalls = TriSysSDK.Miscellaneous.RandomNumber(0, 100);
        activity.CandidateUpdateCalls = TriSysSDK.Miscellaneous.RandomNumber(10, 999);
        activity.CandidateVacancyCalls = TriSysSDK.Miscellaneous.RandomNumber(10, 99);

        activity.HeadhuntCalls = TriSysSDK.Miscellaneous.RandomNumber(0, 100);
        activity.MiscellaneousCalls = TriSysSDK.Miscellaneous.RandomNumber(10, 90);
        activity.CVsSent = TriSysSDK.Miscellaneous.RandomNumber(100, 999);

        activity.FaceToFaceInterviews = TriSysSDK.Miscellaneous.RandomNumber(0, 100);
        activity.PermPlacementBackOuts = TriSysSDK.Miscellaneous.RandomNumber(1, 9);
        activity.ContractPlacementBackOuts = TriSysSDK.Miscellaneous.RandomNumber(10, 99);

        activity.ClientMeetings = TriSysSDK.Miscellaneous.RandomNumber(0, 100);
        activity.UserActivities = TriSysSDK.Miscellaneous.RandomNumber(1000, 9999);

        activity.TargetPermPlacementFees = iMonth > 9 ? 2500 : 2000;
        activity.TargetContractPlacementMargin = iMonth > 8 ? 1500 : 1000;;

        activity.TotalPermanentFees = TriSysSDK.Miscellaneous.RandomNumber(1000, (1000 * iMonth));
        activity.TotalContractMargin = TriSysSDK.Miscellaneous.RandomNumber(1000, (1000 * iMonth));

        activity.TotalProfit = activity.TotalPermanentFees + activity.TotalContractMargin;
        activity.NumberOfPlacements = TriSysSDK.Miscellaneous.RandomNumber(1, 49);

        activity.AveragePlacementValue = TriSysSDK.Miscellaneous.RandomNumber(100, 9999);
        activity.TimeToPlacementPerm = TriSysSDK.Miscellaneous.RandomNumber(10, 99);
        activity.TimeToPlacementContract = TriSysSDK.Miscellaneous.RandomNumber(10, 99);
        activity.TimeToPlacementTemp = TriSysSDK.Miscellaneous.RandomNumber(1, 99);

        if (!dtStartDate)
            dtStartDate = new Date;

        activity.StartDate = dtStartDate;
        activity.StartDate = new Date(moment(activity.StartDate).format("YYYY") + '/' + iMonth + '/01');

        // This is way too anal Garry!
        // You overthought this!
        //var dtNow = dtStartDate;
        //if (activity.StartDate > dtNow)
        //{
        //    activity.TotalPermanentFees = 0;
        //    activity.TotalContractMargin = 0;

        //    activity.TotalProfit = 0;
        //    activity.NumberOfPlacements = 0;

        //    activity.AveragePlacementValue = 0;
        //    activity.TimeToPlacementPerm = 0;
        //    activity.TimeToPlacementContract = 0;
        //    activity.TimeToPlacementTemp = 0;
        //}

        return activity;
    }

};



