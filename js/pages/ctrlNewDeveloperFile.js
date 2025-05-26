var ctrlNewDeveloperFile =
{
    Enum_PairedHTMLandJSFiles: 0,
    Enum_HTMLFile: 1,
    Enum_JSFile: 2,
    Enum_JSONFile: 3,
    Enum_CustomerModuleJSFile: 4,
    Enum_NavBarJSONFile: 5,
    Enum_FormsJSONFile: 6,
    Enum_WebJobsJSONFile: 7,
    Enum_WebJobsModuleJSFile: 8,
    Enum_FormFile: 9,

    HTMLLayoutType: '',     // Check box change

    Load: function()
    {
        // Load the types of file we can create
        var types = [
            { value: ctrlNewDeveloperFile.Enum_FormFile, text: "Form" },
            { value: ctrlNewDeveloperFile.Enum_PairedHTMLandJSFiles, text: "Paired HTML and JS Files" },
            { value: ctrlNewDeveloperFile.Enum_HTMLFile, text: "HTML File" },
            { value: ctrlNewDeveloperFile.Enum_JSFile, text: "Javascript File" },
            { value: ctrlNewDeveloperFile.Enum_JSONFile, text: "JSON Data File" },
            { value: ctrlNewDeveloperFile.Enum_CustomerModuleJSFile, text: "Customer Module Javascript File" },
            { value: ctrlNewDeveloperFile.Enum_NavBarJSONFile, text: "Navigation Bar JSON File" },
            { value: ctrlNewDeveloperFile.Enum_FormsJSONFile, text: "Forms JSON File" },
            { value: ctrlNewDeveloperFile.Enum_WebJobsJSONFile, text: "Web Jobs JSON File" },
            { value: ctrlNewDeveloperFile.Enum_WebJobsModuleJSFile, text: "Web Jobs Module Javascript File" }
        ];

        TriSysSDK.CShowForm.populateComboFromDataSource('ctrlNewDeveloperFile-Type', types, 0, ctrlNewDeveloperFile.TypeChangeEvent);

        // Mutually exclusive check boxes
        var checkBoxes = ['ctrlNewDeveloperFile-layout-block', 'ctrlNewDeveloperFile-layout-blockmenu', 'ctrlNewDeveloperFile-layout-tabbed'];
        checkBoxes.forEach(function (sID)
        {
            $('#' + sID).click(function ()
            {
                checkBoxes.forEach(function (sIDOff)
                {
                    TriSysSDK.CShowForm.SetCheckBoxValue(sIDOff, false);
                });
                TriSysSDK.CShowForm.SetCheckBoxValue(sID, true);
                ctrlNewDeveloperFile.HTMLLayoutType = sID.replace('ctrlNewDeveloperFile-layout', '');
            });
        });
        
        ctrlNewDeveloperFile.TypeChangeEvent(types[0].value, types[0].text);

        // Set focus on name
        $('#ctrlNewDeveloperFile-Name').focus();
    },

    TypeChangeEvent: function (value, sText)
    {
        var bNameVisible = true;
        var sName = null;
        var bLayoutVisible = true;
        var bLayoutTabbedFormVisible = false;

        var iFileType = parseInt(value);
        switch (iFileType)
        {
            case ctrlNewDeveloperFile.Enum_FormFile:
                bLayoutVisible = false;
                break;

            case ctrlNewDeveloperFile.Enum_PairedHTMLandJSFiles:
                bLayoutTabbedFormVisible = true;
                break;

            case ctrlNewDeveloperFile.Enum_JSFile:
                bLayoutVisible = false;
                break;

            case ctrlNewDeveloperFile.Enum_JSONFile:
                bLayoutVisible = false;
                break;

            case ctrlNewDeveloperFile.Enum_CustomerModuleJSFile:
                bNameVisible = false;
                sName = "CustomerModule";
                bLayoutVisible = false;
                break;

            case ctrlNewDeveloperFile.Enum_NavBarJSONFile:
                bNameVisible = false
                sName = "NavBar";
                bLayoutVisible = false;
                break;

            case ctrlNewDeveloperFile.Enum_FormsJSONFile:
                bNameVisible = false;
                sName = "Forms";
                bLayoutVisible = false;
                break;

            case ctrlNewDeveloperFile.Enum_WebJobsJSONFile:
                bNameVisible = false;
                sName = "WebJobs";
                bLayoutVisible = false;
                break;

            case ctrlNewDeveloperFile.Enum_WebJobsModuleJSFile:
                bNameVisible = false;
                sName = "WebJobsModule";
                bLayoutVisible = false;
                break;
        }

        $('#ctrlNewDeveloperFile-Name').attr("disabled", !bNameVisible);
        if (sName)
            $('#ctrlNewDeveloperFile-Name').val(sName);

        var layoutRow = $('#ctrlNewDeveloperFile-Layout-tr');
        bLayoutVisible ? layoutRow.show() : layoutRow.hide();

        var layoutTabbedColumnImage = $('#ctrlNewDeveloperFile-layout-tabbed-column-image');
        var layoutTabbedColumnCheckBox = $('#ctrlNewDeveloperFile-layout-tabbed-column-checkbox');
        bLayoutTabbedFormVisible ? layoutTabbedColumnImage.show() : layoutTabbedColumnImage.hide();
        bLayoutTabbedFormVisible ? layoutTabbedColumnCheckBox.show() : layoutTabbedColumnCheckBox.hide();
    },

    GetFileSpecification: function()
    {
        // Validation
        var sName = $('#ctrlNewDeveloperFile-Name').val();

        // Cannot have illegal characters in files
        var sFile = TriSysSDK.Controls.FileManager.StripInconvenientFileNameCharacters(sName, true);

        // Strip out suffix too
        if (sFile)
            sFile = sFile.replace(/\.html/g, '');
        if (sFile)
            sFile = sFile.replace(/\.js/g, '');
        if (sFile)
            sFile = sFile.replace(/\.json/g, '');
        if (sFile)
            sFile = sFile.replace(/\./g, '');

		// No hyphens, numbers, dots or spaces also as this will break the auto-generated forms
		sFile = sFile.replace(/-/g, '');
		sFile = sFile.replace(/ /g, '');
		sFile = sFile.replace(/\./g, '');
		sFile = sFile.replace(/[0-9]/g, '');

        if(!sFile)
        {
            TriSysApex.UI.ShowMessage("Please enter a file friendly name.");
            return null;
        }

        // The generated HTML file can be blank, blocks or tabbed
        var sHTMLType = ctrlNewDeveloperFile.HTMLLayoutType;

        // Could be 1 or 2 files
        var fileSpecification = [];

        var iFileType = parseInt(TriSysSDK.CShowForm.GetValueFromCombo('ctrlNewDeveloperFile-Type'));
        switch(iFileType)
        {
            case ctrlNewDeveloperFile.Enum_FormFile:
                fileSpecification.push({ FileName: sFile + '.form', Template: 'form' + sHTMLType + '.form' });
                break;
            case ctrlNewDeveloperFile.Enum_PairedHTMLandJSFiles:
                fileSpecification.push({ FileName: sFile + '.html', Template: 'paired' + sHTMLType + '.html' });
                fileSpecification.push({ FileName: sFile + '.js', Template: 'paired' + sHTMLType + '.js' });
                break;
            case ctrlNewDeveloperFile.Enum_HTMLFile:
                fileSpecification.push({ FileName: sFile + '.html', Template: 'standalone' + sHTMLType + '.html' });
                break;
            case ctrlNewDeveloperFile.Enum_JSFile:
                fileSpecification.push({ FileName: sFile + '.js', Template: 'standalone.js' });
                break;
            case ctrlNewDeveloperFile.Enum_JSONFile:
                fileSpecification.push({ FileName: sFile + '.json', Template: 'standalone.json' });
                break;
            case ctrlNewDeveloperFile.Enum_CustomerModuleJSFile:
                fileSpecification.push({ FileName: sFile + '.js', Template: 'customermodule.js' });
                break;
            case ctrlNewDeveloperFile.Enum_NavBarJSONFile:
                fileSpecification.push({ FileName: sFile + '.json', Template: 'navbar.json' });
                break;
            case ctrlNewDeveloperFile.Enum_FormsJSONFile:
                fileSpecification.push({ FileName: sFile + '.json', Template: 'forms.json' });
                break;
            case ctrlNewDeveloperFile.Enum_WebJobsJSONFile:
                fileSpecification.push({ FileName: sFile + '.json', Template: 'webjobs.json' });
                break;
            case ctrlNewDeveloperFile.Enum_WebJobsModuleJSFile:
                fileSpecification.push({ FileName: sFile + '.js', Template: 'webjobsmodule.js' });
                break;
        }

        return fileSpecification;
    }
};

$(document).ready(function ()
{
    ctrlNewDeveloperFile.Load();
});