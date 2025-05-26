var ctrlPlacement =
{
    ClientID: "ctrlPlacement-Client",
    RequirementID: "ctrlPlacement-Requirement",
    CandidateID: "ctrlPlacement-Candidate",
    StartDateID: 'ctrlPlacement-StartDate',
    EndDateID: 'ctrlPlacement-EndDate',
    SalaryID: 'ctrlPlacement-Salary',
    NoteHistoryID: 'ctrlPlacement-NoteHistory',
    FollowUpID: 'ctrlPlacement-FollowUp',

    CandidateList: null,

    Load: function ()
    {
        var defaults = { TaskType: "Placement", Attributes: true, Category: 'Placement' };
        TriSysActions.NoteHistory.Load(ctrlPlacement.NoteHistoryID, defaults);

        // Action specific
        TriSysSDK.CShowForm.datePicker(ctrlPlacement.StartDateID, function (dt) { ctrlPlacement.CalculateDurationWeeks(); });
        TriSysSDK.CShowForm.datePicker(ctrlPlacement.EndDateID, function (dt) { ctrlPlacement.CalculateDurationWeeks(); });

        var fSpinIncrement = 500;
        var sPeriod = "Annum";
        TriSysSDK.Controls.CurrencyAmountPeriod.PopulateCurrencyAmountPeriodWidget(ctrlPlacement.SalaryID, fSpinIncrement, sPeriod);

        // Follow-up defaults
        var dtFollowUp = TriSysActions.FollowUp.FollowUpDateTomorrow();

        defaults = { CreateFollowUp: true, StartDateTime: dtFollowUp, Attributes: true, Category: 'Placement' };
        TriSysActions.FollowUp.Load(ctrlPlacement.FollowUpID, defaults);

        // Show candidate and requirement details
        ctrlPlacement.PopulateActionData();        
    },

    // Get the contact details using a different action method - it works!
    PopulateActionData: function ()
    {
		// Save the round trip if more than one candidate is provided as this is too complicated
		// and time-consuming an operation for Apex customers
		if(TriSysActions.Invocation.SingletonContactListCheck("Placement", "candidate"))
			return;

        var CReadCVSendDetailsActionRequest = new TriSysActions.Invocation.ActionData();

        var payloadObject = {};

        payloadObject.URL = "Action/ReadCVSendDetails";

        payloadObject.OutboundDataPacket = CReadCVSendDetailsActionRequest;

        payloadObject.InboundDataFunction = function (CReadCVSendDetailsActionResponse)
        {
            TriSysApex.UI.HideWait();

            if (CReadCVSendDetailsActionResponse)
            {
                if (CReadCVSendDetailsActionResponse.Success)
                {
                    ctrlPlacement.DisplayClientContactDetails(CReadCVSendDetailsActionResponse.ClientContact);
                    ctrlPlacement.DisplayCandidateDetails(CReadCVSendDetailsActionResponse.CandidateContacts);
                    ctrlPlacement.DisplayRequirementDetails(CReadCVSendDetailsActionResponse.Requirement);
                    
                    if(!CReadCVSendDetailsActionResponse.CandidateContacts || CReadCVSendDetailsActionResponse.CandidateContacts.length > 1)
                    {
                        var sMessage = "Only one candidate can be placed using this action.";
                        var fnOK = function ()
                        {
                            // Close this dialogue prematurely
                            TriSysActions.Invocation.PostInvocationCompletion();
                            return true;
                        };
                        TriSysApex.UI.ShowMessage(sMessage, "Multiple Candidates", fnOK);
                        return;
                    }

                    if (CReadCVSendDetailsActionResponse.Requirement)
                    {
                        TriSysSDK.CShowForm.setDatePickerValue(ctrlPlacement.StartDateID, CReadCVSendDetailsActionResponse.Requirement.EarliestStartDate);

                        var sType = CReadCVSendDetailsActionResponse.Requirement.Type;
                        var sAttribute = "Placement: " + sType;
                        ctrlNoteHistory.SetAttributes(sAttribute);
                    }

                    ctrlFollowUp.SetAttributes("Placement: Check in");

                    // After loading the lookups, get all configuration for this action and apply the settings
                    TriSysActions.Persistence.Read(ctrlPlacement.ReadPersistedSettingsCallback);
                    return;
                }
                else
                    TriSysApex.UI.ShowMessage(CReadCVSendDetailsActionResponse.ErrorMessage);
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('ctrlPlacement.PopulateActionData: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Reading Contacts...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    DisplayClientContactDetails: function (contact)
    {
        var sContact = contact.FullName;
        if (contact.CompanyName)
            sContact += ", " + contact.CompanyName

        $('#' + ctrlPlacement.ClientID).html(sContact);
    },

    DisplayCandidateDetails: function (contactList)
    {
        ctrlPlacement.CandidateList = contactList;
        var sContact = '';
        if (contactList && contactList.length == 1)
        {
            // Single contact
            var contact = contactList[0];
            sContact = contact.FullName;

            if (contact.HomeAddressStreet)
                sContact += ", " + contact.HomeAddressStreet.replace(/\r\n/g, ", ");
            if (contact.HomeAddressCity)
                sContact += ", " + contact.HomeAddressCity;
        }
        else if (contactList)
        {
            for (var i = 0; i < contactList.length; i++)
            {
                var contact = contactList[i];
                if (sContact.length > 0)
                    sContact += ", ";
                sContact += contact.FullName;
            }
        }

        $('#' + ctrlPlacement.CandidateID).html(sContact);
    },

    DisplayRequirementDetails: function (requirement)
    {
        if (requirement)
        {
            $('#' + ctrlPlacement.RequirementID).html(requirement.Reference + ": " + requirement.JobTitle);
            if (requirement.Type == 'Permanent')
            {
                TriSysSDK.Controls.CurrencyAmountPeriod.SetCurrencyAmountPeriod(ctrlPlacement.SalaryID, requirement.Salary);
                $('#ctrlPlacement-EndDate-tr').hide();
                $('#ctrlPlacement-DurationWeeks-tr').hide();
            }
            else
                $('#ctrlPlacement-Salary-tr').hide();
        }
        else
        {
            $('#ctrlPlacement-Requirement-tr').hide();
        }
    },

    Configure: function ()
    {
        var mySettings = ctrlPlacement.GetSettings();
        if (!mySettings)
            return;

        // Save these settings
        TriSysActions.Persistence.Write(mySettings);
    },

    GetSettings: function ()
    {
        var mySettings =
        {
            NoteHistory: ctrlNoteHistory.Validation(),
            FollowUp: ctrlFollowUp.Validation()
        };

        return mySettings;
    },

    ReadPersistedSettingsCallback: function (mySettings)
    {
        TriSysActions.PersistedSettingsSafeguard.WaitUntilTaskControlsAreLoaded(true, true,
            function () {
                ctrlNoteHistory.Reload(mySettings.NoteHistory);
                ctrlFollowUp.Reload(mySettings.FollowUp);
            });
    },

    
    Finish: function ()
    {
        var mySettings = ctrlPlacement.GetSettings();
        if (!mySettings)
            return;

        var NoteHistoryData = ctrlNoteHistory.Validation();
        if (!NoteHistoryData)
            return;

        var FollowUpData = ctrlFollowUp.Validation();
        if (!FollowUpData)
            return;

        var sError = null;
        var dtStart = TriSysSDK.CShowForm.getDatePickerValue(ctrlPlacement.StartDateID);
        var dtEnd = TriSysSDK.CShowForm.getDatePickerValue(ctrlPlacement.EndDateID);
        var iDurationWeeks = $('#ctrlPlacement-DurationWeeks').val();
        var bOpenPlacement = TriSysSDK.CShowForm.CheckBoxValue('ctrlPlacement-OpenPlacement');
        var sSalary = TriSysSDK.Controls.CurrencyAmountPeriod.GetCurrencyAmountPeriod(ctrlPlacement.SalaryID);

        if (!dtStart)
            sError = "Please specify a start date.";
        else
        {
            var bVisible = $('#' + ctrlPlacement.EndDateID).is(':visible');
            if (bVisible)
            {
                if (!dtEnd)
                {
                    // Customer specific override
                    var bIgnoreMandatoryField = TriSysApex.LoginCredentials.isLoggedInToSpecificCompanyAsRecruiter("TQS Blu Limited");
                    if (!bIgnoreMandatoryField)
                        sError = "Please specify an end date.";
                }
            }
        }

        if (sError)
        {
            TriSysApex.UI.ShowMessage(sError);
            return null;
        }

        mySettings.StartDate = dtStart;
        mySettings.EndDate = dtEnd;
        mySettings.DurationWeeks = iDurationWeeks;
        mySettings.Salary = sSalary;
        mySettings.OpenPlacement = bOpenPlacement;


        // Ask the API to do the placement
        ctrlPlacement.SendActionDataToWebAPI(mySettings, NoteHistoryData, FollowUpData);
    },

    SendActionDataToWebAPI: function (mySettings, NoteHistoryData, FollowUpData)
    {
        var CPlacementActionRequest = {
            StartDate: mySettings.StartDate,
            EndDate: mySettings.EndDate,
            DurationWeeks: mySettings.DurationWeeks,
            Salary: mySettings.Salary,
            ActionData: new TriSysActions.Invocation.ActionData(),
            NoteHistory: NoteHistoryData,
            FollowUp: FollowUpData
        };

        var payloadObject = {};

        payloadObject.URL = "Action/Placement";

        payloadObject.OutboundDataPacket = CPlacementActionRequest;

        payloadObject.InboundDataFunction = function (CPlacementActionResponse)
        {
            TriSysApex.UI.HideWait();

            if (CPlacementActionResponse)
            {
                if (CPlacementActionResponse.Success)
                {
                    // Close this dialogue and refresh task grids
                    TriSysActions.Invocation.PostInvocationCompletion();

                    if (mySettings.OpenPlacement && CPlacementActionResponse.PlacementId > 0)
                    {
                        // Now open the placement record
                        TriSysApex.FormsManager.OpenForm("Placement", CPlacementActionResponse.PlacementId);
                    }

                    return;
                }
                else
                    TriSysApex.UI.ShowMessage(CPlacementActionResponse.ErrorMessage);
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('ctrlPlacement.SendActionDataToWebAPI: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Generating Placement...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    CalculateDurationWeeks: function ()
    {
        var sDurationWeeks = '';
        var dtStart = new moment(TriSysSDK.CShowForm.getDatePickerValue(ctrlPlacement.StartDateID));
        var dtEnd = new moment(TriSysSDK.CShowForm.getDatePickerValue(ctrlPlacement.EndDateID));

        var iWeeks = dtEnd.diff(dtStart, 'weeks');

        if (iWeeks >= 0)
            sDurationWeeks = iWeeks;

        $('#ctrlPlacement-DurationWeeks').val(sDurationWeeks);
    }
};

$(document).ready(function ()
{
    ctrlPlacement.Load();
});
