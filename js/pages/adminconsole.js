var AdminConsole =
{
    UserGridID: 'adminConsoleForm-UserGrid',
    GroupTreeID: 'adminConsoleForm-GroupTree',
    PerformanceTargetsGridID: 'adminConsoleForm-PerformanceTargetsGrid',
    PerformanceTargetComboID: 'adminConsoleForm-PerformanceTargetCombo',
    PerformanceTargetComboUserID: 'adminConsoleForm-PerformanceTargetCombo-Users',
    SkillCategoryGridID: 'adminConsoleForm-SkillCategoryGrid',
    SkillGridID: 'adminConsoleForm-SkillGrid',
    SystemSettingsGridID: 'adminConsoleForm-SystemSettingsGrid',
    SQLManagerGridID: 'adminConsoleForm-SQLManagerGrid',
    DocumentGridID: 'adminConsoleForm-DocumentGrid',
    InvalidCVPathGridID: 'adminConsoleForm-InvalidCVPathGrid',
    FieldDescriptionsGridID: 'adminConsoleForm-FieldDescriptionsGrid',
    UserGridActionsMenu: 'adminConsoleForm-User-ActionsMenu',
    AuditTrailGridID: 'adminConsoleForm-AuditTrailGrid',

    Load: function()
    {
        TriSysSDK.EntityFormTabs.AddClickEventHandlers('admin-console-tab-nav-horizontal', true);

		var bUsersTabVisible = !TriSysApex.Resourcer.isResourcerWebSite();
		if(bUsersTabVisible)
			TriSysSDK.Controls.Button.Click('admin-console-tab-users');	
		else
		{
			//$('#admin-console-tab-attributes').addClass('active');
			TriSysSDK.Controls.Button.Click('admin-console-tab-attributes');	
		}
		

		TriSysSDK.FormMenus.DrawGridMenu('adminConsoleForm-User-GridMenu', AdminConsole.UserGridID);
		AdminConsole.UserActionsMenu.Draw();
		TriSysSDK.FormMenus.DrawGridMenu('adminConsoleForm-PerformanceTargets-GridMenu', AdminConsole.PerformanceTargetsGridID);
        TriSysSDK.FormMenus.DrawGridMenu(AdminConsole.AuditTrailGridID + '-GridMenu', AdminConsole.AuditTrailGridID);

        AdminConsole.FieldDescriptions.ReadEntitiesFromWebAPI( AdminConsole.FieldDescriptions.LoadEntityDescriptions );
        AdminConsole.StyleManager.Load();        
    },

    TabClickEvent: function(sTabID)
    {
        switch(sTabID)
        {
            case 'system-admin-panel-users':
                AdminConsole.PopulateUserGrid();
                break;

            case 'system-admin-panel-groups':
                AdminConsole.PopulateGroupTree();
                break;

            case 'system-admin-panel-performance-targets':
                AdminConsole.LoadPerformanceTargetSubsystem();
                break;

            case 'system-admin-panel-attributes':
                AdminConsole.PopulateSkillCategoryGrid();
                break;

            case 'system-admin-panel-system-settings':
                AdminConsole.PopulateSystemSettingsGrid();
                break;

            case 'system-admin-panel-field-descriptions':
                //AdminConsole.FieldDescriptions.PopulateFieldDescriptionsGrid();
                break;

            case 'system-admin-panel-document-manager':
                AdminConsole.DocumentManager.LoadFolders();
                break;

            case 'system-admin-panel-invalid-cvpaths':
                AdminConsole.InvalidCVPaths.LoadContacts();
				break;

			case 'system-admin-panel-security':
				AdminConsole.Security.Load();
				break;

            case 'system-admin-panel-user-settings':
                AdminConsole.UserSettings.Load();
                break;

            case 'system-admin-panel-audit-trail':
                AdminConsole.AuditTrail.Load();
                break;
        }
    },

    //#region User Specific Code
    EditUserId: 0,
    CloneFromUserId: 0,

    PopulateUserGrid: function ()
    {
        // Jan 2018: Use a dedicated API method which abstracts the underlying SQL and does not use 'SQLDatabase/SQL_Select'
        var fnPopulationByFunction = {
            API: "Users/List",                      // The Web API Controller/Function
            Parameters: null,                       // The additional parameters passed into the function not including the paging metrics
            DataTableFunction: function(response)   // Called to get a suitable data table for the grid to display
            {
				AdminConsole.ShowActivationMetricsDuringUserGridPopulation(response.Metrics);
				return AdminConsole.TweakSubscriberList(response.List);
            }
        };

        AdminConsole.PopulateUserGridFromFunction(fnPopulationByFunction);        
    },

	ShowActivationMetricsDuringUserGridPopulation: function(metrics)
	{
	    if (metrics)
	    {
		    $('#system-admin-users-activated-count').html(metrics.ActivatedCount);
		    $('#system-admin-users-deactivated-count').html(metrics.DeActivatedCount);
		    $('#system-admin-users-expiring-count').html(metrics.ExpiringSoonCount);
	    }
	},

	TweakSubscriberList: function(subscribers)
	{
		if(subscribers)
		{
			var bPricesShown = false;

			$.each(subscribers, function (index, subscriber)
			{
				var bActive = (subscriber.Active == "Yes");

				// Show correct colour
				subscriber.ActiveStatus = bActive ? 'success' : 'danger';
				subscriber.ActiveStatusText = bActive ? 'A' : 'I';

				var iDaysTillEndOfSubscription = subscriber.DaysTillEndOfSubscription == '' ? 0 : parseInt(subscriber.DaysTillEndOfSubscription);
				if(bActive && iDaysTillEndOfSubscription <= 7)
				{
					subscriber.ActiveStatus = 'warning';
					subscriber.ActiveStatusText = 'E';
				}

				// Show day markers
				var sDaysToExpiry = bActive ? iDaysTillEndOfSubscription : "" ;
				switch('' + iDaysTillEndOfSubscription)
				{
					case '-1': 
							sDaysToExpiry = "Yesterday";
							break;
					case '0': 
					case '': 
							if(bActive)
								sDaysToExpiry = "Today";
							break;
					case '1': 
							if(bActive)
								sDaysToExpiry = "Tomorrow";
							break;
				}

				// Deal with null/non-expiring contracts
				var dtExpiryDate = new Date(subscriber.ExpiryDate);
				var sExpiryDateString = moment(dtExpiryDate).format("DD MMM YYYY");
				if(dtExpiryDate.getFullYear() <= 1)
				{
					sExpiryDateString = '';
					sDaysToExpiry = bActive ? 'Never' : '';
					subscriber.ActiveStatus = bActive ? 'success' : 'danger';
					subscriber.ActiveStatusText = bActive ? 'A' : 'I';
				}
				subscriber.ExpiryDateString = sExpiryDateString;

			    // Deal with null/non-expiring last login date
				var dtLastLogin = new Date(subscriber.LastLogin);
				var sLastLoginString = moment(dtLastLogin).format("DD MMM YYYY");
				if (dtLastLogin.getFullYear() <= 1) {
				    sLastLoginString = '';
				}
				subscriber.LastLoginString = sLastLoginString;

				subscriber.DaysToExpiry = sDaysToExpiry;

				if(subscriber.PlanPriceSummary)
					bPricesShown = true;
			});   

			if(!bPricesShown)
			{
				var grid = $("#" + AdminConsole.UserGridID).data("kendoGrid");
				grid.hideColumn("PlanPriceSummary");

				// Also disable Add User
				AdminConsole._UserAccountManagementCanPayOnline = false;
			}
		}

		return subscribers;
	},

	_UserAccountManagementCanPayOnline: true,

	UserGridColumns: [
        { field: "UserId", title: "Id", type: "number", width: 70, filterable: false, hidden: true },
        //{ field: "ActiveStatus", title: " ", template: '<span class="label label-#: ActiveStatus #"> #: ActiveStatusText # </span>', width: 35, filterable: false },
        { field: "Name", title: "Name", type: "string" },
        { field: "Active", title: "Active", template: '<span class="label label-#: ActiveStatus #"> #: Active # </span>', width: 90 },
        { field: "EMail", title: "E-Mail/Login", type: "string" },
		{ field: "AccountMaintainer", title: "Administrator", type: "string", width: 130 },
		{ field: "StartDate", title: "Start Date", type: "date", format: "{0:dd MMM yyyy}", hidden: true },
		{ field: "ExpiryDateString", title: "Expiry Date", type: "string", width: 120 },
		{ field: "DaysToExpiry", title: "Days to Expiry", type: "string", width: 130, filterable: false },
		{ field: "PlanPriceSummary", title: "Price Plan", type: "string", width: 130 },
		{ field: "TelNo", title: "Tel. No.", type: "string", hidden: true },
        { field: "LoggedIn", title: "Logged In", type: "string", hidden: true },
        { field: "Locked", title: "Locked", type: "string", hidden: true },
		{ field: "CRMContactId", title: "CRMContactId", type: "string", hidden: true },
		{ field: "LastLoginString", title: "Last Login", type: "string", width: 130, hidden: true },
		{ field: "LoginCount", title: "Login Count", type: "number", width: 130, hidden: true }

	],

    PopulateUserGridFromFunction: function (fnPopulationByFunction)
    {
        var sGridName = AdminConsole.UserGridID - '-GridInstance';

        TriSysSDK.Grid.VirtualMode({
            Div: AdminConsole.UserGridID,
            ID: sGridName,
            Title: "Users",
            RecordsPerPage: TriSysApex.UserOptions.RecordsPerPage(),
            PopulationByFunction: fnPopulationByFunction,
            Columns: AdminConsole.UserGridColumns,

            KeyColumnName: "UserId",
            DrillDownFunction: function (rowData)
            {
                TriSysApex.UI.CloseModalPopup();
                AdminConsole.OpenUserDialogue(rowData.UserId, 0, rowData.CRMContactId);
            },
            MultiRowSelect: true,
            Grouping: false,
            ColumnFilters: false,
			Sortable: false,
            OpenButtonCaption: "Open"
        });
    },

    // Menu function
    EditUser: function()
    {
        var lUserId = TriSysSDK.Grid.GetSelectedSingletonRowRecordIdFromGrid(AdminConsole.UserGridID, "UserId", "user account");
		var lCRMContactId = TriSysSDK.Grid.GetSelectedSingletonRowFieldValueFromGrid(AdminConsole.UserGridID, "CRMContactId", "user account", false);

        if (lUserId > 0)
        {
            AdminConsole.OpenUserDialogue(lUserId, 0, lCRMContactId);
            return true;
        }
    },

	// Nov 2018: Always clone the account maintainer, but do not make an administrator
    CloneUser: function()
    {
		// Note that this is the hard coded user in OpusNetMaster which is replaced with the new provisioning administrator
        var lUserId = 3;	//TriSysSDK.Grid.GetSelectedSingletonRowRecordIdFromGrid(AdminConsole.UserGridID, "UserId", "user account");

        if (lUserId > 0)
        {
            AdminConsole.OpenUserDialogue(0, lUserId, 0);
            return true;
        }
    },

	// Nov 2018: take an existing account and activate it
	ActivateUser: function()
	{
		var lUserId = TriSysSDK.Grid.GetSelectedSingletonRowRecordIdFromGrid(AdminConsole.UserGridID, "UserId", "user account");
        var sName = TriSysSDK.Grid.GetSelectedSingletonRowFieldValueFromGrid(AdminConsole.UserGridID, "Name", "user account", false);
		var sActive = TriSysSDK.Grid.GetSelectedSingletonRowFieldValueFromGrid(AdminConsole.UserGridID, "Active", "user account", false);
		var sExpiryDate = TriSysSDK.Grid.GetSelectedSingletonRowFieldValueFromGrid(AdminConsole.UserGridID, "ExpiryDate", "user account", false);
		var lCRMContactId = TriSysSDK.Grid.GetSelectedSingletonRowFieldValueFromGrid(AdminConsole.UserGridID, "CRMContactId", "user account", false);

        if (lUserId > 0)
        {
			if(!AdminConsole.inUserAccountManagementCanPayOnline())
				return;

			var fnExtendSubscription = function() 
			{ 
				AdminConsole.RequestPaymentForSpecifiedUserAccount(lUserId, sName, lCRMContactId);
				return true;
			};

            if(sActive == "Yes")
			{
				sExpiryDate = moment(sExpiryDate).format("dddd DD MMMM YYYY");
				var sMessage = "The account for " + sName + " is already active until " + sExpiryDate + "." +
					"<br/>" + "Would you like to extend this subscription beyond this date?";
				
                TriSysApex.UI.questionYesNo(sMessage, "Activate " + TriSysApex.Copyright.ShortProductName + " User Account", "Yes", fnExtendSubscription, "No");
				return;
			}

			fnExtendSubscription();
        }
	},

	// Nov 2018: means de-activate
    DeleteUser: function()
    {
        var lUserId = TriSysSDK.Grid.GetSelectedSingletonRowRecordIdFromGrid(AdminConsole.UserGridID, "UserId", "user account");
        var sName = TriSysSDK.Grid.GetSelectedSingletonRowFieldValueFromGrid(AdminConsole.UserGridID, "Name", "user account", false);
		var sActive = TriSysSDK.Grid.GetSelectedSingletonRowFieldValueFromGrid(AdminConsole.UserGridID, "Active", "user account", false);
		var sAccountMaintainer = TriSysSDK.Grid.GetSelectedSingletonRowFieldValueFromGrid(AdminConsole.UserGridID, "AccountMaintainer", "user account", false);

        if (lUserId > 0)
        {
			if(!AdminConsole.inUserAccountManagementCanPayOnline())
				return;

			if(sActive != "Yes")
			{
				var sMessage = "The account for " + sName + " is not active." +
					"<br/>" + "Would you like to request deletion of this account?";
				var fnContactUs = function() 
				{ 
					TriSysApex.FormsManager.OpenForm('ContactUs');
					return true;
				};
                TriSysApex.UI.questionYesNo(sMessage, "Deactivate " + TriSysApex.Copyright.ShortProductName + " User Account", "Yes", fnContactUs, "No");
				return;
			}

            var userCredentials = TriSysApex.LoginCredentials.UserCredentials();
            var bMyUserAccount = (userCredentials.LoggedInUser.UserId == lUserId);

            // Security checking
			if(bMyUserAccount)
			{
				var sMessage = "You are not permitted to deactivate your own account to prevent you locking your own subscription.";
				TriSysApex.UI.ShowMessage(sMessage, "Deactivate " + TriSysApex.Copyright.ShortProductName + " User Account");
				return true;
			}

            var fnDeletePrompt = function ()
            {
                setTimeout(function ()
                {
                    AdminConsole.ConfirmUserAccountDeletion(lUserId, sName);

                }, 50);
                return true;
            };

            if(bMyUserAccount)
            {
                var sMessage = "Are you sure that you wish to deactivate your own account?" +
                    "<br />You will be logged out immediately after completion, and you will be unable to log back in.";
                TriSysApex.UI.questionYesNo(sMessage, "Deactivate " + TriSysApex.Copyright.ShortProductName + " User Account", "Yes", fnDeletePrompt, "No");
                return true;
            }

            // Activate Users/DeleteUser now that workflow is in place
            fnDeletePrompt();
            return true;
        }
    },

    ConfirmUserAccountDeletion: function (lUserId, sName)
    {
        var fnDeleteUser = function ()
        {
            AdminConsole.ConfirmedUserAccountDeletion(lUserId, sName);
            return true;
        };

        var sMessage = "Are you sure that you wish to deactivate the user account assigned to " + sName + "?";
        TriSysApex.UI.questionYesNo(sMessage, "Deactivate " + TriSysApex.Copyright.ShortProductName + " User Account", "Yes", fnDeleteUser, "No");
    },

    ConfirmedUserAccountDeletion: function (lUserId, sName)
    {
        // Send to Web API and await instructions
        var CDeleteUserRequest = { UserId: lUserId };

        var payloadObject = {};

        payloadObject.URL = "User/Delete";

        payloadObject.OutboundDataPacket = CDeleteUserRequest;

        payloadObject.InboundDataFunction = function (CDeleteUserResponse)
        {
            TriSysApex.UI.HideWait();

            if (CDeleteUserResponse)
            {
                if (CDeleteUserResponse.Success)
                {
					// Repoint cache
                    TriSysApex.Cache.cachedStandingDataInMemory.Users = CDeleteUserResponse.Users;

                    // Take action
                    if(CDeleteUserResponse.LogoutAfterDeletion )
                    {
                        // This is because the user deleted their own account after warning, so log them out now.
                        TriSysApex.LoginCredentials.ConfirmedLogoff();
                        return;
                    }
                    else if(CDeleteUserResponse.Deleted)
                    {
                        // Record was deleted, so refresh the grid
                        AdminConsole.PopulateUserGrid();
                    }

                    // Deletion may have been completed but we wish to now show the user a message
                    if (CDeleteUserResponse.DeletionMessage)
                    {
                        // This is because the user deleted their own account after warning, so log them out now.
                        TriSysApex.UI.ShowMessage(CDeleteUserResponse.DeletionMessage);
                    }
                }
                else
                    TriSysApex.UI.ShowError(CDeleteUserResponse.ErrorMessage);    // Catastrophic error
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('AdminConsole.ConfirmedUserAccountDeletion: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Deleting User...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

	inUserAccountManagementCanPayOnline: function(sWhat)
	{
		if(!AdminConsole._UserAccountManagementCanPayOnline)
		{
		    var sMessage = 'Please visit our support portal at <a href="https://support.trisys.co.uk" target="_blank">support.trisys.co.uk</a> in order to manage accounts' +
                            ' in <strong>My Company</strong>:';

		    // 06 July 2022: Add an image showing what the support portal looks like
		    sMessage += '<br><br><img src="https://api.trisys.co.uk/apex/custom/trisys-technical-support-portal/images/support-portal-my-company-accounts-500.png">';

			TriSysApex.UI.ShowMessage(sMessage);
		}

		return AdminConsole._UserAccountManagementCanPayOnline;
	},

    OpenUserDialogue: function (lUserId, lCloneUserId, lCRMContactId)
    {
		if(!AdminConsole.inUserAccountManagementCanPayOnline())
			return;

        AdminConsole.EditUserId = lUserId;
        AdminConsole.CloneFromUserId = lCloneUserId;

        var bClone = (lCloneUserId > 0);
        var userCredentials = TriSysApex.LoginCredentials.UserCredentials();
        var bMyUserAccount = (userCredentials.LoggedInUser.UserId == lUserId);

        var parametersObject = new TriSysApex.UI.ShowMessageParameters();
        parametersObject.Title = (!bClone ? "Edit" : "Add") + " User Account";
        parametersObject.Image = "fa-user"
        parametersObject.CloseTopRightButton = true;

        parametersObject.ContentURL = TriSysApex.Constants.UserControlFolder + "ctrlUser.html";

        parametersObject.ButtonRightText = "Cancel";
        parametersObject.ButtonRightVisible = true;

        if (!bClone && !bMyUserAccount)
        {
            parametersObject.ButtonCentreText = "Send Activation Code";
            parametersObject.ButtonCentreVisible = true;
            parametersObject.ButtonCentreFunction = function ()
            {
                ctrlUser.SendActivationCodeForExistingUserAccount();
            };

        }

        parametersObject.ButtonLeftText = "Save";
        parametersObject.ButtonLeftVisible = true;
        parametersObject.ButtonLeftFunction = function ()
        {
            ctrlUser.SaveButtonClick(lCRMContactId);
        };

        TriSysApex.UI.PopupMessage(parametersObject);
    },

	// Called from ctrlUser after user has successfuly submitted a new useror change to user account
    PostSaveUserAccountEvent: function (CWriteUserAccountResponse, lUserId)
    {
        // Refresh user grid
        TriSysSDK.Grid.ClearCheckedRows(AdminConsole.UserGridID);

        // This is not sufficient as this is a dynamic query
        //TriSysSDK.Grid.RefreshData(AdminConsole.UserGridID);

        // Refresh the grid fully
        AdminConsole.PopulateUserGrid();

        // Close this modal dialogue
        TriSysApex.UI.CloseModalPopup();

		// If we have created a new user account, or if the account is not active, then request payment
		if(CWriteUserAccountResponse)
		{
			var sPrompt = null;
			if(CWriteUserAccountResponse.NewAccount)
				sPrompt = "new";
			else if(!CWriteUserAccountResponse.Active)
				sPrompt = "updated";

			if(sPrompt)
			{
				sPrompt = "Would you like to activate the " + sPrompt + " account of " + CWriteUserAccountResponse.FullName + "?" +
						"<br/>" + "(You will be redirected to our payment gateway for activation)";
				var fnRequestPayment = function()
				{
					setTimeout(function() 
						{ 
							AdminConsole.RequestPaymentForSpecifiedUserAccount(CWriteUserAccountResponse.UserId, 
																				CWriteUserAccountResponse.FullName,
																				CWriteUserAccountResponse.CRMContactId);
						}, 10);
					return true;
				};
                TriSysApex.UI.questionYesNo(sPrompt, "Activate User Account", "Yes", fnRequestPayment, "No");
			}
		}
    },

	// Nov 2018: After account maintainer user has created the user account, or wishes to activate an account, 
	// we are going to put them into our payment gateway
	RequestPaymentForSpecifiedUserAccount: function(lUserId, sName, lCRMContactId)
	{		
		// Start by sending this request to the back-end where we can obtain a unique GUID for the full transaction
		// tied to both the contact account and the current account maintainer
		var payloadObject = {};

		var CActivateApexSubscriberRequest = { 
			ContactId: lCRMContactId,
			UserId: lUserId
		};

		payloadObject.URL = "Users/ActivateApexSubscriber";

		payloadObject.OutboundDataPacket = CActivateApexSubscriberRequest;

		payloadObject.InboundDataFunction = function (CActivateApexSubscriberResponse)
		{
			TriSysApex.UI.HideWait();

			if (CActivateApexSubscriberResponse)
			{
				if (CActivateApexSubscriberResponse.Success)
					AdminConsole.PromptForUserAccountPayment(CActivateApexSubscriberResponse.GUID, sName, CActivateApexSubscriberResponse);
				else
					TriSysApex.UI.ShowMessage(CActivateApexSubscriberResponse.ErrorMessage);
			}
		};

		payloadObject.ErrorHandlerFunction = function (request, status, error)
		{
			TriSysApex.UI.HideWait();
			TriSysApex.UI.errorAlert('AdminConsole.RequestPaymentForSpecifiedUserAccount: ' + status + ": " + error + ". responseText: " + request.responseText);
		};

		TriSysApex.UI.ShowWait(null, "Preparing Payment Gateway...");
		TriSysAPI.Data.PostToWebAPI(payloadObject);
	},

	// Now that we have the GUID stored in CRM, we can commence taking payment,
	// or allow free activation if on a contract or free plan
	PromptForUserAccountPayment: function(sGUID, sName, CActivateApexSubscriberResponse)
	{
		// Send to back end to orchestrate storage of user account prior to requesting payment
		var parametersObject = new TriSysApex.UI.ShowMessageParameters();

        parametersObject.Title = "Activate User Account";
        parametersObject.Image = "gi-gbp";
        parametersObject.Maximize = true;
        parametersObject.CloseTopRightButton = true;

        parametersObject.ContentURL = TriSysApex.CustomFormsAndComponents.UserControlPath("ctrlPaymentGateway.html");

		// Feed in the payment URL when loaded
		parametersObject.OnLoadCallback = function ()
        {
			var options = { 
				UserOnly: sName,
				FreePlan: CActivateApexSubscriberResponse.FreePlan
			};
			var bTargetParent = true;
            ctrlPaymentGateway.Load(sGUID, CActivateApexSubscriberResponse, bTargetParent, options);
        };

        // Buttons
        parametersObject.ButtonLeftVisible = true;
        parametersObject.ButtonLeftText = "Cancel";
        parametersObject.ButtonLeftFunction = function ()
        {
            return true;
        };
        
        TriSysApex.UI.PopupMessage(parametersObject);
	},

    // 05 Mar 2021: We want an actions menu for some end-user housekeeping
	UserActionsMenu:
    {
        BroadcastMessageID: 'Broadcast Message',

        Draw: function ()               // AdminConsole.UserActionsMenu.Draw()
        {
            TriSysApex.FormsManager.loadControlReplacingDiv(AdminConsole.UserGridActionsMenu, 'ctrlAdminConsoleUserGridActionsMenu.html',
                function (response, status, xhr) {
                    // Add event handlers to select all or clear rows
                    $('#admin-console-usergrid-broadcastmessage').click(function (e) { e.preventDefault(); AdminConsole.UserActionsMenu.MenuClick(AdminConsole.UserActionsMenu.BroadcastMessageID, 'to'); });
                    $('#admin-console-usergrid-logout').click(function (e) { e.preventDefault(); AdminConsole.UserActionsMenu.MenuClick('Logout'); });
                    $('#admin-console-usergrid-removecachedlogin').click(function (e) { e.preventDefault(); AdminConsole.UserActionsMenu.MenuClick('Remove Cached Login'); });
                    $('#admin-console-usergrid-resetgrids').click(function (e) { e.preventDefault(); AdminConsole.UserActionsMenu.MenuClick('Reset Grids'); });
                    $('#admin-console-usergrid-setfont').click(function (e) { e.preventDefault(); AdminConsole.UserActionsMenu.MenuClick('Set Font'); });
                    $('#admin-console-usergrid-settheme').click(function (e) { e.preventDefault(); AdminConsole.UserActionsMenu.MenuClick('Set Theme'); });
                });
        },

        MenuClick: function (sWhat, sHow)     // AdminConsole.UserActionsMenu.MenuClick()
        {
            // Must be at least one selected user
            var lstUserId = TriSysSDK.Grid.GetSelectedMultipleRowsFromGrid(AdminConsole.UserGridID, "UserId");
            if (!lstUserId || lstUserId.length == 0)
            {
                TriSysApex.UI.ShowMessage("Please select at least one user record.");
                return;
            }

            sHow = !sHow ? 'for' : sHow;

            switch(sWhat)
            {
                case AdminConsole.UserActionsMenu.BroadcastMessageID:
                    AdminConsole.UserActionsMenu.BroadcastMessageToUsers(lstUserId);
                    return;
            }

            var sMessage = "Are you sure that you wish to '" + sWhat + "' " + sHow + " the selected " + lstUserId.length + " user" + (lstUserId.length == 1 ? "" : "s") + "?";
            TriSysApex.UI.questionYesNo(sMessage, "User Action", "Yes",
                function () {
                    return AdminConsole.UserActionsMenu.SendToWebAPI(sWhat, lstUserId);
                },
                "No");
        },

        // 16 Feb 2023: Take advantage of new SignalR addressing
        BroadcastMessageToUsers: function(lstUserId)
        {
            // Prompt for the message
            var fnReadMessage = function (sText) {
                setTimeout(function () { AdminConsole.UserActionsMenu.BroadcastMessage(lstUserId, sText); }, 10);
                return true;
            };

            var options = {
                Instructions: 'Please type in your message to broadcast to ' + lstUserId.length + ' user' + (lstUserId.length > 1 ? 's' : '') + ':',
                ButtonLabel: 'Send',
                Label: 'your message',
                Value: ''
            };
            TriSysApex.ModalDialogue.BigEdit.Popup(AdminConsole.UserActionsMenu.BroadcastMessageID, "gi-chat", fnReadMessage, options);
        },

        // Send peer-to-peer via SignalR server directly 
        BroadcastMessage: function(lstUserId, sMessage)
        {
            var userCredentials = TriSysApex.LoginCredentials.UserCredentials();
            var sAdministratorName = userCredentials.LoggedInUser.ForenameAndSurname;

            // Package up the message for transmission
            var msg =
            {
                Type: TriSysApex.SignalR.Communication.MessageType.BroadcastedMessage,
                ShowMessage: {
                    Popup: true,
                    Text: sMessage,
                    Title: 'Message from ' + sAdministratorName
                }
            };
            var sJSON = JSON.stringify(msg);

            // Send it to each recipient
            lstUserId.forEach(function (lUserId)
            {
                var userRecipient = TriSysApex.Cache.UsersManager.UserFromId(lUserId);
                TriSysApex.SignalR.Communication.Send(userRecipient.LoginName, sJSON);
            });

            // Let administrator know
            var sConfirmation = 'Your message was broadcasted to ' + lstUserId.length + ' user' + (lstUserId.length > 1 ? 's' : '') + '.';
            TriSysApex.UI.ShowMessage(sConfirmation);
        },

        SendToWebAPI: function (sWhat, lstUserId)
        {
            var CUserActionRequest = { ActionName: sWhat, UserIdList: lstUserId };

            var payloadObject = {};

            payloadObject.URL = "Users/Action";

            payloadObject.OutboundDataPacket = CUserActionRequest;

            payloadObject.InboundDataFunction = function (CUserActionResponse)
            {
                TriSysApex.UI.HideWait();

                if (CUserActionResponse)
                {
                    if (CUserActionResponse.Success)
                    {
                        // Some actions may take time to queue
                        var sMessage = "Action '" + sWhat + "' Completed for " + lstUserId.length + " user" + (lstUserId.length == 1 ? "" : "s");
                        TriSysApex.UI.ShowMessage(sMessage);
                    }
                    else
                        TriSysApex.UI.ShowMessage(CUserActionResponse.ErrorMessage);
                }
            };

            payloadObject.ErrorHandlerFunction = function (request, status, error)
            {
                TriSysApex.UI.HideWait();
                TriSysApex.UI.errorAlert('AdminConsole.UserActionsMenu.SendToWebAPI: ' + status + ": " + error + ". responseText: " + request.responseText);
            };

            TriSysApex.UI.ShowWait(null, "Users: " + sWhat + "...");
            TriSysAPI.Data.PostToWebAPI(payloadObject);

            return true;
        }
    },

    PopulateGroupTree: function (lExpandedUserGroupId)
    {
        var ds = [];
        var userGroups = TriSysApex.Cache.UserGroups();
        if (!userGroups)
            return;
        
		for (var c = 0; c < userGroups.length; c++)
        {
            var group = userGroups[c];
            var userIdList = group.UserIdList;
            var dsItems = [];

            if (userIdList)
            {
                for (var s = 0; s < userIdList.length; s++)
                {
                    var iUserId = userIdList[s];
                    var user = TriSysApex.Cache.UsersManager.UserFromId(iUserId);
					if(user)
					{
						var bAddUser = (user.UserId > 2);		// Do not show super user and standard user to subscribers
						if(bAddUser)
						{
							var userItem = { text: user.FullName, id: user.UserId };
							dsItems.push(userItem);
						}
					}
                }
            }

            var bExpanded = (lExpandedUserGroupId == group.UserGroupId ? true : false);

            var sDisplayGroup = group.Name + ': ' + group.Description;
            var dsItem = { text: sDisplayGroup, id: group.UserGroupId, expanded: bExpanded, items: dsItems };
            ds.push(dsItem);
        }

        var treeview = $("#" + AdminConsole.GroupTreeID).data("kendoTreeView");
        if (!treeview)
        {
            $("#" + AdminConsole.GroupTreeID).kendoTreeView({
                dragAndDrop: false,
                dataSource: ds,
                checkboxes: {
                    checkChildren: true
                }
            });

            // Force through the theme once again!
            setTimeout(TriSysProUI.kendoUI_Overrides, 1000);
        }
        else
        {
            treeview.dataSource.data(ds);
        }
    },

    AddUserGroup: function()
    {
        AdminConsole.ModalUserGroupDialogue(0);
    },

    RemoveUserGroup: function()
    {
        var selectedGroups = AdminConsole.ReadSelectedGroups();
        if (selectedGroups.length != 1)
            TriSysApex.UI.ShowMessage("Choose only one group to remove at any one time.");
        else
        {
            var group = selectedGroups[0];

            if (group.UserGroupId <= 2)		// Not allowed to delete System Administration or Users
            {
                TriSysApex.UI.ShowMessage("You are not permitted to remove this group.");
                return;
            }

            var sMessage = "Are you sure that you wish to remove group: " + group.Name + "?";
            var fnYes = function ()
            {
                setTimeout(function ()
                {
                    AdminConsole.SubmitUserGroupDeletion(group);

                }, 250);

                return true;
            };

            TriSysApex.UI.questionYesNo(sMessage, "Remove User Group", "Yes", fnYes, "No");
        }
    },

    SubmitUserGroupDeletion: function(group)
    {
        var CDeleteUserGroupRequest = { Group: group };

        var payloadObject = {};

        payloadObject.URL = "UserGroup/Delete";

        payloadObject.OutboundDataPacket = CDeleteUserGroupRequest;

        payloadObject.InboundDataFunction = function (CDeleteUserGroupResponse)
        {
            TriSysApex.UI.HideWait();

            if (CDeleteUserGroupResponse)
            {
                if (CDeleteUserGroupResponse.Success)
                {
                    // Repoint cache
                    TriSysApex.Cache.cachedStandingDataInMemory.UserGroups = CDeleteUserGroupResponse.UserGroups;

                    // Redraw from updated cache
                    AdminConsole.PopulateGroupTree();
                }
                else
                    TriSysApex.UI.ShowMessage(CDeleteUserGroupResponse.ErrorMessage);
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('AdminConsole.RemoveUserGroup: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Removing Group...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    EditGroup: function()
    {
        var selectedGroups = AdminConsole.ReadSelectedGroups();
        if (selectedGroups.length != 1)
            TriSysApex.UI.ShowMessage("Choose only one group to edit.");
        else
        {
            var group = selectedGroups[0];
            AdminConsole.ModalUserGroupDialogue(group.UserGroupId);
        }
    },

    ModalUserGroupDialogue: function (iUserGroupId)
    {
        AdminConsole.EditingUserGroupId = iUserGroupId;

        var parametersObject = new TriSysApex.UI.ShowMessageParameters();
        parametersObject.Title = (iUserGroupId > 0 ? "Edit" : "New") + " User Group";
        parametersObject.Image = "fa-users"
        parametersObject.CloseTopRightButton = true;

        parametersObject.ContentURL = TriSysApex.Constants.UserControlFolder + "ctrlUserGroup.html";

        parametersObject.ButtonRightText = "Cancel";
        parametersObject.ButtonRightVisible = true;

        parametersObject.ButtonLeftText = "Save";
        parametersObject.ButtonLeftVisible = true;
        parametersObject.ButtonLeftFunction = function ()
        {
            ctrlUserGroup.SaveButtonClick();
        };

        TriSysApex.UI.PopupMessage(parametersObject);
    },

    EditingUserGroupId: 0,

    AddUserToGroup: function()
    {
        var selectedGroups = AdminConsole.ReadSelectedGroups();
        if (selectedGroups.length == 0)
            TriSysApex.UI.ShowMessage("Choose one or more groups.");
        else
        {
            // Popup user selection dialogue
            var fnSelectUser = function (selectedRow)
            {
                if (!selectedRow)
                    return false;

                // Read the fields we require from the selected row
                var lUserId = selectedRow.UserId;
                if (lUserId <= 0)
                    return false;

                setTimeout(function ()
                {
                    // Send to web service now
                    AdminConsole.SubmitUserToSelectedGroups(lUserId, selectedGroups);

                }, 50);

                // Force dialogue to close after selection
                return true;
            };

            TriSysApex.ModalDialogue.Users.Select(fnSelectUser);
        }
    },

    SubmitUserToSelectedGroups: function (lUserId, selectedGroups)
    {
        var CAddUserToGroupRequest = { Groups: selectedGroups, UserId: lUserId };
        var firstGroup = selectedGroups[0];

        var payloadObject = {};

        payloadObject.URL = "UserGroup/AddUser";

        payloadObject.OutboundDataPacket = CAddUserToGroupRequest;

        payloadObject.InboundDataFunction = function (CAddUserToGroupResponse)
        {
            TriSysApex.UI.HideWait();

            if (CAddUserToGroupResponse)
            {
                if (CAddUserToGroupResponse.Success)
                {
                    // Repoint cache
                    TriSysApex.Cache.cachedStandingDataInMemory.UserGroups = CAddUserToGroupResponse.UserGroups;

                    // Redraw from updated cache
                    AdminConsole.PopulateGroupTree(firstGroup.UserGroupId);
                }
                else
                    TriSysApex.UI.ShowMessage(CAddUserToGroupResponse.ErrorMessage);
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('AdminConsole.SubmitUserToSelectedGroups: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Adding User...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },
    
    RemoveUserFromGroup: function()
    {
        var groups = AdminConsole.ReadSelectedGroupUsers();
        if (groups.length == 0)
        {
            TriSysApex.UI.ShowMessage("Choose one or more users in one or more group.");
            return;
        }

        var sMessage = "Are you sure that you wish to remove all selected users from all selected groups?";
        var fnYes = function ()
        {
            setTimeout(function ()
            {
                AdminConsole.SubmitUsersFromGroupDeletion(groups);

            }, 250);

            return true;
        };

        TriSysApex.UI.questionYesNo(sMessage, "Remove Users From Groups", "Yes", fnYes, "No");
    },

    SubmitUsersFromGroupDeletion: function(groups)
    {
        var CDeleteUsersFromGroupsRequest = { Groups: groups };
        var firstGroup = groups[0];

        var payloadObject = {};

        payloadObject.URL = "UserGroup/DeleteUsers";

        payloadObject.OutboundDataPacket = CDeleteUsersFromGroupsRequest;

        payloadObject.InboundDataFunction = function (CDeleteUsersFromGroupsResponse)
        {
            TriSysApex.UI.HideWait();

            if (CDeleteUsersFromGroupsResponse)
            {
                if (CDeleteUsersFromGroupsResponse.Success)
                {
                    // Repoint cache
                    TriSysApex.Cache.cachedStandingDataInMemory.UserGroups = CDeleteUsersFromGroupsResponse.UserGroups;

                    // Redraw from updated cache
                    AdminConsole.PopulateGroupTree(firstGroup.UserGroupId);
                }
                else
                    TriSysApex.UI.ShowMessage(CDeleteUsersFromGroupsResponse.ErrorMessage);
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('AdminConsole.SubmitUsersFromGroupDeletion: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Removing Users...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    ReadSelectedGroups: function ()
    {
        var treeview = $("#" + AdminConsole.GroupTreeID).data("kendoTreeView");
        var nodes = treeview.dataSource.view();

        var groups = [];

        for (var i = 0; i < nodes.length; i++)
        {
            var node = nodes[i];

            if (node.checked)
            {
                var iUserGroupId = node.id;
            
                var group = TriSysApex.Cache.UserGroupManager.GroupFromId(iUserGroupId);
                if (group)
                    groups.push(group);
            }
        }

        return groups;
    },

    ReadSelectedGroupUsers: function ()
    {
        var treeview = $("#" + AdminConsole.GroupTreeID).data("kendoTreeView");
        var nodes = treeview.dataSource.view();

        var groups = [];

        for (var i = 0; i < nodes.length; i++)
        {
            var node = nodes[i];

            if (node.hasChildren)
            {
                var iUserGroupId = node.id;
                var group = TriSysApex.Cache.UserGroupManager.GroupFromId(iUserGroupId);
                group.UserIdList = [];

                var userNodes = node.children.view();
                for (var u = 0; u < userNodes.length; u++)
                {
                    var userNode = userNodes[u];
                    if (userNode.checked)
                    {
                        var iUserId = userNode.id;
                        group.UserIdList.push(iUserId);
                    }
                }

                if (group.UserIdList.length > 0)
                    groups.push(group);
            }
        }

        return groups;
    },
    //#endregion User Specific Code

    //#region AdminConsole.Skills
    PopulateSkillCategoryGrid: function ()
    {
        var sGridName = AdminConsole.SkillCategoryGridID - '-GridInstance';

        var fnRowClickHandler = function (e, gridObject, gridLayout)
        {
            var selectedItem = TriSysSDK.Grid.GetFirstGridCheckedItem(gridObject);

            if (selectedItem)
            {
                var lSkillCategoryId = selectedItem.SkillCategoryId;
                var sCategory = selectedItem.Category;
                $('#adminConsoleForm-SelectedCategory').html(sCategory);

                AdminConsole.SelectedSkillCategoryId = lSkillCategoryId;
                AdminConsole.SelectedSkillCategory = sCategory;
                AdminConsole.PopulateSkillGrid(sCategory);

                // Needed?
                TriSysSDK.Grid.DoubleClickHandler.LastSelectedItem = selectedItem;
            }
        };

        var bPopulated = false;
        var fnPostPopulationCallback = function (lRecordCount)
        {
            if (!bPopulated)
            {
                TriSysSDK.Grid.SelectFirstRow(AdminConsole.SkillCategoryGridID);
            }

            //bPopulated = true;
        };

        TriSysSDK.Grid.VirtualMode({
            Div: AdminConsole.SkillCategoryGridID,
            ID: sGridName,
            Title: "Categories",
            RecordsPerPage: TriSysApex.UserOptions.RecordsPerPage(),
            // Jan 2018: Use a dedicated API method which abstracts the underlying SQL and does not use 'SQLDatabase/SQL_Select'
            PopulationByFunction: {
                API: "SkillCategory/List",              // The Web API Controller/Function
                Parameters: null,                       // The additional parameters passed into the function not including the paging metrics
                DataTableFunction: function (response)  // Called to get a suitable data table for the grid to display
                {
                    return response.SkillCategories;    // The list of skill categories from the Web API
                }
            },

            Columns: [
                { field: "SkillCategoryId", title: "SkillCategoryId", type: "number", width: 70, hidden: true },
                { field: "FieldId", title: "FieldId", type: "number", width: 70, hidden: true },
                { field: "Category", title: "Category", type: "string" },
                { field: "Description", title: "Description", type: "string" },
                { field: "Locked", title: "Locked", type: "string" }],

            KeyColumnName: "SkillCategoryId",
            DrillDownFunction: null,
            MultiRowSelect: false,
            SingleRowSelect: true,
            RowClickHandler: fnRowClickHandler,
            PostPopulationCallback: fnPostPopulationCallback,
            Grouping: false
        });
    },

    PopulateSkillGrid: function (sCategory)
    {
        var sGridName = AdminConsole.SkillGridID - '-GridInstance';

        // Different SQL statement for some categories
        var details = AdminConsole.GetCategoryDisplayAndEditDetails(sCategory);

        TriSysSDK.Grid.VirtualMode({
            Div: AdminConsole.SkillGridID,
            ID: sGridName,
            Title: "Attributes/Lookups",
            RecordsPerPage: TriSysApex.UserOptions.RecordsPerPage(),

            // Jan 2018: Use a dedicated API method which abstracts the underlying SQL and does not use 'SQLDatabase/SQL_Select'
            PopulationByFunction: details.PopulationByFunction,

            Columns: details.Columns,
            KeyColumnName: details.KeyField,
            DrillDownFunction: null,
            MultiRowSelect: true,
            Grouping: false
        });
    },

    GetCategoryDisplayAndEditDetails: function (sCategory)
    {
        // Jan 2018: Use a dedicated API method which abstracts the underlying SQL and does not use 'SQLDatabase/SQL_Select'
        var fnPopulationByFunction = {
            API: "Skills/ListByCategory",              // The Web API Controller/Function

            // The additional parameters passed into the function not including the paging metrics
            Parameters: function (request)
            {
                request.Category = sCategory;
            },

            DataTableFunction: function (response)   // Called to get a suitable data table for the grid to display
            {
                return response.Skills;             // The list of records from the Web API
            }
        };

        var sKeyField = "SkillId";
        var sNameLabel = "Attribute";
        var columns = [
                { field: "SkillId", title: "SkillId", type: "number", width: 70, hidden: true },
                { field: "Skill", title: "Attribute", type: "string" },
                { field: "Description", title: "Description", type: "string" }];
        var fnGetRecord = null;

        switch (sCategory)
        {
            case "Contact Priorities":
                fnPopulationByFunction = {
                    API: "Skills/ContactPriorityList",       // The Web API Controller/Function
                    Parameters: null,
                    DataTableFunction: function (response)   // Called to get a suitable data table for the grid to display
                    {
                        return response.List;               // The list of records from the Web API
                    }
                };

                sKeyField = "ContactPriorityId";
                sNameLabel = "Priority";
                columns = [
                    { field: "ContactPriorityId", title: "ContactPriorityId", type: "number", width: 70, hidden: true },
                    { field: "Name", title: "Priority", type: "string" },
                    { field: "Description", title: "Description", type: "string" }];
                fnGetRecord = function (lRecordId)
                {
                    var priority = TriSysApex.Cache.ContactPrioritiesManager.PriorityFromId(lRecordId);
                    if(priority)
                    {
                        return {
                            Name: priority.ContactPriority,
                            Description: priority.Description,
                            Colour: priority.HTMLColour                        
                        };
                    }
                };
                break;

            case "Contact Titles":
                fnPopulationByFunction = {
                    API: "Skills/ContactTitleList",         // The Web API Controller/Function
                    Parameters: null,
                    DataTableFunction: function (response)  // Called to get a suitable data table for the grid to display
                    {
                        return response.List;               // The list of records from the Web API
                    }
                };

                sKeyField = "ContactTitleId";
                sNameLabel = "Title";
                columns = [
                    { field: "ContactTitleId", title: "ContactTitleId", type: "number", width: 70, hidden: true },
                    { field: "Name", title: "Title", type: "string" },
                    { field: "Description", title: "Description", type: "string" },
                    { field: "Sex", title: "Gender", type: "string" },
                    { field: "Married", title: "Married", type: "string" }];
                fnGetRecord = function (lRecordId)
                {
                    var contactTitle = TriSysApex.Cache.ContactTitleManager.ContactTitleFromId(lRecordId);
                    if (contactTitle)
                    {
                        return {
                            Name: contactTitle.Name,
                            Description: contactTitle.Description,
                            Male: contactTitle.Male,
                            Married: contactTitle.Married
                        };
                    }
                };
                break;

            case "Currencies":
                fnPopulationByFunction = {
                    API: "Skills/CurrencyList",             // The Web API Controller/Function
                    Parameters: null,
                    DataTableFunction: function (response)  // Called to get a suitable data table for the grid to display
                    {
                        return response.List;               // The list of records from the Web API
                    }
                };

                sKeyField = "CurrencyId";
                sNameLabel = "Symbol";
                columns = [
                    { field: "CurrencyId", title: "CurrencyId", type: "number", width: 70, hidden: true },
                    { field: "Symbol", title: "Symbol", type: "string" },
                    { field: "Description", title: "Description", type: "string" }];
                fnGetRecord = function (lRecordId)
                {
                    var currency = TriSysApex.Cache.CurrenciesManager.CurrencyFromId(lRecordId);
                    if (currency)
                    {
                        return {
                            Name: currency.Symbol,
                            Description: currency.Description
                        };
                    }
                };
                break;

            case "Industries":
                fnPopulationByFunction = {
                    API: "Skills/IndustryList",             // The Web API Controller/Function
                    Parameters: null,
                    DataTableFunction: function (response)  // Called to get a suitable data table for the grid to display
                    {
                        return response.List;               // The list of records from the Web API
                    }
                };
                sKeyField = "IndustryId";
                sNameLabel = "Industry";
                columns = [
                    { field: "IndustryId", title: "IndustryId", type: "number", width: 70, hidden: true },
                    { field: "Name", title: "Industry", type: "string" },
                    { field: "Description", title: "Description", type: "string" }];
                fnGetRecord = function (lRecordId)
                {
                    var industry = TriSysApex.Cache.IndustryManager.IndustryFromId(lRecordId);
                    if (industry)
                    {
                        return {
                            Name: industry.Name,
                            Description: industry.Description
                        };
                    }
                };
                break;

            case "Job Titles":
                fnPopulationByFunction = {
                    API: "Skills/JobTitleList",             // The Web API Controller/Function
                    Parameters: null,
                    DataTableFunction: function (response)  // Called to get a suitable data table for the grid to display
                    {
                        return response.List;               // The list of records from the Web API
                    }
                };
                sKeyField = "JobTitleId";
                sNameLabel = "Job Title";
                columns = [
                    { field: "JobTitleId", title: "JobTitleId", type: "number", width: 70, hidden: true },
                    { field: "JobTitle", title: "Job Title", type: "string" },
                    { field: "Description", title: "Description", type: "string" }];
                fnGetRecord = function (lRecordId)
                {
                    var jobTitle = TriSysApex.Cache.JobTitleManager.JobTitleFromId(lRecordId);
                    if (jobTitle)
                    {
                        return {
                            Name: jobTitle.JobTitle,
                            Description: jobTitle.Description
                        };
                    }
                };
                break;

            case "Task Types":
                fnPopulationByFunction = {
                    API: "Skills/TaskTypeList",             // The Web API Controller/Function
                    Parameters: null,
                    DataTableFunction: function (response)  // Called to get a suitable data table for the grid to display
                    {
                        return response.List;               // The list of records from the Web API
                    }
                };
                sKeyField = "TaskTypeId";
                sNameLabel = "Task Type";
                columns = [
                    { field: "TaskTypeId", title: "TaskTypeId", type: "number", width: 70, hidden: true },
                    { field: "Name", title: "Task Type", type: "string" },
                    { field: "Description", title: "Description", type: "string" }];
                fnGetRecord = function (lRecordId)
                {
                    var taskType = TriSysApex.Cache.TaskTypesManager.TaskTypeFromId(lRecordId);
                    if (taskType)
                    {
                        return {
                            Name: taskType.Name,
                            Description: taskType.Description,
                            Icon: taskType.Icon16,
                            Colour: taskType.HTMLColour
                        };
                    }
                };
                break;

            case "Company Relationship Types":
                sKeyField = "CompanyRelationshipTypeId";
                sNameLabel = "Company Relationship Type";
                columns = [
                    { field: "CompanyRelationshipTypeId", title: "CompanyRelationshipTypeId", type: "number", width: 70, hidden: true },
                    { field: "Name", title: "Company Relationship Type", type: "string" },
                    { field: "Description", title: "Description", type: "string" }];
                fnGetRecord = function (lRecordId)
                {
                    var relationship = TriSysApex.Cache.Relationships.RelationshipFromId(lRecordId, "Company");
                    if (relationship)
                    {
                        return {
                            Name: relationship.Name,
                            Description: relationship.Description
                        };
                    }
                };
                break;

            case "Contact Relationship Types":
                sKeyField = "ContactRelationshipTypeId";
                sNameLabel = "Contact Relationship Type";
                columns = [
                    { field: "ContactRelationshipTypeId", title: "ContactRelationshipTypeId", type: "number", width: 70, hidden: true },
                    { field: "Name", title: "Contact Relationship Type", type: "string" },
                    { field: "Description", title: "Description", type: "string" }];
                fnGetRecord = function (lRecordId)
                {
					var relationship = TriSysApex.Cache.Relationships.RelationshipFromId(lRecordId, "Contact");
                    if (relationship)
                    {
                        return {
                            Name: relationship.Name,
                            Description: relationship.Description
                        };
                    }
                };
                break;

            case "Address Types":              // 08 Mar 2023
                sKeyField = "AddressTypeId";
                sNameLabel = "Address Type";
                columns = [
                    { field: sKeyField, title: "AddressTypeId", type: "number", width: 70, hidden: true },
                    { field: "Name", title: sNameLabel, type: "string" },
                    { field: "Description", title: "Description", type: "string" }
                ];
                fnGetRecord = function (lRecordId) {
                    debugger;
                    var addressType = TriSysApex.Cache.AddressTypesManager.AddressTypeFromId(lRecordId);
                    if (addressType) {
                        return {
                            Name: addressType.Name,
                            Description: addressType.Description
                        };
                    }
                };
                break;
        }

        var details = {
            PopulationByFunction: fnPopulationByFunction,
            KeyField: sKeyField,
            NameLabel: sNameLabel,
            Columns: columns,
            GetRecord: fnGetRecord
        };

        return details;
    },

    AddSkillCategory: function ()
    {
        AdminConsole.OpenSkillCategoryDialogue(0);
    },

    EditSkillCategory: function ()
    {
        if (AdminConsole.SelectedSkillCategoryId > 0)
            AdminConsole.OpenSkillCategoryDialogue(AdminConsole.SelectedSkillCategoryId);
    },

    RemoveSkillCategory: function()
    {
        if (AdminConsole.SelectedSkillCategoryId > 0)
        {
            var lSkillCategoryId = AdminConsole.SelectedSkillCategoryId;
            var skillCategory = TriSysApex.Cache.SkillCategoriesManager.CategoryFromId(lSkillCategoryId);
            if (skillCategory)
            {
                if(skillCategory.Locked)
                {
                    TriSysApex.UI.ShowMessage("Category is locked.");
                    return;
                }
                if (skillCategory.FieldId > 0)
                {
                    TriSysApex.UI.ShowMessage("Category is a field and can therefore only be removed from field descriptions applet.");
                    return;
                }

                // If any skills in this category are locked, then we cannot delete it
                if(TriSysApex.Cache.SkillCategoriesManager.hasLockedSkills(skillCategory))
                {
                    TriSysApex.UI.ShowMessage("Category has locked skills.");
                    return;
                }

                var sMessage = "Are you sure that you wish to remove category: " + skillCategory.Category + "?";
                var fnYes = function ()
                {
                    setTimeout(function ()
                    {
                        AdminConsole.DeleteSkillCategory(skillCategory);

                    }, 250);

                    return true;
                };

                TriSysApex.UI.questionYesNo(sMessage, "Remove Category", "Yes", fnYes, "No");
            }
        }
    },

    AddSkill: function ()
    {
        AdminConsole.OpenAttributeOrLookupDialogue(0);
    },

    EditSkill: function()
    {
        var sKeyField = AdminConsole.GetEntityIdFieldForSelectedCategory();
        var lAttributeId = TriSysSDK.Grid.GetSelectedSingletonRowRecordIdFromGrid(AdminConsole.SkillGridID, sKeyField, "attribute/lookup");
        if (lAttributeId > 0)
        {
            AdminConsole.OpenAttributeOrLookupDialogue(lAttributeId);
        }
    },

    OpenAttributeOrLookupDialogue: function (lAttributeId)
    {
        var sKeyField = AdminConsole.GetEntityIdFieldForSelectedCategory();
        switch(sKeyField)
        {
            case "SkillId":
                AdminConsole.OpenSkillDialogue(lAttributeId);
                break;

            default:
                AdminConsole.OpenLookupDialogue(lAttributeId);
                break;
        }
    },

    GetDetailsForSelectedCategory: function()
    {
        var details = AdminConsole.GetCategoryDisplayAndEditDetails(AdminConsole.SelectedSkillCategory);
        return details;
    },

    GetEntityIdFieldForSelectedCategory: function ()
    {
        var details = AdminConsole.GetDetailsForSelectedCategory();
        return details.KeyField;
    },

    isSelectedCategorySkills: function ()
    {
        var details = AdminConsole.GetCategoryDisplayAndEditDetails(AdminConsole.SelectedSkillCategory);
        return (details.KeyField == "SkillId");
    },

	ReAssignSkillLinks: function ()
	{
		var sKeyField = AdminConsole.GetEntityIdFieldForSelectedCategory();
		var lAttributeId = TriSysSDK.Grid.GetSelectedSingletonRowRecordIdFromGrid(AdminConsole.SkillGridID, sKeyField, "attribute/lookup");
		if (lAttributeId > 0)
		{
			if (sKeyField == "SkillId")
			{
				var skill = TriSysApex.Cache.SkillManager.SkillFromId(lAttributeId);
				if (skill)
					AdminConsole.PromptForCrossCategoryReAssignLinks(skill);
			}
		}     
	},

	MoveSkill: function ()
	{
		var sKeyField = AdminConsole.GetEntityIdFieldForSelectedCategory();
		var lAttributeId = TriSysSDK.Grid.GetSelectedSingletonRowRecordIdFromGrid(AdminConsole.SkillGridID, sKeyField, "attribute/lookup");
		if (lAttributeId > 0)
		{
			if (sKeyField == "SkillId")
			{
				var skill = TriSysApex.Cache.SkillManager.SkillFromId(lAttributeId);
				if (skill)
					AdminConsole.PromptForSkillCategoryToMoveSkill(skill);
			}
		}     
	},

    RemoveSkill: function ()
    {
        var sKeyField = AdminConsole.GetEntityIdFieldForSelectedCategory();
        var lAttributeId = TriSysSDK.Grid.GetSelectedSingletonRowRecordIdFromGrid(AdminConsole.SkillGridID, sKeyField, "attribute/lookup");
        if (lAttributeId > 0)
        {
            if(sKeyField == "SkillId")
                AdminConsole.RemoveSkillFromSkillId(lAttributeId);
            else
                AdminConsole.RemoveLookup(lAttributeId);
        }       
    },

    RemoveSkillFromSkillId: function(lSkillId)
    {
        var skill = TriSysApex.Cache.SkillManager.SkillFromId(lSkillId);
        if (skill)
        {
            if (skill.Locked)
                TriSysApex.UI.ShowMessage("Attribute is locked.");
            else
            {
                var sMessage = "Are you sure that you wish to remove attribute: " + skill.Skill + "?";
                var fnYes = function ()
                {
                    setTimeout(function ()
                    {
                        AdminConsole.PromptForReassignSkill(skill);

                    }, 250);

                    return true;
                };

                TriSysApex.UI.questionYesNo(sMessage, "Remove Attribute", "Yes", fnYes, "No");
            }
        }
    },

    RemoveLookup: function(lLookupId)
    {
        var sCategory = AdminConsole.SelectedSkillCategory;

        var sMessage = "Are you sure that you wish to remove this lookup?";
        var fnYes = function ()
        {
            setTimeout(function ()
            {
                AdminConsole.PromptForReassignLookup(sCategory, lLookupId);

            }, 250);

            return true;
        };

        TriSysApex.UI.questionYesNo(sMessage, "Remove Lookup", "Yes", fnYes, "No");
    },

    PromptForReassignLookup: function (sCategory, lAttributeId)
    {
        var fnSelectedLookup = function (selectedRow)
        {
            if (!selectedRow)
                return;

            // Read the fields we place from the selected row
            var sKeyField = AdminConsole.GetEntityIdFieldForSelectedCategory();
            var lLookupId = selectedRow[sKeyField];

            if (lLookupId > 0)
            {
                AdminConsole.SubmitLookupDeletion(sCategory, lAttributeId, lLookupId);
            }
        };

        var sTitle = "Re-Assign Deleted Lookup";
        AdminConsole.SelectReAssignLookup(sCategory, lAttributeId, sTitle, fnSelectedLookup);
    },

    // If the user is deleting a skill, prompt for an other skill in the same category which will replace it
	// 
    PromptForReassignSkill: function(skill)
    {
        var fnSelectedSkill = function (selectedRow)
        {
            if (!selectedRow)
                return;

            // Read the fields we place from the selected row
            var lSkillId = selectedRow.SkillId;

            if (lSkillId > 0)
            {
                var reAssignSkill = TriSysApex.Cache.SkillManager.SkillFromId(lSkillId);
                if (reAssignSkill)
                    AdminConsole.SubmitSkillDeletion(skill, reAssignSkill.SkillId);
            }
        };

        var sTitle = "Re-Assign Deleted Attribute";
        TriSysApex.ModalDialogue.Skill.Select(skill.SkillCategoryId, skill.SkillId, sTitle, fnSelectedSkill);
    },

	PromptForCrossCategoryReAssignLinks: function (skill)
	{
		var fnSelectedSkill = function (selectedRow)
		{
			if (!selectedRow)
				return;

			// Read the fields we place from the selected row
			var lSkillId = selectedRow.SkillId;

			if (lSkillId > 0)
			{
				var reAssignSkill = TriSysApex.Cache.SkillManager.SkillFromId(lSkillId);
				if (reAssignSkill)
				{
					var fnYes = function ()
					{
						setTimeout(function ()
						{
							AdminConsole.SubmitSkillReAssignment(skill, reAssignSkill.SkillId);

						}, 50);

						return true;
					};

					var sMessage = "Please confirm all links to '" + skill.Category + " > " + skill.Skill + "' will be re-assigned to '" + reAssignSkill.Category + " > " + reAssignSkill.Skill + "'?";
					TriSysApex.UI.questionYesNo(sMessage, "Re-Assign Attribute Link", "Yes", fnYes, "No");
				}
			}
		};

		var sTitle = "Re-Assign Links to '" + skill.Skill + "'";
		TriSysApex.ModalDialogue.Skill.SelectNonFieldFromAnyCategory(skill.SkillId, sTitle, fnSelectedSkill);
	},

	PromptForSkillCategoryToMoveSkill: function (skill)
	{
		var fnSelectedSkillCategory = function (selectedRow)
		{
			if (!selectedRow)
				return;

			// Read the fields we place from the selected row
			var lSkillCategoryId = selectedRow.SkillCategoryId;

			if (lSkillCategoryId > 0)
			{
				var skillCategory = TriSysApex.Cache.SkillCategoriesManager.CategoryFromId(lSkillCategoryId);
				if (skillCategory)
				{
					var fnYes = function ()
					{
						setTimeout(function ()
						{
							AdminConsole.SubmitSkillMoveToAnotherCategory(skill, skillCategory.SkillCategoryId);

						}, 50);

						return true;
					};

					var sMessage = "Please confirm '" + skill.Category + " > " + skill.Skill + "' will be moved to category '" + skillCategory.Category + "'?";
					TriSysApex.UI.questionYesNo(sMessage, "Move Attribute", "Yes", fnYes, "No");
				}
			}
		};

		var sTitle = "Move '" + skill.Category + " > " + skill.Skill + "' to another category";
		TriSysApex.ModalDialogue.Skill.SelectAnyCategory(skill.SkillCategoryId, sTitle, fnSelectedSkillCategory);
	},

	SelectReAssignLookup: function (sCategory, lIgnoreLookupId, sTitle, fnSelectedLookup)
    {
        var details = AdminConsole.GetCategoryDisplayAndEditDetails(sCategory);

        var sqlParameters = new TriSysApex.ModalDialogue.Selection.SelectionParameters();
        sqlParameters.Title = sTitle;
        sqlParameters.PopulationByFunction = details.PopulationByFunction;
        sqlParameters.Columns = details.Columns;

        sqlParameters.CallbackFunction = fnSelectedLookup;

        // Show the modal
        TriSysApex.ModalDialogue.Selection.Show(sqlParameters);
    },

    SelectedSkillCategoryId: 0,
    SelectedSkillCategory: null,
    EditingSkillCategoryId: 0,
    EditingSkillId: 0,

    OpenSkillCategoryDialogue: function(lSkillCategoryId, fnCallback, options)
    {
        AdminConsole.EditingSkillCategoryId = lSkillCategoryId;

        var bAllowSave = true;
        if (lSkillCategoryId > 0)
        {
            var skillCategory = TriSysApex.Cache.SkillCategoriesManager.CategoryFromId(lSkillCategoryId);
            if (skillCategory)
                bAllowSave = !skillCategory.Locked;
        }

        var parametersObject = new TriSysApex.UI.ShowMessageParameters();
        parametersObject.Title = (lSkillCategoryId > 0 ? "Edit" : "New") + " Category";
        parametersObject.Image = "gi-list";
        parametersObject.CloseTopRightButton = true;

        parametersObject.ContentURL = TriSysApex.Constants.UserControlFolder + "ctrlSkillCategory.html";

        parametersObject.ButtonRightText = (bAllowSave ? "Cancel" : "Close");
        parametersObject.ButtonRightVisible = true;

        if (bAllowSave)
        {
            parametersObject.ButtonLeftText = "Save";
            parametersObject.ButtonLeftVisible = true;
            parametersObject.ButtonLeftFunction = function ()
            {
                return ctrlSkillCategory.SaveButtonClick(fnCallback, options);
            };
        }

        TriSysApex.UI.PopupMessage(parametersObject);
    },

    OpenSkillDialogue: function (lSkillId)
    {
        AdminConsole.EditingSkillId = lSkillId;

        var parametersObject = new TriSysApex.UI.ShowMessageParameters();
        parametersObject.Title = (lSkillId > 0 ? "Edit" : "New") + " Attribute";
        parametersObject.Image = "gi-list";
        parametersObject.CloseTopRightButton = true;

        parametersObject.ContentURL = TriSysApex.Constants.UserControlFolder + "ctrlSkill.html";

        parametersObject.ButtonRightText = "Cancel";
        parametersObject.ButtonRightVisible = true;

        parametersObject.ButtonLeftText = "Save";
        parametersObject.ButtonLeftVisible = true;
        parametersObject.ButtonLeftFunction = function ()
        {
            ctrlSkill.SaveButtonClick();
        };

        TriSysApex.UI.PopupMessage(parametersObject);
    },

    OpenLookupDialogue: function (lLookupId)
    {
        AdminConsole.EditingSkillId = lLookupId;

        var parametersObject = new TriSysApex.UI.ShowMessageParameters();
        parametersObject.Title = (lLookupId > 0 ? "Edit" : "New") + " Lookup";
        parametersObject.Image = "gi-list";
        parametersObject.CloseTopRightButton = true;

        parametersObject.ContentURL = TriSysApex.Constants.UserControlFolder + "ctrlLookup.html";

        parametersObject.ButtonRightText = "Cancel";
        parametersObject.ButtonRightVisible = true;

        parametersObject.ButtonLeftText = "Save";
        parametersObject.ButtonLeftVisible = true;
        parametersObject.ButtonLeftFunction = function ()
        {
            ctrlLookup.SaveButtonClick();
        };

        TriSysApex.UI.PopupMessage(parametersObject);
    },

    SubmitSkillDeletion: function(skill, lReassignSkillId)
    {
        var CDeleteSkillRequest = { Skill: skill, ReassignSkillId: lReassignSkillId };

        var payloadObject = {};

        payloadObject.URL = "Skills/Delete";

        payloadObject.OutboundDataPacket = CDeleteSkillRequest;

        payloadObject.InboundDataFunction = function (CDeleteSkillResponse)
        {
            TriSysApex.UI.HideWait();

            if (CDeleteSkillResponse)
            {
                if (CDeleteSkillResponse.Success)
                {
                    // Repoint cache
                    TriSysApex.Cache.cachedStandingDataInMemory.Skills = CDeleteSkillResponse.Skills;

                    // Redraw from updated cache
                    AdminConsole.PopulateSkillGrid(AdminConsole.SelectedSkillCategory);

                    // Close this modal dialogue: re-assign skill
                    TriSysApex.UI.CloseModalPopup();

                    return;
                }
                else
                    TriSysApex.UI.ShowMessage(CDeleteSkillResponse.ErrorMessage);
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('AdminConsole.SubmitSkillDeletion: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Deleting Attribute...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
	},

	SubmitSkillReAssignment: function (skill, lReassignSkillId)
	{
		var CReAssignSkillRequest = { Skill: skill, ReassignSkillId: lReassignSkillId };

		var payloadObject = {};

		payloadObject.URL = "Skills/ReAssign";

		payloadObject.OutboundDataPacket = CReAssignSkillRequest;

		payloadObject.InboundDataFunction = function (CReAssignSkillResponse)
		{
			TriSysApex.UI.HideWait();

			if (CReAssignSkillResponse)
			{
				if (CReAssignSkillResponse.Success)
				{
					// Have not deleted anything so leave intact

					// Close this modal dialogue: re-assign skill
					TriSysApex.UI.CloseModalPopup();

					return;
				}
				else
					TriSysApex.UI.ShowMessage(CReAssignSkillResponse.ErrorMessage);
			}
		};

		payloadObject.ErrorHandlerFunction = function (request, status, error)
		{
			TriSysApex.UI.HideWait();
			TriSysApex.UI.errorAlert('AdminConsole.SubmitSkillReAssignment: ' + status + ": " + error + ". responseText: " + request.responseText);
		};

		TriSysApex.UI.ShowWait(null, "Re-Assigning Attribute...");
		TriSysAPI.Data.PostToWebAPI(payloadObject);
	},

	SubmitSkillMoveToAnotherCategory: function (skill, lSkillCategoryId)
	{
		var CMoveSkillToAnotherCategoryRequest = { Skill: skill, SkillCategoryId: lSkillCategoryId };

		var payloadObject = {};

		payloadObject.URL = "Skills/MoveToAnotherCategory";

		payloadObject.OutboundDataPacket = CMoveSkillToAnotherCategoryRequest;

		payloadObject.InboundDataFunction = function (CMoveSkillToAnotherCategoryResponse)
		{
			TriSysApex.UI.HideWait();

			if (CMoveSkillToAnotherCategoryResponse)
			{
				if (CMoveSkillToAnotherCategoryResponse.Success)
				{
					// Repoint cache
					TriSysApex.Cache.cachedStandingDataInMemory.Skills = CMoveSkillToAnotherCategoryResponse.Skills;

					// Redraw from updated cache
					AdminConsole.PopulateSkillGrid(AdminConsole.SelectedSkillCategory);

					// Close this modal dialogue: re-assign skill
					TriSysApex.UI.CloseModalPopup();

					return;
				}
				else
					TriSysApex.UI.ShowMessage(CMoveSkillToAnotherCategoryResponse.ErrorMessage);
			}
		};

		payloadObject.ErrorHandlerFunction = function (request, status, error)
		{
			TriSysApex.UI.HideWait();
			TriSysApex.UI.errorAlert('AdminConsole.SubmitSkillMoveToAnotherCategory: ' + status + ": " + error + ". responseText: " + request.responseText);
		};

		TriSysApex.UI.ShowWait(null, "Moving Attribute...");
		TriSysAPI.Data.PostToWebAPI(payloadObject);
	},

    SubmitLookupDeletion: function (sCategory, lLookupId, lReassignToLookupId)
    {
        var details = AdminConsole.GetCategoryDisplayAndEditDetails(sCategory);

        var CDeleteLookupRequest = { KeyField: details.KeyField, LookupId: lLookupId, ReassignLookupId: lReassignToLookupId };

        var payloadObject = {};

        payloadObject.URL = "Lookup/Delete";

        payloadObject.OutboundDataPacket = CDeleteLookupRequest;

        payloadObject.InboundDataFunction = function (CDeleteLookupResponse)
        {
            TriSysApex.UI.HideWait();

            if (CDeleteLookupResponse)
            {
                if (CDeleteLookupResponse.Success)
                {
                    // Cache the standing data
                    var standingData = CDeleteLookupResponse.StandingData;
                    if (standingData)
                        TriSysApex.Cache.SetStandingData(standingData);

                    // Redraw from updated cache
                    AdminConsole.PopulateSkillGrid(sCategory);

                    // Close this modal dialogue: re-assign skill
                    TriSysApex.UI.CloseModalPopup();

                    return;
                }
                else
                    TriSysApex.UI.ShowMessage(CDeleteLookupResponse.ErrorMessage);
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('AdminConsole.SubmitLookupDeletion: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Deleting Lookup...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    DeleteSkillCategory: function(skillCategory)
    {
        var CDeleteSkillCategoryRequest = { SkillCategory: skillCategory };

        var payloadObject = {};

        payloadObject.URL = "SkillCategory/Delete";

        payloadObject.OutboundDataPacket = CDeleteSkillCategoryRequest;

        payloadObject.InboundDataFunction = function (CDeleteSkillCategoryResponse)
        {
            TriSysApex.UI.HideWait();

            if (CDeleteSkillCategoryResponse)
            {
                if (CDeleteSkillCategoryResponse.Success)
                {
                    // Repoint cache
                    TriSysApex.Cache.cachedStandingDataInMemory.SkillCategories = CDeleteSkillCategoryResponse.SkillCategories;

                    // Redraw from updated cache
                    AdminConsole.PopulateSkillCategoryGrid();

                    return;
                }
                else
                    TriSysApex.UI.ShowMessage(CDeleteSkillCategoryResponse.ErrorMessage);
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('AdminConsole.DeleteSkillCategory: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Deleting Category...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    //#endregion AdminConsole.Skills

    //#region AdminConsole.SystemSettings
    PopulateSystemSettingsGrid: function ()
    {
        var sGridName = AdminConsole.SystemSettingsGridID - '-GridInstance';

        TriSysSDK.Grid.VirtualMode({
            Div: AdminConsole.SystemSettingsGridID,
            ID: sGridName,
            Title: "System Settings",
            RecordsPerPage: TriSysApex.UserOptions.RecordsPerPage(),

            // Jan 2018: Use a dedicated API method which abstracts the underlying SQL and does not use 'SQLDatabase/SQL_Select'
            PopulationByFunction: {
                API: "SystemSetting/List",              // The Web API Controller/Function
                Parameters: null,                       // The additional parameters passed into the function not including the paging metrics
                DataTableFunction: function(response)   // Called to get a suitable data table for the grid to display
                {
                    return response.SystemSettings;     // The list of system settings from the Web API
                }
            },

            Columns: [
                { field: "SystemSettingId", title: "SystemSettingId", type: "number", width: 70, hidden: true },
                { field: "Name", title: "Name", type: "string" },
                { field: "Value", title: "Value", type: "string" },
                { field: "Description", title: "Description", type: "string" }],

            KeyColumnName: "SystemSettingId",
            DrillDownFunction: function (rowData)
            {
                TriSysApex.UI.CloseModalPopup();
                AdminConsole.OpenSystemSetting(rowData.SystemSettingId);
            },
            MultiRowSelect: true,
            Grouping: false,
            ColumnFilters: true,
            OpenButtonCaption: "Open"
        });
    },

    SystemSettingId: 0,

    OpenSystemSetting: function (lSystemSettingId)
    {
        AdminConsole.SystemSettingId = lSystemSettingId;

        var parametersObject = new TriSysApex.UI.ShowMessageParameters();
        parametersObject.Title = (lSystemSettingId > 0 ? "Edit" : "Add") + " System Setting";
        parametersObject.Image = "gi-settings";
        parametersObject.CloseTopRightButton = true;

        parametersObject.ContentURL = TriSysApex.Constants.UserControlFolder + "ctrlSystemSetting.html";

        parametersObject.ButtonRightText = "Cancel";
        parametersObject.ButtonRightVisible = true;

        parametersObject.ButtonLeftText = "Save";
        parametersObject.ButtonLeftVisible = true;
        parametersObject.ButtonLeftFunction = function ()
        {
            ctrlSystemSetting.SaveButtonClick();
        };

        TriSysApex.UI.PopupMessage(parametersObject);
    },

    AddSystemSetting: function()
    {
        AdminConsole.OpenSystemSetting(0);
    },

    EditSystemSetting: function ()
    {
        var lSystemSettingId = TriSysSDK.Grid.GetSelectedSingletonRowRecordIdFromGrid(AdminConsole.SystemSettingsGridID, "SystemSettingId", "system setting");
        if (lSystemSettingId > 0)
            AdminConsole.OpenSystemSetting(lSystemSettingId);
    },

    RemoveSystemSetting: function ()
    {
        var lSystemSettingId = TriSysSDK.Grid.GetSelectedSingletonRowRecordIdFromGrid(AdminConsole.SystemSettingsGridID, "SystemSettingId", "system setting");
        if (lSystemSettingId > 0)
        {
            var systemSetting = TriSysApex.Cache.SystemSettingManager.Get(lSystemSettingId);

            var sMessage = "Are you sure that you wish to remove the system setting " + systemSetting.Name + "?";
            var fnYes = function ()
            {
                setTimeout(function ()
                {
                    AdminConsole.DeleteSystemSetting(systemSetting);

                }, 250);

                return true;
            };

            TriSysApex.UI.questionYesNo(sMessage, "Remove System Setting", "Yes", fnYes, "No");
        }            
    },

    DeleteSystemSetting: function(systemSetting)
    {
        var CDeleteSystemSettingRequest = { SystemSetting: systemSetting };

        var payloadObject = {};

        payloadObject.URL = "SystemSetting/Delete";

        payloadObject.OutboundDataPacket = CDeleteSystemSettingRequest;

        payloadObject.InboundDataFunction = function (CDeleteSystemSettingResponse)
        {
            TriSysApex.UI.HideWait();

            if (CDeleteSystemSettingResponse)
            {
                if (CDeleteSystemSettingResponse.Success)
                {
                    // Repoint cache
                    TriSysApex.Cache.SystemSettingManager.Set(CDeleteSystemSettingResponse.SystemSettings);

                    // Redraw from updated cache
                    AdminConsole.PopulateSystemSettingsGrid();

                    return;
                }
                else
                    TriSysApex.UI.ShowMessage(CDeleteSystemSettingResponse.ErrorMessage);
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('AdminConsole.DeleteSystemSetting: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Deleting System Setting...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    //#endregion AdminConsole.SystemSettings

    //#region AdminConsole.FieldDescriptions
    FieldDescriptions:
    {
		ReadEntitiesFromWebAPI: function(fnCallback)
		{
			var CEntitiesListRequest = { };

			var payloadObject = {};

			payloadObject.URL = "Entities/List";

			payloadObject.OutboundDataPacket = CEntitiesListRequest;

			payloadObject.InboundDataFunction = function (CEntitiesListResponse)
			{
				if (CEntitiesListResponse)
				{
					if (CEntitiesListResponse.Success)
					{
						fnCallback(CEntitiesListResponse.Entities);

						return;
					}
					else
						TriSysApex.UI.ShowMessage(CEntitiesListResponse.ErrorMessage);
				}
			};

			payloadObject.ErrorHandlerFunction = function (request, status, error)
			{
				TriSysApex.UI.errorAlert('AdminConsole.FieldDescriptions.ReadEntitiesFromWebAPI: ' + status + ": " + error + ". responseText: " + request.responseText);
			};

			TriSysAPI.Data.PostToWebAPI(payloadObject);
		},

        LoadEntityDescriptions: function (lstEntities)
        {
            var sFieldID = 'adminConsoleForm-Entity';

			var entities = [];
			var selectedEntity = null;
			lstEntities.forEach(function(entity)
			{
				entities.push( { text: entity.EntityName, value: entity.Description } );
				if(!selectedEntity)
					selectedEntity = entity;
            });

            var fnSelectEntity = function (sDescription, sEntity)
            {
                $('#adminConsoleForm-EntityDescription').html(sDescription);
                AdminConsole.FieldDescriptions.PopulateGrid(sEntity);
            }

            TriSysSDK.CShowForm.populateComboFromDataSource(sFieldID, entities, 0, fnSelectEntity);
            fnSelectEntity(selectedEntity.Description, selectedEntity.EntityName);

            TriSysSDK.FormMenus.DrawGridMenu('adminConsoleForm-FieldDescription-GridMenu', AdminConsole.FieldDescriptionsGridID);
        },

        // Simply re-cache everything after adding/deleting field descriptions
        RecacheAllStandingDataAfterUpdateOrDeletion: function(fnCallback)
        {
            TriSysApex.UI.ShowWait(null, "Standing data...");

            // Mark all tabs as unpopulated to allow forced refresh
            // Needed?

            var fnCallbackAfterRecache = function()
            {
                TriSysApex.UI.HideWait();

                if(fnCallback)
                    fnCallback();
            }

            // Go back to get the cached standing data settings and meta database
            TriSysApex.LoginCredentials.CacheStandingData(null, fnCallbackAfterRecache);
        },

        UpdatedFieldDescription: function(fieldDescription, fnCallback)
        {
            AdminConsole.FieldDescriptions.RecacheAllStandingDataAfterUpdateOrDeletion(fnCallback);
            return;

            var bAddedToCache = false;
            var fieldDescriptions = TriSysApex.Cache.FieldDescriptions();
            for (var i = 0; i < fieldDescriptions.length; i++)
            {
                var cachedFieldDescription = fieldDescriptions[i];
                if (fieldDescription.TableName == cachedFieldDescription.TableName && fieldDescription.TableFieldName == cachedFieldDescription.TableFieldName)
                {
                    fieldDescriptions[i] = fieldDescription;
                    bAddedToCache = true;
                    break;
                }
            }

            if (!bAddedToCache)
            {
                fieldDescriptions.push(fieldDescription);

                // Sort also 
                fieldDescriptions.sort(function (a, b)
                {
                    var x = a.TableName.toLowerCase() + '_' + a.TableFieldName.toLowerCase(),
                    y = b.TableName.toLowerCase() + '_' + b.TableFieldName.toLowerCase();
                    return x < y ? -1 : x > y ? 1 : 0;
                });
            }

            TriSysApex.Cache.cachedStandingDataInMemory.FieldDescriptions = fieldDescriptions;
        },

        RemoveFieldDescription: function (lFieldId, fnCallback)
        {
            AdminConsole.FieldDescriptions.RecacheAllStandingDataAfterUpdateOrDeletion(fnCallback);
            return;

            var bRemovedFromCache = false;
            var fieldDescriptions = TriSysApex.Cache.FieldDescriptions();
            for (var i = 0; i < fieldDescriptions.length; i++)
            {
                var fieldDescription = fieldDescriptions[i];
                if (fieldDescription.FieldId == lFieldId)
                {
                    fieldDescriptions.splice(i, 1);
                    bRemovedFromCache = true;
                    break;
                }
            }

            if (bRemovedFromCache)
                TriSysApex.Cache.cachedStandingDataInMemory.FieldDescriptions = fieldDescriptions;
        },

        PopulateGrid: function (sEntity)
        {
            var cachedFieldDescriptions = TriSysApex.Cache.FieldDescriptions();
            var fieldDescriptions = [];
            for (var i = 0; i < cachedFieldDescriptions.length; i++)
            {
                var fieldDescription = cachedFieldDescriptions[i];
                if (fieldDescription.TableName.indexOf(sEntity) == 0)
                {
                    fieldDescriptions.push(fieldDescription);
                }
            }

            // Important Bug: We must take a copy of the field descriptions as we do not want to edit them
            var fieldDescriptionsForGridArray = JSON.parse(JSON.stringify(fieldDescriptions));
            
            var sDivTag = AdminConsole.FieldDescriptionsGridID;
            var sGridName = sDivTag + '-GridInstance';

            TriSysSDK.Grid.VirtualMode({
                Div: sDivTag,
                ID: sGridName,
                Title: "Field Descriptions",
                RecordsPerPage: TriSysApex.UserOptions.RecordsPerPage(),
                PopulationByObject: fieldDescriptionsForGridArray,
                Columns: [
                    { field: "FieldId", title: "FieldId", type: "number", width: 70, hidden: true },
                    { field: "TableName", title: "TableName", type: "string" },
                    { field: "TableFieldName", title: "TableFieldName", type: "string" },
                    { field: "FieldTypeId", title: "FieldTypeId", type: "number", hidden: true },
                    { field: "FieldTypeName", title: "Field Type", type: "string" },
                    { field: "Lookup", title: "Lookup", type: "string", template: '# if(Lookup == "true"){#Yes#}else{#No#} #' },
                    { field: "DefaultValue", title: "Default Value", type: "string" },
                    { field: "Description", title: "Description", type: "string" }],

                KeyColumnName: "FieldId",
                DrillDownFunction: function (rowData)
                {
                    AdminConsole.FieldDescriptions.Open(rowData.FieldId);
                },
                MultiRowSelect: true,
                Grouping: false
            });
        },

        GetSelectedSingletonFieldIdFromGrid: function ()
        {
            var lFieldId = TriSysSDK.Grid.GetSelectedSingletonRowRecordIdFromGrid(AdminConsole.FieldDescriptionsGridID, "FieldId", "field description");
            return lFieldId;
        },

        GetSelectedFieldFromGrid: function (sField)
        {
            var sFieldValue = TriSysSDK.Grid.GetSelectedSingletonRowFieldValueFromGrid(AdminConsole.FieldDescriptionsGridID, sField, "field description");
            return sFieldValue;
        },

        // Open the field description dialogue
        Open: function (lFieldId)
        {
            if (TriSysAPI.Operators.isEmpty(lFieldId) )
            {
                // Read from the grid
                lFieldId = AdminConsole.FieldDescriptions.GetSelectedSingletonFieldIdFromGrid();
                if (!lFieldId || lFieldId <= 0)
                    return;
            }

            var sEntityName =  TriSysSDK.CShowForm.GetTextFromCombo('adminConsoleForm-Entity');

            // Open the popup now
            var parametersObject = new TriSysApex.UI.ShowMessageParameters();
            parametersObject.Title = (lFieldId == 0 ? "New" : "Edit") + " Field Description";
            parametersObject.Image = "gi-wrench";
            parametersObject.FullScreen = true;  
            parametersObject.CloseTopRightButton = true;

            parametersObject.ContentURL = TriSysApex.Constants.UserControlFolder + "ctrlFieldDescription.html";

            parametersObject.OnLoadCallback = function ()
            {
                // Tell it to load this field
                ctrlFieldDescription.Load(lFieldId, sEntityName);
            };

            parametersObject.ButtonRightText = "Close";
            parametersObject.ButtonRightVisible = true;

            parametersObject.ButtonLeftText = "Save";
            parametersObject.ButtonLeftVisible = true;
            parametersObject.ButtonLeftFunction = function ()
            {
                var fnOnSave = function (fieldDescription)
                {
                    TriSysApex.UI.CloseModalPopup();
                    
                    // Replace in cache
                    AdminConsole.FieldDescriptions.UpdatedFieldDescription(fieldDescription,
                        function ()
                        {
                            // Refresh grid
                            AdminConsole.FieldDescriptions.PopulateGrid(sEntityName);
                        });                    
                };

                ctrlFieldDescription.SaveButtonClick(fnOnSave);
            };

            TriSysApex.UI.PopupMessage(parametersObject);            
        },

        Delete: function ()
        {
            // Read from the grid
            lFieldId = AdminConsole.FieldDescriptions.GetSelectedSingletonFieldIdFromGrid();
            if (!lFieldId || lFieldId <= 0)
                return;

            var sTable = AdminConsole.FieldDescriptions.GetSelectedFieldFromGrid("TableName");

            // Simple validation
            if (sTable.indexOf("ConfigFields") < 0)
            {
                TriSysApex.UI.ShowMessage("You are not permitted to remove fixed fields.");
                return;
            }

            // Prompt user for confirmation
            var fnYes = function ()
            {
                // Call the web service but expect that it will make a determination on whether the
                // field can indeed be deleted.

                var CFieldDescriptionDeleteRequest =
                {
                    FieldId: lFieldId
                };

                var payloadObject = {};

                payloadObject.OutboundDataPacket = CFieldDescriptionDeleteRequest;

                // Call the API to submit the data to the server
                payloadObject.URL = "FieldDescription/Delete";

                payloadObject.InboundDataFunction = function (CFieldDescriptionDeleteResponse)
                {
                    TriSysApex.UI.HideWait();

                    if (CFieldDescriptionDeleteResponse)
                    {
                        if (CFieldDescriptionDeleteResponse.Success)
                        {
                            // Delete the field from our list and refresh the grid...

                            // Remove from cache
                            AdminConsole.FieldDescriptions.RemoveFieldDescription(lFieldId,
                                function ()
                                {
                                    // Refresh grid
                                    AdminConsole.FieldDescriptions.PopulateGrid(sTable);
                                });

                            return;
                        }
                        else
                            TriSysApex.UI.ShowMessage(CFieldDescriptionDeleteResponse.ErrorMessage);
                    }
                };

                payloadObject.ErrorHandlerFunction = function (request, status, error)
                {
                    TriSysApex.UI.HideWait();
                    TriSysApex.UI.errorAlert('AdminConsole.FieldDescriptions.Delete: ' + status + ": " + error + ". responseText: " + request.responseText);
                };

                TriSysApex.UI.ShowWait(null, "Deleting Field Description...");
                TriSysAPI.Data.PostToWebAPI(payloadObject);

                return true;
            };

            var sField = sTable + "." + AdminConsole.FieldDescriptions.GetSelectedFieldFromGrid("TableFieldName");

            var sMessage = "Are you sure that you wish to delete the field description: <br /><br /> &nbsp; " + sField +
                "<br /><br />" +
                "Warning: All data held in this field will also be deleted."
            TriSysApex.UI.questionYesNo(sMessage, "Delete Field Description", "Yes", fnYes, "No");
        },

		EntityBuilder: function()
		{
		    var sMessage = "The entity builder is currently in development." +
                "<br>Last updated January 2023."
		    TriSysApex.UI.ShowMessage(sMessage);
		},

		CustomEntityFields: function ()     // AdminConsole.FieldDescriptions.CustomEntityFields
		{
		    var sEntityName = TriSysSDK.CShowForm.GetTextFromCombo('adminConsoleForm-Entity');

		    var sTitle = sEntityName + " Form Custom Tab";
		    var sImage = "gi gi-cargo";

		    var fnOpenModalDialogue = function ()
		    {
		        var parametersObject = new TriSysApex.UI.ShowMessageParameters();

		        parametersObject.Title = sTitle;
		        parametersObject.Image = sImage;
		        parametersObject.Maximize = true;
		        parametersObject.FullScreen = true;
		        parametersObject.CloseTopRightButton = true;

		        parametersObject.ContentURL = TriSysApex.CustomFormsAndComponents.UserControlPath("ctrlEntityFormCustomTab.html");

		        // Callback
		        parametersObject.OnLoadCallback = function () {
		            ctrlEntityFormCustomTab.Load(sEntityName);
		        };

		        // Buttons
		        var sSaveText = "Save";
		        parametersObject.ButtonLeftVisible = true;
		        parametersObject.ButtonLeftText = sSaveText;
		        parametersObject.ButtonLeftFunction = function () {
		            var bSaved = ctrlEntityFormCustomTab.Save(sEntityName);
		            return bSaved;
		        };

		        parametersObject.ButtonRightVisible = true;
		        parametersObject.ButtonRightText = "Cancel";

		        TriSysApex.UI.PopupMessage(parametersObject);
		    };

		    TriSysApex.WhiteLabelling.LoadJavascriptFile('js/pages/ctrlEntityFormCustomTab.js', null, fnOpenModalDialogue);
		}
    },
    //#endregion AdminConsole.FieldDescriptions

    //#region AdminConsole.SQL Query

    // January 2018
    // This functionality was turned off because the SQLDatabase/SQL_Select function is going to be deprecated
    // due to security concerns.
    // We can decide later whether to re-instate this functionality if necessary.

    RunSQLQuery: function()
    {
        var sSQL = $('#admin-console-sql-query').val();
        if (!sSQL)
            return;

        AdminConsole.CurrentSQLQuery = sSQL;
        TriSysSDK.Database.GetDataSet(sSQL, AdminConsole.PopulateSQLGrid);
    },

    CurrentSQLQuery: null,

    // Read the columns from the data set and layout the virtual grid before population.
    PopulateSQLGrid: function (CSQLDatabaseSearchResults)
    {
        if (CSQLDatabaseSearchResults)
        {
            if (CSQLDatabaseSearchResults.DataTable)
            {
                var searchColumns = CSQLDatabaseSearchResults.Columns;
                if (searchColumns)
                {
                    var columns = [];
                    for (var i = 0; i < searchColumns.length; i++)
                    {
                        var searchColumn = searchColumns[i];
                        var column = { field: searchColumn, title: searchColumn, type: "string" };
                        columns.push(column);
                    }

                    // Virtual grid
                    var sGridName = AdminConsole.SQLManagerGridID - '-GridInstance';

                    TriSysSDK.Grid.VirtualMode({
                        Div: AdminConsole.SQLManagerGridID,
                        ID: sGridName,
                        Title: "SQL Manager",
                        RecordsPerPage: TriSysApex.UserOptions.RecordsPerPage(),
                        SQL: AdminConsole.CurrentSQLQuery,
                        //OrderBy: "Order by Name",
                        Columns: columns,

                        MultiRowSelect: false,
                        Grouping: TriSysApex.UserOptions.GridGrouping(),
                        ColumnFilters: true
                    });
                }
            }
            else
                TriSysApex.UI.errorAlert(CSQLDatabaseSearchResults.ErrorMessage);
        }
    },
    //#endregion AdminConsole.SQL Query

    //#region AdminConsole.DocumentManager
    DocumentManager:
    {
        LoadFolders: function()
        {
            // Call Web API to get a list of folders which this user is permitted to manage
            AdminConsole.DocumentManager.PopulateFolders();

            TriSysSDK.FormMenus.DrawGridMenu('adminConsoleForm-DocumentGridMenu', AdminConsole.DocumentGridID);
            setTimeout(TriSysProUI.kendoUI_Overrides, 500);
        },

        PopulateFolders: function ()
        {
            // Call web service to get the list of all files in this folder
            var payloadObject = {};

            // Call the API to submit the data to the server
            payloadObject.URL = "Files/DocumentManagerFolders";

            payloadObject.OutboundDataPacket = null;

            payloadObject.InboundDataFunction = function (CDocumentManagerFoldersResponse)
            {
                if (CDocumentManagerFoldersResponse)
                {
                    if (CDocumentManagerFoldersResponse.Success)
                    {
                        AdminConsole.DocumentManager.DisplayFolders(CDocumentManagerFoldersResponse.Folders);

                        return;
                    }
                    else
                        TriSysApex.UI.ShowMessage(CDocumentManagerFoldersResponse.ErrorMessage);
                }
            };

            payloadObject.ErrorHandlerFunction = function (request, status, error)
            {
                // 26 Apr 2022: Getting this for blank folders
                TriSysApex.Logging.LogMessage('AdminConsole.DocumentManager.PopulateFolders: ' + status + ": " + error + ". responseText: " + request.responseText);
            };

            TriSysAPI.Data.PostToWebAPI(payloadObject);
        },

        DisplayFolders: function(folders)
        {
            var sDivTag = 'adminConsoleForm-FolderGrid';
            var sGridName = sDivTag + '-GridInstance';

            var fnRowClickHandler = function (e, gridObject, gridLayout)
            {
                var selectedItem = TriSysSDK.Grid.GetFirstGridCheckedItem(gridObject);

                if (selectedItem)
                {
                    var sFolder = selectedItem.FolderName;
                    $('#adminConsoleForm-SelectedFolder').html(sFolder);

                    AdminConsole.DocumentManager.PopulateFiles(sFolder);
                }
            };

            var foldersDataSource = [];
            for (var i = 0; i < folders.length; i++)
            {
                var sFolder = folders[i];
                foldersDataSource.push({ FolderName: sFolder });
            }

            TriSysSDK.Grid.VirtualMode({
                Div: sDivTag,
                ID: sGridName,
                Title: "Folders",
                RecordsPerPage: TriSysApex.UserOptions.RecordsPerPage(),
                PopulationByObject: foldersDataSource,
                Columns: [{ field: "FolderName", title: "Folder Name", type: "string" }],
                DrillDownFunction: null,
                MultiRowSelect: false,
                SingleRowSelect: true,
                RowClickHandler: fnRowClickHandler,
                Grouping: false,
                PageSelector: false,        // Limited space
                PageSizeSelector: false
            });

            // 14 Apr 2023: ApexError for a customer in .select
            try {
                var grid = $('#' + sDivTag).data("kendoGrid");
                grid.select(1);

            } catch (e) {
                TriSysApex.Logging.LogMessage(TriSysApex.Logging.CatchVariableToText(e));
            }

            // Let the grid accept file drag and drop
            AdminConsole.DocumentManager.DragAndDropFileHandler();
        },

        PopulateFiles: function(sFolder)
        {
            // Call web service to get the list of all files in this folder
            var payloadObject = {};

            // Call the API to submit the data to the server
            payloadObject.URL = "Files/DocumentManagerFiles";

            var CDocumentManagerFilesRequest = { Folder: sFolder };

            payloadObject.OutboundDataPacket = CDocumentManagerFilesRequest;

            payloadObject.InboundDataFunction = function (CDocumentManagerFilesResponse)
            {
                if (CDocumentManagerFilesResponse)
                {
                    if (CDocumentManagerFilesResponse.Success)
                    {
                        AdminConsole.DocumentManager.DisplayFiles(CDocumentManagerFilesResponse.Files);

                        return;
                    }
                    else
                        TriSysApex.UI.ShowMessage(CDocumentManagerFilesResponse.ErrorMessage);
                }
            };

            payloadObject.ErrorHandlerFunction = function (request, status, error)
            {
                TriSysApex.UI.errorAlert('AdminConsole.DocumentManager.PopulateFiles: ' + status + ": " + error + ". responseText: " + request.responseText);
            };

            TriSysAPI.Data.PostToWebAPI(payloadObject);
        },

        DisplayFiles: function(files)
        {
            // See CVAR for knowledge of displaying files in a grid
            if (!files)
                files = [];

            var columns = [
                    { field: "FullPath", title: "Full Path", type: "string", hidden: true },
                    { field: "Name", title: "Document", type: "string" },
                    { field: "DateModified", title: "Date Last Modified", type: "date", format: "{0:dd MMM yyyy}", width: 130 },
                    { field: "Size", title: "Size", type: "string", width: 130 }
            ];

            TriSysSDK.Grid.VirtualMode({
                Div: AdminConsole.DocumentGridID,
                ID: AdminConsole.DocumentGridID + 'grd',
                Title: "Documents",
                RecordsPerPage: TriSysApex.UserOptions.RecordsPerPage(),
                PopulationByObject: files,
                Columns: columns,
                MobileVisibleColumns: [
                            { field: "FullPath" }
                ],
                MobileRowTemplate: '<td colspan="1"><strong>#: FullPath #</strong><br />' +
                                '<i>#: DateModified #</i></td>',

                KeyColumnName: "FullPath",
                DrillDownFunction: function (rowData)
                {
                    AdminConsole.DocumentManager.OpenDocument(rowData.FullPath, rowData.Name);
                },
                MultiRowSelect: true,
                Grouping: false,
                ColumnFilters: false,
                OpenButtonCaption: "Open",
                HyperlinkedColumns: ["Name"]                // New Jan 2021
            });
        },

        OpenDocument: function(sURL, sName)
        {
            var sTitle = "Document Manager";

            if (TriSysSDK.Controls.FileManager.isHTMLFile(sURL))
            {
                var fnAfterSave = function ()
                {
                    // Reload the list of files in this folder only to show the updated date last modified and size
                    var sFolder = AdminConsole.DocumentManager.GetFolderPath();
                    AdminConsole.DocumentManager.PopulateFiles(sFolder);
                };

                TriSysSDK.Controls.FileManager.OpenHTMLEditor(sTitle, sURL, sName, fnAfterSave);
            }
            else
			{
				// Sep 2018 and we have live editing of word documents!
				TriSysApex.Pages.FileManagerForm.FileOpenDrillDown(sURL);
                //TriSysSDK.Controls.FileManager.GetOpenFileURLFromWebService(sTitle, sURL, sName);
			}
        },

        DragAndDropFileHandler: function ()
        {
            // Our own file upload handler
            var obj = $("#" + AdminConsole.DocumentGridID);

            obj.on('dragenter', function (e)
            {
                e.stopPropagation();
                e.preventDefault();
            });

            obj.on('dragover', function (e)
            {
                e.stopPropagation();
                e.preventDefault();
            });

            obj.on('drop', function (e)
            {
                e.preventDefault();

                // Set our stack ready for processing
                var fileCollection = e.originalEvent.dataTransfer.files;

                // Turn it into an array we can manipulate
                var multipleUploadFiles = [];
                for (var i = 0; i < fileCollection.length; i++)
                {
                    multipleUploadFiles.push(fileCollection[i]);
                }

                // Begin processing the stack
                AdminConsole.DocumentManager.UploadFiles(multipleUploadFiles);
            });
        },

        GetFolderPath: function()
        {
            var sFolder = $('#adminConsoleForm-SelectedFolder').html();
            return sFolder;
        },

        // Called for drag/drop operations
        UploadFiles: function (uploadFiles)
        {
            if (!uploadFiles)
                return false;       // No more files to do in queue

            if (uploadFiles.length == 0)
                return false;

            // Pop first file off the stack
            var nextFile = uploadFiles[0];

            // The callback when the file has been uploaded
            var fnCallback = function (myFile)
            {
                AdminConsole.DocumentManager.UploadDocument(myFile, uploadFiles);
            };

            // Upload the file through the standard route
            TriSysSDK.Controls.FileManager.UploadFile(nextFile, fnCallback);

            // Remove first element after processing
            uploadFiles.splice(0, 1);

            return true;
        },

        Add: function ()
        {
            // Popup file selection dialogue to upload a file or to choose one from a cloud storage service e.g. dropbox
            TriSysSDK.Controls.FileManager.FindFileUpload("Upload Document", AdminConsole.DocumentManager.UploadDocument);
        },

        UploadDocument: function (sFilePath, uploadFiles)
        {
            // Call Web API to move this temporary file into the g:\ folder and return this path to us
            // so that we can refresh the grid
            var payloadObject = {};

            payloadObject.URL = "Files/MoveUploadedFileReferenceDocument";

            var sFolder = AdminConsole.DocumentManager.GetFolderPath();

            payloadObject.OutboundDataPacket = {
                UploadedFilePath: sFilePath,
                SubFolder: sFolder
            };

            payloadObject.InboundDataFunction = function (data)
            {
                TriSysApex.UI.HideWait();
                var JSONdataset = data;

                if (JSONdataset)
                {
                    if (JSONdataset.Success)
                    {
                        var sFilePath = JSONdataset.FolderFilePath;
                        AdminConsole.DocumentManager.PopulateFiles(sFolder);

                        if (uploadFiles)
                            AdminConsole.DocumentManager.UploadFiles(uploadFiles);
                    }
                    else
                    {
                        TriSysApex.UI.errorAlert(JSONdataset.ErrorMessage);
                    }
                } else
                {
                    // Something else has gone wrong!
                }
            };

            payloadObject.ErrorHandlerFunction = function (request, status, error)
            {
                TriSysApex.UI.HideWait();
                TriSysApex.UI.ErrorHandlerRedirector('AdminConsole.DocumentManager.UploadDocument: ', request, status, error);
            };

            var sName = TriSysSDK.Controls.FileManager.GetFileNameFromPath(sFilePath);
            TriSysApex.UI.ShowWait(null, "Uploading " + sName + "...");
            TriSysAPI.Data.PostToWebAPI(payloadObject);
        },

        Remove: function()
        {
            // Get one or more selected files, delete it and refresh grid
            var lstFiles = TriSysSDK.Grid.GetSelectedMultipleRowsFromGrid(AdminConsole.DocumentGridID, "FullPath");
            if (lstFiles && lstFiles.length > 0)
            {
                var sFileList = '';
                for (var i = 0; i < lstFiles.length; i++)
                {
                    var sFilePath = lstFiles[i];
                    var sName = TriSysSDK.Controls.FileManager.GetFileNameFromPath(sFilePath);

                    if (sFileList.length > 0)
                        sFileList += "<br />";
                    sFileList += sName
                }

                var trailingS = (lstFiles.length == 1 ? '' : 's');

                var sMessage = "Are you sure that you wish to remove the following file" + trailingS + "?" +
                    "<br /><br />" + sFileList;
                TriSysApex.UI.questionYesNo(sMessage, "Remove Document" + trailingS, "Yes",
                        function ()
                        {
                            AdminConsole.DocumentManager.RemoveFilesAfterConfirmation(lstFiles);
                            return true;
                        },
                        "No");
            }
            else
                TriSysApex.UI.ShowMessage("Please select one or more documents.");
        },

        RemoveFilesAfterConfirmation: function (lstFiles)
        {
            for (var i = 0; i < lstFiles.length; i++)
            {
                var sFilePath = lstFiles[i];

                AdminConsole.DocumentManager.DeleteFile(sFilePath);
            }
        },

        DeleteFile: function (sFilePath)
        {
            // Send to Web API to delete the specified file
            var payloadObject = {};

            payloadObject.URL = "Files/DeleteFile";

            var CDeleteFileRequest = {
                FilePath: sFilePath
            };

            payloadObject.OutboundDataPacket = CDeleteFileRequest;

            payloadObject.InboundDataFunction = function (data)
            {
                TriSysApex.UI.HideWait();
                var CDeleteFileResponse = data;

                if (CDeleteFileResponse)
                {
                    if (CDeleteFileResponse.Success)
                    {
                        // Refresh grid
                        var sFolder = AdminConsole.DocumentManager.GetFolderPath();
                        AdminConsole.DocumentManager.PopulateFiles(sFolder);
                    }
                    else
                    {
                        TriSysApex.UI.errorAlert(CDeleteFileResponse.ErrorMessage);
                    }
                } else
                {
                    // Something else has gone wrong!
                }
            };

            payloadObject.ErrorHandlerFunction = function (request, status, error)
            {
                TriSysApex.UI.HideWait();
                TriSysApex.UI.ErrorHandlerRedirector('AdminConsole.DocumentManager.DeleteFile: ', request, status, error);
            };

            var sName = TriSysSDK.Controls.FileManager.GetFileNameFromPath(sFilePath);
            TriSysApex.UI.ShowWait(null, "Deleting " + sName + "...");
            TriSysAPI.Data.PostToWebAPI(payloadObject);
        }
    },
    //#endregion AdminConsole.DocumentManager

    InvalidCVPaths:
    {
        LoadContacts: function()
        {
            // Call web service to get the list of all files in this folder
            var payloadObject = {};

            // Call the API to submit the data to the server
            payloadObject.URL = "ContactCV/InvalidCVFilePaths";

            payloadObject.InboundDataFunction = function (CInvalidCVFilePathsResponse)
            {
                TriSysApex.UI.HideWait();

                if (CInvalidCVFilePathsResponse)
                {
                    if (CInvalidCVFilePathsResponse.Success)
                    {
                        AdminConsole.InvalidCVPaths.DisplayContactAndFileGrid(CInvalidCVFilePathsResponse.Contacts);

                        return;
                    }
                    else
                        TriSysApex.UI.ShowMessage(CInvalidCVFilePathsResponse.ErrorMessage);
                }
            };

            payloadObject.ErrorHandlerFunction = function (request, status, error)
            {
                TriSysApex.UI.HideWait();
                TriSysApex.UI.errorAlert('AdminConsole.InvalidCVPaths.LoadContacts: ' + status + ": " + error + ". responseText: " + request.responseText);
            };

            TriSysApex.UI.ShowWait(null, "Checking CV's...");
            TriSysAPI.Data.PostToWebAPI(payloadObject);
        },

        DisplayContactAndFileGrid: function (contacts)
        {
            if (!contacts)
                contacts = [];

            var columns = [
                    { field: "ContactId", title: "ID", type: "number", hidden: true },
                    { field: "FullName", title: "Candidate Name", type: "string" },
                    { field: "CVFileRef", title: "CVFileRef", type: "string" },
                    { field: "FormattedCVFileRef1", title: "FormattedCVFileRef1", type: "string" },
                    { field: "FormattedCVFileRef2", title: "FormattedCVFileRef2", type: "string" },
                    { field: "FormattedCVFileRef3", title: "FormattedCVFileRef3", type: "string" },
                    { field: "FormattedCVFileRef4", title: "FormattedCVFileRef4", type: "string" }
            ];

            TriSysSDK.Grid.VirtualMode({
                Div: AdminConsole.InvalidCVPathGridID,
                ID: AdminConsole.InvalidCVPathGridID + 'grd',
                Title: "Invalid CV",
                RecordsPerPage: TriSysApex.UserOptions.RecordsPerPage(),
                PopulationByObject: contacts,
                Columns: columns,
                KeyColumnName: "ContactId",
                DrillDownFunction: function (rowData)
                {
                    TriSysApex.FormsManager.OpenForm("Contact", rowData.ContactId);
                },
                MultiRowSelect: true,
                Grouping: false,
                ColumnFilters: false,
                OpenButtonCaption: "Open"
            });
        }
    },

    //#region Performance Targets
    _LoadedPerformanceTargetSubsystem: false,

    LoadPerformanceTargetSubsystem: function()
    {
        if (AdminConsole._LoadedPerformanceTargetSubsystem)
        {
            if (AdminConsole.arePerformanceTargetsShownByUser())
            {
                var lUserId = TriSysSDK.CShowForm.GetValueFromCombo(AdminConsole.PerformanceTargetComboUserID);
                AdminConsole.PopulatePerformanceTargetsGridForUser(lUserId);
            }
            else
            {
                var sTargetAndPeriodValueJSON = TriSysSDK.CShowForm.GetValueFromCombo(AdminConsole.PerformanceTargetComboID);
                var CPerformanceTargetsGridSQLRequest = JSON.parse(sTargetAndPeriodValueJSON);
                AdminConsole.PopulatePerformanceTargetsGrid(CPerformanceTargetsGridSQLRequest.PerformanceTargetId, CPerformanceTargetsGridSQLRequest.PerformanceTargetPeriodId);
            }
    
            return;
        }
        AdminConsole._LoadedPerformanceTargetSubsystem = true;

        $('#adminConsoleForm-PerformanceTargetByUser').click(function ()
        {
            var bShowUsersInCombo = $(this).is(':checked');

            if (bShowUsersInCombo)
            {
                $('#adminConsoleForm-PerformanceTargetCombo-ByTarget').hide();
                $('#adminConsoleForm-PerformanceTargetCombo-ByUser').show();
            }
            else
            {
                $('#adminConsoleForm-PerformanceTargetCombo-ByTarget').show();
                $('#adminConsoleForm-PerformanceTargetCombo-ByUser').hide();
            }

            AdminConsole.LoadPerformanceTargetSubsystem();
        });

        AdminConsole.LoadPerformanceTargetCombo();

        var fnSelectUser = function (lUserId, sUserName)
        {
            //TriSysApex.UI.ShowMessage(lUserId + ", " + sUserName);
            AdminConsole.PopulatePerformanceTargetsGridForUser(lUserId);
        }
        TriSysSDK.CShowForm.UserCombo(AdminConsole.PerformanceTargetComboUserID, fnSelectUser);
    },

    arePerformanceTargetsShownByUser: function()
    {
        var bChecked = TriSysSDK.CShowForm.GetCheckBoxValue('adminConsoleForm-PerformanceTargetByUser');
        return bChecked;
    },

    LoadPerformanceTargetCombo: function (sTargetMetricByPeriod)
    {
        var payloadObject = {};

        payloadObject.URL = "PerformanceTargets/TargetList";

        payloadObject.InboundDataFunction = function (CPerformanceTargetListResponse)
        {
            TriSysApex.UI.HideWait();

            if (CPerformanceTargetListResponse)
            {
                if (CPerformanceTargetListResponse.Success)
                {
                    var fnSelectTarget = function (sTargetAndPeriodJSONstring, sTargetNameByPeriod)
                    {
                        // Rich object is JSON string
                        var targetAndPeriod = JSON.parse(sTargetAndPeriodJSONstring);

                        var lPerformanceTargetId = targetAndPeriod.PerformanceTargetId;
                        var lPerformanceTargetPeriodId = targetAndPeriod.PerformanceTargetPeriodId;

                        AdminConsole.PopulatePerformanceTargetsGrid(lPerformanceTargetId, lPerformanceTargetPeriodId);
                    };

                    var targets = [], firstTarget = null;
                    for (var i = 0; i < CPerformanceTargetListResponse.TargetList.length; i++)
                    {
                        var target = CPerformanceTargetListResponse.TargetList[i];

                        // Create a rich object
                        var targetAndPeriod = { PerformanceTargetId: target.PerformanceTargetId, PerformanceTargetPeriodId: target.PerformanceTargetPeriodId };

                        // Must convert this to string
                        var sTargetAndPeriodJSONstring = JSON.stringify(targetAndPeriod);

                        var targetItem = { value: sTargetAndPeriodJSONstring, text: target.TargetNameByPeriod };
                        targets.push(targetItem);

                        if (!firstTarget)
                            firstTarget = targetItem;
                    }

                    TriSysSDK.CShowForm.populateComboFromDataSource(AdminConsole.PerformanceTargetComboID, targets, null, fnSelectTarget);

                    if (firstTarget)
                        fnSelectTarget(firstTarget.value, firstTarget.text);
                }
                else
                    TriSysApex.UI.ShowError(CPerformanceTargetListResponse.ErrorMessage);    // Catastrophic error
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('AdminConsole.LoadPerformanceTargetCombo: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Populating Targets...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    PopulatePerformanceTargetsGrid: function (lPerformanceTargetId, lPerformanceTargetPeriodId)
    {
        // Jan 2018: Use a dedicated API method which abstracts the underlying SQL and does not use 'SQLDatabase/SQL_Select'
        var fnPopulationByFunction = {
            API: "PerformanceTargets/List",              // The Web API Controller/Function

            // The additional parameters passed into the function not including the paging metrics
            Parameters: function (request)
            {
                request.PerformanceTargetId = lPerformanceTargetId;
                request.PerformanceTargetPeriodId = lPerformanceTargetPeriodId;
            },

            DataTableFunction: function (response)  // Called to get a suitable data table for the grid to display
            {
                return response.List;               // The list of records from the Web API
            }
        };

        AdminConsole.PopulatePerformanceTargetsGridByFunction(fnPopulationByFunction);
    },

    PopulatePerformanceTargetsGridByFunction: function (fnPopulationByFunction, bByUser)
    {
        var sGridName = AdminConsole.PerformanceTargetsGridID - '-GridInstance';

        var nameColumn = (bByUser ? { field: "TargetPeriod", title: "Target", type: "string" } : { field: "Name", title: "User", type: "string" });

        TriSysSDK.Grid.VirtualMode({
            Div: AdminConsole.PerformanceTargetsGridID,
            ID: sGridName,
            Title: "Performance Targets",
            RecordsPerPage: TriSysApex.UserOptions.RecordsPerPage(),
            PopulationByFunction: fnPopulationByFunction,
            Columns: [
                { field: "UserId", title: "UserId", type: "number", width: 70, hidden: true },
                { field: "PerformanceTargetId", title: "PerformanceTargetId", type: "number", width: 70, hidden: true },
                { field: "PerformanceTargetUserId", title: "PerformanceTargetUserId", type: "number", width: 70, hidden: true },
                { field: "PerformanceTargetPeriodId", title: "PerformanceTargetPeriodId", type: "number", width: 70, hidden: true },
                nameColumn,
                { field: "TargetValue", title: "Value", type: "string" },
                { field: "StartDate", title: "Start", type: "date", format: "{0:dd MMM yyyy }" },
                { field: "EndDate", title: "End", type: "date", format: "{0:dd MMM yyyy }" }],

            KeyColumnName: "UserId",
            DrillDownFunction: function (rowData)
            {
                AdminConsole.EditPerformanceTargetDialogue(rowData.UserId, rowData.PerformanceTargetId, rowData.PerformanceTargetUserId, rowData.PerformanceTargetPeriodId);
            },
            MultiRowSelect: true,
            Grouping: false,
            ColumnFilters: true,
            OpenButtonCaption: "Open"
        });
    },

    PopulatePerformanceTargetsGridForUser: function(lUserId)
    {
        // Jan 2018: Use a dedicated API method which abstracts the underlying SQL and does not use 'SQLDatabase/SQL_Select'
        var fnPopulationByFunction = {
            API: "PerformanceTargets/List",              // The Web API Controller/Function

            // The additional parameters passed into the function not including the paging metrics
            Parameters: function (request)
            {
                request.UserId = lUserId;
            },

            DataTableFunction: function (response)  // Called to get a suitable data table for the grid to display
            {
                return response.List;               // The list of records from the Web API
            }
        };

        AdminConsole.PopulatePerformanceTargetsGridByFunction(fnPopulationByFunction, true);
    },

    EditPerformanceTargetDialogue: function (lUserId, lPerformanceTargetId, lPerformanceTargetUserId, lPerformanceTargetPeriodId, bClone)
    {
        var sTargetAndPeriod = TriSysSDK.CShowForm.GetTextFromCombo(AdminConsole.PerformanceTargetComboID);
        var sUserName = TriSysApex.Cache.UsersManager.FullName(lUserId);

        var targetDialogueData = {

            TargetAndPeriod: sTargetAndPeriod,
            UserName: sUserName,
            UserId: lUserId,
            PerformanceTargetId: lPerformanceTargetId,
            PerformanceTargetUserId: lPerformanceTargetUserId,
            PerformanceTargetPeriodId: lPerformanceTargetPeriodId,
            Clone: bClone

        };

        var parametersObject = new TriSysApex.UI.ShowMessageParameters();
        parametersObject.Title = "Edit User Performance Target";
        parametersObject.Image = "gi-money";
        parametersObject.CloseTopRightButton = true;

        parametersObject.ContentURL = TriSysApex.Constants.UserControlFolder + "ctrlUserPerformanceTarget.html";

        parametersObject.OnLoadCallback = function ()
        {
            ctrlUserPerformanceTarget.Load(targetDialogueData);
        };

        parametersObject.ButtonRightText = "Cancel";
        parametersObject.ButtonRightVisible = true;

        parametersObject.ButtonLeftText = "Save";
        parametersObject.ButtonLeftVisible = true;
        parametersObject.ButtonLeftFunction = function ()
        {
            var fnOnSave = function ()
            {
                TriSysApex.UI.CloseModalPopup();
                //AdminConsole.PopulatePerformanceTargetsGrid(lPerformanceTargetId, lPerformanceTargetPeriodId);
                AdminConsole.LoadPerformanceTargetSubsystem();
            };

            ctrlUserPerformanceTarget.SaveButtonClick(targetDialogueData, fnOnSave);
        };

        TriSysApex.UI.PopupMessage(parametersObject);
    },

    AddTargetMetric: function()
    {
        var parametersObject = new TriSysApex.UI.ShowMessageParameters();
        parametersObject.Title = "Add Performance Target Metric";
        parametersObject.Image = "gi-money";
        parametersObject.CloseTopRightButton = true;

        parametersObject.ContentURL = TriSysApex.Constants.UserControlFolder + "ctrlAddPerformanceTarget.html";

        parametersObject.OnLoadCallback = function ()
        {
            ctrlAddPerformanceTarget.Load();
        };

        parametersObject.ButtonRightText = "Cancel";
        parametersObject.ButtonRightVisible = true;

        parametersObject.ButtonLeftText = "Save";
        parametersObject.ButtonLeftVisible = true;
        parametersObject.ButtonLeftFunction = function ()
        {
            var fnOnSave = function (sTargetName, lPeriodId)
            {
                TriSysApex.UI.CloseModalPopup();
                //AdminConsole.LoadPerformanceTargetCombo(sTargetName, lPeriodId);
                AdminConsole.LoadPerformanceTargetSubsystem();
            };

            ctrlAddPerformanceTarget.SaveButtonClick(fnOnSave);
        };

        TriSysApex.UI.PopupMessage(parametersObject);
    },

    DeleteTargetMetric: function ()
    {
        var sTargetAndPeriod = TriSysSDK.CShowForm.GetTextFromCombo(AdminConsole.PerformanceTargetComboID);
        var sTargetAndPeriodValueJSON = TriSysSDK.CShowForm.GetValueFromCombo(AdminConsole.PerformanceTargetComboID);
        var CPerformanceTargetsGridSQLRequest = JSON.parse(sTargetAndPeriodValueJSON);
        
        var fnDeleteConfirmed = function ()
        {
            AdminConsole.DeleteTargetMetricViaWebAPI(CPerformanceTargetsGridSQLRequest);
            return true;
        };

        var sMessage = "Are you sure that you wish to delete the target metric '" + sTargetAndPeriod + "'?" +
                    "<br />" + "Note that all user targets for this metric will also be deleted.";
        TriSysApex.UI.questionYesNo(sMessage, "Delete " + TriSysApex.Copyright.ShortProductName + " Target Metric", "Yes", fnDeleteConfirmed, "No");        
    },

    DeleteTargetMetricViaWebAPI: function (CPerformanceTargetsDeleteMetricRequest)
    {
        var payloadObject = {};

        payloadObject.URL = "PerformanceTargets/DeleteTargetMetric";

        payloadObject.OutboundDataPacket = CPerformanceTargetsDeleteMetricRequest;

        payloadObject.InboundDataFunction = function (CPerformanceTargetsDeleteMetricResponse)
        {
            TriSysApex.UI.HideWait();

            if (CPerformanceTargetsDeleteMetricResponse)
            {
                if (CPerformanceTargetsDeleteMetricResponse.Success)
                {
                    //AdminConsole.LoadPerformanceTargetCombo();
                    AdminConsole.LoadPerformanceTargetSubsystem();
                }
                else
                    TriSysApex.UI.ShowMessage(CPerformanceTargetsDeleteMetricResponse.ErrorMessage);    // Could be a warning about locked
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('AdminConsole.DeleteTargetMetricViaWebAPI: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Deleting Target Metric...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    EditTarget: function ()
    {
        var lUserId = TriSysSDK.Grid.GetSelectedSingletonRowRecordIdFromGrid(AdminConsole.PerformanceTargetsGridID, "UserId", "user target");
        var lPerformanceTargetId = TriSysSDK.Grid.GetSelectedSingletonRowRecordIdFromGrid(AdminConsole.PerformanceTargetsGridID, "PerformanceTargetId", "target", false);
        var lPerformanceTargetUserId = TriSysSDK.Grid.GetSelectedSingletonRowRecordIdFromGrid(AdminConsole.PerformanceTargetsGridID, "PerformanceTargetUserId", "user target", false);
        var lPerformanceTargetPeriodId = TriSysSDK.Grid.GetSelectedSingletonRowRecordIdFromGrid(AdminConsole.PerformanceTargetsGridID, "PerformanceTargetPeriodId", "target period", false);

        if (lUserId > 0 && lPerformanceTargetId > 0)
        {
            AdminConsole.EditPerformanceTargetDialogue(lUserId, lPerformanceTargetId, lPerformanceTargetUserId, lPerformanceTargetPeriodId);
        }
    },

    AddTarget: function()
    {
        var lUserId = TriSysSDK.Grid.GetSelectedSingletonRowRecordIdFromGrid(AdminConsole.PerformanceTargetsGridID, "UserId", "user target");
        var lPerformanceTargetId = TriSysSDK.Grid.GetSelectedSingletonRowRecordIdFromGrid(AdminConsole.PerformanceTargetsGridID, "PerformanceTargetId", "target", false);
        var lPerformanceTargetUserId = TriSysSDK.Grid.GetSelectedSingletonRowRecordIdFromGrid(AdminConsole.PerformanceTargetsGridID, "PerformanceTargetUserId", "user target", false);
        var lPerformanceTargetPeriodId = TriSysSDK.Grid.GetSelectedSingletonRowRecordIdFromGrid(AdminConsole.PerformanceTargetsGridID, "PerformanceTargetPeriodId", "target period", false);

        if (lPerformanceTargetUserId > 0)
        {
            AdminConsole.EditPerformanceTargetDialogue(lUserId, lPerformanceTargetId, lPerformanceTargetUserId, lPerformanceTargetPeriodId, true);
        }
        else
        {
            // Just allow normal edit
            AdminConsole.EditTarget();
        }
    },

    DeleteTarget: function ()
    {
        var lUserId = TriSysSDK.Grid.GetSelectedSingletonRowRecordIdFromGrid(AdminConsole.PerformanceTargetsGridID, "UserId", "user target");
        var lPerformanceTargetId = TriSysSDK.Grid.GetSelectedSingletonRowRecordIdFromGrid(AdminConsole.PerformanceTargetsGridID, "PerformanceTargetId", "target", false);
        var lPerformanceTargetUserId = TriSysSDK.Grid.GetSelectedSingletonRowRecordIdFromGrid(AdminConsole.PerformanceTargetsGridID, "PerformanceTargetUserId", "user target", false);
        var lPerformanceTargetPeriodId = TriSysSDK.Grid.GetSelectedSingletonRowRecordIdFromGrid(AdminConsole.PerformanceTargetsGridID, "PerformanceTargetPeriodId", "target period", false);
        
        if (lPerformanceTargetPeriodId > 0)
        {
            var CPerformanceTargetForUserDeleteRequest = { PerformanceTargetUserId: lPerformanceTargetUserId };

            var payloadObject = {};

            payloadObject.URL = "PerformanceTargets/DeleteUserTarget";

            payloadObject.OutboundDataPacket = CPerformanceTargetForUserDeleteRequest;

            payloadObject.InboundDataFunction = function (CPerformanceTargetForUserDeleteResponse)
            {
                TriSysApex.UI.HideWait();

                if (CPerformanceTargetForUserDeleteResponse)
                {
                    if (CPerformanceTargetForUserDeleteResponse.Success)
                    {
                        TriSysApex.UI.CloseModalPopup();
                        AdminConsole.PopulatePerformanceTargetsGrid(lPerformanceTargetId, lPerformanceTargetPeriodId);
                    }
                    else
                        TriSysApex.UI.ShowError(CPerformanceTargetForUserDeleteResponse.ErrorMessage);    // Validation error
                }
            };

            payloadObject.ErrorHandlerFunction = function (request, status, error)
            {
                TriSysApex.UI.HideWait();
                TriSysApex.UI.errorAlert('AdminConsole.DeleteTarget: ' + status + ": " + error + ". responseText: " + request.responseText);
            };

            TriSysApex.UI.ShowWait(null, "Deleting Target...");
            TriSysAPI.Data.PostToWebAPI(payloadObject);
        }
    },
    //#endregion Performance Targets

    //#region AdminConsole.StyleManager
    StyleManager:
    {
        Load: function()
        {
            // If logged in as specific users, then they can update styles
            var bAllowed = TriSysApex.Pages.Controller.isDesigner();

            if (bAllowed)
            {
                // If employing the services of a contractor, allow them access to this
                //$('#admin-console-tab-style-manager').show();

                var fnUploadCallback = function (sOperation, divTag, sFilePath, sDestinationFilePath)
                {
                    AdminConsole.StyleManager.MoveAppFile(sFilePath, sDestinationFilePath,
                            'Please Ctrl-F5 to refresh the application and load this new theme.');
                };

                // Column 1: Canada
                TriSysSDK.Controls.FileReference.Load('admin-console-css-file-lightning', null, function (sOperation, divTag, sFilePath)
                {
                    fnUploadCallback(sOperation, divTag, sFilePath, 'css/themes/lightning.css');
                });

                TriSysSDK.Controls.FileReference.Load('admin-console-css-file-thunder', null, function (sOperation, divTag, sFilePath)
                {
                    fnUploadCallback(sOperation, divTag, sFilePath, 'css/themes/thunder.css');
                });

                TriSysSDK.Controls.FileReference.Load('admin-console-css-file-jasper', null, function (sOperation, divTag, sFilePath)
                {
                    fnUploadCallback(sOperation, divTag, sFilePath, 'css/themes/jasper.css');
                });

                TriSysSDK.Controls.FileReference.Load('admin-console-css-file-whistler', null, function (sOperation, divTag, sFilePath)
                {
                    fnUploadCallback(sOperation, divTag, sFilePath, 'css/themes/whistler.css');
                });


                // Column 2: Clouds
                TriSysSDK.Controls.FileReference.Load('admin-console-css-file-stratus', null, function (sOperation, divTag, sFilePath)
                {
                    fnUploadCallback(sOperation, divTag, sFilePath, 'css/themes/stratus.css');
                });

                TriSysSDK.Controls.FileReference.Load('admin-console-css-file-cumulus', null, function (sOperation, divTag, sFilePath)
                {
                    fnUploadCallback(sOperation, divTag, sFilePath, 'css/themes/cumulus.css');
                });

                TriSysSDK.Controls.FileReference.Load('admin-console-css-file-nimbus', null, function (sOperation, divTag, sFilePath)
                {
                    fnUploadCallback(sOperation, divTag, sFilePath, 'css/themes/nimbus.css');
                });

                TriSysSDK.Controls.FileReference.Load('admin-console-css-file-cirrus', null, function (sOperation, divTag, sFilePath)
                {
                    fnUploadCallback(sOperation, divTag, sFilePath, 'css/themes/cirrus.css');
                });

                TriSysSDK.Controls.FileReference.Load('admin-console-css-file-northernlights', null, function (sOperation, divTag, sFilePath)
                {
                    fnUploadCallback(sOperation, divTag, sFilePath, 'css/themes/northernlights.css');
                });

                TriSysSDK.Controls.FileReference.Load('admin-console-css-file-crimson', null, function (sOperation, divTag, sFilePath)
                {
                    fnUploadCallback(sOperation, divTag, sFilePath, 'css/themes/crimson.css');
                });
            }
        },

        // Move an uploaded file to replace a production file
        MoveAppFile: function (sSourceFilePath, sDestinationFilePath, sSuccessInstructions)
        {
            var CReplaceProductionFileRequest = {
                SourceFilePath: sSourceFilePath,
                DestinationFilePath: sDestinationFilePath
            };

            TriSysApex.UI.ShowWait(null, "Uploading...");

            var payloadObject = {};
            payloadObject.URL = "DeveloperStudio/ReplaceProductionFile";
            payloadObject.OutboundDataPacket = CReplaceProductionFileRequest;
            payloadObject.InboundDataFunction = function (CReplaceProductionFileResponse)
            {
                TriSysApex.UI.HideWait();

                if (CReplaceProductionFileResponse)
                {
                    if (CReplaceProductionFileResponse.Success)
                    {
                        var sMessage = "You have uploaded and replaced " + sDestinationFilePath + "<br />" +
                                    sSuccessInstructions
                        TriSysApex.UI.ShowMessage(sMessage, TriSysWebJobs.Constants.ApplicationName);
                    }
                    else
                        TriSysApex.UI.errorAlert(CReplaceProductionFileResponse.ErrorMessage, TriSysWebJobs.Constants.ApplicationName);
                }
                else
                    TriSysApex.UI.ShowMessage("No response from " + payloadObject.URL, TriSysWebJobs.Constants.ApplicationName);

                return true;
            };
            payloadObject.ErrorHandlerFunction = function (request, status, error)
            {
                TriSysApex.UI.HideWait();
                TriSysApex.UI.ErrorHandlerRedirector('AdminConsole.StyleManager.MoveAppFile: ', request, status, error);
            };
            TriSysAPI.Data.PostToWebAPI(payloadObject);
        }
    },
    //#endregion AdminConsole.StyleManager

	//#region AdminConsole.Security
	Security:
	{
		Load: function ()
		{
		    AdminConsole.GenericFunctions.PopulateUserGridFromFunction({
		        GridID: 'admin-console-security-UserGrid',
		        SelectedUserFunction: AdminConsole.Security.SelectedUser
		    });

			AdminConsole.Security.LoadObjects();
		},

		LoadObjects: function ()
		{
			var iFudgeFactor = 424;
			var lHeight = $(window).height() - iFudgeFactor;

			var objects = TriSysApex.Cache.ApplicationSettingsManager.Security.Objects();
			if (!objects)
				return;

			var securityItems = objects.SecurityItems;
			if (!securityItems)
				return;

			// Property sheet is a control
			var propertySheetData = {
				title: "Security Permissions",
				propertyColumnName: 'Function',
				valueColumnName: 'Permission',
				//categoryColumnHide: true,
				//descriptionColumnHide: true,
				//filterHide: true,
				height: lHeight,
				objectList: securityItems,
				fieldValueChange: AdminConsole.Security.FieldValueChange
			};
			TriSysApex.PropertySheet.Draw('admin-console-security-PropertySheet', propertySheetData);
		},

		// Every field change fires back to us so that we can write the setting directly to the database
		FieldValueChange: function(sCategory, sName, objValue)
		{
			// Write field change to database for currently selected user
			//TriSysApex.Toasters.Warning(sCategory + "/" + sName + ' = ' + objValue);

			var lCurrentUserId = AdminConsole.Security._SelectedUserRecord.UserId;
			var securityItem = AdminConsole.Security.GetObjectFromCategoryAndName(sCategory, sName);

			if (securityItem && lCurrentUserId > 0)
			{
				// Write to server via API
			    TriSysApex.UserOptions.WriteSetting(lCurrentUserId, securityItem, objValue);

				// If current user, apply setting
				if (securityItem.DOMidList && securityItem.DOMidList.length > 0)
				{
					var userCredentials = TriSysApex.LoginCredentials.UserCredentials();
					if (userCredentials && userCredentials.LoggedInUser)
					{
						var user = userCredentials.LoggedInUser;
						if (lCurrentUserId == user.UserId)
						{
							switch (securityItem.Type)
							{
								case "Boolean":
									$.each(securityItem.DOMidList, function (index, item)
									{
										var bShow = objValue;
										var elem = $('#' + item);
										bShow ? elem.show() : elem.hide();
									});   
									break;
							}
						}
					}
				}
			}
		},

		GetObjectFromCategoryAndName: function (sCategory, sName)
		{
			var objects = TriSysApex.Cache.ApplicationSettingsManager.Security.Objects();
			if (objects)
			{
				var securityItems = objects.SecurityItems;
				if (securityItems)
				{
					for (var i = 0; i < securityItems.length; i++)
					{
						var securityItem = securityItems[i];
						if (securityItem.Category == sCategory && securityItem.Name == sName)
							return securityItem;
					}
				}
			}
		},

		CopyUserPermissions: function ()
		{
			if (AdminConsole.Security._SelectedUserRecord.UserId > 0)
			{
				var sSelectedUser = JSON.stringify(AdminConsole.Security._SelectedUserRecord);
				AdminConsole.Security._CopiedUserRecord = JSON.parse(sSelectedUser);
			}
		},

		PasteUserPermissions: function ()
		{
			if (!AdminConsole.Security._CopiedUserRecord)
			{
				TriSysApex.UI.ShowMessage("Copy an existing users' permissions before pasting into anothers.");
				return;
			}

			if (AdminConsole.Security._CopiedUserRecord.UserId == AdminConsole.Security._SelectedUserRecord.UserId)
			{
				TriSysApex.UI.ShowMessage("You have copied '" + AdminConsole.Security._CopiedUserRecord.Name +
						"' permissions, so cannot paste them back to itself.");
				return;
			}

			AdminConsole.Security.CloneUserSettings(AdminConsole.Security._CopiedUserRecord.UserId,
				AdminConsole.Security._SelectedUserRecord.UserId,
				AdminConsole.Security._SelectedUserRecord.Name);
		},

		ResetUserPermissions: function ()
		{
			if (AdminConsole.Security._SelectedUserRecord.UserId > 0)
			{
				AdminConsole.Security.DeleteUserPermissions(AdminConsole.Security._SelectedUserRecord.UserId, AdminConsole.Security._SelectedUserRecord.Name);
			}
		},

		SelectedUser: function (lUserId, sName)
		{
			AdminConsole.Security._SelectedUserRecord.UserId = lUserId;
			AdminConsole.Security._SelectedUserRecord.Name = sName;

			// Show all permissions for this user...
			//TriSysApex.Toasters.Error('fnRowClickHandler: ' + sName + "(" + lUserId + ")");

			var fnDisplayValues = function (serverSettings)
			{
				// Match server settings with those we manage in this applet
			    var objects = TriSysApex.Cache.ApplicationSettingsManager.Security.Objects();

			    AdminConsole.GenericFunctions.UpdatePropertySheetValues(objects.SecurityItems, serverSettings, 'admin-console-security-PropertySheet');
			}

			AdminConsole.Security.ReadSettings(lUserId, fnDisplayValues, false);
		},

		_SelectedUserRecord: { UserId: 0, Name: null },		// AdminConsole.Security._SelectedUserRecord
		_CopiedUserRecord: null,							// AdminConsole.Security._CopiedUserRecord

		// Read settings from Web API
		ReadSettings: function (lUserId, fnCallback, bShowWait)
		{
			var CReadUserSettingsRequest = { UserId: lUserId };

			var payloadObject = {};

			payloadObject.URL = "User/ReadSettings";

			payloadObject.OutboundDataPacket = CReadUserSettingsRequest;

			payloadObject.InboundDataFunction = function (CReadUserSettingsResponse)
			{
				if (bShowWait)
					TriSysApex.UI.HideWait();

				if (CReadUserSettingsResponse)
				{
					if (CReadUserSettingsResponse.Success)
					{
						fnCallback(CReadUserSettingsResponse.Settings);
					}
					else
						TriSysApex.UI.ShowError(CReadUserSettingsResponse.ErrorMessage);    // Probably not a system admin
				}
			};

			payloadObject.ErrorHandlerFunction = function (request, status, error)
			{
				if (bShowWait)
					TriSysApex.UI.HideWait();
				TriSysApex.UI.errorAlert('AdminConsole.Security.ReadSettings: ' + status + ": " + error + ". responseText: " + request.responseText);
			};

			if (bShowWait)
					TriSysApex.UI.ShowWait(null, "Reading User Permissions...");
			TriSysAPI.Data.PostToWebAPI(payloadObject);
		},

		// Save setting to Web API silently
		CloneUserSettings: function (lSourceUserId, lDestinationUserId, sDestinationUserName)
		{
			var CCloneUserSettingsRequest = {
				SourceUserId: lSourceUserId,
				DestinationUserId: lDestinationUserId
			};

			var payloadObject = {};

			payloadObject.URL = "User/CloneSettings";

			payloadObject.OutboundDataPacket = CCloneUserSettingsRequest;

			payloadObject.InboundDataFunction = function (CCloneUserSettingsResponse)
			{
				if (CCloneUserSettingsResponse)
				{
					if (CCloneUserSettingsResponse.Success)
					{
						// Populate the selected user settings now
						AdminConsole.Security.SelectedUser(lDestinationUserId, sDestinationUserName);
					}
					else
						TriSysApex.UI.ShowError(CCloneUserSettingsResponse.ErrorMessage);    // Probably not a system admin
				}
			};

			payloadObject.ErrorHandlerFunction = function (request, status, error)
			{
				TriSysApex.UI.errorAlert('AdminConsole.Security.CloneUserSettings: ' + status + ": " + error + ". responseText: " + request.responseText);
			};

			TriSysAPI.Data.PostToWebAPI(payloadObject);
		},

		DeleteUserPermissions: function (lUserId, sName)
		{
			var CDeleteUserSettingsRequest = {
				UserId: lUserId
			};

			var payloadObject = {};

			payloadObject.URL = "User/DeleteSettings";

			payloadObject.OutboundDataPacket = CDeleteUserSettingsRequest;

			payloadObject.InboundDataFunction = function (CDeleteUserSettingsResponse)
			{
				if (CDeleteUserSettingsResponse)
				{
					if (CDeleteUserSettingsResponse.Success)
					{
						// Populate the selected user settings now
						AdminConsole.Security.SelectedUser(lUserId, sName);
					}
					else
						TriSysApex.UI.ShowError(CDeleteUserSettingsResponse.ErrorMessage);    // Probably not a system admin
				}
			};

			payloadObject.ErrorHandlerFunction = function (request, status, error)
			{
				TriSysApex.UI.errorAlert('AdminConsole.Security.DeleteUserPermissions: ' + status + ": " + error + ". responseText: " + request.responseText);
			};

			TriSysAPI.Data.PostToWebAPI(payloadObject);
		}
	},
    //#endregion AdminConsole.Security

    //#region AdminConsole.UserSettings
	UserSettings:
	{
	    Load: function ()
	    {
	        var fnLoadPropertySheetAndUsers = function ()
	        {
	            AdminConsole.GenericFunctions.PopulateUserGridFromFunction({
	                GridID: 'admin-console-user-settings-UserGrid',
	                SelectedUserFunction: AdminConsole.UserSettings.SelectedUser
	            });
	            AdminConsole.UserSettings.LoadObjects();
	        };

	        AdminConsole.UserSettings.ReadAllUsrCfgUserSettingsFromWebAPI(fnLoadPropertySheetAndUsers);
	    },

	    ReadAllUsrCfgUserSettingsFromWebAPI: function(fnCallback)
	    {
	        var payloadObject = {};

	        payloadObject.URL = "Users/UsrCfgSettings";

	        payloadObject.InboundDataFunction = function (CUserSettingsResponse)
	        {
	            TriSysApex.UI.HideWait();

	            if (CUserSettingsResponse)
	            {
	                if (CUserSettingsResponse.Success)
	                {
	                    AdminConsole.UserSettings.UsrCfgUsersSettings = CUserSettingsResponse.Settings;
	                    fnCallback();
	                }
	                else
	                    TriSysApex.UI.ShowError(CUserSettingsResponse.ErrorMessage);    // Catastrophic error
	            }
	        };

	        payloadObject.ErrorHandlerFunction = function (request, status, error) {
	            TriSysApex.UI.HideWait();
	            TriSysApex.UI.errorAlert('AdminConsole.UserSettings.ReadAllUsrCfgUserSettingsFromWebAPI: ' + status + ": " + error + ". responseText: " + request.responseText);
	        };

	        TriSysApex.UI.ShowWait(null, "Reading User Settings...");
	        TriSysAPI.Data.PostToWebAPI(payloadObject);
	    },

	    // The collection of settings from the Web API
	    UsrCfgUsersSettings: null,
        PropertySheetData: null,

	    LoadObjects: function ()
	    {
	        var iFudgeFactor = 424;
	        var lHeight = $(window).height() - iFudgeFactor;

            // Read raw list of UsrCfgUsers fields including name and type
	        var objects = AdminConsole.UserSettings.UsrCfgUsersSettings;
	        if (!objects)
	            return;

	        // Convert into property sheet friendly data structures
	        var propertySheetData = [];
	        objects.forEach(function (item)
	        {
	            var objDefault = '';
	            var sType = "TextBox";
	            switch (item.FType)
	            {
	                case "B":
	                    sType = "Boolean";
	                    objDefault = false;
	                    break;

	                case "I":
	                    sType = "Integer";
	                    objDefault = 0;
	                    break;
	            }
                
	            var propertySheetItem = {
	                Category: "Setting",
	                Description: [item.FName],
	                Name: item.FName,
	                Title: item.FName,
	                Type: sType,
	                Default: objDefault
	            };
	            propertySheetData.push(propertySheetItem);
	        });

	        AdminConsole.UserSettings.PropertySheetData = propertySheetData;

	        // Property sheet is a control
	        var propertySheetData = {
	            title: "User Settings",
	            propertyColumnName: 'Setting',
	            valueColumnName: 'Value',
	            categoryColumnHide: true,
	            descriptionColumnHide: true,
	            //filterHide: true,
	            height: lHeight,
	            objectList: propertySheetData,
	            fieldValueChange: AdminConsole.UserSettings.FieldValueChange
	        };
	        TriSysApex.PropertySheet.Draw('admin-console-user-settings-PropertySheet', propertySheetData);
	    },

	    // Every setting change fires back to us so that we can write the user setting change back to Web API
	    FieldValueChange: function (sCategory, sName, objValue)
	    {
	        var lUserId = AdminConsole.UserSettings._SelectedUserRecord.UserId;
	        var item = AdminConsole.UserSettings.GetObjectFromCategoryAndName(sCategory, sName);

	        if (lUserId <= 0 || !item)
	            return;

	        var sType = "S";
	        switch (item.Type) {
	            case "Boolean":
	                sType = "B";
	                break;

	            case "Integer":
	                sType = "I";
	                break;
	        }

	        // Construct a strongly types API object
	        var CUsrCfgSettingValue = {
	            Category: item.Category,
	            Name: item.Name,
	            Value: objValue,
                Type: sType
	        };

	        // Update UsrCfgUsers
	        var CWriteUsrCfgSetting = {
	            UserId: lUserId,
	            Setting: CUsrCfgSettingValue
	        };

	        var payloadObject = {};

	        payloadObject.URL = 'User/WriteUsrCfgSetting';

	        payloadObject.OutboundDataPacket = CWriteUsrCfgSetting;

	        payloadObject.InboundDataFunction = function (data) {
	            return true;
	        };

	        payloadObject.ErrorHandlerFunction = function (request, status, error) {
	            TriSysApex.UI.ErrorHandlerRedirector('AdminConsole.UserSettings.FieldValueChange: ', request, status, error);
	        };

	        TriSysAPI.Data.PostToWebAPI(payloadObject);
	    },

	    GetObjectFromCategoryAndName: function(sCategory, sName)
	    {
	        if(AdminConsole.UserSettings.PropertySheetData)
	        {
	            var foundItem = null;
	            AdminConsole.UserSettings.PropertySheetData.forEach(function (item)
	            {
	                if (item.Category == sCategory && item.Name == sName)
	                    foundItem = item;
	            });

	            return foundItem;
            }
        },

	    SelectedUser: function (lUserId, sName)
	    {
	        AdminConsole.UserSettings._SelectedUserRecord.UserId = lUserId;
	        AdminConsole.UserSettings._SelectedUserRecord.Name = sName;

	        var fnDisplayValues = function (serverSettings)
	        {
	            // Match server settings with those we manage in this applet
	            var objects = AdminConsole.UserSettings.PropertySheetData;

	            AdminConsole.GenericFunctions.UpdatePropertySheetValues(objects, serverSettings, 'admin-console-user-settings-PropertySheet');
	        }

	        AdminConsole.UserSettings.ReadSettings(lUserId, fnDisplayValues, false);
	    },

	    _SelectedUserRecord: { UserId: 0, Name: null },		// AdminConsole.UserSettings._SelectedUserRecord
	    _CopiedUserRecord: null,							// AdminConsole.UserSettings._CopiedUserRecord

	    // Read settings from Web API
	    ReadSettings: function (lUserId, fnCallback, bShowWait)
	    {
	        var CReadUsrCfgSettingsRequest = { UserId: lUserId };

	        var payloadObject = {};

	        payloadObject.URL = "User/ReadUsrCfgSettings";

	        payloadObject.OutboundDataPacket = CReadUsrCfgSettingsRequest;

	        payloadObject.InboundDataFunction = function (CReadUsrCfgSettingsResponse)
	        {
	            if (bShowWait)
	                TriSysApex.UI.HideWait();

	            if (CReadUsrCfgSettingsResponse)
	            {
	                if (CReadUsrCfgSettingsResponse.Success)
	                {
	                    fnCallback(CReadUsrCfgSettingsResponse.Settings);
	                }
	                else
	                    TriSysApex.UI.ShowError(CReadUsrCfgSettingsResponse.ErrorMessage);    // Probably not a system admin
	            }
	        };

	        payloadObject.ErrorHandlerFunction = function (request, status, error) {
	            if (bShowWait)
	                TriSysApex.UI.HideWait();
	            TriSysApex.UI.errorAlert('AdminConsole.UserSettings.ReadSettings: ' + status + ": " + error + ". responseText: " + request.responseText);
	        };

	        if (bShowWait)
	            TriSysApex.UI.ShowWait(null, "Reading User Settings...");
	        TriSysAPI.Data.PostToWebAPI(payloadObject);
	    },

        // Prompt the administrator for a new user setting
	    NewSetting: function()
	    {
	        var fnNewSetting = function (sNewName, sType)
	        {
	            AdminConsole.UserSettings.CreateNewSettingViaWebAPI(sNewName, sType);
	            return true;
	        };
	        var sMessage = "New User Setting";
	        var options = {
	            TextLabel: "Name",
	            ComboLabel: "Type",
	            ComboList: ["B", "I", "S"],
                ComboSelectedItem: "S"
	        };
	        TriSysApex.ModalDialogue.NewWithCombo.Popup(sMessage, "gi-settings", fnNewSetting, options);
	    },

	    CreateNewSettingViaWebAPI: function(sName, sType)
	    {
	        var CNewUsrCfgSettingRequest = { Name: sName, Type: sType };

	        var payloadObject = {};

	        payloadObject.URL = "User/NewUsrCfgSetting";

	        payloadObject.OutboundDataPacket = CNewUsrCfgSettingRequest;

	        payloadObject.InboundDataFunction = function (CNewUsrCfgSettingResponse)
	        {
	            TriSysApex.UI.HideWait();

	            if (CNewUsrCfgSettingResponse)
	            {
	                if (CNewUsrCfgSettingResponse.Success)
	                {
	                    // So refresh the list of all objects which will now have the new setting
	                    var elem = $('#admin-console-user-settings-PropertySheet-ctrlPropertySheet-Root');
	                    elem.empty();
	                    elem.replaceWith('<div id="admin-console-user-settings-PropertySheet"></div>');
	                    var fnAfterRedrawingPropertySheet = function () {
	                        AdminConsole.UserSettings.LoadObjects();
	                        AdminConsole.UserSettings.SelectedUser(AdminConsole.UserSettings._SelectedUserRecord.UserId, AdminConsole.UserSettings._SelectedUserRecord.Name);
	                    };
	                    AdminConsole.UserSettings.ReadAllUsrCfgUserSettingsFromWebAPI(fnAfterRedrawingPropertySheet);
	                }
	                else
	                    TriSysApex.UI.ShowError(CNewUsrCfgSettingResponse.ErrorMessage);    // Probably a duplicate
	            }
	        };

	        payloadObject.ErrorHandlerFunction = function (request, status, error)
	        {
	            TriSysApex.UI.HideWait();
	            TriSysApex.UI.errorAlert('AdminConsole.UserSettings.CreateNewSettingViaWebAPI: ' + status + ": " + error + ". responseText: " + request.responseText);
	        };

	        TriSysApex.UI.ShowWait(null, "Creating Setting...");
	        TriSysAPI.Data.PostToWebAPI(payloadObject);
	    },

	    AssignUserSettings: function()
	    {
            // TODO
	    }
	},
    //#endregion AdminConsole.UserSettings

    //#region AdminConsole.AuditTrail
	AuditTrail:
    {
        Load: function ()
        {
            var fnPopulationByFunction =
            {
                API: "Users/AuditTrailList",				// The Web API Controller/Function

                // The additional parameters passed into the function not including the paging metrics
                Parameters: function (request) {
                    //request.DiaryManagerUsers = true;		// We can see only non-locked users
                },

                DataTableFunction: function (response)		// Called to get a suitable data table for the grid to display
                {
                    return response.List;					// The list of records from the Web API
                }
            };

            var sGridName = AdminConsole.AuditTrailGridID - '-GridInstance';

            TriSysSDK.Grid.VirtualMode({
                Div: AdminConsole.AuditTrailGridID,
                ID: sGridName,
                Title: "Audit Trail",
                RecordsPerPage: TriSysApex.UserOptions.RecordsPerPage(),
                PopulationByFunction: fnPopulationByFunction,
                Columns: AdminConsole.AuditTrail.Columns,

                KeyColumnName: "UserId",
                DrillDownFunction: function (rowData) {
                    //TriSysApex.UI.CloseModalPopup();
                    TriSysApex.FormsManager.OpenForm("Contact", rowData.ContactId);
                },
                MultiRowSelect: false,
                Grouping: true,
                ColumnFilters: true,
                Sortable: true,
                OpenButtonCaption: "Open"
            });
        },

        Columns: [
            { field: "UserId", title: "UserId", type: "number", width: 70, hidden: true },
            { field: "ContactId", title: "UserContactId", type: "number", width: 70, hidden: true },
			{ field: "Name", title: "User", type: "string", width: 200 },
			{ field: "StartDate", title: "Date", type: "date", format: "{0:dd MMM yyyy }", width: 120, hidden: false },
			{ field: "StartDate", title: "Time", type: "date", format: "{0:HH:mm:ss }", width: 75, hidden: false },
			{ field: "Activity", title: "Activity", type: "string", hidden: false }
        ]
    },
    //#endregion AdminConsole.AuditTrail

    //#region AdminConsole.GenericFunctions
	GenericFunctions:
    {
        PopulateUserGridFromFunction: function (options)
        {
            var fnPopulationByFunction = {
                API: "Users/List",							// The Web API Controller/Function

                // The additional parameters passed into the function not including the paging metrics
                Parameters: function (request) {
                    request.DiaryManagerUsers = true;		// We can see only non-locked users
                },

                DataTableFunction: function (response)		// Called to get a suitable data table for the grid to display
                {
                    return response.List;					// The list of records from the Web API
                }
            };

            var sGridID = options.GridID;
            var sGridName = sGridID + '-GridInstance';

            var fnRowClickHandler = function (e, gridObject, gridLayout)
            {
                var selectedItem = TriSysSDK.Grid.GetFirstGridCheckedItem(gridObject);

                if (selectedItem)
                {
                    var lUserId = selectedItem.UserId;
                    var sName = selectedItem.Name;

                    // Callback the function
                    options.SelectedUserFunction(lUserId, sName);
                }
            };

            var bPopulated = false;
            var fnPostPopulationCallback = function (lRecordCount) {
                if (!bPopulated) {
                    TriSysSDK.Grid.SelectFirstRow(sGridID);
                }

                //bPopulated = true;
            };

            var iFudgeFactor = 170, iHeightPerUser = 30;
            var lHeight = $(window).height() - iFudgeFactor;
            var iNumUsersPerPage = lHeight / iHeightPerUser;

            TriSysSDK.Grid.VirtualMode({
                Div: sGridID,
                ID: sGridName,
                Title: "Users",
                RecordsPerPage: iNumUsersPerPage,	//TriSysApex.UserOptions.RecordsPerPage(),
                PopulationByFunction: fnPopulationByFunction,
                Columns: [
					{ field: "UserId", title: "Id", type: "number", width: 70, hidden: true },
					{ field: "Name", title: "Name", type: "string" },
					{ field: "EMail", title: "E-Mail", type: "string", hidden: true },
					{ field: "TelNo", title: "Tel. No.", type: "string", hidden: true },
					{ field: "LoggedIn", title: "Logged In", type: "string", hidden: true },
					{ field: "Locked", title: "Locked", type: "string", hidden: true }],

                KeyColumnName: "UserId",
                MultiRowSelect: false,
                SingleRowSelect: true,
                RowClickHandler: fnRowClickHandler,
                PostPopulationCallback: fnPostPopulationCallback,
                ColumnFilters: true,
                Grouping: false,
                PageSelector: false,        // Limited space
                PageSizeSelector: false
            });
        },

        // AdminConsole.GenericFunctions.UpdatePropertySheetValues
        UpdatePropertySheetValues: function (items, serverSettings, sPropertySheetID)
        {
            // Match server settings with those we manage in this applet
            if (items && serverSettings)
            {                
                for (var i = 0; i < items.length; i++)
                {
                    var item = items[i];
                    var applyItem = JSON.parse(JSON.stringify(item));

                    // Look for a match and if we find one, use the server setting, else default
                    for (var j = 0; j < serverSettings.length; j++)
                    {
                        var serverSetting = serverSettings[j];
                        if (serverSetting.Category == applyItem.Category && serverSetting.Name == applyItem.Name) {
                            applyItem.Default = serverSetting.Value;
                            break;
                        }
                    }

                    // Update field with value now
                    ctrlPropertySheet.SetValue(sPropertySheetID, applyItem);
                }                
            }
        }
    }
    //#endregion AdminConsole.GenericFunctions

};

$(document).ready(function ()
{
    AdminConsole.Load();
});
