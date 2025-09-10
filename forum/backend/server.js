const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path'); // Добавляем path для работы с путями

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
// Добавляем раздачу статических файлов из папки frontend
app.use(express.static(path.join(__dirname, 'frontend')));

// Подключение к MongoDB
mongoose.connect(process.env.MONGODB_URI)
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
  userId: String, // Добавил userId для бана
  status: { type: String, default: 'new' },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);
const Report = mongoose.model('Report', ReportSchema);

// API Routes
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

// Новый API для админки - получение всех жалоб
app.get('/api/reports', async (req, res) => {
  try {
    const reports = await Report.find();
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Новый API для бана пользователя
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

// Обслуживание фронтенда - ВСЕ остальные запросы идут на index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
// Добавляем схему для категорий
const categorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: String
});

const topicSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
});

const Category = mongoose.model('Category', categorySchema);
const Topic = mongoose.model('Topic', topicSchema);

// Эндпоинт для получения всех данных
app.get('/api/data', async (req, res) => {
    try {
        const [users, categories, topics] = await Promise.all([
            User.find(),
            Category.find(),
            Topic.find().populate('authorId')
        ]);
        
        res.json({ users, categories, topics });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Создаем начальные категории если их нет
async function createInitialCategories() {
    const categoriesCount = await Category.countDocuments();
    if (categoriesCount === 0) {
        const initialCategories = [
            { name: "Porto" },
            { name: "Lisboa" },
            { name: "Coimbra" },
            { name: "Outras" }
        ];
        await Category.insertMany(initialCategories);
        console.log("Initial categories created");
    }
}
});
