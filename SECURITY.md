# Security policy

## Supported versions

Security fixes go into the latest release only. Upgrade to it to get them.

## Verify a release

Each version on npm is published by the [release workflow](.github/workflows/release.yml) through npm trusted publishing: no npm token exists, and each version carries a provenance statement that names the commit and workflow run that built it. Run `npm audit signatures` in a project to check the registry signatures and provenance of its installed packages. A purrlucent version without a provenance statement, other than 0.27.0, was not published by that workflow; report it as below.

## Report a vulnerability

Report it privately through [GitHub's private vulnerability reporting](https://github.com/alexcatdad/purrlucent/security/advisories/new). Do not open a public issue.

Include the version, the component, the steps to reproduce and what an attacker could do. You will get a reply on the advisory, and a fix is released as a new version with a note in the changelog.
