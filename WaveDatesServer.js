const express = require('express');
const connectDB = require('./config/db');

const cors = require('cors')
const app = express();

// Connect Database
connectDB;

// Init Middleware
app.use(cors())
app.use(express.json({ extended: false }));

// app.get('/', (req, res) => {
//     res.send('API Running')
// })

// Define Routes
app.use('/locations', require('./routes/locations'))


const PORT = process.env.PORT || 3040

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
})