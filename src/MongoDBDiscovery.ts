import { MongoClient, Db, ObjectId, MongoClientOptions } from 'mongodb';
import {
    SourceColumnDefinition,
    SourceConnectionDefinition,
    SourceSchema,
    SourceTableDefinition,
    StaticSchema,
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
                const type = this.getType(value);

                columns.push({
                    name: key,
                    pg_type: type
                });
            }
        }
        const uniqueColumns = Array.from(new Map(columns.map(item => [item.name, item])).values());

        return uniqueColumns;
    }

    private getType(value: any): string {
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
