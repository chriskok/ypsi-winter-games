'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import Navbar from '@/components/Navbar';

type TabType = 'codes' | 'badges' | 'prizes' | 'users';

export default function Admin() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<TabType>('codes');

  // Codes state
  const [codes, setCodes] = useState<any[]>([]);
  const [newCode, setNewCode] = useState('');
  const [codeValue, setCodeValue] = useState(100);
  const [codeDescription, setCodeDescription] = useState('');
  const [codeBadgeId, setCodeBadgeId] = useState('');
  const [codeHint, setCodeHint] = useState('');
  const [codeOrder, setCodeOrder] = useState(1);

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<any>(null);

  // Badges state
  const [badges, setBadges] = useState<any[]>([]);
  const [newBadgeName, setNewBadgeName] = useState('');
  const [newBadgeDescription, setNewBadgeDescription] = useState('');
  const [newBadgeBonus, setNewBadgeBonus] = useState(200);

  // Prizes state
  const [prizes, setPrizes] = useState<any[]>([]);
  const [newPrizeName, setNewPrizeName] = useState('');
  const [newPrizeCost, setNewPrizeCost] = useState(500);
  const [newPrizeDescription, setNewPrizeDescription] = useState('');
  const [newPrizeIcon, setNewPrizeIcon] = useState('gift');
  const [newPrizeTotalAvailable, setNewPrizeTotalAvailable] = useState(50);
  const [newPrizeRedeemed, setNewPrizeRedeemed] = useState(0);

  // Prize edit modal state
  const [isPrizeEditModalOpen, setIsPrizeEditModalOpen] = useState(false);
  const [editingPrize, setEditingPrize] = useState<any>(null);

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

        await Promise.all([fetchCodes(), fetchBadges(), fetchPrizes(), fetchUsers()]);
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

  interface Code {
    id: string;
    badgeId: string;
    // add other fields if needed
  }

  interface Badge {
    id: string;
    name: string;
    description: string;
    bonusPoints: number;
    active: boolean;
    actualCodeCount: number;
  }

  const fetchBadges = async () => {
    const snapshot = await getDocs(collection(db, 'badges'));
    const badgesData: Badge[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Badge, "id" | "actualCodeCount">),
      actualCodeCount: 0,
    }));

    const codesSnapshot = await getDocs(collection(db, 'codes'));
    const allCodes: Code[] = codesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Code, "id">),
    }));

    const badgesWithCount = badgesData.map((badge) => ({
      ...badge,
      actualCodeCount: allCodes.filter((code) => code.badgeId === badge.id).length,
    }));

    setBadges(badgesWithCount);
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
        badgeId: codeBadgeId || null,
        hint: codeHint || '',
        order: codeOrder,
        active: true,
      });

      setMessage(`Code ${codeUpper} added successfully!`);
      setNewCode('');
      setCodeValue(100);
      setCodeDescription('');
      setCodeBadgeId('');
      setCodeHint('');
      setCodeOrder(1);
      await fetchCodes();
      await fetchBadges();
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
      await fetchBadges();
      setMessage(`Code ${codeId} deleted`);
    } catch (err) {
      setMessage('Error deleting code');
    }
  };

  const handleOpenEditModal = (code: any) => {
    setEditingCode({
      id: code.id,
      value: code.value,
      description: code.description || '',
      badgeId: code.badgeId || '',
      hint: code.hint || '',
      order: code.order || 1,
      active: code.active,
    });
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingCode(null);
  };

  const handleSaveEditCode = async () => {
    if (!editingCode) return;
    setMessage('');

    try {
      await updateDoc(doc(db, 'codes', editingCode.id), {
        value: editingCode.value,
        description: editingCode.description,
        badgeId: editingCode.badgeId || null,
        hint: editingCode.hint,
        order: editingCode.order,
        active: editingCode.active,
      });

      setMessage(`Code ${editingCode.id} updated successfully!`);
      await fetchCodes();
      await fetchBadges();
      handleCloseEditModal();
    } catch (err) {
      setMessage('Error updating code');
    }
  };

  // Badge management
  const handleAddBadge = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    try {
      const badgeId = newBadgeName.toLowerCase().replace(/\s+/g, '-');
      const badgeDoc = await getDoc(doc(db, 'badges', badgeId));
      if (badgeDoc.exists()) {
        setMessage('Badge with this name already exists');
        return;
      }

      await setDoc(doc(db, 'badges', badgeId), {
        name: newBadgeName,
        description: newBadgeDescription,
        bonusPoints: newBadgeBonus,
        active: true,
      });

      setMessage(`Badge "${newBadgeName}" created successfully!`);
      setNewBadgeName('');
      setNewBadgeDescription('');
      setNewBadgeBonus(200);
      await fetchBadges();
    } catch (err) {
      setMessage('Error creating badge');
    }
  };

  const handleToggleBadge = async (badgeId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'badges', badgeId), { active: !currentStatus });
      await fetchBadges();
    } catch (err) {
      setMessage('Error updating badge');
    }
  };

  const handleDeleteBadge = async (badgeId: string) => {
    if (!confirm(`Delete this badge? Codes will remain but will no longer be associated with this badge.`)) return;
    try {
      await deleteDoc(doc(db, 'badges', badgeId));
      // Also remove badge association from codes
      const badgeCodes = codes.filter((code) => code.badgeId === badgeId);
      for (const code of badgeCodes) {
        await updateDoc(doc(db, 'codes', code.id), { badgeId: null });
      }
      await fetchBadges();
      await fetchCodes();
      setMessage('Badge deleted');
    } catch (err) {
      setMessage('Error deleting badge');
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
        icon: newPrizeIcon,
        inStock: true,
        totalAvailable: newPrizeTotalAvailable,
        redeemed: newPrizeRedeemed,
      });

      setMessage(`Prize ${newPrizeName} added!`);
      setNewPrizeName('');
      setNewPrizeCost(500);
      setNewPrizeDescription('');
      setNewPrizeIcon('gift');
      setNewPrizeTotalAvailable(50);
      setNewPrizeRedeemed(0);
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

  const handleOpenPrizeEditModal = (prize: any) => {
    setEditingPrize({
      id: prize.id,
      name: prize.name,
      cost: prize.cost,
      description: prize.description || '',
      icon: prize.icon || 'gift',
      inStock: prize.inStock,
      totalAvailable: prize.totalAvailable || 0,
      redeemed: prize.redeemed || 0,
    });
    setIsPrizeEditModalOpen(true);
  };

  const handleClosePrizeEditModal = () => {
    setIsPrizeEditModalOpen(false);
    setEditingPrize(null);
  };

  const handleSaveEditPrize = async () => {
    if (!editingPrize) return;
    setMessage('');

    try {
      await updateDoc(doc(db, 'prizes', editingPrize.id), {
        name: editingPrize.name,
        cost: editingPrize.cost,
        description: editingPrize.description,
        icon: editingPrize.icon || 'gift',
        inStock: editingPrize.inStock,
        totalAvailable: editingPrize.totalAvailable,
        redeemed: editingPrize.redeemed,
      });

      setMessage(`Prize ${editingPrize.name} updated successfully!`);
      await fetchPrizes();
      handleClosePrizeEditModal();
    } catch (err) {
      setMessage('Error updating prize');
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar userData={userData} currentPage="admin" />

      <div className="container mx-auto p-4 sm:p-8 max-w-6xl flex-1">
        <h2 className="text-3xl font-bold mb-6">Admin Panel</h2>

        {/* Tabs */}
        <div className="flex gap-2 sm:gap-4 mb-6 border-b overflow-x-auto">
          <button
            onClick={() => setActiveTab('codes')}
            className={`px-4 py-2 font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'codes' ? 'border-primary text-accent' : 'border-transparent text-gray-500 hover:text-accent'
            }`}
          >
            Codes
          </button>
          <button
            onClick={() => setActiveTab('badges')}
            className={`px-4 py-2 font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'badges' ? 'border-primary text-accent' : 'border-transparent text-gray-500 hover:text-accent'
            }`}
          >
            Badges
          </button>
          <button
            onClick={() => setActiveTab('prizes')}
            className={`px-4 py-2 font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'prizes' ? 'border-primary text-accent' : 'border-transparent text-gray-500 hover:text-accent'
            }`}
          >
            Prizes
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 font-semibold border-b-2 transition-colors whitespace-nowrap ${
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
                <div className="grid md:grid-cols-3 gap-4">
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
                  <div>
                    <label className="block text-sm font-medium mb-1">Badge</label>
                    <select
                      value={codeBadgeId}
                      onChange={(e) => setCodeBadgeId(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">None (Standalone)</option>
                      {badges.map((badge) => (
                        <option key={badge.id} value={badge.id}>
                          {badge.name}
                        </option>
                      ))}
                    </select>
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
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Hint (for badge codes)</label>
                    <input
                      type="text"
                      value={codeHint}
                      onChange={(e) => setCodeHint(e.target.value)}
                      placeholder="Explore the colorful world of children's literature"
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Order (for badge codes)</label>
                    <input
                      type="number"
                      value={codeOrder}
                      onChange={(e) => setCodeOrder(Number(e.target.value))}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      min={1}
                    />
                  </div>
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
                      <th className="p-4 text-left">Badge</th>
                      <th className="p-4 text-left">Hint</th>
                      <th className="p-4 text-left">Value</th>
                      <th className="p-4 text-left">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {codes.map((code) => (
                      <tr key={code.id} className="border-b hover:bg-gray-50">
                        <td className="p-4 font-mono font-semibold">{code.id}</td>
                        <td className="p-4 text-sm">
                          {code.badgeId ? (
                            <span className="px-2 py-1 bg-primary/20 text-accent rounded text-xs">
                              {badges.find((b) => b.id === code.badgeId)?.name || code.badgeId}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="p-4 text-gray-600 text-sm max-w-xs truncate">{code.hint || '-'}</td>
                        <td className="p-4">{code.value} pts</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-sm ${code.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {code.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => handleOpenEditModal(code)}
                            className="px-3 py-1 bg-primary/20 text-accent rounded hover:bg-primary/30 text-sm font-medium"
                          >
                            Edit
                          </button>
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

        {/* Badges Tab */}
        {activeTab === 'badges' && (
          <>
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h3 className="text-xl font-bold mb-4">Create New Badge</h3>
              <form onSubmit={handleAddBadge} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Badge Name</label>
                    <input
                      type="text"
                      value={newBadgeName}
                      onChange={(e) => setNewBadgeName(e.target.value)}
                      placeholder="Ypsi District Library - Whittaker Explorer"
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Bonus Points</label>
                    <input
                      type="number"
                      value={newBadgeBonus}
                      onChange={(e) => setNewBadgeBonus(Number(e.target.value))}
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
                    value={newBadgeDescription}
                    onChange={(e) => setNewBadgeDescription(e.target.value)}
                    placeholder="Explore every corner of the Whittaker branch library"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                <button type="submit" className="w-full bg-accent text-white py-2 rounded-lg font-semibold hover:bg-accent/90">
                  Create Badge
                </button>
              </form>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6 border-b">
                <h3 className="text-xl font-bold">Existing Badges ({badges.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-4 text-left">Badge Name</th>
                      <th className="p-4 text-left">Description</th>
                      <th className="p-4 text-left">Codes</th>
                      <th className="p-4 text-left">Bonus Points</th>
                      <th className="p-4 text-left">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {badges.map((badge) => (
                      <tr key={badge.id} className="border-b hover:bg-gray-50">
                        <td className="p-4 font-semibold">{badge.name}</td>
                        <td className="p-4 text-gray-600 text-sm">{badge.description}</td>
                        <td className="p-4 text-center">
                          <span className="px-2 py-1 bg-primary/20 text-accent rounded text-sm font-semibold">
                            {badge.actualCodeCount || 0}
                          </span>
                        </td>
                        <td className="p-4">+{badge.bonusPoints} pts</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-sm ${badge.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {badge.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => handleToggleBadge(badge.id, badge.active)}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
                          >
                            {badge.active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDeleteBadge(badge.id)}
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
                <div>
                  <label className="block text-sm font-medium mb-1">Icon</label>
                  <input
                    type="text"
                    value={newPrizeIcon}
                    onChange={(e) => setNewPrizeIcon(e.target.value)}
                    placeholder="gift, trophy, award, star, etc."
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter any Bootstrap icon name from <a href="https://icons.getbootstrap.com/" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">icons.getbootstrap.com</a>
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <i className={`bi bi-${newPrizeIcon} text-4xl text-accent`}></i>
                    <span className="text-sm text-gray-500">Preview</span>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Total Available</label>
                    <input
                      type="number"
                      value={newPrizeTotalAvailable}
                      onChange={(e) => setNewPrizeTotalAvailable(Number(e.target.value))}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                      min={1}
                    />
                    <p className="text-xs text-gray-500 mt-1">How many of this prize are available</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Already Redeemed</label>
                    <input
                      type="number"
                      value={newPrizeRedeemed}
                      onChange={(e) => setNewPrizeRedeemed(Number(e.target.value))}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                      min={0}
                    />
                    <p className="text-xs text-gray-500 mt-1">Usually 0 for new prizes</p>
                  </div>
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
                      <th className="p-4 text-left">Inventory</th>
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
                        <td className="p-4">
                          <div className="text-sm">
                            <span className="font-semibold">{prize.redeemed || 0}</span>
                            <span className="text-gray-500"> / </span>
                            <span>{prize.totalAvailable || 0}</span>
                          </div>
                          {(prize.redeemed || 0) >= (prize.totalAvailable || 0) && (
                            <span className="text-xs text-red-600 font-semibold">Sold Out</span>
                          )}
                        </td>
                        <td className="p-4">{prize.cost} pts</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-sm ${prize.inStock ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {prize.inStock ? 'In Stock' : 'Out of Stock'}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => handleOpenPrizeEditModal(prize)}
                            className="px-3 py-1 bg-primary/20 text-accent rounded hover:bg-primary/30 text-sm font-medium"
                          >
                            Edit
                          </button>
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

        {/* Edit Code Modal */}
        {isEditModalOpen && editingCode && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <h3 className="text-2xl font-bold text-accent">Edit Code: {editingCode.id}</h3>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Points Value</label>
                    <input
                      type="number"
                      value={editingCode.value}
                      onChange={(e) => setEditingCode({ ...editingCode, value: Number(e.target.value) })}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      min={1}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Badge</label>
                    <select
                      value={editingCode.badgeId}
                      onChange={(e) => setEditingCode({ ...editingCode, badgeId: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">None (Standalone)</option>
                      {badges.map((badge) => (
                        <option key={badge.id} value={badge.id}>
                          {badge.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <input
                    type="text"
                    value={editingCode.description}
                    onChange={(e) => setEditingCode({ ...editingCode, description: e.target.value })}
                    placeholder="Found at the Depot Town sign"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Hint (for badge codes)</label>
                  <textarea
                    value={editingCode.hint}
                    onChange={(e) => setEditingCode({ ...editingCode, hint: e.target.value })}
                    placeholder="Explore the colorful world of children's literature"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    rows={3}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Order (for badge codes)</label>
                    <input
                      type="number"
                      value={editingCode.order}
                      onChange={(e) => setEditingCode({ ...editingCode, order: Number(e.target.value) })}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      min={1}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <select
                      value={editingCode.active ? 'active' : 'inactive'}
                      onChange={(e) => setEditingCode({ ...editingCode, active: e.target.value === 'active' })}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t flex gap-3 justify-end">
                <button
                  onClick={handleCloseEditModal}
                  className="px-6 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEditCode}
                  className="px-6 py-2 bg-accent text-white rounded-lg font-semibold hover:bg-accent/90"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Prize Modal */}
        {isPrizeEditModalOpen && editingPrize && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <h3 className="text-2xl font-bold text-accent">Edit Prize: {editingPrize.name}</h3>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Prize Name</label>
                  <input
                    type="text"
                    value={editingPrize.name}
                    onChange={(e) => setEditingPrize({ ...editingPrize, name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Point Cost</label>
                  <input
                    type="number"
                    value={editingPrize.cost}
                    onChange={(e) => setEditingPrize({ ...editingPrize, cost: Number(e.target.value) })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    min={1}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={editingPrize.description}
                    onChange={(e) => setEditingPrize({ ...editingPrize, description: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Icon</label>
                  <input
                    type="text"
                    value={editingPrize.icon || 'gift'}
                    onChange={(e) => setEditingPrize({ ...editingPrize, icon: e.target.value })}
                    placeholder="gift, trophy, award, star, etc."
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter any Bootstrap icon name from <a href="https://icons.getbootstrap.com/" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">icons.getbootstrap.com</a>
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <i className={`bi bi-${editingPrize.icon || 'gift'} text-4xl text-accent`}></i>
                    <span className="text-sm text-gray-500">Preview</span>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Total Available</label>
                    <input
                      type="number"
                      value={editingPrize.totalAvailable}
                      onChange={(e) => setEditingPrize({ ...editingPrize, totalAvailable: Number(e.target.value) })}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      min={1}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Already Redeemed</label>
                    <input
                      type="number"
                      value={editingPrize.redeemed}
                      onChange={(e) => setEditingPrize({ ...editingPrize, redeemed: Number(e.target.value) })}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      min={0}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Stock Status</label>
                  <select
                    value={editingPrize.inStock ? 'in-stock' : 'out-of-stock'}
                    onChange={(e) => setEditingPrize({ ...editingPrize, inStock: e.target.value === 'in-stock' })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="in-stock">In Stock</option>
                    <option value="out-of-stock">Out of Stock</option>
                  </select>
                </div>
              </div>

              <div className="p-6 border-t flex gap-3 justify-end">
                <button
                  onClick={handleClosePrizeEditModal}
                  className="px-6 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEditPrize}
                  className="px-6 py-2 bg-accent text-white rounded-lg font-semibold hover:bg-accent/90"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
