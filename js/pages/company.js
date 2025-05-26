var companyForm =
{
    Load: function()
    {
        // Form Tabs
        TriSysSDK.EntityFormTabs.AddClickEventHandlers('company-form-tab-nav-horizontal', true);
        //TriSysSDK.Controls.Button.Click('company-form-tab-addresses');		// See TriSysApex.Pages.CompanyForm.AfterFormDataLoaded

        // Form Menu
        var hideMenuItemPrefixes = ['file-menu-saveas'];
        //TriSysSDK.FormMenus.DrawFileMenu('companyForm-FileMenu', 'companyForm', companyForm.FileMenuCallback, hideMenuItemPrefixes);

        // Actions menus
        if (TriSysApex.Device.isPhone())
        {
            $('#companyForm-ActionsMenu').hide();
            $('#companyAddressesActionsMenu').hide();
            $('#companyRequirementsActionsMenu').hide();
            $('#companyPlacementsActionsMenu').hide();
        }
        else
        {
            var sCallbackFunction = 'companyForm.ActionInvocation';
            TriSysActions.Menus.Draw('companyForm-ActionsMenu', 'Company', sCallbackFunction);
            TriSysActions.Menus.Draw('companyAddressesActionsMenu', 'Contact', sCallbackFunction);
            TriSysActions.Menus.Draw('companyRequirementsActionsMenu', 'Requirement', sCallbackFunction);
            TriSysActions.Menus.Draw('companyPlacementsActionsMenu', 'Placement', sCallbackFunction);

            // 22 Nov 2024: Actions menus should allow more height to show all options without scrolling
            const fnResizeActionsMenus = function ()
            {
                $('#companyForm-ActionsMenu .dropdown-menu.dropdown-custom > li').css('max-height', ($(window).height() - 100) + 'px');
                const lstActionsMenus = ['companyAddressesActionsMenu', 'companyRequirementsActionsMenu',
                                            'companyPlacementsActionsMenu'];
                lstActionsMenus.forEach(function (sMenuID)
                {
                    var iHeightFactor = $('#company-form-tab-panel-buttons').position().top + 120;
                    $('#' + sMenuID + ' .dropdown-menu.dropdown-custom > li').css('max-height', ($(window).height() - iHeightFactor) + 'px');
                });
            };
            setTimeout(fnResizeActionsMenus, 2000);        
        }

        // Addresses and Contact Specific Menu
        TriSysSDK.FormMenus.DrawDropDownMenuFromTemplate('companyContactMenu', 'companyForm',
            'ctrlCompanyContactMenu.html', companyForm.AddressesGridContactMenuCallback, 'company-contact-menu');

        TriSysSDK.FormMenus.DrawDropDownMenuFromTemplate('companyAddressMenu', 'companyForm',
            'ctrlCompanyAddressMenu.html', companyForm.AddressesGridAddressMenuCallback, 'company-address-menu');

        // Show standard menus for grids
        var sGrid = 'companyForm-AddressesGrid';
        TriSysSDK.FormMenus.DrawGridMenu('companyAddressesGridMenu', sGrid);

        sGrid = 'companyForm-RequirementsGrid';
        //TriSysSDK.FormMenus.DrawGridFileMenu('companyRequirementsFileMenu', sGrid, companyForm.RequirementGridFileMenuCallback);
        TriSysSDK.FormMenus.DrawGridMenu('companyRequirementsGridMenu', sGrid);

        sGrid = 'companyForm-PlacementsGrid';
        //TriSysSDK.FormMenus.DrawGridFileMenu('companyPlacementsFileMenu', sGrid, companyForm.PlacementGridFileMenuCallback);
        TriSysSDK.FormMenus.DrawGridMenu('companyPlacementsGridMenu', sGrid);

        sGrid = 'companyForm-NotesHistoryGrid';
        //TriSysSDK.FormMenus.DrawGridFileMenu('companyNotesHistoryFileMenu', sGrid, companyForm.NotesHistoryGridFileMenuCallback);
        TriSysSDK.FormMenus.DrawGridMenu('companyNotesHistoryGridMenu', sGrid);

        sGrid = 'companyForm-ScheduledTasksGrid';
        //TriSysSDK.FormMenus.DrawGridFileMenu('companyScheduledTasksFileMenu', sGrid, companyForm.ScheduledTaskGridFileMenuCallback);
        TriSysSDK.FormMenus.DrawGridMenu('companyScheduledTasksGridMenu', sGrid);

        // Wire some field descriptions to raise events
        var entityFormFieldDescriptionModifications = [
            {
                TableName: "CompanyConfigFields",
                TableFieldName: "CompanyLogo",
                Callback: function (sOperation, divTag, sFilePath)
                {
                    TriSysSDK.Images.FieldDescriptionImageCallback(sOperation, divTag, sFilePath, "CompanyConfigFields_CompanyLogo-Thumbnail", "CompanyConfigFields_CompanyLogo-Thumbnail2");
                },
                ImageClickEventTargets: ["CompanyConfigFields_CompanyLogo-Thumbnail", "CompanyConfigFields_CompanyLogo-Thumbnail2"]
            }
        ];

        // Data oriented code
        var sFormName = "Company";

        // 01 Apr 2021: Custom fields tab
        TriSysSDK.CShowForm.CustomFieldsTab.Load("company-form-customfields", "company-form-tab-custom-caption", sFormName);

        // Tell CShowForm that we are initialised and it can customise the widgets
        TriSysSDK.CShowForm.InitialiseFields(sFormName, entityFormFieldDescriptionModifications);

        // 06 Mar 2024: Hover menu for logo
        companyForm.HoverLogoFunctionality();

        // See TriSysApex.Companies.Load which is specified in forms.json for actual data read
    },

    TabButtonCallback: function(sTabID)
    {
        switch (sTabID)
        {
            case 'company-form-panel-addresses':
                TriSysApex.Pages.CompanyForm.LoadAddressesAndContactsGrid('companyForm-AddressesGrid', null);
                break;

            case 'company-form-panel-organogram':
                if (TriSysApex.Forms.EntityForm.isGridPopulated("Company", sTabID))
                    return;

                TriSysSDK.CompanyOrganogram.Load(TriSysApex.Pages.CompanyForm.CompanyId, 'company-form-organogram');
                break;

            case 'company-form-panel-ratecard':            
                if (TriSysApex.Forms.EntityForm.isGridPopulated("Company", sTabID))
                    return;

                TriSysSDK.ContractRates.Load("Company", TriSysApex.Pages.CompanyForm.CompanyId, 'company-form-contract-rates');
                break;

            case 'company-form-panel-attributes':
                if (TriSysApex.Forms.EntityForm.isGridPopulated("Company", sTabID))
                    return;

                TriSysSDK.Attributes.Load("Company", TriSysApex.Pages.CompanyForm.CompanyId, 'company-form-attributes');
                break;

            case 'company-form-panel-requirements':
                TriSysApex.Pages.CompanyForm.LoadRequirementsGrid('companyForm-RequirementsGrid', null);
                break;
            case 'company-form-panel-placements':
                TriSysApex.Pages.CompanyForm.LoadPlacementsGrid('companyForm-PlacementsGrid', null);
                break;

            case 'company-form-panel-documentlibrary':
                if (TriSysApex.Forms.EntityForm.isGridPopulated("Company", sTabID))
                    return;

                TriSysSDK.DocumentLibrary.Load("Company", TriSysApex.Pages.CompanyForm.CompanyId, 'company-form-documentlibrary');
                break;

            case 'company-form-panel-noteshistory':
                TriSysApex.Pages.CompanyForm.LoadNotesHistoryGrid('companyForm-NotesHistoryGrid', null);
                break;
            case 'company-form-panel-scheduledtasks':
                TriSysApex.Pages.CompanyForm.LoadScheduledTasksGrid('companyForm-ScheduledTasksGrid', null);
                break;

			case 'company-form-panel-relationships':			
				TriSysSDK.Relationships.Load("company-relationships-grid-container", "Company", function()
				{
					TriSysSDK.Relationships.LoadRelationships("Company", TriSysApex.Pages.CompanyForm.CompanyId);
				});
				break;

			case 'company-form-panel-backoffice':			
				TriSysSDK.BackOffice.Load("company-form-bank-details", "Company", function()
				{
					TriSysSDK.BackOffice.LoadBankDetails("Company", TriSysApex.Pages.CompanyForm.CompanyId);
				});
				break;
        }
    },

    AddressesGridContactMenuCallback: function(sMenuItemID)
    {
        var sPrefix = 'company-contact-menu-';
        var sSuffix = '-companyForm';

        switch (sMenuItemID)
        {
            case sPrefix + 'new-contact' +sSuffix:
                TriSysApex.Pages.CompanyForm.NewContact();
                break;
            case sPrefix + 'open-contact' +sSuffix:
                TriSysApex.Pages.CompanyForm.OpenContact();
                break;
            case sPrefix + 'delete-contact' +sSuffix:
                TriSysApex.Pages.CompanyForm.DeleteContact();
                break;
        }
    },

    AddressesGridAddressMenuCallback: function (sMenuItemID)
    {
        var sPrefix = 'company-address-menu-';
        var sSuffix = '-companyForm';

        switch (sMenuItemID)
        {
            case sPrefix + 'new-address' + sSuffix:
                TriSysApex.Pages.CompanyForm.NewAddress();
                break;
            case sPrefix + 'edit-address' + sSuffix:
                TriSysApex.Pages.CompanyForm.EditAddress();
                break;
            case sPrefix + 'delete-address' + sSuffix:
                TriSysApex.Pages.CompanyForm.DeleteAddress();
                break;
        }
    },

    FileMenuCallback: function(sFileMenuID)
    {
        var fm = TriSysSDK.FormMenus.Constants;

        switch (sFileMenuID)
        {
            case fm.File_New:
                TriSysApex.Pages.CompanyForm.NewRecord();
                break;
            case fm.File_Open:
                TriSysApex.Pages.CompanyForm.OpenFindDialogue();
                break;
            case fm.File_Save:
                TriSysApex.Pages.CompanyForm.SaveRecord();            
                break;
            case fm.File_Save_As:
                TriSysApex.UI.ShowMessage("Save Company As");
                break;

            case fm.File_Delete:
                var lCompanyId = TriSysApex.Pages.CompanyForm.CompanyId;
                var sCompanyName = $('#Company_Name').val();
                var fnCallback = function ()
                {
                    TriSysApex.Pages.CompanyForm.NewRecord();
                };
                TriSysApex.Pages.CompanyForm.DeleteRecord(lCompanyId, sCompanyName, fnCallback);
                break;

            case fm.File_Close:
                TriSysApex.FormsManager.CloseCurrentForm();     // TODO: Dirty check!
                break;
        }
    },

    RequirementGridFileMenuCallback: function (sFileMenuID)
    {
        var fm = TriSysSDK.FormMenus.Constants;
        var sGrid = 'companyForm-RequirementsGrid';
        var sCompany = $('#Company_Name').val();
        var lRequirementId = TriSysSDK.Grid.GetSelectedSingletonRowRecordIdFromGrid(sGrid, "Requirement_RequirementId", "requirement", false);

        switch (sFileMenuID)
        {
            case fm.File_New:
                // Popup company contact selection dialogue with callback
                var fnSelectCompanyContact = function (selectedRow)
                {
                    if (!selectedRow)
                        return;

                    // Read the fields we require from the selected row
                    var lContactId = selectedRow.ContactId;

                    // Open a new requirement form
                    TriSysApex.Pages.RequirementForm.NewRecord(lContactId);

                    return true;
                };

                TriSysApex.ModalDialogue.CompanyContacts.Select(TriSysApex.Pages.CompanyForm.CompanyId, sCompany, 0, fnSelectCompanyContact);
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
        var sGrid = 'companyForm-PlacementsGrid';
        var sCompany = $('#Company_Name').val();
        var lPlacementId = TriSysSDK.Grid.GetSelectedSingletonRowRecordIdFromGrid(sGrid, "Placement_PlacementId", "placement", false);

        switch (sFileMenuID)
        {
            case fm.File_New:
                // Popup company contact selection dialogue with callback
                var fnSelectCompanyContact = function (selectedRow)
                {
                    if (!selectedRow)
                        return;

                    // Read the fields we require from the selected row
                    var lContactId = selectedRow.ContactId;

                    // Open a new placement form
                    TriSysApex.Pages.PlacementForm.NewRecord(lContactId);

                    return true;
                };

                TriSysApex.ModalDialogue.CompanyContacts.Select(TriSysApex.Pages.CompanyForm.CompanyId, sCompany, 0, fnSelectCompanyContact);
                break;

            case fm.File_Open:
                if (lPlacementId > 0)
                    TriSysApex.FormsManager.OpenForm("Placement", lPlacementId);
                break;

            case fm.File_Delete:
                if (lPlacementId > 0)
                {
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

    NotesHistoryGridFileMenuCallback: function(sFileMenuID)
    {
        companyForm.TaskGridFileMenuCallback(sFileMenuID, 'companyForm-NotesHistoryGrid', false);
    },

    ScheduledTaskGridFileMenuCallback: function(sFileMenuID)
    {
        companyForm.TaskGridFileMenuCallback(sFileMenuID, 'companyForm-ScheduledTasksGrid', true);
    },

    TaskGridFileMenuCallback: function(sFileMenuID, sGrid, bScheduled)
    {
        var fm = TriSysSDK.FormMenus.Constants;
        var lTaskId = null;

        switch (sFileMenuID)
        {
            case fm.File_New:
                companyForm.NewTask(bScheduled);
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
        // Need to make an asynchronous call to gather a list of all company contacts,
        // and create a list of contacts to pass into the new task

        // Jan 2018: Use a dedicated API method which abstracts the underlying SQL and does not use 'SQLDatabase/SQL_Select'
        var fnPopulationByFunction = {
            API: "Company/ListAddressesAndContacts",    // The Web API Controller/Function

            // The additional parameters passed into the function not including the paging metrics
            Parameters: function (request)
            {
                request.CompanyId = TriSysApex.Pages.CompanyForm.CompanyId;
            },

            DataTableFunction: function (response)      // Called to get a suitable data table for the grid to display
            {
                return response.List;                   // The list of records from the Web API
            }
        };

        var fnProcessDataTable = function (dataTable)
        {
            TriSysApex.UI.HideWait();

            if (dataTable)
            {
                var params = new TriSysApex.ModalDialogue.Task.ShowParameters();
                params.Scheduled = bScheduled;

                for (var i = 0; i < dataTable.length; i++)
                {
                    var dr = dataTable[i];

                    var lContactId = dr["ContactId"];
                    if (lContactId > 0)
                    {
                        var contact = {
                            ContactId: dr["ContactId"],
                            FullName: dr["Contact_Forenames"] + ' ' + dr["Contact_Surname"],
                            CompanyName: $('#Company_Name').val(),
                            JobTitle: dr["JobTitle"],
                            ContactType: dr["Contact_ContactType"]
                        };
                        params.Contacts.push(contact);
                    }
                }

                TriSysApex.ModalDialogue.Task.Show(params);
            }
        };

        TriSysApex.UI.ShowWait(null, "Reading Company Contacts...");
        TriSysSDK.Database.GetDataSetFromFunction(fnPopulationByFunction, fnProcessDataTable);
    },

    // Called when a user runs an action from any menu.
    ActionInvocation: function (sEntityName)
    {
        switch (sEntityName)
        {
            case "Contact":
                var contactIds = TriSysSDK.Grid.GetSelectedMultipleRowsFromGrid('companyForm-AddressesGrid', "ContactId");
                return contactIds;

            case "Company":
                var companyIds = [TriSysApex.Pages.CompanyForm.CompanyId];
                return companyIds;

            case "Requirement":
                var requirementIds = TriSysSDK.Grid.GetSelectedMultipleRowsFromGrid('companyForm-RequirementsGrid', "Requirement_RequirementId");
                return requirementIds;

            case "Placement":
                var placementIds = TriSysSDK.Grid.GetSelectedMultipleRowsFromGrid('companyForm-PlacementsGrid', "Placement_PlacementId");
                return placementIds;
        }
    },

    EditComments: function ()
    {
        var txt = $('#Company_Comments');
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
        TriSysApex.ModalDialogue.BigEdit.Popup("Edit Company " + options.Label, "gi-pen", fnEditedComments, options);
    },

    // 06 Mar 2024: Make it more intuitive for users to manage the logo
    // by hovering the file picker widget. Code lifted from Contact form implemented in Jan 2023.
    HoverLogoFunctionality: function ()
    {
        try {
            var sJQueryId = '#company-form-logo-hovered-buttons-widget';
            var elemFileRow = $('#company-form-logo-hovered-buttons-table-row');
            var elemPhotoFileWidget = $('#CompanyConfigFields_CompanyLogo');
            var elemPhotoFilePathWidget = $('#CompanyConfigFields_CompanyLogo-FileReference_FileName');
            var elemPhotoFileWidgetParentPrevious = elemPhotoFilePathWidget.parent().prev();

            var fnEnter = function () {
                // Move the attributes photo widget into place beneath the photo
                elemPhotoFileWidgetParentPrevious.css('width', '100%');
                elemPhotoFileWidgetParentPrevious.css('float', 'middle');
                elemPhotoFilePathWidget.parent().hide();
                elemPhotoFileWidget.detach().appendTo(sJQueryId);
                elemFileRow.show();
            };

            var fnLeave = function () {
                elemPhotoFileWidget.detach().appendTo('#company-form-logo-file-tr');
                elemPhotoFileWidgetParentPrevious.css('width', '120px');
                elemPhotoFileWidgetParentPrevious.css('float', 'right');
                elemPhotoFilePathWidget.parent().show();
                elemFileRow.hide();
            };

            $('#company-form-logo-column').hover(fnEnter, fnLeave);
        }
        catch (e) {
            // Found bug 
            TriSysApex.Logging.LogMessage(TriSysApex.Logging.CatchVariableToText(e));
        }
    }
};

$(document).ready(function ()
{
    companyForm.Load();
});
