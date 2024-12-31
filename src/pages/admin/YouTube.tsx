import { AdminSidebar } from "@/components/admin/AdminSidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { YouTubeChannelForm } from "@/components/admin/youtube/YouTubeChannelForm"
import { YouTubeChannelList } from "@/components/admin/youtube/YouTubeChannelList"

export default function YouTube() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AdminSidebar />
        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold">YouTube Management</h1>
            <div className="grid gap-8">
              <YouTubeChannelForm />
              <YouTubeChannelList />
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}