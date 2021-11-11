'use strict';
const bcrypt = require('bcryptjs');
const saltRounds = 10;
var salt = bcrypt.genSaltSync(saltRounds);
var mysql = require('mysql');
var fs = require('fs');
var events = require('events');
var eventEmitter = new events.EventEmitter();
var datasource;
var connection;
var aviso = [{
    id: 0,
    username: '',
    password: '',
    email: ''
}];

module.exports = function (Getuser) {
    var hash;
    Getuser.PatchDataUser = (dataUser, res, cb) => {
        if ((dataUser != undefined)) {
            fs.readFile('./server/datasources.json', async (err, data) => {
                if (err) throw err;
                datasource = JSON.parse(data);
                connection = mysql.createConnection({
                    host: datasource.db.host,
                    user: datasource.db.user,
                    password: datasource.db.password,
                    database: datasource.db.database
                });

                connection.connect();
                connection.query(`SELECT * FROM dblufussa.user WHERE password="${dataUser.pass}";`, async function (error, results, fields) {
                    if (error) throw error;
                    let data = await results;
                    if (data.length == 0) {
                        hash = bcrypt.hashSync(dataUser.pass, salt);
                    } else {
                        hash = dataUser.pass;
                    }

                    connection.query(`CALL dblufussa.PatchUser(${dataUser.id}, '${dataUser.user}', '${hash}', '${dataUser.mail}');`, async function (error, results, fields) {
                        if (error) throw error;
                        let data = await results;
                        if (data.affectedRows == 1) {
                            aviso[0] = {
                                id: dataUser.id,
                                username: dataUser.user,
                                password: hash,
                                email: dataUser.mail
                            }
                            connection.end();
                            eventEmitter.emit('patchData');
                        }
                    });
                });

            });

            var PathUser = function () {
                res.send(aviso);
                cb(aviso);
                eventEmitter.removeAllListeners();
            }
            eventEmitter.on('patchData', PathUser);
        } else {
            cb([]);
            eventEmitter.removeAllListeners();
        }
    }

    Getuser.remoteMethod('PatchDataUser', {
        http: { path: '/PatchDataUser', verb: 'patch' },
        accepts: [
            { arg: 'dataUser', type: 'object', http: { source: 'body' } },
            { arg: 'res', type: 'object', http: { source: 'res' } }
        ],
        returns: { root: true, type: 'array' }
    });
};
