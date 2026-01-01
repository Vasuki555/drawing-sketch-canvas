# Firestore Setup Guide

## Required Firestore Index

The app requires a composite index for querying user drawings. You need to create this index in the Firebase Console.

### Step 1: Create the Index

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `drawing-sketch-canvas`
3. Go to **Firestore Database** → **Indexes** tab
4. Click **Create Index**
5. Set the following configuration:

**Collection ID:** `drawings`

**Fields to index:**
- Field: `userId`, Order: `Ascending`
- Field: `updatedAt`, Order: `Descending`

**Query scopes:** Collection

### Step 2: Alternative - Use the Auto-Generated Link

The error message provides a direct link to create the index:

```
https://console.firebase.google.com/v1/r/project/drawing-sketch-canvas/firestore/indexes?create_composite=ClZwcm9qZWN0cy9kcmF3aW5nLXNrZXRjaC1jYW52YXMvZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL2RyYXdpbmdzL2luZGV4ZXMvXxABGgoKBnVzZXJJZBABGg0KCXVwZGF0ZWRBdBACGgwKCF9fbmFtZV9fEAI
```

Click this link and it will automatically configure the index for you.

### Step 3: Wait for Index Creation

After creating the index:
1. Wait for the index to build (usually takes a few minutes)
2. The status will change from "Building" to "Enabled"
3. Once enabled, the app will be able to query user drawings from Firestore

## Firestore Security Rules

Make sure your Firestore security rules allow authenticated users to read/write their own drawings:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read/write their own drawings
    match /drawings/{drawingId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.auth.uid != null;
    }
  }
}
```

## Authentication Setup

Ensure Email/Password authentication is enabled:

1. Go to **Authentication** → **Sign-in method**
2. Enable **Email/Password** provider
3. Save the configuration

## Testing

After setting up the index and rules:

1. Restart your app: `npx expo start -c`
2. Login with your account
3. Create a drawing
4. Check the logs - you should see:
   - `Successfully saved drawing to Firebase: [drawingId]`
   - No more Firestore index errors when loading drawings

## Troubleshooting

**Index Error:** If you still see index errors, wait a few more minutes for the index to fully build.

**Permission Denied:** Check your Firestore security rules and ensure they match the rules above.

**Auth Persistence:** The app now uses AsyncStorage for auth persistence, so users will stay logged in between app sessions.