var ctrlNewCompanyOrAddress =
{
    Load: function()
    {
        TriSysSDK.CShowForm.AddressTypesCombo('newCompanyOrAddress-AddressType');

        var divCompanyName = '#newCompanyOrAddress-CompanyName';
        $(divCompanyName).val(TriSysApex.ModalDialogue.NewCompanyAddress.CompanyName);

        if (TriSysApex.ModalDialogue.NewCompanyAddress.NewCompany)
        {
            $(divCompanyName).removeAttr('readonly');
            $(divCompanyName).focus();
            $('#newCompanyOrAddress-EditCompanyOnSavePanel').show();
        }
        else if (TriSysApex.ModalDialogue.NewCompanyAddress.CompanyId > 0 && TriSysApex.ModalDialogue.NewCompanyAddress.AddressId > 0)
        {
            // Edit company address, so read from API

            // Jan 2018: Use a dedicated API method which abstracts the underlying SQL and does not use 'SQLDatabase/SQL_Select'
            var fnPopulationByFunction = {
                API: "Company/Address",                     // The Web API Controller/Function

                // The additional parameters passed into the function not including the paging metrics
                Parameters: function (request)
                {
                    request.CompanyId = TriSysApex.ModalDialogue.NewCompanyAddress.CompanyId;
                    request.AddressId = TriSysApex.ModalDialogue.NewCompanyAddress.AddressId;
                },

                DataTableFunction: function (response)      // Called to get a suitable data table for the grid to display
                {
                    if(response.Address)
                    {
                        var address = response.Address;

                        TriSysSDK.CShowForm.SetTextInCombo('newCompanyOrAddress-AddressType', address.Type);
                        $('#newCompanyOrAddress-Street').val(address.Street);
                        $('#newCompanyOrAddress-City').val(address.City);
                        $('#newCompanyOrAddress-County').val(address.County);
                        $('#newCompanyOrAddress-PostCode').val(address.PostCode);

                        var sCountry = address.Country;
                        if (!sCountry)
                            sCountry = TriSysSDK.Countries.DefaultCountryName;
                        TriSysSDK.CShowForm.SetTextInCombo('newCompanyOrAddress-Country', sCountry);

                        $('#newCompanyOrAddress-TelNo').val(address.TelNo);
                    }
                }
            };
            
            TriSysSDK.Database.GetDataSetFromFunction(fnPopulationByFunction);
        }

        if (!TriSysApex.ModalDialogue.NewCompanyAddress.NewCompany)
            $('#newCompanyOrAddress-CompanyName-tr').hide();
        

        if (TriSysApex.ModalDialogue.NewCompanyAddress.HideCompanyBlock)
            ctrlNewCompanyOrAddress.HideCompanyBlock();

        // Countries
        TriSysWebJobs.CandidateRegistration.LoadCountryLookup("newCompanyOrAddress-Country");
    },

    PostCodeLookup: function()
    {
        TriSysSDK.PostCode.Lookup('newCompanyOrAddress-PostCode',
                                'newCompanyOrAddress-Street',
                                'newCompanyOrAddress-City',
                                'newCompanyOrAddress-County',
                                'newCompanyOrAddress-Country');
    },

    HideCompanyBlock: function()
    {
        $('#newCompanyOrAddress-CompanyName-tr').hide();
        $('#newCompanyOrAddress-AddressType-tr').hide();
    }
};

$(document).ready(function ()
{
    ctrlNewCompanyOrAddress.Load();
});
