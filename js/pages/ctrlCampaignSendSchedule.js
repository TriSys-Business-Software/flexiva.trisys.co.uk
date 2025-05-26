var ctrlCampaignSendSchedule =
{
	Load: function (CSendToCampaignRecipientsRequest)
	{
		ctrlCampaignSendSchedule._CSendToCampaignRecipientsRequest = CSendToCampaignRecipientsRequest;

		$('#ctrlCampaignSendSchedule-Name').html(CSendToCampaignRecipientsRequest.Name);
		$('#ctrlCampaignSendSchedule-RecipientCount').html(TriSysSDK.Numbers.ThousandsSeparator(CSendToCampaignRecipientsRequest.NumberOfRecipients));

		TriSysSDK.CShowForm.dateTimePicker('ctrlCampaignSendSchedule-ScheduledDateTime');

		var dtNow = new Date();
		TriSysSDK.CShowForm.setDateTimePickerValue('ctrlCampaignSendSchedule-ScheduledDateTime', moment(dtNow).add(5, 'minutes'));
	},

	Send: function ()
	{
		// Validation of date
		var dtScheduledDateTime = null;

		var sScheduledDateTime = TriSysSDK.CShowForm.getDateTimePickerValue('ctrlCampaignSendSchedule-ScheduledDateTime');
		if (sScheduledDateTime)
			dtScheduledDateTime = new Date(sScheduledDateTime);

		var dtNow = new Date();

		if (!dtScheduledDateTime || dtScheduledDateTime < dtNow)
		{
			TriSysApex.UI.ShowMessage("Please choose a date/time in the future.");
			return false;
		}

		var dtInternationalFormat = moment(sScheduledDateTime).format("YYYY-MM-DDTHH:mm:ss");

		ctrlCampaignSendSchedule._CSendToCampaignRecipientsRequest.ScheduledDateTime = dtInternationalFormat;

		var fnCommence = function ()
		{
			Campaigns.ScheduleSendViaWebAPI(ctrlCampaignSendSchedule._CSendToCampaignRecipientsRequest);
		};

		setTimeout(fnCommence, 50);

		return true;
	},

	_CSendToCampaignRecipientsRequest: null
};
