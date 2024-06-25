var express = require('express');
const session = require('express-session');
var app = express();
var fileUpload = require('express-fileupload');
var path = require('path');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var jwt = require('jsonwebtoken');
const fs = require('fs'); // To read SSL certificate and key
const https = require('https'); // Include the 'https' module
const nodemailer = require('nodemailer');
const crypto = require('crypto');
var cookieParser = require('cookie-parser');
var cors = require('cors');
var dashboard = require('./controllers/dashboard');
var contact = require('./controllers/contact');
var schemes = require('./controllers/schemes');
var feeds = require('./controllers/feeds');
var profile = require('./controllers/profile');
var enroll = require('./controllers/enroll');
var User = require('./models/user');
var Feed = require('./models/feeds');
var Contact = require('./models/contact');
var approvalProfile = require('./controllers/approvalProfile');
var cors = require('cors');
var auth = require('./controllers/auth');
var isLoggedIn = require('./controllers/adminLogin');
var notify = require('./config/notifyRoutes');
const port = 8000;

app.use(fileUpload());

app.use(cors());

app.set('view engine', 'ejs');
app.use("/public", express.static(__dirname + "/public"))
app.use("/uploads", express.static(__dirname + "/uploads"))
app.use("/profile_uploads", express.static(__dirname + "/profile_uploads"))

mongoose.connect('mongodb+srv://jayeshcs20:jayeshcs20@farmeasydb.jpxxhts.mongodb.net/');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', function () {
    console.log("Connected to MongoDB");
});

app.use(cookieParser());

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 8 * 60 * 60 * 1000,
        httpOnly: true,
        secure: true,
        sameSite: 'none'
    },
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const privateKey = fs.readFileSync('/etc/letsencrypt/live/code.jayworks.tech/privkey.pem', 'utf8');
const certificate = fs.readFileSync('/etc/letsencrypt/live/code.jayworks.tech/fullchain.pem', 'utf8');

// const privateKey = fs.readFileSync('./jayworks.tech.key', 'utf8');
// const certificate = fs.readFileSync('./jayworks.tech.crt', 'utf8');
const credentials = { key: privateKey, cert: certificate };

app.use('/dashboard', dashboard);
app.use('/contacts', contact);
app.use('/schemes', schemes);
app.use('/feeds', feeds);
app.use('/profile', profile);
app.use('/enroll', enroll);
app.use('/approvalProfile', approvalProfile);
app.use('/notify', notify);



app.get('/', function (req, res) {
    res.render('login');
});

app.post('/register/v2', async (req, res) => {
    try {
        const { user_name, user_email, user_password, user_mobile, user_gender } = req.body;
        console.log(req.body);
        console.log(req.files);
        if (!req.files || !req.files.user_aadhaar || !req.files.user_pan || !req.files.user_photo) {
            return res.status(400).json({ message: 'Upload a Mandatory files uploaded' });
        }

        const imgFile = req.files.user_photo;
        const aadharFile = req.files.user_aadhaar;
        const panFile = req.files.user_pan;




        // Get file extension
        const imgfileExt = path.extname(imgFile.name);
        if (!['.png', '.jpg', '.jpeg', '.PNG', '.JPG', '.JPEG', '.pdf', '.PDF'].includes(imgfileExt)) {
            return res.status(600).json({ message: 'Only image and pdf files are allowed' });
        }

        const aadharFileExt = path.extname(aadharFile.name);
        if (!['.png', '.jpg', '.jpeg', '.PNG', '.JPG', '.JPEG', '.pdf', '.PDF'].includes(aadharFileExt)) {
            return res.status(600).json({ message: 'Only image and pdf files are allowed' });
        }
        const panFileExt = path.extname(panFile.name);
        if (!['.png', '.jpg', '.jpeg', '.PNG', '.JPG', '.JPEG', '.pdf', '.PDF'].includes(panFileExt)) {
            return res.status(600).json({ message: 'Only image and pdf files are allowed' });
        }

        const user_aadhaar = `./profile_uploads/${user_email}${Date.now()}_aadhar${aadharFileExt}`;
        const user_pan = `./profile_uploads/${user_email}${Date.now()}_pan${panFileExt}`;
        const user_photo = `./profile_uploads/${user_email}${Date.now()}_photo${imgfileExt}`;

        await imgFile.mv(user_photo);
        await aadharFile.mv(user_aadhaar);
        await panFile.mv(user_pan);


        // Generate random bytes
        const randomBytes = crypto.randomBytes(2); // 2 bytes are enough for a six-digit number

        // Convert random bytes to hexadecimal representation
        const hexString = randomBytes.toString('hex');

        // Convert hexadecimal string to a number and ensure it's a six-digit number
        const token = parseInt(hexString, 16) % 900000 + 100000; // Ensures a six-digit number

        // console.log(token);
        // const user_type = "student";
        const transporter = nodemailer.createTransport({
            service: 'Gmail', // Replace with your email service provider
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
            existingUser.user_img = user_photo;
            existingUser.user_aadhaar = user_aadhaar;
            existingUser.user_pan = user_pan;

            // Save the user to the database
            existingUser.confirmationToken = token;

            // Email content with confirmation link
            const confirmationLink = `https://localhost:4000/confirm/${token}`; // Replace with your confirmation route
            const mailOptions = {
                from: 'jayesh007va@gmail.com', // Sender address
                to: user_email, // Receiver's email
                subject: 'Registration Confirmation', // Email subject
                html: `<html>
                <head>
                    <style>
                        h1 { color: #007bff; }
                        p { font-size: 16px; }
                        .otp { font-size: 24px; color: #dc3545; }
                    </style>
                </head>
                <body>
                    <h2>Hello ${user_name},</h2>
                    <p>Thank you for registering with us!</p>
                    <div>
                        <p>Your six digit OTP is:</p>
                        <h1 class="otp">${token}</h1>
                    </div>
                </body>
            </html>`, // Email body
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
                res.status(200).json({ message: 'User registered successfully. ReConfirmation email sent.', status: 1, user: existingUser });
            });

        }
        else {
            // Create a new user
            const newUser = new User({
                user_name,
                user_email,
                user_password,
                user_mobile: user_mobile,
                user_gender,
                user_img: user_photo,
                user_aadhaar,
                user_pan
            });

            // Save the user to the database
            newUser.confirmationToken = token;




            // Email content with confirmation link
            const confirmationLink = `https://localhost:4000/confirm/${token}`; // Replace with your confirmation route
            const mailOptions = {
                from: 'jayesh007va@gmail.com', // Sender address
                to: user_email, // Receiver's email
                subject: 'Registration Confirmation', // Email subject
                html: `<html>
                <head>
                    <style>
                        h1 { color: #007bff; }
                        p { font-size: 16px; }
                        .otp { font-size: 24px; color: #dc3545; }
                    </style>
                </head>
                <body>
                    <h2>Hello ${user_name},</h2>
                    <p>Thank you for registering with us!</p>
                    <div>
                        <p>Your six digit OTP is:</p>
                        <h1 class="otp">${token}</h1>
                    </div>
                </body>
            </html>`, // Email body with HTML formatting
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
                res.status(200).json({ message: 'User registered successfully. Confirmation email sent.', status: 1, user: newUser });
            });

            // Hash the password
        }




        // const transporter = nodemailer.createTransport({
        //     service: 'Gmail',
        //         user: 'jayesh007va@gmail.com', 
        //         pass: 'rtws hlck rszj qzdv'
        //         //'fbml xlep wjrz csgd' 
        //         //rtws hlck rszj qzdv

        // });

        // // Check if the email already exists
        // const existingUser = await User.findOne({ user_email });
        // if (existingUser) {
        //     return res.status(400).json({ message: 'Email already registered', status: 0 });
        // }
        // else {
        //     // Create a new user
        //     const newUser = new User({
        //         user_img: user_photo,
        //         user_aadhaar,
        //         user_pan,
        //         user_name,
        //         user_email,
        //         user_password,
        //         user_mobile,
        //         user_gender
        //     });

        //     newUser.confirmationToken = token;

        //     // Email content with confirmation link
        //     const confirmationLink = `http://localhost:8000/confirm/${token}`; // Replace with your confirmation route
        //     const mailOptions = {
        //         from: 'jayesh007va@gmail.com', // Sender address
        //         to: user_email, // Receiver's email
        //         subject: 'Registration Confirmation', // Email subject
        //         text: `Hello ${user_name},\n\nPlease click on the following link to confirm your registration:\n${confirmationLink}`, // Email body
        //     };

        //     // Send the email
        //     transporter.sendMail(mailOptions, async (error, info) => {
        //         if (error) {
        //             console.error('Error sending email:', error);
        //             // Handle error in sending email
        //             return res.status(500).json({ message: 'Error sending confirmation email', status: 0 });
        //         }
        //         console.log('Email sent:', info.response);
        //         await newUser.save();
        //         // Email sent successfully
        //         res.status(201).json({ message: 'User registered successfully. Confirmation email sent.', status: 1, user: newUser });
        //     });

        //     // Hash the password
        // }

    } catch (error) {
        console.error("Error in user registration: ", error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get('/confirm/:token', async (req, res) => {
    try {
        const token = req.params.token;

        // Find the user by the confirmation token
        const user = await User.findOne({ confirmationToken: token });

        if (!user) {
            // Handle invalid or expired token
            return res.status(400).json({ message: 'Invalid or expired confirmation link', status: 0 });
        }

        // Update the user's status to confirmed (or perform any necessary actions)
        user.user_status = 'active';
        user.confirmationToken = null; // Optionally clear the token after confirmation
        await user.save();

        // Redirect the user to a success page or send a confirmation message
        res.status(200).json({ message: 'User registration confirmed successfully', status: 1 });

    } catch (error) {
        console.error("Error confirming user registration: ", error);
        res.status(500).json({ message: 'Internal Server Error', status: 0 });
    }
});

app.get('/verify/:token', async (req, res) => {
    try {
        const token = req.params.token;

        // Find the user by the confirmation token
        const user = await User.findOne({ confirmationToken: token });

        if (!user) {
            // Handle invalid or expired token
            return res.status(400).json({ message: 'Invalid or expired confirmation link', status: 0 });
        }

        // Update the user's status to confirmed (or perform any necessary actions)
        user.user_status = 'active';
        user.confirmationToken = null; // Optionally clear the token after confirmation
        await user.save();

        // Redirect the user to a success page or send a confirmation message
        res.status(200).json({ message: 'User registration confirmed successfully', status: 1 });

    } catch (error) {
        console.error("Error confirming user registration: ", error);
        res.status(500).json({ message: 'Internal Server Error', status: 0 });
    }
});

app.get('/login', async function (req, res) {
    res.render('login');
});



app.post('/login', async (req, res) => {
    try {
        const { user_email, user_password } = req.body;
        var applied = 0;
        var approved = 0;
        var rejected = 0;
        var underReview = 0;
        const user = await User.findOne({ user_email });
        // console.log(user);

        if (!user) {
            return res.status(401).json({ message: 'Authentication failed', status: 0 });
        }


        const passwordMatch = user_password === user.user_password;

        if (!passwordMatch) {
            return res.status(401).json({ message: 'Authentication failed', status: 0 });
        }

        if (user.user_status === 'deactive') {
            return res.status(401).json({ message: 'Authentication failed contact Administrator', status: 2 });
        }
        if (user.user_status === 'disabled') {
            return res.status(401).json({ message: 'Verify your Email Through Confirmation Link', status: 3 });
        }
        applied = user.user_applied_schemes.length;
        user.user_applied_schemes.forEach(element => {
            if (element.status === 'Approved') {
                approved++;
            }
            if (element.status === 'Rejected') {
                rejected++;
            }
            if (element.status === 'Under Review') {
                underReview++;
            }
        })

        const token = jwt.sign({ id: user._id }, 'secret');

        res.status(200).json({ token, ...user._doc, applied, approved, rejected, underReview });
    } catch (error) {
        console.error("Error in user login: ", error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.post('/adminLogin', async (req, res) => {
    try {
        const { user_email, user_password } = req.body;
        if (user_email !== 'admin@farmeasy.com' || user_password !== 'Root@1234') {
            return res.status(401).json({ message: 'Authentication failed', status: 0 });
        }
        req.session.user = user_email;
        res.status(200).json({ message: 'Admin logged in successfully', status: 1 });
    }
    catch (error) {
        console.error("Error in admin login: ", error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get('/adminLogout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.post('/tokenIsValid', async (req, res) => {
    try {
        // console.log("Token is valid");
        const token = req.header('x-auth-token');
        // console.log(token);
        if (!token) return res.json(false);

        const verified = jwt.verify(token, 'secret');
        if (!verified) return res.json(false);

        const user = await User.findById(verified.id);
        if (!user) return res.json(false);
        // console.log(verified.id);
        return res.json(true);
    } catch (error) {
        console.error("Error in token validation: ", error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get('/user', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user);
        var applied = 0;
        var approved = 0;
        var rejected = 0;
        var underReview = 0;
        var token = req.header('x-auth-token');
        if (!user) return res.json(false);

        applied = user.user_applied_schemes.length;
        user.user_applied_schemes.forEach(element => {
            if (element.status === 'Approved') {
                approved++;
            }
            if (element.status === 'Rejected') {
                rejected++;
            }
            if (element.status === 'Under Review') {
                underReview++;
            }
        })
        return res.json({
            token,
            ...user._doc,
            applied,
            approved,
            rejected,
            underReview
        });
    }
    catch (error) {
        console.error("Error in fetching user: ", error);
        res.status(500).json({ message: 'Internal Server Error' });
    }

});

app.post('/logout', function (req, res) {
    try {
        req.session.destroy();
        res.session = null;
        res.send('logout');
    }
    catch (error) {
        console.error("Error in user logout: ", error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
);

app.post('/addFeed', async (req, res) => {
    try {
        const { feed_name, feed_description, feed_source_url } = req.body;
        if (!req.files || !req.files.imgFile) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        // Assuming imgFile is the name attribute of the file input field in your form
        const imgFile = req.files.imgFile;

        // Get file extension
        const fileExt = path.extname(imgFile.name);
        if (!['.png', '.jpg', '.jpeg', '.PNG', '.JPG', '.JPEG'].includes(fileExt)) {
            return res.status(600).json({ message: 'Only image files are allowed' });
        }

        // Generate a unique filename with timestamp
        const filename = `feed_img_${Date.now()}${fileExt}`;

        // Save file to the uploads directory
        await imgFile.mv(`./uploads/${filename}`);

        // Create new Feed object
        const newFeed = new Feed({
            feed_img: `/uploads/${filename}`, // Store file path in database
            feed_name: req.body.feed_name,
            feed_description: req.body.feed_description,
            feed_source_url: req.body.feed_source_url
        });

        // Save new feed to the database
        const savedFeed = await newFeed.save();
        try {
            //send a post reaquest to the server to send a notification to all users\
            var url = "https://localhost:8000/notify/sendNotification";
            var data = {
                message: "New Feed Added : " + req.body.feed_name,
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
        catch (error) {
            console.log(error);
        }

        res.status(200).json({ message: 'Feed added successfully', data: savedFeed });
    } catch (error) {
        console.error('Error occurred while adding feed:', error);
        res.status(500).json({ message: 'Error occurred while adding feed', error: error.message });
    }
});

// Route to update a feed
app.put('/updateFeed/:id', async (req, res) => {
    try {
        if (req.files) {

            const imgFile = req.files.imgFile;

            // Get file extension
            const fileExt = path.extname(imgFile.name);
            if (!['.png', '.jpg', '.jpeg', '.PNG', '.JPG', '.JPEG'].includes(fileExt)) {
                return res.status(600).json({ message: 'Only image files are allowed' });
            }

            // Generate a unique filename with timestamp
            const filename = `feed_img_${Date.now()}${fileExt}`;

            // Save file to the uploads directory
            await imgFile.mv(`./uploads/${filename}`);

            const updatedFeed = await Feed.findByIdAndUpdate({ _id: req.params.id });
            if (!updatedFeed) {
                return res.status(404).json({ message: "Feed not found" });
            }
            updatedFeed.feed_img = `/uploads/${filename}`;
            updatedFeed.feed_name = req.body.feed_name;
            updatedFeed.feed_description = req.body.feed_description;
            updatedFeed.feed_source_url = req.body.feed_source_url;
            await updatedFeed.save();

            return res.status(200).json({ message: "Feed updated successfully", data: updatedFeed });

        }

        const updatedFeed = await Feed.findByIdAndUpdate({ _id: req.params.id });
        if (!updatedFeed) {
            return res.status(404).json({ message: "Feed not found" });
        }
        updatedFeed.feed_name = req.body.feed_name;
        updatedFeed.feed_description = req.body.feed_description;
        updatedFeed.feed_source_url = req.body.feed_source_url;
        await updatedFeed.save();

        return res.status(200).json({ message: "Feed updated successfully", data: updatedFeed });


    } catch (error) {
        res.status(500).json({ message: "Error occurred while updating feed", error: error.message });
    }
});



app.post('/addContact', async (req, res) => {
    try {
        if (!req.files || !req.files.imgFile) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        // Assuming imgFile is the name attribute of the file input field in your form
        const imgFile = req.files.imgFile;

        // Get file extension
        const fileExt = path.extname(imgFile.name);
        if (!['.png', '.jpg', '.jpeg', '.PNG', '.JPG', '.JPEG'].includes(fileExt)) {
            return res.status(600).json({ message: 'Only image files are allowed' });
        }

        // Generate a unique filename with timestamp
        const filename = `contact_img_${Date.now()}${fileExt}`;

        // Save file to the uploads directory
        await imgFile.mv(`./uploads/${filename}`);

        const { contact_name, contact_email, contact_mobile, contact_locality, contact_organisation, contact_designation } = req.body;
        // Creating a new contact instance with the data from the request body
        const newContact = new Contact({
            contact_img: `/uploads/${filename}`, // Store file path in database
            contact_name,
            contact_email,
            contact_mobile,
            contact_locality,
            contact_organisation,
            contact_designation
        });
        // Saving the new contact to the database
        const savedContact = await newContact.save();
        res.status(200).json({ message: 'Contact added successfully', data: savedContact });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});



// Route to update a contact by ID
app.put('/editContact/:id', async (req, res) => {
    try {

        if (req.files) {
            // console.log(req.files)
            const imgFile = req.files.imgFile;

            // Get file extension
            const fileExt = path.extname(imgFile.name);
            if (!['.png', '.jpg', '.jpeg', '.PNG', '.JPG', '.JPEG'].includes(fileExt)) {
                return res.status(600).json({ message: 'Only image files are allowed' });
            }

            // Generate a unique filename with timestamp
            const filename = `contact_img_${Date.now()}${fileExt}`;

            // Save file to the uploads directory
            await imgFile.mv(`./uploads/${filename}`);
            var updatedContact = await Contact.findOne({ contact_email: req.params.id });
            if (!updatedContact) {
                return res.status(404).json({ message: "Contact not found" });
            }
            updatedContact.contact_img = `/uploads/${filename}`;
            updatedContact.contact_name = req.body.contact_name;
            updatedContact.contact_email = req.body.contact_email;
            updatedContact.contact_mobile = req.body.contact_mobile;
            updatedContact.contact_organisation = req.body.contact_organisation;
            updatedContact.contact_locality = req.body.contact_locality;
            updatedContact.contact_designation = req.body.contact_designation;
            await updatedContact.save();
            return res.status(200).json({ message: "Contact updated successfully", data: updatedContact });




        }
        else {
            var updatedContact = await Contact.findOne({ contact_email: req.params.id });
            if (!updatedContact) {
                return res.status(404).json({ message: "Contact not found" });
            }
            updatedContact.contact_name = req.body.contact_name;
            updatedContact.contact_email = req.body.contact_email;
            updatedContact.contact_mobile = req.body.contact_mobile;
            updatedContact.contact_organisation = req.body.contact_organisation;
            updatedContact.contact_locality = req.body.contact_locality;
            await updatedContact.save();
            return res.status(200).json({ message: "Contact updated successfully", data: updatedContact });
        }

    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.post('/schemeUpdate', async (req, res) => {
    try {
        const { user_name, user_email, status, comment, scheme_name, scheme_id } = req.body;
console.log("request to mail :",req.body);
   var mailOptions = {};

        const transporter = nodemailer.createTransport({
            service: 'Gmail', // Replace with your email service provider
            auth: {
                user: 'jayesh007va@gmail.com', // Replace with your email address
                pass: 'rtws hlck rszj qzdv' // Replace with your email password or app password if using Gmail
            }
        });




        if (status === "Approved") {
            mailOptions = {
                from: 'jayesh007va@gmail.com', // Sender address
                to: user_email, // Receiver's email
                subject: 'Subsidy Update - Approved', // Email subject
                html: `<html>
                <head>
                    <style>
                        h1 { color: #007bff; }
                        p { font-size: 16px; }
                        .otp { font-size: 24px; color: #dc3545; }
                    </style>
                </head>
                <body>
                    <h2>Hello ${user_name},</h2>
                    <p>Your scheme has been successfully Approved !</p>
                    <h1>Scheme Name : ${scheme_name}</h1>
                    <h1>Scheme ID : ${scheme_id}</h1>
                    <div>
                        <p>Your approver comment is below:</p>
                        <h1 class="otp">${comment}</h1>
                    </div>
                </body>
            </html>`, // Email body with HTML formatting
            };
        }
        else if (status === "Rejected") {
             mailOptions = {
                from: 'jayesh007va@gmail.com', // Sender address
                to: user_email, // Receiver's email
                subject: 'Subsidy Update - Rejected ', // Email subject
                html: `<html>
                    <head>
                        <style>
                            h1 { color: #007bff; }
                            p { font-size: 16px; }
                            .otp { font-size: 24px; color: #dc3545; }
                        </style>
                    </head>
                    <body>
                        <h2>Hello ${user_name},</h2>
                        <p>Sorry! your scheme has been Rejected</p>
                        <h1>Scheme Name : ${scheme_name}</h1>
                        <h1>Scheme ID : ${scheme_id}</h1>
                        <div>
                            <p>The comment is below:</p>
                            <h1 class="otp">${comment}</h1>
                        </div>
                    </body>
                </html>`, // Email body with HTML formatting
            };
        }
        else if (status === "Under Review") {
            mailOptions = {
                from: 'jayesh007va@gmail.com', // Sender address
                to: user_email, // Receiver's email
                subject: 'Subsidy Update', // Email subject
                html: `<html>
                    <head>
                        <style>
                            h1 { color: #007bff; }
                            p { font-size: 16px; }
                            .otp { font-size: 24px; color: #dc3545; }
                        </style>
                    </head>
                    <body>
                        <h2>Hello ${user_name},</h2>
                        <p>You have some Comment !</p>
                        <h1>Scheme Name : ${scheme_name}</h1>
                        <h1>Scheme ID : ${scheme_id}</h1>
                        <div>
                            <p>Your comment is below:</p>
                            <h1 class="otp">${comment}</h1>
                        </div>
                    </body>
                </html>`, // Email body with HTML formatting
            };
        }
        else {
            return res.status(400).json({ message: 'Invalid Comment', status: 0 });
        }


        // Send the email
        transporter.sendMail(mailOptions, async (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                // Handle error in sending email
                return res.status(500).json({ message: 'Error sending confirmation email', status: 0 });
            }
            console.log('Email sent:', info.response);
          
            res.status(200).json({ message: 'Scheme Updated and email sent.', status: 1, user: req.body });
        });

    } catch (error) {
        console.error("Error in user registration: ", error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get('*', function (req, res) {
    res.render('404');
});

// app.listen(port, function () {
//     console.log(`Express server listening on port ${port}`);
// });

const httpsServer = https.createServer(credentials, app);


httpsServer.listen(port, function () {
    console.log(`Express server listening on port ${port} (HTTPS)`);
});
