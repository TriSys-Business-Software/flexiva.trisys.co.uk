var ctrlCombo =
{
    SaveFunctionCallback: null,
    Options: null,
    FieldID: "ctrlCombo-Combo",

    Load: function (options, fnSubmitCallback)
    {
        ctrlCombo.SaveFunctionCallback = fnSubmitCallback;
        ctrlCombo.Options = options;

        if (options)
        {
            if (options.Instructions) {
                $('#ctrlCombo-Instructions-tr').show();
                $('#ctrlCombo-Instructions').html(options.Instructions);
            }

            // Allow {Enter} to trigger save
            $('#ctrlCombo-Name').keyup(function (e) {
                if (e.keyCode == 13) {
                    var bSaved = ctrlCombo.Save();
                    e.stopPropagation();
                }
            });

            if (options.ComboLabel)
                $('#ctrlCombo-ComboLabel').html(options.ComboLabel);

            // 12 Dec 2024: We can now populate the combo from a data source with text and value, or simply a list of strings
            if (options.ComboList)
                TriSysSDK.CShowForm.populateComboFromListOfString(ctrlCombo.FieldID, options.ComboList);
			else if (options.ComboDataSource)
                TriSysSDK.CShowForm.populateComboFromDataSource(ctrlCombo.FieldID, options.ComboDataSource, 0);

            if (options.ComboSelectedItem)
                TriSysSDK.CShowForm.SetTextInCombo(ctrlCombo.FieldID, options.ComboSelectedItem);
            else if (options.ComboSelectedDataSourceItemValue)
                TriSysSDK.CShowForm.SetValueInCombo(ctrlCombo.FieldID, options.ComboSelectedDataSourceItemValue);
        }
    },

    Save: function ()
    {
        var sComboText = TriSysSDK.CShowForm.GetTextFromCombo(ctrlCombo.FieldID);
        var sComboValue = TriSysSDK.CShowForm.GetValueFromCombo(ctrlCombo.FieldID);
        var bError = false;

		// 12 Dec 2024: We can return both text and the value
        if (ctrlCombo.SaveFunctionCallback)
            return ctrlCombo.SaveFunctionCallback(sComboText, sComboValue);
    }
};