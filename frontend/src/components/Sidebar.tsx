'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Files,
  MessageSquare,
  ClipboardList,
  FolderKanban,
  TrendingUp,
  Settings,
  User,
  ChevronDown,
  Megaphone,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavItemProps {
  href: string;
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  subItems?: {
    href: string;
    label: string;
  }[];
}

const NavItem = ({
  href,
  label,
  icon,
  active,
  onClick,
  subItems,
}: NavItemProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Check if any sub-item is active
  const hasActiveChild = subItems?.some((item) => pathname === item.href);

  // Expand the dropdown if it contains the active item
  useEffect(() => {
    if (hasActiveChild) {
      setIsOpen(true);
    }
  }, [hasActiveChild]);

  const handleToggle = (e: React.MouseEvent) => {
    if (subItems && subItems.length > 0) {
      e.preventDefault();
      setIsOpen(!isOpen);
    }

    if (onClick) {
      onClick();
    }
  };

  return (
    <li>
      <Link
        href={subItems && subItems.length > 0 ? '#' : href}
        onClick={handleToggle}
        className={`flex items-center p-2.5 rounded-md hover:bg-primary-100 transition-colors group gap-3
          ${active || hasActiveChild ? 'bg-primary-100 text-primary-700' : 'text-gray-600'}`}
      >
        <span className="flex-shrink-0 w-5 h-5">{icon}</span>
        <span className="flex-grow">{label}</span>
        {subItems && subItems.length > 0 && (
          <ChevronDown
            className={`h-4 w-4 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
          />
        )}
      </Link>

      {subItems && subItems.length > 0 && isOpen && (
        <ul className="mt-1 ml-6 space-y-1">
          {subItems.map((item, i) => (
            <li key={i}>
              <Link
                href={item.href}
                className={`block p-2 pl-3 rounded-md text-sm hover:bg-primary-50 transition-colors
                  ${pathname === item.href ? 'text-primary-700 font-medium' : 'text-gray-600'}`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
};

export default function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleMobileToggle = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  // Navigation groups
  const navItems = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      href: '/projects',
      label: 'Projects',
      icon: <FolderKanban className="h-5 w-5" />,
    },
    {
      href: '/tasks',
      label: 'Tasks',
      icon: <ClipboardList className="h-5 w-5" />,
    },
    {
      href: '/messages',
      label: 'Messages',
      icon: <MessageSquare className="h-5 w-5" />,
    },
    {
      href: '/documents',
      label: 'Documents',
      icon: <Files className="h-5 w-5" />,
    },
    {
      href: '/marketing',
      label: 'Marketing',
      icon: <Megaphone className="h-5 w-5" />,
      subItems: [
        {
          href: '/marketing',
          label: 'Overview',
        },
        {
          href: '/marketing/campaigns',
          label: 'Campaigns',
        },
        {
          href: '/marketing/content/generate',
          label: 'Content Generator',
        },
        {
          href: '/marketing/trends',
          label: 'Trend Analysis',
        },
      ],
    },
    {
      href: '/analytics',
      label: 'Analytics',
      icon: <TrendingUp className="h-5 w-5" />,
    },
  ];

  const bottomNavItems = [
    {
      href: '/profile',
      label: 'Profile',
      icon: <User className="h-5 w-5" />,
    },
    {
      href: '/settings',
      label: 'Settings',
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  return (
    <>
      {/* Mobile sidebar backdrop */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-800/50 z-30 lg:hidden"
          onClick={handleMobileToggle}
        />
      )}

      {/* Mobile toggle button */}
      <button
        className="fixed bottom-6 right-6 z-30 lg:hidden bg-primary-600 text-white p-3 rounded-full shadow-lg"
        onClick={handleMobileToggle}
      >
        {isMobileSidebarOpen ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        )}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-40 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-4 border-b border-gray-200">
            <Link href="/dashboard" className="flex items-center">
              <span className="text-2xl font-bold text-primary-600">
                NeonHub
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {navItems.map((item, i) => (
                <NavItem
                  key={i}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  active={pathname === item.href}
                  subItems={item.subItems}
                />
              ))}
            </ul>

            <div className="mt-8 pt-4 border-t border-gray-200">
              <ul className="space-y-1">
                {bottomNavItems.map((item, i) => (
                  <NavItem
                    key={i}
                    href={item.href}
                    label={item.label}
                    icon={item.icon}
                    active={pathname === item.href}
                  />
                ))}
                <li>
                  <button
                    onClick={logout}
                    className="w-full flex items-center p-2.5 rounded-md hover:bg-red-50 transition-colors text-red-600 gap-3"
                  >
                    <span className="flex-shrink-0 w-5 h-5">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                    </span>
                    <span className="flex-grow">Logout</span>
                  </button>
                </li>
              </ul>
            </div>
          </nav>
        </div>
      </aside>
    </>
  );
}
