import React, { useState, useMemo } from 'react';
import { 
  X, Search, Crown, Flame, Star, ShoppingBag, Sparkles, Heart, 
  RotateCcw, FlaskConical, MessageSquare, Coffee, Send, ChevronRight,
  TrendingUp, Award, Layers, Zap, Scale, User, Tag
} from 'lucide-react';
import { SavedCustomMix, CustomMixReview, CartItem, YourMixIngredient } from '../types';
import { useToast } from '../lib/ToastContext';

interface CreativesMarketModalProps {
  isOpen: boolean;
  onClose: () => void;
  communityMixes: SavedCustomMix[];
  allIngredients: YourMixIngredient[];
  onOrderMix: (mix: SavedCustomMix) => void;
  onRemixInStudio: (mix: SavedCustomMix) => void;
  onLikeMix: (mixId: string) => void;
  onReviewMix: (mixId: string, review: { rating: number; comment: string; userName?: string }) => Promise<boolean>;
  currentUserId?: string;
  currentUserName?: string;
}

type SortOption = 'trending' | 'top-rated' | 'most-ordered' | 'newest';

export function CreativesMarketModal({
  isOpen,
  onClose,
  communityMixes,
  allIngredients,
  onOrderMix,
  onRemixInStudio,
  onLikeMix,
  onReviewMix,
  currentUserId,
  currentUserName
}: CreativesMarketModalProps) {
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSort, setSelectedSort] = useState<SortOption>('trending');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [activeInspectMix, setActiveInspectMix] = useState<SavedCustomMix | null>(null);

  // Review Form State
  const [newRating, setNewRating] = useState<number>(5);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Available unique tags across all community mixes
  const availableTags = useMemo(() => {
    const set = new Set<string>();
    communityMixes.forEach(m => {
      m.tags?.forEach(t => set.add(t));
    });
    return ['all', ...Array.from(set)];
  }, [communityMixes]);

  // Filter & Sort community mixes
  const filteredMixes = useMemo(() => {
    let result = communityMixes.filter(m => m.isPublic !== false);

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(m => 
        m.mixName.toLowerCase().includes(q) ||
        (m.creatorHandle && m.creatorHandle.toLowerCase().includes(q)) ||
        (m.userName && m.userName.toLowerCase().includes(q)) ||
        (m.tagline && m.tagline.toLowerCase().includes(q)) ||
        m.tags?.some(t => t.toLowerCase().includes(q))
      );
    }

    // Tag filter
    if (selectedTag !== 'all') {
      result = result.filter(m => m.tags?.includes(selectedTag));
    }

    // Sort options
    return result.sort((a, b) => {
      if (selectedSort === 'trending') {
        const scoreA = ((a.likes || 0) * 2) + (a.orderCount || 0) + (a.reviewCount || 0);
        const scoreB = ((b.likes || 0) * 2) + (b.orderCount || 0) + (b.reviewCount || 0);
        return scoreB - scoreA;
      }
      if (selectedSort === 'top-rated') {
        return (b.rating || 0) - (a.rating || 0);
      }
      if (selectedSort === 'most-ordered') {
        return (b.orderCount || 0) - (a.orderCount || 0);
      }
      if (selectedSort === 'newest') {
        return (b.createdAt || 0) - (a.createdAt || 0);
      }
      return 0;
    });
  }, [communityMixes, searchQuery, selectedTag, selectedSort]);

  if (!isOpen) return null;

  const handlePostReview = async (mixId: string) => {
    if (!newComment.trim()) {
      toast.warning('Please enter a review comment before submitting!');
      return;
    }
    setIsSubmittingReview(true);
    try {
      const ok = await onReviewMix(mixId, {
        rating: newRating,
        comment: newComment.trim(),
        userName: currentUserName || 'Coffee Lover'
      });
      if (ok) {
        setNewComment('');
        setNewRating(5);
        // Refresh active inspected mix reviews from local list
        const updated = communityMixes.find(m => m.id === mixId);
        if (updated) {
          setActiveInspectMix(updated);
        }
      }
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-amber-500/30 rounded-3xl w-full max-w-6xl h-[92vh] max-h-[950px] flex flex-col overflow-hidden shadow-2xl relative">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-white/10 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/40 flex items-center justify-between shrink-0 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20 shrink-0">
              <Crown className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-xl font-black text-white uppercase tracking-tight truncate">
                  Creatives Market
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Community Sensations
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate mt-0.5">
                Discover, rate, and taste customer-formulated drinks. Upvote your favorite mixologists!
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all shrink-0 active:scale-95"
            title="Close Creatives Market"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search, Filter, and Sort Controls */}
        <div className="p-3 sm:p-5 border-b border-white/5 bg-slate-950/60 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shrink-0">
          {/* Search bar */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search drinks, creators (@handle), or flavors..."
              className="w-full bg-slate-900 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Sort Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
            {[
              { id: 'trending', label: 'Trending', icon: <Flame className="w-3.5 h-3.5 text-amber-400" /> },
              { id: 'top-rated', label: 'Top Rated', icon: <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> },
              { id: 'most-ordered', label: 'Most Ordered', icon: <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" /> },
              { id: 'newest', label: 'Newest', icon: <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> },
            ].map((tab) => {
              const isActive = selectedSort === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedSort(tab.id as SortOption)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap transition-all ${
                    isActive 
                      ? 'bg-amber-500 text-slate-950 font-black shadow-md' 
                      : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tag Pills Filter */}
        {availableTags.length > 1 && (
          <div className="px-4 sm:px-6 py-2 border-b border-white/5 bg-slate-950/40 flex items-center gap-2 overflow-x-auto scrollbar-hide shrink-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 shrink-0">
              Filter:
            </span>
            {availableTags.map(tag => {
              const isSelected = selectedTag === tag;
              return (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                    isSelected
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                      : 'bg-white/5 text-slate-400 hover:text-white border border-transparent'
                  }`}
                >
                  {tag === 'all' ? 'All Flavors' : tag}
                </button>
              );
            })}
          </div>
        )}

        {/* Main Content Area: Grid of Mix Cards */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-hide">
          {filteredMixes.length === 0 ? (
            <div className="py-20 text-center max-w-md mx-auto space-y-4">
              <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto shadow-xl">
                <FlaskConical className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-black text-white uppercase tracking-tight">
                {searchQuery ? 'No Matching Drinks Found' : 'No Community Mixes Yet'}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {searchQuery
                  ? `No community drinks match "${searchQuery}". Try a different keyword or clear your filter.`
                  : 'Be the pioneer sensation! Create your drink in the "Your MIX" Drink Studio, click "Save & Publish", and watch your drink climb the Creatives Leaderboard!'}
              </p>
              {!searchQuery && (
                <button
                  onClick={onClose}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/30 transition-all active:scale-95"
                >
                  🧪 Open Mix Lab Studio
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredMixes.map((mix, idx) => {
                const isTop3 = idx < 3 && selectedSort === 'trending';
                const rankLabels = ['🥇 #1 Sensation', '🥈 #2 Top Mixer', '🥉 #3 Trending'];
                const isLiked = currentUserId && mix.likedBy?.includes(currentUserId);

                return (
                  <div
                    key={mix.id}
                    className="bg-slate-950/70 hover:bg-slate-950 border border-white/10 hover:border-amber-500/50 rounded-3xl p-5 flex flex-col justify-between transition-all duration-300 group shadow-md hover:shadow-2xl relative overflow-hidden"
                  >
                    {/* Visual Fluid Color Bar at top */}
                    <div className="absolute top-0 left-0 right-0 h-2 flex overflow-hidden">
                      {mix.recipeItems.map((item, itemIdx) => (
                        <div
                          key={`bar-${item.id}-${itemIdx}`}
                          className="h-full flex-1"
                          style={{ backgroundColor: item.color || '#f59e0b' }}
                          title={`${item.name} (${item.quantity}${item.unit})`}
                        />
                      ))}
                    </div>

                    <div>
                      {/* Top Bar: Creator Info & Rank Badge */}
                      <div className="flex items-center justify-between mb-3 pt-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center shrink-0 border border-amber-500/30">
                            {mix.creatorHandle ? mix.creatorHandle.slice(1, 3).toUpperCase() : 'CO'}
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-black text-amber-400 truncate block leading-tight">
                              {mix.creatorHandle || mix.userName || 'Community Mixer'}
                            </span>
                            <span className="text-[9px] text-slate-500 uppercase font-mono tracking-wider">
                              Creator
                            </span>
                          </div>
                        </div>

                        {isTop3 ? (
                          <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 shadow-md">
                            {rankLabels[idx]}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-lg text-[9px] font-bold text-slate-400 bg-white/5 border border-white/10 uppercase">
                            {mix.cupSize.capacityOz} oz
                          </span>
                        )}
                      </div>

                      {/* Drink Name & Tagline */}
                      <h4 className="text-base font-black text-white group-hover:text-amber-400 transition-colors leading-snug line-clamp-1 mb-1">
                        {mix.mixName}
                      </h4>
                      {mix.tagline ? (
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3 italic">
                          "{mix.tagline}"
                        </p>
                      ) : (
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
                          Handcrafted formula with {mix.recipeItems.length} custom ingredients.
                        </p>
                      )}

                      {/* Flavor Tags */}
                      {mix.tags && mix.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {mix.tags.map(t => (
                            <span
                              key={t}
                              className="px-2 py-0.5 rounded-md bg-white/5 text-[9px] font-extrabold text-slate-400 uppercase"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Formula Element Pills Preview */}
                      <div className="p-2.5 rounded-2xl bg-black/40 border border-white/5 space-y-1 mb-4">
                        <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                          Formula Blueprint:
                        </div>
                        <div className="flex flex-wrap gap-1 text-[11px] text-slate-300">
                          {mix.recipeItems.slice(0, 3).map(it => (
                            <span key={it.id} className="inline-flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-lg">
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: it.color }} />
                              {it.quantity}{it.unit} {it.name}
                            </span>
                          ))}
                          {mix.recipeItems.length > 3 && (
                            <span className="text-[10px] text-amber-400 font-bold self-center">
                              +{mix.recipeItems.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Stats & Action Buttons */}
                    <div>
                      {/* Rating, Upvote, and Price */}
                      <div className="flex items-center justify-between mb-3 pt-2 border-t border-white/5">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onLikeMix(mix.id)}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                              isLiked 
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                                : 'bg-white/5 text-slate-400 hover:text-white'
                            }`}
                            title="Upvote Drink"
                          >
                            <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                            <span>{mix.likes || 0}</span>
                          </button>

                          <div 
                            onClick={() => setActiveInspectMix(mix)}
                            className="flex items-center gap-1 text-xs text-amber-400 font-bold cursor-pointer hover:underline"
                            title="View Reviews"
                          >
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span>{mix.rating ? mix.rating.toFixed(1) : '5.0'}</span>
                            <span className="text-slate-500 font-normal">({mix.reviews?.length || mix.reviewCount || 0})</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-sm font-black text-amber-400 italic">
                            ₱{mix.totalPrice}
                          </span>
                        </div>
                      </div>

                      {/* Dual Action Buttons */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            onRemixInStudio(mix);
                            onClose();
                          }}
                          className="py-2.5 px-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border border-white/10 active:scale-95"
                          title="Load this recipe into the Beaker Studio to customize"
                        >
                          <FlaskConical className="w-3.5 h-3.5 text-amber-400" />
                          <span>Remix Lab</span>
                        </button>

                        <button
                          onClick={() => onOrderMix(mix)}
                          className="py-2.5 px-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95"
                          title="Add this community drink straight to cart"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>+ Order</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Detailed Drink Inspector & Reviews Modal */}
        {activeInspectMix && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
            <div className="bg-slate-900 border border-amber-500/40 p-6 rounded-3xl max-w-2xl w-full text-slate-100 space-y-5 relative shadow-2xl max-h-[92vh] overflow-y-auto">
              <button
                onClick={() => setActiveInspectMix(null)}
                className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Inspector Header */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black">
                  <FlaskConical className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-white uppercase">{activeInspectMix.mixName}</h3>
                    <span className="text-xs font-black text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                      ₱{activeInspectMix.totalPrice}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Created by <strong className="text-amber-400">{activeInspectMix.creatorHandle || activeInspectMix.userName || 'Community Mixer'}</strong> • {activeInspectMix.cupSize.capacityOz} oz Cup
                  </p>
                </div>
              </div>

              {activeInspectMix.tagline && (
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs italic text-slate-300">
                  "{activeInspectMix.tagline}"
                </div>
              )}

              {/* Nutrition Summary Bar */}
              <div className="grid grid-cols-3 gap-2 text-center p-3 rounded-2xl bg-black/40 border border-white/5">
                <div>
                  <div className="text-[10px] font-black uppercase text-amber-400">Caffeine</div>
                  <div className="text-sm font-black text-white">{activeInspectMix.caffeineMg || 0} mg</div>
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase text-pink-400">Sugar</div>
                  <div className="text-sm font-black text-white">{activeInspectMix.sugarGrams || 0} g</div>
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase text-cyan-400">Energy</div>
                  <div className="text-sm font-black text-white">{activeInspectMix.calories || 0} kcal</div>
                </div>
              </div>

              {/* Full Formula Breakdown */}
              <div className="space-y-2">
                <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Full Recipe Formula ({activeInspectMix.recipeItems.length} Elements)
                </h5>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {activeInspectMix.recipeItems.map(it => (
                    <div
                      key={it.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-white/5 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: it.color }} />
                        <span className="font-bold text-white">{it.name}</span>
                        <span className="text-[10px] text-slate-400">({it.quantity} {it.unit})</span>
                      </div>
                      <span className="font-bold text-amber-400">₱{it.totalPrice}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit a Review Form */}
              <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                    Review & Rate this Mix
                  </span>
                  {/* Star Selector */}
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewRating(star)}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            star <= newRating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write your taste impression or recommendation..."
                    maxLength={140}
                    className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    onClick={() => handlePostReview(activeInspectMix.id)}
                    disabled={isSubmittingReview || !newComment.trim()}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Post</span>
                  </button>
                </div>
              </div>

              {/* Community Reviews List */}
              <div className="space-y-2">
                <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Reviews & Suggestions ({activeInspectMix.reviews?.length || 0})
                </h5>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {(!activeInspectMix.reviews || activeInspectMix.reviews.length === 0) ? (
                    <p className="text-xs text-slate-500 italic p-2">
                      No reviews yet. Be the first to try this formula and leave feedback!
                    </p>
                  ) : (
                    activeInspectMix.reviews.map(rev => (
                      <div key={rev.id} className="p-3 rounded-xl bg-slate-950 border border-white/5 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-300">{rev.userName}</span>
                          <div className="flex items-center text-amber-400 gap-0.5">
                            {[...Array(rev.rating)].map((_, i) => (
                              <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-slate-300 leading-snug">{rev.comment}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Action Buttons in Inspect Modal */}
              <div className="flex gap-2 pt-2 border-t border-white/10">
                <button
                  onClick={() => {
                    onRemixInStudio(activeInspectMix);
                    setActiveInspectMix(null);
                    onClose();
                  }}
                  className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <FlaskConical className="w-4 h-4 text-amber-400" />
                  <span>Remix in Lab</span>
                </button>

                <button
                  onClick={() => {
                    onOrderMix(activeInspectMix);
                    setActiveInspectMix(null);
                    onClose();
                  }}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all active:scale-95"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Order Drink Now (₱{activeInspectMix.totalPrice})</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
