import type { Scenario } from "../../../shared/types.ts";

export const ConnectWalletScenario: Scenario = {
  id: "connect-wallet",
  title: "Connect wallet flow",
  async run(context) {
    context.logger.info("scenario.step", "connect wallet start", {
      runId: context.run.id
    });
    await context.page.waitForTimeout(300);
    await context.page.evaluate(() => true);
    context.logger.info("scenario.step", "connect wallet done", {
      runId: context.run.id
    });
  }
};
