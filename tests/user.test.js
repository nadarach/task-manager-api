const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/user');
const { userOneId, userOne, configureDatabase } = require('./fixtures/db');

beforeEach(configureDatabase);

///****** Tests for signing up a new user ******///

test('Should sign up a new user', async () => {
  const response = await request(app)
    .post('/users')
    .send({
      name: 'Nada',
      email: 'nadarach@example.com',
      password: 'keY@W087!'
    }).expect(201);
  
  //Assert that the database was changed correctly
  const user = await User.findById(response.body.user._id);
  expect(user).not.toBeNull();

  //Assertions about the response
  //expect(response.body.user.name).toBe('Nada');
  expect(response.body).toMatchObject({
    user: {
      name: 'Nada',
      email: 'nadarach@example.com',
    },
    token: user.tokens[0].token,
  });

  //Assert that the password stored in the database is not the plain text password
  expect(user.password).not.toBe('keY@W087!');

});


test('Should not signup user with an invalid name', async () => {
  const response = await request(app)
    .post('/users')
    .send({
      email: 'nadarach@example.com',
      password: 'keY@W087!',
    })
    .expect(400);
  
  const user = await User.findById(response.body._id);
  expect(user).toBeNull;
});

test('Should not signup user with an invalid email', async () => {
  const response = await request(app)
    .post('/users')
    .send({
      name: 'Na',
      email: 'example.com',
      password: 'keY@W087!',
    })
    .expect(400);

  const user = await User.findById(response.body._id);
  expect(user).toBeNull;
});

test('Should not signup user with an invalid password (contains the word password)', async () => {
  const response = await request(app)
    .post('/users')
    .send({
      name: 'Na',
      email: 'nadarach@example.com',
      password: 'keY@password@W087!',
    })
    .expect(400);

  const user = await User.findById(response.body._id);
  expect(user).toBeNull;
});

test('Should not signup user with an invalid password (length less than 6 characters)', async () => {
  const response = await request(app)
    .post('/users')
    .send({
      name: 'Na',
      email: 'nadarach@example.com',
      password: 'keY@',
    })
    .expect(400);

  const user = await User.findById(response.body._id);
  expect(user).toBeNull;
});

///****** Tests for logging in ******///

test('Should log in existing user', async () => {
  const response = await request(app)
    .post("/users/login")
    .send({
      email: userOne.email,
      password: userOne.password,
    })
    .expect(200);

  //Assert that a new token has been created upon logging in
  expect(response.body.token).not.toBeNull();

  //Assert that the newly created token has been saved to the database
  const user = await User.findById(userOneId);
  expect(user.tokens[1].token).toBe(response.body.token);
});

test('Should not login nonexistent user', async () => {
  await request(app)
    .post("/users/login")
    .send({
      email: 'bel_lou@gmail.com',
      password: '1804@@',
    })
    .expect(400);
});

///****** Tests for getting user profile ******///

test('Should get profile for user', async () => {
  await request(app)
    .get('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);
});

test("Should not get profile for unauthenticated user", async () => {
  await request(app)
    .get('/users/me')
    .send()
    .expect(401);
});

///****** Tests for deleting user ******///

test('Should delete account for user', async () => {
  await request(app)
    .delete('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);
  
  //Assert that the user has been deleted (no longer exists in database)
  const user = await User.findById(userOneId);
  expect(user).toBeNull();
});


test('Should not delete account for unauthenticated user', async () => {
  await request(app)
    .delete('/users/me')
    .send()
    .expect(401);

  //Assert that the user has been deleted (no longer exists in database)
  const user = await User.findById(userOneId);
  expect(user).not.toBeNull();
});

///****** Tests for updating avatar ******///

test('Should upload avatar image', async () => {
  await request(app)
    .post('/users/me/avatar')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .attach('avatar', 'tests/fixtures/profile-pic.jpg')
    .expect(200);
  
  const user = await User.findById(userOneId);
  expect(user.avatar).toEqual(expect.any(Buffer));
});

///****** Tests for updating user ******///

test('Should update valid user fields', async () => {
  await request(app)
    .patch('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({ name: 'Nada Rachedi' })
    .expect(200);
  
  const user = await User.findById(userOneId);
  expect(user.name).toBe('Nada Rachedi');
});

test("Should not update valid user fields", async () => {
  await request(app)
    .patch('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({ location: 'Paris' })
    .expect(400);
  
});

test('Should not update user with invalid name', async () => {
  await request(app)
    .patch("/users/me")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send({ name: ' ' })
    .expect(400);
  
  const user = await User.findById(userOneId);
  expect(user.name).toBe(userOne.name);
});

test('Should not update user with invalid email (empty)', async () => {
  await request(app)
    .patch('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({ email: '' })
    .expect(400);

  const user = await User.findById(userOneId);
  expect(user.name).toBe(userOne.name);
});

test('Should not update user with invalid email (not a valid email format)', async () => {
  await request(app)
    .patch('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({ email: 'example.com' })
    .expect(400);

  const user = await User.findById(userOneId);
  expect(user.email).toBe(userOne.email);
});

test('Should not update user with an invalid password (length less than 6 characters)', async () => {
  await request(app)
    .patch('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({ password: 'keY@' })
    .expect(400);
});

test('Should not update user with an invalid password (contains the word password)', async () => {
  await request(app)
    .patch('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({ password: '@passWORD@!' })
    .expect(400);
});

test('Should not update user if unauthenticated', async () => {
  await request(app)
    .patch('/users/me')
    .send({ name: 'Nada Rachedi' })
    .expect(401);

  const user = await User.findById(userOneId);
  expect(user.name).toBe(userOne.name);
});
