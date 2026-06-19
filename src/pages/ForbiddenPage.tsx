import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Home, ArrowLeft, ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ForbiddenPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
          className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-destructive/10"
        >
          <ShieldX className="h-12 w-12 text-destructive" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-7xl font-bold text-destructive"
        >
          403
        </motion.h1>

        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-4 text-2xl font-semibold"
        >
          Access Denied
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-2 text-text-secondary"
        >
          You don't have permission to access this page. Please contact your administrator if you believe this is a mistake.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center"
        >
          <Button onClick={() => navigate(-1)} variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
          <Button onClick={() => navigate("/")} className="gap-2">
            <Home className="h-4 w-4" />
            Home
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
