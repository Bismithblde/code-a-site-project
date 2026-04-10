"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import {
  Droplets,
  FlaskConical,
  Scale,
  Activity,
  BookOpen,
} from "lucide-react";

const quickLinks = [
  {
    label: "All Brands",
    href: "/brands",
    icon: Droplets,
  },
  {
    label: "Mineral Guide",
    href: "/minerals",
    icon: FlaskConical,
  },
  {
    label: "Compare Brands",
    href: "/compare",
    icon: Scale,
  },
  {
    label: "Hydration Tracker",
    href: "/tracker",
    icon: Activity,
  },
  {
    label: "Blog",
    href: "/blog",
    icon: BookOpen,
  },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <Command>
        <CommandInput placeholder="Search brands, minerals, articles..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Pages">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <CommandItem
                  key={link.href}
                  onSelect={() => {
                    router.push(link.href);
                    setOpen(false);
                  }}
                >
                  <Icon className="size-4 mr-2" />
                  {link.label}
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
