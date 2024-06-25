var express = require('express');
var router = express.Router();
var User = require('../models/user');
var isLoggedIn = require('../controllers/adminLogin');





router.get('/', isLoggedIn,function (req, res) {
    res.render('profile');
});
 
router.get('/search/:id',async function (req, res) {
    try{
        var id = req.params.id;
        var user = await User.findOne({user_email: id});
        var subsidy_applied = user.user_applied_schemes;
        var total_subsidies_applied = user.user_applied_schemes.length;
        var total_subsidies_approved = user.user_applied_schemes.filter(scheme => scheme.status === 'Approved').length;
        var total_subsidies_rejected = user.user_applied_schemes.filter(scheme => scheme.status === 'Rejected').length;
        var total_subsidies_pending = user.user_applied_schemes.filter(scheme => scheme.status === 'Under Review').length;
        if(user){

            res.status(200).json({user: user, total_subsidies_applied: total_subsidies_applied, total_subsidies_approved: total_subsidies_approved, total_subsidies_rejected: total_subsidies_rejected, total_subsidies_pending: total_subsidies_pending, applied: subsidy_applied});
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

router.post('/approvalProfile', async function (req, res) {
    try{
        var id = req.body.user_email;
        var user = await User.findOne({user_email: id});
        var total_subsidies_applied = user.user_applied_schemes.length;
        var total_subsidies_approved = user.user_applied_schemes.filter(scheme => scheme.status === 'Approved').length;
        var total_subsidies_rejected = user.user_applied_schemes.filter(scheme => scheme.status === 'Rejected').length;
        var total_subsidies_pending = user.user_applied_schemes.filter(scheme => scheme.status === 'Under Review').length;
        if(user){

            res.status(200).json({user: user, total_subsidies_applied: total_subsidies_applied, total_subsidies_approved: total_subsidies_approved, total_subsidies_rejected: total_subsidies_rejected, total_subsidies_pending: total_subsidies_pending});
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