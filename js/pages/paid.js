var subscriptionPaid = 
{
	Load: function()
	{
		// Ideally we would get URL parameters allowing us to proceed to show the user the progress of provisioning?
		// https://apex.trisys.co.uk/?Paid&amt=1.00&cc=GBP&cm=65687900-dd69-41aa-bf2a-8107787a916d
		//  &sig=lLKg6i00L7ir4wRpXMlvoJm%2FzDSVIBArNC0SA0TatGTVbkkjBmiNzAlwdabMN4Atfrg6da34R0WYuOwk5FS%2F8B4cpO%2FhRxb4dj89DHGXgBlimeLktDK%2FaHGa58dc15LWNVAnqBNsuUf%2FTqF23DP8jImCZUfR44a1%2BZQ2dhpCtlg%3D
		//  &st=Completed&tx=7FG43877XK8525901
		
		var sURL = window.location.href;
 
		var sGUID = TriSysApex.URL.Parser(sURL).getParam("cm");
        if (sGUID)
        {
            // Customer has now paid so we can show them the provisioning progress because the actual 'behind the scenes'
			// notification from PayPal may not come through for a few seconds, and of course provisioning will start.
			subscriptionPaid.DisplayProvisioningProgressAfterPaymentComplete(sGUID);
        }
	},

	DisplayProvisioningProgressAfterPaymentComplete: function(sGUID)
	{
		var parametersObject = new TriSysApex.UI.ShowMessageParameters();

        parametersObject.Title = "Subscription Provisioning";
        parametersObject.Image = "gi-gbp";
        parametersObject.Maximize = true;
        parametersObject.CloseTopRightButton = true;

        parametersObject.ContentURL = TriSysApex.CustomFormsAndComponents.UserControlPath("ctrlPaymentGateway.html");

		// Feed in the payment URL when loaded
		parametersObject.OnLoadCallback = function ()
        {
            ctrlPaymentGateway.LoadAfterPaymentCompleted(sGUID);
        };

        // Buttons
        parametersObject.ButtonLeftVisible = true;
        parametersObject.ButtonLeftText = "Cancel";
        parametersObject.ButtonLeftFunction = function ()
        {
            return true;
        };
        
        TriSysApex.UI.PopupMessage(parametersObject);
	},

	// Called from ctrlPaymentGateway.js
	UserAccountProvisioning: function(sAccountName)
	{
		var sDescription = 'We have received your subscription payment and the user account is now being activated.';
		$('#paid-description').html(sDescription);
		$('#paid-table').hide();
		$('#paid-user-account').show();
		$('#paid-user-account-name').html(sAccountName);
	}
};

$(document).ready(function ()
{
    subscriptionPaid.Load();
});
