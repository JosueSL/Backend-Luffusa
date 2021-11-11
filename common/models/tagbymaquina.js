'use strict';
var sql = require('mssql');
var fs = require('fs');
var events = require('events');
var eventEmitter = new events.EventEmitter();
var datasource;
var Conexion;
var AlarmasResult = [{
    Total: 0,
    Maquina: 0,
    Codigo: 0
}];

module.exports = function(Tagbymaquina) {

    function query(maquinas, fechai, fechaf){
        let query = '', equipos = '';
        let cont=0;
        maquinas.sort((a,b) => { return a.id - b.id});
        for (let item of maquinas){
            
            if (cont<maquinas.length-1){
                equipos += "("+item.id+", '"+item.codigo+"'),";
            }else{
                equipos += "("+item.id+", '"+item.codigo+"')";
            }

            cont++;
        }

        query = `DECLARE @cont AS INT;
        DECLARE @cod VARCHAR(5);
        SET @cont = 0;

        IF OBJECT_ID('tempdb..#maquina') IS NOT NULL
            Truncate TABLE #maquina
        else
            CREATE TABLE #maquina(id INT, codigo VARCHAR(50))

        INSERT INTO #maquina (id, codigo) VALUES ${equipos}

        IF OBJECT_ID('tempdb..#datos') IS NOT NULL
            Truncate TABLE #datos
        else
            CREATE TABLE #datos(Fecha DATETIME, Hora INT, Total VARCHAR(50), Maquina INT, Codigo VARCHAR(5))

        WHILE @cont <= (SELECT COUNT(*) FROM #maquina)-1
        BEGIN
        SET @cod = (SELECT codigo FROM #maquina WHERE id = (@cont)+2)

        INSERT INTO #datos (Fecha, Hora, Total, Maquina, Codigo)
        SELECT 
            EventStamp
            , DATEPART(HOUR, EventStamp)  
            , Value
            , (@cont)+2  idMaquina
            , @cod Codigo
        FROM v_AlarmHistory
        WHERE TagName IN ('SNA061T000SHP', CONCAT('SNA',@cod,'T000SHP'), 'SOC'+@cod+'T000SHP', 'SOC'+@cod+'T100SHP', 'BAG'+@cod+'T004SHP'
                            , 'BAG'+@cod+'T005SHP', 'CFC'+@cod+'S020EIP', 'CFE'+@cod+'S020EIP', 'SQA'+@cod+'P001SLP', 'SVH'+@cod+'T004SHP'
                            , 'SNB'+@cod+'T003SHP', 'SOB'+@cod+'S008SHP', 'SOB'+@cod+'S009SHP' ,'SOB'+@cod+'P001SHP', 'SVH'+@cod+'P003SLP'
                            , 'SVL'+@cod+'P003SLP', 'SQA'+@cod+'P008SSLP', 'BAE'+@cod+'F87ASIP', 'SOB'+@cod+'S004SIP', 'SQA'+@cod+'S003SIP'
                            , 'SVH'+@cod+'T013SHP', 'CFC'+@cod+'AUSSIP', 'CFC'+@cod+'PMAXSIP', 'BAE'+@cod+'F001TIP', 'CFC'+@cod+'S005TIP'
                            , 'SVH'+@cod+'T014SIP', 'SAE'+@cod+'L001SHP', 'SVH'+@cod+'P003SHP', 'CFE'+@cod+'D0200SHP', 'SQA'+@cod+'P000SLP')
            AND Value = 'ON'
            AND AlarmState = 'UNACK_ALM'
            AND EventStamp BETWEEN '${fechai}:00' AND '${fechaf}:00';
        SET @cont = @cont + 1
        END
        SELECT * FROM #datos`;
        return query;
    }

    Tagbymaquina.Alarmas = (datos, cb) => {
        fs.readFile('./server/datasources.json', async (err, data) => {
            if (err) throw err;
            datasource = JSON.parse(data);
            Conexion = {
                user: datasource.alarm.user,
                password: datasource.alarm.password,
                server: datasource.alarm.host,
                database: datasource.alarm.database,
                connectionTimeout: 300000,
                requestTimeout: 300000,
                pool: {
                    max: 10,
                    min: 0,
                    idleTimeoutMillis: 30000
                }
            }
            eventEmitter.emit('GetData');
        });

        var GetAlarmas = async function () {
            AlarmasResult = await almDB();
            if (datos != undefined) {
                cb(null, AlarmasResult);
            }else{
                cb(null, null);
            }
            eventEmitter.removeAllListeners();
        }
        eventEmitter.on('GetData', GetAlarmas);
        
        async function almDB() {
            let lista = [];
            await new sql.ConnectionPool(Conexion).connect().then(async pool => {
                return await pool.query(query(datos.maquinas, datos.fechai, datos.fechaf))
            }).then(async result => {
                lista = await result.recordsets[0];
            }).catch(async err => {
                console.log(await err);
            })
            return lista;
        }
    }

    Tagbymaquina.remoteMethod('Alarmas', {
        http: { path: '/Alarmas', verb: 'post' },
        accepts: [
            { arg: 'datos', type: 'object', required: true, http: { source: 'body' } }
        ],
        returns: { root: true, type: 'array' },
    });
};
