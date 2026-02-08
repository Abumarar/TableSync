const db = require('../config/database');

async function updatePassword() {
    const newHash = '$2b$10$GtiX4jATzsZiaUdFnWm1l.3oYtpDsHtlxKBCaHObWsvwVtb6Bgw1K';
    try {
        await db.query('UPDATE users SET password_hash = $1 WHERE username = $2', [newHash, 'admin']);
        console.log('Password updated successfully');
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

updatePassword();
