import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-gray-100 dark:bg-gray-800 px-4 py-2">
        <h1 className="text-xl font-bold">OpenPaperGrid</h1>
      </header>
      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center space-x-2 mb-4">
            <Input
              type="search"
              placeholder="Search for papers (e.g., 'crispr cas9')"
              className="flex-1"
            />
            <Button>Search</Button>
          </div>
          <div className="border rounded-lg p-4 min-h-[60vh]">
            <p className="text-gray-500 dark:text-gray-400">
              Search results will appear here.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}