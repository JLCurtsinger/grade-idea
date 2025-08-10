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

export const subject = 'Thanks! Your tokens are available';
export const previewText = 'Your GradeIdea token purchase is confirmed.';

interface TokenConfirmationEmailProps {
  tokensAdded: number;
  name?: string;
}

export default function TokenConfirmationEmail({ tokensAdded, name }: TokenConfirmationEmailProps) {
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
            <Heading style={h1}>Tokens added to your account! 🎉</Heading>
            
            <Text style={text}>
              {greeting} Thank you for your purchase! Your tokens have been successfully added to your GradeIdea account.
            </Text>
            
            <Section style={tokenSection}>
              <Text style={tokenLabel}>Tokens Added:</Text>
              <Text style={tokenAmount}>{tokensAdded}</Text>
            </Section>
            
            <Text style={text}>
              You're now ready to analyze and grade your ideas with our AI-powered platform. Each idea analysis uses 1 token.
            </Text>
            
            <Link href={`${baseUrl}/dashboard`} style={button}>
              Start Grading Ideas →
            </Link>
            
            <Hr style={hr} />
            
            <Text style={footer}>
              You received this email because you purchased GradeIdea tokens. 
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
  color: '#8b5cf6',
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

const tokenSection = {
  backgroundColor: '#faf5ff',
  padding: '24px',
  borderRadius: '12px',
  margin: '28px 0',
  border: '2px solid #e9d5ff',
  textAlign: 'center' as const,
};

const tokenLabel = {
  color: '#7c3aed',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0 0 12px 0',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
};

const tokenAmount = {
  color: '#7c3aed',
  fontSize: '36px',
  fontWeight: 'bold',
  margin: 0,
  lineHeight: '1',
};

const button = {
  backgroundColor: '#8b5cf6',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '16px 32px',
  margin: '32px 0',
  boxShadow: '0 4px 6px -1px rgba(139, 92, 246, 0.2)',
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
  color: '#8b5cf6',
  textDecoration: 'none',
  fontWeight: '500',
};
