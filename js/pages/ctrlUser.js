var ctrlUser =
{
    // Our own flags to help contact menu functions
    ContactId: 0,
    CompanyId: 0,

    // Admin console form passes in the user ID
    Load: function ()
    {
        $('#user-form-loginname').focus();

        if (AdminConsole.EditUserId == 0 && AdminConsole.CloneFromUserId == 0)
        {
            // Programmer error - we can only create new users based upon existing users
            return;
        }
        
        ctrlUser.ContactId = 0;
        ctrlUser.CompanyId = 0;

        var bChangeEMailOnNameEdit = true;

        // Get user record from API if not a clone operation
        if (AdminConsole.EditUserId > 0)
        {
            // We are editing an existing user account
            ctrlUser.ReadUserFromWebAPI(AdminConsole.EditUserId);
            bChangeEMailOnNameEdit = false;
        }
        else
        {
            // This is a new user account for this recruitment agency
            $('#user-form-userid-tr').hide();
            $('#user-form-contact-tr').hide();
            $('#user-form-loggedin-locked-tr').hide();
            $('#user-form-last-login-tr').hide();
            //$('#user-form-password-tr').show();
            //$('#user-form-password-confirmation-tr').show();
			$('#user-form-add-account-help-tr').show();

            $('#user-form-loginname').attr('readonly', 'readonly');
            $('#user-form-email').attr("readonly", false);

            var userCredentials = TriSysApex.LoginCredentials.UserCredentials();
            var sCurrentEMail = userCredentials.LoggedInUser.FullName;
            var parts = sCurrentEMail.split("@");
            var sDomain = "@" + parts[1];
            $('#user-form-email').val(sDomain);
            $('#user-form-telno').val(userCredentials.LoggedInUser.Contact.WorkTelNo);           

            // Generate a random password
            var sPassword = ctrlUser.RandomPassword();
            $('#user-form-password').val(sPassword);
            $('#user-form-password-confirmation').val(sPassword);            
        }

        // As the user types, convert to a login name and an e-mail address
        $("#user-form-name").keyup(function (event)
        {
            var sName = $(this).val();
            if (sName)
            {
                var sLoginName = ctrlUser.RemoveInvalidCharactersFromLoginName(sName);
                $('#user-form-loginname').val(sLoginName);

                if (bChangeEMailOnNameEdit)
                    $('#user-form-email').val(sLoginName + sDomain);
            }
        });
        $('#user-form-name').focus();
    },

    RemoveInvalidCharactersFromLoginName: function(sLoginName)
    {
        // Cannot have ' or " etc..
        sLoginName = sLoginName.toLowerCase().replace(/ /g, ".");
        sLoginName = sLoginName.toLowerCase().replace(/\'/g, "");
        sLoginName = sLoginName.toLowerCase().replace(/"/g, "");

        return sLoginName;
    },

    RandomPassword: function()
    {
        var sPassword = TriSysSDK.Miscellaneous.GUID().replace(/-/g, '');
        sPassword = sPassword.substring(0, TriSysApex.Constants.iMinimumPasswordLength + 1);
        return sPassword;
    },

    ReadUserFromWebAPI: function (lUserId)
    {
        // Get either this user details or the one being cloned
        var CReadUserAccountRequest = {
            UserId: lUserId
        };

        var payloadObject = {};

        payloadObject.URL = "Users/ReadUserAccount";

        payloadObject.OutboundDataPacket = CReadUserAccountRequest;

        payloadObject.InboundDataFunction = function (CReadUserAccountResponse)
        {
            TriSysApex.UI.HideWait();

            if (CReadUserAccountResponse)
            {
                if (CReadUserAccountResponse.Success)
                {
                    // Write to screen fields
                    var CReadUserAccount = CReadUserAccountResponse.UserAccount;
                    $('#user-form-userid').val(CReadUserAccount.UserId);
                    $('#user-form-loginname').val(CReadUserAccount.LoginName);
                    $('#user-form-password').val(CReadUserAccount.Password);
                    $('#user-form-name').val(CReadUserAccount.FullName);
                    $('#user-form-telno').val(CReadUserAccount.TelNo);
                    TriSysSDK.CShowForm.SetCheckBoxValue('user-form-loggedin', CReadUserAccount.LoggedIn);
                    TriSysSDK.CShowForm.SetCheckBoxValue('user-form-locked', CReadUserAccount.Locked);

                    var sLastLogin = '';
                    if (CReadUserAccount.LastLoginDate)
                    {
                        if (moment(CReadUserAccount.LastLoginDate).year() > 1)
                            sLastLogin = moment(CReadUserAccount.LastLoginDate).format('dddd DD MMMM YYYY');
                    }
                    $('#user-form-last-login').html(sLastLogin);

                    if (CReadUserAccount.Photo)
                    {
                        $('#user-form-photo').attr('src', CReadUserAccount.Photo);
                        $('#user-form-photo').show();
                    }

                    if (CReadUserAccount.Contact)
                    {
                        var contact = CReadUserAccount.Contact;
                        ctrlUser.ContactId = contact.ContactId;
                        ctrlUser.CompanyId = contact.CompanyId;
                        var sContactSummary = contact.FullName + '\n' +
                            contact.CompanyName + 
                            (contact.CompanyAddressStreet ? '\n' +contact.CompanyAddressStreet : '') +
                            (contact.CompanyAddressCity ? '\n' +contact.CompanyAddressCity : '') +
                            (contact.WorkTelNo ? '\n' + contact.WorkTelNo : '');

                        $('#user-form-contact').val(sContactSummary);
                        $('#user-form-email').val(contact.WorkEMail);
                    }
                }
                else
                    TriSysApex.UI.ShowMessage(CReadUserAccountResponse.ErrorMessage);
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('ctrlUser.Load: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Reading User...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    ViewContactRecord: function()
    {
        if (ctrlUser.ContactId > 0)
        {
            TriSysApex.FormsManager.OpenForm("Contact", ctrlUser.ContactId);

            // Close this modal dialogue
            TriSysApex.UI.CloseModalPopup();
        }
    },

    ViewCompanyRecord: function()
    {
        if (ctrlUser.CompanyId > 0)
        {
            TriSysApex.FormsManager.OpenForm("Company", ctrlUser.CompanyId);

            // Close this modal dialogue
            TriSysApex.UI.CloseModalPopup();
        }
    },

    ValidateDataEntry: function()
    {
        var bCloneUser = (AdminConsole.CloneFromUserId > 0);
        var CWriteUserAccount = {};

        // Read from screen fields
        CWriteUserAccount.UserId = AdminConsole.EditUserId;
        CWriteUserAccount.CloneUserId = AdminConsole.CloneFromUserId;
        CWriteUserAccount.LoginName = $('#user-form-loginname').val();
        CWriteUserAccount.Password = $('#user-form-password').val();        // Disabled until security subsystem operational
        CWriteUserAccount.FullName = $('#user-form-name').val();
        CWriteUserAccount.TelNo = $('#user-form-telno').val();
        CWriteUserAccount.EMail = $('#user-form-email').val();
        CWriteUserAccount.LoggedIn = TriSysSDK.CShowForm.CheckBoxValue('user-form-loggedin');
        CWriteUserAccount.Locked = TriSysSDK.CShowForm.CheckBoxValue('user-form-locked');

        // Mandatory fields
        //if (!CWriteUserAccount.LoginName || !CWriteUserAccount.Password || !CWriteUserAccount.FullName)
        if (!CWriteUserAccount.LoginName || !CWriteUserAccount.FullName)
        {
            //TriSysApex.UI.ShowMessage("Please enter a login name, full name and password.");
            TriSysApex.UI.ShowMessage("Please enter a login name and full name.");
            return null;
        }

        // Password must fit our desired length
        var sError = TriSysApex.LoginCredentials.ValidatePassword(CWriteUserAccount.Password);
        if (sError)
        {
            // The original TriSys password can be any length.
            // We do not allow this in Apex/API land so reset this

            // Generate a random password
            CWriteUserAccount.Password = ctrlUser.RandomPassword();
        }

        // Full name must contain at least one space
        var bSpaceFound = (CWriteUserAccount.FullName.indexOf(" ") > 0);
        if (!bSpaceFound)
        {
            TriSysApex.UI.ShowMessage("Please enter a full name containing at least a forename and surname.");
            return null;
        }

        if (bCloneUser)
        {
            var sPasswordConfirmation = $('#user-form-password-confirmation').val();
            if(CWriteUserAccount.Password != sPasswordConfirmation)
            {
                TriSysApex.UI.ShowMessage("Password and confirmation do not match.");
                return null;
            }

            if(!TriSysApex.LoginCredentials.validateEmail(CWriteUserAccount.EMail))
            {
                TriSysApex.UI.ShowMessage("Please enter a valid e-mail address.");
                return null;
            }
        }

        // OK - send to server for other validity checking and submission
        return CWriteUserAccount;
    },

    SaveButtonClick: function (lCRMContactId)
    {
        var CWriteUserAccount = ctrlUser.ValidateDataEntry();
        if (!CWriteUserAccount)
            return;

		CWriteUserAccount.CRMContactId = lCRMContactId;

        // User is prompted for options
        var bCloneUser = (AdminConsole.CloneFromUserId > 0);
        if (bCloneUser)
        {
			var fnSaveUser = function()
			{
				setTimeout(function ()
                {
                    ctrlUser.SubmitSaveToWebAPI(CWriteUserAccount);
                }, 50);
			};

			// New: Do not prompt
			fnSaveUser();
			return;

			// Old:
            // This is a new user account, so creator must be told of the terms and conditions
            ctrlUser.PromptForConfirmationOfNewUserAccount(function ()
            {
				fnSaveUser();
                return true;
            });
        }
        else
            ctrlUser.SubmitSaveToWebAPI(CWriteUserAccount);        
    },

	// User account already exists, but we want to re-send the activation code effectively allowing the
    // recipient to set their password afresh.
    SendActivationCodeForExistingUserAccount: function()
    {
        var CWriteUserAccount = ctrlUser.ValidateDataEntry();
        if (!CWriteUserAccount)
            return;

        // After saving the user record, as the API to send an activation code to the e-mail address
        var fnCallback = function(lUserId)
        {
            var CSendActivationCode = { UserId: lUserId };

            var payloadObject = {};

            payloadObject.URL = "Users/SendActivationCode";

            payloadObject.OutboundDataPacket = CSendActivationCode;

            payloadObject.InboundDataFunction = function (CSendActivationCodeResponse)
            {
                TriSysApex.UI.HideWait();

                if (CSendActivationCodeResponse)
                {
                    if (CSendActivationCodeResponse.Success)
                    {
                        AdminConsole.PostSaveUserAccountEvent(null, lUserId);

                        return;
                    }
                    else
                        TriSysApex.UI.ShowMessage(CSendActivationCodeResponse.ErrorMessage);
                }
            };

            payloadObject.ErrorHandlerFunction = function (request, status, error)
            {
                TriSysApex.UI.HideWait();
                TriSysApex.UI.errorAlert('ctrlUser.SendActivationCodeForExistingUserAccount: ' + status + ": " + error + ". responseText: " + request.responseText);
            };

            TriSysApex.UI.ShowWait(null, "Sending Activation Code...");
            TriSysAPI.Data.PostToWebAPI(payloadObject);
        }

        ctrlUser.SubmitSaveToWebAPI(CWriteUserAccount, fnCallback);
    },



    // User is prompted with acceptance of account creation
    PromptForConfirmationOfNewUserAccount: function (fnCallbackOnAgree)
    {
        var parametersObject = new TriSysApex.UI.ShowMessageParameters();
        parametersObject.Title = TriSysApex.Copyright.ShortProductName + " New Account Terms &amp; Conditions";
        parametersObject.Image = "gi-more_items";
        parametersObject.Maximize = true;

        parametersObject.ContentURL = TriSysApex.Constants.UserControlFolder + "ctrlAddUserTermsAndConditions.html";

        parametersObject.ButtonLeftText = "I Agree";
        parametersObject.ButtonLeftVisible = true;
        parametersObject.ButtonLeftFunction = fnCallbackOnAgree;

        parametersObject.ButtonCentreText = "View Full Terms &amp; Conditions";
        parametersObject.ButtonCentreVisible = true;
        parametersObject.ButtonCentreFunction = function()
        {
            setTimeout(TriSysApex.ModalDialogue.TermsAndConditions.Show, 50);
            return true;
        };

        parametersObject.ButtonRightText = "Cancel";
        parametersObject.ButtonRightVisible = true;

        TriSysApex.UI.PopupMessage(parametersObject);
    },

    SubmitSaveToWebAPI: function (CWriteUserAccount, fnCallback)
    {
        var payloadObject = {};

        // Call the API to submit the data to the server
        payloadObject.URL = "Users/WriteUserAccount";

        payloadObject.OutboundDataPacket = CWriteUserAccount;

        payloadObject.InboundDataFunction = function (CWriteUserAccountResponse)
        {
            TriSysApex.UI.HideWait();

            if (CWriteUserAccountResponse)
            {
                if (CWriteUserAccountResponse.Success)
                {
					// Repoint cache
                    TriSysApex.Cache.cachedStandingDataInMemory.Users = CWriteUserAccountResponse.Users;

                    if (fnCallback)
                        fnCallback(CWriteUserAccountResponse.UserId);
                    else
                        AdminConsole.PostSaveUserAccountEvent(CWriteUserAccountResponse);

                    return;
                }
                else
                    TriSysApex.UI.ShowMessage(CWriteUserAccountResponse.ErrorMessage);
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('ctrlUser.Save: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Saving User...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    }
};

// Now display the document 
$(document).ready(function ()
{
    ctrlUser.Load();
});