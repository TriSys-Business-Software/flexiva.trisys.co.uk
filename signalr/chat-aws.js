// Chat sample code to demonstrate the use of TriSys SignalR 
// point-to-point real-time cross-platform communications. 
// With TWO instances to test SignalR compatibility.
// July 2019
//
var Chat =
{
	_TriSysSignalrInstance1: null,
	_TriSysSignalrInstance2: null,

	Load: function()
	{		
		var sURL = window.location.href;
		var sSender = URL.Parser(sURL).getParam("sender"); 
		var sRecipient = URL.Parser(sURL).getParam("recipient"); 

		$('#connect').on('click', Chat.Connect);
		$('#send').on('click', Chat.Send);

		if(sSender)
			$('#sender-id').val(sSender + '1');
        if(sRecipient)
        {
            $('#recipient-id').val(sRecipient + '1');
            $('#outbound-message').val('Hi ' + sRecipient + '1');
        }

		$('#connect2').on('click', Chat.Connect2);
		$('#send2').on('click', Chat.Send2);

		if(sSender)
			$('#sender-id2').val(sSender + '2');
        if(sRecipient)
        {
            $('#recipient-id2').val(sRecipient + '2');
            $('#outbound-message2').val('Hi ' + sRecipient + '2');
        }
	},

	Connect: function()
	{
		var sSender = $('#sender-id').val();
		if(!sSender)
		{
			Chat.LogMessage("Please provide a valid sender ID.");
			return;
		}

		var sRecipient = $('#recipient-id').val();
		if(!sRecipient)
		{
			Chat.LogMessage("Please provide a valid recipient ID.");
			return;
		}

		Chat.LogMessage("Connecting...");

		var options = {
			APIKey: '20131222-ba09-4e4c-8bcb-apex.web.app',
            UserIdKey: sSender,
            HubURL: 'http://signalr.trisys.co.uk/signalr',
            ConnectedStatus: function(sStatus)
            {
                // Called with connection status updates
                Chat.LogMessage("ConnectedStatus: " + sStatus);
            },
            ReceivedMessage: function(sSender, sJSONDataPacket)
            {
                // Called when a message is received
                Chat.LogMessage("ReceivedMessage from " + sSender + ": " + sJSONDataPacket);
            },
            SentMessage: function(sRecipient, sJSONDataPacket)
            {
                // Called when a message is sent
                Chat.LogMessage("Sent message to " + sRecipient + ": " + sJSONDataPacket);
            }
		};

        // Connect to TriSys SignalR 
		Chat._TriSysSignalrInstance1 = new TriSysSignalr('TriSys.SignalR.Chat1');
		Chat._TriSysSignalrInstance1.Communication.Connect(options);

		// After connect
		$('#sender-id').hide();
		$('#sender-id-afterconnect').show().html(sSender);
		$('#recipient-id').hide();
		$('#recipient-id-afterconnect').show().html(sRecipient);
		$('#connect').hide();
		$('#connected').show();
		$('#tr-afterconnect1').show();
		$('#tr-afterconnect2').show();
	},

	Send: function()
	{
		var sOutboundMessage = $('#outbound-message').val();
		if(!sOutboundMessage)
		{
			Chat.LogMessage("Please provide an outbound message.");
			return;
		}

		var sRecipient = $('#recipient-id').val();

        // Send message via TriSys SignalR
		Chat._TriSysSignalrInstance1.Communication.Send(sRecipient, sOutboundMessage);
	},

	LogMessage: function(sMessage)
	{
		var dt = new Date();
		var sDate = moment(dt).format("HH:mm:ss") + ": ";
		$('#messages').prepend('<p>' + sDate + sMessage);
    },

	Connect2: function()
	{
		var sSender = $('#sender-id2').val();
		if(!sSender)
		{
			Chat.LogMessage2("Please provide a valid sender ID.");
			return;
		}

		var sRecipient = $('#recipient-id2').val();
		if(!sRecipient)
		{
			Chat.LogMessage2("Please provide a valid recipient ID.");
			return;
		}

		Chat.LogMessage2("Connecting...");

		var options = {
			APIKey: '20131222-ba09-4e4c-8bcb-apex.web.app',
            UserIdKey: sSender,
            HubURL: 'http://signalr.trisys.co.uk/signalr',
            ConnectedStatus: function(sStatus)
            {
                // Called with connection status updates
                Chat.LogMessage2("ConnectedStatus: " + sStatus);
            },
            ReceivedMessage: function(sSender, sJSONDataPacket)
            {
                // Called when a message is received
                Chat.LogMessage2("ReceivedMessage from " + sSender + ": " + sJSONDataPacket);
            },
            SentMessage: function(sRecipient, sJSONDataPacket)
            {
                // Called when a message is sent
                Chat.LogMessage2("Sent message to " + sRecipient + ": " + sJSONDataPacket);
            }
		};

        // Connect to TriSys SignalR 
		Chat._TriSysSignalrInstance2 = new TriSysSignalr('TriSys.SignalR.Chat2');
		Chat._TriSysSignalrInstance2.Communication.Connect(options);

		// After connect
		$('#sender-id2').hide();
		$('#sender-id-afterconnect2').show().html(sSender);
		$('#recipient-id2').hide();
		$('#recipient-id-afterconnect2').show().html(sRecipient);
		$('#connect2').hide();
		$('#connected2').show();
		$('#tr-afterconnect12').show();
		$('#tr-afterconnect22').show();
	},

	Send2: function()
	{
		var sOutboundMessage = $('#outbound-message2').val();
		if(!sOutboundMessage)
		{
			Chat.LogMessage2("Please provide an outbound message.");
			return;
		}

		var sRecipient = $('#recipient-id2').val();

        // Send message via TriSys SignalR
		Chat._TriSysSignalrInstance2.Communication.Send(sRecipient, sOutboundMessage);
	},

	LogMessage2: function(sMessage)
	{
		var dt = new Date();
		var sDate = moment(dt).format("HH:mm:ss") + ": ";
		$('#messages2').prepend('<p>' + sDate + sMessage);
    }

};

$(document).ready(function ()
{
    Chat.Load();
});
