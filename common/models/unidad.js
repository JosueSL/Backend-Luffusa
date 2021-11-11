'use strict';
var mysql = require('mysql');
var fs = require('fs');
var events = require('events');
var eventEmitter = new events.EventEmitter();
var datasource;
var dataRun=[];
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

module.exports = function(Unidad) {
    Unidad.PotenciaMaxima = (body, cb) => {
        pool.getConnection(function(err, connection) {
            connection.query(`
            SELECT id, Fecha, Max(Valor) Valor, idAllTags, idTag, idMaquina FROM dblufussa.datos
            WHERE Fecha BETWEEN '${body.fechaI} 00:00:00.000Z' AND '${body.fechaF} 23:59:59.000Z'
            AND idTag = 198;`, function (error, results, fields) {
                if (error) throw error;
                let data = results;
                dataRun=data[0];
                connection.release();
                eventEmitter.emit('GetData');
            });
        });

        var GetRun = function () {
            cb(null, dataRun);
            eventEmitter.removeAllListeners();
        }
        eventEmitter.on('GetData', GetRun);
    }

    Unidad.remoteMethod('PotenciaMaxima', {
        http: { path: '/PotenciaMaxima', verb: 'post' },
        accepts: [
            { arg: 'body', type: 'object', require: true, http: { source: 'body' } }
        ],
        returns: { root: true, type: 'array' }
    });
};
