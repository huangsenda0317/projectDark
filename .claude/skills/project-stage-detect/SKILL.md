---
name: project-stage-detect
description: Analyze project artifacts to determine current development stage.
---

# /project-stage-detect

## Purpose

Automatically detect where the project is in the development pipeline based on existing files.

## Usage

```
/project-stage-detect
```

## Detection Logic

```
if no CLAUDE.md or engine not chosen → Setup
else if no concept doc → Concept
else if no systems-index.md → Pre-Production (Ideation)
else if systems exist but not all reviewed → Pre-Production (Design)
else if no prototype code → Prototyping
else if prototype validated but no src/ → Pre-Production → Production transition
else if no sprint plans → Production (Sprint 0)
else if active sprint exists → Production (Active)
else if production code exists but incomplete → Production
else if content complete but bugs remain → Polish
else if release checklist exists → Release
```

## Output

```markdown
## Project Stage Detection

**Detected Stage:** [Stage Name]

**Evidence:**
- [Artifact 1]
- [Artifact 2]

**Next Recommended Step:**
[Action with skill/command]

**Missing for Next Stage:**
- [ ] [Item]
```

## Collaboration Protocol

- Show reasoning, not just conclusion
- Allow user to override detection
- Suggest next skill to run
