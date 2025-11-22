# Ace The Interview: AI-Powered Mock Interview Platform

Ace The Interview is a web application built with Next.js and Genkit that provides a realistic and interactive mock interview experience. It leverages the power of Google's Gemini models to simulate various interview scenarios, transcribe user responses in real-time, and provide both spoken feedback and detailed performance analysis.

## ✨ Features

- **🗣️ Voice-First Interaction**: Engage in a natural, spoken conversation with the AI interviewer. The app handles both speech-to-text and text-to-speech.
- **🎭 Multiple Scenarios**: Practice for different types of interviews, including:
  - **Behavioral (HR) Interviews**: Answer classic questions about teamwork, leadership, and conflict resolution.
  - **Technical Interviews**: Discuss technical concepts and problem-solving approaches.
  - **Casual Chat**: A simple warm-up to get comfortable with the system.
- **🤖 Configurable AI**: Choose from multiple AI voices to customize your practice partner.
- **📈 Detailed Feedback**: At the end of each session, receive a structured performance review covering:
  - Overall Summary
  - Clarity and Conciseness
  - Relevance to the Prompt
  - Problem-Solving Skills
- **🧠 Intelligent Follow-Up**: The AI asks relevant follow-up questions based on your previous answers, creating a dynamic conversation.
- **📜 Interview History**: (Future feature) Review transcripts and feedback from past sessions to track your progress.
- **🎤 Interrupt and Redirect**: Just like a real interview, you can interrupt the AI while it's speaking to take control of the conversation.

## 🚀 Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with [ShadCN UI](https://ui.shadcn.com/) for components.
- **AI Orchestration**: [Genkit](https://firebase.google.com/docs/genkit)
- **Generative AI Models**: [Google Gemini](https://deepmind.google/technologies/gemini/) (used for conversation, transcription, and text-to-speech).
- **State Management**: React Hooks (`useState`, `useRef`, `useCallback`).

## ⚙️ Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/en) (v18 or later)
- An NPM package manager (`npm`, `yarn`, or `pnpm`)
- A Google AI API Key with the Gemini API enabled.

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd <repository-directory>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a file named `.env.local` in the root of the project and add your Google AI API key:
    ```
    GOOGLE_API_KEY=your_api_key_here
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

The application will now be running at `http://localhost:9002`.

## 🔧 How It Works

The application is architected around a client-server model using Next.js Server Actions and client-side React components.

1.  **Client-Side (`speaking-practice-client.tsx`)**:
    - Manages the user interface, session state (e.g., `listening`, `processing`), and user interactions.
    - Uses the browser's `MediaRecorder` API to capture the user's spoken answer.
    - When the user stops speaking, it sends the audio data (as a data URI) to a Server Action.

2.  **Server-Side (`generate-speaking-practice-response.ts`)**:
    - This Genkit flow acts as the main backend logic.
    - **Transcription**: It first uses a Gemini model to transcribe the user's audio into text.
    - **Response Generation**: It sends the full conversation context (scenario, chat history, and the new transcription) to another Gemini model to generate an appropriate spoken response, determine if the interview is complete, and generate final feedback if necessary.
    - **Text-to-Speech (TTS)**: It uses a Gemini TTS model to convert the AI's text response into audio data.
    - It returns the display text, audio data, and transcription back to the client.

3.  **Audio Playback**: The client receives the response and plays the AI's audio automatically, creating a seamless conversational loop.

4.  **Feedback**: When the AI determines the session is complete (typically after 4-5 exchanges), it generates a structured feedback object, which the client then displays in a detailed modal dialog.
