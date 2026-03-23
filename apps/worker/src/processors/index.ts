import type { AIProvider, JobType } from "@ai-dashboard/shared";

export interface ProcessorInput {
  title: string;
  description: string;
  previousOutputs?: Record<string, string>;
}

export type Processor = (
  input: ProcessorInput,
  ai: AIProvider
) => Promise<string>;

// ── Proposal processor ────────────────────────────────────────
export const proposalProcessor: Processor = async (input, ai) => {
  const prompt = `You are a senior product strategist. 
A user has an idea: "${input.title}"
Description: "${input.description}"

Write a detailed product proposal in Markdown format covering:
1. Executive Summary
2. Problem Statement
3. Proposed Solution
4. Key Features (5-8 features)
5. Target Users
6. Technical Stack Recommendations
7. Success Metrics
8. Risks & Mitigations
9. MVP Scope

Be specific, actionable, and realistic. Format with proper Markdown headers and bullet points.`;

  return ai.generate(prompt);
};

// ── Spec processor ────────────────────────────────────────────
export const specProcessor: Processor = async (input, ai) => {
  const proposalContent = input.previousOutputs?.proposal ?? "";

  const prompt = `You are a senior software architect.
Based on this product idea and proposal, generate a comprehensive technical specification as a JSON object.

Idea: "${input.title}"
Description: "${input.description}"
${proposalContent ? `Proposal Summary:\n${proposalContent.slice(0, 1500)}` : ""}

Return ONLY valid JSON (no markdown, no code blocks) with this exact structure:
{
  "projectName": string,
  "version": "1.0.0",
  "overview": string,
  "techStack": {
    "frontend": string[],
    "backend": string[],
    "database": string[],
    "infrastructure": string[]
  },
  "features": [
    {
      "id": string,
      "name": string,
      "description": string,
      "priority": "high" | "medium" | "low",
      "components": string[]
    }
  ],
  "dataModels": [
    {
      "name": string,
      "fields": [{ "name": string, "type": string, "required": boolean }]
    }
  ],
  "apiEndpoints": [
    {
      "method": string,
      "path": string,
      "description": string,
      "auth": boolean
    }
  ],
  "uiScreens": [
    { "name": string, "description": string, "components": string[] }
  ]
}`;

  const raw = await ai.generate(prompt);
  // Validate it's parseable JSON
  JSON.parse(raw);
  return raw;
};

// ── UI processor ──────────────────────────────────────────────
export const uiProcessor: Processor = async (input, ai) => {
  const specContent = input.previousOutputs?.spec ?? "";
  let specObj: Record<string, unknown> = {};
  try {
    specObj = JSON.parse(specContent);
  } catch {
    // continue without spec
  }

  const screens = Array.isArray((specObj as { uiScreens?: unknown[] }).uiScreens)
    ? (specObj as { uiScreens: { name: string }[] }).uiScreens.map((s) => s.name).join(", ")
    : "main dashboard, settings, details";

  const prompt = `You are a senior UI/UX engineer and designer.
Create a complete, beautiful, SINGLE-FILE HTML prototype for this application:

Project: "${input.title}"
Description: "${input.description}"
Key screens to include: ${screens}

Requirements:
- Single self-contained HTML file
- Use Tailwind CSS via CDN
- Include Font Awesome via CDN
- Beautiful, modern design with good typography
- Interactive (working navigation between sections, modals, buttons)
- Include realistic placeholder data
- Responsive layout
- Use a cohesive color scheme based on the app's purpose
- Include at least 2-3 navigable sections/views
- Add subtle animations and transitions

Return ONLY the complete HTML file starting with <!DOCTYPE html>. No explanation, no markdown.`;

  const html = await ai.generate(prompt);

  // Ensure it's valid HTML
  if (!html.includes("<!DOCTYPE html>") && !html.includes("<html")) {
    throw new Error("AI did not return valid HTML");
  }

  return html;
};

// ── Implementation processor ──────────────────────────────────
export const implementationProcessor: Processor = async (input, ai) => {
  const specContent = input.previousOutputs?.spec ?? "";
  const proposalContent = input.previousOutputs?.proposal ?? "";

  const prompt = `You are a senior full-stack engineer.
Based on the following idea and specifications, create a comprehensive implementation guide in Markdown.

Project: "${input.title}"
Description: "${input.description}"
${proposalContent ? `Proposal (excerpt):\n${proposalContent.slice(0, 800)}\n` : ""}
${specContent ? `Spec (excerpt):\n${specContent.slice(0, 800)}\n` : ""}

Write a detailed implementation guide covering:

# Implementation Guide: ${input.title}

## 1. Project Setup
- Repository structure
- Required dependencies (with versions)
- Environment configuration

## 2. Database Layer
- Schema definitions (SQL)
- Migration scripts
- Seed data

## 3. Backend Implementation
- API architecture
- Key service classes with code snippets
- Authentication approach
- Error handling patterns

## 4. Frontend Implementation  
- Component hierarchy
- State management approach
- Key screens with code snippets
- API integration

## 5. Testing Strategy
- Unit test examples
- Integration test approach
- E2E test scenarios

## 6. Deployment Guide
- Docker configuration
- Environment variables
- CI/CD pipeline steps
- Monitoring setup

## 7. Development Roadmap
- Phase 1 (MVP): Week 1-2
- Phase 2 (Core): Week 3-4
- Phase 3 (Polish): Week 5-6

Include actual code snippets in TypeScript/JavaScript. Be concrete and specific.`;

  return ai.generate(prompt);
};

// ── Registry ──────────────────────────────────────────────────
export const processors: Record<JobType, Processor> = {
  proposal: proposalProcessor,
  spec: specProcessor,
  ui: uiProcessor,
  implementation: implementationProcessor,
};
