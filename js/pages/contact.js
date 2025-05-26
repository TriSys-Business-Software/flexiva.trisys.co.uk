var contactForm = 
{
    Load: function()
    {
        // Form Tabs
        TriSysSDK.EntityFormTabs.AddClickEventHandlers('contact-form-tab-nav-horizontal', true);
        TriSysSDK.Controls.Button.Click('contact-form-tab-personal');

        // Form Menu
        var hideMenuItemPrefixes = ['file-menu-saveas'];
        //TriSysSDK.FormMenus.DrawFileMenu('contactForm-FileMenu', 'contactForm', contactForm.FileMenuCallback, hideMenuItemPrefixes);

        // Actions menus
        var sCallbackFunction = 'contactForm.ActionInvocation';
        var sActionsMenu = "contactForm-ActionsMenu";

        if (TriSysApex.Device.isPhone())
        {
            $('#' + sActionsMenu).hide();
            $('#contactRequirementsActionsMenu').hide();
            $('#contactPlacementsActionsMenu').hide();
        }
        else
        {
            var sMasterEntityCallbackFunction = 'contactForm.ActionInvocationMasterEntity';

            TriSysActions.Menus.Draw(sActionsMenu, 'Contact', sCallbackFunction);
            TriSysActions.Menus.Draw('contactRequirementsActionsMenu', 'Requirement', sCallbackFunction, sMasterEntityCallbackFunction);
            TriSysActions.Menus.Draw('contactPlacementsActionsMenu', 'Placement', sCallbackFunction, sMasterEntityCallbackFunction);

            // 22 Nov 2024: Actions menu should allow more height to show all options
            const fnResizeActionsMenu = function ()
            {
                $('#' + sActionsMenu + ' .dropdown-menu.dropdown-custom > li').css('max-height', ($(window).height() - 100) + 'px');
            };
			setTimeout(fnResizeActionsMenu, 2000);
        }

        var bNoDivReplacement = true;
        TriSysSDK.FormMenus.DrawDropDownMenuFromTemplate('contactForm-CompanyMenu', 'contactForm',
            'ctrlContactCompanyMenu.html', contactForm.CompanyMenuItemCallback, null, bNoDivReplacement);


        // Show standard menus for grids
        var sGrid;

        sGrid = 'contactForm-EducationHistoryGrid';
        //TriSysSDK.FormMenus.DrawGridFileMenu('contactEducationHistoryFileMenu', sGrid, contactForm.EducationHistoryGridFileMenuCallback);
        TriSysSDK.FormMenus.DrawGridMenu('contactEducationHistoryGridMenu', sGrid);

        sGrid = 'contactForm-WorkHistoryGrid';
        //TriSysSDK.FormMenus.DrawGridFileMenu('contactWorkHistoryFileMenu', sGrid, contactForm.WorkHistoryGridFileMenuCallback);
        TriSysSDK.FormMenus.DrawGridMenu('contactWorkHistoryGridMenu', sGrid);

        sGrid = 'contactForm-RequirementsGrid';
        //TriSysSDK.FormMenus.DrawGridFileMenu('contactRequirementsFileMenu', sGrid, contactForm.RequirementGridFileMenuCallback);
        TriSysSDK.FormMenus.DrawGridMenu('contactRequirementsGridMenu', sGrid);

        sGrid = 'contactForm-PlacementsGrid';
        //TriSysSDK.FormMenus.DrawGridFileMenu('contactPlacementsFileMenu', sGrid, contactForm.PlacementGridFileMenuCallback);
        TriSysSDK.FormMenus.DrawGridMenu('contactPlacementsGridMenu', sGrid);

        sGrid = 'contactForm-TimesheetsGrid';
        //TriSysSDK.FormMenus.DrawGridFileMenu('contactPlacementsFileMenu', sGrid, contactForm.PlacementGridFileMenuCallback);
        TriSysSDK.FormMenus.DrawGridMenu('contactTimesheetsGridMenu', sGrid);

        sGrid = 'contactForm-NotesHistoryGrid';
        //TriSysSDK.FormMenus.DrawGridFileMenu('contactNotesHistoryFileMenu', sGrid, contactForm.NotesHistoryGridFileMenuCallback);
        TriSysSDK.FormMenus.DrawGridMenu('contactNotesHistoryGridMenu', sGrid);

        sGrid = 'contactForm-ScheduledTasksGrid';
        //TriSysSDK.FormMenus.DrawGridFileMenu('contactScheduledTasksFileMenu', sGrid, contactForm.ScheduledTaskGridFileMenuCallback);
        TriSysSDK.FormMenus.DrawGridMenu('contactScheduledTasksGridMenu', sGrid);

        // Wire some field descriptions to raise events
        var entityFormFieldDescriptionModifications = [
            {
                TableName: "ContactConfigFields",
                TableFieldName: "ContactPhoto",
                Callback: function (sOperation, divTag, sFilePath)
                {
                    TriSysSDK.Images.FieldDescriptionImageCallback(sOperation, divTag, sFilePath,
                        "ContactConfigFields_ContactPhoto-Thumbnail", "ContactConfigFields_ContactPhoto-Thumbnail2");
                },
                ImageClickEventTargets: ["ContactConfigFields_ContactPhoto-Thumbnail", "ContactConfigFields_ContactPhoto-Thumbnail2"]
            }
        ];

        // CV Manager Labels
        var formattedCVFields = TriSysApex.Cache.SystemSettingManager.FormattedCVFields();
        for (var i = 1; i <= formattedCVFields.length; i++)
        {
            var sCustomisedLabel = formattedCVFields[i - 1];
            var sLabel = "ClientCV" + i + "Label";
            $('#' + sLabel).html(sCustomisedLabel);
        }

        // Data oriented code
        var sFormName = "Contact";

        // 01 Apr 2021: Custom fields tab
        TriSysSDK.CShowForm.CustomFieldsTab.Load("contact-form-customfields", "contact-form-tab-custom-caption",
                                                    sFormName);

        // Tell CShowForm that we are initialised and it can customise the widgets
        TriSysSDK.CShowForm.InitialiseFields(sFormName, entityFormFieldDescriptionModifications);

        // See TriSysApex.Contacts.Load which is specified in forms.json for actual data read

        // CV Manager
        TriSysSDK.Controls.CVManager.Load('ContactConfigFields_CVFileRef', true);
        for (var i = 1; i <= TriSysSDK.Controls.CVManager.MaxFormattedCVs; i++)
        {
            var sField = "ContactConfigFields_FormattedCVFileRef" + i;
            TriSysSDK.Controls.CVManager.Load(sField, false, i);
        }

        // Identification comments
        TriSysSDK.Controls.TextBoxDropDown.Load('ContactConfigFields_IdentificationComments');

        // Social network shortcuts
        contactForm.SocialNetworkShortcuts();

        // Job title no-cache 
        if (!TriSysSDK.CShowForm.JobTitlesCached())
        {
            $('#tr-Contact_JobTitle').show();

            // Capture enter key to do lookup
            $('#Contact_JobTitle').keyup(function (e)
            {
                if (e.keyCode == 13)
                    contactForm.JobTitleLookup();
            });
        }

        // Countries
        TriSysWebJobs.CandidateRegistration.LoadCountryLookup("Contact_HomeAddressCountry");

		// Be clever with age
        // Subscribe to DoB field change events in order to calculate the age
        TriSysApex.FieldEvents.AddDateChangeFieldOfInterest('Contact_DateOfBirth', contactForm.CalculateAge);

        // References
        TriSysSDK.References.Load("contactForm-References");

        // 27 Jan 2023: Hover menu for photograph
        contactForm.HoverPhotoFunctionality();

        // 14 Dec 2023: Master/Detail task grids
        //TriSysApex.Forms.EntityForm.DrawMasterDetailTaskGridAndForm({ EntityName: 'Contact', ControlID: 'contact-form-master-detail-notes' });      // Note/History
        //TriSysApex.Forms.EntityForm.DrawMasterDetailTaskGridAndForm();    // Scheduled Tasks
        if(TriSysApex.Environment.isDeployedInTestMode())
        {
            $('#contact-form-tab-master-detail-notes').show();
        }
    },

	// Called after record is loaded
	PostLoadRecord: function(lContactId)
	{
		var sType = TriSysSDK.CShowForm.GetTextFromCombo("Contact_Type");
		var sTab = "contact-form-tab-" + (sType == "Candidate" ? "personal" : "employment");

		// Focus on tab, highlight tab, tab focus, focus tab, tabfocus, focustab, tab click, tabclick	* your future self will thank you! - I did 30 Nov 2022 ;-)
		TriSysSDK.Controls.Button.Click(sTab);

        // Oct 2020
		TriSysSDK.References.LoadContactReferences(lContactId);
	},

    TabButtonCallback: function(sTabID)
    {
        switch (sTabID)
        {
            case 'contact-form-panel-employment':
                // Make both buttons the same width to look nicer!
                var lWidth = $('#contactForm-OpenMaps').width();
                $('#contact-company-menu-contactForm').width(lWidth);
                break;

            case 'contact-form-panel-attributes':
                if (TriSysApex.Forms.EntityForm.isGridPopulated("Contact", sTabID))
                    return;

                TriSysSDK.Attributes.Load("Contact", TriSysApex.Pages.ContactForm.ContactId, 'contact-form-attributes');
                TriSysApex.Pages.ContactForm.LoadEducationHistory('contactForm-EducationHistoryGrid', null);
                TriSysApex.Pages.ContactForm.LoadWorkHistory('contactForm-WorkHistoryGrid', null);
                break;

            case 'contact-form-panel-social-networks':
                if (TriSysApex.Forms.EntityForm.isGridPopulated("Contact", sTabID))
                    return;

                TriSysSDK.SocialNetworks.Populate(TriSysApex.Pages.ContactForm.ContactId);
                break;

            case 'contact-form-panel-requirements':
                TriSysApex.Pages.ContactForm.LoadRequirementsGrid('contactForm-RequirementsGrid', null);
                break;

            case 'contact-form-panel-placements':
                TriSysApex.Pages.ContactForm.LoadPlacementsGrid('contactForm-PlacementsGrid', null);
                break;

            case 'contact-form-panel-timesheets':
                TriSysApex.Pages.ContactForm.LoadTimesheetsGrid('contactForm-TimesheetsGrid', null);
                break;

            case 'contact-form-panel-documentlibrary':
                if (TriSysApex.Forms.EntityForm.isGridPopulated("Contact", sTabID))
                    return;

                TriSysSDK.DocumentLibrary.Load("Contact", TriSysApex.Pages.ContactForm.ContactId, 'contact-form-documentlibrary');
                break;

            case 'contact-form-panel-noteshistory':
                TriSysApex.Pages.ContactForm.LoadNotesHistoryGrid('contactForm-NotesHistoryGrid', null);
                break;
            case 'contact-form-panel-scheduledtasks':
                TriSysApex.Pages.ContactForm.LoadScheduledTasksGrid('contactForm-ScheduledTasksGrid', null);
				break;

			case 'contact-form-panel-privacy':
				contactForm.LoadPrivacyAndGDPR();
				break;

			case 'contact-form-panel-amendments':
				contactForm.LoadAmendmentsGrid('contactForm-AmendmentsGrid');
				break;

			case 'contact-form-panel-relationships':			
				TriSysSDK.Relationships.Load("contact-relationships-grid-container", "Contact", function()
				{
					TriSysSDK.Relationships.LoadRelationships("Contact", TriSysApex.Pages.ContactForm.ContactId);
				});
				break;

			case 'contact-form-panel-back-office':			
				TriSysSDK.BackOffice.Load("contact-form-bank-details", "Contact", function()
				{
					TriSysSDK.BackOffice.LoadBankDetails("Contact", TriSysApex.Pages.ContactForm.ContactId);
				});
				break;

            case 'contact-form-panel-master-detail-notes':      // 20 Dec 2023
                debugger;
                var options = {
                    EntityName: 'Contact',
                    TabID: sTabID,
                    ControlID: 'contact-form-master-detail-notes',
                    RecordId: TriSysApex.Pages.ContactForm.ContactId,
                    Scheduled: false,
                    CallbackFunctionOnLoad: function () { TriSysApex.Forms.EntityForm.PopulateMasterDetailTaskGridAndForm(options); },
                    HideOpenButton: true
                };
                TriSysApex.Forms.EntityForm.DrawMasterDetailTaskGridAndForm(options);
                //TriSysApex.Forms.EntityForm.PopulateMasterDetailTaskGridAndForm(options);
                break;
        }
    },

    CompanyMenuItemCallback: function(sID)
    {
        var sSuffix = '-contactForm';

        // Just do nothing
        var lContactId = TriSysApex.Pages.ContactForm.ContactId;
        if (lContactId <= 2)
        {
            var sMessage = "You are not permitted to use this menu for this record.";
            TriSysApex.UI.ShowMessage(sMessage);
            return;
        }

        switch (sID)
        {
            case 'contact-company-menu-view' + sSuffix:
                TriSysApex.Pages.ContactForm.OpenCompanyLink();
                break;

            case 'contact-company-menu-reassign' + sSuffix:
                TriSysApex.Pages.ContactForm.SelectCompany();
                break;

            case 'contact-company-menu-clear' + sSuffix:
                var sMessage = "Are you sure you wish to unlink this company from this contact?";
                TriSysApex.UI.questionYesNo(sMessage, "Clear Company Link",
                                "Yes", TriSysApex.Pages.ContactForm.ClearCompanyLink,
                                "No");
                break;

            case 'contact-company-menu-select-existing-address' + sSuffix:
                TriSysApex.Pages.ContactForm.SelectCompanyAddress();
                break;

            case 'contact-company-menu-newaddress' + sSuffix:
                TriSysApex.Pages.ContactForm.NewCompanyAddress();
                break;

            case 'contact-company-menu-newcompany' + sSuffix:
                TriSysApex.Pages.ContactForm.NewCompany();
                break;
        }
    },

    FileMenuCallback: function(sFileMenuID)
    {
        var fm = TriSysSDK.FormMenus.Constants;

        switch (sFileMenuID)
        {
            case fm.File_New:
                TriSysApex.Pages.ContactForm.NewRecord();
                break;
            case fm.File_Open:
                TriSysApex.Pages.ContactForm.OpenFindDialogue();
                break;
            case fm.File_Save:
                TriSysApex.Pages.ContactForm.SaveRecord();
                break;
            case fm.File_Save_As:
                TriSysApex.UI.ShowMessage("Save Contact As");
                break;
            case fm.File_Delete:
                TriSysApex.Pages.ContactForm.DeleteRecord();
                break;
            case fm.File_Close:
                TriSysApex.FormsManager.CloseCurrentForm();     // TODO: Dirty check!
                break;
        }
    },

    PostCodeLookup: function()
    {
        TriSysSDK.PostCode.Lookup('Contact_HomeAddressPostCode',
                                    'Contact_HomeAddressStreet',
                                    'Contact_HomeAddressCity',
                                    'Contact_HomeAddressCounty',
                                    'Contact_HomeAddressCountry');
    },

    NotesHistoryGridFileMenuCallback: function(sFileMenuID)
    {
        contactForm.TaskGridFileMenuCallback(sFileMenuID, 'contactForm-NotesHistoryGrid', false);    
    },

    ScheduledTaskGridFileMenuCallback: function(sFileMenuID)
    {
        contactForm.TaskGridFileMenuCallback(sFileMenuID, 'contactForm-ScheduledTasksGrid', true);
    },

    TaskGridFileMenuCallback: function(sFileMenuID, sGrid, bScheduled)
    {
        var fm = TriSysSDK.FormMenus.Constants;
        var lTaskId = null;

        switch (sFileMenuID)
        {
            case fm.File_New:
                contactForm.NewTask(bScheduled)
                break;

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

    NewTask: function(bScheduled)
    {
        var params = new TriSysApex.ModalDialogue.Task.ShowParameters();
        params.Scheduled = bScheduled;
        var contact = {
            ContactId: TriSysApex.Pages.ContactForm.ContactId,
            FullName: $('#Contact_Forenames').val() + ' ' + $('#Contact_Surname').val(),
            CompanyName: $('#Contact_CompanyName').val(),
            JobTitle: TriSysSDK.CShowForm.GetJobTitleFromField("Contact_JobTitle"),
            ContactType: TriSysSDK.CShowForm.GetTextFromCombo("Contact_Type")
        };
        params.Contacts.push(contact);
        TriSysApex.ModalDialogue.Task.Show(params);
    },

    EducationHistoryGridFileMenuCallback: function(sFileMenuID)
    {
        var fm = TriSysSDK.FormMenus.Constants;
        var sGrid = 'contactForm-EducationHistoryGrid';
        var lEducationHistoryId = TriSysSDK.Grid.GetSelectedSingletonRowRecordIdFromGrid(sGrid, "ContactEducationHistoryId", "education history", false);

        switch (sFileMenuID)
        {
            case fm.File_New:
                TriSysApex.ModalDialogue.ContactEducationHistory.Show(0);
                break;

            case fm.File_Open:
                if (lEducationHistoryId > 0)
                    TriSysApex.ModalDialogue.ContactEducationHistory.Show(lEducationHistoryId);
                break;

            case fm.File_Delete:
                if (lEducationHistoryId > 0)
                    TriSysApex.ModalDialogue.ContactEducationHistory.Delete(lEducationHistoryId);
                break;
        }
    },

    WorkHistoryGridFileMenuCallback: function(sFileMenuID)
    {
        var fm = TriSysSDK.FormMenus.Constants;
        var sGrid = 'contactForm-WorkHistoryGrid';
        var lWorkHistoryId = TriSysSDK.Grid.GetSelectedSingletonRowRecordIdFromGrid(sGrid, "ContactWorkHistoryId", "work history", false);

        switch (sFileMenuID)
        {
            case fm.File_New:
                TriSysApex.ModalDialogue.ContactWorkHistory.Show(0);
                break;

            case fm.File_Open:
                if (lWorkHistoryId > 0)
                    TriSysApex.ModalDialogue.ContactWorkHistory.Show(lWorkHistoryId);
                break;

            case fm.File_Delete:
                if (lWorkHistoryId > 0)
                    TriSysApex.ModalDialogue.ContactWorkHistory.Delete(lWorkHistoryId);
                break;
        }
    },

    RequirementGridFileMenuCallback: function (sFileMenuID)
    {
        var fm = TriSysSDK.FormMenus.Constants;
        var sGrid = 'contactForm-RequirementsGrid';
        var lRequirementId = TriSysSDK.Grid.GetSelectedSingletonRowRecordIdFromGrid(sGrid, "Requirement_RequirementId", "requirement", false);

        switch (sFileMenuID)
        {
            case fm.File_New:
                TriSysApex.Pages.RequirementForm.NewRecord(TriSysApex.Pages.ContactForm.ContactId);
                break;

            case fm.File_Open:
                if (lRequirementId > 0)
                    TriSysApex.FormsManager.OpenForm("Requirement", lRequirementId);
                break;

            case fm.File_Delete:
                if (lRequirementId > 0)
                {
                    var sReference = TriSysSDK.Grid.GetSelectedSingletonRowFieldValueFromGrid(sGrid, 'Requirement_RequirementReference');
                    var sCompany = TriSysSDK.Grid.GetSelectedSingletonRowFieldValueFromGrid(sGrid, 'RequirementCompany_Name');
                    var sJobTitle = TriSysSDK.Grid.GetSelectedSingletonRowFieldValueFromGrid(sGrid, 'Requirement_JobTitle');

                    var fnAfterDelete = function () {
                        // Refresh the grid
                        TriSysSDK.Grid.ClearCheckedRows(sGrid);
                        TriSysSDK.Grid.RefreshData(sGrid);
                    };

                    TriSysApex.Pages.RequirementForm.DeleteRecord(lRequirementId, sReference, sCompany, sJobTitle, fnAfterDelete);
                }
                break;
        }
    },

    PlacementGridFileMenuCallback: function (sFileMenuID)
    {
        var fm = TriSysSDK.FormMenus.Constants;
        var sGrid = 'contactForm-PlacementsGrid';
        var lPlacementId = TriSysSDK.Grid.GetSelectedSingletonRowRecordIdFromGrid(sGrid, "Placement_PlacementId", "placement", false);

        switch (sFileMenuID)
        {
            case fm.File_New:
                TriSysApex.Pages.PlacementForm.NewRecord(TriSysApex.Pages.ContactForm.ContactId);
                break;

            case fm.File_Open:
                if (lPlacementId > 0)
                    TriSysApex.FormsManager.OpenForm("Placement", lPlacementId);
                break;

            case fm.File_Delete:
                if (lPlacementId > 0) {
                    var sReference = TriSysSDK.Grid.GetSelectedSingletonRowFieldValueFromGrid(sGrid, 'Placement_Reference');
                    var sCompany = TriSysSDK.Grid.GetSelectedSingletonRowFieldValueFromGrid(sGrid, 'PlacementCompany_Name');
                    var sCandidate = TriSysSDK.Grid.GetSelectedSingletonRowFieldValueFromGrid(sGrid, 'CandidateContact_FullName');
                    var sJobTitle = TriSysSDK.Grid.GetSelectedSingletonRowFieldValueFromGrid(sGrid, 'Placement_JobTitle');

                    var fnAfterDelete = function () {
                        // Refresh the grid
                        TriSysSDK.Grid.ClearCheckedRows(sGrid);
                        TriSysSDK.Grid.RefreshData(sGrid);
                    };

                    TriSysApex.Pages.PlacementForm.DeleteRecord(lPlacementId, sReference, sCompany, sCandidate, sJobTitle, fnAfterDelete);
                }
                break;
        }
    },

    SocialNetworkShortcuts: function()
    {
        // TODO: Work out which social buttons should be enabled based upon availability
        var bPhone = TriSysApex.Device.isPhone();

        // Button handlers
        var fnViewLinkedInButtonCallback = function ()
        {
            TriSysSDK.SocialNetworks.OpenSocialNetworkProfile(TriSysSDK.SocialNetworks.LinkedIn, TriSysApex.Pages.ContactForm.ContactId);
        };
        var sButtonID = 'contactForm-view-linkedin-profile';
        $('#' + sButtonID).unbind();
        $('#' + sButtonID).click(fnViewLinkedInButtonCallback);
        if (bPhone)
            $('#' + sButtonID).hide();

        var fnViewFacebookButtonCallback = function ()
        {
            TriSysSDK.SocialNetworks.OpenSocialNetworkProfile(TriSysSDK.SocialNetworks.Facebook, TriSysApex.Pages.ContactForm.ContactId);
        };
        sButtonID = 'contactForm-view-facebook-profile';
        $('#' + sButtonID).unbind();
        $('#' + sButtonID).click(fnViewFacebookButtonCallback);
        if (bPhone)
            $('#' + sButtonID).hide();

        var fnViewTwitterButtonCallback = function ()
        {
            TriSysSDK.SocialNetworks.OpenSocialNetworkProfile(TriSysSDK.SocialNetworks.Twitter, TriSysApex.Pages.ContactForm.ContactId);
        };
        sButtonID = 'contactForm-view-twitter-profile';
        $('#' + sButtonID).unbind();
        $('#' + sButtonID).click(fnViewTwitterButtonCallback);
        if (bPhone)
            $('#' + sButtonID).hide();

        var fnViewPreviewButtonCallback = function ()
        {
            debugger;
            TriSysApex.EntityPreview.Contact.Open(TriSysApex.Pages.ContactForm.ContactId);
        };
        sButtonID = 'contactForm-view-preview';
        $('#' + sButtonID).unbind();
        $('#' + sButtonID).click(fnViewPreviewButtonCallback);
        if (bPhone)
            $('#' + sButtonID).hide();
    },
    
    // Called when a user runs an action from any menu.
    ActionInvocation: function(sEntityName)
    {
        switch(sEntityName)
        {
            case "Contact":
                var contactIds = [TriSysApex.Pages.ContactForm.ContactId];
                return contactIds;

            case "Requirement":
                var requirementIds = TriSysSDK.Grid.GetSelectedMultipleRowsFromGrid('contactForm-RequirementsGrid', "Requirement_RequirementId");
                return requirementIds;

            case "Placement":
                var placementIds = TriSysSDK.Grid.GetSelectedMultipleRowsFromGrid('contactForm-PlacementsGrid', "Placement_PlacementId");
                return placementIds;
        }
    },

    // To handle situation where we run an action against a grid on this form
    ActionInvocationMasterEntity: function()
    {
        var masterEntity = { EntityName: 'Contact', EntityId: TriSysApex.Pages.ContactForm.ContactId };
        return masterEntity;
    },

    JobTitleLookup: function()
    {
        var sJobTitleField = 'Contact_JobTitle';
        var sJobTitle = TriSysSDK.CShowForm.GetJobTitleFromField(sJobTitleField);
        TriSysSDK.JobTitle.Lookup(sJobTitle, sJobTitleField);
    },

    // Open one of the CV's of the current candidate.
    // Routed here from the Office AddIn which opens the contact.
    // If only 1 CV available, then display it, else offer user a choice.
    //
    OpenCV: function(lContactId)
    {
        // We may get called BEFORE the contact is loaded, in which case wait until the load is complete
        if (TriSysApex.Pages.ContactForm.ContactId == lContactId)
        {
            setTimeout(contactForm.OpenCVWhenContactDetailsDisplayed, 1000);
            return;
        }

        // Set a timer to call us back in half a second until record is loaded
        setTimeout(function ()
        {
            contactForm.OpenCV(lContactId);

        }, 500);
    },

    OpenCVWhenContactDetailsDisplayed: function()
    {
        var CVFileRef = TriSysSDK.Controls.CVManager.GetCVPath("ContactConfigFields_CVFileRef");
        var FormattedCVFileRef1 = TriSysSDK.Controls.CVManager.GetCVPath("ContactConfigFields_FormattedCVFileRef1");
        var FormattedCVFileRef2 = TriSysSDK.Controls.CVManager.GetCVPath("ContactConfigFields_FormattedCVFileRef2");
        var FormattedCVFileRef3 = TriSysSDK.Controls.CVManager.GetCVPath("ContactConfigFields_FormattedCVFileRef3");
        var FormattedCVFileRef4 = TriSysSDK.Controls.CVManager.GetCVPath("ContactConfigFields_FormattedCVFileRef4");

        if (CVFileRef && !CVFileRef.DocumentPath)
            CVFileRef = null;
        if (FormattedCVFileRef1 && !FormattedCVFileRef1.DocumentPath)
            FormattedCVFileRef1 = null;
        if (FormattedCVFileRef2 && !FormattedCVFileRef2.DocumentPath)
            FormattedCVFileRef2 = null;
        if (FormattedCVFileRef3 && !FormattedCVFileRef3.DocumentPath)
            FormattedCVFileRef3 = null;
        if (FormattedCVFileRef4 && !FormattedCVFileRef4.DocumentPath)
            FormattedCVFileRef4 = null;

        var bFormattedCVs = (FormattedCVFileRef1 || FormattedCVFileRef2 || FormattedCVFileRef3 || FormattedCVFileRef4);
        var bNoCVs = (!CVFileRef && !bFormattedCVs);
        if(bNoCVs)
        {
            TriSysApex.UI.ShowMessage("This contact has no assigned CV's to open.");
            return;
        }

        if(CVFileRef && !bFormattedCVs)
        {
            // Only the original CV to show
			var sCVFileRef = CVFileRef.DocumentPath;
            // Sep 2018 and we have live editing of word documents!
			TriSysApex.Pages.FileManagerForm.FileOpenDrillDown(sCVFileRef);
            //var sName = TriSysSDK.Controls.FileManager.GetFileNameFromPath(sCVFileRef);
            //TriSysSDK.Controls.FileManager.GetOpenFileURLFromWebService("TriSys CV Viewer", sCVFileRef, sName);
            return;
        }

        // This contact has multiple CV's, so ask the user which one is to be shown
        var sClientCV1Label = $('#ClientCV1Label').text();
        var sClientCV2Label = $('#ClientCV2Label').text();
        var sClientCV3Label = $('#ClientCV3Label').text();
        var sClientCV4Label = $('#ClientCV4Label').text();

        var sOriginal = "Original";
        var options = [];
        if (CVFileRef)
            options.push({ Name: sOriginal });

        if (FormattedCVFileRef1)
            options.push({ Name: sClientCV1Label });
        if (FormattedCVFileRef2)
            options.push({ Name: sClientCV2Label });
        if (FormattedCVFileRef3)
            options.push({ Name: sClientCV3Label });
        if (FormattedCVFileRef4)
            options.push({ Name: sClientCV4Label });

        var fnPopulateButtons = function (parametersObject, sGridDivID)
        {
            parametersObject.ButtonLeftVisible = false;
            parametersObject.ButtonRightText = "Close";
            parametersObject.ButtonRightVisible = true;
        };

        var fnPopulateGrid = function (sGridID)
        {
            TriSysSDK.Grid.VirtualMode({
                Div: sGridID,
                ID: "grdCVLabels",
                RecordsPerPage: 10,
                PopulationByObject: options,
                Columns: [
                    { field: "Name", title: "CV Label", type: "string" }
                    ],
                KeyColumnName: "Name",
                DrillDownFunction: function (rowData)
                {
                    TriSysApex.UI.CloseModalPopup();

                    var sCVFieldLabel = rowData.Name;
                    var sCV = CVFileRef.DocumentPath;

                    switch(sCVFieldLabel)
                    {
                        case sClientCV1Label:
                            sCV = FormattedCVFileRef1.DocumentPath;
                            break;
                        case sClientCV2Label:
                            sCV = FormattedCVFileRef2.DocumentPath;
                            break;
                        case sClientCV3Label:
                            sCV = FormattedCVFileRef3.DocumentPath;
                            break;
                        case sClientCV4Label:
                            sCV = FormattedCVFileRef4.DocumentPath;
                            break;
                    }

                    if(sCV)
                    {
						// Sep 2018 and we have live editing of word documents!
						TriSysApex.Pages.FileManagerForm.FileOpenDrillDown(sCV);
                        //var sName = TriSysSDK.Controls.FileManager.GetFileNameFromPath(sCV);
                        //TriSysSDK.Controls.FileManager.GetOpenFileURLFromWebService("TriSys CV Viewer", sCV, sName);
                        return;
                    }
                },
                MultiRowSelect: false,
                Grouping: false,
                ColumnFilters: true
            });
        };

        TriSysApex.ModalDialogue.Grid.Show("Select CV to Open", null, fnPopulateButtons, fnPopulateGrid, { CloseTopRightButton: true });

    },

    TimesheetGridFileMenuCallback: function(sFileMenuID)
    {
        var fm = TriSysSDK.FormMenus.Constants;
        var sGrid = 'contactForm-TimesheetsGrid';
        var sKeyField = 'Timesheet_TimesheetId';
        var sWhat = 'Timesheet';

        switch (sFileMenuID)
        {
            case fm.File_Open:
                var lTimesheetId = TriSysSDK.Grid.GetSelectedSingletonRowRecordIdFromGrid(sGrid, sKeyField, sWhat);
                if (lTimesheetId > 0)
                    TriSysApex.FormsManager.OpenForm("Timesheet", lTimesheetId);
                break;

            case fm.File_Delete:
                var lTimesheetId = TriSysSDK.Grid.GetSelectedSingletonRowRecordIdFromGrid(sGrid, sKeyField, sWhat);
                if (lTimesheetId > 0)
                {
                    TriSysApex.UI.ShowMessage("ToDo");
                }
                break;
        }
    },    

    EditComments: function ()
    {
        var txt = $('#Contact_Comments');
        var sComments = txt.val();

        var fnEditedComments = function (sText)
        {
            txt.val(sText);
            return true;
        };

        var options = {
            Label: "Comments",
            Value: sComments
        };
        TriSysApex.ModalDialogue.BigEdit.Popup("Edit Contact " + options.Label, "gi-pen", fnEditedComments, options);
	},

	// Called when use changes the ContactConfigFields_UmbrellaReference combo value
	UmbrellaReferenceChange: function (sPayrollCompany)
	{
		var bLimitedCompany = (sPayrollCompany == "Limited Company");
		var tr = $('#contact-form-limited-company-tr');
		bLimitedCompany ? tr.show() : tr.hide();
	},

	LoadPrivacyAndGDPR: function()
	{
		var privacySettings = {};
		contactForm.DisplayPrivacyAndGDPR(privacySettings);

		var CReadContactPrivacySettingsRequest = { ContactId: TriSysApex.Pages.ContactForm.ContactId };

		var payloadObject = {};
		payloadObject.OutboundDataPacket = CReadContactPrivacySettingsRequest;
		payloadObject.URL = 'Contact/ReadPrivacySettings';
		payloadObject.InboundDataFunction = function (CReadContactPrivacySettingsResponse)
		{
			//TriSysApex.UI.HideWait();

			if (CReadContactPrivacySettingsResponse) {
				if (CReadContactPrivacySettingsResponse.Success)
				{
					contactForm.DisplayPrivacyAndGDPR(CReadContactPrivacySettingsResponse);
				}
				else
					TriSysApex.UI.ShowMessage(CReadContactPrivacySettingsResponse.ErrorMessage, TriSysWebJobs.Constants.ApplicationName);
			}
		};

		payloadObject.ErrorHandlerFunction = function (request, status, error) {
			//TriSysApex.UI.HideWait();
			TriSysApex.UI.errorAlert('contactForm.LoadPrivacyAndGDPR: ' + status + ": " + error + ". responseText: " + request.responseText);
		};

		//TriSysApex.UI.ShowWait(null, "Reading Privacy/GDPR...");

		TriSysAPI.Data.PostToWebAPI(payloadObject);
	},

	DisplayPrivacyAndGDPR: function(privacySettings)
	{
		if (!privacySettings)
			return;

		TriSysSDK.CShowForm.SetCheckBoxValue('contactForm-GDPRAutomatedNotificationEMailSent', privacySettings.GDPRAutomatedNotificationEMailSent);
		TriSysSDK.CShowForm.SetCheckBoxValue('contactForm-AgreeToPrivacyPolicy', privacySettings.AgreeToPrivacyPolicy);
		TriSysSDK.CShowForm.SetCheckBoxValue('contactForm-AgreeToMarketingCommunications', privacySettings.AgreeToMarketingCommunications);
		TriSysSDK.CShowForm.SetCheckBoxValue('contactForm-GDPRRestrictDataProcessing', privacySettings.GDPRRestrictDataProcessing);
		TriSysSDK.CShowForm.SetCheckBoxValue('contactForm-GDPRDeletionRequestReceived', privacySettings.GDPRDeletionRequestReceived);
		TriSysSDK.CShowForm.SetCheckBoxValue('contactForm-GDPRDataPortabilityRequestReceived', privacySettings.GDPRDataPortabilityRequestReceived);

		contactForm.DisplayDateField('contactForm-DateGDPRAutomatedNotificationEMailSent', privacySettings.DateGDPRAutomatedNotificationEMailSent);
		contactForm.DisplayDateField('contactForm-DateAgreedToPrivacyPolicy', privacySettings.DateAgreedToPrivacyPolicy);
		contactForm.DisplayDateField('contactForm-DateAgreedToMarketingCommunications', privacySettings.DateAgreedToMarketingCommunications);
		contactForm.DisplayDateField('contactForm-DateSignedGDPRRestrictDataProcessing', privacySettings.DateSignedGDPRRestrictDataProcessing);
		contactForm.DisplayDateField('contactForm-DateGDPRDeletionRequestReceived', privacySettings.DateGDPRDeletionRequestReceived);
		contactForm.DisplayDateField('contactForm-DateGDPRDataPortabilityRequestReceived', privacySettings.DateGDPRDataPortabilityRequestReceived);
	},

	DisplayDateField: function(sField, dtValue)
	{
		var sDisplay = '';
		if (dtValue)
		{
			var dt = new Date(dtValue);
			sDisplay = dt.getFullYear() <= 1 ? '' : moment(dt).format("dddd DD MMMM YYYY");
		}

		$('#' + sField).html(sDisplay);
	},

	// Fired if our office editor has edited a document which may be displayed on this form.
	FileUpdated: function(sFilePath)
	{
		// Strip folder and filename e.g. CVData\C\CV.docx
		var parts = sFilePath.split("\\");
		var sUpdatedFilePath = parts[parts.length-3] + "\\" + parts[parts.length-2] + "\\" + parts[parts.length-1];
		sUpdatedFilePath = sUpdatedFilePath.toLowerCase();

		// Get the full paths of all Office document fields which could be editable
		var editableFields = [
			{ file: 'ContactConfigFields_CVFileRef', lastUpdated: 'ContactConfigFields_CVLastUpdated' },
			{ file: 'ContactConfigFields_FormattedCVFileRef1', lastUpdated: 'ContactConfigFields_FormattedCV1LastUpdated' },
			{ file: 'ContactConfigFields_FormattedCVFileRef2', lastUpdated: 'ContactConfigFields_FormattedCV2LastUpdated' },
			{ file: 'ContactConfigFields_FormattedCVFileRef3', lastUpdated: 'ContactConfigFields_FormattedCV3LastUpdated' },
			{ file: 'ContactConfigFields_FormattedCVFileRef4', lastUpdated: 'ContactConfigFields_FormattedCV4LastUpdated' }
		];

		editableFields.forEach(function(field)
		{
			var cv = TriSysSDK.Controls.CVManager.GetCVPath(field.file);
			if (cv)
			{
			    if (cv.DocumentPath)
			    {
                    // Strip folder and filename e.g. CVData\C\CV.docx
				    parts = cv.DocumentPath.split("\\");
				    var sCVPath = parts[parts.length-3] + "\\" + parts[parts.length-2] + "\\" + parts[parts.length-1];
				    sCVPath = sCVPath.toLowerCase();

				    if(sCVPath == sUpdatedFilePath)
				    {
					    TriSysSDK.CShowForm.setDatePickerValue(field.lastUpdated, new Date());

					    // Update database silently also
					    parts = field.lastUpdated.split("_");
					    contactForm.UpdateCVDateInDatabaseStampAfterFileSave(TriSysApex.Pages.ContactForm.ContactId, parts[1]);

					    // Show the date that this record was updated?
					    TriSysSDK.CShowForm.setDatePickerValue('Contact_DateLastUpdated', new Date());
				    }
			    }				
			}
		});
	},

	UpdateCVDateInDatabaseStampAfterFileSave: function(lContactId, sField)
	{
		var payloadObject = {};

        payloadObject.URL = "ContactCV/UpdatedCVByFileEditor";

		var CUpdatedCVByFileEditorRequest = { ContactId: lContactId, FieldName: sField };
        payloadObject.OutboundDataPacket = CUpdatedCVByFileEditorRequest;

        payloadObject.InboundDataFunction = function (CUpdatedCVByFileEditorResponse)
        {
            // Quite frankly we do not care ;-)
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            // Quite frankly we do not care ;-)
        };

        TriSysAPI.Data.PostToWebAPI(payloadObject);
	},

	CalculateAge: function(sTableFieldName, dtValue)
	{
		var dtDateOfBirth = dtValue;
		if(!dtDateOfBirth)
			dtDateOfBirth = TriSysSDK.CShowForm.getDatePickerValue(sTableFieldName);

		var sAge = '';
        var dtNow = new moment(Date());
        var iYears = dtNow.diff(dtDateOfBirth, 'years');
        if(iYears >= 0)
			sAge = '' + iYears;

		$('#Contact_Age').val(sAge);
	},

	LoadAmendmentsGrid: function(sGridId)
	{
		if (TriSysApex.Forms.EntityForm.isGridPopulated("Contact", sGridId))
            return;

        var lContactId = TriSysApex.Pages.ContactForm.ContactId;

        var fnPopulationByFunction = {
            API: "Amendments/ListForEntityRecord",	// The Web API Controller/Function

            // The additional parameters passed into the function not including the paging metrics
            Parameters: function (request)
            {
                request.RecordId = lContactId;
				request.EntityName = "Contact";
            },

            DataTableFunction: function (response)  // Called to get a suitable data table for the grid to display
            {
                return response.List;				// The list of records from the Web API
            }
        };

        var columns = [
                { field: "ApplicationName", title: "App", type: "string", width: 160 },
                { field: "UpdatedBy", title: "Updated By", type: "string", width: 220 },
                { field: "DateChanged", title: "Updated", type: "date", format: "{0:dd MMM yyyy }", width: 110 },
                { field: "FieldName", title: "Field Name", type: "string", width: 220 },
                { field: "OldValue", title: "Old Value", type: "string" },
				{ field: "NewValue", title: "New Value", type: "string" }
        ];

        TriSysSDK.Grid.VirtualMode({
            Div: sGridId,
            ID: sGridId + "-Grid",
            Title: "Amendments",
            RecordsPerPage: TriSysApex.UserOptions.RecordsPerPage(),
			PopulationByFunction: fnPopulationByFunction,
            Columns: columns,

            MobileVisibleColumns: [
                {
                    field: "ApplicationName"
                }
            ],
            MobileRowTemplate: '<td colspan="1"><strong>#: ApplicationName #</strong><br />' +
                            '<i>#: UpdatedBy #</i><br />' +
							'#: DateChanged #<br />' +
							'#: FieldName #<br />' +
							'#: OldValue #<br />' +
							'#: NewValue #' +
							'</td>',

            MultiRowSelect: false,
            Grouping: false,
            ColumnFilters: true
        });
	},

	EditGDPR: function()
	{
	    TriSysApex.WhiteLabelling.LoadJavascriptFile('js/pages/ctrlEditGDPRSettings.js', null,
			function () {
			    var lContactId = TriSysApex.Pages.ContactForm.ContactId;
			    ctrlEditGDPRSettings.Load(lContactId);
			});
	},

	AddNewReference: function()
	{
	    ctrlContactReferenceTable.AddNew();
	},

    // 27 Jan 2023: Make it more intuitive for users to manage the photo
    // by hovering the file picker widget
	HoverPhotoFunctionality: function()
	{
	    try
	    {
	        var sJQueryId = '#contact-form-photo-hovered-buttons-widget';
	        var elemFileRow = $('#contact-form-photo-hovered-buttons-table-row');
	        var elemPhotoFileWidget = $('#ContactConfigFields_ContactPhoto');
	        var elemPhotoFilePathWidget = $('#ContactConfigFields_ContactPhoto-FileReference_FileName');
	        var elemPhotoFileWidgetParentPrevious = elemPhotoFilePathWidget.parent().prev();

	        var fnEnter = function ()
	        {
	            // Move the attributes photo widget into place beneath the photo
	            elemPhotoFileWidgetParentPrevious.css('width', '100%');
	            elemPhotoFileWidgetParentPrevious.css('float', 'middle');
	            elemPhotoFilePathWidget.parent().hide();
	            elemPhotoFileWidget.detach().appendTo(sJQueryId);
	            elemFileRow.show();
	        };

	        var fnLeave = function ()
	        {
	            elemPhotoFileWidget.detach().appendTo('#contact-form-photo-file-tr');
	            elemPhotoFileWidgetParentPrevious.css('width', '120px');
	            elemPhotoFileWidgetParentPrevious.css('float', 'right');
	            elemPhotoFilePathWidget.parent().show();
	            elemFileRow.hide();
	        };

	        $('#contact-form-photo-column').hover(fnEnter, fnLeave);
	    }
	    catch (e)
	    {
	        // Found bug 
	        TriSysApex.Logging.LogMessage(TriSysApex.Logging.CatchVariableToText(e));
	    }
	}

};  // contactForm

$(document).ready(function ()
{
    contactForm.Load();
});
