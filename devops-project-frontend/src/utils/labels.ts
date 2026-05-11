import {
  AdminTableDisplayStatus,
  BookingStatus,
  MembershipTier,
  PaymentMethod,
  PaymentStatus,
  Role,
  TableStatus,
  TableType,
} from '../types';

export const getRoleLabel = (role?: Role | string | null) => {
  switch (role) {
    case 'Admin':
      return 'Quản trị viên';
    case 'Staff':
      return 'Nhân viên';
    case 'Customer':
      return 'Khách hàng';
    default:
      return role || 'Người dùng';
  }
};

export const getMembershipTierLabel = (tier?: MembershipTier | string | null) => {
  switch (tier) {
    case 'Free':
      return 'Miễn phí';
    case 'Silver':
      return 'Bạc';
    case 'Gold':
      return 'Vàng';
    default:
      return tier || 'Thành viên';
  }
};

export const getTableTypeLabel = (type?: TableType | string | null) => {
  switch (type) {
    case 'Pool':
      return 'Pool';
    case 'Snooker':
      return 'Snooker';
    case 'Carom':
      return 'Carom';
    default:
      return type || 'Bàn';
  }
};

export const getTableStatusLabel = (
  status?: TableStatus | AdminTableDisplayStatus | string | null,
) => {
  switch (status) {
    case 'Available':
      return 'Sẵn sàng';
    case 'Reserved':
      return 'Sắp tới';
    case 'InUse':
      return 'Đang sử dụng';
    case 'Maintenance':
      return 'Bảo trì';
    case 'Inactive':
      return 'Tạm khóa';
    default:
      return status || 'Không xác định';
  }
};

export const getBookingStatusLabel = (status?: BookingStatus | string | null) => {
  switch (status) {
    case 'Pending':
      return 'Chờ xác nhận';
    case 'Confirmed':
      return 'Đã xác nhận';
    case 'InProgress':
      return 'Đang sử dụng';
    case 'Completed':
      return 'Hoàn tất';
    case 'Cancelled':
      return 'Đã hủy';
    case 'NoShow':
      return 'Không đến';
    default:
      return status || 'Không xác định';
  }
};

export const getPaymentStatusLabel = (status?: PaymentStatus | string | null) => {
  switch (status) {
    case 'Pending':
      return 'Chờ thanh toán';
    case 'Completed':
      return 'Đã thanh toán';
    case 'Failed':
      return 'Thất bại';
    case 'Refunded':
      return 'Đã hoàn tiền';
    default:
      return status || 'Chưa có';
  }
};

export const getPaymentMethodLabel = (method?: PaymentMethod | string | null) => {
  switch (method) {
    case 'Cash':
      return 'Tiền mặt';
    case 'PayPal':
      return 'PayPal';
    default:
      return method || 'Chưa có';
  }
};

export const getBookingChannelLabel = (bookingType?: string | null) => {
  switch (bookingType) {
    case 'WalkIn':
      return 'Vãng lai';
    case 'Online':
      return 'Trực tuyến';
    default:
      return bookingType || 'Trực tuyến';
  }
};

export const getCoachSpecialtyLabel = (specialty?: string | null) => {
  switch (specialty) {
    case 'Pool':
      return 'Bida lỗ';
    case 'Snooker':
      return 'Snooker';
    case 'Carom':
      return 'Carom';
    case 'AllRound':
      return 'Toàn diện';
    default:
      return specialty || 'Huấn luyện tổng hợp';
  }
};

export const getFnBCategoryLabel = (category?: string | null) => {
  switch (category) {
    case 'Drinks':
      return 'Đồ uống';
    case 'Snacks':
      return 'Ăn nhẹ';
    case 'Combos':
      return 'Combo';
    case 'MainCourse':
      return 'Món chính';
    default:
      return category || 'Thực đơn';
  }
};

export const getDayOfWeekLabel = (
  dayOfWeek?: number | string | null,
  options?: { allDaysLabel?: string },
) => {
  const allDaysLabel = options?.allDaysLabel ?? 'Tất cả các ngày';

  switch (String(dayOfWeek)) {
    case '':
    case 'null':
    case 'undefined':
      return allDaysLabel;
    case '0':
      return 'Chủ nhật';
    case '1':
      return 'Thứ hai';
    case '2':
      return 'Thứ ba';
    case '3':
      return 'Thứ tư';
    case '4':
      return 'Thứ năm';
    case '5':
      return 'Thứ sáu';
    case '6':
      return 'Thứ bảy';
    default:
      return allDaysLabel;
  }
};
