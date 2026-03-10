#!/usr/bin/env ts-node
/**
 * Script pour configurer les logos du branding depuis le dossier Logo
 * 
 * Usage:
 *   npm run setup:branding-logos
 *   ou
 *   npx tsx backend/scripts/setup-branding-logos.ts
 */

import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../src/config/database';
import env from '../src/config/env';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const setupBrandingLogos = async () => {
  console.log('🎨 Configuration des logos du branding\n');

  const logoSourceDir = path.join(__dirname, '../../Logo');
  const logoDestDir = path.join(__dirname, '../../uploads/logos');

  // Vérifier que le dossier Logo existe
  if (!fs.existsSync(logoSourceDir)) {
    console.error('❌ Le dossier Logo n\'existe pas:', logoSourceDir);
    process.exit(1);
  }

  // Créer le dossier de destination s'il n'existe pas
  if (!fs.existsSync(logoDestDir)) {
    fs.mkdirSync(logoDestDir, { recursive: true });
    console.log('✅ Dossier uploads/logos créé');
  }

  // Mapper les fichiers source vers les noms de destination
  const logoFiles = [
    {
      source: 'Logo-couleur.png',
      dest: 'logo-color.png',
      type: 'logoUrl' as const,
      description: 'Logo en couleur (principal)',
    },
    {
      source: 'Logo-white.png',
      dest: 'logo-white.png',
      type: 'logoWhiteUrl' as const, // Variante blanche
      description: 'Logo blanc (pour backgrounds colorés)',
    },
    {
      source: 'Icon.png',
      dest: 'icon-color.png',
      type: 'faviconUrl' as const,
      description: 'Icône en couleur (favicon)',
    },
    {
      source: 'Icon-white.png',
      dest: 'icon-white.png',
      type: 'iconWhiteUrl' as const, // Variante blanche
      description: 'Icône blanche (pour backgrounds colorés)',
    },
  ];

  const copiedFiles: { [key: string]: string } = {};
  const errors: string[] = [];

  console.log('📋 Fichiers à copier :\n');
  logoFiles.forEach((file) => {
    console.log(`  - ${file.source} → ${file.dest} (${file.description})`);
  });
  console.log('');

  // Copier les fichiers
  for (const file of logoFiles) {
    const sourcePath = path.join(logoSourceDir, file.source);
    const destPath = path.join(logoDestDir, file.dest);

    try {
      if (!fs.existsSync(sourcePath)) {
        console.warn(`⚠️  Fichier source non trouvé: ${file.source}`);
        errors.push(`Fichier manquant: ${file.source}`);
        continue;
      }

      // Copier le fichier
      fs.copyFileSync(sourcePath, destPath);
      console.log(`✅ ${file.source} copié → ${file.dest}`);

      // Construire l'URL relative (accessible via l'API)
      const relativeUrl = `/uploads/logos/${file.dest}`;
      copiedFiles[file.type] = relativeUrl;
    } catch (error: any) {
      console.error(`❌ Erreur lors de la copie de ${file.source}:`, error.message);
      errors.push(`Erreur copie ${file.source}: ${error.message}`);
    }
  }

  if (errors.length > 0) {
    console.log('\n⚠️  Erreurs rencontrées :');
    errors.forEach((error) => console.log(`  - ${error}`));
  }

  // Mettre à jour le branding dans la base de données
  console.log('\n💾 Mise à jour du branding dans la base de données...\n');

  try {
    // Vérifier si un branding existe déjà
    let branding = await prisma.platformBranding.findFirst();

    const brandingData: any = {
      logoUrl: copiedFiles.logoUrl || null, // Logo principal en couleur
      faviconUrl: copiedFiles.faviconUrl || null, // Favicon en couleur
      emailLogoUrl: copiedFiles.logoUrl || null, // Logo pour les emails (couleur par défaut)
      pdfLogoUrl: copiedFiles.logoUrl || null, // Logo pour les PDFs (couleur par défaut)
      // Les variantes blanches sont stockées dans les métadonnées ou accessibles via le système de fichiers
    };

    if (branding) {
      // Mettre à jour le branding existant
      branding = await prisma.platformBranding.update({
        where: { id: branding.id },
        data: brandingData,
      });
      console.log('✅ Branding mis à jour');
    } else {
      // Créer un nouveau branding
      branding = await prisma.platformBranding.create({
        data: {
          ...brandingData,
          primaryColor: '#0D3B66',
          backgroundColor: '#FFFFFF',
          primaryFont: 'Arial, sans-serif',
          theme: 'light',
        },
      });
      console.log('✅ Branding créé');
    }

    console.log('\n📊 Configuration du branding :');
    console.log(`   Logo principal: ${branding.logoUrl || 'Non défini'}`);
    console.log(`   Favicon: ${branding.faviconUrl || 'Non défini'}`);
    console.log(`   Logo email: ${branding.emailLogoUrl || 'Non défini'}`);
    console.log(`   Logo PDF: ${branding.pdfLogoUrl || 'Non défini'}`);

    // Note sur les variantes blanches
    console.log('\n💡 Note :');
    console.log('   Les logos blancs sont disponibles dans uploads/logos/');
    console.log('   Vous pouvez les utiliser manuellement pour les backgrounds colorés.');
    console.log('   - logo-white.png : Logo blanc');
    console.log('   - icon-white.png : Icône blanche');

    console.log('\n✅ Script terminé avec succès !');
  } catch (error: any) {
    console.error('\n❌ Erreur lors de la mise à jour du branding:', error.message);
    if (error.code) {
      console.error('   Code:', error.code);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};

setupBrandingLogos();

