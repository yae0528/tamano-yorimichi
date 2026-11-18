import { useState, useRef, useEffect } from 'react';
import {
  MapPin,
  Clock,
  CalendarOff,
  QrCode,
  Ticket,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  ArrowLeft,
  Camera,
  AlertCircle,
  Gift,
  Utensils,
} from 'lucide-react';
import {
  INITIAL_USER,
  MOCK_STORES,
  MOCK_COUPON_RULES,
  INITIAL_STAMPS,
  INITIAL_COUPONS,
} from './data/mockData';
import type { Store, Stamp, Coupon, CouponUse } from './types';
import { BottomNav } from './components/BottomNav';
import type { TabType } from './components/BottomNav';

export function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('すべて');

  // 将来Supabaseのテーブルに置き換わる状態管理
  const [user] = useState(INITIAL_USER);
  const [stores] = useState<Store[]>(MOCK_STORES);
  const [stamps, setStamps] = useState<Stamp[]>(INITIAL_STAMPS);
  const [coupons, setCoupons] = useState<Coupon[]>(INITIAL_COUPONS);
  const [couponUses, setCouponUses] = useState<CouponUse[]>([]);

  // QRカメラ＆獲得モーダル用ステート
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanResultModal, setScanResultModal] = useState<{
    type: 'success' | 'duplicate';
    store: Store;
    issuedCoupon?: Coupon;
  } | null>(null);

  // クーポン利用確認モーダル
  const [confirmCoupon, setConfirmCoupon] = useState<Coupon | null>(null);

  const unusedCoupons = coupons.filter((c) => !c.isUsed);
  const usedCoupons = coupons.filter((c) => c.isUsed);

  // QRタブ選択時のカメラ起動処理
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (activeTab === 'qr') {
      setCameraError(null);
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({ video: { facingMode: 'environment' } })
          .then((mediaStream) => {
            stream = mediaStream;
            if (videoRef.current) {
              videoRef.current.srcObject = mediaStream;
            }
          })
          .catch(() => {
            setCameraError(
              'カメラの起動が許可されていないか、PC環境のためカメラを利用できません。下の「店舗QRデモ読み取り」から動作をお試しください。'
            );
          });
      } else {
        setCameraError('お使いのブラウザはカメラ機能に対応していません。下のデモボタンをご利用ください。');
      }
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [activeTab]);

  // スタンプ獲得＆おすそわけクーポン発行処理（将来はSupabase Edge Functions等でサーバー検証）
  const handleScanStoreQr = (qrValue: string) => {
    const targetStore = stores.find((s) => s.qrCodeValue === qrValue);
    if (!targetStore) return;

    // 重複取得チェック
    const alreadyHasStamp = stamps.some((st) => st.storeId === targetStore.id);
    if (alreadyHasStamp) {
      setScanResultModal({ type: 'duplicate', store: targetStore });
      return;
    }

    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      '0'
    )}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(
      2,
      '0'
    )}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newStamp: Stamp = {
      id: `stamp-${Date.now()}`,
      userId: user.id,
      storeId: targetStore.id,
      acquiredAt: formattedDate,
    };
    setStamps((prev) => [newStamp, ...prev]);

    // ルールに基づき別店舗のおすそわけクーポンを発行
    const rule = MOCK_COUPON_RULES.find((r) => r.triggerStoreId === targetStore.id);
    let newCoupon: Coupon | undefined;

    if (rule) {
      const expireDate = new Date();
      expireDate.setDate(expireDate.getDate() + rule.validDays);
      newCoupon = {
        id: `coupon-${Date.now()}`,
        userId: user.id,
        ruleId: rule.id,
        targetStoreId: rule.targetStoreId,
        sourceStoreId: targetStore.id,
        title: rule.title,
        description: rule.description,
        condition: rule.condition,
        expiresAt: expireDate.toISOString().split('T')[0],
        isUsed: false,
      };
      setCoupons((prev) => [newCoupon!, ...prev]);
    }

    setScanResultModal({
      type: 'success',
      store: targetStore,
      issuedCoupon: newCoupon,
    });
  };

  // クーポン使用確定処理（再利用不可にする）
  const handleUseCoupon = (coupon: Coupon) => {
    const nowStr = new Date().toLocaleString('ja-JP');
    setCoupons((prev) =>
      prev.map((c) => (c.id === coupon.id ? { ...c, isUsed: true, usedAt: nowStr } : c))
    );
    setCouponUses((prev) => [
      {
        id: `use-${Date.now()}`,
        couponId: coupon.id,
        userId: user.id,
        storeId: coupon.targetStoreId,
        usedAt: nowStr,
      },
      ...prev,
    ]);
    setConfirmCoupon(null);
  };

  const getStoreName = (storeId: string) =>
    stores.find((s) => s.id === storeId)?.name || '不明な店舗';

  const filteredStores =
    selectedCategory === 'すべて'
      ? stores
      : stores.filter((s) => s.category === selectedCategory);

  return (
    <div className="min-h-screen bg-[#EFECE6] flex justify-center">
      {/* スマホ表示フレーム */}
      <div className="w-full max-w-md bg-[#FAF8F3] min-h-screen pb-24 shadow-xl relative overflow-x-hidden">
        {/* ヘッダー */}
        <header className="sticky top-0 z-30 bg-[#FAF8F3]/90 backdrop-blur-md px-5 py-3.5 border-b border-stone-200/70 flex items-center justify-between">
          {selectedStore ? (
            <button
              onClick={() => setSelectedStore(null)}
              className="flex items-center gap-1.5 text-sm font-bold text-[#2D5A3C]"
            >
              <ArrowLeft className="w-4 h-4" />
              戻る
            </button>
          ) : (
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-[#2D5A3C]">
                たまの寄り道
              </h1>
              <p className="text-[11px] text-stone-500">いつもの街に、ちょっとした発見を。</p>
            </div>
          )}

          <button
            onClick={() => {
              setSelectedStore(null);
              setActiveTab('mypage');
            }}
            className="flex items-center gap-1.5 bg-[#D97736]/10 text-[#D97736] px-3 py-1.5 rounded-full text-xs font-bold"
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>クーポン {unusedCoupons.length}枚</span>
          </button>
        </header>

        {/* メインコンテンツ */}
        <main className="px-5 pt-4 space-y-6">
          {/* ==================== 店舗詳細画面 ==================== */}
          {selectedStore ? (
            <div className="space-y-5 animate-fadeIn">
              <div className="rounded-3xl overflow-hidden shadow-sm bg-white border border-stone-100">
                <img
                  src={selectedStore.imageUrl}
                  alt={selectedStore.name}
                  className="w-full h-56 object-cover"
                />
                <div className="p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#2D5A3C]/10 text-[#2D5A3C]">
                      {selectedStore.category}
                    </span>
                    <span className="text-xs text-stone-500">{selectedStore.area}エリア</span>
                  </div>
                  <h2 className="text-xl font-bold text-stone-800">{selectedStore.name}</h2>
                  <p className="text-sm text-stone-600 leading-relaxed">
                    {selectedStore.description}
                  </p>

                  <div className="bg-[#FAF8F3] rounded-2xl p-4 space-y-2.5 text-xs text-stone-700">
                    <div className="flex items-start gap-2.5">
                      <Utensils className="w-4 h-4 text-[#D97736] shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block text-stone-500">おすすめメニュー</span>
                        <span className="font-semibold text-stone-800">
                          {selectedStore.recommendedMenu}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <MapPin className="w-4 h-4 text-[#2D5A3C] shrink-0 mt-0.5" />
                      <span>{selectedStore.address}</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Clock className="w-4 h-4 text-[#2D5A3C] shrink-0 mt-0.5" />
                      <span>{selectedStore.hours}</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CalendarOff className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                      <span>定休日：{selectedStore.closedDays}</span>
                    </div>
                  </div>

                  {/* QR読み取り導線 */}
                  <button
                    onClick={() => {
                      setSelectedStore(null);
                      setActiveTab('qr');
                    }}
                    className="w-full py-3.5 rounded-2xl bg-[#2D5A3C] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md active:scale-[0.99] transition"
                  >
                    <QrCode className="w-5 h-5" />
                    店頭のQRコードを読み取ってスタンプ獲得
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* ==================== ① ホーム画面 ==================== */}
              {activeTab === 'home' && (
                <div className="space-y-6">
                  {/* 開催中スタンプラリー＆進捗カード */}
                  <section className="rounded-3xl bg-gradient-to-br from-[#2D5A3C] to-[#1E402A] text-white p-5 shadow-md space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold bg-white/15 px-3 py-1 rounded-full">
                        開催中のスタンプラリー
                      </span>
                      <span className="text-xs text-emerald-200">多摩エリア回遊編</span>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold leading-snug">
                        お店を巡って「おすそわけ」をつなごう
                      </h2>
                      <p className="text-xs text-emerald-100/90 mt-1">
                        スタンプを集めると、次のお店で使える特別クーポンが届きます。
                      </p>
                    </div>
                    <div className="bg-white/10 rounded-2xl p-3.5">
                      <div className="flex justify-between text-xs mb-1.5">
                        <span>現在の獲得スタンプ</span>
                        <span className="font-bold">
                          {stamps.length} / {stores.length} 店舗達成
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-black/20 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#F59E0B] rounded-full transition-all duration-500"
                          style={{ width: `${(stamps.length / stores.length) * 100}%` }}
                        />
                      </div>
                    </div>
                  </section>

                  {/* おすそわけクーポン紹介 */}
                  <section className="rounded-3xl bg-white p-4 border border-amber-200/70 shadow-sm flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-[#D97736]/15 text-[#D97736] flex items-center justify-center shrink-0">
                      <Gift className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-stone-800">おすそわけクーポンとは？</h3>
                      <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">
                        A店でスタンプを押すと、B店で使えるクーポンが自動発行！街のハシゴを楽しめます。
                      </p>
                    </div>
                  </section>

                  {/* おすすめ店舗 */}
                  <section className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-base text-stone-800">おすすめ店舗</h3>
                      <button
                        onClick={() => setActiveTab('stores')}
                        className="text-xs font-bold text-[#2D5A3C] flex items-center"
                      >
                        すべて見る <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-3">
                      {stores
                        .filter((s) => s.isRecommended)
                        .map((store) => (
                          <div
                            key={store.id}
                            onClick={() => setSelectedStore(store)}
                            className="bg-white rounded-3xl overflow-hidden border border-stone-100 shadow-sm cursor-pointer active:scale-[0.99] transition"
                          >
                            <img
                              src={store.imageUrl}
                              alt={store.name}
                              className="w-full h-40 object-cover"
                            />
                            <div className="p-4">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[11px] font-bold text-[#2D5A3C] bg-[#2D5A3C]/10 px-2.5 py-0.5 rounded-full">
                                  {store.category}
                                </span>
                                <span className="text-xs text-stone-400">{store.area}</span>
                              </div>
                              <h4 className="font-bold text-stone-800">{store.name}</h4>
                              <p className="text-xs text-stone-500 line-clamp-1 mt-1">
                                {store.description}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </section>

                  {/* 新着店舗 */}
                  <section className="space-y-3">
                    <h3 className="font-bold text-base text-stone-800">新着の参加店舗</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {stores
                        .filter((s) => s.isNew)
                        .map((store) => (
                          <div
                            key={store.id}
                            onClick={() => setSelectedStore(store)}
                            className="bg-white rounded-2xl overflow-hidden border border-stone-100 shadow-sm cursor-pointer"
                          >
                            <img
                              src={store.imageUrl}
                              alt={store.name}
                              className="w-full h-28 object-cover"
                            />
                            <div className="p-3">
                              <span className="text-[10px] font-bold text-[#D97736]">NEW</span>
                              <h4 className="font-bold text-xs text-stone-800 line-clamp-1 mt-0.5">
                                {store.name}
                              </h4>
                              <p className="text-[11px] text-stone-400 mt-0.5">{store.area}</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </section>
                </div>
              )}

              {/* ==================== ② 店舗一覧画面 ==================== */}
              {activeTab === 'stores' && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-stone-800">参加店舗を探す</h2>
                  {/* カテゴリーフィルター */}
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {['すべて', 'ラーメン', 'カフェ', 'ベーカリー', '雑貨・書店'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
                          selectedCategory === cat
                            ? 'bg-[#2D5A3C] text-white'
                            : 'bg-white text-stone-600 border border-stone-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-4">
                    {filteredStores.map((store) => {
                      const visited = stamps.some((st) => st.storeId === store.id);
                      return (
                        <div
                          key={store.id}
                          onClick={() => setSelectedStore(store)}
                          className="bg-white rounded-3xl overflow-hidden border border-stone-100 shadow-sm cursor-pointer"
                        >
                          <div className="relative">
                            <img
                              src={store.imageUrl}
                              alt={store.name}
                              className="w-full h-44 object-cover"
                            />
                            {visited && (
                              <span className="absolute top-3 right-3 bg-[#2D5A3C] text-white text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow">
                                <CheckCircle2 className="w-3.5 h-3.5" /> 訪問済み
                              </span>
                            )}
                          </div>
                          <div className="p-4 space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-[#2D5A3C] bg-[#2D5A3C]/10 px-2.5 py-0.5 rounded-full">
                                {store.category}
                              </span>
                              <span className="text-xs text-stone-500">{store.area}</span>
                            </div>
                            <h3 className="font-bold text-base text-stone-800">{store.name}</h3>
                            <p className="text-xs text-stone-600 line-clamp-2">
                              {store.description}
                            </p>
                            <div className="pt-2 border-t border-stone-100 text-[11px] text-stone-500 flex justify-between">
                              <span>おすすめ：{store.recommendedMenu.split('（')[0]}</span>
                              <span className="text-[#2D5A3C] font-bold">詳細を見る →</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ==================== ③ QR読み取り画面 ==================== */}
              {activeTab === 'qr' && (
                <div className="space-y-5">
                  <div className="text-center space-y-1">
                    <h2 className="text-lg font-bold text-stone-800">店頭QRコードを読み取る</h2>
                    <p className="text-xs text-stone-500">
                      レジ横の専用QRコードを枠内に映してください
                    </p>
                  </div>

                  {/* カメラプレビュー枠 */}
                  <div className="relative rounded-3xl overflow-hidden bg-stone-900 aspect-square flex items-center justify-center shadow-inner">
                    {cameraError ? (
                      <div className="p-6 text-center text-white space-y-3">
                        <Camera className="w-10 h-10 mx-auto text-stone-400" />
                        <p className="text-xs leading-relaxed text-stone-300">{cameraError}</p>
                      </div>
                    ) : (
                      <>
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-12 border-2 border-white/80 rounded-3xl pointer-events-none" />
                      </>
                    )}
                  </div>

                  {/* 開発・デモ用ワンタップQR読み取りテスト */}
                  <div className="bg-white rounded-3xl p-4 border border-stone-200 space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#2D5A3C]">
                      <Sparkles className="w-4 h-4" />
                      <span>動作確認用：店舗QRコード擬似スキャン</span>
                    </div>
                    <p className="text-[11px] text-stone-500">
                      カメラが使えない環境でも、下の店舗ボタンを押すとQR読み取りと「おすそわけクーポン」発行を体験できます。
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      {stores.map((store) => {
                        const isCollected = stamps.some((s) => s.storeId === store.id);
                        return (
                          <button
                            key={store.id}
                            onClick={() => handleScanStoreQr(store.qrCodeValue)}
                            className="flex items-center justify-between p-3 rounded-2xl border border-stone-200 hover:border-[#2D5A3C] text-left transition"
                          >
                            <div>
                              <span className="text-xs font-bold text-stone-800 block">
                                {store.name}
                              </span>
                              <span className="text-[10px] text-stone-400">
                                QR: {store.qrCodeValue}
                              </span>
                            </div>
                            <span
                              className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                                isCollected
                                  ? 'bg-stone-100 text-stone-500'
                                  : 'bg-[#2D5A3C] text-white'
                              }`}
                            >
                              {isCollected ? '取得済みテスト' : '読み取る'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ==================== ④ スタンプ帳画面 ==================== */}
              {activeTab === 'stamps' && (
                <div className="space-y-5">
                  <div className="bg-white rounded-3xl p-5 border border-stone-100 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold text-stone-800">わたしのスタンプ帳</h2>
                      <span className="text-sm font-extrabold text-[#2D5A3C]">
                        {stamps.length} / {stores.length} 個
                      </span>
                    </div>
                    <p className="text-xs text-stone-500">
                      あと {Math.max(0, stores.length - stamps.length)} 店舗巡ると全店舗コンプリート！
                    </p>
                    {/* スタンプ台紙グリッド */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      {stores.map((store) => {
                        const stamp = stamps.find((s) => s.storeId === store.id);
                        return (
                          <div
                            key={store.id}
                            className={`rounded-2xl p-4 border-2 flex flex-col items-center text-center transition ${
                              stamp
                                ? 'border-[#2D5A3C] bg-[#2D5A3C]/5'
                                : 'border-dashed border-stone-200 bg-stone-50/60'
                            }`}
                          >
                            <div
                              className={`w-14 h-14 rounded-full flex items-center justify-center mb-2 ${
                                stamp
                                  ? 'bg-[#2D5A3C] text-white shadow-md rotate-[-6deg]'
                                  : 'bg-stone-200/70 text-stone-400'
                              }`}
                            >
                              {stamp ? (
                                <CheckCircle2 className="w-8 h-8" />
                              ) : (
                                <span className="text-xs font-bold">未訪問</span>
                              )}
                            </div>
                            <span className="text-xs font-bold text-stone-800 line-clamp-1">
                              {store.name}
                            </span>
                            <span className="text-[10px] text-stone-400 mt-1">
                              {stamp ? stamp.acquiredAt.split(' ')[0] : store.area}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* スタンプ獲得履歴 */}
                  <div className="space-y-2.5">
                    <h3 className="text-sm font-bold text-stone-700">スタンプ獲得履歴</h3>
                    {stamps.map((st) => (
                      <div
                        key={st.id}
                        className="bg-white rounded-2xl p-3.5 border border-stone-100 flex items-center justify-between"
                      >
                        <div>
                          <p className="text-xs font-bold text-stone-800">
                            {getStoreName(st.storeId)}
                          </p>
                          <p className="text-[11px] text-stone-400">{st.acquiredAt}</p>
                        </div>
                        <span className="text-xs font-bold text-[#2D5A3C]">+1 スタンプ</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ==================== ⑤ マイページ・おすそわけクーポン画面 ==================== */}
              {activeTab === 'mypage' && (
                <div className="space-y-6">
                  {/* ユーザープロフィール */}
                  <div className="bg-white rounded-3xl p-5 border border-stone-100 shadow-sm flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-stone-400">多摩さんぽメンバー</span>
                      <h2 className="text-lg font-bold text-stone-800">{user.name} さん</h2>
                      <p className="text-xs text-stone-500 mt-0.5">よく行くエリア：{user.area}</p>
                    </div>
                    <div className="text-right bg-[#FAF8F3] px-4 py-2.5 rounded-2xl">
                      <span className="text-[10px] text-stone-500 block">獲得スタンプ</span>
                      <span className="text-xl font-extrabold text-[#2D5A3C]">
                        {stamps.length}
                      </span>
                    </div>
                  </div>

                  {/* 保有中のおすそわけクーポン */}
                  <section className="space-y-3">
                    <h3 className="font-bold text-base text-stone-800 flex items-center gap-1.5">
                      <Ticket className="w-5 h-5 text-[#D97736]" />
                      使えるおすそわけクーポン（{unusedCoupons.length}枚）
                    </h3>

                    {unusedCoupons.length === 0 ? (
                      <div className="bg-white rounded-2xl p-6 text-center text-xs text-stone-400 border border-stone-100">
                        現在使えるクーポンはありません。お店のQRを読み取ってクーポンをゲットしよう！
                      </div>
                    ) : (
                      unusedCoupons.map((coupon) => (
                        <div
                          key={coupon.id}
                          className="bg-white rounded-3xl p-5 border-2 border-[#D97736]/30 shadow-sm space-y-3 relative overflow-hidden"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold bg-[#D97736]/15 text-[#D97736] px-2.5 py-0.5 rounded-full">
                              {getStoreName(coupon.sourceStoreId)} からのおすそわけ
                            </span>
                            <span className="text-[11px] text-stone-400">
                              期限：{coupon.expiresAt}
                            </span>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-[#2D5A3C]">
                              対象店舗：{getStoreName(coupon.targetStoreId)}
                            </p>
                            <h4 className="text-lg font-extrabold text-stone-800 mt-0.5">
                              {coupon.title}
                            </h4>
                            <p className="text-xs text-stone-500 mt-1">{coupon.description}</p>
                          </div>
                          <div className="bg-[#FAF8F3] rounded-xl p-2.5 text-[11px] text-stone-600">
                            利用条件：{coupon.condition}
                          </div>
                          <button
                            onClick={() => setConfirmCoupon(coupon)}
                            className="w-full py-3 rounded-2xl bg-[#D97736] text-white font-bold text-xs shadow hover:bg-[#c56729] transition"
                          >
                            店頭でこのクーポンを使う
                          </button>
                        </div>
                      ))
                    )}
                  </section>

                  {/* 使用済みクーポン履歴 */}
                  {usedCoupons.length > 0 && (
                    <section className="space-y-2.5">
                      <h3 className="text-sm font-bold text-stone-500">
                        使用済みクーポン（{usedCoupons.length}枚）
                      </h3>
                      {usedCoupons.map((coupon) => (
                        <div
                          key={coupon.id}
                          className="bg-stone-100/80 rounded-2xl p-4 border border-stone-200 opacity-75 space-y-1"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-stone-600">
                              {getStoreName(coupon.targetStoreId)}
                            </span>
                            <span className="text-[10px] font-bold bg-stone-300 text-stone-700 px-2 py-0.5 rounded">
                              使用済み（再利用不可）
                            </span>
                          </div>
                          <p className="text-sm font-bold text-stone-500 line-through">
                            {coupon.title}
                          </p>
                          <p className="text-[10px] text-stone-400">利用日時：{coupon.usedAt}</p>
                        </div>
                      ))}
                    </section>
                  )}

                  {/* 将来の管理機能プレビュー */}
                  <div className="text-center pt-2">
                    <p className="text-[11px] text-stone-400">
                      クーポン利用記録：{couponUses.length}件 / Supabase連携準備済み
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </main>

        {/* 下部固定ナビゲーション */}
        <BottomNav
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setSelectedStore(null);
            setActiveTab(tab);
          }}
          unusedCouponCount={unusedCoupons.length}
        />

        {/* ==================== スタンプ獲得＆クーポン発行モーダル ==================== */}
        {scanResultModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-5">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
              {scanResultModal.type === 'duplicate' ? (
                <>
                  <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-stone-800">すでに獲得済みです</h3>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    「{scanResultModal.store.name}」のスタンプはすでにスタンプ帳に押されています。別の参加店舗も巡ってみましょう！
                  </p>
                  <button
                    onClick={() => setScanResultModal(null)}
                    className="w-full py-3 rounded-2xl bg-stone-800 text-white text-xs font-bold"
                  >
                    閉じる
                  </button>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-[#2D5A3C] text-white flex items-center justify-center mx-auto shadow-lg animate-bounce">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#2D5A3C]">スタンプ獲得！</span>
                    <h3 className="text-xl font-extrabold text-stone-800 mt-0.5">
                      {scanResultModal.store.name}
                    </h3>
                  </div>

                  {scanResultModal.issuedCoupon && (
                    <div className="bg-[#FAF8F3] border-2 border-[#D97736]/40 rounded-2xl p-4 text-left space-y-1.5">
                      <span className="text-[11px] font-bold text-[#D97736] flex items-center gap-1">
                        <Gift className="w-3.5 h-3.5" /> おすそわけクーポンが届きました！
                      </span>
                      <p className="text-xs font-bold text-[#2D5A3C]">
                        対象：{getStoreName(scanResultModal.issuedCoupon.targetStoreId)}
                      </p>
                      <p className="text-sm font-extrabold text-stone-800">
                        {scanResultModal.issuedCoupon.title}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => {
                        setScanResultModal(null);
                        setActiveTab('mypage');
                      }}
                      className="flex-1 py-3 rounded-2xl bg-[#D97736] text-white text-xs font-bold"
                    >
                      クーポンを見る
                    </button>
                    <button
                      onClick={() => {
                        setScanResultModal(null);
                        setActiveTab('stamps');
                      }}
                      className="flex-1 py-3 rounded-2xl bg-[#2D5A3C] text-white text-xs font-bold"
                    >
                      スタンプ帳へ
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ==================== クーポン使用確定モーダル ==================== */}
        {confirmCoupon && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-5">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
              <h3 className="text-base font-bold text-stone-800 text-center">
                このクーポンを使用済みにしますか？
              </h3>
              <div className="bg-[#FAF8F3] p-4 rounded-2xl space-y-1 text-center">
                <p className="text-xs font-bold text-[#2D5A3C]">
                  {getStoreName(confirmCoupon.targetStoreId)}
                </p>
                <p className="text-base font-extrabold text-stone-800">{confirmCoupon.title}</p>
              </div>
              <p className="text-[11px] text-rose-600 text-center font-medium">
                ※店員さんに画面をお見せください。一度使用すると元に戻せません。
              </p>
              <div className="flex gap-2.5">
                <button
                  onClick={() => setConfirmCoupon(null)}
                  className="flex-1 py-3 rounded-2xl bg-stone-100 text-stone-600 text-xs font-bold"
                >
                  キャンセル
                </button>
                <button
                  onClick={() => handleUseCoupon(confirmCoupon)}
                  className="flex-1 py-3 rounded-2xl bg-[#D97736] text-white text-xs font-bold"
                >
                  使用を確定する
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;