const userService = require('../services/userService');

exports.register = async(req,res) =>{
    try{
        const{email,password,phone_number,role,name} =req.body;
        const result = await userService.register({email,password,name,phone_number,role});
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