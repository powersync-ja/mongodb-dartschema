import { ColumnDefinition, SourceSchema, SourceTableDefinition, SqlSyncRules, TYPE_INTEGER, TYPE_REAL, TYPE_TEXT } from '@powersync/service-sync-rules';
import { AbstractSchemaGenerator } from './AbstractSchemaGenerator';

export class DartSchemaGenerator extends AbstractSchemaGenerator {
    generate(source: SqlSyncRules, schema: SourceSchema, otherTables: SourceTableDefinition[]): string {
        const tables = this.getAllTables(source, schema, otherTables);

        return `Schema([
  ${tables.map((table) => this.generateTable(table.name, table.columns)).join(',\n  ')}
]);`;
    }

    private generateTable(name: string, columns: ColumnDefinition[]): string {
        return `Table('${name}', [
    ${columns.map((c) => this.generateColumn(c)).join(',\n    ')}
  ])`;
    }

    private generateColumn(column: ColumnDefinition): string {
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
}
