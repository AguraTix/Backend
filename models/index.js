require('dotenv').config();
const { Sequelize } = require('sequelize');
const allModels = require('./allModels');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
});

const models = allModels(sequelize);

module.exports = {
  sequelize,
  ...models,
}; 