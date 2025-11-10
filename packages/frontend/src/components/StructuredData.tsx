/**
 * JSON-LD Structured Data for SEO
 *
 * Provides rich search results with schema.org markup
 */

import Script from 'next/script';

interface StructuredDataProps {
  locale: string;
}

export function StructuredData({ locale }: StructuredDataProps) {
  const baseUrl = 'https://canadagpt.ca';

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'CanadaGPT',
    url: baseUrl,
    logo: `${baseUrl}/maple-leaf-logo-512.png`,
    description:
      locale === 'fr'
        ? 'Plateforme de responsabilité et transparence du gouvernement canadien avec accès aux données parlementaires, projets de loi, débats et lobbying.'
        : 'Canadian government accountability and transparency platform with access to parliamentary data, bills, debates, and lobbying information.',
    sameAs: [
      'https://twitter.com/CanadaGPT',
      'https://github.com/northernvariables/CanadaGPT',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      availableLanguage: ['English', 'French'],
    },
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'CanadaGPT',
    url: `${baseUrl}/${locale}`,
    description:
      locale === 'fr'
        ? 'Suivez les députés canadiens, les projets de loi fédéraux, les débats parlementaires, les activités de lobbying et les dépenses gouvernementales.'
        : 'Track Canadian MPs, federal bills, parliamentary debates, lobbying activities, and government spending.',
    inLanguage: locale === 'fr' ? 'fr-CA' : 'en-CA',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/${locale}?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  const webApplicationSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'CanadaGPT',
    url: `${baseUrl}/${locale}`,
    applicationCategory: 'GovernmentApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'CAD',
    },
    featureList: [
      locale === 'fr' ? 'Suivi des députés' : 'MP Tracking',
      locale === 'fr' ? 'Projets de loi fédéraux' : 'Federal Bills',
      locale === 'fr' ? 'Débats parlementaires' : 'Parliamentary Debates',
      locale === 'fr' ? 'Registre des lobbyistes' : 'Lobbying Registry',
      locale === 'fr' ? 'Dépenses gouvernementales' : 'Government Spending',
      locale === 'fr' ? 'Analyses alimentées par l\'IA' : 'AI-Powered Insights',
    ],
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: `${baseUrl}/${locale}`,
      },
    ],
  };

  return (
    <>
      <Script
        id="structured-data-organization"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
        }}
      />
      <Script
        id="structured-data-website"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteSchema),
        }}
      />
      <Script
        id="structured-data-webapp"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webApplicationSchema),
        }}
      />
      <Script
        id="structured-data-breadcrumb"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
    </>
  );
}
