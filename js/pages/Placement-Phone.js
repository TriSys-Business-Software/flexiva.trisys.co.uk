var PlacementPhone =
{
    _PlacementId: 0,

    LoadPlacement: function (lPlacementId)
    {
        PlacementPhone._PlacementId = lPlacementId;
        PlacementPhone.HideFieldsBeforeDisplay();

        if (lPlacementId <= 0)
        {
            // New placement record, so switch straight into 'edit mode'
            var options = { IgnorePhoneGap: true };
            TriSysApex.FormsManager.OpenForm("Placement", -1, false, options);
            return;
        }


        var spinnerWait = { Div: 'placement-phone-summary-top' };
        TriSysSDK.Grid.WaitSpinnerMode(spinnerWait, true);

        var fnCallbackSummary = function (CPlacementResponse, bSuccess)
        {
            TriSysSDK.Grid.WaitSpinnerMode(spinnerWait, false);

            if (bSuccess)
            {
                // We got the placement summary quickly, so now get the addresses and contacts silently in case there are many
                if (CPlacementResponse.Success)
                {
                    PlacementPhone.DisplayPlacement(CPlacementResponse);

                    // TODO: Tasks, Timesheets?

                    //var spinnerWait2 = { Div: 'placement-form-addresses-container' };
                    //TriSysSDK.Grid.WaitSpinnerMode(spinnerWait2, true);

                    //var fnAddressesAndContacts = function (CPlacementReadResponse, bSuccess)
                    //{
                    //    TriSysSDK.Grid.WaitSpinnerMode(spinnerWait2, false);

                    //    if (bSuccess)
                    //        PlacementPhone.DisplayPlacement(CPlacementReadResponse.Placement);
                    //};

                    //PlacementPhone.ReadPlacementFromWebAPI(lPlacementId, true, fnAddressesAndContacts);
                }
            }
        };

        PlacementPhone.ReadPlacementFromWebAPI(lPlacementId, false, fnCallbackSummary);
    },

    ReadPlacementFromWebAPI: function (lPlacementId, bTimesheets, fnCallback)
    {
        var CPlacementRequest = {
            PlacementId: lPlacementId,
            RecruiterAccess: true,
            Timesheets: bTimesheets
        };

        var payloadObject = {};

        payloadObject.URL = "Placement/Read";

        payloadObject.OutboundDataPacket = CPlacementRequest;

        payloadObject.InboundDataFunction = function (CPlacementResponse)
        {
            fnCallback(CPlacementResponse, true);
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            fnCallback(null, false);
            TriSysApex.UI.errorAlert('PlacementPhone.ReadPlacementFromWebAPI: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    // If retain forms in memory, remember to hide stuff to prevent overwriting
    HideFieldsBeforeDisplay: function ()
    {
        var sFieldPrefix = '#placement-phone-';

        $(sFieldPrefix + 'type-footer').html('');
        $(sFieldPrefix + 'reference').html('');
        $(sFieldPrefix + 'jobtitle').html('');
        //$(sFieldPrefix + 'startdate').unbind('click');


        // Hide all rows
        $("[id^=" + sFieldPrefix.replace('#', '') + "]").filter("[id*=-tr]").each(function ()
        {
            $(this).hide();
        });

        // Hide specific blocks
        $('#placement-phone-summary-dates').hide();

        // Empty shortlist
        //$('#placement-form-shortlist-container').empty();
    },

    DisplayPlacement: function (CPlacementResponse)
    {
        PlacementPhone.ScrollToTop();

        var sFieldPrefix = '#placement-phone-';

        var bPermanent = (CPlacementResponse.Type == 'Permanent');

        $(sFieldPrefix + 'type-footer').html(CPlacementResponse.Type);
        $(sFieldPrefix + 'reference').html(CPlacementResponse.Reference);
        $(sFieldPrefix + 'jobtitle').html(CPlacementResponse.JobTitle);
        $(sFieldPrefix + 'type').html(CPlacementResponse.Type);
        $(sFieldPrefix + 'startdate').html(moment(CPlacementResponse.StartDate).format("dddd DD MMMM YYYY"));
        $(sFieldPrefix + 'enddate').html(moment(CPlacementResponse.EndDate).format("dddd DD MMMM YYYY"));
        bPermanent ? $(sFieldPrefix + 'enddate-tr').hide() : $(sFieldPrefix + 'enddate-tr').show();
        $(sFieldPrefix + 'consultant').html(CPlacementResponse.UserName);

        $(sFieldPrefix + 'summary-dates').show();

        var sCompanyLogoURL = CPlacementResponse.Company.CompanyLogoURL;
        if (!sCompanyLogoURL)
            sCompanyLogoURL = TriSysApex.Constants.DefaultCompanyImage;
        $(sFieldPrefix + 'companylogourl').attr('src', sCompanyLogoURL);

        // Hyperlink to company form
        TriSysPhoneGap.ShowAndActivateCompany(sFieldPrefix + 'company', CPlacementResponse.Company.CompanyId);

        $(sFieldPrefix + 'companyname').html(CPlacementResponse.Company.CompanyName);
        $(sFieldPrefix + 'industry').html(CPlacementResponse.Company.Industry);


        var sContactPhotoURL = CPlacementResponse.ClientContact.ContactPhotoURL;
        if (!sContactPhotoURL)
            sContactPhotoURL = TriSysApex.Constants.DefaultContactImage;
        $(sFieldPrefix + 'contactphotourl').attr('src', sContactPhotoURL);

        // Hyperlink to contact form
        TriSysPhoneGap.ShowAndActivateContact(sFieldPrefix + 'contact', CPlacementResponse.ClientContact.ContactId);

        $(sFieldPrefix + 'contactname').html(CPlacementResponse.ClientContact.FullName);
        $(sFieldPrefix + 'contact-jobtitle').html(CPlacementResponse.ClientContact.JobTitle);

        sContactPhotoURL = CPlacementResponse.CandidateContact.ContactPhotoURL;
        if (!sContactPhotoURL)
            sContactPhotoURL = TriSysApex.Constants.DefaultContactImage;
        $(sFieldPrefix + 'candidatephotourl').attr('src', sContactPhotoURL);

        // Hyperlink to candidate form
        TriSysPhoneGap.ShowAndActivateContact(sFieldPrefix + 'candidate', CPlacementResponse.CandidateContact.ContactId);

        $(sFieldPrefix + 'candidatename').html(CPlacementResponse.CandidateContact.FullName);
        $(sFieldPrefix + 'candidate-jobtitle').html(CPlacementResponse.CandidateContact.JobTitle);


        if (CPlacementResponse.SiteAddressObject)
        {
            var addresss = CPlacementResponse.SiteAddressObject;
            TriSysPhoneGap.ShowAndActivateMap(sFieldPrefix + 'siteaddress',
                addresss.Street, addresss.City, addresss.County,
                addresss.PostCode, addresss.Country);
        }

        $(sFieldPrefix + 'comments').html(CPlacementResponse.Comments);
        $(sFieldPrefix + 'webtext').html(CPlacementResponse.WebText);

        var sSalaryRateDescription = (bPermanent ? "Salary" : CPlacementResponse.Type + " Rates");
        $(sFieldPrefix + 'salary-description').html(sSalaryRateDescription);

        var sSalary = CPlacementResponse.Salary;
        if (!bPermanent)
        {
            sSalary = "Pay: " + CPlacementResponse.PayRate +
                      "<br />Charge: " + CPlacementResponse.ChargeRate;
        }
        $(sFieldPrefix + 'salary').html(sSalary);
        $(sFieldPrefix + 'salary-tr').show();

        $(sFieldPrefix + 'status').html(CPlacementResponse.Status);
        $(sFieldPrefix + 'status-tr').show();

        if (CPlacementResponse.Description)
        {
            $(sFieldPrefix + 'description').html(CPlacementResponse.Description);
            $(sFieldPrefix + 'description-tr').show();
        }
        
        if (CPlacementResponse.Requirement)
        {
            var requirement = CPlacementResponse.Requirement;
            var sInitiated = moment(requirement.DateInitiated).format("dddd DD MMMM YYYY")
            var sRequirement = requirement.Reference + ': ' + requirement.JobTitle +
                '<br />Initiated: ' + sInitiated +
                '<br />Consultant: ' + requirement.Consultant;
            $(sFieldPrefix + 'requirement').html(sRequirement);
            TriSysPhoneGap.ShowAndActivateRequirement(sFieldPrefix + 'requirement', requirement.RequirementId);
        }

        // Must also update the browser history with the name of the placement
        TriSysApex.BrowserHistory.Menu.Add("Placement", CPlacementResponse.PlacementId, CPlacementResponse.Reference);
    },

    ScrollToTop: function ()
    {
        //$.scrollTo('#placements-form-top');
        $(document.body).scrollTop($('#placement-form-top').offset().top - 120);
    },

    EditPlacement: function ()
    {
        // Edit placement record, so switch straight into 'edit mode'
        var options = { IgnorePhoneGap: true };
        TriSysApex.FormsManager.OpenForm("Placement", PlacementPhone._PlacementId, true, options);
    }
};

