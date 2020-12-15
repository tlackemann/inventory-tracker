/**
 * Web Scraper & Messanger
 *
 * @format
 */

import * as md5 from 'md5'
import debug from 'debug'
import * as sqlite3 from 'sqlite3'
import { Twilio } from 'twilio'
import { launch, Browser, Page } from 'puppeteer'
import { open } from 'sqlite'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const log = {
  debug: debug('scraper:debug'),
  error: debug('scraper:error'),
  info: debug('scraper:info'),
}

// Initialize Twilio as the messanger
class Messanger {
  private client: Twilio

  constructor() {
    this.client = new Twilio(`${process.env.TWILIO_ACCOUNT_SID}`, `${process.env.TWILIO_AUTH_TOKEN}`)
  }

  send = (body: string) => this.client.messages.create({
    body,
    to: `${process.env.TWILIO_TO_NUMBER}`,
    from: `${process.env.TWILIO_FROM_NUMBER}`,
  })
}

// Initialize the scraper
class Scraper {
  private browser?: Browser

  constructor() {
  }

  scrape = async (url: string): Promise<Page> => {
    if (!this.browser) {
      throw new Error('Browser not instantiated')
    }

    log.info('Scraping %s', url)

    const page = await this.browser.newPage()
    await page.goto(url)
    return page
  }

  check = async (page: Page) => {
    let buyButton = false
    const buttons = await page.$$('button')
    await Promise.all(Array.from(buttons).map(async button => {
      // @ts-ignore
      const addToCart = await button.evaluate(node => node.innerText.toLowerCase().trim() === 'add to cart')

      if (!buyButton && addToCart) {
        buyButton = true
      }
    }))

    const title= await page.title()
    if (buyButton) {
      log.info('"%s" is AVAILABLE', title)
    } else {
      log.debug('"%s" is not available', title)
    }

    // await page.screenshot({path: `screenshots/${Date.now()}-${md5(url)}.png`});

    return buyButton
  }

  start = async () => {
    this.browser = await launch()
  }

  close = () => this.browser?.close()
}

// Start the scraper
async function start() {
  const start = Date.now()

  log.info('Starting ...')

  // open the database
  const db = await open({
    filename: './inventory.db',
    driver: sqlite3.Database
  })
  await db.migrate({
    migrationsPath: './migrations'
  })
  const selectStatement = await db.prepare(
    'SELECT url FROM alerts WHERE url = @url'
  )

  const urls: string[] = JSON.parse(readFileSync(resolve(`${__dirname}`, '..', 'urls.json')).toString())

  log.info('Found %d URLs', urls.length)

  try {
    const messanger = new Messanger()
    const scraper = new Scraper()

    await scraper.start()
    await Promise.all(urls.map(async url => {
      try {
        const page = await scraper.scrape(url)
        const available = await scraper.check(page)
        if (available) {
          const title = await page.title()
          const alerts = await selectStatement.all({ '@url': url })
          if (alerts.length === 0) {
            await db.run(
              'INSERT INTO alerts (url) VALUES (?)',
              url,
            )

            await messanger.send(`"${title}" IS AVAILABLE - ${url}`)
          }
        }
      } catch (e) {
        log.error('Failed to scrape %s', url, e)
      }
    }))
    await scraper.close()

    const totalMs = ((Date.now() - start) / 1000).toFixed(2)
    log.info('Done, took %ds', totalMs)
  } catch (error) {
    log.error('Caught Error')
    log.error(error)
    process.exit(1)
  }
}

start()
