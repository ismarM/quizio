import { BarChart3, PencilLine, Users } from "lucide-react";
import { useTranslations } from "next-intl";

export function FeatureCards() {
  const t = useTranslations("home");
  const features = [
    {
      title: t("features.createTitle"),
      description: t("features.createDesc"),
      icon: PencilLine,
      color: "#FF3C38",
    },
    {
      title: t("features.publishTitle"),
      description: t("features.publishDesc"),
      icon: Users,
      color: "#006E5A",
    },
    {
      title: t("features.trackTitle"),
      description: t("features.trackDesc"),
      icon: BarChart3,
      color: "#FF3C38",
    },
  ];

  return (
    <section
      id="how-it-works"
      className="q-container grid gap-4 pb-16 md:grid-cols-3 md:pb-20"
    >
      {features.map((feature) => {
        const Icon = feature.icon;

        return (
          <article
            key={feature.title}
            className="group border-2 border-[#211F20] bg-[#FFFAF2] p-6 transition-transform hover:-translate-y-1"
          >
            <div
              className="mb-10 flex h-14 w-14 items-center justify-center border-2 border-[#211F20] bg-[#EBE4D8]"
              style={{ color: feature.color }}
            >
              <Icon className="h-7 w-7" strokeWidth={2.25} />
            </div>

            <h3 className="font-display text-[32px] leading-[1] text-[#211F20]">
              {feature.title}
            </h3>

            <p className="mt-3 q-body text-[#211F20]">
              {feature.description}
            </p>
          </article>
        );
      })}
    </section>
  );
}
