var ctrlCampaignRecipient =
{
	Load: function (lContactId, lMarketingCampaignId)
	{
		var CReadCampaignRecipientRequest = {
			MarketingCampaignId: lMarketingCampaignId,
			ContactId: lContactId
		};

		var payloadObject = {};
		payloadObject.URL = "Marketing/ReadCampaignRecipient";
		payloadObject.OutboundDataPacket = CReadCampaignRecipientRequest;
		payloadObject.InboundDataFunction = function (CReadCampaignRecipientResponse)
		{
			if (CReadCampaignRecipientResponse)
			{
				if (CReadCampaignRecipientResponse.Success)
				{
					$('#ctrlCampaignRecipient-CampaignName').html(CReadCampaignRecipientResponse.Campaign.Name);
					$('#ctrlCampaignRecipient-ContactName').html(CReadCampaignRecipientResponse.Contact.FullName);

					ctrlCampaignRecipient.ShowDateField('Added', CReadCampaignRecipientResponse.Added);
					ctrlCampaignRecipient.ShowDateField('Scheduled', CReadCampaignRecipientResponse.Scheduled);
					ctrlCampaignRecipient.ShowDateField('Sent', CReadCampaignRecipientResponse.Sent);
					ctrlCampaignRecipient.ShowDateField('Delivered', CReadCampaignRecipientResponse.Delivered);
					ctrlCampaignRecipient.ShowDateField('Undelivered', CReadCampaignRecipientResponse.Undelivered);
					ctrlCampaignRecipient.ShowDateField('Opened', CReadCampaignRecipientResponse.Opened);

					if (CReadCampaignRecipientResponse.Clicks)
					{
						var clicks = CReadCampaignRecipientResponse.Clicks;
						var sClicks = '';
						clicks.forEach(function (clickItem)
						{
							if (sClicks.length > 0)
								sClicks += '<br /><br />';

							var sHyperlink = '<a href="' + clickItem.RedirectURL + '" target="_blank">' + clickItem.RedirectURL + '</a>';
							sClicks += moment(clickItem.Timestamp).format("dddd DD MMMM YYYY HH:mm") + '<br />' + sHyperlink;
						});

						$('#ctrlCampaignRecipient-Clicks').html(sClicks);
						$('#ctrlCampaignRecipient-ClickCount').html(clicks.length);
					}
					else
						$('#ctrlCampaignRecipient-Clicks-tr').hide();
				}
				else
					TriSysApex.UI.ShowMessage(CReadCampaignRecipientResponse.ErrorMessage);
			}
		};
		payloadObject.ErrorHandlerFunction = function (request, status, error)
		{
			TriSysApex.UI.ErrorHandlerRedirector('ctrlCampaignRecipient.Load: ', request, status, error);
		};
		TriSysAPI.Data.PostToWebAPI(payloadObject);
	},

	ShowDateField: function (sField, dtValue)
	{
		var sValue = "", bHide = false;
		var dt = new Date(dtValue);
		if (dt.getFullYear() >= 2018)
			sValue = moment(dt).format("dddd DD MMMM YYYY HH:mm");
		else
			bHide = true;

		$('#ctrlCampaignRecipient-' + sField).html(sValue);
		bHide ? $('#ctrlCampaignRecipient-' + sField + '-tr').hide() : $('#ctrlCampaignRecipient-' + sField + '-tr').show();
	},

	// Find the e-mail that was sent and display it in a popup for reading
	OpenEMail: function (lContactId, lMarketingCampaignId)
	{
		var CReadSentCampaignEMailRequest = {
			MarketingCampaignId: lMarketingCampaignId,
			ContactId: lContactId
		};

		var payloadObject = {};
		payloadObject.URL = "Marketing/ReadSentCampaignEMail";
		payloadObject.OutboundDataPacket = CReadSentCampaignEMailRequest;
		payloadObject.InboundDataFunction = function (CReadSentCampaignEMailResponse)
		{
			if (CReadSentCampaignEMailResponse)
			{
				if (CReadSentCampaignEMailResponse.Success)
				{
					// Modal popup display of .html file
					TriSysSDK.Controls.FileManager.GetOpenFileURLFromWebService(CReadSentCampaignEMailResponse.Title,
						CReadSentCampaignEMailResponse.FilePath, CReadSentCampaignEMailResponse.FileName);
				}
				else
					TriSysApex.UI.ShowMessage(CReadSentCampaignEMailResponse.ErrorMessage);
			}
		};
		payloadObject.ErrorHandlerFunction = function (request, status, error)
		{
			TriSysApex.UI.ErrorHandlerRedirector('ctrlCampaignRecipient.OpenEMail: ', request, status, error);
		};
		TriSysAPI.Data.PostToWebAPI(payloadObject);
	}
};
