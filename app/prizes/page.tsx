'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, increment, collection, getDocs, query, where } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import Navbar from '@/components/Navbar';

interface Prize {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon?: string;
  inStock: boolean;
  totalAvailable: number;
  redeemed: number;
}

export default function Prizes() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [userClaims, setUserClaims] = useState<string[]>([]); // Store prizeIds the user has claimed
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
        await Promise.all([fetchPrizes(), fetchUserClaims(currentUser.uid)]);
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
    const prizesData = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    } as Prize));
    // Sort by cost (ascending)
    prizesData.sort((a, b) => a.cost - b.cost);
    setPrizes(prizesData);
  };

  const fetchUserClaims = async (userId: string) => {
    const q = query(collection(db, 'claims'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    const claimedPrizeIds = snapshot.docs.map((doc) => doc.data().prizeId);
    setUserClaims(claimedPrizeIds);
  };

  const handleClaim = async (prizeId: string, prizeCost: number, prizeName: string) => {
    setMessage('');

    // Check if user has already claimed this prize
    if (userClaims.includes(prizeId)) {
      setMessage('You have already claimed this prize!');
      return;
    }

    // Find the prize to check inventory
    const prize = prizes.find(p => p.id === prizeId);
    if (!prize) {
      setMessage('Prize not found');
      return;
    }

    if (prize.redeemed >= prize.totalAvailable) {
      setMessage('This prize is sold out!');
      return;
    }

    if (userData.totalPoints < prizeCost) {
      setMessage('Not enough points!');
      return;
    }

    if (userData.prizesClaimedCount >= 4) {
      setMessage('Maximum 4 prizes per user');
      return;
    }

    try {
      // Update user points and prize count
      await setDoc(
        doc(db, 'users', user.uid),
        {
          totalPoints: increment(-prizeCost),
          prizesClaimedCount: increment(1),
        },
        { merge: true }
      );

      // Record the claim
      await setDoc(doc(db, 'claims', `${user.uid}_${prizeId}_${Date.now()}`), {
        userId: user.uid,
        prizeId,
        prizeName,
        prizeCost,
        timestamp: new Date(),
      });

      // Increment the redeemed count for this prize
      await setDoc(
        doc(db, 'prizes', prizeId),
        {
          redeemed: increment(1),
        },
        { merge: true }
      );

      setMessage(`Success! You claimed ${prizeName}`);

      // Update local state to reflect the claim
      setUserClaims([...userClaims, prizeId]);

      // Refresh data
      const updatedUserDoc = await getDoc(doc(db, 'users', user.uid));
      setUserData(updatedUserDoc.data());
      await fetchPrizes(); // Refresh prizes to show updated inventory
    } catch (err) {
      setMessage('Error claiming prize');
    }
  };

  if (loading || !userData) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar userData={userData} />

      <div className="container mx-auto p-4 sm:p-8 max-w-4xl flex-1">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2">Prize Catalog</h2>
        <p className="text-gray-600 mb-6">
          You have claimed {userData?.prizesClaimedCount || 0} of 4 prizes
        </p>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.includes('Success') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {prizes.map((prize) => (
            <div key={prize.id} className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
              {prize.icon && (
                <div className="w-full flex justify-center mb-4">
                  <i className={`bi bi-${prize.icon} text-6xl text-accent`}></i>
                </div>
              )}
              <h3 className="text-xl font-bold mb-2 text-center">{prize.name}</h3>
              <p className="text-gray-600 mb-2 flex-1 text-center">{prize.description}</p>
              <p className="text-sm text-gray-500 mb-4 text-center">
                {prize.redeemed} of {prize.totalAvailable} claimed
                {prize.redeemed >= prize.totalAvailable && <span className="text-red-600 font-semibold ml-2">(Sold Out)</span>}
              </p>
              <p className="text-2xl font-bold text-accent mb-4">{prize.cost} points</p>
              <button
                onClick={() => handleClaim(prize.id, prize.cost, prize.name)}
                disabled={
                  userClaims.includes(prize.id) ||
                  !prize.inStock ||
                  prize.redeemed >= prize.totalAvailable ||
                  userData?.totalPoints < prize.cost ||
                  userData?.prizesClaimedCount >= 4
                }
                className={`w-full py-2 rounded-lg font-semibold ${
                  !userClaims.includes(prize.id) &&
                  prize.inStock &&
                  prize.redeemed < prize.totalAvailable &&
                  userData?.totalPoints >= prize.cost &&
                  userData?.prizesClaimedCount < 4
                    ? 'bg-accent text-white hover:bg-accent/90'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {userClaims.includes(prize.id)
                  ? 'Already Claimed'
                  : prize.redeemed >= prize.totalAvailable
                  ? 'Sold Out'
                  : !prize.inStock
                  ? 'Out of Stock'
                  : 'Claim Prize'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
