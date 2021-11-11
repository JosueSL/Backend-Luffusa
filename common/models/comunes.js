'use strict';
var mysql = require('mysql');
var fs = require('fs');
var events = require('events');
var eventEmitter = new events.EventEmitter();
var datasource;
var dataComunes=[];
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

module.exports = function (Comunes) {

    Comunes.ConsumoComunes = (fecha, cb) => {

        pool.getConnection(function(err, connection) {
            connection.query(`CALL dblufussa.ResumenServicioPropio('${fecha.fechai}', '${fecha.fechaf}');`, function (error, results, fields) {
                if (error) throw error;
                let data = results;
                dataComunes=data;
                connection.release();
                eventEmitter.emit('GetData');
            });
        });

        var GetComunes = function () {
            let datos=[];
            datos = dataComunes[0];
            let resultado=[];
            for (let key in datos){
                resultado[key]=datos[key].Total;
            }
            cb(null, [{Total: (resultado[1]-resultado[0])<0 ? (resultado[1]-resultado[0])*(-1):(resultado[1]-resultado[0])}]);
            eventEmitter.removeAllListeners();
        }
        eventEmitter.on('GetData', GetComunes);
    }

    Comunes.remoteMethod('ConsumoComunes', {
        http: { path: '/ConsumoComunes', verb: 'post' },
        accepts: [
            { arg: 'fecha', type: 'object', require: true, http: { source: 'body' } }
        ],
        returns: { root: true, type: 'array' }
    });

};
