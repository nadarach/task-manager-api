const express = require('express');
const multer = require("multer"); //for file upload
const sharp = require('sharp') //for image processing
const { sendWelcomeEmail, sendCancelEmail } = require('../emails/account')
const User = require("../models/user");
const auth = require('../middleware/auth');

const router = new express.Router();

const upload = multer({
  //dest: "avatars",
  limits: {
    fileSize: 1000000
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      cb(new Error('Please upload an image (.jpg, .jpeg or .png).'));
    }

    cb(undefined, true);
  }
});

//create a user account
router.post("/users", async (req, res) => {
  const user = new User(req.body);
  try {
    await user.save();
    sendWelcomeEmail(user.email, user.name);
    const token = await user.generateAuthToken();
    res.status(201).send({ user, token });
  } catch (e) {
    res.status(400).send(e);
  }
});


//log in to an already existing user/account
router.post('/users/login', async (req, res) => {
  try {
    const user = await User.findByCredentials(req.body.email, req.body.password);
    const token = await user.generateAuthToken();
    res.send({ user, token });

  } catch (e) {
    res.status(400).send();
  }
})

//log out of user session
router.post('/users/logout', auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(token => token.token !== req.token);
    await req.user.save();
    res.send();
  } catch (e) {
    res.status(500).send();
  }
})

//log out of all user sessions
router.post("/users/logoutAll", auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.send();
  } catch (e) {
    res.status(500).send();
  }
});

//read user profile
router.get("/users/me", auth, async (req, res) => {
  res.send(req.user);
});

//update a user's properties (by ID)
router.patch("/users/me", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["name", "email", "password", "age"];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
    return res.status(400).send({
      error: "Invalid updates",
    });
  }

  try {
    /*const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });*/ 
    updates.forEach((update) => (req.user[update] = req.body[update]));
    await req.user.save();
    res.status(200).send(req.user);
  } catch (e) {
    res.status(400).send(e);
  }
});

//delete a user from the database (by ID)
router.delete("/users/me", auth, async (req, res) => {
  try {  
    sendCancelEmail(req.user.email, req.user.name);
    await req.user.deleteOne();
    res.status(200).send(req.user);
  } catch (e) {
    res.status(500).send(e);
  }
});

//add a user's avatar
router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
  const buffer = await sharp(req.file.buffer)
    .resize({ width: 250, height: 250 })
    .png()
    .toBuffer();
  req.user.avatar = buffer;
  await req.user.save();
  res.send();
}, (error, req, res, next) => {
  res.status(400).send({ error: error.message });
});

//delete a user's avatar
router.delete('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
  req.user.avatar = undefined;
  await req.user.save();
  res.send();
}, (error, req, res, next) => {
  res.status(500).send({ error: error.message });
});

router.get('/users/:id/avatar', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || !user.avatar) {
      throw new Error();
    }
    res.set('Content-Type', 'image/png');
    res.send(user.avatar);
  } catch (e) {
    res.status(404).send();
  }
})

module.exports = router