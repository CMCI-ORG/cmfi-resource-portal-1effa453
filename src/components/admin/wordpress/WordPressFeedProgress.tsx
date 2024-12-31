import { Progress } from "@/components/ui/progress"

interface ProgressProps {
  progress: number
  status: string
}

export function WordPressFeedProgress({ progress, status }: ProgressProps) {
  return (
    <div className="space-y-2">
      <Progress value={progress} className="h-2" />
      <p className="text-sm text-gray-500 text-center animate-pulse">
        {status}
      </p>
    </div>
  )
}