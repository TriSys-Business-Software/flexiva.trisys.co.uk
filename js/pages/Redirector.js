// Copied from TriSys Support Portal for GDPR compliance on Mon 21 May 2018
//
var Redirector =
{
    Load: function ()
	{
		debugger;

		// https://opus-laboris-recruitment.trisys.co.uk/?Redirector/88071e2c-c9ae-4796-9bf5-0f74ed6215cc/EditCandidateAccountDetails/5
        // https://opus-laboris-recruitment.trisys.co.uk/?Redirector/88071e2c-c9ae-4796-9bf5-0f74ed6215cc/ClientEditAccountDetails/5
        // https://support.trisys.co.uk/?Redirector/9516ab9c-0598-48e2-a746-aeebcee4192d/CloudSync

		var sURL = window.location.href;		
        var slashParts = sURL.split('/');

		var sAPIKeyId = slashParts[slashParts.length - 1];
		var sForm = slashParts[slashParts.length - 2];
        var sGUID = slashParts[slashParts.length - 3];

		$('#Redirector-Debug').html("sAPIKeyId=" + sAPIKeyId + "<br/>" + "GUID=" + sGUID + "<br/>" + "Form=" + sForm);

		if (sGUID && sAPIKeyId && sForm)
        {
            // Read Web API to get login credentials and commence auto-login sequence
			Redirector.IdentifyLoginCredentialsFromGUID(sURL, sGUID, sAPIKeyId, sForm);
        }
    },

	IdentifyLoginCredentialsFromGUID: function (sURL, sGUID, sAPIKeyId, sForm)
    {
			var CReadCampaignRecipientLoginCredentialsRequest = {
				GUID: sGUID,
				APIKeyId: sAPIKeyId,
				URL: sURL
			};

        var payloadObject = {};

        payloadObject.URL = "Marketing/ReadCampaignRecipientLoginCredentials";

        payloadObject.OutboundDataPacket = CReadCampaignRecipientLoginCredentialsRequest;

        payloadObject.InboundDataFunction = function (CReadCampaignRecipientLoginCredentialsResponse)
        {
            if (CReadCampaignRecipientLoginCredentialsResponse)
            {
                debugger;
                if (CReadCampaignRecipientLoginCredentialsResponse.Success)
                {
					var sLoginName = null, sPassword = null;
					var sLoginType = CReadCampaignRecipientLoginCredentialsResponse.LoginType;

                    // Decrypt credentials
                    if (CReadCampaignRecipientLoginCredentialsResponse.LoginName)
                        sLoginName = $.base64.decode(CReadCampaignRecipientLoginCredentialsResponse.LoginName);

                    if (CReadCampaignRecipientLoginCredentialsResponse.Password)
                        sPassword = $.base64.decode(CReadCampaignRecipientLoginCredentialsResponse.Password);

                    // Persist for the login
					switch (sLoginType) {

						case "User":
							var credentialPacket = {
								EMailAddress: sLoginName,
								Password: sPassword
							};
							TriSysWeb.Security.WritePersistedLoginCredentials(credentialPacket);
							break;

						case "Client":
						case "Candidate":
							TriSysWebJobs.Security.CacheLoginCredentialsAsCookies(sLoginName, sPassword, true);
							break;
					}

					// Nov 2018: Redirect after storing login credentials
					var sRedirectURL = CReadCampaignRecipientLoginCredentialsResponse.RedirectURL;
					if(sRedirectURL)
					{
						if(sForm)
							TriSysWebJobs.Security.CachePostLoginFormName(sForm);				

						window.location.href = sRedirectURL;
						return;
					}

					// The code below is not going to work for web jobs because the customer may have a 
					// custom navbar/forms.json and custom code.
					// So we must therefore refresh the entire application to ensure that all custom code
					// and config gets loaded, and only then can we auto=login.

					// Reconfigure default page after login
					if (sForm)
					{
						for (var i = 0; i < TriSysApex.Forms.Configuration.Pages.length; i++)
						{
							var page = TriSysApex.Forms.Configuration.Pages[i];

							switch (sLoginType) {

								case "User":
									if (page.PostLoginPageForUser)
										page.PostLoginPageForUser = false;

									if (page.FormName.toLowerCase() == sForm.toLowerCase())
										page.PostLoginPageForUser = true;
									break;

								case "Client":
									if (page.PostLoginPageForClient)
										page.PostLoginPageForClient = false;

									if (page.FormName.toLowerCase() == sForm.toLowerCase())
										page.PostLoginPageForClient = true;
									break;

								case "Candidate":
									if (page.PostLoginPageForCandidate)
										page.PostLoginPageForCandidate = false;

									if (page.FormName.toLowerCase() == sForm.toLowerCase())
										page.PostLoginPageForCandidate = true;
									break;
							}							
						}
					}

                    // Open login form to auto-login
                    var options = { ignoreURLParameters: true };
					TriSysApex.FormsManager.OpenForm(sLoginType + 'Login', 0, true, options);
                }
                else
                {
                    // We may fail on the server back-end based upon numerous business rules.
                    $('#Redirector-Spinner').hide();
                    $('#Redirector-Message').html(CReadCampaignRecipientLoginCredentialsResponse.ErrorMessage);
                    $('#Redirector-Debug').hide();
                }
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.errorAlert('Redirector.IdentifyLoginCredentialsFromGUID: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysAPI.Data.PostToWebAPI(payloadObject);        
    }
};
