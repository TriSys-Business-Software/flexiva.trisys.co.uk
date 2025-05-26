var ctrlSubscribe =
{
    Load: function()
    {
        TriSysSDK.Titles.LoadCombo("txtSubscribeTitle");
        TriSysWebJobs.CandidateRegistration.LoadCountryLookup("txtSubscribeCountry");

        // Load existing trial contact details ready for confirmation
        ctrlSubscribe.LoadTriSysCRMContactDetails();
    },

    LoadTriSysCRMContactDetails: function()
    {
        var payloadObject = {};

        payloadObject.URL = "Customer/ReadTrialContactDetails";

        payloadObject.InboundDataFunction = function (CReadTrialContactDetailsResponse)
        {
            TriSysApex.UI.HideWait();

            if (CReadTrialContactDetailsResponse)
            {
                if (CReadTrialContactDetailsResponse.Success)
                {
                    var contact = CReadTrialContactDetailsResponse.Contact;

                    // Display these details now
                    TriSysSDK.CShowForm.SetTextInCombo('txtSubscribeTitle', contact.Title);
                    $('#txtSubscribeForenames').val(contact.Forenames);
                    $('#txtSubscribeSurname').val(contact.Surname);
                    $('#txtSubscribeEMail').val(contact.WorkEMail);
                    $('#txtSubscribeCompany').val(contact.CompanyName);
                    $('#txtSubscribeJobTitle').val(contact.JobTitle);
                    $('#txtSubscribeStreet').val(contact.CompanyAddressStreet);
                    $('#txtSubscribeCity').val(contact.CompanyAddressCity);
                    $('#txtSubscribeCounty').val(contact.CompanyAddressCounty);
                    $('#txtSubscribePostCode').val(contact.CompanyAddressPostCode);
                    $('#txtSubscribeCountry').val(contact.CompanyAddressCountry);
                    $('#txtSubscribeWorkTelNo').val(contact.WorkTelNo);
                    $('#txtSubscribeWorkMobileTelNo').val(contact.WorkMobileTelNo);
                }
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('ctrlSubscribe.LoadTriSysCRMContactDetails: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Reading Contact Details...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    ShowTermsAndConditions: function()
    {
        TriSysApex.ModalDialogue.TermsAndConditions.Show();
    },

    PostCodelookup: function ()
    {
        var sPrefix = "txtSubscribe";
        TriSysSDK.PostCode.Lookup(sPrefix + "PostCode", sPrefix + "Street",
                                    sPrefix + "City", sPrefix + "County", sPrefix + "Country");
    },

    SubscribeNow: function()
    {
        // Validation #1 - mandatory fields
        var contact = {};
        contact.Title = TriSysSDK.CShowForm.GetTextFromCombo('txtSubscribeTitle');
        contact.Forenames = $('#txtSubscribeForenames').val();
        contact.Surname = $('#txtSubscribeSurname').val();
        contact.WorkEMail = $('#txtSubscribeEMail').val();
        contact.CompanyName = $('#txtSubscribeCompany').val();
        contact.JobTitle = $('#txtSubscribeJobTitle').val();
        contact.CompanyAddressStreet = $('#txtSubscribeStreet').val();
        contact.CompanyAddressCity = $('#txtSubscribeCity').val();
        contact.CompanyAddressCounty = $('#txtSubscribeCounty').val();
        contact.CompanyAddressPostCode = $('#txtSubscribePostCode').val();
        contact.CompanyAddressCountry = $('#txtSubscribeCountry').val();
        contact.WorkTelNo = $('#txtSubscribeWorkTelNo').val();
        contact.WorkMobileTelNo = $('#txtSubscribeWorkMobileTelNo').val();
        var bAgree = TriSysApex.UI.CheckBoxFieldValueToBoolean('chkSubscribeAgreeToTerms');

        // Strip out unwanted characters as this causes provisioning problems seemingly!
        if (contact.CompanyName)
            contact.CompanyName = contact.CompanyName.replace(/,/g, '');

        var sError = '';

        if (!contact.Forenames || !contact.Surname)
            sError += "Please enter your full name." + "<br />";

        if (!contact.JobTitle)
            sError += "Please enter your job title." + "<br />";

        if (!TriSysApex.LoginCredentials.validateEmail(contact.WorkEMail))
            sError += "Please enter your valid e-mail address." + "<br />";

        if (!contact.WorkTelNo)
            sError += "Please enter your work telephone number." + "<br />";

        if (!contact.CompanyName)
            sError += "Please enter your company name." + "<br />";

        if (!contact.CompanyAddressStreet || !contact.CompanyAddressCity || !contact.CompanyAddressPostCode)
            sError += "Please enter your company address." + "<br />";

        if (!bAgree)
            sError += "Please agree to our terms and conditions." + "<br />";


        if (sError != '')
        {
            TriSysApex.UI.ShowMessage(sError, TriSysApex.Copyright.ShortProductName + " Subscription");
            return false;
        }

        // Begin the provisioning process after confirmation
        ctrlSubscribe.QuestionConfirmationOfProvisioning(contact);

        // Do not allow caller to close dialogue until we confirm provisioning
        return false;    
    },

    QuestionConfirmationOfProvisioning: function (contact)
    {
        var fnCommence = function ()
        {
            // Close the provisioning dialogue
            TriSysApex.UI.CloseModalPopup();

            ctrlSubscribe.StartProvisioning(contact);
            return true;
        };

        // Have to delay display to allow this dialogue to close
        setTimeout(function ()
        {
            var sMessage = "Are you sure that you wish to subscribe and commence the provisioning of your dedicated recruitment database?";
            TriSysApex.UI.questionYesNo(sMessage, TriSysApex.Copyright.ShortProductName + " Subscription Confirmation", "Yes", fnCommence, "No");

        }, 100);
    },

    StartProvisioning: function (contact)
    {
        var fnCompletedProvisioningRequest = function ()
        {
            // Hide the subscribe button to prevent the user doing this again
            TriSysApex.Trial.SubscribeButtonVisible(false);

            // Display a message to the user
            var sMessage = "Thank you for subscribing to " + TriSysApex.Copyright.ShortProductName + "." + "<br />" +
                        "Our provisioning system is now preparing your cloud recruitment service." + "<br />" +
                        "You will receive an automated e-mail in a few minutes with full instructions about connecting from your computer or mobile device.";
            TriSysApex.UI.ShowMessage(sMessage, TriSysApex.Copyright.ShortProductName + " Provisioning");
        };

        ctrlSubscribe.CallProvisioningWebAPI(contact, fnCompletedProvisioningRequest);
    },

    CallProvisioningWebAPI: function(contact, fnComplete)
    {
        var CSubscriptionRequest = {
            Apex: true,
            Contact: contact
        };

        var payloadObject = {};

        payloadObject.URL = "Customer/SubscriptionRequest";

        payloadObject.OutboundDataPacket = CSubscriptionRequest;

        payloadObject.InboundDataFunction = function (CSubscriptionResponse)
        {
            TriSysApex.UI.HideWait();

            if (CSubscriptionResponse)
            {
                if (CSubscriptionResponse.Success)
                {
                    fnComplete();
                    return;
                }
                else
                {
                    // We may fail on the server back-end based upon numerous business rules.
                    TriSysApex.UI.errorAlert(CSubscriptionResponse.ErrorMessage);
                    return;
                }
            }

            TriSysApex.UI.ShowMessage("Something went wrong with this process.");
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('ctrlSubscribe.CallProvisioningWebAPI: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Scheduling Provisioning...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    }
};

$(document).ready(function ()
{
    ctrlSubscribe.Load();
});
