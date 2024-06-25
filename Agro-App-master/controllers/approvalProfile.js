var express = require('express');
var router = express.Router();
var User = require('../models/user');
var Subsidy = require('../models/scheme');
var isLoggedIn = require('../controllers/adminLogin');





router.get('/:id',isLoggedIn,async function (req, res) {

    try{
        var id = req.params.id;
        var user = await User.findOne({user_email: id});
        var subsidy_applied = user.user_applied_schemes;
        var total_subsidies_applied = user.user_applied_schemes.length;
        var total_subsidies_approved = user.user_applied_schemes.filter(scheme => scheme.status === 'Approved').length;
        var total_subsidies_rejected = user.user_applied_schemes.filter(scheme => scheme.status === 'Rejected').length;
        var total_subsidies_pending = user.user_applied_schemes.filter(scheme => scheme.status === 'Under Review').length;
        if(user){

            res.render('approvalProfile',{user: user, total_subsidies_applied: total_subsidies_applied, total_subsidies_approved: total_subsidies_approved, total_subsidies_rejected: total_subsidies_rejected, total_subsidies_pending: total_subsidies_pending, applied: subsidy_applied});
        }
        else{
            res.status(404).json({message: "User not found"});
        }
    

    }
    catch(e){
        res.status(500).json({message: e.message});
        console.log(e);
    }
   
});




module.exports = router;