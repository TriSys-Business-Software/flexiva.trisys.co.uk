var CVAutoRecognitionForm =
{
    FormName: "CVAutoRec",
    CurrentDocumentURL: null,
    GridID: 'cvautorecognition-IncomingCVGrid',
    FieldPrefix: 'cvautorecognition-form-',
    DuplicateSelectedCandidateId: 0,

    // Do each file upload separately to allow user to cancel
    MultipleUploadFiles: null,

	_GridInitialised: false,


    Load: function ()
    {
        TriSysApex.Forms.EntityForm.unPopulateFormGrids(CVAutoRecognitionForm.FormName);

        TriSysSDK.EntityFormTabs.AddClickEventHandlers('cvautorecognition-form-tab-nav-horizontal', true);

		TriSysSDK.Controls.Button.Click('cvautorecognition-form-tab-incoming');	       

        TriSysSDK.FormMenus.DrawGridMenu('cvautorecognitionGridMenu', CVAutoRecognitionForm.GridID);

        var suffixes = ['', 'new-', 'existing-'];
        for (var i = 0; i < suffixes.length; i++)
        {
            var suffix = suffixes[i];

            TriSysSDK.CShowForm.contactTitleFieldEditableProperties(CVAutoRecognitionForm.FieldPrefix + suffix + "Title", "Mr");
			TriSysSDK.CShowForm.PopulateGenderCombo(CVAutoRecognitionForm.FieldPrefix + suffix + "Gender");

			TriSysSDK.CShowForm.skillCombo(CVAutoRecognitionForm.FieldPrefix + suffix + 'ContactSource', 'ContactSource', 'TBC');

            // 24 Nov 2020: Bug
			//TriSysSDK.CShowForm.entityTypeMultiSelectCombo('Requirement', CVAutoRecognitionForm.FieldPrefix + suffix + 'TypeOfWorkRequired');
			TriSysSDK.CShowForm.contactTypeOfWorkField(CVAutoRecognitionForm.FieldPrefix + suffix + 'TypeOfWorkRequired');
        }

        
        // Initialize Slider for zooming CV
        CVAutoRecognitionForm.InitialiseZoomSlider('', CVAutoRecognitionForm.ZoomCVViewer);
        CVAutoRecognitionForm.InitialiseZoomSlider('-duplicate', CVAutoRecognitionForm.ZoomCVViewerDuplicate);

        // We do duplicate checking when these values change
        CVAutoRecognitionForm.DataChangeEventHandlers();

        // Job title no-cache 
        if (!TriSysSDK.CShowForm.JobTitlesCached())
        {
            // Capture enter key to do lookup
            $('#cvautorecognition-form-JobTitle').keyup(function (e)
            {
                if (e.keyCode == 13)
                    CVAutoRecognitionForm.JobTitleLookup();
            });
        }

        // Countries
        TriSysWebJobs.CandidateRegistration.LoadCountryLookup("cvautorecognition-form-Country");
        TriSysWebJobs.CandidateRegistration.LoadCountryLookup("cvautorecognition-form-new-Country");
        TriSysWebJobs.CandidateRegistration.LoadCountryLookup("cvautorecognition-form-existing-Country");
    },

    TextFieldList: ['Forenames', 'Surname', 'Street', 'City', 'County', 'PostCode', 'Country',
                            'HomeTelNo', 'WorkTelNo', 'MobileTelNo', 'PersonalEMail', 'WorkEMail', 'DateOfBirth', 'JobTitle'],

    ClearDataEntryFields: function()
    {
        var suffixes = ['', 'new-', 'existing-'];
        for (var is = 0; is < suffixes.length; is++)
        {
            var prefix = CVAutoRecognitionForm.FieldPrefix + suffixes[is];

            for (var i = 0; i < CVAutoRecognitionForm.TextFieldList.length; i++)
            {
                var sField = CVAutoRecognitionForm.TextFieldList[i];
                $('#' + prefix + sField).val('');
            }

            TriSysSDK.CShowForm.SetTextInCombo(prefix + "Title", "Mr");
            //TriSysSDK.CShowForm.SetTextInCombo(prefix + "JobTitle", "-");
            TriSysSDK.CShowForm.SetTextInCombo(prefix + "Gender", "Unknown");
            TriSysSDK.CShowForm.SetTextInCombo(prefix + "ContactSource", "TBC");
            TriSysSDK.CShowForm.SetSkillsInList(prefix + 'TypeOfWorkRequired', null);
            $('#' + prefix + 'ContactPhoto').attr('src', TriSysApex.Constants.DefaultContactImage);

            TriSysSDK.CShowForm.SetTextInCombo(prefix + "Country", TriSysSDK.Countries.DefaultCountryName);
        }
    },

    DataChangeEventHandlers: function()
    {
        var changeDuplicateCheckFields = ['PersonalEMail', 'WorkEMail', 'HomeTelNo', 'WorkTelNo', 'MobileTelNo', 'DateOfBirth', 'JobTitle'];
        var fnChange = function (e)
        {
            sValue = $(this).val();

            // Invoke a duplicate check on this key field
            CVAutoRecognitionForm.FireDuplicateCandidateCheck(CVAutoRecognitionForm.ShowDuplicateCount);
        };

        for (var i = 0; i < changeDuplicateCheckFields.length; i++)
        {
            var sField = changeDuplicateCheckFields[i];
            $('#' + CVAutoRecognitionForm.FieldPrefix + sField).change(fnChange);
        }


        $('#' + CVAutoRecognitionForm.FieldPrefix + 'PostCode').change(function (e)
        {
            sValue = $(this).val();
            //TriSysApex.Toasters.Success(sValue);

            // Lookup post code now after edit
            CVAutoRecognitionForm.PostCodeLookup();
        });
        
        // Synchronise the parse CV with the duplicate fields
        var fnSynchroniseTextField = function ()
        {
            var sID = this.id;
            var sValue = $(this).val();
            sID = sID.replace(CVAutoRecognitionForm.FieldPrefix, CVAutoRecognitionForm.FieldPrefix + 'new-');
            $('#' + sID).val(sValue);
        };

        for (var i = 0; i < CVAutoRecognitionForm.TextFieldList.length; i++)
        {
            var sField = CVAutoRecognitionForm.TextFieldList[i];
            $('#' + CVAutoRecognitionForm.FieldPrefix + sField).on("change", fnSynchroniseTextField);
            $('#' + CVAutoRecognitionForm.FieldPrefix + sField).on("drop", fnSynchroniseTextField);
        }

		var synchroniseComboFieldList = ['Title', 'Gender', 'ContactSource'];
        var fnSynchroniseComboField = function ()
        {
            var sID = this.id;
            var sValue = TriSysSDK.CShowForm.GetTextFromCombo(sID);
            sID = sID.replace(CVAutoRecognitionForm.FieldPrefix, CVAutoRecognitionForm.FieldPrefix + 'new-');
            TriSysSDK.CShowForm.SetTextInCombo(sID, sValue);
        };

        for (var i = 0; i < synchroniseComboFieldList.length; i++)
        {
            var sField = synchroniseComboFieldList[i];
            $('#' + CVAutoRecognitionForm.FieldPrefix + sField).on("change", fnSynchroniseComboField);
        }
        
        var fnSynchroniseMultiSelectField = function ()
        {
            var sID = this.id;
            var sValue = TriSysSDK.CShowForm.GetSelectedSkillsFromList(sID);
            sID = sID.replace(CVAutoRecognitionForm.FieldPrefix, CVAutoRecognitionForm.FieldPrefix + 'new-');
            TriSysSDK.CShowForm.SetSkillsInList(sID, sValue);
        };
        $('#' + CVAutoRecognitionForm.FieldPrefix + "TypeOfWorkRequired").on("change", fnSynchroniseMultiSelectField);


    },

    // Tried to get dynamic drag/drop events to work, but JQuery is simply not very good at this!
    DropPostCode: function(ev)
    {
        ev.preventDefault();
        var sValue = ev.dataTransfer.getData("text").trim();
        $('#' + CVAutoRecognitionForm.FieldPrefix + 'PostCode').val(sValue);

        // Lookup post code now after drag/drop
        CVAutoRecognitionForm.PostCodeLookup();
    },

    DropStreet: function(ev)
    {
        ev.preventDefault();
        var sValue = ev.dataTransfer.getData("text").trim();

        // If text contains newlines or comma's, then try to separate into a full address
        if(CVAutoRecognitionForm.AllocateAddressParts(sValue, '\n'))
            return;

        if(CVAutoRecognitionForm.AllocateAddressParts(sValue, ','))
            return;

        $('#' + CVAutoRecognitionForm.FieldPrefix + 'Street').val(sValue);
    },

    AllocateAddressParts: function(sValue, sChars)
    {
        if (!sValue)
            return;

        if (sValue.indexOf(sChars) < 0)
            return;

        var parts = sValue.split(sChars);

        if (parts && parts.length > 0)
        {
            if (parts.length > 0)
                CVAutoRecognitionForm.AllocateAddressPart('Street', parts[0]);
            if (parts.length > 1)
                CVAutoRecognitionForm.AllocateAddressPart('City', parts[1]);
            if (parts.length > 2)
                CVAutoRecognitionForm.AllocateAddressPart('County', parts[2]);
            if (parts.length > 3)
                CVAutoRecognitionForm.AllocateAddressPart('PostCode', parts[3]);
            if (parts.length > 4)
                CVAutoRecognitionForm.AllocateAddressPart('Country', parts[4]);

            // Trigger a change event after setting all address fields
            $('#' + CVAutoRecognitionForm.FieldPrefix + "Street").trigger('change');

            return true;
        }
    },

    AllocateAddressPart: function(sField, sValue)
    {
        sValue = sValue.trim();

        if (sValue.indexOf(",") == (sValue.length - 1))
            sValue = sValue.substring(0, sValue.indexOf(","));

        if (sValue.indexOf(".") == (sValue.length - 1))
            sValue = sValue.substring(0, sValue.indexOf("."));

        $('#' + CVAutoRecognitionForm.FieldPrefix + sField).val(sValue);

        // Manually trigger a change event because JQuery is too f***ing thick to do this for us!
        //$('#' + CVAutoRecognitionForm.FieldPrefix + sField).trigger('change');
    },

    PostCodeLookup: function()
    {
        TriSysSDK.PostCode.Lookup(CVAutoRecognitionForm.FieldPrefix + 'PostCode',
                                  CVAutoRecognitionForm.FieldPrefix + 'Street',
                                  CVAutoRecognitionForm.FieldPrefix + 'City',
                                  CVAutoRecognitionForm.FieldPrefix + 'County',
                                  CVAutoRecognitionForm.FieldPrefix + 'Country',
                                  { InternalDatabaseOnly: true });
    },

    // For paragraphs with draggable="true", they need to start a drag operation
    StartDrag: function(ev)
    {
        ev.dataTransfer.setData("Text", ev.target.id);
    },

    AllowDragDrop: function(ev)
    {
        ev.preventDefault();
    },

    // Drag/drop duplicate check fields
    DropDuplicateCheckField: function(ev, sField)
    {
        ev.preventDefault();
        var sValue = ev.dataTransfer.getData("text").trim();

        // Remove additional stuff which we know is irrelevant
        var wordsToRemove = ['mailto:', 'tel:'];

        for (var i = 0; i < wordsToRemove.length; i++)
        {
            var sWordToRemove = wordsToRemove[i];
            sValue = sValue.replace(sWordToRemove, "");
        }

        $('#' + CVAutoRecognitionForm.FieldPrefix + sField).val(sValue);
        //TriSysApex.Toasters.Success(sField + "=" + sValue);

        // Do validation to see whether we should invoke a duplicate check on the fly        
        CVAutoRecognitionForm.FireDuplicateCandidateCheck(CVAutoRecognitionForm.ShowDuplicateCount);
    },

    ShowDuplicateCount: function (candidates)
	{
		CVAutoRecognitionForm._DuplicateCount = 0;
		var iCount = '';

		if (candidates)
		{
			iCount = candidates.length;
			CVAutoRecognitionForm._DuplicateCount = iCount;
		}

        $('#cvautorecognition-view-duplicate-candidate-count').html(iCount);
    },
	_DuplicateCount: 0,

    ClearDuplicateCount: function()
    {
        CVAutoRecognitionForm.ShowDuplicateCount(null);
    },

    // Prevent duplicate calls at the same time
    _Calling_CandidateDuplicateWebAPI: false,

    // Call the Web API now to determine the duplicates.
    // Allow caller to either display a counter or popup to choose.
    CandidateDuplicateWebAPICall: function (duplicateCheck, fnCallback)
    {
        if (CVAutoRecognitionForm._Calling_CandidateDuplicateWebAPI)
            return;

        var payloadObject = {};

        // Call the API to submit the data to the server
        payloadObject.URL = "Contact/DuplicateCheck";

        payloadObject.OutboundDataPacket = duplicateCheck;

        payloadObject.InboundDataFunction = function (data)
        {
            TriSysApex.UI.HideWait();

            var CDuplicateCheckResponse = data;

            if (CDuplicateCheckResponse)
            {
                if (CDuplicateCheckResponse.Success || true)
                {
                    fnCallback(CDuplicateCheckResponse.Candidates);

                    return;
                }
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('CVAutoRecognitionForm.CandidateDuplicateWebAPICall: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Checking Duplicates...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

	RefreshIncomingCVGrid: function()
	{
		TriSysSDK.Grid.RefreshData(CVAutoRecognitionForm.GridID);
	},

    PopulateIncomingCVGrid: function(fnCallback)
    {
        // Call web service to get the list of all incoming CV's
        var payloadObject = {};

        // Call the API to submit the data to the server
        payloadObject.URL = "CVParser/IncomingCVList";

        payloadObject.OutboundDataPacket = null;

        payloadObject.InboundDataFunction = function (data)
        {
			//TriSysApex.UI.HideWait();

            var CIncomingCVListResponse = data;

            if (CIncomingCVListResponse)
            {
                if (CIncomingCVListResponse.Success)
                {
    				fnCallback(CIncomingCVListResponse.IncomingCVList);
                }
                else
				{
                    TriSysApex.UI.ShowMessage(CIncomingCVListResponse.ErrorMessage);
				}
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
			//TriSysApex.UI.HideWait();
			TriSysApex.UI.errorAlert('CVAutoRecognitionForm.PopulateIncomingCVGrid: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

		//TriSysApex.UI.ShowWait(null, "Reading Incoming CV's...");

        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    InitialiseIncomingCVsGrid: function ()
    {
        var columns = [
                { field: "FullPath", title: "Full Path", type: "string", hidden: true },
                { field: "Name", title: "CV Document", type: "string" },
                { field: "DateModified", title: "Date Last Modified", type: "date", format: "{0:dd MMM yyyy}", width: 150 },
                { field: "Size", title: "Size", type: "string", width: 130 }
        ];

		// 20 Feb 2019: Allow grid menu refresh item and grid footer refresh button call us back when user wishes to
		// refresh the grid with live data 
		var fnCallbackOnRefresh = function(fnCallback)
		{
			CVAutoRecognitionForm.PopulateIncomingCVGrid(fnCallback);
		};

        TriSysSDK.Grid.VirtualMode({
            Div: CVAutoRecognitionForm.GridID,
            ID: "grdCVAutoRecognition",
            Title: "CV Auto-Recognition Documents",
            RecordsPerPage: TriSysApex.UserOptions.RecordsPerPage(),
            //PopulationByObject: incomingCVs,
			PopulationByObjectRefreshCallback: fnCallbackOnRefresh,
            Columns: columns,
            MobileVisibleColumns: [
                        { field: "FullPath" }
            ],
            MobileRowTemplate: '<td colspan="1"><strong>#: FullPath #</strong><br />' +
                            '<i>#: DateModified #</i></td>',

            KeyColumnName: "FullPath",
            DrillDownFunction: function (rowData)
            {
                TriSysApex.UI.CloseModalPopup();
                CVAutoRecognitionForm.DisplayAndParseCV(rowData.FullPath, rowData.Name);
            },
            MultiRowSelect: true,
            Grouping: false,
            ColumnFilters: true,
            OpenButtonCaption: "Import",
            HyperlinkedColumns: ["Name"]        // New Jan 2021
        });

		// Let the grid accept file drag and drop. Fired AFTER populating grid!	
        CVAutoRecognitionForm.DragAndDropFileHandler();
    },

    DragAndDropFileHandler: function()
    {
        // Our own file upload handler
        var obj = $("#" + CVAutoRecognitionForm.GridID);

        obj.on('dragenter', function (e)
        {
            e.stopPropagation();
            e.preventDefault();
        });

        obj.on('dragover', function (e)
        {
            e.stopPropagation();
            e.preventDefault();
        });

        obj.on('drop', function (e)
        {
            e.preventDefault();

            // Set our stack ready for processing
            var fileCollection = e.originalEvent.dataTransfer.files;

            // Turn it into an array we can manipulate
            CVAutoRecognitionForm.MultipleUploadFiles = [];
            for (var i = 0; i < fileCollection.length; i++)
            {
                CVAutoRecognitionForm.MultipleUploadFiles.push(fileCollection[i]);
            }

            // Begin processing the stack
            CVAutoRecognitionForm.UploadNextCVInSequence();
        });
    },

    RemoteCVProcessing: function(file)
    {
        CVAutoRecognitionForm.MultipleUploadFiles = [file];
        CVAutoRecognitionForm.UploadNextCVInSequence();
    },

    // When uploading multiple files, do these in sequence so that we can report progress but also allow the
    // user to quit if necessary.
    UploadNextCVInSequence: function()
    {
        if (!CVAutoRecognitionForm.MultipleUploadFiles)
            return false;       // No more files to do in queue

        if (CVAutoRecognitionForm.MultipleUploadFiles.length == 0)
        {
            CVAutoRecognitionForm.MultipleUploadFiles = null;
            return false;
        }

        // Pop next file off the stack
        var nextFile = CVAutoRecognitionForm.MultipleUploadFiles[0];

        // The callback when the file has been uploaded
        var fnCallback = function (myFile)
        {
            CVAutoRecognitionForm.UploadCV(myFile);
        };

        // Upload the file through the standard route
        TriSysSDK.Controls.FileManager.UploadFile(nextFile, fnCallback);

        // Remove first element after processing
        CVAutoRecognitionForm.MultipleUploadFiles.splice(0,1);

        return true;
    },

    // Called when the user has chosen a CV to process form the grid, or has dragged a CV into the grid.
    // We do two things asynchronously via the Web API:
    // 1. Kick off the CV auto-recognition process which can take up to 30 seconds if a 3rd party parser used
    // 2. Convert the server side document URL into an HTML rendered URL to allow easy display and drag/drop
    //
    DisplayAndParseCV: function (sURL, sName)
    {
        TriSysApex.Logging.LogMessage("CVAutoRecognitionForm: DisplayAndParseCV(" + sURL + ", " + sName + ")");

        CVAutoRecognitionForm.CurrentDocumentURL = sURL;
        CVAutoRecognitionForm.DuplicateSelectedCandidateId = 0;
        CVAutoRecognitionForm.ClearDuplicateCount();

        // Kick off the CV parser
        CVAutoRecognitionForm.CommenceCVParsing(sURL, sName);

        // Clear all fields from last parse
        CVAutoRecognitionForm.ClearDataEntryFields();

        // Show the document name and select correct tab 
        $('#cvautorecognition-parsing-document-name').html(sName);
        $('#cvautorecognition-parsing-document-name-duplicate').html(sName);
        $('#cvautorecognitionForm-form-tab-panel-parse-hyperlink').trigger('click');

        // Let use know we are working on getting the chosen document ready to view
        var sDiv = 'cvautorecognition-document-viewer-converted-contents';

        // Let user watch an animation whilst we get the file from the API
        CVAutoRecognitionForm.WaitingProgressSpinner(true);

        // Is this a word document?
        var bUsePDFconverter = false;       // Switch to true when Aspose conversion workd correctly
        var bConvert = TriSysSDK.Controls.FileManager.isWordFile(sURL) || (bUsePDFconverter && TriSysSDK.Controls.FileManager.isPDFFile(sURL));
        if (!bConvert)
        {
            // Deal with PDF's etc..
            CVAutoRecognitionForm.DisplayNonWordDocumentInViewer(sURL);
            return false;
        }


        // Get the HTML friendly document from the Web API as a URL so that we can local into this scrollable DIV
        var CFileReferenceInternalToExternalPathRequest = {
            FolderFilePath: sURL
        }

        var payloadObject = {};
        payloadObject.URL = "Files/ConvertFileReferenceInternalToExternalPath";
        payloadObject.OutboundDataPacket = CFileReferenceInternalToExternalPathRequest;
        payloadObject.InboundDataFunction = function (data)
        {
            if (data)
            {
                if (data.Success)
                {
                    // Load the full document into this DIV
                    var sFileURL = data.URL;

                    CVAutoRecognitionForm.LoadHTMLDocumentURLIntoDiv(sDiv, sFileURL);
                    CVAutoRecognitionForm.LoadHTMLDocumentURLIntoDiv(sDiv + '-duplicate', sFileURL );
                }
                else
                    TriSysApex.UI.errorAlert(data.ErrorMessage, TriSysWeb.Constants.ApplicationName);
            }
            else
                TriSysApex.UI.ShowMessage("No response from " + payloadObject.URL, TriSysWeb.Constants.ApplicationName);

            return true;
        };
        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            // Can occur when user gets impatient waiting for photo to load and navigates away
            TriSysApex.UI.ErrorHandlerRedirector('CVAutoRecognitionForm.DisplayAndParseCV: ', request, status, error, false);
        };
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    // Send CV off to be parsed in a separate thread to allow us to crack on displaying the CV to the user.
    // We do this silently and do not display any errors because it is a subtle process designed to help
    // the user, not hinder her.
    CommenceCVParsing: function (sCVFileRef, sName)
    {
        var CParseServerCVRequest = {

            CVFileRef: sCVFileRef
        };

        var payloadObject = {};
        payloadObject.URL = "CVParser/ParseServerCV";
        payloadObject.OutboundDataPacket = CParseServerCVRequest;
        payloadObject.InboundDataFunction = function (CParseServerCVResponse)
        {
            if (CParseServerCVResponse)
            {
                if (CParseServerCVResponse.Success)
                {
                    if(CParseServerCVResponse.Demographics)
                    {
                        // Prevent the first call from being superceded by field events
                        CVAutoRecognitionForm._Calling_CandidateDuplicateWebAPI = true;

                        // Display the raw recognised fields
                        var demographics = CParseServerCVResponse.Demographics;
                        $('#' + CVAutoRecognitionForm.FieldPrefix + "Forenames").val(demographics.Forenames);
                        $('#' + CVAutoRecognitionForm.FieldPrefix + "Surname").val(demographics.Surname);
                        $('#' + CVAutoRecognitionForm.FieldPrefix + "MobileTelNo").val(demographics.MobileTelNo);
                        $('#' + CVAutoRecognitionForm.FieldPrefix + "WorkTelNo").val(demographics.WorkTelNo);
                        $('#' + CVAutoRecognitionForm.FieldPrefix + "PersonalEMail").val(demographics.EMail);
                        $('#' + CVAutoRecognitionForm.FieldPrefix + "Street").val(demographics.AddressStreet);
                        $('#' + CVAutoRecognitionForm.FieldPrefix + "City").val(demographics.AddressCity);
                        $('#' + CVAutoRecognitionForm.FieldPrefix + "County").val(demographics.AddressCounty);
                        $('#' + CVAutoRecognitionForm.FieldPrefix + "PostCode").val(demographics.AddressPostCode);
                        TriSysSDK.CShowForm.SetTextInCombo(CVAutoRecognitionForm.FieldPrefix + "Country", (demographics.AddressCountry ? demographics.AddressCountry : TriSysSDK.Countries.DefaultCountryName));
                        $('#' + CVAutoRecognitionForm.FieldPrefix + "HomeTelNo").val(demographics.HomeTelNo);
                        $('#' + CVAutoRecognitionForm.FieldPrefix + "JobTitle").val(demographics.JobTitle);

                        if(demographics.DateOfBirth)
                        {
                            var dtDoB = moment(demographics.DateOfBirth).format('DD MMM YYYY');
							if(dtDoB)
							{
								if(dtDoB.indexOf('0001') < 0)
									$('#' + CVAutoRecognitionForm.FieldPrefix + "DateOfBirth").val(dtDoB);
							}
                        }
                        
                        // Use a bit of additional intelligence to utilise the tools we have available
                        var bMultiPartAddress = false;
                        if (demographics.AddressStreet)
                            bMultiPartAddress = (demographics.AddressStreet.indexOf(",") > 0);

                        var bPostCodeLookup = demographics.AddressPostCode && !bMultiPartAddress;
                        if(bPostCodeLookup)
                            CVAutoRecognitionForm.PostCodeLookup();
                        else
                        {
							if (demographics.AddressStreet)
							{
								if (demographics.AddressStreet.indexOf(",") > 0 && !demographics.AddressCity)
									CVAutoRecognitionForm.AllocateAddressParts(demographics.AddressStreet, ',');
							}
						}

						if (demographics.Gender)
							TriSysSDK.CShowForm.SetTextInCombo(CVAutoRecognitionForm.FieldPrefix + "Gender", demographics.Gender);

						if (demographics.Title)
							TriSysSDK.CShowForm.SetTextInCombo(CVAutoRecognitionForm.FieldPrefix + "Title", demographics.Title);

						if (demographics.TypeOfWork)
							TriSysSDK.CShowForm.SetSkillsInList(CVAutoRecognitionForm.FieldPrefix + 'TypeOfWorkRequired', demographics.TypeOfWork);

						var nationality = CVAutoRecognitionForm.FieldPrefix + 'nationality-tr';
						$('#' + nationality).hide();
						if (demographics.Nationality) {
							$('#' + nationality).show();
							nationality = CVAutoRecognitionForm.FieldPrefix + 'Nationality';
							$('#' + nationality).val(demographics.Nationality);
						}

						var social = CVAutoRecognitionForm.FieldPrefix + 'linkedin-tr';
						$('#' + social).hide();
						if (demographics.LinkedIn)
						{
							$('#' + social).show();
							social = CVAutoRecognitionForm.FieldPrefix + 'LinkedIn';
							$('#' + social).val(demographics.LinkedIn);
						}

						social = CVAutoRecognitionForm.FieldPrefix + 'twitter-tr';
						$('#' + social).hide();
						if (demographics.Twitter) {
							$('#' + social).show();
							social = CVAutoRecognitionForm.FieldPrefix + 'Twitter';
							$('#' + social).val(demographics.Twitter);
						}

						social = CVAutoRecognitionForm.FieldPrefix + 'facebook-tr';
						$('#' + social).hide();
						if (demographics.Facebook) {
							$('#' + social).show();
							social = CVAutoRecognitionForm.FieldPrefix + 'Facebook';
							$('#' + social).val(demographics.Facebook);
						}

						social = CVAutoRecognitionForm.FieldPrefix + 'skype-tr';
						$('#' + social).hide();
						if (demographics.Skype) {
							$('#' + social).show();
							social = CVAutoRecognitionForm.FieldPrefix + 'Skype';
							$('#' + social).val(demographics.Skype);
						}

						social = CVAutoRecognitionForm.FieldPrefix + 'youtube-tr';
						$('#' + social).hide();
						if (demographics.YouTube) {
							$('#' + social).show();
							social = CVAutoRecognitionForm.FieldPrefix + 'YouTube';
							$('#' + social).val(demographics.YouTube);
						}

						social = CVAutoRecognitionForm.FieldPrefix + 'blog-tr';
						$('#' + social).hide();
						if (demographics.Blog) {
							$('#' + social).show();
							social = CVAutoRecognitionForm.FieldPrefix + 'Blog';
							$('#' + social).val(demographics.Blog);
						}

						social = CVAutoRecognitionForm.FieldPrefix + 'website-tr';
						$('#' + social).hide();
						if (demographics.WebSite) {
							$('#' + social).show();
							social = CVAutoRecognitionForm.FieldPrefix + 'WebSite';
							$('#' + social).val(demographics.WebSite);
						}


                        // 10 Jun 2022: Relocated code to here to postpone duplicate check until after all fields are populated
                        
                        // Fire the duplicate check only after post code lookup etc.. has completed
						var fnFireDuplicateCheck = function()
						{
						    // Manually trigger a change event which will cause a duplicate check
						    for (var i = 0; i < CVAutoRecognitionForm.TextFieldList.length; i++)
						    {
						        var sField = CVAutoRecognitionForm.TextFieldList[i];

						        // This does more that trigger duplicate check, as it actually synchronises the two sets of fields on separate tabs
						        $('#' + CVAutoRecognitionForm.FieldPrefix + sField).trigger('change');
						    }

						    CVAutoRecognitionForm._Calling_CandidateDuplicateWebAPI = false;
						    CVAutoRecognitionForm.FireDuplicateCandidateCheck(CVAutoRecognitionForm.ShowDuplicateCount);
						};
						setTimeout(fnFireDuplicateCheck, 2000);
					}                    
                }                
            }

            return true;
        };
        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            // Can occur when user gets impatient waiting for photo to load and navigates away
            TriSysApex.UI.ErrorHandlerRedirector('CVAutoRecognitionForm.CommenceCVParsing: ', request, status, error, false);
        };
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    LoadHTMLDocumentURLIntoDiv: function (sDiv, sFileURL)
    {
        $('#' + sDiv).load(sFileURL, function (response, status, xhr)
        {
            CVAutoRecognitionForm.WaitingProgressSpinner(false, true);

            if (status == "error")
            {
                var msg = "Document Conversion Error: ";
                TriSysApex.UI.ShowError(null, msg + xhr.status + " " + xhr.statusText);
                return;
            }

            // This works nicely and helps drag/drop, but unfortunately the HTML <span> tags
            // break up the phone numbers into separate tags, making drag/drop even more painful ;-(
            //CVAutoRecognitionForm.ReplaceTagsForDragDrop(sDiv);
        });
    },

    // Enumerate through DOM for specified DIV and make all <span> tags
    // draggable with their text set in the HTML5 drop target data
    // replace: <span style="font-family:'Bosis for Agfa Light'; font-size:10pt">Colin Derr</span>
    // with: <span style="font-family:'Bosis for Agfa Light'; font-size:10pt" draggable="true" ondragstart="event.dataTransfer.setData('text','You Got It!');">Colin Derr</span>
    //
    ReplaceTagsForDragDrop: function(sDiv)
    {
        $("#" + sDiv + " span").each(function (index, elem)
        {
            var sText = $(this).text();
            if (sText)
            {
                $(this).attr('draggable', "true");
                var sOnDragStartEvent = "event.dataTransfer.setData('text','" + sText + "');";
                $(this).attr('ondragstart', sOnDragStartEvent);
            }
        });
    },

    WaitingProgressSpinner: function(bVisible, bConvertedWordDocument, bPDFDocument)
    {
        var sConvertedDiv = 'cvautorecognition-document-viewer-converted-contents';
        var pdfViewer = 'cvautorecognition-document-viewer-pdf-viewer';
        var sWaitingDiv = 'cvautorecognition-document-viewer-waiting';
        var sSliderDiv = 'cvautorecognition-document-viewer-zoom';
        var sDuplicateSuffix = '-duplicate';

        if (bVisible)
        {
            // Let user watch an animation whilst we get the file from the API
            $('#' + sConvertedDiv).hide();
            $('#' + sConvertedDiv + sDuplicateSuffix).hide();
            $('#' + pdfViewer).hide();
            $('#' + pdfViewer + sDuplicateSuffix).hide();
            $('#' + sWaitingDiv).show();
            $('#' + sSliderDiv).hide();
            $('#' + sSliderDiv + sDuplicateSuffix).hide();

            setTimeout(TriSysProUI.kendoUI_Overrides, 50);
        }
        else
        {
            $('#' + sWaitingDiv).hide();
            $('#' + sSliderDiv).hide();
            $('#' + sSliderDiv + sDuplicateSuffix).hide();

            if (bConvertedWordDocument)
            {
                $('#' + sConvertedDiv).show();
                $('#' + sSliderDiv).show();
                $('#' + sConvertedDiv + sDuplicateSuffix).show();
                $('#' + sSliderDiv + sDuplicateSuffix).show();
            }
            else if (bPDFDocument)
            {
                $('#' + pdfViewer).show();
                $('#' + pdfViewer + sDuplicateSuffix).show();
            }
        }
    },

    DisplayNonWordDocumentInViewer: function (sURL)
    {
        if (TriSysSDK.Controls.FileManager.isPDFFile(sURL))
        {
            var pdfViewer = 'cvautorecognition-document-viewer-pdf-viewer';

            var fnCallback = function (sFileURL)
            {
                CVAutoRecognitionForm.WaitingProgressSpinner(false, false, true);

                var pdfViewerObject = $('#' + pdfViewer);

                // It cannot be 100% resized
                pdfViewerObject.css("width", CVAutoRecognitionForm.GetViewerAndSliderWidth(false, ''));

                // Bug in PDF viewer https://code.google.com/p/chromium/issues/detail?id=569888

                var sFilePathToSet = sFileURL;  //   "https://bitcoin.org/bitcoin.pdf";

                sFilePathToSet += TriSysApex.FormsManager.pageURLTimestampArgumentsToForceNoCache();

                pdfViewerObject.removeAttr('data');
                pdfViewerObject.attr('data', sFilePathToSet);

                // Because this does not show, delete it and recreate it!

                // Clone the object
                pdfViewerObject.clone().appendTo('#cvautorecognition-cv-viewer-block');
                pdfViewerObject.remove();
                var pdfViewerObject = $('#' + pdfViewer);
                pdfViewerObject.attr('data', sFilePathToSet);

                // Same for duplicate
                var pdfViewerObjectDuplicate = $('#' + pdfViewer + '-duplicate');
                pdfViewerObjectDuplicate.css("width", CVAutoRecognitionForm.GetViewerAndSliderWidth(false, '-duplicate'));
                pdfViewerObjectDuplicate.attr('data', sFilePathToSet);

                // Clone the object
                pdfViewerObjectDuplicate.clone().appendTo('#cvautorecognition-cv-viewer-block');
                pdfViewerObjectDuplicate.remove();
                var pdfViewerObjectDuplicate = $('#' + pdfViewer + '-duplicate');
                pdfViewerObjectDuplicate.attr('data', sFilePathToSet);
            };

            TriSysSDK.Controls.FileManager.GetFileReferenceServerFilePathToExternalFilePath(sURL, fnCallback);
        }
    },

    // Some components need explicit widths i.e. they cannot use 100%
    GetViewerAndSliderWidth: function(bReduceFactorise, sSuffix)
    {
        var iWidth = $('#cvautorecognition-cv-viewer-block' +sSuffix).width();

        if (bReduceFactorise)
            iWidth -= 70;

        return iWidth;
    },

	
    TabButtonCallback: function (sTabID)
    {
        switch (sTabID)
        {
            case 'cvautorecognition-form-panel-incoming':

				if(!CVAutoRecognitionForm._GridInitialised)
				{
					CVAutoRecognitionForm.InitialiseIncomingCVsGrid();
					CVAutoRecognitionForm._GridInitialised = true;
					return;
				}

                if (TriSysApex.Forms.EntityForm.isGridPopulated(CVAutoRecognitionForm.FormName, sTabID))
                    return;

                CVAutoRecognitionForm.RefreshIncomingCVGrid();
                break;

            case 'cvautorecognition-form-panel-parse':

                var slider = $("#cvautorecognition-form-slider").getKendoSlider();
                slider.wrapper.css("width", CVAutoRecognitionForm.GetViewerAndSliderWidth(false, ''));
                slider.resize();

                if (!CVAutoRecognitionForm.CurrentDocumentURL)
                {
                    // If no document selected, do not allow this tab to be selected
                    setTimeout(function ()
                    {
                        $('#cvautorecognitionForm-form-tab-panel-incoming-hyperlink').trigger('click');
                    }, 100);
                    return;
                }
               
                break;

            case 'cvautorecognition-form-panel-duplicate':

                if (!CVAutoRecognitionForm.CurrentDocumentURL)
                {
                    // If no document selected, do not allow this tab to be selected
                    setTimeout(function ()
                    {
                        $('#cvautorecognitionForm-form-tab-panel-incoming-hyperlink').trigger('click');
                    }, 100);
                    return;
                }
                
                if (CVAutoRecognitionForm.DuplicateSelectedCandidateId == 0)
                {
                    // User must identify a duplicate first
                    setTimeout(function ()
                    {
                        $('#cvautorecognitionForm-form-tab-panel-parse-hyperlink').trigger('click');
                    }, 100);
                    TriSysApex.Toasters.Error("Please choose a duplicate candidate.");
                    return;
                }

                setTimeout(function ()
                {
                    var iViewerAndSliderWidth = CVAutoRecognitionForm.GetViewerAndSliderWidth(false, '-duplicate');
                    pdfViewerObject = $('#cvautorecognition-document-viewer-pdf-viewer-duplicate');
                    pdfViewerObject.css("width", iViewerAndSliderWidth);

                }, 100);

                var iViewerAndSliderWidth = CVAutoRecognitionForm.GetViewerAndSliderWidth(false, '-duplicate');
                var slider = $("#cvautorecognition-form-slider-duplicate").getKendoSlider();
                slider.wrapper.css("width", iViewerAndSliderWidth);
                slider.resize();

                break;
        }
    },
    
    AddGridCV: function()
    {
        // Popup file selection dialogue to upload a CV or to choose one from a cloud storage service e.g. dropbox
        TriSysSDK.Controls.FileManager.FindFileUpload("Upload CV Document", CVAutoRecognitionForm.UploadCV);
    },

    // When the user chooses a file to upload, start processing it now
    UploadCV: function(sFilePath)
    {
        // Call Web API to move this temporary file into the g:\Incoming CVs folder and return this path to us
        // so that we can:
        // a. Refresh the grid
        // b. Start processing this file immediately
        var payloadObject = {};

        payloadObject.URL = "Files/MoveUploadedFileReferenceDocument";

        payloadObject.OutboundDataPacket = {
            UploadedFilePath: sFilePath,
            SubFolder: "Incoming CVs"
        };

        payloadObject.InboundDataFunction = function (data)
        {
            TriSysApex.UI.HideWait();
            var JSONdataset = data;

            if (JSONdataset)
            {
                if (JSONdataset.Success)
                {
                    var sFilePath = JSONdataset.FolderFilePath;

                    // Do we have more files to upload in this sequence?
                    if (!CVAutoRecognitionForm.UploadNextCVInSequence())
                    {
                        // Refresh grid
                        CVAutoRecognitionForm.RefreshIncomingCVGrid();

                        // Process: Convert & Parse
                        var sName = TriSysSDK.Controls.FileManager.GetFileNameFromPath(sFilePath);
                        CVAutoRecognitionForm.DisplayAndParseCV(sFilePath, sName);
                    }
                }
                else
                {
                    TriSysApex.UI.errorAlert(JSONdataset.ErrorMessage);
                }
            } else
            {
                // Something else has gone wrong!
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.ErrorHandlerRedirector('CVAutoRecognitionForm.UploadCV: ', request, status, error);
        };

        var sName = TriSysSDK.Controls.FileManager.GetFileNameFromPath(sFilePath);
        TriSysApex.UI.ShowWait(null, "Copying " + sName + "...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    ImportGridCV: function()
    {
        // Get single selected CV and parse/view
        var sFullPath = TriSysSDK.Grid.GetSelectedSingletonRowRecordIdFromGrid(CVAutoRecognitionForm.GridID, "FullPath", "incoming CV");
        if(sFullPath)
        {
            var sName = TriSysSDK.Grid.GetSelectedSingletonRowRecordIdFromGrid(CVAutoRecognitionForm.GridID, "Name", "incoming CV");
            CVAutoRecognitionForm.DisplayAndParseCV(sFullPath, sName);
        }
    },

    DeleteGridCV: function()
    {
        // Get one or more selected CV's and delete it and refresh grid
        var lstFiles = TriSysSDK.Grid.GetSelectedMultipleRowsFromGrid(CVAutoRecognitionForm.GridID, "FullPath");
        if (lstFiles)
        {
            for (var i = 0; i < lstFiles.length; i++)
            {
                var sFilePath = lstFiles[i];

                CVAutoRecognitionForm.DeleteCV(sFilePath);
            }
        }
        else
            TriSysApex.UI.ShowMessage("Please select one or more CV documents.");
    },

    DeleteCV: function (sFilePath)
    {
        // Send to Web API to delete these files
        var payloadObject = {};

        payloadObject.URL = "Files/DeleteFile";

        var CDeleteFileRequest = {
            FilePath: sFilePath
        };

        payloadObject.OutboundDataPacket = CDeleteFileRequest;

        payloadObject.InboundDataFunction = function (data)
        {
            TriSysApex.UI.HideWait();
            var CDeleteFileResponse = data;

            if (CDeleteFileResponse)
            {
                if (CDeleteFileResponse.Success)
                {
                    // Refresh grid
                    CVAutoRecognitionForm.RefreshIncomingCVGrid();
                }
                else
                {
                    TriSysApex.UI.errorAlert(CDeleteFileResponse.ErrorMessage);
                }
            } else
            {
                // Something else has gone wrong!
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.ErrorHandlerRedirector('CVAutoRecognitionForm.DeleteCV: ', request, status, error);
        };

        var sName = TriSysSDK.Controls.FileManager.GetFileNameFromPath(sFilePath);
        TriSysApex.UI.ShowWait(null, "Deleting " + sName + "...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    OpenViewCV: function()
    {
        if (!CVAutoRecognitionForm.CurrentDocumentURL)
            return;

		// Sep 2018 and we have live editing of word documents!
		TriSysApex.Pages.FileManagerForm.FileOpenDrillDown(CVAutoRecognitionForm.CurrentDocumentURL);
		return;

		// LEGACY PRE SEP 2018 where we had to convert docx into HTML

        // Download and open this CV document

        // For word documents, we are showing the converted document as an HTML, so we need
        // to make it available for download in it's original form
        var fnCallback = function (sTitle, sURL, sName)
        {
            TriSysApex.ModalDialogue.DocumentViewer.DownloadAndOpen(sTitle, sURL);
        };

        var sTitle = $('#cvautorecognition-parsing-document-name').html();
        var sName = sTitle;
        TriSysSDK.Controls.FileManager.GetOpenFileURLFromWebServiceWithCallback(sTitle, CVAutoRecognitionForm.CurrentDocumentURL, sName, true, fnCallback);
    },

    DeleteViewCV: function()
    {
        if (!CVAutoRecognitionForm.CurrentDocumentURL)
            return;

        CVAutoRecognitionForm.DeleteCV(CVAutoRecognitionForm.CurrentDocumentURL);

        $('#cvautorecognition-parsing-document-name').html('&nbsp;');
        $('#cvautorecognition-parsing-document-name-duplicate').html('&nbsp;');
        TriSysApex.Forms.EntityForm.unPopulateFormGrids(CVAutoRecognitionForm.FormName);
        $('#cvautorecognitionForm-form-tab-panel-incoming-hyperlink').trigger('click');
        var sDiv = 'cvautorecognition-document-viewer-converted-contents';
        $('#' + sDiv).html('&nbsp;');
        $('#' + sDiv + '-duplicate').html('&nbsp;');
    },

    AllowDropPhoto: function(ev)
    {
        ev.preventDefault();
    },

	DropPhoto: function (ev, sField)
    {
        ev.preventDefault();
        var sImageURL = ev.dataTransfer.getData("text");

        if (ev.dataTransfer.files)
        {
            if(ev.dataTransfer.files.length > 0)
            {
                var myFile = ev.dataTransfer.files[0];

                // The callback when the file has been uploaded
                var fnCallback = function (myUploadedServerFilePath)
				{
					var fnDisplayImage = function (sURL)
					{
						$(ev.target).attr('src', sURL);

						if (sField == 'cvautorecognition-form-ContactPhoto')
							$('#' + CVAutoRecognitionForm.FieldPrefix + 'new-ContactPhoto').attr('src', sURL);
					};
					TriSysSDK.FileUpload.AfterUploadingAFileMoveItAndGetExternalURL(myUploadedServerFilePath, fnDisplayImage, true);
                };

                // Upload the file through the standard route
                TriSysSDK.Controls.FileManager.UploadFile(myFile, fnCallback);

                return;
            }
        }

        $(ev.target).attr('src', sImageURL);
        //$('#' + sField).attr('src', sImageURL);
		if (sField == 'cvautorecognition-form-ContactPhoto')
			$('#' + CVAutoRecognitionForm.FieldPrefix + 'new-ContactPhoto').attr('src', sImageURL);
    },

    // No longer a combo, but code left in to help with other cases
    DropJobTitle: function(ev)
    {
        ev.preventDefault();
        var sjobTitle = ev.dataTransfer.getData("text");

        // Find match in combo
        TriSysSDK.CShowForm.SetTextInCombo(CVAutoRecognitionForm.FieldPrefix + "JobTitle", sjobTitle);
    },

    InitialiseZoomSlider: function (sSuffix, fnChange)
    {
        var slider = $("#cvautorecognition-form-slider" + sSuffix).kendoSlider({
            increaseButtonTitle: "Right",
            decreaseButtonTitle: "Left",
            min: 25,
            max: 400,
            smallStep: 25,
            largeStep: 50,
            change: fnChange
        }).data("kendoSlider");
    },

    ZoomCVViewer: function(e)
    {
        CVAutoRecognitionForm.ZoomCVViewerEventHandler(e, '');
    },
    ZoomCVViewerDuplicate: function(e)
    {
        CVAutoRecognitionForm.ZoomCVViewerEventHandler(e, '-duplicate');
    },

    ZoomCVViewerEventHandler: function(e, sSuffix)
    {
        var fZoom = (e.value / 100);
        var lFixedHeight = 822;

        var viewers = ['cvautorecognition-document-viewer-converted-contents' + sSuffix, 'cvautorecognition-document-viewer-pdf-viewer' + sSuffix];
        for (var i = 0; i < viewers.length; i++)
        {
            var viewer = viewers[i];
            var viewerDOMObject = $('#' + viewer);
            if (viewerDOMObject.css('display') != 'none')
            {
                var lHeight = viewerDOMObject.height();
                var iTime = 400;
                viewerDOMObject.animate({ zoom: fZoom, height: lFixedHeight / fZoom }, 400);

                //setTimeout(function()
                //{
                //    var lFixedHeight = 822;
                //    viewerDOMObject.height(lFixedHeight);

                //}, (iTime*1.2));
            }
        }      
    },

    // Put everything together to generate a candidate record
    SaveCandidateRecord: function()
    {
        var candidateRecord = CVAutoRecognitionForm.GetAndValidateCandidateRecord('');

		if (candidateRecord)
		{
			var fnSubmit = function ()
			{
				// Send data packet to server for storage
				CVAutoRecognitionForm.SubmitCandidateRecord(candidateRecord, "Saving");
				return true;
			};

			var fnViewDuplicates = function ()
			{
				CVAutoRecognitionForm.ViewDuplicateCandidates();
				return true;
			};

			// If any duplicates, prompt user to confirm
			if (CVAutoRecognitionForm._DuplicateCount == 0)
				fnSubmit();
			else
			{
				var sVerb = CVAutoRecognitionForm._DuplicateCount == 1 ? 'is' : 'are';
				var s = CVAutoRecognitionForm._DuplicateCount == 1 ? '' : 's';
				var sMessage = "Are you sure that you wish to save this as a new candidate?" +
					"<br /><br />" +
					"There " + sVerb + " " + CVAutoRecognitionForm._DuplicateCount + " potential duplicate candidate" + s + "." +
					"<br /><br />" +
					"If you save this candidate, you will potentially create a duplicate.";
				TriSysApex.UI.questionYesNoCancel(sMessage, "Save Candidate", "Yes/Save", fnSubmit, "View Duplicates", fnViewDuplicates, "No/Cancel");
			}
        }
    },

    GetAndValidateCandidateRecord: function(sPrefix)
    {
        var candidateRecord = CVAutoRecognitionForm.ReadCandidateFields(sPrefix);

        // Validate
        var sValidationError = null;
        if (!candidateRecord.Forenames || !candidateRecord.Surname)
            sValidationError = "must have a full name";
        else
        {
			if (candidateRecord.Gender == '')
                sValidationError = "must have an assigned gender";
        }

        // 12 Feb 2024: Customers are now allowed to override the validation fields
        sValidationError = CVAutoRecognitionForm.CustomValidation(candidateRecord, sValidationError);

        if (sValidationError)
        {
            TriSysApex.UI.ShowMessage("The candidate record " + sValidationError);
            return null;
        }

        return candidateRecord;
    },

    // User wants to open the existing duplicate candidate record
    OpenExistingCandidateRecord: function ()
    {
        if(CVAutoRecognitionForm.DuplicateSelectedCandidateId > 0)
        {
            TriSysApex.FormsManager.OpenForm("Contact", CVAutoRecognitionForm.DuplicateSelectedCandidateId);
        }
    },

    // User wants to view the CV of the existing duplicate candidate
    OpenExistingCandidateCV: function()
    {
        var sCVFileRef = $('#cvautorecognition-form-existing-cvfileref').html();
        if(!sCVFileRef)
        {
            TriSysApex.UI.ShowMessage("The candidate does not have a CV.");
            return;
        }

		// Sep 2018 and we have live editing of word documents!
		TriSysApex.Pages.FileManagerForm.FileOpenDrillDown(sCVFileRef);
		return;

        //var sName = TriSysSDK.Controls.FileManager.GetFileNameFromPath(sCVFileRef);
        //TriSysSDK.Controls.FileManager.OpenDocumentViewer("Existing CV", sCVFileRef, sName);
    },

    // User wants to create new duplicate candidate
    SaveDuplicateCandidateRecord: function()
    {
        var candidateRecord = CVAutoRecognitionForm.GetAndValidateCandidateRecord('new-');

        if (candidateRecord)
        {
            // Create a new candidate
            CVAutoRecognitionForm.SubmitCandidateRecord(candidateRecord, "Creating");
        }
    },

    // User wants to update the existing candidate with changes
    UpdateExistingCandidateRecord: function()
    {
        var candidateRecord = CVAutoRecognitionForm.GetAndValidateCandidateRecord('existing-');

        if (candidateRecord)
        {
            // Update the current duplicate contact with a new CV, new photo and other fields.
            // Remove the CV from the queue.
            // Clear all fields of this process.
            // Open the new contact.

            candidateRecord.ContactId = CVAutoRecognitionForm.DuplicateSelectedCandidateId
            candidateRecord.UpdateCandidate = true;

            // Re-use same API
            CVAutoRecognitionForm.SubmitCandidateRecord(candidateRecord, "Updating");
        }
    },

    // Create the candidate and open the record
    SubmitCandidateRecord: function (CCreateFromCVAutoRecognitionRequest, sProcess)
    {
        var payloadObject = {};

        payloadObject.URL = "Contact/CreateFromCVAutoRecognition";

        payloadObject.OutboundDataPacket = CCreateFromCVAutoRecognitionRequest;

        payloadObject.InboundDataFunction = function (data)
        {
            TriSysApex.UI.HideWait();
            var CCreateFromCVAutoRecognitionResponse = data;

            if (CCreateFromCVAutoRecognitionResponse)
            {
                if (CCreateFromCVAutoRecognitionResponse.Success)
                    CVAutoRecognitionForm.AfterSaveCandidate(CCreateFromCVAutoRecognitionResponse.ContactId);
                else
                    TriSysApex.UI.errorAlert(CCreateFromCVAutoRecognitionResponse.ErrorMessage);
            } else
            {
                // Something else has gone wrong!
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.ErrorHandlerRedirector('CVAutoRecognitionForm.SubmitCandidateRecord: ', request, status, error);
        };

        TriSysApex.UI.ShowWait(null, sProcess + " Candidate...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    AfterSaveCandidate: function(lContactId)
    {
        // Clear all fields containing this
        CVAutoRecognitionForm.CurrentDocumentURL = null;
        CVAutoRecognitionForm.DuplicateSelectedCandidateId = 0
        CVAutoRecognitionForm.ClearDataEntryFields();
        CVAutoRecognitionForm.ClearDuplicateCount();

        // Refresh grid which should have this CV removed
        TriSysApex.Forms.EntityForm.unPopulateFormGrids(CVAutoRecognitionForm.FormName);
        //$('#cvautorecognitionForm-form-tab-panel-incoming-hyperlink').trigger('click');

        // Open this contact record form
        TriSysApex.FormsManager.OpenForm("Contact", lContactId);
    },

    // Use the key fields to lookup potential duplicates
    ViewDuplicateCandidates: function()
    {
        // Call the Web API to do a duplicate check and allow the user to choose a suitable duplicate
        var fnCallback = function (candidates)
        {
            CVAutoRecognitionForm.ShowDuplicateCount(candidates);

            if (candidates)
            {
                var iCount = candidates.length;
                if (iCount > 0)
                    CVAutoRecognitionForm.ShowModalGridShowingDuplicateCandidates(candidates);
            }
        };

        CVAutoRecognitionForm.FireDuplicateCandidateCheck(fnCallback);
    },

    ShowModalGridShowingDuplicateCandidates: function (candidates)
    {
        var fnPopulateButtons = function(parametersObject, sGridDivID)
        {
            parametersObject.ButtonLeftText = "Select";
            parametersObject.ButtonLeftVisible = true;
            parametersObject.ButtonLeftFunction = function ()
            {
                var lContactId = TriSysSDK.Grid.GetSelectedSingletonRowRecordIdFromGrid(sGridDivID, "ContactId", "duplicate candidate");
                if(lContactId > 0)
                {
                    CVAutoRecognitionForm.DuplicateCandidateSelected(lContactId);
                    return true;
                }
            };

            parametersObject.ButtonRightText = "Cancel";
            parametersObject.ButtonRightVisible = true;
        };

        var fnPopulateGrid = function (sGridID)
        {
            var columns = [
                { field: "ContactId", title: "ContactId", type: "number", hidden: true },
                { field: "FullName", title: "Full Name", type: "string", width: 200 },
                { field: "Street", title: "Street", type: "string", width: 150 },
                { field: "City", title: "City", type: "string", width: 150 },
                { field: "PostCode", title: "Post Code", type: "string", width: 100 },
                { field: "HomeTelNo", title: "Home Tel No", type: "string", width: 130 },
                { field: "DateOfBirth", title: "Date of Birth", type: "date", format: "{0:dd MMM yyyy}", width: 130 },
                { field: "MobileTelNo", title: "Mobile", type: "string", width: 130 },
                { field: "WorkTelNo", title: "Work Tel No", type: "string", width: 130 },
                { field: "PersonalEMail", title: "Personal E-Mail", type: "string", width: 150 },
                { field: "WorkEMail", title: "Work E-Mail", type: "string", width: 150 }
            ];

            TriSysSDK.Grid.VirtualMode({
                Div: sGridID,
                ID: "grdDuplicateCandidates",
                //Title: "CV Auto-Recognition Documents",
                RecordsPerPage: 10,
                PopulationByObject: candidates,
                Columns: columns,
                MobileVisibleColumns: [
                    { field: "FullName" }
                ],
                MobileRowTemplate: '<td colspan="1"><strong>#: FullName #</strong><br />' +
                    '<i>#: City #</i><br />' +
                    'DoB: #: DateOfBirth #<br />' +
                    'Home: #: HomeTelNo #<br />' +
                    'Mobile: #: MobileTelNo #<br />' +
                    'E-Mail: #: PersonalEMail #<br />' +
                    '</td>',

                KeyColumnName: "ContactId",
                DrillDownFunction: function (rowData)
                {
                    TriSysApex.UI.CloseModalPopup();
                    CVAutoRecognitionForm.DuplicateCandidateSelected(rowData.ContactId);
                },
                MultiRowSelect: true,
                Grouping: false,
                ColumnFilters: false,
                OpenButtonCaption: "Select"
            });
        };

        TriSysApex.ModalDialogue.Grid.Show("Potential Duplicate Candidates", null, fnPopulateButtons, fnPopulateGrid, { CloseTopRightButton: true });
    },

    DuplicateCandidateSelected: function(lContactId)
    {
        //TriSysApex.Toasters.Info("DuplicateCandidateSelected: " + lContactId);
        CVAutoRecognitionForm.DuplicateSelectedCandidateId = lContactId;

        // Display the duplicate tab
        setTimeout(function ()
        {
            $('#cvautorecognitionForm-form-tab-panel-duplicate-hyperlink').trigger('click');

            // Hack to overcome JobTitle pick list
            var sNewJobTitle = $('#' + CVAutoRecognitionForm.FieldPrefix + 'JobTitle').val()
            $('#' + CVAutoRecognitionForm.FieldPrefix + 'new-JobTitle').val(sNewJobTitle);

        }, 100);

        // Load the contact details
        CVAutoRecognitionForm.LoadDuplicateContactRecordFromAPI(lContactId);
    },

    LoadDuplicateContactRecordFromAPI: function (lContactId)
    {
        var CReadDuplicateCandidateRequest = { ContactId: lContactId };

        // Call the API to submit the data to the server
        var payloadObject = {};

        payloadObject.URL = "Contact/ReadDuplicateCandidate";

        payloadObject.OutboundDataPacket = CReadDuplicateCandidateRequest;

        payloadObject.InboundDataFunction = function (CReadDuplicateCandidateResponse)
        {
            TriSysApex.UI.HideWait();

            if (CReadDuplicateCandidateResponse)
            {
                if (CReadDuplicateCandidateResponse.Success || true)
                {
                    CVAutoRecognitionForm.DisplayDuplicateCandidateRecord(CReadDuplicateCandidateResponse.Candidate);

                    return;
                }
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('CVAutoRecognitionForm.LoadDuplicateContactRecordFromAPI: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Loading Duplicate...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    // Use the same dataset as the duplicate check to keep things nice and simple/standard as possible
    DisplayDuplicateCandidateRecord: function (candidate)
    {
        var sExistingPrefix = CVAutoRecognitionForm.FieldPrefix + 'existing-';

        $('#' + sExistingPrefix + "Forenames").val(candidate.Forenames);
        $('#' + sExistingPrefix + "Surname").val(candidate.Surname);
        $('#' + sExistingPrefix + "MobileTelNo").val(candidate.MobileTelNo);
        $('#' + sExistingPrefix + "WorkTelNo").val(candidate.WorkTelNo);
        $('#' + sExistingPrefix + "PersonalEMail").val(candidate.PersonalEMail);
        $('#' + sExistingPrefix + "Street").val(candidate.Street);
        $('#' + sExistingPrefix + "City").val(candidate.City);
        $('#' + sExistingPrefix + "County").val(candidate.County);
        $('#' + sExistingPrefix + "PostCode").val(candidate.PostCode);
        TriSysSDK.CShowForm.SetTextInCombo(sExistingPrefix + "Country", (candidate.Country ? candidate.Country : TriSysSDK.Countries.DefaultCountryName));
        $('#' + sExistingPrefix + "HomeTelNo").val(candidate.HomeTelNo);
        $('#' + sExistingPrefix + "JobTitle").val(candidate.JobTitle);

        if (candidate.DateOfBirth)
        {
            var dtDoB = moment(candidate.DateOfBirth).format('DD MMM YYYY');
            if (dtDoB.indexOf('0001') < 0)
                $('#' + sExistingPrefix + "DateOfBirth").val(dtDoB);
        }

        TriSysSDK.CShowForm.SetTextInCombo(sExistingPrefix + "Title", candidate.Title);
		TriSysSDK.CShowForm.SetTextInCombo(sExistingPrefix + "Gender", candidate.Gender);
        //TriSysSDK.CShowForm.SetTextInCombo(sExistingPrefix + "JobTitle", candidate.JobTitle);
        TriSysSDK.CShowForm.SetTextInCombo(sExistingPrefix + "ContactSource", candidate.ContactSource);
        TriSysSDK.CShowForm.SetSkillsInList(sExistingPrefix + 'TypeOfWorkRequired', candidate.TypeOfWorkRequired);

        if (candidate.ContactPhoto)
        {
            // This is a g:\ reference, so do a round trip to display the photo
            var fnShowExistingPhoto = function (sFileURL)
            {
                $('#' + sExistingPrefix + 'ContactPhoto').attr('src', sFileURL);
            };

            TriSysSDK.Controls.FileManager.GetFileReferenceServerFilePathToExternalFilePath(candidate.ContactPhoto, fnShowExistingPhoto);
        }

        // Store existing CV in case user wants to view it
        $('#cvautorecognition-form-existing-cvfileref').html(candidate.CVFileRef);
    },

    FireDuplicateCandidateCheck: function(fnCallback)
    {
        var candidateRecord = CVAutoRecognitionForm.ReadCandidateFields('');
        var duplicateCheck = { Candidate: candidateRecord };

        CVAutoRecognitionForm.CandidateDuplicateWebAPICall(duplicateCheck, fnCallback);
    },

    // Convert the on-screen fields into an easy to use data structure
    ReadCandidateFields: function(sPrefix)
    {
        // 14 Apr 2023: null .trim reported in ApexError
        var sGender = TriSysSDK.CShowForm.GetTextFromCombo(CVAutoRecognitionForm.FieldPrefix + sPrefix + "Gender");
        if (sGender)
            sGender = sGender.trim();

        var candidateRecord = {

            Forenames: $('#' + CVAutoRecognitionForm.FieldPrefix + sPrefix + "Forenames").val(),
            Surname: $('#' + CVAutoRecognitionForm.FieldPrefix + sPrefix + "Surname").val(),
            Street: $('#' + CVAutoRecognitionForm.FieldPrefix + sPrefix + "Street").val(),
            City: $('#' + CVAutoRecognitionForm.FieldPrefix + sPrefix + "City").val(),
            County: $('#' + CVAutoRecognitionForm.FieldPrefix + sPrefix + "County").val(),
            PostCode: $('#' + CVAutoRecognitionForm.FieldPrefix + sPrefix + "PostCode").val(),
            //Country: $('#' + CVAutoRecognitionForm.FieldPrefix + sPrefix + "Country").val(),
			Country: TriSysSDK.CShowForm.GetTextFromCombo(CVAutoRecognitionForm.FieldPrefix + sPrefix + "Country"),
            HomeTelNo: $('#' + CVAutoRecognitionForm.FieldPrefix + sPrefix + "HomeTelNo").val(),
            WorkTelNo: $('#' + CVAutoRecognitionForm.FieldPrefix + sPrefix + "WorkTelNo").val(),
            MobileTelNo: $('#' + CVAutoRecognitionForm.FieldPrefix + sPrefix + "MobileTelNo").val(),
            PersonalEMail: $('#' + CVAutoRecognitionForm.FieldPrefix + sPrefix + "PersonalEMail").val(),
            WorkEMail: $('#' + CVAutoRecognitionForm.FieldPrefix + sPrefix + "WorkEMail").val(),
            DateOfBirth: $('#' + CVAutoRecognitionForm.FieldPrefix + sPrefix + "DateOfBirth").val(),

            Title: TriSysSDK.CShowForm.GetTextFromCombo(CVAutoRecognitionForm.FieldPrefix + sPrefix + "Title"),
            JobTitle: $('#' + CVAutoRecognitionForm.FieldPrefix + sPrefix + "JobTitle").val(),
            Gender: sGender,
            ContactSource: TriSysSDK.CShowForm.GetTextFromCombo(CVAutoRecognitionForm.FieldPrefix + sPrefix + "ContactSource"),
            TypeOfWorkRequired: TriSysSDK.CShowForm.GetSelectedSkillsFromList(CVAutoRecognitionForm.FieldPrefix + sPrefix + "TypeOfWorkRequired"),

			ContactPhoto: $('#' + CVAutoRecognitionForm.FieldPrefix + sPrefix + "ContactPhoto").attr('src'),

			Nationality: $('#' + CVAutoRecognitionForm.FieldPrefix + sPrefix + "Nationality").val(),

			LinkedIn: $('#' + CVAutoRecognitionForm.FieldPrefix + sPrefix + "LinkedIn").val(),
			Facebook: $('#' + CVAutoRecognitionForm.FieldPrefix + sPrefix + "Facebook").val(),
			Skype: $('#' + CVAutoRecognitionForm.FieldPrefix + sPrefix + "Skype").val(),
			Twitter: $('#' + CVAutoRecognitionForm.FieldPrefix + sPrefix + "Twitter").val(),
			YouTube: $('#' + CVAutoRecognitionForm.FieldPrefix + sPrefix + "YouTube").val(),
			Blog: $('#' + CVAutoRecognitionForm.FieldPrefix + sPrefix + "Blog").val(),
			WebSite: $('#' + CVAutoRecognitionForm.FieldPrefix + sPrefix + "WebSite").val(),

            CVFileRef: CVAutoRecognitionForm.CurrentDocumentURL
        };

        return candidateRecord;
    },

    JobTitleLookup: function ()
    {
        var sJobTitleField = CVAutoRecognitionForm.FieldPrefix + 'JobTitle';
        var sJobTitle = TriSysSDK.CShowForm.GetJobTitleFromField(sJobTitleField);
        TriSysSDK.JobTitle.Lookup(sJobTitle, sJobTitleField);
    },

	// Fired if our office editor has edited a document which may be displayed on this form.
	FileUpdated: function(sFilePath)
	{
		// Strip folder and filename e.g. Incoming CVs\CV.docx
		var parts = sFilePath.split("\\");
		var sUpdatedFilePath = parts[parts.length-2] + "\\" + parts[parts.length-1];
		sUpdatedFilePath = sUpdatedFilePath.toLowerCase();

		// Do the same for the current CV being viewed
		var sCurrentCVPath = CVAutoRecognitionForm.CurrentDocumentURL;
		if(!sCurrentCVPath)
			return;
		sCurrentCVPath = sCurrentCVPath.replace(/\\\\/g, '\\');
		parts = sCurrentCVPath.split("\\");
		var sCVFilePath = parts[parts.length-2] + "\\" + parts[parts.length-1];
		sCVFilePath = sCVFilePath.toLowerCase();

		// If these are the same, then refresh the viewer to reflect changes
		if(sUpdatedFilePath == sCVFilePath)
		{
			sFilePath = "G:\\" + sUpdatedFilePath;
			var sName = TriSysSDK.Controls.FileManager.GetFileNameFromPath(sFilePath);
            CVAutoRecognitionForm.DisplayAndParseCV(sFilePath, sName);
		}
	},

    // 12 Feb 2024: Call custom code specified in ApexCustomerModule to validate mandatory fields
	CustomValidation: function (candidateRecord, sValidationError)
	{
	    if (typeof (ApexCustomerModule) != TriSysApex.Constants.Undefined && typeof (ApexCustomerModule.CustomCVARValidation) != TriSysApex.Constants.Undefined)
	    {
	        try {
	            sValidationError = ApexCustomerModule.CustomCVARValidation(candidateRecord, sValidationError);
	        }
	        catch (e) {
	            // Assume that the custom developer will catch this in dev!
	            TriSysApex.Logging.LogMessage(TriSysApex.Logging.CatchVariableToText(e));
	        }
	    }

	    return sValidationError;
	}

};  // CVAutoRecognitionForm

$(document).ready(function ()
{
    // Give the form a chance to show before we start the heavy lifting!			
	setTimeout(function()
	{
		CVAutoRecognitionForm.Load();
	}, 10);
});
