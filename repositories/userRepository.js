const AdminUser = require('../models/adminUser');

exports.findUserByEmail = (email) => {
    return AdminUser.findOne({ email: email.toLowerCase() });
};

exports.findUserByUsername = (username) => {
    return AdminUser.findOne({ username });
};

exports.createUser = (userData) => {
    const user = new AdminUser(userData);
    return user.save();
};

exports.updateUserSession = (userId, sessionId) => {
    return AdminUser.findByIdAndUpdate(userId, { currentSessionId: sessionId });
};

exports.updateUserPassword = async (email, newPassword) => {
    const user = await AdminUser.findOne({ email }).select('+password');
    if (!user) throw new Error('User not found');
    user.password = newPassword;
    return user.save();
};

exports.findUserByIdentifier = async (identifier) => {
    let user = await AdminUser.findOne({ slug: identifier });
    if (!user && identifier.match(/^[0-9a-fA-F]{24}$/)) {
        user = await AdminUser.findById(identifier);
    }
    return user;
};

exports.findUserDocumentByIdentifier = async (identifier) => {
    let user = await AdminUser.findOne({ slug: identifier });
    if (!user && identifier.match(/^[0-9a-fA-F]{24}$/)) {
        user = await AdminUser.findById(identifier);
    }
    return user;
};