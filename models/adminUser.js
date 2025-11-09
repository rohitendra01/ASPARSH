const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { isEmail } = require('validator');

const adminUserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters long']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/.+@.+\..+/, 'Please enter a valid email address'] 
    },
    password: {
        type: String,
        required: [true, 'Please enter a password'],
        minlength: [6, 'Password must be at least 6 characters']
    },
    image: {
        type: String, 
        default: ''
    },
    currentSessionId: {
        type: String,
        default: null,
    },
    slug: {
        type: String,
        index: true,
        unique: true
    }
}, {
    timestamps: true
});

// Slug generation middleware
adminUserSchema.pre('save', async function(next) {
    if (this.isModified('username')) {
        let baseSlug = this.username
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');
        let slug = baseSlug;
        let count = 0;
        while (await this.constructor.findOne({ slug, _id: { $ne: this._id } })) {
            count++;
            slug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;
        }
        this.slug = slug;
    }
    next();
});

adminUserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(7);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

adminUserSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

const AdminUser = mongoose.model('AdminUser', adminUserSchema);

module.exports = AdminUser;
