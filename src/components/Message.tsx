import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import styles from './Message.module.scss';

type MessageType = 'error' | 'warning' | 'success';

interface MessageContextValue {
  showMessage: (type: MessageType, content: string) => void;
}

const MessageContext = createContext<MessageContextValue | null>(null);

export function useMessage() {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessage must be used within MessageProvider');
  }
  return context;
}

export function MessageProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<{ id: number; type: MessageType; content: string }[]>([]);
  const [idCounter, setIdCounter] = useState(0);

  const showMessage = useCallback((type: MessageType, content: string) => {
    const id = idCounter + 1;
    setIdCounter(id);
    setMessages((prev) => [...prev, { id, type, content }]);
    setTimeout(() => {
      setMessages((prev) => prev.filter((msg) => msg.id !== id));
    }, 3000);
  }, [idCounter]);

  return (
    <MessageContext.Provider value={{ showMessage }}>
      {children}
      <div className={styles.container}>
        {messages.map((msg) => (
          <div key={msg.id} className={`${styles.message} ${styles[msg.type]}`}>
            {msg.content}
          </div>
        ))}
      </div>
    </MessageContext.Provider>
  );
}