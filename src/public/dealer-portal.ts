import "server-only";

import { getRuntimeDatabase } from "@/db/runtime";
import {
  resolveDealerPortalUrl,
  type DealerPortalResolution,
} from "@/security/dealer-portal";

const disabledResolution: DealerPortalResolution = {
  enabled: false,
  source: "disabled",
};

export async function getPublicDealerPortalResolution(): Promise<DealerPortalResolution> {
  try {
    const { db } = getRuntimeDatabase();
    return await resolveDealerPortalUrl(db);
  } catch {
    return disabledResolution;
  }
}
