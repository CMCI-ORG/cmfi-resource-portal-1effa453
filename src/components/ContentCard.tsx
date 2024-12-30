import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, FileText, Headphones } from "lucide-react";

interface ContentCardProps {
  type: "video" | "blog" | "podcast";
  title: string;
  description: string;
  thumbnail: string;
  date: string;
  source: string;
}

const ContentCard = ({ type, title, description, thumbnail, date, source }: ContentCardProps) => {
  const TypeIcon = {
    video: Play,
    blog: FileText,
    podcast: Headphones,
  }[type];

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg animate-fadeIn">
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
  );
};

export default ContentCard;