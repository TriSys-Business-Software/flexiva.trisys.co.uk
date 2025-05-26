var CandidateContactUs =
{
    Load: function ()
    {
        // Load the currently logged in candidate details into the fields, if logged in of course!
        var fnPopulate = function (candidate)
        {
            $('#txtCandidateContactUsName').val(candidate.Forenames + ' ' + candidate.Surname);
            $('#txtCandidateContactUsEMail').val(candidate.PersonalEMail);
            $('#txtCandidateContactUsPhone').val(candidate.MobileTelNo);
        };
        TriSysWebJobs.ContactUs.LoadLoggedInUserDetails(fnPopulate, true);

        if (!TriSysWebJobs.Constants.CandidateContactUsPageHeaderVisible)
            $('#CandidateContactUsPageHeader').hide();

        if (TriSysWebJobs.Constants.TransparentBackground)
        {
            setTimeout(function ()
            {
                $('#CandidateContactUsBlockFull').css("border", 'none');
                TriSysWebJobs.Frame.BlockFullTransparent();
                $('#CandidateContactUsBlock').css("background-color", "white");

            }, 1500);
        }
    },

    SubmitButtonClick: function()
    {
        var sName = $('#txtCandidateContactUsName').val();
        var sEMail = $('#txtCandidateContactUsEMail').val();
        var sPhone = $('#txtCandidateContactUsPhone').val();
        var sMessage = $('#txtCandidateContactUsMessage').val();

        // Validate mandatory data
        var sError = '';
        if (!sName) sError += "Please supply your name." + '<br />';
        if (!TriSysApex.LoginCredentials.validateEmail(sEMail) && sPhone)
            sError += "Please supply either an e-mail address or phone number." + '<br />';
        if (!sMessage) sError += "Please supply a message." + '<br />';

        if (sError.length > 1)
        {
            TriSysApex.UI.ShowMessage(sError, TriSysWebJobs.Constants.ApplicationName);
            return;
        }

        var fnRedirect = function ()
        {
            // Clear last message but leave other fields visible
            $('#txtCandidateContactUsMessage').val('');

            // Called after message is sent and the user is shown a confirmation popup
			var fnRedirect = function ()
			{
				// Does the TriSysWebJobs.Constants.CandidateVacancySearchForm exist in the forms.json?
				var sForm = TriSysWebJobs.Constants.CandidateVacancySearchForm;
				var pageConfig = TriSysApex.FormsManager.getPageConfig(sForm);
				if (pageConfig)
					TriSysApex.FormsManager.OpenForm(sForm, 0, true);
			};
			setTimeout(fnRedirect, 10);
            return true;
        };

        CandidateContactUs.SendToWebAPI(sName, sEMail, sPhone, sMessage, fnRedirect);
    },

    SendToWebAPI: function (sName, sEMail, sPhone, sMessage, fnCallback)
    {
        var parts = sName.split(" ");
        var sForenames = parts[0];
        var sSurname = parts.length > 1 ? parts[1] : '?';
        if (parts.length > 2)
        {
            for (var i = 2; i < parts.length; i++)
            {
                var sPart = parts[i];
                sSurname += ' ' + sPart;
            }
        }
        var sTypeOfEnquiry = 'Candidate/Job Seeker';

        // Bundle up into a JSON object for transfer across the wire
        var CEnquiryContactUsRequest = {
            //Title: sTitle,
            Forenames: sForenames,
            Surname: sSurname,
            //Company: sCompany,
            //HomeTelNo: sHomeTelNo,
            //WorkTelNo: sWorkTelNo,
            PersonalMobile: sPhone,
            //WorkMobile: sWorkMobile,
            //WorkEMail: sWorkEMail,
            PersonalEMail: sEMail,
            TypeOfEnquiry: sTypeOfEnquiry,
            Message: sMessage,

            WebJobsRequest: TriSysWebJobs.Agency.WebJobsRequest()
        };

        // Send this data packet to the API for processing
        TriSysApex.UI.ShowWait(null, "Sending Message...");

        var payloadObject = {};
        payloadObject.URL = "Enquiry/ContactUs";
        payloadObject.OutboundDataPacket = CEnquiryContactUsRequest;
        payloadObject.InboundDataFunction = function (CEnquiryContactUsResponse)
        {
            if (CEnquiryContactUsResponse)
            {
                TriSysApex.UI.HideWait();

                if (CEnquiryContactUsResponse.Success)
                {
                    TriSysApex.UI.ShowMessage(TriSysSDK.Resources.Message("TriSysWeb.Pages.ContactUs.SendToAPI.Success"),
                            TriSysWebJobs.Constants.ApplicationName, fnCallback);
                }
                else
                {
                    var sErrorMessage = TriSysSDK.Resources.Message("TriSysWeb.Pages.ContactUs.SendToAPI.Failure");
                    sErrorMessage = sErrorMessage.replace('##EMail##', TriSysWebJobs.Agency.EMail);
                    TriSysApex.UI.ShowMessage(sErrorMessage, TriSysWebJobs.Constants.ApplicationName);
                }
            }

            return true;
        };
        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.ErrorHandlerRedirector('CandidateContactUs.SendToWebAPI: ', request, status, error);
        };
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    }
};

$(document).ready(function ()
{
    CandidateContactUs.Load();
});