Technical Specification: Agentic Skill Studio
1. Executive Summary
The Agentic Skill Studio is a cutting-edge, client-side Single Page Application (SPA) designed to democratize the creation, testing, and execution of AI agent skills. Built on React 19 and Vite, the application provides a seamless, five-phase workflow that transforms rough user intents into production-grade, executable AI behaviors.
By leveraging the @google/genai SDK, the system integrates directly with Google's most advanced multimodal models (Gemini 3.1 Pro, Gemini 2.5 Flash, etc.) to perform complex tasks ranging from prompt engineering and use-case generation to multimodal Optical Character Recognition (OCR) and document analysis.
A standout feature of the Agentic Skill Studio is its highly dynamic, accessible, and aesthetically rich User Interface (UI). It features a bespoke theming engine that supports Light/Dark modes, internationalization (English and Traditional Chinese), and 10 distinct visual styles inspired by master painters (e.g., Van Gogh, Monet, Picasso). This specification details the architectural decisions, state management paradigms, AI integration strategies, and UI/UX engineering that power the application.
2. System Architecture
2.1. Architectural Paradigm
The application follows a Client-Side Rendering (CSR) architecture. It is deployed as a static bundle served via a standard web server or CDN. All application logic, state management, and API orchestrations occur within the user's browser.
Advantages of this approach:
Zero-Backend Infrastructure: Reduces deployment complexity and hosting costs.
Immediate Interactivity: Once the JavaScript bundle is loaded, UI transitions (like stepping through the 5 phases) are instantaneous.
Direct API Communication: The client communicates directly with the Gemini API, reducing latency that would otherwise be introduced by a middle-tier proxy.
2.2. Technology Stack
Core Framework: React 19 (Functional Components, Hooks).
Build Tool: Vite 6 (ESBuild-powered, ultra-fast HMR and bundling).
Styling: Tailwind CSS v4 (Utility-first CSS, configured via @import "tailwindcss").
Animation: Framer Motion v12 (Declarative layout animations and exit transitions).
Icons: Lucide React (Lightweight, scalable SVG iconography).
Markdown Rendering: react-markdown (Safe, customizable parsing of LLM outputs).
AI Integration: @google/genai (Official Google Generative AI SDK).
Language: TypeScript (Strict typing, interface definitions for i18n and API responses).
2.3. Environment and Configuration
The application relies on environment variables injected at build/runtime. The primary variable is GEMINI_API_KEY, which is securely mapped via Vite's define configuration in vite.config.ts:
code
TypeScript
define: {
  'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
}
This allows the client-side code to access the key via process.env.GEMINI_API_KEY without requiring a Node.js backend.
3. Core Workflows & State Machine
The application is governed by a linear, 5-step state machine managed by React's useState hook (const [step, setStep] = useState(1)). Each step represents a distinct phase in the AI agent lifecycle.
3.1. Phase 1: Skill Description (The Skill Creator)
Objective: Translate a user's rough idea into a structured, imperative SKILL.md document.
State Variables: skillDesc (input), skillMd (output).
AI Mechanics: The system utilizes gemini-3.1-pro-preview acting under a strict "Skill Creator" persona.
Prompt Engineering: The system instruction mandates specific architectural patterns for the skill:
YAML frontmatter for metadata.
Imperative instruction formatting.
Progressive disclosure (Metadata -> Body -> References).
"Theory of Mind" explanations (explaining why the agent should take certain actions).
User Interaction: The user inputs text, generates the markdown, and can manually edit the resulting SKILL.md in a textarea or download it as a physical file using the Blob and URL.createObjectURL APIs.
3.2. Phase 2: Use Case Generation
Objective: Automatically brainstorm scenarios to test the newly created skill.
State Variables: useCases (output).
AI Mechanics: The system passes the generated skillMd back to gemini-3.1-pro-preview.
Persona: "QA Analyst".
Output: 10 comprehensive, realistic scenarios rendered via react-markdown. This phase acts as a "Test-Driven Development" (TDD) step for prompt engineering, allowing the user to foresee edge cases before execution.
3.3. Phase 3: Document Processing & Multimodal OCR
Objective: Ingest user documents (PDF, TXT, MD) to serve as the context for the agent's execution.
State Variables: docText (extracted text), pdfBase64 (for UI preview).
File Handling: Utilizes the HTML5 <input type="file"> API.
PDF Processing Strategy: Instead of relying on heavy client-side PDF parsing libraries (like pdf.js) or external Python OCR backends (like pytesseract), the system leverages the native multimodal capabilities of Gemini 3.1 Pro.
The file is read using FileReader.readAsDataURL().
The Base64 string is extracted and passed to the Gemini API using the inlineData object with mimeType: 'application/pdf'.
The LLM is instructed to "Extract all text from this document accurately," effectively performing highly accurate, layout-aware OCR without traditional optical processing overhead.
UI Feedback: If a PDF is detected, an <iframe> is dynamically generated using the Base64 data URI to provide an immediate visual preview of the document.
3.4. Phase 4: Agent Execution
Objective: Apply the generated skill to the extracted document content.
State Variables: selectedModel, task, result.
Model Routing: The user can select from a dropdown of targeted models:
gemini-2.5-flash: For rapid, cost-effective execution.
gemini-3-flash-preview: For balanced reasoning and speed.
gemini-3.1-flash-lite-preview: For lightweight, high-speed tasks.
Context Assembly: The API call is constructed by placing the skillMd into the systemInstruction (defining the agent's core behavior and rules) and placing the docText and user task into the contents array (the user prompt). This strict separation prevents prompt injection and ensures the agent adheres to the skill's guidelines.
3.5. Phase 5: Strategic Follow-up
Objective: Close the loop by generating questions that prompt the user to refine the agent's output.
State Variables: followUps.
AI Mechanics: gemini-3.1-pro-preview acts as a "Strategic Consultant." It analyzes the result from Phase 4 and generates 20 deep-dive questions.
Reset Mechanism: A "Reset Studio" button clears all state variables, returning the user to Phase 1 for a new iteration.
4. User Interface & Experience (UI/UX) Engineering
The UI is engineered to be highly responsive, accessible, and visually striking, moving away from generic "AI aesthetics" toward a highly customizable workspace.
4.1. Layout Architecture
CSS Grid/Flexbox: The main layout utilizes a flex-col to md:flex-row responsive design. On mobile, the stepper stacks above the content. On desktop, a sticky 64-rem wide sidebar (w-64 shrink-0) holds the stepper, while the main content area (flex-1 min-w-0) handles the interactive phases.
Animation Engine: framer-motion is used to wrap the phase transitions in an <AnimatePresence mode="wait"> component. Each phase is a <motion.div> that fades in and slides up (initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}), providing a smooth, app-like feel.
4.2. Theming Engine (CSS Custom Properties)
The application features a robust, multi-dimensional theming engine controlled entirely via CSS variables in index.css. This avoids the performance overhead of CSS-in-JS solutions.
Mechanism:
Base Variables: Six core color tokens are defined: --bg-primary, --bg-secondary, --text-primary, --text-secondary, --accent, and --border.
Light/Dark Mode: The .dark class overrides these variables with inverted, low-light equivalents.
Painter Styles: Data attributes ([data-theme="van-gogh"]) override the base variables with specific color palettes inspired by art history.
Intersection: The CSS is structured so that Painter Styles have both Light and Dark variants (e.g., .dark[data-theme="monet"]), resulting in 22 unique visual states (11 themes × 2 modes).
DOM Manipulation: React's useEffect hook dynamically updates the <html> tag:
code
JavaScript
document.documentElement.className = themeMode;
document.documentElement.setAttribute('data-theme', painterStyle);
Tailwind Integration: Tailwind utility classes reference these CSS variables directly (e.g., bg-[var(--color-bg-primary)]), ensuring the entire UI responds instantly to theme changes with a 0.3s ease CSS transition.
4.3. Internationalization (i18n)
A lightweight, custom i18n system is implemented in src/i18n.ts.
Structure: A simple TypeScript object maps language keys (en, zh) to dictionaries of UI strings.
State: The lang state variable dictates which dictionary is active (const t = i18n[lang]).
Scalability: This approach is highly performant for SPAs and can easily be extended to support lazy-loading of JSON dictionaries if the application scales to dozens of languages.
5. AI Integration & Prompt Engineering
The src/services/gemini.ts file acts as the AI orchestration layer, abstracting the @google/genai SDK calls away from the React components.
5.1. SDK Initialization
code
TypeScript
import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
A singleton instance of the SDK is created.
5.2. Function Signatures and Error Handling
Each phase has a dedicated asynchronous function returning a Promise<string>.
generateSkill(description: string)
generateUseCases(skillMd: string)
executeSkill(model: string, skillMd: string, documentText: string, task: string)
generateFollowUps(result: string)
extractTextFromPdfLLM(base64Data: string)
In the React layer (App.tsx), these functions are wrapped in try...catch blocks. Errors are caught and rendered in a dedicated error boundary UI component (bg-red-100 text-red-700), ensuring the user is informed of API failures, token limits, or network issues.
5.3. System Instructions vs. User Prompts
A critical architectural decision is the strict separation of System Instructions and User Prompts.
System Instructions: Used to define the persona, rules, and constraints of the model. For example, in executeSkill, the skillMd is passed entirely as the systemInstruction. This ensures the model treats the skill as its core operating system, rather than just another piece of user text.
User Prompts (contents): Used strictly for the data to be processed (the document text) and the immediate task.
6. Data Flow & State Management
6.1. Component State
React's useState is used extensively to manage the lifecycle of the application.
Navigation State: step (number 1-5).
Data State: skillDesc, skillMd, useCases, docText, pdfBase64, task, result, followUps.
UI State: loading (boolean, triggers spinner icons and disables buttons), error (string, triggers error banners).
Preferences State: lang, themeMode, painterStyle.
6.2. The "Controlled Component" Pattern
All text areas and inputs are "controlled components." Their value is bound to a React state variable, and their onChange handlers update that state. This ensures React is the single source of truth for all user input, allowing for easy manipulation, validation, and submission to the AI services.
6.3. Asynchronous State Transitions
When a user triggers an AI action (e.g., clicking "Generate SKILL.md"):
setLoading(true) and setError('') are called.
The UI updates to show a loading spinner (<Loader2 className="animate-spin" />) and disables the button to prevent double-submissions.
The await call pauses execution until the Gemini API responds.
Upon success, the result state (e.g., setSkillMd(res)) is updated.
In the finally block, setLoading(false) is called, restoring the UI.
7. Security & Privacy Considerations
7.1. API Key Security
In this specific AI Studio environment, the GEMINI_API_KEY is injected securely at runtime. However, because this is a Client-Side application, the API key is ultimately exposed to the browser's memory and network requests.
Mitigation: In a production environment outside of AI Studio, this architecture must be migrated to a Full-Stack approach (e.g., using an Express backend or Next.js API routes) where the API key is kept securely on the server, and the React frontend communicates with the backend via authenticated endpoints.
7.2. Data Privacy
All document processing (PDF parsing to Base64) happens locally in the browser. However, the extracted text and Base64 data are sent to Google's Gemini API for processing. Users must be aware that sensitive documents are being transmitted over the network to an LLM provider.
7.3. Cross-Site Scripting (XSS) Prevention
The application renders LLM output using react-markdown. This library is inherently safer than using dangerouslySetInnerHTML, as it parses the markdown into an Abstract Syntax Tree (AST) and renders safe React elements, stripping out malicious <script> tags or inline event handlers that an LLM might hallucinate or a malicious user might attempt to inject via the document text.
8. Performance Optimization
8.1. DOM Rendering
Conditional Rendering: The application uses AnimatePresence and conditional rendering ({step === 1 && ...}) to ensure that only the DOM nodes for the current phase are mounted. This keeps the DOM tree shallow and performant.
Memoization: While not strictly necessary for this scale, future iterations could utilize useMemo and useCallback to prevent unnecessary re-renders of the markdown components if the text hasn't changed.
8.2. Asset Management
Lucide Icons: Icons are imported as individual React components, ensuring that the bundler (Vite/Rollup) can tree-shake the library, including only the specific SVG paths used in the application, keeping the final JavaScript bundle size minimal.
9. Future Enhancements & Scalability
While the current architecture is robust for a prototype and personal workspace, several enhancements would be required for enterprise scalability:
Backend Migration: Moving the @google/genai calls to a Node.js/Express backend to secure the API key and implement rate limiting.
Database Persistence: Integrating Firebase Firestore or PostgreSQL to save generated skills, user profiles, and historical execution logs, allowing users to build a persistent library of skills.
Streaming Responses: Upgrading the Gemini API calls from generateContent to generateContentStream. This would allow the UI to type out the markdown in real-time, significantly improving perceived performance and UX during long generations.
Advanced Document Parsing: While Gemini's multimodal OCR is excellent, integrating dedicated document parsing pipelines (like LlamaParse or unstructured.io) on a backend could handle massive, 1000-page PDFs by chunking them and utilizing vector databases (RAG) rather than stuffing the entire document into the context window.
Multi-Agent Orchestration: Expanding Phase 4 to allow chaining multiple skills together, where the output of Skill A becomes the input document for Skill B.
