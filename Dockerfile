# Menggunakan image node versi terbaru
FROM node:latest

# Menentukan direktori kerja di dalam container
WORKDIR /app

# Menyalin package.json dan package-lock.json
COPY package*.json ./

# Menginstal dependensi
RUN npm install

# Menyalin semua file ke dalam container
COPY . .

# Mengekspos port aplikasi
EXPOSE 8080

# Menjalankan aplikasi
CMD ["node", "server.js"]