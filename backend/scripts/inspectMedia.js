const mongoose = require('mongoose');
const path = require('path');

// Load environment from project root .env if present
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/afk_productions';

(async function main() {
    try {
        await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('Connected to', MONGO_URI);

        const Media = require(path.join(__dirname, '..', 'models', 'media'));

        const count = await Media.countDocuments();
        console.log('Media count:', count);

        if (count > 0) {
            const docs = await Media.find().limit(20).lean();
            console.log('Sample documents:');
            console.log(JSON.stringify(docs, null, 2));
        }

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('Error:', err && err.message ? err.message : err);
        process.exit(1);
    }
})();
