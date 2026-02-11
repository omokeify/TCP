# How to Deploy the Email Backend

To enable real email sending and Google Sheets database storage, follow these steps:

## 1. Create a Google Sheet
1. Go to [Google Sheets](https://sheets.new) and create a new blank spreadsheet.
2. Name it "Class Portal DB" (or anything you like).
3. **Important:** You do not need to create columns manually; the script will do it for you.

## 2. Open Apps Script
1. In your Google Sheet, click **Extensions** > **Apps Script** in the top menu.
2. This opens a new tab with a code editor.

## 3. Paste the Code
1. Open the file `scripts/google_apps_script.js` in this project.
2. Copy **ALL** the content.
3. In the Apps Script editor, delete any existing code (usually `function myFunction() {...}`).
4. Paste the copied code.
5. Press `Ctrl + S` (or Cmd + S) to save. Name the project "TCP API".

## 4. Deploy as Web App
1. Click the blue **Deploy** button (top right) -> **New deployment**.
2. Click the "Select type" gear icon -> **Web app**.
3. Fill in the details:
25→   - **Description**: `v10 - TCP Branding`
26→   - **Execute as**: `Me` (your email)
   - **Who has access**: `Anyone` (**Crucial**: This allows your app to talk to the sheet).
4. Click **Deploy**.

## 5. Grant Permissions
1. A window will pop up asking for permission. Click **Authorize access**.
2. Select your Google account.
3. You might see a "Google hasn't verified this app" warning (since you just wrote it).
   - Click **Advanced**.
   - Click **Go to TCP API (unsafe)** at the bottom.
4. Click **Allow**.

## 6. Connect to Your App
1. Copy the **Web App URL** provided (it starts with `https://script.google.com/macros/s/...`).
2. Go to your Admin Dashboard in the running app (`/admin/settings`).
3. Paste the URL into the **Apps Script Web App URL** field.
4. The system will now use this backend for emails and data storage!

## 7. Verify
1. Create a test application.
2. Approve it in the dashboard.
3. Check your email inbox!
