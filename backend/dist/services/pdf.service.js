"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDFService = void 0;
const puppeteer_1 = __importDefault(require("puppeteer"));
const template_service_1 = __importDefault(require("./template.service"));
const logger_1 = __importDefault(require("../utils/logger"));
const circuit_breaker_1 = require("../utils/circuit-breaker");
class PDFService {
    browserInstance = null;
    browserPromise = null;
    circuitBreaker;
    constructor() {
        this.circuitBreaker = new circuit_breaker_1.CircuitBreaker('PDF-Engine', {
            failureThreshold: 3,
            resetTimeout: 60000, // 1 minute
            successThreshold: 2,
        });
    }
    // Obtenir ou créer une instance de navigateur (réutilisable)
    async getBrowser() {
        if (this.browserInstance && this.browserInstance.isConnected()) {
            return this.browserInstance;
        }
        if (this.browserPromise) {
            return this.browserPromise;
        }
        this.browserPromise = this.launchBrowser();
        this.browserInstance = await this.browserPromise;
        this.browserPromise = null;
        return this.browserInstance;
    }
    // Lancer le navigateur avec configuration optimisée
    async launchBrowser() {
        const launchOptions = {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu',
                '--disable-web-security',
                '--disable-features=IsolateOrigins,site-per-process',
            ],
        };
        // Si PUPPETEER_EXECUTABLE_PATH est défini, utiliser Chrome système
        if (process.env.PUPPETEER_EXECUTABLE_PATH) {
            launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
            logger_1.default.info('Using system Chrome from PUPPETEER_EXECUTABLE_PATH');
        }
        else {
            // Essayer de trouver Chrome dans les emplacements courants
            const fs = require('fs');
            const possiblePaths = [
                '/usr/bin/chromium-browser', // AlmaLinux/RHEL/CentOS
                '/usr/bin/chromium', // Ubuntu/Debian
                '/usr/lib64/chromium-browser/chromium-browser', // AlmaLinux alternative
                '/usr/bin/google-chrome',
                '/usr/bin/google-chrome-stable',
                '/snap/bin/chromium',
            ];
            for (const path of possiblePaths) {
                try {
                    if (fs.existsSync(path)) {
                        launchOptions.executablePath = path;
                        logger_1.default.info(`Using system Chrome from ${path}`);
                        break;
                    }
                }
                catch (e) {
                    // Ignorer
                }
            }
        }
        try {
            const browser = await puppeteer_1.default.launch({
                ...launchOptions,
                headless: 'new', // Utiliser le nouveau mode headless
            });
            logger_1.default.info('Puppeteer browser launched successfully');
            return browser;
        }
        catch (error) {
            logger_1.default.error('Error launching Puppeteer browser', {
                error: error.message,
                executablePath: launchOptions.executablePath,
                stack: error.stack
            });
            // Essayer avec puppeteer-core si disponible
            if (error.message.includes('Could not find Chrome') || error.message.includes('Failed to launch')) {
                const errorMessage = error.message.includes('libpxbackend') || error.message.includes('snap')
                    ? 'Chromium dependencies missing. Please install: sudo apt-get install -y libgconf-2-4 libxss1 libxtst6 libxrandr2 libasound2 libpangocairo-1.0-0 libatk1.0-0 libcairo-gobject2 libgtk-3-0 libgdk-pixbuf2.0-0'
                    : 'Chrome/Chromium not found. Please install Chromium or set PUPPETEER_EXECUTABLE_PATH. On Ubuntu/Debian: sudo apt-get install -y chromium-browser';
                throw new Error(errorMessage);
            }
            throw error;
        }
    }
    // Fermer le navigateur
    async closeBrowser() {
        if (this.browserInstance) {
            try {
                await this.browserInstance.close();
                this.browserInstance = null;
            }
            catch (error) {
                logger_1.default.error('Error closing browser', { error });
            }
        }
    }
    // Générer un PDF depuis HTML
    async generatePDFFromHTML(html, options) {
        let page;
        try {
            const browser = await this.getBrowser();
            page = await browser.newPage();
            // Configuration de la page
            await page.setViewport({ width: 1200, height: 1600 });
            // Désactiver les images si nécessaire (pour performance)
            // await page.setRequestInterception(true);
            // page.on('request', (req) => {
            //   if (req.resourceType() === 'image') {
            //     req.abort();
            //   } else {
            //     req.continue();
            //   }
            // });
            try {
                await page.setContent(html, {
                    waitUntil: 'networkidle0',
                    timeout: 60000 // Augmenter le timeout à 60 secondes
                });
            }
            catch (contentError) {
                logger_1.default.error('Error setting page content', {
                    error: contentError.message,
                    stack: contentError.stack,
                    htmlLength: html?.length,
                    htmlPreview: html?.substring(0, 500)
                });
                throw new Error(`Failed to set page content: ${contentError.message}`);
            }
            let pdf;
            try {
                pdf = await page.pdf({
                    format: options?.format || 'A4',
                    margin: options?.margin || {
                        top: '20mm',
                        right: '15mm',
                        bottom: '20mm',
                        left: '15mm',
                    },
                    printBackground: true,
                    preferCSSPageSize: false,
                });
            }
            catch (pdfError) {
                logger_1.default.error('Error generating PDF buffer', {
                    error: pdfError.message,
                    stack: pdfError.stack
                });
                throw new Error(`Failed to generate PDF: ${pdfError.message}`);
            }
            await page.close();
            return Buffer.from(pdf);
        }
        catch (error) {
            logger_1.default.error('Error generating PDF from HTML', {
                error: error.message,
                stack: error.stack,
                htmlLength: html?.length
            });
            if (page) {
                try {
                    await page.close();
                }
                catch (e) {
                    // Ignorer
                }
            }
            throw error;
        }
    }
    // Générer un PDF de facture
    async generateInvoicePDF(templateId, templateData) {
        return this.circuitBreaker.execute(async () => {
            logger_1.default.debug('Compiling template for PDF', { templateId });
            const html = template_service_1.default.compileTemplate(templateId, templateData);
            logger_1.default.debug('Generating PDF from HTML');
            const pdfBuffer = await this.generatePDFFromHTML(html);
            logger_1.default.info('Invoice PDF generated successfully', {
                templateId,
                invoiceNumber: templateData.invoiceNumber,
                pdfSize: pdfBuffer.length,
            });
            return pdfBuffer;
        }, async (error) => {
            logger_1.default.error('Circuit Breaker: PDF Generation failed', {
                error: error?.message,
                invoiceNumber: templateData.invoiceNumber
            });
            throw new Error(`PDF Generation engine is temporarily unavailable or failed: ${error?.message}`);
        });
    }
}
exports.PDFService = PDFService;
exports.default = new PDFService();
//# sourceMappingURL=pdf.service.js.map