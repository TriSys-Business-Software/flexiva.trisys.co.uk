var TriSysExtension =
{
    Load: function()
    {
        // Finish the original themed initialisation for the UI framework
        //try
        //{
        //    App.init();
        //}
        //catch (err)
        //{
        //    alert(err);
        //};

        // Legacy code lifted from working Apex - turning on today Sunday 15th Feb 2014
        TriSysLoad.ApexFramework.LoadDynamically(function ()
        {
            // Get ready to receive messages from the browser extension
            TriSysExtension.InitialiseMessageReceiver();

            // Display the time we instantiated to see if it changes as contacts are loaded
            var dt = new Date().toLocaleDateString() + ' [' + new Date().getSeconds() + '.' + new Date().getMilliseconds() + ']';
            $('#trisys-contact').html("Instantiated " + dt);
        });

    },

    // Allow us to receive messages from the browser extension
    InitialiseMessageReceiver: function()
    {
        // Capture messages
        // Get a reference to the div on the page that will display the
        // message text.
        var messageEle = document.getElementById('trisys-message');

        // A function to process messages received by the window.
        function receiveMessage(e)
        {
            if (!e.origin)
                return;

            // Check to make sure that this message came from the correct domain.
            if (e.origin.indexOf("trisys.co.uk") < 0 && e.origin.indexOf("linkedin") < 0 && e.origin.indexOf("google") < 0)
                return;

            // Message must also be an actual JSON object
            var extensionObject = e.data;

            if (!extensionObject)
                return;     // Not interested in null

            else if (extensionObject.Type == TriSysApex.InterprocessCommunication.MessageType_TriSysToBrowser)
            {
                // Ignore these messages which we send to the browser extension to show/hide the top region, close, refresh etc..
            }
            else if (extensionObject.Type == TriSysApex.InterprocessCommunication.MessageType_ExtensionToTriSys)
            {
                // The extension needs to tell us something
                if (extensionObject.Instruction == TriSysApex.InterprocessCommunication.NoApexTabFound)
                    console.log('Apex not found: TODO - sign up or launch...');
            }
            else
            {
                // Process the message
                TriSysExtension.ProcessReceivedMessage(extensionObject);

                // Debug
                var sURL = extensionObject.URL;

                // Update the div element to display the message.
                messageEle.innerHTML = "Message Received: " + sURL;

                console.log(sURL);
            }
        }

        // Setup an event listener that calls receiveMessage() when the window
        // receives a new MessageEvent.
        window.addEventListener('message', receiveMessage);
    },

    ProcessReceivedMessage: function (extensionObject)
    {
        var lookupObject = {};

        switch(extensionObject.Type)
        {
            case TriSysApex.InterprocessCommunication.MessageType_LinkedInToTriSys:
                //Address: ""
                //Company: ""
                //Connections: "500+"
                //EMail: ""
                //Education: "The Duston School"
                //FullName: "Emma Woolliscroft"
                //HTML: "<html><!--<![endif]--><head>↵<script src="https://static.licdn.com:443/scds/common/u/lib/fizzy/fz-1.3.8-min.js" type="text/javascript"></script><script type="text/javascript">fs.config({"failureRedirect":"https://www.linkedin.com/nhome/","uniEscape":true,"xhrHeaders":{"X-FS-Origin-Request":"/profile/view?id=AAEAAAOCSJUBictN6rI4m17JvLkHSxDRlTbiowg&authType=name&authToken=7FOb&trk=prof-sb-browse_map-name","X-FS-Page-Id":"nprofile-view"}});</script><script></script>↵<meta name="globalTrackingUrl" content="//www.linkedin.com/mob/tracking">↵<meta name="globalTrackingAppName" content="profile">↵<meta name="globalTrackingAppId" content="webTracking">↵<meta name="lnkd-track-json-lib" content="https://static.licdn.com/scds/concat/common/js?h=2jds9coeh4w78ed9wblscv68v-ebbt2vixcc5qz0otts5io08xv&amp;fc=2">↵↵<meta name="treeID" content="A55L9MrHDxQAZVZYKCsAAA==">↵<meta name="appName" content="profile">↵↵<meta http-equiv="content-type" content="text/html; charset=UTF-8">↵<meta http-equiv="X-UA-Compatible" content="IE=edge">↵<meta name="pageImpressionID" content="54c1aa81-5d7e-44bf-8d26-d7da2f59b995">↵<meta name="pageKey" content="nprofile_view_nonself">↵<meta name="analyticsURL" content="/analytics/noauthtracker">↵<link rel="openid.server" href="https://www.linkedin.com/uas/openid/authorize">↵<link rel="apple-touch-icon-precomposed" href="https://static.licdn.com/scds/common/u/img/icon/apple-touch-icon.png">↵<!--[if lte IE 8]>↵ <link rel="shortcut icon" href="https://static.licdn.com/scds/common/u/images/logos/favicons/v1/16x16/favicon.ico">↵<![endif]-->↵<!--[if IE 9]>↵ <link rel="shortcut icon" href="https://static.licdn.com/scds/common/u/images/logos/favicons/v1/favicon.ico">↵<![endif]-->↵<link rel="icon" href="https://static.licdn.com/scds/common/u/images/logos/favicons/v1/favicon.ico">↵<meta name="msapplication-TileImage" content="https://static.licdn.com/scds/common/u/images/logos/linkedin/logo-in-win8-tile-144_v1.png">↵<meta name="msapplication-TileColor" content="#0077B5">↵<meta name="application-name" content="LinkedIn">↵<link rel="stylesheet" type="text/css" href="https://static.licdn.com/scds/concat/common/css?h=765zh9odycznutep5f0mj07m4-c8kkvmvykvq2ncgxoqb13d2by-2tr6x8k7l0ipmtloku8tcciqt-7mxyksftlcjzimz2r05hd289r-4uu2pkz5u0jch61r2nhpyyrn8-7poavrvxlvh0irzkbnoyoginp-4om4nn3a2z730xs82d78xj3be-35dk2u00mxodtd0hghi301vw3-ct4kfyj4tquup0bvqhttvymms-a6c7eivr8umrp20gkm4s5m4kd-9zbbsrdszts09by60it4vuo3q-8ti9u6z5f55pestwbmte40d9-5limxi64wqu1jndzoedsmqusm-3pwwsn1udmwoy3iort8vfmygt-b1019pao2n44df9be9gay2vfw-aau7s6f37xbtq1daynn0bb656&amp;fc=2">↵<script type="text/javascript" src="https://static.licdn.com/scds/concat/common/js?h=3nuvxgwg15rbghxm1gpzfbya2-35e6ug1j754avohmn1bzmucat-mv3v66b8q0h1hvgvd3yfjv5f-14k913qahq3mh0ac0lh0twk9v-a06jpss2hf43xwxobn0gl598m-b7ksroocq54owoz2fawjb292y-62og8s54488owngg0s7escdit-c8ha6zrgpgcni7poa5ctye7il-8gz32kphtrjyfula3jpu9q6wl-51dv6schthjydhvcv6rxvospp-e9rsfv7b5gx0bk0tln31dx3sq-2r5gveucqe4lsolc3n0oljsn1-8v2hz0euzy8m1tk5d6tfrn6j-di2107u61yb11ttimo0s2qyh2-6l0nxmmtxeafvr16kwnd8kwhm-a5z91y8xfiqdawrgpl2z4m6gs-93jgstnkffqiw9htrr1tva7y3-8smnecogemojwdwzfv5cpp5tu-999q8q1ovip41ng1nylee3woz-csnxdtylpuwyl6o2q6e1aq026-39kuwv80yvqr74w4oe9bge0md-7ty57fxmbd5klxui85wcgpq3k-e1yamnwwzlstlh2d0l31jqbq3-39qtiin34ku3a7j62elxviuxr-8su35siohpmem14ncxhw06cld-ccxtvi3w660pars8qw3alamil-2omk2r99oh5bclz38pec7mgir-a41ta3jc47pqgbhatfqzr8pxw-5zv65pjexlq9cjvexh8zx01ce-9z9qie2zhzk0ajeviymtjhkax-ardfhl8u623upkogt134yn57e-180el9di2gu9xdjlw3xxxmvw9-afidfhsflxg4xbsflg6kz81nf&amp;fc=2"></script>↵<script type="text/javascript">LI.define('UrlPackage');LI.UrlPackage.containerCore=["https://static.licdn.com/scds/concat/common/js?h=d7z5zqt26qe7ht91f8494hqx5&fc=2"][0];</script>↵<script type="text/javascript">(function(){if(typeof LI==='undefined'||!LI){window.LI={};}↵var shouldUseSameDomain=false&&false&&!/Version\//i.test(window.navigator.userAgent);function adjustUrlForIos(url){return shouldUseSameDomain?url.replace(/^(?:https?\:)?\/\/[^\/]+\//,'/'):url;}↵LI.JSContentBasePath=adjustUrlForIos("https:\/\/static.licdn.com\/scds\/concat\/common\/js?v=build-2000_8_51999-prod&fc=2");LI.CSSContentBasePath=adjustUrlForIos("https:\/\/static.licdn.com\/scds\/concat\/common\/css?v=build-2000_8_51999-prod&fc=2");LI.injectRelayHtmlUrl=shouldUseSameDomain?null:"https:\/\/static.licdn.com\/scds\/common\/u\/lib\/inject\/0.6.1\/relay.html";LI.comboBaseUrl=adjustUrlForIos("https:\/\/static.licdn.com\/scds\/concat\/common\/css?v=build-2000_8_51999-prod&fc=2");LI.staticUrlHashEnabled=true;}());</script>↵<script type="text/javascript" src="https://static.licdn.com/scds/concat/common/js?h=25kaepc6rgo1820ap1rglmzr4-6ot707sexq302fvv0v32zqer-dtx8oyvln9y03x1ku6t0abhc9-cl5mre9823ndhfdrl4nozaofi-6isi7fr80gagap7736arbauct-8ohb0iio22nbqe1w8et54sawe-13kfns70b5ghzzqxzr194d2jo-25233ulgj7cafbxrekfmv2hbg-amjylk8w8039f2lwlov2e4nmc-47qp7uw3i5i1pqeovirlcc070-502kfdfn2vrcmr3gu87mt1aa0-1fz6jht38isjjtl3cpq3k4924-d0xbkmth84j48zsiq4iptzyog-cxt2xy6s0697lquhao5xxhhzp-aikuay313zihm…tyle: solid; border-left-color: rgb(224, 224, 224); text-align: center; position: fixed; left: 0px; top: 0px; z-index: 2147483647; overflow: hidden; background: rgb(255, 255, 255);"><iframe id="trisys-iframe" src="https://apex.trisys.co.uk/extension-top-region.html" style="width: 100%; border: none; overflow: hidden;"></iframe></div><iframe src="https://static.licdn.com/scds/common/u/lib/inject/0.6.1/relay.html?injectReturn=https%3A%2F%2Fwww.linkedin.com%2Fprofile%2Fview%3Fid%3DAAEAAAOCSJUBictN6rI4m17JvLkHSxDRlTbiowg%26authType%3Dname%26authToken%3D7FOb%26trk%3Dprof-sb-browse_map-name" style="visibility: hidden; border: 0px; width: 1px; height: 1px; left: -5000px; top: -5000px; opacity: 0;"></iframe><script>function setCookie(k,v) { var ex=new Date(); ex.setDate(ex.getDate() + 730); document.cookie=k + "=" + v + "; expires=" + ex.toUTCString();}↵function deleteCookie(name) { document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:01 GMT;";}↵function getCookie(k) { var i,x,y,ARRcookies=document.cookie.split(";"); for (i=0;i<ARRcookies.length;i++) { x=ARRcookies[i].substr(0,ARRcookies[i].indexOf("=")); x=x.replace(/^\s+|\s+$/g,""); if (x==k) { return ARRcookies[i].substr(ARRcookies[i].indexOf("=")+1); }}}↵function setMinimized() { if (getCookie("cSideMin") == "true") { document.getElementById("c-side").style.width = "10px"; var cSideCloseDiv = document.getElementById("c-side-close-div"); cSideCloseDiv.getElementsByClassName("minimized")[0].style.display = "block"; cSideCloseDiv.getElementsByClassName("unminimized")[0].style.display = "none"; window.location.href.indexOf("www.linkedin.com") > 0 && document.getElementsByClassName("top-nav").length > 0 && (document.getElementsByClassName("top-nav")[0].style.marginRight = "0"); window.location.href.indexOf("www.linkedin.com") > 0 && document.getElementsByClassName("bottom-nav").length > 0 && (document.getElementsByClassName("bottom-nav")[0].style.marginRight = "0"); document.body.style.marginRight = ""; } else { document.getElementById("c-side").style.width = "260px"; var cSideCloseDiv = document.getElementById("c-side-close-div"); cSideCloseDiv.getElementsByClassName("minimized")[0].style.display = "none"; cSideCloseDiv.getElementsByClassName("unminimized")[0].style.display = "block"; window.location.href.indexOf("www.linkedin.com") > 0 && document.getElementsByClassName("top-nav").length > 0 && (document.getElementsByClassName("top-nav")[0].style.marginRight = "260px"); window.location.href.indexOf("www.linkedin.com") > 0 && document.getElementsByClassName("bottom-nav").length > 0 && (document.getElementsByClassName("bottom-nav")[0].style.marginRight = "260px"); if (!/https?:\/\/www\.facebook\.com\/.*/.test(window.location)) { document.body.style.marginRight = "260px";}}}↵if (getCookie("cSideMin") != "true") { deleteCookie("cSideMin"); }↵function switchMinimized() { if (getCookie("cSideMin") == "true") { deleteCookie("cSideMin"); } else { setCookie("cSideMin", "true"); }↵ setMinimized();}↵</script><style type="text/css" media="print">.noprint { display: none; }</style><div id="c-side" style="z-index: 2147483647; position: fixed; right: 0px; width: 10px; height: 100%; top: 0px;"><div class="noprint" style="width:260px;height:100%"><div id="c-side-close-div" style="float:left;cursor:pointer;height:100%;background-color:lightgray;width:10px;"><div class="minimized" style="box-sizing: content-box; position: absolute; top: 50%; height: 60px; margin-top: -30px; margin-left: -10px; padding: 0px 5px; width: 10px; border-bottom-width: 1px; border-bottom-style: solid; border-bottom-color: rgb(15, 91, 207); display: block; background-color: rgb(15, 139, 255);"><div id="c-side-close-button" style="position:absolute;top:50%;margin-top:-0.75em;font-size:18px;color:#fff">«</div></div><div class="unminimized" style="box-sizing: content-box; position: absolute; top: 50%; height: 60px; margin-top: -30px; width: 10px; border-bottom-width: 1px; border-bottom-style: solid; border-bottom-color: rgb(15, 91, 207); display: none; background-color: rgb(15, 139, 255);"><div id="c-side-close-button" style="position:absolute;top:50%;margin-top:-0.75em;font-size:18px;color:#fff">»</div></div></div><div style="float:left;width:250px;height:100%"><iframe style="width:100%;height:100%;" frameborder="0" src="chrome-extension://mbbpjgnlpelaafnnigciegfpelchjldl/views/sidebar-frame.html?url=https%3A%2F%2Fwww.connectifier.com%2Fextension%2Fprofile%3Fversion%3Dchrome-0.6.8%26profileUrl%3Dhttps%253A%252F%252Fwww.linkedin.com%252Fprofile%252Fview%253Fid%253DAAEAAAOCSJUBictN6rI4m17JvLkHSxDRlTbiowg%2526authType%253Dname%2526authToken%253D7FOb%2526trk%253Dprof-sb-browse_map-name%26personId%3D53bacf54e4b092c4b9254879%26profileId%3DLINKEDIN%253A%253A58869909"></iframe></div></div></div><script>setMinimized();document.getElementById("c-side-close-div").addEventListener("click", function() { switchMinimized(); });</script></body></html>"
                //Industry: "Staffing and Recruiting"
                //JobTitle: "Recruitment Consultant at Interaction Recruitment"
                //Location: "Northampton, Northamptonshire, United Kingdom"
                //Phone: ""
                //Photo: "https://media.licdn.com/mpr/mpr/shrinknp_400_400/p/3/000/046/194/3ff3937.jpg"
                //PreviousCompanies: "Clearwater People Solutions,Capita Assurance and Testing,Pertemps"
                //ProfileURL: "https://uk.linkedin.com/in/emmawoolliscroft"
                //Twitter: ""
                //Type: "LinkedInToTriSys"
                //URL: "https://www.linkedin.com/profile/view?id=AAEAAAOCSJUBictN6rI4m17JvLkHSxDRlTbiowg&authType=name&authToken=7FOb&trk=prof-sb-browse_map-name"
                //WebSites: "

                lookupObject.LinkedIn = extensionObject;
                break;

            case TriSysApex.InterprocessCommunication.MessageType_GMailToTriSys:
                //Attachments: Array[3]
                // 0: Object
                //  Caption: "g-mail date received.png"
                //  Thumbnail: "//ssl.gstatic.com/docs/doclist/images/mediatype/icon_1_image_x16.png"
                //  URL: "?ui=2&ik=94d662f5d9&view=att&th=1508ee186e87f881&attid=0.1&disp=safe&realattid=a87be591d67538a2_0.1&zw"
                // 1: Object
                // 2: Object
                // length: 3
                //DateTime: "22 October 2015 at 10:29"
                //HTML: "<html><head><script id="logger1445592585279request" type="text/javascript" src="https://rapportive.com/log/gmail.loader.initialize/error?message=Rapportive%20application%20injected%2C%20but%20failed%20to%20initialize%20&amp;callback=logger1445592585279"></script><script id="logger1445592585279callback" type="text/javascript">function logger1445592585279 () {↵ try {↵ window.logger1445592585279 = undefined;↵ delete window.logger1445592585279;↵ } catch (e) {}↵ var request = document.getElementById('logger1445592585279request');↵ if (request) request.parentNode.removeChild(request);↵ var callback = document.getElementById('logger1445592585279callback');↵ if (callback) callback.parentNode.removeChild(callback);↵}↵</script><style>.gsoi_w{background:transparent url("https://ssl.gstatic.com/cloudsearch/static/o/d/0014-8437y435b87fb74bc83b83n8g78/icons.png") no-repeat 4px 0;background-size:16px;height:16px}.gsoi_x,.gsoi_xu{background:transparent url("https://ssl.gstatic.com/cloudsearch/static/o/d/0014-8437y435b87fb74bc83b83n8g78/icons.png") no-repeat 4px -16px;background-size:16px;height:16px}.gsoi_xs,.gsoi_xsu{background:transparent url("https://ssl.gstatic.com/cloudsearch/static/o/d/0014-8437y435b87fb74bc83b83n8g78/icons.png") no-repeat 4px -32px;background-size:16px;height:16px}.gsoi_c{padding-left:4px;height:16px}.gsoi_0{background:transparent url("https://ssl.gstatic.com/cloudsearch/static/o/d/0014-8437y435b87fb74bc83b83n8g78/icons.png") no-repeat 4px -48px;background-size:16px;height:16px;opacity:.55}.gsoi_0s{background:transparent url("https://ssl.gstatic.com/cloudsearch/static/o/d/0014-8437y435b87fb74bc83b83n8g78/icons.png") no-repeat 4px -64px;background-size:16px;height:16px;opacity:.55}.gsoi_0u{background:transparent url("https://ssl.gstatic.com/cloudsearch/static/o/d/0014-8437y435b87fb74bc83b83n8g78/icons.png") no-repeat 4px -80px;background-size:16px;height:16px;opacity:.55}.gsoi_0su{background:transparent url("https://ssl.gstatic.com/cloudsearch/static/o/d/0014-8437y435b87fb74bc83b83n8g78/icons.png") no-repeat 4px -96px;background-size:16px;height:16px;opacity:.55}.gsoi_1,.gsoi_1u{background:transparent url("https://ssl.gstatic.com/cloudsearch/static/o/d/0014-8437y435b87fb74bc83b83n8g78/icons.png") no-repeat 4px -112px;background-size:16px;height:16px}.gsoi_1s,.gsoi_1su{background:transparent url("https://ssl.gstatic.com/cloudsearch/static/o/d/0014-8437y435b87fb74bc83b83n8g78/icons.png") no-repeat 4px -128px;background-size:16px;height:16px}.gsoi_2,.gsoi_2u{background:transparent url("https://ssl.gstatic.com/cloudsearch/static/o/d/0014-8437y435b87fb74bc83b83n8g78/icons.png") no-repeat 4px -144px;background-size:16px;height:16px}.gsoi_2s,.gsoi_2su{background:transparent url("https://ssl.gstatic.com/cloudsearch/static/o/d/0014-8437y435b87fb74bc83b83n8g78/icons.png") no-repeat 4px -160px;background-size:16px;height:16px}.gsoi_3,.gsoi_3u{background:transparent url("https://ssl.gstatic.com/cloudsearch/static/o/d/0014-8437y435b87fb74bc83b83n8g78/icons.png") no-repeat 4px -176px;background-size:16px;height:16px}.gsoi_3s,.gsoi_3su{background:transparent url("https://ssl.gstatic.com/cloudsearch/static/o/d/0014-8437y435b87fb74bc83b83n8g78/icons.png") no-repeat 4px -192px;background-size:16px;height:16px}.gsoi_4,.gsoi_4u{background:transparent url("https://ssl.gstatic.com/cloudsearch/static/o/d/0014-8437y435b87fb74bc83b83n8g78/icons.png") no-repeat 4px -208px;background-size:16px;height:16px}.gsoi_4s,.gsoi_4su{background:transparent url("https://ssl.gstatic.com/cloudsearch/static/o/d/0014-8437y435b87fb74bc83b83n8g78/icons.png") no-repeat 4px -224px;background-size:16px;height:16px}.gsoi_5,.gsoi_5u{background:transparent url("https://ssl.gstatic.com/cloudsearch/static/o/d/0014-8437y435b87fb74bc83b83n8g78/icons.png") no-repeat 4px -240px;background-size:16px;height:16px}.gsoi_5s,.gsoi_5su{background:transparent url("https://ssl.gstatic.com/cloudsearch/static/o/d/0014-8437y435b87fb74bc83b83n8g78/icons.png") no-repeat 4px -256px;background-size:16px;height:16px}.gsoi_6,.gsoi_6u{background:transparent url("https://ssl.gstatic.com/cloudsearch/static/o/d/0014-8437y435b87fb74bc83b83n8g78/icons.png") no-repeat 4px -272px;background-size:16px;height:16px}.gsoi_6s,.gsoi_6su{background:transparent url("https://ssl.gstatic.com/cloudsearch/static/o/d/0014-8437y435b87fb74bc83b83n8g78/icons.png") no-repeat 4px -288px;background-size:16px;height:16px}.gsoi_7,.gsoi_7u{background:transparent url("https://ssl.gstatic.com/cloudsearch/static/o/d/0014-8437y435b87fb74bc83b83n8g78/icons.png") no-repeat 4px -304px;background-size:16px;height:16px}.gsoi_7s,.gsoi_7su{background:transparent url("https://ssl.gstatic.com/cloudsearch/static/o/d/0014-8437y435b87fb74bc83b83n8g78/icons.png") no-repeat 4px -320px;background-size:16px;height:16px}.gsoi_8,.gsoi_8u{background:transparent url("https://ssl.gstatic.com/cloudsearch/static/o/d/0014-8437y435b87fb74bc83b83n8g78/icons.png") no-repeat 4px -336px;background-size:16px;hei…ItRSTOblpNtoWHpPOhBTtm7mc3TCZFA0g#parent=https%3A%2F%2Fmail.google.com&amp;rpctoken=616118789" tabindex="-1" style="width: 1px; height: 1px; position: absolute; top: -100px;"></iframe><div class="dw np"><div><div class="nH" style="width: 1894px;"><div class="nH" style="height: 1019px;"><div class="no" style="float: right; margin-right: 250px;"><div class="nH nn" style="width: 8px;"></div><div class="nH nn" style="width: 20px;"></div></div><div class="dJ"></div></div></div></div></div><div class="aSs" style="visibility: hidden;"><div class="aSt"></div></div><div id="trisys-div" style="width: 100%; height: 70px; border-left-width: 1px; border-left-style: solid; border-left-color: rgb(224, 224, 224); text-align: center; position: fixed; left: 0px; top: 0px; z-index: 2147483647; overflow: hidden; background: rgb(255, 255, 255);"><iframe id="trisys-iframe" src="https://apex.trisys.co.uk/extension-top-region.html" style="width: 100%; border: none; overflow: hidden;"></iframe></div><div class="Af" style="display: none;"><div class="nH"><div class="nH" style="overflow: auto;"><textarea id=":100" ignoreesc="true" class="Ah nr" style="height: 36px;"></textarea></div></div><div class="Ag">Let people know what you're up to, or share links to photos, videos and web pages.</div></div><div class="skype_c2c_menu_container notranslate" id="skype_c2c_menu_container" onmouseover="SkypeClick2Call.MenuInjectionHandler.showMenu(this, event)" onmouseout="SkypeClick2Call.MenuInjectionHandler.hideMenu(this, event)" data-fp="{464D3CA5-61F5-4362-B796-4CCBF75EC4C6}" data-murl="https://pipe.skype.com/Client/2.0/" data-p2murl="https://c2c-p2m-secure.skype.com/p2m/v1/push" data-uiid="1" data-uilang="en" style="display: none;"><div class="skype_c2c_menu_click2call"><a class="skype_c2c_menu_click2call_action" id="skype_c2c_menu_click2call_action" target="_self">Call</a></div><div class="skype_c2c_menu_click2sms"><a class="skype_c2c_menu_click2sms_action" id="skype_c2c_menu_click2sms_action" target="_self">Send SMS</a></div><div class="skype_c2c_menu_push_to_mobile"><a class="skype_c2c_menu_push_to_mobile_action" id="skype_c2c_menu_push_to_mobile_action" target="_blank">Call from mobile</a></div><div class="skype_c2c_menu_add2skype"><a class="skype_c2c_menu_add2skype_text" id="skype_c2c_menu_add2skype_text" target="_self">Add to Skype</a></div><div class="skype_c2c_menu_toll_info"><span class="skype_c2c_menu_toll_callcredit">You'll need Skype Credit</span><span class="skype_c2c_menu_toll_free">Free via Skype</span></div></div><div class="J-M agd aYO" style="display: none;"></div><div class="J-M agd aYO" style="display: none;"></div><div class="J-M aX0 aYO" style="display: none;"></div><ul class="d-Na-JG-M" tabindex="-1" style="-webkit-user-select: none; display: none;"><li class="d-Na-N" style="-webkit-user-select: none;"><span class="d-Na-Jo d-Na-N-ax3" style="-webkit-user-select: none;"></span><span class="d-Na-N-M7-JX d-Na-N-ax3 d-Na-J3 ita-icon-0" style="-webkit-user-select: none;"></span><span class="d-Na-N-M7-awE" dir="ltr" style="-webkit-user-select: none;">English</span></li><li class="d-Na-N" style="-webkit-user-select: none;"><span class="d-Na-Jo d-Na-N-ax3" style="-webkit-user-select: none;"></span><span class="d-Na-N-M7-JX d-Na-N-ax3 d-Na-J3 ita-icon-0" style="-webkit-user-select: none;"></span><span class="d-Na-N-M7-awE" dir="ltr" style="-webkit-user-select: none;">English Dvorak</span></li><li class="d-Na-N" style="-webkit-user-select: none;"><span class="d-Na-Jo d-Na-N-ax3" style="-webkit-user-select: none;"></span><span class="d-Na-N-M7-JX d-Na-N-ax3 d-Na-J3 ita-icon-1" style="-webkit-user-select: none;"></span><span class="d-Na-N-M7-awE" dir="ltr" style="-webkit-user-select: none;">English</span></li><div class="d-Na-axR" style="-webkit-user-select: none;"></div><li class="d-Na-N" style="display: none; -webkit-user-select: none;"><span class="d-Na-N-UX d-Na-N-ax3" style="-webkit-user-select: none;">Enable personal dictionary</span></li><li class="d-Na-N" style="display: none; -webkit-user-select: none;"><span class="d-Na-N-UX d-Na-N-ax3" style="-webkit-user-select: none;">Disable personal dictionary</span></li><li class="d-Na-N" style="display: none; -webkit-user-select: none;"><span class="d-Na-N-UX d-Na-N-ax3" style="-webkit-user-select: none;">Show Keyboard</span></li><li class="d-Na-N" style="display: none; -webkit-user-select: none;"><span class="d-Na-N-UX d-Na-N-ax3" style="-webkit-user-select: none;">Hide Keyboard</span></li><li class="d-Na-N" style="-webkit-user-select: none;"><span class="d-Na-N-UX d-Na-N-ax3" style="-webkit-user-select: none;">Input Tools Settings</span></li></ul><iframe name="easyXDM_IN_Lib_default7656_provider" id="easyXDM_IN_Lib_default7656_provider" src="https://api.linkedin.com/uas/js/xdrpc.html?v=0.0.2000-RC8.51954-1428#xdm_e=https%3A%2F%2Fmail.google.com&amp;xdm_c=default7656&amp;xdm_p=1#mode=cors" frameborder="0" style="position: absolute; top: -2000px; left: 0px;"></iframe></body></html>"
                //MessageBody: "<div lang="EN-GB" link="#0563C1" vlink="#954F72"><div><p class="MsoNormal"><span>Find 3 files</span></p><p class="MsoNormal"><span>&nbsp;</span></p><p class="MsoNormal">&nbsp;</p></div></div><div class="yj6qo"></div><div class="adL">↵</div>"
                //Recipients: "garry@trisys.co.uk"
                //Sender: "garry@trisys.co.uk"
                //Subject: "Multiple Attachment Files"
                //Type: "GMailToTriSys"
                //URL: "https://mail.google.com/mail/u/0/#inbox/1508ee186e87f881"

                lookupObject.GMail = extensionObject;
                break;

            default:
                // We do not support messages from this so ignore
                return;
        }

        TriSysExtension.ReadEntityDetailsFromApex(lookupObject);
    },

    // We have identified the information from the page.
    // Use this to asynchronously retrieve the data from customers TriSys database via either the
    // running Apex app, or directly from the API.
    ReadEntityDetailsFromApex: function (lookupObject)
    {
        var sContactName = '', sJobTitle = '', sCompany = '';
        var sImage = null;

        if(lookupObject.LinkedIn)
        {
            sContactName = lookupObject.LinkedIn.FullName;
            sJobTitle = lookupObject.LinkedIn.JobTitle;
            sCompany = lookupObject.LinkedIn.Company;
            sImage = lookupObject.LinkedIn.Photo;

            // Algorithm
            var sAt = ' at ';
            var iAtIndex = -1;
            if (sJobTitle)
                iAtIndex = sJobTitle.indexOf(sAt);

            if(!sCompany || iAtIndex > 0)
            {
                if (iAtIndex > 0)
                {
                    sCompany = sJobTitle.substring(iAtIndex + sAt.length);
                    sJobTitle = sJobTitle.substring(0, iAtIndex);
                }
            }

            if (!sImage)
                sImage = TriSysApex.Constants.DefaultContactGreyImage;
        }
        else if (lookupObject.GMail)
        {

        }

        $('#contact-name').html(sContactName);
        $('#contact-jobtitle').html(sJobTitle);
        $('#company-name').html(sCompany);

        $('#contact-photo').attr('src', sImage);
    },

    OpenContactForm: function()
    {
        // TODO: Get the current contact ID

        // Display this record in Apex
        TriSysApex.InterprocessCommunication.ClientOpenForm('Contact', 50894);

        // And focus on the tab
        TriSysExtension.FocusOnApexBrowserTab();
    },

    OpenCompanyForm: function ()
    {
        // TODO: Get the current company ID

        // Display this record in Apex
        TriSysApex.InterprocessCommunication.ClientOpenForm('Company', 1);

        // And focus on the tab
        TriSysExtension.FocusOnApexBrowserTab();
    },

    ShowTopRegion: function ()
    {
        var extensionObject = { Type: TriSysApex.InterprocessCommunication.MessageType_TriSysToBrowser, Instruction: TriSysApex.InterprocessCommunication.ShowBrowserTopRegion };

        parent.postMessage(extensionObject, '*');
    },

    HideTopRegion: function ()
    {
        var extensionObject = { Type: TriSysApex.InterprocessCommunication.MessageType_TriSysToBrowser, Instruction: TriSysApex.InterprocessCommunication.HideBrowserTopRegion };

        parent.postMessage(extensionObject, '*');
    },

    ClosePopupWindow: function()
    {        
        var extensionObject = { Type: TriSysApex.InterprocessCommunication.MessageType_TriSysToBrowser, Instruction: TriSysApex.InterprocessCommunication.CloseBrowserPopupWindow };

        parent.postMessage(extensionObject, '*');
    },

    FocusOnApexBrowserTab: function ()
    {
        var extensionObject = { Type: TriSysApex.InterprocessCommunication.MessageType_TriSysToBrowser, Instruction: TriSysApex.InterprocessCommunication.ActivateApexTab };

        parent.postMessage(extensionObject, '*');
    },

    ReParsePage: function()
    {
        var extensionObject = { Type: TriSysApex.InterprocessCommunication.MessageType_TriSysToBrowser, Instruction: TriSysApex.InterprocessCommunication.ReParsePage };

        parent.postMessage(extensionObject, '*');
    }
};

// Main entry point into the browser extension which is typically iframed
//
$(document).ready(function ()
{
    TriSysExtension.Load();
});
