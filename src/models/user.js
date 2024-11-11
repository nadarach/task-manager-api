const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Task = require('./task');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    lowercase: true,
    validate(value) {
      if (!validator.isEmail(value)) throw new Error("Email is invalid");
    },
  },
  password: {
    type: String,
    required: true,
    trim: true,
    validate(value) {
      if (value.length < 6)
        throw new Error("Password length must be greater than 6.");
      if (value.toLowerCase().includes("password"))
        throw new Error('Password must not contain the word "password".');
    },
  },
  age: {
    type: Number,
    default: 0,
    validate(value) {
      if (value < 0) {
        throw new Error("Age must be a positive number.");
      }
    },
  },
  tokens: [{
    token: {
      type: String,
      required: true
    }
  }],
  avatar: {
    type: Buffer
  }
}, {
  timestamps: true
});

userSchema.virtual('tasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'owner'
});

//Generate an authentification token for a logged in user
userSchema.methods.generateAuthToken = async function () {
  const user = this;
  //generating tokens
  const token = jwt.sign({ _id: user.id.toString() }, process.env.JWT_SECRET);

  //adding them to the user's array of tokens 
  user.tokens = user.tokens.concat({ token });

  //storing them in the db
  user.save();
  return token;
}

//return the public profile of a user (sensitive data hidden)
userSchema.methods.toJSON = function () {
  const user = this;
  const userObject = user.toObject();

  delete userObject.password;
  delete userObject.tokens;
  delete userObject.avatar;

  return userObject;
}

//Retrieve a user from the database by their credentials
userSchema.statics.findByCredentials = async (email, password) => {
  //fetch the user by their email from the db
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('Unable to log in.');
  }

  //verify the pwd provided matches the hashed pwd stored in the db
  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new Error('Unable to log in.');
  }

  return user;
}

//Hash the plain text password before saving
userSchema.pre('save', async function (next) {
  const user = this;
  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});

//Delete user tasks when user is removed
userSchema.pre('deleteOne', {document: true, query: false}, async function (next) {
  const user = this;
  try {
    await Task.deleteMany({ owner: user._id });
    next();
  } catch {
    
  }

})

const User = mongoose.model("User", userSchema);

module.exports = User