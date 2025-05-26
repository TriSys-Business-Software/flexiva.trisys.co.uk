var ctrlSkillCategory =
{
    Load: function ()
    {
        var bCategoryNameEditable = false;

        if (AdminConsole.EditingSkillCategoryId > 0)
        {
            var skillCategory = TriSysApex.Cache.SkillCategoriesManager.CategoryFromId(AdminConsole.EditingSkillCategoryId);
            if (skillCategory)
            {
                $('#skill-category-name').val(skillCategory.Category);
                $('#skill-category-description').val(skillCategory.Description);
                TriSysSDK.CShowForm.SetCheckBoxValue('skill-category-locked', skillCategory.Locked);

                if (!skillCategory.Locked)
                    bCategoryNameEditable = true;
            }
        }
        else
            bCategoryNameEditable = true;

        if (bCategoryNameEditable)
        {
            $('#skill-category-name').removeAttr("readonly");
            $('#skill-category-name').focus();
        }
    },

    SaveButtonClick: function (fnCallback, options)
    {
        var skillCategory = null;

        if (AdminConsole.EditingSkillCategoryId > 0)        
            skillCategory = TriSysApex.Cache.SkillCategoriesManager.CategoryFromId(AdminConsole.EditingSkillCategoryId);
        else
            skillCategory = { SkillCategoryId: 0 };

        if (skillCategory)
        {
            if (skillCategory.Locked)
            {
                TriSysApex.UI.ShowMessage("Category is locked.");
                return false;
            }

            skillCategory.Category = $('#skill-category-name').val();
            skillCategory.Description = $('#skill-category-description').val();
            skillCategory.Locked = TriSysSDK.CShowForm.CheckBoxValue('skill-category-locked');

            // 06 Mar 2023: Allow no spaces in skill category for field description lookups
            if (options) {
                if(options.RemoveSpaces)
                {
                    skillCategory.Category = skillCategory.Category.replace(/ /g, '');
                    $('#skill-category-name').val(skillCategory.Category);
                }
            }

            if(!skillCategory.Category || !skillCategory.Description)
            {
                TriSysApex.UI.ShowMessage("Please enter a name and description.");
                return false;
            }

            var potentialDuplicateSkillCategory = TriSysApex.Cache.SkillCategoriesManager.CategoryFromName(skillCategory.Category);
            if (potentialDuplicateSkillCategory && potentialDuplicateSkillCategory.SkillCategoryId != skillCategory.SkillCategoryId)
            {
                TriSysApex.UI.ShowMessage("Category name must be unique.");
                return false;
            }

            // Remove potentially problematic characters
            skillCategory.Category = ctrlSkillCategory.FilterOutProblematicsCharacters(skillCategory.Category);

            // Submission
            debugger;
            ctrlSkillCategory.SubmitToAPI(skillCategory, fnCallback);

            return true;
        }
    },

    // Do not allow certain characters in category names as they cause problems with SQL &/or DOM
    FilterOutProblematicsCharacters: function(sSkillCategory)
    {
        sSkillCategory = sSkillCategory.replace(/'/g, '');
        sSkillCategory = sSkillCategory.replace(/&/g, 'and');
        sSkillCategory = sSkillCategory.replace(/\+/g, '');
        sSkillCategory = sSkillCategory.replace(/%/g, 'percent');
        sSkillCategory = sSkillCategory.replace(/"/g, '');
        sSkillCategory = sSkillCategory.replace(/\[/g, '');
        sSkillCategory = sSkillCategory.replace(/]/g, '');
        sSkillCategory = sSkillCategory.replace(/\(/g, '');
        sSkillCategory = sSkillCategory.replace(/\)/g, '');

        return sSkillCategory;
    },

    SubmitToAPI: function (skillCategory, fnCallback)
    {
        var CUpdateSkillCategoryRequest = { SkillCategory: skillCategory };

        var payloadObject = {};

        payloadObject.URL = "SkillCategory/Update";

        payloadObject.OutboundDataPacket = CUpdateSkillCategoryRequest;

        payloadObject.InboundDataFunction = function (CUpdateSkillCategoryResponse)
        {
            TriSysApex.UI.HideWait();

            if (CUpdateSkillCategoryResponse)
            {
                if (CUpdateSkillCategoryResponse.Success)
                {
                    // Repoint cache
                    TriSysApex.Cache.cachedStandingDataInMemory.SkillCategories = CUpdateSkillCategoryResponse.SkillCategories;

                    // Redraw from updated cache
                    AdminConsole.PopulateSkillCategoryGrid();

                    // If we are called from new field description ctrlFieldDescription, then callback into there
                    if (fnCallback)
                        fnCallback(skillCategory);

                    return;
                }
                else
                    TriSysApex.UI.ShowMessage(CUpdateSkillCategoryResponse.ErrorMessage);
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('ctrlSkillCategory.SubmitToAPI: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Saving Category...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    }
};

$(document).ready(function ()
{
    ctrlSkillCategory.Load();
});
