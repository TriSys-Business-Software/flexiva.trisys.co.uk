var ctrlHTMLEditor =
{
    _Editor: null,

    Load: function (sTitle, sDocumentPath, sName)
    {
        var fnShowFileContents = function (sFileContents)
        {
            ctrlHTMLEditor._Editor = ctrlHTMLEditor.ConvertDivToCodeEditor('ctrlHTMLEditor-HTML', sFileContents);
        };

        ctrlHTMLEditor.ReadFile(sDocumentPath, fnShowFileContents);
    },

    LoadHTML: function(sHTML)
    {
        ctrlHTMLEditor._Editor = ctrlHTMLEditor.ConvertDivToCodeEditor('ctrlHTMLEditor-HTML', sHTML);
    },

    GetHTML: function()
    {
        var sCode = ctrlHTMLEditor._Editor.getValue("\r\n");
        return sCode;
    },

    ReadFile: function (sDocumentPath, fnCallback)
    {
        var CFileStreamRequest =
        {
            FilePath: sDocumentPath
        };

        var payloadObject = {};

        // Call the API to submit the data to the server
        payloadObject.URL = "Files/GetFileStream";

        payloadObject.OutboundDataPacket = CFileStreamRequest;

        payloadObject.InboundDataFunction = function (CFileContents)
        {
            TriSysApex.UI.HideWait();

            if (CFileContents)
            {
                if (CFileContents.Success)
                {
                    // File contents are base64 web friendly
                    var sBase64Text = CFileContents.Base64Text;
                    var sFileContents = $.base64.decode(sBase64Text);
                    fnCallback(sFileContents);

                    return;
                }
                else
                    TriSysApex.UI.ShowMessage(CFileContents.ErrorMessage);
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('ctrlHTMLEditor.ReadFile: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Reading File...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    ConvertDivToCodeEditor: function (sID, sCode)
    {
        //var iHeightFactor = 260;
        //var lHeight = window.innerHeight - iHeightFactor;
        //$('#' + sID).height(lHeight);

        var mode = {
            name: "htmlmixed",
            scriptTypes: [
				{
					matches: /\/x-handlebars-template|\/x-mustache/i,
					mode: null
				},
				{
					matches: /(text|application)\/(x-)?vb(a|script)/i,
					mode: "vbscript"
				}
			]
        };

        var fileElement = document.getElementById(sID);
        var myCodeMirror = CodeMirror(fileElement, {
            lineNumbers: true,
            indentUnit: 4,
            mode: mode,
            value: sCode,

			// view-source:https://codemirror.net/demo/folding.html
			lineWrapping: true,
			//extraKeys: {"Ctrl-Q": function(cm){ cm.foldCode(cm.getCursor()); }},
			foldGutter: true,
			gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"]
        });

        $('.CodeMirror').css('height', 'auto');   //This allows us to use only one scrollbar in the form, but it is harder for developers to find the top buttons!
        //$('.CodeMirror').height(lHeight);
        myCodeMirror.refresh();

        return myCodeMirror;
    },

    SaveFile: function (sDocumentPath, fnCallback)
    {    
        var sCode = ctrlHTMLEditor.GetHTML();

        var CFileStreamWriteRequest =
        {
            FilePath: sDocumentPath,
            Base64Text: $.base64.encode(sCode)
        };

        var payloadObject = {};

        // Call the API to submit the data to the server
        payloadObject.URL = "Files/WriteFileStream";

        payloadObject.OutboundDataPacket = CFileStreamWriteRequest;

        payloadObject.InboundDataFunction = function (CFileStreamWriteResponse)
        {
            TriSysApex.UI.HideWait();

            if (CFileStreamWriteResponse)
            {
                if (CFileStreamWriteResponse.Success)
                {
                    fnCallback();

                    return;
                }
                else
                    TriSysApex.UI.ShowMessage(CFileStreamWriteResponse.ErrorMessage);
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('ctrlHTMLEditor.SaveFile: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Saving File...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    }
};