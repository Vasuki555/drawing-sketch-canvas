# Network Configuration for Backend Integration

## 🔧 Quick Setup

### 1. Find Your Computer's IP Address

**Windows:**
```cmd
ipconfig
```
Look for "IPv4 Address" under your active network adapter.

**Mac/Linux:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**Example IP:** `192.168.1.100`

### 2. Update Frontend Configuration

Edit `src/config/api.ts` and replace `192.168.1.100` with your actual IP:

```typescript
const LOCAL_IP = '192.168.1.100'; // Replace with your IP
```

### 3. Start Backend

```bash
cd backend
python main.py
```

Backend will run on `http://0.0.0.0:8000` (accessible from network)

### 4. Test Connection

- **Web:** `http://localhost:8000`
- **Mobile:** `http://YOUR_IP:8000`

## 🧪 Testing Checklist

1. ✅ Backend starts without errors
2. ✅ Can access `http://YOUR_IP:8000` in browser
3. ✅ Mobile app connects (check console logs)
4. ✅ Drawings save and appear in gallery
5. ✅ Edit functionality works
6. ✅ Offline fallback works when backend is stopped

## 🐛 Troubleshooting

### "Network request failed"
- Check if backend is running
- Verify IP address is correct
- Check firewall settings
- Ensure both devices are on same network

### "Backend integration is disabled"
- Check `API_CONFIG.ENABLED = true` in `src/config/api.ts`

### Drawings not syncing
- Check console logs for API errors
- Verify backend database is being created
- Test API endpoints at `http://YOUR_IP:8000/docs`