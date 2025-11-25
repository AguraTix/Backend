const userService = require('../services/userService');
const emailVerificationService = require('../services/emailVerificationService');

exports.register = async(req,res) =>{
    try{
        const{email,password,phone_number,name} =req.body;
        const result = await userService.register({email,password,name,phone_number});
        res.status(201).json({
          message: result.message,
          user_id: result.user_id,
          email_verified: result.email_verified
        });
    }catch(error){
        res.status(400).json({error:error.message});
    }
};
exports.registerAdmin = async(req,res) =>{
    try{
        const{email,password,phone_number,name} =req.body;
        const result = await userService.registerAdmin({email,password,name,phone_number});
        res.status(201).json({
          message: result.message,
          user_id: result.user_id,
          email_verified: result.email_verified
        });
    }catch(error){
        res.status(400).json({error:error.message});
    }
};

exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body;
    const result = await userService.login({ identifier, password });
    res.json({ 
      message: result.message,
      token: result.token,
      user: result.user 
    });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const userId = req.params.id;
    const { role } = req.body;
    if (!['Admin', 'Attendee', 'SuperAdmin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    const result = await userService.updateUserRole(userId, role);
    res.json({ message: 'User role updated', user: result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// SuperAdmin creates Admin account
exports.createAdminBySuperAdmin = async (req, res) => {
  try {
    console.log('Creating admin by SuperAdmin...');
    console.log('Request body:', req.body);
    console.log('SuperAdmin ID:', req.user?.user_id);

    const { email, name, phone_number, expires_at } = req.body;
    const superAdminId = req.user.user_id;

    if (!email || !name || !expires_at) {
      return res.status(400).json({ error: 'Email, name and expiration date are required' });
    }
    
    console.log('Creating admin account...');
    const result = await userService.createAdminBySuperAdmin({
      email,
      name,
      phone_number,
      superAdminId,
      expires_at
    });

    console.log('Admin account created:', result.user_id);

    // Try to send email, but don't fail if email fails
    try {
      console.log('Sending email to admin...');
      const emailService = require('../services/emailService');
      await emailService.sendAdminCreationEmail({
        email: result.email,
        name: result.name,
        verificationCode: result.verificationCode,
        tempPassword: result.tempPassword,
        expiresAt: result.expires_at
      });
      console.log('Email sent successfully');

      res.status(201).json({
        message: 'Admin account created and login email sent successfully',
        user_id: result.user_id,
        email: result.email,
        name: result.name,
        tempPassword: result.tempPassword, // Include in response for testing
        verificationCode: result.verificationCode, // Include in response for testing
        expires_at: result.expires_at
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError.message);
      // Still return success but indicate email failed
      res.status(201).json({
        message: 'Admin account created but email sending failed',
        user_id: result.user_id,
        email: result.email,
        name: result.name,
        tempPassword: result.tempPassword,
        verificationCode: result.verificationCode,
        expires_at: result.expires_at,
        emailError: emailError.message,
        note: 'Please provide these credentials to the admin manually'
      });
    }
  } catch (error) {
    console.error('Error creating admin:', error);
    res.status(400).json({ 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get all admins created by this SuperAdmin
exports.getMyAdmins = async (req, res) => {
  try {
    const superAdminId = req.user.user_id;
    const admins = await userService.getAdminsBySuperAdmin(superAdminId);
    res.json({ admins });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all admins (SuperAdmin only)
exports.getAllAdmins = async (req, res) => {
  try {
    const admins = await userService.getAllAdmins();
    res.json({ admins });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateAdminBySuperAdmin = async (req, res) => {
  try {
    const adminId = req.params.id;
    const updates = req.body;
    const superAdminId = req.user.user_id;

    const result = await userService.updateAdminBySuperAdmin({
      adminId,
      superAdminId,
      updates
    });

    res.json({ message: 'Admin updated successfully', user: result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateOwnProfile = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const updates = req.body;
    const result = await userService.updateOwnProfile({ userId, updates });
    res.json({ message: 'Profile updated successfully', user: result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateSuperAdminProfile = async (req, res) => {
  try {
    const superAdminId = req.user.user_id;
    const updates = req.body;
    const result = await userService.updateSuperAdminProfile({ superAdminId, updates });
    res.json({ message: 'SuperAdmin profile updated successfully', user: result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.sendEmailVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    const result = await emailVerificationService.sendVerificationEmail(email, null);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: 'Email and verification code are required' });
    }
    const result = await emailVerificationService.verifyEmail(email, code);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    const result = await emailVerificationService.resendVerificationEmail(email);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};