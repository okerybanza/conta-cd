import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import prisma from '../config/database';
import logger from '../utils/logger';
import auditService from '../services/audit.service';
import notificationService from '../services/notification.service';

export class WebhookController {
  /**
   * WhatsApp Cloud API (Meta) - vérification du webhook (challenge)
   * GET /api/v1/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=...&hub.challenge=...
   */
  async whatsappVerify(req: Request, res: Response): Promise<Response> {
    try {
      const mode = req.query['hub.mode'] as string;
      const token = req.query['hub.verify_token'] as string;
      const challenge = req.query['hub.challenge'] as string;

      // Vérifier le mode et le token
      if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
        logger.info('WhatsApp webhook verified successfully');
        return res.status(200).send(challenge);
      } else {
        logger.warn('WhatsApp webhook verification failed', {
          mode,
          tokenProvided: !!token,
          expectedToken: !!process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN,
        });
        return res.status(403).send('Forbidden');
      }
    } catch (error: any) {
      logger.error('Error verifying WhatsApp webhook', { error: error.message });
      return res.status(500).send('Internal Server Error');
    }
  }

  /**
   * WhatsApp Cloud API (Meta) - réception des événements
   * POST /api/v1/webhooks/whatsapp
   *
   * On retourne toujours 200 pour éviter les retries agressifs et on log/trace côté serveur.
   */
  async whatsapp(req: Request, res: Response): Promise<Response> {
    try {
      // Retourner 200 immédiatement pour éviter les retries agressifs côté Meta
      res.status(200).send('OK');

      // 1) Valider la signature du webhook Meta/WhatsApp
      const signatureValid = this.verifyWhatsAppSignature(req);
      if (!signatureValid) {
        logger.warn('WhatsApp webhook rejected due to invalid signature', {
          hasSignature: !!req.headers['x-hub-signature-256'],
          hasSecret: !!process.env.WHATSAPP_APP_SECRET,
        });
        // On ne jette pas d'erreur ici pour ne pas trigger de retry côté Meta,
        // mais on ignore totalement le contenu du webhook.
        return res;
      }

      // 2) Traiter les événements de manière asynchrone
      const webhookData = this.extractWhatsAppWebhook(req.body);

      if (webhookData) {
        logger.info('WhatsApp webhook received', {
          object: webhookData.object,
          entryCount: webhookData.entry?.length || 0,
        });

        // Traiter chaque entrée
        if (webhookData.entry) {
          for (const entry of webhookData.entry) {
            if (entry.changes) {
              for (const change of entry.changes) {
                if (change.value) {
                  // Traiter les messages entrants
                  if (change.value.messages) {
                    for (const message of change.value.messages) {
                      logger.info('WhatsApp message received', {
                        from: message.from,
                        messageId: message.id,
                        type: message.type,
                        timestamp: message.timestamp,
                      });

                      // 3) Logique métier pour les messages entrants
                      await this.handleIncomingWhatsAppMessage(message);
                    }
                  }

                  // Traiter les statuts de messages (delivered, read, etc.)
                  if (change.value.statuses) {
                    for (const status of change.value.statuses) {
                      logger.info('WhatsApp message status update', {
                        messageId: status.id,
                        status: status.status,
                        timestamp: status.timestamp,
                      });

                      // NOTE: Si besoin, on pourra ici mettre à jour le statut
                      // d'envoi de la notification correspondante dans la base.
                    }
                  }
                }
              }
            }
          }
        }
      } else {
        logger.warn('WhatsApp webhook received but no valid data extracted');
      }

      return res;
    } catch (error: any) {
      logger.error('Error processing WhatsApp webhook', { error: error.message });
      // On a déjà retourné 200, donc on ne peut plus modifier la réponse
      return res;
    }
  }

  /**
   * Extraire et valider les données du webhook WhatsApp
   */
  private extractWhatsAppWebhook(body: any): any {
    try {
      // Format attendu de Meta Cloud API
      if (body.object === 'whatsapp_business_account') {
        return body;
      }

      // Autres formats possibles
      return body;
    } catch (error: any) {
      logger.error('Error extracting WhatsApp webhook data', { error: error.message });
      return null;
    }
  }

  /**
   * Valider la signature du webhook Meta/WhatsApp
   *
   * Meta envoie l'en-tête HTTP `X-Hub-Signature-256` au format :
   *   sha256=HEX_DIGEST
   * calculé sur le corps brut avec le WHATSAPP_APP_SECRET.
   *
   * Ici, on utilise JSON.stringify(req.body) comme approximation du corps brut.
   * Pour une conformité parfaite, un middleware body-parser avec conservation du raw body serait nécessaire.
   */
  private verifyWhatsAppSignature(req: Request): boolean {
    const signatureHeader = (req.headers['x-hub-signature-256'] ||
      req.headers['X-Hub-Signature-256']) as string | undefined;
    const appSecret = process.env.WHATSAPP_APP_SECRET;

    if (!signatureHeader || !appSecret) {
      logger.warn('WhatsApp webhook signature or app secret missing', {
        hasSignature: !!signatureHeader,
        hasSecret: !!appSecret,
      });
      return false;
    }

    const [algo, signatureHash] = signatureHeader.split('=');
    if (algo !== 'sha256' || !signatureHash) {
      logger.warn('WhatsApp webhook signature header malformed', {
        signatureHeader,
      });
      return false;
    }

    try {
      const bodyString = JSON.stringify(req.body || {});
      const expectedHash = crypto
        .createHmac('sha256', appSecret)
        .update(bodyString)
        .digest('hex');

      const expectedBuffer = Buffer.from(expectedHash, 'hex');
      const providedBuffer = Buffer.from(signatureHash, 'hex');

      if (expectedBuffer.length !== providedBuffer.length) {
        return false;
      }

      const isValid = crypto.timingSafeEqual(expectedBuffer, providedBuffer);
      if (!isValid) {
        logger.warn('WhatsApp webhook signature validation failed');
      }

      return isValid;
    } catch (error: any) {
      logger.error('Error validating WhatsApp webhook signature', {
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Gérer un message entrant WhatsApp :
   * - Extraire le corps du message
   * - Tenter de retrouver une facture à partir du numéro mentionné
   * - Logger dans l'audit trail si une facture est trouvée
   * - Créer une notification interne pour l'Owner en cas de confirmation de paiement
   */
  private async handleIncomingWhatsAppMessage(message: any): Promise<void> {
    try {
      const body: string | undefined =
        message?.text?.body ||
        (typeof message?.body === 'string' ? message.body : undefined);

      if (!body) {
        return;
      }

      const from = message.from as string | undefined;

      // 1) Tenter de retrouver une facture en analysant le texte du message
      const invoice = await this.findInvoiceFromMessage(body);

      if (invoice) {
        logger.info('WhatsApp message linked to invoice', {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoice_number,
          companyId: invoice.company_id,
        });

        // 2) Logger dans l'audit trail
        await auditService.createLog({
          companyId: invoice.company_id,
          action: 'WHATSAPP_INCOMING_MESSAGE',
          entityType: 'invoice',
          entityId: invoice.id,
          module: 'facturation',
          afterState: {
            messageBody: body,
            whatsappFrom: from,
            whatsappMessageId: message.id,
            whatsappType: message.type,
          },
          changes: {
            whatsapp: {
              messageBody: body,
              from,
              messageId: message.id,
              type: message.type,
            },
          },
          metadata: {
            channel: 'whatsapp',
            direction: 'incoming',
          },
        });

        // 3) Si le message ressemble à une confirmation de paiement,
        // créer une notification interne pour l'Owner de l'entreprise concernée.
        if (this.isPaymentConfirmationMessage(body)) {
          const amountMatch = body.match(/([0-9]+([.,][0-9]+)?)/);
          const amountText = amountMatch ? amountMatch[1] : undefined;

          const title = `Confirmation de paiement WhatsApp - Facture ${invoice.invoice_number}`;
          const notifMessage =
            amountText != null
              ? `Le client a confirmé via WhatsApp le paiement de la facture ${invoice.invoice_number} (montant indiqué: ${amountText}).`
              : `Le client a confirmé via WhatsApp le paiement de la facture ${invoice.invoice_number}.`;

          await notificationService.createInternalNotificationForOwner(
            invoice.company_id,
            title,
            notifMessage,
            {
              relatedType: 'invoice',
              relatedId: invoice.id,
              invoiceNumber: invoice.invoice_number,
              whatsappFrom: from,
              whatsappMessageId: message.id,
              whatsappBody: body,
              source: 'whatsapp_incoming',
            }
          );
        }
      } else {
        logger.info('WhatsApp incoming message not linked to any invoice', {
          from,
          messageId: message.id,
        });
      }
    } catch (error: any) {
      logger.error('Error handling incoming WhatsApp message', {
        error: error.message,
      });
    }
  }

  /**
   * Essayer de retrouver une facture à partir du texte d'un message.
   * On parcourt les "tokens" du message et on cherche une correspondance exacte
   * avec le champ invoice_number.
   */
  private async findInvoiceFromMessage(text: string) {
    const cleaned = text.replace(/\s+/g, ' ');
    const tokens = cleaned.split(/[\s,;:]+/);

    for (const rawToken of tokens) {
      const token = rawToken.replace(/[^0-9A-Za-z\-]/g, '');
      if (!token || token.length < 3) continue;

      try {
        const invoice = await prisma.invoices.findFirst({
          where: {
            invoice_number: token,
          },
        });

        if (invoice) {
          return invoice;
        }
      } catch (error: any) {
        logger.error('Error searching invoice from WhatsApp message', {
          error: error.message,
          token,
        });
      }
    }

    return null;
  }

  /**
   * Heuristique simple pour détecter une confirmation de paiement
   * dans un message texte WhatsApp (français / anglais).
   */
  private isPaymentConfirmationMessage(text: string): boolean {
    const lower = text.toLowerCase();

    const patterns = [
      /j['’]ai pay[eé]/,
      /\bpay[eé]\b/,
      /\bpaiement (effectu[eé]|reçu|recu)\b/,
      /\bpayment (done|received)\b/,
      /\bi have paid\b/,
      /\bpaid\b/,
    ];

    return patterns.some((regex) => regex.test(lower));
  }

  // Autres méthodes webhook (maxicash, paypal, visapay, test) peuvent être ajoutées ici si nécessaire
}

export default new WebhookController();

