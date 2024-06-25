var express = require('express');
var router = express.Router();
const Contact = require('../models/contact');
var auth = require('./auth');
var isLoggedIn = require('../controllers/adminLogin');



router.get('/',isLoggedIn,async function (req, res) {
    try{

        var contact = await Contact.find({});
        contact.forEach(contact => {
            var created_at = new Date(contact.created_at).toLocaleDateString('en-GB',{ day: '2-digit', month: '2-digit', year: 'numeric' }).toString();
            contact.screated_at = created_at;
        });
        res.render('contacts', { contacts: contact });
    }
    catch(err){
        res.status(500).json({ message: "Error occurred while fetching contacts", error: error.message });
    }
});

// Function to get all contacts
router.get('/getContacts',auth ,async (req, res) => {
    try {
        const contacts = await Contact.find({});
        res.status(200).json({ message: "Contacts fetched successfully", data: contacts });
    } catch (error) {
        res.status(500).json({ message: "Error occurred while fetching contacts", error: error.message });
    }
});


// Route to delete a contact by ID
router.delete('/deleteContact/:id', async (req, res) => {
    try {
        // Finding the contact by ID and deleting it
        await Contact.findOneAndDelete({ contact_email: req.params.id });
        res.status(200).json({ message: 'Contact deleted successfully' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;