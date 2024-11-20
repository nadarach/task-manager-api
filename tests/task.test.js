const request = require('supertest');
const app = require('../src/app');
const Task = require('../src/models/task');
const { userOneId, userOne, userTwo, userTwoId, taskOne, taskTwo, taskThree, configureDatabase } = require('./fixtures/db');

beforeEach(configureDatabase);

///****** Tests for creating tasks ******///

test("Should create task for authenticated user", async () => {
  const response = await request(app)
    .post('/tasks')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({
      description: 'From my test',
    })
    .expect(201);

  //Assert that the task has been created and saved to database
  const task = await Task.findById(response.body._id);
  expect(task).not.toBeNull();

  //Assert that the task owner is the authenticated user
  expect(task.owner).toEqual(userOneId);

  //Assert that the task is set to incomplete (by default)
  expect(task.completed).toBeFalsy();
});

test('Should not create task with an invalid description', async () => {
  const response = await request(app)
    .post('/tasks')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({
      description: '',
      completed: false
    })
    .expect(400);
  
  //Check that the task has not been created and saved to database
  const task = await Task.findById(response.body._id);
  expect(task).toBeNull();
});

test('Should not create task with an invalid completed field', async () => {
  const response = await request(app)
    .post('/tasks')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({
      description: 'Buy cat food',
      completed: 'not completed',
    })
    .expect(400);

  //Check that the task has not been created and saved to database
  const task = await Task.findById(response.body._id);
  expect(task).toBeNull();
})

///****** Tests for getting tasks ******///

test('Should get all tasks for authenticated user', async () => {
  const response = await request(app)
    .get('/tasks')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);
  
  expect(response.body.length).toBe(2);
});

test('Should fetch user task by ID', async () => {
  const response = await request(app)
    .get(`/tasks/${taskOne._id}`)
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);
  
  const task = await Task.findById(taskOne._id);
  expect(response.body.description).toBe(taskOne.description);
});

test('Should not fetch user task if unauthenticated', async () => {
  const response = await request(app)
    .get(`/tasks/${taskOne._id}`)
    .send()
    .expect(401);
});

test('Should not fetch other users task', async () => {
  const response = await request(app)
    .get(`/tasks/${taskOne._id}`)
    .set('Authorization', `Bearer ${userTwo.tokens[0].token}`)
    .send()
    .expect(404);
});

test('Should fetch only completed tasks', async () => {
  const response = await request(app)
    .get('/tasks?completed=true')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);
  
  //Check that only one task was fetched
  expect(response.body.length).toBe(1);
});

test('Should fetch only completed tasks', async () => {
  const response = await request(app)
    .get('/tasks?completed=false')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);

  //Check that only one task was fetched
  expect(response.body.length).toBe(1);
});

test('Sort fetched tasks by description field ascendingly (alphabetically)', async () => {
  const response = await request(app)
    .get('/tasks?sortBy=description_asc')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);

  //Check that user's two (2) tasks have been fetched
  expect(response.body.length).toBe(2);

  //Check that the 1st element (element at the top of the list) is taskOne
  expect(response.body[0]).toMatchObject({
    description: taskOne.description,
    completed: taskOne.completed,
  });
});

test('Sort fetched tasks by completed field', async () => {
  const response = await request(app)
    .get('/tasks?sortBy=completed_desc')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);
  
  //Check that user's two (2) tasks have been fetched
  expect(response.body.length).toBe(2);

  //Check that the completed field for the 1st element (at the top of the list) is true
  expect(response.body[0].completed).toBeTruthy();
});

test('Sort fetched tasks by createdAt field ascendingly', async () => {
  const response = await request(app)
    .get('/tasks?sortBy=createdAt_asc')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);

  //Check that user's two (2) tasks have been fetched
  expect(response.body.length).toBe(2);

  //Check that the 1st element (at the top of the list) is taskOne
  expect(response.body[0]).toMatchObject({
    description: taskOne.description,
    completed: taskOne.completed,
  });
});

test('Sort fetched tasks by createdAt field descendingly', async () => {
  const response = await request(app)
    .get('/tasks?sortBy=createdAt_desc')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);

  //Check that user's two (2) tasks have been fetched
  expect(response.body.length).toBe(2);

  //Check that the 1st element (at the top of the list) is taskOne
  expect(response.body[0]).toMatchObject({
    description: taskTwo.description,
    completed: taskTwo.completed,
  });
});

test('Sort fetched tasks by updatedAt field ascendingly', async () => {
  const response = await request(app)
    .get('/tasks?sortBy=updatedAt_asc')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);

  //Check that user's two (2) tasks have been fetched
  expect(response.body.length).toBe(2);

  //Check that the 1st element (element at the top of the list) is taskOne
  expect(response.body[0]).toMatchObject({
    description: taskOne.description,
    completed: taskOne.completed,
  });
});

test('Sort fetched tasks by updatedAt field descendingly', async () => {
  const response = await request(app)
    .get('/tasks?sortBy=updatedAt_desc')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);

  //Check that user's two (2) tasks have been fetched
  expect(response.body.length).toBe(2);

  //Check that the 1st element (element at the top of the list) is taskTwo
  expect(response.body[0]).toMatchObject({
    description: taskTwo.description,
    completed: taskTwo.completed,
  });
});

test('Fetch first page of tasks (one task per page)', async () => {
  const response = await request(app)
    .get('/tasks?limit=1&skip=0')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);

  //Check that user's two (2) tasks have been fetched
  expect(response.body.length).toBe(1);

  //Check that the 1st element (element at the top of the list) is taskTwo
  expect(response.body[0]).toMatchObject({
    description: taskOne.description,
    completed: taskOne.completed,
  });
});

test('Fetch second page of tasks (one task per page)', async () => {
  const response = await request(app)
    .get('/tasks?limit=1&skip=1')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);

  //Check that user's two (2) tasks have been fetched
  expect(response.body.length).toBe(1);

  //Check that the 1st element (element at the top of the list) is taskTwo
  expect(response.body[0]).toMatchObject({
    description: taskTwo.description,
    completed: taskTwo.completed,
  });
});

///****** Tests for updating tasks ******///

/*
test('Should not update task with an invalid description', async () => {
  const response = await request(app)
    .patch(`/tasks/${taskOne._id}`)
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({
      description: ' '
    })
    .expect(400);
  
  const task = await Task.findById(taskOne._id);
  expect(task.description).not.toBe('');
  //expect(task.description).toBe(taskOne.description);
}) 
*/

test('Should not update other users task', async () => {
  const response = await request(app)
    .patch(`/tasks/${taskThree._id}`)
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({
      description: 'Drop by the office'
    })
    .expect(404);
  
  const task = await Task.findById(taskOne._id);
  expect(task.description).not.toBe("Drop by the office");
})

///****** Tests for deleting tasks ******///

test('Should delete user task', async () => {
  const response = await request(app)
    .delete(`/tasks/${taskOne._id}`)
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);
  
  const task = await Task.findById(taskOne._id);
  expect(task).toBeNull();
});

test('Should not delete user task if unauthenticated', async () => {
  const response = await request(app)
    .delete(`/tasks/${taskOne._id}`)
    .send()
    .expect(401);

  const task = await Task.findById(taskOne._id);
  expect(task).not.toBeNull();
});

test('Should not delete other users tasks', async () => {
  const response = await request(app)
    .delete(`/tasks/${taskOne._id}`)
    .set("Authorization", `Bearer ${userTwo.tokens[0].token}`)
    .send()
    .expect(404);
  
  const task = await Task.findById(taskOne._id);
  expect(task).not.toBeNull();
});