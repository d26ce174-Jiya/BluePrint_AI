import { useState, useEffect } from 'react';

/**
 * i18n.js — Comprehensive Multilingual Translation & Prompt Adaptation Engine
 * Supports: English (en), हिन्दी (hi), ગુજરાતી (gu), Español (es), Français (fr)
 */

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
];

export const TRANSLATIONS = {
  en: {
    // Brand & Common
    appName: 'Compile AI',
    tagline: 'Turn messy business input into commit-ready blueprints and deployed live solutions in seconds.',
    startSession: 'Start Transformation Blueprint',
    newBlueprint: 'New Blueprint',
    dashboard: 'Dashboard',
    architecture: 'Architecture',
    templates: 'Templates',
    pricing: 'Pricing',
    credits: 'Credits',
    creditsAvailable: 'Credits Available',
    loading: 'Loading AI Blueprint...',
    save: 'Save Changes',
    cancel: 'Cancel',
    confirm: 'Confirm',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    readOnlyMode: 'Read-Only Mode',

    // Roles & RBAC
    roles: {
      admin: 'Admin (Full Deploy & Approvals)',
      developer: 'Developer (Edit Code & Architecture)',
      viewer: 'Viewer (Read-Only Preview)',
      adminDesc: 'Can deploy to Vercel/Render, approve blueprints, and manage configurations.',
      developerDesc: 'Can inspect and customize code, generate sections, and review architecture.',
      viewerDesc: 'Read-only access to blueprints and diagrams. Cannot edit code or deploy.',
    },
    rbac: {
      viewerNotice: 'You are viewing in Read-Only Mode. Switch to Developer or Admin to create or edit blueprints.',
      deployDeniedTitle: 'Production Deployment Restricted',
      deployDeniedMsg: 'Deploying live solutions to Vercel and Render requires Admin privileges. As a Viewer or Developer, you can test the prototype in the in-browser sandbox.',
      editDeniedTitle: 'Code Customization Restricted',
      editDeniedMsg: 'Code editing and natural language customization are disabled for Viewer role.',
      approveDeniedTitle: 'Approval Gate Restricted',
      approveDeniedMsg: 'Sign-off and stakeholder blueprint approval requires Developer or Admin role.',
      upgradeRole: 'Switch Role to Admin',
    },

    // Landing Page
    landing: {
      badge: 'Chaos2Commit Enterprise AI',
      heroTitle: 'Transform Messy Requirements into Commit-Ready Blueprints & Live Apps',
      heroSub: 'AI-native business analysis that converts unstructured documents, SOPs, and ideas into complete executive BRDs, cloud architectures, database schemas, and 1-click live deployable applications.',
      ctaPrimary: 'Start Free Blueprint',
      ctaSecondary: 'View Live Demo',
      statBlueprints: 'Blueprints Compiled',
      statSpeed: 'Avg Compilation Time',
      statAccuracy: 'Enterprise Architecture Accuracy',
      featureArch: 'Cloud Architecture & Topology',
      featureArchDesc: 'Multi-cloud HLD diagrams, decoupled microservices, API gateways, and Redis cache clusters.',
      featureBpmn: 'BPMN 2.0 Process Intelligence',
      featureBpmnDesc: 'Formal swimlane workflows with automated decision gates, SLA timers, and escalation triggers.',
      featureDb: 'Relational Database & ERD',
      featureDbDesc: 'Production PostgreSQL and MySQL schemas with primary/foreign keys, UUIDs, and Mermaid ERDs.',
      featureSandbox: 'Working Solution Sandbox',
      featureSandboxDesc: 'Interactive prototype web app with post-generation customization and 1-click deploy to Vercel/Render.',
    },

    // Input Screen
    input: {
      breadcrumbHome: 'Dashboard',
      breadcrumbNew: 'New Blueprint',
      stageIntake: 'Stage 1: Business Intake',
      title: 'Business Transformation Intake',
      subtitle: 'Convert your business idea, legacy challenge, or operational SOP into an implementation-ready enterprise blueprint.',
      stepIndicator: 'Step 1 of 3: Context Intake',
      langLabel: 'Input / Output Language',
      quickDemo: 'Quick Demo:',
      modes: {
        text: '1. Text Idea',
        textDesc: 'Describe problem or use templates',
        doc: '2. Upload Doc [PDF/PPT]',
        docDesc: 'PDF, DOCX, PPTX extraction',
        url: '3. Paste URL',
        urlDesc: 'Webpage SOP scraper & specs',
        voice: '4. Voice Record',
        voiceDesc: 'Audio recording & transcription',
      },
      archetypes: 'Quick-Start Transformation Archetypes (Click to Auto-Fill)',
      sectionIdentity: '1. Project Title & Industry Domain',
      projectTitleLabel: 'Project Title',
      projectTitlePlaceholder: 'e.g. Enterprise Cloud Automation & Microservices',
      industryLabel: 'Industry Sector',
      sectionProblem: '2. Operational Workflow & Pain Points',
      problemPlaceholder: 'Provide detailed business context:\n• What is the current manual or legacy workflow?\n• What are the key bottlenecks or pain points?\n• What is the desired future state and target automation outcome?\n• Are there any specific integration points (e.g. SAP, Salesforce, Microsoft 365, internal SQL)?',
      sectionSystems: '3. Existing Tools & Legacy Constraints',
      systemsLabel: 'Current Systems & ERPs',
      systemsPlaceholder: 'e.g. Oracle ERP, Physical Registers, WhatsApp, Excel Spreadsheets',
      sectionCloud: '4. Target Infrastructure & Cloud Provider',
      submitBtn: 'Proceed to Discovery Q&A Analysis →',
      submitting: 'Synthesizing with Compile AI...',
      advisoryNote: 'Advisory recommendations generated by Chaos2Commit AI',
    },

    // Discovery Chat
    discovery: {
      title: 'Requirement Understanding & Discovery Loop',
      subtitle: 'Compile AI has analyzed your input and detected areas that need operational clarification before generating the architecture.',
      questionBadge: 'Clarifying Question',
      submitAnswers: 'Save Answers & Compile Solution Blueprint',
      compiling: 'Compiling Full Enterprise Blueprint (Deducting 1 Credit)...',
      answeredCount: 'Questions Answered',
      tip: 'Answering these questions produces higher-precision database schemas and automated workflows.',
    },

    // Result Screen & Deliverables
    result: {
      approvalBannerPending: 'Pending Stakeholder Approval',
      approvalBannerText: 'Review the architecture, database schema, and process models before proceeding to working code generation.',
      approveBtn: '✅ APPROVE BLUEPRINT & BUILD CODE',
      approvedBadge: 'Approved by Stakeholder',
      approvedTime: 'Code Generation & Deploy Sandbox Unlocked',
      exportBtn: 'Export Deliverables',
      exportPdf: 'Executive PDF Document (.pdf)',
      exportWord: 'Word Deliverable (.docx)',
      exportJson: 'OpenAPI & Architecture JSON (.json)',
      tabs: {
        brd: '1. Executive BRD',
        architecture: '2. System Architecture',
        bpmn: '3. BPMN Process',
        database: '4. Database & APIs',
        wireframes: '5. AI Wireframes',
        estimates: '6. Effort & Cost',
      },
      whyRecommended: 'Why AI Recommended This',
      assumption: 'Underlying Assumption',
      evidence: 'Evidence from Input',
      regenerate: 'Regenerate Section',
      regenerating: 'Regenerating...',
    },

    // Working Solution Sandbox & Deploy
    sandbox: {
      title: 'Interactive Working Solution Sandbox',
      subtitle: 'Full in-browser working prototype with live search, filters, actions, and 1-click cloud deployment.',
      deployVercel: '🚀 Deploy to Vercel',
      deployRender: '⚡ Deploy to Render',
      customPromptPlaceholder: 'Tell AI what to customize (e.g., "Change color to emerald", "Add delete button", "Add export CSV")',
      applyCustomPrompt: 'Update App',
      customizing: 'Applying AI Customization...',
      liveUrlLabel: 'Live Production URL',
      openLiveLink: 'Open Live Application ↗',
      copyUrl: 'Copy Link',
      copied: 'Copied!',
      sourceCode: 'Production Source Code',
      frontendCode: 'React Component',
      backendCode: 'Express Controller',
      dbCode: 'SQL Schema (DDL)',
    },

    // Pricing Page
    pricingPage: {
      balanceBadge: 'Credits Balance',
      headline: 'Predictable, Transparent Pricing for Enterprise Blueprints',
      subhead: 'Turn messy business requirements into complete, production-ready blueprints and deployed live solutions in seconds.',
      monthly: 'Monthly Billing',
      annual: 'Annual Billing (Save 20%)',
      currentPlan: 'Current Active Plan',
      upgradeBtn: 'Upgrade Plan',
      checkoutTitle: 'Authorize & Activate Subscription',
      orderSummary: 'Order Summary',
      payNow: 'Complete Checkout & Recharge Credits',
      processingPayment: 'Authorizing with Payment Gateway...',
      paymentSuccess: 'Payment Successful! Credits Added to Account.',
      freePlanName: 'Free Community',
      starterPlanName: 'Starter Professional',
      enterprisePlanName: 'Enterprise Scale',
    },

    // Sample Prompts
    samplePrompts: {
      smartGovernance: 'Smart Citizen E-Governance Services: Automate municipal trade licenses, public grievance redressal, and civic certificate issuance. Need automated digital verification, citizen portal, approval workflow queue, and automated status alerts.',
      hrConsultancy: 'HR & Employee Onboarding System: Need automated candidate document collection, background verification workflow, role-based offer letter generation, payroll integration with tax calculations, and self-service employee portal for 250+ employees.',
    },
  },

  hi: {
    // Brand & Common
    appName: 'कम्पाइल एआई',
    tagline: 'अव्यवस्थित व्यावसायिक इनपुट को सेकंडों में रेडी-टू-डिप्लॉय ब्लूप्रिंट और लाइव समाधान में बदलें।',
    startSession: 'समाधान ब्लूप्रिंट शुरू करें',
    newBlueprint: 'नया ब्लूप्रिंट',
    dashboard: 'डैशबोर्ड',
    architecture: 'आर्किटेक्चर',
    templates: 'टेम्पलेट्स',
    pricing: 'मूल्य निर्धारण',
    credits: 'क्रेडिट्स',
    creditsAvailable: 'क्रेडिट्स उपलब्ध',
    loading: 'एआई ब्लूप्रिंट तैयार हो रहा है...',
    save: 'परिवर्तन सहेजें',
    cancel: 'रद्द करें',
    confirm: 'पुष्टि करें',
    close: 'बंद करें',
    back: 'पीछे',
    next: 'आगे',
    readOnlyMode: 'केवल देखने योग्य मोड (रीड-ओनली)',

    // Roles & RBAC
    roles: {
      admin: 'एडमिन (पूर्ण अधिकार एवं डिप्लॉय)',
      developer: 'डेवलपर (कोड एवं आर्किटेक्चर संपादन)',
      viewer: 'दर्शक (केवल देखें - रीड-ओनली)',
      adminDesc: 'वर्सेल/रेंडर पर डिप्लॉय कर सकते हैं, ब्लूप्रिंट अनुमोदित कर सकते हैं और सिस्टम कॉन्फ़िगर कर सकते हैं।',
      developerDesc: 'कोड का निरीक्षण और कस्टमाइज़ कर सकते हैं, अनुभाग तैयार कर सकते हैं और आर्किटेक्चर की समीक्षा कर सकते हैं।',
      viewerDesc: 'केवल ब्लूप्रिंट और आरेख देख सकते हैं। कोड संपादित या डिप्लॉय नहीं कर सकते।',
    },
    rbac: {
      viewerNotice: 'आप केवल देखने योग्य मोड में हैं। ब्लूप्रिंट बनाने या संपादित करने के लिए डेवलपर या एडमिन पर स्विच करें।',
      deployDeniedTitle: 'प्रोडक्शन डिप्लॉयमेंट प्रतिबंधित है',
      deployDeniedMsg: 'लाइव समाधान को वर्सेल या रेंडर पर डिप्लॉय करने के लिए एडमिन अनुमतियों की आवश्यकता है। दर्शक या डेवलपर के रूप में आप इन-ब्राउज़र सैंडबॉक्स में परीक्षण कर सकते हैं।',
      editDeniedTitle: 'कोड संपादन प्रतिबंधित है',
      editDeniedMsg: 'दर्शक (Viewer) भूमिका के लिए कोड संपादन और भाषा कस्टमाइज़ेशन अक्षम है।',
      approveDeniedTitle: 'अनुमोदन गेट प्रतिबंधित है',
      approveDeniedMsg: 'ब्लूप्रिंट अनुमोदन के लिए डेवलपर या एडमिन भूमिका की आवश्यकता होती है।',
      upgradeRole: 'एडमिन भूमिका पर स्विच करें',
    },

    // Landing Page
    landing: {
      badge: 'Chaos2Commit एंटरप्राइज एआई',
      heroTitle: 'कच्ची आवश्यकताओं को सेकंडों में कमिट-रेडी ब्लूप्रिंट और लाइव ऐप्स में बदलें',
      heroSub: 'एआई-संचालित व्यावसायिक विश्लेषण जो असंरचित दस्तावेज़ों, एसओपी और विचारों को विस्तृत बीआरडी, क्लाउड आर्किटेक्चर, डेटाबेस स्कीमा और 1-क्लिक लाइव ऐप्स में बदलता है।',
      ctaPrimary: 'निःशुल्क ब्लूप्रिंट शुरू करें',
      ctaSecondary: 'लाइव डेमो देखें',
      statBlueprints: 'तैयार किए गए ब्लूप्रिंट्स',
      statSpeed: 'औसत गति',
      statAccuracy: 'एंटरप्राइज सटीकता',
      featureArch: 'क्लाउड आर्किटेक्चर और टोपोलॉजी',
      featureArchDesc: 'मल्टी-क्लाउड एचएलडी आरेख, माइक्रो-सर्विसेज, एपीआई गेटवे और रेडिस क्लस्टर।',
      featureBpmn: 'BPMN 2.0 प्रक्रिया विश्लेषण',
      featureBpmnDesc: 'स्वचालित निर्णय गेट्स, एसएलए टाइमर और एस्केलेशन ट्रिगर्स के साथ संपूर्ण वर्कफ़्लो।',
      featureDb: 'रिलेशनल डेटाबेस और ईआरडी',
      featureDbDesc: 'प्राथमिक/विदेशी कुंजी और मरमेड ईआरडी के साथ पोस्टग्रेएसक्यूएल और माईएसक्यूएल स्कीमा।',
      featureSandbox: 'कार्यशील समाधान सैंडबॉक्स',
      featureSandboxDesc: 'कस्टमाइज़ेशन और वर्सेल/रेंडर पर 1-क्लिक डिप्लॉय के साथ इंटरैक्टिव प्रोटोटाइप ऐप।',
    },

    // Input Screen
    input: {
      breadcrumbHome: 'डैशबोर्ड',
      breadcrumbNew: 'नया ब्लूप्रिंट',
      stageIntake: 'चरण 1: व्यावसायिक इनपुट',
      title: 'व्यावसायिक परिवर्तन इनपुट',
      subtitle: 'अपने व्यावसायिक विचार, प्रक्रिया या एसओपी को कार्यान्वयन-तैयार एंटरप्राइज ब्लूप्रिंट में बदलें।',
      stepIndicator: 'चरण 1 का 3: इनपुट संदर्भ',
      langLabel: 'इनपुट / आउटपुट भाषा',
      quickDemo: 'त्वरित डेमो:',
      modes: {
        text: '1. टेक्स्ट विचार',
        textDesc: 'समस्या का वर्णन करें या टेम्पलेट का उपयोग करें',
        doc: '2. दस्तावेज़ अपलोड करें [PDF/PPT]',
        docDesc: 'पीडीएफ, डॉक्स, पीपीटी से डेटा निकालें',
        url: '3. यूआरएल पेस्ट करें',
        urlDesc: 'वेबपेज एसओपी स्क्रैपर और विवरण',
        voice: '4. वॉइस रिकॉर्ड करें',
        voiceDesc: 'लाइव ऑडियो रिकॉर्डिंग और ट्रांसक्रिप्शन',
      },
      archetypes: 'त्वरित-प्रारंभ ट्रांसफॉर्मेशन आर्केटाइप्स (ऑटो-फिल करने के लिए क्लिक करें)',
      sectionIdentity: '1. प्रोजेक्ट का शीर्षक और उद्योग क्षेत्र',
      projectTitleLabel: 'प्रोजेक्ट का शीर्षक',
      projectTitlePlaceholder: 'उदा. क्लाउड ऑटोमेशन और माइक्रोसर्विसेज प्लेटफॉर्म',
      industryLabel: 'उद्योग क्षेत्र',
      sectionProblem: '2. संचालन वर्कफ़्लो और मुख्य चुनौतियाँ',
      problemPlaceholder: 'विस्तृत व्यावसायिक संदर्भ प्रदान करें:\n• वर्तमान मैन्युअल प्रक्रिया क्या है?\n• मुख्य बाधाएं या विलंब कहाँ हैं?\n• लक्षित स्वचालन परिणाम क्या है?\n• क्या कोई विशिष्ट एकीकरण बिंदु हैं (उदा. SAP, Salesforce, आंतरिक SQL)?',
      sectionSystems: '3. मौजूदा सिस्टम और लीगेसी टूल्स',
      systemsLabel: 'वर्तमान सॉफ्टवेयर / ईआरपी',
      systemsPlaceholder: 'उदा. ओरैकल ईआरपी, भौतिक रजिस्टर, व्हाट्सएप, एक्सेल स्प्रेडशीट',
      sectionCloud: '4. लक्षित क्लाउड इंफ्रास्ट्रक्चर',
      submitBtn: 'डिस्कवरी प्रश्नोत्तरी विश्लेषण की ओर बढ़ें →',
      submitting: 'कम्पाइल एआई विश्लेषण कर रहा है...',
      advisoryNote: 'Chaos2Commit एआई द्वारा अनुशंसित सलाहकार ब्लूप्रिंट',
    },

    // Discovery Chat
    discovery: {
      title: 'आवश्यकता समझ और डिस्कवरी लूप',
      subtitle: 'कम्पाइल एआई ने आपके इनपुट का विश्लेषण किया है और आर्किटेक्चर तैयार करने से पहले कुछ व्यावहारिक स्पष्टीकरणों की पहचान की है।',
      questionBadge: 'स्पष्टीकरण प्रश्न',
      submitAnswers: 'उत्तर सहेजें और समाधान ब्लूप्रिंट तैयार करें',
      compiling: 'पूर्ण एंटरप्राइज ब्लूप्रिंट तैयार हो रहा है (1 क्रेडिट काटा गया)...',
      answeredCount: 'प्रश्नों के उत्तर दिए गए',
      tip: 'इन सवालों के जवाब देने से अधिक सटीक डेटाबेस स्कीमा और स्वचालित वर्कफ़्लो तैयार होते हैं।',
    },

    // Result Screen & Deliverables
    result: {
      approvalBannerPending: 'हितधारक अनुमोदन प्रतीक्षित',
      approvalBannerText: 'कोड निर्माण के साथ आगे बढ़ने से पहले आर्किटेक्चर, डेटाबेस स्कीमा और प्रक्रिया मॉडल की समीक्षा करें।',
      approveBtn: '✅ ब्लूप्रिंट स्वीकृत करें और कोड बनाएं',
      approvedBadge: 'हितधारक द्वारा स्वीकृत',
      approvedTime: 'कोड जेनरेशन और डिप्लॉय सैंडबॉक्स अनलॉक हो गया है',
      exportBtn: 'दस्तावेज़ निर्यात करें',
      exportPdf: 'कार्यकारी पीडीएफ दस्तावेज़ (.pdf)',
      exportWord: 'वर्ड दस्तावेज़ (.docx)',
      exportJson: 'ओपनएपीआई और आर्किटेक्चर जेएसओएन (.json)',
      tabs: {
        brd: '1. कार्यकारी बीआरडी (BRD)',
        architecture: '2. सिस्टम आर्किटेक्चर',
        bpmn: '3. BPMN प्रक्रिया',
        database: '4. डेटाबेस और एपीआई',
        wireframes: '5. एआई वायरफ्रेम्स',
        estimates: '6. लागत और रोडमैप',
      },
      whyRecommended: 'एआई ने यह सिफारिश क्यों की',
      assumption: 'अंतर्निहित धारणा',
      evidence: 'इनपुट से साक्ष्य',
      regenerate: 'अनुभाग पुनः उत्पन्न करें',
      regenerating: 'पुनः उत्पन्न हो रहा है...',
    },

    // Working Solution Sandbox & Deploy
    sandbox: {
      title: 'इंटरैक्टिव कार्यशील समाधान सैंडबॉक्स',
      subtitle: 'लाइव खोज, फिल्टर, क्रियाओं और 1-क्लिक क्लाउड डिप्लॉयमेंट के साथ संपूर्ण इन-ब्राउज़र कार्यशील प्रोटोटाइप।',
      deployVercel: '🚀 वर्सेल (Vercel) पर डिप्लॉय करें',
      deployRender: '⚡ रेंडर (Render) पर डिप्लॉय करें',
      customPromptPlaceholder: 'कस्टमाइज़ करने के लिए कहें (उदा. "रंग हरा करें", "डिलीट बटन जोड़ें", "सीएसवी निर्यात जोड़ें")',
      applyCustomPrompt: 'ऐप अपडेट करें',
      customizing: 'एआई कस्टमाइज़ेशन लागू कर रहा है...',
      liveUrlLabel: 'लाइव प्रोडक्शन यूआरएल (URL)',
      openLiveLink: 'लाइव एप्लिकेशन खोलें ↗',
      copyUrl: 'लिंक कॉपी करें',
      copied: 'कॉपी हो गया!',
      sourceCode: 'प्रोडक्शन-रेडी सोर्स कोड',
      frontendCode: 'रिएक्ट (React) कंपोनेंट',
      backendCode: 'एक्सप्रेस (Express) कंट्रोलर',
      dbCode: 'एसक्यूएल स्कीमा (DDL)',
    },

    // Pricing Page
    pricingPage: {
      balanceBadge: 'क्रेडिट्स शेष',
      headline: 'एंटरप्राइज ब्लूप्रिंट्स के लिए पारदर्शी और पूर्वानुमानित मूल्य निर्धारण',
      subhead: 'व्यावसायिक आवश्यकताओं को सेकंडों में उत्पादन-तैयार ब्लूप्रिंट और डिप्लॉयड समाधानों में बदलें।',
      monthly: 'मासिक बिलिंग',
      annual: 'वार्षिक बिलिंग (20% की बचत)',
      currentPlan: 'वर्तमान सक्रिय योजना',
      upgradeBtn: 'योजना अपग्रेड करें',
      checkoutTitle: 'सदस्यता अधिकृत करें और सक्रिय करें',
      orderSummary: 'ऑर्डर सारांश',
      payNow: 'चेकआउट पूरा करें और क्रेडिट रिचार्ज करें',
      processingPayment: 'पेमेंट गेटवे के साथ प्रमाणीकरण हो रहा है...',
      paymentSuccess: 'भुगतान सफल! आपके खाते में क्रेडिट जोड़ दिए गए हैं।',
      freePlanName: 'फ्री कम्युनिटी',
      starterPlanName: 'स्टार्टर प्रोफेशनल',
      enterprisePlanName: 'एंटरप्राइज स्केल',
    },

    // Sample Prompts
    samplePrompts: {
      smartGovernance: 'स्मार्ट सिटी ई-गवर्नेंस नागरिक सेवा पोर्टल: सार्वजनिक शिकायत निवारण, नगर निगम व्यापार लाइसेंस और नागरिक प्रमाण पत्र स्वीकृति का स्वचालन। हमें ऑनलाइन नागरिक पोर्टल, स्वचालित दस्तावेज़ सत्यापन, बहु-स्तरीय स्वीकृति वर्कफ़्लो और एसएमएस/ईमेल अलर्ट सिस्टम की आवश्यकता है।',
      hrConsultancy: 'एचआर एवं कर्मचारी ऑनबोर्डिंग सिस्टम: नए कर्मचारियों के दस्तावेज़ सत्यापन, बायोमेट्रिक उपस्थिति, स्वचालित वेतन और पेरोल एकीकरण, तथा 250+ कर्मचारियों के लिए लीव मैनेजमेंट पोर्टल का स्वचालन।',
    },
  },

  gu: {
    // Brand & Common
    appName: 'કમ્પાઇલ એઆઇ',
    tagline: 'અસ્પષ્ટ બિઝનેસ જરૂરિયાતોને સેકન્ડોમાં પ્રોડક્શન-રેડી બ્લુપ્રિન્ટ અને લાઇવ સોલ્યુશનમાં ફેરવો.',
    startSession: 'સોલ્યુશન બ્લુપ્રિન્ટ શરૂ કરો',
    newBlueprint: 'નવી બ્લુપ્રિન્ટ',
    dashboard: 'ડેશબોર્ડ',
    architecture: 'આર્કિટેક્ચર',
    templates: 'ટેમ્પલેટ્સ',
    pricing: 'કિંમતો',
    credits: 'ક્રેડિટ્સ',
    creditsAvailable: 'ક્રેડિટ્સ ઉપલબ્ધ',
    loading: 'AI બ્લુપ્રિન્ટ તૈયાર થઈ રહી છે...',
    save: 'ફેરફારો સાચવો',
    cancel: 'રદ કરો',
    confirm: 'પુષ્ટિ કરો',
    close: 'બંધ કરો',
    back: 'પાછા',
    next: 'આગળ',
    readOnlyMode: 'ફક્ત વાંચવા યોગ્ય મોડ (રીડ-ઓન્લી)',

    // Roles & RBAC
    roles: {
      admin: 'એડમિન (સંપૂર્ણ ડિપ્લોય અને મંજૂરીઓ)',
      developer: 'ડેવલપર (કોડ અને આર્કિટેક્ચર એડિટ)',
      viewer: 'દર્શક (ફક્ત જુઓ - રીડ-ઓન્લી)',
      adminDesc: 'Vercel/Render પર ડિપ્લોય કરી શકે છે, બ્લુપ્રિન્ટ મંજૂર કરી શકે છે અને સેટિંગ્સ મેનેજ કરી શકે છે.',
      developerDesc: 'કોડ ચકાસી અને કસ્ટમાઇઝ કરી શકે છે, વિભાગો બનાવી શકે છે અને આર્કિટેક્ચર રિવ્યુ કરી શકે છે.',
      viewerDesc: 'ફક્ત બ્લુપ્રિન્ટ અને ડાયાગ્રામ જોઈ શકે છે. કોડ એડિટ કે ડિપ્લોય કરી શકાતો નથી.',
    },
    rbac: {
      viewerNotice: 'તમે રીડ-ઓન્લી મોડમાં છો. બ્લુપ્રિન્ટ બનાવવા અથવા એડિટ કરવા માટે ડેવલપર અથવા એડમિન પર સ્વિચ કરો.',
      deployDeniedTitle: 'પ્રોડક્શન ડિપ્લોયમેન્ટ પ્રતિબંધિત છે',
      deployDeniedMsg: 'Vercel અથવા Render પર લાઇવ ડિપ્લોય કરવા માટે એડમિન પરવાનગી જરૂરી છે. દર્શક કે ડેવલપર તરીકે તમે બ્રાઉઝર સેન્ડબોક્સમાં ટેસ્ટ કરી શકો છો.',
      editDeniedTitle: 'કોડ એડિટ પ્રતિબંધિત છે',
      editDeniedMsg: 'દર્શક (Viewer) રોલ માટે કોડ એડિટિંગ અને કસ્ટમાઇઝેશન અક્ષમ છે.',
      approveDeniedTitle: 'મંજૂરી પ્રતિબંધિત છે',
      approveDeniedMsg: 'બ્લુપ્રિન્ટ મંજૂર કરવા માટે ડેવલપર અથવા એડમિન રોલ હોવો જરૂરી છે.',
      upgradeRole: 'એડમિન રોલ પર સ્વિચ કરો',
    },

    // Landing Page
    landing: {
      badge: 'Chaos2Commit એન્ટરપ્રાઇઝ AI',
      heroTitle: 'કાચી બિઝનેસ જરૂરિયાતોને કમિટ-રેડી બ્લુપ્રિન્ટ્સ અને લાઇવ એપ્સમાં ફેરવો',
      heroSub: 'AI-સંચાલિત બિઝનેસ વિશ્લેષણ જે અસંગઠિત દસ્તાવેજો અને SOPs ને સંપૂર્ણ BRD, ક્લાઉડ આર્કિટેક્ચર, ડેટાબેઝ સ્કીમા અને 1-ક્લિક લાઇવ એપ્સમાં ફેરવે છે.',
      ctaPrimary: 'મફત બ્લુપ્રિન્ટ શરૂ કરો',
      ctaSecondary: 'લાઇવ ડેમો જુઓ',
      statBlueprints: 'તૈયાર થયેલ બ્લુપ્રિન્ટ્સ',
      statSpeed: 'સરેરાશ ઝડપ',
      statAccuracy: 'એન્ટરપ્રાઇઝ ચોકસાઈ',
      featureArch: 'ક્લાઉડ આર્કિટેક્ચર અને ટોપોલોજી',
      featureArchDesc: 'મલ્ટી-ક્લાઉડ HLD ડાયાગ્રામ, માઇક્રો-સર્વિસીસ, API ગેટવે અને Redis ક્લસ્ટર.',
      featureBpmn: 'BPMN 2.0 પ્રોસેસ ઇન્ટેલિજન્સ',
      featureBpmnDesc: 'ઓટોમેટેડ ડિસિઝન ગેટ્સ, SLA ટાઈમર્સ અને એસ્કેલેશન ટ્રિગર્સ સાથે પૂર્ણ વર્કફ્લો.',
      featureDb: 'રિલેશનલ ડેટાબેઝ અને ERD',
      featureDbDesc: 'પ્રાથમિક/ફોરેન કી અને મરમેઇડ ERD સાથે PostgreSQL અને MySQL સ્કીમા.',
      featureSandbox: 'વર્કિંગ સોલ્યુશન સેન્ડબોક્સ',
      featureSandboxDesc: 'કસ્ટમાઇઝેશન અને Vercel/Render પર 1-ક્લિક ડિપ્લોય સાથે ઇન્ટરેક્ટિવ પ્રોટોટાઇપ એપ.',
    },

    // Input Screen
    input: {
      breadcrumbHome: 'ડેશબોર્ડ',
      breadcrumbNew: 'નવી બ્લુપ્રિન્ટ',
      stageIntake: 'સ્ટેજ 1: બિઝનેસ ઇનપુટ',
      title: 'બિઝનેસ ટ્રાન્સફોર્મેશન ઇનપુટ',
      subtitle: 'તમારા બિઝનેસ વિચાર, જૂની પ્રક્રિયા કે SOP ને સંપૂર્ણ એન્ટરપ્રાઇઝ બ્લુપ્રિન્ટમાં ફેરવો.',
      stepIndicator: 'પગલું 1 નું 3: ઇનપુટ સંદર્ભ',
      langLabel: 'ઇનપુટ / આઉટપુટ ભાષા',
      quickDemo: 'ઝડપી ડેમો:',
      modes: {
        text: '1. ટેક્સ્ટ વિચાર',
        textDesc: 'સમસ્યા વર્ણવો અથવા ટેમ્પલેટ વાપરો',
        doc: '2. દસ્તાવેજ અપલોડ કરો [PDF/PPT]',
        docDesc: 'PDF, DOCX, PPTX માંથી એક્સટ્રેક્ટ કરો',
        url: '3. URL પેસ્ટ કરો',
        urlDesc: 'વેબપેજ SOP સ્ક્રેપર અને વિગતો',
        voice: '4. અવાજ રેકોર્ડ કરો',
        voiceDesc: 'લાઇવ ઑડિઓ રેકોર્ડિંગ અને ટ્રાન્સક્રિપ્શન',
      },
      archetypes: 'ઝડપી પ્રારંભ આર્કેટાઇપ્સ (ઓટો-ફિલ કરવા માટે ક્લિક કરો)',
      sectionIdentity: '1. પ્રોજેક્ટ શીર્ષક અને ક્ષેત્ર',
      projectTitleLabel: 'પ્રોજેક્ટ શીર્ષક',
      projectTitlePlaceholder: 'દા.ત. એન્ટરપ્રાઇઝ ક્લાઉડ ઓટોમેશન અને સર્વિસીસ',
      industryLabel: 'ઉદ્યોગ ક્ષેત્ર',
      sectionProblem: '2. વર્કફ્લો અને મુખ્ય મુશ્કેલીઓ',
      problemPlaceholder: 'વિગતવાર બિઝનેસ સંદર્ભ આપો:\n• હાલની પ્રક્રિયા કેવી છે?\n• મુખ્ય મુશ્કેલીઓ ક્યાં છે?\n• ભવિષ્યનું ઓટોમેટેડ પરિણામ શું જોઈએ છે?\n• કોઈ ચોક્કસ ઇન્ટિગ્રેશન પોઇન્ટ્સ છે (દા.ત. SAP, Salesforce, SQL)?',
      sectionSystems: '3. હાલના સિસ્ટમ્સ અને લીગસી ટૂલ્સ',
      systemsLabel: 'વર્તમાન સોફ્ટવેર / ERPs',
      systemsPlaceholder: 'દા.ત. Oracle ERP, ફિઝિકલ ચોપડા, WhatsApp, Excel સ્પ્રેડશીટ્સ',
      sectionCloud: '4. ટાર્ગેટ ક્લાઉડ ઇન્ફ્રાસ્ટ્રક્ચર',
      submitBtn: 'ડિસ્કવરી પ્રશ્નોત્તરી વિશ્લેષણ પર આગળ વધો →',
      submitting: 'Compile AI વિશ્લેષણ કરી રહ્યું છે...',
      advisoryNote: 'Chaos2Commit AI દ્વારા સંચાલિત સલાહકાર બ્લુપ્રિન્ટ',
    },

    // Discovery Chat
    discovery: {
      title: 'જરૂરિયાત સમજ અને ડિસ્કવરી લૂપ',
      subtitle: 'Compile AI એ તમારા ઇનપુટનું વિશ્લેષણ કર્યું છે અને આર્કિટેક્ચર બનાવતા પહેલા કેટલીક વ્યવહારિક સ્પષ્ટતાઓ શોધી છે.',
      questionBadge: 'સ્પષ્ટતા પ્રશ્ન',
      submitAnswers: 'જવાબો સાચવો અને સોલ્યુશન બ્લુપ્રિન્ટ કમ્પાઇલ કરો',
      compiling: 'સંપૂર્ણ એન્ટરપ્રાઇઝ બ્લુપ્રિન્ટ કમ્પાઇલ થઈ રહી છે (1 ક્રેડિટ કપાશે)...',
      answeredCount: 'પ્રશ્નોના જવાબો આપ્યા',
      tip: 'આ પ્રશ્નોના જવાબો આપવાથી વધુ સચોટ ડેટાબેઝ સ્કીમા અને ઓટોમેટેડ વર્કફ્લો બને છે.',
    },

    // Result Screen & Deliverables
    result: {
      approvalBannerPending: 'સ્ટેકહોલ્ડર મંજૂરી બાકી છે',
      approvalBannerText: 'કોડ જનરેશન પર આગળ વધતા પહેલા આર્કિટેક્ચર, ડેટાબેઝ સ્કીમા અને પ્રોસેસ મોડેલ્સની સમીક્ષા કરો.',
      approveBtn: '✅ બ્લુપ્રિન્ટ મંજૂર કરો અને કોડ બનાવો',
      approvedBadge: 'સ્ટેકહોલ્ડર દ્વારા મંજૂર',
      approvedTime: 'કોડ જનરેશન અને ડિપ્લોય સેન્ડબોક્સ અનલૉક થયું',
      exportBtn: 'દસ્તાવેજો એક્સપોર્ટ કરો',
      exportPdf: 'એક્ઝિક્યુટિવ PDF દસ્તાવેજ (.pdf)',
      exportWord: 'વર્ડ દસ્તાવેજ (.docx)',
      exportJson: 'OpenAPI અને આર્કિટેક્ચર JSON (.json)',
      tabs: {
        brd: '1. એક્ઝિક્યુટિવ BRD',
        architecture: '2. સિસ્ટમ આર્કિટેક્ચર',
        bpmn: '3. BPMN પ્રોસેસ',
        database: '4. ડેટાબેઝ અને APIs',
        wireframes: '5. AI વાયરફ્રેમ્સ',
        estimates: '6. ખર્ચ અને રોડમેપ',
      },
      whyRecommended: 'AI એ આ ભલામણ કેમ કરી',
      assumption: 'મૂળભૂત ધારણા',
      evidence: 'ઇનપુટમાંથી પુરાવા',
      regenerate: 'વિભાગ ફરીથી બનાવો',
      regenerating: 'ફરીથી બની રહ્યું છે...',
    },

    // Working Solution Sandbox & Deploy
    sandbox: {
      title: 'ઇન્ટરેક્ટિવ વર્કિંગ સોલ્યુશન સેન્ડબોક્સ',
      subtitle: 'લાઇવ સર્ચ, ફિલ્ટર્સ, ક્રિયાઓ અને 1-ક્લિક ક્લાઉડ ડિપ્લોયમેન્ટ સાથે સંપૂર્ણ બ્રાઉઝર વર્કિંગ પ્રોટોટાઇપ.',
      deployVercel: '🚀 Vercel પર ડિપ્લોય કરો',
      deployRender: '⚡ Render પર ડિપ્લોય કરો',
      customPromptPlaceholder: 'કસ્ટમાઇઝેશન કહો (દા.ત. "કલર લીલો કરો", "ડિલીટ બટન ઉમેરો", "CSV એક્સપોર્ટ ઉમેરો")',
      applyCustomPrompt: 'એપ અપડેટ કરો',
      customizing: 'AI કસ્ટમાઇઝેશન લાગુ કરી રહ્યું છે...',
      liveUrlLabel: 'લાઇવ પ્રોડક્શન URL',
      openLiveLink: 'લાઇવ એપ્લિકેશન ખોલો ↗',
      copyUrl: 'લિંક કોપી કરો',
      copied: 'કોપી થઈ ગયું!',
      sourceCode: 'પ્રોડક્શન-રેડી સોર્સ કોડ',
      frontendCode: 'રિએક્ટ (React) કોડ',
      backendCode: 'એક્સપ્રેસ (Express) કંટ્રોલર',
      dbCode: 'SQL સ્કીમા (DDL)',
    },

    // Pricing Page
    pricingPage: {
      balanceBadge: 'ક્રેડિટ્સ બેલેન્સ',
      headline: 'એન્ટરપ્રાઇઝ બ્લુપ્રિન્ટ્સ માટે પારદર્શક અને અનુમાનિત કિંમતો',
      subhead: 'બિઝનેસ જરૂરિયાતોને સેકન્ડોમાં પ્રોડક્શન-રેડી બ્લુપ્રિન્ટ અને ડિપ્લોય થયેલ સોલ્યુશનમાં ફેરવો.',
      monthly: 'માસિક બિલિંગ',
      annual: 'વાર્ષિક બિલિંગ (20% બચત)',
      currentPlan: 'હાલની સક્રિય યોજના',
      upgradeBtn: 'યોજના અપગ્રેડ કરો',
      checkoutTitle: 'સબ્સ્ક્રિપ્શન અધિકૃત કરો અને સક્રિય કરો',
      orderSummary: 'ઓર્ડર સારાંશ',
      payNow: 'ચેકઆઉટ પૂર્ણ કરો અને ક્રેડિટ્સ ઉમેરો',
      processingPayment: 'પેમેન્ટ ગેટવે ચકાસી રહ્યું છે...',
      paymentSuccess: 'ચુકવણી સફળ! તમારા ખાતામાં ક્રેડિટ્સ ઉમેરાઈ ગઈ છે.',
      freePlanName: 'ફ્રી કોમ્યુનિટી',
      starterPlanName: 'સ્ટાર્ટર પ્રોફેશનલ',
      enterprisePlanName: 'એન્ટરપ્રાઇઝ સ્કેલ',
    },

    // Sample Prompts
    samplePrompts: {
      smartGovernance: 'સ્માર્ટ સિટી ઈ-ગવર્નન્સ નાગરિક સેવા પોર્ટલ: મ્યુનિસિપલ ટ્રેડ લાઇસન્સ, જાહેર ફરિયાદ નિવારણ અને નાગરિક પ્રમાણપત્રોની મંજૂરીનું સ્વચાલન. ઓનલાઇન પોર્ટલ, ઓટોમેટેડ વેરિફિકેશન, મંજૂરી વર્કફ્લો અને SMS નોટિફિકેશન સિસ્ટમ.',
      hrConsultancy: 'એચઆર કન્સલ્ટન્સી અને સ્ટાફ ઓનબોર્ડિંગ સિસ્ટમ: કર્મચારી દસ્તાવેજ ચકાસણી, ઓટોમેટેડ સેલરી અને પેરોલ ઇન્ટિગ્રેશન, અને 250+ કર્મચારીઓ માટે ઓનલાઇન રજા મેનેજમેન્ટ પોર્ટલ.',
    },
  },
};

/**
 * Get current active language code from localStorage or default to 'en'
 */
export function getCurrentLanguage() {
  try {
    return localStorage.getItem('compile_language') || 'en';
  } catch {
    return 'en';
  }
}

/**
 * Save active language code to localStorage & broadcast event
 */
export function setCurrentLanguage(langCode) {
  try {
    localStorage.setItem('compile_language', langCode);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('language_changed', { detail: { lang: langCode } }));
    }
  } catch (err) {
    console.warn('Could not save language preference:', err);
  }
}

/**
 * Translate a key string with safe fallback to English
 */
export function t(key, langCode = null) {
  const code = langCode || getCurrentLanguage();
  const dict = TRANSLATIONS[code] || TRANSLATIONS.en;
  
  if (key.includes('.')) {
    const parts = key.split('.');
    let val = dict;
    for (const p of parts) {
      val = val?.[p];
    }
    if (val !== undefined && val !== null) return val;
    
    // Fallback to english
    let fallbackVal = TRANSLATIONS.en;
    for (const p of parts) {
      fallbackVal = fallbackVal?.[p];
    }
    return fallbackVal !== undefined && fallbackVal !== null ? fallbackVal : key;
  }

  return dict[key] !== undefined && dict[key] !== null 
    ? dict[key] 
    : (TRANSLATIONS.en[key] !== undefined ? TRANSLATIONS.en[key] : key);
}

/**
 * Reactive React Hook for live zero-refresh translation
 */
export function useTranslation() {
  const [lang, setLang] = useState(() => getCurrentLanguage());

  useEffect(() => {
    const handler = (e) => {
      const newLang = e.detail?.lang || getCurrentLanguage();
      setLang(newLang);
    };
    window.addEventListener('language_changed', handler);
    return () => window.removeEventListener('language_changed', handler);
  }, []);

  const translate = (key) => t(key, lang);

  return {
    t: translate,
    currentLanguage: lang,
    setLanguage: setCurrentLanguage,
    supportedLanguages: SUPPORTED_LANGUAGES,
  };
}
