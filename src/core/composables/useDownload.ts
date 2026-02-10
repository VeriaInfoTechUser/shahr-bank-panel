import { ref } from 'vue';
import { toast } from 'vue3-toastify';
import { apiClient } from '../api/apiClient';

export function useDownload() {
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function download(
    endpoint: string,
    body: Record<string, unknown>,
    filename?: string
  ): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      const blob = await apiClient.download(endpoint, body);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename ?? 'download';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast('Download completed', { theme: 'auto', type: 'success' });
    } catch (err) {
      error.value = (err as Error).message;
      toast('Download failed', { theme: 'auto', type: 'error' });
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return { loading, error, download };
}
