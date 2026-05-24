# 📱 Setup Database MySQL untuk Pelayanan Jasa Cuci AC

## Prerequisites
- ✅ MySQL sudah terinstall dan running
- ✅ Node.js versi 16+ 
- ✅ npm atau yarn

---

## 🚀 Langkah-Langkah Setup

### 1️⃣ **Buat Database di MySQL**

Buka MySQL Command Line atau MySQL Workbench:

```sql
-- Buka MySQL
mysql -u root -p

-- Jalankan script database.sql
source database.sql
```

Atau copy-paste semua command dari file `database.sql` ke MySQL client.

**Verifikasi database berhasil dibuat:**
```sql
SHOW DATABASES;
USE pelayanan_cuci_ac;
SHOW TABLES;
```

---

### 2️⃣ **Update Konfigurasi .env**

Edit file `.env` dan sesuaikan dengan kredensial MySQL Anda:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password_anda_disini  # Kosong jika tidak ada password
DB_NAME=pelayanan_cuci_ac

# API Port
API_PORT=5000
VITE_API_URL=http://localhost:5000/api
```

---

### 3️⃣ **Install Dependencies**

```powershell
cd c:\Users\Michael\OneDrive\Dokumen\Website\pelayanan-jasa-cuci-ac

npm install
```

Dependencies yang ditambahkan:
- `mysql2` - MySQL driver untuk Node.js
- `cors` - Cross-Origin Resource Sharing
- `concurrently` - Jalankan multiple commands

---

### 4️⃣ **Test Koneksi Database**

```powershell
# Terminal 1: Jalankan Backend Server
npm run server
```

Server akan running di `http://localhost:5000`

**Test koneksi di browser atau Postman:**
```
GET http://localhost:5000/api/test-connection
```

Jika berhasil, akan melihat response:
```json
{
  "status": "Database connected successfully"
}
```

---

### 5️⃣ **Jalankan Frontend React (Terminal Lain)**

```powershell
# Terminal 2: Jalankan React Dev Server
npm run dev
```

Frontend akan running di `http://localhost:3000`

---

### 6️⃣ **[OPTIONAL] Jalankan Server + Frontend Bersamaan**

```powershell
# Jalankan kedua-duanya dengan satu command
npm run dev:all
```

---

## 📚 Available API Endpoints

### Users
- `GET /api/users` - Ambil semua user
- `POST /api/users` - Buat user baru

### Orders
- `GET /api/orders` - Ambil semua order
- `POST /api/orders` - Buat order baru

### Master Data
- `GET /api/models` - Ambil AC models
- `GET /api/services` - Ambil layanan AC

---

## 🔧 Troubleshooting

### Error: "Connection refused to 127.0.0.1:3306"
**Solusi:** MySQL tidak running
```powershell
# Windows - Start MySQL Service
net start MySQL80
# atau gunakan MySQL Workbench
```

### Error: "Access denied for user 'root'@'localhost'"
**Solusi:** Username atau password salah di `.env`
```env
DB_USER=root
DB_PASSWORD=password_yang_benar
```

### Error: "Unknown database 'pelayanan_cuci_ac'"
**Solusi:** Jalankan `database.sql` terlebih dahulu
```powershell
mysql -u root -p < database.sql
```

---

## 📝 Struktur Database

```
┌─ users
│  ├─ id (PRIMARY KEY)
│  ├─ name
│  ├─ email
│  ├─ phone
│  ├─ role (pelanggan, karyawan, admin, owner)
│  └─ password
│
├─ ac_models
│  ├─ id
│  ├─ name
│  └─ manufacturer
│
├─ ac_services
│  ├─ id
│  ├─ name
│  ├─ basePrice
│  └─ duration
│
├─ ac_addons
│  ├─ id
│  ├─ name
│  └─ price
│
└─ orders
   ├─ id (PRIMARY KEY)
   ├─ customerId (FOREIGN KEY → users.id)
   ├─ workerId (FOREIGN KEY → users.id)
   ├─ status
   ├─ schedule
   ├─ totalPrice
   └─ timestamps
```

---

## 🎯 Next Steps

Setelah MySQL connected:

1. **Update React Components** - Ganti `localStorage` dengan API calls
2. **Create API Service Layer** - Buat `src/services/api.ts` untuk manage HTTP requests
3. **Implement State Management** - Gunakan Context API atau Redux untuk manage data dari API

---

## 📞 Support

Jika ada masalah:
- Check file `.env` configuration
- Verify MySQL service status
- Check error messages di console/terminal

---

**Happy Coding! 🚀**
