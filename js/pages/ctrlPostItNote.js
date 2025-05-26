var ctrlPostItNote =
{
    UsersID: 'ctrlPostItNote-Users',
    ContentID: 'ctrlPostItNote-Content',
    TextEditID: 'ctrlPostItNote-TextEdit',
    HideID: 'ctrlPostItNote-Hide',
    HideAllID: 'ctrlPostItNote-HideAll',
    ClearID: 'ctrlPostItNote-Clear',
    ReplyID: 'ctrlPostItNote-Reply',
    SendID: 'ctrlPostItNote-Send',
    SnoozeID: 'ctrlPostItNote-Snooze',
    FromLabelID: 'ctrlPostItNote-FromLabel',
    FromID: 'ctrlPostItNote-From',
    Separator: '\r\n\r\n- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -\r\n',

    Load: function()
    {
        var postItNote = null;

        // Request the current post-it note after we are displayed
        var currentWindow = $("#" + ctrlPostItNote.ContentID).closest("[data-role=window]").getKendoWindow();
        if (currentWindow)
            postItNote = currentWindow.options.content.task;
       
        ctrlPostItNote.LoadUserCombo(postItNote);
        ctrlPostItNote.LoadPostItNote(postItNote);

        // Is this a new one?
        var bNew = (postItNote.TaskId <= 0)
        if (bNew)
        {
            var textEditIDWithTaskId = ctrlPostItNote.TextEditID + '-' + postItNote.TaskId;

            var sValue = (postItNote.DisplayDescription ? postItNote.DisplayDescription : '');
            $('#' + textEditIDWithTaskId).val(sValue);

            ctrlPostItNote.Reply(postItNote.TaskId);
        }
        else
        {
            // 14 Oct 2021: Solve the 512 display description limit once and for all
            ctrlPostItNote.GetTaskFromDatabase(postItNote);
        }
    },

    LoadUserCombo: function (postItNote)
    {
        var userIDWithTaskId = ctrlPostItNote.UsersID + '-' + postItNote.TaskId;
        $('#' + ctrlPostItNote.UsersID).attr("id", userIDWithTaskId);

        TriSysSDK.CShowForm.MultiUserCombo(userIDWithTaskId);
        TriSysSDK.CShowForm.SetSkillsInList(userIDWithTaskId, postItNote.SenderUserName);

        ctrlPostItNote.ShowUserCombo(postItNote.TaskId, false);
    },

    ShowUserCombo: function(lTaskId, bShow)
    {
        var userIDWithTaskId = ctrlPostItNote.UsersID + '-' + lTaskId;
        var cmb = $('#' + userIDWithTaskId).parent();
        if (bShow)
        {
            TriSysSDK.CShowForm.SetSkillsInList(userIDWithTaskId, "");
            cmb.show();
            //cmb.width('338px');
        }
        else
            cmb.hide();
    },

    DisplayDescription: function(contentIDWithTaskId, sDisplay)
    {
        var sDisplayHTML = sDisplay;
        if (sDisplayHTML)
        {
            sDisplayHTML = sDisplayHTML.replace(/\r\n/g, "<br />");
            sDisplayHTML = sDisplayHTML.replace(/\n/g, "<br />");
        }
        $('#' + contentIDWithTaskId).html(sDisplayHTML);
    },

    LoadPostItNote: function (postItNote)
    {
        var sDisplay = postItNote.DisplayDescription;

        // There are multiple post-it notes visible at the same time, so work hard to ensure uniqueness
        // of all DOM elements when adding events.

        var contentIDWithTaskId = ctrlPostItNote.ContentID + '-' + postItNote.TaskId;
        $('#' + ctrlPostItNote.ContentID).attr("id", contentIDWithTaskId);
        
        ctrlPostItNote.DisplayDescription(contentIDWithTaskId, sDisplay);

        var textEditIDWithTaskId = ctrlPostItNote.TextEditID + '-' + postItNote.TaskId;
        $('#' + ctrlPostItNote.TextEditID).attr("id", textEditIDWithTaskId);
        var sReply = ctrlPostItNote.Separator + sDisplay;
        $('#' + textEditIDWithTaskId).val(sReply);

        // Rename and add hide button click event
        var hideIDWithTaskId = ctrlPostItNote.HideID + '-' + postItNote.TaskId;
        $('#' + ctrlPostItNote.HideID).attr("id", hideIDWithTaskId);
        $('#' +hideIDWithTaskId).on('click', function ()
        {
            TriSysApex.PostItNotes.Hide(postItNote.TaskId);
        });
        var hideAllIDWithTaskId = ctrlPostItNote.HideAllID + '-' + postItNote.TaskId;
        $('#' + ctrlPostItNote.HideAllID).attr("id", hideAllIDWithTaskId);

        var clearIDWithTaskId = ctrlPostItNote.ClearID + '-' + postItNote.TaskId;
        $('#' + ctrlPostItNote.ClearID).attr("id", clearIDWithTaskId);
        $('#' +clearIDWithTaskId).on('click', function ()
        {
            ctrlPostItNote.Clear(postItNote.TaskId);
        });

        var replyIDWithTaskId = ctrlPostItNote.ReplyID + '-' + postItNote.TaskId;
        $('#' + ctrlPostItNote.ReplyID).attr("id", replyIDWithTaskId);
        $('#' +replyIDWithTaskId).on('click', function ()
        {
            ctrlPostItNote.Reply(postItNote.TaskId);
        });

        var sendIDWithTaskId = ctrlPostItNote.SendID + '-' + postItNote.TaskId;
        $('#' + ctrlPostItNote.SendID).attr("id", sendIDWithTaskId);
        $('#' +sendIDWithTaskId).on('click', function ()
        {
            ctrlPostItNote.Send(postItNote.TaskId);
        });

        var snoozeIDWithTaskId = ctrlPostItNote.SnoozeID + '-' + postItNote.TaskId;
        $('#' + ctrlPostItNote.SnoozeID).attr("id", snoozeIDWithTaskId);
        $('#' +snoozeIDWithTaskId).on('click', function ()
        {
            ctrlPostItNote.Snooze(postItNote.TaskId);
        });

        var FromLabelIDWithTaskId = ctrlPostItNote.FromLabelID + '-' + postItNote.TaskId;
        $('#' + ctrlPostItNote.FromLabelID).attr("id", FromLabelIDWithTaskId);

        var FromIDWithTaskId = ctrlPostItNote.FromID + '-' + postItNote.TaskId;
        $('#' + ctrlPostItNote.FromID).attr("id", FromIDWithTaskId);
        $('#' +FromIDWithTaskId).html(postItNote.SenderUserName);
    },

    Clear: function (lTaskId)
    {
        var CTaskClearMultipleRequest = {
            Tasks: [lTaskId],
            PostItNote: true
        };

        var payloadObject = {};

        payloadObject.URL = "Task/Clear";
        payloadObject.OutboundDataPacket = CTaskClearMultipleRequest;

        payloadObject.InboundDataFunction = function (CTaskClearMultipleResponse)
        {
            TriSysApex.UI.HideWait();

            if (CTaskClearMultipleResponse)
            {
                if (CTaskClearMultipleResponse.Success)
                {
                    TriSysApex.PostItNotes.Hide(lTaskId);
                    TriSysApex.Toasters.Warning("Cleared Post-It Note.");
                    TriSysApex.ModalDialogue.Task.PostTaskUpdate(null, false);
                    return;
                }
                else
                    TriSysApex.UI.ShowMessage(CTaskClearMultipleResponse.ErrorMessage);
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.ShowMessage('ctrlPostItNote.Clear: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Clearing note...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    Reply: function (lTaskId)
    {
        var FromLabelIDWithTaskId = ctrlPostItNote.FromLabelID + '-' + lTaskId;
        $('#' + FromLabelIDWithTaskId).html("To:");

        var FromIDWithTaskId = ctrlPostItNote.FromID + '-' + lTaskId;
        var sFrom = $('#' + FromIDWithTaskId).html();
        $('#' + FromIDWithTaskId).hide();

        ctrlPostItNote.ShowUserCombo(lTaskId, true);

        var userIDWithTaskId = ctrlPostItNote.UsersID + '-' + lTaskId;
        TriSysSDK.CShowForm.SetSkillsInList(userIDWithTaskId, sFrom);

        var contentIDWithTaskId = ctrlPostItNote.ContentID + '-' + lTaskId;
        $('#' + contentIDWithTaskId).hide();

        var textEditIDWithTaskId = ctrlPostItNote.TextEditID + '-' + lTaskId;
        $('#' + textEditIDWithTaskId).show();

        var sendIDWithTaskId = ctrlPostItNote.SendID + '-' + lTaskId;
        $('#' + sendIDWithTaskId).show();

        var replyIDWithTaskId = ctrlPostItNote.ReplyID + '-' + lTaskId;
        $('#' + replyIDWithTaskId).hide();

        var clearIDWithTaskId = ctrlPostItNote.ClearID + '-' + lTaskId;
        $('#' + clearIDWithTaskId).hide();

        var snoozeIDWithTaskId = ctrlPostItNote.SnoozeID + '-' + lTaskId;
        $('#' + snoozeIDWithTaskId).hide();

        var hideAllIDWithTaskId = ctrlPostItNote.HideAllID + '-' + lTaskId;
        $('#' +hideAllIDWithTaskId).hide();

        var hideIDWithTaskId = ctrlPostItNote.HideID + '-' + lTaskId;
        $('#' + hideIDWithTaskId).html("Cancel");

        document.getElementById(textEditIDWithTaskId).focus();
        ctrlPostItNote.PositionCaretAtBeginningOfTextEdit(textEditIDWithTaskId);
    },

    Snooze: function(lTaskId)
    {
        var fnCallback = function ()
        {
            TriSysApex.PostItNotes.Hide(lTaskId);
            
            // Remove this from the list of post-it notes
            for (var i = TriSysApex.Alarms.PostItNotes.length - 1; i >= 0; i--)
            {
                var piNote = TriSysApex.Alarms.PostItNotes[i];
                if (piNote.TaskId == lTaskId)
                    TriSysApex.Alarms.PostItNotes.splice(i, 1);
            }

            // Do a refresh of post-it notes only to allow numbers to reflect snoozing
            TriSysApex.Alarms.DisplayPostItNoteMetric();
        };

        TriSysApex.Alarms.Snooze.Popup([lTaskId], false, fnCallback);
    },

    Send: function (lTaskId)
    {
        //TriSysApex.UI.ShowMessage("Send: " + lTaskId);
        var userIDWithTaskId = ctrlPostItNote.UsersID + '-' + lTaskId;
        var userList = TriSysSDK.CShowForm.GetSelectedSkillsFromList(userIDWithTaskId);
        if(!userList)
        {
            TriSysApex.UI.ShowMessage("Please choose one or more users to send to.");
            return;
        }

        var textEditIDWithTaskId = ctrlPostItNote.TextEditID + '-' + lTaskId;
        var sText = $('#' + textEditIDWithTaskId).val();
        if (!sText)
        {
            TriSysApex.UI.ShowMessage("Please enter some text.");
            return;
        }

        ctrlPostItNote.SendToWebAPI(lTaskId, userList, sText);
    },

    SendToWebAPI: function (lTaskId, userList, sText)
    {
        var CPostItNoteRequest = { TaskId: lTaskId, Recipients: userList, Text: sText };

        var payloadObject = {};

        payloadObject.URL = "Task/PostItNote";
        payloadObject.OutboundDataPacket = CPostItNoteRequest;

        payloadObject.InboundDataFunction = function (CPostItNoteResponse)
        {
            TriSysApex.UI.HideWait();

            if (CPostItNoteResponse)
            {
                if (CPostItNoteResponse.Success)
                {
                    TriSysApex.PostItNotes.Hide(lTaskId);
                    TriSysApex.Toasters.Warning("Sent Post-It Note.");
                    TriSysApex.ModalDialogue.Task.PostTaskUpdate(null, false);
                    lTaskId = CPostItNoteResponse.TaskId;
                    ctrlPostItNote.InformAllRecipients(lTaskId, userList);
                    return;
                }
                else
                    TriSysApex.UI.ShowMessage(CPostItNoteResponse.ErrorMessage);
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.ShowMessage('ctrlPostItNote.SendToWebAPI: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Sending Note...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    PositionCaretAtBeginningOfTextEdit: function (sID)
    {
        if (!HTMLInputElement.prototype.setSelectionRange)
        {
            HTMLInputElement.prototype.setSelectionRange = function (start, end)
            {
                if (this.createTextRange)
                {
                    var range = this.createTextRange();
                    this.collapse(true);
                    this.moveEnd('character', start);
                    this.moveStart('character', end);
                    this.select();
                }
            }
        }

        $('#' + sID).scrollTop(0);
        document.getElementById(sID).setSelectionRange(0, 0);
    },

    // After the post-it note is saved, send a signal to each of the recipients so that they can get a
    // real-time popup of the post-it.
    InformAllRecipients: function (lTaskId, userFullNames)
    {
        var taskObject = { TaskId: lTaskId, Type: TriSysApex.SignalR.Communication.MessageType.TaskUpdate };
        var sJSON = JSON.stringify(taskObject);

        var userList = userFullNames.split(",");
        for (var i = 0; i < userList.length; i++)
        {
            var sUserFullName = userList[i].trim();
            var user = TriSysApex.Cache.UsersManager.UserFromFullName(sUserFullName);
            if(user)
            {
                // Send it to recipient
                var sRecipientLoginName = user.LoginName;
                TriSysApex.SignalR.Communication.Send(sRecipientLoginName, sJSON);	//, TriSysApex.SignalR.Communication.MessageType.TaskUpdate);
            }
        }
    },

    // 14 Oct 2021: Solve the 512 display description limit once and for all by reading the full task object
    // from the Web API and writing this to the text fields
    GetTaskFromDatabase: function(postItNote)
    {
        // This is an existing task record so get from web API
        var dataPacket = {
            'TaskId': postItNote.TaskId
        };

        var payloadObject = {};

        // Call the API to submit the data to the server
        payloadObject.URL = "Task/Read";

        payloadObject.OutboundDataPacket = dataPacket;

        payloadObject.InboundDataFunction = function (CTaskReadResponse)
        {
            if (CTaskReadResponse)
            {
                if (CTaskReadResponse.Success)
                {
                    // The read task object
                    var task = CTaskReadResponse.Task;

                    var contentIDWithTaskId = ctrlPostItNote.ContentID + '-' + postItNote.TaskId;
                    ctrlPostItNote.DisplayDescription(contentIDWithTaskId, task.Description);

                    var textEditIDWithTaskId = ctrlPostItNote.TextEditID + '-' + postItNote.TaskId;
                    var sDisplay = task.Description

                    // Consider reply
                    sDisplay = ctrlPostItNote.Separator + sDisplay;

                    $('#' + textEditIDWithTaskId).val(sDisplay);

                    return;
                }
            }
        };

        TriSysAPI.Data.PostToWebAPI(payloadObject);
    }

};

$(document).ready(function ()
{
    ctrlPostItNote.Load();
});
