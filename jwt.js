const jwt = require("jsonwebtoken");

const secretKey = 'tensorflow'

var generateAccessToken = (mobile_number, user_id) => {
    return jwt.sign({ mobile_number: mobile_number, user_id: user_id }, secretKey);
}

var auth = (req) => {
    var token = req.headers?.authorization
    // console.log(token)
    const decoded = jwt.verify(token, secretKey)
    return decoded
    // if (!token) {
    //     return res.status(401).send({
    //         HasError: true,
    //         StatusCode: 401,
    //         message: "Token not provided",
    //       })
    // } else {
    //     const decoded = jwt.verify(token, secretKey)
    //     return decoded
    //     // return jwt.verify(token, secret_key);
    // }
};
module.exports = { generateAccessToken, auth };
