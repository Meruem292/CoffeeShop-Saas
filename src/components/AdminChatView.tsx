import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, 
  Search, 
  Trash2, 
  Archive, 
  Send, 
  Image as ImageIcon, 
  ShoppingBag, 
  Coffee, 
  Sparkles, 
  X, 
  Mic,
  Square,
  Play,
  Pause,
  Plus,
  Smile,
  Receipt,
  Download,
  Filter,
  Check,
  CheckCheck,
  ChevronRight,
  ChevronLeft,
  ExternalLink,
  Info,
  UserPlus,
  User,
  Users,
  Phone,
  Video
} from 'lucide-react';
import { ChatThread, ChatMessage, Order, Product } from '../types';

interface SendMessagePayload {
  threadId?: string;
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
  recipientCustomerId?: string;
  recipientCustomerName?: string;
  recipientCustomerEmail?: string;
  senderRole?: 'customer' | 'admin';
  senderId?: string;
  senderName?: string;
}

interface AdminChatViewProps {
  threads: ChatThread[];
  messages: ChatMessage[];
  activeThreadId: string | null;
  setActiveThreadId: (id: string | null) => void;
  onSendMessage: (payload: SendMessagePayload) => Promise<any>;
  onStartNewThread?: (recipient: { customerId: string; customerName: string; customerEmail?: string; initialMessage?: string }) => Promise<string>;
  onToggleReaction?: (messageId: string, emoji: string) => void;
  onUpdateThreadStatus: (threadId: string, status: 'active' | 'archived' | 'closed') => Promise<void>;
  onDeleteThread: (threadId: string) => Promise<void>;
  orders: Order[];
  products?: Product[];
  currentUserId?: string;
  profiles?: any[];
}

const EMOJI_LIST = ['👍', '❤️', '☕', '🔥', '🎉'];

const DEFAULT_SMART_REPLIES = [
  "☕ Your order is currently being prepared by our barista!",
  "✅ GCash payment confirmed! Order sent to kitchen.",
  "🎉 Your order is READY for pickup at the counter!",
  "⚠️ Could you please send a clearer screenshot of your GCash reference?",
  "👍 Noted on your customization request!"
];

// Audio Voice Note Player Component
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
    <div className="flex items-center gap-3 bg-black/30 dark:bg-white/10 p-2.5 rounded-xl border border-white/10 my-1 min-w-[220px]">
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
        className="w-8 h-8 rounded-full bg-amber-500 text-slate-900 flex items-center justify-center shrink-0 hover:scale-105 active:scale-95 transition-all shadow-md font-black"
      >
        {isPlaying ? <Pause className="w-4 h-4 fill-slate-900" /> : <Play className="w-4 h-4 fill-slate-900 ml-0.5" />}
      </button>

      <div className="flex-1 space-y-1">
        <div className="h-1.5 w-full bg-black/30 rounded-full overflow-hidden">
          <div className="h-full bg-amber-400 transition-all duration-100" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between items-center text-[9px] text-amber-200/90 font-mono font-bold">
          <span>Voice Recording</span>
          <span>{duration ? `${duration}s` : 'Audio'}</span>
        </div>
      </div>
    </div>
  );
}

export function AdminChatView({
  threads,
  messages,
  activeThreadId,
  setActiveThreadId,
  onSendMessage,
  onStartNewThread,
  onToggleReaction,
  onUpdateThreadStatus,
  onDeleteThread,
  orders,
  products = [],
  currentUserId = 'admin',
  profiles = []
}: AdminChatViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [msgSearchTerm, setMsgSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived' | 'unread'>('active');
  const [inputText, setInputText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [showOrderPicker, setShowOrderPicker] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [smartReplies, setSmartReplies] = useState<string[]>(DEFAULT_SMART_REPLIES);
  const [newQuickReplyText, setNewQuickReplyText] = useState('');
  const [showAddQuickReply, setShowAddQuickReply] = useState(false);
  const [sending, setSending] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [showCustomerDetails, setShowCustomerDetails] = useState(true);

  // Initiate New Chat Modal State
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatSearch, setNewChatSearch] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualGreeting, setManualGreeting] = useState('Hello! How can we assist you with your order today?');

  // Derive unique customer list from profiles, threads, and orders (excluding admins and self)
  const customerMap = new Map<string, { id: string; name: string; email?: string; orderCount: number; hasThread: boolean }>();

  profiles.forEach((p) => {
    if (p.uid && p.uid !== currentUserId && !p.isAdmin && p.role !== 'admin' && !customerMap.has(p.uid)) {
      customerMap.set(p.uid, {
        id: p.uid,
        name: p.displayName || p.email || 'Customer',
        email: p.email,
        orderCount: orders.filter((o) => o.customerId === p.uid || o.customerName === p.displayName).length,
        hasThread: threads.some((t) => t.customerId === p.uid || (t.customerName && p.displayName && t.customerName.toLowerCase() === p.displayName.toLowerCase())),
      });
    }
  });

  threads.forEach((t) => {
    if (t.customerId && t.customerId !== currentUserId && t.customerName.toLowerCase() !== 'admin') {
      customerMap.set(t.customerId, {
        id: t.customerId,
        name: t.customerName,
        email: t.customerEmail,
        orderCount: orders.filter((o) => o.customerId === t.customerId || o.customerName === t.customerName).length,
        hasThread: true,
      });
    }
  });

  orders.forEach((o) => {
    const custId = o.customerId || `cust_${o.customerName.toLowerCase().replace(/\s+/g, '_')}`;
    if (custId !== currentUserId && o.customerName.toLowerCase() !== 'admin' && !customerMap.has(custId)) {
      customerMap.set(custId, {
        id: custId,
        name: o.customerName || 'Customer',
        email: o.customerEmail,
        orderCount: orders.filter((ord) => ord.customerId === o.customerId || ord.customerName === o.customerName).length,
        hasThread: threads.some((t) => t.customerId === custId || t.customerName.toLowerCase() === o.customerName.toLowerCase()),
      });
    }
  });

  const availableCustomers = Array.from(customerMap.values()).filter(
    (c) =>
      c.id !== currentUserId &&
      c.name.toLowerCase() !== 'admin' &&
      (c.name.toLowerCase().includes(newChatSearch.toLowerCase()) ||
      (c.email && c.email.toLowerCase().includes(newChatSearch.toLowerCase())))
  );

  const handleStartChatWithCustomer = async (cust: { id: string; name: string; email?: string }, greeting?: string) => {
    try {
      setSending(true);
      const existingThread = threads.find(
        (t) => t.customerId === cust.id || t.customerName.toLowerCase() === cust.name.toLowerCase()
      );

      const messageText = greeting?.trim() || 'Hello! How can we assist you with your order today?';

      if (existingThread) {
        setActiveThreadId(existingThread.id);
        if (greeting?.trim()) {
          await onSendMessage({
            threadId: existingThread.id,
            text: messageText,
            senderRole: 'admin',
            senderId: currentUserId || 'admin',
            senderName: 'Admin',
          });
        }
      } else {
        if (onStartNewThread) {
          const newId = await onStartNewThread({
            customerId: cust.id,
            customerName: cust.name,
            customerEmail: cust.email,
            initialMessage: messageText,
          });
          setActiveThreadId(newId);
          // Send initial admin message to thread
          await onSendMessage({
            threadId: newId,
            text: messageText,
            senderRole: 'admin',
            senderId: currentUserId || 'admin',
            senderName: 'Admin',
            recipientCustomerId: cust.id,
            recipientCustomerName: cust.name,
            recipientCustomerEmail: cust.email,
          });
        } else {
          await onSendMessage({
            recipientCustomerId: cust.id,
            recipientCustomerName: cust.name,
            recipientCustomerEmail: cust.email,
            text: messageText,
            senderRole: 'admin',
            senderId: currentUserId || 'admin',
            senderName: 'Admin',
          });
        }
      }
      setShowNewChatModal(false);
      setManualName('');
      setManualEmail('');
    } catch (err) {
      console.error('Failed to initiate chat:', err);
    } finally {
      setSending(false);
    }
  };

  // Audio Recording State
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
  }, [messages, activeThreadId]);

  const activeThread = threads.find((t) => t.id === activeThreadId);

  // Filter threads based on search and status
  const filteredThreads = threads.filter((t) => {
    const matchesSearch = 
      t.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.customerEmail && t.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
      t.lastMessage.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'unread') return t.unreadCountAdmin > 0;
    if (statusFilter === 'archived') return t.status === 'archived';
    if (statusFilter === 'active') return t.status !== 'archived';
    return true;
  });

  // Filter messages in current active thread
  const activeMessages = messages.filter((m) =>
    !msgSearchTerm ? true : m.text.toLowerCase().includes(msgSearchTerm.toLowerCase())
  );

  // Find customer's recent orders
  const customerOrders = orders.filter((o) => {
    if (!activeThread) return false;
    if (activeThread.customerId && o.customerId === activeThread.customerId) return true;
    if (o.customerName.toLowerCase().trim() === activeThread.customerName.toLowerCase().trim()) return true;
    return false;
  }).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  // Local File Image Selection
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

  // Voice recording
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
              threadId: activeThreadId || undefined,
              text: '',
              audioUrl: base64Audio,
              audioDuration: recordingSeconds || 3
            });
          } catch (e) {
            console.error('Failed to send voice recording:', e);
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
    if (!activeThreadId) return;
    if ((!inputText.trim() && !imageUrl.trim()) || sending) return;

    try {
      setSending(true);
      const textToSend = inputText;
      const imgToSend = imageUrl;
      setInputText('');
      setImageUrl('');
      setShowImageInput(false);
      await onSendMessage({
        threadId: activeThreadId,
        text: textToSend,
        imageUrl: imgToSend || undefined
      });
    } catch (err) {
      console.error('Failed to send admin chat message:', err);
    } finally {
      setSending(false);
    }
  };

  // Send Product Recommendation
  const handleSendProductCard = async (product: Product) => {
    if (!activeThreadId) return;
    try {
      setSending(true);
      setShowProductPicker(false);
      await onSendMessage({
        threadId: activeThreadId,
        text: `We recommend trying our ${product.name}!`,
        productCard: {
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          category: product.category
        }
      });
    } catch (e) {
      console.error('Failed to send product card:', e);
    } finally {
      setSending(false);
    }
  };

  // Send Order Card
  const handleSendOrderCard = async (order: Order) => {
    if (!activeThreadId) return;
    try {
      setSending(true);
      setShowOrderPicker(false);
      const itemSummary = order.items.map(i => `${i.quantity}x ${i.name}`).join(', ');
      await onSendMessage({
        threadId: activeThreadId,
        text: `Here are the details for Order #${order.id?.slice(-4)}:`,
        orderCard: {
          id: order.id || 'ORDER',
          total: order.total,
          status: order.status,
          itemSummary,
          createdAt: order.createdAt
        }
      });
    } catch (e) {
      console.error('Failed to send order card:', e);
    } finally {
      setSending(false);
    }
  };

  const handleAddQuickReply = () => {
    if (!newQuickReplyText.trim()) return;
    setSmartReplies((prev) => [...prev, newQuickReplyText.trim()]);
    setNewQuickReplyText('');
    setShowAddQuickReply(false);
  };

  // Download transcript
  const handleExportTranscript = () => {
    if (!activeThread) return;
    const lines = messages.map(
      (m) => `[${new Date(m.createdAt).toLocaleString()}] ${m.senderName} (${m.senderRole}): ${m.text}`
    );
    const textContent = `Chat Transcript for ${activeThread.customerName}\nCustomer ID: ${activeThread.customerId}\n-----------------------------------\n${lines.join('\n')}`;
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat_${activeThread.customerName.replace(/\s+/g, '_')}_${Date.now()}.txt`;
    a.click();
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] border border-black/10 dark:border-white/10 overflow-hidden shadow-2xl relative">
      {/* Hidden File Input for Image Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Zoom Image Modal */}
      {zoomedImage && (
        <div 
          onClick={() => setZoomedImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-6 cursor-zoom-out animate-in fade-in duration-200"
        >
          <div className="relative max-w-4xl max-h-full">
            <img src={zoomedImage} alt="Attachment Full View" className="max-w-full max-h-[85vh] object-contain rounded-2xl border border-white/20 shadow-2xl" />
            <button 
              onClick={() => setZoomedImage(null)}
              className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white bg-white/10 rounded-full"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* Initiate Conversation Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-amber-500/30 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-5 text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm uppercase tracking-wider font-display">
                    Initiate Conversation
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Select a customer or start a new chat with a walk-in guest
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowNewChatModal(false)}
                className="p-1.5 text-slate-400 hover:text-white bg-white/5 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search customers from orders or past chats..."
                value={newChatSearch}
                onChange={(e) => setNewChatSearch(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Available Customers List */}
            <div className="space-y-2 max-h-56 overflow-y-auto scrollbar-hide pr-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-1">
                <Users className="w-3 h-3" /> Select Existing Customer ({availableCustomers.length})
              </span>

              {availableCustomers.length === 0 ? (
                <div className="p-4 bg-white/5 rounded-2xl text-center text-xs text-slate-400">
                  No matching customers found. Use manual input below.
                </div>
              ) : (
                availableCustomers.map((cust) => (
                  <div
                    key={cust.id}
                    onClick={() => handleStartChatWithCustomer(cust, manualGreeting)}
                    className="p-3 bg-white/5 hover:bg-amber-500/20 border border-white/10 hover:border-amber-500/40 rounded-2xl flex items-center justify-between cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 font-black text-xs flex items-center justify-center uppercase">
                        {cust.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-black text-xs text-white group-hover:text-amber-400 uppercase">
                            {cust.name}
                          </h5>
                          {cust.hasThread && (
                            <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-2 py-0.2 rounded-full border border-emerald-500/30">
                              Active Chat
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400">
                          {cust.email || `Orders: ${cust.orderCount}`}
                        </p>
                      </div>
                    </div>
                    <button className="px-3 py-1 bg-amber-500 text-slate-900 font-black text-[10px] rounded-xl group-hover:bg-amber-400 uppercase tracking-wider">
                      {cust.hasThread ? 'Open Chat' : 'Start Chat'}
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Manual New Customer Entry Form */}
            <div className="pt-3 border-t border-white/10 space-y-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                <Plus className="w-3 h-3 text-amber-500" /> Or Enter Walk-in / New Customer Details
              </span>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Customer Name (e.g. John Doe)"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className="bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                />
                <input
                  type="email"
                  placeholder="Email (Optional)"
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  className="bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Initial Message / Greeting..."
                  value={manualGreeting}
                  onChange={(e) => setManualGreeting(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="button"
                disabled={!manualName.trim() || sending}
                onClick={() => {
                  const custId = `cust_${manualName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
                  handleStartChatWithCustomer(
                    { id: custId, name: manualName.trim(), email: manualEmail.trim() || undefined },
                    manualGreeting
                  );
                }}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-900 font-black text-xs rounded-xl shadow-lg transition-all uppercase tracking-wider"
              >
                Initiate New Conversation
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-12 h-full min-h-0 divide-x divide-black/5 dark:divide-white/5 bg-slate-50 dark:bg-[#090d16] overflow-hidden">
        {/* Left Sidebar - Thread List (Facebook Messenger Style) */}
        <div className={`col-span-12 md:col-span-4 lg:col-span-3 flex flex-col h-full min-h-0 overflow-hidden bg-white dark:bg-[#0c1220] border-r border-black/5 dark:border-white/5 shadow-sm transition-all ${activeThreadId ? 'hidden md:flex' : 'flex'}`}>
          {/* Header & Search */}
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center font-black">
                  <MessageSquare className="w-4 h-4" />
                </span>
                <h2 className="font-extrabold text-lg text-slate-900 dark:text-white tracking-tight">
                  Chats
                </h2>
              </div>
              <button
                onClick={() => setShowNewChatModal(true)}
                className="w-8 h-8 bg-slate-100 hover:bg-amber-500 hover:text-slate-900 dark:bg-white/5 dark:hover:bg-amber-500 text-slate-800 dark:text-white rounded-full flex items-center justify-center shadow-sm transition-all active:scale-95"
                title="New Chat"
              >
                <UserPlus className="w-4 h-4" />
              </button>
            </div>

            {/* Pill Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search Messenger..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-100 dark:bg-white/5 border border-transparent focus:border-amber-500/30 rounded-full pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-all"
              />
            </div>

            {/* Status Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-0.5">
              {(['active', 'unread', 'all', 'archived'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all shrink-0 border ${
                    statusFilter === filter
                      ? 'bg-amber-500 text-slate-900 border-amber-400 shadow-sm'
                      : 'bg-transparent border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Thread List Items (Messenger style rounded active cards) */}
          <div className="flex-1 overflow-y-auto px-2 space-y-0.5 scrollbar-hide">
            {filteredThreads.length === 0 ? (
              <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center h-full">
                <MessageSquare className="w-8 h-8 mb-2 opacity-30 text-amber-500" />
                <span className="text-xs font-semibold">No chats found</span>
              </div>
            ) : (
              filteredThreads.map((thread) => {
                const isSelected = thread.id === activeThreadId;
                const hasUnread = thread.unreadCountAdmin > 0;
                // Mock online status: active if last message within 24 hours
                const isOnline = new Date().getTime() - new Date(thread.lastMessageAt).getTime() < 3600000 * 24;

                return (
                  <div
                    key={thread.id}
                    onClick={() => setActiveThreadId(thread.id)}
                    className={`p-3 cursor-pointer rounded-2xl transition-all flex items-center gap-3 relative group ${
                      isSelected
                        ? 'bg-amber-500/10 dark:bg-amber-500/20'
                        : 'hover:bg-slate-100 dark:hover:bg-white/5'
                    }`}
                  >
                    {/* Avatar with Status Badge */}
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/5 text-slate-800 dark:text-slate-200 flex items-center justify-center font-black text-sm uppercase border border-black/5 dark:border-white/10 overflow-hidden shadow-inner">
                        {thread.customerPhoto ? (
                          <img src={thread.customerPhoto} alt={thread.customerName} className="w-full h-full object-cover" />
                        ) : (
                          thread.customerName.charAt(0) || 'C'
                        )}
                      </div>
                      {isOnline && (
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-[#0c1220] shadow-md" />
                      )}
                    </div>

                    {/* Meta info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <h4 className={`text-xs font-bold text-slate-900 dark:text-white truncate ${hasUnread ? 'font-extrabold' : ''}`}>
                          {thread.customerName}
                        </h4>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                          {new Date(thread.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <p className={`text-[11px] truncate flex-1 ${
                          hasUnread 
                            ? 'font-extrabold text-slate-950 dark:text-white' 
                            : 'text-slate-500 dark:text-slate-400'
                        }`}>
                          {thread.lastMessage || 'No messages yet'}
                        </p>
                        {hasUnread && (
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                        )}
                      </div>
                    </div>

                    {/* Actions overlay on hover */}
                    <div className="absolute right-3 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateThreadStatus(thread.id, thread.status === 'archived' ? 'active' : 'archived');
                        }}
                        className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full hover:text-amber-500 transition-all text-slate-400"
                        title={thread.status === 'archived' ? 'Unarchive' : 'Archive'}
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Center Main Conversation Panel (Messenger Style Stream) */}
        <div className={`col-span-12 ${showCustomerDetails ? 'md:col-span-8 lg:col-span-6' : 'md:col-span-8 lg:col-span-9'} flex flex-col h-full min-h-0 overflow-hidden bg-white dark:bg-[#0c1220] ${!activeThreadId ? 'hidden md:flex' : 'flex'}`}>
          {activeThread ? (
            <>
              {/* Active Conversation Header (Clean, minimal, with actions) */}
              <div className="px-6 py-3 border-b border-black/5 dark:border-white/5 flex items-center justify-between shrink-0 bg-white dark:bg-[#0c1220] z-20 sticky top-0">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Back button on mobile */}
                  <button
                    onClick={() => setActiveThreadId(null)}
                    className="md:hidden p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-white/5 rounded-full transition-all mr-1"
                    title="Back to List"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center font-black text-sm uppercase shrink-0 border border-amber-500/20 overflow-hidden shadow-inner">
                      {activeThread.customerPhoto ? (
                        <img src={activeThread.customerPhoto} alt={activeThread.customerName} className="w-full h-full object-cover" />
                      ) : (
                        activeThread.customerName.charAt(0)
                      )}
                    </div>
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-[#0c1220]" />
                  </div>

                  <div className="min-w-0">
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                      {activeThread.customerName}
                    </h3>
                    <p className="text-[10px] text-green-500 dark:text-green-400 font-bold flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      <span>Active Now</span>
                    </p>
                  </div>
                </div>

                {/* Header Action Buttons (Like FB Messenger top-right layout) */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* Mock voice call */}
                  <button
                    type="button"
                    className="hidden sm:flex p-2 text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-all"
                    onClick={() => alert('Starting secure voice line call...')}
                    title="Start Voice Call"
                  >
                    <Phone className="w-4.5 h-4.5" />
                  </button>
                  {/* Mock video call */}
                  <button
                    type="button"
                    className="hidden sm:flex p-2 text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-all"
                    onClick={() => alert('Initiating active secure live face camera stream...')}
                    title="Start Video Call"
                  >
                    <Video className="w-4.5 h-4.5" />
                  </button>
                  
                  <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

                  <button
                    type="button"
                    onClick={handleExportTranscript}
                    className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-all"
                    title="Export Transcript"
                  >
                    <Download className="w-4.5 h-4.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateThreadStatus(activeThread.id, activeThread.status === 'archived' ? 'active' : 'archived')}
                    className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-all"
                    title={activeThread.status === 'archived' ? 'Unarchive' : 'Archive'}
                  >
                    <Archive className="w-4.5 h-4.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteThread(activeThread.id)}
                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-full transition-all"
                    title="Delete Chat"
                  >
                    <Trash2 className="w-4.5 h-4.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCustomerDetails(!showCustomerDetails)}
                    className={`p-2 rounded-full transition-all ${
                      showCustomerDetails ? 'bg-amber-500/10 text-amber-500' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
                    }`}
                    title="Toggle Customer & Order Panel"
                  >
                    <Info className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>

              {/* In-Chat Message Search Bar */}
              {messages.length > 5 && (
                <div className="px-6 py-2 bg-slate-50 dark:bg-black/10 border-b border-black/5 flex items-center gap-2 text-xs shrink-0">
                  <Search className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search in conversation..."
                    value={msgSearchTerm}
                    onChange={(e) => setMsgSearchTerm(e.target.value)}
                    className="bg-transparent border-none text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none flex-1 font-medium"
                  />
                  {msgSearchTerm && (
                    <button type="button" onClick={() => setMsgSearchTerm('')} className="text-slate-400 hover:text-slate-900 dark:hover:text-white">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

              {/* Smart Quick Replies Pill Row */}
              <div className="px-4 py-2 bg-slate-50 dark:bg-black/10 border-b border-black/5 flex items-center gap-2 overflow-x-auto scrollbar-hide shrink-0">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-500 shrink-0 flex items-center gap-1 px-1.5">
                  <Sparkles className="w-3 h-3" /> Quick Replies:
                </span>
                {smartReplies.map((reply, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setInputText(reply)}
                    className="text-[10px] font-semibold bg-white dark:bg-white/5 hover:bg-amber-500 hover:text-slate-900 border border-slate-200 dark:border-white/10 px-3 py-1.5 rounded-full whitespace-nowrap transition-all shadow-sm"
                  >
                    {reply}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setShowAddQuickReply(!showAddQuickReply)}
                  className="p-1.5 rounded-full bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-slate-900 transition-all shrink-0 border border-amber-500/20"
                  title="Add Quick Reply"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Add Custom Quick Reply Modal */}
              {showAddQuickReply && (
                <div className="p-3 bg-amber-500/5 border-b border-amber-500/20 flex items-center gap-2 animate-in fade-in duration-150 shrink-0">
                  <input
                    type="text"
                    placeholder="Type quick reply template (e.g. Thanks for your message!)..."
                    value={newQuickReplyText}
                    onChange={(e) => setNewQuickReplyText(e.target.value)}
                    className="flex-1 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full px-4 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500/50"
                  />
                  <button
                    type="button"
                    onClick={handleAddQuickReply}
                    className="px-4 py-2 bg-amber-500 text-slate-900 font-extrabold text-xs rounded-full hover:bg-amber-400 shadow-sm"
                  >
                    Save Template
                  </button>
                </div>
              )}

              {/* Messages Stream (Facebook Messenger Rounded-Grouping Layout) */}
              <div className="flex-1 min-h-0 p-6 overflow-y-auto space-y-1 bg-slate-50/50 dark:bg-[#0c1220]/50 scrollbar-hide">
                {activeMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <MessageSquare className="w-12 h-12 mb-2 opacity-20 text-amber-500" />
                    <span className="text-xs font-semibold">No messages yet</span>
                  </div>
                ) : (
                  activeMessages.map((msg, index) => {
                    const isAdminMsg = msg.senderRole === 'admin';
                    
                    // Grouping Logic
                    const prevMsg = index > 0 ? activeMessages[index - 1] : null;
                    const nextMsg = index < activeMessages.length - 1 ? activeMessages[index + 1] : null;

                    const isConsecutiveWithPrev = prevMsg && 
                      prevMsg.senderRole === msg.senderRole && 
                      (new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() < 120000);

                    const isConsecutiveWithNext = nextMsg && 
                      nextMsg.senderRole === msg.senderRole && 
                      (new Date(nextMsg.createdAt).getTime() - new Date(msg.createdAt).getTime() < 120000);

                    // Dynamic Bubble Border Radii for consecutive grouping
                    let roundedClasses = 'rounded-2xl';
                    if (isAdminMsg) {
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
                        className={`flex flex-col ${isAdminMsg ? 'items-end' : 'items-start'} ${
                          isConsecutiveWithPrev ? 'mt-0.5' : 'mt-4'
                        } group relative max-w-[85%] ${isAdminMsg ? 'ml-auto' : 'mr-auto'}`}
                      >
                        {/* Group Header: Only show sender name and time if NOT consecutive with previous message */}
                        {!isConsecutiveWithPrev && (
                          <div className="flex items-center gap-2 mb-1 px-1 text-[10px] font-bold text-slate-400">
                            <span>
                              {isAdminMsg ? 'Store Staff' : msg.senderName || 'Customer'}
                            </span>
                            <span>•</span>
                            <span>
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        )}

                        <div className="flex items-end gap-2 max-w-full">
                          {/* Bubble Container */}
                          <div
                            className={`p-3.5 text-xs font-medium leading-relaxed shadow-sm transition-all ${roundedClasses} ${
                              isAdminMsg
                                ? 'bg-amber-500 text-slate-900 font-semibold'
                                : 'bg-white dark:bg-slate-800 text-slate-950 dark:text-slate-100 border border-slate-100 dark:border-white/5'
                            }`}
                          >
                            {/* Image Attachment */}
                            {msg.imageUrl && (
                              <div className="mb-2 rounded-xl overflow-hidden cursor-zoom-in border border-black/5 dark:border-white/5">
                                <img
                                  src={msg.imageUrl}
                                  onClick={() => setZoomedImage(msg.imageUrl || null)}
                                  alt="Attachment"
                                  className="w-full max-h-56 object-cover rounded-xl hover:scale-105 transition-all"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                            )}

                            {/* Voice Note Attachment */}
                            {msg.audioUrl && (
                              <AudioPlayer src={msg.audioUrl} duration={msg.audioDuration} />
                            )}

                            {/* Product Card */}
                            {msg.productCard && (
                              <div className="my-1.5 p-3 bg-black/10 dark:bg-black/20 rounded-xl border border-black/5 flex items-center gap-3">
                                <img
                                  src={msg.productCard.image}
                                  alt={msg.productCard.name}
                                  className="w-10 h-10 rounded-lg object-cover shrink-0 border border-amber-500/20"
                                />
                                <div className="flex-1 min-w-0">
                                  <span className="text-[8px] uppercase font-extrabold tracking-wider text-amber-500">
                                    Coffee Recommendation
                                  </span>
                                  <h5 className="font-extrabold text-xs truncate text-slate-900 dark:text-white">
                                    {msg.productCard.name}
                                  </h5>
                                  <span className="text-[10px] font-bold text-amber-500">₱{msg.productCard.price}</span>
                                </div>
                              </div>
                            )}

                            {/* Order Receipt Card */}
                            {msg.orderCard && (
                              <div className="my-1.5 p-3 bg-black/10 dark:bg-black/20 rounded-xl border border-black/5 space-y-1">
                                <div className="flex justify-between items-center text-[9px] font-extrabold uppercase tracking-wide">
                                  <span>Order #{msg.orderCard.id.slice(-4)}</span>
                                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30">
                                    {msg.orderCard.status}
                                  </span>
                                </div>
                                <p className="text-[10px] opacity-90 font-medium truncate">{msg.orderCard.itemSummary}</p>
                                <div className="text-[10px] font-bold pt-1 border-t border-black/5">Total: ₱{msg.orderCard.total.toLocaleString()}</div>
                              </div>
                            )}

                            {/* Text message */}
                            {msg.text && <p className="whitespace-pre-wrap break-words">{msg.text}</p>}

                            {/* Message Reaction Pills */}
                            {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5 pt-1.5 border-t border-black/5 dark:border-white/5">
                                {Object.entries(msg.reactions).map(([emoji, uids]) => (
                                  <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => onToggleReaction && onToggleReaction(msg.id, emoji)}
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

                          {/* Quick Emoji Reaction Hover Overlay (Messenger Style) */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute top-1/2 -translate-y-1/2 flex items-center bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-lg px-2 py-1 rounded-full gap-1 z-10 scale-90 group-hover:scale-100 origin-center duration-200"
                            style={{ [isAdminMsg ? 'left' : 'right']: '-140px' }}
                          >
                            {EMOJI_LIST.map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => onToggleReaction && onToggleReaction(msg.id, emoji)}
                                className="hover:scale-130 transition-transform text-sm duration-100"
                                title={emoji}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Read/Delivered state below latest message */}
                        {index === activeMessages.length - 1 && isAdminMsg && (
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

              {/* Recording Voice Note Indicator */}
              {isRecording && (
                <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border-t border-rose-500/20 flex items-center justify-between shrink-0 animate-pulse">
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                    <span className="text-xs font-semibold text-rose-700 dark:text-rose-200">
                      Recording Audio... {Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
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

              {/* Product Picker Drawer */}
              {showProductPicker && (
                <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-white/5 max-h-60 overflow-y-auto space-y-3 shrink-0 shadow-inner">
                  <div className="flex justify-between items-center text-xs font-black text-amber-500 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <Coffee className="w-4 h-4" /> Recommend Coffee or Treats
                    </span>
                    <button type="button" onClick={() => setShowProductPicker(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <input
                    type="text"
                    placeholder="Search menu..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-white/5 border border-transparent focus:border-amber-500/30 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                  />

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {products
                      .filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase()))
                      .map((prod) => (
                        <button
                          key={prod.id}
                          type="button"
                          onClick={() => handleSendProductCard(prod)}
                          className="p-2 bg-slate-50 dark:bg-white/5 hover:bg-amber-500/10 border border-transparent hover:border-amber-500/20 rounded-xl text-left flex items-center gap-2 transition-all group"
                        >
                          <img src={prod.image} alt={prod.name} className="w-8 h-8 rounded-lg object-cover shrink-0" />
                          <div className="min-w-0 flex-1">
                            <h6 className="text-[11px] font-bold text-slate-800 dark:text-white group-hover:text-amber-500 truncate">{prod.name}</h6>
                            <span className="text-[10px] font-bold text-amber-500">₱{prod.price}</span>
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* Order Picker Drawer */}
              {showOrderPicker && (
                <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-white/5 max-h-52 overflow-y-auto space-y-2 shrink-0 shadow-inner">
                  <div className="flex justify-between items-center text-xs font-black text-amber-500 uppercase tracking-wider mb-2">
                    <span>Share Customer's Order Receipt</span>
                    <button type="button" onClick={() => setShowOrderPicker(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {customerOrders.length === 0 ? (
                    <div className="text-xs text-slate-400 text-center py-2">No past orders found for this customer</div>
                  ) : (
                    customerOrders.map((ord) => (
                      <button
                        key={ord.id}
                        type="button"
                        onClick={() => handleSendOrderCard(ord)}
                        className="w-full p-2.5 bg-slate-50 dark:bg-white/5 hover:bg-amber-500/10 border border-slate-100 dark:border-white/10 rounded-xl flex justify-between items-center text-left text-xs transition-all"
                      >
                        <div>
                          <span className="font-extrabold text-amber-500">#{ord.id?.slice(-4)}</span>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[220px] mt-0.5">
                            {ord.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                          </p>
                        </div>
                        <span className="font-bold text-slate-900 dark:text-slate-200">₱{ord.total}</span>
                      </button>
                    ))
                  )}
                </div>
              )}

              {/* URL Image Input Bar */}
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

              {/* Message Composer Footer (Elegant Rounded Messenger Pill) */}
              {!isRecording && (
                <form onSubmit={handleSend} className="p-4 bg-white dark:bg-[#0c1220] border-t border-black/5 flex items-center gap-1.5 shrink-0">
                  {/* Left accessories group */}
                  <div className="flex items-center gap-0.5">
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

                    <button
                      type="button"
                      onClick={() => setShowProductPicker(!showProductPicker)}
                      className="p-2.5 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-amber-500 transition-all"
                      title="Recommend Product"
                    >
                      <Coffee className="w-4.5 h-4.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowOrderPicker(!showOrderPicker)}
                      className="p-2.5 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-white transition-all"
                      title="Share Order Invoice"
                    >
                      <Receipt className="w-4.5 h-4.5" />
                    </button>

                    <button
                      type="button"
                      onClick={startRecording}
                      className="p-2.5 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-rose-500 transition-all"
                      title="Record Audio"
                    >
                      <Mic className="w-4.5 h-4.5" />
                    </button>
                  </div>

                  {/* Main Input Field Pill */}
                  <div className="flex-1 relative flex items-center">
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder={`Aa`}
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
                    <Send className="w-4.5 h-4.5 fill-slate-900" />
                  </button>
                </form>
              )}
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-slate-400 bg-slate-50/50 dark:bg-[#0c1220]/50">
              <MessageSquare className="w-14 h-14 mb-4 opacity-20 text-amber-500 animate-bounce" />
              <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-900 dark:text-white mb-1 font-display">
                No Chat Selected
              </h3>
              <p className="text-xs text-slate-400 text-center max-w-xs">
                Pick an active customer thread from the left list to begin secure live communication.
              </p>
            </div>
          )}
        </div>

        {/* Right Collapsible Panel - Customer Profiles & CRM context (Facebook Messenger Style) */}
        {showCustomerDetails && activeThread && (
          <div className="hidden lg:flex lg:col-span-3 flex-col h-full min-h-0 overflow-y-auto p-6 space-y-6 shadow-sm border-l border-black/5 dark:border-white/5 bg-white dark:bg-[#0c1220]">
            <div className="text-center pb-6 border-b border-slate-100 dark:border-white/5">
              <div className="w-20 h-20 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center font-black text-2xl uppercase mx-auto mb-3 border border-amber-500/20 shadow-inner overflow-hidden">
                {activeThread.customerPhoto ? (
                  <img src={activeThread.customerPhoto} alt={activeThread.customerName} className="w-full h-full object-cover" />
                ) : (
                  activeThread.customerName.charAt(0)
                )}
              </div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white tracking-tight">
                {activeThread.customerName}
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                {activeThread.customerEmail || 'Walk-In Customer'}
              </p>
            </div>

            {/* Quick Actions Panel */}
            <div className="space-y-2.5">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Options
              </h4>
              <button
                type="button"
                onClick={() => alert(`View complete customer loyalty profile for ${activeThread.customerName}`)}
                className="w-full py-2 px-3 bg-slate-50 dark:bg-white/5 hover:bg-amber-500/10 hover:text-amber-500 rounded-xl text-left text-xs font-bold transition-all text-slate-700 dark:text-slate-300 flex items-center justify-between"
              >
                <span>View Loyalty Profile</span>
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => alert(`Customize nickname template for ${activeThread.customerName}`)}
                className="w-full py-2 px-3 bg-slate-50 dark:bg-white/5 hover:bg-amber-500/10 hover:text-amber-500 rounded-xl text-left text-xs font-bold transition-all text-slate-700 dark:text-slate-300 flex items-center justify-between"
              >
                <span>Edit Nickname</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Customer Orders Summary list */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-t border-slate-100 dark:border-white/5 pt-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5" /> Recent Orders ({customerOrders.length})
                </span>
              </div>

              {customerOrders.length === 0 ? (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 text-center text-slate-400 text-xs">
                  No registered orders found.
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-hide">
                  {customerOrders.map((order) => (
                    <div
                      key={order.id}
                      className="p-3 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 space-y-1.5 hover:border-amber-500/30 transition-all"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                          #{order.id?.slice(-4)}
                        </span>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 uppercase border border-amber-500/20">
                          {order.status}
                        </span>
                      </div>

                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                        {order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                      </div>

                      <div className="flex justify-between items-center pt-1.5 border-t border-slate-200 dark:border-white/10 text-[10px] font-bold text-slate-800 dark:text-slate-300">
                        <span>₱{order.total.toLocaleString()}</span>
                        <span className="text-[9px] text-slate-400 font-medium">
                          {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
