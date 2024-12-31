import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/components/ui/use-toast"

export default function Login() {
  const navigate = useNavigate()
  const { toast } = useToast()

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error("Error checking session:", error)
        toast({
          title: "Error checking session",
          description: "Please try again later",
          variant: "destructive",
        })
        return
      }

      if (session) {
        // If we have a session, try to go back or default to admin
        try {
          navigate(-1)
        } catch {
          navigate("/admin")
        }
      } else {
        // For Lovable console users, sign in with admin credentials
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: "admin@lovable.dev",
          password: "lovable",
        })

        if (signInError) {
          console.error("Error signing in:", signInError)
          toast({
            title: "Error signing in",
            description: signInError.message,
            variant: "destructive",
          })
          return
        }

        // Try to go back or default to admin after successful sign in
        try {
          navigate(-1)
        } catch {
          navigate("/admin")
        }
      }
    }

    checkSession()
  }, [navigate, toast])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Signing you in...</h1>
        <p className="text-gray-600">Please wait while we authenticate you.</p>
      </div>
    </div>
  )
}