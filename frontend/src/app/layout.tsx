import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { OfflineBanner } from "@/components/OfflineBanner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "EDUCORE AI — Intelligent Student Success & Academic Management System",
  description:
    "Integrated technical foundation covering PS1 Adaptive Learning, PS2 Formative Subjective Grading with SentenceTransformer, and PS3 Early Dropout Prediction Copilot with SHAP TreeExplainer.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} min-h-full bg-slate-50 text-slate-900 antialiased flex flex-col`}>
        <Navbar />
        <div className="flex-1 flex overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
            {children}
          </main>
        </div>
        <OfflineBanner />
      </body>
    </html>
  );
}
