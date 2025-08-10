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

export const subject = 'Welcome to GradeIdea';
export const previewText = 'Let\'s validate your first idea in minutes.';

interface WelcomeEmailProps {
  name?: string;
}

export default function WelcomeEmail({ name }: WelcomeEmailProps) {
  const baseUrl = process.env.APP_BASE_URL || 'https://gradeidea.cc';
  
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
            <Heading style={h1}>Welcome to GradeIdea! 🚀</Heading>
            
            <Text style={text}>
              {greeting} Thanks for joining us! You're now part of a community of entrepreneurs and innovators who validate their ideas with AI-powered insights.
            </Text>
            
            <Text style={text}>
              <strong>What you can do next:</strong>
            </Text>
            
            <Section style={featuresSection}>
              <Text style={featureText}>✨ Validate your first idea (free scan included)</Text>
              <Text style={featureText}>📊 Get detailed scoring and market analysis</Text>
              <Text style={featureText}>💡 Discover actionable insights to improve your idea</Text>
              <Text style={featureText}>🎯 Make data-driven decisions about your business</Text>
            </Section>
            
            <Text style={text}>
              Ready to get started? Your first idea analysis is on us!
            </Text>
            
            <Link href={baseUrl} style={button}>
              Start Your First Analysis →
            </Link>
            
            <Hr style={hr} />
            
            <Text style={footer}>
              You received this email because you signed up for GradeIdea. 
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
  color: '#3b82f6',
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

const featuresSection = {
  backgroundColor: '#f0f9ff',
  padding: '20px',
  borderRadius: '8px',
  margin: '24px 0',
  border: '1px solid #bae6fd',
};

const featureText = {
  color: '#0369a1',
  fontSize: '16px',
  lineHeight: '1.5',
  margin: '0 0 12px 0',
};

const button = {
  backgroundColor: '#3b82f6',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '16px 32px',
  margin: '32px 0',
  boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.2)',
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
  color: '#3b82f6',
  textDecoration: 'none',
  fontWeight: '500',
};
