import { getTranslations } from "next-intl/server";

import { StaticInfoPage } from "@/components/layout/StaticInfoPage";

export default async function PrivacyPage() {
  const t = await getTranslations("staticPages.privacy");

  return (
    <StaticInfoPage
      eyebrow={t("eyebrow")}
      title={t("title")}
      intro={t("intro")}
      sections={[
        {
          title: t("sections.data.title"),
          body: t("sections.data.body"),
        },
        {
          title: t("sections.use.title"),
          body: t("sections.use.body"),
        },
        {
          title: t("sections.control.title"),
          body: t("sections.control.body"),
        },
      ]}
    />
  );
}
