/** Shared UI copy: English UI uses English only; Chinese UI uses Chinese only. */

export function getNavStrings(language) {
  const en = language === 'en';
  return {
    discovery: en ? 'DISCOVERY' : '发现我们',
    academics: en ? 'ACADEMICS' : '学术',
    admission: en ? 'ADMISSION' : '入学',
    support: en ? 'STUDENT SUPPORT' : '学生支持',
    langToggleAria: en ? 'Switch to Chinese' : 'Switch to English',
    /** Single entry: student portal (admin uses same page with admin credentials) */
    signIn: en ? 'Login' : '登入',
    dropdownDiscovery: en
      ? [
          { label: 'Meet Our School', to: '/discovery' },
          { label: 'Our Mission',     to: '/discovery' },
          { label: 'About Our Faculty', to: '/discovery' },
        ]
      : [
          { label: '认识学校', to: '/discovery' },
          { label: '办学使命', to: '/discovery' },
          { label: '师资介绍', to: '/discovery' },
        ],
    dropdownAcademics: en
      ? [
          { label: 'Course Catalog',           to: '/academics' },
          { label: 'Psychology Pathway',       to: '/pathways/psychology' },
          { label: 'CS & Engineering',         to: '/pathways/cs' },
          { label: 'Business & Marketing',     to: '/pathways/business' },
          { label: 'Economics & Finance',      to: '/pathways/economics' },
        ]
      : [
          { label: '课程目录',       to: '/academics' },
          { label: '心理学路径',     to: '/pathways/psychology' },
          { label: '计算机科学路径', to: '/pathways/cs' },
          { label: '商业与市场营销', to: '/pathways/business' },
          { label: '经济与金融',     to: '/pathways/economics' },
        ],
    dropdownAdmission: en
      ? [
          { label: 'Apply Now',      to: '/admission' },
          { label: 'Tuition & Fees', to: '/admission' },
          { label: 'FAQ',            to: '/admission' },
        ]
      : [
          { label: '立即申请',   to: '/admission' },
          { label: '学费与费用', to: '/admission' },
          { label: '常见问题',   to: '/admission' },
        ],
    dropdownSupport: en
      ? [
          { label: 'Academic Advising', to: '/support' },
          { label: 'Life Counseling',   to: '/support' },
        ]
      : [
          { label: '学业辅导', to: '/support' },
          { label: '生活辅导', to: '/support' },
        ],
  };
}

export function getAuthPageStrings(language) {
  const en = language === 'en';
  return {
    portalTitle: en ? 'Student portal' : '学生专区',
    portalSubtitle: en
      ? 'Sign in or create an account to access your transcript.'
      : '登入或註冊帳号以使用线上成绩单。',
    tabSignIn: en ? 'Sign in' : '登入',
    tabRegister: en ? 'Register' : '註冊',
    tablistAria: en ? 'Sign in or register' : '登入或註冊',
    signInBlurb: en
      ? 'Sign in with the email and password you used when you registered.'
      : '请使用註冊时的电子郵件与密碼登入。',
    signInCta: en ? 'Sign in' : '登入',
    registerBlurb: en
      ? 'Enter the same information that appears on your official transcript header (name, birth date, guardian, address).'
      : '请填写与正式成绩单抬头一致的资料（姓名、生日、監护人、住址等）。',
    registerRequiredNote: en
      ? 'Fields marked * are required.'
      : '标示 * 为必填。',
    birthDate: en ? 'Birth date' : '生日',
    gender: en ? 'Gender' : '性别',
    genderFemale: en ? 'Female' : '女',
    genderMale: en ? 'Male' : '男',
    parentGuardian: en ? 'Parent / guardian' : '家长／監护人',
    address: en ? 'Street address' : '地址',
    city: en ? 'City' : '城市',
    province: en ? 'State / province' : '州／省',
    zipCode: en ? 'ZIP / postal code' : '郵递区号',
    email: en ? 'Email' : '电子郵件',
    password: en ? 'Password' : '密碼',
    displayName: en ? 'Name on transcript' : '成绩单姓名',
    passwordHint: en ? 'At least 8 characters.' : '至少 8 个字元。',
    signingIn: en ? 'Signing in…' : '登入中…',
    signIn: en ? 'Sign in' : '登入',
    creating: en ? 'Creating…' : '建立中…',
    createAccount: en ? 'Create account' : '建立帳号',
    loginFailed: en ? 'Login failed' : '登入失敗',
    registerFailed: en ? 'Registration failed' : '註冊失敗',
    unexpectedLogin: en ? 'Unexpected response from server.' : '伺服器回应異常。',
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
