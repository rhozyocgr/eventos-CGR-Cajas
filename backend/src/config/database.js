import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config(); // In production, variables are provided by Docker

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mariadb',
    logging: false,
    dialectOptions: {
      connectTimeout: 10000
    }
  }
);

export default sequelize;
