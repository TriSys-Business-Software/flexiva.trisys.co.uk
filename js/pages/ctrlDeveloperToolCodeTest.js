var ctrlDeveloperToolCodeTest =
{
	Load: function(sFileName, sHTML, sJavascript, fnCallback)
	{
		// Load Javascript
		ctrlDeveloperToolCodeTest.LoadCodeEditor('ctrlDeveloperToolCodeTest-Javascript-CodeEditor', sJavascript, false);

		// Load HTML
		var sHTMLDiv = '#ctrlDeveloperToolCodeTest-HTML';
		sHTML = ctrlDeveloperToolCodeGenerator.ReplaceFieldsInCode(sHTML);
		$(sHTMLDiv).html(sHTML);
		ctrlDeveloperToolCodeTest.LoadCodeEditor('ctrlDeveloperToolCodeTest-HTML-CodeEditor', sHTML, true);

		// Tell CShowForm that we are initialised and it can customise the widgets
		var sFormName = TriSysApex.Pages.FileManagerForm.FileNameWithoutSuffix(sFileName);
        TriSysSDK.CShowForm.InitialiseFields(sFormName);

		// Allow time for the theme to propagate
		setTimeout(TriSysProUI.kendoUI_Overrides, 100);

		// Now fire the function which runs the dynamic JS
		fnCallback();       
	},

	LoadCodeEditor: function(sID, sCode, bHTML)
	{
		var mode = DeveloperStudio.GetCodeEditorMode(bHTML);
		var codeEditor = DeveloperStudio.ConvertDivToCodeEditor(sID, sCode, mode);
		codeEditor.setValue(sCode);
		codeEditor.setOption('readOnly', true);

		var lHeight = (window.innerHeight * 0.25);
		codeEditor.setSize('100%', lHeight);

		// Need a border
		var sBorderColour = TriSysProUI.GroupBorderColour();
		$('#' + sID).css('border', '1px solid ' + sBorderColour);

	    // 03 Apr 2023: curved radius
		$('#' + sID).css('border-radius', '8px');           
		$('#' + sID).children(":first").css('border-radius', '8px'); 
	}
};