const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    user_img: {type:String},
    user_name: { type: String, required: true },
    user_email: { type: String, required: true, unique: true}, 
    user_password: { type: String, required: true },
    user_type: { type: String, default: "user"},
    user_mobile: { type: String, required: true },
    user_gender: { type: String, required: true },
    user_aadhaar: { type: String},
    user_pan: { type: String },
    user_status: { type: String, default: "deactive" },
    user_applied_schemes:[
        {
            scheme_id: { type: String, required: true },
            scheme_name: { type: String },
            scheme_category: { type: String },
            status: { type: String, default: "Under Review" },
            comment: { type: String, default: "No Comment" },
            created_at: { type: Date, default: Date.now }
        }
    ],
    confirmationToken: { type: String },
    resetPasswordToken: { type: String },
    created_at: { type: Date, default: Date.now }
});

const user_module = mongoose.model('user', userSchema);
module.exports = user_module;