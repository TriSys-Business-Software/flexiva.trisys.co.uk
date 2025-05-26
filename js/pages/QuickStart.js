var QuickStart =
{
    Load: function ()
    {
        var iFudgeFactor = 30;
        var lHeight = TriSysApex.Pages.Index.FormHeight() - iFudgeFactor;
        $('#quick-start-frame').height(lHeight);
    }
};

$(document).ready(function ()
{
    QuickStart.Load();
});
