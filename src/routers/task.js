const express = require('express');
const auth = require("../middleware/auth");
const Task = require('../models/task');

const router = new express.Router();

//create a new task
router.post("/tasks", auth, async (req, res) => {
  const task = new Task({
    ...req.body,
    owner: req.user._id
  });

  try {
    await task.save();
    res.status(201).send(task);
  } catch (e) {
    res.status(400).send(e); //client side error
  }
});

//fetch all tasks (for the user authenticated)
//GET /tasks?completed=true
//GET /tasks?limit=10&skip=0/10/20...
//GET /tasks?sortBy=createdAt_desc
router.get("/tasks", auth, async (req, res) => {
  const match = {};
  const sort = {}

  //filter out completed/incomplete tasks
  if (req.query.completed) {
    match.completed = req.query.completed === 'true'
  }

  //sort tasks by a field (createdAt, updatedAt..)
  if (req.query.sortBy) {
    const parts = req.query.sortBy.split('_');
    sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
  }

  try {
    //const tasks = await Task.find({ owner: req.user._id});
    await req.user.populate({
      path: 'tasks',
      match,
      options: {
        //defining options to enable pagination (limit & skip)
        limit: parseInt(req.query.limit),
        skip: parseInt(req.query.skip),
        sort
      }
    });
    res.send(req.user.tasks);
  } catch (e) {
    res.status(500).send(e); //internal server error
  }
});

//fetch a task by its' ID 
router.get("/tasks/:id", auth, async (req, res) => {
  const _id = req.params.id;
  try {
    const task = await Task.findOne({
      _id,
      owner: req.user._id
    });

    if (!task) {
      return res.status(404).send({ error: "No task was found with this ID." });
    }

    res.send(task);
  } catch (e) {
    res.status(500).send(e);
  }
});

//update a task by its' ID
router.patch("/tasks/:id", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["description", "completed"];
  const isValidUpdate = updates.every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValidUpdate) {
    res.status(400).send({ error: "Invalid updates!" });
  }

  try {
    const task = await Task.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!task) {
      return res.status(404).send({ error: "No task was found with this ID." });
    }

    updates.forEach((update) => (task[update] = req.body[update]));
    task.save();
    res.send(task);
  } catch (e) {
    res.status(400).send(e);
  }
});

//delete a task by its' ID
router.delete("/tasks/:id", auth, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!task) {
      return res.status(404).send();
    }
    res.send(task);
  } catch (e) {
    res.status(500).send(e);
  }
});

module.exports = router;