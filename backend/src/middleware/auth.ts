import { Request, Response, NextFunction } from 'express';
import { createHmac } from 'crypto';
import { connectToDatabase } from '../db';
import { ObjectId } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables early. This ensures JWT_SECRET and other
// environment variables are populated when this middleware runs. Without
// this, JWT_SECRET could be undefined if dotenv.config() is invoked later.
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }
    const token = authHeader.substring(7);
    if (!JWT_SECRET) {
      return res.status(500).json({ error: 'Server misconfiguration' });
    }
    // Verify token using HMAC SHA256. Tokens are expected in the form header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    const [headerEncoded, payloadEncoded, signature] = parts;
    const dataToSign = `${headerEncoded}.${payloadEncoded}`;
    const expectedSignature = createHmac('sha256', JWT_SECRET as string)
      .update(dataToSign)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
    if (signature !== expectedSignature) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    // Decode payload
    try {
      const payloadJson = Buffer.from(payloadEncoded.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString();
      const decoded: any = JSON.parse(payloadJson);
      if (!decoded || !decoded.userId) {
        return res.status(401).json({ error: 'Invalid token payload' });
      }
      // Check expiration
      if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
        return res.status(401).json({ error: 'Token expired' });
      }
      // Fetch user from MongoDB
      const db = await connectToDatabase();
      const user = await db.collection('users').findOne({ _id: new ObjectId(decoded.userId) });
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }
      req.user = {
        id: user._id.toString(),
        email: user.email,
      };
      next();
    } catch (err) {
      console.error('Token parsing error:', err);
      return res.status(401).json({ error: 'Invalid token' });
    }
    // The user has already been validated and set on the request in the above
    // block. If the code reaches this point, it means an unexpected path was
    // taken; simply call next() to continue processing.
    return next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}
