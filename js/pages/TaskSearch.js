var TaskSearch =
{
    Load: function () {
        // Load the standard entity search control and set the entity name afterwards
        TriSysApex.EntitySearch.LoadControl('task-search-placeholder', "Task");
    }
};

$(document).ready(function () {
    TaskSearch.Load();
});