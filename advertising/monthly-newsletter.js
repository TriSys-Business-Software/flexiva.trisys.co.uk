var MonthlyNewsletter = 
{
	Load: function()
	{
		var iHeightFactor = 310;
		var lHeight = $(window).height() - iHeightFactor;
		$('#overflow-div').height(lHeight);

		MonthlyNewsletter.LoadThisMonthOrLastMonthsNewsletter();
	},

	// Note how we actually show an image with a hyperlink rather than the actual newsletter HTML?
	// This is because hyperlinks inside an iFrame do not work as the user would expect.
	// Also, if we used the actual newsletter HTML, it would interfere with the app styles.
	//
	LoadThisMonthOrLastMonthsNewsletter: function()
	{
		var sRootPath = 'https://www.trisys.co.uk/documents/';

		// Algorithm
		var dt = new Date();
		if(dt.getDate() < 10)
			dt = new Date(moment(new Date()).add(-1, 'months'));

		var sMonthName = moment(dt).format('MMMM'); 
		var sYear = moment(dt).format('YYYY'); 

		var sFile = sMonthName + '-' + sYear;
		var sPath = sRootPath + sFile + '-Newsletter.png' + TriSysApex.FormsManager.pageURLTimestampArgumentsToForceNoCache();
		$('#monthly-newsletter-thumbnail').attr('src', sPath);

		sFile = sMonthName + ' ' + sYear;
		sPath = sRootPath + sFile + ' Newsletter.html' + TriSysApex.FormsManager.pageURLTimestampArgumentsToForceNoCache();
		$('#monthly-newsletter-hyperlink').attr('href', sPath);
	}
};

$(document).ready(function ()
{
    MonthlyNewsletter.Load();
});