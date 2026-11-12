/** True when a database connection string is present. Pages show "Database not connected" otherwise. */
export const isDbConfigured = Boolean(process.env.DATABASE_URL);
export const isBlobConfigured = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
export const isEmailConfigured = Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
