'use strict';
var sql = require('mssql');
var fs = require('fs');
var events = require('events');
var eventEmitter = new events.EventEmitter();
var datasource;
var Conexion;
var Consumo = [{
    Total: 0,
    SourceID: 0,
    QuantityID: 0
}]

module.exports = function (Datalog2) {

    Datalog2.ConsumoEnergia = (fecha, cb) => {
        fs.readFile('./server/datasources.json', async (err, data) => {
            if (err) throw err;
            datasource = JSON.parse(data);
            Conexion = {
                user: datasource.SQL.user,
                password: datasource.SQL.password,
                server: datasource.SQL.host,
                database: datasource.SQL.database,
                pool: {
                    max: 10,
                    min: 0,
                    idleTimeoutMillis: 30000
                }
            }
            eventEmitter.emit('GetData');
        });

        var GetEnergia = async function () {
            Consumo = await server();
            if (fecha != undefined) {
                cb(null, Consumo);
            }else{
                cb(null, null);
            }
            eventEmitter.removeAllListeners();
        }
        eventEmitter.on('GetData', GetEnergia);
        async function server() {
            let lista = [];
            await new sql.ConnectionPool(Conexion).connect().then(async pool => {
                return await pool.query(`
                SELECT (MAX(Value)-MIN(Value))/1000 Total
                    ,SourceID
                    ,QuantityID
                FROM [ION_Data].[dbo].[DataLog2]
                WHERE QuantityID IN (129,139)
                AND SourceID IN (6,8,10,12,14)
                AND (TimestampUTC LIKE '${fecha.fechai} 06:00%' OR TimestampUTC LIKE '${fecha.fechaf} 06:00%')
                GROUP BY QuantityID, SourceID
                ORDER BY QuantityID ASC
                `)
            }).then(async result=> {
                lista = await result.recordsets[0];
            }).catch(async err => {
                console.log(await err);
            })
            return lista;
        }
    }

    Datalog2.remoteMethod('ConsumoEnergia', {
        http: { path: '/ConsumoEnergia', verb: 'post' },
        accepts: [
            { arg: 'fecha', type: 'object', required: true, http: { source: 'body' } }
        ],
        returns: { root: true, type: 'array' },
    });
};
