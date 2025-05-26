// We expect that the caller has hosted us in an HTML page which is hosted INSIDE an iframe.
// This is because our HTML document may contain CSS style overrides which could adversely
// affect the hosting application e.g. <body.. <font.. <margin... <p...
//

var ctrlCVPreview =
{
    Load: function ()
    {
        // Nothing to do as we are entirely programmatically controlled
    },

    // External callback when we are to show this record
    Open: function (sCVurl)
    {
        ctrlCVPreview.ShowContactCV(sCVurl);
    },

    ShowContactCV: function (sCVurl)
    {
        if (!sCVurl)
        {
            ctrlCVPreview.HideCVViewers();
            return;
        }

        // Is this an HTML reference?
        var bUseExternalViewer = !TriSysSDK.Controls.FileManager.isHTMLFile(sCVurl);
        if (bUseExternalViewer)
        {
            // Deal with PDF's etc..
            ctrlCVPreview.DisplayNonWordDocumentInViewer(sCVurl);
            return;
        }

        // We expect this to be a CV (or in fact any other HTML) URL
        ctrlCVPreview.DisplayContactCV(sCVurl);
    },

    DisplayContactCV: function (sCVurl)
    {
        if (TriSysSDK.Controls.FileManager.isPDFFile(sCVurl))
        {
            ctrlCVPreview.ShowingPDF(true);
            ctrlCVPreview.DisplaPDFInViewer(sCVurl);
        }
        else
        {
            ctrlCVPreview.ShowingPDF(false);
            $('#ctrlCVPreview-document-viewer-converted-contents').load(sCVurl, function (response, status, xhr)
            {
                if (status == "error")
                {
                    var msg = "Document Conversion Error: ";
                    TriSysApex.UI.ShowError(null, msg + xhr.status + " " + xhr.statusText);
                    return;
                }
            });
        }
    },

    DisplayNonWordDocumentInViewer: function (sURL)
    {
        if (TriSysSDK.Controls.FileManager.isPDFFile(sURL))
        {
            ctrlCVPreview.ShowingPDF(true);
            ctrlCVPreview.DisplaPDFInViewer(sURL);
        }
        else
        {
            // TODO: integrated external viewer...
            // 11 Nov 2022: Assume an image
            var sHTML = '<img src="' + sURL + '" style="width:100%;">';
            $('#ctrlCVPreview-document-viewer-converted-contents').html(sHTML);            
        }
    },

    DisplaPDFInViewer: function (sFileURL)
    {
        var pdfViewerObject = $('#ctrlCVPreview-document-viewer-pdf-viewer');

        // It cannot be 100% resized
        //var iWidth = $('#ctrlCVPreview-cv-block').parent().width() - 25;
        //pdfViewerObject.css("width", iWidth);

        pdfViewerObject.attr('data', sFileURL);
    },

    ShowingPDF: function (bPDF)
    {
        var pdfViewerObject = $('#ctrlCVPreview-document-viewer-pdf-viewer');
        var wordViewerObject = $('#ctrlCVPreview-document-viewer-converted-contents');
        if (bPDF)
        {
            pdfViewerObject.show();
            wordViewerObject.hide();
        }
        else
        {
            pdfViewerObject.hide();
            wordViewerObject.show();
        }
    },

    HideCVViewers: function ()
    {
        var pdfViewerObject = $('#ctrlCVPreview-document-viewer-pdf-viewer');
        pdfViewerObject.hide();
        var wordViewerObject = $('#ctrlCVPreview-document-viewer-converted-contents');
        wordViewerObject.hide();
    },
    
    Zoom: function (fZoom, lFixedHeight)        // ctrlCVPreview.Zoom
    {
        var viewerDOMObject = $('#ctrlCVPreview-document-viewer-converted-contents');
        var lHeight = viewerDOMObject.height();
        var iTime = 400;
        //viewerDOMObject.animate({ zoom: fZoom, height: lFixedHeight / fZoom }, 400);
        viewerDOMObject.animate({ zoom: fZoom }, 400);
    },

    // 05 July 2023
    _ZoomFactor: 0.95,
    ZoomIn: function()
    {
        ctrlCVPreview._ZoomFactor += 0.25;
        ctrlCVPreview.Zoom(ctrlCVPreview._ZoomFactor, 800);
    },

    ZoomOut: function()
    {
        ctrlCVPreview._ZoomFactor -= 0.25;
        ctrlCVPreview.Zoom(ctrlCVPreview._ZoomFactor, 800);
    }

};  // ctrlCVPreview


$(document).ready(function ()
{
    ctrlCVPreview.Load();
});