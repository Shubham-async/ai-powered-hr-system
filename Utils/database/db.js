import mongoose from 'mongoose';

const DEFAULT_URI = 'mongodb+srv://aurion:aurion@aihrcluster.o4l8jnc.mongodb.net/AIHRDB?retryWrites=true&w=majority&appName=AIHRCluster';
export const MONGODB_URI = process.env.MONGODB_URI || DEFAULT_URI;

// Connection options recommended for mongoose
const DEFAULT_OPTIONS = {
	dbName: process.env.MONGODB_DB || undefined,
	// Mongoose 6+ uses sensible defaults; options left for override
	useNewUrlParser: true,
	useUnifiedTopology: true,
};

let isConnected = false;

export async function connectToDatabase(options = {}) {
	if (isConnected || mongoose.connection.readyState === 1) {
		return mongoose;
	}

	const connectOptions = Object.assign({}, DEFAULT_OPTIONS, options);

	await mongoose.connect(MONGODB_URI, connectOptions);
	isConnected = true;
    console.log("Database connected successfully");
	return mongoose;
}

export async function disconnect() {
	if (!isConnected && mongoose.connection.readyState !== 1) return;
	await mongoose.disconnect();
	isConnected = false;
}

export { mongoose };

export default {
	connectToDatabase,
	disconnect,
	mongoose,
	MONGODB_URI,
};
