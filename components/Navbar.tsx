'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface NavbarProps {
  userData: {
    totalPoints?: number;
    isAdmin?: boolean;
  } | null;
  currentPage?: string;
}

export default function Navbar({ userData, currentPage }: NavbarProps) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
    setMobileMenuOpen(false);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white border-b-2 border-primary shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity" onClick={closeMobileMenu}>
            <img src="/android-chrome-192x192.png" alt="YWG Logo" className="h-10 w-10 rounded-lg" />
            <h1 className="text-base sm:text-xl md:text-2xl font-bold text-accent">
              {currentPage === 'admin' ? 'Ypsi Winter Games Admin' : 'Ypsi Winter Games'}
            </h1>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            {userData && (
              <span className="text-lg font-semibold bg-primary text-white px-3 py-1 rounded-lg">
                {userData.totalPoints || 0} pts
              </span>
            )}
            <Link href="/home" className="text-accent hover:text-primary font-medium">
              Home
            </Link>
            <Link href="/badges" className="text-accent hover:text-primary font-medium">
              Badges
            </Link>
            <Link href="/prizes" className="text-accent hover:text-primary font-medium">
              Prizes
            </Link>
            {userData?.isAdmin && (
              <>
                <Link href="/leaderboard" className="text-accent hover:text-primary font-medium">
                  Leaderboard
                </Link>
                <Link href="/admin" className="text-accent hover:text-primary font-medium">
                  Admin
                </Link>
              </>
            )}
            <Link href="/settings" className="text-accent hover:text-primary font-medium">
              Settings
            </Link>
            <button
              onClick={handleLogout}
              className="text-accent hover:text-secondary font-medium"
            >
              Logout
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-3">
            {userData && (
              <span className="text-sm font-semibold bg-primary text-white px-2 py-1 rounded">
                {userData.totalPoints || 0} pts
              </span>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-accent p-2 hover:bg-gray-100 rounded-lg"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 mt-3 pt-3 pb-2 space-y-2">
            <Link
              href="/home"
              className="block px-4 py-2 text-accent hover:bg-primary/10 rounded-lg font-medium"
              onClick={closeMobileMenu}
            >
              Home
            </Link>
            <Link
              href="/badges"
              className="block px-4 py-2 text-accent hover:bg-primary/10 rounded-lg font-medium"
              onClick={closeMobileMenu}
            >
              Badges
            </Link>
            <Link
              href="/prizes"
              className="block px-4 py-2 text-accent hover:bg-primary/10 rounded-lg font-medium"
              onClick={closeMobileMenu}
            >
              Prizes
            </Link>
            {userData?.isAdmin && (
              <>
                <Link
                  href="/leaderboard"
                  className="block px-4 py-2 text-accent hover:bg-primary/10 rounded-lg font-medium"
                  onClick={closeMobileMenu}
                >
                  Leaderboard
                </Link>
                <Link
                  href="/admin"
                  className="block px-4 py-2 text-accent hover:bg-primary/10 rounded-lg font-medium"
                  onClick={closeMobileMenu}
                >
                  Admin
                </Link>
              </>
            )}
            <Link
              href="/settings"
              className="block px-4 py-2 text-accent hover:bg-primary/10 rounded-lg font-medium"
              onClick={closeMobileMenu}
            >
              Settings
            </Link>
            <button
              onClick={handleLogout}
              className="block w-full text-left px-4 py-2 text-accent hover:bg-secondary/10 rounded-lg font-medium"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
