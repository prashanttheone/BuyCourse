const express = require('express');
const app = express();
const dotenv = require('dotenv');
dotenv.config();
const cors = require('cors');
const createOrderRouter = require('./controller/cashfree');
const dbConnect = require('./config/dbConnect');
// const bodyParser = require('body-parser');



app.use(express.json());
app.use(cors({
  origin: "*",
  credentials: true
}))

// Define a route
app.use('/api', createOrderRouter);
app.get('/', (req, res) => {
  res.send('Hello, Express!');
});

//connect the db
dbConnect();
// Start the server
const PORT = process.env.PORT ;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
