import { ColumnDefinition, SourceSchema, SourceTableDefinition, SqlSyncRules, TsSchemaGeneratorOptions, TsSchemaImports, TsSchemaLanguage, TYPE_INTEGER, TYPE_REAL, TYPE_TEXT } from '@powersync/service-sync-rules';
import { AbstractSchemaGenerator } from './AbstractSchemaGenerator';


export class TsSchemaGenerator extends AbstractSchemaGenerator {
    readonly language: TsSchemaLanguage;

    constructor(public readonly options: TsSchemaGeneratorOptions = {}) {
        super();
        this.language = options.language ?? TsSchemaLanguage.ts;
    }

    generate(source: SqlSyncRules, schema: SourceSchema, otherTables: SourceTableDefinition[]): string {
        const tables = this.getAllTables(source, schema, otherTables);
        return `${this.generateImports()}
${tables.map((table) => this.generateTable(table.name, table.columns)).join('\n\n')}
export const AppSchema = new Schema({
  ${tables.map((table) => table.name).join(',\n  ')}
});
${this.generateTypeExports()}`;
    }

    private generateTypeExports() {
        if (this.language == TsSchemaLanguage.ts) {
            return `export type Database = (typeof AppSchema)['types'];\n`;
        } else {
            return ``;
        }
    }

    private generateImports() {
        const importStyle = this.options.imports ?? 'auto';
        if (importStyle == TsSchemaImports.web) {
            return `import { column, Schema, Table } from '@powersync/web';`;
        } else if (importStyle == TsSchemaImports.reactNative) {
            return `import { column, Schema, Table } from '@powersync/react-native';`;
        } else {
            return `import { column, Schema, Table } from '@powersync/web';
// OR: import { column, Schema, Table } from '@powersync/react-native';`;
        }
    }

    private generateTable(name: string, columns: ColumnDefinition[]): string {
        return `const ${name} = new Table(
  {
    // id column (text) is automatically included
    ${columns.map((c) => this.generateColumn(c)).join(',\n    ')}
  },
  { indexes: {} }
);`;
    }

    private generateColumn(column: ColumnDefinition) {
        const t = column.type;
        if (t.typeFlags & TYPE_TEXT) {
            return `${column.name}: column.text`;
        } else if (t.typeFlags & TYPE_REAL) {
            return `${column.name}: column.real`;
        } else if (t.typeFlags & TYPE_INTEGER) {
            return `${column.name}: column.integer`;
        } else {
            return `${column.name}: column.text`;
        }
    }
}
