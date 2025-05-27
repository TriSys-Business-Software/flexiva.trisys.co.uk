// 27 May 2025: Custom JavaScript for flexiva.trisys.co.uk
//
var FlexivaCustomDeployment =
{
	AppStarted: function()
	{
		console.log("Flexiva Custom Deployment Started");

		// Constants are defined in many places purely for legacy reasons
		TriSysApex.Copyright.ShortProductName = 'TriSys';
		TriSysApex.Copyright.HomePage = 'https://www.trisys.co.uk/';
		TriSysApex.Constants.ApplicationName = 'TriSys Flexiva';
		TriSysApex.Constants.URL = 'https://flexiva.trisys.co.uk';
		TriSysApex.Constants.WhiteLabelled = true;
		TriSysApex.Constants.AboutImage = 'images/trisys/Generix-Portal-Splash-Screen.png';

		// TODO: Custom pre-login pages and nav bar 
		var config = TriSysApex.Forms.Configuration;
		//config.Pages = ...
		//config.Views = ...
	}

};	// FlexivaCustomDeployment
