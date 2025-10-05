'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import Navbar from '@/components/Navbar';

export default function Admin() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [codes, setCodes] = useState<any[]>([]);
  const [newCode, setNewCode] = useState('');
  const [codeValue, setCodeValue] = useState(100);
  const [codeDescription, setCodeDescription] = useState('');
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

        await fetchCodes();
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
    const codesData = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setCodes(codesData);
  };

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
      await setDoc(
        doc(db, 'codes', codeId),
        { active: !currentStatus },
        { merge: true }
      );
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

  if (loading || !userData) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userData={userData} currentPage="admin" />

      <div className="container mx-auto p-8 max-w-4xl">
        <h2 className="text-3xl font-bold mb-6">Code Management</h2>

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
            <button
              type="submit"
              className="w-full bg-accent text-white py-2 rounded-lg font-semibold hover:bg-accent/90"
            >
              Add Code
            </button>
          </form>
          {message && (
            <p className={`mt-4 text-center font-semibold ${message.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>
              {message}
            </p>
          )}
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
      </div>
    </div>
  );
}
