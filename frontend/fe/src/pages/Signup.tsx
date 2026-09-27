import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { apiClient } from "../api/client";
import {
  SignupSuccessResponse,
  ApiErrorResponse,
  ValidationErrorResponse,
} from "../types/api";
import { useAuth } from "../contexts/AuthContext";
import { AxiosError } from "axios";
import {
  ArrowLeft,
  Mail,
  Key,
  Eye,
  EyeOff,
  ShieldCheck,
  Lock,
} from "lucide-react";

export const Signup: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const navigate = useNavigate();
  const { login } = useAuth();

  const signupMutation = useMutation<
    SignupSuccessResponse,
    AxiosError<ApiErrorResponse | ValidationErrorResponse>,
    void
  >({
    mutationFn: async () => {
      const response = await apiClient.post<SignupSuccessResponse>(
        "/auth/signup",
        {
          username,
          password,
        },
      );
      return response.data;
    },
    onSuccess: (data) => {
      login(data.user, data.accessToken);
      navigate("/dashboard");
    },
    onError: (error) => {
      if (error.response?.data) {
        const data = error.response.data;
        if ("errors" in data) {
          const messages = Object.values(data.errors.fieldErrors).flat();
          setErrorMsg(messages.join(", ") || data.message);
        } else {
          setErrorMsg(data.message);
        }
      } else {
        setErrorMsg("Network error occurred. Please try again.");
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match");
      return;
    }

    signupMutation.mutate();
  };

  return (
    <div className="bg-[#F9F9F9] font-sans text-[#141414] min-h-screen relative flex flex-col justify-between selection:bg-[#fe5f00] selection:text-white overflow-x-hidden">
      {/* Luminous Curved Horizon Glowing Arc */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1500px] pointer-events-none opacity-85 select-none z-0">
        <img
          alt="Luminous horizon glow arc"
          className="w-full h-auto object-contain object-top"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBCGqk3WWsUJdENWKvITfzphE8ckTQvTnLkQzChIg2qGtUmNPsSTDrRd0lg8k-8j2E8KYQkM98gdcQlhh2x1zLuXSBvhALjTQqz57YQ8E5V2LrkNaW-7cfxcxPcEOwrP4q8h0MEQteQ9ShTJrixYqUCw-i3H4FgW8h7Qlb8X84E9Y0aP9n28czdAnAxk1-i_0Y9MmqVJ-btafr5FNKcLpFMoHk9TD0XbI83oG1JTFlTwyu3n9favC7kvg"
        />
      </div>

      {/* Ambient Warm Subtle Glow Radiance */}
      <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-[600px] h-[280px] bg-gradient-to-b from-[#FFA000]/15 via-[#FF5F00]/10 to-transparent blur-3xl rounded-full pointer-events-none z-0"></div>

      {/* Navigation Bar Minimalist Header */}
      <header className="w-full relative z-20">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-10 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group"></Link>
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="bg-[#141414] text-white font-semibold text-xs sm:text-sm px-4 sm:px-5 py-2 sm:py-2.5 rounded-full shadow-sm hover:bg-neutral-800 transition-all flex items-center gap-1.5 tracking-tight group"
            >
              <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5 order-first" />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:py-12 relative z-10 w-full">
        <div className="w-full max-w-[440px] flex flex-col items-center">
          {/* Branding / Kicker */}
          <div className="flex flex-col items-center text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#141414]">
              Create your brain.
            </h1>
            <p className="text-sm text-brand-gray-500 mt-2"></p>
          </div>

          {/* Central Card Container */}
          <div className="w-full bg-white rounded-[32px] p-7 sm:p-9 border border-black/[0.06] shadow-[0_12px_36px_-6px_rgba(20,20,20,0.06)] relative overflow-hidden transition-all duration-300">
            {/* Segmented Pill Tab Switcher */}
            <div className="w-full p-1 bg-[#F3F3F3] rounded-full flex items-center mb-6">
              <Link
                to="/login"
                className="flex-1 py-2 px-4 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 text-[#737373] hover:text-[#141414] flex items-center justify-center gap-1.5"
              >
                Log In
              </Link>
              <div className="flex-1 py-2 px-4 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 bg-white text-[#141414] shadow-sm flex items-center justify-center gap-1.5 cursor-default">
                Create Account
              </div>
            </div>

            {errorMsg && (
              <div className="mb-6 p-4 rounded-xl bg-accent-red/10 text-accent-red text-sm font-semibold border border-accent-red/20">
                {errorMsg}
              </div>
            )}

            {/* Auth Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    className="text-xs font-semibold text-[#141414] flex items-center gap-1 tracking-tight"
                    htmlFor="username"
                  >
                    Username
                    <span className="text-[#FF5F00]">*</span>
                  </label>
                </div>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3.5 text-[#a3a3a3] w-[18px] h-[18px] pointer-events-none" />
                  <input
                    autoComplete="username"
                    className="w-full pl-10 pr-4 py-3 bg-[#F3F3F3] border-0 rounded-2xl text-sm font-medium text-[#141414] placeholder:text-[#a3a3a3] placeholder:font-normal focus:bg-white focus:ring-2 focus:ring-[#141414] focus:outline-none transition-all shadow-none"
                    id="username"
                    name="username"
                    placeholder="Enter your username"
                    required
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    className="text-xs font-semibold text-[#141414] flex items-center gap-1 tracking-tight"
                    htmlFor="password"
                  >
                    Password
                    <span className="text-[#FF5F00]">*</span>
                  </label>
                </div>
                <div className="relative flex items-center">
                  <Key className="absolute left-3.5 text-[#a3a3a3] w-[18px] h-[18px] pointer-events-none" />
                  <input
                    autoComplete="new-password"
                    className="w-full pl-10 pr-11 py-3 bg-[#F3F3F3] border-0 rounded-2xl text-sm font-medium text-[#141414] placeholder:text-[#a3a3a3] placeholder:font-normal focus:bg-white focus:ring-2 focus:ring-[#141414] focus:outline-none transition-all shadow-none"
                    id="password"
                    name="password"
                    placeholder="••••••••••••"
                    required
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    aria-label="Toggle password view"
                    className="absolute right-3 text-[#a3a3a3] hover:text-[#141414] transition-colors p-1"
                    onClick={() => setShowPassword(!showPassword)}
                    type="button"
                  >
                    {showPassword ? (
                      <EyeOff className="w-[18px] h-[18px]" />
                    ) : (
                      <Eye className="w-[18px] h-[18px]" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-1.5">
                <label
                  className="text-xs font-semibold text-[#141414] flex items-center gap-1 tracking-tight"
                  htmlFor="confirm_password"
                >
                  Confirm Password
                  <span className="text-[#FF5F00]">*</span>
                </label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 text-[#a3a3a3] w-[18px] h-[18px] pointer-events-none" />
                  <input
                    autoComplete="new-password"
                    className="w-full pl-10 pr-4 py-3 bg-[#F3F3F3] border-0 rounded-2xl text-sm font-medium text-[#141414] placeholder:text-[#a3a3a3] placeholder:font-normal focus:bg-white focus:ring-2 focus:ring-[#141414] focus:outline-none transition-all shadow-none"
                    id="confirm_password"
                    name="confirm_password"
                    placeholder="Repeat your password"
                    required
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              {/* Key Generation Architecture Notice */}
              {/* <div className="p-3 bg-[#fff4ed] border border-[#FF5F00]/20 rounded-2xl mt-4">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="w-[18px] h-[18px] text-[#FF5F00] mt-0.5 shrink-0" />
                  <p className="text-xs text-[#7f2b00] leading-relaxed">
                    
                  </p>
                </div>
              </div> */}

              {/* Primary Action Button */}
              <div className="pt-2 mt-4">
                <button
                  className="w-full py-3.5 px-6 rounded-full bg-[#141414] text-white font-semibold text-sm hover:bg-neutral-800 active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(20,20,20,0.12)] group disabled:opacity-70 disabled:cursor-not-allowed"
                  type="submit"
                  disabled={signupMutation.isPending}
                >
                  <span>
                    {signupMutation.isPending
                      ? "Provisioning Memory..."
                      : "Create Account"}
                  </span>
                  {!signupMutation.isPending && (
                    <svg
                      className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="M5 12h14"></path>
                      <path d="M12 5l7 7-7 7"></path>
                    </svg>
                  )}
                </button>
              </div>
            </form>

            {/* Bottom Mode Switch Prompt */}
            <div className="mt-6 pt-4 border-t border-black/[0.05] flex items-center justify-center">
              <Link
                to="/login"
                className="text-xs text-[#737373] hover:text-[#141414] transition-colors inline-flex items-center gap-1.5"
              >
                <span>Already have an account?</span>
                <span className="font-semibold text-[#FF5F00] hover:text-[#E55500] hover:underline">
                  Sign in
                </span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Minimal Subtle Footer */}
      <footer className="w-full relative z-10 py-6 border-t border-black/[0.04] bg-white/50 backdrop-blur-sm"></footer>
    </div>
  );
};
