var jwt = require('jsonwebtoken');

async function auth (req, res, next) {
    try {
        var verify = req.header('x-auth-token');
        if (!verify) {
            return res.status(401).json({ message: "Unauthorized Access No Token" });
        }
        var decoded = jwt.verify(verify, 'secret');
        if (!decoded) {
            return res.status(401).json({ message: "Unauthorized Access Invalid Token" });
        }
        req.user = decoded.id;
        req.token = verify;
        // console.log(decoded);
        next();
    } 
    catch (error) {
        res.status(500).json({ message: "Error Occured While Verifying Token", error: error.message });
    }
}
module.exports = auth;

