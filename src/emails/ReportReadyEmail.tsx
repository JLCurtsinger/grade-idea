import React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Link,
  Hr,
  Preview,
} from '@react-email/components';

export const subject = 'Your GradeIdea report is ready';
export const previewText = 'Your analysis is complete—view your personalized report.';

interface ReportReadyEmailProps {
  ideaTitle: string;
  reportUrl: string;
  name?: string;
}

export default function ReportReadyEmail({ ideaTitle, reportUrl, name }: ReportReadyEmailProps) {
  const baseUrl = process.env.APP_BASE_URL || 'https://gradeidea.cc';
  const fullReportUrl = reportUrl.startsWith('http') ? reportUrl : `${baseUrl}${reportUrl}`;
  
  const greeting = name ? `Hey ${name},` : "Hey there,";
  
  return (
    <Html>
      <Head>
        <title>{subject}</title>
      </Head>
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Brand Header */}
          <Section style={headerSection}>
            <Text style={brandText}>GradeIdea</Text>
          </Section>
          
          <Section style={section}>
            <Heading style={h1}>Your report is ready! 📊</Heading>
            
            <Text style={text}>
              {greeting} Great news! Your idea analysis is complete and ready to review.
            </Text>
            
            <Section style={ideaSection}>
              <Text style={ideaLabel}>Your Idea:</Text>
              <Text style={ideaTitleStyle}>{ideaTitle}</Text>
            </Section>
            
            <Text style={text}>
              Click the button below to view your comprehensive report with detailed scoring, market analysis, and actionable insights:
            </Text>
            
            <Link href={fullReportUrl} style={button}>
              View Your Report →
            </Link>
            
            <Hr style={hr} />
            
            <Text style={footer}>
              You received this email because your GradeIdea analysis is complete. 
              <br />
              <Link href={baseUrl} style={footerLink}>
                Back to GradeIdea
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#f8fafc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
  margin: 0,
  padding: 0,
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '600px',
};

const headerSection = {
  padding: '24px 24px 16px',
  textAlign: 'center' as const,
};

const brandText = {
  color: '#10b981',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: 0,
  letterSpacing: '-0.025em',
};

const section = {
  padding: '32px 24px',
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  border: '1px solid #e2e8f0',
  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
  margin: '0 20px',
};

const h1 = {
  color: '#1e293b',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0 0 24px 0',
  textAlign: 'center' as const,
  lineHeight: '1.2',
};

const text = {
  color: '#475569',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 20px 0',
};

const ideaSection = {
  backgroundColor: '#f1f5f9',
  padding: '20px',
  borderRadius: '8px',
  margin: '28px 0',
  border: '1px solid #e2e8f0',
};

const ideaLabel = {
  color: '#64748b',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0 0 8px 0',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
};

const ideaTitleStyle = {
  color: '#1e293b',
  fontSize: '18px',
  fontWeight: '600',
  margin: 0,
  lineHeight: '1.4',
};

const button = {
  backgroundColor: '#10b981',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '16px 32px',
  margin: '32px 0',
  boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)',
};

const hr = {
  borderColor: '#e2e8f0',
  margin: '32px 0',
};

const footer = {
  color: '#64748b',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: 0,
  textAlign: 'center' as const,
};

const footerLink = {
  color: '#10b981',
  textDecoration: 'none',
  fontWeight: '500',
};
