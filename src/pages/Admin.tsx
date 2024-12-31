import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tables } from "@/integrations/supabase/types"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

type Setting = Tables<"settings">

export default function Admin() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [editedSettings, setEditedSettings] = useState<Record<string, string>>({})

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .order('key')
      
      if (error) throw error
      return data as Setting[]
    }
  })

  const updateSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string, value: string }) => {
      const { error } = await supabase
        .from('settings')
        .update({ value, updated_at: new Date().toISOString() })
        .eq('key', key)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      toast({
        title: "Settings updated",
        description: "Your changes have been saved successfully."
      })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update settings: " + error.message,
        variant: "destructive"
      })
    }
  })

  const handleInputChange = (key: string, value: string) => {
    setEditedSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async (key: string) => {
    const newValue = editedSettings[key]
    if (newValue !== undefined) {
      updateSetting.mutate({ key, value: newValue })
      setEditedSettings(prev => {
        const { [key]: _, ...rest } = prev
        return rest
      })
    }
  }

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Admin Settings</h1>
      <div className="grid gap-6">
        {settings?.map((setting) => (
          <Card key={setting.id}>
            <CardHeader>
              <CardTitle className="text-xl">{setting.key.replace(/_/g, ' ').toUpperCase()}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {setting.description && (
                  <p className="text-sm text-muted-foreground">{setting.description}</p>
                )}
                <div className="flex gap-4">
                  <Input
                    defaultValue={setting.value}
                    onChange={(e) => handleInputChange(setting.key, e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={() => handleSave(setting.key)}
                    disabled={!editedSettings[setting.key]}
                  >
                    Save
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}