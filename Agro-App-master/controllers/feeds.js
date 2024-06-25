var express = require('express');
var router = express.Router();  
const Feed = require('../models/feeds');
const fs = require('fs');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const path = require('path');
const auth = require('./auth');
var isLoggedIn = require('../controllers/adminLogin');



// Use fileUpload middleware to upload files
router.use(fileUpload());
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));




router.get('/',isLoggedIn,async function (req, res) {
    try {
    const feeds = await Feed.find({});
    feeds.forEach(feed => {
        var created_at = new Date(feed.created_at).toLocaleDateString('en-GB',{ day: '2-digit', month: '2-digit', year: 'numeric' }).toString();
        feed.screated_at = created_at;
    });
    res.render('feeds', { feeds: feeds });
    }
    catch (error) {
        res.status(500).json({ message: "Error occurred while fetching feeds", error: error.message });
    }

});

router.get('/getFeeds',auth, async (req, res) => {
    try {
        const feeds = await Feed.find({});
        res.status(200).json({ message: "Feeds fetched successfully", data: feeds });
    } catch (error) {
        res.status(500).json({ message: "Error occurred while fetching feeds", error: error.message });
    }
});


// Route to delete a feed
router.delete('/deleteFeed/:id', async (req, res) => {
    try {
        const deletedFeed = await Feed.findByIdAndDelete(req.params.id);
        if (!deletedFeed) {
            return res.status(404).json({ message: "Feed not found" });
        }
        res.status(200).json({ message: "Feed deleted successfully", data: deletedFeed });
    } catch (error) {
        res.status(500).json({ message: "Error occurred while deleting feed", error: error.message });
    }
});





module.exports = router;