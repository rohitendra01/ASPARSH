const crypto = require('crypto');

exports.generateBrowserFingerprint = (req) => {
    const userAgent = req.get('User-Agent') || '';
    const acceptLanguage = req.get('Accept-Language') || '';
    const acceptEncoding = req.get('Accept-Encoding') || '';
    const ipAddress = req.ip || req.connection?.remoteAddress || '';

    return crypto
        .createHash('sha256')
        .update(`${userAgent}${acceptLanguage}${acceptEncoding}${ipAddress}`)
        .digest('hex');
};