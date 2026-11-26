import "purrlucent/button";
import "../site-navigation.ts";

for (const block of document.querySelectorAll(".docs-code")) {
  const button = block.querySelector("pl-button");
  const code = block.querySelector("pre > code");
  const status = block.querySelector('[role="status"]');
  if (!button || !code || !status) continue;

  button.hidden = false;
  button.addEventListener("pl-press", async () => {
    status.textContent = "";
    try {
      await navigator.clipboard.writeText(code.textContent ?? "");
      status.textContent = "Copied to clipboard.";
    } catch {
      status.textContent =
        "Clipboard unavailable. Select and copy the code manually.";
    }
  });
}
