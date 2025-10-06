# AVIS.src

Files: [https://drive.google.com/drive/u/1/folders/1rnCS2Uq0pwiu4vPd1H8ncdaCGmNRGI80](https://drive.google.com/drive/u/1/folders/1rnCS2Uq0pwiu4vPd1H8ncdaCGmNRGI80)

September 25, 2025 

More screenshots of AVIS in action (simulated in-browser)

![correct_frame_000047.png](AVIS%20src%2026fc3aed7a1a80d89e25c23cae375015/correct_frame_000047.png)

![correct_frame_000153.png](AVIS%20src%2026fc3aed7a1a80d89e25c23cae375015/correct_frame_000153.png)

![incorrect_frame_000035.png](AVIS%20src%2026fc3aed7a1a80d89e25c23cae375015/incorrect_frame_000035.png)

![incorrect_frame_000139.png](AVIS%20src%2026fc3aed7a1a80d89e25c23cae375015/incorrect_frame_000139.png)

Draft pipeline

![AVIS pipeline.png](AVIS%20src%2026fc3aed7a1a80d89e25c23cae375015/AVIS_pipeline.png)

September 19, 2025 

# AVIS

Automated Visual Inspection System

# Portable computer vision for high-mix, low-volume manufacturing

## Verify component configuration, markings, and surface condition in real time — using the cameras your teams already own.

[assembly_extended_3-VEED.mp4](AVIS%20src%2026fc3aed7a1a80d89e25c23cae375015/assembly_extended_3-VEED.mp4)

## Short Value Proposition

- Your Smartphone is Now a Precision Inspection System
- Inspect Complex Assemblies in Seconds, Not Minutes
- Real-Time Assembly Verification at Production Speed
- The Assembly Inspector That Never Blinks

- Automated Visual Inspection for Complex Assemblies

![Picture1.png](AVIS%20src%2026fc3aed7a1a80d89e25c23cae375015/Picture1.png)

## Longer Value Proposition

- Verify assemblies with millimeter precision using any smartphone or tablet. Get instant pass/fail decisions with complete digital documentation.
- Deploy in days, not months. No programming, no specialized hardware, no lengthy training. Just consistent, traceable quality control that scales with your production.
- Real-time verification of complex configurations. Consistent accuracy across every shift. Complete digital documentation. All through the device in your pocket.
- AI-driven visual inspection that adapts to high-mix, low-volume production. Fast to deploy, simple to use, and reliable across every operator and every shift.

## Game-Changer for HMLV Manufacturing

High-mix, low-volume production creates a unique inspection challenge: too many product variations, and not enough scale to justify traditional machine vision. Fixed-camera systems demand custom programming, fixtures, and calibration for each SKU — overhead that quickly breaks the economics of short runs. Manual inspection, meanwhile, struggles with variability and knowledge transfer across shifts.

Our approach is different. The system is **mobile-first**: it runs on smartphones and tablets, resilient to jitter, rotation, and operator movement. Inspections can happen directly at the machine, inside complex structures, or anywhere on the shop floor.

Just as importantly, it is built for **rapid retooling**. New product families are configured in less than 24 hours, and new variants in about an hour, enabled by synthetic training instead of months of sample collection. This makes automated visual inspection practical for batch runs of tens or hundreds, not just tens of thousands.

For HMLV manufacturers, it means automated inspection that finally fits the way production really works — **flexible, portable, and economically viable** across the full product mix.

## Key HMLV Inspection Challenges

- **Excessive Setup** — Tooling and calibration overhead slows short runs.
- **Knowledge Silos** — Critical expertise locked with a few senior inspectors.
- **Weak ROI** — Automation economics break down at low volumes.
- **Inconsistent Quality** — Results vary widely across shifts and teams.
- **FAI Delays** — First article checks hold up production flow.
- **Paper Burden** — Manual records and reporting drain inspection time.

## AVIS Capabilities

- Assemblies: Detects missing or extra components, incorrect orientation, and positional misalignment.
- Surface Condition: Identifies scratches, dents, paint pinholes, and coating defects.
- Markings & Text: Validates identification labels, serial numbers, and other text-based markings.

## Benefits

- Operational accuracy — Assurance that every build matches its intended configuration, reducing costly rework and escapes.
- Faster decisions — Instant accept/rework signals let teams act immediately and keep production flowing.
- Repeatable results — Uniform digital criteria ensure consistent outcomes, eliminating variability between inspectors.
- Flexible deployment — Works with iPhones and existing cameras, whether handheld for navigating inside complex assemblies or mounted for line operations.
- Proof for compliance — Automatically generates time-stamped evidence and exportable reports to meet ISO/AS9100 and customer requirements.
- Quick retooling — New part families and/or new configurations are added quickly, keeping inspection aligned with changing production.

## AVIS Highlights

- 10 mm positional accuracy
- No manual labeling
- 24-hour set-up time
- Available on iPhone
- Operates offline
- Integration with QMS and PLM

## Not another...

- pilot that never scales
- computer vision model to train from scratch
- tool locked to one product line
- multi-million $ scanning machine

Our system is powered by a **cascade of computer vision models** that work in sequence to validate assemblies. The first stage identifies and classifies individual components. The second stage aligns these findings with the expected configuration, confirming presence, position, and orientation. A final stage performs higher-order checks such as surface condition and marking validation before delivering a clear, auditable pass/fail decision.

To illustrate the principle, we use simplified geometric shapes as a stand-in for real assemblies. The system evaluates the live input against the reference pattern, flags discrepancies when elements are missing or misplaced, and recalculates a correctness score in real time once the pattern is restored.

[assembly_extended_1-VEED.mp4](AVIS%20src%2026fc3aed7a1a80d89e25c23cae375015/assembly_extended_1-VEED.mp4)

The correctness score itself is configurable. By default, it considers the presence of all required items, their dimensions, relative positions, and spacing. Sensitivity thresholds can be tailored to reflect specific tolerances and inspection criteria.

***Key steps in the validation workflow***

[https://whimsical.com/assembly1-4ynzqgYA8Z2WpdtsRCE1ap](https://whimsical.com/assembly1-4ynzqgYA8Z2WpdtsRCE1ap)

Because configuration checks are **invariant to camera angle and tilt**, the system remains flexible and mobile in the operator’s hands. This allows inspections to be carried out not only at fixed stations but also inside complex structures (such as aircraft fuselages) or directly in the field.

[assembly_extended_4-VEED.mp4](AVIS%20src%2026fc3aed7a1a80d89e25c23cae375015/assembly_extended_4-VEED.mp4)

## Specs

**Accuracy**

- Positional Tolerance: **±10 mm** for component presence and alignment checks.
- Component Size: Effective for features as small as **5 mm**.
- Assembly Size: Supports inspections of parts and assemblies up to **5 meters** in scale.
- Markings: Reliable recognition of text characters down to **3 mm** height.

**Setup Speed**

- New Part Family: Configurable in under **24 hours**.
- New Configuration: Ready in as little as **1 hour**.

**Hardware and Connectivity**

- Operates on **iPhones** and **standard HD cameras** — no specialized scanners required.
- No internet connection is required

**Integration & Compliance**

- Connects with **ERP, QMS, and PLM systems** for streamlined workflows.
- Every inspection logged with **timestamped, audit-ready records**, designed to support **ISO 9001 / AS9100** standards.

## Input Requirements

- CAD model of the assembly to be inspected
- Go-around video of the assembly if CAD is missing
- Articulated acceptance criteria
- Lighting of ~800 lux on the shop floor

## Use Case: Assemblies

In this proof-of-concept, the goal was to validate both **positional accuracy** and **surface condition** across a mix of components — screws, knobs, and brackets. The assembly was divided into zones, with each zone managed by its own validation model. Zone detection and model hand-off occur automatically, so the transition is seamless to the operator.

![photo_2025-09-10_21-00-28.jpg](AVIS%20src%2026fc3aed7a1a80d89e25c23cae375015/photo_2025-09-10_21-00-28.jpg)

For example, in Zone 2, the configuration is considered accurate when the left-side knob is present, the right-side knob is absent, the bracket with the larger hole is positioned at the bottom, and no foreign objects appear on the surface.

![Picture2.png](AVIS%20src%2026fc3aed7a1a80d89e25c23cae375015/Picture2.png)

The video below shows Zone 2 under live analysis, with the system responding immediately to intentional misplacements. Even when components were flipped, swapped, or foreign objects introduced, the deviations were detected in real time. Footage was captured using an iPhone 14 Pro.

[video3.mp4](AVIS%20src%2026fc3aed7a1a80d89e25c23cae375015/video3.mp4)

Video of the full process

[https://www.veed.io/view/14b110a7-cd4b-4bd6-b064-b4280d5f54ff?source=editor&panel=share](https://www.veed.io/view/14b110a7-cd4b-4bd6-b064-b4280d5f54ff?source=editor&panel=share)

### Accuracy Check

To illustrate tolerance handling, a simplified shape configuration was used where an error was defined as a **10 mm displacement** of one element.

![Picture4.png](AVIS%20src%2026fc3aed7a1a80d89e25c23cae375015/Picture4.png)

The video demonstrates how the system flags the configuration as incorrect once the shape is displaced, and then restores correctness once it is returned. Tighter tolerances are possible when components are more precisely defined.

[video4.mp4](AVIS%20src%2026fc3aed7a1a80d89e25c23cae375015/video4.mp4)

## Use Case: Marking

This example highlights the system’s ability to **validate factory markings**. A variation of a pipe is first detected by a dedicated model, after which the factory-applied label is read using the text recognition functionality. The detected part and its label are then cross-checked to ensure consistency.

The video below illustrates both outcomes: a **pass** when the label matches the expected specification, and a **fail** when the pipe is incorrectly marked.

[video9.mp4](AVIS%20src%2026fc3aed7a1a80d89e25c23cae375015/video9.mp4)

## Technology in Detail

The detection models are trained through a **synthetic rendering pipeline**, eliminating the need for manual labeling. This approach enables rapid adaptation, with new part families ready for inspection within 24 hours.

![gif1.gif](AVIS%20src%2026fc3aed7a1a80d89e25c23cae375015/gif1.gif)

Configuration validation models are trained **directly on the shop floor**. Operators demonstrate both correct and incorrect configurations, allowing the system to learn real-world variations and tolerance limits through repeated examples.

[video7.mp4](AVIS%20src%2026fc3aed7a1a80d89e25c23cae375015/video7.mp4)

[video8.mp4](AVIS%20src%2026fc3aed7a1a80d89e25c23cae375015/video8.mp4)

### The system detects and flags missing or misplaced components, guiding operators to precise corrections.

![misplacement_3.gif](AVIS%20src%2026fc3aed7a1a80d89e25c23cae375015/misplacement_3.gif)

### AVIS instantly verifies correct assembly and highlights all components 
that meet template specification.

![misplacement_2.gif](AVIS%20src%2026fc3aed7a1a80d89e25c23cae375015/misplacement_2.gif)

### Real-time inspection overlays provide confidence scores and visual feedback for every step of the process.

![misplacement.gif](AVIS%20src%2026fc3aed7a1a80d89e25c23cae375015/misplacement.gif)

### AVIS identifies and alerts for foreign objects present in the assembly zone, ensuring safety and compliance.

![foreign_object.gif](AVIS%20src%2026fc3aed7a1a80d89e25c23cae375015/foreign_object.gif)

### Onboarding / POC request questionnaire

1. How are inspections performed?
Fixed station (bench or cell)
Mobile (operators moving around the assembly)
Mixed (some fixed, some mobile)
2. What digital assets are available?
Complete CAD model
CAD of selected components
2D drawings or PDFs
Photos/videos of the assembly
None
3. How well are acceptance criteria defined?
Fully defined (drawings + tolerances provided)
Partially defined (flexible by design)
Not defined
4. What is the size range of components and assemblies?
Smallest component:
<1/4"
1/4"–1"
1"
5. Complete assembly size:
<10"
10"–30"
30"
6. Which defect types should be detected? (multi-select)
Missing components
Misplaced/misaligned components
Surface defects (scratches, dents, coating issues)
Wrong/missing markings or labels
Foreign objects
Other: ________
7. What positional/offset tolerance is required?
±0.001"
±0.004"
±0.01"
Other: ________
8. Frequency and Volume of Inspections
First Article Inspection only
Batch sampling (e.g., 1 in 10 units)
100% of assemblies, inline or near-line
Other: ________