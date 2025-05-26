var ctrlNewWithCombo =
{
    SaveFunctionCallback: null,
    _Options: null,

    Load: function (options, fnSubmitCallback)
    {
        ctrlNewWithCombo.SaveFunctionCallback = fnSubmitCallback;
        ctrlNewWithCombo._Options = options;

        if(options)
        {
            if (options.TextLabel)
                $('#ctrlNewWithCombo-TextLabel').html(options.TextLabel);

            if (options.Value)
                $('#ctrlNewWithCombo-Name').val(options.Value);

            if (options.Instructions) {
                $('#ctrlNewWithCombo-Instructions-tr').show();
                $('#ctrlNewWithCombo-Instructions').html(options.Instructions);
            }

            // Allow {Enter} to trigger save
            $('#ctrlNewWithCombo-Name').keyup(function (e)
            {
                if (e.keyCode == 13)
                {
                    var bSaved = ctrlNewWithCombo.Save();
                    e.stopPropagation();
                }
            });

            if(options.ComboLabel)
                $('#ctrlNewWithCombo-ComboLabel').html(options.ComboLabel);

            if (options.ComboList)
                TriSysSDK.CShowForm.populateComboFromListOfString("ctrlNewWithCombo-Combo", options.ComboList);

            if (options.ComboSelectedItem)
                TriSysSDK.CShowForm.SetTextInCombo("ctrlNewWithCombo-Combo", options.ComboSelectedItem);

            // 17 Apr 2025: Now with multiple combos
            if (options.AdditionalComboList)
            {
                options.AdditionalComboList.forEach(function (combo, index)
                {
					const iRowIndex = index + 3;
                    $('#ctrlNewWithCombo-Row-' + iRowIndex).show();
                    $('#ctrlNewWithCombo-ComboLabel-Row-' + iRowIndex).html(combo.Label);
                    TriSysSDK.CShowForm.populateComboFromListOfString("ctrlNewWithCombo-Combo-Row-" + iRowIndex, combo.List);
                });
            }

			if (options.TextLabelPositionRow && options.TextLabelPositionRow > 1)
			{
				// Move the TextLabel row to the specified position
				for (var iRowIndex = 1; iRowIndex < options.TextLabelPositionRow; iRowIndex++)
				{
                    ctrlNewWithCombo.MoveRowDown('ctrlNewWithCombo-Row-1');
				}
			}
        }
    },

    MoveRowDown: function (sID)
    {
        // Find the row by ID
        var row = $("#" + sID);

        // Check if the row exists
        if (row.length === 0)
        {
            console.error("Row not found");
            return false;
        }

        // Get the next row
        var nextRow = row.next("tr");

        // Check if there is a next row
        if (nextRow.length === 0)
        {
            console.error("Already at the bottom");
            return false;
        }

        // Move the row down by placing it after the next row
        nextRow.after(row);
    },

    Save: function()
    {
        // Validate the data entry
        var sName = $('#ctrlNewWithCombo-Name').val();
        var sComboValue = TriSysSDK.CShowForm.GetTextFromCombo("ctrlNewWithCombo-Combo");
        var bError = false;

        var sField = $('#ctrlNewWithCombo-TextLabel').html();

        if (!sName) bError = TriSysApex.Toasters.ErrorValidatingField(sField);
        if (bError) return false;

        // 17 Apr 2025: Additional combos
		var lstAdditionalValue = [];
        if (ctrlNewWithCombo._Options.AdditionalComboList)
        {
            ctrlNewWithCombo._Options.AdditionalComboList.forEach(function (combo, index)
            {
                const iRowIndex = index + 3;
                const sValue = TriSysSDK.CShowForm.GetTextFromCombo('ctrlNewWithCombo-Combo-Row-' + iRowIndex);
                if (sValue) 
					lstAdditionalValue.push(sValue);
            });
        }

        if (ctrlNewWithCombo.SaveFunctionCallback)
            return ctrlNewWithCombo.SaveFunctionCallback(sName, sComboValue, lstAdditionalValue);
    }

};  // ctrlNewWithCombo