var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var crypto = require('crypto');
var nodemailer = require('nodemailer');
// var bcrypt = require('bcrypt');
var User = require('./models/user');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
mongoose.connect('mongodb+srv://jayeshcs20:jayeshcs20@farmeasydb.jpxxhts.mongodb.net/');
mongoose.connection.on('connected', () => {
    console.log('Connected to MongoDB');
});
mongoose.connection.on('error', (err) => {
    console.error('Error in connection to MongoDB:', err);
});

app.post('/register/v2', async (req, res) => {
    try {
        console.log("Request body: ", req.body);
        console.log("Request files: ", req.files);
        
        if (!req.files || !req.files.user_aadhaar || !req.files.user_pan || !req.files.user_photo) {
            return res.status(400).json({ message: 'Upload a Mandatory files uploaded' });
        }
        console.log("Request body: ", req.body);
        const { user_name, user_email, user_password, user_mobile,user_gender } = req.body;
       
        // const user_type = "student";
        const token = crypto.randomBytes(20).toString('hex');
        // const user_type = "student";
        const transporter = nodemailer.createTransport({
            service: 'Gmail', // Replace with your email service provider
            // auth: {
            //     user: 'jayesh007va@gmail.com', // Replace with your email address
            //     pass: 'zrxx fczv qote gtqp' // Replace with your email password or app password if using Gmail
            // }
            auth: {
                user: 'jayesh007va@gmail.com', // Replace with your email address
                pass: 'rtws hlck rszj qzdv' // Replace with your email password or app password if using Gmail
            }
        });

        // Check if the email already exists
        const existingUser = await User.findOne({ user_email });
        if (existingUser && existingUser.user_status == "active") {
            return res.status(400).json({ message: 'Email already registered', status: 0 });
        }
        else if (existingUser && existingUser.user_status == "deactive") {
            existingUser.user_name = user_name;
            existingUser.user_password = user_password;
            existingUser.user_mobile = user_mobile;
            existingUser.user_gender = user_gender;

            // Save the user to the database
            existingUser.confirmationToken = token;

            // Email content with confirmation link
            const confirmationLink = `https://localhost:4000/confirm/${token}`; // Replace with your confirmation route
            const mailOptions = {
                from: 'jayesh007va@gmail.com', // Sender address
                to: user_email, // Receiver's email
                subject: 'Registration Confirmation', // Email subject
                text: `Hello ${user_name},\n\nPlease click on the following link to confirm your registration:\n${confirmationLink}`, // Email body
            };

            // Send the email
            transporter.sendMail(mailOptions, async (error, info) => {
                if (error) {
                    console.error('Error sending email:', error);
                    // Handle error in sending email
                    return res.status(500).json({ message: 'Error sending confirmation email', status: 0 });
                }
                console.log('Email sent:', info.response);
                await existingUser.save();
                // Email sent successfully
                res.status(201).json({ message: 'User registered successfully. ReConfirmation email sent.', status: 1, user: existingUser });
            });

        }
        else {
            // Create a new user
            const newUser = new User({
                user_name,
                user_email,
                user_password,
                user_mobile:user_mobile,
                user_gender
            });

            // Save the user to the database
            newUser.confirmationToken = token;




            // Email content with confirmation link
            const confirmationLink = `https://localhost:4000/confirm/${token}`; // Replace with your confirmation route
            const mailOptions = {
                from: 'jayesh007va@gmail.com', // Sender address
                to: user_email, // Receiver's email
                subject: 'Registration Confirmation', // Email subject
                text: `Hello ${user_name},\n\nPlease click on the following link to confirm your registration:\n${confirmationLink}`, // Email body
            };

            // Send the email
            transporter.sendMail(mailOptions, async (error, info) => {
                if (error) {
                    console.error('Error sending email:', error);
                    // Handle error in sending email
                    return res.status(500).json({ message: 'Error sending confirmation email', status: 0 });
                }
                console.log('Email sent:', info.response);
                await newUser.save();
                // Email sent successfully
                res.status(201).json({ message: 'User registered successfully. Confirmation email sent.', status: 1, user: newUser });
            });

            // Hash the password
        }

    } catch (error) {
        console.error("Error in user registration: ", error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


app.listen(4000, () => {
    console.log('Server started on http://localhost:4000');
});




