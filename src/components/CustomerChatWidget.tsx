import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, 
  X, 
  Send, 
  Image as ImageIcon, 
  Sparkles, 
  Bot, 
  User, 
  Clock, 
  CheckCheck, 
  Maximize2, 
  Minimize2, 
  Coffee,
  HelpCircle,
  Receipt,
  Mic,
  Square,
  Play,
  Pause,
  ShoppingBag,
  Plus,
  Smile,
  Search,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  Phone,
  Video,
  Info
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

interface CustomerChatWidgetProps {
  messages: ChatMessage[];
  unreadCount: number;
  isLoading?: boolean;
  onSendMessage: (payload: SendMessagePayload) => Promise<any>;
  onToggleReaction?: (messageId: string, emoji: string) => void;
  customerName: string;
  shopName?: string;
  shopLogo?: string;
  products?: Product[];
  orders?: Order[];
  onAddToCart?: (product: Product, quantity?: number) => void;
  currentUserId?: string;
}

const EMOJI_LIST = ['👍', '❤️', '☕', '🔥', '🎉'];

const QUICK_TEMPLATES = [
  "☕ Order status update?",
  "📱 Need help with GCash payment",
  "⚡ Can I add extra shot / customization?",
  "📍 What are your store hours & location?"
];

// Custom Audio Player for Voice Notes (High Fidelity)
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
    <div className="flex items-center gap-3 bg-slate-100 dark:bg-[#1e293b]/50 p-2.5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 my-1 min-w-[200px]">
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
        <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-amber-500 transition-all duration-100" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between items-center text-[9px] text-slate-500 dark:text-slate-400 font-semibold">
          <span>Voice Note</span>
          <span>{duration ? `${duration}s` : 'Audio'}</span>
        </div>
      </div>
    </div>
  );
}

export function CustomerChatWidget({
  messages,
  unreadCount,
  isLoading,
  onSendMessage,
  onToggleReaction,
  customerName,
  shopName = 'CAIDOZ Coffee',
  shopLogo,
  products = [],
  orders = [],
  onAddToCart,
  currentUserId = 'guest'
}: CustomerChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputText, setInputText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [showOrderPicker, setShowOrderPicker] = useState(false);
  const [showOptionsPanel, setShowOptionsPanel] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [sending, setSending] = useState(false);
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
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Handle file photo selection
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      alert('Image file is too large. Please select an image under 3MB.');
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

  // Voice recording triggers
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
      console.error('Mic permission denied or not available:', err);
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
    <>
      {/* Hidden File Input for Image Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Floating Toggle Button (Messenger Pill Style) */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {!isOpen && unreadCount > 0 && (
          <div 
            onClick={() => setIsOpen(true)}
            className="mb-3 max-w-[280px] sm:max-w-xs bg-slate-900/95 dark:bg-[#0c1220]/95 border-2 border-amber-500 text-white p-3.5 rounded-2xl shadow-2xl backdrop-blur-xl cursor-pointer hover:border-amber-400 transition-all group relative animate-bounce"
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-1.5 text-amber-400 font-extrabold text-[10px] uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Live Support</span>
              </div>
              <span className="px-2 py-0.5 bg-rose-500 text-white font-black text-[9px] rounded-full shadow-md animate-pulse">
                {unreadCount} New
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-100 line-clamp-2 leading-snug">
              "{messages.length > 0 ? (messages[messages.length - 1].text || 'Sent an attachment') : 'Store staff sent a message'}"
            </p>
            <div className="mt-2 flex items-center justify-between text-[10px] font-bold text-amber-400 group-hover:text-amber-300">
              <span>Tap to reply now</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        )}

        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`relative w-14 h-14 rounded-full bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-400 text-slate-900 shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center border-2 border-white/20 group ${
            !isOpen && unreadCount > 0 ? 'ring-4 ring-rose-500 animate-pulse' : ''
          }`}
          aria-label="Open Support Live Chat"
        >
          {isOpen ? (
            <X className="w-6 h-6 text-slate-900 transition-transform group-hover:rotate-90" />
          ) : (
            <>
              <MessageSquare className="w-6 h-6 text-slate-900 fill-slate-900" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[22px] h-5 px-1 rounded-full bg-rose-500 text-white font-black text-[11px] flex items-center justify-center border-2 border-white dark:border-[#0c1220] animate-bounce shadow-xl">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </>
          )}
        </button>
      </div>

      {/* High Fidelity Messenger Mobile/Desktop Responsive Chat Screen */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-300 flex flex-col bg-white dark:bg-[#0c1220] text-slate-950 dark:text-slate-100 md:border md:border-black/5 md:dark:border-white/10 shadow-2xl overflow-hidden ${
            isExpanded
              ? 'inset-0 md:inset-12 md:rounded-3xl'
              : 'inset-0 md:inset-auto md:bottom-24 md:right-6 md:w-[420px] md:h-[650px] md:max-h-[85vh] md:rounded-[2rem]'
          }`}
        >
          {/* Main Messenger Header */}
          <div className="px-4 py-3 border-b border-black/5 dark:border-white/5 flex items-center justify-between shrink-0 bg-white dark:bg-[#0c1220] z-20 sticky top-0">
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Back / Collapse Button */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-white/5 rounded-full transition-all shrink-0"
                title="Collapse Chat"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Shop Logo Avatar with Status Badge */}
              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center font-black text-sm uppercase border border-amber-500/20 overflow-hidden shadow-inner">
                  {shopLogo ? (
                    <img src={shopLogo} alt={shopName} className="w-full h-full object-cover" />
                  ) : (
                    <Coffee className="w-4 h-4" />
                  )}
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-[#0c1220] shadow-sm" />
              </div>

              {/* Identity info */}
              <div className="min-w-0">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                  {shopName} Support
                </h3>
                <p className="text-[10px] text-green-500 dark:text-green-400 font-bold flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span>Active Now</span>
                </p>
              </div>
            </div>

            {/* Standard Messenger Utility Actions */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                className="p-2 text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-all"
                onClick={() => alert('Initiating secure voice line connection...')}
                title="Voice Call"
              >
                <Phone className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="p-2 text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-all"
                onClick={() => alert('Starting secure high-definition video call...')}
                title="Video Call"
              >
                <Video className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setShowOptionsPanel(!showOptionsPanel)}
                className={`p-2 rounded-full transition-all ${
                  showOptionsPanel ? 'bg-amber-500/10 text-amber-500' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
                title="View Support Options"
              >
                <Info className="w-4 h-4" />
              </button>
              
              <div className="w-px h-4 bg-slate-200 dark:bg-slate-800 mx-1 hidden md:block" />

              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="hidden md:flex p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-all"
                title={isExpanded ? 'Collapse Widget' : 'Expand Widget'}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex-1 flex min-h-0 overflow-hidden">
            {/* Main Chat Stream Container */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* Internal search filter */}
              {messages.length > 5 && (
                <div className="px-4 py-2 bg-slate-50 dark:bg-black/10 border-b border-black/5 flex items-center gap-2 text-xs shrink-0">
                  <Search className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search messages..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="bg-transparent border-none text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none flex-1 font-medium"
                  />
                  {searchFilter && (
                    <button type="button" onClick={() => setSearchFilter('')} className="text-slate-400 hover:text-slate-900 dark:hover:text-white">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

              {/* Message List Stream (Fidelity Bubble Grouping layout) */}
              <div className="flex-1 min-h-0 p-4 overflow-y-auto space-y-1 bg-slate-50/50 dark:bg-[#0c1220]/30 scrollbar-hide">
                {isLoading ? (
                  <div className="space-y-4 py-8 animate-pulse">
                    <div className="flex items-start gap-2 max-w-[85%]">
                      <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
                      <div className="space-y-1.5">
                        <div className="h-8 w-40 bg-slate-200 dark:bg-slate-800 rounded-2xl rounded-tl-sm" />
                        <div className="h-5 w-20 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
                      </div>
                    </div>
                    <div className="flex items-start justify-end gap-2 max-w-[85%] ml-auto">
                      <div className="space-y-1.5 flex flex-col items-end">
                        <div className="h-8 w-32 bg-amber-500/10 dark:bg-amber-500/5 rounded-2xl rounded-tr-sm border border-amber-500/20" />
                      </div>
                      <div className="w-7 h-7 rounded-full bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/20 shrink-0" />
                    </div>
                  </div>
                ) : filteredMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                    <Coffee className="w-12 h-12 mb-3 text-amber-500/30 animate-bounce" />
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider mb-1">
                      Welcome to Support
                    </h4>
                    <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                      Ask store staff or barista anything about the menu, customizing orders, or GCash payments!
                    </p>

                    {/* Quick inquiry template triggers */}
                    <div className="mt-6 flex flex-col gap-2 w-full max-w-xs">
                      {QUICK_TEMPLATES.map((tmpl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setInputText(tmpl)}
                          className="text-[11px] font-semibold bg-white dark:bg-white/5 hover:bg-amber-500/10 border border-slate-200 dark:border-white/10 hover:border-amber-500/20 text-slate-700 dark:text-slate-200 p-2.5 rounded-2xl transition-all text-left shadow-sm flex items-center justify-between group"
                        >
                          <span>{tmpl}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-500 transition-colors" />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  filteredMessages.map((msg, index) => {
                    const isAdminMsg = msg.senderRole === 'admin';
                    
                    // Grouping variables
                    const prevMsg = index > 0 ? filteredMessages[index - 1] : null;
                    const nextMsg = index < filteredMessages.length - 1 ? filteredMessages[index + 1] : null;

                    const isConsecutiveWithPrev = prevMsg && 
                      prevMsg.senderRole === msg.senderRole && 
                      (new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() < 120000);

                    const isConsecutiveWithNext = nextMsg && 
                      nextMsg.senderRole === msg.senderRole && 
                      (new Date(nextMsg.createdAt).getTime() - new Date(msg.createdAt).getTime() < 120000);

                    // Dynamic Bubble Border Radii
                    let roundedClasses = 'rounded-2xl';
                    if (!isAdminMsg) {
                      // Customer bubble (right side)
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
                      // Admin bubble (left side)
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
                          isConsecutiveWithPrev ? 'mt-0.5' : 'mt-3.5'
                        } group relative max-w-[85%] ${!isAdminMsg ? 'ml-auto' : 'mr-auto'}`}
                      >
                        {/* Group Header info (only when not consecutive with previous) */}
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
                            className={`p-3 text-xs font-medium leading-relaxed shadow-sm transition-all cursor-pointer select-none ${roundedClasses} ${
                              !isAdminMsg
                                ? 'bg-amber-500 text-slate-900 font-semibold'
                                : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-100 dark:border-slate-800/80'
                            }`}
                          >
                            {/* Image attachment file */}
                            {msg.imageUrl && (
                              <div className="mb-2 rounded-xl overflow-hidden border border-black/5 dark:border-white/5">
                                <img
                                  src={msg.imageUrl}
                                  alt="Attachment"
                                  className="w-full max-h-52 object-cover rounded-xl"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                            )}

                            {/* Voice audio note note */}
                            {msg.audioUrl && (
                              <AudioPlayer src={msg.audioUrl} duration={msg.audioDuration} />
                            )}

                            {/* Product selection card */}
                            {msg.productCard && (
                              <div className="my-1.5 p-3 bg-black/5 dark:bg-black/30 rounded-xl border border-black/5 flex items-center gap-3">
                                <img
                                  src={msg.productCard.image}
                                  alt={msg.productCard.name}
                                  className="w-10 h-10 rounded-lg object-cover shrink-0 border border-amber-500/20"
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
                                    className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-extrabold text-[9px] rounded-lg shadow-sm transition-all uppercase tracking-wider shrink-0"
                                  >
                                    Add
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Order summary card */}
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

                            {/* Main text content */}
                            {msg.text && <p className="whitespace-pre-wrap break-words">{msg.text}</p>}

                            {/* Message Reaction Pills */}
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

                          {/* Float Reactions Trigger bar on Tap/Hover */}
                          {(activeReactionMsgId === msg.id) && (
                            <div className="absolute bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-xl px-2 py-1 rounded-full flex gap-1 z-50 -top-8 animate-in fade-in slide-in-from-bottom-2 duration-150"
                              style={{ [isAdminMsg ? 'left' : 'right']: '0px' }}
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
                                  className="hover:scale-130 transition-transform text-sm px-0.5"
                                  title={emoji}
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Read delivery state */}
                        {index === filteredMessages.length - 1 && !isAdminMsg && (
                          <div className="flex items-center gap-1 mt-1 px-1 text-[9px] text-slate-400 font-medium">
                            <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                            <span>Seen</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Voice Note Recording Overlay Panel */}
              {isRecording && (
                <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border-t border-rose-500/20 flex items-center justify-between shrink-0 animate-pulse">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                    <span className="text-xs font-semibold text-rose-700 dark:text-rose-200">
                      Recording Audio... {Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={cancelRecording}
                      className="px-3 py-1.5 rounded-full bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-xs text-slate-700 dark:text-white font-bold"
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

              {/* Share past orders drawer */}
              {showOrderPicker && (
                <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-white/5 max-h-48 overflow-y-auto space-y-2 shrink-0 shadow-inner">
                  <div className="flex justify-between items-center text-xs font-black text-amber-500 uppercase tracking-wider mb-1">
                    <span>Select Order to Share</span>
                    <button type="button" onClick={() => setShowOrderPicker(false)} className="text-slate-400 hover:text-slate-950 dark:hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {orders.length === 0 ? (
                    <div className="text-xs text-slate-400 text-center py-2">No past store orders found</div>
                  ) : (
                    orders.map((ord) => (
                      <button
                        key={ord.id}
                        type="button"
                        onClick={() => handleSendOrderCard(ord)}
                        className="w-full p-2.5 bg-slate-50 dark:bg-white/5 hover:bg-amber-500/10 border border-slate-100 dark:border-white/10 rounded-xl flex justify-between items-center text-left text-xs transition-all"
                      >
                        <div>
                          <span className="font-extrabold text-amber-500">#{ord.id?.slice(-4)}</span>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[200px] mt-0.5">
                            {ord.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                          </p>
                        </div>
                        <span className="font-bold text-slate-900 dark:text-slate-200">₱{ord.total}</span>
                      </button>
                    ))
                  )}
                </div>
              )}

              {/* Photo selector input bar */}
              {showImageInput && !isRecording && (
                <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-white/5 flex items-center gap-2 shadow-inner">
                  <ImageIcon className="w-4 h-4 text-amber-500 shrink-0" />
                  <input
                    type="text"
                    placeholder="Paste image link/URL..."
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

              {/* Unified Composer Pill Footer */}
              {!isRecording && (
                <form onSubmit={handleSend} className="p-3 bg-white dark:bg-[#0c1220] border-t border-black/5 flex items-center gap-1.5 shrink-0">
                  {/* Accessories */}
                  <div className="flex items-center gap-0.5 shrink-0">
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
                      <ImageIcon className="w-4.5 h-4.5" />
                    </button>

                    {orders.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowOrderPicker(!showOrderPicker)}
                        className="p-2.5 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-amber-500 transition-all"
                        title="Share Order Invoice"
                      >
                        <Receipt className="w-4.5 h-4.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={startRecording}
                      className="p-2.5 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-rose-500 transition-all"
                      title="Record Audio"
                    >
                      <Mic className="w-4.5 h-4.5" />
                    </button>
                  </div>

                  {/* Main Pill Entry Field */}
                  <div className="flex-1 relative flex items-center min-w-0">
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Aa"
                      className="w-full bg-slate-100 dark:bg-white/5 border border-transparent focus:border-amber-500/20 rounded-full pl-4 pr-10 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setInputText(prev => prev + ' 😊')}
                      className="absolute right-3 text-slate-400 hover:text-amber-500 transition-colors"
                      title="Insert Emoji"
                    >
                      <Smile className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Dynamic Send Button */}
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

            {/* Support info & Quick FAQ collapsible panel (Messenger Mobile Options context) */}
            {showOptionsPanel && (
              <div className="w-64 border-l border-black/5 dark:border-white/5 flex flex-col bg-white dark:bg-[#0c1220] p-4 overflow-y-auto space-y-5 shrink-0 shadow-sm hidden md:flex animate-in slide-in-from-right duration-250">
                <div className="text-center pb-4 border-b border-slate-100 dark:border-white/5">
                  <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center font-black text-xl uppercase mx-auto mb-2 border border-amber-500/20 shadow-inner">
                    {shopName.charAt(0)}
                  </div>
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">
                    {shopName} Support
                  </h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                    Store Assistance
                  </p>
                </div>

                <div className="space-y-3">
                  <h5 className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                    Helpful Links & FAQs
                  </h5>
                  
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => alert('GCash payments are processed securely! Please upload the receipt screenshot in this chat or at the counter.')}
                      className="w-full text-left p-2 bg-slate-50 dark:bg-white/5 hover:bg-amber-500/10 rounded-xl text-[11px] font-bold text-slate-700 dark:text-slate-300 transition-all flex items-center justify-between"
                    >
                      <span>GCash Support Info</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => alert('Our store hours: Daily from 7:00 AM to 10:00 PM. High Speed WiFi and electrical outlets are available!')}
                      className="w-full text-left p-2 bg-slate-50 dark:bg-white/5 hover:bg-amber-500/10 rounded-xl text-[11px] font-bold text-slate-700 dark:text-slate-300 transition-all flex items-center justify-between"
                    >
                      <span>Hours & Store Amenities</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>

                    <button
                      type="button"
                      onClick={() => alert('Claim vouchers from the "Vouchers" tab inside your profile/app, and use them during checkout to earn instant discounts!')}
                      className="w-full text-left p-2 bg-slate-50 dark:bg-white/5 hover:bg-amber-500/10 rounded-xl text-[11px] font-bold text-slate-700 dark:text-slate-300 transition-all flex items-center justify-between"
                    >
                      <span>How to use Vouchers</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-white/5 text-[9px] text-slate-400 font-medium text-center leading-relaxed">
                  Powering active secure messaging with CAIDOZ Coffee Systems.
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
