var ContactPhone =
{
    _ContactId: 0,

    LoadContact: function(lContactId)
    {
        ContactPhone._ContactId = lContactId;
        ContactPhone.HideFieldsBeforeDisplay();

        if (lContactId <= 0)
        {
            // New contact record, so switch straight into 'edit mode'
            var options = { IgnorePhoneGap: true };
            TriSysApex.FormsManager.OpenForm("Contact", -1, false, options);
            return;
        }


        var spinnerWait = { Div: 'contact-phone-summary-top' };

        var CReadContactRequest = {
            ContactRecord: { ContactId: lContactId }
        };

        var payloadObject = {};

        payloadObject.URL = "Contacts/ReadContact";

        payloadObject.OutboundDataPacket = CReadContactRequest;

        payloadObject.InboundDataFunction = function (CReadContactResponse)
        {
            TriSysSDK.Grid.WaitSpinnerMode(spinnerWait, false);

            if (CReadContactResponse)
            {
                if (CReadContactResponse.Success)
                    ContactPhone.DisplayContact(CReadContactResponse.ContactRecord);
                else
                {
                    // No data to display!
                }

                return;
            }

            TriSysApex.UI.ShowError('ContactPhone.LoadContact Error: null response');
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysSDK.Grid.WaitSpinnerMode(spinnerWait, false);
            TriSysApex.UI.errorAlert('ContactPhone.LoadContact: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysSDK.Grid.WaitSpinnerMode(spinnerWait, true);
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    // If retain forms in memory, remember to hide stuff to prevent overwriting
    HideFieldsBeforeDisplay: function()
    {
        var sFieldPrefix = '#contact-phone-';

        $(sFieldPrefix + 'type').html('');
        $(sFieldPrefix + 'fullname').html('');
        $(sFieldPrefix + 'companyname').html('');
        $(sFieldPrefix + 'jobtitle').html('');
        $(sFieldPrefix + 'photourl').unbind('click');

        // Hide all rows
        $("[id^=" + sFieldPrefix.replace('#', '') + "]").filter("[id*=-tr]").each(function ()
        {
            $(this).hide();
        });

        // Hide specifics
        $(sFieldPrefix + 'skype-table').hide();
        $(sFieldPrefix + 'requirements-table').hide();
        $(sFieldPrefix + 'placements-table').hide();
    },

    DisplayContact: function (CContact)
    {
        ContactPhone.ScrollToTop();

        var sFieldPrefix = '#contact-phone-';

        $(sFieldPrefix + 'type').html(CContact.ContactType);
        $(sFieldPrefix + 'fullname').html(CContact.FullName);

        if (CContact.CompanyName)
        {
            $(sFieldPrefix + 'companyname').html(CContact.CompanyName);
            $(sFieldPrefix + 'companyname').show();
            $(sFieldPrefix + 'companyname').unbind('click').on('click', function ()
            {
                TriSysApex.FormsManager.OpenForm("Company", CContact.CompanyId);
            });

            TriSysPhoneGap.ShowAndActivateCompany(sFieldPrefix + 'company', CContact.CompanyId);
            $(sFieldPrefix + 'company').html(CContact.CompanyName);
            $(sFieldPrefix + 'company-industry').html(CContact.CompanyIndustry);
            var sCompanyLogoURL = CContact.CompanyLogoURL;
            if (!sCompanyLogoURL)
                sCompanyLogoURL = TriSysApex.Constants.DefaultCompanyImage;
            $(sFieldPrefix + 'companylogourl').attr('src', sCompanyLogoURL);
            $(sFieldPrefix + 'company-tr').show();
        }

        $(sFieldPrefix + 'jobtitle').html(CContact.JobTitle);

        var bHyperlinkOpenPhoto = true;
        var sContactPhotoURL = CContact.ContactPhotoURL;
        if (!sContactPhotoURL)
        {
            sContactPhotoURL = TriSysApex.Constants.DefaultContactImage;
            bHyperlinkOpenPhoto = false;
        }
        $(sFieldPrefix + 'photourl').attr('src', sContactPhotoURL);
        $(sFieldPrefix + 'photourl').unbind('click');
        if (bHyperlinkOpenPhoto)
        {
            $(sFieldPrefix + 'photourl').on('click', function ()
            {
                TriSysSDK.Controls.FileManager.OpenDocumentViewer(CContact.FullName, sContactPhotoURL, CContact.FullName);
            });
        }

        if(CContact.LinkedIn)
        {
            $(sFieldPrefix + 'linkedin').show();
            $(sFieldPrefix + 'linkedin-hyperlink').attr('href', CContact.LinkedIn);
            $(sFieldPrefix + 'linkedin-hyperlink').attr('target', '_blank');
        }
        if (CContact.Facebook)
        {
            $(sFieldPrefix + 'facebook').show();
            $(sFieldPrefix + 'facebook-hyperlink').attr('href', CContact.Facebook);
            $(sFieldPrefix + 'facebook-hyperlink').attr('target', '_blank');
            $(sFieldPrefix + 'facebook-separator').show();
        }
        if (CContact.Twitter)
        {
            $(sFieldPrefix + 'twitter').show();
            $(sFieldPrefix + 'twitter-hyperlink').attr('href', CContact.Twitter);
            $(sFieldPrefix + 'twitter-hyperlink').attr('target', '_blank');
            $(sFieldPrefix + 'twitter-separator').show();
        }

        if (CContact.WorkTelNo)
            TriSysPhoneGap.ShowAndActivateCall(sFieldPrefix + 'worktelno', CContact.WorkTelNo);

        if (CContact.WorkMobileTelNo)
        {
            TriSysPhoneGap.ShowAndActivateCall(sFieldPrefix + 'workmobiletelno-call', CContact.WorkMobileTelNo);
            TriSysPhoneGap.ShowAndActivateSMS(sFieldPrefix + 'workmobiletelno-sms', CContact.WorkMobileTelNo);
        }

        if (CContact.WorkEMail)
            TriSysPhoneGap.ShowAndActivateEMail(sFieldPrefix + 'workemail', CContact.WorkEMail);

        if (CContact.CompanyAddressStreet || CContact.CompanyAddressCity)
        {
            TriSysPhoneGap.ShowAndActivateMap(sFieldPrefix + 'workaddress',
                CContact.CompanyAddressStreet, CContact.CompanyAddressCity, CContact.CompanyAddressCounty, 
                CContact.CompanyAddressPostCode, CContact.CompanyAddressCountry);
        }

        if (CContact.HomeAddressTelNo)
            TriSysPhoneGap.ShowAndActivateCall(sFieldPrefix + 'hometelno', CContact.HomeAddressTelNo);

        if (CContact.MobileTelNo)
        {
            TriSysPhoneGap.ShowAndActivateCall(sFieldPrefix + 'personalmobiletelno-call', CContact.MobileTelNo);
            TriSysPhoneGap.ShowAndActivateSMS(sFieldPrefix + 'personalmobiletelno-sms', CContact.MobileTelNo);
        }

        if (CContact.PersonalEMail)
            TriSysPhoneGap.ShowAndActivateEMail(sFieldPrefix + 'personalemail', CContact.PersonalEMail);

        if (CContact.HomeAddressStreet || CContact.HomeAddressCity)
        {
            TriSysPhoneGap.ShowAndActivateMap(sFieldPrefix + 'homeaddress',
                CContact.HomeAddressStreet, CContact.HomeAddressCity, CContact.HomeAddressCounty,
                CContact.HomeAddressPostCode, CContact.HomeAddressCountry);
        }

        if (CContact.SkypeNumber)
        {
            TriSysPhoneGap.ShowAndActivateSkype(sFieldPrefix + 'skype', CContact.SkypeNumber);
            $(sFieldPrefix + 'skype-table').show();
        }
        
        if (CContact.CVFileRef)
        {
            var sFunction = 'ContactPhone.OpenCV(\'' + CContact.CVFileRef.replace(/\\/g, '\\\\') + '\', \'' + CContact.FullName + ' Original CV\')';
            TriSysPhoneGap.ShowAndActivateFunction(sFieldPrefix + 'cvfileref', null, sFunction);
            $(sFieldPrefix + 'cvfileref-lastupdated').html(moment(CContact.CVLastUpdated).format("dddd DD MMMM YYYY"));
        }

        if (CContact.FormattedCVs)
        {
            CContact.FormattedCVs.forEach(function (CContactFormattedCV)
            {
                var sFunction = 'ContactPhone.OpenCV(\'' + CContactFormattedCV.FormattedCVFileRef.replace(/\\/g, '\\\\') + '\', \'' + CContact.FullName + ' ' + CContactFormattedCV.Label + ' CV\')';
                TriSysPhoneGap.ShowAndActivateFunction(sFieldPrefix + 'formattedcvfileref' + CContactFormattedCV.Number, null, sFunction);
                $(sFieldPrefix + 'formattedcvfileref' + CContactFormattedCV.Number + '-lastupdated').html(moment(CContactFormattedCV.LastUpdated).format("dddd DD MMMM YYYY"));
                $(sFieldPrefix + 'formattedcvfileref' + CContactFormattedCV.Number + '-label').html(CContactFormattedCV.Label);
                $(sFieldPrefix + 'formattedcvfileref' + CContactFormattedCV.Number + '-number').html(CContactFormattedCV.Number);
            });            
        }

        if (CContact.AvailabilityDate)
        {
            var dt = new Date(CContact.AvailabilityDate);
            if (dt.getFullYear() >= 1994)
            {
                $(sFieldPrefix + 'availabilitydate-tr').show();
                $(sFieldPrefix + 'availabilitydate').html(moment(dt).format("dddd DD MMMM YYYY"));
            }
        }

        // Requirements and Placements
        if (CContact.RequirementCount > 0)
        {
            var sRequirements = CContact.RequirementCount + " Requirement" + (CContact.RequirementCount == 1 ? "" : "s");
            $(sFieldPrefix + 'requirements-table').show();
            $(sFieldPrefix + 'requirementcount').html(sRequirements);
            var sFunction = 'ContactPhone.LoadRequirements(' + CContact.ContactId + ')';
            TriSysPhoneGap.ShowAndActivateFunction(sFieldPrefix + 'requirements', null, sFunction);
        }
        if (CContact.PlacementCount > 0)
        {
            var sPlacements = CContact.PlacementCount + " Placement" + (CContact.PlacementCount == 1 ? "" : "s");
            $(sFieldPrefix + 'placements-table').show();
            $(sFieldPrefix + 'placementcount').html(sPlacements);
            var sFunction = 'ContactPhone.LoadPlacements(' + CContact.ContactId + ')';
            TriSysPhoneGap.ShowAndActivateFunction(sFieldPrefix + 'placements', null, sFunction);
        }


        // Must also update the browser history with the name of the contact
        TriSysApex.BrowserHistory.Menu.Add("Contact", CContact.ContactId, CContact.FullName);
    },

    
    ScrollToTop: function ()
    {
        //$.scrollTo('#contacts-form-top');
        $(document.body).scrollTop($('#contact-form-top').offset().top - 120);
    },

    EditContact: function ()
    {
        // Edit contact record, so switch straight into 'edit mode'
        var options = { IgnorePhoneGap: true };
        TriSysApex.FormsManager.OpenForm("Contact", ContactPhone._ContactId, true, options);
    },

    OpenCV: function (sPath, sName)
    {
        TriSysSDK.Controls.FileManager.GetOpenFileURLFromWebService("TriSys CV Viewer", sPath, sName);
    },

    LoadRequirements: function (lContactId)
    {
        // Re-use lookup page
        var sSearchText = "{Contact:" + lContactId + "}";
        TriSysApex.FormsManager.OpenForm("Requirements", sSearchText, true);
    },

    LoadPlacements: function (lContactId)
    {
        // Re-use lookup page
        var sSearchText = "{Contact:" + lContactId + "}";
        TriSysApex.FormsManager.OpenForm("Placements", sSearchText, true);
    }
};

