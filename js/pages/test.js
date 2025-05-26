function showMessageButtonClick()
{
    TriSysApex.UI.ShowMessage("Test Message using the TriSysApex.UI.ShowMessage() method.");
}

function showErrorButtonClick()
{
    var errorCallback = function () { TriSysApex.Toasters.Error("You clicked OK?"); return true; };
    TriSysApex.UI.errorAlert("Error Message using the TriSysApex.UI.ShowError() method.",
                            "TriSys Error Message Test",
                            errorCallback);
}

function showQuestionYesNoClick()
{
    var sMessage = "Do you want to do it now?";
    var sTitle = "Do-It Question";
    var yesCallback = function () { TriSysApex.Toasters.Info("Yes"); return true; };
    TriSysApex.UI.questionYesNo(sMessage, sTitle, "Yes", yesCallback, "No")
}

function showQuestionYesNoCancelClick()
{
    var sMessage = "Do you want to do it now?";
    var sTitle = "Do-It Question Prompt";
    var yesCallback = function () { TriSysApex.Toasters.Error("Yes"); return true; };
    var noCallback = function () { TriSysApex.Toasters.Success("No"); return true; };
    var cancelCallback = function () { TriSysApex.Toasters.Warning("Cancel"); return true; };
    TriSysApex.UI.questionYesNoCancel(sMessage, sTitle, "Yes", yesCallback, "No", noCallback, "Cancel", cancelCallback)
}

function testWait(iSeconds)
{
    TriSysApex.UI.ShowWait(null, 'Waiting ' + iSeconds + ' seconds...');

    setTimeout(function () { TriSysApex.UI.HideWait(); }, (iSeconds * 1000));
}

function findCV()
{
    TriSysSDK.Controls.FileManager.FindFileUpload("Find CV", function (sFile) { showDocumentInViewer(sFile); });
}

function testModal()
{
    var parametersObject = new TriSysApex.UI.ShowMessageParameters();
    parametersObject.Title = "Modal Dialogue Test";
    parametersObject.Maximize = true;

    parametersObject.ContentURL = TriSysApex.Constants.UserControlFolder + 'ctrlTestModal.html';
    parametersObject.OnLoadCallback = function ()
    {
        TriSysApex.Toasters.Info("Modal loaded");
    };

    // Buttons
    parametersObject.ButtonLeftText = "Save Stuff";
    parametersObject.ButtonLeftFunction = function ()
    {
        TriSysApex.Toasters.Info("Modal saved");
        return true;
    };
    parametersObject.ButtonLeftVisible = true;
    parametersObject.ButtonRightVisible = true;
    parametersObject.ButtonRightText = "Cancel";
    parametersObject.ButtonRightFunction = function ()
    {
        TriSysApex.Toasters.Info("Modal cancelled");
        return true;
    };

    TriSysApex.UI.PopupMessage(parametersObject);
}

function iconPicker()
{
    var fnPicked = function (sIcon)
    {
        TriSysApex.Toasters.Info(sIcon);
    };

    TriSysApex.ModalDialogue.IconPicker.Show(fnPicked);
    return;

    var parametersObject = new TriSysApex.UI.ShowMessageParameters();
    parametersObject.Title = "Icon Picker";
    parametersObject.Maximize = true;

    parametersObject.ContentURL = TriSysApex.Constants.UserControlFolder + 'ctrlIconPicker.html';

    // Buttons
    parametersObject.ButtonRightVisible = true;
    parametersObject.ButtonRightText = "Cancel";
    parametersObject.ButtonRightFunction = function ()
    {
        TriSysApex.Toasters.Info("Modal cancelled");
        return true;
    };

    // Callback
    parametersObject.OnLoadCallback = function ()
    {
        ctrlIconPicker.Load(fnPicked);
    };

    TriSysApex.UI.PopupMessage(parametersObject);
}

function showAllCookies()
{
    var s = "localStorage: ";
    $.each(window.localStorage, function (key, value)
    {
        // key magic
        // value magic
        s += "<br />" + key + " = " + value;
    });

    $('#memory-options').html(s);

}

function showDocumentInViewer(sURL)
{
    // For testing, we know the path of the uploaded file
    sURL = "https://api.trisys.co.uk/upload/" + sURL.replace(/\\/g, '/');

    $('#trisys-test-document-url').attr('href', sURL);
    $('#trisys-test-document-url-path').html(sURL);

    var iframe = document.getElementById('trisys-document-viewer');
    iframe.src = "http://api.accusoft.com/v1/viewer/?key=K2042015100045&viewertype=html5&document=" + sURL +
                    "&viewerheight=600&viewerwidth=1200&printButton=Yes&toolbarColor=CCCCCC";

    // Send this now to be converted by our own API
    //ctrlTest.TestDocumentConverter();
}

function questionYesNoDashboardDummyData()
{
    var sMessage = "Turn dummy data on or off?";
    var sTitle = "Dummy Dashboard Data";
    var OnCallback = function () { TriSysApex.Constants.ShowDummyDashboardData = true; return true; };
    var OffCallback = function () { TriSysApex.Constants.ShowDummyDashboardData = false; return true; };
    TriSysApex.UI.questionYesNo(sMessage, sTitle, "On", OnCallback, "Off", OffCallback)
}

function logErrorMessageTest()
{
    // Log to server: Catch all errors in a big bucket in our API/CRM storage
    var sError = "This is a test development error only - IGNORE!!!";
    var fnCallback = function()
    {
        TriSysApex.Toasters.Info("Error Reported!");
    };

    TriSysApex.ErrorHandling.SendErrorToWebAPI(sError, fnCallback);
}

var ctrlTest =
{
    InitialiseSearchTree: function()
    {
//        // define filters
//        var options = {
//            allow_empty: true,

//            //plugins: {
//            //    //'bt-tooltip-errors': { delay: 100 },
//            //    'sortable': null,
//            //    //'filter-description': { mode: 'bootbox' },
//            //    //'bt-selectpicker': null,
//            //    'unique-filter': null //,
//            //    //'bt-checkbox': { color: 'primary' }
//            //},

//            plugins: [
//                'sortable',
//                'filter-description',
//                'unique-filter' //,
//                //'bt-tooltip-errors',
//                //'bt-selectpicker',
//                //'bt-checkbox'
//            ],

//            filters: [
//            /*
//             * basic
//             */
//            {
//                id: 'name',
//                label: 'Name',
//                type: 'string',
//                optgroup: 'core',
//                default_value: 'Mistic',
//                size: 30,
//                unique: true
//            },
//            /*
//             * textarea
//             */
//            {
//                id: 'bson',
//                label: 'BSON',
//                type: 'string',
//                input: 'textarea',
//                operators: ['equal'],
//                size: 30,
//                rows: 3
//            },
//            /*
//             * select
//             */
//            {
//                id: 'category',
//                label: 'Category',
//                type: 'integer',
//                input: 'checkbox',
//                optgroup: 'core',
//                values: {
//                    1: 'Books',
//                    2: 'Movies',
//                    3: 'Music',
//                    4: 'Tools',
//                    5: 'Goodies',
//                    6: 'Clothes'
//                },
//                colors: {
//                    1: 'danger',
//                    2: 'warning',
//                    5: 'success'
//                },
//                operators: ['in', 'not_in', 'equal', 'not_equal', 'is_null', 'is_not_null']
//            },
//            /*
//             * TriSys
//             */
//            {
//                id: 'ContactStatus',
//                label: 'TriSys Contact Status',
//                type: 'string',
//                default_value: 'On Contract',
//                description: 'Why does our composite field info icon not appear?',
//                input: 'checkbox',
//                optgroup: 'TriSys',
//                values: {
//                    1: 'Active',
//                    2: 'Inactive',
//                    3: 'Modified Warning',
//                    4: 'On Contract',
//                    5: 'Placed By Another',
//                    6: 'Placed By Us',
//                    6: 'Referee'
//                },
//                operators: ['in', 'not_in', 'equal', 'not_equal', 'is_null', 'is_not_null']
//            },
//            /*
//             * Selectize
//             */
//            {
//                id: 'state',
//                label: 'State',
//                type: 'string',
//                input: 'select',
//                multiple: true,
//                plugin: 'selectize',
//                plugin_config: {
//                    valueField: 'id',
//                    labelField: 'name',
//                    searchField: 'name',
//                    sortField: 'name',
//                    options: [
//                      { id: "AL", name: "Alabama" },
//                      { id: "AK", name: "Alaska" },
//                      { id: "AZ", name: "Arizona" },
//                      { id: "AR", name: "Arkansas" },
//                      { id: "CA", name: "California" },
//                      { id: "CO", name: "Colorado" },
//                      { id: "CT", name: "Connecticut" },
//                      { id: "DE", name: "Delaware" },
//                      { id: "DC", name: "District of Columbia" },
//                      { id: "FL", name: "Florida" },
//                      { id: "GA", name: "Georgia" },
//                      { id: "HI", name: "Hawaii" },
//                      { id: "ID", name: "Idaho" }
//                    ]
//                },
//                valueSetter: function (rule, value)
//                {
//                    rule.$el.find('.rule-value-container select')[0].selectize.setValue(value);
//                }
//            },
//            /*
//             * radio
//             */
//            {
//                id: 'in_stock',
//                label: 'In stock',
//                type: 'integer',
//                input: 'radio',
//                optgroup: 'plugin',
//                values: {
//                    1: 'Yes',
//                    0: 'No'
//                },
//                operators: ['equal']
//            },
//            /*
//             * double
//             */
//            {
//                id: 'price',
//                label: 'Price',
//                type: 'double',
//                size: 5,
//                validation: {
//                    min: 0,
//                    step: 0.01
//                },
//                data: {
//                    class: 'com.example.PriceTag'
//                }
//            },
//            // Date
//            {
//                id: 'date',
//                label: 'Datepicker',
//                type: 'date',
//                validation: {
//                    format: 'YYYY/MM/DD'
//                },
//                plugin: 'datepicker',
//                plugin_config: {
//                    format: 'yyyy/mm/dd',
//                    todayBtn: 'linked',
//                    todayHighlight: true,
//                    autoclose: true
//                }
//            },
//            /*
//             * slider
//             */
//            {
//                id: 'rate',
//                label: 'Rate',
//                type: 'integer',
//                validation: {
//                    min: 0,
//                    max: 100
//                },
//                plugin: 'slider',
//                plugin_config: {
//                    min: 0,
//                    max: 100,
//                    value: 0
//                },
//                onAfterSetValue: function (rule, value)
//                {
//                    var input = rule.$el.find('.rule-value-container input');
//                    input.slider('setValue', value);
//                    input.val(value); // don't know why I need it
//                }
//            },
//            /*
//             * placeholder and regex validation
//             */
//            {
//                id: 'id',
//                label: 'Identifier',
//                type: 'string',
//                optgroup: 'plugin',
//                placeholder: '____-____-____',
//                size: 14,
//                operators: ['equal', 'not_equal'],
//                validation: {
//                    format: /^.{4}-.{4}-.{4}$/
//                }
//            },
//            /*
//             * custom input
//             */
//            {
//                id: 'coord',
//                label: 'Coordinates',
//                type: 'string',
//                default_value: 'C.5',
//                description: 'The letter is the cadran identifier for this TriSys version:\
//<ul>\
//  <li><b>A</b>: alpha</li>\
//  <li><b>B</b>: beta</li>\
//  <li><b>C</b>: gamma</li>\
//</ul>',
//                validation: {
//                    format: /^[A-C]{1}.[1-6]{1}$/
//                },
//                operators: ['equal', 'not_equal'],
//                input: function (rule)
//                {
//                    var $container = rule.$el.find('.rule-value-container');

//                    $container.on('change', '[name=coord_1]', function ()
//                    {
//                        var h = '';

//                        switch ($(this).val())
//                        {
//                            case 'A':
//                                h = '<option value="-1">-</option> <option value="1">1</option> <option value="2">2 (alpha)</option>';
//                                break;
//                            case 'B':
//                                h = '<option value="-1">-</option> <option value="3">3</option> <option value="4">4 (beta)</option>';
//                                break;
//                            case 'C':
//                                h = '<option value="-1">-</option> <option value="5">5</option> <option value="6">6 (gamma)</option>';
//                                break;
//                        }

//                        $container.find('[name=coord_2]').html(h).toggle(h != '');
//                    });

//                    var sInputHTML = '\
//                      <select name="coord_1" class="form-control"> \
//                        <option value="-1">-</option> \
//                        <option value="A">A (AA)</option> \
//                        <option value="B">B (BB)</option> \
//                        <option value="C">C (CC)</option> \
//                      </select> \
//                      <select name="coord_2" class="form-control" style="display:none;"></select>';

//                    return sInputHTML;
//                },
//                valueParser: function (rule, value)
//                {
//                    return rule.$el.find('[name=coord_1]').val()
//                      + '.' + rule.$el.find('[name=coord_2]').val();
//                },
//                valueSetter: function (rule, value)
//                {
//                    if (rule.operator.nb_inputs !== 0)
//                    {
//                        var val = value.split('.');
//                        rule.$el.find('[name=coord_1]').val(val[0]).trigger('change');
//                        rule.$el.find('[name=coord_2]').val(val[1]);
//                    }
//                }
//            },
            
//            /*
//             * TriSys Currency Amount Period
//             */
//            {
//                id: 'currencyAmountPeriod',
//                label: 'Currency Amount Period',
//                type: 'string',
//                default_value: '£0 per Hour',
//                description: 'Currency amount period - used for salary and pay/charge rates: \
//<ul>\
//  <li><b>Currency</b>: Any available international currency</li>\
//  <li><b>Amount</b>: Normally a positive number</li>\
//  <li><b>Period</b>: The working period e.g. Hour, Day, Week, Month, Annum</li>\
//</ul>',
//                optgroup: 'TriSys',
//                validation: {
//                    callback: function(value, rule)
//                    {
//                        return true;    // 'Wrong, totally wrong ;-( ' + value;
//                    }
//                },
//                operators: ['equal', 'not_equal', 'greater', 'less', 'between'],
//                input: function (rule)
//                {
//                    var $container = rule.$el.find('.rule-value-container');

//                    $container.on('change', '[name=capCurrency]', function ()
//                    {
//                        // TODO: Change amount as we changed currency!
//                    });

//                    var sInputHTML = '\
//                          <select name="capCurrency" class="form-control"> \
//                            <option value="£" selected>&pound;</option> \
//                            <option value="€">€</option> \
//                            <option value="$">$</option> \
//                          </select> \
//                            &nbsp; \
//                          <input name="capAmount" type="number" value="0.0" class="form-control" ></input> \
//                            &nbsp; per &nbsp; \
//                          <select name="capPeriod" class="form-control"> \
//                            <option value="Hour" selected>Hour</option> \
//                            <option value="Day">Day</option> \
//                            <option value="Week">Week</option> \
//                            <option value="Month">Month</option> \
//                            <option value="Annum">Annum</option> \
//                          </select>';

//                    return sInputHTML;
//                },
//                valueParser: function (rule, value)
//                {
//                    var sCurrency = rule.$el.find('[name=capCurrency]').val();
//                    var fAmount = rule.$el.find('[name=capAmount]').val();
//                    var sPeriod = rule.$el.find('[name=capPeriod]').val();

//                    var sValue = sCurrency + fAmount + ' per ' + sPeriod;
//                    return sValue;
//                },
//                valueSetter: function (rule, value)
//                {
//                    if (rule.operator.nb_inputs !== 0)
//                    {
//                        var parsed = { Currency: null, Amount: null, Period: null };

//                        try
//                        {
//                            TriSysSDK.Controls.CurrencyAmountPeriod.Parse(value, parsed);

//                            if (parsed.Currency && parsed.Amount && parsed.Period )
//                            {
//                                rule.$el.find('[name=capCurrency]').val(parsed.Currency);
//                                rule.$el.find('[name=capAmount]').val(parsed.Amount);
//                                rule.$el.find('[name=capPeriod]').val(parsed.Period);
//                            }
//                        } catch (e)
//                        {

//                        }                        
//                    }
//                }
//            }]
//        };

//        // This clal instantiates the query builder
//        $('#builder').queryBuilder(options);


//        $('#builder').on('afterCreateRuleInput.queryBuilder', function (e, rule)
//        {
//            if (rule.filter.plugin == 'selectize')
//            {
//                rule.$el.find('.rule-value-container').css('min-width', '200px')
//                  .find('.selectize-control').removeClass('form-control');
//            }
//        });
       
//        // Apply our themes
//        ctrlTest.ResetColours();
    },

    ResetColours: function()
    {
        setTimeout(function ()
        {
            $('.query-builder .rules-group-container').css("background-color", TriSysProUI.ThemedSidebarBackgroundLight(0.55));
            $('.query-builder .rules-group-container').css("border-color", TriSysProUI.ThemedAlternativeBackColor());

        }, 250);
    },

    GetSQL: function()
    {
        var result = $('#builder').queryBuilder('getSQL', false);

        if (result.sql.length)
        {
            var sMessage = result.sql + (result.params ? '\n\n' + JSON.stringify(result.params, null, 2) : '');

            TriSysApex.UI.ShowMessage(sMessage, 'SQL Statement')
        }
    },

    SetSQL: function()
    {
        var sql = "ContactStatus IN('4', '6') AND (rate = 1 OR name = 'TriSys' or currencyAmountPeriod > '£25 per Hour')";

        $('#builder').queryBuilder('setRulesFromSQL', sql);
    },

    LoadSearchCriteriaControl: function()
    {
        var sDiv = 'trisys-search-criteria';
        TriSysSDK.SearchCriteria.Load("Contact", 0, sDiv);
    },

    TestDocumentConverter: function()
    {
        // Turned off 11 Sept 2015
        return;

        var sDiv = 'trisys-document-converted-contents';
        //var sServerFilePath = 'G:\\Incoming CVs\\LisaWalkerCV.docx';
        var sServerFilePath = 'G:\\Incoming CVs\\Gascoigne_P_047385.doc';

        var CFileReferenceInternalToExternalPathRequest = {
            FolderFilePath: sServerFilePath
        }

        var payloadObject = {};
        payloadObject.URL = "Files/ConvertFileReferenceInternalToExternalPath";
        //payloadObject.URL = "Files/ConvertFileReferenceInternalToBase64";
        payloadObject.OutboundDataPacket = CFileReferenceInternalToExternalPathRequest;
        payloadObject.InboundDataFunction = function (data)
        {
            if (data)
            {
                if (data.Success)
                {
                    //$('#' + sDiv).html(CFileReferenceInternalToExternalPathResult.URL);

                    //var iframe = document.getElementById('trisys-document-converted-iframe');
    
                    //// Throws open a .MHT are you sure? dialogue
                    //iframe.src = data.URL;

                    // Try non-div version
                    $('#' + sDiv).load(data.URL, function (response, status, xhr)
                    {
                        if (status == "error")
                        {
                            var msg = "Sorry but there was an error: ";
                            alert(msg + xhr.status + " " + xhr.statusText);
                        }
                    });

                    return;


                    // Convert from base 64
                    var sHTML = data.Base64Text;
                    //var sHTML = $.base64.decode(data.Base64Text);
                    //$('#' + sDiv).html(sHTML);

                    // Send HTML into it
                    iframe.srcdoc = sHTML;
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
            TriSysApex.UI.ErrorHandlerRedirector('TestDocumentConverter: ', request, status, error, false);
        };
        TriSysAPI.Data.PostToWebAPI(payloadObject);

    },

    handleDragDropEvent: function (oEvent)
    {
        var oTextbox = document.getElementById("txt1");
        oTextbox.value +=  oEvent.type + "\n";
    },

    // Simulate an actual coding bug
    raiseErrorTest: function()
    {
        var bugVar = TriSysApex.MissingObject;
        bugVar.Call(6);
    },

    templateEditor: function()
    {
        TriSysActions.MailMerge.EditTemplate("TEST", "Master Templates/Interested/Candidate/", null);
    },

    templateEditorNonModal: function()
    {
        TriSysActions.MailMerge.Folder = "Master Templates/Interested/Candidate/";
        $('#non-modal-template-editor').load(TriSysApex.Constants.UserControlFolder + "actions/ctrlTemplateEditor.html", function (response, status, xhr)
        {
            if (status == "error")
            {
                var msg = "Sorry but there was an error: ";
                alert(msg + xhr.status + " " + xhr.statusText);
            }
        });

        $("#kendoui-editor").kendoEditor({
            //tools: [
            //    "bold",
            //    "italic",
            //    "underline",
            //    "strikethrough",
            //    "justifyLeft",
            //    "justifyCenter",
            //    "justifyRight",
            //    "justifyFull",
            //    "insertUnorderedList",
            //    "insertOrderedList",
            //    "indent",
            //    "outdent",
            //    "createLink",
            //    "unlink",
            //    "insertImage",
            //    "insertFile",
            //    "subscript",
            //    "superscript",
            //    "createTable",
            //    "addRowAbove",
            //    "addRowBelow",
            //    "addColumnLeft",
            //    "addColumnRight",
            //    "deleteRow",
            //    "deleteColumn",
            //    "viewHtml",
            //    "formatting",
            //    "cleanFormatting",
            //    "fontName",
            //    "fontSize",
            //    "foreColor",
            //    "backColor",
            //    "print"
            //]
            tools: [
                {
                    name: "fontName",
                    items: [].concat(
                        kendo.ui.Editor.prototype.options.fontName[8],
                        [{ text: "Garamond", value: "Garamond, serif" }]
                    )
                },
                {
                    name: "fontSize",
                    items: [].concat(
                        kendo.ui.Editor.prototype.options.fontSize[0],
                        [{ text: "16px", value: "16px" }]
                    )
                },
                {
                    name: "formatting",
                    items: [].concat(
                        kendo.ui.editor.FormattingTool.prototype.options.items[0],
                        [{ text: "Fieldset", value: "fieldset" }]
                    )
                },
                {
                    name: "customTemplate",
                    template: $("#backgroundColor-template").html()
                },
                {
                    name: "custom",
                    tooltip: "Insert a horizontal rule",
                    exec: function (e)
                    {
                        var editor = $(this).data("kendoEditor");
                        editor.exec("inserthtml", { value: "<hr />" });
                    }
                }
            ]
        });
    },

    Alarms:
    {
        Start: function()
        {
            TriSysAlarms.Start();
            return;

            // Tried to use web workers, but too many limitations
            // i.e. window object used in TriSysAPI.js, etc..
            var worker = new Worker('javascript/TriSysAlarms.js');

            // Setup an event listener that will handle messages received from the worker.
            worker.addEventListener('message', function (e)
            {
                // Log the workers message.
                TriSysApex.Toasters.Info(e.data);

            }, false);

            worker.postMessage('Hello World');
        },

        Stop: function()
        {
            TriSysAlarms.Stop();
        }
    },

    OfficeAddIn:
    {
        OpenEntityRecord: function(sEntityName, lRecordId)
        {
            // Create a recipient to Josie
            var sRecipient = 'TriSysApex.SignalR.Message.OpusLaborisRecruitment.josie.musto';

            var openEntityMessage = {
                EntityName: sEntityName,
                RecordId: lRecordId
            };

            var sMessage = JSON.stringify(openEntityMessage);

            // Create a full JSONP message which can be easily identified upon receipt
            var messageObject = {

                Sender: sRecipient,
                Recipient: sRecipient,
                Type: 'OpenEntityRecord',
                Message: sMessage       // Could be a JSON stringified object as our SignalR uses JSONP
            };

            try
            {
                // Deserialize into a string for transmission
                var sJSONDataPacket = JSON.stringify(messageObject);

                // Call server invoking send event
                TriSysApex.SignalR.HubProxy.invoke('Send', sRecipient, TriSysApex.SignalR.Communication.SendEventAppCompanyLogin, sJSONDataPacket);

            } catch (e)
            {
                TriSysApex.UI.ShowError(e, "Sending to " + sRecipient);
            }
        },

        OpenContact: function(sUserFullName)
        {
            ctrlTest.OfficeAddIn.OpenEntityRecord('Contact', 49343);
        },

        OpenCompany: function (sUserFullName)
        {
            ctrlTest.OfficeAddIn.OpenEntityRecord('Company', 21280);
        },

        OpenRequirement: function (sUserFullName)
        {
            ctrlTest.OfficeAddIn.OpenEntityRecord('Requirement', 381);
        },

        OpenPlacement: function (sUserFullName)
        {
            ctrlTest.OfficeAddIn.OpenEntityRecord('Placement', 654);
        },

        OpenTask: function (sUserFullName)
        {
            ctrlTest.OfficeAddIn.OpenEntityRecord('Task', 88541);
        },

        Repeat: function(sDiv)
        {
            var iItems = $('#' + sDiv).val();
            if(iItems)
            {
                var iMillisecondsBetweenInvocations = 1500;
                for (var i = 0; i < iItems; i++)
                {
                    var fn1 = function ()
                    {
                        ctrlTest.OfficeAddIn.OpenContact();

                        var fn2 = function ()
                        {
                            ctrlTest.OfficeAddIn.OpenCompany();

                            var fn3 = function ()
                            {
                                ctrlTest.OfficeAddIn.OpenRequirement();

                                var fn4 = function ()
                                {
                                    ctrlTest.OfficeAddIn.OpenPlacement();

                                    if (i < (iItems - 1))
                                        setTimeout(fn1, iMillisecondsBetweenInvocations);
                                };
                                setTimeout(fn4, iMillisecondsBetweenInvocations);
                            };
                            setTimeout(fn3, iMillisecondsBetweenInvocations);
                        };
                        setTimeout(fn2, iMillisecondsBetweenInvocations);
                    };

                    setTimeout(fn1, iMillisecondsBetweenInvocations);
                }
            }
        }
    },

    GoogleTranslateAudioPlayer: function ()
    {
        // New: See file:///E:/Development/Research/jPlayer-2.9.2/examples/pink.flag/demo-08.html
        return;

        // Old
        var audio = new Audio();
        audio.src = 'https://translate.googleapis.com/translate_tts?ie=UTF-8&q=J%27ai+un+r%C3%AAve+dit+un+c%C3%A9l%C3%A8bre+Garry+Lowther+militant+des+droits+civiques&tl=fr&total=1&idx=0&textlen=56&client=gtx';
        audio.play();
    },

    TranslateInitialise: function()
    {
        $('#ctrlTest-LanguageTranslationSource').val("en");
        $('#ctrlTest-LanguageTranslationDestination').val("fr");
    },

    TranslateTest: function()
    {
        var sLanguageSource = $('#ctrlTest-LanguageTranslationSource').val();
        var sLanguageDestination = $('#ctrlTest-LanguageTranslationDestination').val();
        var sSourceText = $('#ctrlTest-LanguageTranslationText').val();

        var CLanguageTranslationRequest = {
            SourceLanguage: sLanguageSource,
            DestinationLanguage: sLanguageDestination,
            SourceText: sSourceText
        };

        var payloadObject = {};
        payloadObject.URL = "Language/Translate";
        payloadObject.OutboundDataPacket = CLanguageTranslationRequest;
        payloadObject.InboundDataFunction = function (CLanguageTranslationResponse)
        {
            if (CLanguageTranslationResponse)
            {
                if (CLanguageTranslationResponse.Success)
                {
                    $('#ctrlTest-LanguageTranslationConvertedText').html(CLanguageTranslationResponse.ConvertedText);
                    $('#ctrlTest-LanguageTranslationSpeechURL').attr('href', CLanguageTranslationResponse.SpeechURL);
                    //TriSysApex.UI.ShowMessage(CLanguageTranslationResponse.ConvertedText + "<br />" + CLanguageTranslationResponse.SpeechURL);                    
                }
                else
                    TriSysApex.UI.errorAlert(CLanguageTranslationResponse.ErrorMessage, TriSysWeb.Constants.ApplicationName);
            }
            else
                TriSysApex.UI.ShowMessage("No response from " + payloadObject.URL, TriSysWeb.Constants.ApplicationName);

            return true;
        };
        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            // Can occur when user gets impatient waiting for photo to load and navigates away
            TriSysApex.UI.ErrorHandlerRedirector('TranslateTest: ', request, status, error, false);
        };
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    ChromeAppTest: function()
    {
        // This method is unreliable - Google has failed to document this
        var bInChromeAppMode = (window.chrome && chrome.app && chrome.app.isInstalled);

        // The developer of our Chrome App created a DOM item for us
        bInChromeAppMode = TriSysApex.Environment.isChromeStandaloneApp();

        if (bInChromeAppMode)
        {
            // Running inside a Chrome App context
            TriSysApex.UI.ShowMessage("You are running inside a Chrome App context.");
        }
        else
        {
            // Either not Chrome, or not as an app window
            TriSysApex.UI.ShowMessage("You are NOT running inside a Chrome App context.");
        }
    },

    WindowsStoreAppTest: function ()
    {
        bWindowsStoreApp = TriSysApex.Environment.isWindowsStoreApp();

        if (bWindowsStoreApp)
        {
            // Running inside a windows App context
            TriSysApex.UI.ShowMessage("You are running inside a Windows Store App context.");
        }
        else
        {
            // Not as a windows app window
            TriSysApex.UI.ShowMessage("You are NOT running inside a Windows Store App context.");
        }
    },

    TestDocumentURL: 'https://api.trisys.co.uk/File Viewer/Josie.Musto/20160328_192027_4c314425-d163-41fb-b51a-a65fea3c6f10/Adams_J_049343.doc',

    ChromeAppOpenFileUsingiFrame: function()
    {
        TriSysSDK.Controls.FieldHyperlinks.OpenURLUsingiFrame(ctrlTest.TestDocumentURL);
    },

    ChromeAppOpenFileUsingWindow: function()
    {
        setTimeout("window.open('" + ctrlTest.TestDocumentURL + "')", 50); 
    },

    SignalRTest: function()
    {
        // E:\Development\Production\Apex\js\pages\test.js
        debugger;

        // 09 Apr 2024: Testing new Socket.IO
        var sType = "BroadcastedMessage";
        var sRecipient = "TriSys/SignalR/Communication/T-S-E01-001/OpusNet/Josie.Musto";
        var sData = '{ "Type": "BroadcastedMessage", "ShowMessage": { "Popup": true, "Text": "Hello World!", "Title": "Test SignalR" } }';

        var CSendSignalRMessageRequest = {
            MessageType: sType,
            Recipient: sRecipient,
            Sender: sRecipient,
            Data: sData
        };

        var payloadObject = {};

        payloadObject.URL = "CustomerManager/SendSignalRMessage";

        payloadObject.OutboundDataPacket = CSendSignalRMessageRequest;

        payloadObject.InboundDataFunction = function (CSendSignalRMessageResponse) {
            TriSysApex.UI.HideWait();

            if (CSendSignalRMessageResponse) {
                if (CSendSignalRMessageResponse.Success) {
                    // Message was successfully sent
                    TriSysApex.Toasters.Warning("SignalR message sent to: " + sRecipient);
                }
                else {
                    // We may fail on the server back-end based upon numerous business rules.
                    TriSysApex.UI.errorAlert(CSendSignalRMessageResponse.ErrorMessage);
                }
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error) {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('ASPCustomerManager.TestSignalRMessageBroadcast: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Sending SignalR...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
        return;


        // OLD CODE
        var payloadObject = {};
        payloadObject.URL = "OfficeAutomation/TestSignalR";
        //payloadObject.OutboundDataPacket = null;
        payloadObject.InboundDataFunction = function (CCVAutoRecognitionResponse)
        {
            if (CCVAutoRecognitionResponse)
            {
                if (CCVAutoRecognitionResponse.Success)
                {
                    TriSysApex.Logging.LogMessage("Called " + payloadObject.URL);
                }
                else
                    TriSysApex.UI.errorAlert(CCVAutoRecognitionResponse.ErrorMessage, TriSysWeb.Constants.ApplicationName);
            }
            else
                TriSysApex.UI.ShowMessage("No response from " + payloadObject.URL, TriSysWeb.Constants.ApplicationName);

            return true;
        };
        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.ErrorHandlerRedirector('SignalRTest: ', request, status, error, false);
        };
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    DatePeriodDropDownTest: function()
    {
        var fnEvent = function (dtStart, dtEnd)
        {
            TriSysApex.Toasters.Info(dtStart + " to: " + dtEnd);
        };

        TriSysSDK.DatePeriodDropDown.Load('date-period-drop-down', null, null, fnEvent);
    }

}; // ctrlTest

var TriSysAlarms =
{
    IntervalId: null,

    Start: function (e)
    {
        var iIntervalMilliseconds = 2000;  // 60000 is 1 minute
        TriSysAlarms.IntervalId = setInterval(TriSysAlarms.Check, iIntervalMilliseconds);
    },

    Stop: function ()
    {
        clearInterval(TriSysAlarms.IntervalId);
    },

    // Called every 60 seconds.
    Check: function ()
    {
        // Can we call our web API?
        var fnCallback = function (sVersion)
        {
            // Send the message back.
            //TriSysApex.Toasters.Info('TriSys Alarms version: ' + sVersion);

            $('#trisys-task-alarm-count').html(sVersion);
        };

        TriSysAPI.Data.Version(fnCallback);

        //TriSysApex.Toasters.Info("Alarm fired.");
    }
};

$(document).ready(function ()
{
    try
    {
        ctrlTest.InitialiseSearchTree();
        ctrlTest.LoadSearchCriteriaControl();

        // Send this now to be converted by our own API
        ctrlTest.TestDocumentConverter();

        // Test the google translate
        //ctrlTest.GoogleTranslateAudioPlayer();
        //ctrlTest.TranslateTest();
        ctrlTest.TranslateInitialise();

        ctrlTest.DatePeriodDropDownTest();

        var fnJack = function ()
        {
            var sJack = '';
            for (var i = 0; i < 1000; i++)
            {
                sJack += "I'm Jack: " + i + "<br />";
            }

            $('#jack-test').html(sJack);
        };

        //setTimeout(fnJack, 5000);


    } catch (e)
    {
        console.log(e);
    }

});
