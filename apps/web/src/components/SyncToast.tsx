import { useEffect, useState } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { useOfflineSync } from '../hooks/useOfflineSync';

type ToastType = 'success' | 'warning' | 'error' | 'info';

interface SyncToastProps {
  type: ToastType;
  message: string;
  actions?: { label: string; onClick: () => void }[];
  autoDismiss?: number | false;
  onDismiss: () => void;
}

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="h-5 w-5 text-green-500" />,
  warning: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
  error: <XCircle className="h-5 w-5 text-red-500" />,
  info: <Info className="h-5 w-5 text-blue-500" />,
};

const BG_COLORS: Record<ToastType, string> = {
  success: 'bg-green-50 border-green-200',
  warning: 'bg-yellow-50 border-yellow-200',
  error: 'bg-red-50 border-red-200',
  info: 'bg-blue-50 border-blue-200',
};

export function SyncToast({ type, message, actions, autoDismiss, onDismiss }: SyncToastProps) {
  useEffect(() => {
    if (autoDismiss) {
      const timer = setTimeout(onDismiss, autoDismiss);
      return () => clearTimeout(timer);
    }
  }, [autoDismiss, onDismiss]);

  return (
    <div
      className={`fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 border rounded-lg shadow-lg p-4 ${BG_COLORS[type]}`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        {ICONS[type]}
        <div className="flex-1">
          <p className="text-sm text-gray-900">{message}</p>
          {actions && actions.length > 0 && (
            <div className="mt-2 flex gap-2">
              {actions.map((action) => (
                <button
                  key={action.label}
                  onClick={action.onClick}
                  className="text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={onDismiss}
          className="text-gray-400 hover:text-gray-600"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function OfflineStatusToast() {
  const { isOnline, queueSize } = useOfflineSync();
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (!isOnline && queueSize > 0) {
      setShowToast(true);
    } else if (isOnline && queueSize === 0) {
      setShowToast(false);
    }
  }, [isOnline, queueSize]);

  if (!showToast) return null;

  return (
    <SyncToast
      type="warning"
      message={`Saved offline. Will sync when connected. (${queueSize} pending)`}
      autoDismiss={false}
      onDismiss={() => setShowToast(false)}
    />
  );
}

