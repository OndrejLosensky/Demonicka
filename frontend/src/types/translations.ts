export interface LandingTranslations {
  hero: {
    title: string;
    subtitle: string;
    getStarted: string;
    learnMore: string;
  };
  features: {
    title: string;
    description: string;
    list: {
      title: string;
      items: string[];
    };
  };
  stats: {
    totalBeers: string;
    activeParticipants: string;
    activeBarrels: string;
  };
  topParticipants: {
    title: string;
    beers: string;
  };
}

export interface AuthTranslations {
  login: {
    title: string;
    subtitle: string;
    usernameOrEmail: string;
    password: string;
    signIn: string;
    signingIn: string;
    noAccount: string;
  };
  register: {
    title: string;
    subtitle: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    confirmPassword: string;
    signUp: string;
    signingUp: string;
    haveAccount: string;
  };
}

export interface ProfileTranslations {
  title: string;
  accountInfo: string;
  fields: {
    username: string;
    email: string;
    fullName: string;
    userId: string;
    accountCreated: string;
    lastUpdated: string;
  };
  preferences: {
    title: string;
    tabs: {
      appearance: string;
      notifications: string;
      language: string;
    };
    theme: {
      label: string;
      light: string;
      dark: string;
      system: string;
    };
    display: {
      compactMode: string;
      showAvatars: string;
      highContrast: string;
    };
    notifications: {
      email: string;
      push: string;
      updates: string;
    };
    language: {
      label: string;
      cs: string;
      en: string;
      sk: string;
    };
  };
} 