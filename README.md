# Remix of Remix of Cyberpunk Portfolio Command Center

Build a comprehensive, ultra-high-performance full-stack personal portfolio and developer dashboard with a tactical cyberpunk/sci-fi HUD aesthetic, an interactive Web Audio synthesizer, an optimized canvas background, rich hacker easter eggs, and a complete password-protected admin CMS. The site is owner by Md. Nafim Muttaki and it's his portfolio which can be changed via admin panel

### 1. Visual Design & Theme Identity
- **Aesthetic**: Tactical HUD / Cyberpunk / Tech Minimalist. Clean cards with subtle borders, monospace badges, coordinates, live status pills, and tactical grid overlays.
- **Theming**: Full Dark and Light mode support with semantic theme tokens (background, surface, card, primary, accent, text, muted text, border radius, card borders). Include 40+ selectable web and monospace fonts (Geist, Geist Mono, JetBrains Mono, Inter, Space Grotesk, Fira Code, Bangla fonts).
- **Hero & Header**:
  - Tactical banner and user avatar with initials fallback.
  - Profile details: Full Name, handle/nickname, tagline, location, live GPS coordinates, and Discord presence badge (or custom cycling presence states: Coding, Listening, Idle).
  - Live clock showing UTC and local time in real-time.
  - Action buttons: Email, Copy Site Link, Theme Toggle (Sun/Moon), and Audio Player shortcut.

### 2. High-Performance Topographical Canvas Background
- A full-screen `<canvas>` featuring animated topographical contour lines, grid coordinates, and subtle radar crosshairs.
- **Extreme Low-Spec Optimization (Potato Mode)**:
  - Static grid lines and coordinate labels are drawn once to an offscreen cache canvas.
  - Dynamic contour dots are throttled to ~20 FPS with requestAnimationFrame and skip frames when offscreen or when document visibility is hidden.
  - Zero heavy CSS blur filters or repaints on scroll so low-end mobile devices run at 60 FPS without stutter.

### 3. Public Portfolio Sections (16 Dynamic Tabs)
Provide a tabbed dashboard with smooth pill navigation, keyboard shortcuts (keys 1–9 switch tabs), URL hash / remembered active tab, and smooth scrolling:
1. **About**: Personal overview, philosophy statement, custom text blocks (with full-width toggle), and customizable hardware/academics/metrics grids and lists.
2. **Links**: Curated developer, social, and gaming links with auto-detected platform icons and handles.
3. **Social**: Integrated GitHub live stats (repos, followers, bio) via public API, plus preview embeds for Instagram, Facebook, and social posts.
4. **Projects**: Showcase cards with category tags, descriptions, status badges (Live, Beta, Active, Deployed), project links, and thumbnail images.
5. **Gaming**: Game collection tracker with title, platform (PC, Console, Mobile), status (Playing, Completed, Dropped), hours logged, rating (out of 10), reviews, and favorite badges.
6. **Now (/now page)**: Current availability status, active focus, currently building, learning, reading, and watching.
7. **Resources**: Bookmarks of developer tools, documentation, libraries, and design assets categorized with links.
8. **Achievements**: Certificates, awards, competitions, issuing organizations, dates, descriptions, and verification links.
9. **Skills**: Skill groups with percentage progress bars (e.g. Frontend, Firmware, Cloud, Design) and an interactive badge pill cloud.
10. **Timeline**: Chronological career and hobby journey with milestone dates, titles, and descriptions.
11. **Goals**: Active personal and professional goals with interactive completion progress bars.
12. **Setup**: Detailed workstation rig specs, peripheral hardware, network tweaks, and developer software configuration.
13. **Album**: Creative gallery showing photos, sketches, and elevation vector art with dynamic HSL hue color accent badges.
14. **Audio / Tracks**: Built-in 8-bit chip synth / music player powered by the Web Audio API. Supports custom MP3 URLs or generates melodic synth arpeggios from frequency arrays with BPM controls, waveform generation, volume slider, shuffle, and autoplay toggle.
15. **Guestbook**: Interactive visitor message board with name, note, and timestamp.
16. **FAQ**: Accordion-style frequently asked questions and answers.

### 4. Hacker Extras, Terminal & Easter Eggs
- **Quake-Style Dropdown Terminal**:
  - Opens via keyboard hotkey (default backtick `` ` ``) or via command palette.
  - Interactive CLI supporting commands: `help`, `whoami`, `neofetch`, `ls`, `cd <tab>`, `open <link>`, `socials`, `theme <light|dark>`, `ip`, `ua`, `pgp`, `ssh`, `source`, `matrix`, `clear`, secret `sudo` easter egg response, and custom user-defined commands.
  - Custom command prompt label (e.g., `guest@naphium:~$`) and MOTD welcome banner.
- **Command Palette (<kbd>Ctrl+K</kbd> / <kbd>Cmd+K</kbd>)**: Quick search dialog to switch tabs, trigger actions, copy links, toggle theme, or launch the terminal.
- **Konami Code Matrix Rain**: Entering the Konami sequence (↑ ↑ ↓ ↓ ← → ← → B A) triggers a full-screen canvas Matrix digital rain animation with configurable katakana / binary glyphs.
- **Hacker Aesthetic Toggles**:
  - CRT scanlines overlay effect.
  - Blinking terminal underscore on user name.
  - RGB chromatic glitch effect on hover.
  - Custom green block cursor.
  - Real-time FPS counter and client hardware/network concurrency HUD.
  - DevTools console welcome banner with custom ascii styling.

### 5. Full Admin CMS & Control Panel (`/admin`)
- **Authentication**: Password-protected entry verified against a server-side `ADMIN_PASSWORD` environment variable (never exposed in client code or bundle).
- **Single Source of Truth**: All content, settings, and themes are stored in a unified JSON document with a schema merger (`mergeData`) that ensures backwards compatibility.
- **Real-Time Synchronization**: Live database persistence with Realtime subscriptions and query invalidation so updates appear instantly on all visitors' devices.
- **CMS Management Features**:
  - Tab manager: reorder tabs with up/down arrows, rename tab labels, and toggle tab visibility.
  - Granular CRUD editors for all 16 portfolio sections, with image upload / URL support.
  - Theme editor: Color pickers for dark and light modes, font family selectors, border radius slider, and card border toggle.
  - Advanced Settings: Maintenance mode (with custom offline message), announcement banner (with link), custom CSS injection, away tab title on blur (`document.title` swap), reading progress bar, disable right-click, and disable text selection.
  - Editor productivity: 50-step Undo / Redo history (<kbd>Ctrl+Z</kbd> / <kbd>Ctrl+Y</kbd>), Discard Unsaved Changes button, and Export / Import JSON backup.
  - Live split-screen or tabbed preview reflecting unsaved drafts before publishing.

### 6. Technical Stack & Architecture
- **Framework**: TanStack Start v1 (React 19) with Vite, Tailwind CSS v4, Lucide icons, and Sonner notifications.
- **Server Functions**: `createServerFn` for secure server-side admin checks and published portfolio content synchronization.
- **Database**: Backend database with a single-row content document and Realtime enabled.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ed619c7c-8fd4-432c-95b1-becfc7ea1cce).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
