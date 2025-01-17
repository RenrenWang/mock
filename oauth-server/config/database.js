import mongoose from 'mongoose';
const mongoConfig = {
    uri: 'mongodb://localhost:27017/mock',
    options: {
    //   autoIndex: true,
    //   serverSelectionTimeoutMS: 5000, // 服务器选择超时时间
    //   socketTimeoutMS: 45000, // Socket 超时时间
    //   family: 4, // 使用 IPv4
    //   maxPoolSize: 10, // 连接池大小
    //   minPoolSize: 1, // 最小连接数
    //   connectTimeoutMS: 10000, // 连接超时时间
    //   heartbeatFrequencyMS: 10000, // 心跳频率
    //   retryWrites: true, // 启用重试写入
    //   writeConcern: {
    //     w: 'majority' // 写入确认级别
    //   }
    }
  };
const connectDB = async () => {
  try {
    console.log('Connecting to MongoDB...',mongoConfig);
     mongoose.connect(mongoConfig?.uri,{
        serverSelectionTimeoutMS: 30000, // 增加连接超时时间
    });

    mongoose.connection.on('connected', () => {
      console.log('MongoDB connected');
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

export default connectDB;