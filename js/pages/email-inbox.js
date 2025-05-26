var EMailInbox =
{
    Load: function()
    {
        EMailInbox.handleClientLoad();
    },

    clientId: '846645542721-28ncraq600rjrohb9ghniujdqi7kqkb6.apps.googleusercontent.com',
    apiKey: 'AIzaSyDz71k6Cr2dm-6ZcOb6s2dcOmKOBe4QRaU',

    scopes: 'https://www.googleapis.com/auth/gmail.readonly',

    handleClientLoad: function() 
    {
        gapi.client.setApiKey(EMailInbox.apiKey);
        window.setTimeout(EMailInbox.checkAuth, 1);
    },

    checkAuth: function() 
    {
        gapi.auth.authorize({
            client_id: EMailInbox.clientId,
            scope: EMailInbox.scopes,
            immediate: true
        }, EMailInbox.handleAuthResult);
    },

    handleAuthClick: function() 
    {
        gapi.auth.authorize({
            client_id: EMailInbox.clientId,
            scope: EMailInbox.scopes,
            immediate: false
            }, EMailInbox.handleAuthResult);
        return false;
    },

    handleAuthResult: function(authResult) 
    {
        if (authResult && !authResult.error)
        {
            EMailInbox.loadGmailApi();
            $('#authorize-button').remove();
            $('.table-inbox').removeClass("hidden");
        }
        else
        {
            $('#authorize-button').removeClass("hidden");
            $('#authorize-button').on('click', function(){
                EMailInbox.handleAuthClick();
            });
        }
    },

    loadGmailApi: function() 
    {
        gapi.client.load('gmail', 'v1', EMailInbox.displayInbox);
    },

    displayInbox: function() 
    {
        // List all 'folders' which are labels in G-Mail
        EMailInbox.getLabels(EMailInbox.LoadFolders);

        // Load the inbox by default
        EMailInbox.displayMailboxContents('INBOX');
    },
    
    ShowMailInTheiFrame: function(message)
    {
        var sHTML = EMailInbox.getBody(message.payload);
        EMailInbox.ShowMailInTheiFrameFromHTML(sHTML);
    },

    ShowMailInTheiFrameFromHTML: function (sHTML)
    {
        $('#EMailInbox-EMailGrid').hide();
        var iFrame = $('#EMailInbox-MailViewer');
        iFrame.contents().find('html').html(sHTML);
        iFrame.show();
        $("#EMailInbox-BackToList").show();
        $('#EMailInbox-ContactSummaryBlock').show();
        $('#EMailInbox-ListBlock').removeClass().addClass("col-md-6");
    },

    ShowList: function()
    {
        $('#EMailInbox-EMailGrid').show();
        var iFrame = $('#EMailInbox-MailViewer');
        iFrame.hide();
        $("#EMailInbox-BackToList").hide();
        $('#EMailInbox-ContactSummaryBlock').hide();
        $('#EMailInbox-ListBlock').removeClass().addClass("col-md-9");
    },

    PopulateEMailGrid: function (emailMessages)
    {
        var sDivTag = 'EMailInbox-EMailGrid';
        var sGridName = sDivTag + '-GridInstance';

        TriSysSDK.Grid.VirtualMode({
            Div: sDivTag,
            ID: sGridName,
            Title: "E-Mail Messages",
            RecordsPerPage: 15, //TriSysApex.UserOptions.RecordsPerPage(),
            PopulationByObject: emailMessages,
            Columns: [
                { field: "MessageId", title: "MessageId", type: "string", width: 70, hidden: true },    // The ID
                { field: "Payload", title: "Payload", type: "string", width: 70, hidden: true },        // The payload
                { field: "From", title: "From", type: "string", width: 300 },
                { field: "Subject", title: "Subject", type: "string" },
                { field: "DateTime", title: "Date/Time", type: "date", format: "{0:HH:mm ddd dd MMM yyyy }", width: 180 }],

            KeyColumnName: "MessageId",
            DrillDownFunction: function (rowData)
            {
                // Get the specific message from google on-demand
                var sMessageId = rowData.MessageId;
                var message = JSON.parse(rowData.Payload);
                var sHTML = EMailInbox.getBody(message.payload);
                EMailInbox.ShowMailInTheiFrameFromHTML(sHTML);

                var fnAttachment = function (sFilename, sMimeType, objAttachment)
                {

                    var sBase64 = btoa(objAttachment.data);
                    console.log("sFilename=" + sFilename + ", sMimeType=" + sMimeType + ", sBase64=" + sBase64);
                };
                EMailInbox.getAttachments(message, fnAttachment);
            },
            MultiRowSelect: true,
            Grouping: false
        });
    },

    getHeader: function(headers, index) 
    {
        var header = '';
        $.each(headers, function ()
        {
            if (this.name === index)
            {
                header = this.value;
            }
        });
        return header;
    },

    getBody: function(message) 
    {
        var encodedBody = '';
        if(typeof message.parts === 'undefined')
        {
            encodedBody = message.body.data;
        }
        else
        {
            encodedBody = EMailInbox.getHTMLPart(message.parts);
        }
        encodedBody = encodedBody.replace(/-/g, '+').replace(/_/g, '/').replace(/\s/g, '');
        var decoded = decodeURIComponent(escape(window.atob(encodedBody)));
        return decoded;
    },

    getAttachments: function(message, fnCallback)
    {
        var parts = message.payload.parts;
        for (var i = 0; i < parts.length; i++)
        {
            var part = parts[i];
            if (part.filename && part.filename.length > 0)
            {
                var attachId = part.body.attachmentId;
                var request = gapi.client.gmail.users.messages.attachments.get({
                    'id': attachId,
                    'messageId': message.id,
                    'userId': 'me'
                });
                request.execute(function (attachment)
                {
                    fnCallback(part.filename, part.mimeType, attachment);
                });
            }
        }
    },

    getHTMLPart: function (arr)
    {
        if (arr)
        {
            //for (var x = 0; x <= arr.length; x++)
            try
            {
                for (var x = 0; x < arr.length; x++)
                {
                    if (typeof arr[x].parts === 'undefined')
                    {
                        if (arr[x].mimeType === 'text/html' || arr[x].mimeType === 'text/plain')
                        {
                            return arr[x].body.data;
                        }
                    }
                    else
                    {
                        return EMailInbox.getHTMLPart(arr[x].parts);
                    }
                }

            } catch (e)
            {

            }
        }

        return '';
    },

    getLabels: function (fnCallback)
    {
        var request = gapi.client.gmail.users.labels.list({
            'userId': 'me'
        });
        request.execute(function (response)
        {
            var labels = response.labels;
            fnCallback(labels);
        });
    },

    LoadFolders: function(labels)
    {
        var ds = [];
        var ignore = ['INBOX', 'STARRED', 'IMPORTANT', 'SENT', 'DRAFT', 'SPAM', 'TRASH', 'UNREAD', 'Sent Items', 'Root Folder', 'Junk E-mail',
                     'CATEGORY_PERSONAL', 'CATEGORY_SOCIAL', 'CATEGORY_PROMOTIONS', 'CATEGORY_FORUMS', 'CATEGORY_UPDATES', 'CHAT'];

        // Sort it by ASCENDING string order
        labels.sort(function (item1, item2)
        {
            return item1.name.localeCompare(item2.name);
        });

        // Add expected folders in g-mail order
        ds.push({ text: 'Inbox', id: 'INBOX', expanded: false, selected: true });
        ds.push({ text: 'Starred', id: 'STARRED', expanded: false });
        ds.push({ text: 'Important', id: 'IMPORTANT', expanded: false });
        ds.push({ text: 'Sent Mail', id: 'SENT', expanded: false });
        ds.push({ text: 'Drafts', id: 'DRAFT', expanded: false });

        // Add other folders
        for (var i = 0; i < labels.length; i++)
        {
            var label = labels[i];
            //console.log("Label: id=" + label.id + ", Name=" + label.name + ", Type=" + label.type);

            if (ignore.indexOf(label.id) >= 0)
                continue;

            var dsItem = { text: label.name, id: label.name, expanded: false };
            ds.push(dsItem);            
        }
        EMailInbox.RecurseSubNodes(ds);
        EMailInbox.RecurseSubItemNodes(ds);

        $("#EMailInbox-Folders").kendoTreeView({
            dragAndDrop: false,
            dataSource: ds,
            select: EMailInbox.SelectMailbox
        });

        // Force through the theme once again!
        setTimeout(TriSysProUI.kendoUI_Overrides, 1000);
    },

    SelectMailbox: function(e)
    {
        var sName = this.text(e.node);
        var dataNode = this.dataItem(e.node);
        var id = dataNode.id;

        EMailInbox.displayMailboxContents(id);
    },

    displayMailboxContents: function(sLabelID)
    {
        EMailInbox.ShowList();

        try
        {
            var request = gapi.client.gmail.users.messages.list({
                'userId': 'me',
                'labelIds': sLabelID,
                'maxResults': 100
            });
            request.execute(function (response)
            {
                try
                {
                    // Grid
                    EMailInbox.GridRows = [];
                    $.each(response.messages, function ()
                    {
                        var messageRequest = gapi.client.gmail.users.messages.get({
                            'userId': 'me',
                            'id': this.id
                        });
                        messageRequest.execute(EMailInbox.AppendMessageToGridRows);
                    });

                    var fnPopulateGrid = function ()
                    {
                        if (EMailInbox.GridRows.length == response.messages.length)
                        {
                            // Sort the data in reverse date order as they came back in random order
                            EMailInbox.GridRows.sort(function (row1, row2)
                            {
                                return new Date(row2.DateTime) - new Date(row1.DateTime);
                            });

                            // Now populate the grid
                            EMailInbox.PopulateEMailGrid(EMailInbox.GridRows);
                        }
                        else
                            setTimeout(fnPopulateGrid, 100);
                    };

                    setTimeout(fnPopulateGrid, 100);                    
                }
                catch (e)
                {

                }
                
            });
        } catch (e)
        {

        }        
    },

    GridRows: null,
    AppendMessageToGridRows: function(message) 
    {
        var sFrom = EMailInbox.getHeader(message.payload.headers, 'From');
        var sSubject = EMailInbox.getHeader(message.payload.headers, 'Subject');
        var sDate = EMailInbox.getHeader(message.payload.headers, 'Date');
        var dt = new Date(sDate);
        var sHTML = EMailInbox.getBody(message.payload);
        var sJSON = JSON.stringify(message);
        
        var row = {
            MessageId: message.id,
            From: sFrom,
            Subject: sSubject,
            DateTime: dt,
            Payload: sJSON   // Cannot use sHTML as grid no-likey
        };

        EMailInbox.GridRows.push(row);
    },

    // Recursively add each node to the tree
    RecurseSubNodes: function(ds)
    {
        var iCountSlashes = 0;
        for (var i = 0; i < ds.length; i++)
        {
            var dataLabel = ds[i];
            if(dataLabel.text.indexOf("/") > 0)
            {
                // Move this up a level
                var parent = ds[i-1];
                if (!parent.items)
                    parent.items = [];
                parent.items.push(dataLabel);
                dataLabel.text = dataLabel.text.substring(parent.text.length + 1);

                // Remove this item from the array
                ds.splice(i, 1);

                iCountSlashes += 1;
                break;
            }
        }

        if(iCountSlashes > 0)
            EMailInbox.RecurseSubNodes(ds);
    },

    RecurseSubItemNodes: function (ds)
    {
        var iCountSlashes = 0;
        for (var i = 0; i < ds.length; i++)
        {
            var parent = ds[i];
            if (parent.items && parent.items.length > 0)
            {
                for (var iItem = 0; iItem < parent.items.length; iItem++)
                {
                    var dataLabel = parent.items[iItem];
                    if (dataLabel.text.indexOf("/") > 0)
                    {
                        // Move this up a level
                        parent.items.push(dataLabel);
                        var itemParent = parent.items[iItem - 1];
                        var sParentName = itemParent.text;

                        if (!itemParent.items)
                            itemParent.items = [];
                        itemParent.items.push(dataLabel);

                        dataLabel.text = dataLabel.text.substring(sParentName.length + 1);

                        // Remove this item from the array
                        parent.items.splice(iItem, 1);

                        iCountSlashes += 1;
                        break;
                    }
                }                
            }
        }

        if (iCountSlashes > 0)
            EMailInbox.RecurseSubItemNodes(ds);
    }
};

$(document).ready(function ()
{
    EMailInbox.Load();
});
