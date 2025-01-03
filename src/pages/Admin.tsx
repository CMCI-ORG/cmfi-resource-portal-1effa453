import { AdminSidebar } from "@/components/admin/AdminSidebar"
import { PodcastFeedParser } from "@/components/admin/PodcastFeedParser"
import { SidebarProvider } from "@/components/ui/sidebar"

export default function Admin() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AdminSidebar />
        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <PodcastFeedParser />
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}