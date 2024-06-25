var express = require('express');
var router = express.Router();
var User = require('../models/user');
var Subsidy = require('../models/scheme');
const Contact = require('../models/contact');
var isLoggedIn = require('../controllers/adminLogin');





router.get('/', isLoggedIn,async function (req, res) {
    try {
    
        var data = await Subsidy.find({});
        var data1 = await User.find({});
        var data2 = await Contact.find({});
        var totalSubsidy = 0;
        var totalUsers = 0;
        var totalunderReview = 0;
        var totalApproved = 0;
        var totalRejected = 0;
        


        totalSubsidy = data.length;
        totalUsers = data1.length;

        data.forEach(scheme => {
            scheme.applied_users.forEach(user => {
               
                if (user.status == "Under Review") {
                    totalunderReview += 1;
                }
                else if (user.status == "Approved") {
                    totalApproved += 1;
                }
                else if (user.status == "Rejected") {
                    totalRejected += 1;
                }
            });
        });

        res.render('dashboard', { totalSubsidy: totalSubsidy, totalUsers: totalUsers, totalunderReview: totalunderReview, totalApproved: totalApproved, totalRejected: totalRejected, totalContacts: data2.length,});


        return res.render('dashboard');
    }
    catch (error) {
        res.status(500).json({ message: "Error occurred while fetching dashboard", error: error.message });
    }
});




module.exports = router;