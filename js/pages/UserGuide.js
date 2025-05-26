var UserGuide =
{
    Load: function ()
    {
        var iFudgeFactor = 30;
        var lHeight = TriSysApex.Pages.Index.FormHeight() - iFudgeFactor;
        $('#user-guide-frame').height(lHeight);
    }
};

$(document).ready(function ()
{
    UserGuide.Load();
});
