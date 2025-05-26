var ctrlTask = 
{
    Load: function()
    {
        //debugger;

        // Hack with settings to ensure that we look good on smaller devices
        ctrlTask.ConsiderSmallFormFactors();

        // Initialize tabs
        $('[data-toggle="tabs"] a, .enable-tabs a').click(function (e) { e.preventDefault(); $(this).tab('show'); });

        var sDefaultType = (TriSysApex.ModalDialogue.Parameters.Scheduled ? "ToDo" : "Note");
        TriSysActions.Forms.TaskType.Load("taskForm-TaskType", "taskForm-selected-TaskType-Image", sDefaultType);

        var fnChangeStartDateTime = function (dtStart)
        {
            // If after end date/time, then push forward end date/time
            var dtEnd = new Date(TriSysSDK.CShowForm.getDateTimePickerValue('taskForm-EndDateTime'));
            if(dtStart > dtEnd)
                TriSysSDK.CShowForm.setDateTimePickerValue('taskForm-EndDateTime', moment(dtStart).add(0.25, 'hours'));
        };

        var fnChangeEndDateTime = function (dtEnd)
        {
            // If before start date/time, then push back start date/time
            var dtStart = new Date(TriSysSDK.CShowForm.getDateTimePickerValue('taskForm-StartDateTime'));
            if (dtEnd < dtStart)
                TriSysSDK.CShowForm.setDateTimePickerValue('taskForm-StartDateTime', moment(dtEnd).add(-0.25, 'hours'));
        };

        TriSysSDK.CShowForm.dateTimePicker("taskForm-StartDateTime", fnChangeStartDateTime);
        TriSysSDK.CShowForm.dateTimePicker("taskForm-EndDateTime", fnChangeEndDateTime);

        TriSysSDK.CShowForm.datePicker("taskForm-StartDate");
        TriSysSDK.CShowForm.datePicker("taskForm-EndDate");

        $('#taskForm-all-day-task').change(function ()
        {
            TriSysApex.ModalDialogue.Task.AllDayTaskCheckBoxChangeEvent(this);
        });

        $('#taskForm-scheduled').change(function ()
        {
            TriSysApex.ModalDialogue.Task.ScheduledTaskCheckBoxChangeEvent(this);
        });


        // Alarm
        // 01 May 2024: Pick up the default alarm from user-specific setting
        var durationOptions = {
            DefaultPeriod: 'minutes',
            DefaultDurationValue: 15
        };
        var sLeadTime = TriSysApex.Cache.UserSettingManager.GetValue("Task.AlarmLeadTime");
        if (sLeadTime)
        {
            var parts = sLeadTime.split(" ");
            var iAmount = parseInt(parts[0]);
            if(iAmount > 0 && parts.length == 2)
            {
                var sPeriod = parts[1];
                durationOptions.DefaultPeriod = sPeriod;
                durationOptions.DefaultDurationValue = iAmount;
            }
        }

        TriSysSDK.Controls.Duration.Initialise('taskForm-Duration', durationOptions);

        var fnAlarmLeadTimeSectionVisible = function (bVisible) {
            var elem = $('#taskForm-alarm-lead-time-tr');
            bVisible ? elem.show() : elem.hide();
        };

        $('#taskForm-set-alarm').change(function ()
        {
            var bSetAlarm = $(this).is(":checked");
            fnAlarmLeadTimeSectionVisible(bSetAlarm);
        });

        // 01 May 2024: Use user setting
        var bAlarmed = TriSysApex.Cache.UserSettingManager.GetValueBoolean('Task.Alarmed', true);
        TriSysSDK.CShowForm.SetCheckBoxValue('taskForm-set-alarm', bAlarmed);
        fnAlarmLeadTimeSectionVisible(bAlarmed);

        // Contacts
        //TriSysSDK.FormMenus.DrawDropDownMenuFromTemplate('taskForm-contactsGrid-FileMenu', 'taskForm',
        //    'ctrlTaskContactsGridMenu.html', ctrlTask.ContactsGridMenuCallback, 'taskForm-contactsGrid-file-menu');
        TriSysSDK.FormMenus.DrawGridMenu('taskForm-contactsGrid-GridMenu', 'taskForm-ContactGrid');

        // Users
        //TriSysSDK.FormMenus.DrawDropDownMenuFromTemplate('taskForm-usersGrid-FileMenu', 'taskForm',
        //    'ctrlTaskUsersGridMenu.html', ctrlTask.UsersGridMenuCallback, 'taskForm-usersGrid-file-menu');
        TriSysSDK.FormMenus.DrawGridMenu('taskForm-usersGrid-GridMenu', 'taskForm-UserGrid');

        // Links
        TriSysSDK.FormMenus.DrawDropDownMenuFromTemplate('taskForm-linksGrid-Menu', 'taskForm',
            'ctrlTaskLinksGridMenu.html', ctrlTask.LinksGridMenuCallback, 'taskForm-linksGrid-menu');
        TriSysSDK.FormMenus.DrawGridMenu('taskForm-linksGrid-GridMenu', 'taskForm-LinksGrid');

        // Skills/Attributes
        TriSysSDK.Attributes.Load("Task", TriSysApex.ModalDialogue.Parameters.TaskId, 'task-form-attributes');

        // Attachments
        ctrlTask.LoadDocumentWidgets();

        // Load data using parameters orchestrated by TriSysApex.ModalDialogue.Task
        TriSysApex.ModalDialogue.Task.Load();

        // Only show entity links which are supported in this database
        setTimeout(ctrlTask.CustomiseLinksGridMenus, 1000);
    },

    
    ContactsGridMenuCallback: function(sMenuItemID)
    {
        var sPrefix = 'taskForm-contactsGrid-file-menu-';
        var sSuffix = '-taskForm';

        //debugger;

        switch (sMenuItemID)
        {
            case sPrefix + 'add-contact' + sSuffix:

                // Popup contact selection dialogue with callback
                var fnSelectContact = function (selectedRow)
                {
                    if (!selectedRow)
                        return;

                    // Read the fields we require from the selected row
                    var lContactId = selectedRow.Contact_ContactId;

                    //// This is generally bad practice because this function wants to close itself, but ends up closing the latest!
                    //// Could fix with additional time+money but why should I?
                    //var fnCloseBoth = function ()
                    //{
                    //    TriSysApex.UI.CloseModalPopup();      // The top-most messagebox
                    //    TriSysApex.UI.CloseModalPopup();      // The modal selection popup
                    //};
                    //TriSysApex.UI.ShowMessage("ContactId: " + lContactId, TriSysApex.Copyright.ShortProductName, fnCloseBoth);
                    //return false;

                    // Add this new contact to the grid after selection
                    var contact = {
                        ContactId: lContactId,
                        FullName: selectedRow.Contact_Christian + ' ' + selectedRow.Contact_Surname,
                        CompanyName: selectedRow.Contact_Company,
                        JobTitle: selectedRow.Contact_JobTitle,
                        ContactType: selectedRow.Contact_ContactType
                    };

                    ctrlTask.AddContactToGrid(contact, true)

                    // Force dialogue to close after selection
                    return true;
                };

                TriSysApex.ModalDialogue.Contacts.Select(fnSelectContact);

                break;

            case sPrefix + 'open-contact' +sSuffix:
                var lContactId = TriSysSDK.Grid.GetSelectedSingletonRowRecordIdFromGrid('taskForm-ContactGrid', 'ContactId', "contact");
                if (lContactId > 0)
                {
                    // Need to close this form and open the contact
                    TriSysApex.UI.CloseModalPopup();
                    TriSysApex.FormsManager.OpenForm("Contact", lContactId);
                }
                break;

            case sPrefix + 'delete-contact' +sSuffix:
                var selectedRows = TriSysSDK.Grid.GetCheckedRows('taskForm-ContactGrid');
                if (selectedRows && selectedRows.length >= 1 && ctrlTask.Data.Contacts())   //TriSysApex.ModalDialogue.Parameters.Contacts)
                {
                    // Enumerate through all existing rows and remove each selected row and refresh grid
                    for(var i = 0; i < selectedRows.length; i++)
                    {
                        var lContactId = selectedRows[i].ContactId;

                        for (var c = 0; c < ctrlTask.Data.Contacts().length; c++)
                        {
                            var contact = ctrlTask.Data.Contacts()[c];
                            if(contact.ContactId == lContactId)
                            {
                                ctrlTask.Data.Contacts().splice(c, 1);
                                break;
                            }
                        }
                    }

                    // Refresh grid now
                    ctrlTask.LoadContactsGrid();
                }
                break;
        }
    },

    UsersGridMenuCallback: function(sMenuItemID)
    {
        var sPrefix = 'taskForm-usersGrid-file-menu-';
        var sSuffix = '-taskForm';

        //debugger;

        switch (sMenuItemID)
        {
            case sPrefix + 'add-user' + sSuffix:

                // Popup user selection dialogue with callback
                var fnSelectUser = function (selectedRow)
                {
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

                    if (ctrlTask.Data.DuplicateUserCheck(user))
                        return;

                    ctrlTask.Data.Users().push(user);
                    ctrlTask.LoadUsersGrid();

                    // Force dialogue to close after selection
                    return true;
                };

                TriSysApex.ModalDialogue.Users.Select(fnSelectUser, { NotLocked: true });   // 11 Nov 2022: NotLocked

                break;

            case sPrefix + 'delete-user' + sSuffix:
                var selectedRows = TriSysSDK.Grid.GetCheckedRows('taskForm-UserGrid');
                if (selectedRows && selectedRows.length >= 1 && TriSysApex.ModalDialogue.Parameters.Users)
                {
                    // Enumerate through all existing rows and remove each selected row and refresh grid
                    for (var i = 0; i < selectedRows.length; i++)
                    {
                        var lUserId = selectedRows[i].UserId;

                        for (var u = 0; u < TriSysApex.ModalDialogue.Parameters.Users.length; u++)
                        {
                            var user = TriSysApex.ModalDialogue.Parameters.Users[u];
                            if (user.UserId == lUserId)
                            {
                                TriSysApex.ModalDialogue.Parameters.Users.splice(u, 1);
                                break;
                            }
                        }
                    }

                    // Refresh grid now
                    ctrlTask.LoadUsersGrid();
                }
                break;
        }
    },

    // 14 Mar 2023: Custom task links after all these years!
    CustomiseLinksGridMenus: function()
    {
        var bLoggedIntoTriSysCRM = TriSysApex.LoginCredentials.isLoggedInToSpecificCompanyAsRecruiter("TriSys Business Software");
        if(bLoggedIntoTriSysCRM)
        {
            var sPrefix = '#taskForm-linksGrid-menu-link-';
            var sSuffix = '-taskForm';
            $(sPrefix + 'requirement' + sSuffix).hide();
            $(sPrefix + 'placement' + sSuffix).hide();
            $(sPrefix + 'project' + sSuffix).show();
            $(sPrefix + 'project-issue' + sSuffix).show();
            $(sPrefix + 'quote' + sSuffix).show();
            $(sPrefix + 'sales-order' + sSuffix).show();
        }
    },

    LinksGridMenuCallback: function(sMenuItemID)
    {
        var sPrefix = 'taskForm-linksGrid-menu-';
        var sSuffix = '-taskForm';

        //debugger;

        switch (sMenuItemID)
        {
            case sPrefix + 'link-requirement' + sSuffix:

                var fnSelectRequirement = function (selectedRow)
                {
                    if (!selectedRow)
                        return;

                    // Add this new entity record to the grid after selection
                    var entity = {
                        Name: "Requirement",
                        RecordId: selectedRow.Requirement_RequirementId,
                        Description: selectedRow.Requirement_RequirementReference + ": " + selectedRow.Requirement_JobTitle + " at " + selectedRow.RequirementCompany_Name + " with " + selectedRow.RequirementContact_FullName
                    };

                    ctrlTask.AddEntityLinkToGrid(entity)

                    // Force dialogue to close after selection
                    return true;
                };

                TriSysApex.ModalDialogue.Requirements.Select(fnSelectRequirement);

                break;

            case sPrefix + 'link-placement' + sSuffix:
                var fnSelectPlacement = function (selectedRow)
                {
                    if (!selectedRow)
                        return;

                    // Add this new entity record to the grid after selection
                    var entity = {
                        Name: "Placement",
                        RecordId: selectedRow.Placement_PlacementId,
                        Description: selectedRow.Placement_Reference + ": " + selectedRow.CandidateContact_FullName + ", " + selectedRow.Placement_JobTitle + " at " + selectedRow.PlacementCompany_Name
                    };

                    ctrlTask.AddEntityLinkToGrid(entity)

                    // Force dialogue to close after selection
                    return true;
                };

                TriSysApex.ModalDialogue.Placements.Select(fnSelectPlacement);

                break;

            case sPrefix + 'link-timesheet' + sSuffix:
                var fnSelectTimesheet = function (selectedRow)
                {
                    if (!selectedRow)
                        return;

                    // Add this new entity record to the grid after selection
                    var entity = {
                        Name: "Timesheet",
                        RecordId: selectedRow.TimesheetId,
                        Description: selectedRow.Reference + ": " + selectedRow.Candidate + ", " + selectedRow.JobTitle + " at " + selectedRow.Company + ", period: " + selectedRow.Period
                    };

                    ctrlTask.AddEntityLinkToGrid(entity)

                    // Force dialogue to close after selection
                    return true;
                };

                TriSysApex.ModalDialogue.Timesheets.Select(fnSelectTimesheet);

                break;

            case sPrefix + 'open-entity' + sSuffix:
                ctrlTask.LinksOpenEntityFromGrid();
                break;

            case sPrefix + 'unlink-entity' + sSuffix:
                ctrlTask.LinksRemoveEntityFromGrid();
                break;

                // 14 Mar 2024: TriSys CRM Entities
            //case sPrefix + 'link-project' +sSuffix:
            //    var fnSelectProject = function (selectedRow)
            //    {
            //        if (!selectedRow)
            //            return;

            //        // Add this new entity record to the grid after selection
            //        var entity = {
            //            Name: "Project",
            //            RecordId: selectedRow.Project_ProjectId,
            //            Description: selectedRow.Placement_Reference + ": " + selectedRow.CandidateContact_FullName + ", " + selectedRow.Placement_JobTitle + " at " + selectedRow.PlacementCompany_Name
            //        };

            //        ctrlTask.AddEntityLinkToGrid(entity)

            //        // Force dialogue to close after selection
            //        return true;
            //    };

            //    TriSysApex.ModalDialogue.Projects.Select(fnSelectProject);

            //    break;

            default:
                TriSysApex.UI.ShowMessage("ToDo")
                break;
        }
    },

    LinksOpenEntityFromGrid: function()
    {
        var sGrid = 'taskForm-LinksGrid';
        var lRecordId = TriSysSDK.Grid.GetSelectedSingletonRowRecordIdFromGrid(sGrid, 'RecordId', "link");
        if (lRecordId > 0)
        {
            // What type of record is it?
            var selectedRows = TriSysSDK.Grid.GetCheckedRows(sGrid);
            var sEntityName = selectedRows[0].Name;

            // Need to close this form and open the entity record
            TriSysApex.UI.CloseModalPopup();
            TriSysApex.FormsManager.OpenForm(sEntityName, lRecordId);
        }
    },

    LinksRemoveEntityFromGrid: function()
    {
        var selectedRows = TriSysSDK.Grid.GetCheckedRows('taskForm-LinksGrid');
        if (selectedRows && selectedRows.length >= 1 && TriSysApex.ModalDialogue.Parameters.Links)
        {
            // Enumerate through all existing rows and remove each selected row and refresh grid
            for (var i = 0; i < selectedRows.length; i++)
            {
                var lRecordId = selectedRows[i].RecordId;
                var sEntityName = selectedRows[i].Name;

                for (var u = 0; u < TriSysApex.ModalDialogue.Parameters.Links.length; u++)
                {
                    var entity = TriSysApex.ModalDialogue.Parameters.Links[u];
                    if (entity.Name == sEntityName && entity.RecordId == lRecordId)
                    {
                        TriSysApex.ModalDialogue.Parameters.Links.splice(u, 1);
                        break;
                    }
                }
            }

            // Refresh grid now
            TriSysApex.ModalDialogue.Task.LoadLinksGrid(TriSysApex.ModalDialogue.Parameters.Links);
        }
    },

    LoadDocumentWidgets: function()
    {
        var sAttachmentFileRef = "taskForm-Attachment-File-Reference";

        var fnFileAttachmentCallback = function (sOperation, divTag, sFilePath)
        {
            switch (sOperation)
            {
                case 'find':
                    // Shall we view this document automatically after upload?

					// Sep 2018 and we have live editing of word documents!
					TriSysApex.Pages.FileManagerForm.FileOpenDrillDown(sFilePath);

                    //var sName = TriSysSDK.Controls.FileManager.GetFileNameFromPath(sFilePath);
                    //TriSysSDK.Controls.FileManager.GetOpenFileURLFromWebService("Task Attachment", sFilePath, sName);
                    break;

                case 'delete':
                    // Not interested in doing anything here
                    break;
            }
        };

        var fieldDescription = { TableFieldName: "Task Attachment", TableName: "Task" };
        TriSysSDK.Controls.FileReference.Load(sAttachmentFileRef, fieldDescription, fnFileAttachmentCallback);
    },

    // Must be called before 'kendo-ising controls
    ConsiderSmallFormFactors: function ()
    {
        var lWidth = $('#taskForm-top-block').width();
        var iMinimumWidthForFullDateTimeVisibility = 550;
        if (lWidth < iMinimumWidthForFullDateTimeVisibility)
        {
            // We are phone-size
            $('#taskForm-TaskTypeContainerForSmallFormFactor-tr').show();
            $("#taskForm-TaskType").detach().appendTo('#taskForm-TaskTypeContainerForSmallFormFactor');
            $('#taskForm-TaskTypeContainerForSmallFormFactor').append("&nbsp;<br />");
            $("#taskForm-Scheduled-group").detach().appendTo('#taskForm-TaskTypeContainerForSmallFormFactor');

            $('#taskForm-StartDateContainerForSmallFormFactor-tr').show();
            $("#taskForm-StartDateTimeSpan").detach().appendTo('#taskForm-StartDateContainerForSmallFormFactor');
            $("#taskForm-StartDateSpan").detach().appendTo('#taskForm-StartDateContainerForSmallFormFactor');

            $('#taskForm-EndDateContainerForSmallFormFactor-tr').show();
            $("#taskForm-EndDateTimeSpan").detach().appendTo('#taskForm-EndDateContainerForSmallFormFactor');
            $("#taskForm-EndDateSpan").detach().appendTo('#taskForm-EndDateContainerForSmallFormFactor');

            $('#taskForm-EndDateContainerForSmallFormFactor').append("&nbsp;<br />");
            $("#taskForm-AllDayTask-group").detach().appendTo('#taskForm-EndDateContainerForSmallFormFactor');
        }
    },

    AddContactToGrid: function (contact, bShowWait)
    {
        if (ctrlTask.Data.DuplicateContactCheck(contact))
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
                    ctrlTask.Data.Contacts().push(CContactReadResponse.Contact);
                    ctrlTask.LoadContactsGrid();
                }
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            if (bShowWait)
                TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('ctrlGrid.AddContactToGrid: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        if (bShowWait)
            TriSysApex.UI.ShowWait(null, "Reading Contact...");

        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    OpenContactFromTaskGrid: function (lContactId)
    {
        if (lContactId > 0)
        {
            // Need to close this form and open the contact
            setTimeout(TriSysApex.UI.CloseModalPopup, 10);

            var fnOpen = function ()
            {
                TriSysApex.FormsManager.OpenForm('Contact', lContactId);
            };

            setTimeout(fnOpen, 250);
        }
    },

    DeleteContactFromTaskGrid: function (lContactId)
    {
        if (lContactId > 0)
        {
            for (var c = 0; c < ctrlTask.Data.Contacts().length; c++)
            {
                var contact = ctrlTask.Data.Contacts()[c];
                if (contact.ContactId == lContactId)
                {
                    ctrlTask.Data.Contacts().splice(c, 1);
                    break;
                }
            }

            ctrlTask.LoadContactsGrid();
        }
    },

    LoadContactsGrid: function (bGetFullContactRecord)
    {
        var contactList = ctrlTask.Data.Contacts();

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
                ctrlTask.AddContactToGrid(contact, false);
            }

            return;
        }

        // New template driven list
        var lstElem = $('#taskForm-contacts-list-container');
        lstElem.empty();
        var iWindowHeight = $(window).height();
        lstElem.height(iWindowHeight * 0.375);

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

            $('#taskForm-contacts-label').html(contactList.length + " Task Contact" + (contactList.length == 1 ? "" : "s"));

            // Fix display
            //TriSysApex.Device.FixTextEllipsesHack('.truncated-contacts-text');

            // Go to bottom if we are 'paging'
            //if (ContactsPhone._CurrentPageNumber > 1)
            //    setTimeout(ContactsPhone.ScrollToBottom, 10);
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

    DeleteUserFromTaskGrid: function (lUserId)
    {
        if (lUserId > 0)
        {
            for (var c = 0; c < ctrlTask.Data.Users().length; c++)
            {
                var user = ctrlTask.Data.Users()[c];
                if (user.UserId == lUserId)
                {
                    ctrlTask.Data.Users().splice(c, 1);
                    break;
                }
            }

            ctrlTask.LoadUsersGrid();
        }
	},

	SetOwner: function(lUserId)
	{
		ctrlTask.Data._Task.OwnerUserId = lUserId;
		ctrlTask.LoadUsersGrid();
	},

    LoadUsersGrid: function ()
    {
        var userList = ctrlTask.Data.Users();

        // New template driven list
        var lstElem = $('#taskForm-users-list-container');
        lstElem.empty();
        var iWindowHeight = $(window).height();
        lstElem.height(iWindowHeight * 0.375);

        if (userList)
        {
            // Sort by Surname
            userList.sort(function (a, b)
            {
                return (a.FullName > b.FullName);
            });

            var fnBuildFromTemplate = function (user)
			{
				var sUserOwnerLabel = user.isOwner ? "(Owner)" : "";
                var sHTML = $("#taskForm-users-template").html();

                sHTML = sHTML.replace(/#:UserId#/g, user.UserId);
				sHTML = sHTML.replace("#:FullName#", user.FullName);
				sHTML = sHTML.replace("#:OwnerUser#", sUserOwnerLabel);
                sHTML = sHTML.replace("#:TelNo#", (user.TelNo ? user.TelNo : ' &nbsp;'));

                return sHTML;
            };

            for (var i = 0; i < userList.length; i++)
            {
				var user = userList[i];

				user.isOwner = false;
				if (user.UserId == ctrlTask.Data._Task.OwnerUserId)
					user.isOwner = true;

                var sHTML = fnBuildFromTemplate(user);

                lstElem.append(sHTML);
            }

            // Nice looking buttons
            TriSysProUI.kendoUI_Overrides();

            $('#taskForm-users-label').html(userList.length + " Task User" + (userList.length == 1 ? "" : "s"));
        }		
    },

    DeleteLinkFromTaskGrid: function (sEntity, lRecordId)
    {
        if (sEntity && lRecordId > 0)
        {
            for (var c = 0; c < ctrlTask.Data.Links().length; c++)
            {
                var link = ctrlTask.Data.Links()[c];
                if (link.Name == sEntity && link.RecordId == lRecordId)
                {
                    ctrlTask.Data.Links().splice(c, 1);
                    break;
                }
            }

            ctrlTask.LoadLinksGrid();
        }
    },

    AddEntityLinkToGrid: function (entity)
    {
        ctrlTask.Data.Links().push(entity);
        ctrlTask.LoadLinksGrid();
    },

    OpenLinkFromTaskGrid: function(sEntity, lRecordId)
    {
        // Need to close this form and open the entity record
        TriSysApex.UI.CloseModalPopup();
        TriSysApex.FormsManager.OpenForm(sEntity, lRecordId);
    },

    LoadLinksGrid: function ()
    {
        var linkList = ctrlTask.Data.Links();

        // New template driven list
        var lstElem = $('#taskForm-links-list-container');
        lstElem.empty();
        var iWindowHeight = $(window).height();
        lstElem.height(iWindowHeight * 0.375);

        if (linkList)
        {
            var fnBuildFromTemplate = function (link)
            {
                var sHTML = $("#taskForm-links-template").html();

                sHTML = sHTML.replace(/#:Entity#/g, link.Name);
                sHTML = sHTML.replace(/#:RecordId#/g, link.RecordId);
                sHTML = sHTML.replace(/#:Description#/g, link.Description);

                return sHTML;
            };

            for (var i = 0; i < linkList.length; i++)
            {
                var link = linkList[i];
                var sHTML = fnBuildFromTemplate(link);

                lstElem.append(sHTML);
            }

            // Nice looking buttons
            TriSysProUI.kendoUI_Overrides();

            $('#taskForm-links-label').html(linkList.length + " Task Link" + (linkList.length == 1 ? "" : "s"));
        }		
    },

    // Store the current task to allow the task dialogue to have multiple layers
    Data:   // ctrlTask.Data
    {
        _EmptyTask: { TaskId: 0, Contacts: [], Users: [], Links: [] },

        _Task: { TaskId: 0, Contacts: [], Users: [], Links: [] },   //ctrlTask.Data._EmptyTask,

        Clear: function()
        {
            ctrlTask.Data._Task = ctrlTask.Data._EmptyTask;
        },

        Contacts: function ()        // ctrlTask.Data.Contacts()
        {
            if (!ctrlTask.Data._Task.Contacts)
                ctrlTask.Data._Task.Contacts = [];

            return ctrlTask.Data._Task.Contacts;
        },

        Users: function ()        // ctrlTask.Data.Users()
        {
            if (!ctrlTask.Data._Task.Users)
                ctrlTask.Data._Task.Users = [];

            return ctrlTask.Data._Task.Users;
        },

        Links: function ()        // ctrlTask.Data.Links()
        {
            if (!ctrlTask.Data._Task.Links)
                ctrlTask.Data._Task.Links = [];

            return ctrlTask.Data._Task.Links;
        },

        SetTask: function (task)
        {
            if (!task.Links)
                task.Links = [];

            ctrlTask.Data._Task = task;
        },

        // Return true if duplicate found
        DuplicateContactCheck: function (contact)
        {
            if (ctrlTask.Data._Task.Contacts)
            {
                for (var i = 0; i < ctrlTask.Data._Task.Contacts.length; i++)
                {
                    var lstContact = ctrlTask.Data._Task.Contacts[i];
                    if (lstContact.ContactId == contact.ContactId)
                        return true;
                }
            }
        },

        DuplicateUserCheck: function (user)
        {
            if (ctrlTask.Data._Task.Users)
            {
                for (var i = 0; i < ctrlTask.Data._Task.Users.length; i++)
                {
                    var lstUser = ctrlTask.Data._Task.Users[i];
                    if (lstUser.UserId == user.UserId)
                        return true;
                }
            }
        }
    }

};  // ctrlTask


// Once we are loaded, initialise the control
$(document).ready(function ()
{
    ctrlTask.Load();
});