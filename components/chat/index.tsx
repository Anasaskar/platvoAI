"use client";
import React, { useEffect, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, UIMessage } from "ai";
import { generateUUID } from "@/lib/utils";
import { DEFAULT_MODEL_ID, chatModels } from "@/lib/ai/models";
import ChatInput from "./chat-input";
import ChatMessages from "./chat-messages";
import { ToolNameEnum } from "@/lib/ai/tools/constant";
import { useQueryClient } from "@tanstack/react-query";
import { useSubscriptionStatus } from "@/features/use-subscription";
import { getDefaultModelForPlan } from "@/lib/subscription/plan-access";

type Props = {
  chatId: string;
  initialMessages: UIMessage[];
  initialLoading: boolean;
  onlyInput: boolean;
  inputDisabled?: boolean;
};

const ChatInterface = (props: Props) => {
  const {
    chatId,
    initialMessages,
    initialLoading,
    onlyInput = false,
    inputDisabled,
  } = props;
  const queryClient = useQueryClient();
  const [input, setInput] = useState<string>("");
  const {
    data: subscriptionStatus,
    isLoading: isSubscriptionStatusLoading,
  } = useSubscriptionStatus();
  const subscriptionPlan = subscriptionStatus?.plan;
  const initialModelId =
    getDefaultModelForPlan(subscriptionPlan, chatModels, DEFAULT_MODEL_ID)?.id ||
    DEFAULT_MODEL_ID;

  console.log(chatId, "chatid");

  const { messages, setMessages, sendMessage, status, stop, error } =
    useChat<UIMessage>({
      id: chatId,
      messages: initialMessages,
      generateId: generateUUID,
      transport: new DefaultChatTransport({
        api: "/api/chat",
        prepareSendMessagesRequest({ messages, id, body }) {
          return {
            body: {
              id,
              message: messages.at(-1),
              selectedModelId: initialModelId,
              ...body,
            },
          };
        },
      }),
      async onToolCall({ toolCall }) {
        console.log(toolCall.toolCallId, "toolId");
        if (toolCall.toolName === ToolNameEnum.CreateNote) {
          queryClient.invalidateQueries({
            queryKey: ["notes"],
            refetchType: "all",
          });
        }
      },
      onFinish: () => {},
      onError: (error) => {
        console.log("Chat error", error);
      },
    });

  useEffect(() => {
    if (initialMessages && initialMessages?.length > 0) {
      setMessages(initialMessages);
    }
  }, [initialMessages, setMessages]);

  // Generation limit check removed - unlimited for now
  const hasReachedLimit = false;

  if (onlyInput) {
    return (
      <div className="w-full relative">
        <ChatInput
          chatId={chatId}
          input={input}
          setInput={setInput}
          className="w-full"
          disabled={inputDisabled}
          messages={messages}
          status={status}
          hasReachedLimit={hasReachedLimit}
          stop={stop}
          initialModelId={initialModelId}
          subscriptionPlan={subscriptionPlan}
          isSubscriptionStatusLoading={isSubscriptionStatusLoading}
          sendMessage={sendMessage}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen min-w-0 overflow-x-hidden bg-background">
      {/* {Chat Messages} */}
      <ChatMessages
        chatId={chatId}
        messages={messages}
        status={status}
        error={error}
        isLoading={initialLoading}
      />

      <div className="sticky bottom-0 left-0 right-0 flex gap-2 px-2 sm:px-4 pb-2 sm:pb-4 pt-2 w-full bg-background z-[1] border-t border-border/40">
        <div className="w-full relative mx-auto sm:max-w-2xl md:max-w-3xl">
          <ChatInput
            chatId={chatId}
            input={input}
            setInput={setInput}
            className="w-full"
            messages={messages}
            status={status}
            hasReachedLimit={hasReachedLimit}
            stop={stop}
            initialModelId={initialModelId}
            subscriptionPlan={subscriptionPlan}
            isSubscriptionStatusLoading={isSubscriptionStatusLoading}
            sendMessage={sendMessage}
            disabled={inputDisabled}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
