var reportsForm =
{
    BlockReportSelectorID: 'reportsForm-ReportSelectorBlock',
    BlockReportRunGridID: 'reportsForm-ReportRunGridBlock',

    ReportsGridID: 'reportsForm-ListOfReportsGrid',
    RunReportGridID: 'reportsForm-RunReportGrid',
    NoReportDataID: 'reportsForm-NoReportData',

    CategoryAll: "All",

    SelectedReportNameID: 'reportsForm-SelectedReportName',

    ParameterField_Year: 'reportsForm-Parameter-Year',
    ParameterField_Month: 'reportsForm-Parameter-Month',
    ParameterField_Consultant: 'reportsForm-Parameter-Consultant',
	ParameterField_Consultants: 'reportsForm-Parameter-Consultants',
    ParameterField_WeekEndingSunday: 'reportsForm-Parameter-WeekEndingSunday',
	ParameterField_StartDate: 'reportsForm-Parameter-StartDate',
	ParameterField_EndDate: 'reportsForm-Parameter-EndDate',
	ParameterField_NumericRangeStart: 'reportsForm-Parameter-NumericRange-Start',
	ParameterField_NumericRangeEnd: 'reportsForm-Parameter-NumericRange-End',
	ParameterField_PostCodeRadialMileage: 'reportsForm-Parameter-PostCodeRadial-Mileage',
	ParameterField_PostCodeRadialPostCode: 'reportsForm-Parameter-PostCodeRadial-PostCode',


    Load: function()
    {
        // Go straight to the Web API to get the list of all reports
        var payloadObject = {};

        // Call the API to submit the data to the server
        payloadObject.URL = "Reports/CategoriesAndReports";

        payloadObject.InboundDataFunction = function (CCategoriesAndReports)
        {
            TriSysApex.UI.HideWait();

            if (CCategoriesAndReports)
            {
                if (CCategoriesAndReports.Success)
                {
                    // Store locally
                    reportsForm.Data._Categories = CCategoriesAndReports.Categories;
                    reportsForm.Data._Reports = CCategoriesAndReports.Reports;

                    // Load visuals after we have data
                    reportsForm.LoadReports();

                    return;
                }
                else
                    TriSysApex.UI.ShowMessage(CCategoriesAndReports.ErrorMessage);
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('reportsForm.Load: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Reading Reports...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    // Called after Web API has returned all report categories
    LoadReports: function (reportCategories)
    {
        var sFieldID = 'reportsForm-Category';

        var categories = reportsForm.Data.Categories(true);
        if (!categories)
            return;

        var fnSelectCategory = function (sDescription, sCategory)
        {
            $('#reportsForm-CategoryDescription').html(sDescription);
            reportsForm.PopulateGrid(sCategory);
        }

        TriSysSDK.CShowForm.populateComboFromDataSource(sFieldID, categories, 0, fnSelectCategory);

        var sTopCategory = categories[0].text;
        fnSelectCategory("", sTopCategory);

        // Load parameters
        reportsForm.Parameters.Load();
    },

    // Grid of all reports
    PopulateGrid: function (sCategory)
    {
        var reports = reportsForm.Data.Reports(sCategory);

        var sDivTag = reportsForm.ReportsGridID;
        var sGridName = sDivTag + '-GridInstance';

        TriSysSDK.Grid.VirtualMode({
            Div: sDivTag,
            ID: sGridName,
            Title: "Reports",
            RecordsPerPage: TriSysApex.UserOptions.RecordsPerPage(),
            PopulationByObject: reports,
            Columns: [
                { field: "ID", title: "ID", type: "string", width: 70, hidden: true },
                { field: "Category", title: "Category", type: "string", width: 200 },
                { field: "DisplayName", title: "Report Name", type: "string", width: 300 },
                { field: "Description", title: "Description", type: "string" }
            ],

            KeyColumnName: "ID",
            DrillDownFunction: function (rowData)
            {
                reportsForm.RunReport(rowData);
            },
            OpenButtonCaption: "Run",
            MultiRowSelect: false,
            Grouping: false,
            RecordType: "reports",
            HyperlinkedColumns: ["DisplayName"]        // New Jan 2021
        });
    },

    _lastReportRan: null,

    RunReport: function (report)
    {
        $('#' + reportsForm.SelectedReportNameID).html(report.DisplayName);
        reportsForm.ToggleBlocks(true);
        reportsForm.PopulateRunReportGrid(report);
        reportsForm.Parameters.AfterReportSelection();

        reportsForm._lastReportRan = report;
    },

    ToggleBlocks: function(bShowRunReportGrid)
    {
        var elemReportSelectorBlock = $('#' + reportsForm.BlockReportSelectorID);
        var elemReportRunGridBlock = $('#' + reportsForm.BlockReportRunGridID);

        bShowRunReportGrid ? elemReportSelectorBlock.hide() : elemReportSelectorBlock.show();
        bShowRunReportGrid ? elemReportRunGridBlock.show() : elemReportRunGridBlock.hide();

        if(!bShowRunReportGrid)
        {
            // Clear the grid so that next invocation shows no data
            TriSysSDK.Grid.Empty(reportsForm.RunReportGridID);
        }
    },

    ToggleNoDataBlock: function(bNoData)
    {
        var elemNoReportDataBlock = $('#' + reportsForm.NoReportDataID);
        bNoData ? elemNoReportDataBlock.show() : elemNoReportDataBlock.hide();
    },

    ExportToExcel: function()
    {
		TriSysSDK.Grid.ExportToExcel(reportsForm.RunReportGridID);
	},    

    // WARNING: The export to PDF does not work in October 2016.
    // This may be because we are running an older KendoUI?
    ExportToPDF: function()
    {
        try
        {
            var grid = $("#" + reportsForm.RunReportGridID).data("kendoGrid");

            // Get all rows from grid
            var options = grid.getOptions();
            options.pdf = {
                allPages: true,
                paperSize: "A4",
                landscape: true,
                scale: 0.55
            };

            // Set these options
            grid.setOptions(options);

            grid.saveAsPDF();

        } catch (e)
        {
            TriSysApex.UI.errorAlert(TriSysApex.Logging.CatchVariableToText(e));
        }
    },

    PopulateRunReportGrid: function(report)
    {
        var sDivTag = reportsForm.RunReportGridID;
        var sGridName = sDivTag + '-GridInstance';

        // Do not trust the grid returning a nice data structure, get the report again from the file
        var sReportID = report.ID;
        report = reportsForm.Data.ReportByID(sReportID);
        reportsForm._Report = report;

        if (!report)
        {
            TriSysApex.UI.ShowMessage("Unable to find report: " + sReportID);
            return;
        }

		// If we can select the grid, then we can run actions against it
		if(report.MultiRowSelect && report.ActionEntityName)
		{
			var sCallbackFunction = 'reportsForm.ActionInvocation';
			TriSysActions.Menus.Draw('ReportActionsMenu', report.ActionEntityName, sCallbackFunction);
			TriSysSDK.FormMenus.DrawGridMenu('ReportGridMenu', 'reportsForm-RunReportGrid');
		}

        reportsForm.ToggleNoDataBlock(false);

        // Jan 2018: Use a dedicated API method which abstracts the underlying SQL and does not use 'SQLDatabase/SQL_Select'
        var fnPopulationByFunction = {
            API: "Reports/Run",                 // The Web API Controller/Function

            // The additional parameters passed into the function not including the paging metrics
            Parameters: function (request)
            {
                request.ReportId = sReportID;

				// Send all possible fields to the Web API to do replacements in SQL	
				var lstFields = [];
				lstFields.push({ Name: 'Year', Value: reportsForm.Parameters.GetYear()});
				lstFields.push({ Name: 'Month', Value: reportsForm.Parameters.GetMonth()});
				lstFields.push({ Name: 'ConsultantName', Value: reportsForm.Parameters.GetConsultantName()});
				lstFields.push({ Name: 'ConsultantUserId', Value: reportsForm.Parameters.GetConsultantUserId()});
				lstFields.push({ Name: 'Consultants', LongList: reportsForm.Parameters.GetConsultantsIdList()});
				lstFields.push({ Name: 'WeekEndingSunday', Value: reportsForm.Parameters.GetWeekEndingSunday()});
				lstFields.push({ Name: 'StartDate', Value: reportsForm.Parameters.GetStartDate()});
				lstFields.push({ Name: 'EndDate', Value: reportsForm.Parameters.GetEndDate()});
				lstFields.push({ Name: 'NumericRangeStart', Value: reportsForm.Parameters.GetNumericRangeValue(reportsForm.ParameterField_NumericRangeStart)});
				lstFields.push({ Name: 'NumericRangeEnd', Value: reportsForm.Parameters.GetNumericRangeValue(reportsForm.ParameterField_NumericRangeEnd)});
				lstFields.push({ Name: 'PostCodeRadialMileage', Value: reportsForm.Parameters.GetPostCodeRadialMileage()});
				lstFields.push({ Name: 'PostCodeRadialCode', Value: reportsForm.Parameters.GetPostCodeRadialPostCode()});

				// Dynamic fields
				if(report.Parameters)
				{
					$.each(report.Parameters, function (index, parameter)
					{
						// Is a skill field?
						if(parameter.skill)
						{
							lstFields.push({ 
								Name: parameter.field, 
								LongList: TriSysSDK.CShowForm.GetSelectedValuesFromListAsArray("reportsForm-DynamicSkillParameter-" + parameter.field),
								TableName: parameter.table
							});							
						}
					});
				}

				// Add more fields here as required...

				request.Fields = lstFields;
            },

            DataTableFunction: function (response)  // Called to get a suitable data table for the grid to display
            {
                return response.List;               // The list of records from the Web API
            }
        };

        // Populate the grid using the web API
        var sKeyColumnName = report.EntityDrillDownField;
        var fnDrillDown = reportsForm.DrillIntoReportEntity;
        if (!report.EntityDrillDownField)
        {
            fnDrillDown = null;
            sKeyColumnName = null;
        }

        // 03 Dec 2023: New column colours
        if (report.ColumnTemplateColours)
        {
            report.ColumnTemplateColours.forEach(function (colTemplate)
            {
                report.Columns.forEach(function (col)
                {
                    if (colTemplate.ColumnName == col.field)
                    {
                        var valueColours = [];
                        colTemplate.ColumnValueClass.forEach(function(valueClass)
                        {
                            var valueColour = { value: valueClass.Value };
                            if (valueClass.CSSClass)
                                valueColour.cssClass = valueClass.CSSClass;
                            else if (valueClass.Colour)
                                valueColour.colour = valueClass.Colour;

                            valueColours.push(valueColour);
                        });

                        TriSysSDK.Grid.CustomGridColumnTemplates.AddGridColumnTemplate(sDivTag, colTemplate.ColumnName,
                                                                                   TriSysSDK.Grid.CustomGridColumnTemplates.FormatColourByColumnValue(colTemplate.ColumnName, valueColours));
                    }
                });
            });
        }

        // Options
		var gridOptions = {
            Div: sDivTag,
            ID: sGridName,
            Title: "Report: " + report.DisplayName,
            RecordsPerPage: TriSysApex.UserOptions.RecordsPerPage(),           
            Columns: report.Columns,
            KeyColumnName: sKeyColumnName,
            DrillDownFunction: fnDrillDown,
            Aggregate: report.Aggregate,
            PersistColumnLayout: false,
            ColumnFilters: report.ColumnFilters,
            Sortable: report.Sortable,
            Grouping: report.Grouping,
            ColumnMenu: report.ColumnMenu,
			MultiRowSelect: report.MultiRowSelect/*,
			AutoFitColumns: true*/
        };

		var fnPopulateGrid = function (fnPopulationByFunction, populatedObjectArray)
        {
			gridOptions.PopulationByObject = populatedObjectArray;
            gridOptions.PopulationByFunction = fnPopulationByFunction;

		    // 29 Jan 2021: This grid is broken when aggregates are used.
            //var bTestOnly = (sReportID == "Test.Aggregates.Jan2021");
            //if (bTestOnly)
            //{
            //    reportsForm.SimpleTestGrid(gridOptions);
            //    return;
            //}

		    TriSysSDK.Grid.VirtualMode(gridOptions);
        };

        // Is this cached i.e. entire data set read into memory in order to get column totals?
        if (report.Cached)
        {
            reportsForm.GetReportDataSet(fnPopulationByFunction, fnPopulateGrid);
        }
        else
            fnPopulateGrid(fnPopulationByFunction, null);
        
    },

    GetReportDataSet: function (fnPopulationByFunction, fnPopulateGrid)
    {
        var gridLayout = { Div: reportsForm.RunReportGridID };

        var fnAfterDataSetRetrieved = function (dataTable)
        {
            TriSysSDK.Grid.WaitSpinnerMode(gridLayout, false);

            if (dataTable)
            {
                fnPopulateGrid(null, dataTable);
            }
            else
            {
                // Empty data set
                reportsForm.ToggleNoDataBlock(true);
            }
        };

        // Hide grid and show waiting spinner
        TriSysSDK.Grid.WaitSpinnerMode(gridLayout, true);

        TriSysSDK.Database.GetDataSetFromFunction(fnPopulationByFunction, fnAfterDataSetRetrieved);

        // Remove old data in case we return nothing
        TriSysSDK.Grid.Empty(reportsForm.RunReportGridID);
    },

    // Currently selected report to help dynamic column drill down
    _Report: null,

    DrillIntoReportEntity: function (rowData)
    {
        var sEntityName = reportsForm._Report.EntityName;
        var lRecordId = rowData[reportsForm._Report.EntityDrillDownField];

        TriSysApex.FormsManager.OpenForm(sEntityName, lRecordId);
    },

    Parameters:
    {
        Load: function()
        {
            // Instantiate all parameter fields which may be required to filter report before calling back-end SQL
            reportsForm.Parameters.YearField();
			reportsForm.Parameters.MonthField();
            reportsForm.Parameters.ConsultantField();
			reportsForm.Parameters.ConsultantsField();
			reportsForm.Parameters.WeekEndingSundayField();
			reportsForm.Parameters.StartDateField();
			reportsForm.Parameters.EndDateField();
        },

        AfterReportSelection: function()
        {
            var block = $('#reportsForm-Parameter-Block');
            var parameters = reportsForm._Report.Parameters;
            if(!parameters)
            {
                block.hide();
                return;
            }

            var sPrefix = 'reportsForm-Parameter-';
            var sFields = ['Year', 'Month', 'Consultant', 'Consultants', 'WeekEndingSunday', 'StartDate', 'EndDate'];
			var sRanges = ['NumericRange', 'PostCodeRadial'];

			// Hide standard field rows
            $.each(sFields, function (index, sField)
            {
                $("#" + sPrefix + sField + "-tr").hide();
            });
            $.each(sRanges, function (index, sRange)
            {
                $("#" + sPrefix + sRange + "-tr").hide();
            });

			// Remove dynamic fields
			$("[id^=reportsForm-Dynamic]").each(function ()
            {
				if(this.id.indexOf("-tr") > 0)
					$(this).remove();
            });

            // Enable standard fields and add dynamic fields
			$.each(parameters, function (index, parameter)
            {
				// Is a dynamic field?
				var bDynamicField = parameter.skill;	// Or others?
				if(bDynamicField)
					reportsForm.Parameters.AppendDynamicField(parameter);
				else if(parameter.range)
				{
					$("#" + sPrefix + parameter.range + "-tr").show();

					switch(parameter.range)
					{
						case "NumericRange":				
							reportsForm.Parameters.NumericRangeField(reportsForm.ParameterField_NumericRangeStart, parameter.startvalue, parameter.minvalue, parameter.maxvalue);
							reportsForm.Parameters.NumericRangeField(reportsForm.ParameterField_NumericRangeEnd, parameter.endvalue, parameter.minvalue, parameter.maxvalue);
							break;

						case "PostCodeRadial":
							reportsForm.Parameters.PostCodeRadialField(parameter.startvalue);
							break;
					}
				}
				else
	                $("#" + sPrefix + parameter.field + "-tr").show();

				if(parameter.label)
				{
					var sWhat = parameter.range ? parameter.range : parameter.field;
					$("#" + sPrefix + sWhat + "-label").html(parameter.label);
				}
            });

            block.show();
        },

		AppendDynamicField: function(parameter)
		{
			var sHTML = null;
			if(parameter.skill)
				sHTML = $('#reportsForm-DynamicSkillParameter-html').html();
			
			if(sHTML)
			{
				sHTML = sHTML.replace(/##ParameterName##/g, parameter.field);
				sHTML = sHTML.replace(/##ParameterLabel##/g, parameter.label);
				$('#reportsForm-Parameter-tbody').append(sHTML);

				if(parameter.skill)
				{
					var sFieldID = 'reportsForm-DynamicSkillParameter-' + parameter.field;
					TriSysSDK.CShowForm.skillList(sFieldID, parameter.category, function()
						{
							reportsForm.Parameters.RefreshAfterParameterChange();
						}
					);
				}
			}			
		},

        YearField: function()
        {
            var fnSingleSelect = function (value, sText)
            {
                reportsForm.Parameters.RefreshAfterParameterChange();
            };

            var lstYear = [];
            var iStartYear = 1990;
            var dtNow = new Date();
            var iEndYear = dtNow.getFullYear();
            var iYearlyIncrement = 1;
            iEndYear = iEndYear + iYearlyIncrement;

            for (var iYear = iStartYear; iYear <= iEndYear; iYear++)
            {
                lstYear.push({ text: iYear, value: iYear });
            }
            TriSysSDK.CShowForm.populateComboFromDataSource(reportsForm.ParameterField_Year, lstYear, (lstYear.length - iYearlyIncrement - 1), fnSingleSelect);
        },

        GetYear: function()
        {
            var iYear = TriSysSDK.CShowForm.GetTextFromCombo(reportsForm.ParameterField_Year);
            return iYear;
        },

        MonthField: function()
        {
            var fnSingleSelect = function (value, sText)
            {
                reportsForm.Parameters.RefreshAfterParameterChange();
            };

			var months = moment.months();	 // returns a list of months in the current locale
			var lstMonth = [];

            for (var iMonth = 0; iMonth <= 11; iMonth++)
            {
				var sMonth = months[iMonth];
                lstMonth.push({ text: sMonth, value: iMonth });
            }
			
			var dtNow = new Date();
            TriSysSDK.CShowForm.populateComboFromDataSource(reportsForm.ParameterField_Month, lstMonth, dtNow.getMonth(), fnSingleSelect);
        },

        GetMonth: function()
        {
            var iMonth = parseInt( TriSysSDK.CShowForm.GetValueFromCombo(reportsForm.ParameterField_Month) );
			iMonth += 1;		// Javascript Months start at zero!
            return iMonth;
        },

        ConsultantField: function ()
        {
            var fnSingleSelect = function (value, sText)
            {
                reportsForm.Parameters.RefreshAfterParameterChange();
            };

            var bBlankRow = false, bHighlightCurrentUser = true;
            TriSysSDK.CShowForm.UserCombo(reportsForm.ParameterField_Consultant, fnSingleSelect, bBlankRow, bHighlightCurrentUser);
        },

        GetConsultantName: function()
        {
            var sFullName = TriSysSDK.CShowForm.GetTextFromCombo(reportsForm.ParameterField_Consultant);
            return sFullName;
        },

        GetConsultantUserId: function ()
        {
            var lUserId = TriSysSDK.CShowForm.GetValueFromCombo(reportsForm.ParameterField_Consultant);
            return lUserId;
        },

        ConsultantsField: function ()
        {
            // Multi-select consultant field
			TriSysSDK.CShowForm.MultiUserCombo(reportsForm.ParameterField_Consultants, function()
				{
					reportsForm.Parameters.RefreshAfterParameterChange();
				}
			);
        },

		GetConsultantsIdList: function()
		{
			var lstUserIds = TriSysSDK.CShowForm.GetSelectedValuesFromListAsArray(reportsForm.ParameterField_Consultants);
			return lstUserIds;
		},

        WeekEndingSundayField: function ()
        {
            var fnSingleSelect = function (value, sText)
            {
                reportsForm.Parameters.RefreshAfterParameterChange();
            };

            var lstWeek = [];
            var iWeeksAgo = 11;		// 12 weeks in total
			var sDate = null;

			// Find next Sunday
			var dtNow = new Date();
			for(var i = 0; i < 7; i++)
			{
				var iDayOfWeek = dtNow.getDay();		// sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6
				if(iDayOfWeek == 0)
					break;

				dtNow = new Date(moment(dtNow).add(1, "day"));
			}
			var dtNextSunday = dtNow;

            for (var iWeek = iWeeksAgo; iWeek >= 0; iWeek--)
            {
				var dt = moment(dtNextSunday).add((-1 * iWeek), 'weeks');
                sDate = moment(dt).format("dddd DD MMMM YYYY");
                lstWeek.push({ text: sDate, value: dt.toDate() });
            }

			var iLastSundayIndex = lstWeek.length - 2;
            TriSysSDK.CShowForm.populateComboFromDataSource(reportsForm.ParameterField_WeekEndingSunday, lstWeek, iLastSundayIndex, fnSingleSelect);
        },

		GetWeekEndingSunday: function()
		{
			var dtWeekEnding = TriSysSDK.CShowForm.GetValueFromCombo(reportsForm.ParameterField_WeekEndingSunday);
            return moment(dtWeekEnding).format("YYYY/MM/DD");
		},

		StartDateField: function()
		{
			var fnChangeDate = function ()
            {
                reportsForm.Parameters.RefreshAfterParameterChange();
            };

            TriSysSDK.CShowForm.datePicker(reportsForm.ParameterField_StartDate, fnChangeDate);

			var dt = moment(new Date()).add(-7, 'days');
			TriSysSDK.CShowForm.setDatePickerValue(reportsForm.ParameterField_StartDate, dt);
		},

		GetStartDate: function()
		{
			var dtStart = TriSysSDK.CShowForm.getDatePickerValue(reportsForm.ParameterField_StartDate);
			return moment(dtStart).format("YYYY/MM/DD");
		},

		EndDateField: function()
		{
			var fnChangeDate = function ()
            {
                reportsForm.Parameters.RefreshAfterParameterChange();
            };

            TriSysSDK.CShowForm.datePicker(reportsForm.ParameterField_EndDate, fnChangeDate);

			var dt = moment(new Date()).add(7, 'days');
			TriSysSDK.CShowForm.setDatePickerValue(reportsForm.ParameterField_EndDate, dt);
		},

		GetEndDate: function()
		{
			var dtEnd = TriSysSDK.CShowForm.getDatePickerValue(reportsForm.ParameterField_EndDate);
			return moment(dtEnd).format("YYYY/MM/DD");
		},

		NumericRangeField: function(sFieldID, iValue, iMin, iMax)
		{
			var fieldDescription = { MinValue: iMin, MaxValue: iMax, SpinIncrement: 1, DefaultValue: iValue, Format: "0000" };
			TriSysSDK.Controls.NumericSpinner.Initialise(sFieldID, fieldDescription);
		},

		GetNumericRangeValue: function(sFieldID)
		{
			var iValue = TriSysSDK.Controls.NumericSpinner.GetValue(sFieldID);
			return iValue;
		},

		PostCodeRadialField: function(iMileage)
		{
			var fieldDescription = { MinValue: 0, MaxValue: 500, SpinIncrement: 1, DefaultValue: iMileage, Format: "000" };
			TriSysSDK.Controls.NumericSpinner.Initialise(reportsForm.ParameterField_PostCodeRadialMileage, fieldDescription);
		},

		GetPostCodeRadialMileage: function()
		{
			var iValue = TriSysSDK.Controls.NumericSpinner.GetValue(reportsForm.ParameterField_PostCodeRadialMileage);
			if(!iValue || parseInt(iValue) <= 0)
				iValue = 1000;
			return iValue;
		},

		GetPostCodeRadialPostCode: function()
		{
			var sCode = $('#' + reportsForm.ParameterField_PostCodeRadialPostCode).val();
			if(!sCode)
				sCode = 'CB1';
			return sCode;
		},

        RefreshAfterParameterChange: function()
        {
            reportsForm.PopulateRunReportGrid(reportsForm._Report);
        }
    },

    Data:
    {
        // Read from Web Service API
        _Categories: null,
        _Reports: null,

        Reports: function (sCategory)
        {
            var reports = reportsForm.Data._Reports;

            reports.sort(function (a, b)
            {
                var x = a.Category.toLowerCase() + '_' + a.DisplayName.toLowerCase(),
                y = b.Category.toLowerCase() + '_' + b.DisplayName.toLowerCase();
                return x < y ? -1 : x > y ? 1 : 0;
            });

            if (sCategory && sCategory != reportsForm.CategoryAll)
            {
                // Reports by category only
                var filteredReports = [];
                $.each(reports, function (index, report)
                {
                    if (report.Category == sCategory)
                        filteredReports.push(report);
                });

                return filteredReports;
            }

            return reports;
        },

        ReportByID: function(sID)
        {
            var reports = reportsForm.Data._Reports;

            $.each(reports, function (index, report)
            {
                if (report.ID == sID)
                    foundReport = report;
            });
            return foundReport;
        },

        Categories: function(bComboDataSource)
        {
            var categories = reportsForm.Data._Categories;  
            if (!categories)
                return;

            categories.sort();

            categories.unshift(reportsForm.CategoryAll);

            if (bComboDataSource)
            {
                var ds = [];
                $.each(categories, function (index, sCategory)
                {
                    ds.push({ text: sCategory, value: sCategory });
                });
                return ds;
            }

            return categories;
        }
    },

    Refresh: function()
    {
        if(reportsForm._lastReportRan)
        {
            reportsForm.RunReport(reportsForm._lastReportRan);
        }
    },

	// Called when a user runs an action against a report with checkbox rows.
    ActionInvocation: function (sEntityName)
    {
		var report = reportsForm._lastReportRan;
        var lstEntityIds = TriSysSDK.Grid.GetSelectedMultipleRowsFromGrid(reportsForm.RunReportGridID, report.KeyColumnField);
        return lstEntityIds;
    },

    // Called when a user runs an action against a report with checkbox rows.
    // sFieldID may be null if we want entire row
    ActionInvocationSelectedGridRowValues: function (sFieldID)
    {
		var report = reportsForm._lastReportRan;
		var lstSelectedRowsValues = TriSysSDK.Grid.GetSelectedMultipleRowsFromGrid(reportsForm.RunReportGridID, sFieldID);
        return lstSelectedRowsValues;
    },

    // 29 Jan 2021: This grid is broken when aggregates are used.
    SimpleTestGrid: function (gridLayout)
    {
        var sJQueryGridDiv = '#' + gridLayout.Div;

        // Never interfere with the default array of columns, always create a copy
        if (gridLayout.Columns)
            gridLayout.Columns = JSON.parse(JSON.stringify(gridLayout.Columns));

        // Can we speed up the grid re-load?
        TriSysSDK.Grid.ReCreateInDOM(gridLayout.Div);

        // August 2020: Dynamic columns
        TriSysSDK.Grid.InjectDynamicColumns(gridLayout, gridLayout.Columns);

        // Setup any additional run-time columns and edit controls for touch devices
        TriSysSDK.Grid.AddCheckBoxForMultiRowSelect(gridLayout);
        TriSysSDK.Grid.AddRowOpenButtonForTouchDeviceSupport(gridLayout);
        TriSysSDK.Grid.AddRowPreviewButton(gridLayout);

        TriSysSDK.Grid.ClearCheckedRows(gridLayout.Div);

        var iNumberOfRecordsPerPage = TriSysApex.UserOptions.RecordsPerPage();

        var rowsName = "rows";
        if (!TriSysAPI.Operators.isEmpty(gridLayout.RecordType))
            rowsName = gridLayout.RecordType;

        if (gridLayout.PopulationByObject)
            bRefresh = false;		// Do not show the refresh button in the grid as it will only show the same data

        var lstPageSizes = [5, 10, 15, 20, 25, 30, 50, 100, 200, 500, 1000];
        if (!TriSysAPI.Operators.isEmpty(gridLayout.PageSizeSelector)) {
            if (!TriSysAPI.Operators.stringToBoolean(gridLayout.PageSizeSelector, true))
                lstPageSizes = false;
        }

        var sGridModelId = gridLayout.Div.replace(/-/g, '_') + (gridLayout.KeyColumnName ? '_' + gridLayout.KeyColumnName : '');

        // Must use fields, not columns
        var fields = [];
        if (gridLayout.Columns) {
            $.each(gridLayout.Columns, function (index, column) {
                if (column.field) {
                    var field = { field: column.field, type: column.type };
                    if (column.width >= 0)
                        field.width = column.width;
                    fields.push(field);
                }
            });
        }

        var myDataSourceOptions = 
        {
            data: gridLayout.PopulationByObject,

            schema:
            {
                model:
                {
                    id: sGridModelId,
                    fields: fields
                }
            },

            aggregate: gridLayout.Aggregate,

            serverPaging: false,
            serverFiltering: false,
            serverSorting: false,
            //pageSize: iNumberOfRecordsPerPage,
            serverAggregates: false,

            error: function (e) {
                console.log(e.errors);
            }
        };

        // This causes paging to fuck up
        //var myDataSource = new kendo.data.DataSource(myDataSourceOptions);
        var myDataSource = myDataSourceOptions;


        var kendoGridOptions =
        {
            columns: gridLayout.Columns,

            pageable: {                 // Show numbers for each page
                            
                input: TriSysAPI.Operators.stringToBoolean(gridLayout.PageSelector, true),
                info: true,             // 1 to 10 of 100 rows to right of footer
                buttonCount: 0,         // iVCRButtonCount,
                refresh: bRefresh,
                numeric: false,         // bNumeric,
                messages: {
                            display: "{0:##,#}  to  {1:##,#}  of  {2:##,#}  " + rowsName,
                            of: "of {0:##,#}",
                            itemsPerPage: rowsName + " per page",
                            empty: "No " + rowsName
                },
                alwaysVisible: true,
                pageSizes: lstPageSizes,    // See user options also
                pageSize: iNumberOfRecordsPerPage,

                // https://www.telerik.com/forums/grid-page-change-event
                change: function (e) { TriSysSDK.Grid.PageChanged(e, gridLayout); }
            },

            sortable: true,
            filterable: true,
            resizable: true,
            reorderable: true,
            groupable: true,
            columnMenu: true

            /*
            If the data source containing the aggregate functions (sum, count, average, max, min etc..) 
            is not included in the grid options at the point of instantiation, KendoUI raises a run-time error.            

            , dataSource: myDataSource   // If this is turned aggregates like on, sum, average etc.. will work */

        };

        try {
            $("#" + gridLayout.Div).kendoGrid(kendoGridOptions);

        } catch (e) {

            var sErrorMessage = TriSysApex.Logging.CatchVariableToText(e);  // count is not defined
            return;
        }



        // Late bind the grid
        var kendoGridInstance = $(sJQueryGridDiv).data("kendoGrid");
        kendoGridInstance.setDataSource(myDataSource);



        // Finally, we want the grid sized to fit the available space
        //TriSysSDK.Grid.ResizingEventHandler(gridLayout, sJQueryGridDiv);

        // Slimey hacks to overcome grid limitations
        //TriSysSDK.Grid.CustomGridColumnTemplates.SlimeyHacksToOvercomeGridLimitations(gridLayout, sJQueryGridDiv);
    }

};

$(document).ready(function ()
{
    reportsForm.Load();
});