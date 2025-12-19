import toast from 'react-hot-toast';

/**
 * Toast Service
 * Centralized service for displaying toast notifications
 */
export const toastService = {
  /**
   * Show a success toast
   */
  success: (message: string) => {
    toast.success(message);
  },

  /**
   * Show an error toast
   */
  error: (message: string) => {
    toast.error(message);
  },

  /**
   * Show an info toast
   */
  info: (message: string) => {
    toast(message, {
      icon: 'ℹ️',
    });
  },

  /**
   * Show a warning toast
   */
  warning: (message: string) => {
    toast(message, {
      icon: '⚠️',
      style: {
        background: '#f59e0b',
        color: '#fff',
      },
    });
  },

  /**
   * Show a loading toast
   * Returns the toast ID which can be used to dismiss it later
   */
  loading: (message: string) => {
    return toast.loading(message);
  },

  /**
   * Dismiss a specific toast by ID
   */
  dismiss: (toastId: string) => {
    toast.dismiss(toastId);
  },

  /**
   * Show a promise-based toast
   * Automatically shows loading, success, and error states
   */
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((err: any) => string);
    }
  ) => {
    return toast.promise(promise, messages);
  },

  /**
   * Confirmation toast with custom action
   * Shows a toast with confirm/cancel buttons
   */
  confirm: (
    messageOrOptions: string | { message: string; onConfirm: () => void | Promise<void>; onCancel?: () => void },
    onConfirm?: () => void | Promise<void>,
    onCancel?: () => void
  ) => {
    // Support both object and separate arguments
    const message = typeof messageOrOptions === 'string' ? messageOrOptions : messageOrOptions.message;
    const confirmFn = typeof messageOrOptions === 'string' ? onConfirm! : messageOrOptions.onConfirm;
    const cancelFn = typeof messageOrOptions === 'string' ? onCancel : messageOrOptions.onCancel;
    const id = toast(
      (t) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <span>{message}</span>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                if (cancelFn) cancelFn();
              }}
              style={{
                padding: '6px 12px',
                background: '#6b7280',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                try {
                  await confirmFn();
                } catch (error) {
                  // Error will be handled by the calling code
                }
              }}
              style={{
                padding: '6px 12px',
                background: '#ef4444',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Confirm
            </button>
          </div>
        </div>
      ),
      {
        duration: 10000,
        style: {
          minWidth: '300px',
        },
      }
    );
    return id;
  },
};
