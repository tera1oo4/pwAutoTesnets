import { SCENARIO_LOG_EVENTS } from "../../shared/constants.ts";
import type { ScenarioContext, ScenarioId } from "../../shared/types.ts";
import { ScenarioRegistry } from "./ScenarioRegistry.ts";

type ScenarioEngineOptions = {
  registry: ScenarioRegistry;
};

export class ScenarioEngine {
  private readonly registry: ScenarioRegistry;

  constructor(options: ScenarioEngineOptions) {
    this.registry = options.registry;
  }

  async runById(scenarioId: ScenarioId, context: ScenarioContext): Promise<void> {
    const scenario = this.registry.get(scenarioId);
    context.logger.info(SCENARIO_LOG_EVENTS.start, "scenario start", {
      scenarioId: scenario.id,
      runId: context.run.id,
      attempt: context.run.attempt
    });
    try {
      await scenario.run(context);
      context.logger.info(SCENARIO_LOG_EVENTS.success, "scenario success", {
        scenarioId: scenario.id,
        runId: context.run.id,
        attempt: context.run.attempt
      });
    } catch (error) {
      context.logger.error(SCENARIO_LOG_EVENTS.failure, "scenario failure", {
        scenarioId: scenario.id,
        runId: context.run.id,
        attempt: context.run.attempt,
        error: String(error)
      });
      throw error;
    }
  }
}
