var ctrlDataImportPrompt = 
{
	Load: function(lRecordCount, sEntityName)
	{
		var sMessage = "Are you sure that you wish to proceed with importing this " + sEntityName + " data into your database?";
		$('#dataimportprompt-question').html(sMessage);

		// Load all entity types for this entity
		TriSysSDK.CShowForm.entityTypeCombo(sEntityName, 'dataimportprompt-EntityType', null);
		
		var userCredentials = TriSysApex.LoginCredentials.UserCredentials();
		var sName = userCredentials.LoggedInUser.ForenameAndSurname;
		var sComments = "Imported by " + sName + " on " + moment().format('dddd DD MMMM YYYY');
		$('#dataimportprompt-comments').text(sComments);

		var sourceTypes = null;
		if(sEntityName == "Contact")
		{
			// Contact Source
			sourceTypes = ctrlDataImportPrompt.GetSourceList('ContactSource');
			TriSysSDK.CShowForm.populateComboFromDataSource('dataimportprompt-Source', sourceTypes, 0);
		}
		else if(sEntityName == "Company")
		{
			// Company Source
			sourceTypes = ctrlDataImportPrompt.GetSourceList('Source');
			TriSysSDK.CShowForm.populateComboFromDataSource('dataimportprompt-Source', sourceTypes, 0);
		}


		// Skills of type "Import"
        var sourceData =  ctrlDataImportPrompt.GetSourceList('Import');
		if(sourceData)
		{
			TriSysSDK.CShowForm.populateMultiSelectComboFromDataSource('dataimportprompt-ImportSkills', sourceData);
		}
	},

	GetSourceList: function(sCategory)
	{
		var sourceData = [];
		var skills = TriSysApex.Cache.SkillManager.SkillsInCategory(sCategory);
		if(skills)
		{
			skills.forEach(function(skill)
			{
				var sourceStruct = {
                    value: skill.SkillId,
                    text: skill.Skill
                };
                sourceData.push(sourceStruct);
			});				

			return sourceData;
		}
	},

	ReadOptions: function()
	{
		var sEntityType = TriSysSDK.CShowForm.GetTextFromCombo('dataimportprompt-EntityType');
		var sComments = $('#dataimportprompt-comments').text();
		var lstImportSkills = TriSysSDK.CShowForm.GetSelectedSkillsFromList('dataimportprompt-ImportSkills', null, true);
		var sSource = TriSysSDK.CShowForm.GetTextFromCombo('dataimportprompt-Source');

		var options = 
		{
			EntityType: sEntityType,
			Comments: sComments,
			ImportSkills: lstImportSkills,
			Source: sSource
		};

		return options;
	}
};