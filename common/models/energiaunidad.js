'use strict';
var mysql = require('mysql');
var fs = require('fs');
var events = require('events');
var eventEmitter = new events.EventEmitter();
var datasource;
var energiaBruta=[];
var pool;

fs.readFile('./server/datasources.json', (err, data) => {
    if (err) throw err;
    datasource = JSON.parse(data);

    pool  = mysql.createPool({
        host: datasource.db.host,
        user: datasource.db.user,
        password: datasource.db.password,
        database: datasource.db.database
    });;
});

module.exports = function(Energiaunidad) {

    Energiaunidad.EnergiaBruta = (fecha, cb) => {

        pool.getConnection(function(err, connection) {
            connection.query(`CALL dblufussa.EnergiaBruta('${fecha.fechai}', '${fecha.fechaf}');`, function (error, results, fields) {
                if (error) throw error;
                let data = results;
                energiaBruta=data;
                connection.release();
                eventEmitter.emit('GetData');
            });
        });

        var GetEnergia = function () {
            let datos=[];
            let cont=0;
            let dato=0;
            let Total=0;
            let dato1=0;
            let Total1=0;
            let dato2=0;
            let Total2=0;
            let dato3=0;
            let Total3=0;
            //datos = energiaBruta[0];
            for (let item of energiaBruta[0]){
                datos.push({
                    Total: item.Total,
                    idMaquina: item.idMaquina,
                    Fecha: item.Fecha
                });
            }
            for (let j=1; j<=4; j++){
                //UNIDADES 2 - 5
                for (let item of datos.filter(x=>x.idMaquina==(j+1))){
                    if (cont==0){
                        dato=item.Total;
                    }else{
                        dato-=item.Total;
                    }
                    cont++;
                }
                if (dato<0){
                    dato=dato*(-1);
                }
                Total+=dato;
                if (j==4){
                    datos[0] = {
                        id: 1
                        , valor: Total
                    };
                }
                cont=0;

                //UNIDADES 6 - 9
                for (let item of energiaBruta[0].filter(x=>x.idMaquina==(j+5))){
                    if (cont==0){
                        dato1=item.Total;
                    }else{
                        dato1-=item.Total;
                    }
                    cont++;
                }
                if (dato1<0){
                    dato1=dato1*(-1);
                }
                Total1+=dato1;
                if (j==4){
                    datos[1] = {
                        id: 2
                        , valor: Total1
                    };
                }
                cont=0;

                //UNIDADES 10 - 13
                for (let item of energiaBruta[0].filter(x=>x.idMaquina==(j+9))){
                    if (cont==0){
                        dato2=item.Total;
                    }else{
                        dato2-=item.Total;
                    }
                    cont++;
                }
                if (dato2<0){
                    dato2=dato2*(-1);
                }
                Total2+=dato2;
                if (j==4){
                    datos[2] = {
                        id: 3
                        , valor: Total2
                    };
                }
                cont=0;

                //UNIDADES 14 - 17
                for (let item of energiaBruta[0].filter(x=>x.idMaquina==(j+13))){
                    if (cont==0){
                        dato3=item.Total;
                    }else{
                        dato3-=item.Total;
                    }
                    cont++;
                }
                if (dato3<0){
                    dato3=dato3*(-1);
                }
                Total3+=dato3;
                if (j==4){
                    datos[3] = {
                        id: 4
                        , valor: Total3
                    };
                }
                cont=0;

            }

            cb(null, datos);
            eventEmitter.removeAllListeners();
        }
        eventEmitter.on('GetData', GetEnergia);
    }

    Energiaunidad.remoteMethod('EnergiaBruta', {
        http: { path: '/EnergiaBruta', verb: 'post' },
        accepts: [
            { arg: 'fecha', type: 'object', require: true, http: { source: 'body' } }
        ],
        returns: { root: true, type: 'array' }
    });

};
