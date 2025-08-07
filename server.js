const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'crown_watch_secret_key_2024';

// Security middleware
app.use(helmet());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Serve static files
app.use(express.static('.'));

// Database setup
const db = new sqlite3.Database('./crown_watch.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    initDatabase();
  }
});

// Initialize database tables
function initDatabase() {
  const tables = [
    // Users table
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      role TEXT DEFAULT 'customer',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // Products table
    `CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      brand TEXT NOT NULL,
      description TEXT,
      price DECIMAL(10,2) NOT NULL,
      image_url TEXT,
      category TEXT,
      stock_quantity INTEGER DEFAULT 0,
      is_featured BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // Orders table
    `CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      order_number TEXT UNIQUE NOT NULL,
      total_amount DECIMAL(10,2) NOT NULL,
      status TEXT DEFAULT 'pending',
      shipping_address TEXT,
      payment_status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`,

    // Order items table
    `CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER,
      product_id INTEGER,
      quantity INTEGER NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders (id),
      FOREIGN KEY (product_id) REFERENCES products (id)
    )`,

    // Cart table
    `CREATE TABLE IF NOT EXISTS cart (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      product_id INTEGER,
      quantity INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (product_id) REFERENCES products (id)
    )`,

    // Newsletter subscriptions table
    `CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  ];

  // Create tables sequentially
  let tableIndex = 0;
  function createNextTable() {
    if (tableIndex >= tables.length) {
      console.log('All tables created successfully');
      insertSampleData();
      return;
    }

    db.run(tables[tableIndex], (err) => {
      if (err) {
        console.error(`Error creating table ${tableIndex}:`, err.message);
      } else {
        console.log(`Table ${tableIndex + 1}/${tables.length} created`);
      }
      tableIndex++;
      createNextTable();
    });
  }

  createNextTable();
}

// Insert sample product data
function insertSampleData() {
  // Add a small delay to ensure tables are created
  setTimeout(() => {
    const sampleProducts = [
      {
        name: 'Casio Edifice',
        brand: 'Casio',
        description: 'Premium sports chronograph with solar power and sapphire crystal',
        price: 299.99,
        image_url: '/images/MTP-1375SG-9AV.png',
        category: 'Sports',
        stock_quantity: 15,
        is_featured: 1
      },
      {
        name: 'Casio Vintage',
        brand: 'Casio',
        description: 'Classic retro digital watch with authentic vintage styling',
        price: 89.99,
        image_url: '/images/MTP-1375D-7AF.png',
        category: 'Digital',
        stock_quantity: 25,
        is_featured: 1
      },
      {
        name: 'Rado Ceramic Watch',
        brand: 'Rado',
        description: 'Luxury ceramic watch with scratch-resistant design',
        price: 1299.99,
        image_url: '/images/MTP-1375HRG-1AV_01.png',
        category: 'Luxury',
        stock_quantity: 8,
        is_featured: 1
      },
      {
        name: 'Citizen TSUYOSA',
        brand: 'Citizen',
        description: 'Automatic movement with 40-hour power reserve',
        price: 459.99,
        image_url: '/images/casio edifice .png',
        category: 'Automatic',
        stock_quantity: 12,
        is_featured: 1
      }
    ];

    // Check if products already exist
    db.get("SELECT COUNT(*) as count FROM products", (err, row) => {
      if (err) {
        console.error('Error checking products:', err);
      } else if (row.count === 0) {
        // Insert sample products
        const stmt = db.prepare(`INSERT INTO products (name, brand, description, price, image_url, category, stock_quantity, is_featured) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
        
        sampleProducts.forEach(product => {
          stmt.run(product.name, product.brand, product.description, product.price, product.image_url, product.category, product.stock_quantity, product.is_featured);
        });
        
        stmt.finalize();
        console.log('Sample products inserted successfully');
      } else {
        console.log('Products already exist in database');
      }
    });
  }, 1000);
}

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
}

// API Routes

// User registration
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.run(
      `INSERT INTO users (email, password, first_name, last_name) VALUES (?, ?, ?, ?)`,
      [email, hashedPassword, firstName, lastName],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Email already registered' });
          }
          return res.status(500).json({ error: 'Registration failed' });
        }
        
        const token = jwt.sign({ userId: this.lastID, email }, JWT_SECRET, { expiresIn: '24h' });
        res.status(201).json({ message: 'User registered successfully', token, userId: this.lastID });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

// User login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    db.get(
      `SELECT * FROM users WHERE email = ?`,
      [email],
      async (err, user) => {
        if (err) {
          return res.status(500).json({ error: 'Login failed' });
        }
        
        if (!user) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ message: 'Login successful', token, userId: user.id });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get all products
app.get('/api/products', (req, res) => {
  const { category, brand, search, limit = 50 } = req.query;
  let query = `SELECT * FROM products WHERE 1=1`;
  const params = [];

  if (category) {
    query += ` AND category = ?`;
    params.push(category);
  }

  if (brand) {
    query += ` AND brand = ?`;
    params.push(brand);
  }

  if (search) {
    query += ` AND (name LIKE ? OR description LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ` ORDER BY created_at DESC LIMIT ?`;
  params.push(parseInt(limit));

  db.all(query, params, (err, products) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch products' });
    }
    res.json(products);
  });
});

// Get single product
app.get('/api/products/:id', (req, res) => {
  const productId = req.params.id;
  
  db.get(`SELECT * FROM products WHERE id = ?`, [productId], (err, product) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch product' });
    }
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(product);
  });
});

// Add to cart
app.post('/api/cart', authenticateToken, (req, res) => {
  const { productId, quantity = 1 } = req.body;
  const userId = req.user.userId;

  // Check if item already in cart
  db.get(
    `SELECT * FROM cart WHERE user_id = ? AND product_id = ?`,
    [userId, productId],
    (err, existingItem) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to add to cart' });
      }

      if (existingItem) {
        // Update quantity
        db.run(
          `UPDATE cart SET quantity = quantity + ? WHERE user_id = ? AND product_id = ?`,
          [quantity, userId, productId],
          (err) => {
            if (err) {
              return res.status(500).json({ error: 'Failed to update cart' });
            }
            res.json({ message: 'Cart updated successfully' });
          }
        );
      } else {
        // Add new item
        db.run(
          `INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)`,
          [userId, productId, quantity],
          (err) => {
            if (err) {
              return res.status(500).json({ error: 'Failed to add to cart' });
            }
            res.status(201).json({ message: 'Item added to cart successfully' });
          }
        );
      }
    }
  );
});

// Get cart items
app.get('/api/cart', authenticateToken, (req, res) => {
  const userId = req.user.userId;

  db.all(
    `SELECT c.*, p.name, p.price, p.image_url, p.brand 
     FROM cart c 
     JOIN products p ON c.product_id = p.id 
     WHERE c.user_id = ?`,
    [userId],
    (err, cartItems) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch cart' });
      }
      res.json(cartItems);
    }
  );
});

// Newsletter subscription
app.post('/api/newsletter', (req, res) => {
  const { email, name } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  db.run(
    `INSERT INTO newsletter_subscriptions (email, name) VALUES (?, ?)`,
    [email, name || ''],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Email already subscribed' });
        }
        return res.status(500).json({ error: 'Subscription failed' });
      }
      res.status(201).json({ message: 'Successfully subscribed to newsletter' });
    }
  );
});

// Create order
app.post('/api/orders', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const { shippingAddress, paymentMethod } = req.body;
  const orderNumber = 'CW' + Date.now();

  // Get cart items first
  db.all(
    `SELECT c.*, p.price FROM cart c JOIN products p ON c.product_id = p.id WHERE c.user_id = ?`,
    [userId],
    (err, cartItems) => {
      if (err || cartItems.length === 0) {
        return res.status(400).json({ error: 'Cart is empty or invalid' });
      }

      // Calculate total
      const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      // Create order
      db.run(
        `INSERT INTO orders (user_id, order_number, total_amount, shipping_address, status) VALUES (?, ?, ?, ?, 'confirmed')`,
        [userId, orderNumber, totalAmount, shippingAddress],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to create order' });
          }

          const orderId = this.lastID;

          // Add order items
          const stmt = db.prepare(`INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)`);
          
          cartItems.forEach(item => {
            stmt.run(orderId, item.product_id, item.quantity, item.price);
          });
          
          stmt.finalize();

          // Clear cart
          db.run(`DELETE FROM cart WHERE user_id = ?`, [userId], (err) => {
            if (err) {
              console.error('Failed to clear cart:', err);
            }
          });

          res.status(201).json({ 
            message: 'Order created successfully', 
            orderNumber,
            orderId,
            totalAmount 
          });
        }
      );
    }
  );
});

// Get user orders
app.get('/api/orders', authenticateToken, (req, res) => {
  const userId = req.user.userId;

  db.all(
    `SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC`,
    [userId],
    (err, orders) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch orders' });
      }
      res.json(orders);
    }
  );
});

// Default route - serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Crown Watch server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to view the website`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed');
    }
    process.exit(0);
  });
});