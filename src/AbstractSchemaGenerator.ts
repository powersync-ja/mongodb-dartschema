import { ColumnDefinition, ExpressionType, SourceSchema, SourceTableDefinition, SqlSyncRules } from '@powersync/service-sync-rules';

export abstract class AbstractSchemaGenerator {
    abstract generate(source: SqlSyncRules, schema: SourceSchema, otherTables: SourceTableDefinition[]): string;

    protected getAllTables(source: SqlSyncRules, schema: SourceSchema, otherTables: SourceTableDefinition[]): { name: string, columns: ColumnDefinition[] }[] {
        let tables: Record<string, Record<string, ColumnDefinition>> = {};

        for (let descriptor of source.bucket_descriptors) {
            for (let query of descriptor.data_queries) {
                const outTables = query.getColumnOutputs(schema);
                for (let table of outTables) {
                    for (let staticTable of otherTables) {
                        if (table.name == staticTable.name) {
                            table.columns = this.convertColumnsToExpressionType(staticTable.columns);
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

    protected convertColumnsToExpressionType(columns: any[]): ColumnDefinition[] {
        return columns.map(column => ({
            name: column.name,
            type: this.convertPgTypeToExpressionType(column.pg_type)
        }));
    }

    protected convertPgTypeToExpressionType(pgType: string): ExpressionType {
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
}
