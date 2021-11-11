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

module.exports = function(Datosmanual) {

    Datosmanual.PotenciaArranques = (body, cb) => {

        pool.getConnection(function(err, connection) {
            connection.query(`CALL dblufussa.ArranquesPotencia('${body.fechaI}', '${body.fechaF}');`, function (error, results, fields) {
                if (error) throw error;
                let data = results;
                dataPot=data[0];
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

	Datosmanual.remoteMethod('PotenciaArranques', {
        http: { path: '/PotenciaArranques', verb: 'post' },
        accepts: [
            { arg: 'body', type: 'object', require: true, http: { source: 'body' } }
        ],
        returns: { root: true, type: 'array' }
    });

};
