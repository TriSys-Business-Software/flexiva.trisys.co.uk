var ctrlAbout =
{
    _PlayedSound: false,

    Load: function ()
    {
        debugger;
        var bShowTriSysAnimation = (TriSysApex.Constants.TriSysHostedCRM);

        if (bShowTriSysAnimation)
        {
            // Start animation
            //var lottiePlayer = document.querySelector("dotlottie-player");
            //lottiePlayer.load("https://api.trisys.co.uk/apex/assets/lottie/trisys_4.lottie");
            if (!ctrlAbout._PlayedSound)
            {
                // 17 Nov 2022: No sound
                //TriSysSDK.Audio.PlayAsset('audio-tag-about');       // Only play first time
                ctrlAbout._PlayedSound = true;
            }

            var iVisibilitySeconds = 5;
            setTimeout(function ()
            {
                //lottiePlayer.stop();
                //lottiePlayer.remove();
                $('#trisys-logo-player').hide();    //.fadeOut("slow", "linear");
                $('#trisys-about-div').fadeIn("slow", "linear");
            }, (iVisibilitySeconds * 1000));
        }
        else
        {
            $('#trisys-logo-player').hide();
            $('#trisys-about-div').fadeIn("slow", "linear");
        }

        // Show version and licensee
        var d = new Date();
        var iYear = d.getFullYear();
        var sContactUsHTML = '&copy;' + ' 1994 - ' + iYear + ' ' + TriSysApex.Copyright.AllRightsReserved;

        $('#trisys-about-apex-version').html(TriSysApex.Application.Version());
        $('#trisys-about-copyright').html(sContactUsHTML);

        var userCredentials = TriSysApex.LoginCredentials.UserCredentials();
        if (userCredentials && userCredentials.LoggedInUser)
        {
            var contact = userCredentials.LoggedInUser.Contact
            var sCompanyName = TriSysApex.Copyright.AllRightsReserved;
            if (contact)
                sCompanyName = contact.CompanyName;

            $('#trisys-about-licensee').html(sCompanyName);
            $('#trisys-about-users').html('');

            // Hide potentially sensitive public information
            var sSQLServer = TriSysApex.UserOptions.MaskPublicResourcePath(userCredentials.SQLServer) + '.' + userCredentials.Database;
            var sNAS = TriSysApex.UserOptions.MaskPublicResourcePath(userCredentials.GDrivePath);

            $('#trisys-about-database').html(sSQLServer);
            $('#trisys-about-storage').html(sNAS);
            $('#trisys-about-login-information').show();
        }

        ctrlAbout.WhiteLabel();
        ctrlAbout.ImageColourOverlay();
        ctrlAbout.AsyncAPIVersion();
        ctrlAbout.AutoCloseMe();
    },

    // If we are re-building the API, make sure we do not block when we read it
    AsyncAPIVersion: function ()
    {
        var fnCallback = function (sVersion)
        {
            $('#trisys-about-api-version').html(sVersion);
        };

        if (!TriSysPhoneGap.isConnectedToComms())
        {
            fnCallback('No Internet');
            return false;
        }

        TriSysAPI.Data.Version(fnCallback);
    },

    VisitUsButtonClick: function ()
    {
        var sLanguageTranslation = '';
        var sLanguageCode = TriSysSDK.Resources.Language;
        if (sLanguageCode != 'en')
            sLanguageTranslation = '#googtrans(en|' + sLanguageCode + ')';

        var sURL = TriSysApex.Copyright.HomePage;
        if (sURL.indexOf("http") < 0)
            sURL = "http://" + sURL;

        sURL += sLanguageTranslation;
		TriSysSDK.Browser.OpenURL(sURL);
    },

    WhiteLabel: function()
    {
        // If white labelling, use their logo here
        if (TriSysApex.Constants.WhiteLabelled)
        {
			if(TriSysApex.Constants.AboutImage)
				$('.trisys-about-div').css('background-image', 'url(' + TriSysApex.Constants.AboutImage + ')');

			if(TriSysApex.Copyright.ShortProductName)
				$('#trisys-about-apex-version-short-product-name').html(TriSysApex.Copyright.ShortProductName);

			if(TriSysApex.Copyright.ShortProductName)
				$('#trisys-about-api-version-short-product-name').html(TriSysApex.Copyright.ShortProductName);

			if(TriSysApex.Copyright.FrameworkName)
				$('#trisys-about-apex-version-short-product-framework-name').html(TriSysApex.Copyright.FrameworkName);
        }

        // If web jobs, hide terms and conditions button
        if(!TriSysApex.Constants.TriSysHostedCRM)
        {
            $('#trisys-modal-warning').hide();
        }
    },

    // Use the current theme to overlay the image
    ImageColourOverlay: function()
    {
        var lBackColour = TriSysProUI.NavBarInverseBackColour();
        var fTransparency = 0.40;

        sRGB = lBackColour;
        var sStyle = 'position: absolute; content:" "; top:0px; left:20px; width:693px; height:330px; display: block; z-index:0; border-radius: 10px;' +
            'background-color:' + sRGB + ';' +
            'opacity: ' + fTransparency + ';';

        $('<style>.trisys-about-image-overlay:before{' + sStyle + '}</style>').appendTo('head');
    },

    // 11 Feb 2024: Be like smart-client and close automatically
    AutoCloseMe: function()
    {
        // Prevent previous timer closing us prematurely
        if (TriSysApex.Constants.AutoCloseHelpAboutModal)
            clearTimeout(TriSysApex.Constants.AutoCloseHelpAboutModal);

        var iSeconds = 10;
        TriSysApex.Constants.AutoCloseHelpAboutModal = setTimeout(function ()
        {
            // Is ctrlAbout open?
            var bModalOpen = TriSysApex.UI.isModalOpen();

            if(bModalOpen)
                TriSysApex.UI.CloseModalPopup();

            TriSysApex.Constants.AutoCloseHelpAboutModal = null;

        }, 1000 * iSeconds);
    }
};
