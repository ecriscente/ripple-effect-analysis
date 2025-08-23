import React from 'react';
import { useTranslation } from 'react-i18next';
import './Contact.css';

const Contact: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="contact-page">
      <div className="contact-container">
        <div className="contact-header">
          <h1>{t('contactPage.title')}</h1>
          <p className="contact-subtitle">{t('contactPage.subtitle')}</p>
        </div>

        <div className="contact-content">
          <div className="contact-card">
            <div className="contact-icon">
              💬
            </div>
            <h2>{t('contactPage.getInTouch')}</h2>
            <p>{t('contactPage.description')}</p>
            
            <div className="contact-methods">
              <div className="contact-method">
                <div className="method-icon">📧</div>
                <div className="method-info">
                  <h3>{t('contactPage.email')}</h3>
                  <a href="mailto:me@erion.dev" className="contact-link">
                    me@erion.dev
                  </a>
                </div>
              </div>
            </div>

            <div className="contact-note">
              <p>{t('contactPage.responseTime')}</p>
            </div>
          </div>

          <div className="contact-faq">
            <h3>{t('contactPage.commonQuestions')}</h3>
            <div className="faq-item">
              <h4>{t('contactPage.faq.question1')}</h4>
              <p>{t('contactPage.faq.answer1')}</p>
            </div>
            <div className="faq-item">
              <h4>{t('contactPage.faq.question2')}</h4>
              <p>{t('contactPage.faq.answer2')}</p>
            </div>
            <div className="faq-item">
              <h4>{t('contactPage.faq.question3')}</h4>
              <p>{t('contactPage.faq.answer3')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;