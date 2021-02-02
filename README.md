# Inventory Tracker

Quick and dirty way to track if a product is in stock.

## Usage

The scraper should be executed on a cronjob.

```bash
DEBUG=scraper* yarn start
```

### Configuration

Copy the sample `.env.example` file to `.env` and fill in the missing credentials for Twilio.

#### URLs

Add any desired URLs to the `./urls.json` file. The scraper will check for
a "Buy Now" button on the passed page(s) and send a text message to the
configured participants.

#### Example

```javascript
{
  "urls": [
    "https://www.newegg.com/amd-ryzen-9-5950x/p/N82E16819113663"
  ],
}
```
