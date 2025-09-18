const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const timeRecordRoutes = require('./routes/timeRecords');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/records', timeRecordRoutes);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});