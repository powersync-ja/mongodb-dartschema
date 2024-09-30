# MongoDB Schema to Dart Schema

This repo provides a method to generate Dart Schema from MongoDb

## How to generate schema

* Install [pnpm](https://pnpm.io/installation)
* Run `pnpm i` to install dependencies
* Run `cp .env.template .env` to create a .env file
* Populate `.env` file with your MongoDB `URL` and `DB_NAME`
* Copy your sync rules to `sync-rules.yaml`
* Run `pnpm generateSchema`

You should see output similar to the following:

```dart
Schema([
  Table('products', [
    Column.text('_id'),
    Column.text('name'),
    Column.text('category'),
    Column.real('price'),
    Column.integer('inStock'),
    Column.text('features'),
    Column.text('dimensions'),
    Column.text('releaseDate'),
    Column.text('ratings')
  ]),
...
]);
```

### Known Limitations

* This has only been minimally tested and therefore the output should be reviewed to confirm correctness.
* This only works for Dart Schema at present.
* None of the code has been optimized for performance.
* `NumberDecimals` are converted to `text` and need to be manually adjusted to `real`.

### How to test

This assumes you have [Docker](https://www.docker.com/products/docker-desktop/) installed and running:

* Run `pnpm i`
* `cp .env.template .env`
* Run `./setup_mongodb.sh`
* Run `pnpm generateSchema`

You should see the following output:

```dart
Schema([
  Table('products', [
    Column.text('_id'),
    Column.text('name'),
    Column.text('category'),
    Column.real('price'),
    Column.integer('inStock'),
    Column.text('features'),
    Column.text('dimensions'),
    Column.text('releaseDate'),
    Column.text('ratings')
  ]),
  Table('users', [
    Column.text('_id'),
    Column.text('username'),
    Column.text('email'),
    Column.integer('age'),
    Column.integer('isActive'),
    Column.text('registrationDate'),
    Column.text('lastLogin'),
    Column.text('preferences'),
    Column.text('tags'),
    Column.text('scores')
  ]),
  Table('orders', [
    Column.text('_id'),
    Column.text('userId'),
    Column.text('orderDate'),
    Column.text('status'),
    Column.text('totalAmount'),
    Column.text('items'),
    Column.text('shippingAddress'),
    Column.text('paymentMethod'),
    Column.text('paypalTransactionId'),
    Column.text('bankTransactionId'),
    Column.text('lastFourDigits')
  ])
]);
```

### How it works

* Collections are used to generate table names.
* Collection documents are sampled to generate the table columns. Number of documents sampled is based on SAMPLE_SIZE_INT set in `.env` file.
* Sync rules are used to filter out tables generated from collections that are not required.
