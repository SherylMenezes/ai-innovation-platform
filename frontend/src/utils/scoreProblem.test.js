import { describe, it, expect } from "vitest";
import { scoreProblemStatement, scoreWhyAnswers, scoreHMW } from "./scoreProblem";

describe("scoreProblemStatement", () => {
  it("scores a short vague statement low", () => {
    expect(scoreProblemStatement("There is a problem.").score).toBe(10);
  });
  it("scores a detailed statement without an actor as medium", () => {
    expect(
      scoreProblemStatement(
        "Local coffee shops run out of popular menu items during weekday lunch rushes."
      ).score
    ).toBe(55);
  });
  it("scores a detailed statement with an actor as high", () => {
    expect(
      scoreProblemStatement(
        "Local coffee shop customers often can't find a table during the busy morning rush, especially students working between classes."
      ).score
    ).toBe(80);
  });
});

describe("scoreWhyAnswers", () => {
  it("scores partially filled whys proportionally", () => {
    const whys = [
      "Customers regularly order more food than they end up eating during lunch.",
      "", "", "", ""
    ];
    expect(scoreWhyAnswers(whys).score).toBe(16);
  });
  it("scores a fully filled, non-duplicate set at 100", () => {
    const whys = [
      "Customers regularly order more food than they end up eating during lunch.",
      "Portion sizes are larger than what most customers actually want to eat.",
      "The menu doesn't offer smaller portion options for lighter appetites.",
      "Staff are trained to upsell larger sizes to increase average order value.",
      "There is no incentive for staff to offer smaller, cheaper portions instead of upselling."
    ];
    expect(scoreWhyAnswers(whys).score).toBe(100);
  });
});

describe("scoreHMW", () => {
  it("penalizes closed yes/no questions", () => {
    expect(scoreHMW("Can we reduce food waste at local restaurants?").score).toBe(30);
  });
  it("gives a passing score to plain non-question text (documents the +20 floor)", () => {
    expect(scoreHMW("Reduce food waste at local restaurants").score).toBe(40);
  });
  it("scores a well-formed HMW at 100", () => {
    expect(
      scoreHMW(
        "How might we help local restaurants reduce food waste without increasing staff workload?"
      ).score
    ).toBe(100);
  });
});