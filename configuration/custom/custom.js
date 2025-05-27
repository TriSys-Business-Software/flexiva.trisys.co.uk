// 27 May 2025: Custom JavaScript for flexiva.trisys.co.uk
//
var FlexivaCustomDeployment =
{
	AppStarted: function ()
	{
		console.log("Flexiva Custom Deployment Started");

		// Constants are defined in many places purely for legacy reasons
		TriSysApex.Copyright.ShortProductName = 'TriSys';
		TriSysApex.Copyright.HomePage = 'https://www.trisys.co.uk/';
		TriSysApex.Constants.ApplicationName = 'TriSys Flexiva';
		TriSysApex.Constants.URL = 'https://flexiva.trisys.co.uk';
		TriSysApex.Constants.WhiteLabelled = true;
		TriSysApex.Constants.AboutImage = 'https://apex.trisys.co.uk/images/trisys/acme-splash-screen.png';

		TriSysApex.Constants.DefaultTheme = 'Fire';
		TriSysProUI.ApplyThemeColour(TriSysApex.Constants.DefaultTheme);

		// Custom nav bar logo
		var fnChangeSidebarLogo = function (elem)
		{
			const elemSidebar = $('#sidebar');
			elemSidebar.css('background-image', 'url(https://apex.trisys.co.uk/images/trisys/acme-nav-bar-footer.png)');
			elemSidebar.css('background-size', '200px 103px');
			elemSidebar.css('background-repeat', 'no-repeat');
			elemSidebar.css('background-position', 'bottom');
		};
		setTimeout(fnChangeSidebarLogo, 100);

		// TODO: Custom pre-login pages and nav bar 
		var config = TriSysApex.Forms.Configuration;
		//config.Pages = ...
		//config.Views = ...
	}

};	// FlexivaCustomDeployment
