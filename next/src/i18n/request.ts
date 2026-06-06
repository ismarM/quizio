import { getRequestConfig } from "next-intl/server";

import { serverFetchJson } from "@/lib/api/server-fetch";
import { getSessionUser } from "@/lib/auth/server-auth";
import type { UserResponse } from "@/lib/types";

type Locale = "en" | "sl";

export default getRequestConfig(async () => {
  let locale: Locale = "en";

  try {
    const sessionUser = await getSessionUser();

    if (sessionUser) {
      const profile = await serverFetchJson<UserResponse>("/api/users/me");
      locale = profile.user.language === 1 ? "sl" : "en";
    }
  } catch {
    locale = "en";
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
