var ctrlHelpVideo =
{
    Load: function()
    {
        var elem = $('#ctrlHelpVideo-iFrame');

        var lHeight = TriSysApex.TourGuide.VideoDialogueHeight();

        var lWidth = TriSysApex.TourGuide.VideoDialogueWidth() - 100;

        var bPhone = TriSysApex.Device.isPhone();
        if (bPhone)
            lWidth = $(window).width() - 40;

        elem.width(lWidth);

        var iFrameHeight = lHeight - 300;
        elem.height(iFrameHeight);

        if (!bPhone)
        {
            // Reduce size of video to prevent scroll bars
            lHeight = iFrameHeight * 0.9;
            lWidth -= 200;
        }

        // Send the size parameters into the URL also
        lHeight = 0;
        var sURL = TriSysApex.TourGuide.CurrentVideo + "&height=" + lHeight + "&width=" + lWidth;

        // Load the video for the current form
        elem.attr('src', sURL);

        // Tweak for certain browsers
        ctrlHelpVideo.HideBackgroundDimColour();
    },

    // The <video> tag buggers up the modal background on Chrome
    // This is a fix
    HideBackgroundDimColour: function()
    {
        if (TriSysSDK.Browser.Chrome())
        {
            //$('.modal-backdrop').css('background-color', 'pink');
            $('.modal-backdrop').css('opacity', 0);
        }
    }
};

$(document).ready(function ()
{
    ctrlHelpVideo.Load();
});
