import { Star } from "lucide-react";

const testimonials = [
  {
    quote:
      "Creating a quiz feels fast and clear. The admin flow focuses on the important things: questions, answers, time and results.",
    name: "Admin user",
    role: "Quiz creator",
  },
  {
    quote:
      "The solving experience is simple. I can see the question, choose an answer and continue without distractions.",
    name: "Student user",
    role: "Quiz solver",
  },
  {
    quote:
      "The platform has a clean structure and can grow into a real quiz module for larger applications.",
    name: "Project reviewer",
    role: "Feedback",
  },
];

export function TestimonialSection() {
  return (
    <section className="q-container pb-16 md:pb-24">
      <div className="border-2 border-[#211F20] bg-[#EBE4D8] p-5 md:p-8">
        <div className="grid gap-6 md:grid-cols-[0.9fr_1.1fr] md:items-end">
          <div>
            <p className="mb-3 inline-flex bg-[#FFFAF2] px-3 py-1 font-display text-lg leading-none text-[#006E5A]">
              Why Quizio
            </p>

            <h2 className="font-display text-[48px] leading-[0.92] text-[#211F20] md:text-[76px]">
              Clear for creators.
              <span className="block text-[#FF3C38]">Simple for users.</span>
            </h2>
          </div>

          <p className="max-w-xl q-body text-[#211F20] md:justify-self-end">
            Quizio is designed around one simple flow: create a quiz, publish it,
            solve it and understand the result.
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