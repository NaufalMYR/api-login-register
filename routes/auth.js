const express = require("express");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { createUser, getUserByUsername } = require("../models/user");

const router = express.Router();

// Register
router.post("/register", async (req, res) => {
  try {
    const { username, password, userStatus, universityName, hospitalName, phoneNumber, semester } = req.body;

    // Validasi data
    if (!username || !password || !userStatus || !universityName || !hospitalName || !phoneNumber) {
      return res.status(400).json({ message: "Semua data wajib diisi." });
    }
    if (userStatus === "coass" && !semester) {
      return res.status(400).json({ message: "Semester wajib diisi untuk coass." });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Simpan pengguna ke database
    const newUser = {
      username,
      password: hashedPassword,
      userStatus,
      universityName,
      hospitalName,
      phoneNumber,
      semester,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    };

    await createUser(newUser);
    res.status(201).json({ message: "Registrasi berhasil." });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "Username sudah terdaftar." });
    }
    res.status(500).json({ message: "Terjadi kesalahan server.", error: err.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validasi data
    if (!username || !password) {
      return res.status(400).json({ message: "Username dan password wajib diisi." });
    }

    // Cari pengguna di database
    const user = await getUserByUsername(username);
    if (!user) {
      return res.status(404).json({ message: "Pengguna tidak ditemukan." });
    }

    // Verifikasi password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Password salah." });
    }

    // Login berhasil
    res.status(200).json({
      message: "Login berhasil.",
      user: {
        username: user.username,
        userStatus: user.userStatus,
        universityName: user.universityName,
        hospitalName: user.hospitalName,
        phoneNumber: user.phoneNumber,
        semester: user.semester,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Terjadi kesalahan server.", error: err.message });
  }
});

// Forgot Password
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    // Cari pengguna berdasarkan email
    const user = await getUserByUsername(email);
    if (!user) {
      return res.status(404).json({ message: "Email tidak ditemukan." });
    }

    // Buat token reset password
    const token = crypto.randomBytes(20).toString("hex");

    // Simpan token dan masa berlaku di database
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 jam
    await createUser(user);

    // Kirim email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "youremail@gmail.com",
        pass: "yourpassword",
      },
    });

    const mailOptions = {
      to: user.username,
      from: "youremail@gmail.com",
      subject: "Password Reset Request",
      text: `Klik link berikut untuk mereset password: http://localhost:3000/reset-password/${token}`,
    };

    transporter.sendMail(mailOptions, (err) => {
      if (err) {
        return res.status(500).json({ message: "Gagal mengirim email.", error: err.message });
      }
      res.status(200).json({ message: "Email reset password telah dikirim." });
    });
  } catch (err) {
    res.status(500).json({ message: "Terjadi kesalahan server.", error: err.message });
  }
});

// Reset Password
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    // Cari pengguna berdasarkan token dan periksa masa berlakunya
    const usersCollection = admin.firestore().collection("users");
    const snapshot = await usersCollection.where("resetPasswordToken", "==", token).where("resetPasswordExpires", ">", Date.now()).get();

    if (snapshot.empty) {
      return res.status(400).json({ message: "Token tidak valid atau telah kadaluarsa." });
    }

    let user;
    snapshot.forEach(doc => {
      user = doc.data();
      user.id = doc.id; // Mendapatkan ID dokumen
    });

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = null; // Hapus token
    user.resetPasswordExpires = null; // Hapus masa berlaku
    await createUser(user);

    res.status(200).json({ message: "Password berhasil direset." });
  } catch (err) {
    res.status(500).json({ message: "Terjadi kesalahan server.", error: err.message });
  }
});

module.exports = router;
