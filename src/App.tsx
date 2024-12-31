import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import Index from "./pages/Index"
import Admin from "./pages/Admin"
import Settings from "./pages/admin/Settings"
import YouTube from "./pages/admin/YouTube"
import Podcasts from "./pages/admin/Podcasts"
import Blog from "./pages/admin/Blog"
import Login from "./pages/Login"
import { Toaster } from "./components/ui/toaster"
import "./App.css"

// Create a client
const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/settings" element={<Settings />} />
          <Route path="/admin/youtube" element={<YouTube />} />
          <Route path="/admin/podcasts" element={<Podcasts />} />
          <Route path="/admin/blog" element={<Blog />} />
          <Route path="/login" element={<Login />} />
        </Routes>
        <Toaster />
      </Router>
    </QueryClientProvider>
  )
}

export default App