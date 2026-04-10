import { ScrollReveal } from "@/components/animation/ScrollReveal";
import { WaveDivider } from "@/components/animation/WaveDivider";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — MineralWater",
  description:
    "MineralWater terms of service. Please read these terms carefully before using our website.",
};

export default function TermsPage() {
  return (
    <>
      <section className="max-w-3xl mx-auto px-4 py-8">
        <ScrollReveal>
          <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
          <p className="text-sm text-muted-foreground mb-8">
            Last updated: April 10, 2026
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <div className="glass-card p-8 space-y-8">
            <section>
              <h2 className="text-xl font-bold mb-3">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing and using MineralWater (&quot;the Service&quot;), you agree
                to be bound by these Terms of Service. If you do not agree to
                these terms, please do not use the Service. We reserve the right
                to update these terms at any time.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">2. Description of Service</h2>
              <p className="text-muted-foreground leading-relaxed">
                MineralWater provides information about mineral water brands,
                their mineral compositions, comparison tools, and a personal
                hydration tracking feature. The Service is provided free of
                charge for personal, non-commercial use.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">3. User Accounts</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                To use the hydration tracker, you must create an account with a
                valid email address and password. You are responsible for
                maintaining the security of your account credentials. You agree
                to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li>Provide accurate information when registering</li>
                <li>Keep your password secure and confidential</li>
                <li>
                  Notify us immediately if you suspect unauthorized access to
                  your account
                </li>
                <li>Not share your account with others</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">
                4. Mineral Content Information
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                The mineral content data provided on this site is sourced from
                official brand publications, bottle labels, and water quality
                reports. While we strive for accuracy, mineral compositions can
                vary between batches, sources, and over time. This information is
                provided for educational and comparison purposes only and should
                not be considered medical advice.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">5. Health Disclaimer</h2>
              <p className="text-muted-foreground leading-relaxed">
                MineralWater does not provide medical, nutritional, or health
                advice. The hydration goals, mineral information, and
                recommendations on this site are general in nature. Always
                consult a healthcare professional before making changes to your
                diet or hydration habits, especially if you have medical
                conditions or are taking medications.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">6. Affiliate Links</h2>
              <p className="text-muted-foreground leading-relaxed">
                Some links on this site are affiliate links to Amazon.com. When
                you click these links and make a purchase, we may receive a
                commission. This does not affect the price you pay. Our editorial
                content and brand ratings are independent of affiliate
                relationships.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">7. Intellectual Property</h2>
              <p className="text-muted-foreground leading-relaxed">
                All content on MineralWater, including text, graphics, logos,
                icons, images, and software, is the property of MineralWater or
                its content suppliers and is protected by copyright laws. Brand
                names and logos mentioned on this site are trademarks of their
                respective owners.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">8. Prohibited Uses</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                You agree not to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li>
                  Use the Service for any unlawful purpose or to solicit others
                  to do so
                </li>
                <li>
                  Attempt to gain unauthorized access to any part of the Service
                </li>
                <li>
                  Scrape, data mine, or systematically extract content from the
                  Service
                </li>
                <li>
                  Use automated systems (bots, scrapers) to access the Service
                </li>
                <li>
                  Interfere with or disrupt the Service or its infrastructure
                </li>
                <li>Impersonate another person or entity</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">
                9. Limitation of Liability
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                MineralWater is provided &quot;as is&quot; without warranties of any kind.
                We are not liable for any damages arising from your use of the
                Service, including but not limited to direct, indirect,
                incidental, or consequential damages. Our total liability shall
                not exceed the amount you have paid us (which is zero for the
                free service).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">10. Account Termination</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to suspend or terminate your account at any
                time for violations of these terms. You may delete your account
                at any time through your account settings. Upon deletion, your
                personal data will be permanently removed in accordance with our
                Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">11. Governing Law</h2>
              <p className="text-muted-foreground leading-relaxed">
                These terms shall be governed by and construed in accordance with
                the laws of the United States. Any disputes arising from these
                terms or your use of the Service shall be resolved through
                binding arbitration.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">12. Contact</h2>
              <p className="text-muted-foreground leading-relaxed">
                For questions about these terms, please contact us at{" "}
                <a
                  href="mailto:legal@mineralwater.com"
                  className="text-ocean-surface hover:underline"
                >
                  legal@mineralwater.com
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
            href="/privacy"
            className="text-sm font-medium text-primary hover:underline"
          >
            Privacy Policy →
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
