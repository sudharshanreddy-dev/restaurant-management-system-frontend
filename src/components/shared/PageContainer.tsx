import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
  title?: string;
  description?: string;
  action?: ReactNode;
}

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

export function PageContainer({ children, title, description, action }: PageContainerProps) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="space-y-6"
    >
      {(title || action) && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {title && <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">{title}</h1>}
            {description && <p className="mt-1 text-text-secondary">{description}</p>}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </motion.div>
  );
}
