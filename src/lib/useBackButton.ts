import { useEffect, useRef } from 'react';

type BackHandler = () => void;

interface StackItem {
  id: string;
  onBack: BackHandler;
}

const handlerStack: StackItem[] = [];
let isPoppingState = false;
let ignoreNextPopState = false;

if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    if (ignoreNextPopState) {
      ignoreNextPopState = false;
      return;
    }

    if (handlerStack.length > 0) {
      isPoppingState = true;
      const top = handlerStack.pop();
      if (top) {
        top.onBack();
      }
      setTimeout(() => {
        isPoppingState = false;
      }, 100);
    }
  });
}

/**
 * Custom hook to register a natural back-button handler for active modals, views, or screens.
 * @param active Whether the modal/view/screen is currently active
 * @param onBack Callback function to run when the back button is pressed
 * @param id Unique identifier for this back handler
 */
export function useBackButton(active: boolean, onBack: () => void, id: string) {
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;
  const pushedRef = useRef(false);

  useEffect(() => {
    if (!active) return;

    // Register handler and push history state if not already registered
    const existingIndex = handlerStack.findIndex(item => item.id === id);
    if (existingIndex === -1) {
      let success = false;
      try {
        window.history.pushState({ backId: id }, '');
        success = true;
      } catch (e) {
        // Ignore history errors if restricted environment
      }
      pushedRef.current = success;
      handlerStack.push({
        id,
        onBack: () => onBackRef.current()
      });
    }

    return () => {
      const index = handlerStack.findIndex(item => item.id === id);
      if (index !== -1) {
        handlerStack.splice(index, 1);
        if (!isPoppingState && pushedRef.current) {
          ignoreNextPopState = true;
          try {
            window.history.back();
          } catch (e) {
            ignoreNextPopState = false;
          }
        }
        pushedRef.current = false;
      }
    };
  }, [active, id]);
}
