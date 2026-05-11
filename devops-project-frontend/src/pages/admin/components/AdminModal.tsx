import React from 'react';

export const AdminModal = ({ isOpen, onClose, title, children }: any) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-[28px] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
          <h2 className="font-headline text-lg font-bold tracking-tight text-neutral-900">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-2xl leading-none text-gray-500 transition-colors hover:text-black"
            aria-label="Đóng hộp thoại"
            title="Đóng"
          >
            &times;
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};
