# The Zeitgeist Engine - TODO

## Phase 2: Collaborative Features

- [ ] **Sharable Links:**
  - [ ] **Backend:** Create a new API endpoint that retrieves a specific analysis by a unique ID.
  - [ ] **Frontend:** Create a new route/page that displays a specific analysis based on the ID in the URL.
  - [ ] **Frontend:** Add a "Share" button to the results page that copies the unique link to the clipboard.
- [ ] **Simple Export:**
  - [ ] **Frontend:** Add a "Copy for Email" button that copies a clean, text-only version of the full report to the clipboard.

## Phase 3: Monetization MVP

- [x] **Pay-per-Analysis:**
    - [ ] **Backend:** Integrate with a payment provider (e.g., Stripe) to handle single payments.
    - [ ] **Frontend:** After a user receives an initial analysis, display a button to "Request Advanced Analysis" for a fee.
    - [ ] **Frontend:** Create a checkout process for the advanced analysis payment.
    - [ ] **Backend:** After successful payment, use SendGrid to send an email to `me@erion.dev` containing the user's request and personal information.

## Deployment

- [ ] Create a production build of the frontend.
- [ ] Configure a production-ready web server (e.g., Gunicorn) for the FastAPI backend.
- [ ] Deploy the application to a cloud provider (e.g., Vercel, Netlify, Heroku).