export default () => ({
  NODE_ENV: process.env.NODE_ENV,

  port: parseInt(process.env.PORT ?? '3000'),

  secret: process.env.SECRET,

  database: {
    url: process.env.DB_URL,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT ?? '5432'),
    user: process.env.DB_USENAME,
    pass: process.env.DB_PWD,
    name: process.env.DB_NAME,
  },

  email: {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE,
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    from: process.env.EMAIL_FROM,
    pool: process.env.EMAIL_POOL,
    max_conn: process.env.EMAIL_MAX_CONNECTIONS,
    max_msg: process.env.EMAIL_MAX_MESSAGES,
  },

  paystack: {
    url: process.env.PAYSTACK_BASE_URL,
    callback_url: process.env.PAYSTACK_CALLBACK_URL,
    public_key: process.env.PAYSTACK_PUBLIC_KEY,
    secret_key: process.env.PAYSTACK_SECRET_KEY,
  },

  frontendUrl: process.env.FRONT_END_URL,
});
