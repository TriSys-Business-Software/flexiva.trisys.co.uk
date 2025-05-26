var ctrlContactPreview =
{
    SplitterID: 'ctrlContactPreview-splitter',
    ContactNameID: 'ctrlContactPreview-contactname',

    Load: function ()
    {
        var fnCallback = null;

        var currentWindow = $("#" + ctrlContactPreview.SplitterID).closest("[data-role=window]").getKendoWindow();
        if (currentWindow)
            fnCallback = currentWindow.options.content.callback;

        // Setup splitter
        $("#" + ctrlContactPreview.SplitterID).kendoSplitter({
            orientation: "vertical",
            panes: [
                { collapsible: false, resizable: false, size: "70px" },
                { collapsible: false },
                { collapsible: false, resizable: false, size: "45px" }
            ]
            /*,expand: onExpand,
            collapse: onCollapse,
            contentLoad: onContentLoad,
            resize: onResize*/
        });

        // SUBSCRIBE TO THE "RESIZE" EVENT AFTER INITIALIZATION
        var dialog = $("#" + ctrlContactPreview.SplitterID).closest("[data-role=window]").data("kendoWindow");
        var outerSplitter = $("#" + ctrlContactPreview.SplitterID).data("kendoSplitter");
        var resizeSplitter = function ()
        {
            if (dialog && outerSplitter.wrapper)
            {
                try
                {
                    var iFactor = 320;
                    //var lNewHeight = dialog.height() - 45;
                    var lNewHeight = $("#" + ctrlContactPreview.SplitterID).closest("[data-role=window]").height() - iFactor;
                    //outerSplitter.wrapper.height(lNewHeight);
                    //outerSplitter.resize();

                    $('#contact-details').css("max-height", lNewHeight + "px").height(lNewHeight);
                    $('#cv-preview').css("max-height", lNewHeight + "px").height(lNewHeight);
                    $('#requirements').css("max-height", lNewHeight + "px").height(lNewHeight);
                    $('#placements').css("max-height", lNewHeight + "px").height(lNewHeight);
                    $('#notes').css("max-height", lNewHeight + "px").height(lNewHeight);
                    $('#scheduled').css("max-height", lNewHeight + "px").height(lNewHeight);

                } catch (e)
                {

                }
            }
        };
        resizeSplitter();

        if (currentWindow)
        {
            currentWindow.bind("resize", resizeSplitter);
            currentWindow.bind("close", function ()
            {
                ctrlContactPreview.CurrentContact = null;
                ctrlContactPreview.ContactCache = null;
            });
        }

        
        // The CV preview control
        TriSysApex.FormsManager.loadControlIntoDiv('cv-preview-control', 'ctrlCVPreview.html', function ()
        {
            // Populated on-demand
        });

        // 21 Nov 2024: Availability date control
        TriSysSDK.CShowForm.datePicker('contact-preview-availability-date');

        // Set themes for buttons
        setTimeout(TriSysProUI.kendoUI_Overrides, 100);

        // Call the function which will orchestrate the load of the record
        fnCallback();

        // Hide tabs which are not relevant
        ctrlContactPreview.TabVisibility();
    },

    TabVisibility: function()
    {
        //trisys-contact-preview-div-cv
        var bRecruitmentDatabase = TriSysAPI.Operators.stringToBoolean(TriSysApex.Cache.UserSettingManager.GetValue("RecruitmentDatabase", false));
        if (!bRecruitmentDatabase)
        {
            // Hide recruitment settings
            $('#trisys-contact-preview-div-cv').hide();
            $('#trisys-contact-preview-div-requirements').hide();
            $('#trisys-contact-preview-div-placements').hide();
            $('#ctrlContactPreview-OpenCV').hide();
            $('#contact-preview-availability-date-tr').hide();      // 21 Nov 2024
        }
        
        // 19 Oct 2020
        if (TriSysApex.LoginCredentials.isLoggedInToSpecificCompanyAsRecruiter("Law Absolute"))
        {
            $('#ctrlContactPreview-facebook').hide();
            $('#ctrlContactPreview-twitter').hide();
        }
    },

    // External callback when we are to show this record
    Open: function (lContactId, sSearchCriteriaJson, options)    // ctrlContactPreview.Open
    {
        var contact = ctrlContactPreview.ReadFromCache(lContactId, sSearchCriteriaJson, options);
        if (!contact)
            return;         // Expect that cache will populate after Web API returns

        // Get the lists of current stuff asynchronously
        ctrlContactPreview.CallTriSysWebAPIToReadContactSecondaryDetails(contact.ContactId, sSearchCriteriaJson);

        // 31 May 2024: Centralised function to display contact
        ctrlContactPreview.DisplayContact(contact);

        // 06 Jun 2024: For initial load, tell the browser extension that we are fully loaded
        if (options && options.PostLogin)
            ctrlContactPreview.SendSocketIOMessageToBrowserExtension();
    },

    // 31 May 2024: More granular function to allow web browser extension to call this for new contactc
    DisplayContact: function (contact)    // ctrlContactPreview.DisplayContact
    {
        if (!contact)
            return;

        debugger;

        ctrlContactPreview.CurrentContact = contact;

        // 31 May 2024
        ctrlContactPreview.DisplayContactSavedStatus(contact.ContactId);

        var sCompanyName = '', sStreet = '', sCity = '', sCounty = '', sPostCode = '', sAddressType = 'Home Address';
        var sTelNo = '', sEMail = '';
        if (contact.ContactType == 'Client')
        {
            sCompanyName = contact.CompanyName + '<br />';
            if (contact.CompanyAddressStreet)
            {
                sStreet = contact.CompanyAddressStreet.replace(/\r\n/g, '<br />');
                sStreet = sStreet.replace(/\n/g, '<br />');
            }
            sCity = contact.CompanyAddressCity;
            sCounty = contact.CompanyAddressCounty;
            sPostCode = contact.CompanyAddressPostCode;
            sTelNo = contact.WorkTelNo;
            sEMail = contact.WorkEMail;
            sAddressType = 'Work Address';
        }
        else
        {
            if (contact.HomeAddressStreet)
            {
                sStreet = contact.HomeAddressStreet.replace(/\r\n/g, '<br />');
                sStreet = sStreet.replace(/\n/g, '<br />');
            }
            sCity = contact.HomeAddressCity;
            sCounty = contact.HomeAddressCounty;
            sPostCode = contact.HomeAddressPostCode;
            sTelNo = contact.HomeAddressTelNo;
            sEMail = contact.PersonalEMail;
        }

        // Show contact details. 04 Jun 2024 Hide title as LinkedIn does not show it
        var sContactName = /*(contact.Title ? contact.Title + ' ' : '') + */(contact.FullName ? contact.FullName : '');
        $('#' + ctrlContactPreview.ContactNameID).html(sContactName);

        TriSysSDK.ContactTypes.SetClass('ctrlContactPreview-type', contact.ContactType);

        var sAtCompany = '';
        if (contact.CompanyName)
        {
            var sCompanyHyperlink = '<a href="" onclick="ctrlContactPreview.OpenEntityFormRecord(\'Company\', ' + contact.CompanyId + '); return false;">' + contact.CompanyName + '</a>';
            sAtCompany = " at <b><i>" + sCompanyHyperlink + "</i></b>";
        }

        $('#ctrlContactPreview-jobtitle').html((contact.JobTitle ? contact.JobTitle : '') + sAtCompany);

        ctrlContactPreview.ShowContactPhoto(contact);


        $('#ctrlContactPreview-companyname').html(sCompanyName);

        $('#ctrlContactPreview-addresstype').html(sAddressType);

        if (sCounty)
            sCounty += "<br />";
        if (sPostCode)
            sPostCode += "<br />";

        $('#ctrlContactPreview-street').html(sStreet);
        $('#ctrlContactPreview-city').html(sCity);
        $('#ctrlContactPreview-county').html(sCounty);
        $('#ctrlContactPreview-postcode').html(sPostCode);

        // Was in up to 10 Nov 2015
        //ctrlContactPreview.ReadMapDataFromWebAPI(sPostCode);

        $('#ctrlContactPreview-telno').html(contact.HomeAddressTelNo);

        var sMailTo = (sEMail ? 'mailto:' + sEMail : '');
        $('#ctrlContactPreview-email').attr('href', sMailTo);
        $('#ctrlContactPreview-email').html(sEMail);

        $('#contact-preview-work-email').val(contact.WorkEMail);    // 12 Mar 2024
        $('#contact-preview-work-email-hyperlink').attr('href', 'mailto:' + contact.WorkEMail);

        $('#contact-preview-personal-email').val(contact.PersonalEMail);    // 12 Mar 2024
        $('#contact-preview-personal-email-hyperlink').attr('href', 'mailto:' + contact.PersonalEMail);

        $('#contact-preview-work-telno').val(contact.WorkTelNo);    // 12 Mar 2024
        $('#contact-preview-personal-mobile-telno').val(contact.MobileTelNo);
        $('#contact-preview-work-mobile-telno').val(contact.WorkMobileTelNo);
        $('#contact-preview-home-telno').val(contact.HomeAddressTelNo);

        // 21 Nov 2024
        TriSysSDK.CShowForm.setDatePickerValue('contact-preview-availability-date', contact.AvailabilityDate);

        var sAddressSummary = '';
        if (contact.ContactType == 'Candidate')
        {
            sAddressSummary = contact.HomeAddressCity + (contact.HomeAddressCounty ? ', ' + contact.HomeAddressCounty : '') + (contact.HomeAddressCountry ? ', ' + contact.HomeAddressCountry : '');
        }
        else
        {
            sAddressSummary = contact.CompanyAddressCity + (contact.CompanyAddressCounty ? ', ' + contact.CompanyAddressCounty : '') + (contact.CompanyAddressCountry ? ', ' + contact.CompanyAddressCountry : '');
        }

        if (sAddressSummary)
        {
            sAddressSummary = sAddressSummary.replace("null", "");
            sAddressSummary = sAddressSummary.replace("undefined", "");
        }

        $('#contact-preview-address-summary').html(sAddressSummary ? sAddressSummary : '');

        // 06 Mar 2024
        $('#contact-preview-comments').val(contact.Comments);
    },

    DisplayContactSavedStatus: function (lContactId)
    {
        // 31 May 2024
        if (TriSysApex.EntityPreview.Contact.Data.BrowserExtension)
        {
            var sPrefix = '#contact-preview-record-status-';
            $(sPrefix + 'row').show();
            var sRecordStatus = "Contact " + (lContactId > 0 ? " (" + lContactId + ") exists" : "does not exist") + " in your database";
            var sColour = (lContactId > 0 ? 'green' : 'red');
            $(sPrefix + 'text').text(sRecordStatus).css('color', sColour);
            var sHTML = '<i class="fa fa-' + (lContactId > 0 ? 'check' : 'times') +
                '" style="color: ' + sColour + ';"></i>';
            $(sPrefix + 'icon').html(sHTML);

            // 10 Jun 2024: Only show accordions if the record exists
            var bRecruitmentDatabase = TriSysAPI.Operators.stringToBoolean(TriSysApex.Cache.UserSettingManager.GetValue("RecruitmentDatabase", false));
            var bRecordExists = (lContactId > 0);

            if (bRecruitmentDatabase)
            {
                var elemCVAccordion = $('#trisys-contact-preview-div-cv');
                bRecordExists ? elemCVAccordion.show() : elemCVAccordion.hide();
                var elemRequirementsAccordion = $('#trisys-contact-preview-div-requirements');
                bRecordExists ? elemRequirementsAccordion.show() : elemRequirementsAccordion.hide();
                var elemPlacementsAccordion = $('#trisys-contact-preview-div-placements');
                bRecordExists ? elemPlacementsAccordion.show() : elemPlacementsAccordion.hide();
            }

            var elemNotesHistoryAccordion = $('#trisys-contact-preview-div-noteshistory');
            bRecordExists ? elemNotesHistoryAccordion.show() : elemNotesHistoryAccordion.hide();
            var elemSchedultedTasksAccordion = $('#trisys-contact-preview-div-scheduledtasks');
            bRecordExists ? elemSchedultedTasksAccordion.show() : elemSchedultedTasksAccordion.hide();

            var elemOpenContactButton = $('#ctrlContactPreview-Open');
            bRecordExists ? elemOpenContactButton.show() : elemOpenContactButton.hide();
        }
    },

    ReadFromWebAPI: function (lContactId, sSearchCriteriaJson, options)
    {
        ctrlContactPreview.ShowWaitingInThePhoto(true);

        var CReadContactRequest = { ContactRecord: { ContactId: lContactId } };

        var payloadObject = {};

        payloadObject.URL = "Contacts/ReadContact";

        payloadObject.OutboundDataPacket = CReadContactRequest;

        payloadObject.InboundDataFunction = function (CReadContactResponse)
        {
            ctrlContactPreview.ShowWaitingInThePhoto(false);

            if (CReadContactResponse)
            {
                if (CReadContactResponse.Success)
                {
                    var contact = CReadContactResponse.ContactRecord;

                    // 31 May 2024: BUG. We incorrectly read contacts which do not match as existing!
                    const bContactExists = true;    // (contact && contact.ContactId > 0 && contact.FullName);

                    if (bContactExists)
                    {
                        // Write to cache and display
                        ctrlContactPreview.AddToCache(contact);
                        ctrlContactPreview.Open(contact.ContactId, sSearchCriteriaJson, options);
                    }

                    return;
                }
                else
                    TriSysApex.UI.ShowMessage(CReadContactResponse.ErrorMessage);
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.errorAlert('ctrlContactPreview.ReadFromWebAPI: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    // Code lifted form the web browser extension.
    // Called after the first call returns to get the larger secondary details such as CV preview,
    // requirements, placements, notes and scheduled tasks.
    // This data is used only by the popup window, but by pre-cacheing it, it seems very quick for the
    // user who is typically clicking the toolbar button AFTER the page has loaded.
    CallTriSysWebAPIToReadContactSecondaryDetails: function (lContactId, sJson)
    {
        var CReadContactSummaryForExtensionRequest = {
            ContactId: lContactId,

            SearchTreeJson: sJson       // Sep 2020
        };

        var payloadObject = {};

        payloadObject.URL = "Contacts/ReadContactSummaryForExtension";

        payloadObject.OutboundDataPacket = CReadContactSummaryForExtensionRequest;

        payloadObject.InboundDataFunction = function (CReadContactSummaryForExtensionResponse)
        {
            if (CReadContactSummaryForExtensionResponse)
            {
                var contactSummaryDetails = {};

                if (CReadContactSummaryForExtensionResponse.Success)
                {
                    contactSummaryDetails = CReadContactSummaryForExtensionResponse;
                }

                // Display these additional details also
                ctrlContactPreview.DisplaySecondaryContactDetails(contactSummaryDetails);
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.errorAlert('ctrlContactPreview.CallTriSysWebAPIToReadContactSecondaryDetails: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    // If we have already stored this contact in our cache, then simply get the details here
    ReadFromCache: function (lContactId, sSearchCriteriaJson, options)
    {
        if (lContactId <= 0)
        {
            // No point in reading the database
            ctrlContactPreview.ShowWaitingInThePhoto(false);
            return;
        }

        if (ctrlContactPreview.ContactCache)
        {
            for (var i = 0; i < ctrlContactPreview.ContactCache.length; i++)
            {
                var contact = ctrlContactPreview.ContactCache[i];
                if (contact.ContactId == lContactId)
                    return contact;
            }
        }

        // Did not find in cache, so get this fresh from the Web API
        ctrlContactPreview.ReadFromWebAPI(lContactId, sSearchCriteriaJson, options);

        // Return null to caller as nothing to display yet
        return null;
    },

    // 13 Mar 2024: After updating the contact, remove it from Cache
    RemoveFromCache: function (lContactId)      // ctrlContactPreview.RemoveFromCache
    {
        if (ctrlContactPreview.ContactCache)
        {
            for (var i = ctrlContactPreview.ContactCache.length - 1; i >= 0; i--)
            {
                var contact = ctrlContactPreview.ContactCache[i];
                if (contact.ContactId == lContactId)
                    ctrlContactPreview.ContactCache.splice(i, 1);
            }
        }
    },

    // Add this contact to our cache to provide ultra-slick preview of candidates
    AddToCache: function (contact)
    {
        if (!ctrlContactPreview.ContactCache)
            ctrlContactPreview.ContactCache = [];

        // 31 May 2024: We do not use the cache when we are the browser extension as data is very dynamic
        if (TriSysApex.EntityPreview.Contact.Data.BrowserExtension)
        {
            // BUG: Our code expects that the contact is always added to the cache
            // DO we need to fool it by only adding the last contact to it
            ctrlContactPreview.ContactCache = [];
        }

        ctrlContactPreview.ContactCache.push(contact);
    },

    ContactCache: null,
    CurrentContact: null,

    Social: function(sNetwork)
    {
        if (!ctrlContactPreview.CurrentContact)
            return;

        var eSocialNetwork = TriSysSDK.SocialNetworks.LinkedIn;
        switch (sNetwork)
        {
            case 'facebook':
                eSocialNetwork = TriSysSDK.SocialNetworks.Facebook;
                break;
            case 'twitter':
                eSocialNetwork = TriSysSDK.SocialNetworks.Twitter;
                break;
        };

        TriSysSDK.SocialNetworks.OpenSocialNetworkProfile(eSocialNetwork, ctrlContactPreview.CurrentContact.ContactId);
    },

    ShowContactPhoto: function (contact)
    {
        var sID = '#ctrlContactPreview-contactphoto';
        var sURL = TriSysApex.Constants.DefaultContactGreyImage;

        if (contact.PhotoURL)
            sURL = contact.PhotoURL;        // Cached photo URL

        else if (contact.ContactPhoto)
        {
            // This is a g:\ reference, so do a round trip to display the photo
            var fnShowExistingPhoto = function (sFileURL)
            {
                contact.PhotoURL = sFileURL;        // Cache for later if needed
                $(sID).attr('src', sFileURL);
            };

            TriSysSDK.Controls.FileManager.GetFileReferenceServerFilePathToExternalFilePath(contact.ContactPhoto, fnShowExistingPhoto);
            return;
        }

        $(sID).attr('src', sURL);
    },

    // 13 Mar 2024: Use the contact photo to show the spinner
    ShowWaitingInThePhoto: function (bShow)         // ctrlContactPreview.ShowWaitingInThePhoto
    {
        var sID = '#ctrlContactPreview-contactphoto';
        //var sURL = bShow ? 'images/wait-spinner.gif' : TriSysApex.Constants.DefaultContactGreyImage;
        var sURL = bShow ? 'https://apex.trisys.co.uk/images/Spinner-1s-extension-65px.gif' : TriSysApex.Constants.DefaultContactGreyImage;

        $(sID).attr('src', sURL);
    },

    OpenContact: function()
    {
        debugger;
        if(ctrlContactPreview.CurrentContact)
        {
            // 14 Nov 2022: We have 2 modes for this dialogue
            var bWeAreTheRemoteBrowserPopup = (typeof ContactPreviewMode !== TriSysApex.Constants.Undefined);
            if (bWeAreTheRemoteBrowserPopup)
            {
                // 31 May 2024: If this is not yet a contact, but only scraped from the web, then show the photo
                if (!ctrlContactPreview.CurrentContact.ContactId || ctrlContactPreview.CurrentContact.ContactId == 0)
                {
                    // Open the photo if it was extracted from LinkedIn
                    debugger;
                    var sPhotoURL = ctrlContactPreview.CurrentContact.PhotoURL;
                    if (sPhotoURL)
                        TriSysApex.Pages.FileManagerForm.OpenDocumentViewer(sPhotoURL, ctrlContactPreview.CurrentContact.FullName, 'image');
                    return;
                }

                // Send a SignalR to Apex/TriSys
                TriSysApex.EntityPreview.Contact.SendContactPreviewModeSignalRMessage(ctrlContactPreview.CurrentContact.ContactId, TriSysApex.SignalR.Communication.MessageType.OpenEntityRecord);
            }
            else
            {
                // Open the contact record
                TriSysApex.FormsManager.OpenForm("Contact", ctrlContactPreview.CurrentContact.ContactId);

                // Close me as I am presumably not needed anymore?
                TriSysApex.EntityPreview.CloseWindow('Contact');
            }
        }
    },

    OpenCV: function ()
    {
        if (ctrlContactPreview.CurrentContact)
        {
            // Open the contact CV if it exists

            if (ctrlContactPreview.CurrentContact.CVFileRef)
            {
                // 14 Nov 2022: We have 2 modes for this dialogue
                var bWeAreTheRemoteBrowserPopup = (typeof ContactPreviewMode !== TriSysApex.Constants.Undefined);
                if (bWeAreTheRemoteBrowserPopup) {
                    // Send a SignalR to Apex/TriSys
                    TriSysApex.EntityPreview.Contact.SendContactPreviewModeSignalRMessage(ctrlContactPreview.CurrentContact.ContactId, TriSysApex.SignalR.Communication.MessageType.OpenCV);
                }
                else {
                    // Sep 2018 and we have live editing of word documents!
                    TriSysApex.Pages.FileManagerForm.FileOpenDrillDown(ctrlContactPreview.CurrentContact.CVFileRef);
                    // Get a URL of this file which we can view via an asynchronous call
                    //TriSysSDK.Controls.FileManager.GetOpenFileURLFromWebService("TriSys CV Viewer", ctrlContactPreview.CurrentContact.CVFileRef, ctrlContactPreview.CurrentContact.FullName + " CV");
                }
            }
        }
    },

    // Popup a list of pertinent actions.
    // Why not a drop down menu? Because the splitters prevent it!
    Actions: function()
    {
        var fnCallbackRunAction = function (actionID)
        {
            // Run the action
            var action = TriSysActions.Data.Action(actionID);
            if(action)
            {
                TriSysActions.Invocation.InvokedActionID = action.ID;

                // Gather the data 'in-context'
                TriSysActions.Data.RecordIdentifierList = [ctrlContactPreview.CurrentContact.ContactId];
                TriSysActions.Data.EntityName = 'Contact';

                // Master entity details
                TriSysActions.Data.MasterEntityName = null;
                TriSysActions.Data.MasterEntityId = 0;

                // Open the dialogue
                TriSysActions.Invocation.OpenActionForm(action);
            }
        };

        var ignoreActions = TriSysApex.Constants.ContactPreviewIgnoreActions;

        TriSysActions.Menus.Popup("Contact", fnCallbackRunAction, ignoreActions);
    },

    ReadMapDataFromWebAPI: function(sPostCode)
    {
        if (!sPostCode)
        {
            ctrlContactPreview.DrawMap(null);
            return;
        }

        if (ctrlContactPreview.CurrentContact.MapData)
        {
            ctrlContactPreview.DrawMap(ctrlContactPreview.CurrentContact.MapData);
            return;
        };

        var CAddressPostCodeMapDataRequest = {
            PostCode: sPostCode
        };

        var payloadObject = {};
        payloadObject.URL = "Address/MapData";
        payloadObject.OutboundDataPacket = CAddressPostCodeMapDataRequest;
        payloadObject.InboundDataFunction = function (CAddressPostCodeMapDataResponse)
        {
            if (CAddressPostCodeMapDataResponse)
            {
                if (CAddressPostCodeMapDataResponse.Success)
                {
                    ctrlContactPreview.CurrentContact.MapData = CAddressPostCodeMapDataResponse;
                    ctrlContactPreview.DrawMap(ctrlContactPreview.CurrentContact.MapData);
                }
                else
                    TriSysApex.UI.errorAlert(CAddressPostCodeMapDataResponse.ErrorMessage, TriSysWeb.Constants.ApplicationName);
            }

            return true;
        };
        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.ErrorHandlerRedirector('ctrlContactPreview.ReadMapDataFromWebAPI: ', request, status, error);
        };
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    DrawMap: function(mapData)
    {
        var sDiv = 'ctrlContactPreview-map';
        var mapDiv = $('#' + sDiv);
        if (!mapData)
            mapDiv.hide();
        else
        {
            // Calculate centre of the map
            var iWest = 0, iEast = 0, iNorth = 0, iSouth = 0;
            if (mapData.Latitude !== 0 && mapData.Longitude !== 0)
            {
                if (iWest === 0 || iWest > mapData.Latitude)
                    iWest = mapData.Latitude;
                if (iEast === 0 || iEast < mapData.Latitude)
                    iEast = mapData.Latitude;
                if (iNorth === 0 || iNorth > mapData.Longitude)
                    iNorth = mapData.Longitude;
                if (iSouth === 0 || iSouth < mapData.Longitude)
                    iSouth = mapData.Longitude;
            }

            var iLatitude = (iWest + iEast) / 2;
            var iLongitude = (iNorth + iSouth) / 2;

            var centrePosition = null;
            try
            {
                centrePosition = new google.maps.LatLng(iLatitude, iLongitude);
            }
            catch (err)
            {
                TriSysApex.UI.ShowError(err, "Google Maps Error");
                return;
            }

            // Create the map object
            var mapOptions = {
                center: centrePosition,
                zoom: 7        // 13 is best for close-up, 7 for a country view
            };

            var mapObject = new google.maps.Map(document.getElementById(sDiv), mapOptions);

            // Add single marker
            var markerPosition = new google.maps.LatLng(mapData.Latitude, mapData.Longitude);

            var sTitle = mapData.PostCode;
            var marker = new google.maps.Marker({
                position: markerPosition,
                map: mapObject,
                title: sTitle
            });
            
            mapDiv.show();
        }
    },

    DisplaySecondaryContactDetails: function (contactDetails, bDoNotCheckBrowserPopup)
    {
        ctrlCVPreview.Open(contactDetails.CVurl);
        var fZoomFactor = 0.95;
        ctrlCVPreview.Zoom(fZoomFactor, 800);

        ctrlContactPreview.DisplayRequirements(contactDetails.Requirements);
        ctrlContactPreview.DisplayPlacements(contactDetails.Placements);
        ctrlContactPreview.DisplayTasks(contactDetails.NotesHistory, contactDetails.TotalNotesHistoryRecords, 'trisys-noteshistory-tbody', 'trisys-noteshistory-more');
        ctrlContactPreview.DisplayTasks(contactDetails.ScheduledTasks, contactDetails.TotalScheduledTaskRecords, 'trisys-scheduledtasks-tbody', 'trisys-scheduledtasks-more');

        // 31 May 2024;
        if (bDoNotCheckBrowserPopup)
            return;

        // 16 Nov 2022: Send a SignalR to popup browser contact preview that we are now displayed
        var bWeAreTheRemoteBrowserPopup = (typeof ContactPreviewMode !== TriSysApex.Constants.Undefined);
        if(bWeAreTheRemoteBrowserPopup)
        {
            // Tell browser popup that we are now loaded and they can do any finishing touches
            ContactPreviewMode.ContactLoadedInPreview(contactDetails.ContactId);
        }
    },

    DisplayRequirements: function(requirements)
    {
        // Old debug
        //$('#trisys-requirements').html(JSON.stringify(requirements));

        var tbody = $('.trisys-requirements-tbody');

        // New transparency
        if (!requirements || requirements.length == 0)
        {
            tbody.hide();
            return;
        }

        var requirementsData = [];
        for (var i = 0; i < requirements.length; i++)
        {
            var requirement = requirements[i];

            // Take a copy so that we can modify some display fields
            var requirementObject = JSON.parse(JSON.stringify(requirement));

            requirementObject.EarliestStartDate = moment(requirement.EarliestStartDate).format('dddd DD MMMM YYYY');

            requirementsData.push(requirementObject);
        }

        var directives =
        {
            hyperlink:
            {
                onclick: function (params)
                {
                    return "ctrlContactPreview.OpenEntityFormRecord('Requirement', " + this.RequirementId + ")";
                }
            }
        };

        tbody.render(requirementsData, directives);
        tbody.show();
    },

    DisplayPlacements: function (placements)
    {
        // Debug
        //$('#trisys-placements').html(JSON.stringify(placements));

        var tbody = $('.trisys-placements-tbody');
        if (!placements || placements.length == 0)
        {
            tbody.hide();
            return;
        }

        var placementsData = [];
        for (var i = 0; i < placements.length; i++)
        {
            var placement = placements[i];

            // Take a copy so that we can modify some display fields
            var placementObject = JSON.parse(JSON.stringify(placement));

            placementObject.StartDate = moment(placement.StartDate).format('dddd DD MMMM YYYY');

            placementsData.push(placementObject);
        }

        var directives =
        {
            hyperlink:
            {
                onclick: function (params)
                {
                    return "ctrlContactPreview.OpenEntityFormRecord('Placement', " + this.PlacementId + ")";

                }
            }
        };

        tbody.render(placementsData, directives);
        tbody.show();
    },

    DisplayTasks: function (tasks, iTotalTasks, sTableID, sMoreIDPrefix)
    {
        // Debug
        //$('#trisys-noteshistory').html(JSON.stringify(tasks));

        var sHyperLink = sMoreIDPrefix + '-hyperlink';
        if (!tasks || tasks.length == 0)
        {
            $('.' + sTableID).hide();
            $('#' + sHyperLink).hide();
            return;
        }

        var taskData = [];
        for (var i = 0; i < tasks.length; i++)
        {
            var task = tasks[i];

            // Take a copy so that we can modify some display fields
            var taskObject = JSON.parse(JSON.stringify(task));

            taskObject.StartDate = moment(task.StartDate).format('dddd DD MMMM YYYY');
            taskObject.TaskTypeText = task.TaskType;

            taskData.push(taskObject);
        }

        var directives =
        {
            hyperlink:
            {
                onclick: function (params)
                {
                    return "ctrlContactPreview.OpenEntityFormRecord('Task', " + this.TaskId + ")";
                }
            },

            TaskType:
            {
                src: function(params)
                {
                    return "images/trisys/16x16/tasktype/" + this.TaskType + ".png";
                }
            }
        };

        $('.' + sTableID).render(taskData, directives);
        $('.' + sTableID).show();

        var iTotalRemaining = iTotalTasks - taskData.length;
        
        var sCountText = sMoreIDPrefix + '-text';

        if (iTotalRemaining > 0)
        {
            $('#' + sCountText).html("Click to view " + iTotalRemaining + " additional tasks");
            $('#' + sHyperLink).show();
        }
        else
        {
            $('#' + sHyperLink).hide();
        }
    },

    ViewNoteHistoryTasks: function()
    {
        // TODO
        ctrlContactPreview.OpenContact();
    },

    ViewScheduledTasks: function()
    {
        // TODO
        ctrlContactPreview.OpenContact();
    },

    // 15 Nov 2022: The contact preview mode means we must know whether to open a record locally, or via SignalR
    OpenEntityFormRecord: function(sEntityName, lRecordId, bOnlyOpenIfRemoteApp)
    {
        if (!sEntityName || !lRecordId)
            return;

        var bWeAreTheRemoteBrowserPopup = (typeof ContactPreviewMode !== TriSysApex.Constants.Undefined);
        if (bWeAreTheRemoteBrowserPopup)
        {
            // SignalR call
            var bOnlyOpenEntityRecordIfAlreadyLoaded = true;
            TriSysApex.EntityPreview.SendEntityPreviewModeSignalRMessage(sEntityName, lRecordId, bOnlyOpenEntityRecordIfAlreadyLoaded);
        }
        else if (!bOnlyOpenIfRemoteApp)
        {
            switch(sEntityName)
            {
                case "Task":
                    TriSysApex.ModalDialogue.Task.QuickShow(lRecordId);
                    break;

                default:
                    TriSysApex.FormsManager.OpenForm(sEntityName, lRecordId);
                    break;            
            }            
        }
    },

    ViewComments: function ()
    {
        var txt = $('#contact-preview-comments');
        var sComments = txt.val();

        var fnEditedComments = function (sText) {
            txt.val(sText);     // 12 Mar 2024: Enabled!
            return true;
        };

        var options = {
            Label: "Comments",
            Value: sComments,
            ReadOnly: false     // 12 Mar 2024: Editing allowed
        };
        TriSysApex.ModalDialogue.BigEdit.Popup("Edit Contact " + options.Label, "gi-pen", fnEditedComments, options);
    },

    // 12 Mar 2024: Customers want to edit these details
    SaveContactDetails: function(bConfirmed)
    {
        // Gather changes
        var txt = $('#contact-preview-comments');
        var sComments = txt.val();

        var sWorkEMail = $('#contact-preview-work-email').val();
        if (sWorkEMail) sWorkEMail = sWorkEMail.trim();

        var sPersonalEMail = $('#contact-preview-personal-email').val();
        if (sPersonalEMail) sPersonalEMail = sPersonalEMail.trim();

        var sWorkTelNo = $('#contact-preview-work-telno').val();
        if (sWorkTelNo) sWorkTelNo = sWorkTelNo.trim();

        var sPersonalMobile = $('#contact-preview-personal-mobile-telno').val();
        if (sPersonalMobile) sPersonalMobile = sPersonalMobile.trim();

        var sWorkMobile = $('#contact-preview-work-mobile-telno').val();
        if (sWorkMobile) sWorkMobile = sWorkMobile.trim();

        var sHomeTelNo = $('#contact-preview-home-telno').val();
        if (sHomeTelNo) sHomeTelNo = sHomeTelNo.trim();

        // 21 Nov 2024
        var dtAvailabilityDate = TriSysSDK.CShowForm.getDatePickerValue('contact-preview-availability-date');

        // Send to Web API
        var CWriteContactPreviewDataRequest = {
            ContactId: ctrlContactPreview.CurrentContact.ContactId,
            Comments: sComments,
            WorkEMail: sWorkEMail,
            PrivateEMail: sPersonalEMail,
            WorkTelNo: sWorkTelNo,
            MobileTelNo: sPersonalMobile,
            WorkMobileTelNo: sWorkMobile,
            HomeTelNo: sHomeTelNo,
            AvailabilityDate: dtAvailabilityDate
        };

        // 01 Jun 2024: New Web Browser Extension for new contacts
        var sCompany = '';
        if (TriSysApex.EntityPreview.Contact.Data.BrowserExtension)
        {
            CWriteContactPreviewDataRequest.FullName = $('#ctrlContactPreview-contactname').text();
            CWriteContactPreviewDataRequest.JobTitle = $('#ctrlContactPreview-jobtitle').text();
            CWriteContactPreviewDataRequest.PhotoURL = $('#ctrlContactPreview-contactphoto').attr('src');

            // TODO: What if not LinkedIn?
            CWriteContactPreviewDataRequest.LinkedIn = ctrlContactPreview.Data.URL;

            // Parse out the company name which LinkedIn adds
            var sJobTitle = CWriteContactPreviewDataRequest.JobTitle;
            if (sJobTitle)
            {
                var parts = sJobTitle.split(" at ");
                if (parts.length > 1)
                {
                    CWriteContactPreviewDataRequest.JobTitle = parts[0];
                    sCompany = parts[1];                   

                    // Do some work to prevent people appending shit to their company name
                    if (sCompany)
                    {
                        var parts = sCompany.split('|');
                        if (parts.length > 1)
                            sCompany = parts[0];
                    }

                    CWriteContactPreviewDataRequest.CompanyName = sCompany;
                }
            }
        }

        // 01 Jun 2024: If this is a new contact, then we need to confirm that we are saving it
        if (!bConfirmed && !ctrlContactPreview.CurrentContact.ContactId)
        {
            // Popup a confirmation dialogue requesting that the user confirms the title, name, job title, company, contact type
            // Then when confirmed, update the on-screen data and call this function again with bConfirmed = true

            var fnOnSave = function (lCompanyId, contact, lAddressId, bEditAfterSave)
            {
                // 04 Jun 2024: After saving the new contact
                var options = {
                    Callback: function (lContactId, contact)
                    {
                        debugger;

                        // We have saved the contact, so update the contact ID
                        contact.ContactId = lContactId;
                        ctrlContactPreview.DisplayContactAfterCreation(contact);

                        // We should also now link this social network profile e.g. LinkedIn
                        // TODO

                        if (bEditAfterSave)
                        {
                            // Finally open the contact record in Apex for the user to view their full details
                            ctrlContactPreview.OpenContactFormAndFocusOnTab(lContactId, true);
                        }
                    }
                };

                if (lCompanyId > 0)
                {
                    // Same workflow as adding a company contact
                    TriSysApex.Pages.CompanyForm.SubmitNewCompanyContact(lCompanyId, contact, lAddressId, bEditAfterSave, options);
                }
                else
                {
                    // No company selected, so save the candidate or indeed a client with a new or existing company
                    // Validation first
                    var sContactType = TriSysSDK.CShowForm.GetTextFromCombo('newCompanyContact-Type');
                    var sCompanyName = $('#newCompanyContact-Company').val();
                    if (!sCompanyName && sContactType == "Client")
                    {
                        TriSysApex.UI.ShowMessage("Please select or enter a company name.");
                        return;
                    }

                    // We should have gather all of the on-screen fields from ctrlNewCompanyContact.html
                    // So do some last minute validation
                    var lstError = [];
                    if (contact.Title == "(None)")
                        lstError.push('Title');
                    if (contact.Gender == "Unknown")
                        lstError.push('Gender');
                    if (!contact.JobTitle)
                        lstError.push('Job Title');
                    if (!contact.Forenames)
                        lstError.push('Forename(s)');
                    if (!contact.Surname)
                        lstError.push('Surname');

                    if (lstError.length > 0)
                    {
                        TriSysApex.UI.ShowMessage("Please complete the following mandatory fields:<br><br>" + lstError.join("<br>"));
                        return;
                    }

                    // Do some work to prevent people appending shit to their company name
                    if (sCompanyName)
                    {
                        var parts = sCompanyName.split('|');
                        if (parts.length > 1)
                            sCompanyName = parts[0];
                    }


                    // Coerce into fields expected by this legacy function
                    contact.FullName = contact.Forenames + ' ' + contact.Surname;
                    contact.URL = ctrlContactPreview.Data.URL;
                    contact.Company = sCompanyName;
                    contact.Photo = contact.ContactPhotoURL;

                    // Save the candidate using the original extension Web API call
                    ctrlContactPreview.SaveNewContact(contact, bEditAfterSave, options.Callback);
                }
            };

            // Show the confirmation form
            TriSysApex.ModalDialogue.NewCompanyContact.Popup(
                {
                    CompanyId: 0,
                    Company: '',    // sCompany, Do not display company in the header
                    BrowserExtension: TriSysApex.EntityPreview.Contact.Data.BrowserExtension,
                    Contact: CWriteContactPreviewDataRequest
                },
                fnOnSave);
            return;
        }

        var payloadObject = {};
        payloadObject.URL = "Contact/WriteContactPreviewData";
        payloadObject.OutboundDataPacket = CWriteContactPreviewDataRequest;
        payloadObject.InboundDataFunction = function (CWriteUserContactProfileResponse) {
            if (CWriteUserContactProfileResponse) {
                if (CWriteUserContactProfileResponse.Success)
                {
                    TriSysApex.Toasters.Success("Updated " + ctrlContactPreview.CurrentContact.FullName);
                    if (TriSysApex.EntityPreview.Contact.Data.BrowserExtension)
                    {
                        ctrlContactPreview.CurrentContact.ContactId = CWriteUserContactProfileResponse.ContactId;
                        if (CWriteUserContactProfileResponse.ContactId > 0)
                            ctrlContactPreview.DisplayContactSavedStatus(CWriteUserContactProfileResponse.ContactId);
                    }
                }
                else
                    TriSysApex.UI.errorAlert(CWriteUserContactProfileResponse.ErrorMessage, TriSysWeb.Constants.ApplicationName);
            }

            return true;
        };
        payloadObject.ErrorHandlerFunction = function (request, status, error) {
            TriSysApex.UI.ErrorHandlerRedirector('ctrlContactPreview.SaveContactDetails: ', request, status, error);
        };
        TriSysAPI.Data.PostToWebAPI(payloadObject);

        // Re-load contact record if it is loaded
        if(TriSysApex.Pages.ContactForm.ContactId == ctrlContactPreview.CurrentContact.ContactId)
        {
            // Either close this form and re-open it, or update all fields in this form
            $('#Contact_HomeAddressTelNo').val(sHomeTelNo);
            $('#ContactConfigFields_AlternativeEMailAddress1').val(sPersonalEMail);
            $('#Contact_MobileTelNo').val(sPersonalMobile);
            $('#Contact_WorkTelNo').val(sWorkTelNo);
            $('#ContactConfigFields_WorkMobile').val(sWorkMobile);
            $('#Contact_EMail').val(sWorkEMail);
            $('#Contact_Comments').val(sComments);
            TriSysSDK.CShowForm.setDatePickerValue('ContactConfigFields_AvailabilityDate', dtAvailabilityDate);
        }

        // Update cache also
        ctrlContactPreview.RemoveFromCache(ctrlContactPreview.CurrentContact.ContactId);

        // If the contact preview is detached, then we need to raise a SignalR to ourselves to refresh the contact
        var bOnlyOpenIfRemoteApp = true;
        ctrlContactPreview.OpenEntityFormRecord('Contact', ctrlContactPreview.CurrentContact.ContactId, bOnlyOpenIfRemoteApp);
    },

    // 04 Jun 2024: Code lifted from extension.js to allow us to save a new LinkedIn contact
    SaveNewContact: function (contactDetails, bEditAfterSave, fnCallback)
    {
        // Make sure you have all parameters first Garry!
        debugger;

        // Create the contact in the TriSys database

        var payloadObject = {};

        payloadObject.URL = "SocialNetwork/CreateContact";

        payloadObject.OutboundDataPacket = contactDetails;

        payloadObject.InboundDataFunction = function (CSocialNetworkProfileCreateContactResponse)
        {
            //TriSysApex.UI.HideWait();

            if (CSocialNetworkProfileCreateContactResponse)
            {
                if (CSocialNetworkProfileCreateContactResponse.Success)
                {
                    // Close modal form after update
                    TriSysApex.UI.CloseModalPopup();

                    // Contact was created
                    //TriSysApex.Toasters.Information("Added new contact to TriSys");

                    contactDetails.ContactId = CSocialNetworkProfileCreateContactResponse.ContactId;
                    ctrlContactPreview.DisplayContactAfterCreation(contactDetails);

                    if (bEditAfterSave)
                    {
                        // Now open this record in TriSys
                        ctrlContactPreview.OpenContactFormAndFocusOnTab(CSocialNetworkProfileCreateContactResponse.ContactId, true);
                    }

                    return;
                }
                else
                    TriSysApex.UI.ShowMessage(CSocialNetworkProfileCreateContactResponse.ErrorMessage);
            }
            else
                TriSysApex.UI.ShowMessage("Error");
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            //TriSysApex.UI.HideWait();
            TriSysApex.UI.ShowMessage('TriSysExtension.AddNewContact: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysAPI.Data.PostToWebAPI(payloadObject);

    },

    OpenContactFormAndFocusOnTab: function (lContactId)
    {
        // Display this record in TriSys
        TriSysApex.InterprocessCommunication.ClientOpenForm('Contact', lContactId);

        // Make sure Apex is visible
        ctrlContactPreview.FocusOnApexBrowserTab();
    },

    FocusOnApexBrowserTab: function ()
    {
        // Default URL
        var sDefaultURL = 'https://apex.trisys.co.uk/*';

        // The best solution  is to call the Web API to return this for us!
        var payloadObject = {};
        payloadObject.URL = "OfficeAutomation/ActiveTabURL";
        payloadObject.InboundDataFunction = function (CActiveTabURLResponse)
        {
            if (CActiveTabURLResponse)
            {
                if (CActiveTabURLResponse.Success)
                    sDefaultURL = CActiveTabURLResponse.URL;
            }

            var extensionObject = {
                Type: TriSysApex.InterprocessCommunication.MessageType_TriSysToBrowser,
                Instruction: TriSysApex.InterprocessCommunication.ActivateApexTab,
                URL: sDefaultURL
            };

            // This only works in the Chrome Extension because we have access to Chrome/Edge tabs
            // i.e. it does not work for Office Add-Ins because this is operating in a different sandbox with no access to other tabs
            parent.postMessage(extensionObject, '*');
        };
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    DisplayContactAfterCreation: function (contact)     // ctrlContactPreview.DisplayContactAfterCreation
    {
        // Remember this new contact now
        ctrlContactPreview.CurrentContact.ContactId = contact.ContactId;

        // We have saved the contact, so update the contact ID
        ctrlContactPreview.DisplayContactSavedStatus(contact.ContactId);

        // This is a client or client candidate
        TriSysSDK.ContactTypes.SetClass('ctrlContactPreview-type', contact.ContactType);

        // User may have changed the name, job title and company so make it all correct
        var sFullName = contact.Forenames + ' ' + contact.Surname;
        var sContactName = sFullName ? sFullName : '';
        $('#' + ctrlContactPreview.ContactNameID).html(sContactName);

        var sAtCompany = '';
        if (contact.CompanyName)
        {
            var sCompanyHyperlink = '<a href="" onclick="ctrlContactPreview.OpenEntityFormRecord(\'Company\', ' + contact.CompanyId + '); return false;">' + contact.CompanyName + '</a>';
            sAtCompany = " at <b><i>" + sCompanyHyperlink + "</i></b>";
        }

        $('#ctrlContactPreview-jobtitle').html((contact.JobTitle ? contact.JobTitle : '') + sAtCompany);
    },

    // 06 Jun 2024: For initial load, tell the browser extension that we are fully loaded
    // It will then request the DOM for the current page and send it back to us for display
    SendSocketIOMessageToBrowserExtension: function ()
    {
        var extensionObject = {
            Type: TriSysApex.InterprocessCommunication.ApexBrowserExtensionLoaded,
            Instruction: TriSysApex.InterprocessCommunication.ApexBrowserExtensionLoaded
        };

        // THIS DOES NOT FUCKING WORK!!!!
        // This only works in the Chrome Extension because we have access to Chrome/Edge tabs
        // i.e. it does not work for Office Add-Ins because this is operating in a different sandbox with no access to other tabs
        //parent.postMessage(extensionObject, '*');

        // Send a SignalR to myself
        TriSysApex.SignalR.Communication.Send(TriSysApex.SignalR.Communication.FullLoggedInSenderAndRecipientAddress(), JSON.stringify(extensionObject));
    },

    Data:
    {
        URL: null       // ctrlContactPreview.Data.URL - usually LinkedIn
    }

};  // ctrlContactPreview


$(document).ready(function ()
{
    ctrlContactPreview.Load();
});