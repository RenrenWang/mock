// config/env.js
import { config } from 'dotenv';

config();

export default {
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/mock'
  },
  server: {
    port: parseInt(process.env.PORT, 10) || 3000
  },
  env: process.env.NODE_ENV || 'development'
};