var PlacementSearch =
{
    Load: function ()
    {
        // Load the standard entity search control and set the entity name afterwards
        TriSysApex.EntitySearch.LoadControl('placement-search-placeholder', "Placement");
    }
};

$(document).ready(function ()
{
    PlacementSearch.Load();
});