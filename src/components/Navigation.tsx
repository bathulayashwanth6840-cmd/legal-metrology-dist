import { NavLink } from 'react-router-dom';
import { Home, Camera, History, User, MapPin, BookOpen } from 'lucide-react';

export default function Navigation() {
  const navItems = [
    { to: '/', icon: <Home size={24} />, label: 'Home' },
    { to: '/scan', icon: <Camera size={24} />, label: 'Scan' },
    { to: '/history', icon: <History size={24} />, label: 'History' },
    { to: '/locations', icon: <MapPin size={24} />, label: 'Locations' },
    { to: '/rules', icon: <BookOpen size={24} />, label: 'Rules' },
    { to: '/profile', icon: <User size={24} />, label: 'Profile' },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden sm:flex flex-col w-64 bg-[var(--color-navy)] text-white min-h-screen">
        <div className="p-6 font-bold text-xl border-b border-gray-700 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-600 bg-white">
            <img src="/legal_metrology_logo.jpg" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <span>LegalMetriX</span>
        </div>
        <nav className="flex-1 py-4">
          <ul>
            {navItems.map(item => (
              <li key={item.to}>
                <NavLink 
                  to={item.to} 
                  className={({ isActive }) => `flex items-center gap-3 px-6 py-4 hover:bg-blue-900 transition-colors ${isActive ? 'bg-blue-800 border-l-4 border-[var(--color-saffron)]' : 'border-l-4 border-transparent'}`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <div className="sm:hidden fixed bottom-0 w-full bg-white border-t border-gray-200 z-50">
        <nav className="flex justify-around">
          {navItems.map(item => (
            <NavLink 
              key={item.to}
              to={item.to} 
              className={({ isActive }) => `flex flex-col items-center p-3 w-full ${isActive ? 'text-[var(--color-navy)]' : 'text-gray-400'}`}
            >
              {item.icon}
              <span className="text-[10px] mt-1 font-semibold">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </>
  );
}
