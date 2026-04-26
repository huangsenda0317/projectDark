---
name: perf-profile
description: Structured performance profiling with bottleneck identification and optimization tasks.
---

# /perf-profile

## Purpose

Identify performance bottlenecks and generate actionable optimization tasks.

## Usage

```
/perf-profile
/perf-profile --target combat-system
```

## Workflow

### Step 1: Establish Targets
- Target FPS?
- Target memory?
- Target platform?

### Step 2: Profile
- Frame time breakdown by system
- Memory usage by asset type
- Load times

### Step 3: Identify Bottlenecks
Rank by impact:
1. [System]: Xms/frame (Y% of budget)
2. ...

### Step 4: Recommendations
For each bottleneck:
- Root cause
- Solution options
- Expected gain

### Step 5: Generate Tasks
Create optimization tasks with code locations and expected gains.

## Collaboration Protocol

- Establish targets before profiling
- Rank issues by impact, not ease of fix
- Show expected gains quantitatively
