import { Button } from "@/components/ui/button";
import { Play, FileText, Headphones } from "lucide-react";

interface ContentFilterProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

const ContentFilter = ({ activeFilter, onFilterChange }: ContentFilterProps) => {
  const filters = [
    { id: "all", label: "All", icon: null },
    { id: "video", label: "Videos", icon: Play },
    { id: "blog", label: "Blogs", icon: FileText },
    { id: "podcast", label: "Podcasts", icon: Headphones },
  ];

  return (
    <div className="flex gap-2 flex-wrap justify-center">
      {filters.map(({ id, label, icon: Icon }) => (
        <Button
          key={id}
          variant={activeFilter === id ? "default" : "outline"}
          className={`${
            activeFilter === id ? "bg-primary text-white" : "text-gray-600"
          } transition-all duration-200`}
          onClick={() => onFilterChange(id)}
        >
          {Icon && <Icon className="w-4 h-4 mr-2" />}
          {label}
        </Button>
      ))}
    </div>
  );
};

export default ContentFilter;