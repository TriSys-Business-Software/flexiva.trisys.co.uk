var ctrlEditSocialNetworkProfile =
{
    Load: function()
    {
        // Get data from Web API
        TriSysSDK.SocialNetworks.GetContactProfiles(ctrlSocialNetworkPanel.ModalDialogue.ContactId, ctrlEditSocialNetworkProfile.DisplayThisProfile);
    },

    DisplayThisProfile: function(profiles)
    {
        if (!profiles)
            return;

        for (var i = 0; i < profiles.length; i++)
        {
            var profile = profiles[i];

            if(profile.ProfileNumber == ctrlSocialNetworkPanel.ModalDialogue.SocialNetwork)
            {
                var sPrefix = '#edit-social-network-profile-';
                $(sPrefix + 'url').val(profile.URL);
                $(sPrefix + 'photo').val(profile.PhotoImage);
                $(sPrefix + 'fullname').val(profile.ContactName);
                $(sPrefix + 'jobtitle').val(profile.JobTitle);
                $(sPrefix + 'company').val(profile.CompanyName);
                $(sPrefix + 'summary').val(profile.Summary);
                //$(sPrefix + 'email').val(profile.EMail);
                //$(sPrefix + 'phone').val(profile.Summary);
                //$(sPrefix + 'mobile').val(profile.PersonalMobile);
            }
        }
    },

    SaveButtonClick: function()
    {
        var profile = {
            ContactId: ctrlSocialNetworkPanel.ModalDialogue.ContactId,
            ProfileNumber: ctrlSocialNetworkPanel.ModalDialogue.SocialNetwork
        };

        var sPrefix = '#edit-social-network-profile-';
        profile.URL = $(sPrefix + 'url').val();
        profile.PhotoImage = $(sPrefix + 'photo').val();
        profile.ContactName = $(sPrefix + 'fullname').val();
        profile.JobTitle = $(sPrefix + 'jobtitle').val();
        profile.CompanyName = $(sPrefix + 'company').val();
        profile.Summary = $(sPrefix + 'summary').val();

        // Validation
        var bValidInput = (profile.URL);    // && profile.ContactName);
        if(!bValidInput)
        {
            TriSysApex.UI.ShowMessage("Please copy the social network URL.");
            return;
        }

        // Submit the profile to the Web API
        ctrlEditSocialNetworkProfile.SubmitProfile(profile);
    },

    SubmitProfile: function(profile)
    {
        var CSocialNetworkProfileWriteRequest = {
            Profile: profile
        };

        var payloadObject = {};
        payloadObject.URL = 'SocialNetwork/Write';
        payloadObject.OutboundDataPacket = CSocialNetworkProfileWriteRequest;
        payloadObject.Asynchronous = true;
        payloadObject.InboundDataFunction = function (data)
        {
            TriSysApex.UI.HideWait();
            if (data)
            {
                var CSocialNetworkProfileWriteResponse = data;
                if (CSocialNetworkProfileWriteResponse.Success)
                    ctrlEditSocialNetworkProfile.AfterSubmission(CSocialNetworkProfileWriteResponse.Profile);
            }
        };

        // Send this to the back end web API for data retrieval
        TriSysApex.UI.ShowWait(null, "Saving Profile...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    AfterSubmission: function (profile)
    {
        // Close the dialogue
        TriSysApex.UI.CloseModalPopup();

        // Display the profile in the underlying control
        ctrlSocialNetworkPanel.DisplayProfile(profile, ctrlSocialNetworkPanel.ModalDialogue.ProfileDivID);
    }
};

$(document).ready(function ()
{
    ctrlEditSocialNetworkProfile.Load();
});
