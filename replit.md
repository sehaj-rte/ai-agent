# Voice Agent Web Application

## Overview

This is a voice agent web application built with React that integrates with ElevenLabs' conversational AI platform. The application provides a user-friendly interface for real-time voice conversations with AI agents, supporting both WebRTC and WebSocket connections. Users can interact with AI agents through voice input/output while monitoring conversation history and controlling audio settings.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite for build tooling
- **UI Library**: Shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling
- **State Management**: React hooks with TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Voice Integration**: ElevenLabs React SDK for conversation management

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: Session-based authentication with connect-pg-simple for PostgreSQL session storage
- **API Design**: RESTful endpoints for conversation management and ElevenLabs integration
- **Development**: Hot module replacement with Vite middleware in development mode

### Data Storage Solutions
- **Primary Database**: PostgreSQL using Neon serverless database
- **Schema Management**: Drizzle migrations with TypeScript schema definitions
- **Session Storage**: PostgreSQL-backed sessions for user authentication
- **In-Memory Fallback**: MemStorage class for development/testing scenarios

### Key Design Patterns
- **Monorepo Structure**: Shared schema types between client and server in `/shared` directory
- **Component Architecture**: Modular UI components with separation of concerns (conversation area, controls panel, message list, etc.)
- **Real-time Communication**: WebRTC and WebSocket support for low-latency voice conversations
- **Audio Management**: Comprehensive audio device selection and volume control
- **Message Persistence**: Conversation history stored in database with real-time updates

### Database Schema
- **Users**: Authentication and user management
- **Conversations**: Session tracking with agent IDs, connection types, and timestamps
- **Messages**: Conversation history with sender identification and timestamps

## External Dependencies

### Core Services
- **ElevenLabs API**: Conversational AI platform for voice agent interactions
  - WebRTC and WebSocket connection support
  - Real-time voice processing and synthesis
  - Agent management and configuration

### Development Tools
- **Neon Database**: Serverless PostgreSQL hosting
- **Replit Integration**: Development environment with cartographer and dev banner plugins

### Key Libraries
- **Frontend**: React, TypeScript, Tailwind CSS, Radix UI, TanStack Query, Wouter
- **Backend**: Express.js, Drizzle ORM, Zod validation
- **Audio**: ElevenLabs React SDK for voice conversation management
- **UI Components**: Comprehensive shadcn/ui component library for consistent design system