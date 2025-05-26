// TriSys Apex Browser Extension.
//
//#region Legacy 2017 Version 1
// ORIGINAL VERSION 2017:
//
// Managed 2 iframed pages: 
//  extension-top-region.html
//  extension-popup-window.html
//
// There are 2 types of interprocess communication:
//  a. From the Browser extension framework - we use window.addEventListener
//  b. Between top region and popup window - we use our own TriSysApex.InterprocessCommunication mechanism
//
//
// Q. Why 2? 
// A. Because the browser extension code does not know anything about Apex code, so we have to use generic comms.
//    Also, we want a reliable Apex-only easy to use interprocess comms mechanism for our own comms.
//#endregion Legacy 2017 Version 1
//
//#region Production 2019 Version 2
// LATEST VERSION July/August 2019
//
// The Chrome/Edge Extension has only a popup: extension-popup-window.html and no top region
// because LinkedIn/Microsoft killed our original extension from working as the controller was the
// top region which they blocked access to the DOM thus rendering our extension useless.
// In July 2019, with the new SignalR however, a brand new in-house extension project was started.
// This does not rely on a 3rd party and everything is done in the popup which gathers the LinkedIn
// profile and sends this to an embedded iFrame loading this page and with Base64 arguments containing
// the profile information.
// The new Chrome Extension lives at E:\Development\Production\Chrome Extension\2019
// This is a clear separation of concerns as the extension knows nothing about Apex or API's, and
// this code knows nothing about the implementation of the extension, so can be tested in isolation.
//#endregion Production 2019 Version 2
//
//
//#region Production 2019 Version 3
// LATEST VERSION September 2019
//
// Now used by the new Office for Web add-in.
// See E:\Development\Research\Office\TriSysOutlookWebAddIn\TriSysOutlookWebAddInWeb
//
//#endregion Production 2019 Version 3
//
var TriSysExtension =
{
	Version: "2023.02.23.1430",
            
    CVPreviewID: 'cv-preview-control',

    Load: function(options)
    {		
		var fnOnConnectionCallback = null;
		if(options && options.OfficeAddIn)
		{
			// We are small in the Outlook task pane, so make room for menus by removing the TriSys logo and advertising
			$('#trisys-extension-popup-toolbar').css('border-radius', '0px');
			$('#trisys-extension-popup-toolbar-logo').remove();
			$('#trisys-extension-popup-toolbar-advertising').remove();
			$('#trisys-extension-popup-toolbar-menu').removeClass().addClass("col-xs-12");

			// Only start populating data after we are connected to the Web API
			fnOnConnectionCallback = options.OnConnectionCallback;
			TriSysExtension._OfficeAddInCallbackFunctionForAfterWeLogin = fnOnConnectionCallback;
		}

		// First thing to do is show visuals to user
		var spinnerImage = TriSysExtension.ParseCommandLineForSpinnerImage();
		TriSysExtension.ShowRandomLookingUpImage('trisys-extension-popup-spinner-image', spinnerImage);
		TriSysExtension.ShowRandomLookingUpImage('looking-up-profile-in-trisys-spinner-image', spinnerImage);		
		
		// Get the profile passed in via URL
		var personalDetails = TriSysExtension.ParseCommandLineForPersonalDetails();
		

		// We may be called before Platformix is dynamically loaded, so wait until ready
		var fnPlatformixLoaded = function()
		{
			// The framework is now loaded allowing us full access to everything we need

			// We are not using the default platformix behaviour as we are web jobs independent
			TriSysAPI.Constants.APIKey = '20131222-ba09-4e4c-8bcb-apex.web.app';
			TriSysAPI.Session.SetDeveloperSiteKey(TriSysAPI.Constants.APIKey);

			// Show after loading the framework?
			if(!fnOnConnectionCallback)
				TriSysExtension.HideLaunchSpinnerAndShowPublicProfile();
			
			// Identify the cached customer API credentials and if necessary re-authenticate to establish a session
			// We do not want to login as vacancies only. This tool is for subscribers only.
			var options = { 
				Subscriber: true		// Ignore web jobs keys as we do not need this
			};
			Platformix.Framework.Initialise(function() 
			{
				TriSysExtension.FrameworkLoaded(personalDetails, spinnerImage, fnOnConnectionCallback); 
			}, options);
		};
		PlatformixLoader.WaitUntilLoaded(fnPlatformixLoaded);
	},

	ParseCommandLineForSpinnerImage: function()
	{
		var sURL = window.location.href;
        var sSpinnerImage = URL.Parser(sURL).getParam("spinnerImage");
		if(sSpinnerImage)
		{
			// URL params does not like '=' characters!
			sSpinnerImage = sSpinnerImage.replace(/TriSys/g, '=');
			sSpinnerImage = Base64Unicode.Decode(sSpinnerImage);
		}

		return sSpinnerImage;
	},

	ParseCommandLineForPersonalDetails: function()
	{
		// July 2019: Extension v2         START

		// Clear data from last visit or if we are refreshing
		TriSysExtension.Cache.SetContactDetails({ Contact: { ContactId: 0} });
		TriSysExtension.Cache.SetSecondaryContactDetails({});

        var sURL = window.location.href;
        var sPersonalDetailsJSON = URL.Parser(sURL).getParam("personalDetails");

        var personalDetails = null;
        if(sPersonalDetailsJSON)
        {
			// URL params does not like '=' characters!
            sPersonalDetailsJSON = sPersonalDetailsJSON.replace(/TriSys/g, '=');

			// FFS - turns out this can crash when encoding
            //sPersonalDetailsJSON = $.base64.decode(decodeURIComponent(sPersonalDetailsJSON));
            sPersonalDetailsJSON = Base64Unicode.Decode(sPersonalDetailsJSON);

			if(sPersonalDetailsJSON)
			{
				try {
					personalDetails = JSON.parse(sPersonalDetailsJSON);

				} catch (e) {
					// Probably a parser error which we will ignore in production
					personalDetails = null;
				}
			}
        }
            
        if(personalDetails)
        {
			// The extension uses the same field names as TriSys Web API
            TriSysExtension.DisplayContactDetails(personalDetails, 'parsed-');

			// Set these details now ready for display
			TriSysExtension.Cache.SetContactDetails({ Contact: { ContactId: 0} });
        }
		else
		{
			// Nothing for us to show so instead show nothing!
		}

		return personalDetails;
	},

	LoadAccordion: function()
	{
		if(!TriSysExtension.isRecruitmentDatabase())
		{
			// Hide CV, requirements/placements
			var lstRecruitment = [ 'cvpreview-li', 'requirements-li', 'placements-li'];
			lstRecruitment.forEach(function(sPanel)
			{
				var sID = 'accordion-panelbar-' + sPanel;
				$('#' + sID).hide();
			});

			// Make other panels higher too: 373px
			var sContactDetailsSize = '373px';
			var sTaskListSize = '381px';
			var lstResize = [ 
				{ id: 'contact-details-div', minHeight: sContactDetailsSize, maxHeight: sContactDetailsSize }, 
				{ id: 'contact-details-table',  height: sContactDetailsSize, maxHeight: sContactDetailsSize },
				{ id: 'noteshistory-div', maxHeight: sTaskListSize },
				{ id: 'noteshistory-table', minHeight: '360px'},
				{ id: 'scheduledtasks-div', maxHeight: sTaskListSize },
				{ id: 'scheduledtasks-table', minHeight: '360px'}
			];
			lstResize.forEach(function(item)
			{
				var sID = 'accordion-panelbar-' + item.id;
				var elem = $('#' + sID);
				if(item.minHeight)
					elem.css('min-height', item.minHeight);
				if(item.maxHeight)
					elem.css('max-height', item.maxHeight);
				if(item.height)
				    elem.css('height', item.height);
			});
		}

		$("#accordion-panelbar").kendoPanelBar({
            expandMode: "single"
        });
	},

	isRecruitmentDatabase: function()
	{
		var bRecruitmentDatabase = false;
		var cache = TriSysApex.LoginCredentials.Cache.Read();
		if(cache)
		{
			if(cache.DatabaseType)
				bRecruitmentDatabase = cache.DatabaseType.Recruitment;
		}

		return bRecruitmentDatabase;
	},

	LoadToolbarMenu: function()
	{
		//var onSelect = function(e)
		//{
		//	var sText = $(e.item).children(".k-link").text();
		//	var sKey = $(e.item).data('item-key');
		//	if(!sKey)
		//		return;
			
		//	switch(sKey)
		//	{
		//		default:
		//			TriSysApex.Toasters.Info(sText + ": " + sKey);
		//			break;
		//	}
		//};

		var fnRefresh = function()
		{
			TriSysExtension.Refresh(true);
		};

		var sImageRoot = 'https://apex.trisys.co.uk/';

		//var separatorItem =	{ text: "<li class='k-separator'></li>", encoded: false, enabled: false					};
		//var separatorItem = { text: "<div class='k-separator'></div>", encoded: false, enabled: false };
		var separatorItem = { text: '<div class="k-separator k-item k-state-default" role="menuitem" style="width: 100%;">&nbsp;</div>', encoded: false, enabled: false };

		var addMenuItems = [
                        { text: "Add New Contact",				select: TriSysExtension.AddNewContact					},
                        { text: "Assign to Existing Contact",	select: TriSysExtension.AssignToExistingContact			}
		];

		var actionsMenuItems = [];
		if(TriSysExtension.isRecruitmentDatabase())
			actionsMenuItems.push({ text: "Add to Shortlist",	select: TriSysExtension.AddToShortlist					});      
		actionsMenuItems.push({ text: "Call",					select: TriSysExtension.Actions.Call					});
        actionsMenuItems.push({ text: "E-Mail",					select: TriSysExtension.Actions.EMail					});
        actionsMenuItems.push({ text: "Mail Merge",				select: TriSysExtension.Actions.MailMerge				});
        actionsMenuItems.push({ text: "Meeting",				select: TriSysExtension.Actions.Meeting					});
        actionsMenuItems.push({ text: "Note",					select: TriSysExtension.Actions.Note					});
        actionsMenuItems.push({ text: "Note/History",			select: TriSysExtension.AddNewNote						});
        actionsMenuItems.push({ text: "Scheduled Task",			select: TriSysExtension.AddScheduledTask				});
        actionsMenuItems.push({ text: "Send SMS Text",			select: TriSysExtension.Actions.SMSText					});
        actionsMenuItems.push({ text: "ToDo",					select: TriSysExtension.Actions.ToDo					});

		var fnApplyChanges = function()
		{
			TriSysExtension.ApplyChanges({ title: "Update TriSys" });
		};

		var settingsMenuItems = [];
		if(!TriSysExtension.isOfficeAddInWebServerComponent())
		{
			settingsMenuItems.push({ text: "Close Popup",		select: TriSysExtension.ClosePopupWindow				  });
			settingsMenuItems.push(separatorItem);
		}
		settingsMenuItems.push({ text: "Logoff",				select: TriSysExtension.LogOff							  });
		settingsMenuItems.push(separatorItem);
		settingsMenuItems.push({ text: "Help",					select: TriSysExtension.Help							  });
		//settingsMenuItems.push(separatorItem);                          // Debug 07 Dec 2021
		//settingsMenuItems.push({ text: "Refresh", select: fnRefresh }); // Debug 07 Dec 2021
		settingsMenuItems.push(separatorItem);
		settingsMenuItems.push({ text: "About", select: TriSysExtension.AboutPopupWindow });


		$("#toolbar-menu").kendoMenu({
            dataSource: [
                {
                    text: "CRM",								imageUrl: sImageRoot + "images/trisys/24x24/folder-open-2.png",
                    items: [
                        { text: "Open Contact",					select: TriSysExtension.OpenContactForm					},
                        { text: "Open Company",					select: TriSysExtension.OpenCompanyForm					},
						separatorItem,
						{ text: "Update TriSys",				select: fnApplyChanges									},
						separatorItem,
						{ text: "Refresh Profile",				select: fnRefresh										}
                    ]
                },
                {
                    text: "Add", imageUrl: sImageRoot + "images/trisys/24x24/add-2.png", attr: { 'data-item-key': 'add'				},
                    items: addMenuItems
                },
				{
                    text: "Actions", imageUrl: sImageRoot + "images/trisys/24x24/wand-2.png",
                    items: actionsMenuItems
                },
                {
                    text: "",		imageUrl: sImageRoot + "images/trisys/24x24/cogs-3.png",
                    items: settingsMenuItems
                }
            ] /*,
			select: onSelect*/
        });

	},

	// Centralise the toolbar menu options
	ToolbarMenuVisibility: function(options)		
	{
		if(!options)
			return;

		var fnToolbarMenuNth = function(index)
		{
			return "#toolbar-menu > li:nth-child(" + index + ")";
		};

		// Always show settings menu
		$(fnToolbarMenuNth(4)).show();	

		if(options.OpenAddMenu)				// TriSysExtension.ToolbarMenuVisibility({OpenAddMenu: true})
		{
			// Control does not have support for this!
			//var menu = $("#toolbar-menu").data("kendoMenu");
			// open the add sub menu
			//var firstItemUid = menu.dataSource.at(0).uid;		WTF?
			//var item = menu.findByUid(firstItemUid);
			//menu.open(item);
			//document.querySelector("#toolbar-menu > li:nth-child(2)")[0].click();
			$(fnToolbarMenuNth(2)).show();
			$(fnToolbarMenuNth(2)).trigger('mouseover');
		}

		if(options.HideAddToAndAssign)		// TriSysExtension.ToolbarMenuVisibility({HideAddToAndAssign: true})
		{
			// Hide some Add-> menu items
			$(fnToolbarMenuNth(2) + " > ul > li:nth-child(1)").hide();								// Add->Add New Contact
			$(fnToolbarMenuNth(2) + " > ul > li:nth-child(2)").hide();								// Add->Assign to Existing Contact
			$(fnToolbarMenuNth(2) + " > ul > li:nth-child(3)").hide();								// Add->Separator
		}
		else
		{
			// Show Add-> menu items in case they were hidden previously
			$(fnToolbarMenuNth(2) + " > ul > li:nth-child(1)").show();								// Add->Add New Contact
			$(fnToolbarMenuNth(2) + " > ul > li:nth-child(2)").show();								// Add->Assign to Existing Contact
			$(fnToolbarMenuNth(2) + " > ul > li:nth-child(3)").show();								// Add->Separator
		}

		if(options.NoContactMatch)			// TriSysExtension.ToolbarMenuVisibility({NoContactMatch: true})
		{
			// Ensure that items are not visible unless we know if contact exists or not
			$(fnToolbarMenuNth(1)).hide();															// File

			//$(fnToolbarMenuNth(2) + " > ul > li:nth-child(3)").hide();								// Add->Separator
			//$(fnToolbarMenuNth(2) + " > ul > li:nth-child(4)").hide();								// Add->Add Note
			//$(fnToolbarMenuNth(2) + " > ul > li:nth-child(5)").hide();								// Add->Scheduled Task
			//$(fnToolbarMenuNth(2) + " > ul > li:nth-child(6)").hide();								// Add->Add to Shortlist

			$(fnToolbarMenuNth(3)).hide();															// Actions
		}

		if(options.ContactMatched)			// TriSysExtension.ToolbarMenuVisibility({ContactMatched: true})
		{
			// Ensure that items are visible if contact exists
			$(fnToolbarMenuNth(1)).show();															// File

			$(fnToolbarMenuNth(2)).hide();															// Add
			//$(fnToolbarMenuNth(2) + " > ul > li:nth-child(1)").hide();							// Add->Add New Contact
			//$(fnToolbarMenuNth(2) + " > ul > li:nth-child(2)").hide();							// Add->Assign to Existing Contact
			//$(fnToolbarMenuNth(2) + " > ul > li:nth-child(3)").hide();							// Add->Separator
			//$(fnToolbarMenuNth(2) + " > ul > li:nth-child(4)").show();							// Add->Add Note
			//$(fnToolbarMenuNth(2) + " > ul > li:nth-child(5)").show();							// Add->Scheduled Task
			//$(fnToolbarMenuNth(2) + " > ul > li:nth-child(6)").show();							// Add->Add to Shortlist

			$(fnToolbarMenuNth(3)).show();															// Actions
		}

		if(options.HideAll)
		{
			for(var i = 1; i <= 4; i++)
				$(fnToolbarMenuNth(i)).hide();	
		}
	},

	LoadStyles: function()
	{
		// Style kendoUI widgets to fit our brand
	    var sKendoUIHTML = '.k-flatcolorpicker.k-group, .k-group, .k-menu, .k-menu .k-group, .k-popup.k-widget.k-context-menu {' +
			'    color: #ffffff;' +
			'    background-color: #4c5572;' +
			'}' +
			'' +
			'.k-menu .k-item, .k-menu-scroll-wrapper .k-item, .k-menu-scroll-wrapper.horizontal > .k-item, .k-popups-wrapper .k-item, .k-popups-wrapper.horizontal > .k-item, .k-widget.k-menu-horizontal > .k-item {' +
			'    padding-right: 4px;' +
			'    margin-right: 4px;' +
			'    border-radius: 4px;' +
			'}' +
			'' +
			'.k-menu .k-item > .k-link, .k-menu-scroll-wrapper .k-item > .k-link, .k-popups-wrapper .k-item > .k-link {' +
			'    padding: 4px;' +
			'}' +
			'' +
			'.k-flatcolorpicker.k-group, .k-group, .k-menu, .k-menu .k-group, .k-popup.k-widget.k-context-menu {' +
			'    color: #ffffff;' +
			'    background-color: #4c5572;' +
			'}' +
			'' +
			'.k-split-button.k-state-border-down > .k-button, .k-split-button.k-state-border-up > .k-button {' +
			'    color: #ffffff;' +
			'    background-color: #4c5572;' +
			'    border-color: #4c5572;' +
			'}' +
			'' +
			'.k-menu .k-state-active, .k-popup.k-context-menu.k-group .k-state-hover {' +
			'	background-color: #4c5572;' +
			'}' +
			'' +
			'.k-sprite {' +
			'	text-indent: 0;' +
			'	font-size: 1em;' +
			'}' +
			'' +
			'.k-menu .k-animation-container .k-menu-group {' +
			'	padding: 4px;' +
			'}' +
			'' +
			'.k-context-menu.k-menu-vertical > .k-item > .k-link, .k-menu .k-menu-group .k-item > .k-link {' +
			'	padding: 0.5em 1em 0.5em 0.5em;' +
			'}' +
			'.k-panel > .k-item > .k-link, .k-panelbar > .k-item > .k-link {' +
			'	line-height: 3.0em;' +
			'}' +
			'.k-panelbar .k-group .k-item>.k-state-selected, .k-panelbar>.k-item>.k-state-selected, .k-state-selected>.k-link {' +
			'	color: #4c5572;' +
			'}' +
			'a.trisys-extension-brand a:hover, a:focus, a:link, a:active, a:visited {' +
            '	color: white;' +
            '	text-decoration: none;' +
			'}' +
			'a.trisys-extension-text a:hover, a:focus, a:link, a:active, a:visited {' +
            '	color: #4c5572;' +
            '	text-decoration: none;' +
			'}' +
			'.switch-primary input:checked + span {' +
			'	background-color: #4c5572;' +
			'}' +
		    '.k-menu.k-menu-horizontal:not(.k-context-menu) { padding: 0px; }' +
            '.k-menu:not(.k-context-menu) { border-color: transparent; color: white; background-color: transparent; }' +
            '.k-menu-link { color: white; font-size: 12px; }' +
            '.k-menu-group .k-menu-item { font-size: 12px; }' +
            '.k-menu:not(.k-context-menu) > .k-item > .k-state-active { color: white; }' +
            '.k-menu:not(.k-context-menu) > .k-item:hover, .k-menu:not(.k-context-menu) > .k-item.k-state-hover { color: white; }' +
            '.k-context-menu.k-menu-vertical > .k-item > .k-link, .k-menu .k-menu-group .k-item > .k-link { padding: 4px; }' +
            '.k-menu-group .k-separator { border-color: #a3acc3; margin-top: 0px; margin-bottom: 6px; }' +
            '.k-panel > .k-item > .k-link, .k-panelbar > .k-item > .k-link { line-height: 1.0em; padding-left: 8px; height: 37px; }' +
            '.k-panelbar > .k-item > .k-link.k-state-selected { border-color: #264FA2; color: #fff; background-color: #264FA2; }' +
            '.k-panelbar > .k-item > .k-link { font-size: 14px;  }' +
            '.k-panelbar > .k-item > .k-link.k-state-focused.k-state-selected { box-shadow: inset 0 0 0 1px #264FA2; }' +
            '.ui-widget-header { background-color: #264FA2; border-color: #264FA2; }' +
            '.k-textbox { height: 24px; padding-left: 4px; }' +
            '.k-dropdown .k-dropdown-wrap .k-input, .k-dropdowntree .k-dropdown-wrap .k-input { padding: 0 .75rem; font-size: 12px; height: 24px; }' +
            '.k-dropdown .k-dropdown-wrap, .k-dropdowntree .k-dropdown-wrap { height: 24px; }' +
            '';

		$('head').append('<style type="text/css" id="trisys-menu-k-styles">'
                                + sKendoUIHTML +
                                + '</style>');	
	},

	LoadAdvertising: function()
	{
		if(TriSysExtension.isOfficeAddInWebServerComponent())
			return;

		var sLinkedInShare = '<script type="IN/Share" data-url="https://www.trisys.co.uk"></script>';
		var sLinkedInFollow = '<script type="IN/FollowCompany" data-id="688057" data-counter="right"></script>';
		
		var linkedInShare = { HTML: sLinkedInShare, script: "https://platform.linkedin.com/in.js", paddingTop: '6px'};
		var linkedInFollow = { HTML: sLinkedInFollow, script: "https://platform.linkedin.com/in.js"};

		// Other adverts...
		// var sImg1 = '<img src="' + TriSysExtension.SpinnerImageFromIndexedList(0) + '" height="24" width="24" />';
		// var img1 = { HTML: sImg1 };
		// var sImg2 = '<img src="' + TriSysExtension.SpinnerImageFromIndexedList(1) + '" height="24" width="24" />';
		// var img2 = { HTML: sImg2 };

		// 10 types of adverts
		var iIndex = Math.floor((Math.random() * 10) + 1) - 1;		// 0 to 9

		var lstAdverts = [
				linkedInShare, null, null, null, linkedInShare,
				linkedInFollow, null, linkedInFollow, null, linkedInFollow
			];

		// Test
		//lstAdverts = [img1, img2, img1, img2, img1, img2, img1, img2, img1, img2];
		
		var advert = lstAdverts[iIndex];
		if(advert)
		{
			var fnLoadAdvert = function()
			{
				var advertElement = $('#trisys-extension-popup-toolbar-advertising');
				if(advert.paddingTop)
					advertElement.css('padding-top', advert.paddingTop);
				advertElement.html(advert.HTML);		
			};

			if(advert.script)
			{
				var scripts = [advert.script];
				LazyLoad.js(scripts, function ()
				{
					fnLoadAdvert();	
				});
			}
			else 
				fnLoadAdvert();				
		}
	},

	// Can only be called AFTER the popup is displayed
	LoadContactTypeWidgets: function(sContactType)
	{
		TriSysSDK.CShowForm.entityTypeCombo('Contact', 'extension-apply-changes-source-contact-type', sContactType);
	},

	// I wonder what this does?
	HideLaunchSpinnerAndShowPublicProfile: function(bShowSpinner)
	{
		var spinner = $('#trisys-extension-popup-spinner');
		bShowSpinner ? spinner.show() : spinner.hide();
        var parsedHeaderRow = $('#trisys-extension-parsed-header');
		var parsedPanel = $('#trisys-extension-parsed-panel');
		var informationRow = $('#trisys-extension-popup-information');
		informationRow.hide();
		bShowSpinner ? parsedHeaderRow.hide() : parsedHeaderRow.show();
		var duplicatesRow = $('#trisys-extension-popup-duplicate-contacts');
		duplicatesRow.hide();

		bShowSpinner ? parsedPanel.hide() : parsedPanel.show();

		if(bShowSpinner)
		{
			TriSysExtension.ToolbarMenuVisibility({HideAll: true});
			var panelPopupHeader = $('#trisys-extension-popup-header');
			panelPopupHeader.hide();
			var panelAccordionGroupPanel = $('#trisys-extension-accordion-panel');
			panelAccordionGroupPanel.hide();
		}
	},

    // August 2019: It is the Platformix framework, not Apex
    // December 2020: Let's be sure
	FrameworkLoaded: function(personalDetails, spinnerImage, fnOnConnectionCallback)
	{
		var sAppName = "TriSys Add-In";
		TriSysWebJobs.Constants.ApplicationName = sAppName;
		Platformix.Copyright.ShortProductName = sAppName;
		if(spinnerImage)
			TriSysApex.UI.WaitImageURL = spinnerImage;

		// Show after loading the framework?
		if(!fnOnConnectionCallback)
			TriSysExtension.HideLaunchSpinnerAndShowPublicProfile();

		TriSysExtension.LoadToolbarMenu();
		TriSysExtension.LoadAccordion();
		TriSysExtension.LoadStyles();	
		TriSysExtension.LoadAdvertising();

        // July 2019: Extension v2         END               

		var options = {
			
			// Messages are never received from the browser extension, but they may be sent to and from TriSys				
			AfterConnectionCallback: function()
			{
				TriSysExtension.InitialiseTriSysOnlyMessageCommunicationChannels();
				if(fnOnConnectionCallback)
					fnOnConnectionCallback();
			}
		};
		if(!personalDetails)
			options.OfficeAddIn = true;

        TriSysExtension.ShowProfileAfterCheckingConnectionStatus(personalDetails, options); 
    },

	// Self-explanatory
	_PersonalDetailsCopyForRefreshAfterCreateContact: null,
	_OfficeAddInCallbackFunctionForAfterWeLogin: null,

	ShowProfileAfterCheckingConnectionStatus: function(personalDetails, options)
	{
		TriSysExtension._PersonalDetailsCopyForRefreshAfterCreateContact = personalDetails;

		// Clear data from last visit or if we are refreshing
		TriSysExtension.Cache.SetContactDetails({ Contact: { ContactId: 0} });
		TriSysExtension.Cache.SetSecondaryContactDetails({});


		// The popup window may load after the top region, so load the current contact when we open
        var fnIfConnected = function ()
        {
			// Aug 2019: Read TriSys for matching contact now
			if(personalDetails)
			{
				//personalDetails.Profile = "www.linkedin.com/in/sdonley";	// Test

				var sContactType = TriSysSDK.CShowForm.GetTextFromCombo('extension-apply-changes-source-contact-type');

				// Noticed during testing that the WorkTelNo may have Ring Central residue
			    // e.g. <rc-c2d-number data-rc-number="0844 272 8990">0844 272 8990</rc-c2d-number>
                // 03 Nov 2020: This code is utter shit - wipes existing values!!!
				//if(personalDetails.WorkTelNo)
				//	personalDetails.WorkTelNo = $(personalDetails.WorkTelNo).text();
				//if(personalDetails.MobileTelNo)
				//	personalDetails.MobileTelNo = $(personalDetails.MobileTelNo).text();
				//if(personalDetails.HomeTelNo)
				//	personalDetails.HomeTelNo = $(personalDetails.HomeTelNo).text();

				var bGMail = false;
				if (personalDetails && personalDetails.Mode)
				    bGMail = personalDetails.Mode.GMail || personalDetails.Mode.Outlook;

				// See Web API: CSocialNetworkProfileCreateContactRequest
				var contactDetails = {
					URL: personalDetails.Profile,
					FullName: personalDetails.FullName,
					JobTitle: personalDetails.JobTitle,
					Company: personalDetails.CompanyName,
					Photo: personalDetails.ContactPhoto,				// Ambiguity
					ContactPhoto: personalDetails.ContactPhoto,			// Ambiguity
					LinkedInProfile: personalDetails.Profile,
					CompanyLogo: personalDetails.CompanyLogo,
					Twitter: personalDetails.Twitter,
					WebSite: personalDetails.WebSite,
					WorkTelNo: personalDetails.WorkTelNo,
					MobileTelNo: personalDetails.MobileTelNo,
					HomeTelNo: personalDetails.HomeTelNo,
					Address: personalDetails.Address,
					Location: personalDetails.Location,
					WorkEMail: personalDetails.WorkEMail,
					ContactType: sContactType							// To be resolved
				};

				if(bGMail)
				{
					contactDetails.GMail = { 
						EMail: personalDetails.SenderEMail,
						FullName: personalDetails.SenderName,
						Photo: personalDetails.SenderPhoto,
						Attachments: personalDetails.Attachments
					};
				}

				// Aug 2019: Set cache so that we can save/assign this contact record
				TriSysExtension.Cache.SetContactDetails(contactDetails);

				var bOutlook = false;
				if (personalDetails.Mode)
				    bOutlook = personalDetails.Mode.Outlook;

				TriSysExtension.CallTriSysWebAPIToReadContactPrimaryDetails(contactDetails, bOutlook);
			}
			else
			{
				// Did not get a parsed profile from the URL so show the user what to do next
				var parsedHeader = $('#trisys-extension-parsed-header');
				var parsedPanel = $('#trisys-extension-parsed-panel');
				var noProfilePanel = $('#trisys-extension-no-parsed-profile');
				parsedHeader.hide();
				parsedPanel.hide();
				//noProfilePanel.show();
			}

			if(options && options.AfterConnectionCallback)
				options.AfterConnectionCallback();			
        };

        TriSysExtension.CheckConnectionStatus(fnIfConnected); 
	},

    // After loading extension, check that our credentials are valid, and prompt user if not
    CheckConnectionStatus: function(fnCallback)
    {
        console.log("TriSysExtension.CheckConnectionStatus...");

        var bConnected = TriSysExtension.isConnectedAndLoggedInAsASubscriber();
        if(!bConnected)
        {
            var bPreConnectionAttempt = true;
            TriSysExtension.ShowContactProfileWidgets(null);
        }
        else
        {
            console.log("TriSysExtension.isConnectedAndLoggedInAsASubscriber()=true");

            // 03 Dec 2021: Prevent this from raising a run-time error:
            if (fnCallback)
            {
                try {
                    fnCallback();

                } catch (e) {
                    console.log("TriSysExtension.CheckConnectionStatus ERROR");
                    console.log(e)
                }
            }            
        }
    },

    // Called to show the widgets associated with the profile view if we are the popup window.
    ShowContactProfileWidgets: function(sURL)
    {
        var bShow = (sURL ? false : true);
        if(sURL)
            bShow = TriSysExtension.isURLaSupportedSocialNetwork(sURL);

		// Turns out that we get massive number of 'false' URL's in here, so simply test connected status
        var bConnected = TriSysExtension.isConnectedAndLoggedInAsASubscriber();
        bShow = bConnected;

        console.log('We are in popup window and bShow=' + bShow + ", URL=" + sURL);

		var toolbar = $('#trisys-extension-popup-toolbar');
        var toolbarButtons = $('#trisys-extension-popup-toolbar-buttons');
        var parsedHeaderRow = $('#trisys-extension-parsed-header');
		var parsedPanel = $('#trisys-extension-parsed-panel');
        var informationRow = $('#trisys-extension-popup-information');
		var panelPopupHeader = $('#trisys-extension-popup-header');
		var panelAccordionGroupPanel = $('#trisys-extension-accordion-panel');

        if (bShow)
        {
			toolbar.show();
            toolbarButtons.show();
            parsedHeaderRow.hide();				// Hide the linkedin profile
            parsedPanel.hide();					// Hide the linkedin profile
            informationRow.hide();
			panelPopupHeader.show();
			panelAccordionGroupPanel.show();
        }
        else
        {
			toolbar.show();
            toolbarButtons.hide();
            parsedHeaderRow.hide();				// Hide the linkedin profile
            parsedPanel.hide();					// Hide the linkedin profile
            panelPopupHeader.hide();
			panelAccordionGroupPanel.hide();
            informationRow.show();
			var spinner = $('#trisys-extension-popup-spinner');
			spinner.hide();
        }
    },

    // Allow us to send messages to TriSys and receive messages from TriSys
	// We never receive messages from the browser extension, but we do raise events to this,
	// whilst also sending to and receiving from TriSys.
    InitialiseTriSysOnlyMessageCommunicationChannels: function()
    {
        // As we are logged in using the Platformix framework, we can simply let it do 
		// all of the work, and we can then easily send and receive on the established
		// communication channels
		TriSysApex.InterprocessCommunication.InstantiateCommunicationChannels();
    },

    isURLaSupportedSocialNetwork: function(sURL)
    {
        if (sURL.indexOf("linkedin.") >= 0 || sURL.indexOf("google.") >= 0 || TriSysExtension.isOfficeAddInWebServerComponent())
            return true;
        else
            return false;
    },

    isOfficeAddInWebServerComponent: function()
    {
		var sURL = window.location.href;
        if (sURL.indexOf("/office/") >= 0)
            return true;
        else
            return false;
    },

	// August 2019: We use platformix secure storage now!
    isConnectedAndLoggedInAsASubscriber: function()
    {
		//if(TriSysApex.LoginCredentials.Cache.isLoggedInAsUserOrAgencyContact())		
		//{
			var user = TriSysApex.LoginCredentials.Cache.ReadLoggedInUserSubscriber();
			if(user)
				return true;
		//}

		return false;
    },

    
    // Make the Web API call providing we have the parameters etc..
    // This gets the contact primary details quickly for immediate display in summary form.
    CallTriSysWebAPIToReadContactPrimaryDetails: function (contactDetails, multipleCallMode)
    {
		if(TriSysExtension.isOfficeAddInWebServerComponent())
			TriSysExtension.HideLaunchSpinnerAndShowPublicProfile(true);

        // If we are not connected and logged in, then get data
        var bConnected = TriSysExtension.isConnectedAndLoggedInAsASubscriber();

        if (!bConnected)
        {
            // TODO: Warn user
            return;
        }
        
        debugger;

        var fnAsyncCall = function ()
        {
            // Make the asynchronous API call
            var CSocialNetworkProfileReadContactRequest = {
                ProfileID: contactDetails.ProfileID,
                URL: contactDetails.URL,
                ContactId: contactDetails.ContactId,
                GMail: contactDetails.GMail,
                WorkEMail: contactDetails.WorkEMail,        // Added 02 Nov 2020
                MobileTelNo: contactDetails.MobileTelNo     // Added 03 Nov 2020
            };

            var payloadObject = {};

            payloadObject.URL = "SocialNetwork/ReadContact";

            payloadObject.OutboundDataPacket = CSocialNetworkProfileReadContactRequest;

            payloadObject.InboundDataFunction = function (CSocialNetworkProfileReadContactResponse)
            {
				if(TriSysExtension.isOfficeAddInWebServerComponent())
					TriSysExtension.HideLaunchSpinnerAndShowPublicProfile(false);

				if (!CSocialNetworkProfileReadContactResponse)
				    CSocialNetworkProfileReadContactResponse = { Success: false };

                if (CSocialNetworkProfileReadContactResponse)
                {
                    console.log("CSocialNetworkProfileReadContactResponse=" + CSocialNetworkProfileReadContactResponse.Success);

                    if (CSocialNetworkProfileReadContactResponse.Success)
                    {
                        contactDetails.Contact = CSocialNetworkProfileReadContactResponse.Contact;
                        contactDetails.Profiles = CSocialNetworkProfileReadContactResponse.Profiles;
                        contactDetails.LastContactedDate = CSocialNetworkProfileReadContactResponse.LastContactedDate;
                        contactDetails.NextContactDate = CSocialNetworkProfileReadContactResponse.NextContactDate;

                        // Nov 2020: We found a single match on e-mail address or mobile tel no, but not on LinkedIn
                        if (CSocialNetworkProfileReadContactResponse.FoundSingleMatchOnEMailAddress ||
                            CSocialNetworkProfileReadContactResponse.FoundSingleMatchOnMobileTelNo)
                        {
                            // Show user the matching contact
                            TriSysExtension.AssignToExistingContact(contactDetails.Contact.ContactId, contactDetails.Contact.FullName);
                            return;
                        }

						// Aug 2019: Set cache so that we can save this record
						TriSysExtension.Cache.SetContactDetails(contactDetails);

						// Hide some Add-> menu items
						TriSysExtension.ToolbarMenuVisibility({HideAddToAndAssign: true});

						// Show the attachments as a list from where the user can instigate CVAR
						if(contactDetails.GMail)
							TriSysExtension.ShowAttachments(contactDetails.GMail.Attachments, true);
                    }
                    else
                    {
						// August 2019: Simply a placeholder for new contact records
                        contactDetails.Contact = {
							ContactId: 0,
                            FullName: contactDetails.FullName
                        };
                        contactDetails.Profiles = null;

						// Aug 2019: Don't know what I'm fucking doing!
						// Set cache so that we can save this record
						TriSysExtension.Cache.SetContactDetails(contactDetails);

						// August 2019: do not show the accordion, leave LinkedIn visible only
						var toolbarButtons = $('#trisys-extension-popup-toolbar-buttons');	
						var waitingSpinner = $('#looking-up-profile-in-trisys-spinner');
						var noProfileMatch = $('#looking-up-profile-nothing-found');

						toolbarButtons.show();
						waitingSpinner.hide();					

						// Refer to menu and open the Add menu
						noProfileMatch.show();

						TriSysExtension.ToolbarMenuVisibility({NoContactMatch: true});
						TriSysExtension.ToolbarMenuVisibility({OpenAddMenu: true});

						if(multipleCallMode)
						{
							// This is where Outlook will show each selected e-mail so we need to make sure we refresh visibility
							var popupHeader = $('#trisys-extension-popup-header');
							popupHeader.hide();
							var parsedHeader = $('#trisys-extension-parsed-header');
							parsedHeader.show();
							var accordionPanel = $('#trisys-extension-accordion-panel');
							accordionPanel.hide();
							$('#parsed-contact-name').text(contactDetails.GMail.FullName);
							//$('#parsed-contact-jobtitle').text(contactDetails.GMail.EMail);		// Only for visual effect
							//$('#parsed-contact-work-email').text(contactDetails.GMail.EMail);

							// The extension uses the same field names as TriSys Web API
							contactDetails.Mode = { Outlook: true };
							contactDetails.SenderEMail = contactDetails.GMail.EMail;
							contactDetails.SenderName = contactDetails.GMail.FullName;
							contactDetails.WorkEMail = contactDetails.SenderEMail;
							contactDetails.PersonalEMail = contactDetails.SenderEMail;
							TriSysExtension.DisplayContactDetails(contactDetails, 'parsed-', true, { AssignContactDetails: true });

							// Show the attachments as a list from where the user can instigate CVAR
							TriSysExtension.ShowAttachments(contactDetails.GMail.Attachments, false);
						}

						return;
                    }

					
					// Display and cache primary details as found record
                    TriSysExtension.LoadPrimaryContactDetailsInPopupWindow();			

                    if (contactDetails.Contact)
                    {
						// Make sure menu items are available
						TriSysExtension.ToolbarMenuVisibility({ContactMatched: true});

                        // Finally, hit the Web API to get additional details about this contact which will be displayed in the popup window only
						TriSysExtension.CallTriSysWebAPIToReadContactSecondaryDetails(contactDetails);
                    }
                }
            };

            payloadObject.ErrorHandlerFunction = function (request, status, error)
            {
                // Do not treat this like a full error as we are in the extension and the resulting error will simply look crap!
                var sError = 'TriSysExtension.CallTriSysWebAPIToReadContactPrimaryDetails: ' + status + ": " + error + ". responseText: " + request.responseText;
                //TriSysApex.UI.errorAlert(sError);
                TriSysApex.UI.errorAlert(sError);
            };

            TriSysAPI.Data.PostToWebAPI(payloadObject);
        };

        // We must get our own version of the currently logged in Apex credentials.
        // To maintain security, get these from the live app
        //TriSysExtension.CheckConnectionStatus(fnAsyncCall);		// Actually, we must be connected to get this far!
		fnAsyncCall();
    },

	// Pure indulgence! Spinner image for the 'session' is passed in by the extension
	// Actually, the extension does this work for us passing in the image we should use for this session.
	ShowRandomLookingUpImage: function(sId, sImageURL)
	{
		if(!sImageURL)
		{
			var iIndex = Math.floor((Math.random() * 10) + 1) - 1;
			sImageURL = TriSysExtension.SpinnerImageFromIndexedList(iIndex);
		}

		$('#' + sId).attr('src', sImageURL);
	},

	SpinnerImageFromIndexedList: function(iIndex)
	{
		var lstImages = TriSysExtension.SpinnerList;
		var sImage = lstImages[iIndex];
		sImage = 'https://apex.trisys.co.uk/images/trisys/128x128/' + sImage + '.gif';
		return sImage;
	},

	SpinnerList: [ 'Wheel-2.5s-128px', 'Pacman-1s-128px', 'DNA-2s-128px', 'Clock-8s-128px', 'Coffee-2s-128px',
								'Sunny-2s-128px', 'Progress-5s-128px', 'Spinner-1s-128px', 'Double Ring-2s-128px', 'Camera-1s-128px'],

    // Called after the first call returns to get the larger secondary details such as CV preview,
    // requirements, placements, notes and scheduled tasks.
    // This data is used only by the popup window, but by pre-cacheing it, it seems very quick for the
    // user who is typically clicking the toolbar button AFTER the page has loaded.
    CallTriSysWebAPIToReadContactSecondaryDetails: function (contactDetails)
    {
        var CReadContactSummaryForExtensionRequest = {
            ContactId: contactDetails.Contact.ContactId
        };

        var payloadObject = {};

        payloadObject.URL = "Contacts/ReadContactSummaryForExtension";

        payloadObject.OutboundDataPacket = CReadContactSummaryForExtensionRequest;

        payloadObject.InboundDataFunction = function (CReadContactSummaryForExtensionResponse)
        {
            if (CReadContactSummaryForExtensionResponse)
            {
                var contactDetails = {};

                if (CReadContactSummaryForExtensionResponse.Success)
                {
                    contactDetails = CReadContactSummaryForExtensionResponse;
                }

                // Set cache so that popup can use the same data on-load
                TriSysExtension.Cache.SetSecondaryContactDetails(contactDetails);

				// Load the CV preview control
				TriSysSDK.Controls.General.LoadControlFromTemplateIntoDiv(TriSysExtension.CVPreviewID, 'ctrlCVPreview-html', 
					function ()
					{
						TriSysExtension.LoadSecondaryContactDetailsInPopupWindow();
					}
				);
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.errorAlert('TriSysExtension.CallTriSysWebAPIToReadContactSecondaryDetails: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysAPI.Data.PostToWebAPI(payloadObject);        
    },

	// We need control over the scrolling fields
	_iFieldDisplayCount: 0,

	// If we are fired from LinkedIn, then there are lots of details, however from G-Mail
	// we only get the sender address and name.
    DisplayContactDetails: function (contactDetails, sPrefix, bShowTotals, options)
    {
		TriSysExtension._iFieldDisplayCount = 0;		// Reset
		$('#popup-contact-buffer-tr').show();

        if (!contactDetails)
            return;

        var contact = contactDetails.Contact;
        var profiles = contactDetails.Profiles;

        if(!contact || (options && options.AssignContactDetails))
            contact = contactDetails;

		// If Outlook Web, then we are only 320 wide, far too small to show two column fields
		// So make each field label and value a full row
		var iMinimumWidth = 500;
		var bTweakDom = $(window).width() < iMinimumWidth && TriSysExtension.isOfficeAddInWebServerComponent() && !TriSysExtension._TweakedDOMforSmallWidth;
		if(bTweakDom)
		{
			TriSysExtension._TweakedDOMforSmallWidth = true;
			TriSysExtension.TweakDimensionsOfOutlookAddIn();
		}

        if (contact)
        {
			$('#' + sPrefix + 'contact-work-email-tr').show();
			$('#' + sPrefix + 'contact-personal-email-tr').show();

			if(sPrefix == 'parsed-' && (contact.Mode && (contact.Mode.GMail || contact.Mode.Outlook)))
			{
				$('#' + sPrefix + 'public-profile-text').text(contactDetails.Mode.GMail ? "Gmail" : "Outlook" + " Details");
				$('#' + sPrefix + 'public-profile-image').removeClass().addClass(contactDetails.Mode.GMail ? 'fa fa-google' : 'fa fa-windows');
				var trPrefix = 'parsed-contact-';
				var lstHide = ['linkedin', 'website', 'work-telno', 'personal-mobile', 'work-mobile', 
								'location', 'address', 'home-telno', 'twitter', 'skype'];
				lstHide.forEach(function(sId)
				{
					sId = '#' + trPrefix + sId + '-tr';
					$(sId).hide();
				});
				$('#' + sPrefix + 'contact-personal-email').text(contactDetails.SenderEMail);	// We cannot decide which one, so show both
				$('#' + sPrefix + 'contact-work-email').text(contactDetails.SenderEMail);		// ditto
				$('#' + sPrefix + 'contact-work-email-text').text("E-Mail");					// Sender to Recipient?
				$('#' + sPrefix + 'contact-sender-name').html(' <strong>' + contactDetails.SenderName + '</strong>');
				var sSenderPhoto = contactDetails.SenderPhoto;
				if (sSenderPhoto)
					$('#' + sPrefix + 'contact-photo').attr('src', sSenderPhoto);
				return;
			}

            // Write to cache and display
            $('#' + sPrefix + 'contact-name').html(contact.FullName);
            $('#' + sPrefix + 'contact-jobtitle').html(contact.JobTitle);
            $('#' + sPrefix + 'company-name').html(contact.CompanyName);

			if(contact.ContactId > 0)
			{
				var sAdditionalInformation = TriSysSDK.Numbers.Pad(contact.ContactId, 6) + '    :    ' + contact.ContactType;
				$('#popup-contact-details-id').text(sAdditionalInformation);
			}

			$('#' + sPrefix + 'contact-profile-url').html(contact.Profile);

            var sContactPhoto = contact.ContactPhoto;
            if (!sContactPhoto)
			{
				// Hard coded because Apex may not be initialised yet! TriSysApex.Constants.DefaultContactImage;
                sContactPhoto =	"https://apex.trisys.co.uk/images/profile-grey.png";		
			}
            $('#' + sPrefix + 'contact-photo').attr('src', sContactPhoto);

            //TriSysSDK.ContactTypes.SetClass(sPrefix + 'contact-type', contact.ContactType);

			var sFieldRowId = '#' + sPrefix + 'contact-work-email-tr';
            if (contact.WorkEMail)
            {
                $('#' + sPrefix + 'contact-work-email').html(contact.WorkEMail);
                $('#' + sPrefix + 'contact-work-email-hyperlink').attr('href', 'mailto:' + contact.WorkEMail);
				TriSysExtension._iFieldDisplayCount += 1;
				$(sFieldRowId).show();
            }
			else
				$(sFieldRowId).hide();

			sFieldRowId = '#' + sPrefix + 'contact-personal-email-tr';
            if (contact.PersonalEMail)
            {
                $('#' + sPrefix + 'contact-personal-email').html(contact.PersonalEMail);
                $('#' + sPrefix + 'contact-personal-email-hyperlink').attr('href', 'mailto:' + contact.PersonalEMail);
				TriSysExtension._iFieldDisplayCount += 1;
				$(sFieldRowId).show();
            }
			else
				$(sFieldRowId).hide();

			sFieldRowId = '#' + sPrefix + 'contact-website-tr';
			if (contact.WebSite)
            {
                $('#' + sPrefix + 'contact-website').text(contact.WebSite);
                $('#' + sPrefix + 'contact-website-hyperlink').attr('href', contact.WebSite);
				TriSysExtension._iFieldDisplayCount += 1;
				$(sFieldRowId).show();
            }
			else
				$(sFieldRowId).hide();

			sFieldRowId = '#' + sPrefix + 'contact-address-tr';
			if (contact.Address)
            {
                $('#' + sPrefix + 'contact-address').html(contact.Address);
                $('#' + sPrefix + 'contact-address-hyperlink').attr('href', 'https://www.google.com/maps/search/?api=1&query=' + contact.Address);
				TriSysExtension._iFieldDisplayCount += 1;
				$(sFieldRowId).show();
            }
			else
				$(sFieldRowId).hide();

			sFieldRowId = '#' + sPrefix + 'contact-twitter-tr';
			if (contact.Twitter)
            {
                $('#' + sPrefix + 'contact-twitter').html(contact.Twitter);
                $('#' + sPrefix + 'contact-twitter-hyperlink').attr('href', 'https://twitter.com/' + contact.Twitter);
				TriSysExtension._iFieldDisplayCount += 1;
				$(sFieldRowId).show();
            }
			else
				$(sFieldRowId).hide();

			// NOTE: hyperlinked telephone numbers do not work when in an extension!
			sFieldRowId = '#' + sPrefix + 'contact-work-phone-tr';
			if (contact.WorkTelNo)
            {
                $('#' + sPrefix + 'contact-work-telno').html(contact.WorkTelNo);
				TriSysExtension._iFieldDisplayCount += 1;
                //$('#' + sPrefix + 'contact-work-telno-hyperlink').attr('href', 'tel:' + contact.WorkTelNo);
				$(sFieldRowId).show();
            }
			else
				$(sFieldRowId).hide();


			sFieldRowId = '#' + sPrefix + 'contact-personal-mobile-tr';
			if (contact.MobileTelNo)		// Personal
            {
                $('#' + sPrefix + 'contact-personal-mobile-telno').html(contact.MobileTelNo);
				TriSysExtension._iFieldDisplayCount += 1;
				//$('#' + sPrefix + 'contact-mobile-telno-hyperlink').attr('href', 'tel:' + contact.MobileTelNo);
				$(sFieldRowId).show();
            }
			else
				$(sFieldRowId).hide();


			sFieldRowId = '#' + sPrefix + 'contact-work-mobile-tr';
			if (contact.WorkMobileTelNo)	// Work
            {
                $('#' + sPrefix + 'contact-work-mobile-telno').html(contact.WorkMobileTelNo);
				TriSysExtension._iFieldDisplayCount += 1;
				//$('#' + sPrefix + 'contact-mobile-telno-hyperlink').attr('href', 'tel:' + contact.MobileTelNo);
				$(sFieldRowId).show();
            }
			else
				$(sFieldRowId).hide();

			var sHomeTelNo = null;
			if(contact.HomeAddressTelNo)
				sHomeTelNo = contact.HomeAddressTelNo;
			if(contact.HomeTelNo)
				sHomeTelNo = contact.HomeTelNo;
			if(sHomeTelNo)
				$('#' + sPrefix + 'contact-home-telno').html(sHomeTelNo);
			else
				$('#' + sPrefix + 'contact-home-phone-tr').hide();

			var fnAddressSummary = function(sStreet, sCity, sCounty, sPostCode, sCountry)
			{
				if(sStreet)
				{
					sStreet = sStreet.replace(/\n\r/g, ", ");
					sStreet = sStreet.replace(/\n/g, ", ");
					sStreet = sStreet.replace(/\r/g, ", ");
				}

				var sAddressSummary = sStreet;
				sAddressSummary += sAddressSummary && sCity ? ', ' + sCity : ''; 
				sAddressSummary += sAddressSummary && sCounty ? ', ' + sCounty : ''; 
				sAddressSummary += sAddressSummary && sPostCode ? ', ' + sPostCode : ''; 
				sAddressSummary += sAddressSummary && sCountry ? ', ' + sCountry : ''; 

				return sAddressSummary;
			};
            var sAddressSummary = '';
            if (contact.ContactType == 'Candidate')
				sAddressSummary = fnAddressSummary(contact.HomeAddressStreet, contact.HomeAddressCity, contact.HomeAddressCounty, contact.HomeAddressPostCode, contact.HomeAddressCountry);				                
            else if(contact.ContactType)
				sAddressSummary = fnAddressSummary(contact.CompanyAddressStreet, contact.CompanyAddressCity, contact.CompanyAddressCounty, contact.CompanyAddressPostCode, contact.CompanyAddressCountry);				                

			if(contact.Address)
			{
				sAddressSummary = contact.Address;	
				$('#' + sPrefix + 'contact-location-tr').hide();
			}
			else if(contact.Location)
			{
				sAddressSummary = contact.Location;	
				$('#' + sPrefix + 'contact-address-tr').hide();
			}

            $('#' + sPrefix + 'contact-address-summary').html(sAddressSummary);
			if(!sAddressSummary || sAddressSummary.length == 0 || sAddressSummary == 'null')
			{
				$('#' + sPrefix + 'contact-address-tr').hide();
				$('#' + sPrefix + 'contact-location-tr').hide();
			}
			else
			{
				$('#' + sPrefix + 'contact-address-tr').show();
				$('#' + sPrefix + 'contact-location-tr').show();
				TriSysExtension._iFieldDisplayCount += 1;
			}

			sFieldRowId = '#' + sPrefix + 'contact-skype-tr';
			if(contact.SkypeNumber)
			{
				$('#' + sPrefix + 'contact-skype').text(contact.SkypeNumber);	
				TriSysExtension._iFieldDisplayCount += 1;
				$(sFieldRowId).show();
            }
			else
				$(sFieldRowId).hide();

			// Prevent scrollbar caused by this last row which only exists to ensure that small numbers of fields align to top
			sFieldRowId = '#' + sPrefix + 'contact-buffer-tr';
			if(TriSysExtension._iFieldDisplayCount > 8)
				$(sFieldRowId).hide();
			else
				$(sFieldRowId).show();

			if(contactDetails.LastContactedDate)
			{
				var dtNow = new Date();
				var sLastContacted = (new Date(contactDetails.LastContactedDate) < dtNow ? moment(contactDetails.LastContactedDate).format('dddd DD MMMM YYYY') : '');
				if (sLastContacted.indexOf('0001') > 0)
					sLastContacted = '';
				var sNextContact = (new Date(contactDetails.NextContactDate) > dtNow ? moment(contactDetails.NextContactDate).format('dddd DD MMMM YYYY') : '');
				$('#contact-last-contacted-date').html(sLastContacted);
				$('#contact-next-contact-date').html(sNextContact);
			}


			// SOCIAL NETWORKS
			$('#' + sPrefix + 'contact-linkedin-profile-hyperlink').hide();
			$('#' + sPrefix + 'contact-facebook-hyperlink').hide();
			$('#' + sPrefix + 'contact-twitter-hyperlink').hide();

            if (profiles)
            {
                var SocialNetworkProfileEnum_LinkedIn = 1;
                var SocialNetworkProfileEnum_Facebook = 2;
                var SocialNetworkProfileEnum_Twitter = 3;

                for (var i = 0; i < profiles.length; i++)
                {
                    var socialProfile = profiles[i];
                    var sURL = socialProfile.URL;
                    var sURL_Hyperlink = socialProfile.URL;
                    if (sURL)
                    {
                        sURL = sURL.replace('https://', '');
                        sURL = sURL.replace('http://', '');

                        if (sURL_Hyperlink.indexOf('http') < 0)
                            sURL_Hyperlink = 'http://' + sURL_Hyperlink;
                    }

                    switch(socialProfile.ProfileNumber)
                    {
                        case SocialNetworkProfileEnum_LinkedIn:
                            $('#' + sPrefix + 'contact-linkedin-profile-url').html(sURL);
                            $('#' + sPrefix + 'contact-linkedin-profile-hyperlink').attr('href', sURL_Hyperlink);
							if(sURL_Hyperlink)
								$('#' + sPrefix + 'contact-linkedin-profile-hyperlink').show();
                            break;
                        case SocialNetworkProfileEnum_Facebook:
                            $('#' + sPrefix + 'contact-facebook-url').html(sURL);
                            $('#' + sPrefix + 'contact-facebook-hyperlink').attr('href', sURL_Hyperlink);
							if(sURL_Hyperlink)
								$('#' + sPrefix + 'contact-facebook-hyperlink').show();
                            break;
                        case SocialNetworkProfileEnum_Twitter:
                            $('#' + sPrefix + 'contact-twitter-handle').html(sURL);
                            $('#' + sPrefix + 'contact-twitter-hyperlink').attr('href', sURL_Hyperlink);
							if(sURL_Hyperlink)
								$('#' + sPrefix + 'contact-twitter-hyperlink').show();
                            break;
                    }
                }
            }

			if(bShowTotals)
			{
				// Counters
				var lstCounters = [
					{ id: 'requirements-id', number: contact.RequirementCount },
					{ id: 'placements-id', number: contact.PlacementCount },
					{ id: 'notes-history-id', number: contact.NoteHistoryCount },
					{ id: 'scheduled-tasks-id', number: contact.ScheduledTaskCount }
				];
				lstCounters.forEach(function(counter)
				{
					var elem = $('#popup-' + counter.id);
					if(counter.number > 0)
					{
						elem.text(TriSysSDK.Numbers.ThousandsSeparator(counter.number));
						elem.show();
					}
					else
						elem.hide();
				});
			}
        }
    },

    DisplaySecondaryContactDetails: function(contactDetails)
    {
        ctrlCVPreview.Open(contactDetails.CVurl);
        ctrlCVPreview.Zoom(0.75, 800);

        TriSysExtension.DisplayRequirements(contactDetails.Requirements);
        TriSysExtension.DisplayPlacements(contactDetails.Placements);
        TriSysExtension.DisplayTasks(contactDetails.NotesHistory, contactDetails.TotalNotesHistoryRecords, 'trisys-noteshistory-tbody', 'trisys-noteshistory-more');
        TriSysExtension.DisplayTasks(contactDetails.ScheduledTasks, contactDetails.TotalScheduledTaskRecords, 'trisys-scheduledtasks-tbody', 'trisys-scheduledtasks-more');

		if(contactDetails.Website)
		{
			$('#popup-contact-website').text(contactDetails.Website);	
            $('#popup-contact-website-hyperlink').attr('href', contactDetails.Website);
			$('#popup-contact-website-tr').show();
			TriSysExtension._iFieldDisplayCount += 1;

			// Prevent scrollbar caused by this last row which only exists to ensure that small numbers of fields align to top
			if(TriSysExtension._iFieldDisplayCount > 8)
				$('#popup-contact-buffer-tr').hide();
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
                    return "TriSysExtension.OpenRequirementForm(" + this.RequirementId + ")";
                }
            }
        };

        tbody.render(requirementsData, directives);
        tbody.show();

		// Append a blank row for alignment purposes
		$('#accordion-panelbar-requirements-table tr:last').after('<tr><td colspan="2"></td></tr>');
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
                    return "TriSysExtension.OpenPlacementForm(" + this.PlacementId + ")";
                }
            }
        };

        tbody.render(placementsData, directives);
        tbody.show();

		// Append a blank row for alignment purposes
		$('#accordion-panelbar-placements-table tr:last').after('<tr><td colspan="2"></td></tr>');

    },

    DisplayTasks: function (tasks, iTotalTasks, sTableID, sMoreIDPrefix)
    {
        // Debug
        //$('#trisys-noteshistory').html(JSON.stringify(tasks));

		try
		{
			if (!tasks || tasks.length == 0)
			{
				$('.' + sTableID).hide();
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
						return "TriSysExtension.OpenTaskForm(" + this.TaskId + ")";
					}
				},

				TaskType:
				{
					src: function(params)
					{
						return "https://apex.trisys.co.uk/images/trisys/16x16/tasktype/" + this.TaskType + ".png";
					}
				}
			};

			$('.' + sTableID).render(taskData, directives);
			$('.' + sTableID).show();

			$('.' + sTableID + ' tr:last').after('<tr><td colspan="2"></td></tr>');


			var iTotalRemaining = iTotalTasks - taskData.length;
			var sHyperLink = sMoreIDPrefix + '-hyperlink';
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
		}
		catch(e)
		{
			// WTF?
		}
    },

    OpenContactForm: function()
    {
        // Get the current contact ID
        var contactDetails = TriSysExtension.Cache.GetContactDetails();
        if (contactDetails && contactDetails.Contact)
        {
            if (contactDetails.Contact.ContactId > 0)
            {
                // Display this record in TriSys
                TriSysExtension.OpenContactFormAndFocusOnTab(contactDetails.Contact.ContactId);

				TriSysApex.Toasters.Information('This contact record has been opened in TriSys');

				return;
            }
        }

        TriSysExtension.ShowMessage('Contact does not exist in your CRM database.');
    },

    OpenContactFormAndFocusOnTab: function(lContactId, bPrompt)
    {
        if (lContactId <= 0)
			return;

		var fnOpenContact = function()
        {
            // Display this record in TriSys
            TriSysApex.InterprocessCommunication.ClientOpenForm('Contact', lContactId);

            // And focus on the tab
            TriSysExtension.FocusOnApexBrowserTab();
        };

		// FJ does not users being prompted, so always show the new/updated record
		bPrompt = false;

		// If we are to prompt, question the user, else just load the contact record in TriSys
		if(bPrompt)
		{
			TriSysApex.UI.questionYesNo("Open Contact record in TriSys?", TriSysWebJobs.Constants.ApplicationName, 
						"Yes", function() { fnOpenContact(); return true; },
						"No", function() { return true; });
		}
		else
			fnOpenContact();
    },

    OpenCompanyForm: function ()
    {
        // Get the current company ID
        var contactDetails = TriSysExtension.Cache.GetContactDetails();
        if (contactDetails && contactDetails.Contact)
        {
            if (contactDetails.Contact.CompanyId > 0)
            {
                // Display this record in TriSys
                TriSysApex.InterprocessCommunication.ClientOpenForm('Company', contactDetails.Contact.CompanyId);

                // And focus on the tab
                TriSysExtension.FocusOnApexBrowserTab();

				TriSysApex.Toasters.Information('This company record has been opened in TriSys');

				return;
            }
        }
         
		TriSysExtension.ShowMessage('Company does not exist in your CRM database.');
    },

	// User wishes to apply the underlying profile to the linked contact
	// i.e. change the photo, name, job title, company, phone etc..
	// Was going to have a simple question yes/no, however for sure users will want
	// some fields copied but not others, hence the more elaborate field picker.
	//
	// 21 Aug 2019: Make this the default confirmation popup for adding new contact and assigning to contact.
	// Then make the source fields editable allowing even greater control over what is written to TriSys
	//
	ApplyChanges: function(options)
	{
		var sTitle = options.title;

		// Read all parsed fields
		var sPrefix = 'parsed-contact-';
		var sLinkedInProfile = $('#' + sPrefix + 'profile-url').text();
		var sPhoto = $('#' + sPrefix + 'photo').attr('src');
		var sFullName = $('#' + sPrefix + 'name').text();
		var sJobTitle = $('#' + sPrefix + 'jobtitle').text();
		var sCompanyName = $('#parsed-company-name').text();

		var sWorkEMail = $('#popup-contact-work-email').text();                         // 15 Oct 2020 - was $('#' + sPrefix + 'work-email').text();
		if (!sWorkEMail)
		    sWorkEMail = $('#' + sPrefix + 'work-email').text();                        // 02 Nov 2020

		var sPersonalEMail = $('#popup-contact-personal-email').text();                 // 15 Oct 2020 - was $('#' + sPrefix + 'personal-email').text();
		if (!sPersonalEMail)
		    sPersonalEMail = $('#' + sPrefix + 'personal-email').text();                // 02 Nov 2020

		var sWebSite = $('#' + sPrefix + 'website').text();
		var sAddress = $('#' + sPrefix + 'address-summary').text();
		var sTwitter = $('#' + sPrefix + 'twitter').text();
		var sSkype = $('#' + sPrefix + 'skype').text();
		var sWorkPhone = $('#' + sPrefix + 'work-telno').text();
		debugger;
		var sPersonalMobile = $('#popup-contact-personal-mobile-telno').text();         // 15 Oct 2020 - was $('#' + sPrefix + 'personal-mobile-telno').text();
		if (!sPersonalMobile)
		    sPersonalMobile = $('#' + sPrefix + 'personal-mobile-telno').text();        // 02 Nov 2020

		var sWorkMobile = $('#' + sPrefix + 'work-mobile-telno').text();
		var sHomePhone = $('#' + sPrefix + 'home-telno').text();

        // Either default contact type of same as current
		var sContactType = TriSysExtension.Cache.GetDefaultContactType();
		var sExistingContactType = $('#extension-apply-changes-trisys-contact-type').text();
		if (sExistingContactType)
		    sContactType = sExistingContactType.trim();

		var sMessage = $('#extension-apply-changes-template').html();
		var sFieldPrefix = 'extension-apply-changes-';
		var sCopyPrefix = 'extension-apply-changes-copy-';
		var fnField = function(sName) { return "{{" + sName + "}}"; };
		var fnTriSysFieldValue = function(sValue) { return sValue ? sValue : ''; };
		var primaryContactDetails = TriSysExtension.Cache.GetContactDetails();
		var lstHideRows = [], lstShowRows = [], lstSetCopyCheckBox = [];

		var bGMail = primaryContactDetails.GMail;
		if(bGMail && !primaryContactDetails.GMail.EMail)
			bGMail = false;
		
		if(bGMail)
		{
			sFullName = primaryContactDetails.GMail.FullName;
			lstHideRows.push('#extension-apply-changes-source-linkedin');
	
			if(TriSysExtension.isOfficeAddInWebServerComponent())
				lstShowRows.push('#extension-apply-changes-source-outlook');
			else
				lstShowRows.push('#extension-apply-changes-source-gmail');
		}
		else
		{
			// This overrides a bug, but we will deal with it in Outlook land
			if(TriSysExtension.isOfficeAddInWebServerComponent())
			{
				lstHideRows.push('#extension-apply-changes-source-linkedin');
				lstShowRows.push('#extension-apply-changes-source-outlook');
			}
		}

		if(!bGMail)
		{
			sMessage = sMessage.replace(new RegExp(fnField(sFieldPrefix + 'source-public-profile-url'), "g"), sLinkedInProfile);
			sMessage = sMessage.replace(new RegExp(fnField(sFieldPrefix + 'trisys-public-profile-url'), "g"), fnTriSysFieldValue(primaryContactDetails.Contact.LinkedIn));
			lstSetCopyCheckBox.push({ checkBoxId: sCopyPrefix + 'public-profile-url', sourceValue: sLinkedInProfile, trisysField: 'URL' });
		}
		else
			lstHideRows.push('#' + sFieldPrefix + 'profile-url-row');

		if(sFullName || bGMail)
		{
			sMessage = sMessage.replace(new RegExp(fnField(sFieldPrefix + 'source-full-name'), "g"), sFullName);
			var sTriSysFullName = options.newContact ? '' : primaryContactDetails.Contact.FullName;
			sMessage = sMessage.replace(new RegExp(fnField(sFieldPrefix + 'trisys-full-name'), "g"), fnTriSysFieldValue(sTriSysFullName));
			lstSetCopyCheckBox.push({ checkBoxId: sCopyPrefix + 'full-name', sourceValue: sFullName, trisysField: 'FullName' });
		}
		else
			lstHideRows.push('#' + sFieldPrefix + 'full-name-row');

		if(sPhoto)
		{
			sMessage = sMessage.replace(new RegExp(fnField(sFieldPrefix + 'source-photo'), "g"), sPhoto);
			var sTriSysPhoto = primaryContactDetails.Contact.ContactPhoto ? primaryContactDetails.Contact.ContactPhoto : "https://apex.trisys.co.uk/images/profile-grey.png";
			sMessage = sMessage.replace(new RegExp(fnField(sFieldPrefix + 'trisys-photo'), "g"), sTriSysPhoto);			
			lstSetCopyCheckBox.push({ checkBoxId: sCopyPrefix + 'photo', sourceValue: sPhoto, trisysField: 'Photo' });
		}
		else
			lstHideRows.push('#' + sFieldPrefix + 'photo-row');


		if(sContactType)
		{
			sMessage = sMessage.replace(new RegExp(fnField(sFieldPrefix + 'source-contact-type'), "g"), sContactType);
			sMessage = sMessage.replace(new RegExp(fnField(sFieldPrefix + 'trisys-contact-type'), "g"), fnTriSysFieldValue(primaryContactDetails.Contact.ContactType));
			lstSetCopyCheckBox.push({ checkBoxId: sCopyPrefix + 'contact-type', sourceValue: sContactType, trisysField: 'ContactType' });
		}

		if(sJobTitle)
		{
			sMessage = sMessage.replace(new RegExp(fnField(sFieldPrefix + 'source-job-title'), "g"), sJobTitle);
			sMessage = sMessage.replace(new RegExp(fnField(sFieldPrefix + 'trisys-job-title'), "g"), fnTriSysFieldValue(primaryContactDetails.Contact.JobTitle));
			lstSetCopyCheckBox.push({ checkBoxId: sCopyPrefix + 'job-title', sourceValue: sJobTitle, trisysField: 'JobTitle' });
		}
		else
			lstHideRows.push('#' + sFieldPrefix + 'job-title-row');

		if(sCompanyName)
		{
			sMessage = sMessage.replace(new RegExp(fnField(sFieldPrefix + 'source-company-name'), "g"), sCompanyName);
			sMessage = sMessage.replace(new RegExp(fnField(sFieldPrefix + 'trisys-company-name'), "g"), fnTriSysFieldValue(primaryContactDetails.Contact.CompanyName));
			lstSetCopyCheckBox.push({ checkBoxId: sCopyPrefix + 'company-name', sourceValue: sCompanyName, trisysField: 'Company' });
		}
		else
			lstHideRows.push('#' + sFieldPrefix + 'company-name-row');

		if(sWorkEMail)
		{
			sMessage = sMessage.replace(new RegExp(fnField(sFieldPrefix + 'source-work-email'), "g"), sWorkEMail);
			sMessage = sMessage.replace(new RegExp(fnField(sFieldPrefix + 'trisys-work-email'), "g"), fnTriSysFieldValue(primaryContactDetails.Contact.WorkEMail));
			lstSetCopyCheckBox.push({ checkBoxId: sCopyPrefix + 'work-email', sourceValue: sWorkEMail, trisysField: 'WorkEMail' });
		}
		else
			lstHideRows.push('#' + sFieldPrefix + 'work-email-row');

		if(sWorkPhone)
		{
			sMessage = sMessage.replace(new RegExp(fnField(sFieldPrefix + 'source-work-phone'), "g"), sWorkPhone);
			sMessage = sMessage.replace(new RegExp(fnField(sFieldPrefix + 'trisys-work-phone'), "g"), fnTriSysFieldValue(primaryContactDetails.Contact.WorkTelNo));
			lstSetCopyCheckBox.push({ checkBoxId: sCopyPrefix + 'work-phone', sourceValue: sWorkPhone, trisysField: 'WorkTelNo' });
		}
		else
			lstHideRows.push('#' + sFieldPrefix + 'work-phone-row');

		if(sWorkMobile)
		{
			sMessage = sMessage.replace(new RegExp(fnField(sFieldPrefix + 'source-work-mobile'), "g"), sWorkMobile);
			sMessage = sMessage.replace(new RegExp(fnField(sFieldPrefix + 'trisys-work-mobile'), "g"), fnTriSysFieldValue(primaryContactDetails.Contact.WorkMobileTelNo));
			lstSetCopyCheckBox.push({ checkBoxId: sCopyPrefix + 'work-mobile', sourceValue: sCompanyName, trisysField: 'WorkMobileTelNo' });
			lstSetCopyCheckBox.push(sCopyPrefix + 'work-mobile');
		}
		else
			lstHideRows.push('#' + sFieldPrefix + 'work-mobile-row');

		if(sPersonalEMail)
		{
			sMessage = sMessage.replace(new RegExp(fnField(sFieldPrefix + 'source-personal-email'), "g"), sPersonalEMail);
			sMessage = sMessage.replace(new RegExp(fnField(sFieldPrefix + 'trisys-personal-email'), "g"), fnTriSysFieldValue(primaryContactDetails.Contact.PersonalEMail));
			lstSetCopyCheckBox.push({ checkBoxId: sCopyPrefix + 'personal-email', sourceValue: sPersonalEMail, trisysField: 'PersonalEMail' });
		}
		else
			lstHideRows.push('#' + sFieldPrefix + 'personal-email-row');

		if(sPersonalMobile)
		{
			sMessage = sMessage.replace(new RegExp(fnField(sFieldPrefix + 'source-personal-mobile'), "g"), sPersonalMobile);
			sMessage = sMessage.replace(new RegExp(fnField(sFieldPrefix + 'trisys-personal-mobile'), "g"), fnTriSysFieldValue(primaryContactDetails.Contact.MobileTelNo));
			lstSetCopyCheckBox.push({ checkBoxId: sCopyPrefix + 'personal-mobile', sourceValue: sPersonalMobile, trisysField: 'MobileTelNo' });
		}
		else
			lstHideRows.push('#' + sFieldPrefix + 'personal-mobile-row');

		if(sHomePhone)
		{
			sMessage = sMessage.replace(new RegExp(fnField(sFieldPrefix + 'source-home-phone'), "g"), sHomePhone);
			sMessage = sMessage.replace(new RegExp(fnField(sFieldPrefix + 'trisys-home-phone'), "g"), fnTriSysFieldValue(primaryContactDetails.Contact.HomeAddressTelNo));
			lstSetCopyCheckBox.push({ checkBoxId: sCopyPrefix + 'home-phone', sourceValue: sHomePhone, trisysField: 'HomeTelNo' });
		}
		else
			lstHideRows.push('#' + sFieldPrefix + 'home-phone-row');

		if(sAddress)
		{
			var fnLocation = function(sStreet, sCity, sCounty, sPostCode, sCountry)
			{
				var s = sStreet ? sStreet : '';
				s += s.length > 0 && sCity ? ', ' + sCity : ''; 
				s += s.length > 0 && sCounty ? ', ' + sCounty : '';
				s += s.length > 0 && sPostCode ? ', ' + sPostCode : '';
				s += s.length > 0 && sCountry ? ', ' + sCountry : '';
				return s;				
			};
			var sLocation = fnLocation(primaryContactDetails.Contact.CompanyAddressStreet, primaryContactDetails.Contact.CompanyAddressCity, 
										primaryContactDetails.Contact.CompanyAddressCounty, primaryContactDetails.Contact.CompanyAddressPostCode, 
										primaryContactDetails.Contact.CompanyAddressCountry);
			if(primaryContactDetails.Contact.ContactType == "Candidate")
			{
				sLocation = fnLocation(primaryContactDetails.Contact.HomeAddressStreet, primaryContactDetails.Contact.HomeAddressCity, 
										primaryContactDetails.Contact.HomeAddressCounty, primaryContactDetails.Contact.HomeAddressPostCode, 
										primaryContactDetails.Contact.HomeAddressCountry);
			}

			sMessage = sMessage.replace(new RegExp(fnField(sFieldPrefix + 'source-location'), "g"), fnTriSysFieldValue(sAddress));
			sMessage = sMessage.replace(new RegExp(fnField(sFieldPrefix + 'trisys-location'), "g"), fnTriSysFieldValue(sLocation));
			lstSetCopyCheckBox.push({ checkBoxId: sCopyPrefix + 'location', sourceValue: sAddress, trisysField: 'Location' });
		}
		else
			lstHideRows.push('#' + sFieldPrefix + 'location-row');

		if(sTwitter)
		{
			var sTriSysTwitter = $('#popup-contact-twitter-hyperlink').attr('href');
			sMessage = sMessage.replace(new RegExp(fnField(sFieldPrefix + 'source-twitter'), "g"), sTwitter);
			sMessage = sMessage.replace(new RegExp(fnField(sFieldPrefix + 'trisys-twitter'), "g"), fnTriSysFieldValue(sTriSysTwitter));
			lstSetCopyCheckBox.push({ checkBoxId: sCopyPrefix + 'twitter', sourceValue: sTwitter, trisysField: 'Twitter' });
		}
		else
			lstHideRows.push('#' + sFieldPrefix + 'twitter-row');

		if(sSkype)
		{
			sMessage = sMessage.replace(new RegExp(fnField(sFieldPrefix + 'source-skype'), "g"), sSkype);
			sMessage = sMessage.replace(new RegExp(fnField(sFieldPrefix + 'trisys-skype'), "g"), fnTriSysFieldValue(primaryContactDetails.Contact.SkypeNumber));
			lstSetCopyCheckBox.push({ checkBoxId: sCopyPrefix + 'skype', sourceValue: sSkype, trisysField: 'Skype' });
		}
		else
			lstHideRows.push('#' + sFieldPrefix + 'skype-row');

		if(sWebSite)
		{
			var sTriSysWebsite = $('#popup-contact-website-hyperlink').attr('href');
			sMessage = sMessage.replace(new RegExp(fnField(sFieldPrefix + 'source-website'), "g"), sWebSite);
			sMessage = sMessage.replace(new RegExp(fnField(sFieldPrefix + 'trisys-website'), "g"), fnTriSysFieldValue(sTriSysWebsite));
			lstSetCopyCheckBox.push({ checkBoxId: sCopyPrefix + 'website', sourceValue: sWebSite, trisysField: 'WebSite' });
		}
		else
			lstHideRows.push('#' + sFieldPrefix + 'website-row');



		// Show popup dialogue

		// Before submitting the fields to the server, enumerate through only those selected
		var fnApply = function()
		{
			var copyFields = {};
			var iFieldCount = 0;
			lstSetCopyCheckBox.forEach(function(item)
			{
				var bCopy = TriSysSDK.CShowForm.GetCheckBoxValue(item.checkBoxId);
				if(bCopy)
				{
					iFieldCount += 1;
					var sValue = item.sourceValue;

					// Get from a text box if editable
					var sId = item.checkBoxId.replace('-copy-', '-source-');
					var txt = $('#' + sId);
					if(txt.attr('type') == 'text')
						sValue = txt.val();		
					
					if(sId == "extension-apply-changes-source-contact-type")
					{
						sValue = TriSysSDK.CShowForm.GetTextFromCombo(sId);
						TriSysExtension.Cache.SetDefaultContactType(sValue);
					}

					copyFields[item.trisysField] = sValue;
				}
			});

			if(iFieldCount > 0)
			{
				return TriSysExtension.SubmitApplyChanges(copyFields, options.newContact, options.callback);
			}
			else
				TriSysApex.UI.ShowMessage("Please select at least one field to copy.");			
		};

		var fnCancel = function() {	return true; };


		Platformix.Modals.QuickShow({
			Title: sTitle,
			Buttons: [
				{ Caption: "Update TriSys", Callback: fnApply },
				{ Caption: "Cancel", Callback: fnCancel }
			],
			HTML: sMessage,
			Width: 490,
			OpenedCallback: function()
			{
				// Have to be done after the HTML written to the DOM
				lstHideRows.forEach(function(sId)
				{
					$(sId).hide();
				});
				lstShowRows.forEach(function(sId)
				{
					$(sId).show();
				});
				lstSetCopyCheckBox.forEach(function(item)
				{
					TriSysSDK.CShowForm.SetCheckBoxValue(item.checkBoxId, true);
				});
				if(options.disabledElements)
				{
					options.disabledElements.forEach(function(sId)
					{
						$('#' + sId).attr("disabled", "disabled");
					});
				}

				// Load contact type compbo
				TriSysExtension.LoadContactTypeWidgets(sContactType);

				// Set the value of the source to be the same as it was last time
				// TODO!
		
			}
		});		
	},

	// Submit to Web API
	SubmitApplyChanges: function(CSocialNetworkProfileUpdateContactRequest, bNewContact, fnCreateNewContact)
	{
		var lContactId = 0;
		var contactDetails = TriSysExtension.Cache.GetContactDetails();
		if (contactDetails && contactDetails.Contact)
			lContactId = contactDetails.Contact.ContactId;

		if(lContactId <= 0 && !bNewContact)
		{
			// We ought to have hidden this menu item
			TriSysApex.UI.ShowMessage("You must first create a new contact from this profile.");
			return false;
		}

		if(bNewContact)
		{
			// Call the original create new contact
			TriSysApex.UI.ShowWait(null, 'Creating Contact...');
			fnCreateNewContact(CSocialNetworkProfileUpdateContactRequest);
			return true;
		}

		CSocialNetworkProfileUpdateContactRequest.ContactId = lContactId;

		TriSysApex.UI.ShowWait(null, 'Updating Contact...');

        var payloadObject = {};

        payloadObject.URL = "SocialNetwork/UpdateContact";

        payloadObject.OutboundDataPacket = CSocialNetworkProfileUpdateContactRequest;

        payloadObject.InboundDataFunction = function (CSocialNetworkProfileUpdateContactResponse)
        {
			TriSysApex.UI.HideWait();

            if (CSocialNetworkProfileUpdateContactResponse)
            {
                if (CSocialNetworkProfileUpdateContactResponse.Success)
                {
                    // Display this contact record in TriSys
					TriSysExtension.OpenContactFormAndFocusOnTab(lContactId, true);

					TriSysApex.Toasters.Information('Updated Contact Record');

                    // Recommence the lookup by showing the parsed profile
					TriSysExtension.Refresh();

                    return;
                }
            }
            else
                TriSysExtension.ShowMessage("Error");
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
			TriSysApex.UI.HideWait();
            TriSysExtension.ShowMessage('TriSysExtension.SubmitApplyChanges: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysAPI.Data.PostToWebAPI(payloadObject);
		return true;
	},

	Refresh: function(bShowWait)
	{
		// Recommence the lookup by showing the parsed profile
		var fnRefresh = function()
		{
			var personalDetails = null;
			if(TriSysExtension.isOfficeAddInWebServerComponent())
			{
				personalDetails = TriSysExtension._PersonalDetailsCopyForRefreshAfterCreateContact;
			}
			else
			{
				$('#trisys-extension-popup-header').hide();
				personalDetails = TriSysExtension.ParseCommandLineForPersonalDetails();
			}

			//TriSysExtension.FrameworkLoaded(personalDetails);							// Old
			TriSysExtension.ShowProfileAfterCheckingConnectionStatus(personalDetails);	// New
		};

		if(bShowWait)
		{
			var iSeconds = 1;
			TriSysApex.UI.ShowWait(null, 'Refreshing...');
			setTimeout(function () { TriSysApex.UI.HideWait(); }, iSeconds * 1000);
			setTimeout(fnRefresh, 10);
		}
		else 
		{
			fnRefresh();
		}
	},

    OpenRequirementForm: function(lRequirementId)
    {
        if (lRequirementId > 0)
        {
            // Display this record in TriSys
            TriSysApex.InterprocessCommunication.ClientOpenForm('Requirement', lRequirementId);

            // And focus on the tab
            TriSysExtension.FocusOnApexBrowserTab();

			TriSysApex.Toasters.Information('Requirement: ' + lRequirementId + ' has been opened in TriSys');
        }
    },

    OpenPlacementForm: function (lPlacementId)
    {
        if (lPlacementId > 0)
        {
            // Display this record in TriSys
            TriSysApex.InterprocessCommunication.ClientOpenForm('Placement', lPlacementId);

            // And focus on the tab
            TriSysExtension.FocusOnApexBrowserTab();

			TriSysApex.Toasters.Information('Placement: ' + lPlacementId + ' has been opened in TriSys');
        }
    },

    OpenTaskForm: function (lTaskId)
    {
        if (lTaskId > 0)
        {
			var contactDetails = TriSysExtension.Cache.GetContactDetails();
			if (contactDetails && contactDetails.Contact)
			{
				if (contactDetails.Contact.ContactId > 0)
				{                
					// Display this record in Apex
					TriSysApex.InterprocessCommunication.ClientTaskAutomation(lTaskId, contactDetails.Contact, false);

					// And focus on the tab
					TriSysExtension.FocusOnApexBrowserTab();

					TriSysApex.Toasters.Information('Task [' + lTaskId + '] has been opened in TriSys');
				}
			}
        }
    },

    ViewNoteHistoryTasks: function()
    {
        TriSysExtension.ViewTasks(false);
    },

    ViewScheduledTasks: function()
    {
        TriSysExtension.ViewTasks(true);
    },

    ViewTasks: function(bScheduled)
    {
        TriSysExtension.OpenContactForm();
    },

    ClosePopupWindow: function()
    {        
        var extensionObject = { 
			Type: TriSysApex.InterprocessCommunication.MessageType_TriSysToBrowser, 
			Instruction: TriSysApex.InterprocessCommunication.CloseBrowserPopupWindow 
		};

        parent.postMessage(extensionObject, '*');
    },

	// August 2019
	// Login uses platformix. See TriSysWebJobs.CandidateLogin.ShowModal
	Login: function()
	{
		var options = {
			Title: "Login",
			ForgottenPassword: TriSysExtension.ForgottenPassword,
			Register: TriSysExtension.SignUp,
			PostLoginCallback: function()
			{
				var informationRow = $('#trisys-extension-popup-information');
				informationRow.hide();

				// Recommence the lookup by showing the parsed profile
				if(TriSysExtension._OfficeAddInCallbackFunctionForAfterWeLogin)
				{
					TriSysExtension._OfficeAddInCallbackFunctionForAfterWeLogin();
					TriSysExtension._OfficeAddInCallbackFunctionForAfterWeLogin = null;
				}
				else
				{
					TriSysExtension.Refresh(false, true);
				}
			},
			RememberMe: { Visible: false, Default: true },
			SubscriberLogin: true
		};

		TriSysApex.LoginCredentials.Login(options);
	},

	LogOff: function()
	{
		TriSysApex.LoginCredentials.Logoff(function()
		{
			TriSysApex.UI.ShowMessage("You have been logged off.", null, 
				function()
				{
					TriSysExtension.ShowContactProfileWidgets();
					return true;
				}, "OK", true);

		}, false, true);
	},

    RequestPassword: function()
    {
        //TriSysExtension.ShowMessage('Request Password.');
        var sURL = 'https://support.trisys.co.uk/?ForgottenPassword';
        //window.location.href = sURL;
        window.open(sURL, '_blank');
    },

    ContactSupport: function ()
    {
        //TriSysExtension.ShowMessage('Contact Support.');
        var sURL = 'https://support.trisys.co.uk/?SupportServices';
        window.open(sURL, '_blank');
    },

	ForgottenPassword: function()
	{
		var sURL ='https://support.trisys.co.uk/?ForgottenPassword';
		window.open(sURL, '_blank');
    },

    FreeTrial: function ()
    {
        //TriSysExtension.ShowMessage('Free Trial.');
        var sURL = 'https://apex.trisys.co.uk/#freetrial';
        window.open(sURL, '_blank');
    },

	SignUp: function()
	{
		var bOutlookAddIn = TriSysExtension.isOfficeAddInWebServerComponent();
		var sURL = 'https://www.trisys.co.uk/' + (bOutlookAddIn ? 'outlook-add-in' : 'browser-extension');
        window.open(sURL, '_blank');
	},

    AuthenticateAgainstCRM: function (sCompany, sEMail, sPassword, fnCallback)
    {
        // Validate credentials now...
        var CBrowserExtensionCredentialsRequest = {
            CompanyName: sCompany,
            EMail: sEMail,
            Password: sPassword
        };

        var payloadObject = {};

        payloadObject.URL = "Customer/BrowserExtensionCredentials";

        payloadObject.OutboundDataPacket = CBrowserExtensionCredentialsRequest;

        payloadObject.InboundDataFunction = function (CBrowserExtensionCredentialsResponse)
        {
            TriSysExtension.SettingsMessage("");

            if (CBrowserExtensionCredentialsResponse)
            {
                if (CBrowserExtensionCredentialsResponse.Success)
                {
                    TriSysExtension.AuthenticateAgainstWebAPI(CBrowserExtensionCredentialsResponse, sEMail, sPassword, fnCallback);
                }
                else
                {
                    TriSysExtension.SettingsMessage(CBrowserExtensionCredentialsResponse.ErrorMessage);
                }
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            var sError = 'TriSysExtension.AuthenticateAgainstCRM: ' + status + ": " + error + ". responseText: " + request.responseText;
            TriSysExtension.SettingsMessage(sError);
        };

        TriSysExtension.SettingsMessage("Authenticating...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    AuthenticateAgainstWebAPI: function (CBrowserExtensionCredentialsResponse, sEMail, sPassword, fnCallback)
    {
        // Set the API key and URL if necessary
        if (CBrowserExtensionCredentialsResponse.WebAPIEndPoint)
            TriSysAPI.Constants.SecureURL = CBrowserExtensionCredentialsResponse.WebAPIEndPoint;
        if (CBrowserExtensionCredentialsResponse.SiteKey)
            TriSysAPI.Session.SetDeveloperSiteKey(CBrowserExtensionCredentialsResponse.SiteKey);

        // Connect to Web Service to obtain data services key
        var CSecurityControllerAuthenticateTriSysCRMCredentials = {
            FullName: sEMail,
            Password: sPassword
        };

        // Callbacks
        var fnCallbackOnAuth = function (sDataServicesKey)
        {
            fnCallback(CBrowserExtensionCredentialsResponse, sDataServicesKey);
        };

        var fnIncorrectCredentials = function(sMessage)
        {
            TriSysExtension.SettingsMessage(sMessage);
        };

        // Fire out to web API

		TriSysAPI.Authentication.Login(CSecurityControllerAuthenticateTriSysCRMCredentials, 
			function(bAuthenticated, sDataServicesKey)
			{
				if(bAuthenticated)
					fnCallbackOnAuth(sDataServicesKey);
				else
					fnIncorrectCredentials("Incorrect login credentials");
			}
		);

		// Old
        //var bRememberMe = false;
        //var additionalInstructions = {
        //    SuppressPopups: true,
        //    IncorrectCredentialsCallback: fnIncorrectCredentials
        //};
        //TriSysApex.LoginCredentials.ValidateViaWebService(CSecurityControllerAuthenticateTriSysCRMCredentials, bRememberMe, fnCallbackOnAuth, null, additionalInstructions);
    },

    SettingsMessage: function (sMessage)
    {
        $('#trisys-extension-save-settings-error').html(sMessage);
        $('#trisys-extension-save-settings-error-buttons').show();
    },

    AboutPopupWindow: function()
    {
        var fnAsyncCall = function ()
        {
			var loggedInUserSubscriberContact = TriSysApex.LoginCredentials.Cache.ReadLoggedInUserSubscriber();
			var sFullName = '', sCompany = '';
			if(loggedInUserSubscriberContact)
			{
				sFullName = loggedInUserSubscriberContact.FullName;
				sCompany = loggedInUserSubscriberContact.CompanyName;
			}	

            var sMessage = '' +
						'<table style="width: 100%; margin: 0px; font-size: 12px; line-height: 1.75;">' +
						'	<tbody>' +
						'		<tr>' +
						'			<td style="width: 80px;">' +
						'				<strong>Version</strong>' +
						'			</td>' +
						'			<td>' +
										TriSysExtension.Version +
						'			</td>' +
						'		</tr>' +
						'		<tr>' +
						'			<td style="width: 80px;">' +
						'				<strong>Name</strong>' +
						'			</td>' +
						'			<td>' +
										sFullName +
						'			</td>' +
						'		</tr>' +
						'		<tr>' +
						'			<td style="width: 80px;">' +
						'				<strong>Company</strong>' +
						'			</td>' +
						'			<td>' +
										sCompany +
						'			</td>' +
						'		</tr>' +
						'	</tbody>' +
						'</table>';
            TriSysExtension.ShowMessage(sMessage);
        };

        // We must get our own version of the currently logged in Apex credentials.
        // To maintain security, get these from the live app
        //TriSysExtension.CheckConnectionStatus(fnAsyncCall);
        fnAsyncCall();
    },

	Help: function()
	{
	    var bOutlookAddIn = TriSysExtension.isOfficeAddInWebServerComponent();
	    var sURL = bOutlookAddIn ? 'https://www.trisys.co.uk/outlook-add-in' : 'https://www.trisys.co.uk/browser-extension';
        window.open(sURL, '_blank');
	},

    // Our own version of a constrained popup to fit the dimensions of the extension popup
    ShowMessage: function(sMessage)
    {
        // We no longer us ugly alert
        // alert(sMessage);

        // Instead, we use a customised Apex popup
        try
        {
            TriSysApex.UI.ShowMessage(sMessage);

        } catch (e)
        {
            // We get an error condition which should be ignored
        }

        // After load, tweak it
        //TriSysExtension.TweakModalPopup();
    },

    TweakModalPopup: function(iWait, fnExtra)
    {
        var fnTweak = function ()
        {
            $('.modal-content').height(350);
            $('#trisys-modal-dialogue').width(315);
            $('#trisys-modal-dialogue').css("top", "100px");
            $('.modal-content').width(315);
            $('.modal-footer').css("bottom", "295px");
            $('#trisys-modal-dynamic-content').width(315);
            $('#trisys-modal-dynamic-content').css("padding-top", "20px");
            $('#trisys-modal-dynamic-content').css("padding-left", "10px");
            $('#trisys-modal-dynamic-content').css("padding-right", "10px");

            if (fnExtra)
                fnExtra();
        };

        if (!iWait)
            iWait = 25;

        setTimeout(fnTweak, iWait);
    },

    FocusOnApexBrowserTab: function ()
    {
		// Default URL
		var sDefaultURL = 'https://apex.trisys.co.uk/*';

		// To handle custom sub domains e.g. https://opus-laboris-recruitment.trisys.co.uk/*
		// we need to be clever so we would send a SignalR to our login and that would query its
		// own URL and send that to us via SignalR, upon which we would then post this message to open that tab

		// Wow, but no!
		// Too much wiring which can go wrong.
		// Tried to get from https://apex.trisys.co.uk/configuration/white-label.json but this causes CORS issues:
		//var loggedInUserSubscriberContact = TriSysApex.LoginCredentials.Cache.ReadLoggedInUserSubscriber();
		//var sCompanyID = loggedInUserSubscriberContact.CompanyName.replace(/ /g, '-').toLowerCase();
		//var sFilePath = 'https://apex.trisys.co.uk/configuration/white-label.json';
  //      var whiteLabelData = Platformix.Data.JsonFileData(sFilePath);
		//if(whiteLabelData)
		//{
		//	var partners = whiteLabelData.Partners;
		//	if(partners)
		//	{
		//		partners.forEach(function(partner)
  //              {
  //                  if (partner.ID.toLowerCase() == sCompanyID)
  //                  {
  //                      // This is indeed a partner, so get the sub-domained URL
		//				sDefaultURL = 'http://' + sCompanyID + '/*';
  //                  }
  //              });
		//	}
		//}

		// The solution therefore is to call the Web API to return this for us!
		var payloadObject = {};
        payloadObject.URL = "OfficeAutomation/ActiveTabURL";
        payloadObject.InboundDataFunction = function (CActiveTabURLResponse)
		{
			if(CActiveTabURLResponse)
			{
				if(CActiveTabURLResponse.Success)
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

    LoadPrimaryContactDetailsInPopupWindow: function ()
    {
        var contactDetails = TriSysExtension.Cache.GetContactDetails();
        if (contactDetails)
        {
            TriSysExtension.DisplayContactDetails(contactDetails, 'popup-', true);
            //TriSysExtension.ShowMessage("Loaded primary contact details?");

            // Always show the profile widgets if we are loading them!
            TriSysExtension.ShowContactProfileWidgets(null);
        }
    },

    LoadSecondaryContactDetailsInPopupWindow: function()
    {
        var contactDetails = TriSysExtension.Cache.GetSecondaryContactDetails();
        if (contactDetails)
        {
            TriSysExtension.DisplaySecondaryContactDetails(contactDetails);
        }
    },

    // Use the current profile to create a TriSys record
    AddNewContact: function()
    {
        // Get the current contact ID
        var contactDetails = TriSysExtension.Cache.GetContactDetails();
        if (contactDetails && contactDetails.Contact)
        {
            if (contactDetails.Contact.ContactId > 0)
            {
                TriSysExtension.ShowMessage('Contact already exists in your CRM database.');
                return;
            }

            var fnAsyncCall = function (CSocialNetworkProfileCreateContactRequest)
            {
                // Create the contact in the TriSys database
                //TriSysExtension.ShowMessage("TODO: " + JSON.stringify(contactDetails));
                //var CSocialNetworkProfileCreateContactRequest = contactDetails;

                var payloadObject = {};

                payloadObject.URL = "SocialNetwork/CreateContact";

                payloadObject.OutboundDataPacket = CSocialNetworkProfileCreateContactRequest;

                payloadObject.InboundDataFunction = function (CSocialNetworkProfileCreateContactResponse)
                {
					TriSysApex.UI.HideWait();

                    if (CSocialNetworkProfileCreateContactResponse)
                    {
                        if (CSocialNetworkProfileCreateContactResponse.Success)
                        {							
                            // Contact was created
							TriSysApex.Toasters.Information("Added new contact to TriSys");

                            // Now open this record in TriSys
							TriSysExtension.OpenContactFormAndFocusOnTab(CSocialNetworkProfileCreateContactResponse.ContactId, true);

							// Recommence the lookup by showing the parsed profile
							TriSysExtension.Refresh();

                            return;
                        }
						else
							TriSysExtension.ShowMessage(CSocialNetworkProfileCreateContactResponse.ErrorMessage);
                    }
                    else
                        TriSysExtension.ShowMessage("Error");
                };

                payloadObject.ErrorHandlerFunction = function (request, status, error)
                {
					TriSysApex.UI.HideWait();
                    TriSysExtension.ShowMessage('TriSysExtension.AddNewContact: ' + status + ": " + error + ". responseText: " + request.responseText);
                };

                TriSysAPI.Data.PostToWebAPI(payloadObject);
            };

			// We must upload the contact photo asynchronously prior to sending to the Web API
			var fnUploadPhotoBeforeCommencingContactRecordCreation = function()
			{
				// Kludge!
				contactDetails.Photo = contactDetails.ContactPhoto;

				// Allow the user choice over what gets written to TriSys
				TriSysExtension.Cache.SetContactDetails(contactDetails);
				TriSysApex.UI.HideWait();
				TriSysExtension.ApplyChanges({ 
					newContact: true,
					title: "Add New Contact",
					callback: fnAsyncCall
				});
			};

			TriSysApex.UI.ShowWait(null, 'Adding New Contact...');

            // We must get our own version of the currently logged in Apex credentials.
            // To maintain security, get these from the live app
            TriSysExtension.CheckConnectionStatus(fnUploadPhotoBeforeCommencingContactRecordCreation);
        }
    },

    AssignToExistingContact: function (lContactId, sFullName)
    {
        // Get the current contact ID
        var contactDetails = TriSysExtension.Cache.GetContactDetails();
        if (contactDetails)
        {
            if (contactDetails.Contact && contactDetails.Contact.ContactId > 0)
            {
                TriSysExtension.ShowMessage('Contact already exists in your CRM database.');
                return;
            }

			// Clear last search
			//$('.trisys-duplicate-contacts-tbody').clear();
			TriSysExtension.DisplayMatchingContacts([]);

            // Sometimes the name in LinkedIn is not the actual name e.g. Fred Bloggs ACMA
            // Prompt the user to confirm what we lookup
            var sName = contactDetails.FullName;

			if(contactDetails.GMail)
				sName = contactDetails.GMail.FullName;

			// Prevent multiple spaces caused because of badly formatted names
			if(sName)
				sName = sName.replace(/\s+/g, ' ').trim();

			var fnLookupName = function (sFullName, lContactId)
            {
                if (!sFullName)
                    return;

                contactDetails.FullName = sFullName;    // May be different or shorter

                var fnAsyncCall = function ()
                {
					TriSysApex.UI.ShowWait(null, 'Looking Up Contacts...');

                    // Return all contacts which match in the TriSys database
                    var CSocialNetworkProfileContactMatchRequest = contactDetails;

                    var payloadObject = {};

                    payloadObject.URL = "SocialNetwork/MatchingContacts";

                    payloadObject.OutboundDataPacket = CSocialNetworkProfileContactMatchRequest;

                    payloadObject.InboundDataFunction = function (CSocialNetworkProfileContactMatchResponse)
                    {
						TriSysApex.UI.HideWait();

                        if (CSocialNetworkProfileContactMatchResponse)
                        {
                            if (CSocialNetworkProfileContactMatchResponse.Success)
                            {
                                // List of contacts was returned so that we can display them
                                var parsedAccordionRow = $('#trisys-extension-parsed-panel');
								var accordionRow = $('#trisys-extension-accordion-panel');
                                var duplicatesRow = $('#trisys-extension-popup-duplicate-contacts');
								parsedAccordionRow.hide();
                                accordionRow.hide();
                                duplicatesRow.show();

                                TriSysExtension.DisplayMatchingContacts(CSocialNetworkProfileContactMatchResponse.Contacts, sFullName);

                                return;
                            }
                        }
                        else
                            TriSysExtension.ShowMessage("Error");
                    };

                    payloadObject.ErrorHandlerFunction = function (request, status, error)
                    {
						TriSysApex.UI.HideWait();
                        TriSysExtension.ShowMessage('TriSysExtension.AssignToExistingContact: ' + status + ": " + error + ". responseText: " + request.responseText);
                    };

                    TriSysAPI.Data.PostToWebAPI(payloadObject);
                };

                // We must get our own version of the currently logged in Apex credentials.
                // To maintain security, get these from the live app
                TriSysExtension.CheckConnectionStatus(fnAsyncCall);

                return true;
            };

			if (lContactId > 0)
			{
			    // Read single contact from database
			    contactDetails.ContactId = lContactId;
			    fnLookupName(sFullName, lContactId);
            }
			else
			{
                // Prompt user to search for name
                var options = {
                    Label: "Name",
                    Value: sName,
                    ButtonLabel: "Search",
				    Instructions: "Lookup all contact records in TriSys which match this name:"
                };
                TriSysApex.ModalDialogue.New.Popup("Lookup Contact", "gi-search", fnLookupName, options);
            }
        }
    },

    DisplayMatchingContacts: function (contacts, sName)
    {
		var counterElement = $('#matching-contacts-count');

        if ((!contacts || contacts.length == 0) && sName)
        {			
			counterElement.text("No");
            TriSysExtension.ShowMessage('No matching contacts for: ' + sName);
            return;
        }

		if(contacts)
		{
			counterElement.text(TriSysSDK.Numbers.ThousandsSeparator(contacts.length));
			contacts.forEach(function(contact)
			{
				contact.ContactTypeAndIdLabel = contact.ContactType + ' : ' + contact.ContactId;
			});
		}
        
        var directives =
        {
            hyperlink:
            {
                onclick: function (params)
                {
                    return "TriSysExtension.AssignProfileToContact(" + this.ContactId + ")";
                }
            },

            openContactRecord:
            {
                onclick: function (params)
                {
                    return "TriSysExtension.OpenContactFormAndFocusOnTab(" + this.ContactId + ")";
                }
            },

            Photo:
            {
                src: function (params)
                {
                    var sPhoto = this.ContactPhoto;
                    if (!sPhoto)
                        sPhoto = TriSysApex.Constants.DefaultContactImage;

                    return sPhoto;
                }
            }
        };

        $('.trisys-duplicate-contacts-tbody').render(contacts, directives);
    },

    AssignProfileToContact: function(lContactId)
    {
        var contactDetails = TriSysExtension.Cache.GetContactDetails();
        if (contactDetails)
        {
            // Remove the duplicate row
            var duplicatesRow = $('#trisys-extension-popup-duplicate-contacts');
            duplicatesRow.hide();

            // Read the entire profile of the contact record in order to compare all profile fields
			TriSysApex.UI.ShowWait(null, 'Reading Contact...');

			var fnAsyncCall = function()
			{
				var CSocialNetworkProfileReadContactRequest = {
					ContactId: lContactId
				};

				var payloadObject = {};

				payloadObject.URL = "SocialNetwork/ReadContact";

				payloadObject.OutboundDataPacket = CSocialNetworkProfileReadContactRequest;

				payloadObject.InboundDataFunction = function (CSocialNetworkProfileReadContactResponse)
				{
					TriSysApex.UI.HideWait();

					if (CSocialNetworkProfileReadContactResponse)
					{
						if (CSocialNetworkProfileReadContactResponse.Success)
						{
							// Allow the user choice over what gets written to TriSys
							TriSysExtension.Cache.SetContactDetails(CSocialNetworkProfileReadContactResponse);
							TriSysExtension.ApplyChanges({ 
								title: "Assign to Existing Contact",
								disabledElements: ['extension-apply-changes-copy-public-profile-url']
							});
							return;
						}
					}

					// If we get here, something has gone wrong
					TriSysApex.UI.errorAlert("Expected to identify a contact, but this failed.");
				};

				payloadObject.ErrorHandlerFunction = function (request, status, error)
				{
					TriSysApex.UI.HideWait();
					var sError = 'TriSysExtension.AssignProfileToContact: ' + status + ": " + error + ". responseText: " + request.responseText;
					TriSysApex.UI.errorAlert(sError);
				};

				TriSysAPI.Data.PostToWebAPI(payloadObject);
			};

			// We must get our own version of the currently logged in Apex credentials.
            // To maintain security, get these from the live app
            TriSysExtension.CheckConnectionStatus(fnAsyncCall);
        }
    },

    AddNewNote: function()
    {
        // Get the current contact ID
        var contactDetails = TriSysExtension.Cache.GetContactDetails();
        if (contactDetails)
        {
            if (contactDetails.Contact.ContactId > 0)
            {
                // Display this record in Apex
                TriSysApex.InterprocessCommunication.ClientTaskAutomation(0, contactDetails.Contact, false);

                // And focus on the tab
                TriSysExtension.FocusOnApexBrowserTab();

				TriSysApex.Toasters.Information('A new note has been opened in TriSys');
            }
            else
                TriSysExtension.ShowMessage('Contact does not exist in your CRM database.');
        }
    },

    AddScheduledTask: function ()
    {
        // Get the current contact ID
        var contactDetails = TriSysExtension.Cache.GetContactDetails();
        if (contactDetails)
        {
            if (contactDetails.Contact.ContactId > 0)
            {
                // Display this record in Apex
                TriSysApex.InterprocessCommunication.ClientTaskAutomation(0, contactDetails.Contact, true);

                // And focus on the tab
                TriSysExtension.FocusOnApexBrowserTab();

				TriSysApex.Toasters.Information('A new scheduled task has been opened in TriSys');
            }
            else
                TriSysExtension.ShowMessage('Contact does not exist in your CRM database.');
        }        
    },

    AddToShortlist: function ()
    {
        TriSysExtension.Actions.RunAction('AddContactToShortlist');
    },

    //#region TriSysExtension.Actions
    Actions:
    {
        RunAction: function(sActionID)
        {
            var contactDetails = TriSysExtension.Cache.GetContactDetails();
            if (contactDetails)
            {
                if (contactDetails.Contact.ContactId > 0)
                {
					var lContactId = contactDetails.Contact.ContactId;

                    // Focus on the tab first
                    TriSysExtension.FocusOnApexBrowserTab();

                    // Display this record in Apex AND run the action
					TriSysApex.InterprocessCommunication.ContactActionAutomation(lContactId, sActionID);

					TriSysApex.Toasters.Information('The [' + sActionID + '] action has been invoked in TriSys');
                }
                else
                    TriSysExtension.ShowMessage('Contact does not exist in your CRM database.');
            }
            
        },

        Call: function ()
        {
            TriSysExtension.Actions.RunAction('Call');
        },
        EMail: function ()
        {
            TriSysExtension.Actions.RunAction('EMail');
        },
        MailMerge: function ()
        {
            TriSysExtension.Actions.RunAction('MailMerge');
        },
        Meeting: function ()
        {
            TriSysExtension.Actions.RunAction('Meeting');
        },
        Note: function ()
        {
            TriSysExtension.Actions.RunAction('Note');
        },
        SMSText: function ()
        {
            TriSysExtension.Actions.RunAction('SendSMSText');
        },
        ToDo: function ()
        {
            TriSysExtension.Actions.RunAction('ToDo');
        }
    },
    //#endregion TriSysExtension.Actions


    // The cache is the currently viewed message/record.
    // Because both the iframe pages load a new instance of the record, we must store these
    // in temporary storage - true or false?
	// Aug 2019, a we do not need to support two frames, we can dispense with this.
	// This will also allow multiple sessions at once. A big benefit.
	//
    Cache:		// TriSysExtension.Cache
    {
		_Data: [
			{ id: 0, json: null },						// Primary Contact Details
			{ id: 1, json: null }						// Secondary Contact Details
		],

        GetContactDetails: function ()
        {
            var sJSON = TriSysExtension.Cache._Data[0].json;
            var details = JSON.parse(sJSON);
			if(details)
			{
				if(!details.Photo)
					details.Photo = details.ContactPhoto;		// Bit of AAI!
			}

            return details;
        },

        SetContactDetails: function (details)
        {
            var sJSON = JSON.stringify(details);
			TriSysExtension.Cache._Data[0].json = sJSON;
        },

        GetSecondaryContactDetails: function ()
        {
            var sJSON = TriSysExtension.Cache._Data[1].json;
            var details = JSON.parse(sJSON);
            return details;
        },

        SetSecondaryContactDetails: function (details)
        {
            var sJSON = JSON.stringify(details);
            TriSysExtension.Cache._Data[1].json = sJSON;
        },

        GetDefaultContactType: function ()
        {
            var sContactType = TriSysAPI.Persistence.Read("DefaultContactType");
			if(!sContactType)
				sContactType = "Client";
            return sContactType;
        },

        SetDefaultContactType: function (sContactType)
        {
            TriSysAPI.Persistence.Write("DefaultContactType", sContactType);
        }
    },

	OpenProfilePicture: function(sImageId, sNameId)
	{
		var sURL = $('#' + sImageId).attr('src');
		if(sURL)
		{
			var sName = $('#' + sNameId).text();
			TriSysApex.Pages.FileManagerForm.OpenDocumentViewer(sURL, sName, 'image');
		}
	},

	LookupCompany: function()
	{
		var companyNameElement = $('#extension-apply-changes-source-company-name');
		var sCompanyName = companyNameElement.val();
		var fnDisplayCompany = function(companyRow)
		{
			if(companyRow)
			{
				var sCompany = companyRow.Company_Name;
				companyNameElement.val(sCompany);
				return true;
			}
		};

		TriSysApex.ModalDialogue.Companies.Select(sCompanyName, fnDisplayCompany);
	},

	LookupJobTitle: function()
	{
		var jobTitleElement = $('#extension-apply-changes-source-job-title');
		var sJobTitle = jobTitleElement.val();
		var fnDisplayJobTitle = function(jobTitleRow)
		{
			if(jobTitleRow)
			{
				var sJobTitle = jobTitleRow.JobTitle;
				jobTitleElement.val(sJobTitle);
				return true;
			}
		};

		TriSysApex.ModalDialogue.JobTitle.SelectMultiple(sJobTitle, fnDisplayJobTitle, { singleSelect: true });
	},

	LookupLocation: function()
	{
		var companyNameElement = $('#extension-apply-changes-source-company-name');
		var locationElement = $('#extension-apply-changes-source-location');
		var sCompanyName = companyNameElement.val();
		var fnDisplayCompanyAddress = function(companyAddressRow)
		{
			if(companyAddressRow)
			{
				var sAddress = companyAddressRow.FullAddress;
				locationElement.val(sAddress);
				return true;
			}
		};

		TriSysApex.ModalDialogue.CompanyAddress.Select(sCompanyName, fnDisplayCompanyAddress);
	},

	ShowAttachments: function(attachments, bContactFound)
	{
		$('#popup-attachments-id').text("");
		$('#popup-attachments-id').hide();

		var sRowId = bContactFound ? '#accordion-panelbar-attachments-li' : '#parsed-contact-attachments-tr';
		var sTableID = bContactFound ? 'trisys-attachments-tbody' : 'parsed-attachments-tbody';

		if(!attachments)
			attachments = [];

		attachments.length == 0 ? $(sRowId).hide() : $(sRowId).show();
		if(attachments.length > 0)
		{
			$('#popup-attachments-id').text(attachments.length);
			$('#popup-attachments-id').show();

			try
			{
				var attachmentData = [];
				for (var i = 0; i < attachments.length; i++)
				{
					var attachment = attachments[i];

					// Take a copy so that we can modify some display fields
					var attachmentObject = JSON.parse(JSON.stringify(attachment));

					attachmentObject.FileName = attachment.Name;

					var sFileType = TriSysApex.Pages.FileManagerForm.DetermineFileTypeForImageFromFilePath(attachmentObject.FileName);

					attachmentObject.FileIcon = TriSysApex.Pages.FileManagerForm.ImagePathForFileType(sFileType);

					// Only interested in certain file types
					var lstAllowed = ['word', 'acrobat'];
					var bAddToList = lstAllowed.indexOf(sFileType) >= 0;

					if(bAddToList)
						attachmentData.push(attachmentObject);
				}

				// We may have less than we did above!
				$('#popup-attachments-id').text(attachmentData.length);

				var directives =
				{
					'parse-cv-button':
					{
						onclick: function (params)
						{
						    // 13 Dec 2021: Escape those characters which will cause trouble in DOM
						    var sFileName = this.FileName;
						    sFileName = sFileName.replace(/'/g, "\\'");
						    sFileName = sFileName.replace(/"/g, '\\"');
						    return "TriSysExtension.OpenCVAutoRecognitionForm('" + sFileName + "')";
						}
					},

					FileIcon:
					{
						src: function(params)
						{
							return this.FileIcon;
						}
					}
				};

				$('.' + sTableID).render(attachmentData, directives);
				$('.' + sTableID).show();
			}
			catch(e)
			{
				// WTF?
			}

		    // 13 Nov 2020
			if (!bContactFound)
			{
			    var parsedPanel = $('#trisys-extension-parsed-panel');
			    parsedPanel.show();
			    $('#parsed-contact-personal-email-tr').hide();
			    $('#parsed-contact-details').show();
			    
            }
		}
	},

	OpenCVAutoRecognitionForm: function(sFileName)
	{
		var fnStartCVAR = function(sFolderFilePath)
		{
			// Open CVAR in TriSys
            TriSysApex.InterprocessCommunication.CVAutoRecognitionAutomation(sFolderFilePath, sFileName);

            // And focus on the tab
            TriSysExtension.FocusOnApexBrowserTab();

			// Let user know it is underway
			TriSysApex.Toasters.Information('The CV ' + sFileName + ' is now being parsed in TriSys');
		};
		var fnFileUploadedCallback = function(sUploadedPath)
		{
			TriSysExtension.UploadCV(sUploadedPath, fnStartCVAR);
		};
		var fnCallback = function(sBase64)
		{
			TriSysExtension.UploadAttachment(sBase64, sFileName, fnFileUploadedCallback);
		};
        
		TriSysExtension.DownloadOutlookAttachment(sFileName, fnCallback);
	},


	// Lifted from cvautorecognition.js
    // When the user chooses a file to upload, start processing it now
    UploadCV: function(sFilePath, fnCallback)
    {
        // Call Web API to move this temporary file into the g:\Incoming CVs folder and return this path to us
        // so that we can:
        // a. Refresh the grid
        // b. Start processing this file immediately
        var payloadObject = {};

        payloadObject.URL = "Files/MoveUploadedFileReferenceDocument";

        payloadObject.OutboundDataPacket = {
            UploadedFilePath: sFilePath,
            SubFolder: "Incoming CVs"
        };

        payloadObject.InboundDataFunction = function (JSONdataset)
        {
            TriSysApex.UI.HideWait();
            if (JSONdataset)
            {
                if (JSONdataset.Success)
                {
                    var sFilePath = JSONdataset.FolderFilePath;
					fnCallback(sFilePath);                    
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
            TriSysApex.UI.ErrorHandlerRedirector('TriSysExtension.UploadCV: ', request, status, error);
        };

        var sName = TriSysSDK.Controls.FileManager.GetFileNameFromPath(sFilePath);
        TriSysApex.UI.ShowWait(null, "Copying " + sName + "...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

	UploadAttachment: function (sBase64, sFileName, fnCallback)
    {
        var CFileStreamWriteRequest =
        {
            Base64Text: sBase64,
            FileName: sFileName,
			RetainFileName: true
        };

        var payloadObject = {};

        payloadObject.URL = "Files/UploadBase64Stream";

        payloadObject.OutboundDataPacket = CFileStreamWriteRequest;

        payloadObject.InboundDataFunction = function (CFileStreamWriteResponse)
        {
            TriSysApex.UI.HideWait();

            if (CFileStreamWriteResponse)
            {
                if (CFileStreamWriteResponse.Success)
                {
                    fnCallback(CFileStreamWriteResponse.FilePath);

                    return;
                }
                else
                    TriSysApex.UI.ShowMessage(CFileStreamWriteResponse.ErrorMessage);
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('TriSysExtension.UploadAttachment: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, 'Uploading ' + sFileName + '...');			
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

	// This can only be used within the context of a selected e-mail using the office.js libraries
	// See the TriSysOutlookWebAddIn project
	DownloadOutlookAttachment: function(sFileName, fnCallback)
	{
		var item = Office.context.mailbox.item;
		if(item)
		{
			if(item.attachments.length > 0)
			{
				item.attachments.forEach(function(attachment)
				{
					if(attachment.name == sFileName)
					{
						//TriSysApex.Toasters.Error("Downloading " + attachment.name + "...");

						var options = { asyncContext: { type: attachment.attachmentType } };
						item.getAttachmentContentAsync(attachment.id, options, function (result) 
						{
							if (result.status == Office.AsyncResultStatus.Succeeded) 
							{
								//console.log("Call returned success!");
								var AttachmentContent = result.value; // Get the attachment content
								if (AttachmentContent.format == Office.MailboxEnums.AttachmentContentFormat.Base64) {
									// handle file attachment
									//console.log(attachment.name + " Base64 String: " + AttachmentContent.content);
									//TriSysApex.Toasters.Error("Downloaded " + attachment.name);
									fnCallback(AttachmentContent.content);
								}
								else if (result.format == Office.MailboxEnums.AttachmentContentFormat.Eml) {
									// handle item attachment
								}
								else {
									// handle cloud attachment  
								}
							} 
							else 
							{
								var err = result.error;
								TriSysApex.Toasters.Error("Download failed: " + err.name + ": " + err.message);
							}
						});
					}
				});
			}
		}
	},

	// Outlook add-in enforces small width, but larger height than Chrome extension
	TweakDimensionsOfOutlookAddIn: function()
	{
		// The height of the parsing data panel
		var sHeight = ($(window).height() - 30) + 'px';
		$('#parsed-contact-details').css('height', sHeight);

	    // The height of the contact details panel
		var iContactDetailsHeightFactor = TriSysExtension.isRecruitmentDatabase() ? 365 : 220;
		sHeight = ($(window).height() - iContactDetailsHeightFactor) + 'px';
		$('#accordion-panelbar-contact-details-div').css('min-height', sHeight);
		$('#accordion-panelbar-contact-details-div').css('max-height', sHeight);
		$('#accordion-panelbar-contact-details-table').css('min-height', sHeight);
		$('#accordion-panelbar-contact-details-table').css('max-height', sHeight);

		// cv-preview, requirements, placements, tasks and attachments
		var iCVPreviewHeightFactor = TriSysExtension.isRecruitmentDatabase() ? 358 : 200;
		sHeight = ($(window).height() - iCVPreviewHeightFactor) + 'px';
		$('#cv-preview').css('max-height', sHeight);
		$('#requirements').css('max-height', sHeight);
		$('#accordion-panelbar-requirements-table').css('min-height', sHeight);
		$('#placements').css('max-height', sHeight);
		$('#accordion-panelbar-placements-table').css('min-height', sHeight);
		$('#accordion-panelbar-noteshistory-div').css('max-height', sHeight);
		$('#accordion-panelbar-scheduledtasks-div').css('max-height', sHeight);
		$('#accordion-panelbar-attachments-div').css('max-height', sHeight);

		// Enumerate through tables and reduce 2 columns to 1
		var lstTables = [
			{ id: 'accordion-panelbar-contact-details-table' },
			{ id: 'parsed-contact-details-table', 
				ignoreTRList: [
					'parsed-contact-attachments-tr',
					'looking-up-profile-in-trisys-spinner',
					'looking-up-profile-nothing-found' 
				]}
		];

		lstTables.forEach(function(tableSpecification)
		{
			// For each row, create a table with two rows
			$('#' + tableSpecification.id + ' tr').each(function() 
			{
				var tr = $(this);

				if(tableSpecification.ignoreTRList)
				{
					if(tableSpecification.ignoreTRList.indexOf(this.id) >= 0)										
						return;
				}

				// For each <td>, add to a list
				var lstTD = [];
				tr.find('td').each(function() 
				{
					var td = $(this);
					lstTD.push(td);
				});

				// Put INSIDE <tr>!
				tr.prepend("<td><table>");
				tr.append("</table></td>");

				// Find the newly created table
				tr.find('table').each(function() 
				{
					// Move each <td> into here and wrap with a <tr>
					var table = $(this);
					lstTD.forEach(function(td)
					{
						td.appendTo(table);
						td.wrap("<tr></tr>");

						// Tweak the style also
						td.attr('style', 'padding-left: 0px !important; padding-bottom: 2px;');
					});
				});
			}); 
		});
	}

};  // TriSysExtension

// Main entry point into the browser extension which is typically iframed
//
$(document).ready(function ()
{
	// If office add-in, then instantiate when office libraries are loaded, not when JQuery is loaded!
	if(TriSysExtension.isOfficeAddInWebServerComponent())
		return;

    TriSysExtension.Load();
});
