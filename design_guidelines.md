# Bybe IDE - Design Guidelines

## Design Approach

**Selected Approach:** Hybrid Reference + System Design
- **Primary References:** Replit IDE, VS Code Web, Cursor IDE
- **Supporting System:** Custom utility-focused design with Material Design principles
- **Rationale:** Professional development tool requiring information density, clear hierarchy, and familiar IDE patterns

## Core Design Principles

1. **Functionality First:** Every pixel serves a purpose - no decorative elements
2. **Information Density:** Maximize visible content without overwhelming
3. **Scan-ability:** Quick visual parsing of code, files, and AI responses
4. **Spatial Consistency:** Predictable component locations across sessions

---

## Typography System

**Font Families:**
- **UI Text:** Inter (Google Fonts) - Clean, highly legible for interface elements
- **Code/Terminal:** JetBrains Mono (Google Fonts) - Monospace with excellent ligature support
- **Headings:** Inter SemiBold

**Type Scale:**
- Headers/Panel Titles: text-sm font-semibold uppercase tracking-wide
- Body/Labels: text-sm 
- Code Editor: text-sm (14px base, user-adjustable 12-18px)
- Terminal Output: text-xs
- Tooltips/Meta: text-xs

---

## Layout System

**Spacing Primitives:** Tailwind units of 2, 3, 4, 6, 8
- Micro spacing (icons, badges): p-2, gap-2
- Component padding: p-4, p-6
- Panel spacing: p-6, p-8
- Large sections: py-8, py-12

**Grid Structure:**
- 3-panel layout with resizable dividers
- Left Panel (File Tree): 240px default, resizable 180-400px
- Center Panel (Editor): flex-1, minimum 400px
- Right Panel (AI/Terminal): 320px default, resizable 280-500px, collapsible

**Responsive Breakpoints:**
- Desktop (lg): Full 3-panel layout
- Tablet (md): Stack right panel below editor, keep file tree collapsible drawer
- Mobile: Single column, tabbed navigation between panels

---

## Component Library

### Navigation & Header
**Top Bar (h-14):**
- Logo + Project name (left)
- Active file breadcrumb (center)
- AI Provider selector dropdown (right)
- User avatar + settings (far right)
- Use subtle divider between sections

### File Tree Panel
**Structure:**
- Search/filter input at top
- Collapsible folder tree with indent markers
- File icons using icon library
- Right-click context menu (New File, Delete, Rename)
- Drag & drop visual indicators

**Visual Treatment:**
- Hover state: subtle background change
- Selected file: distinct background highlight
- Folder expand/collapse: chevron icons
- File type icons: use Font Awesome or Material Icons

### Code Editor (Monaco)
**Layout:**
- Line numbers (left gutter)
- Code content area
- Minimap (right gutter) - collapsible
- Bottom status bar: cursor position, file encoding, language

**Tab System:**
- Horizontal tabs above editor
- Close button on each tab
- Unsaved indicator (dot or asterisk)
- Max visible tabs: 8, overflow to dropdown menu
- Active tab: distinct background + bottom border accent

### AI Chat Panel
**Structure:**
- Provider selector dropdown at top
- Chat message history (scrollable)
- Message input at bottom with Send button
- Code blocks in messages with syntax highlighting
- Copy button on code snippets

**Message Design:**
- User messages: align right, distinct background
- AI responses: align left, alternative background
- Timestamps: small, subtle text
- Action buttons: "Apply to file", "Create new file"

### Terminal Panel
**Layout:**
- Terminal tabs if multiple sessions
- Command input/output area
- Clear terminal button
- Auto-scroll toggle

**Visual Treatment:**
- Monospace font throughout
- Scrollable output
- Command prompts clearly distinguished
- Error output: use red/warning indicators

### Settings Panel (Modal/Drawer)
**Sections:**
- Theme: Dark/Light toggle with preview
- Editor: Font size, tab size, word wrap
- AI: Default provider, API key management
- Language: Mongolian/English selector

**Layout:**
- Sidebar navigation (left)
- Settings content (right)
- Save/Cancel buttons (bottom right)

### Agent Status Indicator
**Position:** Bottom right corner or top right header
**States:**
- Idle: subtle icon
- Processing: animated spinner + progress text
- Success: checkmark animation
- Error: warning icon with message

### Modals & Overlays
**Create File/Folder Modal:**
- Centered overlay (max-w-md)
- Input field with validation
- Create/Cancel buttons

**AI Provider Setup:**
- API key input fields
- Test connection button
- Save credentials securely

---

## Interaction Patterns

**File Operations:**
- Click file: open in new tab or switch to existing
- Double-click folder: expand/collapse
- Right-click: context menu
- Drag file: visual ghost element, drop zone indicators

**AI Interactions:**
- Type message → Enter to send
- Code suggestions appear inline with "Accept/Reject" options
- Agent actions show progress notifications

**Editor Actions:**
- Cmd/Ctrl+S: save file
- Cmd/Ctrl+P: quick file finder
- Cmd/Ctrl+/: toggle comment
- Tab switching: Cmd/Ctrl+Tab

**Panel Resizing:**
- Drag divider handles between panels
- Double-click divider: reset to default width
- Collapse panel: arrow button or divider edge

---

## Visual Hierarchy

**Primary Focus:** Code editor - largest area, minimal chrome
**Secondary:** File tree and AI chat - equal visual weight
**Tertiary:** Terminal, settings, modals

**Emphasis Techniques:**
- Panel borders: subtle 1px dividers
- Active elements: 2px accent borders
- Grouping: consistent padding/spacing within panels
- Shadows: use sparingly for modals only (shadow-xl)

---

## Accessibility

- Keyboard navigation for all functions
- Focus indicators on all interactive elements
- ARIA labels on icon-only buttons
- Sufficient contrast ratios (WCAG AA)
- Resizable text in editor
- Screen reader announcements for AI/Agent actions

---

## Images

**No hero images** - This is a utility application, not a marketing site.

**Icons Only:**
- File type icons in tree
- Provider logos in selector dropdown
- User avatar placeholder
- Status indicators (success/error/loading)

Use icon libraries (Font Awesome, Material Icons, or Heroicons) via CDN for all visual indicators.

---

## Animation Guidelines

**Minimal animations only:**
- Panel resize: smooth transition (150ms)
- Tab switching: subtle fade (100ms)
- AI typing indicator: pulsing dots
- Agent status: spinner rotation
- Modal enter/exit: scale + fade (200ms)

**No animations for:** File tree expansion, editor scrolling, syntax highlighting