# MySQL Database Setup Guide

## Prerequisites
- MySQL Server 8.0+ installed and running
- Node.js 18+ installed

## Step 1: Install MySQL Package

```bash
npm install mysql2
```

## Step 2: Create Database

### Option A: Using MySQL Workbench or Command Line
Run the SQL script:
```bash
mysql -u root -p < database-setup.sql
```

Or manually in MySQL Workbench:
1. Open MySQL Workbench
2. Connect to your MySQL server
3. Open `database-setup.sql`
4. Execute the script (⚡ lightning bolt icon)

### Option B: Automatic Creation
The application will automatically create tables on first run if they don't exist.

## Step 3: Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` with your MySQL credentials:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=vintner_spirit

PAYPACK_API_KEY=ID7ef50f2e-1659-11f1-aa4f-deadd43720af
PAYPACK_API_SECRET=340cf2aac9c7239b3eb96b8783a67206da39a3ee5e6b4b0d3255bfef95601890afd80709

PORT=3000
```

## Step 4: Test Connection

Start the development server:

```bash
npm run dev
```

You should see:
```
✅ MySQL database connected successfully
✅ Database schema initialized successfully
Server running on http://localhost:3000
```

## Default Test Account

After setup, you can login with:
- **Email**: test@example.com
- **Password**: password123

(Or create your own account through the signup form)

## Troubleshooting

### Connection Error
If you see `ER_ACCESS_DENIED_ERROR`:
- Check your MySQL username/password in `.env`
- Ensure MySQL user has privileges for the database

### Database Doesn't Exist
Run this in MySQL:
```sql
CREATE DATABASE vintner_spirit CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Port Already in Use
If port 3306 is busy, change it in `.env`:
```env
DB_PORT=3307  # or any other available port
```

## Migration from In-Memory Storage

Your existing data (products, orders, customers) will be preserved in the new database. The app will automatically migrate data on first connection.

## Backup Your Data

To backup your database:
```bash
mysqldump -u root -p vintner_spirit > backup.sql
```

To restore:
```bash
mysql -u root -p vintner_spirit < backup.sql
```