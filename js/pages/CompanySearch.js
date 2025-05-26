var CompanySearch =
{
    Load: function ()
    {
        // Load the standard entity search control and set the entity name afterwards
        TriSysApex.EntitySearch.LoadControl('company-search-placeholder', "Company");
    }
};

$(document).ready(function ()
{
    CompanySearch.Load();
});