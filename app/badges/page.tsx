'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import Navbar from '@/components/Navbar';

interface Badge {
  id: string;
  name: string;
  description: string;
  bonusPoints: number;
  active: boolean;
}

interface Code {
  id: string;
  badgeId: string | null;
  hint: string;
  order: number;
  value: number;
}

interface BadgeProgress {
  badge: Badge;
  codes: Code[];
  redeemedCodes: string[];
  completed: boolean;
}

export default function Badges() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [badgeProgress, setBadgeProgress] = useState<BadgeProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedBadges, setExpandedBadges] = useState<Set<string>>(new Set());
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
        await fetchBadgeProgress(currentUser.uid);
        setLoading(false);
      } else {
        setLoading(false);
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchBadgeProgress = async (userId: string) => {
    try {
      // Fetch all active badges
      const badgesSnapshot = await getDocs(collection(db, 'badges'));
      const badges = badgesSnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as Badge))
        .filter((badge) => badge.active);

      // Fetch all codes
      const codesSnapshot = await getDocs(collection(db, 'codes'));
      const allCodes = codesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Code));

      // Fetch user's redemptions (query only user's redemptions to satisfy security rules)
      const redemptionsQuery = query(
        collection(db, 'redemptions'),
        where('userId', '==', userId)
      );
      const redemptionsSnapshot = await getDocs(redemptionsQuery);
      const userRedemptions = redemptionsSnapshot.docs
        .map((doc) => doc.data().codeId);

      // Build progress for each badge
      const progress: BadgeProgress[] = badges.map((badge) => {
        const badgeCodes = allCodes
          .filter((code) => code.badgeId === badge.id)
          .sort((a, b) => (a.order || 0) - (b.order || 0));

        const redeemedCodes = badgeCodes
          .filter((code) => userRedemptions.includes(code.id))
          .map((code) => code.id);

        return {
          badge,
          codes: badgeCodes,
          redeemedCodes,
          completed: badgeCodes.length > 0 && redeemedCodes.length === badgeCodes.length,
        };
      });

      setBadgeProgress(progress);
    } catch (err) {
      console.error('Error fetching badge progress:', err);
    }
  };

  const toggleBadge = (badgeId: string) => {
    setExpandedBadges((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(badgeId)) {
        newSet.delete(badgeId);
      } else {
        newSet.add(badgeId);
      }
      return newSet;
    });
  };

  if (loading || !userData) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userData={userData} />

      <div className="container mx-auto p-8 max-w-4xl">
        <h2 className="text-3xl font-bold mb-2">Badges</h2>
        <p className="text-gray-600 mb-8">
          Complete badge challenges to earn bonus points! Find all codes in a badge to unlock the reward.
        </p>

        {badgeProgress.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">No badges available yet. Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {badgeProgress.map((progress) => (
              <div
                key={progress.badge.id}
                className={`bg-white rounded-lg shadow overflow-hidden ${
                  progress.completed ? 'border-2 border-primary' : ''
                }`}
              >
                <button
                  onClick={() => toggleBadge(progress.badge.id)}
                  className="w-full p-6 border-b bg-gradient-to-r from-accent/10 to-primary/10 text-left hover:from-accent/15 hover:to-primary/15 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-accent flex items-center gap-2">
                        {progress.badge.name}
                        {progress.completed && (
                          <span className="text-sm bg-primary text-white px-3 py-1 rounded-full">
                            ✓ Completed!
                          </span>
                        )}
                      </h3>
                      <p className="text-gray-600 mt-1">{progress.badge.description}</p>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <span className="text-2xl text-accent">
                        {expandedBadges.has(progress.badge.id) ? '▼' : '▶'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-4">
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-semibold">
                          Progress: {progress.redeemedCodes.length}/{progress.codes.length}
                        </span>
                        <span className="text-primary font-bold">
                          +{progress.badge.bonusPoints} bonus pts
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-primary h-3 rounded-full transition-all"
                          style={{
                            width: `${
                              progress.codes.length > 0
                                ? (progress.redeemedCodes.length / progress.codes.length) * 100
                                : 0
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </button>

                {expandedBadges.has(progress.badge.id) && (
                  <div className="p-6">
                    <h4 className="font-bold text-lg mb-4">Locations to Find:</h4>
                    <div className="space-y-3">
                      {progress.codes.map((code, index) => {
                        const isRedeemed = progress.redeemedCodes.includes(code.id);
                        return (
                          <div
                            key={code.id}
                            className={`flex items-start gap-3 p-3 rounded-lg ${
                              isRedeemed ? 'bg-green-50' : 'bg-gray-50'
                            }`}
                          >
                            <div className="flex-shrink-0 mt-1">
                              {isRedeemed ? (
                                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-sm font-bold">✓</span>
                                </div>
                              ) : (
                                <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                                  <span className="text-gray-600 text-sm font-bold">{index + 1}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className={`${isRedeemed ? 'text-green-800 font-medium' : 'text-gray-700'}`}>
                                {code.hint || 'No hint available'}
                              </p>
                              {isRedeemed && (
                                <p className="text-green-600 text-sm mt-1">
                                  Found! (+{code.value} pts)
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {progress.completed && (
                      <div className="mt-6 p-4 bg-primary/10 border-l-4 border-primary rounded">
                        <p className="font-bold text-accent">
                          🎉 Badge Complete! You earned +{progress.badge.bonusPoints} bonus points!
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
