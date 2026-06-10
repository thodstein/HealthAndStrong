import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, Sparkles, MessageSquare, Shield, RefreshCw, X } from "lucide-react";
import { ChatMessage } from "../types";

export default function AICoach() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem("bbh_coach_chats");
    return saved
      ? JSON.parse(saved)
      : [
          {
            role: "assistant",
            content: "Greetings, athlete! I'm **Coach Iron**, your elite virtual bodybuilding coach and sports conditioning specialist. Let's maximize your hypertrophy potential. Ask me anything about:\n\n- Perfecting lifting biomechanics and form tips\n- Managing plateau break protocols and progressive overload\n- High protein bodybuilding nutrition and custom meal logs\n- Muscle splits and custom routine designs\n\nWhat are we optimizing today, champ?",
          },
        ];
  });

  const [inputMsg, setInputMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  // Auto scroll to latest bubbles
  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Save chats
  useEffect(() => {
    localStorage.setItem("bbh_coach_chats", JSON.stringify(messages));
  }, [messages]);

  // Quick advice buttons
  const quickAdviceChips = [
    "Explain progressive overload mechanical tension.",
    "Give me 3 high-protein bodybuilding snack ideas.",
    "How do I break through a flat bench press plateau?",
    "Perfect dumbbell lateral raise shoulders guidelines."
  ];

  // Send msg to local API proxying Gemini
  const handleSendMessage = async (userText: string) => {
    if (!userText.trim() || isLoading) return;

    setErrorStatus(null);
    const newMessages: ChatMessage[] = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setInputMsg("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/trainer/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Send last 6 messages to preserve context without spilling over limits
        body: JSON.stringify({ messages: newMessages.slice(-8) }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed secure handshake communication with Coach Iron.");
      }

      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (err: any) {
      console.error(err);
      setErrorStatus(
        err.message || "Failed to contact Coach Iron. Ensure the API secret is configured."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setShowResetConfirm(true);
  };

  const confirmResetAction = () => {
    setMessages([
      {
        role: "assistant",
        content: "Dialogue reset! Ready for your instruction, champ. What bodybuilding or training objective are we conquering next?",
      },
    ]);
    setErrorStatus(null);
    setShowResetConfirm(false);
  };

  return (
    <div id="ai_coach_container" className="bg-slate-900 border border-slate-805 rounded-3xl p-6 shadow-xl flex flex-col h-[650px] relative overflow-hidden">
      
      {/* Coach Dashboard Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-800/60 mb-4 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-lime-404 rounded-lg bg-lime-400 flex items-center justify-center shadow-lg relative shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-lime-300 absolute -top-0.5 -right-0.5 animate-pulse" />
            <MessageSquare className="w-4 h-4 text-black" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-wide text-slate-100 font-sans">COACH IRON</h3>
            <span className="text-[10px] font-mono text-lime-404 text-lime-400 font-bold uppercase flex items-center gap-1 mt-0.5">
              <Shield className="w-3 h-3 text-lime-400" /> Active AI Trainer
            </span>
          </div>
        </div>

        <button
          onClick={handleResetChat}
          className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
          title="Reset chat stream"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Message Chat Room */}
      <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4 mb-4">
        {messages.map((msg, idx) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={idx}
              className={`flex ${isUser ? "justify-end" : "justify-start"} max-w-full`}
            >
              <div
                className={`p-4 rounded-2xl max-w-[85%] text-xs font-sans leading-relaxed tracking-normal transition-all ${
                  isUser
                    ? "bg-lime-404 bg-lime-400 text-black font-semibold rounded-br-sm shadow-[0_0_15px_rgba(163,230,53,0.15)]"
                    : "bg-slate-950 border border-slate-850 text-slate-200 rounded-bl-sm"
                }`}
              >
                {/* Visual markdown-style paragraph break replacement parser */}
                <div className="whitespace-pre-wrap select-text">
                  {msg.content.split("\n").map((line, lIdx) => {
                    // Render simple bullet lists or bold keywords
                    if (line.startsWith("- ")) {
                      return (
                        <li key={lIdx} className="ml-3 mt-1.5 list-disc text-slate-300">
                          {line.substring(2)}
                        </li>
                      );
                    }
                    // Quick bold keyword matcher **text**
                    if (line.includes("**")) {
                      const segments = line.split("**");
                      return (
                        <p key={lIdx} className={lIdx > 0 ? "mt-2.5" : ""}>
                          {segments.map((seg, sIdx) =>
                            sIdx % 2 === 1 ? <strong key={sIdx} className="text-white font-bold">{seg}</strong> : seg
                          )}
                        </p>
                      );
                    }
                    return line ? (
                      <p key={lIdx} className={lIdx > 0 ? "mt-2.5" : ""}>{line}</p>
                    ) : (
                      <div key={lIdx} className="h-2" />
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}

        {/* Coach loading active bubble */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-950 border border-slate-850 text-slate-400 p-4 rounded-2xl rounded-bl-sm flex items-center gap-1.5 font-mono text-[10px]">
              <Sparkles className="w-3.5 h-3.5 text-lime-404 text-lime-400 animate-pulse shrink-0" />
              <span>COACH IRON CONSTRUCTING REPS PATHWAY</span>
              <span className="flex gap-1 items-center ml-1">
                <span className="w-1 h-1 bg-lime-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1 h-1 bg-lime-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1 h-1 bg-lime-400 rounded-full animate-bounce" />
              </span>
            </div>
          </div>
        )}

        {errorStatus && (
          <div className="p-3 bg-red-950/20 border border-red-900/40 rounded-xl text-[11px] text-red-500 font-sans">
            ⚠️ <strong>Secure Handshake Error:</strong> {errorStatus}
            <br />
            <span className="text-slate-400 text-[10px] block mt-1 leading-relaxed">
              Make sure your Gemini API key is configured correctly in the Secrets tab. You can still track local routines and logs.
            </span>
          </div>
        )}

        <div ref={endOfMessagesRef} />
      </div>

      {/* Suggested Quick advice prompts chips */}
      {messages.length === 1 && (
        <div className="mb-3.5 flex flex-wrap gap-2 z-10">
          {quickAdviceChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(chip)}
              className="text-[10px] bg-slate-950 border border-slate-800 hover:border-slate-705 text-slate-400 hover:text-lime-404 hover:text-lime-400 px-3 py-1.5 rounded-xl transition-all font-mono tracking-tight font-medium cursor-pointer"
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* Interactive prompt input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(inputMsg);
        }}
        className="flex gap-2.5 pt-3 border-t border-slate-850/60 mt-auto z-10"
      >
        <input
          type="text"
          placeholder="Ask Coach Iron about bench technique, macro goals..."
          value={inputMsg}
          onChange={(e) => setInputMsg(e.target.value)}
          disabled={isLoading}
          className="flex-1 bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-lime-400 rounded-xl px-4 py-3 text-xs text-white focus:outline-none placeholder-slate-650 disabled:opacity-50 transition-colors font-semibold"
        />
        <button
          type="submit"
          disabled={isLoading || !inputMsg.trim()}
          className="p-3 bg-lime-404 bg-lime-400 hover:bg-lime-300 disabled:bg-slate-800 text-black rounded-xl transition-all flex items-center justify-center shrink-0 shadow-lg disabled:shadow-none cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      <AnimatePresence>
        {showResetConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4 z-50 text-center"
          >
            <motion.div
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              className="bg-slate-900 border border-slate-800 p-6 rounded-3xl max-w-sm shadow-2xl flex flex-col items-center"
            >
              <div className="w-12 h-12 bg-red-950/40 text-red-400 rounded-full flex items-center justify-center mb-4 border border-red-900/50">
                <RefreshCw className="w-5 h-5 animate-spin" />
              </div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Reset Dialogue Stream?</h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Are you sure you want to declare a total reset with Coach Iron? This will wipe your active chat history.
              </p>
              <div className="flex gap-2.5 mt-5 w-full">
                <button
                  onClick={confirmResetAction}
                  className="flex-1 py-2 bg-red-500 hover:bg-red-400 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Yes, Reset Chat
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
