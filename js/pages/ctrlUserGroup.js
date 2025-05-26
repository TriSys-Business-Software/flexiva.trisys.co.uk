var ctrlUserGroup =
{
    Load: function()
    {
        if (AdminConsole.EditingUserGroupId > 0)
        {
            var group = TriSysApex.Cache.UserGroupManager.GroupFromId(AdminConsole.EditingUserGroupId);
            if (group)
            {
                $('#user-group-name').val(group.Name);
				$('#user-group-description').val(group.Description);

				// Do not allow the name of the admin group to change!
				if (AdminConsole.EditingUserGroupId == 1)
					$('#user-group-name').attr('readonly', 'readonly');
            }
        }
    },

    SaveButtonClick: function()
    {
        var group = { UserGroupId: AdminConsole.EditingUserGroupId };
        group.Name = $('#user-group-name').val();
        group.Description = $('#user-group-description').val();

        // Validation
        var sError = null;
        if (!group.Name || !group.Description)
        {
            sError = "Please enter a group name and description.";
        }
        else
        {
            if(TriSysApex.Cache.UserGroupManager.isDuplicate(group))
                sError = "Group name: " + group.Name + " already exists.";
        }

        if(sError)
        {
            TriSysApex.UI.ShowMessage(sError);
            return;
        }

        // Submission
        ctrlUserGroup.SubmitToAPI(group);
    },

    SubmitToAPI: function (group)
    {
        var CUpdateUserGroupRequest = { Group: group };

        var payloadObject = {};

        payloadObject.URL = "UserGroup/Update";

        payloadObject.OutboundDataPacket = CUpdateUserGroupRequest;

        payloadObject.InboundDataFunction = function (CUpdateUserGroupResponse)
        {
            TriSysApex.UI.HideWait();

            if (CUpdateUserGroupResponse)
            {
                if (CUpdateUserGroupResponse.Success)
                {
                    // Repoint cache
                    TriSysApex.Cache.cachedStandingDataInMemory.UserGroups = CUpdateUserGroupResponse.UserGroups;

                    // Redraw from updated cache
                    AdminConsole.PopulateGroupTree();

                    // Close this modal dialogue
                    TriSysApex.UI.CloseModalPopup();

                    return;
                }
                else
                    TriSysApex.UI.ShowMessage(CUpdateUserGroupResponse.ErrorMessage);
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('ctrlUserGroup.SubmitToAPI: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Saving Group...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    }
};

$(document).ready(function ()
{    
    ctrlUserGroup.Load();
});
