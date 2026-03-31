import { useGlobalModalStore } from '@/stores/global-modal';
import type { GlobalModalOpenOptions } from '@/stores/global-modal';

export function useGlobalModal() {
  const store = useGlobalModalStore();

  return {
    openModal: (options: GlobalModalOpenOptions) => store.openModal(options),
    closeModal: () => store.closeModal(),
  };
}

export type { GlobalModalOpenOptions };
