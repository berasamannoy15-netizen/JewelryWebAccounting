import { Readable } from "node:stream";
import { google } from "googleapis";

export type DriveUploadResult = {
  uploaded: boolean;
  fileId?: string;
  webViewLink?: string;
  message: string;
};

function parseServiceAccount() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;

  const parsed = JSON.parse(raw) as {
    client_email?: string;
    private_key?: string;
  };

  if (!parsed.client_email || !parsed.private_key) {
    throw new Error(
      "GOOGLE_SERVICE_ACCOUNT_JSON must include client_email and private_key.",
    );
  }

  return {
    client_email: parsed.client_email,
    private_key: parsed.private_key.replace(/\\n/g, "\n"),
  };
}

export async function uploadWorkbookToDrive(
  fileName: string,
  buffer: Buffer,
): Promise<DriveUploadResult> {
  const credentials = parseServiceAccount();
  if (!credentials) {
    return {
      uploaded: false,
      message:
        "Google Drive is not configured yet. The Excel file was still generated so you can download it. Add GOOGLE_SERVICE_ACCOUNT_JSON to .env.local to enable cloud sync.",
    };
  }

  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ["https://www.googleapis.com/auth/drive.file"],
  });

  const drive = google.drive({ version: "v3", auth });
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || undefined;

  const created = await drive.files.create({
    requestBody: {
      name: fileName,
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      parents: folderId ? [folderId] : undefined,
    },
    media: {
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      body: Readable.from(buffer),
    },
    fields: "id, webViewLink, name",
    supportsAllDrives: true,
  });

  return {
    uploaded: true,
    fileId: created.data.id ?? undefined,
    webViewLink: created.data.webViewLink ?? undefined,
    message: "Spreadsheet synced to Google Drive.",
  };
}
