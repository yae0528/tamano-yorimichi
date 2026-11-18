import React from 'react';
import { Home, Store, QrCode, Stamp, User } from 'lucide-react';

export type TabType = 'home' | 'stores' | 'qr' | 'stamps' | 'mypage';

interface BottomNavProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  unusedCouponCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  unusedCouponCount,
}) => {
  const navItems: { id: TabType; label: string; icon: React.ReactNode; isCenter?: boolean }[] = [
    { id: 'home', label: 'ホーム', icon: <Home className="w-5 h-5" /> },
    { id: 'stores', label: 'お店を探す', icon: <Store className="w-5 h-5" /> },
    { id: 'qr', label: 'QR読み取り', icon: <QrCode className="w-6 h-6" />, isCenter: true },
    { id: 'stamps', label: 'スタンプ帳', icon: <Stamp className="w-5 h-5" /> },
    { id: 'mypage', label: 'マイページ', icon: <User className="w-5 h-5" /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pointer-events-none">
      <div className="w-full max-w-md bg-white/95 backdrop-blur-md border-t border-stone-200 px-2 pb-safe pt-1.5 flex items-center justify-around pointer-events-auto shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;

          if (item.isCenter) {
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className="flex flex-col items-center -mt-5 group"
              >
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
                    isActive
                      ? 'bg-[#1E402A] text-white ring-4 ring-[#2D5A3C]/20'
                      : 'bg-[#2D5A3C] text-white group-hover:bg-[#234730]'
                  }`}
                >
                  {item.icon}
                </div>
                <span className="text-[10px] font-bold text-[#2D5A3C] mt-1">
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`relative flex flex-col items-center py-1.5 px-2.5 rounded-xl transition-colors ${
                isActive ? 'text-[#2D5A3C]' : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              {item.icon}
              <span className={`text-[10px] mt-1 ${isActive ? 'font-bold' : 'font-medium'}`}>
                {item.label}
              </span>
              {item.id === 'mypage' && unusedCouponCount > 0 && (
                <span className="absolute top-1 right-2 w-4 h-4 rounded-full bg-[#D97736] text-white text-[10px] font-bold flex items-center justify-center">
                  {unusedCouponCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};