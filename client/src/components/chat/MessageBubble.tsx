import React from "react"
import clsx from "clsx"

export const MessageBubble = ({
  sender,
  content,
  isAi,
}: {
  sender: string
  content: string
  isAi?: boolean
}) => {
  const isUser = sender === "user"
  const isAdmin = sender === "admin"
  const isSystem = sender === "system"
  
  return (
    <div
      className={clsx("my-1 p-2 rounded-xl max-w-xs", {
        "ml-auto bg-blue-500 text-white": isUser,
        "mr-auto bg-yellow-100 border border-yellow-300": isSystem,
        "mr-auto bg-gray-200": !isUser && !isSystem,
      })}
    >
      <div>{content}</div>
      <div className="flex justify-between items-center mt-1">
        {isAi && <span className="text-xs text-gray-500">🤖 AI</span>}
        {isAdmin && <span className="text-xs text-gray-500">👨‍💼 Admin</span>}
        {isSystem && <span className="text-xs text-yellow-600">⚠️ System</span>}
        {isUser && <span className="text-xs text-gray-300">You</span>}
      </div>
    </div>
  )
}
