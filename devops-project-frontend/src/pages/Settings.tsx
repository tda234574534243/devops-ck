import React, { useEffect, useState } from 'react';
import CustomerLayout from '../components/layout/CustomerLayout';
import { userService } from '../services/userService';
import { useAuthStore } from '../stores/authStore';
import { ScreenProps, UpdateProfileRequest } from '../types';

const getErrorMessage = (error: unknown, fallbackMessage: string) => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as { response?: { data?: { message?: string } } }).response?.data?.message ===
      'string'
  ) {
    return (
      error as { response?: { data?: { message?: string } } }
    ).response?.data?.message ?? fallbackMessage;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
};

export default function Settings({ onNavigate }: ScreenProps) {
  const authUser = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);

  const [fullName, setFullName] = useState(authUser?.fullName ?? '');
  const [email, setEmail] = useState(authUser?.email ?? '');
  const [phoneNumber, setPhoneNumber] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let isActive = true;

    const loadProfile = async () => {
      setIsLoading(true);
      setError('');

      const data = await userService.getProfile();

      if (!isActive) {
        return;
      }

      if (!data) {
        setError(
          'Không thể tải hồ sơ lúc này. Bạn vẫn có thể chỉnh sửa thông tin đang hiển thị.',
        );
        setIsLoading(false);
        return;
      }

      setFullName(data.fullName ?? '');
      setEmail(data.email ?? authUser?.email ?? '');
      setPhoneNumber(data.phoneNumber ?? '');

      updateUser({
        fullName: data.fullName ?? authUser?.fullName ?? '',
      });
      setIsLoading(false);
    };

    void loadProfile();

    return () => {
      isActive = false;
    };
  }, [authUser?.email, authUser?.fullName, updateUser]);

  const handleFieldChange =
    (setter: (value: string) => void) => (event: React.ChangeEvent<HTMLInputElement>) => {
      if (error) setError('');
      if (success) setSuccess('');
      setter(event.target.value);
    };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSaving) return;

    const trimmedFullName = fullName.trim();

    if (!trimmedFullName) {
      setSuccess('');
      setError('Họ và tên không được để trống.');
      return;
    }

    const payload: UpdateProfileRequest = {
      fullName: trimmedFullName,
      phoneNumber: phoneNumber.trim() || null,
      avatarUrl: null,
    };

    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await userService.updateProfile(payload);
      setFullName(trimmedFullName);
      setPhoneNumber(payload.phoneNumber ?? '');
      setSuccess(response.message || 'Cập nhật thông tin thành công.');
      updateUser({
        fullName: trimmedFullName,
      });
    } catch (saveError) {
      setError(getErrorMessage(saveError, 'Không thể lưu thông tin. Vui lòng thử lại sau.'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <CustomerLayout onNavigate={onNavigate} activeScreen="settings">
      <div className="px-6 pb-20 md:px-8">
        <div className="mx-auto mt-8 max-w-3xl space-y-8">
          <header className="space-y-3 text-center md:text-left">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
              Tài khoản cá nhân
            </p>
            <h1 className="font-headline text-4xl font-black tracking-tight text-on-background">
              Cài đặt tài khoản
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-secondary">
              Cập nhật thông tin nhận diện và liên hệ để các lượt đặt bàn, hóa đơn và thông báo
              trong hệ thống luôn đồng bộ chính xác.
            </p>
          </header>

          <section className="rounded-[28px] border border-outline-variant/30 bg-surface-container-low p-6 shadow-sm md:p-8">
            <div className="mb-8 border-b border-outline-variant/30 pb-5">
              <h2 className="font-headline text-2xl font-bold tracking-tight">
                Hồ sơ cá nhân
              </h2>
              <p className="mt-2 text-sm leading-7 text-secondary">
                Cập nhật họ tên và số điện thoại để đội ngũ vận hành có thể xác nhận lịch nhanh
                hơn khi cần hỗ trợ.
              </p>
            </div>

            {error && (
              <div className="mb-6 rounded-2xl border border-error/20 bg-error/5 px-4 py-3 text-sm leading-6 text-error">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-700">
                {success}
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSave}>
              <div className="space-y-2">
                <label
                  className="text-xs font-bold uppercase tracking-[0.18em] text-secondary"
                  htmlFor="settings-full-name"
                >
                  Họ và tên <span className="text-error">*</span>
                </label>
                <input
                  id="settings-full-name"
                  type="text"
                  value={fullName}
                  onChange={handleFieldChange(setFullName)}
                  disabled={isSaving || isLoading}
                  className="w-full rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-4 text-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Nhập họ và tên"
                />
              </div>

              <div className="space-y-2">
                <label
                  className="text-xs font-bold uppercase tracking-[0.18em] text-secondary"
                  htmlFor="settings-phone"
                >
                  Số điện thoại
                </label>
                <input
                  id="settings-phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={handleFieldChange(setPhoneNumber)}
                  disabled={isSaving || isLoading}
                  className="w-full rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-4 text-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Nhập số điện thoại"
                />
              </div>

              <div className="space-y-2">
                <label
                  className="text-xs font-bold uppercase tracking-[0.18em] text-secondary"
                  htmlFor="settings-email"
                >
                  Địa chỉ email
                </label>
                <div className="relative">
                  <input
                    id="settings-email"
                    type="email"
                    value={email}
                    readOnly
                    className="w-full cursor-not-allowed rounded-2xl border border-outline-variant/30 bg-surface-container-high p-4 pr-24 text-sm text-secondary opacity-80 focus:outline-none"
                    placeholder="Đang tải email..."
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <span className="rounded-full bg-outline-variant/20 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-secondary">
                      Chỉ đọc
                    </span>
                  </div>
                </div>
                <p className="ml-1 text-xs leading-6 text-secondary">
                  Email được dùng để đăng nhập và hiện chưa thể thay đổi trực tiếp tại đây.
                </p>
              </div>

              <div className="mt-8 flex flex-col gap-4 border-t border-outline-variant/30 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-secondary">
                  {isLoading ? 'Đang tải thông tin tài khoản...' : ' '}
                </div>
                <button
                  type="submit"
                  disabled={isSaving || isLoading}
                  className="inline-flex w-full items-center justify-center rounded-full bg-primary px-8 py-3.5 text-sm font-bold uppercase tracking-[0.16em] text-on-primary transition-colors hover:bg-primary/90 focus:outline-none focus:ring-4 focus:ring-primary/20 sm:w-auto disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </CustomerLayout>
  );
}
