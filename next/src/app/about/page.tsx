import { getTranslations } from "next-intl/server";

import { StaticInfoPage } from "@/components/layout/StaticInfoPage";

export default async function AboutPage() {
  const t = await getTranslations("staticPages.about");

  return (
    <StaticInfoPage
      eyebrow={t("eyebrow")}
      title={t("title")}
      intro={t("intro")}
      sections={[
        {
          title: t("sections.focus.title"),
          body: t("sections.focus.body"),
        },
        {
          title: t("sections.creators.title"),
          body: t("sections.creators.body"),
        },
        {
          title: t("sections.learners.title"),
          body: t("sections.learners.body"),
        },
      ]}
    />
  );
}
