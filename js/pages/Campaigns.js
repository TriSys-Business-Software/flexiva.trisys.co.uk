var Campaigns =
{
	Tabs: ['campaigns', 'campaignrecord', 'search', 'recipients', 'sent', 'delivered', 'openread', 'clicks', 'undelivered'],

    Load: function()
	{
		// Add a callback to this multi-select combo for when the user is changed
		var fnChangeUsers = function ()
		{
			Campaigns.LoadCampaigns();
		};

		// Users
		var userCredentials = TriSysApex.LoginCredentials.UserCredentials();
		var sUserName = userCredentials.LoggedInUser.ForenameAndSurname;
		var sUserComboId = 'campaigns-Users';
		TriSysSDK.CShowForm.MultiUserCombo(sUserComboId, fnChangeUsers);
		TriSysSDK.CShowForm.SetSkillsInList(sUserComboId, sUserName);

		// Tabs
		TriSysSDK.EntityFormTabs.AddClickEventHandlers('campaigns-tab-nav-horizontal');
		TriSysSDK.EntityFormTabs.TabClickEvent('campaigns-panel-', 'campaigns', null, Campaigns.TabClickEvent);
		TriSysSDK.EntityFormTabs.AddHorizontalScrollBar('campaigns-tab-buttons');

		// Add event handlers for the tab buttons
		Campaigns.Tabs.forEach(function (sTab)
		{
			$('#campaigns-tab-' + sTab).off().on('click', function ()
			{
				TriSysSDK.EntityFormTabs.TabClickEvent('campaigns-panel-', sTab, null, Campaigns.TabClickEvent);
			});
		});

		

		// Add event handlers for campaign grid buttons
		$('#campaigns-add-campaign-button').off().on('click', function ()
		{
			Campaigns.Add();
		});
		$('#campaigns-clone-campaign-button').off().on('click', function ()
		{
			Campaigns.Clone();
		});
		$('#campaigns-edit-campaign-button').off().on('click', function ()
		{
			Campaigns.Edit();
		});
		$('#campaigns-delete-campaign-button').off().on('click', function ()
		{
			Campaigns.Delete();
		});

		var sGrid = 'campaigns-campaigns-grid';
		TriSysSDK.FormMenus.DrawGridMenu('campaigns-GridMenu', sGrid);			

		// Campaign tab

		$('#campaign-save-button').off().on('click', function ()
		{
			Campaigns.Save();
		});

		//"campaign-sender"
		Campaigns.PopulateSenderCombo();

		// campaign-recipient-email-field
		Campaigns.PopulateRecipientEMailFieldCombo();

		var sCampaign = "Campaign";
		var sCampaigneFolder = sCampaign + "/";

		TriSysActions.MailMerge.PopulateTemplates(sCampaign, TriSysActions.MailMerge.MasterTemplateFolder + sCampaigneFolder,
			'campaign-Template', sCampaign, 'campaign-EditTemplate');

		TriSysActions.MailMerge.PopulateAttachments('campaign-Attachments', 'campaign-ManageAttachmentLibrary');
		TriSysActions.Forms.Attributes.Load('campaign-Attributes');

		var defaults = { TaskType: "E-Mail" };
		TriSysActions.NoteHistory.Load('campaign-NoteHistory', defaults);

		// Follow-up defaults
		var dtFollowUp = TriSysActions.FollowUp.FollowUpDateTomorrow();

		defaults = { CreateFollowUp: true, StartDateTime: dtFollowUp };
		TriSysActions.FollowUp.Load('campaign-FollowUp', defaults);


		// Contact Search Grid
		TriSysSDK.FormMenus.DrawGridMenu('campaigns-search-GridMenu', 'campaigns-search-grid');			
		TriSysActions.Menus.Draw('campaigns-search-ActionsMenu', 'Contact', 'Campaigns.ActionSearchInvocation');

		$('#campaigns-open-search-result-button').off().on('click', function ()
		{
			Campaigns.OpenSearchContact();
		});
		$('#campaigns-add-search-recipient-selected').off().on('click', function ()
		{
			Campaigns.CopyFromSearchResultsToRecipients(false);
		});
		$('#campaigns-add-search-recipient-all').off().on('click', function ()
		{
			Campaigns.CopyFromSearchResultsToRecipients(true);
		});


		// Recipients Grid
		TriSysSDK.FormMenus.DrawGridMenu('campaigns-recipients-GridMenu', 'campaigns-recipients-grid');
		TriSysActions.Menus.Draw('campaigns-recipients-ActionsMenu', 'Contact', 'Campaigns.ActionRecipientInvocation');

		$('#campaigns-open-recipients-button').off().on('click', function ()
		{
			Campaigns.OpenRecipient();
		});
		$('#campaigns-add-recipients-button').off().on('click', function ()
		{
			Campaigns.AddRecipient();
		});
		$('#campaigns-remove-recipients-menu-selected').off().on('click', function ()
		{
			Campaigns.RemoveRecipient(false);
		});
		$('#campaigns-remove-recipients-menu-all').off().on('click', function ()
		{
			Campaigns.RemoveRecipient(true);
		});
		$('#campaigns-sendto-recipients-menu-selected').off().on('click', function ()
		{
			Campaigns.SendToRecipient(false);
		});
		$('#campaigns-sendto-recipients-menu-all').off().on('click', function ()
		{
			Campaigns.SendToRecipient(true);
		});


		// Sent Grid
		TriSysSDK.FormMenus.DrawGridMenu('campaigns-sent-GridMenu', 'campaigns-sent-grid');
		TriSysActions.Menus.Draw('campaigns-sent-ActionsMenu', 'Contact', 'Campaigns.ActionSentInvocation');

		$('#campaigns-open-sent-button').off().on('click', function ()
		{
			Campaigns.OpenSent();
		});


		// Delivered Grid
		TriSysSDK.FormMenus.DrawGridMenu('campaigns-delivered-GridMenu', 'campaigns-delivered-grid');
		TriSysActions.Menus.Draw('campaigns-delivered-ActionsMenu', 'Contact', 'Campaigns.ActionDeliveredInvocation');

		$('#campaigns-open-delivered-button').off().on('click', function ()
		{
			Campaigns.OpenDelivered();
		});


		// Opened Grid
		TriSysSDK.FormMenus.DrawGridMenu('campaigns-openread-GridMenu', 'campaigns-openread-grid');
		TriSysActions.Menus.Draw('campaigns-openread-ActionsMenu', 'Contact', 'Campaigns.ActionOpenedInvocation');

		$('#campaigns-open-openread-button').off().on('click', function ()
		{
			Campaigns.OpenRead();
		});


		// Clicked Grid
		TriSysSDK.FormMenus.DrawGridMenu('campaigns-clicks-GridMenu', 'campaigns-clicks-grid');
		TriSysActions.Menus.Draw('campaigns-clicks-ActionsMenu', 'Contact', 'Campaigns.ActionClickedInvocation');

		$('#campaigns-open-clicks-button').off().on('click', function ()
		{
			Campaigns.OpenClicked();
		});


		// Undelivered Grid
		TriSysSDK.FormMenus.DrawGridMenu('campaigns-undelivered-GridMenu', 'campaigns-undelivered-grid');
		TriSysActions.Menus.Draw('campaigns-undelivered-ActionsMenu', 'Contact', 'Campaigns.ActionUndeliveredInvocation');

		$('#campaigns-open-undelivered-button').off().on('click', function ()
		{
			Campaigns.OpenUndelivered();
		});
	},

	TabClickEvent: function (sTabID)
	{
		var sTabPrefix = 'campaigns-panel-';
		var sTab = sTabID.replace(sTabPrefix, '');

		switch (sTab)
		{
			case 'campaigns':

				// Make 2nd+ tab buttons disabled as they can only be invoked after selecting a single campaign
				Campaigns.Tabs.forEach(function (sTab)
				{
					if(sTab != 'campaigns')
						Campaigns.ReadOnlyTabButton(sTab, true);
				});
				$('#campaigns-tab-campaignrecord-name').html('');
				$('#campaigns-campaign-name').html('');

				Campaigns.LoadCampaigns();
				break;

			case 'search':
				if (TriSysApex.Forms.EntityForm.isGridPopulated("Campaigns", sTab))
					return;

				Campaigns.LoadContactSearch();				
				break;

			case 'recipients':
				if (TriSysApex.Forms.EntityForm.isGridPopulated("Campaigns", sTab))
					return;

				Campaigns.LoadRecipients();
				break;

			case 'sent':
				if (TriSysApex.Forms.EntityForm.isGridPopulated("Campaigns", sTab))
					return;

				Campaigns.LoadSent();
				break;

			case 'delivered':
				if (TriSysApex.Forms.EntityForm.isGridPopulated("Campaigns", sTab))
					return;

				Campaigns.LoadDelivered();
				break;

			case 'openread':
				if (TriSysApex.Forms.EntityForm.isGridPopulated("Campaigns", sTab))
					return;

				Campaigns.LoadOpened();
				break;

			case 'clicks':
				if (TriSysApex.Forms.EntityForm.isGridPopulated("Campaigns", sTab))
					return;

				Campaigns.LoadClicked();
				break;

			case 'undelivered':
				if (TriSysApex.Forms.EntityForm.isGridPopulated("Campaigns", sTab))
					return;

				Campaigns.LoadUndelivered();
				break;
		}
	},

	ReadOnlyTabButton: function (sId, bReadOnly)
	{
		var sTabPrefix = 'campaigns-form-tab-';
		TriSysSDK.Controls.Button.ReadOnly(sTabPrefix + sId, bReadOnly);

		if (bReadOnly)
		{
			// Set stats/figures to blank also
			Campaigns.SetTabStatCount(sId, 0, true);
			Campaigns.SetTabStatPercentage(sId, 0, true);
		}
	},

	SetTabStatCount: function (sId, fValue, bHideZero)
	{
		var sValue = TriSysSDK.Numbers.ThousandsSeparator(fValue);
		if (bHideZero && fValue == 0)
			sValue = '';

		$('#' + 'campaigns-tab-' + sId + '-count').html(sValue);
	},

	SetTabStatPercentage: function (sId, fValue, bHideZero)
	{
		var sValue = TriSysSDK.Numbers.Format(fValue, 2) + '%';
		if (bHideZero && fValue == 0)
			sValue = '';

		$('#' + 'campaigns-tab-' + sId + '-percentage').html(sValue);
	},

	LoadCampaigns: function ()
	{
		var sGrid = 'campaigns-campaigns-grid';

		// Get user list
		var userList = TriSysSDK.CShowForm.GetSelectedSkillsFromList('campaigns-Users', "'");
		if (!userList)
		{
			TriSysSDK.Grid.Clear(sGrid);
			TriSysApex.UI.ShowMessage("Please choose one or more users.");
			return;
		}

		var sUsers = userList;

		var fnPopulationByFunction = {
			API: "Marketing/ListCampaigns",         // The Web API Controller/Function

			// The additional parameters passed into the function not including the paging metrics
			Parameters: function (request)
			{
				request.UserNames = sUsers;
			},

			DataTableFunction: function (response)  // Called to get a suitable data table for the grid to display
			{
				Campaigns.SetTabStatCount('campaigns', response.TotalRecordCount);
				return response.List;               // The list of records from the Web API
			}
		};

		Campaigns.LoadCampaignGrid(sGrid, fnPopulationByFunction); 
	},

	LoadCampaignGrid: function (sGrid, fnPopulationByFunction)
	{
		TriSysSDK.Grid.VirtualMode({
			Div: sGrid,
			ID: sGrid,
			Title: "Campaigns",
			RecordsPerPage: TriSysApex.UserOptions.RecordsPerPage(),
			PopulationByFunction: fnPopulationByFunction,
			Columns: [
				{ field: "MarketingCampaignId", title: "Id", type: "number", width: 70, hidden: true },
				{ field: "Name", title: "Campaign Name", type: "string" },
				{ field: "Description", title: "Description", type: "string" },
				{ field: "Created", title: "Created", type: "date", format: "{0:dd MMM yyyy }" },
				{ field: "Updated", title: "Last Updated", type: "date", format: "{0:dd MMM yyyy }" },
				{ field: "UserName", title: "User", type: "string" }
			],

			KeyColumnName: "MarketingCampaignId",
			DrillDownFunction: function (rowData)
			{
				var lMarketingCampaignId = rowData.MarketingCampaignId;
				var sName = rowData.Name;
				Campaigns.LoadCampaignRecord(lMarketingCampaignId, sName);
			},
			MultiRowSelect: true,
			Grouping: false,
			ColumnFilters: true,
			OpenButtonCaption: "Open",
			HyperlinkedColumns: ["Name"]            // New Jan 2021
		});
	},

	Add: function ()
	{
		Campaigns.LoadCampaignRecord(0, null);
	},

	Clone: function ()
	{
		var lMarketingCampaignId = Campaigns.GetSelectedSingletonMarketingCampaignIdFromGrid();
		if (lMarketingCampaignId <= 0)
			return;

		// Request new name, and call Web API to clone
		var fnClonedCampaign = function (sNewName)
		{
			Campaigns.CloneMarketingCampaign(lMarketingCampaignId, sNewName);
			return true;
		};
		var sMessage = "Cloned Marketing Campaign";
		var options = { Label: "Name" };
		TriSysApex.ModalDialogue.New.Popup(sMessage, "fa-envelope-o", fnClonedCampaign, options);
	},

	Edit: function ()
	{
		var lMarketingCampaignId = Campaigns.GetSelectedSingletonMarketingCampaignIdFromGrid();
		if (lMarketingCampaignId <= 0)
			return;

		Campaigns.LoadCampaignRecord(lMarketingCampaignId, Campaigns.GetSelectedNameFromGrid());
	},

	Delete: function ()
	{
		var lMarketingCampaignId = Campaigns.GetSelectedSingletonMarketingCampaignIdFromGrid();
		if (lMarketingCampaignId <= 0)
			return;

		var sName = Campaigns.GetSelectedNameFromGrid();
		var sMessage = "Are you sure that you wish to delete the marketing campaign: " + sName + "?";
		TriSysApex.UI.questionYesNo(sMessage, "Delete Marketing Campaign", "Yes",
			function ()
			{
				Campaigns.DeleteMarketingCampaign(lMarketingCampaignId);
				return true;
			},
			"No");
	},

	GetSelectedSingletonMarketingCampaignIdFromGrid: function ()
	{
		var sGrid = 'campaigns-campaigns-grid';
		var lMarketingCampaignId = TriSysSDK.Grid.GetSelectedSingletonRowRecordIdFromGrid(sGrid, "MarketingCampaignId", "marketing campaign");
		return lMarketingCampaignId;
	},

	GetSelectedNameFromGrid: function ()
	{
		var sGrid = 'campaigns-campaigns-grid';
		var sName = TriSysSDK.Grid.GetSelectedSingletonRowFieldValueFromGrid(sGrid, "Name");
		return sName;
	},

	LoadCampaignRecord: function (lMarketingCampaignId, sName)
	{
		if (lMarketingCampaignId > 0)
		{
			// Show all other tab buttons
			Campaigns.Tabs.forEach(function (sTab)
			{
				Campaigns.ReadOnlyTabButton(sTab, false);
			});
		}
		else
			Campaigns.ReadOnlyTabButton('campaignrecord', false);

		//TriSysSDK.EntityFormTabs.TabClickEvent('campaigns-panel-', 'search', null, Campaigns.TabClickEvent);
		//TriSysSDK.Controls.Button.Click('campaigns-tab-search');
		TriSysSDK.Controls.Button.Click('campaigns-form-tab-campaignrecord');		// the <li, not the <a

		// Remember the ID of the displayed campaign
		Campaigns.Data.MarketingCampaignId = lMarketingCampaignId;

		// Populate form
		if (lMarketingCampaignId <= 0)
		{
			var campaignDetails = {
				Name: null,
				Description: null,
				UserName: TriSysApex.LoginCredentials.UserCredentials().LoggedInUser.ForenameAndSurname,
				Created: new Date,
				Updated: null,
				Settings: {
					Template: null,
					Attachments: null,
					Subject: null,
					NoteHistory: { CreateNoteHistory: false },
					FollowUp: { CreateFollowUp: false }
				}
			};
			Campaigns.DisplayMarketingCampaign(campaignDetails);
		}
		else
		{
			Campaigns.DisplayMarketingCampaign({ Name: sName });

			// Get full campaign details
			Campaigns.ReadCampaignFromWebAPI(lMarketingCampaignId);
		}

		// Cause grids to refresh when next viewed
		Campaigns.Tabs.forEach(function (sTab)
		{
			if (sTab != 'campaigns' && sTab != 'campaignrecord')
				TriSysApex.Forms.EntityForm.unPopulateFormGrids("Campaigns", sTab);
		});
	},

	ReadCampaignFromWebAPI: function (lMarketingCampaignId)
	{
		var payloadObject = {};
		payloadObject.URL = "Marketing/ReadCampaign";
		payloadObject.OutboundDataPacket = { MarketingCampaignId: lMarketingCampaignId };
		payloadObject.InboundDataFunction = function (CReadCampaignResponse)
		{
			if (CReadCampaignResponse)
			{
				if (CReadCampaignResponse.Success)
				{
					var campaignDetails = CReadCampaignResponse;
					try
					{
						campaignDetails.Settings = JSON.parse(CReadCampaignResponse.Settings);
					}
					catch (ex)
					{
						// Ignore parsing problems
					}
					
					Campaigns.DisplayMarketingCampaign(campaignDetails);
				}
				else
					TriSysApex.UI.ShowMessage(CReadCampaignResponse.ErrorMessage);
			}			
		};
		payloadObject.ErrorHandlerFunction = function (request, status, error)
		{
			TriSysApex.UI.ErrorHandlerRedirector('Campaigns.ReadCampaignFromWebAPI: ', request, status, error);
		};
		TriSysAPI.Data.PostToWebAPI(payloadObject);
	},

	DisplayMarketingCampaign: function (campaignDetails)
	{
		$('#campaign-name-block-title').html(campaignDetails.Name ? campaignDetails.Name : 'New Campaign');
		$('#campaign-name').val(campaignDetails.Name);
		$('#campaigns-tab-campaignrecord-name').html(TriSysSDK.Miscellaneous.EllipsisText(campaignDetails.Name, 20)); 
		$('#campaigns-campaign-name').html(': ' + campaignDetails.Name);
		$('#campaign-description').val(campaignDetails.Description);
		$('#campaign-user').html(campaignDetails.UserName);
		TriSysSDK.CShowForm.SetTextInCombo("campaign-sender", campaignDetails.Sender);
		$('#campaign-datecreated').html(moment(campaignDetails.Created).format("dddd DD MMMM YYYY"));

		var sUpdated = '';
		if (campaignDetails.Updated)
		{
			var dt = new Date(campaignDetails.Updated);
			sUpdated = dt.getFullYear() <= 1 ? '' : moment(campaignDetails.Updated).format("dddd DD MMMM YYYY");
		}			
		$('#campaign-dateupdated').html(sUpdated);

		if (campaignDetails.Settings)
		{
			var mySettings = campaignDetails.Settings;
			if (mySettings)
			{
				TriSysSDK.CShowForm.SetTextInCombo("campaign-recipient-email-field", mySettings.RecipientEMailField);

				TriSysSDK.CShowForm.SetTextInCombo('campaign-Template', mySettings.Template);

				TriSysSDK.CShowForm.SetSkillsInList('campaign-Attachments', mySettings.Attachments);

				$('#campaign-Subject').val(mySettings.Subject);

				TriSysSDK.CShowForm.SetSkillsInList('campaign-Attributes', mySettings.Attributes);

				TriSysActions.PersistedSettingsSafeguard.WaitUntilTaskControlsAreLoaded(true, true,
                    function () {
                        ctrlNoteHistory.Reload(mySettings.NoteHistory);
                        ctrlFollowUp.Reload(mySettings.FollowUp);
                    });
			}

		}

		// Stats
		if (campaignDetails.MarketingCampaignId > 0)
		{
			Campaigns.SetTabStatCount('search', campaignDetails.LastSearchCount);

			Campaigns.SetTabStatCount('recipients', campaignDetails.Recipients);

			Campaigns.SetTabStatCount('sent', campaignDetails.SentCount);
			if (campaignDetails.Recipients > 0)
				Campaigns.SetTabStatPercentage('sent', (campaignDetails.SentCount / campaignDetails.Recipients) * 100);

			Campaigns.SetTabStatCount('delivered', campaignDetails.Delivered);
			if (campaignDetails.SentCount > 0)
				Campaigns.SetTabStatPercentage('delivered', (campaignDetails.Delivered / campaignDetails.SentCount) * 100);

			Campaigns.SetTabStatCount('openread', campaignDetails.Opened);
			if (campaignDetails.SentCount > 0)
				Campaigns.SetTabStatPercentage('openread', (campaignDetails.Opened / campaignDetails.SentCount) * 100);

			Campaigns.SetTabStatCount('clicks', campaignDetails.Clicked);
			if (campaignDetails.Opened > 0)
				Campaigns.SetTabStatPercentage('clicks', (campaignDetails.Clicked / campaignDetails.Opened) * 100);

			Campaigns.SetTabStatCount('undelivered', campaignDetails.Undelivered);
			if (campaignDetails.SentCount > 0)
				Campaigns.SetTabStatPercentage('undelivered', (campaignDetails.Undelivered / campaignDetails.SentCount) * 100);
		}
	},

	// User has selected the campaign, so open the search to display the search criteria and the grid, all in one tab
	LoadContactSearch: function ()
	{
		var sSearchTree = 'campaigns-lookup-criteria';
		var sGrid = 'campaigns-search-grid';

		// Delete the old search criteria tree
		var oldTreeElement = $('[id*="' + sSearchTree + '"]');
		oldTreeElement.empty();
		var sOldID = oldTreeElement.attr('id');

		// Rename the search criteria div so that we retain the last search on a per campaign basis
		var sSearchDivForRecord = sSearchTree + '-id-' + Campaigns.Data.MarketingCampaignId;
		$('#' + sOldID).attr('id', sSearchDivForRecord);

		// Clear grid data and put into 'spin mode' whilst we load the search criteria which may be slow for very large data sets
		Campaigns.ShowGridLoadingWhilstSearchCriteriaTreeIsPopulated(true);

		// Load the entity search criteria tree
		var lRecordId = 0;	// Should be Campaigns.Data.MarketingCampaignId but old bug in search criteria tree might break other code, so play same game!
		TriSysSDK.SearchCriteria.Load("Contact", lRecordId, sSearchDivForRecord, Campaigns.InvokeLookupFromCriteria);
	},

	ShowGridLoadingWhilstSearchCriteriaTreeIsPopulated: function (bSpin)
	{
		var spinnerWait = { Div: 'campaigns-search-grid-container' };
		TriSysSDK.Grid.WaitSpinnerMode(spinnerWait, bSpin);
	},

	InvokeLookupFromCriteria: function (sEntityName, lRecordId, sPopulationJson, dynamicColumns)
	{
		var sGrid = 'campaigns-search-grid';

		// Remove 'spin mode' after we have loaded the search criteria 
		Campaigns.ShowGridLoadingWhilstSearchCriteriaTreeIsPopulated(false);

		if (!sPopulationJson)
		{
			TriSysSDK.Grid.Empty(sGrid);
			TriSysApex.Toasters.Warning("Please enter " + sEntityName + " search criteria.");
			return;
		}

		Campaigns.PopulateContactGrid(sGrid, sPopulationJson, dynamicColumns);
	},

	PopulateContactGrid: function (sGrid, sPopulationJson, dynamicColumns)
	{
		// Jan 2018: Use a dedicated API method which abstracts the underlying SQL and does not use 'SQLDatabase/SQL_Select'

		var sController = "Contacts";

		var fnPopulationByFunction = {
			API: sController + "/List",             // The Web API Controller/Function

			// The additional parameters passed into the function not including the paging metrics
			Parameters: function (request)
			{
				request.SearchTreeEnabled = true;
				request.SearchTreeJson = sPopulationJson;
			},

			DataTableFunction: function (response)  // Called to get a suitable data table for the grid to display
			{
				Campaigns.Data.UpdateStat('search', response.TotalRecordCount);
				return response.List;               // The list of records from the Web API
			}
		};

		TriSysWeb.Pages.Contacts.PopulateGrid(sGrid, "grdContacts", "Contacts", fnPopulationByFunction, null, { DynamicColumns: dynamicColumns });		
	},

	Save: function ()
	{
		var bUpdate = (Campaigns.Data.MarketingCampaignId > 0);

		var CWriteCampaignRequest = {
			MarketingCampaignId: Campaigns.Data.MarketingCampaignId,
			Name: $('#campaign-name').val(),
			Description: $('#campaign-description').val(),
			Sender: TriSysSDK.CShowForm.GetTextFromCombo("campaign-sender"),
			Settings: Campaigns.GetSettings()
		};

		var sValidationError = null;
		if (!CWriteCampaignRequest.Name)
			sValidationError = "Name";
		if (!CWriteCampaignRequest.Description && !sValidationError)
			sValidationError = "Description";
		if (sValidationError)
		{
			TriSysApex.UI.ShowMessage("Please complete the [" + sValidationError + "] field.");
			return;
		}
		if (!CWriteCampaignRequest.Settings)
			return;
		else
			CWriteCampaignRequest.Settings = JSON.stringify(CWriteCampaignRequest.Settings);

		var payloadObject = {};
		payloadObject.URL = "Marketing/WriteCampaign";
		payloadObject.OutboundDataPacket = CWriteCampaignRequest;
		payloadObject.InboundDataFunction = function (CWriteCampaignResponse)
		{
			if (CWriteCampaignResponse)
			{
				if (CWriteCampaignResponse.Success)
				{
					Campaigns.Data.MarketingCampaignId = CWriteCampaignResponse.MarketingCampaignId;

					var sName = $('#campaign-name').val();
					$('#campaign-name-block-title').html(sName);
					$('#campaigns-tab-campaignrecord-name').html(TriSysSDK.Miscellaneous.EllipsisText(sName, 20));
					$('#campaigns-campaign-name').html(': ' + sName);

					if (bUpdate)
						$('#campaign-dateupdated').html(moment().format("dddd DD MMMM YYYY"));
					else
					{
						// Show all other tab buttons
						Campaigns.Tabs.forEach(function (sTab)
						{
							Campaigns.ReadOnlyTabButton(sTab, false);
						});
					}

					TriSysApex.Toasters.Information("Saved Campaign: " + sName);
				}
				else
					TriSysApex.UI.ShowMessage(CWriteCampaignResponse.ErrorMessage);
			}
		};
		payloadObject.ErrorHandlerFunction = function (request, status, error)
		{
			TriSysApex.UI.ErrorHandlerRedirector('Campaigns.Save: ', request, status, error);
		};
		TriSysAPI.Data.PostToWebAPI(payloadObject);
	},

	GetSettings: function ()
	{
		// Validation
		var sError = null;
		var sRecipientEMailField = TriSysSDK.CShowForm.GetTextFromCombo("campaign-recipient-email-field");
		var sTemplate = TriSysActions.MailMerge.GetTemplateFromCombo('campaign-Template');
		var sAttachments = TriSysSDK.CShowForm.GetSelectedSkillsFromList('campaign-Attachments');
		var sSubject = $('#campaign-Subject').val();
		var sAttributes = TriSysSDK.CShowForm.GetSelectedSkillsFromList('campaign-Attributes');

		if (!sTemplate)
			sError = "You must choose an e-mail template.";
		else if (!sSubject)
			sError = "You must specify an e-mail subject heading.";

		if (sError)
		{
			TriSysApex.UI.ShowMessage(sError);
			return null;
		}

		// Prepare the current action data/settings for this configuration
		var mySettings =
		{
			RecipientEMailField: sRecipientEMailField,
			Template: sTemplate,
			Attachments: sAttachments,
			Subject: sSubject,
			Attributes: sAttributes,

			NoteHistory: ctrlNoteHistory.Validation(),
			FollowUp: ctrlFollowUp.Validation()
		};

		return mySettings;
	},

	DeleteMarketingCampaign: function (lMarketingCampaignId)
	{
		var CDeleteCampaignRequest = {
			MarketingCampaignId: lMarketingCampaignId
		};
		
		var payloadObject = {};
		payloadObject.URL = "Marketing/DeleteCampaign";
		payloadObject.OutboundDataPacket = CDeleteCampaignRequest;
		payloadObject.InboundDataFunction = function (CDeleteCampaignResponse)
		{
			if (CDeleteCampaignResponse)
			{
				if (CDeleteCampaignResponse.Success)
				{
					// Refresh the grid showing the deleted campaign
					Campaigns.LoadCampaigns();
				}
				else
					TriSysApex.UI.ShowMessage(CDeleteCampaignResponse.ErrorMessage);
			}
		};
		payloadObject.ErrorHandlerFunction = function (request, status, error)
		{
			TriSysApex.UI.ErrorHandlerRedirector('Campaigns.DeleteMarketingCampaign: ', request, status, error);
		};
		TriSysAPI.Data.PostToWebAPI(payloadObject);
	},

	CloneMarketingCampaign: function (lMarketingCampaignId, sNewName)
	{
		var CCloneCampaignRequest = {
			MarketingCampaignId: lMarketingCampaignId,
			Name: sNewName
		};

		var payloadObject = {};
		payloadObject.URL = "Marketing/CloneCampaign";
		payloadObject.OutboundDataPacket = CCloneCampaignRequest;
		payloadObject.InboundDataFunction = function (CCloneCampaignResponse)
		{
			if (CCloneCampaignResponse)
			{
				if (CCloneCampaignResponse.Success)
				{
					// Refresh the grid showing the cloned campaign
					Campaigns.LoadCampaigns();
				}
				else
					TriSysApex.UI.ShowMessage(CCloneCampaignResponse.ErrorMessage);
			}
		};
		payloadObject.ErrorHandlerFunction = function (request, status, error)
		{
			TriSysApex.UI.ErrorHandlerRedirector('Campaigns.CloneMarketingCampaign: ', request, status, error);
		};
		TriSysAPI.Data.PostToWebAPI(payloadObject);
	},

	// Called when a user runs an action from any menu.
	ActionSearchInvocation: function ()
	{
		var sGrid = 'campaigns-search-grid';
		return Campaigns.ActionInvocation(sGrid);
	},

	ActionRecipientInvocation: function ()
	{
		var sGrid = 'campaigns-recipients-grid';
		return Campaigns.ActionInvocation(sGrid);
	},

	ActionInvocation: function (sGrid)
	{
		var sIDField = "Contact_ContactId";

		var recordIds = TriSysSDK.Grid.GetSelectedMultipleRowsFromGrid(sGrid, sIDField);
		return recordIds;
	},

	OpenSearchContact: function ()
	{
		var lContactId = Campaigns.GetSelectedSingletonContactIdFromGrid('campaigns-search-grid');
		if (lContactId > 0)
			TriSysApex.FormsManager.OpenForm('Contact', lContactId);
	},

	CopyFromSearchResultsToRecipients: function (bAll)
	{
		if (bAll)
		{
			// Thought about reading all rows in grid data set - this however could be slow for very large numbers.
			// We are going to therefore inject the tree search to the server effectively repeating the search,
			// and copying the search results into the recipients collection
			var sSearchCriteriaInstance = 'search-criteria-tree-campaigns-lookup-criteria-id-' + Campaigns.Data.MarketingCampaignId;
			var sJSON = ctrlSearchCriteria.GetJSONSearchRules('Contact', sSearchCriteriaInstance, Campaigns.Data.MarketingCampaignId);
			Campaigns.AddContactsToRecipients(null, sJSON);
		}
		else
		{
			// Only selected rows required
			var sGrid = 'campaigns-search-grid';
			var lstContactId = Campaigns.ActionInvocation(sGrid);
			if (!lstContactId || lstContactId.length == 0)
				TriSysApex.UI.ShowMessage("Please select one or more records.");
			else
			{
				Campaigns.AddContactsToRecipients(lstContactId);
			}
		}
	},

	AddContactsToRecipients: function (lstContactId, sSearchTreeJson)
	{
		var CAddContactsToCampaignRecipientsRequest = {
			MarketingCampaignId: Campaigns.Data.MarketingCampaignId,
			Contacts: lstContactId,
			SearchTreeEnabled: (!lstContactId),
			SearchTreeJson: sSearchTreeJson
		};

		var payloadObject = {};
		payloadObject.URL = "Marketing/AddContactsToCampaignRecipients";
		payloadObject.OutboundDataPacket = CAddContactsToCampaignRecipientsRequest;
		payloadObject.InboundDataFunction = function (CAddContactsToCampaignRecipientsResponse)
		{
			TriSysApex.UI.HideWait();

			if (CAddContactsToCampaignRecipientsResponse)
			{
				if (CAddContactsToCampaignRecipientsResponse.Success)
				{
					// Report stats
					var sCounter = TriSysSDK.Numbers.ThousandsSeparator(CAddContactsToCampaignRecipientsResponse.AddedCount);
					TriSysApex.Toasters.Information(sCounter + " recipient(s) added.");

					// Update the number of recipients
					Campaigns.Data.UpdateStat('recipients', CAddContactsToCampaignRecipientsResponse.RecipientCount);

					// Refresh the grid showing the recipients as we are on it and users expect feedback
					Campaigns.LoadRecipients();
				}
				else
					TriSysApex.UI.ShowMessage(CAddContactsToCampaignRecipientsResponse.ErrorMessage);
			}
		};
		payloadObject.ErrorHandlerFunction = function (request, status, error)
		{
			TriSysApex.UI.HideWait();
            TriSysApex.UI.ErrorHandlerRedirector('Campaigns.AddContactsToRecipients: ', request, status, error);
		};

		TriSysApex.UI.ShowWait(null, "Adding Recipients...");
		TriSysAPI.Data.PostToWebAPI(payloadObject);
	},

	LoadRecipients: function ()
	{
		var fnPopulationByFunction = {
			API: "Marketing/CampaignRecipientList",    // The Web API Controller/Function

			// The additional parameters passed into the function not including the paging metrics
			Parameters: function (request)
			{
				request.MarketingCampaignId = Campaigns.Data.MarketingCampaignId;
				request.Added = true;
				request.Scheduled = true;
			},

			DataTableFunction: function (response)		// Called to get a suitable data table for the grid to display
			{
				Campaigns.Data.UpdateStat('recipients', response.TotalRecordCount);
				return response.List;					// The list of records from the Web API
			}
		};

		// Show date sent column after surname column
		var columns = JSON.parse(JSON.stringify(TriSysWeb.Pages.Contacts.Columns));
		columns.splice(3, 0, { field: "Added", title: "Added", type: "date", format: "{0:dd MMM yyyy HH:mm}" });
		columns.splice(4, 0, { field: "Scheduled", title: "Scheduled", type: "date", format: "{0:dd MMM yyyy HH:mm}" });

		// Generic
		var options = {
			DrillDownFunction: Campaigns.OpenContact
		};
		TriSysWeb.Pages.Contacts.PopulateGrid('campaigns-recipients-grid', "grdContacts", "Contacts", fnPopulationByFunction, columns, options);
	},

	OpenRecipient: function ()
	{
		var lContactId = Campaigns.GetSelectedSingletonContactIdFromGrid('campaigns-recipients-grid');
		if (lContactId > 0)
			Campaigns.OpenContact(lContactId);
	},

	AddRecipient: function ()
	{
		var fnSelected = function (sEntityName, lRecordId, sName)
		{
			// Add to recipients and refresh grid
			Campaigns.AddContactsToRecipients([lRecordId]);
		};

		TriSysApex.ModalDialogue.EntityRecord.Select('Contact', fnSelected);
	},

	RemoveRecipient: function (bAll)
	{
		var lstContactId = null;

		if (!bAll)
		{
			var sGrid = 'campaigns-recipients-grid';
			var sIDField = "Contact_ContactId";

			lstContactId = TriSysSDK.Grid.GetSelectedMultipleRowsFromGrid(sGrid, sIDField);

			if (!lstContactId || lstContactId.length == 0)
			{
				TriSysApex.UI.ShowMessage("Please select one or more recipients.");
				return;
			}
		}

		var CRemoveCampaignRecipientsRequest = {
			MarketingCampaignId: Campaigns.Data.MarketingCampaignId,
			Contacts: lstContactId,
			AllRecipients: bAll
		};

		var payloadObject = {};
		payloadObject.URL = "Marketing/RemoveCampaignRecipients";
		payloadObject.OutboundDataPacket = CRemoveCampaignRecipientsRequest;
		payloadObject.InboundDataFunction = function (CRemoveCampaignRecipientsResponse)
		{
			TriSysApex.UI.HideWait();

			if (CRemoveCampaignRecipientsResponse)
			{
				if (CRemoveCampaignRecipientsResponse.Success)
				{
					// Report stats
					var sCounter = TriSysSDK.Numbers.ThousandsSeparator(CRemoveCampaignRecipientsResponse.RemovedCount);
					TriSysApex.Toasters.Information(sCounter + " recipient(s) removed.")

					// Refresh the grid showing the recipients as we are on it and users expect feedback
					Campaigns.LoadRecipients();
				}
				else
					TriSysApex.UI.ShowMessage(CRemoveCampaignRecipientsResponse.ErrorMessage);
			}
		};
		payloadObject.ErrorHandlerFunction = function (request, status, error)
		{
			TriSysApex.UI.HideWait();
            TriSysApex.UI.ErrorHandlerRedirector('Campaigns.RemoveRecipient: ', request, status, error);
		};

		TriSysApex.UI.ShowWait(null, "Removing Recipients...");
		TriSysAPI.Data.PostToWebAPI(payloadObject);
	},

	// This is what this form is all about: actually sending the e-mail to those selected or all recipients
	SendToRecipient: function (bAll)
	{
		var lstContactId = null, lNumberOfRecipients = 0;

		if (bAll)
		{
			var sNumberOfRecipients = $('#campaigns-tab-recipients-count').html();
			if (sNumberOfRecipients)
				lNumberOfRecipients = parseInt(sNumberOfRecipients.replace(/,/g, ''));
		}
		else
		{
			var sGrid = 'campaigns-recipients-grid';
			var sIDField = "Contact_ContactId";

			lstContactId = TriSysSDK.Grid.GetSelectedMultipleRowsFromGrid(sGrid, sIDField);

			if (!lstContactId || lstContactId.length == 0)
			{
				TriSysApex.UI.ShowMessage("Please select one or more recipients.");
				return;
			}
			else
				lNumberOfRecipients = lstContactId.length;
		}

		if (lNumberOfRecipients == 0)
		{
			TriSysApex.UI.ShowMessage("There are no recipients.");
			return;
		}

		var CSendToCampaignRecipientsRequest = {
			MarketingCampaignId: Campaigns.Data.MarketingCampaignId,
			Name: $('#campaign-name').val(),
			Contacts: lstContactId,
			AllRecipients: bAll,
			NumberOfRecipients: lNumberOfRecipients
		};

		// Prompt the user to schedule this e-mail send for a future date/time or now
		TriSysApex.WhiteLabelling.LoadJavascriptFile('js/pages/ctrlCampaignSendSchedule.js', null,
			function ()
			{
				Campaigns.PopupCampaignSendSchedule(CSendToCampaignRecipientsRequest);
			});
	},

	PopupCampaignSendSchedule: function (sName, lNumberOfRecipients)
	{
		var parametersObject = new TriSysApex.UI.ShowMessageParameters();
		parametersObject.Title = "Schedule Send";
		parametersObject.Image = "fa-send-o";
		parametersObject.Maximize = false;
		parametersObject.CloseTopRightButton = true;

		parametersObject.ContentURL = TriSysApex.Constants.UserControlFolder + "ctrlCampaignSendSchedule.html";
		parametersObject.Width = 600;

		// Callback
		parametersObject.OnLoadCallback = function ()
		{
			ctrlCampaignSendSchedule.Load(sName, lNumberOfRecipients);
		};

		// Buttons
		parametersObject.ButtonLeftVisible = true;
		parametersObject.ButtonLeftText = "Cancel";
		parametersObject.ButtonLeftFunction = function ()
		{
			return true;
		};

		parametersObject.ButtonCentreVisible = true;
		parametersObject.ButtonCentreText = "Send";
		parametersObject.ButtonCentreFunction = ctrlCampaignSendSchedule.Send;

		TriSysApex.UI.PopupMessage(parametersObject);
	},

	// Called from scheduling popup
	ScheduleSendViaWebAPI: function (CSendToCampaignRecipientsRequest)
	{
		var payloadObject = {};
		payloadObject.URL = "Marketing/SendToCampaignRecipients";
		payloadObject.OutboundDataPacket = CSendToCampaignRecipientsRequest;
		payloadObject.InboundDataFunction = function (CSendToCampaignRecipientsResponse)
		{
			TriSysApex.UI.HideWait();

			if (CSendToCampaignRecipientsResponse)
			{
				if (CSendToCampaignRecipientsResponse.Success)
				{
					// Report stats
					var sCounter = TriSysSDK.Numbers.ThousandsSeparator(CSendToCampaignRecipientsResponse.ScheduledCount);
					TriSysApex.Toasters.Information(sCounter + " recipient e-mail(s) scheduled.")

					// Refresh the grid showing the recipients including the scheduled date for delivery
					Campaigns.LoadRecipients();
				}
				else
					TriSysApex.UI.ShowMessage(CSendToCampaignRecipientsResponse.ErrorMessage);
			}
		};
		payloadObject.ErrorHandlerFunction = function (request, status, error)
		{
			TriSysApex.UI.HideWait();
			TriSysApex.UI.ErrorHandlerRedirector('Campaigns.ScheduleSendViaWebAPI: ', request, status, error);
		};

		TriSysApex.UI.ShowWait(null, "Sending to Recipients...");
		TriSysAPI.Data.PostToWebAPI(payloadObject);
	},

	GetSelectedSingletonContactIdFromGrid: function (sGrid)
	{
		var sIDField = "Contact_ContactId";
		var lContactId = TriSysSDK.Grid.GetSelectedSingletonRowRecordIdFromGrid(sGrid, sIDField, "contact");
		return lContactId;
	},

	// SENT START
	LoadSent: function ()
	{
		var fnPopulationByFunction = {
			API: "Marketing/CampaignRecipientList",    // The Web API Controller/Function

			// The additional parameters passed into the function not including the paging metrics
			Parameters: function (request)
			{
				request.MarketingCampaignId = Campaigns.Data.MarketingCampaignId;
				request.Sent = true;
			},

			DataTableFunction: function (response)		// Called to get a suitable data table for the grid to display
			{
				Campaigns.Data.UpdateStat('sent', response.TotalRecordCount);
				return response.List;					// The list of records from the Web API
			}
		};

		// Show date sent column after surname column
		var columns = JSON.parse(JSON.stringify(TriSysWeb.Pages.Contacts.Columns));
		columns.splice(3, 0, { field: "Sent", title: "Sent", type: "date", format: "{0:dd MMM yyyy HH:mm}" });

		// Generic
		var options = {
			DrillDownFunction: Campaigns.OpenContact
		};
		TriSysWeb.Pages.Contacts.PopulateGrid('campaigns-sent-grid', "grdContacts", "Contacts", fnPopulationByFunction, columns, options);
	},

	OpenSent: function ()
	{
		var lContactId = Campaigns.GetSelectedSingletonContactIdFromGrid('campaigns-sent-grid');
		if (lContactId > 0)
			Campaigns.OpenContact(lContactId);
	},

	ActionSentInvocation: function ()
	{
		var sGrid = 'campaigns-sent-grid';
		return Campaigns.ActionInvocation(sGrid);
	},

	// SENT END

	// DELIVERED START
	LoadDelivered: function ()
	{
		var fnPopulationByFunction = {
			API: "Marketing/CampaignRecipientList",    // The Web API Controller/Function

			// The additional parameters passed into the function not including the paging metrics
			Parameters: function (request)
			{
				request.MarketingCampaignId = Campaigns.Data.MarketingCampaignId;
				request.Delivered = true;
			},

			DataTableFunction: function (response)		// Called to get a suitable data table for the grid to display
			{
				Campaigns.Data.UpdateStat('delivered', response.TotalRecordCount);
				return response.List;					// The list of records from the Web API
			}
		};

		// Show date sent column after surname column
		var columns = JSON.parse(JSON.stringify(TriSysWeb.Pages.Contacts.Columns));
		columns.splice(3, 0, { field: "Delivered", title: "Delivered", type: "date", format: "{0:dd MMM yyyy HH:mm}" });

		// Generic
		var options = {
			DrillDownFunction: Campaigns.OpenContact
		};
		TriSysWeb.Pages.Contacts.PopulateGrid('campaigns-delivered-grid', "grdContacts", "Contacts", fnPopulationByFunction, columns, options);
	},

	OpenDelivered: function ()
	{
		var lContactId = Campaigns.GetSelectedSingletonContactIdFromGrid('campaigns-delivered-grid');
		if (lContactId > 0)
			Campaigns.OpenContact(lContactId);
	},

	ActionDeliveredInvocation: function ()
	{
		var sGrid = 'campaigns-delivered-grid';
		return Campaigns.ActionInvocation(sGrid);
	},

	// DELIVERED END

	// OPENED START
	LoadOpened: function ()
	{
		var fnPopulationByFunction = {
			API: "Marketing/CampaignRecipientList",    // The Web API Controller/Function

			// The additional parameters passed into the function not including the paging metrics
			Parameters: function (request)
			{
				request.MarketingCampaignId = Campaigns.Data.MarketingCampaignId;
				request.Opened = true;
			},

			DataTableFunction: function (response)		// Called to get a suitable data table for the grid to display
			{
				Campaigns.Data.UpdateStat('openread', response.TotalRecordCount);
				return response.List;					// The list of records from the Web API
			}
		};

		// Show date sent column after surname column
		var columns = JSON.parse(JSON.stringify(TriSysWeb.Pages.Contacts.Columns));
		columns.splice(3, 0, { field: "Opened", title: "Opened/Read", type: "date", format: "{0:dd MMM yyyy HH:mm}" });

		// Generic
		var options = {
			DrillDownFunction: Campaigns.OpenContact
		};
		TriSysWeb.Pages.Contacts.PopulateGrid('campaigns-openread-grid', "grdContacts", "Contacts", fnPopulationByFunction, columns, options);
	},

	OpenRead: function ()
	{
		var lContactId = Campaigns.GetSelectedSingletonContactIdFromGrid('campaigns-openread-grid');
		if (lContactId > 0)
			Campaigns.OpenContact(lContactId);
	},

	ActionOpenedInvocation: function ()
	{
		var sGrid = 'campaigns-openread-grid';
		return Campaigns.ActionInvocation(sGrid);
	},

	// OPENED END

	// CLICKED START
	LoadClicked: function ()
	{
		var fnPopulationByFunction = {
			API: "Marketing/CampaignRecipientList",    // The Web API Controller/Function

			// The additional parameters passed into the function not including the paging metrics
			Parameters: function (request)
			{
				request.MarketingCampaignId = Campaigns.Data.MarketingCampaignId;
				request.Clicked = true;
			},

			DataTableFunction: function (response)		// Called to get a suitable data table for the grid to display
			{
				Campaigns.Data.UpdateStat('clicks', response.TotalRecordCount);
				return response.List;					// The list of records from the Web API
			}
		};

		// Show date sent column after surname column
		var columns = JSON.parse(JSON.stringify(TriSysWeb.Pages.Contacts.Columns));
		columns.splice(3, 0, { field: "Clicked", title: "Clicked", type: "date", format: "{0:dd MMM yyyy HH:mm}" });

		// Generic
		var options = {
			DrillDownFunction: Campaigns.OpenContact
		};
		TriSysWeb.Pages.Contacts.PopulateGrid('campaigns-clicks-grid', "grdContacts", "Contacts", fnPopulationByFunction, columns, options);
	},

	OpenClicked: function ()
	{
		var lContactId = Campaigns.GetSelectedSingletonContactIdFromGrid('campaigns-clicks-grid');
		if (lContactId > 0)
			Campaigns.OpenContact(lContactId);
	},

	ActionClickedInvocation: function ()
	{
		var sGrid = 'campaigns-clicks-grid';
		return Campaigns.ActionInvocation(sGrid);
	},

	// CLICKED END

	// UNDELIVERED START
	LoadUndelivered: function ()
	{
		var fnPopulationByFunction = {
			API: "Marketing/CampaignRecipientList",    // The Web API Controller/Function

			// The additional parameters passed into the function not including the paging metrics
			Parameters: function (request)
			{
				request.MarketingCampaignId = Campaigns.Data.MarketingCampaignId;
				request.Undelivered = true;
			},

			DataTableFunction: function (response)		// Called to get a suitable data table for the grid to display
			{
				Campaigns.Data.UpdateStat('undelivered', response.TotalRecordCount);
				return response.List;					// The list of records from the Web API
			}
		};

		// Show date sent column after surname column
		var columns = JSON.parse(JSON.stringify(TriSysWeb.Pages.Contacts.Columns));
		columns.splice(3, 0, { field: "Undelivered", title: "Undelivered", type: "date", format: "{0:dd MMM yyyy HH:mm}" });

		// Generic
		var options = {
			DrillDownFunction: Campaigns.OpenContact
		};
		TriSysWeb.Pages.Contacts.PopulateGrid('campaigns-undelivered-grid', "grdContacts", "Contacts", fnPopulationByFunction, columns, options);
	},

	OpenUndelivered: function ()
	{
		var lContactId = Campaigns.GetSelectedSingletonContactIdFromGrid('campaigns-undelivered-grid');
		if (lContactId > 0)
			Campaigns.OpenContact(lContactId);
	},

	ActionUndeliveredInvocation: function ()
	{
		var sGrid = 'campaigns-undelivered-grid';
		return Campaigns.ActionInvocation(sGrid);
	},

	// UNDELIVERED END

	// Generic open contact button from all recipient grids.
	// This gathers all information about this contact in this campaign e.g. each click, copy of message etc..
	// Plus of course it allows drill down into the full contact record.
	OpenContact: function (lContactId)
	{
		TriSysApex.WhiteLabelling.LoadJavascriptFile('js/pages/ctrlCampaignRecipient.js', null,
			function ()
			{
				Campaigns.PopupCampaignRecipient(lContactId);
			});
	},

	PopupCampaignRecipient: function (lContactId)
	{
		var parametersObject = new TriSysApex.UI.ShowMessageParameters();
		parametersObject.Title = "Campaign Recipient";
		parametersObject.Image = "fa-send-o";
		parametersObject.Maximize = false;
		parametersObject.CloseTopRightButton = true;

		parametersObject.ContentURL = TriSysApex.Constants.UserControlFolder + "ctrlCampaignRecipient.html";
		parametersObject.Width = 600;

		// Callback
		parametersObject.OnLoadCallback = function ()
		{
			ctrlCampaignRecipient.Load(lContactId, Campaigns.Data.MarketingCampaignId);
		};

		// Buttons
		parametersObject.ButtonLeftVisible = true;
		parametersObject.ButtonLeftText = "Close";
		parametersObject.ButtonLeftFunction = function ()
		{
			return true;
		};

		parametersObject.ButtonCentreVisible = true;
		parametersObject.ButtonCentreText = "Open Contact";
		parametersObject.ButtonCentreFunction = function ()
		{
			TriSysApex.FormsManager.OpenForm('Contact', lContactId);
			return true;
		}

		parametersObject.ButtonRightVisible = true;
		parametersObject.ButtonRightText = "Open E-Mail";
		parametersObject.ButtonRightFunction = function ()
		{
			ctrlCampaignRecipient.OpenEMail(lContactId, Campaigns.Data.MarketingCampaignId);
			//return true;
		}

		TriSysApex.UI.PopupMessage(parametersObject);
	},

	PopulateSenderCombo: function ()
	{
		var payloadObject = {};
		payloadObject.URL = "Marketing/AvailableSenders";
		payloadObject.InboundDataFunction = function (CAvailableSendersResponse)
		{
			if (CAvailableSendersResponse)
			{
				if (CAvailableSendersResponse.Success)
				{
					// Populate combo with list
					var lstSenders = [];
					CAvailableSendersResponse.Senders.forEach(function (sSenderAddress)
					{
						lstSenders.push({ value: sSenderAddress, text: sSenderAddress });
					});

					TriSysSDK.CShowForm.populateComboFromDataSource("campaign-sender", lstSenders);
				}
				else
					TriSysApex.UI.ShowMessage(CAvailableSendersResponse.ErrorMessage);
			}
		};
		payloadObject.ErrorHandlerFunction = function (request, status, error)
		{
			TriSysApex.UI.ErrorHandlerRedirector('Campaigns.PopulateSenderCombo: ', request, status, error);
		};
		TriSysAPI.Data.PostToWebAPI(payloadObject);
	},

	PopulateRecipientEMailFieldCombo: function ()
	{
		var sWork = 'Work E-Mail', sPersonal = 'Personal E-Mail';		// See API.CMarketingCampaign
		var lstFields = [{ value: sWork, text: sWork }, { value: sPersonal, text: sPersonal }];
		TriSysSDK.CShowForm.populateComboFromDataSource("campaign-recipient-email-field", lstFields);
	},

	Data:
	{
		MarketingCampaignId: 0,					// Campaigns.Data.MarketingCampaignId

		// When we search for contacts, or add to recipients, update the server for next time
		UpdateStat: function (sTab, lCount)		// Campaigns.Data.UpdateStat
		{
			// Do screen first
			Campaigns.SetTabStatCount(sTab, lCount);

			var sField = null;
			switch (sTab)
			{
				case 'search':
					sField = 'LastSearchCount';
					break;

				case 'recipients':
					sField = 'Recipients';
					break;					
			}

			// Do server asynchronously
			var CUpdateCampaignStatisticRequest = {
				MarketingCampaignId: Campaigns.Data.MarketingCampaignId,
				Field: sField,
				Value: lCount
			};

			var payloadObject = {};
			payloadObject.URL = "Marketing/UpdateCampaignStatistic";
			payloadObject.OutboundDataPacket = CUpdateCampaignStatisticRequest;
			payloadObject.InboundDataFunction = function (CUpdateCampaignStatisticResponse)
			{
				if (CUpdateCampaignStatisticResponse)
				{
					if (CUpdateCampaignStatisticResponse.Success)
					{
						// Silent operation
					}
					else
						TriSysApex.UI.ShowMessage(CUpdateCampaignStatisticResponse.ErrorMessage);
				}
			};
			payloadObject.ErrorHandlerFunction = function (request, status, error)
			{
				TriSysApex.UI.ErrorHandlerRedirector('Campaigns.Data.UpdateStat: ', request, status, error);
			};
			TriSysAPI.Data.PostToWebAPI(payloadObject);
		}

	}	// Campaigns.Data
};

$(document).ready(function ()
{
    Campaigns.Load();
});