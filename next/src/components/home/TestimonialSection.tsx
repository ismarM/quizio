import { Star } from "lucide-react";
import { useTranslations } from "next-intl";

export function TestimonialSection() {
  const t = useTranslations("home");
  const testimonials = [
    {
      quote: t("testimonials.t1quote"),
      name: t("testimonials.t1name"),
      role: t("testimonials.t1role"),
    },
    {
      quote: t("testimonials.t2quote"),
      name: t("testimonials.t2name"),
      role: t("testimonials.t2role"),
    },
    {
      quote: t("testimonials.t3quote"),
      name: t("testimonials.t3name"),
      role: t("testimonials.t3role"),
    },
  ];

  return (
    <section className="q-container pb-16 md:pb-24">
      <div className="border-2 border-[#211F20] bg-[#EBE4D8] p-5 md:p-8">
        <div className="grid gap-6 md:grid-cols-[0.9fr_1.1fr] md:items-end">
          <div>
            <p className="mb-3 inline-flex bg-[#FFFAF2] px-3 py-1 font-display text-lg leading-none text-[#006E5A]">
              {t("whyLabel")}
            </p>

            <h2 className="font-display text-[48px] leading-[0.92] text-[#211F20] md:text-[76px]">
              {t("whyHeading1")}
              <span className="block text-[#FF3C38]">{t("whyHeading2")}</span>
            </h2>
          </div>

          <p className="max-w-xl q-body text-[#211F20] md:justify-self-end">
            {t("whySubtitle")}
          </p>
        </div>

        <div className="my-6 h-[2px] bg-[#211F20]" />

        <div className="grid gap-4 md:grid-cols-3">
          {testimonials.map((item) => (
            <article
              key={item.name}
              className="bg-[#FFFAF2] p-5 transition hover:-translate-y-1 hover:shadow-[6px_6px_0_#211F20]"
            >
              <div className="mb-5 flex gap-1 text-[#FF3C38]">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star
                    key={index}
                    className="h-5 w-5 fill-[#FF3C38]"
                    strokeWidth={1.5}
                  />
                ))}
              </div>

              <p className="min-h-[120px] q-body text-[#211F20]">
                “{item.quote}”
              </p>

              <div className="mt-6 border-t-2 border-[#EBE4D8] pt-4">
                <p className="font-display text-2xl leading-none text-[#211F20]">
                  {item.name}
                </p>
                <p className="mt-1 q-mini text-[#8F8F8F]">{item.role}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
