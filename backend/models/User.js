const admin = require('firebase-admin');
const bcrypt = require('bcryptjs');

const db = admin.firestore();

// User model for Firebase Firestore
class User {
  constructor(data) {
    this.id = data.id || null;
    this.username = data.username;
    this.email = data.email;
    this.password = data.password;
    this.createdAt = data.createdAt || new Date().toISOString();
  }

  static async create(userData) {
    try {
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      const userId = `user_${Date.now()}`;
      const newUser = {
        id: userId,
        username: userData.username.toLowerCase(),
        email: userData.email.toLowerCase(),
        password: hashedPassword,
        createdAt: new Date().toISOString(),
      };

      // Save to Firestore
      await db.collection('users').doc(userId).set(newUser);

      return {
        id: userId,
        username: newUser.username,
        email: newUser.email,
        createdAt: newUser.createdAt,
      };
    } catch (error) {
      throw new Error(`Error creating user: ${error.message}`);
    }
  }

  static async findByEmail(email) {
    try {
      const snapshot = await db.collection('users')
        .where('email', '==', email.toLowerCase())
        .limit(1)
        .get();

      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { ...doc.data(), id: doc.id };
      }
      return null;
    } catch (error) {
      throw new Error(`Error finding user: ${error.message}`);
    }
  }

  static async findByUsername(username) {
    try {
      const snapshot = await db.collection('users')
        .where('username', '==', username.toLowerCase())
        .limit(1)
        .get();

      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { ...doc.data(), id: doc.id };
      }
      return null;
    } catch (error) {
      throw new Error(`Error finding user: ${error.message}`);
    }
  }

  static async findById(userId) {
    try {
      const doc = await db.collection('users').doc(userId).get();

      if (doc.exists) {
        return { ...doc.data(), id: doc.id };
      }
      return null;
    } catch (error) {
      throw new Error(`Error finding user: ${error.message}`);
    }
  }

  static async matchPassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }
}

module.exports = User;
