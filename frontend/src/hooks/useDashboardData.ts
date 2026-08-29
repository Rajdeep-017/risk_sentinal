import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useToast } from '../components/common/Toast';

// Type definitions
export interface RiskOverviewData {
  score: number;
  level: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY HIGH' | 'CRITICAL';
  velocity: number;
  momentum: number;
  exposure: number;
  confidence: number;
  domains: Record<string, number>;
}

export interface RiskVelocityData {
  day: number;
  score: number;
  financial?: number;
  customer?: number;
  operational?: number;
}

export interface RiskTimelineData {
  day: number;
  score: number;
  financial?: number;
  customer?: number;
  operational?: number;
}

export interface HeatmapData {
  x: string;
  y: string;
  value: number;
  correlation?: number;
}

export interface CascadeNode {
  id: string;
  type: string;
  description: string;
  impact: number;
  exposure: number;
  level: string;
  children?: CascadeNode[];
}

export interface RadarData {
  domain: string;
  current: number;
  predicted: number;
  threshold: number;
}

export interface AlertData {
  id: string;
  severity: string;
  title: string;
  description: string;
  timestamp: string;
  entity: string;
}

export interface ApprovalAction {
  id: string;
  level: string;
  recommendedAction: string;
  expectedImpact: string;
  confidence: number;
  reasoning: string;
  status: string;
  createdAt: string;
  category: string;
}

export function useRiskOverview() {
  return useQuery<RiskOverviewData>({
    queryKey: ['riskOverview'],
    queryFn: () => api.getOverview(),
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });
}

export function useRiskVelocity() {
  return useQuery<RiskVelocityData[]>({
    queryKey: ['riskVelocity'],
    queryFn: () => api.getVelocity(),
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });
}

export function useRiskTimeline() {
  return useQuery<RiskTimelineData[]>({
    queryKey: ['riskTimeline'],
    queryFn: () => api.getTimeline(),
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });
}

export function useRiskHeatmap() {
  return useQuery<HeatmapData[]>({
    queryKey: ['riskHeatmap'],
    queryFn: () => api.getHeatmap(),
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });
}

export function useRiskCascade() {
  return useQuery<CascadeNode>({
    queryKey: ['riskCascade'],
    queryFn: () => api.getCascade(),
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });
}

export function useRiskRadar() {
  return useQuery<RadarData[]>({
    queryKey: ['riskRadar'],
    queryFn: () => api.getPredictions(),
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });
}

export function useAlerts() {
  return useQuery<AlertData[]>({
    queryKey: ['alerts'],
    queryFn: () => api.getAlerts(),
    staleTime: 15000,
    refetchOnWindowFocus: false,
    refetchInterval: 30000,
  });
}

export function useApprovals() {
  return useQuery<ApprovalAction[]>({
    queryKey: ['approvals'],
    queryFn: () => api.getApprovals(),
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });
}

export function useApproveAction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => api.approveAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      toast.success('Action approved successfully');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to approve action');
    },
  });
}

export function useRejectAction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => api.rejectAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      toast.success('Action rejected');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to reject action');
    },
  });
}

export function useSimulate() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (params: { entity_id: string; scenario: string; parameters: Record<string, number> }) => api.simulate(params),
    onSuccess: (data) => {
      toast.success('Simulation completed');
      return data;
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Simulation failed');
    },
  });
}

export function useTriggerAssessment() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ entityId, entityType = 'customer' }: { entityId: string; entityType?: string }) => api.triggerAssessment(entityId, entityType),
    onSuccess: () => {
      toast.success('Assessment triggered');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to trigger assessment');
    },
  });
}