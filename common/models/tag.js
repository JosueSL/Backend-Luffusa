'use strict';
var mysql = require('mysql');
var fs = require('fs');
var events = require('events');
var eventEmitter = new events.EventEmitter();
var datasource;
var connection;
var Info;
var cont = 0;
var AllTags = [{
    id: 0,
    idTagName: 0,
    TagNameNombre: '',
    TagNameDescripcion: '',
    TagNameUnidad: '',
    TagNameActivo: 0,
    idMaquina: 0,
    MaquinaNombre: '',
    MaquinaDescripcion: '',
    MaquinaActiva: 0
}];

fs.readFile('./server/datasources.json', async (err, data) => {
    if (err) throw err;
    datasource = JSON.parse(data);
    connection = mysql.createConnection({
        host: datasource.db.host,
        user: datasource.db.user,
        password: datasource.db.password,
        database: datasource.db.database
    });
    Info = {
        id: 0,
        idTagName: 0,
        TagNameNombre: '',
        TagNameDescripcion: '',
        TagNameUnidad: '',
        TagNameActivo: 0,
        idMaquina: 0,
        MaquinaNombre: '',
        MaquinaDescripcion: '',
        MaquinaActiva: 0
    };
});

module.exports = async function (Tag) {

    Tag.AllTags = (datafilter, cb) => {

        cont = 0;
        AllTags = [];
        pool.getConnection(function(err, connection) {
            connection.query(`CALL dblufussa.GetTags();`, async function (error, results, fields) {
                if (error) throw error;
                let data = await results;
                for (let fila of data[0]) {
                    Info = fila;
                    AllTags[cont] = {
                        id: Info.id,
                        idTagName: Info.idTagName,
                        TagNameNombre: Info.TagNameNombre,
                        TagNameDescripcion: Info.TagNameDescripcion,
                        TagNameUnidad: Info.TagNameUnidad,
                        TagNameActivo: Info.TagNameActivo,
                        idMaquina: Info.idMaquina,
                        MaquinaNombre: Info.MaquinaNombre,
                        MaquinaDescripcion: Info.MaquinaDescripcion,
                        MaquinaActiva: Info.MaquinaActiva
                    };
                    cont++;
                    if (data[0].length == cont) {
                        connection.release();
                        eventEmitter.emit('GetData');
                    }
                }
            });
        });

        var GetDataTags = function () {
            //console.log(AllTags.filter(x=>x.idMaquina==maquina));
            if (!(datafilter==undefined)){
                
                console.log(datafilter.idmaquina+" - "+datafilter.idtag);
                
                //SI EXISTEN DATOS EN idmaquina Y idtag
                if (!isNaN(datafilter.idmaquina) && !isNaN(datafilter.idtag) && !isNaN(datafilter)){
                    cb(null, AllTags.filter(x=>x.idMaquina==datafilter.idmaquina && x.idTagName==datafilter.idtag));

                //SI EXISTEN DATOS SOLO EN idmaquina
                }else if(!isNaN(datafilter.idmaquina) && isNaN(datafilter.idtag)){
                    cb(null, AllTags.filter(x=>x.idMaquina==datafilter.idmaquina));
                
                //SI EXISTEN DATOS SOLO EN idtag
                }else if(isNaN(datafilter.idmaquina) && !isNaN(datafilter.idtag)){
                    cb(null, AllTags.filter(x=>x.idTagName==datafilter.idtag));
                }
            }else{
                cb(null, AllTags);
            }
            eventEmitter.removeAllListeners();
        }
        eventEmitter.on('GetData', GetDataTags);
    };

    Tag.remoteMethod('AllTags', {
        http: { path: '/AllTags', verb: 'get' },
        accepts: [
            {arg: 'datafilter', type: 'object', http: { source: 'query' }}
        ],
        returns: { root: true, type: 'object' },
    });
};