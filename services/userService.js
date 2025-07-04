const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const validator = require('validator');

//Register a new user
exports.register = async({email,password,name,phone_number})=>{
    if (!validator.isEmail(email)) {
        throw new Error('Invalid email format');
    }
    
    if (!password || password.length < 6) {
        throw new Error('Password must be at least 6 characters');
    }

    if (!phone_number || !validator.isMobilePhone(phone_number + '')) {
        throw new Error('Invalid phone number format');
    }

    const existingUser = await User.findOne({where: { email }})

    if(existingUser) {
        throw new Error('Email already exists')
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
        email,
        password:hashedPassword,
        name,
        phone_number,
        role:'Attendee'
    });

    return {message: 'User registered successfully', user_id: user.user_id};
}

exports.login = async({email,password})=> {
    const user = await User.findOne({where : { email } });

    if(!user){
        throw new Error('Invalid email. Please check and try again');

    }

    const isValidPassword = await bcrypt.compare(password,user.password);
    if(!isValidPassword){
        throw new Error('Incorrect password.Please try again')

    }
    const token = jwt.sign({user_id: user.user_id, role:user.role},process.env.JWT_SECRET,{expiresIn: '1h'});
    return { message:'Login successful',
        token,
        user: {
            user_id: user.user_id,
            email: user.email,
            name: user.name,
            role: user.role,
    },};
}

exports.updateUserRole = async (userId, role) => {
  const user = await User.findByPk(userId);
  if (!user) throw new Error('User not found');
  user.role = role;
  await user.save();
  return user;
};