function familyFor(course = {}) {
  const text = `${course.department || ''} ${course.type || ''} ${course.name || ''}`.toLowerCase();
  if (/math|algebra|geometry|calculus|statistics|trigonometry/.test(text)) return 'math';
  if (/science|biology|chemistry|physics|environmental/.test(text)) return 'science';
  if (/english|writing|literature|composition|communication/.test(text)) return 'english';
  if (/business|marketing|finance|economics|law|entrepreneur/.test(text)) return 'business';
  if (/technology|computer|digital|media/.test(text)) return 'technology';
  if (/physical|health|fitness|sport|athletic|nutrition/.test(text)) return 'health';
  if (/psychology|behavioral|counseling|mental/.test(text)) return 'psychology';
  if (/social|history|government|geography|sociology|politics/.test(text)) return 'social';
  return 'general';
}

function topicText(mod = {}) {
  return String(`${mod.title || ''} ${mod.objectives || ''} ${mod.assignment || ''}`).toLowerCase();
}

function mathLens(mod) {
  const text = topicText(mod);
  if (/function|graph|domain|range/.test(text)) {
    return {
      insight: 'Experts treat functions as machines that preserve relationships between quantities, not just as formulas to evaluate.',
      watchFor: 'Students often memorize notation without explaining what the input, output, and graph each represent.',
      transfer: 'This lens supports later modeling in statistics, physics, economics, and data science.',
    };
  }
  if (/probability|statistics|inference|distribution|regression/.test(text)) {
    return {
      insight: 'Experts separate signal from noise by asking how data were produced before interpreting any calculation.',
      watchFor: 'Students often compute the statistic correctly but overclaim what the data can prove.',
      transfer: 'This prepares students to evaluate research claims, polls, risk, and evidence-based decisions.',
    };
  }
  if (/proof|triangle|circle|area|volume|geometry|angle/.test(text)) {
    return {
      insight: 'Experts use diagrams as arguments: each mark, constraint, and relationship should justify a conclusion.',
      watchFor: 'Students often trust a drawing visually instead of proving why the relationship must be true.',
      transfer: 'This builds spatial reasoning used in engineering, design, architecture, and technical problem solving.',
    };
  }
  if (/limit|derivative|integral|calculus|rate|optimization/.test(text)) {
    return {
      insight: 'Experts read calculus as the study of change, accumulation, and approximation under constraints.',
      watchFor: 'Students often manipulate symbols without describing the changing quantity or unit meaning.',
      transfer: 'This supports physics, economics, machine learning, optimization, and advanced quantitative study.',
    };
  }
  return {
    insight: 'Experts focus on structure: what is unknown, what stays equal, and which transformation preserves meaning.',
    watchFor: 'Students often jump to procedures before naming the relationship the problem is asking them to preserve.',
    transfer: 'This builds the algebraic reasoning needed for later math, science, finance, and technical work.',
  };
}

function scienceLens(mod) {
  const text = topicText(mod);
  if (/cell|dna|gene|genetic|evolution|ecology|biology|organism/.test(text)) {
    return {
      insight: 'Experts connect mechanisms across scale, from molecules and cells to organisms, populations, and ecosystems.',
      watchFor: 'Students often list vocabulary without explaining the causal mechanism that links the parts.',
      transfer: 'This supports health literacy, biotechnology, environmental reasoning, and AP-level biological argumentation across unfamiliar scenarios.',
    };
  }
  if (/chemical|molecule|reaction|stoichiometry|acid|base|bond|equilibrium/.test(text)) {
    return {
      insight: 'Experts track matter, charge, and energy at the particle level before interpreting visible chemical change.',
      watchFor: 'Students often balance equations mechanically without explaining what is conserved or transformed.',
      transfer: 'This prepares students for lab reasoning, medicine, materials science, and college chemistry.',
    };
  }
  if (/force|motion|energy|momentum|electric|wave|physics/.test(text)) {
    return {
      insight: 'Experts model physical systems by choosing assumptions, defining variables, and checking units against reality.',
      watchFor: 'Students often plug numbers into formulas before deciding which forces or energy transfers matter.',
      transfer: 'This builds the modeling habits used in engineering, robotics, medicine, and quantitative science.',
    };
  }
  return {
    insight: 'Experts reason from evidence: observations, models, and mechanisms must support the same explanation.',
    watchFor: 'Students often confuse description with explanation and need to show why the evidence supports the claim.',
    transfer: 'This develops scientific literacy for labs, health, environment, and college-level STEM work.',
  };
}

function englishLens(mod) {
  const text = topicText(mod);
  if (/research|source|citation|argument|thesis/.test(text)) {
    return {
      insight: 'Experts treat writing as a chain of claims, evidence, warrants, and source credibility decisions.',
      watchFor: 'Students often collect sources before deciding what question their evidence is supposed to answer.',
      transfer: 'This prepares students for college essays, research papers, policy memos, and evidence-based communication.',
    };
  }
  if (/literature|poetry|novel|drama|theme|character/.test(text)) {
    return {
      insight: 'Experts read literature as constructed choices in language, form, voice, and historical context.',
      watchFor: 'Students often summarize plot instead of analyzing how textual choices create meaning.',
      transfer: 'This strengthens literary analysis, cultural interpretation, and advanced humanities writing.',
    };
  }
  return {
    insight: 'Experts revise for audience, purpose, structure, and evidence rather than treating writing as a first draft.',
    watchFor: 'Students often state ideas clearly but need stronger organization, support, and sentence-level control.',
    transfer: 'This supports college writing, professional communication, interviews, and public-facing work.',
  };
}

function socialLens(mod) {
  const text = topicText(mod);
  if (/constitution|government|law|policy|rights|court/.test(text)) {
    return {
      insight: 'Experts study institutions by asking who has authority, what constraints exist, and how decisions become enforceable.',
      watchFor: 'Students often memorize civic terms without tracing how power, rights, and procedures interact.',
      transfer: 'This prepares students to evaluate public policy, civic claims, legal reasoning, and news.',
    };
  }
  if (/history|war|revolution|industrial|colonial|migration/.test(text)) {
    return {
      insight: 'Experts weigh causation, continuity, change, and evidence instead of treating history as a list of events.',
      watchFor: 'Students often give one-cause explanations for events shaped by economics, politics, culture, and geography.',
      transfer: 'This supports historical writing, document analysis, and informed civic judgment.',
    };
  }
  if (/geography|population|urban|migration|culture|region/.test(text)) {
    return {
      insight: 'Experts use spatial thinking to explain how place, movement, environment, and human systems shape outcomes.',
      watchFor: 'Students often describe where something happens without explaining why location changes the pattern.',
      transfer: 'This supports AP Human Geography, global studies, urban planning, and environmental decisions.',
    };
  }
  return {
    insight: 'Experts connect individual choices to larger systems, institutions, incentives, and historical context.',
    watchFor: 'Students often describe social patterns without using evidence to explain causes and consequences.',
    transfer: 'This builds social-science reasoning for college, civic life, research, and public communication.',
  };
}

function businessLens(mod) {
  const text = topicText(mod);
  if (/finance|investment|budget|cash|accounting|market/.test(text)) {
    return {
      insight: 'Experts read numbers as decisions under risk: cash flow, incentives, assumptions, and tradeoffs matter together.',
      watchFor: 'Students often calculate correctly but miss the business judgment behind the calculation.',
      transfer: 'This supports entrepreneurship, personal finance, management decisions, and college business coursework.',
    };
  }
  if (/marketing|customer|brand|advertising|campaign/.test(text)) {
    return {
      insight: 'Experts analyze marketing by connecting audience psychology, positioning, channels, and measurable outcomes.',
      watchFor: 'Students often focus on attractive messaging before defining the target customer and success metric.',
      transfer: 'This prepares students for business communication, product strategy, media literacy, and entrepreneurship.',
    };
  }
  if (/law|ethic|contract|liability|tort/.test(text)) {
    return {
      insight: 'Experts evaluate business law and ethics through duties, incentives, evidence, risk, and stakeholder impact.',
      watchFor: 'Students often choose the morally appealing answer without analyzing obligations and consequences.',
      transfer: 'This supports leadership, compliance, entrepreneurship, and responsible decision-making in realistic organizational situations.',
    };
  }
  return {
    insight: 'Experts connect concepts to decisions: goals, constraints, stakeholders, evidence, and execution all matter.',
    watchFor: 'Students often describe a business idea without testing whether the decision is practical or measurable.',
    transfer: 'This builds judgment for entrepreneurship, management, career planning, and applied economics.',
  };
}

function technologyLens(mod) {
  const text = topicText(mod);
  if (/program|java|algorithm|code|array|object|method|class/.test(text)) {
    return {
      insight: 'Experts design programs by separating representation, algorithm, edge cases, and readability.',
      watchFor: 'Students often make code work for one example without testing boundary cases or explaining design choices.',
      transfer: 'This prepares students for AP Computer Science, software engineering, data work, and computational thinking.',
    };
  }
  if (/media|digital|internet|information|security|cloud/.test(text)) {
    return {
      insight: 'Experts evaluate digital systems by asking how information is created, filtered, secured, and acted on.',
      watchFor: 'Students often use tools fluently but need stronger judgment about credibility, privacy, and workflow.',
      transfer: 'This supports college research, workplace productivity, media literacy, and responsible technology use across academic settings.',
    };
  }
  return {
    insight: 'Experts treat technology as a system of tools, users, constraints, data, and consequences.',
    watchFor: 'Students often learn the button sequence before understanding the problem the tool is solving.',
    transfer: 'This builds durable digital skill for school, work, research, and technical careers.',
  };
}

function psychologyLens(mod) {
  const text = topicText(mod);
  if (/research|experiment|method|data|ethic/.test(text)) {
    return {
      insight: 'Experts judge psychological claims by research design, measurement quality, ethics, and alternative explanations.',
      watchFor: 'Students often accept intuitive explanations without asking how the evidence was gathered.',
      transfer: 'This prepares students to evaluate studies, mental-health claims, media reports, and college psychology with evidence.',
    };
  }
  if (/memory|cognition|learning|development|personality/.test(text)) {
    return {
      insight: 'Experts connect behavior to cognitive processes, biological constraints, context, and individual differences.',
      watchFor: 'Students often define a concept without applying it to a real behavior or explaining competing factors.',
      transfer: 'This supports education, counseling, leadership, health, and evidence-based self-understanding in real situations.',
    };
  }
  return {
    insight: 'Experts explain behavior through multiple lenses: biological, cognitive, social, developmental, and cultural.',
    watchFor: 'Students often overgeneralize from one example instead of weighing context and evidence.',
    transfer: 'This builds judgment for human services, communication, mental-health literacy, and social science coursework.',
  };
}

function healthLens(mod) {
  return {
    insight: 'Experts connect health knowledge to safe practice, habit design, risk management, and evidence-based decisions.',
    watchFor: 'Students often know the recommendation but need to explain when, why, and for whom it applies.',
    transfer: 'This supports lifelong wellness, sports participation, injury prevention, and responsible health choices.',
  };
}

function generalLens(mod) {
  return {
    insight: 'Experts ask what evidence, concepts, constraints, and context must be connected before reaching a conclusion.',
    watchFor: 'Students often complete the task but need to make reasoning visible enough for feedback.',
    transfer: 'This builds durable academic habits for college readiness, workplace communication, and independent learning.',
  };
}

function getExpertLens(course = {}, mod = {}) {
  switch (familyFor(course)) {
    case 'math': return mathLens(mod);
    case 'science': return scienceLens(mod);
    case 'english': return englishLens(mod);
    case 'business': return businessLens(mod);
    case 'technology': return technologyLens(mod);
    case 'health': return healthLens(mod);
    case 'psychology': return psychologyLens(mod);
    case 'social': return socialLens(mod);
    default: return generalLens(mod);
  }
}

module.exports = {
  getExpertLens,
  familyFor,
};
