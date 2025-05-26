var TriSysLinkedIn =
{
    Load: function()
    {
        var sLinkedInURL = "//www.linkedin.com";
        //var sLinkedInURL = "http://development.trisys.co.uk";

        // Cannot do any way other than iframe for cross-domain
        //$("#linkedinWebPage").html('<object data=' + sLinkedInURL + ' id="linkedInFrame" />');
        //$("#linkedinWebPage").load(sLinkedInURL);
        
        // Cannot do LinkedIn because it prevents cross site embedding in iframes

        //var iframe = document.getElementById('linkedinWebPage');
        //iframe.src = sLinkedInURL;
    }
};


// Now display the document 
$(document).ready(function ()
{
    TriSysLinkedIn.Load();
});
