// 04 Nov 2022
// Allow smart-client and utilities to easily oAuth using our partner and TriSys Web API
// Lifted from test/oneall.html
// We will typically be used in an iFrame inside Apex
// 29 Nov 2022: Used for Nylas OAuth too 
// 22 Dec 2022: For Apex and Smart-Client

var TriSysAuthentication = {

    // The command line instructions
    Instructions: null,

    // After page loaded
    Load: function()
    {
        // Was intending to load OneAll here however it has some peculiar 'features' which prevent this
        // being loaded this way, hence this code is below this class

        // The cloud vendors in alphabetical order
        var sFacebook = 'facebook', sGoogle = 'google', sLinkedIn = 'linkedin', sMicrosoft = 'windowslive', sTwitter = 'twitter', sApple = 'apple';
        var lstCloudVendors = [sFacebook, sGoogle, sLinkedIn, sMicrosoft, sTwitter, sApple];

        // Process the command line URL which are the instructions we need
        var sURL = window.location.href;
        var iIndex = sURL.indexOf("?");

        if (iIndex > 0)
        {
            sURL = sURL.substring(iIndex + 1);
            console.log("Command line: " + sURL);

            var bOAuthCommandLine = (sURL.indexOf("id=") >= 0 && sURL.indexOf("code=") >= 0);
            console.log("bOAuthCommandLine: " + bOAuthCommandLine);
            if (bOAuthCommandLine)
            {
                //var sWebAPIKey = '20131222-ba09-4e4c-8bcb-apex.web.app';
                var sWebAPIKey = '20241002-re90-9e2c-2904-flexiva.app.';

                var equalParts = sURL.split("=");
                TriSysAuthentication.Instructions = {
                    id: equalParts[1].replace("&code", ""),
                    code: equalParts[2],
                    SiteKey: sWebAPIKey
                }
            }
            else
            {
                var sInstructions = TriSysAPI.Encryption.Base64.decode(sURL);
                console.log("Instructions: " + sInstructions);

                TriSysAuthentication.Instructions = JSON.parse(sInstructions);
            }
            
            if (TriSysAuthentication.Instructions)
            {
                if(TriSysAuthentication.Instructions.id && TriSysAuthentication.Instructions.code)
                {
                    // Nylas OAuth 
                    TriSysAuthentication.Instructions.Header = "OAuth Authentication Successful";
                    TriSysAuthentication.Instructions.Text = "You have successfully authorised TriSys to access your cloud services." +
                        "<br>" + "Connecting you back to TriSys...";
                }
            }

            if(TriSysAuthentication.Instructions)
            {
                if (TriSysAuthentication.Instructions.Header)
                    $('#trisys-header').text(TriSysAuthentication.Instructions.Header);

                if (TriSysAuthentication.Instructions.Text)
                    $('#trisys-instructions').html(TriSysAuthentication.Instructions.Text);

                var removeItemOnce = function(arr, value) {
                    var index = arr.indexOf(value);
                    if (index > -1) {
                        arr.splice(index, 1);
                    }
                    return arr;
                }

                if (TriSysAuthentication.Instructions.HideFacebook)
                    lstCloudVendors = removeItemOnce(lstCloudVendors, sFacebook);

                if (TriSysAuthentication.Instructions.HideGoogle)
                    lstCloudVendors = removeItemOnce(lstCloudVendors, sGoogle);

                if (TriSysAuthentication.Instructions.HideLinkedIn)
                    lstCloudVendors = removeItemOnce(lstCloudVendors, sLinkedIn);

                if (TriSysAuthentication.Instructions.HideMicrosoft)
                    lstCloudVendors = removeItemOnce(lstCloudVendors, sMicrosoft);

                if (TriSysAuthentication.Instructions.HideTwitter)
                    lstCloudVendors = removeItemOnce(lstCloudVendors, sTwitter);

                // The developer site key MUST be passed in as a parameter as a security measure
                if (TriSysAuthentication.Instructions.SiteKey)
                    TriSysAPI.Session.SetDeveloperSiteKey(TriSysAuthentication.Instructions.SiteKey);
            }
        }

        if (bOAuthCommandLine)
        {
            // Send to Web API
            console.log("Calling Web API to exchange tokens...");
            TriSysAuthentication.SendSignalRInstructionToWebAPI(TriSysAuthentication.Instructions.id, TriSysAuthentication.Instructions.code);
            return;
        }

        // Must be driven programmatically 
        if (!TriSysAuthentication.Instructions)
        {
            TriSysAuthentication.ReportEventToUser("You are not permitted to operate this page without credentials.");
            return;
        }

        // When UI is loaded, press the appropriate button
        _oneall.push(['social_login', 'add_event', 'on_widget_loaded', TriSysAuthentication.VendorsLoaded]);

        /* Social Login Example - this does the connection from a button click, but does it in Javascript */
        _oneall.push(['social_login', 'set_providers', lstCloudVendors]);
        _oneall.push(['social_login', 'set_grid_sizes', [1, lstCloudVendors.length]]);
        _oneall.push(['social_login', 'set_event', 'on_login_redirect', TriSysAuthentication.ConnectedEvent]);


        // See https://docs.oneall.com/api/javascript/library/methods/social-login/
        // https://secure.oneallcdn.com/css/api/themes/flat_w188_h32_wc_v1.css
        _oneall.push(['social_login', 'set_custom_css_uri', 'https://secure.oneallcdn.com/css/api/themes/flat_w188_h32_wc_v1.css']);

        // The element where to draw the buttons
        _oneall.push(['social_login', 'do_render_ui', 'trisys_oauth_vendors']);

    },

    // Command line may specify that a specific social network is used, so fire that
    VendorsLoaded: function()
    {
        // Not working as expected so force user to login via clicking one of the buttons
        return;

        // Choose which one to connect to based upon command line
        var sAction = 'do_login'; // do_popup_ui
        if (TriSysAuthentication.Instructions && TriSysAuthentication.Instructions.AutoSelect)
        {
            // New 17 Nov 2022
            // https://trisys.api.oneall.com/socialize/connect/direct/google/?service=social_login&callback_uri=https://api.trisys.co.uk/webhook/postauthentication&force_reauth=true
            var sURL = "https://trisys.api.oneall.com/socialize/connect/direct/" + TriSysAuthentication.Instructions.AutoSelect +
                                "/?service=social_login&callback_uri=https://api.trisys.co.uk/webhook/postauthentication&force_reauth=true";

            //window.location.href = sURL;
            // Oh fuck!
            //  Refused to display 'https://www.facebook.com/' in a frame because it set 'X-Frame-Options' to 'deny'.
            
            // Hacky testing - works i.e.popup closes after 10 seconds
            //sURL = "https://www.bbc.co.uk";

            // Popup a browser window then!
            var iWidth = 900, iHeight = 600, iLeft = (screen.width - iWidth) / 2, iTop = (screen.height - iHeight) / 2;

            var myWin = window.open(sURL, "SocialPopup", "width=" + iWidth + ", height=" + iHeight + ", left=" + iLeft + ", top=" + iTop +
                                                                    ", menubar=no, resizable=yes, scrollbars=no, status=no, location=no");

            // Give user 10 seconds to confirm, which will mimic the SignalR from the server
            setTimeout(function ()
            {
                var sMessage = "You have logged into Facebook";
                TriSysApex.UI.ShowMessage(sMessage);

                myWin.close();      // Will not close!
            }, 10000);



            // None of this stuff worked!
            //// https://docs.oneall.com/api/javascript/library/methods/social-login/#set_popup_usage
            //_oneall.push(['social_login', 'set_popup_usage', 'always']);
            //sAction = 'do_popup_ui';
            //_oneall.push(['social_login', sAction, TriSysAuthentication.Instructions.AutoSelect]);

            //// 10 Nov 2022
            //_oneall.push(['social_login', 'set_event', 'on_login_end', TriSysAuthentication.ConnectedEvent]);
        }

        // Test - does not work!
        //window.top.close();

        // Old code which suffers from error accessing a cross-origin frame
        //find iframe
        //let iframe = $('#trisys_oauth_vendors').children('[id^="oa_social_login_frame_"]');

        ////find button inside iframe
        //let button = iframe.contents().find('#provider_facebook');

        ////trigger button click
        //button.trigger("click");
    },

    ConnectedEvent: function(args)
    {
        var connection_token = args.connection.connection_token;
        var user_token = args.connection.user_token;

        console.log("SUCCESS: You have logged in with " + args.provider.name);

        console.log("connection_token=" + connection_token);
        console.log("user_token=" + user_token);

        TriSysAuthentication.ReportEventToUser("Successfully authenticated against: " + args.provider.name);

        // Call TriSys Web API which already knows what to do with this
        TriSysAuthentication.SendOneAllTokensToWebAPI(args.provider.name, connection_token, user_token);

        /* Return false to cancel the redirection to the callback_uri */
        return false;
    },

    ReportEventToUser: function(sEvent)
    {
        $('#trisys-header').html(sEvent);
        $('#trisys-instructions').hide();
        $('#trisys_oauth_vendors').hide();

        // Debug logging
        var sDebugCommentary = "TriSysAuthentication.ReportEventToUser: " + sEvent;
        TriSysAuthentication.DebugLogMessage(sDebugCommentary);
    },

    // 10 Oct 2023: Lite version of TriSysApex.DebugLogging
    DebugLogMessage: function(sMessage)
    {
        TriSysAPI.Data.IPAddress(true, null, function (sIPAddress) 
        {
            var sApp = "Apex OAuth", sProcess = "SignalR";
            TriSysAPI.DebugLogging.On = true;
            TriSysAPI.DebugLogging.Write(sApp, sProcess, sIPAddress, sMessage);
        });
    },

    // User is not logged in, so this Web API function needs to be available in this case
    SendOneAllTokensToWebAPI: function (sCloudProvider, sConnectionToken, sUserToken)
    {
        // There may be some context from the orchestrator about this workflow
        var sContext = null, sWorkflowID = null;

        if (TriSysAuthentication.Instructions && TriSysAuthentication.WorkflowID)
            sWorkflowID = TriSysAuthentication.WorkflowID;
        if (TriSysAuthentication.Instructions && TriSysAuthentication.Context)
            sContext = TriSysAuthentication.Context;

        // Data to pass to Web API
        var CExternalCloudServiceAuthenticationRequest =
        {
            WorkflowID: sWorkflowID,
            Context: sContext,
            ProviderName: sCloudProvider,
            ConnectionToken: sConnectionToken,
            UserToken: sUserToken
        };

        var payloadObject = {};

        payloadObject.URL = 'SocialNetwork/ExternalCloudServiceAuthentication';
        payloadObject.OutboundDataPacket = CExternalCloudServiceAuthenticationRequest;
        payloadObject.InboundDataFunction = function (CExternalCloudServiceAuthenticationResponse)
        {
            if (CExternalCloudServiceAuthenticationResponse)
            {
                if (CExternalCloudServiceAuthenticationResponse.Success)
                {
                    var sUserDetails = "Service: " + CExternalCloudServiceAuthenticationResponse.CloudService + "<br>" +
                                        "Full Name: " + CExternalCloudServiceAuthenticationResponse.FullName + "<br>" +
                                        "E-Mail: " + CExternalCloudServiceAuthenticationResponse.EMailAddress;
                    TriSysAuthentication.ReportEventToUser(sUserDetails);

                    if (TriSysAuthentication.Instructions && TriSysAuthentication.CallbackFunction)
                    {
                        // We must callback this function to take any further action
                        // This is not expected to be used unless we are embedded in Apex!
                        TriSysApex.DynamicClasses.CallFunction(TriSysAuthentication.CallbackFunction, CExternalCloudServiceAuthenticationResponse);
                    }
                    return;
                }
                else
                {
                    TriSysAuthentication.ReportEventToUser(CExternalCloudServiceAuthenticationResponse.ErrorMessage);
                }
            }
        };

        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    // Nylas has called this callback page so we must now quickly call Web API to send a SignalR
    // to the specified user in order to exchange the code for a token and then
    // we close this popup window
    SendSignalRInstructionToWebAPI: function (sRecipientID, sExchangeableCode)
    {
        // Data to pass to Web API
        var COrchestrateOAuthKeyExchangeRequest =
        {
            SignalRRecipient: sRecipientID,
            Code: sExchangeableCode
        };

        var payloadObject = {};

        // 29 Nov 2022: TEST START
        //TriSysAPI.Constants.SecureURL = "http://54.75.23.118:45455/";
        // 29 Nov 2022: TEST END

        payloadObject.URL = 'CloudSync/OrchestrateOAuthKeyExchange';
        payloadObject.OutboundDataPacket = COrchestrateOAuthKeyExchangeRequest;

        // Debug logging
        var sDebugCommentary = "Calling TriSys Web API: " + payloadObject.URL + " passing in Nylas token: " + sExchangeableCode +
            " in order to exchange keys and send a SignalR to: " + sRecipientID + "...";
        TriSysAuthentication.DebugLogMessage(sDebugCommentary);

        payloadObject.InboundDataFunction = function (COrchestrateOAuthKeyExchangeResponse)
        {
            if (COrchestrateOAuthKeyExchangeResponse)
            {
                if (COrchestrateOAuthKeyExchangeResponse.Success)
                {
                    // This popup window will be closed by Apex when it receives the SignalR communique
                    sDebugCommentary = "Successfully returned from TriSys Web API: " + payloadObject.URL + ". We should be closed by a SignalR?";

                    // Debug logging
                    TriSysAuthentication.DebugLogMessage(sDebugCommentary);
                }
                else
                {
                    TriSysAuthentication.ReportEventToUser(COrchestrateOAuthKeyExchangeResponse.ErrorMessage);
                }
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error) {
            TriSysAuthentication.ReportEventToUser('TriSysAuthentication.SendSignalRInstructionToWebAPI: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysAPI.Data.PostToWebAPI(payloadObject);
    }

};

// We know that we are now loaded and can get to work
$(document).ready(function ()
{
    TriSysAuthentication.Load();
});

// OneAll

// OneAll code has to be loaded like this for some unknown reason!
/* Replace the subdomain with your own subdomain from a Site in your OneAll account */
var oneall_subdomain = 'trisys';

/* Asynchronously load the library */
var oa = document.createElement('script');
oa.type = 'text/javascript'; oa.async = true;
oa.src = '//' + oneall_subdomain + '.api.oneall.com/socialize/library.js'
var s = document.getElementsByTagName('script')[0];
s.parentNode.insertBefore(oa, s)

/* Initialise the asynchronous queue */
var _oneall = _oneall || [];

/* True: Always force re-authentication */
_oneall.push(['social_login', 'set_force_re_authentication', true]);

//return;

