# Firebase Authentication Setup Guide

This guide will help you set up Firebase Authentication for the Drawing & Sketch Canvas app.

## Prerequisites

- A Google account
- Access to the Firebase Console (https://console.firebase.google.com)

## Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project" or "Add project"
3. Enter your project name (e.g., "drawing-sketch-canvas")
4. Choose whether to enable Google Analytics (optional)
5. Click "Create project"

## Step 2: Enable Authentication

1. In your Firebase project console, click on "Authentication" in the left sidebar
2. Click on the "Get started" button
3. Go to the "Sign-in method" tab
4. Enable "Email/Password" authentication:
   - Click on "Email/Password"
   - Toggle "Enable" to ON
   - Click "Save"

## Step 3: Enable Firestore Database

1. In your Firebase project console, click on "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" (you can configure security rules later)
4. Select a location for your database
5. Click "Done"

## Step 4: Get Firebase Configuration

1. In your Firebase project console, click on the gear icon (⚙️) next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click on the web icon (</>) to add a web app
5. Enter an app nickname (e.g., "drawing-app-web")
6. Click "Register app"
7. Copy the Firebase configuration object

## Step 5: Update Firebase Configuration

1. Open `src/config/firebase.ts` in your project
2. Replace the placeholder configuration with your actual Firebase config:

```typescript
const firebaseConfig = {
  apiKey: "your-api-key-here",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

## Step 6: Configure Firestore Security Rules

1. In your Firebase project console, go to "Firestore Database"
2. Click on the "Rules" tab
3. Replace the default rules with the following secure rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own drawings
    match /drawings/{drawingId} {
      allow read, write, delete: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

4. Click "Publish"

## Step 7: Test the Setup

1. Start your development server:
   ```bash
   npm start
   ```

2. The app should now show the login screen on first launch
3. Try creating a new account with email and password
4. After successful registration/login, you should be able to access the main app
5. Create a drawing and save it - it should be stored in Firebase Firestore
6. Log out and log back in - your drawings should persist

## Security Best Practices

### Firestore Security Rules
The security rules ensure that:
- Only authenticated users can access drawings
- Users can only see and modify their own drawings
- Each drawing must have a valid userId field

### Authentication Security
- Passwords must be at least 6 characters (Firebase requirement)
- Email validation is performed on both client and server side
- User sessions persist across app restarts
- Secure token-based authentication

## Troubleshooting

### Common Issues

1. **"Firebase not configured" error**
   - Make sure you've replaced the placeholder config in `firebase.ts`
   - Verify all configuration values are correct

2. **Authentication not working**
   - Check that Email/Password is enabled in Firebase Console
   - Verify your Firebase project is active

3. **Firestore permission denied**
   - Make sure security rules are published
   - Verify the user is authenticated before accessing Firestore

4. **Drawings not syncing**
   - Check your internet connection
   - Verify Firestore is enabled and configured
   - Check browser/app console for error messages

### Getting Help

If you encounter issues:
1. Check the browser/app console for error messages
2. Verify your Firebase configuration
3. Test with a simple email/password combination
4. Check Firebase Console for authentication and database activity

## Production Deployment

Before deploying to production:

1. **Update Security Rules**: Review and tighten Firestore security rules
2. **Enable App Check**: Add additional security layer
3. **Configure Domains**: Add your production domain to Firebase Auth settings
4. **Monitor Usage**: Set up Firebase monitoring and alerts
5. **Backup Strategy**: Configure Firestore backups

## Multi-Device Access

Once configured, users can:
- Sign in with the same email/password on any device
- Access their drawings from any device
- Drawings automatically sync across devices
- Offline drawings sync when connection is restored

The authentication system provides secure, persistent access to user drawings across all devices while maintaining data privacy and security.