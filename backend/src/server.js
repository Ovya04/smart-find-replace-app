require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const findReplaceController = require('./controllers/findReplaceController');
const brandkitController = require('./controllers/brandkitController');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// MongoDB connection
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
}

// Routes
app.use('/api/find-replace', findReplaceController);
app.use('/api/brandkit', brandkitController);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
