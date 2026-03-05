import mongoose from 'mongoose';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const MONGODB_URI = process.env.MONGODB_URI;

// MongoDB is optional - app can run in demo mode without it
const globalWithCache = global as typeof globalThis & {
  mongooseCache: MongooseCache;
};

if (!globalWithCache.mongooseCache) {
  globalWithCache.mongooseCache = { conn: null, promise: null };
}

const cached = globalWithCache.mongooseCache;

let isConnected = false;

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!MONGODB_URI) {
    console.warn('MONGODB_URI not set - running in demo mode without database');
    return null;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts);
  }

  try {
    cached.conn = await cached.promise;
    isConnected = true;
  } catch (e) {
    cached.promise = null;
    console.error('MongoDB connection error:', e);
    console.warn('Running in demo mode without database persistence');
    return null;
  }

  return cached.conn;
}

export function isDatabaseConnected() {
  return isConnected;
}
