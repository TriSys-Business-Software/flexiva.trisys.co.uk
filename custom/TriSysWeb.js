/* TriSys Web Javascript Code
 * The TriSys Web framework is the operational behaviour of the recruitment agency web browser application.
 * It takes care of layout, events, session state, login mechanism,
 * forms, paging, and all other application framework stuff.
 *
 * (c) 2013-2021 TriSys Business Software
 *
 */

// The TriSysWeb Namespace
var TriSysWeb =
{
    // Copyright Notice
    Copyright:      // TriSysWeb.Copyright
    {
        AllRightsReserved: "TriSys Business Software",
        LongProductDescription: "Applicant Tracking System for Recruitment Agencies",
        ShortProductName: "TriSysWeb",
        HomePage: "www.opuslaboris.com"
    },

    //#region TriSysWeb.Pages
    Pages:
    {        
        //#region TriSysWeb.Pages.Miscellaneous
        Miscellaneous:
        {
            // Make the page header the correct size for mobile devices
            InjectMobileFriendliness: function ()
            {
                var jumbotronArray = document.getElementsByClassName("jumbotron");
                for (var i = 0; i < jumbotronArray.length; i++)
                {
                    var item = jumbotronArray[i];
                    item.style.paddingTop = "1px";
                    item.style.paddingBottom = "1px";
                }

                $('#navbar-header').css("height", "48px");
                $('#header-SiteLogo').css("height", "48px");
                $('#pageForm-Title').css("font-size", "16px");
                $('#pageForm-Paragraph').css("font-size", "12px");
                $('#pageForm-Image').css("height", "48px");
            }
        },
        //#endregion TriSysWeb.Pages.Miscellaneous

        //#region TriSysWeb.Pages.Login
        Login:
        {
            PersistenceDiv: 'cmbLoginPersistence',
            PersistCredentialsOn: function ()
            {
                return TriSysSDK.Resources.Message("TriSysWeb.Pages.Login.PersistCredentialsOn");
            },
            PersistCredentialsOff: function ()
            {
                return TriSysSDK.Resources.Message("TriSysWeb.Pages.Login.PersistCredentialsOff");
            },

            // Typically, if the user is persisting login credentials, then both e-mail and password are restored to fields.
            // Setting this to false forces users to enter their password every time. See Law Absolute
            _RestorePasswordIfPersisted: true,          // TriSysWeb.Pages.Login._RestorePasswordIfPersisted

            Load: function ()
            {
                // This line must remain as it fixes up the cookies
                var bAutomaticLoginCredentialsComplete = TriSysWeb.Pages.Login.AutomaticLoginCredentialsComplete();

                var persistenceData = [
                    {
                        value: TriSysWeb.Pages.Login.PersistCredentialsOn(),
                        text: TriSysWeb.Pages.Login.PersistCredentialsOn()
                    },
                    {
                        value: TriSysWeb.Pages.Login.PersistCredentialsOff(),
                        text: TriSysWeb.Pages.Login.PersistCredentialsOff()
                    }
                ];

                $('#txtLoginEMail').focus();

                // Auto-login memory settings
                var sEMailAddress = '', sPassword = '';

                var credentialPacket = TriSysWeb.Security.ReadPersistedLoginCredentials();

                if (credentialPacket)
                {
                    sEMailAddress = credentialPacket.EMailAddress;
                    sPassword = credentialPacket.Password;

                    // Can you beleive this line causes Chrome to crash?
                    //$('#txtLoginEMail').val(sEMailAddress);
                    //document.getElementById('txtLoginEMail').value = sEMailAddress;
                    if (sEMailAddress)
                    {
                        setTimeout(function ()
                        {
                            $('#txtLoginEMail').val(sEMailAddress);

                        }, TriSysApex.Constants.iMillisecondsInSecond);
                    }

                    $('#txtLoginPassword').focus();

                    if (TriSysWeb.Pages.Login._RestorePasswordIfPersisted)
                    {
                        setTimeout(function () {
                            $('#txtLoginPassword').val(sPassword);

                        }, TriSysApex.Constants.iMillisecondsInSecond);
                    }

                    TriSysSDK.CShowForm.SetCheckBoxValue("login-remember-me", true);
                }

                var bInDev = TriSysApex.Environment.isDeployedInTestMode();
                if (sEMailAddress && sPassword && !bInDev && TriSysWeb.Pages.Login._RestorePasswordIfPersisted)
                {
                    // Commence auto-login sequence after a slight delay to allow framework to load on mobile devices
                    setTimeout(TriSysWeb.Security.LoginButtonClick, (TriSysApex.Constants.iMillisecondsInSecond * 2));
                    return;
                }

                // If we get this far i.e. no credentials and are on a phone, then hide splash screen
                TriSysPhoneGap.HideSplashScreen();
            },

            // Called before checking login credentials to fix up dual-mode settings
            AutomaticLoginCredentialsComplete: function ()
            {
                if (!TriSysApex.Constants.TriSysHostedCRM)
                {
                    // Feb 2017: WebJobs.json can reset the API Key
                    if (TriSysApex.Constants.DeveloperSiteKey.indexOf('apex.web.app') > 0)
                    {
                        // Override base library settings
                        TriSysAPI.Cookies.CookiePrefix = TriSysWeb.Constants.Cookie_Prefix;
                        TriSysApex.Constants.DeveloperSiteKey = TriSysWeb.Constants.DeveloperSiteKey;
                        TriSysAPI.Session.SetDeveloperSiteKey(TriSysWeb.Constants.DeveloperSiteKey);
                    }

                    TriSysApex.LoginCredentials.ValidationMessageTitle = TriSysWeb.Constants.ApplicationName + ' Login Credentials';
                    //TriSysApex.Constants.ProfileImageSize = 128;
                }

                var credentialPacket = TriSysWeb.Security.ReadPersistedLoginCredentials();
                if (credentialPacket)
                {
                    sEMailAddress = credentialPacket.EMailAddress;
                    sPassword = credentialPacket.Password;
                    var bComplete = (sEMailAddress && sPassword);
                    return bComplete;
                }

                return false;
            }
        },
        //#endregion TriSysWeb.Pages.Login

        //#region TriSysWeb.Pages.ForgottenPassword
        ForgottenPassword:
        {
            SendRequestToAPI: function (CAgencyForgottenPasswordRequest, sWaitMessage, fnSuccess, fnFailure)
            {
                var bAsynchronous = true;       // 26 Oct 2016
                var fnPostRequest = function ()
                {
                    TriSysApex.UI.HideWait();
                    fnSuccess();
                };

                TriSysApex.UI.CloseModalPopup();
                TriSysApex.UI.ShowWait(null, sWaitMessage);

                var payloadObject = {};
                payloadObject.URL = "Security/ForgottenAgencyClientOrCandidatePasswordRequest";
                payloadObject.OutboundDataPacket = CAgencyForgottenPasswordRequest;
                payloadObject.InboundDataFunction = function (data)
                {
                    var CAgencyForgottenPasswordResponse = data;
                    if (CAgencyForgottenPasswordResponse)
                    {
                        TriSysApex.UI.HideWait();

                        if (CAgencyForgottenPasswordResponse.Success)
                        {
                            if (!bAsynchronous)
                                fnPostRequest();
                        }
                        else
                            fnFailure();
                    }

                    return true;
                };
                payloadObject.ErrorHandlerFunction = function (request, status, error)
                {
                    TriSysApex.UI.ErrorHandlerRedirector('SendRequestToAPI: ', request, status, error);
                };
                TriSysAPI.Data.PostToWebAPI(payloadObject);

                if (bAsynchronous)
                    setTimeout(fnPostRequest, 250);
            }
        },
        //#endregion TriSysWeb.Pages.ForgottenPassword

        //#region TriSysWeb.Pages.Contacts
        Contacts:
        {
            PopulateGrid: function (sDiv, sGridName, sTitle, fnPopulationByFunction, columns, options)      // TriSysWeb.Pages.Contacts.PopulateGrid
            {
                if (TriSysAPI.Operators.isEmpty(columns))
                    columns = JSON.parse(JSON.stringify(TriSysWeb.Pages.Contacts.Columns));

                var bMultiRowSelect = !TriSysApex.Device.isPhone();
                var bColumnFilters = !TriSysApex.Device.isPhone();

                var dynamicColumns = null, selectedRowsCounterId = null;
                if (options) {
                    dynamicColumns = options.DynamicColumns;
                    selectedRowsCounterId = options.SelectedRowsCounterId
                }

                var sSearchCriteriaJson = null;
                if (options)
                    sSearchCriteriaJson = options.Json;

                // Populate the grid now
                TriSysSDK.Grid.VirtualMode({
                    Div: sDiv,
                    ID: sGridName,
                    Title: sTitle,
                    RecordsPerPage: TriSysApex.UserOptions.RecordsPerPage(),
                    PopulationByFunction: fnPopulationByFunction,
                    Columns: columns,
                    DynamicColumns: dynamicColumns,
                    MobileVisibleColumns: TriSysWeb.Pages.Contacts.MobileVisibleColumns,
                    MobileRowTemplate: TriSysWeb.Pages.Contacts.MobileRowTemplate,

                    KeyColumnName: "Contact_ContactId",
                    DrillDownFunction: function (rowData)
                    {
                        // Load contact Form with specified ID
						var lContactId = rowData.Contact_ContactId;
						if (options)
						{
							if (options.DrillDownFunction)
							{
								options.DrillDownFunction(lContactId);
								return;
							}
						}
                        TriSysApex.FormsManager.OpenForm("Contact", lContactId);
                    },
                    //RowHoverFunction: function(rowData)
                    //{
                    //    var lContactId = rowData.Contact_ContactId;
                    //    TriSysApex.EntityPreview.Contact.Open(lContactId);
                    //},
                    PreviewButtonFunction: function (rowData)
                    {
                        var lContactId = rowData.Contact_ContactId;
                        TriSysApex.EntityPreview.Contact.Open(lContactId, sSearchCriteriaJson);
                    },
                    PreviewButtonTooltip: 'Contact Preview',
                    LinkedInButtonColumn: { enabled: true, contactIdField: "Contact_ContactId"},
                    MultiRowSelect: bMultiRowSelect,
                    ColumnFilters: bColumnFilters,
                    Grouping: TriSysApex.UserOptions.GridGrouping(),
                    HyperlinkedColumns: ["Contact_Christian", "Contact_Surname", "Contact_FullName"],                // New Jan 2021
                    HyperlinkedEntities:                                        // New Feb 2021 to allow multiple separate entity hyperlinks
                    {
                        EntityName: "Contact",
                        Columns: [
                                    { field: "Contact_Company",     linkType: "Company" },
                                    { field: "Contact_AddedByName", linkType: "User Contact" },
                                    {
                                        field: "Contact_EMail",
                                        linkType: "Function",
                                        fnCallback: function (row) { TriSysSDK.Grid.HyperlinkedColumns.SpecialFields.DrillDown(row, "E-Mail", "Contact_EMail"); }
                                    },
                                    {
                                        field: "Contact_HomeEMail",
                                        linkType: "Function",
                                        fnCallback: function (row) { TriSysSDK.Grid.HyperlinkedColumns.SpecialFields.DrillDown(row, "E-Mail", "Contact_HomeEMail"); }
                                    },
                                    {
                                        field: "Contact_WorkTelNo",
                                        linkType: "Function",
                                        fnCallback: function (row) { TriSysSDK.Grid.HyperlinkedColumns.SpecialFields.DrillDown(row, "Phone", "Contact_WorkTelNo"); }
                                    },
                                    {
                                        field: "Contact_MobileTelNo",
                                        linkType: "Function",
                                        fnCallback: function (row) { TriSysSDK.Grid.HyperlinkedColumns.SpecialFields.DrillDown(row, "Phone", "Contact_MobileTelNo"); }
                                    },
                                    {
                                        field: "Contact_MobileTelNo",
                                        linkType: "Function",
                                        fnCallback: function (row) { TriSysSDK.Grid.HyperlinkedColumns.SpecialFields.DrillDown(row, "Phone", "Contact_MobileTelNo"); }
                                    },
                                    {
                                        field: "Contact_WorkMobile",
                                        linkType: "Function",
                                        fnCallback: function (row) { TriSysSDK.Grid.HyperlinkedColumns.SpecialFields.DrillDown(row, "Phone", "Contact_WorkMobile"); }
                                    },
                                    {
                                        field: "Contact_HomeAddressTelNo",
                                        linkType: "Function",
                                        fnCallback: function (row) { TriSysSDK.Grid.HyperlinkedColumns.SpecialFields.DrillDown(row, "Phone", "Contact_HomeAddressTelNo"); }
                                    }
                        ]
                    },
                    SelectedRowsCounterId: selectedRowsCounterId
                });
            },

            // FJ code with widths Jan 2021         // TriSysWeb.Pages.Contacts.Columns
            Columns: [
                        { field: "Contact_ContactId", title: "ID", type: "number", width: 150, hidden: true },
                        { field: "Contact_Christian", title: "Forename(s)", type: "string", width: 150, sticky: true, lockable: true },
                        { field: "Contact_Surname", title: "Surname", type: "string", width: 150, sticky: true, lockable: true },
                        { field: "Contact_FullName", title: "Full Name", type: "string", width: 250, sticky: true, lockable: true, hidden: true },
                        { field: "Contact_Company", title: "Company", type: "string", width: 200},
                        { field: "Contact_EMail", title: "Work E-Mail", type: "string", width: 200 },
                        { field: "Contact_HomeEMail", title: "Home E-Mail", type: "string", width: 200 },
                        { field: "Contact_WorkTelNo", title: "Work Tel. No", type: "string", width: 150 },
                        { field: "Contact_MobileTelNo", title: "Personal Mobile", type: "string", width: 150 },
                        { field: "Contact_WorkMobile", title: "Work Mobile", type: "string", hidden: true, width: 150},
                        { field: "Contact_HomeAddressTelNo", title: "Home Tel. No", type: "string", width: 150 },
                        { field: "Contact_DateOfBirth", title: "Date of Birth", hidden: true, type: "date", width: 150, format: "{0:dd MMM yyyy }" },
                        { field: "Contact_Title", title: "Title", type: "string", width: 150, hidden: true },
                        { field: "Contact_OwnerUser", title: "Owner User", type: "string", width: 150, hidden: true },
                        { field: "Contact_CompanyAddressStreet", title: "Company Street", type: "string", width: 150, hidden: true },
                        { field: "Contact_CompanyAddressCity", title: "Company City", type: "string", width: 150, hidden: true },
                        { field: "Contact_CompanyAddressCounty", title: "Company County", type: "string", width: 150, hidden: true },
                        { field: "Contact_CompanyAddressPostCode", title: "Company Post/ZIP Code", type: "string", width: 150, hidden: true },
                        { field: "Contact_CompanyAddressCountry", title: "Company Country", type: "string", width: 150, hidden: true },
                        { field: "Contact_HomeAddressStreet", title: "Home Street", type: "string", width: 150, hidden: true },
                        { field: "Contact_HomeAddressCity", title: "Home City", type: "string", width: 150, hidden: true },
                        { field: "Contact_HomeAddressCounty", title: "Home County", type: "string", width: 150, hidden: true },
                        { field: "Contact_HomeAddressPostCode", title: "Home Post/ZIP Code", type: "string", width: 150, hidden: true },
                        { field: "Contact_HomeAddressCountry", title: "Home Country", type: "string", width: 150, hidden: true },
                        { field: "Contact_ContactType", title: "Contact Type", type: "string", width: 150, hidden: true },
                        { field: "Contact_JobTitle", title: "Job Title", type: "string", width: 150, hidden: true },
                        { field: "Contact_AvailabilityDate", title: "Availability Date", width: 150, hidden: true, type: "date", format: "{0:dd MMM yyyy }" },
                        { field: "Contact_ContactSource", title: "Source", type: "string", width: 150, hidden: true },
                        { field: "Contact_Status", title: "Status", type: "string", width: 150, hidden: true },
                        { field: "Contact_DateLastUpdated", title: "Date Last Updated", width: 150, hidden: true, type: "date", format: "{0:dd MMM yyyy }" },
                        { field: "Contact_AddedByName", title: "Added By", type: "string", width: 150, hidden: true },
                        { field: "Contact_Comments", title: "Comments", type: "string", width: 300, hidden: true }
            ],

            MobileVisibleColumns: [
                        { field: "Contact_Surname", title: "Contact Details" }
            ],
            MobileRowTemplate: '<td colspan="1"><strong>#: Contact_Christian # #: Contact_Surname #</strong><br />#: Contact_ContactType #: #: Contact_Status #<br />' +
                                '<i>#: Contact_JobTitle #</i><br />#: Contact_Company #<hr></td>'
        },
        //#endregion TriSysWeb.Pages.Contacts

        //#region TriSysWeb.Pages.Companies
        Companies:
        {
            PopulateGrid: function (sDiv, sGridName, sTitle, fnPopulationByFunction, columns, options)       // TriSysWeb.Pages.Companies.PopulateGrid
            {
                if (TriSysAPI.Operators.isEmpty(columns))
                    columns = JSON.parse(JSON.stringify(TriSysWeb.Pages.Companies.Columns));

                var bMultiRowSelect = !TriSysApex.Device.isPhone();
                var bColumnFilters = !TriSysApex.Device.isPhone();

                var dynamicColumns = null, selectedRowsCounterId = null;
                if (options) {
                    dynamicColumns = options.DynamicColumns;
                    selectedRowsCounterId = options.SelectedRowsCounterId
                }

                var sSearchCriteriaJson = null;
                if (options)
                    sSearchCriteriaJson = options.Json;

                // Populate the grid now
                TriSysSDK.Grid.VirtualMode({
                    Div: sDiv,
                    ID: sGridName,
                    Title: sTitle,
                    RecordsPerPage: TriSysApex.UserOptions.RecordsPerPage(),
                    PopulationByFunction: fnPopulationByFunction,
                    Columns: columns,
                    DynamicColumns: dynamicColumns,
                    MobileVisibleColumns: TriSysWeb.Pages.Companies.MobileVisibleColumns,
                    MobileRowTemplate: TriSysWeb.Pages.Companies.MobileRowTemplate,

                    KeyColumnName: "Company_CompanyId",
                    DrillDownFunction: function (rowData)
                    {
                        // Load company Form with specified ID
                        var lCompanyId = rowData.Company_CompanyId;
                        TriSysApex.FormsManager.OpenForm("Company", lCompanyId);
                    },
                    MultiRowSelect: bMultiRowSelect,
                    ColumnFilters: bColumnFilters,
                    Grouping: TriSysApex.UserOptions.GridGrouping(),
                    HyperlinkedColumns: ["Company_Name"],                // New Jan 2021
                    HyperlinkedEntities:                                 // New Feb 2021 to allow multiple separate entity hyperlinks
                    {
                        EntityName: "Company",
                        Columns: [
                            {
                                field: "Company_WebPage",
                                linkType: "Function",
                                fnCallback: function (row) { TriSysSDK.Grid.HyperlinkedColumns.SpecialFields.DrillDown(row, "WebPage", "Company_WebPage"); }
                            },
                            {
                                field: "Company_MainTelNo",
                                linkType: "Function",
                                fnCallback: function (row) { TriSysSDK.Grid.HyperlinkedColumns.SpecialFields.DrillDown(row, "Phone", "Company_MainTelNo"); }
                            }
                        ]
                    },
                    SelectedRowsCounterId: selectedRowsCounterId
                });
            },

            Columns: [
                        { field: "Company_CompanyId", title: "ID", type: "number", width: 70, hidden: true },
                        { field: "Company_Name", title: "Name", type: "string", width: 200, sticky: true, lockable: true },
                        { field: "Company_WebPage", title: "Web Page", type: "string", width: 200  },
                        { field: "Company_MainTelNo", title: "Main Tel. No.", type: "string", width: 150 },
                        { field: "Company_Industry", title: "Industry", type: "string", width: 150 },
                        { field: "Company_Comments", title: "Comments", type: "string", hidden: true, width: 200 }
            ],
            MobileVisibleColumns: [
                        { field: "Company_Name" }
            ],
            MobileRowTemplate: '<td colspan="1"><strong>#: Company_Name #</strong><br />#: Company_Industry #<br />' +
                                '<i>#: Company_MainTelNo #</i><br />#: Company_Comments #<hr></td>'
        },
        //#endregion TriSysWeb.Pages.Companies

        //#region TriSysWeb.Pages.Requirements
        Requirements:
        {
            PopulateGrid: function (sDiv, sGridName, sTitle, fnPopulationByFunction, options)       // TriSysWeb.Pages.Requirements.PopulateGrid
            {
                var dynamicColumns = null, selectedRowsCounterId = null;
                if (options) {
                    dynamicColumns = options.DynamicColumns;
                    selectedRowsCounterId = options.SelectedRowsCounterId
                }

                // Populate the grid now
                TriSysSDK.Grid.VirtualMode({
                    Div: sDiv,
                    ID: sGridName,
                    Title: sTitle,
                    RecordsPerPage: TriSysApex.UserOptions.RecordsPerPage(),
                    PopulationByFunction: fnPopulationByFunction,
                    Columns: TriSysWeb.Pages.Requirements.Columns,
                    DynamicColumns: dynamicColumns,
                    MobileVisibleColumns: TriSysWeb.Pages.Requirements.MobileVisibleColumns,
                    MobileRowTemplate: TriSysWeb.Pages.Requirements.MobileRowTemplate,

                    KeyColumnName: "Requirement_RequirementId",
                    DrillDownFunction: function (rowData)
                    {
                        // Load entity form with specified ID
                        var lRequirementId = rowData.Requirement_RequirementId;
                        TriSysApex.FormsManager.OpenForm("Requirement", lRequirementId);
                    },
                    MultiRowSelect: true,
                    ColumnFilters: true,
                    Grouping: TriSysApex.UserOptions.GridGrouping(),
                    HyperlinkedColumns: ["Requirement_RequirementReference"],   // New Jan 2021
                    HyperlinkedEntities:                                        // New Feb 2021 to allow multiple separate entity hyperlinks
                    {
                        EntityName: "Requirement",
                        Columns: [
                                    { field: "RequirementCompany_Name",     linkType: "Company" },
                                    { field: "RequirementContact_FullName", linkType: "Client Contact" },
                                    { field: "Requirement_UserName",        linkType: "User Contact" }
                        ]
                    },
                    SelectedRowsCounterId: selectedRowsCounterId
                });
            },

            Columns: [
                        { field: "Requirement_RequirementId", title: "ID", type: "number", width: 70, hidden: true },
                        { field: "Requirement_RequirementReference", title: "Reference", type: "string", width: 150 },
                        { field: "Requirement_RequirementEntityType", title: "Type", type: "string", width: 150 },
                        { field: "Requirement_JobTitle", title: "Job Title", type: "string", width: 150 },
                        { field: "RequirementCompany_Name", title: "Company", type: "string", width: 200 },
                        { field: "RequirementContact_FullName", title: "Client Contact", type: "string", width: 150 },
                        { field: "Requirement_EarliestStartDate", title: "Start Date", type: "date", format: "{0:dd MMM yyyy}", width: 150 },
                        { field: "Location", title: "Location", type: "string", width: 200 },
                        { field: "Salary", title: "Salary", type: "string", width: 150 },
                        { field: "Requirement_RequirementStatus", title: "Status", type: "string", width: 150 },
                        { field: "Requirement_UserName", title: "User", type: "string", width: 150 },
                        { field: "Requirement_CVSentCount", title: "CV Sent Count", hidden: true, type: "number", width: 150 },         // 22 Mar 2023
                        { field: "Requirement_InterviewCount", title: "Interview Count", hidden: true, type: "number", width: 150 }
            ],
            MobileVisibleColumns: [
                { field: "Requirement_RequirementReference", title: "Job Details" }
            ],
            MobileRowTemplate: '<td colspan="1"><strong>#: Requirement_RequirementReference # ' +
                                '(#: Requirement_RequirementEntityType #: #: Requirement_RequirementStatus #)</strong><br />' +
                                '#: Requirement_JobTitle #<br /><i>#: Location #</i><br />' +
                                '#: RequirementContact_FullName #, #: RequirementCompany_Name #<br />' +
                                '#: Requirement_UserName #</br >Start Date: #: kendo.format("{0:dd MMM yyyy}", Requirement_EarliestStartDate) #<hr></td>'
        },
        //#endregion TriSysWeb.Pages.Requirements

        //#region TriSysWeb.Pages.Placements
        Placements:
        {
            PopulateGrid: function (sDiv, sGridName, sTitle, fnPopulationByFunction, options)       // TriSysWeb.Pages.Placements.PopulateGrid
            {
                var dynamicColumns = null, selectedRowsCounterId = null;
                if (options) {
                    dynamicColumns = options.DynamicColumns;
                    selectedRowsCounterId = options.SelectedRowsCounterId
                }

                // Populate the grid now
                TriSysSDK.Grid.VirtualMode({
                    Div: sDiv,
                    ID: sGridName,
                    Title: sTitle,
                    RecordsPerPage: TriSysApex.UserOptions.RecordsPerPage(),
                    PopulationByFunction: fnPopulationByFunction,
                    Columns: TriSysWeb.Pages.Placements.Columns,
                    DynamicColumns: dynamicColumns,
                    MobileVisibleColumns: TriSysWeb.Pages.Placements.MobileVisibleColumns,
                    MobileRowTemplate: TriSysWeb.Pages.Placements.MobileRowTemplate,

                    KeyColumnName: "Placement_PlacementId",
                    DrillDownFunction: function (rowData)
                    {
                        // Load entity form with specified ID
                        var lPlacementId = rowData.Placement_PlacementId;
                        TriSysApex.FormsManager.OpenForm("Placement", lPlacementId);
                    },
                    MultiRowSelect: true,
                    ColumnFilters: true,
                    Grouping: TriSysApex.UserOptions.GridGrouping(),
                    HyperlinkedColumns: ["Placement_Reference"],                // New Jan 2021
                    HyperlinkedEntities:                                        // New Feb 2021 to allow multiple separate entity hyperlinks
                    {
                        EntityName: "Placement",
                        Columns: [
                                    { field: "PlacementCompany_Name",               linkType: "Company" },
                                    { field: "DynamicColumn_Company_CompanyName",   linkType: "Company" },
                                    { field: "PlacementContact_FullName",           linkType: "Client Contact" },
                                    { field: "CandidateContact_FullName",           linkType: "Candidate Contact" },
                                    { field: "Placement_UserName",                  linkType: "User Contact" },
                                    { field: "RequirementReference",                linkType: "Requirement" }
                        ]
                    },
                    SelectedRowsCounterId: selectedRowsCounterId
                });
            },

            Columns: [
                        { field: "Placement_PlacementId", title: "ID", type: "number", width: 70, hidden: true },
                        { field: "Placement_Reference", title: "Reference", type: "string", width: 150 },
                        { field: "Placement_PlacementEntityType", title: "Type", type: "string", width: 150 },
                        { field: "Placement_JobTitle", title: "Job Title", type: "string", width: 150 },
                        { field: "CandidateContact_FullName", title: "Candidate", type: "string", width: 200 },
                        { field: "Placement_StartDate", title: "Start Date", type: "date", format: "{0:dd MMM yyyy}", width: 150 },
                        { field: "Placement_EndDate", title: "End Date", type: "date", format: "{0:dd MMM yyyy}", hidden: true, width: 150 },
                        { field: "PlacementCompany_Name", title: "Company", type: "string", width: 200 },
                        { field: "PlacementContact_FullName", title: "Client Contact", type: "string", hidden: true, width: 200 },
                        { field: "Location", title: "Location", type: "string", hidden: true, width: 200 },
                        { field: "City", title: "City", type: "string", width: 150 },
                        { field: "Placement_Salary", title: "Salary/Charge", type: "string", hidden: true, width: 150 },
                        { field: "Placement_PlacementStatus", title: "Status", type: "string", width: 150 },
						{ field: "Placement_UserName", title: "User", type: "string", width: 150 },
						{ field: "RequirementReference", title: "Requirement", type: "string", hidden: true, width: 150 }
            ],
            MobileVisibleColumns: [
                { field: "Placement_Reference", title: "Placement Details" }
            ],
            MobileRowTemplate: '<td colspan="1"><strong>#: Placement_Reference # ' +
                                '(#: Placement_PlacementEntityType #: #: Placement_PlacementStatus #)</strong><br />' +
                                '#: CandidateContact_FullName #, #: Placement_JobTitle #<br />' +
                                '#: PlacementContact_FullName #, #: PlacementCompany_Name #<br />' +
                                '#: Placement_UserName #</br >Start Date: #: kendo.format("{0:dd MMM yyyy}", Placement_StartDate) #<hr></td>'
        },
        //#endregion TriSysWeb.Pages.Placements

        //#region TriSysWeb.Pages.Timesheets
        Timesheets:
        {
            PopulateGrid: function (sDiv, sGridName, sTitle, fnPopulationByFunction, options)     // TriSysWeb.Pages.Timesheets.PopulateGrid
            {
                var dynamicColumns = null, selectedRowsCounterId = null;
                if (options) {
                    dynamicColumns = options.DynamicColumns;
                    selectedRowsCounterId = options.SelectedRowsCounterId
                }

                // Populate the grid now
                TriSysSDK.Grid.VirtualMode({
                    Div: sDiv,
                    ID: sGridName,
                    Title: sTitle,
                    RecordsPerPage: TriSysApex.UserOptions.RecordsPerPage(),
                    PopulationByFunction: fnPopulationByFunction,
                    Columns: TriSysWeb.Pages.Timesheets.Columns,
                    DynamicColumns: dynamicColumns,
                    MobileVisibleColumns: TriSysWeb.Pages.Timesheets.MobileVisibleColumns,
                    MobileRowTemplate: TriSysWeb.Pages.Timesheets.MobileRowTemplate,

                    KeyColumnName: "Timesheet_TimesheetId",
                    DrillDownFunction: function (rowData)
                    {
                        // Load entity form with specified ID
                        var lTimesheetId = rowData.Timesheet_TimesheetId;
                        TriSysApex.FormsManager.OpenForm("Timesheet", lTimesheetId);
                    },
                    MultiRowSelect: true,
                    ColumnFilters: true,
                    Grouping: TriSysApex.UserOptions.GridGrouping(),
                    HyperlinkedColumns: ["Period", "Timesheet_TimesheetId"],    // New Jan 2021
                    HyperlinkedEntities:                                        // New Feb 2021 to allow multiple separate entity hyperlinks
                    {
                        EntityName: "Timesheet",
                        Columns: [
                                    { field: "Reference", linkType: "Placement" },
                                    { field: "PlacementUser", linkType: "Placement" },
                                    { field: "Company", linkType: "Company" },
                                    { field: "Candidate", linkType: "Candidate Contact" },
                                    {
                                        field: "TimesheetLink",
                                        linkType: "Function",
                                        fnCallback: function (row) { TriSysSDK.Grid.HyperlinkedColumns.SpecialFields.DrillDown(row, "WebPage", "TimesheetLink"); }
                                    }
                        ]
                    },
                    SelectedRowsCounterId: selectedRowsCounterId
                });
            },

            Columns: [
                        { field: "Timesheet_TimesheetId", title: "ID", type: "number", width: 70, hidden: true },
                        { field: "Reference", title: "Placement", type: "string", width: 150 },
                        { field: "Company", title: "Company", type: "string", width: 200 },
                        { field: "Candidate", title: "Candidate", type: "string", width: 200 },
                        { field: "JobTitle", title: "Job Title", type: "string", width: 150 },
                        { field: "Period", title: "Period", type: "string", width: 150 },
                        { field: "InputDate", title: "Input Date", type: "date", format: "{0:dd MMM yyyy}", width: 150 },
                        { field: "TotalTimeWorked", title: "Total Time Worked", type: "number", format: "{0:n}", width: 150 },
                        { field: "Authorised", title: "Authorised", type: "string", width: 150 },
                        //{ field: "DateAuthorised", title: "Date Authorised", type: "date", format: "{0:dd MMM yyyy}" },
                        //{ field: "AuthorisedBy", title: "Authorised By", type: "string" },
                        { field: "Paid", title: "Exported", type: "string", width: 150 },
                        { field: "NetPay", title: "Net Pay", type: "string", hidden: true, width: 150 },
                        { field: "NetCharge", title: "Net Charge", type: "string", hidden: true, width: 150 },
                        { field: "PayTotal", title: "Pay Total", type: "string", hidden: true, width: 150 },
                        { field: "VATAmount", title: "VAT Amount", type: "string", hidden: true, width: 150 },
                        { field: "PayrollCompany", title: "Payroll Company", type: "string", hidden: true, width: 200 },
                        { field: "PayRate", title: "Pay Rate", type: "string", hidden: true, width: 150 },
                        { field: "ChargeRate", title: "Charge Rate", type: "string", hidden: true, width: 150 },
                        { field: "NetMargin", title: "Net Margin", type: "string", hidden: true, width: 150 },
                        { field: "SiteAddress", title: "Site Address", type: "string", hidden: true, width: 200 },
                        { field: "TimesheetLink", title: "Original Timesheet", type: "string", hidden: true, width: 400 },
                        { field: "PlacementUser", title: "Placement User", type: "string", hidden: true, width: 150 }
            ],
            MobileVisibleColumns: [
                { field: "Reference", title: "Reference" }
            ],
            MobileRowTemplate: '<td colspan="1"><strong>#: Placement_Reference # ' +
                                '(#: Placement_PlacementEntityType #: #: Placement_PlacementStatus #)</strong><br />' +
                                '#: CandidateContact_FullName #, #: Placement_JobTitle #<br />' +
                                '#: PlacementContact_FullName #, #: PlacementCompany_Name #<br />' +
                                '#: Placement_UserName #</br >Start Date: #: kendo.format("{0:dd MMM yyyy}", Placement_StartDate) #<hr></td>'
        },
        //#endregion TriSysWeb.Pages.Timesheets

        //#region TriSysWeb.Pages.Tasks
        Tasks:
        {
            PopulateGrid: function (sDiv, sGridName, sTitle, fnPopulationByFunction, options)     // TriSysWeb.Pages.Tasks.PopulateGrid
            {
                var dynamicColumns = null, selectedRowsCounterId = null;
                if (options) {
                    dynamicColumns = options.DynamicColumns;
                    selectedRowsCounterId = options.SelectedRowsCounterId
                }

                // Populate the grid now
                TriSysSDK.Grid.VirtualMode({
                    Div: sDiv,
                    ID: sGridName,
                    Title: sTitle,
                    RecordsPerPage: TriSysApex.UserOptions.RecordsPerPage(),
                    PopulationByFunction: fnPopulationByFunction,
                    Columns: TriSysWeb.Pages.Tasks.Columns,
                    //DynamicColumns: dynamicColumns,           // Not for task searches - too slow
                    KeyColumnName: "TaskId",
                    DrillDownFunction: function (rowData) {
                        // Load entity form with specified ID
                        var lTaskId = rowData.TaskId;
                        TriSysApex.ModalDialogue.Task.QuickShow(lTaskId);
                    },
                    MultiRowSelect: true,
                    ColumnFilters: true,
                    Grouping: TriSysApex.UserOptions.GridGrouping(),
                    HyperlinkedColumns: ["TaskId"],              
                    SelectedRowsCounterId: selectedRowsCounterId
                });
            },

            Columns: [
                        { field: "TaskId", title: "ID", type: "number", width: 70, hidden: true },
                        {
                            field: "Image", title: ' ',
                            template: '<img src="images/trisys/16x16/tasktype/#= TaskType #.png?ts=202103241810" style="width: 24px; height: 24px;" alt="#= TaskType #">',
                            width: 35,
                            filterable: false,
                            sortable: false,
                            attributes: {                           // 21 Jan 2021
                                style: "text-overflow: clip;"       // Prevent ellipsis default showing a little dot to the right of the image
                            }
                        },
                        { field: "TaskType", title: 'Task Type', type: "string", width: 250 },
                        { field: "StartDate", title: "Start Date", type: "date", format: "{0:dd MMM yyyy}", width: 150 },
                        { field: "EndDate", title: "End Date", type: "date", format: "{0:dd MMM yyyy}", width: 150 },
                        { field: "DisplayDescription", title: "Description", type: "string", width: 350 },
                        { field: "LoginName", title: "Login Name", type: "string", width: 150 },
                        { field: "TaskContacts", title: "Contacts", type: "string", width: 150, hidden: true },
                        { field: "Attributes", title: "Attributes", type: "string", width: 150, hidden: true }
            ]
        }
        //#endregion TriSysWeb.Pages.Tasks

    },
    //#endregion TriSysWeb.Pages

    //#region TriSysWeb.Security
    Security:
    {
        // There are 3 types of login:
        //
        //  Candidate: A contact of type 'Candidate' in the TriSys CRM database.
        //             Candidates can search for jobs and apply, and enter new timesheets.
        //  Client:    A contact of type 'Client' in the TriSys CRM database.
        //             Clients can create/edit jobs and authorise timesheets.
        //  User:      A user linked to a contact of type 'User' in the TriSys CRM database.
        //             Users can login to the CRM database and create/edit/delete CRM data,
        //             edit e-mail templates, as well as run recruiting business workflow actions.

        // When each page loads, show/hide login credentials in page header
        ShowLoginCredentialsAfterPageLoad: function ()
        {
            // Show appropriate security settings
            if (!TriSysWeb.Security.IsClientOrCandidateLoggedIn() && !TriSysWeb.Security.IsUserLoggedIn())
            {
                // User is not logged in so clear login credential display
                TriSysWeb.Security.ShowLoginStatus(false);
            }
            else
            {
                // Client or Candidate is logged in, so show name+company
                TriSysWeb.Security.ShowLoginStatus(true);
            }
        },

        // Check cookies to see if local user is logged in
        IsDataConnectionOpen: function ()
        {
            var dataConnectionKey = TriSysWeb.Security.ClientOrCandidate_CDataConnectionKey();
            if (dataConnectionKey)
            {
                // This is not enough to prove that we are connected (statelessly of course) because the
                // connection key could be invalid or timed-out if we are changing keys on the server.
                // Hence test a connection based upon a very simple synchronous API call.
                if (TriSysAPI.Data.VerifyDataServicesKey())
                    return true;
            }
            return false;
        },

        IsClientOrCandidateLoggedIn: function ()
        {
            var dataConnectionKey = TriSysWeb.Security.ClientOrCandidate_CDataConnectionKey();
            if (dataConnectionKey)
            {
                if (dataConnectionKey.LoggedInAgencyContact)
                    return true;
            }
            return false;
        },

        IsClientLoggedIn: function ()
        {
            var dataConnectionKey = TriSysWeb.Security.ClientOrCandidate_CDataConnectionKey();
            if (dataConnectionKey)
            {
                if (dataConnectionKey.LoggedInAgencyContact)
                    if (dataConnectionKey.LoggedInAgencyContact.ContactType == "Client")
                        return true;
            }
            return false;
        },

        IsCandidateLoggedIn: function ()
        {
            var dataConnectionKey = TriSysWeb.Security.ClientOrCandidate_CDataConnectionKey();
            if (dataConnectionKey)
            {
                if (dataConnectionKey.LoggedInAgencyContact)
                    if (dataConnectionKey.LoggedInAgencyContact.ContactType == "Candidate")
                        return true;
            }
            return false;
        },

        IsUserLoggedIn: function ()
        {
            var dataConnectionKey = TriSysWeb.Security.ClientOrCandidate_CDataConnectionKey();
            if (dataConnectionKey)
                if (dataConnectionKey.LoggedInUser)
                    if (dataConnectionKey.LoggedInUser.InteractiveAgencyRecruiter)
                        return true;

            return false;
        },

        // Get the data connection key cached in session memory for the logged in client or candidate
        ClientOrCandidate_CDataConnectionKey: function ()
        {
            var sCookie = TriSysAPI.Session.Memory.Get("CDataConnectionKey");
            if (sCookie)
            {
                try
                {
                    var CDataConnectionKey = JSON.parse(sCookie);
                    return CDataConnectionKey;
                }
                catch (err)
                {
                    // Potential hacker or cookie corruption
                }
            }
            return null;
        },

        ShowLoginStatus: function (bLoggedIn)
        {
            var sLoginMessageText = TriSysWeb.Constants.NotLoggedInText;

            if (bLoggedIn)
            {
                var dataConnectionKey = TriSysWeb.Security.ClientOrCandidate_CDataConnectionKey();
                if (dataConnectionKey)
                {
                    var sContactType = '', sLoginDetails = null, sCompanyName = null;

                    if (dataConnectionKey.LoggedInAgencyContact)
                    {
                        agencyContact = dataConnectionKey.LoggedInAgencyContact;
                        sContactType = agencyContact.ContactType;
                        sLoginDetails = agencyContact.FullName;
                        sCompanyName = agencyContact.CompanyName;
                    }
                    else
                    {
                        userContact = dataConnectionKey.LoggedInUser.Contact;
                        if (userContact)
                        {
                            sLoginDetails = userContact.FullName;
                            sCompanyName = userContact.CompanyName;
                            sContactType = 'Recruiter';
                        }
                        else
                        {
                            var crmContact = dataConnectionKey.LoggedInUser.CRMContact;
                            if(crmContact)
                            {
                                sLoginDetails = crmContact.FullName;
                                sCompanyName = crmContact.CompanyName;
                                sContactType = crmContact.ContactType;
                            }
                        }
                    }

                    if (sCompanyName)
                        sLoginDetails += ', ' + sCompanyName;

                    sLoginMessageText = TriSysWeb.Constants.LoggedInPrefixText + sContactType + ": " + sLoginDetails;
                }

                $('#loggedinPanel').show();
                $('#loginPanel').hide();

                // Show client menu
                var sClientMenu = "#menuItem-client-dropdown";
                var sCandidateMenu = "#menuItem-candidate-dropdown";
                var sUserMenu = "#menuItem-user-dropdown";

                if (TriSysWeb.Security.IsClientLoggedIn())
                {
                    $(sClientMenu).show();
                    $(sCandidateMenu).hide();
                    $(sUserMenu).hide();
                }
                else if (TriSysWeb.Security.IsCandidateLoggedIn())
                {
                    $(sClientMenu).hide();
                    $(sCandidateMenu).show();
                    $(sUserMenu).hide();
                }
                else
                {
                    $(sClientMenu).hide();
                    $(sCandidateMenu).hide();
                    $(sUserMenu).show();
                }
            }
            else
            {
                $('#loggedinPanel').hide();
                $('#loginPanel').show();
            }

            $('#loggedInNameAndCompany').html(sLoginMessageText);
        },

        // Called from TriSysWeb.Pages.SecurityRedirector
        // If we need a database connection e.g. show vacancies, get it now
        ConnectToAgencyDatabaseOnly: function (sPageName, fnCallback, bCacheAfterLogin)
        {
            // We must connect using the TriSys CRM agency user credentials in order to access the correct cloud database
            var TriSysCRMCredentialAccountTypeEnum_AgencyVacanciesOnly = 3;
            var eAccountType = TriSysCRMCredentialAccountTypeEnum_AgencyVacanciesOnly;
            var dataPacket = {
                'CRMCredentialKey': TriSysWeb.Constants.AgencyUserLoginCredentialsToCRM,
                'AccountType': eAccountType
            };

            if (TriSysAPI.Operators.isEmpty(bCacheAfterLogin))
                bCacheAfterLogin = true;

            TriSysApex.LoginCredentials.ValidateViaWebService(dataPacket, false, function ()
            {
                if (bCacheAfterLogin)
                    TriSysWeb.Security.ValidatedLoginCredentialsCallback(fnCallback);
                else
                    fnCallback();
            });
        },

		// Re-use base64 credentials
		DecryptBase64Credentials: function (sEMailAndPasswordBase64)
		{
			if(sEMailAndPasswordBase64)
			{
				sEMailAndPassword = $.base64.decode(sEMailAndPasswordBase64);

				var parts = sEMailAndPassword.split("{!}");
				var sEMail = parts[0];
				var sPassword = parts[1];

				var sFormName = null;
				if(parts.length == 3)
					sFormName = parts[2];

				return { EMail: sEMail, Password: sPassword, FormName: sFormName };
			}
		},

        // Called after user explicitly enters data, or automatically where cookies are set.
        LoginButtonClick: function (CSocialNetworkLoginParameters)
        {
            var sLoginEMail = $('#txtLoginEMail').val();
            var sPassword = $('#txtLoginPassword').val();
            var sPersistence = $('#' + TriSysWeb.Pages.Login.PersistenceDiv).val();
            var bRememberMe = TriSysSDK.CShowForm.CheckBoxValue("login-remember-me");

            if (CSocialNetworkLoginParameters)
            {
                sLoginEMail = null;
                sPassword = null;
                bRememberMe = false;
            }
            else
            {
                // Simple validation of parameters
                if (!TriSysApex.LoginCredentials.validateEmail(sLoginEMail))
                {
                    var sMessage = TriSysSDK.Resources.Message("LoginButtonClick_EMail");
                    TriSysApex.UI.ShowMessage(sMessage, TriSysWeb.Constants.ApplicationName);
                    TriSysPhoneGap.HideSplashScreen();
                    return;
                }

                if (!sPassword)
                {
                    var sMessage = TriSysSDK.Resources.Message("LoginButtonClick_Password");
                    TriSysApex.UI.ShowMessage(sMessage, TriSysWeb.Constants.ApplicationName);
                    TriSysPhoneGap.HideSplashScreen();
                    return;
                }
                var sError = TriSysApex.LoginCredentials.ValidatePassword(sPassword);
                if (sError)
                {
                    TriSysApex.UI.ShowMessage(sError, TriSysApex.Copyright.ShortProductName);
                    TriSysPhoneGap.HideSplashScreen();
                    return;
                }
            }

			// Are we in recruiter mode?
			var sURL = window.location.href;
			var sDevRecruiterMode = "%22Mode%22:%20%22Recruiter%22".toLowerCase();	// "Mode": "Recruiter"
            var bRecruiterCommandLine = (sURL.toLowerCase().indexOf("?recruiter") > 0) || (sURL.toLowerCase().indexOf(sDevRecruiterMode) > 0);
			var bSupportLogin = (sURL.toLowerCase().indexOf("#supportlogin~") > 0);

            // Determine what type of login i.e. Agency Recruiter/User, or Client/Candidate (contact in the CRM)
            if (TriSysWeb.Security.isAgencyUserEMail(sLoginEMail) || TriSysApex.Constants.TriSysHostedCRM || bRecruiterCommandLine || bSupportLogin)
            {
				var validateOptions = {
					LoginEMail: sLoginEMail,
					Password: sPassword,
					RememberMe: bRememberMe,
					AfterRecruiterUserAuthentication: TriSysWeb.Security.AfterRecruiterUserAuthentication,
					SocialNetworkLoginParameters: CSocialNetworkLoginParameters,
					RecruiterCommandLine: bRecruiterCommandLine,
					URL: sURL
				};
                TriSysApex.LoginCredentials.Validate(validateOptions);
            }
            else
                TriSysWeb.Security.LoginAsAgencyClientOrCandidate(sLoginEMail, sPassword, bRememberMe);
        },

        AfterRecruiterUserAuthentication: function ()
        {
			var fnContinueLoginProcess = function()
			{
				TriSysApex.UI.ShowWait(null, "Loading Configuration...");

				// Go back to get the cached user settings to make life easier to draw her own
				// highly customised application layout/functions...
				TriSysApex.LoginCredentials.ReadLoggedInUserSettings(TriSysWeb.Security.AfterReadingLoggedInUserSettings);
			};

			// December 2019: 2FA
			var fnDetermineIf2FAEnabled = function()
			{
			    // 28 Mar 2023: is support portal?
			    // 29 Mar 2023: Only the support portal controls 2FA
			    //var bAll2FAisDoneByOurSupportPortal = true;
			    var options = null;
			    //var sURL = window.location.href;
			    //var bSupportPortal = (sURL.indexOf("https://support.trisys.co.uk/") == 0);
			    //if (bSupportPortal || bAll2FAisDoneByOurSupportPortal)
			    //    options = { ApplicationName: TriSysApex.Copyright.ShortProductName };

				// This script is also loaded in TriSysApex.js AND UserOptions.js
				ctrlEnableTwoFactorAuthentication.isEnabled(true, function(bEnabled, bLocked, bHasAuthenticatedPreviously, sAuthenticatorAppName)
				{
					if(bEnabled)
					{
					    options = {};
					    options.Login = true;       // bHasAuthenticatedPreviously; 29 Mar 2023: Commented out
					    options.PreLogin = true;
					    options.AuthenticatorAppName = sAuthenticatorAppName;

					    // We need to prompt for a google authenticator code now before allowing full access
						// All centralised in this script loaded after login
						ctrlEnableTwoFactorAuthentication.PromptForTwoFactorAuthentication(options, function(bAuthenticated)
						{
							if(bAuthenticated)
							{
								fnContinueLoginProcess();
							}
							else
							{
								// User failed or cancelled 2FA so commence logout process
								TriSysApex.LoginCredentials.Logoff(false);
							}
						});
					}
					else
						fnContinueLoginProcess();
				}, options);						
			};

			// Always load this script as it manages 2FA
			TriSysApex.WhiteLabelling.LoadJavascriptFile('js/pages/ctrlEnableTwoFactorAuthentication.js', null, 
															fnDetermineIf2FAEnabled);
        },

        AfterReadingLoggedInUserSettings: function (CDataConnectionKey)
        {
            // Do we redirect to a remote on-premise Web API?
            if (CDataConnectionKey.WebAPIEndPoint)
                TriSysAPI.Constants.SecureURL = CDataConnectionKey.WebAPIEndPoint;  // Yes, we do

            // Go back to get the cached standing data settings and meta database
            TriSysApex.LoginCredentials.CacheStandingData(CDataConnectionKey, function (CDataConnectionKey, CCachedStandingDataWithBOLObjects)
            {
                // Mark the agency user login
                CDataConnectionKey.LoggedInUser.InteractiveAgencyRecruiter = !CDataConnectionKey.LoggedInAgencyContact;

                // Where to go after login?
                var fnPostUserLogin = function ()
                {
                    var bRecruiter = true;
                    TriSysApex.NavigationBar.PostLoginEvent(true, bRecruiter, false, false);
                    TriSysApex.Forms.Login.Authenticated(CDataConnectionKey);
                };

                // Cache the login credentials 
                TriSysWeb.Security.AfterCacheingAccountSettings(CDataConnectionKey, CCachedStandingDataWithBOLObjects, fnPostUserLogin);
            });
        },

        // The e-mail address domain must match our site domain name
        isAgencyUserEMail: function (sLoginEMail)
        {
            if (!sLoginEMail)
                return false;

            var sDomain = TriSysWeb.Copyright.HomePage;     // domain.com or www.domain.com or http://xyz.domain.com
            var domainParts = sDomain.split(".");
            var emailParts = sLoginEMail.split("@");
            if (domainParts.length > 1 && emailParts.length == 2)
            {
                sDomain = domainParts[domainParts.length - 2].toLowerCase() + "." + domainParts[domainParts.length - 1];
                sLoginEMail = emailParts[1].toLowerCase();
                var bMatchedDomain = (sDomain == sLoginEMail);
                return bMatchedDomain;
            }
        },

        LoginAsAgencyClientOrCandidate: function (sLoginEMail, sPassword, bRememberMe)
        {
            // We must connect using the TriSys CRM agency user credentials in order to access the correct cloud database,
            // and also pass in the client/candidate contact details which live in the agency SQL database
            var TriSysCRMCredentialAccountTypeEnum_AgencyClientOrCandidate = 2;
            var eAccountType = TriSysCRMCredentialAccountTypeEnum_AgencyClientOrCandidate;
            var dataPacket = {
                'CRMCredentialKey': TriSysWeb.Constants.AgencyUserLoginCredentialsToCRM,
                'AccountType': eAccountType,
                'AgencyContact_EMail': sLoginEMail,
                'AgencyContact_Password': sPassword
            };

            var fnPostLogin = function ()
            {
                if (bRememberMe)
                    TriSysWeb.Security.CacheLoginCredentialsAsCookies();

                TriSysWeb.Security.ValidatedLoginCredentialsCallback(TriSysApex.Forms.Login.PostLoginRedirection);
            };

            var sLoginFailedMessage = TriSysSDK.Resources.Message("LoginButtonClick_Invalid");
            TriSysApex.LoginCredentials.ValidateViaWebService(dataPacket, bRememberMe, fnPostLogin, sLoginFailedMessage);
        },

        // Called when user specifically requests a logoff.
        // If they explicitly logoff, then remove their saved credentials. (See LinkedIn for inspiration)
        LogoffButtonClick: function ()
        {
            var sMessage = TriSysSDK.Resources.Message("LogoffButtonClick");
            var sYes = TriSysSDK.Resources.Message("Yes");
            var sNo = TriSysSDK.Resources.Message("No");
            var sCancel = TriSysSDK.Resources.Message("Cancel");
            var sTitle = TriSysWeb.Constants.ApplicationName;
            var fnLogoffCompletion = function () { TriSysWeb.Security.ShowLoginPage(); };
            var fnLogoffProcess = function ()
            {
                var fnClearKeysAndShowLogin = function ()
                {
                    TriSysApex.UI.HideWait();

                    // Clear the data services key and connection details as it is no longer valid
                    TriSysAPI.Session.Memory.Clear();

                    // Clear all cached login details also
                    TriSysWeb.Security.WritePersistedLoginCredentials(null);

                    TriSysWeb.Security.ShowLoginStatus(false);
                    var sMessage = TriSysSDK.Resources.Message("fnClearKeysAndShowLogin");

                    //TriSysApex.UI.ShowMessage(sMessage, TriSysWeb.Constants.ApplicationName, fnLogoffCompletion);
                    TriSysApex.Toasters.InfoWindow(sMessage);
                    fnLogoffCompletion();
                };

                TriSysApex.UI.ShowWait(null, TriSysSDK.Resources.Message("Logging Off..."));
                TriSysApex.LoginCredentials.LogoffWebServiceWithCallback(fnClearKeysAndShowLogin);
            };

            TriSysApex.UI.questionYesNo(sMessage, sTitle, sYes, fnLogoffProcess, sNo, null);
        },


        ValidatedLoginCredentialsCallback: function (fnCallback)
        {
			var sWaitingMessage = TriSysSDK.Resources.Message("ValidatedLoginCredentialsCallback");
			TriSysApex.UI.ShowWait(null, sWaitingMessage);

			// Go back to get the login settings 
			TriSysApex.LoginCredentials.ReadLoggedInUserSettings(function (CDataConnectionKey)
			{
				TriSysWeb.Security.AfterReadingLoggedInAccountSettings(CDataConnectionKey, fnCallback);
			});          
        },

		
        AfterReadingLoggedInAccountSettings: function (CDataConnectionKey, fnCallback)
        {
            // Go back to get the cached standing data settings and meta database
            TriSysApex.LoginCredentials.CacheStandingData(CDataConnectionKey, function (CDataConnectionKey, CCachedStandingDataWithBOLObjects)
            {
                TriSysWeb.Security.AfterCacheingAccountSettings(CDataConnectionKey, CCachedStandingDataWithBOLObjects, fnCallback);
            });
        },

        AfterCacheingAccountSettings: function (CDataConnectionKey, CCachedStandingDataWithBOLObjects, fnCallback)
        {
            TriSysApex.UI.HideWait();

            // User is logged in, so save in session memory
            var sStringifiedJSON = JSON.stringify(CDataConnectionKey);
            TriSysAPI.Session.Memory.Set("CDataConnectionKey", sStringifiedJSON);

            // If an agency contact, let her explicitly know they are logged in
            if (CDataConnectionKey.LoggedInAgencyContact || TriSysWeb.Security.IsUserLoggedIn())
            {
                TriSysWeb.Security.ShowLoginStatus(true);

                var sLoginStuff = null;
                if (CDataConnectionKey.LoggedInAgencyContact)
                {
                    var contact = CDataConnectionKey.LoggedInAgencyContact;
                    sLoginStuff = contact.FullName + ", " + contact.CompanyName;

                    var bClient = (CDataConnectionKey.LoggedInAgencyContact.ContactType == "Client");
                    var bCandidate = !bClient;
                    TriSysApex.NavigationBar.PostLoginEvent(true, false, bClient, bCandidate);
                    TriSysApex.Pages.Index.PostLoginVisuals(true, CDataConnectionKey);
                }
                else if (CDataConnectionKey.LoggedInUser)
                {
                    // Company name may not be supplied during login, so do not show it here
                    sLoginStuff = CDataConnectionKey.LoggedInUser.FullName; // + ", " + CDataConnectionKey.LoggedInUser.CompanyName;
                }

                var sMessage = TriSysSDK.Resources.Message("AfterCacheingAccountSettings");
                sMessage = sMessage.replace("##LoginType##", sLoginStuff);

                // Confirm successful login

                var fnPostLoginConfirmationPopup = function ()
                {
                    // Now, finally, we can redirect to the page DocumentReady().Callback function
                    if (fnCallback)
                        fnCallback(CDataConnectionKey);
                };

                //TriSysApex.UI.ShowMessage(sMessage, TriSysWeb.Constants.ApplicationName, fnPostLoginConfirmationPopup);
                //TriSysApex.Toasters.Success(sMessage);
                fnPostLoginConfirmationPopup();
                return;
            }

            // If not logged in, redirect to the page DocumentReady().Callback function
            if (fnCallback)
                fnCallback();
        },

        // If user has persisted login credentials, then use these.
        // Open the login.html page to orchestrate the login process.
        AutoLoginFromSavedCredentials: function ()
        {
            if (!TriSysWeb.Security.IsClientOrCandidateLoggedIn() && !TriSysWeb.Security.IsUserLoggedIn())
            {
                var credentialPacket = TriSysWeb.Security.ReadPersistedLoginCredentials();
                if (credentialPacket)
                {
                    var sEMailAddress = credentialPacket.EMailAddress;
                    var sPassword = credentialPacket.Password;
                    if (sEMailAddress && sPassword)
                    {
                        // NEW
                        TriSysAPI.Session.Memory.Set(TriSysWeb.Security.AutoLoginNameSetting, sEMailAddress);
                        TriSysAPI.Session.Memory.Set(TriSysWeb.Security.AutoLoginPasswordSetting, sPassword);

                        if (TriSysApex.Constants.SinglePageApplication)
                        {
                            TriSysWeb.Pages.Login.Load();
                            //return ?
                        }
                        else
                        {
                            var sURL = window.location.href.toLowerCase();
                            if (sURL.indexOf(TriSysWeb.Constants.LoginPage.toLowerCase()) > 0)
                                return false;
                            else
                                return TriSysWeb.Security.ShowLoginPage();
                        }
                    }
                }
            }

            return false;
        },

        ShowLoginPage: function ()
        {
            window.location = TriSysWeb.Constants.LoginPage;
            return true;
        },

        AutoLoginNameSetting: "AutomaticLogin_EMail",
        AutoLoginPasswordSetting: "AutomaticLogin_Password",

        CacheLoginCredentialsAsCookies: function ()
        {
            var sLoginEMail = $('#txtLoginEMail').val();
            var sPassword = $('#txtLoginPassword').val();
            var credentialPacket = {
                EMailAddress: sLoginEMail,
                Password: sPassword
            };
            TriSysWeb.Security.WritePersistedLoginCredentials(credentialPacket);
        },

        AreLoginCredentialsPersisted: function ()
        {
            var credentialPacket = TriSysWeb.Security.ReadPersistedLoginCredentials();
            if (credentialPacket)
            {
                if (credentialPacket.EMailAddress && credentialPacket.Password)
                {
                    if (credentialPacket.EMailAddress.length > 0 && credentialPacket.Password.length > 0)
                        return true;
                }
            }
        },

        ReadPersistedLoginCredentials: function ()               // TriSysWeb.Security.ReadPersistedLoginCredentials
        {
            try
            {
                var CookiePrefix = TriSysWeb.Constants.Cookie_Prefix;

                var sEMailAddress = TriSysAPI.Cookies.getCookie(CookiePrefix + "Login_EMail");
                var sPassword = TriSysAPI.Cookies.getCookie(CookiePrefix + "Login_Password");

                if (sEMailAddress || sPassword)
                {

                    if (sEMailAddress)
                    {
                        if (sEMailAddress.length > 0)
                        {
                            // Decrypt
                            sEMailAddress = TriSysAPI.Encryption.decrypt(sEMailAddress, TriSysWeb.Security.EncryptionKey);
                        }
                    }

                    if (sPassword)
                    {
                        if (sPassword.length > 0)
                        {
                            // Decrypt
                            sPassword = TriSysAPI.Encryption.decrypt(sPassword, TriSysWeb.Security.EncryptionKey);
                        }
                    }

                }
                else
                {
                    // 19 Jan 2016: Emergency fix as we now prefix cookies
                    var tmpPacket = TriSysWeb.Security.EmergencyCookieMigrationForLive19Jan2016();
                    if (tmpPacket)
                    {
                        sEMailAddress = tmpPacket.EMailAddress;
                        sPassword = tmpPacket.Password;
                    }
                }

                var credentialPacket = {
                    EMailAddress: sEMailAddress,
                    Password: sPassword
                };

                return credentialPacket;
            }
            catch (err)
            {
                // encryption bugs
            }

            return null;
        },

        // TODO: REMOVE AFTER 26 Jan 2016 (ish)
        EmergencyCookieMigrationForLive19Jan2016: function ()
        {
            try
            {
                var CookiePrefix = '';

                var sEMailAddress = TriSysAPI.Cookies.getCookie(CookiePrefix + "Login_EMail");
                var sPassword = TriSysAPI.Cookies.getCookie(CookiePrefix + "Login_Password");

                if (sEMailAddress || sPassword)
                {

                    if (sEMailAddress)
                    {
                        if (sEMailAddress.length > 0)
                        {
                            // Decrypt
                            sEMailAddress = TriSysAPI.Encryption.decrypt(sEMailAddress, TriSysWeb.Security.EncryptionKey);
                        }
                    }

                    if (sPassword)
                    {
                        if (sPassword.length > 0)
                        {
                            // Decrypt
                            sPassword = TriSysAPI.Encryption.decrypt(sPassword, TriSysWeb.Security.EncryptionKey);
                        }
                    }

                }

                var credentialPacket = {
                    EMailAddress: sEMailAddress,
                    Password: sPassword
                };

                return credentialPacket;
            }
            catch (err)
            {
                // encryption bugs
            }

            return null;
        },

        WritePersistedLoginCredentials: function (credentialPacket)     // TriSysWeb.Security.WritePersistedLoginCredentials
        {
            try
            {
                var sEMailAddress = '', sPassword = '';
                if (credentialPacket)
                {
                    sEMailAddress = credentialPacket.EMailAddress;
                    sPassword = credentialPacket.Password;
                }

                var CookiePrefix = TriSysWeb.Constants.Cookie_Prefix;
				if(!CookiePrefix)		// Feb 2019
					CookiePrefix = TriSysApex.Constants.Cookie_Prefix;

                if (sEMailAddress && sPassword)
                {
                    // Encrypt
                    sEMailAddress = TriSysAPI.Encryption.encrypt(sEMailAddress, TriSysWeb.Security.EncryptionKey);
                    sPassword = TriSysAPI.Encryption.encrypt(sPassword, TriSysWeb.Security.EncryptionKey);
                }

                TriSysAPI.Cookies.setCookie(CookiePrefix + "Login_EMail", sEMailAddress);

                var bSavePassword = (TriSysApex.Environment.isLocalhost() || TriSysApex.Environment.isDeployedInTestMode());
                bSavePassword = true;       // Turned on 16 Oct 2015
                if (bSavePassword)
                    TriSysAPI.Cookies.setCookie(CookiePrefix + "Login_Password", sPassword);
            }
            catch (err)
            {
                // encryption bugs
            }
        },

        EncryptionKey: (0 + 1 + 5 - 2 + 3 - 0 * 1)       // 7 also works well
    },
    //#endregion TriSysWeb.Security

    //#region TriSysWeb.TopJobs
    TopJobs:
    {
        // Often called from index.html when application is loaded.
        PopulateWidget: function (sDivTag, iNumberOfJobs)
        {
            var cookieName = "TriSysWeb.TopJobs.PopulateWidget.CSQLDatabaseSearchResults";

            var fnPopulateTopJobs = function (CSQLDatabaseSearchResults)
            {
                if (CSQLDatabaseSearchResults)
                {
                    if (CSQLDatabaseSearchResults.DataTable)
                    {
                        var sJobHTML = '';
                        var dt = CSQLDatabaseSearchResults.DataTable;
                        for (var i = 0; i < dt.length; i++)
                        {
                            var dr = dt[i];
                            var sJobTitle = dr["JobTitle"];
                            var iCounter = dr["Counter"];

                            sJobHTML += '<li class="list-group-item">' +
                                        '<span class="badge">' + iCounter + '</span>' +
                                        sJobTitle +
                                        '</li>';
                        }

                        $('#' + sDivTag).html(sJobHTML);

                        // Cache these for next time
                        TriSysAPI.Persistence.Write(cookieName, CSQLDatabaseSearchResults);
                    }
                }
            };

            if (!TriSysAPI.Session.isConnected())
            {
                // If not connected, then load last loaded data set
                var cachedSearchResults = TriSysAPI.Persistence.Read(cookieName);
                if (cachedSearchResults)
                {
                    fnPopulateTopJobs(cachedSearchResults);
                    return;
                }
            }

            if (!TriSysWeb.Security.IsDataConnectionOpen())
            {
                alert('TriSysWeb.TopJobs: Not connected to API yet - programmer error');
                return;
            }

            var sSQL = TriSysWeb.TopJobs.SQLSelectTop + iNumberOfJobs + TriSysWeb.TopJobs.SQL();

            TriSysSDK.Database.GetDataSet(sSQL, fnPopulateTopJobs);
        },

        SQLSelectTop: "Select Top ",
        SQL: function ()
        {
            return TriSysSDK.Database.SQL.Query("TriSysWeb.TopJobs");
        }
    },
    //#endregion TriSysWeb.TopJobs

    //#region TriSysWeb.Data
    // 
    // This is a convenient server-oriented set of methods to get data from the serve quickly and synchronously.
    // It should be used only for very quick access methods which return quickly, NOT full blown data access transactions.
    //
    Data:
    {
        SynchronousMethod: function (sAPI, dataPacket)
        {
            var payloadObject = {};
            payloadObject.URL = sAPI;
            payloadObject.Asynchronous = false;

            if (dataPacket)
                payloadObject.OutboundDataPacket = dataPacket;

            var objData = null;

            payloadObject.InboundDataFunction = function (data)
            {
                objData = data;
            };

            payloadObject.ErrorHandlerFunction = function (request, status, error)
            {
                //alert('TriSysAPI.Data.SynchronousMethod: ' + status + ": " + error + ". responseText: " + request.responseText);
                // We are not connected, incorrect API, or something has gone wrong
            };

            TriSysAPI.Data.PostToWebAPI(payloadObject);

            return objData;
        },

        Vacancy:    // TriSysWeb.Data.Vacancy
        {
            Summary: function (lRequirementId)
            {
                // Quickly get a vacancy summary from the server for verification purposes
                var dataPacket = { RequirementId: lRequirementId };
                var vacancySummary = TriSysWeb.Data.SynchronousMethod("Vacancy/Summary", dataPacket);
                return vacancySummary;
            },

            isShortlisted: function (lRequirementId)
            {
                var bShortlisted = false;

                if (TriSysWeb.Security.IsCandidateLoggedIn())
                {
                    var dataConnectionKey = TriSysWeb.Security.ClientOrCandidate_CDataConnectionKey();
                    var dataPacket = {
                        RequirementId: lRequirementId,
                        ContactId: dataConnectionKey.LoggedInAgencyContact.ContactId
                    };
                    var CVacancyCandidateShortlistStatusRequestResult = TriSysWeb.Data.SynchronousMethod("Vacancy/CandidateShortlistStatus", dataPacket);
                    if (CVacancyCandidateShortlistStatusRequestResult)
                    {
                        if (CVacancyCandidateShortlistStatusRequestResult.Success)
                            bShortlisted = (CVacancyCandidateShortlistStatusRequestResult.Longlisted || CVacancyCandidateShortlistStatusRequestResult.Shortlisted);
                    }
                }
                return bShortlisted;
            }
        }
    },
    //#endregion TriSysWeb.Data

    //#region TriSysWeb.Utility
    Utility:
    {
        FilePathPrefix: function ()
        {
            var sPrefix = "";
            var sURL = window.location.href.toLowerCase();
            if (sURL.indexOf("/custom/") > 0)
                sPrefix = "../../";

            return sPrefix;
        },

        LoadJavascriptFile: function (sPath)
        {
            var fileref = document.createElement('script');
            fileref.setAttribute("type", "text/javascript");
            fileref.setAttribute("src", TriSysWeb.Utility.FilePathPrefix() + sPath);

            TriSysWeb.Utility.LoadElement(fileref);
        },
        LoadCascadingStyleSheetFile: function (sPath)
        {
            var fileref = document.createElement("link");
            fileref.setAttribute("rel", "stylesheet");
            fileref.setAttribute("type", "text/css");
            fileref.setAttribute("href", TriSysWeb.Utility.FilePathPrefix() + sPath);

            TriSysWeb.Utility.LoadElement(fileref);
        },

        LoadElement: function (elem)
        {
            if (typeof elem != "undefined")
                document.getElementsByTagName("head")[0].appendChild(elem);
        }
    },
    //#endregion TriSysWeb.Utility

    //#region TriSysWeb.Constants
    Constants:
    {
        // The name of the application as it appears in prompts and other dialogues
        // This must also be EXACTLY the same as the record in TriSys CRM to allow users to login)
        ApplicationName: 'TriSys Apex',

        // The version of this application to the nearest minute
        Version: '2014.10.13.1552', // YYYY.MM.DD.hhmm

        // The developer site key allows access to a single server and single database
        DeveloperSiteKey: '20140625-gl51-1231-wher-opuslaboris.',

        // This key is generated by TriSys Business Software to match the TriSys Customer in CRM who is welded to a database and API Key
        AgencyUserLoginCredentialsToCRM: "bb07b8td-30f4-430e-ab52-c15zd1u6c56f",

        // We have our own cookies for each application so that users can have different accounts
        Cookie_Prefix: "",      // TriSys Apex - we do not require this

        // Cookies for favourite vacancies
        Cookie_AddJobDetailsToFavourites: "AddJobDetailsToFavourites",

        // Defaults for candidate apply to vacancies: can be ovewritten by each customer site: only one can be true
        CandidateApplyToVacancy_Longlist: false,
        CandidateApplyToVacancy_Shortlist: true,

        // Default page names
        CandidateVacancyPage: "candidatevacancy.html",
        CandidateVacancySearchPage: "candidatevacancysearch.html",
        ClientVacanciesPage: "clientvacancies.html",
        ClientVacancyPage: "clientvacancy.html",
        FavouriteVacanciesPage: "favouritevacancies.html",
        VacancyApplicationsPage: "vacancyapplications.html",
        WarningPage: "warning.html",
        ContactUsPage: "contactus.html",
        CandidateRegistrationPage: "register.html",
        ClientRegistrationPage: "registerclient.html",
        PlacementPage: "placement.html",
        TimesheetPage: "timesheet.html",
        ContactPage: "contact.html",
        LoginPage: "Login.html",
        UserDashboardPage: "dashboard.html",

        // Login label defaults
        LoggedInPrefixText: '',
        NotLoggedInText: ''

    }
    //#endregion TriSysWeb.Constants

};
