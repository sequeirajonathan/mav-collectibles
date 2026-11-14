import { config } from "dotenv";

// Same database the app uses locally (`npm run db:start`); CI sets DATABASE_URL directly.
config({ path: [".env.local", ".env"], quiet: true });
