var ctrlSkill =
{
    Load: function ()
    {
        if (AdminConsole.SelectedSkillCategoryId > 0)
        {
            var skillCategory = TriSysApex.Cache.SkillCategoriesManager.CategoryFromId(AdminConsole.SelectedSkillCategoryId);
            if (skillCategory)
            {
                $('#skill-category').val(skillCategory.Category);

                if (AdminConsole.EditingSkillId > 0)
                {
                    var skill = TriSysApex.Cache.SkillManager.SkillFromId(AdminConsole.EditingSkillId);
                    if (skill)
                    {
                        $('#skill-name').val(skill.Skill);
                        $('#skill-description').val(skill.Description);
                        TriSysSDK.CShowForm.SetCheckBoxValue('skill-locked', skill.Locked);
                    }
                }
            }
        }

        $('#skill-name').focus();
    },

    SaveButtonClick: function()
    {
        var skill = { SkillId: AdminConsole.EditingSkillId, SkillCategoryId: AdminConsole.SelectedSkillCategoryId };

        if (skill.Locked)
        {
            TriSysApex.UI.ShowMessage("Attribute is locked.");
            return;
        }

        skill.Skill = $('#skill-name').val();
        skill.Description = $('#skill-description').val();
        skill.Locked = TriSysSDK.CShowForm.CheckBoxValue('skill-locked');

        // Validation
        var sError = null;
        if (!skill.Skill)  // || !skill.Description)
        {
            sError = "Please enter an attribute name.";
        }
        else
        {
            if (TriSysApex.Cache.SkillManager.isDuplicate(skill))
                sError = "Attribute: " + skill.Skill + " already exists.";
        }

        if (sError)
        {
            TriSysApex.UI.ShowMessage(sError);
            return;
        }

        if (!skill.Description)
            skill.Description = skill.Skill;

        // Submission
        ctrlSkill.SubmitToAPI(skill);
    },

    SubmitToAPI: function(skill)
    {
        var CUpdateSkillRequest = { Skill: skill };

        var payloadObject = {};

        payloadObject.URL = "Skills/Update";

        payloadObject.OutboundDataPacket = CUpdateSkillRequest;

        payloadObject.InboundDataFunction = function (CUpdateSkillResponse)
        {
            TriSysApex.UI.HideWait();

            if (CUpdateSkillResponse)
            {
                if (CUpdateSkillResponse.Success)
                {
                    // Repoint cache
                    TriSysApex.Cache.cachedStandingDataInMemory.Skills = CUpdateSkillResponse.Skills;

                    // Redraw from updated cache
                    AdminConsole.PopulateSkillGrid(AdminConsole.SelectedSkillCategory);

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
            TriSysApex.UI.errorAlert('ctrlSkill.SubmitToAPI: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Saving Attribute...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    }
};

$(document).ready(function ()
{
    ctrlSkill.Load();
});


