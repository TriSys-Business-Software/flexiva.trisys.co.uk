var ctrlRelationships =
{
	Load: function (sParentID, sEntityName, fnCallback)
	{
		// Rename EntityNameForm-RelationshipsGrid to sEntityName + Form-RelationshipsGrid
		var sGridId = ctrlRelationships.GridId(sEntityName);
		$("#EntityNameForm-RelationshipsGrid").attr("id", sGridId);
		var sTitleId = sEntityName + 'Form-RelationshipsTitle';
		$("#EntityNameForm-RelationshipsTitle").attr("id", sTitleId);
		$('#' + sTitleId).html(sEntityName + " Relationships");		

		// Grid Buttons
		var sAddButtonId = sEntityName + 'Form-Relationships-add-button';
		$("#EntityNameForm-Relationships-add-button").attr("id", sAddButtonId);
		
		var sUpdateButtonId = sEntityName + 'Form-Relationships-update-button';
		$("#EntityNameForm-Relationships-update-button").attr("id", sUpdateButtonId);

		var sDeleteButtonId = sEntityName + 'Form-Relationships-delete-button';
		$("#EntityNameForm-Relationships-delete-button").attr("id", sDeleteButtonId);

		// Grid Menu
		var sGridMenuId = sEntityName + 'Form-RelationshipsGridMenu';
		$("#EntityNameForm-RelationshipsGridMenu").attr("id", sGridMenuId);
		TriSysSDK.FormMenus.DrawGridMenu(sGridMenuId, sGridId);

		if(fnCallback)
			fnCallback();
	},

	LoadRelationships: function(sEntityName, lRecordId)
	{
		// Grid Buttons
		var sAddButtonId = sEntityName + 'Form-Relationships-add-button';
		$('#' + sAddButtonId).off().on('click', function ()
		{
			ctrlRelationships.Add(sEntityName, lRecordId);
		});

		var sUpdateButtonId = sEntityName + 'Form-Relationships-update-button';
		$('#' + sUpdateButtonId).off().on('click', function ()
		{
			ctrlRelationships.Update(sEntityName, lRecordId);
		});

		var sDeleteButtonId = sEntityName + 'Form-Relationships-delete-button';
		$('#' + sDeleteButtonId).off().on('click', function ()
		{
			ctrlRelationships.Delete(sEntityName, lRecordId);
		});

		setTimeout(TriSysProUI.kendoUI_Overrides, 10);

		ctrlRelationships.ReadFromWebAPI(sEntityName, lRecordId);
	},

	ReadFromWebAPI: function(sEntityName, lRecordId)
	{
		var fnPopulationByFunction = {
            API: "Relationships/List",              // The Web API Controller/Function

            // The additional parameters passed into the function not including the paging metrics
            Parameters: function (request)
            {
                request.EntityName = sEntityName;
				request.RecordId = lRecordId;
            },

            DataTableFunction: function (response)  // Called to get a suitable data table for the grid to display
            {
                return response.List;               // The list of records from the Web API
            }
        };

		var sGridId = ctrlRelationships.GridId(sEntityName);
        ctrlRelationships.PopulateGrid(sGridId, "grdRelationships", sEntityName, lRecordId, fnPopulationByFunction);
	},

	PopulateGrid: function(sGridId, sGridName, sEntityName, lRecordId, fnPopulationByFunction)
	{
        var bMultiRowSelect = !TriSysApex.Device.isPhone();
        var bColumnFilters = false;

        debugger;

        // Populate the grid now
        TriSysSDK.Grid.VirtualMode({
            Div: sGridId,
            ID: sGridName,
            Title: sEntityName + " Relationships",
            RecordsPerPage: TriSysApex.UserOptions.RecordsPerPage(),
            PopulationByFunction: fnPopulationByFunction,
            Columns: ctrlRelationships.GridColumns(sEntityName),

            KeyColumnName: "FromEntity",
            DrillDownFunction: function (rowData)
            {
                ctrlRelationships.DrillDownFunction(sEntityName, lRecordId, rowData);
            },
            MultiRowSelect: bMultiRowSelect,
            ColumnFilters: bColumnFilters,
            Grouping: TriSysApex.UserOptions.GridGrouping(),
            HyperlinkedEntities:                                        // New Feb 2021 to allow multiple separate entity hyperlinks
            {
                EntityName: sEntityName,
                Columns: [
                            {
                                field: "FromEntity",
                                linkType: "Function",
                                fnCallback: function (row) { ctrlRelationships.HyperlinkDrillDown(row, "From", sGridId); },
                                keyColumnName: "From" + sEntityName + "Id"
                            },
                            {
                                field: "ToEntity",
                                linkType: "Function",
                                fnCallback: function (row) { ctrlRelationships.HyperlinkDrillDown(row, "To", sGridId); },
                                keyColumnName: "To" + sEntityName +"Id"
                            }
                ]
            }
        });
	},

	GridColumns: function(sEntityName)
	{
		var columns= [
				{ field: "FromEntity", title: "From", type: "string" },
                { field: "RelationshipType", title: "Relationship Type", type: "string", hidden: true },
				{ field: "ToEntity", title: "To", type: "string" }
		];

		switch(sEntityName)
		{
			case "Contact":

				columns.splice(1, 0, { field: "Relationship", title: "Relationship", type: "string" });
				columns.push({ field: "FromContactId", title: "FromContactId", type: "number", hidden: true });
				columns.push({ field: "ToContactId", title: "ToContactId", type: "number", hidden: true });
				break;

			case "Company":
				columns[1].hidden = false;
				columns.push({ field: "FromCompanyId", title: "FromCompanyId", type: "number", hidden: true });
				columns.push({ field: "ToCompanyId", title: "ToCompanyId", type: "number", hidden: true });				
				break;
		}          

		return columns;
	},

	DrillDownFunction: function(sEntityName, lRecordId, rowData)
	{
		switch(sEntityName)
		{
			case "Contact":

				var lContactId = rowData.FromContactId == lRecordId ? rowData.ToContactId : rowData.FromContactId;				
                TriSysApex.FormsManager.OpenForm(sEntityName, lContactId);

				break;

			case "Company":

				var lCompanyId = rowData.FromCompanyId == lRecordId ? rowData.ToCompanyId : rowData.FromCompanyId;				
                TriSysApex.FormsManager.OpenForm(sEntityName, lCompanyId);

				break;
		}
	},

    // Dynamic multi-column hyperlink Feb 2021
	HyperlinkDrillDown: function (rowData, sDirection, sGridDiv)
	{
	    //TriSysApex.UI.ShowMessage("ctrlRelationships: " + sDirection + ", " + sGridDiv + 
        //                ", From=" + rowData.FromContactId + ", To=" + rowData.ToContactId);
	    var gridDrillDown = TriSysSDK.Grid.HyperlinkedColumns.ReadGridDrillDownCallbackFunctions(sGridDiv);
	    if (gridDrillDown)
	    {
	        var sEntityName = gridDrillDown.gridLayout.HyperlinkedEntities.EntityName;
	        var lEntityId = rowData[sDirection + sEntityName + "Id"];
	        TriSysApex.FormsManager.OpenForm(sEntityName, lEntityId);
	    }
	},

	GridId: function(sEntityName)
	{
		return sEntityName + 'Form-RelationshipsGrid';
	},

	Add: function(sEntityName, lRecordId)
	{
		var relationship = new ctrlRelationships.CRelationship(sEntityName, lRecordId);
		ctrlRelationships.EditRelationship(relationship);
	},

	Update: function(sEntityName, lRecordId)
	{
		var relationship = ctrlRelationships.GetSelectedSingletonLinkedRecordFromGrid(sEntityName);
		if(relationship.LinkedRecordId <= 0)
			return;

		// Is relationship reversed i.e. is To listed first?
		var bReversed = lRecordId != relationship.RecordId;

		ctrlRelationships.EditRelationship(relationship, bReversed);
	},

	Delete: function(sEntityName, lRecordId)
	{
		var relationship = ctrlRelationships.GetSelectedSingletonLinkedRecordFromGrid(sEntityName);
		if(relationship.LinkedRecordId <= 0)
			return;

		ctrlRelationships.DeleteRelationship(relationship, lRecordId);
	},

	GetSelectedSingletonLinkedRecordFromGrid: function (sEntityName)		// Return new ctrlRelationships.CRelationship
    {
		var sGridId = ctrlRelationships.GridId(sEntityName);
		var sWhat = sEntityName == "Contact" ? "contact" : "company";

		var sFieldFromId = sEntityName == "Contact" ? "FromContactId" : "FromCompanyId";
		var sFieldToId = sEntityName == "Contact" ? "ToContactId" : "ToCompanyId";
        var lFromId = TriSysSDK.Grid.GetSelectedSingletonRowRecordIdFromGrid(sGridId, sFieldFromId, sWhat);
		if(!lFromId) return;

        var lToId = TriSysSDK.Grid.GetSelectedSingletonRowRecordIdFromGrid(sGridId, sFieldToId, sWhat);
		if(!lToId) return;

		var sFieldRelationship = sEntityName == "Contact" ? "Relationship" : "RelationshipType";
        var sRelationship = TriSysSDK.Grid.GetSelectedSingletonRowRecordIdFromGrid(sGridId, sFieldRelationship, sWhat);

        var sFromEntity = TriSysSDK.Grid.GetSelectedSingletonRowRecordIdFromGrid(sGridId, "FromEntity", sWhat);
        var sToEntity = TriSysSDK.Grid.GetSelectedSingletonRowRecordIdFromGrid(sGridId, "ToEntity", sWhat);
        
		var relationship = new ctrlRelationships.CRelationship(sEntityName, lFromId, sFromEntity, sRelationship, lToId, sToEntity);
		
		return relationship;
    },

	// var relationship = new ctrlRelationships.CRelationship
	CRelationship: function(sEntityName, lRecordId, sRecordName, sRelationship, lLinkedRecordId, sLinkedRecordName)
	{
		this.EntityName = sEntityName;
		this.RecordId = lRecordId;
	
		if(!sRecordName)
		{
			if(sEntityName == "Contact")
				sRecordName = $('#Contact_Forenames').val() + ' ' + $('#Contact_Surname').val();
			else
				sRecordName = $('#Company_Name').val();
		}
		this.RecordName = sRecordName;

		this.Relationship = sRelationship ? sRelationship : 'is a colleague of';
		this.LinkedRecordId = lLinkedRecordId;
		this.LinkedRecordName = sLinkedRecordName;

		var lRefreshRecordIdOnUpdate = sEntityName == "Contact" ? TriSysApex.Pages.ContactForm.ContactId : TriSysApex.Pages.CompanyForm.CompanyId;

		this.AfterUpdateCallback = function(relationship)
		{
			ctrlRelationships.LoadRelationships(sEntityName, lRefreshRecordIdOnUpdate);
		};
	},

	EditRelationship: function(relationship, bReversed)
	{
		var parametersObject = new TriSysApex.UI.ShowMessageParameters();
        parametersObject.Title = (relationship.LinkedRecordId > 0 ? "Edit" : "New") + " " + relationship.EntityName + " Relationship";
        parametersObject.Image = "gi-random";

        parametersObject.ContentURL = TriSysApex.Constants.UserControlFolder + "ctrlEditRelationship.html";

        parametersObject.ButtonRightText = "Cancel";
        parametersObject.ButtonRightVisible = true;

        parametersObject.ButtonCentreText = "Reverse Relationship";
        parametersObject.ButtonCentreVisible = true;
        parametersObject.ButtonCentreFunction = function ()
        {
            ctrlEditRelationship.ReverseRelationship();
        };

        parametersObject.ButtonLeftText = "Save";
        parametersObject.ButtonLeftVisible = true;
        parametersObject.ButtonLeftFunction = function ()
        {
            ctrlEditRelationship.SaveButtonClick(relationship);
        };
        parametersObject.OnLoadCallback = function ()
        {
            ctrlEditRelationship.Load(relationship);
			
			// Turns out this does not matter!
			//if(bReversed)
			//	ctrlEditRelationship.ReverseRelationship();
        };

        TriSysApex.UI.PopupMessage(parametersObject);
	},

	DeleteRelationship: function(relationship, lRecordId)
	{
		var sMessage = "Do you wish to delete the relationship between " + relationship.RecordName + " and " + relationship.LinkedRecordName + "?";
		var fnDelete = function() 
		{ 
			ctrlRelationships.DeleteViaWebAPI(relationship, lRecordId); 
			return true; 
		};
		TriSysApex.UI.questionYesNo(sMessage, "Delete " + relationship.EntityName + " Relationship", "Yes", fnDelete, "No");		
	},

	DeleteViaWebAPI: function(relationship, lRecordId)
	{
		var CRelationshipDeleteRequest =
        {
            EntityName: relationship.EntityName,
			FromRecordId: relationship.RecordId,
			ToRecordId: relationship.LinkedRecordId
        };

        var payloadObject = {};

        payloadObject.OutboundDataPacket = CRelationshipDeleteRequest;

        payloadObject.URL = "Relationships/Delete";

        payloadObject.InboundDataFunction = function (CRelationshipDeleteResponse)
        {
            TriSysApex.UI.HideWait();

            if (CRelationshipDeleteResponse)
            {
                if (CRelationshipDeleteResponse.Success)
                {
					ctrlRelationships.LoadRelationships(relationship.EntityName, lRecordId);	
                }
                else
                    TriSysApex.UI.ShowMessage(CRelationshipDeleteResponse.ErrorMessage);
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('ctrlRelationships.DeleteViaWebAPI: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Deleting Relationship...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
	}

};	// ctrlRelationships