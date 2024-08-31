const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const dbConnect = async () => {
    // console.log('Mongo URI:', process.env.DbUrl);
  try {
    await mongoose.connect(process.env.DbUrl, {
  
    });
    console.log("DB connected successfully");
  } catch (error) {
    console.error('DB connection error:', error.message);
    process.exit(1); // Exit the application only on database connection error
  }
};

module.exports = dbConnect;
