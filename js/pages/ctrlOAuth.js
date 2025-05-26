var ctrlOAuth = {

    // Use specified URL in iFrame
    LoadURL: function (sSecureURL)
    {
        var iFrame = $('#crlOAuth-iFrame-URL');
        iFrame.attr('src', sSecureURL);
    }
};

$(document).ready(function () {
    ctrlOAuth.Load();
});
