// controllers/authController.js
import User from "../models/userModel.js";
import generateToken from "../utils/generateToken.js";

// Register a new user
export async function registerUser(req, res) {
  try {
    const { name, email, password, role } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "User already exists" });

    const user = await User.create({ name, email, password, role });
    const token = generateToken(user);

    res.status(201).json({
      message: "Registration successful",
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      token
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
}

// Login user
export async function loginUser(req, res) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid email or password" });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

    const token = generateToken(user);

    res.json({
      message: "Login successful",
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      token
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
}

// Validate token and get user info
export async function validateToken(req, res) {
  try {
    const user = req.user; // from middleware
    if (!user) return res.status(401).json({ message: "Not Authorized" });

    res.json({ message: "Token valid", user });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
}
