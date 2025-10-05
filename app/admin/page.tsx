'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import Navbar from '@/components/Navbar';

type TabType = 'codes' | 'prizes' | 'users';

export default function Admin() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<TabType>('codes');

  // Codes state
  const [codes, setCodes] = useState<any[]>([]);
  const [newCode, setNewCode] = useState('');
  const [codeValue, setCodeValue] = useState(100);
  const [codeDescription, setCodeDescription] = useState('');

  // Prizes state
  const [prizes, setPrizes] = useState<any[]>([]);
  const [newPrizeName, setNewPrizeName] = useState('');
  const [newPrizeCost, setNewPrizeCost] = useState(500);
  const [newPrizeDescription, setNewPrizeDescription] = useState('');

  // Users state
  const [users, setUsers] = useState<any[]>([]);

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        const data = userDoc.data();
        setUserData(data);

        if (!data?.isAdmin) {
          setLoading(false);
          router.push('/home');
          return;
        }

        await Promise.all([fetchCodes(), fetchPrizes(), fetchUsers()]);
        setLoading(false);
      } else {
        setLoading(false);
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchCodes = async () => {
    const snapshot = await getDocs(collection(db, 'codes'));
    setCodes(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  };

  const fetchPrizes = async () => {
    const snapshot = await getDocs(collection(db, 'prizes'));
    setPrizes(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  };

  const fetchUsers = async () => {
    const snapshot = await getDocs(collection(db, 'users'));
    setUsers(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  };

  // Code management
  const handleAddCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    const codeUpper = newCode.toUpperCase().trim();

    if (!codeUpper) {
      setMessage('Please enter a code');
      return;
    }

    try {
      const codeDoc = await getDoc(doc(db, 'codes', codeUpper));
      if (codeDoc.exists()) {
        setMessage('Code already exists');
        return;
      }

      await setDoc(doc(db, 'codes', codeUpper), {
        value: codeValue,
        description: codeDescription,
        active: true,
      });

      setMessage(`Code ${codeUpper} added successfully!`);
      setNewCode('');
      setCodeValue(100);
      setCodeDescription('');
      await fetchCodes();
    } catch (err) {
      setMessage('Error adding code');
    }
  };

  const handleToggleCode = async (codeId: string, currentStatus: boolean) => {
    try {
      await setDoc(doc(db, 'codes', codeId), { active: !currentStatus }, { merge: true });
      await fetchCodes();
    } catch (err) {
      setMessage('Error updating code');
    }
  };

  const handleDeleteCode = async (codeId: string) => {
    if (!confirm(`Delete code ${codeId}?`)) return;
    try {
      await deleteDoc(doc(db, 'codes', codeId));
      await fetchCodes();
      setMessage(`Code ${codeId} deleted`);
    } catch (err) {
      setMessage('Error deleting code');
    }
  };

  // Prize management
  const handleAddPrize = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    try {
      const prizeId = newPrizeName.toLowerCase().replace(/\s+/g, '-');
      await setDoc(doc(db, 'prizes', prizeId), {
        name: newPrizeName,
        cost: newPrizeCost,
        description: newPrizeDescription,
        inStock: true,
      });

      setMessage(`Prize ${newPrizeName} added!`);
      setNewPrizeName('');
      setNewPrizeCost(500);
      setNewPrizeDescription('');
      await fetchPrizes();
    } catch (err) {
      setMessage('Error adding prize');
    }
  };

  const handleTogglePrize = async (prizeId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'prizes', prizeId), { inStock: !currentStatus });
      await fetchPrizes();
    } catch (err) {
      setMessage('Error updating prize');
    }
  };

  const handleDeletePrize = async (prizeId: string) => {
    if (!confirm(`Delete this prize?`)) return;
    try {
      await deleteDoc(doc(db, 'prizes', prizeId));
      await fetchPrizes();
      setMessage('Prize deleted');
    } catch (err) {
      setMessage('Error deleting prize');
    }
  };

  // User management
  const handleToggleAdmin = async (userId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'users', userId), { isAdmin: !currentStatus });
      await fetchUsers();
      setMessage('User updated');
    } catch (err) {
      setMessage('Error updating user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Delete this user? This will NOT delete their auth account.')) return;
    try {
      await deleteDoc(doc(db, 'users', userId));
      await fetchUsers();
      setMessage('User deleted from Firestore');
    } catch (err) {
      setMessage('Error deleting user');
    }
  };

  if (loading || !userData) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userData={userData} currentPage="admin" />

      <div className="container mx-auto p-8 max-w-6xl">
        <h2 className="text-3xl font-bold mb-6">Admin Panel</h2>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b">
          <button
            onClick={() => setActiveTab('codes')}
            className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
              activeTab === 'codes' ? 'border-primary text-accent' : 'border-transparent text-gray-500 hover:text-accent'
            }`}
          >
            Codes
          </button>
          <button
            onClick={() => setActiveTab('prizes')}
            className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
              activeTab === 'prizes' ? 'border-primary text-accent' : 'border-transparent text-gray-500 hover:text-accent'
            }`}
          >
            Prizes
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
              activeTab === 'users' ? 'border-primary text-accent' : 'border-transparent text-gray-500 hover:text-accent'
            }`}
          >
            Users
          </button>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.includes('successfully') || message.includes('added') || message.includes('updated') || message.includes('deleted') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message}
          </div>
        )}

        {/* Codes Tab */}
        {activeTab === 'codes' && (
          <>
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h3 className="text-xl font-bold mb-4">Add New Code</h3>
              <form onSubmit={handleAddCode} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Code</label>
                    <input
                      type="text"
                      value={newCode}
                      onChange={(e) => setNewCode(e.target.value)}
                      placeholder="DEPOT01"
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary uppercase"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Points Value</label>
                    <input
                      type="number"
                      value={codeValue}
                      onChange={(e) => setCodeValue(Number(e.target.value))}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                      min={1}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <input
                    type="text"
                    value={codeDescription}
                    onChange={(e) => setCodeDescription(e.target.value)}
                    placeholder="Found at the Depot Town sign"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <button type="submit" className="w-full bg-accent text-white py-2 rounded-lg font-semibold hover:bg-accent/90">
                  Add Code
                </button>
              </form>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6 border-b">
                <h3 className="text-xl font-bold">Existing Codes ({codes.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-4 text-left">Code</th>
                      <th className="p-4 text-left">Description</th>
                      <th className="p-4 text-left">Value</th>
                      <th className="p-4 text-left">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {codes.map((code) => (
                      <tr key={code.id} className="border-b hover:bg-gray-50">
                        <td className="p-4 font-mono font-semibold">{code.id}</td>
                        <td className="p-4 text-gray-600 text-sm">{code.description || '-'}</td>
                        <td className="p-4">{code.value} pts</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-sm ${code.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {code.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => handleToggleCode(code.id, code.active)}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
                          >
                            {code.active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDeleteCode(code.id)}
                            className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Prizes Tab */}
        {activeTab === 'prizes' && (
          <>
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h3 className="text-xl font-bold mb-4">Add New Prize</h3>
              <form onSubmit={handleAddPrize} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Prize Name</label>
                    <input
                      type="text"
                      value={newPrizeName}
                      onChange={(e) => setNewPrizeName(e.target.value)}
                      placeholder="YWG T-Shirt"
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Point Cost</label>
                    <input
                      type="number"
                      value={newPrizeCost}
                      onChange={(e) => setNewPrizeCost(Number(e.target.value))}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                      min={1}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <input
                    type="text"
                    value={newPrizeDescription}
                    onChange={(e) => setNewPrizeDescription(e.target.value)}
                    placeholder="Limited edition winter games shirt"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                <button type="submit" className="w-full bg-accent text-white py-2 rounded-lg font-semibold hover:bg-accent/90">
                  Add Prize
                </button>
              </form>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6 border-b">
                <h3 className="text-xl font-bold">Existing Prizes ({prizes.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-4 text-left">Prize Name</th>
                      <th className="p-4 text-left">Description</th>
                      <th className="p-4 text-left">Cost</th>
                      <th className="p-4 text-left">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prizes.map((prize) => (
                      <tr key={prize.id} className="border-b hover:bg-gray-50">
                        <td className="p-4 font-semibold">{prize.name}</td>
                        <td className="p-4 text-gray-600 text-sm">{prize.description}</td>
                        <td className="p-4">{prize.cost} pts</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-sm ${prize.inStock ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {prize.inStock ? 'In Stock' : 'Out of Stock'}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => handleTogglePrize(prize.id, prize.inStock)}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
                          >
                            {prize.inStock ? 'Mark Out' : 'Mark In'}
                          </button>
                          <button
                            onClick={() => handleDeletePrize(prize.id)}
                            className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b">
              <h3 className="text-xl font-bold">All Users ({users.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-4 text-left">Display Name</th>
                    <th className="p-4 text-left">Email</th>
                    <th className="p-4 text-left">Points</th>
                    <th className="p-4 text-left">Prizes Claimed</th>
                    <th className="p-4 text-left">Admin</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="p-4 font-semibold">{user.displayName}</td>
                      <td className="p-4 text-gray-600 text-sm">{user.email}</td>
                      <td className="p-4">{user.totalPoints || 0}</td>
                      <td className="p-4">{user.prizesClaimedCount || 0}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-sm ${user.isAdmin ? 'bg-primary text-white' : 'bg-gray-100 text-gray-800'}`}>
                          {user.isAdmin ? 'Admin' : 'User'}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handleToggleAdmin(user.id, user.isAdmin)}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
                        >
                          {user.isAdmin ? 'Remove Admin' : 'Make Admin'}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
