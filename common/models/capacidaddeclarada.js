'use strict';
var mysql = require('mysql');
var fs = require('fs');
var events = require('events');
var eventEmitter = new events.EventEmitter();
var datasource;
var dataProy=[];
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

module.exports = function(Capacidaddeclarada) {

    Capacidaddeclarada.ConsumoProy = (fecha, cb) => {

        pool.getConnection(function(err, connection) {
            connection.query(`SELECT SUM(capproyectada) Total, SUM(capproyectada) - SUM(capdeclarada) Deficit, fecha
            FROM dblufussa.capacidadhora
            WHERE fecha BETWEEN '${fecha.fechai} 00:00:00.000'
            AND '${fecha.fechai} 23:59:59.000';`, function (error, results, fields) {
                if (error) throw error;
                let data = results;
                dataProy=data;
                connection.release();
                eventEmitter.emit('GetData');
            });
        });

        var GetProy = function () {
            cb(null, dataProy);
            eventEmitter.removeAllListeners();
        }
        eventEmitter.on('GetData', GetProy);
    }
    
    Capacidaddeclarada.remoteMethod('ConsumoProy', {
        http: { path: '/ConsumoProy', verb: 'post' },
        accepts: [
            { arg: 'fecha', type: 'object', require: true, http: { source: 'body' } }
        ],
        returns: { root: true, type: 'array' }
    });

};
