var ctrlSocialNetworkPanel =
{
    // Get ready for any data which will arrive shortly
    Load: function (iSocialNetwork, sDivID)
    {
        // Make sure all our DOM ID's are changed to be unique
        TriSysSDK.Controls.General.ReplaceDivTagsOfDynamicallyLoadedUserControl(sDivID);

        var sPrefix = sDivID + '-', sSocialNetwork = '', sSocialIcon = '';
        switch (iSocialNetwork)
        {
            case TriSysSDK.SocialNetworks.LinkedIn:
                sSocialNetwork = "LinkedIn";
                sSocialIcon = 'fa-linkedin-square';
                break;
            case TriSysSDK.SocialNetworks.Facebook:
                sSocialNetwork = "Facebook";
                sSocialIcon = 'fa-facebook-square';
                break;
            case TriSysSDK.SocialNetworks.Twitter:
                sSocialNetwork = "Twitter";
                sSocialIcon = 'fa-twitter';
                break;
            case TriSysSDK.SocialNetworks.YouTube:
                sSocialNetwork = "YouTube";
                sSocialIcon = 'fa-youtube';
                break;
            case TriSysSDK.SocialNetworks.Instagram:
                sSocialNetwork = "Instagram";
                sSocialIcon = 'fa-instagram';
                break;
            case TriSysSDK.SocialNetworks.Pinterest:
                sSocialNetwork = "Pinterest";
                sSocialIcon = 'fa-pinterest';
                break;
        }
        $('#' + sPrefix + "SocialNetwork").html(sSocialNetwork);

        var sSocialIconClass = 'fa ' + sSocialIcon + ' fa-2x pull-left themed-color';
        $('#' + sPrefix + "SocialClass").addClass(sSocialIconClass);


        // Button handlers
        var fnViewButtonCallback = function ()
        {
            ctrlSocialNetworkPanel.ButtonCallback(iSocialNetwork, sSocialNetwork, 'View', sDivID, sSocialIcon);
        };
        var sButtonID = sPrefix + 'view-profile';
        $('#' + sButtonID).unbind();
        $('#' + sButtonID).click(fnViewButtonCallback);

        var fnEditButtonCallback = function ()
        {
            ctrlSocialNetworkPanel.ButtonCallback(iSocialNetwork, sSocialNetwork, 'Edit', sDivID, sSocialIcon);
        };
        sButtonID = sPrefix + 'edit-profile';
        $('#' + sButtonID).unbind();
        $('#' + sButtonID).click(fnEditButtonCallback);

        var fnDeleteButtonCallback = function ()
        {
            ctrlSocialNetworkPanel.ButtonCallback(iSocialNetwork, sSocialNetwork, 'Delete', sDivID, sSocialIcon);
        };
        var sButtonID = sPrefix + 'delete-profile';
        $('#' + sButtonID).unbind();
        $('#' + sButtonID).click(fnDeleteButtonCallback);
    },

    // Conduct operations for specified social network
    ButtonCallback: function (iSocialNetwork, sSocialNetwork, sOperation, sDivID, sSocialIcon)
    {
        //TriSysApex.Toasters.Info(sDivID + ": " + sSocialNetwork + " - " + sOperation);

        var sPrefix = sDivID + '-';

        switch(sOperation)
        {
            case "View":
                var sURL = $('#' + sPrefix + "URL").html();
                if (sURL)
                {
                    $('#' + sPrefix + "URL").find('a').trigger('click');    // does not work
                    document.getElementById(sPrefix + "URL").click();       // Works!
                }
                else
                {
                    // Fire into current record and probably load the search within the social network so that
                    // the user can then use our browser extension to find the contact
                    var sForenames = $('#Contact_Forenames').val();
                    var sSurname = $('#Contact_Surname').val();
                    TriSysSDK.SocialNetworks.OpenContactInBrowser(sForenames, sSurname, iSocialNetwork);
                }
                break;

            case "Edit":
                // Open a modal dialogue to capture the URL and other details which we can parse
                ctrlSocialNetworkPanel.ModalDialogue.Show(iSocialNetwork, sSocialNetwork, sDivID, sSocialIcon);
                break;

            case "Delete":
                // Prompt the user
                var fnConfirmDeletion = function ()
                {
                    ctrlSocialNetworkPanel.DeleteConfirmed(iSocialNetwork, sDivID);
                    return true;
                };

                var sMessage = "Are you sure that you wish to delete the " + sSocialNetwork + " profile link?";
                TriSysApex.UI.questionYesNo(sMessage, "Delete Social Network Profile Link", "Yes", fnConfirmDeletion, "No");
                break;
        }
    },

    // Called after data received from Web API
    DisplayProfile: function(profile, sDivID)
    {
        var sPrefix = sDivID + '-';

        $('#' + sPrefix + "ContactName").html(profile.ContactName);
        if (profile.ContactName)
            $('#' + sPrefix + "ContactName").show();

        $('#' + sPrefix + "CompanyName").html(profile.CompanyName);
        if (profile.CompanyName)
            $('#' + sPrefix + "CompanyName").show();

        $('#' + sPrefix + "JobTitle").html(profile.JobTitle);

        var sSummary = '';
        if (profile.Summary)
            sSummary = profile.Summary.replace(/\r\n/g, '<br />');
        $('#' + sPrefix + "Summary").html(sSummary);

        if (profile.JobTitle || profile.Summary)
            $('#' + sPrefix + "Paragraph").show();

        var sURL = profile.URL;
        if (sURL)
        {
            if (sURL.indexOf("http") < 0 && sURL.indexOf("//") < 0)
                sURL = "http://" + sURL;
        }
        $('#' + sPrefix + "URL").attr('href', sURL);

        sURL = profile.URL;
        if (sURL && sURL.length >= 50)
            sURL = sURL.substring(0, 49) + '...';
        $('#' + sPrefix + "URL").html(sURL);

        var sPhotoImage = profile.PhotoImage;
        if(sPhotoImage)
        {
            // Call Web API to get a web friendly image path
            var fnShowPhoto = function (sTitle, sURL, sName)
            {
                $('#' + sPrefix + "PhotoImage").attr('src', sURL);
                $('#' + sPrefix + "PhotoImage").show();
            };

            if (sPhotoImage.indexOf("http") >= 0)
                fnShowPhoto(null, sPhotoImage, null);
            else
                TriSysSDK.Controls.FileManager.GetOpenFileURLFromWebServiceWithCallback("Read Social Profile Photo", profile.PhotoImage, null, false, fnShowPhoto);
        }
        else
            $('#' + sPrefix + "PhotoImage").hide();

        // Show this twitter feed
        // Commented out because we can only show our own feeds!
        //ctrlSocialNetworkPanel.ShowTwitterFeed(profile, sPrefix)
    },

    ShowTwitterFeed: function (profile, sPrefix)
    {
        if (profile.ProfileNumber != TriSysSDK.SocialNetworks.Twitter)
            return;

        if (!profile.URL)
            return;

        // Code lifted from ctrlTwitterFeed.js
        var sDiv = sPrefix + 'trisys-twitter-feed';

        var sHRef = profile.URL;    // 'https://twitter.com/' + sHandle;

        var a = $('#' + sDiv);
        a.attr('href', sHRef);
        a.attr('data-widget-id', '380744941695025153');     // Hard coded feed -perhaps this will change in future?
        a.html('tweets by @' + 'WHO?');

        $('#' + sDiv).show();
    },

    DeleteConfirmed: function (iSocialNetwork, sDivID)
    {
        var profile = {
            ContactId: TriSysApex.Pages.ContactForm.ContactId,
            ProfileNumber: iSocialNetwork
        };

        var CSocialNetworkProfileDeleteRequest = {
            Profile: profile
        };

        var payloadObject = {};
        payloadObject.URL = 'SocialNetwork/Delete';
        payloadObject.OutboundDataPacket = CSocialNetworkProfileDeleteRequest;
        payloadObject.Asynchronous = true;
        payloadObject.InboundDataFunction = function (data)
        {
            TriSysApex.UI.HideWait();
            if (data)
            {
                var CSocialNetworkProfileDeleteResponse = data;
                if (CSocialNetworkProfileDeleteResponse.Success)
                {
                    // Visuals after deletion
                    var profile = { ContactName: '', CompanyName: '', JobTitle: '', Summary: '', URL: '', PhotoImage: '' };
                    ctrlSocialNetworkPanel.DisplayProfile(profile, sDivID);
                }
            }
        };

        TriSysApex.UI.ShowWait(null, "Deleting Profile...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);        
    },

    ModalDialogue:
    {
        ContactId: 0,
        SocialNetwork: 0,
        ProfileDivID: null,

        Show: function (iSocialNetwork, sSocialNetwork, sDivID, sSocialIcon)
        {
            ctrlSocialNetworkPanel.ModalDialogue.ContactId = TriSysApex.Pages.ContactForm.ContactId;
            ctrlSocialNetworkPanel.ModalDialogue.SocialNetwork = iSocialNetwork;
            ctrlSocialNetworkPanel.ModalDialogue.ProfileDivID = sDivID;

            var parametersObject = new TriSysApex.UI.ShowMessageParameters();
            parametersObject.Title = "Edit " + sSocialNetwork + " Social Network Profile";
            parametersObject.Image = sSocialIcon;
            parametersObject.Maximize = true;

            parametersObject.ContentURL = TriSysApex.Constants.UserControlFolder + "ctrlEditSocialNetworkProfile.html";

            // Buttons
            parametersObject.ButtonLeftVisible = true;
            parametersObject.ButtonLeftText = "Save";
            parametersObject.ButtonLeftFunction = function ()
            {
                ctrlEditSocialNetworkProfile.SaveButtonClick();

                // It is the responsibility of the callback function to close this modal AFTER all is OK, else warn the user of error
            };

            parametersObject.ButtonRightVisible = true;
            parametersObject.ButtonRightText = "Cancel";

            TriSysApex.UI.PopupMessage(parametersObject);
        }
    }
};