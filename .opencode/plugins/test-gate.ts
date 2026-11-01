import type { Plugin } from "@opencode-ai/plugin"

// Test gate (Step 5): the AI cannot quietly hand over failing tests.
// When the AI finishes (session.idle) after editing a file in tests/ or pages/, run scripts/gate.sh.
// If it fails, send the failure back to the AI so it can fix it. Gives up after MAX_FIXES rounds
// and leaves the failure visible for the human. Also keeps the .env key unreadable.

const MAX_FIXES = 2

export const TestGate: Plugin = async ({ client, $, directory }) => {
  const fixRounds = new Map<string, number>()
  let touched = false
  let running = false

  const toast = async (message: string, variant: "success" | "error" | "info") => {
    try { await client.tui.showToast({ body: { message, variant } }) } catch {}
  }

  return {
    "tool.execute.before": async (input: any, output: any) => {
      const target = String(output?.args?.filePath ?? output?.args?.command ?? "")
      if (["read", "edit", "write", "bash"].includes(input.tool) && /(^|[\/\s])\.env(\s|$)/.test(target)) {
        throw new Error("Blocked: .env holds the router key and is off limits for the AI")
      }
    },

    event: async ({ event }: any) => {
      try {
        if (event.type === "file.edited") {
          const file = String(event.properties?.file ?? "")
          if (/[\/\\](tests|pages)[\/\\]/.test(file)) touched = true
          return
        }
        if (event.type !== "session.idle") return

        const sessionID = event.properties?.sessionID
        if (!sessionID || !touched || running) return
        touched = false
        running = true

        const result = await $`bash scripts/gate.sh`.cwd(directory).nothrow().quiet()
        const output = result.stdout.toString().split("\n").slice(-40).join("\n")

        if (result.exitCode === 0) {
          fixRounds.delete(sessionID)
          await toast("Gate passed: typecheck and all tests are green", "success")
          return
        }

        const round = (fixRounds.get(sessionID) ?? 0) + 1
        fixRounds.set(sessionID, round)
        if (round > MAX_FIXES) {
          await toast(`Gate still failing after ${MAX_FIXES} fix rounds. Human needed.`, "error")
          return
        }
        await toast(`Gate failed (round ${round}/${MAX_FIXES}), sending it back to the AI`, "error")
        // Not awaited: prompt() only returns after the AI has answered, and the next idle event must find running=false.
        void client.session.prompt({
          path: { id: sessionID },
          body: {
            parts: [{
              type: "text",
              text:
                "The test gate (npm run gate) FAILED, so you are not done. Last lines of its output:\n\n" +
                output +
                "\n\nFix the cause using AGENTS.md rules: fix selectors and timing in pages/ only. " +
                "Never change an expected value, delete an assertion, or skip a test to get green. " +
                "If the app itself is wrong, stop and report it with evidence.",
            }],
          },
        }).catch((err: unknown) => toast(`Could not send the failure to the AI: ${String(err).slice(0, 100)}`, "error"))
      } catch (err) {
        await toast(`Test gate error: ${String(err).slice(0, 120)}`, "error")
      } finally {
        running = false
      }
    },
  }
}
