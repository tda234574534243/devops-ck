import React, { useEffect, useMemo, useState } from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { adminService } from '../../../services/adminService';
import { AdminAnalytics, AdminDashboardStats } from '../../../types';

type RevenueStructureItem = {
  label: string;
  amount: number;
  val: number;
  color: string;
};

const PERCENT_STEP = 10;

const WIDTH_CLASS_BY_STEP: Record<number, string> = {
  0: 'w-0',
  10: 'w-[10%]',
  20: 'w-[20%]',
  30: 'w-[30%]',
  40: 'w-[40%]',
  50: 'w-1/2',
  60: 'w-[60%]',
  70: 'w-[70%]',
  80: 'w-[80%]',
  90: 'w-[90%]',
  100: 'w-full',
};

const HEIGHT_CLASS_BY_STEP: Record<number, string> = {
  0: 'h-0',
  10: 'h-[10%]',
  20: 'h-[20%]',
  30: 'h-[30%]',
  40: 'h-[40%]',
  50: 'h-1/2',
  60: 'h-[60%]',
  70: 'h-[70%]',
  80: 'h-[80%]',
  90: 'h-[90%]',
  100: 'h-full',
};

const OPACITY_CLASS_BY_STEP: Record<number, string> = {
  10: 'opacity-10',
  20: 'opacity-20',
  30: 'opacity-30',
  40: 'opacity-40',
  50: 'opacity-50',
  60: 'opacity-60',
  70: 'opacity-70',
  80: 'opacity-80',
  90: 'opacity-90',
  100: 'opacity-100',
};

const clampPercent = (value: number, min = 0, max = 100) =>
  Math.max(min, Math.min(max, value));

const toStep = (value: number, step = PERCENT_STEP) =>
  Math.round(clampPercent(value) / step) * step;

const getWidthClass = (value: number) => WIDTH_CLASS_BY_STEP[toStep(value)] || 'w-0';

const getHeightClass = (value: number) => HEIGHT_CLASS_BY_STEP[toStep(value)] || 'h-0';

const getOpacityClass = (value: number) => {
  const stepped = Math.round(clampPercent(value, 10, 100) / PERCENT_STEP) * PERCENT_STEP;
  return OPACITY_CLASS_BY_STEP[stepped] || 'opacity-100';
};

const startOfDayIso = (value: Date) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
};

const endOfDayIso = (value: Date) => {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date.toISOString();
};

const getRangeForFilter = (
  dateFilter: 'today' | 'week' | 'month' | 'custom',
  customRange: { from: string; to: string },
) => {
  const now = new Date();

  if (dateFilter === 'today') {
    return {
      from: startOfDayIso(now),
      to: endOfDayIso(now),
      period: 'day',
    };
  }

  if (dateFilter === 'week') {
    const monday = new Date(now);
    const day = monday.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    monday.setDate(monday.getDate() + diff);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    return {
      from: startOfDayIso(monday),
      to: endOfDayIso(sunday),
      period: 'week',
    };
  }

  if (dateFilter === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return {
      from: startOfDayIso(start),
      to: endOfDayIso(end),
      period: 'month',
    };
  }

  if (!customRange.from || !customRange.to) {
    return null;
  }

  const fromDate = new Date(customRange.from);
  const toDate = new Date(customRange.to);
  const diffInDays = Math.max(
    0,
    Math.floor((toDate.getTime() - fromDate.getTime()) / 86400000),
  );
  const period = diffInDays <= 1 ? 'day' : diffInDays <= 7 ? 'week' : 'month';

  return {
    from: startOfDayIso(fromDate),
    to: endOfDayIso(toDate),
    period,
  };
};

const getErrorMessage = (error: unknown, fallbackMessage: string) => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    (typeof (error as any).response?.data?.message === 'string' ||
      typeof (error as any).response?.data?.Message === 'string')
  ) {
    return (
      (error as any).response?.data?.message ||
      (error as any).response?.data?.Message ||
      fallbackMessage
    );
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
};

export const RevenueView = () => {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'custom'>(
    'month',
  );
  const [basis, setBasis] = useState<'service' | 'payment'>('service');
  const [customRange, setCustomRange] = useState({ from: '', to: '' });

  useEffect(() => {
    const range = getRangeForFilter(dateFilter, customRange);
    if (!range) {
      return;
    }

    setIsLoading(true);

    Promise.all([
      adminService.getStats({ from: range.from, to: range.to }),
      adminService.getAnalytics({
        from: range.from,
        to: range.to,
        period: range.period,
        basis,
      }),
    ])
      .then(([statsData, analyticsData]) => {
        setStats(statsData);
        setAnalytics(analyticsData);
        setError('');
      })
      .catch((loadError) => {
        setError(getErrorMessage(loadError, 'Không thể tải báo cáo doanh thu lúc này.'));
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [basis, customRange, dateFilter]);

  const heatmapMatrix = useMemo(() => {
    if (!analytics?.occupancyHeatmap) return [];
    const matrix = Array.from({ length: 7 }, () => Array(24).fill(0));
    analytics.occupancyHeatmap.forEach((cell) => {
      matrix[cell.dayOfWeek][cell.hour] = cell.occupancyRate;
    });
    return matrix;
  }, [analytics]);

  const occupancyTrend = useMemo(() => {
    if (!analytics?.occupancyHeatmap) return [0, 0, 0, 0];

    let morning = 0;
    let afternoon = 0;
    let evening = 0;
    let night = 0;
    let morningCount = 0;
    let afternoonCount = 0;
    let eveningCount = 0;
    let nightCount = 0;

    analytics.occupancyHeatmap.forEach((cell) => {
      if (cell.hour >= 8 && cell.hour < 12) {
        morning += cell.occupancyRate;
        morningCount += 1;
      } else if (cell.hour >= 12 && cell.hour < 18) {
        afternoon += cell.occupancyRate;
        afternoonCount += 1;
      } else if (cell.hour >= 18 && cell.hour < 23) {
        evening += cell.occupancyRate;
        eveningCount += 1;
      } else {
        night += cell.occupancyRate;
        nightCount += 1;
      }
    });

    return [
      morningCount ? Math.round(morning / morningCount) : 0,
      afternoonCount ? Math.round(afternoon / afternoonCount) : 0,
      eveningCount ? Math.round(evening / eveningCount) : 0,
      nightCount ? Math.round(night / nightCount) : 0,
    ];
  }, [analytics]);

  const revenueStructure = useMemo<RevenueStructureItem[]>(() => {
    const fallback: RevenueStructureItem[] = [
      { label: 'Tiền giờ chơi', amount: 0, val: 0, color: 'bg-primary' },
      { label: 'Dịch vụ F&B', amount: 0, val: 0, color: 'bg-tertiary' },
      { label: 'Huấn luyện viên', amount: 0, val: 0, color: 'bg-neutral-800' },
    ];

    if (!analytics?.revenueBySource?.length) {
      return fallback;
    }

    const colorByLabel: Record<string, string> = {
      'Tiền giờ chơi': 'bg-primary',
      'Dịch vụ F&B': 'bg-tertiary',
      'Huấn luyện viên': 'bg-neutral-800',
    };

    return analytics.revenueBySource.map((item, index) => ({
      label: item.label,
      amount: Number(item.amount || 0),
      val: Number(item.percentage || 0),
      color: colorByLabel[item.label] || fallback[index % fallback.length].color,
    }));
  }, [analytics]);

  if (isLoading && !stats && !analytics) {
    return <div className="p-8 text-white">Đang tải...</div>;
  }

  if (!stats || !analytics) {
    return (
      <div className="space-y-4 p-8">
        {error && (
          <div className="rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}
      </div>
    );
  }

  const maxRevenue = Math.max(
    ...(analytics.revenueByPeriod?.map((point) => point.revenue) || [1]),
  );
  const totalRevenuePeriod =
    analytics.revenueByPeriod?.reduce((sum, point) => sum + point.revenue, 0) || 0;
  const targetPercent = Math.min(
    100,
    Math.round((totalRevenuePeriod / 1000000000) * 100),
  );

  return (
    <div className="animate-in fade-in space-y-6 p-8 duration-500">
      {error && (
        <div className="rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between rounded-xl border border-neutral-100 bg-surface-lowest p-4 shadow-sm">
        <h2 className="font-headline text-xl font-bold">Báo cáo doanh thu</h2>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-neutral-200 bg-surface-low p-1">
            {[
              { id: 'today', label: 'Hôm nay' },
              { id: 'week', label: 'Tuần này' },
              { id: 'month', label: 'Tháng này' },
              { id: 'custom', label: 'Tùy chỉnh' },
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setDateFilter(filter.id as typeof dateFilter)}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                  dateFilter === filter.id
                    ? 'bg-primary text-white shadow'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <select
            id="revenueBasis"
            value={basis}
            onChange={(event) => setBasis(event.target.value as 'service' | 'payment')}
            className="rounded-lg border border-neutral-200 bg-surface-lowest px-3 py-2 text-sm"
            aria-label="Cơ sở thống kê doanh thu"
          >
            <option value="service">Theo ngày sử dụng</option>
            <option value="payment">Theo ngày thanh toán</option>
          </select>
          {dateFilter === 'custom' && (
            <div className="ml-2 flex items-center gap-2 border-l border-neutral-200 pl-4">
              <label htmlFor="revenueFromDate" className="sr-only">
                Từ ngày
              </label>
              <input
                id="revenueFromDate"
                type="date"
                value={customRange.from}
                onChange={(event) =>
                  setCustomRange({ ...customRange, from: event.target.value })
                }
                className="rounded border border-neutral-200 bg-surface-lowest px-2 py-1 text-sm"
              />
              <span>-</span>
              <label htmlFor="revenueToDate" className="sr-only">
                Đến ngày
              </label>
              <input
                id="revenueToDate"
                type="date"
                value={customRange.to}
                onChange={(event) =>
                  setCustomRange({ ...customRange, to: event.target.value })
                }
                className="rounded border border-neutral-200 bg-surface-lowest px-2 py-1 text-sm"
              />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {[
          {
            label: 'Tổng doanh thu',
            value: `${stats.revenue.toLocaleString()}đ`,
            trend: '+12.5%',
            isUp: true,
          },
          {
            label: 'Bàn trống',
            value: `${stats.availableTables}`,
            trend: '+5.2%',
            isUp: true,
          },
          {
            label: 'Phiên đang hoạt động',
            value: `${stats.activeSessions}`,
            trend: '-2.1%',
            isUp: false,
          },
          {
            label: 'Tổng lượt đặt',
            value: `${stats.totalBookings}`,
            trend: '+8.4%',
            isUp: true,
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-2xl border border-neutral-100 bg-surface-lowest p-6 shadow-sm"
          >
            <p className="mb-2 text-sm font-medium text-neutral-500">{kpi.label}</p>
            <div className="flex items-end justify-between">
              <h3 className="font-headline text-3xl font-bold text-neutral-900">
                {kpi.value}
              </h3>
              <div
                className={`flex items-center text-sm font-medium ${
                  kpi.isUp ? 'text-tertiary' : 'text-primary'
                }`}
              >
                {kpi.isUp ? (
                  <TrendingUp size={16} className="mr-1" />
                ) : (
                  <TrendingDown size={16} className="mr-1" />
                )}
                {kpi.trend}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="rounded-2xl border border-neutral-100 bg-surface-lowest p-6 shadow-sm">
          <h3 className="mb-6 font-headline text-lg font-bold">Cơ cấu doanh thu</h3>
          <div className="space-y-5">
            {revenueStructure.map((item) => (
              <div key={item.label}>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="font-medium text-neutral-700">{item.label}</span>
                  <span className="font-bold">{item.val.toFixed(2)}%</span>
                </div>
                <p className="mb-2 text-xs text-neutral-500">
                  {item.amount.toLocaleString()}đ
                </p>
                <div className="h-2 overflow-hidden rounded-full bg-surface-low">
                  <div
                    className={`h-full ${item.color} ${getWidthClass(item.val)}`}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-2 rounded-2xl border border-neutral-100 bg-surface-lowest p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="font-headline text-lg font-bold">Biểu đồ doanh thu</h3>
            <span className="text-xs uppercase tracking-widest text-neutral-400">
              {analytics.period} / {analytics.basis}
            </span>
          </div>
          <div className="mt-4 flex h-48 items-end justify-between gap-2">
            {analytics.revenueByPeriod?.map((point) => {
              const heightPercent = maxRevenue > 0 ? (point.revenue / maxRevenue) * 100 : 0;
              return (
                <div key={point.label} className="group flex h-full flex-1 flex-col items-center">
                  <div className="relative flex h-full w-full items-end rounded-t-md bg-surface-low">
                    <div
                      className={`w-full rounded-t-md bg-primary transition-all duration-300 group-hover:opacity-80 ${getHeightClass(heightPercent)}`}
                    ></div>
                    <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-neutral-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                      {point.revenue.toLocaleString()}đ
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex justify-between px-1 text-xs text-neutral-400">
            {analytics.revenueByPeriod?.map((point) => (
              <span key={point.label} className="flex-1 truncate px-1 text-center">
                {point.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <div className="col-span-2 rounded-2xl border border-neutral-100 bg-surface-lowest p-6 shadow-sm">
          <h3 className="mb-4 font-headline text-lg font-bold">Bản đồ nhiệt giờ cao điểm</h3>
          <div className="grid grid-cols-8 gap-1">
            <div className="col-span-1 grid grid-rows-7 gap-1 pt-6 pr-2 text-right text-xs font-medium text-neutral-400">
              <div>CN</div>
              <div>T2</div>
              <div>T3</div>
              <div>T4</div>
              <div>T5</div>
              <div>T6</div>
              <div>T7</div>
            </div>
            <div className="col-span-7">
              <div className="mb-2 grid grid-cols-6 gap-1 text-xs font-medium text-neutral-400">
                <div>00:00</div>
                <div>04:00</div>
                <div>08:00</div>
                <div>12:00</div>
                <div>16:00</div>
                <div>20:00</div>
              </div>
              <div className="grid grid-rows-7 gap-1">
                {heatmapMatrix.map((row, rowIndex) => (
                  <div key={rowIndex} className="grid h-4 grid-cols-24 gap-1">
                    {row.map((rate, columnIndex) => {
                      return (
                        <div
                          key={columnIndex}
                          className={`rounded-sm bg-primary ${getOpacityClass(Number(rate))}`}
                          title={`${rate}%`}
                        ></div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-100 bg-surface-lowest p-6 shadow-sm">
          <h3 className="mb-6 font-headline text-lg font-bold">Xu hướng lấp đầy</h3>
          <div className="space-y-4">
            {[
              'Sáng (08:00 - 12:00)',
              'Chiều (12:00 - 18:00)',
              'Tối (18:00 - 23:00)',
              'Đêm (23:00 - 08:00)',
            ].map((label, index) => {
              const value = occupancyTrend[index];
              return (
                <div key={label}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-neutral-500">{label}</span>
                    <span className="font-bold">{value}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-surface-low">
                    <div className={`h-full bg-neutral-800 ${getWidthClass(value)}`}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl bg-primary p-6 text-white shadow-md">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl"></div>
          <div>
            <h3 className="relative z-10 mb-2 font-headline text-lg font-bold">
              Mục tiêu doanh thu
            </h3>
            <p className="relative z-10 mb-6 text-sm text-primary-container-foreground/80">
              Đạt {targetPercent}% mục tiêu kỳ này
            </p>
          </div>
          <div>
            <div className="relative z-10 mb-2 text-3xl font-bold">
              {(totalRevenuePeriod / 1000000).toFixed(0)}M
              <span className="pl-2 text-lg font-normal opacity-80">/ 1B</span>
            </div>
            <div className="relative z-10 h-2 overflow-hidden rounded-full bg-black/20">
              <div className={`h-full bg-white ${getWidthClass(targetPercent)}`}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
