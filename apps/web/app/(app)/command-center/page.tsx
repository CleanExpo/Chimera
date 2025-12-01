import { CommandCenter } from "@/components/dashboard";

export const metadata = {
  title: "Command Center | Chimera",
  description: "Digital Command Center for autonomous AI development",
};

export default function CommandCenterPage() {
  return (
    <div className="h-screen bg-background">
      <CommandCenter />
    </div>
  );
}
