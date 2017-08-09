'use strict';

$(function() {

    //
    // Period for simple moving average.
    //
    var smaPeriod = 30;

    //
    // Data loaded for the current graph.
    //
    var curDataFrame = null;

	//
	// Generate a simple moving average time series from the input series.
	//
    var computeSmaSeries = function (series, period) {

        return series.rollingWindow(period)
            .asPairs()
            .select(function (pair) {
                var window = pair[1];
                return [window.getIndex().last(), window.average()];
            })
            .asValues()
            ;
    };

    //
    // Request data from the server.
    //
    var requestData = function (code) {

        return $.get('stock-history?symbol=' + code)
            .then(response => {
                curDataFrame = dataForge.fromCSV(response)
                    .where(row => row.timestamp)
                    .parseDates("timestamp")
                    .parseFloats(["open", "high", "low", "close", "volume"])
                    .setIndex("timestamp")
                    .reverse() // Data should be going forward
                    .bake()
                    ;

                return curDataFrame;
            });
    };

    //
    // Destroy the existing chart.
    //
    var destroyChart = function () {
        var chart = $('#container').highcharts();
        if (chart) {
            chart.destroy();
        }
    };

    //
    // Destroy and reload the chart.
    //
    var reloadChart = function () {
        destroyChart();
        loadChart();
    };

    $("#company").change(function() {
        reloadChart();
    });

    $('#loadChart').click(function () {
        reloadChart();
    });

    $('#SMA-period').change(function () {
        smaPeriod = $('#SMA-period').val();
        var chart = $('#container').highcharts();
        if (chart && curDataFrame) {
            updateSMA(chart, curDataFrame);
        }
    });

    $('#recalcSMA').click(function () {
        smaPeriod = parseInt($('#SMA-period').val());
        var chart = $('#container').highcharts();
        if (chart && curDataFrame) {
            updateSMA(chart, curDataFrame);
        }
    });

    //
	// Convert the data-frame to Highstock date+OHLC format.
	//
	var dataFrameToHighstockOHLC = function (dataFrame) {

        var it = dataFrame.getIterator();

        var output = [];
        while (it.moveNext()) {
            var pair = it.getCurrent();
            var index = pair[0];
            var row = pair[1];
            output.push([
                index.getTime(),
                row.open,
                row.high,
                row.low,
                row.close,
            ]);
        }

        return output;
    };

    //
    // Convert the column to Highstock date+value format.
    //
    var seriesToHighstock = function (series) {

        var self = this;

        var it = series.getIterator();

        var output = [];
        while (it.moveNext()) {
            var pair = it.getCurrent();
            var index = pair[0];
            var value = pair[1];
            output.push([
                index.getTime(),
                value,
            ]);
        }

        return output;
    };

    //
    // Compute simple moving average of the price.
    //
    var updateSMA = function (chart, dataFrame) {
        var sma = seriesToHighstock(computeSmaSeries(dataFrame.getSeries("Close"), smaPeriod));
        chart.series[1].setData(sma);
    };

    //
    // Resize the chart to fit the page.
    //
    var resizeChart = function () {
        var chart = $('#container').highcharts();
        chart.setSize($(window).width(), $(window).height()-50);            
    };

    //
    // Initalise the chart.
    //
    var initChart = function (dataFrame) {

        var price = dataFrameToHighstockOHLC(dataFrame);
        var volume = seriesToHighstock(dataFrame.getSeries("volume"));
        var sma = seriesToHighstock(computeSmaSeries(dataFrame.getSeries("close"), smaPeriod));

        var chartOptions =
        {
            chart: {
                width: $(window).width(),
                height: $(window).height()-50
            },

            title: {
                text: ' Stock price history',
            },

            subtitle: {
                text: 'A demo of Highstock using Data-Forge with data loaded from Alpha Vantage.',
            },

            xAxis: {
            },

            yAxis: [
                {
                    labels: {
                        align: 'right',
                        x: -3
                    },
                    title: {
                        text: 'Price'
                    },
                    height: '60%',
                    lineWidth: 2
                }, 
                {
                    labels: {
                        align: 'right',
                        x: -3
                    },
                    title: {
                        text: 'Volume'
                    },
                    top: '65%',
                    height: '35%',
                    offset: 0,
                    lineWidth: 2
                }
            ],

            series: [
                {
                    type: 'candlestick',
                    name: 'Price',
                    data: price,
                },
                {
                    type: 'line',
                    name: 'SMA',
                    color: 'red',
                    data: sma,
                    tooltip: {
                        valueDecimals: 2
                    }
                },
                {
                    type: 'column',
                    name: 'Volume',
                    data: volume,
                    yAxis: 1,
                }
            ]
        };
        
        // create the chart
        $('#container').highcharts('StockChart', chartOptions);
    };

    //
    // Load the chart.
    //
    var loadChart = function () {

        var code = $("#company").val();
        console.log('Loading ' + code);

        requestData(code)
            .then(function (dataFrame) {
                initChart(dataFrame);
            })
            .catch(function (err) {
                console.error(err.stack || err);  
            });
    };

    loadChart();

    //
    // Resize chart when window size changes.
    //
    $(window).resize(function() {
        resizeChart();
    });
});
