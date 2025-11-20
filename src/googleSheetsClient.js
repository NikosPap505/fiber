import { google } from "googleapis";
import "dotenv/config";

const auth = new google.auth.GoogleAuth({
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

export async function getSheetsClient() {
  const authClient = await auth.getClient();
  return google.sheets({ version: "v4", auth: authClient });
}

export const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
