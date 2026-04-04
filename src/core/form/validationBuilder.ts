import * as yup from 'yup';

export type FieldType = 'text' | 'select' | 'date' | 'number' | 'boolean' | 'textarea' | 'file';

export interface FieldSchema {
  type: FieldType;
  name: string;
  label?: string;
  required?: boolean;
  options?: { value: unknown; label: string }[];
  optionsEndpoint?: string;
  condition?: (values: Record<string, unknown>) => boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  nested?: FieldSchema[];
}

export function buildValidationSchema(fields: FieldSchema[]): yup.ObjectSchema {
  const shape: Record<string, yup.Schema> = {};

  for (const field of fields) {
    let schema: yup.Schema;

    switch (field.type) {
      case 'number':
        schema = yup.number();
        if (field.min != null) schema = (schema as yup.NumberSchema).min(field.min);
        if (field.max != null) schema = (schema as yup.NumberSchema).max(field.max);
        break;
      case 'boolean':
        schema = yup.boolean();
        break;
      case 'date':
        schema = yup.date();
        break;
      case 'text':
      case 'textarea':
      default:
        schema = yup.string().trim();
        if (field.pattern) schema = (schema as yup.StringSchema).matches(field.pattern);
        break;
    }

    if (field.required) {
      schema = schema.required(`${field.label || field.name} is required`);
    }

    shape[field.name] = schema;
  }

  return yup.object(shape);
}
