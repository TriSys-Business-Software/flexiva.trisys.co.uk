// Allow extension developers to send all debug messages 
// from all different .js files to a single monitoring window
// July 2019
//
var ExtensionDebugger =
{
	_TriSysSignalrInstance: null,

	Load: function()
	{
        var sSender = "Extension";
        ExtensionDebugger.Connect();
	},

	Connect: function(sSender)
	{
		var options = {
			APIKey: '20131222-ba09-4e4c-8bcb-apex.web.app',
            UserIdKey: sSender,
            ConnectedStatus: function(sStatus)
            {
                // Called with connection status updates
                //Chat.LogMessage("ConnectedStatus: " + sStatus);
            },
            ReceivedMessage: function(sSender, sJSONDataPacket)
            {
                // Called when a message is received
                //Chat.LogMessage("ReceivedMessage from " + sSender + ": " + sJSONDataPacket);
            },
            SentMessage: function(sRecipient, sJSONDataPacket)
            {
                // Called when a message is sent
                //Chat.LogMessage("Sent message to " + sRecipient + ": " + sJSONDataPacket);
            }
		};

        // Connect to TriSys SignalR 
		Chat._TriSysSignalrInstance = new TriSysSignalr();
		Chat._TriSysSignalrInstance.Communication.Connect(options);
	},

	Send: function(sOutboundMessage)
	{
		var sRecipient = "45aa027b-68f3-4fba-ae78-8f89b8da8833";

        // Send message via TriSys SignalR
		Chat._TriSysSignalrInstance.Communication.Send(sRecipient, sOutboundMessage);
	}
};

$(document).ready(function ()
{
    ExtensionDebugger.Load();
});
