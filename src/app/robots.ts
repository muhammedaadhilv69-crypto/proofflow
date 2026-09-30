import type { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/app-url";
import {
  INVITE_PATH_PREFIX,
  PROTECTED_PATHS,
  REVIEW_PATH_PREFIX,
  ROUTES,
} from "@/lib/routes";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getAppUrl();
  return {
    rules: {
      userAgent: "*",
      disallow: [
        ...PROTECTED_PATHS,
        `${REVIEW_PATH_PREFIX}/`,
        `${INVITE_PATH_PREFIX}/`,
        ROUTES.login,
        ROUTES.signup,
        ROUTES.forgotPassword,
        ROUTES.resetPassword,
        "/api/",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
