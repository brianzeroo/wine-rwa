# 🚀 Manual Deployment Guide - Vintner & Spirit

## ✅ Build Complete!

Your project has been built successfully. The `dist` folder contains your production-ready app.

---

## Option 1: Deploy to Vercel (Recommended) ⚡

### Method A: Drag & Drop Deploy (Easiest!)

1. **Go to**: https://vercel.com/new
2. **Sign in** with GitHub
3. **Click**: "Add New..." → "Project"
4. **Scroll down** and click: "Deploy from Folder"
5. **Select** your `dist` folder
6. **Add Environment Variables**:
   ```
   VITE_SUPABASE_URL = https://mfjgohpwbztfvvrcqnoi.supabase.co
   VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mamdvaHB3Ynp0ZnZ2cmNxbm9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwNTg3MjgsImV4cCI6MjA4ODYzNDcyOH0.UnInqL7-h5bDyNxZdGBnfEe3WC_PTWLzJJPkOs0Pwb0
   PAYPACK_API_KEY = ID7ef50f2e-1659-11f1-aa4f-deadd43720af
   PAYPACK_API_SECRET = 340cf2aac9c7239b3eb96b8783a67206da39a3ee5e6b4b0d3255bfef95601890afd80709
   ```
7. **Click Deploy** 🎉

**Done!** Your app will be live in 1-2 minutes.

### Method B: Using Vercel CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Navigate to project
cd C:\Users\Brian\Downloads\vintner-spirit

# Deploy
vercel --prod
```

Follow the prompts and add environment variables when asked.

---

## Option 2: Netlify Drop (Super Easy!)

1. **Go to**: https://app.netlify.com/drop
2. **Drag and drop** your `dist` folder
3. **Add environment variables** in Site Settings
4. **Done!**

---

## Option 3: Fix GitHub Auth & Push

If you want to use GitHub deployment:

### Fix Authentication Issue:

You're logged in as `brianthe1st` but repo belongs to `brianzeroo`.

**Solution 1: Use Personal Access Token**

1. Go to GitHub.com while logged into brianzeroo account
2. Settings → Developer settings → Personal access tokens → Tokens (classic)
3. Generate new token with `repo` scope
4. Update remote with token:
   ```bash
   git remote set-url origin https://brianzeroo:YOUR_TOKEN@github.com/brianzeroo/vintner-spirit.git
   git push -u origin main
   ```

**Solution 2: Re-authenticate Git**

```bash
# Clear cached credentials
git credential-manager erase

# Then push again (it will prompt for login)
git push -u origin main
```

Login with `brianzeroo` credentials when prompted.

---

## 📦 What's Ready to Deploy

### Built Files:
```
dist/
├── index.html          ← Main HTML file
├── assets/
│   ├── index-*.css    ← Styles
│   └── index-*.js     ← JavaScript bundle
└── (other assets)
```

### Your Server:
The Express server (`server.ts`) is ready to deploy on platforms that support Node.js backends.

---

## 🎯 Best Deployment Path

### For Full-Stack App (Frontend + Backend):

**Use Railway.app** - Handles both frontend and backend perfectly:

1. Go to https://railway.app
2. New Project → Deploy from GitHub
3. Connect your GitHub account (brianzeroo)
4. Select `vintner-spirit` repository
5. Add environment variables:
   ```
   VITE_SUPABASE_URL
   VITE_SUPABASE_ANON_KEY
   PAYPACK_API_KEY
   PAYPACK_API_SECRET
   NODE_ENV=production
   PORT=3000
   ```
6. Deploy!

Railway will automatically detect Node.js and deploy both frontend and backend.

---

## 🔧 Alternative: Static Frontend Only

If you just want to deploy the frontend (no backend API):

### GitHub Pages:

1. Go to Settings → Pages
2. Source: Deploy from branch
3. Branch: main → `/dist`
4. Add environment variables before building

⚠️ **Warning**: This won't work because your app needs the Express backend for API routes!

---

## ✅ Pre-Deployment Checklist

Before deploying, ensure:

- [x] Project builds successfully (`npm run build` done ✓)
- [ ] Environment variables are ready
- [ ] Supabase tables are created (check SUPABASE_SETUP.md)
- [ ] You have access to GitHub account (brianzeroo)

---

## 🆘 Troubleshooting

### "Permission denied" on GitHub

**Issue**: Wrong GitHub account authenticated

**Fix**: 
1. Logout of GitHub in browser
2. Login as brianzeroo
3. Clear Git credentials: `git credential-manager erase`
4. Push again

### Vercel Deploy Fails

**Check**:
- Environment variables are set correctly
- Supabase credentials are valid
- Build completed without errors

### Blank Page After Deploy

**Check browser console** for errors:
- Missing environment variables
- Failed API calls
- Supabase connection issues

---

## 🌐 Your URLs After Deploy

Depending on platform:

- **Vercel**: `https://vintner-spirit.vercel.app`
- **Netlify**: `https://vintner-spirit.netlify.app`
- **Railway**: `https://vintner-spirit.up.railway.app`
- **GitHub Pages**: `https://brianzeroo.github.io/vintner-spirit`

---

## 💡 Recommended Next Steps

1. **Deploy NOW** using one of the methods above
2. **Test** all features work
3. **Fix GitHub auth** if you want CI/CD
4. **Add custom domain** (optional)
5. **Share your launch!** 🎉

---

## 📞 Quick Help

**For immediate deployment**: Use Vercel's "Deploy from Folder" option
**For full-stack hosting**: Use Railway.app
**For fixing GitHub**: Re-authenticate with brianzeroo account

---

**Ready to deploy?** Choose a method above and get your app live in minutes! 🚀
