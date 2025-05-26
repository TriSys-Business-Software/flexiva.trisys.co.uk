var ctrlChangeLoginCredentials =
{
    Load: function()
    {
        var sEMail = null;
        var userCredentials = TriSysApex.LoginCredentials.UserCredentials();
        if (userCredentials && userCredentials.LoggedInUser)
        {
            var sEMail = userCredentials.LoggedInUser.FullName;
        }
        else
        {
            // Must be an activation, so hide old password
            $('#change-login-credentials-old-password-tr').hide();
            $('#change-login-credentials-email').attr('readonly', 'readonly');
            $('#change-login-credentials-password').focus();
            //if(loginPage)
            //    sEMail = loginPage.ActivationEMail;

            if(TriSysApex.Forms.Login.resetPasswordData)
            {
                sEMail = TriSysApex.Forms.Login.resetPasswordData.EMail;
            }
        }

        $('#change-login-credentials-email').val(sEMail);
    },

    // Validate and submit changes
    SaveLoginCredentialsButtonClick: function (fnCallback)
    {
        var CChangeLoginCredentials = ctrlChangeLoginCredentials.Validate();
        if (CChangeLoginCredentials)
            ctrlChangeLoginCredentials.SubmitChangeRequest(CChangeLoginCredentials, fnCallback);
        
        return false;
    },

    SubmitChangeRequest: function (CChangeLoginCredentials, fnCallback)
    {
        var payloadObject = {};

        // Call the API to submit the data to the server
        payloadObject.URL = "Users/ChangeLoginCredentials";

        payloadObject.OutboundDataPacket = CChangeLoginCredentials;

        payloadObject.InboundDataFunction = function (CChangeLoginCredentialsResponse)
        {
            TriSysApex.UI.HideWait();

            if (CChangeLoginCredentialsResponse)
            {
                if (CChangeLoginCredentialsResponse.Success)
                {
                    ctrlChangeLoginCredentials.OnSuccessfulChange(fnCallback, CChangeLoginCredentials.EMail);

                    return;
                }
                else
                    TriSysApex.UI.ShowMessage(CChangeLoginCredentialsResponse.ErrorMessage);
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('ctrlChangeLoginCredentials.SubmitChangeRequest: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Saving Changes...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    OnSuccessfulChange: function (fnCallback, sEMail)
    {
        var userCredentials = TriSysApex.LoginCredentials.UserCredentials();
        if (userCredentials && userCredentials.LoggedInUser)
        {
            userCredentials.LoggedInUser.FullName = sEMail;
        }

        // Close this modal dialogue
        TriSysApex.UI.CloseModalPopup();

        setTimeout(function ()
        {
            fnCallback(sEMail);
        }, 50);
    },

    Validate: function(bActivate)
    {
        var CChangeLoginCredentials = {};

        // Read from screen fields
        CChangeLoginCredentials.EMail = $('#change-login-credentials-email').val();
        CChangeLoginCredentials.OldPassword = $('#change-login-credentials-old-password').val();
        CChangeLoginCredentials.NewPassword = $('#change-login-credentials-password').val();
        var sPasswordConfirmation = $('#change-login-credentials-password-confirmation').val();

        // Mandatory fields
        if (!CChangeLoginCredentials.EMail )
        {
            TriSysApex.UI.ShowMessage("Please complete e-mail field.");
            return null;
        }

        if (!CChangeLoginCredentials.NewPassword)
        {
            TriSysApex.UI.ShowMessage("Please complete new password field.");
            return null;
        }

        if (!bActivate && !CChangeLoginCredentials.OldPassword)
        {
            TriSysApex.UI.ShowMessage("Please complete old password field.");
            return null;
        }

        if (!TriSysApex.LoginCredentials.validateEmail(CChangeLoginCredentials.EMail))
        {
            TriSysApex.UI.ShowMessage("Please enter a valid e-mail address.");
            return null;
        }

        // Passwords must fit our desired length
        if (!bActivate)
        {
            var sErrorOld = TriSysApex.LoginCredentials.ValidatePassword(CChangeLoginCredentials.OldPassword);
            if (sErrorOld)
            {
                TriSysApex.UI.ShowMessage(sErrorOld);
                return null;
            }
        }

        var sError = TriSysApex.LoginCredentials.ValidatePassword(CChangeLoginCredentials.NewPassword);
        if (sError)
        {
            TriSysApex.UI.ShowMessage(sError);
            return null;
        }

        if (CChangeLoginCredentials.NewPassword != sPasswordConfirmation)
        {
            TriSysApex.UI.ShowMessage("New password and confirmation do not match.");
            return null;
        }

        return CChangeLoginCredentials;
    },

    ActivateUserAccountButtonClick: function (fnCallback)
    {
        var CChangeLoginCredentials = ctrlChangeLoginCredentials.Validate(true);
        if (CChangeLoginCredentials)
            fnCallback(CChangeLoginCredentials);

        return false;
    }
};


$(document).ready(function ()
{
    ctrlChangeLoginCredentials.Load();
});
