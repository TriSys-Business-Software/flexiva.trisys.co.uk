11 July 2017
------------

The configuration/custom folder contains a folder for each custom app specified in white-label.json:
	"DefaultMode": "Custom"

A custom app is an off-line self-contained app such as a PhoneGap or Electron app which works on a device
which is potentially off-line therefore needs local custom code such as main.js instead of relying upon
the internet and our web api to supply custom code from https://api.trisys.co.uk/apex/custom/id.

The Configurator tool will configure index.html and Index-Background.html with the 3rd party libraries for the app.
This will minimise the load time for custom apps to be faster than full blown Apex.

In particular, each custom app will use a local main.js which will manually bootstrap the custom app by loading the
navbar.json and forms.json, and setting up the appropriate API Key and any other settings to get the app bootstrapped.

-----
It may be possible to have these custom files also stored on the device in a custom location so that we can replenish
the app from our cloud, obviating the need to keep publishing releases to the app store.
Perhaps in the 2018 timeframe once we have experience of multiple custom apps.
-----

The first custom app is opus-laboris-app.
This is a mobile app or mobile web app for our fictitious gardening recruitment company.
It will also be hosted at www.opuslaboris.com which is a domain we own.
This will be a standalone server separate from our network.
This will allow us to test the whole Configurator publish process.
3rd parties such as Upwork contractors or web designers could be given access to this
server so that they could configure, code, design or publish to app stores.
This would be our 'factory': app factory or software factory.

27 May 2025
-----------

We are now automatically building this app on GitHub at https://github.com/TriSys-Business-Software/Flexiva
after we COMMIT and PUSH this to the master branch.
This custom folder is now used to replace files and settings for the numerous custom apps we have.
See C:\Users\garry\source\repos\flexiva.trisys.co.uk and https://github.com/TriSys-Business-Software/flexiva.trisys.co.uk
which is the first Flexiva site to use this custom folder.
