var GDPRMonitor =
{
	Grid: 'gdprMonitor-grid',
	GridMenu: 'gdprMonitor-GridMenu',
	GridActionsMenu: 'gdprMonitor-ActionsMenu',
	ActionFunction: 'GDPRMonitor.ActionSearchInvocation',

	Load: function ()
	{
		GDPRMonitor.GridMenus();
		GDPRMonitor.PopulateGrid();
	},

	GridMenus: function ()
	{
		TriSysSDK.FormMenus.DrawGridMenu(GDPRMonitor.GridMenu, GDPRMonitor.Grid);	
		TriSysActions.Menus.Draw(GDPRMonitor.GridActionsMenu, 'Contact', GDPRMonitor.ActionFunction);
	},

	PopulateGrid: function ()
	{
		var fnPopulationByFunction = {
			API: "Marketing/GDPRMonitor",					// The Web API Controller/Function

			DataTableFunction: function ( response )		// Called to get a suitable data table for the grid to display
			{
				return response.List;						// The list of records from the Web API
			}
		};

		// Show date sent column after surname column
		var columns = [
			{ field: "Contact_ContactId", title: "ID", type: "number", width: 70, hidden: true },
			{ field: "Contact_ContactType", title: "Type", type: "string", hidden: true },
			{ field: "Contact_Christian", title: "Forename(s)", type: "string" },
			{ field: "Contact_Surname", title: "Surname", type: "string" },
			{ field: "Contact_JobTitle", title: "Job Title", type: "string" },
			{ field: "Contact_Company", title: "Company", type: "string" },
			{ field: "DateGDPRAutomatedNotificationEMailSent", title: "Sent", type: "date", format: "{0:dd MMM yyyy}" },
			{ field: "DateGDPRDeletionRequestReceived", title: "Delete", type: "date", format: "{0:dd MMM yyyy}" },
			{ field: "GDPRDeletionRequestReason", title: "Reason", type: "string" },
			{ field: "DateSignedGDPRRestrictDataProcessing", title: "Restrict", type: "date", format: "{0:dd MMM yyyy}" },
			{ field: "DateAgreedToMarketingCommunications", title: "Marketing", type: "date", format: "{0:dd MMM yyyy}" },
			{ field: "DateGDPRDataPortabilityRequestReceived", title: "Portability", type: "date", format: "{0:dd MMM yyyy}" },
			{ field: "Contact_Comments", title: "Comments", type: "string", hidden: true }
		]

		// Generic
		var options = {
			DrillDownFunction: GDPRMonitor.OpenContact
		};
		TriSysWeb.Pages.Contacts.PopulateGrid( GDPRMonitor.Grid, "grdContacts", "Contacts", fnPopulationByFunction, columns, options );
	},

	ActionSearchInvocation: function ()
	{
		return GDPRMonitor.ActionInvocation(GDPRMonitor.Grid);
	},

	ActionInvocation: function(sGrid)
	{
		var sIDField="Contact_ContactId";

		var recordIds = TriSysSDK.Grid.GetSelectedMultipleRowsFromGrid( GDPRMonitor.Grid, sIDField );
		return recordIds;
	},

	OpenContact: function ( lContactId )
	{
		TriSysApex.FormsManager.OpenForm( 'Contact', lContactId );
	}
};

$(document).ready(function ()
{
	GDPRMonitor.Load();
});