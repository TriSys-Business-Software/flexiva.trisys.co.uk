// Self contained logic for populating and interacting with the search criteria tree.
// Keywords: searchtree, fields, configfields, functions, search fields
//
// Written by GL in June 2015.
// Hacked by GL in Feb 2017 to remove client-side SQL.
//
var ctrlSearchCriteria =
{    
    // Called by TriSysSDK.SearchCriteria.AfterControlLoaded event to change div ID's as we will
    // have multiple versions of this control loaded simultaneously.
    PostLoad: function (sEntityName, lRecordId, parentDiv, fnSearchCallback)
    {
        var sIDSuffix = '-' + parentDiv;

        // Change ID of all internal divs
        var controls = ['search-criteria-entity', 'search-criteria-hide', 'search-criteria-tree', 'search-criteria-lookup-button',
            'search-criteria-clear-button', 'search-criteria-saved-search-menu',
            // 28 Jun 2024: Boolean + AI tabs and controls
            'ctrlSearchCriteria-tab-buttons', 'ctrlSearchCriteria-tab-nav-horizontal',
            'ctrlSearchCriteria-form-tab-boolean', 'ctrlSearchCriteria-form-tab-ai',
            'ctrlSearchCriteria-tab-boolean', 'ctrlSearchCriteria-tab-ai',
            'ctrlSearchCriteria-tab-panel-boolean', 'ctrlSearchCriteria-tab-panel-ai',
            'search-criteria-ai'
        ];
        for (var i in controls)
        {
            $('#' + controls[i]).attr('id', controls[i] + sIDSuffix);
        }

        // Display proper entity name
        $('#search-criteria-entity' + sIDSuffix).html(sEntityName);

        // 28 Jun 2024: Add event handlers for the entity specific controls
        $('#ctrlSearchCriteria-tab-boolean' + sIDSuffix).off().on('click', function ()
        {
            TriSysSDK.EntityFormTabs.TabContainerClickEvent($(this), 'ctrlSearchCriteria-tab-panel-boolean' + sIDSuffix, ctrlSearchCriteria.TabClickEvent);
        });
        $('#ctrlSearchCriteria-tab-ai' + sIDSuffix).off().on('click', function ()
        {
            TriSysSDK.EntityFormTabs.TabContainerClickEvent($(this), 'ctrlSearchCriteria-tab-panel-ai' + sIDSuffix,
                function (sTabID)
                {
                    ctrlSearchCriteria.TabClickEvent(sTabID, sIDSuffix);
                }
            );
        });

        // 28 Jun 2024: Tabs
        TriSysSDK.EntityFormTabs.AddClickEventHandlers('ctrlSearchCriteria-tab-nav-horizontal' + sIDSuffix, true);	
        TriSysSDK.Controls.Button.Click('ctrlSearchCriteria-form-tab-boolean' + sIDSuffix);

        // 28 Jun 2024: Load AI Search Criteria
        ctrlSearchCriteria.LoadAISearchCriteria(sEntityName, lRecordId, 'search-criteria-ai' + sIDSuffix, sIDSuffix, 'ctrlSearchCriteria-form-tab-ai');

        // Add the callback for the drop down tool to minimize the search criteria
        var sSearchCriteriaTree = 'search-criteria-tree' + sIDSuffix;
        $('#search-criteria-hide' + sIDSuffix).off().on("click", function ()
        {
            TriSysSDK.Blocks.toggleBlockSize($(this), sSearchCriteriaTree);
        });

        // Add the callback for the search/lookup buttons
        var sSearchButton = '#search-criteria-lookup-button' + sIDSuffix;
		$(sSearchButton).off().on("click", function ()
        {
            ctrlSearchCriteria.DoSearch(sEntityName, lRecordId, sSearchCriteriaTree, fnSearchCallback, false, sIDSuffix);
        });

        // Add the callback for the reset buttons
        var sResetButton = '#search-criteria-clear-button' + sIDSuffix;
		$(sResetButton).off().on("click", function ()
        {
            ctrlSearchCriteria.ResetSearch(sEntityName, lRecordId, sSearchCriteriaTree, fnSearchCallback);
        });

        // After API callback, do a search reset if we do not find anything
        var fnResetSearch = function ()
        {
            var bNoPrompt = true;
            ctrlSearchCriteria.ResetSearch(sEntityName, lRecordId, sSearchCriteriaTree, fnSearchCallback, bNoPrompt);
        };

        // Add the saved search menu
        var sSavedSearchMenu = 'search-criteria-saved-search-menu' + sIDSuffix;
        TriSysSDK.SearchCriteria.LoadSavedSearchMenu(sEntityName, ctrlSearchCriteria.Constants.EntitySearchPrefix, sSavedSearchMenu, sSearchCriteriaTree, fnSearchCallback);

        // Set up the search criteria tree now
        ctrlSearchCriteria.Populate(sEntityName, lRecordId, sSearchCriteriaTree, sSearchButton);

        // Force through the theme once again!
        setTimeout(TriSysProUI.kendoUI_Overrides, 1000);

        // Do we have any persistence to restore and fire underlying search?
        ctrlSearchCriteria.Persistence.Get(sSearchCriteriaTree, sEntityName, lRecordId, fnSearchCallback, fnResetSearch);
    },

    // Populate the search criteria tree for this entity record
    Populate: function (sEntityName, lRecordId, sSearchCriteriaTree, sSearchButton)
    {
        // Define filters for this entity. Filters are basically all of the fields for this entity.
        var TriSysFields = ctrlSearchCriteria.GetFilters(sEntityName, sSearchButton);

        // Set options to contain these filters
        var options = {
            allow_empty: true,

            // https://querybuilder.js.org/plugins.html
            plugins: [
                //'sortable',
                'filter-description',
                'unique-filter'
            ],

            filters: TriSysFields
        };

        // August 2020 - record these for later
        ctrlSearchCriteria.DynamicColumns.Fields = TriSysFields;

        try
        {
            // This call instantiates the query builder
            $('#' + sSearchCriteriaTree).queryBuilder(options);

        } catch (e)
        {
            var sError = e;
        }

        // Override colour to our theme
        $('#' + sSearchCriteriaTree).on('afterAddGroup.queryBuilder', function (e, model)
        {
            ctrlSearchCriteria.ResetColours();
        });

        // We need this for resizing skills widgets
        $('#' + sSearchCriteriaTree).on('afterCreateRuleInput.queryBuilder', function (e, rule)
        {
            //if (rule.filter.plugin == 'selectize')
            //{
            //    rule.$el.find('.rule-value-container').css('min-width', '200px')
            //      .find('.selectize-control').removeClass('form-control');
            //}

            // Resize only for skills - nothing else!
            var ruleData = rule.data;
            if (ruleData && ruleData.FieldWidgetID)
            {
                var bSkillRule = (ruleData.FieldWidgetID.indexOf(ctrlSearchCriteria.FieldTypeFilter.SkillFieldPrefix) == 0);
                if (ruleData)    // && bSkillRule)   // Now do all
                {
                    setTimeout(function ()
                    {
                        ctrlSearchCriteria.FieldTypeFilter.ResizeToFitWidth(rule);

                    }, 50);

                }
            }
        });

        // Apply our themes
        ctrlSearchCriteria.ResetColours();
    },

    // Query Builder calls them filters, but we know then as fields!
    GetFilters: function (sEntityName, sSearchButton)
    {
        var fieldFilters = [];

        // Add cross-entity search fields to increase functionality
        ctrlSearchCriteria.AddCrossEntitySearchFields(sEntityName, fieldFilters, sSearchButton);

        // Get the field descriptions for this entity only and those we are allowed to show
        var fieldDescriptions = ctrlSearchCriteria.GetFieldDescriptionsForEntitySearching(sEntityName);

        // 15 Feb 2022: Added custom code-only control over which fields are available
        ctrlSearchCriteria.CustomerSpecificFieldDescriptionModifications(sEntityName, fieldDescriptions);

        // Enumerate through all fields and add to list of filters
        for (var i = 0; i < fieldDescriptions.length; i++)
        {
            var fieldDescription = fieldDescriptions[i];

            // Turn into a fully functional HTML search field
            var fieldFilter = ctrlSearchCriteria.FieldTypeFilter.Filter(sEntityName, fieldDescription, sSearchButton);

            if (fieldFilter)
            {
                var bDuplicateFound = false;
                for (var f = 0; f < fieldFilters.length; f++)
                {
                    var existingFieldFilter = fieldFilters[f];
                    if (existingFieldFilter.id == fieldFilter.id)
                        bDuplicateFound = true;
                }

                if (!bDuplicateFound)
                    fieldFilters.push(fieldFilter);
            }
            else
            {
                //debugger;
                console.log("Unable to create field filter for: " + fieldDescription.TableName + "." + fieldDescription.TableFieldName);
            }
        }

        // Get rid of undesirable fields which are of no use
        ctrlSearchCriteria.PruneFieldFiltersOfUnwantedFields(sEntityName, fieldFilters);

        // Sort by category and name
        fieldFilters.sort(function (a, b)
        {
            return a.label.localeCompare(b.label);
        });

        // Return all field filters
        return fieldFilters;
    },

    PruneFieldFiltersOfUnwantedFields: function (sEntityName, fieldFilters)
    {
		var unwantedFields = null;

        switch(sEntityName)
		{
			case 'Placement':
				unwantedFields = ['PlacementConfigFields_CandidateEMail'];
				break;

            case 'Timesheet':
				unwantedFields = ['TimesheetConfigFields_DeductionCode', 'TimesheetConfigFields_DeductionPeriod',
                                      'TimesheetConfigFields_ExpenseCode', 'TimesheetConfigFields_ExpensePeriod',
                                        'Timesheet_TimesheetPeriodId', 'TaskLink', 'TimesheetConfigFields_TimesheetType'];
                break;
        }

        if (unwantedFields)
        {
            // Remove unwanted fields
            ctrlSearchCriteria.RemoveSpecifiedFieldsFromFilters(fieldFilters, unwantedFields);
        }
    },

    // We want tight control over what we supply so drive from our search-criteria-entity-fields.json file
    GetFieldDescriptionsForEntitySearching: function(sEntityName)
    {
        // Get the field descriptions for this entity only
        var fieldDescriptions = TriSysSDK.CShowForm.fieldDescriptions(sEntityName);

        // Only some of these are required
        var allowedTableFieldNames = [], ignoredTableFieldNames = [];
        var tableFieldNameData = ctrlSearchCriteria.AllowedTableFieldNamesForEntity(sEntityName);
        if (tableFieldNameData)
        {
            allowedTableFieldNames = tableFieldNameData.AllowedTableFieldNames;
            ignoredTableFieldNames = tableFieldNameData.IgnoredTableFieldNames;
        }
       
        var fieldDescriptionsToSearch = [];

        // Enumerate through all remaining fields and add to list of filters
        for (var i = 0; i < fieldDescriptions.length; i++)
        {
            var fieldDescription = fieldDescriptions[i];

            // Debug
            //if (fieldDescription.TableFieldName == "Department" || fieldDescription.TableFieldName == "Division")
            //{
            //    debugger;       // Why is this added to fields?
            //}

            // Add filter if a lookup or in our allowed list
            var bAddFilter = false;
            if (fieldDescription.Lookup)
            {
                // All entity field lookups are included unless blacklisted in the "IgnoredLookupTableFieldNames" list
                bAddFilter = !($.inArray(fieldDescription.TableFieldName, ignoredTableFieldNames) >= 0);

                if(bAddFilter)
                {
                    // The skill category has to exist - this stops old legacy fields being displayed
                    bAddFilter = false;
                    var categories = TriSysApex.Cache.SkillCategories();
                    for (var c = 0; c < categories.length; c++)
                    {
                        var category = categories[c];
                        if(category.Category.trim() == fieldDescription.TableFieldName.trim())
                            bAddFilter = true;
                    }
                }
            }
            else
            {
                bAddFilter = ($.inArray(fieldDescription.TableFieldName, allowedTableFieldNames) >= 0);
            }


			if (bAddFilter)
			{
				fieldDescriptionsToSearch.push(fieldDescription);
			}
        }

        // 15 Feb 2022: We are now allowing custom code to infiltrate these field descriptions for searching
        // Therefore take a copy of this list
        fieldDescriptionsToSearch = JSON.parse(JSON.stringify(fieldDescriptionsToSearch));

        return fieldDescriptionsToSearch;
    },


    // We do not want all field descriptions per entity because this complicates the product.
    // Also, some fields are inconsistent so we choose to implement a form of cross entity searching for these 'special' fields.
    // This function lists the allowed fields per entity by reading from the {company specific?} .json file
    AllowedTableFieldNamesForEntity: function (sEntityName, allowedTableFieldNames, ignoredTableFieldNames)
    {
        var bCustomConfiguration = TriSysApex.Constants.CustomSearchCriteriaEntityFields;   // Nov 2020: allow custom .json
        var jsonData = TriSysApex.Forms.Configuration.JsonFileData('search-criteria-entity-fields.json', bCustomConfiguration);
        if (jsonData)
        {
            for (var i = 0; i < jsonData.Data.length; i++)
            {
                var entityData = jsonData.Data[i];
                if(entityData.EntityName == sEntityName)
                {
                    var tableFieldNameData = {
                        AllowedTableFieldNames: entityData.AllowedTableFieldNames,
                        IgnoredTableFieldNames: entityData.IgnoredLookupTableFieldNames,
                        IgnoredCrossEntityFieldNames: entityData.IgnoredCrossEntityFieldNames
                    };
                    return tableFieldNameData;
                }
            }
        }

        return null;
    },

    // A cross entity search field is one that joins entities together,
    // for example a company name for a contact entity, or a client contact for a requirement, or a placement reference for a timesheet.
    // There are also complex fields such as currency amount period and skills which are also essential.
    //
    AddCrossEntitySearchFields: function (sEntityName, fieldFilters, sSearchButton)
    {
        // Generic

        // Entity ID
        var entityIDFilter = ctrlSearchCriteria.FieldTypeFilter.NumberField(null, sEntityName + ctrlSearchCriteria.EntityFields.EntityIdSuffix, "ID", null);
        fieldFilters.push(entityIDFilter);

        var bTaskType = (sEntityName == "Task");
        if (bTaskType)
        {
            // Task Type
            var taskTypeFilter = ctrlSearchCriteria.FieldTypeFilter.TaskTypeField();
            if (taskTypeFilter)
                fieldFilters.push(taskTypeFilter);
        }
        else
        {
            // Entity type
            var entityTypeFilter = ctrlSearchCriteria.FieldTypeFilter.EntityTypeField(sEntityName);
            if (entityTypeFilter)
                fieldFilters.push(entityTypeFilter);

            // Task
            var taskFilter = ctrlSearchCriteria.FieldTypeFilter.TaskField(sEntityName);
            fieldFilters.push(taskFilter);
        }


        // Company Name, City, Country, Job Title & User
        switch (sEntityName)
        {
            case 'Contact':
            case 'Requirement':
            case 'Placement':

                var sCompanyFieldGroup = "Company";
                var companyNameFilter = ctrlSearchCriteria.FieldTypeFilter.TextField(null, ctrlSearchCriteria.EntityFields.CompanyName, "Company Name", sCompanyFieldGroup, null, sSearchButton);
                fieldFilters.push(companyNameFilter);

                var jobTitleFilter = ctrlSearchCriteria.FieldTypeFilter.JobTitleField(sEntityName);
                if (jobTitleFilter)
                    fieldFilters.push(jobTitleFilter);

                // User
                var entityUserFilter = ctrlSearchCriteria.FieldTypeFilter.EntityUserField(sEntityName);
                if (entityUserFilter)
                    fieldFilters.push(entityUserFilter);

                break;            
        }

        // Company Address City + Country
        switch (sEntityName)
        {
			case 'Contact':

				// June 2018 - GDPR
				var automatedNotificationEMailSentFilter = ctrlSearchCriteria.FieldTypeFilter.BooleanField(
					ctrlSearchCriteria.EntityFields.AutomatedNotificationEMailSent, "Automated Notification EMail Sent", sEntityName);
				fieldFilters.push(automatedNotificationEMailSentFilter);

				var agreedToMarCommsFilter = ctrlSearchCriteria.FieldTypeFilter.BooleanField(
					ctrlSearchCriteria.EntityFields.AgreeToMarketingCommunications, "Agreed To Marketing Communications", sEntityName);
				fieldFilters.push(agreedToMarCommsFilter);

				var deletionRequestReceivedFilter = ctrlSearchCriteria.FieldTypeFilter.BooleanField(
					ctrlSearchCriteria.EntityFields.DeletionRequestReceived, "Deletion Request Received", sEntityName);
				fieldFilters.push(deletionRequestReceivedFilter);

				var restrictDataProcessingRequestedFilter = ctrlSearchCriteria.FieldTypeFilter.BooleanField(
					ctrlSearchCriteria.EntityFields.RestrictDataProcessingRequested, "Restrict Data Processing Requested", sEntityName);
				fieldFilters.push(restrictDataProcessingRequestedFilter);

			    // 06 Dec 2021
				var agreedToPrivacyPolicy = ctrlSearchCriteria.FieldTypeFilter.BooleanField(
                                    ctrlSearchCriteria.EntityFields.AgreedToPrivacyPolicy, "Agreed to Privacy Policy", sEntityName);
				fieldFilters.push(agreedToPrivacyPolicy);

				var dataPortabilityRequestReceived = ctrlSearchCriteria.FieldTypeFilter.BooleanField(
                                    ctrlSearchCriteria.EntityFields.DataPortabilityRequestReceived, "Data Portability Request Received", sEntityName);
				fieldFilters.push(dataPortabilityRequestReceived);

				// Yes - no break!

            case 'Company':

                var bLoggedIntoTriSysCRM = TriSysApex.LoginCredentials.isLoggedInToSpecificCompanyAsRecruiter("TriSys Business Software");
                if (bLoggedIntoTriSysCRM)
                {
                    var customerAtAnyTimeFilter = ctrlSearchCriteria.FieldTypeFilter.BooleanField(
                                                        ctrlSearchCriteria.EntityFields.CustomerAtAnyTime, "Customer at any time", sEntityName);
					fieldFilters.push( customerAtAnyTimeFilter );

					var companyOKtoServiceFilter = ctrlSearchCriteria.FieldTypeFilter.BooleanField(
						ctrlSearchCriteria.EntityFields.CompanyOKtoService, "Company OK to Service", sEntityName );
					fieldFilters.push( companyOKtoServiceFilter );

                }
                else
                {
                    // Recruitment specific fields for contacts and companies e.g. requirement count, placement count, timesheet count, task count
                    var numericOperators = ['greater', 'greater_or_equal', 'less', 'less_or_equal', 'between', 'equal', 'not_equal'];
                    var requirementClientCountFilter = ctrlSearchCriteria.FieldTypeFilter.NumberField(null,
                                                                            ctrlSearchCriteria.EntityFields.RequirementClientCount,
                                                                            "Requirement " + (sEntityName == 'Contact' ? '(Client) ' : '') + "Count",
                                                                            sEntityName, true, numericOperators);
                    fieldFilters.push(requirementClientCountFilter);

                    var placementClientCountFilter = ctrlSearchCriteria.FieldTypeFilter.NumberField(null,
                                                                            ctrlSearchCriteria.EntityFields.PlacementClientCount,
                                                                            "Placement " + (sEntityName == 'Contact' ? '(Client) ': '') + "Count",
                                                                            sEntityName, true, numericOperators);
                    fieldFilters.push(placementClientCountFilter);

                    if(sEntityName == 'Contact')
                    {
                        var requirementCandidateCountFilter = ctrlSearchCriteria.FieldTypeFilter.NumberField(null,
                                                                            ctrlSearchCriteria.EntityFields.RequirementCandidateCount,
                                                                            "Requirement (Candidate) Count",
                                                                            sEntityName, true, numericOperators);
                        fieldFilters.push(requirementCandidateCountFilter);

                        var placementCandidateCountFilter = ctrlSearchCriteria.FieldTypeFilter.NumberField(null,
                                                                            ctrlSearchCriteria.EntityFields.PlacementCandidateCount,
                                                                            "Placement (Candidate) Count",
                                                                            sEntityName, true, numericOperators);
                        fieldFilters.push(placementCandidateCountFilter);
                    }
                }
                // Yes - no break!

            case 'Requirement':
            case 'Placement':

                var sCompanyFieldGroup = "Company";

                var companyAddressCityFilter = ctrlSearchCriteria.FieldTypeFilter.TextField(null, ctrlSearchCriteria.EntityFields.CompanyAddressCity, "Company Address City", sCompanyFieldGroup, null, sSearchButton);
                fieldFilters.push(companyAddressCityFilter);

                var companyAddressCountyFilter = ctrlSearchCriteria.FieldTypeFilter.TextField(null, ctrlSearchCriteria.EntityFields.CompanyAddressCounty, "Company Address County", sCompanyFieldGroup, null, sSearchButton);
                fieldFilters.push(companyAddressCountyFilter);

                var companyAddressCountryFilter = ctrlSearchCriteria.FieldTypeFilter.TextField(null, ctrlSearchCriteria.EntityFields.CompanyAddressCountry, "Company Address Country", sCompanyFieldGroup, null, sSearchButton);
                fieldFilters.push(companyAddressCountryFilter);

                break;
        }

        // Client Contact Full Name, Site Address, Reference and Charge/Pay Rates
        switch (sEntityName)
        {
            case 'Requirement':
            case 'Placement':

                var clientNameFilter = ctrlSearchCriteria.FieldTypeFilter.TextField(null, ctrlSearchCriteria.EntityFields.ClientContactName, "Client Contact Full Name", "Contact", null, sSearchButton);
                fieldFilters.push(clientNameFilter);

                var siteAddressRadiusFilter = ctrlSearchCriteria.FieldTypeFilter.AddressRadius(ctrlSearchCriteria.EntityFields.SiteAddressRadius, "Site Address Radius", "Address");
                fieldFilters.push(siteAddressRadiusFilter);

                var referenceFilter = ctrlSearchCriteria.FieldTypeFilter.TextField(null, ctrlSearchCriteria.EntityFields.Reference, "Reference", sEntityName, null, sSearchButton);
                fieldFilters.push(referenceFilter);

                var operators = ['less', 'less_or_equal', 'greater', 'greater_or_equal'];
                var payRateFilter = ctrlSearchCriteria.FieldTypeFilter.CurrencyAmountPeriodField(null, ctrlSearchCriteria.EntityFields.StandardPayRate, "Standard Pay Rate", sEntityName, operators);
                fieldFilters.push(payRateFilter);

                var chargeRateFilter = ctrlSearchCriteria.FieldTypeFilter.CurrencyAmountPeriodField(null, ctrlSearchCriteria.EntityFields.StandardChargeRate, "Standard Charge Rate", sEntityName, operators);
                fieldFilters.push(chargeRateFilter);

                break;
        }

        // Candidate Contact Full Name
        switch (sEntityName)
        {
            case 'Placement':

                var candidateNameFilter = ctrlSearchCriteria.FieldTypeFilter.TextField(null, ctrlSearchCriteria.EntityFields.CandidateContactName, "Candidate Contact Full Name", "Contact", null, sSearchButton);
                fieldFilters.push(candidateNameFilter);

                break;
        }

        if (sEntityName != "Timesheet" && sEntityName != "Task")
        {
            // Skill categories - these are NOT field lookups, rather skill categories NOT linked to fields but allowed
            ctrlSearchCriteria.AddGeneralPurposeSkillCategories(sEntityName, fieldFilters);
        }


        // Specific
        switch(sEntityName)
        {
            case 'Contact':

                var contactPriorityFilter = ctrlSearchCriteria.FieldTypeFilter.ContactPriorityField();
                if (contactPriorityFilter)
                    fieldFilters.push(contactPriorityFilter);

                var contactTitleFilter = ctrlSearchCriteria.FieldTypeFilter.ContactTitleField();
                if (contactTitleFilter)
                    fieldFilters.push(contactTitleFilter);

                var contactOwnerFilter = ctrlSearchCriteria.FieldTypeFilter.ContactOwnerField();
                if (contactOwnerFilter)
                    fieldFilters.push(contactOwnerFilter);

                var homeAddressCityFilter = ctrlSearchCriteria.FieldTypeFilter.TextField(null, ctrlSearchCriteria.EntityFields.HomeAddressCity, "Home Address City", null, null, sSearchButton);
                fieldFilters.push(homeAddressCityFilter);

                var homeAddressCountyFilter = ctrlSearchCriteria.FieldTypeFilter.TextField(null, ctrlSearchCriteria.EntityFields.HomeAddressCounty, "Home Address County", null, null, sSearchButton);
                fieldFilters.push(homeAddressCountyFilter);

                var homeAddressCountryFilter = ctrlSearchCriteria.FieldTypeFilter.TextField(null, ctrlSearchCriteria.EntityFields.HomeAddressCountry, "Home Address Country", null, null, sSearchButton);
                fieldFilters.push(homeAddressCountryFilter);

				// 07 March 2018 - this has been replaced with a Skill
                //var contactSexFilter = ctrlSearchCriteria.FieldTypeFilter.ContactSexField();
                //fieldFilters.push(contactSexFilter);

                var CVSearchOperators = ['contains', 'not_contains'];
                var cvSearchFilter = ctrlSearchCriteria.FieldTypeFilter.TextField(null, ctrlSearchCriteria.EntityFields.CandidateCVFreeTextSearch, "CV Free Text Search", "Contact", CVSearchOperators, sSearchButton);
                fieldFilters.push(cvSearchFilter);

                var homeAddressRadiusFilter = ctrlSearchCriteria.FieldTypeFilter.AddressRadius(ctrlSearchCriteria.EntityFields.HomeAddressRadius, "Home Address Radius", "Address");
                fieldFilters.push(homeAddressRadiusFilter);

                var workAddressRadiusFilter = ctrlSearchCriteria.FieldTypeFilter.AddressRadius(ctrlSearchCriteria.EntityFields.WorkAddressRadius, "Work Address Radius", "Address");
                fieldFilters.push(workAddressRadiusFilter);

                var telephoneNumberFilter = ctrlSearchCriteria.FieldTypeFilter.TextField(null, ctrlSearchCriteria.EntityFields.AnyTelephoneNumber, "Telephone Number", sEntityName,
					['begins_with', 'ends_with', 'contains', 'is_null'], sSearchButton);
                fieldFilters.push(telephoneNumberFilter);

                var emailAddressFilter = ctrlSearchCriteria.FieldTypeFilter.TextField(null, ctrlSearchCriteria.EntityFields.AnyEMailAddress, "E-Mail Address", sEntityName,
					['begins_with', 'ends_with', 'contains', 'equal', 'not_equal', 'is_null', 'is_not_null'], sSearchButton);
                fieldFilters.push(emailAddressFilter);

				// November 2018
				if (TriSysApex.LoginCredentials.isLoggedInToSpecificCompanyAsRecruiter("CoSector"))
				{
					var qualificationsFilter = ctrlSearchCriteria.FieldTypeFilter.Qualifications(ctrlSearchCriteria.EntityFields.Qualifications, "Qualifications", "Qualifications");
					fieldFilters.push(qualificationsFilter);
				}

                // September 2020
				var socialOperators = ['is_not_null', 'is_null', 'contains'];
				var socialNetworks = [ctrlSearchCriteria.EntityFields.LinkedIn, ctrlSearchCriteria.EntityFields.Twitter, ctrlSearchCriteria.EntityFields.Facebook,
                                        ctrlSearchCriteria.EntityFields.YouTube, ctrlSearchCriteria.EntityFields.Instagram, ctrlSearchCriteria.EntityFields.Pinterest];
				socialNetworks.forEach(function (socialNetwork) {
				    socialFilter = ctrlSearchCriteria.FieldTypeFilter.TextField(null, socialNetwork, socialNetwork, sEntityName, socialOperators, sSearchButton);
				    fieldFilters.push(socialFilter);
				});

                // September 2018
				if (TriSysApex.LoginCredentials.isLoggedInToSpecificCompanyAsRecruiter("Law Absolute")) {
				    var candidateSummaryFilter = ctrlSearchCriteria.FieldTypeFilter.TextField(null, ctrlSearchCriteria.EntityFields.CandidateSummary, "Candidate Summary", sEntityName,
					['begins_with', 'ends_with', 'contains', 'equal', 'not_equal', 'is_null', 'is_not_null'], sSearchButton);
				    fieldFilters.push(candidateSummaryFilter);
				}

                break;

            case 'Company':

                var companyIndustryFilter = ctrlSearchCriteria.FieldTypeFilter.CompanyIndustryField();
                if (companyIndustryFilter)
                    fieldFilters.push(companyIndustryFilter);

                var siteAddressRadiusFilter = ctrlSearchCriteria.FieldTypeFilter.AddressRadius(ctrlSearchCriteria.EntityFields.SiteAddressRadius, "Address Radius", "Address");
                fieldFilters.push(siteAddressRadiusFilter);

                var telephoneNumberFilter = ctrlSearchCriteria.FieldTypeFilter.TextField(null, ctrlSearchCriteria.EntityFields.AnyTelephoneNumber, "Telephone Number", sEntityName,
					['begins_with', 'ends_with', 'contains','is_null'], sSearchButton);
                fieldFilters.push(telephoneNumberFilter);

                var emailAddressFilter = ctrlSearchCriteria.FieldTypeFilter.TextField(null, ctrlSearchCriteria.EntityFields.AnyEMailAddress, "E-Mail Address", sEntityName,
					['begins_with', 'ends_with', 'contains', 'equal', 'not_equal', 'is_null', 'is_not_null'], sSearchButton);
                fieldFilters.push(emailAddressFilter);

                break;

            case 'Requirement':

                //Total Shortlisted
                var totalShortlistedFilter = ctrlSearchCriteria.FieldTypeFilter.NumberField(null, ctrlSearchCriteria.EntityFields.TotalShortlisted, "Total Shortlisted",
                                    sEntityName, true, ['greater', 'greater_or_equal', 'less', 'less_or_equal', 'equal', 'not_equal']);
                fieldFilters.push(totalShortlistedFilter);

                // 22 Mar 2023
                var CVSentFilter = ctrlSearchCriteria.FieldTypeFilter.NumberField(null, ctrlSearchCriteria.EntityFields.CVSentCount, "CV Sent Count",
                                    sEntityName, true, ['greater', 'greater_or_equal', 'less', 'less_or_equal', 'equal', 'not_equal']);
                fieldFilters.push(CVSentFilter);

                var InterviewsFilter = ctrlSearchCriteria.FieldTypeFilter.NumberField(null, ctrlSearchCriteria.EntityFields.InterviewCount, "Interview Count",
                                    sEntityName, true, ['greater', 'greater_or_equal', 'less', 'less_or_equal', 'equal', 'not_equal']);
                fieldFilters.push(InterviewsFilter);

                // 23 Mar 2023
                var placedFilter = ctrlSearchCriteria.FieldTypeFilter.NumberField(null, ctrlSearchCriteria.EntityFields.Placed, "Placed",
                                    sEntityName, true, ['greater', 'greater_or_equal', 'less', 'less_or_equal', 'equal', 'not_equal']);
                fieldFilters.push(placedFilter);

                break;

            case 'Timesheet':

                // Placement
                var placementFilter = ctrlSearchCriteria.FieldTypeFilter.TextField(null, "PlacementReference", "Placement Reference", "Placement", null, sSearchButton);
                fieldFilters.push(placementFilter);

                // 22 Feb 2022
                var placementUserFilter = ctrlSearchCriteria.FieldTypeFilter.EntityUserField("Placement", "Placement User");
                if (placementUserFilter)
                    fieldFilters.push(placementUserFilter);

                // Company
                var companyNameFilter = ctrlSearchCriteria.FieldTypeFilter.TextField(null, "Company", "Company Name", "Company", null, sSearchButton);
                fieldFilters.push(companyNameFilter);

                // Job Title
                var jobTitleFilter = ctrlSearchCriteria.FieldTypeFilter.TextField(null, "JobTitle", "Job Title", "Placement", null, sSearchButton);
                fieldFilters.push(jobTitleFilter);

                // Candidate
                var candidateNameFilter = ctrlSearchCriteria.FieldTypeFilter.TextField(null, "Candidate", "Candidate Name", "Contact", null, sSearchButton);
                fieldFilters.push(candidateNameFilter);

                // Input Date
                var candidateNameFilter = ctrlSearchCriteria.FieldTypeFilter.DateField(null, "InputDate", "Input Date", "Timesheet");
                fieldFilters.push(candidateNameFilter);                

                // Period - text field
                var periodFilter = ctrlSearchCriteria.FieldTypeFilter.TextField(null, "Description", "Period", "Timesheet", null, sSearchButton);
                fieldFilters.push(periodFilter);

                // Period Range - date field
				var periodRangeFilter = ctrlSearchCriteria.FieldTypeFilter.DateField(null, "PeriodRange", "Period Range", "Timesheet");
				fieldFilters.push(periodRangeFilter); 

                // Total Time Worked
                var timeWorkedFilter = ctrlSearchCriteria.FieldTypeFilter.NumberField(null, "TotalTimeWorked", "Total Time Worked", null);
                fieldFilters.push(timeWorkedFilter);

                // Authorised
                //var authorisedFilter = ctrlSearchCriteria.FieldTypeFilter.YesNoTextField("PaymentAuthorised", "Authorised", "Timesheet");
                var authorisedFilter = ctrlSearchCriteria.FieldTypeFilter.BooleanField("PaymentAuthorised", "Authorised", "Timesheet");
                fieldFilters.push(authorisedFilter);

                // Paid
                var paidFilter = ctrlSearchCriteria.FieldTypeFilter.BooleanField("Payrolled", "Paid", "Timesheet");
                fieldFilters.push(paidFilter);

                break;

            case 'Task':

                // User
                var entityUserFilter = ctrlSearchCriteria.FieldTypeFilter.EntityUserField(sEntityName);
                if (entityUserFilter)
                    fieldFilters.push(entityUserFilter);

                var sCompanyFieldGroup = "Company";
                var companyNameFilter = ctrlSearchCriteria.FieldTypeFilter.TextField(null, ctrlSearchCriteria.EntityFields.CompanyName, "Company Name", sCompanyFieldGroup, null, sSearchButton);
                fieldFilters.push(companyNameFilter);

                var contactNameFilter = ctrlSearchCriteria.FieldTypeFilter.TextField(null, ctrlSearchCriteria.EntityFields.ContactName, "Contact Full Name", "Contact", null, sSearchButton);
                fieldFilters.push(contactNameFilter);

                var descriptionFilter = ctrlSearchCriteria.FieldTypeFilter.TextField(null, "Description", "Description", "Task", null, sSearchButton);
                fieldFilters.push(descriptionFilter);

                // Start and End Dates
                var startDateFilter = ctrlSearchCriteria.FieldTypeFilter.DateField(null, "StartDate", "Start Date", "Task");
                fieldFilters.push(startDateFilter);
                var endDateFilter = ctrlSearchCriteria.FieldTypeFilter.DateField(null, "EndDate", "End Date", "Task");
                fieldFilters.push(endDateFilter);

                // Skill categories - we want only those that appear in ctrlTask. See ctrlSkillsTree
                ctrlSearchCriteria.AddTaskSkillCategories(fieldFilters);

                break;
        }

        // Hang-on - list all of these fields now as we want to add these to the master list of available fields
        //console.log("Cross Entity Search Fields Master List:");
        //fieldFilters.forEach(function (filter) {
        //    console.log(filter.id + ": " + filter.label);
        //});

        // All cross entity fields are included unless blacklisted in the "IgnoredCrossEntityFieldNames"
        var tableFieldNameData = ctrlSearchCriteria.AllowedTableFieldNamesForEntity(sEntityName);
        if (tableFieldNameData)
        {
            var ignoredCrossEntityFieldNames = tableFieldNameData.IgnoredCrossEntityFieldNames;
            if(ignoredCrossEntityFieldNames)
            {
                for(var i = fieldFilters.length - 1; i >= 0; i--)
                {
                    var fieldFilter = fieldFilters[i];
                    var bIgnored = (ignoredCrossEntityFieldNames.indexOf(fieldFilter.id) >= 0);
                    if (bIgnored)
                        fieldFilters.splice(i, 1);
                }

                //console.log("Cross Entity Search Fields Pruned List:");
                //fieldFilters.forEach(function (filter) {
                //    console.log(filter.id + ": " + filter.label);
                //});
            }
        }
    },

    AddGeneralPurposeSkillCategories: function (sEntityName, fieldFilters)
    {
        var categories = TriSysApex.Cache.SystemSettingManager.GeneralSkillCategories()
        if (!categories)
            return;

        for (var i = 0; i < categories.length; i++)
        {
            var category = categories[i];

            // This is a general purpose skill category which will be added to the list of skills
            var fieldDescription = { TableFieldName: category.Category };

            var sFieldID = sEntityName + "Skill_" + category.Category.trim();
            var sDisplayName = category.Category.trim();

            var fieldFilter = ctrlSearchCriteria.FieldTypeFilter.SkillField(fieldDescription, sFieldID, sDisplayName, "Attributes/Skills");

            fieldFilters.push(fieldFilter);
        }
    },

    AddTaskSkillCategories: function (fieldFilters)
    {
        var categories = TriSysApex.Cache.SkillCategories();
        var skills = TriSysApex.Cache.Skills();

        // The ones we ignore
        var sSetting = 'Ignore Task Skill Categories';
        var sSystemSetting = TriSysApex.Cache.SystemSettingManager.GetValue(sSetting);
        var trimmedIgnoreCategories = ['Gender'];

        if (sSystemSetting)
        {
            var sSplitChar = ";";
            var arrayIgnoreCategories = sSystemSetting.split(sSplitChar);

            $.each(arrayIgnoreCategories, function (index, sIgnore) {
                sIgnore = sIgnore.trim();
                trimmedIgnoreCategories.push(sIgnore);
            });
        }

        for (var i = 0; i < categories.length; i++)
        {
            var category = categories[i];
            var bFound = ($.inArray(category.Category, trimmedIgnoreCategories) >= 0);

            if (category.FieldId == 0 && !bFound)
            {
                var fieldDescription = { TableFieldName: category.Category };

                var sFieldID = "TaskSkill_" + category.Category.trim();
                var sDisplayName = category.Category.trim();

                var fieldFilter = ctrlSearchCriteria.FieldTypeFilter.SkillField(fieldDescription, sFieldID, sDisplayName, "Attributes/Skills");

                fieldFilters.push(fieldFilter);
            }
        }
    },

    RemoveSpecifiedFieldsFromFilters: function (fieldFilters, fields)
    {
        for (var i = fieldFilters.length - 1; i >= 0; i--)
        {
            var fieldFilter = fieldFilters[i];

            if (fields.indexOf(fieldFilter.id) >= 0)
                fieldFilters.splice(i, 1);
        }
    },

    // See Web API: CSearchTreeManager.vb
    EntityFields:       // ctrlSearchCriteria.EntityFields
    {
        CompanyName: "Company_CompanyName",
        CompanyAddressCity: "Company_AddressCity",
        CompanyAddressCounty: "Company_AddressCounty",
        CompanyAddressCountry: "Company_AddressCountry",
        ClientContactName: "ClientContact_FullName",
        CandidateContactName: "CandidateContact_FullName",
        ContactName: "Contact_FullName",
        HomeAddressCity: "Home_AddressCity",
        HomeAddressCounty: "Home_AddressCounty",
        HomeAddressCountry: "Home_AddressCountry",
        EntityIdSuffix: "_Entity_Id",
        CandidateCVFreeTextSearch: "Contact_CVSearch",
        SiteAddressRadius: "SiteAddressRadius",                 // Company, Requirement, Placement
        HomeAddressRadius: "HomeAddressRadius",                 // Contact Home
        WorkAddressRadius: "WorkAddressRadius",                 // Contact Work
        Reference: "Reference",
        AnyTelephoneNumber: "AnyTelephoneNumber",               // Work, Home, Company
        AnyEMailAddress: "AnyEMailAddress",                     // Work, personal, company
        StandardPayRate: "StandardPayRate",                     // Requirement and Placement
        StandardChargeRate: "StandardChargeRate",               // Requirement and Placement
        TotalShortlisted: "TotalShortlisted",                   // Requirement
        CVSentCount: "CVSentCount",                             // Requirement 22 Mar 2023
        InterviewCount: "InterviewCount",                       // Requirement 22 Mar 2023
        Placed: "Placed",                                       // Requirement 23 Mar 2023
        TaskLink: "TaskLink",                                   // All entities
		CustomerAtAnyTime: "CustomerAtAnyTime",                 // CRM Contact or Company
		CompanyOKtoService: "CompanyOKtoService",               // CRM Contact or Company
		AutomatedNotificationEMailSent: "AutomatedNotificationEMailSent",    // CRM Contact
		AgreeToMarketingCommunications: "AgreeToMarketingCommunications",    // CRM Contact
		DeletionRequestReceived: "DeletionRequestReceived",		// CRM Contact or Company
		RestrictDataProcessingRequested: "RestrictDataProcessingRequested",
		AgreedToPrivacyPolicy: "AgreedToPrivacyPolicy",                     // 06 Dec 2021
		DataPortabilityRequestReceived: "DataPortabilityRequestReceived",   // 06 Dec 2021
        RequirementClientCount: "RequirementClientCount",       // Recruitment Contact or Company
        PlacementClientCount: "PlacementClientCount",           // Recruitment Contact or Company
        RequirementCandidateCount: "RequirementCandidateCount", // Recruitment Contact or Company
        PlacementCandidateCount: "PlacementCandidateCount",     // Recruitment Contact or Company
        PlacementCount: "PlacementCount",                       // Recruitment Contact or Company
        TimesheetCount: "TimesheetCount",                       // Recruitment Contact or Company
        TaskCount: "TaskCount",                                 // Recruitment Contact or Company
        Qualifications: "Qualifications",						// CoSector Contact
        LinkedIn: "LinkedIn",                                   // Sep 2020
        Twitter: "Twitter",                                     // Sep 2020
        Facebook: "Facebook",                                   // Sep 2020
        YouTube: "YouTube",                                     // Sep 2020
        Instagram: "Instagram",                                 // Sep 2020
        Pinterest: "Pinterest",                                 // Sep 2020
        CandidateSummary: "CandidateSummary"                    // Sep 2020
    },

    // Each field type has a filter based on the field type
    FieldTypeFilter:        // ctrlSearchCriteria.FieldTypeFilter
    {
        Filter: function (sEntityName, fieldDescription, sSearchButton)
        {
            var fieldFilter = null;
            var sTableFieldSeparator = "_";     // Perisistence does not work if it is .
            var sFieldID = fieldDescription.TableName + sTableFieldSeparator + fieldDescription.TableFieldName;

            // Make the description as standard and legible as possible
            var sDisplayName = ctrlSearchCriteria.FieldTypeFilter.FieldDisplayName(sEntityName, fieldDescription);

            var sFieldGroup = sEntityName;

            // Deal with exceptions e.g. Contact.Forenames = Contact.Christian
            sFieldID = ctrlSearchCriteria.FieldTypeFilter.FieldDescriptionException(sFieldID, fieldDescription);

            if (!sFieldID)
                return null;        // Field may be ignored

            // Get the correct filter based upon the field type
            switch(fieldDescription.FieldTypeId)
            {
                case TriSysSDK.Controls.FieldTypes.Text:
                case TriSysSDK.Controls.FieldTypes.EMail:
                case TriSysSDK.Controls.FieldTypes.Image:
                case TriSysSDK.Controls.FieldTypes.Internet:
                case TriSysSDK.Controls.FieldTypes.Telephone:
                case TriSysSDK.Controls.FieldTypes.WebPage:
                case TriSysSDK.Controls.FieldTypes.Password:
                case TriSysSDK.Controls.FieldTypes.FileReference:

                    if (fieldDescription.Lookup && sFieldID != "Contact_Users")
                    {
                        // Lookup
                        fieldFilter = ctrlSearchCriteria.FieldTypeFilter.SkillField(fieldDescription, sFieldID, sDisplayName, "Field Lookups");
                    }
                    else
                        fieldFilter = ctrlSearchCriteria.FieldTypeFilter.TextField(fieldDescription, sFieldID, sDisplayName, sFieldGroup, null, sSearchButton);

                    break;

                case TriSysSDK.Controls.FieldTypes.List:
                case TriSysSDK.Controls.FieldTypes.MultiSelectList:    // 04 Oct 2022
                    fieldFilter = ctrlSearchCriteria.FieldTypeFilter.SkillField(fieldDescription, sFieldID, sDisplayName, "Field Lookups");
                    break;

                case TriSysSDK.Controls.FieldTypes.Integer:
                case TriSysSDK.Controls.FieldTypes.Float:
                case TriSysSDK.Controls.FieldTypes.Currency:
                case TriSysSDK.Controls.FieldTypes.Percent:
                    fieldFilter = ctrlSearchCriteria.FieldTypeFilter.NumberField(fieldDescription, sFieldID, sDisplayName, sFieldGroup);
                    break;

                case TriSysSDK.Controls.FieldTypes.Date:
                    fieldFilter = ctrlSearchCriteria.FieldTypeFilter.DateField(fieldDescription, sFieldID, sDisplayName, sFieldGroup);
                    break;

                case TriSysSDK.Controls.FieldTypes.CurrencyAmountPeriod:
                    fieldFilter = ctrlSearchCriteria.FieldTypeFilter.CurrencyAmountPeriodField(fieldDescription, sFieldID, sDisplayName, sFieldGroup);
                    break;

                case TriSysSDK.Controls.FieldTypes.CurrencyAmount:
                    fieldFilter = ctrlSearchCriteria.FieldTypeFilter.CurrencyAmountField(fieldDescription, sFieldID, sDisplayName, sFieldGroup);
                    break;

                case TriSysSDK.Controls.FieldTypes.YesNo:
                    fieldFilter = ctrlSearchCriteria.FieldTypeFilter.BooleanField(sFieldID, sDisplayName, sFieldGroup);
                    break;
	
				case TriSysSDK.Controls.FieldTypes.User:
					fieldFilter = ctrlSearchCriteria.FieldTypeFilter.UserField(sEntityName, sFieldID, sDisplayName, sEntityName, "owner users");
					break;

                // TODO: The Rest ;-|
            }


            return fieldFilter;
        },

        // Make the display name the user sees standard across entities and also replace duplicate use
        // of the same entity name and also camel space case.
        FieldDisplayName: function (sEntityName, fieldDescription)
        {
            // Default
            var sDisplayName = fieldDescription.FieldLabel;
            if (!sDisplayName)            
                sDisplayName = fieldDescription.TableFieldName;

            switch(sDisplayName)
            {
                case "Last Contact":        // An exception to this rule
                case "Next Contact":        // An exception to this rule
                    break;

                default:
                    // Tweek to remove entity name e.g. "CompanyDivision"
                    sDisplayName = sDisplayName.replace(sEntityName + ' ', '');
                    sDisplayName = sDisplayName.replace(sEntityName, '');
            }

            // Remove legacy chars
            sDisplayName = sDisplayName.replace("&", '');
            sDisplayName = sDisplayName.replace("#", '');
            sDisplayName = sDisplayName.replace("%", 'Percentage');
            sDisplayName = sDisplayName.replace("/", '');
            sDisplayName = sDisplayName.replace(":", '');


            // Add spaces before non-zero index upper case chars
            // TODO if necessary

            return sDisplayName;
        },

        // Deal with field exceptions
        FieldDescriptionException: function (sFieldId, fieldDescription)
        {
            switch(sFieldId)
            {
                case "Contact_Forenames":
                    sFieldId = "Contact_Christian";
                    break;

                case "Contact_Age":
                    sFieldId = null;
                    break;

                //case "ContactConfigFields_TypeOfWorkRequired":
                //    fieldDescription.FieldTypeId = TriSysSDK.Controls.FieldTypes.Text;
                //    break;

                default:
                    if (sFieldId.indexOf('\n') >= 0)        // Legacy garbage from database
                        sFieldId = null;
                    break;
            }

            return sFieldId;
        },

        TextField: function (fieldDescription, sFieldID, sDisplayName, sFieldGroup, operators, sSearchButton)
        {
            if(TriSysAPI.Operators.isEmpty(operators))
                operators = ['begins_with', 'ends_with', 'contains', 'not_contains', 'equal', 'not_equal', 'is_null', 'is_not_null'];

            var fieldFilter = {
                id: sFieldID,
                label: sDisplayName,
                type: 'string',
                operators: operators,
                //optgroup: sFieldGroup,
                size: 35,
                default_value: ''

                // New code 07 Mar 2016
                , input: function (rule)
                {
                    // Give the widget a unique name as the user may create multiple versions of the same field!
                    var sFieldWidgetID = "textBox-" + sFieldID + '-' + TriSysSDK.Miscellaneous.RandomNumber(1000, 10000000);

                    // Set this as data in the rule so that we can get at the values
                    rule.data = ctrlSearchCriteria.FieldTypeFilter.ParseFilterRuleDataWrite(sFieldWidgetID);

                    // A text box
                    var sInputHTML = '<input class="form-control" type="text" id="' + sFieldWidgetID + '" size="50" style="width: 100%;">';

                    // Need to set the <Enter> key using our own timer
                    var iMilliSeconds = 50;
                    setTimeout(function ()
                    {
                        var ruleData = rule.data;

                        if (ruleData)
                        {
                            // If we have a default value, set this now
                            var sText = ruleData.Skills; // Yes .Skills to save creating yet more properties
                            if (sText && ruleData.FieldWidgetID)
                                $('#' + ruleData.FieldWidgetID).val(sText);


                            // Capture enter key to do lookup
                            $('#' + ruleData.FieldWidgetID).keyup(function (e)
                            {
                                if (e.keyCode == 13 && ruleData.FieldWidgetID)
                                {
                                    var sText = $('#' + ruleData.FieldWidgetID).val();
                                    //TriSysApex.Toasters.Success(sText);

                                    // The search button and trigger a click: search-criteria-lookup-button-contact-lookup-criteria
                                    $(sSearchButton).trigger('click');
                                }
                            });
                        }

                    }, iMilliSeconds);

                    return sInputHTML;
                },
                valueParser: function (rule, value)
                {
                    // The unique ID of the widget
                    var ruleData = rule.data;

                    if (ruleData && ruleData.FieldWidgetID)
                        return $('#' + ruleData.FieldWidgetID).val();
                },
                valueSetter: function (rule, value)
                {
                    if (rule.operator.nb_inputs !== 0)
                    {
                        try
                        {
                            // The unique ID of the KendoUI widget
                            var ruleData = rule.data;

                            // Value is a date (or string)
                            var sText = value;

                            // Set the skills into the rule data so that it will be populated when drawn in timer above
                            if (ruleData && ruleData.FieldWidgetID)
                                rule.data = ctrlSearchCriteria.FieldTypeFilter.ParseFilterRuleDataWrite(ruleData.FieldWidgetID, sText);

                        } catch (e)
                        {

                        }
                    }
                }
                // End of new code 07 Mar 2016
            };

            return fieldFilter;
        },

        NumberField: function (fieldDescription, sFieldID, sDisplayName, sFieldGroup, bInteger, operators)
        {
            if (TriSysAPI.Operators.isEmpty(operators))
                operators = ['equal', 'not_equal', 'between', 'less', 'less_or_equal', 'greater', 'greater_or_equal'];	//, 'is_null', 'is_not_null']; Removed 02 April 2020

            var sType = "double";
            if (bInteger)
                sType = "integer";

            var validation = {
                min: 0,
                step: bInteger ? 1 : 0.05
            };

            if (fieldDescription)
            {
                if (fieldDescription.MinValue)
                    validation.min = parseFloat(fieldDescription.MinValue);
                if (fieldDescription.MaxValue)
                    validation.max = parseFloat(fieldDescription.MaxValue);
                if (fieldDescription.SpinIncrement)
                    validation.step = parseFloat(fieldDescription.SpinIncrement);
            }

            var fieldFilter = {
                id: sFieldID,
                label: sDisplayName,
                type: sType,
                operators: operators,
                //optgroup: sFieldGroup,
                size: 5,
                validation: validation
            };            

            return fieldFilter;
        },

        // Although the query builder provides a date control plugin, it is woeful because it is inherently US specific and will
        // not do date formatting according to normal rules. Also the styles are screwy.
        // Decided to implement our own date control using our own SDK.
        DateField: function (fieldDescription, sFieldID, sDisplayName, sFieldGroup)
        {
            // Unfortunately, the query builder cannot do 'between' for custom fields! 
			var operators = ['greater', 'greater_or_equal', 'less', 'less_or_equal', 'equal', 'not_equal', 'is_null', 'is_not_null'];

            var fieldFilter = {
                id: sFieldID,
                label: sDisplayName,
                type: 'date',        // Probably end up as a string
                operators: operators,
                validation: {
                    callback: function (value, rule)
                    {
                        // If operator is is_null or is_not_null, then allow null input
                        var bError = true;
                        return true;        // TODO
                    }
                },
                input: function (rule)
                {
                    // Give the widget a unique name as the user may create multiple versions of the same field!
                    var sFieldWidgetID = "date-" + sFieldID + '-' + TriSysSDK.Miscellaneous.RandomNumber(1000, 10000000);

                    // Set this as data in the rule so that we can get at the values
                    rule.data = ctrlSearchCriteria.FieldTypeFilter.ParseFilterRuleDataWrite(sFieldWidgetID);

                    // A regular kendoui date picker
                    var sInputHTML = '<input type="text" id="' + sFieldWidgetID + '" style="width: 250px;" />';

                    // Need to populate this using our own timer
                    var iMilliSeconds = 50;
                    setTimeout(function ()
                    {
                        var ruleData = rule.data;

                        if (ruleData)
                        {
                            // Create the field widget 
                            TriSysSDK.CShowForm.datePicker(ruleData.FieldWidgetID);

                            // If we have a default value, set this now
                            if (ruleData.DateValue)
                                TriSysSDK.CShowForm.setDatePickerValue(ruleData.FieldWidgetID, ruleData.DateValue);
                        }

                    }, iMilliSeconds);

                    return sInputHTML;
                },
                valueParser: function (rule, value)
                {
                    // The unique ID of the KendoUI widget
                    var ruleData = rule.data;

                    if(ruleData)
                        return TriSysSDK.CShowForm.getDatePickerValue(ruleData.FieldWidgetID);
                },
                valueSetter: function (rule, value)
                {
                    if (rule.operator.nb_inputs !== 0)
                    {
                        try
                        {
                            // The unique ID of the KendoUI widget
                            var ruleData = rule.data;

                            // Value is a date (or string)
                            var dt = value;

                            // Set the skills into the rule data so that it will be populated when drawn in timer above
                            if(ruleData)
                                rule.data = ctrlSearchCriteria.FieldTypeFilter.ParseFilterRuleDataWrite(ruleData.FieldWidgetID, null, dt);

                        } catch (e)
                        {

                        }
                    }
                }
            };

            return fieldFilter;
        },

        // The classic composite field comprising 2 combos and a numeric field
        CurrencyAmountPeriodField: function (fieldDescription, sFieldID, sDisplayName, sFieldGroup, operators)
        {
            // Unfortunately, the query builder cannot do 'between' for custom fields!             
            if (TriSysAPI.Operators.isEmpty(operators))
                operators = ['equal', 'not_equal', 'less', 'less_or_equal', 'greater', 'greater_or_equal'];	//, 'is_null', 'is_not_null']; Removed 02 April 2020

            var fieldFilter = {
                id: sFieldID,
                label: sDisplayName,
                type: 'string',
                operators: operators,
                validation: {
                    callback: function (value, rule)
                    {
                        // If operator is is_null or is_not_null, then allow null input
                        var bError = true;
                        return true;        // TODO
                    }
                },
                input: function (rule)
                {
                    // Give the widget a unique name as the user may create multiple versions of the same field!
                    var sFieldWidgetID = "cap-" + sFieldID + '-' + TriSysSDK.Miscellaneous.RandomNumber(1000, 10000000);

                    // Set this as data in the rule so that we can get at the values
                    rule.data = ctrlSearchCriteria.FieldTypeFilter.ParseFilterRuleDataWrite(sFieldWidgetID);

                    // The composite currency amount period tag
                    var sInputHTML = '<div id="' + sFieldWidgetID + '" style="width:320px;"></div>';

                    // Need to populate this using our own timer to give control a chance to load
                    var iMilliSeconds = 50;
                    setTimeout(function ()
                    {
                        var ruleData = rule.data;

                        // This is an asynchronously loaded control hence we need yet another callback
                        // to populate the value after load
                        var fnAfterLoad = function ()
                        {
                            // If we have a default value, set this now
                            if (ruleData && ruleData.CurrencyAmountPeriod)
                                TriSysSDK.Controls.CurrencyAmountPeriod.SetCurrencyAmountPeriod(ruleData.FieldWidgetID, ruleData.CurrencyAmountPeriod);
                        };

                        // Create the field widget 
                        if (ruleData)
                            TriSysSDK.Controls.CurrencyAmountPeriod.Load(ruleData.FieldWidgetID, fieldDescription, fnAfterLoad);

                    }, iMilliSeconds);

                    return sInputHTML;
                },
                valueParser: function (rule, value)
                {
                    // The unique ID of the KendoUI widget
                    var ruleData = rule.data;

                    if (ruleData)
                        return TriSysSDK.Controls.CurrencyAmountPeriod.GetCurrencyAmountPeriod(ruleData.FieldWidgetID);
                },
                valueSetter: function (rule, value)
                {
                    if (rule.operator.nb_inputs !== 0)
                    {
                        try
                        {
                            // The unique ID of the KendoUI widget
                            var ruleData = rule.data;

                            // Value is a string: "£120 per Day"
                            var sCurrencyAmountPeriodValue = value;

                            // Set the value into the rule data so that it will be populated when drawn in timer above
                            rule.data = ctrlSearchCriteria.FieldTypeFilter.ParseFilterRuleDataWrite(ruleData.FieldWidgetID, null, null, sCurrencyAmountPeriodValue);

                        } catch (e)
                        {
							// 3rd party control
                        }
                    }
                }
            };

            return fieldFilter;
        },

        // Almost a copy of the above, but slightly simpler
        CurrencyAmountField: function (fieldDescription, sFieldID, sDisplayName, sFieldGroup)
        {
            // Unfortunately, the query builder cannot do 'between' for custom fields! 
            var operators = ['equal', 'not_equal', 'less', 'less_or_equal', 'greater', 'greater_or_equal'];	//, 'is_null', 'is_not_null']; Removed 02 April 2020

            var fieldFilter = {
                id: sFieldID,
                label: sDisplayName,
                type: 'string',
                operators: operators,
                validation: {
                    callback: function (value, rule)
                    {
                        // If operator is is_null or is_not_null, then allow null input
                        var bError = true;
                        return true;        // TODO
                    }
                },
                input: function (rule)
                {
                    // Give the widget a unique name as the user may create multiple versions of the same field!
                    var sFieldWidgetID = "ca-" + sFieldID + '-' + TriSysSDK.Miscellaneous.RandomNumber(1000, 10000000);

                    // Set this as data in the rule so that we can get at the values
                    rule.data = ctrlSearchCriteria.FieldTypeFilter.ParseFilterRuleDataWrite(sFieldWidgetID);

                    // The composite currency amount period tag
                    var sInputHTML = '<div id="' + sFieldWidgetID + '" style="width:250px;"></div>';

                    // Need to populate this using our own timer to give control a chance to load
                    var iMilliSeconds = 50;
                    setTimeout(function ()
                    {
                        var ruleData = rule.data;

                        // This is an asynchronously loaded control hence we need yet another callback
                        // to populate the value after load
                        var fnAfterLoad = function ()
                        {
                            // If we have a default value, set this now
                            if (ruleData && ruleData.CurrencyAmountPeriod)
                                TriSysSDK.Controls.CurrencyAmount.SetCurrencyAmount(ruleData.FieldWidgetID, ruleData.CurrencyAmountPeriod);
                        };

                        // Create the field widget 
                        if (ruleData)
                            TriSysSDK.Controls.CurrencyAmount.Load(ruleData.FieldWidgetID, fieldDescription, fnAfterLoad);

                    }, iMilliSeconds);

                    return sInputHTML;
                },
                valueParser: function (rule, value)
                {
                    // The unique ID of the KendoUI widget
                    var ruleData = rule.data;

                    if (ruleData)
                        return TriSysSDK.Controls.CurrencyAmount.GetCurrencyAmount(ruleData.FieldWidgetID);
                },
                valueSetter: function (rule, value)
                {
                    if (rule.operator.nb_inputs !== 0)
                    {
                        try
                        {
                            // The unique ID of the KendoUI widget
                            var ruleData = rule.data;

                            // Value is a string: "£120,000"
                            var sCurrencyAmountValue = value;

                            // Set the value into the rule data so that it will be populated when drawn in timer above
                            rule.data = ctrlSearchCriteria.FieldTypeFilter.ParseFilterRuleDataWrite(ruleData.FieldWidgetID, null, null, sCurrencyAmountValue);

                        } catch (e)
                        {

                        }
                    }
                }
            };

            return fieldFilter;
        },

        BooleanField: function (sFieldID, sDisplayName, sFieldGroup)
        {
            var operators = ['equal'];

            var fieldFilter = {
                id: sFieldID,
                label: sDisplayName,
                type: 'integer',
                operators: operators,
                validation: {
                    callback: function (value, rule)
                    {
                        // If operator is is_null or is_not_null, then allow null input
                        var bError = true;
                        return true;        // TODO
                    }
                },
                input: function (rule)
                {
                    // Give the widget a unique name as the user may create multiple versions of the same field!
                    var sFieldWidgetID = "boolean-" + sFieldID + '-' + TriSysSDK.Miscellaneous.RandomNumber(1000, 10000000);

                    // Set this as data in the rule so that we can get at the values
                    rule.data = ctrlSearchCriteria.FieldTypeFilter.ParseFilterRuleDataWrite(sFieldWidgetID);

                    // The HTML for the spinner and the post code 
                    var sInputHTML = '<label class="switch switch-primary">' +
                                    '    <input type="checkbox" id="' + sFieldWidgetID + '" value="0" unchecked>' +                                    
                                    '    <span></span>' +
                                    '</label>';

                    // Need to populate this using our own timer to give control a chance to load
                    var iMilliSeconds = 50;
                    setTimeout(function ()
                    {
                        var ruleData = rule.data;

                        if (ruleData)
                        {
                            // Set the value
                            if (!TriSysAPI.Operators.isEmpty(ruleData.Skills))
                            {
                                var b = (parseInt(ruleData.Skills) == 1) ? true : false;
                                TriSysSDK.CShowForm.SetCheckBoxValue(ruleData.FieldWidgetID, b);
                            }
                        }

                    }, iMilliSeconds);

                    return sInputHTML;
                },
                valueParser: function (rule, value)
                {
                    var ruleData = rule.data;

                    if (ruleData)
                    {
                        var iValue = TriSysSDK.CShowForm.GetCheckBoxValue(ruleData.FieldWidgetID)

                        return (iValue ? 1 : 0);
                    }
                },
                valueSetter: function (rule, value)
                {
                    if (rule.operator.nb_inputs !== 0)
                    {
                        try
                        {
                            var ruleData = rule.data;

                            // Value is an integer 1 or 0
                            var b = value;
                            
                            // Set the value into the rule data so that it will be populated when drawn in timer above
                            if (ruleData)
                                rule.data = ctrlSearchCriteria.FieldTypeFilter.ParseFilterRuleDataWrite(ruleData.FieldWidgetID, b);

                        } catch (e)
                        {

                        }
                    }
                }
            };

            return fieldFilter;
        },

        AddressRadius: function (sFieldID, sDisplayName, sFieldGroup)
        {
            // Unfortunately, the query builder cannot do 'between' for custom fields! 
            var operators = ['less', 'less_or_equal', 'greater', 'greater_or_equal'];

            var fieldFilter = {
                id: sFieldID,
                label: sDisplayName,
                type: 'string',
                operators: operators,
                validation: {
                    callback: function (value, rule)
                    {
                        // If operator is is_null or is_not_null, then allow null input
                        var bError = true;
                        return true;        // TODO
                    }
                },
                input: function (rule)
                {
                    // Give the widget a unique name as the user may create multiple versions of the same field!
                    var sFieldWidgetID = "radial-" + sFieldID + '-' + TriSysSDK.Miscellaneous.RandomNumber(1000, 10000000);

                    // Set this as data in the rule so that we can get at the values
                    rule.data = ctrlSearchCriteria.FieldTypeFilter.ParseFilterRuleDataWrite(sFieldWidgetID);

                    // The HTML for the spinner and the post code 
                    var sMileageID = sFieldWidgetID + '-mileage';
                    var sPostCodeID = sFieldWidgetID + '-postcode';
                    var sPreHTML = '<div id="' + sFieldWidgetID + '" style="width:320px;">', sPostHTML = '</div>';                    
                    var sHTML1 = '<div style="width: 350px; height: 26px">';
                    var sHTML2 = '<div style="float: left; width:70px"><input id="' + sMileageID + '" type="number" value="0" min="0" step="1" style="width:100%;" /></div>';
                    var sHTML3 = '<div style="float: left; width:65px; padding-left:0px; text-align:center; padding-top: 5px;">miles of</div>';
                    var sHTML4 = '<div style="float: left; width:50px;"><input class="k-textbox" id="' + sPostCodeID +
                                    '" style="width:100%; height:100%; margin-top:1px; text-transform: uppercase;" maxlength="4" ' +
                                    ' required pattern="[A-Za-z]{1,2}[0-9Rr][0-9A-Za-z]" /></div>';
                    var sInputHTML = sPreHTML + sHTML1 + sHTML2 + sHTML3 + sHTML4 + sPostHTML;

                    // Need to populate this using our own timer to give control a chance to load
                    var iMilliSeconds = 50;
                    setTimeout(function ()
                    {
                        var ruleData = rule.data;

                        var sMileageID = ruleData.FieldWidgetID + '-mileage';
                        var sPostCodeID = ruleData.FieldWidgetID + '-postcode';

                        // Create the field widgets
                        var iMaximumMiles = 50;
                        iMaximumMiles = TriSysApex.Cache.SystemSettingManager.GetValue('Radial Searching Maximum Mileage', iMaximumMiles);
                        var fd = { MinValue: 1, MaxValue: iMaximumMiles, SpinIncrement: 1 };
                        TriSysSDK.Controls.NumericSpinner.Initialise(sMileageID, fd);

                        // Set the value
                        if(ruleData.PostCodeRadial)
                        {
                            var parts = ruleData.PostCodeRadial.split(",");
                            TriSysSDK.Controls.NumericSpinner.SetValue(sMileageID, parseFloat(parts[0]));
                            $('#' + sPostCodeID).val(parts[1]);
                        }

                    }, iMilliSeconds);

                    return sInputHTML;
                },
                valueParser: function (rule, value)
                {
                    var ruleData = rule.data;

                    var sMileageID = ruleData.FieldWidgetID + '-mileage';
                    var sPostCodeID = ruleData.FieldWidgetID + '-postcode';

                    var sExpression = TriSysSDK.Controls.NumericSpinner.GetValue(sMileageID) + "," + $('#' + sPostCodeID).val();

                    return sExpression;
                },
                valueSetter: function (rule, value)
                {
                    if (rule.operator.nb_inputs !== 0)
                    {
                        try
                        {
                            var ruleData = rule.data;

                            // Value is a string: "8,CB1"
                            var sExpression = value;

                            // Set the value into the rule data so that it will be populated when drawn in timer above
                            rule.data = ctrlSearchCriteria.FieldTypeFilter.ParseFilterRuleDataWrite(ruleData.FieldWidgetID, null, null, null, sExpression);

                        } catch (e)
                        {

                        }
                    }
                }
            };

            return fieldFilter;
        },

		// See CoSector.ctrlQualifications.html for layout specifics
		Qualifications: function(sFieldID, sDisplayName, sFieldGroup)
        {
            // The sames operators for skills
            var operators = ['in', 'not_in'];

            var fieldFilter = {
                id: sFieldID,
                label: sDisplayName,
                type: 'string',
                operators: operators,
                validation: {
                    callback: function (value, rule)
                    {
                        // If operator is is_null or is_not_null, then allow null input
                        var bError = true;
                        return true;        // TODO
                    }
                },
                input: function (rule)
                {
                    // Give the widget a unique name as the user may create multiple versions of the same field!
                    var sFieldWidgetID = "qualificationWidget-" + sFieldID + '-' + TriSysSDK.Miscellaneous.RandomNumber(1000, 10000000);

                    // Set this as data in the rule so that we can get at the values
                    rule.data = ctrlSearchCriteria.FieldTypeFilter.ParseFilterRuleDataWrite(sFieldWidgetID);

                    // The composite qualification search criteria tag
                    var sInputHTML = '<div id="' + sFieldWidgetID + '" ></div>';
                    
                    // Need to populate this using our own timer to give control a chance to load
                    var iMilliSeconds = 50;
                    setTimeout(function ()
                    {
                        var ruleData = rule.data;

                        // This is an asynchronously loaded control hence we need yet another callback
                        // to populate the value after load
                        var fnAfterLoad = function ()
                        {
                            // If we have a default value, set this now
                            if (ruleData.QualificationSearchCriteria)
                                ctrlSearchCriteria.QualificationSearchCriteria.SetValue(ruleData.FieldWidgetID, ruleData.QualificationSearchCriteria);
                        };

                        // Create the field widget 
                        ctrlSearchCriteria.QualificationSearchCriteria.Load(ruleData.FieldWidgetID, fnAfterLoad);

                    }, iMilliSeconds);

                    return sInputHTML;
                },
                valueParser: function (rule, value)
                {
                    var ruleData = rule.data;

                    return ctrlSearchCriteria.QualificationSearchCriteria.GetValue(ruleData.FieldWidgetID);
                },
                valueSetter: function (rule, value)
                {
                    if (rule.operator.nb_inputs !== 0)
                    {
                        try
                        {
                            var ruleData = rule.data;

                            //                     Institute       Level    Subject     Result   Year
                            // Value is a string: "Anglia Ruskin, 'Bsc',    'Maths',	'2.1',	 1985"
							// No Garry, don't be a knob! Use JSON you fool!
                            var sQualificationSearchCriteria = value;

                            // Set the value into the rule data so that it will be populated when drawn in timer above
                            rule.data = ctrlSearchCriteria.FieldTypeFilter.ParseFilterRuleDataWrite(ruleData.FieldWidgetID, null, null, null, null, null, sQualificationSearchCriteria);

                        } catch (e)
                        {

                        }
                    }
                }
            };

            return fieldFilter;
		},

        // Each skill category has its own skill field. This is different from the V10 approach.
        //
        SkillField: function (fieldDescription, sFieldID, sDisplayName, sCategory)
        {
            var fnCreateAndPopulateWidget = function (sFieldWidgetID, sTableFieldName, sLookups)
            {
                var sCategory = sTableFieldName;

                // 15 Feb 2022: Skill Combo!
                if (fieldDescription.SkillComboCategory)
                    sCategory = fieldDescription.SkillComboCategory;

                // Create the field widget
                TriSysSDK.CShowForm.skillList(sFieldWidgetID, sCategory);

                // Set the current values into the widget
                TriSysSDK.CShowForm.SetSkillsInList(sFieldWidgetID, sLookups);
            };

            var fnParseValues = function (sFieldWidgetID, sTableFieldName)
            {
                // Get the list of comma separated skills
                var sSkills = TriSysSDK.CShowForm.GetSelectedSkillsFromList(sFieldWidgetID);

                // Convert these into SkillID's using our cache
                var SkillIDs = ctrlSearchCriteria.FieldTypeFilter.ConvertSkillsInCategoryIntoSkillIdArray(sTableFieldName, sSkills);

                return SkillIDs;
            };

            var fnConvertIDsToLookupStrings = function (lstLookupIDs)
            {
                if (!lstLookupIDs)
                    return;

                var sSkills = '';

                for (var i = 0; i < lstLookupIDs.length; i++)
                {
                    var iSkillId = lstLookupIDs[i];

                    // Get the skill
                    var skill = ctrlSearchCriteria.FieldTypeFilter.GetSkillFromCacheBySkillId(iSkillId);
                    if (skill)
                    {
                        // Append to comma separated list
                        if (sSkills.length > 0)
                            sSkills += ', ';

                        sSkills += skill.Skill;
                    }
                }

                return sSkills;
            };

            // This is a multi-select lookup field
            var fieldFilter = ctrlSearchCriteria.FieldTypeFilter.MultiSelectLookupField(fieldDescription, sFieldID, sDisplayName, sCategory, "skills",
                    fnCreateAndPopulateWidget, fnParseValues, fnConvertIDsToLookupStrings);

            return fieldFilter;
        },

        SkillFieldPrefix: "skill-",

        // Generic IN/NOT IN lookup field which is used by field lookups, skills, entity types, users etc..
        //
        MultiSelectLookupField: function (fieldDescription, sFieldID, sDisplayName, sFieldGroup, sDescriptionPlural,
                                                fnCreateAndPopulateWidget, fnParseValues, fnConvertIDsToLookupStrings)
        {
            // Must replace spaces and / chars for DOM ID's - some skill categories have these chars!
            //sFieldID = TriSysSDK.Controls.FileManager.StripInconvenientFileNameCharacters(sFieldID, false);
			// No - not in Jan 2020 as we need the server to know the full skill category
			// VSS seems to indicate that this code has been in Apex for 2 years and no-one noticed!

            // The operators for skills
            var operators = ['in', 'not_in'];

            var fieldFilter = {
                id: sFieldID,
                label: sDisplayName,
                type: 'integer',        // An array of Skill ID's
                operators: operators,
                //optgroup: sFieldGroup,
                validation: {
                    callback: function (value, rule)
                    {
                        // Must select one or more skills else we show error - quite right too ;-)
                        var bError = true;
                        if (value)
                        {
                            if (value.length > 0)
                                bError = false;
                        }

                        return (!bError ? true : 'Please enter one or more ' + sDescriptionPlural + ', or choose another field, or remove this row.');
                    }
                },
                input: function (rule)
                {
                    // There are strict DOM rules on what characters are allowed in ID's
                    var sFieldIDEscaped = TriSysSDK.Miscellaneous.EscapeDOMid(sFieldID);

                    // Give the widget a unique name as the user may create multiple versions of the same field!
                    var sFieldWidgetID = ctrlSearchCriteria.FieldTypeFilter.SkillFieldPrefix + sFieldIDEscaped + '-' + TriSysSDK.Miscellaneous.RandomNumber(1000, 10000000);

                    // Set this as data in the rule so that we can get at the values
                    var sSkillList = null;
                    rule.data = ctrlSearchCriteria.FieldTypeFilter.ParseFilterRuleDataWrite(sFieldWidgetID, sSkillList);

                    // A multi-select combo
                    var sStyle = 'style="width:100%;"';
                    sStyle = '';
                    var sInputHTML = '<input type="text" id="' + sFieldWidgetID + '"' + sStyle + ' />';

                    // Need to populate this using our own timer
                    var iMilliSeconds = 50;
                    setTimeout(function ()
                    {
                        var ruleData = rule.data;

                        // Create the field widget and supply the lookup values into the widget
                        fnCreateAndPopulateWidget(ruleData.FieldWidgetID, fieldDescription.TableFieldName, ruleData.Skills);

                    }, iMilliSeconds);

                    return sInputHTML;
                },
                valueParser: function (rule, value)
                {
                    // The unique ID of the KendoUI widget
                    var ruleData = rule.data;

                    // 15 Feb 2022: Skill Combo!
                    var sSkillCategory = fieldDescription.TableFieldName;
                    if (fieldDescription.SkillComboCategory) 
                        sSkillCategory = fieldDescription.SkillComboCategory;

                    return fnParseValues(ruleData.FieldWidgetID, sSkillCategory);
                },
                valueSetter: function (rule, value)
                {
                    if (rule.operator.nb_inputs !== 0)
                    {
                        try
                        {
                            // The unique ID of the KendoUI widget
                            var ruleData = rule.data;

                            // Create the widget now - NO!
                            // We must create the widget in the input() above because that is called every time
                            // whereas we are only called if data exists
                            //TriSysSDK.CShowForm.skillList(sFieldWidgetID, fieldDescription.TableFieldName);

                            // Value is an array of integers
                            var sSkills = fnConvertIDsToLookupStrings(value);

                            // Set the skills into the rule data so that it will be populated when drawn in timer above
                            rule.data = ctrlSearchCriteria.FieldTypeFilter.ParseFilterRuleDataWrite(ruleData.FieldWidgetID, sSkills);

                        } catch (e)
                        {

                        }
                    }
                }
            };

            return fieldFilter;
        },

        // Only used in entity task search
        TaskTypeField: function()
        {
            var sFieldID = "TaskType";
            var sDisplayName = "Task Type";
            var sCategory = "Task";

            var fieldDescription = { TableFieldName: sFieldID };

            var fnCreateAndPopulateWidget = function (sFieldWidgetID, sTableFieldName, sLookups)
            {
                // Create the field widget
                TriSysSDK.CShowForm.taskTypeMultiSelectCombo(sFieldWidgetID);

                // Set the current values into the widget
                TriSysSDK.CShowForm.SetSkillsInList(sFieldWidgetID, sLookups);
            };

            var fnParseValues = function (sFieldWidgetID, sTableFieldName)
            {
                // Get the list of comma separated strings
                var valuesArray = TriSysSDK.CShowForm.GetSelectedSkillsFromListAsArray(sFieldWidgetID);

                if (valuesArray)
                {
                    var idValues = [];
                    for (var i = 0; i < valuesArray.length; i++)
                    {
                        var sTaskType = valuesArray[i];

                        // Get the task type
                        var taskType = TriSysApex.Cache.TaskTypesManager.TaskTypeFromName(sTaskType);
                        if (taskType)
                        {
                            // Add to the list
                            idValues.push(taskType.TaskTypeId);
                        }
                    }

                    return idValues;
                }
            };

            var fnConvertIDsToLookupStrings = function (lstLookupIDs)
            {
                if (!lstLookupIDs)
                    return;

                var sTaskTypes = '';

                for (var i = 0; i < lstLookupIDs.length; i++)
                {
                    var iTaskTypeID = lstLookupIDs[i];

                    // Get the task type
                    var taskType = TriSysApex.Cache.TaskTypesManager.TaskTypeFromId(iTaskTypeID);
                    if (taskType)
                    {
                        // Append to comma separated list
                        if (sTaskTypes.length > 0)
                            sTaskTypes += ', ';

                        sTaskTypes += taskType.Name;
                    }
                }

                return sTaskTypes;
            };


            // This is a multi-select lookup field
            var fieldFilter = ctrlSearchCriteria.FieldTypeFilter.MultiSelectLookupField(fieldDescription, sFieldID, sDisplayName, sCategory, "task types",
                    fnCreateAndPopulateWidget, fnParseValues, fnConvertIDsToLookupStrings);

            return fieldFilter;
        },

        // e.g. ContactType of Candidate, Client, ClientCandidate, Referee etc..
        EntityTypeField: function (sEntityName)
        {
            var sFieldID = sEntityName + "Type";
            var sDisplayName = "Type";
            var sCategory = sEntityName;

            var fieldDescription = { TableFieldName: sFieldID };

            var fnCreateAndPopulateWidget = function (sFieldWidgetID, sTableFieldName, sLookups)
            {
                // Create the field widget
                TriSysSDK.CShowForm.entityTypeMultiSelectCombo(sEntityName, sFieldWidgetID);

                // Set the current values into the widget
                TriSysSDK.CShowForm.SetSkillsInList(sFieldWidgetID, sLookups);
            };
            
            var fnParseValues = function (sFieldWidgetID, sTableFieldName)
            {
                // Get the list of comma separated strings
                var valuesArray = TriSysSDK.CShowForm.GetSelectedSkillsFromListAsArray(sFieldWidgetID);

                if (valuesArray)
                {
                    var idValues = [];
                    for (var i = 0; i < valuesArray.length; i++)
                    {
                        var sEntityType = valuesArray[i];

                        // Get the entity type
                        var entityType = TriSysApex.Cache.EntityTypesManager.EntityTypeFromName(sEntityName, sEntityType);
                        if (entityType)
                        {
                            // Add to the list
                            idValues.push(entityType.EntityTypeId);
                        }
                    }

                    return idValues;
                }
            };
            
            var fnConvertIDsToLookupStrings = function (lstLookupIDs)
            {
                if (!lstLookupIDs)
                    return;

                var sEntityTypes = '';

                for (var i = 0; i < lstLookupIDs.length; i++)
                {
                    var iEntityTypeID = lstLookupIDs[i];

                    // Get the entity type
                    var entityType = TriSysApex.Cache.EntityTypesManager.EntityTypeFromId(iEntityTypeID);
                    if (entityType)
                    {
                        // Append to comma separated list
                        if (sEntityTypes.length > 0)
                            sEntityTypes += ', ';

                        sEntityTypes += entityType.Name;
                    }
                }

                return sEntityTypes;
            };
            

            // This is a multi-select lookup field
            var fieldFilter = ctrlSearchCriteria.FieldTypeFilter.MultiSelectLookupField(fieldDescription, sFieldID, sDisplayName, sCategory, "entity types",
                    fnCreateAndPopulateWidget, fnParseValues, fnConvertIDsToLookupStrings);

            return fieldFilter;
        },

        // Link to one or more users
        EntityUserField: function (sEntityName, sDisplayName)
        {
            var sFieldID = sEntityName + "User";

            if(!sDisplayName)
                sDisplayName = "User";

            var sCategory = sEntityName;

            var fieldFilter = ctrlSearchCriteria.FieldTypeFilter.UserField(sEntityName, sFieldID, sDisplayName, sCategory, "users");

            return fieldFilter;
        },

        // Link to one or more users - used by BOTH entity User AND contact owner user
        UserField: function (sEntityName, sFieldID, sDisplayName, sCategory, sWhatPlural)
        {
            var fieldDescription = { TableFieldName: sFieldID };

            var fnCreateAndPopulateWidget = function (sFieldWidgetID, sTableFieldName, sLookups)
            {
                // Create the field widget
                TriSysSDK.CShowForm.MultiUserCombo(sFieldWidgetID);

                // Set the current values into the widget
                TriSysSDK.CShowForm.SetSkillsInList(sFieldWidgetID, sLookups);
            };

            var fnParseValues = function (sFieldWidgetID, sTableFieldName)
            {
                // Get the list of comma separated strings
                var valuesArray = TriSysSDK.CShowForm.GetSelectedSkillsFromListAsArray(sFieldWidgetID);

                if (valuesArray)
                {
                    var idValues = [];
                    for (var i = 0; i < valuesArray.length; i++)
                    {
                        var sUserName = valuesArray[i];

                        // Get the user
                        var user = TriSysApex.Cache.UsersManager.UserFromFullName(sUserName);
                        if (user)
                        {
                            // Add to the list
                            idValues.push(user.UserId);
                        }
                    }

                    return idValues;
                }
            };

            var fnConvertIDsToLookupStrings = function (lstLookupIDs)
            {
                if (!lstLookupIDs)
                    return;

                var sUserNames = '';

                for (var i = 0; i < lstLookupIDs.length; i++)
                {
                    var iUserID = lstLookupIDs[i];

                    // Get the user
                    var user = TriSysApex.Cache.UsersManager.UserFromId(iUserID);
                    if (user)
                    {
                        // Append to comma separated list
                        if (sUserNames.length > 0)
                            sUserNames += ', ';

                        sUserNames += user.FullName;
                    }
                }

                return sUserNames;
            };


            // This is a multi-select lookup field
            var fieldFilter = ctrlSearchCriteria.FieldTypeFilter.MultiSelectLookupField(fieldDescription, sFieldID, sDisplayName, sCategory, sWhatPlural,
                    fnCreateAndPopulateWidget, fnParseValues, fnConvertIDsToLookupStrings);

            return fieldFilter;
        },

        // Like user link, but the owner is linked differently
        ContactOwnerField: function ()
        {
            var sEntityName = "Contact";
            var sFieldID = sEntityName + "Owner";
            var sDisplayName = "Owner";
            var sCategory = sEntityName;

            var fieldFilter = ctrlSearchCriteria.FieldTypeFilter.UserField(sEntityName, sFieldID, sDisplayName, sCategory, "owners");

            return fieldFilter;
        },

        // Link to one or more contact priorities
        ContactPriorityField: function()
        {
            var sEntityName = "Contact";
            var sFieldID = sEntityName + "Priority";
            var sDisplayName = "Priority";
            var sCategory = sEntityName;
            var fieldDescription = { TableFieldName: sFieldID };

            var fnCreateAndPopulateWidget = function (sFieldWidgetID, sTableFieldName, sLookups)
            {
                // Create the field widget
                var sourcePriorities = [];
                var priorities = TriSysApex.Cache.ContactPriorities();
                for (var i = 0; i < priorities.length; i++)
                {
                    var CContactPriorityColour = priorities[i];
                    var sourceStruct = {
                        value: CContactPriorityColour.ContactPriorityId,
                        text: CContactPriorityColour.ContactPriority
                    };
                    sourcePriorities.push(sourceStruct);
                }

                // Set this now
                TriSysSDK.CShowForm.populateMultiSelectComboFromDataSource(sFieldWidgetID, sourcePriorities);

                // Set the current values into the widget
                TriSysSDK.CShowForm.SetSkillsInList(sFieldWidgetID, sLookups);
            };

            var fnParseValues = function (sFieldWidgetID, sTableFieldName)
            {
                // Get the list of comma separated strings
                var valuesArray = TriSysSDK.CShowForm.GetSelectedSkillsFromListAsArray(sFieldWidgetID);

                if (valuesArray)
                {
                    var idValues = [];
                    for (var i = 0; i < valuesArray.length; i++)
                    {
                        var sPriority = valuesArray[i];

                        // Get the priority
                        var priority = TriSysApex.Cache.ContactPrioritiesManager.PriorityFromName(sPriority);
                        if (priority)
                        {
                            // Add to the list
                            idValues.push(priority.ContactPriorityId);
                        }
                    }

                    return idValues;
                }
            };

            var fnConvertIDsToLookupStrings = function (lstLookupIDs)
            {
                if (!lstLookupIDs)
                    return;

                var sPriorities = '';

                for (var i = 0; i < lstLookupIDs.length; i++)
                {
                    var iContactPriorityId = lstLookupIDs[i];

                    // Get the priority
                    var priority = TriSysApex.Cache.ContactPrioritiesManager.PriorityFromId(iContactPriorityId);
                    if (priority)
                    {
                        // Append to comma separated list
                        if (sPriorities.length > 0)
                            sPriorities += ', ';

                        sPriorities += priority.ContactPriority;
                    }
                }

                return sPriorities;
            };


            // This is a multi-select lookup field
            var fieldFilter = ctrlSearchCriteria.FieldTypeFilter.MultiSelectLookupField(fieldDescription, sFieldID, sDisplayName, sCategory, "contact priorities",
                    fnCreateAndPopulateWidget, fnParseValues, fnConvertIDsToLookupStrings);

            return fieldFilter;
        },

        ContactSexField: function()
        {
            var sEntityName = "Contact";
            var sFieldID = sEntityName + "Sex";
            var sDisplayName = "Gender";
            var sCategory = sEntityName;
            var fieldDescription = { TableFieldName : sFieldID };

            var fnCreateAndPopulateWidget = function (sFieldWidgetID, sTableFieldName, sLookups)
            {
                // Create the field widget
                var sourceSex = [{ value: 1, text: 'Male' }, { value: 0, text: 'Female' }];

                // Set this now
                TriSysSDK.CShowForm.populateMultiSelectComboFromDataSource(sFieldWidgetID, sourceSex);

                // Set the current values into the widget
                TriSysSDK.CShowForm.SetSkillsInList(sFieldWidgetID, sLookups);
            };

            var fnParseValues = function (sFieldWidgetID, sTableFieldName)
            {
                // Get the list of comma separated strings
                var valuesArray = TriSysSDK.CShowForm.GetSelectedSkillsFromListAsArray(sFieldWidgetID);

                if (valuesArray)
                {
                    var idValues =[];
                    for (var i = 0; i < valuesArray.length; i++)
                    {
                        var sSex = valuesArray[i];

                        // Add to the list
                        idValues.push(sSex == 'Male' ? 1 : 0);
                    }

                    return idValues;
                }
                };

            var fnConvertIDsToLookupStrings = function (lstLookupIDs)
            {
                if(!lstLookupIDs)
                    return;

                var sSexes = '';

                for (var i = 0; i < lstLookupIDs.length; i++)
                {
                    var iSex = lstLookupIDs[i];

                    // Append to comma separated list
                    if (sSexes.length > 0)
                        sSexes += ', ';

                    sSexes += (iSex == 1 ? 'Male' : 'Female');
                }

                return sSexes;
            };


            // This is a multi-select lookup field
            var fieldFilter = ctrlSearchCriteria.FieldTypeFilter.MultiSelectLookupField(fieldDescription, sFieldID, sDisplayName, sCategory, "genders",
                    fnCreateAndPopulateWidget, fnParseValues, fnConvertIDsToLookupStrings);

            return fieldFilter;
        },

        // Lookup job title field
        JobTitleField: function (sEntityName)
        {
            var sFieldID = sEntityName + "JobTitle";
            var sDisplayName = "Job Title";
            var sCategory = sEntityName;
            var fieldDescription = { TableFieldName: sFieldID };

            // The operators for job titles
            var operators = ['begins_with', 'ends_with', 'contains', 'not_contains', 'equal'];

            var fieldFilter = {
                id: sFieldID,
                label: sDisplayName,
                type: 'string',         // Because of the operators, we will get an array of values, but only need element 0
                operators: operators,
                //optgroup: sFieldGroup,
                validation: {
                    callback: function (value, rule)
                    {
                        // Must select a job title else we show error - quite right too ;-)
                        var bError = true;
                        if (value)
                        {
                            if (value.length > 0)
                                bError = false;
                        }

                        return (!bError ? true : 'Please enter a ' + sDisplayName + ', or choose another field, or remove this row.');
                    }
                },
                input: function (rule)
                {
                    // Give the widget a unique name as the user may create multiple versions of the same field!
                    var sFieldWidgetID = "jobTitle-" + sFieldID + '-' + TriSysSDK.Miscellaneous.RandomNumber(1000, 10000000);

                    // Set this as data in the rule so that we can get at the values
                    rule.data = ctrlSearchCriteria.FieldTypeFilter.ParseFilterRuleDataWrite(sFieldWidgetID, null);

                    // A text box with a lookup button
                    var sOnClick = "ctrlSearchCriteria.JobTitleLookup('" + sFieldWidgetID + "')";
                    var sInputHTML = '<table style="width: 100%;" cellpadding="0" cellspacing="0">' +
                                     '<tr>' +
                                     '       <td>' +
                                     '           <input id="' + sFieldWidgetID + '" type="text" class="k-textbox" style="width:100%" />' +
                                     '       </td>' +
                                     '       <td style="width: 40px; padding-left: 5px;">' +
                                     '           <button type="submit" class="btn btn-sm btn-default" onclick="' + sOnClick + '" title="Lookup Job Title" style="right:0px;">' +
                                     '               <i class="gi gi-search"></i>' +
                                     '           </button>' +
                                     '       </td>' +
                                     '   </tr>' +
                                     '</table>'

                    // Need to populate this using our own timer
                    var iMilliSeconds = 50;
                    setTimeout(function ()
                    {
                        var ruleData = rule.data;

                        // If we have a default value, set this now
                        var sJobTitle = ruleData.Skills; // Yes .Skills to save creating yet more properties
                        if (sJobTitle)
                            $('#' + ruleData.FieldWidgetID).val(sJobTitle);

                        // Capture enter key to do lookup
                        $('#' + ruleData.FieldWidgetID).keyup(function (e)
                        {
                            if (e.keyCode == 13)
                                ctrlSearchCriteria.JobTitleLookup(ruleData.FieldWidgetID);
                        });

                    }, iMilliSeconds);

                    return sInputHTML;
                },
                valueParser: function (rule, value)
                {
                    // The unique ID of the KendoUI widget
                    var ruleData = rule.data;

                    return $('#' + ruleData.FieldWidgetID).val();
                },
                valueSetter: function (rule, value)
                {
                    if (rule.operator.nb_inputs !== 0)
                    {
                        try
                        {
                            // The unique ID of the KendoUI widget
                            var ruleData = rule.data;

                            // Value is a string
                            var sJobTitle = value;

                            // Set the skills into the rule data so that it will be populated when drawn in timer above
                            rule.data = ctrlSearchCriteria.FieldTypeFilter.ParseFilterRuleDataWrite(ruleData.FieldWidgetID, sJobTitle);

                        } catch (e)
                        {

                        }
                    }
                }
            };

            return fieldFilter;
        },

        // Mr, Mrs etc..
        ContactTitleField: function ()
        {
            // Joanne says No
            // Francisco says Yes
        },

        // Company link to one or more industries
        CompanyIndustryField: function()
        {
            var sEntityName = "Company";
            var sFieldID = sEntityName + "_Industry";
            var sDisplayName = "Industry";
            var sCategory = sEntityName;
            var fieldDescription = { TableFieldName: sFieldID };

            var fnCreateAndPopulateWidget = function (sFieldWidgetID, sTableFieldName, sLookups)
            {
                // Create the field widget
                var sourceIndustries = [];
                var industries = TriSysApex.Cache.Industries();
                for (var i = 0; i < industries.length; i++)
                {
                    var Industry = industries[i];
                    var sourceStruct = {
                        value: Industry.IndustryId,
                        text: Industry.Name
                    };
                    sourceIndustries.push(sourceStruct);
                }

                // Set this now
                TriSysSDK.CShowForm.populateMultiSelectComboFromDataSource(sFieldWidgetID, sourceIndustries);

                // Set the current values into the widget
                TriSysSDK.CShowForm.SetSkillsInList(sFieldWidgetID, sLookups);
            };

            var fnParseValues = function (sFieldWidgetID, sTableFieldName)
            {
                // Get the list of comma separated strings
                var valuesArray = TriSysSDK.CShowForm.GetSelectedSkillsFromListAsArray(sFieldWidgetID);

                if (valuesArray)
                {
                    var idValues = [];
                    for (var i = 0; i < valuesArray.length; i++)
                    {
                        var sIndustry = valuesArray[i];

                        // Get the industry
                        var industry = TriSysApex.Cache.IndustryManager.IndustryFromName(sIndustry);
                        if (industry)
                        {
                            // Add to the list
                            idValues.push(industry.IndustryId);
                        }
                    }

                    return idValues;
                }
            };

            var fnConvertIDsToLookupStrings = function (lstLookupIDs)
            {
                if (!lstLookupIDs)
                    return;

                var sIndustries = '';

                for (var i = 0; i < lstLookupIDs.length; i++)
                {
                    var iIndustryId = lstLookupIDs[i];

                    // Get the user
                    var industry = TriSysApex.Cache.IndustryManager.IndustryFromId(iIndustryId);
                    if (industry)
                    {
                        // Append to comma separated list
                        if (sIndustries.length > 0)
                            sIndustries += ', ';

                        sIndustries += industry.Name;
                    }
                }

                return sIndustries;
            };

            // This is a multi-select lookup field
            var fieldFilter = ctrlSearchCriteria.FieldTypeFilter.MultiSelectLookupField(fieldDescription, sFieldID, sDisplayName, sCategory, "industries",
                    fnCreateAndPopulateWidget, fnParseValues, fnConvertIDsToLookupStrings);

            return fieldFilter;
        },

        // Tasks linked to the specified entity
        TaskField: function(sEntityName)
        {
            var sFieldID = ctrlSearchCriteria.EntityFields.TaskLink;
            var sDisplayName = "Task";
            var sCategory = sEntityName;

            var operators = ['in', 'not_in'];

            var fieldFilter = {
                id: sFieldID,
                label: sDisplayName,
                type: 'string',         // Because of the operators, we will get an array of values, but only need element 0
                operators: operators,
                validation: {
                    callback: function (value, rule)
                    {
                        // If operator is is_null or is_not_null, then allow null input
                        var bError = true;
                        return true;        // TODO
                    }
                },
                input: function (rule)
                {
                    // Give the widget a unique name as the user may create multiple versions of the same field!
                    var sFieldWidgetID = "task-" + sFieldID + '-' + TriSysSDK.Miscellaneous.RandomNumber(1000, 10000000);

                    // Set this as data in the rule so that we can get at the values
                    rule.data = ctrlSearchCriteria.FieldTypeFilter.ParseFilterRuleDataWrite(sFieldWidgetID);

                    // The composite task search criteria tag
                    var sInputHTML = '<div id="' + sFieldWidgetID + '" ></div>';
                    
                    // Need to populate this using our own timer to give control a chance to load
                    var iMilliSeconds = 50;
                    setTimeout(function ()
                    {
                        var ruleData = rule.data;

                        // This is an asynchronously loaded control hence we need yet another callback
                        // to populate the value after load
                        var fnAfterLoad = function ()
                        {
                            // If we have a default value, set this now
                            if (ruleData.TaskSearchCriteria)
                                ctrlSearchCriteria.TaskSearchCriteria.SetValue(ruleData.FieldWidgetID, ruleData.TaskSearchCriteria);
                        };

                        // Create the field widget 
                        ctrlSearchCriteria.TaskSearchCriteria.Load(ruleData.FieldWidgetID, fnAfterLoad);

                    }, iMilliSeconds);

                    return sInputHTML;
                },
                valueParser: function (rule, value)
                {
                    var ruleData = rule.data;

                    return ctrlSearchCriteria.TaskSearchCriteria.GetValue(ruleData.FieldWidgetID);
                },
                valueSetter: function (rule, value)
                {
                    if (rule.operator.nb_inputs !== 0)
                    {
                        try
                        {
                            var ruleData = rule.data;

                            //                     Task Type       Start Date    End Date      User ID's   Skill ID's      Schedule
                            // Value is a string: "Telephone Call, '2015-06-01', '2015-07-31', [290, 320], [12345, 56789], 1"
                            var sTaskSearchCriteria = value;

                            // Set the value into the rule data so that it will be populated when drawn in timer above
                            rule.data = ctrlSearchCriteria.FieldTypeFilter.ParseFilterRuleDataWrite(ruleData.FieldWidgetID, null, null, null, null, sTaskSearchCriteria);

                        } catch (e)
                        {

                        }
                    }
                }
            };

            return fieldFilter;
        },

        YesNoTextField: function (sFieldID, sDisplayName, sCategory)
        {
            var fieldDescription = { TableFieldName: sFieldID };

            var fnCreateAndPopulateWidget = function (sFieldWidgetID, sTableFieldName, sLookups)
            {
                // Create the field widget
                var sourceValues = [{ value: 1, text: 'Yes' }, { value: 0, text: 'No' }];

                // Set this now
                TriSysSDK.CShowForm.populateMultiSelectComboFromDataSource(sFieldWidgetID, sourceValues);

                // Set the current values into the widget
                TriSysSDK.CShowForm.SetSkillsInList(sFieldWidgetID, sLookups);
            };

            var fnParseValues = function (sFieldWidgetID, sTableFieldName)
            {
                // Get the list of comma separated strings
                var valuesArray = TriSysSDK.CShowForm.GetSelectedSkillsFromListAsArray(sFieldWidgetID);

                if (valuesArray)
                {
                    var idValues = [];
                    for (var i = 0; i < valuesArray.length; i++)
                    {
                        var sYesOrNo = valuesArray[i];

                        // Add to the list
                        idValues.push(sYesOrNo == 'Yes' ? 1 : 0);
                    }

                    return idValues;
                }
            };

            var fnConvertIDsToLookupStrings = function (lstLookupIDs)
            {
                if (!lstLookupIDs)
                    return;

                var sYesAndNos = '';

                for (var i = 0; i < lstLookupIDs.length; i++)
                {
                    var iYesOrNo = lstLookupIDs[i];

                    // Append to comma separated list
                    if (sYesAndNos.length > 0)
                        sYesAndNos += ', ';

                    sYesAndNos += (iYesOrNo == 1 ? 'Yes' : 'No');
                }

                return sYesAndNos;
            };


            // This is a multi-select lookup field
            var fieldFilter = ctrlSearchCriteria.FieldTypeFilter.MultiSelectLookupField(fieldDescription, sFieldID, sDisplayName, sCategory, sCategory,
                    fnCreateAndPopulateWidget, fnParseValues, fnConvertIDsToLookupStrings);

            return fieldFilter;
        },

        ConvertSkillsInCategoryIntoSkillIdArray: function(sSkillCategory, sSkillList)
        {
            var skillIdArray = [];

            if (!sSkillList)
                return skillIdArray;

            var arraySkills = sSkillList.split(",");
            var trimmedSkills = [];
            $.each(arraySkills, function (index, sSkill)
            {
                sSkill = sSkill.trim();
                trimmedSkills.push(sSkill);
            });

            for (var i = 0; i < trimmedSkills.length; i++)
            {
                var sSkill = trimmedSkills[i];

                var skill = ctrlSearchCriteria.FieldTypeFilter.GetSkillFromCacheBySkill(sSkillCategory, sSkill);
                if(skill)
                    skillIdArray.push(skill.SkillId);
            }

            return skillIdArray;
        },

        GetSkillFromCacheBySkill: function(sSkillCategory, sSkill)
        {
            var skills = TriSysApex.Cache.Skills();
            for (var s = 0; s < skills.length; s++)
            {
                var skill = skills[s];

                if (skill.Category.trim() == sSkillCategory.trim() && skill.Skill == sSkill)
                    return skill;
            }
        },

        GetSkillFromCacheBySkillId: function(iSkillId)
        {
            var skills = TriSysApex.Cache.Skills();
            for (var s = 0; s < skills.length; s++)
            {
                var skill = skills[s];

                if (skill.SkillId == iSkillId)
                    return skill;
            }
        },


        // We pass the data around with each filter to allow us to contextualise and
        // use the same field multiple times in the search.
        // We need many pieces of information, which we parse here.
        ParseFilterRuleDataWrite: function (sFieldWidgetID, sSkillList, dtDateValue, capValue, sPostCodeRadial, sTaskSearchCriteria, sQualifications)
        {
            var dataObject = {
                FieldWidgetID: sFieldWidgetID,
                Skills: sSkillList,
                DateValue: dtDateValue,
                CurrencyAmountPeriod: capValue,
                PostCodeRadial: sPostCodeRadial,
                TaskSearchCriteria: sTaskSearchCriteria,
				QualificationSearchCriteria: sQualifications		// A JSON string to be parsed into an object
            };

            return dataObject;
        },

        // We want our own drawn widgets to fit the width
        ResizeToFitWidth: function(rule)
        {
            // Make our widgets wider to fit available space.
            // Sometimes the field is drawn beneath the operator - we do not like that!
            var fnSizeQueryRowContainerToWidth = function (myRule, bResize, mainWinObject)
            {
                try
                {
                    var ruleValueContainer = myRule.$el.find('.rule-value-container');
                    var increment = 50;
                    var iTopOfRow = myRule.$el.find('.rule-operator-container').position().top;
                    var iTop = ruleValueContainer.position().top;
                    var iWidth = ruleValueContainer.width();

                    if (iWidth <= 0)
                    {
                        // We are not shown yet!
                        return;
                    }

                    //if (bResize)
                    //{
                    //    var width = $('#divFormContentRow').width();
                    //    if (mainWinObject.width() == width)
                    //        return;
                    //}

                    for (var i = 1; i <= 40; i++)
                    {
                        var bBreak = false;
                        var iNewTop = ruleValueContainer.position().top;
                        if (iNewTop <= iTopOfRow)
                            iWidth += increment;
                        else if (iNewTop > iTopOfRow)
                        {
                            iWidth -= (increment*1.6);
                            bBreak = true;
                        }

                        var sWidth = '' + iWidth + 'px';
                        ruleValueContainer.width(sWidth);
                        ruleValueContainer.css('min-width', sWidth, 'max-width', sWidth);

                        if (bBreak)
                            break;
                    }
                }
                catch (e)
                {
                    var sErr = e;
                }                
            };

            // Do it now
            fnSizeQueryRowContainerToWidth(rule, false);


            // THIS IS TOO SLOW - TURN OFF
            //return;

            // Setup a resize event handler to catch main app resize and call above function
            $('#divFormContentRow').resize(function ()
            {
                fnSizeQueryRowContainerToWidth(rule, true, $(this));
            });
        },

        QuoteChar: '<!q!>'

    },  // ctrlSearchCriteria.FieldTypeFilter

    // Keep overriding the base style to keep in tune with app theme
    ResetColours: function ()
    {
        setTimeout(function ()
        {
            // Too much colour/shading?
            //$('.query-builder .rules-group-container').css("background-color", TriSysProUI.ThemedSidebarBackgroundLight(0.65));
            $('.query-builder .rules-group-container').css("border-color", TriSysProUI.ThemedAlternativeBackColor());

        }, 250);
    },

    // Callback to start the search by passing our partial SQL statement to the caller for execution
    DoSearch: function (sEntityName, lRecordId, sSearchCriteriaTree, fnSearchCallback, bPreventSaveCriteria, sIDSuffix)
    {
        // 28 Jun 2024: New AI search
        var sJSON = null;
        if (ctrlSearchCriteria._EnabledSearch.AI)
        {
            // This is WRONG! We still need to use the fnSearchCallback function
            //ctrlSearchCriteria.DoAISearch(sEntityName, lRecordId, fnSearchCallback, bPreventSaveCriteria, sIDSuffix)
            //return;

            // Set dynamic columns
            ctrlSearchCriteria.DynamicColumns.Columns = [];

            var column1 = { field: "Rank", title: "Rank", type: "number" };
            ctrlSearchCriteria.DynamicColumns.Columns.push(column1);
            var column2 = { field: "Summary", title: "Summary", type: "string" };
            ctrlSearchCriteria.DynamicColumns.Columns.push(column2);

            // Set the JSON for the additional functionality
            var sQuestion = $('#ctrlAISearch-Question-' + sIDSuffix).val();
            if (!sQuestion)
            {
                TriSysApex.UI.ShowMessage("Please enter a question to search for suitable " + sEntityName + " records.");
                return;
            }

            // 30 Jun 2024
            var CEntitySearchRequest = {
                EntityName: sEntityName,
                RecordId: lRecordId,
                AICriteria: {
                    Question: sQuestion
                }
            };
            sJSON = JSON.stringify(CEntitySearchRequest);
        }
        else
        {
            // Any errors in parsing boolean query?
            var bValidated = $('#' + sSearchCriteriaTree).queryBuilder('validate', { skip_empty: false });
            if (!bValidated)
            {
                TriSysApex.UI.ShowMessage("Please supply search criteria, or correct any errors.");
                return;
            }

            sJSON = ctrlSearchCriteria.GetJSONSearchRules(sEntityName, sSearchCriteriaTree, lRecordId);
        }

        if (fnSearchCallback)
		{
			if (!bPreventSaveCriteria)
			{
				var fnSaveChanges = function ()
				{
					// Write any changes back to the server
					ctrlSearchCriteria.Persistence.Put(sSearchCriteriaTree, sEntityName, lRecordId, sJSON);
					// See also: ctrlSearchCriteria.Persistence.Get
				};

				setTimeout(fnSaveChanges, 100);
			}			
		
			// Callback the search mechanism to start the search process
			// Aug 2020: Note the dynamic columns for all search fields
			fnSearchCallback(sEntityName, lRecordId, sJSON, ctrlSearchCriteria.DynamicColumns.Columns);
		}		
	},

	// Called by marketing campaign to conduct server side search using same criteria
	GetJSONSearchRules: function (sEntityName, sSearchCriteriaTree, lRecordId)		// ctrlSearchCriteria.GetJSONSearchRules
	{
		var jsonRules = $('#' + sSearchCriteriaTree).queryBuilder('getRules');

		var jsonObject = {
			EntityName: sEntityName,
			RecordId: lRecordId,
			Tree: jsonRules
		};

		ctrlSearchCriteria.DynamicColumns.PrepareColumns(sEntityName, jsonRules);

		var sJSON = JSON.stringify(jsonObject);

		return sJSON;
	},
		
    // Callback to reset the search criteria
    ResetSearch: function (sEntityName, lRecordId, sSearchCriteriaTree, fnSearchCallback, bNoPrompt)
    {
        var fnYes = function (bProgrammatic)
        {
            ctrlSearchCriteria.ResetSearchTree(sSearchCriteriaTree);

            // Calling grid/form may wish to remove its filters also
            if (fnSearchCallback)
            {
				setTimeout(function() { fnSearchCallback(sEntityName, lRecordId, null); }, 1);

				if (!bProgrammatic)
					ctrlSearchCriteria.Persistence.Put(sSearchCriteriaTree, sEntityName, lRecordId, null);
            }

            return true;
        };

        // Do not prompt on programmatic invocation - only from a button click
        if (bNoPrompt)
            fnYes(true);
        else
		{
			var sMessage = "Are you sure you wish to remove all search criteria?" +
							"<br/>" + "This will display every " + sEntityName + " in your database" +
							" which may take some time.";
            TriSysApex.UI.questionYesNo(sMessage, "Clear Search", "Yes", fnYes, "No");
		}
    },

	ResetSearchTree: function(sSearchCriteriaTree)
	{
	    try {
	        $('#' + sSearchCriteriaTree).queryBuilder('reset');

	    } catch (e) {
            // Has been known to fail and be recorded in ApexError table
	    }
	},

    
    // Development: Use cookies to store each search
    // Production: User Web API to store each search per entity/record
    //
    Persistence:        // ctrlSearchCriteria.Persistence
    {
        // PUBLIC INTERFACE
        // ----------------
        // We did it this way so that we could separate concerns and focus on building the search
        // first without worrying about persistence. Then when we could persist, we did, quickly
        // and cheaply as a cookie. Then, when we were confident it was ready for prime time,
        // we moved it into a web service.
        // This is simply the best way to develop full-stack software services.

        Get: function (sControlID, sEntityName, lRecordId, fnSearchCallback, fnResetSearch)
        {
            // Web API Method
            ctrlSearchCriteria.Persistence.GetFromWebService(sControlID, sEntityName, lRecordId, fnSearchCallback, fnResetSearch);

            // Cookie method
            //ctrlSearchCriteria.Persistence.GetCookie(sControlID, sEntityName, lRecordId, fnSearchCallback);
        },

        Put: function (sControlID, sEntityName, lRecordId, sSQL)
        {
            // Web API Method
            ctrlSearchCriteria.Persistence.PutToWebService(sControlID, sEntityName, lRecordId, sSQL);

            // Cookie method
            //ctrlSearchCriteria.Persistence.PutCookie(sControlID, lRecordId, sSQL);
        },


        // WEB API
        // -------
        GetFromWebService: function (sControlID, sEntityName, lRecordId, fnSearchCallback, fnResetSearch)
        {
            // We need the user ID
            var userCredentials = TriSysApex.LoginCredentials.UserCredentials();
            if (!userCredentials)
                return;

            // Some controls are 'special'
            var bCloneMatchingControlOfOtherUser = false;
            if (sControlID.indexOf(ctrlSearchCriteria.Constants.EntitySearchPrefix) == 0)
                bCloneMatchingControlOfOtherUser = true;

            // A version always for the logged in user
            var lUserId = userCredentials.LoggedInUser.UserId;

            // The API object
            var CSearchTreeReadRequest = {
                UserId: lUserId,
                ControlId: sControlID,
                EntityName: sEntityName,
                RecordId: lRecordId,
                CloneMatchingControl: bCloneMatchingControlOfOtherUser
            };

            var payloadObject = {};

            payloadObject.URL = "SearchTree/Read";

            payloadObject.OutboundDataPacket = CSearchTreeReadRequest;

            payloadObject.InboundDataFunction = function (CSearchTreeReadResponse)
            {
                if (CSearchTreeReadResponse)
                {
                    if (CSearchTreeReadResponse.Success && CSearchTreeReadResponse.Criteria)
                    {
                        try
                        {
                            var sJsonCriteria = CSearchTreeReadResponse.Criteria.JsonCriteria;

                            // Populate tree with only its format and run the search
							ctrlSearchCriteria.WriteToTreeAndInvokeSearch(sEntityName, lRecordId, sControlID, sJsonCriteria, fnSearchCallback);

                            return;

                        } catch (e)
                        {
                            // What?
                            var sError = e;

                            // If an error, should we really wipe out the search?
                        }
                    }

                    // If we did not get any search, then do an explicit clear to get all!
                    // Dec 2018: NO! Only do this if we have reason to, muppet!
                    // Oct 2020: ignore status and reset anyway
                    //if (CSearchTreeReadResponse.Success && fnResetSearch)
                    if (fnResetSearch)
                        fnResetSearch();
                }
            };

            payloadObject.ErrorHandlerFunction = function (request, status, error)
            {
                TriSysApex.UI.errorAlert('ctrlSearchCriteria.Persistence.GetFromWebService: ' + status + ": " + error + ". responseText: " + request.responseText);
            };

            TriSysAPI.Data.PostToWebAPI(payloadObject);
        },

        PutToWebService: function (sControlID, sEntityName, lRecordId, sJSON)
        {
            var userCredentials = TriSysApex.LoginCredentials.UserCredentials();
            var lUserId = userCredentials.LoggedInUser.UserId;

            var CSearchTreeWriteRequest = {

                Criteria: {
                    UserId: lUserId,
                    ControlId: sControlID,
                    EntityName: sEntityName,
                    RecordId: lRecordId,
					JsonCriteria: sJSON
                }
            };

            var payloadObject = {};

            payloadObject.URL = "SearchTree/Write";

            payloadObject.OutboundDataPacket = CSearchTreeWriteRequest;

            payloadObject.InboundDataFunction = function (data)
            {
                var CSearchTreeWriteResponse = data;

                if (CSearchTreeWriteResponse)
                {
                    if (CSearchTreeWriteResponse.Success)
                    {
                        // Everything OK!
                    }
                }
            };

            payloadObject.ErrorHandlerFunction = function (request, status, error)
            {
                TriSysApex.UI.errorAlert('ctrlSearchCriteria.Persistence.PutToWebService: ' + status + ": " + error + ". responseText: " + request.responseText);
            };

            TriSysAPI.Data.PostToWebAPI(payloadObject);
        },


        // COOKIES
        // -------
		//#region Dead Cookie Code

        CookiePrefix: 'ctrlSearchCriteria-',

        // Cookie method
        GetCookie: function (sControlID, sEntityName, lRecordId, fnSearchCallback)
        {
            var sKey = ctrlSearchCriteria.Persistence.CookiePrefix + sControlID + '-' + lRecordId;

            // If we persisted this, re-apply it and do immediate search
            var sSQL = TriSysAPI.Cookies.getCookie(sKey);
            if (sSQL)
            {
                try
                {
                    // Populate tree with only its format
                    $('#' + sControlID).queryBuilder('setRulesFromSQL', sSQL);

                } catch (e)
                {
                    // What?
                    var sError = e;
                }


                // Now do search which will build the full query
                ctrlSearchCriteria.DoSearch(sEntityName, lRecordId, sControlID, fnSearchCallback);
            }
        },

        PutCookie: function (sControlID, lRecordId, sSQL)
        {
            var sKey = ctrlSearchCriteria.Persistence.CookiePrefix + sControlID + '-' + lRecordId;

            // Persist this against the form to easily allow the user to pick up where they left off on next visit
            TriSysAPI.Cookies.setCookie(sKey, sSQL);
		}

		//#endregion Dead Cookie Code
    },

    // Allow searching for entities which are linked to tasks
    TaskSearchCriteria:     // ctrlSearchCriteria.TaskSearchCriteria
    {
        Load: function (sFieldWidgetID, fnCallback)
        {
            var sPath = TriSysApex.Constants.UserControlFolder + 'ctrlTaskSearchCriteria.html';

            TriSysApex.FormsManager.loadPageIntoDiv(sFieldWidgetID, sPath,
                function (response, status, xhr)
                {
                    ctrlSearchCriteria.TaskSearchCriteria.AfterLoadEvent(sFieldWidgetID);
                    if (fnCallback)
                        fnCallback();
                });
        },

        // After the control has loaded, we need to change the ID's of all DIV's
        // which are in sub nodes only, to be prefixed by the field name.
        AfterLoadEvent: function (divTag)
        {
            var sPrefix = divTag + '-';

            // Get all nodes recursively beneath this DIV and change their ID to be unique by prefixing with this DIV name
            TriSysSDK.Controls.General.ReplaceDivTagsOfDynamicallyLoadedUserControl(divTag);

            // Populate the widgets
            var sTaskTypeID = sPrefix + "ctrlTaskSearchCriteria-TaskType";
            TriSysSDK.CShowForm.TaskTypeCombo(sTaskTypeID);

            var sStartDateID = sPrefix + "ctrlTaskSearchCriteria-StartDate";
            TriSysSDK.CShowForm.datePicker(sStartDateID);

            var sEndDateID = sPrefix + "ctrlTaskSearchCriteria-EndDate";
            TriSysSDK.CShowForm.datePicker(sEndDateID);
        },

        //                     Task Type       Start Date    End Date      User ID's   Skill ID's    Scheduled
        // Value is a string: "Telephone Call, '2015-06-01', '2015-07-31', [290;320], [12345;56789], 1"

        SetValue: function (sFieldWidgetID, arrTaskSearchCriteria)
        {
            if (arrTaskSearchCriteria)
            {
                var sTaskSearchCriteria = arrTaskSearchCriteria[0];

                var criteria = ctrlSearchCriteria.TaskSearchCriteria.ParseValueString(sTaskSearchCriteria);
                if(criteria)
                {
                    var sPrefix = sFieldWidgetID + '-';
                    TriSysSDK.CShowForm.SetTaskTypeComboValue(sPrefix + 'ctrlTaskSearchCriteria-TaskType', criteria.TaskType);
                    TriSysSDK.CShowForm.setDatePickerValue(sPrefix + 'ctrlTaskSearchCriteria-StartDate', criteria.StartDate);
                    TriSysSDK.CShowForm.setDatePickerValue(sPrefix + 'ctrlTaskSearchCriteria-EndDate', criteria.EndDate);
                }
            }
        },

        GetValue: function(sFieldWidgetID)
        {
            var sPrefix = sFieldWidgetID + '-';
            var sTaskType = TriSysSDK.CShowForm.GetTaskTypeFromCombo(sPrefix + 'ctrlTaskSearchCriteria-TaskType');
            var dtStartDate = TriSysSDK.CShowForm.getDatePickerValue(sPrefix + 'ctrlTaskSearchCriteria-StartDate');
            var dtEndDate = TriSysSDK.CShowForm.getDatePickerValue(sPrefix + 'ctrlTaskSearchCriteria-EndDate');

            var sValue = sTaskType + "," + dtStartDate + "," + dtEndDate;
            return sValue;
        },

        ParseValueString: function (sTaskSearchCriteria)
        {
            if (!sTaskSearchCriteria)
                return null;

            var parts = sTaskSearchCriteria.split(",");
            if (parts)
            {
                var criteria = {
                    TaskType: parts[0],
                    StartDate: parts[1],
                    EndDate: parts[2]
                };

                return criteria;
            }
        }
    },

    // Allow searching for entities which are linked to qualifications (CoSector in 2018)
    QualificationSearchCriteria:     // ctrlSearchCriteria.QualificationSearchCriteria
    {
        Load: function (sFieldWidgetID, fnCallback)
        {
            var sPath = TriSysApex.Constants.UserControlFolder + 'ctrlQualificationSearchCriteria.html';

            TriSysApex.FormsManager.loadPageIntoDiv(sFieldWidgetID, sPath,
                function (response, status, xhr)
                {
                    ctrlSearchCriteria.QualificationSearchCriteria.AfterLoadEvent(sFieldWidgetID);
                    if (fnCallback)
                        fnCallback();
                });
        },

        // After the control has loaded, we need to change the ID's of all DIV's
        // which are in sub nodes only, to be prefixed by the field name.
        AfterLoadEvent: function (divTag)
        {
            var sPrefix = divTag + '-';

            // Get all nodes recursively beneath this DIV and change their ID to be unique by prefixing with this DIV name
            TriSysSDK.Controls.General.ReplaceDivTagsOfDynamicallyLoadedUserControl(divTag);

            // Populate the widgets

			var skillComboOptions = {
				FirstItem: { Value: 0, Text: 'Any'}
			};

            var sInstitutionID = sPrefix + "ctrlQualificationSearchCriteria-Institution";
			TriSysSDK.CShowForm.skillCombo(sInstitutionID, 'QualificationInstitution', null, null, skillComboOptions);

            var sTypeID = sPrefix + "ctrlQualificationSearchCriteria-Type";
			TriSysSDK.CShowForm.skillCombo(sTypeID, 'QualificationType', null, null, skillComboOptions);

            var sSubjectID = sPrefix + "ctrlQualificationSearchCriteria-Subject";
			TriSysSDK.CShowForm.skillCombo(sSubjectID, 'QualificationSubject', null, null, skillComboOptions);

            var sResultID = sPrefix + "ctrlQualificationSearchCriteria-Result";
			TriSysSDK.CShowForm.skillCombo(sResultID, 'QualificationResult', null, null, skillComboOptions);

			// Spin up some years from the earliest someone could have graduated
			var source = [{value: 0, text: 'Any'}];
			var dt = new Date();
			var iStartYear = dt.getFullYear() - 75;
			for(var i = dt.getFullYear(); i >= iStartYear; i--)
			{
				var item = {
					value: i,
					text: i
				};
				source.push(item);
            }

            var sYearID = sPrefix + "ctrlQualificationSearchCriteria-Year";
            TriSysSDK.CShowForm.populateComboFromDataSource(sYearID, source, 0);
        },

        // Institute       Level    Subject     Result   Year
        // Value is a string: "Anglia Ruskin, 'Bsc',    'Maths',	'2.1',	 1985"
		// No Garry, don't be a knob! Use JSON you fool!

        SetValue: function (sFieldWidgetID, sQualificationSearchCriteria)
        {
            if (sQualificationSearchCriteria)
            {
                var criteria = ctrlSearchCriteria.QualificationSearchCriteria.ParseValueString(sQualificationSearchCriteria);
                if(criteria)
                {
                    var sPrefix = sFieldWidgetID + '-';
                    TriSysSDK.CShowForm.SetValueInCombo(sPrefix + 'ctrlQualificationSearchCriteria-Institution', criteria.Institution);
                    TriSysSDK.CShowForm.SetValueInCombo(sPrefix + 'ctrlQualificationSearchCriteria-Type', criteria.Type);
                    TriSysSDK.CShowForm.SetValueInCombo(sPrefix + 'ctrlQualificationSearchCriteria-Subject', criteria.Subject);
                    TriSysSDK.CShowForm.SetValueInCombo(sPrefix + 'ctrlQualificationSearchCriteria-Result', criteria.Result);
                    TriSysSDK.CShowForm.SetValueInCombo(sPrefix + 'ctrlQualificationSearchCriteria-Year', criteria.Year);
                }
            }
        },

        GetValue: function(sFieldWidgetID)
        {
            var sPrefix = sFieldWidgetID + '-';
            var iInstitution = TriSysSDK.CShowForm.GetValueFromCombo(sPrefix + 'ctrlQualificationSearchCriteria-Institution');
            var iType = TriSysSDK.CShowForm.GetValueFromCombo(sPrefix + 'ctrlQualificationSearchCriteria-Type');
            var iSubject = TriSysSDK.CShowForm.GetValueFromCombo(sPrefix + 'ctrlQualificationSearchCriteria-Subject');
            var iResult = TriSysSDK.CShowForm.GetValueFromCombo(sPrefix + 'ctrlQualificationSearchCriteria-Result');
            var iYear = TriSysSDK.CShowForm.GetValueFromCombo(sPrefix + 'ctrlQualificationSearchCriteria-Year');

			var objValue = {
				Institution: iInstitution,
				Type: iType,
				Subject: iSubject,
				Result: iResult,
				Year: iYear	
			};
            var sValue = JSON.stringify(objValue);
            return sValue;
        },

        ParseValueString: function (sQualificationSearchCriteria)
        {
            if (!sQualificationSearchCriteria)
                return null;
            var criteria = JSON.parse(sQualificationSearchCriteria);
            return criteria;
        }
    },

    JobTitleLookup: function(sJobTitleField)
    {
        var sJobTitle = TriSysSDK.CShowForm.GetJobTitleFromField(sJobTitleField);

        var fnChange = function (sField, sValue)
        {
            $('#' + sField).trigger("change");
        };

        TriSysSDK.JobTitle.Lookup(sJobTitle, sJobTitleField, fnChange);
    },

    // e.g. sControlID = 'search-criteria-tree-ctrlEntitySearch-lookup-criteria-Contact-id-270'
	WriteToTreeAndInvokeSearch: function (sEntityName, lRecordId, sControlID, sSQLorJson, fnSearchCallback, bPreventSaveCriteria)
    {
        // Populate tree with only its format - what does this low level call fire in your code Garry?
        // Because unless you say, it is a real fucker to debug!
        // I think it fires into functions such as MultiSelectLookupField() to validate fields

		// Feb 2018: Detect whether the sSQLorJson is legacy SQL or stringified JSON
		var bJson = true;
		if (sSQLorJson)
		{
			// Prove we do not have a JSON object
			if (sSQLorJson.indexOf("EntityName") < 0 && sSQLorJson.indexOf("Tree") < 0)
				bJson = false;
		}

		if (bJson)
        {
            // 01 Jul 2024: AI Search?
            var CEntitySearchRequest = JSON.parse(sSQLorJson);
            if (CEntitySearchRequest)
            {
                if (CEntitySearchRequest.AICriteria && CEntitySearchRequest.AICriteria.Question)
                {
                    // AI Search Criteria
                    const fnTriggerSearch = function ()
                    {
                        // e.g. ctrlAISearch-Question--ctrlEntitySearch-lookup-criteria-Contact-id-270
                        var sSuffix = sControlID.replace('search-criteria-tree', '');
                        const sID = 'ctrlAISearch-Question-' + sSuffix;
                        $('#' + sID).val(CEntitySearchRequest.AICriteria.Question);
                        ctrlSearchCriteria._EnabledSearch.AI = true;
                        // e.g. ctrlSearchCriteria-tab-ai-ctrlEntitySearch-lookup-criteria-Contact-id-270
                        TriSysSDK.Controls.Button.Click('ctrlSearchCriteria-form-tab-ai' + sSuffix);

                        // Kick off the AI search now
                        ctrlSearchCriteria.DoSearch(sEntityName, lRecordId, sControlID, fnSearchCallback, bPreventSaveCriteria, sSuffix);
                    };

                    setTimeout(fnTriggerSearch, 10);
                    return;
                }
            }

            // Original search criteria tree
			if(!TriSysApex.Constants.AllowEmptySearchCriteria && !ctrlSearchCriteria.isValidJsonRules(sSQLorJson))
			{
				// June 2019: Prevent search if no criteria supplied
				//ctrlSearchCriteria.ResetSearchTree(sControlID);
				var sMessage = "Please supply " + sEntityName + " search criteria.";
				TriSysApex.UI.ShowMessage(sMessage);
				return;
			}

			var jsonObject = JSON.parse(sSQLorJson);
			$('#' + sControlID).queryBuilder('setRules', jsonObject.Tree);
		}
		else
			$('#' + sControlID).queryBuilder('setRulesFromSQL', sSQLorJson);


        // Now do search which will build the full query
		if (TriSysAPI.Operators.isEmpty(bPreventSaveCriteria))
			bPreventSaveCriteria = true;

		ctrlSearchCriteria.DoSearch(sEntityName, lRecordId, sControlID, fnSearchCallback, bPreventSaveCriteria);
    },

	isValidJsonRules: function(sJsonRules)
	{
		if(sJsonRules)
		{
			try 
			{
				var jsonObject = JSON.parse(sJsonRules);
				if(jsonObject.Tree.rules.length > 0)
					return true;
			}
			catch(ex)
			{ 
				// 3rd party format error
			}
		}

		return false;
	},

    // August 2020: Support for synamic columns
	DynamicColumns:         // ctrlSearchCriteria.DynamicColumns
    {
        Fields: null,       // See ctrlSearchCriteria.Populate

        // Called after reading all tree rules
        PrepareColumns: function (sEntityName, jsonRules)
        {
            ctrlSearchCriteria.DynamicColumns.Columns = [];     // Reset
            if (!jsonRules)
                return;
            if (!jsonRules.rules)
                return;

            var fnAddRuleToColumns = function (rule)
            {
                if (rule.id)
                {
                    var bFound = ctrlSearchCriteria.DynamicColumns.Columns.find(function(column)
                    {
                        return (column.field == rule.field);
                    });

                    if (!bFound)
                    {
                        // Add rule to columns
                        var matchingField = ctrlSearchCriteria.DynamicColumns.Fields.find(function (field)
                        {
                            if (field.id == rule.field)
                                return field;
                        });
                        var sTitle = matchingField ? matchingField.label : rule.field;
                        var sType = matchingField ? matchingField.type : "string";
                        sType = (sType == "date" ? sType : "string");                       // Kludge - only dates can be non-string
                        var column = { field: rule.field, title: sTitle, type: sType };
                        ctrlSearchCriteria.DynamicColumns.Columns.push(column);
                    }
                }

                // Recursive rule call
                if(rule.rules)
                {
                    rule.rules.forEach(function (rule2) {
                        fnAddRuleToColumns(rule2);
                    });
                }
            };

            jsonRules.rules.forEach(function (rule)
            {
                fnAddRuleToColumns(rule);
            });

        },

        Columns: []         // The grid columns which will be displayed
    },

    // 15 Feb 2022: Added custom code-only control over which fields are available
	CustomerSpecificFieldDescriptionModifications: function (sEntityName, fieldDescriptions)
	{
	    if (typeof (ApexCustomerModule) != TriSysApex.Constants.Undefined &&
            typeof (ApexCustomerModule.SearchCriteriaRules) != TriSysApex.Constants.Undefined &&
            typeof (ApexCustomerModule.SearchCriteriaRules.FieldDescriptionModifications) != TriSysApex.Constants.Undefined)
	    {
	        try {
	            ApexCustomerModule.SearchCriteriaRules.FieldDescriptionModifications(sEntityName, fieldDescriptions);

	        } catch (e) {

	        }
	    }
    },

    // 28 Jun 2024: New Boolean and AI Tabs
    _EnabledSearch: {       // ctrlSearchCriteria._EnabledSearch
        Boolean: false,
        AI: false,
        Clear: function ()
        {
            ctrlSearchCriteria._EnabledSearch.Boolean = false;
            ctrlSearchCriteria._EnabledSearch.AI = false;
        }
    },

    TabClickEvent: function (sTabID, sSuffix)
    {
        ctrlSearchCriteria._EnabledSearch.Clear();

        // Dynamically load grids and re-run searches as desired
        const sPrefix = 'ctrlSearchCriteria-tab-panel-';
        var bBooleanSearch = (sTabID.indexOf(sPrefix + 'boolean') == 0);
        if (bBooleanSearch)
        {
            // This is the boolean search criteria
            ctrlSearchCriteria._EnabledSearch.Boolean = true;
            return;
        }

        var bAISearch = (sTabID.indexOf(sPrefix + 'ai') == 0);
        if (bAISearch)
        {
            // This is the boolean search criteria
            ctrlSearchCriteria._EnabledSearch.AI = true;

            // Set cursor focus into text box
            $('#ctrlAISearch-Question-' + sSuffix).focus();

            return;
        }
    },

    // 28 Jun 2024: Load AI Search Criteria
    LoadAISearchCriteria: function (sEntityName, lRecordId, sDivID, sSuffix, sTabID)
    {
        TriSysApex.FormsManager.loadControlIntoDiv(sDivID, 'ctrlAISearch.html',
            function (response, status, xhr)
            {
                // Populate with previous search criteria

                // IMPORTANT: rename all HTML element ID's so that they are unique and can therefore be uniquely
                // referenced and programmed without conflict.
                TriSysSDK.Controls.General.RenameElementIdsWithParentIdPrefixOrSuffix(sDivID, sSuffix, false);

                // Display instructions
                const sInstructions = `Please enter or paste your question to the artificial intelligent agent, 
                    which will search your CV's and return a list of suitable candidates ranked in order.`;
                const sInstructionPrefix = 'ctrlAISearch-Instructions-';
                $('#' + sInstructionPrefix + 'tr-' + sSuffix).show();
                $('#' + sInstructionPrefix + sSuffix).html(sInstructions);

            //    document.getElementById('ctrlAISearch-Question' + sSuffix).addEventListener('keydown', function (event)
            //    {
            //        // Check if the Enter key is pressed
            //        if (event.key === 'Enter')
            //        {
            //            event.preventDefault(); // Prevent default action (like newline in textarea)
            //            // Perform desired action
            //            alert('Enter key pressed!');
            //            // You can replace the alert with any other action you want to perform
            //        }
            //    });
            }
        );

        // If no AI search projects configured for this entity, then hide the tab
        ctrlSearchCriteria.CheckWebAPIifAIProjectsExist(sEntityName,
            function (bSuccess, sStatus)
            {
                var elem = $('#' + sTabID + sSuffix);
                bSuccess ? elem.show() : elem.hide();
            }
        );
    },

    // If at least one project is configured for this entity, then show the tab
    CheckWebAPIifAIProjectsExist: function (sEntityName, fnCallback)
    {
        var CEntityStatusRequest = {

            EntityName: sEntityName
        };

        var payloadObject = {};

        payloadObject.URL = "ChatGPT/EntitySearchEnabledStatus";

        payloadObject.OutboundDataPacket = CEntityStatusRequest;

        payloadObject.InboundDataFunction = function (CEntityStatusResponse)
        {
            if (CEntityStatusResponse)
                fnCallback(CEntityStatusResponse.Success, CEntityStatusResponse.Status);
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.errorAlert('ctrlSearchCriteria.CheckWebAPIifAIProjectsExist: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    DoAISearch: function (sEntityName, lRecordId, fnSearchCallback, bPreventSaveCriteria, sIDSuffix)
    {
        var sQuestion = $('#ctrlAISearch-Question-' + sIDSuffix).val();
        if(!sQuestion)
		{
			TriSysApex.UI.ShowMessage("Please enter a question to search for suitable candidates.");
			return;
        }

        var CEntitySearchRequest = {

            EntityName: sEntityName,
            RecordId: lRecordId,
            Question: sQuestion
        };

        var payloadObject = {};

        payloadObject.URL = "ChatGPT/EntitySearch";

        payloadObject.OutboundDataPacket = CEntitySearchRequest;

        payloadObject.InboundDataFunction = function (CEntitySearchResponse)
        {
            if (CEntitySearchResponse)
            {
                if (CEntitySearchResponse.Success)
                {
                    // Display the results
                    // .DynamicColumns (list) + .List (DataTable)
                    var sJSON = "This must be set and also dynamic columns sorted too";

                    // Callback the search mechanism to start the search process
                    // Aug 2020: Note the dynamic columns for all search fields
                    //fnSearchCallback(sEntityName, lRecordId, sJSON, ctrlSearchCriteria.DynamicColumns.Columns);
                    fnSearchCallback(sEntityName, lRecordId, sJSON, CEntitySearchResponse.DynamicColumns);
                }
                else
                {
                    // Probably because no projects are found
                    TriSysApex.UI.ShowMessage(CEntitySearchResponse.ErrorMessage);
                }
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.errorAlert('ctrlSearchCriteria.DoAISearch: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    Constants:
    {
        EntitySearchPrefix: 'search-criteria-tree-ctrlEntitySearch-lookup-criteria-'
    }

};  // ctrlSearchCriteria

