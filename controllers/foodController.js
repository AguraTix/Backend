 const { Food } = require('../models');
 
 exports.createFood = async (req, res) => {
   try {
     const { foodname, quantity, foodprice, fooddescription } = req.body;
     const admin_id = req.user?.user_id; // From JWT token
     
     // Handle image from memory storage
     let foodimage = null;
     if (req.file) {
       foodimage = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
     }
 
     // Basic request logging
     console.log('Request body:', req.body);
     console.log('Request file:', req.file);
 
     // Validate required fields
     if (!foodname || typeof foodname !== 'string' || foodname.trim() === '') {
       return res.status(400).json({ error: 'Valid food name is required' });
     }
     if (quantity === undefined || quantity === null || isNaN(quantity) || Number(quantity) < 0) {
       return res.status(400).json({ error: 'Valid non-negative quantity is required' });
     }
     if (foodprice === undefined || foodprice === null || isNaN(foodprice) || Number(foodprice) < 0) {
       return res.status(400).json({ error: 'Valid non-negative food price is required' });
     }
     if (!admin_id) {
       return res.status(401).json({ error: 'Unauthorized: missing admin ID' });
     }
 
     const food = await Food.create({
       foodname: foodname.trim(),
       quantity: parseInt(quantity, 10),
       foodprice: parseFloat(foodprice),
       foodimage,
       fooddescription: fooddescription || null,
       admin_id
     });
 
     res.status(201).json({
       message: 'Food item created successfully',
       food
     });
   } catch (error) {
     console.error('Error creating food:', error);
     res.status(500).json({ error: 'Internal server error' });
   }
 };
 
 exports.getAllFoods = async (req, res) => {
   try {
     const foods = await Food.findAll();
     res.status(200).json({
       message: 'Foods retrieved successfully',
       foods
     });
   } catch (error) {
     console.error('Error fetching foods:', error);
     res.status(500).json({ error: error.message });
   }
 };

// Get foods by event ID (for menu items)
exports.getFoodsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // For now, return all foods since we don't have event-food relationship
    // You can modify this later when you add event-food associations
    const foods = await Food.findAll();
    
    res.status(200).json({
      message: 'Foods retrieved successfully',
      foods,
      eventId
    });
  } catch (error) {
    console.error('Error fetching foods by event:', error);
    res.status(500).json({ error: error.message });
  }
};
 
 exports.getFoodById = async (req, res) => {
   try {
     const { id } = req.params; // route uses :id
     const food = await Food.findByPk(id);
     if (!food) {
       throw new Error('Food item not found');
     }
     res.status(200).json({ message: 'Food retrieved successfully', food });
   } catch (error) {
     console.error('Error fetching food:', error);
     res.status(404).json({ error: error.message });
   }
 };
 
 exports.updateFood = async (req, res) => {
   try {
     const { id } = req.params;
     const { foodname, quantity, foodprice, fooddescription } = req.body;
     const admin_id = req.user?.user_id; // From JWT token
     
     // Handle image from memory storage
     let newFoodImage = null;
     if (req.file) {
       newFoodImage = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
     }
 
     // Basic request logging
     console.log('Request body:', req.body);
     console.log('Request file:', req.file);
 
     // Validate required fields
     if (!foodname || typeof foodname !== 'string' || foodname.trim() === '') {
       return res.status(400).json({ error: 'Valid food name is required' });
     }
     if (quantity === undefined || quantity === null || isNaN(quantity) || Number(quantity) < 0) {
       return res.status(400).json({ error: 'Valid non-negative quantity is required' });
     }
     if (foodprice === undefined || foodprice === null || isNaN(foodprice) || Number(foodprice) < 0) {
       return res.status(400).json({ error: 'Valid non-negative food price is required' });
     }
     if (!admin_id) {
       return res.status(401).json({ error: 'Unauthorized: missing admin ID' });
     }
 
     const food = await Food.findByPk(id);
     if (!food) {
       return res.status(404).json({ error: 'Food item not found' });
     }
 
     await food.update({
       foodname: foodname.trim(),
       quantity: parseInt(quantity, 10),
       foodprice: parseFloat(foodprice),
       foodimage: newFoodImage || food.foodimage,
       fooddescription: fooddescription ?? food.fooddescription,
       admin_id
     });
 
     res.status(200).json({ message: 'Food item updated successfully', food });
   } catch (error) {
     console.error('Error updating food:', error);
     res.status(500).json({ error: 'Internal server error' });
   }
 };
 
 exports.deleteFood = async (req, res) => {
   try {
     const { id } = req.params;
 
     const food = await Food.findByPk(id);
     if (!food) {
       throw new Error('Food item not found');
     }
 
     await food.destroy();
     res.status(200).json({ message: 'Food item deleted successfully' });
   } catch (error) {
     console.error('Error deleting food:', error);
     res.status(400).json({ error: error.message });
   }
 };