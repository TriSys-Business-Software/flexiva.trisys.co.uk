var ctrlSocialNetworkLoginButtons =
{
    Load: function()
    {
        // Had intended to place the code to load the buttons here, but it does not work.
        // See the <script> code in the .html file instead
    },

    HelpLabel: function(sLabel)
    {
        $('#help-social-login').html(sLabel);
    },

    // Called when user has securely logged in to their social network.
    LoginEvent: function(args)
    {
        var provider_name = args.provider.name;
        var connection_token = args.connection.connection_token;
        var user_token = args.connection.user_token;

        // Call our web API to save the profile etc..
        if (ctrlSocialNetworkLoginButtons.OnSuccessfulLoginFunction)
        {
            setTimeout(function ()
            {
                try
                {
                    ctrlSocialNetworkLoginButtons.OnSuccessfulLoginFunction(provider_name, connection_token, user_token);

                } catch (e)
                {
                    // Presumably our function will deal with this!
                }
            }, 10);
        }

        /* As this is a demo return false to cancel the redirection to the callback_uri */
        return false;
    },

    // Caller specifies how we call then back
    // This is because we are used for both registration and login
    OnSuccessfulLoginFunction: null

};

//$(document).ready(function ()
//{
//    ctrlSocialNetworkLoginButtons.Load();
//});