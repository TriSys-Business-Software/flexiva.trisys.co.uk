var ctrlDocumentEditor =
{	
	Load: function(sURL)
	{
		setTimeout(function()
		{
			ctrlDocumentEditor.LoadURLIntoiFrame(sURL);

		}, 10);
	},

	LoadURLIntoiFrame: function(sURL)
	{
		var iFrame = $('#trisys-document-editor-iframe');
		var parentBody = iFrame.parent();

	    // 23 Feb 2023: Latest DevExpress control uses 4 pixels more space!
		var iLatestDXVersionFactor = 4;

	    // 20 Jun 2023: Consider browser zoom factor
		var fZoomFactor = Math.round(window.devicePixelRatio * 100) / 100;

	    // It cannot be 100% resized
		var iWidth = parentBody.width() + 39;   //40;
		var iHeight = window.innerHeight - 250; //230;

		iHeight = iHeight * fZoomFactor;

	    // 20 Jun 2023: Fill entire area based upon sized dynamic content
		var sModalBodyDiv = TriSysApex.UI.GetLastOpenStackedModalDiv('trisys-modal-dynamic-content');
		iHeight = $('#' + sModalBodyDiv).height() + 20;


        iFrame.css("width", iWidth);
        iFrame.css("height", iHeight - iLatestDXVersionFactor);
		iFrame.css("margin-left", "-15px;");
		
		parentBody.css("margin-top", "-20px");
		parentBody.css("padding-left", "0px");
		parentBody.css("overflow-y", "");

		iFrame.attr('src', sURL);
	},

	DownloadAndOpenButtonClick: function (sTitle, sDocumentURL, sFullPath)
    {
		// Treat word and excel documents differently, because this document may be a UNC
		var sFileType = TriSysApex.Pages.FileManagerForm.DetermineFileTypeForImageFromFilePath(sFullPath);
		switch (sFileType) 
		{
			case 'word':
			case 'excel':
				// For office documents, make it available for download in it's original form
				var fnCallback = function (sTitle, sURL, sName)
				{
					TriSysApex.ModalDialogue.DocumentViewer.DownloadAndOpen(sTitle, sURL);
				};

				var sName = null;
				TriSysSDK.Controls.FileManager.GetOpenFileURLFromWebServiceWithCallback(sTitle, sFullPath, sName, true, fnCallback);
				return;
		}

        // Download and open it
        TriSysApex.ModalDialogue.DocumentViewer.DownloadAndOpen(sTitle, sDocumentURL);
    },

	OpenFullScreen: function(sDocumentURL)
	{
		// Open in new tab
		TriSysSDK.Browser.OpenURL(sDocumentURL);
	}
};
