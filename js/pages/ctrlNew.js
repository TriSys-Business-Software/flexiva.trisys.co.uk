var ctrlNew =
{
    Load: function()
    {
        $('#ctrlNew-Name').focus();
    },

    GetName: function()
    {
        return $('#ctrlNew-Name').val();
    }
};

$(document).ready(function ()
{
    ctrlNew.Load();
});