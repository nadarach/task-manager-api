const jwt = require('jsonwebtoken');
const User = require('../models/user');

const auth = async (req, res, next) => {
  try {
    //fetch the token from the request header
    const token = req.header("Authorization").replace("Bearer ", "");

    //verify that the token is valid
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    //fetch the user with the token and the ID retrieved from it
    const user = await User.findOne({ _id: decoded._id, "tokens.token": token });

    if (!user) {
      throw new Error();
    }

    req.token = token;
    req.user = user;
    next();
    
  } catch (e) {
    res.status(401).send({ error: "Please authenticate." });
  }
}

module.exports = auth;
