<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# UI system: shadcn/ui

Use shadcn UI components for all interface work in this repo.

- Prefer components from `src/components/ui` before building custom markup.
- If a component is missing, add it with `npx shadcn@latest add <component>`
	and commit the generated files.
- Use `cn` from `src/lib/utils` for class composition.
- Keep styling in Tailwind classes applied to shadcn components.
