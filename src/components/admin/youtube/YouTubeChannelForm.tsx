import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"

const formSchema = z.object({
  name: z.string().min(1, "Channel name is required"),
  channelId: z.string().min(1, "Channel ID is required"),
})

export function YouTubeChannelForm() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const navigate = useNavigate()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      channelId: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true)
      
      // Check if the channel already exists using maybeSingle() instead of single()
      const { data: existingChannel, error: checkError } = await supabase
        .from("content_sources")
        .select("id")
        .eq("type", "youtube")
        .eq("source_id", values.channelId)
        .maybeSingle()

      if (checkError) {
        console.error("Error checking existing channel:", checkError)
        throw checkError
      }

      if (existingChannel) {
        toast({
          title: "Channel already exists",
          description: "This YouTube channel has already been added to your sources.",
          variant: "destructive",
        })
        return
      }

      const { error } = await supabase.from("content_sources").insert({
        type: "youtube",
        name: values.name,
        source_id: values.channelId,
        source_url: `https://www.youtube.com/channel/${values.channelId}`,
      })

      if (error) {
        console.error("Error details:", error)
        if (error.code === "42501") {
          navigate("/login")
          return
        }
        if (error.code === "23505") {
          toast({
            title: "Channel already exists",
            description: "This YouTube channel has already been added to your sources.",
            variant: "destructive",
          })
          return
        }
        throw error
      }

      toast({
        title: "Channel added successfully",
        description: "The YouTube channel has been added to your sources.",
      })

      form.reset()
    } catch (error) {
      console.error("Error adding channel:", error)
      toast({
        title: "Error adding channel",
        description: "There was a problem adding the YouTube channel.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="rounded-lg border p-4">
      <h2 className="text-lg font-semibold mb-4">Add YouTube Channel</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Channel Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter channel name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="channelId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Channel ID</FormLabel>
                <FormControl>
                  <Input placeholder="Enter channel ID" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Adding..." : "Add Channel"}
          </Button>
        </form>
      </Form>
    </div>
  )
}