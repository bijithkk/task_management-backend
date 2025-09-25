export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '7000', 10),
  
  database: {
    uri: process.env.MONGO_URI || 'mongodb://bijithcodeedex_db_user:BNcn7uQd9GYpbSIt@cluster0-shard-00-00.hixfmu1.mongodb.net:27017,cluster0-shard-00-01.hixfmu1.mongodb.net:27017,cluster0-shard-00-02.hixfmu1.mongodb.net:27017/?ssl=true&replicaSet=atlas-xxxxx-shard-0&authSource=admin&retryWrites=true&w=majority',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'your-jwt-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  cors: {
    allowedOrigins: process.env.CORS_ALLOWED_ORIGINS?.split(',') || ['http://localhost:7000','http://localhost:5173']
  }
};