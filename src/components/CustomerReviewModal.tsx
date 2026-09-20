import React, { useState, useEffect } from 'react';
import { Review, UserProfile, Order } from '../types';
import { 
  Star, 
  CheckCircle2, 
  Clock, 
  X, 
  Sparkles, 
  MessageSquareQuote, 
  AlertCircle,
  ShoppingBag,
  Send,
  Edit3
} from 'lucide-react';

interface CustomerReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  userOrders: Order[];
  userProfile: UserProfile | null;
  currentUserUid?: string;
  currentUserName?: string;
  currentUserPhoto?: string;
  existingReview?: Review | null;
  onSubmitReview: (data: { rating: number; comment: string; userName?: string; userPhoto?: string }) => Promise<boolean | void>;
}

export function CustomerReviewModal({
  isOpen,
  onClose,
  userOrders,
  userProfile,
  currentUserUid,
  currentUserName,
  currentUserPhoto,
  existingReview,
  onSubmitReview
}: CustomerReviewModalProps) {
  const completedOrders = userOrders.filter(o => o.status === 'completed');
  const completedCount = completedOrders.length;
  const isEligible = completedCount >= 3;

  const [rating, setRating] = useState<number>(existingReview?.rating || 5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>(existingReview?.comment || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating || 5);
      setComment(existingReview.comment || '');
    } else {
      setRating(5);
      setComment('');
    }
  }, [existingReview, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEligible) return;

    if (!comment.trim() || comment.trim().length < 3) {
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await onSubmitReview({
        rating,
        comment: comment.trim(),
        userName: currentUserName || userProfile?.displayName,
        userPhoto: currentUserPhoto || userProfile?.photoURL
      });
      if (success !== false) {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0a0f1d] rounded-3xl border border-slate-200 dark:border-white/10 p-6 sm:p-8 max-w-lg w-full shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Glow Accent */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-[60px] pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
            <MessageSquareQuote className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black uppercase italic tracking-tight text-slate-900 dark:text-white">
              {existingReview ? 'Update Your Review' : 'Leave a Store Review'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Share your feedback to be featured on our front store splash screen!
            </p>
          </div>
        </div>

        {/* Eligibility Check */}
        {!isEligible ? (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 mb-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center mx-auto mb-3">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-black uppercase tracking-tight text-amber-600 dark:text-amber-400 mb-1">
              3 Completed Orders Required
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
              To keep our community reviews authentic, you must have at least <strong>3 completed transactions</strong> in your order history.
            </p>
            
            {/* Progress Bar */}
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden mb-2">
              <div 
                className="h-full bg-amber-500 transition-all duration-500 rounded-full"
                style={{ width: `${Math.min((completedCount / 3) * 100, 100)}%` }}
              />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              {completedCount} of 3 orders completed
            </span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Existing Review Status Notice */}
            {existingReview && (
              <div className={`p-3 rounded-2xl border text-xs flex items-center gap-2.5 ${
                existingReview.isApproved 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
              }`}>
                {existingReview.isApproved ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span><strong>Live on Splash Screen:</strong> Your review is currently active in the front store slideshow.</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4 shrink-0" />
                    <span><strong>Pending Approval:</strong> Your review is submitted and awaiting admin moderation.</span>
                  </>
                )}
              </div>
            )}

            {/* Verified Badge */}
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-white/5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Verified Patron Status
                </span>
              </div>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                {completedCount} Completed Orders
              </span>
            </div>

            {/* Star Rating Selector */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Rating
              </label>
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-200 dark:border-white/5 justify-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1.5 focus:outline-none transition-transform hover:scale-125 active:scale-95"
                  >
                    <Star
                      className={`w-7 h-7 transition-colors ${
                        star <= (hoverRating || rating)
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-300 dark:text-slate-700'
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-3 text-sm font-black text-amber-500 min-w-[50px]">
                  {hoverRating || rating} / 5
                </span>
              </div>
            </div>

            {/* Review Comment Field */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Your Feedback
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="What did you love most about your experience? (e.g. coffee quality, ambiance, friendly service...)"
                rows={4}
                maxLength={300}
                required
                className="w-full p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-2xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 transition-all resize-none font-medium leading-relaxed"
              />
              <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1 px-1">
                <span>Admin review required before appearing on splash.</span>
                <span>{comment.length}/300</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || comment.trim().length < 3}
                className="flex-1 py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
                {isSubmitting ? 'Submitting...' : existingReview ? 'Update Review' : 'Submit Review'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
