import React from 'react';

type ConfirmDialogProps = {
  open: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title = 'Confirmar ação',
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
        <div className="px-4 py-3 border-b">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        </div>
        <div className="px-4 py-4">
          <p className="text-sm text-gray-700">{message}</p>
        </div>
        <div className="px-4 py-3 border-t flex justify-end gap-2">
          <button className="px-3 py-2 text-sm rounded border border-gray-300 text-gray-700 hover:bg-gray-50" onClick={onCancel}>{cancelText}</button>
          <button className="px-3 py-2 text-sm rounded bg-red-600 text-white hover:bg-red-700" onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
};
