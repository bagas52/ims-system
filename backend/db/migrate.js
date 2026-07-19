const { pool } = require('./index');
const bcrypt = require('bcryptjs');

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Drop old tables with CASCADE to handle foreign keys
    console.log('Dropping existing tables...');
    await client.query('DROP TABLE IF EXISTS activity_logs CASCADE;');
    await client.query('DROP TABLE IF EXISTS items CASCADE;');
    await client.query('DROP TABLE IF EXISTS users CASCADE;');

    console.log('Creating users table...');
    await client.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        nama VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role VARCHAR(20) DEFAULT 'Staff' CHECK (role IN ('Admin', 'Manager', 'Staff')),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('Creating items table...');
    await client.query(`
      CREATE TABLE items (
        id SERIAL PRIMARY KEY,
        nama VARCHAR(200) NOT NULL,
        kategori VARCHAR(100),
        deskripsi TEXT,
        harga DECIMAL(15,2) DEFAULT 0,
        stok INTEGER DEFAULT 0,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('Creating activity_logs table...');
    await client.query(`
      CREATE TABLE activity_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        action VARCHAR(100) NOT NULL,
        target_table VARCHAR(50),
        target_id INTEGER,
        detail TEXT,
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('Seeding initial admin user...');
    const adminHash = await bcrypt.hash('admin123', 10);
    const adminResult = await client.query(
      'INSERT INTO users (nama, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id;',
      ['Administrator', 'admin@ims.com', adminHash, 'Admin']
    );
    const adminId = adminResult.rows[0].id;

    console.log('Seeding sample users...');
    const managerHash = await bcrypt.hash('manager123', 10);
    const staffHash = await bcrypt.hash('staff123', 10);

    await client.query(
      'INSERT INTO users (nama, email, password, role) VALUES ($1, $2, $3, $4);',
      ['Budi Manager', 'manager@ims.com', managerHash, 'Manager']
    );
    await client.query(
      'INSERT INTO users (nama, email, password, role) VALUES ($1, $2, $3, $4);',
      ['Sari Staff', 'staff1@ims.com', staffHash, 'Staff']
    );
    await client.query(
      'INSERT INTO users (nama, email, password, role) VALUES ($1, $2, $3, $4);',
      ['Dian Staff', 'staff2@ims.com', staffHash, 'Staff']
    );

    console.log('Seeding 8 sample items...');
    const sampleItems = [
      ['Laptop Pro X1', 'Elektronik', 'Laptop performa tinggi untuk profesional', 18500000, 15],
      ['Mouse Wireless Ergo', 'Peralatan', 'Mouse ergonomis anti-fatigue', 350000, 80],
      ['Keyboard Mechanical RGB', 'Peralatan', 'Keyboard gaming dengan backlight RGB', 1200000, 45],
      ['Monitor 27" 4K IPS', 'Elektronik', 'Monitor Ultra HD dengan panel IPS', 5800000, 12],
      ['Meja Kantor Standing', 'Furniture', 'Meja duduk/berdiri elektrik adjustable', 4200000, 8],
      ['Kursi Ergonomis Mesh', 'Furniture', 'Kursi kantor dengan lumbar support', 3100000, 20],
      ['Headset Noise Cancel', 'Elektronik', 'Headset ANC untuk work from home', 2450000, 35],
      ['Kabel HDMI 2.1 2M', 'Peralatan', 'Kabel HDMI 8K ultra high speed', 185000, 150],
    ];

    for (const [nama, kategori, deskripsi, harga, stok] of sampleItems) {
      await client.query(
        'INSERT INTO items (nama, kategori, deskripsi, harga, stok, created_by) VALUES ($1,$2,$3,$4,$5,$6)',
        [nama, kategori, deskripsi, harga, stok, adminId]
      );
    }

    // Seed some activity logs
    console.log('Seeding activity logs...');
    await client.query(
      'INSERT INTO activity_logs (user_id, action, target_table, detail) VALUES ($1, $2, $3, $4)',
      [adminId, 'LOGIN', 'users', 'Sistem IMS berhasil diinisialisasi.']
    );

    await client.query('COMMIT');
    console.log('');
    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('📋 Demo Credentials:');
    console.log('   Admin   : admin@ims.com     / admin123');
    console.log('   Manager : manager@ims.com   / manager123');
    console.log('   Staff   : staff1@ims.com    / staff123');
    console.log('');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

migrate();
