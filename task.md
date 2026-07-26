# Task: Final Improvements (Phases B, C, D)

## Option B: Auto Kanbans in Supabase
- [x] Create `kanbans_automaticos` table in Supabase <!-- id: 9 -->
- [x] Create `autoKanbanService.js` <!-- id: 10 -->
- [x] Update `useAppStore.js` to wire Supabase CRUD for Auto Kanbans <!-- id: 11 -->
- [x] Update `ConfigSettings.jsx` to use async handlers <!-- id: 12 -->

## Option C: Rendimento Dashboards
- [x] Polish `Estoque.jsx` rendimento visual representation <!-- id: 13 -->
- [x] Ensure historical data from Supabase is used for calculations <!-- id: 14 -->

## Option E: SaaS Readiness (Commercial)
- [x] Implement Sign-up flow (Email + Company Name) <!-- id: 19 -->
- [x] Implement Company Creation logic in `useAuthStore` <!-- id: 20 -->
- [x] Implement Team Management UI (List users + Change roles) <!-- id: 21 -->
- [x] Add "Company Invite Code" system for easy onboarding <!-- id: 22 -->

## Phase F: UX & Persistence Improvements
- [x] Implement "Edit O.S." modal in Kanban details <!-- id: 23 -->
- [x] Persist "A fazer" column custom order in Supabase <!-- id: 24 -->
- [x] Fix high-priority bugs from code review <!-- id: 25 -->
- [x] Implement complete client editing UI/UX <!-- id: 26 -->

## Phase G: Multi-Setup & Extra Time
- [x] Implement `ExtraSetupModal.jsx` for additional setup/cut time <!-- id: 27 -->
- [x] Logic in `Board.jsx` to intercept move-back to Set-up <!-- id: 28 -->
- [x] Update time summation logic in store/services <!-- id: 29 -->
- [x] Integrate "Calculadora de Tempo" into Multi-Setup modal <!-- id: 32 -->

## Phase H: Alert Polish
- [x] Refine "Delayed" alert to exclude same-day deadlines <!-- id: 30 -->
- [x] Implement "Today" alert for items due same day <!-- id: 31 -->

## Phase I: Batch Production (Option 3)
- [x] Support `quantidade` and `quantidade_concluida` in database <!-- id: 33 -->
- [x] Update `CalculadoraTempoModal.jsx` with part multiplier <!-- id: 34 -->
- [x] Update `NovaOSForm.jsx` to support quantity field <!-- id: 35 -->
- [x] Show progress counter on Kanban cards <!-- id: 36 -->
- [x] Add `+1` quick action for completed parts <!-- id: 37 -->
- [x] Sync quantity between form and calculator <!-- id: 38 -->
- [x] Allow paused OS to share machine in Board.jsx <!-- id: 39 -->
- [x] Fix batch counter display and sync bug <!-- id: 40 -->
- [x] Add "Entrada de outra o.s" to pause reasons <!-- id: 41 -->
- [x] Persist pause metadata (start time, reason) to DB <!-- id: 42 -->
- [x] Ensure "unpause" works even after page reload <!-- id: 43 -->
- [x] Add total quantity editing in EditOSModal and inline in Details <!-- id: 44 -->
- [x] Update resume modal text to "Deseja Retomar o Processo?" <!-- id: 45 -->
- [x] Fix "undefined" in titles and standardized snake_case/camelCase fallbacks <!-- id: 46 -->
- [x] Hide pause button in terminal columns (A fazer/Concluído) <!-- id: 47 -->
- [x] Add direct pause controls in batch rows and details modal <!-- id: 48 -->
- [x] Block O.S. resume if machine is already occupied <!-- id: 49 -->
- [x] Simplify resume modal UI (remove caps, reason info) <!-- id: 50 -->
- [x] Remove text labels from batch pause/resume buttons in Card <!-- id: 51 -->
- [x] Implement professional dark-themed scrollbar <!-- id: 52 -->
- [x] Final batch UI cleanup (remove duplicate pause, +/- buttons, and %) <!-- id: 53 -->
- [x] Optimize Kanban scrolling (Single scroll + Sticky Headers) <!-- id: 54 -->
- [x] Fix sticky headers ignoring padding and intermediate containers <!-- id: 55 -->
- [x] Unify scroll architecture for reliable sticky behavior <!-- id: 56 -->
- [x] Synchronize column heights for uniform sticky headers (fix "Em Corte" moving) <!-- id: 57 -->
- [x] Optimize Kanban column widths and gaps for better screen fit <!-- id: 58 -->
- [x] Fix mobile layout issues (restore horizontal scroll context and stabilize viewport) <!-- id: 59 -->
- [x] Transform mobile UI to app-like (BottomNav, Scroll Snapping, No scrollbars) <!-- id: 60 -->
- [x] Fix critical black screen crash (restore React hooks and data fetching) <!-- id: 61 -->
- [x] Refine mobile proportion (Snap-center + w-[85vw] for symmetrical cards) <!-- id: 62 -->
- [x] Mobile App Stage-Tab Redesign (One column at a time) <!-- id: 63 -->
- [x] Mobile UI Refinement (Zero Horizontal Scroll) <!-- id: 68 -->
    - [x] Wrap/Stack Stage Buttons in `Board.jsx` <!-- id: 69 -->
    - [x] Centralize Kanban stages on mobile viewport <!-- id: 70 -->
    - [x] Redesign `Registros.jsx` for mobile (Card-based instead of table) <!-- id: 71 -->
    - [x] Verify zero horizontal scroll across all mobile views <!-- id: 72 -->
- [x] Fix mobile sticky overlap (adjust offsets and add vertical buffer) <!-- id: 73 -->
- [x] Restore "New OS" button on mobile (Floating Action Button) <!-- id: 74 -->
- [x] Fix "White Screen of Death" on mobile (missing prop destructuring) <!-- id: 80 -->
- [x] Restore Desktop Sticky Header (Unified Scrolling) <!-- id: 81 -->
- [x] Mobile Sequential Movement (Next/Prev Buttons) <!-- id: 75 -->
    - [x] Update `Column.jsx` to pass stage order context <!-- id: 76 -->
    - [x] Implement context-aware Next/Prev buttons in `Card.jsx` (mobile-only) <!-- id: 77 -->
    - [x] Handle transition modal logic for sequential moves <!-- id: 78 -->
    - [x] Verify vertical spacing and visual hierarchy <!-- id: 79 -->

## Phase J: Kanban Automático Refinement
- [x] Add Machine field to Auto Kanban configuration <!-- id: 82 -->
    - [x] Update `autoKanbanService.js` to support `maquina_nome` <!-- id: 83 -->
    - [x] Update `useAppStore.js` to handle machine in logic and OS generation <!-- id: 84 -->
    - [x] Add machine selector to `ConfigSettings.jsx` form <!-- id: 85 -->
    - [x] Display machine in the active routines list <!-- id: 86 -->

## Phase K: Client Enhancements & Fixes
- [x] Fix infinite loading in mobile quick-registration <!-- id: 87 -->
    - [x] Robust error handling in `NovaOSForm.jsx` <!-- id: 88 -->
    - [x] Verify `addCliente` return values <!-- id: 89 -->
- [x] Implement Client Info / Stats view <!-- id: 90 -->
    - [x] Create `fetchClientStats` in `osService.js` <!-- id: 91 -->
    - [x] Add client details modal to `Clientes.jsx` <!-- id: 92 -->
    - [x] Display registration date and OS counts by period <!-- id: 93 -->

## Phase L: UI & Mobile Fixes
- [x] Fix mobile logout button interaction <!-- id: 94 -->
    - [x] Increase Sidebar z-index to avoid overlapping with MobileNav <!-- id: 95 -->
    - [x] Use dynamic viewport height (dvh) for Sidebar <!-- id: 96 -->
    - [x] Add padding-bottom to Sidebar footer <!-- id: 97 -->

## Phase M: Login Enhancements
- [x] Add "Show Password" toggle to Login page <!-- id: 98 -->
    - [x] Import `Eye`/`EyeOff` icons in `Login.jsx` <!-- id: 99 -->
    - [x] Add `showPassword` state <!-- id: 100 -->
    - [x] Implement toggle button in UI <!-- id: 101 -->

## Phase N: Operator Login & RLS Fixes
- [x] Diagnose and fix operator data visibility <!-- id: 102 -->
    - [x] Update `useAuthStore.js` signup logic (no ghost factories) <!-- id: 103 -->
    - [x] Update `supabase_schema.sql` with correct RLS policies <!-- id: 104 -->
    - [x] Verify multi-tenant data isolation <!-- id: 105 -->

## Phase O: UI Branding & Identity
- [x] Display company name in UI Header <!-- id: 106 -->
    - [x] Update `useAuthStore.js` to fetch `nome_fantasia` <!-- id: 107 -->
    - [x] Implement branding badge in `Header.jsx` <!-- id: 108 -->

## Phase P: Supply Exchange Menu Fix
- [x] Fix empty supply menu in `PauseModal.jsx` <!-- id: 109 -->
    - [x] Correct iteration over `estoque` array <!-- id: 110 -->
    - [x] Correct iteration over `maquinas` array <!-- id: 111 -->
    - [x] Verify data binding in Select inputs <!-- id: 112 -->

## Phase Q: Performance & Fluidity
- [x] Granular Realtime Updates in `useAppStore.js` <!-- id: 113 -->
- [x] Optimistic UI for drag-and-drop and transitions <!-- id: 114 -->
- [x] Selective Rendering with `React.memo` and Selectors <!-- id: 115 -->
- [x] Mobile-specific scroll and render optimizations <!-- id: 116 -->
- [x] Contextual Bottom Nav for Kanban Stages <!-- id: 117 -->
- [x] Colored Icons in Mobile Navigation <!-- id: 118 -->
- [x] Fixed Mobile Logout Accessibility <!-- id: 119 -->
- [x] Fixed Sidebar & Page Header Alignment Inconsistency <!-- id: 120 -->
- [x] Audited and Verified Time Tracking Logic (Phases, Pauses, Lead Time) <!-- id: 121 -->
- [x] Explained Batch Production & Time Generation Logic <!-- id: 123 -->
- [x] Add Inspection Time to AcompanhamentoModal UI <!-- id: 122 -->
- [x] Refine Active Pause Visibility in History Table <!-- id: 124 -->
- [x] Implement Batch Splitting Logic (Split OS) <!-- id: 125 -->
    - [x] Create SplitModal component <!-- id: 126 -->
    - [x] Add `parent_id` and visual indicators to cards <!-- id: 127 -->
    - [x] Implement store split action <!-- id: 128 -->
- [x] Implement Scrap Reason (Motivo do Refugo) <!-- id: 129 -->
    - [x] Add textarea to AfericaoModal <!-- id: 130 -->
    - [x] Display reason in AcompanhamentoModal <!-- id: 131 -->
    - [x] Update database schema for `motivo_refugo` <!-- id: 132 -->
- [x] Standardize OS Deletion (Permanent button) <!-- id: 133 -->
    - [x] Remove stage restrictions in AcompanhamentoModal <!-- id: 134 -->
    - [x] Verify delete handler in Board.jsx <!-- id: 135 -->
- [x] Improve Scrap Reason UI Visibility <!-- id: 136 -->
    - [x] Create dedicated alert box in AcompanhamentoModal <!-- id: 137 -->
    - [x] Add reason to Card.jsx front view <!-- id: 138 -->
    - [x] Relocate reason to details modal grid (right of times) <!-- id: 139 -->
- [x] Modernize Login UI & Branding <!-- id: 151 -->
    - [x] Create modern logo concept (SVG) <!-- id: 152 -->
    - [x] Redesign `Login.jsx` with glassmorphism and premium effects <!-- id: 153 -->
    - [x] Finalize logo integration/refinement (Trend Line + Wire) <!-- id: 154 -->
    - [x] Unify logo in Application Header <!-- id: 155 -->
    - [x] Integrate logo into Sidebar Footer <!-- id: 156 -->
    - [x] Replace "Scissors" icon with Logo in Mobile "Corte" stage <!-- id: 157 -->
- [x] Implement PWA Support (Installable App) <!-- id: 158 -->
    - [x] Generate high-res app icons (SVG + PNG Fallback) <!-- id: 159 -->
    - [x] Create `manifest.json` with official branding <!-- id: 160 -->
    - [x] Update `index.html` with PWA meta-tags <!-- id: 161 -->
    - [x] Ensure 100% icon consistency with the official logo <!-- id: 162 -->
    - [x] Integrate logo into Sidebar Footer <!-- id: 156 -->
    - [x] Replace "Scissors" icon with Logo in Mobile "Corte" stage <!-- id: 157 -->

## Phase R: QR Code Operator Onboarding
- [x] Implement public `/join/:inviteCode` page <!-- id: 163 -->
- [x] Create `JoinCompany.jsx` with simplified name-only registration <!-- id: 164 -->
- [x] Add RLS policy to allow public inserts in `operadores` with valid company ID <!-- id: 165 -->
- [x] Display QR Code/Invite Link in Admin Dashboard (ConfigSettings) <!-- id: 166 -->
- [x] Verify operator addition to the "registros" list <!-- id: 167 -->

## Phase R.2: Secure Onboarding (PIN Protection)
- [x] Add `pin_onboarding` column to `configuracoes_empresa` <!-- id: 168 -->
- [x] Implement PIN management in `ConfigSettings.jsx` <!-- id: 169 -->
- [x] Implement PIN verification in `JoinCompany.jsx` <!-- id: 170 -->
- [x] Verify deployment/sync issue (User see old UI) <!-- id: 171 -->
- [x] Create `vercel.json` to fix 404 routing error <!-- id: 175 -->

## Phase R.3: Absolute Security (Server-side)
- [x] Implement `registrar_operador_com_pin` RPC in Supabase <!-- id: 172 -->
- [x] Migrate `JoinCompany.jsx` to RPC call and block direct inserts <!-- id: 173 -->
- [x] Verify industrial-level data protection <!-- id: 174 -->
- [x] Refined the success screen in `JoinCompany.jsx` for better UX mobile <!-- id: 176 -->
- [x] Added fallback "Go to Login" button in Onboarding success <!-- id: 177 -->

## Phase R.4: Unified Operator Management
- [x] Unified operator management in `ConfigSettings.jsx` (Manual + Link) <!-- id: 178 -->
- [x] Fixed syntax errors and tag duplication in `ConfigSettings.jsx` <!-- id: 179 -->

## Phase S: Shared Terminal Login & RBAC
- [x] Implement `loginComoOperador` in `useAuthStore.js` <!-- id: 182 -->
- [x] Refactor `JoinCompany.jsx` for PIN-only login <!-- id: 183 -->
- [x] Implement RBAC in `App.jsx` (Block views) <!-- id: 184 -->
- [x] Hide restricted menu items in `Sidebar.jsx` <!-- id: 185 -->
- [x] Hide restricted menu items in `MobileNav.jsx` <!-- id: 186 -->
- [x] Verify operator permissions for tool changes <!-- id: 187 -->

## Phase T: Recovery & Connectivity Fix
- [x] Fix `VITE_SUPABASE_ANON_KEY` in `.env` <!-- id: 188 -->
- [x] Fix missing `useAuthStore` import in `JoinCompany.jsx` <!-- id: 191 -->
- [ ] Ensure `verificar_pin_onboarding` RPC is created in Supabase <!-- id: 189 -->
- [ ] Test Shared Login flow again (Ask user for hard reload) <!-- id: 190 -->

## Option D: Final Walkthrough
- [/] Update `walkthrough.md` with recovery steps <!-- id: 180 -->
- [ ] Final acceptance test <!-- id: 181 -->
