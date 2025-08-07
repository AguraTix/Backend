const { Food } = require('../models');

exports.createFood = async (req, res) => {
  try {
    const { foodname, quantity, foodprice, fooddescription, admin_id } = req.body;
    const foodimage = req.file ? `/uploads/${req.file.filename}` : null;

    // Validate required fields
    if (!foodname || typeof foodname !== 'string' || foodname.trim() === '') {
      return res.status(400).json({ error: 'Valid food name is required' });
    }
    if (quantity === undefined || quantity === null || isNaN(quantity) || quantity < 0) {
      return res.status(400).json({ error: 'Valid non-negative quantity is required' });
    }
    if (foodprice === undefined || foodprice === null || isNaN(foodprice) || foodprice < 0) {
      return res.status(400).json({ error: 'Valid non-negative food price is required' });
    }
    if (!admin_id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(admin_id)) {
      return res.status(400).json({ error: 'Valid admin ID (UUID) is required' });
    }

    const food = await Food.create({
      foodname: foodname.trim(),
      quantity: parseInt(quantity),
      foodprice: parseFloat(foodprice),
      foodimage,
      fooddescription: fooddescription || null,
      admin_id,
      createdat: new Date(),
      updatedat: new Date()
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
    res.status(200).json({ foods });
  } catch (error) {
    console.error('Error fetching foods:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getFoodById = async (req, res) => {
  try {
    const { id } = req.params;
    const food = await Food.findByPk(id);
    if (!food) {
      return res.status(404).json({ error: 'Food item not found' });
    }
    res.status(200).json({ food });
  } catch (error) {
    console.error('Error fetching food:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateFood = async (req, res) => {
  try {
    const { id } = req.params;
    const { foodname, quantity, foodprice, fooddescription, admin_id } = req.body;
    const foodimage = req.file ? `/uploads/${req.file.filename}` : null;

    const food = await Food.findByPk(id);
    if (!food) {
      return res.status(404).json({ error: 'Food item not found' });
    }

    // Validate required fields
    if (!foodname || typeof foodname !== 'string' || foodname.trim() === '') {
      return res.status(400).json({ error: 'Valid food name is required' });
    }
    if (quantity === undefined || quantity === null || isNaN(quantity) || quantity < 0) {
      return res.status(400).json({ error: 'Valid non-negative quantity is required' });
    }
    if (foodprice === undefined || foodprice === null || isNaN(foodprice) || foodprice < 0) {
      return res.status(400).json({ error: 'Valid non-negative food price is required' });
    }
    if (!admin_id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(admin_id)) {
      return res.status(400).json({ error: 'Valid admin ID (UUID) is required' });
    }

    await food.update({
      foodname: foodname.trim(),
      quantity: parseInt(quantity),
      foodprice: parseFloat(foodprice),
      foodimage: foodimage || food.foodimage,
      fooddescription: fooddescription || food.fooddescription,
      admin_id,
      updatedat: new Date()
    });

    res.status(200).json({
      message: 'Food item updated successfully',
      food
    });
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
      return res.status(404).json({ error: 'Food item not found' });
    }
    await food.destroy();
    res.status(200).json({ message: 'Food item deleted successfully' });
  } catch (error) {
    console.error('Error deleting food:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};