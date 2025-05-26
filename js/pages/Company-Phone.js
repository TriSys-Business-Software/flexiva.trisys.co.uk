var CompanyPhone =
{
    _CompanyId: 0,

    LoadCompany: function (lCompanyId)
    {
        CompanyPhone._CompanyId = lCompanyId;
        CompanyPhone.HideFieldsBeforeDisplay();

        if (lCompanyId <= 0)
        {
            // New company record, so switch straight into 'edit mode'
            var options = { IgnorePhoneGap: true };
            TriSysApex.FormsManager.OpenForm("Company", -1, false, options);
            return;
        }


        var spinnerWait = { Div: 'company-phone-summary-top' };
        TriSysSDK.Grid.WaitSpinnerMode(spinnerWait, true);

        var fnCallbackSummary = function (CCompanyReadResponse, bSuccess)
        {
            TriSysSDK.Grid.WaitSpinnerMode(spinnerWait, false);

            if (bSuccess)
            {
                // We got the company summary quickly, so now get the addresses and contacts silently in case there are many
                if (CCompanyReadResponse.Success)
                {
                    CompanyPhone.DisplayCompany(CCompanyReadResponse.Company);

                    var spinnerWait2 = { Div: 'company-form-addresses-container' };
                    TriSysSDK.Grid.WaitSpinnerMode(spinnerWait2, true);

                    var fnAddressesAndContacts = function (CCompanyReadResponse, bSuccess)
                    {
                        TriSysSDK.Grid.WaitSpinnerMode(spinnerWait2, false);

                        if(bSuccess)
                            CompanyPhone.DisplayCompany(CCompanyReadResponse.Company);
                    };

                    CompanyPhone.ReadCompanyFromWebAPI(lCompanyId, true, fnAddressesAndContacts);
                }
            }
        };

        CompanyPhone.ReadCompanyFromWebAPI(lCompanyId, false, fnCallbackSummary);        
    },

    ReadCompanyFromWebAPI: function (lCompanyId, bAddressesAndContacts, fnCallback)
    {
        var CCompanyReadRequest = {
            CompanyId: lCompanyId,
            AddressesAndContacts: bAddressesAndContacts
        };

        var payloadObject = {};

        payloadObject.URL = "Company/Read";

        payloadObject.OutboundDataPacket = CCompanyReadRequest;

        payloadObject.InboundDataFunction = function (CCompanyReadResponse)
        {
            fnCallback(CCompanyReadResponse, true);
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            fnCallback(null, false);
            TriSysApex.UI.errorAlert('CompanyPhone.ReadCompanyFromWebAPI: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    // If retain forms in memory, remember to hide stuff to prevent overwriting
    HideFieldsBeforeDisplay: function ()
    {
        var sFieldPrefix = '#company-phone-';

        $(sFieldPrefix + 'companyname').html('');
        $(sFieldPrefix + 'industry').html('');
        $(sFieldPrefix + 'logourl').unbind('click');
        $(sFieldPrefix + 'employees').hide();
        $(sFieldPrefix + 'directors').hide();
        $(sFieldPrefix + 'turnover').hide();

        // Hide all rows
        $("[id^=" + sFieldPrefix.replace('#', '') + "]").filter("[id*=-tr]").each(function ()
        {
            $(this).hide();
        });

        $(sFieldPrefix + 'comments-table').hide();
        $(sFieldPrefix + 'requirements-table').hide();
        $(sFieldPrefix + 'placements-table').hide();

        // Empty addresses and contacts
        $('#company-form-addresses-container').empty();
    },

    DisplayCompany: function (CCompanySummary)
    {
        CompanyPhone.ScrollToTop();

        var sFieldPrefix = '#company-phone-';

        $(sFieldPrefix + 'companyname').html(CCompanySummary.CompanyName);
        $(sFieldPrefix + 'industry').html(CCompanySummary.Industry);

        var bHyperlinkOpenLogo = true;
        var sCompanyLogoURL = CCompanySummary.CompanyLogoURL;
        if (!sCompanyLogoURL)
        {
            sCompanyLogoURL = TriSysApex.Constants.DefaultCompanyImage;
            bHyperlinkOpenLogo = false;
        }
        $(sFieldPrefix + 'logourl').attr('src', sCompanyLogoURL);
        $(sFieldPrefix + 'logourl').unbind('click');
        if (bHyperlinkOpenLogo)
        {
            $(sFieldPrefix + 'logourl').on('click', function ()
            {
                TriSysSDK.Controls.FileManager.OpenDocumentViewer(CCompanySummary.CompanyName, sCompanyLogoURL, CCompanySummary.CompanyName);
            });
        }

        if (CCompanySummary.Employees && CCompanySummary.Employees > 0)
        {
            $(sFieldPrefix + 'employees').show();
            $(sFieldPrefix + 'employees').html('<br /><i class="gi gi-user" style="color: cornflowerblue;"></i> &nbsp; ' +
                CCompanySummary.Employees + " employee" + (CCompanySummary.Employees == 1 ? '' : 's'));
        }
        if (CCompanySummary.Directors && CCompanySummary.Directors > 0)
        {
            $(sFieldPrefix + 'directors').show();
            $(sFieldPrefix + 'directors').html('<br /><i class="gi gi-tie" style="color: plum;"></i> &nbsp; ' +
                CCompanySummary.Directors + " director" + (CCompanySummary.Directors == 1 ? '' : 's'));
        }
        if (CCompanySummary.Turnover && CCompanySummary.Turnover > 0)
        {
            var sTurnover = TriSysSDK.Numbers.ThousandsSeparator(CCompanySummary.Turnover);
            $(sFieldPrefix + 'turnover').show();
            $(sFieldPrefix + 'turnover').html('<br /><i class="gi gi-gbp" style="color: green;"></i> &nbsp; ' +
                sTurnover + " annual turnover");
        }

        if (CCompanySummary.Comments)
        {
            $(sFieldPrefix + 'comments-table').show();
            $(sFieldPrefix + 'comments').html(CCompanySummary.Comments);
        }

        if (CCompanySummary.MainTelNo)
            TriSysPhoneGap.ShowAndActivateCall(sFieldPrefix + 'maintelno', CCompanySummary.MainTelNo);

        if (CCompanySummary.EMail)
            TriSysPhoneGap.ShowAndActivateEMail(sFieldPrefix + 'email', CCompanySummary.EMail);

        if (CCompanySummary.WebPage)
            TriSysPhoneGap.ShowAndActivateWebSite(sFieldPrefix + 'website', CCompanySummary.WebPage);

        // Addresses and contacts
        if (CCompanySummary.Addresses)
        {
            CCompanySummary.Addresses.forEach(function (addressContacts)
            {
                var sHTML = CompanyPhone.BuildAddressFromTemplates(addressContacts);
                if(sHTML)
                    $('#company-form-addresses-container').append(sHTML);
            });
        }

        // Requirements and Placements
        if (CCompanySummary.RequirementCount > 0)
        {
            var sRequirements = CCompanySummary.RequirementCount + " Requirement" + (CCompanySummary.RequirementCount == 1 ? "" : "s");
            $(sFieldPrefix + 'requirements-table').show();
            $(sFieldPrefix + 'requirementcount').html(sRequirements);
            var sFunction = 'CompanyPhone.LoadRequirements(' + CCompanySummary.CompanyId + ', \'' + CCompanySummary.CompanyName + '\')';
            TriSysPhoneGap.ShowAndActivateFunction(sFieldPrefix + 'requirements', null, sFunction);
        }
        if (CCompanySummary.PlacementCount > 0)
        {
            var sPlacements = CCompanySummary.PlacementCount + " Placement" + (CCompanySummary.PlacementCount == 1 ? "" : "s");
            $(sFieldPrefix + 'placements-table').show();
            $(sFieldPrefix + 'placementcount').html(sPlacements);
            var sFunction = 'CompanyPhone.LoadPlacements(' + CCompanySummary.CompanyId + ', \'' + CCompanySummary.CompanyName + '\')';
            TriSysPhoneGap.ShowAndActivateFunction(sFieldPrefix + 'placements', null, sFunction);
        }


        // Must also update the browser history with the name of the company
        TriSysApex.BrowserHistory.Menu.Add("Company", CCompanySummary.CompanyId, CCompanySummary.CompanyName);
    },

    BuildAddressFromTemplates: function (CCompanySummaryAddressContacts)
    {
        var sHTML = $("#company-form-address-template").html();

        sHTML = sHTML.replace("{{contact-phone-address-type}}", CCompanySummaryAddressContacts.Address.Type);

        var address = CCompanySummaryAddressContacts.Address;
        var sAddress = CompanyPhone.DisplayAddress(address.Street, address.City, address.County, address.PostCode, address.Country);
        if (!sAddress)
            sAddress = "Unknown";
        sHTML = sHTML.replace(/{{contact-phone-address}}/g, sAddress);

        // Contacts using another template
        var sContactTemplateHTML = CompanyPhone.BuildContactFromTemplates(CCompanySummaryAddressContacts.Contacts);
        sHTML = sHTML.replace("{{company-form-address-contact-list}}", sContactTemplateHTML);

        return sHTML;
    },

    BuildContactFromTemplates: function (lstCContact)
    {
        if (!lstCContact)
            return '';
        if (lstCContact.length == 0)
            return '';

        var sHTML = '';
        var sTemplateHTML = $("#company-form-address-contacts").html();

        lstCContact.forEach(function (CContact)
        {
            var sContactHTML = sTemplateHTML;
            sContactHTML = sContactHTML.replace("{{contact-phone-address-contactid}}", CContact.ContactId);
            sContactHTML = sContactHTML.replace("#:FullName#", CContact.FullName);
            sContactHTML = sContactHTML.replace("#:JobTitle#", (CContact.JobTitle ? CContact.JobTitle : ''));

            if (!CContact.ContactPhotoURL)
                CContact.ContactPhotoURL = TriSysApex.Constants.DefaultContactImage;

            sContactHTML = sContactHTML.replace("#:ContactPhotoURL#", CContact.ContactPhotoURL);

            sHTML += sContactHTML;
        });

        return sHTML;
    },

    DisplayAddress: function (sStreet, sCity, sCounty, sPostCode, sCountry)
    {
        var sAddress = sStreet != '?' ? sStreet : '';
        if (sAddress && sAddress != '?')
        {
            sAddress = sAddress.replace(/\n/g, ', ');
            sAddress = sAddress.replace(/\r/g, '');
        }

        if (sAddress && sCity && sCity != '?')
            sAddress += ', ';
        if (sCity != '?')
            sAddress += sCity;

        if (sAddress && sCounty && sCounty != '?')
            sAddress += ', ';
        if (sCounty != '?')
            sAddress += sCounty;

        if (sAddress && sPostCode && sPostCode != '?')
            sAddress += ', ';
        if (sPostCode != '?')
            sAddress += sPostCode;

        if (sAddress && sCountry && sCountry != '?')
            sAddress += ', ';
        if (sCountry != '?')
            sAddress += sCountry;

        return sAddress;
    },

    ScrollToTop: function ()
    {
        //$.scrollTo('#companys-form-top');
        $(document.body).scrollTop($('#company-form-top').offset().top - 120);
    },

    EditCompany: function ()
    {
        // Edit company record, so switch straight into 'edit mode'
        var options = { IgnorePhoneGap: true };
        TriSysApex.FormsManager.OpenForm("Company", CompanyPhone._CompanyId, true, options);
    },

    LoadRequirements: function(lCompanyId, sCompanyName)
    {
        // Re-use lookup page
        var sSearchText = "{Company:" + lCompanyId + "}";
        //sSearchText = sCompanyName;

        TriSysApex.FormsManager.OpenForm("Requirements", sSearchText, true);
    },

    LoadPlacements: function (lCompanyId, sCompanyName)
    {
        // Re-use lookup page
        var sSearchText = "{Company:" + lCompanyId + "}";

        TriSysApex.FormsManager.OpenForm("Placements", sSearchText, true);
    }
};

