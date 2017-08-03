    var path = require('path');
    var express = require('express');
    var request = require('request-promise');
    var E = require('linq');

    //var alphaVantageApiKey = "<insert-your-api-key-here>";
    var alphaVantageApiKey = "95VD"; //fio:

    var app = express();

    // Serve static files.
    var staticPath = path.join(__dirname, 'client');
    console.log(staticPath);
    app.use(express.static(staticPath));

    // Proxy REST API that relays to Alpha Vantage
    app.get('/stock-history', function (req, res) {

        var symbol = req.query.symbol;
        if (!symbol) {
            throw new Error("Symbol not specified.");
        }

        var url = 'https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=' + symbol + '&apikey=' + alphaVantageApiKey + '&datatype=csv';
        request(url)
            .then(function (result) {
                res.set('Content-Type', 'text/csv');
                res.send(result).end();
            })
            .catch(function (e) {
                console.error(e)
            }); 
    });

    // Start the server.
    var server = app.listen(process.env.PORT || 3000, function () {

        var host = server.address().address
        var port = server.address().port

        console.log('Example app listening at http://%s:%s', host, port)
    });
