'use strict';
var mysql = require('mysql');
var fs = require('fs');
var events = require('events');
var eventEmitter = new events.EventEmitter();
var datasource;
var dataPot=[];
var pool;

fs.readFile('./server/datasources.json', (err, data) => {
    if (err) throw err;
    datasource = JSON.parse(data);

    pool  = mysql.createPool({
        host: datasource.db.host,
        user: datasource.db.user,
        password: datasource.db.password,
        database: datasource.db.database
    });
});

module.exports = function(Booster) {

    Booster.HeatRateION = (body, cb) => {

        pool.getConnection(function(err, connection) {
            connection.query(`
            SELECT Fecha, AVG(Valor) Total FROM dblufussa.datos WHERE 
            Fecha BETWEEN '${body.fechai} 00:00:00.000' AND '${body.fechafr} 23:59:59.000' AND 
            idTag = 135
            GROUP BY YEAR(Fecha), MONTH(Fecha), DAYOFMONTH(Fecha);
            `, function (error, results, fields) {
                if (error) throw error;
                let data = results;
                dataPot=data;
                connection.release();
                eventEmitter.emit('GetData');
            });
        });

        var GetPot = function () {
            cb(null, dataPot);
            eventEmitter.removeAllListeners();
        }
        eventEmitter.on('GetData', GetPot);
    }


    Booster.remoteMethod('HeatRateION', {
        http: { path: '/HeatRateION', verb: 'post' },
        accepts: [
            { arg: 'body', type: 'object', require: true, http: { source: 'body' } }
        ],
        returns: { root: true, type: 'array' }
    });
};
