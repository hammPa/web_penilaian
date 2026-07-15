require('dotenv').config();

const app = require('./app');
const { PORT } = require('./config');

console.log('DB_MODE aktif:', process.env.DB_MODE);

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});