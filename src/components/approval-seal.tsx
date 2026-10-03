import { cn, formatStampLocal, formatStampUtc } from "@/lib/utils";
import { RegistrationCorners } from "@/components/registration-mark";

export type SealApproval = {
  approval_number: string;
  client_name: string;
  client_email: string;
  approved_at: string;
  ip_address?: string | null;
  user_agent?: string | null;
};

/** Reads a UA string down to something a person would recognise. */
function browserOf(userAgent: string | null | undefined) {
  if (!userAgent) return null;
  if (/Edg\//.test(userAgent)) return "Edge";
  if (/OPR\/|Opera/.test(userAgent)) return "Opera";
  if (/Firefox\//.test(userAgent)) return "Firefox";
  if (/Chrome\//.test(userAgent)) return "Chrome";
  if (/Safari\//.test(userAgent)) return "Safari";
  return null;
}

/**
 * The approval seal — the product's one memorable object.
 *
 * An approval in this industry is a contractual fact, so it is presented as the
 * artifact a client would actually want to keep: a bordered, corner-marked block
 * of record with a monospaced definition list and a timestamp that cannot be
 * ambiguous.
 *
 * It carries the brand gradient as its ground. That is a change of strategy from
 * the previous system, which spent a single green tint here and treated the seal
 * as the only place that colour appeared — a defensible rule that has now been
 * spent better. The seal is the one moment in this product that is genuinely
 * celebratory, it appears at most once on any page, and the reference language
 * this redesign follows builds its whole identity on exactly this move: a
 * saturated gradient object sitting on white.
 *
 * Every type inside stays white. On this gradient a dark ink would lose its edge
 * against the violet end, and the seal has to stay readable at a glance on a
 * phone — the contrast is carried by putting the record itself on a dark violet
 * card inside the gradient rather than by tinting the text.
 *
 * The press animation is the single orchestrated moment in the product: the
 * stamp meets the paper once, then stays still.
 */
export function ApprovalSeal({
  approval,
  deliverableName,
  versionNumber,
  projectName,
  className,
}: {
  approval: SealApproval;
  deliverableName: string;
  versionNumber: number;
  projectName?: string | null;
  className?: string;
}) {
  const browser = browserOf(approval.user_agent);

  const rows: Array<[string, React.ReactNode]> = [
    [
      "record",
      <span key="n" className="font-medium">
        {approval.approval_number}
      </span>,
    ],
    ["version", `v${versionNumber}`],
    ["approved by", approval.client_name],
    ["email", approval.client_email],
    ["recorded", formatStampUtc(approval.approved_at)],
    ["your time", formatStampLocal(approval.approved_at)],
    ...(approval.ip_address
      ? ([["address", approval.ip_address]] as Array<[string, React.ReactNode]>)
      : []),
    ...(browser
      ? ([["browser", browser]] as Array<[string, React.ReactNode]>)
      : []),
  ];

  return (
    <section
      aria-labelledby={`seal-${approval.approval_number}`}
      className={cn(
        "animate-press gradient-brand relative overflow-hidden rounded-sheet p-6 sm:p-7",
        className,
      )}
    >
      <RegistrationCorners className="text-white/70" inset={10} />

      <div className="relative">
        <p className="text-xs font-medium text-white/80">
          {projectName ? `${projectName} / ` : ""}
          {deliverableName}
        </p>

        <h3
          id={`seal-${approval.approval_number}`}
          className="mt-2 text-3xl font-semibold uppercase leading-none tracking-[0.08em] text-white sm:text-4xl"
        >
          Approved
        </h3>

        <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/85">
          The client approved version {versionNumber} and nothing else. This
          proof is locked and cannot be changed or replaced.
        </p>

        {/*
          The record sits on its own dark card. This is what lets the gradient be
          as saturated as the reference's without putting a 12px timestamp at
          1.6:1 on a violet-to-amber ramp: the values are read against a flat
          violet, not against a gradient that changes under them.
        */}
        <dl className="mt-6 grid grid-cols-[5.5rem_1fr] items-baseline gap-x-4 gap-y-2 rounded-field bg-[hsl(253_69%_22%)] p-5 text-white sm:grid-cols-[6.5rem_1fr]">
          {rows.map(([key, value]) => (
            <div key={key} className="contents">
              <dt className="text-[0.6875rem] font-medium text-white/60">
                {key}
              </dt>
              <dd className="min-w-0 break-words font-mono text-xs tabular-nums">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}