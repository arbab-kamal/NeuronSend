"use client";
import { useChat } from "ai/react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { AnimatePresence } from "framer-motion";
import React from "react";
import { Send } from "lucide-react";
import { useLocalStorage } from "usehooks-ts";
import { cn } from "@/lib/utils";
import { SparklesIcon } from "@heroicons/react/24/solid";
import StripeButton from "./stripe-button";
import PremiumBanner from "./premium-banner";
import { toast } from "sonner";

const transitionDebug = {
  type: "easeOut",
  duration: 0.2,
};

const AskAI = ({ isCollapsed }: { isCollapsed: boolean }) => {
  const [accountId] = useLocalStorage("accountId", "");
  const { input, handleInputChange, handleSubmit, messages } = useChat({
    api: "/api/chat",
    body: {
      accountId,
    },
    onError: (error) => {
      if (error.message.includes("Limit reached")) {
        toast.error(
          "You have reached the limit for today. Please upgrade to pro to ask as many questions as you want",
        );
      }
    },
    initialMessages: [],
  });

  // Scroll to the bottom when new messages are added
  React.useEffect(() => {
    const messageContainer = document.getElementById("message-container");
    if (messageContainer) {
      messageContainer.scrollTo({
        top: messageContainer.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  if (isCollapsed) return null;

  return (
    <div className="mb-14 p-4">
      <PremiumBanner />
      <div className="h-4"></div>

      <motion.div className="flex flex-1 flex-col items-end justify-end rounded-lg border bg-gray-100 p-4 pb-4 shadow-inner dark:bg-gray-900">
        {/* Message container with fixed height and scrollable */}
        <div
          className="flex max-h-[40vh] w-full flex-col gap-2 overflow-y-auto pb-4"
          id="message-container"
        >
          <AnimatePresence mode="wait">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                layout="position"
                className={cn(
                  "z-10 mt-2 max-w-full break-words rounded-2xl bg-gray-200 dark:bg-gray-800 md:max-w-[500px]",
                  {
                    "self-end text-gray-900 dark:text-gray-100":
                      message.role === "user",
                    "self-start bg-blue-500 text-white":
                      message.role === "assistant",
                  },
                )}
                layoutId={`container-[${messages.length - 1}]`}
                transition={transitionDebug}
              >
                <div className="whitespace-pre-wrap px-3 py-2 text-[15px] leading-[15px]">
                  {message.content}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {messages.length > 0 && <div className="h-4" />}

        {/* Input area for new questions */}
        <div className="w-full">
          {messages.length === 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-4">
                <SparklesIcon className="size-6 text-gray-500" />
                <div>
                  <p className="text-gray-900 dark:text-gray-100">
                    Ask AI anything about your emails
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Get answers to your questions about your emails
                  </p>
                </div>
              </div>
              <div className="h-2"></div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  onClick={() =>
                    handleInputChange({
                      target: {
                        value: "What can I ask?",
                      },
                    })
                  }
                  className="cursor-pointer rounded-md bg-gray-800 px-2 py-1 text-xs text-gray-200"
                >
                  What can I ask?
                </span>
                <span
                  onClick={() =>
                    handleInputChange({
                      target: {
                        value: "When is my next flight?",
                      },
                    })
                  }
                  className="cursor-pointer rounded-md bg-gray-800 px-2 py-1 text-xs text-gray-200"
                >
                  When is my next flight?
                </span>
                <span
                  onClick={() =>
                    handleInputChange({
                      target: {
                        value: "When is my next meeting?",
                      },
                    })
                  }
                  className="cursor-pointer rounded-md bg-gray-800 px-2 py-1 text-xs text-gray-200"
                >
                  When is my next meeting?
                </span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex w-full">
            <input
              type="text"
              onChange={handleInputChange}
              value={input}
              className="relative h-9 flex-grow rounded-full border border-gray-200 bg-white px-3 text-[15px] outline-none placeholder:text-[13px] placeholder:text-gray-400 focus-visible:ring-0 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400"
              placeholder="Ask AI anything about your emails"
            />
            <button
              type="submit"
              className="ml-2 flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-800"
            >
              <Send className="size-4 text-gray-500 dark:text-gray-300" />
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default AskAI;
