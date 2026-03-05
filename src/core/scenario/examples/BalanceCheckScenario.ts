import type { Scenario } from "../../../shared/types.ts";

export const BalanceCheckScenario: Scenario = {
  id: "balance-check",
  title: "Balance check flow",
  async run(context) {
    context.logger.info("scenario.step", "balance check start", {
      runId: context.run.id
    });
    await context.page.waitForTimeout(200);
    await context.page.evaluate(() => true);
    context.logger.info("scenario.step", "balance check done", {
      runId: context.run.id
    });
  }
};
