const transporter = require('../mailer');

exports.sendAdminNotification = async (subscriberEmail, ipAddress, userAgent) => {
    const mailOptions = {
        from: process.env.EMAIL,
        to: process.env.ADMIN_EMAIL,
        subject: '🎉 New Newsletter Subscription - Asparsh',
        html: `<h2>New Subscription</h2><p>Email: ${subscriberEmail}</p><p>IP: ${ipAddress}</p>` // Truncated for brevity, use your full HTML here
    };
    return transporter.sendMail(mailOptions);
};

exports.sendWelcomeEmail = async (email, verificationToken) => {
    const frontendUrl = process.env.FRONTEND_URL || 'https://asparsh.onrender.com';
    const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: '🎉 Welcome to Asparsh Newsletter!',
        html: `<h2>Welcome!</h2><p>Click <a href="${frontendUrl}/unsubscribe?token=${verificationToken}">here</a> to unsubscribe.</p>` // Truncated for brevity, use your full HTML here
    };
    return transporter.sendMail(mailOptions);
};