#!/bin/bash
# This is only used for testing purposes.

# Pull the MongoDB image
docker pull mongo:latest

# Run MongoDB container
docker run -d --name mongodb-test -p 27017:27017 mongo:latest

# Wait for MongoDB to start
sleep 5

# Create a database and load sample data
docker exec -it mongodb-test mongosh --eval "
  db = db.getSiblingDB('testdb');

  // Users collection
  db.users.insertMany([
    {
      _id: ObjectId(),
      username: 'alice123',
      email: 'alice@example.com',
      age: 28,
      isActive: true,
      registrationDate: new Date('2023-01-15'),
      lastLogin: ISODate('2023-09-30T14:30:00Z'),
      preferences: { theme: 'dark', notifications: true },
      tags: ['developer', 'nodejs'],
      scores: [85, 92, 78, 95]
    },
    {
      _id: ObjectId(),
      username: 'bob456',
      email: 'bob@example.com',
      age: 35,
      isActive: false,
      registrationDate: new Date('2022-11-20'),
      lastLogin: ISODate('2023-08-15T09:45:00Z'),
      preferences: { theme: 'light', notifications: false },
      tags: ['designer', 'ui/ux'],
      scores: [88, 76, 92, 81]
    },
    {
      _id: ObjectId(),
      username: 'charlie789',
      email: 'charlie@example.com',
      age: 42,
      isActive: true,
      registrationDate: new Date('2023-03-05'),
      lastLogin: ISODate('2023-09-28T11:20:00Z'),
      preferences: { theme: 'auto', notifications: true },
      tags: ['manager', 'agile'],
      scores: [91, 88, 95, 87]
    },
    {
      _id: ObjectId(),
      username: 'david101',
      email: 'david@example.com',
      age: 31,
      isActive: true,
      registrationDate: new Date('2023-02-10'),
      lastLogin: ISODate('2023-09-29T16:55:00Z'),
      preferences: { theme: 'dark', notifications: false },
      tags: ['tester', 'qa'],
      scores: [79, 85, 88, 92]
    },
    {
      _id: ObjectId(),
      username: 'eve202',
      email: 'eve@example.com',
      age: 39,
      isActive: true,
      registrationDate: new Date('2022-12-01'),
      lastLogin: ISODate('2023-09-30T10:15:00Z'),
      preferences: { theme: 'light', notifications: true },
      tags: ['devops', 'cloud'],
      scores: [94, 89, 92, 87]
    }
  ]);

  // Products collection
  db.products.insertMany([
    {
      _id: ObjectId(),
      name: 'Smartphone X',
      category: 'Electronics',
      price: 599.99,
      inStock: 50,
      features: ['5G', 'Dual Camera', 'Face ID'],
      dimensions: { width: 7.5, height: 15.0, depth: 0.8 },
      releaseDate: new Date('2023-05-15'),
      ratings: [4.5, 4.8, 4.2, 4.6, 4.7]
    },
    {
      _id: ObjectId(),
      name: 'Laptop Pro',
      category: 'Electronics',
      price: 1299.99,
      inStock: 25,
      features: ['16GB RAM', 'SSD', 'Retina Display'],
      dimensions: { width: 30.41, height: 21.24, depth: 1.56 },
      releaseDate: new Date('2023-03-10'),
      ratings: [4.8, 4.9, 4.7, 4.8, 4.6]
    },
    {
      _id: ObjectId(),
      name: 'Wireless Earbuds',
      category: 'Audio',
      price: 129.99,
      inStock: 100,
      features: ['Noise Cancelling', 'Waterproof', 'Long Battery Life'],
      dimensions: { width: 2.1, height: 1.8, depth: 2.5 },
      releaseDate: new Date('2023-01-20'),
      ratings: [4.3, 4.5, 4.4, 4.2, 4.6]
    },
    {
      _id: ObjectId(),
      name: 'Smart Watch',
      category: 'Wearables',
      price: 249.99,
      inStock: 75,
      features: ['Heart Rate Monitor', 'GPS', 'Water Resistant'],
      dimensions: { width: 3.4, height: 4.4, depth: 1.3 },
      releaseDate: new Date('2023-04-05'),
      ratings: [4.4, 4.6, 4.3, 4.5, 4.7]
    },
    {
      _id: ObjectId(),
      name: 'Ultra HD TV',
      category: 'Electronics',
      price: 799.99,
      inStock: 30,
      features: ['4K', 'Smart TV', 'HDR'],
      dimensions: { width: 122.0, height: 71.0, depth: 6.4 },
      releaseDate: new Date('2023-02-28'),
      ratings: [4.7, 4.8, 4.6, 4.9, 4.7]
    }
  ]);

  // Orders collection
  db.orders.insertMany([
    {
      _id: ObjectId(),
      userId: ObjectId(),
      orderDate: new Date('2023-09-15'),
      status: 'Shipped',
      totalAmount: '729.98',
      items: [
        { productId: ObjectId(), quantity: 1, price: '599.99' },
        { productId: ObjectId(), quantity: 1, price: '129.99' }
      ],
      shippingAddress: {
        street: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zipCode: '12345'
      },
      paymentMethod: 'Credit Card',
      lastFourDigits: '1234'
    },
    {
      _id: ObjectId(),
      userId: ObjectId(),
      orderDate: new Date('2023-09-20'),
      status: 'Processing',
      totalAmount: '1299.99',
      items: [
        { productId: ObjectId(), quantity: 1, price: '1299.99' }
      ],
      shippingAddress: {
        street: '456 Elm St',
        city: 'Another Town',
        state: 'NY',
        zipCode: '67890'
      },
      paymentMethod: 'PayPal',
      paypalTransactionId: 'PAY-1234567890ABCDEF'
    },
    {
      _id: ObjectId(),
      userId: ObjectId(),
      orderDate: new Date('2023-09-25'),
      status: 'Delivered',
      totalAmount: '379.98',
      items: [
        { productId: ObjectId(), quantity: 1, price: 249.99 },
        { productId: ObjectId(), quantity: 1, price: 129.99 }
      ],
      shippingAddress: {
        street: '789 Oak St',
        city: 'Somewhere',
        state: 'TX',
        zipCode: '54321'
      },
      paymentMethod: 'Credit Card',
      lastFourDigits: '5678'
    },
    {
      _id: ObjectId(),
      userId: ObjectId(),
      orderDate: new Date('2023-09-30'),
      status: 'Pending',
      totalAmount: '799.99',
      items: [
        { productId: ObjectId(), quantity: 1, price: 799.99 }
      ],
      shippingAddress: {
        street: '321 Pine St',
        city: 'Elsewhere',
        state: 'FL',
        zipCode: '98765'
      },
      paymentMethod: 'Bank Transfer',
      bankTransactionId: 'BT-9876543210'
    }
  ]);

  print('Sample data loaded successfully');
"

echo "MongoDB is running and sample data is loaded."
