const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireAdmin } = require('../middleware/auth');

const prisma = new PrismaClient();
const router = express.Router();

// GET /api/courses — list published courses (public)
router.get('/', async (req, res) => {
  const courses = await prisma.course.findMany({
    where: { isPublished: true },
    select: {
      id: true,
      slug: true,
      name: true,
      nameZh: true,
      credits: true,
      department: true,
      type: true,
      gradeLevel: true,
      description: true,
      _count: { select: { modules: true } },
    },
    orderBy: [{ department: 'asc' }, { name: 'asc' }],
  });
  res.json(courses);
});

// GET /api/courses/:slug — course detail with modules (public)
router.get('/:slug', async (req, res) => {
  const course = await prisma.course.findUnique({
    where: { slug: req.params.slug },
    include: {
      modules: { orderBy: { order: 'asc' } },
      _count: { select: { questions: true } },
    },
  });
  if (!course || !course.isPublished) {
    return res.status(404).json({ error: 'Course not found' });
  }
  res.json(course);
});

// ── Admin-only routes ──────────────────────────────────────────────────────────

// POST /api/courses — create course
router.post('/', authenticate, requireAdmin, async (req, res) => {
  const { slug, name, nameZh, credits, department, type, description, isPublished } = req.body || {};
  if (!slug || !name || !credits || !department) {
    return res.status(400).json({ error: 'slug, name, credits, and department are required' });
  }
  try {
    const course = await prisma.course.create({
      data: { slug, name, nameZh: nameZh || '', credits, department, type: type || 'Core', description: description || '', isPublished: isPublished ?? false },
    });
    res.status(201).json(course);
  } catch (e) {
    if (e.code === 'P2002') return res.status(409).json({ error: 'Slug already exists' });
    throw e;
  }
});

// PATCH /api/courses/:slug — update course
router.patch('/:slug', authenticate, requireAdmin, async (req, res) => {
  const allowed = ['name', 'nameZh', 'credits', 'department', 'type', 'description', 'isPublished'];
  const data = {};
  for (const k of allowed) {
    if (req.body[k] !== undefined) data[k] = req.body[k];
  }
  try {
    const course = await prisma.course.update({ where: { slug: req.params.slug }, data });
    res.json(course);
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Course not found' });
    throw e;
  }
});

// POST /api/courses/:slug/modules — add a module
router.post('/:slug/modules', authenticate, requireAdmin, async (req, res) => {
  const course = await prisma.course.findUnique({ where: { slug: req.params.slug } });
  if (!course) return res.status(404).json({ error: 'Course not found' });
  const { order, title, titleZh, objectives, readingUrl, readingNote, videoUrl, videoNote,
    video2Url, video2Note, practiceUrl, practiceNote, assignment, estimatedHrs } = req.body || {};
  if (!order || !title) return res.status(400).json({ error: 'order and title are required' });
  const mod = await prisma.courseModule.create({
    data: { courseId: course.id, order, title, titleZh: titleZh || '', objectives: objectives || '',
      readingUrl: readingUrl || '', readingNote: readingNote || '',
      videoUrl: videoUrl || '', videoNote: videoNote || '',
      video2Url: video2Url || '', video2Note: video2Note || '',
      practiceUrl: practiceUrl || '', practiceNote: practiceNote || '',
      assignment: assignment || '', estimatedHrs: estimatedHrs || 3 },
  });
  res.status(201).json(mod);
});

// GET /api/courses/:slug/questions — exam questions (admin only for now)
router.get('/:slug/questions', authenticate, requireAdmin, async (req, res) => {
  const course = await prisma.course.findUnique({ where: { slug: req.params.slug } });
  if (!course) return res.status(404).json({ error: 'Course not found' });
  const questions = await prisma.examQuestion.findMany({
    where: { courseId: course.id },
    orderBy: { order: 'asc' },
  });
  res.json(questions);
});

module.exports = router;
