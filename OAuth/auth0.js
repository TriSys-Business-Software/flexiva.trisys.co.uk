var TriSysAuth0 = {
    Config: {
        domain: "dev-trisys.uk.auth0.com",
        clientId: "l17LBFn8r12iDYd4Xw9QIcPmSzu67LXp"
    },
    auth0Client: null,

    Load: function ()
    {
        console.log("Checking for Auth0 SPA SDK...");

        var attempts = 0;
        var maxAttempts = 50;

        var checkAndInit = async function ()
        {
            attempts++;
            console.log("Attempt", attempts, "- Checking for window.auth0...");

            if (window.auth0 && window.auth0.createAuth0Client)
            {
                console.log("✅ Auth0 SPA SDK found, creating client...");

                try
                {
                    TriSysAuth0.auth0Client = await window.auth0.createAuth0Client({
                        domain: TriSysAuth0.Config.domain,
                        clientId: TriSysAuth0.Config.clientId,
                        authorizationParams: {
                            redirect_uri: window.location.origin
                        },
                        cacheLocation: 'memory'  // Don't persist across page loads
                    });

                    console.log("✅ Auth0 client created successfully");
                } catch (err)
                {
                    console.error("❌ Failed to create Auth0 client:", err);
                }

                return true;
            } else if (attempts >= maxAttempts)
            {
                console.error("❌ Auth0 SPA SDK not available after", maxAttempts, "attempts");
                return true;
            }

            return false;
        };

        checkAndInit().then(success =>
        {
            if (!success)
            {
                var interval = setInterval(async function ()
                {
                    const success = await checkAndInit();
                    if (success)
                    {
                        clearInterval(interval);
                    }
                }, 100);
            }
        });
    },

    Login: async function (fnAuthenticated)
    {
        if (!TriSysAuth0.auth0Client)
        {
            console.error("❌ Auth0 client not initialized");
            return;
        }

        try
        {
            // FORCE FRESH LOGIN - clear any existing session first
            console.log("Clearing any existing session...");
            await TriSysAuth0.auth0Client.logout({
                logoutParams: {
                    returnTo: window.location.origin
                },
                openUrl: false  // Don't actually redirect for logout
            });

            console.log("Opening popup for fresh login...");

            await TriSysAuth0.auth0Client.loginWithPopup({
                authorizationParams: {
                    prompt: 'login'  // Force fresh authentication
                }
            });

            const user = await TriSysAuth0.auth0Client.getUser();
            console.log("✅ Fresh login:", user);

			// We also want to get this token after login to verify against the server
            const silentToken = await TriSysAuth0.auth0Client.getTokenSilently();
            console.log("✅ Silent token:", silentToken);
			user.authToken = silentToken;   // Add token to user object

			// Callback function with the user object so that we can continue with the application logic
            fnAuthenticated(user);

        } catch (err)
        {
            console.error("❌ Login failed:", err);
        }
    }
};

$(function ()
{
    TriSysAuth0.Load();
});