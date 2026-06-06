import { getTranslations } from "next-intl/server";

import { StaticInfoPage } from "@/components/layout/StaticInfoPage";

export default async function TermsPage() {
  const t = await getTranslations("staticPages.terms");

  return (
    <StaticInfoPage
      eyebrow={t("eyebrow")}
      title={t("title")}
      intro={t("intro")}
      sections={[
        {
          title: t("sections.accounts.title"),
          body: t("sections.accounts.body"),
        },
        {
          title: t("sections.content.title"),
          body: t("sections.content.body"),
        },
        {
          title: t("sections.availability.title"),
          body: t("sections.availability.body"),
        },
      ]}
    />
  );
}
