import { ScrollReveal } from "@/components/animation/ScrollReveal";
import { WaveDivider } from "@/components/animation/WaveDivider";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — MineralWater",
  description:
    "MineralWater privacy policy. Learn how we collect, use, and protect your personal information.",
};

export default function PrivacyPage() {
  return (
    <>
      <section className="max-w-3xl mx-auto px-4 py-8">
        <ScrollReveal>
          <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground mb-8">
            Last updated: April 10, 2026
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <div className="glass-card p-8 space-y-8">
            <section>
              <h2 className="text-xl font-bold mb-3">1. Information We Collect</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                When you create an account, we collect your email address and
                display name. When you use the hydration tracker, we store your
                daily water intake logs, profile preferences (weight, activity
                level, climate), and goal settings.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                We also collect standard web analytics data including pages
                visited, browser type, and approximate location (country level)
                to improve our service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">2. How We Use Your Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                Your information is used to provide the hydration tracking
                service, personalize your experience, calculate hydration goals,
                and send reminder notifications you&apos;ve opted into. We do not
                sell your personal information to third parties.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">3. Data Storage & Security</h2>
              <p className="text-muted-foreground leading-relaxed">
                Your data is stored securely using Supabase, which provides
                encryption at rest and in transit. We use Row Level Security
                (RLS) policies to ensure you can only access your own data.
                Passwords are hashed using bcrypt and never stored in plain
                text.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">4. Cookies</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use essential cookies to maintain your authentication session.
                We do not use advertising cookies or third-party tracking
                cookies. You can disable cookies in your browser settings, but
                this may affect the functionality of the hydration tracker.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">5. Third-Party Services</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                We use the following third-party services:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li>
                  <strong className="text-foreground">Supabase</strong> for
                  authentication and data storage
                </li>
                <li>
                  <strong className="text-foreground">Vercel</strong> for
                  hosting and content delivery
                </li>
                <li>
                  <strong className="text-foreground">Amazon Associates</strong>{" "}
                  for affiliate product links (subject to Amazon&apos;s privacy
                  policy)
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">
                6. Amazon Associates Disclosure
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                MineralWater is a participant in the Amazon Services LLC
                Associates Program, an affiliate advertising program designed to
                provide a means for sites to earn advertising fees by advertising
                and linking to Amazon.com. When you click an affiliate link and
                make a purchase, we may earn a commission at no additional cost
                to you.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">7. Your Rights</h2>
              <p className="text-muted-foreground leading-relaxed">
                You have the right to access, export, and delete your personal
                data at any time through your account settings. You can also
                request a complete deletion of your account and all associated
                data by contacting us.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">8. Children&apos;s Privacy</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our service is not directed to children under 13. We do not
                knowingly collect personal information from children under 13. If
                you believe a child has provided us with personal information,
                please contact us.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">9. Changes to This Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this privacy policy from time to time. We will
                notify registered users of significant changes via email. The
                &quot;last updated&quot; date at the top of this page reflects
                the most recent revision.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">10. Contact</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have questions about this privacy policy or your data,
                please contact us at{" "}
                <a
                  href="mailto:privacy@mineralwater.com"
                  className="text-ocean-surface hover:underline"
                >
                  privacy@mineralwater.com
                </a>
                .
              </p>
            </section>
          </div>
        </ScrollReveal>
      </section>

      <WaveDivider variant="gentle" />

      <section className="max-w-3xl mx-auto px-4 pb-12">
        <div className="flex justify-between">
          <Link
            href="/terms"
            className="text-sm font-medium text-primary hover:underline"
          >
            Terms of Service →
          </Link>
          <Link
            href="/about"
            className="text-sm font-medium text-primary hover:underline"
          >
            About Us →
          </Link>
        </div>
      </section>
    </>
  );
}
