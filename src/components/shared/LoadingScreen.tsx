import { motion } from "framer-motion";
import { UtensilsCrossed } from "lucide-react";

export function LoadingScreen() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <UtensilsCrossed className="h-12 w-12 text-primary" />
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-lg font-medium text-text-secondary"
        >
          Loading RestroHub...
        </motion.p>
      </motion.div>
    </div>
  );
}
