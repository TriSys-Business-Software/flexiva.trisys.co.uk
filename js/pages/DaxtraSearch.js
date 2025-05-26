// 31 May 2023: Enabling Daxtra Search
//
var DaxtraSearch =
{
    iFrame: 'daxtra-search-iframe',

    Load: function()
    {
        // Work out who the customer is?
        TriSysApex.Forms.Daxtra.CallWebAPIToGetURL('nexere', null, null, DaxtraSearch.OpenURL);
    },

    OpenURL: function(sURL)
    {
        var elemiFrame = $('#' + DaxtraSearch.iFrame)
        elemiFrame.attr('src', sURL);

        var iWidthFactor = 20;
        var iWidth = $('#daxtra-block').width() - iWidthFactor;
        elemiFrame.width(iWidth);

        var iHeightFactor = 185;
        var lHeight = $(window).height() - iHeightFactor;
        elemiFrame.height(lHeight);
    }
};

$(document).ready(function () {
    DaxtraSearch.Load();
});
