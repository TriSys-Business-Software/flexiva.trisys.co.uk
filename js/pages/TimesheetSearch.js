var TimesheetSearch =
{
    Load: function ()
    {
        // Load the standard entity search control and set the entity name afterwards
        TriSysApex.EntitySearch.LoadControl('timesheet-search-placeholder', "Timesheet");
    }
};

$(document).ready(function ()
{
    TimesheetSearch.Load();
});