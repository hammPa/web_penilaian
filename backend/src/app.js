const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const path = require('path');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')));
app.use('/api', routes);

app.use(errorHandler);

module.exports = app;