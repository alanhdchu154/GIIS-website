import React from 'react';
import { PathwayPage } from './PathwayComponents';

const COLOR = '#4527A0'; // deep purple

const META = {
  color: COLOR,
  title: 'Mathematics & Data Science',
  subtitle: 'Turn numbers into insight. Insight into impact.',
  emoji: '📐',
  courseEmoji: '📐',
  heroDescription: 'A mathematically rigorous 4-year pathway for students targeting programs in Mathematics, Statistics, Data Science, or Actuarial Science. From proof-based mathematics through AP Statistics and machine learning foundations, you will graduate with the quantitative depth that top programs like MIT, CMU, and University of Chicago look for in math and data-focused majors.',
  targets: ['Mathematics / Applied Mathematics', 'Statistics & Actuarial Science', 'Data Science & Analytics', 'Quantitative Finance', 'Operations Research', 'Economics (Quantitative)'],
  collegeNote: 'Math programs value students who have gone beyond calculus — proof writing, statistics, and discrete math are major differentiators. AP Statistics and a strong Calculus record are the baseline; students who add data science coursework and quantitative projects stand out significantly at competitive programs.',
  stats: [{ label: 'AP Courses', value: 2 }],
};

const SCHEDULE = [
  { grade: 9, term: 'Fall', courses: [
    { name: 'English I',                      type: 'core',       credits: 1.0, dept: 'English Language Arts' },
    { name: 'Algebra I',                      type: 'core',       credits: 1.0, dept: 'Mathematics' },
    { name: 'Biology',                        type: 'core',       credits: 1.0, dept: 'Science' },
    { name: 'World History',                  type: 'core',       credits: 0.5, dept: 'Social Studies' },
    { name: 'Physical Education',             type: 'core',       credits: 0.5, dept: 'Health & PE' },
    { name: 'Mathematical Reasoning & Proof', type: 'pathway',    credits: 0.5, courseId: 'math-proof' },
  ]},
  { grade: 9, term: 'Spring', courses: [
    { name: 'English I — Writing',            type: 'core',       credits: 1.0, dept: 'English Language Arts' },
    { name: 'Geometry',                       type: 'core',       credits: 1.0, dept: 'Mathematics' },
    { name: 'Environmental Science',          type: 'core',       credits: 1.0, dept: 'Science' },
    { name: 'Geography',                      type: 'core',       credits: 0.5, dept: 'Social Studies' },
    { name: 'Health & Wellness',              type: 'core',       credits: 0.5, dept: 'Health & PE' },
    { name: 'Discrete Mathematics & Combinatorics', type: 'pathway', credits: 0.5, courseId: 'math-discrete' },
  ]},
  { grade: 10, term: 'Fall', courses: [
    { name: 'English II',                     type: 'core',       credits: 1.0, dept: 'English Language Arts' },
    { name: 'Algebra II',                     type: 'core',       credits: 1.0, dept: 'Mathematics' },
    { name: 'Chemistry',                      type: 'core',       credits: 1.0, dept: 'Science' },
    { name: 'U.S. History',                  type: 'core',       credits: 0.5, dept: 'Social Studies' },
    { name: 'Introduction to Statistics & Probability', type: 'pathway', credits: 0.5, courseId: 'math-stats1' },
    { name: 'Discrete Mathematics',           type: 'supporting', credits: 0.5, dept: 'Mathematics' },
  ]},
  { grade: 10, term: 'Spring', courses: [
    { name: 'English II — Literature',        type: 'core',       credits: 1.0, dept: 'English Language Arts' },
    { name: 'Pre-Calculus',                  type: 'core',       credits: 1.0, dept: 'Mathematics' },
    { name: 'Physics Fundamentals',          type: 'core',       credits: 1.0, dept: 'Science' },
    { name: 'World Politics',                type: 'core',       credits: 0.5, dept: 'Social Studies' },
    { name: 'Linear Algebra Foundations',    type: 'pathway',    credits: 0.5, courseId: 'math-linalg' },
  ]},
  { grade: 11, term: 'Fall', courses: [
    { name: 'English III',                   type: 'core',       credits: 1.0, dept: 'English Language Arts' },
    { name: 'Statistics',                    type: 'core',       credits: 1.0, dept: 'Mathematics' },
    { name: 'Biology — Advanced',            type: 'core',       credits: 1.0, dept: 'Science' },
    { name: 'AP Statistics',                 type: 'pathway',    credits: 1.0, courseId: 'math-apstats' },
  ]},
  { grade: 11, term: 'Spring', courses: [
    { name: 'English III — Literature',      type: 'core',       credits: 1.0, dept: 'English Language Arts' },
    { name: 'Trigonometry',                  type: 'core',       credits: 1.0, dept: 'Mathematics' },
    { name: 'Physics — Mechanics',           type: 'core',       credits: 1.0, dept: 'Science' },
    { name: 'Data Analysis with Python',     type: 'pathway',    credits: 0.5, courseId: 'math-data' },
    { name: 'AP Calculus BC',                type: 'supporting', credits: 1.0, dept: 'Mathematics', note: 'Strongly recommended' },
  ]},
  { grade: 12, term: 'Fall', courses: [
    { name: 'English IV — Writing & Communication', type: 'core', credits: 1.0, dept: 'English Language Arts' },
    { name: 'Calculus',                      type: 'core',       credits: 1.0, dept: 'Mathematics' },
    { name: 'Statistical Modeling & Machine Learning', type: 'pathway', credits: 1.0, courseId: 'math-ml' },
  ]},
  { grade: 12, term: 'Spring', courses: [
    { name: 'English IV — Advanced Composition', type: 'core',   credits: 1.0, dept: 'English Language Arts' },
    { name: 'Math & Data Science Capstone',  type: 'pathway',    credits: 1.0, courseId: 'math-capstone' },
  ]},
];

const COURSES = [
  {
    id: 'math-proof',
    name: 'Mathematical Reasoning & Proof',
    grade: 9, term: 'Fall', credits: 0.5,
    description: 'Mathematics is not about computation — it is about rigorous reasoning. This course introduces the language and logic of mathematical proof: direct proof, proof by contradiction, and proof by induction. Students learn to read and write proofs with precision, building the foundational skill that separates mathematicians from calculators.',
    syllabus: {
      objectives: [
        'Distinguish between mathematical definitions, theorems, conjectures, and examples',
        'Write direct proofs using algebraic and logical reasoning',
        'Apply proof by contradiction to establish impossibility results',
        'Use mathematical induction to prove statements about natural numbers',
        'Evaluate the validity of a given "proof" and identify logical errors',
      ],
      units: [
        { week: '1–2',   topic: 'Logic & Propositions',         desc: 'Statements, truth values, logical connectives (∧, ∨, ¬, →, ↔), truth tables, tautologies.' },
        { week: '3',     topic: 'Quantifiers & Predicates',     desc: 'Universal (∀) and existential (∃) quantifiers, negation of quantified statements, counterexamples.' },
        { week: '4–5',   topic: 'Sets & Set Operations',        desc: 'Set notation, subsets, union, intersection, complement, Cartesian product, Venn diagrams, power sets.' },
        { week: '6–7',   topic: 'Direct Proof',                 desc: 'Proof structure, even/odd integers, divisibility proofs, two-column vs. paragraph style.' },
        { week: '8–9',   topic: 'Proof by Contrapositive & Contradiction', desc: 'Contrapositive equivalence, proof by contradiction, classic results (√2 is irrational, infinitely many primes).' },
        { week: '10–12', topic: 'Mathematical Induction',       desc: 'Weak induction, strong induction, well-ordering principle. Proving formulas for sums and divisibility.' },
        { week: '13–14', topic: 'Relations & Functions',        desc: 'Injective, surjective, bijective functions, equivalence relations, partitions.' },
        { week: '15–16', topic: 'Proof Portfolio',              desc: 'Write, revise, and present a portfolio of five original proofs covering each technique learned.' },
      ],
    },
    resources: [
      { url: 'https://www.youtube.com/watch?v=V5tUc-J124s', title: 'Introduction to Mathematical Proofs — Full Lecture Series', channel: 'Professor Leonard', note: 'Rigorous and accessible university-level lectures on proof writing. Follow along with the logic and induction units.' },
      { url: 'https://www.khanacademy.org/math/statistics-probability/probability-library', title: 'Probability & Logic — Khan Academy', channel: 'Khan Academy', note: 'Interactive exercises on logical reasoning, truth tables, and set operations to reinforce lecture content.' },
      { url: 'https://ocw.mit.edu/courses/6-042j-mathematics-for-computer-science-fall-2010/', title: 'MIT OCW 6.042J — Mathematics for Computer Science', channel: 'MIT OpenCourseWare', note: 'MIT\'s foundational discrete math and proof course. Lecture notes and problem sets are free. Use for the logic, sets, and induction units.' },
      { url: 'https://www.youtube.com/watch?v=1N-jkHBCKh8', title: 'Mathematical Induction — Proof by Induction', channel: 'patrickJMT', note: 'Clear worked examples of induction proofs, including sum formulas and divisibility. Perfect for Week 10–12.' },
    ],
    quiz: [
      {
        q: 'Which of the following is the correct negation of the statement "For all integers n, if n² is even, then n is even"?',
        opts: [
          'For all integers n, if n is even, then n² is even',
          'There exists an integer n such that n² is even and n is odd',
          'For all integers n, n² is odd and n is even',
          'There exists an integer n such that n² is odd and n is odd',
        ],
        ans: 1,
        exp: 'Negating "∀n, P(n) → Q(n)" gives "∃n, P(n) ∧ ¬Q(n)". Here P(n) is "n² is even" and Q(n) is "n is even", so the negation is: there exists an integer n such that n² is even AND n is odd.',
      },
      {
        q: 'To prove "If n is odd, then n² is odd" by direct proof, which is the correct first step?',
        opts: [
          'Assume n² is odd and show n must be odd',
          'Assume n is even and derive a contradiction',
          'Write n = 2k + 1 for some integer k, then compute n²',
          'Assume the result is false and find a counterexample',
        ],
        ans: 2,
        exp: 'Direct proof begins by assuming the hypothesis. "n is odd" means n = 2k + 1 for some integer k. We then compute n² = (2k+1)² = 4k² + 4k + 1 = 2(2k² + 2k) + 1, which has the form 2m + 1, confirming n² is odd.',
      },
      {
        q: 'The classic proof that √2 is irrational proceeds by contradiction. After assuming √2 = p/q in lowest terms (gcd(p,q) = 1), the proof shows p must be even. What is the next key step?',
        opts: [
          'Conclude immediately that q must be odd, finishing the proof',
          'Substitute p = 2k and show that q² = 2k², so q must also be even — contradicting gcd(p,q) = 1',
          'Show that q must equal 1, making √2 an integer',
          'Use induction on p to show no such fraction can exist',
        ],
        ans: 1,
        exp: 'If p is even, write p = 2k. Then 2 = p²/q² implies q² = p²/2 = (2k)²/2 = 2k². So q² is even, meaning q is even. But then both p and q are even, contradicting gcd(p,q) = 1. This contradiction proves √2 cannot be rational.',
      },
      {
        q: 'A proof by mathematical induction on n consists of two steps. Which pair correctly describes them?',
        opts: [
          'Step 1: Prove the statement for n = 0. Step 2: Prove it for n = 1.',
          'Step 1 (Base Case): Verify the statement for n = 1 (or n = 0). Step 2 (Inductive Step): Assume it holds for n = k and prove it holds for n = k + 1.',
          'Step 1: Assume the statement is true for all n. Step 2: Derive a formula.',
          'Step 1 (Inductive Step): Prove for n = k + 1 without assumptions. Step 2 (Base Case): Prove for n = 1.',
        ],
        ans: 1,
        exp: 'Induction requires a base case (establishing the truth for the smallest value, usually n = 1) and an inductive step (assuming truth for n = k — the inductive hypothesis — and using it to prove truth for n = k + 1). Both steps together establish the statement for all natural numbers.',
      },
      {
        q: 'A function f: A → B is called injective (one-to-one) if:',
        opts: [
          'Every element of B is mapped to by at least one element of A',
          'f(a₁) = f(a₂) implies a₁ = a₂ for all a₁, a₂ in A',
          'Every element of A maps to every element of B',
          'f(a) ≠ f(b) for all a and b in A',
        ],
        ans: 1,
        exp: 'Injectivity means distinct inputs produce distinct outputs: if f(a₁) = f(a₂) then a₁ must equal a₂. Equivalently, no two different elements of A map to the same element of B. This is the logical definition — not to be confused with surjectivity (onto), which requires every element of B to be hit.',
      },
    ],
  },

  {
    id: 'math-discrete',
    name: 'Discrete Mathematics & Combinatorics',
    grade: 9, term: 'Spring', credits: 0.5,
    description: 'The mathematics of countable structures — the foundation of computer science, cryptography, and combinatorial reasoning. This course covers counting principles, graph theory, recurrences, and modular arithmetic, equipping students with powerful tools for competition mathematics and CS theory.',
    syllabus: {
      objectives: [
        'Apply the multiplication principle, permutations, and combinations to count arrangements',
        'Use the Pigeonhole Principle and inclusion-exclusion to solve counting problems',
        'Model and analyze real-world situations using graph theory concepts',
        'Solve recurrence relations using iteration and the characteristic root method',
        'Perform arithmetic in modular systems and apply it to divisibility and cryptography basics',
      ],
      units: [
        { week: '1–2',   topic: 'Counting Principles',          desc: 'Multiplication and addition principles, permutations, combinations, Pascal\'s triangle, binomial theorem.' },
        { week: '3',     topic: 'Advanced Counting',            desc: 'Pigeonhole Principle, inclusion-exclusion, permutations with repetition, multinomial coefficients.' },
        { week: '4–5',   topic: 'Graph Theory I',               desc: 'Vertices, edges, degrees, paths, cycles, connectedness, trees, Eulerian and Hamiltonian graphs.' },
        { week: '6',     topic: 'Graph Theory II',              desc: 'Bipartite graphs, graph coloring, planar graphs, Euler\'s formula V − E + F = 2.' },
        { week: '7–8',   topic: 'Recurrence Relations',         desc: 'Sequences defined recursively, Fibonacci, solving linear recurrences, characteristic roots.' },
        { week: '9–10',  topic: 'Modular Arithmetic',           desc: 'Congruences, arithmetic mod n, divisibility rules, Fermat\'s little theorem (statement and examples).' },
        { week: '11–12', topic: 'Probability & Counting',       desc: 'Sample spaces, equally-likely events, conditional probability, independence using combinatorial methods.' },
        { week: '13–16', topic: 'Problem Solving & Competition Prep', desc: 'AMC-style problems integrating all topics. Weekly problem sets with full written solutions and peer discussion.' },
      ],
    },
    resources: [
      { url: 'https://ocw.mit.edu/courses/6-042j-mathematics-for-computer-science-fall-2010/', title: 'MIT OCW 6.042J — Mathematics for Computer Science', channel: 'MIT OpenCourseWare', note: 'The gold standard discrete math course. Lecture notes cover combinatorics, graph theory, and number theory with problem sets.' },
      { url: 'https://www.youtube.com/watch?v=rdXw7Ps9vxc', title: 'Combinatorics — A Full Introductory Course', channel: 'Trefor Bazett', note: 'University-level combinatorics playlist covering permutations, combinations, and generating functions in clear visual lectures.' },
      { url: 'https://www.khanacademy.org/math/statistics-probability/counting-permutations-and-combinations', title: 'Counting, Permutations & Combinations', channel: 'Khan Academy', note: 'Interactive exercises on the fundamental counting techniques with immediate feedback.' },
      { url: 'https://artofproblemsolving.com/wiki/index.php/Combinatorics', title: 'Art of Problem Solving — Combinatorics Wiki', channel: 'Art of Problem Solving', note: 'Comprehensive problem-solving resource with worked AMC/AIME examples. Essential for the competition prep unit.' },
    ],
    quiz: [
      {
        q: 'In how many ways can a committee of 3 students be chosen from a group of 10?',
        opts: ['720', '30', '120', '10'],
        ans: 2,
        exp: 'We need C(10,3) = 10! / (3! × 7!) = (10 × 9 × 8) / (3 × 2 × 1) = 720 / 6 = 120. Order does not matter (it is a committee), so we use combinations, not permutations.',
      },
      {
        q: 'The Pigeonhole Principle guarantees that among any 13 people, at least two share a birth month. Why exactly 13?',
        opts: [
          'Because 13 is prime',
          'Because there are 12 months and 13 > 12, so at least one month must contain two people',
          'Because 13 × 2 = 26 which exceeds a year',
          'Because a year has 52 weeks and 52/4 = 13',
        ],
        ans: 1,
        exp: 'The Pigeonhole Principle: if n + 1 objects are placed into n containers, at least one container holds ≥ 2 objects. Here 12 months are the "containers" and 13 people are the "objects." With 13 people and only 12 months, at least one month must contain at least two people. With 12 people it is possible each has a different birth month.',
      },
      {
        q: 'A graph has 6 vertices, each with degree 3. How many edges does the graph have?',
        opts: ['18', '9', '6', '12'],
        ans: 1,
        exp: 'By the Handshaking Lemma, the sum of all vertex degrees equals twice the number of edges: Σdeg(v) = 2|E|. Here the sum is 6 × 3 = 18, so |E| = 18/2 = 9.',
      },
      {
        q: 'The Fibonacci sequence is defined by F(1) = 1, F(2) = 1, F(n) = F(n−1) + F(n−2). What is F(7)?',
        opts: ['11', '13', '8', '21'],
        ans: 1,
        exp: 'F(1)=1, F(2)=1, F(3)=2, F(4)=3, F(5)=5, F(6)=8, F(7)=13. Each term is the sum of the two preceding it.',
      },
      {
        q: 'What is 17 mod 5?',
        opts: ['3', '2', '4', '1'],
        ans: 1,
        exp: '17 = 5 × 3 + 2, so 17 ≡ 2 (mod 5). The remainder when dividing 17 by 5 is 2.',
      },
    ],
  },

  {
    id: 'math-stats1',
    name: 'Introduction to Statistics & Probability',
    grade: 10, term: 'Fall', credits: 0.5,
    description: 'Data is everywhere — this course teaches you how to make sense of it. Students explore descriptive statistics, probability theory, and the logic of statistical inference. Emphasis is placed on building conceptual understanding before computation, preparing students for the full rigor of AP Statistics in Grade 11.',
    syllabus: {
      objectives: [
        'Calculate and interpret measures of center, spread, and shape for distributions',
        'Apply the rules of probability including conditional probability and independence',
        'Identify and use the binomial and normal distributions in context',
        'Explain the reasoning behind confidence intervals and hypothesis testing at a conceptual level',
        'Recognize when a statistical claim is well-supported versus misleading',
      ],
      units: [
        { week: '1–2',   topic: 'Data & Distributions',         desc: 'Types of data, histograms, dotplots, stemplot, shape (symmetric, skewed, bimodal), outliers.' },
        { week: '3',     topic: 'Measures of Center & Spread',  desc: 'Mean, median, mode, range, IQR, standard deviation, variance — when to use each.' },
        { week: '4–5',   topic: 'Probability Foundations',      desc: 'Sample space, events, P(A), complement rule, addition rule, multiplication rule.' },
        { week: '6',     topic: 'Conditional Probability',      desc: 'P(A|B), independence, Bayes\' theorem (intuitive form), two-way tables.' },
        { week: '7–8',   topic: 'Discrete Probability Models',  desc: 'Random variables, expected value, variance. Binomial distribution: formula, mean, SD.' },
        { week: '9–10',  topic: 'The Normal Distribution',      desc: 'Bell curve, z-scores, empirical rule (68-95-99.7), normal probability calculations.' },
        { week: '11–12', topic: 'Sampling & Simulation',        desc: 'Random sampling, sampling variability, law of large numbers, simulation with dice/cards.' },
        { week: '13–16', topic: 'Introduction to Inference',    desc: 'Sampling distributions, concept of a confidence interval, logic of hypothesis testing — preview of AP Statistics.' },
      ],
    },
    resources: [
      { url: 'https://www.khanacademy.org/math/statistics-probability', title: 'Statistics & Probability — Full Course', channel: 'Khan Academy', note: 'Comprehensive, interactive course covering every topic in this class. Use the exercises for weekly practice.' },
      { url: 'https://www.youtube.com/watch?v=qBigTkBLU6g&list=PLblh5JKOoLUK0FLuzwntyYI10UQFUhsY9', title: 'StatQuest with Josh Starmer — Statistics Fundamentals', channel: 'StatQuest', note: 'Visual, intuitive explanations of statistical concepts. StatQuest is outstanding for building understanding before computation.' },
      { url: 'https://www.youtube.com/watch?v=XZo4xyJXCak', title: 'Normal Distribution — Statistics 101', channel: 'Brandon Foltz', note: 'Step-by-step guide to the normal distribution, z-scores, and probability calculations. Watch for Week 9–10.' },
      { url: 'https://ocw.mit.edu/courses/res-6-012-introduction-to-probability-spring-2018/', title: 'MIT OCW Introduction to Probability', channel: 'MIT OpenCourseWare', note: 'MIT\'s free probability course with lecture videos and problem sets. Use for the probability foundations units.' },
    ],
    quiz: [
      {
        q: 'A distribution has mean 50 and standard deviation 10. A data point has value 65. What is its z-score?',
        opts: ['0.65', '1.5', '15', '−1.5'],
        ans: 1,
        exp: 'z = (x − μ) / σ = (65 − 50) / 10 = 15 / 10 = 1.5. A z-score of 1.5 means the data point is 1.5 standard deviations above the mean.',
      },
      {
        q: 'Events A and B are independent. P(A) = 0.4 and P(B) = 0.3. What is P(A and B)?',
        opts: ['0.7', '0.1', '0.12', '0.58'],
        ans: 2,
        exp: 'For independent events, P(A ∩ B) = P(A) × P(B) = 0.4 × 0.3 = 0.12. Independence means knowing B occurred gives no information about A, so probabilities multiply directly.',
      },
      {
        q: 'A fair coin is flipped 10 times. Using the binomial distribution, what is the expected number of heads?',
        opts: ['4', '5', '6', '2.5'],
        ans: 1,
        exp: 'For a binomial distribution with n trials and success probability p, E(X) = np = 10 × 0.5 = 5. This is the long-run average over many repetitions of the 10-flip experiment.',
      },
      {
        q: 'For a strongly right-skewed distribution, which statement about the mean and median is correct?',
        opts: [
          'The mean equals the median',
          'The mean is less than the median',
          'The mean is greater than the median',
          'The median cannot be calculated for skewed data',
        ],
        ans: 2,
        exp: 'In a right-skewed distribution, the tail extends to the right. The mean is pulled toward the tail by large values, making it greater than the median. The median is resistant to outliers and extreme values; the mean is not.',
      },
    ],
  },

  {
    id: 'math-linalg',
    name: 'Linear Algebra Foundations',
    grade: 10, term: 'Spring', credits: 0.5,
    description: 'Linear algebra is the mathematics of machine learning, data science, and modern physics. This course develops intuition for vectors, matrices, linear transformations, and systems of equations — with geometric understanding emphasized alongside computation. Students will be equipped for higher-level coursework in data science, optimization, and calculus-based subjects.',
    syllabus: {
      objectives: [
        'Perform vector operations and interpret them geometrically in 2D and 3D',
        'Multiply matrices and understand what a matrix represents as a linear transformation',
        'Solve systems of linear equations using Gaussian elimination and matrix methods',
        'Compute determinants and understand their geometric meaning',
        'Find eigenvalues and eigenvectors of a 2×2 matrix and explain their significance',
      ],
      units: [
        { week: '1–2',   topic: 'Vectors',                      desc: 'Vector addition, scalar multiplication, dot product, cross product, geometric interpretation in ℝ² and ℝ³.' },
        { week: '3',     topic: 'Linear Combinations & Span',   desc: 'Span of a set of vectors, linear independence, basis, dimension.' },
        { week: '4–5',   topic: 'Matrix Operations',            desc: 'Matrix addition, scalar multiplication, matrix-vector and matrix-matrix multiplication. Why matrix multiplication is defined the way it is.' },
        { week: '6',     topic: 'Linear Transformations',       desc: 'Matrices as transformations (rotation, scaling, reflection, shear). Composition as matrix multiplication.' },
        { week: '7–8',   topic: 'Systems of Linear Equations',  desc: 'Row reduction, Gaussian elimination, echelon form, back-substitution, unique/no/infinite solutions.' },
        { week: '9',     topic: 'Determinants',                 desc: 'Determinant of 2×2 and 3×3 matrices, geometric meaning (area/volume scaling), singularity.' },
        { week: '10–11', topic: 'Inverse Matrices',             desc: 'When inverses exist, computing A⁻¹, solving Ax = b using the inverse.' },
        { week: '12–16', topic: 'Eigenvalues & Eigenvectors',   desc: 'Definition, characteristic polynomial, computing for 2×2 matrices, geometric interpretation, connection to data science (PCA preview).' },
      ],
    },
    resources: [
      { url: 'https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab', title: 'Essence of Linear Algebra — 3Blue1Brown', channel: '3Blue1Brown', note: 'The definitive visual introduction to linear algebra. Watch the entire 16-episode playlist — each video builds geometric intuition for every topic in this course.' },
      { url: 'https://ocw.mit.edu/courses/18-06sc-linear-algebra-fall-2011/', title: 'MIT OCW 18.06 Linear Algebra — Gilbert Strang', channel: 'MIT OpenCourseWare', note: 'The world\'s most famous linear algebra course, fully free. Gilbert Strang\'s lectures are clear and thorough. Use for problem sets and deeper reading.' },
      { url: 'https://www.khanacademy.org/math/linear-algebra', title: 'Linear Algebra — Khan Academy', channel: 'Khan Academy', note: 'Interactive exercises on vectors, matrices, and transformations with immediate feedback. Good for drilling computation skills.' },
      { url: 'https://www.youtube.com/watch?v=PFDu9oVAE-g', title: 'Eigenvalues and Eigenvectors — Explained Visually', channel: '3Blue1Brown', note: 'Chapter 14 of Essence of Linear Algebra. The clearest explanation of what eigenvalues and eigenvectors actually mean geometrically.' },
    ],
    quiz: [
      {
        q: 'The dot product of vectors u = (3, 4) and v = (−4, 3) equals:',
        opts: ['25', '0', '−7', '12'],
        ans: 1,
        exp: 'u · v = (3)(−4) + (4)(3) = −12 + 12 = 0. A dot product of zero means the vectors are perpendicular (orthogonal). Indeed, (3, 4) and (−4, 3) are perpendicular — rotating (3, 4) by 90° gives (−4, 3).',
      },
      {
        q: 'A 2×2 matrix A has determinant 0. What does this tell you geometrically?',
        opts: [
          'The matrix scales areas by a factor of 0 — it collapses 2D space onto a line or point',
          'The matrix rotates vectors by 0 degrees',
          'The matrix is its own inverse',
          'The eigenvalues of A are both 0',
        ],
        ans: 0,
        exp: 'The determinant measures how a transformation scales areas. det(A) = 0 means the transformation squashes area to zero — it maps 2D space to a lower-dimensional subspace (a line or a point). This also means the matrix is singular (non-invertible) and the system Ax = b has no unique solution.',
      },
      {
        q: 'If Av = λv where λ = 3 and v = (1, 2), what is A(2v)?',
        opts: ['(2, 4)', '(6, 12)', '(3, 6)', '(1, 2)'],
        ans: 1,
        exp: 'By linearity of matrix multiplication, A(2v) = 2Av = 2(λv) = 2(3)(1, 2) = 6(1, 2) = (6, 12). The vector 2v is also an eigenvector with the same eigenvalue λ = 3 — eigenvectors are closed under scalar multiplication.',
      },
      {
        q: 'Gaussian elimination is used to solve a system of linear equations. In the row-reduced matrix below, what can you conclude?\n[ 1  2  | 5 ]\n[ 0  0  | 3 ]',
        opts: [
          'The system has a unique solution',
          'The system has no solution',
          'The system has infinitely many solutions',
          'More information is needed',
        ],
        ans: 1,
        exp: 'The second row reads 0x + 0y = 3, or 0 = 3, which is a contradiction. When a row-reduced matrix contains a row of the form [0  0  | c] with c ≠ 0, the system is inconsistent — it has no solution.',
      },
    ],
  },

  {
    id: 'math-apstats',
    name: 'AP Statistics',
    grade: 11, term: 'Fall', credits: 1.0,
    description: 'The college-level statistics course assessed by the AP exam in May. Students master the four major themes of AP Statistics: exploring data, sampling and experimentation, probability and simulation, and statistical inference. Strong conceptual reasoning — not just formula application — is required for success on the exam.',
    syllabus: {
      objectives: [
        'Describe and compare distributions of univariate and bivariate data using appropriate graphical and numerical summaries',
        'Design statistically valid studies including experiments and sample surveys',
        'Calculate and interpret probabilities using normal, binomial, and sampling distributions',
        'Construct and interpret confidence intervals for means and proportions',
        'Perform and interpret significance tests for means, proportions, and categorical data',
      ],
      units: [
        { week: '1–3',   topic: 'Exploring Data',               desc: 'Categorical vs. quantitative data, distributions, shape, center, spread. Comparing groups. Regression and correlation.' },
        { week: '4–5',   topic: 'Bivariate Data & Regression',  desc: 'Scatterplots, LSRL, residuals, residual plots, r and r², interpreting slope and intercept in context.' },
        { week: '6–7',   topic: 'Sampling & Experimentation',   desc: 'Sampling designs (SRS, stratified, cluster), sources of bias, experimental design, control, randomization, replication, blocking.' },
        { week: '8–9',   topic: 'Probability',                  desc: 'Probability rules, conditional probability, independence, Bayes\' theorem, random variables, expected value, variance.' },
        { week: '10',    topic: 'Probability Distributions',    desc: 'Binomial and geometric distributions: conditions (BINS), mean and SD formulas, normal approximation.' },
        { week: '11',    topic: 'Sampling Distributions',       desc: 'Central Limit Theorem, sampling distribution of x̄ and p̂, standard error.' },
        { week: '12–13', topic: 'Confidence Intervals',         desc: 'Inference framework, z-interval for p, t-interval for μ, conditions, interpretation, margin of error, effect of n.' },
        { week: '14–16', topic: 'Significance Tests & AP Prep', desc: 'z-test for p, t-test for μ, two-sample tests, chi-square tests. Free-response practice with AP-style grading rubrics.' },
      ],
    },
    resources: [
      { url: 'https://apclassroom.collegeboard.org/', title: 'AP Classroom — Official AP Statistics Resources', channel: 'College Board', note: 'Official AP Daily videos, progress checks, and past free-response questions with scoring guidelines. This is required — use it throughout the year.' },
      { url: 'https://www.youtube.com/watch?v=qBigTkBLU6g&list=PLblh5JKOoLUK0FLuzwntyYI10UQFUhsY9', title: 'StatQuest — Statistics Fundamentals Playlist', channel: 'StatQuest with Josh Starmer', note: 'Conceptual explanations of t-tests, p-values, confidence intervals, and regression that build true understanding rather than memorization.' },
      { url: 'https://www.khanacademy.org/math/ap-statistics', title: 'AP Statistics — Khan Academy', channel: 'Khan Academy', note: 'Complete AP Statistics course with unit tests and practice questions aligned to the AP exam. Use the unit tests as chapter review.' },
      { url: 'https://www.youtube.com/c/LecturioMedical/search?query=statistics', title: 'AP Stats with Josh — Review Videos', channel: 'Josh AP Statistics', note: 'Short AP Statistics review videos organized by topic. Ideal for reviewing specific exam topics before the May exam.' },
    ],
    quiz: [
      {
        q: 'A 95% confidence interval for the mean daily screen time of high school students is (5.2, 6.8) hours. Which interpretation is correct?',
        opts: [
          'There is a 95% probability that the true mean is between 5.2 and 6.8 hours',
          'If we repeated this sampling procedure many times, 95% of the resulting intervals would contain the true population mean',
          '95% of high school students have a daily screen time between 5.2 and 6.8 hours',
          'The sample mean is 95% likely to be in this interval',
        ],
        ans: 1,
        exp: 'This is the most commonly tested AP Statistics interpretation question. A confidence interval is a procedure — the "95%" refers to the long-run success rate of the method, not a probability about where the parameter lies for this specific interval. The parameter is fixed (not random); the interval varies from sample to sample.',
      },
      {
        q: 'A researcher finds a correlation coefficient r = −0.85 between hours of sleep and number of errors on a task. What is the most accurate conclusion?',
        opts: [
          'Sleeping fewer hours causes more errors',
          'There is a strong, negative linear association between hours of sleep and number of errors',
          'Sleeping more hours will reduce errors by 85%',
          'The variables have a weak negative relationship',
        ],
        ans: 1,
        exp: 'r = −0.85 indicates a strong (|r| close to 1) and negative (inverse) linear relationship. Correlation does not imply causation — an observational study cannot establish that sleep deprivation causes more errors. Also, r is not a percentage — it does not mean "85% fewer errors."',
      },
      {
        q: 'Which condition is NOT required for the binomial distribution to apply (the BINS conditions)?',
        opts: [
          'A fixed number of trials n',
          'Each trial is independent',
          'The data must follow a normal distribution',
          'Each trial has only two outcomes (success or failure) with constant probability p',
        ],
        ans: 2,
        exp: 'The BINS conditions for binomial: Binary outcomes, Independent trials, fixed Number of trials (n), and constant Success probability (p). Normality is NOT required for the binomial distribution — in fact, the binomial is discrete and takes integer values. Normality may be used later as an approximation.',
      },
      {
        q: 'A school tests whether a new tutoring program raises math scores. They set up a significance test with H₀: μ = 75 vs. Hₐ: μ > 75 and obtain p = 0.03. At the α = 0.05 level, what should they conclude?',
        opts: [
          'Fail to reject H₀; there is no evidence the program works',
          'Reject H₀; there is statistically significant evidence at α = 0.05 that the mean score is greater than 75',
          'Accept H₀; the program does not work',
          'The result is statistically significant proof that the program causes higher scores',
        ],
        ans: 1,
        exp: 'Since p = 0.03 < α = 0.05, we reject H₀. The conclusion: there is statistically significant evidence that the true mean score exceeds 75. We do not "accept" H₀ (we only "fail to reject" it), and statistical significance is not the same as proof of causation — this would require a controlled experiment.',
      },
      {
        q: 'The Central Limit Theorem states that the sampling distribution of x̄ becomes approximately normal as the sample size increases — regardless of the population\'s shape. Which of the following correctly states the mean and standard deviation of this sampling distribution?',
        opts: [
          'Mean = μ, Standard Deviation = σ',
          'Mean = μ, Standard Deviation = σ/√n',
          'Mean = μ/n, Standard Deviation = σ/n',
          'Mean = x̄, Standard Deviation = s/√n',
        ],
        ans: 1,
        exp: 'The sampling distribution of x̄ has mean μ (same as the population) and standard deviation σ/√n (called the standard error). As n increases, σ/√n decreases — larger samples give more precise estimates. This is the mathematical foundation for why confidence intervals narrow and tests gain power with larger samples.',
      },
    ],
  },

  {
    id: 'math-data',
    name: 'Data Analysis with Python',
    grade: 11, term: 'Spring', credits: 0.5,
    description: 'The bridge between mathematical statistics and real-world data science. Students learn to load, clean, visualize, and analyze datasets using Python\'s core scientific stack: NumPy, pandas, and Matplotlib. By the end, students will have completed three independent data analyses on real datasets and can present findings using statistical reasoning learned in AP Statistics.',
    syllabus: {
      objectives: [
        'Use pandas DataFrames to load, clean, filter, and reshape tabular data',
        'Create informative visualizations (histograms, scatter plots, box plots, heatmaps) using Matplotlib and Seaborn',
        'Compute descriptive statistics and interpret them in the context of real datasets',
        'Implement linear regression from scratch using NumPy and compare to scikit-learn',
        'Communicate data-driven conclusions through a written analysis report with visualizations',
      ],
      units: [
        { week: '1–2',   topic: 'Python for Data Science Setup',  desc: 'Jupyter notebooks, NumPy arrays, array operations, broadcasting, vectorization vs. loops.' },
        { week: '3–4',   topic: 'pandas Fundamentals',           desc: 'Series and DataFrame, reading CSV/Excel, indexing (loc/iloc), filtering rows, handling missing values.' },
        { week: '5',     topic: 'Data Cleaning',                 desc: 'Detecting and handling NaN, outlier detection, type conversion, string manipulation, merging DataFrames.' },
        { week: '6–7',   topic: 'Data Visualization',            desc: 'Matplotlib and Seaborn: histograms, scatter plots, box plots, heatmaps, subplots, styling for publication.' },
        { week: '8–9',   topic: 'Exploratory Data Analysis',     desc: 'Groupby, pivot tables, correlation matrices, identifying patterns and outliers. Full EDA on a Kaggle dataset.' },
        { week: '10–11', topic: 'Regression in Python',          desc: 'NumPy linear regression from scratch (normal equations), then scikit-learn LinearRegression. Residual analysis.' },
        { week: '12–13', topic: 'Statistical Tests in Python',   desc: 'scipy.stats: t-tests, chi-square tests, p-values — connecting AP Statistics concepts to code.' },
        { week: '14–16', topic: 'Data Analysis Project',         desc: 'Students choose a dataset, form a research question, perform EDA, model, and write a 5-page analysis report with visualizations.' },
      ],
    },
    resources: [
      { url: 'https://www.kaggle.com/learn/pandas', title: 'Kaggle Learn — Pandas Micro-Course', channel: 'Kaggle Learn', note: 'Free interactive pandas course in Kaggle notebooks. The most practical introduction to pandas available — complete all 6 lessons.' },
      { url: 'https://www.kaggle.com/learn/data-visualization', title: 'Kaggle Learn — Data Visualization', channel: 'Kaggle Learn', note: 'Free interactive visualization course covering Seaborn and Matplotlib within Kaggle notebooks.' },
      { url: 'https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab', title: 'Essence of Linear Algebra — 3Blue1Brown', channel: '3Blue1Brown', note: 'Provides geometric intuition for the matrix operations and linear regression (normal equations) covered in this course.' },
      { url: 'https://www.youtube.com/watch?v=qBigTkBLU6g&list=PLblh5JKOoLUK0FLuzwntyYI10UQFUhsY9', title: 'StatQuest — Statistics Fundamentals', channel: 'StatQuest with Josh Starmer', note: 'Visual explanations of regression, p-values, and hypothesis testing — connects the statistical reasoning from AP Stats to Python implementation.' },
    ],
    quiz: [
      {
        q: 'In pandas, you have a DataFrame df with a column "score". Which code correctly filters rows where the score is greater than 80?',
        opts: [
          'df.filter(df["score"] > 80)',
          'df[df["score"] > 80]',
          'df.where("score" > 80)',
          'df.select(score > 80)',
        ],
        ans: 1,
        exp: 'Boolean indexing with df[df["score"] > 80] is the standard pandas idiom. df["score"] > 80 creates a boolean Series, and using it inside df[...] keeps only the rows where the condition is True.',
      },
      {
        q: 'You have a NumPy array a = np.array([1, 2, 3, 4, 5]). What does np.mean(a) return?',
        opts: ['2', '3.0', '5', '15'],
        ans: 1,
        exp: 'np.mean computes the arithmetic mean: (1+2+3+4+5)/5 = 15/5 = 3.0. NumPy returns a float for mean calculations.',
      },
      {
        q: 'You are analyzing a dataset and notice that the "age" column has 15% missing values (NaN). Which strategy is most appropriate for a small dataset where missing values may not be random?',
        opts: [
          'Drop all rows with missing age values using df.dropna()',
          'Fill missing ages with 0 using df["age"].fillna(0)',
          'Investigate the pattern of missingness; consider imputing with the median or a model-based approach, and report the limitation',
          'Replace missing values with the maximum age in the dataset',
        ],
        ans: 2,
        exp: 'Data imputation strategy depends on the mechanism of missingness (MCAR, MAR, MNAR). Dropping rows loses data and can introduce bias if missingness is systematic. Filling with 0 is statistically indefensible for age. Median imputation is a reasonable baseline for small datasets, but any approach should be documented as a limitation in the analysis.',
      },
      {
        q: 'In linear regression, the "residual" for a data point is defined as:',
        opts: [
          'The predicted value minus the actual value',
          'The actual value minus the predicted value (y − ŷ)',
          'The square root of the error',
          'The correlation coefficient',
        ],
        ans: 1,
        exp: 'A residual is the actual observed value minus the predicted value: e = y − ŷ. Positive residuals indicate the model under-predicted; negative residuals indicate over-prediction. The ordinary least squares line minimizes the sum of squared residuals.',
      },
    ],
  },

  {
    id: 'math-ml',
    name: 'Statistical Modeling & Machine Learning',
    grade: 12, term: 'Fall', credits: 1.0,
    description: 'A rigorous treatment of the mathematical and statistical foundations of machine learning. Moving beyond the code-first approach, this course derives the mathematics behind model fitting, regularization, and probabilistic reasoning. Students explore regression, classification, dimensionality reduction, and neural network fundamentals with emphasis on understanding why the algorithms work.',
    syllabus: {
      objectives: [
        'Derive and interpret the ordinary least squares solution and explain when it fails',
        'Understand regularization (Ridge and Lasso) as a bias-variance tradeoff',
        'Apply and evaluate classification models including logistic regression and decision trees',
        'Implement and interpret PCA for dimensionality reduction using eigendecomposition',
        'Explain the feedforward neural network architecture and the role of backpropagation',
      ],
      units: [
        { week: '1–2',   topic: 'Review & Model Framework',      desc: 'Bias-variance tradeoff, train/validation/test split, cross-validation, model selection criteria (AIC, BIC overview).' },
        { week: '3–4',   topic: 'Linear Regression — Deep Dive', desc: 'Matrix form Xβ = y, normal equations β = (XᵀX)⁻¹Xᵀy, assumptions, residual diagnostics, R² vs. adjusted R².' },
        { week: '5',     topic: 'Regularization',                desc: 'Ridge (L2) and Lasso (L1) regression — shrinkage, effect on coefficients, tuning λ via cross-validation.' },
        { week: '6–7',   topic: 'Logistic Regression & Classification', desc: 'Sigmoid function, log-loss, gradient descent for logistic regression. Decision boundary, confusion matrix, ROC/AUC.' },
        { week: '8',     topic: 'Decision Trees & Ensembles',    desc: 'Gini impurity, information gain, tree depth, Random Forests, bagging vs. boosting (concept).' },
        { week: '9',     topic: 'Clustering',                    desc: 'K-means objective function and algorithm, k-means++, choosing k (elbow method, silhouette score).' },
        { week: '10–11', topic: 'Dimensionality Reduction & PCA', desc: 'Curse of dimensionality, covariance matrix, eigendecomposition, principal components, variance explained.' },
        { week: '12–16', topic: 'Neural Networks',               desc: 'Perceptron, hidden layers, activation functions (ReLU, sigmoid, softmax), forward pass, backpropagation derivation, training with PyTorch. Final ML project.' },
      ],
    },
    resources: [
      { url: 'https://www.youtube.com/watch?v=aircAruvnKk', title: 'Neural Networks — Essence Series', channel: '3Blue1Brown', note: 'The clearest geometric explanation of neural networks and backpropagation. Watch the entire 4-part series before the neural network unit.' },
      { url: 'https://www.kaggle.com/learn', title: 'Kaggle Learn — Machine Learning & Deep Learning', channel: 'Kaggle Learn', note: 'Free interactive ML and deep learning micro-courses with Kaggle notebooks. Use for hands-on model training exercises.' },
      { url: 'https://www.youtube.com/watch?v=qBigTkBLU6g&list=PLblh5JKOoLUK0FLuzwntyYI10UQFUhsY9', title: 'StatQuest — Machine Learning Playlist', channel: 'StatQuest with Josh Starmer', note: 'Rigorous visual explanations of logistic regression, decision trees, random forests, PCA, and neural networks. Ideal as a companion to lectures.' },
      { url: 'https://ocw.mit.edu/courses/18-06sc-linear-algebra-fall-2011/', title: 'MIT OCW 18.06 — Linear Algebra (for PCA Unit)', channel: 'MIT OpenCourseWare', note: 'Gilbert Strang\'s linear algebra course — essential background for the PCA and matrix regression units. Review eigenvalues and matrix decompositions.' },
    ],
    quiz: [
      {
        q: 'The ordinary least squares solution is β̂ = (XᵀX)⁻¹Xᵀy. Under which condition is this formula undefined?',
        opts: [
          'When the number of observations n is very large',
          'When XᵀX is singular (not invertible), which occurs when features are perfectly multicollinear',
          'When the response variable y is not normally distributed',
          'When β contains negative values',
        ],
        ans: 1,
        exp: 'The formula requires computing (XᵀX)⁻¹. If XᵀX is singular (determinant = 0), the inverse does not exist. This happens when features are perfectly multicollinear — one feature is an exact linear combination of others. In practice, near-multicollinearity inflates coefficient variance, which is one motivation for Ridge regression.',
      },
      {
        q: 'Ridge regression adds an L2 penalty λ||β||² to the loss function. What is the primary effect of increasing λ?',
        opts: [
          'The model becomes more flexible and fits training data better',
          'Coefficients are shrunk toward zero, reducing variance at the cost of increased bias',
          'The model selects exactly the most important features by setting others to zero',
          'The number of training iterations increases',
        ],
        ans: 1,
        exp: 'Increasing λ applies stronger shrinkage — coefficients are pulled toward zero. This reduces model variance (less sensitivity to training data noise) but increases bias (the model cannot fit complex patterns). The bias-variance tradeoff is managed by choosing λ via cross-validation. Note: Ridge shrinks coefficients toward zero but never exactly to zero — Lasso (L1) does produce exact zeros.',
      },
      {
        q: 'In Principal Component Analysis (PCA), the principal components are:',
        opts: [
          'The original features ranked by their correlation with the target variable',
          'The eigenvectors of the data\'s covariance matrix, ordered by their eigenvalues',
          'The rows of the data matrix with the highest variance',
          'The features remaining after removing those with eigenvalue less than 1',
        ],
        ans: 1,
        exp: 'PCA finds the directions of maximum variance in the data. These directions are the eigenvectors of the covariance matrix Cov(X), and the corresponding eigenvalues indicate the amount of variance explained in each direction. Sorting by eigenvalue (descending) gives principal components PC1, PC2, … in order of importance.',
      },
      {
        q: 'In backpropagation, the chain rule is applied to compute gradients. If the loss L depends on output z, which depends on weights w, which expression correctly gives ∂L/∂w?',
        opts: [
          '∂L/∂w = ∂L/∂z + ∂z/∂w',
          '∂L/∂w = (∂L/∂z) × (∂z/∂w)',
          '∂L/∂w = ∂z/∂L × ∂w/∂z',
          '∂L/∂w = ∂L/∂z − ∂z/∂w',
        ],
        ans: 1,
        exp: 'The chain rule for derivatives: if L = f(z) and z = g(w), then dL/dw = (dL/dz)(dz/dw). Backpropagation applies this rule layer by layer from the output back to the input, multiplying local gradients along the path. This is how parameter gradients are computed efficiently without recalculating the entire forward pass.',
      },
      {
        q: 'An ROC curve plots the True Positive Rate against the False Positive Rate at various thresholds. A model\'s ROC curve has an AUC (area under curve) of 0.5. What does this mean?',
        opts: [
          'The model achieves 50% accuracy',
          'The model performs no better than random guessing — it cannot distinguish between the classes',
          'The model correctly classifies 50% more cases than baseline',
          'The model has a 50% false positive rate at every threshold',
        ],
        ans: 1,
        exp: 'AUC = 0.5 corresponds to the diagonal line on the ROC curve — the performance of random guessing. A perfect classifier has AUC = 1.0 (all positive predictions rank above negatives). AUC = 0.5 means the model provides zero discriminative ability between classes, equivalent to randomly assigning labels.',
      },
    ],
  },

  {
    id: 'math-capstone',
    name: 'Math & Data Science Capstone',
    grade: 12, term: 'Spring', credits: 1.0,
    description: 'The culminating project of the Mathematics & Data Science pathway. Students independently conceive, design, execute, and present a substantial quantitative project — a statistical research study, a predictive model, a mathematical investigation, or a data-driven policy analysis. The capstone is the centerpiece of the college application, demonstrating research maturity and quantitative depth to admissions committees.',
    syllabus: {
      objectives: [
        'Formulate a clear, testable research question in mathematics or data science',
        'Design a rigorous analytical approach with appropriate statistical methods',
        'Conduct independent analysis using Python with clean, documented code',
        'Interpret results with appropriate uncertainty quantification and acknowledgment of limitations',
        'Present findings in a professional research paper and oral defense with mathematical precision',
      ],
      units: [
        { week: '1–2',   topic: 'Project Ideation & Literature',  desc: 'Brainstorm research questions, read existing work (research papers, Kaggle notebooks, mathematical literature), define scope and feasibility.' },
        { week: '3',     topic: 'Research Design',                desc: 'Formalize hypotheses, select methodology (regression, classification, simulation, proof-based), define success criteria.' },
        { week: '4–6',   topic: 'Data Collection & EDA',          desc: 'Source or generate data, perform thorough exploratory data analysis, document data quality issues.' },
        { week: '7',     topic: 'Midpoint Presentation',          desc: 'Present research question, dataset, EDA findings, and planned analysis to peers and instructor. Receive structured feedback.' },
        { week: '8–11',  topic: 'Analysis & Modeling',            desc: 'Execute core analysis: fit models, run simulations, write proofs. Iterate based on results. Weekly check-ins with instructor.' },
        { week: '12–13', topic: 'Writing the Research Paper',     desc: 'Write a structured 6–10 page paper: Abstract, Introduction, Methods, Results, Discussion, Conclusion, References.' },
        { week: '14–15', topic: 'Presentation Preparation',       desc: 'Create slides, prepare 15-minute presentation, practice fielding mathematical questions, peer dry run.' },
        { week: '16',    topic: 'Capstone Defense',               desc: 'Formal presentation to a panel including technical Q&A on methods and mathematical reasoning.' },
      ],
    },
    resources: [
      { url: 'https://www.kaggle.com/datasets', title: 'Kaggle Datasets — Free Public Data', channel: 'Kaggle', note: 'Thousands of free real-world datasets covering economics, health, sports, and more. A starting point for finding capstone data.' },
      { url: 'https://ocw.mit.edu/courses/18-06sc-linear-algebra-fall-2011/', title: 'MIT OCW 18.06 — Linear Algebra', channel: 'MIT OpenCourseWare', note: 'Reference for mathematical capstone projects involving matrix methods, optimization, or proof-based analysis.' },
      { url: 'https://www.youtube.com/watch?v=qBigTkBLU6g&list=PLblh5JKOoLUK0FLuzwntyYI10UQFUhsY9', title: 'StatQuest — Full Statistics & ML Playlist', channel: 'StatQuest with Josh Starmer', note: 'Reference resource for reviewing and choosing appropriate statistical methods for your capstone analysis.' },
      { url: 'https://www.kaggle.com/learn', title: 'Kaggle Learn — Advanced Techniques', channel: 'Kaggle Learn', note: 'Advanced ML techniques (feature engineering, XGBoost, deep learning) available as free interactive courses for students pursuing ambitious modeling projects.' },
    ],
    quiz: [
      {
        q: 'You are writing a research paper comparing student performance across two schools. What is the most important reason to report confidence intervals alongside your sample means, rather than just the means?',
        opts: [
          'Confidence intervals are required by academic journals',
          'They quantify the uncertainty in your estimates, showing how much the true means might plausibly vary from your sample means',
          'They prove that your result is statistically significant',
          'They show the range of scores in each school',
        ],
        ans: 1,
        exp: 'Confidence intervals communicate statistical uncertainty. A sample mean is a point estimate — it will differ from the true population mean due to random sampling. A 95% CI says: if we repeated this sampling procedure many times, 95% of intervals constructed this way would contain the true mean. Reporting only the point estimate without uncertainty is considered incomplete statistical practice.',
      },
      {
        q: 'Your capstone model predicts housing prices and achieves 98% accuracy on training data but only 61% on test data. What is the most likely problem and the recommended solution?',
        opts: [
          'Underfitting — add more data to the training set',
          'Overfitting — simplify the model, add regularization, or get more training data',
          'Data leakage — the test labels were used during training',
          'Class imbalance — apply SMOTE to the training set',
        ],
        ans: 1,
        exp: 'A large gap between training and test performance is the signature of overfitting: the model has memorized the training data, including its noise, and fails to generalize. Solutions include reducing model complexity, adding L1/L2 regularization, using cross-validation, or collecting more training data. This is distinct from data leakage (which would inflate test performance, not just training performance).',
      },
      {
        q: 'You want to investigate whether a new tutoring program causes improvement in math scores. You compare students who chose to attend tutoring versus those who did not. Why is this a weak causal design?',
        opts: [
          'The sample size is too small',
          'Confounding variables (e.g., student motivation) may explain the difference — students who choose tutoring may differ systematically from those who do not',
          'You should have used a different statistical test',
          'Observational studies cannot compute means',
        ],
        ans: 1,
        exp: 'This is a self-selected observational study — students who opt into tutoring may already be more motivated, have more parental support, or have more time. These confounding factors, not the tutoring itself, could explain score differences. A randomized controlled experiment (random assignment to tutoring vs. control) is needed to make causal claims because randomization balances confounders across groups.',
      },
      {
        q: 'In a mathematical investigation, you conjecture that for all positive integers n, the sum 1 + 3 + 5 + … + (2n−1) = n². After verifying this for n = 1, 2, 3, 4, and 5, a peer says "You\'ve proven it." Why is this claim incorrect?',
        opts: [
          'The formula is actually wrong for large n',
          'Checking finitely many cases does not constitute a proof for all positive integers — mathematical induction or algebraic proof is needed',
          'You need to check at least 10 cases',
          'The claim is correct; verifying 5 cases is sufficient for a math proof',
        ],
        ans: 1,
        exp: 'In mathematics, a proof must work for ALL cases, not just the ones checked. No finite number of examples constitutes a proof of a universal statement — there are famous conjectures that hold for billions of cases but are still unproven (e.g., Goldbach\'s Conjecture). A proof by induction would formally establish the formula: base case n = 1 gives 1 = 1², and the inductive step would show that assuming the sum to n terms equals n², adding the (n+1)-th odd number gives (n+1)².',
      },
    ],
  },
];

export default function MathDataPathway() {
  return <PathwayPage meta={META} schedule={SCHEDULE} courses={COURSES} />;
}
