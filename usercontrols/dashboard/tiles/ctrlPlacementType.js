var ctrlPlacementTypeChart =
{
    // This is called when the tile manager has loaded us.
    LoadedInTile: function (sTileID, persistedSettings)
    {
        // Called when this control has been loaded into a live tile.

        // Note that all our DOM elements have been renamed to be unique and prefixed
        var sPrefix = sTileID + '-';

        // Load data now
        try
        {
            ctrlPlacementTypeChart.Load(sPrefix);

        } catch (e)
        {

        }
    },

    Load: function (sPrefix)
    {
        var sChart = sPrefix + "placement-type-chart";

        var fnPopulationByFunction = {
            API: "DashboardMetric/PlacementTypes",  // The Web API Controller/Function

            DataTableFunction: function (response)  // Called to get a suitable data table for the grid to display
            {
                return response.List;               // The list of records from the Web API
            }
        };

        var fnProcessDataTable = function (dataTable)
        {
            var lPermanent = 0;
            var lContract = 0;
            var lTemporary = 0;

            var dt = dataTable;
            for (var i = 0; i < dt.length; i++)
            {
                var dr = dt[i];
                var sPlacementType = dr["PlacementType"];
                var iCount = dr["Counter"];

                switch (sPlacementType)
                {
                    case 'Permanent':
                        lPermanent = iCount;
                        break;
                    case 'Contract':
                        lContract = iCount;
                        break;
                    case 'Temporary':
                        lTemporary = iCount;
                        break;

                }
            }

            var figures = { Permanent: lPermanent, Contract: lContract, Temporary: lTemporary };

            ctrlPlacementTypeChart.DrawChart(sChart, figures);
        };

        TriSysSDK.Database.GetDataSetFromFunction(fnPopulationByFunction, fnProcessDataTable);        
    },

    DrawChart: function (sChart, figures)
    {
        var lColorPermanent = TriSysProUI.NavBarInverseColour();
        var lColorContract = TriSysProUI.BackColour();
        var lColorTemp = TriSysProUI.ThemedSidebarBackgroundLight(0.25);    //TriSysProUI.ThemedAlternativeBackColor();

        // The black and white theme is an exception because the color is too dark, so lighten it
        if (TriSysProUI.CurrentThemeNameLike('Night'))
            lColorContract = TriSysProUI.LightenColour(lColorContract, 0.1);

        // Calculate percentages
        var fTotal = figures.Permanent + figures.Contract + figures.Temporary;
        var fnCalcPercentage = function (fValue, fTotal)
        {
            var fPercentage = 0;
            if (fValue > 0)
                fPercentage = (fValue / fTotal) * 100;
            return fPercentage;
        };
        var fPermanentPercentage = fnCalcPercentage(figures.Permanent, fTotal);
        var fContractPercentage = fnCalcPercentage(figures.Contract, fTotal);
        var fTemporaryPercentage = fnCalcPercentage(figures.Temporary, fTotal);

        // Convert into series data with colours
        var seriesData = [];
        var seriesColors = [];
        if (fPermanentPercentage > 0)
        {
            seriesColors.push(lColorPermanent);
            var typeData = {
                category: "Permanent",
                value: fPermanentPercentage
            };
            seriesData.push(typeData);
        }
        if (fContractPercentage > 0)
        {
            seriesColors.push(lColorContract);
            var typeData = {
                category: "Contract",
                value: fContractPercentage
            };
            seriesData.push(typeData);
        }
        if (fTemporaryPercentage > 0)
        {
            seriesColors.push(lColorTemp);
            var typeData = {
                category: "Temporary",
                value: fTemporaryPercentage
            };
            seriesData.push(typeData);
        }

        // Height
        var lHeight = 500;
        var sCSSHeight = $("#" + sChart).css("height");
        if (sCSSHeight)
            lHeight = parseInt(sCSSHeight.replace('px', ''));

        // Position
        var sPosition = "top";
        var sPositionAttribute = "trisys-chart-property-legend-position";
        var sPositionAttributeValue = $("#" + sChart).attr(sPositionAttribute);
        if (sPositionAttributeValue)
            sPosition = sPositionAttributeValue;

        // Draw chart
        $("#" + sChart).kendoChart({
            //title: {
            //    text: "Permanent Salary Package"
            //},
            legend: {
                position: sPosition,
                labels: { font: TriSysSDK.KendoUICharts.Font }
            },
            chartArea: {
                height: lHeight
            },
            seriesDefaults: {
                labels: {
                    template: "#= category # - #= kendo.format('{0:P}', percentage)#",
                    position: "outsideEnd",
                    visible: false,
                    background: "transparent",
                    font: TriSysSDK.KendoUICharts.Font
                }
            },
            seriesColors: seriesColors,
            series: [{
                type: "pie",
                data: seriesData
            }],
            tooltip: {
                visible: true,
                template: '<span style="color:white;">#= category # - #= kendo.format("{0:P}", percentage) #</span>'
            }
        });

    }

}
