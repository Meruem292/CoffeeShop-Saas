import React, { useState, useMemo } from 'react';
import { Review } from '../types';
import { 
  Star, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Search, 
  Filter, 
  Sparkles, 
  Clock, 
  ShieldCheck, 
  MessageSquareQuote,
  Eye,
  EyeOff,
  User,
  ShoppingBag,
  AlertCircle
} from 'lucide-react';
import { ConfirmationModal } from './ConfirmationModal';

interface AdminReviewsProps {
  reviews: Review[];
  onApproveReview: (id: string, isApproved: boolean) => Promise<boolean | void>;
  onToggleFeatureReview: (id: string, isFeatured: boolean) => Promise<boolean | void>;
  onDeleteReview: (id: string) => Promise<boolean | void>;
}

export function AdminReviews({
  reviews,
  onApproveReview,
  onToggleFeatureReview,
  onDeleteReview,
}: AdminReviewsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'featured'>('all');
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');
  const [reviewToDelete, setReviewToDelete] = useState<Review | null>(null);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);

  // Summary Metrics
  const stats = useMemo(() => {
    const total = reviews.length;
    const pending = reviews.filter(r => !r.isApproved).length;
    const approved = reviews.filter(r => r.isApproved).length;
    const featured = reviews.filter(r => r.isFeatured).length;
    const avgRating = total > 0 
      ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / total).toFixed(1)
      : '5.0';

    return { total, pending, approved, featured, avgRating };
  }, [reviews]);

  // Filtered list
  const filteredReviews = useMemo(() => {
    return reviews.filter(r => {
      // Search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = r.userName?.toLowerCase().includes(query);
        const matchesEmail = r.userEmail?.toLowerCase().includes(query);
        const matchesComment = r.comment?.toLowerCase().includes(query);
        if (!matchesName && !matchesEmail && !matchesComment) return false;
      }

      // Status Filter
      if (statusFilter === 'pending' && r.isApproved) return false;
      if (statusFilter === 'approved' && !r.isApproved) return false;
      if (statusFilter === 'featured' && !r.isFeatured) return false;

      // Rating Filter
      if (ratingFilter !== 'all' && r.rating !== ratingFilter) return false;

      return true;
    });
  }, [reviews, searchTerm, statusFilter, ratingFilter]);

  const handleApprove = async (review: Review, approved: boolean) => {
    setIsActionLoading(review.id);
    try {
      await onApproveReview(review.id, approved);
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleToggleFeature = async (review: Review) => {
    setIsActionLoading(review.id);
    try {
      await onToggleFeatureReview(review.id, !review.isFeatured);
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!reviewToDelete) return;
    setIsActionLoading(reviewToDelete.id);
    try {
      await onDeleteReview(reviewToDelete.id);
      setReviewToDelete(null);
    } finally {
      setIsActionLoading(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-white p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <Star className="w-4 h-4 fill-amber-500" />
            </div>
            <h1 className="text-2xl font-black uppercase italic tracking-tight">Customer Reviews</h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Moderate verified customer reviews shown on the Splash Screen slideshow.
          </p>
        </div>
      </div>

      {/* Analytics / Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {/* Total Reviews */}
        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm backdrop-blur-xl">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest">Total Reviews</span>
            <MessageSquareQuote className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{stats.total}</div>
          <p className="text-[10px] text-slate-400 font-medium mt-0.5">Submitted by verified patrons</p>
        </div>

        {/* Pending Approval */}
        <div className="bg-white dark:bg-slate-900/60 border border-amber-500/30 dark:border-amber-500/20 rounded-2xl p-4 shadow-sm backdrop-blur-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest">Pending Approval</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2">
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{stats.pending}</div>
            {stats.pending > 0 && (
              <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-amber-500/20 text-amber-500 rounded-full border border-amber-500/30 animate-pulse">
                Action Required
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-400 font-medium mt-0.5">Hidden from splash until approved</p>
        </div>

        {/* Live on Splash */}
        <div className="bg-white dark:bg-slate-900/60 border border-emerald-500/30 dark:border-emerald-500/20 rounded-2xl p-4 shadow-sm backdrop-blur-xl">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest">Live on Splash</span>
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.approved}</div>
          <p className="text-[10px] text-slate-400 font-medium mt-0.5">Active in rotation</p>
        </div>

        {/* Average Rating */}
        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm backdrop-blur-xl">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest">Average Score</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{stats.avgRating}</span>
            <div className="flex items-center text-amber-400">
              <Star className="w-4 h-4 fill-amber-400" />
            </div>
          </div>
          <p className="text-[10px] text-slate-400 font-medium mt-0.5">Out of 5.0 stars</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-2xl p-4 mb-6 shadow-sm flex flex-col lg:flex-row items-center gap-4 justify-between">
        {/* Search Bar */}
        <div className="relative w-full lg:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by customer name, email, or keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-white/10 rounded-xl text-xs focus:outline-none focus:border-amber-500 text-slate-900 dark:text-white placeholder-slate-400 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs font-bold"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Status Tabs */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-950/60 p-1 rounded-xl border border-slate-200 dark:border-white/10">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All ({reviews.length})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                statusFilter === 'pending'
                  ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                  : 'text-slate-500 hover:text-amber-500'
              }`}
            >
              Pending
              {stats.pending > 0 && (
                <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${statusFilter === 'pending' ? 'bg-black/20 text-black' : 'bg-amber-500/20 text-amber-500'}`}>
                  {stats.pending}
                </span>
              )}
            </button>
            <button
              onClick={() => setStatusFilter('approved')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                statusFilter === 'approved'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Approved ({stats.approved})
            </button>
            <button
              onClick={() => setStatusFilter('featured')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                statusFilter === 'featured'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Featured ({stats.featured})
            </button>
          </div>

          {/* Star Rating Select */}
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="px-3 py-2 bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Stars (1 - 5★)</option>
            <option value="5">⭐⭐⭐⭐⭐ (5 Stars)</option>
            <option value="4">⭐⭐⭐⭐ (4 Stars)</option>
            <option value="3">⭐⭐⭐ (3 Stars)</option>
            <option value="2">⭐⭐ (2 Stars)</option>
            <option value="1">⭐ (1 Star)</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      {filteredReviews.length === 0 ? (
        <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-3xl p-12 text-center flex flex-col items-center justify-center my-auto">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mb-4">
            <MessageSquareQuote className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black uppercase tracking-tight mb-1">No Reviews Found</h3>
          <p className="text-xs text-slate-400 max-w-sm">
            {searchTerm || statusFilter !== 'all' || ratingFilter !== 'all'
              ? 'No reviews match your current filters. Try resetting the search or filters.'
              : 'Verified customers with at least 3 completed transactions will be able to submit reviews from their profile or order history.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredReviews.map((review) => {
            const isLoading = isActionLoading === review.id;

            return (
              <div
                key={review.id}
                className={`bg-white dark:bg-slate-900/60 border rounded-3xl p-5 shadow-sm backdrop-blur-xl flex flex-col justify-between transition-all relative ${
                  review.isApproved 
                    ? 'border-slate-200 dark:border-white/10' 
                    : 'border-amber-500/40 dark:border-amber-500/30 bg-amber-50/30 dark:bg-amber-950/10'
                }`}
              >
                {/* Top Row: User Avatar, Name, Verified Orders Tag */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-2xl overflow-hidden bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-white/10 flex items-center justify-center shrink-0 shadow-inner">
                        {review.userPhoto ? (
                          <img
                            src={review.userPhoto}
                            alt={review.userName}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-slate-950 font-black text-sm">
                            {review.userName ? review.userName.slice(0, 2).toUpperCase() : <User className="w-5 h-5" />}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-black text-sm text-slate-900 dark:text-white truncate">
                          {review.userName || 'Patron'}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            {review.completedOrdersCount || 3}+ Orders
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Live Status Badge */}
                    <div className="shrink-0">
                      {review.isApproved ? (
                        <span className="text-[9px] font-black uppercase px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          Live on Splash
                        </span>
                      ) : (
                        <span className="text-[9px] font-black uppercase px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40 flex items-center gap-1 animate-pulse">
                          <Clock className="w-3 h-3" />
                          Pending Approval
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Rating Stars */}
                  <div className="flex items-center gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= review.rating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-300 dark:text-slate-700'
                        }`}
                      />
                    ))}
                    <span className="text-xs font-black ml-1.5 text-amber-500">
                      {review.rating}.0
                    </span>
                    {review.isFeatured && (
                      <span className="ml-auto text-[9px] font-black uppercase tracking-wider px-2 py-0.5 bg-amber-500/15 text-amber-500 rounded-md border border-amber-500/30 flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" />
                        Featured
                      </span>
                    )}
                  </div>

                  {/* Comment Text */}
                  <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/5 rounded-2xl p-3.5 mb-4 relative">
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium italic">
                      "{review.comment}"
                    </p>
                    <span className="block text-[9px] text-slate-400 mt-2 font-mono">
                      {review.createdAt ? new Date(review.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'Recent'}
                    </span>
                  </div>
                </div>

                {/* Bottom Actions Bar */}
                <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-200 dark:border-white/5">
                  {/* Approve / Unapprove Toggle */}
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleApprove(review, !review.isApproved)}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                      review.isApproved
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-amber-500/10 hover:text-amber-500'
                        : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-md shadow-emerald-500/20'
                    }`}
                  >
                    {review.isApproved ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        Hide from Splash
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Approve for Splash
                      </>
                    )}
                  </button>

                  {/* Feature Toggle Button */}
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleToggleFeature(review)}
                    title={review.isFeatured ? 'Remove from Featured' : 'Mark as Featured'}
                    className={`p-2 rounded-xl border transition-all ${
                      review.isFeatured
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-500'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-white/10 text-slate-400 hover:text-amber-400'
                    }`}
                  >
                    <Star className={`w-4 h-4 ${review.isFeatured ? 'fill-amber-500' : ''}`} />
                  </button>

                  {/* Delete Button */}
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => setReviewToDelete(review)}
                    title="Delete Review"
                    className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal for Delete */}
      <ConfirmationModal
        isOpen={!!reviewToDelete}
        title="Delete Customer Review?"
        message={`Are you sure you want to permanently remove the review by ${reviewToDelete?.userName || 'this customer'}? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onClose={() => setReviewToDelete(null)}
      />
    </div>
  );
}
