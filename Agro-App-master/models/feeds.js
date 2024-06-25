const mongoose = require('mongoose');

const feedSchema = new mongoose.Schema({
    feed_img: {type:String},
    feed_name: { type: String, required: true },
    feed_description: { type: String, required: true },
    feed_source_url: { type: String, required: true },
    created_at: { type: Date, default: Date.now }
});

const feed_module = mongoose.model('feeds', feedSchema);
module.exports = feed_module;