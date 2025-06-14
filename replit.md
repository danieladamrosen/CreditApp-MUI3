# Credit Repair Dashboard - Replit Agent Guide

## Overview

This is a sophisticated AI-powered credit repair dashboard built with React and TypeScript that helps users analyze credit reports and generate dispute letters. The application processes authentic credit data, identifies Metro 2 compliance violations, and provides an intuitive interface for credit repair workflows.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **Styling**: Hybrid approach using Tailwind CSS for utility classes and Material-UI for complex components
- **State Management**: TanStack Query for server state, React hooks for local state
- **Routing**: Wouter for lightweight client-side routing
- **Font System**: Lato font family (Credit Repair Cloud standard) throughout the application

### Backend Architecture
- **Server**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM (configured but can use in-memory storage for development)
- **API Design**: RESTful endpoints for disputes, templates, and health checks
- **Development Server**: Dedicated dev server configuration for improved debugging

### Component Design Pattern
- **Modern UI Components**: Shadcn/ui components with Radix UI primitives
- **Credit Report Components**: Specialized components for account rows, inquiries, and personal information
- **Modal System**: Comprehensive dispute workflow with multi-step forms
- **Responsive Design**: Mobile-first approach with desktop optimizations

## Key Components

### Core Credit Report Features
1. **AI-Powered Scanning**: OpenAI integration for Metro 2 compliance analysis
2. **Account Management**: Interactive account rows with dispute functionality
3. **Personal Information**: Template-based dispute generation for addresses and personal data
4. **Credit Inquiries**: Hard and soft inquiry management with dispute workflows
5. **Credit Score Visualization**: Multi-bureau score display with gauge components

### UI/UX Enhancement Features
1. **Visual Feedback System**: Instant green feedback on dispute saves with smooth animations
2. **Auto-Scroll Functionality**: Intelligent navigation between negative accounts
3. **Collapse/Expand States**: Clean section management with visual completion indicators
4. **Loading Animations**: Custom spinner with rainbow effects and mascot integration
5. **Consistent Timing**: Standardized 500ms display delays and 700ms transitions

### Dispute Management System
1. **Template Engine**: Pre-built reason and instruction templates
2. **Custom Template Creation**: User-generated dispute templates with usage tracking
3. **Status Tracking**: Comprehensive dispute lifecycle management
4. **Batch Operations**: Multi-account dispute processing capabilities

## Data Flow

### Credit Report Processing
1. **Data Loading**: JSON credit report parsing (Donald Blair test data with 55 accounts, 17 negative)
2. **AI Analysis**: OpenAI scans for Metro 2 and FCRA violations
3. **User Interaction**: Interactive dispute creation and template selection
4. **State Management**: Real-time updates with optimistic UI patterns
5. **Persistence**: Server-side storage with client-side caching

### Dispute Workflow
1. **Item Selection**: User selects negative items for dispute
2. **Template Application**: AI-suggested or user-selected dispute reasons
3. **Form Completion**: Multi-step form with validation
4. **Visual Feedback**: Immediate UI updates with smooth animations
5. **Server Sync**: Background persistence with error handling

## External Dependencies

### Core Runtime Dependencies
- React 18 ecosystem with TypeScript support
- Material-UI v7.1.0 for complex UI components
- Tailwind CSS for utility-first styling
- TanStack Query for server state management
- Drizzle ORM for database operations
- Express.js for server functionality

### AI and External Services
- OpenAI API for credit analysis (optional, can work without)
- Anthropic SDK integration (configured but not actively used)

### Development Tools
- Vite for build tooling and hot reload
- PostCSS with Tailwind CSS processing
- TypeScript compiler with strict mode
- ESBuild for server bundling

## Deployment Strategy

### Replit-Optimized Configuration
1. **Health Check Endpoints**: Multiple health check routes (`/`, `/health`, `/api/health`) for deployment platform compatibility
2. **Port Configuration**: Flexible port assignment (development: 3000, production: 5000)
3. **Build Process**: Optimized build scripts for client and server bundling
4. **Static File Serving**: Production-ready static asset serving

### Environment Configurations
1. **Development Mode**: Vite dev server with hot reload and API mocking
2. **Production Mode**: Optimized builds with static file serving
3. **Health Check Priority**: Health endpoints registered before other middleware for faster deployment validation

### Database Flexibility
- **Development**: In-memory storage for quick setup
- **Production**: PostgreSQL with connection pooling
- **Migration Ready**: Drizzle schema definitions for database evolution

## Changelog

- June 14, 2025: **Loader Mobile Centering Fix and Cleanup Complete**
  - Successfully fixed mobile loader centering by completely redesigning with modern flexbox approach
  - Replaced complex absolute positioning with simple Tailwind CSS flexbox centering
  - Cleaned up all old loader components and CSS classes (warp-loader, orbit-ring, ldio-ripple, growing-rings-loader)
  - Implemented clean component structure: fixed inset-0 container with flex items-center justify-center
  - Used precise Tailwind sizing (w-24 h-24 for 96px Cloudy images) within w-32 h-32 container
  - Loader now displays perfectly centered on all devices including mobile, desktop, and tablet
  - Maintained simple, clean RippleLoader with Cloudy mascot and winking animation
- June 14, 2025: **MILESTONE - Connected Header Design Implementation Complete**
  - Successfully implemented seamless visual connection between white header and first account card
  - Added CSS specificity solutions with dedicated classes and !important declarations
  - Created comprehensive backup preserving stable state (BACKUP_POINT_20250614_010900.md)
  - GitHub repository synchronized with complete project state preservation
  - All core functionality verified working: disputes, AI scanning, visual feedback, data persistence
- June 14, 2025: Created unified red-outlined negative accounts section with connected header design
  - White header box with red outline on top and sides only (no bottom border)
  - First pink account card has square top corners connecting seamlessly with header
  - Subsequent pink accounts maintain full rounded corner styling
  - Eliminated visual gap between header information and first account card
  - Creates cohesive, connected appearance for entire negative accounts section
- June 14, 2025: Fixed white screen delay before Cloudy loader appears
  - Added matching gradient background to body element in index.html
  - Eliminated jarring white screen during initial page load
  - Provides seamless blue-to-purple gradient transition from page start to Cloudy animation
  - Improved overall user experience with immediate visual feedback
- June 13, 2025: Simplified green completion box text and fixed section collapse choreography
  - Removed "Inquiry", "Account", and "Public record" words from bold text in green completion boxes
  - Now shows cleaner text: "X disputes saved", "X Disputes Completed", etc.
- June 13, 2025: Fixed section collapse choreography for both Hard Inquiries and Credit Accounts
  - Fixed "Select All Score-Impact Items" button to auto-scroll to dispute section after selection (both direct and through warning dialog)
  - Fixed Hard Inquiries section to collapse visibly at top of screen instead of off-screen
  - Fixed Credit Accounts section to collapse visibly at top of screen instead of off-screen
  - Enhanced choreography for both sections: Save → Green → 1 second wait → Scroll to top → Visible collapse → Scroll to next section 20px above
  - Removed internal collapse mechanism completely from modern-inquiries.tsx component
  - Both sections now provide clean, visible collapse experience matching Public Records pattern
  - Auto-scroll works in both scenarios: direct selection and proceeding through warnings
- June 13, 2025: Enhanced public records UI and completed dispute data restoration functionality
  - Replaced informational text with up arrow when all public records are saved but expanded (both desktop and mobile)
  - Added useful dispute reason display for individually saved public records (shows "Dispute: [reason]" instead of generic "Dispute Saved")
  - Reduced excessive spacing in saved public records by adjusting padding from p-4 to p-2
  - All sections now preserve complete dispute data (reason, instruction, violations) when collapsed/reopened
  - Fixed TypeScript compilation errors for enhanced dispute data storage system
  - Implemented intelligent re-save behavior: individual re-saves only collapse that specific item, preventing unwanted section-wide collapse
  - Added green heading with checkmark when all public records are saved (even when expanded)
  - Enhanced save detection logic to work with dispute objects instead of boolean values
  - Final UX decision: Re-saving individual items only collapses that specific item (better than full section collapse)
  - Save tracking implemented to distinguish new saves vs re-saves for proper behavior differentiation
- June 13, 2025: Implemented comprehensive save functionality improvements across all components
  - Applied auto-typing protection to Inquiries, Personal Information, and Account Row components
  - Enhanced all save functions to detect active typing states and force completion of full text
  - Implemented pattern detection for all dispute types to ensure complete instruction text preservation
  - Added dual-layer protection: useEffect restoration for reopened sections + save-time completion
  - All form fields across all sections now preserve complete content regardless of save timing
  - Added re-save choreography: clicking save on already saved disputes maintains green appearance AND triggers collapse/scroll
  - Comprehensive solution ensures no text truncation during auto-typing animations in any component
  - Consistent workflow behavior across all sections: save → green state → collapse → scroll to next section
- June 13, 2025: Fixed inquiry dispute instruction text truncation issue
  - Resolved 26-character limit that was cutting off instruction text during save/restore process
  - Implemented proper useEffect pattern to restore full instruction text without infinite re-renders
  - Added detection logic to identify truncated text and restore complete instructions
  - All form fields now preserve full text content without character limits
- June 13, 2025: Created comprehensive backup BACKUP_POINT_20250613_194300.md capturing stable project state
- June 13, 2025: Enhanced inquiry warning system with red/amber color coding
  - Red accents for all warnings that can hurt credit score (recent and older inquiries matching open accounts)
  - Amber accents only for informational warnings with no score impact
  - Dynamic headlines: "WARNING" for critical alerts, "No Score Impact" for informational
  - Simplified dual warning text for older inquiries matching open accounts
- June 13, 2025: Added horizontal divider below "More Details" toggle in negative accounts
  - Light grey divider stays visible in both collapsed and expanded states
  - Provides consistent visual separation for negative account sections
- June 13, 2025: Removed horizontal grey separator line above "Show More/Show Less" toggle in Credit Summary
- June 13, 2025: Standardized spacing across all section headings
  - All major sections now use consistent mb-12 mt-12 spacing for uniform visual rhythm
  - Fixed Credit Scores section spacing to match other sections
- June 13, 2025: Repositioned instructional text for Personal Information section
  - Moved "Removing old personal info tied to bad accounts helps for deleting them" to align right of main "Personal Information" heading
  - Text now appears at section level rather than within component for better visual hierarchy
- June 13, 2025: Updated auto-typing default text to generic version that works for all personal information types
  - Reason: "This personal information is incorrect"
  - Instruction: "Please remove this incorrect information from my credit report immediately"
  - Auto-typing now triggers for any personal information selection (not just addresses)
- June 13, 2025: Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.