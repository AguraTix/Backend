const userService = require('../services/userService');

exports.register = async(req,res) =>{
    try{
        const{email,password,phone_number,name} =req.body;
        const result = await userService.register({email,password,name,phone_number});
        res.status(201).json({message:'User created successful',user_id:result.user_id});
    }catch(error){
        res.status(400).json({error:error.message});
    }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await userService.login({ email, password });
    res.json({ token: result.token });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const userId = req.params.id;
    const { role } = req.body;
    if (!['Admin', 'Attendee'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    const result = await userService.updateUserRole(userId, role);
    res.json({ message: 'User role updated', user: result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};