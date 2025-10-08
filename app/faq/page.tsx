'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import Navbar from '@/components/Navbar';

export default function FAQ() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
        setLoading(false);
      } else {
        setLoading(false);
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, []);

  const faqItems = [
    {
      question: "Who are we?",
      answer: "We're a group of designers in the Ypsi area who love our community and wanted to create a fun way for people to explore the town this winter!"
    },
    {
      question: "How did this come about?",
      answer: "We were inspired by the Ann Arbor Summer Games and how they brought the community together in such a cool way. We wanted to create something similar for Ypsilanti - a fun excuse to get outside, discover local spots, and connect with neighbors during the winter months!"
    },
    {
      question: "Are we associated with the Ypsilanti District Library?",
      answer: "We're not officially partnering with YDL this year, but we've made contact with them and love what they do for our community! YDL actually runs their own awesome reading challenges throughout the year (Summer, Winter, and Spring), so definitely check those out! You can find more info in their newsletter, The Loop."
    },
    {
      question: "When does this run?",
      answer: "The Ypsi Winter Games run from January 15, 2026 to March 15, 2026. Bundle up and happy hunting!"
    },
    {
      question: "How do you play?",
      answer: "Check out the Badges page to see all available challenges! Each badge has a description with hints about where to find its code. Once you find a code, enter it on the home page to earn 100 points. Redeem your points for prizes! Each code can only be redeemed once per player."
    }
  ];

  const toggleQuestion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  if (loading || !userData) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar userData={userData} />

      <div className="container mx-auto p-4 sm:p-8 max-w-3xl flex-1">
        <h2 className="text-2xl sm:text-3xl font-bold mb-8">Frequently Asked Questions</h2>

        <div className="space-y-4">
          {faqItems.map((item, index) => (
            <div key={index} className="bg-white rounded-lg shadow overflow-hidden">
              <button
                onClick={() => toggleQuestion(index)}
                className="w-full p-6 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
              >
                <h3 className="text-xl font-bold text-accent pr-4">{item.question}</h3>
                <svg
                  className={`w-6 h-6 text-accent flex-shrink-0 transition-transform ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openIndex === index && (
                <div className="px-6 pb-6">
                  <p className="text-gray-700 leading-relaxed">{item.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
