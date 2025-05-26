// 29 Nov 2024: Allow multiple fields to be added to any new record
var ctrlNewWithMultipleFields = {

    SaveFunctionCallback: null,
    Options: null,

    Load: function (options, fnSubmitCallback)
	{
        ctrlNewWithMultipleFields.SaveFunctionCallback = fnSubmitCallback;
		ctrlNewWithMultipleFields.Options = options;

        if (options)
        {
            if (options.Instructions)
            {
                $('#ctrlNewWithMultipleFields-Instructions-tr').show();
                $('#ctrlNewWithMultipleFields-Instructions').html(options.Instructions);
            }

            if (options.Fields)
            {
                var iCount = 0;
                options.Fields.forEach(function (field)
                {
                    iCount++;
                    const tr = $('#ctrlNewWithMultipleFields-Row-' + iCount + '-tr');
                    tr.show();
                    const spanLabel = $('#ctrlNewWithMultipleFields-Label' + iCount);
                    spanLabel.text(field.Label);

                    const textBox = $('#ctrlNewWithMultipleFields-Value' + iCount);
                    if (field.Value)
                        textBox.val(field.Value);
					if (field.MaxLength)
                        textBox.attr('maxlength', field.MaxLength);
                    if (field.Required)
                        textBox.attr('required', true);

                    // Allow {Enter} to trigger save
                    textBox.keyup(function (e)
                    {
                        if (e.keyCode == 13)
                        {
                            var bSaved = ctrlNewWithMultipleFields.Save();
                            e.stopPropagation();
                        }
                    });

                    if (iCount == 1)
                        textBox.focus();

                });
            }         

            // 18 Feb 2025: Combo fields too
            if (options.ComboFields)
            {
                var iCount = 0;
                options.ComboFields.forEach(function (field)
                {
                    iCount++;
                    const tr = $('#ctrlNewWithMultipleFields-ComboRow-' + iCount + '-tr');
                    tr.show();
                    const spanLabel = $('#ctrlNewWithMultipleFields-ComboLabel' + iCount);
                    spanLabel.text(field.Label);

                    const sID = "ctrlNewWithMultipleFields-Combo" + iCount;
                    if (field.ComboList)
                        TriSysSDK.CShowForm.populateComboFromListOfString(sID, field.ComboList);

                    if (field.ComboSelectedItem)
                        TriSysSDK.CShowForm.SetTextInCombo(sID, options.ComboSelectedItem);                    

                });
            }          
        }
    },

    // Modal Save button
    Save: function ()
    {
        const options = ctrlNewWithMultipleFields.Options;

        // Validate the data entry
        if (options.Fields)
        {
            var iCount = 0;
            var sError = '';
            options.Fields.forEach(function (field)
            {
                iCount++;

                const textBox = $('#ctrlNewWithMultipleFields-Value' + iCount);
                field.Value = textBox.val();
                if (field.Required)
                    field.ValidationFailed = (field.Value === '');

                if (field.ValidationFailed)
                    sError += field.Label + ' is required<br>';
            });

            if (sError.length > 0)
            {
                TriSysApex.UI.ShowMessage(sError);
                return false;
            }
        }

        // 18 Feb 2025: Combo fields too
        if (options.ComboFields)
        {
            var iCount = 0;
            options.ComboFields.forEach(function (field)
            {
                iCount++;
                const sID = "ctrlNewWithMultipleFields-Combo" + iCount;
				field.Value = TriSysSDK.CShowForm.GetTextFromCombo(sID);
            });
        }      

        if (ctrlNewWithMultipleFields.SaveFunctionCallback)
            return ctrlNewWithMultipleFields.SaveFunctionCallback(options.Fields, options.ComboFields);
    }

};	// ctrlNewWithMultipleFields.js