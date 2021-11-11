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

module.exports = function(Eventos) {

    Eventos.Runing = (body, cb) => {
        pool.getConnection(function(err, connection) {
            connection.query(`CALL dblufussa.horasmaquina(${body.fecha});`, function (error, results, fields) {
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

    Eventos.remoteMethod('Runing', {
        http: { path: '/Runing', verb: 'post' },
        accepts: [
            { arg: 'body', type: 'object', require: true, http: { source: 'body' } }
        ],
        returns: { root: true, type: 'array' }
    });

};
