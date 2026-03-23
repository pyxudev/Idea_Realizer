import type { JobType } from "@ai-dashboard/shared";

export function buildPrompt(
  type: JobType,
  input: Record<string, unknown>
): string {
  const title = String(input.title || "");
  const description = String(input.description || "");
  const proposalText = String(input.proposal || "");
  const specText = String(input.spec || "");

  switch (type) {
    case "proposal":
      return `You are a senior product manager. Create a concise product proposal in Markdown for the following idea.

# Idea
Title: ${title}
Description: ${description}

## Required sections
1. Executive Summary (2-3 sentences)
2. Problem Statement
3. Proposed Solution
4. Key Features (bullet list, 5-8 items)
5. Target Users
6. Success Metrics
7. Risks & Mitigations
8. Estimated Timeline (simple phases)

Write in clear, professional English. Use Markdown headings and lists.`;

    case "spec":
      return `You are a senior software architect. Based on the proposal below, produce a detailed technical specification as valid JSON.

# Proposal
${proposalText}

## Output format (strict JSON, no markdown fences, no comments)
{
  "appName": "string",
  "summary": "string",
  "techStack": { "frontend": [], "backend": [], "database": "string", "infra": [] },
  "dataModels": [{ "name": "string", "fields": [{ "name": "string", "type": "string", "required": boolean }] }],
  "apiEndpoints": [{ "method": "string", "path": "string", "description": "string" }],
  "pages": [{ "name": "string", "route": "string", "components": [] }],
  "nonFunctionalRequirements": { "performance": "string", "security": "string", "scalability": "string" }
}

Return ONLY the JSON object. No explanation.`;

    case "ui":
      return `You are an expert UI/UX developer. Create a complete, beautiful, self-contained HTML file for the following application.

# Application
Title: ${title}
Description: ${description}

# Spec Summary
${specText.slice(0, 1500)}

## Requirements
- Single HTML file with embedded CSS and JavaScript
- Tailwind CSS via CDN
- Realistic demo data (not just placeholders)
- Responsive layout
- Interactive elements (tabs, modals, buttons that work)
- Professional, modern design with a clear color scheme
- Must look like a real production app

Return ONLY raw HTML starting with <!DOCTYPE html>. No markdown, no explanation.`;

    case "implementation":
      return `You are a senior full-stack engineer. Based on the specification below, write a detailed implementation guide in Markdown.

# Specification
${specText.slice(0, 2000)}

## Required sections
1. Architecture Overview
2. Project Structure (directory tree)
3. Environment Setup (prerequisites, env vars)
4. Database Setup (schema DDL)
5. Backend Implementation (key code snippets with explanations)
6. Frontend Implementation (key components)
7. API Integration
8. Deployment Guide (Docker Compose recommended)
9. Testing Strategy
10. Known Limitations & Future Improvements

Use Markdown with code blocks. Be specific and actionable.`;

    default:
      throw new Error(`Unknown job type: ${type}`);
  }
}
