"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { ThemeToggle } from "./ThemeToggle";
import { useToast } from "@/components/ui/ToastProvider";

const navItems = [
  { href: "/", label: "Feed" },
  { href: "/trending", label: "Trending" },
  { href: "/airing", label: "Airing Now" },
  { href: "/anime", label: "Library" },
  { href: "/dashboard", label: "My Circle" },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, supabase } = useAuth();
  const { showToast } = useToast();

  const hideOnAuth = pathname?.startsWith("/login") || pathname?.startsWith("/register");
  if (hideOnAuth) return null;

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      showToast("Logout failed", "error");
      return;
    }
    showToast("Logged out", "success");
    router.push("/login");
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/60 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="group flex items-center gap-2 cursor-pointer">
            <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-brand to-brand-2 shadow-lg shadow-brand/20 transition group-hover:scale-110" />
            <span className="text-sm font-black uppercase tracking-widest text-foreground">
              Anime Circle
            </span>
          </Link>
          <div className="hidden items-center gap-1 sm:flex">
            {navItems.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-4 py-1.5 text-xs font-bold tracking-wide transition cursor-pointer ${
                    active
                      ? "bg-brand/10 text-brand ring-1 ring-brand/20"
                      : "text-muted hover:bg-surface-2 hover:text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <button
              onClick={handleLogout}
              className="rounded-full bg-surface-2 px-4 py-1.5 text-xs font-bold text-foreground transition hover:bg-surface cursor-pointer"
            >
              LOGOUT
            </button>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-brand px-5 py-1.5 text-xs font-bold text-white shadow-lg shadow-brand/20 transition hover:brightness-110 active:scale-95 cursor-pointer"
            >
              JOIN CIRCLE
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
