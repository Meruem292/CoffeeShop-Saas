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
  Users
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
    <div className="h-[calc(100vh-6rem)] min-h-[600px] flex flex-col bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] border border-black/10 dark:border-white/10 overflow-hidden shadow-2xl relative">
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

      <div className="grid grid-cols-12 h-full divide-x divide-black/10 dark:divide-white/10">
        {/* Left Sidebar - Thread List */}
        <div className={`col-span-12 md:col-span-4 lg:col-span-3 flex flex-col h-full bg-slate-900/60 dark:bg-black/20 ${activeThreadId ? 'hidden md:flex' : 'flex'}`}>
          {/* Header & Search */}
          <div className="p-4 border-b border-black/10 dark:border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-amber-500" />
                <h2 className="font-black text-sm uppercase tracking-wider text-slate-900 dark:text-white font-display">
                  Customer Support
                </h2>
              </div>
              <button
                onClick={() => setShowNewChatModal(true)}
                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-900 font-black text-[10px] rounded-xl flex items-center gap-1 shadow-md transition-all active:scale-95 uppercase tracking-wider"
                title="Initiate conversation with a customer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ New Chat</span>
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search customer or message..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Status Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-1">
              {(['active', 'unread', 'all', 'archived'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shrink-0 ${
                    statusFilter === filter
                      ? 'bg-amber-500 text-slate-900 shadow-md'
                      : 'bg-black/5 dark:bg-white/5 text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Thread List Items */}
          <div className="flex-1 overflow-y-auto divide-y divide-black/5 dark:divide-white/5 scrollbar-hide">
            {filteredThreads.length === 0 ? (
              <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center h-full">
                <MessageSquare className="w-10 h-10 mb-2 opacity-20" />
                <span className="text-xs font-bold uppercase tracking-wider">No conversations found</span>
              </div>
            ) : (
              filteredThreads.map((thread) => {
                const isSelected = thread.id === activeThreadId;
                const hasUnread = thread.unreadCountAdmin > 0;

                return (
                  <div
                    key={thread.id}
                    onClick={() => setActiveThreadId(thread.id)}
                    className={`p-4 cursor-pointer transition-all flex items-start gap-3 relative border-l-4 ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500'
                        : hasUnread
                        ? 'bg-rose-500/10 border-rose-500'
                        : 'border-transparent hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-black text-sm uppercase shrink-0 border border-amber-500/30">
                      {thread.customerPhoto ? (
                        <img src={thread.customerPhoto} alt={thread.customerName} className="w-full h-full object-cover rounded-2xl" />
                      ) : (
                        thread.customerName.charAt(0) || 'C'
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <h4 className="text-xs font-black text-slate-900 dark:text-white truncate uppercase tracking-tight">
                          {thread.customerName}
                        </h4>
                        <span className="text-[9px] text-slate-400 font-bold shrink-0">
                          {new Date(thread.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <p className={`text-[11px] truncate ${hasUnread ? 'font-black text-rose-500' : 'text-slate-400 font-medium'}`}>
                        {thread.lastMessage || 'No messages yet'}
                      </p>
                    </div>

                    {hasUnread && (
                      <span className="w-5 h-5 rounded-full bg-rose-500 text-white font-black text-[10px] flex items-center justify-center shrink-0 shadow-lg animate-pulse">
                        {thread.unreadCountAdmin}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Center Main Conversation Panel */}
        <div className={`col-span-12 ${showCustomerDetails ? 'md:col-span-8 lg:col-span-6' : 'md:col-span-8 lg:col-span-9'} flex flex-col h-full bg-slate-900/20 ${!activeThreadId ? 'hidden md:flex' : 'flex'}`}>
          {activeThread ? (
            <>
              {/* Active Conversation Header */}
              <div className="p-4 bg-black/10 dark:bg-white/5 border-b border-black/10 dark:border-white/10 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Back button on mobile */}
                  <button
                    onClick={() => setActiveThreadId(null)}
                    className="md:hidden p-2 text-slate-500 dark:text-slate-400 hover:text-amber-500 bg-black/5 hover:bg-black/10 rounded-xl transition-all mr-1.5 shrink-0 flex items-center justify-center border border-black/10 dark:border-white/10"
                    title="Back to List"
                  >
                    <ChevronLeft className="w-4 h-4 text-slate-900 dark:text-slate-100" />
                  </button>
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-black text-sm uppercase shrink-0 border border-amber-500/30">
                    {activeThread.customerName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wide truncate font-display">
                        {activeThread.customerName}
                      </h3>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium truncate">
                      {activeThread.customerEmail || `Customer ID: #${activeThread.customerId.slice(-6)}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={handleExportTranscript}
                    className="p-2 text-slate-400 hover:text-amber-500 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-all"
                    title="Export Chat Transcript"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onUpdateThreadStatus(activeThread.id, activeThread.status === 'archived' ? 'active' : 'archived')}
                    className="p-2 text-slate-400 hover:text-amber-500 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-all"
                    title={activeThread.status === 'archived' ? 'Unarchive' : 'Archive'}
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteThread(activeThread.id)}
                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                    title="Delete Conversation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowCustomerDetails(!showCustomerDetails)}
                    className={`p-2 rounded-xl transition-all ${
                      showCustomerDetails ? 'bg-amber-500/20 text-amber-500' : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                    title="Toggle Customer & Order Details"
                  >
                    <ShoppingBag className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* In-Chat Message Search Bar */}
              {messages.length > 5 && (
                <div className="px-4 py-1.5 bg-black/10 dark:bg-white/5 border-b border-black/5 dark:border-white/5 flex items-center gap-2 text-xs shrink-0">
                  <Search className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search within this chat..."
                    value={msgSearchTerm}
                    onChange={(e) => setMsgSearchTerm(e.target.value)}
                    className="bg-transparent border-none text-xs text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none flex-1"
                  />
                  {msgSearchTerm && (
                    <button onClick={() => setMsgSearchTerm('')} className="text-slate-400 hover:text-slate-900 dark:hover:text-white">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

              {/* Smart Quick Replies Toolbar */}
              <div className="p-2 bg-amber-500/5 border-b border-black/10 dark:border-white/10 flex items-center gap-2 overflow-x-auto scrollbar-hide shrink-0">
                <span className="text-[9px] font-black uppercase tracking-wider text-amber-500 shrink-0 flex items-center gap-1 px-2">
                  <Sparkles className="w-3 h-3" /> Quick Replies:
                </span>
                {smartReplies.map((reply, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInputText(reply)}
                    className="text-[10px] font-bold bg-black/5 dark:bg-white/5 hover:bg-amber-500 hover:text-slate-900 border border-black/10 dark:border-white/10 px-3 py-1 rounded-xl whitespace-nowrap transition-all"
                  >
                    {reply}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setShowAddQuickReply(!showAddQuickReply)}
                  className="p-1 rounded-xl bg-amber-500/20 text-amber-500 hover:bg-amber-500 hover:text-slate-900 transition-all shrink-0"
                  title="Add Custom Quick Reply"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Modal for Adding Custom Quick Reply */}
              {showAddQuickReply && (
                <div className="p-3 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2 animate-in fade-in duration-150 shrink-0">
                  <input
                    type="text"
                    placeholder="Enter custom quick reply template..."
                    value={newQuickReplyText}
                    onChange={(e) => setNewQuickReplyText(e.target.value)}
                    className="flex-1 bg-black/10 dark:bg-white/10 border border-black/10 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddQuickReply}
                    className="px-3 py-1.5 bg-amber-500 text-slate-900 font-black text-xs rounded-xl hover:bg-amber-400"
                  >
                    Save Template
                  </button>
                </div>
              )}

              {/* Messages Stream */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4 scrollbar-hide">
                {activeMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500">
                    <MessageSquare className="w-12 h-12 mb-2 opacity-20" />
                    <span className="text-xs font-bold uppercase tracking-wider">No messages found</span>
                  </div>
                ) : (
                  activeMessages.map((msg) => {
                    const isAdminMsg = msg.senderRole === 'admin';
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isAdminMsg ? 'items-end' : 'items-start'} group relative`}
                      >
                        <div className="flex items-center gap-2 mb-1 px-1">
                          <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                            {isAdminMsg ? 'Store Staff (Admin)' : msg.senderName || 'Customer'}
                          </span>
                          <span className="text-[8px] text-slate-500 font-medium">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <div
                          className={`max-w-[80%] rounded-2xl p-4 text-xs font-medium leading-relaxed shadow-md relative ${
                            isAdminMsg
                              ? 'bg-amber-500 text-slate-900 font-bold rounded-tr-none'
                              : 'bg-black/10 dark:bg-white/10 text-slate-900 dark:text-white rounded-tl-none border border-black/10 dark:border-white/10'
                          }`}
                        >
                          {/* Image Attachment */}
                          {msg.imageUrl && (
                            <div className="mb-2 rounded-xl overflow-hidden cursor-zoom-in border border-black/10 dark:border-white/10">
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
                            <div className="my-2 p-3 bg-black/20 dark:bg-white/10 rounded-xl border border-black/10 dark:border-white/10 flex items-center gap-3">
                              <img
                                src={msg.productCard.image}
                                alt={msg.productCard.name}
                                className="w-12 h-12 rounded-lg object-cover shrink-0 border border-amber-500/30"
                              />
                              <div className="flex-1 min-w-0">
                                <span className="text-[9px] uppercase font-black tracking-widest text-amber-500">
                                  Recommended Product
                                </span>
                                <h5 className="font-black text-xs truncate">{msg.productCard.name}</h5>
                                <span className="text-[10px] font-bold">₱{msg.productCard.price}</span>
                              </div>
                            </div>
                          )}

                          {/* Order Card */}
                          {msg.orderCard && (
                            <div className="my-2 p-3 bg-black/20 dark:bg-white/10 rounded-xl border border-black/10 dark:border-white/10 space-y-1">
                              <div className="flex justify-between items-center text-[10px] font-black uppercase">
                                <span>Order #{msg.orderCard.id.slice(-4)}</span>
                                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30">
                                  {msg.orderCard.status}
                                </span>
                              </div>
                              <p className="text-[10px] opacity-80 font-medium truncate">{msg.orderCard.itemSummary}</p>
                              <div className="text-[10px] font-bold pt-1">Total: ₱{msg.orderCard.total.toLocaleString()}</div>
                            </div>
                          )}

                          {/* Text Message */}
                          {msg.text && <p className="whitespace-pre-wrap break-words">{msg.text}</p>}

                          {/* Reaction Pills */}
                          {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2 pt-1 border-t border-black/10 dark:border-white/10">
                              {Object.entries(msg.reactions).map(([emoji, uids]) => (
                                <button
                                  key={emoji}
                                  onClick={() => onToggleReaction && onToggleReaction(msg.id, emoji)}
                                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border ${
                                    uids.includes(currentUserId)
                                      ? 'bg-amber-400 text-slate-900 border-amber-300'
                                      : 'bg-black/10 dark:bg-white/10 text-slate-300 border-white/10'
                                  }`}
                                >
                                  <span>{emoji}</span>
                                  <span>{uids.length}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Reaction Trigger Bar */}
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

              {/* Recording Voice Note Indicator */}
              {isRecording && (
                <div className="p-4 bg-rose-950/80 border-t border-rose-500/30 flex items-center justify-between shrink-0 animate-pulse">
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                    <span className="text-xs font-mono font-black text-rose-200">
                      Recording Voice Note... {Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, '0')}
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

              {/* Product Picker Drawer */}
              {showProductPicker && (
                <div className="p-4 bg-black/80 backdrop-blur-xl border-t border-amber-500/20 max-h-60 overflow-y-auto space-y-3 shrink-0">
                  <div className="flex justify-between items-center text-xs font-black text-amber-500 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <Coffee className="w-4 h-4" /> Recommend a Product
                    </span>
                    <button onClick={() => setShowProductPicker(false)} className="text-slate-400 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <input
                    type="text"
                    placeholder="Search shop products..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {products
                      .filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase()))
                      .map((prod) => (
                        <button
                          key={prod.id}
                          onClick={() => handleSendProductCard(prod)}
                          className="p-2 bg-white/5 hover:bg-amber-500/20 border border-white/10 hover:border-amber-500/40 rounded-xl text-left flex items-center gap-2 transition-all group"
                        >
                          <img src={prod.image} alt={prod.name} className="w-8 h-8 rounded-lg object-cover shrink-0" />
                          <div className="min-w-0 flex-1">
                            <h6 className="text-[11px] font-black text-white group-hover:text-amber-400 truncate">{prod.name}</h6>
                            <span className="text-[10px] font-bold text-amber-500">₱{prod.price}</span>
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* Order Picker Drawer for Admin */}
              {showOrderPicker && (
                <div className="p-4 bg-black/80 backdrop-blur-xl border-t border-amber-500/20 max-h-52 overflow-y-auto space-y-2 shrink-0">
                  <div className="flex justify-between items-center text-xs font-black text-amber-500 uppercase tracking-wider mb-2">
                    <span>Select Order to Share</span>
                    <button onClick={() => setShowOrderPicker(false)} className="text-slate-400 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {customerOrders.length === 0 ? (
                    <div className="text-xs text-slate-400 text-center py-2">No recent customer orders found</div>
                  ) : (
                    customerOrders.map((ord) => (
                      <button
                        key={ord.id}
                        onClick={() => handleSendOrderCard(ord)}
                        className="w-full p-2.5 bg-white/5 hover:bg-amber-500/20 border border-white/10 rounded-xl flex justify-between items-center text-left text-xs text-white transition-all"
                      >
                        <div>
                          <span className="font-bold text-amber-400">#{ord.id?.slice(-4)}</span>
                          <p className="text-[10px] text-slate-400 truncate max-w-[220px]">
                            {ord.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                          </p>
                        </div>
                        <span className="font-black text-amber-300 text-xs">₱{ord.total}</span>
                      </button>
                    ))
                  )}
                </div>
              )}

              {/* Image Input Bar */}
              {showImageInput && !isRecording && (
                <div className="p-3 bg-black/10 dark:bg-white/5 border-t border-black/10 dark:border-white/10 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-amber-500 shrink-0" />
                  <input
                    type="text"
                    placeholder="Paste Image URL or uploaded photo will send..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="flex-1 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
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

              {/* Message Composer Footer */}
              {!isRecording && (
                <form onSubmit={handleSend} className="p-4 bg-black/10 dark:bg-white/5 border-t border-black/10 dark:border-white/10 shrink-0 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`p-3 rounded-2xl border transition-all ${
                      imageUrl
                        ? 'bg-amber-500 text-slate-900 border-amber-400'
                        : 'bg-black/5 dark:bg-white/5 text-slate-400 border-black/10 dark:border-white/10 hover:text-slate-900 dark:hover:text-white'
                    }`}
                    title="Upload Photo / Attachment"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowProductPicker(!showProductPicker)}
                    className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-amber-500 hover:bg-amber-500 hover:text-slate-900 transition-all"
                    title="Recommend Product Card"
                  >
                    <Coffee className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowOrderPicker(!showOrderPicker)}
                    className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
                    title="Share Order Card"
                  >
                    <Receipt className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={startRecording}
                    className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-rose-500 hover:bg-rose-500/20 transition-all"
                    title="Record Voice Note"
                  >
                    <Mic className="w-4 h-4" />
                  </button>

                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={`Reply to ${activeThread.customerName}...`}
                    className="flex-1 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl px-4 py-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 font-medium"
                  />

                  <button
                    type="submit"
                    disabled={(!inputText.trim() && !imageUrl.trim()) || sending}
                    className="p-3 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-900 font-black transition-all shadow-md active:scale-95 shrink-0"
                  >
                    <Send className="w-4 h-4 fill-slate-900" />
                  </button>
                </form>
              )}
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-slate-500">
              <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
              <h3 className="text-base font-black uppercase tracking-wider text-slate-900 dark:text-white mb-1 font-display">
                Select a conversation
              </h3>
              <p className="text-xs text-slate-400">
                Choose a customer thread from the left sidebar to start live chatting.
              </p>
            </div>
          )}
        </div>

        {/* Right Collapsible Panel - Customer & Order History Context */}
        {showCustomerDetails && activeThread && (
          <div className="hidden lg:flex lg:col-span-3 flex-col h-full bg-slate-900/60 dark:bg-black/30 p-6 overflow-y-auto space-y-6">
            <div className="text-center pb-4 border-b border-black/10 dark:border-white/10">
              <div className="w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-black text-2xl uppercase mx-auto mb-3 border border-amber-500/30">
                {activeThread.customerName.charAt(0)}
              </div>
              <h3 className="font-black text-base text-slate-900 dark:text-white uppercase tracking-tight font-display">
                {activeThread.customerName}
              </h3>
              <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                {activeThread.customerEmail || 'Guest Account'}
              </p>
            </div>

            {/* Customer Orders Summary */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5" /> Recent Orders ({customerOrders.length})
                </span>
              </div>

              {customerOrders.length === 0 ? (
                <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 text-center text-slate-400 text-xs">
                  No active or past orders found for this customer.
                </div>
              ) : (
                <div className="space-y-2 max-h-[380px] overflow-y-auto scrollbar-hide">
                  {customerOrders.map((order) => (
                    <div
                      key={order.id}
                      className="p-3 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/10 dark:border-white/10 space-y-1.5"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-black text-xs text-slate-900 dark:text-white font-display">
                          #{order.id?.slice(-4)}
                        </span>
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 uppercase border border-amber-500/20">
                          {order.status}
                        </span>
                      </div>

                      <div className="text-[10px] text-slate-400 font-medium">
                        {order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                      </div>

                      <div className="flex justify-between items-center pt-1 border-t border-black/5 dark:border-white/5 text-[10px]">
                        <span className="text-slate-400">₱{order.total.toLocaleString()}</span>
                        <span className="text-[9px] text-slate-500 font-bold">
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
