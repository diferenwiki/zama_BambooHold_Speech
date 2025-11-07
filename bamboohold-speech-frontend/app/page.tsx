"use client";

/**
 * Landing Page
 */

import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-accent/10">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            BambooHold Speech
          </h1>
          <p className="text-2xl md:text-3xl text-[var(--color-text-secondary)] mb-4">
            Protect Your Voice, Guard Your Peace
          </p>
          <p className="text-lg text-[var(--color-text-secondary)] mb-12">
            A privacy-first caution reminder powered by Fully Homomorphic Encryption
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/dashboard"
              className="px-8 py-4 bg-primary text-white rounded-lg font-semibold text-lg hover:opacity-90 transition-all shadow-lg"
            >
              Launch App
            </Link>
            <Link
              href="/dashboard"
              className="px-8 py-4 bg-white dark:bg-gray-800 text-[var(--color-text-primary)] rounded-lg font-semibold text-lg hover:opacity-90 transition-all shadow-lg border border-gray-200 dark:border-gray-700"
            >
              Connect Wallet
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-24">
          <FeatureCard
            icon="🔒"
            title="Privacy by Design"
            description="All emotional and health data encrypted end-to-end with FHEVM"
          />
          <FeatureCard
            icon="🚦"
            title="Smart Caution Window"
            description="Real-time risk assessment based on encrypted multi-dimensional metrics"
          />
          <FeatureCard
            icon="📊"
            title="Self-Improvement"
            description="Review your patterns and improve emotional management"
          />
          <FeatureCard
            icon="🌐"
            title="Fully Decentralized"
            description="You own your data, no third-party access"
          />
        </div>

        {/* How It Works */}
        <div className="mt-24">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <StepCard number={1} title="Submit Encrypted Metrics" description="在端侧加密提交三项指标" />
            <StepCard number={2} title="On-Chain Computation" description="链上加密计算慎言窗状态" />
            <StepCard number={3} title="Get Private Alert" description="仅用户本人可解密查看结果" />
            <StepCard number={4} title="Review & Improve" description="复盘历史，改善情绪管理" />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-24 text-center text-[var(--color-text-secondary)]">
          <p>Powered by Zama FHEVM</p>
          <p className="mt-2 text-sm">&copy; 2025 BambooHold Speech. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="card text-center">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-[var(--color-text-secondary)]">{description}</p>
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">
        {number}
      </div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-[var(--color-text-secondary)]">{description}</p>
    </div>
  );
}

