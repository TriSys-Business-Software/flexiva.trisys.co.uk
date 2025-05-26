// ctrlTaskGridMasterDetail.js
// Created 14 Dec 2023
// Centralised controller for ctrlTaskGridMasterDetail.html which will be
// housed twice on each entity form i.e. up to 10 in total in-memory
//
var ctrlTaskGridMasterDetail =
{
    NativeControlPrefix: 'ctrlTaskGridMasterDetail',

    // Called twice for each entity form to load a task grid and task form in master-detail splitter
    Load: function(options)
    {
        if (!options)
            return;

        // Clear all memories of this specific control
        ctrlTaskGridMasterDetail.Data.Clear(options.ControlID);

        // Options: { EntityName: 'Contact', ControlID: 'some-div-tag', ParentNotesHistoryTabID: 'tab1', ParentScheduledTaskTabID: 'tab2', Scheduled: true }
    
        // TODO: Load grid and ctrlTask.html and rename ID's to be unique
        var sControlID = options.ControlID;

        // If we are already drawn then simply do nowt
        if ($('#' + sControlID).length == 0)
            return;

        // Load the control into the DIV, change the name of all internal DIV tags to be unique and populate
        TriSysApex.FormsManager.loadControlIntoDiv(sControlID, ctrlTaskGridMasterDetail.NativeControlPrefix + '.html',
            function (response, status, xhr) {
                // Set callback after loading into DOM
                ctrlTaskGridMasterDetail.DrawAfterLoad(options);
            });        
    },

    // Kludge: make tab-pane of current active tab active, and make it visible!
    ShowActiveTabKludge: function(options)
    {
        //var sTabID = $('#' + options.ControlID + '-taskForm-tabs').find('li.active a').attr('href');
        var sTabID = $('#' + options.ControlID + '-taskForm-tabs').find('li.active a').parent()[0].id;
        var sMakeActiveID = '#' + sTabID.replace('taskForm-tab', 'task-tabs')
        $(sMakeActiveID).addClass('active').show();

        // ProUI has made all other panels hidden also!
        //$('#' + options.ControlID + '-taskForm-tabs li').each(function () {
        //    var href = $(this).find('a').attr('href');
        //    if (href != sTabID)
        //    {
        //        $(href).show().removeClass('active');
        //    }
        //});
    },

    // Manually change the tab to avoid the bug caused by ProUI tab events
    tabClick: function(thisObject)
    {
        // Traverse up the DOM to locate the control where we are hosted
        var parentLIid = thisObject.parent()[0].id;
        var sControlID = ctrlTaskGridMasterDetail.ControlIDFromForm(null, parentLIid);

        var sTabID = parentLIid;

        // taskForm-tab-description --> #task-tabs-description
        var sMakeActiveID = '#' + sTabID.replace('taskForm-tab', 'task-tabs')

        $('#' + sControlID + '-taskForm-tabs li').each(function () {
            $(this).removeClass('active');            
        });
        $(sTabID).addClass('active').show();

        // Make all tab panes hiddenand inactive
        $('#' + sControlID + ' .tab-pane').hide().removeClass('active');
        $(sMakeActiveID).addClass('active').show();
    },

    // After control is loaded, load sub-components
    DrawAfterLoad: function(options)
    {
        // Create the splitter
        var iFudgeFactor = 305;
        var lHeight = $(window).height() - iFudgeFactor;
        $('#' + ctrlTaskGridMasterDetail.NativeControlPrefix + '-Splitter-vertical').height(lHeight).css('border-radius', '8px');

        $('#grid-pane').height(lHeight);

        $('#' + ctrlTaskGridMasterDetail.NativeControlPrefix + "-Splitter-vertical").kendoSplitter({
            orientation: "vertical",
            panes: [
				{ collapsible: false }
            ]
        });

        var lWidth = $('#grid-pane').width() / 2;
        $('#' + ctrlTaskGridMasterDetail.NativeControlPrefix + "-Splitter-horizontal").kendoSplitter({
            panes: [
				{ collapsible: false, size: lWidth + "px" },
				{ collapsible: false }
            ]
        });

        // Now rename all controls to be uniquely identifiable as there will be multiple versions of us
        // Get all nodes recursively beneath this DIV and change their ID to be unique by prefixing with this DIV name
        //TriSysSDK.Controls.General.ReplaceDivTagsOfDynamicallyLoadedUserControl(options.ControlID);

        // Load the task control
        TriSysApex.FormsManager.loadControlReplacingDiv(ctrlTaskGridMasterDetail.NativeControlPrefix + '-TaskPanel', 'ctrlTaskDetail.html',
            function (response, status, xhr) {
                // Initialise controls

                //// Initialize tabs
                //// Select all <a> elements with an href attribute that starts with "#gaga"
                //$('a[href^="#task-tabs"]').each(function () {
                //    // Get the current href value
                //    var currentHref = $(this).attr('href');

                //    // Replace "#gaga" with "#my-gaga"
                //    var newHref = currentHref.replace(/^#task-tabs/, '#' + options.ControlID + '-task-tabs');

                //    // Set the new href value
                //    $(this).attr('href', newHref);
                //});

                //$('[data-toggle="tabs"] a, .enable-tabs a').click(function (e) { e.preventDefault(); $(this).tab('show'); });

                // Bring life to these controls now. Code lifted from ctrlTask.js
                ctrlTaskGridMasterDetail.LoadTaskFormWidgets(options);

                // Now rename all controls to uniquely identifiable as there will be multiple versions of us too
                TriSysSDK.Controls.General.ReplaceDivTagsOfDynamicallyLoadedUserControl(options.ControlID);

                // This control has to be treated after renaming!
                var sDefaultType = (options.Scheduled ? "ToDo": "Note");
                TriSysActions.Forms.TaskType.Load(options.ControlID + "-taskForm-TaskType", options.ControlID + "-taskForm-selected-TaskType-Image", sDefaultType);

                // Same for this control too
                TriSysSDK.Controls.Duration.Initialise(options.ControlID + '-taskForm-Duration');

                $('#' + options.ControlID + '-taskForm-set-alarm').change(function () {
                    var bSetAlarm = $(this).is(":checked");
                    if (bSetAlarm)
                        $('#' + options.ControlID + '-taskForm-alarm-lead-time-tr').show();
                    else
                        $('#' + options.ControlID + '-taskForm-alarm-lead-time-tr').hide();
                });

                // Attachments
                ctrlTaskGridMasterDetail.LoadDocumentWidgets(options);

                // Record the control ID in the HTML so that we can easily access it
                var sContainer = options.ControlID + '-ctrlTaskGridMasterDetail-Options-ControlID';
                $('#' + sContainer).text(options.ControlID);

                // Make task form fit height constraints
                ctrlTaskGridMasterDetail.AdjustHeights(options.ControlID);

                // Initialize tabs
                // Select all <a> elements with an href attribute that starts with "#gaga"
                $('a[href^="#task-tabs"]').each(function () {
                    // Get the current href value
                    var currentHref = $(this).attr('href');

                    // Replace "#gaga" with "#my-gaga"
                    var newHref = currentHref.replace(/^#task-tabs/, '#' + options.ControlID + '-task-tabs');

                    // Set the new href value
                    $(this).attr('href', newHref);
                });

                $('[data-toggle="tabs"] a, .enable-tabs a').click(function (e) { e.preventDefault(); $(this).tab('show'); });

                var sGridCaption = options.EntityName + ' ' + (options.Scheduled ? 'Scheduled Tasks': 'Notes/History');
                $('#' + options.ControlID + '-task-grid-caption').text(sGridCaption);

                // Now we are drawn, we can finally start loading the grid
                if (options.CallbackFunctionOnLoad)
                    options.CallbackFunctionOnLoad(options);
            });
    },

    AdjustHeights: function(sControlID)
    {
        var elemTaskPane = $('#' + sControlID + '-task-pane');
        var elemTaskTabs = $('#' + sControlID + '-taskForm-tabs');
        var iHeight = elemTaskPane.height() - elemTaskTabs.height() - 130;

        $('#' + sControlID + '-taskForm-Description').height(iHeight - 200);
        $('#' + sControlID + '-taskForm-contacts-list-container').height(iHeight);
        $('#' + sControlID + '-taskForm-users-list-container').height(iHeight);
        $('#' + sControlID + '-taskForm-links-list-container').height(iHeight);
},

    // Called on demand when hosting entity form changes or re-loads record
    // See TriSysApex.Forms.EntityForm.LoadTaskGrid
    Populate: function (options)      // { EntityName: 'Contact', ControlID: 'contact-form-master-detail-notes', RecordId: TriSysApex.Pages.ContactForm.ContactId }
    {
        var bScheduled = options.Scheduled;
        var sGridID = options.ControlID + '-ctrlTaskGridMasterDetail-Grid';

        var fnParameters = function (request) {
            switch(options.EntityName)
            {
                case "Contact":
                    request.ContactId = options.RecordId;
                    break;
                case "Company":
                    request.CompanyId = options.RecordId;
                    break;
                case "Requirement":
                    request.RequirementId = options.RecordId;
                    break;
                case "Placement":
                    request.PlacementId = options.RecordId;
                    break;
                case "Timesheet":
                    request.TimesheetId = options.RecordId;
                    break;
            }
        };

        var fnPostPopulationCallback = null;                // TODO if needed
        var fnDrillDownClickCallback = function (lTaskId)   // Row click event
        {
            ctrlTaskGridMasterDetail.LoadTask(lTaskId, options);
        };

        var gridOptions = {
            DrillDownClickCallback: fnDrillDownClickCallback,
            SingleClickRowHandler: fnDrillDownClickCallback,
            HideOpenButton: options.HideOpenButton
        };

        TriSysApex.Forms.EntityForm.LoadTaskGrid(options.EntityName, sGridID, fnParameters, bScheduled, fnPostPopulationCallback, gridOptions);
    },

    // When we have a widget on the form, find the ControlID above
    ControlIDFromForm: function(sLookAboveID, thisObject)
    {
        var $allSpans = $('span[id$="-Options-ControlID"]');
        var $startElement = sLookAboveID ? $('#' + sLookAboveID) : $(thisObject);
        var $closestSpan = $allSpans.eq(0);
        var closestDistance = Infinity;

        $allSpans.each(function () {
            var distance = $(this).closest($startElement).length;
            if (distance < closestDistance) {
                closestDistance = distance;
                $closestSpan = $(this);
            }
        });

        var text = $closestSpan.text();
        return text;
    },

    // Code lifted from ctrlTask.js
    LoadTaskFormWidgets: function(options)
    {
        // Hack with settings to ensure that we look good on smaller devices
        ctrlTaskGridMasterDetail.ConsiderSmallFormFactors('');  //options.ControlID);

        //var sDefaultType = (options.Scheduled ? "ToDo" : "Note");
        //TriSysActions.Forms.TaskType.Load("taskForm-TaskType", options.ControlID + "-taskForm-selected-TaskType-Image", sDefaultType);

        var fnChangeStartDateTime = function (dtStart) {
            // If after end date/time, then push forward end date/time
            var dtEnd = new Date(TriSysSDK.CShowForm.getDateTimePickerValue('taskForm-EndDateTime'));
            if (dtStart > dtEnd)
                TriSysSDK.CShowForm.setDateTimePickerValue('taskForm-EndDateTime', moment(dtStart).add(0.25, 'hours'));
        };

        var fnChangeEndDateTime = function (dtEnd) {
            // If before start date/time, then push back start date/time
            var dtStart = new Date(TriSysSDK.CShowForm.getDateTimePickerValue('taskForm-StartDateTime'));
            if (dtEnd < dtStart)
                TriSysSDK.CShowForm.setDateTimePickerValue('taskForm-StartDateTime', moment(dtEnd).add(-0.25, 'hours'));
        };

        TriSysSDK.CShowForm.dateTimePicker('taskForm-StartDateTime', fnChangeStartDateTime);
        TriSysSDK.CShowForm.dateTimePicker('taskForm-EndDateTime', fnChangeEndDateTime);

        TriSysSDK.CShowForm.datePicker('taskForm-StartDate');
        TriSysSDK.CShowForm.datePicker('taskForm-EndDate');

        $('#taskForm-all-day-task').change(function () {
            // ID will change before this gets called!
            ctrlTaskGridMasterDetail.AllDayTaskCheckBoxChangeEvent(this, options.ControlID + '-');
        });

        //$('#' + options.ControlID + '-taskForm-scheduled').change(function () {
        //    // We are not a modal so this is not relevant
        //    //ctrlTaskGridMasterDetail.ScheduledTaskCheckBoxChangeEvent(this);
        //});

        // Alarm
        //TriSysSDK.Controls.Duration.Initialise('taskForm-Duration');

        //$('#taskForm-set-alarm').change(function () {
        //    var bSetAlarm = $(this).is(":checked");
        //    if (bSetAlarm)
        //        $('#' + options.ControlID + '-taskForm-alarm-lead-time-tr').show();
        //    else
        //        $('#' + options.ControlID + '-taskForm-alarm-lead-time-tr').hide();
        //});

        // Contacts
        TriSysSDK.FormMenus.DrawGridMenu('taskForm-contactsGrid-GridMenu', 'taskForm-ContactGrid');

        // Users
        TriSysSDK.FormMenus.DrawGridMenu('taskForm-usersGrid-GridMenu', 'taskForm-UserGrid');

        // Links
        TriSysSDK.FormMenus.DrawDropDownMenuFromTemplate('taskForm-linksGrid-Menu', 'taskForm',
            'ctrlTaskLinksGridMenu.html', function (sMenuItemID) { ctrlTaskGridMasterDetail.LinksGridMenuCallback(sMenuItemID, options); },
            'taskForm-linksGrid-menu');
        TriSysSDK.FormMenus.DrawGridMenu('taskForm-linksGrid-GridMenu', 'taskForm-LinksGrid');

        // Skills/Attributes
        TriSysSDK.Attributes.Load("Task", 0, 'task-form-attributes');
    },

    LoadDocumentWidgets: function(options)
    {
        var sAttachmentFileRef = options.ControlID + '-taskForm-Attachment-File-Reference';

        var fnFileAttachmentCallback = function (sOperation, divTag, sFilePath, options)
        {
            switch (sOperation)
            {
                case 'find':
                    // Shall we view this document automatically after upload?

					// Sep 2018 and we have live editing of word documents!
					TriSysApex.Pages.FileManagerForm.FileOpenDrillDown(sFilePath);
                    break;

                case 'delete':
                    // Not interested in doing anything here
                    break;
            }
        };

        var fieldDescription = { TableFieldName: "Task Attachment", TableName: "Task" };
        TriSysSDK.Controls.FileReference.Load(sAttachmentFileRef, fieldDescription, fnFileAttachmentCallback, options);
    },

    // Fired when the user changes the task to an all day event
    AllDayTaskCheckBoxChangeEvent: function (e, sPrefix)
    {
        var bCheckedAllDayTask = $(e).is(":checked");
        if (bCheckedAllDayTask)
        {
            $('#' + sPrefix + 'taskForm-StartTimeLabel').hide();
            $('#' + sPrefix + 'taskForm-EndTimeLabel').hide();
            $('#' + sPrefix + 'taskForm-StartDateTimeSpan').hide();
            $('#' + sPrefix + 'taskForm-EndDateTimeSpan').hide();
            $('#' + sPrefix + 'taskForm-StartDateSpan').show();
            $('#' + sPrefix + 'taskForm-EndDateSpan').show();
            var dtStart = TriSysSDK.CShowForm.getDateTimePickerValue(sPrefix + 'taskForm-StartDateTime');
            var dtEnd = TriSysSDK.CShowForm.getDateTimePickerValue(sPrefix + 'taskForm-EndDateTime');
            TriSysSDK.CShowForm.setDatePickerValue(sPrefix + 'taskForm-StartDate', dtStart);
            TriSysSDK.CShowForm.setDatePickerValue(sPrefix + 'taskForm-EndDate', dtEnd);

            // 04 Jan 2023: Explicitly set the hours to 00:00 and 23:59
            dtStart = moment(dtStart).set('hour', 0).set('minute', 0);
            dtEnd = moment(dtEnd).set('hour', 23).set('minute', 59);
            TriSysSDK.CShowForm.setDateTimePickerValue(sPrefix + 'taskForm-StartDateTime', dtStart);
            TriSysSDK.CShowForm.setDateTimePickerValue(sPrefix + 'taskForm-EndDateTime', dtEnd);
        }
        else
        {
            $('#' + sPrefix + 'taskForm-StartTimeLabel').show();
            $('#' + sPrefix + 'taskForm-EndTimeLabel').show();
            $('#' + sPrefix + 'taskForm-StartDateTimeSpan').show();
            $('#' + sPrefix + 'taskForm-EndDateTimeSpan').show();
            $('#' + sPrefix + 'taskForm-StartDateSpan').hide();
            $('#' + sPrefix + 'taskForm-EndDateSpan').hide();
        }
    },

    // Must be called before 'kendo-ising controls
    ConsiderSmallFormFactors: function (sPrefix)
    {
        sPrefix = '#' + sPrefix + '-taskForm-';
        var lWidth = $(sPrefix + '-top-block').width();
        var iMinimumWidthForFullDateTimeVisibility = 550;
        if (lWidth < iMinimumWidthForFullDateTimeVisibility) {
            // We are phone-size
            $(sPrefix + 'TaskTypeContainerForSmallFormFactor-tr').show();
            $(sPrefix + 'TaskType').detach().appendTo(sPrefix + 'TaskTypeContainerForSmallFormFactor');
            $(sPrefix + 'TaskTypeContainerForSmallFormFactor').append("&nbsp;<br />");
            $(sPrefix + 'Scheduled-group').detach().appendTo(sPrefix + 'TaskTypeContainerForSmallFormFactor');

            $(sPrefix + 'StartDateContainerForSmallFormFactor-tr').show();
            $(sPrefix + 'StartDateTimeSpan').detach().appendTo(sPrefix + 'StartDateContainerForSmallFormFactor');
            $(sPrefix + 'StartDateSpan').detach().appendTo(sPrefix + 'StartDateContainerForSmallFormFactor');

            $(sPrefix + 'EndDateContainerForSmallFormFactor-tr').show();
            $(sPrefix + 'EndDateTimeSpan').detach().appendTo(sPrefix + 'EndDateContainerForSmallFormFactor');
            $(sPrefix + 'EndDateSpan').detach().appendTo(sPrefix + 'EndDateContainerForSmallFormFactor');

            $(sPrefix + 'EndDateContainerForSmallFormFactor').append("&nbsp;<br />");
            $(sPrefix + 'AllDayTask-group').detach().appendTo(sPrefix + 'EndDateContainerForSmallFormFactor');
        }
    },

    ContactsGridMenuCallback: function (sMenuItemID, thisObject)
    {
        // Traverse up the DOM to locate the control where we are hosted
        var sControlID = ctrlTaskGridMasterDetail.ControlIDFromForm(null, thisObject.id);

        var sPrefix = 'taskForm-contactsGrid-file-menu-';
        var sSuffix = '';   // sControlID + '-taskForm';

        switch (sMenuItemID)
        {
            case sPrefix + 'add-contact' + sSuffix:

                // Popup contact selection dialogue with callback
                var fnSelectContact = function (selectedRow) {
                    if (!selectedRow)
                        return;

                    // Read the fields we require from the selected row
                    var lContactId = selectedRow.Contact_ContactId;

                    // Add this new contact to the grid after selection
                    var contact = {
                        ContactId: lContactId,
                        FullName: selectedRow.Contact_Christian + ' ' + selectedRow.Contact_Surname,
                        CompanyName: selectedRow.Contact_Company,
                        JobTitle: selectedRow.Contact_JobTitle,
                        ContactType: selectedRow.Contact_ContactType
                    };

                    ctrlTaskGridMasterDetail.AddContactToGrid(contact, true, sControlID)

                    // Force dialogue to close after selection
                    return true;
                };

                TriSysApex.ModalDialogue.Contacts.Select(fnSelectContact);

                break;

            case sPrefix + 'open-contact' + sSuffix:
                var lContactId = TriSysSDK.Grid.GetSelectedSingletonRowRecordIdFromGrid('taskForm-ContactGrid', 'ContactId', "contact");
                if (lContactId > 0) {
                    // Need to close this form and open the contact
                    TriSysApex.UI.CloseModalPopup();
                    TriSysApex.FormsManager.OpenForm("Contact", lContactId);
                }
                break;

            case sPrefix + 'delete-contact' + sSuffix:
                var selectedRows = TriSysSDK.Grid.GetCheckedRows('taskForm-ContactGrid');
                if (selectedRows && selectedRows.length >= 1 && ctrlTask.Data.Contacts())   //TriSysApex.ModalDialogue.Parameters.Contacts)
                {
                    // Enumerate through all existing rows and remove each selected row and refresh grid
                    for (var i = 0; i < selectedRows.length; i++) {
                        var lContactId = selectedRows[i].ContactId;

                        for (var c = 0; c < ctrlTask.Data.Contacts().length; c++) {
                            var contact = ctrlTask.Data.Contacts()[c];
                            if (contact.ContactId == lContactId) {
                                ctrlTask.Data.Contacts().splice(c, 1);
                                break;
                            }
                        }
                    }

                    // Refresh grid now
                    ctrlTaskGridMasterDetail.LoadContactsGrid(false, sControlID);
                }
                break;
        }
    },

    AddContactToGrid: function (contact, bShowWait, sControlID)
    {
        if (ctrlTaskGridMasterDetail.Data.DuplicateContactCheck(contact, sControlID))
            return;

        // Get the full contact record including photo and phone numbers so that we can really show it in full glory
        var CContactReadRequest = { ContactId: contact.ContactId };

        // Call the API to submit the data to the server
        var payloadObject = {};

        payloadObject.URL = "Contact/Read";

        payloadObject.OutboundDataPacket = CContactReadRequest;

        payloadObject.InboundDataFunction = function (CContactReadResponse)
        {
            if (bShowWait)
                TriSysApex.UI.HideWait();

            if (CContactReadResponse)
            {
                if (CContactReadResponse.Success)
                {                
                    ctrlTaskGridMasterDetail.Data.AddContact(CContactReadResponse.Contact, sControlID);
                    ctrlTaskGridMasterDetail.LoadContactsGrid(false, sControlID);
                }
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            if (bShowWait)
                TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('ctrlTaskGridMasterDetail.AddContactToGrid: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        if (bShowWait)
            TriSysApex.UI.ShowWait(null, "Reading Contact...");

        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    AddUserToGrid: function(user, sControlID)
    {
        ctrlTaskGridMasterDetail.Data.AddUser(user, sControlID);
        ctrlTaskGridMasterDetail.LoadUsersGrid(sControlID);
    },

    DeleteContactFromTaskGrid: function (lContactId, thisObject)
    {
        if (lContactId > 0)
        {
            // Traverse up the DOM to locate the control where we are hosted
            var sControlID = ctrlTaskGridMasterDetail.ControlIDFromForm(null, thisObject.id);

            ctrlTaskGridMasterDetail.Data.DeleteContact(lContactId, sControlID);
            ctrlTaskGridMasterDetail.LoadContactsGrid(false, sControlID);
        }
    },

    OpenContactFromTaskGrid: function (lContactId)
    {
        if (lContactId > 0)
        {
            // Traverse up the DOM to locate the control where we are hosted
            //var sControlID = ctrlTaskGridMasterDetail.ControlIDFromForm(null, thisObject.id);

            // Need to close this form and open the contact
            setTimeout(TriSysApex.UI.CloseModalPopup, 10);

            var fnOpen = function ()
            {
                TriSysApex.FormsManager.OpenForm('Contact', lContactId);
            };

            setTimeout(fnOpen, 250);
        }
    },

    OpenCompany: function(lCompanyId)
    {
        setTimeout(TriSysApex.UI.CloseModalPopup, 10);

        var fnOpen = function ()
        {
            TriSysApex.FormsManager.OpenForm('Company', lCompanyId);
        };

        setTimeout(fnOpen, 250);
    },

    LoadContactsGrid: function (bGetFullContactRecord, sControlID)
    {
        var contactList = ctrlTaskGridMasterDetail.Data.Contacts(sControlID);

        if (bGetFullContactRecord)
        {
            // Normally a new task - get the full contact details including company name, phone numbers etc..

            // Have to clear existing list to prevent duplicate checking
            var sJSON = JSON.stringify(contactList);
            ctrlTask.Data._Task.Contacts = [];
            contactList = JSON.parse(sJSON)

            for(var i = 0; i < contactList.length; i++)
            {
                var contact = contactList[i];
                ctrlTaskGridMasterDetail.AddContactToGrid(contact, false);
            }

            return;
        }

        // New template driven list
        //var elemTaskPane = $('#' + sControlID + '-task-pane');
        //var elemTaskTabs = $('#' + sControlID + '-taskForm-tabs');
        var lstElem = $('#' + sControlID + '-taskForm-contacts-list-container');
        lstElem.empty();
        //lstElem.height(elemTaskPane.height() - elemTaskTabs.height() - 50);

        if (contactList)
        {
            // Sort by Surname
            contactList.sort(function (a, b)
            {
                return (a.Surname > b.Surname);
            });

            // Build
            var fnBuildFromTemplate = function (CContact)
            {
                var bClientContact = (CContact.ContactType.indexOf("Client") == 0 || CContact.ContactType.indexOf("User") == 0);
                var bCandidateContact = (CContact.ContactType.indexOf("Candidate") >= 0);

                var sHTML = $("#taskForm-contacts-template").html();
                if (!sHTML)
                    return;		// All bets are off!

                sHTML = sHTML.replace(/#:ContactId#/g, CContact.ContactId);
                sHTML = sHTML.replace("#:FullName#", CContact.FullName);
                sHTML = sHTML.replace("#:Type#", CContact.ContactType);
                sHTML = sHTML.replace("#:JobTitle#", (CContact.JobTitle ? CContact.JobTitle : ''));
                sHTML = sHTML.replace("#:CompanyName#", (CContact.CompanyName ? CContact.CompanyName : ''));
                sHTML = sHTML.replace("#:CompanyId#", CContact.CompanyId);

                if (!CContact.ContactPhotoURL)
                    CContact.ContactPhotoURL = TriSysApex.Constants.DefaultContactImage;

                sHTML = sHTML.replace("#:ContactPhotoURL#", CContact.ContactPhotoURL);

                var workPhoneId = "{{taskForm-contacts-worktelno-tr}}", sStyle="display: none;";
                if (bClientContact && CContact.WorkTelNo)
                {
                    sStyle = "";
                    sHTML = sHTML.replace(/{{taskForm-contacts-worktelno}}/g, CContact.WorkTelNo);
                }
                sHTML = sHTML.replace(workPhoneId, sStyle);

                var workMobilePhoneId = "{{taskForm-contacts-workmobiletelno-tr}}", sStyle = "display: none;";
                if (bClientContact && CContact.WorkMobileTelNo)
                {
                    sStyle = "";
                    sHTML = sHTML.replace(/{{taskForm-contacts-workmobiletelno}}/g, CContact.WorkMobileTelNo);
                }
                sHTML = sHTML.replace(workMobilePhoneId, sStyle);

                var workEMailId = "{{taskForm-contacts-workemail-tr}}", sStyle = "display: none;";
                if (bClientContact && CContact.WorkEMail)
                {
                    sStyle = "";
                    sHTML = sHTML.replace(/{{taskForm-contacts-workemail}}/g, CContact.WorkEMail);
                }
                sHTML = sHTML.replace(workEMailId, sStyle);

                var homePhoneId = "{{taskForm-contacts-hometelno-tr}}", sStyle = "display: none;";
                if (bCandidateContact && CContact.HomeAddressTelNo)
                {
                    sStyle = "";
                    sHTML = sHTML.replace(/{{taskForm-contacts-hometelno}}/g, CContact.HomeAddressTelNo);
                }
                sHTML = sHTML.replace(homePhoneId, sStyle);

                var personalMobilePhoneId = "{{taskForm-contacts-personalmobiletelno-tr}}", sStyle = "display: none;";
                if (bCandidateContact && CContact.MobileTelNo)
                {
                    sStyle = "";
                    sHTML = sHTML.replace(/{{taskForm-contacts-personalmobiletelno}}/g, CContact.MobileTelNo);
                }
                sHTML = sHTML.replace(personalMobilePhoneId, sStyle);

                var personalEMailId = "{{taskForm-contacts-personalemail-tr}}", sStyle = "display: none;";
                if (bCandidateContact && CContact.PersonalEMail)
                {
                    sStyle = "";
                    sHTML = sHTML.replace(/{{taskForm-contacts-personalemail}}/g, CContact.PersonalEMail);
                }
                sHTML = sHTML.replace(personalEMailId, sStyle);

                return sHTML;
            };

            for (var i = 0; i < contactList.length; i++)
            {
                var contact = contactList[i];
                var sHTML = fnBuildFromTemplate(contact);

                lstElem.append(sHTML);
            }

            // Nice looking buttons
            TriSysProUI.kendoUI_Overrides();

            $('#' + sControlID + '-taskForm-contacts-label').html(contactList.length + " Task Contact" + (contactList.length == 1 ? "" : "s"));

            // Fix display
            //TriSysApex.Device.FixTextEllipsesHack('.truncated-contacts-text');

            // Go to bottom if we are 'paging'
            //if (ContactsPhone._CurrentPageNumber > 1)
            //    setTimeout(ContactsPhone.ScrollToBottom, 10);
        }		
    },

    UsersGridMenuCallback: function (sMenuItemID, thisObject)
    {
        // Traverse up the DOM to locate the control where we are hosted
        var sControlID = ctrlTaskGridMasterDetail.ControlIDFromForm(null, thisObject.id);

        var sPrefix = 'taskForm-usersGrid-file-menu-';
        var sSuffix = '';   // '-taskForm';

        switch (sMenuItemID)
        {
            case sPrefix + 'add-user' + sSuffix:

                // Popup user selection dialogue with callback
                var fnSelectUser = function (selectedRow) {
                    if (!selectedRow)
                        return;

                    // Read the fields we require from the selected row
                    var lUserId = selectedRow.UserId;

                    // Add this new user to the grid after selection
                    var user = {
                        UserId: lUserId,
                        FullName: selectedRow.FullName,
                        LoginName: selectedRow.LoginName,
                        JobTitle: selectedRow.JobTitle,
                        TelNo: selectedRow.TelNo
                    };

                    ctrlTaskGridMasterDetail.AddUserToGrid(user, sControlID);

                    // Force dialogue to close after selection
                    return true;                    
                };

                TriSysApex.ModalDialogue.Users.Select(fnSelectUser, { NotLocked: true });   // 11 Nov 2022: NotLocked

                break;

            case sPrefix + 'delete-user' + sSuffix:
                var selectedRows = TriSysSDK.Grid.GetCheckedRows('taskForm-UserGrid');
                if (selectedRows && selectedRows.length >= 1 && TriSysApex.ModalDialogue.Parameters.Users) {
                    // Enumerate through all existing rows and remove each selected row and refresh grid
                    for (var i = 0; i < selectedRows.length; i++) {
                        var lUserId = selectedRows[i].UserId;

                        for (var u = 0; u < TriSysApex.ModalDialogue.Parameters.Users.length; u++) {
                            var user = TriSysApex.ModalDialogue.Parameters.Users[u];
                            if (user.UserId == lUserId) {
                                TriSysApex.ModalDialogue.Parameters.Users.splice(u, 1);
                                break;
                            }
                        }
                    }

                    // Refresh grid now
                    ctrlTaskGridMasterDetail.LoadUsersGrid(sControlID);
                }
                break;
        }
    },

    DeleteUserFromTaskGrid: function (lUserId, thisObject)
    {
        if (lUserId > 0)
        {
            // Traverse up the DOM to locate the control where we are hosted
            var sControlID = ctrlTaskGridMasterDetail.ControlIDFromForm(null, thisObject.id);

            ctrlTaskGridMasterDetail.Data.DeleteUser(lUserId, sControlID);
            ctrlTaskGridMasterDetail.LoadUsersGrid(sControlID);
        }
    },

    SetOwner: function (lUserId, thisObject)
    {
        // Traverse up the DOM to locate the control where we are hosted
        var sControlID = ctrlTaskGridMasterDetail.ControlIDFromForm(null, thisObject.id);

        var task = ctrlTaskGridMasterDetail.Data.Task(sControlID);
        if (task)
        {
            task.OwnerUserId = lUserId;
            ctrlTaskGridMasterDetail.LoadUsersGrid(sControlID);
        }
    },

    LoadUsersGrid: function (sControlID)
    {
        var userList = ctrlTaskGridMasterDetail.Data.Users(sControlID);

        // New template driven list
        //var elemTaskPane = $('#' + sControlID + '-task-pane');
        //var elemTaskTabs = $('#' + sControlID + '-taskForm-tabs');
        var lstElem = $('#' + sControlID + '-taskForm-users-list-container');
        lstElem.empty();
        //lstElem.height(elemTaskPane.height() - elemTaskTabs.height() - 50);

        if (userList) 
        {
            // Sort by Surname
            userList.sort(function (a, b)
            {
                return (a.FullName > b.FullName);
            });

            var fnBuildFromTemplate = function (user)
            {
			    var sUserOwnerLabel = user.isOwner ? "(Owner)": "";
                var sHTML = $("#taskForm-users-template").html();

                sHTML = sHTML.replace(/#:UserId#/g, user.UserId);
			    sHTML = sHTML.replace("#:FullName#", user.FullName);
			    sHTML = sHTML.replace("#:OwnerUser#", sUserOwnerLabel);
                sHTML = sHTML.replace("#:TelNo#", (user.TelNo ? user.TelNo: ' &nbsp;'));

                return sHTML;
            };

            for (var i = 0; i < userList.length; i++)
            {
                var user = userList[i];

                user.isOwner = false;
                var task = ctrlTaskGridMasterDetail.Data.Task(sControlID);
                if (task)
                {
                    if (user.UserId == task.OwnerUserId)
                        user.isOwner = true;
                }

                var sHTML = fnBuildFromTemplate(user);

                lstElem.append(sHTML);
            }

            // Nice looking buttons
            TriSysProUI.kendoUI_Overrides();

            $('#' + sControlID + '-taskForm-users-label').html(userList.length + " Task User" +(userList.length == 1 ? "": "s"));
        }
    },


    LinksGridMenuCallback: function (sMenuItemID, options)
    {
        var sPrefix = 'taskForm-linksGrid-menu-';
        var sSuffix = '-taskForm';

        switch (sMenuItemID) {
            case sPrefix + 'link-requirement' + sSuffix:

                var fnSelectRequirement = function (selectedRow) {
                    if (!selectedRow)
                        return;

                    // Add this new entity record to the grid after selection
                    var entity = {
                        Name: "Requirement",
                        RecordId: selectedRow.Requirement_RequirementId,
                        Description: selectedRow.Requirement_RequirementReference + ": " + selectedRow.Requirement_JobTitle + " at " +
                                            selectedRow.RequirementCompany_Name + " with " + selectedRow.RequirementContact_FullName
                    };

                    ctrlTaskGridMasterDetail.AddEntityLinkToGrid(entity, options)

                    // Force dialogue to close after selection
                    return true;
                };

                TriSysApex.ModalDialogue.Requirements.Select(fnSelectRequirement);

                break;

            case sPrefix + 'link-placement' + sSuffix:
                var fnSelectPlacement = function (selectedRow) {
                    if (!selectedRow)
                        return;

                    // Add this new entity record to the grid after selection
                    var entity = {
                        Name: "Placement",
                        RecordId: selectedRow.Placement_PlacementId,
                        Description: selectedRow.Placement_Reference + ": " + selectedRow.CandidateContact_FullName + ", " + selectedRow.Placement_JobTitle + " at " + selectedRow.PlacementCompany_Name
                    };

                    ctrlTaskGridMasterDetail.AddEntityLinkToGrid(entity, options)

                    // Force dialogue to close after selection
                    return true;
                };

                TriSysApex.ModalDialogue.Placements.Select(fnSelectPlacement);

                break;

            case sPrefix + 'link-timesheet' + sSuffix:
                var fnSelectTimesheet = function (selectedRow) {
                    if (!selectedRow)
                        return;

                    // Add this new entity record to the grid after selection
                    var entity = {
                        Name: "Timesheet",
                        RecordId: selectedRow.TimesheetId,
                        Description: selectedRow.Reference + ": " + selectedRow.Candidate + ", " + selectedRow.JobTitle + " at " + selectedRow.Company + ", period: " + selectedRow.Period
                    };

                    ctrlTaskGridMasterDetail.AddEntityLinkToGrid(entity, options)

                    // Force dialogue to close after selection
                    return true;
                };

                TriSysApex.ModalDialogue.Timesheets.Select(fnSelectTimesheet);

                break;
        }
    },

    OpenLinkFromTaskGrid: function (sEntity, lRecordId)
    {
        TriSysApex.FormsManager.OpenForm(sEntity, lRecordId);
    },

    LoadLinksGrid: function (options)
    {
        var linkList = ctrlTaskGridMasterDetail.Data.Links(options);

        // New template driven list
        var lstElem = $('#' + options.ControlID + '-taskForm-links-list-container');
        lstElem.empty();
        //var iWindowHeight = $(window).height();
        //lstElem.height(iWindowHeight * 0.375);

        if (linkList) {
            var fnBuildFromTemplate = function (link) {
                var sHTML = $('#taskForm-links-template').html();

                sHTML = sHTML.replace(/#:Entity#/g, link.Name);
                sHTML = sHTML.replace(/#:RecordId#/g, link.RecordId);
                sHTML = sHTML.replace(/#:Description#/g, link.Description);

                return sHTML;
            };

            for (var i = 0; i < linkList.length; i++) {
                var link = linkList[i];
                var sHTML = fnBuildFromTemplate(link);

                lstElem.append(sHTML);
            }

            // Nice looking buttons
            TriSysProUI.kendoUI_Overrides();

            $('#' + options.ControlID + '-taskForm-links-label').html(linkList.length + " Task Link" + (linkList.length == 1 ? "" : "s"));
        }
    },

    AddEntityLinkToGrid: function (entity, options)
    {
        ctrlTaskGridMasterDetail.Data.AddLink(entity, options);
        ctrlTaskGridMasterDetail.LoadLinksGrid(options);
    },

    DeleteLinkFromTaskGrid: function (sEntity, lRecordId, thisObject)
    {
        if (sEntity && lRecordId > 0)
        {
            // Traverse up the DOM to locate the control where we are hosted
            var sControlID = ctrlTaskGridMasterDetail.ControlIDFromForm(null, thisObject.id);

            ctrlTaskGridMasterDetail.Data.DeleteLink(sEntity, lRecordId, sControlID);

            ctrlTaskGridMasterDetail.LoadLinksGrid({ ControlID: sControlID });
        }
    },

    // Lifted from TriSysApex.ModalDialogue.Task.Load
    // Load the data for the specified task
    LoadTask: function (lTaskId, options)                        // ctrlTaskGridMasterDetail.LoadTask
    {
        var sPrefix = options.ControlID + '-';
        var sTaskDescriptionID = sPrefix + 'taskForm-Description';
        var elemTaskDescription = $('#' + sTaskDescriptionID);
        elemTaskDescription.val('');

        // Clear last record
        ctrlTaskGridMasterDetail.Data.DeleteContacts(options.ControlID);
        ctrlTaskGridMasterDetail.LoadContactsGrid(false, options.ControlID);
        ctrlTaskGridMasterDetail.Data.DeleteUsers(options.ControlID);
        ctrlTaskGridMasterDetail.LoadUsersGrid(options.ControlID);
        ctrlTaskGridMasterDetail.Data.DeleteLinks(options.ControlID);
        ctrlTaskGridMasterDetail.LoadLinksGrid({ ControlID: options.ControlID });

        TriSysSDK.Controls.FileReference.SetFile(sPrefix + "taskForm-Attachment-File-Reference", '');
        $('#' + sPrefix + 'taskForm-Attachment-Description').val('');

        TriSysSDK.Attributes.Load("Task", 0, sPrefix + 'task-form-attributes');

        // Load this record
        if (lTaskId > 0)
        {
            // This is an existing task record so get from web API
            var dataPacket = {
                'TaskId': lTaskId
            };

            var payloadObject = {};

            // Call the API to submit the data to the server
            payloadObject.URL = "Task/Read";

            payloadObject.OutboundDataPacket = dataPacket;

            payloadObject.InboundDataFunction = function (data)
            {
                TriSysApex.UI.HideWait();

                var CTaskReadResponse = data;

                if (CTaskReadResponse)
                {
                    if (CTaskReadResponse.Success)
                    {
                        // The read task object
                        var task = CTaskReadResponse.Task;

                        // Save it in our modal dialogue
                        ctrlTaskGridMasterDetail.Data.SetTask(task, options.ControlID);

                        TriSysSDK.CShowForm.SetCheckBoxValue(sPrefix + 'taskForm-scheduled', task.Scheduled);

                        // Update the modal popup caption and image if necessary now that we know the task
                        var sTitle = TriSysApex.ModalDialogue.Task.GetModalTitleText(task.Scheduled, task.TaskId);
                        var sImage = TriSysApex.ModalDialogue.Task.GetModalImage(task.Scheduled);
                        //TriSysApex.UI.SetTopmostModalImageAndTitle(sImage, sTitle);

                        // Write to screen fields
                        TriSysSDK.CShowForm.SetTaskTypeComboValue(sPrefix + 'taskForm-TaskType', task.TaskType);
                        TriSysActions.Forms.TaskType.Icon(sPrefix + 'taskForm-TaskType', sPrefix + "taskForm-selected-TaskType-Image");

                        elemTaskDescription.val(task.Description);
                        elemTaskDescription.focus();

                        // 17 Aug 2020
                        if (task.Description)
                        {
                            document.getElementById(sTaskDescriptionID).selectionStart = 0;
                            document.getElementById(sTaskDescriptionID).selectionEnd = 0;
                            elemTaskDescription.scrollTop(0);
                        }

                        TriSysSDK.CShowForm.setDateTimePickerValue(sPrefix + 'taskForm-StartDateTime', task.StartDate);
                        TriSysSDK.CShowForm.setDateTimePickerValue(sPrefix + 'taskForm-EndDateTime', task.EndDate);

                        TriSysSDK.CShowForm.SetCheckBoxValue(sPrefix + 'taskForm-set-alarm', task.Alarmed);
                        if (task.Alarmed && task.LeadTime)
                            TriSysSDK.Controls.Duration.Set(sPrefix + 'taskForm-Duration', task.LeadTime);
                        else
                            $('#' + sPrefix + 'taskForm-alarm-lead-time-tr').hide();

                        // This was slow so we did it on a background 'thread'. Not any more though!
                        if (task.Contacts)
                        {
                            task.Contacts.forEach(function (contact) {
                                ctrlTaskGridMasterDetail.Data.AddContact(contact, options.ControlID);
                            });
                        }
                        ctrlTaskGridMasterDetail.LoadContactsGrid(false, options.ControlID);

                        if (task.Users) {
                            task.Users.forEach(function (user) {
                                ctrlTaskGridMasterDetail.Data.AddUser(user, options.ControlID);
                            });
                        }
                        ctrlTaskGridMasterDetail.LoadUsersGrid(options.ControlID);

                        if (task.Links) {
                            task.Links.forEach(function (link) {
                                ctrlTaskGridMasterDetail.Data.AddLink(link, options);
                            });
                        }
                        ctrlTaskGridMasterDetail.LoadLinksGrid({ ControlID: options.ControlID });

                        if (task.Attachments)
                        {
                            // We only show 1 attachment per task
                            if (task.Attachments.length > 0)
                            {
                                var attachment = task.Attachments[0];
                                TriSysSDK.Controls.FileReference.SetFile(sPrefix + "taskForm-Attachment-File-Reference", attachment.DocumentPath);
                                if (attachment.Description)
                                    $('#' + sPrefix + 'taskForm-Attachment-Description').val(attachment.Description);

                                // Hack
                                //$('#' + sPrefix + '-taskForm-Attachment-File-Reference-FileReference_OpenButton').show();
                                TriSysSDK.Controls.FileReference.OpenButtonVisible(sPrefix + 'taskForm-Attachment-File-Reference', true);
                            }
                        }

                        // Skills/Attributes
                        TriSysSDK.Attributes.Load("Task", lTaskId, sPrefix + 'task-form-attributes');

                        return;
                    }
                    else
                        TriSysApex.UI.ShowMessage(CTaskReadResponse.ErrorMessage);
                }
            };

            payloadObject.ErrorHandlerFunction = function (request, status, error)
            {
                TriSysApex.UI.HideWait();
                TriSysApex.UI.errorAlert('ctrlTaskGridMasterDetail.LoadTask: ' + status + ": " + error + ". responseText: " + request.responseText);
            };

            TriSysApex.UI.ShowWait(null, "Reading Task...");
            TriSysAPI.Data.PostToWebAPI(payloadObject);
        }        
    },

    GetGridID: function (thisObject)
    {
        // Traverse up the DOM to locate the control where we are hosted
        var sControlID = ctrlTaskGridMasterDetail.ControlIDFromForm(null, thisObject.id);

        var sGridID = sControlID + '-ctrlTaskGridMasterDetail-Grid';
        return sGridID;
    },

    ExportToExcel: function (thisObject)
    {
        TriSysSDK.Grid.ExportToExcel(ctrlTaskGridMasterDetail.GetGridID(thisObject));
    },

    TaskGridFileMenuCallback: function(sMenuInstruction, thisObject)
    {
        var fm = TriSysSDK.FormMenus.Constants;
        var lTaskId = null;
        var sGrid = ctrlTaskGridMasterDetail.GetGridID(thisObject);

        switch (sFileMenuID)
        {
            case fm.File_Open:
                lTaskId = TriSysApex.ModalDialogue.Task.GetSelectedSingletonTaskIdFromTaskGrid(sGrid);
                if (lTaskId > 0)
                    TriSysApex.ModalDialogue.Task.QuickShow(lTaskId);
                break;

            case fm.File_Delete:
                lTaskId = TriSysApex.ModalDialogue.Task.GetSelectedSingletonTaskIdFromTaskGrid(sGrid);
                if (lTaskId > 0)
                    TriSysApex.ModalDialogue.Task.DeleteTask(lTaskId);
                break;
         }
    },

    // Data will be stored in the new TriSysApex.Data namespace but we store it here during development
    // Why TriSysApex.Data? Because it will remain in-memory during the logged in session, whereas we will be re-loaded
    Data:       // ctrlTaskGridMasterDetail.Data
    {
        Clear: function (sControlID)     // ctrlTaskGridMasterDetail.Data.Clear
        {
            if (!TriSysApex.TaskGridMasterDetailData)
                TriSysApex.TaskGridMasterDetailData = { Contacts: [], Users: [], Links: [], TaskId: [] };

            // Multiple contacts per control
            for(var i = TriSysApex.TaskGridMasterDetailData.Contacts.length - 1; i >= 0; i--)
            {
                var object = TriSysApex.TaskGridMasterDetailData.Contacts[i];
                if (object.ControlID == sControlID)
                    TriSysApex.TaskGridMasterDetailData.Contacts.splice(i, 1);
            }

            // Multiple users per control
            for (var i = TriSysApex.TaskGridMasterDetailData.Users.length - 1; i >= 0; i--)
            {
                var object = TriSysApex.TaskGridMasterDetailData.Users[i];
                if (object.ControlID == sControlID)
                    TriSysApex.TaskGridMasterDetailData.Users.splice(i, 1);
            }

            // Multiple links per control
            for (var i = TriSysApex.TaskGridMasterDetailData.Links.length - 1; i >= 0; i--)
            {
                var object = TriSysApex.TaskGridMasterDetailData.Links[i];
                if (object.ControlID == sControlID)
                    TriSysApex.TaskGridMasterDetailData.Links.splice(i, 1);
            }

            // Expect only 1 task per control instance at any one time
            for (var i = TriSysApex.TaskGridMasterDetailData.TaskId.length - 1; i >= 0; i--)
            {
                var object = TriSysApex.TaskGridMasterDetailData.TaskId[i];
                if (object.ControlID == sControlID)
                    TriSysApex.TaskGridMasterDetailData.TaskId.splice(i, 1);
            }
        },

        Links: function (options)
        {
            var lstLinks = [];
            if (TriSysApex.TaskGridMasterDetailData && TriSysApex.TaskGridMasterDetailData.Links)
            {
                TriSysApex.TaskGridMasterDetailData.Links.forEach(function (link)
                {
                    if (link.ControlID == options.ControlID)
                        lstLinks.push(link.Entity);
                });
            }
            return lstLinks;
        },

        Link: function (options)
        {
            if (TriSysApex.TaskGridMasterDetailData && TriSysApex.TaskGridMasterDetailData.Links)
            {
                var iIndex = TriSysApex.TaskGridMasterDetailData.Links.indexOf(options.ControlID);
                if(iIndex >= 0)
                    return TriSysApex.TaskGridMasterDetailData.Links[iIndex];
            }
        },

        AddLink: function (entity, options)
        {
            var lnkFound = ctrlTaskGridMasterDetail.Data.Link(options);
            if (lnkFound)
                lnkFound.Entity = entity;
            else
            {
                lnkFound = { ControlID: options.ControlID, Entity: entity };
                TriSysApex.TaskGridMasterDetailData.Links.push(lnkFound);
            }
        },

        DeleteLink: function (sEntity, lRecordId, sControlID)
        {
            for (var i = TriSysApex.TaskGridMasterDetailData.Links.length - 1; i >= 0; i--)
            {
                var object = TriSysApex.TaskGridMasterDetailData.Links[i];
                if (object.ControlID == sControlID && lRecordId == object.Entity.RecordId && sEntity == object.Entity.Name)
                    TriSysApex.TaskGridMasterDetailData.Links.splice(i, 1);
            }
        },

        DeleteLinks: function (sControlID)
        {
            for (var i = TriSysApex.TaskGridMasterDetailData.Links.length - 1; i >= 0; i--)
            {
                var object = TriSysApex.TaskGridMasterDetailData.Links[i];
                if (object.ControlID == sControlID)
                    TriSysApex.TaskGridMasterDetailData.Links.splice(i, 1);
            }
        },

        Contacts: function (sControlID)        // ctrlTaskGridMasterDetail.Data.Contacts()
        {
            var lstContacts = [];
            TriSysApex.TaskGridMasterDetailData.Contacts.forEach(function (contact)
            {
                if (contact.ControlID == sControlID)
                    lstContacts.push(contact.Contact);
            });

            return lstContacts;
        },

        Contact: function (lContactId, sControlID)        // ctrlTaskGridMasterDetail.Data.Contact()
        {
            var lstContacts = ctrlTaskGridMasterDetail.Data.Contacts(sControlID);
            var foundContact = null;
            lstContacts.forEach(function (contact)
            {
                if (contact.ContactId == lContactId)
                {
                    foundContact = contact;
                    return true; // Breaks out of the loop
                }
            });

            return foundContact
        },

        AddContact: function (contact, sControlID)      // ctrlTaskGridMasterDetail.Data.AddContact()
        {
            var contactFound = ctrlTaskGridMasterDetail.Data.Contact(contact.ContactId, sControlID);
            if (!contactFound)
            {
                var contactObject = { ControlID: sControlID, Contact: contact };
                TriSysApex.TaskGridMasterDetailData.Contacts.push(contactObject);
            }
        },

        DeleteContact: function (lContactId, sControlID)
        {
            for (var i = TriSysApex.TaskGridMasterDetailData.Contacts.length - 1; i >= 0; i--)
            {
                var object = TriSysApex.TaskGridMasterDetailData.Contacts[i];
                if (object.ControlID == sControlID && lContactId == object.Contact.ContactId)
                    TriSysApex.TaskGridMasterDetailData.Contacts.splice(i, 1);
            }
        },

        DeleteContacts: function (sControlID)
        {
            for (var i = TriSysApex.TaskGridMasterDetailData.Contacts.length - 1; i >= 0; i--) {
                var object = TriSysApex.TaskGridMasterDetailData.Contacts[i];
                if (object.ControlID == sControlID)
                    TriSysApex.TaskGridMasterDetailData.Contacts.splice(i, 1);
            }
        },

        Users: function (sControlID)        // ctrlTaskGridMasterDetail.Data.Users()
        {
            var lstUsers = [];
            TriSysApex.TaskGridMasterDetailData.Users.forEach(function (user) {
                if (user.ControlID == sControlID)
                    lstUsers.push(user.User);
            });

            return lstUsers;
        },

        User: function (lUserId, sControlID)        // ctrlTaskGridMasterDetail.Data.User()
        {
            var lstUsers = ctrlTaskGridMasterDetail.Data.Users(sControlID);
            var foundUser = null;
            lstUsers.forEach(function (user) {
                if (user.UserId == lUserId) {
                    foundUser = user;
                    return true; // Breaks out of the loop
                }
            });

            return foundUser
        },

        AddUser: function (user, sControlID)
        {
            var userFound = ctrlTaskGridMasterDetail.Data.User(user.UserId, sControlID);
            if (!userFound) {
                var userObject = { ControlID: sControlID, User: user };
                TriSysApex.TaskGridMasterDetailData.Users.push(userObject);
            }
        },

        DeleteUser: function (lUserId, sControlID)
        {
            for (var i = TriSysApex.TaskGridMasterDetailData.Users.length - 1; i >= 0; i--)
            {
                var object = TriSysApex.TaskGridMasterDetailData.Users[i];
                if (object.ControlID == sControlID && lUserId == object.User.UserId)
                    TriSysApex.TaskGridMasterDetailData.Users.splice(i, 1);
            }
        },

        DeleteUsers: function (sControlID)
        {
            for (var i = TriSysApex.TaskGridMasterDetailData.Users.length - 1; i >= 0; i--)
            {
                var object = TriSysApex.TaskGridMasterDetailData.Users[i];
                if (object.ControlID == sControlID)
                    TriSysApex.TaskGridMasterDetailData.Users.splice(i, 1);
            }
        },

        Task: function (sControlID)        // ctrlTaskGridMasterDetail.Data.Task()
        {
            var foundTask = null;
            TriSysApex.TaskGridMasterDetailData.TaskId.forEach(function (task)
            {
                if (task.ControlID == sControlID)
                    foundTask = task;
            });

            return foundTask;
        },

        SetTask: function (task, sControlID)
        {
            var foundTask = ctrlTaskGridMasterDetail.Data.Task(sControlID);

            if (!foundTask)
            {
                var taskObject = { ControlID: sControlID, Task: task };
                TriSysApex.TaskGridMasterDetailData.TaskId.push(taskObject);
            }
            else
                foundTask.Task = task;
        },

        // Return true if duplicate found
        DuplicateContactCheck: function (contact, sControlID)
        {
            var lstContacts = ctrlTaskGridMasterDetail.Data.Contacts(sControlID);

            if (lstContacts)
            {
                lstContacts.forEach(function (lContactId)
                {
                    if (lContactId == contact.ContactId)
                        return true;
                });
            }
        }

    }   // ctrlTaskGridMasterDetail.Data

};  // ctrlTaskGridMasterDetail
