var Welcome = 
{
	Load: function()
	{
		// Hide sections if not admin
		var userCredentials = TriSysApex.LoginCredentials.UserCredentials();
        if (userCredentials && userCredentials.LoggedInUser)
        {
            var contact = userCredentials.LoggedInUser.Contact;
            if (contact)
            {
                var bSystemsAdministrator = TriSysApex.Cache.UserGroupManager.SystemAdministrator(userCredentials.LoggedInUser.UserId); 
				if(!bSystemsAdministrator)
					$('#welcome-company-configuration-block').hide();
			}
		}
	},

	OpenClientContact: function()
	{
		TriSysApex.Pages.ContactForm.NewRecord();
		Welcome.SetContactType("Client");
		Welcome.FocusOnTab('contact-form-tab-employment');
	},

	OpenCandidateContact: function()
	{
		TriSysApex.Pages.ContactForm.NewRecord();
		Welcome.SetContactType("Candidate");
		Welcome.FocusOnTab('contact-form-tab-personal');
	},

	SetContactType: function(sType)
	{
		setTimeout(function()
		{
			TriSysSDK.CShowForm.SetTextInCombo("Contact_Type", sType);

		}, 2000);		
	},

	FocusOnTab: function(sTabPanelName)
	{
		setTimeout(function()
		{
			$('#' + sTabPanelName + ' > a').trigger('click');

		}, 2000);
	},

	OpenForm: function(sFormName, sTab)
	{
		if(sFormName == "Company")
			TriSysApex.Pages.CompanyForm.NewRecord();
		else
		{
			setTimeout(function()
			{
				TriSysApex.FormsManager.OpenForm(sFormName, 0, true);
			}, 10);
			TriSysApex.FormsManager.CloseCurrentForm();

			if(sTab)
			{
				Welcome.FocusOnTab(sTab);
			}
		}
	}
};

$(document).ready(function ()
{
    Welcome.Load();
});
