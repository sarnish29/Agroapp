const mongoose = require('mongoose');

const subsidySchema = new mongoose.Schema({
    scheme_id:{type: String, required: true, unique: true},
    scheme_name: { type: String, required: true },
    scheme_category: { type: String, required: true}, 
    scheme_description: { type: String, required: true },
    last_date: { type: Date, default: Date.now},
    applied_users:[
        {
            user_name: { type: String },
            user_email: { type: String },
            user_mobile: { type: String },
            status: { type: String, default: "Under Review" }, 
            comment: { type: String, default: "No Comment" },
            created_at: { type: Date, default: Date.now }
        }
    ],
    created_at: { type: Date, default: Date.now }
});

const subsidy_module = mongoose.model('schemes', subsidySchema);
module.exports = subsidy_module;