var ctrlContactReferenceTable =
{
    DivId: null,

    Load: function(sDivId)
    {
        // Nothing to do except store the DIV for population
        ctrlContactReferenceTable.DivId = sDivId;
    },

    LoadContactReferences: function (lContactId)
    {
        // Wipe contents from last load
        var div = $('#' + ctrlContactReferenceTable.DivId);
        div.empty();

        // Get the template contents directly from index.html
        var sTemplateHTML = TriSysApex.FormsManager.getControlTemplateHTML('ctrlContactReferenceTable.html');

        // Inject into div
        div.html(sTemplateHTML);

        // Our in-memory copy to allow easy edit
        ctrlContactReferenceTable._Data = null;

        if (lContactId <= 0)
            return;

        // Call Web API to get data
        ctrlContactReferenceTable.GetData(lContactId);
    },

    GetData: function (lContactId, div)
    {
        // Call web service silently to read references
        var CContactReferenceRequest = { ContactId: lContactId };

        var payloadObject = {};

        payloadObject.URL = "Contact/References";

        payloadObject.OutboundDataPacket = CContactReferenceRequest;

        payloadObject.InboundDataFunction = function (CContactReferenceResponse)
        {
            if (CContactReferenceResponse)
            {
                if (CContactReferenceResponse.Success)
                {
                    var references = CContactReferenceResponse.References;

                    // Our in-memory copy to allow easy edit
                    ctrlContactReferenceTable._Data = references;

                    if (references)
                    {
                        // Get the template row directly from index.html
                        var sRowTemplateHTML = TriSysApex.FormsManager.getControlTemplateHTML('ctrlContactReferenceRecord.html');

                        references.forEach(function (reference, i)
                        {
                            ctrlContactReferenceTable.LoadReference((i + 1), reference, sRowTemplateHTML);
                        });
                    }
                    return;
                }
                else
                {
                    TriSysApex.UI.errorAlert(CContactReferenceResponse.ErrorMessage);
                    return;
                }
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error) {
            TriSysApex.UI.errorAlert('ctrlContactReferenceTable.GetData: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    // Load the reference into the specified field indexes
    LoadReference: function (iIndex, referenceObject, sRowTemplateHTML)
    {
        var sRow = sRowTemplateHTML.replace(/{{ctrlContactReferenceRecordNumber}}/g, iIndex);
        sRow = sRow.replace("{{ctrlContactReferenceRecordId}}", referenceObject.Id);
        $('#' + ctrlContactReferenceTable.DivId + ' table > tbody:last-child').append(sRow);

        // File reference field to allow open and delete, but not find
        var defaults = { HideFindButton: true, HideDeleteButton: true, CallbackOnlyOnDelete: true };

        // If administrator, allow references to be deleted
        var bAllowDelete = false;
        var userCredentials = TriSysApex.LoginCredentials.UserCredentials();
        if (userCredentials && userCredentials.LoggedInUser) {
            var user = userCredentials.LoggedInUser;
            if (TriSysApex.Cache.UserGroupManager.SystemAdministrator(user.UserId))
                bAllowDelete = true;
        }
        if (bAllowDelete)
            defaults.HideDeleteButton = false;

        var fnSelectedFile = function (sOperation, sFieldID, sFilePath) {
            //TriSysApex.Toasters.Info(sOperation + ', sFieldID=' + sFieldID + ', ' + sFilePath);
            if (sOperation == 'delete')
                ctrlContactReferenceTable.Delete(sFieldID);
        };
        TriSysSDK.Controls.FileReference.Load('ContactReference_File' + iIndex, null, fnSelectedFile, defaults);

        TriSysSDK.Controls.FileReference.SetFile('ContactReference_File' + iIndex, referenceObject.File);

        if (referenceObject.From) {
            var sDate = moment(new Date(referenceObject.From)).format('DD MMM YYYY')
            if (sDate !== "01 Jan 0001")
                $('#ContactReference_From' + iIndex).text(sDate);
        }

        if (referenceObject.To) {
            var sDate = moment(new Date(referenceObject.To)).format('DD MMM YYYY')
            if (sDate !== "01 Jan 0001")
                $('#ContactReference_To' + iIndex).text(sDate);
        }

        $('#ContactReference_Notes' + iIndex).text(referenceObject.Notes);

        // 20 Oct 2020: edit button
        $('#ContactReference_EditButton' + iIndex).off().on('click', function ()
        {
            ctrlContactReferenceTable.EditReference(iIndex);
        });
    },

    // To allow us to identify references from edit click
    _Data: null,

    EditReference: function(iIndex)
    {
        var reference = ctrlContactReferenceTable._Data[iIndex - 1];
        if(reference)
            ctrlContactReferenceTable.AddNew(reference)
    },

    Delete: function (sFieldID)
    {
        var parts = sFieldID.split("ContactReference_File");
        var iRecordNumber = parseInt(parts[1]);
        var sTag = "trisys-record" + iRecordNumber + "-id";
        var sNotes = $('#ContactReference_Notes' + iRecordNumber).text();
        
        var iRecordId = 0;
        $('#' + ctrlContactReferenceTable.DivId + ' table').find('tr').each(function ()
        {
            var sAttr = $(this).attr(sTag);
            if (sAttr)
                iRecordId = parseInt(sAttr);
        });

        if(iRecordId > 0)
        {
            var sMessage = "Please confirm that you wish to remove this reference?" + 
                            "<br><br>" + sNotes;
            TriSysApex.UI.questionYesNo(sMessage, "Delete Reference", "Yes",
                function () {
                    setTimeout(function () { ctrlContactReferenceTable.DeleteReferenceConfirmed(iRecordId); }, 100);
                    return true;
                },
                "No");
        }
    },

    DeleteReferenceConfirmed: function(id)
    {
        var CDeleteReferenceRequest = { Id: id };

        var payloadObject = {};

        payloadObject.URL = "Contact/DeleteReference";

        payloadObject.OutboundDataPacket = CDeleteReferenceRequest;

        payloadObject.InboundDataFunction = function (CDeleteReferenceResponse) {
            TriSysApex.UI.HideWait();

            if (CDeleteReferenceResponse) {
                if (CDeleteReferenceResponse.Success) {
                    // After deletion, we must refresh the grid for the current contact
                    TriSysSDK.References.LoadContactReferences(TriSysApex.Pages.ContactForm.ContactId);
                    return;
                }
                else
                    TriSysApex.UI.ShowMessage(CDeleteReferenceResponse.ErrorMessage);
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error) {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('ctrlContactReferenceTable.DeleteReferenceConfirmed: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Deleting Reference...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);        
    },

    // Called from contact.js and above for edit (which was not part of the original specification)
    AddNew: function(reference)
    {
        var parametersObject = new TriSysApex.UI.ShowMessageParameters();
        parametersObject.Title = (reference ? "Edit" : "Add") + " Contact Reference";
        parametersObject.Image = "gi-pen";

        parametersObject.ContentURL = TriSysApex.Constants.UserControlFolder + "ctrlAddContactReference.html";

        parametersObject.OnLoadCallback = function () {
            ctrlContactReferenceTable.LoadReferenceRecord(reference);
        };

        parametersObject.ButtonRightText = "Cancel";
        parametersObject.ButtonRightVisible = true;

        parametersObject.ButtonLeftText = "Save";
        parametersObject.ButtonLeftVisible = true;
        parametersObject.ButtonLeftFunction = function () {
            ctrlContactReferenceTable.SaveReferenceRecord(reference);
        };

        TriSysApex.UI.PopupMessage(parametersObject);
    },

    LoadReferenceRecord: function (reference)
    {
        var sContactName = $('#Contact_Forenames').val() + ' ' + $('#Contact_Surname').val();
        $('#ctrlAddContactReference-Contact').val(sContactName);
        var options = {};
        TriSysSDK.Controls.ContactLookup.Load("ctrlAddContactReference-Referee", options);

        TriSysSDK.CShowForm.skillCombo('ctrlAddContactReference-Type', 'CandidateReferenceType', 'Work');
        TriSysSDK.CShowForm.skillCombo('ctrlAddContactReference-Method', 'CandidateReferenceMethod', 'Written');

        TriSysSDK.Controls.FileReference.Load('ctrlAddContactReference-Document');
        TriSysSDK.CShowForm.datePicker('ctrlAddContactReference-ValidFrom');
        TriSysSDK.CShowForm.datePicker('ctrlAddContactReference-ValidTo');
        TriSysSDK.CShowForm.datePicker('ctrlAddContactReference-Requested');
        TriSysSDK.CShowForm.datePicker('ctrlAddContactReference-Received');

        if(reference)
        {
            TriSysSDK.Controls.ContactLookup.WriteContactId('ctrlAddContactReference-Referee', reference.RefereeContactId, reference.RefereeName);
            TriSysSDK.Controls.FileReference.SetFile('ctrlAddContactReference-Document', reference.File);
            TriSysSDK.CShowForm.setDatePickerValue('ctrlAddContactReference-ValidFrom', reference.From);
            TriSysSDK.CShowForm.setDatePickerValue('ctrlAddContactReference-ValidTo', reference.To);
            TriSysSDK.CShowForm.setDatePickerValue('ctrlAddContactReference-Requested', reference.Requested);
            TriSysSDK.CShowForm.setDatePickerValue('ctrlAddContactReference-Received', reference.Received);
            TriSysSDK.CShowForm.SetTextInCombo('ctrlAddContactReference-Type', reference.Type);
            TriSysSDK.CShowForm.SetTextInCombo('ctrlAddContactReference-Method', reference.Method);
            $('#ctrlAddContactReference-Comments').val(reference.Comments);
        }
        else
        {
            // 15 Nov 2020
            if (TriSysApex.LoginCredentials.isLoggedInToSpecificCompanyAsRecruiter("Law Absolute"))
            {
                // Load the anonymous referee
                var lSelectedRefereeContactId = 2, sName = "Anonymous Referee";
                TriSysSDK.Controls.ContactLookup.WriteContactId('ctrlAddContactReference-Referee', lSelectedRefereeContactId, sName);                
            }
        }

        setTimeout(TriSysProUI.kendoUI_Overrides, 1000);
    },

    SaveReferenceRecord: function (reference)
    {
        var lSelectedRefereeContactId = TriSysSDK.Controls.ContactLookup.ReadContactId('ctrlAddContactReference-Referee');

        // This is the first mandatory field
        if (lSelectedRefereeContactId == 0) {
            TriSysApex.UI.ShowMessage("Please select a referee.");
            return;
        }

        // The 2nd mandatory field
        var sFilePath = TriSysSDK.Controls.FileReference.GetFile('ctrlAddContactReference-Document');
        if (!sFilePath)
        {
            var bReportError = true;

            // 15 Nov 2020
            if (TriSysApex.LoginCredentials.isLoggedInToSpecificCompanyAsRecruiter("Law Absolute")) 
                bReportError = false;

            if(bReportError)
            {
                TriSysApex.UI.ShowMessage("Please select a document.");
                return;
            }
        }

        var lContactId = TriSysApex.Pages.ContactForm.ContactId;
        var sType = TriSysSDK.CShowForm.GetTextFromCombo('ctrlAddContactReference-Type');
        var sMethod = TriSysSDK.CShowForm.GetTextFromCombo('ctrlAddContactReference-Method');

        var dtValidFrom = TriSysSDK.CShowForm.getDatePickerValue('ctrlAddContactReference-ValidFrom');
        var dtValidTo = TriSysSDK.CShowForm.getDatePickerValue('ctrlAddContactReference-ValidTo');
        var dtRequested = TriSysSDK.CShowForm.getDatePickerValue('ctrlAddContactReference-Requested');
        var dtReceived = TriSysSDK.CShowForm.getDatePickerValue('ctrlAddContactReference-Received');
        var sComments = $('#ctrlAddContactReference-Comments').val();

        // Assemble the data packet for transmission
        var CAddContactReferenceRequest = {
            ContactId: lContactId,
            RefereeId: lSelectedRefereeContactId,
            FilePath: sFilePath,
            Type: sType,
            Method: sMethod,
            ValidFrom: dtValidFrom,
            ValidTo: dtValidTo,
            Requested: dtRequested,
            Received: dtReceived,
            Comments: sComments
        };

        if (reference)
            CAddContactReferenceRequest.Id = reference.Id;

        // Send to web API
        ctrlContactReferenceTable.Write(CAddContactReferenceRequest);
    },

    Write: function (CAddContactReferenceRequest)
    {
        var payloadObject = {};

        payloadObject.URL = "Contact/AddReference";

        payloadObject.OutboundDataPacket = CAddContactReferenceRequest;

        payloadObject.InboundDataFunction = function (CAddContactReferenceResponse) {
            TriSysApex.UI.HideWait();

            if (CAddContactReferenceResponse) {
                if (CAddContactReferenceResponse.Success) {
                    // After adding, we must refresh the grid for the current contact
                    TriSysSDK.References.LoadContactReferences(CAddContactReferenceRequest.ContactId);

                    // And of course close this modal popup
                    TriSysApex.UI.CloseModalPopup();
                    return;
                }
                else
                    TriSysApex.UI.ShowMessage(CAddContactReferenceResponse.ErrorMessage);
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error) {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('ctrlContactReferenceTable.Write: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Adding Reference...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    // 12 Nov 2020: Allow a new contact to be created
    // This was not implemented as the customer (Law Absolute) who requested this no longer requires it.
    AddRefereeContact: function()
    {
        TriSysApex.UI.ShowMessage("Add Referee Contact TODO...");
    }

};  // ctrlContactReferenceTable