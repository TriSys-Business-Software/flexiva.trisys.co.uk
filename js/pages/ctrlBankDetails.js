// This user control is used to both display the read-only bank details on the entity forms,
// but also to edit modally the bank details.
var ctrlBankDetails =
{
	EditableFields: [ "Name", "SortCode", "AccountName", "AccountNumber", "Street", "City", "County", 
							"PostCode", "Country" ],

	Data:
	{
		EntityFields: [
			{ EntityName: "Contact", RecordId: 0 },
			{ EntityName: "Company", RecordId: 0 }
		],

		Set: function(sEntityName, lRecordId)
		{
			ctrlBankDetails.Data.EntityFields.forEach(function(field)
			{
				if(field.EntityName == sEntityName)
				{
					field.RecordId = lRecordId;
				}
			});
		},

		Get: function(sEntityName)
		{
			var foundField = null;

			ctrlBankDetails.Data.EntityFields.forEach(function(field)
			{
				if(field.EntityName == sEntityName)
				{
					foundField = field;
				}
			});

			return foundField;
		}
	},

	LoadRecord: function (sParentID, sEntityName, fnCallback)
	{
		// Rename DOM ID's
		var sEditButtonId = "EntityNameForm-BankDetails-edit-button";
		var sNewEditButtonId = sEditButtonId.replace("EntityNameForm", sEntityName);
		$("#" + sEditButtonId).attr("id", sNewEditButtonId);

		var sPrefix = sEntityName + "_BankDetails_";
		var lstRenamedFields = [];
		ctrlBankDetails.EditableFields.forEach(function(sField)
		{
			lstRenamedFields.push(sPrefix + sField);
			$("#" + "BankDetails_" + sField).attr("id", lstRenamedFields[lstRenamedFields.length - 1]);		
		});
		ctrlBankDetails.Data.Set(sEntityName);

		// Lookup button
		$('#BankDetails_PostCodeLookup').attr("id", sPrefix + "PostCodeLookup");

		// Update button
		$('#' + sNewEditButtonId).off().on('click', function ()
		{
			ctrlBankDetails.EditMode(sEntityName, lstRenamedFields);
		});
		
		if(fnCallback)
			fnCallback();
	},

	LoadBankDetails: function(sEntityName, lRecordId)
	{
		setTimeout(TriSysProUI.kendoUI_Overrides, 10);

		ctrlBankDetails.ReadFromWebAPI(sEntityName, lRecordId);
	},

	EditMode: function(sEntityName, lstRenamedFields)
	{
		var parametersObject = new TriSysApex.UI.ShowMessageParameters();
        parametersObject.Title = "Edit " + sEntityName + " Bank Details";
        parametersObject.Image = "fa-bank";
		parametersObject.CloseTopRightButton = true;

        parametersObject.ContentURL = TriSysApex.Constants.UserControlFolder + "ctrlBankDetails.html";

        parametersObject.ButtonRightText = "Cancel";
        parametersObject.ButtonRightVisible = true;

        parametersObject.ButtonLeftText = "Save";
        parametersObject.ButtonLeftVisible = true;
        parametersObject.ButtonLeftFunction = function ()
        {
            ctrlBankDetails.SaveButtonClick(sEntityName);
        };
        parametersObject.OnLoadCallback = function ()
        {
            // Use known DOM id's to make editable
			ctrlBankDetails.EditableFields.forEach(function(sField)
			{
				$("#" + "BankDetails_" + sField).attr("readonly", false);		
			});
			$('#BankDetails_PostCodeLookup').show();
			$('#EntityNameForm-BankDetails-edit-button').hide();

			// Use known DOM id's to display underlying values without a round-trip
			ctrlBankDetails.EditableFields.forEach(function(sField)
			{
				var sEditableField = "BankDetails_" + sField;
				lstRenamedFields.forEach(function(sFieldName)
				{
					if(sFieldName.indexOf("_" + sField) > 0)
					{
						$('#' + sEditableField).val($('#' + sFieldName).val());
					}
				});
			});
        };

        TriSysApex.UI.PopupMessage(parametersObject);
	},

	PostCodeLookup: function()
	{
		TriSysSDK.PostCode.Lookup('BankDetails_PostCode',
                                    'BankDetails_Street',
                                    'BankDetails_City',
                                    'BankDetails_County',
                                    'BankDetails_Country');
	},

	ReadFromWebAPI: function(sEntityName, lRecordId)
	{
		var payloadObject = {};

        payloadObject.URL = "BankDetails/ReadEntityBankDetails";

        payloadObject.OutboundDataPacket = {
			EntityName: sEntityName,
			RecordId: lRecordId
		};

        payloadObject.InboundDataFunction = function (CReadEntityBankDetailsResponse)
        {
            TriSysApex.UI.HideWait();

            if (CReadEntityBankDetailsResponse)
            {
                if (CReadEntityBankDetailsResponse.Success)
                {
                    ctrlBankDetails.DisplayBankDetails(sEntityName, lRecordId, CReadEntityBankDetailsResponse.BankDetails);
                    return;
                }
                else
				{
					if(CReadEntityBankDetailsResponse.ErrorMessage)
						TriSysApex.UI.ShowMessage(CReadEntityBankDetailsResponse.ErrorMessage);
					else 
						ctrlBankDetails.DisplayBankDetails(sEntityName, lRecordId, {});
				}
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('ctrlBankDetails.ReadFromWebAPI: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Reading Bank Details...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
	},

	DisplayBankDetails: function(sEntityName, lRecordId, bankDetails)
	{
		var field = ctrlBankDetails.Data.Get(sEntityName);
		field.RecordId = lRecordId;

		var sPrefix = sEntityName + "_BankDetails_";

		ctrlBankDetails.WriteFields(sPrefix, bankDetails);
	},

	SaveButtonClick: function(sEntityName)
	{
		var sPrefix = "BankDetails_";
		var bankDetails = { Address: {} };
		
		// Capture fields
		bankDetails.Name = $('#' + sPrefix + "Name").val();
		bankDetails.SortCode = $('#' + sPrefix + "SortCode").val();
		bankDetails.AccountName = $('#' + sPrefix + "AccountName").val();
		bankDetails.AccountNo = $('#' + sPrefix + "AccountNumber").val();

		bankDetails.Address.Street = $('#' + sPrefix + "Street").val();
		bankDetails.Address.City = $('#' + sPrefix + "City").val();
		bankDetails.Address.County = $('#' + sPrefix + "County").val();
		bankDetails.Address.PostCode = $('#' + sPrefix + "PostCode").val();
		bankDetails.Address.Country = $('#' + sPrefix + "Country").val();
		bankDetails.Address.TelNo = $('#' + sPrefix + "TelNo").val();

		// Send to web api, but on save, write back to underlying form fields, then close this popup
		ctrlBankDetails.WriteToWebAPI(sEntityName, bankDetails);
	},

	WriteToWebAPI: function(sEntityName, bankDetails)
	{
		// This knows the record id as we can only edit one entity bank details at a time
		// plus the fields we will update
		var field = ctrlBankDetails.Data.Get(sEntityName);
		
		var payloadObject = {};

        payloadObject.URL = "BankDetails/WriteEntityBankDetails";

        payloadObject.OutboundDataPacket = {
			EntityName: sEntityName,
			RecordId: field.RecordId,
			BankDetails: bankDetails
		};

        payloadObject.InboundDataFunction = function (CWriteEntityBankDetailsResponse)
        {
            TriSysApex.UI.HideWait();

            if (CWriteEntityBankDetailsResponse)
            {
                if (CWriteEntityBankDetailsResponse.Success)
                {
                    ctrlBankDetails.UpdateCompleted(sEntityName, bankDetails);
                    return;
                }
                else
				{
					TriSysApex.UI.ShowMessage(CWriteEntityBankDetailsResponse.ErrorMessage);
				}
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('ctrlBankDetails.WriteToWebAPI: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Saving Bank Details...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
	},

	UpdateCompleted: function(sEntityName, bankDetails)
	{
		var sPrefix = sEntityName + "_BankDetails_";
		ctrlBankDetails.WriteFields(sPrefix, bankDetails);

		TriSysApex.UI.CloseModalPopup();
	},

	WriteFields: function(sPrefix, bankDetails)
	{
		$('#' + sPrefix + "Name").val(bankDetails.Name);
		$('#' + sPrefix + "SortCode").val(bankDetails.SortCode);
		$('#' + sPrefix + "AccountName").val(bankDetails.AccountName);
		$('#' + sPrefix + "AccountNumber").val(bankDetails.AccountNo);

		if(bankDetails.Address)
		{
			$('#' + sPrefix + "Street").val(bankDetails.Address.Street);
			$('#' + sPrefix + "City").val(bankDetails.Address.City);
			$('#' + sPrefix + "County").val(bankDetails.Address.County);
			$('#' + sPrefix + "PostCode").val(bankDetails.Address.PostCode);
			$('#' + sPrefix + "Country").val(bankDetails.Address.Country);
			$('#' + sPrefix + "TelNo").val(bankDetails.Address.TelNo);
		}
	}

};	// ctrlBankDetails