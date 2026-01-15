const express = require('express');
const dotenv = require('dotenv');
const appRoutes = require('./routes/appRoutes');
const connectDB = require('./config/db');
const bodyParser = require('body-parser');

dotenv.config();
connectDB();

const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// Health check endpoint (required by firewall)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Your application routes
app.use('/', appRoutes);

// Run HTTP server (SSL handled by firewall)
const PORT = process.env.PORT || 5000;
app.listen(PORT, '127.0.0.1', () => {
  console.log(`✅ Server running on HTTP port ${PORT}`);
  console.log(`🔒 SSL termination handled by firewall`);
});