export interface User {
  id: string;
  name: string;
  area: string;
  joinedAt: string;
}

export interface Store {
  id: string;
  name: string;
  category: 'カフェ' | 'ラーメン' | 'ベーカリー' | '雑貨・書店';
  area: string;
  address: string;
  description: string;
  recommendedMenu: string;
  hours: string;
  closedDays: string;
  imageUrl: string;
  qrCodeValue: string;
  isRecommended?: boolean;
  isNew?: boolean;
}

export interface Stamp {
  id: string;
  userId: string;
  storeId: string;
  acquiredAt: string;
}

export interface CouponRule {
  id: string;
  triggerStoreId: string; // スタンプを獲得するお店
  targetStoreId: string;  // クーポンが使えるお店
  title: string;
  description: string;
  condition: string;
  validDays: number;
}

export interface Coupon {
  id: string;
  userId: string;
  ruleId: string;
  targetStoreId: string;
  sourceStoreId: string;
  title: string;
  description: string;
  condition: string;
  expiresAt: string;
  isUsed: boolean;
  usedAt?: string;
}

export interface CouponUse {
  id: string;
  couponId: string;
  userId: string;
  storeId: string;
  usedAt: string;
}