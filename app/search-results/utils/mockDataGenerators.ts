import { CustomField } from '@/lib/database.types';
import { AIResponse, PaperStatus } from '../types';

export const generateMockStatus = (): PaperStatus => {
  // Always return pending status initially
  return { type: 'pending', text: 'Pending' };
};

export const generateMockAIResponse = (field: CustomField): AIResponse => {
  if (field.type === 'multi_select') {
    const options = field.options || [];
    const selectedCount = Math.floor(Math.random() * 2) + 1;
    const selected = options.sort(() => 0.5 - Math.random()).slice(0, selectedCount);
    return {
      value: selected,
      confidence: Math.random() * 0.3 + 0.7, // 70-100% confidence
      citations: [
        { text: "Based on abstract analysis", location: "Abstract, lines 3-5" },
        { text: "Methods section indicates", location: "Methods, paragraph 2" }
      ]
    };
  }
  
  if (field.type === 'text') {
    const sampleTexts: Record<string, string[]> = {
      biomarker_selection: [
        "The study does not require molecular, genetic, or proteomic biomarker selection for enrollment or treatment allocation",
        "Eligibility criteria require a documented diagnosis of Primary Hyperoxaluria Type 1 (PH1) confirmed by genotyping",
        "Patients must have HER2-positive breast cancer confirmed by IHC 3+ or FISH amplification",
        "EGFR mutation status (exon 19 deletion or L858R) required for enrollment"
      ],
      patient_population: [
        "Adults aged 45-65 with Type 2 diabetes",
        "Pediatric patients with acute lymphoblastic leukemia",
        "Healthy volunteers aged 18-35"
      ],
      primary_endpoint: [
        "Overall survival at 24 months",
        "Progression-free survival compared to standard of care",
        "Complete response rate at 6 months",
        "Change in tumor size from baseline"
      ],
      techniques: [
        "Western blot, qPCR, immunofluorescence microscopy",
        "CRISPR-Cas9 gene editing, flow cytometry",
        "Mass spectrometry, protein crystallography"
      ],
      main_findings: [
        "Treatment reduced symptoms by 45% compared to placebo",
        "Novel pathway identified linking protein X to disease progression",
        "Meta-analysis shows consistent effect across 12 studies"
      ]
    };
    
    const texts = sampleTexts[field.id] || ["Sample generated text for " + field.name];
    return {
      value: texts[Math.floor(Math.random() * texts.length)],
      confidence: Math.random() * 0.2 + 0.75, // 75-95% confidence
      citations: [
        { text: "Extracted from results", location: "Results, Table 2" }
      ]
    };
  }
  
  if (field.type === 'number') {
    const value = field.id === 'sample_size' 
      ? Math.floor(Math.random() * 500) + 50
      : field.id === 'studies_included'
      ? Math.floor(Math.random() * 50) + 10
      : Math.floor(Math.random() * 100);
      
    return {
      value: value,
      confidence: Math.random() * 0.1 + 0.85, // 85-95% confidence
      citations: [
        { text: "From study design section", location: "Methods, Study Design" }
      ]
    };
  }
  
  if (field.type === 'select') {
    const options = field.options || [];
    return {
      value: options[Math.floor(Math.random() * options.length)],
      confidence: Math.random() * 0.2 + 0.8, // 80-100% confidence
      citations: [
        { text: "Identified in methodology", location: "Methods, paragraph 1" }
      ]
    };
  }
  
  if (field.type === 'boolean') {
    return {
      value: Math.random() > 0.5,
      confidence: Math.random() * 0.15 + 0.85, // 85-100% confidence
      citations: [
        { text: "Confirmed in study design", location: "Abstract, first paragraph" }
      ]
    };
  }
  
  // Default response
  return {
    value: null,
    confidence: 0,
    citations: []
  };
}; 