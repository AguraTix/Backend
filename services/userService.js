const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const validator = require('validator');
const emailVerificationService = require('./emailVerificationService');

const NAME_REGEX = /(?=.*[A-Za-z\s])/;
const PHONE_REGEX = /^[0-9+\-() ]{10,20}$/;

const generateTempPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

const generateVerificationCode = () => Math.floor(100000 + Math.random() * 900000).toString();

const ensureValidEmail = (email) => {
    const trimmed = email ? email.trim() : '';
    if (!validator.isEmail(trimmed)) {
        throw new Error('Please enter a valid email address.');
    }
    return trimmed;
};

const ensureValidName = (name) => {
    const trimmed = name ? name.trim() : '';
    if (!trimmed || !NAME_REGEX.test(trimmed)) {
        throw new Error('Please enter a valid name');
    }
    return trimmed;
};

const ensureValidPassword = (password) => {
    if (!password || password.length < 8) {
        throw new Error('Password must be at least 8 characters long.');
    }
    if (!/(?=.*[A-Za-z])/.test(password)) {
        throw new Error('Password must contain at least one letter.');
    }
    if (!/(?=.*\d)/.test(password)) {
        throw new Error('Password must contain at least one number.');
    }
    return password;
};

const ensureValidPhoneNumber = (phoneNumber, { required = true } = {}) => {
    if (phoneNumber === undefined || phoneNumber === null || phoneNumber === '') {
        if (required) {
            throw new Error('Please enter a valid phone number');
        }
        return null;
    }
    const normalized = phoneNumber.toString().trim();
    if (!PHONE_REGEX.test(normalized)) {
        throw new Error('Please enter a valid phone number');
    }
    return normalized;
};

const ensureEmailUnique = async (email, excludeUserId) => {
    if (!email) return;
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser && existingUser.user_id !== excludeUserId) {
        throw new Error('Email already exists');
    }
};

const ensurePhoneUnique = async (phone_number, excludeUserId) => {
    if (!phone_number) return;
    const existingUser = await User.findOne({ where: { phone_number } });
    if (existingUser && existingUser.user_id !== excludeUserId) {
        throw new Error('Phone number already exists');
    }
};

const ensureFutureExpiration = (expiresAtInput, { required = true } = {}) => {
    if (!expiresAtInput) {
        if (required) {
            throw new Error('Expiration date is required');
        }
        return null;
    }
    const expirationDate = new Date(expiresAtInput);
    if (Number.isNaN(expirationDate.getTime())) {
        throw new Error('Invalid expiration date');
    }
    if (expirationDate <= new Date()) {
        throw new Error('Expiration date must be in the future');
    }
    return expirationDate;
};

const buildPublicUser = (user) => ({
    user_id: user.user_id,
    email: user.email,
    name: user.name,
    phone_number: user.phone_number,
    role: user.role,
    expires_at: user.expires_at,
    email_verified: user.email_verified,
});

const applyUserCredentialUpdates = async (user, updates, { allowExpiration = false } = {}) => {
    const { email, name, phone_number, new_password, expires_at } = updates;

    if (email && email !== user.email) {
        const normalizedEmail = ensureValidEmail(email);
        await ensureEmailUnique(normalizedEmail, user.user_id);
        user.email = normalizedEmail;
    }

    if (name) {
        user.name = ensureValidName(name);
    }

    if (phone_number !== undefined) {
        const normalizedPhone = ensureValidPhoneNumber(phone_number, { required: false });
        if (normalizedPhone && normalizedPhone !== user.phone_number) {
            await ensurePhoneUnique(normalizedPhone, user.user_id);
            user.phone_number = normalizedPhone;
        } else if (!normalizedPhone) {
            user.phone_number = null;
        }
    }

    if (new_password) {
        ensureValidPassword(new_password);
        user.password = await bcrypt.hash(new_password, 10);
    }

    if (allowExpiration && expires_at !== undefined) {
        if (expires_at === null) {
            user.expires_at = null;
        } else {
            user.expires_at = ensureFutureExpiration(expires_at, { required: true });
        }
    }

    await user.save();
    return buildPublicUser(user);
};

//Register a new user
exports.register = async({email,password,name,phone_number})=>{
    const normalizedEmail = ensureValidEmail(email);
    const normalizedName = ensureValidName(name);
    ensureValidPassword(password);
    const normalizedPhone = ensureValidPhoneNumber(phone_number);

    await ensureEmailUnique(normalizedEmail);
    await ensurePhoneUnique(normalizedPhone);

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const user = await User.create({
            email: normalizedEmail,
            password: hashedPassword,
            name: normalizedName,
            phone_number: normalizedPhone,
            email_verified: false,
        });

        try {
            await emailVerificationService.sendVerificationEmail(user.email, user.name);
        } catch (emailError) {
            await user.destroy();
            throw new Error(`Registration failed while sending verification email: ${emailError.message}`);
        }

        return {
            message: 'User registered successfully. Please verify your email to continue.',
            user_id: user.user_id,
            email_verified: user.email_verified,
        };
    } catch (error) {
        // Sequelize validation errors
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            // Collect all error messages
            const messages = error.errors.map(e => e.message);
            throw new Error(messages.join('; '));
        }
        throw error;
    }
}
exports.registerAdmin = async({email,password,name,phone_number})=>{
    const normalizedEmail = ensureValidEmail(email);
    const normalizedName = ensureValidName(name);
    ensureValidPassword(password);
    const normalizedPhone = ensureValidPhoneNumber(phone_number);

    await ensureEmailUnique(normalizedEmail);
    await ensurePhoneUnique(normalizedPhone);

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const user = await User.create({
            email: normalizedEmail,
            password: hashedPassword,
            name: normalizedName,
            phone_number: normalizedPhone,
            role:'Admin',
            email_verified: false,
        });

        try {
            await emailVerificationService.sendVerificationEmail(user.email, user.name);
        } catch (emailError) {
            await user.destroy();
            throw new Error(`Registration failed while sending verification email: ${emailError.message}`);
        }

        return {
            message: 'Admin registered successfully. Please verify your email to continue.',
            user_id: user.user_id,
            email_verified: user.email_verified,
        };
    } catch (error) {
        // Sequelize validation errors
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            // Collect all error messages
            const messages = error.errors.map(e => e.message);
            throw new Error(messages.join('; '));
        }
        throw error;
    }
}

exports.login = async({ identifier, password }) => {
    // Check if identifier is email or phone number
    const isEmail = validator.isEmail(identifier);

    let user;
    if (isEmail) {
        user = await User.findOne({ where: { email: identifier } });
    } else {
        user = await User.findOne({ where: { phone_number: identifier } });
    }

    if (!user) {
        throw new Error('Invalid phone number or email. Please check and try again');
    }

    if (user.role === 'Admin' && user.expires_at && new Date(user.expires_at) <= new Date()) {
        throw new Error('This admin account has expired. Please contact the SuperAdmin.');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
        throw new Error('Incorrect password. Please try again');
    }

    if (user.role !== 'SuperAdmin' && !user.email_verified) {
        // Attempt to resend verification email so the user can complete verification
        try {
            await emailVerificationService.sendVerificationEmail(user.email, user.name);
        } catch (verificationError) {
            console.error('Failed to resend verification email on login attempt:', verificationError.message);
        }
        throw new Error('Please verify your email before logging in. A new verification code has been sent to your inbox.');
    }

    const token = jwt.sign({ user_id: user.user_id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    return {
        message: 'Login successful',
        token,
        user: buildPublicUser(user),
    };
};

exports.updateUserRole = async (userId, role) => {
  const user = await User.findByPk(userId);
  if (!user) throw new Error('User not found');
  user.role = role;
  await user.save();
  return user;
};

exports.createAdminBySuperAdmin = async ({ email, name, phone_number, superAdminId, expires_at }) => {
    if (!superAdminId) {
        throw new Error('SuperAdmin ID is required');
    }

    const superAdmin = await User.findByPk(superAdminId);
    if (!superAdmin || superAdmin.role !== 'SuperAdmin') {
        throw new Error('Only SuperAdmin can create admins');
    }

    const normalizedEmail = ensureValidEmail(email);
    const normalizedName = ensureValidName(name);
    const normalizedPhone = ensureValidPhoneNumber(phone_number, { required: false });
    const expirationDate = ensureFutureExpiration(expires_at);

    await ensureEmailUnique(normalizedEmail);
    if (normalizedPhone) {
        await ensurePhoneUnique(normalizedPhone);
    }

    const tempPassword = generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    const verificationCode = generateVerificationCode();
    const codeExpiresAt = new Date(Date.now() + 60 * 60 * 1000); 

    const user = await User.create({
        email: normalizedEmail,
        name: normalizedName,
        phone_number: normalizedPhone,
        role: 'Admin',
        password: hashedPassword,
        created_by: superAdminId,
        verificationCode,
        codeExpiresAt,
        expires_at: expirationDate
    });

    return {
        message: 'Admin account created',
        user_id: user.user_id,
        email: user.email,
        name: user.name,
        tempPassword,
        verificationCode,
        expires_at: user.expires_at
    };
};

exports.getAdminsBySuperAdmin = async (superAdminId) => {
    return User.findAll({
        where: {
            created_by: superAdminId,
            role: 'Admin'
        },
        attributes: ['user_id', 'email', 'name', 'phone_number', 'role', 'createdAt', 'expires_at']
    });
};

exports.getAllAdmins = async () => {
    return User.findAll({
        where: { role: 'Admin' },
        attributes: ['user_id', 'email', 'name', 'phone_number', 'role', 'createdAt', 'created_by', 'expires_at']
    });
};

exports.updateAdminBySuperAdmin = async ({ adminId, superAdminId, updates }) => {
    const superAdmin = await User.findByPk(superAdminId);
    if (!superAdmin || superAdmin.role !== 'SuperAdmin') {
        throw new Error('Only SuperAdmin can update admin accounts');
    }

    const admin = await User.findByPk(adminId);
    if (!admin || admin.role !== 'Admin') {
        throw new Error('Admin not found');
    }

    return applyUserCredentialUpdates(admin, updates, { allowExpiration: true });
};

exports.updateOwnProfile = async ({ userId, updates }) => {
    const user = await User.findByPk(userId);
    if (!user) {
        throw new Error('User not found');
    }
    return applyUserCredentialUpdates(user, updates);
};

exports.updateSuperAdminProfile = async ({ superAdminId, updates }) => {
    const superAdmin = await User.findByPk(superAdminId);
    if (!superAdmin || superAdmin.role !== 'SuperAdmin') {
        throw new Error('Only SuperAdmin can update this profile');
    }
    return applyUserCredentialUpdates(superAdmin, updates);
};