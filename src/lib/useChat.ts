import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  where, 
  increment,
  getDocs
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { ChatThread, ChatMessage } from '../types';
import { playNotificationSound, playChatNotificationSound } from './audio';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error in Chat: ', JSON.stringify(errInfo));
}

export function useChat(params: {
  userId?: string | null;
  isAdmin?: boolean;
  guestId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhoto?: string;
  onNewMessageNotification?: (info: { senderName: string; text: string; threadId: string; role: 'admin' | 'customer' }) => void;
}) {
  const { userId, isAdmin, guestId, customerName, customerEmail, customerPhoto, onNewMessageNotification } = params;

  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Determine actual customer identifier
  const currentCustomerId = userId || guestId || 'guest_user';
  const effectiveName = customerName || (userId ? 'Customer' : 'Guest');

  // Track previous unread counts & initial load
  const isInitialLoadAdmin = useRef(true);
  const isInitialLoadCustomer = useRef(true);
  const prevUnreadAdminTotal = useRef<number>(-1);
  const prevUnreadCustomerTotal = useRef<number>(-1);
  const prevLatestMessageAtRef = useRef<number>(0);

  // 1. Listen for Threads
  useEffect(() => {
    setLoadingThreads(true);
    const threadsRef = collection(db, 'chat_threads');

    let q;
    if (isAdmin) {
      // Admin listens to all threads sorted by latest activity
      q = query(threadsRef, orderBy('lastMessageAt', 'desc'));
    } else {
      // Customer listens only to their own thread
      q = query(threadsRef, where('customerId', '==', currentCustomerId));
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loadedThreads: ChatThread[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as ChatThread[];

        // Calculate current unread totals
        const currentUnreadAdmin = loadedThreads.reduce((acc, t) => acc + (t.unreadCountAdmin || 0), 0);
        const myThread = loadedThreads.find((t) => t.customerId === currentCustomerId);
        const currentUnreadCustomer = myThread?.unreadCountCustomer || 0;

        const latestThreadWithActivity = loadedThreads[0];
        const latestTime = latestThreadWithActivity?.lastMessageAt || 0;

        // Check for new incoming messages for Admin
        if (isAdmin) {
          if (!isInitialLoadAdmin.current) {
            if (currentUnreadAdmin > prevUnreadAdminTotal.current || (currentUnreadAdmin > 0 && latestTime > prevLatestMessageAtRef.current)) {
              try { playChatNotificationSound(); } catch (e) {}
              if (latestThreadWithActivity && onNewMessageNotification) {
                onNewMessageNotification({
                  senderName: latestThreadWithActivity.customerName || 'Customer',
                  text: latestThreadWithActivity.lastMessage || 'Sent a message',
                  threadId: latestThreadWithActivity.id,
                  role: 'admin'
                });
              }
            }
          }
          prevUnreadAdminTotal.current = currentUnreadAdmin;
          isInitialLoadAdmin.current = false;
        } else {
          // Check for new incoming messages for Customer
          if (!isInitialLoadCustomer.current) {
            if (currentUnreadCustomer > prevUnreadCustomerTotal.current || (currentUnreadCustomer > 0 && latestTime > prevLatestMessageAtRef.current)) {
              try { playChatNotificationSound(); } catch (e) {}
              if (myThread && onNewMessageNotification) {
                onNewMessageNotification({
                  senderName: 'Live Support',
                  text: myThread.lastMessage || 'Sent a message',
                  threadId: myThread.id,
                  role: 'customer'
                });
              }
            }
          }
          prevUnreadCustomerTotal.current = currentUnreadCustomer;
          isInitialLoadCustomer.current = false;
        }

        prevLatestMessageAtRef.current = latestTime;

        setThreads(loadedThreads);
        setLoadingThreads(false);

        // Auto-select first thread for admin if none selected
        if (isAdmin && loadedThreads.length > 0 && !activeThreadId) {
          setActiveThreadId(loadedThreads[0].id);
        } else if (!isAdmin && loadedThreads.length > 0) {
          setActiveThreadId(loadedThreads[0].id);
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'chat_threads');
        setLoadingThreads(false);
      }
    );

    return () => unsubscribe();
  }, [isAdmin, currentCustomerId]);

  // 2. Listen for Messages of the activeThreadId
  useEffect(() => {
    if (!activeThreadId) {
      setMessages([]);
      return;
    }

    setLoadingMessages(true);
    const messagesRef = collection(db, 'chat_threads', activeThreadId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loadedMessages: ChatMessage[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as ChatMessage[];

        setMessages(loadedMessages);
        setLoadingMessages(false);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, `chat_threads/${activeThreadId}/messages`);
        setLoadingMessages(false);
      }
    );

    return () => unsubscribe();
  }, [activeThreadId]);

  // Calculate totals
  const totalUnreadAdmin = threads.reduce((acc, t) => acc + (t.unreadCountAdmin || 0), 0);
  const myThread = threads.find((t) => t.customerId === currentCustomerId || t.id === activeThreadId);
  const totalUnreadCustomer = myThread?.unreadCountCustomer || 0;

  // 3. Mark messages as read for active thread
  const markAsRead = useCallback(
    async (threadId: string, role: 'customer' | 'admin') => {
      try {
        const threadRef = doc(db, 'chat_threads', threadId);
        if (role === 'admin') {
          await updateDoc(threadRef, { unreadCountAdmin: 0, updatedAt: Date.now() });
        } else {
          await updateDoc(threadRef, { unreadCountCustomer: 0, updatedAt: Date.now() });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `chat_threads/${threadId}`);
      }
    },
    []
  );

  // Auto mark as read when thread is selected
  useEffect(() => {
    if (activeThreadId) {
      markAsRead(activeThreadId, isAdmin ? 'admin' : 'customer');
    }
  }, [activeThreadId, isAdmin, markAsRead]);

  // 4. Send Message Function
  const sendMessage = async (payload: {
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
    senderRole: 'customer' | 'admin';
    senderId: string;
    senderName: string;
    recipientCustomerId?: string;
    recipientCustomerName?: string;
    recipientCustomerEmail?: string;
  }) => {
    const textTrimmed = payload.text.trim();
    if (!textTrimmed && !payload.imageUrl && !payload.audioUrl && !payload.productCard && !payload.orderCard) return '';

    const targetCustomerId = payload.recipientCustomerId || currentCustomerId;
    let targetThreadId = payload.threadId || activeThreadId;

    // If no thread exists yet for customer, construct thread ID deterministically
    if (!targetThreadId) {
      targetThreadId = `thread_${targetCustomerId}`;
    }

    const now = Date.now();
    const threadRef = doc(db, 'chat_threads', targetThreadId);

    let snippet = textTrimmed;
    if (!snippet) {
      if (payload.imageUrl) snippet = '📷 Sent an image';
      else if (payload.audioUrl) snippet = '🎙️ Sent a voice note';
      else if (payload.productCard) snippet = `☕ Recommended: ${payload.productCard.name}`;
      else if (payload.orderCard) snippet = `📋 Shared Order #${payload.orderCard.id.slice(-4)}`;
    }

    try {
      // Ensure thread exists or update thread summary
      const isCustomerSending = payload.senderRole === 'customer';
      const custName = payload.recipientCustomerName || effectiveName;
      const custEmail = payload.recipientCustomerEmail || customerEmail;

      await setDoc(
        threadRef,
        {
          id: targetThreadId,
          customerId: targetCustomerId,
          customerName: custName,
          ...(custEmail ? { customerEmail: custEmail } : {}),
          ...(customerPhoto ? { customerPhoto } : {}),
          lastMessage: snippet,
          lastMessageAt: now,
          unreadCountAdmin: isCustomerSending ? increment(1) : 0,
          unreadCountCustomer: isCustomerSending ? 0 : increment(1),
          status: 'active',
          updatedAt: now,
          createdAt: now,
        },
        { merge: true }
      );

      // Add message to subcollection
      const messagesRef = collection(db, 'chat_threads', targetThreadId, 'messages');
      const newMsgDoc = await addDoc(messagesRef, {
        threadId: targetThreadId,
        senderId: payload.senderId,
        senderRole: payload.senderRole,
        senderName: payload.senderName,
        text: textTrimmed,
        ...(payload.imageUrl ? { imageUrl: payload.imageUrl } : {}),
        ...(payload.audioUrl ? { audioUrl: payload.audioUrl } : {}),
        ...(payload.audioDuration ? { audioDuration: payload.audioDuration } : {}),
        ...(payload.productCard ? { productCard: payload.productCard } : {}),
        ...(payload.orderCard ? { orderCard: payload.orderCard } : {}),
        createdAt: now,
        read: false,
      });

      if (activeThreadId !== targetThreadId) {
        setActiveThreadId(targetThreadId);
      }

      return newMsgDoc.id;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `chat_threads/${targetThreadId}`);
      throw err;
    }
  };

  // Helper to initiate a new thread from Admin side
  const startNewThread = async (recipient: {
    customerId: string;
    customerName: string;
    customerEmail?: string;
    initialMessage?: string;
  }) => {
    const threadId = `thread_${recipient.customerId}`;
    const now = Date.now();
    const threadRef = doc(db, 'chat_threads', threadId);

    await setDoc(
      threadRef,
      {
        id: threadId,
        customerId: recipient.customerId,
        customerName: recipient.customerName,
        ...(recipient.customerEmail ? { customerEmail: recipient.customerEmail } : {}),
        lastMessage: recipient.initialMessage || 'Conversation started by Store Admin',
        lastMessageAt: now,
        unreadCountAdmin: 0,
        unreadCountCustomer: 0,
        status: 'active',
        updatedAt: now,
        createdAt: now,
      },
      { merge: true }
    );

    setActiveThreadId(threadId);
    return threadId;
  };

  // Toggle emoji reaction
  const toggleReaction = async (messageId: string, emoji: string, currentUserId: string) => {
    if (!activeThreadId || !messageId) return;
    try {
      const msgRef = doc(db, 'chat_threads', activeThreadId, 'messages', messageId);
      const msgDoc = messages.find((m) => m.id === messageId);
      if (!msgDoc) return;

      const currentReactions = msgDoc.reactions || {};
      const usersForEmoji = currentReactions[emoji] || [];

      let updatedUsers: string[];
      if (usersForEmoji.includes(currentUserId)) {
        updatedUsers = usersForEmoji.filter((u) => u !== currentUserId);
      } else {
        updatedUsers = [...usersForEmoji, currentUserId];
      }

      const updatedReactions = { ...currentReactions };
      if (updatedUsers.length === 0) {
        delete updatedReactions[emoji];
      } else {
        updatedReactions[emoji] = updatedUsers;
      }

      await updateDoc(msgRef, { reactions: updatedReactions });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `chat_threads/${activeThreadId}/messages/${messageId}`);
    }
  };

  // 5. Update thread status (Archive / Close / Active)
  const updateThreadStatus = async (threadId: string, status: 'active' | 'archived' | 'closed') => {
    try {
      const threadRef = doc(db, 'chat_threads', threadId);
      await updateDoc(threadRef, { status, updatedAt: Date.now() });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `chat_threads/${threadId}`);
    }
  };

  // 6. Delete thread (Admin)
  const deleteThread = async (threadId: string) => {
    try {
      // First delete subcollection messages
      const msgsRef = collection(db, 'chat_threads', threadId, 'messages');
      const snap = await getDocs(msgsRef);
      const deletePromises = snap.docs.map((d) => deleteDoc(d.ref));
      await Promise.all(deletePromises);

      // Delete thread doc
      await deleteDoc(doc(db, 'chat_threads', threadId));
      if (activeThreadId === threadId) {
        setActiveThreadId(null);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `chat_threads/${threadId}`);
    }
  };

  return {
    threads,
    messages,
    activeThreadId,
    setActiveThreadId,
    totalUnreadAdmin,
    totalUnreadCustomer,
    loadingThreads,
    loadingMessages,
    sendMessage,
    startNewThread,
    toggleReaction,
    markAsRead,
    updateThreadStatus,
    deleteThread,
    currentCustomerId,
  };
}
