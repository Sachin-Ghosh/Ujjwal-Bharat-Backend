const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');

const adminSchema = new Schema({
    name: { type: String, required: true },
    email: {
        type: String,
        unique: true,
        trim: true,
        lowercase: true,
        match: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        required: true,
    },
    password: {
        type: String,
        required: true,
        select: false,
    },
    role: {
        type: String,
        enum: ['super_admin', 'admin', 'moderator'],
        default: 'admin'
    },
    permissions: {
        users: {
            create: { type: Boolean, default: false },
            read: { type: Boolean, default: true },
            update: { type: Boolean, default: false },
            delete: { type: Boolean, default: false }
        },
        vendors: {
            create: { type: Boolean, default: false },
            read: { type: Boolean, default: true },
            update: { type: Boolean, default: false },
            delete: { type: Boolean, default: false },
            approve: { type: Boolean, default: false }
        },
        products: {
            create: { type: Boolean, default: false },
            read: { type: Boolean, default: true },
            update: { type: Boolean, default: false },
            delete: { type: Boolean, default: false }
        },
        orders: {
            read: { type: Boolean, default: true },
            update: { type: Boolean, default: false },
            cancel: { type: Boolean, default: false }
        },
        categories: {
            create: { type: Boolean, default: false },
            read: { type: Boolean, default: true },
            update: { type: Boolean, default: false },
            delete: { type: Boolean, default: false }
        },
        analytics: { type: Boolean, default: false }
    },
    lastLogin: { type: Date },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

adminSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

adminSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Automatically give super admins full permissions
adminSchema.pre('save', function (next) {
    if (this.role === 'super_admin') {
        this.permissions = {
            users: {
                create: true, read: true, update: true, delete: true
            },
            vendors: {
                create: true, read: true, update: true, delete: true, approve: true
            },
            products: {
                create: true, read: true, update: true, delete: true
            },
            orders: {
                read: true, update: true, cancel: true
            },
            categories: {
                create: true, read: true, update: true, delete: true
            },
            analytics: true
        };
    }
    next();
});

module.exports = mongoose.model('Admin', adminSchema);