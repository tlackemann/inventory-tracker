# Inventory Tracker

Quick and dirty way to track if a product is in stock.

## Usage

Add any desired URLs to the `./urls.json` file. The scraper will check for
a "Buy Now" button on the passed page(s) and send a text message to the
configured participants.

The scraper should be executed on a cronjob.

```bash
yarn start
```

### Example

```javascript
{
  "urls": [
    "https://www.newegg.com/amd-ryzen-9-5950x/p/N82E16819113663"
  ],
}
```
