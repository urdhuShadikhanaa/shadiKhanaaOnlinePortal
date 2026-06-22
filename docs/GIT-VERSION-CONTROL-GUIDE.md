# Urdu Shadikhana — Git Repository Setup Guide

**Project:** OnlineReservation (Urdu Shadikhana Salesforce booking portal)  
**Project folder:** `C:\Users\PSK\Documents\OnlineReservation`  
**Audience:** Developers and admins setting up Git for the first time on Windows  
**Last updated:** June 2026

---

## Table of contents

1. [Overview](#1-overview)
2. [Install Git on Windows](#2-install-git-on-windows)
3. [Configure Git (one-time)](#3-configure-git-one-time)
4. [Initialize the local repository](#4-initialize-the-local-repository)
5. [Review files before the first commit](#5-review-files-before-the-first-commit)
6. [Create the first commit](#6-create-the-first-commit)
7. [Create a GitHub remote repository](#7-create-a-github-remote-repository)
8. [Connect local repo to GitHub](#8-connect-local-repo-to-github)
9. [Authenticate with GitHub (HTTPS or SSH)](#9-authenticate-with-github-https-or-ssh)
10. [Push code to GitHub](#10-push-code-to-github)
11. [Verify the setup](#11-verify-the-setup)
12. [Day-to-day Git workflow](#12-day-to-day-git-workflow)
13. [Branching for features and fixes](#13-branching-for-features-and-fixes)
14. [Git + Salesforce deploy workflow](#14-git--salesforce-deploy-workflow)
15. [Security rules (must read)](#15-security-rules-must-read)
16. [Clone on another computer](#16-clone-on-another-computer)
17. [Troubleshooting](#17-troubleshooting)
18. [Command quick reference](#18-command-quick-reference)
19. [Complete setup checklist](#19-complete-setup-checklist)

---

## 1. Overview

### What Git does for this project

Git saves a **history of every change** to your source code. You can:

- Go back to any previous version
- Work on new features in separate branches
- Back up code to GitHub (cloud)
- Track which version was deployed to Salesforce

### Current status

| Item | Status |
|------|--------|
| Project folder exists | Yes — `C:\Users\PSK\Documents\OnlineReservation` |
| Git repository initialized | **No** — you will create it in Section 4 |
| `.gitignore` file | Yes — already in project root |
| Remote (GitHub) | Not configured yet |

### What you will configure

```
Your PC                          GitHub (cloud)
┌─────────────────────┐         ┌─────────────────────┐
│ OnlineReservation/  │  push   │ your-repo/          │
│   .git/  (history)  │ ──────► │   main branch       │
│   force-app/        │  pull   │   (backup + share)  │
│   scripts/          │ ◄────── │                     │
└─────────────────────┘         └─────────────────────┘
```

---

## 2. Install Git on Windows

### Step 2.1 — Download

1. Open: **https://git-scm.com/download/win**
2. Download **64-bit Git for Windows Setup**
3. Run the installer (`.exe`)

### Step 2.2 — Installer options (recommended)

Use these settings during installation:

| Installer screen | Recommended choice | Why |
|------------------|-------------------|-----|
| Select Components | Keep defaults + **Git Bash** | Bash is useful for some scripts |
| Default editor | **Use Visual Studio Code** or Notepad | Easier commit message editing |
| PATH environment | **Git from the command line and also from 3rd-party software** | `git` works in PowerShell |
| HTTPS transport | **Use the OpenSSL library** | Default is fine |
| Line endings | **Checkout Windows-style, commit Unix-style** | Best for cross-platform |
| Terminal emulator | **Use MinTTY** | Default is fine |
| Default branch name | **main** | Modern standard |

Click **Install** and finish.

### Step 2.3 — Verify installation

Open **PowerShell** and run:

```powershell
git --version
```

**Expected output (example):**

```text
git version 2.47.0.windows.1
```

If you see `git is not recognized`, close and reopen PowerShell, or restart the PC.

---

## 3. Configure Git (one-time)

These settings apply to **all** Git repositories on your computer.

### Step 3.1 — Set your name and email

Git attaches this to every commit. Use your real name and the email linked to your GitHub account.

```powershell
git config --global user.name "Your Full Name"
git config --global user.email "your-email@gmail.com"
```

**Example:**

```powershell
git config --global user.name "PSK"
git config --global user.email "urdhushadikhanaa@gmail.com"
```

### Step 3.2 — Set default branch name to `main`

```powershell
git config --global init.defaultBranch main
```

### Step 3.3 — Optional but recommended settings

```powershell
# Colorful output in terminal
git config --global color.ui auto

# Remember your GitHub login (Windows Credential Manager)
git config --global credential.helper manager

# Show current branch in long status output
git config --global status.showBranch true
```

### Step 3.4 — Verify configuration

```powershell
git config --global --list
```

**Expected output includes:**

```text
user.name=Your Full Name
user.email=your-email@gmail.com
init.defaultbranch=main
```

View a single value:

```powershell
git config --global user.email
```

---

## 4. Initialize the local repository

This creates a hidden `.git` folder that stores all version history.

### Step 4.1 — Open PowerShell in the project folder

```powershell
cd C:\Users\PSK\Documents\OnlineReservation
```

Confirm you are in the right place:

```powershell
dir sfdx-project.json
```

You should see the file listed (Salesforce project marker).

### Step 4.2 — Initialize Git

```powershell
git init
```

**Expected output:**

```text
Initialized empty Git repository in C:/Users/PSK/Documents/OnlineReservation/.git/
```

### Step 4.3 — Confirm `.gitignore` exists

```powershell
dir .gitignore
```

The project already includes a `.gitignore` that excludes:

- Salesforce auth (`.sf/`, `.sfdx/`)
- `node_modules/`
- Android `build/` folders
- Secrets (`.env`, keys)
- Temporary files

**Do not delete this file.** It prevents sensitive and generated files from being committed.

### Step 4.4 — Check status (before adding files)

```powershell
git status
```

**Expected output (summary):**

```text
On branch main
No commits yet
Untracked files:
  (use "git add <file>..." to include in what will be committed)
        .forceignore
        .gitignore
        deploy/
        docs/
        force-app/
        ...
```

Red/untracked files are normal — nothing is committed yet.

---

## 5. Review files before the first commit

**Important:** Before `git add .`, make sure no secrets will be committed.

### Step 5.1 — Check for Salesforce auth folders

```powershell
Test-Path .sf
Test-Path .sfdx
```

If either returns `True`, they should **not** appear in `git status` as tracked (`.gitignore` handles this). Verify:

```powershell
git status --ignored
```

`.sf/` and `.sfdx/` should appear under **Ignored files**, not **Untracked**.

### Step 5.2 — What WILL be committed (source code)

| Folder / file | Contents |
|---------------|----------|
| `force-app/main/default/` | Apex classes, LWC, objects, permission sets |
| `manifest/` | Deploy manifest XML |
| `deploy/urdu-shadikhana/` | Deploy scripts and checklists |
| `scripts/` | PowerShell and Apex helper scripts |
| `docs/` | Documentation and screenshots |
| `package/` | Experience bundle, scratch org definition |
| `android/shadikhana-sms-gateway/` | Android app **source** (not `build/`) |
| `sfdx-project.json` | Salesforce project configuration |
| `.gitignore` | Ignore rules |
| `.forceignore` | Salesforce CLI deploy exclusions |

### Step 5.3 — What must NEVER be committed

| Item | Risk |
|------|------|
| `.sf/` or `.sfdx/` | Contains Salesforce login tokens |
| Twilio API keys in plain text files | Security breach |
| `.env` files with passwords | Security breach |
| `android/**/build/` | Large generated files, not source |
| `node_modules/` | Can be reinstalled with `npm install` |
| Android keystore (`.jks`) | App signing secret |

If you see any of these in `git status` as untracked and **not** ignored, add them to `.gitignore` before committing.

---

## 6. Create the first commit

A **commit** is a saved snapshot of your project at a point in time.

### Step 6.1 — Stage all files

```powershell
git add .
```

The `.` means "all files in this folder and subfolders" (respecting `.gitignore`).

### Step 6.2 — Review what is staged

```powershell
git status
```

**Expected:** Green text under **Changes to be committed** listing hundreds of files (Apex, LWC, docs, etc.).

To see a summary count:

```powershell
git status -s | Measure-Object -Line
```

### Step 6.3 — Create the commit

```powershell
git commit -m "Initial commit: Urdu Shadikhana Salesforce booking portal"
```

**Expected output:**

```text
[main (root-commit) a1b2c3d] Initial commit: Urdu Shadikhana Salesforce booking portal
 XXX files changed, XXXXX insertions(+)
 create mode 100644 force-app/main/default/...
 ...
```

### Step 6.4 — View commit history

```powershell
git log --oneline -3
```

**Expected:**

```text
a1b2c3d Initial commit: Urdu Shadikhana Salesforce booking portal
```

Your local Git repository is now configured. Next: back it up to GitHub.

---

## 7. Create a GitHub remote repository

A **remote** is a copy of your repository on the internet (GitHub).

### Step 7.1 — Create a GitHub account (if needed)

1. Go to **https://github.com/signup**
2. Create a free account
3. Verify your email

### Step 7.2 — Create a new empty repository

1. Log in to GitHub
2. Click **+** (top right) → **New repository**
3. Fill in:

| Field | Value |
|-------|-------|
| **Repository name** | `OnlineReservation` or `urdu-shadikhana` |
| **Description** | `Urdu Shadikhana Salesforce booking portal` |
| **Visibility** | **Private** (recommended) or Public |
| **Add a README** | **OFF** (unchecked) |
| **Add .gitignore** | **None** (we already have one) |
| **Choose a license** | **None** (optional) |

4. Click **Create repository**

### Step 7.3 — Copy the repository URL

After creation, GitHub shows setup instructions. Copy the HTTPS URL:

```text
https://github.com/YOUR_USERNAME/OnlineReservation.git
```

Replace `YOUR_USERNAME` with your actual GitHub username.

---

## 8. Connect local repo to GitHub

Run these commands in PowerShell from the project folder.

### Step 8.1 — Add the remote

```powershell
cd C:\Users\PSK\Documents\OnlineReservation

git remote add origin https://github.com/YOUR_USERNAME/OnlineReservation.git
```

Replace `YOUR_USERNAME` and repo name with yours.

### Step 8.2 — Verify remote

```powershell
git remote -v
```

**Expected output:**

```text
origin  https://github.com/YOUR_USERNAME/OnlineReservation.git (fetch)
origin  https://github.com/YOUR_USERNAME/OnlineReservation.git (push)
```

### Step 8.3 — Ensure branch is named `main`

```powershell
git branch
```

**Expected:**

```text
* main
```

If it shows `master` instead:

```powershell
git branch -M main
```

---

## 9. Authenticate with GitHub (HTTPS or SSH)

GitHub no longer accepts account passwords for `git push`. Choose **one** method below.

---

### Option A — HTTPS with Personal Access Token (recommended for beginners)

#### A.1 — Create a Personal Access Token (PAT)

1. GitHub → click your profile picture → **Settings**
2. Left menu (bottom) → **Developer settings**
3. **Personal access tokens** → **Tokens (classic)**
4. **Generate new token (classic)**
5. Settings:

| Field | Value |
|-------|-------|
| Note | `OnlineReservation Git` |
| Expiration | 90 days or No expiration |
| Scopes | Check **`repo`** (full control of private repositories) |

6. Click **Generate token**
7. **Copy the token immediately** — you will not see it again

#### A.2 — Push using the token

When you run `git push`, a login window appears:

| Field | Enter |
|-------|-------|
| Username | Your GitHub username |
| Password | **Paste the PAT** (not your GitHub password) |

Windows Credential Manager saves it for future pushes.

---

### Option B — SSH key (recommended for long-term use)

#### B.1 — Generate SSH key

```powershell
ssh-keygen -t ed25519 -C "your-email@gmail.com"
```

Press **Enter** to accept default file location (`C:\Users\PSK\.ssh\id_ed25519`).  
Optionally set a passphrase (recommended).

#### B.2 — Start SSH agent and add key

```powershell
Get-Service ssh-agent | Set-Service -StartupType Manual
Start-Service ssh-agent
ssh-add $env:USERPROFILE\.ssh\id_ed25519
```

#### B.3 — Copy public key

```powershell
Get-Content $env:USERPROFILE\.ssh\id_ed25519.pub | Set-Clipboard
```

#### B.4 — Add key to GitHub

1. GitHub → **Settings** → **SSH and GPG keys**
2. **New SSH key**
3. Title: `PSK Windows PC`
4. Paste the key → **Add SSH key**

#### B.5 — Change remote URL to SSH

```powershell
git remote set-url origin git@github.com:YOUR_USERNAME/OnlineReservation.git
```

#### B.6 — Test connection

```powershell
ssh -T git@github.com
```

**Expected:**

```text
Hi YOUR_USERNAME! You've successfully authenticated...
```

---

## 10. Push code to GitHub

### Step 10.1 — Push the main branch

```powershell
cd C:\Users\PSK\Documents\OnlineReservation
git push -u origin main
```

The `-u` flag links your local `main` branch to `origin/main` so future pushes need only `git push`.

**Expected output:**

```text
Enumerating objects: XXX, done.
Counting objects: 100% (XXX/XXX), done.
...
To https://github.com/YOUR_USERNAME/OnlineReservation.git
 * [new branch]      main -> main
branch 'main' set up to track 'origin/main'.
```

### Step 10.2 — Confirm on GitHub

1. Open your repository in the browser
2. You should see folders: `force-app`, `docs`, `scripts`, etc.
3. Click **Commits** — your initial commit should appear

---

## 11. Verify the setup

Run this verification script in PowerShell:

```powershell
cd C:\Users\PSK\Documents\OnlineReservation

Write-Host "=== Git Verification ===" -ForegroundColor Cyan
git --version
git config user.name
git config user.email
git status
git remote -v
git log --oneline -1
git branch -vv
```

**All checks should pass:**

| Check | Expected |
|-------|----------|
| `git --version` | Shows version number |
| `user.name` / `user.email` | Your configured values |
| `git status` | `nothing to commit, working tree clean` |
| `git remote -v` | Shows `origin` URL |
| `git log` | Shows initial commit |
| `git branch -vv` | `main` tracks `origin/main` |

---

## 12. Day-to-day Git workflow

After setup, use this cycle whenever you change code.

### Workflow diagram

```text
  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
  │ Edit files   │ ──► │ git add      │ ──► │ git commit   │ ──► │ git push     │
  │ (Apex, LWC)  │     │ (stage)      │     │ (save local) │     │ (backup)     │
  └──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

### Step-by-step example

You changed the SMS cleanup batch class:

```powershell
cd C:\Users\PSK\Documents\OnlineReservation

# 1. See what changed
git status
git diff force-app/main/default/classes/ShadikhanaSmsOutboundCleanupBatch.cls

# 2. Stage the changed files
git add force-app/main/default/classes/ShadikhanaSmsOutboundCleanupBatch.cls
git add force-app/main/default/classes/ShadikhanaSmsOutboundCleanupTest.cls

# Or stage everything that changed:
git add -A

# 3. Commit with a clear message
git commit -m "Update SMS cleanup CSV attachment filename with month and year"

# 4. Push to GitHub
git push
```

### Commit message guide

| Prefix | Use when | Example |
|--------|----------|---------|
| `Add` | New feature | `Add monthly SMS outbound cleanup batch` |
| `Update` | Improve existing | `Update email HTML template for SMS report` |
| `Fix` | Bug fix | `Fix batch execute method SObject signature` |
| `Docs` | Documentation only | `Add Git repository setup guide` |
| `Deploy` | Manifest/scripts only | `Update full package manifest` |

### View history

```powershell
git log --oneline -10
git log --oneline --graph --all
```

### Discard uncommitted changes (careful)

```powershell
# Undo changes to one file (before commit)
git restore force-app/main/default/classes/SomeClass.cls

# Undo all uncommitted changes
git restore .
```

### Pull latest from GitHub (if working on multiple PCs)

```powershell
git pull
```

---

## 13. Branching for features and fixes

Use branches so `main` always stays stable.

### Create a feature branch

```powershell
git checkout main
git pull
git checkout -b feature/sms-outbound-cleanup
```

Work, commit, push:

```powershell
git add -A
git commit -m "Add SMS outbound cleanup scheduler"
git push -u origin feature/sms-outbound-cleanup
```

### Merge back to main (after testing)

```powershell
git checkout main
git merge feature/sms-outbound-cleanup
git push
```

### Branch naming examples

```text
feature/booking-portal-ui
feature/android-sms-gateway
fix/email-deliverability
fix/fls-message-body
```

---

## 14. Git + Salesforce deploy workflow

Git stores code; Salesforce CLI deploys it to orgs. Both steps are separate.

### Recommended order

1. **Edit** source in `force-app/`
2. **Commit** to Git (`git add` → `git commit`)
3. **Deploy** to org (`sf project deploy`)
4. **Test** in Salesforce
5. **Push** to GitHub (`git push`)

### Deploy commands for this project

**Deploy to urdhu org (specific classes):**

```powershell
sf project deploy start `
  --source-dir force-app/main/default/classes/ShadikhanaSmsOutboundCleanupBatch.cls `
  --source-dir force-app/main/default/classes/ShadikhanaSmsOutboundCleanupTest.cls `
  --target-org urdhu `
  --test-level RunSpecifiedTests `
  --tests ShadikhanaSmsOutboundCleanupTest
```

**Delta deploy (recent changes):**

```powershell
.\deploy\urdu-shadikhana\scripts\deploy-delta.ps1 -TargetOrg urdhu -RunTests
```

**Full deploy (new org):**

```powershell
.\deploy\urdu-shadikhana\scripts\deploy-full.ps1 -TargetOrg urdhu
```

> If deploy fails with *"schedulable class has jobs pending"*, abort the schedule first:
>
> ```powershell
> sf apex run --file scripts/apex/abort-sms-cleanup-schedule.apex --target-org urdhu
> ```

### Tag a release (optional)

After a successful production deploy:

```powershell
git tag -a v1.0.0 -m "Initial production release with SMS cleanup"
git push origin v1.0.0
```

### Org aliases (not stored in Git)

| Alias | Org |
|-------|-----|
| `urdhu` | Urdu Shadikhana dev org |
| `devhub` | Scratch org creation |

List orgs: `sf org list`  
Login: `sf org login web --alias urdhu`

---

## 15. Security rules (must read)

### Never commit these

| File / folder | Why |
|---------------|-----|
| `.sf/`, `.sfdx/` | Salesforce authentication tokens |
| `.env`, `*.pem`, `*.key` | Passwords and certificates |
| Twilio tokens in plain files | API abuse risk |
| Android `.jks` / `.keystore` | App signing keys |

### If you accidentally committed a secret

1. **Rotate** the credential immediately (change password / regenerate token)
2. Remove from Git history (advanced — ask for help or use `git filter-repo`)
3. Never share the old token again

### `.gitignore` is your safety net

The project `.gitignore` already blocks common secrets. Do not remove entries from it.

---

## 16. Clone on another computer

If you get a new PC or share the project:

```powershell
git clone https://github.com/YOUR_USERNAME/OnlineReservation.git
cd OnlineReservation
sf org login web --alias urdhu
```

Then deploy as usual. Org logins are per-machine — not included in Git.

---

## 17. Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| `fatal: not a git repository` | Not inside a Git repo | `cd` to project root; run `git init` |
| `git is not recognized` | Git not installed or PATH issue | Reinstall Git; restart PowerShell |
| `Support for password authentication was removed` | Used GitHub password instead of PAT | Create PAT (Section 9A); use as password |
| `Permission denied (publickey)` | SSH key not set up | Follow Section 9B or use HTTPS |
| `failed to push some refs` | Remote has commits you don't have | `git pull --rebase origin main` then `git push` |
| `Large files detected` | Committed `node_modules` or `build/` | Add to `.gitignore`; remove from staging |
| `nothing to commit, working tree clean` | No changes since last commit | Normal — nothing to do |
| Merge conflict | Two branches edited same lines | Open file, fix `<<<<<<<` markers, `git add`, `git commit` |

### Undo last commit (not yet pushed)

```powershell
git reset --soft HEAD~1
```

Keeps your file changes; removes the commit.

### Remove file from staging (before commit)

```powershell
git reset HEAD path/to/file.cls
```

### Check if a file is ignored

```powershell
git check-ignore -v path/to/file
```

---

## 18. Command quick reference

| Task | Command |
|------|---------|
| Go to project | `cd C:\Users\PSK\Documents\OnlineReservation` |
| Check status | `git status` |
| See changes | `git diff` |
| Stage all changes | `git add -A` |
| Stage one file | `git add path/to/file` |
| Commit | `git commit -m "message"` |
| Push to GitHub | `git push` |
| Pull from GitHub | `git pull` |
| View history | `git log --oneline -10` |
| New branch | `git checkout -b feature/name` |
| Switch branch | `git checkout main` |
| List branches | `git branch -a` |
| Show remote URL | `git remote -v` |
| Stash work in progress | `git stash` |
| Restore stashed work | `git stash pop` |

---

## 19. Complete setup checklist

Print this and check off each step:

### Phase 1 — Install and configure

- [ ] Install Git for Windows from https://git-scm.com/download/win
- [ ] Verify: `git --version` works in PowerShell
- [ ] Set `git config --global user.name "Your Name"`
- [ ] Set `git config --global user.email "your@email.com"`
- [ ] Set `git config --global init.defaultBranch main`

### Phase 2 — Local repository

- [ ] `cd C:\Users\PSK\Documents\OnlineReservation`
- [ ] `git init`
- [ ] Confirm `.gitignore` exists
- [ ] `git status` — no secrets in untracked list
- [ ] `git add .`
- [ ] `git commit -m "Initial commit: Urdu Shadikhana Salesforce booking portal"`
- [ ] `git log --oneline` shows the commit

### Phase 3 — GitHub remote

- [ ] Create GitHub account (if needed)
- [ ] Create empty repository (no README, no .gitignore)
- [ ] `git remote add origin https://github.com/USER/REPO.git`
- [ ] Create PAT or SSH key (Section 9)
- [ ] `git push -u origin main`
- [ ] Confirm files visible on GitHub website

### Phase 4 — Ongoing use

- [ ] After each change: `git add` → `git commit` → `git push`
- [ ] Use feature branches for new work
- [ ] Deploy to Salesforce after committing
- [ ] Never commit `.sf/`, `.sfdx/`, or API keys

---

## Related documentation

| Document | Contents |
|----------|----------|
| [Deployment Guide](DEPLOYMENT-GUIDE.md) | Deploy to Salesforce orgs |
| [Technical Documentation](TECHNICAL-DOCUMENTATION.md) | Architecture and Apex/LWC |
| [POST-DEPLOY-CHECKLIST](../deploy/urdu-shadikhana/POST-DEPLOY-CHECKLIST.md) | Verify after deploy |

---

*End of Git Repository Setup Guide*
