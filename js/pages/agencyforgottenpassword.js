var AgencyForgottenPassword =
{
    Load: function()
	{
		debugger;

		TriSysWebJobs.APIKeys.IdentifyWhiteLabelFromDomainURL();

        // Load credentials from cookies and auto-login if necessary
        var sEMail = TriSysWebJobs.Security.CachedEMail();
        $('#txtPasswordResetEMail').val(sEMail);

        // Capture enter key on password field
        $('#txtPasswordResetEMail').keyup(function (e)
        {
            if (e.keyCode == 13)
            {
                AgencyForgottenPassword.SubmitButtonClick();
            }
		} );

		// May 2018 - we may have a GUID in the URL
		var sURL = window.location.href;
		var parts = sURL.split( "/" );
		var sGUID = parts[parts.length - 2];
		if ( sGUID != "0" && sGUID )
		{
			var bGUID = (sGUID.length >= 36 && (sGUID.split("-").length - 1) == 4);

			if (bGUID) {
				// This is a GUID which we need to check against the database to see if it is a password reset
				TriSysApex.Forms.Login.ValidateResetPassword(sGUID);
				return;
			}
		}
    },

    SubmitButtonClick: function()
    {
        var sPasswordResetEMail = $('#txtPasswordResetEMail').val();

        var bCandidate = false;
        var bClient = false;
        TriSysWebJobs.PasswordReset.Submit(sPasswordResetEMail, bCandidate, bClient);
    }
};

$(document).ready(function ()
{
    AgencyForgottenPassword.Load();
});

