const admin = require("firebase-admin");

// Referensi ke koleksi pengguna di Firestore
const usersCollection = admin.firestore().collection("users");

// Fungsi untuk membuat atau memperbarui pengguna
const createUser = async (user) => {
  try {
    const userRef = usersCollection.doc(user.username);
    await userRef.set(user, { merge: true });
    console.log("User created/updated:", user);
  } catch (error) {
    console.error("Error creating/updating user:", error);
  }
};

// Fungsi untuk mendapatkan pengguna berdasarkan username
const getUserByUsername = async (username) => {
  try {
    const userRef = usersCollection.doc(username);
    const doc = await userRef.get();
    if (doc.exists) {
      return doc.data();
    } else {
      console.log("No such user!");
      return null;
    }
  } catch (error) {
    console.error("Error getting user:", error);
  }
};

module.exports = { createUser, getUserByUsername };
