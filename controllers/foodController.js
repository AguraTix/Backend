const { Food } = require('../models');
const { v4: uuidv4 } = require('uuid');

exports.createFood = async (req, res) => {
  try {
    const { FoodName, Quantity, FoodPrice, FoodDescription } = req.body;
    const foodImage = req.files?.food_image?.[0];

    if (!FoodName || !Quantity || !FoodPrice) {
      return res.status(400).json({ error: 'FoodName, Quantity, and FoodPrice are required' });
    }

    let foodImageUrl = null;
    if (foodImage) {
      foodImageUrl = `data:${foodImage.mimetype};base64,${foodImage.buffer.toString('base64')}`;
    }

    const food = await Food.create({
      food_id: uuidv4(),
      FoodName,
      FoodImage: foodImageUrl,
      Quantity,
      FoodPrice,
      FoodDescription
    });

    res.status(201).json({
      message: 'Food item created successfully',
      food: {
        food_id: food.food_id,
        FoodName: food.FoodName,
        FoodImage: food.FoodImage,
        Quantity: food.Quantity,
        FoodPrice: food.FoodPrice,
        FoodDescription: food.FoodDescription
      }
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
    const { FoodName, Quantity, FoodPrice, FoodDescription } = req.body;
    const foodImage = req.files?.food_image?.[0];

    const food = await Food.findByPk(id);
    if (!food) {
      return res.status(404).json({ error: 'Food item not found' });
    }

    let foodImageUrl = food.FoodImage;
    if (foodImage) {
      foodImageUrl = `data:${foodImage.mimetype};base64,${foodImage.buffer.toString('base64')}`;
    }

    await food.update({
      FoodName,
      FoodImage: foodImageUrl,
      Quantity,
      FoodPrice,
      FoodDescription
    });

    res.status(200).json({
      message: 'Food item updated successfully',
      food: {
        food_id: food.food_id,
        FoodName: food.FoodName,
        FoodImage: food.FoodImage,
        Quantity: food.Quantity,
        FoodPrice: food.FoodPrice,
        FoodDescription: food.FoodDescription
      }
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