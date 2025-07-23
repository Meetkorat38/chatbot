import axios from "axios"
import { API_ENDPOINTS } from "./config"

export const loginAdmin = async (email: string, password: string) => {
  try {
    const response = await axios.post(API_ENDPOINTS.LOGIN, {
      email,
      password,
    })

    return response.data // Return the full response object { token, admin }
  } catch (error: any) {
    console.error("Login API Error:", error.response?.data || error.message)
    throw new Error(error.response?.data?.error || "Login failed")
  }
}
