import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

export const MONGODB_URI = process.env.MONGODB_URI;

// Connection options recommended for mongoose
const DEFAULT_OPTIONS = {
	dbName: process.env.MONGODB_DB || undefined,
};

let isConnected = false;

export async function connectToDatabase(options = {}) {
	if (isConnected || mongoose.connection.readyState === 1) {
		return mongoose;
	}
	try {
		const connectOptions = Object.assign({}, DEFAULT_OPTIONS, options);

		await mongoose.connect(MONGODB_URI, connectOptions);
		isConnected = true;
		console.log("Database connected successfully");
		return mongoose;
	} catch (err) {
		console.log("Database Error " + err);
		return err;
	}
}

export async function disconnect() {
	if (!isConnected && mongoose.connection.readyState !== 1) return;
	await mongoose.disconnect();
	isConnected = false;
	console.log("Database disconnected successfully");
}

export { mongoose };

export default {
	connectToDatabase,
	disconnect,
	mongoose,
	MONGODB_URI,
};
