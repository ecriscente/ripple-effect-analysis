import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources: {
      en: {
        translation: {
          "zeitgeistEngine": "The Zeitgeist Engine",
          "subtitle": "A Framework for Predicting Humanity's Next Necessities",
          "home": "Home",
          "dashboard": "Dashboard",
          "logout": "Logout",
          "login": "Login",
          "register": "Register",
          "darkMode": "Dark Mode",
          "lightMode": "Light Mode",
          "enterTechnology": "Enter an emerging technology (e.g., 'Quantum Computing')",
          "analyze": "Analyze",
          "analyzing": "Analyzing...",
          "pleaseEnterTechnology": "Please enter a technology to analyze.",
          "mustBeLoggedInAnalyze": "You must be logged in to analyze.",
          "failedToFetchAnalysis": "Failed to fetch analysis. Please try again.",
          "unknownError": "An unknown error occurred.",
          "analysisFrom": "Analysis from",
          "primaryRipples": "Primary Ripples",
          "secondaryRipples": "Secondary Ripples",
          "synthesis": "Synthesis",
          "copy": "Copy",
          "copied": "Copied!",
          "myAnalyses": "My Analyses",
          "mustBeLoggedInViewAnalyses": "You must be logged in to view your analyses.",
          "failedToFetchAnalyses": "Failed to fetch analyses.",
          "email": "Email",
          "password": "Password",
          "failedToLogin": "Failed to login",
          "invalidEmailOrPassword": "Invalid email or password",
          "emailAlreadyRegistered": "Email already registered",
          "couldNotCreateUser": "Could not create user",
          "failedToRegister": "Failed to register",
          "notAuthorized": "Not authorized to view this analysis",
          "analysisNotFound": "Analysis not found"
        }
      },
      pt: {
        translation: {
          "zeitgeistEngine": "O Motor Zeitgeist",
          "subtitle": "Uma Estrutura para Prever as Próximas Necessidades da Humanidade",
          "home": "Início",
          "dashboard": "Painel",
          "logout": "Sair",
          "login": "Entrar",
          "register": "Registrar",
          "darkMode": "Modo Escuro",
          "lightMode": "Modo Claro",
          "enterTechnology": "Digite uma tecnologia emergente (ex: 'Computação Quântica')",
          "analyze": "Analisar",
          "analyzing": "Analisando...",
          "pleaseEnterTechnology": "Por favor, digite uma tecnologia para analisar.",
          "mustBeLoggedInAnalyze": "Você precisa estar logado para analisar.",
          "failedToFetchAnalysis": "Falha ao buscar análise. Por favor, tente novamente.",
          "unknownError": "Ocorreu um erro desconhecido.",
          "analysisFrom": "Análise de",
          "primaryRipples": "Ondas Primárias",
          "secondaryRipples": "Ondas Secundárias",
          "synthesis": "Síntese",
          "copy": "Copiar",
          "copied": "Copiado!",
          "myAnalyses": "Minhas Análises",
          "mustBeLoggedInViewAnalyses": "Você precisa estar logado para ver suas análises.",
          "failedToFetchAnalyses": "Falha ao buscar análises.",
          "email": "Email",
          "password": "Senha",
          "failedToLogin": "Falha ao entrar",
          "invalidEmailOrPassword": "Email ou senha inválidos",
          "emailAlreadyRegistered": "Email já registrado",
          "couldNotCreateUser": "Não foi possível criar o usuário",
          "failedToRegister": "Falha ao registrar",
          "notAuthorized": "Não autorizado a ver esta análise",
          "analysisNotFound": "Análise não encontrada"
        }
      }
    },
    lng: "en", // default language
    fallbackLng: "en",

    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
