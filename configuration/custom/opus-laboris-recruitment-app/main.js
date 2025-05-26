/*
 * Main.js
 * App: "opus-laboris-app
 * Created:  Tuesday 11 July 2017 by Garry Lowther, TriSys Business Software
 *
 * This is a local version of main.js which will be part of the mobile app or mobile web site.
 *
 */

// The module must be called 'ApexCustomPostLoadModule'
var ApexCustomPostLoadModule =
{
    // These are the events to which you can override the behaviour of the custom Apex application

    // Called after Apex framework is (partially) loaded
    PreLogin: function (intelligentRouting)
    {
        debugger;

        // Wipe out existing default apex nav bar with new custom OEM menu structure
        $('#scrollNavBar').empty();

        // Draw the navigation bar and menu items using this project custom forms.json and navbar.json HTML templates
        TriSysApex.NavigationBar.Draw('scrollNavBar', true);

        // Set the Web API Key to customer specific and weld it to session storage
        TriSysApex.Constants.DeveloperSiteKey = '20140625-gl51-1231-wher-opuslaboris.';
        TriSysAPI.Session.SetDeveloperSiteKey(TriSysApex.Constants.DeveloperSiteKey);

        // We may also want to be in WebJobs mode
        TriSysWebJobs.Agency.CustomerID = 'opus-laboris-recruitment';   // Must match the Web API Key, NOT the app ID
        TriSysWebJobs.Constants.ApplicationName = "Opus Laboris Recruitment";
        TriSysApex.Copyright.LongProductDescription = "Recruitment Agency Mobile App";

        // Use the web jobs tags in index.html as the form caption
        $('#webjobs-company-name').html('Opus Laboris Recruitment');
        $('#webjobs-company-website-url-td').remove();
        $('#webjobs-company-telno-td').remove();
        $('#history-add-button-menu-separator').remove();
        $('#app-caption-nav-ul').css('width', '50px');
        $('#webjobs-group-header').show();

        // Cancel the intelligent routing as we want full control
        intelligentRouting.Cancel = true;

        // Our custom form is effectively the home page
        TriSysApex.FormsManager.OpenForm('Welcome', 0, true);

        //document.addEventListener('touchstart', preventPullToRefresh.touchstartHandler);
        //document.addEventListener('touchmove', preventPullToRefresh.touchmoveHandler);
    },

    // Custom hook for login form
    LoginFormLoaded: function ()
    {
        $('#login-form-caption').html('Opus Laboris Recruitment Web App');
        $('#login-form-instructions').html('Please enter your e-mail address and password to log into the Opus Laboris Web Site.');
        $('#login-form-title').html('<strong>Opus Laboris Recruitment Web Application</strong> Login Form');
    }

};

var WelcomeForm =
{
    JobSeekers: function ()
    {
        //TriSysApex.UI.ShowMessage("Job Seekers Form TODO");
        TriSysApex.FormsManager.OpenForm('JobSeekers', 0, true);
    },

    Timesheets: function ()
    {
        TriSysApex.FormsManager.OpenForm('Timesheets', 0, true);
    }
};

// Mimic web jobs connectivity to allow access to vacancy subsystem
var WebJobsConnectivity =
{
    Connect: function(fnCallbackWhenConnected)
    {
        // TriSys Web Jobs initialises its own data services key request every time
        // This will be called before an actual candidate login
        var sDataServicesKey = TriSysAPI.Session.DataServicesKey();
        var bIsConnected = (sDataServicesKey != null);

        if (bIsConnected)
            bIsConnected = TriSysAPI.Data.VerifyDataServicesKey();

        if (!bIsConnected)
        {
            // Do the connection

            var fnCallback = function (CCustomerWebJobsKeyResponse)
            {
                WebJobsConnectivity.AfterConnectionToWebAPI(CCustomerWebJobsKeyResponse, fnCallbackWhenConnected);
            };

            // Asynchronously get the API key and then a data services key before loading the page
            TriSysWebJobs.APIKeys.ReadCustomerKeysFromWebAPIWithCallback(TriSysWebJobs.Agency.CustomerID, true,
                fnCallback,
                function ()
                {
                    TriSysApex.UI.ShowMessage("Unable to find appropriate keys for " + TriSysWebJobs.Agency.CustomerID,
                                                TriSysApex.Copyright.ShortProductName);
                });

            // The callback will commence searching
            return;
        }

        // We are already connected so callback now
        fnCallbackWhenConnected();
    },

    // Called after we have connected to the web API to obtain the data services key
    AfterConnectionToWebAPI: function (CCustomerWebJobsKeyResponse, fnAfterConnectionToAgencyDatabase)
    {
        // Store web keys and validation then connect to correct agency database
        var bCacheStandingData = false;
        TriSysWebJobs.APIKeys.CustomerKeysValidStoreResponse(CCustomerWebJobsKeyResponse, fnAfterConnectionToAgencyDatabase, bCacheStandingData);        
    }
};

var CandidateFunctions =
{
    Apply: function (lRequirementId, sReference, sJobTitle)
    {
        if (!lRequirementId || lRequirementId <= 0)
            return;

        var lstRequirementId = [lRequirementId];

        TriSysWebJobs.VacancyApplications.ApplyToMultipleVacancies(lstRequirementId, sReference, sJobTitle);
    },

    AddToFavourites: function (lRequirementId)
    {
        TriSysWebJobs.Vacancies.AddToFavourites(null, TriSysWebJobs.Vacancies.AfterAddToFavourite, lRequirementId);
    },
    RemoveFromFavourites: function ()
    {
        TriSysApex.UI.ShowMessage("RemoveFromFavourites");
    },

    SendToFriend: function (lRequirementId, sReference, sJobTitle)
    {
        if (!lRequirementId || lRequirementId <= 0)
            return;

        var lstRequirementId = [lRequirementId];

        TriSysWebJobs.Vacancies.SendMultipleVacanciesToFriend(lstRequirementId, sReference, sJobTitle);
    }
};

/**
 * inspired by jdduke (http://jsbin.com/qofuwa/2/edit)
 * https://gist.github.com/sundaycrafts/af0f9ed28de87d496b66
 */
var preventPullToRefresh = (function preventPullToRefresh(lastTouchY)
{
    lastTouchY = lastTouchY || 0;
    var maybePrevent = false;

    function setTouchStartPoint(event)
    {
        lastTouchY = event.touches[0].clientY;
        // console.log('[setTouchStartPoint]TouchPoint is ' + lastTouchY);
    }
    function isScrollingUp(event)
    {
        var touchY = event.touches[0].clientY,
            touchYDelta = touchY - lastTouchY;

        // console.log('[isScrollingUp]touchYDelta: ' + touchYDelta);
        lastTouchY = touchY;

        // if touchYDelta is positive -> scroll up
        if (touchYDelta > 0)
        {
            return true;
        } else
        {
            return false;
        }
    }

    return {
        // set touch start point and check whether here is offset top 0
        touchstartHandler: function (event)
        {
            if (event.touches.length != 1) return;
            setTouchStartPoint(event);
            maybePrevent = window.pageYOffset === 0;
            // console.log('[touchstartHandler]' + maybePrevent);
        },
        // reset maybePrevent frag and do prevent
        touchmoveHandler: function (event)
        {
            if (maybePrevent)
            {
                maybePrevent = false;
                if (isScrollingUp(event))
                {
                    // console.log('======Done preventDefault!======');
                    event.preventDefault();
                    return;
                }
            }
        }
    }
})();

// usage
// document.addEventListener('touchstart', preventPullToRefresh.touchstartHandler);
// document.addEventListener('touchmove', preventPullToRefresh.touchmoveHandler);

// Does not work!!!!
// Instead: https://www.maketecheasier.com/disable-chrome-pull-to-refresh-android/
// This works! But is obviously a manual process, great for testing like a published app.


