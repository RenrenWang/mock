import mongoose from 'mongoose';
import EventEmitter from 'events';

// 增加最大监听器数量
EventEmitter.defaultMaxListeners = 15;

/**
 * Mongoose Koa Plugin
 * @param {Object} options Mongoose 连接配置项
 * @param {string} options.uri MongoDB连接URI
 * @param {Object} options.options Mongoose连接选项
 * @returns {Function} Koa中间件
 */
export default function mongoosePlugin(options = {}) {
  const {
    uri,
    options: mongooseOptions = {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4
    }
  } = options;

  // 标记是否已经设置过事件监听器
  let isEventListenerSet = false;

  return async function mongooseMiddleware(app, next) {
    try {
      if (mongoose.connection.readyState === 0) {
        const connection = await mongoose.createConnection(uri, mongooseOptions).asPromise();

        // 将连接实例添加到 app.context
        app.db = connection;
        // 只在第一次设置事件监听器
        if (!isEventListenerSet) {
          // 移除所有现有的监听器
          mongoose.connection.removeAllListeners();
          process.removeAllListeners('SIGINT');

          // 设置连接事件监听器
          const setupEventListeners = (conn) => {
            conn.on('connected', () => {
              console.log('MongoDB connected successfully');
            });

            conn.on('error', (err) => {
              console.error('MongoDB connection error:', err);
            });

            conn.on('disconnected', () => {
              console.log('MongoDB disconnected');
            });

            conn.on('reconnected', () => {
              console.log('MongoDB reconnected');
            });
          };

          setupEventListeners(connection);

          // 设置进程终止时的清理处理
          const cleanupHandler = async () => {
            try {
              await connection.close();
              console.log('MongoDB connection closed through app termination');
              process.exit(0);
            } catch (err) {
              console.error('Error closing MongoDB connection:', err);
              process.exit(1);
            }
          };

          // 只添加一个 SIGINT 处理器
          process.once('SIGINT', cleanupHandler);

          isEventListenerSet = true;
        }
      }

      if (next) {
        await next();
      }
    } catch (error) {
      console.error('MongoDB initial connection error:', error);
      throw error;
    }
  };
}

// 导出 mongoose 实例
export { mongoose };