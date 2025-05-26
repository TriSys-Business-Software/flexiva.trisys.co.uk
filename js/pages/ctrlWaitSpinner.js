var ctrlWaitSpinner =
{
    Load: function(sPrefix, lHeight)
    {
        var lBackColour = TriSysProUI.BackColour();
        var elem = $('#' + sPrefix + 'ctrlWaitSpinner-image');
        elem.css("color", lBackColour);

        if (lHeight > 0)
            elem.css("line-height", lHeight + 'px');
    }
};
