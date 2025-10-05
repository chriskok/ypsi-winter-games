'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, increment } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import Navbar from '@/components/Navbar';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [code, setCode] = useState('');
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
        } else {
          console.error('User document not found');
        }
        setLoading(false);
      } else {
        setLoading(false);
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, []);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    const codeUpper = code.toUpperCase().trim();

    try {
      const codeDoc = await getDoc(doc(db, 'codes', codeUpper));
      if (!codeDoc.exists() || !codeDoc.data().active) {
        setMessage('Invalid code');
        return;
      }

      const redemptionId = `${user.uid}_${codeUpper}`;
      const redemptionDoc = await getDoc(doc(db, 'redemptions', redemptionId));
      if (redemptionDoc.exists()) {
        setMessage('Already redeemed');
        return;
      }

      await setDoc(doc(db, 'redemptions', redemptionId), {
        userId: user.uid,
        codeId: codeUpper,
        timestamp: new Date(),
      });

      await setDoc(
        doc(db, 'users', user.uid),
        { totalPoints: increment(codeDoc.data().value) },
        { merge: true }
      );

      setMessage(`Success! +${codeDoc.data().value} points`);
      setCode('');

      const updatedUserDoc = await getDoc(doc(db, 'users', user.uid));
      setUserData(updatedUserDoc.data());
    } catch (err) {
      setMessage('Error redeeming code');
    }
  };

  if (loading || !userData) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userData={userData} />

      <div className="container mx-auto p-8 max-w-2xl">
        <h2 className="text-3xl font-bold mb-2">Welcome, {userData.displayName}!</h2>
        <p className="text-gray-600 mb-8">Find codes around Ypsilanti and redeem them here.</p>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-xl font-bold mb-4">Redeem Code</h3>
          <form onSubmit={handleRedeem} className="space-y-4">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter code"
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary uppercase"
              required
            />
            <button
              type="submit"
              className="w-full bg-accent text-white py-3 rounded-lg font-semibold hover:bg-accent/90"
            >
              Redeem
            </button>
          </form>
          {message && (
            <p className={`mt-4 text-center font-semibold ${message.includes('Success') ? 'text-green-600' : 'text-red-600'}`}>
              {message}
            </p>
          )}
        </div>

        <div className="bg-primary/10 border-l-4 border-primary p-4">
          <p className="font-semibold">How it works:</p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
            <li>Find physical codes around Ypsilanti</li>
            <li>Each code is worth 100 points</li>
            <li>Redeem points for prizes in the Prize Catalog</li>
            <li>Each code can only be redeemed once per user</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
