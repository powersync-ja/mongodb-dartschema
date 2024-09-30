import 'dotenv/config'
import { run } from "./script";

// Set this to the connection
const connectionString = process.env.URL
const dbName = process.env.DB_NAME
const sampleSize = Number(process.env.SAMPLE_SIZE_INT) || 5

await run(connectionString, dbName, sampleSize);
