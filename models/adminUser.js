const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
        minlength: [6, 'Password must be at least 6 characters'],
        select: false
    },
    image: {
        type: String,
        default: ''
    },
    role: {
        type: String,
        enum: ['superadmin', 'admin', 'manager'],
        default: 'admin'
    },
    currentSessionId: {
        type: String,
        default: null,
        select: false
    },
    slug: {
        type: String,
        index: true,
        unique: true
    },
    isDeleted: {
        type: Boolean,
        default: false,
        index: true
    },
    deletedAt: {
        type: Date,
        default: null
    },
    lastLoginAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});
adminUserSchema.pre(/^find/, function (next) {
    if (this.getFilter().isDeleted === undefined) {
        this.where({ isDeleted: false });
    }
    next();
});

adminUserSchema.pre('save', async function (next) {
    if (this.isModified('username')) {
        let baseSlug = this.username
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');
        let slug = baseSlug;
        let count = 0;

        while (await mongoose.models.AdminUser.findOne({ slug, _id: { $ne: this._id } }).select('_id')) {
            count++;
            slug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;
        }
        this.slug = slug;
    }
    next();
});

adminUserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

adminUserSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

adminUserSchema.methods.softDelete = async function () {
    this.isDeleted = true;
    this.deletedAt = new Date();
    return this.save();
};

module.exports = mongoose.model('AdminUser', adminUserSchema);