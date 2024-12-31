import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

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
        try {
          navigate(-1)
        } catch {
          navigate("/admin")
        }
      } else {
        // For Lovable console users, sign in with console user credentials
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: "gordonfru@gmail.com",
          password: "gordonfru@gmail.com",
        })

        if (signInError) {
          console.error("Sign in error:", signInError)
          
          // Show specific error message for email confirmation
          if (signInError.message.includes("Email not confirmed")) {
            toast({
              title: "Email not confirmed",
              description: "Please check your email for a confirmation link or disable email confirmation in Supabase settings for development.",
              variant: "destructive",
            })
            return
          }

          // Add delay before signup attempt to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 1000))

          // If sign in fails, try creating the console user first
          const { error: signUpError } = await supabase.auth.signUp({
            email: "gordonfru@gmail.com",
            password: "gordonfru@gmail.com",
            options: {
              data: {
                role: 'admin' // Set admin role in metadata
              }
            }
          })

          if (signUpError) {
            console.error("Error signing up:", signUpError)
            
            // Handle rate limiting error
            if (signUpError.message.includes("rate limit")) {
              toast({
                title: "Too many attempts",
                description: "Please wait a minute before trying again",
                variant: "destructive",
              })
              return
            }

            toast({
              title: "Error signing up",
              description: signUpError.message,
              variant: "destructive",
            })
            return
          }

          // Add delay before retry to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 1000))

          // Try signing in again after creating the user
          const { error: retryError } = await supabase.auth.signInWithPassword({
            email: "gordonfru@gmail.com",
            password: "gordonfru@gmail.com",
          })

          if (retryError) {
            console.error("Error signing in:", retryError)
            toast({
              title: "Error signing in",
              description: retryError.message,
              variant: "destructive",
            })
            return
          }
        }

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