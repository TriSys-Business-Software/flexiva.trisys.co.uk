var ctrlUserFriendlyHTMLEditor =
{
    EditorID: 'user-friendly-editor',

    // Called by TriSysSDK.Controls.FileManager.OpenHTMLEditorForEditOnly()
    Load: function (sTitle, sHTML)
    {
        ctrlUserFriendlyHTMLEditor.InitialiseDocumentEditor(sHTML);

        // Hide scrollbar on popup form
        var fnScrollbars = function () {
            var sModalBodyDiv = TriSysApex.UI.GetLastOpenStackedModalDiv('trisys-modal-dynamic-content');
            $('#' + sModalBodyDiv).css('overflow-y', '');
        };
        setTimeout(fnScrollbars, 100);
    },

    InitialiseDocumentEditor: function (sHTML)
	{
		var lWindowHeight = $(window).height();
		var iFudgeFactor = 350; //320;
		var lEditorHeight = lWindowHeight - iFudgeFactor;

        // 20 Jun 2023: Fill entire area based upon sized dynamic content
		var sModalBodyDiv = TriSysApex.UI.GetLastOpenStackedModalDiv('trisys-modal-dynamic-content');
		lEditorHeight = $('#' + sModalBodyDiv).height() - 80;

		TriSysSDK.Froala.InitialiseEditor(
			{ 
				ID: ctrlUserFriendlyHTMLEditor.EditorID, 
				FullPage: false, 
				DropEnabled: false, 
				Height: lEditorHeight,
				HTML: sHTML
			}
		);
    },

    ReadHTML: function()
	{
        var sHTML = TriSysSDK.Froala.GetHTML(ctrlUserFriendlyHTMLEditor.EditorID);

        // 09 Nov 2022: Strip repeat newlines
        sHTML = ctrlUserFriendlyHTMLEditor.StripRepeatedNewLines(sHTML);

        return sHTML;
    },

    // End users paste job descriptions into the editor.
    // We need to strip multiple repeated <br> and <p></p>
    StripRepeatedNewLines: function(sHTML)
    {
        if (sHTML)
        {
            debugger;
            var sNewLine = '\n', sNewLines = sNewLine + sNewLine;
            
            while (sHTML.indexOf(sNewLines) >= 0) {
                sHTML = sHTML.replace(sNewLines, '');
            }
            //sHTML = sHTML.replace(/<br>/g, '');
            //sHTML = sHTML.replace(/<p><\/p>/g, '');

            // Strip all newlines
            while (sHTML.indexOf(sNewLine) >= 0) {
                sHTML = sHTML.replace(sNewLine, '');
            }

        }

        return sHTML;
    }

};  // ctrlUserFriendlyHTMLEditor

