const jwt = require("jsonwebtoken");

var generateAccessToken = (mobile_number, secret_key) => {
    return jwt.sign({ mobile_number: mobile_number }, secret_key, {
        expiresIn: "24h",
    });
};
var auth = (req, secret_key) => {
    var token = req.headers?.authorization?.split(" ")[1];
    if (!token) {
        return apiResponse.apiResponse(
            res,
            "A token is required for authentication",
            {},
            200,
            false
        );
    } else {
        return jwt.verify(token, secret_key);
    }
};
module.exports = { generateAccessToken, auth };
