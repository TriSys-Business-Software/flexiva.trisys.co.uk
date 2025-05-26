var iFrameDialogue =
{
    Load: function () {
        var iHeightFactor = 310;
        var lHeight = $(window).height() - iHeightFactor;
        $('#container-div').height(lHeight);
    }
};

$(document).ready(function () {
    iFrameDialogue.Load();
});