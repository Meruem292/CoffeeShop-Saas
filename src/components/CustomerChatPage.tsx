import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, 
  X, 
  Send, 
  Image as ImageIcon, 
  Sparkles, 
  Coffee, 
  Receipt, 
  Mic, 
  Square, 
  Play, 
  Pause, 
  ShoppingBag, 
  Smile, 
  Search, 
  ChevronRight, 
  ChevronLeft, 
  Phone, 
  Video, 
  Info,
  CheckCheck,
  ArrowLeft,
  HelpCircle,
  ExternalLink,
  Bot
} from 'lucide-react';
import { ChatMessage, Product, Order } from '../types';

interface SendMessagePayload {
  text: string;
  imageUrl?: string;
  audioUrl?: string;
  audioDuration?: number;
  productCard?: {
    id: string;
    name: string;
    price: number;
    image: string;
    category?: string;
  };
  orderCard?: {
    id: string;
    total: number;
    status: string;
    itemSummary: string;
    createdAt: number;
  };
}

interface CustomerChatPageProps {
  messages: ChatMessage[];
  unreadCount: number;
  onSendMessage: (payload: SendMessagePayload) => Promise<any>;
  onToggleReaction?: (messageId: string, emoji: string) => void;
  customerName: string;
  customerEmail?: string;
  customerPhoto?: string;
  shopName?: string;
  shopLogo?: string;
  products?: Product[];
  orders?: Order[];
  onAddToCart?: (product: Product) => void;
  currentUserId?: string;
  onBack?: () => void;
}

const EMOJI_LIST = ['👍', '❤️', '☕', '🔥', '🎉'];

const QUICK_TEMPLATES = [
  "☕ Order status update?",
  "📱 Need help with GCash payment",
  "⚡ Can I add extra shot / customization?",
  "📍 What are your store hours & location?"
];

// Custom Audio Player for Voice Notes
function AudioPlayer({ src, duration }: { src: string; duration?: number }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200/50 dark:border-white/5 my-1 min-w-[210px]">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={() => {
          if (audioRef.current) {
            const current = audioRef.current.currentTime;
            const dur = audioRef.current.duration || duration || 1;
            setProgress((current / dur) * 100);
          }
        }}
        onEnded={() => {
          setIsPlaying(false);
          setProgress(0);
        }}
      />
      <button
        type="button"
        onClick={togglePlay}
        className="w-8 h-8 rounded-full bg-amber-500 text-slate-900 flex items-center justify-center shrink-0 hover:scale-105 active:scale-95 transition-all shadow-sm"
      >
        {isPlaying ? <Pause className="w-3.5 h-3.5 fill-slate-900 text-slate-900" /> : <Play className="w-3.5 h-3.5 fill-slate-900 text-slate-900 ml-0.5" />}
      </button>

      <div className="flex-1 space-y-1">
        <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full bg-amber-500 transition-all duration-100" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between items-center text-[9px] text-slate-500 dark:text-slate-400 font-bold">
          <span>Voice Audio Note</span>
          <span>{duration ? `${duration}s` : 'Audio'}</span>
        </div>
      </div>
    </div>
  );
}

export function CustomerChatPage({
  messages,
  unreadCount,
  onSendMessage,
  onToggleReaction,
  customerName,
  customerEmail,
  customerPhoto,
  shopName = 'CAIDOZ Coffee',
  shopLogo,
  products = [],
  orders = [],
  onAddToCart,
  currentUserId = 'guest',
  onBack
}: CustomerChatPageProps) {
  const [inputText, setInputText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [showOrderPicker, setShowOrderPicker] = useState(false);
  const [showOptionsPanel, setShowOptionsPanel] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [sending, setSending] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [activeReactionMsgId, setActiveReactionMsgId] = useState<string | null>(null);

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle image upload from device
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      alert('Image file is too large. Please select an image under 4MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImageUrl(event.target.result as string);
        setShowImageInput(true);
      }
    };
    reader.readAsDataURL(file);
  };

  // Audio recorder
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          try {
            setSending(true);
            await onSendMessage({
              text: '',
              audioUrl: base64Audio,
              audioDuration: recordingSeconds || 3
            });
          } catch (e) {
            console.error('Failed to send voice note:', e);
          } finally {
            setSending(false);
            setRecordingSeconds(0);
          }
        };
        reader.readAsDataURL(audioBlob);

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Mic permission error:', err);
      alert('Microphone access is required to record voice notes.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      audioChunksRef.current = [];
      setIsRecording(false);
      clearInterval(timerRef.current);
      setRecordingSeconds(0);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!inputText.trim() && !imageUrl.trim()) || sending) return;

    try {
      setSending(true);
      const textToSend = inputText;
      const imgToSend = imageUrl;
      setInputText('');
      setImageUrl('');
      setShowImageInput(false);
      await onSendMessage({ text: textToSend, imageUrl: imgToSend || undefined });
    } catch (err) {
      console.error('Failed to send chat message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleSendOrderCard = async (order: Order) => {
    try {
      setSending(true);
      setShowOrderPicker(false);
      const itemSummary = order.items.map(i => `${i.quantity}x ${i.name}`).join(', ');
      await onSendMessage({
        text: `Inquiring about Order #${order.id?.slice(-4)}`,
        orderCard: {
          id: order.id || 'ORDER',
          total: order.total,
          status: order.status,
          itemSummary,
          createdAt: order.createdAt
        }
      });
    } catch (e) {
      console.error('Failed to share order card:', e);
    } finally {
      setSending(false);
    }
  };

  const filteredMessages = messages.filter((m) =>
    !searchFilter ? true : m.text.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-white dark:bg-[#0c1220] text-slate-900 dark:text-slate-100 overflow-hidden relative">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Main Top Facebook Messenger Header */}
      <div className="px-4 py-3 bg-white dark:bg-[#0c1220] border-b border-black/5 dark:border-white/5 flex items-center justify-between shrink-0 shadow-sm z-20 sticky top-0">
        <div className="flex items-center gap-3 min-w-0">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-amber-500 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 rounded-full transition-all shrink-0"
              title="Go Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          {/* Barista Avatar with Green Online Badge */}
          <div className="relative shrink-0">
            <div className="w-11 h-11 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center font-black text-base uppercase border border-amber-500/20 overflow-hidden shadow-inner">
              {shopLogo ? (
                <img src={shopLogo} alt={shopName} className="w-full h-full object-cover" />
              ) : (
                <Coffee className="w-5 h-5" />
              )}
            </div>
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-[#0c1220] shadow-sm" />
          </div>

          <div className="min-w-0">
            <h2 className="font-extrabold text-base text-slate-900 dark:text-white truncate flex items-center gap-1.5">
              <span>{shopName} Support</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            </h2>
            <p className="text-[10px] text-green-500 font-extrabold flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span>Barista Active Now</span>
            </p>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => alert('Connecting voice call to store cashier...')}
            className="p-2.5 text-slate-500 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-all"
            title="Voice Call Barista"
          >
            <Phone className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => alert('Starting video call stream with coffee shop...')}
            className="p-2.5 text-slate-500 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-all"
            title="Video Call Barista"
          >
            <Video className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => setShowOptionsPanel(!showOptionsPanel)}
            className={`p-2.5 rounded-full transition-all ${
              showOptionsPanel ? 'bg-amber-500/10 text-amber-500' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
            title="Store Info & FAQs"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* Main Conversation Column */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-slate-50/50 dark:bg-[#0c1220]">
          {/* Internal Search bar */}
          {messages.length > 3 && (
            <div className="px-4 py-2 bg-white dark:bg-slate-900 border-b border-black/5 dark:border-white/5 flex items-center gap-2 text-xs shrink-0">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search conversation..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="bg-transparent border-none text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none flex-1 font-medium"
              />
              {searchFilter && (
                <button type="button" onClick={() => setSearchFilter('')} className="text-slate-400 hover:text-slate-900 dark:hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Conversation Messages Stream (Full Messenger Rounded Corner Grouping) */}
          <div className="flex-1 min-h-0 p-4 md:p-6 overflow-y-auto space-y-1 bg-slate-50/50 dark:bg-[#0c1220]/50 scrollbar-hide">
            {filteredMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <div className="w-20 h-20 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center font-black text-2xl uppercase mb-4 border border-amber-500/20 shadow-inner">
                  {shopLogo ? (
                    <img src={shopLogo} alt={shopName} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <Coffee className="w-10 h-10 text-amber-500 animate-bounce" />
                  )}
                </div>

                <h3 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wider mb-1 font-display">
                  Live Customer Support
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed mb-6">
                  Chat directly with our store baristas! Ask about menu recommendations, order customization, GCash confirmation, or store pickup.
                </p>

                {/* Quick inquiry triggers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
                  {QUICK_TEMPLATES.map((tmpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setInputText(tmpl)}
                      className="text-xs font-bold bg-white dark:bg-white/5 hover:bg-amber-500/10 border border-slate-200 dark:border-white/10 hover:border-amber-500/30 text-slate-800 dark:text-slate-200 p-3 rounded-2xl transition-all text-left shadow-sm flex items-center justify-between group"
                    >
                      <span className="truncate pr-2">{tmpl}</span>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 transition-colors shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              filteredMessages.map((msg, index) => {
                const isAdminMsg = msg.senderRole === 'admin';
                
                // Smart Messenger grouping logic (2 min threshold)
                const prevMsg = index > 0 ? filteredMessages[index - 1] : null;
                const nextMsg = index < filteredMessages.length - 1 ? filteredMessages[index + 1] : null;

                const isConsecutiveWithPrev = prevMsg && 
                  prevMsg.senderRole === msg.senderRole && 
                  (new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() < 120000);

                const isConsecutiveWithNext = nextMsg && 
                  nextMsg.senderRole === msg.senderRole && 
                  (new Date(nextMsg.createdAt).getTime() - new Date(msg.createdAt).getTime() < 120000);

                // Corner radii matching Messenger
                let roundedClasses = 'rounded-2xl';
                if (!isAdminMsg) {
                  // Customer message (right side)
                  if (isConsecutiveWithPrev && isConsecutiveWithNext) {
                    roundedClasses = 'rounded-2xl rounded-r-md';
                  } else if (isConsecutiveWithPrev) {
                    roundedClasses = 'rounded-2xl rounded-tr-md rounded-br-2xl';
                  } else if (isConsecutiveWithNext) {
                    roundedClasses = 'rounded-2xl rounded-tr-2xl rounded-br-md';
                  } else {
                    roundedClasses = 'rounded-2xl rounded-tr-sm';
                  }
                } else {
                  // Admin message (left side)
                  if (isConsecutiveWithPrev && isConsecutiveWithNext) {
                    roundedClasses = 'rounded-2xl rounded-l-md';
                  } else if (isConsecutiveWithPrev) {
                    roundedClasses = 'rounded-2xl rounded-tl-md rounded-bl-2xl';
                  } else if (isConsecutiveWithNext) {
                    roundedClasses = 'rounded-2xl rounded-tl-2xl rounded-bl-md';
                  } else {
                    roundedClasses = 'rounded-2xl rounded-tl-sm';
                  }
                }

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${!isAdminMsg ? 'items-end' : 'items-start'} ${
                      isConsecutiveWithPrev ? 'mt-0.5' : 'mt-4'
                    } group relative max-w-[85%] ${!isAdminMsg ? 'ml-auto' : 'mr-auto'}`}
                  >
                    {/* Header line: Sender Name + Timestamp (only on first of group) */}
                    {!isConsecutiveWithPrev && (
                      <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] font-bold text-slate-400">
                        <span>
                          {isAdminMsg ? `${shopName} Barista` : 'You'}
                        </span>
                        <span>•</span>
                        <span>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )}

                    <div className="flex items-end gap-2 max-w-full relative">
                      <div
                        onClick={() => setActiveReactionMsgId(activeReactionMsgId === msg.id ? null : msg.id)}
                        className={`p-3.5 text-xs font-medium leading-relaxed shadow-sm transition-all cursor-pointer select-none ${roundedClasses} ${
                          !isAdminMsg
                            ? 'bg-amber-500 text-slate-900 font-semibold'
                            : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-100 dark:border-slate-800/80'
                        }`}
                      >
                        {/* Image Attachment */}
                        {msg.imageUrl && (
                          <div className="mb-2 rounded-xl overflow-hidden border border-black/5 dark:border-white/5 cursor-zoom-in">
                            <img
                              src={msg.imageUrl}
                              onClick={() => setZoomedImage(msg.imageUrl || null)}
                              alt="Attachment"
                              className="w-full max-h-60 object-cover rounded-xl hover:scale-105 transition-all"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )}

                        {/* Voice Note Player */}
                        {msg.audioUrl && (
                          <AudioPlayer src={msg.audioUrl} duration={msg.audioDuration} />
                        )}

                        {/* Recommendation Product Card */}
                        {msg.productCard && (
                          <div className="my-1.5 p-3 bg-black/5 dark:bg-black/30 rounded-xl border border-black/5 flex items-center gap-3">
                            <img
                              src={msg.productCard.image}
                              alt={msg.productCard.name}
                              className="w-12 h-12 rounded-lg object-cover shrink-0 border border-amber-500/20"
                            />
                            <div className="flex-1 min-w-0">
                              <span className="text-[8px] uppercase font-extrabold tracking-wider text-amber-500 dark:text-amber-400">
                                Barista Recommendation
                              </span>
                              <h5 className="font-extrabold text-xs truncate text-slate-900 dark:text-white mt-0.5">
                                {msg.productCard.name}
                              </h5>
                              <span className="text-[10px] font-bold text-amber-500">₱{msg.productCard.price}</span>
                            </div>
                            {onAddToCart && products.find(p => p.id === msg.productCard?.id) && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const prod = products.find(p => p.id === msg.productCard?.id);
                                  if (prod) {
                                    onAddToCart(prod);
                                    alert(`${prod.name} added to your basket!`);
                                  }
                                }}
                                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-extrabold text-[10px] rounded-lg shadow-sm transition-all uppercase tracking-wider shrink-0"
                              >
                                Add
                              </button>
                            )}
                          </div>
                        )}

                        {/* Order Receipt Card */}
                        {msg.orderCard && (
                          <div className="my-1.5 p-3 bg-black/5 dark:bg-black/30 rounded-xl border border-black/5 space-y-1">
                            <div className="flex justify-between items-center text-[9px] font-extrabold uppercase tracking-wide">
                              <span className="text-amber-500">Order #{msg.orderCard.id.slice(-4)}</span>
                              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30">
                                {msg.orderCard.status}
                              </span>
                            </div>
                            <p className="text-[10px] opacity-90 font-medium truncate">{msg.orderCard.itemSummary}</p>
                            <div className="text-[10px] font-bold pt-1 border-t border-black/5">Total: ₱{msg.orderCard.total.toLocaleString()}</div>
                          </div>
                        )}

                        {/* Text Message */}
                        {msg.text && <p className="whitespace-pre-wrap break-words">{msg.text}</p>}

                        {/* Reaction Pills */}
                        {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5 pt-1.5 border-t border-black/5 dark:border-white/5">
                            {Object.entries(msg.reactions).map(([emoji, uids]) => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleReaction && onToggleReaction(msg.id, emoji);
                                }}
                                className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border transition-all ${
                                  uids.includes(currentUserId)
                                    ? 'bg-amber-400 text-slate-900 border-amber-300 shadow-sm'
                                    : 'bg-slate-100 dark:bg-white/5 text-slate-500 border-transparent hover:border-slate-300'
                                }`}
                              >
                                <span>{emoji}</span>
                                <span>{uids.length}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Floating Emoji Reaction Bar on Tap/Hover */}
                      {activeReactionMsgId === msg.id && (
                        <div className="absolute bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-xl px-2 py-1 rounded-full flex gap-1 z-50 -top-8 animate-in fade-in slide-in-from-bottom-2 duration-150"
                          style={{ [!isAdminMsg ? 'right' : 'left']: '0px' }}
                        >
                          {EMOJI_LIST.map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleReaction && onToggleReaction(msg.id, emoji);
                                setActiveReactionMsgId(null);
                              }}
                              className="hover:scale-130 transition-transform text-sm px-1"
                              title={emoji}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Delivery Status Indicator */}
                    {index === filteredMessages.length - 1 && !isAdminMsg && (
                      <div className="flex items-center gap-1 mt-1 px-1 text-[9px] text-slate-400 font-medium">
                        <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                        <span>Seen by Barista</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Recording Voice Note Bar */}
          {isRecording && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border-t border-rose-500/20 flex items-center justify-between shrink-0 animate-pulse">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                <span className="text-xs font-semibold text-rose-700 dark:text-rose-200">
                  Recording Voice Audio... {Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, '0')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={cancelRecording}
                  className="px-3 py-1.5 rounded-full bg-slate-200 dark:bg-white/10 hover:bg-slate-300 text-xs text-slate-700 dark:text-white font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={stopRecording}
                  className="px-4 py-1.5 rounded-full bg-rose-500 hover:bg-rose-400 text-xs text-white font-extrabold flex items-center gap-1 shadow-sm"
                >
                  <Square className="w-3.5 h-3.5 fill-white" /> Send Voice Note
                </button>
              </div>
            </div>
          )}

          {/* Share Past Orders Drawer */}
          {showOrderPicker && (
            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-white/5 max-h-56 overflow-y-auto space-y-2 shrink-0 shadow-inner">
              <div className="flex justify-between items-center text-xs font-black text-amber-500 uppercase tracking-wider mb-1">
                <span>Select Order to Share with Barista</span>
                <button type="button" onClick={() => setShowOrderPicker(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {orders.length === 0 ? (
                <div className="text-xs text-slate-400 text-center py-3">No past store orders found</div>
              ) : (
                orders.map((ord) => (
                  <button
                    key={ord.id}
                    type="button"
                    onClick={() => handleSendOrderCard(ord)}
                    className="w-full p-3 bg-slate-50 dark:bg-white/5 hover:bg-amber-500/10 border border-slate-100 dark:border-white/10 rounded-xl flex justify-between items-center text-left text-xs transition-all"
                  >
                    <div>
                      <span className="font-extrabold text-amber-500">Order #{ord.id?.slice(-4)}</span>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[240px] mt-0.5">
                        {ord.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                      </p>
                    </div>
                    <span className="font-extrabold text-slate-900 dark:text-slate-100">₱{ord.total}</span>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Image Input Drawer */}
          {showImageInput && !isRecording && (
            <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-white/5 flex items-center gap-2 shadow-inner">
              <ImageIcon className="w-4 h-4 text-amber-500 shrink-0" />
              <input
                type="text"
                placeholder="Paste photo link/URL..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="flex-1 bg-slate-100 dark:bg-white/5 border border-transparent focus:border-amber-500/30 rounded-full px-4 py-2 text-xs focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  setShowImageInput(false);
                  setImageUrl('');
                }}
                className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Main Messenger Composer Pill Footer */}
          {!isRecording && (
            <form onSubmit={handleSend} className="p-3 md:p-4 bg-white dark:bg-[#0c1220] border-t border-black/5 flex items-center gap-1.5 shrink-0">
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-2.5 rounded-full transition-all ${
                    imageUrl
                      ? 'bg-amber-500 text-slate-900'
                      : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-white'
                  }`}
                  title="Upload Image"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>

                {orders.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowOrderPicker(!showOrderPicker)}
                    className="p-2.5 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-amber-500 transition-all"
                    title="Share Order Invoice"
                  >
                    <Receipt className="w-5 h-5" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={startRecording}
                  className="p-2.5 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-rose-500 transition-all"
                  title="Record Voice Note"
                >
                  <Mic className="w-5 h-5" />
                </button>
              </div>

              {/* Text Input Pill */}
              <div className="flex-1 relative flex items-center min-w-0">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Aa"
                  className="w-full bg-slate-100 dark:bg-white/5 border border-transparent focus:border-amber-500/20 rounded-full pl-4 pr-10 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none font-medium"
                />
                <button
                  type="button"
                  onClick={() => setInputText(prev => prev + ' 😊')}
                  className="absolute right-3 text-slate-400 hover:text-amber-500 transition-colors"
                  title="Insert Emoji"
                >
                  <Smile className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Send Button */}
              <button
                type="submit"
                disabled={(!inputText.trim() && !imageUrl.trim()) || sending}
                className="p-2.5 rounded-full bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-900 font-bold transition-all shadow-sm active:scale-95 shrink-0 flex items-center justify-center"
              >
                <Send className="w-4.5 h-4.5 fill-slate-900 text-slate-900" />
              </button>
            </form>
          )}
        </div>

        {/* Collapsible Store Information & FAQ Panel */}
        {showOptionsPanel && (
          <div className="w-72 border-l border-black/5 dark:border-white/5 flex flex-col bg-white dark:bg-[#0c1220] p-5 overflow-y-auto space-y-6 shrink-0 shadow-lg animate-in slide-in-from-right duration-200">
            <div className="text-center pb-4 border-b border-slate-100 dark:border-white/5">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center font-black text-2xl uppercase mx-auto mb-2 border border-amber-500/20 shadow-inner">
                {shopName.charAt(0)}
              </div>
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                {shopName} Support
              </h4>
              <p className="text-[10px] text-slate-400 font-extrabold uppercase mt-0.5">
                Live Store Assistance
              </p>
            </div>

            <div className="space-y-3">
              <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Frequently Asked
              </h5>
              
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => alert('GCash payments are processed securely! Upload your screenshot directly in this chat.')}
                  className="w-full text-left p-3 bg-slate-50 dark:bg-white/5 hover:bg-amber-500/10 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 transition-all flex items-center justify-between"
                >
                  <span>GCash Payment Help</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  type="button"
                  onClick={() => alert('Store hours: Open daily from 7:00 AM to 10:00 PM.')}
                  className="w-full text-left p-3 bg-slate-50 dark:bg-white/5 hover:bg-amber-500/10 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 transition-all flex items-center justify-between"
                >
                  <span>Store Hours & Location</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  type="button"
                  onClick={() => alert('Vouchers can be claimed in the Rewards tab!')}
                  className="w-full text-left p-3 bg-slate-50 dark:bg-white/5 hover:bg-amber-500/10 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 transition-all flex items-center justify-between"
                >
                  <span>Vouchers & Rewards Guide</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-white/5 text-[10px] text-slate-400 font-medium text-center leading-relaxed">
              Real-time customer service connected to {shopName}.
            </div>
          </div>
        )}
      </div>

      {/* Image Zoom Modal */}
      {zoomedImage && (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <button
            type="button"
            onClick={() => setZoomedImage(null)}
            className="absolute top-5 right-5 p-3 text-white/70 hover:text-white bg-white/10 rounded-full transition-all"
          >
            <X className="w-6 h-6" />
          </button>
          <img src={zoomedImage} alt="Enlarged Attachment" className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl" />
        </div>
      )}
    </div>
  );
}
