# Repository Documentation Guide

This document explains when to update the **README** and when to update the **CHANGELOG**.

---

# README.md

The `README.md` should describe **what the project is** and **how to use it**.

Update the README when you:

- Add or remove major features.
- Change installation instructions.
- Modify setup or configuration.
- Add new dependencies users need to install.
- Change the project's architecture or workflow.
- Add new usage examples.
- Update screenshots or documentation.
- Change API usage or CLI commands.

Do **not** update the README for:

- Bug fixes
- Internal refactoring
- Performance improvements
- Minor code cleanup

Unless those changes affect how users interact with the project.

---

# CHANGELOG.md

The `CHANGELOG.md` keeps a history of notable changes between releases.

Update it whenever you:

- Add a feature
- Fix a bug
- Improve performance
- Refactor important components
- Deprecate functionality
- Remove features
- Make breaking changes

A changelog is intended to be human-readable and should summarize the most important changes.

---

# Recommended Changelog Format

```markdown
# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- New feature

### Changed
- Updated existing functionality

### Fixed
- Fixed a bug

### Removed
- Removed deprecated functionality

## [1.0.0] - YYYY-MM-DD

### Added
- Initial release
```

---

# Recommended Workflow

For every feature or bug fix:

1. Create a new Git branch.
2. Implement the changes.
3. Update tests if necessary.
4. Update documentation if needed.
5. Add an entry under the **Unreleased** section of `CHANGELOG.md`.
6. Commit your changes.
7. Open a Pull Request.
8. After the release:
   - Move the **Unreleased** entries into a versioned section.
   - Create a Git tag.
   - Publish release notes.

---

# Version Categories

Use these sections in the changelog:

## Added

New features.

## Changed

Updates to existing functionality.

## Deprecated

Features that will be removed in a future release.

## Removed

Features that have been deleted.

## Fixed

Bug fixes.

## Security

Security improvements and vulnerability fixes.

---

# Example

```markdown
# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Export reports as PDF.

### Changed
- Improved dashboard loading speed.

### Fixed
- Fixed login timeout issue.

---

## [1.2.0] - 2026-07-20

### Added
- User profile management.
- Dark mode support.

### Changed
- Redesigned settings page.

### Fixed
- Fixed incorrect date formatting.

---

## [1.1.0] - 2026-06-15

### Added
- Notification system.

### Fixed
- Resolved email validation bug.
```

---

# Best Practices

- Keep the README focused on **how to use the project**.
- Keep the CHANGELOG focused on **what has changed**.
- Write concise, user-friendly changelog entries.
- Update the changelog continuously rather than only before releases.
- Use semantic versioning (`MAJOR.MINOR.PATCH`) whenever possible.
- Tag releases in Git to match changelog versions.

---

# Recommended Repository Structure

```
my-project/
│
├── README.md
├── CHANGELOG.md
├── LICENSE
├── CONTRIBUTING.md
├── .gitignore
└── src/
```

This structure separates project documentation (`README.md`) from release history (`CHANGELOG.md`), making the repository easier to maintain and navigate.