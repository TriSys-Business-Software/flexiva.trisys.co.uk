var CandidateRegistrationConfirmation =
{
    // URL processing to allow correct order of custom app loading before execution
    LoadFromURL: function (sParameters)
    {
        // Will TriSysAPI.Session.Memory.Get(TriSysWebJobs.Constants.CandidateRegistrationConfirmationForm) be set?
        //var sGUID = TriSysApex.Pages.Controller.ParseLoadRecordURLParameter(sParameters, 0);

		// Nope (05 Sep 2018) - because the sParameters is the CustomerID e.g. cosector
		// Whereas the command line is:
		//  http.../?CandidateRegistrationConfirmation/18676a8c-3740-428f-98f2-ebc93176baf2/cosector
		var parts = TriSysApex.Constants.OriginalURL.split("?");
		parts = parts[1].split("/");
		var sGUID = parts[1];

        CandidateRegistrationConfirmation.Load(sGUID);
    },

    Load: function (sGUID)
    {
        // Display the GUID
        $('#lblCandidateRegistrationConfirmationGUID').html(sGUID);

        // If confirmed, we show the confirmed details and allow the user to proceed
        var fnSuccess = function (sName, sEMail, sPassword)
        {
            // Display the name and e-mail of the new candidate
            $('#form-group-guid').hide();
            $('#form-group-name').show();
            $('#lblCandidateRegistrationConfirmationName').html(sName);
            $('#form-group-email').show();
            $('#lblCandidateRegistrationConfirmationEMail').html(sEMail);

			// Sep 2018: Allow custom webjobs to intercept this and force additional validation before candidate details are created
			if(TriSysWebJobs.Constants.ConfirmedRegistrationPreLoginPage)
			{
				// e.g. "CandidateApplicationEligibility"	//  CoSector project
				TriSysApex.FormsManager.OpenForm(TriSysWebJobs.Constants.ConfirmedRegistrationPreLoginPage, sGUID, true);
				return;
			}

            // Store the credentials as cookies
            TriSysWebJobs.Security.CacheLoginCredentialsAsCookies(sEMail, sPassword, true);

            // Wait for the user to commence login using this button
            $('#form-group-login-button').show();
        };

        var fnFailure = function (sReason)
        {
            // Show the reason why the confirmation failed
            $('#form-group-error').show();
            $('#span-confirm-error').show();
            $('#span-confirm-ok').hide();
            $('#lblCandidateRegistrationConfirmationError').html(sReason);
        };

        // Commence the retrieval of the GUID from Web API
        TriSysWebJobs.CandidateRegistration.ProcessGUIDConfirmation(sGUID, fnSuccess, fnFailure);
    },

    LoginButtonClick: function()
    {
        // Open the login form with their credentials
        TriSysApex.FormsManager.OpenForm(TriSysWebJobs.Constants.CandidateLoginForm, 0, true);

        // Why?
        // So that they can choose right now whether they wish to retain credentials on this computer
    }
};

$(document).ready(function ()
{
    // 04 Mar 2017 - wait for LoadFromURL event
    //CandidateRegistrationConfirmation.Load();
});
