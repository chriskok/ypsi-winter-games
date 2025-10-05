'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, increment, collection, getDocs } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import Navbar from '@/components/Navbar';

export default function Prizes() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [prizes, setPrizes] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
        await fetchPrizes();
        setLoading(false);
      } else {
        setLoading(false);
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchPrizes = async () => {
    const snapshot = await getDocs(collection(db, 'prizes'));
    setPrizes(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  };

  const handleClaim = async (prizeId: string, prizeCost: number, prizeName: string) => {
    setMessage('');

    if (userData.totalPoints < prizeCost) {
      setMessage('Not enough points!');
      return;
    }

    if (userData.prizesClaimedCount >= 4) {
      setMessage('Maximum 4 prizes per user');
      return;
    }

    try {
      await setDoc(
        doc(db, 'users', user.uid),
        {
          totalPoints: increment(-prizeCost),
          prizesClaimedCount: increment(1),
        },
        { merge: true }
      );

      await setDoc(doc(db, 'claims', `${user.uid}_${prizeId}_${Date.now()}`), {
        userId: user.uid,
        prizeId,
        prizeName,
        prizeCost,
        timestamp: new Date(),
      });

      setMessage(`Success! You claimed ${prizeName}`);

      const updatedUserDoc = await getDoc(doc(db, 'users', user.uid));
      setUserData(updatedUserDoc.data());
    } catch (err) {
      setMessage('Error claiming prize');
    }
  };

  if (loading || !userData) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userData={userData} />

      <div className="container mx-auto p-8 max-w-4xl">
        <h2 className="text-3xl font-bold mb-2">Prize Catalog</h2>
        <p className="text-gray-600 mb-6">
          You have claimed {userData?.prizesClaimedCount || 0} of 4 prizes
        </p>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.includes('Success') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message}
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          {prizes.map((prize) => (
            <div key={prize.id} className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-bold mb-2">{prize.name}</h3>
              <p className="text-gray-600 mb-4">{prize.description}</p>
              <p className="text-2xl font-bold text-accent mb-4">{prize.cost} points</p>
              <button
                onClick={() => handleClaim(prize.id, prize.cost, prize.name)}
                disabled={!prize.inStock || userData?.totalPoints < prize.cost || userData?.prizesClaimedCount >= 4}
                className={`w-full py-2 rounded-lg font-semibold ${
                  prize.inStock && userData?.totalPoints >= prize.cost && userData?.prizesClaimedCount < 4
                    ? 'bg-accent text-white hover:bg-accent/90'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {!prize.inStock ? 'Out of Stock' : 'Claim Prize'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
