# Backend Integration Test Cases

## 🧪 Required Test Cases

### ✅ Test Case 1: Basic Save/Load Flow
1. **Draw something** on canvas
2. **Save drawing** (should succeed)
3. **Check gallery** - drawing appears
4. **Result:** ✅ Drawing visible in gallery

### ✅ Test Case 2: Edit Existing Drawing
1. **Open drawing** from gallery
2. **Make changes** to the drawing
3. **Save again** (should update, not create new)
4. **Check gallery** - changes persist
5. **Result:** ✅ Changes saved correctly

### ✅ Test Case 3: Delete Drawing
1. **Delete drawing** from gallery
2. **Check backend** - drawing removed from database
3. **Result:** ✅ Drawing deleted from both frontend and backend

### ✅ Test Case 4: Offline Fallback
1. **Stop backend server**
2. **Draw and save** (should save locally)
3. **Check gallery** - drawing still appears
4. **Restart backend**
5. **Check sync** - local drawings should sync
6. **Result:** ✅ Offline mode works, sync on reconnect

### ✅ Test Case 5: App Restart Persistence
1. **Create drawings**
2. **Close and restart app**
3. **Check gallery** - all drawings still visible
4. **Result:** ✅ Data persists across app restarts

### ✅ Test Case 6: Mixed Local/Backend Drawings
1. **Create drawing with backend on**
2. **Stop backend, create another drawing**
3. **Start backend**
4. **Check gallery** - both drawings visible, no duplicates
5. **Result:** ✅ Local and backend drawings merge correctly

### ✅ Test Case 7: Error Handling
1. **Invalid backend URL** - should fallback gracefully
2. **Network timeout** - should not crash app
3. **Backend returns error** - should show appropriate message
4. **Result:** ✅ Graceful error handling

## 🔍 Backend API Tests

Test these endpoints directly at `http://YOUR_IP:8000/docs`:

### POST /drawings
```json
{
  "name": "Test Drawing",
  "preview_image": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
  "canvas_state": {
    "id": "test",
    "name": "Test",
    "elements": [],
    "backgroundColor": "#ffffff",
    "canvasWidth": 400,
    "canvasHeight": 600,
    "version": "1.0.0",
    "createdAt": 1640995200000,
    "updatedAt": 1640995200000
  }
}
```

### GET /drawings
Should return array of drawings

### GET /drawings/{id}
Should return specific drawing

### PUT /drawings/{id}
Should update existing drawing

### DELETE /drawings/{id}
Should delete drawing

## 📊 Success Criteria

All tests must pass:
- ✅ No UI layout changes
- ✅ No crashes or errors
- ✅ Backend integration works
- ✅ Offline fallback works
- ✅ Data persistence works
- ✅ Edit flow works correctly
- ✅ Delete functionality works
- ✅ No duplicate drawings
- ✅ Graceful error handling

## 🚨 Failure Indicators

If any of these occur, the integration has issues:
- ❌ App crashes when backend is unavailable
- ❌ Drawings disappear after app restart
- ❌ Edit mode doesn't restore canvas state
- ❌ Duplicate drawings in gallery
- ❌ False "Failed to save" errors
- ❌ UI layout shifts or breaks
- ❌ Drawing tools stop working