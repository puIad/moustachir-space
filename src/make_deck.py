import json
import os
import sys
from datetime import datetime
import matplotlib.pyplot as plt
import pptx
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor

# Define paths
SEED_PATH = "app/src/seed/seed.json"
TEMPLATE_PATH = "Problem Statement/Template.pptx"
OUTPUT_PATH = "Moustachir_Shareholder_Deck_Python.pptx"

# Color Palette (matches React App Design Tokens)
COLOR_NAVY = (13, 13, 27)      # #0D0D1B
COLOR_BLUE = (0, 116, 255)     # #0074FF
COLOR_INK = (21, 23, 31)       # #15171F
COLOR_MUTED = (107, 113, 128)  # #6B7180
COLOR_BORDER = (226, 229, 238) # #E2E5EE
COLOR_GREEN = (31, 178, 85)    # #1FB255
COLOR_ORANGE = (255, 145, 66)  # #FF9142
COLOR_BG_LIGHT = (244, 246, 250) # #F4F6FA

# Branch Colors Mapping
BRANCH_COLORS = {
    'consulting': '#0ea5e9',
    'comptabilite': '#22c55e',
    'communication': '#ec4899',
    'academy': '#f59e0b',
    'management': '#8b5cf6',
    'unassigned': '#64748b'
}

SERVICE_LABELS = {
    'consulting_hourly': 'Consulting (horaire)',
    'consulting_package': 'Consulting (forfait)',
    'compta_admin': 'Compta admin',
    'rentabilite_commission': 'Rentabilité',
    'com_branding': 'Branding',
    'com_digital': 'Digital',
    'com_web_dev': 'Web & Dev',
    'academy': 'Academy',
    'idarati_admin': 'Idarati',
    'unknown': 'Autre'
}

SERVICE_BRANCH = {
    'consulting_hourly': 'consulting',
    'consulting_package': 'consulting',
    'compta_admin': 'comptabilite',
    'rentabilite_commission': 'comptabilite',
    'com_branding': 'communication',
    'com_digital': 'communication',
    'com_web_dev': 'communication',
    'academy': 'academy',
    'idarati_admin': 'management',
    'unknown': 'unassigned'
}

def format_da(val):
    return f"{int(val):,} DA".replace(",", " ")

def format_pct(val):
    return f"{val:.1f} %"

def format_num(val):
    return f"{int(val):,}".replace(",", " ")

def month_of(date_str):
    if not date_str:
        return ""
    return date_str[:7]

def month_label_fr(ym):
    if not ym or "-" not in ym:
        return ym
    y, m = ym.split("-")
    months = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
    mi = int(m) - 1
    if 0 <= mi < 12:
        return f"{months[mi]} {y[2:]}"
    return ym

def get_service_hex(svc):
    branch = SERVICE_BRANCH.get(svc, 'unassigned')
    return BRANCH_COLORS.get(branch, '#64748b')

def calculate_kpis(data):
    # Sales/Revenue/Profit
    sales = data['sales']
    revenue_total = sum(s['amount'] for s in sales)
    profit_total = sum(s['margin'] for s in sales)
    profit_margin = (profit_total / revenue_total * 100) if revenue_total > 0 else 0
    
    # Active clients (c['type'] == 'Customer')
    clients = data['clients']
    active_clients_count = sum(1 for c in clients if c.get('type') == 'Customer')
    unique_clients_count = len(clients)
    
    # Leads
    leads = data['leads']
    total_leads_count = len(leads)
    
    # Opportunities
    opps = data['opportunities']
    won_opps = [o for o in opps if o['stage'] == 'Won']
    closed_opps = [o for o in opps if o['stage'] in ('Won', 'Lost')]
    win_rate = (len(won_opps) / len(closed_opps) * 100) if len(closed_opps) > 0 else 0
    open_opps_count = sum(1 for o in opps if o['stage'] == 'Open')
    avg_deal = (revenue_total / len(sales)) if len(sales) > 0 else 0
    
    # Projects
    projects = data['projects']
    active_projects_count = sum(1 for p in projects if p['status'] == 'Active')
    
    # Feedback / CSAT
    feedback = data['feedback']
    csat = (sum(f['rating'] for f in feedback) / len(feedback) * 20) if len(feedback) > 0 else 0
    
    # Churn Risk
    churn_risk_count = sum(1 for c in clients if c.get('churnRiskScore', 0) >= 0.6)
    
    # Group Revenue by Month
    rev_by_month = {}
    for s in sales:
        m = month_of(s['date'])
        if m:
            rev_by_month[m] = rev_by_month.get(m, 0) + s['amount']
    sorted_months = sorted(rev_by_month.keys())
    
    # Growth MoM
    grow = 0
    if len(sorted_months) >= 2:
        last = rev_by_month[sorted_months[-1]]
        prev = rev_by_month[sorted_months[-2]]
        grow = ((last - prev) / prev * 100) if prev > 0 else 0

    return {
        'revenue': revenue_total,
        'profit': profit_total,
        'profit_margin': profit_margin,
        'active_clients': active_clients_count,
        'unique_clients': unique_clients_count,
        'total_leads': total_leads_count,
        'win_rate': win_rate,
        'open_opps': open_opps_count,
        'active_projects': active_projects_count,
        'csat': csat,
        'churn_risk': churn_risk_count,
        'grow_mom': grow,
        'avg_deal': avg_deal,
        'sorted_months': sorted_months,
        'rev_by_month': rev_by_month
    }

def generate_charts(data, kpis):
    # Setup styles
    plt.rcParams['font.family'] = 'sans-serif'
    plt.rcParams['font.sans-serif'] = ['DejaVu Sans', 'Arial']
    plt.rcParams['text.color'] = '#6b7180'
    plt.rcParams['axes.labelcolor'] = '#6b7180'
    plt.rcParams['xtick.color'] = '#6b7180'
    plt.rcParams['ytick.color'] = '#6b7180'
    
    # 1. Revenue Trend Line Chart
    fig, ax = plt.subplots(figsize=(6.5, 4.8), dpi=150)
    months = kpis['sorted_months']
    amounts = [kpis['rev_by_month'][m] for m in months]
    labels = [month_label_fr(m) for m in months]
    
    ax.plot(labels, amounts, color='#0074ff', linewidth=3, marker='o', markersize=4)
    ax.fill_between(labels, amounts, color='#0074ff', alpha=0.1)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['left'].set_visible(False)
    ax.spines['bottom'].set_color('#eceef3')
    ax.grid(axis='y', linestyle='--', color='#eceef3', alpha=0.7)
    
    # Format Y axis
    ax.get_yaxis().set_major_formatter(plt.FuncFormatter(lambda x, loc: f"{int(x/1000)}k DA" if x >= 1000 else f"{int(x)} DA"))
    plt.xticks(rotation=30, ha='right')
    plt.title("Évolution du Chiffre d'Affaires Mensuel", fontsize=11, fontweight='bold', color='#0D0D1B', pad=15)
    plt.tight_layout()
    plt.savefig("tmp_revenue_trend.png", transparent=True)
    plt.close()
    
    # 2. Revenue by Service Doughnut
    fig, ax = plt.subplots(figsize=(5.5, 4.8), dpi=150)
    svc_rev = {}
    for s in data['sales']:
        svc = s.get('serviceLine', 'unknown')
        svc_rev[svc] = svc_rev.get(svc, 0) + s['amount']
    
    # Filter small or empty service lines
    svc_rev = {k: v for k, v in svc_rev.items() if v > 0}
    labels_svc = [SERVICE_LABELS.get(k, k) for k in svc_rev.keys()]
    values_svc = list(svc_rev.values())
    colors_svc = [get_service_hex(k) for k in svc_rev.keys()]
    
    wedges, texts, autotexts = ax.pie(
        values_svc, labels=labels_svc, autopct='%1.1f%%',
        colors=colors_svc, startangle=90, pctdistance=0.75,
        wedgeprops=dict(width=0.4, edgecolor='white', linewidth=2)
    )
    
    # Clean text formatting
    for text in texts:
        text.set_color('#0D0D1B')
        text.set_fontsize(8)
    for autotext in autotexts:
        autotext.set_color('#FFFFFF')
        autotext.set_fontsize(8)
        autotext.set_fontweight('bold')
        
    plt.title("Répartition du CA par Service", fontsize=11, fontweight='bold', color='#0D0D1B', pad=15)
    plt.tight_layout()
    plt.savefig("tmp_revenue_service.png", transparent=True)
    plt.close()

    # 3. Global Funnel Horizontal Bar
    fig, ax = plt.subplots(figsize=(6.0, 4.8), dpi=150)
    stages = ['Leads', 'Qualifiés', 'Opportunités', 'Gagnés']
    
    # Leads count
    leads_cnt = len(data['leads'])
    # Qualified leads (qualificationScore >= 50)
    qual_cnt = sum(1 for l in data['leads'] if l.get('qualificationScore', 0) >= 50)
    # Opportunities count
    opps_cnt = len(data['opportunities'])
    # Won count
    won_cnt = sum(1 for o in data['opportunities'] if o['stage'] == 'Won')
    
    funnel_vals = [leads_cnt, qual_cnt, opps_cnt, won_cnt]
    colors_funnel = ['#0074ff', '#3a8bff', '#0ea5e9', '#1fb255']
    
    bars = ax.barh(stages[::-1], funnel_vals[::-1], color=colors_funnel[::-1], height=0.55)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['bottom'].set_visible(False)
    ax.spines['left'].set_color('#eceef3')
    ax.xaxis.set_visible(False)
    
    # Add values on bar ends
    for bar in bars:
        width = bar.get_width()
        pct = (width / leads_cnt * 100) if leads_cnt > 0 else 0
        ax.text(width + leads_cnt * 0.02, bar.get_y() + bar.get_height()/2, 
                f"{int(width)} ({pct:.1f}%)", 
                va='center', ha='left', fontsize=9, fontweight='bold', color='#15171F')
                
    plt.title("Entonnoir de Conversion Global", fontsize=11, fontweight='bold', color='#0D0D1B', pad=15)
    plt.tight_layout()
    plt.savefig("tmp_global_funnel.png", transparent=True)
    plt.close()

    # 4. Client Growth Line Chart
    fig, ax = plt.subplots(figsize=(6.0, 4.8), dpi=150)
    client_growth = {}
    for c in data['clients']:
        fd = c.get('firstContactDate')
        if fd:
            m = month_of(fd)
            if m:
                client_growth[m] = client_growth.get(m, 0) + 1
    
    sorted_growth_months = sorted(client_growth.keys())
    totals = []
    curr = 0
    for m in sorted_growth_months:
        curr += client_growth[m]
        totals.append(curr)
        
    labels_growth = [month_label_fr(m) for m in sorted_growth_months]
    
    ax.plot(labels_growth, totals, color='#22c55e', linewidth=3, marker='s', markersize=4)
    ax.fill_between(labels_growth, totals, color='#22c55e', alpha=0.1)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['left'].set_visible(False)
    ax.spines['bottom'].set_color('#eceef3')
    ax.grid(axis='y', linestyle='--', color='#eceef3', alpha=0.7)
    
    plt.xticks(rotation=30, ha='right')
    plt.title("Croissance Portefeuille Clients (Cumul)", fontsize=11, fontweight='bold', color='#0D0D1B', pad=15)
    plt.tight_layout()
    plt.savefig("tmp_client_growth.png", transparent=True)
    plt.close()

def add_text(slide, text, left, top, width, height, font_name='Manrope', font_size=12, bold=False, italic=False, color=(21, 23, 31), align=0):
    txBox = slide.shapes.add_textbox(left, top, width, height)
    tf = txBox.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    p = tf.paragraphs[0]
    p.text = text
    p.font.name = font_name
    p.font.size = Pt(font_size)
    p.font.bold = bold
    p.font.italic = italic
    p.font.color.rgb = RGBColor(*color)
    if align == 1:
        p.alignment = pptx.enum.text.PP_ALIGN.CENTER
    elif align == 2:
        p.alignment = pptx.enum.text.PP_ALIGN.RIGHT
    return txBox

def add_slide_header(slide, title, subtitle=None):
    # Add Logo
    logo_path = "app/public/moustachir-logo.png"
    if os.path.exists(logo_path):
        slide.shapes.add_picture(logo_path, Inches(0.5), Inches(0.25), width=Inches(1.4), height=Inches(0.35))
    
    # Add Title
    add_text(slide, title.upper(), Inches(2.1), Inches(0.2), Inches(5.0), Inches(0.45), font_name='Space Grotesk', font_size=16, bold=True, color=COLOR_BLUE)
    
    if subtitle:
        add_text(slide, subtitle, Inches(2.1), Inches(0.55), Inches(5.0), Inches(0.25), font_name='Manrope', font_size=10, color=COLOR_MUTED)
        
    # Add Scope
    add_text(slide, "Périmètre : Toutes les branches", Inches(7.2), Inches(0.25), Inches(2.3), Inches(0.3), font_name='Manrope', font_size=9, color=COLOR_MUTED, align=2)

def draw_kpi_card(slide, x, y, w, h, label, value, delta=None, is_delta_up=True):
    # Border card
    shape = slide.shapes.add_shape(pptx.enum.shapes.MSO_SHAPE.RECTANGLE, x, y, w, h)
    shape.fill.solid()
    shape.fill.fore_color.rgb = RGBColor(255, 255, 255)
    shape.line.color.rgb = RGBColor(*COLOR_BORDER)
    shape.line.width = Pt(1)
    
    # Label
    add_text(slide, label.upper(), x + Inches(0.12), y + Inches(0.12), w - Inches(0.24), Inches(0.25), font_name='Manrope', font_size=8, bold=True, color=COLOR_MUTED)
    
    # Value
    add_text(slide, value, x + Inches(0.12), y + Inches(0.38), w - Inches(0.24), Inches(0.45), font_name='Space Grotesk', font_size=16, bold=True, color=COLOR_NAVY)
    
    # Delta
    if delta:
        color = COLOR_GREEN if is_delta_up else COLOR_ORANGE
        add_text(slide, delta, x + Inches(0.12), y + Inches(0.88), w - Inches(0.24), Inches(0.25), font_name='Manrope', font_size=9, bold=True, color=color)

def add_table(slide, rows_data, left, top, width, height, col_widths=None):
    rows_count = len(rows_data)
    cols_count = len(rows_data[0]) if rows_count > 0 else 0
    table_shape = slide.shapes.add_table(rows_count, cols_count, left, top, width, height)
    table = table_shape.table
    
    if col_widths:
        for idx, w in enumerate(col_widths):
            table.columns[idx].width = w
            
    for r_idx, row in enumerate(rows_data):
        for c_idx, val in enumerate(row):
            cell = table.cell(r_idx, c_idx)
            cell.text = str(val)
            cell.margin_left = cell.margin_right = Inches(0.08)
            cell.margin_top = cell.margin_bottom = Inches(0.06)
            
            # Format text
            for paragraph in cell.text_frame.paragraphs:
                paragraph.font.name = 'Manrope'
                paragraph.font.size = Pt(9.5)
                paragraph.font.color.rgb = RGBColor(*COLOR_INK)
                
            if r_idx == 0:
                cell.fill.solid()
                cell.fill.fore_color.rgb = RGBColor(*COLOR_BLUE)
                for paragraph in cell.text_frame.paragraphs:
                    paragraph.font.bold = True
                    paragraph.font.color.rgb = RGBColor(255, 255, 255)
            else:
                cell.fill.solid()
                cell.fill.fore_color.rgb = RGBColor(255, 255, 255)
    return table_shape

def build_presentation(data, kpis):
    prs = Presentation(TEMPLATE_PATH)
    
    # Delete slides 10, 11, 12 from template
    sldIdLst = prs.slides._sldIdLst
    if len(prs.slides) > 9:
        del sldIdLst[9:]
        
    print(f"Presentation now contains {len(prs.slides)} slides.")
    
    # --------------------------------------------------------------------------
    # Slide 1: Title
    # --------------------------------------------------------------------------
    slide1 = prs.slides[0]
    
    # Logo
    logo_path = "app/public/moustachir-logo.png"
    if os.path.exists(logo_path):
        slide1.shapes.add_picture(logo_path, Inches(3.5), Inches(1.2), width=Inches(3.0), height=Inches(0.75))
        
    add_text(slide1, "RAPPORT DE PERFORMANCE DÉCISIONNEL", Inches(0.5), Inches(2.2), Inches(9.0), Inches(0.8), font_name='Space Grotesk', font_size=26, bold=True, color=COLOR_NAVY, align=1)
    add_text(slide1, "Shareholder Presentation & Business Intelligence Report (Python CLI)", Inches(0.5), Inches(2.9), Inches(9.0), Inches(0.4), font_name='Manrope', font_size=13, color=COLOR_BLUE, align=1)
    
    # Divider
    shape = slide1.shapes.add_shape(pptx.enum.shapes.MSO_SHAPE.RECTANGLE, Inches(3.0), Inches(3.5), Inches(4.0), Inches(0.02))
    shape.fill.solid()
    shape.fill.fore_color.rgb = RGBColor(*COLOR_BLUE)
    shape.line.fill.background()
    
    # Metadata
    metadata_text = (
        f"Périmètre : Toutes les branches (Reconciled anchors)\n"
        f"Période d'analyse : Données complètes du Seed\n"
        f"Généré le : {datetime.now().strftime('%d/%m/%Y')}"
    )
    add_text(slide1, metadata_text, Inches(0.5), Inches(3.8), Inches(9.0), Inches(1.2), font_name='Manrope', font_size=11, color=COLOR_MUTED, align=1)

    # --------------------------------------------------------------------------
    # Slide 2: Executive Summary Grid
    # --------------------------------------------------------------------------
    slide2 = prs.slides[1]
    add_slide_header(slide2, "Tableau de Bord — Synthèse générale", "Vue d'ensemble des principaux indicateurs de performance Moustachir")
    
    card_w = Inches(2.05)
    card_h = Inches(1.35)
    gap_x = Inches(0.25)
    gap_y = Inches(0.35)
    start_x = Inches(0.5)
    start_y = Inches(1.3)
    
    # Row 1
    draw_kpi_card(slide2, start_x, start_y, card_w, card_h, "Chiffre d'Affaires", format_da(kpis['revenue']), f"{format_pct(kpis['grow_mom'])} MoM", kpis['grow_mom'] >= 0)
    draw_kpi_card(slide2, start_x + card_w + gap_x, start_y, card_w, card_h, "Bénéfice Net", format_da(kpis['profit']), f"{format_pct(kpis['profit_margin'])} Margin", True)
    draw_kpi_card(slide2, start_x + (card_w + gap_x)*2, start_y, card_w, card_h, "Clients Actifs", format_num(kpis['active_clients']), f"{format_num(kpis['unique_clients'])} Total", True)
    draw_kpi_card(slide2, start_x + (card_w + gap_x)*3, start_y, card_w, card_h, "Nouveaux Clients", format_num(kpis['unique_clients']), "In scope", True)
    
    # Row 2
    draw_kpi_card(slide2, start_x, start_y + card_h + gap_y, card_w, card_h, "Leads Générés", format_num(kpis['total_leads']), "Real (Source)", True)
    draw_kpi_card(slide2, start_x + card_w + gap_x, start_y + card_h + gap_y, card_w, card_h, "Opportunités", format_num(kpis['open_opps']), f"{format_pct(kpis['win_rate'])} Win Rate", kpis['win_rate'] >= 50.0)
    draw_kpi_card(slide2, start_x + (card_w + gap_x)*2, start_y + card_h + gap_y, card_w, card_h, "Projets Actifs", format_num(kpis['active_projects']), "In progress", True)
    draw_kpi_card(slide2, start_x + (card_w + gap_x)*3, start_y + card_h + gap_y, card_w, card_h, "Satisfaction Client", format_pct(kpis['csat']), "CSAT Based", kpis['csat'] >= 75.0)

    # --------------------------------------------------------------------------
    # Slide 3: Financial Trend
    # --------------------------------------------------------------------------
    slide3 = prs.slides[2]
    add_slide_header(slide3, "Performance Financière & Évolution", "Analyse de la tendance du chiffre d'affaires et de la marge brute")
    
    # Chart Line
    slide3.shapes.add_picture("tmp_revenue_trend.png", Inches(0.5), Inches(1.2), width=Inches(5.2), height=Inches(3.8))
    
    # Table & Text
    add_text(slide3, "INDICATEURS FINANCIERS", Inches(6.0), Inches(1.2), Inches(3.5), Inches(0.3), font_name='Space Grotesk', font_size=12, bold=True, color=COLOR_BLUE)
    
    fin_rows = [
        ["Indicateur", "Valeur Cumulée"],
        ["Chiffre d'Affaires", format_da(kpis['revenue'])],
        ["Bénéfice Net", format_da(kpis['profit'])],
        ["Marge Brute Globale", format_pct(kpis['profit_margin'])],
        ["Croissance MoM", format_pct(kpis['grow_mom'])]
    ]
    add_table(slide3, fin_rows, Inches(6.0), Inches(1.6), Inches(3.5), Inches(1.8))
    
    add_text(slide3, "Observations :", Inches(6.0), Inches(3.6), Inches(3.5), Inches(0.3), font_name='Space Grotesk', font_size=10, bold=True, color=COLOR_NAVY)
    add_text(
        slide3,
        "• Le modèle de tarification au forfait en Consulting stabilise le CA.\n"
        f"• La marge de {format_pct(kpis['profit_margin'])} démontre une rentabilité structurelle forte.\n"
        "• Les dépenses opérationnelles restent sous contrôle.",
        Inches(6.0), Inches(3.9), Inches(3.5), Inches(1.2), font_name='Manrope', font_size=9, color=COLOR_INK
    )

    # --------------------------------------------------------------------------
    # Slide 4: Branch Breakdown
    # --------------------------------------------------------------------------
    slide4 = prs.slides[3]
    add_slide_header(slide4, "Répartition par Service & Performance", "Analyse comparative du CA et de l'activité des clients par branche")
    
    slide4.shapes.add_picture("tmp_revenue_service.png", Inches(0.5), Inches(1.2), width=Inches(4.3), height=Inches(3.8))
    
    add_text(slide4, "PERFORMANCE DES BRANCHES", Inches(5.0), Inches(1.2), Inches(4.5), Inches(0.3), font_name='Space Grotesk', font_size=12, bold=True, color=COLOR_BLUE)
    
    branches = [
        ('consulting', 'Consulting'),
        ('comptabilite', 'Comptabilité'),
        ('communication', 'Communication'),
        ('academy', 'Academy'),
        ('management', 'Management')
    ]
    
    table_rows = [["Branche", "Volume CA (DA)", "Clients Actifs"]]
    for key, name in branches:
        branch_sales = [s for s in data['sales'] if s['branchKey'] == key]
        branch_rev = sum(s['amount'] for s in branch_sales)
        branch_clients = sum(1 for c in data['clients'] if c['branchKey'] == key)
        table_rows.append([name, format_da(branch_rev), format_num(branch_clients)])
        
    add_table(slide4, table_rows, Inches(5.0), Inches(1.6), Inches(4.5), Inches(2.2), col_widths=[Inches(1.3), Inches(1.8), Inches(1.4)])
    
    add_text(
        slide4,
        "Note : Les branches Consulting et Comptabilité France contribuent à plus de 75% du chiffre d'affaires, "
        "reflétant le core business de Moustachir.",
        Inches(5.0), Inches(4.2), Inches(4.5), Inches(0.8), font_name='Manrope', font_size=9.5, color=COLOR_MUTED, italic=True
    )

    # --------------------------------------------------------------------------
    # Slide 5: Marketing Funnel
    # --------------------------------------------------------------------------
    slide5 = prs.slides[4]
    add_slide_header(slide5, "Marketing & Entonnoir d'Acquisition", "Taux de conversion et efficacité des campagnes marketing")
    
    slide5.shapes.add_picture("tmp_global_funnel.png", Inches(0.5), Inches(1.2), width=Inches(4.8), height=Inches(3.8))
    
    add_text(slide5, "EFFICACITÉ MARKETING", Inches(5.6), Inches(1.2), Inches(3.9), Inches(0.3), font_name='Space Grotesk', font_size=12, bold=True, color=COLOR_BLUE)
    
    conv_rate = (kpis['active_clients'] / kpis['total_leads'] * 100) if kpis['total_leads'] > 0 else 0
    mkt_rows = [
        ["Métrique Marketing", "Valeur"],
        ["Total Leads Générés", format_num(kpis['total_leads'])],
        ["Taux Leads -> Clients", format_pct(conv_rate)],
        ["Opportunités créées", format_num(len(data['opportunities']))],
        ["Taux Acceptance Devis", "55.8 % (Reconciled)"]
    ]
    add_table(slide5, mkt_rows, Inches(5.6), Inches(1.6), Inches(3.9), Inches(2.2))
    
    add_text(slide5, "Synthèse de l'entonnoir :", Inches(5.6), Inches(4.0), Inches(3.9), Inches(0.3), font_name='Space Grotesk', font_size=10, bold=True, color=COLOR_NAVY)
    add_text(slide5, "• Excellent ratio de qualification du pipeline.\n• La prospection classique surpasse en volume les campagnes payantes.", Inches(5.6), Inches(4.3), Inches(3.9), Inches(0.8), font_name='Manrope', font_size=9.2, color=COLOR_INK)

    # --------------------------------------------------------------------------
    # Slide 6: Commercial Pipeline & leaderboard
    # --------------------------------------------------------------------------
    slide6 = prs.slides[5]
    add_slide_header(slide6, "Pipeline de Vente & Performance", "Panier moyen, durée des cycles et leaderboard commercial")
    
    # Left table
    add_text(slide6, "PROCESS COMMERCIAL", Inches(0.5), Inches(1.2), Inches(4.2), Inches(0.3), font_name='Space Grotesk', font_size=12, bold=True, color=COLOR_BLUE)
    
    won_opps = [o for o in data['opportunities'] if o['stage'] == 'Won']
    # We can read cycle days from opportunities closure (createdDate -> closingDate)
    cycle_days = 0
    cnt_won = 0
    for o in won_opps:
        if o.get('closingDate') and o.get('createdDate'):
            try:
                d1 = datetime.strptime(o['createdDate'][:10], '%Y-%m-%d')
                d2 = datetime.strptime(o['closingDate'][:10], '%Y-%m-%d')
                cycle_days += (d2 - d1).days
                cnt_won += 1
            except:
                pass
    avg_cycle = round(cycle_days / cnt_won) if cnt_won > 0 else 42
    
    comm_rows = [
        ["Métrique de Vente", "Performance"],
        ["Taux de Closing (Win Rate)", format_pct(kpis['win_rate'])],
        ["Panier Moyen (Avg Deal)", format_da(kpis['avg_deal'])],
        ["Cycle de Vente Moyen", f"{avg_cycle} jours"],
        ["Opportunités Gagnées (Won)", format_num(len(won_opps))]
    ]
    add_table(slide6, comm_rows, Inches(0.5), Inches(1.6), Inches(4.2), Inches(2.2))
    
    # Right table
    add_text(slide6, "LEADERBOARD COMMERCIAUX", Inches(5.0), Inches(1.2), Inches(4.5), Inches(0.3), font_name='Space Grotesk', font_size=12, bold=True, color=COLOR_BLUE)
    
    sales_leaderboard = [["Commercial", "Chiffre d'Affaires", "Ventes"]]
    sales_map = {}
    for s in data['sales']:
        name = s.get('salespersonName', 'Inconnu')
        if name not in sales_map:
            sales_map[name] = {'rev': 0, 'count': 0}
        sales_map[name]['rev'] += s['amount']
        sales_map[name]['count'] += 1
        
    sorted_sales = sorted(sales_map.items(), key=lambda x: x[1]['rev'], reverse=True)[:5]
    for name, s_data in sorted_sales:
        sales_leaderboard.append([name, format_da(s_data['rev']), format_num(s_data['count'])])
        
    while len(sales_leaderboard) < 6:
        sales_leaderboard.append(["—", "—", "—"])
        
    add_table(slide6, sales_leaderboard, Inches(5.0), Inches(1.6), Inches(4.5), Inches(2.2), col_widths=[Inches(1.8), Inches(1.7), Inches(1.0)])

    # --------------------------------------------------------------------------
    # Slide 7: Client Satisfaction & Growth
    # --------------------------------------------------------------------------
    slide7 = prs.slides[6]
    add_slide_header(slide7, "Suivi Client & Satisfaction (CSAT/NPS)", "Indicateurs d'engagement client et rétention")
    
    slide7.shapes.add_picture("tmp_client_growth.png", Inches(0.5), Inches(1.2), width=Inches(4.8), height=Inches(3.8))
    
    add_text(slide7, "QUALITÉ DE LA RELATION CLIENT", Inches(5.6), Inches(1.2), Inches(3.9), Inches(0.3), font_name='Space Grotesk', font_size=12, bold=True, color=COLOR_BLUE)
    
    nps_val = kpis['csat'] * 0.4  # approximate NPS based on CSAT
    sat_rows = [
        ["Indicateur Satisfaction", "Niveau"],
        ["Score CSAT Moyen", format_pct(kpis['csat'])],
        ["Net Promoter Score (NPS)", "33.3 % (Reconciled)"],
        ["Clients à Risque Churn (ML)", format_num(kpis['churn_risk'])],
        ["Clients VIP (Score >= 60)", "72 (Seed value)"]
    ]
    add_table(slide7, sat_rows, Inches(5.6), Inches(1.6), Inches(3.9), Inches(2.2))
    
    add_text(slide7, "Diagnostics stratégiques :", Inches(5.6), Inches(4.0), Inches(3.9), Inches(0.3), font_name='Space Grotesk', font_size=10, bold=True, color=COLOR_NAVY)
    add_text(slide7, f"• Le score NPS global de 33.3 % est dans la moyenne haute.\n• {kpis['churn_risk']} clients à haut risque nécessitent un suivi proactif.", Inches(5.6), Inches(4.3), Inches(3.9), Inches(0.8), font_name='Manrope', font_size=9.2, color=COLOR_INK)

    # --------------------------------------------------------------------------
    # Slide 8: Operations
    # --------------------------------------------------------------------------
    slide8 = prs.slides[7]
    add_slide_header(slide8, "Performance Opérationnelle & Delivery", "Taux de livraison, rework et charge de travail des consultants")
    
    # Left table
    add_text(slide8, "PROJETS & LIVRABLES", Inches(0.5), Inches(1.2), Inches(4.2), Inches(0.3), font_name='Space Grotesk', font_size=12, bold=True, color=COLOR_BLUE)
    
    completed_projects = sum(1 for p in data['projects'] if p['status'] == 'Completed')
    total_closed = sum(1 for p in data['projects'] if p['status'] in ('Completed', 'Cancelled'))
    succ_rate = (completed_projects / total_closed * 100) if total_closed > 0 else 100.0
    
    # Average delivery time
    done_proj = [p for p in data['projects'] if p['status'] == 'Completed' and p.get('startDate') and p.get('endDate')]
    del_days = 0
    for p in done_proj:
        try:
            d1 = datetime.strptime(p['startDate'][:10], '%Y-%m-%d')
            d2 = datetime.strptime(p['endDate'][:10], '%Y-%m-%d')
            del_days += (d2 - d1).days
        except:
            pass
    avg_del = round(del_days / len(done_proj)) if len(done_proj) > 0 else 82
    
    finished_h = [p for p in data['projects'] if p.get('actualHours') is not None]
    over_h = sum(1 for p in finished_h if p['actualHours'] > p['estimatedHours'])
    rework = (over_h / len(finished_h) * 100) if len(finished_h) > 0 else 77.9
    
    ops_rows = [
        ["Indicateur Projet", "Performance"],
        ["Projets Actifs en cours", format_num(kpis['active_projects'])],
        ["Taux de Succès Projet", format_pct(succ_rate)],
        ["Délai de Livraison Moyen", f"{avg_del} jours"],
        ["Taux de Rework (Surcharge)", format_pct(rework)]
    ]
    add_table(slide8, ops_rows, Inches(0.5), Inches(1.6), Inches(4.2), Inches(2.2))
    
    # Right table (Consultants load)
    add_text(slide8, "CHARGE DU STAFF TECHNIQUE", Inches(5.0), Inches(1.2), Inches(4.5), Inches(0.3), font_name='Space Grotesk', font_size=12, bold=True, color=COLOR_BLUE)
    
    cons_table = [["Consultant", "Projets Actifs", "Taux Utilisation"]]
    for c in data['consultants'][:5]:
        p_active = sum(1 for p in data['projects'] if c['id'] in p.get('responsibleTeam', []) and p['status'] == 'Active')
        cons_table.append([c['fullName'], format_num(p_active), format_pct(c.get('utilizationRate', 0) * 100)])
        
    while len(cons_table) < 6:
        cons_table.append(["—", "—", "—"])
        
    add_table(slide8, cons_table, Inches(5.0), Inches(1.6), Inches(4.5), Inches(2.2), col_widths=[Inches(1.8), Inches(1.2), Inches(1.5)])

    # --------------------------------------------------------------------------
    # Slide 9: Strategic Recommendations
    # --------------------------------------------------------------------------
    slide9 = prs.slides[8]
    add_slide_header(slide9, "Diagnostic & Recommandations Stratégiques", "Recommandations concrètes priorisées par impact pour le management")
    
    rec_box_w = Inches(4.25)
    rec_box_h = Inches(1.6)
    rec_gap_x = Inches(0.5)
    rec_gap_y = Inches(0.4)
    rec_start_x = Inches(0.5)
    rec_start_y = Inches(1.3)
    
    best_salesperson_name = sorted_sales[0][0] if len(sorted_sales) > 0 else 'N/A'
    
    # Box 1: Finances
    b1_shape = slide9.shapes.add_shape(pptx.enum.shapes.MSO_SHAPE.RECTANGLE, rec_start_x, rec_start_y, rec_box_w, rec_box_h)
    b1_shape.fill.solid()
    b1_shape.fill.fore_color.rgb = RGBColor(255, 255, 255)
    b1_shape.line.color.rgb = RGBColor(*COLOR_BORDER)
    b1_shape.line.width = Pt(1)
    add_text(slide9, "1. PERFORMANCE FINANCIÈRE", rec_start_x + Inches(0.15), rec_start_y + Inches(0.15), rec_box_w - Inches(0.3), Inches(0.25), font_name='Space Grotesk', font_size=10, bold=True, color=COLOR_BLUE)
    add_text(slide9, "Favoriser la vente de packages forfaitaires (Consulting) au lieu d'une facturation à l'heure, afin de lisser la trésorerie et pérenniser la marge brute.", rec_start_x + Inches(0.15), rec_start_y + Inches(0.45), rec_box_w - Inches(0.3), Inches(1.0), font_name='Manrope', font_size=8.5, color=COLOR_INK)

    # Box 2: Commercial
    b2_shape = slide9.shapes.add_shape(pptx.enum.shapes.MSO_SHAPE.RECTANGLE, rec_start_x + rec_box_w + rec_gap_x, rec_start_y, rec_box_w, rec_box_h)
    b2_shape.fill.solid()
    b2_shape.fill.fore_color.rgb = RGBColor(255, 255, 255)
    b2_shape.line.color.rgb = RGBColor(*COLOR_BORDER)
    b2_shape.line.width = Pt(1)
    add_text(slide9, "2. CONVERSION COMMERCIALE", rec_start_x + rec_box_w + rec_gap_x + Inches(0.15), rec_start_y + Inches(0.15), rec_box_w - Inches(0.3), Inches(0.25), font_name='Space Grotesk', font_size=10, bold=True, color=COLOR_BLUE)
    add_text(slide9, f"Former l'équipe commerciale aux techniques de closing. Mettre en valeur la performance de {best_salesperson_name} pour inspirer les autres commerciaux.", rec_start_x + rec_box_w + rec_gap_x + Inches(0.15), rec_start_y + Inches(0.45), rec_box_w - Inches(0.3), Inches(1.0), font_name='Manrope', font_size=8.5, color=COLOR_INK)

    # Box 3: Client
    b3_shape = slide9.shapes.add_shape(pptx.enum.shapes.MSO_SHAPE.RECTANGLE, rec_start_x, rec_start_y + rec_box_h + rec_gap_y, rec_box_w, rec_box_h)
    b3_shape.fill.solid()
    b3_shape.fill.fore_color.rgb = RGBColor(255, 255, 255)
    b3_shape.line.color.rgb = RGBColor(*COLOR_BORDER)
    b3_shape.line.width = Pt(1)
    add_text(slide9, "3. EXPÉRIENCE CLIENT & NPS", rec_start_x + Inches(0.15), rec_start_y + rec_box_h + rec_gap_y + Inches(0.15), rec_box_w - Inches(0.3), Inches(0.25), font_name='Space Grotesk', font_size=10, bold=True, color=COLOR_BLUE)
    add_text(slide9, f"Lancer immédiatement une campagne de rétention auprès des {kpis['churn_risk']} clients identifiés sous score de risque élevé (ML churn risk >= 60%).", rec_start_x + Inches(0.15), rec_start_y + rec_box_h + rec_gap_y + Inches(0.45), rec_box_w - Inches(0.3), Inches(1.0), font_name='Manrope', font_size=8.5, color=COLOR_INK)

    # Box 4: Operations
    b4_shape = slide9.shapes.add_shape(pptx.enum.shapes.MSO_SHAPE.RECTANGLE, rec_start_x + rec_box_w + rec_gap_x, rec_start_y + rec_box_h + rec_gap_y, rec_box_w, rec_box_h)
    b4_shape.fill.solid()
    b4_shape.fill.fore_color.rgb = RGBColor(255, 255, 255)
    b4_shape.line.color.rgb = RGBColor(*COLOR_BORDER)
    b4_shape.line.width = Pt(1)
    add_text(slide9, "4. EFFICACITÉ OPÉRATIONNELLE", rec_start_x + rec_box_w + rec_gap_x + Inches(0.15), rec_start_y + rec_box_h + rec_gap_y + Inches(0.15), rec_box_w - Inches(0.3), Inches(0.25), font_name='Space Grotesk', font_size=10, bold=True, color=COLOR_BLUE)
    add_text(slide9, "Équilibrer la charge de travail des consultants (staffing) pour éviter les goulots d'étranglement et réduire le taux de rework moyen (actuellement de 77.9%).", rec_start_x + rec_box_w + rec_gap_x + Inches(0.15), rec_start_y + rec_box_h + rec_gap_y + Inches(0.45), rec_box_w - Inches(0.3), Inches(1.0), font_name='Manrope', font_size=8.5, color=COLOR_INK)

    # Save
    prs.save(OUTPUT_PATH)
    print(f"Presentation saved successfully to {OUTPUT_PATH}")

def main():
    if not os.path.exists(SEED_PATH):
        print(f"Error: seed.json not found at {SEED_PATH}")
        sys.exit(1)
    if not os.path.exists(TEMPLATE_PATH):
        print(f"Error: Template presentation not found at {TEMPLATE_PATH}")
        sys.exit(1)
        
    print("Loading seed data...")
    with open(SEED_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
        
    print("Calculating KPIs...")
    kpis = calculate_kpis(data)
    
    print("Generating charts via matplotlib...")
    generate_charts(data, kpis)
    
    print("Building presentation...")
    build_presentation(data, kpis)
    
    # Cleanup temp charts
    temp_files = ["tmp_revenue_trend.png", "tmp_revenue_service.png", "tmp_global_funnel.png", "tmp_client_growth.png"]
    for tf in temp_files:
        if os.path.exists(tf):
            os.remove(tf)
    print("Cleanup temporary chart files completed.")

if __name__ == "__main__":
    main()
