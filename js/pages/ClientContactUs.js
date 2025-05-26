var ClientContactUs =
{
    Load: function ()
    {
        // Load the currently logged in Client details into the fields, if logged in of course!
        var fnPopulate = function (Client)
        {
            $('#txtClientContactUsName').val(Client.Forenames + ' ' + Client.Surname);
            $('#txtClientContactUsEMail').val(Client.WorkEMail);
            $('#txtClientContactUsPhone').val(Client.WorkTelNo);
        };
        TriSysWebJobs.ContactUs.LoadLoggedInUserDetails(fnPopulate, false);

        if (!TriSysWebJobs.Constants.ClientContactUsPageHeaderVisible)
            $('#ClientContactUsPageHeader').hide();

        if (TriSysWebJobs.Constants.TransparentBackground)
        {
            setTimeout(function ()
            {
                $('#ClientContactUsBlockFull').css("border", 'none');
                TriSysWebJobs.Frame.BlockFullTransparent();
                $('#ClientContactUsBlock').css("background-color", "white");

            }, 1500);
        }
    },

    SubmitButtonClick: function ()
    {
        var sName = $('#txtClientContactUsName').val();
        var sEMail = $('#txtClientContactUsEMail').val();
        var sPhone = $('#txtClientContactUsPhone').val();
        var sMessage = $('#txtClientContactUsMessage').val();

        // Validate mandatory data
        var sError = '';
        if (!sName) sError += "Please supply your name." + '<br />';
        if (!TriSysApex.LoginCredentials.validateEmail(sEMail) && !sPhone)
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
            $('#txtClientContactUsMessage').val('');

            if (TriSysWebJobs.Constants.LoggedInAsClient)
            {
                // Called after message is sent and the user is shown a confirmation popup
                TriSysApex.FormsManager.OpenForm(TriSysWebJobs.Constants.ClientVacanciesForm, 0, true);
            }

            return true;
        };

        ClientContactUs.SendToWebAPI(sName, sEMail, sPhone, sMessage, fnRedirect);
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
        var sTypeOfEnquiry = 'Client';

        // Bundle up into a JSON object for transfer across the wire
        var CEnquiryContactUsRequest = {
            //Title: sTitle,
            Forenames: sForenames,
            Surname: sSurname,
            //Company: sCompany,
            //HomeTelNo: sHomeTelNo,
            WorkTelNo: sPhone,
            //PersonalMobile: sPhone,
            //WorkMobile: sWorkMobile,
            WorkEMail: sEMail,
            //PersonalEMail: sEMail,
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
            TriSysApex.UI.ErrorHandlerRedirector('ClientContactUs.SendToWebAPI: ', request, status, error);
        };
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    }
};

$(document).ready(function ()
{
    ClientContactUs.Load();
});