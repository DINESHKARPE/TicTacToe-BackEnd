let express = require('express');
let router = express.Router();
let dataAccess = require("./dataAccess");



/**
 *  Store User in database
 */
router.post('/',function(req,res,next){
    dataAccess.addUser(req.body,function (callback) {
        res.json(callback);
    })
});
/**
 * fetch all live user with there room number
 */
router.get('/',function(req,res,next){
    dataAccess.fetchLiveUser(function (callback) {
        res.json(callback);
    })
});
router.post('/updatelivestatus',function(req,res,next){
    dataAccess.updatelivestatus(function (callback) {
        res.json(callback);
    })
});
module.exports = router;
