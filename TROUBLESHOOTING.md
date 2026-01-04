# Troubleshooting Guide

## Login Not Working? Follow These Steps:

### Step 1: Check if Server is Running
Make sure the Flask server is running:
```bash
python main.py
```

You should see output like:
```
 * Running on http://0.0.0.0:5000
```

### Step 2: Check Database
Run the test script to verify database setup:
```bash
python test_login.py
```

This will tell you if:
- Admin account exists
- Students exist
- Database file is present

### Step 3: Initialize Database (If Needed)
If the test shows missing data:
```bash
python backend/init_db.py
```

This creates:
- Admin user (username: `admin`, password: `admin123`)
- 5 sample students (STU001-STU005)

### Step 4: Check Browser Console
Open browser DevTools (F12) and check:
1. **Console tab** - Look for JavaScript errors
2. **Network tab** - Check if API calls are being made
   - Look for `/api/admin/login` or `/api/student/login`
   - Check response status (should be 200)
   - Check for CORS errors

### Step 5: Test API Directly
Test the health endpoint:
```bash
curl http://localhost:5000/api/health
```

Or open in browser: http://localhost:5000/api/health

Should return: `{"status":"ok","message":"Server is running"}`

### Step 6: Common Issues & Solutions

#### Issue: "Cannot connect to server"
**Solution**: 
- Make sure `python main.py` is running
- Check if port 5000 is in use
- Try accessing http://localhost:5000/api/health

#### Issue: "Invalid credentials" 
**Solution**:
- Run `python backend/init_db.py` to create admin
- Make sure you're using:
  - Admin: username=`admin`, password=`admin123`
  - Student: Student ID like `STU001`

#### Issue: "Student not found"
**Solution**:
- Run `python backend/init_db.py`
- Use one of: STU001, STU002, STU003, STU004, STU005

#### Issue: Button does nothing / No error shown
**Solution**:
- Check browser console (F12) for JavaScript errors
- Make sure JavaScript files are loading:
  - Check Network tab for `/static/js/shared.js`
  - Check Network tab for `/static/js/admin.js` or `/static/js/student.js`
- Try hard refresh: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)

#### Issue: CORS errors in console
**Solution**:
- The code has been updated to allow all origins
- Restart the server after changes
- Check browser console for specific CORS error messages

### Step 7: Verify Files
Make sure all files exist:
- `backend/app.py`
- `backend/models.py`
- `static/js/shared.js`
- `static/js/admin.js`
- `static/js/student.js`
- `frontend/admin/index.html`
- `frontend/student/index.html`

### Step 8: Manual Database Check
If using SQLite, check database directly:
```bash
python
>>> from backend.app import create_app
>>> from backend.models import db, Admin, Student
>>> app = create_app()
>>> with app.app_context():
...     admin = Admin.query.first()
...     print(admin.username if admin else "No admin")
...     students = Student.query.count()
...     print(f"Students: {students}")
```

## Still Not Working?

1. **Check all error messages** in browser console
2. **Verify server logs** in terminal running `python main.py`
3. **Test with curl**:
   ```bash
   curl -X POST http://localhost:5000/api/admin/login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"admin123"}'
   ```
4. **Try a different browser** or incognito mode
5. **Clear browser cache** and localStorage

## Expected Behavior

### Admin Login:
1. Enter `admin` and `admin123`
2. Click "Login"
3. Button shows "Logging in..."
4. Redirects to dashboard OR shows error message

### Student Login:
1. Enter Student ID like `STU001`
2. Click "Login"  
3. Button shows "Logging in..."
4. Redirects to dashboard OR shows error message

If nothing happens when clicking, check:
- Browser console for errors
- Network tab for failed requests
- Server terminal for errors

