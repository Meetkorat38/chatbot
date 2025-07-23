import { createSlice, PayloadAction } from "@reduxjs/toolkit"

interface Message {
  id?: string
  content: string
  sender: "user" | "ai" | "admin"
  isAi?: boolean
  createdAt?: string
}

interface ChatState {
  messages: Message[]
  typing: boolean
  isOpen: boolean
}

const initialState: ChatState = {
  messages: [],
  typing: false,
  isOpen: false,
}

export const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<Message>) => {
      state.messages.push(action.payload)
    },
    setTyping: (state, action: PayloadAction<boolean>) => {
      state.typing = action.payload
    },
    toggleChat: (state) => {
      state.isOpen = !state.isOpen
    },
  },
})

export const { addMessage, setTyping, toggleChat } = chatSlice.actions
export default chatSlice.reducer
