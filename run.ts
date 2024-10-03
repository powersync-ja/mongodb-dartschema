import 'dotenv/config'
import { SchemaGeneratorFactory, SchemaLanguage } from './src/SchemaGeneratorFactory';
import { SqlSyncRules } from '@powersync/service-sync-rules';
import fs from 'node:fs';
import { MongoDBSchemaDiscovery } from './src/MongoDbDiscovery';
import { MongoClientOptions } from 'mongodb';

const connectionString = process.env.URL
const dbName = process.env.DB_NAME
const schemaLanguage = process.env.SCHEMA_LANGUAGE.toLowerCase() as SchemaLanguage || SchemaLanguage.DART
const sampleSize = Number(process.env.SAMPLE_SIZE_INT) || 5

export const run = async (connectionString: string, dbName: string, sampleSize: number, options?: MongoClientOptions) => {
  const { schema, otherTables } = await MongoDBSchemaDiscovery.discoverAndCreateSchema(connectionString, dbName, sampleSize, options);

  const syncRulesFromFile = fs.readFileSync('./sync-rules.yaml', 'utf8');
  const syncRules = SqlSyncRules.fromYaml(syncRulesFromFile, {
      schema: schema,
      throwOnError: false
  });

  const generator = SchemaGeneratorFactory.createGenerator(schemaLanguage);


  const languageSchema = await generator.generate(syncRules, schema, otherTables);
  console.log(languageSchema)
}

await run(connectionString, dbName, sampleSize)
