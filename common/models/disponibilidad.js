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

module.exports = function(Disponibilidad) {

    Disponibilidad.getFD = (body, cb) => {

        pool.getConnection(function(err, connection) {
            connection.query(`
            SELECT IFNULL(SUM(fdDiario), 0) TotalAnio, COUNT(fdDiario) FilasAnio,
            (SELECT IFNULL(SUM(fdDiario), 0) Total FROM dblufussa.disponibilidad WHERE Fecha >= '${body.mes}' AND Fecha <= '${body.fecha}') TotalMes,
            (SELECT COUNT(fdDiario) Filas FROM dblufussa.disponibilidad WHERE Fecha >= '${body.mes}' AND Fecha <= '${body.fecha}') FilasMes
            FROM dblufussa.disponibilidad
            WHERE Fecha >= '${body.anio}' AND Fecha <= '${body.fecha}';
            `, function (error, results, fields) {
                if (error) throw error;
                let data = results;
                dataRun=data[0];
                connection.release();
                eventEmitter.emit('GetData');
            });
        });

        var GetFD = function () {
            cb(null, [dataRun]);
            eventEmitter.removeAllListeners();
        }
        eventEmitter.on('GetData', GetFD);
    }

    Disponibilidad.remoteMethod('getFD', {
        http: { path: '/getFD', verb: 'post' },
        accepts: [
            { arg: 'body', type: 'object', require: true, http: { source: 'body' } }
        ],
        returns: { root: true, type: 'array' }
    });

};
