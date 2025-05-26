// trisys-signalr.js
// Code ported from TriSysApex.SignalR
// This will be minified as a component so multiple instances can be used in the same app i.e. Apex
// to allow multiple virtual peer to peer communications between e.g. Office 365, Smart Client, Apex, Vertex etc..
//
var TriSysSignalr = function(sThisApp)
{
    //var ThisApp = (sThisApp ? sThisApp + '.' : ''); // 'TriSys.SignalR.Message.',
    var WebAPIKey = null;
    var SendEventAppCompanyLogin = null;            // e.g. TriSys.SignalR.Message.OpusLaborisRecruitment.josie.musto
    var UserIdKeyPrefix = "UserId=";
    var WebAPIKeyPrefix = "WebAPIKey=";

    // List of current and legacy SignalR services
    var sSignalRServerURL = 'https://trisys-signalr.trisys.co.uk';      // PRODUCTION from 30 May 2022
    //sHubURL = 'https://trisys-signalr.azurewebsites.net/signalr';     // PRODUCTION @ Azure
    //sHubURL = 'http://localhost:61333/signalr';                       // DEV    
    //sHubURL = 'https://api.trisys.co.uk/signalr';                     // Oiginal production system

	// We have only 1 connection (for technical reliability reasons) to our SignalR server
    var _HubProxy = null;
        
    // The options are retained within this object
    var _ConnectionOptions = null;

	// Called when a message is received	
	function Receive(sSender, sJSONDataPacket)
	{
		try
		{
			// Strip out message
			var messageObject = JSON.parse(sJSONDataPacket);
			if(messageObject && messageObject.Message)
			{
				// Callback into caller function to handle message
				if(_ConnectionOptions.ReceivedMessage)
				    _ConnectionOptions.ReceivedMessage(sSender, messageObject.Message);
			}

		} catch (e)
		{
			if(_ConnectionOptions.ConnectedStatus)
				_ConnectionOptions.ConnectedStatus('TriSysSignalR.Communication.Receive: caught error: ' + e);
		}

	}

	return {						// The JS compiler is too thick to allow this bracket to be on the line below!

		Communication:              // TriSysSignalr.Communication
		{
			Connect: function (options)			// TriSysSignalr.Communication.Connect
			{
				_ConnectionOptions = options;

				if (_HubProxy)
				{
					// This is a global shared property because we cannot keep re-connecting because SignalR fails after
					// 3 connections rendering our app comms with api broken!
					return;
				}

				WebAPIKey = WebAPIKeyPrefix + options.APIKey;
				SendEventAppCompanyLogin = options.UserIdKey;                               // Caller knows full handle
				var sUserIdKeyAssignment = UserIdKeyPrefix + SendEventAppCompanyLogin;      // e.g. UserId=TriSys/SignalR/Communication/T-S-E01-001/OpusNet/Josie.Musto


			    // 03 Apr 2024: START NEVER FUCKING TESTED!!!!!
			    // https://learn.microsoft.com/en-us/aspnet/core/signalr/javascript-client?view=aspnetcore-8.0&tabs=visual-studio

				//const connection = new signalR.HubConnectionBuilder()
                //    .withUrl("/chathub")
                //    .configureLogging(signalR.LogLevel.Information)
                //    .build();

				//async function start() {
				//    try {
				//        await connection.start();
				//        console.log("SignalR Connected.");
				//    } catch (err) {
				//        console.log(err);
				//        setTimeout(start, 5000);
				//    }
				//};

				//connection.onclose(async () => {
				//    await start();
				//});

			    //// Start the connection.
				//start();

                // 03 Apr 2024: END


				try
				{
					// Declare a proxy to reference the hub
                    var sHubURL = options.HubURL;
                    if (!sHubURL)
                        sHubURL = sSignalRServerURL;    // Default

					var connection = $.hubConnection(sHubURL);

					// If it is already active, close it
					connection.stop();

					// Try logging
					connection.logging = true;

					// Add Event Key To SignalR Connector
					var sHubName = 'TriSysWebAPIHub'; 
					connection.qs = WebAPIKey + '&' + sUserIdKeyAssignment;
					_HubProxy = connection.createHubProxy(sHubName);

					// If the "Send" function gets called on the server, this will fire a "BroadcastMessage" event for all Clients with the matching "EventKey" associated listener event. 
					// This will get called when the server attempts to call out the "broadcastMessage" event
					_HubProxy.on('BroadcastMessage', Receive);

					// Start the connection. Set the withCredentials to false to get round a CORS error
					var startParameters = {

						// Auto select transport and start connection immediately
						waitForPageLoad: false,

						// Set the withCredentials to false to get round a CORS error
						withCredentials: false,

						// Set the transport to use web sockets by default
						transport: ['webSockets', 'serverSentEvents', 'longPolling']
						//transport: ['serverSentEvents', 'longPolling']				// 24 July 2019 to prevent hanging
						//transport: ['longPolling', 'serverSentEvents','webSockets' ]	// 24 July 2019 to prevent hanging
						//transport: ['webSockets' ]									// 24 July 2019 to prevent hanging
					};

					connection.start(startParameters).done(function ()
					{
						if(_ConnectionOptions.ConnectedStatus)
							_ConnectionOptions.ConnectedStatus("SignalR started: " + connection.id + ", transport: " + connection.transport.name);

					}).fail(function (reason)
					{
						if(_ConnectionOptions.ConnectedStatus)
							_ConnectionOptions.ConnectedStatus("SignalR failed: " + reason);
					});

					connection.error(function (error)
					{
						if(_ConnectionOptions.ConnectedStatus)
							_ConnectionOptions.ConnectedStatus('SignalR error: ' + error);
					});

					connection.connectionSlow(function ()
					{
						if(_ConnectionOptions.ConnectedStatus)
							_ConnectionOptions.ConnectedStatus('We are currently experiencing difficulties with the connection.');
					});

					connection.disconnected(function ()
					{
						setTimeout(function ()
						{
							connection.start(startParameters);

						}, 1000); // Restart connection after 1 second

						if(_ConnectionOptions.ConnectedStatus)
							_ConnectionOptions.ConnectedStatus('Connection disconnected. Re-starting...');
					});

				} catch (e)
				{
					if(_ConnectionOptions.ConnectedStatus)
						_ConnectionOptions.ConnectedStatus("TriSysSignalr.Communication.Connect: $.hubConnection ERROR");
					return;
				}
			},						// TriSysSignalr.Communication.Connect

			Send: function (sRecipient, sMessage)		// TriSysSignalr.Communication.Send
			{
			    debugger;
				if (!sMessage)
				{
					if(_ConnectionOptions.ConnectedStatus)
						_ConnectionOptions.ConnectedStatus('No message specified.');
					return;
				}

				// Create a full JSONP message which can be easily identified upon receipt
				var messageObject = {

					Sender: SendEventAppCompanyLogin,
					Recipient: sRecipient,
					Message: sMessage       // Could be a JSON stringified object as our SignalR uses JSONP
				};

				try
				{
					// Deserialize into a string for transmission
				    var sJSONDataPacket = JSON.stringify(messageObject);

				    // 18 Apr 2024: As we transition away from SignalR to Socket.IO, use Web API to route instead of direct SignalR comms
				    try {
                        // The run-time instance name in the extension.js
				        TriSysApex.InterprocessCommunication._TriSysSignalrInstance.Communication.SendViaWebAPI(sRecipient, SendEventAppCompanyLogin, sMessage);
				        return;     // Allow only Web API to send message

				    } catch (e) {
				        console.log("ERROR: ", e);
				    }

					// Call server invoking send event
					_HubProxy.invoke('Send', sRecipient, SendEventAppCompanyLogin, sJSONDataPacket);

					// Callback into caller function to record sent message
					if(_ConnectionOptions.SentMessage)
					    _ConnectionOptions.SentMessage(sRecipient, messageObject.Message);

				} catch (e)
				{
					if(_ConnectionOptions.ConnectedStatus)
							_ConnectionOptions.ConnectedStatus("Error sending to " + sRecipient);
				}

			},

            // Purely for user options debug
			HubURL: function ()      // TriSysApex.SignalR._TriSysSignalrInstance.Communication.HubURL()
			{
			    return sSignalRServerURL;
			},

		    // 18 Apr 2024: As we transition away from SignalR to Socket.IO, use Web API to route instead of direct SignalR comms
			SendViaWebAPI: function(sRecipient, sSender, sJSONDataPacket)  // TriSysSignalr.Communication.SendViaWebAPI
			{
			    var payloadObject = {};
			    payloadObject.URL = "OfficeAutomation/SendInterProcessCommunicationMessage";
			    payloadObject.OutboundDataPacket = {
			        Recipient: sRecipient,
			        Sender: sSender,
                    Message: sJSONDataPacket
			    };
			    payloadObject.InboundDataFunction = function (CSendInterProcessCommunicationMessageResponse)
			    {
			        if(CSendInterProcessCommunicationMessageResponse)
			        {
			            if (CSendInterProcessCommunicationMessageResponse.Success)
			            {
			                var sMessage = "We sent the inter-process communication message to " + sRecipient + 
                                            " from " + sSender;
			                console.log(sMessage);
			            }	
			        }			
			    };
			    TriSysAPI.Data.PostToWebAPI(payloadObject);
			}

					
		}	// TriSysSignalr.Communication

    };

};	// TriSysSignalr
