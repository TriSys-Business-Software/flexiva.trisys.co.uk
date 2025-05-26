var ctrlChatMessage =
{
    // Called by HelpChat.js
    Load: function (msg, parentDiv)
    {
        // Rename all ID's to have this message ID
        var sIDSuffix = '-' + parentDiv;

        // Change ID of all internal divs
        var controls = ['ctrlChatMessage-ID', 'ctrlChatMessage-HTML', 'ctrlChatMessage-Time', 'ctrlChatMessage-EditOrDelete',
                        'ctrlChatMessage-Date-li', 'ctrlChatMessage-Date', 'ctrlChatMessage-Photo-img',
                        'ctrlChatMessage-UserName-tr', 'ctrlChatMessage-UserName',
                        'ctrlChatMessage-EditForm', 'ctrlChatMessage-KendoTextEditor', 'ctrlChatMessage-Delete',
                        'ctrlChatMessage-Smiley', 'ctrlChatMessage-Attachment', 'ctrlChatMessage-Save', 'ctrlChatMessage-LinkToRecord'
        ];
        for (var i in controls)
        {
            $('#' + controls[i]).attr('id', controls[i] + sIDSuffix);
        }

        // Set onclick events for buttons
        $('#ctrlChatMessage-EditOrDelete' + sIDSuffix).on('click', function ()
        {
            ctrlChatMessage.EditMessage(msg, sIDSuffix);
        });

        // Get user name from cache
        var sUserName = '';
        var userSender = TriSysApex.Cache.UsersManager.UserFromLoginName(msg.LoginName);
        if (userSender)
            sUserName = userSender.FullName;

        // Write message to tags
        $('#ctrlChatMessage-HTML' + sIDSuffix).html(msg.Message);
        $('#ctrlChatMessage-Time' + sIDSuffix).html(msg.Time);
        $('#ctrlChatMessage-Date' + sIDSuffix).html(msg.Date);
        $('#ctrlChatMessage-UserName' + sIDSuffix).html(sUserName);
        $('#ctrlChatMessage-Photo-img' + sIDSuffix).attr('src', msg.UserImage);

        if (msg.ShowDate)
            $('#ctrlChatMessage-Date-li' + sIDSuffix).show();

        if (!msg.ShowUserDetails)
        {
            $('#ctrlChatMessage-Photo-img' + sIDSuffix).hide();
            $('#ctrlChatMessage-UserName-tr' + sIDSuffix).hide();
        }

        if (!msg.CurrentUser)
        {
            $('#ctrlChatMessage-EditOrDelete' + sIDSuffix).hide();
            $('#ctrlChatMessage-EditOrDelete' + sIDSuffix).remove();        // Remove to allow global show/hide
        }
        else
        {
            // Prepare editor
            var editorID = 'ctrlChatMessage-KendoTextEditor' + sIDSuffix;
            var textEditor = $('#' + editorID);
            textEditor.css("border", "1px solid " + TriSysProUI.BackColour());
            var editor = HelpChat.SetupTextEditor(editorID);

            //textEditor = $('#' + editorID);
            //var editor = textEditor.data("kendoEditor");
            //editor.value('');               // Clear old contents
            //editor.focus();
            //editor.paste(msg.Message);      // Works and retains HTML tags
            editor.value(msg.Message);      // Does not retain HTML <a onclick tags   


            var fnPostEdit = function (sHTML)
            {
                $('#ctrlChatMessage-HTML' + sIDSuffix).html(sHTML);
                $('#ctrlChatMessage-HTML' + sIDSuffix).show();
                $('#ctrlChatMessage-EditForm' + sIDSuffix).hide();
                $('#ctrlChatMessage-EditOrDelete' + sIDSuffix).show();
                HelpChat.ShowChatDataEntryForm(true);               
            };

            $('#ctrlChatMessage-Save' + sIDSuffix).on('click', function ()
            {
                var sHTML = editor.value();
                sHTML = textEditor.html();   // ctrlChatMessage-KendoTextEditor-msg-94709321-b2dd-7244-c8fe-d77e8b272366

                // If we have embedded onclick handlers, we need to reconvert them back from k-script-onclick
                if (sHTML)
                    sHTML = sHTML.replace(/k-script-onclick/g, 'onclick');

                fnPostEdit(sHTML);

                msg.Message = sHTML;
                HelpChat.UpdatedByEditor(msg);
            });

            $('#ctrlChatMessage-Delete' + sIDSuffix).on('click', function ()
            {
                var fnDelete = function ()
                {
                    HelpChat.Data.DeleteMessage(msg.MessageId);
                    fnPostEdit('');
                    $('#ctrlChatMessage-EditOrDelete' + sIDSuffix).remove();        // Remove to allow global show/hide
                    $('#ctrlChatMessage-HTML' + sIDSuffix).remove();
                    $('#ctrlChatMessage-ID' + sIDSuffix).remove();
                    $('#ctrlChatMessage-Date-li' + sIDSuffix).remove();

                    HelpChat.DeletedByEditor(msg);

                    return true;
                };

                var sMessage = "Are you sure you wish to delete this message?";
                TriSysApex.UI.questionYesNo(sMessage, TriSysApex.Copyright.ShortProductName, "Yes", fnDelete, "No");
            });

            $('#ctrlChatMessage-Attachment' + sIDSuffix).on('click', function ()
            {
                var fnAttachFile = function (sFilePath)
                {
                    HelpChat.AttachFile(sFilePath, editorID);
                };

                // Popup file selection dialogue to upload an image or to choose one from a cloud storage service e.g. dropbox
                TriSysSDK.Controls.FileManager.FindFileUpload("Attach File", fnAttachFile);
            });

            $('#ctrlChatMessage-LinkToRecord' + sIDSuffix).on('click', function ()
            {
                HelpChat.LinkToDatabaseRecord(editorID);
            });
        }
    },

    EditMessage: function (msg, sIDSuffix)
    {
        //TriSysApex.UI.ShowMessage("Edit/Delete Message: " + msg.MessageId);

        $('#ctrlChatMessage-HTML' + sIDSuffix).hide();
        $('#ctrlChatMessage-EditForm' + sIDSuffix).show();
        $('#ctrlChatMessage-EditOrDelete' + sIDSuffix).hide();
        HelpChat.ShowChatDataEntryForm(false);
    }
};


