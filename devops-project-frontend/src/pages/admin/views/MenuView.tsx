import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { adminService } from '../../../services/adminService';
import { AdminModal } from '../components/AdminModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { getFnBCategoryLabel } from '../../../utils/labels';

export const MenuView = () => {
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('All');
  const tabs = [
    { label: 'Tất cả', value: 'All' },
    { label: 'Đồ uống', value: 'Drinks' },
    { label: 'Ăn nhẹ', value: 'Snacks' },
    { label: 'Combo', value: 'Combos' },
    { label: 'Món chính', value: 'MainCourse' },
  ];

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    category: 'Drinks',
    imageUrl: '',
    isAvailable: true,
  });

  const loadData = async () => {
    try {
      const data = await adminService.getFnBItems();
      setMenuItems(data.items || data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const filteredItems = menuItems.filter(
    (item) => activeTab === 'All' || item.category === activeTab,
  );
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedData = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const openCreate = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      price: 0,
      category: 'Drinks',
      imageUrl: '',
      isAvailable: true,
    });
    setIsModalOpen(true);
  };

  const openEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      price: item.price,
      category: item.category || 'Drinks',
      imageUrl: item.imageUrl || '',
      isAvailable: item.isAvailable,
    });
    setIsModalOpen(true);
  };

  const toggleAvailability = async (item: any) => {
    try {
      await adminService.updateFnBItem(item.id, {
        name: item.name,
        category: item.category,
        price: item.price,
        imageUrl: item.imageUrl,
        isAvailable: !item.isAvailable,
      });
      await loadData();
    } catch (error) {
      console.error(error);
      alert('Không thể cập nhật trạng thái mở bán.');
    }
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      if (editingItem) {
        await adminService.updateFnBItem(editingItem.id, formData);
      } else {
        await adminService.createFnBItem(formData);
      }
      setIsModalOpen(false);
      await loadData();
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || error.message || 'Không thể lưu món F&B.');
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await adminService.deleteFnBItem(deletingId);
      setIsDeleteOpen(false);
      setDeletingId(null);
      await loadData();
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || error.message || 'Không thể xóa món F&B.');
    }
  };

  return (
    <div className="animate-in fade-in space-y-6 p-8 duration-500">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setActiveTab(tab.value);
                setCurrentPage(1);
              }}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.value
                  ? 'bg-neutral-900 text-white'
                  : 'border border-neutral-200 bg-surface-lowest text-neutral-600 hover:bg-surface-low'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
        >
          <Plus size={16} /> Thêm món mới
        </button>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {paginatedData.map((item: any) => (
          <div
            key={item.id}
            className={`group overflow-hidden rounded-2xl border bg-surface-lowest shadow-sm ${
              !item.isAvailable ? 'border-neutral-200 opacity-60' : 'border-neutral-100'
            }`}
          >
            <div className="relative h-48 overflow-hidden">
              <img
                src={
                  item.imageUrl ||
                  'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=500&q=80'
                }
                alt={item.name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {!item.isAvailable && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-neutral-900">
                    Ngừng bán
                  </span>
                </div>
              )}
            </div>
            <div className="p-5">
              <div className="mb-2 flex items-start justify-between gap-2">
                <h3 className="flex-1 line-clamp-1 font-headline text-lg font-bold text-neutral-900">
                  {item.name}
                </h3>

                <button
                  onClick={() => toggleAvailability(item)}
                  title={
                    item.isAvailable
                      ? 'Đang mở bán - nhấn để tạm ngưng'
                      : 'Đã tạm ngưng - nhấn để mở bán lại'
                  }
                  className={`relative h-5 w-10 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors ${
                    item.isAvailable ? 'bg-tertiary' : 'bg-neutral-300'
                  }`}
                >
                  <div
                    className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                      item.isAvailable ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  ></div>
                </button>
              </div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                {getFnBCategoryLabel(item.category)}
              </p>
              <p className="mb-4 h-10 line-clamp-2 text-sm text-neutral-500">
                {item.description || 'Món đang chờ bổ sung mô tả ngắn.'}
              </p>
              <div className="flex items-center justify-between border-t border-neutral-100 pt-4">
                <span className="text-lg font-bold text-primary">
                  {`${item.price?.toLocaleString() ?? 0}đ`}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(item)}
                    className="p-2 text-neutral-400 transition-colors hover:text-primary"
                    title="Sửa món"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => {
                      setDeletingId(item.id);
                      setIsDeleteOpen(true);
                    }}
                    className="p-2 text-neutral-400 transition-colors hover:text-red-500"
                    title="Xóa món"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <div className="flex gap-1">
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentPage(index + 1)}
                className={`flex h-8 w-8 items-center justify-center rounded-md text-sm ${
                  currentPage === index + 1
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-500 hover:bg-surface-low'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      )}

      <AdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Chỉnh sửa món' : 'Thêm món mới'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label htmlFor="menuItemName" className="mb-1 block text-sm font-medium text-neutral-700">
              Tên món
            </label>
            <input
              id="menuItemName"
              required
              type="text"
              className="w-full rounded-xl border border-neutral-200 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={formData.name}
              onChange={(event) =>
                setFormData((current) => ({ ...current, name: event.target.value }))
              }
            />
          </div>
          <div>
            <label htmlFor="menuItemCategory" className="mb-1 block text-sm font-medium text-neutral-700">
              Danh mục
            </label>
            <select
              id="menuItemCategory"
              className="w-full rounded-xl border border-neutral-200 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={formData.category}
              onChange={(event) =>
                setFormData((current) => ({ ...current, category: event.target.value }))
              }
            >
              <option value="Drinks">Đồ uống</option>
              <option value="Snacks">Ăn nhẹ</option>
              <option value="Combos">Combo</option>
              <option value="MainCourse">Món chính</option>
            </select>
          </div>
          <div>
            <label htmlFor="menuItemPrice" className="mb-1 block text-sm font-medium text-neutral-700">
              Giá bán
            </label>
            <input
              id="menuItemPrice"
              required
              type="number"
              min="0"
              className="w-full rounded-xl border border-neutral-200 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={formData.price}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  price: Number(event.target.value),
                }))
              }
            />
          </div>
          <div>
            <label htmlFor="menuItemImageUrl" className="mb-1 block text-sm font-medium text-neutral-700">
              Link ảnh (tùy chọn)
            </label>
            <input
              id="menuItemImageUrl"
              type="text"
              className="w-full rounded-xl border border-neutral-200 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={formData.imageUrl}
              onChange={(event) =>
                setFormData((current) => ({ ...current, imageUrl: event.target.value }))
              }
            />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <input
              type="checkbox"
              id="isAvailable"
              checked={formData.isAvailable}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  isAvailable: event.target.checked,
                }))
              }
              className="h-4 w-4 rounded text-primary focus:ring-primary"
            />
            <label htmlFor="isAvailable" className="text-sm font-medium text-neutral-700">
              Đang mở bán
            </label>
          </div>
          <div className="mt-6 flex gap-4 border-t border-neutral-100 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 rounded-xl bg-neutral-100 py-2.5 text-sm font-medium text-neutral-700"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-medium text-white"
            >
              Lưu thay đổi
            </button>
          </div>
        </form>
      </AdminModal>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        title="Xóa món này?"
        message="Thao tác này sẽ gỡ món khỏi thực đơn. Nếu món đã phát sinh lịch sử bán hàng, hệ thống sẽ tự xử lý theo quy định hiện tại."
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
};
