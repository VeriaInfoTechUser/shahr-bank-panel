import { ref, computed, watch } from 'vue';
import { useForm } from 'vee-validate';
import type { FieldSchema } from './validationBuilder';
import { buildValidationSchema } from './validationBuilder';

export function useFormBuilder(
  fields: FieldSchema[],
  options: { initialValues?: Record<string, unknown>; mode?: 'create' | 'edit' } = {}
) {
  const { initialValues = {}, mode = 'create' } = options;

  const schema = buildValidationSchema(fields);
  const visibleFields = computed(() =>
    fields.filter((f) => !f.condition || f.condition(values.value))
  );

  const { values, errors, handleSubmit, resetForm, setFieldValue, setValues } = useForm({
    validationSchema: schema,
    initialValues,
  });

  const loading = ref(false);

  function setLoading(v: boolean) {
    loading.value = v;
  }

  function reset() {
    resetForm({ values: initialValues });
  }

  function loadEditData(data: Record<string, unknown>) {
    setValues(data);
  }

  return {
    values,
    errors,
    handleSubmit,
    visibleFields,
    loading,
    setLoading,
    reset,
    loadEditData,
    setFieldValue,
    mode,
  };
}
