var Training =
{
    Load: function ()
    {
        // Form Tabs
        TriSysSDK.EntityFormTabs.AddClickEventHandlers('training-courses-tab-nav-horizontal', true);
		
		// Focus on first tab
		TriSysSDK.EntityFormTabs.HighlightTabButton('training-courses-form-tab-recruiter');

		// Show logged in user details
        var bLoggedIn = TriSysApex.LoginCredentials.areUserCredentialsValid();
        if (bLoggedIn)
        {
            // Display the logged in user details
            var sFullName = $('#lblLoggedInUserFullName2').text();
            var sCompany = $('#lblLoggedInUserCompanyName').text();
            var sImage = $('#imgLoggedInUserImage2').attr('src');

            $('#training-user-full-name').text(sFullName);
            $('#training-user-company-name').text(sCompany);
            $('#training-user-photo').attr('src', sImage);
        }
        else
            $('#training-status-block-user').hide();

        // Calculate the summary for the defaults
        Training.CourseSummaryCalculations();

        // Update the course lessons which have been read/watched/taken
        Training.UpdateCourseLessonsRead(bLoggedIn);

        // Should we start a particular course/lesson specified in URL?
        Training.ProcessStartCourseFromURL();

		// Draw themed border around panels
		var sBorderColour = TriSysProUI.GroupBorderColour();
		$('.widget').css('border', '1px solid ' + sBorderColour);

    },

    // We are in 'training course mode' if we are a CRM i.e. Apex
    CourseMode: function()
    {
        var bCourseMode = TriSysApex.Constants.TriSysHostedCRM && !TriSysApex.Constants.WhiteLabelled;

        return bCourseMode;
    },

    // e.g. #1 https://apex.trisys.co.uk/?Training&course=developer
    // e.g. #2 https://apex.trisys.co.uk/?Training&course=developer&lesson=developer-intro
    // e.g. #3 https://apex.trisys.co.uk/?training&course=recruiter&lesson=recruiter-whatistrisys
    ProcessStartCourseFromURL: function ()
    {
        var sURL = window.location.href.toLowerCase();
        var sCourse = TriSysApex.URL.Parser(sURL).getParam("course");       // recruiter, administrator, developer, youtube
        var sLesson = TriSysApex.URL.Parser(sURL).getParam("lesson");       // e.g. recruiter-lookup-contact, developer-intro

        if(sCourse)
        {
            // Specified a course, so enable this tab
            $('#training-courses-form-tab-' + sCourse + ' a').trigger('click');
        }

        if (sLesson)
        {
            // Specified a lesson, so open it when the correct JS video libraries are loaded
            var sHyperlinkElem = $('#td-training-' + sLesson + ' a');
            var fnLoadLesson = function () {
                sHyperlinkElem.trigger('click');
            };

            // 27 Jun 2023: Chrome/Edge prevent the auto-play of sound in videos unless the user 'interacts with the document first'
            // Hence we prompt the user first
            var fnPlayVideo = function () {
                setTimeout(fnLoadLesson, 100);
                return true;
            };

            // Get the full description of the video from the DOM
            var sLessonText = sHyperlinkElem.text();

            TriSysApex.UI.questionYesNo("Play training video?", sLessonText,
                                            "Yes", fnPlayVideo,
                                            "No", function () { return true });
            //setTimeout(fnLoadLesson, 2000);
        }
    },

    TabClickEvent: function (sTabID)
    {
        // Reposition the status, help and video help into the correct visible div
        var parts = sTabID.split('training-courses-panel-');
        var sTab = parts[1];
        var sDiv = 'training-courses-' + sTab + '-rightside';
        var elem = $('#' + sDiv);

        if (sTab == "youtube")
        {
            Training.StartYouTubeChannel();
            return;
        }

        var status = $('#training-status-block').detach();
        var appHelp = $('#training-application-help-block').detach();
        var videoHelp = $('#training-video-help-block').detach();

        elem.append(status);
        elem.append(appHelp);
        elem.append(videoHelp);
    },

    StartYouTubeChannel: function ()
    {
        var iframe = $('#training-iframe-youtube');
        var src = iframe.attr('src');
        if (!src)
        {
            // Load playlist
            iframe.attr('src', 'https://www.youtube.com/embed/videoseries?list=PLP0roTdrJBsQoN-V-9_g0aVldhCSd_FZ7&autoplay=1&rel=0&modestbranding=1');

            // Load specific video
            //var iframe2 = $('#training-courses-ytplayer');
            //iframe2.attr('src', "https://www.youtube.com/embed/_qPNMudGRZA?autoplay=1&rel=0&modestbranding=1&origin=https://apex.trisys.co.uk");

            //var iWidthFactor = 100;
            //var iWidth = TriSysApex.Pages.Index.FormWidth() - iWidthFactor;
            //var fRatio = 4 / 3;     // 1440 x 1080
            //var iHeight = iWidth / fRatio;

            //// Override
            //iWidth = 800;
            //iHeight = 600;

            //iframe2.attr('width', iWidth + 'px');
            //iframe2.attr('height', iHeight + 'px');
        }
    },

    StartLesson: function (sVideo, sCaption, sLessonID)
    {
        if (sVideo && sCaption)
        {
            TriSysApex.TourGuide.WatchVideo(null, sVideo, sCaption);
            Training.MarkLessonCompleted(sLessonID, true);

            // 27 Jun 2023: Capture for sharing
            Training.Shared.Video = sVideo;
            Training.Shared.Caption = sCaption;
            Training.Shared.LessonID = sLessonID;
        }
        else
        {
            // Video not available yet
            var sMessage = "This training course lesson is not available at this time." +
                "<br /><br />" +
                "Please check back in the next few weeks when we expect to have completed the production of the training courses.";
            TriSysApex.UI.ShowMessage(sMessage, TriSysApex.Copyright.ShortProductName + " Training Courses");
        }
    },

    // 27 Jun 2023: Allow sharing of played video
    Shared:
    {
        Video: null,
        Caption: null,
        LessonID: null,

        ShareVideoURL: function(sTitle)
        {
            var sLesson = Training.Shared.LessonID;
            if (!sLesson)
            {
                TriSysApex.UI.ShowMessage("Only videos launched from Help-->Training Courses can be shared.")
                return;
            }

            var lstPart = sLesson.split("-");
            var sCourse = lstPart[1];
            var sLessonID = sCourse;
            for (var i = 2; i < lstPart.length; i++)
            {
                if (sLessonID.length > 0)
                    sLessonID += "-";

                sLessonID += lstPart[i];
            }

            // Copy to clipboard
            var sURL = location.href + "&course=" + sCourse + "&lesson=" + sLessonID;
            navigator.clipboard.writeText(sURL);

            var sMessage = "The following URL for the " + sTitle + " has now been copied to the clipboard and can be pasted into an e-mail or message:" +
                "<br><br>" + sURL;

            var fn = function () { TriSysApex.UI.ShowMessage(sMessage, "Share Video"); };
            setTimeout(fn, 100);
        }
    },

    MarkLessonCompleted: function (sLessonID, bPersist)
    {
        if (!Training.CourseMode())
            return;

        // Get the row
        var sTD = "td-" + sLessonID;
        var sHTML = $('#' + sTD).html();
        if (!sHTML)
            return;

        var bCompletedShowVisually = (sHTML.indexOf("</del>") > 0);
        
        if (!bCompletedShowVisually)
        {
            // Cross through the row
            sHTML = "<del>" + sHTML + "</del>";
            $('#' + sTD).html(sHTML);

            // Change the start button to ticked
            var a = $('#' + sLessonID);
            a.removeClass("btn btn-xs btn-primary").addClass("btn btn-xs btn-success");
            a.html('<i class="fa fa-check"></i>');

            // Calculate the summary
            Training.CourseSummaryCalculations(sLessonID);
        }

        if(bPersist)
        {
            // Write this setting to either local cookie or Web API to incentivise users to take training course
            Training.Persistence.WriteCourseLessonCompleted(sLessonID);
        }
    },

    CourseSummaryCalculations: function (sLessonID)
    {
        var fnShowCourseSummary = function (course)
        {
            // Training Status/History
            var sSummary = course.Completed + " of " + course.Count + " completed";
            $('#' + course.SummaryTag).html(sSummary);

            // Progress
            var sClass = "progress-bar progress-bar-";
            var sColour = "success";
            var iPercentage = Math.round((course.Completed / course.Count) * 100);
            var sPercentageCompleted = iPercentage + "% Completed";
            var progressBar = $('#' + course.ProgressBar);
            
            if (iPercentage == 0)
            {
                sColour = "danger";
                sPercentageCompleted = "0% Completed. Please start the course.";
                iPercentage = 100;
            }
            else
            {
                if (iPercentage >= 75)
                    sColour = "success";
                else if (iPercentage >= 25)
                    sColour = "warning";
                else
                    sColour = "danger";
            }

            progressBar.attr('aria-valuenow', iPercentage);
            progressBar.css('width', iPercentage + "%" );
            progressBar.html(sPercentageCompleted);
            progressBar.removeClass().addClass(sClass + sColour);

            $('#' + course.LessonCountTag).html(course.Count);
            $('#' + course.LessonTimeTag).html(course.Length);
        };

        if (!sLessonID)
        {
            var courses = Training.Courses.Summary;
            for (var i = 0; i < courses.length; i++)
            {
                var course = courses[i]
                fnShowCourseSummary(course);
            }
            return;
        }

        var bRecruiterCourse = (sLessonID.indexOf('training-recruiter') == 0);
        var bAdministratorCourse = (sLessonID.indexOf('training-administrator') == 0);
        var bDeveloperCourse = (sLessonID.indexOf('training-developer') == 0);

        var sTypeOfCourse = (bRecruiterCourse ? 'Recruiter' : (bAdministratorCourse ? 'Administrator' : 'Developer'));
        var course = Training.Courses.CourseFromType(sTypeOfCourse);
        if(course)
        {
            course.Completed += 1;
            fnShowCourseSummary(course);
        }
    },

    Information:
    {
        Show: function (sTitle, sHTMLFile)
        {
            var parametersObject = new TriSysApex.UI.ShowMessageParameters();
            parametersObject.Title = sTitle;
            parametersObject.Image = "fa-graduation-cap";
            parametersObject.Maximize = true;
			parametersObject.CloseTopRightButton = true;

            parametersObject.ContentURL = TriSysApex.Constants.UserControlFolder + sHTMLFile;
            parametersObject.ButtonRightText = "OK";
            parametersObject.ButtonRightVisible = true;

            TriSysApex.UI.PopupMessage(parametersObject);
        },

        Recruiter: function()
        {
            Training.Information.Show('Recruiter Training Course', 'training/ctrlRecruiterCourse.html');
        },

        Administrator: function ()
        {
            Training.Information.Show('Administrator Training Course', 'training/ctrlAdministratorCourse.html');
        },

        Developer: function ()
        {
            Training.Information.Show('Developer Training Course', 'training/ctrlDeveloperCourse.html');
        }

    },

    // Read from web api to get the course lessons read for this user
    UpdateCourseLessonsRead: function (bLoggedIn)
    {
        // TODO: Enable this line of code when server side API operational for logged in users
        Training.Persistence.LoggedIn = bLoggedIn;

        var fnProcessCourseLessons = function (courseLessonsCompleted)
        {
            if (courseLessonsCompleted)
            {
                for (var i = 0; i < courseLessonsCompleted.length; i++)
                {
                    var sLessonId = courseLessonsCompleted[i];
                    Training.MarkLessonCompleted(sLessonId);
                }
            }
        }

        // Get from either web service or cookies
        Training.Persistence.ReadCourseLessonsCompleted(fnProcessCourseLessons);
    },

    Persistence:
    {
        LoggedIn: false,

        WriteCourseLessonCompleted: function (sCourseID)
        {
            if (!Training.Persistence.LoggedIn)
            {
                var coursesCompleted = Training.Persistence.GetCookie();
                if (!coursesCompleted)
                    coursesCompleted = [];

                coursesCompleted.push(sCourseID);

                Training.Persistence.PutCookie(coursesCompleted);
            }
            else
                Training.Persistence.PushToWebService(sCourseID);
        },

        ReadCourseLessonsCompleted: function (fnProcessCourseLessons)
        {
            if (Training.Persistence.LoggedIn)
                Training.Persistence.PullFromWebService(fnProcessCourseLessons);
            else
            {
                var courseLessons = Training.Persistence.GetCookie();
                fnProcessCourseLessons(courseLessons);
            }
        },

        // WEB API
        // -------
        PullFromWebService: function (fnProcessCourses)
        {
            var payloadObject = {};

            payloadObject.URL = "TrainingCourse/ReadCompletedCourses";

            payloadObject.OutboundDataPacket = null;

            payloadObject.InboundDataFunction = function (CTrainingCoursesCompletedResponse)
            {
                if (CTrainingCoursesCompletedResponse)
                {
                    if (CTrainingCoursesCompletedResponse.Success)
                    {
                        fnProcessCourses(CTrainingCoursesCompletedResponse.Courses)
                    }
                }
            };

            payloadObject.ErrorHandlerFunction = function (request, status, error)
            {
                TriSysApex.UI.errorAlert('Training.Persistence.PullFromWebService: ' + status + ": " + error + ". responseText: " + request.responseText);
            };

            TriSysAPI.Data.PostToWebAPI(payloadObject);
        },

        PushToWebService: function (sCourseName)
        {
            var payloadObject = {};

            payloadObject.URL = "TrainingCourse/WriteCompletedCourse";

            payloadObject.OutboundDataPacket = { CourseName: sCourseName };

            payloadObject.InboundDataFunction = function (CTrainingCourseCompletedResponse)
            {
                if (CTrainingCourseCompletedResponse)
                {
                    if (CTrainingCourseCompletedResponse.Success)
                    {
                        // Silent push, no UI required
                    }
                }
            };

            payloadObject.ErrorHandlerFunction = function (request, status, error)
            {
                TriSysApex.UI.errorAlert('Training.Persistence.PushToWebService: ' + status + ": " + error + ". responseText: " + request.responseText);
            };

            TriSysAPI.Data.PostToWebAPI(payloadObject);
        },

        // COOKIES
        // -------

        CookiePrefix: 'Training-Courses-Completed',

        // Cookie method
        GetCookie: function ()
        {
            var sCoursesTaken = TriSysAPI.Cookies.getCookie(Training.Persistence.CookiePrefix);
            if (sCoursesTaken)
            {
                // Convert to json
                var coursesTaken = JSON.parse(sCoursesTaken);
                return coursesTaken;
            }
            else
                return null;
        },

        PutCookie: function (coursesTaken)
        {
            // Create a string of the JSON object
            var sCoursesTaken = JSON.stringify(coursesTaken);

            // Persist this against the form to easily allow the user to pick up where they left off on next visit
            TriSysAPI.Cookies.setCookie(Training.Persistence.CookiePrefix, sCoursesTaken);
        }
    },

    Courses:
    {
        Summary: [
            { 
                Type: 'Recruiter',
                Completed: 0,
                Count: 34,          // http://youtube-playlist-analyzer.appspot.com
                Length: '1 hour, 38 minutes',
                SummaryTag: 'training-recruiter-count-summary',
                ProgressBar: 'training-recruiter-progress-bar',
                LessonCountTag: 'training-recruiter-lesson-count',
                LessonTimeTag: 'training-recruiter-lesson-time'
            },
            { 
                Type: 'Administrator',
                Completed: 0,
                Count: 8,
                Length: '18 minutes',
                SummaryTag: 'training-administrator-count-summary',
                ProgressBar: 'training-administrator-progress-bar',
                LessonCountTag: 'training-administrator-lesson-count',
                LessonTimeTag: 'training-administrator-lesson-time'
            },
            { 
                Type: 'Developer',
                Completed: 0,
                Count: 2,
                Length: '4 minutes',
                SummaryTag: 'training-developer-count-summary',
                ProgressBar: 'training-developer-progress-bar',
                LessonCountTag: 'training-developer-lesson-count',
                LessonTimeTag: 'training-developer-lesson-time'
            }
        ],

        CourseFromType: function(sType)
        {
            for (var i = 0; i < Training.Courses.Summary.length; i++)
            {
                var course = Training.Courses.Summary[i];
                if (course.Type == sType)
                    return course;
            }
        }
    }
};

$(document).ready(function ()
{
    Training.Load();
});