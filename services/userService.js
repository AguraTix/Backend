const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const validator = require('validator');

//Register a new user
exports.register = async({email,password,name,phone_number})=>{
    // Email validation
    if (!validator.isEmail(email)) {
        throw new Error('Please enter a valid email address.');
    }


    //Name validation
    if (!/(?=.*[A-Za-z/s])/.test(name)) {
        throw new Error('Please enter a valid name');
    }


    // Password validation
    if (!password || password.length < 8) {
        throw new Error('Password must be at least 8 characters long.');
    }
    if (!/(?=.*[A-Za-z])/.test(password)) {
        throw new Error('Password must contain at least one letter.');
    }
    if (!/(?=.*\d)/.test(password)) {
        throw new Error('Password must contain at least one number.');
    }


    // Phone number validation
    if (!phone_number || !/^[0-9+\-() ]{10,20}$/.test(phone_number)) {
        throw new Error('Please enter a valid phone number');
    }

    const existingUser = await User.findOne({where: { email }})
    if(existingUser) {
        throw new Error('Email already exists')
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const user = await User.create({
            email,
            password:hashedPassword,
            name,
            phone_number,
        });
        return {message: 'User registered successfully', user_id: user.user_id};
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
    // Email validation
    if (!validator.isEmail(email)) {
        throw new Error('Please enter a valid email address.');
    }


    //Name validation
    if (!/(?=.*[A-Za-z/s])/.test(name)) {
        throw new Error('Please enter a valid name');
    }


    // Password validation
    if (!password || password.length < 8) {
        throw new Error('Password must be at least 8 characters long.');
    }
    if (!/(?=.*[A-Za-z])/.test(password)) {
        throw new Error('Password must contain at least one letter.');
    }
    if (!/(?=.*\d)/.test(password)) {
        throw new Error('Password must contain at least one number.');
    }


    // Phone number validation
    if (!phone_number || !/^[0-9+\-() ]{10,20}$/.test(phone_number)) {
        throw new Error('Please enter a valid phone number');
    }

    const existingUser = await User.findOne({where: { email }})
    if(existingUser) {
        throw new Error('Email already exists')
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const user = await User.create({
            email,
            password:hashedPassword,
            name,
            phone_number,
            role:'Admin'
        });
        return {message: 'User registered successfully', user_id: user.user_id};
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

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
        throw new Error('Incorrect password. Please try again');
    }

    const token = jwt.sign({ user_id: user.user_id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return {
        message: 'Login successful',
        token,
        user: {
            user_id: user.user_id,
            email: user.email,
            name: user.name,
            role: user.role,
        },
    };
};

exports.updateUserRole = async (userId, role) => {
  const user = await User.findByPk(userId);
  if (!user) throw new Error('User not found');
  user.role = role;
  await user.save();
  return user;
};