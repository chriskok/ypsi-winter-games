'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, orderBy, limit, getDocs, getDoc, doc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import Navbar from '@/components/Navbar';

export default function Leaderboard() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);

          // Redirect non-admins
          if (!data?.isAdmin) {
            setLoading(false);
            router.push('/home');
            return;
          }
        }
        await fetchLeaderboard();
        setLoading(false);
      } else {
        setLoading(false);
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchLeaderboard = async () => {
    const q = query(collection(db, 'users'), orderBy('totalPoints', 'desc'), limit(10));
    const snapshot = await getDocs(q);
    const leaderboardData = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setLeaders(leaderboardData);
  };

  if (loading || !userData) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userData={userData} />

      <div className="container mx-auto p-8 max-w-3xl">
        <h2 className="text-3xl font-bold mb-6">Leaderboard</h2>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-primary text-white">
              <tr>
                <th className="p-4 text-left">Rank</th>
                <th className="p-4 text-left">Player</th>
                <th className="p-4 text-right">Points</th>
              </tr>
            </thead>
            <tbody>
              {leaders.map((leader, index) => (
                <tr
                  key={leader.id}
                  className={`border-b ${leader.id === user?.uid ? 'bg-primary/10 font-semibold' : ''}`}
                >
                  <td className="p-4">{index + 1}</td>
                  <td className="p-4">{leader.displayName}</td>
                  <td className="p-4 text-right">{leader.totalPoints}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
