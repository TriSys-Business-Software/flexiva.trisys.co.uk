var ctrlEditRelationship =
{
	Load: function(relationship)
	{
		$('#ctrlEditRelationship-From').val(relationship.RecordName);

		var options = null;
		switch(relationship.EntityName)
		{
			case "Contact":
				TriSysSDK.CShowForm.skillCombo('ctrlEditRelationship-Relationship', relationship.EntityName + ' Relationship', relationship.Relationship);

				options = { ContactId: relationship.LinkedRecordId, ContactName: relationship.LinkedRecordName };
				if(relationship.LinkedRecordId > 0)
					options.PreventSelection = true;
				TriSysSDK.Controls.ContactLookup.Load("ctrlEditRelationship-To", options);

				break;

			case "Company":
				ctrlEditRelationship.PopulateCompanyRelationshipTypesCombo('ctrlEditRelationship-Relationship', relationship.Relationship);

				options = { CompanyId: relationship.LinkedRecordId, CompanyName: relationship.LinkedRecordName };
				if(relationship.LinkedRecordId > 0)
					options.PreventSelection = true;
				TriSysSDK.Controls.CompanyLookup.Load("ctrlEditRelationship-To", options);

				break;
		}
	},

	PopulateCompanyRelationshipTypesCombo: function(sFieldID, sRelationship)
	{
		var sourceTypes = [], iCount = 0, iTypeIndex = 0;

		TriSysApex.Cache.CompanyRelationshipTypes().forEach(function(relationship)
		{
			var sourceStruct = {
                value: relationship.CompanyRelationshipTypeId,
                text: relationship.Name
            };
            sourceTypes.push(sourceStruct);

			if(relationship.Name == sRelationship)
				iTypeIndex = iCount;

			iCount += 1;
		});

		TriSysSDK.CShowForm.populateComboFromDataSource(sFieldID, sourceTypes, iTypeIndex);
	},

	_ReverseMode: false,
	ReverseRelationship: function()
	{
		ctrlEditRelationship._ReverseMode = !ctrlEditRelationship._ReverseMode;
		if(ctrlEditRelationship._ReverseMode)
		{
			$('#ctrlEditRelationship-Relationship-tr').after($('#ctrlEditRelationship-From-tr'));
			$('#ctrlEditRelationship-Relationship-tr').before($('#ctrlEditRelationship-To-tr'));
		}
		else
		{
			$('#ctrlEditRelationship-Relationship-tr').before($('#ctrlEditRelationship-From-tr'));
			$('#ctrlEditRelationship-Relationship-tr').after($('#ctrlEditRelationship-To-tr'));
		}
	},

	SaveButtonClick: function(relationship)
	{
		var lSelectedRecordId = TriSysSDK.Controls.ContactLookup.ReadContactId('ctrlEditRelationship-To');
		if(relationship.EntityName == "Company")
			lSelectedRecordId = TriSysSDK.Controls.CompanyLookup.ReadCompanyId('ctrlEditRelationship-To');

		if(lSelectedRecordId == 0)
		{
			TriSysApex.UI.ShowMessage("Please select a " + relationship.EntityName);
			return;
		}

		var lFromRecordId = ctrlEditRelationship._ReverseMode ? lSelectedRecordId : relationship.RecordId;
		var lToRecordId = ctrlEditRelationship._ReverseMode ? relationship.RecordId : lSelectedRecordId;

		if(lFromRecordId == lToRecordId)
		{
			TriSysApex.UI.ShowMessage("Please select another " + relationship.EntityName + " because you cannot have a relationship between identical records");
			return;
		}

		relationship.Relationship = TriSysSDK.CShowForm.GetTextFromCombo('ctrlEditRelationship-Relationship');
		relationship.RecordId = lFromRecordId;
		relationship.LinkedRecordId = lToRecordId;

		ctrlEditRelationship.SaveRelationship(relationship);
	},

	SaveRelationship: function(relationship)
	{
		var CRelationshipWriteRequest =
        {
            EntityName: relationship.EntityName,
			FromRecordId: relationship.RecordId,
			ToRecordId: relationship.LinkedRecordId,
			Relationship: relationship.Relationship
        };

        var payloadObject = {};

        payloadObject.OutboundDataPacket = CRelationshipWriteRequest;

        payloadObject.URL = "Relationships/Write";

        payloadObject.InboundDataFunction = function (CRelationshipWriteResponse)
        {
            TriSysApex.UI.HideWait();

            if (CRelationshipWriteResponse)
            {
                if (CRelationshipWriteResponse.Success)
                {
					// Caller defined post-processing
                    TriSysApex.UI.CloseModalPopup();
					relationship.AfterUpdateCallback(relationship);		
                }
                else
                    TriSysApex.UI.ShowMessage(CRelationshipWriteResponse.ErrorMessage);
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('ctrlEditRelationship.SaveRelationship: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Saving Relationship...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
	}

};	// ctrlEditRelationship