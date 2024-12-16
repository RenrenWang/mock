import { MongoClient } from 'mongodb';

// 数据库连接配置对象，可根据需要在不同环境下修改这些参数
const databaseConfig = {
  uri: "mongodb://localhost:27017/mock",
  databaseName: "mock",
  maxPoolSize: 10
};

// 用于存储单例数据库连接实例
let databaseInstance;

// 私有函数：连接数据库
async function connectDatabase() {
  try {
    const client = new MongoClient(databaseConfig.uri, {
      maxPoolSize: databaseConfig.maxPoolSize
    });
    const connectedClient = await client.connect();
    console.log("成功连接到MongoDB数据库（使用连接池）");
    const db = connectedClient.db(databaseConfig.databaseName);
    return db;
  } catch (e) {
    // 根据错误类型进行更细致的错误处理
    if (e instanceof MongoClient.ConnectionError) {
      console.error("数据库连接错误：无法连接到MongoDB服务器，请检查网络或服务器状态。", e);
    } else if (e instanceof MongoClient.ServerSelectionError) {
      console.error("数据库连接错误：无法选择合适的MongoDB服务器，请检查服务器配置或集群状态。", e);
    } else {
      console.error("连接数据库时出现其他未知错误：", e);
    }
    throw e;
  }
}

// 函数：获取数据库连接实例（单例模式）
async function getDatabaseInstance() {
  if (!databaseInstance) {
    databaseInstance = await connectDatabase();
  }
  return databaseInstance;
}


// 中间件函数，将获取集合的方法挂载到ctx.app.db上
export const db = async (ctx, next) => {
  const db = await getDatabaseInstance()

  if (!db) {
    throw new Error("无法获取数据库实例，请检查数据库连接是否正常。");
  }

  ctx.app.db = db;
  console.log("数据库连接成功，集合已准备就绪");
  ctx.app.collection = (name) => db.collection(name);

  await next();
};
