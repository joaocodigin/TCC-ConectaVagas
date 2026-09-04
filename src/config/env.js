import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || "development",
  sessionSecret: process.env.SESSION_SECRET || "conecta_vagas_secret_key_default",
  databasePath: process.env.DATABASE_PATH || "./src/database/database.sqlite"
};