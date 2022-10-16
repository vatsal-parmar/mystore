require('dotenv').config();
const cloudinary = require('cloudinary');
const app = require('./app');
const connectDb = require('./config/db');
const PORT = process.env.PORT;

// to connect with database
connectDb();

// cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// temp check
app.set('view engine', 'ejs');

app.listen(PORT, () => console.log(`server is running at port ${PORT}`));
