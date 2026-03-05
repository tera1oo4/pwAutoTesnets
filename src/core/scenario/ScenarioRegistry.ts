import type { Scenario, ScenarioId } from "../../shared/types.ts";

export class ScenarioRegistry {
  private readonly scenarios: Map<ScenarioId, Scenario>;

  constructor() {
    this.scenarios = new Map();
  }

  register(scenario: Scenario): void {
    this.scenarios.set(scenario.id, scenario);
  }

  get(id: ScenarioId): Scenario {
    const scenario = this.scenarios.get(id);
    if (!scenario) {
      throw new Error(`ScenarioNotFound: ${id}`);
    }
    return scenario;
  }

  list(): Scenario[] {
    return Array.from(this.scenarios.values());
  }
}
