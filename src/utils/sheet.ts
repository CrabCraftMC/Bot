import { JWT } from "google-auth-library";
import { GoogleSpreadsheet } from "google-spreadsheet";
import config from "./config";

const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.file",
];

const jwt = new JWT({
  email: config.GOOGLE_SERVICE_ACCOUNT_EMAIL!,
  key: config.GOOGLE_SERVICE_ACCOUNT_KEY!.replace(/\\n/g, "\n"),
  scopes: SCOPES,
});

export default class Sheet {
  private doc: GoogleSpreadsheet;

  constructor() {
    this.doc = new GoogleSpreadsheet(config.GOOGLE_SHEET_ID, jwt);
  }

  async setRow(data: {
    minecraftUsername: string;
    minecraftUUID: string;
    discordUsername: string;
    discordID: string;
    over15: string;
    voiceChat: string;
    active: string;
    joinReason?: string;
    favouriteWood?: string;
  }) {
    await this.doc.loadInfo();
    await this.doc.sheetsByIndex[0].addRow({
      "Minecraft Username": data.minecraftUsername,
      "Minecraft UUID": data.minecraftUUID,
      "Discord Username": data.discordUsername,
      "Discord ID": data.discordID,
      "Over 15?": data.over15,
      "Voice Chat?": data.voiceChat,
      "Active?": data.active,
      "Join Reason": data.joinReason || "",
      "Favourite Wood": data.favouriteWood || "",
    });
  }

  async getRows() {
    await this.doc.loadInfo();
    const sheet = this.doc.sheetsByIndex[0];

    return await sheet.getRows();
  }

  async inactiveUser(discordID: string) {
    await this.doc.loadInfo();
    const rows = await this.doc.sheetsByIndex[0].getRows();
    const matchingRow = rows.find(
      (_row_) => _row_.get("Discord ID") === discordID
    );

    if (!matchingRow) return;

    matchingRow?.set("Active?", "FALSE");

    await matchingRow?.save();
  }
}
