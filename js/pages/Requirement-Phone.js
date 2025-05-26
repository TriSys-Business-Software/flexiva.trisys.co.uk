var RequirementPhone =
{
    _RequirementId: 0,

    LoadRequirement: function (lRequirementId)
    {
        RequirementPhone._RequirementId = lRequirementId;
        RequirementPhone.HideFieldsBeforeDisplay();

        if (lRequirementId <= 0)
        {
            // New requirement record, so switch straight into 'edit mode'
            var options = { IgnorePhoneGap: true };
            TriSysApex.FormsManager.OpenForm("Requirement", -1, false, options);
            return;
        }


        var spinnerWait = { Div: 'requirement-phone-summary-top' };
        TriSysSDK.Grid.WaitSpinnerMode(spinnerWait, true);

        var fnCallbackSummary = function (CRequirementReadResponse, bSuccess)
        {
            TriSysSDK.Grid.WaitSpinnerMode(spinnerWait, false);

            if (bSuccess)
            {
                // We got the requirement summary quickly, so now get the addresses and contacts silently in case there are many
                if (CRequirementReadResponse.Success)
                {
                    RequirementPhone.DisplayRequirement(CRequirementReadResponse.Requirement);

                    // Candidate Shortlist

                    var spinnerWait2 = { Div: 'requirement-form-shortlist-container' };
                    TriSysSDK.Grid.WaitSpinnerMode(spinnerWait2, true);

                    var fnShortlist = function (CRequirementReadResponse, bSuccess)
                    {
                        TriSysSDK.Grid.WaitSpinnerMode(spinnerWait2, false);

                        if (bSuccess)
                            RequirementPhone.DisplayRequirementShortlist(CRequirementReadResponse.Requirement.Shortlist);
                    };

                    RequirementPhone.ReadRequirementFromWebAPI(lRequirementId, true, false, fnShortlist);
                }
            }
        };

        RequirementPhone.ReadRequirementFromWebAPI(lRequirementId, false, false, fnCallbackSummary);
    },

    ReadRequirementFromWebAPI: function (lRequirementId, bShortlist, bPlacements, fnCallback)
    {
        var CRequirementReadRequest = {
            RequirementId: lRequirementId,
            Shortlist: bShortlist,
            Placements: bPlacements
        };

        var payloadObject = {};

        payloadObject.URL = "Requirement/Read";

        payloadObject.OutboundDataPacket = CRequirementReadRequest;

        payloadObject.InboundDataFunction = function (CRequirementReadResponse)
        {
            fnCallback(CRequirementReadResponse, true);
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            fnCallback(null, false);
            TriSysApex.UI.errorAlert('RequirementPhone.ReadRequirementFromWebAPI: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    // If retain forms in memory, remember to hide stuff to prevent overwriting
    HideFieldsBeforeDisplay: function ()
    {
        var sFieldPrefix = '#requirement-phone-';

        $(sFieldPrefix + 'type-footer').html('');
        $(sFieldPrefix + 'reference').html('');
        $(sFieldPrefix + 'jobtitle').html('');
        

        // Hide all rows
        $("[id^=" + sFieldPrefix.replace('#', '') + "]").filter("[id*=-tr]").each(function ()
        {
            $(this).hide();
        });

        // Hide specific blocks
        $(sFieldPrefix + 'summary-dates').hide();
        $(sFieldPrefix + 'placements-table').hide();

        // Empty shortlist
        $('#requirement-form-shortlist-container').empty();
    },

    DisplayRequirement: function (CRequirementSummaryRead)
    {
        RequirementPhone.ScrollToTop();

        var sFieldPrefix = '#requirement-phone-';

        $(sFieldPrefix + 'type-footer').html(CRequirementSummaryRead.Type);
        $(sFieldPrefix + 'reference').html(CRequirementSummaryRead.Reference);
        $(sFieldPrefix + 'jobtitle').html(CRequirementSummaryRead.JobTitle);
        $(sFieldPrefix + 'type').html(CRequirementSummaryRead.Type);
        $(sFieldPrefix + 'startdate').html(moment(CRequirementSummaryRead.EarliestStartDate).format("dddd DD MMMM YYYY"));
        $(sFieldPrefix + 'consultant').html(CRequirementSummaryRead.Consultant);

        $(sFieldPrefix + 'summary-dates').show();

        var sCompanyLogoURL = CRequirementSummaryRead.Company.CompanyLogoURL;
        if (!sCompanyLogoURL)
            sCompanyLogoURL = TriSysApex.Constants.DefaultCompanyImage;
        $(sFieldPrefix + 'companylogourl').attr('src', sCompanyLogoURL);

        // Hyperlink to company form
        TriSysPhoneGap.ShowAndActivateCompany(sFieldPrefix + 'company', CRequirementSummaryRead.Company.CompanyId);

        $(sFieldPrefix + 'companyname').html(CRequirementSummaryRead.Company.CompanyName);
        $(sFieldPrefix + 'industry').html(CRequirementSummaryRead.Company.Industry);


        var sContactPhotoURL = CRequirementSummaryRead.ClientContact.ContactPhotoURL;
        if (!sContactPhotoURL)
            sContactPhotoURL = TriSysApex.Constants.DefaultContactImage;
        $(sFieldPrefix + 'contactphotourl').attr('src', sContactPhotoURL);

        // Hyperlink to contact form
        TriSysPhoneGap.ShowAndActivateContact(sFieldPrefix + 'contact', CRequirementSummaryRead.ClientContact.ContactId);

        $(sFieldPrefix + 'contactname').html(CRequirementSummaryRead.ClientContact.FullName);
        $(sFieldPrefix + 'contact-jobtitle').html(CRequirementSummaryRead.ClientContact.JobTitle);

        if (CRequirementSummaryRead.SiteAddressObject)
        {
            var addresss = CRequirementSummaryRead.SiteAddressObject;
            TriSysPhoneGap.ShowAndActivateMap(sFieldPrefix + 'siteaddress',
                addresss.Street, addresss.City, addresss.County,
                addresss.PostCode, addresss.Country);
        }

        $(sFieldPrefix + 'comments').html(CRequirementSummaryRead.Comments);
        $(sFieldPrefix + 'webtext').html(CRequirementSummaryRead.WebText);

        var bPermanent = (CRequirementSummaryRead.Type == 'Permanent');
        var sSalaryRateDescription = (bPermanent ? "Salary" : CRequirementSummaryRead.Type + " Rates");
        $(sFieldPrefix + 'salary-description').html(sSalaryRateDescription);

        var sSalary = CRequirementSummaryRead.Salary;
        if (!bPermanent)
        {
            sSalary = "Pay: " + CRequirementSummaryRead.PayRate +
                      "<br />Charge: " + sSalary;
        }
        $(sFieldPrefix + 'salary').html(sSalary);
        $(sFieldPrefix + 'salary-tr').show();

        $(sFieldPrefix + 'required').html(CRequirementSummaryRead.NumberRequired);
        $(sFieldPrefix + 'required-tr').show();

        $(sFieldPrefix + 'status').html(CRequirementSummaryRead.Status);
        $(sFieldPrefix + 'status-tr').show();
        
        if (CRequirementSummaryRead.Comments)
        {
            $(sFieldPrefix + 'comments').html(CRequirementSummaryRead.Comments);
            $(sFieldPrefix + 'comments-tr').show();
        }
        if (CRequirementSummaryRead.WebText)
        {
            $(sFieldPrefix + 'webtext').html(CRequirementSummaryRead.WebTextStripped);
            $(sFieldPrefix + 'webtext-tr').show();
        }
        if (CRequirementSummaryRead.JobDescription)
        {
            var sFileName = TriSysSDK.Controls.FileManager.GetFileNameFromPath(CRequirementSummaryRead.JobDescription);
            $(sFieldPrefix + 'jobdescription').html(sFileName);
            TriSysPhoneGap.ShowAndActivateDocument(sFieldPrefix + 'jobdescription', CRequirementSummaryRead.JobDescription, 
                                sFileName, "Job Description");
        }
        if (CRequirementSummaryRead.WebJobsURL)
        {
            $(sFieldPrefix + 'webjobs').html(CRequirementSummaryRead.WebJobsURL);
            TriSysPhoneGap.ShowAndActivateWebSite(sFieldPrefix + 'webjobs', CRequirementSummaryRead.WebJobsURL);
        }

        // Placements
        if (CRequirementSummaryRead.PlacementCount > 0)
        {
            var sPlacements = CRequirementSummaryRead.PlacementCount + " Placement" + (CRequirementSummaryRead.PlacementCount == 1 ? "" : "s");
            $(sFieldPrefix + 'placements-table').show();
            $(sFieldPrefix + 'placementcount').html(sPlacements);
            var sFunction = 'RequirementPhone.LoadPlacements(' + CRequirementSummaryRead.RequirementId + ')';
            TriSysPhoneGap.ShowAndActivateFunction(sFieldPrefix + 'placements', null, sFunction);
        }        


        // Must also update the browser history with the name of the requirement
        TriSysApex.BrowserHistory.Menu.Add("Requirement", CRequirementSummaryRead.RequirementId, CRequirementSummaryRead.Reference);
    },

    DisplayRequirementShortlist: function (lstCRequirementShortlistedCandidate)
    {
        if (lstCRequirementShortlistedCandidate)
        {
            var sContactHTML = '';
            lstCRequirementShortlistedCandidate.forEach(function (shortlistedContact)
            {
                var sHTML = RequirementPhone.BuildShortlistedCandidateFromTemplates(shortlistedContact);
                if (sHTML)
                    sContactHTML += sHTML;
            });

            var sContainerHTML = $("#requirement-form-shortlist-template").html();
            sContainerHTML = sContainerHTML.replace("{{requirement-form-shortlist-contact-list}}", sContactHTML);

            $('#requirement-form-shortlist-container').append(sContainerHTML);
        }
    },

    BuildShortlistedCandidateFromTemplates: function (shortlistedContact)
    {
        var sHTML = $("#requirement-form-shortlisted-candidate").html();

        sHTML = sHTML.replace("{{requirement-phone-shortlisted-contactid}}", shortlistedContact.ContactId);
        sHTML = sHTML.replace("{{FullName}}", shortlistedContact.FullName);
        sHTML = sHTML.replace("{{JobTitle}}", shortlistedContact.JobTitle);
        sHTML = sHTML.replace("{{Source}}", shortlistedContact.Source);
        sHTML = sHTML.replace("{{ShortlistedDate}}", moment(shortlistedContact.DateShortlisted).format("DD MMM YYYY"));

        sContactPhotoURL = shortlistedContact.ContactPhotoURL;
        if (!sContactPhotoURL)
            sContactPhotoURL = TriSysApex.Constants.DefaultContactImage;
        sHTML = sHTML.replace("{{ContactPhotoURL}}", sContactPhotoURL);

        // History
        var sHistory = RequirementPhone.AppendShortlistHistory(shortlistedContact.DateInterested, "Interested") +
                        RequirementPhone.AppendShortlistHistory(shortlistedContact.DateCalled, "Called") +
                        RequirementPhone.AppendShortlistHistory(shortlistedContact.DateCVSent, "CV Sent") +
                        RequirementPhone.AppendShortlistHistory(shortlistedContact.DateTelephoneInterview, "Tel. Interview") +
                        RequirementPhone.AppendShortlistHistory(shortlistedContact.Date1stInterview, "1st Interview") +
                        RequirementPhone.AppendShortlistHistory(shortlistedContact.Date2ndInterview, "2nd Interview") +
                        RequirementPhone.AppendShortlistHistory(shortlistedContact.Date3rdInterview, "3rd Interview") +
                        RequirementPhone.AppendShortlistHistory(shortlistedContact.Date4thInterview, "4th Interview") +
                        RequirementPhone.AppendShortlistHistory(shortlistedContact.Date5thInterview, "5th Interview") +
                        RequirementPhone.AppendShortlistHistory(shortlistedContact.DateOfferMade, "Offer Made") +
                        RequirementPhone.AppendShortlistHistory(shortlistedContact.DateOfferAccepted, "Offer Accepted") +
                        RequirementPhone.AppendShortlistHistory(shortlistedContact.DateOfferRejected, "Offer Rejected") +
                        RequirementPhone.AppendShortlistHistory(shortlistedContact.DateOfferWithdrawn, "Offer Withdrawn") +
                        RequirementPhone.AppendShortlistHistory(shortlistedContact.DateRejected, "Rejected") +
                        RequirementPhone.AppendShortlistHistory(shortlistedContact.DatePlaced, "Placed");

        sHTML = sHTML.replace("{{History}}", sHistory);

        return sHTML;
    },

    AppendShortlistHistory: function(dtIn, sLabel)
    {
        var iMinYear = 1990, sHistory = '';

        var dt = new Date(moment(dtIn));

        if(dt.getFullYear() >= iMinYear)
            sHistory = "<br />" + sLabel + ": " + moment(dt).format("DD MMM YYYY");

        return sHistory;
    },

    ScrollToTop: function ()
    {
        //$.scrollTo('#requirements-form-top');
        $(document.body).scrollTop($('#requirement-form-top').offset().top - 120);
    },

    EditRequirement: function ()
    {
        // Edit requirement record, so switch straight into 'edit mode'
        var options = { IgnorePhoneGap: true };
        TriSysApex.FormsManager.OpenForm("Requirement", RequirementPhone._RequirementId, true, options);
    },

    LoadPlacements: function (lRequirementId)
    {
        // Re-use lookup page
        var sSearchText = "{Requirement:" + lRequirementId + "}";

        TriSysApex.FormsManager.OpenForm("Placements", sSearchText, true);
    }
};

