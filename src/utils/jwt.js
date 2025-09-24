import jwt from "jsonwebtoken";

const generateAccessToken = (payload) => {
  const secret = process.env.JWT_SECRET || 'your-secret-key';
  const options = {
    expiresIn:'7d',
  };

  return jwt.sign(payload, secret, options);
};

export default generateAccessToken;