var ctrlLookup =
{
    Load: function ()
    {
        var details = AdminConsole.GetCategoryDisplayAndEditDetails(AdminConsole.SelectedSkillCategory);

        $('#lookup-name-label').html(details.NameLabel);
        $('#lookup-category').val(AdminConsole.SelectedSkillCategory);


        // Get data
        ctrlLookup.PopulateFields(details);
    },

    ChangeBackColour: function(e)
    {
        var colour = e.value;
        $('#lookup-backcolour-td').css('background-color', colour);
    },

    ChangeColour: function (e)
    {
        var colour = e.value;
        $('#lookup-colour-td').css('color', colour);
    },

    PopulateFields: function (details)
    {
        var lRecordId = AdminConsole.EditingSkillId;
        var record = null;
        if (lRecordId > 0)
            var record = details.GetRecord(lRecordId);

        if (!record)
        {
            record = {
                Name: '',
                Description: '',
                Colour: '#FF0000',
                Male: false,
                Married: false
            }
        }

        if (record)
        {
            var sNameField = record.Name;
            var sDescription = record.Description;

            // Standard fields
            $('#lookup-name').val(sNameField);
            $('#lookup-description').val(sDescription);

            // Others as required
            var iNameWidth = $("#lookup-name").width();

            switch (AdminConsole.SelectedSkillCategory)
            {
                case 'Contact Priorities':
                    $('#lookup-backcolour-tr').show();
                    $('#lookup-backcolour-td').css('background-color', record.Colour);

                    $("#lookup-backcolour").kendoColorPicker({
                        value: record.Colour,
                        buttons: false,
                        select: ctrlLookup.ChangeBackColour
                    });
                    $(".k-selected-color").css('width', iNameWidth);

                    break;

                case 'Contact Titles':
                    $('#lookup-contact-title-flags-tr').show();
                    TriSysSDK.CShowForm.SetCheckBoxValue('lookup-male', (record.Male == 1));
                    TriSysSDK.CShowForm.SetCheckBoxValue('lookup-female', (record.Male == 0));
                    TriSysSDK.CShowForm.SetCheckBoxValue('lookup-married', (record.Married == 1));
                    TriSysSDK.CShowForm.SetCheckBoxValue('lookup-unmarried', (record.Married == 0));
                    break;

                case 'Task Types':
                    $('#lookup-colour-tr').show();      
                    $('#lookup-colour-td').css('color', record.Colour);

                    $("#lookup-colour").kendoColorPicker({      // Colour Picker/ColourPicker
                        value: record.Colour,
                        buttons: false,
                        select: ctrlLookup.ChangeColour
                    });
                    $(".k-selected-color").css('width', iNameWidth);

                    var sTaskType = record.Name;
                    if (sTaskType)
                    {
                        var sImage = TriSysSDK.CShowForm.TaskTypeImageFile(sTaskType);
                        $('#lookup-image-tr').show();
                        $('#lookup-image').attr('src', sImage);
                    }
                    break;
            }
        }        
    },

    SaveButtonClick: function()
    {
        var lRecordId = AdminConsole.EditingSkillId;
        var details = AdminConsole.GetCategoryDisplayAndEditDetails(AdminConsole.SelectedSkillCategory);

        var sNameField = $('#lookup-name').val();
        var sDescription = $('#lookup-description').val();

        if(!sNameField || !sDescription)
        {
            TriSysApex.UI.ShowMessage("You must enter a " + details.NameLabel.toLowerCase() + " value and a description.");
            return false
        }

        var record = {};
        if (lRecordId > 0)
            record = details.GetRecord(lRecordId);

        if (!record)
        {
            // Should never happen but did in production on 5 Jan 2016
            return;
        }


        record.Name = sNameField;
        record.Description = sDescription;

        switch (AdminConsole.SelectedSkillCategory)
        {
            case 'Contact Priorities':
                var lBackColour = $('#lookup-backcolour-td').css('background-color');
                record.Colour = lBackColour;
                break;

            case 'Contact Titles':
                // 09 Mar 2023: Gender neutrality
                var bMale = TriSysSDK.CShowForm.CheckBoxValue('lookup-male');
                var bFemale = TriSysSDK.CShowForm.CheckBoxValue('lookup-female');   
                var eGender = 1;    // Male
                if (bMale == bFemale)
                    eGender = 2;    // Neither male or female
                else if (bFemale)
                    eGender = 0;    // Female

                record.Male = eGender;

                // 09 Mar 2023: Marriage neutrality
                var bMarried = TriSysSDK.CShowForm.CheckBoxValue('lookup-married');
                var bUnmarried = TriSysSDK.CShowForm.CheckBoxValue('lookup-unmarried');
                var eMarried = 1;   // Married
                if (bMarried == bUnmarried)
                    eMarried = 2;   // Neither married or unmarried
                else if (bUnmarried)
                    eMarried = 0;   // Unmarried

                record.Married = eMarried;
                break;

            case 'Task Types':
                var lForeColour = $('#lookup-colour-td').css('color');
                record.Colour = lForeColour;
                break;
        }

        // Send to appropriate API's for lookups
        ctrlLookup.SubmitToWebAPI(lRecordId, record, AdminConsole.SelectedSkillCategory);
    },

    SubmitToWebAPI: function(lRecordId, record, sCategory)
    {
        // An object for each class
        var CUpdateLookupRequest = {
            ContactPriority: {},
            ContactTitle: {},
            Currency: {},
            Industry: {},
            JobTitle: {},
            TaskType: {},
			CompanyRelationshipType: {},
			ContactRelationshipType: {},
			AddressType: {}                 // 08 Mar 2023
        };

        // Individual URL's per category
        var sAPIUrl = "Lookup/Update";

        switch (sCategory)
        {
            case "Contact Priorities":
                var contactPriority = {
                    ContactPriorityId: lRecordId,
                    ContactPriority: record.Name.substring(0, 31),
                    Description: record.Description,
                    HTMLColour: record.Colour
                };
                CUpdateLookupRequest.ContactPriority = contactPriority;
                break;

            case "Contact Titles":
                var contactTitle = {
                    ContactTitleId: lRecordId,
                    Name: record.Name.substring(0, 15),
                    Description: record.Description,
                    Male: record.Male,                      // 09 Mar 2023: Male is an Enum Sex: Female = 0, Male = 1, Either = 2
                    Married: record.Married                 // 09 Mar 2023: Married is an Enum Married: Unmarried = 0, Married = 1, Either = 2
                };
                CUpdateLookupRequest.ContactTitle = contactTitle;
                //CUpdateLookupRequest = contactTitle;
                //sAPIUrl = "Lookup/UpdateContactTitle";
                break;

            case "Currencies":
                var currency = {
                    CurrencyId: lRecordId,
                    Symbol: record.Name.substring(0, 4),
                    Description: record.Description
                };
                CUpdateLookupRequest.Currency = currency;
                break;

            case "Industries":
                var industry = {
                    IndustryId: lRecordId,
                    Name: record.Name.substring(0, 49),
                    Description: record.Description
                };
                CUpdateLookupRequest.Industry = industry;
                break;

            case "Job Titles":
                var jobTitle = {
                    JobTitleId: lRecordId,
                    JobTitle: record.Name.substring(0, 254),
                    Description: record.Description
                };
                CUpdateLookupRequest.JobTitle = jobTitle;
                break;

            case "Task Types":
                var taskType = {
                    TaskTypeId: lRecordId,
                    Name: record.Name.substring(0, 63),
                    Description: record.Description,
                    HTMLColour: record.Colour
                };
                CUpdateLookupRequest.TaskType = taskType;
                break;

			case "Company Relationship Types":
                var companyRelationship = {
                    CompanyRelationshipTypeId: lRecordId,
                    Name: record.Name.substring(0, 100),
                    Description: record.Description
                };
                CUpdateLookupRequest.CompanyRelationshipType = companyRelationship;
                break;

			case "Contact Relationship Types":
                var contactRelationship = {
                    ContactRelationshipTypeId: lRecordId,
                    Name: record.Name.substring(0, 16),
                    Description: record.Description
                };
                CUpdateLookupRequest.ContactRelationshipType = contactRelationship;
                break;

            case "Address Types":
                var addressType = {
                    AddressTypeId: lRecordId,
                    Name: record.Name.substring(0, 16),
                    Description: record.Description
                };
                CUpdateLookupRequest.AddressType = addressType;
                break;
        }


        var payloadObject = {};

        payloadObject.URL = sAPIUrl;

        payloadObject.OutboundDataPacket = CUpdateLookupRequest;

        payloadObject.InboundDataFunction = function (CUpdateLookupResponse)
        {
            TriSysApex.UI.HideWait();

            if (CUpdateLookupResponse)
            {
                if (CUpdateLookupResponse.Success)
                {
                    // Cache the standing data
                    var standingData = CUpdateLookupResponse.StandingData;
                    if(standingData)
                        TriSysApex.Cache.SetStandingData(standingData);

                    // Redraw from updated cache
                    AdminConsole.PopulateSkillGrid(sCategory);

                    // Close this modal dialogue
                    TriSysApex.UI.CloseModalPopup();

                    return;
                }
                else
                    TriSysApex.UI.ShowMessage(CUpdateLookupResponse.ErrorMessage);
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('ctrlLookup.SubmitToWebAPI: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Saving " + sCategory + "...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    }
};

$(document).ready(function ()
{
    ctrlLookup.Load();
});


