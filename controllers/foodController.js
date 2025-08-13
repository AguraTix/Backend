 const { Food, Event } = require('../models');
 
 exports.createFood = async (req, res) => {
   try {
     const { foodname, quantity, foodprice, fooddescription, event_id } = req.body;
     const admin_id = req.user?.user_id; // From JWT token
     const foodimage = req.file ? `/uploads/${req.file.filename}` : null;
 
     // Basic request logging
     console.log('Request body:', req.body);
     console.log('Request file:', req.file);
 
     // Validate required fields
     if (!foodname || typeof foodname !== 'string' || foodname.trim() === '') {
       throw new Error('Valid food name is required');
     }
     if (quantity === undefined || quantity === null || isNaN(quantity) || Number(quantity) < 0) {
       throw new Error('Valid non-negative quantity is required');
     }
     if (foodprice === undefined || foodprice === null || isNaN(foodprice) || Number(foodprice) < 0) {
       throw new Error('Valid non-negative food price is required');
     }
     if (!event_id) {
       throw new Error('Event ID is required');
     }
     if (!admin_id) {
       throw new Error('Unauthorized: missing admin ID');
     }

     // Validate event exists and admin owns it
     const event = await Event.findByPk(event_id);
     if (!event) {
       throw new Error('Event not found');
     }
     if (event.admin_id !== admin_id) {
       throw new Error('Unauthorized: You can only add foods to your own events');
     }

          const food = await Food.create({
       foodname: foodname.trim(),
       quantity: parseInt(quantity, 10),
       foodprice: parseFloat(foodprice),
       foodimage,
       fooddescription: fooddescription || null,
       event_id,
       admin_id
     });

     // Process food to ensure proper image URL
     const foodData = food.toJSON();
     
     // Ensure foodimage has full path if it exists
     if (foodData.foodimage && !foodData.foodimage.startsWith('http')) {
       foodData.foodimage = `${req.protocol}://${req.get('host')}${foodData.foodimage}`;
     }

     res.status(201).json({
       message: 'Food item created successfully',
       food: foodData
     });
   } catch (error) {
     console.error('Error creating food:', error);
     res.status(400).json({ error: error.message });
   }
 };
 
 exports.getAllFoods = async (req, res) => {
   try {
     const foods = await Food.findAll({
       include: [
         {
           model: Event,
           as: 'Event',
           attributes: ['event_id', 'title', 'date']
         }
       ]
     });
     
     // Process foods to ensure proper image URLs
     const processedFoods = foods.map(food => {
       const foodData = food.toJSON();
       
       // Ensure foodimage has full path if it exists
       if (foodData.foodimage && !foodData.foodimage.startsWith('http')) {
         foodData.foodimage = `${req.protocol}://${req.get('host')}${foodData.foodimage}`;
       }
       
       return foodData;
     });
     
     res.status(200).json({
       message: 'Foods retrieved successfully',
       foods: processedFoods
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
    
    // Get foods that belong to this specific event
    const foods = await Food.findAll({
      where: { event_id: eventId },
      include: [
        {
          model: Event,
          as: 'Event',
          attributes: ['event_id', 'title', 'date']
        }
      ]
    });
    
    // Process foods to ensure proper image URLs
    const processedFoods = foods.map(food => {
      const foodData = food.toJSON();
      
      // Ensure foodimage has full path if it exists
      if (foodData.foodimage && !foodData.foodimage.startsWith('http')) {
        foodData.foodimage = `${req.protocol}://${req.get('host')}${foodData.foodimage}`;
      }
      
      return foodData;
    });
    
    res.status(200).json({
      message: 'Event foods retrieved successfully',
      foods: processedFoods,
      eventId,
      count: processedFoods.length
    });
  } catch (error) {
    console.error('Error fetching foods by event:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get foods that are not assigned to any event (general menu)
exports.getGeneralFoods = async (req, res) => {
  try {
    const foods = await Food.findAll({
      where: { event_id: null },
      include: [
        {
          model: Event,
          as: 'Event',
          attributes: ['event_id', 'title', 'date']
        }
      ]
    });
    
    // Process foods to ensure proper image URLs
    const processedFoods = foods.map(food => {
      const foodData = food.toJSON();
      
      // Ensure foodimage has full path if it exists
      if (foodData.foodimage && !foodData.foodimage.startsWith('http')) {
        foodData.foodimage = `${req.protocol}://${req.get('host')}${foodData.foodimage}`;
      }
      
      return foodData;
    });
    
    res.status(200).json({
      message: 'General foods retrieved successfully',
      foods: processedFoods,
      count: processedFoods.length
    });
  } catch (error) {
    console.error('Error fetching general foods:', error);
    res.status(500).json({ error: error.message });
  }
};
 
 exports.getFoodById = async (req, res) => {
   try {
     const { id } = req.params; // route uses :id
     const food = await Food.findByPk(id, {
       include: [
         {
           model: Event,
           as: 'Event',
           attributes: ['event_id', 'title', 'date']
         }
       ]
     });
     if (!food) {
       throw new Error('Food item not found');
     }
     
     // Process food to ensure proper image URL
     const foodData = food.toJSON();
     
     // Ensure foodimage has full path if it exists
     if (foodData.foodimage && !foodData.foodimage.startsWith('http')) {
       foodData.foodimage = `${req.protocol}://${req.get('host')}${foodData.foodimage}`;
     }
     
     res.status(200).json({ message: 'Food retrieved successfully', food: foodData });
   } catch (error) {
     console.error('Error fetching food:', error);
     res.status(404).json({ error: error.message });
   }
 };
 
 exports.updateFood = async (req, res) => {
   try {
     const { id } = req.params;
     const { foodname, quantity, foodprice, fooddescription, event_id } = req.body;
     const admin_id = req.user?.user_id; // From JWT token
     const newFoodImage = req.file ? `/uploads/${req.file.filename}` : null;
 
     // Basic request logging
     console.log('Request body:', req.body);
     console.log('Request file:', req.file);
 
     // Validate required fields
     if (!foodname || typeof foodname !== 'string' || foodname.trim() === '') {
       throw new Error('Valid food name is required');
     }
     if (quantity === undefined || quantity === null || isNaN(quantity) || Number(quantity) < 0) {
       throw new Error('Valid non-negative quantity is required');
     }
     if (foodprice === undefined || foodprice === null || isNaN(foodprice) || Number(foodprice) < 0) {
       throw new Error('Valid non-negative food price is required');
     }
     if (!event_id) {
       throw new Error('Event ID is required');
     }
     if (!admin_id) {
       throw new Error('Unauthorized: missing admin ID');
     }

     // Validate event exists and admin owns it
     const event = await Event.findByPk(event_id);
     if (!event) {
       throw new Error('Event not found');
     }
     if (event.admin_id !== admin_id) {
       throw new Error('Unauthorized: You can only add foods to your own events');
     }
 
     const food = await Food.findByPk(id);
     if (!food) {
       throw new Error('Food item not found');
     }

          await food.update({
       foodname: foodname.trim(),
       quantity: parseInt(quantity, 10),
       foodprice: parseFloat(foodprice),
       foodimage: newFoodImage || food.foodimage,
       fooddescription: fooddescription ?? food.fooddescription,
       event_id,
       admin_id
     });

     // Refresh the food data to get updated values
     await food.reload();
     
     // Process food to ensure proper image URL
     const foodData = food.toJSON();
     
     // Ensure foodimage has full path if it exists
     if (foodData.foodimage && !foodData.foodimage.startsWith('http')) {
       foodData.foodimage = `${req.protocol}://${req.get('host')}${foodData.foodimage}`;
     }

     res.status(200).json({ message: 'Food item updated successfully', food: foodData });
   } catch (error) {
     console.error('Error updating food:', error);
     res.status(400).json({ error: error.message });
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