import React, { useEffect, useState, useRef } from 'react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
interface Message {
  id: number;
  text: string;
  isBot: boolean;
  timestamp: Date;
}
interface ChatBotProps {
  isOpenControlled?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
}
const quickReplies = [
'¿Cómo funciona la lavadora?',
'¿Dónde puedo cenar cerca?',
'¿Cuál es la contraseña del WiFi?',
'¿A qué hora es el check-out?'];

const botResponses: Record<string, string> = {
  lavadora:
  '🧺 La lavadora está en la cocina. El detergente está bajo el fregadero. Te recomiendo el programa Eco 30° para ropa normal. ¿Necesitas más ayuda?',
  wifi: '📶 La red WiFi es "CasaRefugio_Guest" y la contraseña es "ruralrelax2024". El router está detrás de la TV si necesitas reiniciarlo.',
  cenar:
  '🍽️ ¡Hay opciones geniales cerca! Te recomiendo:\n\n• La Barraca (200m) - Paella increíble\n• Trattoria Roma (150m) - Pasta casera\n• El Tigre (300m) - Tapas gratis con bebida\n\n¿Quieres que te dé más detalles de alguno?',
  'check-out':
  '🕐 El check-out es antes de las 11:00. Recuerda cerrar ventanas, apagar luces y dejar las llaves en la mesa del salón. ¡Gracias!',
  default:
  '¡Hola! Soy el asistente de Casa Rural El Refugio. Puedo ayudarte con:\n\n• Información de la casa\n• Recomendaciones locales\n• Instrucciones de electrodomésticos\n• Emergencias\n\n¿En qué puedo ayudarte?'
};
function getBotResponse(message: string): string {
  const lowerMessage = message.toLowerCase();
  if (lowerMessage.includes('lavadora') || lowerMessage.includes('lavar')) {
    return botResponses['lavadora'];
  }
  if (
  lowerMessage.includes('wifi') ||
  lowerMessage.includes('internet') ||
  lowerMessage.includes('contraseña'))
  {
    return botResponses['wifi'];
  }
  if (
  lowerMessage.includes('cenar') ||
  lowerMessage.includes('comer') ||
  lowerMessage.includes('restaurante'))
  {
    return botResponses['cenar'];
  }
  if (
  lowerMessage.includes('check-out') ||
  lowerMessage.includes('checkout') ||
  lowerMessage.includes('salida'))
  {
    return botResponses['check-out'];
  }
  return botResponses['default'];
}
export function ChatBot({ isOpenControlled, onOpenChange }: ChatBotProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  // Use controlled state if provided, otherwise internal state
  const isOpen =
  isOpenControlled !== undefined ? isOpenControlled : internalIsOpen;
  const setIsOpen = (value: boolean) => {
    if (onOpenChange) {
      onOpenChange(value);
    } else {
      setInternalIsOpen(value);
    }
  };
  const [messages, setMessages] = useState<Message[]>([
  {
    id: 1,
    text: '¡Hola! 👋 Soy tu asistente virtual. ¿En qué puedo ayudarte durante tu estancia?',
    isBot: true,
    timestamp: new Date()
  }]
  );
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  };
  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);
  const handleSend = (text?: string) => {
    const messageText = text || inputValue.trim();
    if (!messageText) return;
    // Add user message
    const userMessage: Message = {
      id: Date.now(),
      text: messageText,
      isBot: false,
      timestamp: new Date()
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    // Simulate bot typing
    setIsTyping(true);
    setTimeout(
      () => {
        const botMessage: Message = {
          id: Date.now() + 1,
          text: getBotResponse(messageText),
          isBot: true,
          timestamp: new Date()
        };
        setMessages((prev) => [...prev, botMessage]);
        setIsTyping(false);
      },
      1000 + Math.random() * 500
    );
  };
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-24 right-6 w-14 h-14 bg-navy text-cream rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 z-40 ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        aria-label="Abrir chat de ayuda">

        <MessageCircle className="w-6 h-6" />
      </button>

      {/* Chat Window */}
      <div
        className={`fixed inset-0 z-50 flex items-end justify-center sm:items-center transition-all duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>

        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/20 backdrop-blur-sm"
          onClick={() => setIsOpen(false)} />


        {/* Chat Container */}
        <div
          className={`relative w-full max-w-md h-[85vh] sm:h-[600px] bg-cream rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-transform duration-300 ${isOpen ? 'translate-y-0' : 'translate-y-full sm:translate-y-8 sm:scale-95'}`}>

          {/* Header */}
          <div className="bg-navy text-cream px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-cream/20 flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-medium">Asistente Virtual</h3>
                <p className="text-cream/70 text-xs">Casa Rural El Refugio</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-full hover:bg-cream/10 transition-colors"
              aria-label="Cerrar chat">

              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) =>
            <div
              key={message.id}
              className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}>

                <div
                className={`flex items-end gap-2 max-w-[85%] ${message.isBot ? '' : 'flex-row-reverse'}`}>

                  <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${message.isBot ? 'bg-navy text-cream' : 'bg-beige-dark text-navy'}`}>

                    {message.isBot ?
                  <Bot className="w-4 h-4" /> :

                  <User className="w-4 h-4" />
                  }
                  </div>
                  <div
                  className={`px-4 py-3 rounded-2xl text-sm whitespace-pre-line ${message.isBot ? 'bg-white text-navy rounded-bl-md shadow-card' : 'bg-navy text-cream rounded-br-md'}`}>

                    {message.text}
                  </div>
                </div>
              </div>
            )}

            {/* Typing indicator */}
            {isTyping &&
            <div className="flex justify-start">
                <div className="flex items-end gap-2">
                  <div className="w-7 h-7 rounded-full bg-navy text-cream flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-md shadow-card">
                    <div className="flex gap-1">
                      <span
                      className="w-2 h-2 bg-slate/40 rounded-full animate-bounce"
                      style={{
                        animationDelay: '0ms'
                      }} />

                      <span
                      className="w-2 h-2 bg-slate/40 rounded-full animate-bounce"
                      style={{
                        animationDelay: '150ms'
                      }} />

                      <span
                      className="w-2 h-2 bg-slate/40 rounded-full animate-bounce"
                      style={{
                        animationDelay: '300ms'
                      }} />

                    </div>
                  </div>
                </div>
              </div>
            }

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies */}
          {messages.length <= 2 &&
          <div className="px-4 pb-2">
              <p className="text-slate text-xs mb-2">Preguntas frecuentes:</p>
              <div className="flex flex-wrap gap-2">
                {quickReplies.map((reply, i) =>
              <button
                key={i}
                onClick={() => handleSend(reply)}
                className="text-xs bg-white text-navy px-3 py-1.5 rounded-full border border-beige-dark hover:border-navy transition-colors">

                    {reply}
                  </button>
              )}
              </div>
            </div>
          }

          {/* Input */}
          <div className="p-4 border-t border-beige-dark bg-white">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe tu pregunta..."
                className="flex-1 bg-beige rounded-full px-4 py-3 text-sm text-navy placeholder:text-slate/50 focus:outline-none focus:ring-2 focus:ring-navy/20" />

              <button
                onClick={() => handleSend()}
                disabled={!inputValue.trim()}
                className="w-11 h-11 bg-navy text-cream rounded-full flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-navy-light transition-colors"
                aria-label="Enviar mensaje">

                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>);

}