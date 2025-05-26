var ctrlPlacementTimesheetMerge =
{
    PlacementID: "ctrlPlacementTimesheetMerge-Placement",
    TemplatesID: 'ctrlPlacementTimesheetMerge-Template',
    EditTemplateButtonID: 'ctrlPlacementTimesheetMerge-EditTemplate',
    DeliveryID: 'ctrlPlacementTimesheetMerge-Delivery',
    SubjectID: 'ctrlPlacementTimesheetMerge-Subject',
    NoteHistoryID: 'ctrlPlacementTimesheetMerge-NoteHistory',
    FollowUpID: 'ctrlPlacementTimesheetMerge-FollowUp',

    Delivery_Outlook: 'Outlook E-Mail',
    Delivery_SMTP: 'SMTP E-Mail',
    Delivery_SMSText: 'SMS Text',

    ContactList: null,
    KeyFieldId: null,    

    Data:           // ctrlPlacementTimesheetMerge.Data
    {
    },

    Load: function ()
    {
        var sMailMerge = "Placement Timesheet Merge";
        var sMailMergeFolder = sMailMerge + "/";
        TriSysActions.MailMerge.PopulateTemplates(sMailMerge, TriSysActions.MailMerge.MasterTemplateFolder + sMailMergeFolder,
                                    ctrlPlacementTimesheetMerge.TemplatesID, sMailMerge, ctrlPlacementTimesheetMerge.EditTemplateButtonID);

        ctrlPlacementTimesheetMerge.PopulateDeliveryCombo();

        var defaults = { TaskType: "E-Mail" };
        TriSysActions.NoteHistory.Load(ctrlPlacementTimesheetMerge.NoteHistoryID, defaults);

        // Follow-up defaults
        var dtFollowUp = TriSysActions.FollowUp.FollowUpDateTomorrow();

        defaults = { CreateFollowUp: true, StartDateTime: dtFollowUp };
        TriSysActions.FollowUp.Load(ctrlPlacementTimesheetMerge.FollowUpID, defaults);

        // Get the underlying contact/company details
        ctrlPlacementTimesheetMerge.PopulateActionData();

        // Get the default settings for this action
        //TriSysActions.Persistence.Read(ctrlPlacementTimesheetMerge.ReadPersistedSettingsCallback);
		// See PopulateActionData
    },

    // The settings for this action are:
    // {    
    //      Default: sTemplate,
    //      Templates:
    //      [
    //          { Template: "Top 5 Jobs",    Attachments: "a.doc", ...},
    //          { Template: "Top 5 Clients", Attachments: "b.doc", ...}  etc..
    //      ]
    // }
    PersistedSettings: null,

    ReadPersistedSettingsCallback: function(mySettings)
    {
        // Save in memory
        ctrlPlacementTimesheetMerge.PersistedSettings = mySettings;

        if (mySettings)
        {
            // Apply default
            var sDefaultTemplate = mySettings.Default;
            if(sDefaultTemplate)
                ctrlPlacementTimesheetMerge.ApplyPersistedSetting(sDefaultTemplate);
        }
    },

    GetSettingsIndexForTemplate: function(sTemplate)
    {
        if(ctrlPlacementTimesheetMerge.PersistedSettings)
        {
            for (var i = 0; i < ctrlPlacementTimesheetMerge.PersistedSettings.Templates.length; i++)
            {
                var settings = ctrlPlacementTimesheetMerge.PersistedSettings.Templates[i];
                if (settings.Template == sTemplate)
                    return i;
            }
        }

        return -1;
    },
    
    GetSettingsForTemplate: function (sTemplate)
    {
        var iIndex = ctrlPlacementTimesheetMerge.GetSettingsIndexForTemplate(sTemplate);

        if (iIndex >= 0)
            return ctrlPlacementTimesheetMerge.PersistedSettings.Templates[iIndex];
    },

    // Called when the user changes the template or when we load the action
    ApplyPersistedSetting: function(sTemplate)
    {
        var mySettings = ctrlPlacementTimesheetMerge.GetSettingsForTemplate(sTemplate);
        if (mySettings)
        {
            TriSysSDK.CShowForm.SetTextInCombo(ctrlPlacementTimesheetMerge.TemplatesID, mySettings.Template);

            TriSysSDK.CShowForm.SetTextInCombo(ctrlPlacementTimesheetMerge.DeliveryID, mySettings.Delivery);
            ctrlPlacementTimesheetMerge.DeliveryComboClick(mySettings.Delivery);
            $('#' + ctrlPlacementTimesheetMerge.SubjectID).val(mySettings.Subject);

            TriSysActions.PersistedSettingsSafeguard.WaitUntilTaskControlsAreLoaded(true, true,
                function () {
                    ctrlNoteHistory.Reload(mySettings.NoteHistory);
                    ctrlFollowUp.Reload(mySettings.FollowUp);
                });
        }
    },

    PopulateDeliveryCombo: function()
    {
        var delivery = [
                    { value: 0, text: ctrlPlacementTimesheetMerge.Delivery_Outlook },
                    { value: 1, text: ctrlPlacementTimesheetMerge.Delivery_SMTP }
        ];
        TriSysSDK.CShowForm.populateComboFromDataSource(ctrlPlacementTimesheetMerge.DeliveryID, delivery, 1);
    },

    DeliveryComboClick: function(sDelivery)
    {
        switch(sDelivery)
        {
            case ctrlPlacementTimesheetMerge.Delivery_Outlook:
            case ctrlPlacementTimesheetMerge.Delivery_SMTP:
                $('#' + ctrlPlacementTimesheetMerge.SubjectID + '-tr').show();
                break;
        }
    },

    // Get the placement details
    PopulateActionData: function ()
    {
        var CReadPlacementTimesheetMergeDetailsActionRequest = new TriSysActions.Invocation.ActionData();

        var payloadObject = {};

        payloadObject.URL = "Action/ReadPlacementTimesheetMergeDetails";

        payloadObject.OutboundDataPacket = CReadPlacementTimesheetMergeDetailsActionRequest;

        payloadObject.InboundDataFunction = function (CReadPlacementTimesheetMergeDetailsActionResponse)
        {
            TriSysApex.UI.HideWait();

            if (CReadPlacementTimesheetMergeDetailsActionResponse)
            {
                if (CReadPlacementTimesheetMergeDetailsActionResponse.Success)
                {
                    TriSysActions.PlacementTimesheetMerge.DisplayPlacementDetails(CReadPlacementTimesheetMergeDetailsActionResponse.Placements, ctrlPlacementTimesheetMerge.PlacementID);

					// Get the default settings for this action
					TriSysActions.Persistence.Read(ctrlPlacementTimesheetMerge.ReadPersistedSettingsCallback);
                    return;
                }
                else
                    TriSysApex.UI.ShowMessage(CReadPlacementTimesheetMergeDetailsActionResponse.ErrorMessage);
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('ctrlPlacementTimesheetMerge.PopulateActionData: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Reading Placements...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    MailMergeData: function ()
    {
		// In some cases, customers have requested that they can run actions against reports (e.g. TQS March 2019).
		// This may result in a list of records, each with different merge data in the invocation grid
		// e.g. each placement has a different week ending in the grid
		// We therefore have to read the selected records in the source grid and pass all this into the action
		// FFS: Why do we have to create additional complexity?
        // £££: Because the customer paid us in advance to do this
        var lstPlacementRecords = reportsForm.ActionInvocationSelectedGridRowValues();  //"RequirementRef");
		if(lstPlacementRecords)
		{		   
			// Need to convert it into a JSON string to pass over the wire to the Web API
		    var placementRecordObject = { List: lstPlacementRecords };
			var sPlacementRecords = JSON.stringify(placementRecordObject);

			var actionSpecificData = {
				ActionName: "PlacementTimesheetMerge",
				ActionDisplayName: "Placement Timesheet Merge",
				Values: [
                
					{
						FieldName: "PlacementGridList",
						FieldDisplayName: "Placement Grid List",
						Value: sPlacementRecords,
						ListOfFields: true
					}
				]
			};

			return actionSpecificData;
		}
    },

    Finish: function ()
    {
        var mySettings = ctrlPlacementTimesheetMerge.GetSettingsForSelectedTemplate();
        if (!mySettings)
            return;

        var NoteHistoryData = ctrlNoteHistory.Validation();
        if (!NoteHistoryData)
            return;

        var FollowUpData = ctrlFollowUp.Validation();
        if (!FollowUpData)
            return;

        // Ask the API to do the mail merge for us, launch the appropriate e-mail client, and do the action also
        ctrlPlacementTimesheetMerge.SendActionDataToWebAPI(mySettings, NoteHistoryData, FollowUpData);
    },

    GetSettingsForSelectedTemplate: function()
    {
        // Validation
        var sError = null;
        var sTemplate = TriSysActions.MailMerge.GetTemplateFromCombo(ctrlPlacementTimesheetMerge.TemplatesID);
        var sDelivery = TriSysSDK.CShowForm.GetTextFromCombo(ctrlPlacementTimesheetMerge.DeliveryID);
        var sSubject = $('#' + ctrlPlacementTimesheetMerge.SubjectID).val();

        if (!sTemplate)
            sError = "You must choose an e-mail template.";
        else if (!sSubject)
            sError = "You must specify an e-mail subject heading.";

        if (sError)
        {
            TriSysApex.UI.ShowMessage(sError);
            return null;
        }

        // Prepare the current action data/settings for this configuration
        var mySettings =
        {
            Template: sTemplate,
            Delivery: sDelivery,
            Subject: sSubject,

            NoteHistory: ctrlNoteHistory.Validation(),  
            FollowUp: ctrlFollowUp.Validation()
		};

        return mySettings;
    },

    GetSettings: function()
    {        
        var mySettings = ctrlPlacementTimesheetMerge.GetSettingsForSelectedTemplate();
        if (!mySettings)
            return;         // All bets are off

        if (!ctrlPlacementTimesheetMerge.PersistedSettings)
            ctrlPlacementTimesheetMerge.PersistedSettings = { Default: mySettings.Template, Templates: [] };

        // We are part of an array, so replace the existing item for this template and return all settings
        var iIndex = ctrlPlacementTimesheetMerge.GetSettingsIndexForTemplate(mySettings.Template);
        if (iIndex >= 0)
            ctrlPlacementTimesheetMerge.PersistedSettings.Templates.splice(iIndex, 1);

        ctrlPlacementTimesheetMerge.PersistedSettings.Templates.push(mySettings);

        // By default, last saved is always the default
        ctrlPlacementTimesheetMerge.PersistedSettings.Default = mySettings.Template;

        // Return all settngs in memory
        return ctrlPlacementTimesheetMerge.PersistedSettings;
    },

    Configure: function ()
    {
        var mySettings = ctrlPlacementTimesheetMerge.GetSettings();
        if (!mySettings)
            return;

        // Save these settings
        TriSysActions.Persistence.Write(mySettings);
    },

    SendActionDataToWebAPI: function (mySettings, NoteHistoryData, FollowUpData)
    {
        var CPlacementTimesheetMergeActionRequest = {
            Settings: mySettings,
            ActionData: new TriSysActions.Invocation.ActionData(),
            NoteHistory: NoteHistoryData,
            FollowUp: FollowUpData
        };

        var payloadObject = {};

        payloadObject.URL = "Action/PlacementTimesheetMerge";

        payloadObject.OutboundDataPacket = CPlacementTimesheetMergeActionRequest;

        // This is a custom report+action for TQS which we will allow to run for longer
        payloadObject.TimeoutMilliseconds = 60 * 60 * 1000;           // Wait 1 hour for report to run

        payloadObject.InboundDataFunction = function (CPlacementTimesheetMergeActionResponse)
        {
            TriSysApex.UI.HideWait();

            if (CPlacementTimesheetMergeActionResponse)
            {
                if (CPlacementTimesheetMergeActionResponse.Success)
                {
                    // Close this dialogue and refresh task grids
                    TriSysActions.Invocation.PostInvocationCompletion();

                    if (CPlacementTimesheetMergeActionResponse.URL)
                    {
                        // Now launch multiple URL's as they are .eml files which should open Outlook
                        for (var i = 0; i < CPlacementTimesheetMergeActionResponse.URL.length; i++)
                        {
                            var sURL = CPlacementTimesheetMergeActionResponse.URL[i];
                            TriSysApex.ModalDialogue.DocumentViewer.DownloadAndOpen("e-mail", sURL);
                        }
                    }
                    else if (CPlacementTimesheetMergeActionResponse.MailMessages)
                    {
                        // There are one or more e-mail messages which are to be manually sent.
                        // Enumerate through each one and show the e-mail dialogue for confirmation before send

                        if (CPlacementTimesheetMergeActionResponse.MailMessages.length > 0)
						{
							var options = { SuppressNoteHistory: true };
                            TriSysActions.EMail.SendDialogue(CPlacementTimesheetMergeActionResponse.MailMessages, options);
						}
                    }

                    return;
                }
                else
                    TriSysApex.UI.ShowMessage(CPlacementTimesheetMergeActionResponse.ErrorMessage);
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('ctrlPlacementTimesheetMerge.SendActionDataToWebAPI: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Timesheet Merging...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    }
};

$(document).ready(function ()
{
    ctrlPlacementTimesheetMerge.Load();
});
