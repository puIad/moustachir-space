import type { FormSection } from './ModalForm';

export const SERVICE_LINES = [
  { label: 'Consulting (Horaire)', value: 'consulting_hourly' },
  { label: 'Consulting (Forfait)', value: 'consulting_package' },
  { label: 'Comptabilité (Admin)', value: 'compta_admin' },
  { label: 'Rentabilité (Commission)', value: 'rentabilite_commission' },
  { label: 'Branding (Communication)', value: 'com_branding' },
  { label: 'Digital (Communication)', value: 'com_digital' },
  { label: 'Web Dev (Communication)', value: 'com_web_dev' },
  { label: 'Academy', value: 'academy' },
  { label: 'Idarati Admin', value: 'idarati_admin' },
];

export const BRANCHES = [
  { label: 'Consulting', value: 'consulting' },
  { label: 'Comptabilité France', value: 'comptabilite' },
  { label: 'Communication', value: 'communication' },
  { label: 'Academy', value: 'academy' },
  { label: 'Management', value: 'management' },
];

export const CHANNELS = [
  { label: 'Campagne Marketing', value: 'Campagne Marketing' },
  { label: 'Prospection Classique', value: 'Prospection Classique' },
  { label: 'Website', value: 'Website' },
  { label: 'Événementiel', value: 'Événementiel' },
];

export interface FormOptions {
  clients: Array<{ id: string; name: string }>;
  salespeople: Array<{ id: string; name: string }>;
  opportunities: Array<{ id: string; name: string }>;
  sales: Array<{ id: string; name: string }>;
  projects: Array<{ id: string; name: string }>;
}

export function getEntityFormSchema(
  entityKey: string,
  options: FormOptions,
  branchKey?: string,
): FormSection[] {
  const clientOptions = options.clients.map((c) => ({ label: `${c.name} (${c.id})`, value: c.id }));
  const salespersonOptions = options.salespeople.map((s) => ({ label: s.name, value: s.name }));
  const opportunityOptions = options.opportunities.map((o) => ({ label: `${o.name} (${o.id})`, value: o.id }));
  const saleOptions = options.sales.map((s) => ({ label: `${s.name} (${s.id})`, value: s.id }));
  const projectOptions = options.projects.map((p) => ({ label: `${p.name} (${p.id})`, value: p.id }));

  switch (entityKey) {
    case 'add_prospect':
      return [
        {
          title: 'Informations du Prospect (Client)',
          fields: [
            { key: 'fullName', label: 'Nom complet du contact', type: 'text', required: true },
            { key: 'companyName', label: "Nom de l'entreprise", type: 'text' },
            { key: 'email', label: 'Email', type: 'text' },
            { key: 'phone', label: 'Téléphone', type: 'text' },
            { key: 'industry', label: "Secteur d'activité", type: 'text' },
            { key: 'country', label: 'Pays', type: 'text' },
          ],
        },
        {
          title: 'Détails de la Piste (Lead)',
          fields: [
            { key: 'source', label: 'Source d\'acquisition', type: 'select', options: CHANNELS, required: true, defaultValue: 'Website' },
            { key: 'branchKey', label: 'Branche', type: 'select', options: BRANCHES, defaultValue: branchKey ?? 'consulting', required: true },
            { key: 'serviceLine', label: 'Service d\'intérêt', type: 'select', options: SERVICE_LINES, required: true },
            { key: 'expectedBudget', label: 'Budget estimé (DA)', type: 'number' },
            { key: 'need', label: 'Besoin ou notes', type: 'textarea' },
            { key: 'assignedSalespersonId', label: 'Commercial assigné', type: 'select', options: salespersonOptions },
          ],
        },
      ];

    case 'clients':
      return [
        {
          title: 'Informations de base',
          fields: [
            { key: 'fullName', label: 'Nom complet', type: 'text', required: true },
            { key: 'companyName', label: "Nom de l'entreprise", type: 'text' },
            { key: 'email', label: 'Email', type: 'text' },
            { key: 'phone', label: 'Téléphone', type: 'text' },
          ],
        },
        {
          title: 'Classification et Localisation',
          fields: [
            {
              key: 'type',
              label: 'Type de client',
              type: 'select',
              options: [
                { label: 'Piste (Lead)', value: 'Lead' },
                { label: 'Prospect', value: 'Prospect' },
                { label: 'Client', value: 'Customer' },
                { label: 'Ancien Client', value: 'Former Customer' },
              ],
              defaultValue: 'Lead',
              required: true,
            },
            { key: 'industry', label: 'Secteur d\'activité', type: 'text' },
            { key: 'country', label: 'Pays', type: 'text' },
            { key: 'city', label: 'Ville', type: 'text' },
          ],
        },
        {
          title: 'Rattachement commercial',
          fields: [
            {
              key: 'branchKey',
              label: 'Branche',
              type: 'select',
              options: BRANCHES,
              defaultValue: branchKey ?? 'consulting',
              required: true,
            },
            {
              key: 'serviceLine',
              label: 'Service principal',
              type: 'select',
              options: SERVICE_LINES,
              required: true,
            },
            {
              key: 'responsibleSalespersonId',
              label: 'Commercial responsable',
              type: 'select',
              options: salespersonOptions,
            },
          ],
        },
      ];

    case 'leads':
      return [
        {
          title: 'Informations Piste',
          fields: [
            { key: 'clientId', label: 'Client / Contact', type: 'select', options: clientOptions, required: true },
            { key: 'source', label: 'Source', type: 'select', options: CHANNELS, required: true, defaultValue: 'Website' },
            {
              key: 'status',
              label: 'Statut',
              type: 'select',
              options: [
                { label: 'Nouveau (New)', value: 'New' },
                { label: 'Contacté', value: 'Contacted' },
                { label: 'Qualifié', value: 'Qualified' },
                { label: 'Non qualifié', value: 'Unqualified' },
                { label: 'Converti', value: 'Converted' },
                { label: 'Abandonné', value: 'Dropped' },
              ],
              required: true,
              defaultValue: 'New',
            },
            { key: 'expectedBudget', label: 'Budget estimé (DA)', type: 'number' },
            { key: 'need', label: 'Besoin formulé', type: 'textarea' },
            { key: 'assignedSalespersonId', label: 'Commercial assigné', type: 'select', options: salespersonOptions },
            { key: 'branchKey', label: 'Branche', type: 'select', options: BRANCHES, defaultValue: branchKey ?? 'consulting', required: true },
            { key: 'serviceLine', label: 'Service concerné', type: 'select', options: SERVICE_LINES, required: true },
          ],
        },
      ];

    case 'interactions':
      return [
        {
          title: 'Détails de l\'interaction',
          fields: [
            { key: 'clientId', label: 'Client / Contact', type: 'select', options: clientOptions, required: true },
            { key: 'salespersonId', label: 'Commercial / Rédacteur', type: 'select', options: salespersonOptions, required: true },
            {
              key: 'type',
              label: 'Type d\'échange',
              type: 'select',
              options: [
                { label: 'Appel (Call)', value: 'Call' },
                { label: 'Réunion (Meeting)', value: 'Meeting' },
                { label: 'WhatsApp', value: 'WhatsApp' },
                { label: 'Email', value: 'Email' },
              ],
              required: true,
              defaultValue: 'Meeting',
            },
            { key: 'date', label: 'Date', type: 'date', required: true, defaultValue: new Date().toISOString().slice(0, 10) },
            { key: 'durationMinutes', label: 'Durée (minutes)', type: 'number' },
            { key: 'result', label: 'Résultat / Décision', type: 'text' },
            { key: 'notes', label: 'Notes détaillées', type: 'textarea' },
            { key: 'followUpDate', label: 'Date de relance prévue', type: 'date' },
          ],
        },
      ];

    case 'opportunities':
      return [
        {
          title: 'Opportunité Commerciale',
          fields: [
            { key: 'clientId', label: 'Client / Prospect', type: 'select', options: clientOptions, required: true },
            { key: 'salespersonId', label: 'Commercial assigné', type: 'select', options: salespersonOptions, required: true },
            { key: 'branchKey', label: 'Branche', type: 'select', options: BRANCHES, defaultValue: branchKey ?? 'consulting', required: true },
            { key: 'serviceLine', label: 'Service', type: 'select', options: SERVICE_LINES, required: true },
            { key: 'valueExpected', label: 'Valeur estimée (DA)', type: 'number', required: true },
            {
              key: 'stage',
              label: 'Étape du pipeline',
              type: 'select',
              options: [
                { label: 'Nouveau lead', value: 'New Lead' },
                { label: 'Contacté', value: 'Contacted' },
                { label: 'Qualifié', value: 'Qualified' },
                { label: 'Réunion planifiée', value: 'Meeting' },
                { label: 'Proposition envoyée', value: 'Proposal' },
                { label: 'Négociation', value: 'Negotiation' },
                { label: 'Gagnée (Won)', value: 'Won' },
                { label: 'Perdue (Lost)', value: 'Lost' },
              ],
              defaultValue: 'Qualified',
              required: true,
            },
            { key: 'probability', label: 'Probabilité de succès (0.0 à 1.0)', type: 'number', defaultValue: '0.5' },
          ],
        },
      ];

    case 'proposals':
      return [
        {
          title: 'Informations de base',
          fields: [
            { key: 'clientId', label: 'Client', type: 'select', options: clientOptions, required: true },
            { key: 'opportunityId', label: 'Opportunité liée', type: 'select', options: opportunityOptions, required: true },
            { key: 'salespersonId', label: 'Commercial rédacteur', type: 'select', options: salespersonOptions, required: true },
            { key: 'branchKey', label: 'Branche', type: 'select', options: BRANCHES, defaultValue: branchKey ?? 'consulting', required: true },
            { key: 'serviceLine', label: 'Service proposé', type: 'select', options: SERVICE_LINES, required: true },
          ],
        },
        {
          title: 'Tarification et Détails',
          fields: [
            { key: 'pricingRef', label: 'Option de tarification (dim_pricing)', type: 'pricing', serviceLineField: 'serviceLine' },
            { key: 'amount', label: 'Montant (DA)', type: 'number', required: true },
            { key: 'discount', label: 'Remise accordée (DA)', type: 'number', defaultValue: '0' },
            { key: 'estimatedDeliveryTimeDays', label: 'Temps de livraison estimé (jours)', type: 'number' },
            {
              key: 'status',
              label: 'Statut',
              type: 'select',
              options: [
                { label: 'Brouillon (Draft)', value: 'Draft' },
                { label: 'Envoyé (Sent)', value: 'Sent' },
                { label: 'Consulté (Viewed)', value: 'Viewed' },
                { label: 'Accepté (Accepted)', value: 'Accepted' },
                { label: 'Refusé (Rejected)', value: 'Rejected' },
                { label: 'Expiré (Expired)', value: 'Expired' },
              ],
              defaultValue: 'Draft',
              required: true,
            },
          ],
        },
      ];

    case 'sales':
      return [
        {
          title: 'Détails de la vente / facture',
          fields: [
            { key: 'clientId', label: 'Client', type: 'select', options: clientOptions, required: true },
            { key: 'opportunityId', label: 'Opportunité', type: 'select', options: opportunityOptions },
            { key: 'projectId', label: 'Projet lié (si applicable)', type: 'select', options: projectOptions },
            { key: 'date', label: 'Date de la transaction', type: 'date', required: true, defaultValue: new Date().toISOString().slice(0, 10) },
            { key: 'branchKey', label: 'Branche', type: 'select', options: BRANCHES, defaultValue: branchKey ?? 'consulting', required: true },
            { key: 'serviceLine', label: 'Service vendu', type: 'select', options: SERVICE_LINES, required: true },
            { key: 'salespersonId', label: 'Commercial responsable', type: 'select', options: salespersonOptions, required: true },
          ],
        },
        {
          title: 'Montants et Revenu',
          fields: [
            { key: 'pricingRef', label: 'Option de tarification (dim_pricing)', type: 'pricing', serviceLineField: 'serviceLine' },
            {
              key: 'revenueModel',
              label: 'Modèle de revenus',
              type: 'select',
              options: [
                { label: 'Frais de service (One-time)', value: 'service_fee' },
                { label: 'Commission (%)', value: 'commission' },
                { label: 'Abonnement (Subscription)', value: 'subscription' },
              ],
              defaultValue: 'service_fee',
              required: true,
            },
            { key: 'amount', label: 'CA Reconnu net (DA)', type: 'number', required: true },
            { key: 'grossFlowAmount', label: 'CA Brut / Flux (DA)', type: 'number', required: true },
            { key: 'margin', label: 'Marge dégagée (DA)', type: 'number', required: true },
            {
              key: 'paymentStatus',
              label: 'Statut du paiement',
              type: 'select',
              options: [
                { label: 'En attente (Pending)', value: 'Pending' },
                { label: 'Partiel', value: 'Partial' },
                { label: 'Payé', value: 'Paid' },
                { label: 'En retard', value: 'Overdue' },
                { label: 'Remboursé', value: 'Refunded' },
              ],
              defaultValue: 'Pending',
              required: true,
            },
          ],
        },
      ];

    case 'payments':
      return [
        {
          title: 'Paiement client',
          fields: [
            { key: 'saleId', label: 'Vente / Facture', type: 'select', options: saleOptions, required: true },
            { key: 'clientId', label: 'Client', type: 'select', options: clientOptions, required: true },
            { key: 'date', label: 'Date du paiement', type: 'date', required: true, defaultValue: new Date().toISOString().slice(0, 10) },
            { key: 'amount', label: 'Montant versé (DA)', type: 'number', required: true },
            {
              key: 'method',
              label: 'Méthode de paiement',
              type: 'select',
              options: [
                { label: 'Espèces (Cash)', value: 'Cash' },
                { label: 'Virement (Bank Transfer)', value: 'Bank Transfer' },
                { label: 'Carte bancaire', value: 'Card' },
                { label: 'Chèque', value: 'Cheque' },
                { label: 'En ligne', value: 'Online' },
              ],
              required: true,
              defaultValue: 'Bank Transfer',
            },
            {
              key: 'status',
              label: 'Statut',
              type: 'select',
              options: [
                { label: 'Payé (Paid)', value: 'Paid' },
                { label: 'En attente', value: 'Pending' },
                { label: 'Refusé / Échoué', value: 'Refunded' },
              ],
              required: true,
              defaultValue: 'Paid',
            },
            { key: 'invoiceId', label: 'Numéro de facture de référence', type: 'text' },
            { key: 'dueDate', label: 'Date d\'échéance du paiement', type: 'date' },
          ],
        },
      ];

    case 'expenses':
      return [
        {
          title: 'Enregistrement de dépense',
          fields: [
            { key: 'date', label: 'Date', type: 'date', required: true, defaultValue: new Date().toISOString().slice(0, 10) },
            { key: 'branchKey', label: 'Branche d\'imputation', type: 'select', options: BRANCHES, defaultValue: branchKey ?? 'consulting', required: true },
            {
              key: 'category',
              label: 'Catégorie',
              type: 'select',
              options: [
                { label: 'Salaires (Salary)', value: 'Salary' },
                { label: 'Marketing', value: 'Marketing' },
                { label: 'Logiciels / SaaS', value: 'Software' },
                { label: 'Investissement', value: 'Investment' },
                { label: 'Transport / Déplacement', value: 'Transport' },
                { label: 'Production digitale', value: 'Digital production' },
                { label: 'Freelancers', value: 'Freelancers' },
                { label: 'Ressources Humaines', value: 'HR' },
                { label: 'Taxes / Impôts', value: 'Taxes' },
                { label: 'Autre', value: 'Other' },
              ],
              required: true,
              defaultValue: 'Other',
            },
            { key: 'supplier', label: 'Fournisseur / Prestataire', type: 'text' },
            { key: 'description', label: 'Description / Motif', type: 'text' },
            { key: 'quantity', label: 'Quantité', type: 'number', required: true, defaultValue: '1' },
            { key: 'unitCost', label: 'Coût unitaire (DA)', type: 'number', required: true },
            { key: 'responsiblePersonId', label: 'Collaborateur responsable', type: 'select', options: salespersonOptions },
          ],
        },
      ];

    case 'marketingCampaigns':
      return [
        {
          title: 'Campagne de Communication',
          fields: [
            { key: 'campaignName', label: 'Nom de la campagne', type: 'text', required: true },
            { key: 'platform', label: 'Plateforme (ex: Facebook, Google Ads)', type: 'text', required: true },
            { key: 'channel', label: 'Canal d\'acquisition', type: 'select', options: CHANNELS, required: true, defaultValue: 'Campagne Marketing' },
            { key: 'objective', label: 'Objectif principal', type: 'text' },
            { key: 'startDate', label: 'Date de début', type: 'date', required: true, defaultValue: new Date().toISOString().slice(0, 10) },
            { key: 'budget', label: 'Budget alloué (DA)', type: 'number', required: true },
          ],
        },
      ];

    case 'projects':
      return [
        {
          title: 'Détails du projet / de la cohorte',
          fields: [
            { key: 'clientId', label: 'Client / Étudiant', type: 'select', options: clientOptions, required: true },
            { key: 'saleId', label: 'Vente / Facture d\'origine', type: 'select', options: saleOptions },
            { key: 'branchKey', label: 'Branche', type: 'select', options: BRANCHES, defaultValue: branchKey ?? 'consulting', required: true },
            { key: 'serviceLine', label: 'Ligne de service', type: 'select', options: SERVICE_LINES, required: true },
            { key: 'startDate', label: 'Date de lancement', type: 'date', required: true, defaultValue: new Date().toISOString().slice(0, 10) },
            { key: 'estimatedHours', label: 'Nombre d\'heures estimées', type: 'number', required: true },
            { key: 'budget', label: 'Budget total (DA)', type: 'number', required: true },
            {
              key: 'status',
              label: 'Statut du projet',
              type: 'select',
              options: [
                { label: 'Planifié (Planned)', value: 'Planned' },
                { label: 'Actif / En cours', value: 'Active' },
                { label: 'En retard (Delayed)', value: 'Delayed' },
                { label: 'Terminé (Completed)', value: 'Completed' },
                { label: 'Annulé (Cancelled)', value: 'Cancelled' },
              ],
              defaultValue: 'Planned',
              required: true,
            },
          ],
        },
      ];

    case 'tasks':
      return [
        {
          title: 'Tâche / Objectif / Évaluation',
          fields: [
            { key: 'employeeId', label: 'Membre d\'équipe assigné', type: 'select', options: salespersonOptions, required: true },
            { key: 'projectId', label: 'Projet concerné (optionnel)', type: 'select', options: projectOptions },
            {
              key: 'kind',
              label: 'Nature du livrable',
              type: 'select',
              options: [
                { label: 'Tâche Interne (Task)', value: 'task' },
                { label: 'Objectif KPI (Objective)', value: 'objective' },
                { label: 'Évaluation (Evaluation)', value: 'evaluation' },
                { label: 'Décision administrative (Decision)', value: 'decision' },
              ],
              defaultValue: 'task',
              required: true,
            },
            { key: 'title', label: 'Titre / Libellé', type: 'text', required: true },
            { key: 'dueDate', label: 'Date d\'échéance', type: 'date' },
            {
              key: 'priority',
              label: 'Priorité',
              type: 'select',
              options: [
                { label: 'Basse (Low)', value: 'Low' },
                { label: 'Moyenne (Medium)', value: 'Medium' },
                { label: 'Haute (High)', value: 'High' },
                { label: 'Critique (Critical)', value: 'Critical' },
              ],
              defaultValue: 'Medium',
              required: true,
            },
            {
              key: 'status',
              label: 'Statut',
              type: 'select',
              options: [
                { label: 'À faire (To Do)', value: 'To Do' },
                { label: 'En cours (In Progress)', value: 'In Progress' },
                { label: 'Terminé (Done)', value: 'Done' },
                { label: 'Bloqué (Blocked)', value: 'Blocked' },
              ],
              defaultValue: 'To Do',
              required: true,
            },
            { key: 'estimatedHours', label: 'Temps estimé (heures)', type: 'number' },
            { key: 'department', label: 'Département concerné', type: 'text' },
          ],
        },
      ];

    case 'feedback':
      return [
        {
          title: 'Retour d\'expérience Client',
          fields: [
            { key: 'clientId', label: 'Client émetteur', type: 'select', options: clientOptions, required: true },
            { key: 'projectId', label: 'Projet ou cohorte liée', type: 'select', options: projectOptions },
            { key: 'saleId', label: 'Achat / Facture liée', type: 'select', options: saleOptions },
            { key: 'date', label: 'Date du retour', type: 'date', required: true, defaultValue: new Date().toISOString().slice(0, 10) },
            {
              key: 'source',
              label: 'Source du retour',
              type: 'select',
              options: [
                { label: 'WhatsApp', value: 'WhatsApp' },
                { label: 'Email', value: 'Email' },
                { label: 'Formulaire d\'enquête', value: 'Survey' },
                { label: 'Appel direct', value: 'Phone Call' },
                { label: 'Avis Google', value: 'Google Review' },
                { label: 'Réseaux Sociaux', value: 'Facebook Review' },
                { label: 'Formulaire Web', value: 'Website Form' },
                { label: 'Entretien physique', value: 'Direct Meeting' },
              ],
              required: true,
              defaultValue: 'Survey',
            },
            {
              key: 'type',
              label: 'Sujet du retour',
              type: 'select',
              options: [
                { label: 'Qualité du Service', value: 'Service Quality' },
                { label: 'Livrables / Produits', value: 'Product Quality' },
                { label: 'Support client', value: 'Support' },
                { label: 'Expérience Commerciale', value: 'Sales Experience' },
                { label: 'Expérience Livraison', value: 'Delivery Experience' },
                { label: 'Satisfaction Générale', value: 'General Satisfaction' },
              ],
              required: true,
              defaultValue: 'General Satisfaction',
            },
            { key: 'rating', label: 'Note globale accordée (1 à 5)', type: 'number', required: true, min: 1, max: 5, defaultValue: '4' },
            { key: 'npsScore', label: 'Score de recommandation (NPS 0 à 10)', type: 'number', min: 0, max: 10 },
            { key: 'feedbackText', label: 'Commentaires et observations', type: 'textarea' },
            {
              key: 'resolutionStatus',
              label: 'Statut de traitement',
              type: 'select',
              options: [
                { label: 'Ouvert (Open)', value: 'Open' },
                { label: 'En cours (In Progress)', value: 'In Progress' },
                { label: 'Résolu (Resolved)', value: 'Resolved' },
                { label: 'Clôturé', value: 'Closed' },
              ],
              defaultValue: 'Open',
              required: true,
            },
            { key: 'responsibleEmployeeId', label: 'Gestionnaire de la plainte / du retour', type: 'select', options: salespersonOptions },
          ],
        },
      ];

    default:
      return [];
  }
}
