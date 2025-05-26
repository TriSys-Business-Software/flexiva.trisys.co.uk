var ctrlEditEntitySearch =
{
    Load: function ()
    {
        ctrlEditEntitySearch.EntitySearchObject = null;
        if (ctrlEntitySearch.EntitySearchId > 0)
        {
            // Read the search from the web service
            ctrlEditEntitySearch.ReadEntitySearchFromWebAPI();
        }

        $('#entity-search-name').focus();
    },

    ReadEntitySearchFromWebAPI: function()
    {
        var CReadApexEntitySearchRequest = { ApexEntitySearchId: ctrlEntitySearch.EntitySearchId };

        var payloadObject = {};

        payloadObject.URL = "EntitySearch/Read";

        payloadObject.OutboundDataPacket = CReadApexEntitySearchRequest;

        payloadObject.InboundDataFunction = function (CReadApexEntitySearchResponse)
        {
            TriSysApex.UI.HideWait();

            if (CReadApexEntitySearchResponse)
            {
                if (CReadApexEntitySearchResponse.Success)
                {
                    ctrlEditEntitySearch.EntitySearchObject = CReadApexEntitySearchResponse.Search;

                    $('#entity-search-name').val(ctrlEditEntitySearch.EntitySearchObject.SearchName);
                    $('#entity-search-description').val(ctrlEditEntitySearch.EntitySearchObject.SearchDescription);
                    TriSysSDK.CShowForm.SetCheckBoxValue('entity-search-default', ctrlEditEntitySearch.EntitySearchObject.DefaultSearch);

                    return;
                }
                else
                    TriSysApex.UI.ShowMessage(CReadApexEntitySearchResponse.ErrorMessage);
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('ctrlEditEntitySearch.ReadEntitySearchFromWebAPI: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Reading Search...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    DisplaySearch: function (entitySearchObject)
    {

    },

    EntitySearchObject: null,

    SaveButtonClick: function (fnAfterSave)
    {
        if (!ctrlEditEntitySearch.EntitySearchObject)
            ctrlEditEntitySearch.EntitySearchObject = { ApexEntitySearchId: 0, EntityName: ctrlEntitySearch.EntityName };

        ctrlEditEntitySearch.EntitySearchObject.SearchName = $('#entity-search-name').val();
        ctrlEditEntitySearch.EntitySearchObject.SearchDescription = $('#entity-search-description').val();
        ctrlEditEntitySearch.EntitySearchObject.DefaultSearch = TriSysSDK.CShowForm.CheckBoxValue('entity-search-default');

        if (!ctrlEditEntitySearch.EntitySearchObject.SearchName)
        {
            TriSysApex.UI.ShowMessage("Please name the search.");
            return false;
        }
            
        if (!ctrlEditEntitySearch.EntitySearchObject.SearchDescription)
            ctrlEditEntitySearch.EntitySearchObject.SearchDescription = ctrlEditEntitySearch.EntitySearchObject.SearchName;

        // Submission
        ctrlEditEntitySearch.SubmitToAPI(ctrlEditEntitySearch.EntitySearchObject, fnAfterSave);

        return true;
    },

    SubmitToAPI: function (entitySearchObject, fnAfterSave)
    {
        var CWriteApexEntitySearchRequest = { Search: entitySearchObject };

        var payloadObject = {};

        payloadObject.URL = "EntitySearch/Write";

        payloadObject.OutboundDataPacket = CWriteApexEntitySearchRequest;

        payloadObject.InboundDataFunction = function (CWriteApexEntitySearchResponse)
        {
            TriSysApex.UI.HideWait();

            if (CWriteApexEntitySearchResponse)
            {
                if (CWriteApexEntitySearchResponse.Success)
                {
                    // Callback
                    fnAfterSave(CWriteApexEntitySearchResponse.EntitySearchId, entitySearchObject.SearchName);

                    return;
                }
                else
                    TriSysApex.UI.ShowMessage(CWriteApexEntitySearchResponse.ErrorMessage);
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('ctrlEditEntitySearch.SubmitToAPI: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Saving Search...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    }
};

$(document).ready(function ()
{
    ctrlEditEntitySearch.Load();
});
