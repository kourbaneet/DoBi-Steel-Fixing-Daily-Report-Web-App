# Dobi Steel Fixing Pty Ltd - Management System

Professional construction management system for Dobi Steel Fixing Pty Ltd ⚡️

## Overview

This is a comprehensive project management and team collaboration platform designed specifically for steel fixing and construction projects. The system includes role-based access control, project tracking, and team management features.

## Features

- **Role-Based Authentication**: Admin, Supervisor, and Worker roles with different access levels
- **Project Management**: Track projects, deadlines, and progress
- **Team Collaboration**: Communication tools and task assignment
- **Reporting**: Generate reports on project status and team performance
- **User Management**: Secure user registration and profile management

## Getting Started

1. **Installation**
   ```bash
   npm install
   ```

2. **Environment Setup**
   - Copy `.env.example` to `.env.local`
   - Configure your database connection
   - Set up authentication providers

3. **Database Setup**
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

## User Roles

- **ADMIN**: Full system access and user management
- **SUPERVISOR**: Project oversight and team management
- **WORKER**: Basic project participation and task completion

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: MySQL
- **Authentication**: NextAuth.js with role-based access
- **Styling**: Tailwind CSS, DaisyUI

## Support

For technical support, contact: support@dobisteel.com.au

---

© 2025 Dobi Steel Fixing Pty Ltd. All rights reserved.
