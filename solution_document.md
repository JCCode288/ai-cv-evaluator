# AI CV Evaluator Solution Document

## 1. Title
AI CV Evaluator Solution Document

## 2. Candidate Information
*   Full Name: [Your Full Name]
*   Email Address: [Your Email Address]

## 3. Repository Link
*   Provide a link to your GitHub repository: [Your GitHub Repository Link]
*   ⚠️Important: Do not use the word Rakamin anywhere in your repository name, commits, or documentation. This is to reduce plagiarism risk.
*   Example: `github.com/username/ai-cv-evaluator`

## 4. Approach & Design (Main Section)

### Initial Plan
The initial plan for the AI CV Evaluator project was to create a robust backend service capable of automating and enhancing the CV evaluation process. This involved several key requirements:
*   **User Authentication**: Securely manage user access to the platform.
*   **Job Description Management**: Allow evaluators to create, view, update, and delete job descriptions.
*   **CV Evaluation**: Implement a mechanism to evaluate CVs against specific job descriptions using AI.
*   **File Storage**: Store uploaded CVs and related project files efficiently and durably.
*   **Modularity**: Design the system with a modular architecture to ensure maintainability and scalability.
*   **Telegram Integration**: Provide an interface for interacting with the system via a Telegram bot.

Key assumptions included the availability of cloud services for file storage (Google Cloud Storage) and a suitable AI model provider (Gemini API). The scope was primarily focused on the backend logic and API, with the understanding that a frontend or bot interface would consume these APIs. The evaluation process would involve comparing the candidate's CV and project report against a job description and a case study brief.

### System & Database Design

The system is designed as a microservices-oriented backend.

**API Endpoints Design:**
The API endpoints are structured around core functionalities:
*   **Authentication (`/auth`)**: Handles user registration, login (including Google OAuth2), token refreshing, and profile retrieval.
*   **Evaluation (`/evaluate`)**: Manages the lifecycle of CV evaluations.
    *   `POST /upload`: Accepts multipart/form-data containing the Candidate CV and Project Report (PDF). Stores these files and returns their IDs for later processing.
    *   `POST /evaluate`: Triggers the asynchronous AI evaluation pipeline. Receives input job title (string) and document IDs for the CV and project report. Immediately returns a job ID to track the evaluation process.
    *   `GET /result/{id}`: Retrieves the status and result of an evaluation job, reflecting the asynchronous, multi-stage nature of the process.
*   **Job Description (`/job-description`)**: Provides CRUD operations for job descriptions.
*   **Telegram (`/telegram`)**: Exposes webhooks for Telegram bot integration.

**Database Schema:**
The application utilizes MongoDB as its primary database, with Mongoose as the ODM. Key schemas include:
*   **User**: Stores user authentication details and profiles.
*   **JobDescription**: Stores details of job descriptions, including title, description, and requirements.
*   **CV**: Stores metadata about uploaded CVs.
*   **CVResult**: Stores the results of CV evaluations, including match rates, feedback, and scores, linked to specific CVs and job descriptions.
*   **CVDetail**: Stores detailed image pages or sections of a CV document, used for visual inspection.
*   **Chat**: Stores chat history for the RAG agent.
*   **Reference Documents**: The Case Study Brief and Scoring Rubric are treated as reference documents, primarily ingested into the ChromaDB vector store to serve as "ground truth" for AI evaluations.

**Job Queue / Long-running Task Handling:**
The CV evaluation process, which involves AI agent processing, can be a long-running task. While not explicitly detailed in the current API endpoints, the design anticipates the need for asynchronous processing. This would typically involve a message queue (e.g., RabbitMQ, Kafka) to decouple the API request from the actual evaluation process, allowing the API to return a quick response (e.g., a job ID) and the evaluation to proceed in the background. The results would then be retrievable via a separate endpoint (e.g., `/evaluate/:id/result`).

### LLM Integration

The project integrates with Large Language Models (LLMs) through specialized AI Agents. The Gemini API is the sole LLM provider used throughout this application.
*   **LLM Choice**: The project uses `ChatGoogleGenerativeAI` (Gemini API) as the LLM provider. This choice is driven by its capabilities in understanding natural language, generating coherent responses, and its tool-use functionality, which is crucial for the RAG agent.
*   **Prompt Design Decisions**: Prompts are designed to guide the LLM in its role as an HR agent assistant. The system prompt (`TEMPLATE_SYSTEM_RAG_AGENT`) establishes the agent's persona and responsibilities, while the human prompt (`TEMPLATE_HUMAN_RAG_AGENT`) provides the user's question. Prompts are crafted to be clear, concise, and to encourage the use of available tools.
*   **Chaining Logic**: The RAG Agent employs a state graph (`StateGraph`) using LangChain's `langgraph` library. This allows for complex chaining logic where the agent can decide whether to use a tool based on the user's query, execute the tool, and then use the tool's output to generate a final response. This iterative process enables multi-step reasoning and information retrieval, specifically for the CV evaluation, project report evaluation, and a final synthesis for the overall summary.
*   **RAG Strategy**: The RAG strategy involves:
    *   **Retrieval**: The `search_vector_store` tool allows the RAG agent to perform similarity searches in a ChromaDB vector store to retrieve relevant document chunks (e.g., from CVs or project reports) based on the user's query.
    *   **Embeddings**: (Implicitly handled by ChromaDB and the LLM integration) Text data is converted into numerical vector representations (embeddings) to enable semantic search.
    *   **Vector DB**: ChromaDB serves as the vector database, storing embeddings of CV and project content, facilitating fast and relevant information retrieval for the RAG agent.

### Prompting Strategy

The RAG Agent utilizes a dynamic prompting strategy, adapting its prompts based on the specific stage of the evaluation pipeline (CV Evaluation, Project Report Evaluation, and Final Analysis). While the core system and human prompts provide the foundational conversational context, specialized prompts are constructed internally to guide the LLM for each task.

For **CV Evaluation**, prompts are designed to instruct the LLM to:
*   Parse the candidate's CV into structured data.
*   Retrieve relevant information from both the Job Description and CV Scoring Rubrics.
*   Use the LLM to determine the `cv_match_rate` and generate `cv_feedback`.

For **Project Report Evaluation**, prompts are designed to instruct the LLM to:
*   Parse the candidate's Project Report into structured data.
*   Retrieve relevant information from both the Case Study Brief and CV Scoring Rubrics.
*   Use the LLM to determine the `project_score` and generate `project_feedback`.

For **Final Analysis**, a prompt is designed to instruct the LLM to:
*   Synthesize the outputs from the CV Evaluation and Project Report Evaluation into a concise `overall_summary`.

**System Prompt (RAG Agent):**
```
You are an expert HR agent assistant. Your goal is to provide helpful and accurate information based on the user's questions.

You have access to a set of tools to retrieve information about CVs, job descriptions, and evaluation results.

1.  **Analyze the user's question** to determine if you need to use a tool.
2.  **If a tool is needed**, use it to retrieve the relevant information.
3.  **Use the retrieved context** from the tool to answer the user's question.
4.  **If you don't know the answer** and the tools don't provide one, simply state that you don't know.

For your information, today is {today}.
Below is your previous interaction with user:
```

**Human Prompt (RAG Agent):**
```
-------------------------

Make sure to response in "Text" format, spaced properly, because it is for Telegram response and pick best possible representation for your response if it was not a tool call.

Question: {question}

Answer:
```

### Resilience & Error Handling
*   **API Failures/Timeouts**: The `chat` method in `RagAgent` includes a `try-catch` block to gracefully handle errors during the agent's invocation, returning a user-friendly error message instead of crashing.
*   **Tool Execution Errors**: Each tool's `func` in `createTools` also includes `try-catch` blocks to handle errors during tool execution, logging the error and returning an informative message to the agent.
*   **Fallback Logic**: If a tool is not found, a warning is logged, and a "Tool not found" message is returned, preventing the agent from failing.
*   **Retries/Back-off**: While not explicitly implemented with a dedicated library, the error handling structure allows for future integration of retry and back-off mechanisms for API calls and tool executions to enhance resilience against transient failures.
*   **Response Stability**: The LLM temperature is controlled (set to 0.2 in `buildModel`) to promote more stable and deterministic responses. Further validation layers can be added to ensure response quality.
*   **Safety Settings**: The `buildModel` function configures `safetySettings` for the Gemini API to block harmful content, enhancing the robustness and safety of the AI interactions.

### Edge Cases Considered
*   **No relevant documents found**: The `searchVectorStoreParser` handles cases where no relevant documents are found, returning "No relevant documents found."
*   **Job description not found**: The `getJobDescription` tool returns "Job description not found." if an ID does not yield a result.
*   **CV result not found**: Similarly, `getCvResult` handles cases where a CV result ID is not found.
*   **Empty lists**: The list parsers (`getListJobParser`, `getCvResultsParser`) handle empty result arrays gracefully.
*   **Missing API Key**: The `buildModel` function explicitly checks for the `GEMINI_API_KEY` and throws an error if it's not set.

## 5. Results & Reflection

### Outcome
*   **What worked well in your implementation?**
    *   The modular design using NestJS allowed for clear separation of concerns and easy integration of new features.
    *   The LangChain `StateGraph` for the RAG Agent proved effective in orchestrating complex multi-step reasoning and tool usage.
    *   The use of ChromaDB for vector storage enabled efficient and relevant retrieval of information for the RAG agent.
    *   The clear distinction between AI agents (RAG for reasoning, Extractor for data extraction) helped in managing complexity.
    *   The API design provides a solid foundation for various client applications (web, Telegram bot).

*   **What didn’t work as expected?**
    *   Initial prompt design for the RAG agent sometimes led to overly concise responses or misinterpretation of user intent, especially for follow-up questions. This was addressed by removing the conciseness constraint and refining tool descriptions.
    *   Managing environment variables across local development and Docker Compose required careful synchronization and updates to `.env.example` and `docker-compose.yml`.

### Evaluation of Results
The evaluation scores/outputs are expected to be stable and relevant due to the following design choices, which directly address the scoring parameters outlined in the Case Study Brief:
*   **Clear Tool Descriptions**: Detailed and unambiguous descriptions for each tool guide the LLM in selecting the most appropriate tool for a given query, contributing to the "Correctness" of the evaluation process.
*   **Structured Tool Outputs**: The use of parser functions (`searchVectorStoreParser`, `getCvResultParser`, etc.) ensures that tool outputs are consistently formatted and easily digestible by the LLM, reducing ambiguity and improving the "Correctness" and "Code Quality & Structure" of the AI's processing.
*   **Contextual Retrieval (RAG)**: The RAG strategy ensures that the LLM has access to relevant and up-to-date information from the vector store and database, leading to more grounded responses. This directly supports the "Technical Skills Match" and "Correctness" by providing accurate context.
*   **Iterative Agent Design**: The `langgraph` based agent allows for multiple turns of reasoning and tool use, enabling the agent to refine its understanding and response, which enhances the "Correctness" and "Resilience & Error Handling" of the overall evaluation.
*   **Controlled LLM Temperature**: Setting a low LLM temperature (0.2) promotes more stable and deterministic outputs, crucial for consistent scoring across parameters like "Experience Level" and "Relevant Achievements".

### Future Improvements
*   **More sophisticated job queue**: Implement a dedicated message queue (e.g., RabbitMQ, Kafka) for handling long-running CV evaluation tasks asynchronously, providing better scalability and responsiveness.
*   **Enhanced Extractor Agent**: Improve the Extractor Agent's capabilities to handle a wider variety of CV formats and extract more nuanced information.
*   **Advanced RAG techniques**: Explore more advanced RAG techniques, such as query rewriting, hypothetical document embeddings (HyDE), or step-back prompting, to further improve retrieval accuracy and response quality.
*   **Observability**: Implement comprehensive logging, monitoring, and tracing to better understand agent behavior, debug issues, and optimize performance.
*   **User Feedback Loop**: Integrate a mechanism for users to provide feedback on evaluation results, which can be used to fine-tune the AI models and improve accuracy over time.
*   **Container Orchestration**: For production deployments, consider using Kubernetes or similar orchestration tools for managing Docker containers.
*   **Code Quality & Structure**: Continuously refactor and improve code quality, modularity, and test coverage to ensure long-term maintainability and scalability, aligning with the "Code Quality & Structure" scoring parameter.
*   **Documentation & Explanation**: Further enhance documentation, including detailed explanations of trade-offs and design choices, to improve clarity and onboarding for new developers.

## 7. (Optional) Bonus Work

*   **Telegram Bot Integration**: The project includes a dedicated `TelegramModule` to integrate with a Telegram bot, allowing users to interact with the CV evaluation platform through a conversational interface. This extends the accessibility and usability of the service beyond a traditional RESTful API.
*   **Comprehensive Authentication System**: Beyond basic user authentication, the system implements a robust authentication mechanism including:
    *   **Google OAuth2**: For seamless registration and login using Google accounts.
    *   **Password-based Authentication**: Traditional email/password login for broader user support.
    *   **JWT Refresh Tokens**: To provide persistent and secure user sessions, enhancing user experience.
*   **Docker Compose Setup**: A complete `docker-compose.yml` and `Dockerfile` are provided for easy setup and deployment of the entire application stack (NestJS app, MongoDB, ChromaDB) in a containerized environment, streamlining local development and production deployment.
