import React, { useState } from 'react';
import { Link } from 'react-router-dom';

// Florida 24-credit graduation framework (industry standard for accredited private schools)
const GRAD_REQUIREMENTS = [
  { area: 'English Language Arts', areaZh: '英语语言艺术', credits: 4,   color: '#2b3d6d' },
  { area: 'Mathematics',           areaZh: '数学',         credits: 4,   color: '#1a5276' },
  { area: 'Science',               areaZh: '自然科学',     credits: 3,   color: '#1e8449' },
  { area: 'Social Studies',        areaZh: '社会科学',     credits: 3,   color: '#7a3b3b' },
  { area: 'Health & PE',           areaZh: '健康体育',     credits: 1,   color: '#6c757d' },
  { area: 'Electives',             areaZh: '选修课程',     credits: 8.5, color: '#5b2c6f' },
  { area: 'Personal Finance',      areaZh: '个人理财',     credits: 0.5, color: '#555' },
];
const TOTAL_CREDITS = 24;

// ─── Core course detail data ───────────────────────────────────────────────────
const COURSE_DETAILS = {
  'English I': {
    desc: 'Foundation of academic reading and writing. Students analyze fiction and nonfiction texts, write structured paragraphs and short essays, and develop grammar and vocabulary skills aligned with US college-prep standards.',
    topics: ['Paragraph structure and essay organization', 'Close reading and literary analysis', 'Grammar, punctuation, and sentence variety', 'Vocabulary in context', 'Research writing basics'],
    resources: [
      { title: 'Khan Academy — Grammar', url: 'https://www.khanacademy.org/humanities/grammar' },
      { title: 'Purdue OWL — Writing Guide', url: 'https://owl.purdue.edu/owl/general_writing/' },
      { title: 'Crash Course Literature', url: 'https://www.youtube.com/playlist?list=PL8dPuuaLjXtOeEc9ME62zTfqc0h6Pe8vb' },
    ],
  },
  'English II': {
    desc: 'Develops analytical writing and literary interpretation. Students work with longer texts — novels, essays, historical speeches — and write multi-paragraph analytical essays with evidence-based arguments.',
    topics: ['Comparative literary analysis', 'Argument and evidence structure', 'Rhetorical analysis (ethos, pathos, logos)', 'Research and citation (MLA)', 'Revision and peer editing process'],
    resources: [
      { title: 'Khan Academy — Reading & Writing', url: 'https://www.khanacademy.org/test-prep/sat/sat-reading-writing-practice' },
      { title: 'Purdue OWL — Research Writing', url: 'https://owl.purdue.edu/owl/research_and_citation/mla_style/' },
      { title: 'TED-Ed — Literature', url: 'https://www.youtube.com/playlist?list=PLJicmE8fK0Eic6WfCLpFl_tBiNROZZ0Rp' },
    ],
  },
  'English III': {
    desc: 'Advanced analysis of American literature and rhetoric. Students read canonical American texts, write research-backed argumentative essays, and develop the writing skills required for AP and college-level work.',
    topics: ['American literature and cultural context', 'AP-style argument essays', 'Rhetorical analysis of primary sources', 'Extended research essay (5–8 pages)', 'Revision for clarity, style, and voice'],
    resources: [
      { title: 'Khan Academy — AP English Language', url: 'https://www.khanacademy.org/test-prep/ap-english-language' },
      { title: 'Crash Course — US History & Literature', url: 'https://www.youtube.com/c/crashcourse' },
      { title: 'Purdue OWL — Argumentative Essays', url: 'https://owl.purdue.edu/owl/general_writing/academic_writing/essay_writing/argumentative_essays.html' },
    ],
  },
  'Algebra I': {
    desc: 'The gateway to all high school mathematics. Students master variables, equations, functions, and graphing — skills that appear in every subsequent math and science course.',
    topics: ['Variables, expressions, and equations', 'Linear equations and inequalities', 'Functions and graphing', 'Systems of equations', 'Polynomials and factoring basics'],
    resources: [
      { title: 'Khan Academy — Algebra I', url: 'https://www.khanacademy.org/math/algebra' },
      { title: 'Professor Leonard — Algebra', url: 'https://www.youtube.com/c/ProfessorLeonard' },
      { title: 'Desmos Graphing Calculator', url: 'https://www.desmos.com/calculator' },
    ],
  },
  'Geometry': {
    desc: 'Develops spatial reasoning and proof-based mathematical thinking. Covers points, lines, angles, triangles, circles, area, volume, and coordinate geometry — with emphasis on logical justification.',
    topics: ['Geometric proof and logical reasoning', 'Triangle congruence and similarity', 'Properties of polygons and circles', 'Area, surface area, and volume', 'Coordinate geometry and transformations'],
    resources: [
      { title: 'Khan Academy — Geometry', url: 'https://www.khanacademy.org/math/geometry' },
      { title: 'Professor Leonard — Geometry', url: 'https://www.youtube.com/c/ProfessorLeonard' },
      { title: 'GeoGebra — Interactive Geometry', url: 'https://www.geogebra.org/geometry' },
    ],
  },
  'Algebra II': {
    desc: 'Extends algebraic thinking to polynomials, rational functions, exponential and logarithmic functions, and conic sections. Serves as the bridge between foundational algebra and pre-calculus.',
    topics: ['Polynomial and rational functions', 'Exponential and logarithmic functions', 'Radical functions and complex numbers', 'Sequences, series, and the binomial theorem', 'Probability and statistics intro'],
    resources: [
      { title: 'Khan Academy — Algebra II', url: 'https://www.khanacademy.org/math/algebra2' },
      { title: 'Professor Leonard — Algebra', url: 'https://www.youtube.com/c/ProfessorLeonard' },
      { title: 'Desmos Graphing Calculator', url: 'https://www.desmos.com/calculator' },
    ],
  },
  'Pre-Calculus': {
    desc: 'Bridges Algebra II and Calculus. Covers functions deeply, trigonometry, polar coordinates, vectors, and limits — giving students the tools needed for Calculus success.',
    topics: ['Advanced function analysis and transformations', 'Trigonometric functions, identities, and equations', 'Polar coordinates and complex numbers', 'Vectors and parametric equations', 'Introduction to limits'],
    resources: [
      { title: 'Khan Academy — Precalculus', url: 'https://www.khanacademy.org/math/precalculus' },
      { title: 'Professor Leonard — Precalculus', url: 'https://www.youtube.com/watch?v=9OOrhA2iKak&list=PLDesaqWTN6ESsmwELdrzhcGiikk4mlNC' },
      { title: '3Blue1Brown — Essence of Trigonometry', url: 'https://www.youtube.com/watch?v=yBw67Fb31Cs' },
    ],
  },
  'Calculus': {
    desc: 'Differential and integral calculus — the mathematics of change. Students learn limits, derivatives, and integrals, with applications to physics, economics, and data science.',
    topics: ['Limits and continuity', 'Derivatives and differentiation rules', 'Applications of derivatives (optimization, related rates)', 'Integrals and the Fundamental Theorem of Calculus', 'Applications of integration (area, volume)'],
    resources: [
      { title: '3Blue1Brown — Essence of Calculus', url: 'https://www.youtube.com/playlist?list=PLZHQObOWTQDMsr9K-rj53DwVRMYO3t5Yr' },
      { title: 'Khan Academy — Calculus', url: 'https://www.khanacademy.org/math/calculus-1' },
      { title: 'Professor Leonard — Calculus I', url: 'https://www.youtube.com/watch?v=fYyARMqiaag&list=PLF797E961509B4EB5' },
    ],
  },
  'Statistics': {
    desc: 'Applied statistics for a data-driven world. Students learn to collect, describe, and interpret data using probability, distributions, hypothesis testing, and regression — skills critical for business, science, and social research.',
    topics: ['Descriptive statistics: mean, median, mode, spread', 'Probability and probability distributions', 'Normal distribution and z-scores', 'Hypothesis testing and confidence intervals', 'Correlation and linear regression'],
    resources: [
      { title: 'Khan Academy — Statistics & Probability', url: 'https://www.khanacademy.org/math/statistics-probability' },
      { title: 'Crash Course — Statistics', url: 'https://www.youtube.com/playlist?list=PL8dPuuaLjXtNM_Y-bUAhblSAdWRnmdfh3' },
      { title: 'StatQuest with Josh Starmer', url: 'https://www.youtube.com/c/joshstarmer' },
    ],
  },
  'Biology': {
    desc: 'A survey of life sciences covering cell biology, genetics, evolution, ecology, and human body systems. Builds a foundation for all future science coursework and is required for college-prep science sequences.',
    topics: ['Cell structure and function', 'DNA, RNA, and protein synthesis', 'Mendelian and molecular genetics', 'Evolution and natural selection', 'Ecology and human body systems'],
    resources: [
      { title: 'Khan Academy — Biology', url: 'https://www.khanacademy.org/science/biology' },
      { title: 'Crash Course Biology', url: 'https://www.youtube.com/playlist?list=PL3EED4C1D684D3ADF' },
      { title: 'Amoeba Sisters — Biology Videos', url: 'https://www.youtube.com/c/AmoebaSisters' },
    ],
  },
  'Chemistry': {
    desc: 'Explores atomic structure, bonding, chemical reactions, stoichiometry, thermodynamics, and solutions. Chemistry develops quantitative reasoning and lab skills essential for science and engineering majors.',
    topics: ['Atomic structure and periodic trends', 'Chemical bonding and molecular geometry', 'Stoichiometry and reaction types', 'Solutions, acids, and bases', 'Thermochemistry and reaction rates'],
    resources: [
      { title: 'Khan Academy — Chemistry', url: 'https://www.khanacademy.org/science/chemistry' },
      { title: 'Crash Course Chemistry', url: 'https://www.youtube.com/playlist?list=PL8dPuuaLjXtPHzzYuWy6fYEaX9mQQ8oGr' },
      { title: 'Tyler DeWitt — Chemistry', url: 'https://www.youtube.com/c/tylerdewitt' },
    ],
  },
  'Physics Fundamentals': {
    desc: 'Covers classical mechanics, energy, waves, and electricity. Develops the mathematical modeling skills used across engineering, computer science, and quantitative sciences.',
    topics: ['Kinematics: motion, velocity, acceleration', 'Newton\'s Laws and force analysis', 'Work, energy, and power', 'Waves and sound', 'Electricity and circuits basics'],
    resources: [
      { title: 'Khan Academy — Physics', url: 'https://www.khanacademy.org/science/physics' },
      { title: 'Crash Course Physics', url: 'https://www.youtube.com/playlist?list=PL8dPuuaLjXtN0ge7yDk_UA0ldZJdhwkoV' },
      { title: 'Physics with Professor Matt Anderson', url: 'https://www.youtube.com/c/lasseviren1' },
    ],
  },
  'World History': {
    desc: 'A survey of human civilizations from ancient times through the modern era. Students examine how political, economic, social, and cultural forces have shaped the world — developing historical thinking and analytical writing skills.',
    topics: ['Ancient civilizations (Egypt, Greece, Rome, China)', 'Medieval Europe and Islamic Golden Age', 'Age of Exploration and colonialism', 'Enlightenment, revolutions, and nationalism', 'World War I, II, and the Cold War'],
    resources: [
      { title: 'Crash Course World History', url: 'https://www.youtube.com/playlist?list=PLBDA2522E7B32424A' },
      { title: 'Khan Academy — World History', url: 'https://www.khanacademy.org/humanities/world-history' },
      { title: 'OverSimplified — History', url: 'https://www.youtube.com/c/OverSimplified' },
    ],
  },
  'U.S. History': {
    desc: 'Covers American history from colonial settlement through the present. Emphasizes primary source analysis, historical argument, and understanding how US events connect to global history — essential for college social studies requirements.',
    topics: ['Colonial America and the Revolution', 'Civil War and Reconstruction', 'Industrialization and the Progressive Era', 'World Wars and the New Deal', 'Civil Rights Movement and modern America'],
    resources: [
      { title: 'Crash Course US History', url: 'https://www.youtube.com/playlist?list=PL8dPuuaLjXtMwmepBjTSG593eG7ObzO7s' },
      { title: 'Khan Academy — US History', url: 'https://www.khanacademy.org/humanities/us-history' },
      { title: "America's Library — Library of Congress", url: 'https://www.americaslibrary.gov/' },
    ],
  },

  // ── English ──────────────────────────────────────────────────────────────
  'English I — Writing': {
    desc: 'Companion to English I, focused entirely on the writing process. Students practice prewriting, drafting, revising, and editing across narrative, descriptive, and expository genres. Emphasis on sentence clarity, paragraph structure, and developing a personal voice.',
    topics: ['Narrative and personal essay writing', 'Descriptive writing techniques', 'Expository writing structure', 'Grammar and mechanics in context', 'The revision and editing process'],
    resources: [
      { title: 'Khan Academy — Grammar', url: 'https://www.khanacademy.org/humanities/grammar' },
      { title: 'Purdue OWL — Writing Guide', url: 'https://owl.purdue.edu/owl/general_writing/' },
      { title: 'No Red Ink — Grammar Practice', url: 'https://www.noredink.com/' },
    ],
  },
  'English II — Literature': {
    desc: 'A deep reading of world literature including short stories, novels, poetry, and drama. Students explore theme, character, symbolism, and narrative structure, writing analytical responses to texts from diverse cultures and traditions.',
    topics: ['World literature and cultural context', 'Short story and novel analysis', 'Poetry: figurative language and form', 'Drama and theatrical elements', 'Comparative literary essay writing'],
    resources: [
      { title: 'Crash Course Literature', url: 'https://www.youtube.com/playlist?list=PL8dPuuaLjXtOeEc9ME62zTfqc0h6Pe8vb' },
      { title: 'TED-Ed — Literature', url: 'https://www.youtube.com/playlist?list=PLJicmE8fK0Eic6WfCLpFl_tBiNROZZ0Rp' },
      { title: 'Purdue OWL — Literary Analysis', url: 'https://owl.purdue.edu/owl/general_writing/academic_writing/essay_writing/literary_analysis.html' },
    ],
  },
  'English III — Literature': {
    desc: 'Focuses on American literary traditions from colonial era through contemporary works. Students read canonical American texts alongside contemporary voices, writing argumentative essays about how literature reflects American history and values.',
    topics: ['American literary movements: Romanticism, Realism, Modernism', 'Canonical authors (Fitzgerald, Steinbeck, Morrison)', 'Primary source and historical context analysis', 'AP-style literary analysis essays', 'Research-backed literary argument'],
    resources: [
      { title: 'Khan Academy — AP English Literature', url: 'https://www.khanacademy.org/test-prep/ap-english-literature' },
      { title: 'Library of Congress Digital Collections', url: 'https://www.loc.gov/collections/' },
      { title: 'Crash Course Literature', url: 'https://www.youtube.com/playlist?list=PL8dPuuaLjXtOeEc9ME62zTfqc0h6Pe8vb' },
    ],
  },
  'English IV — Writing & Communication': {
    desc: 'Senior-year writing course focused on professional and academic communication. Students write college application essays, analytical reports, and persuasive pieces while developing the executive communication skills expected at university level.',
    topics: ['College application essay writing', 'Professional writing: emails, reports, proposals', 'Persuasive writing and argumentation', 'Oral presentation design and delivery', 'Resume and career portfolio writing'],
    resources: [
      { title: 'Common App — Essay Advice', url: 'https://www.commonapp.org/apply/essay-prompts' },
      { title: 'Purdue OWL — Professional Writing', url: 'https://owl.purdue.edu/owl/general_writing/academic_writing/essay_writing/' },
      { title: 'Khan Academy — SAT Writing', url: 'https://www.khanacademy.org/test-prep/sat/sat-reading-writing-practice' },
    ],
  },
  'English IV — Advanced Composition': {
    desc: 'Capstone writing course for college-bound seniors. Students complete a substantial research paper, a portfolio of polished essays, and a senior presentation — at a college freshman standard.',
    topics: ['Extended research paper (10–12 pages)', 'Annotated bibliography and citation (MLA/APA)', 'Academic voice and scholarly register', 'Portfolio compilation and revision', 'Senior capstone presentation'],
    resources: [
      { title: 'Purdue OWL — Research Writing', url: 'https://owl.purdue.edu/owl/research_and_citation/mla_style/' },
      { title: 'Google Scholar', url: 'https://scholar.google.com/' },
      { title: 'Zotero — Citation Tool', url: 'https://www.zotero.org/' },
    ],
  },

  // ── Mathematics ──────────────────────────────────────────────────────────
  'Trigonometry': {
    desc: 'An in-depth study of trigonometric functions and their applications in geometry, physics, and pre-calculus. Students master all six trig functions, inverse functions, identities, and the Laws of Sines and Cosines.',
    topics: ['Unit circle and all six trig functions', 'Trigonometric identities and proofs', 'Law of Sines and Law of Cosines', 'Inverse trigonometric functions', 'Applications in physics and engineering'],
    resources: [
      { title: 'Khan Academy — Trigonometry', url: 'https://www.khanacademy.org/math/trigonometry' },
      { title: 'Professor Leonard — Precalculus', url: 'https://www.youtube.com/watch?v=9OOrhA2iKak&list=PLDesaqWTN6ESsmwELdrzhcGiikk4mlNC' },
      { title: 'Desmos Graphing Calculator', url: 'https://www.desmos.com/calculator' },
    ],
  },
  'AP Statistics': {
    desc: 'College Board AP Statistics — equivalent to a one-semester university introductory statistics course. Covers data analysis, probability, sampling distributions, and statistical inference. Prepares students for the AP exam and quantitative coursework in any major.',
    topics: ['Exploring data: graphical displays and summary statistics', 'Designing studies: sampling and experimental design', 'Probability and simulation', 'Sampling distributions and the Central Limit Theorem', 'Statistical inference: confidence intervals and hypothesis tests'],
    resources: [
      { title: 'Khan Academy — AP Statistics', url: 'https://www.khanacademy.org/math/ap-statistics' },
      { title: 'College Board — AP Statistics', url: 'https://apstudents.collegeboard.org/courses/ap-statistics' },
      { title: 'StatQuest with Josh Starmer', url: 'https://www.youtube.com/c/joshstarmer' },
    ],
  },

  // ── Science ───────────────────────────────────────────────────────────────
  'Environmental Science': {
    desc: "Examines Earth's ecosystems, natural resources, and human environmental impact. Covers ecology, biogeochemical cycles, climate science, pollution, and sustainability — an excellent foundation for environmental engineering or biology programs.",
    topics: ['Ecosystem dynamics and food webs', 'Biogeochemical cycles: carbon, nitrogen, water', 'Climate change: causes, evidence, and impacts', 'Pollution: air, water, and soil', 'Sustainability and environmental policy'],
    resources: [
      { title: 'Khan Academy — Environmental Science', url: 'https://www.khanacademy.org/science/ap-biology' },
      { title: 'Crash Course — Ecology', url: 'https://www.youtube.com/playlist?list=PL8dPuuaLjXtNdTKZkV_GiIYXpV9yis1BQ' },
      { title: 'NASA Climate Kids', url: 'https://climatekids.nasa.gov/' },
    ],
  },
  'Biology — Advanced': {
    desc: 'Extends Biology with university-preparatory content in cell biology, molecular genetics, biotechnology, and physiology. Students engage with scientific literature and conduct virtual lab investigations in preparation for AP Biology.',
    topics: ['Cell signaling and membrane transport', 'Gene expression and regulation', 'Biotechnology: PCR, CRISPR, gel electrophoresis', 'Human physiology: organ systems in depth', 'Introduction to reading scientific literature'],
    resources: [
      { title: 'HHMI BioInteractive', url: 'https://www.biointeractive.org/' },
      { title: 'Khan Academy — AP Biology', url: 'https://www.khanacademy.org/science/ap-biology' },
      { title: 'Crash Course Biology', url: 'https://www.youtube.com/playlist?list=PL3EED4C1D684D3ADF' },
    ],
  },
  'Physics — Mechanics': {
    desc: "A calculus-preparatory course in classical mechanics. Students explore Newton's laws, energy, momentum, rotation, and simple harmonic motion using algebraic and trigonometric models — ideal preparation for AP Physics.",
    topics: ['Projectile motion and vectors', "Newton's Laws in multiple dimensions", 'Work, energy, and conservation laws', 'Momentum and impulse', 'Rotational motion and torque'],
    resources: [
      { title: 'Khan Academy — AP Physics 1', url: 'https://www.khanacademy.org/science/ap-physics-1' },
      { title: 'Crash Course Physics', url: 'https://www.youtube.com/playlist?list=PL8dPuuaLjXtN0ge7yDk_UA0ldZJdhwkoV' },
      { title: 'The Physics Classroom', url: 'https://www.physicsclassroom.com/' },
    ],
  },
  'AP Biology': {
    desc: 'College Board AP Biology — equivalent to a two-semester introductory university biology sequence. Covers all eight AP Biology units from biochemistry to ecology. Includes substantial virtual lab work and prepares students for college science programs.',
    topics: ['Biochemistry and macromolecules', 'Cell structure, membrane transport, and signaling', 'Cellular energetics: photosynthesis and respiration', 'Heredity, genetics, and gene expression', 'Ecology, evolution, and natural selection'],
    resources: [
      { title: 'Khan Academy — AP Biology', url: 'https://www.khanacademy.org/science/ap-biology' },
      { title: 'Bozeman Science — AP Biology', url: 'https://www.youtube.com/c/bozeman_science' },
      { title: 'College Board — AP Biology', url: 'https://apstudents.collegeboard.org/courses/ap-biology' },
    ],
  },

  // ── Social Studies ────────────────────────────────────────────────────────
  'Geography': {
    desc: "A comprehensive study of Earth's physical and human geography. Students explore landforms, climate zones, population patterns, economic development, and cultural landscapes — building the global awareness essential for international studies.",
    topics: ['Physical geography: landforms, climate, biomes', 'Human geography: population, migration, urbanization', 'Political geography: borders, nations, and conflict', 'Economic geography: development and trade', 'Cultural geography: language, religion, and identity'],
    resources: [
      { title: 'Khan Academy — World History & Geography', url: 'https://www.khanacademy.org/humanities/world-history' },
      { title: 'National Geographic Education', url: 'https://education.nationalgeographic.org/' },
      { title: 'BBC Geography Resources', url: 'https://www.bbc.co.uk/geography' },
    ],
  },
  'World Politics': {
    desc: 'An introduction to international relations and global political systems. Students analyze foreign policy, international organizations (UN, WTO, IMF), geopolitical conflict, diplomacy, and global issues like climate agreements and trade disputes.',
    topics: ['International relations theory: realism, liberalism, constructivism', 'Foreign policy and diplomacy', 'International organizations: UN, NATO, WTO, IMF', 'Geopolitical conflict and peacekeeping', 'Global challenges: climate, trade, migration'],
    resources: [
      { title: 'Council on Foreign Relations — Education', url: 'https://www.cfr.org/education' },
      { title: 'BBC World News', url: 'https://www.bbc.com/news/world' },
      { title: 'Crash Course — Government & Politics', url: 'https://www.youtube.com/playlist?list=PL8dPuuaLjXtOfse2ncvffeelTrqvhrz8H' },
    ],
  },
  'Government': {
    desc: 'Covers the structure, functions, and principles of the US government: the Constitution, branches of government, civil liberties, voting, and policy-making. Also examines comparative government systems to build global political literacy.',
    topics: ['US Constitution and Bill of Rights', 'The three branches: structure and function', 'Civil rights, civil liberties, and landmark Supreme Court cases', 'Electoral systems and political participation', 'Comparative government: parliamentary vs. presidential systems'],
    resources: [
      { title: 'Khan Academy — Civics & Government', url: 'https://www.khanacademy.org/humanities/us-government-and-civics' },
      { title: 'iCivics — Government Games & Lessons', url: 'https://www.icivics.org/' },
      { title: 'Crash Course — Government & Politics', url: 'https://www.youtube.com/playlist?list=PL8dPuuaLjXtOfse2ncvffeelTrqvhrz8H' },
    ],
  },
  'Economics': {
    desc: 'Introduces micro- and macroeconomic principles: supply and demand, market structures, fiscal and monetary policy, GDP, inflation, and trade. Connects economic theory to real-world events including recessions, trade disputes, and central bank decisions.',
    topics: ['Supply, demand, and market equilibrium', 'Production, costs, and market structures', 'GDP, inflation, and unemployment', 'Fiscal policy and government spending', 'Monetary policy and central banking'],
    resources: [
      { title: 'Khan Academy — Economics', url: 'https://www.khanacademy.org/economics-finance-domain/macroeconomics' },
      { title: 'Crash Course — Economics', url: 'https://www.youtube.com/playlist?list=PL8dPuuaLjXtPNZwz5_o_5uirJ8gQXnhEO' },
      { title: 'MRU — Marginal Revolution University', url: 'https://mru.org/' },
    ],
  },
  'Economics Seminar': {
    desc: 'A senior-level seminar applying economic tools to real-world policy analysis. Students research and present on income inequality, trade policy, healthcare economics, and behavioral economics — developing skills expected in college economics courses.',
    topics: ['Behavioral economics: irrationality in real life', 'Income inequality and poverty', 'Trade policy and globalization', 'Healthcare and public goods economics', 'Capstone economic policy research paper'],
    resources: [
      { title: 'MRU — Marginal Revolution University', url: 'https://mru.org/' },
      { title: 'Planet Money Podcast', url: 'https://www.npr.org/podcasts/510289/planet-money' },
      { title: 'The Economist — Student Edition', url: 'https://www.economist.com/' },
    ],
  },
  'Sociology': {
    desc: 'An introduction to the scientific study of human society, social institutions, and group behavior. Students analyze how culture, class, race, gender, and social norms shape individual and collective outcomes — essential context for psychology and social science programs.',
    topics: ['Sociological research methods', 'Culture, norms, and socialization', 'Social stratification: class, race, and gender', 'Social institutions: family, education, religion', 'Social change and globalization'],
    resources: [
      { title: 'Crash Course — Sociology', url: 'https://www.youtube.com/playlist?list=PL8dPuuaLjXtMJ-AfB_7J1538YKkTwhstA' },
      { title: 'Khan Academy — Sociology', url: 'https://www.khanacademy.org/test-prep/mcat/society-and-culture' },
      { title: 'TED-Ed — Social Science', url: 'https://www.youtube.com/c/TEDEducation' },
    ],
  },
  'AP Human Geography': {
    desc: 'College Board AP Human Geography — equivalent to a one-semester introductory university geography course. Covers population, migration, cultural patterns, political organization, agricultural and urban geography, and economic development.',
    topics: ['Geographic skills and spatial analysis', 'Population and migration patterns', 'Cultural patterns and processes', 'Political geography and geopolitics', 'Urban land use and economic development'],
    resources: [
      { title: 'Khan Academy — AP Human Geography', url: 'https://www.khanacademy.org/test-prep/ap-human-geography' },
      { title: 'College Board — AP Human Geography', url: 'https://apstudents.collegeboard.org/courses/ap-human-geography' },
      { title: 'Crash Course — Geography', url: 'https://www.youtube.com/playlist?list=PL8dPuuaLjXtO85Sl24rSiClEnbo6bhz2e' },
    ],
  },
  'AP Psychology': {
    desc: 'College Board AP Psychology — equivalent to a one-semester introductory university psychology course. Covers history and approaches, research methods, biological bases of behavior, cognition, development, personality, social psychology, and psychological disorders.',
    topics: ['History of psychology and major theoretical approaches', 'Research methods and ethical considerations', 'Biological bases of behavior: brain and nervous system', 'Cognition: memory, learning, language, and thinking', 'Social psychology, personality, and psychological disorders'],
    resources: [
      { title: 'Khan Academy — AP Psychology', url: 'https://www.khanacademy.org/test-prep/ap-psychology' },
      { title: 'Crash Course — Psychology', url: 'https://www.youtube.com/playlist?list=PL8dPuuaLjXtOPRKzVLY0jJY-uHOH9KVU6' },
      { title: 'College Board — AP Psychology', url: 'https://apstudents.collegeboard.org/courses/ap-psychology' },
    ],
  },

  // ── Health & PE ───────────────────────────────────────────────────────────
  'Physical Education': {
    desc: 'Introduces the principles of physical fitness, movement, and lifetime wellness. In the online format, students track personal fitness goals, design workout plans, and reflect on physical activity through a structured fitness journal.',
    topics: ['Components of fitness: cardiovascular, strength, flexibility', 'Principles of training and exercise design', 'Nutrition basics and hydration', 'Goal-setting and fitness tracking', 'Safety and injury prevention'],
    resources: [
      { title: 'American Heart Association — Fitness', url: 'https://www.heart.org/en/healthy-living/fitness' },
      { title: 'Fitness Blender — Free Workouts', url: 'https://www.fitnessblender.com/' },
      { title: 'MyFitnessPal — Fitness Tracking', url: 'https://www.myfitnesspal.com/' },
    ],
  },
  'Health & Wellness': {
    desc: 'A comprehensive introduction to personal health covering mental, physical, and social well-being. Topics include stress management, sleep hygiene, mental health awareness, and making informed health decisions in a digital world.',
    topics: ['Dimensions of health: physical, mental, social', 'Stress management strategies', 'Sleep science and sleep hygiene', 'Mental health: identifying and addressing challenges', 'Digital wellness and healthy screen habits'],
    resources: [
      { title: 'NIH MedlinePlus', url: 'https://medlineplus.gov/' },
      { title: 'CDC Healthy Living', url: 'https://www.cdc.gov/healthyliving/' },
      { title: 'Headspace — Mindfulness Basics', url: 'https://www.headspace.com/' },
    ],
  },
  'Health and Nutrition': {
    desc: 'Examines the science of nutrition and its relationship to health. Students learn how macronutrients and micronutrients function in the body, how to evaluate food labels, and how dietary choices influence long-term health outcomes.',
    topics: ['Macronutrients: carbohydrates, proteins, fats', 'Micronutrients: vitamins and minerals', 'Reading nutrition labels and dietary guidelines', 'Nutrition across the lifespan', 'Eating disorders: awareness and prevention'],
    resources: [
      { title: 'USDA MyPlate', url: 'https://www.myplate.gov/' },
      { title: 'NIH Office of Dietary Supplements', url: 'https://ods.od.nih.gov/' },
      { title: 'Khan Academy — Health and Medicine', url: 'https://www.khanacademy.org/science/health-and-medicine' },
    ],
  },
  'Fitness Leadership': {
    desc: 'Students develop the skills to design, lead, and evaluate fitness programs for themselves and others. A practical course connecting exercise science to leadership, suitable for students interested in health, coaching, or sports management.',
    topics: ['Principles of fitness program design', 'Leading group exercise and motivation techniques', 'Exercise physiology fundamentals', 'Safety, liability, and professional standards in fitness', 'Peer coaching and feedback skills'],
    resources: [
      { title: 'ACE Fitness — Exercise Library', url: 'https://www.acefitness.org/resources/everyone/exercise-library/' },
      { title: 'American Heart Association — Physical Activity', url: 'https://www.heart.org/en/healthy-living/fitness' },
      { title: 'Fitness Blender', url: 'https://www.fitnessblender.com/' },
    ],
  },
  'Athletic Training': {
    desc: 'Introduces the science and practice of athletic training and sports medicine. Students learn about injury prevention, basic first aid, taping techniques, rehabilitation concepts, and the role of certified athletic trainers in sport.',
    topics: ['Anatomy of common sports injuries', 'Injury prevention strategies and warm-up protocols', 'RICE method and basic first aid for athletes', 'Introduction to rehabilitation and recovery', 'The athletic training profession and career pathways'],
    resources: [
      { title: 'National Athletic Trainers Association', url: 'https://www.nata.org/' },
      { title: 'Khan Academy — Anatomy & Physiology', url: 'https://www.khanacademy.org/science/health-and-medicine' },
      { title: 'Sports Med — Sports Injury Resources', url: 'https://www.sportsmd.com/' },
    ],
  },
  'Sports Management & Leadership': {
    desc: 'Explores the business side of sports — team management, sports marketing, event operations, and organizational leadership. An ideal capstone for students interested in sports business, management, or communications careers.',
    topics: ['Sports industry overview: leagues, teams, media rights', 'Sports marketing and sponsorship strategy', 'Event management and operations', 'Leadership in sports organizations', 'Sports analytics and data-driven decision-making'],
    resources: [
      { title: 'Sports Business Journal', url: 'https://www.sportsbusinessjournal.com/' },
      { title: 'Coursera — Sports Management', url: 'https://www.coursera.org/courses?query=sports+management' },
      { title: 'MIT Sloan Sports Analytics Conference', url: 'https://www.sloansportsconference.com/' },
    ],
  },
  'Sports Psychology': {
    desc: 'Explores the mental and emotional factors that influence athletic performance and physical activity. Applies psychology principles — motivation, goal-setting, visualization, and team dynamics — to sport and performance contexts.',
    topics: ['Motivation theories in sport', 'Goal-setting: SMART goals in athletic training', 'Mental imagery and visualization techniques', 'Team cohesion and group dynamics', 'Coping with pressure and performance anxiety'],
    resources: [
      { title: 'APA — Sport Psychology', url: 'https://www.apa.org/topics/sport-performance' },
      { title: 'TED Talk — The Athlete\'s Mind', url: 'https://www.ted.com/topics/sports' },
      { title: 'Sport Psychology Today', url: 'https://www.sportpsychologytoday.com/' },
    ],
  },

  // ── Business Electives ────────────────────────────────────────────────────
  'Introduction to Business & Economics': {
    desc: 'The gateway to business studies at GIIS. Students explore how businesses create value, how markets allocate resources, and the relationship between the economy and individual financial decisions. No prior knowledge assumed.',
    topics: ['What businesses do: production, profit, and value creation', 'Basic microeconomics: scarcity, choice, opportunity cost', 'Types of businesses: sole proprietorship, partnership, corporation', 'Introduction to market economies', 'Globalization and international business basics'],
    resources: [
      { title: 'Khan Academy — Economics', url: 'https://www.khanacademy.org/economics-finance-domain' },
      { title: 'Crash Course — Economics', url: 'https://www.youtube.com/playlist?list=PL8dPuuaLjXtPNZwz5_o_5uirJ8gQXnhEO' },
      { title: 'MIT OpenCourseWare — Business', url: 'https://ocw.mit.edu/courses/sloan-school-of-management/' },
    ],
  },
  'Business Technology & Digital Literacy': {
    desc: 'Develops the technology skills modern business professionals need. Students learn to use productivity tools (spreadsheets, presentations, databases), understand digital communication etiquette, and explore how technology is transforming industries.',
    topics: ['Spreadsheet fundamentals: Google Sheets and Excel', 'Data organization and basic visualization', 'Digital communication: email and collaboration tools', 'Introduction to AI tools in business', 'Digital privacy, security, and professional ethics'],
    resources: [
      { title: 'Google Workspace Learning Center', url: 'https://workspace.google.com/learning-center/' },
      { title: 'Microsoft — Excel for Beginners', url: 'https://support.microsoft.com/en-us/excel' },
      { title: 'LinkedIn Learning — Digital Skills', url: 'https://www.linkedin.com/learning/' },
    ],
  },
  'Entrepreneurship Fundamentals': {
    desc: 'An introductory course in entrepreneurial thinking. Students explore how new ventures start, identify opportunities, and build business models. Includes a mini business plan project presented to the class.',
    topics: ['Entrepreneurial mindset and opportunity recognition', 'Business model canvas and value proposition', 'Market research and customer discovery', 'Startup financing: bootstrapping, angel investors, VCs', 'Mini business plan project presentation'],
    resources: [
      { title: 'Kauffman Foundation — Entrepreneurship', url: 'https://www.kauffman.org/' },
      { title: 'SCORE — Small Business Resources', url: 'https://www.score.org/' },
      { title: 'TED Talk — How Great Leaders Inspire Action', url: 'https://www.ted.com/talks/simon_sinek_how_great_leaders_inspire_action' },
    ],
  },
  'Marketing & Communication': {
    desc: "Covers the fundamentals of marketing — how companies understand customers, position products, and communicate value. Students study the 4 Ps of marketing, brand strategy, and how digital channels have transformed marketing practice.",
    topics: ['The marketing mix: Product, Price, Place, Promotion', 'Market segmentation and targeting', 'Brand strategy and positioning', 'Digital marketing channels overview', 'Consumer behavior and decision-making'],
    resources: [
      { title: 'HubSpot Academy — Marketing Basics', url: 'https://academy.hubspot.com/' },
      { title: 'Crash Course — Business Marketing', url: 'https://www.youtube.com/playlist?list=PL8dPuuaLjXtP2SEML9DPDgDhMO-HWQ_bh' },
      { title: 'American Marketing Association', url: 'https://www.ama.org/' },
    ],
  },
  'Leadership Communication': {
    desc: 'Develops the oral and written communication skills needed to lead teams, present ideas, and negotiate effectively. Students practice presentations, feedback conversations, and professional written communication.',
    topics: ['Elements of effective leadership communication', 'Presentation design and delivery', 'Active listening and giving constructive feedback', 'Negotiation and persuasion principles', 'Professional writing: memos, reports, executive summaries'],
    resources: [
      { title: 'Toastmasters — Speechcraft', url: 'https://www.toastmasters.org/' },
      { title: 'TED Talks on Leadership', url: 'https://www.ted.com/topics/leadership' },
      { title: 'Coursera — Leadership Communication', url: 'https://www.coursera.org/courses?query=leadership%20communication' },
    ],
  },
  'Digital Marketing': {
    desc: 'A practical course in modern digital marketing tools and strategy. Students learn SEO, social media marketing, content strategy, email marketing, and basic analytics — skills directly applicable to internships and college applications.',
    topics: ['Search engine optimization (SEO) fundamentals', 'Social media strategy: Instagram, LinkedIn, TikTok', 'Content marketing and blogging', 'Email marketing campaign design', 'Google Analytics and data-driven decision-making'],
    resources: [
      { title: 'Google Digital Garage — Free Certification', url: 'https://learndigital.withgoogle.com/digitalgarage' },
      { title: 'HubSpot Academy — Digital Marketing', url: 'https://academy.hubspot.com/' },
      { title: 'Semrush Academy', url: 'https://www.semrush.com/academy/' },
    ],
  },
  'Business Writing': {
    desc: 'Trains students in the professional writing genres required in business: emails, reports, proposals, memos, and executive summaries. Strong writing is consistently cited as the top skill employers seek in new graduates.',
    topics: ['Professional email etiquette and structure', 'Business report writing: formal and informal', 'Proposal writing and executive summaries', 'Editing for clarity and conciseness', 'Persuasive business communication'],
    resources: [
      { title: 'Purdue OWL — Business Writing', url: 'https://owl.purdue.edu/owl/subject_specific_writing/professional_technical_writing/' },
      { title: 'Harvard Business Review — Writing Tips', url: 'https://hbr.org/topic/subject/writing' },
      { title: 'LinkedIn Learning — Business Writing', url: 'https://www.linkedin.com/learning/topics/business-writing' },
    ],
  },
  'Business Ethics & Critical Thinking': {
    desc: 'Examines the ethical dimensions of business decisions. Students analyze case studies involving corporate responsibility, stakeholder conflicts, environmental sustainability, and the ethics of emerging technologies like AI.',
    topics: ['Ethical frameworks: utilitarianism, deontology, virtue ethics', 'Corporate social responsibility (CSR)', 'Stakeholder theory vs. shareholder theory', 'Case studies: Enron, Volkswagen, Facebook', 'AI ethics and algorithmic bias'],
    resources: [
      { title: 'Harvard Business School — Ethics Cases', url: 'https://www.hbs.edu/faculty/research/Pages/topic.aspx?topic=Ethics' },
      { title: 'MIT Technology Review', url: 'https://www.technologyreview.com/' },
      { title: 'Crash Course — Philosophy: Ethics', url: 'https://www.youtube.com/playlist?list=PL8dPuuaLjXtNgK6MoafnFk9ROQrd6dOzq' },
    ],
  },
  'Organizational Behavior': {
    desc: 'Applies psychology and sociology to understand how individuals and groups behave in organizations. Students study motivation, leadership styles, organizational culture, conflict resolution, and team effectiveness.',
    topics: ['Individual behavior: personality, perception, attitudes at work', 'Motivation theories: Maslow, Herzberg, self-determination', 'Leadership styles and situational leadership', 'Organizational culture and change management', 'Team dynamics and conflict resolution'],
    resources: [
      { title: 'MIT OpenCourseWare — Organizational Behavior', url: 'https://ocw.mit.edu/courses/sloan-school-of-management/' },
      { title: 'Coursera — Inspiring Leadership', url: 'https://www.coursera.org/learn/inspiring-leadership-character' },
      { title: 'Harvard Business Review — Management', url: 'https://hbr.org/topic/subject/organizational-culture' },
    ],
  },
  'Business Strategy & Writing': {
    desc: 'Integrates strategic thinking with professional communication. Students analyze business cases, develop strategic recommendations, and communicate them in polished reports and presentations — direct preparation for business school.',
    topics: ["Strategic analysis frameworks: SWOT, Porter's Five Forces, PESTLE", 'Competitive strategy: differentiation, cost leadership, focus', 'Case study analysis and strategic recommendation writing', 'Executive presentations and strategy communication', 'Business model innovation'],
    resources: [
      { title: 'Harvard Business School Publishing', url: 'https://www.hbsp.harvard.edu/' },
      { title: 'McKinsey Quarterly — Strategy Insights', url: 'https://www.mckinsey.com/quarterly' },
      { title: 'Coursera — Business Strategy', url: 'https://www.coursera.org/learn/uva-darden-foundations-of-business-strategy' },
    ],
  },
  'Business Law': {
    desc: 'Introduces the legal environment of business including contracts, liability, intellectual property, employment law, and regulatory compliance. Students develop the legal literacy essential for entrepreneurs, managers, and professionals.',
    topics: ['Contract law: offer, acceptance, consideration, and breach', 'Business entity law: LLC, corporation, partnership', 'Intellectual property: patents, trademarks, copyrights', 'Employment law and workplace regulations', 'Consumer protection and regulatory compliance'],
    resources: [
      { title: 'Cornell Law — Legal Information Institute', url: 'https://www.law.cornell.edu/' },
      { title: 'Khan Academy — Contracts and Law', url: 'https://www.khanacademy.org/' },
      { title: 'Coursera — Law for Entrepreneurs', url: 'https://www.coursera.org/learn/law-for-entrepreneurs' },
    ],
  },
  'Corporate Finance': {
    desc: 'An introduction to how companies make financial decisions. Students learn financial statement analysis, time value of money, capital budgeting, and risk — the core content of undergraduate corporate finance courses.',
    topics: ['Financial statements: income statement, balance sheet, cash flow', 'Time value of money: present value, future value, annuities', 'Capital budgeting: NPV, IRR, payback period', 'Cost of capital and WACC', 'Risk and return: introduction to CAPM'],
    resources: [
      { title: 'Khan Academy — Finance & Capital Markets', url: 'https://www.khanacademy.org/economics-finance-domain/core-finance' },
      { title: 'Investopedia — Finance Academy', url: 'https://www.investopedia.com/financial-term-dictionary-4769738' },
      { title: 'MIT OpenCourseWare — Corporate Finance', url: 'https://ocw.mit.edu/courses/15-401-finance-theory-i-fall-2008/' },
    ],
  },
  'Personal Finance / Applied Economics': {
    desc: 'A practical course applying economic and financial reasoning to everyday decisions. Students learn budgeting, investing, credit, taxes, insurance, and retirement planning — financial literacy skills that compound over a lifetime.',
    topics: ['Budgeting and personal cash flow management', 'Credit, debt, and responsible borrowing', 'Investing basics: stocks, bonds, index funds, compound interest', 'Taxes: how they work and basic tax planning', 'Insurance and risk management'],
    resources: [
      { title: 'Khan Academy — Personal Finance', url: 'https://www.khanacademy.org/college-careers-more/personal-finance' },
      { title: 'NEFE — Financial Education', url: 'https://www.nefe.org/' },
      { title: 'Investopedia', url: 'https://www.investopedia.com/' },
    ],
  },

  // ── Psychology Electives ──────────────────────────────────────────────────
  'Introduction to Psychology': {
    desc: 'The entry point into psychological science. Students explore what psychology is, its major theoretical schools (behaviorism, psychoanalysis, humanism, cognitive), and how psychologists study behavior and mental processes.',
    topics: ['History of psychology and major schools of thought', 'Research methods: experiments, surveys, case studies', 'Biological basis of behavior: neurons and the brain', 'States of consciousness: sleep, dreaming, altered states', 'Sensation and perception'],
    resources: [
      { title: 'Khan Academy — Psychology', url: 'https://www.khanacademy.org/test-prep/mcat/processing-the-environment' },
      { title: 'Crash Course — Psychology', url: 'https://www.youtube.com/playlist?list=PL8dPuuaLjXtOPRKzVLY0jJY-uHOH9KVU6' },
      { title: 'APA — Psychology Topics', url: 'https://www.apa.org/topics' },
    ],
  },
  'Human Development': {
    desc: 'Examines psychological development from conception through adulthood. Students explore physical, cognitive, and socio-emotional changes across the lifespan, with particular focus on adolescent identity development — directly relevant to student self-understanding.',
    topics: ['Prenatal development and infancy', "Piaget's cognitive development stages", "Erikson's psychosocial development stages", 'Adolescent identity formation (Marcia)', 'Adult development and healthy aging'],
    resources: [
      { title: 'Khan Academy — Development', url: 'https://www.khanacademy.org/test-prep/mcat/individuals-and-society/social-development' },
      { title: 'Crash Course — Developmental Psychology', url: 'https://www.youtube.com/playlist?list=PL8dPuuaLjXtOPRKzVLY0jJY-uHOH9KVU6' },
      { title: 'CDC — Developmental Milestones', url: 'https://www.cdc.gov/ncbddd/actearly/milestones/' },
    ],
  },
  'Psychology Foundations': {
    desc: 'Deepens understanding of core psychological processes: learning, memory, emotion, motivation, and thought. Students connect psychological research to everyday behavior and develop skills in reading and interpreting empirical studies.',
    topics: ['Classical and operant conditioning', 'Memory: encoding, storage, retrieval, and forgetting', 'Thinking, language, and problem-solving', 'Emotion and emotional regulation', 'Motivation: drives, incentives, and intrinsic motivation'],
    resources: [
      { title: 'Khan Academy — Cognition', url: 'https://www.khanacademy.org/test-prep/mcat/processing-the-environment' },
      { title: 'Crash Course — Psychology', url: 'https://www.youtube.com/playlist?list=PL8dPuuaLjXtOPRKzVLY0jJY-uHOH9KVU6' },
      { title: 'Simply Psychology', url: 'https://www.simplypsychology.org/' },
    ],
  },
  'Social Psychology': {
    desc: 'Explores how people influence each other\'s thoughts, feelings, and behaviors. Students study classic social psychology research — Milgram, Zimbardo, Asch — and apply findings to real-world phenomena including prejudice, conformity, and persuasion.',
    topics: ['Social cognition: attribution and social perception', 'Conformity, compliance, and obedience', 'Attitudes and persuasion (Cialdini)', 'Prejudice, stereotyping, and discrimination', 'Prosocial behavior: helping, altruism, bystander effect'],
    resources: [
      { title: 'Khan Academy — Social Psychology', url: 'https://www.khanacademy.org/test-prep/mcat/individuals-and-society/social-psychology' },
      { title: 'Crash Course — Social Thinking', url: 'https://www.youtube.com/playlist?list=PL8dPuuaLjXtOPRKzVLY0jJY-uHOH9KVU6' },
      { title: 'Social Psychology Network', url: 'https://www.socialpsychology.org/' },
    ],
  },
  'Cognitive Psychology': {
    desc: 'Focuses on how people acquire, process, store, and use information. Students explore perception, attention, memory models, language, problem-solving, and decision-making — the mental processes underlying all human thought.',
    topics: ['Attention and cognitive load theory', 'Memory models: working memory and long-term memory', 'Language acquisition and processing', 'Problem-solving and heuristics', 'Decision-making: rational vs. behavioral perspectives'],
    resources: [
      { title: 'MIT OpenCourseWare — Cognitive Science', url: 'https://ocw.mit.edu/search/?q=cognitive+science' },
      { title: 'TED-Ed — How Memory Works', url: 'https://ed.ted.com/lessons/the-basics-of-memory-storage' },
      { title: 'Simply Psychology — Cognition', url: 'https://www.simplypsychology.org/cognitive.html' },
    ],
  },
  'Experimental Psychology': {
    desc: 'Introduces the research methodology behind psychological science. Students design, conduct (virtually), and analyze simple experiments — learning the full research process from hypothesis to write-up. Excellent preparation for university research methods courses.',
    topics: ['The scientific method applied to psychology', 'Experimental design: variables, controls, ethics', 'Research ethics and the IRB process', 'Statistical analysis for psychology data', 'Writing an APA-format research report'],
    resources: [
      { title: 'APA — Research Methods', url: 'https://www.apa.org/education-career/guide/psych-areas' },
      { title: 'Crash Course — Statistics', url: 'https://www.youtube.com/playlist?list=PL8dPuuaLjXtNM_Y-bUAhblSAdWRnmdfh3' },
      { title: 'Simply Psychology — Research Methods', url: 'https://www.simplypsychology.org/research-methods.html' },
    ],
  },
  'Psychology Seminar / Capstone': {
    desc: 'Senior capstone for psychology pathway students. Students select a psychological topic of interest, conduct a literature review, design a study, and present findings in a formal research presentation — mirroring undergraduate research experience.',
    topics: ['Literature review writing and synthesis', 'Research question and hypothesis formulation', 'Study design and methodology', 'Data presentation and visualization', 'Formal APA-format research presentation'],
    resources: [
      { title: 'Google Scholar', url: 'https://scholar.google.com/' },
      { title: 'APA Publication Manual Summary', url: 'https://apastyle.apa.org/' },
      { title: 'PsychINFO via APA', url: 'https://www.apa.org/pubs/databases/psycinfo' },
    ],
  },
  'Behavioral Science': {
    desc: 'Examines how behavioral science is applied in public health, policy, marketing, and technology. Students explore nudge theory, behavioral economics, and how organizations design better systems using behavioral insights.',
    topics: ['Nudge theory and libertarian paternalism', 'Behavioral economics: irrationality in real life', 'Applications in public health: vaccination, anti-smoking campaigns', 'Behavioral design in technology: UX and habit formation', 'Organizational behavior change programs'],
    resources: [
      { title: 'Behavioral Insights Team', url: 'https://www.bi.team/' },
      { title: 'Coursera — Behavioral Finance', url: 'https://www.coursera.org/learn/duke-behavioral-finance' },
      { title: 'TED Talk — Nudge Theory', url: 'https://www.ted.com/talks/richard_thaler_the_making_of_behavioral_economics' },
    ],
  },
  'Abnormal Psychology': {
    desc: 'Examines the classification, etiology, and treatment of psychological disorders using the DSM-5 framework. Students study mood disorders, anxiety disorders, psychotic disorders, personality disorders, and neurodevelopmental conditions.',
    topics: ['DSM-5 classification framework', 'Mood disorders: depression and bipolar disorder', 'Anxiety disorders: GAD, panic, phobias, OCD, PTSD', 'Psychotic disorders: schizophrenia spectrum', 'Personality disorders, ADHD, autism spectrum, and treatment modalities'],
    resources: [
      { title: 'Khan Academy — Psychological Disorders', url: 'https://www.khanacademy.org/test-prep/mcat/individuals-and-society/psychological-disorders' },
      { title: 'NAMI — National Alliance on Mental Illness', url: 'https://www.nami.org/' },
      { title: 'APA — Mental Health Topics', url: 'https://www.apa.org/topics' },
    ],
  },
  'Counseling & Mental Health Studies': {
    desc: 'An applied psychology course exploring counseling theories, therapeutic techniques, and mental health systems. Appropriate for students considering careers in social work, counseling, or psychiatry. Focuses on empathy, listening, and professional ethics.',
    topics: ['Major counseling theories: CBT, person-centered, psychodynamic', 'Active listening and empathy skills', 'Mental health systems and services', 'Crisis intervention principles', 'Cultural competence in counseling'],
    resources: [
      { title: 'American Counseling Association', url: 'https://www.counseling.org/' },
      { title: 'Coursera — Mental Health First Aid', url: 'https://www.coursera.org/learn/mhfa' },
      { title: 'APA — Counseling Psychology', url: 'https://www.apa.org/ed/graduate/specialize/counseling' },
    ],
  },
  'Media Psychology': {
    desc: 'Examines the psychological impact of media — television, social media, gaming, and digital advertising — on beliefs, attitudes, and behavior. An increasingly vital field as students and society grapple with the effects of screens and social networks.',
    topics: ['Media influence on attitudes and behavior', 'Social media and identity formation in adolescence', 'Fear, violence, and desensitization in media', 'Advertising psychology and persuasion techniques', 'Digital well-being and healthy media habits'],
    resources: [
      { title: 'APA — Media Psychology', url: 'https://www.apa.org/topics/media-technology' },
      { title: 'Common Sense Media — Research', url: 'https://www.commonsensemedia.org/research' },
      { title: 'TED Talk — Social Media and Loneliness', url: 'https://www.ted.com/talks/vivek_murthy_how_loneliness_is_bad_for_our_health' },
    ],
  },

  // ── Communication & Research Electives ───────────────────────────────────
  'Business Media Literacy': {
    desc: 'Helps students critically evaluate business news, financial reporting, and advertising. Students learn to distinguish credible sources, identify bias, and consume information as informed future professionals and investors.',
    topics: ['What is media literacy? Reading critically', 'Source evaluation: credibility, bias, and fact-checking', 'Reading business and financial news articles', 'Advertising literacy: recognizing persuasion techniques', 'Social media literacy and digital citizenship'],
    resources: [
      { title: 'MediaLit — Media Literacy Project', url: 'https://medialit.org/' },
      { title: 'Snopes — Fact Checking', url: 'https://www.snopes.com/' },
      { title: 'Wall Street Journal — Student Edition', url: 'https://www.wsj.com/news/student' },
    ],
  },
  'Introduction to Communication': {
    desc: 'Surveys the field of communication: interpersonal, group, organizational, and mass communication. Students explore communication models, barriers to effective communication, listening skills, and nonverbal communication.',
    topics: ['Communication process models', 'Verbal and nonverbal communication', 'Active listening and barriers to communication', 'Interpersonal communication in relationships', 'Group communication dynamics'],
    resources: [
      { title: 'TED-Ed — Communication Skills', url: 'https://ed.ted.com/' },
      { title: 'Communication Theory', url: 'https://communicationtheory.org/' },
      { title: 'Coursera — Effective Communication', url: 'https://www.coursera.org/courses?query=communication' },
    ],
  },
  'Public Speaking': {
    desc: 'A practical course in oral communication. Students prepare and deliver multiple speeches — informative, persuasive, and special occasion — receiving structured feedback to build confidence and competence in public presentation.',
    topics: ['Speech preparation and outlining', 'Vocal delivery: rate, volume, pitch, and pause', 'Nonverbal communication and stage presence', 'Informative speeches: structure and clarity', 'Persuasive speeches: argument and emotional appeals'],
    resources: [
      { title: 'Toastmasters International', url: 'https://www.toastmasters.org/' },
      { title: 'TED Masterclass — Public Speaking', url: 'https://www.ted.com/participate/ted-masterclass' },
      { title: 'Dale Carnegie Public Speaking', url: 'https://www.dalecarnegie.com/en/courses/public-speaking' },
    ],
  },
  'Media & Society': {
    desc: 'Examines how mass media — news, entertainment, advertising, and social media — shapes public opinion, culture, and democracy. Students analyze media ownership, representation, and the economics of the attention economy.',
    topics: ['History of mass media: print to digital', 'Media ownership and concentration', 'News media: agenda-setting and framing', 'Representation in media: race, gender, class', 'The attention economy and algorithm-driven content'],
    resources: [
      { title: 'Frontline — News War (PBS)', url: 'https://www.pbs.org/wgbh/frontline/' },
      { title: 'Crash Course — Media Literacy', url: 'https://www.youtube.com/playlist?list=PL8dPuuaLjXtM6jkn-xDb7gemUXgexBh3i' },
      { title: 'Common Sense Media', url: 'https://www.commonsensemedia.org/' },
    ],
  },
  'Academic Writing': {
    desc: 'A rigorous writing course focused on the essay genres required at university level. Students write analytical, argumentative, and synthesis essays, learning to engage with scholarly sources and construct knowledge-based arguments.',
    topics: ['Academic essay structure: introduction, body, conclusion', 'Thesis development and argument construction', 'Engaging with and citing scholarly sources', 'Synthesis writing: integrating multiple sources', 'MLA and APA citation styles'],
    resources: [
      { title: 'Purdue OWL — Academic Writing', url: 'https://owl.purdue.edu/owl/general_writing/academic_writing/' },
      { title: 'Harvard Writing Center', url: 'https://writingcenter.fas.harvard.edu/' },
      { title: 'Google Scholar', url: 'https://scholar.google.com/' },
    ],
  },
  'Business Research Methods': {
    desc: 'Introduces quantitative and qualitative research methods used in business contexts. Students learn to define research questions, collect and analyze data, and present findings — skills essential for business analytics and consulting.',
    topics: ['Research design: exploratory vs. explanatory studies', 'Survey design and questionnaire methods', 'Basic quantitative analysis: means, correlations, regression', 'Qualitative methods: interviews and case studies', 'Business research report writing'],
    resources: [
      { title: 'MIT OpenCourseWare — Research Methods', url: 'https://ocw.mit.edu/' },
      { title: 'Coursera — Business Statistics', url: 'https://www.coursera.org/courses?query=business+statistics' },
      { title: 'Harvard Business Review — Research', url: 'https://hbr.org/' },
    ],
  },
  'Research Methods in Social Science': {
    desc: 'A comprehensive introduction to social science research methodology. Students learn to design studies, collect and analyze data, evaluate existing research, and understand the ethical dimensions of research involving human subjects.',
    topics: ['Scientific method and research ethics in social science', 'Quantitative methods: surveys, experiments, quasi-experiments', 'Qualitative methods: ethnography, interviews, content analysis', 'Mixed-methods research design', 'Statistical analysis basics and data interpretation'],
    resources: [
      { title: 'Open University — Research Methods', url: 'https://www.open.ac.uk/' },
      { title: 'Crash Course — Statistics', url: 'https://www.youtube.com/playlist?list=PL8dPuuaLjXtNM_Y-bUAhblSAdWRnmdfh3' },
      { title: 'APA — Research Ethics', url: 'https://www.apa.org/ethics/code' },
    ],
  },
  'Ethics & Critical Thinking': {
    desc: 'Develops philosophical reasoning and ethical decision-making skills. Students study major ethical frameworks and apply them to contemporary moral dilemmas in technology, medicine, business, and politics.',
    topics: ['Introduction to ethics: what it is and why it matters', 'Major ethical theories: utilitarianism, Kantian ethics, virtue ethics', 'Applied ethics: bioethics, environmental ethics, technology ethics', 'Critical thinking: argument analysis and logical fallacies', 'Case-based reasoning and ethical dilemmas'],
    resources: [
      { title: 'Crash Course — Philosophy: Ethics', url: 'https://www.youtube.com/playlist?list=PL8dPuuaLjXtNgK6MoafnFk9ROQrd6dOzq' },
      { title: 'Stanford Encyclopedia of Philosophy', url: 'https://plato.stanford.edu/' },
      { title: 'BBC — Ethics Guide', url: 'https://www.bbc.co.uk/ethics/introduction/' },
    ],
  },
  'College Research & Writing': {
    desc: 'Bridges high school and university expectations in research and writing. Students complete a college-level research paper using peer-reviewed sources, practicing academic conventions of citation, evidence synthesis, and scholarly argumentation.',
    topics: ['Finding credible academic sources via databases and Google Scholar', 'Evaluating and annotating sources', 'Thesis development and outline building', 'Integrating quotations and paraphrase with correct citation', 'Revision for academic tone and argument coherence'],
    resources: [
      { title: 'Purdue OWL', url: 'https://owl.purdue.edu/' },
      { title: 'Google Scholar', url: 'https://scholar.google.com/' },
      { title: 'JSTOR — Academic Articles', url: 'https://www.jstor.org/' },
    ],
  },
  'Digital Media & Society': {
    desc: 'Examines the social, cultural, and political implications of digital media platforms. Students analyze how algorithms, social networks, and digital content shape public discourse, democratic participation, and personal identity in the 21st century.',
    topics: ['How social media platforms shape information flow', 'Algorithm design and filter bubbles', 'Digital democracy: civic participation and misinformation', 'Online identity and digital self-presentation', 'Privacy, surveillance, and data rights'],
    resources: [
      { title: 'Data & Society Research Institute', url: 'https://datasociety.net/' },
      { title: 'TED Talk — The Filter Bubble', url: 'https://www.ted.com/talks/eli_pariser_beware_online_filter_bubbles' },
      { title: 'Crash Course — Media Literacy', url: 'https://www.youtube.com/playlist?list=PL8dPuuaLjXtM6jkn-xDb7gemUXgexBh3i' },
    ],
  },
};

const PATHWAYS = [
  { title: 'CS & Engineering',     color: '#1565C0', emoji: '💻', to: '/pathways/cs',             zh: '计算机科学' },
  { title: 'Engineering Science',  color: '#B71C1C', emoji: '⚙️', to: '/pathways/engineering',    zh: '工程科学' },
  { title: 'Math & Data Science',  color: '#4527A0', emoji: '📐', to: '/pathways/math',           zh: '数学与数据科学' },
  { title: 'Business & Marketing', color: '#C84B0A', emoji: '📊', to: '/pathways/business',       zh: '商业与市场营销' },
  { title: 'Economics & Finance',  color: '#1B6B3A', emoji: '📈', to: '/pathways/economics',      zh: '经济与金融' },
  { title: 'Psychology',           color: '#5b2c6f', emoji: '🧠', to: '/pathways/psychology',    zh: '心理学' },
  { title: 'Communications',       color: '#E65100', emoji: '📡', to: '/pathways/communications', zh: '传播与媒体' },
  { title: 'Arts & Design',        color: '#6A1B9A', emoji: '🎨', to: '/pathways/arts',           zh: '艺术与设计' },
];

const DEPARTMENTS = [
  {
    id: 'english',
    label: { en: 'English Language Arts', zh: '英语语言艺术' },
    required: { en: '4 credits required', zh: '必修 4 学分' },
    color: '#2b3d6d',
    note: {
      en: 'Full four-year English sequence covering composition, literature, and analytical writing. Students typically earn 2 credits per year (fall + spring).',
      zh: '四年完整英语课程，涵盖写作、文学与分析表达。学生每年修习两门（秋季＋春季），各 1 学分。',
    },
    courses: [
      { name: 'English I',                            type: 'Core', credits: '1.0', grade: '9',  term: 'Fall' },
      { name: 'English I — Writing',                  type: 'Core', credits: '1.0', grade: '9',  term: 'Spring' },
      { name: 'English II',                           type: 'Core', credits: '1.0', grade: '10', term: 'Fall' },
      { name: 'English II — Literature',              type: 'Core', credits: '1.0', grade: '10', term: 'Spring' },
      { name: 'English III',                          type: 'Core', credits: '1.0', grade: '11', term: 'Fall' },
      { name: 'English III — Literature',             type: 'Core', credits: '1.0', grade: '11', term: 'Spring' },
      { name: 'English IV — Writing & Communication', type: 'Core', credits: '1.0', grade: '12', term: 'Fall' },
      { name: 'English IV — Advanced Composition',    type: 'Core', credits: '1.0', grade: '12', term: 'Spring' },
    ],
  },
  {
    id: 'math',
    label: { en: 'Mathematics', zh: '数学' },
    required: { en: '4 credits required', zh: '必修 4 学分' },
    color: '#1a5276',
    note: {
      en: 'Algebra I and Geometry are required in Grade 9. Students progress through Pre-Calculus in Grade 10, then choose advanced tracks (Statistics, Trigonometry, Calculus, or AP Statistics) in Grades 11–12.',
      zh: '9 年级必修代数 I 与几何，10 年级进入预微积分，11–12 年级可选进阶路径（统计、三角、微积分或 AP 统计）。',
    },
    courses: [
      { name: 'Algebra I',    type: 'Core', credits: '1.0', grade: '9',     term: 'Fall' },
      { name: 'Geometry',     type: 'Core', credits: '1.0', grade: '9',     term: 'Spring' },
      { name: 'Algebra II',   type: 'Core', credits: '1.0', grade: '10',    term: 'Fall' },
      { name: 'Pre-Calculus', type: 'Core', credits: '1.0', grade: '10',    term: 'Spring' },
      { name: 'Statistics',   type: 'Core', credits: '1.0', grade: '11',    term: 'Fall' },
      { name: 'Trigonometry', type: 'Core', credits: '1.0', grade: '11',    term: 'Spring' },
      { name: 'Calculus',     type: 'Core', credits: '1.0', grade: '12',    term: 'Fall' },
      { name: 'AP Statistics', type: 'AP',  credits: '1.0', grade: '11–12', term: 'Fall/Spring' },
    ],
  },
  {
    id: 'science',
    label: { en: 'Science', zh: '自然科学' },
    required: { en: '3 credits required', zh: '必修 3 学分' },
    color: '#1e8449',
    note: {
      en: 'Biology is required in Grade 9. Students complete Chemistry and Physics in Grade 10, with advanced science options available in Grades 11–12 including AP Biology.',
      zh: '9 年级必修生物，10 年级修化学与物理，11–12 年级可选进阶科学课程，包含 AP 生物。',
    },
    courses: [
      { name: 'Biology',              type: 'Core', credits: '1.0', grade: '9',     term: 'Fall' },
      { name: 'Environmental Science', type: 'Core', credits: '1.0', grade: '9',    term: 'Spring' },
      { name: 'Chemistry',            type: 'Core', credits: '1.0', grade: '10',    term: 'Fall' },
      { name: 'Physics Fundamentals', type: 'Core', credits: '1.0', grade: '10',    term: 'Spring' },
      { name: 'Biology — Advanced',   type: 'Core', credits: '1.0', grade: '11',    term: 'Fall' },
      { name: 'Physics — Mechanics',  type: 'Core', credits: '1.0', grade: '11',    term: 'Spring' },
      { name: 'AP Biology',           type: 'AP',   credits: '1.0', grade: '11–12', term: 'Fall/Spring' },
    ],
  },
  {
    id: 'social',
    label: { en: 'Social Studies', zh: '社会科学与历史' },
    required: { en: '3 credits required', zh: '必修 3 学分' },
    color: '#7a3b3b',
    note: {
      en: 'Covers U.S. and world history, geography, government, and economics — all required for Florida accreditation. AP Human Geography and AP Psychology are available for advanced study.',
      zh: '涵盖美国与世界历史、地理、政府与经济学，均为 Florida 认证要求科目。进阶学生可选修 AP 人文地理及 AP 心理学。',
    },
    courses: [
      { name: 'World History',      type: 'Core', credits: '0.5', grade: '9',     term: 'Fall' },
      { name: 'Geography',          type: 'Core', credits: '0.5', grade: '9',     term: 'Spring' },
      { name: 'U.S. History',       type: 'Core', credits: '0.5', grade: '10',    term: 'Fall' },
      { name: 'World Politics',     type: 'Core', credits: '0.5', grade: '10',    term: 'Spring' },
      { name: 'Government',         type: 'Core', credits: '1.0', grade: '11',    term: 'Spring' },
      { name: 'Economics',          type: 'Core', credits: '1.0', grade: '11',    term: 'Fall/Spring' },
      { name: 'Economics Seminar',  type: 'Core', credits: '1.0', grade: '12',    term: 'Fall' },
      { name: 'Sociology',          type: 'Core', credits: '1.0', grade: '12',    term: 'Spring' },
      { name: 'AP Human Geography', type: 'AP',   credits: '1.0', grade: '11–12', term: 'Spring' },
      { name: 'AP Psychology',      type: 'AP',   credits: '1.0', grade: '11',    term: 'Fall' },
    ],
  },
  {
    id: 'pe',
    label: { en: 'Health & Physical Education', zh: '健康与体育' },
    required: { en: '1 credit required', zh: '必修 1 学分' },
    color: '#5a6e3f',
    note: {
      en: 'Florida requires 1 credit in Physical Education with integrated health content. Students with an interest in sports or wellness may take additional electives in this area.',
      zh: 'Florida 要求修习 1 学分体育（含健康教育）。有兴趣的学生可进一步选修运动心理、运动管理等选修课。',
    },
    courses: [
      { name: 'Physical Education',             type: 'Core',    credits: '0.5', grade: '9',  term: 'Fall' },
      { name: 'Health & Wellness',              type: 'Core',    credits: '0.5', grade: '9',  term: 'Spring' },
      { name: 'Health and Nutrition',           type: 'Core',    credits: '0.5', grade: '9',  term: 'Spring' },
      { name: 'Sports Psychology',              type: 'Elective', credits: '0.5', grade: '10', term: 'Fall' },
      { name: 'Fitness Leadership',             type: 'Elective', credits: '0.5', grade: '11', term: 'Fall' },
      { name: 'Athletic Training',              type: 'Elective', credits: '0.5', grade: '12', term: 'Fall' },
      { name: 'Sports Management & Leadership', type: 'Elective', credits: '1.0', grade: '12', term: 'Spring' },
    ],
  },
  {
    id: 'business',
    label: { en: 'Electives — Business & Finance', zh: '选修：商业与财务' },
    required: { en: 'Elective credits', zh: '选修学分' },
    color: '#8b5e00',
    note: {
      en: 'Business electives form a popular concentration track at GIIS, covering entrepreneurship, marketing, finance, and organizational management — directly relevant to business and economics majors.',
      zh: '商业选修是 GIIS 的热门方向，涵盖创业、行销、财务与组织管理，对申请商学院的学生尤为有利。',
    },
    courses: [
      { name: 'Introduction to Business & Economics', type: 'Elective', credits: '0.5', grade: '9',  term: 'Fall' },
      { name: 'Business Technology & Digital Literacy', type: 'Elective', credits: '0.5', grade: '9', term: 'Fall' },
      { name: 'Entrepreneurship Fundamentals',        type: 'Elective', credits: '0.5', grade: '9',  term: 'Spring' },
      { name: 'Marketing & Communication',            type: 'Elective', credits: '0.5', grade: '10', term: 'Fall' },
      { name: 'Leadership Communication',             type: 'Elective', credits: '0.5', grade: '10', term: 'Spring' },
      { name: 'Digital Marketing',                    type: 'Elective', credits: '0.5', grade: '11', term: 'Fall' },
      { name: 'Business Writing',                     type: 'Elective', credits: '0.5', grade: '11', term: 'Fall' },
      { name: 'Business Ethics & Critical Thinking',  type: 'Elective', credits: '0.5', grade: '11', term: 'Spring' },
      { name: 'Organizational Behavior',              type: 'Elective', credits: '0.5', grade: '12', term: 'Fall' },
      { name: 'Business Strategy & Writing',          type: 'Elective', credits: '0.5', grade: '12', term: 'Fall' },
      { name: 'Business Law',                         type: 'Elective', credits: '1.0', grade: '12', term: 'Spring' },
      { name: 'Corporate Finance',                    type: 'Elective', credits: '1.0', grade: '12', term: 'Spring' },
      { name: 'Personal Finance / Applied Economics', type: 'Elective', credits: '1.0', grade: '12', term: 'Spring' },
    ],
  },
  {
    id: 'psychology',
    label: { en: 'Electives — Psychology & Behavioral Science', zh: '选修：心理学与行为科学' },
    required: { en: 'Elective credits', zh: '选修学分' },
    color: '#5b2c6f',
    note: {
      en: 'Psychology is offered as an elective track from Grade 9 and as AP Psychology in Grade 11. Students can build a full concentration through cognitive, social, and applied psychology courses.',
      zh: '心理学从 9 年级开始提供选修，11 年级可选 AP 心理学。学生可通过认知、社会与应用心理学课程建立完整的学习方向。',
    },
    courses: [
      { name: 'Introduction to Psychology',        type: 'Elective', credits: '0.5', grade: '9',    term: 'Fall' },
      { name: 'Human Development',                 type: 'Elective', credits: '0.5', grade: '9',    term: 'Spring' },
      { name: 'Psychology Foundations',            type: 'Elective', credits: '0.5', grade: '10',   term: 'Fall' },
      { name: 'Social Psychology',                 type: 'Elective', credits: '0.5', grade: '10',   term: 'Spring' },
      { name: 'AP Psychology',                     type: 'AP',       credits: '1.0', grade: '11',   term: 'Fall' },
      { name: 'Cognitive Psychology',              type: 'Elective', credits: '0.5', grade: '11',   term: 'Spring' },
      { name: 'Experimental Psychology',           type: 'Elective', credits: '0.5', grade: '11',   term: 'Spring' },
      { name: 'Psychology Seminar / Capstone',     type: 'Core',     credits: '1.0', grade: '12',   term: 'Fall' },
      { name: 'Behavioral Science',                type: 'Elective', credits: '0.5', grade: '12',   term: 'Fall' },
      { name: 'Abnormal Psychology',               type: 'Elective', credits: '1.0', grade: '12',   term: 'Spring' },
      { name: 'Counseling & Mental Health Studies', type: 'Elective', credits: '1.0', grade: '12',  term: 'Spring' },
      { name: 'Media Psychology',                  type: 'Elective', credits: '1.0', grade: '12',   term: 'Spring' },
    ],
  },
  {
    id: 'communication',
    label: { en: 'Electives — Communication & Research', zh: '选修：沟通与研究方法' },
    required: { en: 'Elective credits', zh: '选修学分' },
    color: '#2e6b6b',
    note: {
      en: 'Develops academic writing, public speaking, media literacy, and research skills — competencies valued by all US college admissions offices.',
      zh: '培养学术写作、公开演说、媒体素养与研究能力，是所有美国大学申请均重视的核心素养。',
    },
    courses: [
      { name: 'Business Media Literacy',              type: 'Elective', credits: '0.5', grade: '9',  term: 'Spring' },
      { name: 'Introduction to Communication',        type: 'Elective', credits: '0.5', grade: '10', term: 'Fall' },
      { name: 'Public Speaking',                      type: 'Elective', credits: '0.5', grade: '10', term: 'Spring' },
      { name: 'Media & Society',                      type: 'Elective', credits: '0.5', grade: '11', term: 'Fall' },
      { name: 'Academic Writing',                     type: 'Elective', credits: '0.5', grade: '11', term: 'Fall' },
      { name: 'Business Research Methods',            type: 'Elective', credits: '0.5', grade: '11', term: 'Spring' },
      { name: 'Research Methods in Social Science',   type: 'Elective', credits: '1.0', grade: '11', term: 'Spring' },
      { name: 'Ethics & Critical Thinking',           type: 'Elective', credits: '0.5', grade: '11', term: 'Spring' },
      { name: 'College Research & Writing',           type: 'Elective', credits: '0.5', grade: '12', term: 'Fall' },
      { name: 'Digital Media & Society',              type: 'Elective', credits: '1.0', grade: '12', term: 'Spring' },
    ],
  },
];

const TYPE_BADGE = {
  Core:    { bg: '#2b3d6d', label: { en: 'Core',    zh: '必修' } },
  AP:      { bg: '#8b0000', label: { en: 'AP',       zh: 'AP'  } },
  Elective:{ bg: '#5a5a5a', label: { en: 'Elective', zh: '选修' } },
};

function RequirementBar({ language }) {
  const isEn = language !== 'zh';
  return (
    <div style={{ marginBottom: '48px' }}>
      <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px', color: '#222' }}>
        {isEn ? `Graduation Requirements — ${TOTAL_CREDITS} Credits Total` : `毕业要求 — 共 ${TOTAL_CREDITS} 学分`}
      </h3>
      <p style={{ fontSize: '13px', color: '#666', marginBottom: '16px' }}>
        {isEn
          ? 'GIIS follows the Florida 24-credit accreditation framework, the standard for US-accredited private high schools recognized by US colleges and universities.'
          : 'GIIS 遵循 Florida 24 学分认证框架，此为美国各大学认可的美国私立高中标准学制。'}
      </p>
      <div style={{ display: 'flex', height: '12px', borderRadius: '6px', overflow: 'hidden', marginBottom: '12px' }}>
        {GRAD_REQUIREMENTS.map((r) => (
          <div key={r.area} title={`${r.area}: ${r.credits} cr`} style={{ flex: r.credits, backgroundColor: r.color, minWidth: '2px' }} />
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 20px' }}>
        {GRAD_REQUIREMENTS.map((r) => (
          <div key={r.area} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: r.color, flexShrink: 0 }} />
            <span style={{ color: '#444' }}>
              {isEn ? r.area : r.areaZh}
              <span style={{ color: '#888', marginLeft: '4px' }}>({r.credits} cr)</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CourseRow({ course, color, isEn }) {
  const [open, setOpen] = useState(false);
  const detail = COURSE_DETAILS[course.name];

  return (
    <div style={{ border: `1px solid ${open ? color : '#e8e8e8'}`, borderRadius: '8px', overflow: 'hidden', background: '#fff' }}>
      <button
        onClick={() => detail && setOpen(o => !o)}
        style={{
          width: '100%', textAlign: 'left', padding: '12px 14px',
          background: open ? `${color}08` : '#fff', border: 'none',
          cursor: detail ? 'pointer' : 'default',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: open ? color : '#222', lineHeight: 1.3 }}>{course.name}</span>
          {detail && (
            <span style={{ fontSize: '10px', color: '#aaa', fontWeight: 500, flexShrink: 0 }}>
              {isEn ? 'details ▾' : '查看 ▾'}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: '12px', color: '#888' }}>{course.credits} {isEn ? 'cr' : '学分'} · {course.term}</span>
          <span style={{
            fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '10px',
            background: TYPE_BADGE[course.type]?.bg || '#555', color: '#fff', letterSpacing: '0.4px',
          }}>
            {TYPE_BADGE[course.type]?.label[isEn ? 'en' : 'zh'] || course.type}
          </span>
        </div>
      </button>

      {open && detail && (
        <div style={{ borderTop: `1px solid ${color}20`, padding: '16px 18px', background: `${color}04` }}>
          <p style={{ margin: '0 0 14px', fontSize: '13px', color: '#444', lineHeight: 1.7 }}>{detail.desc}</p>

          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {isEn ? 'Key Topics' : '核心内容'}
              </p>
              <ul style={{ margin: 0, padding: '0 0 0 18px' }}>
                {detail.topics.map((t, i) => (
                  <li key={i} style={{ fontSize: '13px', color: '#555', marginBottom: 5, lineHeight: 1.5 }}>{t}</li>
                ))}
              </ul>
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {isEn ? 'Learning Resources' : '学习资源'}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {detail.resources.map((r, i) => (
                  <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" style={{
                    fontSize: '13px', color, fontWeight: 500, textDecoration: 'none',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <span style={{ fontSize: 11 }}>▶</span> {r.title}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CourseCatalog({ language }) {
  const isEn = language !== 'zh';
  const [activeId, setActiveId] = useState('english');
  const active = DEPARTMENTS.find((d) => d.id === activeId);

  return (
    <section style={{ padding: '80px 0 60px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 32px' }}>
        <h2 style={{ fontSize: '48px', fontWeight: 800, marginBottom: '4px', lineHeight: 1 }}>
          {isEn ? 'COURSE' : '课程'}
        </h2>
        <h2 style={{ fontSize: '48px', fontWeight: 800, marginBottom: '32px', lineHeight: 1 }}>
          {isEn ? 'CATALOG' : '目录'}
        </h2>

        <RequirementBar language={language} />

        <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: '220px', flexShrink: 0 }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#999', letterSpacing: '1px', margin: '0 0 4px 16px', textTransform: 'uppercase' }}>
              {isEn ? 'Required' : '必修'}
            </p>
            {DEPARTMENTS.filter((d) => ['english','math','science','social','pe'].includes(d.id)).map((dept) => (
              <button key={dept.id} onClick={() => setActiveId(dept.id)} style={tabStyle(dept, activeId)}>
                {dept.label[isEn ? 'en' : 'zh']}
              </button>
            ))}
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#999', letterSpacing: '1px', margin: '12px 0 4px 16px', textTransform: 'uppercase' }}>
              {isEn ? 'Elective Tracks' : '选修方向'}
            </p>
            {DEPARTMENTS.filter((d) => ['business','psychology','communication'].includes(d.id)).map((dept) => (
              <button key={dept.id} onClick={() => setActiveId(dept.id)} style={tabStyle(dept, activeId)}>
                {dept.label[isEn ? 'en' : 'zh']}
              </button>
            ))}
          </div>

          {/* Course list */}
          {active && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ borderLeft: `4px solid ${active.color}`, paddingLeft: '20px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: '22px', fontWeight: 700, margin: 0, color: active.color }}>
                    {active.label[isEn ? 'en' : 'zh']}
                  </h3>
                  <span style={{ fontSize: '13px', color: '#888', fontWeight: 500 }}>
                    {active.required[isEn ? 'en' : 'zh']}
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: '#666', margin: '8px 0 0', lineHeight: 1.6 }}>
                  {active.note[isEn ? 'en' : 'zh']}
                </p>
                {/* hint if courses have details */}
                {active.courses.some(c => COURSE_DETAILS[c.name]) && (
                  <p style={{ fontSize: '11px', color: '#aaa', margin: '6px 0 0', fontStyle: 'italic' }}>
                    {isEn ? '↓ Click a course to see topics and resources.' : '↓ 点击课程查看内容大纲与学习资源'}
                  </p>
                )}
              </div>

              {['9','10','11','12','11–12'].map((grade) => {
                const coursesInGrade = active.courses.filter((c) => c.grade === grade);
                if (coursesInGrade.length === 0) return null;
                return (
                  <div key={grade} style={{ marginBottom: '20px' }}>
                    <p style={{ fontSize: '11px', fontWeight: 700, color: '#aaa', letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 8px' }}>
                      {isEn ? `Grade ${grade}` : `${grade} 年级`}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {coursesInGrade.map((c) => (
                        <CourseRow key={c.name} course={c} color={active.color} isEn={isEn} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pathways grid */}
        <div style={{ marginTop: 56 }}>
          <h3 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 6px', color: '#1a1a2e' }}>
            {isEn ? 'Academic Pathways' : '学习方向'}
          </h3>
          <p style={{ fontSize: 13, color: '#666', margin: '0 0 20px', lineHeight: 1.6 }}>
            {isEn
              ? 'Choose a 4-year pathway to see full schedules, syllabi, curated resources, and interactive quizzes for every pathway course.'
              : '选择一个 4 年学习路径，查看完整课程安排、大纲、精选资源与互动测验。'}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {PATHWAYS.map((p) => (
              <Link key={p.to} to={p.to} style={{ textDecoration: 'none' }}>
                <div style={{
                  padding: '22px 20px',
                  borderRadius: 10,
                  background: `${p.color}10`,
                  border: `1px solid ${p.color}30`,
                  transition: 'box-shadow 0.2s',
                  cursor: 'pointer',
                }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = `0 4px 16px ${p.color}30`}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                >
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{p.emoji}</div>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: p.color }}>
                    {isEn ? p.title : p.zh}
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#888' }}>
                    {isEn ? 'View 4-year pathway →' : '查看完整路径 →'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function tabStyle(dept, activeId) {
  const isActive = activeId === dept.id;
  return {
    textAlign: 'left',
    padding: '10px 16px',
    border: 'none',
    borderLeft: `4px solid ${isActive ? dept.color : 'transparent'}`,
    background: isActive ? `${dept.color}18` : 'transparent',
    color: isActive ? dept.color : '#555',
    fontWeight: isActive ? 700 : 400,
    fontSize: '14px',
    cursor: 'pointer',
    borderRadius: '0 4px 4px 0',
    transition: 'all 0.15s',
    fontFamily: 'Inter, sans-serif',
    width: '100%',
  };
}
