'use client';

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

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  return (
    <nav className="bg-white border-b-2 border-primary p-4 shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <img src="/android-chrome-192x192.png" alt="YWG Logo" className="h-10 w-10 rounded-lg" />
          <h1 className="text-2xl font-bold text-accent">
            {currentPage === 'admin' ? 'Ypsi Winter Games Admin' : 'Ypsi Winter Games'}
          </h1>
        </Link>
        <div className="flex items-center gap-6">
          {userData && (
            <span className="text-lg font-semibold bg-primary text-white px-3 py-1 rounded-lg">
              {userData.totalPoints || 0} pts
            </span>
          )}
          <Link href="/home" className="text-accent hover:text-primary font-medium">
            Home
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
          <button
            onClick={handleLogout}
            className="text-accent hover:text-secondary font-medium"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
