export interface AnalyticsSummary {
  clicks: number;
  orders: number;
  conversionRate: number;
  totalSales: number;
  totalCommission: number;
  pendingCommission: number;
  availableCommission: number;
}

export interface TopProduct {
  productId: string;
  productName: string;
  productImage?: string;
  ordersCount: number;
  unitsSold: number;
  revenueGenerated: number;
  commissionEarned: number;
}

export interface TopCampaign {
  campaignId: string;
  title: string;
  boostedRate: number;
  ordersCount: number;
  commissionEarned: number;
}

export interface AnalyticsTrendPoint {
  date: string;
  clicks: number;
  orders: number;
  sales: number;
  commission: number;
}

export interface CreatorAnalyticsResponse {
  summary: AnalyticsSummary;
  topProducts: TopProduct[];
  topCampaigns: TopCampaign[];
  trend: AnalyticsTrendPoint[];
}
