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

## Design and Architecture
The application is built on a modern, server-centric architecture using the Next.js App Router. This approach prioritizes keeping complex logic and sensitive operations on the server while delivering a fast, interactive UI to the client.

### 1. Agentic AI Core (Server-Side)

- *Genkit Flows as Server Actions: The core AI logic is encapsulated in Genkit flows, which are executed as Next.js Server Actions. This is a critical design decision. It ensures that **no direct client-side calls are made to the Gemini API*. This architecture is more secure as it prevents API key exposure, and it allows for complex, multi-step AI orchestration that would be difficult and inefficient to manage on the client.

- *generateSpeakingPracticeResponse Flow*: This flow acts as the "brain" of the application. It is a multi-step, tool-enabled flow designed to manage the entire conversational turn.

    1.  *Transcription as a Tool*: The flow receives the user's audio as a data URI. It then uses a Genkit tool (transcribeUserAudio) which internally calls a Gemini model to transcribe the audio into text. Modeling transcription as a tool, rather than a direct call within the main prompt, provides a clean separation of concerns. The main agent's job is to respond to text, and it uses a tool to get that text from audio.

    2.  *Response Generation*: The flow's main prompt receives the full conversation history, the AI's defined persona (e.g., HR manager), and the user's latest transcribed response. It instructs the model to act as a role-playing agent. This is where the agentic behavior emerges: the AI is tasked with asking relevant questions, deciding when the conversation has reached a natural conclusion, and generating structured feedback.

    3.  *Expressive Speech Synthesis*: A key part of the conversational quality comes from the speech. 

The response-generation prompt explicitly instructs the model to inject non-verbal cues (e.g., [short pause], [laughing], [uhm]) into its text response. This text, with cues, is then passed to a Gemini TTS model. The TTS model is capable of interpreting these cues to produce more natural, human-sounding speech with appropriate pacing and emotional tone.

  4.  *State Management & Data Transfer*: The flow returns a complete package to the client: the display text (with cues removed), the audio data URI for playback, the user's transcription, and the final feedback object when the session ends. This consolidates all AI-related processing into a single, atomic server action.



### 2. Interactive Client-Side

- *SpeakingPracticeClient.tsx*: This is the primary client component. It can be thought of as a "fat client" in terms of UI state management, but a "thin client" in terms of business logic.
    - *State Machine*: The component manages the session's state (idle, listening, processing, speaking, paused, ready_to_listen) to control the UI and user interactions. This is crucial for a good user experience, preventing the user from recording while the AI is speaking, and providing clear status indicators.
    - *Audio Capture*: The browser's native MediaRecorder API is used for audio capture. This is a standard, widely supported web API that avoids the need for external libraries for simple recording tasks. When recording stops, the audio is encoded into a data URI and sent to the server action.
    - *Audio Playback & Interruption*: A single HTML <audio> element, managed by a useRef, handles all AI speech playback. This simple but effective approach makes it easy to programmatically play, pause, and, most importantly, interrupt the AI's speech. The ability to interrupt is a key feature for making the conversation feel natural and user-led.

### 3. Conversational Quality & Agentic Behavior

The primary goal was to create a high-quality conversational agent, not just a question-and-answer bot.

- *Intelligent Follow-ups: Rather than relying on a predefined question list, the AI is prompted to generate follow-up questions based on the user's *actual response. By feeding the entire conversation history back into the prompt for each turn, the model has the necessary context to ask relevant and insightful questions that deepen the conversation.

- *Dynamic Session Conclusion*: The AI agent, not the client, decides when the interview is complete. The prompt instructs it to conclude after about 4-5 exchanges, at which point it must set a flag (isSessionComplete) and generate the final feedback. This makes the conversation feel more organic, as it doesn't end abruptly based on a simple counter.

  
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
