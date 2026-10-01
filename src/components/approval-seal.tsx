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
 * artifact a client would actually want to keep: a bordered, corner-marked
 * block of record with a monospaced definition list and a timestamp that cannot
 * be ambiguous. It carries the only green tint in the interface, on its ground
 * and its registration marks, so that an approved deliverable is recognisable
 * from across a room without turning a status label into a traffic light.
 *
 * Every type inside stays ink. The green is ground and marks only, which keeps
 * the seal from reading as a success banner — it is a stamp, not a
 * congratulation.
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
    ["record", <span key="n" className="font-medium text-ink">{approval.approval_number}</span>],
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
        "animate-press relative overflow-hidden rounded-sheet bg-seal px-5 py-5",
        className,
      )}
    >
      <RegistrationCorners className="text-seal-mark" inset={8} />

      <div className="relative">
        <p className="label-narrow text-[0.6875rem] text-ink-soft">
          {projectName ? `${projectName} / ` : ""}
          {deliverableName}
        </p>

        <h3
          id={`seal-${approval.approval_number}`}
          className="label-narrow mt-2 text-2xl font-semibold uppercase leading-none tracking-[0.16em] text-ink"
        >
          Approved
        </h3>

        <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-soft">
          The client approved version {versionNumber} and nothing else. This
          proof is locked and cannot be changed or replaced.
        </p>

        <dl className="mt-5 grid grid-cols-[5.5rem_1fr] items-baseline gap-x-4 gap-y-1.5 border-t border-ink/12 pt-4 sm:grid-cols-[6.5rem_1fr]">
          {rows.map(([key, value]) => (
            <div key={key} className="contents">
              <dt className="slug-key text-ink-soft">{key}</dt>
              <dd className="min-w-0 break-words font-mono text-xs tabular-nums text-ink">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}