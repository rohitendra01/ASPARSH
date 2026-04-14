const userRepository = require('../repositories/userRepository');

exports.validateAndRegisterUser = async (data) => {
    const { name, email, password, confirmPassword } = data;
    const errors = {};

    if (!name) errors.name = 'Name is required';
    if (!email) errors.email = 'Email is required';
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Invalid email address';
    if (!password) errors.password = 'Password is required';
    if (password && password.length < 6) errors.password = 'Password must be at least 6 characters';
    if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match';

    if (email && !errors.email) {
        const existingUser = await userRepository.findUserByEmail(email);
        if (existingUser) errors.email = 'Email already registered';
    }

    let username = name;
    if (!username && email) {
        username = email.split('@')[0];
    }

    if (username) {
        const existingUsername = await userRepository.findUserByUsername(username);
        if (existingUsername) errors.name = 'Username already taken';
    }

    if (Object.keys(errors).length > 0) {
        return { success: false, errors };
    }

    const user = await userRepository.createUser({ username, email: email.toLowerCase(), password });
    return { success: true, user };
};

exports.manageLoginSession = async (user, newSessionId, sessionStore) => {
    if (user.currentSessionId && sessionStore && typeof sessionStore.destroy === 'function') {
        await new Promise((resolve) => sessionStore.destroy(user.currentSessionId, () => resolve()));
    }

    await userRepository.updateUserSession(user._id, newSessionId);
};