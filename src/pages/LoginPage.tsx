import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UtensilsCrossed, Mail, Lock, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [shake, setShake] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      const user = await login(data.email, data.password);
      toast.success(`Welcome back, ${user.name}!`);
      switch (user.role) {
        case "admin":
          navigate("/admin");
          break;
        case "cashier":
          navigate("/cashier/orders");
          break;
        case "kitchen":
          navigate("/kitchen");
          break;
        default:
          navigate("/login");
      }
    } catch {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      toast.error("Invalid credentials. Please try again.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4"
      style={{
        background: "linear-gradient(135deg, #E63946 0%, #2A9D8F 50%, #F4A261 100%)",
      }}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-white/10 blur-3xl"
          animate={{ scale: [1, 1.2, 1], x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-white/10 blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], x: [0, -20, 0], y: [0, 30, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={shake ? { x: [-10, 10, -10, 10, 0], opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
        transition={shake ? { duration: 0.4 } : { duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="border-0 shadow-2xl backdrop-blur-sm bg-white/95">
          <CardHeader className="items-center pb-2 pt-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
              className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/30"
            >
              <UtensilsCrossed className="h-8 w-8 text-white" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-4 text-center"
            >
              <h1 className="text-2xl font-bold">RestroHub</h1>
              <p className="mt-1 text-sm text-text-secondary">Sign in to your restaurant dashboard</p>
            </motion.div>
          </CardHeader>
          <CardContent className="px-8 pb-8 pt-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-2"
              >
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@restrohub.com"
                    className="pl-10"
                    {...register("email")}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-2"
              >
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    {...register("password")}
                  />
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </motion.div>
            </form>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-6 space-y-2"
            >
              <p className="text-xs text-text-secondary text-center font-medium">Demo Credentials (use password: "password")</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { email: "admin@restrohub.com", role: "Admin", color: "bg-primary/10 text-primary border-primary/30" },
                  { email: "cashier@restrohub.com", role: "Cashier", color: "bg-secondary/10 text-secondary border-secondary/30" },
                  { email: "kitchen@restrohub.com", role: "Kitchen", color: "bg-accent/10 text-accent border-accent/30" },
                ].map((demo) => (
                  <button
                    key={demo.email}
                    type="button"
                    onClick={() => {
                      setValue("email", demo.email);
                      setValue("password", "password");
                    }}
                    className={`rounded-lg border p-2 text-xs font-medium transition-all hover:scale-105 ${demo.color}`}
                  >
                    {demo.role}
                  </button>
                ))}
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
