# 🚀 Quick Start: Database MySQL Connection

Aplikasi sudah diupdate untuk **FETCH DATA dari DATABASE** bukan localStorage!

---

## 📋 Checklist Sebelum Memulai

- [x] MySQL installed & running
- [ ] Database `pelayanan_cuci_ac` sudah dibuat (via phpMyAdmin)
- [ ] `.env` sudah dikonfigurasi dengan kredensial MySQL
- [ ] Dependencies sudah diinstall (`npm install`)

---

## 🎬 Langkah-Langkah Menjalankan

### **Step 1️⃣: Setup Database di MySQL / phpMyAdmin**

#### Opsi A: Via phpMyAdmin (RECOMMENDED)
1. Buka `http://localhost/phpmyadmin`
2. Login dengan `root` / no password
3. Tab **"Import"**
4. Upload file `database.sql`
5. Klik **"Go"** untuk import

#### Opsi B: Via Command Line
```powershell
mysql -u root -p < database.sql
```

**Verifikasi database berhasil dibuat:**
```sql
USE pelayanan_cuci_ac;
SHOW TABLES;
SELECT COUNT(*) FROM users;
```

---

### **Step 2️⃣: Konfigurasi File `.env`**

File `.env` sudah ada, tapi sesuaikan dengan setup MySQL Anda:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=         # Kosong jika tidak ada password
DB_NAME=pelayanan_cuci_ac

# API Port
API_PORT=5000
VITE_API_URL=http://localhost:5000/api
```

**Simpan file!**

---

### **Step 3️⃣: Install Dependencies (jika belum)**

```powershell
cd c:\Users\Michael\OneDrive\Dokumen\Website\pelayanan-jasa-cuci-ac

npm install
```

Dependencies yang diinstall:
- ✅ `mysql2` - MySQL driver
- ✅ `cors` - Cross-Origin
- ✅ `concurrently` - Multiple commands
- ✅ `express` - Backend API
- ✅ `react` & `vite` - Frontend

---

### **Step 4️⃣: Jalankan Backend Server**

**Terminal 1: Jalankan Backend API**
```powershell
npm run server
```

Output yang diharapkan:
```
🚀 Backend server running on http://localhost:5000
📚 API Documentation:
   GET  /api/test-connection - Test database connection
   GET  /api/users           - Get all users
   POST /api/users           - Create new user
   ...
```

**Test connection di browser:**
```
http://localhost:5000/api/test-connection
```

Jika berhasil akan melihat JSON response:
```json
{
  "status": "Database connected successfully"
}
```

---

### **Step 5️⃣: Jalankan Frontend React (Terminal Baru)**

**Terminal 2: Jalankan Frontend**
```powershell
npm run dev
```

Output yang diharapkan:
```
  VITE v6.2.3  ready in xxx ms

  ➜  Local:   http://localhost:3000/
  ➜  press h + enter to show help
```

Buka browser:
```
http://localhost:3000
```

---

## 🎯 Yang Sudah Berubah

| Sebelum | Sesudah |
|---------|---------|
| Data disimpan di **localStorage** ❌ | Data disimpan di **MySQL Database** ✅ |
| Hanya satu window/process | Backend + Frontend terpisah |
| Data hilang saat clear cache | Data persisten di database |
| Testing sulit | API endpoint bisa ditest terpisah |

---

## 📊 Data Flow

```
┌─────────────────┐
│  React UI       │  (localhost:3000)
│  (Vite)         │
└────────┬────────┘
         │ API Calls (fetch)
         ▼
┌─────────────────┐
│  Express Server │  (localhost:5000)
│  /api/users     │
│  /api/orders    │
│  /api/services  │
└────────┬────────┘
         │ SQL Queries
         ▼
┌─────────────────┐
│  MySQL Database │  (localhost:3306)
│  pelayanan_     │
│  cuci_ac        │
└─────────────────┘
```

---

## 🧪 Test API Endpoints

Gunakan **Postman** atau cURL:

```powershell
# Test connection
Invoke-WebRequest http://localhost:5000/api/test-connection

# Get all users
Invoke-WebRequest http://localhost:5000/api/users | ConvertTo-Json

# Get all orders
Invoke-WebRequest http://localhost:5000/api/orders | ConvertTo-Json

# Get services
Invoke-WebRequest http://localhost:5000/api/services | ConvertTo-Json
```

---

## 🔧 Troubleshooting

### ❌ Error: "Connection refused to 127.0.0.1:3306"
**Solusi:** MySQL tidak berjalan
```powershell
# Windows: Start MySQL Service
net start MySQL80

# Atau pakai MySQL Workbench
```

### ❌ Error: "Access denied for user 'root'@'localhost'"
**Solusi:** Password salah di `.env`
- Cek password MySQL Anda
- Update `.env` dengan password yang benar

### ❌ Error: "Unknown database 'pelayanan_cuci_ac'"
**Solusi:** Database belum dibuat
- Import `database.sql` terlebih dahulu via phpMyAdmin atau command line

### ⚠️ Warning: "Database not connected, using fallback data"
**Solusi:** Backend server belum berjalan
- Pastikan jalankan `npm run server` terlebih dahulu di terminal lain

---

## 🚨 PENTING: 2 Terminal Harus Berjalan Bersamaan!

**Jangan lupa:**

| Terminal | Command | Port |
|----------|---------|------|
| #1 | `npm run server` | 5000 (Backend) |
| #2 | `npm run dev` | 3000 (Frontend) |

---

## 📚 API Endpoints Reference

### Users
```
GET  /api/users              - Get all users
POST /api/users              - Create new user
```

### Orders
```
GET  /api/orders             - Get all orders
POST /api/orders             - Create new order
```

### Master Data
```
GET  /api/models             - Get AC models
GET  /api/categories         - Get AC categories
GET  /api/services           - Get AC services
GET  /api/addons             - Get AC addons
```

### Utility
```
GET  /api/test-connection    - Test database connection
```

---

## 💾 Database Tables

```
✅ users          - Pelanggan, Admin, Karyawan, Owner
✅ orders         - Pesanan layanan AC
✅ ac_models      - Model AC
✅ ac_categories  - Kategori AC
✅ ac_services    - Jenis layanan
✅ ac_addons      - Addon/tambahan
```

---

## ✅ Selesai!

Sekarang aplikasi sudah **TERHUBUNG dengan MySQL Database!** 🎉

🔄 **Data Flow:**
1. User input di React UI → 
2. Fetch dari Backend API → 
3. Query ke MySQL Database → 
4. Response data ke React → 
5. Display di UI

---

**Happy Coding! 🚀**

Jika ada pertanyaan, check error messages di:
- 🖥️ Console browser (F12)
- 🖥️ Terminal backend
- 📊 phpMyAdmin untuk check database
