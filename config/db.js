const mongoose = require('mongoose');

const connectDb = () => {
  mongoose
    .connect(process.env.DB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(console.log('DB CONNECTED!'))
    .catch((error) => {
      console.log('DB CONNECTION ISSUE');
      console.log(error);
      process.exit(1);
    });
};

module.exports = connectDb;
