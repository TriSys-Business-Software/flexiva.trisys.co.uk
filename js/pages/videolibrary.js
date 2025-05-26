
// We are loaded dynamically after main SPA is loaded
$(document).ready(function ()
{
    var sVideoURL = "//www.trisys.co.uk/video/V10-Product-Video-Library.aspx";
    $("#objectVideoLibrary").html('<object data=' + sVideoURL + ' id="videoLibraryFrame" />');
    //$("#objectVideoLibrary").load(sVideoURL);

    DoHeight();
});

function DoHeight()
{
    TriSysSDK.EntityFormTabs.ResizeEventManagement(null,
        function (lHeight)
        {
            // Cheat and turn off vertical scrollbar
            lHeight = 4500;
            $("#videoLibraryFrame").height(lHeight);

            var iFudgeFactor = 10;
            var lWidth = $('#videoLibraryBlock').width() - iFudgeFactor;   // TriSysApex.Pages.Index.FormWidth();
            $("#videoLibraryFrame").width(lWidth);
        }, true);
}
