const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Fix CORS - важно поставить в начале
app.use(cors({
  origin: 'https://escolas-forum.onrender.com',
  credentials: true
}));

app.use(express.json());

// Подключение к MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/forum';
mongoose.connect(mongoUri)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Схемы для базы данных
const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  avatar: String,
  isAdmin: { type: Boolean, default: false },
  isBanned: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const ReportSchema = new mongoose.Schema({
  postId: String,
  reason: String,
  authorId: String,
  userId: String,
  status: { type: String, default: 'new' },
  createdAt: { type: Date, default: Date.now }
});

const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String
});

const TopicSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);
const Report = mongoose.model('Report', ReportSchema);
const Category = mongoose.model('Category', CategorySchema);
const Topic = mongoose.model('Topic', TopicSchema);

// API Routes - должны быть ДО static files!
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { username, avatar } = req.body;
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    const user = new User({ username, avatar });
    await user.save();
    res.json(user);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ error: 'Username already exists' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

app.post('/api/reports', async (req, res) => {
  try {
    const report = new Report(req.body);
    await report.save();
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/reports', async (req, res) => {
  try {
    const reports = await Report.find();
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/ban', async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findByIdAndUpdate(
      userId,
      { isBanned: true },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User banned successfully', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/data', async (req, res) => {
  try {
    const [users, categories, topics, reports] = await Promise.all([
      User.find(),
      Category.find(),
      Topic.find().populate('authorId'),
      Report.find()
    ]);
    res.json({ users, categories, topics, reports });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Создаем начальные данные
async function createInitialData() {
  try {
    const categoriesCount = await Category.countDocuments();
    if (categoriesCount === 0) {
      await Category.create([
        { name: "Porto" },
        { name: "Lisboa" }, 
        { name: "Coimbra" },
        { name: "Outras" }
      ]);
      console.log('Initial categories created');
    }
  } catch (error) {
    console.error('Error creating initial data:', error);
  }
}

// Static files - должно быть ПОСЛЕ API routes!
app.use(express.static(path.join(__dirname, 'frontend')));

// Catch-all handler - должно быть ПОСЛЕДНИМ!
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  createInitialData();
});