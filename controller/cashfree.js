const express = require('express');
const axios = require('axios');
const router = express.Router();
const cashFreeModel = require('../model/model.js');
const { Cashfree } = require("cashfree-pg");

// Initialize Cashfree with your credentials
Cashfree.XClientId = process.env.CASHFREE_APP_ID;  // Use environment variables for security
Cashfree.XClientSecret = process.env.CASHFREE_APP_SECRET;
Cashfree.XEnvironment = Cashfree.Environment.SANDBOX;  // Change to 'SANDBOX' for testing

// Generate unique order ID
const generateOrderId = () => `ORDER_${Date.now()}`;

// Check if order ID is unique (dummy function, replace with actual logic)
const isOrderIdUnique = async (orderId) => {
    // Query your database to check for the existence of the order ID
    const existingOrder = await cashFreeModel.findOne({ orderId });
    return !existingOrder;
};

// Create Order Route
router.post('/create-order', async (req, res) => {
    const { orderAmount, customerName, customerEmail, customerPhone, productName } = req.body;

    // Validate input
    if (!orderAmount || !customerName || !customerEmail || !customerPhone) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    let orderId = generateOrderId();
    while (!(await isOrderIdUnique(orderId))) {
        orderId = generateOrderId(); // Regenerate if not unique
    }

    const payload = {
        orderId,
        orderAmount,
        customerName,
        customerEmail,
        customerPhone,
        productName,
        order_currency: "INR",
        order_id: orderId,
        order_amount: orderAmount,
        customer_details: {
            customer_id: customerPhone,
            customer_phone: customerPhone,
        },
        returnUrl: 'https://your-frontend.com/payment-success',
        // notifyUrl: 'https://your-backend.com/payment-webhook',
    };

    try {
        // Save order to the database
        const newOrder = new cashFreeModel(payload);
        await newOrder.save();

        // Request to Cashfree API for payment token
        const sandboxUrl = 'https://sandbox.cashfree.com/pg/orders';
        const pgUrl = 'https://api.cashfree.com/pg/orders';
        const response = await axios.post(`${sandboxUrl}`, payload, {
            headers: {
                'Content-Type': 'application/json',
                'x-client-id': process.env.CASHFREE_APP_ID,
                'x-client-secret': process.env.CASHFREE_APP_SECRET,
                'Cashfree.XEnvironment': Cashfree.Environment.SANDBOX, // Change to 'PRODUCTION' if needed
                'x-api-version': '2023-08-01',
            },
        });

        // Respond with the payment token and order ID
        res.json({
            sessionId: response.data.payment_session_id,
            paymentToken: response.data.cftoken,
            orderId: orderId,
        });
        console.log('Session ID:', response.data.payment_session_id);
        // console.log('Payment Token:', response.data.cftoken);

    } catch (error) {
        console.error('Error creating order:', error.response?.data || error.message);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
});

module.exports = router;
