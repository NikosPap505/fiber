# Project Setup Guide

To get the system running, we need to configure the external services (Google Sheets & Telegram).

## 1. Google Sheets Setup

1.  **Create a Google Cloud Project**:
    *   Go to [Google Cloud Console](https://console.cloud.google.com/).
    *   Create a new project (e.g., "Fiber-Manager").

2.  **Enable Google Sheets API**:
    *   In the search bar, type "Google Sheets API".
    *   Click on it and press **Enable**.

3.  **Create Service Account**:
    *   Go to **IAM & Admin** > **Service Accounts**.
    *   Click **Create Service Account**.
    *   Name it (e.g., "fiber-bot").
    *   Click **Done**.

4.  **Get Credentials (JSON)**:
    *   Click on the newly created service account (email address).
    *   Go to the **Keys** tab.
    *   Click **Add Key** > **Create new key** > **JSON**.
    *   A file will download. **Keep this safe!**
    *   Open the file and copy the `client_email` and `private_key`.

5.  **Share the Sheet**:
    *   Create a new Google Sheet.
    *   Click **Share** (top right).
    *   Paste the `client_email` from the step above (e.g., `fiber-bot@...iam.gserviceaccount.com`).
    *   Give it **Editor** access.
    *   Copy the **Sheet ID** from the URL (it's the long string between `/d/` and `/edit`).

## 2. Telegram Bot Setup

1.  Open Telegram and search for **@BotFather**.
2.  Send the command `/newbot`.
3.  Follow the instructions to name your bot.
4.  Copy the **HTTP API Token** provided.

## 3. Update Configuration

Open the `.env` file in the project root and fill in the values:

```env
PORT=3000
GOOGLE_SHEET_ID=your_sheet_id_here
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account_email
GOOGLE_PRIVATE_KEY="your_private_key_including_begin_and_end_lines"
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
```

> **Note**: For the `GOOGLE_PRIVATE_KEY`, make sure to keep the `\n` newlines if you copy it from the JSON, or paste it exactly as it is in the JSON file.
