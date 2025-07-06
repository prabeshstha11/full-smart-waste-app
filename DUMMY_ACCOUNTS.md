# Dummy Accounts for Testing

This document outlines the dummy accounts created for testing different user roles in the Sajilo Waste app.

## Available Dummy Accounts

### 1. **User Account**
- **Email**: `user@sajilowaste.com`
- **Password**: `user`
- **Role**: Customer/User
- **Redirects to**: Customer Home Page
- **Message**: "Hello User!"

### 2. **Dealer Account**
- **Email**: `dealer@sajilowaste.com`
- **Password**: `dealer`
- **Role**: Dealer
- **Redirects to**: Dealer Home Page
- **Message**: "Hello Dealer!"

### 3. **Rider Account**
- **Email**: `rider@sajilowaste.com`
- **Password**: `rider`
- **Role**: Rider
- **Redirects to**: Rider Home Page
- **Message**: "Hello Rider!"

## How to Use

1. **Open the app** and go to the login screen
2. **Enter one of the dummy account credentials** above
3. **Click "Sign In"** - you'll be automatically redirected to the appropriate page based on the email
4. **See the personalized greeting** for each role

## Page Structure

- **`app/customer-home.tsx`** - User dashboard (shows "Hello User!")
- **`app/dealer-home.tsx`** - Dealer dashboard (shows "Hello Dealer!")
- **`app/rider-home.tsx`** - Rider dashboard (shows "Hello Rider!")

## Authentication Flow

The login page (`app/login.tsx`) automatically routes users to different pages based on their email:

```javascript
if (email === 'user@sajilowaste.com') {
  router.push('/customer-home');
} else if (email === 'dealer@sajilowaste.com') {
  router.push('/dealer-home');
} else if (email === 'rider@sajilowaste.com') {
  router.push('/rider-home');
} else {
  // Default to user page for other emails
  router.push('/customer-home');
}
```

## Notes

- All accounts use simple passwords for easy testing
- Each page shows a personalized greeting
- Sign out functionality is available on each page
- The routing is based on email addresses for simplicity
- You can extend these pages later with role-specific functionality 