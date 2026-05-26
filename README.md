# KL HIRE Dashboard - Interview Management System (IMS)

An admin-controlled recruitment workflow platform designed to manage the end-to-end interview process — from resume upload through AI parsing, video bot screening, technical scheduling, and report generation.

## 🚀 System Overview

The IMS operates as a secure, admin-exclusive pipeline. Candidates never log in or access the system directly. Instead, they interact with the platform via time-limited, secure links sent via email (SMTP).

```
Resume Upload ──> AI Parsing ──> Candidate Form (Email Link) ──> AI Video Bot ──> Technical Interview ──> Evaluation Report
```

## 📂 Project Structure

This repository contains:
*   **/app**: The React + Vite client-side admin dashboard application.
*   **/enterprise-app**: The Next.js enterprise-ready application implementation.
*   **/ATS - Data extract Open AI**: AI-powered resume and data parsing tools.
*   `IMS_Software_Requirements_Specification.docx` & `ims_specs.txt`: Complete Software Requirements Specification (SRS).

## 🛠️ Features

1.  **Admin Authentication**: Secure login portal with role-based access control, account locking, and session expirations.
2.  **Dashboard Analytics**: Real-time widgets tracking candidates, parsed resumes, forms, screening, and evaluations.
3.  **Resume Upload & AI Parsing**: Multi-file drag-and-drop support with automatic parser extracting candidate info.
4.  **SMTP-based Form Dispatch**: Unique, time-limited candidate forms generated and distributed securely.
5.  **Mandatory Video Bot Screening**: Automated video, audio, and screen monitoring (all required and monitored).
6.  **Technical Interview Scheduler**: Calendar integrations, multi-panelist selection, and automatic notification dispatch.
7.  **Evaluation Reports**: Comprehensive candidate performance aggregation with secure PDF generation and sharing features.

## ⚙️ Development Setup

### Admin Dashboard (React + Vite)
```bash
cd app
npm install
npm run dev
```

### Enterprise App (Next.js)
```bash
cd enterprise-app
npm install
npm run dev
```
