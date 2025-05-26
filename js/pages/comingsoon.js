$(document).ready(function ()
{
    TriSysLoad.ApexFramework.LoadDynamically(function ()
    {
        // Post-Live
        var sSecureURL = "https://apex.trisys.co.uk";
        window.location.replace(sSecureURL);
        return;

        // Pre-Live
        // We are now ready to capture the e-mail
        TriSysApex.ComingSoon.Initialise();
    });
});