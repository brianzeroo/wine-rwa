<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Vintner & Spirit - E-commerce Platform

A modern e-commerce platform for wine and liquor stores, built with React, Supabase, and Express.

## Features

- 🛍️ Product catalog with categories (Wine & Liquor)
- 🛒 Shopping cart functionality
- 👤 User authentication (phone-based)
- 👨‍💼 Customer management with loyalty points
- 📦 Order tracking and management
- 💳 PayPack payment integration (MTN & Airtel)
- 🎯 Discount codes system
- 📊 Analytics dashboard
- 🔐 Admin panel
- 📱 Responsive design

## Tech Stack

**Frontend:**
- React 19
- TypeScript
- Tailwind CSS
- React Router
- Motion (animations)

**Backend:**
- Node.js + Express
- Supabase (PostgreSQL database)

**Payment Gateway:**
- PayPack API (Kenya)

## Prerequisites

- Node.js 18+ installed
- Supabase account (free tier works)
- PayPack account (for production payments)

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Set up Supabase Database

1. Create a Supabase project at https://supabase.com
2. Get your Supabase URL and anon key
3. Run the SQL schema in Supabase SQL Editor (see SUPABASE_SETUP.md)
4. Update your `.env` file

### 3. Configure environment variables

Copy `.env.example` to `.env` and update with your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_project_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
PAYPACK_API_KEY=your_paypack_api_key (optional)
PAYPACK_API_SECRET=your_paypack_api_secret (optional)
```

### 4. Run the application

```bash
npm run dev
```

The app will be available at http://localhost:3000

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Default Credentials

**Admin Panel:**
- Password: `admin123` (change this in Settings!)

## Key Features

### Product Management
- Add, edit, delete products
- Categorize by Wine/Liquor
- Track inventory levels
- Set minimum stock alerts

### Customer Management
- Phone-based authentication
- Customer profiles
- Loyalty points system
- Purchase history

### Order System
- Guest checkout available
- Order tracking
- Multiple payment methods
- Status management (Pending → Processing → Shipped → Delivered)

### Discount Codes
- Percentage or fixed amount discounts
- Usage limits
- Date range validity
- Minimum order requirements

### Analytics Dashboard
- Total sales and revenue
- Order statistics
- Top-selling products
- Customer growth trends

## Deployment

### Build for Production
```bash
npm run build
```

Deploy the `dist` folder to your hosting provider (Vercel, Netlify, etc.)

## Troubleshooting

### Database Connection Issues
- Verify Supabase credentials in `.env`
- Ensure all tables are created in Supabase
- Check browser console for errors

### Server Won't Start
- Make sure port 3000 is available
- Check if `.env` file exists with correct values

### Products Not Loading
- Verify Supabase tables exist
- Check browser network tab for failed API calls

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - feel free to use this project for your needs.

---

**Built with ❤️ using React, Supabase, and Express**
