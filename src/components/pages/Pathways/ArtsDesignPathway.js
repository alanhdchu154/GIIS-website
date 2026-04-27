import React from 'react';
import { PathwayPage } from './PathwayComponents';

const COLOR = '#6A1B9A'; // violet/purple for arts

const META = {
  color: COLOR,
  title: 'Arts & Design',
  subtitle: 'Create beauty. Build meaning. Design the future.',
  emoji: '🎨',
  courseEmoji: '🎨',
  heroDescription: 'A 4-year pathway for students pursuing fine arts, graphic design, architecture, film/animation, or user experience design. From visual fundamentals and art history through digital design and portfolio development, you will graduate with a strong creative portfolio and the critical thinking about aesthetics and design that programs at RISD, Parsons, UCLA Film, and MIT Architecture require.',
  targets: ['Fine Arts / Studio Art', 'Graphic Design & Visual Communication', 'Architecture & Spatial Design', 'Film, Animation & Digital Media', 'User Experience (UX) Design', 'Art History & Curation'],
  collegeNote: 'Art and design school admissions are portfolio-driven above all else. But selective programs like RISD, Parsons, and Yale Art also evaluate critical thinking, art history knowledge, and written articulation of creative choices. This pathway builds technical skills, aesthetic vocabulary, and the creative discipline that produces a competitive portfolio by Grade 12.',
  stats: [{ label: 'AP Courses', value: 1 }],
};

const SCHEDULE = [
  { grade: 9, term: 'Fall', courses: [
    { name: 'English I',                          type: 'core',      credits: 1.0, dept: 'English Language Arts' },
    { name: 'Algebra I',                          type: 'core',      credits: 1.0, dept: 'Mathematics' },
    { name: 'Biology',                            type: 'core',      credits: 1.0, dept: 'Science' },
    { name: 'World History',                      type: 'core',      credits: 0.5, dept: 'Social Studies' },
    { name: 'Physical Education',                 type: 'core',      credits: 0.5, dept: 'Health & PE' },
    { name: 'Visual Foundations: Drawing & Composition', type: 'pathway', credits: 0.5, courseId: 'art-visual' },
  ]},
  { grade: 9, term: 'Spring', courses: [
    { name: 'English I — Writing',                type: 'core',      credits: 1.0, dept: 'English Language Arts' },
    { name: 'Geometry',                           type: 'core',      credits: 1.0, dept: 'Mathematics' },
    { name: 'Environmental Science',              type: 'core',      credits: 1.0, dept: 'Science' },
    { name: 'Geography',                          type: 'core',      credits: 0.5, dept: 'Social Studies' },
    { name: 'Health & Wellness',                  type: 'core',      credits: 0.5, dept: 'Health & PE' },
    { name: 'Art History: Ancient to Renaissance',type: 'pathway',   credits: 0.5, courseId: 'art-history1' },
  ]},
  { grade: 10, term: 'Fall', courses: [
    { name: 'English II',                         type: 'core',      credits: 1.0, dept: 'English Language Arts' },
    { name: 'Algebra II',                         type: 'core',      credits: 1.0, dept: 'Mathematics' },
    { name: 'Chemistry',                          type: 'core',      credits: 1.0, dept: 'Science' },
    { name: 'U.S. History',                      type: 'core',      credits: 0.5, dept: 'Social Studies' },
    { name: 'Art History: Modern & Contemporary', type: 'pathway',   credits: 0.5, courseId: 'art-history2' },
  ]},
  { grade: 10, term: 'Spring', courses: [
    { name: 'English II — Literature',            type: 'core',      credits: 1.0, dept: 'English Language Arts' },
    { name: 'Pre-Calculus',                       type: 'core',      credits: 1.0, dept: 'Mathematics' },
    { name: 'Physics Fundamentals',               type: 'core',      credits: 1.0, dept: 'Science' },
    { name: 'World Politics',                     type: 'core',      credits: 0.5, dept: 'Social Studies' },
    { name: 'Digital Design & Adobe Suite',       type: 'pathway',   credits: 0.5, courseId: 'art-digital' },
  ]},
  { grade: 11, term: 'Fall', courses: [
    { name: 'English III',                        type: 'core',      credits: 1.0, dept: 'English Language Arts' },
    { name: 'Statistics',                         type: 'core',      credits: 1.0, dept: 'Mathematics' },
    { name: 'Biology — Advanced',                 type: 'core',      credits: 1.0, dept: 'Science' },
    { name: 'AP Art History',                     type: 'pathway',   credits: 1.0, courseId: 'art-aphist' },
  ]},
  { grade: 11, term: 'Spring', courses: [
    { name: 'English III — Literature',           type: 'core',      credits: 1.0, dept: 'English Language Arts' },
    { name: 'Trigonometry',                       type: 'core',      credits: 1.0, dept: 'Mathematics' },
    { name: 'Physics — Mechanics',                type: 'core',      credits: 1.0, dept: 'Science' },
    { name: 'Typography, Branding & Visual Identity', type: 'pathway', credits: 0.5, courseId: 'art-branding' },
    { name: 'Film & Media Production',            type: 'supporting', credits: 0.5, dept: 'Arts', note: 'Optional supporting course' },
  ]},
  { grade: 12, term: 'Fall', courses: [
    { name: 'English IV — Writing & Communication', type: 'core',    credits: 1.0, dept: 'English Language Arts' },
    { name: 'Calculus',                           type: 'core',      credits: 1.0, dept: 'Mathematics' },
    { name: 'Architecture & Spatial Design',      type: 'pathway',   credits: 0.5, courseId: 'art-architecture' },
    { name: 'AP Studio Art: Drawing / 2-D Design', type: 'supporting', credits: 1.0, dept: 'Arts', note: 'Strongly recommended for portfolio-focused applicants' },
  ]},
  { grade: 12, term: 'Spring', courses: [
    { name: 'English IV — Advanced Composition',  type: 'core',      credits: 1.0, dept: 'English Language Arts' },
    { name: 'Arts & Design Portfolio Capstone',   type: 'pathway',   credits: 1.0, courseId: 'art-capstone' },
    { name: 'Film & Media Production',            type: 'supporting', credits: 0.5, dept: 'Arts', note: 'Optional supporting course' },
  ]},
];

const COURSES = [
  {
    id: 'art-visual',
    name: 'Visual Foundations: Drawing & Composition',
    grade: 9, term: 'Fall', credits: 0.5,
    description: 'The starting point for every visual artist: how to see and how to translate what you see onto paper. This course builds observational drawing skills — contour, value, perspective, and proportion — while introducing the formal principles of composition such as the rule of thirds, positive/negative space, and visual balance. These fundamentals underpin every discipline in art and design, from fine art to UX.',
    syllabus: {
      objectives: [
        'Render observed objects using contour line, shading, and accurate proportion',
        'Apply the rule of thirds, visual weight, and negative space to create balanced compositions',
        'Demonstrate understanding of one-point and two-point linear perspective',
        'Use value and contrast deliberately to direct viewer attention',
        'Produce a portfolio of at least eight finished drawings with written artist statements',
      ],
      units: [
        { week: '1–2',   topic: 'How to See Like an Artist',       desc: 'Right-brain drawing exercises from Betty Edwards. Contour drawing, upside-down drawing, negative space exercises. Learning to observe edges and relationships rather than symbols.' },
        { week: '3–4',   topic: 'Line, Shape & Form',              desc: 'Contour vs. gesture drawing. Organic vs. geometric shapes. Translating 3-D form onto a 2-D surface. Still-life drawing from observation.' },
        { week: '5–6',   topic: 'Value & Light',                   desc: 'The value scale from white to black. Cast shadows, form shadows, highlights. Cross-hatching and blending techniques. Single-light-source still-life studies.' },
        { week: '7–8',   topic: 'Composition Principles',          desc: 'Rule of thirds, golden ratio, visual hierarchy, leading lines, symmetry vs. asymmetry, positive/negative space. Redesigning compositions to improve visual impact.' },
        { week: '9–10',  topic: 'Linear Perspective',              desc: 'One-point perspective (interiors, corridors). Two-point perspective (buildings, cityscapes). Horizon line, vanishing points, foreshortening.' },
        { week: '11–12', topic: 'Portraiture & Figure',            desc: 'Proportions of the human face (eye-to-eye rule, thirds of the face). Gesture drawing of the figure. Expression and emotion through line weight.' },
        { week: '13',    topic: 'Texture & Pattern',               desc: 'Simulating surface texture (wood grain, fabric, metal, stone). Pattern as design element. Mixed-media experiments.' },
        { week: '14–16', topic: 'Portfolio & Critique',            desc: 'Curate and refine your eight best drawings. Write a short artist statement for each piece. Participate in structured peer critique using formal art vocabulary.' },
      ],
    },
    resources: [
      { url: 'https://www.youtube.com/c/ProkoTV', title: 'Proko — Figure Drawing & Fundamentals', channel: 'Proko (YouTube)', note: 'Stan Prokopenko\'s channel is the gold standard for learning to draw the human figure and master observational drawing. Start with the "Drawing Basics" and "Figure Drawing" playlists.' },
      { url: 'https://www.khanacademy.org/humanities/art-history', title: 'Art History & Visual Arts — Khan Academy', channel: 'Khan Academy', note: 'Khan Academy\'s art resources include short videos on formal elements and principles — useful for the composition and value units.' },
      { url: 'https://www.youtube.com/c/TheArtAssignment', title: 'The Art Assignment', channel: 'PBS Digital Studios (YouTube)', note: 'PBS\'s art channel produces thoughtful videos on artistic concepts, movements, and creative process. Excellent companion to all units in this course.' },
      { url: 'https://www.skillshare.com/browse/drawing', title: 'Skillshare — Drawing Fundamentals Courses', channel: 'Skillshare', note: 'Skillshare hosts beginner-to-advanced drawing courses covering perspective, portraiture, and composition. Search "drawing fundamentals" or "perspective drawing" for relevant content.' },
    ],
    quiz: [
      { q: 'In composition, what does "negative space" refer to?', opts: ['The dark areas created by shadow', 'The empty space surrounding the subject', 'A mistake in the artwork', 'The background color'], ans: 1, exp: 'Negative space is the area around and between subjects. Artists like Franz Kline and Henri Matisse used negative space as an active compositional element — shaping the empty areas with as much intention as the subject itself.' },
      { q: 'The rule of thirds divides a composition into:', opts: ['Two equal halves', 'A 9-part grid of equal rectangles', 'Four quadrants', 'A central circle and outer ring'], ans: 1, exp: 'The rule of thirds divides the frame with two horizontal and two vertical lines, creating a 9-part grid. Placing key elements at the four intersection points creates dynamic, visually balanced compositions.' },
      { q: 'In one-point perspective, all parallel lines recede to:', opts: ['Two separate vanishing points on the horizon', 'A single vanishing point on the horizon line', 'The center of the paper', 'Multiple points above and below the horizon'], ans: 1, exp: 'One-point perspective has one vanishing point on the horizon. It is ideal for drawing objects facing you directly — like looking down a hallway or a straight road.' },
      { q: 'Which term describes the lightness or darkness of a color or tone?', opts: ['Hue', 'Saturation', 'Value', 'Chroma'], ans: 2, exp: 'Value refers to lightness/darkness on a scale from white to black. It is distinct from hue (the color itself) and saturation (the intensity of the color). Controlling value is the single most important skill in creating a sense of form and depth.' },
      { q: 'Gesture drawing is best described as:', opts: ['A precise, detailed rendering of an object', 'A quick sketch capturing the movement, energy, and overall pose of a subject', 'A drawing made entirely with geometric shapes', 'A technique for drawing architecture'], ans: 1, exp: 'Gesture drawing captures the "action" or energy of a subject in a short time (30 seconds to 2 minutes). It trains the eye-hand connection and loosens the artist before more detailed work.' },
    ],
  },

  {
    id: 'art-history1',
    name: 'Art History: Ancient to Renaissance',
    grade: 9, term: 'Spring', credits: 0.5,
    description: 'A survey of Western and non-Western art from prehistoric cave paintings through the Italian Renaissance. Students examine works in their cultural and historical context, learning to analyze style, iconography, and artistic intent. Understanding this foundation is essential for AP Art History and for writing the kind of contextual artist statements that selective art programs expect.',
    syllabus: {
      objectives: [
        'Identify major works, artists, and stylistic conventions from Prehistoric through Renaissance periods',
        'Analyze artworks using formal elements (line, shape, color, composition) and contextual factors',
        'Explain how historical, religious, and political forces shaped artistic production',
        'Write a structured visual analysis of a work of art using appropriate vocabulary',
        'Compare works across cultures and time periods to identify shared and divergent approaches',
      ],
      units: [
        { week: '1–2',   topic: 'Prehistoric & Ancient Art',         desc: 'Cave paintings of Lascaux and Altamira. Mesopotamian art (Standard of Ur, Stele of Hammurabi). Egyptian art — conventions of representation, ka statues, Books of the Dead.' },
        { week: '3–4',   topic: 'Ancient Greek & Roman Art',         desc: 'Greek sculpture evolution: Archaic kouros → Classical contrapposto (Doryphoros) → Hellenistic dynamism (Laocoön). Roman realism, the portrait bust, and architectural innovations (the arch, concrete, the Pantheon).' },
        { week: '5–6',   topic: 'Early Christian & Byzantine Art',   desc: 'The shift from pagan to Christian imagery. Mosaics, the basilica plan, and iconography. Byzantine conventions — gold ground, hierarchical scale, frontality — and the Iconoclasm debate.' },
        { week: '7–8',   topic: 'Medieval & Islamic Art',            desc: 'Romanesque and Gothic architecture (the flying buttress, the rose window). Manuscript illumination. Islamic geometric abstraction — the alhambra, arabesque, and the prohibition on figural imagery.' },
        { week: '9–10',  topic: 'Proto-Renaissance & Italian Early Renaissance', desc: 'Giotto di Bondone and the move toward naturalism. Brunelleschi and the invention of linear perspective. Donatello\'s David. Masaccio\'s use of light and shadow in the Brancacci Chapel.' },
        { week: '11–12', topic: 'High Renaissance',                  desc: 'Leonardo da Vinci: sfumato, atmospheric perspective, The Last Supper and Mona Lisa. Michelangelo: the Sistine Chapel ceiling, David, the Pietà. Raphael and idealized beauty in The School of Athens.' },
        { week: '13',    topic: 'Northern Renaissance & Mannerism',  desc: 'Jan van Eyck and oil painting (the Arnolfini Portrait). Albrecht Dürer and printmaking. Hieronymus Bosch\'s surreal imagery. Mannerism as a distortion of Renaissance ideals (Pontormo, Parmigianino).' },
        { week: '14–16', topic: 'Comparative Analysis Project',      desc: 'Select two works from different periods and cultures and write a 500-word comparative visual analysis. Present findings to the class with slides.' },
      ],
    },
    resources: [
      { url: 'https://www.khanacademy.org/humanities/art-history', title: 'Art History — Khan Academy', channel: 'Khan Academy', note: 'The most comprehensive free art history resource available. Khan Academy\'s art history section covers every period in this course with videos, articles, and quizzes co-produced with Smarthistory.' },
      { url: 'https://www.youtube.com/c/TheArtAssignment', title: 'The Art Assignment', channel: 'PBS Digital Studios (YouTube)', note: 'Engaging short documentaries on artists and movements. Watch the episodes on the Renaissance, Medieval art, and "What is Art History?" for context.' },
      { url: 'https://smarthistory.org/', title: 'Smarthistory — Art History Open Textbook', channel: 'Smarthistory', note: 'The leading open-access art history textbook. Covers every period in this course with scholarly but readable essays. Treat it as your primary text.' },
      { url: 'https://www.metmuseum.org/toah/', title: 'Heilbrunn Timeline of Art History — The Met', channel: 'The Metropolitan Museum of Art', note: 'The Met\'s online timeline lets you browse art by period, region, and theme. Excellent for visual research and discovering primary sources.' },
    ],
    quiz: [
      { q: 'Which term describes the ancient Greek sculptural convention where weight is shifted to one leg, creating a natural S-curve in the body?', opts: ['Sfumato', 'Contrapposto', 'Chiaroscuro', 'Foreshortening'], ans: 1, exp: 'Contrapposto (Italian: "counterpose") first appeared in Greek sculpture around 480 BCE with works like Kritios Boy. It was perfected in Polykleitos\'s Doryphoros and became a foundational convention of Western figurative sculpture.' },
      { q: 'What architectural innovation allowed Gothic cathedrals to have thin walls and large stained-glass windows?', opts: ['The Roman arch', 'The flying buttress', 'The barrel vault', 'The post-and-lintel system'], ans: 1, exp: 'Flying buttresses transferred the lateral thrust of the stone vault to external piers, allowing Gothic builders to remove wall mass and fill the openings with stained glass. Notre-Dame de Paris is the canonical example.' },
      { q: 'Leonardo da Vinci\'s technique of softening outlines and blending tones to create atmospheric depth is called:', opts: ['Impasto', 'Contrapposto', 'Sfumato', 'Chiaroscuro'], ans: 2, exp: 'Sfumato (Italian: "smoke") describes Leonardo\'s technique of blending transitions between light and shadow without hard edges. It is most visible in the Mona Lisa\'s face and is central to the painting\'s mysterious quality.' },
      { q: 'The Arnolfini Portrait (1434) by Jan van Eyck is significant in art history primarily because it:', opts: ['First used the technique of fresco', 'Demonstrated the unprecedented detail and luminosity made possible by oil paint', 'Introduced linear perspective to Northern Europe', 'Was the first large-scale secular commission'], ans: 1, exp: 'Van Eyck\'s mastery of oil paint — which he helped develop — allowed him to build translucent glazes that captured texture, reflected light, and detail previously impossible in tempera. The chandelier, mirror, and fabric in the Arnolfini Portrait remain benchmarks of illusionistic painting.' },
      { q: 'Hierarchical scale in ancient Egyptian and Medieval art means that:', opts: ['Figures are arranged by height on the canvas', 'The most important figures are depicted larger than less important ones regardless of actual distance', 'Color saturation indicates social rank', 'Perspective is used to show depth'], ans: 1, exp: 'Hierarchical scale is a convention where size communicates importance, not spatial position. Egyptian pharaohs and gods tower over servants and commoners in the same composition — a direct visual language of power.' },
    ],
  },

  {
    id: 'art-history2',
    name: 'Art History: Modern & Contemporary',
    grade: 10, term: 'Fall', credits: 0.5,
    description: 'From Impressionism through today: the revolutions that shaped modern art and design. Students explore how and why artists broke from tradition — Monet\'s broken brushwork, Picasso\'s fractured planes, Warhol\'s commercial imagery, and Zaha Hadid\'s impossible architecture — connecting each movement to its social, technological, and philosophical context. This course directly prepares students for the AP Art History exam\'s content on modern and contemporary art.',
    syllabus: {
      objectives: [
        'Identify key works, artists, and characteristics of major modern and contemporary art movements',
        'Explain the historical forces (industrialization, war, globalization) that drove avant-garde movements',
        'Analyze how the Bauhaus movement unified art, craft, and industrial design',
        'Evaluate a contemporary artwork using multiple critical frameworks (formalist, contextual, feminist, postcolonial)',
        'Produce an original research essay on a modern or contemporary artist of personal interest',
      ],
      units: [
        { week: '1–2',   topic: 'Impressionism & Post-Impressionism', desc: 'Monet\'s series paintings and capturing light. Renoir\'s social scenes. The Post-Impressionist divergence: Cézanne\'s geometric structure, Seurat\'s pointillism, Van Gogh\'s expressive brushwork, Gauguin\'s primitivism.' },
        { week: '3–4',   topic: 'Early 20th Century: Fauvism, Expressionism & Cubism', desc: 'Matisse\'s pure color and flat planes. Kirchner and Die Brücke. Edvard Munch\'s The Scream. Cubism: Picasso\'s Les Demoiselles d\'Avignon and Braque\'s analytical fragmentation — seeing all sides simultaneously.' },
        { week: '5–6',   topic: 'Dada, Surrealism & Abstraction',      desc: 'Dada\'s anti-art protest (Marcel Duchamp\'s Fountain, ready-mades). Surrealism and the unconscious: Salvador Dalí\'s melting watches, René Magritte\'s paradoxes. Abstract Expressionism: Pollock\'s action painting, Rothko\'s color fields.' },
        { week: '7–8',   topic: 'Bauhaus & Modernist Design',           desc: 'The Bauhaus school (1919–1933): Gropius\'s vision of uniting art, craft, and industry. Typography, furniture design, architecture. László Moholy-Nagy and light. How the Bauhaus defined modern design education and was destroyed by the Nazis.' },
        { week: '9–10',  topic: 'Pop Art, Minimalism & Conceptual Art', desc: 'Warhol\'s Campbell\'s Soup Cans and celebrity prints. Lichtenstein\'s Ben-Day dots. Minimalism: Donald Judd\'s industrial stacks, Dan Flavin\'s fluorescent light. Conceptual art — the idea is the work (Sol LeWitt, Joseph Kosuth).' },
        { week: '11–12', topic: 'Postmodernism & Global Contemporary Art', desc: 'Postmodern architecture: Robert Venturi vs. Mies van der Rohe. Deconstructivism: Frank Gehry\'s Guggenheim Bilbao, Zaha Hadid. Global contemporary: Ai Weiwei, Yayoi Kusama, Kara Walker. Street art and Banksy.' },
        { week: '13',    topic: 'Digital Art, Photography & New Media',  desc: 'Photography as fine art (Cindy Sherman, Andreas Gursky). Video art (Nam June Paik). NFTs and digital art\'s legitimacy debates. How technology has expanded and complicated what "art" means.' },
        { week: '14–16', topic: 'Research Essay & Presentation',         desc: 'Research paper (600 words) on a self-chosen modern or contemporary artist. Must include formal analysis, historical context, and the artist\'s significance. Class presentations with Q&A.' },
      ],
    },
    resources: [
      { url: 'https://www.khanacademy.org/humanities/art-history/art-history-1907-1960-age-of-global-conflict', title: 'Modern Art History (1907–Present) — Khan Academy', channel: 'Khan Academy', note: 'Khan Academy\'s Modern and Contemporary sections cover every movement in this course with primary sources and expert commentary.' },
      { url: 'https://www.youtube.com/c/TheArtAssignment', title: 'The Art Assignment', channel: 'PBS Digital Studios (YouTube)', note: 'Exceptional videos on Surrealism, Pop Art, Conceptual Art, and contemporary practice. The episode "What is Postmodernism?" is essential for the postmodern unit.' },
      { url: 'https://www.moma.org/learn/', title: 'MoMA Learning — Museum of Modern Art', channel: 'Museum of Modern Art', note: 'MoMA\'s free learning resources include in-depth pages on every major modern movement, with primary source quotes from artists and curators.' },
      { url: 'https://www.tate.org.uk/art/art-terms', title: 'Tate Art Terms Glossary', channel: 'Tate (London)', note: 'The Tate\'s online glossary defines every art movement and technique in accessible language. Use it as a reference throughout the course.' },
    ],
    quiz: [
      { q: 'Which Impressionist technique involved applying small dabs of pure color side-by-side, relying on the viewer\'s eye to optically mix them?', opts: ['Sfumato', 'Impasto', 'Pointillism', 'Fresco'], ans: 2, exp: 'Pointillism was developed by Georges Seurat (A Sunday on La Grande Jatte, 1884–86) based on scientific color theory. By placing dots of pure color adjacently, he achieved a luminosity impossible with mixed pigments — but the technique required standing at a distance to read the image.' },
      { q: 'The Bauhaus school, founded in 1919 by Walter Gropius, is best known for:', opts: ['Reviving Medieval craft traditions in opposition to industrialization', 'Unifying fine art, craft, and industrial design under a modernist vision', 'Developing Cubism and abstract painting', 'Promoting Surrealism and the study of dreams'], ans: 1, exp: 'The Bauhaus believed the division between "fine art" and "applied craft" was elitist and outdated. It trained artists to design for mass production — furniture, typography, textiles, architecture — producing a unified modernist aesthetic that still defines contemporary design education.' },
      { q: 'Marcel Duchamp\'s "Fountain" (1917) — a factory-produced urinal submitted to an art exhibition — is primarily significant because it:', opts: ['Demonstrated superior technical craftsmanship', 'Challenged the definition of art by arguing that selection and context, not making, constitute artistic creation', 'Introduced abstract expressionist painting to America', 'Was the first artwork to sell for over $1 million'], ans: 1, exp: '"Fountain" is the founding statement of Conceptual Art and Dada\'s anti-art protest. By signing a purchased urinal "R. Mutt" and submitting it, Duchamp argued that the artist\'s act of choosing and recontextualizing an object is sufficient to make it art — a debate that has defined contemporary art ever since.' },
      { q: 'Abstract Expressionism, centered in New York in the 1940s–50s, is characterized by:', opts: ['Precise geometric abstraction and mathematical composition', 'Large-scale works emphasizing spontaneous gesture, emotion, and non-representational form', 'Mechanical reproduction of commercial imagery', 'Careful representation of everyday suburban American life'], ans: 1, exp: 'Abstract Expressionism rejected the European tradition and embraced raw emotional expression. Jackson Pollock\'s drip paintings, Mark Rothko\'s luminous color fields, and Willem de Kooning\'s violent brushwork all prioritized feeling over form — making New York the new center of the art world.' },
    ],
  },

  {
    id: 'art-digital',
    name: 'Digital Design & Adobe Suite',
    grade: 10, term: 'Spring', credits: 0.5,
    description: 'Professional digital design skills for the modern creative. Students master the three core Adobe applications — Illustrator (vector graphics), Photoshop (image editing and compositing), and InDesign (layout and publication) — while learning the underlying principles of color theory, typography, grid systems, and visual hierarchy. These tools are the industry standard for graphic design, marketing, UX, and illustration.',
    syllabus: {
      objectives: [
        'Create vector illustrations and logo designs in Adobe Illustrator',
        'Composite and retouch photographs using non-destructive Photoshop techniques',
        'Design multi-page layouts in InDesign using grids, styles, and master pages',
        'Apply color theory (color wheel, complementary, analogous, triadic schemes) to design work',
        'Produce a professional-quality project in each application for your portfolio',
      ],
      units: [
        { week: '1–2',   topic: 'Foundations of Digital Design',     desc: 'Raster vs. vector graphics (resolution, file formats: PNG/JPG vs. SVG/PDF). Color modes (RGB for screen vs. CMYK for print). File organization and asset management.' },
        { week: '3–4',   topic: 'Color Theory',                      desc: 'The color wheel: primary, secondary, tertiary colors. Color relationships: complementary (maximum contrast), analogous (harmonious), triadic, split-complementary. Tint, shade, and tone. Applying color psychology to design.' },
        { week: '5–6',   topic: 'Adobe Illustrator — Vector Drawing', desc: 'The pen tool and anchor points. Shapes, pathfinder operations, clipping masks. Drawing with precision. Creating a logo mark from scratch using only basic shapes.' },
        { week: '7–8',   topic: 'Illustrator — Illustration & Icons', desc: 'Creating flat-design illustrations. Working with gradients and transparency. Building an icon set for a fictional brand. Export settings for web and print.' },
        { week: '9–10',  topic: 'Adobe Photoshop — Image Editing',    desc: 'Layers, masks, and adjustment layers (non-destructive workflow). Selection tools (magic wand, pen, quick select). Retouching and compositing. Creating a photomontage.' },
        { week: '11–12', topic: 'Adobe InDesign — Layout & Typography', desc: 'Document setup, master pages, grid systems. Paragraph and character styles. Placing and linking images. Designing a four-page magazine spread.' },
        { week: '13',    topic: 'Visual Hierarchy & UI Basics',       desc: 'Using size, weight, color, and spacing to create hierarchy. Gestalt principles in interface design. Wireframing a simple app screen in Illustrator.' },
        { week: '14–16', topic: 'Integrated Design Project',          desc: 'Design a complete visual identity for a fictional brand: logo (Illustrator), promotional photograph (Photoshop), and one-page advertisement (InDesign). Present and critique.' },
      ],
    },
    resources: [
      { url: 'https://helpx.adobe.com/creative-cloud/tutorials-explore.html', title: 'Adobe Tutorials — Official Creative Cloud', channel: 'Adobe', note: 'Adobe\'s own tutorial library for Illustrator, Photoshop, and InDesign — start here for every new tool. Beginner to advanced.' },
      { url: 'https://www.canva.com/learn/design-school/', title: 'Canva Design School', channel: 'Canva', note: 'Canva\'s free design school covers color theory, typography, composition, and brand design principles in plain language. Excellent for the theory units.' },
      { url: 'https://www.youtube.com/c/TutorialsByA', title: 'Tutorials by A — Adobe Suite', channel: 'YouTube (Tutorials by A)', note: 'Focused Adobe tutorials for Illustrator, Photoshop, and InDesign. Extremely clear and project-based.' },
      { url: 'https://www.skillshare.com/browse/graphic-design', title: 'Skillshare — Graphic Design Courses', channel: 'Skillshare', note: 'Search "Adobe Illustrator for beginners," "Photoshop fundamentals," or "InDesign layout" for structured courses that parallel this syllabus.' },
    ],
    quiz: [
      { q: 'On the color wheel, colors directly opposite each other are called:', opts: ['Analogous colors', 'Triadic colors', 'Complementary colors', 'Monochromatic colors'], ans: 2, exp: 'Complementary colors sit opposite each other on the color wheel (e.g., red/green, blue/orange). They create maximum contrast and visual vibration when placed adjacent. Analogous colors are neighboring hues; triadic colors form an equilateral triangle on the wheel.' },
      { q: 'What is the main difference between raster and vector graphics?', opts: ['Raster files are always larger; vector files are always smaller', 'Raster images are made of pixels and lose quality when scaled up; vector images use mathematical paths and scale infinitely without quality loss', 'Raster files only support black and white; vector files support color', 'There is no practical difference for screen use'], ans: 1, exp: 'Raster images (JPG, PNG, PSD) are grids of pixels — enlarge them and they become blurry. Vector graphics (SVG, AI, PDF) are defined by mathematical curves, so they scale to any size without degradation. Logos and icons are almost always created as vectors.' },
      { q: 'In Gestalt psychology applied to design, the principle of "proximity" states that:', opts: ['Elements that are similar in appearance are perceived as related', 'Elements that are close together tend to be perceived as belonging to the same group', 'Humans prefer symmetrical and complete shapes', 'The eye follows a natural path through a composition'], ans: 1, exp: 'Gestalt proximity means we group nearby elements mentally, even without borders or connecting lines. Designers use it in navigation menus, form labels, and layout — placing related items close together to signal their relationship.' },
      { q: 'Which Adobe application is best suited for designing a multi-page magazine layout?', opts: ['Photoshop', 'Illustrator', 'InDesign', 'Lightroom'], ans: 2, exp: 'InDesign is purpose-built for multi-page publication layout — magazines, books, brochures. It handles master pages, paragraph styles, flowing text across pages, and print-ready export. Illustrator is for single-page illustration and logos; Photoshop is for image editing.' },
    ],
  },

  {
    id: 'art-aphist',
    name: 'AP Art History',
    grade: 11, term: 'Fall', credits: 1.0,
    description: 'College-level art history covering 250 required works from prehistoric times to the present, drawn from every global tradition — not just the Western canon. Students develop the rigorous visual analysis and essay-writing skills tested on the AP exam, including formal analysis, contextual analysis, attribution, and cross-cultural comparison. A score of 3–5 on the AP exam signals college-ready art historical thinking to RISD, Parsons, and art history programs nationwide.',
    syllabus: {
      objectives: [
        'Identify and analyze all 250 AP Art History required works by form, function, content, and context',
        'Write timed formal analysis essays using College Board\'s AP Art History rubric',
        'Compare works across global traditions using a consistent analytical framework',
        'Explain the relationship between artworks and their patronage, purpose, and original audience',
        'Achieve a score of 3 or higher on the AP Art History exam',
      ],
      units: [
        { week: '1–3',   topic: 'Global Prehistory & Ancient Mediterranean', desc: 'AP required works from prehistoric Europe, ancient Near East, Egypt, Greece, and Rome. Image identification, dating strategies, and formal conventions of each culture. Long-essay question (LEQ) practice.' },
        { week: '4–5',   topic: 'Early Europe & Colonial Americas',           desc: 'Early Christian, Byzantine, Islamic, Romanesque, and Gothic. Pre-Columbian Americas (Aztec, Maya, Inca). Required works analysis — Hagia Sophia, Chartres Cathedral, Templo Mayor.' },
        { week: '6–7',   topic: 'Renaissance & Baroque',                      desc: 'Italian and Northern Renaissance required works. Baroque dynamism: Bernini\'s Ecstasy of Saint Teresa, Caravaggio\'s chiaroscuro, Artemisia Gentileschi. Dutch Golden Age.' },
        { week: '8–9',   topic: 'Indigenous Americas, Africa & Pacific',      desc: 'Required works from Benin Kingdom, West Africa, Native North America, Oceania. Analyzing non-Western art without Western frameworks.' },
        { week: '10–11', topic: '18th & 19th Century',                        desc: 'Neoclassicism vs. Romanticism. Realism and Courbet. Impressionism and its Japanese influences (Japonisme). Photography as art.' },
        { week: '12–13', topic: 'Modern & Contemporary (20th–21st Century)',  desc: 'All AP required works from Cubism through global contemporary. Architecture: Le Corbusier, Frank Lloyd Wright, Zaha Hadid\'s MAXXI Museum.' },
        { week: '14–15', topic: 'AP Exam Strategies & Essay Practice',        desc: 'Timed practice on all three question types: object-based (30 min), short answer (30 min), long essay (35 min). College Board rubric self-scoring. Image recognition drills.' },
        { week: '16',    topic: 'AP Exam Review',                             desc: 'Final review of all 250 required works. Flashcard sprint. Image attribution practice. Mock exam under timed conditions.' },
      ],
    },
    resources: [
      { url: 'https://apclassroom.collegeboard.org/', title: 'AP Classroom — Official AP Art History', channel: 'College Board', note: 'The official source for AP Art History practice questions, AP Daily videos, and the required image list. Use this every week.' },
      { url: 'https://www.khanacademy.org/humanities/ap-art-history', title: 'AP Art History — Khan Academy', channel: 'Khan Academy', note: 'Khan Academy partners with College Board to provide video analysis of every required work. Essential — watch each video for all 250 required works.' },
      { url: 'https://smarthistory.org/ap-art-history/', title: 'Smarthistory — AP Art History', channel: 'Smarthistory', note: 'Scholarly essays on every AP required work, written by art historians. Provides the depth of analysis needed for long-essay questions.' },
      { url: 'https://www.youtube.com/c/TheArtAssignment', title: 'The Art Assignment', channel: 'PBS Digital Studios (YouTube)', note: 'Context-rich videos on modern and contemporary AP required works — particularly valuable for units 8–10 of the AP curriculum.' },
    ],
    quiz: [
      { q: 'Gian Lorenzo Bernini\'s "Ecstasy of Saint Teresa" (1647–52) is a masterwork of Baroque sculpture because it:', opts: ['Uses pure geometric abstraction to represent spiritual experience', 'Combines marble, gilded bronze, and theatrical lighting to dramatize a mystical vision with unprecedented emotional intensity', 'Depicts the saint in calm, classical contrapposto in the Greek tradition', 'Was the first sculpture to be displayed in a public piazza'], ans: 1, exp: 'Bernini dissolved the boundary between sculpture, architecture, and theater in the Cornaro Chapel. He carved Teresa and the angel in ecstasy with fluttering marble drapery that appears liquid, placed gilded bronze rays behind them, and staged family portrait groups watching from side balconies — all to envelop the viewer in a total religious experience. It is the defining example of Baroque total artwork (Gesamtkunstwerk).' },
      { q: 'The Great Pyramids at Giza are significant in the AP Art History curriculum as examples of:', opts: ['Early Gothic funerary architecture', 'Monumental mortuary architecture expressing pharaonic power and the Egyptian belief in the afterlife', 'The earliest known use of the arch in large-scale construction', 'Astronomical observatories with no religious function'], ans: 1, exp: 'The Pyramids of Khufu, Khafre, and Menkaure (c. 2560–2510 BCE) served as eternal tombs for pharaohs who were divine kings. Their colossal scale, precise orientation, and permanence expressed the pharaoh\'s power and guaranteed the ka\'s survival. They remain the most recognized examples of Egyptian funerary architecture.' },
      { q: 'Which of the following best describes Caravaggio\'s distinctive contribution to Baroque painting?', opts: ['Soft, blended transitions and idealized figures in the manner of Raphael', 'Extreme tonal contrast between light and deep shadow (tenebrism) combined with gritty, unidealized figures', 'Flat color planes and decorative line influenced by Japanese woodblock prints', 'Scientific geometric abstraction derived from Cubism'], ans: 1, exp: 'Caravaggio\'s tenebrism (from Italian tenebroso — "dark") plunged backgrounds into shadow and illuminated figures with a single, raking light source. His models were rough-handed Romans, not idealized angels — shocking contemporaries who expected religious figures to look divine. He directly influenced Artemisia Gentileschi, Rubens, and Rembrandt.' },
      { q: 'The Hagia Sophia (532–37 CE, Constantinople) represents a structural innovation because:', opts: ['It was the first building to use pointed arches and flying buttresses', 'Its architects invented a system of pendentives that placed a circular dome over a square base, enabling the enormous unsupported central space', 'It used Roman concrete (opus caementicium) to construct a ribbed vault', 'It was the first church to be oriented east-west on a basilica plan'], ans: 1, exp: 'Anthemius of Tralles and Isidorus of Miletus solved the geometric problem of placing a round dome over a square structure using pendentives — curved triangular sections that transition from square to circle. The result was a central dome 55 meters high appearing to float on a ring of windows, filling the vast interior with diffused light.' },
    ],
  },

  {
    id: 'art-branding',
    name: 'Typography, Branding & Visual Identity',
    grade: 11, term: 'Spring', credits: 0.5,
    description: 'Every successful brand is built on intentional visual language — type choices, color systems, and consistent graphic elements that communicate values before a word is read. This course teaches students to think like professional brand designers: studying typeface anatomy, typographic hierarchy, and logo design, then applying these skills to create a complete visual identity system for a real or fictional brand.',
    syllabus: {
      objectives: [
        'Classify typefaces by category (serif, sans-serif, script, display, monospace) and explain their connotations',
        'Apply typographic hierarchy using scale, weight, and spacing to organize information',
        'Design a logomark and wordmark that communicates a brand\'s values through form and color',
        'Build a brand style guide specifying typography, color palette, logo usage, and visual tone',
        'Present and defend brand design decisions with reference to design principles and target audience',
      ],
      units: [
        { week: '1–2',   topic: 'Typeface Anatomy & History',         desc: 'Serif vs. sans-serif. Ascenders, descenders, x-height, baseline, cap height. The evolution of type: Garamond (15th century) → Helvetica (1957) → custom digital fonts today. Why type choice signals era and tone.' },
        { week: '3–4',   topic: 'Typographic Principles',             desc: 'The five rules: hierarchy, alignment, contrast, repetition, proximity (HACRP). Leading, kerning, and tracking. Choosing type pairs. Creating a typographic poster with no imagery — type alone.' },
        { week: '5–6',   topic: 'Logo Design Fundamentals',           desc: 'Types of logos: wordmark (Google), lettermark (IBM), icon (Apple), combination mark (Nike + swoosh). What makes a logo scalable, versatile, and memorable. Designing three logo sketches for a fictional brand.' },
        { week: '7–8',   topic: 'Color Systems in Branding',          desc: 'Building a brand color palette. Primary brand color + secondary + neutral. Color psychology in branding (blue = trust, red = urgency, green = growth). Specifying colors in Hex, RGB, and Pantone. Dark/light mode variants.' },
        { week: '9–10',  topic: 'Grid Systems & Layout Design',       desc: 'How grids create consistency across media. Column grids for websites, baseline grids for print. Applying a brand to a business card, letterhead, and social media template.' },
        { week: '11–12', topic: 'Brand Style Guide',                  desc: 'What a professional style guide contains: logo usage rules, clear space, prohibited uses, typography system, color codes, photography style, tone of voice. Building a mini style guide for your brand.' },
        { week: '13',    topic: 'Rebrand Case Studies',               desc: 'Analyzing real rebrands: Gap 2010 (failed), Airbnb 2014 (succeeded), Instagram 2016, Twitter→X 2023. What works, what fails, and why public reaction matters in brand design.' },
        { week: '14–16', topic: 'Brand Identity Capstone',            desc: 'Deliver a complete brand identity: logo suite, color palette, typography system, one-page style guide, and three application mockups. Pitch your brand to the class as a designer would to a client.' },
      ],
    },
    resources: [
      { url: 'https://www.canva.com/learn/design-school/', title: 'Canva Design School — Branding & Typography', channel: 'Canva', note: 'Canva\'s free design school has excellent articles on logo design, typography, and brand identity. Read the series on "Building a Brand" and "Typography Fundamentals."' },
      { url: 'https://www.youtube.com/c/TheFuturChannel', title: 'The Futur — Design Business & Branding', channel: 'The Futur (YouTube)', note: 'Chris Do\'s channel is the best free resource for branding, client communication, and design thinking. Watch "Logo Design Process," "How to Design a Brand Identity," and "Typography Rules."' },
      { url: 'https://www.skillshare.com/browse/graphic-design/branding', title: 'Skillshare — Branding & Identity Design Courses', channel: 'Skillshare', note: 'Search "brand identity design," "logo design process," or "typography for designers." Many courses are taught by working brand designers.' },
      { url: 'https://www.fonts.google.com/knowledge', title: 'Google Fonts Knowledge', channel: 'Google Fonts', note: 'Free, authoritative articles on typography, type pairing, choosing typefaces, and typographic anatomy. Beautifully designed and free.' },
    ],
    quiz: [
      { q: 'In typography, "kerning" refers to:', opts: ['The overall spacing between all letters in a word', 'The adjustment of space between a specific pair of letters', 'The vertical space between lines of text', 'The weight of the typeface (light, regular, bold)'], ans: 1, exp: 'Kerning is the manual adjustment of space between individual letter pairs. Certain combinations (AV, WA, To) have awkward natural spacing that typographers correct optically. Tracking adjusts spacing uniformly across a whole word or passage; leading adjusts line spacing.' },
      { q: 'The Helvetica typeface, designed in 1957 by Max Miedinger, belongs to which category?', opts: ['Old Style Serif (Humanist)', 'Transitional Serif', 'Grotesque Sans-Serif', 'Slab Serif'], ans: 2, exp: 'Helvetica is a Grotesque (or Neo-Grotesque) sans-serif — characterized by nearly uniform stroke width, minimal personality, and exceptional neutrality. It was designed to be as invisible as possible, which made it the preferred typeface of corporations, wayfinding systems (New York subway), and governments worldwide.' },
      { q: 'Which of the following best describes the design principle of "visual hierarchy" in typography?', opts: ['Making all text elements the same size for consistency', 'Using scale, weight, color, and position to guide the reader\'s eye through information in order of importance', 'Centering all text on the page for visual balance', 'Using only two typefaces in any given design'], ans: 1, exp: 'Visual hierarchy communicates importance through contrast. A large, bold headline draws the eye first; a subheading in medium weight comes second; body text at regular weight is read last. Without hierarchy, the eye does not know where to start and the design fails to communicate.' },
      { q: 'A "wordmark" logo is best described as:', opts: ['An abstract symbol with no letterforms (like Apple\'s apple)', 'The brand name rendered in a distinctive, custom typeface with no separate icon', 'A monogram using the brand\'s initials (like IBM)', 'A combination of an icon and a wordmark used together'], ans: 1, exp: 'A wordmark (or logotype) uses the brand name itself as the logo — styled in a distinctive or custom typeface. Google, Coca-Cola, and FedEx are canonical wordmarks. They work when the brand name is short and distinctive enough to carry the identity without a separate symbol.' },
    ],
  },

  {
    id: 'art-architecture',
    name: 'Architecture & Spatial Design',
    grade: 12, term: 'Fall', credits: 0.5,
    description: 'Architecture is the art form you live inside. This course surveys the history, theory, and technical fundamentals of architectural design — from ancient structural systems through modernism\'s "form follows function" to postmodern complexity and today\'s parametric design. Students learn to analyze buildings as both aesthetic objects and functional systems, and produce original design proposals using sketching, model-making, and digital tools.',
    syllabus: {
      objectives: [
        'Identify and compare major architectural styles from antiquity through the present using correct technical vocabulary',
        'Distinguish load-bearing masonry structures from curtain wall systems and explain their spatial implications',
        'Analyze a building by its form, function, material, structure, and cultural context',
        'Apply modernist and postmodernist design principles to an original architectural proposal',
        'Produce a design concept with orthographic drawings (plan, section, elevation) and physical or digital model',
      ],
      units: [
        { week: '1–2',   topic: 'How Buildings Stand: Structural Systems', desc: 'Post-and-lintel, the arch, the vault, and the dome. Load-bearing masonry vs. steel frame and curtain wall construction. Why Gothic cathedrals needed flying buttresses while the Seagram Building didn\'t. Structural logic as design driver.' },
        { week: '3–4',   topic: 'Architectural History: Ancient to Industrial', desc: 'Greek temples and the orders (Doric, Ionic, Corinthian). Roman engineering (Pantheon\'s concrete dome). Gothic verticality. Renaissance symmetry and the Vitruvian principles of firmitas, utilitas, venustas. Baroque city planning.' },
        { week: '5–6',   topic: 'Modernism: Form Follows Function',         desc: 'The International Style and Mies van der Rohe\'s "less is more." Le Corbusier\'s Five Points of Architecture. Frank Lloyd Wright\'s organic architecture and Fallingwater. Walter Gropius and the Bauhaus building.' },
        { week: '7–8',   topic: 'Brutalism & Late Modernism',               desc: 'Brutalism\'s raw concrete aesthetic — Le Corbusier\'s Unité d\'Habitation, Paul Rudolph\'s Yale Art and Architecture Building. The social idealism and ultimate failures of brutalist public housing. Late Modernism and High-Tech architecture (Renzo Piano\'s Centre Pompidou).' },
        { week: '9–10',  topic: 'Postmodernism & Deconstructivism',         desc: 'Robert Venturi\'s "less is a bore" and Learning from Las Vegas. Postmodern historical quotation and ornamentation (Michael Graves\' Portland Building). Deconstructivism: Frank Gehry\'s Guggenheim Bilbao, Zaha Hadid\'s MAXXI, Rem Koolhaas\'s CCTV Building.' },
        { week: '11–12', topic: 'Sustainable & Parametric Design',           desc: 'Green building principles: passive solar, thermal mass, green roofs, LEED certification. Computational and parametric design: how algorithms generate architectural form (Bjarke Ingels Group, SHoP Architects). Architecture in the age of climate change.' },
        { week: '13',    topic: 'Space, Light & Experience',                 desc: 'How architects manipulate light (Tadao Ando\'s Church of the Light), circulation (Le Corbusier\'s promenade architecturale), and scale (the compression-release of entering a Gothic cathedral). Writing an experiential architectural critique.' },
        { week: '14–16', topic: 'Design Studio Project',                     desc: 'Design a community space (library, café, community center, or cultural pavilion) for a specific site. Deliver a site plan, floor plan, two sections, one elevation, and a physical or digital model. Presentation pin-up and critique.' },
      ],
    },
    resources: [
      { url: 'https://www.youtube.com/c/ArchitecturalDigest', title: 'Architectural Digest — Open Door & Design Features', channel: 'Architectural Digest (YouTube)', note: 'AD\'s YouTube channel provides beautifully filmed access to significant buildings and designer homes worldwide. Use it for inspiration and to develop your visual vocabulary for contemporary architecture.' },
      { url: 'https://www.dezeen.com/', title: 'Dezeen — Architecture & Design News', channel: 'Dezeen', note: 'The leading global architecture and design magazine. Browse the architecture section for current projects by leading firms. Essential for staying current on contemporary practice.' },
      { url: 'https://www.youtube.com/c/TheArtAssignment', title: 'The Art Assignment — Architecture Episodes', channel: 'PBS Digital Studios (YouTube)', note: 'The Art Assignment has excellent episodes on architectural history including Brutalism, postmodernism, and Zaha Hadid. Supplement the weekly units with relevant episodes.' },
      { url: 'https://www.khanacademy.org/humanities/art-history/architecture', title: 'Architecture — Khan Academy Art History', channel: 'Khan Academy', note: 'Khan Academy\'s architecture section covers major historical buildings in depth, including structural analysis and cultural context.' },
    ],
    quiz: [
      { q: 'In structural engineering, a "curtain wall" system refers to:', opts: ['A load-bearing masonry wall that supports the weight of the building', 'A non-structural outer skin of glass and metal panels attached to the building frame', 'A wall built around a medieval castle for defense', 'A wall made of reinforced concrete in a brutalist building'], ans: 1, exp: 'A curtain wall is a non-load-bearing exterior cladding system — glass, metal panels, or composite materials — hung from the structural steel or concrete frame. Because it carries no structural load, it can be made almost entirely of glass, enabling the transparent towers of the International Style. The Lever House (1952, New York) was among the first.' },
      { q: 'Le Corbusier\'s dictum "a house is a machine for living in" is associated with which architectural movement?', opts: ['Postmodernism', 'Brutalism', 'Modernism / International Style', 'Art Nouveau'], ans: 2, exp: 'Le Corbusier\'s phrase, from Vers une Architecture (1923), summarized Modernism\'s philosophy: strip the house of historical ornament and design it rationally for its function. His Five Points of Architecture (pilotis, free plan, free façade, ribbon windows, roof garden) embodied this machine logic — exemplified in the Villa Savoye (1929).' },
      { q: 'Brutalist architecture takes its name from the French "béton brut," meaning:', opts: ['Brutal or harsh living conditions', 'Raw, unfinished concrete', 'The brutal honesty of exposing structural systems', 'Large, heavy building masses'], ans: 1, exp: 'Béton brut means "raw concrete." Le Corbusier coined the phrase and used it at the Unité d\'Habitation (1952). Brutalism embraced the exposed texture of board-formed concrete as honest material expression — the structure and material are simultaneously the aesthetic. The term was later used pejoratively as the buildings aged and became associated with failed social housing.' },
      { q: 'Frank Gehry\'s Guggenheim Museum Bilbao (1997) is considered a landmark of Deconstructivist architecture because:', opts: ['It uses pure geometric forms and minimal ornamentation in the International Style', 'Its titanium-clad curving forms reject orthogonal geometry entirely, generated using aerospace CAD software (CATIA)', 'It revives classical historical ornament in a postmodern quotation', 'It was the first museum to use a curtain wall facade system'], ans: 1, exp: 'Gehry designed Bilbao\'s titanium-clad biomorphic forms using CATIA — software developed for aerospace engineering — that could produce and communicate complex curved surfaces. The building\'s anti-Euclidean geometry made it the defining statement of Deconstructivism and demonstrated that digital tools had permanently changed what was architecturally possible.' },
      { q: 'In architectural drawing, a "section" is:', opts: ['An exterior elevation showing the building\'s front face', 'A top-down view showing the arrangement of rooms on a floor', 'A vertical cut through a building revealing interior spaces, wall construction, and ceiling heights', 'A perspective rendering showing how the building will look when complete'], ans: 2, exp: 'A section is made by slicing through the building vertically and looking at the cut face. It reveals information that plans and elevations cannot show: how floors relate to each other, ceiling heights, staircase geometry, structural depth of floors, and the relationship between interior and exterior. A floor plan is the horizontal equivalent.' },
    ],
  },

  {
    id: 'art-capstone',
    name: 'Arts & Design Portfolio Capstone',
    grade: 12, term: 'Spring', credits: 1.0,
    description: 'The culminating experience of the Arts & Design pathway: the production of a cohesive, professional-quality portfolio ready for submission to art schools, design programs, and general universities. Students select 10–15 works from their four years, create up to three new capstone pieces to fill gaps, write artist statements for each work, design the portfolio itself as a designed object, and present their creative practice in a mock portfolio review.',
    syllabus: {
      objectives: [
        'Curate a cohesive body of work that demonstrates range, skill development, and a personal artistic voice',
        'Write clear, specific artist statements articulating intent, process, and meaning for each portfolio piece',
        'Produce at least two new capstone works that push beyond previous skill levels',
        'Design a digital portfolio (PDF and online) as a considered designed artifact',
        'Present the portfolio in a live critique and respond to evaluator questions about creative decisions',
      ],
      units: [
        { week: '1–2',   topic: 'Portfolio Audit & Strategy',          desc: 'Review all work produced in grades 9–11. Identify the strongest pieces, gaps in medium or theme, and the emerging personal voice. Map target programs\' portfolio requirements (RISD, Parsons, UCLA, etc.) and reverse-engineer the curation strategy.' },
        { week: '3–4',   topic: 'Artist Statement Writing',            desc: 'What a strong artist statement includes: medium, process, intent, cultural or personal context, and significance. The difference between describing what you made and explaining why you made it. Drafts and revision workshops.' },
        { week: '5–7',   topic: 'Capstone Work 1 — Studio Production', desc: 'Produce an ambitious new work in your primary medium. Weekly studio critiques with written reflection. Documenting process in a sketchbook/design log.' },
        { week: '8–10',  topic: 'Capstone Work 2 — Medium Expansion',  desc: 'Produce a second capstone work that steps outside your primary medium — a graphic designer shoots photography; a painter creates a digital illustration. Skill expansion demonstrates versatility.' },
        { week: '11–12', topic: 'Portfolio Design & Sequencing',        desc: 'Design the portfolio as a designed object: cover, paper stock, typography, image sizing, and work sequencing. Digital portfolio on a platform (Behance, Cargo, or custom website). PDF export for direct submission.' },
        { week: '13',    topic: 'Supplement & Application Essays',      desc: 'Art school supplements: "Why do you make art?" and "Describe your creative process." Writing about your body of work with specificity and confidence. Peer editing rounds.' },
        { week: '14–15', topic: 'Mock Portfolio Review',                desc: 'Live 15-minute portfolio presentation to a panel (faculty + external creative professional). Receive structured feedback on curation, statement quality, and presentation. Final revisions.' },
        { week: '16',    topic: 'Portfolio Completion & Celebration',   desc: 'Submit final digital and print portfolios. Reflect on your four-year creative development. Share final portfolios in an end-of-year art show open to the school community.' },
      ],
    },
    resources: [
      { url: 'https://www.behance.net/', title: 'Behance — Creative Portfolio Platform', channel: 'Adobe Behance', note: 'The leading online portfolio platform for designers, illustrators, and artists. Study how working professionals present their work — then build your own Behance profile as part of this course.' },
      { url: 'https://www.youtube.com/c/TheArtAssignment', title: 'The Art Assignment — Artist Process Videos', channel: 'PBS Digital Studios (YouTube)', note: 'The Art Assignment\'s "The Case For" series and artist studio visits model the kind of thoughtful creative articulation expected in artist statements and portfolio interviews.' },
      { url: 'https://www.coursera.org/browse/arts-and-humanities', title: 'Coursera — Arts & Humanities Courses', channel: 'Coursera', note: 'Coursera\'s free audit option includes courses on art critique, design thinking, and creative writing that support the statement-writing and critical-thinking components of this capstone.' },
      { url: 'https://www.risd.edu/admissions/undergraduate/portfolio/', title: 'RISD Portfolio Requirements', channel: 'Rhode Island School of Design', note: 'RISD publishes detailed portfolio requirements and examples online. Even if you\'re not applying to RISD, their standards are the industry benchmark. Study the examples carefully.' },
    ],
    quiz: [
      { q: 'When curating an art portfolio for selective design school admissions, which principle is most important?', opts: ['Including as many pieces as possible to show productivity', 'Including only your most technically perfect pieces regardless of medium', 'Presenting a cohesive body of work that demonstrates a personal voice, range, and intentional growth', 'Prioritizing digital work over traditional media'], ans: 2, exp: 'Selective art school reviewers — at RISD, Parsons, and Pratt — read hundreds of technically proficient portfolios. What distinguishes successful applicants is a consistent personal perspective, intentional curation, and evidence of creative thinking beyond technical execution. A cohesive 12-piece portfolio always outperforms a scattered 20-piece one.' },
      { q: 'A strong artist statement for a portfolio piece should primarily:', opts: ['Describe each element in the artwork in physical detail', 'Explain what inspired the work, what choices were made, and why those choices express a specific intent', 'Prove the artist\'s mastery of technique', 'Summarize the art historical movements that influenced the piece'], ans: 1, exp: 'An artist statement communicates your thinking to an admissions reader who cannot ask questions. The strongest statements explain the problem or question you were exploring, the intentional decisions you made (medium, composition, color, process), and what the work means in the context of your broader practice.' },
      { q: 'The Gestalt principle of "continuation" describes:', opts: ['Elements that are similar in color or shape being perceived as related', 'The eye\'s tendency to follow a line or edge even when it is interrupted', 'Incomplete shapes being mentally completed by the viewer', 'Nearby elements being grouped together'], ans: 1, exp: 'The Gestalt principle of continuation means the eye naturally follows a path, curve, or line through a composition — even across gaps. Designers use it to create flow and guide attention. A diagonal composition, a curved road in a photograph, or a dotted line all exploit continuation.' },
      { q: 'Which of the following correctly describes the difference between "analog" and "digital" portfolio submission requirements at most US art schools?', opts: ['Analog requires physical slides; digital is not accepted', 'Most schools now accept digital PDF or online portfolio submissions, while some additionally require physical work samples at in-person interviews', 'Only digital submissions are accepted; physical portfolios are obsolete', 'Digital portfolios must be submitted via specific proprietary platforms controlled by each school'], ans: 1, exp: 'The majority of US art schools (RISD, Parsons, SVA, MICA) accept digital PDF or online portfolio submissions (via Slideroom or the school\'s portal) for initial admissions review. Some programs ask to see physical work at scholarship interviews or auditions. Always check each program\'s specific requirements, as they vary.' },
      { q: 'In the context of portfolio sequencing, why is the opening piece particularly important?', opts: ['It should be the chronologically oldest work to show development', 'It is typically given the lowest weight since reviewers focus on recent work', 'It creates the first impression and sets the tone — it should be the most compelling, confident work that represents your voice', 'It should always be a technical drawing or life study to establish credibility'], ans: 2, exp: 'Portfolio reviewers make fast initial judgments. The opening piece is a handshake — it signals immediately what kind of artist you are. It should be your most confident, distinctive work: not necessarily the most technically difficult, but the piece that most clearly expresses your personal artistic voice and compels the reviewer to continue.' },
    ],
  },
];

export default function ArtsDesignPathway({ language, toggleLanguage }) {
  return <PathwayPage meta={META} schedule={SCHEDULE} courses={COURSES} language={language} toggleLanguage={toggleLanguage} />;
}
