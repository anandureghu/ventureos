import Calculators from "@/components/Calculators";

export default function CalculatorsPage() {
  return (
    <div>
      <header className="mb-6">
        <p className="eyebrow mb-1.5">Tools</p>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Calculators
        </h1>
        <p className="mt-1 text-sm text-fg-muted">
          Quick math for any venture — break-even, margins, dropshipping economics,
          SaaS unit economics, and ROI.
        </p>
      </header>
      <Calculators />
    </div>
  );
}
