var ctrlDocumentViewer =
{
    CurrentDocumentURL: null,

    // We are using a service to display the document in an iframe 
    Open: function()
    {
        var sURL = TriSysSDK.Controls.FileManager.DocumentPath;

        if (sURL)
            sURL = sURL.replace('///', '/');

        // If a word document, we can use our API
        if (ctrlDocumentViewer.OpenWordDocumentAfterConversion(sURL))
            return;

        if (TriSysSDK.Controls.FileManager.isPDFFile(sURL))
        {
            $("#trisys-document-viewer-control").hide();
            ctrlDocumentViewer.DisplayPDFInViewer(sURL);
            return;
        }

        // 3rd party viewer
        var bNewCode = false;

        if (!bNewCode)
        {
            // OLD CODE
            // We will now attempt to load the document
            $('#trisys-document-viewer-iframe').show();
            var iframe = document.getElementById('trisys-document-viewer-iframe');
            var sAPIKey = "S6tjlASFdOx8jaqGZ3BhDtZAsFT41iKd38KFmJQTMeoh-FM7NiWro28yFyk8upyI";   //"K5102014151403";     // K2042015100045
            var sPrint = "&printButton=No";

            iframe.src = "//api.accusoft.com/v1/viewer/?key=" + sAPIKey + "&viewertype=html5&document=" + sURL +
                            "&viewerheight=600&viewerwidth=100%" +
                            "&upperToolbarColor=dae8f2&lowerToolbarColor=dae8f2&bottomToolbarColor=dae8f2&backgroundColor=ffffff&fontColor=3498db&buttonColor=black" +
                            "&hidden=selectText,panTool,print,download";
        }
        else
        {
            // NEW CODE 28 APRIL 2015 WHICH DOES NOT WORK - AWAITING A FIX
            //// We will now attempt to load the document

            var viewerParams = {
                document: sURL,
                key: "K5102014151403",
                viewertype: "html5",
                viewerheight: "600",
                viewerwidth: "100%",
                upperToolbarColor: "dae8f2",
                lowerToolbarColor: "dae8f2",
                bottomToolbarColor: "dae8f2",
                backgroundColor: "ffffff",
                fontColor: "3498db",
                buttonColor: "black",
                hidden: "selectText,panTool,thumbnails,print,download"
            }

            try
            {
                $("#trisys-document-viewer-control").pccViewer(viewerParams);
            }
            catch (err)
            {
                TriSysApex.UI.ShowError(err, "Document Viewer");
            }
        }

        // Force through the theme once again to ensure that modal dialogues look just right also
        setTimeout(TriSysProUI.kendoUI_Overrides, 250);
    },

    OpenWordDocumentAfterConversion: function(sURL)
    {
        // Is this a word document?
        if (!TriSysSDK.Controls.FileManager.isWordFile(sURL) && !TriSysSDK.Controls.FileManager.isHTMLFile(sURL))
            return false;

        var sDiv = 'trisys-document-viewer-converted-contents';

        // Size the height
        var documentObject = $('#' + sDiv);
        var iHeight = ctrlDocumentViewer.DocumentViewerHeight();
        documentObject.css("height", iHeight);

        // Let user watch an animation whilst we get the file from the API
        $('#' + sDiv).show();
        setTimeout(TriSysProUI.kendoUI_Overrides, 50);

        // Get the HTML friendly document from the Web API as a URL so that we can local into this scrollable DIV
        var CFileReferenceInternalToExternalPathRequest = {
            FolderFilePath: sURL
        }

        var payloadObject = {};
        payloadObject.URL = "Files/ConvertFileReferenceInternalToExternalPath";
        payloadObject.OutboundDataPacket = CFileReferenceInternalToExternalPathRequest;
        payloadObject.InboundDataFunction = function (data)
        {
            if (data)
            {
                if (data.Success)
                {
                    // Load the full document into this DIV
                    ctrlDocumentViewer.CurrentDocumentURL = data.URL;

                    try
                    {
                        // This can work OK, but can generate spurious errors because of malformed HTML or embedded script tags
                        $('#' + sDiv).load(ctrlDocumentViewer.CurrentDocumentURL, function (response, status, xhr)
                        {
                            if (status == "error")
                            {
                                var msg = "Document Conversion Error: ";
                                TriSysApex.UI.ShowError(null, msg + xhr.status + " " + xhr.statusText);
                            }
                        });

                    } catch (e)
                    {
                        // Log the error to console only
                        TriSysApex.Logging.LogMessage(TriSysApex.Logging.CatchVariableToText(e));
                    }                                        
                }
                else
                    TriSysApex.UI.errorAlert(data.ErrorMessage, TriSysWeb.Constants.ApplicationName);
            }
            else
                TriSysApex.UI.ShowMessage("No response from " + payloadObject.URL, TriSysWeb.Constants.ApplicationName);

            return true;
        };
        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            // Can occur when user gets impatient waiting for photo to load and navigates away
            TriSysApex.UI.ErrorHandlerRedirector('ctrlDocumentViewer.OpenWordDocumentAfterConversion: ', request, status, error, false);
        };
        TriSysAPI.Data.PostToWebAPI(payloadObject);

        return true;
    },

    // A button on the dialogue.
    // Open it in another window.
    OpenFullScreen: function (sTitle)
    {
        // Always show the URL we are showing
        var sDocumentURL = ctrlDocumentViewer.CurrentDocumentURL;

        // Hopefully the browser will open a tab for us
		TriSysSDK.Browser.OpenURL(sDocumentURL);

        // Make it open in the local PC viewer/editor
        //TriSysApex.ModalDialogue.DocumentViewer.DownloadAndOpen(sTitle, sDocumentURL);
    },

    // A button on the dialogue.
    // If we are showing a word document, then we have to download an open, else just 
    DownloadAndOpenButtonClick: function (sTitle, sDocumentURL)
    {
        // Is this a word document?
        if (!TriSysSDK.Controls.FileManager.isWordFile(sDocumentURL) && !TriSysSDK.Controls.FileManager.isHTMLFile(sDocumentURL))
        {
            // Download and open it
            TriSysApex.ModalDialogue.DocumentViewer.DownloadAndOpen(sTitle, sDocumentURL);
            return;
        }

        // For word documents, we are showing the converted document as an HTML, so we need
        // to make it available for download in it's original form
        var fnCallback = function (sTitle, sURL, sName)
        {
            TriSysApex.ModalDialogue.DocumentViewer.DownloadAndOpen(sTitle, sURL);
        };

        var sName = null;
        TriSysSDK.Controls.FileManager.GetOpenFileURLFromWebServiceWithCallback(sTitle, sDocumentURL, sName, true, fnCallback);
    },

    DisplayPDFInViewer: function (sFileURL)
    {
		// Feb 2019: PDF Viewer does not work in Microsoft IE or Edge, so we need to simply use an iFrame
		$('#trisys-document-viewer-iframe').show();
        var iframe = document.getElementById('trisys-document-viewer-iframe');

        iframe.src = sFileURL;
		return;

        var pdfViewerObject = $('#ctrlDocumentViewer-pdf-viewer');

        // It cannot be 100% resized
        var iWidth = $('#trisys-document-viewer-converted-contents').parent().width();
        var iHeight = window.innerHeight - 300;
        pdfViewerObject.css("width", iWidth);
        pdfViewerObject.css("height", iHeight);

        pdfViewerObject.attr('data', sFileURL);

        pdfViewerObject.show();
    },

    DocumentViewerHeight: function ()
    {
        var iHeight = $(window).height();
        var iCaptionAndFooterHeight = 68 * 2;

        if (TriSysApex.Device.isPhone())
            iHeight = iHeight - iCaptionAndFooterHeight;
        else
            iHeight = iHeight - (iCaptionAndFooterHeight * 2);

        return iHeight;
    }
};

// Now display the document 
$(document).ready(function ()
{
    ctrlDocumentViewer.Open();
});