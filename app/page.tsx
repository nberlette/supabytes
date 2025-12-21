import type React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Cloud, Lock, Share2, Shield, Smartphone, Zap } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cloud className="h-8 w-8 text-indigo-600" />
            <span className="text-xl font-bold text-slate-900">Supabytes</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 text-balance">
          Your Files, Anywhere, <span className="text-indigo-600">Anytime</span>
        </h1>
        <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto text-pretty">
          Securely store, share, and access your files from any device. Simple,
          fast, and reliable cloud storage for everyone.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/auth/sign-up">
            <Button size="lg" className="w-full sm:w-auto">
              Start Free
            </Button>
          </Link>
          <Link href="/auth/login">
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto bg-transparent"
            >
              Sign In
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
          Everything You Need
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Shield className="h-10 w-10 text-indigo-600" />}
            title="Secure Storage"
            description="Your files are encrypted and protected with enterprise-grade security."
          />
          <FeatureCard
            icon={<Share2 className="h-10 w-10 text-indigo-600" />}
            title="Easy Sharing"
            description="Share files with anyone using secure, expiring links."
          />
          <FeatureCard
            icon={<Smartphone className="h-10 w-10 text-indigo-600" />}
            title="Access Anywhere"
            description="Access your files from any device with our responsive interface."
          />
          <FeatureCard
            icon={<Zap className="h-10 w-10 text-indigo-600" />}
            title="Lightning Fast"
            description="Upload and download files at blazing speeds."
          />
          <FeatureCard
            icon={<Lock className="h-10 w-10 text-indigo-600" />}
            title="Private by Default"
            description="Your files are private until you choose to share them."
          />
          <FeatureCard
            icon={<Cloud className="h-10 w-10 text-indigo-600" />}
            title="API Access"
            description="Integrate with your apps using our REST API."
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-slate-50 py-8">
        <div className="container mx-auto px-4 text-center text-slate-600">
          <p>&copy; 2025 Supabytes. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 rounded-xl border bg-white hover:shadow-lg transition-shadow">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600">{description}</p>
    </div>
  );
}
