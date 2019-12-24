var mysql = require('mysql');
var pool      =    mysql.createPool({
    connectionLimit : 100, //important
    host     : 'localhost',
    user     : 'root',
    password : '',
    database : 'tictactoe',
    debug    :  false,
    multipleStatements: true
});


module.exports = pool;
