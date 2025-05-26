// Created 2016 to utilise SignalR for direct peer-to-peer chat.
//
var HelpChat =
{
    // The currently selected recipient/sender of chat messages whom I am engaging with
    OtherUserId: 0,

    Load: function()
    {
        TriSysSDK.EntityFormTabs.AddClickEventHandlers('help-chat-tab-nav-horizontal');
        TriSysSDK.EntityFormTabs.AddHorizontalScrollBar('help-chat-tab-panel-buttons');

        HelpChat.AddUsers();

        // Set dynamic CSS
        HelpChat.ResetStyle();
        setTimeout(TriSysProUI.kendoUI_Overrides, 1000);

        // Set height of the messages area with data entry at the bottom
        var iHeightFactor = 410;
        var lHeight = window.innerHeight - iHeightFactor;
        $('#trisys-chat-talk').height(lHeight);

        // Set width of the messages window
        var iWidthFactor = 150;
        var lWidth = TriSysApex.Pages.Index.FormWidth() - iWidthFactor;
        $('.chat-talk-messages .chat-talk-msg').width(lWidth);
        $('.trisys-chat-date').width(lWidth);
        $('.trisys-chat-date').css("color", TriSysProUI.BackColour());

        //HelpChat.ScrollEditorToBottom();

        var chatMessages = $('.chat-talk-messages');
        var chatScrollingContainer = $('#trisys-chat-talk');
        var chatMsg = '';

        var textEditor = $('#kendoTextEditor');
        textEditor.css("border", "1px solid " + TriSysProUI.BackColour());

        HelpChat.SetupTextEditor('kendoTextEditor');

        // The Send button
        $('#HelpChat-Send').on('click', HelpChat.SendChatMessageToRecipient);

        // Insert attachment button
        $('#HelpChat-Attachment').on('click', HelpChat.InsertAttachment);

        // Insert smiley face/emoji button
        $('#HelpChat-Smiley').on('click', HelpChat.InsertSmiley);

        // Link to a database record
        $('#HelpChat-LinkToRecord').on('click', HelpChat.LinkToRecord);

        // The edit/delete message is a 'cog'
        $('#HelpChat-EditOrDelete').on('click', HelpChat.EditMessage);

        // Allow entire threads to be removed
        $('#help-chat-remove-history').on('click', HelpChat.ClearHistory);

        // Users can control who they would like in their list
        $('#help-chat-add-user').on('click', HelpChat.AddUserPreference);
        $('#help-chat-remove-user').on('click', HelpChat.RemoveUserPreference);

        // Set up our messages router to receive chat messages from others
        HelpChat.Messenger.RegisterNotificationsOnIncomingMessages();


        // Load dummy data
        //HelpChat.Data.LoadDummyData();
    },

    SetupTextEditor: function(sID)
    {
        var textEditor = $('#' + sID);

        textEditor.kendoEditor({
            tools: [
                "bold",
                "italic",
                "underline",
                "strikethrough",
                "insertUnorderedList",
                "insertOrderedList",
                "indent",
                "outdent",
                "createLink",
                "unlink",
                "fontName",
                "fontSize",
                "foreColor",
                "backColor"
            ] /*,
            encoded: false,
            serialization: {
                semantic: false
            }*/
        });

        var editor = textEditor.data("kendoEditor");
        return editor;
    },

    SendChatMessageToRecipient: function()
    {
        var editor = $("#kendoTextEditor").data("kendoEditor");
        var sHTML = editor.value();

        if (sHTML)
        {
            // Create a message object
            var msg = HelpChat.CreateNewMessageObject(sHTML);

            // Convert this to a JSON string
            var sJSON = JSON.stringify(msg);

            // Send it to recipient
            var sRecipientLoginName = HelpChat.Data.Participants[0];
            TriSysApex.SignalR.Communication.Send(sRecipientLoginName, sJSON);	//, HelpChat.Messenger.MessageType.New);

            // Display it on our feed
            HelpChat.PushSentMessageOntoDisplay(msg, true);

            // Clear the text which was sent
            editor.value('');
        }
    },

    // The current user types in a message HTML and we use this function to create it on-the-fly.
    // This is then passed to the recipient.
    CreateNewMessageObject: function (sMessage)
    {
        var msg = new HelpChat.Data.Message();
        msg.MessageId = TriSysSDK.Miscellaneous.GUID();     // Only needs to be unique within two users' message interchange
        msg.Message = sMessage;
        msg.Date = moment().format('dddd DD MMMM YYYY');
        msg.Time = moment().format('HH:mm');

        var userCredentials = TriSysApex.LoginCredentials.UserCredentials();
        if (userCredentials && userCredentials.LoggedInUser)
        {
            msg.LoginName = userCredentials.LoggedInUser.LoginName;
            msg.UserImage = $('#imgLoggedInUserImage').attr('src');
        }

        // Participants
        msg.Participants = HelpChat.Data.Participants;

        // Identify previous messages
        var bShowDate = true, bShowUserDetails = true;

        var data = HelpChat.Data.Messages;
        if (data && data.length > 0)
        {
            var previousMessage = data[data.length - 1];
            msg.ShowDate = (previousMessage.Date != msg.Date);
            msg.ShowUserDetails = (previousMessage.LoginName != msg.LoginName) || msg.ShowDate;
        }

        // This message is always from us
        msg.CurrentUser = true;

        return msg;
    },

    // Called by BOTH the sender and the recipient when they receive the message
    //
    PushSentMessageOntoDisplay: function(msg, bCurrentUser, sSenderLoginName, sSenderPhoto, participants)
    {
        if(sSenderLoginName)
        {
            msg.LoginName = sSenderLoginName;
            msg.UserImage = sSenderPhoto;
        }        

        // Participants
        if (participants)
            msg.Participants = participants;
        
        // Received messages are not from us
        msg.CurrentUser = bCurrentUser;

        // Add to data store
        HelpChat.Data.Messages.push(msg);

        // Save historic data after every change
        HelpChat.Data.SaveHistory();


        var bShowMessageInList = bCurrentUser;
        if(!bCurrentUser)
        {
            // Is this user stream being displayed?
            var sParticipantLoginName1 = HelpChat.Data.Participants[0];
            if (sParticipantLoginName1.toLowerCase() == msg.LoginName.toLowerCase())
                bShowMessageInList = true;
        }

        if (bShowMessageInList)
        {
            HelpChat.ShowMessageInList(msg);

            // Scroll the message list to the bottom
            HelpChat.ScrollEditorToBottom();

            HelpChat.ResetStyle();
        }
    },

    InsertAttachment: function()
    {
        var fnAttachFile = function (sFilePath)
        {
			// Call Web API to move this temporary file into a public folder and return this path to us
			var payloadObject = {};

			payloadObject.URL = "Files/MoveUploadedFileToPublicURL";

			var MoveUploadedFileToPublicURLRequest = { 
				UploadedFilePath: sFilePath,
				SubFolder: 'Chat'
			};

			payloadObject.OutboundDataPacket = MoveUploadedFileToPublicURLRequest;

			payloadObject.InboundDataFunction = function (CMoveUploadedFileToPublicURLResponse)
			{
				TriSysApex.UI.HideWait();

				if (CMoveUploadedFileToPublicURLResponse)
				{
					if (CMoveUploadedFileToPublicURLResponse.Success)
					{
						var sFilePath = CMoveUploadedFileToPublicURLResponse.PublicFilePath;

						HelpChat.AttachFile(sFilePath, 'kendoTextEditor');
					}
					else
					{
						TriSysApex.UI.errorAlert(CMoveUploadedFileToPublicURLResponse.ErrorMessage);
					}
				} else
				{
					// Something else has gone wrong!
				}
			};

			payloadObject.ErrorHandlerFunction = function (request, status, error)
			{
				TriSysApex.UI.HideWait();
				TriSysApex.UI.ErrorHandlerRedirector('HelpChat.InsertAttachment: ', request, status, error);
			};

			TriSysApex.UI.ShowWait(null, "Uploading File...");
			TriSysAPI.Data.PostToWebAPI(payloadObject);
        };

        // Popup file selection dialogue to upload an image or to choose one from a cloud storage service e.g. dropbox
        TriSysSDK.Controls.FileManager.FindFileUpload("Attach File", fnAttachFile);
    },

    _TestingInterval: false,
    InsertSmiley: function()
    {
        // A test at this point in time!
        if (HelpChat._TestingInterval)
        {
            clearInterval(HelpChat._TestingInterval);
            HelpChat._TestingInterval = null;
        }
        else
        {
            var fnTest = function ()
            {
                var editor = $("#kendoTextEditor").data("kendoEditor");
                var sSnippetHTML = 'This is test generated content at ' + moment().format('HH:mm:ss') + ' on ' + moment().format('dddd DD MMMM YYYY');
                editor.paste(sSnippetHTML);
                HelpChat.SendChatMessageToRecipient();
            };

            HelpChat._TestingInterval = setInterval(fnTest, 1000);
        }
    },

    // User can choose to link any recently opened record or any other entity record to this message
    LinkToRecord: function()
    {
        HelpChat.LinkToDatabaseRecord('kendoTextEditor');
    },

    LinkToDatabaseRecord: function (sEditorID)
    {
        var fnEntitySelection = function (selectedRow)
        {
            if (!selectedRow)
                return false;

            // Read the fields we require from the selected row
            var sEntity = selectedRow.Entity;
            if (!sEntity)
                return false;

            setTimeout(function ()
            {
                // Allow popups stack to clear
                HelpChat.SelectEntityRecord(sEntity, sEditorID);

            }, 10);

            // Force dialogue to close after selection
            return true;
        };

        // Offer choice
        TriSysApex.ModalDialogue.Entity.Select(fnEntitySelection);
    },

    SelectEntityRecord: function (sEntity, sEditorID)
    {
        var sName = null, sFunction = null, sIcon = null;

        var fnInsertLink = function (sNameParameter, sFunctionParameter, sIconParameter)
        {
            setTimeout(function ()
            {
                sIconParameter = '<i class="' + sIconParameter + ' pull-left themed-color" style="padding-top: 4px;"></i> &nbsp;';
                var sSnippetHTML = '<a href="javascript:void(0)" onclick="' + sFunctionParameter + '">' + sIconParameter + sNameParameter + '</a>';

                var editor = $("#" + sEditorID).data("kendoEditor");
                editor.paste(sSnippetHTML);
            }, 10);
        };

        switch(sEntity)
        {
            case 'Contact':
                // Popup contact selection dialogue with callback
                var fnSelectContact = function (selectedRow)
                {
                    if (!selectedRow)
                        return;

                    // Read the fields we require from the selected row
                    var lContactId = selectedRow.Contact_ContactId;
                    var sName = sEntity + ': ' + selectedRow.Contact_Christian + ' ' + selectedRow.Contact_Surname;

                    sFunction = "TriSysApex.FormsManager.OpenForm('Contact', " + lContactId + ")";
                    sIcon = "gi gi-parents"

                    fnInsertLink(sName, sFunction, sIcon);

                    return true;
                };

                TriSysApex.ModalDialogue.Contacts.Select(fnSelectContact);                
                break;

            case 'Company':
                var fnSelectedCompany = function (selectedRow)
                {
                    if (!selectedRow)
                        return;

                    // Read the fields we require from the selected row
                    var lCompanyId = selectedRow.Company_CompanyId;
                    var sName = sEntity + ': ' + selectedRow.Company_Name;

                    sFunction = "TriSysApex.FormsManager.OpenForm('Company', " + lCompanyId + ")";
                    sIcon = "gi gi-building"

                    fnInsertLink(sName, sFunction, sIcon);

                    return true;
                };

                TriSysApex.ModalDialogue.Companies.Select(fnSelectedCompany);
                break;

            case 'Requirement':
                var fnSelectedRequirement = function (selectedRow)
                {
                    if (!selectedRow)
                        return;

                    // Read the fields we require from the selected row
                    var lRequirementId = selectedRow.Requirement_RequirementId;
                    var sName = sEntity + ': ' + selectedRow.Requirement_RequirementReference + ': ' + selectedRow.Requirement_JobTitle + ' at ' + selectedRow.RequirementCompany_Name;

                    sFunction = "TriSysApex.FormsManager.OpenForm('Requirement', " + lRequirementId + ")";
                    sIcon = "gi gi-user_add"

                    fnInsertLink(sName, sFunction, sIcon);

                    return true;
                };

                TriSysApex.ModalDialogue.Requirements.Select(fnSelectedRequirement);
                break;

            case 'Placement':
                var fnSelectedPlacement = function (selectedRow)
                {
                    if (!selectedRow)
                        return;

                    // Read the fields we require from the selected row
                    var lPlacementId = selectedRow.Placement_PlacementId;
                    var sName = sEntity + ': ' + selectedRow.Placement_Reference + ': ' + selectedRow.CandidateContact_FullName + ', ' + selectedRow.Placement_JobTitle + ' at ' + selectedRow.PlacementCompany_Name;

                    sFunction = "TriSysApex.FormsManager.OpenForm('Placement', " + lPlacementId + ")";
                    sIcon = "gi gi-gbp"

                    fnInsertLink(sName, sFunction, sIcon);

                    return true;
                };

                TriSysApex.ModalDialogue.Placements.Select(fnSelectedPlacement);
                break;

            case 'User':
                var fnSelectUser = function (selectedRow)
                {
                    if (!selectedRow)
                        return;

                    // Read the fields we require from the selected row
                    var lUserId = selectedRow.UserId;

                    // Get the contact id which is what we wish to open
                    var user = TriSysApex.Cache.UsersManager.UserFromId(lUserId);

                    sName = sEntity + ': ' + user.FullName;
                    sFunction = "TriSysApex.FormsManager.OpenForm('Contact', " + user.ContactId + ")";
                    sIcon = "gi gi-parents"

                    fnInsertLink(sName, sFunction, sIcon);

                    return true;
                };

                TriSysApex.ModalDialogue.Users.Select(fnSelectUser, { NotLocked: true });   // 11 Nov 2022: NotLocked
                break;
        }
    },


    AttachFile: function (sFilePathURL, sEditorID)
    {
		var sSnippetHTML = '';
		var sName = TriSysSDK.Controls.FileManager.GetFileNameFromPath(sFilePathURL);
		var sOpenViewer = "TriSysSDK.Controls.FileManager.OpenDocumentViewer('" + sName + "', '" + sFilePathURL + "', '" + sName + "');";

		if (TriSysSDK.Controls.FileManager.isImageFile(sFilePathURL))
        {
			sSnippetHTML = '<img src="' + sFilePathURL + '" style="padding-top: 10px; padding-bottom: 10px; max-height: 200px; max-width: 200px;"' +
                    ' id="help-chat-image" ' + 'onclick="' + sOpenViewer + '" />';
        }
        else
        {
			var sName = TriSysSDK.Controls.FileManager.GetFileNameFromPath(sFilePathURL);
			sSnippetHTML = '<a href="' + sFilePathURL + '" target="_blank">' + sName + '</a>';
        }

        var editor = $("#" + sEditorID).data("kendoEditor");
        editor.paste(sSnippetHTML);
    },

    EditMessage: function()
    {
        TriSysApex.UI.ShowMessage("Edit/Delete Message");
    },

    ClearHistory: function()
    {
        if (HelpChat.Data.Messages.length == 0)
            return;

        var userCredentials = TriSysApex.LoginCredentials.UserCredentials();
        var sMyLoginName = userCredentials.LoggedInUser.LoginName;

        var deleteMessages = [];
        for (var i = 0; i < HelpChat.Data.Messages.length; i++)
        {
            var msg = HelpChat.Data.Messages[i];
            if (msg.CurrentUser)
            {
                var sJSON = JSON.stringify(msg);        // Have to create a copy so that we have a copy of the list items
                var msgCopy = JSON.parse(sJSON);
                deleteMessages.push(msg);
            }
        }

        if (deleteMessages.length == 0)
        {
            TriSysApex.UI.ShowMessage("You do not have any of your own messages in this thread.");
            return;
        }
         
        var fnAfterSave = function ()
        {
            // Refresh the list to save us traversing the DOM
            HelpChat.LoadMessagesForParticipants();

            // Now send an alert to this recipient to force them to refresh their copy as they could add new and overwrite
            var otherUser = TriSysApex.Cache.UsersManager.UserFromId(HelpChat.OtherUserId);
            var sRecipientLoginName = otherUser.LoginName;
            var deleteThreadObject = {
				Type: HelpChat.Messenger.MessageType.BulkDeletedThreadMessages,
                UserId: userCredentials.LoggedInUser.UserId
            };
            var sJSON = JSON.stringify(deleteThreadObject);
            TriSysApex.SignalR.Communication.Send(sRecipientLoginName, sJSON);	//, HelpChat.Messenger.MessageType.BulkDeletedThreadMessages);
        };
          
        var fnRemove = function ()
        {
            // Only delete our own messages so enumerate through the list
            for (var i = 0; i < deleteMessages.length; i++)
            {
                var msg = deleteMessages[i];
                HelpChat.Data.DeleteMessage(msg.MessageId, false);
            }
            deleteMessages = [];

            // Save historic data after all have been deleted in-memory and call display refresh on completion
            HelpChat.Data.SaveHistory(fnAfterSave);

            return true;
        };

        var sMessage = "Are you sure you wish to delete all of your messages in this thread?" +
            "<br />Note that those messages sent to you can only be deleted by the sender.";
        TriSysApex.UI.questionYesNo(sMessage, TriSysApex.Copyright.ShortProductName, "Yes", fnRemove, "No");
    },

    // User wishes to add another user to their preferences
    AddUserPreference: function()
    {
        // Popup user selection dialogue
        var fnSelectUser = function (selectedRow)
        {
            if (!selectedRow)
                return false;

            // Read the fields we require from the selected row
            var lUserId = selectedRow.UserId;
            if (lUserId <= 0)
                return false;

            // Add to favourite list
            HelpChat.Data.AddAllowedUser(lUserId);
            HelpChat.Data.DeleteHiddenUser(lUserId);

            // Refresh the users
            HelpChat.AddUsers();

            // Highlight this user by clicking on her
            var sID = 'chat-select-user-a-' + lUserId;
            $('#' + sID).trigger('click');

            // Force dialogue to close after selection
            return true;
        };

        TriSysApex.ModalDialogue.Users.Select(fnSelectUser, { NotLocked: true });   // 11 Nov 2022: NotLocked
    },

    // User wishes to remove user to their preferences
    RemoveUserPreference: function ()
    {
		if (HelpChat.OtherUserId == 0)
		{
			var sMessage = "Are you sure that you wish to remove all users from your list?";
			TriSysApex.UI.questionYesNo(sMessage, TriSysApex.Copyright.ShortProductName, "Yes", function ()
			{
				HelpChat.RemoveAllUsers();
				return true;
			}, "No");
			return;
		}

        var fnRemove = function ()
        {
            // Assign this user to list of not-to-display
            HelpChat.Data.DeleteAllowedUser(HelpChat.OtherUserId);
            HelpChat.Data.AddHiddenUser(HelpChat.OtherUserId);

            // Clear current messages
            var chatMessages = $('.chat-talk-messages');
            chatMessages.empty();

            $('#help-chat-instructions').show();
            $('#trisys-chat-talk').hide();
            $('#user-chat-form').hide();

            $('#chat-user-name').html("");

            // Refresh the users
            HelpChat.AddUsers();
            return true;
        };

        var otherUser = TriSysApex.Cache.UsersManager.UserFromId(HelpChat.OtherUserId);
        var sMessage = "Are you sure that you wish to remove " + otherUser.FullName + " from your list?";
        TriSysApex.UI.questionYesNo(sMessage, TriSysApex.Copyright.ShortProductName, "Yes", fnRemove, "No");
	},

	RemoveAllUsers: function ()
	{
		HelpChat.Data.DeleteAllUsers();		
		
		HelpChat.AddUsers();
	},

    ResetStyle: function ()
    {
        $('.chat-talk-messages .chat-talk-msg').css("background", TriSysProUI.BlockTitleBackColour());
        //$('.chat-form').css("background-color", TriSysProUI.BlockTitleBackColour());
        $('.chat-form').css("background-color", 'white');
        $('.trisys-chat-date').css("color", TriSysProUI.BackColour());
        $('#trisys-chat-talk-waiting-spinner-image').css("color", TriSysProUI.BackColour());

        TriSysProUI.kendoUI_Overrides();
    },

    ScrollEditorToBottom: function()
    {
        var chatScrollingContainer = $('#trisys-chat-talk');

        // Scroll the message list to the bottom

        // Do this in a timer because sometimes the messages can take time to load asynchronously
        setTimeout(function ()
        {
            chatScrollingContainer.animate({ scrollTop: chatScrollingContainer.prop('scrollHeight') }, 500);

        }, 100);
    },

    ShowMessageInList: function(msg)
    {
        // Append a div to the controller
        var divTag = 'msg-' + msg.MessageId;
        var sDivHTML = '<div id="' + divTag + '"></div>';

        var chatMessages = $('.chat-talk-messages');
        chatMessages.append(sDivHTML);

        // Load the message into this div
        HelpChat.LoadMessage(msg, divTag);
    },

    LoadMessage: function (msg, divTag)
    {
        var sPath = 'ctrlChatMessage.html';

        TriSysApex.FormsManager.loadControlReplacingDiv(divTag, sPath,
            function (response, status, xhr)
            {
                ctrlChatMessage.Load(msg, divTag);

                //HelpChat.ResetStyle();

                // Scroll the message list to the bottom
                //HelpChat.ScrollEditorToBottom();
            });
    },

    ShowChatDataEntryForm: function(bShow)
    {        
        var form = $('#user-chat-form');
        var elems = $('[id^="ctrlChatMessage-EditOrDelete"]');

        if (bShow)
        {
            form.show();
            elems.show();
        }
        else
        {
            form.hide();
            elems.hide();
        }

        // Enumerate through all edit buttons and turn them off/on
        $('[id^="content_"]').hide();
    },

    // Current user has chosen another user so load the conversation history from the Web API now
    TabClickEvent: function(sTabID)
    {
        $('#help-chat-instructions').hide();
        $('#trisys-chat-talk').show();
        $('#user-chat-form').show();

        var sOtherUserLogin = sTabID.replace('help-chat-panel-', '');

        var otherUser = TriSysApex.Cache.UsersManager.UserFromLoginName(sOtherUserLogin);
        HelpChat.OtherUserId = otherUser.UserId;
        $('#chat-user-name').html(": " + otherUser.FullName);

        var userCredentials = TriSysApex.LoginCredentials.UserCredentials();
        if (userCredentials && userCredentials.LoggedInUser)
        {
            HelpChat.Data.Participants = [sOtherUserLogin, userCredentials.LoggedInUser.LoginName];

            // Clear existing view and re-load messages for these participants
            HelpChat.LoadMessagesForParticipants();
        }
    },

    LoadMessagesForParticipants: function ()
    {
        // Clear existing view and re-load messages for this
        var chatMessages = $('.chat-talk-messages');
        chatMessages.empty();
        chatMessages.hide();

        var msgCounter = $('#trisys-chat-talk-waiting-spinner-message');
        msgCounter.html("Reading Messages");

        var waiting = $('#trisys-chat-talk-waiting');
        waiting.show();

        var fnPopulate = function (messages)
        {
            var myLoginName = null;
            var userCredentials = TriSysApex.LoginCredentials.UserCredentials();
            if (userCredentials && userCredentials.LoggedInUser)
                myLoginName = userCredentials.LoggedInUser.LoginName;

            msgCounter.html("Loading " + messages.length + " Messages");

            for (var i = 0; i < messages.length; i++)
            {
                var msg = messages[i];

                // Identify previous messages
                msg.ShowDate = true;
                msg.ShowUserDetails = true;

                if (i > 0)
                {
                    var previousMessage = messages[i - 1];
                    msg.ShowDate = (previousMessage.Date != msg.Date);
                    msg.ShowUserDetails = (previousMessage.LoginName.toLowerCase() != msg.LoginName.toLowerCase()) || msg.ShowDate;
                }

                // Identify if this is us or not?
                msg.CurrentUser = (msg.LoginName.toLowerCase() == myLoginName.toLowerCase());

                // Add message to display
                HelpChat.ShowMessageInList(msg);
            }

            var iMilliSecondsPerMessage = 3;
            var iAllowTimeMilliSeconds = (messages.length * iMilliSecondsPerMessage);
            setTimeout(function ()
            {
                waiting.hide();
                chatMessages.show();

                // Scroll the message list to the bottom
                HelpChat.ScrollEditorToBottom();

                HelpChat.ResetStyle();

            }, iAllowTimeMilliSeconds);            
        };

        // Only get the message history for me and the other user
        HelpChat.Data.MessagesForParticipants(fnPopulate);
    },

	// Only allowed to add users who are subscribers known to us in TriSys CRM
	// who are assigned to the same SQL database
    AddUsers: function()
    {
        var payloadObject = {};

        payloadObject.URL = "Users/SubscriberUserList";

        payloadObject.InboundDataFunction = function (CSubscriberUserListResponse)
        {
            if (CSubscriberUserListResponse)
            {
                if (CSubscriberUserListResponse.Success)
                {
					HelpChat.AddUsersUsingSubscriberList(CSubscriberUserListResponse.Users);
                }
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.errorAlert('HelpChat.AddUsers: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysAPI.Data.PostToWebAPI(payloadObject);
	},

	AddUsersUsingSubscriberList: function(lstSubscribers)
	{
        HelpChat.OtherUserId = 0;
        var elem = $('#help-chat-tab-nav-horizontal');
        elem.empty();

        // Use the super user account for support issues
        var lstIgnoreUserLoginNames = ['SuperUser'.toLowerCase(), 'StandardUser'.toLowerCase(), 'v10.trial'.toLowerCase()];
        var userCredentials = TriSysApex.LoginCredentials.UserCredentials();
        if (userCredentials && userCredentials.LoggedInUser)
            lstIgnoreUserLoginNames.push(userCredentials.LoggedInUser.LoginName.toLowerCase());

		// Match on login name
		var fnIsActiveSubscriber = function(sLoginName, lst)
		{
			var bActive = false;
			$.each(lst, function(index, subscriber)
			{
				if(sLoginName.toLowerCase() == subscriber.LoginName.toLowerCase() && subscriber.Active)
					bActive = true;
			});
			return bActive;
		};

        var iCount = 0;
        $.each(TriSysApex.Cache.Users(), function (index, user)
        {
            var bExistsInIgnored = (lstIgnoreUserLoginNames.indexOf(user.LoginName.toLowerCase()) >= 0);

            var bAllowed = true;
            var allowed = HelpChat.Data.GetAllowedUsers();
            if (allowed)
                bAllowed = (allowed.indexOf(user.UserId) >= 0);

            var bDisallowed = false;
            var disallowed = HelpChat.Data.GetHiddenUsers();
            if (disallowed)
                bDisallowed = (disallowed.indexOf(user.UserId) >= 0);

			var bActiveUserAccount = !user.Locked;
			if(bActiveUserAccount)
				bActiveUserAccount = fnIsActiveSubscriber(user.LoginName, lstSubscribers);
			if(bActiveUserAccount)
			{
				if (!bExistsInIgnored && (bAllowed || !bDisallowed))
				{
					iCount += 1;
					var bActive = (iCount == 1);
					bActive = false;    // Do not select any by default

					HelpChat.AddUser(user, bActive);
				}
			}
        });

            // Super User Alias
            //var superUser = {

            //    UserId: 1,
            //    LoginName: HelpChat.Data.TriSysSupportLoginName,
            //    FullName: 'TriSys Support',
            //    Photo: 'https://www.trisys.co.uk/img/CorporateLogos/t-icon-512x512-with-5px-margin.png'
            //}
            //HelpChat.AddUser(superUser, true, true);

    },

    AddUser: function (user, bActive, bPrepend)
    {
        var sPhoto = TriSysApex.Constants.DefaultContactGreyImage;

        if(user.Photo && !user.Locked)
            sPhoto = user.Photo;
        else
        {
            // Do not add users who are locked
			if(user.locked)
				return;
        }

        var sActive = (bActive ? ' class="active"' : '');
        var sID = 'chat-select-user-a-' + user.UserId;

        var sLi = '<li' + sActive + '>' +
                    ' <a href="javascript:void(0)" onclick="TriSysSDK.EntityFormTabs.TabClickEvent(\'help-chat-panel-\',' +
                    '\'' + user.LoginName + '\', \'help-chat-tab-nav-horizontal\', HelpChat.TabClickEvent);" id="' + sID + '"' +
                    ' style="border-radius: 8px;"' +
                    ' >' +
                    '<img src="' + sPhoto + '" height="32" width="32" style="margin-bottom: 7px; border-radius: 5px;" />' +
                    '<br />' +
                    user.FullName +
                    '</a>' +
                    '</li>';

        var elem = $('#help-chat-tab-nav-horizontal');
        
        if (bPrepend)
            elem.prepend(sLi);
        else
            elem.append(sLi);
    },

    // We have edited this message, we therefore need to broadcast it to the recipient so that it is reflected in their view
    UpdatedByEditor: function(msg)
    {
        // Package up the message as a JSON string
		msg.Type = HelpChat.Messenger.MessageType.Update;
        var sJSON = JSON.stringify(msg);

        // Send it to recipient
        var sRecipientLoginName = HelpChat.Data.Participants[0];
        TriSysApex.SignalR.Communication.Send(sRecipientLoginName, sJSON);	//, HelpChat.Messenger.MessageType.Update);

        // Save historic data after every change
        HelpChat.Data.SaveHistory();
    },

    DeletedByEditor: function(msg)
    {
        // Package up the message as a JSON string
		msg.Type = HelpChat.Messenger.MessageType.Delete;
        var sJSON = JSON.stringify(msg);

        // Send it to recipient
        var sRecipientLoginName = HelpChat.Data.Participants[0];
        TriSysApex.SignalR.Communication.Send(sRecipientLoginName, sJSON);	//, HelpChat.Messenger.MessageType.Delete);
    },

    // The messages to be displayed
    Data:
    {
        TriSysSupportLoginName: 'trisys.support',

        // var dataObject = new HelpChat.Data.Message();
        Message: function()
        {
			// What type of message is it?
			this.Type = HelpChat.Messenger.MessageType.New;

            // Each message is accessible to only two participants
            this.Participants = [];

            // Each message has a unique ID, probably a GUID
            this.MessageId = 0;

            this.Message = null;
            this.Date = moment().format('dddd DD MMMM YYYY');
            this.Time = moment().format('HH:mm');
            this.ShowDate = true;
            this.ShowUserDetails = true;
            this.LoginName = null;
            this.UserImage = TriSysApex.Constants.DefaultContactImage;
            this.CurrentUser = true;
        },

        // List of all messages
        Messages: [],        

        // Get all messages for the current participants
        MessagesForParticipants: function (fnPopulate)
        {
            // Hit the Web API
            var CChatReadMessageHistoryRequest = {
                UserId: HelpChat.OtherUserId
            };

            var payloadObject = {};

            payloadObject.URL = "Chat/ReadMessageHistory";

            payloadObject.OutboundDataPacket = CChatReadMessageHistoryRequest;

            payloadObject.InboundDataFunction = function (CChatReadMessageHistoryResponse)
            {
                HelpChat.Data.Messages = [];

                if (CChatReadMessageHistoryResponse)
                {
                    if (CChatReadMessageHistoryResponse.Success)
                    {
                        if(CChatReadMessageHistoryResponse.JSON)
                        {
                            HelpChat.Data.Messages = JSON.parse(CChatReadMessageHistoryResponse.JSON);
                        }
                    }
                }

                fnPopulate(HelpChat.Data.Messages);
            };

            payloadObject.ErrorHandlerFunction = function (request, status, error)
            {
                TriSysApex.UI.errorAlert('HelpChat.Data.MessagesForParticipants: ' + status + ": " + error + ". responseText: " + request.responseText);
            };

            TriSysAPI.Data.PostToWebAPI(payloadObject);
        },

        // List of (2) current participants
        Participants: [],

        AddMessage: function(msg)
        {
            HelpChat.Data.Messages.push(msg);

            // Save historic data after every change
            HelpChat.Data.SaveHistory();
        },

        DeleteMessage: function(lMessageId, bSaveHistory)
        {
            if (TriSysAPI.Operators.isEmpty(bSaveHistory))
                bSaveHistory = true;

            for (var i = 0; i < HelpChat.Data.Messages.length; i++)
            {
                var msg = HelpChat.Data.Messages[i];
                if(msg.MessageId == lMessageId)
                {
                    HelpChat.Data.Messages.splice(i, 1);

                    if (bSaveHistory)
                    {
                        // Save historic data after every change
                        HelpChat.Data.SaveHistory();
                    }

                    return;
                }
            }
        },

        GetMessage: function (lMessageId)
        {
            for (var i = 0; i < HelpChat.Data.Messages.length; i++)
            {
                var msg = HelpChat.Data.Messages[i];
                if (msg.MessageId == lMessageId)
                    return msg;
            }
        },

        SaveHistory: function (fnCallback)
        {
            // Called after each message is sent or received or edited or deleted
            // Very inefficient stores all messages each time

            var sJSON = JSON.stringify(HelpChat.Data.Messages);

            // Hit the Web API

            var CChatWriteMessageHistoryRequest = {
                UserId: HelpChat.OtherUserId,
                JSON: sJSON
            };

            var payloadObject = {};

            payloadObject.URL = "Chat/WriteMessageHistory";

            payloadObject.OutboundDataPacket = CChatWriteMessageHistoryRequest;

            payloadObject.InboundDataFunction = function (CChatWriteMessageHistoryResponse)
            {
                if (CChatWriteMessageHistoryResponse)
                {
                    if (CChatWriteMessageHistoryResponse.Success)
                    {
                        // Cool!
                        if (fnCallback)
                            fnCallback();
                    }
                }
            };

            payloadObject.ErrorHandlerFunction = function (request, status, error)
            {
                TriSysApex.UI.errorAlert('HelpChat.Data.SaveHistory: ' +status + ": " + error + ". responseText: " +request.responseText);
            };

            TriSysAPI.Data.PostToWebAPI(payloadObject);
        },

        // Persistence
        CookiePrefix: 'Help-Chat-',
        
        ReadCookie: function(sWhat)
        {
            var lst = [];
            var sKey = HelpChat.Data.CookiePrefix + sWhat;
            var sJSON = TriSysAPI.Cookies.getCookie(sKey);
            if (sJSON)
                lst = JSON.parse(sJSON);

            return lst;
        },

        WriteCookie: function (sWhat, lst)
        {
            var sKey = HelpChat.Data.CookiePrefix + sWhat;
            var sJSON = JSON.stringify(lst);
            TriSysAPI.Cookies.setCookie(sKey, sJSON);
        },

        AddAllowedUser: function(lUserId)
        {
            var lst = HelpChat.Data.GetAllowedUsers();
            lst.push(lUserId);
            HelpChat.Data.WriteCookie("Allowed", lst);
        },

        AddHiddenUser: function (lUserId)
        {
            var lst = HelpChat.Data.GetHiddenUsers();
            lst.push(lUserId);
            HelpChat.Data.WriteCookie("Hidden", lst);
        },

        DeleteAllowedUser: function (lUserId)
        {
            var lst = HelpChat.Data.GetAllowedUsers();
            var iIndex = lst.indexOf(lUserId);
            if (iIndex >= 0)
            {
                lst.splice(iIndex, 1);
                HelpChat.Data.WriteCookie("Allowed", lst);
            }
        },

        DeleteHiddenUser: function (lUserId)
        {
            var lst = HelpChat.Data.GetHiddenUsers();
            var iIndex = lst.indexOf(lUserId);
            if (iIndex >= 0)
            {
                lst.splice(iIndex, 1);
                HelpChat.Data.WriteCookie("Hidden", lst);
            }
        },

        GetAllowedUsers: function ()
        {            
            return HelpChat.Data.ReadCookie("Allowed");
        },

        GetHiddenUsers: function()
        {
            return HelpChat.Data.ReadCookie("Hidden");
		},

		DeleteAllUsers: function ()
		{
			HelpChat.Data.WriteCookie("Allowed", []);
			
			var lstIgnoreUserLoginNames = []
			$.each(TriSysApex.Cache.Users(), function (index, user)
			{
				lstIgnoreUserLoginNames.push(user.UserId);
			});

			HelpChat.Data.WriteCookie("Hidden", lstIgnoreUserLoginNames);
		},

        LoadDummyData: function ()       // HelpChat.Data.DummyData()
        {
            var userCredentials = TriSysApex.LoginCredentials.UserCredentials();
            if (userCredentials && userCredentials.LoggedInUser)
            {
                var participants = [HelpChat.Data.TriSysSupportLoginName, userCredentials.LoggedInUser.LoginName];

                var dataObject1 = new HelpChat.Data.Message();
                dataObject1.Participants = participants;
                dataObject1.MessageId = 1;
                dataObject1.Message = "Dummy data message #1 from technical support department";
                dataObject1.Date = 'Monday 08 February 2016';
                dataObject1.Time = '12:34';
                dataObject1.CurrentUser = false;
                dataObject1.LoginName = HelpChat.Data.TriSysSupportLoginName;
                dataObject1.UserImage = 'https://www.trisys.co.uk/img/CorporateLogos/t-icon-512x512-with-5px-margin.png';
                HelpChat.Data.Messages.push(dataObject1);

                var dataObject2 = new HelpChat.Data.Message();
                dataObject2.Participants = participants;
                dataObject2.MessageId = 2;
                dataObject2.Message = "Dummy data message #2 from technical support department";
                dataObject2.Date = 'Monday 08 February 2016';
                dataObject2.Time = '12:37';
                dataObject2.CurrentUser = false;
                dataObject2.LoginName = HelpChat.Data.TriSysSupportLoginName;
                dataObject2.UserImage = 'https://www.trisys.co.uk/img/CorporateLogos/t-icon-512x512-with-5px-margin.png';
                dataObject2.ShowDate = false;
                dataObject2.ShowUserDetails = false;
                HelpChat.Data.Messages.push(dataObject2);

                var sLoggedInUserImage = $('#imgLoggedInUserImage').attr('src');

                var dataObject3 = new HelpChat.Data.Message();
                dataObject3.Participants = participants;
                dataObject3.MessageId = 3;
                dataObject3.Message = "Logged in user message from me, " + userCredentials.LoggedInUser.LoginName + ' with photo: ' + sLoggedInUserImage;
                dataObject3.Date = ' Tuesday 09 February 2016';
                dataObject3.Time = '09:01';
                dataObject3.CurrentUser = true;
                dataObject3.LoginName = userCredentials.LoggedInUser.LoginName;
                dataObject3.UserImage = sLoggedInUserImage;
                dataObject3.ShowDate = true;
                dataObject3.ShowUserDetails = true;
                HelpChat.Data.Messages.push(dataObject3);
            }

            HelpChat.ScrollEditorToBottom();
        }
    },   // HelpChat.Data
    
    // HelpChat.Messenger Start
    Messenger:
    {
        // Define our own messages which only we are interested in receiving

        MessageType:        // HelpChat.Messenger.MessageType
        {
            New: 'New-Chat-Message',
            Update: 'Update-Chat-Message',
            Delete: 'Delete-Chat-Message',
            BulkDeletedThreadMessages: 'Bulk-Deleted-Chat-Thread-Messages'
        },

        RegisterNotificationsOnIncomingMessages: function()
        {
            TriSysApex.SignalR.Communication.Callbacks.Register(HelpChat.Messenger.MessageType.New, HelpChat.Messenger.NewChatMessage);
            TriSysApex.SignalR.Communication.Callbacks.Register(HelpChat.Messenger.MessageType.Update, HelpChat.Messenger.UpdateChatMessage);
            TriSysApex.SignalR.Communication.Callbacks.Register(HelpChat.Messenger.MessageType.Delete, HelpChat.Messenger.DeleteChatMessage);
            TriSysApex.SignalR.Communication.Callbacks.Register(HelpChat.Messenger.MessageType.BulkDeletedThreadMessages, HelpChat.Messenger.BulkDeletedThreadMessages);
        },

        NewChatMessage: function (userSender, messageObject)
        {
            debugger;

            // Current logged in user
            var sLoggedInUserLoginName = TriSysApex.LoginCredentials.UserCredentials().LoggedInUser.LoginName;

            // Participants are the sender and me
            var participants = [userSender.LoginName, sLoggedInUserLoginName];

            HelpChat.PushSentMessageOntoDisplay(messageObject, false, userSender.LoginName, userSender.Photo, participants);
        },

        UpdateChatMessage: function (userSender, messageObject)
        {
            // Get the current version and update the message
            var msgExisting = HelpChat.Data.GetMessage(messageObject.MessageId);
            msgExisting.Message = messageObject.Message;

            // Refresh the list
            //HelpChat.LoadMessagesForParticipants();
            var sIDSuffix = '-msg-' + messageObject.MessageId;
            $('#ctrlChatMessage-HTML' + sIDSuffix).html(messageObject.Message);
        },

        DeleteChatMessage: function (userSender, messageObject)
        {
            // Delete it
            HelpChat.Data.DeleteMessage(messageObject.MessageId);

            // Refresh the list
            //HelpChat.LoadMessagesForParticipants();
            var sIDSuffix = '-msg-' + messageObject.MessageId;
            $('#ctrlChatMessage-ID' + sIDSuffix).remove();
        },

        BulkDeletedThreadMessages: function (userSender, deleteThreadObject)
        {
            if (deleteThreadObject.UserId == HelpChat.OtherUserId)
            {
                // Refresh the list as they probably deleted their own messages
                HelpChat.LoadMessagesForParticipants();
            }
        }
    }
    // HelpChat.Messenger End

};

$(document).ready(function ()
{
    HelpChat.Load();
});

