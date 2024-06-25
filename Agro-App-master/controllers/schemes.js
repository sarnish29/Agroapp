var express = require('express');
var router = express.Router();
var Subsidy = require('../models/scheme');
const { DateTime } = require('luxon');
var jwt = require('jsonwebtoken');
const auth = require('./auth');
var User = require('../models/user');
var isLoggedIn = require('../controllers/adminLogin');




router.get('/',isLoggedIn,async (req, res) => {
    var schemeData = await Subsidy.find({}).sort({ created_at: -1 });
    schemeData.forEach(scheme => {
        scheme.approved_count = scheme.applied_users.filter(user => user.status === 'Approved').length;
        scheme.rejected_count = scheme.applied_users.filter(user => user.status === 'Rejected').length;
        scheme.pending_count = scheme.applied_users.filter(user => user.status === 'Under Review').length;
        scheme.total_count = scheme.applied_users.length;
        var last_date = new Date(scheme.last_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).toString();
        var created_at = new Date(scheme.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).toString();
        scheme.slast_date = last_date;
        scheme.screated_at = created_at;



    });

    res.render('schemes', { schemes: schemeData });
});

router.get('/tracker', auth, async (req, res) => {
   try{
    console.log(req.user);
    var user = await User.findOne({ _id: req.user });
    var schemes = user.user_applied_schemes;
    return res.status(200).json({ message: "Schemes fetched successfully", data: schemes });
}
    catch(error){
         return res.status(500).json({ message: "Error Occured While Fetching Schemes", error: error.message });
    }
    
});

router.get('/getScheme', auth, async function (req, res) {
    // Fetch all schemes from the database from latest to oldest
    try {
        var schemeData = await Subsidy.find({}).sort({ created_at: -1 });
        schemeData.forEach(scheme => {
            scheme.approved_count = scheme.applied_users.filter(user => user.status === 'Approved').length;
            scheme.rejected_count = scheme.applied_users.filter(user => user.status === 'Rejected').length;
            scheme.pending_count = scheme.applied_users.filter(user => user.status === 'Under Review').length;
            scheme.total_count = scheme.applied_users.length;
            var last_date = new Date(scheme.last_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).toString();
            var created_at = new Date(scheme.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).toString();
            scheme.slast_date = last_date;
            scheme.screated_at = created_at;

        });


        res.status(200).json({ message: "Schemes fetched successfully", data: schemeData });
    }
    catch (error) {
        res.status(500).json({ message: "Error Occured While Fetching Schemes", error: error.message });
    }


});



router.post('/applyScheme', auth, async (req, res) => {
    try {
        console.log(req.body);
        const schemeId = req.body.schema_id;
        console.log(schemeId);
        const userId = req.user;
        const appliedScheme = await Subsidy.findOne({scheme_id: schemeId });
        const user = await User.findOne({ _id: req.user});
        if (!appliedScheme || !user) {
            return res.status(404).json({ message: "Scheme not found" });
        }
        var flag = user.user_applied_schemes.find(scheme => scheme.scheme_id === schemeId);
        var flag2 = appliedScheme.applied_users.find(aUser => aUser.user_email === user.user_email);
        if (flag) {
            return res.status(400).json({ message: "You have already applied for this scheme" });
        }
        if (flag2) {
            return res.status(400).json({ message: "You have already applied for this scheme" });
        }
        user.user_applied_schemes.push({ 
            scheme_id: appliedScheme.scheme_id, 
            scheme_name: appliedScheme.scheme_name, 
            scheme_category: appliedScheme.scheme_category, 
            status: "Under Review", 
            comment: "No Comment" 
        });
        appliedScheme.applied_users.push({ 
            user_name: user.user_name, 
            user_email: user.user_email, 
            user_mobile: user.user_mobile, 
            status: "Under Review", 
            comment: "No Comment" 
        });



        await user.save();
        await appliedScheme.save();
        res.status(200).json({ message: "Scheme applied successfully", data: appliedScheme });

    }
    catch (error) {
        res.status(500).json({ message: "Error Occured While Applying Scheme", error: error.message });
    }
});





// Function to add a new scheme
router.post('/addScheme', async (req, res) => {
    try {
        const newSchemeData = {
            scheme_id: req.body.scheme_id,
            scheme_name: req.body.scheme_name,
            scheme_category: req.body.scheme_category,
            scheme_description: req.body.scheme_description,
            last_date: req.body.last_date,
        };
        const newScheme = new Subsidy(newSchemeData);
        const savedScheme = await newScheme.save();
        try{
            //send a post reaquest to the server to send a notification to all users\
            var url = "https://localhost:8000/notify/sendNotification";
            var data = {
                message: "New Scheme Added: " + req.body.scheme_name
            };
            var options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                 rejectUnauthorized: false,
                body: JSON.stringify(data)
            };
            // Set NODE_TLS_REJECT_UNAUTHORIZED to 0 before making the request
            process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;
            fetch(url, options);

        }
        catch(error){
            console.log(error);
        }
        res.status(200).json({ message: "Scheme added successfully", data: savedScheme });
    } catch (error) {
        res.status(500).json({ message: "Error Occured While Adding Scheme", error: error.message });
    }
});

// Function to delete a scheme by scheme_id
router.delete('/deleteScheme/:schemeId', async (req, res) => {
    try {
        const schemeId = req.params.schemeId;
        const deletedScheme = await Subsidy.findOneAndDelete({ scheme_id: schemeId });
        const userSchemeDelete = await User.findOne({ "user_applied_schemes.scheme_id": schemeId });
        if (userSchemeDelete) {
            userSchemeDelete.user_applied_schemes = userSchemeDelete.user_applied_schemes.filter(scheme => scheme.scheme_id !== schemeId);
            await userSchemeDelete.save();
        }
        if (!deletedScheme) {
            return res.status(404).json({ message: "Scheme not found" });
        }
        res.status(200).json({ message: "Scheme deleted successfully", data: deletedScheme });
    } catch (error) {
        res.status(500).json({ message: "Error Occured While Deleting Scheme", error: error.message });
    }
});

// Function to edit a scheme by scheme_id
router.put('/editScheme/:schemeId', async (req, res) => {
    try {
        const schemeId = req.params.schemeId;
        const editedScheme = await Subsidy.findOne({ scheme_id: schemeId });
        if (!editedScheme) {
            return res.status(404).json({ message: "Scheme not found" });
        }
        editedScheme.scheme_name = req.body.scheme_name;
        editedScheme.scheme_category = req.body.scheme_category;
        editedScheme.scheme_description = req.body.scheme_description;
        editedScheme.last_date = req.body.last_date;
        await editedScheme.save();
        res.status(200).json({ message: "Scheme edited successfully", data: editedScheme });
    } catch (error) {
        res.status(500).json({ message: "Error Occurred in Editing Scheme", error: error.message });
    }
});



module.exports = router;