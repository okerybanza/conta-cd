/**
 * Script de validation des calculs et statuts
 * Vérifie que les calculs sont corrects et que les statuts sont mis à jour
 */

import prisma from '../backend/src/config/database';
import { Decimal } from '@prisma/client/runtime/library';

interface ValidationResult {
  success: boolean;
  message: string;
  details?: any;
}

class ValidationService {
  /**
   * Valider les calculs d'une facture
   */
  async validateInvoiceCalculations(invoiceId: string): Promise<ValidationResult> {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { lines: true },
    });

    if (!invoice) {
      return { success: false, message: 'Facture non trouvée' };
    }

    // Calculer le sous-total HT
    let calculatedSubtotal = 0;
    let calculatedTax = 0;

    for (const line of invoice.lines) {
      const lineSubtotal = Number(line.quantity) * Number(line.unitPrice);
      const lineTax = lineSubtotal * (Number(line.taxRate || 0) / 100);
      calculatedSubtotal += lineSubtotal;
      calculatedTax += lineTax;
    }

    // Ajouter les frais additionnels
    const transportFees = Number(invoice.transportFees || 0);
    const platformFees = Number(invoice.platformFees || 0);
    const calculatedTotal = calculatedSubtotal + calculatedTax + transportFees + platformFees;

    // Comparer avec les valeurs en base
    const storedSubtotal = Number(invoice.subtotal);
    const storedTax = Number(invoice.taxAmount);
    const storedTotal = Number(invoice.totalAmount);

    const errors: string[] = [];

    if (Math.abs(calculatedSubtotal - storedSubtotal) > 0.01) {
      errors.push(`Sous-total HT incorrect: calculé=${calculatedSubtotal}, stocké=${storedSubtotal}`);
    }

    if (Math.abs(calculatedTax - storedTax) > 0.01) {
      errors.push(`TVA incorrecte: calculée=${calculatedTax}, stockée=${storedTax}`);
    }

    if (Math.abs(calculatedTotal - storedTotal) > 0.01) {
      errors.push(`Total TTC incorrect: calculé=${calculatedTotal}, stocké=${storedTotal}`);
    }

    // Vérifier le statut par rapport aux paiements
    const payments = await prisma.payment.findMany({
      where: {
        invoiceId: invoice.id,
        status: 'confirmed',
        deletedAt: null,
      },
    });

    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const remainingBalance = storedTotal - totalPaid;

    let statusValid = true;
    if (remainingBalance <= 0 && invoice.status !== 'paid') {
      statusValid = false;
      errors.push(`Statut devrait être 'paid' (solde restant: ${remainingBalance})`);
    } else if (totalPaid > 0 && remainingBalance > 0 && invoice.status !== 'partially_paid') {
      statusValid = false;
      errors.push(`Statut devrait être 'partially_paid' (payé: ${totalPaid}, restant: ${remainingBalance})`);
    }

    if (errors.length > 0) {
      return {
        success: false,
        message: 'Erreurs de validation détectées',
        details: {
          invoiceNumber: invoice.invoiceNumber,
          errors,
          calculated: {
            subtotal: calculatedSubtotal,
            tax: calculatedTax,
            total: calculatedTotal,
          },
          stored: {
            subtotal: storedSubtotal,
            tax: storedTax,
            total: storedTotal,
          },
          payments: {
            totalPaid,
            remainingBalance,
            expectedStatus: remainingBalance <= 0 ? 'paid' : totalPaid > 0 ? 'partially_paid' : invoice.status,
          },
        },
      };
    }

    return {
      success: true,
      message: 'Calculs et statut corrects',
      details: {
        invoiceNumber: invoice.invoiceNumber,
        calculated: {
          subtotal: calculatedSubtotal,
          tax: calculatedTax,
          total: calculatedTotal,
        },
        payments: {
          totalPaid,
          remainingBalance,
          status: invoice.status,
        },
      },
    };
  }

  /**
   * Valider les calculs d'une dépense
   */
  async validateExpenseCalculations(expenseId: string): Promise<ValidationResult> {
    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
    });

    if (!expense) {
      return { success: false, message: 'Dépense non trouvée' };
    }

    const amountHt = Number(expense.amountHt || expense.amount || 0);
    const taxRate = Number(expense.taxRate || 0);
    const calculatedTax = amountHt * (taxRate / 100);
    const calculatedTotal = amountHt + calculatedTax;

    const storedTax = Number(expense.taxAmount);
    const storedTotal = Number(expense.totalAmount || expense.amountTtc || 0);

    const errors: string[] = [];

    if (Math.abs(calculatedTax - storedTax) > 0.01) {
      errors.push(`TVA incorrecte: calculée=${calculatedTax}, stockée=${storedTax}`);
    }

    if (Math.abs(calculatedTotal - storedTotal) > 0.01) {
      errors.push(`Total TTC incorrect: calculé=${calculatedTotal}, stocké=${storedTotal}`);
    }

    // Vérifier la cohérence entre amount/amountHt et totalAmount/amountTtc
    if (Math.abs(amountHt - Number(expense.amount)) > 0.01) {
      errors.push(`Incohérence amount/amountHt: amount=${expense.amount}, amountHt=${expense.amountHt}`);
    }

    if (Math.abs(calculatedTotal - Number(expense.totalAmount)) > 0.01 && expense.amountTtc) {
      if (Math.abs(calculatedTotal - Number(expense.amountTtc)) > 0.01) {
        errors.push(`Incohérence totalAmount/amountTtc: totalAmount=${expense.totalAmount}, amountTtc=${expense.amountTtc}`);
      }
    }

    if (errors.length > 0) {
      return {
        success: false,
        message: 'Erreurs de validation détectées',
        details: {
          expenseNumber: expense.expenseNumber,
          errors,
          calculated: {
            tax: calculatedTax,
            total: calculatedTotal,
          },
          stored: {
            tax: storedTax,
            total: storedTotal,
          },
        },
      };
    }

    return {
      success: true,
      message: 'Calculs corrects',
      details: {
        expenseNumber: expense.expenseNumber,
        calculated: {
          tax: calculatedTax,
          total: calculatedTotal,
        },
      },
    };
  }

  /**
   * Valider toutes les factures d'une entreprise
   */
  async validateAllInvoices(companyId: string): Promise<{
    total: number;
    valid: number;
    invalid: number;
    results: ValidationResult[];
  }> {
    const invoices = await prisma.invoice.findMany({
      where: {
        companyId,
        deletedAt: null,
      },
      select: { id: true },
    });

    const results: ValidationResult[] = [];

    for (const invoice of invoices) {
      const result = await this.validateInvoiceCalculations(invoice.id);
      results.push(result);
    }

    const valid = results.filter((r) => r.success).length;
    const invalid = results.filter((r) => !r.success).length;

    return {
      total: invoices.length,
      valid,
      invalid,
      results,
    };
  }

  /**
   * Valider toutes les dépenses d'une entreprise
   */
  async validateAllExpenses(companyId: string): Promise<{
    total: number;
    valid: number;
    invalid: number;
    results: ValidationResult[];
  }> {
    const expenses = await prisma.expense.findMany({
      where: {
        companyId,
        deletedAt: null,
      },
      select: { id: true },
    });

    const results: ValidationResult[] = [];

    for (const expense of expenses) {
      const result = await this.validateExpenseCalculations(expense.id);
      results.push(result);
    }

    const valid = results.filter((r) => r.success).length;
    const invalid = results.filter((r) => !r.success).length;

    return {
      total: expenses.length,
      valid,
      invalid,
      results,
    };
  }
}

// Script exécutable
async function main() {
  const validationService = new ValidationService();

  // Récupérer la première entreprise pour les tests
  const company = await prisma.company.findFirst({
    select: { id: true, name: true },
  });

  if (!company) {
    console.log('Aucune entreprise trouvée');
    process.exit(1);
  }

  console.log(`\n🔍 Validation des calculs pour l'entreprise: ${company.name}\n`);

  // Valider les factures
  console.log('📄 Validation des factures...');
  const invoiceResults = await validationService.validateAllInvoices(company.id);
  console.log(`   Total: ${invoiceResults.total}`);
  console.log(`   ✅ Valides: ${invoiceResults.valid}`);
  console.log(`   ❌ Invalides: ${invoiceResults.invalid}`);

  if (invoiceResults.invalid > 0) {
    console.log('\n   Détails des erreurs:');
    invoiceResults.results
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(`   - ${r.details?.invoiceNumber || 'N/A'}: ${r.message}`);
        if (r.details?.errors) {
          r.details.errors.forEach((error: string) => {
            console.log(`     • ${error}`);
          });
        }
      });
  }

  // Valider les dépenses
  console.log('\n💰 Validation des dépenses...');
  const expenseResults = await validationService.validateAllExpenses(company.id);
  console.log(`   Total: ${expenseResults.total}`);
  console.log(`   ✅ Valides: ${expenseResults.valid}`);
  console.log(`   ❌ Invalides: ${expenseResults.invalid}`);

  if (expenseResults.invalid > 0) {
    console.log('\n   Détails des erreurs:');
    expenseResults.results
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(`   - ${r.details?.expenseNumber || 'N/A'}: ${r.message}`);
        if (r.details?.errors) {
          r.details.errors.forEach((error: string) => {
            console.log(`     • ${error}`);
          });
        }
      });
  }

  console.log('\n✅ Validation terminée\n');

  await prisma.$disconnect();
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Erreur:', error);
    process.exit(1);
  });
}

export default ValidationService;

