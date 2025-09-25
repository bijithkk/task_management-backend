export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '7000', 10),
  
  database: {
    uri: process.env.MONGO_URI || 'mongodb+srv://bijithcodeedex_db_user:BNcn7uQd9GYpbSIt@cluster0.hixfmu1.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'your-jwt-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  cors: {
    allowedOrigins: process.env.CORS_ALLOWED_ORIGINS?.split(',') || ['http://localhost:7000','http://localhost:5173','https://task-management-frontend-mu-steel.vercel.app/']
  }
};