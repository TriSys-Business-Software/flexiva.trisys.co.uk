// Self contained logic for populating the permanent salary/package
//
var ctrlPermanentSalary =
{
    // Called after the form and data is loaded.
    Initialise: function(bRequirement)
	{
        // Set up all the calculaton callbacks etc..
        //TriSysApex.Toasters.Info('ctrlPermanentSalary.Initialise');

        var sRequirementRow = 'trisys-requirement-form-permanent-salary-row';
        var sPlacementRow = 'trisys-placement-form-permanent-salary-row';

        var sRowToShow = bRequirement ? sRequirementRow : sPlacementRow;

        $('#' + sRowToShow).show();

        var sEntityName = bRequirement ? 'Requirement' : 'Placement';

        // Subscribe to field change events in order to run the calculation engine which will tally up the totals
        TriSysApex.FieldEvents.AddNumberChangeFieldOfInterest('RequirementConfigFields_MaximumSalary', ctrlPermanentSalary.RequirementCalculationEngine);
        TriSysApex.FieldEvents.AddNumberChangeFieldOfInterest('RequirementConfigFields_Bonus', ctrlPermanentSalary.RequirementCalculationEngine);
        TriSysApex.FieldEvents.AddNumberChangeFieldOfInterest('RequirementConfigFields_BenefitsValue', ctrlPermanentSalary.RequirementCalculationEngine);
        TriSysApex.FieldEvents.AddNumberChangeFieldOfInterest('RequirementConfigFields_CarValue', ctrlPermanentSalary.RequirementCalculationEngine);
        TriSysApex.FieldEvents.AddNumberChangeFieldOfInterest('RequirementConfigFields_FeePercentage', ctrlPermanentSalary.RequirementCalculationEngine);
        TriSysApex.FieldEvents.AddNumberChangeFieldOfInterest('RequirementConfigFields_Fee', ctrlPermanentSalary.RequirementCalculationEngine);
        TriSysApex.FieldEvents.AddNumberChangeFieldOfInterest('RequirementConfigFields_FixedTermDurationWeeks', ctrlPermanentSalary.RequirementCalculationEngine);

        TriSysApex.FieldEvents.AddNumberChangeFieldOfInterest('PlacementConfigFields_Salary', ctrlPermanentSalary.PlacementCalculationEngine);
        TriSysApex.FieldEvents.AddNumberChangeFieldOfInterest('PlacementConfigFields_Bonus', ctrlPermanentSalary.PlacementCalculationEngine);
        TriSysApex.FieldEvents.AddNumberChangeFieldOfInterest('PlacementConfigFields_BenefitsValue', ctrlPermanentSalary.PlacementCalculationEngine);
        TriSysApex.FieldEvents.AddNumberChangeFieldOfInterest('PlacementConfigFields_CarValue', ctrlPermanentSalary.PlacementCalculationEngine);
        TriSysApex.FieldEvents.AddNumberChangeFieldOfInterest('PlacementConfigFields_FeePercentage', ctrlPermanentSalary.PlacementCalculationEngine);
        TriSysApex.FieldEvents.AddNumberChangeFieldOfInterest('PlacementConfigFields_Fee', ctrlPermanentSalary.PlacementCalculationEngine);
        TriSysApex.FieldEvents.AddNumberChangeFieldOfInterest('PlacementConfigFields_FixedTermDurationWeeks', ctrlPermanentSalary.PlacementCalculationEngine);

        // Flat fee
        ctrlPermanentSalary.FlatFee(sEntityName);
        $('#' + sEntityName + 'ConfigFields_FlatFee').change(function ()
        {
            ctrlPermanentSalary.FlatFee(sEntityName, true);
        });

        // Company Car
        ctrlPermanentSalary.CompanyCarFields(sEntityName);       

        // Fixed term
        ctrlPermanentSalary.FixedTerm(sEntityName);
        $('#' + sEntityName + 'ConfigFields_FixedTerm').change(function ()
        {
            ctrlPermanentSalary.FixedTerm(sEntityName, true);
        });

        // Calculate fee by total package
        $('#permanent-salary-calculate-fee-by-total-package').change(function ()
        {
            ctrlPermanentSalary.CalculateFeeByTotalPackage(true);
        });

        // Total package value is calculated
        TriSysSDK.Controls.CurrencyAmount.Readonly(sEntityName + 'ConfigFields_TotalPackageValue', true);

        // Fix up minor config problems
        TriSysSDK.Controls.CurrencyAmount.SetIncrement(sEntityName + 'ConfigFields_Bonus', 100);
        TriSysSDK.Controls.CurrencyAmount.SetIncrement(sEntityName + 'ConfigFields_Fee', 100);
        TriSysSDK.Controls.NumericSpinner.SetIncrement(sEntityName + 'ConfigFields_FeePercentage', 0.25);

        TriSysSDK.Controls.CurrencyAmountPeriod.SetIncrement('PlacementConfigFields_Salary', 100);

        // Initiate the calculation
        ctrlPermanentSalary.CalculationEngine(sEntityName);

        // Customer specific overrides
        ctrlPermanentSalary.CustomerSpecificOverrides.Initialise();
    },

    FlatFee: function (sEntityName, bRecalculate)
    {
        var bFlatFee = TriSysSDK.CShowForm.CheckBoxValue(sEntityName + 'ConfigFields_FlatFee');
        TriSysSDK.Controls.CurrencyAmount.Readonly(sEntityName + 'ConfigFields_Fee', !bFlatFee);
        TriSysSDK.Controls.NumericSpinner.Readonly(sEntityName + 'ConfigFields_FeePercentage', bFlatFee);

        if (bRecalculate)
            ctrlPermanentSalary.CalculationEngine(sEntityName, sEntityName + 'ConfigFields_FlatFee', bFlatFee);
    },

    CompanyCarFields: function (sEntityName, bRecalculate)
    {
        var sCompanyCarText = TriSysSDK.CShowForm.GetTextFromCombo(ctrlPermanentSalary.CompanyCarFieldName(sEntityName));
        TriSysApex.Logging.LogMessage('CompanyCarFields: ' + sCompanyCarText);
		var bCarIncluded = (sCompanyCarText == 'Included');

		if (ctrlPermanentSalary.CustomerSpecificOverrides.CarValueReadOnly())
			TriSysSDK.Controls.CurrencyAmount.Readonly(sEntityName + 'ConfigFields_CarValue', !bCarIncluded);

        TriSysSDK.CShowForm.ComboEnabled(ctrlPermanentSalary.IncludeCompanyCarInFeeFieldName(sEntityName), bCarIncluded);

        if (bRecalculate)
            ctrlPermanentSalary.CalculationEngine(sEntityName, ctrlPermanentSalary.CompanyCarFieldName(sEntityName), bCarIncluded);
    },

    FixedTerm: function (sEntityName, bRecalculate)
    {
        var bFixedTerm = TriSysSDK.CShowForm.CheckBoxValue(sEntityName + 'ConfigFields_FixedTerm');
        TriSysSDK.Controls.NumericSpinner.Readonly(sEntityName + 'ConfigFields_FixedTermDurationWeeks', !bFixedTerm);

        if (bRecalculate)
            ctrlPermanentSalary.CalculationEngine(sEntityName, sEntityName + 'ConfigFields_FixedTerm', bFixedTerm);
    },

    CalculateFeeByTotalPackage: function (bRecalculate)
    {
        var sField = 'permanent-salary-calculate-fee-by-total-package';
        var bCalculateFeeByTotalPackage = TriSysSDK.CShowForm.CheckBoxValue(sField);

        if (bRecalculate)
            ctrlPermanentSalary.RequirementCalculationEngine(sField, bCalculateFeeByTotalPackage);
    },

    SalaryFieldNameForCalculation: function (sEntityName)
    {
        var sFieldName = sEntityName + 'ConfigFields_' + (sEntityName == 'Requirement' ? 'Maximum' : '') + 'Salary';
        return sFieldName;
    },

    CompanyCarFieldName: function(sEntityName)
    {
        var sFieldName = sEntityName + 'ConfigFields_' + (sEntityName == 'Requirement' ? 'Company' : '') + 'Car';
        return sFieldName;
    },

    IncludeCompanyCarInFeeFieldName: function (sEntityName)
    {
        var sFieldName = sEntityName + 'ConfigFields_' + (sEntityName == 'Placement' ? 'Placement' : '') + 'IncludeCarInFee';
        return sFieldName;
    },

    // Calculation engine uses callbacks events on rate/margin/days/duration/hours fields
    // See TriSysApex.FieldEvents.NumberChange()
    RequirementCalculationEngine: function (sFieldID, fValue)
    {
        ctrlPermanentSalary.CalculationEngine('Requirement', sFieldID, fValue);
    },

    PlacementCalculationEngine: function (sFieldID, fValue)
    {
        ctrlPermanentSalary.CalculationEngine('Placement', sFieldID, fValue);
    },

    // Called by both requirement and placement calculation engines as 99% of these
    // algorithms are identical. Only minor differences in some field names.
    //
    CalculationEngine: function (sEntityName, sFieldID, fValue)
    {
        TriSysApex.Logging.LogMessage('ctrlPermanentSalary.CalculationEngine: ' + sFieldID + "=" + fValue);
        //return;

        var sSalaryField = ctrlPermanentSalary.SalaryFieldNameForCalculation(sEntityName);
        var sMaximumSalary = TriSysSDK.Controls.CurrencyAmountPeriod.GetCurrencyAmountPeriod(sSalaryField);
        var sMinimumSalary = TriSysSDK.Controls.CurrencyAmountPeriod.GetCurrencyAmountPeriod(sEntityName + 'ConfigFields_MinimumSalary');

        TriSysApex.Logging.LogMessage('ctrlPermanentSalary.CalculationEngine: 1');

        var sCurrency = TriSysSDK.Controls.CurrencyAmountPeriod.GetCurrency(sSalaryField);

        var fBonus = TriSysSDK.Controls.CurrencyAmount.GetAmount(sEntityName + 'ConfigFields_Bonus');
        var fBenefits = TriSysSDK.Controls.CurrencyAmount.GetAmount(sEntityName + 'ConfigFields_BenefitsValue');
        var fCarValue = TriSysSDK.Controls.CurrencyAmount.GetAmount(sEntityName + 'ConfigFields_CarValue');

        var fMaximumSalaryAmount = TriSysSDK.Controls.CurrencyAmountPeriod.GetAmount(sSalaryField);
        var fMinimumSalaryAmount = TriSysSDK.Controls.CurrencyAmountPeriod.GetAmount(sEntityName + 'ConfigFields_MinimumSalary');

        var sCompanyCarText = TriSysSDK.CShowForm.GetTextFromCombo(ctrlPermanentSalary.CompanyCarFieldName(sEntityName));
        var sIncludeCarInFeeText = TriSysSDK.CShowForm.GetTextFromCombo(ctrlPermanentSalary.IncludeCompanyCarInFeeFieldName(sEntityName));
        TriSysApex.Logging.LogMessage('ctrlPermanentSalary.CalculationEngine: 2: ' + sIncludeCarInFeeText);

        var bCarValueIncluded = (sCompanyCarText == 'Included' && sIncludeCarInFeeText == 'Include');
        if (!bCarValueIncluded)
            fCarValue = 0;

        // Calculate total package
        var fTotalPackage = fMaximumSalaryAmount + fBonus + fBenefits + fCarValue;

        TriSysApex.Logging.LogMessage('ctrlPermanentSalary.CalculationEngine: 3: ' + fTotalPackage);

        TriSysSDK.Controls.CurrencyAmount.SetCurrencyAmount(sEntityName + 'ConfigFields_TotalPackageValue', sCurrency + fTotalPackage);

        // Calculate the total from which the fee will be calculated
        var fTotalAmountForFeeCalculation = fMaximumSalaryAmount + fCarValue;

        if (sEntityName == 'Requirement')
        {
            var bCalculateFeeByTotalPackage = TriSysSDK.CShowForm.CheckBoxValue('permanent-salary-calculate-fee-by-total-package');
            if (bCalculateFeeByTotalPackage)
                fTotalAmountForFeeCalculation = fTotalPackage;
        }

        // Calculate the fee
        var fFeeAmount = TriSysSDK.Controls.CurrencyAmount.GetAmount(sEntityName + 'ConfigFields_Fee');
        var bFlatFee = TriSysSDK.CShowForm.CheckBoxValue(sEntityName + 'ConfigFields_FlatFee');
        if (bFlatFee)
        {
            var fFeePercentage = (fFeeAmount / fTotalAmountForFeeCalculation) * 100;
            TriSysSDK.Controls.NumericSpinner.SetValue(sEntityName + 'ConfigFields_FeePercentage', fFeePercentage);
        }
        else
        {
            var fFeePercentage = TriSysSDK.Controls.NumericSpinner.GetValue(sEntityName + 'ConfigFields_FeePercentage');
            fFeeAmount = fTotalAmountForFeeCalculation * (fFeePercentage / 100);

            var bFixedTerm = TriSysSDK.CShowForm.CheckBoxValue(sEntityName + 'ConfigFields_FixedTerm');
            if (bFixedTerm)
            {
                var fFixedTermDurationWeeks = TriSysSDK.Controls.NumericSpinner.GetValue(sEntityName + 'ConfigFields_FixedTermDurationWeeks');
                fFeeAmount = (fFeeAmount / 52) * fFixedTermDurationWeeks;
            }

            TriSysSDK.Controls.CurrencyAmount.SetCurrencyAmount(sEntityName + 'ConfigFields_Fee', sCurrency + fFeeAmount);

        }

        TriSysApex.Logging.LogMessage('ctrlPermanentSalary.CalculationEngine: EXIT: ' + fTotalPackage);

        // Charting
        var figures = {};
        figures.Salary = fMaximumSalaryAmount;
        figures.Bonus = fBonus;
        figures.Benefits = fBenefits;
        figures.Car = fCarValue;

        ctrlPermanentSalary.DrawChart(sEntityName, figures);
    },

    DrawChart: function (sEntityName, figures)
    {
        var sChart = 'trisys-' + sEntityName.toLowerCase() + '-form-permanent-salary-chart';
        var lColorSalary = TriSysProUI.NavBarInverseColour();
        var lColorBonus = TriSysProUI.BackColour();
        var lColorBenefits = TriSysProUI.ThemedSidebarBackgroundLight(0.25);    //TriSysProUI.ThemedAlternativeBackColor();
        var lColorCar = TriSysProUI.BackColour(0.2);   //TriSysProUI.ThemedSidebarBackgroundLight(0.25);

        // The black and white theme is an exception because the bonus color is too dark, so lighten it
        if (TriSysProUI.CurrentThemeNameLike('Night'))
            lColorBonus = TriSysProUI.LightenColour(lColorBonus, 0.1);

        // Calculate percentages
        var fTotal = figures.Salary + figures.Bonus + figures.Benefits + figures.Car;
        var fnCalcPercentage = function (fValue, fTotal)
        {
            var fPercentage = 0;
            if(fValue > 0)
                fPercentage = (fValue / fTotal) * 100;
            return fPercentage;
        };
        var fSalaryPercentage = fnCalcPercentage(figures.Salary, fTotal);
        var fBonusPercentage = fnCalcPercentage(figures.Bonus, fTotal);
        var fBenefitsPercentage = fnCalcPercentage(figures.Benefits, fTotal);
        var fCarPercentage = fnCalcPercentage(figures.Car, fTotal);

        // Convert into series data with colours
        var seriesData = [];
        var seriesColors = [];
        if (fSalaryPercentage > 0)
        {
            seriesColors.push(lColorSalary);
            var salaryData = {
                category: "Salary",
                value: fSalaryPercentage
            };
            seriesData.push(salaryData);
        }
        if (fBonusPercentage > 0)
        {
            seriesColors.push(lColorBonus);
            var bonusData = {
                category: "Bonus",
                value: fBonusPercentage
            };
            seriesData.push(bonusData);
        }
        if (fBenefitsPercentage > 0)
        {
            seriesColors.push(lColorBenefits);
            var benefitsData = {
                category: "Benefits",
                value: fBenefitsPercentage
            };
            seriesData.push(benefitsData);
        }
        if (fCarPercentage > 0)
        {
            seriesColors.push(lColorCar);
            var carData = {
                category: "Car",
                value: fCarPercentage
            };
            seriesData.push(carData);
        }

        // Draw chart
        $("#" + sChart).kendoChart({
            //title: {
            //    text: "Permanent Salary Package"
            //},
            legend: {
                position: "bottom",
                labels: { font: TriSysSDK.KendoUICharts.Font }
            },
            chartArea: {
                height: 350
            },
            seriesDefaults: {
                labels: {
                    template: "#= category # - #= kendo.format('{0:P}', percentage)#",
                    position: "outsideEnd",
                    visible: false,
                    background: "transparent",
                    font: TriSysSDK.KendoUICharts.Font
                }
            },
            seriesColors: seriesColors,
            series: [{
                type: "donut",
                data: seriesData
            }],
            tooltip: {
                visible: true,
                template: '<span style="color:white;">#= category # - #= kendo.format("{0:P}", percentage) #</span>'
            }
        });

    },

    CustomerSpecificOverrides: 
    {
        Initialise: function ()
        {
            ctrlPermanentSalary.CustomerSpecificOverrides._AlmaITSalesRecruitment = TriSysApex.LoginCredentials.isLoggedInToSpecificCompanyAsRecruiter("Alma IT Sales Recruitment Ltd");
            if (ctrlPermanentSalary.CustomerSpecificOverrides._AlmaITSalesRecruitment)
            {
                // Allow only "Annum"
                var currencyAmountPeriods = [
                    'RequirementConfigFields_MinimumSalary-CurrencyAmountPeriod_Period',
                    'RequirementConfigFields_MaximumSalary-CurrencyAmountPeriod_Period'
                ];

                $.each(currencyAmountPeriods, function (index, item)
                {
                    var elem = $('#' + item).data("kendoDropDownList");
                    if (elem)
                        elem.enable(false);
                });

                // Custom fields should be drawn by CShowForm
                //RequirementConfigFields_MinimumVariable

                // Include car in fee
                TriSysSDK.CShowForm.SetSkillsInList('RequirementConfigFields_IncludeCarInFee', 'Include');
                TriSysSDK.CShowForm.SetSkillsInList('PlacementConfigFields_PlacementIncludeCarInFee', 'Include');

                // Calculate NOT by total package
				TriSysSDK.CShowForm.SetCheckBoxValue('permanent-salary-calculate-fee-by-total-package', false);

				// Car value not read-only
				TriSysSDK.Controls.CurrencyAmount.Readonly('RequirementConfigFields_CarValue', false);
            }
        },

		_AlmaITSalesRecruitment: false,

		CarValueReadOnly: function ()		// ctrlPermanentSalary.CustomerSpecificOverrides.CarValueReadOnly
		{
			if (ctrlPermanentSalary.CustomerSpecificOverrides._AlmaITSalesRecruitment)
				return false;

			return true;
		}

	}	// ctrlPermanentSalary.CustomerSpecificOverrides

};  // End of ctrlPermanentSalary

