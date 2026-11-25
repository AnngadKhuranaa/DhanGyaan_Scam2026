import { useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';

export default function NotificationDropdown({ isOpen, onClose, onToggle }) {
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const notifications = [
    "Stock AAPL up 3%",
    "Your portfolio gained 2%",
    "New market insights available"
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={onToggle}
        className="hidden h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-all duration-300 hover:scale-105 hover:text-brand-600 md:inline-flex"
      >
        <Bell size={16} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 origin-top-right rounded-2xl border border-slate-200 bg-white p-4 shadow-xl animate-fade-in z-50">
          <h3 className="mb-3 text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">
            Notifications
          </h3>
          <ul className="space-y-3">
            {notifications.map((note, index) => (
              <li key={index} className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
                • {note}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
