var RequirementSearch =
{
    Load: function ()
    {
        // Load the standard entity search control and set the entity name afterwards
        TriSysApex.EntitySearch.LoadControl('requirement-search-placeholder', "Requirement");
    }
};

$(document).ready(function ()
{
    RequirementSearch.Load();
});