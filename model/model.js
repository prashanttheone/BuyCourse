const mongoose = require('mongoose');

const cashFreeSchema = new mongoose.Schema({

      productName: {
        type: String,
        // required: true,
      },
      price: {
        type: Number,
        // required: true,
      },
      orderId: {
        type: String,
        required: true,
        unique: true
      },
      orderAmount: {
        type: Number,
        // required: true
      },
      customerName: {
        type: String,
        // required: true
      },
      customerEmail: {
        type: String,
        // required: true,
        lowercase: true,
        // trim: true
      },
      customerPhone: {
        type: String,
        // required: true
      },
    
     
    }, { timestamps: true });

const cashFreeModel = mongoose.model('cashFree', cashFreeSchema);

module.exports = cashFreeModel;