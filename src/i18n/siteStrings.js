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
    portalTitle: en ? 'Student portal' : '学生专区',
    portalSubtitle: en
      ? 'Sign in or create an account to access your transcript.'
      : '登入或注册帐号以使用线上成绩单。',
    tabSignIn: en ? 'Sign in' : '登入',
    tabRegister: en ? 'Register' : '注册',
    tablistAria: en ? 'Sign in or register' : '登入或注册',
    signInBlurb: en
      ? 'Sign in with the email and password you used when you registered.'
      : '请使用注册时的电子邮件与密码登入。',
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
