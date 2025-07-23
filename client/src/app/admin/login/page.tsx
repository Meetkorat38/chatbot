"use client"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { loginAdmin } from "@/lib/api"
import { useDispatch } from "react-redux"
import { loginSuccess } from "@/store/authSlice"
import { useRouter } from "next/navigation"

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(4),
})

type LoginForm = z.infer<typeof schema>

export default function AdminLogin() {
  const dispatch = useDispatch()
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: LoginForm) => {
    try {
      console.log("🔍 Attempting login with:", { email: data.email })
      const response = await loginAdmin(data.email, data.password)
      console.log("✅ Login successful, response:", response)
      
      dispatch(loginSuccess(response))
      router.push("/admin/dashboard")
    } catch (err) {
      console.error("❌ Login error:", err)
      alert("Login failed: " + (err instanceof Error ? err.message : "Unknown error"))
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-20 p-6 shadow rounded border">
      <h1 className="text-xl font-semibold mb-4">Admin Login</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label>Email</Label>
          <Input {...register("email")} placeholder="admin@example.com" />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div>
          <Label>Password</Label>
          <Input
            type="password"
            {...register("password")}
            placeholder="********"
          />
          {errors.password && (
            <p className="text-sm text-red-500">{errors.password.message}</p>
          )}
        </div>

        <Button disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Logging in..." : "Login"}
        </Button>
      </form>
    </div>
  )
}
