import { IsString, IsNumber, IsOptional, IsDateString, IsObject, IsUUID } from 'class-validator';

export class IngestMetricDto {
  @IsString()
  source: string;

  @IsString()
  name: string;

  @IsNumber()
  value: number;

  @IsOptional()
  @IsUUID()
  campaignId?: string;

  @IsOptional()
  @IsUUID()
  agentId?: string;

  @IsOptional()
  @IsString()
  dimension?: string;

  @IsOptional()
  @IsDateString()
  timestamp?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class MetricFilterDto {
  @IsOptional()
  @IsUUID()
  campaignId?: string;

  @IsOptional()
  @IsUUID()
  agentId?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsString()
  name?: string;
} 