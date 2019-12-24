let connection = require('../config/db');

String.prototype.replaceAt = function (index, replacement) {
    return this.substr(0, index) + replacement + this.substr(index + replacement.length);
}
/**
 * Store User with with status
 * @param user
 * @param callback
 */
exports.addUser = function addUser(user, callback) {
    connection.query("INSERT INTO user SET ?", user, function (error, results, fields) {
        if (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                callback({"status": "fail", "code": "U400", "message": "Username already exists"});
            } else {
                callback({"status": "fail", "code": "U400", "message": error.code});
            }
        } else {
            callback({"status": "success", "code": "U200", "message": "Join success fully"});
        }
    });
};
exports.updatelivestatus = function updatelivestatus(user, callback) {
    connection.query("INSERT INTO user SET ?", user, function (error, results, fields) {
        if (error) {
            callback({"status": "fail", "code": "U400", "message": error.code});
        } else {
            callback({"status": "success", "code": "U200", "message": "update  user status"});
        }
    });
};
/**
 * fetch live user from database
 * @param callback
 */
exports.fetchLiveUser = function fetchLiveUser(callback) {
    connection.query("SELECT *FROM user where livestatus = 1 ",function (error,result,fields) {
        if (error) {
            callback({ "status": "fail", "code": "U400"});
        } else if(result.length != 0){
            callback({ "status": "success", "code": "U200", "message": "Live Users","users":result});
        }else {
            callback({ "status": "success", "code": "U200", "message": "NO Live Users","users":[]});
        }
    });
}

/**
 * Take userData as parameter to update current user status
 * @param userData
 * @param callback
 */
exports.updateUser = function updateUser(userData, callback) {
    connection.query("UPDATE user SET livestatus = ? ,room = ? WHERE username = ? ;", [userData.livestatus, userData.room, userData.userName], function (error, result, fields) {
        if (error) {
            callback({"status": "fail", "code": "U400", "message": error.code});
        } else {
            callback({"status": "fail", "code": "U200", "message": "User Data Update"});
        }
    });
}
/**
 * Send Invitation  user nad generate first move and tic symbol
 * @param user
 * @param callback
 */
exports.inviteUser = function inviteUser(user, callback) {
    user.firstmove = Math.random() > 0.5 ? user.fromuser : user.touser;
    user.symbol = Math.random() > 0.5 ? "X" : "O";
    connection.query("INSERT INTO livegame SET ?", user, function (error, results, fields) {
        if (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                callback({"status": "fail", "code": "U400", "message": "User already in game"});
            } else {
                callback({"status": "fail", "code": "U400", "message": error.code});
            }
        } else {
            callback({
                "status": "success",
                "code": "U200",
                "message": "Game Invitation Send",
                "gamenumber": results.insertId,
                "touser":user.touser,
                "fromuser":user.fromuser

            });
        }
    });
};
/**
 * Invitation accept and change game mode to live
 * @param game
 * @param callback
 */
exports.inviteAccepted = function inviteAccepted(game, callback) {
    connection.query("UPDATE `livegame` SET gamemode = 1 WHERE id = ?", game.id, function (error, results, fields) {
        if (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                callback({"status": "fail", "code": "U400", "message": "User already in game"});
            } else {
                callback({"status": "fail", "code": "U400", "message": error.code});
            }
        } else {
            callback({"status": "success", "code": "U200", "message": "Invitation accept game started successfully"});
        }
    });
};
/**
 * Find  first move user to start first move
 * @param gameid
 * @param callback
 */
exports.getfirstMove = function getfirstMove(gameid, callback) {
    connection.query("SELECT firstmove,gamemode,symbol from livegame where id = ? ", gameid, function (error, results, fields) {
        if (error) {
            callback({"status": "fail", "code": "U400", "message": "Not Found game"});
        } else {
            callback({"status": "success", "code": "U200", "result": results});
        }
    });
};


/**
 * Game move take with gameid,userid,ticposition,and tic symbol
 * @param move
 * @param callback
 */
exports.movetic = function movetic(move, callback) {

    connection.query("SELECT * FROM gamemove where gameid = ? ", move.gameid, function (error, results, fields) {
        connection.query("SELECT firstmove,fromuser,touser FROM livegame where id = ? and gamemode = 1", move.gameid, function (errorlivegame, resultslivegame, fields) {
            if (results.length == 0) {
                if (resultslivegame[0].firstmove != move.userid) {
                    callback({"status": "fail", "code": "G400", "message": "Wrong Move"});
                }else {
                    var boardString = "---------";
                    var gameboard = {
                        gameid: move.gameid,
                        nextuser: resultslivegame[0].fromuser == move.userid ? resultslivegame[0].touser : resultslivegame[0].fromuser,
                        board: boardString.replaceAt(move.ticposition - 1, move.tic)
                    }
                    connection.query("INSERT INTO gamemove set ? ", gameboard, function (moveerror, moveresult, movefieds) {
                        callback({"status": "success", "code": "G200", "message": "Move place sucussfully "+move.tic});
                    });
                }

            } else {
                if(resultslivegame.length == 0){
                    callback({"status": "fail", "code": "U400", "message": "Game Already Over"});
                }
                else if (results[0].nextuser !== move.userid) {
                    callback({"status": "fail", "code": "G400", "message": "Wrong Move"});
                } else if (results[0].board[move.ticposition - 1] != "-") {
                    callback({"status": "fail", "code": "G400", "message": "Wrong Move"});
                } else {
                    var gameboard = {
                        gameid: move.gameid,
                        nextuser: resultslivegame[0].fromuser == move.userid ? resultslivegame[0].touser : resultslivegame[0].fromuser,
                        board: results[0].board.replaceAt(move.ticposition - 1, move.tic)
                    }
                    var winner = findWinner(gameboard.board);

                    connection.query("UPDATE  gamemove set ? where gameid = ?  ", [gameboard, move.gameid], function (moveerror, moveresult, movefieds) {
                        if(winner !=null){
                            connection.query("UPDATE  livegame set gamemode = 2, winner = ? where id = ?  ", [move.userid, move.gameid], function (updateerror, updateresult, updatefieds) {
                                callback({"status": "success", "code": "G200", "message": "Game is Over, and winner is "+winner });
                            });
                        }else {
                            if(move.ticposition === 9){
                                connection.query("UPDATE  livegame set gamemode = 2, winner = 'Game draw' where id = ?  ", [move.gameid], function (updateerror, updateresult, updatefieds) {
                                    callback({"status": "success", "code": "G200", "message": "Game draw no is winners"});
                                });

                            }else {
                                callback({"status": "success", "code": "G200", "message": "Move place sucussfully "+move.tic});
                            }

                        }

                    });
                }

            }
        });
    })
};

/**
 * Find winner from Board
 * @param board
 * @returns {null|*}
 */
function findWinner(board) {
    var newBoard = board.slice(0,3) + ' ' + board.slice(3,6) + ' ' + board.slice(6);
    if (/XXX|X...X...X|X....X....X|X..X..X/.test(newBoard)) {
        return "X";
    } else if (/OOO|O...O...O|O....O....O|O..O..O/.test(newBoard)) {
        return "O";
    } else {
        return null;
    }
    // if(board[0] === board[1] && board[0] === board [2]){
    //     return board[0];
    // }
    // if(board[3] === board[4] &&  board[4] === board [5]){
    //     return board[3];
    // }
    // if(board[6] === board[7] && board[7] == board [8]){
    //     return board[6];
    // }
    // if(board[0] === board[3] && board[3] == board [6]){
    //     return board[0];
    // }
    // if(board[1] === board[4] && board[4] == board [7]){
    //     return board[1];
    // }
    // if(board[2] === board[5] && board[5] == board [8]){
    //     return board[2];
    // }
    // if(board[0] === board[4] && board[4] == board [8]){
    //     return board[0];
    // }
    // if(board[2] === board[4] && board[4] ==  board [6]){
    //     return board[2];
    // }else {
    //     return null
    // }
}

