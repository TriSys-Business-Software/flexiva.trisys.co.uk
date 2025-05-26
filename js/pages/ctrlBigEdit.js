var ctrlBigEdit =
{
    Load: function ()
    {
        var txt = $('#ctrlBigEdit-Text');

        txt.focus();

        // Calculate the number of rows we should show based on height
		var iInstructionsHeight = $('#ctrlBigEdit-Instructions').height();
        var iHeight = $(window).height() - 200 - iInstructionsHeight;
        var iRows = parseInt(iHeight / 25);
        txt.attr('rows', iRows);
        $('#ctrlBigEdit-Text textarea').attr('rows', 20);
    },

    GetText: function ()
    {
        return $('#ctrlBigEdit-Text').val();
    },

    // 06 Mar 2024
    ReadOnlyMode: function()
    {
        var txt = $('#ctrlBigEdit-Text');
        txt.attr('readonly', 'readonly');
    }
    
};

$(document).ready(function ()
{
    ctrlBigEdit.Load();
});