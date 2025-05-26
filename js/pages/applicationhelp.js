var ApplicationHelp =
{
    Load: function ()
    {
        TriSysSDK.EntityFormTabs.AddClickEventHandlers('application-help-tab-nav-horizontal');
        TriSysSDK.EntityFormTabs.TabClickEvent('application-help-panel-', 'introduction');
        TriSysSDK.EntityFormTabs.AddHorizontalScrollBar('application-help-tab-panel-buttons');
    },

    TabClickEvent: function (sTabID)
    {
        // Nothing todo!
    }
};

$(document).ready(function ()
{
    ApplicationHelp.Load();
});

