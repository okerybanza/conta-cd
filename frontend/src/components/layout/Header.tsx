import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Bell, Search, X, ChevronDown, LogOut, User, Settings } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import notificationService from '../../services/notification.service';
import GlobalSearch from '../search/GlobalSearch';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "A l'instant";
  if (mins < 60) return `Il y a ${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Hier';
  return `Il y a ${days}j`;
}

export default function Header() {
  const navigate = useNavigate();
  const { user, company, logout } = useAuthStore();

  // Notifications
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Search
  const [searchOpen, setSearchOpen] = useState(false);

  // User menu
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const loadUnread = useCallback(async () => {
    const count = await notificationService.getUnreadCount();
    setUnreadCount(count);
  }, []);

  useEffect(() => {
    loadUnread();
    const interval = setInterval(loadUnread, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, [loadUnread]);

  const openNotifications = async () => {
    setNotifOpen(true);
    const recent = await notificationService.getRecent(5);
    setNotifications(recent);
  };

  const handleMarkAllRead = async () => {
    try {
      setMarkingAll(true);
      await notificationService.markAllAsRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch { /* silent */ }
    finally { setMarkingAll(false); }
  };

  const handleNotifClick = async (notif: any) => {
    try { await notificationService.markAsRead(notif.id); } catch { /* silent */ }
    setNotifOpen(false);
    setUnreadCount(prev => Math.max(0, prev - 1));
    if (notif.url || notif.relatedType) {
      const url = notif.url || (notif.relatedType === 'invoice' ? `/invoices/${notif.relatedId}` : null);
      if (url) navigate(url);
    }
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Ctrl+K to open search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const userInitials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'
    : 'U';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <header className="h-14 border-b bg-white flex items-center justify-between px-4 sticky top-0 z-30">
        {/* Left: Search trigger */}
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors w-56">
          <Search size={15} />
          <span>Rechercher...</span>
          <span className="ml-auto text-xs bg-white border border-gray-200 rounded px-1.5 py-0.5 text-gray-400">Ctrl K</span>
        </button>

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={notifOpen ? () => setNotifOpen(false) : openNotifications}
              className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button onClick={handleMarkAllRead} disabled={markingAll}
                        className="text-xs text-blue-600 hover:underline disabled:opacity-50">
                        {markingAll ? '...' : 'Tout lire'}
                      </button>
                    )}
                    <button onClick={() => setNotifOpen(false)} className="text-gray-400 hover:text-gray-600">
                      <X size={16} />
                    </button>
                  </div>
                </div>

                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-gray-400">
                      Aucune notification
                    </div>
                  ) : (
                    notifications.map((notif: any) => (
                      <button key={notif.id} onClick={() => handleNotifClick(notif)}
                        className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${!notif.read ? 'bg-blue-50/50' : ''}`}>
                        <div className="flex items-start gap-2">
                          {!notif.read && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {notif.subject || notif.type || 'Notification'}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                              {(notif.body || notif.message || '').slice(0, 60)}{(notif.body || notif.message || '').length > 60 ? '...' : ''}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">{timeAgo(notif.createdAt)}</p>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>

                <div className="px-4 py-2 border-t border-gray-100">
                  <Link to="/notifications" onClick={() => setNotifOpen(false)}
                    className="text-xs text-blue-600 hover:underline">
                    Voir toutes les notifications
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(v => !v)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                {userInitials}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-gray-900 leading-none">
                  {user?.firstName || user?.email?.split('@')[0] || 'Utilisateur'}
                </p>
                {company?.name && <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[120px]">{company.name}</p>}
              </div>
              <ChevronDown size={14} className="text-gray-400" />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1">
                <Link to="/profile" onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  <User size={15} /> Mon profil
                </Link>
                <Link to="/settings" onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  <Settings size={15} /> Parametres
                </Link>
                <div className="border-t border-gray-100 my-1" />
                <button onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                  <LogOut size={15} /> Deconnexion
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Search Modal */}
      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
