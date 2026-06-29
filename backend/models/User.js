const firebase = require('firebase/app');
require('firebase/database');
require('firebase/auth');
const bcrypt = require('bcryptjs');

// Get Firebase database reference
const getDatabase = () => {
  try {
    return firebase.database();
  } catch (error) {
    console.error('Error getting database:', error);
    return null;
  }
};

// User model for Firebase
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
      const db = getDatabase();
      if (!db) throw new Error('Database not initialized');

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

      // Save to Firebase
      await db.ref(`users/${userId}`).set(newUser);

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
      const db = getDatabase();
      if (!db) throw new Error('Database not initialized');

      const snapshot = await db.ref('users').orderByChild('email').equalTo(email.toLowerCase()).once('value');
      
      if (snapshot.exists()) {
        const users = snapshot.val();
        const userId = Object.keys(users)[0];
        return { ...users[userId], id: userId };
      }
      return null;
    } catch (error) {
      throw new Error(`Error finding user: ${error.message}`);
    }
  }

  static async findByUsername(username) {
    try {
      const db = getDatabase();
      if (!db) throw new Error('Database not initialized');

      const snapshot = await db.ref('users').orderByChild('username').equalTo(username.toLowerCase()).once('value');
      
      if (snapshot.exists()) {
        const users = snapshot.val();
        const userId = Object.keys(users)[0];
        return { ...users[userId], id: userId };
      }
      return null;
    } catch (error) {
      throw new Error(`Error finding user: ${error.message}`);
    }
  }

  static async findById(userId) {
    try {
      const db = getDatabase();
      if (!db) throw new Error('Database not initialized');

      const snapshot = await db.ref(`users/${userId}`).once('value');
      
      if (snapshot.exists()) {
        return { ...snapshot.val(), id: userId };
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
