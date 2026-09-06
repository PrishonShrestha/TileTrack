import Image from "next/image";
import { cn } from "@/lib/utils";

interface AppLogoProps {
  size?: number;
  className?: string;
  priority?: boolean;
}

export function AppLogo({ size = 32, className, priority = false }: AppLogoProps) {
  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-0.5 shadow-2xs border border-border/50 transition-transform hover:scale-105",
        className
      )}
      style={{ width: size, height: size }}
    >
      <Image
        src="/logo.png"
        alt="TileTrack Logo"
        width={size}
        height={size}
        priority={priority}
        className="h-full w-full object-contain rounded-lg"
      />
    </div>
  );
}
