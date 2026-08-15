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
  ChevronDown
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
    <div className="flex items-center gap-3 bg-black/20 dark:bg-white/10 p-2.5 rounded-xl border border-white/10 my-1 min-w-[200px]">
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
        className="w-8 h-8 rounded-full bg-amber-500 text-slate-900 flex items-center justify-center shrink-0 hover:scale-105 active:scale-95 transition-all shadow-md"
      >
        {isPlaying ? <Pause className="w-4 h-4 fill-slate-900" /> : <Play className="w-4 h-4 fill-slate-900 ml-0.5" />}
      </button>

      <div className="flex-1 space-y-1">
        <div className="h-1.5 w-full bg-black/30 rounded-full overflow-hidden">
          <div className="h-full bg-amber-400 transition-all duration-100" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between items-center text-[9px] text-amber-200/80 font-mono font-bold">
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
  const [searchFilter, setSearchFilter] = useState('');
  const [sending, setSending] = useState(false);
  const [reactionMenuMsgId, setReactionMenuMsgId] = useState<string | null>(null);

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

  // Handle local file image selection
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

  // Voice recording logic
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

        // Stop audio tracks
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

  // Filter messages by search filter
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

      {/* Floating Toggle Button */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
        {!isOpen && unreadCount > 0 && (
          <div className="hidden sm:flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-full shadow-2xl text-xs font-black uppercase tracking-wider animate-bounce border border-amber-500/30">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Admin sent a message</span>
          </div>
        )}

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-14 h-14 rounded-full bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-400 text-slate-900 shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center border-2 border-white/20 group"
          aria-label="Open Chat with Admin"
        >
          {isOpen ? (
            <X className="w-6 h-6 text-slate-900 transition-transform group-hover:rotate-90" />
          ) : (
            <>
              <MessageSquare className="w-6 h-6 text-slate-900 fill-slate-900" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-rose-500 text-white font-black text-[11px] flex items-center justify-center border-2 border-slate-900 animate-pulse shadow-lg">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </>
          )}
        </button>
      </div>

      {/* Chat Window Panel */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-300 flex flex-col bg-slate-900/95 backdrop-blur-2xl text-white border border-amber-500/20 shadow-2xl overflow-hidden ${
            isExpanded
              ? 'inset-4 md:inset-12 rounded-3xl'
              : 'bottom-24 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-[420px] h-[620px] max-h-[85vh] rounded-[2.5rem]'
          }`}
        >
          {/* Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border-b border-amber-500/20 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 overflow-hidden">
                {shopLogo ? (
                  <img src={shopLogo} alt={shopName} className="w-full h-full object-cover" />
                ) : (
                  <Coffee className="w-5 h-5 text-amber-400" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-sm text-white tracking-wide uppercase font-display">
                    {shopName} Support
                  </h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <p className="text-[10px] text-amber-400/80 font-bold uppercase tracking-widest">
                  Live Admin & Staff
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                title={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                title="Close Chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search Bar inside Chat */}
          {messages.length > 3 && (
            <div className="px-4 py-2 bg-slate-950 border-b border-white/5 flex items-center gap-2 shrink-0">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search messages..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="bg-transparent border-none text-xs text-white placeholder:text-slate-500 focus:outline-none flex-1"
              />
              {searchFilter && (
                <button onClick={() => setSearchFilter('')} className="text-slate-400 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Quick Help Chips Banner */}
          {messages.length === 0 && (
            <div className="p-4 bg-amber-500/10 border-b border-amber-500/20 flex flex-col gap-2 shrink-0">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Quick Inquiries
              </span>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_TEMPLATES.map((tmpl, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInputText(tmpl)}
                    className="text-[10px] font-bold bg-white/5 hover:bg-amber-500/20 border border-white/10 hover:border-amber-500/40 text-slate-200 px-3 py-1.5 rounded-xl transition-all text-left"
                  >
                    {tmpl}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message List */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 scrollbar-hide">
            {filteredMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <Coffee className="w-12 h-12 mb-3 text-amber-400/40" />
                <h4 className="text-base font-black text-white uppercase tracking-wider mb-1 font-display">
                  How can we help you?
                </h4>
                <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                  Send a message, share an order, or record a voice note for store management!
                </p>
              </div>
            ) : (
              filteredMessages.map((msg) => {
                const isAdminMsg = msg.senderRole === 'admin';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isAdminMsg ? 'items-start' : 'items-end'} group relative`}
                  >
                    <div className="flex items-center gap-2 mb-1 px-1">
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                        {isAdminMsg ? 'Store Staff / Admin' : 'You'}
                      </span>
                      <span className="text-[8px] text-slate-500 font-medium">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div
                      className={`max-w-[85%] rounded-2xl p-4 text-xs font-medium leading-relaxed shadow-lg relative ${
                        isAdminMsg
                          ? 'bg-slate-800 text-white rounded-tl-none border border-white/10'
                          : 'bg-amber-500 text-slate-900 font-bold rounded-tr-none shadow-amber-500/10'
                      }`}
                    >
                      {/* Image Attachment */}
                      {msg.imageUrl && (
                        <div className="mb-2 rounded-xl overflow-hidden border border-black/20">
                          <img
                            src={msg.imageUrl}
                            alt="Attachment"
                            className="w-full max-h-52 object-cover rounded-xl"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}

                      {/* Voice Note Attachment */}
                      {msg.audioUrl && (
                        <AudioPlayer src={msg.audioUrl} duration={msg.audioDuration} />
                      )}

                      {/* Product Card Attachment */}
                      {msg.productCard && (
                        <div className="my-2 p-3 bg-black/30 rounded-xl border border-amber-500/30 flex items-center gap-3">
                          <img
                            src={msg.productCard.image}
                            alt={msg.productCard.name}
                            className="w-12 h-12 rounded-lg object-cover shrink-0 border border-amber-500/20"
                          />
                          <div className="flex-1 min-w-0">
                            <h5 className="font-black text-xs text-amber-400 truncate">{msg.productCard.name}</h5>
                            <span className="text-[10px] text-slate-300 font-bold">₱{msg.productCard.price}</span>
                          </div>
                          {onAddToCart && products.find(p => p.id === msg.productCard?.id) && (
                            <button
                              onClick={() => {
                                const prod = products.find(p => p.id === msg.productCard?.id);
                                if (prod) onAddToCart(prod);
                              }}
                              className="px-2.5 py-1 bg-amber-500 text-slate-900 font-black text-[10px] rounded-lg hover:bg-amber-400 shrink-0 uppercase tracking-wider"
                            >
                              Add to Order
                            </button>
                          )}
                        </div>
                      )}

                      {/* Order Card Attachment */}
                      {msg.orderCard && (
                        <div className="my-2 p-3 bg-black/30 rounded-xl border border-white/10 space-y-1">
                          <div className="flex justify-between items-center text-[10px] font-black uppercase text-amber-400">
                            <span>Order #{msg.orderCard.id.slice(-4)}</span>
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              {msg.orderCard.status}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-300 font-medium truncate">{msg.orderCard.itemSummary}</p>
                          <div className="text-[10px] font-bold text-white pt-1">Total: ₱{msg.orderCard.total.toLocaleString()}</div>
                        </div>
                      )}

                      {/* Text */}
                      {msg.text && <p className="whitespace-pre-wrap break-words">{msg.text}</p>}

                      {/* Reactions Pills */}
                      {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2 pt-1 border-t border-black/10 dark:border-white/10">
                          {Object.entries(msg.reactions).map(([emoji, uids]) => (
                            <button
                              key={emoji}
                              onClick={() => onToggleReaction && onToggleReaction(msg.id, emoji)}
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border ${
                                uids.includes(currentUserId)
                                  ? 'bg-amber-400 text-slate-900 border-amber-300'
                                  : 'bg-black/20 text-slate-300 border-white/10'
                              }`}
                            >
                              <span>{emoji}</span>
                              <span>{uids.length}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Reaction Bar Trigger on Hover/Click */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 my-0.5">
                      {EMOJI_LIST.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => onToggleReaction && onToggleReaction(msg.id, emoji)}
                          className="hover:scale-125 transition-transform text-xs"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Voice Note Recording Bar */}
          {isRecording && (
            <div className="p-4 bg-rose-950/80 border-t border-rose-500/30 flex items-center justify-between shrink-0 animate-pulse">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                <span className="text-xs font-mono font-black text-rose-200">
                  Recording Audio... {Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, '0')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={cancelRecording}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-white font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={stopRecording}
                  className="px-4 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-xs text-white font-black flex items-center gap-1"
                >
                  <Square className="w-3.5 h-3.5 fill-white" /> Send Voice Note
                </button>
              </div>
            </div>
          )}

          {/* Order Picker Drawer */}
          {showOrderPicker && (
            <div className="p-4 bg-slate-950 border-t border-amber-500/20 max-h-48 overflow-y-auto space-y-2 shrink-0">
              <div className="flex justify-between items-center text-xs font-black text-amber-400 uppercase tracking-wider mb-2">
                <span>Select Order to Share in Chat</span>
                <button onClick={() => setShowOrderPicker(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {orders.length === 0 ? (
                <div className="text-xs text-slate-500 text-center py-2">No active orders found</div>
              ) : (
                orders.map((ord) => (
                  <button
                    key={ord.id}
                    onClick={() => handleSendOrderCard(ord)}
                    className="w-full p-2.5 bg-white/5 hover:bg-amber-500/20 border border-white/10 rounded-xl flex justify-between items-center text-left text-xs text-white transition-all"
                  >
                    <div>
                      <span className="font-bold text-amber-400">#{ord.id?.slice(-4)}</span>
                      <p className="text-[10px] text-slate-400 truncate max-w-[200px]">
                        {ord.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                      </p>
                    </div>
                    <span className="font-black text-amber-300 text-xs">₱{ord.total}</span>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Image URL Toggle Bar */}
          {showImageInput && !isRecording && (
            <div className="p-3 bg-slate-950 border-t border-amber-500/20 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-amber-400 shrink-0" />
              <input
                type="text"
                placeholder="Paste Image URL or selected photo will send..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={() => {
                  setShowImageInput(false);
                  setImageUrl('');
                }}
                className="p-1.5 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Footer Input Form */}
          {!isRecording && (
            <form onSubmit={handleSend} className="p-4 bg-slate-950 border-t border-amber-500/20 shrink-0 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-3 rounded-2xl border transition-all ${
                    imageUrl
                      ? 'bg-amber-500 text-slate-900 border-amber-400'
                      : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                  }`}
                  title="Upload Image"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>

                {orders.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowOrderPicker(!showOrderPicker)}
                    className="p-3 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all"
                    title="Inquire about an Order"
                  >
                    <Receipt className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={startRecording}
                  className="p-3 rounded-2xl bg-white/5 border border-white/10 text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 transition-all"
                  title="Record Voice Note"
                >
                  <Mic className="w-4 h-4" />
                </button>

                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50 transition-all"
                />

                <button
                  type="submit"
                  disabled={(!inputText.trim() && !imageUrl.trim()) || sending}
                  className="p-3 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-900 font-black transition-all shadow-lg active:scale-95 shrink-0"
                >
                  <Send className="w-4 h-4 fill-slate-900" />
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </>
  );
}
