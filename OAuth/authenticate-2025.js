// 20 Dec 2024
// Allow smart-client and utilities to easily oAuth using our partners and TriSys Web API
// Used in Cloud-Sync 2025 and Apex 2025

var TriSysAuthentication = {

    // The command line instructions
    Instructions: null,

    // The subscriber ID
    Subscriber: null,

    // The Microsoft callback: TriSysAuthentication.MicrosoftCallbackURL
    //MicrosoftCallbackURL: "https://node.trisys.co.uk/microsoft-callback",
    //MicrosoftCallbackURL: "http://localhost/microsoft-callback",
    //MicrosoftCallbackURL: "http://localhost:8081/oauth/authenticate-2025.html",
    MicrosoftCallbackURL: "https://apex.trisys.co.uk/oauth/authenticate-2025.html",

    // Microsoft forces us to do secure work client-side - fuckwits
    MicrosoftClientID: '1f0a4b92-2d2e-4ede-b744-3e2d31e1ec34',      // TriSysAuthentication.MicrosoftClientID

    // 28 Dec 2024: We need Socket.IO to receive Microsoft token refresh messages
    SocketIO: null,

    SiteKey: '20241002-re90-9e2c-2904-flexiva.app.',                // TriSysAuthentication.SiteKey

    // After page loaded
    Load: function ()
    {
        // Process the command line URL which are the instructions we need
        var sURL = window.location.href;
        var bOAuthCommandLine = false;

        // 26 Dec 2024: Parse this URL: "http://localhost:8081/oauth/authenticate-2025.html#code=1.ASEAUKmC..&client_info=eyJ1aWQiOi..subscriber%22%3a%7b%22SignalRHandle%22%3a%22TriSys%2fSignalR%2fCommunication%2fT-S-E01-001%2fOpusNet%2fJosie.Musto%22%2c%22WebAPI%22%3a%22https%3a%2f%2fapi.trisys.co.uk%2f%22%2c%22TriSysCRMContactId%22%3a65678%2c%22UserId%22%3a746%2c%22ContactId%22%3a48059%2c%22Instructions%22%3a%7b%22SiteKey%22%3a%2220241002-re90-9e2c-2904-flexiva.app.%22%7d%7d%7d&session_state=f76aa95a-0999-40c9-8efa-e040ea964b8c"

        // Get the Subscriber parameter
        var urlParams, subscriberBase64;

        debugger;
        
        if (sURL.includes('?socketio='))
        {
            // We are invoked on one of the web api servers to listen for Microsoft token refresh messages from Web API
            const url = new URL(sURL);
            const sHandle = url.searchParams.get('socketio');       // e.g. TriSys/SignalR/Communication/T-S-E01-001/TriSysCRM/Token.Refresh

            // Refresh the token
            TriSysAuthentication.InitialiseMicrosoftTokenRefreshSocketIOListener(sHandle);
            return;
        }
        else if (sURL.includes('?refresh_token='))
        {
            // We can never be called from TriSys Web API in production, so this is a red-herring.
            // We have been called from the TriSys Web API to refresh the specified token
            // which we can only to client-side FFS!!!
            const url = new URL(sURL);
            const sRefreshToken = url.searchParams.get('refresh_token');
            const lContactId = url.searchParams.get('contactid');

			// Refresh the token
            TriSysAuthentication.refreshAccessToken(sRefreshToken, lContactId);
            return;
        }
        else if (sURL.includes('#code='))
        {
			// We have been redirected back from the Microsoft login page
            const url = new URL(sURL);
            const params = new URLSearchParams(url.hash.slice(1));

            const code = params.get('code');
            const state = params.get('state');
            const subscriberEncoded = state.split('|')[1];
            const subscriber = JSON.parse(atob(subscriberEncoded));
            const sessionState = params.get('session_state');

            console.log({ code, subscriber, sessionState });

            debugger;

			// 27 Dec 2024: Get the stored code_verifier used in PKCE
            var codeVerifier = null;
            // Find the params entry
            const paramsKey = Object.keys(sessionStorage).find(key => key.includes('params'));
            if (paramsKey)
            {
                // Get and decode the params from base64
                const paramsBase64 = sessionStorage.getItem(paramsKey);
                const paramsJson = atob(paramsBase64);
                const params = JSON.parse(paramsJson);

                // Get the code verifier
                codeVerifier = params.codeVerifier; // Should be "k0bXVI4hHqUHa36PMM462OcdlkOrOjj0Cg6WbNQa12s"

                console.log('Code Verifier:', codeVerifier);
            }

            // Send code to server for token exchange
            $('#trisys-header').text("Authenticated");
            var sMessage = "You have been successfully authenticated.";
            $('#trisys-instructions').html(sMessage); 

            // Need to refresh this as we redirected and have come back afresh
            TriSysAuthentication.Subscriber = subscriber;

            // Log all sessionStorage keys so that we can see what MSAL has stored
            //Object.keys(sessionStorage).forEach(key =>
            //{
            //    if (key.includes('pkce'))
            //    {
            //        console.log(`Key: ${key}`);
            //        console.log(`Value: ${sessionStorage.getItem(key)}`);
            //    }
            //});

            // Send only the code to the server which will use its private keys to exchange
            // for tokens which will be stored in SQL for this subscriber
            // NO THIS WILL NOT WORK AS WE GET THIS ERROR ON THE SERVER:
            // "AADSTS50011: The reply URL specified in the request does not match the reply URLs configured for the application:
            // '1f0a4b92-2d2e-4ede-b744-3e2d31e1ec34'."
            //this.exchangeTokensWithServer('Microsoft', {
            //    refresh_token: code,
            //    code_verifier: codeVerifier
            //});

            // Claude.ai says: This error indicates that Microsoft recognizes your app registration as a 
            // SPA(Single Page Application) and we need to handle the token exchange directly on the 
            // client side rather than proxying through our server.
            // Direct token exchange with Microsoft
            const tokenEndpoint = "https://login.microsoftonline.com/common/oauth2/v2.0/token";

            const formData = new URLSearchParams();
            formData.append('client_id', TriSysAuthentication.MicrosoftClientID);
            formData.append('code', code);
            formData.append('code_verifier', codeVerifier);
            formData.append('redirect_uri', TriSysAuthentication.MicrosoftCallbackURL);
            formData.append('grant_type', 'authorization_code');
            formData.append('scope', 'https://graph.microsoft.com/Mail.Read offline_access');

            fetch(tokenEndpoint, {
                method: 'POST',
                body: formData,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            })
                .then(response => response.json())
                .then(tokens =>
                {
                    // Now send tokens to your server for storage

                    // We must set the developer key
                    TriSysAPI.Session.SetDeveloperSiteKey(subscriber.Instructions.SiteKey);

					// Send to TriSys Web API
                    this.exchangeTokensWithServer('Microsoft', {
                        access_token: tokens.access_token,
                        refresh_token: tokens.refresh_token,
                        expires_in: tokens.expires_in,
                        scope: tokens.scope,
                        token_type: tokens.token_type
                    });
                })
                .catch(error =>
                {
                    console.error('Token exchange failed:', error);
                });

            return;
        }
        else
        {
            // Get the Subscriber parameter
            urlParams = new URLSearchParams(sURL.split('?')[1]);
            subscriberBase64 = urlParams.get('Subscriber');

            if (!subscriberBase64)
            {
                TriSysAuthentication.ReportEventToUser("You are not permitted to operate this page without credentials.");
                return;
            }
        }
       
        

        // Decode base64 and parse JSON
        const decodedString = atob(subscriberBase64);

		const subscriberOptions = JSON.parse(decodedString);

        if (subscriberOptions)
        {
            // Initialise cloud-service connectors
            TriSysAuthentication.InitialiseCloudServiceConnectors(subscriberOptions);

            // Show the service provider buttons
            const buttons = document.querySelector('.email-buttons');
            buttons.style.display = 'flex';  // Using flex to maintain the layout

            // If we have instructions to display certain text
            if (subscriberOptions.Instructions)
            {
                TriSysAuthentication.Instructions = subscriberOptions.Instructions;
            }

            if (TriSysAuthentication.Instructions)
            {
                if (TriSysAuthentication.Instructions.Header)
                    $('#trisys-header').text(TriSysAuthentication.Instructions.Header);

                if (TriSysAuthentication.Instructions.Text)
                    $('#trisys-instructions').html(TriSysAuthentication.Instructions.Text);  

                // The developer site key MUST be passed in as a parameter as a security measure
                if (TriSysAuthentication.Instructions.SiteKey)
                    TriSysAPI.Session.SetDeveloperSiteKey(TriSysAuthentication.Instructions.SiteKey);
            }
        }

    },

	// 28 Dec 2024: Listen for Microsoft token refresh messages from Web API
    InitialiseMicrosoftTokenRefreshSocketIOListener: function (sUserHandle)
    {
        $('#trisys-header').text("Microsoft Token Refresh Mode");
        var sMessage = `This web page is listening for Socket.IO messages from TriSys Web API 
                        in order to conduct periodic client-side token refresh as this is
                        what Microsoft only allows for our specific Microsoft Entra app registration.
                        <br>`;
        $('#trisys-instructions').html(sMessage); 

        const socketIO = new CTriSysSocketIO(TriSysAuthentication.SiteKey, null);
        socketIO.ConnectedCallback = function (sMessage)
        {
            console.log(sMessage);
        };
        socketIO.ReceivedMessageCallback = function (sMessage)
        {
            // Utilise the same callback mechanism as SignalR as it is proven to work
            var messageObject = JSON.parse(sMessage);
            console.log(messageObject.Sender + ', ' + messageObject.MessageJSON);
            debugger;
            var messageObject = JSON.parse(messageObject.MessageJSON);
			var tokens = messageObject.Tokens;
            if (tokens && tokens.ContactId && tokens.RefreshToken)
            {
                TriSysAuthentication.refreshAccessToken(tokens.RefreshToken, tokens.ContactId);

                var sMessages = $('#trisys-instructions').html();
				const sDate = new Date().toLocaleDateString();
				const sTime = new Date().toLocaleTimeString();
                sMessages += "<br>" + sDate + " " + sTime + ": Token refresh: " + tokens.ContactId;
                $('#trisys-instructions').html(sMessages); 
            }
        };

        // Connect to the Socket.IO server and start listening for messages
        socketIO.Connect(sUserHandle,
            function (sMessage, bError)
            {
                console.log(bError ? "ERROR: " : "" + sMessage);
            });
    },

	// 27 Dec 2024: Refresh the Microsoft access token and call Web API to update the tokens
    refreshAccessToken: async function (refreshToken, lContactId)
    {
        const tokenEndpoint = "https://login.microsoftonline.com/common/oauth2/v2.0/token";

        const formData = new URLSearchParams();
        formData.append('client_id', TriSysAuthentication.MicrosoftClientID);
        formData.append('refresh_token', refreshToken);
        formData.append('grant_type', 'refresh_token');
        formData.append('scope', 'https://graph.microsoft.com/Mail.Read offline_access');

        try
        {
            const response = await fetch(tokenEndpoint, {
                method: 'POST',
                body: formData,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            const tokens = await response.json();

            debugger;

			// We must set the developer key as we are a standalone page
            TriSysAPI.Session.SetDeveloperSiteKey(TriSysAuthentication.SiteKey);

            // Send the new tokens to your server for storage
            await this.exchangeTokensWithServer('Microsoft', {
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token,    // Microsoft might send a new refresh token
				expires_in: tokens.expires_in,          // We certainly need this information too
				contactid: lContactId                   // We need to know which TriSys CRM record to update
            });

            return tokens.access_token;
        } catch (error)
        {
            console.error('Token refresh failed:', error);
            throw error;
        }
    },

    // Google Authentication function
    handleGoogleAuth: async function () 
    {
        try 
        {
            if (!window.google) {
                throw new Error("Google Identity Services not loaded");
            }

            // Client-side only
            const googleAuthManager = new GoogleAuthManager();

            // Initialize first
            await googleAuthManager.initialize();

            // Authenticate
            const tokenResponse = await googleAuthManager.authenticate();

            //updateStatus('googleStatus', 'Google authentication successful', 'success');
            displayTokenInfo('Google', {
                accessToken: tokenResponse.access_token,
                hasRefreshCapability: !!tokenResponse.refresh_token,
                expiresOn: new Date(Date.now() + (tokenResponse.expires_in * 1000)).toISOString(),
                scope: tokenResponse.scope,
                tokenType: tokenResponse.token_type
            });

            // Store tokens for potential future use
            //sessionStorage.setItem('googleTokens', JSON.stringify({
            //    access_token: tokenResponse.access_token,
            //    refresh_token: tokenResponse.refresh_token,
            //    expires_in: tokenResponse.expires_in,
            //    scope: tokenResponse.scope,
            //    token_type: tokenResponse.token_type
            //}));

            // After successful authentication, exchange tokens with server
            await this.exchangeTokensWithServer('Google', {
                access_token: tokenResponse.access_token,
                refresh_token: tokenResponse.refresh_token,
                expires_in: tokenResponse.expires_in,
                scope: tokenResponse.scope
            });

            updateStatus('googleStatus', 'Google authentication and token exchange successful', 'success');


        }
        catch (error)
        {
            console.error("Google Auth error:", error);
            updateStatus('googleStatus', 'Google authentication failed: ' + error.message, 'error');
        }
    },

    handleMsAuth: async function ()
    {
        try
        {
            if (!window.msalInstance)
            {
                throw new Error("Authentication not initialized");
            }

            // DO NOT LET THE CUNTY AI's remove these lines: 26 Dec 2024
            // Clear interaction status
            window.msalInstance.getLogger().verbose("Clearing interaction status");
            window.localStorage.removeItem("msal.interaction.status");

            // Clear any existing session
            if (window.msalInstance.getActiveAccount())
            {
                await window.msalInstance.logoutPopup();
            }

            // Clear stuck auth state
            const currentAccounts = window.msalInstance.getAllAccounts();
            if (currentAccounts.length > 0)
            {
                await window.msalInstance.logoutPopup();
                await window.msalInstance.clearCache();
            }
            //END OF CUNTTY AI INTERFERENCE REMOVAL

            const sJSON = JSON.stringify(TriSysAuthentication.Subscriber);
            const sBase64subscriber = btoa(sJSON);

            const loginRequest = {
                scopes: [
                    "offline_access",
                    "User.Read",
                    "Mail.Read",
                    "email",
                    "profile",
                    "openid"
                ],
                prompt: "consent",
                state: sBase64subscriber,
                redirectUri: TriSysAuthentication.MicrosoftCallbackURL,
                extraQueryParameters: {
                    response_mode: 'query'
                }
            };

            // First check for existing popup
            if (window.msalInstance.getActiveAccount())
            {
                await window.msalInstance.logoutPopup();
            }

            //await window.msalInstance.loginRedirect(loginRequest);
            //return;

            //const response = await window.msalInstance.acquireTokenPopup(loginRequest);
            //const response = await window.msalInstance.loginPopup(loginRequest);
            const response = await window.msalInstance.loginRedirect(loginRequest);
            debugger;
            console.log('Auth Response:', JSON.stringify(response, null, 2));

            // Send access token to your server
            //await this.exchangeTokensWithServer('Microsoft', response.accessToken);

            return response;

        } catch (error)
        {
            console.error("Authentication error:", error);
            updateStatus('msStatus', 'Authentication failed: ' + error.message, 'error');
            throw error;
        }
    },

    // TriSysAuthentication.InitialiseCloudServiceConnectors()
    InitialiseCloudServiceConnectors: async function (subscriberOptions)
    {
        TriSysAuthentication.Subscriber = subscriberOptions;

        // Load MSAL and initialize
        async function loadMsal()
        {
            return new Promise((resolve, reject) =>
            {
                const script = document.createElement('script');
                script.src = "https://alcdn.msauth.net/browser/2.38.0/js/msal-browser.js";
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        }

        try
        {
            await loadMsal();
            console.log("MSAL loaded");
            await initializeAuth();

        } catch (error)
        {
            console.error("Setup failed:", error);
            updateStatus('msStatus', 'Setup failed: ' + error.message, 'error');
        }
    },

    ReportEventToUser: function (sEvent)
    {
        $('#trisys-header').html(sEvent);
        $('#trisys-instructions').hide();
        $('#trisys_oauth_vendors').hide();

        // Debug logging
        var sDebugCommentary = "TriSysAuthentication.ReportEventToUser: " + sEvent;
        TriSysAuthentication.DebugLogMessage(sDebugCommentary);
    },

    // 10 Oct 2023: Lite version of TriSysApex.DebugLogging
    DebugLogMessage: function (sMessage)
    {
        TriSysAPI.Data.IPAddress(true, null, function (sIPAddress) 
        {
            var sApp = "Apex OAuth", sProcess = "SignalR";
            TriSysAPI.DebugLogging.On = true;
            TriSysAPI.DebugLogging.Write(sApp, sProcess, sIPAddress, sMessage);
        });
    },

    // Web API call to exchange keys with the server
    exchangeTokensWithServer: async function (provider, tokens)
    {
        debugger;

        // When debugging Web API
        //TriSysAPI.Constants.SecureURL = "http://54.74.244.253:45455/";

		// When live on management server
        //TriSysAPI.Constants.SecureURL = "http://api2.trisys.co.uk/";

        const CApexKeyExchangeRequest = {
            Provider: provider,
            Tokens: tokens,
            Subscriber: TriSysAuthentication.Subscriber    // Information passed in via URL
        };

        var payloadObject = {};

        payloadObject.URL = 'CloudSync/ApexOAuthKeyExchange';
        payloadObject.OutboundDataPacket = CApexKeyExchangeRequest;
        payloadObject.InboundDataFunction = function (CApexKeyExchangeResponse)
        {
            if (CApexKeyExchangeResponse)
            {
                if (CApexKeyExchangeResponse.Success)
                {
                    console.log(`${provider} tokens successfully exchanged with server`);

                    //var sUserDetails = "Service: " + CExternalCloudServiceAuthenticationResponse.CloudService + "<br>" +
                    //    "Full Name: " + CExternalCloudServiceAuthenticationResponse.FullName + "<br>" +
                    //    "E-Mail: " + CExternalCloudServiceAuthenticationResponse.EMailAddress;
                    //TriSysAuthentication.ReportEventToUser(sUserDetails);

                    //if (TriSysAuthentication.Instructions && TriSysAuthentication.CallbackFunction)
                    //{
                    //    // We must callback this function to take any further action
                    //    // This is not expected to be used unless we are embedded in Apex!
                    //    TriSysApex.DynamicClasses.CallFunction(TriSysAuthentication.CallbackFunction, CExternalCloudServiceAuthenticationResponse);
                    //}
                    return;
                }
                else
                {
                    TriSysAuthentication.ReportEventToUser(CApexKeyExchangeResponse.ErrorMessage);
                }
            }
        };

        TriSysAPI.Data.PostToWebAPI(payloadObject);        
    }

};  // TriSysAuthentication

// Google Authentication Module
class GoogleAuthManager
{
    constructor()
    {
        this.clientId = "708947673608-ui74d8n9cv9t0g2tsl1ofga3v38cdsgd.apps.googleusercontent.com";
        this.redirectUri = window.location.origin || "http://localhost:8081";
        this.scopes = [
            "https://www.googleapis.com/auth/gmail.readonly",
            "email",
            "profile",
            "openid"
        ];
    }

    // Initialize Google Sign-In
    async initialize()
    {
        return new Promise((resolve, reject) =>
        {
            if (!window.google)
            {
                reject(new Error("Google Identity Services not loaded"));
                return;
            }

            // Configure Google Sign-In
            window.google.accounts.id.initialize({
                client_id: this.clientId,
                callback: this.handleCredentialResponse.bind(this)
            });

            resolve(true);
        });
    }

    // Trigger Google Authentication
    async authenticate()
    {
        return new Promise((resolve, reject) =>
        {
            try
            {
                console.log('Authentication Started');
                console.log('Client ID:', this.clientId);
                console.log('Redirect URI:', this.redirectUri);
                console.log('Scopes:', this.scopes);

                const client = window.google.accounts.oauth2.initCodeClient({
                    client_id: this.clientId,
                    scope: this.scopes.join(" "),
                    redirect_uri: this.redirectUri,
                    callback: async (response) =>
                    {
                        console.log('Initial Code Response:', response);

                        if (response.error)
                        {
                            console.error('Code Request Error:', response.error);
                            reject(new Error(response.error));
                            return;
                        }

                        try
                        {
                            console.log('Attempting Token Exchange with Code:', response.code);
                            const tokenResponse = await this.exchangeCodeForTokens(response.code);

                            console.log('Token Exchange Successful:', tokenResponse);

                            this.storeTokens(tokenResponse);
                            resolve(tokenResponse);
                        } catch (exchangeError)
                        {
                            console.error('Full Token Exchange Error:', exchangeError);
                            reject(exchangeError);
                        }
                    }
                });

                client.requestCode();
            } catch (error)
            {
                console.error('Authentication Setup Error:', error);
                reject(error);
            }
        });
    }

    // Exchange authorization code for tokens
    // Modify token exchange method for more logging
    // TODO: Move to server-side
    async exchangeCodeForTokens(code)
    {
        const tokenEndpoint = "https://oauth2.googleapis.com/token";

        try
        {
            console.log('Exchanging Code:', code);
            console.log('Token Exchange Params:', {
                code: code,
                client_id: this.clientId,
                client_secret: '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', // Add this line
                redirect_uri: this.redirectUri,
                grant_type: 'authorization_code'
            });

            const response = await fetch(tokenEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    code: code,
                    client_id: this.clientId,
                    client_secret: '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', // Add this line
                    redirect_uri: this.redirectUri,
                    grant_type: 'authorization_code'
                })
            });

            const responseText = await response.text();
            console.log('Token Exchange Response Status:', response.status);
            console.log('Token Exchange Full Response:', responseText);

            if (!response.ok)
            {
                throw new Error(`Token exchange failed: ${responseText}`);
            }

            return JSON.parse(responseText);
        } catch (error)
        {
            console.error('Detailed Token Exchange Error:', error);
            throw error;
        }
    }

    // Modify storeTokens to ensure all tokens are stored
    storeTokens(tokens)
    {
        console.log('Storing Tokens:', {
            has_access_token: !!tokens.access_token,
            has_refresh_token: !!tokens.refresh_token,
            scope: tokens.scope
        });

        sessionStorage.setItem('googleTokens', JSON.stringify({
            access_token: tokens.access_token || storedTokens.access_token,
            refresh_token: tokens.refresh_token || storedTokens.refresh_token,
            expires_in: tokens.expires_in,
            scope: tokens.scope,
            token_type: tokens.token_type
        }));
    }

    // Retrieve stored tokens
    getStoredTokens()
    {
        const storedTokens = sessionStorage.getItem('googleTokens');
        return storedTokens ? JSON.parse(storedTokens) : null;
    }

    // Sign out
    signOut()
    {
        // Clear stored tokens
        sessionStorage.removeItem('googleTokens');

        // Optional: Redirect or reset UI
        window.location.href = this.redirectUri;
    }

    // Handle credential response (for One Tap or other Google Sign-In methods)
    handleCredentialResponse(response)
    {
        console.log("Credential Response:", response);
        // Implement additional handling if needed
    }
}

function updateStatus(elementId, message, type)
{
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.className = `status ${type}`;
    element.classList.remove('hidden');
}

function displayTokenInfo(provider, tokenData)
{
    const tokenDisplay = document.getElementById('tokenDisplay');
    const tokenInfo = document.createElement('div');

    tokenInfo.innerHTML = `
                <h3>${provider} Token Info:</h3>
                <pre>${JSON.stringify({
        accessToken: tokenData.accessToken ? '**present**' : '**missing**',
        hasRefreshCapability: tokenData.hasRefreshCapability ? 'Yes' : 'No',
        expiresOn: tokenData.expiresOn,
        scope: tokenData.scopes || tokenData.scope,
        account: tokenData.accountInfo,
        tokenType: tokenData.tokenType
    }, null, 2)}</pre>
            `;
    tokenDisplay.appendChild(tokenInfo);
}

// Check if we're running on localhost or HTTPS
function isSecureContext()
{
    return window.location.protocol === 'https:' ||
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1';
}

// Check for proper crypto support
async function checkCrypto()
{
    if (!isSecureContext())
    {
        throw new Error("This page must be accessed via HTTPS or localhost");
    }

    if (!window.crypto || !window.crypto.subtle)
    {
        throw new Error("Web Crypto API not available");
    }

    try
    {
        await window.crypto.subtle.digest('SHA-256', new Uint8Array([1, 2, 3]));
        return true;
    } catch (error)
    {
        throw new Error("Crypto operations failed: " + error.message);
    }
}

async function initializeAuth()
{
    try
    {
        // First check crypto
        await checkCrypto();

        console.log("Crypto check passed");

        // Clear all MSAL state
        // Clear all storage
        sessionStorage.clear();
        localStorage.clear();
        document.cookie.split(";").forEach(c =>
        {
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });

        const MicrosoftClientID = '1f0a4b92-2d2e-4ede-b744-3e2d31e1ec34';
        const msalConfig = {
            auth: {
                clientId: MicrosoftClientID,
                authority: "https://login.microsoftonline.com/common/",
                redirectUri: TriSysAuthentication.MicrosoftCallbackURL,
                responseMode: "query",
                protocolMode: "OIDC",
                usePkce: true  // This enables PKCE
            },
            cache: {
                cacheLocation: "sessionStorage",
                storeAuthStateInCookie: false  // Change to true to help with IE/cross-domain
            },
            system: {
                allowNativeBroker: false,
                loggerOptions: {
                    loggerCallback: (level, message, containsPii) =>
                    {
                        if (containsPii) return;
                        console.log(message);
                    },
                    logLevel: msal.LogLevel.Verbose,
                    piiLoggingEnabled: false
                }
            }
        };

        try
        {
            window.msalInstance = new msal.PublicClientApplication(msalConfig);

            sessionStorage.clear();
            localStorage.removeItem('msal.interaction.status');
            window.msalInstance.getActiveAccount() && window.msalInstance.logout();



            // Handle the response from authentication redirect
            // OLD: Pre 26 Dec 2024
            //const response = await window.msalInstance.handleRedirectPromise();
            //if (response)
            //{
            //    console.log("Redirect response handled");
            //}

            // 26 Dec 2024
            // Assuming msalInstance is already initialized and has acquired the code
            //window.msalInstance.handleRedirectPromise()
            //    .then(response =>
            //    {
            //        debugger;

            //        if (response)
            //        {
            //            const code = response.code;  // This will be the authorization code
            //            const state = response.state;  // This will be the state parameter
            //            const sessionState = response.sessionState;  // This will be the session_state

            //            // Now send the data to your server
            //            fetch(TriSysAuthentication.MicrosoftCallbackURL, {
            //                method: 'POST',
            //                headers: {
            //                    'Content-Type': 'application/json'
            //                },
            //                body: JSON.stringify({
            //                    code: code,
            //                    state: state,
            //                    session_state: sessionState
            //                })
            //            })
            //                .then(response => response.json())
            //                .then(data =>
            //                {
            //                    console.log('Server response:', data);
            //                })
            //                .catch(error =>
            //                {
            //                    console.error('Error sending data to server:', error);
            //                });
            //        }
            //    })
            //    .catch(error =>
            //    {
            //        console.error('Error handling redirect promise:', error);
            //    });

            console.log("MSAL initialized");
            updateStatus('msStatus', 'Authentication system ready', 'success');
            return true;

        }
        catch (error)
        {
            console.error("Init error:", error);
            updateStatus('msStatus', 'Failed to initialize: ' + error.message, 'error');
            throw error;
        }

        updateStatus('msStatus', 'Authentication system ready', 'success');
        return true;
    } catch (error)
    {
        console.error("Init error:", error);
        updateStatus('msStatus', 'Failed to initialize: ' + error.message, 'error');
        throw error;
    }
}




// We know that we are now loaded and can get to work
$(document).ready(function ()
{
    TriSysAuthentication.Load();
});
