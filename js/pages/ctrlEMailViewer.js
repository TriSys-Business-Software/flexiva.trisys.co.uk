// 11 Dec 2023: Centralised e-mail viewer to complement cloud-sync
var ctrlEMailViewer =
{
    Load: function (CConvertMSGtoHTMLResponse, sGDrivePath)
    {
        var sPrefix = '#ctrlEMailViewer-';

        // Add the callback for the drop down tool to minimize the e-mail header
        $('#ctrlEMailView-Header').off().on("click", function () {
            TriSysSDK.Blocks.toggleBlockSize($(this), 'ctrlEMailView-EMail-Header');
            ctrlEMailViewer.ResizeIframe();
        });

        // Get that 'gray' look for the background
        var topBlock = $('#ctrlEMailView-EMail-Header-Block');
        topBlock.css('background-color', TriSysProUI.GroupBackColour())
        //$('#ctrlEMailView-EMail-Header').children().css('background-color', TriSysProUI.GroupBackColour())
        topBlock.parent().css('overflow-y', 'hidden');

        // Complete header fields

        var sDate = moment(CConvertMSGtoHTMLResponse.EMail.DateSent).format("dddd DD MMMM YYYY @ HH:mm");
        $(sPrefix + 'Date').text(sDate);
        $(sPrefix + 'Subject').text(CConvertMSGtoHTMLResponse.EMail.Subject);
        $('#ctrlEMailView-HeaderText').html("<strong>" + CConvertMSGtoHTMLResponse.EMail.Subject + "</strong>");
        $('#ctrlEMailView-HeaderText-FarRight').text(sDate);

        $(sPrefix + 'From').text(CConvertMSGtoHTMLResponse.EMail.Sender);

        if (CConvertMSGtoHTMLResponse.EMail.Attachments) {
            for (var i = 0; i < CConvertMSGtoHTMLResponse.EMail.Attachments.length; i++)
            {
                var sAttachment = CConvertMSGtoHTMLResponse.EMail.Attachments[i];
                //var sHTML = '<a href="javascript:void(0)" class="list-group-item" onclick="ctrlEMailViewer.OpenAttachment(\'' + sAttachment + '\')">' +
                //            '   <p class="list-group-item-heading remove-margin">' +
                //            '       <img src="images/trisys/file-manager/' + ctrlEMailViewer.ImageForFile(sAttachment) + '" style="width: 20px; height: 20px;" alt="File Image">' +
                //            '           &nbsp; ' + sAttachment +
                //            '   </p>' +
                //            '</a>';
                var sHTML = '<a href="javascript:void(0)" class="btn btn-alt btn-sm btn-default"' +
                            '  style="height: 28px; margin-bottom: 10px; margin-right: 10px; padding-top: 3px; padding-left: 10px; padding-right: 10px;"' +
                            '   onclick="ctrlEMailViewer.OpenAttachment(\'' + sAttachment + '\', \'' + ctrlEMailViewer.ServerfyPath(sGDrivePath) + '\')">' +
                            '    <img src="' + TriSysSDK.Controls.FileManager.ImagePath(sAttachment) + '" style="width: 20px; height: 20px;" alt="File Image">' +
                            '           &nbsp; ' + sAttachment +
                            '</a>';
                $(sPrefix + 'Attachments').append(sHTML);
            }
            if(CConvertMSGtoHTMLResponse.EMail.Attachments.length == 0)
                $(sPrefix + 'Attachments-tr').hide();
        }

        if (CConvertMSGtoHTMLResponse.EMail.ToRecipients)
        {
            var sTo = '';
            for(var i = 0; i < CConvertMSGtoHTMLResponse.EMail.ToRecipients.length; i++)
            {
                if (i > 0) sTo += "; "
                sTo += CConvertMSGtoHTMLResponse.EMail.ToRecipients[i];
            }
            $(sPrefix + 'To').text(sTo);
        }
        if (CConvertMSGtoHTMLResponse.EMail.CcRecipients) {
            var sTo = '';
            for (var i = 0; i < CConvertMSGtoHTMLResponse.EMail.CcRecipients.length; i++) {
                if (i > 0) sTo += "; "
                sTo += CConvertMSGtoHTMLResponse.EMail.CcRecipients[i];
            }
            $(sPrefix + 'Cc').text(sTo);
        }
        if (CConvertMSGtoHTMLResponse.EMail.BccRecipients) {
            var sTo = '';
            for (var i = 0; i < CConvertMSGtoHTMLResponse.EMail.BccRecipients.length; i++) {
                if (i > 0) sTo += "; "
                sTo += CConvertMSGtoHTMLResponse.EMail.BccRecipients[i];
            }
            $(sPrefix + 'Bcc').text(sTo);
        }


        // iFrame content

        var src = 'ctrlEMailViewer-iFrame'
        var elem = $('#' + src);

        // Load the URL
        elem.attr('src', CConvertMSGtoHTMLResponse.URL);

        ctrlEMailViewer.ResizeIframe();
    },

    OpenAttachment: function (sAttachment, sGDrivePath)
    {
        //TriSysApex.UI.ShowMessage("Attachment: " + sAttachment + " for e-mail: " + sGDrivePath);
        // Expect that the sGDrivePath has / instead of \
        sGDrivePath = ctrlEMailViewer.ClientifyPath(sGDrivePath);

        var payloadObject = {};

        payloadObject.URL = "Files/ReadMSGAttachment";

        payloadObject.OutboundDataPacket = {
            FilePath: sGDrivePath,
            Attachment: sAttachment
        };

        payloadObject.InboundDataFunction = function (CReadMSGAttachmentResponse) {
            TriSysApex.UI.HideWait();

            if (CReadMSGAttachmentResponse) {
                if (CReadMSGAttachmentResponse.Success) {
                    if (CReadMSGAttachmentResponse.URL)
                        TriSysSDK.Browser.OpenURL(CReadMSGAttachmentResponse.URL);
                }
                else
                    TriSysApex.UI.ShowMessage(CReadMSGAttachmentResponse.ErrorMessage);
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error) {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('ctrlEMailViewer.OpenAttachment: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Reading Attachment...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    // When user wants to see more document
    ResizeIframe: function()
    {
        var src = 'ctrlEMailViewer-iFrame';
        var elem = $('#' + src);

        var lHeight = $(window).height();

        var iHeaderHeight = 40 + ($('#ctrlEMailView-EMail-Header').css('display') == 'none' ? 0 : $('#ctrlEMailView-EMail-Header').height());
        var iConstant = 320;

        var iFrameHeight = lHeight - iConstant - iHeaderHeight;
        elem.height(iFrameHeight);
    },

    // Replace \ with / for transmission to handle HTML escape characters
    ServerfyPath: function(sWindowsPath)
    {
        sWindowsPath = sWindowsPath.replace(/\\/g, "/");
        return sWindowsPath;
    },
    ClientifyPath: function (sURL) {
        sURL = sURL.replace(/\//g, "\\");
        return sURL;
    }

};  // ctrlEMailViewer
