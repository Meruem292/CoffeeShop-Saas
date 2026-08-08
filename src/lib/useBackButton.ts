import { useEffect, useRef } from 'react';

type BackHandler = () => void;

interface StackItem {
  id: string;
  onBack: BackHandler;
}

const handlerStack: StackItem[] = [];

if (typeof window !== 'undefined') {
  window.addEventListener('popstate', (e) => {
    if (handlerStack.length > 0) {
      const top = handlerStack.pop();
      if (top) {
        // Prevent default browser history navigation that could exit the app
        e.preventDefault();
        top.onBack();
      }
    }
  });
}

/**
 * Custom hook to register a safe back-button handler for active modals, views, or screens.
 * Never forces browser history back navigation on unmount to prevent exiting the app to Chrome home.
 */
export function useBackButton(active: boolean, onBack: () => void, id: string) {
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;

  useEffect(() => {
    if (!active) return;

    // Remove existing if any
    const existingIndex = handlerStack.findIndex(item => item.id === id);
    if (existingIndex !== -1) {
      handlerStack.splice(existingIndex, 1);
    }

    try {
      window.history.pushState({ backId: id }, '');
    } catch (e) {
      // Ignore
    }

    handlerStack.push({
      id,
      onBack: () => onBackRef.current()
    });

    return () => {
      const index = handlerStack.findIndex(item => item.id === id);
      if (index !== -1) {
        handlerStack.splice(index, 1);
      }
    };
  }, [active, id]);
}
