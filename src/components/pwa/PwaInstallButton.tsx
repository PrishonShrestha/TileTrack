"use client";

import { usePwa } from "./PwaProvider";
import { Button } from "@/components/ui/button";
import { Download, Share } from "lucide-react";
import { toast } from "sonner";

export function PwaInstallButton({
  variant = "outline",
  size = "sm",
  className,
}: {
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}) {
  const { isInstalled, isIOS, promptInstall } = usePwa();

  if (isInstalled) {
    return null;
  }

  const handleInstallClick = () => {
    if (isIOS) {
      toast.info("To install on iPhone/iPad: Tap the Share button in Safari and choose 'Add to Home Screen'.", {
        duration: 7000,
        icon: <Share className="h-4 w-4 text-primary" />,
      });
      return;
    }
    promptInstall();
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleInstallClick}
      className={className}
      title="Install TileCalc Pro as an App"
      aria-label="Install TileCalc Pro as an App"
    >
      <Download className="h-3.5 w-3.5 mr-1 text-primary" />
      <span>Install App</span>
    </Button>
  );
}
