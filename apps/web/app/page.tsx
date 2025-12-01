import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Cpu, Zap, Eye, GitBranch } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 text-sm border rounded-full bg-muted/50">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          Autonomous Development Active
        </div>

        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl max-w-4xl">
          <span className="text-primary">Chimera</span>
          <br />
          <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
            Digital Command Center
          </span>
        </h1>

        <p className="mt-6 text-lg text-muted-foreground max-w-2xl">
          Human-in-the-loop autonomous development. Describe what you want,
          watch AI agents compete to build it, approve the best output.
        </p>

        <div className="flex gap-4 mt-8">
          <Button size="lg" asChild>
            <Link href="/command-center">
              <Cpu className="w-4 h-4 mr-2" />
              Open Command Center
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/dashboard">View Dashboard</Link>
          </Button>
        </div>
      </div>

      {/* Features Section */}
      <div className="px-6 py-16 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            <FeatureCard
              icon={<Zap className="w-6 h-6" />}
              title="1. Brief"
              description="Describe your component or feature in natural language"
            />
            <FeatureCard
              icon={<Cpu className="w-6 h-6" />}
              title="2. Generate"
              description="Multiple AI teams compete to build your request"
            />
            <FeatureCard
              icon={<Eye className="w-6 h-6" />}
              title="3. Preview"
              description="See live renders of each team's output side-by-side"
            />
            <FeatureCard
              icon={<GitBranch className="w-6 h-6" />}
              title="4. Deploy"
              description="Approve the best output and push to your codebase"
            />
          </div>
        </div>
      </div>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center text-center p-6 rounded-lg bg-card border">
      <div className="p-3 rounded-full bg-primary/10 text-primary mb-4">
        {icon}
      </div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
