var AppStudio =
{
	DesignModeOnName: 'AppStudio.DesignModeOn',

	Load: function ()
	{
		// Retain the design mode state
		AppStudio.DesignMode(AppStudio.DesignModeOn());

		const iHeight = $(window).height() - 200;
		$('#AppStudio-file-panel-instructions').css('min-height', iHeight + 'px');
	},

	DesignModeOn: function ()
	{
		return TriSysApex.Cache.UserSettingManager.GetValue(AppStudio.DesignModeOnName, false);
	},

	DesignMode: function (bOn)
	{
		TriSysApex.Cache.UserSettingManager.SetValue(AppStudio.DesignModeOnName, bOn);

		const sPrefix = 'AppStudio-Mode-';
		const onElement = $('#' + sPrefix + 'On');
		const offElement = $('#' + sPrefix + 'Off');

		bOn ? offElement.show() : offElement.hide();
		bOn ? onElement.hide() : onElement.show();

		AppStudio.ShowOverlays(bOn);
	},

	// All app studio configurators are listed here
	// 16 May 2025: OLD CODE. See AppStudioHome.js for new code
	Configurators: [
		{
			id: 'navbar-product-logo-hyperlink',
			text: 'Application',
			tool: 'appconfig'
		},
		{
			id: 'scrollNavBar',
			text: 'Navigation Bar',
			tool: 'navbar',
			control: 'app-studio/ctrlNavigationBar.html',
			script: TriSysApex.Constants.UserControlFolder + 'app-studio/ctrlNavigationBar.js',
			loadFunction: 'AppStudioNavigationBar.Load',
			saveFunction: 'AppStudioNavigationBar.Persistence.Save',
			iconPickedFunction: 'AppStudioNavigationBar.IconPicked'
		},
		{
			id: 'nav-bar-activities',
			text: 'Activity Metrics',
			tool: 'activitymetrics'
		},
		{
			id: 'app-caption-fixed-top',
			text: 'App Toolbar',
			tool: 'apptoolbar'
		},
		{
			id: 'divFormContentRow',
			text: 'Form Design',
			tool: 'formdesign'
		}
	],


	ShowOverlays: function (bShow)
	{
		// Remove any existing overlays to avoid duplicates
		$('.overlay-button').remove();
		//$('.overlay-tooltip').remove();  // Remove any existing tooltips

		const lstConfigurator = AppStudio.Configurators;
		lstConfigurator.forEach(function (configurator)
		{
			const $div = $('#' + configurator.id);		// Reference to the current div
			const divId = $div.attr('id');				// Get the ID of the div
			const configuratorText = configurator.text;	// Get the text of the configurator

			if (bShow)
			{
				// Create a new button element
				const sCaption = '<br><span style="font-size: 12px;">' + configurator.text + '</span>';

				//const $button = $('<button class="overlay-button">Click Me</button>');
				const $button = $('<a href="javascript:void(0)" class="btn btn-alt btn-lg btn-primary overlay-button"><i class="fa fa-cog fa-2x"></i>' + sCaption + '</a>');

				// Create a new tooltip element
				const $tooltip = $('<div class="overlay-tooltip">Div ID: ' + divId + '</div>');

				const iMaxZOrder = 1031;
				const iVerticalOffset = 14;
				const iTop = ($div.offset().top + $div.outerHeight() / 2) + iVerticalOffset;	// Center vertically
				const fSemiTransparentOpacity = 0.5;

				// Position the button absolutely within the div
				$button.css({
					position: 'absolute',
					top: iTop,
					left: $div.offset().left + $div.outerWidth() / 2, // Center horizontally
					transform: 'translate(-50%, -50%)', // Adjust for true centering
					padding: '5px 10px', // Add some padding for better appearance
					borderRadius: '50%!important', // Make it a circle
					opacity: fSemiTransparentOpacity, // Make it semi-transparent
					zIndex: iMaxZOrder // Ensure it's on top of the content
				});

				// Position the tooltip near the button
				//$tooltip.css({
				//	position: 'absolute',
				//	top: $div.offset().top + $div.outerHeight() / 2 + 50, // Position below the button
				//	left: $div.offset().left + $div.outerWidth() / 2, // Center horizontally with the button
				//	transform: 'translate(-50%, -50%)', // Adjust for true centering
				//	zIndex: 1001, // Ensure it's on top of the button
				//	display: 'none', // Hidden by default
				//	padding: '5px 10px', // Add some padding for better appearance
				//	backgroundColor: 'black', // Background color for tooltip
				//	color: 'white', // Text color for tooltip
				//	borderRadius: '5px', // Rounded corners
				//	fontSize: '12px', // Smaller font size
				//	whiteSpace: 'nowrap', // Prevent line breaks
				//	zIndex: iMaxZOrder // Ensure it's on top of the content
				//});

				// Append the button and tooltip to the body
				$('body').append($button);
				//$('body').append($tooltip);

				// Set up the click event handler for the button
				$button.click(function ()
				{
					var sCurrentFormName = TriSysApex.FormsManager.SelectedFormName;

					//TriSysApex.Toasters.Info('Button clicked on div with ID: ' + divId);
					//TriSysApex.UI.ShowMessage('TODO: Configurator for ' + configuratorText +
					//	".<br>Current open form: " + sCurrentFormName);

					AppStudio.OpenConfigurator(configurator);
				});

				// Button hover
				$button.hover(
					function ()
					{ // Mouse enter
						//$tooltip.show(); // Show tooltip
						$(this).css('opacity', 1); // Reset opacity to 100%
					},
					function ()
					{ // Mouse leave
						//$tooltip.hide(); // Hide tooltip
						$(this).css('opacity', fSemiTransparentOpacity);
					}
				);
			}
		});
		
	},

	// Open the configurator modal and load the editor for this specific type of configuration
	OpenConfigurator: function (configurator)
	{
		var fnLoadedScript = function ()
		{
			var parametersObject = new TriSysApex.UI.ShowMessageParameters();

			parametersObject.Title = configurator.text + ' Configurator';
			parametersObject.Image = "fa-cog";
			parametersObject.Maximize = true;
			parametersObject.FullScreen = true;
			parametersObject.CloseTopRightButton = true;
			parametersObject.Draggable = false;		// When using dashboard style editor, we needed to turn off dragging
			// Actually, full screen modals turn off dragging anyway!

			// New 2021
			parametersObject.ContentURL = TriSysApex.Constants.UserControlFolder + "app-studio/ctrlAppStudioConfigurator.html";

			// Feed in the selected configurator details when loaded
			parametersObject.OnLoadCallback = function ()
			{
				ctrlAppStudioConfigurator.Load(configurator);
			};

			// Buttons
			parametersObject.ButtonLeftVisible = true;
			parametersObject.ButtonLeftText = "Apply";
			parametersObject.ButtonLeftFunction = function ()
			{
				// Fire save event
				ctrlAppStudioConfigurator.Persistence.Save();
			};

			parametersObject.ButtonCentreVisible = true;
			parametersObject.ButtonCentreText = "Apply &amp; Close";
			parametersObject.ButtonCentreFunction = function ()
			{
				// Fire save event, then close this modal
				ctrlAppStudioConfigurator.Persistence.Save();
				return true;
			};

			parametersObject.ButtonRightVisible = true;
			parametersObject.ButtonRightText = "Close";

			TriSysApex.UI.PopupMessage(parametersObject);
		};

		// Load the JS now
		TriSysApex.WhiteLabelling.LoadJavascriptFile(TriSysApex.Constants.UserControlFolder + 'app-studio/ctrlAppStudioConfigurator.js',
														null, fnLoadedScript);
	}

};	// AppStudio

$(document).ready(function ()
{
    AppStudio.Load();
});