var SurveyOct2019 = 
{
	Load: function()
	{
		var iHeightFactor = 310;
		var lHeight = $(window).height() - iHeightFactor;
		$('#survey-div').height(lHeight);
	}
};

$(document).ready(function ()
{
    SurveyOct2019.Load();
});