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

module.exports = function(Turno) {

    Turno.EmpleadoTurno = (body, cb) => {
        pool.getConnection(function(err, connection) {
            connection.query(`
            SELECT CONCAT(em.nombre,' ',em.apellido) Nombre FROM dblufussa.turno tn
            INNER JOIN dblufussa.empleado em ON em.id = tn.idEmpleado
            WHERE Fecha BETWEEN '${body.fechai} 00:00:00.000Z' AND '${body.fechai} 23:59:59.000Z'
            AND tn.Activo = 1;`, function (error, results, fields) {
                if (error) throw error;
                let data = results;
                dataRun=data[0];
                connection.release();
                eventEmitter.emit('GetData');
            });
        });

        var GetRun = function () {
            cb(null, [dataRun]);
            eventEmitter.removeAllListeners();
        }
        eventEmitter.on('GetData', GetRun);
    }

    Turno.remoteMethod('EmpleadoTurno', {
        http: { path: '/EmpleadoTurno', verb: 'post' },
        accepts: [
            { arg: 'body', type: 'object', require: true, http: { source: 'body' } }
        ],
        returns: { root: true, type: 'array' }
    });

};
