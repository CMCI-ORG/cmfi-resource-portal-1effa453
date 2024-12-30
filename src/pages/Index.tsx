import { useState } from "react";
import ContentCard from "@/components/ContentCard";
import SearchBar from "@/components/SearchBar";
import ContentFilter from "@/components/ContentFilter";

// Mock data for initial development
const mockContent = [
  {
    id: 1,
    type: "video",
    title: "Introduction to Our Ministry",
    description: "Learn about our vision and mission in this comprehensive overview.",
    thumbnail: "https://picsum.photos/seed/1/800/400",
    date: "2024-03-20",
    source: "Main Channel",
  },
  {
    id: 2,
    type: "blog",
    title: "Weekly Devotional: Finding Peace in Chaos",
    description: "A reflection on finding inner peace during challenging times.",
    thumbnail: "https://picsum.photos/seed/2/800/400",
    date: "2024-03-19",
    source: "Ministry Blog",
  },
  {
    id: 3,
    type: "podcast",
    title: "Walking in Faith - Episode 12",
    description: "Join us for an inspiring discussion about walking in faith.",
    thumbnail: "https://picsum.photos/seed/3/800/400",
    date: "2024-03-18",
    source: "Faith Talks",
  },
  // Add more mock content items here
];

const Index = () => {
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredContent = mockContent.filter((item) => {
    const matchesFilter = activeFilter === "all" || item.type === activeFilter;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Content Hub</h1>
          <p className="text-lg text-gray-600 mb-8">
            Discover our latest videos, blogs, and podcasts all in one place
          </p>
          <SearchBar onSearch={setSearchQuery} />
        </header>

        <section className="mb-8">
          <ContentFilter activeFilter={activeFilter} onFilterChange={setActiveFilter} />
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContent.map((content) => (
            <ContentCard key={content.id} {...content} />
          ))}
        </section>
      </div>
    </div>
  );
};

export default Index;