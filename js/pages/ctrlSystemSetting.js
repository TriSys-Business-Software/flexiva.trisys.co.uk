var ctrlSystemSetting =
{
    Load: function()
    {
        if (AdminConsole.SystemSettingId > 0)
        {
            var systemSetting = TriSysApex.Cache.SystemSettingManager.Get(AdminConsole.SystemSettingId);
            if (systemSetting)
            {
                $('#system-setting-name').val(systemSetting.Name);
                $('#system-setting-value').val(systemSetting.Value);
                $('#system-setting-description').val(systemSetting.Description);
            }
        }
    },

    SaveButtonClick: function ()
    {
        var systemSetting = TriSysApex.Cache.SystemSettingManager.Get(AdminConsole.SystemSettingId);

        if (!systemSetting)
            systemSetting = {};

        systemSetting.Name = $('#system-setting-name').val();
        systemSetting.Value = $('#system-setting-value').val();
        systemSetting.Description = $('#system-setting-description').val();

        // Validation
        var sError = null;
        if (!systemSetting.Name || !systemSetting.Value || !systemSetting.Description)
        {
            sError = "Please enter name, value and description.";
        }
        else
        {
            if (TriSysApex.Cache.SystemSettingManager.isDuplicate(systemSetting))
                sError = "System setting: " + systemSetting.Name + " already exists.";
        }

        if (sError)
        {
            TriSysApex.UI.ShowMessage(sError);
            return;
        }

        // Submission
        ctrlSystemSetting.SubmitToAPI(systemSetting);
    },

    SubmitToAPI: function (systemSetting)
    {
        var CUpdateSystemSettingRequest = { SystemSetting: systemSetting };

        var payloadObject = {};

        payloadObject.URL = "SystemSetting/Update";

        payloadObject.OutboundDataPacket = CUpdateSystemSettingRequest;

        payloadObject.InboundDataFunction = function (CUpdateSystemSettingResponse)
        {
            TriSysApex.UI.HideWait();

            if (CUpdateSystemSettingResponse)
            {
                if (CUpdateSystemSettingResponse.Success)
                {
                    // Repoint cache
                    TriSysApex.Cache.SystemSettingManager.Set( CUpdateSystemSettingResponse.SystemSettings );

                    // Redraw from updated cache
                    AdminConsole.PopulateSystemSettingsGrid();

                    // Close this modal dialogue
                    TriSysApex.UI.CloseModalPopup();

                    return;
                }
                else
                    TriSysApex.UI.ShowMessage(CUpdateSkillResponse.ErrorMessage);
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('ctrlSystemSetting.SubmitToAPI: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Saving System Setting...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
	},

	BigEditValue: function ()
	{
		var txt = $('#system-setting-value');
		var sValue = txt.val();

		var fnEditedValue = function (sText)
		{
			txt.val(sText);
			return true;
		};

		var sSystemSetting = $('#system-setting-name').val();

		var options = {
			Label: sSystemSetting,
			Value: sValue
		};
		TriSysApex.ModalDialogue.BigEdit.Popup(sSystemSetting, "gi-pen", fnEditedValue, options);
	}
};

$(document).ready(function ()
{
    ctrlSystemSetting.Load();
});
