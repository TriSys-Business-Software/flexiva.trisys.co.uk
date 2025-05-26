// 03 Jun 2024: Re-Use this for new browser extension contacts
// Save is done in TriSysApex.ModalDialogue.NewCompanyContact
//
var ctrlNewCompanyContact =
{
    Load: function()
    {
        debugger;

        // Job title no-cache 
        if (!TriSysSDK.CShowForm.JobTitlesCached())
        {
            $('#tr-newCompanyContact-JobTitle').show();

            // Capture enter key to do lookup
            $('#newCompanyContact-JobTitle').keyup(function (e)
            {
                if (e.keyCode == 13)
                    ctrlNewCompanyContact.JobTitleLookup();
            });
        }
        else
            TriSysSDK.CShowForm.jobTitleCombo("newCompanyContact-JobTitle", null);

        TriSysSDK.CShowForm.contactTitleFieldEditableProperties("newCompanyContact-Title", "(None)");
		TriSysSDK.CShowForm.PopulateGenderCombo("newCompanyContact-Gender");

        if (TriSysApex.ModalDialogue.NewCompanyContact.Options.CompanyId > 0)
        {
			// We need to prevent overflow on the combo so need to resize it before load
			var iWidth = $('#newCompanyContact-WorkEMail').width() + 8;
			$('#newCompanyContact-Address').width(iWidth);

            // Display a list of addresses to choose in a combo
            TriSysApex.ModalDialogue.CompanyAddresses.PopulateCombo(TriSysApex.ModalDialogue.NewCompanyContact.Options.CompanyId, 'newCompanyContact-Address');
        }

        // 03 Jun 2024: Browser extension mode requires much less padding
        if (TriSysApex.ModalDialogue.NewCompanyContact.Options.BrowserExtension)
        {
            // CSS tweaks for browser extension mode where width is limited
            const block = $('#newCompanyContact-block');
            block.css('padding', '0px');
            block.css('border', '0px');
            block.css('margin-left', '-20px');
            block.css('margin-right', '-20px');
            $('.td-label').css('width', '100px')
            $('#newCompanyContact-WorkAddress-row').hide();
            ctrlNewCompanyContact.ContactTypeLookup();

            // The contact name from LinkedIn
            if (TriSysApex.ModalDialogue.NewCompanyContact.Options.Contact)
            {
                const contact = TriSysApex.ModalDialogue.NewCompanyContact.Options.Contact;
                const nameParts = TriSysSDK.Miscellaneous.ParseFullContactName(contact.FullName);

                $('#newCompanyContact-Forenames').val(nameParts.Forenames);
                $('#newCompanyContact-Surname').val(nameParts.Surname);
                $('#newCompanyContact-JobTitle').val(contact.JobTitle);

                // The photo from LinkedIn
                if (contact.PhotoURL)
                {
                    $('#newCompanyContact-Photo-row').show();
                    $('#newCompanyContact-PhotoURL').attr('src', contact.PhotoURL);
                }

                // The company from LinkedIn
                $('#newCompanyContact-Company').val(contact.CompanyName);
                ctrlNewCompanyContact.Data.LinkedIn = contact.LinkedIn;

                if (contact.CompanyName)
                {
                    var sContactTypeField = 'newCompanyContact-Type';
                    TriSysSDK.CShowForm.SetTextInCombo(sContactTypeField, 'Client');
                    const elemCompanyRow = $('#newCompanyContact-Company-row');
                    elemCompanyRow.show();
                }
            }
        }
    },

    JobTitleLookup: function()
    {
        var sJobTitleField = 'newCompanyContact-JobTitle';
        var sJobTitle = TriSysSDK.CShowForm.GetJobTitleFromField(sJobTitleField);
        TriSysSDK.JobTitle.Lookup(sJobTitle, sJobTitleField);
    },

    ContactTypeLookup: function ()
    {
        $('#newCompanyContact-Type-row').show();
        var sContactTypeField = 'newCompanyContact-Type';

        // Offer company field if we are adding a new contact
        var fnChange = function (lEntityTypeId, sContactType, sFieldID)
        {
            debugger;
            const elemCompanyRow = $('#newCompanyContact-Company-row');
            const elemCompanyAddressRow = $('#newCompanyContact-CompanyAddress-row');

            switch (sContactType)
            {
                case 'Client':
                case 'Customer':
                case 'ClientCandidate':
                    elemCompanyRow.show();
                    elemCompanyAddressRow.show();
                    break;

                default:
                    elemCompanyRow.hide();
                    elemCompanyAddressRow.hide();
            }
        };

        TriSysSDK.ContactTypes.PopulateCombo(sContactTypeField, fnChange);
    },

    // When user is assigning a company to a new contact
    CompanyLookup: function ()
    {
        const elemCompany = $('#newCompanyContact-Company');

        var fnSelectedCompany = function (lCompanyId, sCompanyName)
        {
            elemCompany.val(sCompanyName);

            // Show the company addresses too


            // Tried to re-use the original combo to select addresses, but it is not working due to the limited width
            //// Display a list of addresses to choose in a combo
            //var options = {
            //    Separator: '<br>' /*, KendoUI cannot handle <br> in the template so we are fucked
            //    template: '<span>#= text #</span>'*/
            //};
            //TriSysApex.ModalDialogue.CompanyAddresses.PopulateCombo(lCompanyId, 'newCompanyContact-Address', null, options);

            //const elemCompanyAddressRow = $('#newCompanyContact-WorkAddress-row');
            //elemCompanyAddressRow.show();

            // Instead, ask user to choose an existing address
            var fnSelectAddress = function (selectedRow)
            {
                if (!selectedRow)
                    return;

                // Read the fields we require from the selected row
                var lAddressId = selectedRow.AddressId;
                var lCompanyId = selectedRow.CompanyId;
                var sAddress = selectedRow.Address;

                // Show use which address they selected
                $('#newCompanyContact-CompanyAddress').text(sAddress);

                // Record these ID's for the record save later
                ctrlNewCompanyContact.Data.CompanyId = lCompanyId;
                ctrlNewCompanyContact.Data.AddressId = lAddressId;
                ctrlNewCompanyContact.Data.ContactType = TriSysSDK.CShowForm.GetTextFromCombo('newCompanyContact-Type');
                ctrlNewCompanyContact.Data.CompanyName = $('#newCompanyContact-Company').val();

                return true;
            };

            TriSysApex.ModalDialogue.CompanyAddresses.SelectForSmallFormFactorDevices(lCompanyId, sCompanyName, fnSelectAddress);

            return true;
        };

        debugger;
        var sCompany = elemCompany.val();

        const options = {
            AllowNoContact: true,
            Callback: fnSelectedCompany
        }
        TriSysApex.Pages.ContactForm.SelectCompany(options);
    },

    // Assigned before submission so that we know what the user changed, if anything from the LinkedIn profile
    Data:
    {
        CompanyId: 0,       // ctrlNewCompanyContact.Data.CompanyId
        AddressId: 0,       // ctrlNewCompanyContact.Data.AddressId
        ContactType: '',    // ctrlNewCompanyContact.Data.ContactType
        CompanyName: '',    // ctrlNewCompanyContact.Data.CompanyName
        LinkedIn: ''        // ctrlNewCompanyContact.Data.LinkedIn
    }

}   // ctrlNewCompanyContact

$(document).ready(function ()
{
    ctrlNewCompanyContact.Load();
});



