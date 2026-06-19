import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { AnimatePresence } from "framer-motion";

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="lg:pl-[260px]">
        <div className="mx-auto max-w-7xl px-4 py-6 pt-20 lg:px-8 lg:py-8 lg:pt-8">
          <AnimatePresence mode="wait">
            <Outlet />
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
