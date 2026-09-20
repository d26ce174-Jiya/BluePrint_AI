export const contextNormalizer = {
  normalize({ rawText = '', existingContext = null }) {
    const goals = existingContext?.goals || 'Automate and transform legacy workflow procedures.';
    const constraintsText = existingContext?.constraints_text || 'Standard compliance and budgetary guardrails.';
    const stakeholders = existingContext?.stakeholders || 'Product Owner, Engineering Team, Department Heads';
    const existingSystems = existingContext?.existing_systems || 'Spreadsheets, Legacy ERP, Email notifications';

    return {
      goals,
      constraintsText,
      stakeholders,
      existingSystems,
      rawSummary: rawText.slice(0, 1000)
    };
  }
};
