import { TsSchemaGeneratorOptions, TsSchemaLanguage } from '@powersync/service-sync-rules';
import { AbstractSchemaGenerator } from './AbstractSchemaGenerator';
import { DartSchemaGenerator } from './DartSchemaGenerator';
import { TsSchemaGenerator } from './TsSchemaGenerator';

export enum SchemaLanguage {
    DART = 'dart',
    TS = 'ts',
    JS = 'js'
}

export class SchemaGeneratorFactory {
    static createGenerator(language: SchemaLanguage): AbstractSchemaGenerator {
        switch (language) {
            case SchemaLanguage.DART:
                return new DartSchemaGenerator();
            case SchemaLanguage.TS:
                return new TsSchemaGenerator({ language: TsSchemaLanguage.ts });
            case SchemaLanguage.JS:
                return new TsSchemaGenerator({ language: TsSchemaLanguage.js });
            default:
                throw new Error(`Unsupported language: ${language}`);
        }
    }
}
