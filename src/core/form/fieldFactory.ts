import { h } from 'vue';
import BaseInput from '../ui/base/BaseInput.vue';
import BaseSelect from '../ui/base/BaseSelect.vue';
import type { FieldSchema } from './validationBuilder';

export function getFieldComponent(field: FieldSchema) {
  switch (field.type) {
    case 'text':
    case 'textarea':
      return BaseInput;
    case 'select':
      return BaseSelect;
    case 'number':
      return BaseInput;
    case 'date':
      return BaseInput;
    case 'boolean':
      return BaseInput;
    case 'file':
      return BaseInput;
    default:
      return BaseInput;
  }
}

export function getFieldProps(field: FieldSchema) {
  const base = {
    name: field.name,
    label: field.label,
    required: field.required,
  };

  switch (field.type) {
    case 'textarea':
      return { ...base, type: 'textarea', rows: 4 };
    case 'select':
      return { ...base, options: field.options || [], optionsEndpoint: field.optionsEndpoint };
    case 'number':
      return { ...base, type: 'number', min: field.min, max: field.max };
    case 'date':
      return { ...base, type: 'date' };
    case 'file':
      return { ...base, type: 'file' };
    default:
      return { ...base, type: 'text' };
  }
}
