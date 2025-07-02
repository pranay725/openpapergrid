# OpenPaperGrid Task List

This task list outlines the sequential development plan for building OpenPaperGrid.

## Phase 1: Project Setup & Core Search UI (The Foundation)

This phase focuses on getting the project structure in place and deploying a non-functional "scaffold" to Vercel. This validates our deployment pipeline from day one.

- [ ] **Step 1.1: Initialize Next.js Project**
  - [ ] Initialize a new Next.js application using `npx create-next-app@latest openpapergrid`.
  - [ ] Configure the project with TypeScript and TailwindCSS.
- [ ] **Step 1.2: Build the Basic UI Layout**
  - [ ] Create the main page (`app/page.tsx`).
  - [ ] Implement a header with the project title.
  - [ ] Create a static search bar component, styled like PubMed.
  - [ ] Create a placeholder area for search results.
- [ ] **Step 1.3: Initial Vercel Deployment**
  - [ ] Create a new GitHub repository for the project.
  - [ ] Connect the repository to a new Vercel project.
  - [ ] Deploy the initial static UI to Vercel to set up the CI/CD pipeline.

## Phase 2: Backend Integration & Live Search (First Functional Feature)

This phase will connect the UI to the OpenAlex API to enable live search functionality.

- [ ] **Step 2.1: Create the Search API Route**
  - [ ] Create a Next.js API route at `app/api/search/route.ts`.
  - [ ] Implement server-side logic to receive a query from the frontend.
  - [ ] Construct the OpenAlex API URL and fetch data.
  - [ ] Use environment variables (`.env.local`) for the OpenAlex API key.
  - [ ] Return a clean JSON response to the frontend.
- [ ] **Step 2.2: Connect Frontend to the API**
  - [ ] Add state management to the search page to handle loading, data, and error states.
  - [ ] Implement the `onSubmit` handler for the search form.
  - [ ] Make a `fetch` request to the `/api/search` endpoint.
  - [ ] Render the fetched search results (titles, authors, journals) in the UI.

## Phase 3: PDF Extraction and Chat (Core AI Value)

This phase introduces the main "agent" capabilities, starting with single-document chat.

- [ ] **Step 3.1: PDF Parsing Integration**
  - [ ] Create a new API route at `app/api/parse/route.ts`.
  - [ ] The route should accept a PDF URL from an OpenAlex result.
  - [ ] Integrate a parsing service (e.g., LamaParse API) to extract text content.
- [ ] **Step 3.2: Implement Single-Paper Chat**
  - [ ] Add a "Chat with this paper" button to each search result item.
  - [ ] Create a dynamic route and page for the chat interface: `app/chat/[paperId]/page.tsx`.
  - [ ] The chat page should display the paper's abstract and a chat input.
  - [ ] Create a chat API route at `app/api/chat/route.ts`.
  - [ ] Implement a basic RAG pipeline in the chat API route (user question + paper text -> LLM).
  - [ ] Stream the LLM response back to the chat UI.

## Phase 4: User Accounts & Collections (Persistence)

This phase adds user accounts and the ability to save papers to collections.

- [ ] **Step 4.1: Integrate Supabase for Authentication**
  - [ ] Set up a new project in Supabase.
  - [ ] Use the Supabase Auth Helpers for Next.js to add authentication.
  - [ ] Implement a login/signup UI (e.g., magic link or email/password).
- [ ] **Step 4.2: Implement Collections**
  - [ ] Design and create tables in Supabase for `collections` and `papers`.
  - [ ] Add a "Save to collection" button to each search result.
  - [ ] Create API routes to manage collections (create collection, add paper to collection, view collections).
  - [ ] Create a user dashboard page to display saved collections.