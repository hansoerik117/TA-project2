
const mysql = require('mysql2/promise');
const validator = require('validator');
const argon = require('argon2');

// @desc Page for creating user account
// @route GET /signup
// @access public

const signupPage = (req, res) => {
    res.render('signup', { notice: 'Ootan andmeid!' });
};

// @desc Process signup form
// @route POST /signup
// @access public

const signupPagePost = async (req, res) => {
    let conn;
    let notice = '';

    // Puhastame andmeid ja valideerime
    const firstName = validator.escape((req.body.firstNameInput || '').trim());
    const lastName = validator.escape((req.body.lastNameInput || '').trim());
    const birthDate = req.body.birthDateInput;
    const gender = req.body.genderInput;
    const email = (req.body.emailInput || '').trim();
    const password = req.body.passwordInput;
    const confirmPassword = req.body.confirmPasswordInput;

    // Kontrollime, kas kõik on olemas
    if (!firstName || !lastName || !birthDate || !gender || !email || !password || !confirmPassword) {
        notice = 'Andmed on puudu!';
        return res.render('signup', { notice });
    }

    // Kas e-mail on korrektne
    if (!validator.isEmail(email)) {
        notice = 'Meiliaadress pole korrektne!';
        return res.render('signup', { notice });
    }

    // Kas sünnipäev on korrektne
    if (!validator.isDate(birthDate) || validator.isAfter(birthDate)) {
        notice = 'Sisestatud sünnikuupäev pole korrektne!';
        return res.render('signup', { notice });
    }

    // Kas parool on piisavalt tugev
    const passwordOptions = {
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1
    };

    if (!validator.isStrongPassword(password, passwordOptions)) {
        notice = 'Sisestatud parool pole korrektne!';
        return res.render('signup', { notice });
    }

    // Kontrollime, kas paroolid kattuvad
    if (password !== confirmPassword) {
        notice = 'Sisestatud paroolid ei kattu!';
        return res.render('signup', { notice });
    }

    try {
        conn = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME
        });

        // Kontrollime, kas kasutaja on juba olemas
        let sqlReq = 'SELECT id FROM users WHERE email = ?';
        const [users] = await conn.execute(sqlReq, [email]);

        if (users.length > 0) {
            notice = 'Selline kasutaja on juba olemas!';
            return res.render('signup', { notice });
        }

        // Krüpteerime parooli
        const pwdHash = await argon.hash(password);

        // Salvestame kasutaja andmebaasi
        sqlReq = `INSERT INTO users
            (firstname, lastname, birthdate, gender, email, password)
            VALUES (?, ?, ?, ?, ?, ?)`;

        const [result] = await conn.execute(sqlReq, [
            firstName,
            lastName,
            birthDate,
            gender,
            email,
            pwdHash
        ]);

        notice = 'Loodi kasutaja!';
        res.render('signup', { notice });

    } catch (err) {
        console.log('Viga: ' + err);
        notice = 'Kasutaja loomisel tekkis viga!';
        res.render('signup', { notice });

    } finally {
        if (conn) {
            await conn.end();
        }
    }
};

module.exports = {
    signupPage,
    signupPagePost
};
