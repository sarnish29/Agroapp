const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
    contact_img: {type:String},
    contact_name: { type: String, required: true },
    contact_email: { type: String, required: true, unique: true}, 
    contact_mobile: { type: String, required: true },
    contact_organisation: { type: String, required: true },
    contact_locality: { type: String, required: true },
    contact_designation: { type: String, required: true },
    created_at: { type: Date, default: Date.now }
});

const contact_module = mongoose.model('contacts', contactSchema);
module.exports = contact_module;