# Product Requirements Document (PRD): OpenPaperGrid - Open Source Agent for Life Sciences

## 1. Introduction / Overview

OpenPaperGrid is an open-source research assistant designed to accelerate literature review, summarization, and extraction tasks in life sciences. It provides a familiar and flexible user interface inspired by PubMed, while extending functionality with advanced AI-powered capabilities. The tool is self-deployable, API key-driven, and optimized for power users who want a transparent, fast, and customizable experience for evidence synthesis, without limitations imposed by hosted services.

## 2. Goals

* Build a self-deployable search and extraction agent tailored to life sciences.
* Replicate familiar biomedical search paradigms (PubMed-style Boolean search).
* Auto-generate structured extraction outputs with customizable fields.
* Enable users to explore and chat with single papers and collections.
* Provide basic visualizations (e.g., authors, journals, institutions).
* Demonstrate fast iteration and technical credibility.
* Use n8n as the orchestration engine for backend workflows.
* Allow users to optionally log in and save results (auth will be basic and lightweight).
* Enable automated extraction from uploaded PDFs and OpenAlex OA papers.
* Provide source-backed quotes for generated content.
* Support rapid orientation in new fields with summaries and citation trails.

## 3. User Stories

* As a biomedical researcher, I want to search for papers using Boolean expressions so that I can replicate my PubMed workflows.
* As a technical user, I want to self-deploy the agent with my own API keys so that I can avoid vendor rate limits.
* As a user, I want a familiar interface for searching, reading, and extracting from papers so that the learning curve is minimal.
* As a power user, I want to define custom extraction fields so that I can tailor outputs to my specific needs.
* As a user, I want to chat with a single paper or a collection so that I can deeply explore its content.
* As a user, I want to see summary charts (authors, journals, affiliations) so I can understand the literature landscape quickly.
* As a user, I want to optionally sign in so I can save searches and paper collections.
* As a user, I want to extract data from uploaded PDFs and OA sources with speed and accuracy.
* As a user, I want to see citations and quotes inline with AI-generated answers.

## 4. Functional Requirements

1. The system must allow users to run Boolean-style search queries (AND, OR, NOT) over OpenAlex.
2. The system must retrieve metadata and open-access full-text links from OpenAlex.
3. If a full-text PDF is available, the system must extract it using LamaParse.
4. The UI must display results in a table/grid with auto-generated summaries.
5. The table must support user-defined custom extraction fields.
6. The system must support chat with a single paper (e.g., using OpenAI function-calling or RAG).
7. The system must support chat across a collection of papers.
8. Users must be able to save papers to named collections for aggregation and later access.
9. The system must generate charts showing summary stats (top authors, journals, institutions).
10. Users must be able to upload PDFs and extract structured content from them.
11. Generated responses must be traceable with quoted sources from documents.
12. Self-deployment should be available with API keys configured in the .env file.
13. The backend workflow logic (e.g., search, parse, extract, chat) must be orchestrated using n8n.
14. Basic authentication (e.g., email + magic link or Supabase auth) must be supported for saving user-specific results and collections.

## 5. Non-Goals (Out of Scope)

* Citation intent classification (e.g., Scite-style pro/con/neutral labeling).
* Advanced evidence grading (e.g., based on journal impact factor or trial type).
* Multi-user permissions, roles, or admin dashboards.
* Hosted version with usage tiering (v1 will be open and free).
* BYOK via frontend input (manual .env setup only).
* Usage-based gating or extraction count limitations.

## 6. Design Considerations

* Follow PubMed’s UI conventions for search box, filters, and result list layout.
* Reuse modern UI patterns for grid layout, table-based extraction, and chat interactions.
* Support drag-and-drop PDF uploads with visible file names.
* Display citation quotes alongside model-generated answers for validation.
* Prioritize fast loading, clean typography, and intuitive iconography.
* Use TailwindCSS (or v0 default components) for consistency and speed.

## 7. Technical Considerations

* Use Supabase for storing user data, search history, and paper collections.
* Use OpenAlex as the primary metadata and abstract retrieval source.
* Use LamaParse for PDF parsing where OA links or uploads are available.
* Use OpenAI / Gemini / Claude APIs for summarization, extraction, and chat.
* All API keys must be stored in .env and not input via UI for MVP.
* Backend workflow orchestration will be implemented using n8n.
* Deployable via Vercel / Fly.io / Docker for open-source ease.

## 8. Success Metrics

* 100+ GitHub stars within 2 weeks of launch.
* At least 10 users self-deploy the tool and provide feedback.
* Successful extraction and chat performance on 80%+ of OA articles tested.
* Positive community feedback on UI familiarity, usability, and customization.