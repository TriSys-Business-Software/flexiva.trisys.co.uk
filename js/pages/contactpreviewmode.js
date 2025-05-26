// 14 Nov 2022: Allow separate instance of Apex to process contact preview data
//

var ContactPreviewMode =
{
    Title: "TriSys Contact Preview",
    _ContactId: 0,

    Load: function()
    {
        // Start login sequence now that we specified data services key in login.js
        TriSysWeb.Security.AfterRecruiterUserAuthentication();

        // Hide nav bar, toolbar etc..
        document.title = ContactPreviewMode.Title;                    // Overridden by base app
    },

    // Called after we are 'logged-in' in contact preview mode
    PostLogin: function()
    {
        $('#page-wrapper').hide();

        // Show contact preview window full screen
        var lContactId = TriSysApex.EntityPreview.Contact._MostRecentContactId
        var sSearchCriteriaJson = TriSysApex.EntityPreview.Contact._MostRecentSearchCriteriaJson;
        ContactPreviewMode.ShowContact(lContactId, sSearchCriteriaJson, { PostLogin: true});

        // Maximize contact preview widget when it is visible
        var fnMaxy = function () {
            var sID = "Contact-preview";
            var dialog = $("#" + sID).data("kendoWindow");
            if (dialog) {
                dialog.maximize();

                // 31 May 2024: Tweak UI for contact preview mode when in web browser
                if (TriSysApex.EntityPreview.Contact.Data.BrowserExtension)
                    setTimeout(ContactPreviewMode.BrowserExtensionUITweaks, 100);
            }
            else
                setTimeout(fnMaxy, 100);
        }
        setTimeout(fnMaxy, 10);
        return;
    },

    // Called when the contact is fully visible in the browser popup
    ContactLoadedInPreview: function(lContactId)
    {
        // Tell Apex that we are now loaded and they can close the waiting dialogue
        //ContactPreviewMode.SendContactPreviewModeAcknowledgementSignalRMessage(lContactId);

        // Hide some buttons
        $('#ctrlContactPreview-Action').hide();
        $('#ctrlContactPreview-Close').hide();
    },

    ShowContact: function (lContactId, sSearchCriteriaJson, options)         // ContactPreviewMode.ShowContact
    {
        // As we may get called twice, ignore the second request for the same contact
        if (ContactPreviewMode._ContactId == lContactId)
            return;

        ContactPreviewMode._ContactId = lContactId;     // Remember last contact we showed

        // Show contact preview window full screen
        TriSysApex.EntityPreview.Contact.Open(lContactId, sSearchCriteriaJson, options);

        var fnOverrideTitle = function () {

            var sTitle = ContactPreviewMode.Title + ": " + $('#ctrlContactPreview-contactname').text();
            document.title = sTitle;                    
        };
        setTimeout(fnOverrideTitle, 10);        // Works for 2nd, 3rd 4th etc..
        setTimeout(fnOverrideTitle, 2000);      // Has to be done for 1st contact loaded
    },

    ReceiveSignalRMessage: function (lContactId, sSearchCriteriaJson)
    {
        ContactPreviewMode.SendContactPreviewModeAcknowledgementSignalRMessage(lContactId);
        ContactPreviewMode.ShowContact(lContactId, sSearchCriteriaJson);
    },

    // We send this back to Apex when we got the preview contact SignalR request signifying we are still alive
    SendContactPreviewModeAcknowledgementSignalRMessage: function (lContactId)
    {
        // Create a message object
        var msg = { RecordId: lContactId, Type: TriSysApex.SignalR.Communication.MessageType.ContactPreviewAcknowledgement };

        // Convert this to a JSON string
        var sJSON = JSON.stringify(msg);

        // Send it to Apex
        var sRecipientLoginName = null;
        TriSysApex.SignalR.Communication.Send(sRecipientLoginName, sJSON);
    },

    // 30 May 2024: We have received a Socket.IO notification from Web API to tell us that the subscriber
    // using the web browser extension has sent us data that we ought to process.
    BrowserExtensionMessageToSubscriber: function (CSocketIOInstructions)
    {
        // Send to Web API
        var payloadObject = {};
        payloadObject.URL = "WebBrowserExtension/ReadMessageSentToSubscriber";
        payloadObject.OutboundDataPacket = CSocketIOInstructions;       // We simply send this message back to Web API
        payloadObject.InboundDataFunction = function (CReadMessageSentToSubscriberResponse)
        {
            if (CReadMessageSentToSubscriberResponse)
            {
                if (CReadMessageSentToSubscriberResponse.Success)
                    ContactPreviewMode.ProcessExtensionMessage(CReadMessageSentToSubscriberResponse.Message);
                else
                    TriSysApex.UI.errorAlert(CReadMessageSentToSubscriberResponse.ErrorMessage, TriSysWeb.Constants.ApplicationName);
            }

            return true;
        };
        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.ErrorHandlerRedirector('ContactPreviewMode.BrowserExtensionMessageToSubscriber: ', request, status, error);
        };
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    // 30 May 2024: Take action on the message sent to us by the browser extension
    // CMessage defined in E:\Development\Production\TriSys API\TriSys Web API Model\CWebBrowserExtension.vb
    ProcessExtensionMessage: function (CMessage)
    {
        // Prevent browser extension from sending the same message multiple times
        if (ContactPreviewMode.HaveWeJustReceivedThisMessage(CMessage))
            return;

        // What is the action expected of the browser extension by the subscriber?
        switch (CMessage.action)
        {
            case 'selectedText':
                // User has selected some text in the browser and wishes to use it in some way
                TriSysApex.Toasters.Success("Selected Text: " + CMessage.text); 
                // TODO: Do something with the selected text
                break;

            case 'serviceWorkerContext':
                // User is probably viewing a contact profile and wishes us to show the contact and/or update/create the contact
                //TriSysApex.Toasters.Success("Contact Profile: " + ContactPreviewMode.SummariseProfile(CMessage.data.DOM));

                // Depending upon the site, we can carry out any number of actions
                // The default is to lookup the contact in the database and show it in the profile view
                ContactPreviewMode.LookupRecord(CMessage.data.DOM);
                break;
        }
    },

    // Prevent browser extension from sending the same message multiple times
    HaveWeJustReceivedThisMessage: function (CMessage)
    {
        var bMatched = false;
        var dNow = new Date();
        var sJSON = JSON.stringify(CMessage);

        if (ContactPreviewMode._LastMessageReceived.JSON == sJSON)
        {
            if (ContactPreviewMode._LastMessageReceived.timestamp)
            {
                // If 1 second between the last message and this one, we ignore it
                var dLast = new Date(ContactPreviewMode._LastMessageReceived.timestamp);
                var iDiff = dNow - dLast;
                if (iDiff < 1000)
                    bMatched = true;
            }
        }	

        if (!bMatched)
        {
            ContactPreviewMode._LastMessageReceived.timestamp = dNow;
            ContactPreviewMode._LastMessageReceived.JSON = sJSON;
        }

        return bMatched;
    },

    _LastMessageReceived: {
        timestamp: null,
        JSON: null
    },

    SummariseProfile: function (CDOM)
    {
        var sSummary = '';

        const sURL = CDOM.URL;
        const sTitle = CDOM.Title;
        sSummary = sTitle;

        return sSummary;
    },

    // Lookup the contact in the database and show it in the profile view
    LookupRecord: function (CDOM)
    {
        // Send to Web API
        var payloadObject = {};
        payloadObject.URL = "WebBrowserExtension/LookupRecord";
        payloadObject.OutboundDataPacket = CDOM;                    // We use the same fields we were sent
        payloadObject.InboundDataFunction = function (CLookupRecordResponse)
        {
            if (CLookupRecordResponse)
            {
                if (CLookupRecordResponse.Success)
                    ContactPreviewMode.TakeActionAfterLookingUpRecord(CLookupRecordResponse);
                else
                    TriSysApex.UI.errorAlert(CLookupRecordResponse.ErrorMessage, TriSysWeb.Constants.ApplicationName);
            }

            return true;
        };
        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.ErrorHandlerRedirector('ContactPreviewMode.LookupRecord: ', request, status, error);
        };
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    // The Web Browser Extension has looked up the record in the database and has fired this callback
    // We then take appropriate action
    TakeActionAfterLookingUpRecord: function (lookupResults)
    {
        // TODO
        debugger;

        // Close modal form in case it is still open
        TriSysApex.UI.CloseModalPopup();

        if (lookupResults.EntityName && lookupResults.RecordId)
        {
            if (lookupResults.RecordId.length == 1)
            {
                ContactPreviewMode.ShowContact(lookupResults.RecordId[0], null);
                return;
            }
            else if (lookupResults.RecordId.length > 1)
            {
                // Let user choose from a list of contacts

            }
        }

        // BUG: We sometimes get garbage Socket.IO notifications which we send to Apex, but fuck up somewhere
        if (!lookupResults.Fields)
            return;

        // If we are here, we have no records to show but we can use the scraped web page fields to
        // offer the user the chance to create a new contact
        ContactPreviewMode._ContactId = 0;

        // Show contact record using fields from the scraped web page
        const contact = ContactPreviewMode.GenerateContactObjectFromWebPageFields(lookupResults.URL, lookupResults.Fields);
        ctrlContactPreview.DisplayContact(contact);
        ctrlContactPreview.Data.URL = lookupResults.URL;

        // Display blanks for relational records
        const bDoNotCheckBrowserPopup = true;
        ctrlContactPreview.DisplaySecondaryContactDetails({
            Requirements: [],
            Placements: [],
            NotesHistory: [],
            TotalNotesHistoryRecords: 0,
            ScheduledTasks: [],
            TotalScheduledTaskRecords: 0
        }, bDoNotCheckBrowserPopup);

    },

    GenerateContactObjectFromWebPageFields: function (sURL, lstField)
    {
        const contact = {};

        // Write a for loop for lstField    
        if (lstField)
        {
            lstField.forEach(function (field)
            {
                // See https://api.trisys.co.uk/Apex/assets/Browser-Extension-DOM-tags.json
                switch (field.Name)
                {
                    case "linkedin-name":
                        contact.FullName = field.Value;
                        break;

                    case "linkedin-jobTitle":
                        // LinkedIn Caveat where it puts ' at '
                        var parts = field.Value.split(" at ");  
                        if (parts.length >= 1)
                        {
                            contact.JobTitle = parts[0];
                            if (parts.length >= 2)
                                contact.CompanyName = parts[1];
                        }
                        else
                            contact.JobTitle = field.Value;
                        break;

                    case "linkedin-photo":
                        contact.PhotoURL = field.Value;
                        break;

                    case "linkedin-company":
                        contact.CompanyName = field.Value;
                        break;

                    case "linkedin-address":
                        contact.CompanyAddressCity = field.Value;
                        break;

                    case "linkedin-phone1":
                        contact.WorkTelNo = field.Value;
                        break;

                    case "linkedin-email":
                        contact.WorkEMail = field.Value;
                        break;

                }
            });
        }

        return contact;
    },

    // 31 May 2024: Tweak UI for contact preview mode when in web browser
    BrowserExtensionUITweaks: function ()
    {
        const elemSplitter = $('#ctrlContactPreview-splitter');
        elemSplitter.css('border', 0);
        elemSplitter.parent().css('padding', '0px');

        // Trigger reflow/repaint if needed
        // Create a new resize event
        const resizeEvent = new Event('resize');

        // Dispatch the event on the window
        window.dispatchEvent(resizeEvent);
    }


};  // ContactPreviewMode


// Once we are loaded, initialise the control
$(document).ready(function () {
    ContactPreviewMode.Load();
});