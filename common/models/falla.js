'use strict';
var mysql = require('mysql');
var fs = require('fs');
var events = require('events');
var eventEmitter = new events.EventEmitter();
var datasource;
var dataMaquina = [];
var pool;

fs.readFile('./server/datasources.json', (err, data) => {
    if (err) throw err;
    datasource = JSON.parse(data);

    pool = mysql.createPool({
        host: datasource.db.host,
        user: datasource.db.user,
        password: datasource.db.password,
        database: datasource.db.database
    });
});

module.exports = function (Falla) {

    Falla.EstadoMaquina = (body, cb) => {
        let query = '';
        query = `CALL dblufussa.getEstadoMaquina('${body.fecha}');`;

        pool.getConnection(function (err, connection) {
            connection.query(query, function (error, results, fields) {
                if (error) throw error;
                let data = results;
                dataMaquina = data;
                connection.release();
                eventEmitter.emit('GetData');
            });
        });

        var GetEstadoMaquina = function () {
            let datos = [];
            datos = dataMaquina[0];
            cb(null, datos);
            eventEmitter.removeAllListeners();
        }
        eventEmitter.on('GetData', GetEstadoMaquina);
    }

    Falla.remoteMethod('EstadoMaquina', {
        http: { path: '/EstadoMaquina', verb: 'post' },
        accepts: [
            { arg: 'body', type: 'object', require: true, http: { source: 'body' } }
        ],
        returns: { root: true, type: 'array' }
    });
};
