export type Screen =
  | 'register'
  | 'login'
  | 'dashboard'
  | 'admin'
  | 'membershipTiers'
  | 'bookingHistory'
  | 'floorPlan'
  | 'coaches'
  | 'settings';

export interface ScreenProps {
  onNavigate: (screen: Screen) => void;
}

export type Role = 'Customer' | 'Staff' | 'Admin';
export type MembershipTier = 'Free' | 'Silver' | 'Gold';
export type TableType = 'Pool' | 'Snooker' | 'Carom';
export type TableStatus = 'Available' | 'Reserved' | 'InUse' | 'Maintenance';
export type AdminTableDisplayStatus = 'Available' | 'Reserved' | 'InUse' | 'Maintenance' | 'Inactive';
export type BookingStatus = 'Pending' | 'Confirmed' | 'InProgress' | 'Completed' | 'Cancelled' | 'NoShow';
export type PaymentMethod = 'Cash' | 'PayPal';
export type PaymentStatus = 'Pending' | 'Completed' | 'Failed' | 'Refunded';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  membershipTier?: MembershipTier;
  avatarUrl?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string | null;
  avatarUrl?: string | null;
}

export interface UpdateProfileRequest {
  fullName: string;
  phoneNumber?: string | null;
  avatarUrl?: string | null;
}

export interface ApiMessageResponse {
  message: string;
}

export interface BilliardTable {
  id: number;
  tableNumber: string;
  type: TableType;
  hourlyRate: number;
  status: TableStatus;
  positionX?: number;
  positionY?: number;
}

export interface AdminTable {
  id: number;
  tableNumber: string;
  type: TableType;
  hourlyRate: number;
  manualStatus: 'Available' | 'Maintenance';
  displayStatus: AdminTableDisplayStatus;
  isActive: boolean;
  positionX?: number | null;
  positionY?: number | null;
  currentCustomerName?: string | null;
  currentSessionStartedAt?: string | null;
  nextBookingStartTime?: string | null;
  nextBookingId?: string | null;
  nextCustomerName?: string | null;
  currentSessionAmount: number;
  activeSessionId?: string | null;
}

export interface PendingCheckin {
  bookingId: string;
  userFullName?: string | null;
  userEmail?: string | null;
  guestName?: string | null;
  requestedTableType: TableType;
  startTime: string;
  endTime: string;
  depositAmount: number;
  availableTableCount: number;
}

export interface UpcomingWarning {
  bookingId: string;
  tableId?: number | null;
  tableNumber?: string | null;
  currentCustomerName?: string | null;
  endsAt: string;
  category: TableType;
  minutesRemaining: number;
}

export interface FloorPlanSnapshotTable {
  tableId: number;
  tableNumber: string;
  type: TableType;
  realTimeStatus: 'Available' | 'Occupied' | 'Reserved' | 'Maintenance';
  activeSessionId?: string | null;
}

export interface FloorPlanSnapshot {
  date: string;
  generatedAt: string;
  tables: FloorPlanSnapshotTable[];
}

export interface TableAvailabilitySlot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  conflictingBookingId?: string | null;
}

export interface TableAvailabilityResponse {
  tableId: number;
  date: string;
  slots: TableAvailabilitySlot[];
}

export interface Coach {
  id: string;
  userId: string;
  fullName: string;
  specialty: string;
  bio: string;
  hourlyRate: number;
  rating: number;
  avatarUrl: string;
  isActive?: boolean;
}

export interface CoachAvailabilitySlot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface StaffAvailability {
  id: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isBlocked: boolean;
  specificDate?: string | null;
}

export interface UpsertStaffAvailabilityRequest {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isBlocked: boolean;
  specificDate?: string | null;
}

export interface FnBMenuItem {
  id: number;
  name: string;
  description?: string;
  price: number;
  category: string;
  imageUrl?: string | null;
  isAvailable: boolean;
}

export interface FnBOrderItem {
  menuItemId: number;
  quantity: number;
  priceAtTime?: number;
}

export interface FnBOrder {
  id: string;
  totalPrice?: number;
  status: 'Pending' | 'Preparing' | 'Served' | 'Cancelled';
  items?: FnBOrderItem[];
}

export interface MembershipPlan {
  id: number;
  tier: MembershipTier;
  name: string;
  monthlyPrice: number;
  tableDiscountPercent: number;
  priorityBooking: boolean;
  freeCoachingSessionsPerMonth: number;
  maxAdvanceBookingDays: number;
  isActive: boolean;
}

export interface UserMembership {
  id: string;
  userId: string;
  planId: number;
  tier: MembershipTier;
  planName: string;
  monthlyPrice: number;
  tableDiscountPercent: number;
  priorityBooking: boolean;
  freeCoachingSessionsPerMonth: number;
  maxAdvanceBookingDays: number;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  status: string;
  usedFreeCoachingSessions: number;
}

export interface SubscribeMembershipRequest {
  planId: number;
  autoRenew: boolean;
  paymentMethod?: PaymentMethod;
}

export interface SubscribeMembershipResult {
  membership?: UserMembership | null;
  approvalUrl?: string | null;
  payPalOrderId?: string | null;
  requiresRedirect: boolean;
}

export interface AdminMembershipPlan {
  id: number;
  tier: MembershipTier;
  name: string;
  monthlyPrice: number;
  tableDiscountPercent: number;
  priorityBooking: boolean;
  freeCoachingSessionsPerMonth: number;
  maxAdvanceBookingDays: number;
  isActive: boolean;
  activeSubscribers: number;
}

export interface AdminUpsertMembershipPlanRequest {
  tier: MembershipTier;
  name: string;
  monthlyPrice: number;
  tableDiscountPercent: number;
  priorityBooking: boolean;
  freeCoachingSessionsPerMonth: number;
  maxAdvanceBookingDays: number;
  isActive: boolean;
}

export interface Payment {
  id: string;
  amount: number;
  status: PaymentStatus;
  method?: string;
  type?: string;
  transactionId?: string;
  createdAt?: string;
  completedAt?: string | null;
}

export interface CreatePaymentResult {
  payment: Payment;
  approvalUrl?: string | null;
  payPalOrderId?: string | null;
  requiresRedirect: boolean;
}

export interface CoachSummary {
  id: string;
  userId?: string;
  fullName: string;
  specialty?: string;
  hourlyRate?: number;
}

export interface Booking {
  id: string;
  userId: string;
  tableId: number | null;
  tableName: string | null;
  requestedTableType: TableType;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  bookingType?: string;
  totalPrice: number;
  depositAmount?: number;
  depositForfeited?: boolean;
  checkedInAt?: string | null;
  checkedOutAt?: string | null;
  assignedAt?: string | null;
  actualCost?: number | null;
  guestName?: string | null;
  createdAt: string;
  notes?: string | null;
  payment?: Payment | null;
  coach?: CoachSummary | null;
  fnBOrders?: FnBOrder[];
  fnBTotal?: number;
  coachingTotal?: number;
  discountAmount?: number;
}

export interface BookingListResponse {
  items: Booking[];
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AdminBooking {
  id: string;
  userId: string;
  userFullName: string;
  userEmail: string;
  tableId: number | null;
  tableNumber?: string | null;
  requestedTableType: TableType;
  bookingDate: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  discountAmount: number;
  fnBTotal: number;
  coachingTotal: number;
  paymentAmount: number;
  paymentStatus?: string | null;
  status: BookingStatus;
  bookingType?: string;
  depositAmount: number;
  depositForfeited: boolean;
  checkedInAt?: string | null;
  checkedOutAt?: string | null;
  assignedAt?: string | null;
  actualCost?: number | null;
  guestName?: string | null;
  createdAt: string;
  cancelledAt?: string | null;
  coachName?: string | null;
}

export interface AdminBookingListResponse {
  items: AdminBooking[];
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateFnBOrderRequest {
  menuItemId: number;
  quantity: number;
}

export interface CreateBookingRequest {
  requestedTableType: TableType;
  bookingDate: string;
  startTime: string;
  endTime: string;
  fnBOrders?: CreateFnBOrderRequest[];
}

export interface CreateBookingResponse {
  message: string;
  reservationId?: string;
  bookingId?: string;
}

export interface RescheduleBookingRequest {
  newStartTime: string;
  newEndTime: string;
}

export interface CreateCoachingSessionRequest {
  coachId: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
}

export interface CoachingSession {
  id: string;
  coachId: string;
  studentUserId: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  cost: number;
}

export interface CategoryAvailabilitySlot {
  startTime: string;
  endTime: string;
  available: number;
  capacity: number;
}

export interface CategoryAvailability {
  tableType: TableType;
  date: string;
  totalTables: number;
  bufferSize: number;
  onlineCapacity: number;
  slots: CategoryAvailabilitySlot[];
}

export interface AdminDashboardStats {
  revenue: number;
  activeSessions: number;
  totalBookings: number;
  availableTables: number;
  totalTables: number;
  activeCoaches: number;
  menuItems: number;
  activeMemberships: number;
  noShowsToday: number;
  forfeitedDepositsToday: number;
}

export interface RunningTotal {
  tableTimeCost: number;
  fnBTotal: number;
  coachingTotal: number;
  subtotal: number;
  depositApplied: number;
  estimatedBalanceDue: number;
  note: string;
}

export interface CheckoutSummary {
  bookingId: string;
  tableNumber: string;
  customerName?: string | null;
  bookingType?: string;
  checkedInAt?: string | null;
  checkedOutAt: string;
  actualDurationHours: number;
  tableCost: number;
  fnBCost: number;
  coachingCost: number;
  discountAmount: number;
  depositAmount: number;
  totalCost: number;
  amountDue: number;
}

export interface LinkableCoachSession {
  id: string;
  coachId: string;
  coachName: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  cost: number;
}

export interface AdminRevenuePoint {
  label: string;
  revenue: number;
  bookingCount: number;
}

export interface AdminRevenueSource {
  label: string;
  amount: number;
  percentage: number;
}

export interface AdminHeatmapCell {
  dayOfWeek: number;
  hour: number;
  bookingCount: number;
  occupancyRate: number;
}

export interface AdminPeakHour {
  hour: number;
  bookingCount: number;
  occupancyRate: number;
}

export interface AdminAnalytics {
  period: string;
  basis: 'service' | 'payment';
  revenueByPeriod: AdminRevenuePoint[];
  revenueBySource: AdminRevenueSource[];
  occupancyHeatmap: AdminHeatmapCell[];
  peakHours: AdminPeakHour[];
  averageOccupancyRate: number;
  peakOccupancyRate: number;
}

export interface CreateTableRequest {
  tableNumber: string;
  type: TableType;
  hourlyRate: number;
  status: 'Available' | 'Maintenance';
  isActive?: boolean;
  positionX?: number | null;
  positionY?: number | null;
}

export interface UpdateTableRequest {
  tableNumber?: string;
  type?: TableType;
  hourlyRate?: number;
  status?: 'Available' | 'Maintenance';
  isActive?: boolean;
  positionX?: number | null;
  positionY?: number | null;
}

export interface BufferConfig {
  id: number;
  tableType: TableType;
  dayOfWeek?: number | null;
  timeFrom?: string | null;
  timeTo?: string | null;
  bufferCount: number;
  isActive: boolean;
}

export interface UpsertBufferConfigRequest {
  tableType: TableType;
  dayOfWeek?: number | null;
  timeFrom?: string | null;
  timeTo?: string | null;
  bufferCount: number;
  isActive: boolean;
}
