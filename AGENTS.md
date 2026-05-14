<!-- BEGIN:nextjs-agent-rules -->
# Next.js rules (frontend)

This repo uses a customized Next.js build. APIs, conventions, and file structure may differ from standard Next.js.

Required steps before editing anything under `next/`:
- Read the relevant guide in `next/node_modules/next/dist/docs/`.
- Follow all deprecation notices in those docs.
<!-- END:nextjs-agent-rules -->

# UI system: shadcn/ui

Use shadcn UI components for all interface work in this repo.

- Prefer components from `next/src/components/ui` before building custom markup.
- If a component is missing, add it with `npx shadcn@latest add <component>` and commit the generated files.
- Use `cn` from `next/src/lib/utils` for class composition.
- Keep styling in Tailwind classes applied to shadcn components.

# Skills

Skills live in `.agents/skills`. If a task matches a skill, read its `SKILL.md` before starting work.