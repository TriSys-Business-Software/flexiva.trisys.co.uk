var ctrlSocialLogin =
{
    Load: function()
    {
        // Setup social login buttons
        ctrlSocialLogin.Social.AddEventHandlers();
    },

    Social:
    {
        AddEventHandlers: function ()
        {
			// Feb 2018: Load the .js BEFORE the user control .html
			var fnLoadControlHTML = function ()
			{
				// Load the control into the DIV, change the name of all internal DIV tags to be unique and populate
				TriSysApex.FormsManager.loadControlIntoDiv('ctrlSocialLogin-SocialNetworkButtons', 'ctrlSocialNetworkLoginButtons.html',
					function (response, status, xhr)
					{
						// Set callback on successful login
						ctrlSocialNetworkLoginButtons.OnSuccessfulLoginFunction = ctrlSocialLogin.Social.SendToWebAPI;
					});
			};

			TriSysApex.WhiteLabelling.LoadJavascriptFile('js/pages/ctrlSocialNetworkLoginButtons.js', null, fnLoadControlHTML); 
        },

        // If the user has logged in with a social network, then send these details to the login Web API
        SendToWebAPI: function (provider_name, connection_token, user_token)
        {
            //TriSysApex.UI.ShowMessage(provider_name + ": " + connection_token + ": " + user_token);

            var CAssociateSocialNetworkWithLoggedInProfileRequest =
            {
                ProviderName: provider_name,
                ConnectionToken: connection_token,
                UserToken: user_token
            };

            var payloadObject = {};

            payloadObject.URL = 'SocialNetwork/AssociateSocialNetworkWithLoggedInProfile';
            payloadObject.OutboundDataPacket = CAssociateSocialNetworkWithLoggedInProfileRequest;
            payloadObject.InboundDataFunction = function (CAssociateSocialNetworkWithLoggedInProfileResponse)
            {
                if (CAssociateSocialNetworkWithLoggedInProfileResponse)
                {
                    if (CAssociateSocialNetworkWithLoggedInProfileResponse.Success)
                    {
                        TriSysWebJobs.SocialNetwork.UpdateSocialNetworkFieldAfterAssociation(CAssociateSocialNetworkWithLoggedInProfileResponse.ProfileURL);

                        return;
                    }
                    else
                    {
                        TriSysApex.UI.CloseModalPopup();

                        setTimeout(function ()
                        {
                            // This error can happen if the same social login is associated with another profile
                            TriSysApex.UI.ShowMessage(CAssociateSocialNetworkWithLoggedInProfileResponse.ErrorMessage, TriSysWebJobs.Constants.ApplicationName);

                        }, 100);
                    }
                }
            };

            TriSysAPI.Data.PostToWebAPI(payloadObject);

            return true;
        }
    }
};


$(document).ready(function ()
{
    ctrlSocialLogin.Load();
});