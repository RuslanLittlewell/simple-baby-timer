## 1. Module Structure

- [x] 1.1 Create the `components/timeline-blocks/` folder with an entry point that preserves the existing `TimelineBlocks`, `LiveBlocks`, and `LiveBlock` exports
- [x] 1.2 Move public and shared component prop definitions into a dedicated types module
- [x] 1.3 Move all timeline-block React Native styles into a dedicated styles module without changing style values

## 2. Logic and Component Decomposition

- [x] 2.1 Extract pure session layout, visibility threshold, and stripe-count calculations into a helpers module
- [x] 2.2 Extract the shared icon, breast-side marker, title, volume, and time presentation into a block-content component
- [x] 2.3 Extract striped event rendering and completed duration-block rendering into focused components
- [x] 2.4 Move active timeline rendering into a focused live-blocks component and retain the existing public API
- [x] 2.5 Remove the original single-file module after all imports resolve through the folder entry point

## 3. Verification

- [x] 3.1 Update calendar source-presentation tests for the new ownership and preserve marker ordering, equal icon/letter sizing, baseline alignment, and bottle volume assertions
- [x] 3.2 Add focused tests for extracted pure layout helpers, including day clamping and display thresholds
- [x] 3.3 Run focused calendar tests, TypeScript validation, lint, strict OpenSpec validation, and diff checks
