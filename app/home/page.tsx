'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, increment, collection, getDocs, query, where } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import Navbar from '@/components/Navbar';

function HomeContent() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasProcessedUrl = useRef(false);

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

  // Auto-redeem code from URL parameter (QR code support)
  useEffect(() => {
    const urlCode = searchParams.get('code');
    if (urlCode && user && userData && !loading && !hasProcessedUrl.current) {
      hasProcessedUrl.current = true;
      setCode(urlCode.toUpperCase());
      // Auto-submit after a brief delay to show the code
      setTimeout(() => {
        handleRedeemCode(urlCode.toUpperCase());
      }, 500);
      // Clear URL parameter
      router.replace('/home');
    }
  }, [user, userData, loading]);

  const handleRedeemCode = async (codeToRedeem: string) => {
    setMessage('');
    const codeUpper = codeToRedeem.toUpperCase().trim();

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

      const codeData = codeDoc.data();
      let totalPoints = codeData.value;
      let badgeCompleted = false;
      let badgeName = '';
      let bonusPoints = 0;

      // Save the redemption
      await setDoc(doc(db, 'redemptions', redemptionId), {
        userId: user.uid,
        codeId: codeUpper,
        timestamp: new Date(),
      });

      // Check if this code is part of a badge
      if (codeData.badgeId) {
        const badgeDoc = await getDoc(doc(db, 'badges', codeData.badgeId));
        if (badgeDoc.exists()) {
          const badgeData = badgeDoc.data();

          // Get all codes for this badge
          const allCodesSnapshot = await getDocs(collection(db, 'codes'));
          const badgeCodes = allCodesSnapshot.docs
            .filter((doc) => doc.data().badgeId === codeData.badgeId)
            .map((doc) => doc.id);

          // Get all user's redemptions for this badge
          const redemptionsQuery = query(
            collection(db, 'redemptions'),
            where('userId', '==', user.uid)
          );
          const redemptionsSnapshot = await getDocs(redemptionsQuery);
          const userBadgeRedemptions = redemptionsSnapshot.docs
            .map((doc) => doc.data().codeId)
            .filter((codeId) => badgeCodes.includes(codeId));

          // Check if badge is now complete (including the code we just redeemed)
          if (badgeCodes.length > 0 && userBadgeRedemptions.length === badgeCodes.length) {
            badgeCompleted = true;
            badgeName = badgeData.name;
            bonusPoints = badgeData.bonusPoints;
            totalPoints += bonusPoints;
          }
        }
      }

      // Update user's total points
      await setDoc(
        doc(db, 'users', user.uid),
        { totalPoints: increment(totalPoints) },
        { merge: true }
      );

      // Build success message
      let successMessage = `Success! +${codeData.value} points`;

      // Add code description if it exists
      if (codeData.description) {
        successMessage += `\n${codeData.description}`;
      }

      // Add badge completion if applicable
      if (badgeCompleted) {
        successMessage += `\n\n🎉 Badge "${badgeName}" complete! +${bonusPoints} bonus points!`;
      }

      setMessage(successMessage);
      setCode('');

      const updatedUserDoc = await getDoc(doc(db, 'users', user.uid));
      setUserData(updatedUserDoc.data());
    } catch (err) {
      console.error('Error redeeming code:', err);
      setMessage('Error redeeming code');
    }
  };

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleRedeemCode(code);
  };

  if (loading || !userData) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar userData={userData} />

      <div className="container mx-auto p-4 sm:p-8 max-w-2xl flex-1">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2">Welcome, {userData.displayName}!</h2>
        <p className="text-gray-600 mb-6 sm:mb-8">Find codes around Ypsilanti and redeem them here.</p>

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
            <div className={`mt-4 p-4 rounded-lg ${message.includes('Success') ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <p className={`text-center font-semibold whitespace-pre-line ${message.includes('Success') ? 'text-green-800' : 'text-red-800'}`}>
                {message}
              </p>
            </div>
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

export default function Dashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
