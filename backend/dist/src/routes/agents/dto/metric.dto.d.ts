export declare class IngestMetricDto {
  source: string;
  name: string;
  value: number;
  campaignId?: string;
  agentId?: string;
  dimension?: string;
  timestamp?: string;
  metadata?: Record<string, any>;
}
export declare class MetricFilterDto {
  campaignId?: string;
  agentId?: string;
  source?: string;
  dateFrom?: string;
  dateTo?: string;
  name?: string;
}
