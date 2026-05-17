const jwt = require("jsonwebtoken");

function authmiddleware(req, res, next) {
    // Check both Authorization header (Bearer token) or custom token header
    const token =  req.headers.token;
    
    if (!token) {
        return res.status(403).json({
            message: "token not found"
        });
        return;
    }
    const decode = jwt.verify(token,"atlantision1234")
    const usersid = decode.usersid
    if(!usersid)
    {
       res.status(403).send({
        message:"invalid token structure"
       })
       return;
    }
    req.usersid = usersid
    next()
}
    
module.exports = {
    authmiddleware
};
