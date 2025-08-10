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
} from '@react-email/components';

export const subject = 'Your GradeIdea report is ready';

interface ReportReadyEmailProps {
  ideaTitle: string;
  reportUrl: string;
}

export default function ReportReadyEmail({ ideaTitle, reportUrl }: ReportReadyEmailProps) {
  const baseUrl = process.env.APP_BASE_URL || 'https://gradeidea.cc';
  const fullReportUrl = reportUrl.startsWith('http') ? reportUrl : `${baseUrl}${reportUrl}`;
  
  return (
    <Html>
      <Head>
        <title>Your GradeIdea report is ready</title>
      </Head>
      <Body style={main}>
        <Container style={container}>
          <Section style={section}>
            <Heading style={h1}>Your GradeIdea report is ready</Heading>
            
            <Text style={text}>
              Great news! Your idea analysis is complete and ready to review.
            </Text>
            
            <Section style={ideaSection}>
              <Text style={ideaLabel}>Idea:</Text>
              <Text style={ideaTitle}>{ideaTitle}</Text>
            </Section>
            
            <Text style={text}>
              Click the button below to view your comprehensive report:
            </Text>
            
            <Link href={fullReportUrl} style={button}>
              View Report
            </Link>
            
            <Hr style={hr} />
            
            <Text style={footer}>
              Your report includes detailed scoring, market analysis, and actionable insights to help validate your idea.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '560px',
};

const section = {
  padding: '24px',
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  border: '1px solid #e1e5e9',
};

const h1 = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 24px 0',
  textAlign: 'center' as const,
};

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 16px 0',
};

const ideaSection = {
  backgroundColor: '#f9fafb',
  padding: '16px',
  borderRadius: '6px',
  margin: '24px 0',
  border: '1px solid #e5e7eb',
};

const ideaLabel = {
  color: '#6b7280',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0 0 4px 0',
  textTransform: 'uppercase' as const,
};

const ideaTitle = {
  color: '#1f2937',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0',
  lineHeight: '24px',
};

const button = {
  backgroundColor: '#10b981',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 24px',
  margin: '24px 0',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '24px 0',
};

const footer = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0',
  textAlign: 'center' as const,
};
