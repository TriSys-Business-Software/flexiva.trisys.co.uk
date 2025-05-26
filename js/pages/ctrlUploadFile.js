var ctrlUploadFile =
{
    // 22 Aug 2023: Centralised file upload, upload file, fileupload, max size, maximum size
    MaximimUploadSizeMb: 25,

    Load: function()
    {
        // 07 Oct 2022: Custom image for upload
        ctrlUploadFile.CustomerSpecificUploadImage();

        var cloud = $('#trisys-upload-cloud-storage-picker');
        cloud.on('click', function (e)
        {
            // New Filepicker.io V3 April 2017, new key 13 July 2021
            var client = filestack.init('A70NMMP6bQx2Tl3g2sIAQz');  //, { policy: 'policy', signature: 'signature' });

            var iMegabytes = ctrlUploadFile.MaximimUploadSizeMb;
            var iMaxSize = 1024 * 1024 * iMegabytes;      /* was 10Mb, now 20Mb */ /* 21 Aug 2023: 25Mb */

            // Close this modal dialogue as the one below is modal also
            TriSysApex.UI.CloseModalPopup();

            //debugger;

            //// New V3: https://www.filestack.com/docs/uploads/pickers/web/#upload-options
            // Piece of shit!
            //const options = {
            //    uploadConfig: {
            //        retry: 2,
            //        timeout: 60000
            //    },
            //    fromSources: ['url', 'imagesearch', 'webcam', 'googledrive', 'dropbox', 'gmail',
            //          'onedrive', 'facebook', 'instagram', 'picasa', 'box', 'evernote', 'flickr', 'github', 'clouddrive'
            //    ],
            //    maxSize: iMaxSize,
            //    maxFiles: 1
            //};

            //try
            //{
            //    client.picker(options).open().then(function (result)
            //    {
            //        //console.log(JSON.stringify(result.filesUploaded))
            //        if (result.filesUploaded) {
            //            if (result.filesUploaded.length > 0)
            //                ctrlUploadFile.UploadFileURL(result.filesUploaded[0]);
            //        }
            //    });

            //} catch (e) {
            //    // When adding the 'url' source, we get this error
            //    TriSysApex.Logging.LogMessage(TriSysApex.Logging.CatchVariableToText(e));
            //}



            // Old V2 interface not working today 22 Aug 2022 for google photos or indeed any of the 3rd party cloud services
            var lstService = ['url', 'webcam', 'imagesearch'  /*, 'googledrive', 'dropbox', 'gmail',
                      'onedrive', 'facebook', 'instagram', 'picasa', 'box', 'evernote', 'flickr', 'github', 'clouddrive'*/
            ];

            try
            {
                client.pick({
                    preferLinkOverStore: true,
                    maxSize: iMaxSize,
                    maxFiles: 1,

                    // Removed 'local_file_system' on 28 Feb 2021 as we already have a local file picker which users should be using
                    // We may even be able to downgrade this to FREE, saving $500 per year
                    fromSources: lstService
                }).then(function (result)
                {
                    //console.log(JSON.stringify(result.filesUploaded))
                    if (result.filesUploaded)
                    {
                        if (result.filesUploaded.length > 0)
                            ctrlUploadFile.UploadFileURL(result.filesUploaded[0]);
                    }
                });

                // Hack the labels - no workie!
                //var fnChangeLabelsInFilePicker = function ()
                //{
                //    //document.querySelector("body > div:nth-child(110) > div > div.fsp-modal > div.fsp-modal__sidebar > div > div.fsp-source-list__item.active > span.fsp-source-list__icon.fsp-icon.fsp-icon--url")
                //    $("span.fsp-source-list__icon.fsp-icon.fsp-icon--url").siblings[0].text("URL");
                //};
                //setTimeout(fnChangeLabelsInFilePicker, 2000);


            } catch (e)
            {
                // When adding the 'url' source, we get this error
                TriSysApex.Logging.LogMessage(TriSysApex.Logging.CatchVariableToText(e));
            }
        });

        // 22 Aug 2022: Drop area themed colour
        var sThemedColour = TriSysProUI.ThemedColour();    // '#0B85A';
        $('#trisys-upload-dragandrophandler').css('border', '2px dotted ' + sThemedColour).css('border-radius', '8px');

        // Our own file upload handler
        var obj = $("#trisys-upload-dragandrophandler");

        obj.on('click', function (e)
        {
            $('#trisys-upload-file-picker').focus().trigger('click');
        });

        obj.on('dragenter', function (e)
        {
            e.stopPropagation();
            e.preventDefault();
            $(this).css('border', '2px solid ' + sThemedColour);
        });

        obj.on('dragover', function (e)
        {
            e.stopPropagation();
            e.preventDefault();
        });

        obj.on('drop', function (e)
        {
            $(this).css('border', '2px dotted ' + sThemedColour);
            e.preventDefault();
            var files = e.originalEvent.dataTransfer.files;

            // Send to our API
            ctrlUploadFile.ProcessHTMLFiles(files);  //, obj);
        });

        // When user selects via pop-up
        $('#trisys-upload-file-picker').bind('change', function (e)
        {
            var files = this.files;

            ctrlUploadFile.ProcessHTMLFiles(files);
        });

        if (TriSysPhoneGap.Enabled())
        {
            $('#trisys-upload-camera-block').show();

            $('#trisys-upload-camera').on('click', function (e)
            {
                ctrlUploadFile.TakePhotographUsingCamera();
            });
        }
    },

    // KendoUI independent version
    UploadFiles: function(files)
    {
        var trisysFile = files[0];

        ctrlUploadFile.UploadFile(trisysFile);
    },

    UploadFile: function (trisysFile)
    {
        var fnCallback = function (sFile)
        {
            TriSysSDK.Controls.FileManager._UploadedFileRelativePath = sFile;

            // Once we have picked a file, send this to the callback 'form' to process and store
            TriSysSDK.Controls.FileManager.SaveCallbackFunction(sFile);

            // Close this modal dialogue
            TriSysApex.UI.CloseModalPopup();
        };

        TriSysSDK.Controls.FileManager.UploadFile(trisysFile, fnCallback);
    },

    // This is used after filepicker.io gives us a file specification
    UploadFileURL: function (pickedFile)
    {
        var CFileUploadFileFromURLRequest = {
            'Filename': pickedFile.filename,
            'MimeType': pickedFile.mimetype,
            'Size': pickedFile.size,
            'URL': pickedFile.url
        };

        var payloadObject = {};

        payloadObject.URL = "Files/UploadFileFromURL";

        payloadObject.OutboundDataPacket = CFileUploadFileFromURLRequest;

        payloadObject.InboundDataFunction = function (CFileUploadFileFromURLResponse)
        {
            TriSysApex.UI.HideWait();

            if (CFileUploadFileFromURLResponse)
            {
                if (CFileUploadFileFromURLResponse.Success)
                {
                    var sFile = CFileUploadFileFromURLResponse.FolderFilePath;
                    TriSysSDK.Controls.FileManager._UploadedFileRelativePath = sFile;

                    // Once we have picked a file, send this to the callback 'form' to process and store
                    TriSysSDK.Controls.FileManager.SaveCallbackFunction(sFile);

                    // Remove the file on filepicker.io as we no longer need it
                    ctrlUploadFile.RemoveFileAfterUpload(pickedFile.url);
                }
                else
                    TriSysApex.UI.errorAlert('ctrlUploadFile.UploadFileURL Error: ' + CFileUploadFileFromURLResponse.ErrorMessage);

                return;
            }

            TriSysApex.UI.ShowError('ctrlUploadFile.UploadFileURL Error: null response');
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('ctrlUploadFile.UploadFileURL: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Uploading File...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    RemoveFileAfterUpload: function(sURL)
    {
        // V3
        // We need security permissions and will need to speak to these guys first!
        return;
        var client = filestack.init('AJAwvQkSwSIyXY5y0dmrMz');  //, { policy: 'policy', signature: 'signature' });
        var handle = sURL.substr(sURL.lastIndexOf("/") + 1);
        client.remove(handle);
        return;

        // V2
        var blob = { url: sURL };
        filepicker.remove(blob, function ()
        {
            TriSysApex.Logging.LogMessage("Removed" + pickedFile.url + " from filepicker.io");
        });
    },
    
    ProcessHTMLFiles: function (files)
    {
        // Show user name of file they selected
        if (!files)
            return;

        if (files.length <= 0)
            return;

        // Only use 1 file in this dialogue
        var file = files[0];
        var info = file.name;

        // File size is not available in all browsers
        if (file.size > 0)
        {
            // Enforce the limit of files
            var MaxSizeInMb = ctrlUploadFile.MaximimUploadSizeMb;
            var iSizeOfFileInKb = (file.size / 1024);
            var iSizeOfFileInMb = (iSizeOfFileInKb / 1024);
            var iSizeOfFileInGb = (iSizeOfFileInMb / 1024);
            if (iSizeOfFileInMb > MaxSizeInMb)
            {
                var sMessage = "The maximum size of files which can you can upload is currently limited to " + MaxSizeInMb + "Mb." +
                    "<br />" + "If you wish to increase this limit, please contact your account manager.";
                TriSysApex.UI.errorAlert(sMessage);
                return;
            }

            // The display of the file name
            info += " (" + Math.ceil(iSizeOfFileInKb) + " KB)";
        }

        // Display the file
        $('#trisys-upload-file-list').html(info);
        
        // Send to our API
        ctrlUploadFile.UploadFiles(files);
    },

    TakePhotographUsingCamera: function()
    {
        /**
         * Warning: Using DATA_URL is not recommended! The DATA_URL destination
         * type is very memory intensive, even with a low quality setting. Using it
         * can result in out of memory errors and application crashes. Use FILE_URI
         * or NATIVE_URI instead.
         */
        navigator.camera.getPicture(onSuccess, onFail, {
            quality: 100,
            destinationType: Camera.DestinationType.DATA_URL, // Camera.DestinationType.FILE_URI, //
            correctOrientation: true,
            targetWidth: 512,
            targetHeight: 512,
            allowEdit: true
        });

        function onSuccess(imageData)
        {
            // Or re-usable: NO!!! This is because this function needs HTTP POST and we have the wrong type of file
            //ctrlUploadFile.UploadFile(imageData);


            // Base64 version
            var fnAfterSave = function(sFile)
            {
                TriSysSDK.Controls.FileManager._UploadedFileRelativePath = sFile;

                // Once we have picked a file, send this to the callback 'form' to process and store
                TriSysSDK.Controls.FileManager.SaveCallbackFunction(sFile);

                // Close this modal dialogue
                TriSysApex.UI.CloseModalPopup();
            }

            //var image = document.getElementById('trisys-upload-cloud-storage-picker');
            //image.src = "data:image/jpeg;base64," + imageData;
            ctrlUploadFile.UploadPhotograph(imageData, ".jpg", fnAfterSave);

        }

        function onFail(message)
        {
            alert('Failed because: ' + message);
        }
    },

    UploadPhotograph: function (sBase64, sFileSuffix, fnCallback)
    {
        var CFileStreamWriteRequest =
        {
            Base64Text: sBase64,
            FileSuffix: sFileSuffix
        };

        var payloadObject = {};

        payloadObject.URL = "Files/UploadBase64Stream";

        payloadObject.OutboundDataPacket = CFileStreamWriteRequest;

        payloadObject.InboundDataFunction = function (CFileStreamWriteResponse)
        {
            TriSysApex.UI.HideWait();

            if (CFileStreamWriteResponse)
            {
                if (CFileStreamWriteResponse.Success)
                {
                    fnCallback(CFileStreamWriteResponse.FilePath);

                    return;
                }
                else
                    TriSysApex.UI.ShowMessage(CFileStreamWriteResponse.ErrorMessage);
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('ctrlUploadFile.UploadPhotograph: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Saving Image...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    // 07 Oct 2022: Custom image for upload
    CustomerSpecificUploadImage: function ()
    {
        if (typeof (ApexCustomerModule) != TriSysApex.Constants.Undefined &&
            typeof (ApexCustomerModule.UploadFileImageURL) != TriSysApex.Constants.Undefined)
        {
            try
            {
                var sID = 'trisys-upload-cloud-storage-picker';
                var sImageHTML = '<img src="' + ApexCustomerModule.UploadFileImageURL + '" id="' + sID + '"' +
                    ' style="cursor: pointer; width: 64px; height: 64px;" title="Choose a file from a cloud storage provider.">';
                $('#' + sID).replaceWith(sImageHTML);

            } catch (e) {

            }
        }
    }
};

// Once we are loaded, initialise the control
$(document).ready(function ()
{
    ctrlUploadFile.Load();
});
