import React from 'react';

export const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message }: any) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm overflow-hidden rounded-[28px] bg-white p-6 text-center shadow-2xl">
        <h2 className="mb-2 font-headline text-lg font-bold tracking-tight text-neutral-900">
          {title}
        </h2>
        <p className="mb-6 text-sm leading-7 text-gray-500">{message}</p>
        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl bg-gray-100 py-2.5 text-sm font-semibold text-neutral-700 transition-colors hover:bg-gray-200"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
};
