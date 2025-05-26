var ctrlPlacementDocumentation =
{
    ClientID: "ctrlPlacementDocumentation-Client",
    PlacementID: "ctrlPlacementDocumentation-Placement",
    CandidateID: "ctrlPlacementDocumentation-Candidate",
    DocumentTypeID: "ctrlPlacementDocumentation-DocumentType",
    EMailTemplatesID: 'ctrlPlacementDocumentation-EMailTemplate',
    EditEMailTemplateButtonID: 'ctrlPlacementDocumentation-EditEMailTemplate',
    ContractTemplatesID: 'ctrlPlacementDocumentation-Contract',
    EditContractTemplateButtonID: 'ctrlPlacementDocumentation-EditContract',
    NoteHistoryID: 'ctrlPlacementDocumentation-NoteHistory',
    FollowUpID: 'ctrlPlacementDocumentation-FollowUp',
    InsertHeaderAndFooterID: 'ctrlPlacementDocumentation-InsertHeaderAndFooter',
    MergeContractToPDFID: 'ctrlPlacementDocumentation-MergeToPDF',
    AttachContracttoEMailID: 'ctrlPlacementDocumentation-AttachContract',
    SubjectID: 'ctrlPlacementDocumentation-Subject',
    AttachmentsID: 'ctrlPlacementDocumentation-Attachments',
    ManageAttachmentsButtonID: 'ctrlPlacementDocumentation-ManageAttachmentLibrary',

    Load: function ()
    {
        TriSysSDK.CShowForm.skillCombo(ctrlPlacementDocumentation.DocumentTypeID, 'Placement Document', 'Client Contract');

        var sPlacementDocumentation = "Placement Documentation";
        var sPlacementDocumentationFolder = TriSysActions.MailMerge.MasterTemplateFolder + sPlacementDocumentation + "/";

        TriSysActions.MailMerge.PopulateTemplates("Placement Contract", sPlacementDocumentationFolder,
                                    ctrlPlacementDocumentation.ContractTemplatesID, sPlacementDocumentation, ctrlPlacementDocumentation.EditContractTemplateButtonID);

        TriSysActions.MailMerge.PopulateTemplates("E-Mail", sPlacementDocumentationFolder,
                                    ctrlPlacementDocumentation.EMailTemplatesID, sPlacementDocumentation, ctrlPlacementDocumentation.EditEMailTemplateButtonID);

        TriSysActions.MailMerge.PopulateAttachments(ctrlPlacementDocumentation.AttachmentsID, ctrlPlacementDocumentation.ManageAttachmentsButtonID);

        var defaults = { TaskType: "Placement Document", Attributes: true, Category: 'Placement Document' };
        TriSysActions.NoteHistory.Load(ctrlPlacementDocumentation.NoteHistoryID, defaults);

        // Follow-up defaults
        var dtFollowUp = TriSysActions.FollowUp.FollowUpDateTomorrow();

        defaults = { CreateFollowUp: true, StartDateTime: dtFollowUp, Attributes: true, Category: 'Placement Document' };
        TriSysActions.FollowUp.Load(ctrlPlacementDocumentation.FollowUpID, defaults);

        ctrlPlacementDocumentation.PopulateActionData();
    },

    // Get the candidate details, client and requirement
    PopulateActionData: function ()
    {
        var CReadPlacementDocumentationDetailsActionRequest = new TriSysActions.Invocation.ActionData();

        var payloadObject = {};

        payloadObject.URL = "Action/ReadPlacementDocumentationDetails";

        payloadObject.OutboundDataPacket = CReadPlacementDocumentationDetailsActionRequest;

        payloadObject.InboundDataFunction = function (CPlacementResponse)
        {
            TriSysApex.UI.HideWait();

            if (CPlacementResponse)
            {
                if (CPlacementResponse.Success)
                {
                    ctrlPlacementDocumentation.DisplayPlacementDetails(CPlacementResponse);

                    // After loading the lookups, get all configuration for this action and apply the settings
                    TriSysActions.Persistence.Read(ctrlPlacementDocumentation.ReadPersistedSettingsCallback);
                    return;
                }
                else
                    TriSysApex.UI.ShowMessage(CPlacementResponse.ErrorMessage);
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('ctrlPlacementDocumentation.PopulateActionData: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Reading Placement...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    DisplayPlacementDetails: function (placement)
    {
        if (placement)
        {
            $('#' + ctrlPlacementDocumentation.PlacementID).html(placement.Reference + ": " + placement.JobTitle);
            $('#' + ctrlPlacementDocumentation.ClientID).html(placement.ClientName + ", " + placement.CompanyName);
            $('#' + ctrlPlacementDocumentation.CandidateID).html(placement.CandidateName);
        }
    },

    MailMergeData: function ()
    {
        var sDocumentType = TriSysSDK.CShowForm.GetTextFromCombo(ctrlPlacementDocumentation.DocumentTypeID);

        var actionSpecificData = {
            ActionName: "PlacementDocumentation",
            ActionDisplayName: "Placement Documentation",
            Values: [
                {
                    FieldName: "DocumentType",
                    FieldDisplayName: "Document Type",
                    Value: sDocumentType
                }
            ]
        };

        return actionSpecificData;
    },

    Finish: function ()
    {
        var mySettings = ctrlPlacementDocumentation.GetSettingsForSelectedDocumentType();
        if (!mySettings)
            return;

        var NoteHistoryData = ctrlNoteHistory.Validation();
        if (!NoteHistoryData)
            return;

        var FollowUpData = ctrlFollowUp.Validation();
        if (!FollowUpData)
            return;

        // Ask the API to do the mail merge for us, launch the appropriate e-mail client, and do the action also
        ctrlPlacementDocumentation.SendActionDataToWebAPI(mySettings, NoteHistoryData, FollowUpData);
    },

    SendActionDataToWebAPI: function (mySettings, NoteHistoryData, FollowUpData)
    {
        var CPlacementDocumentationActionRequest = mySettings;

        CPlacementDocumentationActionRequest.ActionData = new TriSysActions.Invocation.ActionData();
        CPlacementDocumentationActionRequest.NoteHistory = NoteHistoryData;
        CPlacementDocumentationActionRequest.FollowUp = FollowUpData;

        var payloadObject = {};

        payloadObject.URL = "Action/PlacementDocumentation";

        payloadObject.OutboundDataPacket = CPlacementDocumentationActionRequest;

        payloadObject.InboundDataFunction = function (CPlacementDocumentationActionResponse)
        {
            TriSysApex.UI.HideWait();

            if (CPlacementDocumentationActionResponse)
            {
                if (CPlacementDocumentationActionResponse.Success)
                {
                    // Close this dialogue and refresh task grids
                    TriSysActions.Invocation.PostInvocationCompletion();

                    if (CPlacementDocumentationActionResponse.URL)
                    {
                        // Now launch multiple URL's as they are .eml files which should open Outlook
                        for (var i = 0; i < CPlacementDocumentationActionResponse.URL.length; i++)
                        {
                            var sURL = CPlacementDocumentationActionResponse.URL[i];
                            TriSysApex.ModalDialogue.DocumentViewer.DownloadAndOpen("e-mail", sURL);
                        }
                    }

                    return;
                }
                else
                    TriSysApex.UI.ShowMessage(CPlacementDocumentationActionResponse.ErrorMessage);
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('ctrlPlacementDocumentation.SendActionDataToWebAPI: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Generating Contract...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    // The settings for this action are:
    // {    
    //      Default: sDocumentType,
    //      DocumentTypes:
    //      [
    //          { Type: "Client Contract", Letter: "Client Contract Letter", Subject: "How now brown cow", ...},
    //          { Type: "Candidate Contract", Letter: "Candidate Contract Letter", Subject: "Aal reet pet", ...}  etc..
    //      ]
    // }
    PersistedSettings: null,

    ReadPersistedSettingsCallback: function (mySettings)
    {
        // Save in memory
        ctrlPlacementDocumentation.PersistedSettings = mySettings;

        // We want the settings for the selected document type
        var sDocumentType = TriSysSDK.CShowForm.GetTextFromCombo(ctrlPlacementDocumentation.DocumentTypeID);
        ctrlPlacementDocumentation.ApplyPersistedSetting(sDocumentType);
    },

    GetSettingsIndexForDocumentType: function (sDocumentType)
    {
        if (ctrlPlacementDocumentation.PersistedSettings && ctrlPlacementDocumentation.PersistedSettings.DocumentTypes)
        {
            for (var i = 0; i < ctrlPlacementDocumentation.PersistedSettings.DocumentTypes.length; i++)
            {
                var settings = ctrlPlacementDocumentation.PersistedSettings.DocumentTypes[i];
                if (settings.DocumentType == sDocumentType)
                    return i;
            }
        }

        return -1;
    },

    GetSettingsForDocumentType: function (sDocumentType)
    {
        var iIndex = ctrlPlacementDocumentation.GetSettingsIndexForDocumentType(sDocumentType);

        if (iIndex >= 0)
            return ctrlPlacementDocumentation.PersistedSettings.DocumentTypes[iIndex];
    },
    
    // Called when the user changes the document type or when we load the action
    ApplyPersistedSetting: function (sDocumentType)
    {
        var mySettings = ctrlPlacementDocumentation.GetSettingsForDocumentType(sDocumentType);
        if (mySettings)
        {
            TriSysSDK.CShowForm.SetTextInCombo(ctrlPlacementDocumentation.ContractTemplatesID, mySettings.ContractTemplate);
            TriSysSDK.CShowForm.SetTextInCombo(ctrlPlacementDocumentation.EMailTemplatesID, mySettings.EMailTemplate);
            TriSysSDK.CShowForm.SetCheckBoxValue(ctrlPlacementDocumentation.InsertHeaderAndFooterID, mySettings.InsertHeaderAndFooter);
            TriSysSDK.CShowForm.SetCheckBoxValue(ctrlPlacementDocumentation.MergeContractToPDFID, mySettings.MergeContractToPDF);
            TriSysSDK.CShowForm.SetCheckBoxValue(ctrlPlacementDocumentation.AttachContracttoEMailID, mySettings.AttachContractToEMail);
            $('#' + ctrlPlacementDocumentation.SubjectID).val(mySettings.Subject);
            TriSysSDK.CShowForm.SetSkillsInList(ctrlPlacementDocumentation.AttachmentsID, mySettings.Attachments);

            // New where the entire set of task properties is set
            TriSysActions.PersistedSettingsSafeguard.WaitUntilTaskControlsAreLoaded(true, true,
            function () {
                ctrlNoteHistory.Reload(mySettings.NoteHistory);
                ctrlFollowUp.Reload(mySettings.FollowUp);
            });
        }
    },

    GetSettings: function ()
    {
        var mySettings = ctrlPlacementDocumentation.GetSettingsForSelectedDocumentType();
        if (!mySettings)
            return;         // All bets are off

        if (!ctrlPlacementDocumentation.PersistedSettings)
            ctrlPlacementDocumentation.PersistedSettings = { Default: mySettings.DocumentType, DocumentTypes: [] };

        // We are part of an array, so replace the existing item for this document type and return all settings
        var iIndex = ctrlPlacementDocumentation.GetSettingsIndexForDocumentType(mySettings.DocumentType);
        if (iIndex >= 0)
            ctrlPlacementDocumentation.PersistedSettings.DocumentTypes.splice(iIndex, 1);

        ctrlPlacementDocumentation.PersistedSettings.DocumentTypes.push(mySettings);

        // By default, last saved is always the default
        ctrlPlacementDocumentation.PersistedSettings.Default = mySettings.DocumentType;

        // Return all settings in memory
        return ctrlPlacementDocumentation.PersistedSettings;
    },

    GetSettingsForSelectedDocumentType: function ()
    {
        // Validation
        var sError = null;
        var sDocumentType = TriSysSDK.CShowForm.GetTextFromCombo(ctrlPlacementDocumentation.DocumentTypeID);
        var sContractTemplate = TriSysActions.MailMerge.GetTemplateFromCombo(ctrlPlacementDocumentation.ContractTemplatesID);
        var sEMailTemplate = TriSysActions.MailMerge.GetTemplateFromCombo(ctrlPlacementDocumentation.EMailTemplatesID);
        var bInsertHeaderAndFooter = TriSysSDK.CShowForm.CheckBoxValue(ctrlPlacementDocumentation.InsertHeaderAndFooterID);
        var bMergeContractToPDF = TriSysSDK.CShowForm.CheckBoxValue(ctrlPlacementDocumentation.MergeContractToPDFID);
        var bAttachContractToEMail = TriSysSDK.CShowForm.CheckBoxValue(ctrlPlacementDocumentation.AttachContracttoEMailID);
        var sSubject = $('#' + ctrlPlacementDocumentation.SubjectID).val();
        var sAttachments = TriSysSDK.CShowForm.GetSelectedSkillsFromList(ctrlPlacementDocumentation.AttachmentsID);

        if (sError)
        {
            TriSysApex.UI.ShowMessage(sError);
            return null;
        }

        var mySettings =
        {
            DocumentType: sDocumentType,
            ContractTemplate: sContractTemplate,
            EMailTemplate: sEMailTemplate,
            InsertHeaderAndFooter: bInsertHeaderAndFooter,
            MergeContractToPDF: bMergeContractToPDF,
            AttachContractToEMail: bAttachContractToEMail,
            Subject: sSubject,
            Attachments: sAttachments,
            NoteHistory: ctrlNoteHistory.Validation(),          // New - the full task related objects are persisted
            FollowUp: ctrlFollowUp.Validation()
        };

        return mySettings;
    },

    Configure: function ()
    {
        var mySettings = ctrlPlacementDocumentation.GetSettings();
        if (!mySettings)
            return;

        // Save these settings
        TriSysActions.Persistence.Write(mySettings);
    }
};

$(document).ready(function ()
{
    ctrlPlacementDocumentation.Load();
});
