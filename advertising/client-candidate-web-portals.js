var AdvertPage = 
{
	Load: function()
	{
		var iHeightFactor = 310;
		var lHeight = $(window).height() - iHeightFactor;
		$('#overflow-div').height(lHeight);
	}
};

$(document).ready(function ()
{
    AdvertPage.Load();
});