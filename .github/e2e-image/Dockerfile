# The browser-test image: Playwright's image with the browsers and their system
# packages, the runner's DejaVu fonts, and Bun. CI pulls it instead of
# installing packages, which took minutes on a slow apt mirror. Without DejaVu
# the default sans-serif is a CJK font and text widths stop matching the
# runner's. CI tags it with a hash of this file, so an edit builds a new one.
FROM oven/bun:1.4.5 AS bun

# The tag must match @playwright/test in package.json: the browsers come from
# here, and the test runner only accepts the ones built for its own version.
FROM mcr.microsoft.com/playwright:v1.65.1-resolute
RUN apt-get update \
  && apt-get install -y --no-install-recommends fonts-dejavu unzip \
  && rm -rf /var/lib/apt/lists/* \
  && fc-match sans-serif | grep -q DejaVu \
  && fc-match serif | grep -q DejaVu \
  && fc-match monospace | grep -q DejaVu
COPY --from=bun /usr/local/bin/bun /usr/local/bin/bun
RUN ln -s /usr/local/bin/bun /usr/local/bin/bunx && bun --version
# GHCR links the package to the repository named here; the base image names
# microsoft/playwright, which this repository's token cannot publish under.
LABEL org.opencontainers.image.source="https://github.com/alexcatdad/purrlucent"
LABEL org.opencontainers.image.description="Playwright with DejaVu fonts and Bun, for purrlucent's browser tests"
