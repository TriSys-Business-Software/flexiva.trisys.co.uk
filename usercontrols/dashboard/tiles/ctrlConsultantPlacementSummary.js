var ctrlConsultantPlacementSummary =
{
    // Configurable properties
    PercentTargetMetDecimalPlaces: 2,

    // This is called when the tile manager has loaded us.
    LoadedInTile: function (sTileID, persistedSettings)
    {
        // Note that all our DOM elements have been renamed to be unique and prefixed
        var sPrefix = sTileID + '-';

        try
        {
            // TODO Get Settings from the persisted storage

            // Load our data
            ctrlConsultantPlacementSummary.Load(sPrefix);

        } catch (e)
        {

        }
    },

    Load: function (sPrefix, sTag)
    {
        // On phones, hide big table
        var bPhone = TriSysApex.Device.isPhone();
        if (bPhone)
            $('#' + sPrefix + 'consultant-placement-summary-monthly-table').hide();

        // Dummy data option for demos
        if (TriSysApex.Constants.ShowDummyDashboardData)
        {
            var userCredentials = TriSysApex.LoginCredentials.UserCredentials();
            var lUserId = userCredentials.LoggedInUser.UserId;
            var randomData = Consultant12MonthActivity.RandomActivity();
            ctrlConsultantPlacementSummary.PopulateDataFromWebAPI(randomData, lUserId, sPrefix);
            return;
        }

        // Get raw data from web service - this call is made in other live tiles
        var bCurrentYear = true;
        Consultant12MonthActivity.GetUserDataFromWebAPI(ctrlConsultantPlacementSummary.PopulateDataFromWebAPI, sPrefix, bCurrentYear)
    },

    // Take the data for this user and display in the numerous tables and charts
    PopulateDataFromWebAPI: function (CDashboardMetricsConsultant12MonthActivityResponse, lUserId, sPrefix)
    {
        var sTD = '', sDisplayValue = '', sSparkline = '';

        ctrlConsultantPlacementSummary.DrawHeader(CDashboardMetricsConsultant12MonthActivityResponse, lUserId, sPrefix);

        // Expect 12 items in the array, start month should be January of this year
        var activities = CDashboardMetricsConsultant12MonthActivityResponse.Activity;
        var lastDecemberActivity = CDashboardMetricsConsultant12MonthActivityResponse.LastDecemberActivity;

        var Targets = [], Effective = [], PercentTargetMet = [], MonthlyVariation = [], PlacementsWon = [];
        var AvgPlacementValue = [], AvgTimeToPlacementPerm = [], AvgTimeToPlacementContract = [], AvgTimeToPlacementTemp = [];
        var ProductionSales = [];

        var sUKPoundHTMLcode = "&pound;";
        var sCurrencySymbol = TriSysSDK.Controls.CurrencyAmount.DefaultCurrencySymbol();
        if (sCurrencySymbol == TriSysSDK.Controls.CurrencyAmount.UKPound)
            sCurrencySymbol = sUKPoundHTMLcode;

        for (var i = 0; i < activities.length; i++)
        {
            var activity = activities[i];
            var sMonthName = moment(activity.StartDate).format('MMM').toLowerCase();        // get correct column

            var iTarget = activity.TargetPermPlacementFees + activity.TargetContractPlacementMargin;
            Targets.push(iTarget);
            sTD = sPrefix + sMonthName + '-col-target';
            sDisplayValue = sCurrencySymbol + TriSysSDK.Numbers.Format(iTarget, 0);
            $('#' + sTD).html(sDisplayValue);

            var iEffectiveProfit = activity.TotalPermanentFees + activity.TotalContractMargin;
            Effective.push(iEffectiveProfit);
            sTD = sPrefix + sMonthName + '-col-effective';
            sDisplayValue = sCurrencySymbol + TriSysSDK.Numbers.Format(iEffectiveProfit, 0);
            $('#' + sTD).html(sDisplayValue);

            var iPercentTargetMet = 0;
            if (iTarget != 0)
                iPercentTargetMet = Math.floor((iEffectiveProfit / iTarget) * 100, 2);
            PercentTargetMet.push(iPercentTargetMet);
            sTD = sPrefix + sMonthName + '-col-target-met';
            sDisplayValue = TriSysSDK.Numbers.Format(iPercentTargetMet, ctrlConsultantPlacementSummary.PercentTargetMetDecimalPlaces) + "%";
            $('#' + sTD).html(sDisplayValue);

            var iPlacementsWon = activity.NumberOfPlacements;
            PlacementsWon.push(iPlacementsWon);
            sTD = sPrefix + sMonthName + '-col-placements-won';
            sDisplayValue = TriSysSDK.Numbers.Format(iPlacementsWon, 0);
            $('#' + sTD).html(sDisplayValue);

            var iAveragePlacementValue = 0;
            if (iPlacementsWon != 0)
                iAveragePlacementValue = (iEffectiveProfit / iPlacementsWon);
            AvgPlacementValue.push(iAveragePlacementValue);
            sTD = sPrefix + sMonthName + '-col-avg-placement-value';
            sDisplayValue = sCurrencySymbol + TriSysSDK.Numbers.Format(iAveragePlacementValue, 0);
            $('#' + sTD).html(sDisplayValue);

            var iAvgTimeToPlacementPerm = activity.TimeToPlacementPerm;
            AvgTimeToPlacementPerm.push(iAvgTimeToPlacementPerm);
            sTD = sPrefix + sMonthName + '-col-avg-time-to-placement-perm';
            sDisplayValue = TriSysSDK.Numbers.Format(iAvgTimeToPlacementPerm, 0);
            $('#' + sTD).html(sDisplayValue);

            var iAvgTimeToPlacementContract = activity.TimeToPlacementContract;
            AvgTimeToPlacementContract.push(iAvgTimeToPlacementContract);
            sTD = sPrefix + sMonthName + '-col-avg-time-to-placement-contract';
            sDisplayValue = TriSysSDK.Numbers.Format(iAvgTimeToPlacementContract, 0);
            $('#' + sTD).html(sDisplayValue);

            var iAvgTimeToPlacementTemp = activity.TimeToPlacementTemp;
            AvgTimeToPlacementTemp.push(iAvgTimeToPlacementTemp);
            sTD = sPrefix + sMonthName + '-col-avg-time-to-placement-temp';
            sDisplayValue = TriSysSDK.Numbers.Format(iAvgTimeToPlacementTemp, 0);
            $('#' + sTD).html(sDisplayValue);

            var iMonthlyVariation = ctrlConsultantPlacementSummary.CalculateMonthlyVariation(activities, i, lastDecemberActivity);
            MonthlyVariation.push(iMonthlyVariation);
            sTD = sPrefix + sMonthName + '-col-monthly-variation';
            sDisplayValue = TriSysSDK.Numbers.Format(iMonthlyVariation, 2) + "%";
            $('#' + sTD).html(sDisplayValue);

            // Custom row
            var fProductionSales = (activity.ProductionSales ? activity.ProductionSales: 0);
            ProductionSales.push(fProductionSales);
            sTD = sPrefix + sMonthName + '-col-production-sales';
            sDisplayValue = sCurrencySymbol + TriSysSDK.Numbers.Format(fProductionSales, 0);
            $('#' + sTD).html(sDisplayValue);

        }

        // Totals
        var iTotalTarget = ctrlConsultantPlacementSummary.TotalArray(Targets);
        sTD = sPrefix + 'total-target';
        sDisplayValue = sCurrencySymbol + TriSysSDK.Numbers.Format(iTotalTarget, 0);
        $('#' + sTD).html(sDisplayValue);

        var iTotalEffective = ctrlConsultantPlacementSummary.TotalArray(Effective);
        sTD = sPrefix + 'total-effective';
        sDisplayValue = sCurrencySymbol + TriSysSDK.Numbers.Format(iTotalEffective, 0);
        $('#' + sTD).html(sDisplayValue);

        var iTotalPercentMet = ctrlConsultantPlacementSummary.TotalArray(PercentTargetMet);
        var fAveragePercentMet = iTotalPercentMet / 12;
        sTD = sPrefix + 'total-target-met';
        sDisplayValue = TriSysSDK.Numbers.Format(fAveragePercentMet, ctrlConsultantPlacementSummary.PercentTargetMetDecimalPlaces) + "%";
        $('#' + sTD).html(sDisplayValue);

        var iTotalPlacementsWon = ctrlConsultantPlacementSummary.TotalArray(PlacementsWon);
        sTD = sPrefix + 'total-placements-won';
        sDisplayValue = TriSysSDK.Numbers.Format(iTotalPlacementsWon, 0);
        $('#' + sTD).html(sDisplayValue);

        var iAveragePlacementValueTotal = ctrlConsultantPlacementSummary.TotalArray(AvgPlacementValue);
        var iAveragePlacementValue = iAveragePlacementValueTotal / 12;
        sTD = sPrefix + 'total-avg-placement-value';
        sDisplayValue = sCurrencySymbol + TriSysSDK.Numbers.Format(iAveragePlacementValue, 0);
        $('#' + sTD).html(sDisplayValue);

        var iAvgTimeToPlacementPermTotal = ctrlConsultantPlacementSummary.TotalArray(AvgTimeToPlacementPerm);
        var iAvgTimeToPlacementPermValue = iAvgTimeToPlacementPermTotal / 12;
        sTD = sPrefix + 'total-avg-time-to-placement-perm';
        sDisplayValue = TriSysSDK.Numbers.Format(iAvgTimeToPlacementPermValue, 0);
        $('#' + sTD).html(sDisplayValue);

        var iAvgTimeToPlacementContractTotal = ctrlConsultantPlacementSummary.TotalArray(AvgTimeToPlacementContract);
        var iAvgTimeToPlacementContractValue = iAvgTimeToPlacementContractTotal / 12;
        sTD = sPrefix + 'total-avg-time-to-placement-contract';
        sDisplayValue = TriSysSDK.Numbers.Format(iAvgTimeToPlacementContractValue, 0);
        $('#' + sTD).html(sDisplayValue);

        var iAvgTimeToPlacementTempTotal = ctrlConsultantPlacementSummary.TotalArray(AvgTimeToPlacementTemp);
        var iAvgTimeToPlacementTempValue = iAvgTimeToPlacementTempTotal / 12;
        sTD = sPrefix + 'total-avg-time-to-placement-temp';
        sDisplayValue = TriSysSDK.Numbers.Format(iAvgTimeToPlacementTempValue, 0);
        $('#' + sTD).html(sDisplayValue);

        var iMonthlyVariationTotal = ctrlConsultantPlacementSummary.TotalArray(MonthlyVariation);
        iMonthlyVariationTotal = iMonthlyVariationTotal / 12;
        sTD = sPrefix + 'total-monthly-variation';
        sDisplayValue = TriSysSDK.Numbers.Format(iMonthlyVariationTotal, 2) + "%";
        $('#' + sTD).html(sDisplayValue);

        var fProductionSalesTotal = ctrlConsultantPlacementSummary.TotalArray(ProductionSales);
        sTD = sPrefix + 'total-production-sales';
        sDisplayValue = sCurrencySymbol + TriSysSDK.Numbers.Format(fProductionSalesTotal, 0);
        $('#' + sTD).html(sDisplayValue);

        // Sparklines
        ctrlConsultantPlacementSummary.DrawSparkline(sPrefix, 'sparkline-target', Targets);
        ctrlConsultantPlacementSummary.DrawSparkline(sPrefix, 'sparkline-effective', Effective);
        ctrlConsultantPlacementSummary.DrawSparkline(sPrefix, 'sparkline-target-met', PercentTargetMet);
        ctrlConsultantPlacementSummary.DrawSparkline(sPrefix, 'sparkline-monthly-variation', MonthlyVariation);
        ctrlConsultantPlacementSummary.DrawSparkline(sPrefix, 'sparkline-placements-won', PlacementsWon);
        ctrlConsultantPlacementSummary.DrawSparkline(sPrefix, 'sparkline-avg-placement-value', AvgPlacementValue);
        ctrlConsultantPlacementSummary.DrawSparkline(sPrefix, 'sparkline-avg-time-to-placement-perm', AvgTimeToPlacementPerm);
        ctrlConsultantPlacementSummary.DrawSparkline(sPrefix, 'sparkline-avg-time-to-placement-contract', AvgTimeToPlacementContract);
        ctrlConsultantPlacementSummary.DrawSparkline(sPrefix, 'sparkline-avg-time-to-placement-temp', AvgTimeToPlacementTemp);
        ctrlConsultantPlacementSummary.DrawSparkline(sPrefix, 'sparkline-production-sales', ProductionSales);


        // Draw the charts for this data
        var sChart = sPrefix + 'consultant-placement-summary-monthly-chart';
        ctrlConsultantPlacementSummary.DrawPlacementSummaryMonthlyChart(Targets, Effective, PercentTargetMet, sChart);

        sChart = sPrefix + 'consultant-placement-summary-this-month-chart';
        ctrlConsultantPlacementSummary.DrawPlacementSummaryThisMonthChart(Targets, Effective, sChart);

        sChart = sPrefix + 'consultant-placement-summary-this-year-chart';
        ctrlConsultantPlacementSummary.DrawPlacementSummaryThisYearChart(Targets, Effective, sChart);

        // Show the percentage as big numbers
        ctrlConsultantPlacementSummary.TrafficLightsMetrics(sPrefix, Targets, Effective);

        // Chance for custom overrides
        ctrlConsultantPlacementSummary.CustomOverrides();
    },

    // Monthly variation is based upon last months figures
    CalculateMonthlyVariation: function (activities, i, lastDecemberActivity)
    {
        var iEffectiveProfitForLastMonth = 0;
        if (i == 0)
        {
            if (lastDecemberActivity)
                iEffectiveProfitForLastMonth = lastDecemberActivity.TotalPermanentFees + lastDecemberActivity.TotalContractMargin;
        }
        else
            iEffectiveProfitForLastMonth = activities[i - 1].TotalPermanentFees + activities[i - 1].TotalContractMargin;


        var iEffectiveProfitForThisMonth = activities[i].TotalPermanentFees + activities[i].TotalContractMargin;

        var iMonthlyVariation = iEffectiveProfitForThisMonth - iEffectiveProfitForLastMonth;
        if (iEffectiveProfitForLastMonth != 0)
            iMonthlyVariation = (iMonthlyVariation / iEffectiveProfitForLastMonth) * 100;

        return iMonthlyVariation;
    },

    DrawSparkline: function (sPrefix, sTag, data)
    {
        var lColour = TriSysProUI.BackColour();
        var lNegativeColour = TriSysProUI.NavBarInverseColour();

        var sChart = sPrefix + sTag;

        $("#" + sChart).kendoSparkline({
            series: [{
                type: "column",
                data: data,
                color: lColour,
                negativeColor: lNegativeColour
            }],
            tooltip: {
                format: "{0}"
            },
            chartArea:
            {
                width: 100
            }
        });
    },

    TotalArray: function(arrOfNumbers)
    {
        var fTotal = 0;
        if(arrOfNumbers)
        {
            for (var i = 0; i < arrOfNumbers.length; i++)
            {
                fTotal += arrOfNumbers[i];
            }
        }
        return fTotal;
    },

    DrawHeader: function (CDashboardMetricsConsultant12MonthActivityResponse, lUserId, sPrefix)
    {
        var sPhotoTag = sPrefix + 'consultant-photo';
        var sNameTag = sPrefix + 'consultant-name';
        var sRankTag = sPrefix + 'consultant-rank';

        // Get API photo of user
        var sUserPhoto = TriSysApex.Cache.UsersManager.Photo(lUserId);
        var sUserName = TriSysApex.Cache.UsersManager.FullName(lUserId);
        var sRank = '#1 of 8';

        $('#' + sPhotoTag).attr('src', sUserPhoto);
        $('#' + sNameTag).html(sUserName);
        $('#' + sRankTag).html(sRank);

        var sTableHeaderConsultantTag = sPrefix + 'consultant-name-and-year';
        var sTableHeaderConsultant = sUserName + ' &nbsp; - &nbsp; ' + moment(new Date).format('YYYY');
        $('#' + sTableHeaderConsultantTag).html(sTableHeaderConsultant);

        var lColour = TriSysProUI.NavBarInverseColour();
        var sHeaderID = sPrefix + 'trisys-consultant-placement-summary-monthly-table-header-row';
        $('#' + sHeaderID).css('background-color', lColour);
        sHeaderID = sPrefix + 'trisys-consultant-placement-summary-monthly-table-averages-row';
        $('#' + sHeaderID).css('background-color', lColour);

        // Highlight current month
        var lCurrentMonthColour = TriSysProUI.BackColour();
        var sCurrentMonthColumns = ['header', 'target', 'effective', 'target-met', 'monthly-variation', 'placements-won',
                                    'avg-placement-value', 'avg-time-to-placement-perm', 'avg-time-to-placement-contract', 'avg-time-to-placement-temp',
                                    'production-sales'];    // Custom
        var sMonthName = moment(new Date).format('MMM');
        var sCurrentMonthPrefix = sPrefix + sMonthName.toLowerCase() + '-col-';

        for (var i = 0; i < sCurrentMonthColumns.length; i++)
        {
            var sCol = sCurrentMonthPrefix + sCurrentMonthColumns[i];
            $('#' + sCol).css('background-color', lCurrentMonthColour);
            $('#' + sCol).css('color', 'white');
        }

        // Totals column
        var TotalColour = TriSysProUI.ThemedSidebarBackgroundLight(0.63);
        var sColumnTotalCSS = '.trisys-consultant-placement-summary-monthly td:nth-child(14)';
        $(sColumnTotalCSS).css('background-color', TotalColour);
    },

    // The first chart in the TILE1 specification
    DrawPlacementSummaryMonthlyChart: function(Targets, Effective, PercentTargetMet, sChart)
    {        
        var iMaxPercentage = 0;
        for (var i = 0; i < PercentTargetMet.length; i++)
        {
            var targetPercentage = PercentTargetMet[i];            

            if (targetPercentage > iMaxPercentage)
                iMaxPercentage = targetPercentage;
        }

        var iMaxTarget = 0;
        for (var i = 0; i < Targets.length; i++)
        {
            var target = Targets[i];

            if (target > iMaxTarget)
                iMaxTarget = target;
        }

        var iMaxEffective = 0;
        for (var i = 0; i < Effective.length; i++)
        {
            var effectiveVal = Effective[i];

            if (effectiveVal > iMaxEffective)
                iMaxEffective = effectiveVal;
        }

        var iMaxAxisValue = iMaxTarget > iMaxEffective ? iMaxTarget : iMaxEffective;
        
        var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        var labelParameters = {
            PreSymbol: TriSysSDK.Controls.CurrencyAmount.DefaultCurrencySymbol(),
            PostSymbol: null,
            DecimalPlaces: 0,
            Skip: 1,
            Step: null,
            MaxValue: iMaxAxisValue
        };

        $("#" + sChart).kendoChart({
            title: {
            text: "Placement Targets vs Effective Totals (" + TriSysSDK.Controls.CurrencyAmount.DefaultCurrencySymbol() + ")"
            },
            chartArea: {
                height: 375
            },
            legend: {
                position: "bottom",
                labels: { font: TriSysSDK.KendoUICharts.Font }
            },
            series: [
                {
                    type: "column",
                    name: "Target",
                    data: Targets
                },
                {
                    type: "column",
                    name: "Effective",
                    data: Effective
                },
                {
                    type: "line",
                    name: "% Target Met",
                    data: PercentTargetMet,
                    axis: "% Target Met"
                }
            ],
            seriesColors: [TriSysProUI.BackColour(0.1), TriSysProUI.ThemedSidebarBackgroundLight(0.17), '#666666'],
            valueAxes: [
                {
                    labels: TriSysSDK.KendoUICharts.ValueAxes.Labels(labelParameters),
                    line: {
                        visible: false
                    }
                },
                {
                    name: "% Target Met",
                    title: { text: "Placement Target Met %", font: TriSysSDK.KendoUICharts.Font },
                    labels: {
                        format: "{0}%",
                        font: TriSysSDK.KendoUICharts.Font
                    },
                    line: {
                        visible: false
                    },
                    min: 0,
                    max: iMaxPercentage + 5
                }
            ],
            categoryAxis: {
                categories: months,
                line: {
                    visible: false
                },
                labels: {
                    padding: { top: 0 },
                    rotation: 0,
                    font: TriSysSDK.KendoUICharts.Font
                },
                // Right alignment is done by specifying a
                // crossing value greater than or equal to
                // the number of categories.
                axisCrossingValues: [0, months.length + 1]
            },
            tooltip: {
                visible: true,
                //format: "£#,0" //,
                //template: "#= series.name #: #= kendo.format('{#}', value) #"
                template: "#= category #: #= series.name #: #= TriSysSDK.Numbers.Format(value, 0) #"

            }
        });
    },

    DrawPlacementSummaryThisMonthChart: function(Targets, Effective, sChart)
    {
        var dtNow = new Date();
        var iCurrentMonthZeroBased = dtNow.getMonth();

        var fTargetValue = Targets[iCurrentMonthZeroBased], fEffectiveValue = Effective[iCurrentMonthZeroBased];
        ctrlConsultantPlacementSummary.DrawPlacementSummaryChart("Placements This Month (Target vs Effective) " + TriSysSDK.Controls.CurrencyAmount.DefaultCurrencySymbol(),
                    fTargetValue, fEffectiveValue, sChart);
    },

    DrawPlacementSummaryThisYearChart: function (Targets, Effective, sChart)
    {
        var fTargetValue = ctrlConsultantPlacementSummary.TotalArray(Targets)
        var dtNow = new Date();
        var iCurrentMonthZeroBased = dtNow.getMonth();
        var fEffectiveValue = 0;

        for (var i = 0; i <= iCurrentMonthZeroBased; i++)
            fEffectiveValue += Effective[i];

        ctrlConsultantPlacementSummary.DrawPlacementSummaryChart("Placements This Year (Target vs Effective) " + TriSysSDK.Controls.CurrencyAmount.DefaultCurrencySymbol(),
                        fTargetValue, fEffectiveValue, sChart);
    },

    DrawPlacementSummaryChart: function (sCaption, fTargetValue, fEffectiveValue, sChart)
    {
        var dataSource = [
            { Metric: "Target", Value: fTargetValue, Colour: TriSysProUI.BackColour(0.1) },
            { Metric: "Effective", Value: fEffectiveValue, Colour: TriSysProUI.ThemedSidebarBackgroundLight(0.17) }
        ];

        var iMaxAxisValue = fTargetValue > fEffectiveValue ? fTargetValue : fEffectiveValue;

        var labelParameters = {
            PreSymbol: TriSysSDK.Controls.CurrencyAmount.DefaultCurrencySymbol(),
            PostSymbol: null,
            DecimalPlaces: 0,
            Skip: 1,
            Step: null,
            MaxValue: iMaxAxisValue,
            Ticks: 4
        };

        $("#" + sChart).kendoChart({
            title: {
                text: sCaption
            },
            chartArea: {
                height: 250
            },
            dataSource: {
                data: dataSource
            },
            series: [
                {
                    type: "column",
                    field: "Value",
                    colorField: "Colour"
                }
            ],
            valueAxes: TriSysSDK.KendoUICharts.ValueAxes.Get(labelParameters),
            categoryAxis: {
                field: "Metric",
                labels: {
                    font: TriSysSDK.KendoUICharts.Font
                }
            },
            tooltip: {
                visible: true,
                template: "#= category #: " + TriSysSDK.Controls.CurrencyAmount.DefaultCurrencySymbol() + "#= TriSysSDK.Numbers.Format(value, 0) #"
            }
        });
    },

    TrafficLightsMetrics: function(sPrefix, Targets, Effective)
    {
        var sMonthly = sPrefix + 'this-month-percent';
        var sYearly = sPrefix + 'this-year-percent';
        var sDaysLeftMonth = sPrefix + 'this-month-days-left';
        var sDaysLeftYear = sPrefix + 'this-year-days-left';
        var sMonthlyTrafficLightTag = sPrefix + 'this-month-traffic-light';
        var sYearlyTrafficLightTag = sPrefix + 'this-year-traffic-light';

        var dtNow = new Date();
        var iCurrentMonthZeroBased = dtNow.getMonth();

        var iThisMonthPercentage = 0;
        var iThisMonthTarget = Targets[iCurrentMonthZeroBased];
        var iThisMonthEffective = Effective[iCurrentMonthZeroBased];
        if (iThisMonthTarget > 0)
            iThisMonthPercentage = (iThisMonthEffective / iThisMonthTarget) * 100;

        var sDisplayValue = TriSysSDK.Numbers.Format(iThisMonthPercentage, 2) + "%";
        $('#' + sMonthly).html(sDisplayValue);

        var iTotalTarget = ctrlConsultantPlacementSummary.TotalArray(Targets);
        var iTotalEffective = ctrlConsultantPlacementSummary.TotalArray(Effective);
        var iThisYearPercentage = 0;
        if (iTotalTarget > 0)
            iThisYearPercentage = (iTotalEffective / iTotalTarget) * 100;

        var sDisplayValue = TriSysSDK.Numbers.Format(iThisYearPercentage, 2) + "%";
        $('#' + sYearly).html(sDisplayValue);

        var iDaysLeft = ctrlConsultantPlacementSummary.DaysLeftInMonth();
        $('#' + sDaysLeftMonth).html(iDaysLeft);
        iDaysLeft = ctrlConsultantPlacementSummary.DaysLeftInYear();
        $('#' + sDaysLeftYear).html(iDaysLeft);

        var sMonthlyTrafficLight = ctrlConsultantPlacementSummary.GetTrafficLightImage(iThisMonthPercentage);
        var sYearlyTrafficLight = ctrlConsultantPlacementSummary.GetTrafficLightImage(iThisYearPercentage);
        $('#' + sMonthlyTrafficLightTag).attr('src', sMonthlyTrafficLight);
        $('#' + sYearlyTrafficLightTag).attr('src', sYearlyTrafficLight);

    },

    GetTrafficLightImage: function(fPercentage)
    {
        var sDefaultTrafficLightImagePath = "images/trisys/misc/Traffic-Light-";
        var sTrafficLightImageSuffix = ".png";
        var sColour = "Amber";

        if (fPercentage < 40)
            sColour = "Red";
        else if (fPercentage >= 100)
            sColour = "Green";
        
        return sDefaultTrafficLightImagePath + sColour + sTrafficLightImageSuffix;
    },

    // http://www.javascriptsource.com/time-date/days-left.html
    DaysLeftInMonth: function()
    {
        var today = new Date();
        var now = today.getDate();
        var year = today.getFullYear();
        var month = today.getMonth();

        var monarr = new Array(31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31);

        // check for leap year
        if (((year % 4 == 0) && (year % 100 != 0)) || (year % 400 == 0)) monarr[1] = "29";

        // display day left
        var iDaysLeft = (monarr[month] - now);

        return iDaysLeft;
    },

    DaysLeftInYear: function()
    {
        var today = new Date();
        var year = today.getFullYear();
        var date2 = new Date(year, 11, 31);
        var diff = Date.UTC(date2.getYear(), date2.getMonth(), date2.getDate(), 0, 0, 0)
                 - Date.UTC(today.getYear(), today.getMonth(), today.getDate(), 0, 0, 0);
        var daysleft = diff / 1000 / 60 / 60 / 24;
        return daysleft;
    },

    // Called when dynamic menu instructs us to change the view
    ConfigureMenuButtonClick: function (sID, sTileID)
    {
        // TODO: Dialogue to capture settings


        //var sPrefix = sTileID + '-';
        //var persistedSetting = { Setting: 'Tag', Value: sID };

        //// Persist these settings in framework so that we get loaded next time with the correct settings
        //if (persistedSetting)
        //{
        //    ctrlDashboard.Persistence.SaveTileSetting(sTileID, persistedSetting);

        //    // Refresh using this setting only
        //    var persistedSettings = [persistedSetting];
        //    ctrlConsultant12MonthActivity.LoadedInTile(sTileID, persistedSettings);
        //}
    },

    // After population is complete, call JS function is specified
    CustomOverrides: function()
    {
        if(ctrlConsultantPlacementSummary._CustomOverrideCallbackFunction)
        {
            try {
                ctrlConsultantPlacementSummary._CustomOverrideCallbackFunction();

            } catch (e) {            }
        }
    },

    _CustomOverrideCallbackFunction: null

};  // ctrlConsultantPlacementSummary
