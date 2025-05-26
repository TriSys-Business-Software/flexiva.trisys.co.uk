var ContactUs =
{
    Load: function ()
    {
        // Load the currently logged in subscriber details into the fields, if logged in of course!

        var userCredentials = TriSysApex.LoginCredentials.UserCredentials();
        if (userCredentials && userCredentials.LoggedInUser)
        {
            var sForenameAndSurname = '', sCompanyName = '', sFullName = '', sWorkTelNo = '';

            var contact = userCredentials.LoggedInUser.Contact;
            if (contact)
            {
                sForenameAndSurname = userCredentials.LoggedInUser.ForenameAndSurname;
                sCompanyName = contact.CompanyName;
                sFullName = userCredentials.LoggedInUser.FullName;
                sWorkTelNo = contact.WorkTelNo;
            }
            else
            {
                var contactCRM = userCredentials.LoggedInUser.CRMContact;
                if(contactCRM)
                {
                    sForenameAndSurname = contactCRM.FullName;
                    sCompanyName = contactCRM.CompanyName;
                    sFullName = contactCRM.WorkEMail;
                    sWorkTelNo = contactCRM.WorkTelNo;
                }
            }
        }        

        $('#txtContactUsName').val(sForenameAndSurname);
        $('#txtContactUsCompany').val(sCompanyName);
        $('#txtContactUsEMail').val(sFullName);
        $('#txtContactUsPhone').val(sWorkTelNo);
    },

    SubmitButtonClick: function ()
    {
        var sName = $('#txtContactUsName').val();
        var sCompany = $('#txtContactUsCompany').val();
        var sEMail = $('#txtContactUsEMail').val();
        var sPhone = $('#txtContactUsPhone').val();
        var sMessage = $('#txtContactUsMessage').val();

        // Validate mandatory data
        var lstErrors = [];
        if (!sName) lstErrors.push({Message: "Please supply your name.", ID: '#txtContactUsName' });
        if (!TriSysApex.LoginCredentials.validateEmail(sEMail)) lstErrors.push({Message: "Please supply a valid e-mail address.", ID: '#txtContactUsEMail' });
        if (!sPhone) lstErrors.push({Message: "Please supply a phone number.", ID: '#txtContactUsPhone' });
        if (!sMessage) lstErrors.push({Message: "Please supply a message.", ID: '#txtContactUsMessage' });

        if (lstErrors.length > 0)
        {
            TriSysApex.TourGuide.ShowFormErrorsAsATourGuide(TriSysApex.Copyright.ShortProductName + " Contact Us", lstErrors);
            return;
        }

        if (!TriSysPhoneGap.isConnectedToComms(true, "contact us"))
            return false;

        var fnRedirect = function ()
        {
            // Clear last message but leave other fields visible
            $('#txtContactUsMessage').val('');

            return true;
        };

        ContactUs.SendToWebAPI(sName, sCompany, sEMail, sPhone, sMessage, fnRedirect);
    },

    SendToWebAPI: function (sName, sCompany, sEMail, sPhone, sMessage, fnCallback)
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

        // Bundle up into a JSON object for transfer across the wire
        var CEnquiryRequest = {
            'Fields': [
                {
                    'Name': 'Forename',
                    'Value': sForenames
                },
                {
                    'Name': 'Surname',
                    'Value': sSurname
                },
                {
                    'Name': 'Company',
                    'Value': sCompany
                },
                {
                    'Name': 'EMail',
                    'Value': sEMail
                },
                {
                    'Name': 'WorkTelNo',
                    'Value': sPhone
                },
                {
                    'Name': 'Message',
                    'Value': sMessage
                },
                {
                    'Name': 'EnquiryType',
                    'Value': 'Apex Contact Us'
                }
            ],
            'TemplateName': 'trisys-apex-contactus-response.html',	// See N:\Documents\TriSys Web Templates
            'TableName': 'CallbackWebRequest',
            'TriSysCRM': true,
            'WhiteLabelled': TriSysApex.Constants.WhiteLabelled
        };

        var userCredentials = TriSysApex.LoginCredentials.UserCredentials();
        if (userCredentials && userCredentials.LoggedInUser)
        {
            var contactCRM = userCredentials.LoggedInUser.CRMContact;

            if (contactCRM && contactCRM.ContactId > 0)
            {
                CEnquiryRequest.Fields.push({
                    Name: 'ContactId',
                    Value: contactCRM.ContactId,
                    Type: 'integer'
                });
            }
        }

        // Send this data packet to the API for processing
        TriSysApex.UI.ShowWait(null, "Sending Message...");

        var payloadObject = {};
        payloadObject.URL = "Enquiry/EnquiryRequest";
        payloadObject.OutboundDataPacket = CEnquiryRequest;
        payloadObject.InboundDataFunction = function (CEnquiryResponse)
        {
            if (CEnquiryResponse)
            {
                TriSysApex.UI.HideWait();

                if (CEnquiryResponse.Success)
                {
                    TriSysApex.UI.ShowMessage("Thank you for contacting us. Your message has been sent to our account management team.",
                            TriSysApex.Copyright.ShortProductName, fnCallback);
                }
                else
                {
                    TriSysApex.UI.ShowMessage(CEnquiryResponse.ErrorMessage, TriSysApex.Copyright.ShortProductName);
                }
            }

            return true;
        };
        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.ErrorHandlerRedirector('ContactUs.SendToWebAPI: ', request, status, error);
        };
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    }
};

$(document).ready(function ()
{
    ContactUs.Load();
});