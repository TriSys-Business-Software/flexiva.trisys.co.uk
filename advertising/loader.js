var AdvertPage = 
{
	Load: function()
	{
		var iHeightFactor = 310;
		var lHeight = $(window).height() - iHeightFactor;
		$('#overflow-div').height(lHeight);
	},

	// Allow opening of any images with onclick="AdvertPage.ViewImage(this)"
	ViewImage: function(thisObject)
	{
		var sPath = thisObject.src;
		TriSysSDK.Controls.FileManager.OpenDocumentViewer(null, sPath);
	},

	OpenForm: function(sFormName)
	{
		setTimeout(function()
		{
			TriSysApex.FormsManager.OpenForm(sFormName, 0, true);
		}, 10);

		TriSysApex.UI.CloseModalPopup();		
	}
};

$(document).ready(function ()
{
    AdvertPage.Load();
});