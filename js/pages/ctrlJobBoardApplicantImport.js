var ctrlJobBoardApplicantImport =
{
	Load: function (requirement, applicant, potentialDuplicateCandidates, sCVServerPath)
	{
		$('#ctrlJobBoardApplicantImport-Requirement').html(requirement.Reference);
		$('#ctrlJobBoardApplicantImport-JobTitle').html(requirement.JobTitle);
		$('#ctrlJobBoardApplicantImport-JobBroadcaster').html(requirement.JobBroadcaster);
		$('#ctrlJobBoardApplicantImport-Applicant').html(applicant.Name);
		$('#ctrlJobBoardApplicantImport-Channel').html(applicant.ChannelName);

		var sImage = '<img src="images/trisys/72x72/flag-' + applicant.Flag + '.png?ts=201803221020" style="width: 24px; height: 24px;" alt="#= Flag #">';
		$('#ctrlJobBoardApplicantImport-Rank').html(sImage);

		ctrlJobBoardApplicantImport.LoadFieldWidgets();

		setTimeout(TriSysProUI.kendoUI_Overrides, 250);

		ctrlJobBoardApplicantImport.Data.Set(requirement, applicant, potentialDuplicateCandidates, sCVServerPath);

		ctrlJobBoardApplicantImport.PopulatePotentialDuplicateGrid(potentialDuplicateCandidates);
		ctrlJobBoardApplicantImport.DisplayApplicantDetails(applicant, sCVServerPath);
		},

	LoadFieldWidgets: function ()
	{
		var sFieldPrefix = 'ctrlJobBoardApplicantImport-form-';
		var suffixes = ['', 'applicant-', 'duplicate-'];

		for (var i = 0; i < suffixes.length; i++)
		{
			var suffix = suffixes[i];

			TriSysSDK.CShowForm.contactTitleFieldEditableProperties(sFieldPrefix + suffix + "Title", "Mr");
			TriSysSDK.CShowForm.PopulateGenderCombo(sFieldPrefix + suffix + "Gender");

			TriSysSDK.CShowForm.skillCombo(sFieldPrefix + suffix + 'ContactSource', 'ContactSource', 'TBC');
			TriSysSDK.CShowForm.entityTypeMultiSelectCombo('Requirement', sFieldPrefix + suffix + 'TypeOfWorkRequired');
			
			TriSysWebJobs.CandidateRegistration.LoadCountryLookup(sFieldPrefix + suffix + "Country");
		}

		// Initialize Slider for zooming CV
		ctrlJobBoardApplicantImport.InitialiseZoomSlider('', ctrlJobBoardApplicantImport.ZoomCVViewer);
	},

	DisplayApplicantDetails: function (applicant, sCVServerPath)
	{
		if (applicant)
		{
			if (applicant.FileName)
			{
				$('#ctrlJobBoardApplicantImport-FileName').html(applicant.FileName);

				if (sCVServerPath)
				{
					// We have received the G:\Documents\ApplicantCV\LogicMelon path to the document
					// Now display this in the CV widgets
					ctrlJobBoardApplicantImport.DisplayApplicantCV(sCVServerPath);
				}

				// Kick off the CV parser to populate the contact fields
				ctrlJobBoardApplicantImport.CommenceCVParsing(applicant.FileName, applicant.Doc_Text);
			}
			else
			{
				var cvBlock = $('#ctrlJobBoardApplicantImport-CVBlock');
				cvBlock.hide();

				// In cases where no CV and no duplicates exist, we need to hack some more
				var applicantBlock = $('#ctrlJobBoardApplicantImport-ApplicantBlock');
				var duplicatesBlock = $('#ctrlJobBoardApplicantImport-SelectedDuplicateBlock')

				var bDuplicatesBlockHidden = (duplicatesBlock.css('display') == 'none');
				if (bDuplicatesBlockHidden)
					applicantBlock.removeClass().addClass("col-md-12 col-lg-12");
			}

			// Populate all applicant fields from the job broadcaster because we may not have a CV, but other
			// details are important
			var sFieldPrefix = 'ctrlJobBoardApplicantImport-form-applicant-';

			ctrlJobBoardApplicantImport.DisplayApplicantFieldOnlyIfBlank("Title", applicant.Title, TriSysSDK.Controls.FieldTypes.SkillCombo);
			ctrlJobBoardApplicantImport.DisplayApplicantFieldOnlyIfBlank("Forenames", applicant.FirstName, TriSysSDK.Controls.FieldTypes.Text);
			ctrlJobBoardApplicantImport.DisplayApplicantFieldOnlyIfBlank("Surname", applicant.Surname, TriSysSDK.Controls.FieldTypes.Text);
			ctrlJobBoardApplicantImport.DisplayApplicantFieldOnlyIfBlank("MobileTelNo", applicant.MobileTelNo, TriSysSDK.Controls.FieldTypes.Text);
			ctrlJobBoardApplicantImport.DisplayApplicantFieldOnlyIfBlank("WorkTelNo", applicant.WorkTelNo, TriSysSDK.Controls.FieldTypes.Text);
			ctrlJobBoardApplicantImport.DisplayApplicantFieldOnlyIfBlank("HomeTelNo", applicant.HomeTelNo, TriSysSDK.Controls.FieldTypes.Text);
			ctrlJobBoardApplicantImport.DisplayApplicantFieldOnlyIfBlank("PersonalEMail", applicant.Email, TriSysSDK.Controls.FieldTypes.Text);

			// TODO: Address
		}
	},

	// We CV parse after populating the applicant supplied details.
	// This ensures that we do not overwrite them after CV parsing.
	DisplayApplicantFieldOnlyIfBlank: function (sField, objValue, fieldType)
	{
		var sFieldPrefix = 'ctrlJobBoardApplicantImport-form-applicant-';
		var sValue = null;

		switch (fieldType)
		{
			case TriSysSDK.Controls.FieldTypes.Text:
				sValue = $('#' + sFieldPrefix + sField).val();
				if (!sValue)
					$('#' + sFieldPrefix + sField).val(objValue);
				break;

			case TriSysSDK.Controls.FieldTypes.SkillCombo:
				sValue = TriSysSDK.CShowForm.GetTextFromCombo(sFieldPrefix + sField);
				if (!objValue)
					TriSysSDK.CShowForm.SetTextInCombo(sFieldPrefix + sField, objValue);
				break;

			case TriSysSDK.Controls.FieldTypes.Date:
				var dt = moment(objValue).format('DD MMM YYYY');
				if (dt.indexOf('0001') < 0)
					$('#' + sFieldPrefix + sField).val(dt);
				break;
		}

	},

	DisplayApplicantCV: function (sCVServerPath)
	{
		// Let use know we are working on getting the chosen document ready to view
		var sDiv = 'ctrlJobBoardApplicantImport-document-viewer-converted-contents';

		// Let user watch an animation whilst we get the file from the API
		ctrlJobBoardApplicantImport.WaitingProgressSpinner(true);

		// Is this a word document?
		var bUsePDFconverter = false;       // Switch to true when Aspose conversion workd correctly
		var bConvert = TriSysSDK.Controls.FileManager.isWordFile(sCVServerPath) || (bUsePDFconverter && TriSysSDK.Controls.FileManager.isPDFFile(sCVServerPath));
		if (!bConvert)
		{
			// Deal with PDF's etc..
			ctrlJobBoardApplicantImport.DisplayNonWordDocumentInViewer(sCVServerPath);
			return false;
		}


		// Get the HTML friendly document from the Web API as a URL so that we can local into this scrollable DIV
		var CFileReferenceInternalToExternalPathRequest = {
			FolderFilePath: sCVServerPath
		}

		var payloadObject = {};
		payloadObject.URL = "Files/ConvertFileReferenceInternalToExternalPath";
		payloadObject.OutboundDataPacket = CFileReferenceInternalToExternalPathRequest;
		payloadObject.InboundDataFunction = function (CFileReferenceInternalToExternalPathResult)
		{
			if (CFileReferenceInternalToExternalPathResult)
			{
				if (CFileReferenceInternalToExternalPathResult.Success)
				{
					// Load the full document into this DIV
					var sFileURL = CFileReferenceInternalToExternalPathResult.URL;

					ctrlJobBoardApplicantImport.LoadHTMLDocumentURLIntoDiv(sDiv, sFileURL);
				}
				else
					TriSysApex.UI.errorAlert(CFileReferenceInternalToExternalPathResult.ErrorMessage, TriSysWeb.Constants.ApplicationName);
			}
			else
				TriSysApex.UI.ShowMessage("No response from " + payloadObject.URL, TriSysWeb.Constants.ApplicationName);

			return true;
		};
		payloadObject.ErrorHandlerFunction = function (request, status, error)
		{
			// Can occur when user gets impatient waiting for photo to load and navigates away
			TriSysApex.UI.ErrorHandlerRedirector('ctrlJobBoardApplicantImport.DisplayApplicantCV: ', request, status, error, false);
		};
		TriSysAPI.Data.PostToWebAPI(payloadObject);
	},

	LoadHTMLDocumentURLIntoDiv: function (sDiv, sFileURL)
	{
		$('#' + sDiv).load(sFileURL, function (response, status, xhr)
		{
			ctrlJobBoardApplicantImport.WaitingProgressSpinner(false, true);

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

	WaitingProgressSpinner: function (bVisible, bConvertedWordDocument, bPDFDocument)
	{
		var sConvertedDiv = 'ctrlJobBoardApplicantImport-document-viewer-converted-contents';
		var pdfViewer = 'ctrlJobBoardApplicantImport-document-viewer-pdf-viewer';
		var sWaitingDiv = 'ctrlJobBoardApplicantImport-document-viewer-waiting';
		var sSliderDiv = 'ctrlJobBoardApplicantImport-document-viewer-zoom';

		if (bVisible)
		{
			// Let user watch an animation whilst we get the file from the API
			$('#' + sConvertedDiv).hide();
			$('#' + pdfViewer).hide();
			$('#' + sWaitingDiv).show();
			$('#' + sSliderDiv).hide();

			setTimeout(TriSysProUI.kendoUI_Overrides, 50);
		}
		else
		{
			$('#' + sWaitingDiv).hide();
			$('#' + sSliderDiv).hide();

			if (bConvertedWordDocument)
			{
				$('#' + sConvertedDiv).show();
				$('#' + sSliderDiv).show();
			}
			else if (bPDFDocument)
			{
				$('#' + pdfViewer).show();
			}
		}
	},

	DisplayNonWordDocumentInViewer: function (sURL)
	{
		if (TriSysSDK.Controls.FileManager.isPDFFile(sURL))
		{
			var pdfViewer = 'ctrlJobBoardApplicantImport-document-viewer-pdf-viewer';

			var fnCallback = function (sFileURL)
			{
				ctrlJobBoardApplicantImport.WaitingProgressSpinner(false, false, true);

				var pdfViewerObject = $('#' + pdfViewer);

				// It cannot be 100% resized
				pdfViewerObject.css("width", ctrlJobBoardApplicantImport.GetViewerAndSliderWidth(false, ''));

				// Bug in PDF viewer https://code.google.com/p/chromium/issues/detail?id=569888

				var sFilePathToSet = sFileURL;  //   "https://bitcoin.org/bitcoin.pdf";

				sFilePathToSet += TriSysApex.FormsManager.pageURLTimestampArgumentsToForceNoCache();

				pdfViewerObject.removeAttr('data');
				pdfViewerObject.attr('data', sFilePathToSet);

				// Because this does not show, delete it and recreate it!

				// Clone the object
				pdfViewerObject.clone().appendTo('#ctrlJobBoardApplicantImport-cv-viewer-block');
				pdfViewerObject.remove();
				var pdfViewerObject = $('#' + pdfViewer);
				pdfViewerObject.attr('data', sFilePathToSet);				
			};

			TriSysSDK.Controls.FileManager.GetFileReferenceServerFilePathToExternalFilePath(sURL, fnCallback);
		}
	},

	CommenceCVParsing: function (sFileName, sBase64Text)
	{
		var CParseServerCVRequest = {

			FileName: sFileName,
			Base64Text: sBase64Text
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
					ctrlJobBoardApplicantImport.DisplayApplicantDetailsAfterCVParsing(CParseServerCVResponse);
				}
			}

			return true;
		};
		payloadObject.ErrorHandlerFunction = function (request, status, error)
		{
			// Can occur when user gets impatient waiting for photo to load and navigates away
			TriSysApex.UI.ErrorHandlerRedirector('ctrlJobBoardApplicantImport.CommenceCVParsing: ', request, status, error, false);
		};
		TriSysAPI.Data.PostToWebAPI(payloadObject);
	},

	DisplayApplicantDetailsAfterCVParsing: function (CParseServerCVResponse)
	{
		if (CParseServerCVResponse.Demographics)
		{
			// Display the raw recognised fields
			var sFieldPrefix = 'ctrlJobBoardApplicantImport-form-applicant-';

			var demographics = CParseServerCVResponse.Demographics;

			ctrlJobBoardApplicantImport.DisplayApplicantFieldOnlyIfBlank("Title", demographics.Title, TriSysSDK.Controls.FieldTypes.SkillCombo);
			ctrlJobBoardApplicantImport.DisplayApplicantFieldOnlyIfBlank("Forenames", demographics.Forenames, TriSysSDK.Controls.FieldTypes.Text);
			ctrlJobBoardApplicantImport.DisplayApplicantFieldOnlyIfBlank("Surname", demographics.Surname, TriSysSDK.Controls.FieldTypes.Text);
			ctrlJobBoardApplicantImport.DisplayApplicantFieldOnlyIfBlank("MobileTelNo", demographics.MobileTelNo, TriSysSDK.Controls.FieldTypes.Text);
			ctrlJobBoardApplicantImport.DisplayApplicantFieldOnlyIfBlank("WorkTelNo", demographics.WorkTelNo, TriSysSDK.Controls.FieldTypes.Text);
			ctrlJobBoardApplicantImport.DisplayApplicantFieldOnlyIfBlank("PersonalEMail", demographics.EMail, TriSysSDK.Controls.FieldTypes.Text);
			ctrlJobBoardApplicantImport.DisplayApplicantFieldOnlyIfBlank("Street", demographics.AddressStreet, TriSysSDK.Controls.FieldTypes.Text);
			ctrlJobBoardApplicantImport.DisplayApplicantFieldOnlyIfBlank("City", demographics.AddressCity, TriSysSDK.Controls.FieldTypes.Text);
			ctrlJobBoardApplicantImport.DisplayApplicantFieldOnlyIfBlank("County", demographics.AddressCounty, TriSysSDK.Controls.FieldTypes.Text);
			ctrlJobBoardApplicantImport.DisplayApplicantFieldOnlyIfBlank("PostCode", demographics.AddressPostCode, TriSysSDK.Controls.FieldTypes.Text);
			TriSysSDK.CShowForm.SetTextInCombo(sFieldPrefix + "Country", (demographics.AddressCountry ? demographics.AddressCountry : TriSysSDK.Countries.DefaultCountryName));
			ctrlJobBoardApplicantImport.DisplayApplicantFieldOnlyIfBlank("HomeTelNo", demographics.HomeTelNo, TriSysSDK.Controls.FieldTypes.Text);
			ctrlJobBoardApplicantImport.DisplayApplicantFieldOnlyIfBlank("JobTitle", demographics.JobTitle, TriSysSDK.Controls.FieldTypes.Text);

			if (demographics.DateOfBirth)
				ctrlJobBoardApplicantImport.DisplayApplicantFieldOnlyIfBlank("DateOfBirth", demographics.DateOfBirth, TriSysSDK.Controls.FieldTypes.Date);

		}
	},

	PopulatePotentialDuplicateGrid: function (potentialDuplicateCandidates)
	{
		if (!potentialDuplicateCandidates)
		{
			$('#ctrlJobBoardApplicantImport-DuplicateBlock').hide();
			ctrlJobBoardApplicantImport.DisplayCandidateDetails(0);
			return;
		}


		// Draw in grid
		var sDivTag = 'ctrlJobBoardApplicantImport-DataGrid';
		var sGridName = sDivTag + '-GridInstance';

		var fnRowClickHandler = function (e, gridObject, gridLayout)
		{
		    var selectedItem = TriSysSDK.Grid.GetFirstGridCheckedItem(gridObject);

			if (selectedItem)
			{
				var lContactId = selectedItem.ContactId;
				ctrlJobBoardApplicantImport.DisplayCandidateDetails(lContactId);
			}
		};

		var bPopulated = false;
		var fnPostPopulationCallback = function (lRecordCount)
		{
			if (!bPopulated)
			{
			    TriSysSDK.Grid.SelectFirstRow(sDivTag);
			}

			//bPopulated = true;
		}

		TriSysSDK.Grid.VirtualMode({
			Div: sDivTag,
			ID: sGridName,
			Title: "Potential Duplicate Candidates",
			RecordsPerPage: TriSysApex.UserOptions.RecordsPerPage(),
			PopulationByObject: potentialDuplicateCandidates,
			Columns: [
				{ field: "ContactId", title: "ContactId", type: "number", width: 70, hidden: true },
				{ field: "FullName", title: "Full Name", type: "string" },
				{ field: "HomeAddressStreet", title: "Street", type: "string" },
				{ field: "HomeAddressCity", title: "City", type: "string" },
				{ field: "HomeAddressPostCode", title: "Post Code", type: "string" },
				{ field: "HomeAddressTelNo", title: "Home Tel.", type: "string" },
				{ field: "PersonalEMail", title: "Personal E-Mail", type: "string" },
				{ field: "MobileTelNo", title: "Personal Mobile Tel.", type: "string" }],

			KeyColumnName: "ContactId",
			MultiRowSelect: false,
			SingleRowSelect: true,
			RowClickHandler: fnRowClickHandler,
			PostPopulationCallback: fnPostPopulationCallback,
			ColumnFilters: false,
			Grouping: false
		});

		// Does not fire for in-memory datasets
		setTimeout(fnPostPopulationCallback, 100);
	},

	OpenSelectedDuplicateCV: function ()
	{
		var candidate = ctrlJobBoardApplicantImport.GetSelectedExistingCandidate();
		if (candidate)
		{
			if (candidate.CVFileRef)
			{
				// Sep 2018 and we have live editing of word documents!
				TriSysApex.Pages.FileManagerForm.FileOpenDrillDown(candidate.CVFileRef);
				//var sName = TriSysSDK.Controls.FileManager.GetFileNameFromPath(candidate.CVFileRef);
				//TriSysSDK.Controls.FileManager.OpenDocumentViewer("Existing CV", candidate.CVFileRef, sName);
				return;
			}
		}

		TriSysApex.UI.ShowMessage("No CV available for existing candidate.");
	},	

	GetSelectedExistingCandidate: function ()
	{
		var lContactId = ctrlJobBoardApplicantImport.Data._SelectedContactId;
		if (lContactId > 0)
		{
			var candidate = ctrlJobBoardApplicantImport.Data.GetDuplicateCandidate(lContactId);
			if (candidate)
				return candidate;
		}
	},

	SelectNone: function ()
	{
		var sDivTag = 'ctrlJobBoardApplicantImport-DataGrid';
		var grid = $("#" + sDivTag).data("kendoGrid");
		grid.clearSelection();

		ctrlJobBoardApplicantImport.DisplayCandidateDetails(0);
	},

	// The candidate is the duplicate in this form.
	DisplayCandidateDetails: function (lContactId)
	{
		ctrlJobBoardApplicantImport.Data._SelectedContactId = lContactId;
		var cvBlock = $('#ctrlJobBoardApplicantImport-CVBlock');
		var applicantBlock = $('#ctrlJobBoardApplicantImport-ApplicantBlock');
		var duplicatesBlock = $('#ctrlJobBoardApplicantImport-SelectedDuplicateBlock');

		var bCVBlockHidden = (cvBlock.css('display') == 'none');
		var sApplicantBlockClass = bCVBlockHidden ? "col-md-8 col-lg-8" : "col-md-4 col-lg-4";

		var candidate = ctrlJobBoardApplicantImport.Data.GetDuplicateCandidate(lContactId);
		if (!candidate)
		{
			duplicatesBlock.hide();
			applicantBlock.removeClass().addClass(bCVBlockHidden ? "col-md-12 col-lg-12" : "col-md-8 col-lg-8");

			return;
		}

		duplicatesBlock.show();
		applicantBlock.removeClass().addClass(sApplicantBlockClass);

		var sFieldPrefix = 'ctrlJobBoardApplicantImport-form-duplicate-';

		$('#' + sFieldPrefix + "Forenames").val(candidate.Forenames);
		$('#' + sFieldPrefix + "Surname").val(candidate.Surname);
		$('#' + sFieldPrefix + "MobileTelNo").val(candidate.MobileTelNo);
		$('#' + sFieldPrefix + "WorkTelNo").val(candidate.WorkTelNo);
		$('#' + sFieldPrefix + "PersonalEMail").val(candidate.PersonalEMail);
		$('#' + sFieldPrefix + "WorkEMail").val(candidate.WorkEMail);
		$('#' + sFieldPrefix + "Street").val(candidate.HomeAddressStreet);
		$('#' + sFieldPrefix + "City").val(candidate.HomeAddressCity);
		$('#' + sFieldPrefix + "County").val(candidate.HomeAddressCounty);
		$('#' + sFieldPrefix + "PostCode").val(candidate.HomeAddressPostCode);
		TriSysSDK.CShowForm.SetTextInCombo(sFieldPrefix + "Country", (candidate.HomeAddressCountry ? candidate.HomeAddressCountry : TriSysSDK.Countries.DefaultCountryName));
		$('#' + sFieldPrefix + "HomeTelNo").val(candidate.HomeAddressTelNo);
		$('#' + sFieldPrefix + "JobTitle").val(candidate.JobTitle);

		TriSysSDK.CShowForm.SetTextInCombo(sFieldPrefix + "Title", candidate.Title);
		TriSysSDK.CShowForm.SetTextInCombo(sFieldPrefix + "Gender", candidate.Gender);
		TriSysSDK.CShowForm.SetTextInCombo(sFieldPrefix + "ContactSource", candidate.Source);
		TriSysSDK.CShowForm.SetSkillsInList(sFieldPrefix + "TypeOfWorkRequired", candidate.TypeOfWork);

		if (candidate.DateOfBirth)
		{
			var dtDoB = moment(candidate.DateOfBirth).format('DD MMM YYYY');
			if (dtDoB.indexOf('0001') < 0)
				$('#' + sFieldPrefix + "DateOfBirth").val(dtDoB);
		}

		$('#' + sFieldPrefix + 'ContactPhoto').attr('src', TriSysApex.Constants.DefaultContactImage);
		if (candidate.ContactPhoto)
		{
			// This is a g:\ reference, so do a round trip to display the photo
			var fnShowExistingPhoto = function (sFileURL)
			{
				$('#' + sFieldPrefix + 'ContactPhoto').attr('src', sFileURL);
			};

			TriSysSDK.Controls.FileManager.GetFileReferenceServerFilePathToExternalFilePath(candidate.ContactPhoto, fnShowExistingPhoto);
		}		
	},

	// Applicant Create New Candidate button
	SaveApplicantAsCandidateRecord: function ()
	{
		var candidate = {};

		var sFieldPrefix = 'ctrlJobBoardApplicantImport-form-applicant-';

		candidate = ctrlJobBoardApplicantImport.ReadCandidateRecordBeforeSave(sFieldPrefix, candidate);
		if (!candidate)
			return;

		// After saving candidate, do visuals and prompt for shortlisting
		var fnAfterSavingCandidateRecord = function (lContactId)
		{
			// After creating the new candidate, hide the existing candidate blocks as we have gone with a new candidate
			$('#ctrlJobBoardApplicantImport-DuplicateBlock').hide();
			var duplicatesBlock = $('#ctrlJobBoardApplicantImport-SelectedDuplicateBlock');
			duplicatesBlock.hide();
			var cvBlock = $('#ctrlJobBoardApplicantImport-CVBlock');
			var bCVBlockHidden = (cvBlock.css('display') == 'none');
			var sApplicantBlockClass = bCVBlockHidden ? "col-md-12 col-lg-12" : "col-md-8 col-lg-8";
			var applicantBlock = $('#ctrlJobBoardApplicantImport-ApplicantBlock');
			applicantBlock.removeClass().addClass(sApplicantBlockClass);
			$('#ctrlJobBoardApplicantImport-ApplicantBlock-Buttons').hide();

			candidate.ContactId = lContactId;
			ctrlJobBoardApplicantImport.PromptToShortlistAfterSavingApplicantOrCandidate("Create New Candidate", candidate);
		};

		// Send data packet to server for storage
		ctrlJobBoardApplicantImport.SubmitCandidateRecord(candidate, "Creating", fnAfterSavingCandidateRecord);
	},

	// Existing Candidate Save Existing button
	UpdateExistingCandidateRecord: function ()
	{
		var candidate = ctrlJobBoardApplicantImport.GetSelectedExistingCandidate();
		if (!candidate)
		{
			TriSysApex.UI.ShowMessage("Unidentified candidate.");
			return;
		}
		var sFieldPrefix = 'ctrlJobBoardApplicantImport-form-duplicate-';

		candidate = ctrlJobBoardApplicantImport.ReadCandidateRecordBeforeSave(sFieldPrefix, candidate);
		if (!candidate)
			return;

		candidate.UpdateCandidate = true;

		// After saving candidate, do visuals and prompt for shortlisting
		var fnAfterUpdatingCandidateRecord = function (lContactId)
		{
			// After updating the existing candidate, hide the applicant details
			var applicantBlock = $('#ctrlJobBoardApplicantImport-ApplicantBlock');
			applicantBlock.hide();
			$('#ctrlJobBoardApplicantImport-DuplicateBlock').hide();
			var cvBlock = $('#ctrlJobBoardApplicantImport-CVBlock');
			var bCVBlockHidden = (cvBlock.css('display') == 'none');
			var sExistingBlockClass = bCVBlockHidden ? "col-md-12 col-lg-12" : "col-md-8 col-lg-8";
			var existingBlock = $('#ctrlJobBoardApplicantImport-SelectedDuplicateBlock');
			existingBlock.removeClass().addClass(sExistingBlockClass);
			$('#ctrlJobBoardApplicantImport-SelectedDuplicateBlock-Buttons').hide();

			candidate.ContactId = lContactId;
			ctrlJobBoardApplicantImport.PromptToShortlistAfterSavingApplicantOrCandidate("Update Existing Candidate", candidate);
		};

		// Send data packet to server for storage
		ctrlJobBoardApplicantImport.SubmitCandidateRecord(candidate, "Updating", fnAfterUpdatingCandidateRecord);
	},

	ReadCandidateRecordBeforeSave: function (sFieldPrefix, candidate)
	{
		candidate.Forenames = $('#' + sFieldPrefix + "Forenames").val();
		candidate.Surname = $('#' + sFieldPrefix + "Surname").val();
		candidate.MobileTelNo = $('#' + sFieldPrefix + "MobileTelNo").val();
		candidate.WorkTelNo = $('#' + sFieldPrefix + "WorkTelNo").val();
		candidate.PersonalEMail = $('#' + sFieldPrefix + "PersonalEMail").val();
		candidate.WorkEMail = $('#' + sFieldPrefix + "WorkEMail").val();
		candidate.HomeAddressStreet = $('#' + sFieldPrefix + "Street").val();
		candidate.HomeAddressCity = $('#' + sFieldPrefix + "City").val();
		candidate.HomeAddressCounty = $('#' + sFieldPrefix + "County").val();
		candidate.HomeAddressPostCode = $('#' + sFieldPrefix + "PostCode").val();
		candidate.HomeAddressCountry = TriSysSDK.CShowForm.GetTextFromCombo(sFieldPrefix + "Country");
		candidate.HomeAddressTelNo = $('#' + sFieldPrefix + "HomeTelNo").val();
		candidate.JobTitle = $('#' + sFieldPrefix + "JobTitle").val();

		candidate.Title = TriSysSDK.CShowForm.GetTextFromCombo(sFieldPrefix + "Title");
		candidate.Gender = TriSysSDK.CShowForm.GetTextFromCombo(sFieldPrefix + "Gender");
		candidate.ContactSource = TriSysSDK.CShowForm.GetTextFromCombo(sFieldPrefix + "ContactSource");
		candidate.TypeOfWorkRequired = TriSysSDK.CShowForm.GetSelectedSkillsFromList(sFieldPrefix + "TypeOfWorkRequired", null, true);

		candidate.DateOfBirth = $('#' + sFieldPrefix + "DateOfBirth").val();
		candidate.ContactPhoto = $('#' + sFieldPrefix + 'ContactPhoto').attr('src');

		candidate.CVFileRef = ctrlJobBoardApplicantImport.Data._CVServerPath;

		// Validate mandatory fields
		// Validate
		var sValidationError = null;
		if (!candidate.Forenames || !candidate.Surname)
			sValidationError = "must have a full name";
		else
		{
			if (candidate.Gender == '')
				sValidationError = "must have an assigned gender";
		}

		if (sValidationError)
		{
			TriSysApex.UI.ShowMessage("The candidate record " + sValidationError);
			return null;
		}

		// The CCreateFromCVAutoRecognitionRequest we use to save the data, has different field names to our job broadcaster interface, naturally!
		candidate.Street = candidate.HomeAddressStreet;
		candidate.City = candidate.HomeAddressCity;
		candidate.County = candidate.HomeAddressCity;
		candidate.PostCode = candidate.HomeAddressPostCode;
		candidate.Country = candidate.HomeAddressCountry;
		candidate.HomeTelNo = candidate.HomeAddressTelNo;

		candidate.ProcessSummary = "Job Board Applicant Import"

		return candidate;
	},

	// After user saved either the applicant or duplicate/existing candidate, prompt the user to shortlist now
	PromptToShortlistAfterSavingApplicantOrCandidate: function (sWhatHappened, candidate)
	{
		var fnYes = function ()
		{
			ctrlJobBoardApplicantImport.AddToShortlist();
			return true;
		};

		var fnNo = function ()
		{
			// User wants to hang on.
			// Do not let her edit the details again as this would complicate matters.
			$('#ctrlJobBoardApplicantImport-DuplicateBlock').hide();
			var duplicatesBlock = $('#ctrlJobBoardApplicantImport-SelectedDuplicateBlock');
			duplicatesBlock.hide();
			var applicantBlock = $('#ctrlJobBoardApplicantImport-ApplicantBlock');
			applicantBlock.hide();
			var cvBlock = $('#ctrlJobBoardApplicantImport-CVBlock');
			var bCVBlockHidden = (cvBlock.css('display') == 'none');
			if (!bCVBlockHidden)
				cvBlock.removeClass().addClass("col-md-12 col-lg-12");

			return true;
		};

		var sMessage = candidate.Forenames + " " + candidate.Surname + " has been saved as a candidate.<br />" +
			"Add to shortlist now?";
		TriSysApex.UI.questionYesNo(sMessage, sWhatHappened, "Yes", fnYes, "No", fnNo);
	},

	// Create the candidate and open the record
	SubmitCandidateRecord: function (CCreateFromCVAutoRecognitionRequest, sProcess, fnCallback)
	{
		var payloadObject = {};

		payloadObject.URL = "Contact/CreateFromCVAutoRecognition";

		payloadObject.OutboundDataPacket = CCreateFromCVAutoRecognitionRequest;

		payloadObject.InboundDataFunction = function (CCreateFromCVAutoRecognitionResponse)
		{
			TriSysApex.UI.HideWait();

			if (CCreateFromCVAutoRecognitionResponse)
			{
				if (CCreateFromCVAutoRecognitionResponse.Success)
				{
					ctrlJobBoardApplicantImport.Data._SelectedContactId = CCreateFromCVAutoRecognitionResponse.ContactId;
					ctrlJobBoardApplicantImport.Data._ImportedCandidateName = CCreateFromCVAutoRecognitionRequest.Forenames + ' ' + CCreateFromCVAutoRecognitionRequest.Surname;

					fnCallback(CCreateFromCVAutoRecognitionResponse.ContactId);
				}
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
			TriSysApex.UI.ErrorHandlerRedirector('ctrlJobBoardApplicantImport.SubmitCandidateRecord: ', request, status, error);
		};

		TriSysApex.UI.ShowWait(null, sProcess + " Candidate...");
		TriSysAPI.Data.PostToWebAPI(payloadObject);
	},

	// When duplicates are resolved, add new or existing candidate to the shortlist
	AddToShortlist: function ()
	{
		var lContactId = ctrlJobBoardApplicantImport.Data._SelectedContactId;
		var sName = ctrlJobBoardApplicantImport.Data._ImportedCandidateName;
		var sJobBoard = $('#ctrlJobBoardApplicantImport-Channel').html();

		if (!sName)
		{
			TriSysApex.UI.ShowMessage("Please create a new candidate, or save an existing record before shortlisting.");
			return;
		}

		// Add to shortlist and refresh this in the requirement form
		ctrlJobBoardApplicants.AddToShortlistCandidateAfterImport(lContactId, sName, sJobBoard);

		// Close this popup
		TriSysApex.UI.CloseModalPopup();
	},

	Data:		// ctrlJobBoardApplicantImport.Data
	{
		_Requirement: null,
		_Applicant: null,
		_PotentialDuplicateCandidates: null,
		_CVServerPath: null,
		_SelectedContactId: 0,
		_ImportedCandidateName: null,

		Set: function (requirement, applicant, potentialDuplicateCandidates, sCVServerPath)
		{
			ctrlJobBoardApplicantImport.Data._Requirement = requirement;
			ctrlJobBoardApplicantImport.Data._Applicant = applicant;
			ctrlJobBoardApplicantImport.Data._PotentialDuplicateCandidates = potentialDuplicateCandidates;
			ctrlJobBoardApplicantImport.Data._CVServerPath = sCVServerPath;
		},

		GetDuplicateCandidate: function (lContactId)		// ctrlJobBoardApplicantImport.Data.GetDuplicateCandidate
		{
			if (ctrlJobBoardApplicantImport.Data._PotentialDuplicateCandidates)
			{
				for (var i = 0; i < ctrlJobBoardApplicantImport.Data._PotentialDuplicateCandidates.length; i++)
				{
					var candidate = ctrlJobBoardApplicantImport.Data._PotentialDuplicateCandidates[i];
					if (candidate.ContactId == lContactId)
						return candidate;
				}
			}
		},

		OpenApplicantCV: function ()
		{
			var sCVServerPath = ctrlJobBoardApplicantImport.Data._CVServerPath;
			if (sCVServerPath)
			{
				// Sep 2018 and we have live editing of word documents!
				TriSysApex.Pages.FileManagerForm.FileOpenDrillDown(sCVServerPath);
				//var applicant = ctrlJobBoardApplicantImport.Data._Applicant;
				//TriSysSDK.Controls.FileManager.GetOpenFileURLFromWebService(applicant.Name, sCVServerPath, applicant.Name);
			}
		}
	},

	AllowDropPhoto: function (ev)
	{
		ev.preventDefault();
	},

	DropPhoto: function (ev, sField)
	{
		ev.preventDefault();
		var sImageURL = ev.dataTransfer.getData("text");

		if (ev.dataTransfer.files)
		{
			if (ev.dataTransfer.files.length > 0)
			{
				var myFile = ev.dataTransfer.files[0];

				// The callback when the file has been uploaded
				var fnCallback = function (myUploadedServerFilePath)
				{
					var fnDisplayImage = function (sURL)
					{
						$(ev.target).attr('src', sURL);
					};
					TriSysSDK.FileUpload.AfterUploadingAFileMoveItAndGetExternalURL(myUploadedServerFilePath, fnDisplayImage, true);

					return;

					// This code is no good because security disables viewing the https://api.trisys.co.uk/upload folder
					sImageURL = TriSysAPI.Constants.SecureURL + 'upload/' + myUploadedServerFilePath.replace(/\\/g, '/');
					$(ev.target).attr('src', sImageURL);
					//$('#' + sField).attr('src', sImageURL);
				};

				// Upload the file through the standard route
				TriSysSDK.Controls.FileManager.UploadFile(myFile, fnCallback);

				return;
			}
		}

		$(ev.target).attr('src', sImageURL);
		//$('#' + sField).attr('src', sImageURL);
	},

	InitialiseZoomSlider: function (sSuffix, fnChange)
	{
		var slider = $("#ctrlJobBoardApplicantImport-form-slider" + sSuffix).kendoSlider({
			increaseButtonTitle: "Right",
			decreaseButtonTitle: "Left",
			min: 25,
			max: 400,
			smallStep: 25,
			largeStep: 50,
			change: fnChange
		}).data("kendoSlider");


		// Kludge for width
		setTimeout(ctrlJobBoardApplicantImport.KludgeSlider, 100);
	},

	KludgeSlider: function ()
	{
		var slider = $("#ctrlJobBoardApplicantImport-form-slider").getKendoSlider();
		slider.wrapper.css("width", ctrlJobBoardApplicantImport.GetViewerAndSliderWidth(false, ''));
		slider.resize();
	},

	// Some components need explicit widths i.e. they cannot use 100%
	GetViewerAndSliderWidth: function (bReduceFactorise, sSuffix)
	{
		var iWidth = $('#ctrlJobBoardApplicantImport-cv-viewer-block' + sSuffix).width();

		if (bReduceFactorise)
			iWidth -= 70;

		return iWidth;
	},

	ZoomCVViewer: function (e)
	{
		ctrlJobBoardApplicantImport.ZoomCVViewerEventHandler(e, '');
	},	

	ZoomCVViewerEventHandler: function (e, sSuffix)
	{
		var fZoom = (e.value / 100);
		var lFixedHeight = 822;

		var viewers = ['ctrlJobBoardApplicantImport-document-viewer-converted-contents' + sSuffix];
		for (var i = 0; i < viewers.length; i++)
		{
			var viewer = viewers[i];
			var viewerDOMObject = $('#' + viewer);
			if (viewerDOMObject.css('display') != 'none')
			{
				var lHeight = viewerDOMObject.height();
				var iTime = 400;
				viewerDOMObject.animate({ zoom: fZoom, height: lFixedHeight / fZoom }, 400);				
			}
		}
	}

};	// ctrlJobBoardApplicantImport
