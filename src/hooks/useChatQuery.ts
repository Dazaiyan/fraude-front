import { useCallback, useState } from "react"
import { claimsService, ChatMessage } from "@/services/claims"
import { chatSessionId } from "@/services/mappers"
import api from "@/services/api"
import type { ChatMessageRead } from "@/types/backend"
import { formatChatTime } from "@/lib/formatChatTime"

function toChatMessage(msg: ChatMessageRead): ChatMessage {
  return {
    sender: msg.role === "user" ? "user" : "ai",
    text: msg.content,
    timestamp: formatChatTime(new Date(msg.created_at)),
  }
}

export function useChatQuery(claimId: string, scope: "case" | "global") {
  const sessionId = chatSessionId(claimId, scope)
  const [isTyping, setIsTyping] = useState(false)

  const loadHistory = useCallback(async (): Promise<ChatMessage[]> => {
    try {
      const response = await api.get<ChatMessageRead[]>(
        `/api/v1/chat/session/${encodeURIComponent(sessionId)}/messages`
      )
      if (response.data.length === 0) return []
      return response.data.map(toChatMessage)
    } catch {
      return []
    }
  }, [sessionId])

  const sendMessage = useCallback(
    async (text: string): Promise<string> => {
      setIsTyping(true)
      try {
        return await claimsService.sendMessageToAgent(claimId, text, scope)
      } finally {
        setIsTyping(false)
      }
    },
    [claimId, scope]
  )

  const clearSession = useCallback(async () => {
    try {
      await api.delete(`/api/v1/chat/session/${encodeURIComponent(sessionId)}`)
    } catch {
      // fallback silencioso
    }
  }, [sessionId])

  return {
    sessionId,
    isTyping,
    sendMessage,
    loadHistory,
    clearSession,
  }
}
