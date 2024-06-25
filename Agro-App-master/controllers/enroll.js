var express = require('express');
var router = express.Router();
var Subsidy = require('../models/scheme');
var User = require('../models/user');
var isLoggedIn = require('../controllers/adminLogin');
var axios = require('axios').default;
var https = require('https');





router.get('/:id',isLoggedIn,async function (req, res) {
    try{
        var id = req.params.id;
        var subsidy = await Subsidy.findOne({_id: id});
        if(subsidy){
            // console.log(subsidy);
           res.render('enroll', {subsidy: subsidy,applied_users: subsidy.applied_users});
        }
        else{
            res.status(404).json({message: "Subsidy not found"});
        }

    }
    catch(e){
        res.status(500).json({message: e.message});
        console.log(e);
    }

   
});

router.post('/approve',async function (req, res) {
    try{
        const {scheme_id, user_email,comment} = req.body;
        // console.log(req.body)
        var subsidy = await Subsidy.findOne({scheme_id: scheme_id});
        var user = await User.findOne({user_email: user_email});
        if(subsidy){
            if(user){
                var applied_users = subsidy.applied_users;
                var user_applied_schemes = user.user_applied_schemes;
                var user_index = user_applied_schemes.findIndex(x => x.scheme_id == scheme_id);
                var index = applied_users.findIndex(x => x.user_email == user_email);
                
                if(index != -1){
                    applied_users[index].status = "Approved";
                    applied_users[index].comment = comment;
                    subsidy.applied_users = applied_users;
                    user_applied_schemes[user_index].status = "Approved";
                    user_applied_schemes[user_index].comment = comment;
                    user.user_applied_schemes = user_applied_schemes;
                    await user.save();
                    await subsidy.save();
                    var sendMail = await axios.post('https://localhost:8000/schemeUpdate', {
                        user_email: user_email,
                        user_name: user.user_name,
                        scheme_name: subsidy.scheme_name,
                        scheme_id: subsidy.scheme_id,
                        comment: comment,
                        status: "Approved"
                    },{
                        httpsAgent: new https.Agent({ rejectUnauthorized: false }) // Ignore SSL certificate verification
                    }).then((response) => {
                        if(response.data.message == "Mail sent"){
                            console.log("Mail sent");
                        };
                        // console.log(response);
                    }).catch((error) => {
                        console.log(error);
                    });
                    res.status(200).json({message: "User approved"});
                }
                else{
                    res.status(404).json({message: "User not found"});
                }
            }
            else{
                res.status(404).json({message: "User not found"});
            }
        }
        else{
            res.status(404).json({message: "Subsidy not found"});
        }
    }
    catch(e){
        res.status(500).json({message: e.message});
        console.log(e);
    }
});


router.post('/reject',async function (req, res) {

    try{
        const {scheme_id, user_email,comment} = req.body;
        var subsidy = await Subsidy.findOne({scheme_id: scheme_id});
        var user = await User.findOne({user_email: user_email});
        if(subsidy){
            if(user){
                var applied_users = subsidy.applied_users;
                var user_applied_schemes = user.user_applied_schemes;
                var user_index = user_applied_schemes.findIndex(x => x.scheme_id == scheme_id);
                var index = applied_users.findIndex(x => x.user_email == user_email);
                
                if(index != -1){
                    applied_users[index].status = "Rejected";
                    applied_users[index].comment = comment;
                    subsidy.applied_users = applied_users;
                    user_applied_schemes[user_index].status = "Rejected";
                    user_applied_schemes[user_index].comment = comment;
                    user.user_applied_schemes = user_applied_schemes;
                    await user.save();
                    await subsidy.save();
                    var sendMail = await axios.post('https://localhost:8000/schemeUpdate', {
                        user_email: user_email,
                        user_name: user.user_name,
                        scheme_name: subsidy.scheme_name,
                        scheme_id: subsidy.scheme_id,
                        comment: comment,
                        status: "Rejected"
                    },{
                        httpsAgent: new https.Agent({ rejectUnauthorized: false }) // Ignore SSL certificate verification
                    }).then((response) => {
                        console.log(response);
                    }).catch((error) => {
                        console.log(error);
                    });
                    res.status(200).json({message: "User rejected"});
                }
                else{
                    res.status(404).json({message: "User not found"});
                }
            }
            else{
                res.status(404).json({message: "User not found"});
            }
        }
        else{
            res.status(404).json({message: "Subsidy not found"});
        }
    }
    catch(e){
        res.status(500).json({message: e.message});
        console.log(e);
    }
});


router.post('/comment',async function (req, res) {
    try{
        const {scheme_id, user_email,comment} = req.body;
        var subsidy = await Subsidy.findOne({scheme_id: scheme_id});
        var user = await User.findOne({user_email: user_email});
        if(subsidy){
            if(user){
                var applied_users = subsidy.applied_users;
                var user_applied_schemes = user.user_applied_schemes;
                var user_index = user_applied_schemes.findIndex(x => x.scheme_id == scheme_id);
                var index = applied_users.findIndex(x => x.user_email == user_email);
                
                if(index != -1){
                    applied_users[index].comment = comment;
                    subsidy.applied_users = applied_users;
                    user_applied_schemes[user_index].comment = comment;
                    user.user_applied_schemes = user_applied_schemes;
                    await user.save();
                    await subsidy.save();
                    var sendMail = await axios.post('https://localhost:8000/schemeUpdate', {
                        user_email: user_email,
                        user_name: user.user_name,
                        scheme_name: subsidy.scheme_name,
                        scheme_id: subsidy.scheme_id,
                        comment: comment,
                        status: "Under Review"
                    }, {
                        httpsAgent: new https.Agent({ rejectUnauthorized: false }) // Ignore SSL certificate verification
                    }).then((response) => {
                        if (response.data.message == "Mail sent") {
                            console.log("Mail sent");
                        }
                    }).catch((error) => {
                        console.log(error);
                    });
                    res.status(200).json({message: "User rejected"});
                }
                else{
                    res.status(404).json({message: "User not found"});
                }
            }
            else{
                res.status(404).json({message: "User not found"});
            }
        }
        else{
            res.status(404).json({message: "Subsidy not found"});
        }
    }
    catch(e){
        res.status(500).json({message: e.message});
        console.log(e);
    }
});


module.exports = router;