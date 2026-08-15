import React, { useState } from 'react';
import { UserProfile } from '../types';
import { Search, User, Mail, Calendar, Coins, Edit2, X, Check, Trash2, Filter, ArrowUpDown, ShieldAlert, ShieldOff, Clock, Ban, AlertTriangle, ShieldCheck, Maximize2, ScanFace, Camera, MessageSquare } from 'lucide-react';
import { useToast } from '../lib/ToastContext';

interface AdminCustomersProps {
  profiles: UserProfile[];
  onUpdateProfile: (uid: string, updates: Partial<UserProfile>) => Promise<void>;
  onInitiateChat?: (customer: { id: string; name: string; email?: string }) => void;
}

export function AdminCustomers({ profiles = [], onUpdateProfile, onInitiateChat }: AdminCustomersProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUid, setEditingUid] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Photo lightbox state
  const [viewingPhotoProfile, setViewingPhotoProfile] = useState<UserProfile | null>(null);

  // Suspension modal state
  const [suspendModalProfile, setSuspendModalProfile] = useState<UserProfile | null>(null);
  const [suspendHours, setSuspendHours] = useState<number>(2); // Default 2 hours
  const [customHours, setCustomHours] = useState<string>('');
  const [suspendReason, setSuspendReason] = useState<string>('Spamming orders');

  // Sorting
  const [sortField, setSortField] = useState<'displayName' | 'points' | 'createdAt' | 'lastLoginAt' | 'orderingDisabledUntil'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const formatRemainingTime = (disabledUntil?: number) => {
    if (!disabledUntil || disabledUntil <= Date.now()) return null;
    const diffMs = disabledUntil - Date.now();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.ceil((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h remaining`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
  };

  const filteredProfiles = profiles
    .filter(p => 
      p.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.uid.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.shortId || p.uid.slice(0, 5)).toLowerCase().includes(searchTerm.toLowerCase())
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

  const handleApplySuspension = async () => {
    if (!suspendModalProfile) return;
    const hoursToApply = customHours ? parseFloat(customHours) : suspendHours;
    if (isNaN(hoursToApply) || hoursToApply <= 0) {
      toast.error('Please enter a valid number of hours.');
      return;
    }

    setIsSaving(true);
    try {
      const untilTimestamp = Date.now() + Math.round(hoursToApply * 60 * 60 * 1000);
      await onUpdateProfile(suspendModalProfile.uid, {
        orderingDisabledUntil: untilTimestamp,
        orderingDisabledReason: suspendReason || 'Spam prevention'
      });
      toast.success(`Ordering privileges disabled for ${suspendModalProfile.displayName || 'Customer'} for ${hoursToApply} hour(s).`);
      setSuspendModalProfile(null);
    } catch (err) {
      toast.error('Failed to update suspension status.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLiftSuspension = async (profile: UserProfile) => {
    setIsSaving(true);
    try {
      await onUpdateProfile(profile.uid, {
        orderingDisabledUntil: 0,
        orderingDisabledReason: ''
      });
      toast.success(`Ordering privileges restored for ${profile.displayName || 'Customer'}.`);
      setSuspendModalProfile(null);
    } catch (err) {
      toast.error('Failed to lift suspension.');
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
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
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
        <div className="bg-white dark:bg-[#0a0a0c] p-4 rounded-3xl border border-black/10 dark:border-white/5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-500/10 text-rose-500 rounded-xl flex items-center justify-center">
              <ShieldOff className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Suspended</div>
              <div className="text-xl font-black text-rose-500">
                {profiles.filter(p => p.orderingDisabledUntil && p.orderingDisabledUntil > Date.now()).length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white dark:bg-[#0a0a0c] rounded-3xl border border-black/10 dark:border-white/5 shadow-xl overflow-hidden flex flex-col">
        <div className="max-h-[65vh] overflow-y-auto overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[750px]">
            <thead className="sticky top-0 bg-slate-50 dark:bg-[#131722] z-10 shadow-sm">
              <tr className="bg-slate-50 dark:bg-[#131722]">
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
                    onClick={() => toggleSort('orderingDisabledUntil')}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-amber-500 transition-colors"
                  >
                    Ordering Status <ArrowUpDown className="w-3 h-3" />
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
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-medium">
                    No customers found matching your search.
                  </td>
                </tr>
              ) : (
                filteredProfiles.map((profile) => {
                  const isSuspended = profile.orderingDisabledUntil && profile.orderingDisabledUntil > Date.now();
                  const timeRemaining = formatRemainingTime(profile.orderingDisabledUntil);

                  return (
                  <tr key={profile.uid} className={`hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors group ${
                    isSuspended ? 'bg-rose-500/5 dark:bg-rose-500/5' : ''
                  }`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div 
                          onClick={() => setViewingPhotoProfile(profile)}
                          className="w-11 h-11 bg-amber-500/10 border border-amber-500/30 text-amber-500 rounded-2xl flex items-center justify-center font-black shrink-0 relative cursor-pointer hover:border-amber-400 hover:scale-105 transition-all group overflow-hidden shadow-sm"
                          title="Click to view enlarged customer photo"
                        >
                          {profile.photoURL ? (
                            <>
                              <img src={profile.photoURL} alt={profile.displayName || 'Customer'} className="w-full h-full object-cover rounded-2xl" referrerPolicy="no-referrer" />
                              <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-amber-400">
                                <Maximize2 className="w-4 h-4" />
                              </div>
                            </>
                          ) : (
                            <span className="text-sm font-black text-amber-500">
                              {(profile.displayName?.charAt(0) || profile.email?.charAt(0))?.toUpperCase()}
                            </span>
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
                            <div className="text-sm font-bold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                              {profile.displayName || 'Unnamed Customer'}
                              <span className="text-[9px] font-mono font-black bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1.5 py-0.2 rounded uppercase">
                                #{profile.shortId || profile.uid.slice(0, 5).toUpperCase()}
                              </span>
                              {profile.isAdmin && <span className="text-[8px] bg-purple-500/10 text-purple-500 px-1.5 py-0.5 rounded-full uppercase tracking-tighter">Admin</span>}
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
                      {isSuspended ? (
                        <div className="flex flex-col gap-0.5 items-start">
                          <span className="px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-500 border border-rose-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                            <ShieldOff className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                            Suspended ({timeRemaining})
                          </span>
                          {profile.orderingDisabledReason && (
                            <span className="text-[9px] text-slate-400 font-medium italic pl-1 truncate max-w-[150px]">
                              "{profile.orderingDisabledReason}"
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingUid === profile.uid ? (
                        <div className="flex items-center gap-2">
                          <Coins className="w-4 h-4 text-amber-500" />
                          <input
                            type="number"
                            value={editForm.points === 0 ? '' : (editForm.points ?? '')}
                            placeholder="0"
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditForm({ ...editForm, points: val === '' ? 0 : parseInt(val) || 0 });
                            }}
                            className="w-24 bg-transparent border-b border-amber-500 text-sm font-black text-amber-600 focus:outline-none"
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
                        {/* Direct Chat Button */}
                        {onInitiateChat && !profile.isAdmin && profile.role !== 'admin' && (
                          <button
                            onClick={() => onInitiateChat({ id: profile.uid, name: profile.displayName || profile.email || 'Customer', email: profile.email })}
                            className="p-2 text-amber-500 bg-amber-500/10 hover:bg-amber-500/20 rounded-xl transition-all shadow-sm active:scale-95 flex items-center gap-1.5 text-xs font-black"
                            title="Start / Open Chat Conversation"
                          >
                            <MessageSquare className="w-4 h-4" />
                            <span className="hidden sm:inline">Chat</span>
                          </button>
                        )}

                        {/* Suspend/Unsuspend Button */}
                        <button
                          onClick={() => {
                            setSuspendModalProfile(profile);
                            setSuspendHours(2);
                            setCustomHours('');
                            setSuspendReason('Spamming orders');
                          }}
                          className={`p-2 rounded-xl transition-all ${
                            isSuspended 
                              ? 'text-rose-500 bg-rose-500/10 hover:bg-rose-500/20' 
                              : 'text-slate-400 hover:text-rose-500 hover:bg-rose-500/10'
                          }`}
                          title={isSuspended ? 'Manage / Lift Suspension' : 'Disable Ordering (Spam Control)'}
                        >
                          <ShieldAlert className="w-4 h-4" />
                        </button>

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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Account Ordering Suspension Modal */}
      {suspendModalProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-white/10 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-6 text-white relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 flex items-center justify-center">
                  <ShieldOff className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight italic">
                    Disable <span className="text-rose-500">Ordering</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    Spam & Misbehavior Control
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSuspendModalProfile(null)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Customer Info */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
              <div 
                onClick={() => setViewingPhotoProfile(suspendModalProfile)}
                className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center font-black shrink-0 relative cursor-pointer hover:scale-105 transition-all overflow-hidden group"
                title="Click to view full photo"
              >
                {suspendModalProfile.photoURL ? (
                  <>
                    <img src={suspendModalProfile.photoURL} alt={suspendModalProfile.displayName} className="w-full h-full object-cover rounded-2xl" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-amber-400">
                      <Maximize2 className="w-4 h-4" />
                    </div>
                  </>
                ) : (
                  (suspendModalProfile.displayName?.charAt(0) || suspendModalProfile.email?.charAt(0))?.toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-white truncate">
                  {suspendModalProfile.displayName || 'Customer'}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {suspendModalProfile.email}
                </div>
              </div>
              <span className="text-[9px] font-mono font-black bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded uppercase">
                #{suspendModalProfile.shortId || suspendModalProfile.uid.slice(0, 5).toUpperCase()}
              </span>
            </div>

            {/* Current Suspension Banner if active */}
            {suspendModalProfile.orderingDisabledUntil && suspendModalProfile.orderingDisabledUntil > Date.now() ? (
              <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-rose-400">
                    <AlertTriangle className="w-4 h-4" /> Currently Suspended
                  </span>
                  <span className="text-[10px] font-bold bg-rose-500 text-slate-950 px-2 py-0.5 rounded-full uppercase">
                    {formatRemainingTime(suspendModalProfile.orderingDisabledUntil)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 font-medium">
                  Suspended until: {new Date(suspendModalProfile.orderingDisabledUntil).toLocaleString()}
                </p>
                {suspendModalProfile.orderingDisabledReason && (
                  <p className="text-[10px] text-slate-400 italic">
                    Reason: "{suspendModalProfile.orderingDisabledReason}"
                  </p>
                )}
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => handleLiftSuspension(suspendModalProfile)}
                  className="w-full mt-2 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                >
                  <ShieldCheck className="w-4 h-4" /> Restore Ordering Privileges Now
                </button>
              </div>
            ) : null}

            {/* Duration Selector */}
            <div className="space-y-3">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
                Select Suspension Duration (Hours)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 6, 12, 24, 48].map((hrs) => (
                  <button
                    key={hrs}
                    type="button"
                    onClick={() => {
                      setSuspendHours(hrs);
                      setCustomHours('');
                    }}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                      !customHours && suspendHours === hrs
                        ? 'bg-rose-500 border-rose-500 text-slate-950 shadow-lg shadow-rose-500/20'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    {hrs >= 24 ? `${hrs / 24} Day${hrs > 24 ? 's' : ''}` : `${hrs} Hr${hrs > 1 ? 's' : ''}`}
                  </button>
                ))}
              </div>

              {/* Custom Hours Input */}
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Or Specify Custom Hours
                </label>
                <input
                  type="number"
                  placeholder="e.g. 0.5 for 30 mins, 3 for 3 hours..."
                  value={customHours}
                  onChange={(e) => setCustomHours(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-rose-500 transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* Reason Selector */}
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
                Reason for Suspension
              </label>
              <select
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-rose-500 transition-all"
              >
                <option value="Spamming orders">Spamming / Rapid duplicate orders</option>
                <option value="Unclaimed unpaid orders">Unclaimed / abandoned unpaid orders</option>
                <option value="Prank / Fake name input">Prank or fake order details</option>
                <option value="Misbehavior / Abuse">Abusive behavior</option>
                <option value="Account under verification">Account verification needed</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSuspendModalProfile(null)}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleApplySuspension}
                className="flex-1 py-3 bg-rose-500 hover:bg-rose-400 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2"
              >
                <ShieldOff className="w-4 h-4" />
                Apply Suspension
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Photo Lightbox Modal */}
      {viewingPhotoProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-white/10 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 text-white text-center relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-amber-500 font-black text-xs uppercase tracking-widest">
                <Camera className="w-4 h-4" /> Customer Profile & Face Scan Photo
              </div>
              <button
                onClick={() => setViewingPhotoProfile(null)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative rounded-2xl overflow-hidden border-2 border-amber-500/40 bg-black min-h-[220px] max-h-[55vh] flex items-center justify-center">
              {viewingPhotoProfile.photoURL ? (
                <img 
                  src={viewingPhotoProfile.photoURL} 
                  alt={viewingPhotoProfile.displayName || 'Customer'} 
                  className="w-full h-auto max-h-[55vh] object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="p-12 text-center space-y-2">
                  <ScanFace className="w-12 h-12 text-slate-600 mx-auto" />
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">No Photo Uploaded Yet</p>
                  <p className="text-[10px] text-slate-500">Customer has not registered Face ID or profile photo.</p>
                </div>
              )}
            </div>

            <div className="space-y-2 bg-white/5 p-4 rounded-2xl border border-white/5 text-left">
              <div className="flex items-center justify-between">
                <span className="text-sm font-black text-white">{viewingPhotoProfile.displayName || 'Unnamed Customer'}</span>
                <span className="text-[10px] font-mono font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded uppercase">
                  #{viewingPhotoProfile.shortId || viewingPhotoProfile.uid.slice(0, 5).toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-amber-500/60" /> {viewingPhotoProfile.email}
              </p>
              <div className="flex items-center justify-between text-[11px] pt-1 text-slate-300 font-semibold">
                <span>Loyalty Points: <strong className="text-amber-400">{viewingPhotoProfile.points || 0} Pts</strong></span>
                <span>
                  Status: {viewingPhotoProfile.orderingDisabledUntil && viewingPhotoProfile.orderingDisabledUntil > Date.now() ? (
                    <strong className="text-rose-400">Suspended</strong>
                  ) : (
                    <strong className="text-emerald-400">Active</strong>
                  )}
                </span>
              </div>
            </div>

            <button
              onClick={() => setViewingPhotoProfile(null)}
              className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
