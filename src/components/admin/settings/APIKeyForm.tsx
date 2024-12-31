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

const formSchema = z.object({
  key_value: z.string().min(1, "API key is required"),
})

export function APIKeyForm() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      key_value: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true)
      
      const { error } = await supabase
        .from("app_secrets")
        .upsert({
          key_name: "YOUTUBE_API_KEY",
          key_value: values.key_value,
        }, {
          onConflict: 'key_name'
        })

      if (error) throw error

      toast({
        title: "API Key Updated",
        description: "The YouTube API key has been successfully updated.",
      })

      form.reset()
    } catch (error) {
      console.error("Error updating API key:", error)
      toast({
        title: "Error",
        description: "There was a problem updating the API key.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">YouTube API Key</h3>
        <p className="text-sm text-muted-foreground">
          Enter your YouTube API key to enable video syncing
        </p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="key_value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>API Key</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Enter YouTube API key"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save API Key"}
          </Button>
        </form>
      </Form>
    </div>
  )
}