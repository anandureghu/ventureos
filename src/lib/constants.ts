import type {
  LifecycleStage,
  TaskStatus,
  TxnFundSource,
  TxnReimbursementStatus,
  TxnSettlementStatus,
  TxnType,
  VentureCategory,
  Venture
} from "./types";

export const LIFECYCLE_ORDER: LifecycleStage[] = [
  "idea",
  "research",
  "validation",
  "planning",
  "mvp",
  "launch",
  "growth",
  "scale"
];

export const STAGE_LABEL: Record<LifecycleStage, string> = {
  idea: "Idea",
  research: "Research",
  validation: "Validation",
  planning: "Planning",
  mvp: "MVP",
  launch: "Launch",
  growth: "Growth",
  scale: "Scale"
};

export const KANBAN_COLUMNS: { key: TaskStatus; label: string }[] = [
  { key: "backlog", label: "Backlog" },
  { key: "research", label: "Research" },
  { key: "doing", label: "Doing" },
  { key: "waiting", label: "Waiting" },
  { key: "completed", label: "Completed" }
];

export const CATEGORY_LABEL: Record<VentureCategory, string> = {
  dropshipping: "Dropshipping",
  printing_3d: "3D Printing",
  story_books: "Story Books",
  clothing: "Clothing",
  saas: "SaaS",
  other: "Other"
};

export const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABEL) as [
  VentureCategory,
  string
][];

// The six scoring factors, each 0..10. "low_*" factors are framed so higher = better.
export const SCORE_FACTORS: {
  key: keyof Pick<
    Venture,
    | "score_profit"
    | "score_demand"
    | "score_interest"
    | "score_low_cost"
    | "score_low_time"
    | "score_low_risk"
  >;
  label: string;
  hint: string;
}[] = [
  { key: "score_profit", label: "Profit potential", hint: "How lucrative if it works" },
  { key: "score_demand", label: "Market demand", hint: "How much people want it" },
  { key: "score_interest", label: "Personal interest", hint: "How motivated you are" },
  { key: "score_low_cost", label: "Affordability", hint: "Higher = cheaper to start" },
  { key: "score_low_time", label: "Speed to launch", hint: "Higher = faster to ship" },
  { key: "score_low_risk", label: "Safety", hint: "Higher = lower risk" }
];

export function priorityScore(v: Pick<Venture, (typeof SCORE_FACTORS)[number]["key"]>): number {
  const total =
    v.score_profit +
    v.score_demand +
    v.score_interest +
    v.score_low_cost +
    v.score_low_time +
    v.score_low_risk;
  return Math.round((total / 60) * 100);
}

export const FUND_SOURCE_LABEL: Record<TxnFundSource, string> = {
  company: "Company fund",
  person: "Personal fund"
};

// Settlement tracks the transaction with the outside party — label depends
// on whether money is leaving (expense) or arriving (revenue).
export const SETTLEMENT_LABEL: Record<TxnType, Record<TxnSettlementStatus, string>> = {
  expense: { pending: "Pending", completed: "Paid" },
  revenue: { pending: "Pending", completed: "Received" }
};

// Reimbursement only applies when fund_source = "person" — has the company
// paid that person back for money they fronted.
export const REIMBURSEMENT_LABEL: Record<TxnReimbursementStatus, string> = {
  pending: "Reimbursement pending",
  resolved: "Reimbursed"
};

export const STAGE_ACCENT: Record<LifecycleStage, string> = {
  idea: "#8A90A3",
  research: "#4C8DFF",
  validation: "#E8A33D",
  planning: "#4C8DFF",
  mvp: "#7C5CFF",
  launch: "#7C5CFF",
  growth: "#3FB68B",
  scale: "#3FB68B"
};
