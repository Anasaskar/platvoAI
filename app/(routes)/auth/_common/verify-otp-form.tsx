"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { RiLoader2Line, RiMailCheckLine } from "@remixicon/react";
import { motion } from "framer-motion"; // Changed from "motion/react" to "framer-motion" as it's more common and likely intended. If "motion/react" is a specific library, please clarify.
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds

const VerifyOtpForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start cooldown on mount (first OTP was already sent)
  useEffect(() => {
    startCooldown();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCooldown = () => {
    setCooldown(RESEND_COOLDOWN);
    timerRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const digit = value.slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    const next = [...otp];
    for (let i = 0; i < text.length; i++) next[i] = text[i];
    setOtp(next);
    inputRefs.current[Math.min(text.length, OTP_LENGTH - 1)]?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length < OTP_LENGTH) {
      toast.error("Please enter the full 6-digit code");
      return;
    }
    setIsVerifying(true);
    try {
      const res = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: code }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Verification failed");
        setOtp(Array(OTP_LENGTH).fill(""));
        inputRefs.current[0]?.focus();
      } else {
        toast.success("Email verified! Welcome to Platvo 🎉");
        router.replace("/home");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;
    setIsResending(true);
    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to resend code");
      } else {
        toast.success("A new code has been sent to your email");
        setOtp(Array(OTP_LENGTH).fill(""));
        inputRefs.current[0]?.focus();
        startCooldown();
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md"
      >
        <Card className="!bg-transparent border-0 shadow-none">
          <CardHeader className="text-center pb-8">
            <motion.div variants={itemVariants} className="relative mx-auto mb-6 h-16 w-16">
              {/* Pulsing background ring */}
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping opacity-75 duration-1000" />
              {/* Solid circle */}
              <div className="relative flex h-full w-full items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/30 backdrop-blur-sm">
                <RiMailCheckLine className="h-8 w-8 text-primary" />
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <CardTitle className="text-2xl font-semibold tracking-tight">
                Verify your email
              </CardTitle>
            </motion.div>

            <motion.div variants={itemVariants}>
              <CardDescription className="mt-3 text-[15px] leading-relaxed">
                We sent a 6-digit code to
                <br />
                <span className="font-semibold text-foreground">{email}</span>
              </CardDescription>
            </motion.div>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* OTP Inputs */}
            <motion.div
              variants={itemVariants}
              className="flex justify-between gap-2 sm:gap-3"
              onPaste={handlePaste}
            >
              {otp.map((digit, i) => (
                <motion.div
                  key={i}
                  animate={
                    focusedIndex === i
                      ? { scale: 1.05, y: -2 }
                      : { scale: 1, y: 0 }
                  }
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="relative"
                >
                  <Input
                    ref={(el) => {
                      inputRefs.current[i] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    onFocus={() => setFocusedIndex(i)}
                    onBlur={() => setFocusedIndex(null)}
                    className="h-14 w-12 sm:h-16 sm:w-14 text-center text-xl sm:text-2xl font-bold tracking-widest bg-background border-muted shadow-sm transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:border-primary"
                  />
                  {/* Subtle active glow */}
                  {focusedIndex === i && (
                    <div className="absolute inset-0 -z-10 rounded-md bg-primary/20 blur-md transition-all duration-300" />
                  )}
                </motion.div>
              ))}
            </motion.div>

            {/* Actions */}
            <motion.div variants={itemVariants} className="space-y-4">
              <Button
                className="w-full h-12 text-[15px] font-medium text-white transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
                disabled={isVerifying || otp.join("").length < OTP_LENGTH}
                onClick={handleVerify}
              >
                {isVerifying ? (
                  <RiLoader2Line className="mr-2 h-5 w-5 animate-spin" />
                ) : null}
                {isVerifying ? "Verifying..." : "Verify Email"}
              </Button>

              <div className="text-center text-sm text-muted-foreground pt-2">
                Didn&apos;t receive a code?{" "}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={cooldown > 0 || isResending}
                  className="inline-flex items-center gap-1 font-medium text-primary transition-colors hover:text-primary/80 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isResending && <RiLoader2Line className="h-3 w-3 animate-spin" />}
                  {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                </button>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => router.replace("/auth/sign-up")}
                  className="text-xs font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                >
                  Wrong email? Go back
                </button>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default VerifyOtpForm;
