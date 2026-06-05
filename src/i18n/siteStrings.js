/** Shared UI copy: English UI uses English only; Chinese UI uses Chinese only. */

export function getNavStrings(language) {
  const en = language === 'en';
  return {
    about:    en ? 'ABOUT'     : '关于我们',
    academics: en ? 'ACADEMICS' : '学术',
    admission: en ? 'ADMISSION' : '入学',
    resources: en ? 'FOR PARENTS' : '家长专区',
    langToggleAria: en ? 'Switch to Chinese' : 'Switch to English',
    /** Single entry: student portal (admin uses same page with admin credentials) */
    signIn: en ? 'Login' : '登入',
    dropdownAbout: en
      ? [
          { label: 'About GIIS',           to: '/discovery#about' },
          { label: 'Mission & Values',     to: '/discovery#mission' },
          { label: 'Leadership & Faculty', to: '/about' },
          { label: 'School Profile (PDF)', to: '/school-profile' },
        ]
      : [
          { label: '关于 GIIS',     to: '/discovery#about' },
          { label: '使命与价值观',   to: '/discovery#mission' },
          { label: '学校领导与师资', to: '/about' },
          { label: '学校简介 (PDF)', to: '/school-profile' },
        ],
    dropdownAdmission: en
      ? [
          { label: 'Admission Overview', to: '/admission' },
          { label: 'Transfer Students',  to: '/transfer-students' },
          { label: 'Tuition & Pricing',  to: '/pricing' },
          { label: 'Apply Now',          to: '/apply' },
        ]
      : [
          { label: '招生概览',   to: '/admission' },
          { label: '转学生入学', to: '/transfer-students' },
          { label: '学费与价格', to: '/pricing' },
          { label: '立即申请',   to: '/apply' },
        ],
    dropdownResources: en
      ? [
          { label: 'Trust Center',             to: '/trust-center' },
          { label: 'Lesson Library',           to: '/lessons' },
          { label: 'Assessment Proof',         to: '/assessment-proof' },
          { label: 'Parent Dashboard Preview', to: '/parent/demo' },
          { label: 'Academic & Life Support',  to: '/support' },
          { label: 'Student Handbook',         to: '/handbook' },
          { label: 'Academic Calendar',        to: '/calendar' },
        ]
      : [
          { label: '信任中心',       to: '/trust-center' },
          { label: '课程库',         to: '/lessons' },
          { label: '评量证据',       to: '/assessment-proof' },
          { label: '家长面板预览',   to: '/parent/demo' },
          { label: '学业与生活支持', to: '/support' },
          { label: '学生与家庭手册', to: '/handbook' },
          { label: '学校日历',       to: '/calendar' },
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
