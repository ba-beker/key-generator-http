const express = require('express');
const dotenv = require('dotenv');
const appRoutes = require('./routes/appRoutes')
const connectDB = require('./config/db');
const bodyParser = require('body-parser');

dotenv.config();
connectDB()

const app = express()
// app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/', appRoutes)

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));