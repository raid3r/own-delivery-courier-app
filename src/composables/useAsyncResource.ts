import { ref } from 'vue'

interface ExecuteOptions {
  errorMessage?: string
  throwOnError?: boolean
}

export function useAsyncResource() {
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function execute<T>(operation: () => Promise<T>, options?: ExecuteOptions): Promise<T | null> {
    isLoading.value = true
    error.value = null

    try {
      return await operation()
    } catch (err) {
      error.value = options?.errorMessage ?? 'Failed to load data. Please try again.'

      if (options?.throwOnError) {
        throw err
      }

      return null
    } finally {
      isLoading.value = false
    }
  }

  function clearError() {
    error.value = null
  }

  return {
    isLoading,
    error,
    execute,
    clearError,
  }
}

