import { AdminSidebar } from "@/components/admin/AdminSidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { WordPressFeedParser } from "@/components/admin/WordPressFeedParser"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/integrations/supabase/client"

export default function Blog() {
  const navigate = useNavigate()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) {
        navigate("/login")
        return
      }

      const { data: isAdmin, error: adminError } = await supabase
        .rpc('is_admin', { user_id: user.id })
      
      if (adminError || !isAdmin) {
        navigate("/")
      }
    }

    checkAuth()
  }, [navigate])

  return (
    <ErrorBoundary>
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AdminSidebar />
          <main className="flex-1 p-8">
            <div className="max-w-4xl mx-auto space-y-8">
              <h1 className="text-3xl font-bold">Blog Management</h1>
              <WordPressFeedParser />
            </div>
          </main>
        </div>
      </SidebarProvider>
    </ErrorBoundary>
  )
}