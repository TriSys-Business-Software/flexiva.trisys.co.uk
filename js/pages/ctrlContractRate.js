var ctrlContractRate =
{
    // Open the contract/temp rate and allow editing

    Load: function ()
    {
        // Read the current context
        var context = TriSysApex.ModalDialogue.ContractRates.Context;

        var bExistingRate = (context.RecordId > 0 && context.RateId > 0);

        // Setup the widgets
        if (context.EntityName == 'Company')
        {
            $('#contractRate-CompanyJobTitleAndAddressTable').show();

            // Display a list of addresses to choose in a combo
            var sField = 'contractRate-CompanyAddress';
            TriSysApex.ModalDialogue.CompanyAddresses.PopulateCombo(context.RecordId, sField);
        }
        
        var fSpinIncrement = 0.25;
        var sPeriod = "Hour";
        TriSysSDK.Controls.CurrencyAmountPeriod.PopulateCurrencyAmountPeriodWidget('contractRate-PayRate', fSpinIncrement, sPeriod);
        TriSysSDK.Controls.CurrencyAmountPeriod.PopulateCurrencyAmountPeriodWidget('contractRate-ChargeRate', fSpinIncrement, sPeriod);
        TriSysSDK.Controls.CurrencyAmountPeriod.PopulateCurrencyAmountPeriodWidget('contractRate-PAYE', fSpinIncrement, sPeriod);
        TriSysSDK.Controls.CurrencyAmountPeriod.PopulateCurrencyAmountPeriodWidget('contractRate-StandardPayRate', fSpinIncrement, sPeriod);
        TriSysSDK.Controls.CurrencyAmountPeriod.PopulateCurrencyAmountPeriodWidget('contractRate-StandardChargeRate', fSpinIncrement, sPeriod);

        var fieldDescription = { MinValue: 0, MaxValue: 100, SpinIncrement: 0.25 };
        TriSysSDK.Controls.NumericSpinner.Initialise('contractRate-Multiplier', fieldDescription);

        TriSysSDK.Controls.NumericSpinner.Initialise('contractRate-MarginPercentage', fieldDescription);
        TriSysSDK.Controls.NumericSpinner.Initialise('contractRate-MarkupPercentage', fieldDescription);

        fieldDescription = { MinValue: 0, MaxValue: 7, SpinIncrement: 0.25 };
        TriSysSDK.Controls.NumericSpinner.Initialise('contractRate-DaysPerWeek', fieldDescription);

        fieldDescription = { MinValue: 0, MaxValue: 24, SpinIncrement: 0.25 };
        TriSysSDK.Controls.NumericSpinner.Initialise('contractRate-HoursPerDay', fieldDescription);

        fieldDescription = { MinValue: 0, MaxValue: 256, SpinIncrement: 1, Format: "#0.00" };
        TriSysSDK.Controls.NumericSpinner.Initialise('contractRate-DurationInWeeks', fieldDescription);

        TriSysSDK.Controls.CurrencyAmount.Initialise('contractRate-Value');
        TriSysSDK.Controls.CurrencyAmount.Initialise('contractRate-Profit');
        TriSysSDK.Controls.CurrencyAmount.Initialise('contractRate-ValuePerUnit');

        // Calculate the values/percentages etc..
        ctrlContractRate.CalculationEngine();

        // Make read-only but remember that your controls are loaded asynchronously!
        setTimeout(function ()
        {
            TriSysSDK.Controls.CurrencyAmountPeriod.Readonly('contractRate-StandardPayRate');
            TriSysSDK.Controls.CurrencyAmountPeriod.Readonly('contractRate-StandardChargeRate');

            TriSysSDK.Controls.CurrencyAmount.Readonly('contractRate-Value');
            TriSysSDK.Controls.CurrencyAmount.Readonly('contractRate-Profit');
            TriSysSDK.Controls.CurrencyAmount.Readonly('contractRate-ValuePerUnit');

            if(bExistingRate)
            {
                //TriSysSDK.Controls.CurrencyAmountPeriod.Readonly('contractRate-PayRate');
                //TriSysSDK.Controls.CurrencyAmountPeriod.Readonly('contractRate-ChargeRate');
                //TriSysSDK.Controls.CurrencyAmountPeriod.Readonly('contractRate-PAYE');

                //TriSysSDK.CShowForm.ComboReadonly('contractRate-Type');
            }

            // 14 Dec 2023: If adding new rates to form, then need to switch
            TriSysSDK.Controls.CurrencyAmountPeriod.Readonly('contractRate-PAYE', bExistingRate);

        }, 250);

        // Job title no-cache 
        if (!TriSysSDK.CShowForm.JobTitlesCached())
        {
            // Capture enter key to do lookup
            $('#contractRate-JobTitle').keyup(function (e)
            {
                if (e.keyCode == 13)
                    ctrlContractRate.JobTitleLookup();
            });
        }

        // Load the rate, even for new rates because we need the standard rates to use the multiplier
        // and also we only load the rate types which are not already assigned to this entity
        ctrlContractRate.ReadFromWebAPI(context.EntityName, context.RecordId, context.RateId);
    },

    LoadRateTypeCombo: function (sEntityName, sDiv, bExistingRate, availableTypes)
    {
        if (availableTypes)
        {
            // New - server told us which ones are not assigned
            var sourceSkills = [], sDefault = null;
            for (var i = 0; i < availableTypes.length; i++)
            {
                var availableType = availableTypes[i];

                var sourceStruct = {
                    value: availableType,
                    text: availableType
                };
                sourceSkills.push(sourceStruct);

                if (!sDefault)
                    sDefault = availableType;
            }

            // Set this now
            TriSysSDK.CShowForm.populateComboFromDataSource(sDiv, sourceSkills);

            if (sDefault)
                TriSysSDK.CShowForm.SetTextInCombo(sDiv, sDefault);
        }
        else
        {
            // Old - all categories
            TriSysSDK.CShowForm.skillCombo(sDiv, ctrlContractRate.GetSkillCategory(), null);
        }

        if (bExistingRate)
            TriSysSDK.CShowForm.ComboEnabled('contractRate-Type', false);
    },

    GetSkillCategory: function()
    {
        var context = TriSysApex.ModalDialogue.ContractRates.Context;
        var sEntityName = context.EntityName;
        var sSkillCategory = (sEntityName == 'Placement' ? 'RateType' : 'RequirementRateType');
        return sSkillCategory;
    },

    // Called by TriSysApex.FieldEvents.ComboClick()
    RateTypeChange: function (sRateType)
    {
        var sCategory = ctrlContractRate.GetSkillCategory();
        var skills = TriSysApex.Cache.Skills();
        for (var i = 0; i < skills.length; i++)
        {
            var skill = skills[i];

            if (skill.Category == sCategory && skill.Skill == sRateType)
            {
                $('#contractRate-Notes').val(skill.Description);
                break;
            }
        }

        ctrlContractRate.AfterRateTypeChange(sRateType);
    },

    AfterRateTypeChange: function(sRateType)
    {
        var bStandard = (sRateType == 'Standard');
        var context = TriSysApex.ModalDialogue.ContractRates.Context;
        var bCompanyRate = (context.EntityName == 'Company');

        if (bStandard)
        {
            $('#contractRate-Multiplier-Row').hide();
            $('#contractRate-StandardPayRate-Row').hide();
            $('#contractRate-StandardChargeRate-Row').hide();

            if (!bCompanyRate)
                $('#contractRate-PlacementValuesTable').show();
        }
        else
        {
            $('#contractRate-Multiplier-Row').show();
            $('#contractRate-StandardPayRate-Row').show();
            $('#contractRate-StandardChargeRate-Row').show();

            if (!bCompanyRate)
                $('#contractRate-PlacementValuesTable').hide();
        }
    },

    // Calculation engine uses callbacks events on rate/margin/days/duration/hours fields
    // See TriSysApex.FieldEvents.NumberChange()
    CalculationEngine: function (sFieldID, fValue)
    {
        // Code lifted and ported from the frmFeeSalaryRateBase in the V10 project
        var sPayRate = TriSysSDK.Controls.CurrencyAmountPeriod.GetCurrencyAmountPeriod('contractRate-PayRate');
        var sChargeRate = TriSysSDK.Controls.CurrencyAmountPeriod.GetCurrencyAmountPeriod('contractRate-ChargeRate');

        var sCurrency = TriSysSDK.Controls.CurrencyAmountPeriod.GetCurrency('contractRate-ChargeRate');

        var fPayRateAmount = TriSysSDK.Controls.CurrencyAmountPeriod.GetAmount('contractRate-PayRate');
        var fChargeRateAmount = TriSysSDK.Controls.CurrencyAmountPeriod.GetAmount('contractRate-ChargeRate');

        var fMarginPercentage = 0;
        var fMarkupPercentage = 0;
        var fMultiplier = TriSysSDK.Controls.NumericSpinner.GetValue('contractRate-Multiplier');

        if (sFieldID && sFieldID.indexOf('contractRate-Multiplier') == 0)
        {
            // This is where the user wishes to multiply the standard rates to get the new rates
            var fStandardPayRateAmount = TriSysSDK.Controls.CurrencyAmountPeriod.GetAmount('contractRate-StandardPayRate');
            var fStandardChargeRateAmount = TriSysSDK.Controls.CurrencyAmountPeriod.GetAmount('contractRate-StandardChargeRate');

            fPayRateAmount = fMultiplier * fStandardPayRateAmount;
            fChargeRateAmount = fMultiplier * fStandardChargeRateAmount;

            TriSysSDK.Controls.CurrencyAmountPeriod.SetAmount('contractRate-PayRate', fPayRateAmount);
            TriSysSDK.Controls.CurrencyAmountPeriod.SetAmount('contractRate-ChargeRate', fChargeRateAmount);
        }

        if (sFieldID && sFieldID.indexOf('contractRate-MarginPercentage') == 0)
        {
            // This is where the user has changed the margin/markup
            var bUpdateChargeRateCalculation = TriSysSDK.CShowForm.CheckBoxValue('contractRate-UpdateChargeRateCalculation');
            fMarginPercentage = TriSysSDK.Controls.NumericSpinner.GetValue('contractRate-MarginPercentage');
            fMarkupPercentage = TriSysSDK.Controls.NumericSpinner.GetValue('contractRate-MarkupPercentage');

            if (bUpdateChargeRateCalculation)
            {
                fChargeRateAmount = fPayRateAmount / (1 - (fMarginPercentage / 100));
                TriSysSDK.Controls.CurrencyAmountPeriod.SetAmount('contractRate-ChargeRate', fChargeRateAmount);
            }
            else
            {
                fPayRateAmount = fChargeRateAmount - (fChargeRateAmount * (fMarginPercentage / 100));
                TriSysSDK.Controls.CurrencyAmountPeriod.SetAmount('contractRate-PayRate', fPayRateAmount);
            }
        }


        // Calculate the margin
        var fMarginAmount = fChargeRateAmount - fPayRateAmount;
        if( fChargeRateAmount != 0)
            fMarginPercentage = (fMarginAmount / fChargeRateAmount) * 100;

        if( fPayRateAmount != 0)
            fMarkupPercentage = (fMarginAmount / fPayRateAmount) * 100;

        var fStandardPayRate = TriSysSDK.Controls.CurrencyAmountPeriod.GetCurrencyAmountPeriodPerHour('contractRate-StandardPayRate');
        if( fStandardPayRate != 0)
            fMultiplier = fPayRateAmount / fStandardPayRate;

        var bMarginMarkupCalculation = TriSysSDK.CShowForm.CheckBoxValue('contractRate-MarginMarkupCalculation');
        if (bMarginMarkupCalculation)
        {
            TriSysSDK.Controls.NumericSpinner.SetValue('contractRate-MarginPercentage', fMarginPercentage);
            TriSysSDK.Controls.NumericSpinner.SetValue('contractRate-MarkupPercentage', fMarkupPercentage);
            //TriSysSDK.Controls.NumericSpinner.SetValue('contractRate-Multiplier', fMultiplier);
        }

        // Calculate the contract profits etc..
        var bStandard = (TriSysSDK.CShowForm.GetTextFromCombo('contractRate-Type') == 'Standard');
        if (bStandard)
        {
            var fDaysPerWeek = TriSysSDK.Controls.NumericSpinner.GetValue('contractRate-DaysPerWeek');
            var fHoursPerDay = TriSysSDK.Controls.NumericSpinner.GetValue('contractRate-HoursPerDay');
            var iDurationWeeks = TriSysSDK.Controls.NumericSpinner.GetValue('contractRate-DurationInWeeks');

            var fValuePerUnit = fChargeRateAmount - fPayRateAmount;
            var sPeriod = TriSysSDK.Controls.CurrencyAmountPeriod.GetPeriod('contractRate-ChargeRate');

            switch(sPeriod)
            {
                case 'Hour':
                    fTotalValue = fChargeRateAmount * fDaysPerWeek * fHoursPerDay * iDurationWeeks;
                    fProfit = fMarginAmount * fDaysPerWeek * fHoursPerDay * iDurationWeeks;
                    break;
                case 'Day':
                    fTotalValue = fChargeRateAmount * fDaysPerWeek * iDurationWeeks;
                    fProfit = fMarginAmount * fDaysPerWeek * iDurationWeeks;
                    break;
                case 'Week':
                    fTotalValue = fChargeRateAmount * iDurationWeeks;
                    fProfit = fMarginAmount * iDurationWeeks;
                    break;
                case 'Month':
                    fTotalValue = fChargeRateAmount * iDurationWeeks / 4;
                    fProfit = fMarginAmount * iDurationWeeks / 4;
                    break;
                case 'Annum':
                    fTotalValue = fChargeRateAmount * iDurationWeeks / 52;
                    fProfit = fMarginAmount * iDurationWeeks / 52;
                    break;
            }

            TriSysSDK.Controls.CurrencyAmount.SetCurrencyAmount('contractRate-Value', sCurrency + fTotalValue);
            TriSysSDK.Controls.CurrencyAmount.SetCurrencyAmount('contractRate-Profit', sCurrency + fProfit);
            TriSysSDK.Controls.CurrencyAmount.SetCurrencyAmount('contractRate-ValuePerUnit', sCurrency + fValuePerUnit);
        }
    },

    // This is an existing record so get from web API
    ReadFromWebAPI: function (sEntityName, lEntityId, lRateId)
    {
        var CReadRateRequest = {
            'EntityName': sEntityName,
            'EntityId': lEntityId,
            'RateId': lRateId
        };

        var payloadObject = {};

        // Call the API to submit the data to the server
        payloadObject.URL = "Rates/Read";

        payloadObject.OutboundDataPacket = CReadRateRequest;

        payloadObject.InboundDataFunction = function (data)
        {
            TriSysApex.UI.HideWait();

            var CReadRateResponse = data;

            if (CReadRateResponse)
            {
                if (CReadRateResponse.Success)
                {
                    var bExistingRate = (CReadRateResponse.RateId > 0);
                    var bCompanyRate = (sEntityName == 'Company');
            

                    // Write to screen fields

                    if (bCompanyRate)
                    {
                        if (CReadRateResponse.JobTitle)
                            $('#contractRate-JobTitle').val(CReadRateResponse.JobTitle);

                        if (CReadRateResponse.AddressId > 0)
                            TriSysSDK.CShowForm.SetValueInCombo('contractRate-CompanyAddress', CReadRateResponse.AddressId);

                        if (bExistingRate)
                        {
                            // User cannot edit the job title or address 
                            $('#contractRate-JobTitle').prop('disabled', true);
                            $('#contractRate-JobTitle-Lookup').attr("disabled", true);
                            TriSysSDK.CShowForm.ComboEnabled('contractRate-CompanyAddress', false);
                        }
                    }

                    ctrlContractRate.LoadRateTypeCombo(sEntityName, 'contractRate-Type', bExistingRate, CReadRateResponse.AvailableRateTypeList);

                    TriSysSDK.CShowForm.SetTextInCombo('contractRate-Type', CReadRateResponse.RateType);
                    $('#contractRate-Notes').val(CReadRateResponse.Notes);

                    TriSysSDK.Controls.CurrencyAmountPeriod.SetCurrencyAmountPeriod('contractRate-PayRate', CReadRateResponse.PayRate);
                    TriSysSDK.Controls.CurrencyAmountPeriod.SetCurrencyAmountPeriod('contractRate-ChargeRate', CReadRateResponse.ChargeRate);
                    TriSysSDK.Controls.CurrencyAmountPeriod.SetCurrencyAmountPeriod('contractRate-PAYE', CReadRateResponse.PAYE);
                    TriSysSDK.Controls.CurrencyAmountPeriod.SetCurrencyAmountPeriod('contractRate-StandardPayRate', CReadRateResponse.StandardPayRate);
                    TriSysSDK.Controls.CurrencyAmountPeriod.SetCurrencyAmountPeriod('contractRate-StandardChargeRate', CReadRateResponse.StandardChargeRate);

                    TriSysSDK.Controls.NumericSpinner.SetValue('contractRate-MarginPercentage', CReadRateResponse.Margin);
                    TriSysSDK.Controls.NumericSpinner.SetValue('contractRate-MarkupPercentage', CReadRateResponse.Markup);

                    TriSysSDK.Controls.NumericSpinner.SetValue('contractRate-DaysPerWeek', CReadRateResponse.DaysPerWeek);
                    TriSysSDK.Controls.NumericSpinner.SetValue('contractRate-HoursPerDay', CReadRateResponse.HoursPerDay);
                    TriSysSDK.Controls.NumericSpinner.SetValue('contractRate-DurationInWeeks', CReadRateResponse.DurationInWeeks);

                    TriSysSDK.Controls.NumericSpinner.SetValue('contractRate-Multiplier', CReadRateResponse.Multiplier);

                    ctrlContractRate.AfterRateTypeChange(CReadRateResponse.RateType);

                    // Calculate the values/percentages etc..
                    ctrlContractRate.CalculationEngine();

                    return;
                }
                else
                    TriSysApex.UI.ShowMessage(CReadRateResponse.ErrorMessage);
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('ctrlContractRate.ReadFromWebAPI: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Reading Rate...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    // Called when the user wants to add a new rate based upon the current fields
    AddNewButtonClick: function()
    {
        var fnAfterSave = function (lRateId)
        {
            // Remove the rate from the combo and clear the specified rateid
            var context = TriSysApex.ModalDialogue.ContractRates.Context;
            context.RateId = 0;

            var sRateType = TriSysSDK.CShowForm.GetTextFromCombo('contractRate-Type');

            // If this was saving the new standard rate, then copy these values
            var bStandard = (sRateType == 'Standard');
            if (bStandard)
            {
                var fPayRateAmount = TriSysSDK.Controls.CurrencyAmountPeriod.GetAmount('contractRate-PayRate');
                var fChargeRateAmount = TriSysSDK.Controls.CurrencyAmountPeriod.GetAmount('contractRate-ChargeRate');

                TriSysSDK.Controls.CurrencyAmountPeriod.SetAmount('contractRate-StandardPayRate', fPayRateAmount);
                TriSysSDK.Controls.CurrencyAmountPeriod.SetAmount('contractRate-StandardChargeRate', fChargeRateAmount);
            }

            // Remove this rate type now and re-enable the combo if it was disabled
            TriSysSDK.CShowForm.RemoveComboItem('contractRate-Type', sRateType);
            $('#contractRate-Notes').val('');
            TriSysSDK.CShowForm.ComboEnabled('contractRate-Type', true);

            // 14 Dec 2023: If adding new rates to form, then need to make enabled
            TriSysSDK.Controls.CurrencyAmountPeriod.Readonly('contractRate-PAYE', false);
        };

        ctrlContractRate.SaveRate(fnAfterSave);
    },

    // Called when user clicks the Apply button to save the contract rate
    SaveButtonClick: function ()
    {
        var fnAfterSave = function (lRateId)
        {
            // Close this modal dialogue
            TriSysApex.UI.CloseModalPopup();
        };

        ctrlContractRate.SaveRate(fnAfterSave);
    },

    // Save the contract rate and refresh the underlying grid on completion, then fire the callback
    SaveRate: function (fnCallback)
    {
        var context = TriSysApex.ModalDialogue.ContractRates.Context;

        var CWriteRateRequest =
        {
            // The entity record
            EntityName: context.EntityName,
            EntityId: context.RecordId,

            // Company rate card
            JobTitle: $('#contractRate-JobTitle').val(),
            AddressId: TriSysSDK.CShowForm.GetValueFromCombo('contractRate-CompanyAddress'),

            // Rate details
            RateId: context.RateId,            // May be 0 for a new rate
            RateType: TriSysSDK.CShowForm.GetTextFromCombo('contractRate-Type'),
            Notes: $('#contractRate-Notes').val(),
            PayRate: TriSysSDK.Controls.CurrencyAmountPeriod.GetCurrencyAmountPeriod('contractRate-PayRate'),
            ChargeRate: TriSysSDK.Controls.CurrencyAmountPeriod.GetCurrencyAmountPeriod('contractRate-ChargeRate'),
            PAYE: TriSysSDK.Controls.CurrencyAmountPeriod.GetCurrencyAmountPeriod('contractRate-PAYE'),
            Margin: TriSysSDK.Controls.NumericSpinner.GetValue('contractRate-MarginPercentage'),
            Markup: TriSysSDK.Controls.NumericSpinner.GetValue('contractRate-MarkupPercentage'),
            DaysPerWeek: TriSysSDK.Controls.NumericSpinner.GetValue('contractRate-DaysPerWeek'),
            HoursPerDay: TriSysSDK.Controls.NumericSpinner.GetValue('contractRate-HoursPerDay'),
            DurationInWeeks: TriSysSDK.Controls.NumericSpinner.GetValue('contractRate-DurationInWeeks'),
            Multiplier: TriSysSDK.Controls.NumericSpinner.GetValue('contractRate-Multiplier'),
            Value: TriSysSDK.Controls.CurrencyAmount.GetCurrencyAmount('contractRate-Value'),
            Profit: TriSysSDK.Controls.CurrencyAmount.GetCurrencyAmount('contractRate-Profit'),
            ValuePerUnit: TriSysSDK.Controls.CurrencyAmount.GetCurrencyAmount('contractRate-ValuePerUnit')
        };
        

        // Validation
        var bCompanyRate = (context.EntityName == 'Company');
        var fPayRateAmount = TriSysSDK.Controls.CurrencyAmountPeriod.GetAmount('contractRate-PayRate');
        var fChargeRateAmount = TriSysSDK.Controls.CurrencyAmountPeriod.GetAmount('contractRate-ChargeRate');
		
		// Was a customer specific (TQS) exception until 24 Mar 2021
        var bWarningOnValidationOnly = false;

        // 24 Mar 2021: System setting override
        var bEnforcePayRateGreaterThanChargeRate = TriSysAPI.Operators.stringToBoolean(TriSysApex.Cache.SystemSettingManager.GetValue("Enforce Pay Rate Greater Than Charge Rate", true));
        if (!bEnforcePayRateGreaterThanChargeRate)
            bWarningOnValidationOnly = true;

        var bError = false;
        if (CWriteRateRequest.RateId == 0)
        {
            // New rate
            if(bCompanyRate)
            {
                var sAddress = TriSysSDK.CShowForm.GetTextFromCombo('contractRate-CompanyAddress');
                if (!CWriteRateRequest.JobTitle || CWriteRateRequest.JobTitle == '-') bError = TriSysApex.Toasters.ErrorValidatingField("Job Title");
                if (!sAddress) bError = TriSysApex.Toasters.ErrorValidatingField("Company Address");
            }
        }

        if (CWriteRateRequest.RateType == '-- Please Select --') bError = TriSysApex.Toasters.ErrorValidatingField("Rate Type");
        if (fPayRateAmount <= 0) 
		{
			if(!bWarningOnValidationOnly)
				bError = TriSysApex.Toasters.ErrorValidatingField("Pay Rate");
		}
        if (fChargeRateAmount <= 0) 
		{
			if(!bWarningOnValidationOnly)
				bError = TriSysApex.Toasters.ErrorValidatingField("Charge Rate");
		}
        if (fPayRateAmount >= fChargeRateAmount) 
		{
			if(bWarningOnValidationOnly)
			{
				var fnSaveAnyway = function()
				{
					ctrlContractRate.SendRateChangeToWebAPI(CWriteRateRequest, context, fnCallback);
					return true;
				};
				var sMessage = "The Pay Rate is equal to or less than the Charge Rate. Do you want to continue?";
				TriSysApex.UI.questionYesNo(sMessage, "Rate Validation", "Yes", fnSaveAnyway, "No");
				return;
			}
			else
				bError = TriSysApex.Toasters.ErrorValidatingMessage("Charge rate must be higher than pay rate");			
		}

        if (bError) return;

        ctrlContractRate.SendRateChangeToWebAPI(CWriteRateRequest, context, fnCallback);
    },

	// Call the API to submit the data to the server
    SendRateChangeToWebAPI: function(CWriteRateRequest, context, fnCallback)
	{
		var payloadObject = {};

        payloadObject.URL = "Rates/Write";

        payloadObject.OutboundDataPacket = CWriteRateRequest;

        payloadObject.InboundDataFunction = function (CWriteRateResponse)
        {
            TriSysApex.UI.HideWait();

            if (CWriteRateResponse)
            {
                if (CWriteRateResponse.Success)
                {
                    // Close our popup and refresh the underlying grid
                    TriSysSDK.Grid.ClearCheckedRows(context.Grid);
                    TriSysSDK.Grid.RefreshData(context.Grid);

					// Important: If changes to standard rate have been made, then update the underlying entity form
					// in case the user saves that form too which would overwrite our changes!
					ctrlContractRate.SynchroniseStandard(CWriteRateRequest, context);

                    // After save, callback the caller to either add a new rate or close this modal
                    fnCallback(CWriteRateResponse.RateId);

                    return;
                }
                else
                    TriSysApex.UI.ShowMessage(CWriteRateResponse.ErrorMessage);
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('ctrlContractRate.SendRateChangeToWebAPI: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Saving Rate...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
	},

	SynchroniseStandard: function(CWriteRateRequest, context)
	{
		var bStandard = (CWriteRateRequest.RateType == 'Standard');
		if(bStandard)
		{
			if(context.EntityName == "Requirement" || context.EntityName == "Placement")
			{
				TriSysSDK.Controls.NumericSpinner.SetValue(context.EntityName + 'ConfigFields_DurationInWeeks', CWriteRateRequest.DurationInWeeks);
				TriSysSDK.Controls.NumericSpinner.SetValue(context.EntityName + 'ConfigFields_HoursPerDay', CWriteRateRequest.HoursPerDay);
				TriSysSDK.Controls.NumericSpinner.SetValue(context.EntityName + 'ConfigFields_DaysPerWeek', CWriteRateRequest.DaysPerWeek);
			}
		}
	},

    JobTitleLookup: function ()
    {
        var sJobTitleField = 'contractRate-JobTitle';
        var sJobTitle = TriSysSDK.CShowForm.GetJobTitleFromField(sJobTitleField);
        TriSysSDK.JobTitle.Lookup(sJobTitle, sJobTitleField);
    }
};


// Now display the document 
$(document).ready(function ()
{
    ctrlContractRate.Load();
});
