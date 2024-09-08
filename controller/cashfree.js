const express = require('express');
const axios = require('axios');
const router = express.Router();
const cashFreeModel = require('../model/model.js');
const { Cashfree } = require("cashfree-pg");

// Initialize Cashfree with your credentials
Cashfree.XClientId = process.env.CASHFREE_APP_ID;  // Use environment variables for security
Cashfree.XClientSecret = process.env.CASHFREE_APP_SECRET;
Cashfree.XEnvironment = Cashfree.Environment.PRODUCTION;  // 'PRODUCTION' for live transactions, 'SANDBOX' for testing

// Generate unique order ID
const generateOrderId = () => `ORDER_${Date.now()}`;

// Check if order ID is unique (dummy function, replace with actual logic)
const isOrderIdUnique = async (orderId) => {
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

    // Generate unique order ID
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
        customer_details: {
            customer_id: customerPhone,  // Using phone as customer ID for simplicity
            customer_phone: customerPhone,
        },
        returnUrl: 'https://your-frontend.com/payment-success',  // Change to actual frontend URL
        // notifyUrl: 'https://your-backend.com/payment-webhook',  // Optional: Notification URL
    };

    try {
        // Save order to the database
        const newOrder = new cashFreeModel(payload);
        await newOrder.save();

        // Production URL
        const pgUrl = 'https://api.cashfree.com/pg/orders';
        
        // Request payment token from Cashfree API (using Production for now)
        const response = await axios.post(pgUrl, payload, {
            headers: {
                'Content-Type': 'application/json',
                'x-client-id': process.env.CASHFREE_APP_ID,        // Production Client ID
                'x-client-secret': process.env.CASHFREE_APP_SECRET,  // Production Client Secret
                'x-api-version': '2023-08-01',  // Ensure you're using the latest API version
            },
        });

        // Respond with payment session ID and token
        res.json({
            sessionId: response.data.payment_session_id,
            paymentToken: response.data.cftoken,
            orderId: orderId,
        });
        console.log('Session ID:', response.data.payment_session_id);
        console.log('Payment Token:', response.data.cftoken);

    } catch (error) {
        // Detailed logging for the Cashfree API error
        if (error.response) {
            console.error('Error creating order - Cashfree API responded with an error:', error.response.data);
            console.error('Status Code:', error.response.status);
            console.error('Headers:', error.response.headers);
        } else if (error.request) {
            console.error('Error creating order - No response received from Cashfree API:', error.request);
        } else {
            console.error('Error creating order - Something went wrong in setting up the request:', error.message);
        }
        console.error('Error stack trace:', error.stack);

        if (!res.headersSent) {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
});

module.exports = router;
