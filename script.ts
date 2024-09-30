import { MongoClient, Db, ObjectId, MongoClientOptions } from 'mongodb';
import fs from 'node:fs';
import {
    ColumnDefinition,
    ExpressionType,
    SourceColumnDefinition,
    SourceConnectionDefinition,
    SourceSchema,
    SourceTableDefinition,
    SqlSyncRules,
    StaticSchema,
    TYPE_INTEGER,
    TYPE_REAL,
    TYPE_TEXT
} from '@powersync/service-sync-rules';

export class MongoDBSchemaDiscovery {
    private client: MongoClient;
    private db: Db;

    constructor(url: string, dbName: string, options?: MongoClientOptions) {
        this.client = new MongoClient(url, options);
        this.db = this.client.db(dbName);
    }

    async connect(): Promise<void> {
        await this.client.connect();
    }

    async close(): Promise<void> {
        await this.client.close();
    }

    async discoverSchema(connectionTag: string, sampleSize: number = 5): Promise<SourceConnectionDefinition> {
        const collections = await this.db.listCollections().toArray();
        const tables: SourceTableDefinition[] = [];

        for (const collection of collections) {
            const tableName = collection.name;
            const sampleDocuments = await this.db.collection(tableName)
                .aggregate([{ $sample: { size: sampleSize } }])
                .toArray();

            if (sampleDocuments.length > 0) {
                const columns = this.getColumnsFromDocuments(sampleDocuments);
                tables.push({
                    name: tableName,
                    columns
                });
            }
        }

        const connection: SourceConnectionDefinition = {
            tag: connectionTag,
            schemas: [{
                name: this.db.databaseName,
                tables: tables
            }]
        };

        return connection;
    }

    private getColumnsFromDocuments(documents: any[]): SourceColumnDefinition[] {
        const columns: SourceColumnDefinition[] = []
        for (const document of documents) {
            for (const key in document) {
                const value = document[key];
                const type = this.getMongoDBType(value);

                columns.push({
                    name: key,
                    pg_type: type
                });
            }
        }
        const uniqueColumns = Array.from(new Map(columns.map(item => [item.name, item])).values());

        return uniqueColumns;
    }

    private getMongoDBType(value: any): string {
        if (typeof value === 'string') return 'string'
        if (typeof value === 'number') {
            if (Number.isInteger(value)) return 'integer'
            return 'real'
        }
        if (typeof value === 'boolean') return 'integer'
        if (value instanceof Date) return 'text'
        if (value instanceof ObjectId) return 'text'
        if (Array.isArray(value)) return 'text'
        if (value === null) return 'null'
        if (typeof value === 'object') return 'text'
        return 'text';
    }

    static discoverAndCreateSchema = async (
        connectionString: string,
        dbName: string,
        sampleSize: number,
        options?: MongoClientOptions
    ): Promise<{ schema: SourceSchema, otherTables: SourceTableDefinition[] }> => {
        const discovery = new MongoDBSchemaDiscovery(connectionString, dbName, options);

        try {
            await discovery.connect();
            const connectionDefinition = await discovery.discoverSchema('default', sampleSize);
            const staticSchema = new StaticSchema([connectionDefinition]);

            return { schema: staticSchema, otherTables: connectionDefinition.schemas[0].tables };
        } catch (error) {
            console.error('Error:', error);
        } finally {
            await discovery.close();
        }
    }
}



function convertPgTypeToExpressionType(pgType: string): ExpressionType {
    switch (pgType.toLowerCase()) {
        case 'text':
        case 'string':
            return ExpressionType.TEXT;
        case 'integer':
        case 'bigint':
            return ExpressionType.INTEGER;
        case 'real':
            return ExpressionType.REAL;
        case 'boolean':
            return ExpressionType.INTEGER;
        default:
            return ExpressionType.TEXT;
    }
}

function convertColumnsToExpressionType(columns) {
    return columns.map(column => ({
        name: column.name,
        type: convertPgTypeToExpressionType(column.pg_type)
    }));
}

const generateTable = (name: string, columns: ColumnDefinition[]): string => {
    return `Table('${name}', [
    ${columns.map((c) => generateColumn(c)).join(',\n    ')}
  ])`;
}

const getAllTables = (source: SqlSyncRules, schema: SourceSchema, otherTables: SourceTableDefinition[]) => {
    let tables: Record<string, Record<string, ColumnDefinition>> = {};

    for (let descriptor of source.bucket_descriptors) {
        for (let query of descriptor.data_queries) {
            const outTables = query.getColumnOutputs(schema);
            for (let table of outTables) {
                for (let staticTable of otherTables) {
                    if (table.name == staticTable.name) {
                        table.columns = convertColumnsToExpressionType(staticTable.columns);
                    }
                }
                tables[table.name] ??= {};
                for (let column of table.columns) {
                    if (column.name != 'id') {
                        tables[table.name][column.name] ??= column;
                    }
                }
            }
        }
    }

    return Object.entries(tables).map(([name, columns]) => {
        return {
            name: name,
            columns: Object.values(columns)
        };
    });
}

const generateColumn = (column: ColumnDefinition) => {
    const t = column.type;
    if (t.typeFlags & TYPE_TEXT) {
        return `Column.text('${column.name}')`;
    } else if (t.typeFlags & TYPE_REAL) {
        return `Column.real('${column.name}')`;
    } else if (t.typeFlags & TYPE_INTEGER) {
        return `Column.integer('${column.name}')`;
    } else {
        return `Column.text('${column.name}')`;
    }
}


export const run = async (connectionString: string, dbName: string, sampleSize: number, options?: MongoClientOptions) => {
    const { schema, otherTables } = await MongoDBSchemaDiscovery.discoverAndCreateSchema(connectionString, dbName, sampleSize, options);

    const generate = (source: SqlSyncRules, schema: SourceSchema): string => {
        const tables = getAllTables(source, schema, otherTables);

        return `Schema([
  ${tables.map((table) => generateTable(table.name, table.columns)).join(',\n  ')}
]);
`;
    }

    const generateDartSchema = async (schema: SourceSchema) => {
        const syncRulesFromFile = fs.readFileSync('./sync-rules.yaml', 'utf8');

        const syncRules = SqlSyncRules.fromYaml(syncRulesFromFile, {
            schema: schema,
            throwOnError: false
        });

        const errors = syncRules.errors;
        // Log Sync Rule errors
        if (errors.length) {
            for (const error of errors) {
                // Ignore warnings about not having public.* tables
                if (error.type !== 'warning') {
                    console.error(error.message);
                }
            }
        }

        const languageSchema = await generate(syncRules, schema);
        return languageSchema;
    }

    const languageSchema = await generateDartSchema(schema);
    console.log(languageSchema)
}
