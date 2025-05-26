var ContactSearch =
{
    Load: function()
    {
        // Load the standard entity search control and set the entity name afterwards
        TriSysApex.EntitySearch.LoadControl('contact-search-placeholder', "Contact");
    }
};

$(document).ready(function ()
{
    ContactSearch.Load();
});