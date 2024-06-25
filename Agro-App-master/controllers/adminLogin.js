const isLoggedIn = (req, res, next) => {
    if (req.session.user) {
        next(); // User is logged in, proceed to the next middleware/route handler
    } else {
        res.redirect('/'); // User is not logged in, redirect to login page
    }
};
module.exports = isLoggedIn;