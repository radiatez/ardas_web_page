import type { DealerPortalResolution } from "@/security/dealer-portal";

import { ArrowIcon } from "./icons";

type DealerPortalLinkProps = {
  label: string;
  unavailableLabel: string;
  resolution: DealerPortalResolution;
  placement: "header" | "drawer" | "footer";
};

export function DealerPortalLink({
  label,
  unavailableLabel,
  resolution,
  placement,
}: DealerPortalLinkProps) {
  const className = `dealer-portal-link dealer-portal-link--${placement}`;

  if (!resolution.enabled || !resolution.url) {
    return (
      <span
        aria-disabled="true"
        className={className}
        data-enabled="false"
        title={unavailableLabel}
      >
        <span>{label}</span>
        <span aria-hidden="true" className="dealer-portal-link__status">—</span>
      </span>
    );
  }

  return (
    <a
      className={className}
      data-enabled="true"
      href={resolution.url}
      rel="noopener noreferrer"
      target="_blank"
    >
      <span>{label}</span>
      <ArrowIcon className="direction-icon" />
    </a>
  );
}
