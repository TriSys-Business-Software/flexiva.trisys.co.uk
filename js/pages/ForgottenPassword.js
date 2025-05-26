var ForgottenPassword =
{
    Load: function ()
    {
        // Load credentials from cookies
        var credentialPacket = TriSysWeb.Security.ReadPersistedLoginCredentials();
        if (credentialPacket)
        {
            sEMailAddress = credentialPacket.EMailAddress;
            if (sEMailAddress)
                $('#txtPasswordResetEMail').val(sEMailAddress);
        }

        // Capture enter key on password field
        $('#txtPasswordResetEMail').keyup(function (e)
        {
            if (e.keyCode == 13)
            {
                ForgottenPassword.SubmitButtonClick();
            }
        });
    },

    SubmitButtonClick: function ()
    {
        // Make call to web service to validate this e-mail address via the appropriate method
        TriSysApex.Forms.ForgottenPassword.ButtonClick('txtPasswordResetEMail');
    }
};

$(document).ready(function ()
{
    ForgottenPassword.Load();
});

