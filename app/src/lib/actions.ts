/**
 * lib/actions.ts — cross-entity write operations for Step 7.
 *
 * Every function:
 *   1. Validates / assembles the new/updated row
 *   2. Persists via the relevant repository
 *   3. Writes an AuditEvent
 *   4. Returns the created/updated entity
 *
 * Analytics screens recompute live from Dexie — no invalidation needed.
 */

import {
  leadsRepo,
  clientsRepo,
  opportunitiesRepo,
  proposalsRepo,
  salesRepo,
  paymentsRepo,
  interactionsRepo,
  feedbackRepo,
  expensesRepo,
  projectsRepo,
  tasksRepo,
  marketingCampaignsRepo,
} from '@/store/repositories';
import { logAudit } from '@/lib/auditLog';
import type {
  Lead, Client, Opportunity, Proposal, Sale, Payment,
  Interaction, Feedback, Expense, Project, Task, MarketingCampaign,
  BranchKey, ServiceLine, LeadStatus, PaymentMethod, PaymentStatus,
  InteractionType, FeedbackSource, FeedbackType, ResolutionStatus,
  ExpenseCategory, TaskPriority, TaskKind,
} from '@spec/entities';

/* ─────────────────────────────────────────────────────────────────────────── *
 *  Utilities
 * ─────────────────────────────────────────────────────────────────────────── */

let _seq = Date.now();
function uid(prefix: string): string {
  return `${prefix}${String(++_seq).padStart(6, '0')}`;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/* ─────────────────────────────────────────────────────────────────────────── *
 *  Client / Lead
 * ─────────────────────────────────────────────────────────────────────────── */

export interface CreateLeadInput {
  clientId?: string;
  /** If no clientId, create a prospect client from these fields. */
  fullName?: string;
  email?: string;
  phone?: string;
  companyName?: string;
  industry?: string;
  country?: string;
  source: Lead['source'];
  branchKey: BranchKey;
  serviceLine: ServiceLine;
  assignedSalespersonId?: string;
  expectedBudget?: number;
  need?: string;
}

export async function createLead(input: CreateLeadInput): Promise<Lead> {
  let clientId = input.clientId;

  if (!clientId) {
    // Create a minimal prospect client
    const client: Client = {
      id: uid('C'),
      type: 'Lead' as any,
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      companyName: input.companyName ?? null,
      industry: input.industry ?? null,
      country: input.country ?? null,
      city: null,
      address: null,
      position: null,
      companySize: null,
      sourceAcquisition: input.source,
      acquisitionCampaign: null,
      acquisitionChannel: input.source,
      responsibleSalespersonId: input.assignedSalespersonId ?? null,
      branchKey: input.branchKey,
      serviceLine: input.serviceLine,
      branchConfidence: 'inferred',
      firstContactDate: today(),
      firstPurchaseDate: null,
      lastPurchaseDate: null,
      lastActivityDate: today(),
      status: 'Lead',
      lifetimeRevenue: 0,
      lifetimeProfit: 0,
      numberPurchases: 0,
      numberCalls: 0,
      numberMeetings: 0,
      numberMessages: 0,
      customerScore: 0,
      churnRiskScore: 0,
      consentFlag: false,
      isMerged: false,
      needsReview: false,
      sourceCount: 1,
      isSample: true,
    };
    await clientsRepo.create(client);
    clientId = client.id;
    await logAudit('client', client.id, 'create');
  }

  const lead: Lead = {
    id: uid('L'),
    clientId,
    source: input.source,
    campaign: null,
    adset: null,
    ad: null,
    dateCreated: today(),
    status: 'New' as any,
    assignedSalespersonId: input.assignedSalespersonId ?? null,
    qualificationScore: 0,
    industry: input.industry ?? null,
    branchKey: input.branchKey,
    serviceLine: input.serviceLine,
    expectedBudget: input.expectedBudget ?? null,
    need: input.need ?? null,
    lastContactDate: null,
    conversionDate: null,
    converted: false,
    isMerged: false,
    needsReview: false,
    isSample: true,
  };

  await leadsRepo.create(lead);
  await logAudit('lead', lead.id, 'create');
  return lead;
}

export async function assignLeadSalesperson(leadId: string, salespersonId: string): Promise<Lead> {
  const lead = await leadsRepo.update(leadId, { assignedSalespersonId: salespersonId });
  await logAudit('lead', leadId, 'update', { field: 'assignedSalespersonId', after: salespersonId });
  return lead;
}

export async function changeLeadStatus(leadId: string, status: LeadStatus): Promise<Lead> {
  const existing = await leadsRepo.getById(leadId);
  const lead = await leadsRepo.update(leadId, { status });
  await logAudit('lead', leadId, 'status_change', { field: 'status', before: existing?.status, after: status });
  return lead;
}

export async function dropLead(leadId: string): Promise<Lead> {
  return changeLeadStatus(leadId, 'Dropped' as any);
}

/* ─────────────────────────────────────────────────────────────────────────── *
 *  Lead → Opportunity conversion
 * ─────────────────────────────────────────────────────────────────────────── */

export async function convertLeadToOpportunity(
  leadId: string,
  salespersonId: string,
): Promise<Opportunity> {
  const lead = await leadsRepo.getById(leadId);
  if (!lead) throw new Error(`Lead ${leadId} not found`);

  // Mark lead converted
  await leadsRepo.update(leadId, { converted: true, status: 'Converted' as any, conversionDate: today() });
  await logAudit('lead', leadId, 'convert', { field: 'converted', before: 'false', after: 'true' });

  // Create opportunity
  const opp: Opportunity = {
    id: uid('OPP'),
    clientId: lead.clientId,
    salespersonId,
    branchKey: lead.branchKey,
    serviceLine: lead.serviceLine,
    valueExpected: lead.expectedBudget ?? 0,
    probability: 0.5,
    stage: 'Qualified' as any,
    createdDate: today(),
    closingDate: null,
    lostReason: null,
    wonReason: null,
    isSample: true,
  };

  await opportunitiesRepo.create(opp);
  await logAudit('opportunity', opp.id, 'create');
  return opp;
}

/* ─────────────────────────────────────────────────────────────────────────── *
 *  Opportunity actions
 * ─────────────────────────────────────────────────────────────────────────── */

export interface CreateOpportunityInput {
  clientId: string;
  salespersonId: string;
  branchKey: BranchKey;
  serviceLine: ServiceLine;
  valueExpected: number;
  stage?: Opportunity['stage'];
}

export async function createOpportunity(input: CreateOpportunityInput): Promise<Opportunity> {
  const opp: Opportunity = {
    id: uid('OPP'),
    clientId: input.clientId,
    salespersonId: input.salespersonId,
    branchKey: input.branchKey,
    serviceLine: input.serviceLine,
    valueExpected: input.valueExpected,
    probability: 0.3,
    stage: (input.stage ?? 'New Lead') as any,
    createdDate: today(),
    closingDate: null,
    lostReason: null,
    wonReason: null,
    isSample: true,
  };
  await opportunitiesRepo.create(opp);
  await logAudit('opportunity', opp.id, 'create');
  return opp;
}

export async function dropOpportunity(oppId: string, reason: string): Promise<Opportunity> {
  const opp = await opportunitiesRepo.update(oppId, {
    stage: 'Lost' as any,
    lostReason: reason,
    closingDate: today(),
  });
  await logAudit('opportunity', oppId, 'status_change', { field: 'stage', before: 'open', after: 'Lost' });
  return opp;
}

/* ─────────────────────────────────────────────────────────────────────────── *
 *  Proposal
 * ─────────────────────────────────────────────────────────────────────────── */

export interface CreateProposalInput {
  clientId: string;
  opportunityId: string;
  salespersonId: string;
  branchKey: BranchKey;
  serviceLine: ServiceLine;
  amount: number;
  discount?: number;
  estimatedDeliveryTimeDays?: number;
  pricingRef?: string;
}

export async function createProposal(input: CreateProposalInput): Promise<Proposal> {
  // Count existing versions for this opportunity
  const { rows: existing } = await proposalsRepo.list({ where: { opportunityId: input.opportunityId } });
  const version = existing.length + 1;

  const proposal: Proposal = {
    id: uid('PROP'),
    clientId: input.clientId,
    opportunityId: input.opportunityId,
    salespersonId: input.salespersonId,
    branchKey: input.branchKey,
    serviceLine: input.serviceLine,
    version,
    creationDate: today(),
    sentDate: null,
    viewedDate: null,
    expirationDate: null,
    amount: input.amount,
    discount: input.discount ?? 0,
    currency: 'DA',
    estimatedDeliveryTimeDays: input.estimatedDeliveryTimeDays ?? null,
    status: 'Draft' as any,
    rejectionReason: null,
    acceptanceDate: null,
    isSample: true,
  };

  await proposalsRepo.create(proposal);
  await logAudit('proposal', proposal.id, 'create');
  return proposal;
}

export async function updateProposalDecision(
  proposalId: string,
  accepted: boolean,
  reason?: string,
): Promise<Proposal> {
  const patch: Partial<Proposal> = accepted
    ? { status: 'Accepted' as any, acceptanceDate: today() }
    : { status: 'Rejected' as any, rejectionReason: reason ?? null };
  const proposal = await proposalsRepo.update(proposalId, patch);
  await logAudit('proposal', proposalId, 'status_change', {
    field: 'status',
    after: accepted ? 'Accepted' : 'Rejected',
  });
  return proposal;
}

/* ─────────────────────────────────────────────────────────────────────────── *
 *  Sale
 * ─────────────────────────────────────────────────────────────────────────── */

export interface RecordSaleInput {
  amount: number;
  grossFlowAmount: number;
  margin: number;
  serviceLine: ServiceLine;
  date: string;
  salespersonId?: string;
  projectId?: string;
  pricingRef?: string;
  revenueModel?: Sale['revenueModel'];
}

export async function recordSaleFromOpportunity(
  opportunityId: string,
  input: RecordSaleInput,
): Promise<Sale> {
  const opp = await opportunitiesRepo.getById(opportunityId);
  if (!opp) throw new Error(`Opportunity ${opportunityId} not found`);

  const costRatio = input.grossFlowAmount > 0
    ? 1 - input.margin / input.grossFlowAmount
    : 0.4;

  const sale: Sale = {
    id: uid('SAL'),
    clientId: opp.clientId,
    opportunityId,
    projectId: input.projectId ?? null,
    date: input.date,
    branchKey: opp.branchKey,
    serviceLine: input.serviceLine,
    salespersonId: input.salespersonId ?? opp.salespersonId,
    revenueModel: input.revenueModel ?? 'service_fee',
    grossFlowAmount: input.grossFlowAmount,
    amount: input.amount,
    costRatio,
    margin: input.margin,
    paymentStatus: 'Pending' as any,
    pricingRef: input.pricingRef ?? null,
    isSample: true,
  };

  await salesRepo.create(sale);

  // Mark opportunity Won
  await opportunitiesRepo.update(opportunityId, { stage: 'Won' as any, closingDate: input.date, wonReason: 'Sale recorded' });
  await logAudit('opportunity', opportunityId, 'status_change', { field: 'stage', after: 'Won' });
  await logAudit('sale', sale.id, 'create');

  return sale;
}

/* ─────────────────────────────────────────────────────────────────────────── *
 *  Payment
 * ─────────────────────────────────────────────────────────────────────────── */

export interface RecordPaymentInput {
  amount: number;
  method: PaymentMethod | string;
  date: string;
  dueDate?: string;
  invoiceId?: string;
}

export async function recordPayment(saleId: string, input: RecordPaymentInput): Promise<Payment> {
  const sale = await salesRepo.getById(saleId);
  if (!sale) throw new Error(`Sale ${saleId} not found`);

  const payment: Payment = {
    id: uid('PAY'),
    saleId,
    clientId: sale.clientId,
    date: input.date,
    amount: input.amount,
    method: (input.method as Payment['method']),
    status: 'Paid' as any,
    invoiceId: input.invoiceId ?? null,
    dueDate: input.dueDate ?? null,
    isSample: true,
  };

  await paymentsRepo.create(payment);

  // Update sale payment status
  const newStatus: PaymentStatus = (input.amount >= sale.amount ? 'Paid' : 'Partial') as any;
  await salesRepo.update(saleId, { paymentStatus: newStatus });
  await logAudit('sale', saleId, 'update', { field: 'paymentStatus', after: newStatus });
  await logAudit('payment', payment.id, 'create');

  return payment;
}

/* ─────────────────────────────────────────────────────────────────────────── *
 *  Interaction (meeting / call / message)
 * ─────────────────────────────────────────────────────────────────────────── */

export interface CreateInteractionInput {
  clientId: string;
  salespersonId: string;
  type: InteractionType | string;
  date: string;
  durationMinutes?: number;
  result?: string;
  notes?: string;
  followUpDate?: string;
}

export async function createInteraction(input: CreateInteractionInput): Promise<Interaction> {
  const interaction: Interaction = {
    id: uid('INT'),
    clientId: input.clientId,
    salespersonId: input.salespersonId,
    type: input.type as InteractionType,
    date: input.date,
    durationMinutes: input.durationMinutes ?? null,
    result: input.result ?? null,
    notes: input.notes ?? null,
    followUpDate: input.followUpDate ?? null,
    isSample: true,
  };
  await interactionsRepo.create(interaction);
  await logAudit('interaction', interaction.id, 'create');
  return interaction;
}

/* ─────────────────────────────────────────────────────────────────────────── *
 *  Feedback / Complaint
 * ─────────────────────────────────────────────────────────────────────────── */

export interface CreateFeedbackInput {
  clientId: string;
  projectId?: string;
  saleId?: string;
  date: string;
  source: FeedbackSource | string;
  type: FeedbackType | string;
  rating: number;
  feedbackText?: string;
  npsScore?: number;
  responsibleEmployeeId?: string;
}

export async function createFeedback(input: CreateFeedbackInput): Promise<Feedback> {
  const fb: Feedback = {
    id: uid('FB'),
    clientId: input.clientId,
    projectId: input.projectId ?? null,
    saleId: input.saleId ?? null,
    consultantId: null,
    date: input.date,
    source: input.source as FeedbackSource,
    type: input.type as FeedbackType,
    rating: input.rating,
    npsScore: input.npsScore ?? null,
    satisfactionLevel: null,
    feedbackText: input.feedbackText ?? null,
    positivePoints: null,
    negativePoints: null,
    improvementSuggestions: null,
    resolutionStatus: 'Open' as any,
    responsibleEmployeeId: input.responsibleEmployeeId ?? null,
    isSample: true,
  };
  await feedbackRepo.create(fb);
  await logAudit('feedback', fb.id, 'create');
  return fb;
}

export async function updateFeedbackResolution(
  feedbackId: string,
  status: ResolutionStatus | string,
): Promise<Feedback> {
  const fb = await feedbackRepo.update(feedbackId, {
    resolutionStatus: status as ResolutionStatus,
  });
  await logAudit('feedback', feedbackId, 'status_change', { field: 'resolutionStatus', after: status });
  return fb;
}

/* ─────────────────────────────────────────────────────────────────────────── *
 *  Expense (Comptabilité)
 * ─────────────────────────────────────────────────────────────────────────── */

export interface CreateExpenseInput {
  date: string;
  branchKey: BranchKey;
  category: ExpenseCategory | string;
  description?: string;
  supplier?: string;
  quantity: number;
  unitCost: number;
  responsiblePersonId?: string;
}

export async function createExpense(input: CreateExpenseInput): Promise<Expense> {
  const expense: Expense = {
    id: uid('EXP'),
    date: input.date,
    branchKey: input.branchKey,
    department: null,
    category: input.category as ExpenseCategory,
    supplier: input.supplier ?? null,
    description: input.description ?? null,
    quantity: input.quantity,
    unitCost: input.unitCost,
    totalCost: input.quantity * input.unitCost,
    responsiblePersonId: input.responsiblePersonId ?? null,
    isSample: true,
  };
  await expensesRepo.create(expense);
  await logAudit('expense', expense.id, 'create');
  return expense;
}

/* ─────────────────────────────────────────────────────────────────────────── *
 *  Project (Consulting / Communication / Academy)
 * ─────────────────────────────────────────────────────────────────────────── */

export interface CreateProjectInput {
  clientId: string;
  saleId?: string;
  branchKey: BranchKey;
  serviceLine: ServiceLine;
  startDate: string;
  estimatedHours: number;
  budget: number;
  responsibleTeam?: string[];
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
  const project: Project = {
    id: uid('PRJ'),
    clientId: input.clientId,
    saleId: input.saleId ?? null,
    branchKey: input.branchKey,
    serviceLine: input.serviceLine,
    startDate: input.startDate,
    endDate: null,
    estimatedHours: input.estimatedHours,
    actualHours: null,
    budget: input.budget,
    cost: 0,
    profit: input.budget,
    responsibleTeam: input.responsibleTeam ?? [],
    status: 'Planned' as any,
    isSample: true,
  };
  await projectsRepo.create(project);
  await logAudit('project', project.id, 'create');
  return project;
}

/* ─────────────────────────────────────────────────────────────────────────── *
 *  Task / Objective / Evaluation / Decision (Management)
 * ─────────────────────────────────────────────────────────────────────────── */

export interface CreateTaskInput {
  projectId?: string;
  employeeId: string;
  kind: TaskKind | string;
  title?: string;
  priority?: TaskPriority | string;
  dueDate?: string;
  estimatedHours?: number;
  department?: string;
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const task: Task = {
    id: uid('TSK'),
    projectId: input.projectId ?? null,
    employeeId: input.employeeId,
    department: input.department ?? null,
    kind: (input.kind as TaskKind),
    createdDate: today(),
    dueDate: input.dueDate ?? null,
    completionDate: null,
    priority: (input.priority as TaskPriority) ?? 'Medium',
    status: 'To Do' as any,
    estimatedHours: input.estimatedHours ?? null,
    actualHours: null,
    title: input.title ?? null,
    isSample: true,
  };
  await tasksRepo.create(task);
  await logAudit('task', task.id, 'create');
  return task;
}

/* ─────────────────────────────────────────────────────────────────────────── *
 *  Marketing Campaign (Communication)
 * ─────────────────────────────────────────────────────────────────────────── */

export interface CreateCampaignInput {
  platform: string;
  channel: MarketingCampaign['channel'];
  campaignName: string;
  objective?: string;
  startDate: string;
  budget: number;
}

export async function createCampaign(input: CreateCampaignInput): Promise<MarketingCampaign> {
  const campaign: MarketingCampaign = {
    id: uid('CAM'),
    platform: input.platform,
    channel: input.channel,
    campaignName: input.campaignName,
    objective: input.objective ?? null,
    startDate: input.startDate,
    endDate: null,
    budget: input.budget,
    amountSpent: 0,
    reach: 0,
    impressions: 0,
    clicks: 0,
    leads: 0,
    messages: 0,
    purchases: 0,
    revenueGenerated: 0,
    isSample: true,
  };
  await marketingCampaignsRepo.create(campaign);
  await logAudit('marketingCampaign', campaign.id, 'create');
  return campaign;
}
