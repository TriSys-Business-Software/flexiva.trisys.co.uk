var VideoChat =
{
	Domain: "TriSys Business Software",

	Load: function ()
    {
		VideoChat.Fit_iFrame();
		VideoChat.WireUpButtons();

		//setTimeout(VideoChat.ConnectToTwillioRoom, 1000);
    },

	// Hard coded to test
//	ConnectToTwillioRoom: function()
//	{
//debugger;
//		var sToken = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiIsImN0eSI6InR3aWxpby1mcGE7dj0xIn0.eyJqdGkiOiJTSzE4ODIxMGY3YTc5OTNhYTAyODRhYmI3MWY1MTVkZTM0LTE1ODUxNTE3ODMiLCJpc3MiOiJTSzE4ODIxMGY3YTc5OTNhYTAyODRhYmI3MWY1MTVkZTM0Iiwic3ViIjoiQUM5ZTgzNWM1Y2ZmZWIyZTMyOWY3N2Y3NjAzZDRjZTVhYSIsImV4cCI6MTU4NTE1NTM4MywiZ3JhbnRzIjp7ImlkZW50aXR5IjoidGVzdDAwMyIsInZpZGVvIjp7InJvb20iOiJ0ZXN0MDAzIn19fQ.dwXNVcH6wmLAiC2BuFX8m3MNJo2r5QVseEr1b80QWrQ";
//		//Video.connect('$TOKEN', { name: 'Test001' });

//		const { connect } = require('twilio-video');

//		connect(sToken, { name: 'test003' }).then(room => {
//		  console.log(`Successfully joined a Room: ${room}`);
//		  room.on('participantConnected', participant => {
//			console.log(`A remote Participant connected: ${participant}`);
//		  });
//		}, error => {
//		  console.error(`Unable to connect to Room: ${error.message}`);
//		});

//	},

	WireUpButtons: function()
	{
		$('#videoChatButtons-button-leave').off().on('click', function ()
		{
			var fnLeave = function()
			{
				setTimeout(VideoChat.LeaveMeeting, 10);
				return true;
			};

			// Prompt the user to leave meeting
			var sMessage = "Are you sure that you wish to leave this meeting room?" +
				"<br/><br/> <strong>Room" + $('#videoChatRoomName').text() + "</strong>" +
				"<br/><br/>You will be allowed to re-join this meeting later.";
			TriSysApex.UI.questionYesNo(sMessage, "Leave Meeting Room", "Yes", fnLeave, "No");
		});

		$('#videoChatButtons-button-detach').off().on('click', function ()
		{
		    // Get the URL and open a new browser tab
		    TriSysSDK.Browser.OpenURL(VideoChat._LastStartedMeetingURL);

		    // Close this meeting
		    setTimeout(VideoChat.LeaveMeeting, 10);
		});

		var fnJoinButtonClick = function ()
		{
            var fnJoin = function(options)
			{
				var sFullName = TriSysApex.LoginCredentials.UserCredentials().LoggedInUser.CRMContact.FullName;
				var lContactId = TriSysApex.LoginCredentials.UserCredentials().LoggedInUser.CRMContact.ContactId;
				var fnAfterRecordingAttendee = function()
				{
					VideoChat.ShowRoomName(options.RoomName);
					VideoChat.StartMeeting(options.URL, sFullName);
				};
				VideoChat.AddAttendee(options.MeetingId, lContactId, sFullName, fnAfterRecordingAttendee);
			};

			// Prompt the user to select one of the meetings
			VideoChat.ReadMeetingsAndPromptForSelection(fnJoin);
		};

		$('#videoChatButtons-button-join').off().on('click', fnJoinButtonClick);
		$('#videoChatButtons-button-join2').off().on('click', fnJoinButtonClick);

		$('#videoChatButtons-button-invite').off().on('click', VideoChat.InviteColleague);

		$('#videoChatButtons-button-add').off().on('click', function ()
		{
			var fnAdded = function(CCreateMeetingResponse)
			{
				// Prompt to start meeting?
				TriSysApex.UI.ShowMessage("Created meeting room.");
			};

			var fnIfAllowedToAddMoreMeetingRooms = function()
			{
				// Prompt the user to name the new meeting
				VideoChat.PromptForNewMeeting(function(sName)
				{
					VideoChat.ObtainMeetingDetailsFromWebAPI(sName, fnAdded);					
				});
			};

			// We may has server limits on number of rooms per company or user
			VideoChat.CheckNewRoomCapability(fnIfAllowedToAddMoreMeetingRooms);
		});

		$('#videoChatButtons-button-delete').off().on('click', function ()
		{
			var fnDelete = function(meeting)
			{
				VideoChat.DeleteMeetingDetailsUsingWebAPI(meeting.MeetingId, function()
				{
					TriSysApex.UI.ShowMessage("Deleted meeting: " + meeting.MeetingId +
										"<br/>" + meeting.URL);

					VideoChat.LeaveMeeting();
				});
			};

			// Prompt the user to select one of the meetings
			var options = { Title: "Choose Meeting Room to be Deleted", OwnerOnly: true };
			VideoChat.ReadMeetingsAndPromptForSelection(fnDelete, options);
		});
	},

	PromptForNewMeeting: function(fnCallback)
	{
		var fnNew = function (sName)
		{
			if(!sName)
				return;

			setTimeout(function() { fnCallback(sName); }, 10);

			return true;
		};

		var sMessage = "Add New Meeting Room";
		var options = { Label: "Name", SaveButtonText: "Create" };
		TriSysApex.ModalDialogue.New.Popup(sMessage, "gi-facetime_video", fnNew, options);
	},

	ReadMeetingsAndPromptForSelection: function(fnCallback, options)
	{
		var payloadObject = {};

		payloadObject.URL = "Meetings/ListMeetings";

		var bOwnerOnly = false;
		if(options && options.OwnerOnly)
			bOwnerOnly = true;

		payloadObject.OutboundDataPacket = { 
			Domain: VideoChat.Domain,
			OwnerOnly: bOwnerOnly
		};

		payloadObject.InboundDataFunction = function (CListMeetingsResponse)
		{
			TriSysApex.UI.HideWait();

			if (CListMeetingsResponse)
			{
				if (CListMeetingsResponse.Success && CListMeetingsResponse.Meetings)
				{
					VideoChat.PromptToSelectExistingMeeting(CListMeetingsResponse.Meetings, fnCallback, options);
					return;
				}
			}

			var sHyperlink = '<a href="javascript:void(0)" onclick="TriSysApex.Advertising.ContactUs();">contact us</a>';
			TriSysApex.UI.ShowMessage('Please ' + sHyperlink +
                                        ' to activate your video conferencing / video interviewing service.');
		};

		payloadObject.ErrorHandlerFunction = function (request, status, error)
		{
			TriSysApex.UI.HideWait();
			TriSysApex.UI.errorAlert('VideoChat.ReadMeetingsAndPromptForSelection: ' + status + ": " + error + ". responseText: " + request.responseText);
		};

		TriSysApex.UI.ShowWait(null, "Loading Meetings...");
		TriSysAPI.Data.PostToWebAPI(payloadObject);
	},

	PromptToSelectExistingMeeting: function(meetings, fnCallback, options)
	{
		var entityParameters = new TriSysApex.ModalDialogue.Selection.SelectionParameters();
        entityParameters.Title = options ? options.Title : "Choose a Meeting Room";
        entityParameters.PopulationByObject = meetings;
        entityParameters.Columns = [
			{ field: "RoomName",		title: "Room",		type: "string" },
			{ field: "FullContactName",	title: "Owner",		type: "string" },
			{ field: "Attendees",		title: "Attendees", type: "string" }
		];

		// Massage attendees into names only
		meetings.forEach(function(meeting)
		{
			if(meeting.Attendees)
			{
				var sAttendees = "";
				meeting.Attendees.forEach(function(attendee)
				{
					if(sAttendees.length > 0)
						sAttendees += ", ";

					sAttendees += attendee.FullName;
				});
				meeting.Attendees = sAttendees;
			}
			else
				meeting.Attendees = "";
		});

        entityParameters.CallbackFunction = function(selectedRow)
        {
            if (!selectedRow)
                return false;

            var sRoomName = selectedRow.RoomName;
            if (sRoomName)
            {
				setTimeout(function ()
				{
					fnCallback(selectedRow);

				}, 10);
			
				// Force dialogue to close after selection
				return true;
			}
		};

        TriSysApex.ModalDialogue.Selection.Show(entityParameters);
	},

	Fit_iFrame: function()
	{
		// Make the panel fit the window for maximum use
		var iFrameElement = $('#videoChatiFrame');
		var fHeightFactor = 168;
		var iHeight = $(window).height() - fHeightFactor;
        iFrameElement.css('height', iHeight + 'px');

        $('#videoChat-help-block').css('height', (iHeight - 30) + 'px');
        var iDataSheetHeight = iHeight - 130;
        $('#videoChatiFrameDatasheet').css('height', iDataSheetHeight + 'px');

        var sDiv = 'videoChat-Introduction-Column';
		var intro = $('#' + sDiv);
		intro.css('height', iDataSheetHeight + 'px');
	    //intro.css('overflow-y', 'auto');
		TriSysSDK.EntityFormTabs.AddVerticalScrollBar(sDiv);
	},

	CheckNewRoomCapability: function(fnCallback)
	{
		var payloadObject = {};

		payloadObject.URL = "Meetings/NewMeetingRoomCapability";

		payloadObject.OutboundDataPacket = { 
			Domain: VideoChat.Domain
		};

		payloadObject.InboundDataFunction = function (CNewMeetingRoomCapabilityResponse)
		{
			TriSysApex.UI.HideWait();

			if (CNewMeetingRoomCapabilityResponse)
			{
				if (CNewMeetingRoomCapabilityResponse.Success)
				{
					fnCallback();
					return;
				}
			}

			var sMessage = "Unable to create a new meeting room." +
				"<br/>" + "Your current plan includes one company-wide meeting room only." +
				"<br/>" + "To enable additional meeting rooms, please contact TriSys Support.";
			TriSysApex.UI.ShowMessage(sMessage);
		};

		payloadObject.ErrorHandlerFunction = function (request, status, error)
		{
			TriSysApex.UI.HideWait();
			TriSysApex.UI.errorAlert('VideoChat.CheckNewRoomCapability: ' + status + ": " + error + ". responseText: " + request.responseText);
		};

		TriSysApex.UI.ShowWait(null, "Checking Meeting Room Rules...");
		TriSysAPI.Data.PostToWebAPI(payloadObject);
	},

	ObtainMeetingDetailsFromWebAPI: function(sName, fnCallback)
	{
		var payloadObject = {};

		payloadObject.URL = "Meetings/CreateMeeting";

		payloadObject.OutboundDataPacket = { 
			Domain: VideoChat.Domain,
			Name: sName
		};

		payloadObject.InboundDataFunction = function (CCreateMeetingResponse)
		{
			TriSysApex.UI.HideWait();

			if (CCreateMeetingResponse)
			{
				if (CCreateMeetingResponse.Success)
				{
					fnCallback(CCreateMeetingResponse);
					return;
				}
			}

			TriSysApex.UI.ShowMessage("Unable to create a meeting room.");
		};

		payloadObject.ErrorHandlerFunction = function (request, status, error)
		{
			TriSysApex.UI.HideWait();
			TriSysApex.UI.errorAlert('VideoChat.ObtainMeetingDetailsFromWebAPI: ' + status + ": " + error + ". responseText: " + request.responseText);
		};

		TriSysApex.UI.ShowWait(null, "Creating Meeting Room...");
		TriSysAPI.Data.PostToWebAPI(payloadObject);
	},

	ShowRoomName: function(sRoomName)
	{
		if(sRoomName)
			sRoomName = ": " + sRoomName;

		$('#videoChatRoomName').text(sRoomName);
	},

    // 13 Oct 2021
	_LastStartedMeetingURL: null,

	StartMeeting: function(sURL, sFullName)
	{		
		var sRoomOptions = "?embed&iframeSource=trisys&chat=on&screenshare=on";
		var sLeaveRoomHand = "&leaveButton=on";		// Works, but means that people redirect to Whereby web site - we do not want that!
		var sPersonality = "&personality=off"  // https://whereby.com/information/embedded-guide/#combining-parameters
		var sBreakout = "&breakout=on";
		sRoomOptions += sPersonality + sBreakout;
		var sUser = "&displayName=" + sFullName;

	    // Remember the meeting URL in case of detaching it
		VideoChat._LastStartedMeetingURL = sURL;

        // Append the room name
		sURL += sRoomOptions + sUser;

		var iFrameElement = $('#videoChatiFrame');
		iFrameElement.attr('src', sURL);

		$('#videoChat-help-block').hide();
		iFrameElement.show();
		$('#videoChatButtons-button-leave').show();
		$('#videoChatButtons-button-detach').show();
		$('#videoChatButtons-button-join').hide();
		$('#videoChatButtons-button-invite').show();

        // CROSS SITE scripting nonsense!
		//setTimeout(VideoChat.RemoveWherebyBranding, 1000);
	},

    // 27 Oct 2021
	RemoveWherebyBranding: function()
	{
	    var iFrameDOM = $("iframe#videoChatiFrame").contents();

	    iFrameDOM.find(".WatermarkBanner-2-PU").remove();
	},

	DeleteMeetingDetailsUsingWebAPI: function(sMeetingId, fnCallback)
	{
		var payloadObject = {};

		payloadObject.URL = "Meetings/DeleteMeeting";

		payloadObject.OutboundDataPacket = { 
			Domain: VideoChat.Domain,
			MeetingId: sMeetingId
		};

		payloadObject.InboundDataFunction = function (CDeleteMeetingResponse)
		{
			TriSysApex.UI.HideWait();

			if (CDeleteMeetingResponse)
			{
				if (CDeleteMeetingResponse.Success)
				{
					fnCallback(CDeleteMeetingResponse);
					return;
				}
			}

			TriSysApex.UI.ShowMessage("Unable to delete meeting.");
		};

		payloadObject.ErrorHandlerFunction = function (request, status, error)
		{
			TriSysApex.UI.HideWait();
			TriSysApex.UI.errorAlert('VideoChat.DeleteMeetingDetailsUsingWebAPI: ' + status + ": " + error + ". responseText: " + request.responseText);
		};

		TriSysApex.UI.ShowWait(null, "Deleting Meeting...");
		TriSysAPI.Data.PostToWebAPI(payloadObject);
	},

	AddAttendee: function(sMeetingId, lContactId, sFullName, fnCallback)
	{
		var payloadObject = {};

		payloadObject.URL = "Meetings/AddAttendee";

		payloadObject.OutboundDataPacket = { 
			Domain: VideoChat.Domain,
			MeetingId: sMeetingId,
			ContactId: lContactId,
			FullName: sFullName
		};

		payloadObject.InboundDataFunction = function (CAddAttendeeResponse)
		{
			TriSysApex.UI.HideWait();

			if (CAddAttendeeResponse)
			{
				if (CAddAttendeeResponse.Success)
				{
					fnCallback();
					return;
				}
			}

			TriSysApex.UI.ShowMessage("Unable to add attendee.");
		};

		payloadObject.ErrorHandlerFunction = function (request, status, error)
		{
			TriSysApex.UI.HideWait();
			TriSysApex.UI.errorAlert('VideoChat.AddAttendee: ' + status + ": " + error + ". responseText: " + request.responseText);
		};

		TriSysApex.UI.ShowWait(null, "Adding Attendee...");
		TriSysAPI.Data.PostToWebAPI(payloadObject);
	},

	LeaveMeeting: function()
	{
		var iFrameElement = $('#videoChatiFrame');	
		iFrameElement.attr('src', null);
		iFrameElement.hide();
		$('#videoChat-help-block').show();
		$('#videoChatRoomName').text('');
		$('#videoChatButtons-button-leave').hide();
		$('#videoChatButtons-button-detach').hide();
		$('#videoChatButtons-button-join').show();
		$('#videoChatButtons-button-invite').hide();
	},

	InviteColleague: function()
	{
        // User can multi-select
	    var fnSelectUser = function (lstFieldValues)
	    {
	        if (!lstFieldValues)
	            return;

	        // Read the fields we require from the selected row
	        var lstUser = TriSysSDK.Grid.MultiSelectGridFieldValuesToList(lstFieldValues);

            // The current user doing the inviting
	        var userCredentials = TriSysApex.LoginCredentials.UserCredentials();
	        var sFrom = userCredentials.LoggedInUser.ForenameAndSurname;

	        // Simple post-it note with multiple recipients
	        var fnSendPostItNote = function ()
	        {
	            var lTaskId = -1 * TriSysSDK.Miscellaneous.RandomNumber(100000, 999999);
	            var postItNote = {
	                TaskId: lTaskId,
	                StartDate: new Date()
	            };

	            var sRoomName = $('#videoChatRoomName').text();
	            sRoomName = sRoomName.replace(': ', '');
	            var sFullName = '';     // user.FullName

	            var sEntityHyperlinkPrefix = '<a style="cursor:pointer;" onclick="TriSysApex.VideoConferencing.MeetInRoom(' +
                                                    '\'' + sRoomName + '\', ' +
                                                    '\'' + VideoChat._LastStartedMeetingURL + '\', ' +
                                                    '\'' + sFullName + '\'' +
                                             ')">';
	            var sEntityHyperlinkSuffix = '</a> to meet now.' + '\n';
	            var sMessage = sFrom + " has invited you to meet in room:\n" + sRoomName + '\n\n'
                                                                 + "Please ";
	            var sMessageHyperlink = "click here";

	            postItNote.DisplayDescription = sMessage + sEntityHyperlinkPrefix + sMessageHyperlink + sEntityHyperlinkSuffix;

	            TriSysApex.PostItNotes.OpenPostItNoteWindow(postItNote);

	            // Assign the recipients and auto-send
	            setTimeout(function ()
                {
	                var userIDWithTaskId = ctrlPostItNote.UsersID + '-' + lTaskId;

	                var sUsers = '';
	                lstUser.forEach(function (user)
	                {
	                    if (sUsers.length > 0)
	                        sUsers += ", ";
	                    sUsers += user.FullName;
	                });

	                TriSysSDK.CShowForm.SetSkillsInList(userIDWithTaskId, sUsers);
	                
	                ctrlPostItNote.Send(lTaskId);

	                TriSysApex.Toasters.Info(lstUser.length + " colleague" + (lstUser.length == 1 ? '' : 's') + " have been invited via a post-it note.");

	            }, 750);
	        };

	        setTimeout(fnSendPostItNote, 100);
	        return true;
	    };

	    var options = {
            Title: "Select one or more colleagues",
	        NotLocked: true,
	        MultiSelect: true
	    }
	    TriSysApex.ModalDialogue.Users.Select(fnSelectUser, options);
	},

    // Called from the invite to meeting post-it note hyperlink
	StartMeetingInRoom: function(sRoomName, sURL, sFullName)
	{
	    VideoChat.ShowRoomName(sRoomName);
	    VideoChat.StartMeeting(sURL, sFullName);
	}

};	// VideoChat

$(document).ready(function ()
{
    VideoChat.Load();
});

