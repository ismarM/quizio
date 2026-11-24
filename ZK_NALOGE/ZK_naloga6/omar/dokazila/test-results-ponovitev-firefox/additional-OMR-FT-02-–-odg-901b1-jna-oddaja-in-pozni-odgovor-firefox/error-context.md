# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: additional.spec.ts >> OMR-FT-02 – odgovor ob meji, sočasna ročna/samodejna oddaja in pozni odgovor
- Location: ..\..\ZK_NALOGE\ZK_naloga6\omar\testi\additional.spec.ts:192:5

# Error details

```
Test timeout of 150000ms exceeded.
```

# Page snapshot

```yaml
- generic [active] [ref=f2e1]:
  - main [ref=f2e2]:
    - generic [ref=f2e3]:
      - link "Quizio" [ref=f2e5] [cursor=pointer]:
        - /url: /quizzes
      - navigation
      - generic [ref=f2e6]:
        - link "Admin" [ref=f2e7] [cursor=pointer]:
          - /url: /admin
        - link "O" [ref=f2e8] [cursor=pointer]:
          - /url: /dashboard
        - button "Sign out" [ref=f2e9] [cursor=pointer]
    - generic [ref=f2e12]:
      - generic [ref=f2e13]:
        - generic [ref=f2e14]:
          - paragraph [ref=f2e15]: Admin dashboard
          - heading "Manage quizzes" [level=1] [ref=f2e16]
          - paragraph [ref=f2e17]: Create quizzes, publish content, review attempts and manage your quiz platform in one place.
        - link "Create quiz" [ref=f2e18] [cursor=pointer]:
          - /url: /admin/quizzes/new
      - generic [ref=f2e19]:
        - article [ref=f2e20]:
          - generic [ref=f2e27]:
            - paragraph [ref=f2e28]: "0"
            - paragraph [ref=f2e29]: Drafts
        - article [ref=f2e30]:
          - generic [ref=f2e39]:
            - paragraph [ref=f2e40]: "0"
            - paragraph [ref=f2e41]: Scheduled
        - article [ref=f2e42]:
          - generic [ref=f2e49]:
            - paragraph [ref=f2e50]: "2"
            - paragraph [ref=f2e51]: Published
        - article [ref=f2e52]:
          - generic [ref=f2e58]:
            - paragraph [ref=f2e59]: "45"
            - paragraph [ref=f2e60]: Archived
      - button "Admin access Manage admins Grant admin access by email, or revoke your own admin access if you no longer need it. omar.n5.admin@example.com" [ref=f2e62] [cursor=pointer]:
        - generic [ref=f2e63]:
          - generic [ref=f2e64]: Admin access
          - heading "Manage admins" [level=2] [ref=f2e66]
          - paragraph [ref=f2e69]: Grant admin access by email, or revoke your own admin access if you no longer need it.
        - generic [ref=f2e70]: omar.n5.admin@example.com
      - generic [ref=f2e75]:
        - generic [ref=f2e76]:
          - heading "All quizzes" [level=2] [ref=f2e77]
          - generic [ref=f2e78]:
            - searchbox [ref=f2e83]: N6-Omar-TIMER-RACE-f9256a25-79f6-4420-82c8-2f26cc6e62d6
            - generic [ref=f2e84]:
              - generic [ref=f2e85]: Status
              - combobox "Status" [ref=f2e86]:
                - option "All statuses" [selected]
                - option "Draft"
                - option "Scheduled"
                - option "Published"
            - generic [ref=f2e87]:
              - generic [ref=f2e88]: Category
              - combobox "Category" [ref=f2e89]:
                - option "All categories" [selected]
                - option "General"
            - link "Archived" [ref=f2e90] [cursor=pointer]:
              - /url: /admin/quizzes/archived
        - generic [ref=f2e91]:
          - generic [ref=f2e92]: Quiz
          - generic [ref=f2e93]: Details
          - generic [ref=f2e94]: Status
          - generic [ref=f2e95]: Actions
        - link "N6-Omar-TIMER-RACE-f9256a25-79f6-4420-82c8-2f26cc6e62d6 Published General Naloga 6 – namenski raziskovalni funkcionalni test Omarja Ždralovića. 2 questions 1 min Published Nov 24, 2026, 10:26 PM Published Published Results Locked Archive" [ref=f2e97]:
          - generic [ref=f2e98]:
            - generic [ref=f2e107]:
              - heading "N6-Omar-TIMER-RACE-f9256a25-79f6-4420-82c8-2f26cc6e62d6" [level=3] [ref=f2e109]
              - generic [ref=f2e110]:
                - generic [ref=f2e111]: Published
                - generic [ref=f2e112]: General
              - paragraph [ref=f2e113]: Naloga 6 – namenski raziskovalni funkcionalni test Omarja Ždralovića.
            - generic [ref=f2e114]:
              - generic [ref=f2e115]: 2 questions
              - generic [ref=f2e124]: 1 min
              - generic [ref=f2e130]: Published Nov 24, 2026, 10:26 PM
            - generic [ref=f2e140]: Published
            - generic [ref=f2e144]:
              - button "Published" [disabled] [ref=f2e145]
              - link "Results" [ref=f2e149] [cursor=pointer]:
                - /url: /admin/quizzes/47/results
              - button "Locked" [disabled] [ref=f2e155]
              - button "Archive" [ref=f2e159] [cursor=pointer]
        - generic [ref=f2e164]: Showing 1-1 of 1 quizzes
    - generic [ref=f2e165]:
      - generic [ref=f2e166]:
        - generic [ref=f2e167]:
          - link "Quizio" [ref=f2e168] [cursor=pointer]:
            - /url: /
          - paragraph [ref=f2e169]: Learn. Challenge. Grow. Quizzes for curious minds.
        - generic [ref=f2e170]:
          - heading "Navigate" [level=3] [ref=f2e171]
          - link "Explore quizzes" [ref=f2e173] [cursor=pointer]:
            - /url: /quizzes
        - generic [ref=f2e174]:
          - heading "Info" [level=3] [ref=f2e175]
          - generic [ref=f2e176]:
            - link "About us" [ref=f2e177] [cursor=pointer]:
              - /url: /about
            - link "Terms of service" [ref=f2e178] [cursor=pointer]:
              - /url: /terms
            - link "Privacy policy" [ref=f2e179] [cursor=pointer]:
              - /url: /privacy
        - generic [ref=f2e180]:
          - heading "Connect" [level=3] [ref=f2e181]
          - paragraph [ref=f2e182]: guiziomaster@gmail.com
          - generic [ref=f2e183]:
            - link "GitHub" [ref=f2e184] [cursor=pointer]:
              - /url: https://github.com/ismarM/quizio
            - link "Email" [ref=f2e189] [cursor=pointer]:
              - /url: mailto:guiziomaster@gmail.com
      - generic [ref=f2e193]: © 2026 Quizio. All rights reserved.
  - alert [ref=f2e195]
```