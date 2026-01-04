# Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 2: Initialize Database
```bash
python backend/init_db.py
```

### Step 3: Run Application
```bash
python main.py
```

## 🌐 Access URLs

| Module | URL | Credentials |
|--------|-----|-------------|
| **Home** | http://localhost:5000/ | - |
| **Admin** | http://localhost:5000/admin | `admin` / `admin123` |
| **Student** | http://localhost:5000/student | `STU001` / `password123` |
| **Verifier** | http://localhost:5000/verifier | Public access |

## 📋 **Sample Students:**
- IDs: `STU001`, `STU002`, `STU003`, `STU004`, `STU005`
- Default Password: `password123`

## 🎯 Quick Test Workflow

1. **Login as Admin** → http://localhost:5000/admin
2. **Issue Credentials**:
   - Select "Markscard"
   - Filter: Department = "Computer Science", Batch Year = 2024
   - Preview → Issue Batch
3. **Login as Student** → http://localhost:5000/student
   - Login with: `STU001` / `password123`
   - View issued credentials
   - Download or share
4. **Verify Credential** → http://localhost:5000/verifier
   - Enter credential ID or paste share link
   - See verification result

## ⚡ Features to Try

### Admin Features
- ✅ Bulk credential issuance
- ✅ Filter students (department, batch, division, course, semester)
- ✅ Preview before issuing
- ✅ Track batch progress

### Student Features
- ✅ View all credentials
- ✅ Download as JSON
- ✅ Share verification links
- ✅ View credential details

### Verifier Features
- ✅ Instant verification
- ✅ Check revocation status
- ✅ View issuer information
- ✅ ONEST-compliant API

## 🐛 Troubleshooting

**Port 5000 in use?**
- Change port in `main.py`: `app.run(..., port=5001)`
- Update `static/js/shared.js`: `API_BASE_URL = 'http://localhost:5001/api'`

**Database errors?**
- Delete `kle_credentials.db`
- Run `python backend/init_db.py` again

**Import errors?**
- Make sure you're in the project root directory
- Check Python path: `python --version` (should be 3.8+)

## 📚 Documentation

- **Full Setup**: See [SETUP.md](SETUP.md)
- **Project Details**: See [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)
- **Main README**: See [README.md](README.md)

## 💡 Tips

- Use browser DevTools (F12) to see API calls
- Check browser console for errors
- Database file: `kle_credentials.db` (SQLite)
- All logs appear in terminal

---

**Ready to go!** 🎉

