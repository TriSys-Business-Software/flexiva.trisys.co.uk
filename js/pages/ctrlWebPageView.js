// Warning: This does NOT work - Oct 2021 due to CORS

var ctrlWebPageView =
{
    Load: function ()
    {
        //var elem = $('#ctrlWebPageView-iFrame');

        var lHeight = $(window).height();

        var lWidth = $('#trisys-modal-dynamic-content').width() - 40;

        //elem.width(lWidth);

        var iFrameHeight = lHeight - 300;
        //elem.height(iFrameHeight);

        // Load the URL - nope CORS problem!
        //elem.attr('src', TriSysApex.ModalDialogue.WebPageView.URL);

        $('#ctrlWebPageView-content').load(TriSysApex.ModalDialogue.WebPageView.URL);
    }
};

$(document).ready(function () {
    ctrlWebPageView.Load();
});
