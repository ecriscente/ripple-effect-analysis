# The Zeitgeist Engine - Phase 2 TODO

## The Strategic Hub

- [x] **Database Schema:** Design and implement the database schema to store user analyses, including the technology name, the generated report, and a custom title.
- [x] **Backend Logic:** Connect the analysis generation in `main.py` to the user's account so that every report is automatically saved to the new database table.
- [x] **Frontend Dashboard:** Build the user dashboard page where users can see a list of their past analyses, click to view them, and give them custom, memorable titles.

## The Collaborative Catalyst

- [ ] **Sharable Links:**
  - [ ] **Backend:** Create a new API endpoint that retrieves a specific analysis by a unique ID.
  - [ ] **Frontend:** Create a new route/page that displays a specific analysis based on the ID in the URL.
  - [ ] **Frontend:** Add a "Share" button to the results page that copies the unique link to the clipboard.
- [ ] **Simple Export:**
  - [ ] **Frontend:** Add a "Copy for Email" button that copies a clean, text-only version of the full report to the clipboard.

## Technical & UX Refinements

- [ ] **Prompt Management:** Move the master prompts from `llm_integration.py` into separate, non-public template files for easier internal management and optimization.
- [ ] **UI/UX Polish:** Continuously refine the user interface based on feedback, with a focus on the new dashboard and sharing features.
- [ ] **Dark Mode:** Add a dark mode option to the UI.
- [ ] **Internationalization (i18n):**
    - [ ] **Frontend:** Implement a language switcher (English/Brazilian Portuguese).
    - [ ] **Frontend:** Extract all UI strings into a dedicated i18n library.
    - [ ] **Backend:** Modify the `/api/analyze` endpoint to accept a language parameter.
    - [ ] **Backend:** Create separate prompt files for each language.

## Deployment

- [ ] Create a production build of the frontend.
- [ ] Configure a production-ready web server (e.g., Gunicorn) for the FastAPI backend.
- [ ] Deploy the application to a cloud provider (e.g., Vercel, Netlify, Heroku).