const Newsletter = require('../models/Newsletter');
const nodemailer = require('nodemailer');
const validator = require('validator');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD
    }
});

const generateBrowserFingerprint = (req) => {
    const userAgent = req.get('User-Agent') || '';
    const acceptLanguage = req.get('Accept-Language') || '';
    const acceptEncoding = req.get('Accept-Encoding') || '';
    const ipAddress = req.ip || req.connection.remoteAddress;
    
    const fingerprint = crypto
        .createHash('sha256')
        .update(`${userAgent}${acceptLanguage}${acceptEncoding}${ipAddress}`)
        .digest('hex');
    
    return fingerprint;
};

const rateLimitStore = new Map();

const isRateLimited = (ip) => {
    const now = Date.now();
    const windowMs = 15 * 60 * 1000;
    const maxAttempts = 3;
    
    if (!rateLimitStore.has(ip)) {
        rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs });
        return false;
    }
    
    const data = rateLimitStore.get(ip);
    
    if (now > data.resetTime) {
        rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs });
        return false;
    }
    
    if (data.count >= maxAttempts) {
        return true;
    }
    
    data.count++;
    return false;
};

const newsletterSignup = async (req, res) => {
    try {
        const body = req.body || {};
        const email = body.email || (body.get && body.get('email')) || null;
        const ipAddress = req.ip || (req.connection && req.connection.remoteAddress) || req.headers['x-forwarded-for'] || 'unknown';
        const userAgent = req.get ? req.get('User-Agent') : (req.headers && req.headers['user-agent']) || '';
        
        if (!email || !validator.isEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address'
            });
        }
        
        if (isRateLimited(ipAddress)) {
            return res.status(429).json({
                success: false,
                message: 'Too many attempts. Please try again later.'
            });
        }
        
        const browserFingerprint = generateBrowserFingerprint(req);
        
        const existingSubscription = await Newsletter.isAlreadySubscribed(email, browserFingerprint);
        
        if (existingSubscription) {
            return res.status(200).json({
                success: true,
                message: 'You are already subscribed to our newsletter!',
                alreadySubscribed: true
            });
        }
        
        const verificationToken = crypto.randomBytes(32).toString('hex');
        
        const newsletter = new Newsletter({
            email,
            ipAddress,
            userAgent,
            browserFingerprint,
            verificationToken
        });
        
        await newsletter.save();
        
        await sendAdminNotification(email, ipAddress, userAgent);
        
        await sendWelcomeEmail(email, verificationToken);
        
        const token = jwt.sign(
            { 
                subscribed: true, 
                email, 
                fingerprint: browserFingerprint 
            },
            process.env.JWT_SECRET,
            { expiresIn: '365d' }
        );
        
        res.status(201).json({
            success: true,
            message: 'Successfully subscribed to newsletter!',
            token: token
        });
        
    } catch (error) {
        console.error('Newsletter signup error:', error);
        
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'This email is already subscribed to our newsletter.'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Internal server error. Please try again later.'
        });
    }
};

const checkSubscriptionStatus = async (req, res) => {
    try {
        const { token } = req.body;
        
        if (!token) {
            return res.status(200).json({ subscribed: false });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const browserFingerprint = generateBrowserFingerprint(req);
        
        if (decoded.fingerprint !== browserFingerprint) {
            return res.status(200).json({ subscribed: false });
        }
        
        const subscription = await Newsletter.findOne({
            email: decoded.email,
            browserFingerprint: decoded.fingerprint,
            isActive: true
        });
        
        res.status(200).json({
            subscribed: !!subscription,
            email: subscription ? subscription.email : null
        });
        
    } catch (error) {
        console.error('Check subscription error:', error);
        res.status(200).json({ subscribed: false });
    }
};

const sendAdminNotification = async (subscriberEmail, ipAddress, userAgent) => {
    const mailOptions = {
        from: process.env.EMAIL,
        to: process.env.ADMIN_EMAIL,
        subject: '🎉 New Newsletter Subscription - Asparsh',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h2 style="color: #333; margin-bottom: 20px; text-align: center;">
                        🎉 New Newsletter Subscription
                    </h2>
                    
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #495057; margin-top: 0;">Subscriber Details:</h3>
                        <p style="margin: 10px 0;"><strong>Email:</strong> ${subscriberEmail}</p>
                        <p style="margin: 10px 0;"><strong>IP Address:</strong> ${ipAddress}</p>
                        <p style="margin: 10px 0;"><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                        <p style="margin: 10px 0;"><strong>User Agent:</strong> ${userAgent}</p>
                    </div>
                    
                    <div style="text-align: center; margin-top: 30px;">
                        <p style="color: #6c757d; font-size: 14px;">
                            This notification was sent automatically from your Asparsh newsletter system.
                        </p>
                    </div>
                </div>
            </div>
        `
    };
    
    return transporter.sendMail(mailOptions);
};

const sendWelcomeEmail = async (email, verificationToken) => {
    const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: '🎉 Welcome to Asparsh Newsletter!',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #333; margin-bottom: 10px;">Welcome to Asparsh!</h1>
                        <p style="color: #666; font-size: 16px;">Thank you for subscribing to our newsletter</p>
                    </div>
                    
                    <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                        <h2 style="color: #28a745; margin-top: 0;">🎉 Subscription Confirmed!</h2>
                        <p style="color: #333; margin: 10px 0;">
                            You'll be the first to know about our latest NFC innovations, exclusive offers, and industry insights.
                        </p>
                    </div>
                    
                    <div style="margin: 30px 0;">
                        <h3 style="color: #333;">What to expect:</h3>
                        <ul style="color: #666; line-height: 1.6;">
                            <li>🔔 Latest product updates and features</li>
                            <li>💡 NFC technology insights and tips</li>
                            <li>🎁 Exclusive offers and discounts</li>
                            <li>📚 Industry news and trends</li>
                        </ul>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.FRONTEND_URL || 'https://asparsh.onrender.com'}" 
                           style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                            Visit Our Website
                        </a>
                    </div>
                    
                    <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center;">
                        <p style="color: #999; font-size: 12px;">
                            You can unsubscribe at any time by clicking 
                            <a href="${process.env.FRONTEND_URL || 'https://asparsh.onrender.com'}/unsubscribe?token=${verificationToken}" 
                               style="color: #007bff;">here</a>
                        </p>
                    </div>
                </div>
            </div>
        `
    };
    
    return transporter.sendMail(mailOptions);
};

const unsubscribe = async (req, res) => {
    try {
        const { token } = req.params;
        
        const subscription = await Newsletter.findOne({ verificationToken: token });
        
        if (!subscription) {
            return res.status(404).json({
                success: false,
                message: 'Invalid unsubscribe link'
            });
        }
        
        subscription.isActive = false;
        await subscription.save();
        
        res.status(200).json({
            success: true,
            message: 'Successfully unsubscribed from newsletter'
        });
        
    } catch (error) {
        console.error('Unsubscribe error:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing unsubscribe request'
        });
    }
};

module.exports = {
    newsletterSignup,
    checkSubscriptionStatus,
    unsubscribe
};
