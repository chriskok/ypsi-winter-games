'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, updatePassword, updateProfile } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import Navbar from '@/components/Navbar';

export default function Settings() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [displayName, setDisplayName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
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
          setDisplayName(data.displayName || '');
        }
        setLoading(false);
      } else {
        setLoading(false);
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleUpdateDisplayName = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    if (!displayName.trim()) {
      setMessage('Display name cannot be empty');
      return;
    }

    try {
      // Update Firebase Auth profile
      if (user) {
        await updateProfile(user, { displayName: displayName.trim() });
      }

      // Update Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: displayName.trim(),
      });

      setMessage('Display name updated successfully!');

      // Refresh user data
      const updatedUserDoc = await getDoc(doc(db, 'users', user.uid));
      setUserData(updatedUserDoc.data());
    } catch (err: any) {
      console.error('Error updating display name:', err);
      setMessage('Error updating display name');
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    if (newPassword.length < 6) {
      setMessage('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }

    try {
      if (user) {
        await updatePassword(user, newPassword);
      }

      setMessage('Password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Error updating password:', err);

      // Check if user needs to reauthenticate
      if (err.code === 'auth/requires-recent-login') {
        setMessage('Please log out and log back in before changing your password');
      } else {
        setMessage('Error updating password');
      }
    }
  };

  if (loading || !userData) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar userData={userData} />

      <div className="container mx-auto p-4 sm:p-8 max-w-2xl flex-1">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2">Settings</h2>
        <p className="text-gray-600 mb-6 sm:mb-8">Manage your account settings</p>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.includes('successfully') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message}
          </div>
        )}

        {/* Update Display Name */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-xl font-bold mb-4">Change Display Name</h3>
          <form onSubmit={handleUpdateDisplayName} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-accent text-white py-3 rounded-lg font-semibold hover:bg-accent/90"
            >
              Update Display Name
            </button>
          </form>
        </div>

        {/* Update Password */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold mb-4">Change Password</h3>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
                minLength={6}
              />
            </div>
            <button
              type="submit"
              className="w-full bg-accent text-white py-3 rounded-lg font-semibold hover:bg-accent/90"
            >
              Update Password
            </button>
          </form>
        </div>

        <div className="mt-6 bg-primary/10 border-l-4 border-primary p-4">
          <p className="text-sm text-gray-700">
            <strong>Note:</strong> If you've been logged in for a while, you may need to log out and log back in before changing your password for security reasons.
          </p>
        </div>
      </div>
    </div>
  );
}
