// Self contained logic for populating the contract/temp rates grid and chart
//
var ctrlContractRates =
{
    // Called by TriSysSDK.ContractRates.AfterControlLoaded event to change div ID's as we will
    // have multiple versions of this control loaded simultaneously.
    PostLoad: function (sEntityName, lRecordId, parentDiv)
    {
        var sIDSuffix = '-' + parentDiv;

        // Change ID of all internal divs
        var controls = ['trisys-contract-rates-block', 'ContractRatesFileMenu', 'ContractRatesGridMenu',
                        'trisys-contract-rates-grid', 'trisys-contract-rates-chart'];
        for (var i in controls)
        {
            $('#' + controls[i]).attr('id', controls[i] + sIDSuffix);
        }


        // Menu callbacks
        var sGrid = 'trisys-contract-rates-grid' + sIDSuffix;
        var sKeyField = "EntityId";
        var sWhat = 'pay/charge rate';

        //var fnGridFileMenu = function (sFileMenuID)
        //{
        //    ctrlContractRates.FileMenuCallback(sFileMenuID, sEntityName, lRecordId, sGrid);
        //};
        //// TODO: Add callback handlers as their will be multiple of these open at any time
        //TriSysSDK.FormMenus.DrawGridFileMenu('ContractRatesFileMenu' + sIDSuffix, sGrid, fnGridFileMenu);

        $('#ContractRates-Add').attr("id", 'ContractRates-Add' + sIDSuffix);
        $('#ContractRates-Add' + sIDSuffix).click(function ()
        {
            TriSysApex.ModalDialogue.ContractRates.Show(sEntityName, lRecordId, sGrid, 0);
        });
        $('#ContractRates-Open').attr("id", 'ContractRates-Open' + sIDSuffix);
        $('#ContractRates-Open' + sIDSuffix).click(function ()
        {
            lRateId = TriSysSDK.Grid.GetSelectedSingletonRowRecordIdFromGrid(sGrid, sKeyField, sWhat);
            if (lRateId > 0)
                TriSysApex.ModalDialogue.ContractRates.Show(sEntityName, lRecordId, sGrid, lRateId);
        });
        $('#ContractRates-Delete').attr("id", 'ContractRates-Delete' + sIDSuffix);
        $('#ContractRates-Delete' + sIDSuffix).click(function ()
        {
            lRateId = TriSysSDK.Grid.GetSelectedSingletonRowRecordIdFromGrid(sGrid, sKeyField, sWhat);
            if (lRateId > 0)
                ctrlContractRates.Delete(sEntityName, lRecordId, sGrid, lRateId);
        });

        TriSysSDK.FormMenus.DrawGridMenu('ContractRatesGridMenu' + sIDSuffix, sGrid);

        // Set up the grid now
        ctrlContractRates.PopulateGrid(sEntityName, lRecordId, sGrid);

        // Force through the theme once again!
        setTimeout(TriSysProUI.kendoUI_Overrides, 500);        
    },

    // Populate the grid with rates for this entity record
    PopulateGrid: function (sEntityName, lEntityId, sGrid)
    {
        // Jan 2018: Use a dedicated API method which abstracts the underlying SQL and does not use 'SQLDatabase/SQL_Select'
        var fnPopulationByFunction = {
            API: "Rates/List",                      // The Web API Controller/Function

            // The additional parameters passed into the function not including the paging metrics
            Parameters: function (request)
            {
                request.EntityName = sEntityName;
                request.RecordId = lEntityId;
            },

            DataTableFunction: function (response)  // Called to get a suitable data table for the grid to display
            {
                return response.List;               // The list of records from the Web API
            }
        };

        // Call grid API to populate
        ctrlContractRates.PopulateGridWithAPI(sEntityName, lEntityId, sGrid, fnPopulationByFunction);
    },

    // Commence population only after receiving complex dynamic SQL statement from server
    PopulateGridWithAPI: function (sEntityName, lRecordId, sGrid, fnPopulationByFunction)
    {
        var sDisplay = (sEntityName == 'Company' ? '_Display' : '');
        var sKeyField = "EntityId";

        var columns = [
                { field: sKeyField, title: "ID", type: "number", width: 70, hidden: true },
                { field: "RateType", title: "Rate Type", type: "string" },
                { field: "PayRate" + sDisplay, title: "Pay Rate", type: "string" },
                { field: "ChargeRate" + sDisplay, title: "Charge Rate", type: "string", width: 180 },
                { field: "Notes", title: "Notes", type: "string" }
        ];

        var sMobileRowTemplatePrefix = '';

        if (sEntityName == 'Company')
        {
            var companyColumn1 = { field: "JobTitle", title: "Job Title", type: "string" };
            var companyColumn2 = { field: "CompanyAddress", title: "Address", type: "string" };
            columns.splice(1, 0, companyColumn1);
            columns.splice(2, 0, companyColumn2);

            sMobileRowTemplatePrefix = '<strong>#: JobTitle #</strong><br />';
        }

        var fnPostPopulationCallback = function (lRecordCount)
        {
            ctrlContractRates.DrawChart(sGrid);
        }

        TriSysSDK.Grid.VirtualMode({
            Div: sGrid,
            ID: "grdContractRates-" + sGrid,
            Title: "Contract Rates",
            RecordsPerPage: TriSysApex.UserOptions.RecordsPerPage(),
            PopulationByFunction: fnPopulationByFunction,
            Columns: columns,
            MobileVisibleColumns: [
                { field: "RateType", title: "Rate Type", type: "string" }
            ],
            MobileRowTemplate: '<td colspan="1">' + sMobileRowTemplatePrefix +
                                    '#: RateType #: Pay <i>#: PayRate' + sDisplay + ' #</i>, Charge <i>#: ChargeRate' + sDisplay + ' #</i></td>',

            KeyColumnName: sKeyField,
            DrillDownFunction: function (rowData)
            {
                var lRateId = rowData[sKeyField];

                // 09 May 2021: Bug
                if (rowData.RequirementId)
                    lRecordId = rowData.RequirementId;
                else if (rowData.PlacementId)
                    lRecordId = rowData.PlacementId;

                TriSysApex.ModalDialogue.ContractRates.Show(sEntityName, lRecordId, sGrid, lRateId);
            },
            MultiRowSelect: true,
            Grouping: false,
            ColumnFilters: false,
            OpenButtonCaption: "Edit",
            PostPopulationCallback: fnPostPopulationCallback,
            HyperlinkedColumns: ["RateType"]                      // New Jan 2021
        });
    },

    FileMenuCallback: function (sFileMenuID, sEntityName, lRecordId, sGrid)
    {
        var fm = TriSysSDK.FormMenus.Constants;
        var lRateId = 0;
        var sKeyField = "EntityId";
        var sWhat = 'pay/charge rate';

        switch (sFileMenuID)
        {
            case fm.File_New:
                TriSysApex.ModalDialogue.ContractRates.Show(sEntityName, lRecordId, sGrid, lRateId);
                break;

            case fm.File_Open:
                lRateId = TriSysSDK.Grid.GetSelectedSingletonRowRecordIdFromGrid(sGrid, sKeyField, sWhat);
                if (lRateId > 0)
                    TriSysApex.ModalDialogue.ContractRates.Show(sEntityName, lRecordId, sGrid, lRateId);
                break;

            case fm.File_Delete:
                lRateId = TriSysSDK.Grid.GetSelectedSingletonRowRecordIdFromGrid(sGrid, sKeyField, sWhat);
                if (lRateId > 0)
                    ctrlContractRates.Delete(sEntityName, lRecordId, sGrid, lRateId);
                break;
        }
    },

    Delete: function (sEntityName, lRecordId, sGrid, lRateId)
    {
        var fnDelete = function ()
        {
            ctrlContractRates.DeleteRecord(sEntityName, lRecordId, sGrid, lRateId);
            return true;
        };
        TriSysApex.UI.questionYesNo("Delete Pay &amp; Charge Rate?", TriSysApex.Copyright.ShortProductName, "Yes", fnDelete, "No");
    },

    DeleteRecord: function (sEntityName, lEntityId, sGrid, lRateId)
    {
        var CDeleteRateRequest = {
            'EntityName': sEntityName,
            'EntityId': lEntityId,
            'RateId': lRateId
        };

        var payloadObject = {};

        // Call the API to submit the data to the server
        payloadObject.URL = "Rates/Delete";

        payloadObject.OutboundDataPacket = CDeleteRateRequest;

        payloadObject.InboundDataFunction = function (data)
        {
            TriSysApex.UI.HideWait();

            var CDeleteRateResponse = data;

            if (CDeleteRateResponse)
            {
                if (CDeleteRateResponse.Success)
                {
                    // Refresh the underlying grid
                    TriSysSDK.Grid.ClearCheckedRows(sGrid);
                    TriSysSDK.Grid.RefreshData(sGrid);

                    return;
                }
                else
                    TriSysApex.UI.ShowMessage(CDeleteRateResponse.ErrorMessage);
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('ctrlContractRates.DeleteRecord: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Deleting Rate...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    DrawChart: function (sGrid)
    {
        // Read all data from the grid data source
        var gridData = TriSysSDK.Grid.ReadGridContents(sGrid);
        if (!gridData)
            return;

        var sChart = sGrid.replace('-grid', '-chart');

        // Validate the data
        var iRowCount = gridData.rows.length;
        var iColumnCount = gridData.columns.length;
        if (iRowCount <= 0 || iColumnCount <= 0)
        {
            // If no data, then no chart
            $('#' + sChart).hide();
            return;
        }
        else
        {
            // Make visible again 
            $('#' + sChart).show();
        }

        // Package up for the chart format
        var payData = [];
        var chargeData = [];
        var categories = [];
        var gridRows = gridData.rows;

        for (var iRow = 0; iRow < gridRows.length; iRow++)       
        {
            var row = gridRows[iRow];

            var sRateType = row.RateType;                   // e.g. 'Standard"
            var sPayRate = row.PayRate_Display;             // e.g. '£10.50 per Hour'
            var sChargeRate = row.ChargeRate_Display;       // e.g. '$120 per Day'

            // Fault tolerance - if no display fields, then assume these are strings and not ID's
            if (!sPayRate)
                sPayRate = row.PayRate;
            if (!sChargeRate)
                sChargeRate = row.ChargeRate;


            // Convert to actuals
            var fPayRate = TriSysSDK.Controls.CurrencyAmountPeriod.ParseAmount(sPayRate);
            var fChargeRate = TriSysSDK.Controls.CurrencyAmountPeriod.ParseAmount(sChargeRate);

            // Add to array
            payData.push(fPayRate);
            chargeData.push(fChargeRate);
            categories.push(sRateType);
        }

        var labelParameters = {
            PreSymbol: TriSysSDK.Controls.CurrencyAmount.DefaultCurrencySymbol(),
            PostSymbol: null,
            DecimalPlaces: 0,
            Skip: 1,
            Step: null
        };

        // Draw chart from grid data
        $("#" + sChart).kendoChart({
            chartArea: {
                height: 250
            },
            legend: {
                position: "top",
                labels: { font: TriSysSDK.KendoUICharts.Font }
            },
            seriesDefaults: {
                type: "column"
            },
            series: [{
                name: "Pay",
                data: payData
            }, {
                name: "Charge",
                data: chargeData
            }],
            seriesColors: [TriSysProUI.NavBarInverseColour(), TriSysProUI.BackColour()],   
            valueAxis: TriSysSDK.KendoUICharts.ValueAxes.Get(labelParameters),
            categoryAxis: {
                categories: categories,
                line: {
                    visible: false
                },
                labels: {
                    padding: { top: 0 },
                    font: TriSysSDK.KendoUICharts.Font
                }
            },
            tooltip: {
                visible: true,
                format: TriSysSDK.Controls.CurrencyAmount.DefaultCurrencySymbol() + "#,0"
                //template: "#= series.name #: £" + "#= TriSysSDK.Numbers.Format(value, 0) #"   DOES NOT WORK FOR SOME REASON!
            }
        });
    }
};

