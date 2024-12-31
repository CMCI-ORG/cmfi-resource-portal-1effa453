import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, FileText, Headphones } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState } from "react";

interface ContentCardProps {
  type: "video" | "blog" | "podcast";
  title: string;
  description: string;
  thumbnail: string;
  date: string;
  source: string;
  contentUrl?: string;
}

const ContentCard = ({ type, title, description, thumbnail, date, source, contentUrl }: ContentCardProps) => {
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  const TypeIcon = {
    video: Play,
    blog: FileText,
    podcast: Headphones,
  }[type];

  const getYouTubeEmbedUrl = (url: string) => {
    try {
      // Handle different YouTube URL formats
      const videoId = url.includes('youtu.be') 
        ? url.split('youtu.be/')[1]
        : url.split('v=')[1]?.split('&')[0];
      
      return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
    } catch (error) {
      console.error('Error parsing YouTube URL:', error);
      return url;
    }
  };

  const handleCardClick = () => {
    if (type === 'video' && contentUrl) {
      setIsVideoOpen(true);
    }
  };

  return (
    <>
      <Card 
        className={`overflow-hidden transition-all duration-300 hover:shadow-lg animate-fadeIn ${type === 'video' ? 'cursor-pointer' : ''}`}
        onClick={handleCardClick}
      >
        <div className="relative aspect-video overflow-hidden">
          <img
            src={thumbnail}
            alt={title}
            className="object-cover w-full h-full transition-transform duration-300 hover:scale-105"
          />
          <Badge className="absolute top-2 right-2 bg-primary text-white">
            <TypeIcon className="w-4 h-4 mr-1" />
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </Badge>
          {type === 'video' && (
            <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
              <Play className="w-12 h-12 text-white" />
            </div>
          )}
        </div>
        <CardHeader className="p-4">
          <h3 className="font-semibold text-lg line-clamp-2">{title}</h3>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <p className="text-sm text-gray-600 line-clamp-2">{description}</p>
        </CardContent>
        <CardFooter className="p-4 pt-0 flex justify-between items-center text-sm text-gray-500">
          <span>{source}</span>
          <span>{date}</span>
        </CardFooter>
      </Card>

      <Dialog open={isVideoOpen} onOpenChange={setIsVideoOpen}>
        <DialogContent className="sm:max-w-[900px] p-0">
          <div className="aspect-video w-full">
            {contentUrl && (
              <iframe
                src={getYouTubeEmbedUrl(contentUrl)}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ContentCard;