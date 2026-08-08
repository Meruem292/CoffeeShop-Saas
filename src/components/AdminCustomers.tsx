import React, { useState } from 'react';
import { UserProfile } from '../types';
import { Search, User, Mail, Calendar, Coins, Edit2, X, Check, Trash2, Filter, ArrowUpDown } from 'lucide-react';
import { useToast } from '../lib/ToastContext';

interface AdminCustomersProps {
  profiles: UserProfile[];
  onUpdateProfile: (uid: string, updates: Partial<UserProfile>) => Promise<void>;
}

export function AdminCustomers({ profiles, onUpdateProfile }: AdminCustomersProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUid, setEditingUid] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Sorting
  const [sortField, setSortField] = useState<'displayName' | 'points' | 'createdAt' | 'lastLoginAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredProfiles = profiles
    .filter(p => 
      p.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.uid.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const valA = a[sortField] || 0;
      const valB = b[sortField] || 0;
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });

  const handleEdit = (profile: UserProfile) => {
    setEditingUid(profile.uid);
    setEditForm({ ...profile });
  };

  const handleSave = async () => {
    if (!editingUid) return;
    setIsSaving(true);
    try {
      await onUpdateProfile(editingUid, editForm);
      setEditingUid(null);
      setEditForm({});
    } catch (err) {
      // Error handled in useFirebase
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">
            Customer <span className="text-amber-500">Management</span>
          </h2>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
            View and manage customer accounts & loyalty points
          </p>
        </div>
        
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
          <input
            type="text"
            placeholder="Search by name, email or UID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2.5 bg-white dark:bg-[#0a0a0c] border border-black/10 dark:border-white/5 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 w-full md:w-80 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#0a0a0c] p-4 rounded-3xl border border-black/10 dark:border-white/5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Customers</div>
              <div className="text-xl font-black text-slate-900 dark:text-white">{profiles.length}</div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-[#0a0a0c] p-4 rounded-3xl border border-black/10 dark:border-white/5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Points Issued</div>
              <div className="text-xl font-black text-slate-900 dark:text-white">
                {profiles.reduce((sum, p) => sum + (p.points || 0), 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-[#0a0a0c] p-4 rounded-3xl border border-black/10 dark:border-white/5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Active Today</div>
              <div className="text-xl font-black text-slate-900 dark:text-white">
                {profiles.filter(p => p.lastLoginAt && new Date(p.lastLoginAt).toDateString() === new Date().toDateString()).length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white dark:bg-[#0a0a0c] rounded-3xl border border-black/10 dark:border-white/5 shadow-xl overflow-hidden">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left border-collapse min-w-[650px]">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-white/5">
                <th className="px-6 py-4">
                  <button 
                    onClick={() => toggleSort('displayName')}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-amber-500 transition-colors"
                  >
                    Customer <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-6 py-4">
                  <button 
                    onClick={() => toggleSort('points')}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-amber-500 transition-colors"
                  >
                    Points Balance <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-6 py-4">
                  <button 
                    onClick={() => toggleSort('createdAt')}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-amber-500 transition-colors"
                  >
                    Joined <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-6 py-4">
                  <button 
                    onClick={() => toggleSort('lastLoginAt')}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-amber-500 transition-colors"
                  >
                    Last Activity <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {filteredProfiles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-medium">
                    No customers found matching your search.
                  </td>
                </tr>
              ) : (
                filteredProfiles.map((profile) => (
                  <tr key={profile.uid} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl flex items-center justify-center font-black shrink-0">
                          {profile.photoURL ? (
                            <img src={profile.photoURL} alt="" className="w-full h-full object-cover rounded-xl" referrerPolicy="no-referrer" />
                          ) : (
                            (profile.displayName?.charAt(0) || profile.email?.charAt(0))?.toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          {editingUid === profile.uid ? (
                            <input
                              type="text"
                              value={editForm.displayName || ''}
                              onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                              className="bg-transparent border-b border-amber-500 text-sm font-bold text-slate-900 dark:text-white focus:outline-none w-full"
                            />
                          ) : (
                            <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                              {profile.displayName || 'Unnamed Customer'}
                              {profile.isAdmin && <span className="ml-2 text-[8px] bg-purple-500/10 text-purple-500 px-1.5 py-0.5 rounded-full uppercase tracking-tighter">Admin</span>}
                            </div>
                          )}
                          <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <Mail className="w-3 h-3" />
                            {profile.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {editingUid === profile.uid ? (
                        <div className="flex items-center gap-2">
                          <Coins className="w-4 h-4 text-amber-500" />
                          <input
                            type="number"
                            value={editForm.points || 0}
                            onChange={(e) => setEditForm({ ...editForm, points: parseInt(e.target.value) || 0 })}
                            className="w-20 bg-transparent border-b border-amber-500 text-sm font-black text-amber-600 focus:outline-none"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-black text-amber-600 italic">
                            {profile.points?.toLocaleString() || 0} Pts
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" />
                        {new Date(profile.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        {profile.lastLoginAt ? (
                          <div className="flex flex-col">
                            <span>{new Date(profile.lastLoginAt).toLocaleDateString()}</span>
                            <span className="text-[10px] text-slate-400">{new Date(profile.lastLoginAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        ) : (
                          'Never'
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {editingUid === profile.uid ? (
                          <>
                            <button
                              disabled={isSaving}
                              onClick={handleSave}
                              className="p-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all shadow-sm active:scale-95"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              disabled={isSaving}
                              onClick={() => {
                                setEditingUid(null);
                                setEditForm({});
                              }}
                              className="p-2 bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-300 dark:hover:bg-white/20 transition-all active:scale-95"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleEdit(profile)}
                            className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-500/10 rounded-xl transition-all"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
