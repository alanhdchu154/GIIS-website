/** Shared UI copy: English UI uses English only; Chinese UI uses Chinese only. */

export function getNavStrings(language) {
  const en = language === 'en';
  return {
    trustCenter: en ? 'TRUST CENTER' : '信任中心',
    academics: en ? 'ACADEMICS' : '学术',
    admission: en ? 'ADMISSIONS' : '入学路径',
    students: en ? 'STUDENT PORTAL' : '学生入口',
    resources: en ? 'PARENT VIEW' : '家长视角',
    langToggleAria: en ? 'Switch to Chinese' : 'Switch to English',
    /** Single entry: student portal (admin uses same page with admin credentials) */
    signIn: en ? 'Login' : '登入',
    dropdownTrust: en
      ? [
          { label: 'School Status',         to: '/trust-center' },
          { label: 'School Profile',        to: '/school-profile' },
          { label: 'Assessment Proof',      to: '/assessment-proof' },
          { label: 'Graduate Stories',      to: '/graduates' },
          { label: 'Refund Policy',         to: '/refund-policy' },
          { label: 'Leadership & Faculty',  to: '/about' },
        ]
      : [
          { label: '学校状态',       to: '/trust-center' },
          { label: '学校简介',       to: '/school-profile' },
          { label: '评量证据',       to: '/assessment-proof' },
          { label: '毕业生足迹',     to: '/graduates' },
          { label: '退款政策',       to: '/refund-policy' },
          { label: '学校领导与师资', to: '/about' },
        ],
    dropdownAdmission: en
      ? [
          { label: 'New Student Path',       to: '/admission' },
          { label: 'Transfer Path Review',   to: '/transfer-students' },
          { label: 'Tuition & Pricing',      to: '/pricing' },
          { label: 'Book a Consultation',    to: '/consultation' },
          { label: 'Apply Now',              to: '/apply' },
        ]
      : [
          { label: '一般新生路径', to: '/admission' },
          { label: '转学生入学', to: '/transfer-students' },
          { label: '学费与价格', to: '/pricing' },
          { label: '预约咨询',   to: '/consultation' },
          { label: '立即申请',   to: '/apply' },
        ],
    dropdownStudents: en
      ? [
          { label: 'Start Here / Week 1',      to: '/welcome' },
          { label: 'Learn Portal',             to: '/learn' },
          { label: 'Student Login',            to: '/login' },
          { label: 'Lesson Library',           to: '/lessons' },
          { label: 'Student Handbook',         to: '/handbook' },
          { label: 'Academic & Life Support',  to: '/support' },
        ]
      : [
          { label: '第一周开始',     to: '/welcome' },
          { label: '学习入口',       to: '/learn' },
          { label: '学生登入',       to: '/login' },
          { label: '课程库',         to: '/lessons' },
          { label: '学生手册',       to: '/handbook' },
          { label: '学业与生活支持', to: '/support' },
        ],
    dropdownResources: en
      ? [
          { label: 'Parent Dashboard Preview', to: '/parent/demo' },
          { label: 'Weekly Progress Review',   to: '/parent/demo' },
          { label: 'Academic & Life Support',  to: '/support' },
          { label: 'Assessment Proof',         to: '/assessment-proof' },
          { label: 'Tuition & Pricing',        to: '/pricing' },
        ]
      : [
          { label: '家长面板预览',   to: '/parent/demo' },
          { label: '每周进度回顾',   to: '/parent/demo' },
          { label: '学业与生活支持', to: '/support' },
          { label: '评量证据',       to: '/assessment-proof' },
          { label: '学费与价格',     to: '/pricing' },
        ],
  };
}

export function getAuthPageStrings(language) {
  const en = language === 'en';
  return {
    portalTitle: en ? 'Student Learn Portal' : '学生学习入口',
    portalSubtitle: en
      ? 'Open your courses, module work, grades, transcript, and advisor updates in one place.'
      : '登入后查看课程、模块任务、成绩、成绩单与顾问更新。',
    portalEyebrow: en ? 'For enrolled GIIS families' : '已入学家庭入口',
    portalSupportTitle: en ? 'After sign-in, students can:' : '登入后学生可以：',
    portalHighlights: en
      ? [
          'Continue the next active module',
          'Submit assignments and review feedback',
          'Check grades, credits, and transcript progress',
        ]
      : [
          '继续下一项学习模块',
          '提交作业并查看反馈',
          '查看成绩、学分与成绩单进度',
        ],
    portalActivationNote: en
      ? 'Accounts are activated after the enrollment path is reviewed and payment is recorded by the school.'
      : '帐号会在入学路径审核完成、学校记录付款后启用。',
    portalNeedAccess: en ? 'Need access?' : '还没有帐号？',
    portalApplyCta: en ? 'Request path review' : '申请路径审核',
    portalConsultCta: en ? 'Talk to admissions' : '联系招生咨询',
    tabSignIn: en ? 'Sign in' : '登入',
    tabRegister: en ? 'Register' : '注册',
    tablistAria: en ? 'Student and parent sign-in options' : '学生与家长登入选项',
    signInBlurb: en
      ? 'Use the student email and password activated by GIIS after enrollment review.'
      : '请使用 GIIS 在入学审核后启用的学生电子邮件与密码登入。',
    signInCta: en ? 'Sign in' : '登入',
    registerBlurb: en
      ? 'Enter the same information that appears on your official transcript header (name, birth date, guardian, address).'
      : '请填写与正式成绩单抬头一致的资料（姓名、生日、监护人、住址等）。',
    registerRequiredNote: en
      ? 'Fields marked * are required.'
      : '标示 * 为必填。',
    birthDate: en ? 'Birth date' : '生日',
    gender: en ? 'Gender' : '性别',
    genderFemale: en ? 'Female' : '女',
    genderMale: en ? 'Male' : '男',
    parentGuardian: en ? 'Parent / guardian' : '家长／监护人',
    address: en ? 'Street address' : '地址',
    city: en ? 'City' : '城市',
    province: en ? 'State / province' : '州／省',
    zipCode: en ? 'ZIP / postal code' : '邮递区号',
    email: en ? 'Email' : '电子邮件',
    password: en ? 'Password' : '密码',
    displayName: en ? 'Name on transcript' : '成绩单姓名',
    passwordHint: en ? 'At least 8 characters.' : '至少 8 个字元。',
    signingIn: en ? 'Signing in…' : '登入中…',
    signIn: en ? 'Sign in' : '登入',
    creating: en ? 'Creating…' : '建立中…',
    createAccount: en ? 'Create account' : '建立帐号',
    loginFailed: en ? 'Login failed' : '登入失败',
    registerFailed: en ? 'Registration failed' : '注册失败',
    unexpectedLogin: en ? 'Unexpected response from server.' : '伺服器回应异常。',
    unexpectedApiResponse: en
      ? 'The school portal reached the wrong server response. Please try again in a few minutes or contact admissions@genesisideas.school.'
      : '学校入口收到异常的伺服器回应。请稍后再试，或联系 admissions@genesisideas.school。',
    missingApiUrl: en
      ? 'API address is not configured. Set REACT_APP_API_URL, or run npm start (defaults to http://localhost:4000).'
      : '未设定 API 位址。请设定 REACT_APP_API_URL，或使用 npm start（预设 http://localhost:4000）。',
    backHome: en ? 'Back to site' : '返回网站首页',
  };
}

export function getHomeSlogan(language) {
  const en = language === 'en';
  return {
    line: en
      ? 'Empowering the next generation of innovators and thinkers'
      : '培育下一代创新者与思想者',
    cta: en ? 'Learn more' : '了解更多',
  };
}

export function getTestimonialCopy(language) {
  const en = language === 'en';
  return {
    title: en ? 'Testimonials' : '学生感言',
    mobileHint: en ? 'Tap a photo to read their story.' : '点击照片查看感言全文。',
    close: en ? 'Close' : '关闭',
  };
}

export const SEO_DEFAULTS = {
  siteName: 'Genesis of Ideas International School',
  siteUrl: 'https://genesisideas.school/',
  // Use absolute URL for og:image when deployed; logo works as fallback
  ogImage: 'https://genesisideas.school/logo512.png',
  twitterCard: 'summary_large_image',
};
