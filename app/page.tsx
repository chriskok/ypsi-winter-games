'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        router.push('/home');
      }
    });
    return () => unsubscribe();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-accent to-accent/90 flex items-center justify-center p-4">
      <div className="text-center text-white">
        {/* <img
          src="/android-chrome-192x192.png"
          alt="Ypsi Winter Games Logo"
          className="h-24 w-24 sm:h-32 sm:w-32 mx-auto mb-6 rounded-2xl shadow-lg bg-white p-2"
        /> */}
        <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-primary">Ypsi Winter Games</h1>
        <p className="text-lg sm:text-xl mb-8">Find codes around Ypsilanti, earn points, win prizes!</p>
        <div className="space-x-4">
          <Link
            href="/login"
            className="bg-primary text-accent px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 inline-block"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="bg-secondary text-white px-6 py-3 rounded-lg font-semibold hover:bg-secondary/90 inline-block"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
