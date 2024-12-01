const express = require("express");
const admin = require("firebase-admin");
const registerLoginRoutes = require("./routes/auth");

const app = express();
const PORT = process.env.PORT || 8080;
const HOST = '0.0.0.0'; // Mendengarkan pada semua antarmuka

// Middleware
app.use(express.json());

// Koneksi ke Firestore
const serviceAccount = require("./config/serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Contoh penggunaan Firestore
// const usersCollection = db.collection("users");

// Routing
app.use("/api/auth", registerLoginRoutes);

// Jalankan server
app.listen(PORT, HOST, () => console.log(`Server berjalan di http://${HOST}:${PORT}`));
