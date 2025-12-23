# Backend Integration Setup

This drawing app now includes a Python FastAPI backend for cloud storage of drawings.

## 🚀 Quick Start

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Run the backend server
python main.py
```

The API will be available at `http://localhost:8000`

### 2. Frontend Configuration

Update the backend URL in `src/config/api.ts`:

```typescript
export const API_CONFIG = {
  BASE_URL: 'http://localhost:8000', // Your backend URL
  TIMEOUT: 10000,
  ENABLED: true, // Set to false to disable backend integration
};
```

### 3. Test the Integration

1. Start the backend server
2. Run your React Native app
3. Create a drawing and save it
4. Check the gallery - drawings should load from the backend
5. Edit a drawing - changes should sync to the backend

## 📡 API Endpoints

- `POST /drawings` - Create a new drawing
- `GET /drawings` - Get all drawings  
- `GET /drawings/{id}` - Get a specific drawing
- `PUT /drawings/{id}` - Update a drawing
- `DELETE /drawings/{id}` - Delete a drawing

## 🔧 Features

### ✅ What Works Now

- **Save to Backend**: Drawings automatically save to the backend when available
- **Load from Backend**: Gallery loads drawings from the backend
- **Edit & Update**: Editing drawings updates them in the backend
- **Offline Fallback**: If backend is unavailable, falls back to local storage
- **Seamless Integration**: No UI changes - everything works transparently

### 🛡️ Fallback Behavior

- If backend is unavailable, drawings save locally (existing behavior)
- Local and backend drawings are merged in the gallery
- Backend drawings take priority over local duplicates
- Offline-first approach ensures the app always works

## 🔍 API Documentation

Visit `http://localhost:8000/docs` when the backend is running for interactive API documentation.

## 🐛 Troubleshooting

### Backend Not Connecting

1. Check if the backend server is running on `http://localhost:8000`
2. Verify the URL in `src/config/api.ts` matches your backend
3. Check console logs for connection errors
4. Ensure CORS is properly configured (already done in the backend)

### Drawings Not Syncing

1. Check network connectivity
2. Look for error messages in the console
3. Verify the backend database (`drawings.db`) is being created
4. Test API endpoints directly at `http://localhost:8000/docs`

### Local vs Backend Drawings

- Backend drawings have `stateUri` starting with `api:`
- Local drawings have file system paths as `stateUri`
- The app automatically handles both types seamlessly

## 🚀 Production Deployment

### Backend Deployment

1. Deploy the FastAPI backend to your preferred cloud provider
2. Update `API_CONFIG.BASE_URL` to your production URL
3. Configure proper CORS origins for security
4. Use a production database (PostgreSQL, etc.) instead of SQLite

### Security Considerations

- Add authentication/authorization if needed
- Configure CORS properly for production
- Use HTTPS in production
- Add rate limiting and input validation
- Consider adding user management if required

## 📝 Database Schema

The SQLite database contains a single `drawings` table:

```sql
CREATE TABLE drawings (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    preview_image TEXT NOT NULL,  -- Base64 encoded
    canvas_state TEXT NOT NULL,   -- JSON string
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔄 Migration from Local-Only

Existing local drawings will continue to work alongside backend drawings. The app automatically:

1. Loads both local and backend drawings
2. Merges them in the gallery
3. Prefers backend versions over local duplicates
4. Maintains backward compatibility

No data migration is required - everything works seamlessly!