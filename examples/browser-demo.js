import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runBrowserDemo() {
  console.log('🚀 Starting headless Chrome for TimeDuration demo...\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();

    // Enable console logging from the page
    page.on('console', (msg) => {
      const type = msg.type();
      const text = msg.text();

      if (type === 'error') {
        console.log(`❌ ${text}`);
      } else if (type === 'warning') {
        console.log(`⚠️  ${text}`);
      } else {
        console.log(`📝 ${text}`);
      }
    });

    // Listen for errors
    page.on('pageerror', (error) => {
      console.log(`❌ Page error: ${error.message}`);
    });

    // Read and serve the HTML demo file
    const htmlPath = join(__dirname, 'demo.html');
    const htmlContent = readFileSync(htmlPath, 'utf8');

    await page.setContent(htmlContent);

    // Wait for the demo to complete (give it enough time)
    await new Promise((resolve) => setTimeout(resolve, 5000));

    console.log('\n✅ Demo completed successfully!');
    console.log(
      '💡 You can also open examples/demo.html directly in your browser to see the interactive version.'
    );
  } catch (error) {
    console.error('❌ Demo failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the demo
runBrowserDemo().catch(console.error);
