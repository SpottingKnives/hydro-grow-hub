# Standardize Forms Across the App

Apply the Strain form's clean, labeled pattern to every form in the app: Environments, Parameters, Nutrients & Additives, Feed Schedules, Grow Cycles, and Plants (add-plant section).

## The standard pattern (from StrainsPage)

Every field block:
```
<div className="space-y-1.5">
  <Label htmlFor="...">Field Name {required && <span className="text-destructive">*</span>}</Label>
  <Input id="..." value=... className="bg-muted border-border" />
  {helper && <p className="text-[11px] text-muted-foreground">Helper text</p>}
</div>
```

Container: `space-y-4 mt-2` inside `<DialogContent>`.

Footer (always last): horizontal row with
- `[Delete]` ghost destructive — only when `form.id` (edit mode)
- spacer
- `[Cancel]` outline — closes dialog without saving
- `[Save]` primary gradient — submits

Edit mode: pre-fill all values, show `Last updated {date}` line above the footer when an `updated_at` exists.

No `placeholder="..."` used as the label. Placeholders only as illustrative examples (e.g. "e.g. indica, fruity") — never the only signal of what a field is.

## Reusable building block

Create `src/components/forms/FormField.tsx`:
- Props: `label`, `htmlFor`, `required?`, `helper?`, `children`
- Renders the Label/required-star/children/helper structure above
- Used everywhere to enforce consistency

Create `src/components/forms/FormFooter.tsx`:
- Props: `onSave`, `onCancel`, `onDelete?`, `saving?`, `lastUpdated?`
- Renders optional "Last updated …" line, then a row: `[Delete]` (left, only if `onDelete`), grow-spacer, `[Cancel]`, `[Save]`

These two components keep each form DRY and visually identical.

## Per-screen changes

### 1. ParametersPage
- Convert form to FormField blocks: **Name** (required), **Unit** (helper: "e.g. ppm, °C, %")
- Add Cancel + Save + Delete-in-edit footer using `FormFooter`
- Add `updated_at` to `Parameter` type and stamp it on add/update; show in edit mode

### 2. NutrientsPage
- Fields: **Name** (required), **Category** (Select), **Form** (Select; helper: "Dry uses g/L, Liquid uses ml/L")
- Add `updated_at` to `Nutrient` type; show in edit mode
- Footer with Cancel + Save + Delete-in-edit (Delete reuses existing in-use confirmation dialog)

### 3. EnvironmentsPage
- Replace inline placeholder-only inputs with labeled FormField blocks:
  - **Environment Name** (required)
  - **Site Count** (required, number; helper: "Number of plant sites this environment supports")
  - **System Description** (textarea)
  - **Supported Stages** (existing chip toggles, keep label "Supported Stages", helper: "Selecting Flower selects all 4 flower sub-stages")
  - **Parameters** (existing chip toggles, label "Parameters", helper: "Add new parameters from the Parameters page or below")
  - **Quick add parameter** (sub-section labeled, with its own mini Name/Unit/Add)
  - **Task Templates** (only in edit mode) — labeled subsection
- Add `updated_at` to `Environment` type; show in edit mode
- Standard Cancel + Save + Delete footer (Delete already exists on the card, also surface inside form for parity)

### 4. FeedSchedulesPage
Two dialogs to standardize:

a) **New / Edit Schedule dialog**
- Convert "New Feed Schedule" into a full edit dialog (currently editing happens inline via "Edit" toggle on the card; keep inline table editing but standardize the metadata dialog)
- Fields: **Schedule Name** (required), **Notes** (textarea, helper: "Optional context, growth phase, etc.")
- Add `updated_at`; show in edit mode
- Add Edit button on each schedule card to open this dialog (separate from the row-table "Edit" mode which stays as-is for tabular editing)
- Standard Cancel + Save + Delete footer

b) **Add Row dialog** ("Add Nutrient/Additive/Treatment")
- Pick mode: **Item** (Select, label, helper: "Choose an existing item from your library")
- Create-new mode: **Name** (required), **Form** (Select; helper: "Dry uses g/L, Liquid uses ml/L")
- Toggle becomes a small inline link below the field, not a placeholder
- Cancel + Add footer (no Delete here — it's a creation flow)

### 5. GrowCyclesPage — New Grow dialog
- Replace the small `<label className="text-xs">` pattern with FormField:
  - **Name Prefix** (helper: `Will be saved as: {generatedName}`)
  - **Starting Stage** (Select; helper: "Determines which environments are eligible")
  - **Estimated Flower Duration (weeks)** (number, decimals allowed)
  - **Feed Mode** (Select; helper: "Fixed = follow schedule exactly. Guided = suggest values, log actuals")
  - **Environment** (Select; helper shown when no eligible envs: "No environment supports the selected starting stage")
  - **Feed Schedule** (Select)
  - **Plants** subsection: **Strain** (Select) + **Plant Count** (number) + Add button; helper: "Plant tags will be generated as Strain-GrowName-NN"
- Footer: Cancel + Create Grow

### 6. GrowCycleDetailPage — Add Plants section
- Convert the "Add plants" inline group to FormField blocks: **Strain** (Select, required), **Quantity** (number, required, default 1)
- Helper under Quantity: "New tags will continue from the last plant index"
- Keep the Add button as the action; standard sizing

## Visual consistency tweaks

- All Inputs & Selects: `className="bg-muted border-border"` (already standard)
- All required indicators: `<span className="text-destructive">*</span>` after the label text
- Helper text: `text-[11px] text-muted-foreground` (matches StrainsPage)
- Dialog body wrapper: `space-y-4 mt-2`
- Save button: `gradient-primary text-primary-foreground` — but inside a footer row, NOT full-width anymore (full-width only when alone; with Cancel/Delete it sits in a flex row)

## Type / store changes

Add `updated_at: string` to `Parameter`, `Nutrient`, `Environment`, `FeedSchedule` interfaces in `src/types/index.ts`. Update store `add*` and `update*` actions to stamp `updated_at = new Date().toISOString()`. Bump persist version (to 9) with a migration that backfills `updated_at = created_at ?? new Date().toISOString()` for existing records.

## Out of scope

- No behavior changes to validation, saving, deletion confirmations, table editing in Feed Schedules, or stage/environment logic.
- No design-token changes (colors, typography stay as-is).
- No backend/migration changes (data is local Zustand persist).

## Files touched

- new: `src/components/forms/FormField.tsx`
- new: `src/components/forms/FormFooter.tsx`
- edit: `src/types/index.ts`
- edit: `src/store/useStore.ts` (timestamp stamping + persist migration v9)
- edit: `src/pages/ParametersPage.tsx`
- edit: `src/pages/NutrientsPage.tsx`
- edit: `src/pages/EnvironmentsPage.tsx`
- edit: `src/pages/FeedSchedulesPage.tsx`
- edit: `src/pages/GrowCyclesPage.tsx`
- edit: `src/pages/GrowCycleDetailPage.tsx` (Add plants block)
