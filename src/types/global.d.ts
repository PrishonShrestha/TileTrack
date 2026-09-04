export {};

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      GOOGLE_SHEET_ID?: string;
      GOOGLE_SERVICE_ACCOUNT_EMAIL?: string;
      GOOGLE_PRIVATE_KEY?: string;
      GOOGLE_API_KEY?: string;
    }
  }
}
