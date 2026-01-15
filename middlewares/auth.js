const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  try {
    const token = req.header("x-auth-token");
    console.log(token);
    if (!req.body){
        req.body = {}
        console.log('GGG')
    }
    if (!token)
      return res.status(401).json({ msg: "No auth token, access denied" });
    const verified = jwt.verify(token, process.env.SECRET_KEY);
    if (!verified)
      return res
        .status(401)
        .json({ msg: "Token verification failed, authorization denied" });
    req.body.deviceId = verified.deviceId;
    console.log(req.body.deviceId);
    // req.body.sldToken = token
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
module.exports = auth;

// const jwt = require('jsonwebtoken')

// const auth = (req, res, next) => {
//     try {
//         const token = req.header('x-auth-token')

//         if (!token) {
//             return res.status(401).json({msg: "No auth token, access denied"})
//         }

//         try {
//             // Verify the token
//             const verified = jwt.verify(token, process.env.SECRET_KEY)
//             req.body.deviceId = verified.deviceId
//             next()
//         } catch (verifyError) {
//             if (verifyError.name === 'TokenExpiredError') {
// 				return res.status(401).json({msg: "EXPIRED TOKEN"})
// 				//$ we should ask for a new auth token from the client app for a better security
//                 // // If token is expired, decode it to get the payload
//                 // const decoded = jwt.decode(token)

//                 // // Generate a new token with the same payload
//                 // const newToken = jwt.sign(
//                 //     { deviceId: decoded.deviceId },
//                 //     process.env.SECRET_KEY,
//                 //     { expiresIn: '1h' } // Set your desired expiration
//                 // )

//                 // // Attach the new token to the response header
//                 // res.setHeader('x-new-auth-token', newToken)

//                 // // Continue with the request
//                 // req.body.deviceId = decoded.deviceId
//                 // next()
//             } else {
//                 // For other verification errors (invalid token, etc.)
//                 return res.status(401).json({msg: "Token verification failed, authorization denied"})
//             }
//         }
//     } catch (err) {
//         res.status(500).json({error: err.message})
//     }
// }

module.exports = auth;
