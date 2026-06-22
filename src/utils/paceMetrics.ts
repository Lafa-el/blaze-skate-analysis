import type { PaceDistanceType, PaceMetrics } from "../types/analysis";

export interface CalculatedPaceMetrics {
  readonly paceMetrics: PaceMetrics;
  readonly totalTimeSeconds: number;
  readonly averageLapTimeSeconds: number;
  readonly fastestLapSeconds: number;
  readonly slowestLapSeconds: number;
  readonly lapTimeRangeSeconds: number;
  readonly lapTimeStdDevSeconds: number;
  readonly fadeIndexPercent: number;
}

export function calculatePaceMetrics(
  distanceType: PaceDistanceType,
  lapTimesSeconds: readonly number[],
): CalculatedPaceMetrics {
  const splitTimesSeconds = lapTimesSeconds.filter((lapTime) => Number.isFinite(lapTime) && lapTime > 0);

  if (splitTimesSeconds.length === 0) {
    throw new Error("At least one positive lap time is required.");
  }

  const totalTimeSeconds = sum(splitTimesSeconds);
  const averageLapTimeSeconds = totalTimeSeconds / splitTimesSeconds.length;
  const fastestLapSeconds = Math.min(...splitTimesSeconds);
  const slowestLapSeconds = Math.max(...splitTimesSeconds);
  const lapTimeRangeSeconds = slowestLapSeconds - fastestLapSeconds;
  const lapTimeStdDevSeconds = getStandardDeviation(splitTimesSeconds, averageLapTimeSeconds);
  const earlyAverageSeconds = getAverage(splitTimesSeconds.slice(0, Math.ceil(splitTimesSeconds.length / 2)));
  const lateAverageSeconds = getAverage(splitTimesSeconds.slice(Math.ceil(splitTimesSeconds.length / 2))) ?? earlyAverageSeconds;
  const fadeIndexPercent = earlyAverageSeconds > 0
    ? ((lateAverageSeconds - earlyAverageSeconds) / earlyAverageSeconds) * 100
    : 0;
  const consistencyScore = averageLapTimeSeconds > 0
    ? Math.max(0, 100 - (lapTimeStdDevSeconds / averageLapTimeSeconds) * 100)
    : 0;

  return {
    paceMetrics: {
      distanceType,
      totalTimeSeconds: roundMetric(totalTimeSeconds),
      splitTimesSeconds: splitTimesSeconds.map(roundMetric),
      averageSplitSeconds: roundMetric(averageLapTimeSeconds),
      earlyAverageSeconds: roundMetric(earlyAverageSeconds),
      lateAverageSeconds: roundMetric(lateAverageSeconds),
      decayPercent: roundMetric(fadeIndexPercent),
      consistencyScore: roundMetric(consistencyScore),
    },
    totalTimeSeconds: roundMetric(totalTimeSeconds),
    averageLapTimeSeconds: roundMetric(averageLapTimeSeconds),
    fastestLapSeconds: roundMetric(fastestLapSeconds),
    slowestLapSeconds: roundMetric(slowestLapSeconds),
    lapTimeRangeSeconds: roundMetric(lapTimeRangeSeconds),
    lapTimeStdDevSeconds: roundMetric(lapTimeStdDevSeconds),
    fadeIndexPercent: roundMetric(fadeIndexPercent),
  };
}

function getAverage(values: readonly number[]): number {
  return values.length > 0 ? sum(values) / values.length : 0;
}

function getStandardDeviation(values: readonly number[], average: number): number {
  const variance = getAverage(values.map((value) => (value - average) ** 2));
  return Math.sqrt(variance);
}

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function roundMetric(value: number): number {
  return Math.round(value * 100) / 100;
}
