import type { User, Store, Stamp, CouponRule, Coupon } from '../types';

export const INITIAL_USER: User = {
  id: 'user-001',
  name: '多摩 散歩',
  area: '国立・立川エリア',
  joinedAt: '2026-10-01',
};

export const MOCK_STORES: Store[] = [
  {
    id: 'store-ramen',
    name: '麺処 たま川',
    category: 'ラーメン',
    area: '立川',
    address: '東京都立川市柴崎町2-4-12',
    description: '多摩川の伏流水と地元野菜からとった澄んだ醤油スープが自慢の一杯。散歩の途中にほっと温まる地域密着のラーメン店です。',
    recommendedMenu: '特製多摩醤油そば（980円）',
    hours: '11:30〜15:00 / 17:30〜21:00',
    closedDays: '水曜日',
    imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80',
    qrCodeValue: 'TAMA_STORE_RAMEN_01',
    isRecommended: true,
  },
  {
    id: 'store-cafe',
    name: 'こもれび珈琲 国立店',
    category: 'カフェ',
    area: '国立',
    address: '東京都国立市中1-9-8',
    description: '大学通りの並木道を眺めながら自家焙煎のハンドドリップコーヒーが楽しめる古民家風カフェ。食後のひと休みにぴったりです。',
    recommendedMenu: '季節のブレンド＆手作りチーズケーキ（850円）',
    hours: '10:00〜19:00',
    closedDays: '火曜日',
    imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80',
    qrCodeValue: 'TAMA_STORE_CAFE_02',
    isRecommended: true,
  },
  {
    id: 'store-bakery',
    name: '森のパン工房 むさしの',
    category: 'ベーカリー',
    area: '武蔵小金井',
    address: '東京都小金井市本町5-11-3',
    description: '国産小麦と天然酵母で毎朝焼き上げるハード系パンと季節のデニッシュ。公園ピクニックのお供に人気です。',
    recommendedMenu: '多摩産ブルーベリーのデニッシュ（360円）',
    hours: '08:00〜18:00',
    closedDays: '月曜日・第3火曜日',
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
    qrCodeValue: 'TAMA_STORE_BAKERY_03',
    isNew: true,
  },
  {
    id: 'store-books',
    name: 'ひだまり文庫と雑貨',
    category: '雑貨・書店',
    area: '吉祥寺・三鷹',
    address: '東京都三鷹市井の頭4-2-5',
    description: '井の頭公園近くの小さな独立系書店。暮らしに寄り添うエッセイ本と、多摩地域の作家による器の展示販売を行っています。',
    recommendedMenu: '店主選書の散歩文庫＆オリジナル栞セット（1,200円）',
    hours: '11:00〜20:00',
    closedDays: '木曜日',
    imageUrl: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=800&q=80',
    qrCodeValue: 'TAMA_STORE_BOOKS_04',
    isNew: true,
  },
];

// おすそわけクーポンの連動ルール（管理者が設定する想定のデータ）
export const MOCK_COUPON_RULES: CouponRule[] = [
  {
    id: 'rule-1',
    triggerStoreId: 'store-ramen',
    targetStoreId: 'store-cafe',
    title: 'ドリンク全品 100円引き',
    description: '麺処 たま川でのご来店特典！食後のコーヒータイムにどうぞ。',
    condition: '1ドリンク以上のご注文時に提示（他券併用不可）',
    validDays: 14,
  },
  {
    id: 'rule-2',
    triggerStoreId: 'store-cafe',
    targetStoreId: 'store-bakery',
    title: 'お好きなパン1個 50円引き',
    description: 'こもれび珈琲からの「おすそわけ」。翌朝のパンにぜひお立ち寄りください。',
    condition: '500円以上のお買い上げで利用可能',
    validDays: 14,
  },
  {
    id: 'rule-3',
    triggerStoreId: 'store-bakery',
    targetStoreId: 'store-books',
    title: 'オリジナルしおり1枚プレゼント',
    description: '森のパン工房 むさしのからの贈り物。読書のお供にどうぞ。',
    condition: '書籍または雑貨1点以上のご購入時に提示',
    validDays: 30,
  },
  {
    id: 'rule-4',
    triggerStoreId: 'store-books',
    targetStoreId: 'store-ramen',
    title: '味玉または大盛り無料サービス',
    description: 'ひだまり文庫からの「おすそわけ」。本を探したあとは温かい一杯を。',
    condition: '麺類1杯ご注文につき1回有効',
    validDays: 14,
  },
];

// 初期状態：ラーメン店でスタンプ1個獲得済み・カフェのクーポンを1枚保有
export const INITIAL_STAMPS: Stamp[] = [
  {
    id: 'stamp-init-1',
    userId: 'user-001',
    storeId: 'store-ramen',
    acquiredAt: '2026-11-15 12:40',
  },
];

export const INITIAL_COUPONS: Coupon[] = [
  {
    id: 'coupon-init-1',
    userId: 'user-001',
    ruleId: 'rule-1',
    targetStoreId: 'store-cafe',
    sourceStoreId: 'store-ramen',
    title: 'ドリンク全品 100円引き',
    description: '麺処 たま川でのご来店特典！食後のコーヒータイムにどうぞ。',
    condition: '1ドリンク以上のご注文時に提示（他券併用不可）',
    expiresAt: '2026-12-02',
    isUsed: false,
  },
];