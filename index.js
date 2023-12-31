const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const morgan = require("morgan");
const cors = require("cors");
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const userSchema = new mongoose.Schema({
  avatar: String,
  name: String,
  headline: String,
  tags: [String],
  id: String,
});

const User = mongoose.model("User", userSchema);

app.use(express.json());
app.use(morgan("tiny"));
app.use(cors());

// POST route to add a new user
app.post("/api/users", async (req, res) => {
  try {
    const newUser = new User(req.body);
    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST route to get all users
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//Search route to find users with a given tag
app.get('/api/users/tag/:tag', async (req, res) => {
  try {
    const tag = req.params.tag;
    const users = await User.find({
      $or: [{ tags: new RegExp(tag, "i") }]
    });

    res.json(users);
  } catch (error) {
    res.status(400).json({error: error.message});
  }
})

// SEARCH route to find users by tag or any other attribute
app.get("/api/users/search", async (req, res) => {
  try {
    const { query } = req.query;
    const users = await User.find({
      $or: [
        { name: new RegExp(query, "i") },
        { headline: new RegExp(query, "i") },
        { tags: new RegExp(query, "i") },
      ],
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// endpoint to get mostly used tags and their number
app.get("/api/mostUsedTags", async (req, res) => {
  try {
    const tagsAggregation = await User.aggregate([
      { $unwind: "$tags" },
      {
        $group: {
          _id: "$tags",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    const mostUsedTags = tagsAggregation.map(({ _id, count }) => ({
      tag: _id,
      count,
    }));

    res.json(mostUsedTags);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.listen(port, () => {
  mongoose.connect(process.env.MONGODB_URI);
  console.log(`Server is running on port ${port} && database is connected`);
});
