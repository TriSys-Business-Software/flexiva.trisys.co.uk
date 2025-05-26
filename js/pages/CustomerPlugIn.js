var customerPlugIn =
{
    Load: function ()
    {
        // Read command line to see if we have a callback function in the URL?
        var sURL = window.location.href;
        var sKey = "/?CustomerPlugIn/".toLowerCase();
        var iIndex = sURL.toLowerCase().indexOf(sKey);
        if (iIndex > 0)
        {
            // Assume this is the name of a Javascript function probably in the ...
            var sBase64Text = sURL.substring(iIndex + sKey.length);
            var sJSON = $.base64.decode(sBase64Text);
            var jsonObject = JSON.parse(sJSON);
            if(jsonObject)
            {
                if (jsonObject.Title)
                    customerPlugIn.SetTitle(jsonObject.Title);

                var objFunctionParameters = null;
                if (jsonObject.Parameters)
                    objFunctionParameters = jsonObject.Parameters;

                // If this is the name of a Javascript function call it
                if (jsonObject.Function)
                {
                    var bParameters = objFunctionParameters ? true : false;
                    TriSysActions.Invocation.CallDynamicFunction(jsonObject.Function, bParameters, objFunctionParameters);
                }

                // If this is the full URL path to a JavaScript .js file then dynamically load this now
                if (jsonObject.ScriptFilePath)
                {
                    var fnLoadControlHTML = function ()
                    {
                        // Is there a callback function to call after loading this script
                        if (jsonObject.ScriptFileCallbackFunction)
                        {
                            // Script function can now safely inject it's own custom HTML into this control
                            TriSysActions.Invocation.CallDynamicFunction(jsonObject.ScriptFileCallbackFunction, false);
                        }
                    };

                    TriSysApex.WhiteLabelling.LoadJavascriptFile(jsonObject.ScriptFilePath, null, fnLoadControlHTML);
                }
            }
        }
    },

    SetTitle: function(sTitle)
    {
        $('#customer-plug-in-inner-block-title-text').text(sTitle);
    },

    ShowSpinner: function(bShow)
    {
        var elem = $('#customer-plug-in-inner-block-spinner');
        bShow ? elem.show() : elem.hide();
    },

    ShowInjectedHTML: function (bShow)
    {
        var elem = $('#customer-plug-in-inner-block-div');
        bShow ? elem.show() : elem.hide();
    },

    // e.g. https://api.trisys.co.uk/Apex/custom/Approach-People-Recruitment/ctrlConsultantPlacementSummary.html
    InjectHTMLFromFile: function(sURLOfHTMLFile)
    {
        var sDiv = 'customer-plug-in-inner-block-div';
        TriSysApex.FormsManager.loadControlIntoDiv(sDiv, sURLOfHTMLFile, function ()
        {
            // Optional callback after this is loaded
        });
    },

    TestFunction: function (sMessage)
    {
        customerPlugIn.HideBranding(true, true);
    },

    // Typically we would be displayed inside a smart-client web browser
    // so hide all our branding here
    //
    HideBranding: function (bHideNavigationBar, bHideTitleBar)
    {
        if (bHideTitleBar)
        {
            // Hide top bar
            $('#app-caption-fixed-top').hide();
            $('#page-container').css("padding-top", "0px");
            $('#page-container').css("padding-right", "0px");
            $('#divFormContentRow').css('min-height', $(window).height() );
        }

        if (bHideNavigationBar)
        {
            // Hide navigation bar
            $('#trisys-navigation-bar').hide();
            $('#sidebar').css("width", "0px");
            $('#main-container').css("margin-left", "0px");
        }
    }
};

$(document).ready(function () {
    customerPlugIn.Load();
});
