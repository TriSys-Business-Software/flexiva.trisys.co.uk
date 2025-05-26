var ctrlJobBoardApplicants =
{
	_RequirementId: 0,

    Load: function (requirement)
	{
		ctrlJobBoardApplicants._RequirementId = requirement.RequirementId;
		$('#ctrlJobBoardApplicants-Requirement').html(requirement.Reference);
		$('#ctrlJobBoardApplicants-JobTitle').html(requirement.JobTitle);
		$('#ctrlJobBoardApplicants-JobBroadcaster').html(requirement.JobBroadcaster);

		TriSysSDK.FormMenus.DrawGridMenu('ctrlJobBoardApplicants-GridMenu', 'ctrlJobBoardApplicants-DataGrid');

		setTimeout(TriSysProUI.kendoUI_Overrides, 250);

		// OK, let us go and get the data from the web service
		ctrlJobBoardApplicants.ReadApplicantsFromJobBroadcaster(requirement);

		// Make sure we can scroll a large grid
		var iFudgeFactor = 450;
		var lHeight = $(window).height() - iFudgeFactor;
		$('#ctrlJobBoardApplicants-GridScroller').height(lHeight);
	},

	ReadApplicantsFromJobBroadcaster: function (requirement)
	{
		var CReadApplicantsRequest = {
			Reference: requirement.Reference,
			JobBroadcaster: requirement.JobBroadcaster
		};

		var payloadObject = {};

		// Call the API to submit the data to the server
		payloadObject.URL = "JobBroadcaster/ReadApplicants";

		payloadObject.OutboundDataPacket = CReadApplicantsRequest;

		payloadObject.InboundDataFunction = function (CReadApplicantsResponse)
		{
			TriSysApex.UI.HideWait();

			if (CReadApplicantsResponse)
			{
				if (CReadApplicantsResponse.Success)
				{
					ctrlJobBoardApplicants._BroadcasterJobURL = CReadApplicantsResponse.BroadcasterJobURL;
					ctrlJobBoardApplicants.PopulateGrid(CReadApplicantsResponse.Applicants);
				}
				else
				{
					var sError = CReadApplicantsResponse.ErrorMessage;
					if (!sError)
						sError = "No applicants identified via " + requirement.JobBroadcaster;
					TriSysApex.UI.ShowMessage(sError);
				}
			}
		};

		payloadObject.ErrorHandlerFunction = function (request, status, error)
		{
			TriSysApex.UI.HideWait();
			TriSysApex.UI.errorAlert('ctrlJobBoardApplicants.ReadApplicantsFromJobBroadcaster: ' + status + ": " + error + ". responseText: " + request.responseText);
		};

		TriSysApex.UI.ShowWait(null, "Reading Applicants...");
		TriSysAPI.Data.PostToWebAPI(payloadObject);
	},

	PopulateGrid: function (applicants)
	{
		// Pre-process flag images
		if (!applicants)
			return;

		// Add the correct colour flag
		for (var i = 0; i < applicants.length; i++)
		{
			var applicant = applicants[i];

			// Id starts at 0!
			applicant.Applicant_Id += 1;

			// Flags
			applicant.Flag = 'white';
			switch (applicant.Rank)
			{
				case 'UnSuitable':
					applicant.Flag = 'red';
					break;

				case 'MaybeSuitable':
					applicant.Flag = 'yellow';
					break;

				case 'Suitable':
					applicant.Flag = 'green';
					break;
			}
		}

		// Sort by application date descending, then surname
		applicants.sort(function (a, b)
		{
			return (b.ApplicationTime > a.ApplicationTime);
		});

		// Save applicants for buttons
		ctrlJobBoardApplicants._Applicants = applicants;

		// Draw in grid
		var sDivTag = 'ctrlJobBoardApplicants-DataGrid';
		var sGridName = sDivTag + '-GridInstance';

		TriSysSDK.Grid.VirtualMode({
			Div: sDivTag,
			ID: sGridName,
			Title: "Applicants",
			RecordsPerPage: TriSysApex.UserOptions.RecordsPerPage(),
			PopulationByObject: applicants,
			Columns: [
				{ field: "Applicant_Id", title: "Applicant_Id", type: "number", width: 70, hidden: true },
				{ field: "Suitability", title: ' ', template: '<img src="images/trisys/72x72/flag-#= Flag #.png?ts=201803221020" style="width: 24px; height: 24px;" alt="#= Flag #">', width: 35, filterable: false },
				{ field: "Name", title: "Applicant Name", type: "string" },
				{ field: "ApplicationTime", title: "Applied", type: "date", format: "{0:dd MMM yyyy }", width: 100 },
				{ field: "Email", title: "E-Mail", type: "string" },
				{ field: "HomeTelNo", title: "Home Tel No", type: "string", hidden: true },
				{ field: "WorkTelNo", title: "Work Tel No", type: "string", hidden: true },
				{ field: "MobileTelNo", title: "Mobile Tel No", type: "string", hidden: true },
				{ field: "ChannelName", title: "Channel", type: "string" },
				{ field: "Rank", title: "Rank", type: "string", hidden: true }
			],

			KeyColumnName: "Applicant_Id",
			MultiRowSelect: true,
			Grouping: false
		});
	},

	// Having retrieved them, we want to keep them
	_Applicants: null,

	GetSelectedSingletonApplicantIdFromGrid: function ()
	{
		var lApplicantId = TriSysSDK.Grid.GetSelectedSingletonRowRecordIdFromGrid('ctrlJobBoardApplicants-DataGrid', "Applicant_Id", "applicant");
		return lApplicantId;
	},

	GetApplicant: function (lApplicantId)
	{
		var applicants = ctrlJobBoardApplicants._Applicants;
		if (applicants)
		{
			for (var i = 0; i < applicants.length; i++)
			{
				var applicant = applicants[i];

				if (applicant.Applicant_Id == lApplicantId)
					return applicant;
			}
		}

		return null;
	},

	OpenCV: function ()
	{
		var lApplicantId = ctrlJobBoardApplicants.GetSelectedSingletonApplicantIdFromGrid();
		if (!lApplicantId)
			return;

		var applicant = ctrlJobBoardApplicants.GetApplicant(lApplicantId);
		if (!applicant)
			return;

		// Send this CV to the server to be shown as a document
		if (!applicant.Doc_Text || !applicant.FileName)
		{
			TriSysApex.UI.ShowMessage("No CV supplied by " + applicant.Name);
			return;
		}

		var CGenerateApplicantCVRequest = {
			Base64: applicant.Doc_Text,
			FileName: applicant.FileName,
			JobBroadcaster: $('#ctrlJobBoardApplicants-JobBroadcaster').html()
		};

		var payloadObject = {};

		// Call the API to submit the data to the server
		payloadObject.URL = "JobBroadcaster/GenerateApplicantCV";

		payloadObject.OutboundDataPacket = CGenerateApplicantCVRequest;

		payloadObject.InboundDataFunction = function (CGenerateApplicantCVResponse)
		{
			TriSysApex.UI.HideWait();

			if (CGenerateApplicantCVResponse)
			{
				if (CGenerateApplicantCVResponse.Success)
				{
					// Sep 2018 and we have live editing of word documents!
					TriSysApex.Pages.FileManagerForm.FileOpenDrillDown(CGenerateApplicantCVResponse.ServerFilePath);
					//TriSysSDK.Controls.FileManager.GetOpenFileURLFromWebService(applicant.Name, CGenerateApplicantCVResponse.ServerFilePath, applicant.Name);
				}
				else
					TriSysApex.UI.ShowMessage(CGenerateApplicantCVResponse.ErrorMessage);
			}
		};

		payloadObject.ErrorHandlerFunction = function (request, status, error)
		{
			TriSysApex.UI.HideWait();
			TriSysApex.UI.errorAlert('ctrlJobBoardApplicants.OpenCV: ' + status + ": " + error + ". responseText: " + request.responseText);
		};

		TriSysApex.UI.ShowWait(null, "Generating CV...");
		TriSysAPI.Data.PostToWebAPI(payloadObject);
	},

	AddToShortlist: function ()
	{
		var lApplicantId = ctrlJobBoardApplicants.GetSelectedSingletonApplicantIdFromGrid();
		if (!lApplicantId)
			return;

		var applicant = ctrlJobBoardApplicants.GetApplicant(lApplicantId);
		if (!applicant)
			return;

		var CImportApplicantRequest = {
			Applicant: applicant,
			JobBroadcaster: $('#ctrlJobBoardApplicants-JobBroadcaster').html()
		};

		var payloadObject = {};

		// Call the API to submit the data to the server
		payloadObject.URL = "JobBroadcaster/ImportApplicant";

		payloadObject.OutboundDataPacket = CImportApplicantRequest;

		payloadObject.InboundDataFunction = function (CImportApplicantResponse)
		{
			TriSysApex.UI.HideWait();

			if (CImportApplicantResponse)
			{
				if (CImportApplicantResponse.Success)
				{
					// This will open the import form and call us back to add the new/updated candidate
					ctrlJobBoardApplicants.OpenApplicantImportPopup(applicant, CImportApplicantResponse.PotentialDuplicates, CImportApplicantResponse.CVServerPath);

					// Leave this form open to process more candidates
				}
				else
					TriSysApex.UI.ShowMessage(CImportApplicantResponse.ErrorMessage);
			}
		};

		payloadObject.ErrorHandlerFunction = function (request, status, error)
		{
			TriSysApex.UI.HideWait();
			TriSysApex.UI.errorAlert('ctrlJobBoardApplicants.AddToShortlist: ' + status + ": " + error + ". responseText: " + request.responseText);
		};

		TriSysApex.UI.ShowWait(null, "Importing Applicant...");
		TriSysAPI.Data.PostToWebAPI(payloadObject);
	},

	OpenApplicantImportPopup: function (applicant, potentialDuplicateCandidates, sCVServerPath)
	{
		var requirement = {
			RequirementId: TriSysApex.Pages.RequirementForm.RequirementId,
			Reference: $('#ctrlJobBoardApplicants-Requirement').html(),
			JobTitle: $('#ctrlJobBoardApplicants-JobTitle').html(),
			JobBroadcaster: $('#ctrlJobBoardApplicants-JobBroadcaster').html()
		};

		var fnLoadModal = function ()
		{
			var parametersObject = new TriSysApex.UI.ShowMessageParameters();
			parametersObject.Title = "Job Board Applicant Import";
			parametersObject.FullScreen = true;
			parametersObject.Image = "gi-parents";

			// And we want drag/drop of the fields to be enabled hence switch off modal popup dragging
			parametersObject.Draggable = false;

			// Full screenies should have a close in case we lose bottom buttons
			parametersObject.CloseTopRightButton = true;

			parametersObject.ContentURL = TriSysApex.CustomFormsAndComponents.UserControlPath('ctrlJobBoardApplicantImport.html');

			// Buttons
			parametersObject.ButtonLeftVisible = true;
			parametersObject.ButtonLeftText = "Add to Shortlist";
			parametersObject.ButtonLeftFunction = function ()
			{
				ctrlJobBoardApplicantImport.AddToShortlist();
				return false;
			};
			parametersObject.ButtonRightVisible = true;
			parametersObject.ButtonRightText = "Close";
			parametersObject.ButtonRightFunction = function ()
			{
				return true;
			};

			// Callback
			parametersObject.OnLoadCallback = function ()
			{
				ctrlJobBoardApplicantImport.Load(requirement, applicant, potentialDuplicateCandidates, sCVServerPath);
			};

			TriSysApex.UI.PopupMessage(parametersObject);
		};

		TriSysApex.WhiteLabelling.LoadJavascriptFile('js/pages/ctrlJobBoardApplicantImport.js', null, fnLoadModal);
	},

	_BroadcasterJobURL: null,

	OpenJobAdvert: function ()
	{
		if (ctrlJobBoardApplicants._BroadcasterJobURL)
		{
			// Open another web browser tab to show job
			TriSysSDK.Browser.OpenURL(ctrlJobBoardApplicants._BroadcasterJobURL);
		}
	},

	// Called by ctrlJobBoardApplicantImport
	AddToShortlistCandidateAfterImport: function (lContactId, sCandidateName, sJobBoard)
	{
		// What to do after linking the candidate to the vacancy
		var fnCallback = function ()
		{
			// Refresh the requirement shortlist to show the shortlisted candidate in the grid
			ctrlRequirementForm.PopulateCandidateGrid('requirementForm-ShortlistGrid', false, true);

			// Confirm to user with a toaster because other dialogue may still be open
			TriSysApex.Toasters.Information(sCandidateName + " has been added to the shortlist.");
		};

		var CAddToShortlistRequest = {
			RequirementId: ctrlJobBoardApplicants._RequirementId,
			ContactId: lContactId,
			JobBroadcaster: $('#ctrlJobBoardApplicants-JobBroadcaster').html(),
			JobBoard: sJobBoard
		};

		var payloadObject = {};

		// Call the API to submit the data to the server
		payloadObject.URL = "JobBroadcaster/AddToShortlist";

		payloadObject.OutboundDataPacket = CAddToShortlistRequest;

		payloadObject.InboundDataFunction = function (CAddToShortlistResponse)
		{
			if (CAddToShortlistResponse)
			{
				if (CAddToShortlistResponse.Success)
				{
					fnCallback();

					// Leave this form open to process more candidates
				}
				else
					TriSysApex.UI.ShowMessage(CAddToShortlistResponse.ErrorMessage);
			}
		};

		payloadObject.ErrorHandlerFunction = function (request, status, error)
		{
			TriSysApex.UI.errorAlert('ctrlJobBoardApplicants.AddToShortlist: ' + status + ": " + error + ". responseText: " + request.responseText);
		};

		TriSysAPI.Data.PostToWebAPI(payloadObject);
	}

};	// ctrlJobBoardApplicants
