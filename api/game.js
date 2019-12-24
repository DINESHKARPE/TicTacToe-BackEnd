let express = require('express');
let router = express.Router();
let dataAccess = require("./dataAccess");



/**
 *  Store User in database
 */
router.post('/invite',function(req,res,next){
    dataAccess.inviteUser(req.body,function (callback) {
        res.json(callback);
    })
});
router.post('/join',function(req,res,next){
    dataAccess.inviteAccepted(req.body,function (callback) {
        res.json(callback);
    })
});
router.get('/getfirsttmove',function(req,res,next){
    dataAccess.getfirstMove(req.query.gameid,function (callback) {
        res.json(callback);
    })
});

router.post('/move',function(req,res,next){
    dataAccess.movetic(req.body,function (callback) {
        res.json(callback);
    })
});

module.exports = router;
