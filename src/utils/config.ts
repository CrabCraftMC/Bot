import dotenv from "dotenv";

dotenv.config();

interface IConfig {
  ENV: "development" | "production";
  TOKEN: string;
  DEV_GUILD_ID: string;

  CD_CREATOR_CHANNEL_ID: string;

  APPLICATION_CATEGORY_ID: string;
  MEMBER_ROLE_ID: string;

  GOOGLE_SHEET_ID: string;
  GOOGLE_SERVICE_ACCOUNT_EMAIL: string;
  GOOGLE_SERVICE_ACCOUNT_KEY: string;

  DB_HOST: string;
  DB_PORT: string;
  DB_USER: string;
  DB_PASS: string;
  DB_NAME: string;

  LOG_CHANNEL_ID: string;
}

const handler = {
  get: function (_: IConfig, name: string) {
    return process.env[name];
  },
};

const config = new Proxy({} as IConfig, handler);

export default config;
