// Chat sample code to demonstrate the use of TriSys SignalR 
// point-to-point real-time cross-platform communications.
// July 2019
//
var Chat =
{
	_TriSysSignalrInstance: null,

	Load: function()
	{
		$('#connect').on('click', Chat.Connect);
		$('#send').on('click', Chat.Send);
		$('#lookup').on('click', Chat.Lookup);
		$('#clear').on('click', Chat.ClearMessages);

		var sURL = window.location.href;
		var sSender = URL.Parser(sURL).getParam("sender"); 
		var sRecipient = URL.Parser(sURL).getParam("recipient"); 
		if(sSender)
			$('#sender-id').val(sSender);
        if(sRecipient)
        {
            $('#recipient-id').val(sRecipient);
            $('#outbound-message').val('Hi ' + sRecipient);
        }

		var bAutoConnect =  URL.Parser(sURL).getParam("autoconnect");
		if(bAutoConnect && sSender && sRecipient)
			Chat.Connect();
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
            HubURL: 'https://trisys-signalr.trisys.co.uk',
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
		Chat._TriSysSignalrInstance = new TriSysSignalr();
		Chat._TriSysSignalrInstance.Communication.Connect(options);

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
		Chat._TriSysSignalrInstance.Communication.Send(sRecipient, sOutboundMessage);
	},

	Lookup: function()
	{
		var sEMail = $('#outbound-message').val();
		if(!sEMail)
		{
			Chat.LogMessage("Please provide an e-mail address.");
			return;
		}

		var sRecipient = $('#recipient-id').val();

		var lookupObject = {
			"Type": "Lookup Contact",
			"Data": {
				"EMail": sEMail
			}			
		};
		var sOutboundMessage = JSON.stringify(lookupObject);

        // Send message via TriSys SignalR
		Chat._TriSysSignalrInstance.Communication.Send(sRecipient, sOutboundMessage);
	},

	ClearMessages: function()
	{
		$('#messages').empty();
	},

	LogMessage: function(sMessage)
	{
		var dt = new Date();
		var sDate = moment(dt).format("HH:mm:ss") + ": ";
		$('#messages').prepend('<p>' + sDate + sMessage);
    }    
};

$(document).ready(function ()
{
    Chat.Load();
});
