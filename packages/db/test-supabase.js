const { config } = require('dotenv');
config({ path: '../../.env' });
const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL);
(async () => {
  try {
    const result = await sql`select version()`;
    console.log(result);
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    await sql.end();
  }
})();
