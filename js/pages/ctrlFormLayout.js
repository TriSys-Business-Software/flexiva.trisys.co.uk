var ctrlFormLayout =
{
    MaximumColumnCount: 12,               // Standard bootstrap
    MaximumRowCount: 32,                  // Arbitary

    Load: function (rows)
    {
        var iHeightFactor = 300;
        var iHeight = $(window).height() - iHeightFactor;
        $('#form-layout-main-block').css('height', iHeight + 'px');

        ctrlFormLayout.Draw(rows);
    },

    Draw: function (rows)
    {
        // Read the rows/cols/rows/cols hierarchy from the current layout
        var firstRow = rows[0];
        var iColumnCount = firstRow.Columns.length;
        var iRowCount = rows.length;
        var lstColumnWidths = [];
        var lstInnerColumns = [];
        for (var i = 0; i < firstRow.Columns.length; i++)
        {
            var col = firstRow.Columns[i];
            lstColumnWidths.push(col.Width);
            if (col.Rows && col.Rows.length > 0)
            {
                var innerCols = col.Rows[0].Columns;
                lstInnerColumns.push(innerCols)
			}
		}


        // Apply numbers to the edit controls
        var sColumnsSpinner = 'formLayout-Columns';
        var fieldDescription = { MinValue: 1, MaxValue: ctrlFormLayout.MaximumColumnCount, SpinIncrement: 1 };
        TriSysSDK.Controls.NumericSpinner.Initialise(sColumnsSpinner, fieldDescription);
        TriSysApex.FieldEvents.AddNumberChangeFieldOfInterest(sColumnsSpinner, ctrlFormLayout.ChangeColumnCount);
        TriSysSDK.Controls.NumericSpinner.SetValue(sColumnsSpinner, iColumnCount);
        TriSysSDK.Controls.NumericSpinner.DecimalPlaces(sColumnsSpinner, 0);
            
        var sRowsSpinner = 'formLayout-Rows';
        fieldDescription = { MinValue: 1, MaxValue: ctrlFormLayout.MaximumRowCount, SpinIncrement: 1 };
        TriSysSDK.Controls.NumericSpinner.Initialise(sRowsSpinner, fieldDescription);
        TriSysSDK.Controls.NumericSpinner.SetValue(sRowsSpinner, iRowCount);
        TriSysSDK.Controls.NumericSpinner.DecimalPlaces(sRowsSpinner, 0);

        for (var i = 1; i <= ctrlFormLayout.MaximumColumnCount; i++)
        {
            // Width of columns
            var sColumnWidthSpinner = 'formLayout-Column' + i + 'Width';
            fieldDescription = { MinValue: 1, MaxValue: ctrlFormLayout.MaximumColumnCount, SpinIncrement: 1 };
            TriSysSDK.Controls.NumericSpinner.Initialise(sColumnWidthSpinner, fieldDescription);
            var iColumnWidth = 1;
            if (i <= lstColumnWidths.length)
                iColumnWidth = lstColumnWidths[i - 1];
            TriSysSDK.Controls.NumericSpinner.SetValue(sColumnWidthSpinner, iColumnWidth);
            TriSysSDK.Controls.NumericSpinner.DecimalPlaces(sColumnWidthSpinner, 0);

            var iInnerColumnCount = 1;
            if (i <= lstInnerColumns.length)
                iInnerColumnCount = lstInnerColumns[i - 1].length;

            var sInnerColumnsSpinner = 'formLayout-InnerColumns' + i;
            fieldDescription = { MinValue: 1, MaxValue: ctrlFormLayout.MaximumColumnCount, SpinIncrement: 1 };
            TriSysSDK.Controls.NumericSpinner.Initialise(sInnerColumnsSpinner, fieldDescription);
            TriSysApex.FieldEvents.AddNumberChangeFieldOfInterest(sInnerColumnsSpinner, ctrlFormLayout.ChangeInnerColumnCount);
            TriSysSDK.Controls.NumericSpinner.SetValue(sInnerColumnsSpinner, (iInnerColumnCount > 0 ? iInnerColumnCount : 1));
            TriSysSDK.Controls.NumericSpinner.DecimalPlaces(sInnerColumnsSpinner, 0);

            for (var j = 1; j <= ctrlFormLayout.MaximumColumnCount; j++)
            {
                var iColumnInnerWidth = 1;
                if (i <= lstInnerColumns.length)
                {
                    var innerCols = lstInnerColumns[i - 1];
                    if (j <= innerCols.length)
                        iColumnInnerWidth = innerCols[j - 1].Width;
				}

                var sInnerColumnsColumnWidthSpinner = 'formLayout-InnerColumns' + i + '-Column' + j + 'Width';
                fieldDescription = { MinValue: 1, MaxValue: ctrlFormLayout.MaximumColumnCount, SpinIncrement: 1 };
                TriSysSDK.Controls.NumericSpinner.Initialise(sInnerColumnsColumnWidthSpinner, fieldDescription);
                TriSysSDK.Controls.NumericSpinner.SetValue(sInnerColumnsColumnWidthSpinner, iColumnInnerWidth);
                TriSysSDK.Controls.NumericSpinner.DecimalPlaces(sInnerColumnsColumnWidthSpinner, 0);
            }

            ctrlFormLayout.ChangeInnerColumnCount(sInnerColumnsSpinner, (iInnerColumnCount > 0 ? iInnerColumnCount : 1))
        }

        ctrlFormLayout.ChangeColumnCount(sColumnsSpinner, iColumnCount);
    },

    // Called when user add/removes columns
    // Show/hide column rows
    ChangeColumnCount: function (sFieldID, fValue)
    {
        for (var i = 1; i <= ctrlFormLayout.MaximumColumnCount; i++)
        {
            var sID = "formLayout-innercolumn" + i + "-count";
            var bShow = (fValue >= i);
            var elem = $('#' + sID);
            bShow ? elem.show() : elem.hide();

            sID = "formLayout-innercolumn" + i + "-widths";
            elem = $('#' + sID);
            bShow ? elem.show() : elem.hide();

            sID = "formLayout-column" + i + "-width";
            elem = $('#' + sID);
            bShow ? elem.show() : elem.hide();
		}
    },

    ChangeInnerColumnCount: function (sFieldID, fValue)
    {
        var parts = sFieldID.split("formLayout-InnerColumns");
        var iColumnNumber = parseInt(parts[1]);

        for (var i = 1; i <= ctrlFormLayout.MaximumColumnCount; i++)
        {
            var sID = "formLayout-innercolumn" + iColumnNumber + "-width-" + i;
            var bShow = (fValue >= i);
            var elem = $('#' + sID);
            bShow ? elem.show() : elem.hide();
        }
    },

    // Commit the layout to the currently selected form designer tab
    Apply: function()
    {
        // Validation first e.g. number of column withs must not exceed 12
        var sValidationFailReason = "";

        // Number of column widths must total 12
        var iColumns = TriSysSDK.Controls.NumericSpinner.GetValue('formLayout-Columns');
        var iTotalWidth = 0;
        for (var i = 1; i <= iColumns; i++)
        {
            var iWidth = TriSysSDK.Controls.NumericSpinner.GetValue("formLayout-Column" + i + "Width");
            iTotalWidth += iWidth;
        }
        if (iTotalWidth != ctrlFormLayout.MaximumColumnCount)
            sValidationFailReason = "Total sum of all " + iColumns + " columns must equal " + ctrlFormLayout.MaximumColumnCount + ", not " + iTotalWidth;
        else
        {            
            for (var i = 1; i <= iColumns; i++)
            {
                var iInnerColumnCount = TriSysSDK.Controls.NumericSpinner.GetValue("formLayout-InnerColumns" + i);
                iTotalWidth = 0;
                for (var j = 1; j <= iInnerColumnCount; j++)
                {
                    var iWidth = TriSysSDK.Controls.NumericSpinner.GetValue("formLayout-InnerColumns" + i + "-Column" + j + "Width");
                    iTotalWidth += iWidth;
				}

                if (iTotalWidth != ctrlFormLayout.MaximumColumnCount)
                {
                    sValidationFailReason = "Total sum of all " + iInnerColumnCount + " inner columns in column " + i + " must equal " + ctrlFormLayout.MaximumColumnCount + ", not " + iTotalWidth;
                    break;
                }
            }
		}

        if (sValidationFailReason.length > 0)
        {
            TriSysApex.UI.ShowMessage(sValidationFailReason);
            return;
        }

        // So now generate the entire rows/cols collection to be written to the current tab in the form designer
        var iNumberOfRows = TriSysSDK.Controls.NumericSpinner.GetValue('formLayout-Rows');

        var rows = [];
        for (var iRow = 1; iRow <= iNumberOfRows; iRow++)
        {
            var row = { Columns: [] };
            for (var iColumn = 1; iColumn <= iColumns; iColumn++)
            {
                var iColumnWidth = TriSysSDK.Controls.NumericSpinner.GetValue("formLayout-Column" + iColumn + "Width");
                var col = { Width: iColumnWidth, Rows: [] };

                var iInnerColumnCount = TriSysSDK.Controls.NumericSpinner.GetValue("formLayout-InnerColumns" + iColumn);

                var columnRow = { Columns: [] };
                for (var j = 1; j <= iInnerColumnCount; j++)
                {
                    var iInnerColumnWidth = TriSysSDK.Controls.NumericSpinner.GetValue("formLayout-InnerColumns" + iColumn + "-Column" + j + "Width");
                    var innerColumn = { Width: iInnerColumnWidth };

                    columnRow.Columns.push(innerColumn);

                    //col.Rows.push(innerColumn);
                }

                col.Rows.push(columnRow);

                row.Columns.push(col);
            }

            rows.push(row);
		}

        return rows;
    }
};