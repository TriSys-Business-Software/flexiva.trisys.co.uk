// Main entry point into this single page application with one caveat:
// For SEO style URL's (e.g. www..../form/func?id=123, we support the back/forward buttons so
// this may be invoked more often than in a traditional SPA.


var ApexIndexPage =
{
    // The text search box at the top of the app caption bar
    initialiseSearch: function ()
    {
        // March 2016

        // Alex Clarke code for search box
        // On keyup of the text input with ID trisys-search
        $("#trisys-search").keyup(function (event)
        {
            //set the current input to the variable my_input
            var my_input = document.getElementById('trisys-search');

            //if the keycode == 13, (enter key), display a message box
            if (event.keyCode == 13)
            {
                var sText = my_input.value;
                if (sText)
                {
                    // TODO: Invoke full search in product
                    //TriSysApex.Toasters.Info("enter: " + sText);
                    //TriSysApex.UI.ShowMessage(my_input.value);
                    ApexIndexPage.ShowSearchResultsMenu(sText);
                }
            }
			else
			{
				// March 2020: hide drop down as searches only invoked on {Enter}
				$('#search-drop-down-results-block-waiting-spinner').hide();
				$('#search-drop-down-results-block-list').hide();

				// Force this to toggle back
				var elemSearchDropDownResults = $('#search-drop-down-results');
				var sExpanded = elemSearchDropDownResults.attr('aria-expanded');
				if(sExpanded == 'true')
					$('#search-drop-down-results').trigger('click');
			}
            //else //else show a toastr with the current value
            //{
            //    // TODO: Invoke partial search for matches
            //    TriSysApex.Toasters.Info(my_input.value);
            //}
        });

        $("#trisys-search").on('click', function(e)
        {
			// Did user click on the magnifying glass?
			//var xPosition = e.clientX;
			//var yPosition = e.clientY;
			var xOffset = e.offsetX;
			//var yOffset = e.offsetY;
			var iMagnifyingGlassXStart = 170;
			if(xOffset >= iMagnifyingGlassXStart)
			{
				ApexIndexPage.MagnifyingGlassPopup();
			}
			else
			{
				// Display the last search menu
				var sText = $("#trisys-search").val();
				ApexIndexPage.ShowSearchResultsMenu(sText);
			}

			e.stopPropagation();
        });
    },

    SearchInvocation: function (sSearchText)
    {
        var payloadObject = {};

        var CLookupRequest = {
            Expression: sSearchText,
            MaximumRecordsPerEntity: 16
        };

        payloadObject.URL = "Lookup/Find";

        payloadObject.OutboundDataPacket = CLookupRequest;

        payloadObject.InboundDataFunction = function (CLookupResponse)
        {
            if (CLookupResponse)
            {
                if (CLookupResponse.Success)
                {
                    // Display the list now
                    ApexIndexPage.DisplaySearchResults(CLookupResponse.Items, sSearchText);

                    return;
                }
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.Logging.LogMessage('ApexIndexPage.SearchInvocation: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    DisplaySearchResults: function (items, sSearchText)
    {
        var elemList = $('#search-drop-down-results-block-list');
        var iCounter = 0;

        if (sSearchText)
            sSearchText = sSearchText.trim();

        if (items)
        {
            iCounter = items.length;
            for (var i = 0; i < items.length; i++)
            {
                var item = items[i];

                var sEntityName = item.EntityName, sIcon = null;
                switch(sEntityName)
                {
                    case 'Contact':
                        sIcon = 'gi gi-parents';
                        break;
                    case 'Company':
                        sIcon = 'gi gi-building';
                        break;
                    case 'Requirement':
                        sIcon = 'gi gi-user_add';
                        break;
                    case 'Placement':
                        sIcon = 'gi gi-gbp';
                        break;
                    case 'Timesheet':
                        sIcon = 'gi gi-stopwatch';
                        break;
                }
                if (sIcon)
                    sIcon = '<i class="' + sIcon + ' pull-left" style="color: gray; margin-top: 3px; margin-left: 1px;"></i> &nbsp; &nbsp; ';

                var sFunction = 'TriSysApex.FormsManager.OpenForm(\'' + sEntityName + '\',' + item.RecordId + ');';

                var fnReplaceCaseInsensitive = function (line, word)
				{
					if (line)
					{
						try
						{
							var regex = new RegExp('(' + word + ')', 'gi');
							return line.replace(regex, "<b>$1</b>");

						} catch (e)
						{
							// Example which caused problem: she[pard
							return line.replace(regex, "<b>" + word + "</b>");
						}
					}
					else
						return line;
                };

                var sText = item.Display;
                var parts = sSearchText.split(" ");
                for (var j = 0; j < parts.length; j++)
                {
                    var sWord = parts[j];
                    sText = fnReplaceCaseInsensitive(sText, sWord);
                }

                var sRightPadding = ' &nbsp; &nbsp; ';
                var sItemHyperlink = '<a href="javascript:void(0)" onclick="' + sFunction + '">' + sIcon + sText + sRightPadding + '</a>';

                elemList.append(sItemHyperlink);
            }
        }

        $('#search-drop-down-results-block-waiting-spinner').hide();

        if (iCounter > 0)
            elemList.show();        
    },

    afterLoadDynamically: function()
    {
		try
		{
			// PhoneGap invocation if we are on a mobile device
			TriSysPhoneGap.onLoadEvent();
		}
		catch(ex)
		{
			// Error in debugging SSR via VPN Dec 2018
		}

        // Draw application navigation bar or menus, and kick off application framework
        TriSysApex.Pages.Index.documentReady(null, "scrollNavBar");

        try
        {
            // Image viewer
            //$('.fancybox').fancybox({         // V2
            $("[data-fancybox]").fancybox({     // V3
                //type: 'iframe',
                autoSize: true
            });

        } catch (e)
        {
            // Have caught run-time errors with instantiating this 3rd party control
        }

        // Setup the google translator
        ApexIndexPage.SetupGoogleTranslateWidget();


        // Event handlers

        

        // Identify the type of device and turn off 'auto-show on hover' main menus if on a mobile 'touch' device
        var bTurnOffHoverMenus = (TriSysApex.Device.Model.Android() || TriSysApex.Device.Model.iOS());
        //bTurnOffHoverMenus = true;      // Test
        if (bTurnOffHoverMenus)
        {
            $('#history-drop-down-menu').removeClass().addClass('dropdown');
            $('#new-record-drop-down-menu').removeClass().addClass('dropdown');
            $('#LoggedInUserDropDownMenu').removeClass().addClass('dropdown');
        }

        var newRecordParentBlock = $('#new-record-drop-down-menu-block');

        $('#new-record-contact').on('click', function (e)
        {
            TriSysApex.Pages.ContactForm.NewRecord();
            return ApexIndexPage.PostMenuItemClick(e, $(this), newRecordParentBlock);
        });

        $('#new-record-company').on('click', function (e)
        {
            TriSysApex.Pages.CompanyForm.NewRecord();
            return ApexIndexPage.PostMenuItemClick(e, $(this), newRecordParentBlock);
        });

        $('#new-record-cvar').on('click', function (e)
        {
            TriSysApex.FormsManager.OpenForm('CVAutoRecognition');
            return ApexIndexPage.PostMenuItemClick(e, $(this), newRecordParentBlock);
        });

        $('#new-record-requirement').on('click', function (e)
        {
            TriSysApex.Pages.RequirementForm.NewRecord();
            return ApexIndexPage.PostMenuItemClick(e, $(this), newRecordParentBlock);
        });

        $('#new-record-placement').on('click', function (e)
        {
            TriSysApex.Pages.PlacementForm.NewRecord();
            return ApexIndexPage.PostMenuItemClick(e, $(this), newRecordParentBlock);
        });

        $('#new-record-timesheet').on('click', function (e)
        {
            TriSysApex.Pages.TimesheetForm.NewRecord();
            return ApexIndexPage.PostMenuItemClick(e, $(this), newRecordParentBlock);
        });

        $('#new-record-notehistory').on('click', function (e)
        {
            TriSysApex.ModalDialogue.Task.ContextualNew(false);
            return ApexIndexPage.PostMenuItemClick(e, $(this), newRecordParentBlock);
        });

        $('#new-record-scheduledtask').on('click', function (e)
        {
            TriSysApex.ModalDialogue.Task.ContextualNew(true);
            return ApexIndexPage.PostMenuItemClick(e, $(this), newRecordParentBlock);
        });

        $('#new-record-postitnote').on('click', function (e)
        {
            TriSysApex.PostItNotes.New();
            return ApexIndexPage.PostMenuItemClick(e, $(this), newRecordParentBlock);
        });
        

        var loggedInUserDropDownMenuParentBlock = $('#LoggedInUserDropDownMenu-block');

        $('#LoggedInUserDropDownMenu-OpenLoggedInUserContactRecord').on('click', function (e)
        {
            TriSysApex.UserOptions.OpenLoggedInUserContactRecord();
            return ApexIndexPage.PostMenuItemClick(e, $(this), loggedInUserDropDownMenuParentBlock);
        });

        $('#LoggedInUserDropDownMenu-OpenLoggedInUserCompanyRecord').on('click', function (e)
        {
            TriSysApex.UserOptions.OpenLoggedInUserCompanyRecord();
            return ApexIndexPage.PostMenuItemClick(e, $(this), loggedInUserDropDownMenuParentBlock);
        });

        $('#LoggedInUserDropDownMenu-UserOptions').on('click', function (e)
        {
            TriSysApex.UserOptions.ShowForm();
            return ApexIndexPage.PostMenuItemClick(e, $(this), loggedInUserDropDownMenuParentBlock);
        });

        $('#LoggedInUserDropDownMenu-TodaysTasks').on('click', function (e)
        {
            TriSysApex.Activities.Launch('Todays Tasks');
            return ApexIndexPage.PostMenuItemClick(e, $(this), loggedInUserDropDownMenuParentBlock);
        });

        // Detect any mouse move
        var $doc = $(document);
        $doc.mousemove(function (event)
        {
            var pageCoords = "( " + event.pageX + ", " + event.pageY + " )";
            var clientCoords = "( " + event.clientX + ", " + event.clientY + " )";
            
            var sText = "Move: " + pageCoords + ", " + clientCoords;
            //$('#subscribe-text').html(sText);
        });

        $doc.mouseenter(function (event)
        {
            var pageCoords = "( " + event.pageX + ", " + event.pageY + " )";
            var clientCoords = "( " + event.clientX + ", " + event.clientY + " )";

            var sText = "Enter: " + pageCoords + ", " + clientCoords;
            //$('#subscribe-text').html(sText);
        });

        $doc.mouseover(function (event)
        {
            var pageCoords = "( " + event.pageX + ", " + event.pageY + " )";
            var clientCoords = "( " + event.clientX + ", " + event.clientY + " )";

            var sText = "Over: " + pageCoords + ", " + clientCoords;
            //$('#subscribe-text').html(sText);
        });

        $doc.mousedown(function (event)
        {
            var pageCoords = "( " + event.pageX + ", " + event.pageY + " )";
            var clientCoords = "( " + event.clientX + ", " + event.clientY + " )";

            var sText = "Down: " + pageCoords + ", " + clientCoords;
            //$('#subscribe-text').html(sText);
        });

        $doc.hover(function (event)
        {
            var pageCoords = "( " + event.pageX + ", " + event.pageY + " )";
            var clientCoords = "( " + event.clientX + ", " + event.clientY + " )";

            var sText = "Hover: " + pageCoords + ", " + clientCoords;
            //$('#subscribe-text').html(sText);
        });
    },

    PostMenuItemClick: function (e, thisElement, parentBlock)
    {
        if (!parentBlock)
        {
            //parentBlock = thisElement.parent().parent();    // OLD

            parentBlock = thisElement.closest("ul");        // NEW
        }

        parentBlock.hide();

        // Wait a while and clear the style altogether
        setTimeout(function ()
        {
            parentBlock.css('display', ''); //.removeAttr('style');
        }, 100);

        e.preventDefault();
        return false;
    },

    MenuClick: function(sDiv)
    {
        var parentBlock = $('#' + sDiv);
        parentBlock.hide();

        // Wait a while and clear the style altogether
        setTimeout(function ()
        {
            parentBlock.removeAttr('style');
        }, 100);
    },

    // Called only for recruiters logins
	SetupHelpToolbarButton: function()
	{
		var bPhone = TriSysApex.Device.isPhone();
        var helpButton = $('#show-contextual-help');

        if (bPhone)
			helpButton.hide();
		else
        {
            // Show help
            helpButton.show();
            helpButton.on('click', function (e)
            {
				// There is no 'help mode' - pressing this button always turns help on
				var bHelpOn = true;
                TriSysApex.TourGuide.StartTourForCurrentForm(bHelpOn);
            });
        }
	},

	SetHelpToolbarButtonMode: function(bHelpOn)
	{
		var helpButton = $('#show-contextual-help');
		helpButton.removeClass().addClass("btn btn-sm btn-" + (bHelpOn ? "danger" : "success"));
	},

    SetupFontSizeToolbarButtons: function()
    {
        // 20 Jun 2023: Disable app-level zooming altogether
        return;

        // Zoom
        var fZoomFactorIncrement = 0.95;
        var fMinZoomFactor = 0.5, fMaxZoomFactor = 3;
        var btnFontSmaller = $('#font-smaller');
        var btnFontLarger = $('#font-larger');

        var bPhone = TriSysApex.Device.isPhone();

        // Font sizing not supported on some browsers
        if (TriSysSDK.Browser.Firefox())
            return;

        // Do not show on phones either
        //if (TriSysApex.Device.isPhone())
        //    return;


        // Show font sizing buttons
        btnFontSmaller.show();
        btnFontLarger.show();

        var fnZoom = function (bIncrease)
        {
            var fZoomFactor = TriSysApex.Device.CurrentZoomFactor * fZoomFactorIncrement;    // Make font smaller 
            if (bIncrease)
                fZoomFactor = TriSysApex.Device.CurrentZoomFactor / fZoomFactorIncrement;    // Make font larger

            TriSysApex.Device.ApplyZoomFactor(fZoomFactor);

            if (fZoomFactor <= fMinZoomFactor)
                btnFontSmaller.hide();
            else
                btnFontSmaller.show();

            if (fZoomFactor >= fMaxZoomFactor)
                btnFontLarger.hide();
            else
                btnFontLarger.show();
        };

        btnFontSmaller.on('click', function (e)
        {
            fnZoom(false);
        });
        btnFontLarger.on('click', function (e)
        {
            fnZoom(true);
        });
    },

    SetupGoogleTranslateWidget: function()
    {
        try
        {
            var translatorEngine = new google.translate.TranslateElement({ pageLanguage: 'en' /*, layout: google.translate.TranslateElement.InlineLayout.SIMPLE*/ }, 'google_translate_element');

            // Catch the language selection because this causes google to f**k up and set the 'top: 40px;' in the <body>
            // 
            var fnFixStupidGoogleTranslateBug = function ()
            {
                $('body').css("top", 0);    // F***ing Google sets the top to 40px!!!
            };

            var setLanguage = function (sLanguageCode)
            {
                // Set the language in our app?
                // This will load the correct resource files.

                // April 2016: Google translate does such a good job that we do not need to spend time and money on resourcing/dev/test
                // Hence keep the language as English (en) and allow google to do on the fly translation.
                //TriSysSDK.Resources.Language = sLanguageCode;

                //TriSysApex.Toasters.Info(sLanguageCode);
                TriSysApex.Logging.LogMessage(sLanguageCode);
            };


            $('.goog-te-combo').change(function (e)
            {
                var sLanguage = this.value;
                setLanguage(sLanguage);
                fnFixStupidGoogleTranslateBug();
            });

            // Force the remove of the google bug after initialisation in case it is a foreign language
            setTimeout(fnFixStupidGoogleTranslateBug, 2000);
        }
        catch (e)
        {
            // Google translate has failed to initialise
            TriSysApex.Logging.LogMessage("Failed to instantiate google translate.");
        }
        
    },

    // Called when we identify the users country and also when we pick up the users last saved language change
    SetTranslationLanguageCode: function (sLanguageCode)
    {
        // It appears that Google translate actually remembers these settings so no need to do this!
        if (sLanguageCode != 'en')
        {
            var fnOverrideLanguage = function ()
            {
                $('.goog-te-combo').val(sLanguageCode);
            };

            setTimeout(fnOverrideLanguage, 2000);
        }
    },

	// User clicked on magnifying glass so show them what they can search for
	MagnifyingGlassPopup: function()
	{
		var searches = [
            { Form: null,					Caption: 'Everything' },
            { Form: 'ContactSearch',		Caption: 'Contacts' },
            { Form: 'CompanySearch',		Caption: 'Companies' }
		];

		var bRecruitmentDatabase = TriSysAPI.Operators.stringToBoolean(TriSysApex.Cache.UserSettingManager.GetValue("RecruitmentDatabase", false));
		if (bRecruitmentDatabase)
        {
            searches.push({ Form: 'RequirementSearch',	Caption: 'Requirements/Vacancies' });
			searches.push({ Form: 'PlacementSearch',	Caption: 'Placements' });
			searches.push({ Form: 'TimesheetSearch',	Caption: 'Timesheets' });
        }

        var entityParameters = new TriSysApex.ModalDialogue.Selection.SelectionParameters();
        entityParameters.Title = "Lookup/Search Category";
        entityParameters.PopulationByObject = searches;
        entityParameters.Columns = [{ field: "Caption", title: "Category", type: "string" }];

        entityParameters.CallbackFunction = function(selectedRow)
        {
            if (!selectedRow)
                return false;

            // Read the fields we require from the selected row
            var sForm = selectedRow.Form;
            if (!sForm)
            {
				setTimeout(function ()
				{
					// Capture a string and push into search box, then start search
					var fnLookup = function (sLookup)
					{
						if(!sLookup)
							return;

						var fnCommenceLookup = function()
						{
							$("#trisys-search").val(sLookup).focus();
							ApexIndexPage.ShowSearchResultsMenu(sLookup);
						};
						setTimeout(fnCommenceLookup, 100);

						return true;
					};

					var sMessage = "Lookup";
					var options = { Label: "Lookup", SaveButtonText: "Search" };
					TriSysApex.ModalDialogue.New.Popup(sMessage, "gi-search", fnLookup, options);

				}, 10);
			}
			else
			{
				setTimeout(function ()
				{
					// Allow popups stack to clear
					TriSysApex.FormsManager.OpenForm(sForm, 0);

				}, 10);
			}

            // Force dialogue to close after selection
            return true;
		};

        TriSysApex.ModalDialogue.Selection.Show(entityParameters);
	},

	ShowSearchResultsMenu: function(sSearchText)		// ApexIndexPage.ShowSearchResultsMenu
    {
		if(sSearchText)
			$('#search-drop-down-results').trigger('click');

        if (sSearchText)
        {
            // Show waiting
            $('#search-drop-down-results-block-waiting-spinner').show();

            var elemList = $('#search-drop-down-results-block-list');
            elemList.hide();
            elemList.empty();

            var iHeight = $(window).height() - 50; // window.innerHeight - 100;
            elemList.css("max-height", iHeight); //max-height: 550px;

            // Commence search now
            ApexIndexPage.SearchInvocation(sSearchText);
        }
    }

};	// ApexIndexPage

var Facebook =
{
    LoadSDK: function()
    {
        try
        {
            window.fbAsyncInit = function ()
            {
                FB.init({
                    appId: '990647181004942',
                    xfbml: true,
                    version: 'v2.6'
                });

                // ADD ADDITIONAL FACEBOOK CODE HERE

                function onLogin(response)
                {
                    if (response.status == 'connected')
                    {
                        FB.api('/me?fields=first_name', function (data)
                        {
                            var welcomeBlock = document.getElementById('fb-welcome');
                            welcomeBlock.innerHTML = 'Hello, ' + data.first_name + '!';
                        });
                    }
                }

                FB.getLoginStatus(function (response)
                {
                    // Check login status on load, and if the user is
                    // already logged in, go directly to the welcome message.
                    if (response.status == 'connected')
                    {
                        onLogin(response);
                    } else
                    {
                        // Otherwise, show Login dialog first.
                        FB.login(function (response)
                        {
                            onLogin(response);
                        }, { scope: 'user_friends, email' });
                    }
                });
            };

        } catch (e)
        {

        }
    }
};


$(document).ready(function ()
{
    // Finish the original themed initialisation for the UI framework
    try
    {
        App.init();
    }
    catch (err)
    {
        alert(err);
    };

    // Legacy code lifted from working Apex - turning on today Sunday 15th Feb 2014

    // 07 May 2022: Tweaked to allow moment() to load before diagnosing connection problems
    var fnLoadDynamically = function ()
    {
        // Load all of the dynamic .js scripts and CSS
        TriSysLoad.ApexFramework.LoadDynamically(function ()
        {
            // The callback function to call after we have determined which load balanced Web API we will be using
            var fnAfterLoadBalancedWebAPIDetermination = function ()
            {
                // Setup the top text search
                ApexIndexPage.initialiseSearch();

                ApexIndexPage.afterLoadDynamically();

                // Load facebook app
                //Facebook.LoadSDK();
            };

            // Identify which Web API we will be using for this subscriber
            TriSysApex.LoadBalancer.IdentifyWebAPI(fnAfterLoadBalancedWebAPIDetermination);
        });
    };

    setTimeout(fnLoadDynamically, 10);
});

// Facebook SDK
//(function (d, s, id)
//{
//    var js, fjs = d.getElementsByTagName(s)[0];
//    if (d.getElementById(id)) { return; }
//    js = d.createElement(s); js.id = id;
//    js.src = "//connect.facebook.net/en_US/sdk.js";
//    fjs.parentNode.insertBefore(js, fjs);
//}(document, 'script', 'facebook-jssdk'));


